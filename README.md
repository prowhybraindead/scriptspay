<div align="center">

# Scripts_

### Enterprise-Grade Payment Gateway Sandbox for the Vietnamese Market

[![NestJS](https://img.shields.io/badge/NestJS-E0234E?style=flat&logo=nestjs&logoColor=white)](https://nestjs.com/)
[![Next.js 15](https://img.shields.io/badge/Next.js_15-000000?style=flat&logo=next.js&logoColor=white)](https://nextjs.org/)
[![Supabase](https://img.shields.io/badge/Supabase-3FCF8E?style=flat&logo=supabase&logoColor=white)](https://supabase.com/)
[![Prisma](https://img.shields.io/badge/Prisma-2D3748?style=flat&logo=prisma&logoColor=white)](https://prisma.io/)
[![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=flat&logo=typescript&logoColor=white)](https://typescriptlang.org/)

*A Stripe-like developer experience with VietQR, double-entry immutable ledger, AI-powered debugging, and HMAC-signed webhooks — all on zero-dollar infrastructure.*

</div>

---

## Overview

**Scripts_** (Scripts Pay) is a full-stack payment gateway sandbox built as an enterprise fintech reference architecture. It simulates real payment processing flows — checkout, ledger reconciliation, webhook delivery, and merchant dashboards — without touching real money or paid APIs.

Designed for the Vietnamese market with VietQR support, multi-currency handling (VND/USD/EUR), and a Neo-bank foundation for top-ups and payouts.

## Zero-Dollar Architecture Stack

| Layer | Technology | Cost |
|---|---|---|
| **Frontend** | Next.js 15 (App Router), React 19, TailwindCSS, shadcn/ui, Zustand | Free (Vercel) |
| **Backend API** | NestJS, TypeScript, REST | Free (Railway trial / Hobby) |
| **Database** | PostgreSQL 15+ via Supabase (+ pgvector) | Free tier |
| **Auth** | Supabase Auth (Email/Password, JWT) | Free tier |
| **Cache / Queue** | Upstash Serverless Redis + BullMQ | Free tier |
| **AI Engine** | Groq (primary) + OpenRouter (backup) | Free models |
| **Monorepo** | Turborepo | Free |

**Total monthly cost: $0**

## Features

### Immutable Double-Entry Ledger
- Every payment creates exactly 2 ledger entries (CREDIT + DEBIT) — `sum(credits) === sum(debits)` globally.
- Balances are **never stored** — computed dynamically via `SUM(CREDIT) - SUM(DEBIT)` aggregation.
- Settlement uses **compensating entries** (4 new rows) to move PENDING → AVAILABLE without mutating history.
- `SELECT ... FOR UPDATE` row-level locking with `Serializable` isolation prevents race conditions.

### Redis Idempotency Barrier
- All mutation endpoints require an `Idempotency-Key` header.
- Keys cached in Redis with 24-hour TTL — duplicate requests return cached response instantly.

### HMAC-SHA256 Webhook Delivery
- Payloads signed as `Scripts-Signature: t=<timestamp>,v1=<hmac>`.
- BullMQ exponential backoff retry (5 attempts: ~2s → ~4s → ~8s → ~16s → ~32s).
- Delayed resolution job for timeout scenarios (amount 50408).

### Context-Aware AI Debugger
- Floating chat widget in the merchant dashboard.
- Fetches last 5 `ApiRequestLog` entries and injects them as LLM context.
- OpenRouter API integration with Meta Llama 3 8B Instruct (free tier).

### Magic Test Data
| Amount | Behavior | Webhook Event |
|---|---|---|
| `10,000 VND` | Instant Success | `payment_intent.succeeded` |
| `40,000 VND` | Insufficient Funds | `payment_intent.failed` |
| `50,408 VND` | 30s Bank Timeout → random resolution (70/30) | Delayed succeeded/failed |
| Any other | Default Success | `payment_intent.succeeded` |

### Public Checkout Page
- `/checkout/[intentId]` — no auth required, end-user facing.
- VietQR placeholder, simulate payment button, developer magic data banner.

## Project Structure

```
scripts/
├── apps/
│   ├── api/                    # NestJS Backend
│   │   ├── prisma/schema.prisma
│   │   └── src/
│   │       ├── app.module.ts
│   │       ├── common/         # Guards, Filters, Redis module
│   │       ├── prisma/         # PrismaService
│   │       └── modules/
│   │           ├── auth/       # Supabase JWT validation
│   │           ├── payment/    # Payment intents + Magic Test Data
│   │           ├── ledger/     # Double-entry accounting engine
│   │           ├── webhook/    # BullMQ dispatch + HMAC processor
│   │           ├── support-ai/ # OpenRouter AI debugger
│   │           └── health/     # Keep-alive endpoint
│   └── web/                    # Next.js 15 Frontend
│       └── src/
│           ├── app/
│           │   ├── (auth)/     # Login / Register
│           │   ├── dashboard/  # Auth-guarded merchant UI
│           │   ├── checkout/   # Public payment page
│           │   └── docs/       # API documentation
│           ├── components/     # Dashboard shell, AI widget, shadcn/ui
│           ├── lib/            # API client, Supabase helpers, utils
│           └── stores/         # Zustand auth store
└── packages/
    └── shared/                 # Shared types & constants
```

## Quick Start

### Prerequisites
- Node.js 18+
- A Supabase project (free tier)
- An Upstash Redis instance (free tier)

### 1. Clone & Install

```bash
git clone https://github.com/your-username/scripts.git
cd scripts
npm install
```

### 2. Environment Variables

```bash
# apps/api/.env
DATABASE_URL="postgresql://..."
DIRECT_URL="postgresql://..."
SUPABASE_URL="https://xxx.supabase.co"
SUPABASE_SERVICE_ROLE_KEY="eyJ..."
REDIS_HOST="xxx.upstash.io"
REDIS_PORT=6379
REDIS_PASSWORD="xxx"
REDIS_TLS=true
OPENROUTER_API_KEY="sk-or-..."

# apps/web/.env.local
NEXT_PUBLIC_SUPABASE_URL="https://xxx.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="eyJ..."
NEXT_PUBLIC_API_URL="http://localhost:3001"
```

### 3. Database Setup

```bash
cd apps/api
npx prisma db push
npx prisma generate
```

### 4. Run Development

```bash
# From project root — starts both apps via Turborepo
npm run dev
```

| Service | URL |
|---|---|
| Frontend | http://localhost:3000 |
| API | http://localhost:3001 |
| API Health | http://localhost:3001/api/health |

## Deployment & Hosting

Scripts_ is ready for Railway + Vercel deployment with Supabase and Upstash.

| Layer | Platform | Details |
|---|---|---|
| **Backend API** | [Railway](https://railway.app) | Deploy from repo, set root directory to `apps/api`, configure env vars in Railway dashboard. |
| **Frontend** | [Vercel](https://vercel.com) (Free) | `apps/web` auto-deployed from `main`. Env vars set in Vercel project settings. |
| **Database & Auth** | [Supabase](https://supabase.com) (Free tier) | PostgreSQL + Auth. `DATABASE_URL` uses the PgBouncer pooler URL. |
| **Cache & Queue** | [Upstash Redis](https://upstash.com) (Free tier) | Serverless Redis for idempotency barrier + BullMQ webhook queue. |
| **AI — Primary** | [Groq](https://console.groq.com) | Model: `openai/gpt-oss-20b`. 10-second timeout before failover. |
| **AI — Backup** | [OpenRouter](https://openrouter.ai) | Model: `openai/gpt-oss-20b:free`. 30-second timeout. |

### Railway Deployment Notes (API)

1. Create a new Railway service from this repository.
2. Set **Root Directory** to `apps/api`.
3. Set **Build Command** to `npm run build --workspace=@scripts-pay/api`.
4. Add a **Pre-deploy Command**:
  - `npm run prisma:push --workspace=@scripts-pay/api -- --accept-data-loss --skip-generate`
5. Set **Start Command** to `npm run start --workspace=@scripts-pay/api`.
6. Add env vars from `apps/api/.env.example`.
7. Ensure `PORT` is provided by Railway (or keep default fallback in code).

### Production Troubleshooting

#### Merchant API returns 500 (`/api/v1/merchants/*`)

Most common cause: production schema is not synced yet.

1. Confirm Railway runs Prisma schema sync before app start.
2. Confirm both `DATABASE_URL` and `DIRECT_URL` are set correctly.
3. Re-deploy and verify logs contain a successful `prisma db push` before `node dist/main`.

Affected endpoints usually include:
- `/api/v1/merchants/overview`
- `/api/v1/merchants/balance`
- `/api/v1/merchants/transactions`
- `/api/v1/merchants/keys`
- `/api/v1/merchants/profile`

#### AI requests fail after deploy

1. Verify API base URL is correct on web (`NEXT_PUBLIC_API_URL`).
2. Verify `CORS_ORIGIN` contains your web domain.
3. Verify auth headers are sent (`Authorization: Bearer <token>`).
4. Verify at least one AI provider key exists (`GROQ_API_KEY` or `OPENROUTER_API_KEY`).

### Keep-Alive (Optional)

If you want proactive uptime checks, ping `https://your-api.up.railway.app/api/health` every 10 minutes from an external cron service.

> **Total monthly cost: $0**

---

## License

MIT

---

<div align="center">
  <sub>Built with precision by <strong>Scripts_</strong> — where every cent is accounted for, twice.</sub>
</div>
