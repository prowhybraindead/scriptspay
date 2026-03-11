import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Headers,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Req,
  UseGuards,
} from "@nestjs/common";
import { ApiBearerAuth, ApiHeader, ApiOperation, ApiParam, ApiTags } from "@nestjs/swagger";
import { Currency, PaymentMethod, Transaction, TxStatus } from "@prisma/client";
import { randomUUID } from "crypto";
import { Request } from "express";
import { SupabaseAuthGuard } from "../auth/auth.guard";
import { MerchantService } from "../merchant/merchant.service";
import { CreatePaymentIntentDto, PaymentService } from "./payment.service";

interface AuthenticatedRequest extends Request {
  user: { userId: string; email: string; role: string };
}

type CreateCheckoutBody = {
  amount: number;
  currency?: Currency;
  merchantOrderId?: string;
  description?: string;
  items?: unknown[];
  customer?: Record<string, unknown>;
  redirectUrl?: string;
  webhookUrl?: string;
  metadata?: Record<string, unknown>;
  method?: PaymentMethod;
};

@ApiTags("Checkout")
@ApiBearerAuth()
@ApiHeader({
  name: "x-api-key",
  required: false,
  description:
    "Alternative server-to-server authentication using the merchant secret key (sk_test_...).",
})
@Controller("checkout")
export class CheckoutCompatController {
  constructor(
    private readonly paymentService: PaymentService,
    private readonly merchantService: MerchantService,
  ) {}

  @Post("create")
  @UseGuards(SupabaseAuthGuard)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: "Create a checkout session (compatibility route) using bearer auth or merchant secret key",
  })
  @ApiHeader({
    name: "Idempotency-Key",
    required: false,
    description: "Optional. If omitted, the server derives one from merchantOrderId.",
  })
  async createCheckout(
    @Body() body: CreateCheckoutBody,
    @Headers("idempotency-key") idempotencyKeyHeader: string | undefined,
    @Req() req: AuthenticatedRequest,
  ) {
    if (!body.amount || body.amount <= 0) {
      throw new BadRequestException("Amount must be a positive number.");
    }

    const profile = await this.merchantService.ensureMerchantProfile(
      req.user.userId,
      req.user.email,
    );

    const idempotencyKey =
      idempotencyKeyHeader?.trim() ||
      (body.merchantOrderId
        ? `checkout:${profile.id}:${body.merchantOrderId}`
        : randomUUID());

    const dto: CreatePaymentIntentDto = {
      amount: body.amount,
      currency: body.currency ?? Currency.VND,
      method: body.method ?? PaymentMethod.QR,
      merchantId: profile.id,
      customerId: req.user.userId,
      metadata: {
        merchantOrderId: body.merchantOrderId,
        description: body.description,
        items: body.items,
        customer: body.customer,
        redirectUrl: body.redirectUrl,
        webhookUrl: body.webhookUrl,
        ...(body.metadata ?? {}),
      },
    };

    const tx = await this.paymentService.createPaymentIntent(dto, idempotencyKey);

    const protocol =
      (req.headers["x-forwarded-proto"] as string | undefined)?.split(",")[0] ||
      req.protocol;
    const host = req.get("host");
    const checkoutUrl = `${protocol}://${host}/checkout/${tx.id}`;
    const createdAt = tx.createdAt;
    const expiresAt = new Date(createdAt.getTime() + 30 * 60 * 1000);

    return {
      checkoutId: tx.id,
      checkoutUrl,
      merchantOrderId: body.merchantOrderId ?? null,
      amount: Number(tx.amount.toString()),
      currency: tx.currency,
      status: this.mapCheckoutStatus(tx.status),
      expiresAt: expiresAt.toISOString(),
      createdAt: createdAt.toISOString(),
    };
  }

  @Get(":checkoutId")
  @ApiOperation({
    summary: "Public hosted checkout endpoint for browser redirects",
  })
  @ApiParam({
    name: "checkoutId",
    description: "Checkout session ID returned from /checkout/create",
  })
  async getPublicCheckout(@Param("checkoutId") checkoutId: string) {
    const tx = await this.paymentService.getTransactionById(checkoutId);
    return this.serializePublicCheckout(tx);
  }

  private mapCheckoutStatus(status: TxStatus): string {
    switch (status) {
      case "SUCCEEDED":
        return "completed";
      case "FAILED":
        return "failed";
      case "PENDING":
        return "pending";
      case "REFUNDED":
        return "refunded";
      default:
        return "pending";
    }
  }

  private serializePublicCheckout(tx: Transaction) {
    const metadata =
      tx.metadata && typeof tx.metadata === "object" && !Array.isArray(tx.metadata)
        ? (tx.metadata as Record<string, unknown>)
        : {};

    const normalizedStatus = this.mapCheckoutStatus(tx.status);
    const createdAt = tx.createdAt;
    const expiresAt = new Date(createdAt.getTime() + 30 * 60 * 1000);

    return {
      checkoutId: tx.id,
      merchantOrderId:
        typeof metadata.merchantOrderId === "string"
          ? metadata.merchantOrderId
          : null,
      status: normalizedStatus,
      isFinal: normalizedStatus !== "pending",
      amount: Number(tx.amount.toString()),
      currency: tx.currency,
      paymentMethod: tx.method,
      createdAt: createdAt.toISOString(),
      expiresAt: expiresAt.toISOString(),
      description:
        typeof metadata.description === "string" ? metadata.description : null,
      redirectUrl:
        typeof metadata.redirectUrl === "string" ? metadata.redirectUrl : null,
      updatedAt: tx.updatedAt.toISOString(),
    };
  }
}