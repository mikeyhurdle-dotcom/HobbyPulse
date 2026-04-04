"use client";

import Image from "next/image";
import { useState } from "react";

/**
 * Product image that handles multiple CDN sources with a shimmer placeholder.
 *
 * - Shopify / Element Games: routed through next/image for WebP conversion + resizing
 * - eBay (i.ebayimg.com): loaded directly — eBay already serves optimised JPEGs
 *   and blocks Vercel's image optimizer from fetching server-side
 * - All images show a shimmer animation while loading
 */
export function ProductImage({
  src,
  alt,
  fill,
  sizes,
  priority,
  className,
}: {
  src: string;
  alt: string;
  fill?: boolean;
  sizes?: string;
  priority?: boolean;
  className?: string;
}) {
  const [loaded, setLoaded] = useState(false);
  const isEbay = src.includes("ebayimg.com");

  const shimmer = !loaded ? "animate-shimmer bg-gradient-to-r from-transparent via-white/5 to-transparent bg-[length:200%_100%]" : "";

  if (isEbay) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={src}
        alt={alt}
        className={`${className ?? ""} ${shimmer} transition-opacity duration-300 ${loaded ? "opacity-100" : "opacity-0"}`}
        loading={priority ? "eager" : "lazy"}
        onLoad={() => setLoaded(true)}
        style={fill ? { position: "absolute", inset: 0, width: "100%", height: "100%" } : undefined}
      />
    );
  }

  return (
    <Image
      src={src}
      alt={alt}
      fill={fill}
      sizes={sizes}
      priority={priority}
      className={`${className ?? ""} ${shimmer} transition-opacity duration-300 ${loaded ? "opacity-100" : "opacity-0"}`}
      onLoad={() => setLoaded(true)}
    />
  );
}
