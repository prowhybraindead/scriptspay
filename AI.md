# AI CONTEXT FILE — SCRIPTS_ (SCRIPTS PAY)

> **Purpose**: This file is the single source of truth for AI coding assistants.
> It reflects the EXACT implemented state of the system as of Phase 13 completion.
> Feed this file to any AI to get full project context instantly.

---

## 1. PROJECT IDENTITY

- **Name**: Scripts_ (Scripts Pay)
- **Type**: Enterprise Payment Gateway Sandbox (Stripe clone for Vietnamese market) + Neo-bank foundation.
- **Architecture**: Turborepo monorepo (`apps/api` + `apps/web` + `packages/shared`).
- **Status**: MVP complete — all 13 phases implemented and building successfully.

---

## 2. TECH STACK (Zero-Dollar Infrastructure)

| Layer | Technology | Details |
|---|---|---|
| Frontend | Next.js 15 (App Router), React 19, TailwindCSS, shadcn/ui (new-york), Zustand, TanStack Query | `apps/web` — port 3000 |
| Backend | NestJS, TypeScript, REST API | `apps/api` — port 3001 |
| Database | PostgreSQL 15+ via Supabase, Prisma ORM | pgvector enabled for RAG embeddings |
| Auth | Supabase Auth (Email/Password), `@supabase/ssr` | JWT validation in NestJS via custom `SupabaseAuthGuard` |
| Cache/Queue | Upstash Serverless Redis (ioredis), BullMQ | Idempotency barrier + webhook retry queue |
| AI | Groq (primary) + OpenRouter (backup) | Failover: Groq `openai/gpt-oss-20b` → OpenRouter `openai/gpt-oss-20b:free`; 10 s / 30 s timeouts |
| Monorepo | Turborepo | Shared package: `@scripts-pay/shared` |

---

## 3. DATABASE SCHEMA (Prisma)

**File**: `apps/api/prisma/schema.prisma`

### Enums
- `Role`: USER, MERCHANT, ADMIN
- `TxStatus`: PENDING, SUCCEEDED, FAILED, REFUNDED
- `Currency`: VND, USD, EUR
- `EntryType`: DEBIT, CREDIT
- `BalanceType`: PENDING, AVAILABLE
- `PaymentMethod`: QR, CARD, EWALLET

### Models

**User** — Links to Supabase Auth UUID.
- `id` (UUID, PK), `email` (unique), `role` (Role), timestamps.
- Relations: `merchantProfile` (1:1), `customerPayments`, `ledgerEntries`.

**MerchantProfile** — 1:1 with User (role=MERCHANT).
- `id`, `userId` (unique FK → User), `businessName`, `taxId`, `isKycApproved`.
- Relations: `apiKeys`, `webhookEndpoints`, `transactions`, `apiRequestLogs`.

**ApiKey** — Public/Secret key pair per merchant.
- `id`, `merchantId` (FK), `publicKey` (unique), `secretKey` (unique), `isActive`.

**WebhookEndpoint** — Merchant-registered webhook URLs.
- `id`, `merchantId` (FK), `url`, `secret` (HMAC signing key), `isActive`.

**Transaction** — Payment Intent (central record).
- `id`, `amount` (Decimal 19,4), `currency`, `status` (TxStatus), `method`, `idempotencyKey` (unique), `metadata` (JSON), `merchantId`, `customerId`.
- Indexes: merchantId, customerId, status, createdAt.

**LedgerEntry** — Immutable double-entry line. **NEVER updated or deleted.**
- `id`, `accountId` (FK → User), `type` (DEBIT/CREDIT), `amount` (Decimal 19,4), `currency`, `balanceType` (PENDING/AVAILABLE), `transactionId` (FK), `description`, `createdAt`.
- Indexes: accountId, transactionId, createdAt.

**ApiRequestLog** — Logs every API call for AI debugger context.
- `id`, `merchantId`, `method`, `endpoint`, `statusCode`, `requestBody`, `responseBody`, `errorMessage`, `createdAt`.
- Compound index: [merchantId, createdAt].

**DocEmbedding** — pgvector embeddings for RAG.
- `id`, `content`, `embedding` (vector(1536)), `createdAt`.

**HealthCheck** — For keep-alive pings.
- `id` (cuid), `status`, `checkedAt`.

---

## 4. BACKEND ARCHITECTURE (NestJS)

**Root**: `apps/api/src/app.module.ts`

### Module Registry
```
AppModule
├── ConfigModule (global)
├── ThrottlerModule (60s window, 100 requests)
├── BullModule (Redis connection for webhook-delivery queue)
├── PrismaModule (global singleton)
├── RedisModule (ioredis client, exported as REDIS_CLIENT token)
├── HealthModule
├── AuthModule
├── PaymentModule
├── LedgerModule
├── WebhookModule
└── AiModule
```

