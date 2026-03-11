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
  Query,
  Req,
  Res,
  UseGuards,
} from "@nestjs/common";
import { ApiBearerAuth, ApiHeader, ApiOperation, ApiParam, ApiTags } from "@nestjs/swagger";
import { Currency, PaymentMethod, Transaction, TxStatus } from "@prisma/client";
import { randomUUID } from "crypto";
import { Request, Response } from "express";
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
  async getPublicCheckout(
    @Param("checkoutId") checkoutId: string,
    @Query("format") format: string | undefined,
    @Res() res: Response,
  ) {
    let tx = await this.paymentService.getTransactionById(checkoutId);

    // Sandbox auto-complete: if still pending, mark as succeeded and fire webhook.
    if (tx.status === "PENDING") {
      tx = await this.paymentService.sandboxCompleteTransaction(checkoutId);
    }

    const payload = this.serializePublicCheckout(tx);

    if (format === "json") {
      return res.json(payload);
    }

    res.setHeader("Content-Type", "text/html; charset=utf-8");
    return res.send(this.renderHostedCheckoutHtml(payload));
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

  // ── helpers ─────────────────────────────────────────────────────────

  private inferPlan(merchantOrderId: string | null, amount: number): [string, string] {
    const key = (merchantOrderId ?? "").toLowerCase();
    if (key.includes("neon")) return ["Dolphin Neon", "Unlimited everything, custom themes, and early access."];
    if (key.includes("friend")) return ["Dolphin Friend", "Extra chat slots, priority API, and Friend badge."];
    if (amount >= 200000) return ["Dolphin Neon", "Unlimited everything, custom themes, and early access."];
    return ["Dolphin Friend", "Extra chat slots, priority API, and Friend badge."];
  }

  private formatVND(amount: number): string {
    return amount.toLocaleString("vi-VN") + " ₫";
  }

  private escapeHtml(value: string): string {
    return value
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
  }

  private escapeHtmlAttr(value: string): string {
    return value
      .replace(/&/g, "&amp;")
      .replace(/"/g, "&quot;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
  }

  private renderHostedCheckoutHtml(
    payload: ReturnType<CheckoutCompatController["serializePublicCheckout"]>,
  ): string {
    const [planName, planDesc] = this.inferPlan(payload.merchantOrderId, payload.amount);
    const formattedAmount = this.formatVND(payload.amount);
    const redirectUrl = payload.redirectUrl ?? null;
    const safeRedirectUrl = redirectUrl ? this.escapeHtmlAttr(redirectUrl) : "";
    const displayOrderId = this.escapeHtml(payload.merchantOrderId ?? payload.checkoutId);
    const displayPlan = this.escapeHtml(planName);
    const displayDesc = this.escapeHtml(payload.description ?? planDesc);
    const updatedTime = payload.updatedAt
      ? new Date(payload.updatedAt).toLocaleString("vi-VN")
      : "-";

    const isCompleted = payload.status === "completed";
    const isFailed = payload.status === "failed";

    // Build status badge markup
    let badgeClass = "pending";
    let badgeText = "Dang cho thanh toan...";
    let hintText = "He thong dang doi xac nhan tu ngan hang.";
    if (isCompleted) {
      badgeClass = "ok";
      badgeText = "Thanh toan thanh cong";
      hintText = redirectUrl
        ? "Cam on! Plan cua ban se duoc cap nhat ngay. Dang chuyen ve Playhub..."
        : "Cam on! Plan cua ban se duoc cap nhat ngay.";
    } else if (isFailed) {
      badgeClass = "fail";
      badgeText = "Thanh toan that bai";
      hintText = "Giao dich that bai. Vui long quay lai Playhub de tao checkout moi.";
    } else if (payload.status === "refunded") {
      badgeClass = "pending";
      badgeText = "Da hoan tien";
      hintText = "Giao dich da duoc hoan tien.";
    }

    // Meta-refresh redirect (5 s) only when completed with a redirectUrl
    const metaRefresh =
      isCompleted && redirectUrl
        ? `<meta http-equiv="refresh" content="5;url=${safeRedirectUrl}" />`
        : "";

    // Redirect CTA block
    const redirectBlock =
      isCompleted && redirectUrl
        ? `<div class="redirect-wrap">
          <div class="redirect-bar"></div>
          <p class="redirect-text">Tu dong chuyen ve Playhub sau 5 giay...</p>
          <a class="redirect-link" href="${safeRedirectUrl}">Nhan day neu khong tu dong chuyen &rarr;</a>
        </div>`
        : "";

    // QR section — only for pending
    const qrBlock =
      !isCompleted && !isFailed
        ? `<p class="eyebrow">VietQR</p>
          <img
            class="qr"
            src="https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent("playhub:" + payload.checkoutId + ":" + String(payload.amount))}"
            alt="VietQR"
          />`
        : `<div class="success-icon">&#10003;</div>`;

    return `<!doctype html>
<html lang="vi">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Playhub Checkout</title>
    <link rel="icon" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16'%3E%3Ccircle cx='8' cy='8' r='8' fill='%23020617'/%3E%3Ctext x='8' y='11' font-size='8' text-anchor='middle' fill='%2322d3ee'%3EP%3C/text%3E%3C/svg%3E" />
    ${metaRefresh}
    <style>
      :root {
        --bg: #020617;
        --cyan: #22d3ee;
        --purple: #a855f7;
        --text: #e2e8f0;
        --muted: #94a3b8;
        --ok: #10b981;
        --bad: #f43f5e;
      }
      * { box-sizing: border-box; }
      body {
        margin: 0;
        font-family: Inter, "DM Sans", "Segoe UI", sans-serif;
        min-height: 100vh;
        color: var(--text);
        background:
          radial-gradient(circle at 10% 10%, rgba(34,211,238,0.22), transparent 35%),
          radial-gradient(circle at 90% 90%, rgba(168,85,247,0.2), transparent 40%),
          var(--bg);
        padding: 24px;
      }
      .shell {
        max-width: 980px;
        margin: 0 auto;
        border: 1px solid rgba(148,163,184,0.26);
        border-radius: 24px;
        padding: 18px;
        background: rgba(15,23,42,0.6);
        backdrop-filter: blur(8px);
      }
      .header {
        display: flex;
        gap: 12px;
        align-items: center;
        justify-content: space-between;
        border-bottom: 1px solid rgba(148,163,184,0.2);
        padding-bottom: 14px;
        margin-bottom: 14px;
      }
      .brand { font-size: 24px; font-weight: 800; letter-spacing: 0.02em; }
      .brand .hub {
        background: linear-gradient(120deg, var(--cyan), var(--purple));
        -webkit-background-clip: text;
        background-clip: text;
        color: transparent;
      }
      .meta { font-size: 12px; color: var(--muted); text-align: right; }
      .grid { display: grid; grid-template-columns: 1fr; gap: 14px; }
      .card {
        border: 1px solid rgba(148,163,184,0.2);
        border-radius: 18px;
        padding: 16px;
        background: rgba(15,23,42,0.5);
      }
      .eyebrow {
        margin: 0;
        text-transform: uppercase;
        letter-spacing: 0.12em;
        font-size: 11px;
        color: var(--cyan);
      }
      .title { margin: 8px 0 6px; font-size: 28px; font-weight: 800; }
      .desc { margin: 0; color: var(--muted); line-height: 1.6; font-size: 14px; }
      .amount { font-size: 34px; font-weight: 800; margin: 14px 0 0; }
      .label { color: var(--muted); font-size: 12px; margin-top: 10px; }
      .qr {
        margin-top: 12px;
        width: 220px;
        height: 220px;
        border-radius: 14px;
        border: 1px dashed rgba(34,211,238,0.45);
        background: white;
        display: block;
      }
      .success-icon {
        width: 100px;
        height: 100px;
        border-radius: 50%;
        background: rgba(16,185,129,0.18);
        border: 2px solid rgba(16,185,129,0.5);
        color: #34d399;
        font-size: 52px;
        display: flex;
        align-items: center;
        justify-content: center;
        margin: 20px auto;
      }
      .statrow { display: flex; gap: 10px; margin-top: 16px; }
      .pill {
        display: inline-block;
        border-radius: 999px;
        padding: 7px 14px;
        font-size: 13px;
        font-weight: 700;
      }
      .pending { background: rgba(34,211,238,0.15); color: #a5f3fc; border: 1px solid rgba(34,211,238,0.35); }
      .ok { background: rgba(16,185,129,0.16); color: #bbf7d0; border: 1px solid rgba(16,185,129,0.35); }
      .fail { background: rgba(244,63,94,0.16); color: #fecdd3; border: 1px solid rgba(244,63,94,0.35); }
      .hint { font-size: 13px; color: var(--muted); margin-top: 10px; }
      .footer { margin-top: 10px; font-size: 12px; color: var(--muted); }
      /* Redirect countdown */
      .redirect-wrap { margin-top: 18px; }
      .redirect-bar {
        height: 4px;
        border-radius: 2px;
        background: linear-gradient(90deg, var(--cyan), var(--purple));
        animation: shrink 5s linear forwards;
        transform-origin: left;
      }
      @keyframes shrink { from { width: 100%; } to { width: 0%; } }
      .redirect-text { font-size: 13px; color: var(--muted); margin: 8px 0 4px; }
      .redirect-link {
        display: inline-block;
        margin-top: 4px;
        font-size: 13px;
        color: var(--cyan);
        text-decoration: none;
      }
      .redirect-link:hover { text-decoration: underline; }
      .kv { margin-top: 12px; display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
      .kv-item { border: 1px solid rgba(148,163,184,0.2); border-radius: 12px; padding: 10px; }
      .kv-item b { display: block; margin-top: 3px; font-size: 15px; color: #f8fafc; }
      @media (min-width: 880px) { .grid { grid-template-columns: 1fr 1fr; } }
    </style>
  </head>
  <body>
    <main class="shell">
      <div class="header">
        <div class="brand">Play<span class="hub">hub</span></div>
        <div class="meta">
          <div><b>Secured by Scripts</b></div>
          <div>Payment sandbox &mdash; no real charges</div>
        </div>
      </div>

      <section class="grid">
        <article class="card">
          <p class="eyebrow">Thong tin don hang</p>
          <h1 class="title">${displayPlan}</h1>
          <p class="desc">${displayDesc}</p>
          <div class="amount">${this.escapeHtml(formattedAmount)}</div>
          <div class="label">Merchant order: ${displayOrderId}</div>
        </article>

        <article class="card">
          ${qrBlock}
          <div class="statrow">
            <span class="pill ${badgeClass}">${badgeText}</span>
          </div>
          <p class="hint">${hintText}</p>
          ${redirectBlock}
          <div class="footer">Cap nhat: ${this.escapeHtml(updatedTime)}</div>
        </article>
      </section>
    </main>
  </body>
</html>`;
  }
}
