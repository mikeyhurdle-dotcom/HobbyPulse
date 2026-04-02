// ---------------------------------------------------------------------------
// Deals Cron — /api/cron/deals
// ---------------------------------------------------------------------------
// Scrapes retailers, normalises product names (cache-first, Haiku fallback),
// upserts products + listings, records price history, and detects price drops.
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

// ---------------------------------------------------------------------------
// Search terms per vertical
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// Price drop tracking
// ---------------------------------------------------------------------------

interface PriceDrop {
  product: string;
  source: string;
  oldPrice: number;
  newPrice: number;
  dropPercent: number;
  url: string;
}

// ---------------------------------------------------------------------------
// Route handler
// ---------------------------------------------------------------------------

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const verticalConfig = getSiteVertical();
  const verticalSlug = verticalConfig.slug;

  const errors: string[] = [];
  const priceDrops: PriceDrop[] = [];
  let productsUpserted = 0;
  let listingsUpserted = 0;
  let cacheHits = 0;
  let haikuCalls = 0;

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
          const result = await upsertProduct(
            product,
            verticalId,
            verticalSlug,
            scraper.name,
            priceDrops,
          );
          if (result.productUpserted) productsUpserted++;
          if (result.listingUpserted) listingsUpserted++;
          if (result.resolvedBy === "cache" || result.resolvedBy === "fuzzy") cacheHits++;
          if (result.resolvedBy === "haiku") haikuCalls++;
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
        const ebayResults = await searchEbay({
          keyword: `${term} ${verticalConfig.name}`,
          limit: 10,
        });
        for (const item of ebayResults) {
          const result = await upsertEbayProduct(
            item,
            verticalId,
            verticalSlug,
            priceDrops,
          );
          if (result.productUpserted) productsUpserted++;
          if (result.listingUpserted) listingsUpserted++;
          if (result.resolvedBy === "cache" || result.resolvedBy === "fuzzy") cacheHits++;
          if (result.resolvedBy === "haiku") haikuCalls++;
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
    normalisation: { cacheHits, haikuCalls },
    priceDrops: priceDrops.length > 0 ? priceDrops : undefined,
    errors: errors.length > 0 ? errors : undefined,
  });
}

// ---------------------------------------------------------------------------
// Upsert helpers
// ---------------------------------------------------------------------------

interface UpsertResult {
  productUpserted: boolean;
  listingUpserted: boolean;
  resolvedBy: string;
}

async function upsertProduct(
  scraped: ScrapedProduct,
  verticalId: string,
  verticalSlug: string,
  source: string,
  priceDrops: PriceDrop[],
): Promise<UpsertResult> {
  const { canonicalName, resolvedBy } = await normaliseProduct(
    scraped.name,
    verticalSlug,
    source,
  );
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
    return { productUpserted: false, listingUpserted: false, resolvedBy };
  }

  // Check previous price BEFORE upsert (for price drop detection)
  const { data: existingListing } = await supabase
    .from("listings")
    .select("price_pence")
    .eq("product_id", product.id)
    .eq("source", scraped.source)
    .eq("source_url", scraped.source_url)
    .single();

  const oldPrice = existingListing?.price_pence ?? null;

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
    return { productUpserted: true, listingUpserted: false, resolvedBy };
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

  // Detect price drop (>= 10%)
  if (oldPrice !== null && scraped.price_pence < oldPrice) {
    const dropPercent = Math.round(
      ((oldPrice - scraped.price_pence) / oldPrice) * 100,
    );
    if (dropPercent >= 10) {
      priceDrops.push({
        product: canonicalName,
        source: scraped.source,
        oldPrice,
        newPrice: scraped.price_pence,
        dropPercent,
        url: scraped.source_url,
      });
    }
  }

  return { productUpserted: true, listingUpserted: true, resolvedBy };
}

async function upsertEbayProduct(
  item: EbayProduct,
  verticalId: string,
  verticalSlug: string,
  priceDrops: PriceDrop[],
): Promise<UpsertResult> {
  const { canonicalName, resolvedBy } = await normaliseProduct(
    item.title,
    verticalSlug,
    "eBay",
  );
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
    return { productUpserted: false, listingUpserted: false, resolvedBy };
  }

  // Check previous price
  const { data: existingListing } = await supabase
    .from("listings")
    .select("price_pence")
    .eq("product_id", product.id)
    .eq("source", "eBay")
    .eq("source_url", item.itemUrl)
    .single();

  const oldPrice = existingListing?.price_pence ?? null;

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
    return { productUpserted: true, listingUpserted: false, resolvedBy };
  }

  if (listing) {
    await supabase.from("price_history").insert({
      listing_id: listing.id,
      price_pence: item.pricePence,
      in_stock: true,
      recorded_at: new Date().toISOString(),
    });
  }

  // Detect price drop
  if (oldPrice !== null && item.pricePence < oldPrice) {
    const dropPercent = Math.round(
      ((oldPrice - item.pricePence) / oldPrice) * 100,
    );
    if (dropPercent >= 10) {
      priceDrops.push({
        product: canonicalName,
        source: "eBay",
        oldPrice,
        newPrice: item.pricePence,
        dropPercent,
        url: item.affiliateUrl || item.itemUrl,
      });
    }
  }

  return { productUpserted: true, listingUpserted: true, resolvedBy };
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
