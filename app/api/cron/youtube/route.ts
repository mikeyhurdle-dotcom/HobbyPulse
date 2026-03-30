import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import {
  fetchRecentVideos,
  getVideoDetails,
  parseDuration,
} from "@/lib/youtube";
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
    return NextResponse.json({ error: `Vertical ${siteVertical.slug} not found in database` }, { status: 500 });
  }

  // 1. Fetch channels for this vertical only
  const { data: channels, error: channelsError } = await supabase
    .from("channels")
    .select("id, vertical_id, youtube_channel_id, name")
    .eq("vertical_id", verticalRow.id);

  if (channelsError) {
    console.error("Failed to fetch channels:", channelsError);
    return NextResponse.json({ error: "Failed to fetch channels" }, { status: 500 });
  }

  if (!channels || channels.length === 0) {
    return NextResponse.json({ message: "No channels to poll" });
  }

  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  let totalNewVideos = 0;
  const errors: string[] = [];

  // 2. For each channel, fetch recent videos
  for (const channel of channels) {
    try {
      const searchItems = await fetchRecentVideos(
        channel.youtube_channel_id,
        sevenDaysAgo,
      );

      if (searchItems.length === 0) {
        // Still update last_polled_at even if no new videos
        await supabase
          .from("channels")
          .update({ last_polled_at: new Date().toISOString() })
          .eq("id", channel.id);
        continue;
      }

      // Get video IDs and fetch full details
      const videoIds = searchItems
        .map((item) => item.id.videoId)
        .filter((id): id is string => !!id);

      const videoDetails = await getVideoDetails(videoIds);

      // 3. Upsert into battle_reports
      const rows = videoDetails.map((video) => ({
        vertical_id: channel.vertical_id,
        channel_id: channel.id,
        youtube_video_id: video.id,
        title: video.snippet.title,
        description: video.snippet.description,
        thumbnail_url: video.snippet.thumbnails.high?.url ?? video.snippet.thumbnails.medium?.url ?? null,
        published_at: video.snippet.publishedAt,
        duration_seconds: parseDuration(video.contentDetails.duration),
        view_count: parseInt(video.statistics.viewCount || "0", 10),
      }));

      const { error: upsertError } = await supabase
        .from("battle_reports")
        .upsert(rows, { onConflict: "youtube_video_id", ignoreDuplicates: false });

      if (upsertError) {
        console.error(`Upsert error for channel ${channel.name}:`, upsertError);
        errors.push(`${channel.name}: ${upsertError.message}`);
      } else {
        totalNewVideos += rows.length;
      }

      // 4. Update last_polled_at
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
    videosUpserted: totalNewVideos,
    errors: errors.length > 0 ? errors : undefined,
  });
}
