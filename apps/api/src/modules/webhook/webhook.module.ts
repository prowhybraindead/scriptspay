import { Module } from "@nestjs/common";
import { BullModule } from "@nestjs/bullmq";
import { WebhookService } from "./webhook.service";
import { WebhookProcessor } from "./webhook.processor";
import { WebhookController } from "./webhook.controller";
import { MerchantModule } from "../merchant/merchant.module";

@Module({
  imports: [
    MerchantModule,
    BullModule.registerQueue({ name: "webhook-delivery" }),
  ],
  controllers: [WebhookController],
  providers: [WebhookService, WebhookProcessor],
  exports: [WebhookService],
})
export class WebhookModule {}
