import { CheckoutCard } from "./checkout-card";

interface CheckoutPageProps {
  params: Promise<{ intentId: string }>;
}

export default async function CheckoutPage({ params }: CheckoutPageProps) {
  const { intentId } = await params;

  return (
    <main className="min-h-screen px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto grid min-h-[calc(100vh-4rem)] w-full max-w-6xl items-center gap-6 lg:grid-cols-[0.92fr_1.08fr]">
        <section className="surface-dark relative overflow-hidden p-6 sm:p-8">
          <div className="absolute -right-12 top-10 h-40 w-40 rounded-full bg-cyan-400/20 blur-3xl" />
          <div className="absolute left-0 top-0 h-full w-full grid-overlay opacity-10" />
          <div className="relative space-y-6">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Hosted checkout</p>
              <h1 className="mt-3 text-4xl font-semibold tracking-[-0.05em] text-white">
                A public payment page that still feels like a premium product surface.
              </h1>
            </div>
            <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
              {[
                "Intent-aware checkout state",
                "VietQR sandbox signals",
                "Fast status feedback for customer demos",
              ].map((item) => (
                <div key={item} className="rounded-[22px] border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-200">
                  {item}
                </div>
              ))}
            </div>
          </div>
        </section>
        <CheckoutCard intentId={intentId} />
      </div>
    </main>
  );
}
