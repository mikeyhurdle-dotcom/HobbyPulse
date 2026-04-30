import type { MetadataRoute } from "next";
import { getSiteBrand, getSiteVertical } from "@/lib/site";
import { supabase } from "@/lib/supabase";
import { channelSlug } from "@/lib/channels";
import {
  listArticles,
  articleTypeRoutes,
  type ArticleType,
} from "@/lib/boardgame-articles";
import { getTopGameSlugs } from "@/lib/board-game-db";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const brand = getSiteBrand();
  const config = getSiteVertical();
  const baseUrl = `https://${brand.domain}`;

  const isTabletop = config.slug === "tabletop";
  // For TabletopWatch, miniatures content lives under /miniatures/*
  const mp = isTabletop ? "/miniatures" : "";

  // Static routes
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: baseUrl, lastModified: new Date(), changeFrequency: "weekly", priority: 1.0 },
    { url: `${baseUrl}${mp}/watch`, lastModified: new Date(), changeFrequency: "daily", priority: 0.9 },
    { url: `${baseUrl}/deals`, lastModified: new Date(), changeFrequency: "daily", priority: 0.9 },
    { url: `${baseUrl}${mp}/trending`, lastModified: new Date(), changeFrequency: "hourly", priority: 0.85 },
    { url: `${baseUrl}${mp}/channels`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.8 },
    { url: `${baseUrl}/releases`, lastModified: new Date(), changeFrequency: "daily", priority: 0.8 },
    { url: `${baseUrl}/about`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.5 },
    { url: `${baseUrl}/faq`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.5 },
    { url: `${baseUrl}/contact`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.5 },
    { url: `${baseUrl}/privacy`, lastModified: new Date(), changeFrequency: "yearly", priority: 0.3 },
  ];

  // Board game routes (TabletopWatch only)
  const boardGameRoutes: MetadataRoute.Sitemap = [];
  if (isTabletop) {
    // Section landing pages
    boardGameRoutes.push(
      { url: `${baseUrl}/boardgames`, lastModified: new Date(), changeFrequency: "daily", priority: 0.95 },
      { url: `${baseUrl}/boardgames/reviews`, lastModified: new Date(), changeFrequency: "daily", priority: 0.85 },
      { url: `${baseUrl}/boardgames/best`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.85 },
      { url: `${baseUrl}/boardgames/versus`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.85 },
      { url: `${baseUrl}/boardgames/how-to-play`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.85 },
      { url: `${baseUrl}/kickstarter`, lastModified: new Date(), changeFrequency: "hourly", priority: 0.9 },
    );

    // Individual article pages from filesystem
    const types: ArticleType[] = ["reviews", "best", "versus", "how-to-play"];
    for (const type of types) {
      for (const article of listArticles(type)) {
        boardGameRoutes.push({
          url: `${baseUrl}/boardgames/${articleTypeRoutes[type]}/${article.slug}`,
          lastModified: new Date(article.publishedAt),
          changeFrequency: "monthly",
          priority: 0.8,
        });
      }
    }

    // Board game directory + tool pages
    boardGameRoutes.push(
      { url: `${baseUrl}/boardgames/watch`, lastModified: new Date(), changeFrequency: "daily", priority: 0.9 },
      { url: `${baseUrl}/boardgames/games`, lastModified: new Date(), changeFrequency: "daily", priority: 0.9 },
      { url: `${baseUrl}/boardgames/recommend`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.8 },
      { url: `${baseUrl}/boardgames/compare`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.8 },
      { url: `${baseUrl}/boardgames/releases`, lastModified: new Date(), changeFrequency: "daily", priority: 0.8 },
      { url: `${baseUrl}/boardgames/news`, lastModified: new Date(), changeFrequency: "daily", priority: 0.75 },
    );
    const gameSlugs = await getTopGameSlugs(500);
    for (const gs of gameSlugs) {
      boardGameRoutes.push({
        url: `${baseUrl}/boardgames/games/${gs}`,
        lastModified: new Date(),
        changeFrequency: "weekly",
        priority: 0.75,
      });
    }
  }

  // Dynamic channel pages
  const { data: verticalRow } = await supabase
    .from("verticals")
    .select("id")
    .eq("slug", config.slug)
    .single();

  const { data: channels } = verticalRow
    ? await supabase
        .from("channels")
        .select("name")
        .eq("vertical_id", verticalRow.id)
    : { data: [] };

  const channelRoutes: MetadataRoute.Sitemap = ((channels ?? []) as { name: string }[]).map(
    (c) => ({
      url: `${baseUrl}${mp}/channels/${channelSlug(c.name)}`,
      lastModified: new Date(),
      changeFrequency: "weekly" as const,
      priority: 0.6,
    }),
  );

  // Dynamic category landing pages — only include categories that actually
  // have products backfilled to them.
  const { data: populatedCats } = verticalRow
    ? await supabase
        .from("categories")
        .select("slug, products!inner(id)")
        .eq("vertical_id", verticalRow.id)
    : { data: [] };

  const seenCatSlugs = new Set<string>();
  const categoryRoutes: MetadataRoute.Sitemap = [];
  for (const row of (populatedCats ?? []) as { slug: string }[]) {
    if (seenCatSlugs.has(row.slug)) continue;
    seenCatSlugs.add(row.slug);
    categoryRoutes.push({
      url: `${baseUrl}/deals/c/${row.slug}`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.75,
    });
  }

  // Dynamic watch routes
  const { data: videos } = await supabase
    .from("battle_reports")
    .select("youtube_video_id, published_at");

  const watchRoutes: MetadataRoute.Sitemap = (videos ?? []).map((v) => ({
    url: `${baseUrl}${mp}/watch/${v.youtube_video_id}`,
    lastModified: v.published_at ? new Date(v.published_at) : new Date(),
    changeFrequency: "weekly" as const,
    priority: 0.7,
  }));

  // Dynamic deals routes
  const { data: products } = await supabase
    .from("products")
    .select("slug, updated_at");

  const dealsRoutes: MetadataRoute.Sitemap = (products ?? []).map((p) => ({
    url: `${baseUrl}/deals/${p.slug}`,
    lastModified: p.updated_at ? new Date(p.updated_at) : new Date(),
    changeFrequency: "daily" as const,
    priority: 0.7,
  }));

  return [
    ...staticRoutes,
    ...boardGameRoutes,
    ...channelRoutes,
    ...categoryRoutes,
    ...watchRoutes,
    ...dealsRoutes,
  ];
}
