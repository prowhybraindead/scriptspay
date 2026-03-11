"use client";

import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { apiClient } from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { toast } from "sonner";
import { Bell, Building2, Mail, ShieldCheck } from "lucide-react";

export default function SettingsPage() {
  const [currentEmail, setCurrentEmail] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [profileName, setProfileName] = useState("Scripts Merchant Lab");
  const [taxId, setTaxId] = useState("");
  const [supportEmail, setSupportEmail] = useState("ops@scriptspay.dev");
  const [statementDescriptor, setStatementDescriptor] = useState("SCRIPTS SANDBOX");
  const [kycStatus, setKycStatus] = useState("pending");
  const [profileSaving, setProfileSaving] = useState(false);
  const [notificationMode, setNotificationMode] = useState<"all" | "critical" | "none">("critical");

  const loadMerchantProfile = useCallback(async () => {
    try {
      const profile = await apiClient<{
        businessName: string;
        taxId: string | null;
        kycStatus: string;
        supportEmail: string | null;
        statementDescriptor: string | null;
        notificationMode: "all" | "critical" | "none";
      }>("/v1/merchants/profile");
      setProfileName(profile.businessName);
      setTaxId(profile.taxId ?? "");
      setSupportEmail(profile.supportEmail ?? "ops@scriptspay.dev");
      setStatementDescriptor(profile.statementDescriptor ?? "SCRIPTS SANDBOX");
      setKycStatus(profile.kycStatus);
      setNotificationMode(profile.notificationMode);
    } catch {
      setKycStatus("pending");
    }
  }, []);

  useEffect(() => {
    const supabase = createClient();

    const loadCurrentUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user?.email) {
        setCurrentEmail(user.email);
        setNewEmail(user.email);
      }
    };

    void loadCurrentUser();
    void loadMerchantProfile();
  }, [loadMerchantProfile]);

  async function handleChangeEmail(e: React.FormEvent) {
    e.preventDefault();

    if (!newEmail || newEmail === currentEmail) {
      toast.error("Please enter a different email address.");
      return;
    }

    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({ email: newEmail });

    if (error) {
      toast.error(error.message);
      setLoading(false);
      return;
    }

    toast.success("Email change requested. Confirmation links were sent to both your old and new email addresses.");
    setLoading(false);
  }

  async function handleSaveProfile(e: React.FormEvent) {
    e.preventDefault();
    try {
      setProfileSaving(true);
      const profile = await apiClient<{
        businessName: string;
        taxId: string | null;
        kycStatus: string;
        supportEmail: string | null;
        statementDescriptor: string | null;
        notificationMode: "all" | "critical" | "none";
      }>("/v1/merchants/profile", {
        method: "PATCH",
        body: JSON.stringify({
          businessName: profileName,
          taxId,
          supportEmail,
          statementDescriptor,
        }),
      });
      setProfileName(profile.businessName);
      setTaxId(profile.taxId ?? "");
      setSupportEmail(profile.supportEmail ?? supportEmail);
      setStatementDescriptor(profile.statementDescriptor ?? statementDescriptor);
      setKycStatus(profile.kycStatus);
      setNotificationMode(profile.notificationMode);
      toast.success("Merchant profile updated", {
        description: "Your sandbox-facing identity details have been saved.",
      });
    } catch {
      toast.error("Could not save profile", {
        description: "The API did not accept the update. Please try again.",
      });
    } finally {
      setProfileSaving(false);
    }
  }

  async function handleSaveNotifications() {
    try {
      await apiClient("/v1/merchants/profile", {
        method: "PATCH",
        body: JSON.stringify({ notificationMode }),
      });
      toast.success("Notification preferences saved", {
        description: `You will now receive ${notificationMode} alerts from the merchant control room.`,
      });
    } catch {
      toast.error("Could not save notification mode", {
        description: "Please try again in a moment.",
      });
    }
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-[-0.05em] text-slate-950">Settings</h1>
        <p className="text-muted-foreground">
          Manage your merchant identity, alert posture, and account security from one place.
        </p>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <div className="space-y-6">
          <Card className="rounded-[28px] border-white/70 bg-white/88 shadow-[0_20px_50px_-30px_rgba(15,23,42,0.28)]">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="rounded-2xl bg-primary/10 p-2 text-primary">
                  <Building2 className="h-4 w-4" />
                </div>
                <div>
                  <CardTitle>Merchant profile</CardTitle>
                  <CardDescription>
                    Tune the public-facing identity shown in your sandbox payment experiences.
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <form onSubmit={handleSaveProfile}>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="profile-name">Display name</Label>
                  <Input
                    id="profile-name"
                    value={profileName}
                    onChange={(e) => setProfileName(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="support-email">Merchant tax ID</Label>
                  <Input
                    id="support-email"
                    value={taxId}
                    onChange={(e) => setTaxId(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="support-email-address">Support email</Label>
                  <Input
                    id="support-email-address"
                    type="email"
                    value={supportEmail}
                    onChange={(e) => setSupportEmail(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="statement-descriptor">Statement descriptor</Label>
                  <Input
                    id="statement-descriptor"
                    value={statementDescriptor}
                    onChange={(e) => setStatementDescriptor(e.target.value)}
                    maxLength={22}
                  />
                </div>
                <div className="rounded-[22px] bg-slate-100/80 px-4 py-3 text-sm text-slate-600">
                  <p className="font-semibold text-slate-950">KYC status</p>
                  <p className="mt-1 capitalize">{kycStatus}</p>
                </div>
              </CardContent>
              <CardFooter>
                <Button type="submit" className="rounded-full bg-slate-950 hover:bg-slate-800" disabled={profileSaving}>
                  {profileSaving ? "Saving..." : "Save profile"}
                </Button>
              </CardFooter>
            </form>
          </Card>

          <Card className="rounded-[28px] border-white/70 bg-white/88 shadow-[0_20px_50px_-30px_rgba(15,23,42,0.28)]">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="rounded-2xl bg-primary/10 p-2 text-primary">
                  <Bell className="h-4 w-4" />
                </div>
                <div>
                  <CardTitle>Alert posture</CardTitle>
                  <CardDescription>
                    Choose how noisy the sandbox should be when payment flows or webhooks drift.
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {[
                ["all", "All activity", "Receive delivery, retry, and payment status updates."],
                ["critical", "Critical only", "Focus on failed intents, auth issues, and delivery exhaustion."],
                ["none", "Quiet mode", "Use the dashboard only when you want to inspect incidents manually."],
              ].map(([value, label, description]) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setNotificationMode(value as typeof notificationMode)}
                  className={`w-full rounded-[22px] border px-4 py-4 text-left transition ${
                    notificationMode === value
                      ? "border-primary bg-primary/10"
                      : "border-slate-200 bg-slate-50/70 hover:border-primary/30"
                  }`}
                >
                  <p className="font-semibold text-slate-950">{label}</p>
                  <p className="mt-1 text-sm leading-6 text-slate-600">{description}</p>
                </button>
              ))}
            </CardContent>
            <CardFooter>
              <Button type="button" variant="outline" className="rounded-full" onClick={handleSaveNotifications}>
                Save notifications
              </Button>
            </CardFooter>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="rounded-[28px] border-white/70 bg-white/88 shadow-[0_20px_50px_-30px_rgba(15,23,42,0.28)]">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="rounded-2xl bg-primary/10 p-2 text-primary">
                  <ShieldCheck className="h-4 w-4" />
                </div>
                <div>
                  <CardTitle>Security settings</CardTitle>
                  <CardDescription>
                    Update your sign-in email. Supabase requires confirmation from both addresses.
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <form onSubmit={handleChangeEmail}>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="current-email">Current email</Label>
                  <Input id="current-email" type="email" value={currentEmail} disabled />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="new-email">New email</Label>
                  <Input
                    id="new-email"
                    type="email"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    required
                    autoComplete="email"
                  />
                </div>
              </CardContent>
              <CardFooter>
                <Button type="submit" disabled={loading} className="rounded-full bg-slate-950 hover:bg-slate-800">
                  {loading ? "Sending confirmation..." : "Change email"}
                </Button>
              </CardFooter>
            </form>
          </Card>

          <Card className="rounded-[28px] border-white/70 bg-slate-950 text-white shadow-[0_20px_50px_-28px_rgba(15,23,42,0.48)]">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="rounded-2xl bg-white/10 p-2 text-cyan-200">
                  <Mail className="h-4 w-4" />
                </div>
                <div>
                  <CardTitle>Operational note</CardTitle>
                  <CardDescription className="text-slate-300">
                    Keep this account close to the deploy pipeline and webhook endpoints.
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3 text-sm leading-6 text-slate-300">
              <p>
                The more realistic your merchant profile and alert posture are here, the easier it becomes to demo checkout,
                retries, and support flows as if the product were already live.
              </p>
              <p>
                Use this page as the operational source of truth for sandbox-facing identities instead of scattering them across env files and screenshots.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
