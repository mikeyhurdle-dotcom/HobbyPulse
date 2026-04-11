import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Nav } from "@/components/nav";
import { supabase } from "@/lib/supabase";
import { getSiteVertical, getSiteBrand } from "@/lib/site";
import { Search, ArrowLeft, ExternalLink, Play } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { BoardGameContentType } from "@/lib/board-game-classify";

export const revalidate = 1800;

export async function generateMetadata(): Promise<Metadata> {
  const brand = getSiteBrand();
  return {
    title: `Board Game Videos | ${brand.siteName}`,
    description:
      "Reviews, playthroughs, how-to-play guides, and top lists from the best board game YouTube channels.",
    openGraph: {
      title: `Board Game Videos | ${brand.siteName}`,
      description:
        "Reviews, playthroughs, how-to-play guides, and top lists from the best board game channels.",
      type: "website",
    },
  };
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface BoardGameVideo {
  id: string;
  youtube_video_id: string;
  title: string;
  thumbnail_url: string | null;
  published_at: string;
  duration_seconds: number | null;
  view_count: number | null;
  content_type: string | null;
  board_game_channels: {
    channel_name: string;
  } | null;
}

// ---------------------------------------------------------------------------
// Content type config (colour + label + icon)
// ---------------------------------------------------------------------------

const CONTENT_TYPE_CONFIG: Record<
  BoardGameContentType,
  { label: string; colour: string; icon: string }
> = {
  review: { label: "Review", colour: "#3b82f6", icon: "★" },
  "top-list": { label: "Top List", colour: "#8b5cf6", icon: "🏆" },
  "how-to-play": { label: "How to Play", colour: "#22c55e", icon: "📖" },
  comparison: { label: "Comparison", colour: "#f59e0b", icon: "⚔" },
  playthrough: { label: "Playthrough", colour: "#ec4899", icon: "▶" },
  news: { label: "News", colour: "#06b6d4", icon: "📰" },
  other: { label: "Other", colour: "#6b7280", icon: "•" },
};

const PILL_ORDER: (BoardGameContentType | "all")[] = [
  "all",
  "review",
  "playthrough",
  "how-to-play",
  "top-list",
  "comparison",
  "news",
];

const ALL_TYPES: BoardGameContentType[] = [
  "review",
  "top-list",
  "how-to-play",
  "comparison",
  "playthrough",
  "news",
  "other",
];

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

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default async function BoardGameWatchPage({
  searchParams,
}: {
  searchParams: Promise<{
    q?: string;
    type?: string;
    sort?: string;
    page?: string;
  }>;
}) {
  const config = getSiteVertical();
  if (config.slug !== "warhammer") redirect("/");

  const { q, type, sort, page } = await searchParams;
  const currentPage = Math.max(1, parseInt(page ?? "1", 10) || 1);
  const PAGE_SIZE = 30;

  const activeType: BoardGameContentType | "all" =
    type === "all" || !type
      ? "all"
      : ALL_TYPES.includes(type as BoardGameContentType)
        ? (type as BoardGameContentType)
        : "all";

  // Build query
  let query = supabase
    .from("board_game_videos")
    .select(
      "id, youtube_video_id, title, thumbnail_url, published_at, duration_seconds, view_count, content_type, board_game_channels(channel_name)",
      { count: "exact" },
    );

  // Content type filter
  if (activeType !== "all") {
    query = query.eq("content_type", activeType);
  }

  // Search filter
  if (q) {
    query = query.ilike("title", `%${q}%`);
  }

  // Sort
  if (sort === "views") {
    query = query.order("view_count", { ascending: false, nullsFirst: false });
  } else {
    query = query.order("published_at", { ascending: false });
  }

  // Pagination
  const from = (currentPage - 1) * PAGE_SIZE;
  query = query.range(from, from + PAGE_SIZE - 1);

  const { data: rawVideos, count: totalCount } = await query;
  const videos = (rawVideos ?? []) as unknown as BoardGameVideo[];
  const totalPages = Math.ceil((totalCount ?? 0) / PAGE_SIZE);

  // Count per type (separate query for the pill badges — cached by ISR)
  const typeCounts: Record<string, number> = {};
  let allCount = 0;

  for (const ct of ALL_TYPES) {
    const { count: c } = await supabase
      .from("board_game_videos")
      .select("id", { count: "exact", head: true })
      .eq("content_type", ct);
    const n = c ?? 0;
    typeCounts[ct] = n;
    allCount += n;
  }

  // URL builder
  function buildUrl(key: string, value: string | null): string {
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (sort && sort !== "newest") params.set("sort", sort);
    if (key === "type") {
      if (value && value !== "all") params.set("type", value);
    } else if (activeType !== "all") {
      params.set("type", activeType);
    }
    const qs = params.toString();
    return `/boardgames/watch${qs ? `?${qs}` : ""}`;
  }

  return (
    <div className="min-h-screen bg-background">
      <Nav active="boardgames" />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {/* Header */}
        <div className="mb-6">
          <Link
            href="/boardgames"
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-4"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Board Games
          </Link>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight mb-1">
            Board Game Videos
          </h1>
          <p className="text-sm text-muted-foreground">
            Reviews, playthroughs, how-to-play guides, and top lists from {config.boardGameChannels?.length ?? 20}+ channels.
          </p>
        </div>

        {/* Filters */}
        <div className="space-y-3 mb-8">
          {/* Search + sort row */}
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

            {/* Keep active type in form submission */}
            {activeType !== "all" && (
              <input type="hidden" name="type" value={activeType} />
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

          {/* Content type pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            {PILL_ORDER.map((pill) => {
              if (pill === "all") {
                const isActive = activeType === "all";
                return (
                  <Link
                    key="all"
                    href={buildUrl("type", "all")}
                    className="shrink-0 inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-medium border transition-colors"
                    style={{
                      borderColor: isActive ? "var(--vertical-accent)" : "var(--border)",
                      backgroundColor: isActive ? "var(--vertical-accent)" : "transparent",
                      color: isActive ? "#fff" : undefined,
                    }}
                  >
                    All
                    <span className="opacity-60">{allCount}</span>
                  </Link>
                );
              }

              const cfg = CONTENT_TYPE_CONFIG[pill];
              const isActive = activeType === pill;
              const count = typeCounts[pill] ?? 0;
              if (count === 0) return null;

              return (
                <Link
                  key={pill}
                  href={buildUrl("type", pill)}
                  className="shrink-0 inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-medium border transition-colors"
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

        {/* Video grid */}
        {videos.length === 0 ? (
          <div className="text-center py-16">
            <Play className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground text-lg">No videos found.</p>
            <p className="text-muted-foreground text-sm mt-1">
              {q
                ? "Try a different search term or adjust your filters."
                : "Videos will appear here once the board game YouTube cron has run."}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {videos.map((video) => {
              const ct = (video.content_type ?? "other") as BoardGameContentType;
              const cfg = CONTENT_TYPE_CONFIG[ct] ?? CONTENT_TYPE_CONFIG.other;

              return (
                <a
                  key={video.id}
                  href={`https://www.youtube.com/watch?v=${video.youtube_video_id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group"
                >
                  <Card className="overflow-hidden border-border bg-card hover:border-[var(--vertical-accent)]/40 transition-all hover:shadow-md">
                    {/* Thumbnail */}
                    <div className="relative aspect-video bg-muted">
                      {video.thumbnail_url ? (
                        <img
                          src={video.thumbnail_url}
                          alt={video.title}
                          className="w-full h-full object-cover"
                          loading="lazy"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                          No thumbnail
                        </div>
                      )}

                      {/* Content type badge */}
                      <Badge
                        className="absolute top-2 left-2 text-[10px] border-0"
                        style={{ backgroundColor: `${cfg.colour}dd`, color: "#fff" }}
                      >
                        {cfg.icon} {cfg.label}
                      </Badge>

                      {/* External link indicator */}
                      <span className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <ExternalLink className="w-4 h-4 text-white drop-shadow" />
                      </span>

                      {/* Duration */}
                      {video.duration_seconds != null && video.duration_seconds > 0 && (
                        <span className="absolute bottom-2 right-2 bg-black/80 text-white text-[10px] font-[family-name:var(--font-mono)] px-1.5 py-0.5 rounded">
                          {formatDuration(video.duration_seconds)}
                        </span>
                      )}

                      {/* Accent bar */}
                      <div
                        className="absolute bottom-0 left-0 right-0 h-0.5"
                        style={{ backgroundColor: cfg.colour }}
                      />
                    </div>

                    {/* Info */}
                    <CardContent className="p-3.5">
                      <h3 className="text-sm font-medium leading-snug line-clamp-2 group-hover:text-[var(--vertical-accent-light)] transition-colors">
                        {video.title}
                      </h3>
                      <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                        {video.board_game_channels?.channel_name && (
                          <span className="truncate">
                            {video.board_game_channels.channel_name}
                          </span>
                        )}
                        {video.view_count != null && video.view_count > 0 && (
                          <>
                            <span>&middot;</span>
                            <span className="shrink-0">{formatViews(video.view_count)}</span>
                          </>
                        )}
                        {video.published_at && (
                          <>
                            <span>&middot;</span>
                            <span className="shrink-0">{formatDate(video.published_at)}</span>
                          </>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </a>
              );
            })}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-3 mt-8">
            {currentPage > 1 && (
              <Link
                href={`/boardgames/watch?${new URLSearchParams({
                  ...(activeType !== "all" ? { type: activeType } : {}),
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
              Page {currentPage} of {totalPages} ({totalCount ?? 0} videos)
            </span>
            {currentPage < totalPages && (
              <Link
                href={`/boardgames/watch?${new URLSearchParams({
                  ...(activeType !== "all" ? { type: activeType } : {}),
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
    </div>
  );
}
