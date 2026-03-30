// ---------------------------------------------------------------------------
// Related Videos — shows videos with overlapping factions
// ---------------------------------------------------------------------------

import Link from "next/link";
import { supabase } from "@/lib/supabase";

interface RelatedVideo {
  id: string;
  youtube_video_id: string;
  title: string;
  thumbnail_url: string | null;
  view_count: number;
  channels: { name: string } | null;
}

function formatViews(count: number): string {
  if (count >= 1_000_000) return `${(count / 1_000_000).toFixed(1)}M views`;
  if (count >= 1_000) return `${(count / 1_000).toFixed(1)}K views`;
  return `${count} views`;
}

export async function RelatedVideos({
  currentVideoId,
  categoryIds,
}: {
  currentVideoId: string;
  categoryIds: string[];
}) {
  if (categoryIds.length === 0) return null;

  // Find other battle reports that share a category via content_lists
  const { data: relatedLists } = await supabase
    .from("content_lists")
    .select("battle_report_id")
    .in("category_id", categoryIds)
    .limit(50);

  const relatedBrIds = [
    ...new Set(
      (relatedLists ?? [])
        .map((r) => r.battle_report_id)
        .filter(Boolean),
    ),
  ];

  if (relatedBrIds.length === 0) return null;

  const { data: videos } = await supabase
    .from("battle_reports")
    .select("id, youtube_video_id, title, thumbnail_url, view_count, channels ( name )")
    .in("id", relatedBrIds)
    .neq("youtube_video_id", currentVideoId)
    .order("view_count", { ascending: false })
    .limit(3);

  const related = (videos ?? []) as unknown as RelatedVideo[];
  if (related.length === 0) return null;

  return (
    <section className="mt-10">
      <h2 className="text-xl font-bold tracking-tight mb-4">Related Videos</h2>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {related.map((video) => (
          <Link
            key={video.id}
            href={`/watch/${video.youtube_video_id}`}
            className="group rounded-xl border border-[var(--border)] bg-[var(--surface)] overflow-hidden hover:border-[var(--border-light)] hover:bg-[var(--surface-hover)] transition-all"
          >
            <div className="relative aspect-video bg-[var(--surface-hover)]">
              {video.thumbnail_url ? (
                <img
                  src={video.thumbnail_url}
                  alt={video.title}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-[var(--muted)]">
                  No thumbnail
                </div>
              )}
            </div>
            <div className="p-3 space-y-1">
              <h3 className="text-sm font-medium leading-snug line-clamp-2 group-hover:text-[var(--vertical-accent-light)] transition-colors">
                {video.title}
              </h3>
              <p className="text-xs text-[var(--muted)]">
                {video.channels?.name ?? "Unknown"} - {formatViews(video.view_count)}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
