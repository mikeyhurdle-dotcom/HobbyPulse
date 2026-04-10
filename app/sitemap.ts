import type { MetadataRoute } from "next";
import { getSiteBrand, getSiteVertical } from "@/lib/site";
import { supabase } from "@/lib/supabase";
import { channelSlug } from "@/lib/channels";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const brand = getSiteBrand();
  const config = getSiteVertical();
  const baseUrl = `https://${brand.domain}`;

  // Static routes
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: baseUrl, lastModified: new Date(), changeFrequency: "weekly", priority: 1.0 },
    { url: `${baseUrl}/watch`, lastModified: new Date(), changeFrequency: "daily", priority: 0.9 },
    { url: `${baseUrl}/deals`, lastModified: new Date(), changeFrequency: "daily", priority: 0.9 },
    { url: `${baseUrl}/trending`, lastModified: new Date(), changeFrequency: "hourly", priority: 0.85 },
    { url: `${baseUrl}/channels`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.8 },
    { url: `${baseUrl}/armies`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.85 },
    { url: `${baseUrl}/releases`, lastModified: new Date(), changeFrequency: "daily", priority: 0.8 },
    { url: `${baseUrl}/live`, lastModified: new Date(), changeFrequency: "always", priority: 0.8 },
    { url: `${baseUrl}/build`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.7 },
    { url: `${baseUrl}/about`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.5 },
    { url: `${baseUrl}/faq`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.5 },
    { url: `${baseUrl}/contact`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.5 },
    { url: `${baseUrl}/privacy`, lastModified: new Date(), changeFrequency: "yearly", priority: 0.3 },
  ];

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
      url: `${baseUrl}/channels/${channelSlug(c.name)}`,
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
    url: `${baseUrl}/watch/${v.youtube_video_id}`,
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

  // Dynamic army detail pages
  const { data: armyLists } = verticalRow && config.slug === "warhammer"
    ? await supabase
        .from("content_lists")
        .select("id, player_name, winner, battle_reports!inner(vertical_id)")
        .eq("battle_reports.vertical_id", verticalRow.id)
        .not("winner", "is", null)
        .limit(200)
    : { data: [] };

  const normalise = (s: string | null) => (s ?? "").trim().toLowerCase();
  const armyRoutes: MetadataRoute.Sitemap = ((armyLists ?? []) as {
    id: string;
    player_name: string | null;
    winner: string | null;
  }[])
    .filter((l) => l.winner && l.player_name && normalise(l.winner) === normalise(l.player_name))
    .map((l) => ({
      url: `${baseUrl}/armies/${l.id}`,
      lastModified: new Date(),
      changeFrequency: "weekly" as const,
      priority: 0.7,
    }));

  return [
    ...staticRoutes,
    ...channelRoutes,
    ...categoryRoutes,
    ...armyRoutes,
    ...watchRoutes,
    ...dealsRoutes,
  ];
}
