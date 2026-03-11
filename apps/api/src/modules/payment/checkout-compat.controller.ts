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
    const tx = await this.paymentService.getTransactionById(checkoutId);
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

  private renderHostedCheckoutHtml(payload: ReturnType<CheckoutCompatController["serializePublicCheckout"]>): string {
    const safePayload = JSON.stringify(payload).replace(/</g, "\\u003c");

    return `<!doctype html>
<html lang="vi">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Playhub Checkout</title>
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
          radial-gradient(circle at 10% 10%, rgba(34, 211, 238, 0.22), transparent 35%),
          radial-gradient(circle at 90% 90%, rgba(168, 85, 247, 0.2), transparent 40%),
          var(--bg);
        padding: 24px;
      }
      .shell {
        max-width: 980px;
        margin: 0 auto;
        border: 1px solid rgba(148, 163, 184, 0.26);
        border-radius: 24px;
        padding: 18px;
        background: rgba(15, 23, 42, 0.6);
        backdrop-filter: blur(8px);
      }
      .header {
        display: flex;
        gap: 12px;
        align-items: center;
        justify-content: space-between;
        border-bottom: 1px solid rgba(148, 163, 184, 0.2);
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
        border: 1px solid rgba(148, 163, 184, 0.2);
        border-radius: 18px;
        padding: 16px;
        background: rgba(15, 23, 42, 0.5);
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
        border: 1px dashed rgba(34, 211, 238, 0.45);
        background: white;
        display: block;
      }
      .statrow { display: flex; gap: 10px; margin-top: 12px; }
      .pill {
        display: inline-block;
        border-radius: 999px;
        padding: 7px 12px;
        font-size: 12px;
        font-weight: 700;
      }
      .pending { background: rgba(34, 211, 238, 0.15); color: #a5f3fc; border: 1px solid rgba(34, 211, 238, 0.35); }
      .ok { background: rgba(16, 185, 129, 0.16); color: #bbf7d0; border: 1px solid rgba(16, 185, 129, 0.35); }
      .fail { background: rgba(244, 63, 94, 0.16); color: #fecdd3; border: 1px solid rgba(244, 63, 94, 0.35); }
      .hint { font-size: 13px; color: var(--muted); margin-top: 10px; }
      .kv { margin-top: 12px; display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
      .kv-item { border: 1px solid rgba(148, 163, 184, 0.2); border-radius: 12px; padding: 10px; }
      .kv-item b { display: block; margin-top: 3px; font-size: 15px; color: #f8fafc; }
      .footer { margin-top: 10px; font-size: 12px; color: var(--muted); }
      @media (min-width: 880px) {
        .grid { grid-template-columns: 1fr 1fr; }
      }
    </style>
  </head>
  <body>
    <main class="shell">
      <div class="header">
        <div class="brand">Play<span class="hub">hub</span></div>
        <div class="meta">
          <div><b>Secured by Scripts</b></div>
          <div>Payment sandbox - no real charges</div>
        </div>
      </div>

      <section class="grid">
        <article class="card">
          <p class="eyebrow">Thong tin don hang</p>
          <h1 id="plan" class="title">Dolphin Friend</h1>
          <p id="description" class="desc">Extra chat slots, priority API, and Friend badge.</p>
          <div id="amount" class="amount">0 đ</div>
          <div class="label">Merchant order: <span id="merchant-order">-</span></div>
        </article>

        <article class="card">
          <p class="eyebrow">VietQR</p>
          <img id="qr" class="qr" alt="VietQR" />
          <div class="kv">
            <div class="kv-item"><span class="label">Payment method</span><b id="method">QR</b></div>
            <div class="kv-item"><span class="label">Expiry countdown</span><b id="countdown">00:00</b></div>
          </div>
          <div class="statrow"><span id="status-pill" class="pill pending">Dang cho thanh toan...</span></div>
          <p id="status-hint" class="hint">He thong dang doi xac nhan tu ngan hang.</p>
          <div class="footer">Last update: <span id="updated-at">-</span></div>
        </article>
      </section>
    </main>

    <script>
      const state = ${safePayload};

      const formatVND = (value) => new Intl.NumberFormat("vi-VN", {
        style: "currency",
        currency: "VND",
        maximumFractionDigits: 0,
      }).format(Number(value || 0));

      const inferPlan = (merchantOrderId, amount) => {
        const value = String(merchantOrderId || "").toLowerCase();
        if (value.includes("neon")) return ["Dolphin Neon", "Unlimited everything, custom themes, and early access."];
        if (value.includes("friend")) return ["Dolphin Friend", "Extra chat slots, priority API, and Friend badge."];
        if (Number(amount) >= 200000) return ["Dolphin Neon", "Unlimited everything, custom themes, and early access."];
        return ["Dolphin Friend", "Extra chat slots, priority API, and Friend badge."];
      };

      const updateStatus = (status) => {
        const pill = document.getElementById("status-pill");
        const hint = document.getElementById("status-hint");
        pill.className = "pill";

        if (status === "completed") {
          pill.classList.add("ok");
          pill.textContent = "Thanh toan thanh cong";
          hint.textContent = "Ban co the quay lai Playhub, plan se tu duoc nang cap ngay.";
          return;
        }

        if (status === "failed") {
          pill.classList.add("fail");
          pill.textContent = "Thanh toan that bai";
          hint.textContent = "Giao dich that bai. Vui long quay lai Playhub de tao checkout moi.";
          return;
        }

        pill.classList.add("pending");
        pill.textContent = "Dang cho thanh toan...";
        hint.textContent = "He thong dang doi xac nhan tu ngan hang.";
      };

      const render = (data) => {
        const [planName, fallbackDesc] = inferPlan(data.merchantOrderId, data.amount);
        document.getElementById("plan").textContent = planName;
        document.getElementById("description").textContent = data.description || fallbackDesc;
        document.getElementById("amount").textContent = formatVND(data.amount);
        document.getElementById("merchant-order").textContent = data.merchantOrderId || data.checkoutId;
        document.getElementById("method").textContent = data.paymentMethod || "QR";
        document.getElementById("updated-at").textContent = new Date(data.updatedAt).toLocaleString("vi-VN");
        document.getElementById("qr").src = "https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=" + encodeURIComponent("playhub:" + data.checkoutId + ":" + data.amount);
        updateStatus(data.status);
      };

      const startCountdown = (expiresAt) => {
        const el = document.getElementById("countdown");
        const tick = () => {
          const ms = Math.max(0, new Date(expiresAt).getTime() - Date.now());
          const mm = Math.floor(ms / 60000).toString().padStart(2, "0");
          const ss = Math.floor((ms % 60000) / 1000).toString().padStart(2, "0");
          el.textContent = mm + ":" + ss;
        };
        tick();
        setInterval(tick, 1000);
      };

      const poll = async () => {
        if (state.status !== "pending") return;
        try {
          const res = await fetch("/checkout/" + state.checkoutId + "?format=json", { cache: "no-store" });
          if (!res.ok) return;
          const fresh = await res.json();
          Object.assign(state, fresh);
          render(state);
        } catch {
          void 0;
        }
      };

      render(state);
      startCountdown(state.expiresAt);
      setInterval(poll, 3000);
    </script>
  </body>
</html>`;
  }
}