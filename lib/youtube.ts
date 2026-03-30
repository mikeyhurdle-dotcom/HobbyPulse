const YOUTUBE_API_BASE = "https://www.googleapis.com/youtube/v3";
const API_KEY = process.env.YOUTUBE_API_KEY!;

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface YouTubeThumbnail {
  url: string;
  width: number;
  height: number;
}

export interface YouTubeSearchItem {
  kind: string;
  etag: string;
  id: { kind: string; videoId?: string; channelId?: string };
  snippet: {
    publishedAt: string;
    channelId: string;
    title: string;
    description: string;
    thumbnails: {
      default?: YouTubeThumbnail;
      medium?: YouTubeThumbnail;
      high?: YouTubeThumbnail;
    };
    channelTitle: string;
    liveBroadcastContent: string;
  };
}

export interface YouTubeSearchResponse {
  kind: string;
  etag: string;
  nextPageToken?: string;
  pageInfo: { totalResults: number; resultsPerPage: number };
  items: YouTubeSearchItem[];
}

export interface YouTubeVideoItem {
  kind: string;
  etag: string;
  id: string;
  snippet: {
    publishedAt: string;
    channelId: string;
    title: string;
    description: string;
    thumbnails: {
      default?: YouTubeThumbnail;
      medium?: YouTubeThumbnail;
      high?: YouTubeThumbnail;
    };
    channelTitle: string;
    tags?: string[];
    categoryId: string;
  };
  contentDetails: {
    duration: string; // ISO 8601 duration e.g. "PT1H23M45S"
    dimension: string;
    definition: string;
  };
  statistics: {
    viewCount: string;
    likeCount?: string;
    commentCount?: string;
  };
}

export interface YouTubeVideoListResponse {
  kind: string;
  etag: string;
  pageInfo: { totalResults: number; resultsPerPage: number };
  items: YouTubeVideoItem[];
}

export interface YouTubeChannelItem {
  kind: string;
  etag: string;
  id: string;
  snippet: {
    title: string;
    description: string;
    customUrl?: string;
    thumbnails: {
      default?: YouTubeThumbnail;
      medium?: YouTubeThumbnail;
      high?: YouTubeThumbnail;
    };
  };
  statistics: {
    subscriberCount: string;
    videoCount: string;
    viewCount: string;
  };
  contentDetails: {
    relatedPlaylists: {
      uploads: string;
    };
  };
}

export interface YouTubeChannelListResponse {
  kind: string;
  etag: string;
  pageInfo: { totalResults: number; resultsPerPage: number };
  items: YouTubeChannelItem[];
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Convert an ISO 8601 duration (PT1H23M45S) to total seconds. */
export function parseDuration(iso: string): number {
  const match = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return 0;
  const hours = parseInt(match[1] || "0", 10);
  const minutes = parseInt(match[2] || "0", 10);
  const seconds = parseInt(match[3] || "0", 10);
  return hours * 3600 + minutes * 60 + seconds;
}

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

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Fetch recent videos from a channel published after `publishedAfter`.
 * Uses the search.list endpoint to find videos by channelId.
 */
export async function fetchRecentVideos(
  channelId: string,
  publishedAfter: Date,
  maxResults = 25,
): Promise<YouTubeSearchItem[]> {
  const data = await ytFetch<YouTubeSearchResponse>("search", {
    part: "snippet",
    channelId,
    type: "video",
    order: "date",
    publishedAfter: publishedAfter.toISOString(),
    maxResults: String(maxResults),
  });
  return data.items;
}

/**
 * Get full video details (snippet + contentDetails + statistics) for a list
 * of video IDs. The API supports up to 50 IDs per call.
 */
export async function getVideoDetails(videoIds: string[]): Promise<YouTubeVideoItem[]> {
  if (videoIds.length === 0) return [];

  // Batch in groups of 50
  const results: YouTubeVideoItem[] = [];
  for (let i = 0; i < videoIds.length; i += 50) {
    const batch = videoIds.slice(i, i + 50);
    const data = await ytFetch<YouTubeVideoListResponse>("videos", {
      part: "snippet,contentDetails,statistics",
      id: batch.join(","),
    });
    results.push(...data.items);
  }
  return results;
}

/**
 * Search for a YouTube channel by name/handle and return the first match.
 */
export async function searchChannel(query: string): Promise<YouTubeChannelItem | null> {
  const searchData = await ytFetch<YouTubeSearchResponse>("search", {
    part: "snippet",
    q: query,
    type: "channel",
    maxResults: "1",
  });

  if (searchData.items.length === 0) return null;

  const channelId = searchData.items[0].id.channelId!;
  return getChannelById(channelId);
}

/**
 * Get channel details by channel ID.
 */
export async function getChannelById(channelId: string): Promise<YouTubeChannelItem | null> {
  const data = await ytFetch<YouTubeChannelListResponse>("channels", {
    part: "snippet,statistics,contentDetails",
    id: channelId,
  });
  return data.items[0] ?? null;
}
