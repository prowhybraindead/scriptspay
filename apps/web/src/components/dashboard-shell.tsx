"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import {
  Home,
  ArrowLeftRight,
  Code2,
  Settings,
  LogOut,
  Zap,
  Menu,
  Sparkles,
  LifeBuoy,
  Activity,
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

  useEffect(() => {
    const supabase = createClient();
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") {
        router.push("/update-password");
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [router]);

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
  }

  function SidebarContent() {
    return (
      <>
        <div className="flex h-16 items-center px-5">
          <Link
            href="/dashboard"
            className="flex items-center gap-3 text-xl font-semibold tracking-tight text-slate-950"
          >
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-950 text-white shadow-lg shadow-teal-800/15">
              <ScriptsLogoIcon className="h-6 w-6" />
            </span>
            <span className="text-[24px] leading-none">
              Scripts<span className="text-primary">_</span>
            </span>
          </Link>
        </div>
        <Separator className="bg-slate-200/80" />
        <div className="px-4 py-4">
          <div className="rounded-[24px] border border-slate-200 bg-white/90 p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium uppercase tracking-[0.2em] text-slate-500">
                Sandbox lane
              </span>
              <Badge className="bg-emerald-500/10 text-emerald-700 hover:bg-emerald-500/10">
                Stable
              </Badge>
            </div>
            <p className="mt-4 text-xl font-semibold tracking-[-0.04em] text-slate-950">
              Ship the integration surface before the real rails arrive.
            </p>
            <div className="mt-4 flex items-center gap-2 rounded-2xl bg-slate-950 px-3 py-2 text-sm text-slate-100">
              <Activity className="h-4 w-4 text-emerald-300" />
              AI support, checkout, and webhooks are online.
            </div>
          </div>
        </div>
        <nav className="flex-1 space-y-1 px-3 py-2">
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
                  "flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition-all",
                  isActive
                    ? "bg-slate-950 text-white shadow-lg shadow-slate-900/10"
                    : "text-slate-600 hover:bg-white/80 hover:text-slate-950",
                )}
              >
                <Icon className="h-4 w-4" />
                {label}
              </Link>
            );
          })}
        </nav>
        <div className="px-3 pb-3">
          <div className="rounded-[24px] border border-dashed border-slate-300 bg-white/70 p-4 text-sm text-slate-600">
            <div className="flex items-center gap-2 text-slate-950">
              <LifeBuoy className="h-4 w-4 text-primary" />
              Need a fast read on an error?
            </div>
            <p className="mt-2 leading-6">Use the AI widget in the corner to inspect your latest merchant requests.</p>
          </div>
        </div>
        <Separator className="bg-slate-200/80" />
        <div className="px-3 py-4">
          <Button
            variant="ghost"
            className="w-full justify-start gap-3 rounded-2xl text-slate-600 hover:bg-white hover:text-slate-950"
            onClick={handleLogout}
          >
            <LogOut className="h-4 w-4" />
            Logout
          </Button>
        </div>
      </>
    );
  }

  return (
    <div className="flex min-h-screen bg-transparent">
      <aside className="hidden w-[310px] flex-col border-r border-white/60 bg-slate-100/65 backdrop-blur-xl md:flex">
        <SidebarContent />
      </aside>

      <div className="flex min-h-screen flex-1 flex-col overflow-hidden">
        <header className="sticky top-0 z-30 border-b border-white/60 bg-background/75 px-4 py-4 backdrop-blur-xl sm:px-6 lg:px-8">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="outline" size="icon" className="rounded-2xl border-white/70 bg-white/80 md:hidden">
                    <Menu className="h-4 w-4" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="border-r border-white/70 bg-slate-100/95 p-0">
                  <div className="flex h-full flex-col">
                    <SidebarContent />
                  </div>
                </SheetContent>
              </Sheet>
              <div>
                <p className="text-xs font-medium uppercase tracking-[0.22em] text-slate-500">Merchant ops</p>
                <h1 className="text-lg font-semibold tracking-[-0.04em] text-slate-950">Control room</h1>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Badge className="hidden gap-1 rounded-full bg-amber-500/10 px-3 py-1 text-amber-700 hover:bg-amber-500/10 sm:inline-flex">
                <Zap className="h-3.5 w-3.5" />
                Sandbox mode
              </Badge>
              <div className="hidden rounded-full border border-white/70 bg-white/80 px-4 py-2 text-sm text-slate-600 sm:block">
                {userEmail}
              </div>
              <Button variant="outline" className="rounded-full border-white/70 bg-white/80 text-slate-700 hover:bg-white">
                <Sparkles className="mr-2 h-4 w-4 text-primary" />
                Ship faster
              </Button>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-auto px-4 py-6 sm:px-6 lg:px-8">{children}</main>
      </div>
    </div>
  );
}
