// ---------------------------------------------------------------------------
// POST /api/build — "Build My Army Cheap"
// ---------------------------------------------------------------------------
// Accepts a raw army list, parses it with Claude Haiku, then searches the
// products + listings tables for the best price per unit.
// ---------------------------------------------------------------------------

import { NextResponse } from "next/server";
import { parseArmyList } from "@/lib/parser";
import { supabase } from "@/lib/supabase";
import { getSiteVertical } from "@/lib/site";
import { wrapAffiliateUrl } from "@/lib/affiliate";

export const maxDuration = 60;

interface MatchedUnit {
  name: string;
  qty: number;
  points: number;
  bestPrice: number | null;
  rrpPence: number | null;
  source: string | null;
  buyUrl: string | null;
  productSlug: string | null;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { listText } = body as { listText?: string };

    if (!listText || typeof listText !== "string" || listText.trim().length < 10) {
      return NextResponse.json(
        { error: "Please provide an army list with at least a few units" },
        { status: 400 },
      );
    }

    // Parse with Claude Haiku
    const parsedLists = await parseArmyList(listText);
    if (parsedLists.length === 0) {
      return NextResponse.json(
        { error: "Could not parse any army lists from the text provided" },
        { status: 422 },
      );
    }

    // Use the first (highest-confidence) list
    const list = parsedLists[0];

    // Get vertical ID
    const config = getSiteVertical();
    const { data: verticalRow } = await supabase
      .from("verticals")
      .select("id")
      .eq("slug", config.slug)
      .single();

    const verticalId = verticalRow?.id;

    // For each unit, search products + listings for the best price
    const matchedUnits: MatchedUnit[] = [];
    let totalCost = 0;
    let totalRrp = 0;

    for (const unit of list.units) {
      // Search products by name (fuzzy ilike)
      const searchTerm = unit.name
        .replace(/[^a-zA-Z0-9\s]/g, "")
        .trim();

      const { data: products } = await supabase
        .from("products")
        .select(
          `id, name, slug, rrp_pence,
           listings ( price_pence, source, source_url, affiliate_url, in_stock )`,
        )
        .eq("vertical_id", verticalId ?? "")
        .ilike("name", `%${searchTerm}%`)
        .limit(5);

      // Find the single cheapest in-stock listing across all matched products
      let bestPrice: number | null = null;
      let bestSource: string | null = null;
      let bestUrl: string | null = null;
      let bestSlug: string | null = null;
      let bestRrp: number | null = null;

      for (const product of (products ?? []) as unknown as {
        id: string;
        name: string;
        slug: string;
        rrp_pence: number | null;
        listings: {
          price_pence: number;
          source: string;
          source_url: string;
          affiliate_url: string | null;
          in_stock: boolean;
        }[];
      }[]) {
        for (const listing of product.listings ?? []) {
          if (!listing.in_stock) continue;
          if (bestPrice === null || listing.price_pence < bestPrice) {
            bestPrice = listing.price_pence;
            bestSource = listing.source;
            bestUrl = listing.affiliate_url || listing.source_url;
            bestSlug = product.slug;
            bestRrp = product.rrp_pence;
          }
        }
      }

      // Wrap affiliate URL
      if (bestUrl) {
        bestUrl = wrapAffiliateUrl(bestUrl, "build-army");
      }

      const unitCost = (bestPrice ?? 0) * unit.qty;
      const unitRrp = (bestRrp ?? 0) * unit.qty;
      totalCost += unitCost;
      totalRrp += unitRrp;

      matchedUnits.push({
        name: unit.name,
        qty: unit.qty,
        points: unit.points,
        bestPrice,
        rrpPence: bestRrp,
        source: bestSource,
        buyUrl: bestUrl,
        productSlug: bestSlug,
      });
    }

    const totalSavings = totalRrp > 0 ? totalRrp - totalCost : 0;
    const savingsPercent =
      totalRrp > 0 ? Math.round((totalSavings / totalRrp) * 100) : 0;

    return NextResponse.json({
      faction: list.faction,
      detachment: list.detachment,
      totalPoints: list.total_points,
      units: matchedUnits,
      totalCost,
      totalRrp,
      totalSavings,
      savingsPercent,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("POST /api/build error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
