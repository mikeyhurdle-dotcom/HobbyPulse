// ---------------------------------------------------------------------------
// Deals Cron — /api/cron/deals
// ---------------------------------------------------------------------------
// Scrapes retailers, normalises product names (cache-first, Haiku fallback),
// upserts products + listings, records price history, and detects price drops.
// Protected by CRON_SECRET.
// ---------------------------------------------------------------------------

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getScrapersForVertical, type ScrapedProduct } from "@/lib/scrapers";
import { searchEbay, type EbayProduct } from "@/lib/ebay";
import { normaliseProduct } from "@/lib/normalise";
import { getSiteVertical } from "@/lib/site";
import { getGwRrp } from "@/lib/gw-rrp";

// Use service role key for writes (bypasses RLS)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL ?? "https://placeholder.supabase.co",
  process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "placeholder-anon-key",
);

export const maxDuration = 300;
export const dynamic = "force-dynamic";

// ---------------------------------------------------------------------------
// Search terms per vertical
// ---------------------------------------------------------------------------

const SEARCH_TERMS: Record<string, string[]> = {
  warhammer: [
    // ---- 40K ----
    // Starter boxes
    "Combat Patrol",
    "Starter Set",
    // 40K factions
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
    // 40K units
    "Intercessors",
    "Terminators",
    "Redemptor Dreadnought",
    "Wraithknight",
    "Hive Tyrant",
    "Carnifex",
    // ---- Age of Sigmar ----
    "Stormcast Eternals",
    "Gloomspite Gitz",
    "Skaven",
    "Ossiarch Bonereapers",
    "Seraphon",
    "Soulblight Gravelords",
    "Lumineth Realm-lords",
    "Orruk Warclans",
    "Cities of Sigmar",
    "Slaves to Darkness",
    "Kharadron Overlords",
    "Sylvaneth",
    // ---- Kill Team ----
    "Kill Team",
    "Kill Team Starter Set",
    "Kasrkin",
    "Hunter Clade",
    // ---- Warhammer: The Old World ----
    "Warhammer The Old World",
    "Kingdom of Bretonnia",
    "Tomb Kings of Khemri",
    "Empire of Man",
    "Beastmen Brayherd",
    // ---- Paints & tools ----
    "Citadel Paint",
    "Contrast Paint",
    // ---- Board Games ----
    "Catan board game",
    "Wingspan board game",
    "Ticket to Ride",
    "Pandemic board game",
    "Azul board game",
    "Spirit Island",
    "Terraforming Mars",
    "7 Wonders",
    "Everdell",
    "Scythe board game",
    "Gloomhaven",
    "Root board game",
    "Ark Nova",
    "Cascadia board game",
    "Brass Birmingham",
    "Dune Imperium",
    "Marvel Champions",
    "Cosmic Encounter",
    "Betrayal at House on the Hill",
    "Codenames board game",
  ],
  simracing: [
    // Wheelbases
    "Direct drive wheel base",
    "CSL DD",
    "Moza R5",
    "Moza R9",
    "Moza R12",
    "Moza R16",
    "Simagic Alpha",
    // Pedals
    "Racing pedals",
    "Load cell pedals",
    "Moza CRP",
    "Moza SRP",
    // Steering wheels
    "Sim racing wheel",
    "Formula wheel",
    "GT wheel rim",
    "Moza GS",
    "Moza FSR",
    // Rigs & cockpits
    "Sim racing rig",
    "Sim racing cockpit",
    "Aluminium profile rig",
    "GT Lite",
    // Monitors & VR
    "Triple monitor mount",
    "Ultrawide monitor sim racing",
    // Accessories
    "Handbrake sim racing",
    "Sequential shifter",
    "H-pattern shifter",
    "Button box",
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
  const allTerms = SEARCH_TERMS[verticalSlug] ?? [];
  const scrapers = getScrapersForVertical(verticalSlug);

  // Batch support: ?batch=0 processes terms 0-4, ?batch=1 processes 5-9, etc.
  // ?batch=all (or omitted) processes everything (may timeout on large term lists).
  const BATCH_SIZE = 5;
  const url = new URL(request.url);
  const batchParam = url.searchParams.get("batch");
  const totalBatches = Math.ceil(allTerms.length / BATCH_SIZE);

  let searchTerms: string[];
  let batchInfo: string;

  if (batchParam === null || batchParam === "all") {
    searchTerms = allTerms;
    batchInfo = `all (${allTerms.length} terms)`;
  } else {
    const batchIdx = parseInt(batchParam, 10);
    if (isNaN(batchIdx) || batchIdx < 0) {
      return NextResponse.json(
        { error: `Invalid batch index. Use 0-${totalBatches - 1} or "all".` },
        { status: 400 },
      );
    }
    // Out-of-range is a no-op (200), not an error. The vercel.json cron
    // schedules the max batches across both verticals, so smaller verticals
    // will hit batches that don't exist — that's fine.
    if (batchIdx >= totalBatches) {
      return NextResponse.json({
        ok: true,
        skipped: true,
        reason: `Batch ${batchIdx} out of range for ${verticalSlug} (${totalBatches} batches)`,
        vertical: verticalSlug,
        totalBatches,
      });
    }
    const start = batchIdx * BATCH_SIZE;
    searchTerms = allTerms.slice(start, start + BATCH_SIZE);
    batchInfo = `${batchIdx}/${totalBatches - 1} (terms ${start}-${start + searchTerms.length - 1})`;
  }

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
    if (hasEbay && !process.env.EBAY_APP_ID) {
      if (searchTerms.indexOf(term) === 0) {
        errors.push("eBay: EBAY_APP_ID not configured — skipping eBay searches");
      }
    } else if (hasEbay && process.env.EBAY_APP_ID) {
      try {
        const ebayResults = await searchEbay({
          keyword: `${term} ${verticalConfig.name}`,
          limit: 25,
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
    batch: batchInfo,
    totalBatches,
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
  // Prefer scraped RRP (from retailer's "old price"), fall back to static table
  const rrpPence = scraped.rrp_pence ?? getGwRrp(canonicalName);

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
        ...(rrpPence !== null && rrpPence !== undefined && { rrp_pence: rrpPence }),
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
  const rrpPence = getGwRrp(canonicalName);

  const { data: product, error: productError } = await supabase
    .from("products")
    .upsert(
      {
        vertical_id: verticalId,
        name: canonicalName,
        slug,
        image_url: item.imageUrl,
        keywords: [item.title.toLowerCase()],
        ...(rrpPence !== null && { rrp_pence: rrpPence }),
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
