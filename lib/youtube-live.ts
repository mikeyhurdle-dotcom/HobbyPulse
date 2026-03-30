// ---------------------------------------------------------------------------
// YouTube Live Search Client
// ---------------------------------------------------------------------------
// Searches for currently live broadcasts using the YouTube Data API v3.
// Re-uses the same YOUTUBE_API_KEY as lib/youtube.ts.
// ---------------------------------------------------------------------------

const YOUTUBE_API_BASE = "https://www.googleapis.com/youtube/v3";
const API_KEY = process.env.YOUTUBE_API_KEY!;

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface YouTubeLiveStream {
  video_id: string;
  title: string;
  channel_name: string;
  thumbnail_url: string;
  viewer_count: number;
  started_at: string;
}

interface YouTubeSearchItem {
  id: { videoId?: string };
  snippet: {
    publishedAt: string;
    channelTitle: string;
    title: string;
    thumbnails: {
      high?: { url: string };
      medium?: { url: string };
      default?: { url: string };
    };
    liveBroadcastContent: string;
  };
}

interface YouTubeSearchResponse {
  items: YouTubeSearchItem[];
  pageInfo: { totalResults: number; resultsPerPage: number };
}

interface YouTubeVideoStats {
  id: string;
  liveStreamingDetails?: {
    actualStartTime?: string;
    scheduledStartTime?: string;
    concurrentViewers?: string;
  };
  statistics: {
    viewCount: string;
  };
}

interface YouTubeVideoListResponse {
  items: YouTubeVideoStats[];
}

// ---------------------------------------------------------------------------
// Internal fetch helper
// ---------------------------------------------------------------------------

async function ytFetch<T>(
  path: string,
  params: Record<string, string>,
): Promise<T> {
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
 * Search for currently live broadcasts matching `query`.
 * Returns up to 25 results with concurrent viewer counts.
 */
export async function searchLiveStreams(
  query: string,
  maxResults = 25,
): Promise<YouTubeLiveStream[]> {
  // Step 1: search for live videos
  const searchData = await ytFetch<YouTubeSearchResponse>("search", {
    part: "snippet",
    q: query,
    type: "video",
    eventType: "live",
    maxResults: String(maxResults),
    order: "viewCount",
  });

  if (!searchData.items || searchData.items.length === 0) return [];

  const videoIds = searchData.items
    .map((item) => item.id.videoId)
    .filter((id): id is string => !!id);

  if (videoIds.length === 0) return [];

  // Step 2: fetch liveStreamingDetails + statistics for viewer counts
  const detailsData = await ytFetch<YouTubeVideoListResponse>("videos", {
    part: "liveStreamingDetails,statistics",
    id: videoIds.join(","),
  });

  // Build a map of video ID -> details
  const detailsMap = new Map<string, YouTubeVideoStats>();
  for (const item of detailsData.items) {
    detailsMap.set(item.id, item);
  }

  // Step 3: merge search results with details
  return searchData.items
    .filter((item) => item.id.videoId && detailsMap.has(item.id.videoId))
    .map((item): YouTubeLiveStream => {
      const videoId = item.id.videoId!;
      const details = detailsMap.get(videoId)!;
      const thumbnail =
        item.snippet.thumbnails.high?.url ??
        item.snippet.thumbnails.medium?.url ??
        item.snippet.thumbnails.default?.url ??
        "";

      const viewerCount = details.liveStreamingDetails?.concurrentViewers
        ? parseInt(details.liveStreamingDetails.concurrentViewers, 10)
        : parseInt(details.statistics.viewCount || "0", 10);

      const startedAt =
        details.liveStreamingDetails?.actualStartTime ??
        details.liveStreamingDetails?.scheduledStartTime ??
        item.snippet.publishedAt;

      return {
        video_id: videoId,
        title: item.snippet.title,
        channel_name: item.snippet.channelTitle,
        thumbnail_url: thumbnail,
        viewer_count: viewerCount,
        started_at: startedAt,
      };
    });
}
