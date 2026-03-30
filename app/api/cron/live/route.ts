// ---------------------------------------------------------------------------
// Live Streams Cron — /api/cron/live
// ---------------------------------------------------------------------------
// Polls every 5 minutes. For each vertical: fetches live Twitch streams by
// game category ID, searches YouTube for live streams by keyword, upserts
// into the live_streams table, and marks stale streams as no longer live.
// ---------------------------------------------------------------------------

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { searchStreamsByGame } from "@/lib/twitch";
import { searchLiveStreams } from "@/lib/youtube-live";
import { verticals } from "@/config/verticals";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

// ---------------------------------------------------------------------------
// Admin Supabase client (service role — bypasses RLS)
// ---------------------------------------------------------------------------
function getAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
}

// ---------------------------------------------------------------------------
// GET /api/cron/live
// ---------------------------------------------------------------------------
export async function GET(request: NextRequest) {
  // Auth guard
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = getAdminClient();
  const now = new Date().toISOString();

  const results: {
    vertical: string;
    twitchStreams: number;
    youtubeStreams: number;
    markedOffline: number;
    errors: string[];
  }[] = [];

  for (const [verticalSlug, verticalConfig] of Object.entries(verticals)) {
    const errors: string[] = [];
    let twitchCount = 0;
    let youtubeCount = 0;
    let markedOffline = 0;

    // Get vertical ID from Supabase
    const { data: verticalRow } = await supabase
      .from("verticals")
      .select("id")
      .eq("slug", verticalSlug)
      .single();

    if (!verticalRow) {
      errors.push(`Vertical ${verticalSlug} not found in database`);
      results.push({
        vertical: verticalSlug,
        twitchStreams: 0,
        youtubeStreams: 0,
        markedOffline: 0,
        errors,
      });
      continue;
    }

    const verticalId = verticalRow.id;

    // Track all stream IDs we see this poll (to mark stale ones offline)
    const seenStreamKeys = new Set<string>();

    // ----- Twitch streams by game ID -----
    if (verticalConfig.twitchGameIds.length > 0) {
      try {
        const twitchStreams = await searchStreamsByGame(
          verticalConfig.twitchGameIds,
        );

        for (const stream of twitchStreams) {
          seenStreamKeys.add(`twitch:${stream.stream_id}`);

          const { error } = await supabase.from("live_streams").upsert(
            {
              vertical_id: verticalId,
              platform: "twitch",
              stream_id: stream.stream_id,
              streamer_name: stream.streamer_name,
              title: stream.title,
              thumbnail_url: stream.thumbnail_url,
              viewer_count: stream.viewer_count,
              game_category: stream.game_name,
              is_live: true,
              started_at: stream.started_at,
              last_seen_at: now,
            },
            { onConflict: "platform,stream_id" },
          );

          if (error) {
            errors.push(`Twitch upsert ${stream.stream_id}: ${error.message}`);
          } else {
            twitchCount++;
          }
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        errors.push(`Twitch game fetch: ${msg}`);
      }
    }

    // ----- YouTube live search -----
    for (const term of verticalConfig.liveSearchTerms) {
      try {
        const ytStreams = await searchLiveStreams(term, 15);

        for (const stream of ytStreams) {
          seenStreamKeys.add(`youtube:${stream.video_id}`);

          const { error } = await supabase.from("live_streams").upsert(
            {
              vertical_id: verticalId,
              platform: "youtube",
              stream_id: stream.video_id,
              streamer_name: stream.channel_name,
              title: stream.title,
              thumbnail_url: stream.thumbnail_url,
              viewer_count: stream.viewer_count,
              game_category: term,
              is_live: true,
              started_at: stream.started_at,
              last_seen_at: now,
            },
            { onConflict: "platform,stream_id" },
          );

          if (error) {
            errors.push(`YouTube upsert ${stream.video_id}: ${error.message}`);
          } else {
            youtubeCount++;
          }
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        errors.push(`YouTube "${term}": ${msg}`);
      }
    }

    // ----- Mark stale streams as offline -----
    // Any stream in DB marked is_live=true for this vertical that was NOT
    // seen in this poll should be marked offline.
    const { data: currentlyLive } = await supabase
      .from("live_streams")
      .select("id, platform, stream_id")
      .eq("vertical_id", verticalId)
      .eq("is_live", true);

    if (currentlyLive) {
      const staleIds = currentlyLive
        .filter((row) => !seenStreamKeys.has(`${row.platform}:${row.stream_id}`))
        .map((row) => row.id);

      if (staleIds.length > 0) {
        const { error } = await supabase
          .from("live_streams")
          .update({ is_live: false })
          .in("id", staleIds);

        if (error) {
          errors.push(`Mark offline: ${error.message}`);
        } else {
          markedOffline = staleIds.length;
        }
      }
    }

    results.push({
      vertical: verticalSlug,
      twitchStreams: twitchCount,
      youtubeStreams: youtubeCount,
      markedOffline,
      errors: errors.length > 0 ? errors : [],
    });
  }

  return NextResponse.json({
    success: true,
    timestamp: now,
    results,
  });
}
