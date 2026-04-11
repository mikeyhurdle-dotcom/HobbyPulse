import type { NextConfig } from "next";

const isTabletop =
  process.env.NEXT_PUBLIC_SITE_VERTICAL === "warhammer" ||
  (!process.env.NEXT_PUBLIC_SITE_VERTICAL && !process.env.SITE_VERTICAL);

// Routes to nest under /miniatures for TabletopWatch (board game pivot)
const miniaturesPrefixes = ["watch", "build", "armies", "channels", "trending"];

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { hostname: "cdn.shopify.com" },
      { hostname: "www.elementgames.co.uk" },
      { hostname: "elementgames.co.uk" },
      { hostname: "i.ebayimg.com" },
    ],
  },

  async redirects() {
    if (!isTabletop) return [];

    return miniaturesPrefixes.flatMap((prefix) => [
      {
        source: `/${prefix}`,
        destination: `/miniatures/${prefix}`,
        permanent: true,
      },
      {
        source: `/${prefix}/:path*`,
        destination: `/miniatures/${prefix}/:path*`,
        permanent: true,
      },
    ]);
  },

  async rewrites() {
    if (!isTabletop) return [];

    return miniaturesPrefixes.flatMap((prefix) => [
      {
        source: `/miniatures/${prefix}`,
        destination: `/${prefix}`,
      },
      {
        source: `/miniatures/${prefix}/:path*`,
        destination: `/${prefix}/:path*`,
      },
    ]);
  },
};

export default nextConfig;
