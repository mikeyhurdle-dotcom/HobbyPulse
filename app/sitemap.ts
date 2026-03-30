import type { MetadataRoute } from "next";
import { getSiteBrand } from "@/lib/site";
import { supabase } from "@/lib/supabase";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const brand = getSiteBrand();
  const baseUrl = `https://${brand.domain}`;

  // Static routes
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: baseUrl, lastModified: new Date(), changeFrequency: "weekly", priority: 1.0 },
    { url: `${baseUrl}/watch`, lastModified: new Date(), changeFrequency: "daily", priority: 0.9 },
    { url: `${baseUrl}/deals`, lastModified: new Date(), changeFrequency: "daily", priority: 0.9 },
    { url: `${baseUrl}/live`, lastModified: new Date(), changeFrequency: "always", priority: 0.8 },
    { url: `${baseUrl}/build`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.7 },
  ];

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

  return [...staticRoutes, ...watchRoutes, ...dealsRoutes];
}
