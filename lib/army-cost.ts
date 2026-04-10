// ---------------------------------------------------------------------------
// Army cost computation
// ---------------------------------------------------------------------------
// Shared between the /build flow and the battle report video detail page.
// Takes an *already parsed* list of units and returns matched products with
// total build cost. No Haiku calls — the data is already structured.
// ---------------------------------------------------------------------------

import { supabase } from "@/lib/supabase";

export interface ParsedUnit {
  name: string;
  qty: number;
  points: number;
}

export interface MatchedUnit {
  name: string;
  qty: number;
  points: number;
  bestPrice: number | null;
  rrpPence: number | null;
  source: string | null;
  productSlug: string | null;
}

export interface ArmyCostResult {
  units: MatchedUnit[];
  totalCost: number;
  totalRrp: number;
  totalSavings: number;
  savingsPercent: number;
  matchedUnitCount: number;
  unmatchedUnitCount: number;
}

/** Best-price lookup for a single unit name within a vertical. */
async function matchSingleUnit(
  unit: ParsedUnit,
  verticalId: string,
): Promise<MatchedUnit> {
  const searchTerm = unit.name.replace(/[^a-zA-Z0-9\s]/g, "").trim();

  if (!searchTerm) {
    return {
      ...unit,
      bestPrice: null,
      rrpPence: null,
      source: null,
      productSlug: null,
    };
  }

  const { data: products } = await supabase
    .from("products")
    .select(
      `id, name, slug, rrp_pence,
       listings ( price_pence, source, in_stock )`,
    )
    .eq("vertical_id", verticalId)
    .ilike("name", `%${searchTerm}%`)
    .limit(5);

  let bestPrice: number | null = null;
  let bestSource: string | null = null;
  let bestSlug: string | null = null;
  let bestRrp: number | null = null;

  type Row = {
    slug: string;
    rrp_pence: number | null;
    listings: { price_pence: number; source: string; in_stock: boolean }[];
  };

  for (const product of (products ?? []) as unknown as Row[]) {
    for (const listing of product.listings ?? []) {
      if (!listing.in_stock) continue;
      if (bestPrice === null || listing.price_pence < bestPrice) {
        bestPrice = listing.price_pence;
        bestSource = listing.source;
        bestSlug = product.slug;
        bestRrp = product.rrp_pence;
      }
    }
  }

  return {
    name: unit.name,
    qty: unit.qty,
    points: unit.points,
    bestPrice,
    rrpPence: bestRrp,
    source: bestSource,
    productSlug: bestSlug,
  };
}

/**
 * Compute total build cost for a pre-parsed list of units.
 * Runs matches in parallel to keep latency reasonable even with 20+ units.
 */
export async function computeArmyCost(
  units: ParsedUnit[],
  verticalId: string,
): Promise<ArmyCostResult> {
  if (units.length === 0) {
    return {
      units: [],
      totalCost: 0,
      totalRrp: 0,
      totalSavings: 0,
      savingsPercent: 0,
      matchedUnitCount: 0,
      unmatchedUnitCount: 0,
    };
  }

  // Fan out lookups — Supabase handles the concurrency fine.
  const matched = await Promise.all(
    units.map((u) => matchSingleUnit(u, verticalId)),
  );

  let totalCost = 0;
  let totalRrp = 0;
  let matchedCount = 0;

  for (const m of matched) {
    if (m.bestPrice !== null) {
      totalCost += m.bestPrice * m.qty;
      totalRrp += (m.rrpPence ?? 0) * m.qty;
      matchedCount++;
    }
  }

  const totalSavings = totalRrp > totalCost ? totalRrp - totalCost : 0;
  const savingsPercent = totalRrp > 0 ? Math.round((totalSavings / totalRrp) * 100) : 0;

  return {
    units: matched,
    totalCost,
    totalRrp,
    totalSavings,
    savingsPercent,
    matchedUnitCount: matchedCount,
    unmatchedUnitCount: units.length - matchedCount,
  };
}

/**
 * Serialise a parsed list back to the plain-text format that /build accepts,
 * so the "Build this army" button can prefill the form via `?list=`.
 */
export function serializeListForBuild(
  faction: string | null,
  units: ParsedUnit[],
): string {
  const lines: string[] = [];
  if (faction) lines.push(`++ ${faction} ++`);
  lines.push("");
  for (const u of units) {
    const qty = u.qty > 1 ? `${u.qty}x ` : "";
    const pts = u.points > 0 ? ` [${u.points} pts]` : "";
    lines.push(`${qty}${u.name}${pts}`);
  }
  return lines.join("\n");
}
