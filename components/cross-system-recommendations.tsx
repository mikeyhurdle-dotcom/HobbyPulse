// ---------------------------------------------------------------------------
// Cross-System Recommendations — "Try Something New"
// Recommends battle reports from OTHER game systems based on faction affinity
// ---------------------------------------------------------------------------

import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { findAffineFactions } from "@/config/faction-affinities";
import { getGameSystem } from "@/config/game-systems";

interface RecommendedVideo {
  id: string;
  youtube_video_id: string;
  title: string;
  thumbnail_url: string | null;
  game_system: string | null;
  channels: { name: string } | null;
}

export async function CrossSystemRecommendations({
  currentGameSystem,
  factionSlugs,
}: {
  currentGameSystem: string;
  factionSlugs: string[];
}) {
  if (factionSlugs.length === 0) return null;

  // Collect all affine faction slugs from other game systems
  const affineFactions = factionSlugs.flatMap((slug) =>
    findAffineFactions(slug, currentGameSystem),
  );

  if (affineFactions.length === 0) return null;

  const affineSlugs = [...new Set(affineFactions.map((f) => f.categorySlug))];

  // Resolve slugs to category IDs
  const { data: categories } = await supabase
    .from("categories")
    .select("id")
    .in("slug", affineSlugs);

  if (!categories || categories.length === 0) return null;

  const categoryIds = categories.map((c) => c.id);

  // Find battle reports via content_lists that use those categories
  const { data: contentLists } = await supabase
    .from("content_lists")
    .select("battle_report_id")
    .in("category_id", categoryIds)
    .limit(50);

  const brIds = [
    ...new Set(
      (contentLists ?? []).map((r) => r.battle_report_id).filter(Boolean),
    ),
  ];

  if (brIds.length === 0) return null;

  // Fetch battle reports from different game systems
  const { data: videos } = await supabase
    .from("battle_reports")
    .select(
      "id, youtube_video_id, title, thumbnail_url, game_system, channels ( name )",
    )
    .in("id", brIds)
    .neq("game_system", currentGameSystem)
    .order("view_count", { ascending: false })
    .limit(3);

  const recommended = (videos ?? []) as unknown as RecommendedVideo[];
  if (recommended.length === 0) return null;

  return (
    <section className="mt-10">
      <div className="mb-4">
        <h2 className="text-xl font-bold tracking-tight flex items-center gap-2">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="currentColor"
            className="w-5 h-5 text-[var(--vertical-accent-light)]"
          >
            <path
              fillRule="evenodd"
              d="M9 4.5a.75.75 0 01.721.544l.813 2.846a3.75 3.75 0 002.576 2.576l2.846.813a.75.75 0 010 1.442l-2.846.813a3.75 3.75 0 00-2.576 2.576l-.813 2.846a.75.75 0 01-1.442 0l-.813-2.846a3.75 3.75 0 00-2.576-2.576l-2.846-.813a.75.75 0 010-1.442l2.846-.813A3.75 3.75 0 007.466 7.89l.813-2.846A.75.75 0 019 4.5zM18 1.5a.75.75 0 01.728.568l.258 1.036c.236.94.97 1.674 1.91 1.91l1.036.258a.75.75 0 010 1.456l-1.036.258c-.94.236-1.674.97-1.91 1.91l-.258 1.036a.75.75 0 01-1.456 0l-.258-1.036a2.625 2.625 0 00-1.91-1.91l-1.036-.258a.75.75 0 010-1.456l1.036-.258a2.625 2.625 0 001.91-1.91l.258-1.036A.75.75 0 0118 1.5z"
              clipRule="evenodd"
            />
          </svg>
          Try Something New
        </h2>
        <p className="text-sm text-[var(--muted)] mt-1">
          Similar factions in other game systems
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {recommended.map((video) => {
          const gs = getGameSystem(video.game_system ?? "40k");
          return (
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
                {/* Game system badge */}
                <span
                  className="absolute top-2 left-2 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold text-white shadow-sm"
                  style={{ backgroundColor: gs.colour }}
                >
                  <span>{gs.icon}</span>
                  <span>{gs.shortName}</span>
                </span>
              </div>
              <div className="p-3 space-y-1">
                <h3 className="text-sm font-medium leading-snug line-clamp-2 group-hover:text-[var(--vertical-accent-light)] transition-colors">
                  {video.title}
                </h3>
                <p className="text-xs text-[var(--muted)]">
                  {video.channels?.name ?? "Unknown"}
                </p>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
