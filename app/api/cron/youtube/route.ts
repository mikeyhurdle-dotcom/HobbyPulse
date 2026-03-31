import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getVideoDetails, parseDuration } from "@/lib/youtube";
import { classifyVideo, classifyGameSystem, isBattleReport, isShort } from "@/lib/classify";
import { fetchChannelFeed } from "@/lib/youtube-rss";
import { getSiteVertical } from "@/lib/site";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const maxDuration = 300; // 5 min max for cron jobs

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
// GET /api/cron/youtube
//
// Flow:
// 1. Fetch all channels from Supabase for this vertical
// 2. For each channel, fetch the RSS feed (zero quota)
// 3. Filter RSS results to likely battle reports using isBattleReport
// 4. Collect video IDs that are NEW (not already in battle_reports table)
// 5. Only call videos.list API for new videos (1 unit per 50 — negligible)
// 6. Upsert into battle_reports with content_type and is_short
// ---------------------------------------------------------------------------
export async function GET(request: NextRequest) {
  // ---- Auth guard ----
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = getAdminClient();
  const siteVertical = getSiteVertical();

  // Look up the vertical ID for this deployment
  const { data: verticalRow } = await supabase
    .from("verticals")
    .select("id")
    .eq("slug", siteVertical.slug)
    .single();

  if (!verticalRow) {
    return NextResponse.json(
      { error: `Vertical ${siteVertical.slug} not found in database` },
      { status: 500 },
    );
  }

  // 1. Fetch channels for this vertical only
  const { data: channels, error: channelsError } = await supabase
    .from("channels")
    .select("id, vertical_id, youtube_channel_id, name")
    .eq("vertical_id", verticalRow.id);

  if (channelsError) {
    console.error("Failed to fetch channels:", channelsError);
    return NextResponse.json(
      { error: "Failed to fetch channels" },
      { status: 500 },
    );
  }

  if (!channels || channels.length === 0) {
    return NextResponse.json({ message: "No channels to poll" });
  }

  let totalNewVideos = 0;
  let totalRssVideos = 0;
  const errors: string[] = [];

  // 2. For each channel, fetch RSS feed (zero quota)
  for (const channel of channels) {
    try {
      const rssVideos = await fetchChannelFeed(channel.youtube_channel_id);
      totalRssVideos += rssVideos.length;

      if (rssVideos.length === 0) {
        await supabase
          .from("channels")
          .update({ last_polled_at: new Date().toISOString() })
          .eq("id", channel.id);
        continue;
      }

      // 3. Check which video IDs are already in the database
      const rssVideoIds = rssVideos.map((v) => v.videoId);

      const { data: existingRows } = await supabase
        .from("battle_reports")
        .select("youtube_video_id")
        .in("youtube_video_id", rssVideoIds);

      const existingIds = new Set(
        (existingRows ?? []).map((r) => r.youtube_video_id),
      );

      // 4. Filter to NEW videos only
      const newRssVideos = rssVideos.filter(
        (v) => !existingIds.has(v.videoId),
      );

      if (newRssVideos.length === 0) {
        await supabase
          .from("channels")
          .update({ last_polled_at: new Date().toISOString() })
          .eq("id", channel.id);
        continue;
      }

      // 5. Fetch full video details from YouTube API (1 unit per 50 videos)
      //    We fetch details for ALL new videos (not just battle reports)
      //    so we can classify and store them with full metadata.
      const newVideoIds = newRssVideos.map((v) => v.videoId);
      const videoDetails = await getVideoDetails(newVideoIds);

      // 6. Upsert into battle_reports
      const rows = videoDetails.map((video) => {
        const durationSeconds = parseDuration(
          video.contentDetails?.duration ?? "PT0S",
        );
        return {
          vertical_id: channel.vertical_id,
          channel_id: channel.id,
          youtube_video_id: video.id,
          title: video.snippet.title,
          description: video.snippet.description,
          thumbnail_url:
            video.snippet.thumbnails.high?.url ??
            video.snippet.thumbnails.medium?.url ??
            null,
          published_at: video.snippet.publishedAt,
          duration_seconds: durationSeconds,
          view_count: parseInt(video.statistics?.viewCount || "0", 10),
          content_type: classifyVideo(video.snippet.title, durationSeconds),
          game_system: classifyGameSystem(video.snippet.title),
          is_short: isShort(durationSeconds),
        };
      });

      const { error: upsertError } = await supabase
        .from("battle_reports")
        .upsert(rows, {
          onConflict: "youtube_video_id",
          ignoreDuplicates: false,
        });

      if (upsertError) {
        console.error(
          `Upsert error for channel ${channel.name}:`,
          upsertError,
        );
        errors.push(`${channel.name}: ${upsertError.message}`);
      } else {
        totalNewVideos += rows.length;
      }

      // 7. Update last_polled_at
      await supabase
        .from("channels")
        .update({ last_polled_at: new Date().toISOString() })
        .eq("id", channel.id);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.error(`Error polling channel ${channel.name}:`, message);
      errors.push(`${channel.name}: ${message}`);
    }
  }

  return NextResponse.json({
    success: true,
    channelsPolled: channels.length,
    rssVideosFound: totalRssVideos,
    newVideosUpserted: totalNewVideos,
    errors: errors.length > 0 ? errors : undefined,
  });
}
