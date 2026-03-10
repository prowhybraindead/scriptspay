export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-background">
      <div className="text-center space-y-6">
        <h1 className="text-6xl font-bold tracking-tight text-foreground">
          Scripts<span className="text-primary">_</span>
        </h1>
        <p className="text-xl text-muted-foreground max-w-md mx-auto">
          Enterprise-grade Payment Gateway Sandbox for the Vietnamese market.
        </p>
        <div className="flex gap-4 justify-center">
          <a
            href="/dashboard"
            className="inline-flex items-center justify-center rounded-md bg-primary px-6 py-3 text-sm font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90"
          >
            Open Dashboard
          </a>
          <a
            href="/docs"
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-6 py-3 text-sm font-medium shadow-sm transition-colors hover:bg-accent hover:text-accent-foreground"
          >
            API Docs
          </a>
        </div>
      </div>
    </main>
  );
}
