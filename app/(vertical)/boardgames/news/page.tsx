import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Nav } from "@/components/nav";
import { supabase } from "@/lib/supabase";
import { getSiteVertical, getSiteBrand } from "@/lib/site";
import { ArrowLeft, ExternalLink, Play } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export const revalidate = 1800; // 30 min — news is more time-sensitive

export async function generateMetadata(): Promise<Metadata> {
  const brand = getSiteBrand();
  return {
    title: `Board Game News | ${brand.siteName}`,
    description:
      "Latest board game news from the top YouTube channels — reviews, announcements, and industry updates.",
    openGraph: {
      title: `Board Game News | ${brand.siteName}`,
      description:
        "Latest board game news from the top YouTube channels.",
      type: "website",
    },
  };
}

interface NewsVideo {
  id: string;
  youtube_video_id: string;
  title: string;
  thumbnail_url: string | null;
  published_at: string;
  duration_seconds: number | null;
  content_type: string | null;
  board_game_channels: {
    channel_name: string;
  } | null;
}

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const hours = Math.floor(diff / (1000 * 60 * 60));
  if (hours < 1) return "Just now";
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  const weeks = Math.floor(days / 7);
  if (weeks < 4) return `${weeks}w ago`;
  return new Date(dateStr).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
  });
}

export default async function BoardGameNewsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const config = getSiteVertical();
  if (config.slug !== "warhammer") redirect("/");

  const params = await searchParams;
  const currentPage = Math.max(1, parseInt(params.page ?? "1", 10) || 1);
  const PAGE_SIZE = 24;

  const from = (currentPage - 1) * PAGE_SIZE;

  const { data: rawVideos, count } = await supabase
    .from("board_game_videos")
    .select(
      "id, youtube_video_id, title, thumbnail_url, published_at, duration_seconds, content_type, board_game_channels(channel_name)",
      { count: "exact" },
    )
    .eq("content_type", "news")
    .order("published_at", { ascending: false })
    .range(from, from + PAGE_SIZE - 1);

  const videos = (rawVideos ?? []) as unknown as NewsVideo[];
  const totalPages = Math.ceil((count ?? 0) / PAGE_SIZE);

  // If no "news" type videos exist, fall back to showing all recent videos
  let fallbackVideos: NewsVideo[] = [];
  if (videos.length === 0 && currentPage === 1) {
    const { data: allVideos } = await supabase
      .from("board_game_videos")
      .select(
        "id, youtube_video_id, title, thumbnail_url, published_at, duration_seconds, content_type, board_game_channels(channel_name)",
      )
      .order("published_at", { ascending: false })
      .limit(PAGE_SIZE);
    fallbackVideos = (allVideos ?? []) as unknown as NewsVideo[];
  }

  const displayVideos = videos.length > 0 ? videos : fallbackVideos;
  const isFallback = videos.length === 0 && fallbackVideos.length > 0;

  return (
    <div className="min-h-screen bg-background">
      <Nav active="boardgames" />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <Link
          href="/boardgames"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Board Games
        </Link>

        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight mb-2">
          Board Game News
        </h1>
        <p className="text-muted-foreground mb-4">
          {isFallback
            ? "Latest videos from tracked board game channels."
            : "News and announcements from the board gaming world."}
        </p>
        <p className="text-sm mb-8">
          <Link
            href="/boardgames/watch"
            className="text-[var(--vertical-accent)] hover:underline"
          >
            Looking for reviews, playthroughs, or how-to-play guides? Browse all videos &rarr;
          </Link>
        </p>

        {displayVideos.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border bg-card p-10 text-center">
            <Play className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground mb-1">
              No news videos yet.
            </p>
            <p className="text-xs text-muted-foreground">
              News videos will appear here once the board game YouTube cron
              classifies them.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {displayVideos.map((video) => (
              <a
                key={video.id}
                href={`https://www.youtube.com/watch?v=${video.youtube_video_id}`}
                target="_blank"
                rel="noopener noreferrer"
                className="group rounded-xl border border-border bg-card overflow-hidden hover:border-[var(--vertical-accent)]/40 transition-all"
              >
                <div className="relative aspect-video bg-muted">
                  {video.thumbnail_url ? (
                    <img
                      src={video.thumbnail_url}
                      alt={video.title}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-muted-foreground text-xs">
                      No thumbnail
                    </div>
                  )}
                  {video.duration_seconds && video.duration_seconds > 0 && (
                    <span className="absolute bottom-2 right-2 px-1.5 py-0.5 rounded text-[10px] font-medium font-[family-name:var(--font-mono)] bg-black/75 text-white">
                      {formatDuration(video.duration_seconds)}
                    </span>
                  )}
                  <span className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <ExternalLink className="w-4 h-4 text-white drop-shadow" />
                  </span>
                  {video.content_type && video.content_type !== "news" && (
                    <Badge
                      variant="secondary"
                      className="absolute top-2 left-2 text-[10px]"
                    >
                      {video.content_type}
                    </Badge>
                  )}
                </div>
                <div className="p-3.5">
                  <h3 className="text-sm font-medium leading-snug line-clamp-2 group-hover:text-[var(--vertical-accent-light)] transition-colors">
                    {video.title}
                  </h3>
                  <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                    {video.board_game_channels?.channel_name && (
                      <span>{video.board_game_channels.channel_name}</span>
                    )}
                    {video.published_at && (
                      <>
                        <span>·</span>
                        <span>{timeAgo(video.published_at)}</span>
                      </>
                    )}
                  </div>
                </div>
              </a>
            ))}
          </div>
        )}

        {/* Pagination */}
        {!isFallback && totalPages > 1 && (
          <div className="flex items-center justify-center gap-3 mt-8">
            {currentPage > 1 && (
              <Link
                href={`/boardgames/news?page=${currentPage - 1}`}
                className="inline-flex items-center rounded-lg border border-border px-4 py-2 text-sm font-medium hover:bg-secondary transition-colors"
              >
                Previous
              </Link>
            )}
            <span className="text-sm text-muted-foreground">
              Page {currentPage} of {totalPages}
            </span>
            {currentPage < totalPages && (
              <Link
                href={`/boardgames/news?page=${currentPage + 1}`}
                className="inline-flex items-center rounded-lg border border-border px-4 py-2 text-sm font-medium hover:bg-secondary transition-colors"
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
