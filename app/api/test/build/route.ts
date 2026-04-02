// ---------------------------------------------------------------------------
// Test endpoint: Build My Army flow — /api/test/build
// ---------------------------------------------------------------------------
// Exercises the full Build My Army pipeline: parse army list → find deals.
// Protected by CRON_SECRET. Returns JSON results for automated testing.
//
// Usage: GET /api/test/build?list=<url-encoded army list text>
//        or omit ?list to use a default test list
// ---------------------------------------------------------------------------

import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const DEFAULT_TEST_LIST = `++ Army Roster (2000 Points) ++

++ Character ++
Captain in Terminator Armour [105 pts]

++ Battleline ++
5x Intercessors [90 pts]
5x Assault Intercessors [90 pts]

++ Infantry ++
5x Terminators [200 pts]

++ Vehicle ++
Redemptor Dreadnought [210 pts]

++ Total: 795 pts ++`;

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(request.url);
  const listText = url.searchParams.get("list") || DEFAULT_TEST_LIST;

  // Call the build API internally
  const baseUrl = url.origin;
  const buildRes = await fetch(`${baseUrl}/api/build`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ listText }),
  });

  const body = await buildRes.json();

  if (!buildRes.ok) {
    return NextResponse.json({
      test: "build",
      status: "FAIL",
      error: body.error ?? "Build API returned error",
      httpStatus: buildRes.status,
    });
  }

  // Validate the response structure
  const checks = {
    hasFaction: !!body.faction,
    hasUnits: Array.isArray(body.units) && body.units.length > 0,
    unitCount: body.units?.length ?? 0,
    unitsWithPrices: (body.units ?? []).filter((u: { bestPrice: number | null }) => u.bestPrice !== null).length,
    unitsWithBuyLinks: (body.units ?? []).filter((u: { buyUrl: string | null }) => u.buyUrl !== null).length,
    totalCost: body.totalCost ?? 0,
    totalRrp: body.totalRrp ?? 0,
    savingsPercent: body.savingsPercent ?? 0,
  };

  return NextResponse.json({
    test: "build",
    status: checks.hasUnits ? "PASS" : "FAIL",
    checks,
    result: body,
  });
}
