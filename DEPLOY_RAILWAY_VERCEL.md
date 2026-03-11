# Railway + Vercel Deployment Checklist

This checklist is optimized for this monorepo structure.

## 1. Deploy API on Railway

1. Create a new service from this repository.
2. Set Root Directory to `apps/api`.
3. Build Command: `npm run build --workspace=apps/api`.
4. Start Command: `npm run start:prod --workspace=apps/api`.
5. Add API env vars from `apps/api/.env.example`.

Required API env vars:
- `DATABASE_URL` (Supabase pooler, port 6543, include `sslmode=require`)
- `DIRECT_URL` (direct connection, include `sslmode=require`)
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `REDIS_HOST`
- `REDIS_PORT`
- `REDIS_PASSWORD`
- `REDIS_TLS=true`
- `OPENROUTER_API_KEY` and/or `GROQ_API_KEY`
- `CORS_ORIGIN` (comma-separated list of allowed web origins)

Notes:
- `PORT` is injected by Railway. Keep fallback in code for local only.
- API routes are served under `/api/*` (global prefix in NestJS).

## 2. Deploy Web on Vercel

1. Import this repository into Vercel.
2. Set Root Directory to `apps/web`.
3. Framework preset: Next.js.
4. Add web env vars:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `NEXT_PUBLIC_API_URL` set to your Railway API domain (for example `https://your-api.up.railway.app`).

Note:
- The web API client auto-appends `/api` if not present.

## 3. Domain + CORS

Set `CORS_ORIGIN` on Railway API to include all web origins that call the API.

Examples:
- `https://your-web.vercel.app`
- `https://scriptspay.selfservice.io.vn`

Multiple origins example:
- `https://your-web.vercel.app,https://scriptspay.selfservice.io.vn`

## 4. Post-Deploy Verification

1. Check API health: `GET https://your-api.up.railway.app/api/health`.
2. Login on web and open dashboard.
3. Send a message in AI widget.
4. In browser devtools, verify request:
- URL: `.../api/v1/ai/debug`
- Header contains `Authorization: Bearer <access_token>`
- Status is `200`

## 5. If AI Chat Returns 401

1. Confirm user is logged in on web and token exists in Supabase session.
2. Confirm API has correct `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`.
3. Confirm `NEXT_PUBLIC_API_URL` points to current Railway API service.
4. Confirm `CORS_ORIGIN` includes the exact frontend origin.
5. Sign out and sign in again to refresh token.

## 6. Security Follow-up

If any secrets were shared in logs, chats, or screenshots:

1. Rotate Supabase service role key.
2. Rotate DB password and update `DATABASE_URL` and `DIRECT_URL`.
3. Rotate Upstash password and AI provider keys.
4. Redeploy API and web with updated environment variables.