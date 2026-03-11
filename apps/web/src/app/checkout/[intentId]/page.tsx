import { CheckoutCard } from "./checkout-card";

interface CheckoutPageProps {
  params: Promise<{ intentId: string }>;
}

export default async function CheckoutPage({ params }: CheckoutPageProps) {
  const { intentId } = await params;

  return (
    <main className="min-h-screen bg-[#020617] px-4 py-8 sm:px-6 lg:px-8">
      <div className="pointer-events-none fixed inset-0">
        <div className="absolute left-0 top-0 h-72 w-72 rounded-full bg-cyan-400/25 blur-3xl" />
        <div className="absolute bottom-0 right-0 h-80 w-80 rounded-full bg-fuchsia-500/20 blur-3xl" />
      </div>

      <div className="relative mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-6xl items-center">
        <CheckoutCard intentId={intentId} />
      </div>
    </main>
  );
}
