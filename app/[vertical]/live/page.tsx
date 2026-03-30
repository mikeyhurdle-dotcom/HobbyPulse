import { Nav } from "@/components/nav";

export default async function LivePage({
  params,
}: {
  params: Promise<{ vertical: string }>;
}) {
  const { vertical } = await params;

  return (
    <>
      <Nav vertical={vertical} active="live" />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <div className="flex items-center gap-3 mb-2">
          <h1 className="text-3xl font-bold tracking-tight">Live</h1>
          <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[var(--danger)]/10 text-[var(--danger)] text-xs font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-[var(--danger)] animate-pulse" />
            0 streams
          </span>
        </div>
        <p className="text-[var(--muted)] mb-8">
          Live streams from Twitch and YouTube — updated every 5 minutes.
        </p>

        {/* Empty state */}
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-16 h-16 rounded-2xl bg-[var(--surface)] border border-[var(--border)] flex items-center justify-center mb-4">
            <span className="text-2xl text-[var(--muted)]">●</span>
          </div>
          <p className="text-[var(--muted)] text-sm">
            No live streams right now. Check back soon.
          </p>
        </div>
      </main>
    </>
  );
}
