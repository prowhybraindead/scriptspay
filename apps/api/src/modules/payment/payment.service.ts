import {
  Injectable,
  Logger,
  ConflictException,
  BadRequestException,
} from "@nestjs/common";
import { Inject } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { LedgerService } from "../ledger/ledger.service";
import { WebhookService } from "../webhook/webhook.service";
import { REDIS_CLIENT } from "../../common/redis/redis.module";
import { InjectQueue } from "@nestjs/bullmq";
import { Queue } from "bullmq";
import Redis from "ioredis";
import {
  Prisma,
  Currency,
  TxStatus,
  PaymentMethod,
  Transaction,
} from "@prisma/client";

// ── System "house" account for sandbox double-entry ──────────────────
// In a real system this would be a configurable platform account.
// For the sandbox, we use a deterministic UUID that represents the
// Scripts_ platform's internal account (the "other side" of every txn).
const SYSTEM_ACCOUNT_ID = "00000000-0000-0000-0000-000000000000";
const SYSTEM_ACCOUNT_EMAIL = "system@scripts.local";

// ── Redis TTL for idempotency cache (24 hours in seconds) ────────────
const IDEMPOTENCY_TTL = 60 * 60 * 24;

export interface CreatePaymentIntentDto {
  amount: number;
  currency: Currency;
  method: PaymentMethod;
  metadata?: Record<string, unknown>;
  merchantId: string;
  customerId?: string;
}

@Injectable()
export class PaymentService {
  private readonly logger = new Logger(PaymentService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly ledgerService: LedgerService,
    private readonly webhookService: WebhookService,
    @Inject(REDIS_CLIENT) private readonly redis: Redis,
    @InjectQueue("webhook-delivery") private readonly webhookQueue: Queue,
  ) {}

  // ════════════════════════════════════════════════════════════════════
  // createPaymentIntent
  // ════════════════════════════════════════════════════════════════════

  async createPaymentIntent(
    dto: CreatePaymentIntentDto,
    idempotencyKey: string,
  ): Promise<Transaction> {
    const redisKey = `idempotency:${dto.merchantId}:${idempotencyKey}`;

    // ── STEP 1: IDEMPOTENCY BARRIER (Redis) ──────────────────────────
    // If a previous request with the same key already succeeded, return
    // the cached response immediately — no DB writes, no ledger, no
    // duplicate charges.
    const cached = await this.redis.get(redisKey);
    if (cached) {
      this.logger.log(`Idempotency hit: ${redisKey}`);
      return JSON.parse(cached) as Transaction;
    }

    // ── STEP 2: MAGIC TEST DATA — determine mock outcome ─────────────
    const status = this.resolveTransactionStatus(dto.amount);

    // ── STEP 3: CREATE TRANSACTION RECORD ────────────────────────────
    const transaction = await this.prisma.transaction.create({
      data: {
        amount: new Prisma.Decimal(dto.amount),
        currency: dto.currency,
        status,
        method: dto.method,
        idempotencyKey,
        metadata: dto.metadata
          ? (dto.metadata as Prisma.InputJsonValue)
          : Prisma.JsonNull,
        merchantId: dto.merchantId,
        customerId: dto.customerId ?? null,
      },
    });

    // ── STEP 4: LEDGER + WEBHOOK per status ──────────────────────────
    switch (status) {
      case "SUCCEEDED":
        await this.handleSuccess(transaction);
        break;

      case "FAILED":
        await this.handleFailure(transaction);
        break;

      case "PENDING":
        await this.handleTimeout(transaction);
        break;
    }

    // ── STEP 5: CACHE RESULT IN REDIS (TTL 24 h) ────────────────────
    await this.redis.set(redisKey, JSON.stringify(transaction), "EX", IDEMPOTENCY_TTL);

    this.logger.log(
      `Payment intent created: id=${transaction.id} status=${status} amount=${dto.amount} ${dto.currency}`,
    );

    return transaction;
  }

