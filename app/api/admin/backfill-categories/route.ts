// ---------------------------------------------------------------------------
// Backfill: product → category assignment
// ---------------------------------------------------------------------------
// Products are scraped without category tags (`category_id` is null). The
// `categories` table has ~85 warhammer categories and ~30 sim racing
// categories, each with a keyword list. This route matches products to
// categories by substring-matching product.name against every category's
// keywords (longest match wins so "space wolves" beats "space marines").
//
// Protected by CRON_SECRET. Idempotent — re-running it only updates products
// whose best-match category has changed.
//
// Usage:
//   curl -H "Authorization: Bearer $CRON_SECRET" \
//     "https://tabletopwatch.com/api/admin/backfill-categories"
// ---------------------------------------------------------------------------

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getSiteVertical } from "@/lib/site";

export const maxDuration = 120;
export const dynamic = "force-dynamic";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL ?? "https://placeholder.supabase.co",
  process.env.SUPABASE_SERVICE_ROLE_KEY ?? "placeholder-service-role-key",
);

interface Category {
  id: string;
  slug: string;
  name: string;
  keywords: string[];
}

interface Product {
  id: string;
  name: string;
  category_id: string | null;
}

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const config = getSiteVertical();

  const { data: verticalRow } = await supabase
    .from("verticals")
    .select("id")
    .eq("slug", config.slug)
    .single();

  if (!verticalRow) {
    return NextResponse.json({ error: "Vertical not found" }, { status: 404 });
  }

  const verticalId = verticalRow.id;

  // Fetch all categories (with keywords) and products in one shot.
  const [catsRes, prodsRes] = await Promise.all([
    supabase
      .from("categories")
      .select("id, slug, name, keywords")
      .eq("vertical_id", verticalId),
    supabase
      .from("products")
      .select("id, name, category_id")
      .eq("vertical_id", verticalId),
  ]);

  const categories = (catsRes.data ?? []) as Category[];
  const products = (prodsRes.data ?? []) as Product[];

  // Pre-build a flat list of (category, keyword) pairs sorted by keyword
  // length descending so longer/more-specific keywords win first.
  const candidates: { categoryId: string; keyword: string }[] = [];
  for (const cat of categories) {
    for (const kw of cat.keywords ?? []) {
      if (kw && kw.length >= 3) {
        candidates.push({ categoryId: cat.id, keyword: kw.toLowerCase() });
      }
    }
  }
  candidates.sort((a, b) => b.keyword.length - a.keyword.length);

  // Classify every product and collect the updates that actually change anything.
  const updates: { id: string; category_id: string }[] = [];
  const matched: Record<string, number> = {};
  let unmatched = 0;

  for (const product of products) {
    const lower = product.name.toLowerCase();
    let best: string | null = null;
    for (const c of candidates) {
      if (lower.includes(c.keyword)) {
        best = c.categoryId;
        break;
      }
    }
    if (!best) {
      unmatched++;
      continue;
    }
    if (product.category_id !== best) {
      updates.push({ id: product.id, category_id: best });
    }
    matched[best] = (matched[best] ?? 0) + 1;
  }

  // Apply updates in chunks of 100 (PostgREST body limits).
  const CHUNK = 100;
  let applied = 0;
  for (let i = 0; i < updates.length; i += CHUNK) {
    const chunk = updates.slice(i, i + CHUNK);
    // Single UPDATE per product — cheap, fine for one-off backfill.
    for (const u of chunk) {
      const { error } = await supabase
        .from("products")
        .update({ category_id: u.category_id })
        .eq("id", u.id);
      if (!error) applied++;
    }
  }

  // Top 10 categories by hit count, resolved to names for a readable summary.
  const catsById = new Map(categories.map((c) => [c.id, c]));
  const topCategories = Object.entries(matched)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([id, count]) => ({
      slug: catsById.get(id)?.slug ?? id,
      name: catsById.get(id)?.name ?? id,
      count,
    }));

  return NextResponse.json({
    ok: true,
    vertical: config.slug,
    verticalId,
    totalProducts: products.length,
    totalCategories: categories.length,
    matchedProducts: products.length - unmatched,
    unmatched,
    updatesApplied: applied,
    updatesSkipped: updates.length - applied,
    topCategories,
  });
}
