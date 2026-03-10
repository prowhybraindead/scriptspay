import { Processor, WorkerHost } from "@nestjs/bullmq";
import { InjectQueue } from "@nestjs/bullmq";
import { Logger } from "@nestjs/common";
import { Job, Queue } from "bullmq";
import { createHmac } from "crypto";
import { PrismaService } from "../../prisma/prisma.service";
import type {
  WebhookDeliverJobData,
  DelayedResolutionJobData,
} from "./webhook.service";

// ── Timeout for outbound HTTP requests (10 seconds) ──────────────────
const DELIVERY_TIMEOUT_MS = 10_000;

/**
 * BullMQ Worker for the `webhook-delivery` queue.
 *
 * Handles two job names:
 *   - "deliver"             → POST the signed payload to the merchant's URL.
 *   - "delayed-resolution"  → Resolve a PENDING transaction after the
 *                              simulated 30-second bank timeout (amount 50408).
 *
 * Retry policy (set at enqueue time by WebhookService):
 *   attempts: 5
 *   backoff:  exponential, base = 2 000 ms
 *   Timeline: ~2 s → ~4 s → ~8 s → ~16 s → ~32 s  (≈ 62 s total)
 */
@Processor("webhook-delivery")
export class WebhookProcessor extends WorkerHost {
  private readonly logger = new Logger(WebhookProcessor.name);

  constructor(
    private readonly prisma: PrismaService,
    @InjectQueue("webhook-delivery") private readonly webhookQueue: Queue,
  ) {
    super();
  }

  async process(
    job: Job<WebhookDeliverJobData | DelayedResolutionJobData>,
  ): Promise<void> {
    switch (job.name) {
      case "deliver":
        await this.handleDeliver(job as Job<WebhookDeliverJobData>);
        break;

      case "delayed-resolution":
        await this.handleDelayedResolution(
          job as Job<DelayedResolutionJobData>,
        );
        break;

      default:
        this.logger.warn(`Unknown job name: ${job.name} — skipping`);
    }
  }

  // ════════════════════════════════════════════════════════════════════
  // JOB: deliver — Sign + POST webhook to merchant endpoint
  // ════════════════════════════════════════════════════════════════════

  private async handleDeliver(job: Job<WebhookDeliverJobData>): Promise<void> {
    const { url, secret, eventType, payload } = job.data;
    const attemptNum = job.attemptsMade + 1;

    this.logger.log(
      `Delivering webhook (attempt ${attemptNum}/5): ${url} [${eventType}]`,
    );

    // ── Build Stripe-like HMAC-SHA256 signature ──────────────────────
    //
    // Format: Scripts-Signature: t=<unix_ms>,v1=<hex_hmac>
    //
    // The merchant verifies by:
    //   1. Extracting `t` and `v1` from the header.
    //   2. Recomputing HMAC-SHA256(`${t}.${JSON.stringify(body)}`, secret).
    //   3. Comparing the result to `v1` (constant-time compare).
    //   4. Rejecting if `t` is too far in the past (replay protection).
    const t = Date.now();
    const bodyString = JSON.stringify({ event: eventType, data: payload });
    const signedPayload = `${t}.${bodyString}`;

    const signature = createHmac("sha256", secret)
      .update(signedPayload)
      .digest("hex");

    const scriptsSignature = `t=${t},v1=${signature}`;

    // ── POST to the merchant's endpoint ──────────────────────────────
    const controller = new AbortController();
    const timeout = setTimeout(
      () => controller.abort(),
      DELIVERY_TIMEOUT_MS,
    );

    try {
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Scripts-Signature": scriptsSignature,
        },
        body: bodyString,
        signal: controller.signal,
      });

      if (!response.ok) {
        // Non-2xx → throw to trigger BullMQ exponential backoff retry
        throw new Error(
          `Webhook delivery failed: ${url} responded with HTTP ${response.status}`,
        );
      }

      this.logger.log(
        `Webhook delivered successfully: ${url} [${eventType}] → HTTP ${response.status}`,
      );
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Unknown delivery error";
      this.logger.error(
        `Webhook delivery error (attempt ${attemptNum}/5): ${url} — ${message}`,
      );
      // Re-throw so BullMQ triggers the next retry with exponential backoff
      throw err;
    } finally {
      clearTimeout(timeout);
    }
  }

  // ════════════════════════════════════════════════════════════════════
  // JOB: delayed-resolution — Resolve PENDING tx after 30 s timeout
  // ════════════════════════════════════════════════════════════════════
  //
  // Simulates the bank finally responding after a timeout (amount 50408).
  // Randomly succeeds (70 %) or fails (30 %) to stress-test the merchant's
  // webhook consumption and retry handling.
  // ════════════════════════════════════════════════════════════════════

  private async handleDelayedResolution(
    job: Job<DelayedResolutionJobData>,
  ): Promise<void> {
    const { transactionId, merchantId } = job.data;
    const succeeded = Math.random() < 0.7;
    const finalStatus = succeeded ? "SUCCEEDED" : "FAILED";

    this.logger.log(
      `Delayed resolution for tx=${transactionId}: resolving as ${finalStatus}`,
    );

    // Update the Transaction status in the database
    await this.prisma.transaction.update({
      where: { id: transactionId },
      data: { status: finalStatus },
    });

    // Fetch merchant's active webhook endpoints and enqueue delivery
    const endpoints = await this.prisma.webhookEndpoint.findMany({
      where: { merchantId, isActive: true },
    });

    const tx = await this.prisma.transaction.findUniqueOrThrow({
      where: { id: transactionId },
    });

    const webhookPayload: Record<string, unknown> = {
      id: tx.id,
      object: "payment_intent",
      amount: tx.amount.toString(),
      currency: tx.currency,
      status: finalStatus,
      method: tx.method,
      metadata: tx.metadata,
      merchant_id: merchantId,
      customer_id: tx.customerId,
      created_at: tx.createdAt.toISOString(),
    };

    const eventType = succeeded
      ? "payment_intent.succeeded"
      : "payment_intent.failed";

    for (const endpoint of endpoints) {
      const jobData: WebhookDeliverJobData = {
        url: endpoint.url,
        secret: endpoint.secret,
        eventType,
        payload: succeeded
          ? webhookPayload
          : { ...webhookPayload, failure_reason: "bank_timeout" },
      };

      // Enqueue normal delivery jobs — these get the standard retry policy
      await this.webhookQueue.add("deliver", jobData, {
        attempts: 5,
        backoff: { type: "exponential", delay: 2_000 },
        removeOnComplete: { count: 500 },
        removeOnFail: { count: 1000 },
      });
    }

    this.logger.log(
      `Delayed resolution complete: tx=${transactionId} status=${finalStatus}, ${endpoints.length} webhook(s) enqueued`,
    );
  }
}
