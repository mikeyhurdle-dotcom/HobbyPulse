// ---------------------------------------------------------------------------
// Board Game Search API — /api/board-game-search
// ---------------------------------------------------------------------------
// Autocomplete search for board games. Used by the compare tool and
// recommender. Returns top 8 matches by BGG rank.
// ---------------------------------------------------------------------------

import { NextResponse } from "next/server";
import { searchGames } from "@/lib/board-game-db";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const q = url.searchParams.get("q");

  if (!q || q.length < 2) {
    return NextResponse.json({ games: [] });
  }

  const games = await searchGames(q, 8);
  return NextResponse.json({ games });
}
