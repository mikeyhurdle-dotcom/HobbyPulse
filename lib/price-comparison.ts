// ---------------------------------------------------------------------------
// Price comparison — match a board_games row against listings via title.
// ---------------------------------------------------------------------------
// listings rows are populated by the deals scrapers and keyed off products.
// We do a fuzzy title match: an exact-ish ILIKE first, then a relaxed match
// stripping subtitle / edition cruft.
// ---------------------------------------------------------------------------

import { supabase } from "@/lib/supabase";

export interface RetailerPrice {
  source: string;
  price_pence: number;
  affiliate_url: string | null;
  source_url: string;
  in_stock: boolean | null;
}

const SOURCE_LABEL: Record<string, string> = {
  amazon: "Amazon",
  "amazon uk": "Amazon",
  "amazon.co.uk": "Amazon",
  "element games": "Element Games",
  "troll trader": "Troll Trader",
  "magic madhouse": "Magic Madhouse",
  "goblin gaming": "Goblin Gaming",
  "wayland games": "Wayland Games",
  "zatu games": "Zatu Games",
  zatu: "Zatu Games",
  ebay: "eBay",
};

export function prettySource(source: string): string {
  return SOURCE_LABEL[source.toLowerCase()] ?? source;
}

function stripCruft(title: string): string {
  return title
    .replace(/\(.*?\)/g, " ")
    .replace(/[:\-—–|].*$/, " ")
    .replace(/\b(edition|expansion|standalone|core|box|kit)\b/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Find the best price across active retailers for a board game title.
 * Returns one row per retailer (lowest price wins on ties).
 */
export async function getRetailerPricesForTitle(
  title: string,
  verticalId: string,
): Promise<RetailerPrice[]> {
  const tryQueries = [title, stripCruft(title)].filter(
    (t, i, arr) => t.length > 0 && arr.indexOf(t) === i,
  );

  type Row = {
    source: string;
    price_pence: number;
    affiliate_url: string | null;
    source_url: string;
    in_stock: boolean | null;
    products: { vertical_id: string } | null;
  };

  const collected = new Map<string, RetailerPrice>(); // keyed by source

  for (const q of tryQueries) {
    const pattern = `%${q.replace(/[%_]/g, "")}%`;
    const { data } = await supabase
      .from("listings")
      .select(
        `source, price_pence, affiliate_url, source_url, in_stock,
         products!inner ( name, vertical_id )`,
      )
      .eq("products.vertical_id", verticalId)
      .ilike("products.name", pattern)
      .order("price_pence", { ascending: true })
      .limit(40);

    const rows = (data ?? []) as unknown as Row[];
    for (const r of rows) {
      if (!r.products) continue;
      const key = r.source.toLowerCase();
      const existing = collected.get(key);
      if (!existing || r.price_pence < existing.price_pence) {
        collected.set(key, {
          source: r.source,
          price_pence: r.price_pence,
          affiliate_url: r.affiliate_url,
          source_url: r.source_url,
          in_stock: r.in_stock,
        });
      }
    }
    if (collected.size > 0) break; // stop on first non-empty match
  }

  return Array.from(collected.values()).sort(
    (a, b) => a.price_pence - b.price_pence,
  );
}

export function formatGbp(pence: number): string {
  const major = pence / 100;
  if (major >= 1000) return `£${(major).toFixed(0)}`;
  return `£${major.toFixed(2)}`;
}
