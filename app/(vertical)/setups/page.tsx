import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Nav } from "@/components/nav";
import { supabase } from "@/lib/supabase";
import { getSiteVertical, getSiteBrand } from "@/lib/site";
import { SIMRACING_SYSTEMS } from "@/config/game-systems";

// ---------------------------------------------------------------------------
// Metadata
// ---------------------------------------------------------------------------

export async function generateMetadata(): Promise<Metadata> {
  const brand = getSiteBrand();
  return {
    title: `Car Setups | ${brand.siteName}`,
    description: `Browse extracted car setups from sim racing videos — filter by sim, car, and track.`,
  };
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default async function SetupsPage({
  searchParams,
}: {
  searchParams: Promise<{ sim?: string; car?: string; track?: string; q?: string }>;
}) {
  const config = getSiteVertical();

  // Only available for simracing vertical
  if (config.slug !== "simracing") {
    redirect("/watch");
  }

  const params = await searchParams;
  const filterSim = params.sim ?? "";
  const filterCar = params.car ?? "";
  const filterTrack = params.track ?? "";
  const searchQuery = params.q ?? "";

  // Look up the vertical ID
  const { data: verticalRow } = await supabase
    .from("verticals")
    .select("id")
    .eq("slug", config.slug)
    .single();

  // Build query — join through battle_reports to get thumbnail + video info
  let query = supabase
    .from("car_setups")
    .select(
      `id, sim, car, track, setup_data, hardware_mentioned, confidence,
       battle_reports!inner (
         id, youtube_video_id, title, thumbnail_url, published_at,
         vertical_id
       )`,
    )
    .order("created_at", { ascending: false })
    .limit(60);

  // Filter by vertical
  if (verticalRow) {
    query = query.eq("battle_reports.vertical_id", verticalRow.id);
  }

  if (filterSim) {
    query = query.ilike("sim", `%${filterSim}%`);
  }
  if (filterCar || searchQuery) {
    const carSearch = filterCar || searchQuery;
    query = query.ilike("car", `%${carSearch}%`);
  }
  if (filterTrack) {
    query = query.ilike("track", `%${filterTrack}%`);
  }

  const { data: setups } = await query;

  // Extract unique values for filter dropdowns
  const { data: allSetups } = await supabase
    .from("car_setups")
    .select("sim, car, track");

  const uniqueSims = [...new Set((allSetups ?? []).map((s) => s.sim))].filter(Boolean).sort();
  const uniqueCars = [...new Set((allSetups ?? []).map((s) => s.car))].filter(Boolean).sort();
  const uniqueTracks = [...new Set((allSetups ?? []).map((s) => s.track).filter(Boolean) as string[])].sort();

  const brand = getSiteBrand();

  return (
    <>
      <Nav active="setups" />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <div className="space-y-6">
          {/* Header */}
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
              Car Setups
            </h1>
            <p className="text-sm text-[var(--muted)] mt-1">
              Setups extracted from video descriptions — filtered by sim, car, and track.
            </p>
          </div>

          {/* Filters */}
          <form className="flex flex-wrap gap-3 items-end">
            {/* Sim filter */}
            <div className="space-y-1">
              <label className="text-xs font-medium text-[var(--muted)]">Sim</label>
              <select
                name="sim"
                defaultValue={filterSim}
                className="rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm"
              >
                <option value="">All sims</option>
                {uniqueSims.map((sim) => (
                  <option key={sim} value={sim}>
                    {sim}
                  </option>
                ))}
              </select>
            </div>

            {/* Car search */}
            <div className="space-y-1">
              <label className="text-xs font-medium text-[var(--muted)]">Car</label>
              <input
                name="q"
                type="text"
                placeholder="Search car..."
                defaultValue={searchQuery || filterCar}
                className="rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm w-48"
              />
            </div>

            {/* Track filter */}
            <div className="space-y-1">
              <label className="text-xs font-medium text-[var(--muted)]">Track</label>
              <select
                name="track"
                defaultValue={filterTrack}
                className="rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm"
              >
                <option value="">All tracks</option>
                {uniqueTracks.map((track) => (
                  <option key={track} value={track}>
                    {track}
                  </option>
                ))}
              </select>
            </div>

            <button
              type="submit"
              className="rounded-lg bg-[var(--vertical-accent)] px-4 py-2 text-sm font-medium text-white hover:opacity-90 transition-opacity"
            >
              Filter
            </button>

            {(filterSim || filterCar || filterTrack || searchQuery) && (
              <Link
                href="/setups"
                className="rounded-lg border border-[var(--border)] px-4 py-2 text-sm font-medium text-[var(--muted)] hover:text-[var(--foreground)] transition-colors"
              >
                Clear
              </Link>
            )}
          </form>

          {/* Results grid */}
          {!setups || setups.length === 0 ? (
            <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-12 text-center">
              <p className="text-sm text-[var(--muted)]">
                No setups found matching your filters.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {(setups as any[]).map((setup) => {
                const report = setup.battle_reports;
                const simKey = setup.sim?.toLowerCase().replace(/\s+/g, "") ?? "";
                const simSystem = SIMRACING_SYSTEMS[simKey];
                const simColour = simSystem?.colour ?? "var(--vertical-accent)";

                return (
                  <Link
                    key={setup.id}
                    href={`/watch/${report?.youtube_video_id}`}
                    className="group rounded-xl border border-[var(--border)] bg-[var(--surface)] overflow-hidden hover:border-[var(--vertical-accent)] transition-colors"
                  >
                    {/* Thumbnail */}
                    {report?.thumbnail_url && (
                      <div className="aspect-video overflow-hidden bg-black">
                        <img
                          src={report.thumbnail_url}
                          alt={report.title ?? setup.car}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      </div>
                    )}

                    <div className="p-4 space-y-2">
                      {/* Sim badge + car */}
                      <div className="flex items-center gap-2 flex-wrap">
                        <span
                          className="inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-bold text-white"
                          style={{ backgroundColor: simColour }}
                        >
                          {setup.sim}
                        </span>
                        <span className="text-sm font-medium truncate">
                          {setup.car}
                        </span>
                      </div>

                      {/* Track */}
                      {setup.track && (
                        <p className="text-xs text-[var(--muted)]">
                          {setup.track}
                        </p>
                      )}

                      {/* Setup data preview */}
                      {setup.setup_data && Object.keys(setup.setup_data).length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {Object.entries(setup.setup_data as Record<string, string>)
                            .slice(0, 4)
                            .map(([key, value]) => {
                              const label = key
                                .replace(/([A-Z])/g, " $1")
                                .replace(/^./, (s: string) => s.toUpperCase())
                                .trim();
                              return (
                                <span
                                  key={key}
                                  className="text-[10px] text-[var(--muted)] bg-[var(--surface-hover)] rounded px-1.5 py-0.5"
                                >
                                  {label}: {value}
                                </span>
                              );
                            })}
                          {Object.keys(setup.setup_data).length > 4 && (
                            <span className="text-[10px] text-[var(--muted)]">
                              +{Object.keys(setup.setup_data).length - 4} more
                            </span>
                          )}
                        </div>
                      )}

                      {/* Video title */}
                      {report?.title && (
                        <p className="text-xs text-[var(--muted)] truncate mt-1">
                          {report.title}
                        </p>
                      )}
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </main>
    </>
  );
}
