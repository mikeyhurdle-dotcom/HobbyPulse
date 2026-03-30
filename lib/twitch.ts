// ---------------------------------------------------------------------------
// Twitch Helix API Client
// ---------------------------------------------------------------------------
// Uses OAuth client_credentials flow. Token is cached in-memory with a 60s
// safety margin before expiry (same pattern as lib/ebay.ts).
// ---------------------------------------------------------------------------

const TWITCH_AUTH_URL = "https://id.twitch.tv/oauth2/token";
const TWITCH_API_BASE = "https://api.twitch.tv/helix";
const TWITCH_CLIENT_ID = process.env.TWITCH_CLIENT_ID!;
const TWITCH_CLIENT_SECRET = process.env.TWITCH_CLIENT_SECRET!;

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface TwitchStream {
  stream_id: string;
  streamer_name: string;
  title: string;
  thumbnail_url: string;
  viewer_count: number;
  game_name: string;
  started_at: string;
}

interface TwitchOAuthResponse {
  access_token: string;
  expires_in: number;
  token_type: string;
}

interface TwitchStreamItem {
  id: string;
  user_id: string;
  user_login: string;
  user_name: string;
  game_id: string;
  game_name: string;
  type: string;
  title: string;
  viewer_count: number;
  started_at: string;
  language: string;
  thumbnail_url: string;
  tag_ids: string[];
  tags: string[];
  is_mature: boolean;
}

interface TwitchStreamsResponse {
  data: TwitchStreamItem[];
  pagination: { cursor?: string };
}

interface TwitchGameItem {
  id: string;
  name: string;
  box_art_url: string;
  igdb_id: string;
}

interface TwitchGamesResponse {
  data: TwitchGameItem[];
}

// ---------------------------------------------------------------------------
// OAuth token cache
// ---------------------------------------------------------------------------

let cachedToken: { token: string; expiresAt: number } | null = null;

async function getAccessToken(): Promise<string> {
  if (cachedToken && Date.now() < cachedToken.expiresAt - 60_000) {
    return cachedToken.token;
  }

  const url = new URL(TWITCH_AUTH_URL);
  url.searchParams.set("client_id", TWITCH_CLIENT_ID);
  url.searchParams.set("client_secret", TWITCH_CLIENT_SECRET);
  url.searchParams.set("grant_type", "client_credentials");

  const res = await fetch(url.toString(), { method: "POST" });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Twitch OAuth error ${res.status}: ${body}`);
  }

  const data = (await res.json()) as TwitchOAuthResponse;

  cachedToken = {
    token: data.access_token,
    expiresAt: Date.now() + data.expires_in * 1000,
  };

  return cachedToken.token;
}

// ---------------------------------------------------------------------------
// Internal fetch helper
// ---------------------------------------------------------------------------

async function twitchFetch<T>(
  path: string,
  params: Record<string, string | string[]>,
): Promise<T> {
  const token = await getAccessToken();
  const url = new URL(`${TWITCH_API_BASE}/${path}`);

  for (const [k, v] of Object.entries(params)) {
    if (Array.isArray(v)) {
      for (const item of v) {
        url.searchParams.append(k, item);
      }
    } else {
      url.searchParams.set(k, v);
    }
  }

  const res = await fetch(url.toString(), {
    headers: {
      Authorization: `Bearer ${token}`,
      "Client-Id": TWITCH_CLIENT_ID,
    },
    cache: "no-store",
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Twitch API error ${res.status}: ${body}`);
  }

  return res.json() as Promise<T>;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatThumbnail(url: string, width = 440, height = 248): string {
  return url
    .replace("{width}", String(width))
    .replace("{height}", String(height));
}

function toTwitchStream(item: TwitchStreamItem): TwitchStream {
  return {
    stream_id: item.id,
    streamer_name: item.user_name,
    title: item.title,
    thumbnail_url: formatThumbnail(item.thumbnail_url),
    viewer_count: item.viewer_count,
    game_name: item.game_name,
    started_at: item.started_at,
  };
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Get live streams for specific Twitch game/category IDs.
 * Fetches up to 100 streams per game (first page only).
 */
export async function searchStreamsByGame(
  gameIds: string[],
): Promise<TwitchStream[]> {
  if (gameIds.length === 0) return [];

  const data = await twitchFetch<TwitchStreamsResponse>("streams", {
    game_id: gameIds,
    first: "100",
    type: "live",
  });

  return data.data.map(toTwitchStream);
}

/**
 * Search for live streams by keyword query.
 * Uses the search/channels endpoint then fetches their streams.
 */
export async function searchStreamsByQuery(
  query: string,
): Promise<TwitchStream[]> {
  // The Helix streams endpoint doesn't support keyword search directly,
  // so we search channels first then check if they're live.
  const searchUrl = new URL(`${TWITCH_API_BASE}/search/channels`);
  searchUrl.searchParams.set("query", query);
  searchUrl.searchParams.set("first", "20");
  searchUrl.searchParams.set("live_only", "true");

  const token = await getAccessToken();
  const res = await fetch(searchUrl.toString(), {
    headers: {
      Authorization: `Bearer ${token}`,
      "Client-Id": TWITCH_CLIENT_ID,
    },
    cache: "no-store",
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Twitch search error ${res.status}: ${body}`);
  }

  const searchData = (await res.json()) as {
    data: {
      id: string;
      broadcaster_login: string;
      display_name: string;
      game_id: string;
      game_name: string;
      is_live: boolean;
      title: string;
      started_at: string;
      thumbnail_url: string;
    }[];
  };

  if (!searchData.data || searchData.data.length === 0) return [];

  // Get the user IDs of live channels, then fetch their streams for viewer counts
  const userIds = searchData.data
    .filter((ch) => ch.is_live)
    .map((ch) => ch.id);

  if (userIds.length === 0) return [];

  const streamsData = await twitchFetch<TwitchStreamsResponse>("streams", {
    user_id: userIds,
    first: "100",
    type: "live",
  });

  return streamsData.data.map(toTwitchStream);
}

/**
 * Resolve a game/category name to its Twitch category ID.
 * Returns null if no match is found.
 */
export async function getGameId(
  gameName: string,
): Promise<string | null> {
  const data = await twitchFetch<TwitchGamesResponse>("games", {
    name: gameName,
  });

  return data.data[0]?.id ?? null;
}
