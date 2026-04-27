import type { Metadata } from "next";
import Link from "next/link";
import { Nav } from "@/components/nav";
import { AdBetweenContent } from "@/components/ad-slot";
import { supabase } from "@/lib/supabase";
import { getSiteVertical, getSiteBrand } from "@/lib/site";
import {
  classifyVideo,
  classifyGameSystem,
  isShort,
  VIDEO_TYPE_CONFIG,
  type VideoType,
} from "@/lib/classify";
import { GAME_SYSTEMS, getGameSystem, getSystemsForVertical } from "@/config/game-systems";
import { getCurrentVersion } from "@/lib/rules-versions";
import { Search } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export function generateMetadata(): Metadata {
  const brand = getSiteBrand();
  const config = getSiteVertical();
  const isSimRacing = config.slug === "simracing";
  const title = isSimRacing ? "Races & Replays" : "Videos";
  const description = isSimRacing
    ? "Race replays, onboards, and setup guides from the sim racing community."
    : "Board game reviews, how-to-play guides, miniatures battle reports, and tabletop video from across the hobby.";
  const url = `https://${brand.domain}/watch`;
  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      title: `${title} | ${brand.siteName}`,
      description,
      url,
      siteName: brand.siteName,
      type: "website",
      images: [{ url: "/opengraph-image", width: 1200, height: 630, alt: title }],
    },
    twitter: {
      card: "summary_large_image",
      title: `${title} | ${brand.siteName}`,
      description,
      images: ["/opengraph-image"],
    },
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
  game_system: string | null;
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
  _gameSystemId: string;
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
  if (h > 0)
    return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  return `${m}:${String(s).padStart(2, "0")}`;
}

