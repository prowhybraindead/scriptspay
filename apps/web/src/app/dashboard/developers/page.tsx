"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { apiClient } from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Copy,
  Eye,
  EyeOff,
  RefreshCw,
  Plus,
  Trash2,
  Key,
  Webhook,
} from "lucide-react";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface ApiKeys {
  publicKey: string;
  secretKey: string;
}

interface WebhookEndpoint {
  id: string;
  url: string;
  secret: string;
  isActive: boolean;
  createdAt: string;
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function maskSecret(secret: string): string {
  // Show prefix of the secret key then mask the rest
  const prefix = secret.slice(0, 8);
  return `${prefix}${"•".repeat(24)}`;
}

async function copyToClipboard(text: string) {
  await navigator.clipboard.writeText(text);
}

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */

export default function DevelopersPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Developers</h1>
        <p className="text-muted-foreground">
          Manage your API keys and webhook endpoints.
        </p>
      </div>

      <Tabs defaultValue="quickstart" className="space-y-6">
        <TabsList>
          <TabsTrigger value="quickstart" className="gap-2">
            <Plus className="h-4 w-4" />
            Quickstart
          </TabsTrigger>
          <TabsTrigger value="api-keys" className="gap-2">
            <Key className="h-4 w-4" />
            API Keys
          </TabsTrigger>
          <TabsTrigger value="webhooks" className="gap-2">
            <Webhook className="h-4 w-4" />
            Webhooks
          </TabsTrigger>
        </TabsList>

        <TabsContent value="quickstart">
          <QuickstartTab />
        </TabsContent>
        <TabsContent value="api-keys">
          <ApiKeysTab />
        </TabsContent>
        <TabsContent value="webhooks">
          <WebhooksTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}

/* ================================================================== */
/*  Quickstart Tab                                                      */
/* ================================================================== */

function QuickstartTab() {
  const [language, setLanguage] = useState<"vi" | "en">("en");

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Integration Tutorials</h2>
        <div className="flex gap-2">
          <Button
            variant={language === "vi" ? "default" : "outline"}
            onClick={() => setLanguage("vi")}
            className="text-sm"
          >
            Tiếng Việt
          </Button>
          <Button
            variant={language === "en" ? "default" : "outline"}
            onClick={() => setLanguage("en")}
            className="text-sm"
          >
            English
          </Button>
        </div>
      </div>

      {language === "vi" ? <QuickstartVietnamese /> : <QuickstartEnglish />}
    </div>
  );
}

