// ---------------------------------------------------------------------------
// Board Game Import Cron — /api/cron/board-game-import
// ---------------------------------------------------------------------------
// Imports top-ranked board games from BoardGameGeek into the board_games
// Supabase table. Designed for batch processing to avoid Vercel timeouts.
//
// Usage:
//   GET /api/cron/board-game-import?batch=0  — import games 1-20
//   GET /api/cron/board-game-import?batch=1  — import games 21-40
//   GET /api/cron/board-game-import?batch=all — import all (may timeout)
//   GET /api/cron/board-game-import?mode=hot  — import trending games only
//
// Protected by CRON_SECRET.
// ---------------------------------------------------------------------------

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import {
  fetchBggGames,
  fetchBggHotList,
  fetchBggTopRankedIds,
  slugifyGame,
  type BggGame,
} from "@/lib/bgg";

export const maxDuration = 300;
export const dynamic = "force-dynamic";

const BATCH_SIZE = 20; // BGG allows up to 20 IDs per /thing request

function getAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
}

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(request.url);
  const mode = url.searchParams.get("mode") ?? "ranked";
  const batchParam = url.searchParams.get("batch");

  const supabase = getAdminClient();
  const errors: string[] = [];
  let imported = 0;
  let skipped = 0;

  try {
    // -----------------------------------------------------------------------
    // Step 1: Get list of BGG IDs to import
    // -----------------------------------------------------------------------
    let allBggIds: number[];

    if (mode === "hot") {
      allBggIds = await fetchBggHotList();
    } else {
      // Check if we have cached IDs from a previous run
      const { data: existingGames } = await supabase
        .from("board_games")
        .select("bgg_id, bgg_rank")
        .not("bgg_rank", "is", null)
        .order("bgg_rank", { ascending: true })
        .limit(500);

      if (existingGames && existingGames.length >= 100) {
        // Re-use existing IDs for refresh — don't re-scrape the browse pages
        allBggIds = existingGames.map((g) => g.bgg_id);
      } else {
        // First run — scrape BGG browse pages for top 500 IDs
        allBggIds = await fetchBggTopRankedIds(500);
      }
    }

    if (allBggIds.length === 0) {
      return NextResponse.json({
        ok: true,
        message: "No BGG IDs to import",
        mode,
      });
    }

    // -----------------------------------------------------------------------
    // Step 2: Determine batch slice
    // -----------------------------------------------------------------------
    const totalBatches = Math.ceil(allBggIds.length / BATCH_SIZE);
    let batchIds: number[];
    let batchInfo: string;

    if (batchParam === null || batchParam === "all") {
      batchIds = allBggIds;
      batchInfo = `all (${allBggIds.length} games)`;
    } else {
      const batchIdx = parseInt(batchParam, 10);
      if (isNaN(batchIdx) || batchIdx < 0) {
        return NextResponse.json(
          { error: `Invalid batch. Use 0-${totalBatches - 1} or "all".` },
          { status: 400 },
        );
      }
      if (batchIdx >= totalBatches) {
        return NextResponse.json({
          ok: true,
          skipped: true,
          reason: `Batch ${batchIdx} out of range (${totalBatches} batches)`,
        });
      }
      const start = batchIdx * BATCH_SIZE;
      batchIds = allBggIds.slice(start, start + BATCH_SIZE);
      batchInfo = `${batchIdx}/${totalBatches - 1} (games ${start + 1}-${start + batchIds.length})`;
    }

    // -----------------------------------------------------------------------
    // Step 3: Fetch from BGG and upsert into Supabase
    // -----------------------------------------------------------------------
    // Process in chunks of 20 (BGG API limit)
    for (let i = 0; i < batchIds.length; i += BATCH_SIZE) {
      const chunk = batchIds.slice(i, i + BATCH_SIZE);

      try {
        const games = await fetchBggGames(chunk);

        for (const game of games) {
          try {
            await upsertGame(supabase, game);
            imported++;
          } catch (err) {
            const msg = err instanceof Error ? err.message : String(err);
            errors.push(`Upsert ${game.title} (${game.bggId}): ${msg}`);
            skipped++;
          }
        }

        // Rate limit: wait 1.5s between BGG API calls
        if (i + BATCH_SIZE < batchIds.length) {
          await new Promise((r) => setTimeout(r, 1500));
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        errors.push(`BGG fetch chunk starting at index ${i}: ${msg}`);
      }
    }

    return NextResponse.json({
      ok: true,
      timestamp: new Date().toISOString(),
      mode,
      batch: batchInfo,
      totalBatches,
      totalBggIds: allBggIds.length,
      imported,
      skipped,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json(
      { error: msg, imported, errors },
      { status: 500 },
    );
  }
}

// ---------------------------------------------------------------------------
// Upsert a single game into Supabase
// ---------------------------------------------------------------------------

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function upsertGame(
  supabase: any,
  game: BggGame,
) {
  const slug = slugifyGame(game.title);

  // Truncate description to 2000 chars to avoid bloat
  const description = game.description
    ? game.description.slice(0, 2000)
    : null;

  const { error } = await supabase.from("board_games").upsert(
    {
      bgg_id: game.bggId,
      slug,
      title: game.title,
      description,
      image_url: game.imageUrl,
      thumbnail_url: game.thumbnailUrl,
      year_published: game.yearPublished,
      min_players: game.minPlayers,
      max_players: game.maxPlayers,
      play_time_min: game.playTimeMin,
      play_time_max: game.playTimeMax,
      min_age: game.minAge,
      complexity: game.complexity,
      bgg_rank: game.bggRank,
      bgg_rating: game.bggRating,
      designers: game.designers,
      publishers: game.publishers,
      categories: game.categories,
      mechanics: game.mechanics,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "bgg_id" },
  );

  if (error) throw new Error(error.message);
}
