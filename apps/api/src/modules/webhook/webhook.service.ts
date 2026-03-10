import { Injectable, Logger } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { InjectQueue } from "@nestjs/bullmq";
import { Queue } from "bullmq";

@Injectable()
export class WebhookService {
  private readonly logger = new Logger(WebhookService.name);

  constructor(
    private readonly prisma: PrismaService,
    @InjectQueue("webhook-delivery") private readonly webhookQueue: Queue,
  ) {}

  /**
   * Dispatches a webhook event to all active endpoints for the given merchant.
   *
   * @param merchantId - The merchant UUID whose endpoints should be notified
   * @param eventType  - Event name: 'succeeded' | 'failed' | 'refunded'
   * @param payload    - The JSON payload to deliver
   */
  async dispatchWebhook(
    merchantId: string,
    eventType: string,
    payload: Record<string, unknown>,
  ): Promise<void> {
    // ──────────────────────────────────────────────────────────────────
    // WEBHOOK DISPATCH LOGIC
    // ──────────────────────────────────────────────────────────────────
    // TODO:
    // 1. Fetch all active WebhookEndpoints for the merchantId.
    //    const endpoints = await this.prisma.webhookEndpoint.findMany({
    //      where: { merchantId, isActive: true },
    //    });
    //
    // 2. For each endpoint, enqueue a BullMQ job:
    //    await this.webhookQueue.add('deliver', {
    //      url: endpoint.url,
    //      secret: endpoint.secret,
    //      eventType,
    //      payload,
    //    }, {
    //      attempts: 5,
    //      backoff: { type: 'exponential', delay: 5000 },
    //    });
    //
    // 3. HMAC-SHA256 SIGNING (inside the processor, NOT here):
    //    - Compute: HMAC-SHA256(JSON.stringify(payload), endpoint.secret)
    //    - Attach as `Scripts-Signature` header on the outgoing POST request.
    //    - This ensures the merchant can verify the webhook is authentic.
    // ──────────────────────────────────────────────────────────────────

    this.logger.log(
      `dispatchWebhook called: merchant=${merchantId} event=${eventType}`,
    );
  }
}
