// ---------------------------------------------------------------------------
// YouTube Discovery — search for battle reports from ANY channel
// ---------------------------------------------------------------------------
// Uses the YouTube Data API search.list endpoint to find videos matching
// vertical-specific search terms. Cost: ~100 quota units per search term.
// ---------------------------------------------------------------------------

import { verticals } from "@/config/verticals";

const YOUTUBE_API_BASE = "https://www.googleapis.com/youtube/v3";
const API_KEY = process.env.YOUTUBE_API_KEY!;

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface DiscoveredVideo {
  videoId: string;
  channelId: string;
  channelName: string;
  title: string;
  description: string;
  thumbnailUrl: string;
  publishedAt: string;
  durationSeconds: number;
  viewCount: number;
}

interface YouTubeSearchItem {
  id: { videoId?: string };
  snippet: {
    publishedAt: string;
    channelId: string;
    title: string;
    description: string;
    thumbnails: {
      high?: { url: string };
      medium?: { url: string };
      default?: { url: string };
    };
    channelTitle: string;
  };
}

interface YouTubeSearchResponse {
  items: YouTubeSearchItem[];
}

interface YouTubeVideoItem {
  id: string;
  contentDetails: { duration: string };
  statistics: { viewCount?: string };
}

interface YouTubeVideoListResponse {
  items: YouTubeVideoItem[];
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function ytFetch<T>(path: string, params: Record<string, string>): Promise<T> {
  const url = new URL(`${YOUTUBE_API_BASE}/${path}`);
  url.searchParams.set("key", API_KEY);
  for (const [k, v] of Object.entries(params)) {
    url.searchParams.set(k, v);
  }

  const res = await fetch(url.toString(), { cache: "no-store" });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`YouTube API error ${res.status}: ${body}`);
  }
  return res.json() as Promise<T>;
}

/** Convert an ISO 8601 duration (PT1H23M45S) to total seconds. */
function parseDuration(iso: string): number {
  const match = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return 0;
  const hours = parseInt(match[1] || "0", 10);
  const minutes = parseInt(match[2] || "0", 10);
  const seconds = parseInt(match[3] || "0", 10);
  return hours * 3600 + minutes * 60 + seconds;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Returns the discovery search terms for a given vertical slug.
 */
export function getDiscoverySearchTerms(vertical: string): string[] {
  const config = verticals[vertical];
  if (!config) return [];
  return config.discoverySearchTerms;
}

/**
 * Search YouTube for battle reports matching the vertical's discovery terms.
 * Searches published in the last 7 days, returns up to 25 results per term.
 *
 * Total cost: ~300 quota units per vertical (3 searches x 100 units).
 */
export async function searchBattleReports(vertical: string): Promise<DiscoveredVideo[]> {
  const terms = getDiscoverySearchTerms(vertical);
  if (terms.length === 0) return [];

  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  const publishedAfter = sevenDaysAgo.toISOString();

  // Collect all search results, deduplicate by videoId
  const videoMap = new Map<string, YouTubeSearchItem>();

  for (const term of terms) {
    const data = await ytFetch<YouTubeSearchResponse>("search", {
      part: "snippet",
      q: term,
      type: "video",
      order: "date",
      publishedAfter,
      maxResults: "25",
    });

    for (const item of data.items) {
      const videoId = item.id.videoId;
      if (videoId && !videoMap.has(videoId)) {
        videoMap.set(videoId, item);
      }
    }
  }

  if (videoMap.size === 0) return [];

  // Fetch full video details (duration + view count) — 1 unit per 50 videos
  const videoIds = [...videoMap.keys()];
  const detailsMap = new Map<string, YouTubeVideoItem>();

  for (let i = 0; i < videoIds.length; i += 50) {
    const batch = videoIds.slice(i, i + 50);
    const data = await ytFetch<YouTubeVideoListResponse>("videos", {
      part: "contentDetails,statistics",
      id: batch.join(","),
    });
    for (const item of data.items) {
      detailsMap.set(item.id, item);
    }
  }

  // Merge search results with video details
  const results: DiscoveredVideo[] = [];

  for (const [videoId, searchItem] of videoMap) {
    const details = detailsMap.get(videoId);
    const thumbnail =
      searchItem.snippet.thumbnails.high?.url ??
      searchItem.snippet.thumbnails.medium?.url ??
      searchItem.snippet.thumbnails.default?.url ??
      "";

    results.push({
      videoId,
      channelId: searchItem.snippet.channelId,
      channelName: searchItem.snippet.channelTitle,
      title: searchItem.snippet.title,
      description: searchItem.snippet.description,
      thumbnailUrl: thumbnail,
      publishedAt: searchItem.snippet.publishedAt,
      durationSeconds: details ? parseDuration(details.contentDetails.duration) : 0,
      viewCount: details ? parseInt(details.statistics.viewCount || "0", 10) : 0,
    });
  }

  return results;
}
