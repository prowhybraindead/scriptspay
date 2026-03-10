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
import { QrCode, CreditCard, CheckCircle2, Info } from "lucide-react";

interface CheckoutCardProps {
  intentId: string;
}

export function CheckoutCard({ intentId }: CheckoutCardProps) {
  const [paying, setPaying] = useState(false);
  const [paid, setPaid] = useState(false);

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

  return (
    <div className="w-full max-w-md space-y-4">
      <Card className="shadow-xl">
        <CardHeader className="text-center">
          <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            <CreditCard className="h-6 w-6 text-primary" />
          </div>
          <CardTitle className="text-xl">
            Scripts<span className="text-primary">_</span> Checkout
          </CardTitle>
          <CardDescription>Complete your payment</CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Order Details */}
          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Intent ID</span>
              <code className="rounded bg-muted px-2 py-0.5 text-xs">
                {intentId.slice(0, 20)}{intentId.length > 20 ? "…" : ""}
              </code>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Amount Due</span>
              <span className="text-2xl font-bold">{formatVND(amount)}</span>
            </div>
          </div>

          <Separator />

          {/* Mock QR Section */}
          <div className="flex flex-col items-center gap-3">
            <p className="text-sm font-medium text-muted-foreground">
              Scan with your banking app
            </p>
            <div className="flex h-48 w-48 items-center justify-center rounded-xl border-2 border-dashed border-muted-foreground/25 bg-muted/50">
              {paid ? (
                <CheckCircle2 className="h-16 w-16 text-green-500" />
              ) : (
                <div className="flex flex-col items-center gap-2 text-muted-foreground">
                  <QrCode className="h-16 w-16" />
                  <span className="text-xs">VietQR Placeholder</span>
                </div>
              )}
            </div>
            <Badge variant="secondary" className="text-xs">
              VietQR · Sandbox Mode
            </Badge>
          </div>

          <Separator />

          {/* Payment Button */}
          {paid ? (
            <div className="flex flex-col items-center gap-2 rounded-lg bg-green-500/10 py-4">
              <CheckCircle2 className="h-8 w-8 text-green-600" />
              <p className="font-semibold text-green-600">Payment Complete</p>
              <p className="text-xs text-muted-foreground">
                You may close this page.
              </p>
            </div>
          ) : (
            <Button
              className="w-full py-6 text-base"
              size="lg"
              onClick={handlePay}
              disabled={paying}
            >
              {paying ? "Processing..." : `Simulate Payment — ${formatVND(amount)}`}
            </Button>
          )}
        </CardContent>

        <CardFooter className="justify-center">
          <p className="text-xs text-muted-foreground">
            Secured by Scripts<span className="text-primary">_</span> Payment
            Gateway
          </p>
        </CardFooter>
      </Card>

      {/* Developer Helper Banner */}
      <div className="flex items-start gap-2 rounded-lg border border-dashed border-amber-300/50 bg-amber-50 px-4 py-3">
        <Info className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
        <div className="text-xs text-amber-800">
          <p className="font-semibold">Developer — Magic Test Data</p>
          <ul className="mt-1 space-y-0.5 text-amber-700">
            <li>
              <code className="rounded bg-amber-100 px-1">10,000 VND</code> →
              Instant Success
            </li>
            <li>
              <code className="rounded bg-amber-100 px-1">40,000 VND</code> →
              Insufficient Funds (Fail)
            </li>
            <li>
              <code className="rounded bg-amber-100 px-1">50,408 VND</code> →
              Bank Timeout (Pending → resolves randomly)
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
