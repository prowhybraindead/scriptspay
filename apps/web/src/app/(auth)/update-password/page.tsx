"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
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

export default function UpdatePasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);
  const [hasSession, setHasSession] = useState(false);

  useEffect(() => {
    const supabase = createClient();

    const queryType = new URLSearchParams(window.location.search).get("type");
    const hashType = new URLSearchParams(window.location.hash.replace("#", "")).get("type");
    const isRecoveryAttempt = queryType === "recovery" || hashType === "recovery";

    const validateSession = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (session) {
        setHasSession(true);
        setChecking(false);
        return;
      }

      if (!isRecoveryAttempt) {
        setChecking(false);
      }
    };

    void validateSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "PASSWORD_RECOVERY" || !!session) {
        setHasSession(true);
        setChecking(false);
      }
    });

    const timeout = window.setTimeout(() => {
      setChecking(false);
    }, 4000);

    return () => {
      subscription.unsubscribe();
      window.clearTimeout(timeout);
    };
  }, []);

  async function handleUpdatePassword(e: React.FormEvent) {
    e.preventDefault();

    if (!hasSession) {
      toast.error("This page requires a valid recovery session.");
      return;
    }

    if (password.length < 8) {
      toast.error("Password must be at least 8 characters.");
      return;
    }

    if (password !== confirmPassword) {
      toast.error("Passwords do not match.");
      return;
    }

    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({ password });

    if (error) {
      toast.error(error.message);
      setLoading(false);
      return;
    }

    toast.success("Password updated successfully. Please sign in again.");
    await supabase.auth.signOut();
    router.push("/login");
  }

  if (checking) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4">
        <Card className="w-full max-w-md">
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            Verifying secure recovery session...
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!hasSession) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-xl">Invalid or expired link</CardTitle>
            <CardDescription>
              Request a new password reset link to continue.
            </CardDescription>
          </CardHeader>
          <CardFooter className="justify-center pb-8">
            <Button asChild>
              <Link href="/reset-password">Request new reset link</Link>
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold tracking-tight">
            Set a new password
          </CardTitle>
          <CardDescription>
            Choose a strong password for your Scripts_ account.
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleUpdatePassword}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="password">New password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
                autoComplete="new-password"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm-password">Confirm new password</Label>
              <Input
                id="confirm-password"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                minLength={8}
                autoComplete="new-password"
              />
            </div>
          </CardContent>
          <CardFooter>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Updating password..." : "Update password"}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
