import Link from "next/link";
import { ArrowRight, Bot, ChartColumn, Code2, ShieldCheck, Sparkles } from "lucide-react";

const featureCards = [
  {
    title: "Payments that feel alive",
    description:
      "Hosted checkout, VietQR simulation, and deterministic sandbox outcomes for faster QA loops.",
    icon: ChartColumn,
  },
  {
    title: "AI support with context",
    description:
      "Explain failed requests from the last merchant logs instead of guessing from a generic error code.",
    icon: Bot,
  },
  {
    title: "Developer-first rails",
    description:
      "Webhook retries, idempotency, and docs designed for teams shipping integrations under pressure.",
    icon: Code2,
  },
];

const metrics = [
  { label: "Sandbox success profile", value: "99.92%", note: "predictable flows for QA" },
  { label: "Webhook retry window", value: "62s", note: "exponential delivery backoff" },
  { label: "Debug turnaround", value: "< 1m", note: "with contextual AI prompts" },
];

export default function Home() {
  return (
    <main className="relative overflow-hidden">
      <div className="absolute inset-0 grid-overlay opacity-50" />
      <div className="relative mx-auto flex min-h-screen w-full max-w-7xl flex-col px-6 pb-16 pt-6 sm:px-8 lg:px-10">
        <header className="flex items-center justify-between py-4">
          <div className="eyebrow-label">
            <Sparkles className="h-3.5 w-3.5 text-primary" />
            Scripts Pay Sandbox
          </div>
          <div className="flex items-center gap-3 text-sm">
            <Link href="/docs" className="text-slate-600 transition-colors hover:text-slate-950">
              Docs
            </Link>
            <Link
              href="/login"
              className="inline-flex items-center rounded-full border border-slate-900/10 bg-white/80 px-4 py-2 font-medium text-slate-700 transition hover:border-primary/30 hover:text-primary"
            >
              Sign in
            </Link>
          </div>
        </header>

        <section className="grid flex-1 items-center gap-8 py-10 lg:grid-cols-[1.15fr_0.85fr] lg:py-20">
          <div className="space-y-8">
            <div className="space-y-5">
              <span className="eyebrow-label">
                <ShieldCheck className="h-3.5 w-3.5 text-primary" />
                Zero-dollar fintech reference stack
              </span>
              <h1 className="max-w-4xl text-5xl font-bold tracking-[-0.06em] text-slate-950 sm:text-6xl lg:text-7xl">
                Build payment flows that look polished before they ever touch real money.
              </h1>
              <p className="max-w-2xl text-lg leading-8 text-slate-600 sm:text-xl">
                Scripts_ gives your team a fast sandbox for VietQR checkout, ledger simulation,
                webhooks, and AI-assisted debugging in one surface that actually feels product-ready.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <Link
                href="/dashboard"
                className="inline-flex items-center justify-center rounded-full bg-slate-950 px-6 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
              >
                Open dashboard
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
              <Link
                href="/docs"
                className="inline-flex items-center justify-center rounded-full border border-slate-900/10 bg-white/85 px-6 py-3 text-sm font-semibold text-slate-700 transition hover:border-primary/40 hover:text-primary"
              >
                Explore API docs
              </Link>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              {metrics.map((metric) => (
                <div key={metric.label} className="surface-panel metric-glow p-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-slate-500">{metric.label}</p>
                  <p className="mt-3 text-3xl font-bold tracking-[-0.05em] text-slate-950">{metric.value}</p>
                  <p className="mt-1 text-sm text-slate-600">{metric.note}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="surface-dark relative overflow-hidden p-6 sm:p-8">
            <div className="absolute right-0 top-0 h-28 w-28 rounded-full bg-emerald-400/25 blur-3xl" />
            <div className="absolute bottom-0 left-0 h-32 w-32 rounded-full bg-cyan-400/20 blur-3xl" />
            <div className="relative space-y-6">
              <div className="flex items-center justify-between text-xs uppercase tracking-[0.2em] text-slate-400">
                <span>Merchant Control Room</span>
                <span>Live Sandbox</span>
              </div>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-1">
                {featureCards.map(({ title, description, icon: Icon }) => (
                  <div key={title} className="rounded-[24px] border border-white/10 bg-white/5 p-5 backdrop-blur-md">
                    <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-2xl bg-white/10">
                      <Icon className="h-5 w-5 text-cyan-200" />
                    </div>
                    <h2 className="text-lg font-semibold text-white">{title}</h2>
                    <p className="mt-2 text-sm leading-6 text-slate-300">{description}</p>
                  </div>
                ))}
              </div>
              <div className="rounded-[24px] border border-emerald-300/20 bg-emerald-300/10 p-5 text-sm text-emerald-50">
                <p className="font-semibold uppercase tracking-[0.18em] text-emerald-200">Current sandbox status</p>
                <p className="mt-3 text-2xl font-semibold tracking-[-0.04em]">AI debugger, checkout, docs, and merchant tools in one deploy.</p>
                <p className="mt-2 text-emerald-100/80">
                  Built for internal demos, partner onboarding, and testing transaction edge cases without
                  burning time in mocks that feel fake.
                </p>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
