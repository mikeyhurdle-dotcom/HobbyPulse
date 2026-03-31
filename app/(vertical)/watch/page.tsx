import type { Metadata } from "next";
import Link from "next/link";
import { Nav } from "@/components/nav";
import { AdBetweenContent } from "@/components/ad-slot";
import { supabase } from "@/lib/supabase";
import { getSiteVertical, getSiteBrand } from "@/lib/site";
import {
  classifyVideo,
  isShort,
  VIDEO_TYPE_CONFIG,
  type VideoType,
} from "@/lib/classify";

export function generateMetadata(): Metadata {
  const brand = getSiteBrand();
  const config = getSiteVertical();
  return {
    title: `Watch Battle Reports`,
    description: config.watchDescription,
    openGraph: {
      title: `Watch Battle Reports | ${brand.siteName}`,
      description: config.watchDescription,
    },
    twitter: { card: "summary_large_image" },
  };
}

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

interface ClassifiedReport extends BattleReport {
  _contentType: VideoType;
  _isShort: boolean;
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

// All valid content type keys for filtering
const ALL_CONTENT_TYPES: VideoType[] = [
  "battle-report",
  "news",
  "tactics",
  "painting",
  "review",
  "lore",
  "other",
];

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default async function WatchPage({
  searchParams,
}: {
  searchParams: Promise<{
    q?: string;
    faction?: string;
    sort?: string;
    type?: string;
    shorts?: string;
  }>;
}) {
  const { q, faction, sort, type, shorts } = await searchParams;
  const config = getSiteVertical();

  const activeType = type && ALL_CONTENT_TYPES.includes(type as VideoType)
    ? (type as VideoType)
    : null;
  const includeShorts = shorts === "true";

  // Fetch the vertical_id
  const { data: verticalRow } = await supabase
    .from("verticals")
    .select("id")
    .eq("slug", config.slug)
    .single();

  const verticalId = verticalRow?.id;

  // Fetch categories for the filter dropdown
  const { data: categories } = await supabase
    .from("categories")
    .select("id, name, slug, colour")
    .eq("vertical_id", verticalId ?? "")
    .order("name");

  // Build the battle_reports query — fetch more so we can filter client-side
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

  // Fetch extra to allow for filtering
  query = query.limit(200);

  const { data: reports } = await query;
  const rawReports = (reports ?? []) as unknown as BattleReport[];

  // Classify at display time (migration may not have run yet)
  const classified: ClassifiedReport[] = rawReports.map((r) => ({
    ...r,
    _contentType: classifyVideo(r.title, r.duration_seconds),
    _isShort: isShort(r.duration_seconds),
  }));

  // Apply content type + shorts filters
  let filtered = classified.filter((r) => {
    if (!includeShorts && r._isShort) return false;
    if (activeType && r._contentType !== activeType) return false;
    return true;
  });

  // Cap at 30 after filtering
  filtered = filtered.slice(0, 30);

  // Count per type (before filtering by type, but after shorts filter)
  const typeCounts: Record<VideoType, number> = {
    "battle-report": 0,
    news: 0,
    tactics: 0,
    painting: 0,
    review: 0,
    lore: 0,
    other: 0,
  };
  for (const r of classified) {
    if (!includeShorts && r._isShort) continue;
    typeCounts[r._contentType]++;
  }

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

  /** Build a URL preserving current search params but setting/removing one key. */
  function buildUrl(key: string, value: string | null): string {
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (faction) params.set("faction", faction);
    if (sort && sort !== "newest") params.set("sort", sort);
    if (key === "type") {
      if (value) params.set("type", value);
    } else if (activeType) {
      params.set("type", activeType);
    }
    if (key === "shorts") {
      if (value === "true") params.set("shorts", "true");
    } else if (includeShorts) {
      params.set("shorts", "true");
    }
    const qs = params.toString();
    return `/watch${qs ? `?${qs}` : ""}`;
  }

  return (
    <>
      <Nav active="watch" />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <h1 className="text-3xl font-bold tracking-tight mb-2">Watch</h1>
        <p className="text-[var(--muted)] mb-6">
          {config.watchDescription}
        </p>

        {/* Filter bar */}
        <form className="flex flex-wrap gap-3 mb-4">
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

        {/* Content type pill bar */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 mb-2 scrollbar-none">
          {/* All pill */}
          <Link
            href={buildUrl("type", null)}
            className="shrink-0 inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium border transition-colors"
            style={{
              borderColor: !activeType ? "var(--vertical-accent)" : "var(--border)",
              backgroundColor: !activeType ? "var(--vertical-accent)" : "transparent",
              color: !activeType ? "#fff" : "var(--muted)",
            }}
          >
            All
            <span className="opacity-70">
              {Object.values(typeCounts).reduce((a, b) => a + b, 0)}
            </span>
          </Link>

          {ALL_CONTENT_TYPES.map((ct) => {
            const cfg = VIDEO_TYPE_CONFIG[ct];
            const isActive = activeType === ct;
            const count = typeCounts[ct];
            return (
              <Link
                key={ct}
                href={buildUrl("type", ct)}
                className="shrink-0 inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium border transition-colors"
                style={{
                  borderColor: isActive ? cfg.colour : "var(--border)",
                  backgroundColor: isActive ? cfg.colour : "transparent",
                  color: isActive ? "#fff" : "var(--muted)",
                }}
              >
                <span>{cfg.icon}</span>
                <span>{cfg.label}</span>
                <span className="opacity-70">{count}</span>
              </Link>
            );
          })}
        </div>

        {/* Include Shorts toggle */}
        <div className="flex items-center gap-2 mb-8">
          <Link
            href={buildUrl("shorts", includeShorts ? null : "true")}
            className="inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-medium border transition-colors"
            style={{
              borderColor: includeShorts ? "var(--vertical-accent)" : "var(--border)",
              backgroundColor: includeShorts ? "var(--vertical-accent)" : "transparent",
              color: includeShorts ? "#fff" : "var(--muted)",
            }}
          >
            <span className="inline-block w-3 h-3 rounded-sm border" style={{
              borderColor: includeShorts ? "#fff" : "var(--border-light)",
              backgroundColor: includeShorts ? "#fff" : "transparent",
            }} />
            Include Shorts
          </Link>
        </div>

        {/* Ad slot */}
        <AdBetweenContent className="mb-8" />

        {/* Video grid */}
        {filtered.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-[var(--muted)] text-lg">No videos found.</p>
            <p className="text-[var(--muted)] text-sm mt-1">
              Try adjusting your filters or check back later.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {filtered.map((report) => {
              const badges = getFactionBadges(report.content_lists ?? []);
              const typeConfig = VIDEO_TYPE_CONFIG[report._contentType];
              return (
                <Link
                  key={report.id}
                  href={`/watch/${report.youtube_video_id}`}
                  className="group rounded-xl border border-[var(--border)] bg-[var(--surface)] overflow-hidden transition-all duration-200 hover:scale-[1.02] hover:border-[var(--border-light)] hover:shadow-lg hover:shadow-[var(--accent-glow)]"
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

                    {/* Content type badge — top-left */}
                    <span
                      className="absolute top-2 left-2 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold text-white backdrop-blur-sm"
                      style={{ backgroundColor: `${typeConfig.colour}cc` }}
                    >
                      <span>{typeConfig.icon}</span>
                      <span>{typeConfig.label}</span>
                    </span>

                    {/* Duration badge — bottom-right */}
                    {report.duration_seconds > 0 && (
                      <span className="absolute bottom-2 right-2 bg-black/80 text-white text-xs font-[family-name:var(--font-mono)] px-1.5 py-0.5 rounded">
                        {formatDuration(report.duration_seconds)}
                      </span>
                    )}
                  </div>

                  {/* Info */}
                  <div className="p-4 space-y-2">
                    {/* Title + channel avatar row */}
                    <div className="flex items-start gap-3">
                      {/* Channel avatar */}
                      {report.channels?.thumbnail_url ? (
                        <img
                          src={report.channels.thumbnail_url}
                          alt={report.channels.name ?? ""}
                          className="w-8 h-8 rounded-full shrink-0 mt-0.5"
                        />
                      ) : (
                        <div className="w-8 h-8 rounded-full shrink-0 mt-0.5 bg-[var(--surface-hover)] flex items-center justify-center text-[var(--muted)] text-xs">
                          ?
                        </div>
                      )}

                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-medium leading-snug line-clamp-2 group-hover:text-[var(--vertical-accent-light)] transition-colors">
                          {report.title}
                        </h3>

                        {/* Channel name */}
                        <p className="text-xs text-[var(--muted)] truncate mt-1">
                          {report.channels?.name ?? "Unknown channel"}
                        </p>

                        {/* Views + date */}
                        <p className="text-xs text-[var(--muted)]">
                          {formatViews(report.view_count)} &middot; {formatDate(report.published_at)}
                        </p>
                      </div>
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
