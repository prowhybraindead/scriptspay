export type Role = "USER" | "MERCHANT" | "ADMIN";

export type TransactionStatus =
  | "PENDING"
  | "PROCESSING"
  | "SUCCEEDED"
  | "FAILED"
  | "REFUNDED"
  | "DISPUTED";

export type PaymentMethod = "VIETQR" | "CARD" | "EWALLET";

export type EWalletProvider = "MOMO" | "ZALOPAY" | "VNPAY";

export type Currency = "VND" | "USD" | "EUR";

export type WebhookEvent =
  | "payment.succeeded"
  | "payment.failed"
  | "payment.refunded";

export type KycStatus = "PENDING" | "APPROVED" | "REJECTED";

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
  };
  meta?: {
    page: number;
    limit: number;
    total: number;
  };
}

export interface PaymentIntentCreate {
  amount: number;
  currency: Currency;
  payment_method: PaymentMethod;
  metadata?: Record<string, string>;
  idempotency_key: string;
}

export interface CheckoutSession {
  id: string;
  amount: number;
  currency: Currency;
  status: TransactionStatus;
  payment_method: PaymentMethod;
  merchant_id: string;
  created_at: string;
  expires_at: string;
}
