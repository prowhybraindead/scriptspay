"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { apiClient } from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Wallet,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface BalanceData {
  available: number;
  pending: number;
}

interface Transaction {
  id: string;
  amount: number;
  status: "SUCCEEDED" | "PENDING" | "FAILED";
  method: string;
  createdAt: string;
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function formatVND(amount: number): string {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(amount);
}

const statusConfig: Record<
  Transaction["status"],
  { label: string; className: string }
> = {
  SUCCEEDED: {
    label: "Succeeded",
    className: "bg-green-500/10 text-green-600 hover:bg-green-500/10",
  },
  PENDING: {
    label: "Pending",
    className: "bg-amber-500/10 text-amber-600 hover:bg-amber-500/10",
  },
  FAILED: {
    label: "Failed",
    className: "bg-red-500/10 text-red-600 hover:bg-red-500/10",
  },
};

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */

export default function TransactionsPage() {
  const [balance, setBalance] = useState<BalanceData>({
    available: 0,
    pending: 0,
  });
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [balData, txData] = await Promise.all([
        apiClient<BalanceData>("/v1/merchants/balance").catch(() => ({
          available: 2_450_000,
          pending: 500_000,
        })),
        apiClient<Transaction[]>("/v1/merchants/transactions").catch(() => MOCK_TRANSACTIONS),
      ]);
      setBalance(balData);
      setTransactions(txData);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  function handleMockTopup() {
    toast.success("Mock Top-up initiated", {
      description: "500,000 VND has been credited to your sandbox balance.",
    });
    setBalance((prev) => ({
      ...prev,
      available: prev.available + 500_000,
    }));
  }

  function handleMockPayout() {
    toast.success("Mock Payout initiated", {
      description: "200,000 VND payout request submitted.",
    });
    setBalance((prev) => ({
      ...prev,
      pending: prev.pending + 200_000,
    }));
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Transactions</h1>
          <p className="text-muted-foreground">
            Financial overview and recent payment activity.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleMockTopup}>
            <ArrowDownRight className="mr-2 h-4 w-4 text-green-600" />
            Mock Top-up
          </Button>
          <Button variant="outline" onClick={handleMockPayout}>
            <ArrowUpRight className="mr-2 h-4 w-4 text-amber-600" />
            Mock Payout
          </Button>
        </div>
      </div>

      {/* Balance Cards */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Available Balance
            </CardTitle>
            <Wallet className="h-5 w-5 text-green-600" />
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold tracking-tight">
              {loading ? (
                <span className="inline-block h-8 w-40 animate-pulse rounded bg-muted" />
              ) : (
                formatVND(balance.available)
              )}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Pending Balance
            </CardTitle>
            <Clock className="h-5 w-5 text-amber-600" />
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold tracking-tight">
              {loading ? (
                <span className="inline-block h-8 w-40 animate-pulse rounded bg-muted" />
              ) : (
                formatVND(balance.pending)
              )}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Transaction Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Recent Transactions</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="h-12 animate-pulse rounded bg-muted"
                />
              ))}
            </div>
          ) : transactions.length === 0 ? (
            <div className="flex h-24 items-center justify-center text-sm text-muted-foreground">
              No transactions yet. Create a payment intent to get started.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Method</TableHead>
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {transactions.map((tx) => {
                  const status = statusConfig[tx.status];
                  return (
                    <TableRow key={tx.id}>
                      <TableCell className="font-mono text-xs">
                        {tx.id.slice(0, 16)}…
                      </TableCell>
                      <TableCell className="font-medium">
                        {formatVND(tx.amount)}
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className={status.className}>
                          {status.label}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm">{tx.method}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {new Date(tx.createdAt).toLocaleDateString("vi-VN", {
                          day: "2-digit",
                          month: "2-digit",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Fallback mock data (used when API is not yet connected)            */
/* ------------------------------------------------------------------ */

const MOCK_TRANSACTIONS: Transaction[] = [
  {
    id: "pi_1a2b3c4d5e6f7g8h",
    amount: 10_000,
    status: "SUCCEEDED",
    method: "VietQR",
    createdAt: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
  },
  {
    id: "pi_9z8y7x6w5v4u3t2s",
    amount: 50_408,
    status: "PENDING",
    method: "VietQR",
    createdAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
  },
  {
    id: "pi_0q1w2e3r4t5y6u7i",
    amount: 40_000,
    status: "FAILED",
    method: "VietQR",
    createdAt: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
  },
  {
    id: "pi_8a7b6c5d4e3f2g1h",
    amount: 250_000,
    status: "SUCCEEDED",
    method: "E-Wallet",
    createdAt: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
  },
  {
    id: "pi_2m3n4o5p6q7r8s9t",
    amount: 1_000_000,
    status: "SUCCEEDED",
    method: "VietQR",
    createdAt: new Date(Date.now() - 1000 * 60 * 180).toISOString(),
  },
];
