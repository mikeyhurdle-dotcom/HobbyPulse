import Link from "next/link";
import { Nav } from "@/components/nav";
import { supabase } from "@/lib/supabase";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface BattleReport {
  id: string;
  youtube_video_id: string;
  title: string;
  thumbnail_url: string | null;
  published_at: string;
  view_count: number;
  duration_seconds: number;
  channels: {
    name: string;
    thumbnail_url: string | null;
  } | null;
  content_lists: {
    id: string;
    category_id: string | null;
    categories: {
      name: string;
      colour: string | null;
    } | null;
  }[];
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays}d ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`;
  if (diffDays < 365) return `${Math.floor(diffDays / 30)}mo ago`;
  return `${Math.floor(diffDays / 365)}y ago`;
}

function formatViews(count: number): string {
  if (count >= 1_000_000) return `${(count / 1_000_000).toFixed(1)}M views`;
  if (count >= 1_000) return `${(count / 1_000).toFixed(1)}K views`;
  return `${count} views`;
}

function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  return `${m}:${String(s).padStart(2, "0")}`;
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default async function WatchPage({
  params,
  searchParams,
}: {
  params: Promise<{ vertical: string }>;
  searchParams: Promise<{ q?: string; faction?: string; sort?: string }>;
}) {
  const { vertical } = await params;
  const { q, faction, sort } = await searchParams;

  // Fetch the vertical_id
  const { data: verticalRow } = await supabase
    .from("verticals")
    .select("id")
    .eq("slug", vertical)
    .single();

  const verticalId = verticalRow?.id;

  // Fetch categories for the filter dropdown
  const { data: categories } = await supabase
    .from("categories")
    .select("id, name, slug, colour")
    .eq("vertical_id", verticalId ?? "")
    .order("name");

  // Build the battle_reports query
  let query = supabase
    .from("battle_reports")
    .select(
      `id, youtube_video_id, title, thumbnail_url, published_at, view_count, duration_seconds,
       channels ( name, thumbnail_url ),
       content_lists ( id, category_id, categories ( name, colour ) )`,
    )
    .eq("vertical_id", verticalId ?? "");

  // Search filter
  if (q) {
    query = query.ilike("title", `%${q}%`);
  }

  // Faction filter — filter by category_id on the joined content_lists
  if (faction) {
    const matchedCategory = categories?.find((c) => c.slug === faction);
    if (matchedCategory) {
      query = query.filter(
        "content_lists.category_id",
        "eq",
        matchedCategory.id,
      );
    }
  }

  // Sort
  if (sort === "views") {
    query = query.order("view_count", { ascending: false });
  } else {
    query = query.order("published_at", { ascending: false });
  }

  query = query.limit(30);

  const { data: reports } = await query;
  const battleReports = (reports ?? []) as unknown as BattleReport[];

  // Deduplicate faction badges per report
  const getFactionBadges = (
    lists: BattleReport["content_lists"],
  ): { name: string; colour: string | null }[] => {
    const seen = new Set<string>();
    const badges: { name: string; colour: string | null }[] = [];
    for (const list of lists) {
      if (list.categories && !seen.has(list.categories.name)) {
        seen.add(list.categories.name);
        badges.push(list.categories);
      }
    }
    return badges;
  };

  return (
    <>
      <Nav vertical={vertical} active="watch" />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <h1 className="text-3xl font-bold tracking-tight mb-2">Watch</h1>
        <p className="text-[var(--muted)] mb-6">
          Battle reports and content — enriched with structured army lists.
        </p>

        {/* Filter bar */}
        <form className="flex flex-wrap gap-3 mb-8">
          {/* Search */}
          <input
            type="text"
            name="q"
            defaultValue={q ?? ""}
            placeholder="Search videos..."
            className="flex-1 min-w-[200px] rounded-lg border border-[var(--border)] bg-[var(--surface)] px-4 py-2 text-sm text-[var(--foreground)] placeholder:text-[var(--muted)] focus:outline-none focus:ring-2 focus:ring-[var(--vertical-accent)] focus:border-transparent"
          />

          {/* Faction dropdown */}
          <select
            name="faction"
            defaultValue={faction ?? ""}
            className="rounded-lg border border-[var(--border)] bg-[var(--surface)] px-4 py-2 text-sm text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--vertical-accent)]"
          >
            <option value="">All Factions</option>
            {(categories ?? []).map((cat) => (
              <option key={cat.id} value={cat.slug}>
                {cat.name}
              </option>
            ))}
          </select>

          {/* Sort */}
          <select
            name="sort"
            defaultValue={sort ?? "newest"}
            className="rounded-lg border border-[var(--border)] bg-[var(--surface)] px-4 py-2 text-sm text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--vertical-accent)]"
          >
            <option value="newest">Newest</option>
            <option value="views">Most Viewed</option>
          </select>

          <button
            type="submit"
            className="rounded-lg bg-[var(--vertical-accent)] px-5 py-2 text-sm font-medium text-white hover:opacity-90 transition-opacity"
          >
            Filter
          </button>
        </form>

        {/* Video grid */}
        {battleReports.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-[var(--muted)] text-lg">No videos found.</p>
            <p className="text-[var(--muted)] text-sm mt-1">
              Try adjusting your filters or check back later.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {battleReports.map((report) => {
              const badges = getFactionBadges(report.content_lists ?? []);
              return (
                <Link
                  key={report.id}
                  href={`/${vertical}/watch/${report.youtube_video_id}`}
                  className="group rounded-xl border border-[var(--border)] bg-[var(--surface)] overflow-hidden hover:border-[var(--border-light)] hover:bg-[var(--surface-hover)] transition-all"
                >
                  {/* Thumbnail */}
                  <div className="relative aspect-video bg-[var(--surface-hover)]">
                    {report.thumbnail_url ? (
                      <img
                        src={report.thumbnail_url}
                        alt={report.title}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-[var(--muted)]">
                        No thumbnail
                      </div>
                    )}
                    {/* Duration badge */}
                    {report.duration_seconds > 0 && (
                      <span className="absolute bottom-2 right-2 bg-black/80 text-white text-xs font-[family-name:var(--font-mono)] px-1.5 py-0.5 rounded">
                        {formatDuration(report.duration_seconds)}
                      </span>
                    )}
                  </div>

                  {/* Info */}
                  <div className="p-4 space-y-2">
                    <h3 className="text-sm font-medium leading-snug line-clamp-2 group-hover:text-[var(--vertical-accent-light)] transition-colors">
                      {report.title}
                    </h3>

                    {/* Channel + meta */}
                    <div className="flex items-center gap-2">
                      {report.channels?.thumbnail_url && (
                        <img
                          src={report.channels.thumbnail_url}
                          alt={report.channels.name ?? ""}
                          className="w-5 h-5 rounded-full"
                        />
                      )}
                      <span className="text-xs text-[var(--muted)] truncate">
                        {report.channels?.name ?? "Unknown channel"}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-xs text-[var(--muted)]">
                      <span>{formatViews(report.view_count)}</span>
                      <span>-</span>
                      <span>{formatDate(report.published_at)}</span>
                    </div>

                    {/* Faction badges */}
                    {badges.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {badges.map((badge) => (
                          <span
                            key={badge.name}
                            className="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium border"
                            style={{
                              borderColor: badge.colour ?? "var(--border-light)",
                              color: badge.colour ?? "var(--muted)",
                              backgroundColor: badge.colour
                                ? `${badge.colour}15`
                                : "transparent",
                            }}
                          >
                            {badge.name}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </main>
    </>
  );
}
