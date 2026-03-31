// ---------------------------------------------------------------------------
// YouTube RSS feed fetcher — zero quota, unlimited polling
// ---------------------------------------------------------------------------
// YouTube channels expose a free Atom XML feed at:
//   https://www.youtube.com/feeds/videos.xml?channel_id={channelId}
// Each feed returns the latest ~15 videos with basic metadata.
// ---------------------------------------------------------------------------

export interface RssVideo {
  videoId: string;
  title: string;
  published: string; // ISO 8601 date string
  description: string;
  thumbnailUrl: string;
}

/**
 * Fetch the RSS feed for a YouTube channel and return parsed video entries.
 * Returns an empty array on any error (network, parse, etc.).
 */
export async function fetchChannelFeed(
  channelId: string,
): Promise<RssVideo[]> {
  try {
    const url = `https://www.youtube.com/feeds/videos.xml?channel_id=${encodeURIComponent(channelId)}`;
    const res = await fetch(url, { cache: "no-store" });

    if (!res.ok) {
      console.error(
        `RSS feed error for channel ${channelId}: ${res.status} ${res.statusText}`,
      );
      return [];
    }

    const xml = await res.text();
    return parseAtomFeed(xml);
  } catch (err) {
    console.error(
      `Failed to fetch RSS feed for channel ${channelId}:`,
      err instanceof Error ? err.message : String(err),
    );
    return [];
  }
}

// ---------------------------------------------------------------------------
// Minimal Atom XML parser — no dependencies
// ---------------------------------------------------------------------------

function parseAtomFeed(xml: string): RssVideo[] {
  const entries: RssVideo[] = [];

  // Split on <entry> tags
  const entryRegex = /<entry>([\s\S]*?)<\/entry>/g;
  let entryMatch: RegExpExecArray | null;

  while ((entryMatch = entryRegex.exec(xml)) !== null) {
    const block = entryMatch[1];

    const videoId = extractTag(block, "yt:videoId");
    const title = decodeXmlEntities(extractTag(block, "title"));
    const published = extractTag(block, "published");

    // Description lives in <media:group><media:description>
    const mediaGroup = block.match(/<media:group>([\s\S]*?)<\/media:group>/)?.[1] ?? "";
    const description = decodeXmlEntities(
      extractTag(mediaGroup, "media:description"),
    );

    // Thumbnail from <media:thumbnail url="..."/>
    const thumbnailUrl =
      mediaGroup.match(/<media:thumbnail\s+url="([^"]+)"/)?.[1] ?? "";

    if (videoId && title) {
      entries.push({
        videoId,
        title,
        published,
        description,
        thumbnailUrl,
      });
    }
  }

  return entries;
}

/** Extract text content from a simple XML tag. */
function extractTag(xml: string, tagName: string): string {
  const regex = new RegExp(`<${tagName}[^>]*>([\\s\\S]*?)</${tagName}>`);
  return regex.exec(xml)?.[1]?.trim() ?? "";
}

/** Decode common XML entities. */
function decodeXmlEntities(str: string): string {
  return str
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'");
}
