import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

function getAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
}

export async function POST(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { bot_name, status, notes } = body;

  if (!bot_name || !status) {
    return NextResponse.json(
      { error: "bot_name and status are required" },
      { status: 400 },
    );
  }

  const supabase = getAdminClient();

  const { error } = await supabase.from("ops_bot_health").upsert(
    {
      bot_name,
      status,
      notes: notes ?? null,
      last_run_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    { onConflict: "bot_name" },
  );

  if (error) {
    console.error("Heartbeat upsert error:", error);
    return NextResponse.json(
      { error: "Failed to store heartbeat" },
      { status: 500 },
    );
  }

  return NextResponse.json({ success: true, bot_name, status });
}
