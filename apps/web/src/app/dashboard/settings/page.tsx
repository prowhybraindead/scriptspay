"use client";

import { useEffect, useState } from "react";
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

export default function SettingsPage() {
  const [currentEmail, setCurrentEmail] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [loading, setLoading] = useState(false);

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
  }, []);

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

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">
          Manage your account security and identity details.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Security Settings</CardTitle>
          <CardDescription>
            Update your sign-in email. Supabase requires confirmation from both addresses.
          </CardDescription>
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
            <Button type="submit" disabled={loading}>
              {loading ? "Sending confirmation..." : "Change email"}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
