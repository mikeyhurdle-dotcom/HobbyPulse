import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { searchChannel } from "@/lib/youtube";
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
// POST /api/seed-channels
// ---------------------------------------------------------------------------
export async function POST(request: NextRequest) {
  // ---- Auth guard ----
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = getAdminClient();
  const siteVertical = getSiteVertical();

  // 1. Look up the vertical
  const { data: vertical, error: verticalError } = await supabase
    .from("verticals")
    .select("id")
    .eq("slug", siteVertical.slug)
    .single();

  if (verticalError || !vertical) {
    return NextResponse.json(
      { error: `Could not find ${siteVertical.slug} vertical. Make sure it exists in the verticals table.` },
      { status: 500 },
    );
  }

  const verticalId = vertical.id;
  const channelNames = siteVertical.channels;
  const results: { name: string; status: string; channelId?: string }[] = [];

  // 2. For each channel name, look up via YouTube API and insert
  for (const channelName of channelNames) {
    try {
      const channelData = await searchChannel(channelName);

      if (!channelData) {
        results.push({ name: channelName, status: "not_found" });
        continue;
      }

      const row = {
        vertical_id: verticalId,
        youtube_channel_id: channelData.id,
        name: channelData.snippet.title,
        thumbnail_url:
          channelData.snippet.thumbnails.high?.url ??
          channelData.snippet.thumbnails.medium?.url ??
          channelData.snippet.thumbnails.default?.url ??
          null,
        subscriber_count: parseInt(channelData.statistics.subscriberCount || "0", 10),
      };

      const { error: insertError } = await supabase
        .from("channels")
        .upsert(row, { onConflict: "youtube_channel_id", ignoreDuplicates: true });

      if (insertError) {
        results.push({ name: channelName, status: `error: ${insertError.message}` });
      } else {
        results.push({
          name: channelData.snippet.title,
          status: "seeded",
          channelId: channelData.id,
        });
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      results.push({ name: channelName, status: `error: ${message}` });
    }
  }

  const seeded = results.filter((r) => r.status === "seeded").length;
  const failed = results.filter((r) => r.status !== "seeded").length;

  return NextResponse.json({
    success: true,
    vertical: siteVertical.slug,
    summary: { seeded, failed, total: channelNames.length },
    results,
  });
}
