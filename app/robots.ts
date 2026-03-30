import type { MetadataRoute } from "next";
import { getSiteBrand } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  const brand = getSiteBrand();
  const baseUrl = `https://${brand.domain}`;

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/api/", "/admin/"],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
