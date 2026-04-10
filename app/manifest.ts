import type { MetadataRoute } from "next";
import { getSiteBrand, getSiteVertical } from "@/lib/site";

/**
 * PWA manifest. Next.js serves this at /manifest.webmanifest automatically
 * when the file exists at `app/manifest.ts`. Each Vercel deployment (one per
 * vertical) generates its own manifest at build time, so TabletopWatch and
 * SimRaceWatch install as completely separate PWAs.
 *
 * Icons are generated dynamically via `app/icon.tsx` + `app/apple-icon.tsx`
 * using the Next.js ImageResponse API — no static PNG assets needed.
 */
export default function manifest(): MetadataRoute.Manifest {
  const brand = getSiteBrand();
  const config = getSiteVertical();

  // Raw hex extracted from the OKLCH accent — the theme_color field requires
  // a concrete colour string that Android and iOS can parse.
  const themeColor = config.slug === "warhammer" ? "#c89f56" : "#d13a2c";

  return {
    name: brand.siteName,
    short_name: brand.siteName,
    description: brand.tagline,
    start_url: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#0a0a0a",
    theme_color: themeColor,
    categories: config.slug === "warhammer"
      ? ["games", "shopping", "entertainment"]
      : ["games", "sports", "shopping"],
    icons: [
      {
        src: "/icon?size=192",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icon?size=512",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/apple-icon",
        sizes: "180x180",
        type: "image/png",
        purpose: "maskable",
      },
    ],
    shortcuts: [
      {
        name: "Trending Deals",
        short_name: "Trending",
        description: "Biggest price drops this week",
        url: "/trending",
      },
      {
        name: "All Deals",
        short_name: "Deals",
        description: "Browse every tracked product",
        url: "/deals",
      },
    ],
  };
}
