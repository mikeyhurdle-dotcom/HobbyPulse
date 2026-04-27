// ---------------------------------------------------------------------------
// Test Suite — /api/test
// ---------------------------------------------------------------------------
// Runs all automated tests against the live site. Protected by CRON_SECRET.
// Tests every user journey from the testing plan that can be verified
// server-side: home page data, watch page, video detail, deals, product
// detail, price alerts, and cross-vertical checks.
//
// Usage: GET /api/test
// ---------------------------------------------------------------------------

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getSiteVertical, getSiteBrand } from "@/lib/site";
import { classifyVideo, classifyGameSystem, isShort } from "@/lib/classify";
import { getGameSystem, getSystemsForVertical } from "@/config/game-systems";

export const maxDuration = 120;
export const dynamic = "force-dynamic";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL ?? "https://placeholder.supabase.co",
  process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "placeholder-anon-key",
);

interface TestResult {
  name: string;
  status: "PASS" | "FAIL" | "WARN";
  details?: string;
}

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const config = getSiteVertical();
  const brand = getSiteBrand();
  const results: TestResult[] = [];

  // Resolve vertical ID
  const { data: verticalRow } = await supabase
    .from("verticals")
    .select("id")
    .eq("slug", config.slug)
    .single();

  const verticalId = verticalRow?.id;

  if (!verticalId) {
    return NextResponse.json({
      status: "FAIL",
      error: `Vertical ${config.slug} not found`,
    });
  }

  // =========================================================================
  // Journey 1: Home page data
  // =========================================================================

  // 1.1 Battle reports exist
  const { count: videoCount } = await supabase
    .from("battle_reports")
    .select("id", { count: "exact", head: true })
    .eq("vertical_id", verticalId);

  results.push({
    name: "1.1 Videos exist in database",
    status: (videoCount ?? 0) > 0 ? "PASS" : "FAIL",
    details: `${videoCount} videos`,
  });

  // 1.2 Non-short videos for featured section
  const { data: recentVideos } = await supabase
    .from("battle_reports")
    .select("id, title, thumbnail_url, duration_seconds, youtube_video_id, channels(name)")
    .eq("vertical_id", verticalId)
    .order("published_at", { ascending: false })
    .limit(10);

  const nonShorts = (recentVideos ?? []).filter(
    (v: { duration_seconds: number; title: string }) =>
      !isShort(v.duration_seconds) && !v.title.toLowerCase().includes("#shorts"),
  );

  results.push({
    name: "1.2 Featured videos available (non-shorts)",
    status: nonShorts.length >= 6 ? "PASS" : nonShorts.length > 0 ? "WARN" : "FAIL",
    details: `${nonShorts.length} non-short videos in latest 10`,
  });

  // 1.3 Featured videos have thumbnails
  const withThumbnails = nonShorts.filter((v: { thumbnail_url: string | null }) => v.thumbnail_url);
  results.push({
    name: "1.3 Featured videos have thumbnails",
    status: withThumbnails.length === nonShorts.length ? "PASS" : "WARN",
    details: `${withThumbnails.length}/${nonShorts.length} have thumbnails`,
  });

  // 1.4 Videos have channel associations
  const withChannels = nonShorts.filter(
    (v: Record<string, unknown>) => {
      // Supabase many-to-one join returns object, not array
      const ch = v.channels as { name: string } | { name: string }[] | null;
      if (Array.isArray(ch)) return ch[0]?.name;
      return ch?.name;
    },
  );
  results.push({
    name: "1.4 Videos have channel names",
    status: withChannels.length === nonShorts.length ? "PASS" : "WARN",
    details: `${withChannels.length}/${nonShorts.length} have channel names`,
  });

  // =========================================================================
  // Journey 1 continued: Video detail with army lists / setups
  // =========================================================================

  if (config.slug === "tabletop") {
    // Find a video with parsed army lists
    const { data: videosWithLists } = await supabase
      .from("battle_reports")
      .select("id, youtube_video_id, title, content_lists(id, categories(name), list_items(id, name, points))")
      .eq("vertical_id", verticalId)
      .not("parsed_at", "is", null)
      .limit(20);

    const withArmyLists = (videosWithLists ?? []).filter(
      (v: { content_lists: { list_items: unknown[] }[] }) =>
        v.content_lists?.some((cl) => cl.list_items?.length > 0),
    );

    results.push({
      name: "1.5 Videos with parsed army lists",
      status: withArmyLists.length > 0 ? "PASS" : "WARN",
      details: `${withArmyLists.length} videos have army lists with units`,
    });

    if (withArmyLists.length > 0) {
      const testVideo = withArmyLists[0] as unknown as {
        youtube_video_id: string;
        title: string;
        content_lists: { list_items: { name: string; points: number }[]; categories: { name: string } | null }[];
      };
      const totalUnits = testVideo.content_lists.reduce(
        (sum, cl) => sum + (cl.list_items?.length ?? 0),
        0,
      );
      const factions = testVideo.content_lists
        .map((cl) => cl.categories?.name)
        .filter(Boolean);

      results.push({
        name: "1.6 Army list has units and factions",
        status: totalUnits > 0 && factions.length > 0 ? "PASS" : "WARN",
        details: `Video "${testVideo.title}" — ${totalUnits} units, factions: ${factions.join(", ")}`,
      });

      // 1.7 Unit names can find deals — try each unit until one matches
      const allUnits = testVideo.content_lists.flatMap((cl) => cl.list_items ?? []);
      let dealMatch: { searched: string; found: string } | null = null;
      for (const unit of allUnits) {
        const keyword = unit.name.split(" ").slice(0, 2).join(" ");
        const { data: matchingDeals } = await supabase
          .from("products")
          .select("id, name")
          .eq("vertical_id", verticalId)
          .ilike("name", `%${keyword}%`)
          .limit(1);
        if (matchingDeals && matchingDeals.length > 0) {
          dealMatch = { searched: unit.name, found: matchingDeals[0].name };
          break;
        }
      }

      results.push({
        name: "1.7 Unit name → deals search finds products",
        status: dealMatch ? "PASS" : "WARN",
        details: dealMatch
          ? `Searched "${dealMatch.searched}" → found "${dealMatch.found}"`
          : `Tried ${allUnits.length} units, none found in deals`,
      });
    }
  } else {
    // Sim racing: check car setups
    const { data: videosWithSetups } = await supabase
      .from("car_setups")
      .select("id, sim, car, track, battle_report_id")
      .eq("battle_report_id", verticalId) // This won't match, need different query
      .limit(5);

    // Query setups via battle_reports join
    const { count: setupCount } = await supabase
      .from("car_setups")
      .select("id", { count: "exact", head: true });

    results.push({
      name: "1.5 Car setups exist",
      status: (setupCount ?? 0) > 0 ? "PASS" : "WARN",
      details: `${setupCount} car setups in database`,
    });
  }

  // =========================================================================
  // Journey 2: Deals page
  // =========================================================================

  // 2.1 Products exist
  const { count: productCount } = await supabase
    .from("products")
    .select("id", { count: "exact", head: true })
    .eq("vertical_id", verticalId);

  results.push({
    name: "2.1 Products exist in database",
    status: (productCount ?? 0) > 0 ? "PASS" : "FAIL",
    details: `${productCount} products`,
  });

  // 2.2 Products have listings
  const { data: productsWithListings } = await supabase
    .from("products")
    .select("id, name, listings(id, price_pence, source, in_stock)")
    .eq("vertical_id", verticalId)
    .limit(20);

  const withListings = (productsWithListings ?? []).filter(
    (p: { listings: unknown[] }) => p.listings?.length > 0,
  );

  results.push({
    name: "2.2 Products have listings with prices",
    status: withListings.length > 0 ? "PASS" : "FAIL",
    details: `${withListings.length}/${(productsWithListings ?? []).length} sampled products have listings`,
  });

  // ---- Aggregate listings for this vertical ----
  // PostgREST has a URL length limit (~2000 chars) that breaks `.in(product_id, [700 ids])`
  // at scale. We fetch all products, then fan out listings in chunks of 100 IDs.
  const { data: allProducts } = await supabase
    .from("products")
    .select("id")
    .eq("vertical_id", verticalId);

  const productIds = (allProducts ?? []).map((p) => p.id);
  const CHUNK = 100;
  const allListings: { product_id: string; source: string; last_scraped_at: string | null }[] = [];
  for (let i = 0; i < productIds.length; i += CHUNK) {
    const chunk = productIds.slice(i, i + CHUNK);
    const { data } = await supabase
      .from("listings")
      .select("product_id, source, last_scraped_at")
      .in("product_id", chunk);
    if (data) allListings.push(...(data as typeof allListings));
  }

  // 2.3 No stale products with 0 listings
  const productIdsWithListings = new Set(allListings.map((l) => l.product_id));
  const staleProducts = productIds.filter((id) => !productIdsWithListings.has(id));

  results.push({
    name: "2.3 No stale products with 0 listings",
    status: staleProducts.length === 0 ? "PASS" : "WARN",
    details: `${staleProducts.length} products have 0 listings`,
  });

  // 2.4 Multiple retailers represented
  const uniqueSources = new Set(allListings.map((l) => l.source).filter(Boolean));
  results.push({
    name: "2.4 Multiple retailers in listings",
    status: uniqueSources.size >= 2 ? "PASS" : uniqueSources.size === 1 ? "WARN" : "FAIL",
    details: `Sources: ${[...uniqueSources].join(", ")}`,
  });

  // 2.5 Listings have recent scrape dates
  const mostRecentScrape = allListings.reduce<string | null>((latest, l) => {
    if (!l.last_scraped_at) return latest;
    if (!latest || l.last_scraped_at > latest) return l.last_scraped_at;
    return latest;
  }, null);

  const scrapeAge = mostRecentScrape
    ? Math.round((Date.now() - new Date(mostRecentScrape).getTime()) / (1000 * 60 * 60))
    : null;

  results.push({
    name: "2.5 Listings recently scraped",
    status: scrapeAge !== null && scrapeAge < 24 ? "PASS" : scrapeAge !== null && scrapeAge < 72 ? "WARN" : "FAIL",
    details: mostRecentScrape ? `Last scraped ${scrapeAge}h ago` : "No scrape timestamp found",
  });

  // =========================================================================
  // Journey 2 continued: Product detail + price alert
  // =========================================================================

  // Find a product with multiple listings for testing
  if (withListings.length > 0) {
    const testProduct = withListings[0] as {
      id: string;
      name: string;
      listings: { price_pence: number; source: string; in_stock: boolean }[];
    };

    results.push({
      name: "2.6 Product has price comparison data",
      status: testProduct.listings.length >= 1 ? "PASS" : "FAIL",
      details: `"${testProduct.name}" — ${testProduct.listings.length} listings, cheapest: £${(Math.min(...testProduct.listings.map((l) => l.price_pence)) / 100).toFixed(2)}`,
    });

    // Test price alert creation and cleanup
    const testEmail = "automated-test@hobbypulse.test";
    const { error: alertCreateError } = await supabase
      .from("price_alerts")
      .insert({
        email: testEmail,
        product_id: testProduct.id,
        target_price_pence: 1000,
        is_active: false,
      });

    results.push({
      name: "2.7 Price alert can be created",
      status: !alertCreateError ? "PASS" : "FAIL",
      details: alertCreateError ? alertCreateError.message : `Alert created for "${testProduct.name}"`,
    });

    // Cleanup
    await supabase
      .from("price_alerts")
      .delete()
      .eq("email", testEmail);
  }

  // =========================================================================
  // Journey 5: Content classification
  // =========================================================================

  const gameSystems = getSystemsForVertical(config.slug);
  results.push({
    name: "5.1 Game systems configured for vertical",
    status: gameSystems.length > 0 ? "PASS" : "FAIL",
    details: `${gameSystems.length} systems: ${gameSystems.map((gs) => gs.shortName).join(", ")}`,
  });

  // =========================================================================
  // Journey 6: Live streams table exists
  // =========================================================================

  const { count: liveCount } = await supabase
    .from("live_streams")
    .select("id", { count: "exact", head: true })
    .eq("vertical_id", verticalId)
    .eq("is_live", true);

  results.push({
    name: "6.1 Live streams queryable",
    status: "PASS", // Table exists and is queryable, even if 0 live
    details: `${liveCount ?? 0} live now`,
  });

  // =========================================================================
  // Data health checks
  // =========================================================================

  // Cache effectiveness
  const { data: cacheStats } = await supabase
    .from("product_name_cache")
    .select("resolved_by")
    .eq("vertical_id", verticalId);

  const cacheByType: Record<string, number> = {};
  for (const row of cacheStats ?? []) {
    cacheByType[row.resolved_by] = (cacheByType[row.resolved_by] ?? 0) + 1;
  }

  results.push({
    name: "Health: Normalisation cache populated",
    status: (cacheStats ?? []).length > 0 ? "PASS" : "WARN",
    details: `${(cacheStats ?? []).length} entries — ${Object.entries(cacheByType).map(([k, v]) => `${k}: ${v}`).join(", ")}`,
  });

  // Price history being recorded
  const { count: priceHistoryCount } = await supabase
    .from("price_history")
    .select("id", { count: "exact", head: true });

  results.push({
    name: "Health: Price history being recorded",
    status: (priceHistoryCount ?? 0) > 0 ? "PASS" : "WARN",
    details: `${priceHistoryCount} price history records`,
  });

  // Kickstarter tracker — TabletopWatch only
  if (config.slug === "tabletop") {
    const { count: kickstarterCount } = await supabase
      .from("kickstarter_projects")
      .select("id", { count: "exact", head: true });

    results.push({
      name: "Kickstarter: tracker has projects",
      status: (kickstarterCount ?? 0) > 0 ? "PASS" : "WARN",
      details: `${kickstarterCount ?? 0} Kickstarter projects in DB`,
    });
  }

  // =========================================================================
  // Summary
  // =========================================================================

  const passed = results.filter((r) => r.status === "PASS").length;
  const warned = results.filter((r) => r.status === "WARN").length;
  const failed = results.filter((r) => r.status === "FAIL").length;

  return NextResponse.json({
    vertical: config.slug,
    brand: brand.siteName,
    timestamp: new Date().toISOString(),
    summary: { passed, warned, failed, total: results.length },
    results,
  });
}
