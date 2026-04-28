// ---------------------------------------------------------------------------
// Cron: Price Alerts — /api/cron/price-alerts
// ---------------------------------------------------------------------------
// Runs daily at 8am. Checks all active alerts and sends emails where the
// current best price is at or below the target. Protected by CRON_SECRET.
// ---------------------------------------------------------------------------

import { NextResponse } from "next/server";
import { checkAndSendAlerts } from "@/lib/price-alerts";
import { tychoHeartbeat } from "@/lib/tycho";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  // Verify CRON_SECRET
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // === TYCHO_HEARTBEAT_WRAP === (added by Tycho instrumentation)
  const _tychoHour = new Date().getUTCHours();
  const _tychoUuid = _tychoHour < 12
    ? process.env.TYCHO_UUID_PRICE_ALERTS_AM
    : process.env.TYCHO_UUID_PRICE_ALERTS_PM;
  return tychoHeartbeat(_tychoUuid, async () => {
    const result = await checkAndSendAlerts();

    return NextResponse.json({
      ok: true,
      timestamp: new Date().toISOString(),
      alertsSent: result.sent,
    });
  });
}
