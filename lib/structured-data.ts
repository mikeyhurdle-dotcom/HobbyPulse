// ---------------------------------------------------------------------------
// Schema.org Structured Data helpers — return JSON-LD objects
// ---------------------------------------------------------------------------

import { getSiteBrand } from "@/lib/site";

// ---------------------------------------------------------------------------
// VideoObject — for /watch/[videoId]
// ---------------------------------------------------------------------------

interface VideoReportInput {
  title: string;
  description: string | null;
  thumbnail_url: string | null;
  published_at: string;
  duration_seconds: number;
  youtube_video_id: string;
  view_count: number;
  channels: { name: string } | null;
}

export function videoSchema(report: VideoReportInput) {
  const duration = formatIsoDuration(report.duration_seconds);

  return {
    "@context": "https://schema.org",
    "@type": "VideoObject",
    name: report.title,
    description: report.description ?? report.title,
    thumbnailUrl:
      report.thumbnail_url ??
      `https://i.ytimg.com/vi/${report.youtube_video_id}/maxresdefault.jpg`,
    uploadDate: report.published_at,
    duration,
    embedUrl: `https://www.youtube.com/embed/${report.youtube_video_id}`,
    contentUrl: `https://www.youtube.com/watch?v=${report.youtube_video_id}`,
    interactionStatistic: {
      "@type": "InteractionCounter",
      interactionType: { "@type": "WatchAction" },
      userInteractionCount: report.view_count,
    },
    ...(report.channels?.name && {
      author: {
        "@type": "Person",
        name: report.channels.name,
      },
    }),
  };
}

// ---------------------------------------------------------------------------
// Product — for /deals/[productSlug]
// ---------------------------------------------------------------------------

interface ProductInput {
  name: string;
  image_url: string | null;
  slug: string;
}

interface ListingInput {
  price_pence: number;
  currency: string;
  in_stock: boolean;
  source: string;
  source_url: string;
  affiliate_url: string | null;
}

export function productSchema(product: ProductInput, listings: ListingInput[]) {
  const brand = getSiteBrand();

  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    image: product.image_url ?? undefined,
    url: `https://${brand.domain}/deals/${product.slug}`,
    offers: listings.map((l) => ({
      "@type": "Offer",
      price: (l.price_pence / 100).toFixed(2),
      priceCurrency: l.currency.toUpperCase(),
      availability: l.in_stock
        ? "https://schema.org/InStock"
        : "https://schema.org/OutOfStock",
      url: l.affiliate_url || l.source_url,
      seller: {
        "@type": "Organization",
        name: l.source,
      },
    })),
  };
}

// ---------------------------------------------------------------------------
// WebSite — for the home page
// ---------------------------------------------------------------------------

export function websiteSchema() {
  const brand = getSiteBrand();
  const baseUrl = `https://${brand.domain}`;

  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: brand.siteName,
    url: baseUrl,
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${baseUrl}/deals?q={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  };
}

// ---------------------------------------------------------------------------
// BreadcrumbList
// ---------------------------------------------------------------------------

interface BreadcrumbItem {
  name: string;
  url: string;
}

export function breadcrumbSchema(items: BreadcrumbItem[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      item: item.url,
    })),
  };
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatIsoDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  let iso = "PT";
  if (h > 0) iso += `${h}H`;
  if (m > 0) iso += `${m}M`;
  if (s > 0 || iso === "PT") iso += `${s}S`;
  return iso;
}
