"use client";

import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Home,
  ArrowLeftRight,
  Code2,
  Settings,
  LogOut,
  Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ScriptsLogoIcon } from "@/components/scripts-logo";

const sidebarLinks = [
  { href: "/dashboard", label: "Home", icon: Home },
  { href: "/dashboard/transactions", label: "Transactions", icon: ArrowLeftRight },
  { href: "/dashboard/developers", label: "Developers", icon: Code2 },
  { href: "/dashboard/settings", label: "Settings", icon: Settings },
];

export function DashboardShell({
  children,
  userEmail,
}: {
  children: React.ReactNode;
  userEmail: string;
}) {
  const router = useRouter();
  const pathname = usePathname();

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
  }

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Sidebar */}
      <aside className="hidden w-64 flex-col border-r bg-card md:flex">
        <div className="flex h-16 items-center px-5">
          <Link
            href="/dashboard"
            className="flex items-center gap-3 text-xl font-semibold tracking-tight text-[#1A2B47]"
          >
            <ScriptsLogoIcon className="h-9 w-9" />
            <span className="text-[24px] leading-none">
              Scripts<span className="text-[#10B981]">_</span>
            </span>
          </Link>
        </div>
        <Separator />
        <nav className="flex-1 space-y-1 px-3 py-4">
          {sidebarLinks.map(({ href, label, icon: Icon }) => {
            const isActive =
              href === "/dashboard"
                ? pathname === "/dashboard"
                : pathname.startsWith(href);

            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                )}
              >
                <Icon className="h-4 w-4" />
                {label}
              </Link>
            );
          })}
        </nav>
        <Separator />
        <div className="px-3 py-4">
          <Button
            variant="ghost"
            className="w-full justify-start gap-3 text-muted-foreground"
            onClick={handleLogout}
          >
            <LogOut className="h-4 w-4" />
            Logout
          </Button>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Top header */}
        <header className="flex h-14 items-center justify-between border-b bg-card px-6">
          <div className="flex items-center gap-3">
            <Badge
              variant="secondary"
              className="gap-1 bg-amber-500/10 text-amber-600 hover:bg-amber-500/10"
            >
              <Zap className="h-3 w-3" />
              Sandbox
            </Badge>
            <span className="text-xs text-muted-foreground">Test Mode</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">{userEmail}</span>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-auto p-6">{children}</main>
      </div>
    </div>
  );
}
