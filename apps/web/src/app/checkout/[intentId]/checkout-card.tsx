"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { QrCode, CreditCard, CheckCircle2, Info, Landmark, WalletCards } from "lucide-react";
import { cn } from "@/lib/utils";

interface CheckoutCardProps {
  intentId: string;
}

export function CheckoutCard({ intentId }: CheckoutCardProps) {
  const [paying, setPaying] = useState(false);
  const [paid, setPaid] = useState(false);
  const [selectedRail, setSelectedRail] = useState<"vietqr" | "bank" | "wallet">("vietqr");

  // In a real implementation this would come from the API
  const amount = 10_000;

  function formatVND(value: number): string {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
      maximumFractionDigits: 0,
    }).format(value);
  }

  async function handlePay() {
    setPaying(true);
    // Simulate network latency
    await new Promise((resolve) => setTimeout(resolve, 1500));
    setPaid(true);
    setPaying(false);
    toast.success("Payment successful!", {
      description: `${formatVND(amount)} has been processed.`,
    });
  }

  const paymentRails = [
    { id: "vietqr", label: "VietQR", subtitle: "Fastest sandbox path", icon: QrCode },
    { id: "bank", label: "Bank transfer", subtitle: "Manual approval feel", icon: Landmark },
    { id: "wallet", label: "E-wallet", subtitle: "Mobile-first checkout", icon: WalletCards },
  ] as const;

  return (
    <div className="w-full space-y-4">
      <Card className="overflow-hidden rounded-[32px] border-white/70 bg-white/88 shadow-[0_30px_80px_-34px_rgba(15,23,42,0.35)] backdrop-blur-xl">
        <CardHeader className="text-center sm:text-left">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-[22px] bg-primary/10 sm:mx-0">
            <CreditCard className="h-6 w-6 text-primary" />
          </div>
          <CardTitle className="text-2xl tracking-[-0.04em]">
            Scripts<span className="text-primary">_</span> Checkout
          </CardTitle>
          <CardDescription>Complete your payment in a polished sandbox flow</CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          <div className="grid gap-3 sm:grid-cols-3">
            {paymentRails.map(({ id, label, subtitle, icon: Icon }) => (
              <button
                key={id}
                type="button"
                onClick={() => setSelectedRail(id)}
                className={cn(
                  "rounded-[24px] border px-4 py-4 text-left transition",
                  selectedRail === id
                    ? "border-primary bg-primary/10 shadow-sm"
                    : "border-slate-200 bg-slate-50/80 hover:border-primary/30 hover:bg-white",
                )}
              >
                <Icon className="h-5 w-5 text-primary" />
                <p className="mt-4 font-semibold text-slate-950">{label}</p>
                <p className="mt-1 text-xs leading-5 text-slate-500">{subtitle}</p>
              </button>
            ))}
          </div>

          <div className="space-y-3 rounded-[28px] bg-slate-100/70 p-5">
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-500">Intent ID</span>
              <code className="rounded-full bg-white px-3 py-1 text-xs text-slate-700">
                {intentId.slice(0, 20)}{intentId.length > 20 ? "…" : ""}
              </code>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-500">Amount Due</span>
              <span className="text-3xl font-bold tracking-[-0.05em] text-slate-950">{formatVND(amount)}</span>
            </div>
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span>Payment rail</span>
              <span className="rounded-full bg-white px-3 py-1 font-medium text-slate-700">
                {paymentRails.find((rail) => rail.id === selectedRail)?.label}
              </span>
            </div>
          </div>

          <Separator />

          <div className="flex flex-col items-center gap-3">
            <p className="text-sm font-medium text-slate-500">
              {selectedRail === "vietqr" ? "Scan with your banking app" : "Sandbox payment preview"}
            </p>
            <div className="flex h-52 w-52 items-center justify-center rounded-[28px] border-2 border-dashed border-slate-300 bg-slate-50/90">
              {paid ? (
                <CheckCircle2 className="h-16 w-16 text-green-500" />
              ) : (
                <div className="flex flex-col items-center gap-2 text-slate-500">
                  {selectedRail === "vietqr" ? <QrCode className="h-16 w-16" /> : <WalletCards className="h-16 w-16" />}
                  <span className="text-xs">{selectedRail === "vietqr" ? "VietQR placeholder" : "Sandbox payment sheet"}</span>
                </div>
              )}
            </div>
            <Badge variant="secondary" className="rounded-full px-3 py-1 text-xs">
              {paymentRails.find((rail) => rail.id === selectedRail)?.label} · Sandbox mode
            </Badge>
          </div>

          <Separator />

          {paid ? (
            <div className="flex flex-col items-center gap-2 rounded-[24px] bg-green-500/10 py-5">
              <CheckCircle2 className="h-8 w-8 text-green-600" />
              <p className="font-semibold text-green-600">Payment Complete</p>
              <p className="text-xs text-muted-foreground">
                You may close this page.
              </p>
            </div>
          ) : (
            <Button
              className="w-full rounded-2xl bg-slate-950 py-6 text-base hover:bg-slate-800"
              size="lg"
              onClick={handlePay}
              disabled={paying}
            >
              {paying ? "Processing..." : `Simulate Payment — ${formatVND(amount)}`}
            </Button>
          )}
        </CardContent>

        <CardFooter className="justify-between gap-4 border-t border-slate-200/80 bg-slate-50/70 text-xs text-muted-foreground">
          <p>
            Secured by Scripts<span className="text-primary">_</span> Payment
            Gateway
          </p>
          <p>Hosted sandbox flow</p>
        </CardFooter>
      </Card>

      <div className="flex items-start gap-2 rounded-[24px] border border-dashed border-amber-300/60 bg-amber-50/90 px-4 py-4">
        <Info className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
        <div className="text-xs text-amber-800">
          <p className="font-semibold">Developer — Magic Test Data</p>
          <div className="mt-2 grid gap-2 sm:grid-cols-3">
            {[
              ["10,000 VND", "Instant success"],
              ["40,000 VND", "Insufficient funds"],
              ["50,408 VND", "Pending then random resolution"],
            ].map(([value, description]) => (
              <div key={value} className="rounded-2xl bg-amber-100/80 px-3 py-2 text-amber-900">
                <p className="font-semibold">{value}</p>
                <p className="mt-1 text-[11px] leading-5">{description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
