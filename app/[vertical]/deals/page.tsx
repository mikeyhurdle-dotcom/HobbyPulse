import { Nav } from "@/components/nav";

export default async function DealsPage({
  params,
}: {
  params: Promise<{ vertical: string }>;
}) {
  const { vertical } = await params;

  return (
    <>
      <Nav vertical={vertical} active="deals" />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <h1 className="text-3xl font-bold tracking-tight mb-2">Deals</h1>
        <p className="text-[var(--muted)] mb-8">
          Compare prices across retailers and find the best deals.
        </p>

        {/* Placeholder grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4 space-y-3"
            >
              <div className="aspect-square bg-[var(--surface-hover)] rounded-lg animate-pulse" />
              <div className="h-4 bg-[var(--surface-hover)] rounded w-3/4 animate-pulse" />
              <div className="flex items-center gap-2">
                <div className="h-5 bg-[var(--success)]/20 rounded w-16 animate-pulse" />
                <div className="h-3 bg-[var(--surface-hover)] rounded w-12 animate-pulse" />
              </div>
            </div>
          ))}
        </div>
      </main>
    </>
  );
}
