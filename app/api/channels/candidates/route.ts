import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getSiteVertical } from "@/lib/site";

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
// GET /api/channels/candidates
//
// Returns all pending channel candidates ordered by battle_report_count desc,
// with their discovered videos.
// ---------------------------------------------------------------------------
export async function GET(request: NextRequest) {
  // ---- Auth guard ----
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
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

  // Fetch pending candidates
  const { data: candidates, error: candidatesError } = await supabase
    .from("channel_candidates")
    .select("*")
    .eq("vertical_id", verticalRow.id)
    .eq("status", "pending")
    .order("battle_report_count", { ascending: false });

  if (candidatesError) {
    return NextResponse.json(
      { error: `Failed to fetch candidates: ${candidatesError.message}` },
      { status: 500 },
    );
  }

  // Fetch discovered videos for each candidate
  const channelIds = (candidates ?? []).map((c) => c.youtube_channel_id);

  const { data: discoveredVideos } = await supabase
    .from("discovered_videos")
    .select("*")
    .in("youtube_channel_id", channelIds.length > 0 ? channelIds : ["__none__"])
    .order("published_at", { ascending: false });

  // Group videos by channel
  const videosByChannel = new Map<string, typeof discoveredVideos>();
  for (const video of discoveredVideos ?? []) {
    const list = videosByChannel.get(video.youtube_channel_id) ?? [];
    list.push(video);
    videosByChannel.set(video.youtube_channel_id, list);
  }

  const result = (candidates ?? []).map((candidate) => ({
    ...candidate,
    discovered_videos: videosByChannel.get(candidate.youtube_channel_id) ?? [],
  }));

  return NextResponse.json({
    success: true,
    candidates: result,
    total: result.length,
  });
}
