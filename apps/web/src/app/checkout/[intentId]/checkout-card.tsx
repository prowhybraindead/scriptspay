"use client";

import { useEffect, useMemo, useState } from "react";
import { AlertCircle, CheckCircle2, Loader2, QrCode } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface CheckoutCardProps {
  intentId: string;
}

type CheckoutStatus = "pending" | "completed" | "failed" | "refunded";

type PublicCheckout = {
  checkoutId: string;
  merchantOrderId: string | null;
  status: CheckoutStatus;
  isFinal: boolean;
  amount: number;
  currency: string;
  paymentMethod: string;
  updatedAt: string;
  createdAt: string;
  expiresAt: string;
  description: string | null;
  redirectUrl: string | null;
};

type PlanContent = {
  name: string;
  description: string;
};

function formatVND(value: number): string {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(value);
}

function getApiBaseUrl(): string {
  const raw = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";
  return raw.trim().replace(/\/+$/, "");
}

function parsePlanFromMerchantOrderId(merchantOrderId: string | null, amount: number): PlanContent {
  const fallback = amount >= 200_000
    ? {
        name: "Dolphin Neon",
        description: "Unlimited everything, custom themes, and early access.",
      }
    : {
        name: "Dolphin Friend",
        description: "Extra chat slots, priority API, and Friend badge.",
      };

  if (!merchantOrderId) {
    return fallback;
  }

  const normalized = merchantOrderId.toLowerCase();
  if (normalized.includes("neon")) {
    return {
      name: "Dolphin Neon",
      description: "Unlimited everything, custom themes, and early access.",
    };
  }

  if (normalized.includes("friend")) {
    return {
      name: "Dolphin Friend",
      description: "Extra chat slots, priority API, and Friend badge.",
    };
  }

  return fallback;
}

function PlayhubLogo() {
  return (
    <svg width="220" height="48" viewBox="0 0 220 48" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="ph-ocean" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#22d3ee" />
          <stop offset="100%" stopColor="#a855f7" />
        </linearGradient>
      </defs>
      <rect
        x="0.5"
        y="0.5"
        width="219"
        height="47"
        rx="12"
        fill="#020617"
        fillOpacity="0.85"
        stroke="url(#ph-ocean)"
        strokeOpacity="0.4"
      />
      <path
        d="M34 10C29 10 25.5 11.8 23 14.5C20.5 17.2 19.2 20.8 19 23C21 21.5 23.6 21.3 25.4 21.6C25.1 22.4 25 23.2 25 24C25 28.4 28.6 32 33 32C36.7 32 39.8 29.8 40.9 26.7C42.4 27.7 44.5 28 46 28C45.2 26.5 44.8 24.9 44.7 23.5C44.5 21.3 45 19.2 45.7 17.7C43.6 17.6 41.6 17.1 39.9 16.3C38.1 15.5 36.7 14.4 35.7 13.4C35.4 13.1 35.1 12.8 34.9 12.5C34.6 11.7 34.3 10.9 34 10Z"
        fill="url(#ph-ocean)"
      />
      <circle cx="33" cy="16" r="1.2" fill="#0f172a" />
      <text
        x="68"
        y="29"
        fontFamily="system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
        fontSize="20"
        fontWeight="700"
        letterSpacing="0.04em"
        fill="#e5f6ff"
      >
        Play
        <tspan fill="url(#ph-ocean)">hub</tspan>
      </text>
    </svg>
  );
}

