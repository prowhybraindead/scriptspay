import { Module } from "@nestjs/common";
import { BullModule } from "@nestjs/bullmq";
import { PaymentController } from "./payment.controller";
import { PaymentService } from "./payment.service";
import { AuthModule } from "../auth/auth.module";
import { LedgerModule } from "../ledger/ledger.module";
import { WebhookModule } from "../webhook/webhook.module";

@Module({
  imports: [
    AuthModule,
    LedgerModule,
    WebhookModule,
    BullModule.registerQueue({ name: "webhook-delivery" }),
  ],
  controllers: [PaymentController],
  providers: [PaymentService],
  exports: [PaymentService],
})
export class PaymentModule {}