  // ════════════════════════════════════════════════════════════════════
  // PRIVATE — Magic Test Data resolver
  // ════════════════════════════════════════════════════════════════════

  private resolveTransactionStatus(amount: number): TxStatus {
    // Magic Test Data:
    //   10000 → instant success
    //   40000 → insufficient_funds failure
    //   50408 → 30-second bank timeout (stays PENDING)
    //   other → default success for sandbox
    switch (amount) {
      case 10000:
        return "SUCCEEDED";
      case 40000:
        return "FAILED";
      case 50408:
        return "PENDING";
      default:
        return "SUCCEEDED";
    }
  }

  private async ensureSystemAccount(): Promise<void> {
    await this.prisma.user.upsert({
      where: { id: SYSTEM_ACCOUNT_ID },
      update: {
        email: SYSTEM_ACCOUNT_EMAIL,
      },
      create: {
        id: SYSTEM_ACCOUNT_ID,
        email: SYSTEM_ACCOUNT_EMAIL,
        role: "ADMIN",
      },
    });
  }

  // ════════════════════════════════════════════════════════════════════
  // PRIVATE — Status-specific side-effect handlers
  // ════════════════════════════════════════════════════════════════════

  /**
   * amount === 10000 (or default):
   * 1. Record double-entry: CREDIT merchant, DEBIT system account.
   * 2. Dispatch `payment_intent.succeeded` webhook immediately.
   */
  private async handleSuccess(tx: Transaction): Promise<void> {
    // Credit the merchant's User account, debit the platform house account.
    // The merchantId on Transaction points to MerchantProfile — we need
    // the underlying User id. Fetch it once.
    const merchant = await this.prisma.merchantProfile.findUniqueOrThrow({
      where: { id: tx.merchantId },
      select: { userId: true },
    });

    await this.ensureSystemAccount();

    await this.ledgerService.recordDoubleEntry(
      merchant.userId,       // credit (money IN for merchant)
      SYSTEM_ACCOUNT_ID,     // debit  (money OUT from platform)
      tx.amount,
      tx.currency,
      tx.id,
      `Payment succeeded: ${tx.id}`,
    );

    await this.webhookService.dispatchWebhook(
      tx.merchantId,
      "payment_intent.succeeded",
      this.buildWebhookPayload(tx),
    );
  }

  /**
   * amount === 40000:
   * NO ledger entries — funds never moved.
   * Dispatch `payment_intent.failed` webhook.
   */
  private async handleFailure(tx: Transaction): Promise<void> {
    await this.webhookService.dispatchWebhook(
      tx.merchantId,
      "payment_intent.failed",
      {
        ...this.buildWebhookPayload(tx),
        failure_reason: "insufficient_funds",
      },
    );
  }

  /**
   * amount === 50408:
   * Transaction stays PENDING. Enqueue a DELAYED job (30 s) that will
   * randomly resolve as succeeded or failed — stress-tests the merchant's
   * webhook retry handling.
   */
  private async handleTimeout(tx: Transaction): Promise<void> {
    await this.webhookQueue.add(
      "delayed-resolution",
      {
        transactionId: tx.id,
        merchantId: tx.merchantId,
      },
      {
        delay: 30_000, // 30-second simulated bank timeout
        attempts: 1,   // single attempt — this is the resolution itself
      },
    );

    this.logger.log(
      `Enqueued delayed resolution for tx=${tx.id} (30 s delay)`,
    );
  }

  // ════════════════════════════════════════════════════════════════════
  // PRIVATE — Webhook payload builder
  // ════════════════════════════════════════════════════════════════════

  private buildWebhookPayload(tx: Transaction): Record<string, unknown> {
    return {
      id: tx.id,
      object: "payment_intent",
      amount: tx.amount.toString(),
      currency: tx.currency,
      status: tx.status,
      method: tx.method,
      metadata: tx.metadata,
      merchant_id: tx.merchantId,
      customer_id: tx.customerId,
      created_at: tx.createdAt.toISOString(),
    };
  }
}
