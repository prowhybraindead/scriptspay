import {
  Controller,
  Post,
  Body,
  Headers,
  Req,
  HttpCode,
  HttpStatus,
  BadRequestException,
  UseGuards,
} from "@nestjs/common";
import { ApiTags, ApiOperation, ApiBearerAuth, ApiHeader } from "@nestjs/swagger";
import { PaymentService, CreatePaymentIntentDto } from "./payment.service";
import { SupabaseAuthGuard } from "../auth/auth.guard";
import { Request } from "express";
import { Currency, PaymentMethod } from "@prisma/client";

// Extend Express Request to include the user injected by Passport
interface AuthenticatedRequest extends Request {
  user: { userId: string; email: string; role: string };
}

@ApiTags("Payments")
@ApiBearerAuth()
@Controller("v1/payment-intents")
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @UseGuards(SupabaseAuthGuard)
  @ApiOperation({ summary: "Create a Payment Intent" })
  @ApiHeader({
    name: "Idempotency-Key",
    required: true,
    description: "Unique key to prevent duplicate charges (required for all payment mutations).",
  })
  async createPaymentIntent(
    @Body()
    body: {
      amount: number;
      currency: Currency;
      method: PaymentMethod;
      metadata?: Record<string, unknown>;
      merchantId: string;
      customerId?: string;
    },
    @Headers("idempotency-key") idempotencyKey: string,
    @Req() req: AuthenticatedRequest,
  ) {
    if (!idempotencyKey) {
      throw new BadRequestException(
        "Idempotency-Key header is required for all payment mutations.",
      );
    }

    if (!body.amount || body.amount <= 0) {
      throw new BadRequestException("Amount must be a positive number.");
    }

    const dto: CreatePaymentIntentDto = {
      amount: body.amount,
      currency: body.currency,
      method: body.method,
      metadata: body.metadata,
      merchantId: body.merchantId,
      customerId: body.customerId ?? req.user.userId,
    };

    return this.paymentService.createPaymentIntent(dto, idempotencyKey);
  }
}
