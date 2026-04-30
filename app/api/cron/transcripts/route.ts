// ---------------------------------------------------------------------------
// Daily cron: generate AI SEO summaries for any new battle reports
// ---------------------------------------------------------------------------
// Runs after the YouTube ingest + parse crons so newly-discovered videos get
// their SEO text on the same day they land. See lib/video-summaries.ts.
// ---------------------------------------------------------------------------

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { generateVideoSummary, saveVideoSummary } from "@/lib/video-summaries";
import { getSiteVertical, isSrwSunset } from "@/lib/site";

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

  // SUNSET 2026-04-30 per pivot decision — SRW transcript summaries halted.
  if (isSrwSunset()) {
    return NextResponse.json({ ok: true, skipped: true, reason: "SRW sunset 2026-04-30" });
  }

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
    .order("published_at", { ascending: false })
    .limit(60);

  const reports = (rawReports ?? []) as unknown as ReportRow[];
  const todo = reports.filter((r) => !transcribedIds.has(r.id)).slice(0, 15);

  let saved = 0;
  let failed = 0;

  for (const r of todo) {
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
      vertical: config.slug as "tabletop" | "simracing",
    });

    if (result) {
      const savedResult = await saveVideoSummary(r.id, result.text);
      if (savedResult.saved) saved++;
      else failed++;
    } else {
      failed++;
    }

    await new Promise((res) => setTimeout(res, 250));
  }

  return NextResponse.json({
    ok: true,
    vertical: config.slug,
    processed: todo.length,
    saved,
    failed,
  });
}
