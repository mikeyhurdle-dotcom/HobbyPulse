import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { searchBattleReports } from "@/lib/youtube-discover";
import { classifyVideo, isBattleReport, isShort } from "@/lib/classify";
import { getSiteVertical, isSrwSunset } from "@/lib/site";

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
// GET /api/cron/discover
//
// Daily discovery job — searches YouTube for battle reports from ANY channel,
// discovers new channels, and ingests qualifying videos into battle_reports.
//
// Flow:
// 1. Get the site vertical config
// 2. Search YouTube for battle reports matching discovery terms
// 3. Get existing monitored channel IDs + existing video IDs
// 4. For each result:
//    a. From monitored channel + not in battle_reports → upsert to battle_reports
//    b. From unknown channel → upsert to discovered_videos + channel_candidates
//       If it matches isBattleReport() → also upsert to battle_reports
// 5. Flag hot candidates (battle_report_count >= 3)
// 6. Return summary
// ---------------------------------------------------------------------------
export async function GET(request: NextRequest) {
  // ---- Auth guard ----
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // SUNSET 2026-04-30 per pivot decision — SRW channel discovery halted.
  if (isSrwSunset()) {
    return NextResponse.json({ ok: true, skipped: true, reason: "SRW sunset 2026-04-30" });
  }

  const supabase = getAdminClient();
  const siteVertical = getSiteVertical();

  // Look up the vertical ID
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

  const verticalId = verticalRow.id;

  // 2. Search YouTube
  let searchResults;
  try {
    searchResults = await searchBattleReports(siteVertical.slug);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("Discovery search failed:", message);
    return NextResponse.json(
      { error: `Discovery search failed: ${message}` },
      { status: 500 },
    );
  }

  if (searchResults.length === 0) {
    return NextResponse.json({
      success: true,
      message: "No search results found",
      newVideos: 0,
      newChannels: 0,
      hotCandidates: 0,
    });
  }

  // 3. Get existing monitored channel IDs
  const { data: monitoredChannels } = await supabase
    .from("channels")
    .select("youtube_channel_id, id")
    .eq("vertical_id", verticalId);

  const monitoredChannelMap = new Map(
    (monitoredChannels ?? []).map((c) => [c.youtube_channel_id, c.id]),
  );

  // Get existing video IDs from battle_reports
  const searchVideoIds = searchResults.map((v) => v.videoId);
  const { data: existingReports } = await supabase
    .from("battle_reports")
    .select("youtube_video_id")
    .in("youtube_video_id", searchVideoIds);

  const existingReportIds = new Set(
    (existingReports ?? []).map((r) => r.youtube_video_id),
  );

  // Get existing video IDs from discovered_videos
  const { data: existingDiscovered } = await supabase
    .from("discovered_videos")
    .select("youtube_video_id")
    .in("youtube_video_id", searchVideoIds);

  const existingDiscoveredIds = new Set(
    (existingDiscovered ?? []).map((r) => r.youtube_video_id),
  );

  let newVideosCount = 0;
  let newChannelsDiscovered = 0;
  const channelVideoCountIncrements = new Map<string, { total: number; battleReports: number }>();
  const errors: string[] = [];

  for (const video of searchResults) {
    const contentType = classifyVideo(video.title, video.durationSeconds);
    const videoIsShort = isShort(video.durationSeconds);
    const videoIsBattleReport = isBattleReport(video.title, video.durationSeconds);

    if (monitoredChannelMap.has(video.channelId)) {
      // 4a. From a monitored channel — if not already in battle_reports, upsert
      if (!existingReportIds.has(video.videoId)) {
        const channelDbId = monitoredChannelMap.get(video.channelId)!;
        const { error } = await supabase
          .from("battle_reports")
          .upsert(
            {
              vertical_id: verticalId,
              channel_id: channelDbId,
              youtube_video_id: video.videoId,
              title: video.title,
              description: video.description,
              thumbnail_url: video.thumbnailUrl || null,
              published_at: video.publishedAt,
              duration_seconds: video.durationSeconds,
              view_count: video.viewCount,
              content_type: contentType,
              is_short: videoIsShort,
            },
            { onConflict: "youtube_video_id", ignoreDuplicates: false },
          );

        if (error) {
          errors.push(`battle_reports upsert (${video.videoId}): ${error.message}`);
        } else {
          newVideosCount++;
          existingReportIds.add(video.videoId);
        }
      }
    } else {
      // 4b. From an unknown channel
      // Track increments for channel_candidates
      if (!channelVideoCountIncrements.has(video.channelId)) {
        channelVideoCountIncrements.set(video.channelId, { total: 0, battleReports: 0 });
      }
      const counts = channelVideoCountIncrements.get(video.channelId)!;
      counts.total++;
      if (videoIsBattleReport) counts.battleReports++;

      // Upsert to discovered_videos
      if (!existingDiscoveredIds.has(video.videoId)) {
        const { error } = await supabase
          .from("discovered_videos")
          .upsert(
            {
              vertical_id: verticalId,
              youtube_video_id: video.videoId,
              youtube_channel_id: video.channelId,
              channel_name: video.channelName,
              title: video.title,
              description: video.description,
              thumbnail_url: video.thumbnailUrl || null,
              published_at: video.publishedAt,
              duration_seconds: video.durationSeconds,
              view_count: video.viewCount,
              content_type: contentType,
              is_short: videoIsShort,
              ingested_to_reports: videoIsBattleReport,
            },
            { onConflict: "youtube_video_id", ignoreDuplicates: false },
          );

        if (error) {
          errors.push(`discovered_videos upsert (${video.videoId}): ${error.message}`);
        } else {
          newVideosCount++;
          existingDiscoveredIds.add(video.videoId);
        }
      }

      // If it's a battle report, also upsert to battle_reports so it shows on Watch
      if (videoIsBattleReport && !existingReportIds.has(video.videoId)) {
        const { error } = await supabase
          .from("battle_reports")
          .upsert(
            {
              vertical_id: verticalId,
              channel_id: null,
              youtube_video_id: video.videoId,
              title: video.title,
              description: video.description,
              thumbnail_url: video.thumbnailUrl || null,
              published_at: video.publishedAt,
              duration_seconds: video.durationSeconds,
              view_count: video.viewCount,
              content_type: contentType,
              is_short: videoIsShort,
            },
            { onConflict: "youtube_video_id", ignoreDuplicates: false },
          );

        if (error) {
          errors.push(`battle_reports upsert from discovery (${video.videoId}): ${error.message}`);
        } else {
          existingReportIds.add(video.videoId);
        }
      }
    }
  }

  // 5. Upsert channel_candidates
  const uniqueChannels = new Map<string, typeof searchResults[0]>();
  for (const video of searchResults) {
    if (!monitoredChannelMap.has(video.channelId) && !uniqueChannels.has(video.channelId)) {
      uniqueChannels.set(video.channelId, video);
    }
  }

  for (const [channelId, sampleVideo] of uniqueChannels) {
    // Check if candidate already exists
    const { data: existing } = await supabase
      .from("channel_candidates")
      .select("id, video_count, battle_report_count")
      .eq("youtube_channel_id", channelId)
      .maybeSingle();

    const increments = channelVideoCountIncrements.get(channelId) ?? { total: 0, battleReports: 0 };

    if (existing) {
      // Update existing candidate
      const { error } = await supabase
        .from("channel_candidates")
        .update({
          channel_name: sampleVideo.channelName,
          video_count: existing.video_count + increments.total,
          battle_report_count: existing.battle_report_count + increments.battleReports,
          last_seen_at: new Date().toISOString(),
        })
        .eq("id", existing.id);

      if (error) {
        errors.push(`channel_candidates update (${channelId}): ${error.message}`);
      }
    } else {
      // Insert new candidate
      const { error } = await supabase
        .from("channel_candidates")
        .insert({
          vertical_id: verticalId,
          youtube_channel_id: channelId,
          channel_name: sampleVideo.channelName,
          thumbnail_url: null,
          subscriber_count: null,
          video_count: increments.total,
          battle_report_count: increments.battleReports,
        });

      if (error) {
        errors.push(`channel_candidates insert (${channelId}): ${error.message}`);
      } else {
        newChannelsDiscovered++;
      }
    }
  }

  // 6. Count hot candidates (battle_report_count >= 3 AND status = 'pending')
  const { count: hotCandidates } = await supabase
    .from("channel_candidates")
    .select("id", { count: "exact", head: true })
    .eq("vertical_id", verticalId)
    .eq("status", "pending")
    .gte("battle_report_count", 3);

  return NextResponse.json({
    success: true,
    searchResultsTotal: searchResults.length,
    newVideos: newVideosCount,
    newChannelsDiscovered,
    hotCandidates: hotCandidates ?? 0,
    errors: errors.length > 0 ? errors : undefined,
  });
}
