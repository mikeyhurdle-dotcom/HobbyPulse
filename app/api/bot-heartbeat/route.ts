// ---------------------------------------------------------------------------
// Bot Heartbeat — /api/bot-heartbeat
// ---------------------------------------------------------------------------
// POST: PulseBot reports health status per task (youtube, deals, live, etc.)
// GET:  Check overall health — returns per-task status + staleness detection
// Protected by CRON_SECRET.
// ---------------------------------------------------------------------------

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getSiteVertical } from "@/lib/site";

export const dynamic = "force-dynamic";

function getAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
}

// How long before a task is considered stale (in minutes)
const STALE_THRESHOLDS: Record<string, number> = {
  youtube: 180,       // every 2hr → stale after 3hr
  parse: 240,         // after ingest → stale after 4hr
  deals: 420,         // every 6hr → stale after 7hr
  live: 30,           // every 15min → stale after 30min
  "price-alerts": 780, // twice daily → stale after 13hr
  discover: 10200,    // weekly → stale after 7.1 days
  health: 90,         // hourly → stale after 90min
};

// ---------------------------------------------------------------------------
// POST — PulseBot reports task completion
// ---------------------------------------------------------------------------
export async function POST(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { bot_name, status, task, notes, metrics } = body;

  if (!bot_name || !status) {
    return NextResponse.json(
      { error: "bot_name and status are required" },
      { status: 400 },
    );
  }

  const supabase = getAdminClient();

  // Upsert overall bot health
  const { error: healthError } = await supabase.from("ops_bot_health").upsert(
    {
      bot_name,
      status,
      notes: notes ?? null,
      last_run_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    { onConflict: "bot_name" },
  );

  if (healthError) {
    console.error("Heartbeat upsert error:", healthError);
    return NextResponse.json(
      { error: "Failed to store heartbeat" },
      { status: 500 },
    );
  }

  // If a specific task is reported, upsert per-task status
  if (task) {
    const { error: taskError } = await supabase
      .from("ops_bot_health")
      .upsert(
        {
          bot_name: `${bot_name}:${task}`,
          status,
          notes: metrics ? JSON.stringify(metrics) : notes ?? null,
          last_run_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        { onConflict: "bot_name" },
      );

    if (taskError) {
      console.error(`Task heartbeat error (${task}):`, taskError);
    }
  }

  return NextResponse.json({ success: true, bot_name, status, task });
}

// ---------------------------------------------------------------------------
// GET — Check health status (for dashboards / PulseBot self-check)
// ---------------------------------------------------------------------------
export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = getAdminClient();
  const vertical = getSiteVertical();

  // Fetch all PulseBot health rows
  const { data: rows, error } = await supabase
    .from("ops_bot_health")
    .select("bot_name, status, notes, last_run_at, updated_at")
    .like("bot_name", "pulsebot%")
    .order("bot_name");

  if (error) {
    return NextResponse.json(
      { error: "Failed to fetch health data" },
      { status: 500 },
    );
  }

  const now = Date.now();
  const tasks: Record<string, { status: string; last_run: string; stale: boolean; notes: string | null }> = {};
  let overallStatus = "healthy";

  for (const row of rows ?? []) {
    const taskName = row.bot_name.replace("pulsebot:", "");
    const lastRun = new Date(row.last_run_at).getTime();
    const minutesAgo = Math.round((now - lastRun) / 60000);
    const threshold = STALE_THRESHOLDS[taskName];
    const isStale = threshold ? minutesAgo > threshold : false;

    if (isStale || row.status === "error") {
      overallStatus = "degraded";
    }

    tasks[taskName] = {
      status: isStale ? "stale" : row.status,
      last_run: row.last_run_at,
      stale: isStale,
      notes: row.notes,
    };
  }

  // Check for missing env vars
  const envWarnings: string[] = [];
  if (!process.env.EBAY_APP_ID) envWarnings.push("EBAY_APP_ID not set — eBay deals disabled");
  if (!process.env.EBAY_APP_SECRET) envWarnings.push("EBAY_APP_SECRET not set");
  if (!process.env.EBAY_CAMPAIGN_ID) envWarnings.push("EBAY_CAMPAIGN_ID not set — no affiliate tracking");
  if (!process.env.RESEND_API_KEY) envWarnings.push("RESEND_API_KEY not set — price alert emails disabled");
  if (!process.env.NEXT_PUBLIC_GA4_ID) envWarnings.push("NEXT_PUBLIC_GA4_ID not set — analytics disabled");

  return NextResponse.json({
    ok: overallStatus === "healthy",
    status: overallStatus,
    vertical: vertical.slug,
    timestamp: new Date().toISOString(),
    tasks,
    envWarnings: envWarnings.length > 0 ? envWarnings : undefined,
  });
}
