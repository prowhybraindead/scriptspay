import { Injectable, Logger } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { InjectQueue } from "@nestjs/bullmq";
import { Queue } from "bullmq";
import { MerchantService } from "../merchant/merchant.service";

export interface WebhookDeliverJobData {
  url: string;
  secret: string;
  eventType: string;
  payload: Record<string, unknown>;
}

export interface DelayedResolutionJobData {
  transactionId: string;
  merchantId: string;
}

@Injectable()
export class WebhookService {
  private readonly logger = new Logger(WebhookService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly merchantService: MerchantService,
    @InjectQueue("webhook-delivery") private readonly webhookQueue: Queue,
  ) {}

  async listEndpoints(userId: string, email: string) {
    const profile = await this.merchantService.ensureMerchantProfile(userId, email);

    return this.prisma.webhookEndpoint.findMany({
      where: { merchantId: profile.id },
      orderBy: { createdAt: "desc" },
    });
  }

  async createEndpoint(userId: string, email: string, url: string) {
    const profile = await this.merchantService.ensureMerchantProfile(userId, email);

    return this.prisma.webhookEndpoint.create({
      data: {
        merchantId: profile.id,
        url,
        secret: this.merchantService.buildWebhookSecret(),
      },
    });
  }

  async deleteEndpoint(userId: string, email: string, endpointId: string) {
    const profile = await this.merchantService.ensureMerchantProfile(userId, email);

    await this.prisma.webhookEndpoint.deleteMany({
      where: {
        id: endpointId,
        merchantId: profile.id,
      },
    });

    return { success: true };
  }

  /**
   * Dispatches a webhook event to ALL active endpoints for the given merchant.
   *
   * @param merchantId - The merchant UUID whose endpoints should be notified
   * @param eventType  - Event name, e.g. 'payment_intent.succeeded'
   * @param payload    - The JSON payload to deliver
   */
  async dispatchWebhook(
    merchantId: string,
    eventType: string,
    payload: Record<string, unknown>,
  ): Promise<void> {
    // ── Fetch all active endpoints for this merchant ─────────────────
    const endpoints = await this.prisma.webhookEndpoint.findMany({
      where: { merchantId, isActive: true },
    });

    if (endpoints.length === 0) {
      this.logger.warn(
        `No active webhook endpoints for merchant ${merchantId} — skipping dispatch for [${eventType}]`,
      );
      return;
    }

    // ── Enqueue one delivery job per endpoint ────────────────────────
    // HMAC signing happens in the processor, NOT here — the secret is
    // passed as job data so the processor can sign at delivery time.
    for (const endpoint of endpoints) {
      const jobData: WebhookDeliverJobData = {
        url: endpoint.url,
        secret: endpoint.secret,
        eventType,
        payload,
      };

      await this.webhookQueue.add("deliver", jobData, {
        attempts: 5,
        backoff: { type: "exponential", delay: 2_000 },
        // Retry timeline: ~2 s → ~4 s → ~8 s → ~16 s → ~32 s
        // Total window ≈ 62 seconds before the job is marked as failed.
        removeOnComplete: { count: 500 },  // keep last 500 for observability
        removeOnFail: { count: 1000 },     // keep last 1000 failed for debugging
      });

      this.logger.log(
        `Enqueued webhook delivery: endpoint=${endpoint.id} url=${endpoint.url} event=${eventType}`,
      );
    }
  }
}
