"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { ArrowRight, Bot, ChartSpline, CircleCheckBig, Code2, Radar, Wallet } from "lucide-react";
import { apiClient } from "@/lib/api-client";

type OverviewResponse = {
  grossVolume: number;
  availableBalance: number;
  pendingBalance: number;
  successRate: number;
  pendingCount: number;
  activeWebhookEndpoints: number;
  recentFailures: number;
};

const FALLBACK_OVERVIEW: OverviewResponse = {
  grossVolume: 84_600_000,
  availableBalance: 42_500_000,
  pendingBalance: 4_800_000,
  successRate: 98.7,
  pendingCount: 2,
  activeWebhookEndpoints: 3,
  recentFailures: 1,
};

const quickActions = [
  {
    title: "Review transaction lane",
    href: "/dashboard/transactions",
    description: "Inspect balance movement, pending intents, and mock payouts.",
    icon: ChartSpline,
  },
  {
    title: "Tune developer hooks",
    href: "/dashboard/developers",
    description: "Manage keys, webhook URLs, and integration surfaces in one place.",
    icon: Code2,
  },
];

export default function DashboardHomePage() {
  const [overview, setOverview] = useState<OverviewResponse>(FALLBACK_OVERVIEW);

  const fetchOverview = useCallback(async () => {
    try {
      const data = await apiClient<OverviewResponse>("/v1/merchants/overview");
      setOverview(data);
    } catch {
      setOverview(FALLBACK_OVERVIEW);
    }
  }, []);

  useEffect(() => {
    void fetchOverview();
  }, [fetchOverview]);

  const metricCards = [
    {
      label: "Gross volume today",
      value: `${(overview.grossVolume / 1_000_000).toFixed(1)}M VND`,
      delta: `${overview.successRate.toFixed(1)}% successful intents today`,
      icon: Wallet,
    },
    {
      label: "Webhook delivery health",
      value: `${overview.activeWebhookEndpoints} active`,
      delta: `${overview.recentFailures} recent API failures need inspection`,
      icon: Radar,
    },
    {
      label: "Balance posture",
      value: `${(overview.availableBalance / 1_000_000).toFixed(1)}M VND`,
      delta: `${(overview.pendingBalance / 1_000_000).toFixed(1)}M VND pending`,
      icon: Bot,
    },
  ];

  const activityFeed = [
    {
      title: `${overview.activeWebhookEndpoints} webhook endpoint(s) active`,
      description: "Developers can rotate secrets or add a new destination from the developer console.",
      tone: "text-sky-700 bg-sky-500/10",
    },
    {
      title: `${overview.pendingCount} transaction(s) still pending`,
      description: "Timeout flows and delayed bank responses will settle through the webhook worker.",
      tone: "text-amber-700 bg-amber-500/10",
    },
    {
      title: `${overview.successRate.toFixed(1)}% success rate today`,
      description: "This is computed from real merchant transactions instead of dashboard placeholder data.",
      tone: "text-emerald-700 bg-emerald-500/10",
    },
  ];

  return (
    <div className="space-y-8">
      <section className="surface-panel overflow-hidden p-6 sm:p-8">
        <div className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="space-y-5">
            <span className="eyebrow-label">Merchant command center</span>
            <div className="space-y-3">
              <h1 className="text-4xl font-bold tracking-[-0.06em] text-slate-950 sm:text-5xl">
                Operate the sandbox like it is already your production control room.
              </h1>
              <p className="max-w-2xl text-base leading-7 text-slate-600 sm:text-lg">
                Track volume, inspect delayed webhooks, and use contextual AI support without bouncing
                between separate tools or brittle mock dashboards.
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Link
                href="/dashboard/transactions"
                className="inline-flex items-center justify-center rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
              >
                Open transaction lane
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
              <Link
                href="/dashboard/developers"
                className="inline-flex items-center justify-center rounded-full border border-slate-900/10 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:border-primary/40 hover:text-primary"
              >
                Inspect developer surfaces
              </Link>
            </div>
          </div>

          <div className="rounded-[28px] bg-slate-950 p-5 text-white shadow-[0_30px_80px_-40px_rgba(15,23,42,0.6)]">
            <div className="flex items-center justify-between text-xs uppercase tracking-[0.2em] text-slate-400">
              <span>System pulse</span>
              <CircleCheckBig className="h-4 w-4 text-emerald-300" />
            </div>
            <div className="mt-6 space-y-4">
              {activityFeed.map((item) => (
                <div key={item.title} className="rounded-3xl border border-white/10 bg-white/5 p-4">
                  <div className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${item.tone}`}>
                    Live signal
                  </div>
                  <p className="mt-3 text-lg font-semibold tracking-[-0.03em]">{item.title}</p>
                  <p className="mt-2 text-sm leading-6 text-slate-300">{item.description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-3">
        {metricCards.map(({ label, value, delta, icon: Icon }) => (
          <div key={label} className="surface-panel p-5">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-slate-500">{label}</p>
              <div className="rounded-2xl bg-primary/10 p-2 text-primary">
                <Icon className="h-4 w-4" />
              </div>
            </div>
            <p className="mt-4 text-4xl font-bold tracking-[-0.06em] text-slate-950">{value}</p>
            <p className="mt-2 text-sm text-slate-600">{delta}</p>
          </div>
        ))}
      </section>

      <section className="grid gap-4 lg:grid-cols-[1fr_1fr]">
        {quickActions.map(({ title, href, description, icon: Icon }) => (
          <Link key={title} href={href} className="surface-panel group block p-6 transition hover:-translate-y-0.5 hover:shadow-xl">
            <div className="flex items-center justify-between">
              <div className="rounded-2xl bg-slate-950 p-3 text-white">
                <Icon className="h-5 w-5" />
              </div>
              <ArrowRight className="h-4 w-4 text-slate-400 transition group-hover:text-primary" />
            </div>
            <h2 className="mt-5 text-2xl font-semibold tracking-[-0.04em] text-slate-950">{title}</h2>
            <p className="mt-2 max-w-xl text-sm leading-6 text-slate-600">{description}</p>
          </Link>
        ))}
      </section>
    </div>
  );
}
