export const MAGIC_AMOUNTS = {
  SUCCESS: 10_000,
  INSUFFICIENT_FUNDS: 40_000,
  TIMEOUT: 50_408,
} as const;

export const IDEMPOTENCY_TTL_SECONDS = 86_400; // 24 hours

export const WEBHOOK_EVENTS = [
  "payment.succeeded",
  "payment.failed",
  "payment.refunded",
] as const;

export const SUPPORTED_CURRENCIES = ["VND", "USD", "EUR"] as const;

export const HMAC_HEADER = "Scripts-Signature";
