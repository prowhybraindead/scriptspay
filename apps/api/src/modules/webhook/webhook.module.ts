import { Module } from "@nestjs/common";
import { BullModule } from "@nestjs/bullmq";
import { WebhookService } from "./webhook.service";
import { WebhookProcessor } from "./webhook.processor";

@Module({
  imports: [
    BullModule.registerQueue({ name: "webhook-delivery" }),
  ],
  providers: [WebhookService, WebhookProcessor],
  exports: [WebhookService],
})
export class WebhookModule {}
