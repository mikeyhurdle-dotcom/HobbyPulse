// ---------------------------------------------------------------------------
// Backfill: generate AI SEO summaries for every battle report
// ---------------------------------------------------------------------------
// Uses Claude Haiku via lib/video-summaries.ts. YouTube's transcript endpoint
// blocks Vercel's datacenter IPs, so we generate unique per-video SEO text
// from the structured data we already have (title, description, army lists,
// factions). See lib/video-summaries.ts for the prompt + rationale.
//
// Idempotent. Call repeatedly with `?limit=` until `remaining: 0`.
//   curl -H "Authorization: Bearer $CRON_SECRET" \
//     "https://tabletopwatch.com/api/admin/backfill-transcripts?limit=30"
// ---------------------------------------------------------------------------

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { generateVideoSummary, saveVideoSummary } from "@/lib/video-summaries";
import { getSiteVertical } from "@/lib/site";

export const maxDuration = 300;
export const dynamic = "force-dynamic";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL ?? "https://placeholder.supabase.co",
  process.env.SUPABASE_SERVICE_ROLE_KEY ?? "placeholder-service-role-key",
);

interface ReportRow {
  id: string;
  youtube_video_id: string;
  title: string;
  description: string | null;
  game_system: string | null;
  channels: { name: string | null } | { name: string | null }[] | null;
  content_lists: {
    player_name: string | null;
    categories: { name: string | null } | { name: string | null }[] | null;
    list_items: { name: string }[];
  }[];
}

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(request.url);
  const limit = Math.min(Number(url.searchParams.get("limit") ?? 20), 40);

  const config = getSiteVertical();
  const { data: verticalRow } = await supabase
    .from("verticals")
    .select("id")
    .eq("slug", config.slug)
    .single();
  if (!verticalRow) return NextResponse.json({ error: "Vertical not found" }, { status: 404 });

  const { data: transcribedRows } = await supabase
    .from("video_transcripts")
    .select("battle_report_id");
  const transcribedIds = new Set(
    (transcribedRows ?? []).map((r: { battle_report_id: string }) => r.battle_report_id),
  );

  const { data: rawReports } = await supabase
    .from("battle_reports")
    .select(
      `id, youtube_video_id, title, description, game_system,
       channels ( name ),
       content_lists (
         player_name,
         categories ( name ),
         list_items ( name )
       )`,
    )
    .eq("vertical_id", verticalRow.id)
    .order("view_count", { ascending: false });

  const reports = (rawReports ?? []) as unknown as ReportRow[];
  const todo = reports.filter((r) => !transcribedIds.has(r.id)).slice(0, limit);

  let saved = 0;
  let failed = 0;

  for (const r of todo) {
    // Normalise Supabase's inconsistent array/object shapes for embedded resources
    const channel = Array.isArray(r.channels) ? r.channels[0] : r.channels;
    const factions: string[] = [];
    const armyLists = (r.content_lists ?? []).map((cl) => {
      const cat = Array.isArray(cl.categories) ? cl.categories[0] : cl.categories;
      const factionName = cat?.name ?? null;
      if (factionName && !factions.includes(factionName)) factions.push(factionName);
      return {
        playerName: cl.player_name,
        factionName,
        units: (cl.list_items ?? []).map((i) => i.name).filter(Boolean),
      };
    });

    const result = await generateVideoSummary({
      battleReportId: r.id,
      title: r.title,
      description: r.description,
      channelName: channel?.name ?? null,
      gameSystem: r.game_system,
      factions,
      armyLists,
      vertical: config.slug as "warhammer" | "simracing",
    });

    if (result) {
      const savedResult = await saveVideoSummary(r.id, result.text);
      if (savedResult.saved) saved++;
      else failed++;
    } else {
      failed++;
    }

    // Gentle pacing to stay under Anthropic rate limits (well below)
    await new Promise((res) => setTimeout(res, 300));
  }

  const totalForVertical = reports.length;
  const alreadyTranscribed = reports.filter((r) => transcribedIds.has(r.id)).length;
  const remaining = totalForVertical - alreadyTranscribed - saved - failed;

  return NextResponse.json({
    ok: true,
    vertical: config.slug,
    processed: todo.length,
    saved,
    failed,
    totalForVertical,
    remaining: Math.max(0, remaining),
  });
}
