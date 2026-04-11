import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getVideoDetails, parseDuration } from "@/lib/youtube";
import { fetchChannelFeed } from "@/lib/youtube-rss";
import { classifyBoardGameVideo } from "@/lib/board-game-classify";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

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
// GET /api/cron/board-game-youtube
//
// Polls board_game_channels for new videos via RSS, then fetches full
// metadata from YouTube API. Stores discovered videos in board_game_videos.
// ---------------------------------------------------------------------------
export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = getAdminClient();

  // Fetch active board game channels
  const { data: channels, error: channelsError } = await supabase
    .from("board_game_channels")
    .select("id, youtube_channel_id, channel_name")
    .eq("active", true);

  if (channelsError) {
    console.error("Failed to fetch board game channels:", channelsError);
    return NextResponse.json(
      { error: "Failed to fetch channels" },
      { status: 500 },
    );
  }

  if (!channels || channels.length === 0) {
    return NextResponse.json({ message: "No board game channels to poll" });
  }

  let totalNewVideos = 0;
  let totalRssVideos = 0;
  const errors: string[] = [];

  for (const channel of channels) {
    try {
      const rssVideos = await fetchChannelFeed(channel.youtube_channel_id);
      totalRssVideos += rssVideos.length;

      if (rssVideos.length === 0) continue;

      // Check which videos already exist
      const rssVideoIds = rssVideos.map((v) => v.videoId);
      const { data: existingRows } = await supabase
        .from("board_game_videos")
        .select("youtube_video_id")
        .in("youtube_video_id", rssVideoIds);

      const existingIds = new Set(
        (existingRows ?? []).map((r) => r.youtube_video_id),
      );

      const newRssVideos = rssVideos.filter(
        (v) => !existingIds.has(v.videoId),
      );

      if (newRssVideos.length === 0) continue;

      // Fetch full video details from YouTube API
      const newVideoIds = newRssVideos.map((v) => v.videoId);
      const videoDetails = await getVideoDetails(newVideoIds);

      // Classify and insert
      const rows = videoDetails.map((video) => {
        const durationSeconds = parseDuration(
          video.contentDetails?.duration ?? "PT0S",
        );
        const contentType = classifyBoardGameVideo(
          video.snippet.title,
          video.snippet.description,
        );

        return {
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
          content_type: contentType,
        };
      });

      const { error: upsertError } = await supabase
        .from("board_game_videos")
        .upsert(rows, {
          onConflict: "youtube_video_id",
          ignoreDuplicates: false,
        });

      if (upsertError) {
        console.error(
          `Upsert error for channel ${channel.channel_name}:`,
          upsertError,
        );
        errors.push(`${channel.channel_name}: ${upsertError.message}`);
      } else {
        totalNewVideos += rows.length;
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.error(
        `Error polling board game channel ${channel.channel_name}:`,
        message,
      );
      errors.push(`${channel.channel_name}: ${message}`);
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
