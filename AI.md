# SYSTEM CONTEXT: SCRIPTS_ (SCRIPTS PAY)
**Type**: Payment Gateway Sandbox (Stripe clone for VN market) & Neo-bank foundation.
**Goal**: Enterprise-grade architecture, 100% Zero-Dollar Infra.

## 1. TECH STACK & INFRASTRUCTURE
- **Frontend/Docs**: Next.js 15+ (App Router), React 19, TailwindCSS, shadcn/ui, Zustand, TanStack Query.
- **Backend API**: NestJS, TypeScript, REST API.
- **Database**: Supabase (PostgreSQL 15+).
  - Use `pgvector` for AI RAG embeddings.
  - Use Supabase Auth (JWT, Google OAuth) & Storage (1GB for KYC files).
- **Cache/Queue**: Upstash Serverless Redis. Use `BullMQ` for webhook retries.
- **AI Engine**: OpenRouter API (Models: Meta Llama 3 / Mistral / Gemini).
- **Hosting**: Vercel (Frontend), Render/Koyeb (Backend Docker).
- **Keep-alive Rule**: Cron-job.org pings `GET /api/health` every 14 mins (triggers `SELECT 1` on DB) to prevent Render/Supabase sleep.

## 2. CORE DOMAINS & FEATURES (MANDATORY TO IMPLEMENT)

### A. Identity & Onboarding
- **Roles**: `User` (End-customer), `Merchant` (Seller), `Admin`.
- **Auth**: Supabase Auth (Email/Pass, Google OAuth). Session management (force logout).
- **Security**: Simulate 2FA (TOTP via Authenticator app).
- **KYC Sandbox**: Upload fake docs (PDF/Img) -> Supabase Storage. Admin manual approve or auto-approve. Merchant must update Business Info (Tax ID).

### B. Payment Processing Core
- **Checkout Session API**: Create Payment Intent (amount, currency, metadata).
- **Methods**: 
  - *VietQR*: Generate Dynamic (per order) & Static QR.
  - *Card*: Stripe-like form (tokenize, no real card storage).
  - *E-Wallet*: Route mock to MoMo/ZaloPay/VNPay.
- **Multi-Currency**: Convert VND, USD, EUR on-the-fly via mock API rates.
- **Refund & Dispute**: API for full/partial refunds. Mock dispute resolution flow.

### C. Ledger & Reconciliation (Strict Rules)
- **Immutable Ledger**: Double-entry accounting (Debit/Credit). NO direct balance updates. Use `SELECT ... FOR UPDATE` (Row-level lock in Prisma) to prevent race conditions.
- **Balance Split**: Maintain `pending_balance` and `available_balance`.
- **Reconciliation**: Cronjob runs at end-of-day (T+1) to settle pending to available.
- **Neo-Bank Mocks**: Form to Top-up balance (internal API) and Payout to bank (simulate 1-3 days delay).

### D. Developer Experience (DX) & Dashboard
- **API Keys**: Generate, rotate, and revoke `Public` & `Secret` keys.
- **Webhooks**: 
  - Register endpoint URLs. Events: `succeeded`, `failed`, `refunded`.
  - Must sign payloads with HMAC-SHA256 (`Scripts-Signature` header).
  - BullMQ exponential backoff retry policy for failed deliveries.
- **API Polling**: Fallback endpoint for checking transaction status.
- **Docs Site**: Next.js static pages with OpenAPI/Swagger (auto-gen from NestJS), JS SDK mock, and `<ScriptsCheckoutButton />` React component. API Playground included.
- **Analytics**: Chart.js for revenue over time, failure rates, transaction history export (CSV).

### E. AI & Customer Support
- **Context-Aware AI Chatbot**: Floating widget in Dashboard.
- **RAG**: Trained on Scripts_ docs using `pgvector`.
- **Superpower**: AI has read-only access to Merchant's `api_request_logs` table to debug integration errors (e.g., missing HMAC) in real-time.
- **Ticketing**: Auto-escalate unresolved chats to human Admin via ticket system.

### F. Admin Panel
- **System Oversight**: Manage Users/Merchants, approve KYC, override transaction status.
- **Chaos Engineering**: Global toggle `SIMULATE_BANK_DOWNTIME` (Boolean). If true, mock bank APIs return 503/Timeout to test system Circuit Breaker.

## 3. MAGIC TEST DATA (MOCK LOGIC)
When creating a Payment Intent, the `amount` field strictly dictates the mock response:
- `amount === 10000`: Success instantly.
- `amount === 40000`: Fails with `insufficient_funds`.
- `amount === 50408`: Triggers a 30-second delay/timeout before webhook fires.

## 4. SYSTEM RULES
- **Idempotency**: All payment/mutation endpoints MUST require `Idempotency-Key` header. Store in Redis (TTL 24h).
- **Security Headers**: Helmet, Rate Limiting (Upstash), CORS.