### AuthModule (`modules/auth/`)
- `jwt.strategy.ts` — Extracts Supabase JWT, validates against `SUPABASE_JWT_SECRET`, attaches `{ userId, email, role }` to request.
- `auth.guard.ts` — `SupabaseAuthGuard` extends NestJS `AuthGuard('jwt')`.
- `auth.service.ts` — `syncUserFromSupabase()` for user provisioning.

### PaymentModule (`modules/payment/`)
- **Controller**: `POST /v1/payment-intents` — requires `@UseGuards(SupabaseAuthGuard)`, extracts `Idempotency-Key` header.
- **Service**: `createPaymentIntent(dto, idempotencyKey)`:
  1. **Redis Idempotency Barrier**: `GET idempotency:{merchantId}:{key}` — if cached, return immediately.
  2. **Magic Test Data**: `resolveTransactionStatus(amount)`:
     - `10000` → SUCCEEDED
     - `40000` → FAILED
     - `50408` → PENDING (bank timeout)
     - default → SUCCEEDED
  3. **Create Transaction** record (Prisma, Decimal amount).
  4. **Side effects per status**:
     - SUCCEEDED: `ledgerService.recordDoubleEntry()` + `webhookService.dispatchWebhook("payment_intent.succeeded")`
     - FAILED: `webhookService.dispatchWebhook("payment_intent.failed")` only (no ledger — funds never moved)
     - PENDING: Enqueue BullMQ `delayed-resolution` job with 30s delay
  5. **Cache in Redis**: `SET key JSON EX 86400` (24h TTL).
- **System Account**: `SYSTEM_ACCOUNT_ID = "00000000-0000-0000-0000-000000000000"` — platform house account for double-entry.

### LedgerModule (`modules/ledger/`)
- **`recordDoubleEntry(creditAccountId, debitAccountId, amount, currency, transactionId, description, balanceType)`**:
  1. `Prisma.$transaction` with `Serializable` isolation (10s timeout).
  2. `SELECT id FROM "User" WHERE id IN (...) ORDER BY id FOR UPDATE` — row-level lock, ordered to prevent deadlocks.
  3. Insert CREDIT entry (money IN to creditAccount).
  4. Insert DEBIT entry (money OUT from debitAccount).
  - **Invariant**: Always inserts exactly 2 entries with identical amounts.

- **`calculateBalance(accountId, currency, balanceType)`**:
  - `SUM(CREDIT amounts) - SUM(DEBIT amounts)` — dynamic aggregation, never stored.

- **`settlePendingTransaction(transactionId)`** — Compensating Entries pattern:
  1. Fetch original PENDING entries for the transaction.
  2. Lock both account User rows (`FOR UPDATE`).
  3. **Reverse PENDING** (2 compensating entries): DEBIT original credit account, CREDIT original debit account (both PENDING balanceType).
  4. **Record AVAILABLE** (2 new entries): CREDIT original credit account, DEBIT original debit account (both AVAILABLE balanceType).
  - Total: 4 new immutable rows. Original rows untouched. Full audit trail preserved.

### WebhookModule (`modules/webhook/`)
- **Service**: `dispatchWebhook(merchantId, eventType, payload)`:
  - Fetches all active `WebhookEndpoint` for the merchant.
  - Enqueues BullMQ `deliver` job per endpoint (attempts: 5, exponential backoff 2000ms base).
  
- **Processor** (`@Processor("webhook-delivery")`): Handles 2 job types:
  - **`deliver`**: HMAC-SHA256 signing (`Scripts-Signature: t={timestamp},v1={hmac}`), POST with 10s AbortController timeout, non-2xx throws for retry.
  - **`delayed-resolution`**: Resolves PENDING tx after 30s delay — 70% success, 30% fail (random). Updates Transaction status, enqueues webhook delivery jobs.

### AiModule (`modules/support-ai/`)
- **Controller**: `POST /v1/ai/debug` — `@UseGuards(SupabaseAuthGuard)`, accepts `{ query, merchantId }`.
- **Service**: `analyzeMerchantLogs(merchantId, userQuery)`:
  1. Fetch last 5 `ApiRequestLog` entries (ordered by createdAt desc).
  2. Format logs into readable string (timestamp, method, endpoint, status, truncated request/response bodies).
  3. Build system prompt: expert payment support engineer + `<LogsContext>` injection.
  4. **Provider Waterfall (Failover)**:
     - **Primary**: Groq API — `GROQ_MODEL` (default `openai/gpt-oss-20b`), 10 s `AbortController` timeout.
     - **Backup**: OpenRouter API — `OPENROUTER_MODEL` (default `openai/gpt-oss-20b:free`), 30 s timeout.
     - **Fallback**: If both providers fail or time out, returns `"Support AI is currently busy."` — never throws to client.
  5. Both providers share a single `callProvider()` private method using the OpenAI-compatible `/v1/chat/completions` spec. Each invocation throws on error/timeout, enabling a clean try/catch cascade in the service.
