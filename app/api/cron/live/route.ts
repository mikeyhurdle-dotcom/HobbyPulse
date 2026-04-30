// ---------------------------------------------------------------------------
// Live Streams Cron — /api/cron/live
// ---------------------------------------------------------------------------
// Supports split polling via ?source= param:
//   ?source=twitch   — Twitch only (free, call every 5 min via PulseBot)
//   ?source=youtube  — YouTube only (quota-limited, call every 60 min)
//   ?source=all      — Both (default, used by Vercel daily cron as fallback)
//
// Each source poll marks unseen streams for THAT source as offline, so
// Twitch and YouTube staleness tracking are independent.
// ---------------------------------------------------------------------------

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { searchStreamsByGame } from "@/lib/twitch";
import { searchLiveStreams } from "@/lib/youtube-live";
import { getSiteVertical, isSrwSunset } from "@/lib/site";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

function getAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
}

// ---------------------------------------------------------------------------
// GET /api/cron/live?source=twitch|youtube|all
// ---------------------------------------------------------------------------
export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // SUNSET 2026-04-30 per pivot decision — SRW live-stream tracking halted.
  if (isSrwSunset()) {
    return NextResponse.json({ ok: true, skipped: true, reason: "SRW sunset 2026-04-30" });
  }

  const supabase = getAdminClient();
  const now = new Date().toISOString();
  const verticalConfig = getSiteVertical();

  const url = new URL(request.url);
  const source = url.searchParams.get("source") ?? "all";
  const pollTwitch = source === "all" || source === "twitch";
  const pollYoutube = source === "all" || source === "youtube";

  const errors: string[] = [];
  let twitchCount = 0;
  let youtubeCount = 0;
  let markedOffline = 0;

  const { data: verticalRow } = await supabase
    .from("verticals")
    .select("id")
    .eq("slug", verticalConfig.slug)
    .single();

  if (!verticalRow) {
    return NextResponse.json(
      { error: `Vertical ${verticalConfig.slug} not found in database` },
      { status: 500 },
    );
  }

  const verticalId = verticalRow.id;
  const seenStreamKeys = new Set<string>();

  // ----- Twitch streams by game ID -----
  if (pollTwitch && verticalConfig.twitchGameIds.length > 0) {
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
  if (pollYoutube) {
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
  }

  // ----- Mark stale streams as offline -----
  // Only mark streams offline for the platform(s) we just polled.
  // This prevents a Twitch-only poll from killing YouTube streams and vice versa.
  let staleQuery = supabase
    .from("live_streams")
    .select("id, platform, stream_id")
    .eq("vertical_id", verticalId)
    .eq("is_live", true);

  if (source === "twitch") {
    staleQuery = staleQuery.eq("platform", "twitch");
  } else if (source === "youtube") {
    staleQuery = staleQuery.eq("platform", "youtube");
  }

  const { data: currentlyLive } = await staleQuery;

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

  return NextResponse.json({
    success: true,
    timestamp: now,
    vertical: verticalConfig.slug,
    source,
    twitchStreams: twitchCount,
    youtubeStreams: youtubeCount,
    markedOffline,
    errors: errors.length > 0 ? errors : undefined,
  });
}
