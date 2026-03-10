"use client";

import { useCallback, useEffect, useState } from "react";
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

      <Tabs defaultValue="api-keys" className="space-y-6">
        <TabsList>
          <TabsTrigger value="api-keys" className="gap-2">
            <Key className="h-4 w-4" />
            API Keys
          </TabsTrigger>
          <TabsTrigger value="webhooks" className="gap-2">
            <Webhook className="h-4 w-4" />
            Webhooks
          </TabsTrigger>
        </TabsList>

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
/*  API Keys Tab                                                       */
/* ================================================================== */

function ApiKeysTab() {
  const [keys, setKeys] = useState<ApiKeys | null>(null);
  const [loading, setLoading] = useState(true);
  const [secretRevealed, setSecretRevealed] = useState(false);
  const [rolling, setRolling] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);

  const fetchKeys = useCallback(async () => {
    try {
      setLoading(true);
      const data = await apiClient<ApiKeys>("/v1/merchants/keys");
      setKeys(data);
    } catch {
      // If no keys exist yet, use placeholder to show structure
      setKeys({
        publicKey: "scripts_public_key_placeholder",
        secretKey: "scripts_secret_key_placeholder",
      });
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
      // noop — endpoint may not be implemented yet
    } finally {
      setRolling(false);
    }
  }

  if (loading) {
    return <KeysSkeleton />;
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
                  : maskSecret(keys?.secretKey ?? "scripts_secret_key_")}
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

  const fetchEndpoints = useCallback(async () => {
    try {
      setLoading(true);
      const data = await apiClient<WebhookEndpoint[]>("/v1/webhooks/endpoints");
      setEndpoints(data);
    } catch {
      setEndpoints([]);
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
      // noop — endpoint may not be implemented yet
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
      // noop
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