- **Environment**: `GROQ_API_KEY`, `GROQ_MODEL`, `OPENROUTER_API_KEY`, `OPENROUTER_MODEL` read via `ConfigService`.

---

## 5. FRONTEND ARCHITECTURE (Next.js 15)

**Root**: `apps/web/src/`

### Route Map
```
/                           → Landing page (static)
/login                      → Email/password sign-in (Supabase Auth)
/register                   → Email/password sign-up
/docs                       → Public API documentation (no auth)
/checkout/[intentId]        → Public payment page (no auth)
/dashboard                  → Auth-guarded merchant home
/dashboard/transactions     → Balance cards + transaction table
/dashboard/developers       → API Keys (mask/reveal/copy/roll) + Webhooks (add/list/delete)
/dashboard/settings         → (Placeholder)
```

### Auth Flow
- **Middleware** (`src/middleware.ts`): Runs `updateSession()` on every request to refresh Supabase cookies.
- **Route Protection**: `dashboard/layout.tsx` is a **Server Component** that calls `supabase.auth.getUser()` — redirects to `/login` if no session. No client-side flickering.
- **Client Auth**: `src/lib/supabase/client.ts` — `createBrowserClient()` for client components.
- **Server Auth**: `src/lib/supabase/server.ts` — `createServerClient()` with cookie store for RSC.

### API Client (`src/lib/api-client.ts`)
- `apiClient<T>(path, init)` — wraps `fetch`.
- Auto-retrieves Supabase session via `supabase.auth.getSession()`.
- Attaches `Authorization: Bearer <access_token>` header.
- Throws `ApiError(status, message, body)` on non-2xx.

### State Management
- **Zustand Store** (`src/stores/auth-store.ts`): `useAuthStore` — manages `user`, `merchantProfile`, `isLoading`.

### Key Components
- **`DashboardShell`** (`src/components/dashboard-shell.tsx`): Client component — sidebar nav (Home, Transactions, Developers, Settings) + top header (Sandbox badge, email, logout).
- **`AiChatWidget`** (`src/components/ai-chat-widget.tsx`): Floating bottom-right chat bubble → opens chat window. Manages `ChatMessage[]` state, calls `POST /v1/ai/debug`, renders user/AI messages with avatars, animated loading indicator, error toast fallback.

### Developers Page (`/dashboard/developers`)
- **Tab 1 — API Keys**: Public key (read-only + copy), Secret key (masked by default, reveal toggle, copy), Roll Keys danger zone.
- **Tab 2 — Webhooks**: Add endpoint form (URL input), signing secret (mask/reveal/copy), endpoints table with active/inactive badges, delete button.
- **Masking**: `maskSecret(key)` → shows 8-char prefix + 24 bullet chars.

### Transactions Page (`/dashboard/transactions`)
- Balance cards: Available (green) + Pending (amber), formatted as VND via `Intl.NumberFormat`.
- Mock Top-up / Mock Payout buttons → sonner toast + local state update.
- Transaction table: ID, Amount, Status (colored Badge), Method, Date.
- Falls back to mock data when API not connected.

### Checkout Page (`/checkout/[intentId]`)
- Server Component extracts `intentId` → passes to `CheckoutCard` client component.
- VietQR placeholder (dashed box + icon), simulate payment button (1.5s delay), success state with checkmark.
- Developer banner: Magic Test Data reference.

### Docs Page (`/docs`)
- Public static page, Stripe-like typography.
- Sections: Getting Started (base URL), Authentication (curl snippet), Webhook Verification (HMAC code), Magic Test Data (table), React Integration (`<ScriptsCheckoutButton />`).

---

## 6. MAGIC TEST DATA (Mock Logic)

When creating a Payment Intent, the `amount` field strictly dictates the mock response:

| Amount | Status | Side Effects |
|---|---|---|
| `10000` | SUCCEEDED | Ledger double-entry + webhook `payment_intent.succeeded` |
| `40000` | FAILED | Webhook `payment_intent.failed` only (no ledger) |
| `50408` | PENDING | BullMQ delayed job (30s) → 70% success / 30% fail → webhook |
| Any other | SUCCEEDED | Same as 10000 |

---

## 7. INFRASTRUCTURE PATTERNS

### Idempotency
- Redis key: `idempotency:{merchantId}:{idempotencyKey}`
- TTL: 24 hours (86400 seconds)
- On cache hit: return cached Transaction JSON immediately, skip all processing.

