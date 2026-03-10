import { Processor, WorkerHost } from "@nestjs/bullmq";
import { Logger } from "@nestjs/common";
import { Job } from "bullmq";

interface WebhookJobData {
  url: string;
  secret: string;
  eventType: string;
  payload: Record<string, unknown>;
}

/**
 * BullMQ Worker that processes webhook delivery jobs.
 *
 * Retry policy (configured at enqueue time):
 *   - attempts: 5
 *   - backoff: exponential, starting at 5 000 ms
 *     → Retries at ~5s, ~10s, ~20s, ~40s, ~80s
 */
@Processor("webhook-delivery")
export class WebhookProcessor extends WorkerHost {
  private readonly logger = new Logger(WebhookProcessor.name);

  /**
   * Processes a single webhook delivery job.
   *
   * Steps:
   * 1. Compute HMAC-SHA256 signature:
   *    - const signature = crypto
   *        .createHmac('sha256', job.data.secret)
   *        .update(JSON.stringify(job.data.payload))
   *        .digest('hex');
   *
   * 2. POST to the endpoint URL:
   *    - Headers: { 'Content-Type': 'application/json', 'Scripts-Signature': signature }
   *    - Body: JSON.stringify(job.data.payload)
   *
   * 3. If the endpoint responds with a non-2xx status, throw an error
   *    to trigger BullMQ's exponential backoff retry.
   *
   * 4. Log delivery success or failure for observability.
   */
  async process(job: Job<WebhookJobData>): Promise<void> {
    this.logger.log(
      `Processing webhook job ${job.id} → ${job.data.url} [${job.data.eventType}]`,
    );

    // TODO: Implement HMAC-SHA256 signing + HTTP POST delivery
    // On failure, throw to let BullMQ handle exponential backoff retries.
  }
}