export function CheckoutCard({ intentId }: CheckoutCardProps) {
  const [checkout, setCheckout] = useState<PublicCheckout | null>(null);
  const [loading, setLoading] = useState(true);
  const [polling, setPolling] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [countdownMs, setCountdownMs] = useState(0);

  useEffect(() => {
    let active = true;

    const fetchCheckout = async () => {
      try {
        if (!checkout) {
          setLoading(true);
        } else {
          setPolling(true);
        }

        const response = await fetch(`${getApiBaseUrl()}/checkout/${intentId}`, {
          cache: "no-store",
        });

        if (!response.ok) {
          const body = await response.json().catch(() => ({}));
          throw new Error(body.message ?? "Could not load checkout status.");
        }

        const data = (await response.json()) as PublicCheckout;
        if (!active) return;

        setCheckout(data);
        setError(null);
      } catch (err) {
        if (!active) return;
        setError(err instanceof Error ? err.message : "Could not load checkout status.");
      } finally {
        if (!active) return;
        setLoading(false);
        setPolling(false);
      }
    };

    void fetchCheckout();
    const interval = setInterval(() => {
      if (!checkout?.isFinal) {
        void fetchCheckout();
      }
    }, 3000);

    return () => {
      active = false;
      clearInterval(interval);
    };
  }, [intentId, checkout?.isFinal]);

  useEffect(() => {
    if (!checkout) return;

    const tick = () => {
      const expiresAt = new Date(checkout.expiresAt).getTime();
      setCountdownMs(Math.max(0, expiresAt - Date.now()));
    };

    tick();
    const timer = setInterval(tick, 1000);
    return () => clearInterval(timer);
  }, [checkout]);

  const countdown = useMemo(() => {
    const minutes = Math.floor(countdownMs / 60_000);
    const seconds = Math.floor((countdownMs % 60_000) / 1000);
    return `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
  }, [countdownMs]);

  const plan = useMemo(() => {
    if (!checkout) {
      return {
        name: "Dolphin Friend",
        description: "Extra chat slots, priority API, and Friend badge.",
      };
    }

    return parsePlanFromMerchantOrderId(checkout.merchantOrderId, checkout.amount);
  }, [checkout]);

  if (loading) {
    return (
      <div className="rounded-3xl border border-cyan-300/20 bg-slate-900/60 p-10 text-slate-100 backdrop-blur-xl">
        <div className="flex items-center gap-3 text-cyan-200">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span>Dang tai thong tin thanh toan...</span>
        </div>
      </div>
    );
  }

  if (error || !checkout) {
    return (
      <div className="rounded-3xl border border-rose-400/30 bg-rose-500/10 p-6 text-rose-100 backdrop-blur-xl">
        <div className="flex items-start gap-3">
          <AlertCircle className="mt-0.5 h-5 w-5" />
          <div>
            <p className="font-semibold">Khong the tai checkout</p>
            <p className="mt-1 text-sm text-rose-200">{error ?? "Lien ket khong hop le hoac da het han."}</p>
          </div>
        </div>
      </div>
    );
  }

  const qrPayload = `playhub:${checkout.checkoutId}:${checkout.amount}`;

  return (
    <div className="relative overflow-hidden rounded-[30px] border border-cyan-300/20 bg-slate-950/70 p-5 shadow-[0_28px_80px_-35px_rgba(34,211,238,0.45)] backdrop-blur-2xl sm:p-6">
      <div className="pointer-events-none absolute -top-32 right-0 h-72 w-72 rounded-full bg-fuchsia-500/20 blur-3xl" />
      <div className="pointer-events-none absolute -left-28 bottom-4 h-64 w-64 rounded-full bg-cyan-400/20 blur-3xl" />

      <header className="relative mb-6 flex flex-col gap-4 border-b border-white/10 pb-5 sm:flex-row sm:items-center sm:justify-between">
        <PlayhubLogo />
        <div className="text-left sm:text-right">
          <p className="text-sm font-semibold text-cyan-100">Secured by Scripts</p>
          <p className="text-xs text-slate-300">Payment sandbox - no real charges</p>
        </div>
      </header>

      <div className="relative grid gap-4 lg:grid-cols-2">
        <section className="rounded-3xl border border-white/10 bg-white/5 p-5">
          <p className="text-xs uppercase tracking-[0.18em] text-cyan-200">Thong tin don hang</p>
          <h2 className="mt-3 text-3xl font-bold tracking-tight text-white">{plan.name}</h2>
          <p className="mt-2 text-sm leading-6 text-slate-300">{checkout.description ?? plan.description}</p>

          <div className="mt-5 rounded-2xl border border-cyan-300/20 bg-slate-900/70 p-4">
            <p className="text-xs text-slate-400">Gia thanh toan</p>
            <p className="mt-1 text-4xl font-bold tracking-tight text-cyan-200">{formatVND(checkout.amount)}</p>
            <p className="mt-2 text-xs text-slate-400">Ma don: {checkout.merchantOrderId ?? checkout.checkoutId}</p>
          </div>
        </section>

        <section className="rounded-3xl border border-white/10 bg-white/5 p-5">
          <p className="text-xs uppercase tracking-[0.18em] text-cyan-200">VietQR</p>
          <div className="mt-3 flex justify-center rounded-2xl border border-dashed border-cyan-300/40 bg-slate-900/80 p-4">
            <img
              src={`https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(qrPayload)}`}
              alt="VietQR checkout"
              className="h-52 w-52 rounded-xl bg-white p-2"
            />
          </div>

          <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
            <div className="rounded-xl border border-white/10 bg-slate-900/80 p-3">
              <p className="text-xs text-slate-400">Amount (VND)</p>
              <p className="mt-1 font-semibold text-white">{formatVND(checkout.amount)}</p>
            </div>
            <div className="rounded-xl border border-white/10 bg-slate-900/80 p-3">
              <p className="text-xs text-slate-400">Expiry countdown</p>
              <p className="mt-1 font-semibold text-fuchsia-200">{countdown}</p>
            </div>
          </div>

          <div className="mt-4 rounded-2xl border border-white/10 bg-slate-900/75 p-4">
            {checkout.status === "pending" && (
              <Badge className="rounded-full border border-cyan-300/40 bg-cyan-500/15 text-cyan-100 hover:bg-cyan-500/15">
                <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" /> Dang cho thanh toan...
              </Badge>
            )}
            {checkout.status === "completed" && (
              <Badge className="rounded-full border border-emerald-300/50 bg-emerald-500/20 text-emerald-100 hover:bg-emerald-500/20">
                <CheckCircle2 className="mr-2 h-3.5 w-3.5" /> Thanh toan thanh cong
              </Badge>
            )}
            {checkout.status === "failed" && (
              <Badge className="rounded-full border border-rose-300/50 bg-rose-500/20 text-rose-100 hover:bg-rose-500/20">
                <AlertCircle className="mr-2 h-3.5 w-3.5" /> Thanh toan that bai
              </Badge>
            )}
            {checkout.status === "refunded" && (
              <Badge className="rounded-full border border-amber-300/50 bg-amber-500/20 text-amber-100 hover:bg-amber-500/20">
                <QrCode className="mr-2 h-3.5 w-3.5" /> Giao dich da hoan tien
              </Badge>
            )}

            <p className="mt-3 text-sm text-slate-300">
              {checkout.status === "completed"
                ? "Ban co the quay lai Playhub, plan se tu duoc nang cap ngay."
                : checkout.status === "failed"
                  ? "Giao dich that bai. Hay thu lai de tao checkout moi."
                  : "He thong dang doi xac nhan tu ngan hang. Trang se tu dong cap nhat."}
            </p>

            {checkout.status === "failed" && (
              <Button
                type="button"
                className="mt-4 w-full rounded-xl bg-fuchsia-600 text-white hover:bg-fuchsia-500"
                onClick={() => window.location.assign(checkout.redirectUrl ?? "/")}
              >
                Thu lai
              </Button>
            )}
          </div>

          <p className="mt-3 text-xs text-slate-400">
            Last update: {new Date(checkout.updatedAt).toLocaleString("vi-VN")} {polling ? "- syncing..." : ""}
          </p>
        </section>
      </div>
    </div>
  );
}
