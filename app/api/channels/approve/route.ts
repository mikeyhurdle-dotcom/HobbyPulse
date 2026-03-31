import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getSiteVertical } from "@/lib/site";
import { classifyVideo, isShort } from "@/lib/classify";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

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
// POST /api/channels/approve
//
// Body: { channelId: string, action: "approve" | "dismiss" }
//
// Approve: insert into channels table, move discovered_videos to battle_reports
// Dismiss: update channel_candidates status to 'dismissed'
// ---------------------------------------------------------------------------
export async function POST(request: NextRequest) {
  // ---- Auth guard ----
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { channelId?: string; action?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON body" },
      { status: 400 },
    );
  }

  const { channelId, action } = body;

  if (!channelId || !action || !["approve", "dismiss"].includes(action)) {
    return NextResponse.json(
      { error: "Body must include channelId and action ('approve' | 'dismiss')" },
      { status: 400 },
    );
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

  // Fetch the channel candidate
  const { data: candidate } = await supabase
    .from("channel_candidates")
    .select("*")
    .eq("youtube_channel_id", channelId)
    .single();

  if (!candidate) {
    return NextResponse.json(
      { error: `Channel candidate not found: ${channelId}` },
      { status: 404 },
    );
  }

  if (action === "dismiss") {
    const { error } = await supabase
      .from("channel_candidates")
      .update({
        status: "dismissed",
        reviewed_at: new Date().toISOString(),
      })
      .eq("id", candidate.id);

    if (error) {
      return NextResponse.json(
        { error: `Failed to dismiss: ${error.message}` },
        { status: 500 },
      );
    }

    return NextResponse.json({
      success: true,
      action: "dismissed",
      channelId,
      channelName: candidate.channel_name,
    });
  }

  // action === "approve"
  // 1. Insert into channels table
  const { data: newChannel, error: channelError } = await supabase
    .from("channels")
    .upsert(
      {
        vertical_id: verticalRow.id,
        youtube_channel_id: candidate.youtube_channel_id,
        name: candidate.channel_name,
        thumbnail_url: candidate.thumbnail_url,
        subscriber_count: candidate.subscriber_count,
      },
      { onConflict: "youtube_channel_id", ignoreDuplicates: false },
    )
    .select("id")
    .single();

  if (channelError) {
    return NextResponse.json(
      { error: `Failed to insert channel: ${channelError.message}` },
      { status: 500 },
    );
  }

  // 2. Update channel_candidates status
  await supabase
    .from("channel_candidates")
    .update({
      status: "approved",
      reviewed_at: new Date().toISOString(),
    })
    .eq("id", candidate.id);

  // 3. Move discovered_videos to battle_reports
  const { data: discoveredVideos } = await supabase
    .from("discovered_videos")
    .select("*")
    .eq("youtube_channel_id", channelId)
    .eq("ingested_to_reports", false);

  let migratedCount = 0;

  if (discoveredVideos && discoveredVideos.length > 0) {
    const rows = discoveredVideos.map((v) => ({
      vertical_id: v.vertical_id,
      channel_id: newChannel.id,
      youtube_video_id: v.youtube_video_id,
      title: v.title,
      description: v.description,
      thumbnail_url: v.thumbnail_url,
      published_at: v.published_at,
      duration_seconds: v.duration_seconds,
      view_count: v.view_count,
      content_type: classifyVideo(v.title, v.duration_seconds ?? 0),
      is_short: isShort(v.duration_seconds ?? 0),
    }));

    const { error: upsertError } = await supabase
      .from("battle_reports")
      .upsert(rows, { onConflict: "youtube_video_id", ignoreDuplicates: false });

    if (!upsertError) {
      migratedCount = rows.length;

      // Mark as ingested
      const videoIds = discoveredVideos.map((v) => v.youtube_video_id);
      await supabase
        .from("discovered_videos")
        .update({ ingested_to_reports: true })
        .in("youtube_video_id", videoIds);
    }
  }

  // Also update any battle_reports that were already ingested from discovery
  // (they had channel_id = null) — now link them to the new channel
  await supabase
    .from("battle_reports")
    .update({ channel_id: newChannel.id })
    .is("channel_id", null)
    .in(
      "youtube_video_id",
      (discoveredVideos ?? []).map((v) => v.youtube_video_id),
    );

  return NextResponse.json({
    success: true,
    action: "approved",
    channelId,
    channelName: candidate.channel_name,
    newChannelDbId: newChannel.id,
    videosMigrated: migratedCount,
  });
}
