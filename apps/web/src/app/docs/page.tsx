import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";

export default function DocsPage() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-4xl font-bold tracking-tight">
          Scripts<span className="text-primary">_</span> API Documentation
        </h1>
        <p className="text-lg text-muted-foreground">
          Everything you need to integrate the Scripts Pay sandbox into your
          application.
        </p>
        <div className="flex gap-2 pt-2">
          <Badge variant="secondary">REST API</Badge>
          <Badge variant="secondary">Webhooks</Badge>
          <Badge variant="secondary">VietQR</Badge>
        </div>
      </div>

      <Separator className="my-10" />

      {/* Getting Started */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold tracking-tight">
          Getting Started
        </h2>
        <p className="text-muted-foreground">
          All API requests are made to the following base URL. In sandbox mode,
          this points to your local or hosted NestJS instance.
        </p>
        <pre className="overflow-x-auto rounded-lg border bg-muted p-4 text-sm">
          <code>
            {`BASE_URL = https://api.scriptspay.dev/api/v1

# Or for local development:
BASE_URL = http://localhost:4000/api/v1`}
          </code>
        </pre>
        <p className="text-sm text-muted-foreground">
          All endpoints return JSON. Amounts are in the smallest currency unit
          (e.g., VND has no decimal subdivision, so <code className="rounded bg-muted px-1.5 py-0.5 text-xs">10000</code> = 10,000 VND).
        </p>
      </section>

      <Separator className="my-10" />

      {/* Authentication */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold tracking-tight">
          Authentication
        </h2>
        <p className="text-muted-foreground">
          Authenticate by including your Supabase JWT in the{" "}
          <code className="rounded bg-muted px-1.5 py-0.5 text-xs">Authorization</code> header.
          You can obtain a token by signing in through the dashboard.
        </p>
        <pre className="overflow-x-auto rounded-lg border bg-muted p-4 text-sm">
          <code>
            {`curl -X POST https://api.scriptspay.dev/api/v1/payment-intents \
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer <YOUR_JWT_TOKEN>" \\
  -H "Idempotency-Key: unique-request-id-123" \\
  -d '{
    "amount": 10000,
    "currency": "VND",
    "method": "QR",
    "merchantId": "your-merchant-profile-id"
  }'`}
          </code>
        </pre>
        <div className="rounded-lg border-l-4 border-amber-500 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          <strong>Important:</strong> All mutation endpoints require an{" "}
          <code className="rounded bg-amber-100 px-1">Idempotency-Key</code>{" "}
          header. Duplicate keys within 24 hours return the cached response
          without re-processing.
        </div>
      </section>

      <Separator className="my-10" />

      {/* Webhook Verification */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold tracking-tight">
          Webhook Verification
        </h2>
        <p className="text-muted-foreground">
          Webhook payloads are signed with HMAC-SHA256. Verify the{" "}
          <code className="rounded bg-muted px-1.5 py-0.5 text-xs">Scripts-Signature</code>{" "}
          header on every delivery.
        </p>
        <pre className="overflow-x-auto rounded-lg border bg-muted p-4 text-sm">
          <code>
            {`// Header format: Scripts-Signature: t=<timestamp>,v1=<signature>

const crypto = require('crypto');

function verifyWebhook(body, header, secret) {
  const [tPart, v1Part] = header.split(',');
  const t = tPart.replace('t=', '');
  const v1 = v1Part.replace('v1=', '');

  const expected = crypto
    .createHmac('sha256', secret)
    .update(\`\${t}.\${JSON.stringify(body)}\`)
    .digest('hex');

  return crypto.timingSafeEqual(
    Buffer.from(v1), Buffer.from(expected)
  );
}`}
          </code>
        </pre>
      </section>

      <Separator className="my-10" />

      {/* Magic Test Data */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold tracking-tight">
          Magic Test Data
        </h2>
        <p className="text-muted-foreground">
          In sandbox mode, the <code className="rounded bg-muted px-1.5 py-0.5 text-xs">amount</code>{" "}
          field on a Payment Intent determines the mock outcome:
        </p>
        <div className="overflow-hidden rounded-lg border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="px-4 py-3 text-left font-medium">Amount</th>
                <th className="px-4 py-3 text-left font-medium">Behavior</th>
                <th className="px-4 py-3 text-left font-medium">Webhook Event</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b">
                <td className="px-4 py-3 font-mono">10,000 VND</td>
                <td className="px-4 py-3">
                  <Badge className="bg-green-500/10 text-green-600 hover:bg-green-500/10">
                    Instant Success
                  </Badge>
                </td>
                <td className="px-4 py-3 font-mono text-xs">
                  payment_intent.succeeded
                </td>
              </tr>
              <tr className="border-b">
                <td className="px-4 py-3 font-mono">40,000 VND</td>
                <td className="px-4 py-3">
                  <Badge className="bg-red-500/10 text-red-600 hover:bg-red-500/10">
                    Insufficient Funds
                  </Badge>
                </td>
                <td className="px-4 py-3 font-mono text-xs">
                  payment_intent.failed
                </td>
              </tr>
              <tr>
                <td className="px-4 py-3 font-mono">50,408 VND</td>
                <td className="px-4 py-3">
                  <Badge className="bg-amber-500/10 text-amber-600 hover:bg-amber-500/10">
                    Bank Timeout (30s)
                  </Badge>
                </td>
                <td className="px-4 py-3 font-mono text-xs">
                  Resolves randomly (70% success, 30% fail)
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <p className="text-sm text-muted-foreground">
          Any other amount defaults to <strong>instant success</strong>.
        </p>
      </section>

      <Separator className="my-10" />

      {/* React Component */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold tracking-tight">
          React Integration
        </h2>
        <p className="text-muted-foreground">
          Drop the checkout button into your React app to create a payment
          intent and redirect to the hosted checkout page.
        </p>
        <pre className="overflow-x-auto rounded-lg border bg-muted p-4 text-sm">
          <code>
            {`import { useState } from 'react';

function ScriptsCheckoutButton({ amount, merchantId }) {
  const [loading, setLoading] = useState(false);

  async function handleCheckout() {
    setLoading(true);
    const res = await fetch('https://api.scriptspay.dev/api/v1/payment-intents', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer <YOUR_SECRET_KEY>',
        'Idempotency-Key': crypto.randomUUID(),
      },
      body: JSON.stringify({
        amount,
        currency: 'VND',
        method: 'QR',
        merchantId,
      }),
    });

    const { id } = await res.json();
    // Redirect to hosted checkout
    window.location.href = \`https://app.scriptspay.dev/checkout/\${id}\`;
  }

  return (
    <button onClick={handleCheckout} disabled={loading}>
      {loading ? 'Processing...' : \`Pay \${amount.toLocaleString()} VND\`}
    </button>
  );
}

export default ScriptsCheckoutButton;`}
          </code>
        </pre>
      </section>

      <Separator className="my-10" />

      {/* Footer */}
      <footer className="text-center text-sm text-muted-foreground">
        <p>
          Scripts<span className="text-primary">_</span> Payment Gateway Sandbox
          &mdash; Built for the Vietnamese market.
        </p>
      </footer>
    </main>
  );
}
