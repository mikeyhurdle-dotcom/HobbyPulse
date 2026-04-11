// ---------------------------------------------------------------------------
// Game Recommendation API — /api/recommend-game
// ---------------------------------------------------------------------------
// Takes quiz answers (players, complexity, time, vibe) and returns matching
// games from the board_games table, ordered by BGG rating.
// ---------------------------------------------------------------------------

import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export const dynamic = "force-dynamic";

interface RecommendedGame {
  slug: string;
  title: string;
  thumbnail_url: string | null;
  image_url: string | null;
  bgg_rating: number | null;
  bgg_rank: number | null;
  min_players: number | null;
  max_players: number | null;
  play_time_min: number | null;
  play_time_max: number | null;
  complexity: number | null;
  categories: string[];
  mechanics: string[];
  amazon_asin: string | null;
  zatu_url: string | null;
  matchReason: string;
}

// Vibe → category/mechanic mapping
const VIBE_MAP: Record<string, { categories: string[]; mechanics: string[] }> = {
  competitive: {
    categories: ["Economic", "Negotiation", "Territory Building", "Wargame"],
    mechanics: ["Area Majority / Influence", "Auction/Bidding", "Worker Placement"],
  },
  cooperative: {
    categories: ["Adventure", "Medical"],
    mechanics: ["Cooperative Game", "Solo / Solitaire Game"],
  },
  party: {
    categories: ["Party Game", "Humor", "Trivia", "Word Game"],
    mechanics: ["Acting", "Voting", "Communication Limits"],
  },
  strategy: {
    categories: ["Economic", "Civilization", "Political"],
    mechanics: ["Worker Placement", "Engine Building", "Deck, Bag, and Pool Building", "Area Majority / Influence"],
  },
};

export async function GET(request: Request) {
  const url = new URL(request.url);
  const players = url.searchParams.get("players");
  const complexity = url.searchParams.get("complexity");
  const time = url.searchParams.get("time");
  const vibe = url.searchParams.get("vibe");

  let query = supabase
    .from("board_games")
    .select(
      "slug, title, thumbnail_url, image_url, bgg_rating, bgg_rank, min_players, max_players, play_time_min, play_time_max, complexity, categories, mechanics, amazon_asin, zatu_url",
    )
    .not("bgg_rating", "is", null);

  // Player count filter
  if (players) {
    const p = parseInt(players, 10);
    if (p === 5) {
      query = query.gte("max_players", 5);
    } else if (!isNaN(p)) {
      query = query.lte("min_players", p).gte("max_players", p);
    }
  }

  // Complexity filter
  if (complexity) {
    const ranges: Record<string, [number, number]> = {
      light: [0, 2],
      medium: [2, 3.5],
      heavy: [3.5, 5],
    };
    const range = ranges[complexity];
    if (range) {
      query = query.gte("complexity", range[0]).lte("complexity", range[1]);
    }
  }

  // Play time filter
  if (time) {
    const t = parseInt(time, 10);
    if (!isNaN(t)) {
      query = query.lte("play_time_min", t);
    }
  }

  // Order by rating, get more than we need so we can filter by vibe client-side
  query = query.order("bgg_rating", { ascending: false }).limit(50);

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  let games = (data ?? []) as (RecommendedGame & { matchReason?: string })[];

  // Vibe filtering — boost games matching the vibe categories/mechanics
  if (vibe && VIBE_MAP[vibe]) {
    const vibeConfig = VIBE_MAP[vibe];
    const scored = games.map((g) => {
      let score = 0;
      const reasons: string[] = [];

      for (const cat of vibeConfig.categories) {
        if (g.categories?.includes(cat)) {
          score += 2;
          reasons.push(cat);
        }
      }
      for (const mech of vibeConfig.mechanics) {
        if (g.mechanics?.includes(mech)) {
          score += 1;
          reasons.push(mech);
        }
      }

      return { ...g, vibeScore: score, vibeReasons: reasons };
    });

    // Sort by vibe match first, then by rating
    scored.sort((a, b) => {
      if (b.vibeScore !== a.vibeScore) return b.vibeScore - a.vibeScore;
      return (b.bgg_rating ?? 0) - (a.bgg_rating ?? 0);
    });

    games = scored.slice(0, 5).map((g) => ({
      ...g,
      matchReason: g.vibeReasons.length > 0
        ? `Matches your ${vibe} vibe: ${g.vibeReasons.slice(0, 2).join(", ")}`
        : `Top rated for your preferences`,
    }));
  } else {
    games = games.slice(0, 5).map((g) => ({
      ...g,
      matchReason: "Top rated for your preferences",
    }));
  }

  // Build match reasons for all games that don't have one yet
  const results = games.map((g) => {
    const reasons: string[] = [];
    if (g.bgg_rating) reasons.push(`${g.bgg_rating.toFixed(1)}/10 on BGG`);
    if (g.min_players != null && g.max_players != null) {
      reasons.push(`${g.min_players}-${g.max_players} players`);
    }
    return {
      ...g,
      matchReason: g.matchReason || reasons.join(" · "),
    };
  });

  return NextResponse.json({ games: results });
}
