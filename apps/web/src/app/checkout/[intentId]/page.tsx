import { CheckoutCard } from "./checkout-card";

interface CheckoutPageProps {
  params: Promise<{ intentId: string }>;
}

export default async function CheckoutPage({ params }: CheckoutPageProps) {
  const { intentId } = await params;

  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 px-4 py-12">
      <CheckoutCard intentId={intentId} />
    </main>
  );
}
