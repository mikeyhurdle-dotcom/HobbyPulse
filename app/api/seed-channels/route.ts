import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { searchChannel, getChannelById } from "@/lib/youtube";
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
//
// Body (optional):
//   { channelId?: string, channelName?: string }
//
// If `channelId` is provided, skips the search step and looks up the channel
// directly by ID (saves 100 quota units). `channelName` is used as a label
// in the results only.
//
// If neither is provided, seeds all channels from the vertical config using
// the search API as before.
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
      {
        error: `Could not find ${siteVertical.slug} vertical. Make sure it exists in the verticals table.`,
      },
      { status: 500 },
    );
  }

  const verticalId = vertical.id;

  // Check for optional body with channelId for direct seeding
  let body: { channelId?: string; channelName?: string } = {};
  try {
    body = await request.json();
  } catch {
    // No body or invalid JSON — proceed with full seed
  }

  // --- Single channel seed by ID (zero search quota) ---
  if (body.channelId) {
    try {
      const channelData = await getChannelById(body.channelId);

      if (!channelData) {
        return NextResponse.json(
          { error: `Channel not found for ID: ${body.channelId}` },
          { status: 404 },
        );
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
        subscriber_count: parseInt(
          channelData.statistics.subscriberCount || "0",
          10,
        ),
      };

      const { error: insertError } = await supabase
        .from("channels")
        .upsert(row, {
          onConflict: "youtube_channel_id",
          ignoreDuplicates: true,
        });

      if (insertError) {
        return NextResponse.json(
          { error: `Upsert failed: ${insertError.message}` },
          { status: 500 },
        );
      }

      return NextResponse.json({
        success: true,
        vertical: siteVertical.slug,
        mode: "direct",
        result: {
          name: channelData.snippet.title,
          channelId: channelData.id,
          status: "seeded",
        },
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      return NextResponse.json(
        { error: `Failed to seed channel: ${message}` },
        { status: 500 },
      );
    }
  }

  // --- Full seed from vertical config (uses search API) ---
  const channelNames = siteVertical.channels;
  const results: { name: string; status: string; channelId?: string }[] = [];

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
        subscriber_count: parseInt(
          channelData.statistics.subscriberCount || "0",
          10,
        ),
      };

      const { error: insertError } = await supabase
        .from("channels")
        .upsert(row, {
          onConflict: "youtube_channel_id",
          ignoreDuplicates: true,
        });

      if (insertError) {
        results.push({
          name: channelName,
          status: `error: ${insertError.message}`,
        });
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
    mode: "full",
    summary: { seeded, failed, total: channelNames.length },
    results,
  });
}