function QuickstartVietnamese() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Bước 1: Lấy API Keys</CardTitle>
          <CardDescription>
            Truy cập tab "API Keys" để lấy khóa công khai và khóa bí mật của bạn.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-lg bg-slate-100 p-4">
            <p className="text-sm text-slate-600 font-semibold mb-2">Public Key:</p>
            <code className="text-xs text-slate-700">pk_live_xxxxxxxxxxxxx</code>
          </div>
          <div className="rounded-lg bg-slate-100 p-4">
            <p className="text-sm text-slate-600 font-semibold mb-2">Secret Key (Bảo mật):</p>
            <code className="text-xs text-slate-700">sk_live_xxxxxxxxxxxxx</code>
          </div>
          <p className="text-sm text-slate-600">
            <strong>Lưu ý:</strong> Không bao giờ để lộ Secret Key. Lưu nó trong environment variables của ứng dụng.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Bước 2: Cài Đặt SDK hoặc Gọi API Trực Tiếp</CardTitle>
          <CardDescription>
            Sử dụng JavaScript hoặc ngôn ngữ lập trình khác của bạn.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p className="text-sm font-semibold text-slate-700 mb-2">Ví dụ JavaScript:</p>
            <pre className="overflow-x-auto rounded bg-slate-900 p-4 text-xs text-slate-100">
{`// Lấy thông tin merchant
const response = await fetch(
  'https://scripts-api.selfservice.io.vn/api/v1/merchants/profile',
  {
    headers: {
      'Authorization': \`Bearer \${jwtToken}\`,
      'Content-Type': 'application/json'
    }
  }
);
const merchant = await response.json();
console.log('Merchant:', merchant);`}
            </pre>
          </div>

          <div>
            <p className="text-sm font-semibold text-slate-700 mb-2">Ví dụ Node.js:</p>
            <pre className="overflow-x-auto rounded bg-slate-900 p-4 text-xs text-slate-100">
{`const axios = require('axios');

const merchantData = await axios.get(
  'https://scripts-api.selfservice.io.vn/api/v1/merchants/profile',
  {
    headers: {
      'Authorization': \`Bearer \${jwtToken}\`
    }
  }
);
console.log('Merchant:', merchantData.data);`}
            </pre>
          </div>

          <div>
            <p className="text-sm font-semibold text-slate-700 mb-2">Ví dụ Python:</p>
            <pre className="overflow-x-auto rounded bg-slate-900 p-4 text-xs text-slate-100">
{`import requests

headers = {
    'Authorization': f'Bearer {jwt_token}'
}
response = requests.get(
    'https://scripts-api.selfservice.io.vn/api/v1/merchants/profile',
    headers=headers
)
merchant = response.json()
print('Merchant:', merchant)`}
            </pre>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Bước 3: Tạo Phiên Thanh Toán</CardTitle>
          <CardDescription>
            Khởi tạo một checkout session cho khách hàng của bạn.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <pre className="overflow-x-auto rounded bg-slate-900 p-4 text-xs text-slate-100">
{`const checkoutResponse = await fetch(
  'https://scripts-api.selfservice.io.vn/api/v1/checkout/create',
  {
    method: 'POST',
    headers: {
      'Authorization': \`Bearer \${jwtToken}\`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      amount: 10000, // VND
      currency: 'VND',
      merchantOrderId: 'order_123',
      description: 'Thanh toán cho đơn hàng'
    })
  }
);
const checkout = await checkoutResponse.json();
console.log('Checkout URL:', checkout.checkoutUrl);`}
          </pre>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Bước 4: Xử Lý Webhook</CardTitle>
          <CardDescription>
            Đăng ký webhook endpoint để nhận sự kiện thanh toán.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-slate-600">
            Truy cập tab "Webhooks" để thêm endpoint URL của bạn. Chúng tôi sẽ gửi POST request tới URL này cho mỗi sự kiện.
          </p>
          <div>
            <p className="text-sm font-semibold text-slate-700 mb-2">Ví dụ Xác Thực Webhook (Node.js):</p>
            <pre className="overflow-x-auto rounded bg-slate-900 p-4 text-xs text-slate-100">
{`const crypto = require('crypto');

function verifyWebhookSignature(payload, signature, secret) {
  const hash = crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex');
  return signature === hash;
}

// Trong route của bạn:
app.post('/webhooks/scripts-pay', (req, res) => {
  const signature = req.headers['x-webhook-signature'];
  const rawBody = req.rawBody; // Giữ raw body
  
  if (!verifyWebhookSignature(rawBody, signature, webhookSecret)) {
    return res.status(401).json({ error: 'Invalid signature' });
  }
  
  const event = req.body;
  console.log('Webhook event:', event.type);
  
  // Xử lý sự kiện
  if (event.type === 'payment.success') {
    console.log('Thanh toán thành công:', event.data);
  }
  
  res.json({ received: true });
});`}
            </pre>
          </div>
        </CardContent>
      </Card>

      <Card className="border-primary/20 bg-primary/5">
        <CardHeader>
          <CardTitle className="text-base">Các Số Tiền Test (Magic Amounts)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="rounded bg-green-50 p-3 border border-green-200">
            <p className="font-mono font-semibold text-green-900">10000 VND</p>
            <p className="text-sm text-green-700">✓ Thanh toán thành công</p>
          </div>
          <div className="rounded bg-yellow-50 p-3 border border-yellow-200">
            <p className="font-mono font-semibold text-yellow-900">20000 VND</p>
            <p className="text-sm text-yellow-700">⚠ Không đủ tiền</p>
          </div>
          <div className="rounded bg-red-50 p-3 border border-red-200">
            <p className="font-mono font-semibold text-red-900">30000 VND</p>
            <p className="text-sm text-red-700">✗ Timeout/Lỗi mạng</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Hỗ Trợ & Tài Liệu</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <p className="text-sm">
            📚 <Link href="/vi/docs" className="text-primary hover:underline">Tài liệu đầy đủ (Tiếng Việt)</Link>
          </p>
          <p className="text-sm">
            🤖 Sử dụng AI Debugger trong dashboard để nhận hỗ trợ giải thích logs.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

