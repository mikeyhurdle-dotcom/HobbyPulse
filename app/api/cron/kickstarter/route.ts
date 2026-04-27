// ---------------------------------------------------------------------------
// Cron: /api/cron/kickstarter
// ---------------------------------------------------------------------------
// Pulls board game Kickstarter projects from Kicktraq and upserts them into
// the kickstarter_projects table. Tabletop-only — sim racing skips early.
// ---------------------------------------------------------------------------

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getSiteVertical } from "@/lib/site";
import { fetchKickstarterProjects } from "@/lib/scrapers/kickstarter";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

function getAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
}

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const config = getSiteVertical();
  if (config.slug !== "tabletop") {
    return NextResponse.json({ skipped: true, reason: "tabletop-only feature" });
  }

  const supabase = getAdminClient();
  const projects = await fetchKickstarterProjects();

  if (projects.length === 0) {
    return NextResponse.json({ scraped: 0, upserted: 0, errors: ["no projects parsed"] });
  }

  const rows = projects.map((p) => ({
    external_id: p.external_id,
    slug: p.slug,
    title: p.title,
    url: p.url,
    image_url: p.image_url,
    creator: p.creator,
    category: "tabletop_games",
    blurb: p.blurb,
    funded_amount: p.funded_amount,
    goal_amount: p.goal_amount,
    currency: p.currency,
    funded_percent: p.funded_percent,
    backers: p.backers,
    ends_at: p.ends_at,
    status: p.status,
    last_synced_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }));

  const { error } = await supabase
    .from("kickstarter_projects")
    .upsert(rows, { onConflict: "external_id" });

  if (error) {
    return NextResponse.json(
      { scraped: projects.length, upserted: 0, error: error.message },
      { status: 500 },
    );
  }

  // Mark anything we DIDN'T see this run and that ended >24h ago as ended.
  const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  await supabase
    .from("kickstarter_projects")
    .update({ status: "ended", updated_at: new Date().toISOString() })
    .lt("ends_at", cutoff)
    .neq("status", "ended");

  return NextResponse.json({ scraped: projects.length, upserted: rows.length });
}
