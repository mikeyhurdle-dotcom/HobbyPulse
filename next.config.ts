import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { hostname: "cdn.shopify.com" },
      { hostname: "www.elementgames.co.uk" },
      { hostname: "elementgames.co.uk" },
      { hostname: "i.ebayimg.com" },
    ],
  },
};

export default nextConfig;
