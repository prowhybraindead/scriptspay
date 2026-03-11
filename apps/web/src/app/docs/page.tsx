import Link from "next/link";
import { ArrowRight, BadgeCheck, Bot, Code2, CreditCard, ShieldCheck, Webhook } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function DocsPage() {
  return (
    <main className="mx-auto max-w-6xl px-6 py-10 sm:px-8 lg:px-10">
      <section className="surface-panel overflow-hidden p-6 sm:p-8 lg:p-10">
        <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="space-y-5">
            <span className="eyebrow-label">Developer docs</span>
            <h1 className="text-4xl font-bold tracking-[-0.06em] text-slate-950 sm:text-5xl">
              Scripts<span className="text-primary">_</span> integration guide for teams shipping fast.
            </h1>
            <p className="max-w-2xl text-base leading-7 text-slate-600 sm:text-lg">
              Base URLs, auth rules, magic amounts, and webhook verification in one place with a layout
              that is easier to scan under real delivery pressure.
            </p>
            <div className="flex flex-wrap gap-2">
              <Badge variant="secondary">REST API</Badge>
              <Badge variant="secondary">Webhooks</Badge>
              <Badge variant="secondary">VietQR</Badge>
              <Badge variant="secondary">AI Debugger</Badge>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Link
                href="/dashboard/developers"
                className="inline-flex items-center justify-center rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
              >
                Open developer console
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
              <a
                href="#quickstart"
                className="inline-flex items-center justify-center rounded-full border border-slate-900/10 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:border-primary/40 hover:text-primary"
              >
                Jump to quickstart
              </a>
            </div>
          </div>

          <div className="surface-dark p-6">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
              <div className="rounded-[24px] border border-white/10 bg-white/5 p-5">
                <CreditCard className="h-5 w-5 text-cyan-200" />
                <p className="mt-4 text-lg font-semibold">One payment flow, multiple outcomes</p>
                <p className="mt-2 text-sm leading-6 text-slate-300">
                  Use deterministic sandbox amounts to test success, insufficient funds, and timeout recovery.
                </p>
              </div>
              <div className="rounded-[24px] border border-white/10 bg-white/5 p-5">
                <Webhook className="h-5 w-5 text-cyan-200" />
                <p className="mt-4 text-lg font-semibold">Webhook retries already modeled</p>
                <p className="mt-2 text-sm leading-6 text-slate-300">
                  HMAC signatures and exponential retry timing are built into the sandbox by default.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mt-8 grid gap-4 md:grid-cols-3">
        {[
          {
            title: "Auth surface",
            description: "Use Supabase JWTs with every protected request.",
            icon: ShieldCheck,
          },
          {
            title: "Payment rails",
            description: "VietQR sandbox with magic test amounts and hosted checkout.",
            icon: CreditCard,
          },
          {
            title: "Support tooling",
            description: "AI debugger can explain recent merchant logs directly from the dashboard.",
            icon: Bot,
          },
        ].map(({ title, description, icon: Icon }) => (
          <div key={title} className="surface-panel p-5">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <Icon className="h-5 w-5" />
            </div>
            <h2 className="mt-4 text-xl font-semibold tracking-[-0.03em] text-slate-950">{title}</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">{description}</p>
          </div>
        ))}
      </section>

      <section id="quickstart" className="mt-8 grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="surface-panel p-6">
          <div className="flex items-center gap-2 text-sm font-medium text-primary">
            <BadgeCheck className="h-4 w-4" />
            Quickstart flow
          </div>
          <ol className="mt-5 space-y-4 text-sm text-slate-600">
            <li className="rounded-2xl bg-slate-100/80 p-4">
              <p className="font-semibold text-slate-950">1. Point your client to the API base URL</p>
              <p className="mt-1 leading-6">Use your local URL in development or the hosted Railway domain in shared environments.</p>
            </li>
            <li className="rounded-2xl bg-slate-100/80 p-4">
              <p className="font-semibold text-slate-950">2. Attach the Supabase access token</p>
              <p className="mt-1 leading-6">Protected endpoints expect `Authorization: Bearer &lt;jwt&gt;` and an idempotency key for mutations.</p>
            </li>
            <li className="rounded-2xl bg-slate-100/80 p-4">
              <p className="font-semibold text-slate-950">3. Verify webhook signatures on every delivery</p>
              <p className="mt-1 leading-6">Trust only signed payloads and reject replays or invalid secrets.</p>
            </li>
          </ol>
        </div>

        <div className="surface-dark p-6">
          <div className="flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-slate-400">
            <Code2 className="h-4 w-4" />
            Base URL
          </div>
          <pre className="mt-4 overflow-x-auto rounded-[24px] border border-white/10 bg-black/20 p-5 text-sm text-slate-100">
            <code>
              {`BASE_URL = https://your-api-domain/api/v1

# Local development
BASE_URL = http://localhost:4000/api/v1`}
            </code>
          </pre>
          <p className="mt-4 text-sm leading-6 text-slate-300">
            All endpoints return JSON. Amounts are sent in the smallest currency unit, so `10000` means 10,000 VND.
          </p>
        </div>
      </section>

      <section className="mt-8 grid gap-6 lg:grid-cols-2">
        <div className="surface-panel p-6">
          <h2 className="text-2xl font-semibold tracking-[-0.04em] text-slate-950">Authentication</h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            Sign in through the merchant dashboard, then send the resulting access token with every protected API call.
          </p>
          <pre className="mt-5 overflow-x-auto rounded-[24px] bg-slate-950 p-5 text-sm text-slate-100">
            <code>
              {`curl -X POST https://your-api-domain/api/v1/payment-intents \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <YOUR_JWT_TOKEN>" \
  -H "Idempotency-Key: unique-request-id-123" \
  -d '{
    "amount": 10000,
    "currency": "VND",
    "method": "QR",
    "merchantId": "your-merchant-profile-id"
  }'`}
            </code>
          </pre>
        </div>

        <div className="surface-panel p-6">
          <h2 className="text-2xl font-semibold tracking-[-0.04em] text-slate-950">Webhook verification</h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            Scripts signs every webhook with HMAC-SHA256. Verify the `Scripts-Signature` header before trusting the payload.
          </p>
          <pre className="mt-5 overflow-x-auto rounded-[24px] bg-slate-950 p-5 text-sm text-slate-100">
            <code>
              {`const crypto = require("crypto");

function verifyWebhook(body, header, secret) {
  const [tPart, v1Part] = header.split(",");
  const timestamp = tPart.replace("t=", "");
  const signature = v1Part.replace("v1=", "");

  const expected = crypto
    .createHmac("sha256", secret)
    .update(\`${"${timestamp}.${JSON.stringify(body)}"}\`)
    .digest("hex");

  return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
}`}
            </code>
          </pre>
        </div>
      </section>

      <section className="mt-8 surface-panel p-6">
        <h2 className="text-2xl font-semibold tracking-[-0.04em] text-slate-950">Magic test data</h2>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          Use deterministic payment amounts to simulate outcomes without changing anything else in the request.
        </p>
        <div className="mt-5 overflow-hidden rounded-[24px] border border-slate-200">
          <table className="w-full text-sm">
            <thead className="bg-slate-100/80 text-slate-600">
              <tr>
                <th className="px-4 py-3 text-left font-medium">Amount</th>
                <th className="px-4 py-3 text-left font-medium">Behavior</th>
                <th className="px-4 py-3 text-left font-medium">Result</th>
              </tr>
            </thead>
            <tbody>
              {[
                ["10,000 VND", "Instant success", "payment_intent.succeeded"],
                ["40,000 VND", "Insufficient funds", "payment_intent.failed"],
                ["50,408 VND", "30-second timeout", "resolves randomly"],
              ].map(([amount, behavior, result]) => (
                <tr key={amount} className="border-t border-slate-200 bg-white/80">
                  <td className="px-4 py-4 font-mono text-slate-950">{amount}</td>
                  <td className="px-4 py-4 text-slate-700">{behavior}</td>
                  <td className="px-4 py-4 text-slate-500">{result}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}
