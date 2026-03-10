import {
  Controller,
  Post,
  Body,
  Headers,
  HttpCode,
  HttpStatus,
  BadRequestException,
  UseGuards,
} from "@nestjs/common";
import { ApiTags, ApiOperation, ApiBearerAuth } from "@nestjs/swagger";
import { PaymentService } from "./payment.service";
import { SupabaseAuthGuard } from "../auth/auth.guard";

@ApiTags("Payments")
@ApiBearerAuth()
@Controller("v1/payment-intents")
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @UseGuards(SupabaseAuthGuard)
  @ApiOperation({ summary: "Create a Payment Intent" })
  async createPaymentIntent(
    @Body()
    dto: {
      amount: number;
      currency: string;
      method: string;
      metadata?: Record<string, unknown>;
      merchantId: string;
      customerId?: string;
    },
    @Headers("idempotency-key") idempotencyKey: string,
  ) {
    if (!idempotencyKey) {
      throw new BadRequestException(
        "Idempotency-Key header is required for all payment mutations.",
      );
    }

    return this.paymentService.createPaymentIntent(dto, idempotencyKey);
  }
}
