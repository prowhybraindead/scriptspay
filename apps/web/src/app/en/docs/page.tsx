import Link from "next/link";
import { ArrowRight, BadgeCheck, Bot, Code2, CreditCard, ShieldCheck, Webhook, Copy } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { CopyButton } from "@/components/copy-button";

export const metadata = {
  title: "Scripts_ | Integration Guide - Sandbox",
  description: "Next-generation payment gateway for the Vietnamese market. VietQR, e-wallets, Stripe-like DX.",
};

export default function EnDocsPage() {
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
              <p className="font-semibold text-slate-950">2. Obtain JWT from Supabase login</p>
              <p className="mt-1 leading-6">Token is returned upon successful user login. Store it in session/localStorage for API calls.</p>
            </li>
            <li className="rounded-2xl bg-slate-100/80 p-4">
              <p className="font-semibold text-slate-950">3. Send JWT in Authorization header</p>
              <p className="mt-1 leading-6">Attach token to every protected API request: <code className="text-xs font-mono">Authorization: Bearer &lt;JWT&gt;</code></p>
            </li>
            <li className="rounded-2xl bg-slate-100/80 p-4">
              <p className="font-semibold text-slate-950">4. Test complete payment flow</p>
              <p className="mt-1 leading-6">Use sandbox amounts to trigger different outcomes (see table at right).</p>
            </li>
            <li className="rounded-2xl bg-slate-100/80 p-4">
              <p className="font-semibold text-slate-950">5. Handle webhooks in your app</p>
              <p className="mt-1 leading-6">Webhooks will push updates. Verify HMAC signatures and handle idempotently.</p>
            </li>
          </ol>
        </div>

        <div className="surface-panel space-y-6 p-6">
          <div>
            <h3 className="font-semibold text-slate-950">API Base URL (Sandbox)</h3>
            <div className="mt-3 flex items-center gap-2">
              <code className="flex-1 truncate rounded bg-slate-100 px-3 py-2 text-sm font-mono text-slate-700">
                https://scripts-api.selfservice.io.vn
              </code>
              <CopyButton text="https://scripts-api.selfservice.io.vn" />
            </div>
          </div>

          <div>
            <h3 className="font-semibold text-slate-950">Test Amounts (Magic Numbers)</h3>
            <div className="mt-3 space-y-2 text-sm">
              <div className="rounded bg-green-50 p-3 border border-green-200">
                <p className="font-mono font-semibold text-green-900">10000 VND</p>
                <p className="text-green-700">✓ Payment successful</p>
              </div>
              <div className="rounded bg-yellow-50 p-3 border border-yellow-200">
                <p className="font-mono font-semibold text-yellow-900">20000 VND</p>
                <p className="text-yellow-700">⚠ Insufficient funds</p>
              </div>
              <div className="rounded bg-red-50 p-3 border border-red-200">
                <p className="font-mono font-semibold text-red-900">30000 VND</p>
                <p className="text-red-700">✗ Timeout/Network error</p>
              </div>
            </div>
          </div>

          <div>
            <h3 className="font-semibold text-slate-950">Webhook Verification</h3>
            <div className="mt-3 rounded bg-slate-100 p-3">
              <p className="text-xs text-slate-600">Header: <code className="font-mono font-semibold">X-Webhook-Signature</code></p>
              <p className="mt-2 text-xs text-slate-600">Compute HMAC-SHA256 of body with your secret key</p>
            </div>
          </div>
        </div>
      </section>

      <section className="mt-12">
        <h2 className="text-3xl font-bold tracking-[-0.03em] text-slate-950">Main API Endpoints</h2>
        <div className="mt-6 space-y-4">
          <EndpointCard
            method="GET"
            path="/api/v1/merchants/profile"
            title="Get Merchant Profile"
            description="Retrieve the current merchant profile information"
          />
          <EndpointCard
            method="GET"
            path="/api/v1/merchants/balance"
            title="Account Balance"
            description="Check available balance and pending payout amounts"
          />
          <EndpointCard
            method="GET"
            path="/api/v1/merchants/transactions"
            title="Transaction History"
            description="Fetch transaction list with filtering and pagination"
          />
          <EndpointCard
            method="GET"
            path="/api/v1/merchants/keys"
            title="API Keys"
            description="Manage your API keys for third-party integrations"
          />
          <EndpointCard
            method="POST"
            path="/api/v1/checkout/create"
            title="Create Payment Session"
            description="Create a new checkout session for your customers"
          />
        </div>
      </section>

      <section className="mt-12 rounded-2xl bg-gradient-to-r from-primary/10 to-primary/5 p-8">
        <h2 className="text-2xl font-bold text-slate-950">Support & Troubleshooting</h2>
        <p className="mt-3 text-slate-600">
          Having issues? Our AI Debugger tool can educate you on recent merchant logs. Access the developer
          console to check.
        </p>
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <div className="rounded-lg bg-white p-4">
            <p className="font-semibold text-slate-950">401 Unauthorized</p>
            <p className="mt-2 text-sm text-slate-600">JWT token expired or invalid. Refresh JWT from login session.</p>
          </div>
          <div className="rounded-lg bg-white p-4">
            <p className="font-semibold text-slate-950">403 Forbidden</p>
            <p className="mt-2 text-sm text-slate-600">Merchant lacks permission to access this resource. Check merchant permissions.</p>
          </div>
          <div className="rounded-lg bg-white p-4">
            <p className="font-semibold text-slate-950">422 Validation Error</p>
            <p className="mt-2 text-sm text-slate-600">Request data is invalid. Check API schema and data types.</p>
          </div>
          <div className="rounded-lg bg-white p-4">
            <p className="font-semibold text-slate-950">Webhooks not sending</p>
            <p className="mt-2 text-sm text-slate-600">Verify webhook URL registered in settings and ensure it's publicly accessible.</p>
          </div>
        </div>
      </section>

      <section className="mt-12 border-t pt-12">
        <h2 className="text-2xl font-bold text-slate-950">Integration Examples</h2>
        <p className="mt-3 text-slate-600 mb-6">
          Quick examples to get you started with common integration patterns.
        </p>
        
        <div className="grid gap-6 md:grid-cols-2">
          <div className="surface-panel p-6">
            <h3 className="font-semibold text-slate-950 mb-3">JavaScript/Fetch Example</h3>
            <pre className="text-xs overflow-x-auto">
<code>{`const response = await fetch(
  'https://scripts-api.selfservice.io.vn/api/v1/merchants/profile',
  {
    headers: {
      'Authorization': \`Bearer \${jwtToken}\`
    }
  }
);
const data = await response.json();`}</code>
            </pre>
          </div>

          <div className="surface-panel p-6">
            <h3 className="font-semibold text-slate-950 mb-3">Python/Requests Example</h3>
            <pre className="text-xs overflow-x-auto">
<code>{`import requests

headers = {
  'Authorization': f'Bearer {jwt_token}'
}
response = requests.get(
  'https://scripts-api.selfservice.io.vn/api/v1/merchants/profile',
  headers=headers
)
data = response.json()`}</code>
            </pre>
          </div>
        </div>
      </section>
    </main>
  );
}

function EndpointCard({
  method,
  path,
  title,
  description,
}: {
  method: string;
  path: string;
  title: string;
  description: string;
}) {
  const methodColor = {
    GET: "bg-blue-100 text-blue-700",
    POST: "bg-green-100 text-green-700",
    PATCH: "bg-yellow-100 text-yellow-700",
    DELETE: "bg-red-100 text-red-700",
  }[method] || "bg-gray-100 text-gray-700";

  return (
    <div className="surface-panel flex items-start gap-4 p-5">
      <div className={`rounded px-3 py-1 text-sm font-semibold ${methodColor}`}>{method}</div>
      <div className="flex-1">
        <p className="font-mono text-sm font-semibold text-slate-950">{path}</p>
        <p className="mt-1 text-sm font-semibold text-slate-800">{title}</p>
        <p className="mt-1 text-sm text-slate-600">{description}</p>
      </div>
    </div>
  );
}
