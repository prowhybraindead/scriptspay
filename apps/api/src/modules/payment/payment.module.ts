import { Module } from "@nestjs/common";
import { BullModule } from "@nestjs/bullmq";
import { PaymentController } from "./payment.controller";
import { PaymentService } from "./payment.service";
import { AuthModule } from "../auth/auth.module";
import { LedgerModule } from "../ledger/ledger.module";
import { WebhookModule } from "../webhook/webhook.module";
import { MerchantModule } from "../merchant/merchant.module";
import { CheckoutController } from "./checkout.controller";
import { CheckoutCompatController } from "./checkout-compat.controller";

@Module({
  imports: [
    AuthModule,
    LedgerModule,
    WebhookModule,
    MerchantModule,
    BullModule.registerQueue({ name: "webhook-delivery" }),
  ],
  controllers: [PaymentController, CheckoutController, CheckoutCompatController],
  providers: [PaymentService],
  exports: [PaymentService],
})
export class PaymentModule {}
