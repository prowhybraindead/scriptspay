import { Injectable, Logger } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";

@Injectable()
export class PaymentService {
  private readonly logger = new Logger(PaymentService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Creates a Payment Intent (Transaction) for a merchant.
   *
   * @param dto             - Validated DTO containing amount, currency, method, metadata, merchantId, customerId
   * @param idempotencyKey  - Unique key from `Idempotency-Key` header (required by system rules)
   */
  async createPaymentIntent(
    dto: {
      amount: number;
      currency: string;
      method: string;
      metadata?: Record<string, unknown>;
      merchantId: string;
      customerId?: string;
    },
    idempotencyKey: string,
  ): Promise<void> {
    // ──────────────────────────────────────────────────────────────────
    // STEP 1: REDIS IDEMPOTENCY CHECK
    // ──────────────────────────────────────────────────────────────────
    // TODO: Check Upstash Redis for existing `idempotencyKey`.
    //   - Key format: `idempotency:{idempotencyKey}`
    //   - If key exists, return the cached response (prevent duplicate charges).
    //   - If key does not exist, proceed and store result with TTL = 24h.
    // ──────────────────────────────────────────────────────────────────

    // ──────────────────────────────────────────────────────────────────
    // STEP 2: MAGIC TEST DATA — MOCK LOGIC (from AI.md §3)
    // ──────────────────────────────────────────────────────────────────
    // TODO: Evaluate `dto.amount` to determine mock outcome:
    //   - amount === 10000  → Success instantly. Set status = SUCCEEDED.
    //   - amount === 40000  → Fail with `insufficient_funds`. Set status = FAILED.
    //   - amount === 50408  → Set status = PENDING, trigger a 30-second delayed
    //                          webhook via BullMQ (delayed job).
    //   - All other amounts → Default to SUCCEEDED for sandbox.
    // ──────────────────────────────────────────────────────────────────

    // ──────────────────────────────────────────────────────────────────
    // STEP 3: CREATE TRANSACTION RECORD
    // ──────────────────────────────────────────────────────────────────
    // TODO: Insert into `Transaction` table via Prisma.
    //   - Set idempotencyKey on the record.
    //   - After creation, call LedgerService.recordDoubleEntry() for
    //     the corresponding debit/credit entries.
    // ──────────────────────────────────────────────────────────────────

    // ──────────────────────────────────────────────────────────────────
    // STEP 4: DISPATCH WEBHOOK
    // ──────────────────────────────────────────────────────────────────
    // TODO: Call WebhookService.dispatchWebhook() with the appropriate
    //   event type (`succeeded`, `failed`, `refunded`).
    // ──────────────────────────────────────────────────────────────────

    // ──────────────────────────────────────────────────────────────────
    // STEP 5: CACHE RESULT IN REDIS
    // ──────────────────────────────────────────────────────────────────
    // TODO: Store the created transaction response in Redis under the
    //   idempotency key with TTL = 24h.
    // ──────────────────────────────────────────────────────────────────

    this.logger.log(
      `createPaymentIntent called with idempotencyKey=${idempotencyKey}`,
    );
  }
}