function QuickstartEnglish() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Step 1: Get API Keys</CardTitle>
          <CardDescription>
            Visit the "API Keys" tab to obtain your public and secret keys.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-lg bg-slate-100 p-4">
            <p className="text-sm text-slate-600 font-semibold mb-2">Public Key:</p>
            <code className="text-xs text-slate-700">pk_live_xxxxxxxxxxxxx</code>
          </div>
          <div className="rounded-lg bg-slate-100 p-4">
            <p className="text-sm text-slate-600 font-semibold mb-2">Secret Key (Keep Secure):</p>
            <code className="text-xs text-slate-700">sk_live_xxxxxxxxxxxxx</code>
          </div>
          <p className="text-sm text-slate-600">
            <strong>Important:</strong> Never expose your Secret Key. Store it in your app's environment variables.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Step 2: Install SDK or Call API Directly</CardTitle>
          <CardDescription>
            Use JavaScript, Node.js, Python, or your preferred language.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p className="text-sm font-semibold text-slate-700 mb-2">JavaScript Example:</p>
            <pre className="overflow-x-auto rounded bg-slate-900 p-4 text-xs text-slate-100">
{`// Fetch merchant profile
const response = await fetch(
  'https://scripts-api.selfservice.io.vn/api/v1/merchants/profile',
  {
    headers: {
      'Authorization': \`Bearer \${jwtToken}\`,
      'Content-Type': 'application/json'
    }
  }
);
const merchant = await response.json();
console.log('Merchant:', merchant);`}
            </pre>
          </div>

          <div>
            <p className="text-sm font-semibold text-slate-700 mb-2">Node.js Example:</p>
            <pre className="overflow-x-auto rounded bg-slate-900 p-4 text-xs text-slate-100">
{`const axios = require('axios');

const merchantData = await axios.get(
  'https://scripts-api.selfservice.io.vn/api/v1/merchants/profile',
  {
    headers: {
      'Authorization': \`Bearer \${jwtToken}\`
    }
  }
);
console.log('Merchant:', merchantData.data);`}
            </pre>
          </div>

          <div>
            <p className="text-sm font-semibold text-slate-700 mb-2">Python Example:</p>
            <pre className="overflow-x-auto rounded bg-slate-900 p-4 text-xs text-slate-100">
{`import requests

headers = {
    'Authorization': f'Bearer {jwt_token}'
}
response = requests.get(
    'https://scripts-api.selfservice.io.vn/api/v1/merchants/profile',
    headers=headers
)
merchant = response.json()
print('Merchant:', merchant)`}
            </pre>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Step 3: Create Checkout Session</CardTitle>
          <CardDescription>
            Initiate a payment checkout session for your customer.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <pre className="overflow-x-auto rounded bg-slate-900 p-4 text-xs text-slate-100">
{`const checkoutResponse = await fetch(
  'https://scripts-api.selfservice.io.vn/api/v1/checkout/create',
  {
    method: 'POST',
    headers: {
      'Authorization': \`Bearer \${jwtToken}\`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      amount: 10000, // VND
      currency: 'VND',
      merchantOrderId: 'order_123',
      description: 'Payment for order'
    })
  }
);
const checkout = await checkoutResponse.json();
console.log('Checkout URL:', checkout.checkoutUrl);`}
          </pre>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Step 4: Handle Webhooks</CardTitle>
          <CardDescription>
            Register a webhook endpoint to receive payment events.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-slate-600">
            Go to the "Webhooks" tab to add your endpoint URL. We'll send a POST request to this URL for each event.
          </p>
          <div>
            <p className="text-sm font-semibold text-slate-700 mb-2">Webhook Verification Example (Node.js):</p>
            <pre className="overflow-x-auto rounded bg-slate-900 p-4 text-xs text-slate-100">
{`const crypto = require('crypto');

function verifyWebhookSignature(payload, signature, secret) {
  const hash = crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex');
  return signature === hash;
}

// In your route:
app.post('/webhooks/scripts-pay', (req, res) => {
  const signature = req.headers['x-webhook-signature'];
  const rawBody = req.rawBody; // Keep raw body
  
  if (!verifyWebhookSignature(rawBody, signature, webhookSecret)) {
    return res.status(401).json({ error: 'Invalid signature' });
  }
  
  const event = req.body;
  console.log('Webhook event:', event.type);
  
  // Handle event
  if (event.type === 'payment.success') {
    console.log('Payment successful:', event.data);
  }
  
  res.json({ received: true });
});`}
            </pre>
          </div>
        </CardContent>
      </Card>

      <Card className="border-primary/20 bg-primary/5">
        <CardHeader>
          <CardTitle className="text-base">Test Amounts (Magic Numbers)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="rounded bg-green-50 p-3 border border-green-200">
            <p className="font-mono font-semibold text-green-900">10000 VND</p>
            <p className="text-sm text-green-700">✓ Payment successful</p>
          </div>
          <div className="rounded bg-yellow-50 p-3 border border-yellow-200">
            <p className="font-mono font-semibold text-yellow-900">20000 VND</p>
            <p className="text-sm text-yellow-700">⚠ Insufficient funds</p>
          </div>
          <div className="rounded bg-red-50 p-3 border border-red-200">
            <p className="font-mono font-semibold text-red-900">30000 VND</p>
            <p className="text-sm text-red-700">✗ Timeout/Network error</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Support & Documentation</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <p className="text-sm">
            📚 <Link href="/en/docs" className="text-primary hover:underline">Full Documentation (English)</Link>
          </p>
          <p className="text-sm">
            🤖 Use the AI Debugger in the dashboard to get help explaining logs.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

