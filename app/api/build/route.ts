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

// ---------------------------------------------------------------------------
// Product search candidate generation
// ---------------------------------------------------------------------------
// Turn a raw unit name from an army list into a ranked list of search
// candidates from most-specific to least-specific, so the matcher can
// cascade from a strict lookup to progressively looser ones.
//
// Handles common unit-name patterns that broke the old exact-substring
// match:
//   "Krondys, Son of Dracothion"       → ["Krondys Son of Dracothion", "Krondys"]
//   "Lord Vigilant on Gryph-Stalker"   → [full, hyphen-split, "Lord Vigilant"]
//   "Arch-Revenant"                    → ["Arch-Revenant", "Arch Revenant"]
//   "Squigboss w Gnasha-Squig"         → [full, "Squigboss", etc.]
// ---------------------------------------------------------------------------

const STOPWORDS = new Set([
  "the", "and", "of", "on", "with", "in", "a", "an", "to", "for",
]);

function generateSearchCandidates(unitName: string): string[] {
  const candidates: string[] = [];
  const push = (s: string) => {
    const trimmed = s.trim();
    if (trimmed.length >= 3 && !candidates.includes(trimmed)) {
      candidates.push(trimmed);
    }
  };

  // Strip punctuation except hyphens and collapse whitespace
  const normalise = (s: string) =>
    s
      .replace(/[^a-zA-Z0-9\s-]/g, " ")
      .replace(/\s+/g, " ")
      .trim();

  const full = normalise(unitName);

  // 1. Full stripped name (hyphens preserved)
  push(full);

  // 2. Hyphens → spaces, covers product names that write compound words
  //    with or without hyphens ("Arch-Revenant" vs "Arch Revenant")
  const noHyphen = full.replace(/-/g, " ").replace(/\s+/g, " ").trim();
  push(noHyphen);

  // 3. Part before first comma — handles "Name, Title of Realm" patterns.
  //    Most named characters in Warhammer follow this shape.
  const commaIdx = unitName.indexOf(",");
  if (commaIdx > 0) {
    push(normalise(unitName.slice(0, commaIdx)));
  }

  // 4. First two significant words (drops stopwords)
  const words = full
    .split(/\s+/)
    .filter((w) => w.length >= 3 && !STOPWORDS.has(w.toLowerCase()));
  if (words.length >= 2) {
    push(words.slice(0, 2).join(" "));
  }

  // 5. First significant word — only if it's long enough to be
  //    reasonably distinctive (avoids false positives like "Lord"
  //    matching every Lord product in the catalogue).
  if (words.length >= 1 && words[0].length >= 6) {
    push(words[0]);
  }

  return candidates;
}

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
      // Cascade through candidates from most specific to least specific,
      // stopping at the first query that returns any products. Handles
      // cases where the exact unit name doesn't appear as a substring of
      // the product name but a distinctive token does (e.g. "Krondys" vs
      // "Krondys, Son of Dracothion").
      const candidates = generateSearchCandidates(unit.name);
      type ProductRow = {
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
      };
      let products: ProductRow[] | null = null;

      for (const candidate of candidates) {
        const { data } = await supabase
          .from("products")
          .select(
            `id, name, slug, rrp_pence,
             listings ( price_pence, source, source_url, affiliate_url, in_stock )`,
          )
          .eq("vertical_id", verticalId ?? "")
          .ilike("name", `%${candidate}%`)
          .limit(5);

        if (data && data.length > 0) {
          products = data as unknown as ProductRow[];
          break;
        }
      }

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
