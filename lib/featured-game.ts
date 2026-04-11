// ---------------------------------------------------------------------------
// Featured Game — picks a "Game of the Week" for the homepage
// ---------------------------------------------------------------------------
// Rotates weekly. Prefers games that are highly rated and have affiliate links.
// Falls back to highest-rated game if no affiliates are configured.
// ---------------------------------------------------------------------------

import { supabase } from "@/lib/supabase";
import type { BoardGame } from "@/lib/board-game-db";

/**
 * Get the featured game of the week.
 * Uses a deterministic rotation based on the current ISO week number,
 * so the same game shows all week without needing a database flag.
 */
export async function getFeaturedGame(): Promise<BoardGame | null> {
  // Fetch top 20 games that have images
  const { data } = await supabase
    .from("board_games")
    .select("*")
    .not("bgg_rank", "is", null)
    .not("image_url", "is", null)
    .order("bgg_rating", { ascending: false })
    .limit(20);

  if (!data || data.length === 0) return null;

  const games = data as BoardGame[];

  // Prefer games with affiliate links
  const withAffiliate = games.filter(
    (g) => g.amazon_asin || g.zatu_url,
  );
  const pool = withAffiliate.length > 0 ? withAffiliate : games;

  // Deterministic weekly rotation
  const weekNumber = getIsoWeek();
  const index = weekNumber % pool.length;

  return pool[index];
}

/**
 * Get trending games for the homepage row.
 */
export async function getHomeTrendingGames(
  limit: number = 6,
): Promise<BoardGame[]> {
  const { data } = await supabase
    .from("board_games")
    .select("*")
    .not("bgg_rank", "is", null)
    .not("thumbnail_url", "is", null)
    .order("bgg_rank", { ascending: true })
    .limit(limit);

  return (data ?? []) as BoardGame[];
}

function getIsoWeek(): number {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + 3 - ((d.getDay() + 6) % 7));
  const week1 = new Date(d.getFullYear(), 0, 4);
  return (
    1 +
    Math.round(
      ((d.getTime() - week1.getTime()) / 86400000 -
        3 +
        ((week1.getDay() + 6) % 7)) /
        7,
    )
  );
}
