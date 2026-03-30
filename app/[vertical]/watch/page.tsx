import { Nav } from "@/components/nav";

export default async function WatchPage({
  params,
}: {
  params: Promise<{ vertical: string }>;
}) {
  const { vertical } = await params;

  return (
    <>
      <Nav vertical={vertical} active="watch" />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <h1 className="text-3xl font-bold tracking-tight mb-2">Watch</h1>
        <p className="text-[var(--muted)] mb-8">
          Battle reports and content — enriched with structured army lists.
        </p>

        {/* Placeholder grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="rounded-xl border border-[var(--border)] bg-[var(--surface)] overflow-hidden"
            >
              <div className="aspect-video bg-[var(--surface-hover)] animate-pulse" />
              <div className="p-4 space-y-2">
                <div className="h-4 bg-[var(--surface-hover)] rounded w-3/4 animate-pulse" />
                <div className="h-3 bg-[var(--surface-hover)] rounded w-1/2 animate-pulse" />
              </div>
            </div>
          ))}
        </div>
      </main>
    </>
  );
}