/* ================================================================== */
/*  API Keys Tab                                                       */
/* ================================================================== */

function ApiKeysTab() {
  const [keys, setKeys] = useState<ApiKeys | null>(null);
  const [loading, setLoading] = useState(true);
  const [secretRevealed, setSecretRevealed] = useState(false);
  const [rolling, setRolling] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchKeys = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await apiClient<ApiKeys>("/v1/merchants/keys");
      setKeys(data);
    } catch {
      setError("Could not load API keys from the server.");
      setKeys(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchKeys();
  }, [fetchKeys]);

  function handleCopy(value: string, label: string) {
    copyToClipboard(value);
    setCopied(label);
    setTimeout(() => setCopied(null), 2000);
  }

  async function handleRollKeys() {
    if (!confirm("Are you sure? This will invalidate your current keys immediately. All existing integrations will break until updated.")) return;
    try {
      setRolling(true);
      const data = await apiClient<ApiKeys>("/v1/merchants/keys/roll", {
        method: "POST",
      });
      setKeys(data);
      setSecretRevealed(true);
    } catch {
      toast.error("Could not rotate keys", {
        description: "The API key rotation endpoint did not complete.",
      });
    } finally {
      setRolling(false);
    }
  }

  if (loading) {
    return <KeysSkeleton />;
  }

  if (error || !keys) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">API Keys unavailable</CardTitle>
          <CardDescription>
            {error ?? "Could not load API keys for this merchant."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button variant="outline" onClick={fetchKeys}>Retry</Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Public Key */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Public Key</CardTitle>
          <CardDescription>
            Use this key in client-side code. It can only create payment
            intents.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2">
            <Input
              readOnly
              value={keys?.publicKey ?? ""}
              className="font-mono text-sm"
            />
            <Button
              variant="outline"
              size="icon"
              onClick={() => handleCopy(keys?.publicKey ?? "", "public")}
            >
              <Copy className="h-4 w-4" />
            </Button>
            {copied === "public" && (
              <span className="text-xs text-green-600">Copied!</span>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Secret Key */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Secret Key</CardTitle>
          <CardDescription>
            Use this key server-side only. Never expose it in client code.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2">
            <Input
              readOnly
              value={
                secretRevealed
                  ? keys?.secretKey ?? ""
                  : maskSecret(keys?.secretKey ?? "scripts_secret_key_")
              }
              className="font-mono text-sm"
            />
            <Button
              variant="outline"
              size="icon"
              onClick={() => setSecretRevealed((prev) => !prev)}
            >
              {secretRevealed ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => handleCopy(keys?.secretKey ?? "", "secret")}
            >
              <Copy className="h-4 w-4" />
            </Button>
            {copied === "secret" && (
              <span className="text-xs text-green-600">Copied!</span>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Danger Zone */}
      <Card className="border-destructive/30">
        <CardHeader>
          <CardTitle className="text-base text-destructive">
            Danger Zone
          </CardTitle>
          <CardDescription>
            Rolling your keys will immediately invalidate the current pair.
            Update all integrations after regenerating.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            variant="destructive"
            onClick={handleRollKeys}
            disabled={rolling}
          >
            <RefreshCw className={`mr-2 h-4 w-4 ${rolling ? "animate-spin" : ""}`} />
            {rolling ? "Rolling..." : "Roll API Keys"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

function KeysSkeleton() {
  return (
    <div className="space-y-6">
      {[1, 2].map((i) => (
        <Card key={i}>
          <CardHeader>
            <div className="h-4 w-24 animate-pulse rounded bg-muted" />
            <div className="h-3 w-48 animate-pulse rounded bg-muted" />
          </CardHeader>
          <CardContent>
            <div className="h-10 animate-pulse rounded bg-muted" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

/* ================================================================== */
/*  Webhooks Tab                                                       */
/* ================================================================== */

function WebhooksTab() {
  const [endpoints, setEndpoints] = useState<WebhookEndpoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [newUrl, setNewUrl] = useState("");
  const [adding, setAdding] = useState(false);
  const [revealedSecrets, setRevealedSecrets] = useState<Set<string>>(new Set());
  const [copied, setCopied] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchEndpoints = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await apiClient<WebhookEndpoint[]>("/v1/webhooks/endpoints");
      setEndpoints(data);
    } catch {
      setEndpoints([]);
      setError("Could not load webhook endpoints from the server.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchEndpoints();
  }, [fetchEndpoints]);

  async function handleAddEndpoint(e: React.FormEvent) {
    e.preventDefault();
    if (!newUrl.trim()) return;

    try {
      setAdding(true);
      setError(null);
      const endpoint = await apiClient<WebhookEndpoint>(
        "/v1/webhooks/endpoints",
        {
          method: "POST",
          body: JSON.stringify({ url: newUrl }),
        },
      );
      setEndpoints((prev) => [...prev, endpoint]);
      setNewUrl("");
      // Auto-reveal the new endpoint's secret so merchant can copy it
      setRevealedSecrets((prev) => new Set(prev).add(endpoint.id));
    } catch {
      toast.error("Could not add endpoint", {
        description: "Please verify the URL and try again.",
      });
    } finally {
      setAdding(false);
    }
  }

  async function handleDeleteEndpoint(id: string) {
    if (!confirm("Remove this webhook endpoint?")) return;
    try {
      await apiClient(`/v1/webhooks/endpoints/${encodeURIComponent(id)}`, {
        method: "DELETE",
      });
      setEndpoints((prev) => prev.filter((ep) => ep.id !== id));
    } catch {
      toast.error("Could not remove endpoint", {
        description: "The webhook endpoint remains active.",
      });
    }
  }

  function toggleSecret(id: string) {
    setRevealedSecrets((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function handleCopy(value: string, id: string) {
    copyToClipboard(value);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  }

  return (
    <div className="space-y-6">
      {/* Add Endpoint */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Add Endpoint</CardTitle>
          <CardDescription>
            We&apos;ll send a POST request with an HMAC-SHA256 signature to this
            URL for every payment event.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleAddEndpoint} className="flex items-end gap-3">
            <div className="flex-1 space-y-2">
              <Label htmlFor="webhook-url">Endpoint URL</Label>
              <Input
                id="webhook-url"
                type="url"
                placeholder="https://your-server.com/webhooks/scripts-pay"
                value={newUrl}
                onChange={(e) => setNewUrl(e.target.value)}
                required
              />
            </div>
            <Button type="submit" disabled={adding}>
              <Plus className="mr-2 h-4 w-4" />
              {adding ? "Adding..." : "Add"}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Endpoints Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Registered Endpoints</CardTitle>
          <CardDescription>
            Manage your webhook endpoints and signing secrets.
          </CardDescription>
        </CardHeader>
        <CardContent>
            {error && (
              <div className="mb-4 rounded-xl border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                {error}
              </div>
            )}
          {loading ? (
            <div className="h-24 animate-pulse rounded bg-muted" />
          ) : endpoints.length === 0 ? (
            <div className="flex h-24 items-center justify-center text-sm text-muted-foreground">
              No endpoints registered yet.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>URL</TableHead>
                  <TableHead>Signing Secret</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-[60px]" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {endpoints.map((ep) => (
                  <TableRow key={ep.id}>
                    <TableCell className="max-w-[260px] truncate font-mono text-xs">
                      {ep.url}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5">
                        <code className="text-xs">
                          {revealedSecrets.has(ep.id)
                            ? ep.secret
                            : maskSecret(ep.secret || "whsec___")}
                        </code>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => toggleSecret(ep.id)}
                        >
                          {revealedSecrets.has(ep.id) ? (
                            <EyeOff className="h-3.5 w-3.5" />
                          ) : (
                            <Eye className="h-3.5 w-3.5" />
                          )}
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => handleCopy(ep.secret, ep.id)}
                        >
                          <Copy className="h-3.5 w-3.5" />
                        </Button>
                        {copied === ep.id && (
                          <span className="text-xs text-green-600">Copied!</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={ep.isActive ? "default" : "secondary"}
                        className={
                          ep.isActive
                            ? "bg-green-500/10 text-green-600 hover:bg-green-500/10"
                            : ""
                        }
                      >
                        {ep.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:text-destructive"
                        onClick={() => handleDeleteEndpoint(ep.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
