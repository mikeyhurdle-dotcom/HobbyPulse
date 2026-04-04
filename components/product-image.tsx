import Image from "next/image";

/**
 * Product image that handles multiple CDN sources.
 *
 * - Shopify / Element Games: routed through next/image for WebP conversion + resizing
 * - eBay (i.ebayimg.com): loaded directly — eBay already serves optimised JPEGs
 *   and blocks Vercel's image optimizer from fetching server-side
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
  const isEbay = src.includes("ebayimg.com");

  if (isEbay) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={src}
        alt={alt}
        className={className}
        loading={priority ? "eager" : "lazy"}
        style={fill ? { position: "absolute", inset: 0, width: "100%", height: "100%"} : undefined}
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
      className={className}
    />
  );
}
