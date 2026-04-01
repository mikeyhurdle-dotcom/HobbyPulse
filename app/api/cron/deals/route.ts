// ---------------------------------------------------------------------------
// Deals Cron — /api/cron/deals
// ---------------------------------------------------------------------------
// Runs daily at 2am. Scrapes the site vertical's retailers for popular
// products, upserts into products + listings, and records price history.
// Protected by CRON_SECRET.
// ---------------------------------------------------------------------------

import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { getScrapersForVertical, type ScrapedProduct } from "@/lib/scrapers";
import { searchEbay, type EbayProduct } from "@/lib/ebay";
import { normaliseProduct } from "@/lib/normalise";
import { getSiteVertical } from "@/lib/site";

export const maxDuration = 300;
export const dynamic = "force-dynamic";

// Popular search terms per vertical for the crawler
const SEARCH_TERMS: Record<string, string[]> = {
  warhammer: [
    // Starter boxes
    "Combat Patrol",
    "Starter Set",
    // Popular factions
    "Space Marines",
    "Tyranids",
    "Necrons",
    "Orks",
    "Aeldari",
    "Death Guard",
    "Thousand Sons",
    "Adeptus Mechanicus",
    "Tau Empire",
    "Imperial Knights",
    "Chaos Space Marines",
    "World Eaters",
    "Custodes",
    "Grey Knights",
    // Popular units
    "Intercessors",
    "Terminators",
    "Redemptor Dreadnought",
    "Wraithknight",
    "Hive Tyrant",
    "Carnifex",
    // Paints & tools
    "Citadel Paint",
    "Contrast Paint",
  ],
  simracing: [
    "Fanatec wheel base",
    "Sim racing rig",
    "Racing pedals",
    "Direct drive wheel",
  ],
};

export async function GET(request: Request) {
  // Verify CRON_SECRET
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const verticalConfig = getSiteVertical();
  const verticalSlug = verticalConfig.slug;

  const errors: string[] = [];
  let productsUpserted = 0;
  let listingsUpserted = 0;

  // Get vertical ID from Supabase
  const { data: verticalRow } = await supabase
    .from("verticals")
    .select("id")
    .eq("slug", verticalSlug)
    .single();

  if (!verticalRow) {
    return NextResponse.json(
      { error: `Vertical ${verticalSlug} not found in database` },
      { status: 500 },
    );
  }

  const verticalId = verticalRow.id;
  const searchTerms = SEARCH_TERMS[verticalSlug] ?? [];
  const scrapers = getScrapersForVertical(verticalSlug);

  for (const term of searchTerms) {
    // Scrape retailers
    for (const scraper of scrapers) {
      try {
        const products = await scraper.scrape(term);
        for (const product of products.slice(0, 10)) {
          const result = await upsertProduct(product, verticalId, verticalSlug);
          if (result.productUpserted) productsUpserted++;
          if (result.listingUpserted) listingsUpserted++;
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        errors.push(`${scraper.name} / "${term}": ${msg}`);
      }
    }

    // Search eBay if configured
    const hasEbay = verticalConfig.retailers.some((r) => r.name === "eBay");
    if (hasEbay && process.env.EBAY_APP_ID) {
      try {
        const ebayResults = await searchEbay({ keyword: `${term} ${verticalConfig.name}`, limit: 10 });
        for (const item of ebayResults) {
          const result = await upsertEbayProduct(item, verticalId, verticalSlug);
          if (result.productUpserted) productsUpserted++;
          if (result.listingUpserted) listingsUpserted++;
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        errors.push(`eBay / "${term}": ${msg}`);
      }
    }
  }

  return NextResponse.json({
    ok: true,
    timestamp: new Date().toISOString(),
    vertical: verticalSlug,
    productsUpserted,
    listingsUpserted,
    errors: errors.length > 0 ? errors : undefined,
  });
}

// ---------------------------------------------------------------------------
// Upsert helpers
// ---------------------------------------------------------------------------

async function upsertProduct(
  scraped: ScrapedProduct,
  verticalId: string,
  verticalSlug: string,
): Promise<{ productUpserted: boolean; listingUpserted: boolean }> {
  // Normalise the product name
  const { canonicalName } = await normaliseProduct(scraped.name, verticalSlug);
  const slug = slugify(canonicalName);

  // Upsert product
  const { data: product, error: productError } = await supabase
    .from("products")
    .upsert(
      {
        vertical_id: verticalId,
        name: canonicalName,
        slug,
        image_url: scraped.image_url,
        keywords: [scraped.name.toLowerCase()],
      },
      { onConflict: "vertical_id,slug" },
    )
    .select("id")
    .single();

  if (productError || !product) {
    console.error("Product upsert error:", productError?.message);
    return { productUpserted: false, listingUpserted: false };
  }

  // Upsert listing
  const { data: listing, error: listingError } = await supabase
    .from("listings")
    .upsert(
      {
        product_id: product.id,
        source: scraped.source,
        source_url: scraped.source_url,
        price_pence: scraped.price_pence,
        currency: scraped.currency,
        condition: scraped.condition,
        in_stock: scraped.in_stock,
        affiliate_url: scraped.source_url,
        last_scraped_at: new Date().toISOString(),
      },
      { onConflict: "product_id,source,source_url" },
    )
    .select("id")
    .single();

  if (listingError) {
    console.error("Listing upsert error:", listingError.message);
    return { productUpserted: true, listingUpserted: false };
  }

  // Record price history
  if (listing) {
    await supabase.from("price_history").insert({
      listing_id: listing.id,
      price_pence: scraped.price_pence,
      in_stock: scraped.in_stock,
      recorded_at: new Date().toISOString(),
    });
  }

  return { productUpserted: true, listingUpserted: true };
}

async function upsertEbayProduct(
  item: EbayProduct,
  verticalId: string,
  verticalSlug: string,
): Promise<{ productUpserted: boolean; listingUpserted: boolean }> {
  const { canonicalName } = await normaliseProduct(item.title, verticalSlug);
  const slug = slugify(canonicalName);

  const { data: product, error: productError } = await supabase
    .from("products")
    .upsert(
      {
        vertical_id: verticalId,
        name: canonicalName,
        slug,
        image_url: item.imageUrl,
        keywords: [item.title.toLowerCase()],
      },
      { onConflict: "vertical_id,slug" },
    )
    .select("id")
    .single();

  if (productError || !product) {
    console.error("eBay product upsert error:", productError?.message);
    return { productUpserted: false, listingUpserted: false };
  }

  const { data: listing, error: listingError } = await supabase
    .from("listings")
    .upsert(
      {
        product_id: product.id,
        source: "eBay",
        source_url: item.itemUrl,
        source_item_id: item.itemId,
        price_pence: item.pricePence,
        currency: item.currency,
        condition: item.condition,
        in_stock: true,
        affiliate_url: item.affiliateUrl,
        last_scraped_at: new Date().toISOString(),
      },
      { onConflict: "product_id,source,source_url" },
    )
    .select("id")
    .single();

  if (listingError) {
    console.error("eBay listing upsert error:", listingError.message);
    return { productUpserted: true, listingUpserted: false };
  }

  if (listing) {
    await supabase.from("price_history").insert({
      listing_id: listing.id,
      price_pence: item.pricePence,
      in_stock: true,
      recorded_at: new Date().toISOString(),
    });
  }

  return { productUpserted: true, listingUpserted: true };
}

// ---------------------------------------------------------------------------
// Slug helper
// ---------------------------------------------------------------------------

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/['']/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