### Webhook Retry Policy
- Queue: `webhook-delivery` (BullMQ on Redis)
- Attempts: 5
- Backoff: exponential, base 2000ms → ~2s, ~4s, ~8s, ~16s, ~32s (≈62s total window)
- Job data carries endpoint URL + HMAC secret — signing happens at delivery time.
- `removeOnComplete: 500`, `removeOnFail: 1000` for observability.

### Webhook Signature Format
```
Scripts-Signature: t=<unix_ms>,v1=<hex_hmac_sha256>
Signed payload: `${timestamp}.${JSON.stringify({event, data})}`
```

### Row-Level Locking
```sql
SELECT id FROM "User"
WHERE id IN ($creditAccountId, $debitAccountId)
ORDER BY id   -- consistent order prevents deadlocks
FOR UPDATE
```
- Inside `Prisma.$transaction` with `Serializable` isolation level.
- 10-second timeout to prevent long-held locks.

---

## 7.5. HOSTING & KEEP-ALIVE STRATEGY

### Deployment Targets
| Service | Platform | Notes |
|---|---|---|
| Backend API (`apps/api`) | **Render** (Free tier) | Web Service, auto-deploy from `main` branch |
| Frontend (`apps/web`) | **Vercel** | Auto-deploy from `main` branch |
| Database & Auth | **Supabase** | Free tier — PostgreSQL + Auth |
| Cache & Queue | **Upstash Redis** | Serverless, free tier |
| AI Primary | **Groq** | `openai/gpt-oss-20b`, 10 s timeout |
| AI Backup | **OpenRouter** | `openai/gpt-oss-20b:free`, 30 s timeout |

### Render Free Tier Keep-Alive
Render's free tier spins down web services after 15 minutes of inactivity, causing a cold-start delay for the next request.

**Strategy**: Use [cron-job.org](https://cron-job.org) (free) to ping `GET /api/health` every **10 minutes**.
- The `HealthController` returns `{ status: 'ok', timestamp: string }` and also executes a lightweight `SELECT 1` against the database.
- This simultaneously prevents Render from sleeping **and** keeps the Supabase connection warm.
- **Setup**: Create a cron job at cron-job.org → URL: `https://your-api.onrender.com/api/health` → Schedule: `*/10 * * * *`.

---

## 8. ENVIRONMENT VARIABLES

### Backend (`apps/api/.env`)
```
DATABASE_URL=postgresql://...
DIRECT_URL=postgresql://...
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJ...
SUPABASE_JWT_SECRET=your-jwt-secret
REDIS_HOST=xxx.upstash.io
REDIS_PORT=6379
REDIS_PASSWORD=xxx
REDIS_TLS=true
GROQ_API_KEY=gsk_...
GROQ_MODEL=openai/gpt-oss-20b
OPENROUTER_API_KEY=sk-or-...
OPENROUTER_MODEL=openai/gpt-oss-20b:free
PORT=4000
NODE_ENV=production
CORS_ORIGIN=https://your-app.vercel.app
```

### Frontend (`apps/web/.env.local`)
```
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
NEXT_PUBLIC_API_URL=https://your-api.onrender.com
```

---

## 9. BUILD & RUN

```bash
# Install dependencies (from root)
npm install

# Push Prisma schema to database
cd apps/api && npx prisma db push && npx prisma generate

# Development (Turborepo — runs both apps)
npm run dev

# Production builds
cd apps/api && npx nest build       # NestJS
cd apps/web && npx next build       # Next.js
```

---

## 10. PHASE COMPLETION LOG

| Phase | Description | Status |
|---|---|---|
| 1 | Project Setup (Turborepo + NestJS + Next.js) | ✅ Complete |
| 2 | Database Schema (Prisma → Supabase) | ✅ Complete |
| 3 | NestJS Module Scaffolding (5 modules) | ✅ Complete |
| 4 | LedgerModule (double-entry + compensating entries) | ✅ Complete |
| 5 | PaymentModule (idempotency + Magic Test Data) | ✅ Complete |
| 6 | WebhookModule (BullMQ + HMAC-SHA256) | ✅ Complete |
| 7 | SupportAIModule (OpenRouter + log context) | ✅ Complete |
| 8 | Frontend Scaffolding & Auth UI | ✅ Complete |
| 9 | Developers Dashboard (API Keys + Webhooks) | ✅ Complete |
| 10 | Transactions & Balance Dashboard | ✅ Complete |
| 11 | Public Checkout Page | ✅ Complete |
| 12 | AI Chat Widget Wiring | ✅ Complete |
| 13 | Documentation Site + README + AI.md | ✅ Complete |