// Pill bar order
const PILL_ORDER: (VideoType | "all")[] = [
  "all",
  "review",
  "battle-report",
  "tactics",
  "news",
  "painting",
  "lore",
];

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
    game?: string;
    page?: string;
  }>;
}) {
  const { q, faction, sort, type, game, page } = await searchParams;
  const currentPage = Math.max(1, parseInt(page ?? "1", 10) || 1);
  const PAGE_SIZE = 30;
  const config = getSiteVertical();

  const defaultType: VideoType | "all" = "all";
  const activeType: VideoType | "all" =
    type === "all"
      ? "all"
      : type && ALL_CONTENT_TYPES.includes(type as VideoType)
        ? (type as VideoType)
        : defaultType;

  const activeGame: string | "all" =
    game && game !== "all" && GAME_SYSTEMS[game] ? game : "all";

  const { data: verticalRow } = await supabase
    .from("verticals")
    .select("id")
    .eq("slug", config.slug)
    .single();

  const verticalId = verticalRow?.id;

  const { data: categories } = await supabase
    .from("categories")
    .select("id, name, slug, colour")
    .eq("vertical_id", verticalId ?? "")
    .order("name");

  let query = supabase
    .from("battle_reports")
    .select(
      `id, youtube_video_id, title, thumbnail_url, published_at, view_count, duration_seconds, game_system,
       channels ( name, thumbnail_url ),
       content_lists ( id, category_id, categories ( name, colour ) )`,
    )
    .eq("vertical_id", verticalId ?? "");

  if (activeGame !== "all") {
    query = query.eq("game_system", activeGame);
  }

  if (q) {
    query = query.ilike("title", `%${q}%`);
  }

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

  if (sort === "views") {
    query = query.order("view_count", { ascending: false });
  } else {
    query = query.order("published_at", { ascending: false });
  }

  query = query.limit(200);

  const { data: reports } = await query;
  const rawReports = (reports ?? []) as unknown as BattleReport[];

  const classified: ClassifiedReport[] = rawReports.map((r) => ({
    ...r,
    _contentType: classifyVideo(r.title, r.duration_seconds),
    _isShort: isShort(r.duration_seconds),
    _gameSystemId: r.game_system ?? classifyGameSystem(r.title),
  }));

  // Filter out shorts always, apply content type filter
  let filtered = classified.filter((r) => {
    if (r._isShort) return false;
    if (activeType !== "all" && r._contentType !== activeType) return false;
    return true;
  });

  const totalFiltered = filtered.length;
  const totalPages = Math.ceil(totalFiltered / PAGE_SIZE);
  filtered = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  // Count per type (after shorts filter)
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
    if (r._isShort) continue;
    typeCounts[r._contentType]++;
  }

  const totalCount = Object.values(typeCounts).reduce((a, b) => a + b, 0);

  const uniqueGameSystems = [
    ...new Set(classified.map((r) => r._gameSystemId)),
  ];
  const currentVersions: Record<string, { effective_date: string }> = {};
  for (const gs of uniqueGameSystems) {
    const ver = await getCurrentVersion(gs);
    if (ver) {
      currentVersions[gs] = { effective_date: ver.effective_date };
    }
  }

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

  function buildUrl(key: string, value: string | null): string {
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (faction) params.set("faction", faction);
    if (sort && sort !== "newest") params.set("sort", sort);
    if (key === "game") {
      if (value && value !== "all") params.set("game", value);
    } else if (activeGame !== "all") {
      params.set("game", activeGame);
    }
    if (key === "type") {
      if (value) params.set("type", value);
    } else if (activeType !== "all") {
      params.set("type", activeType);
    }
    const qs = params.toString();
    return `/watch${qs ? `?${qs}` : ""}`;
  }

  const isSimRacing = config.slug === "simracing";
  const isTabletop = !isSimRacing;
  const showFactionFilter = !isTabletop || Boolean(faction);

  return (
    <>
      <Nav active="watch" />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight mb-1">
            {isSimRacing ? "Races & Replays" : "Videos"}
          </h1>
          <p className="text-sm text-muted-foreground">
            {isSimRacing
              ? "Race replays, onboards, and setup guides from the sim racing community."
              : "Board game reviews, how-to-play guides, miniatures content, and tabletop video from across the hobby."}
          </p>
        </div>

        {/* ============================================================= */}
        {/* Filters — collapsed into a compact layout                      */}
        {/* ============================================================= */}
        <div className="space-y-3 mb-8">
          {/* Row 1: Search + dropdowns */}
          <form className="flex flex-wrap items-center gap-2">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                name="q"
                defaultValue={q ?? ""}
                placeholder="Search videos..."
                className="w-full rounded-lg border border-input bg-background pl-9 pr-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>

            {showFactionFilter && (
              <select
                name="faction"
                defaultValue={faction ?? ""}
                className="rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="">All Factions</option>
                {(categories ?? []).map((cat) => (
                  <option key={cat.id} value={cat.slug}>
                    {cat.name}
                  </option>
                ))}
              </select>
            )}

            <select
              name="sort"
              defaultValue={sort ?? "newest"}
              className="rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="newest">Newest</option>
              <option value="views">Most Viewed</option>
            </select>

            <button
              type="submit"
              className="rounded-lg bg-[var(--vertical-accent)] px-4 py-2 text-sm font-medium text-white hover:opacity-90 transition-opacity"
            >
              Filter
            </button>
          </form>

          {/* Row 2: Game system + content type pills in a single scrollable row */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            {/* Game system pills */}
            <Link
              href={buildUrl("game", "all")}
              className="shrink-0 inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium border transition-colors"
              style={{
                borderColor: activeGame === "all" ? "var(--vertical-accent)" : "var(--border)",
                backgroundColor: activeGame === "all" ? "var(--vertical-accent)" : "transparent",
                color: activeGame === "all" ? "#fff" : undefined,
              }}
            >
              All
            </Link>
            {getSystemsForVertical(config.slug).map((gs) => {
              const isActive = activeGame === gs.id;
              return (
                <Link
                  key={gs.id}
                  href={buildUrl("game", gs.id)}
                  className="shrink-0 inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium border transition-colors"
                  style={{
                    borderColor: isActive ? gs.colour : "var(--border)",
                    backgroundColor: isActive ? gs.colour : "transparent",
                    color: isActive ? "#fff" : undefined,
                  }}
                >
                  <span>{gs.icon}</span>
                  <span>{gs.shortName}</span>
                </Link>
              );
            })}

            {/* Divider */}
            <span className="shrink-0 w-px h-5 bg-border mx-1" />

            {/* Content type pills */}
            {PILL_ORDER.map((pill) => {
              if (pill === "all") {
                const isActive = activeType === "all";
                return (
                  <Link
                    key="all-type"
                    href={buildUrl("type", "all")}
                    className="shrink-0 inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium border transition-colors"
                    style={{
                      borderColor: isActive ? "var(--vertical-accent)" : "var(--border)",
                      backgroundColor: isActive ? "var(--vertical-accent)" : "transparent",
                      color: isActive ? "#fff" : undefined,
                    }}
                  >
                    All Types
                    <span className="opacity-60">{totalCount}</span>
                  </Link>
                );
              }

              const cfg = VIDEO_TYPE_CONFIG[pill];
              const isActive = activeType === pill;
              const count = typeCounts[pill];
              if (count === 0) return null;
              return (
                <Link
                  key={pill}
                  href={buildUrl("type", pill)}
                  className="shrink-0 inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium border transition-colors"
                  style={{
                    borderColor: isActive ? cfg.colour : "var(--border)",
                    backgroundColor: isActive ? cfg.colour : "transparent",
                    color: isActive ? "#fff" : undefined,
                  }}
                >
                  <span>{cfg.icon}</span>
                  <span className="hidden sm:inline">{cfg.label}</span>
                  <span className="opacity-60">{count}</span>
                </Link>
              );
            })}
          </div>
        </div>

        {/* Ad slot */}
        <AdBetweenContent className="mb-8" />

        {/* Video grid */}
        {filtered.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-muted-foreground text-lg">No videos found.</p>
            <p className="text-muted-foreground text-sm mt-1">
              Try adjusting your filters or check back later.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((report) => {
              const badges = getFactionBadges(report.content_lists ?? []);
              const typeConfig = VIDEO_TYPE_CONFIG[report._contentType];
              const gs = getGameSystem(report._gameSystemId);
              return (
                <Link
                  key={report.id}
                  href={`/watch/${report.youtube_video_id}`}
                  className="group"
                >
                  <Card className="overflow-hidden border-border bg-card hover:border-[var(--vertical-accent)]/40 transition-all hover:shadow-md">
                    {/* Thumbnail */}
                    <div className="relative aspect-video bg-muted">
                      {report.thumbnail_url ? (
                        <img
                          src={report.thumbnail_url}
                          alt={report.title}
                          className="w-full h-full object-cover"
                          loading="lazy"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                          No thumbnail
                        </div>
                      )}

                      {/* Game system badge */}
                      <Badge
                        className="absolute top-2 left-2 text-[10px] border-0"
                        style={{ backgroundColor: `${gs.colour}dd`, color: "#fff" }}
                      >
                        {gs.shortName}
                      </Badge>

                      {/* Content type badge */}
                      <Badge
                        className="absolute top-2 right-2 text-[10px] border-0"
                        style={{ backgroundColor: `${typeConfig.colour}dd`, color: "#fff" }}
                      >
                        {typeConfig.icon} {typeConfig.label}
                      </Badge>

                      {/* Duration */}
                      {report.duration_seconds > 0 && (
                        <span className="absolute bottom-2 right-2 bg-black/80 text-white text-[10px] font-[family-name:var(--font-mono)] px-1.5 py-0.5 rounded">
                          {formatDuration(report.duration_seconds)}
                        </span>
                      )}

                      {/* Game system accent bar */}
                      <div
                        className="absolute bottom-0 left-0 right-0 h-0.5"
                        style={{ backgroundColor: gs.colour }}
                      />
                    </div>

                    {/* Info */}
                    <CardContent className="p-3.5 space-y-2">
                      <div className="flex items-start gap-2.5">
                        {/* Channel avatar */}
                        {report.channels?.thumbnail_url ? (
                          <img
                            src={report.channels.thumbnail_url}
                            alt={report.channels.name ?? ""}
                            className="w-7 h-7 rounded-full shrink-0 mt-0.5"
                          />
                        ) : (
                          <div className="w-7 h-7 rounded-full shrink-0 mt-0.5 bg-muted flex items-center justify-center text-muted-foreground text-[10px]">
                            ?
                          </div>
                        )}

                        <div className="flex-1 min-w-0">
                          <h3 className="text-sm font-medium leading-snug line-clamp-2 group-hover:text-[var(--vertical-accent-light)] transition-colors">
                            {report.title}
                          </h3>
                          <p className="text-xs text-muted-foreground truncate mt-1">
                            {report.channels?.name ?? "Unknown channel"}
                          </p>
                          <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                            <span>
                              {formatViews(report.view_count)} &middot;{" "}
                              {formatDate(report.published_at)}
                            </span>
                            {(() => {
                              const cv = currentVersions[report._gameSystemId];
                              if (!cv) return null;
                              const isCurrent =
                                new Date(report.published_at) >=
                                new Date(cv.effective_date);
                              return (
                                <span
                                  className="inline-block w-1.5 h-1.5 rounded-full shrink-0"
                                  style={{
                                    backgroundColor: isCurrent
                                      ? "var(--success)"
                                      : "#f59e0b",
                                  }}
                                  title={
                                    isCurrent
                                      ? "Current rules"
                                      : "Points may have changed"
                                  }
                                />
                              );
                            })()}
                          </p>
                        </div>
                      </div>

                      {/* Faction badges */}
                      {badges.length > 0 && (
                        <div className="flex flex-wrap gap-1 pt-0.5">
                          {badges.map((badge) => (
                            <span
                              key={badge.name}
                              className="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium border"
                              style={{
                                borderColor:
                                  badge.colour ?? "var(--border)",
                                color: badge.colour ?? undefined,
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
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>

        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-3 mt-8">
            {currentPage > 1 && (
              <Link
                href={`/watch?${new URLSearchParams({
                  ...(type ? { type } : {}),
                  ...(game && game !== "all" ? { game } : {}),
                  ...(faction ? { faction } : {}),
                  ...(sort ? { sort } : {}),
                  ...(q ? { q } : {}),
                  page: String(currentPage - 1),
                }).toString()}`}
                className="inline-flex items-center gap-1 rounded-lg border border-border px-4 py-2 text-sm font-medium hover:bg-secondary transition-colors"
              >
                Previous
              </Link>
            )}
            <span className="text-sm text-muted-foreground">
              Page {currentPage} of {totalPages}
            </span>
            {currentPage < totalPages && (
              <Link
                href={`/watch?${new URLSearchParams({
                  ...(type ? { type } : {}),
                  ...(game && game !== "all" ? { game } : {}),
                  ...(faction ? { faction } : {}),
                  ...(sort ? { sort } : {}),
                  ...(q ? { q } : {}),
                  page: String(currentPage + 1),
                }).toString()}`}
                className="inline-flex items-center gap-1 rounded-lg border border-border px-4 py-2 text-sm font-medium hover:bg-secondary transition-colors"
              >
                Next
              </Link>
            )}
          </div>
        )}
      </main>
    </>
  );
}
