// ---------------------------------------------------------------------------
// Channel helpers
// ---------------------------------------------------------------------------
// The `channels` table has no slug column, only a name. We derive slugs from
// names in application code so URLs stay clean (`/channels/mordian-glory`
// rather than `/channels/UCItUjGqA1uKs0l80L-VaAjQ`).
// ---------------------------------------------------------------------------

import { supabase } from "@/lib/supabase";

export interface Channel {
  id: string;
  vertical_id: string;
  youtube_channel_id: string;
  name: string;
  thumbnail_url: string | null;
  subscriber_count: number;
}

/** Deterministically slugify a channel name. */
export function channelSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

/** Fetch every channel for a vertical. Used by the channels hub and for slug lookup. */
export async function getChannelsForVertical(verticalId: string): Promise<Channel[]> {
  const { data } = await supabase
    .from("channels")
    .select("id, vertical_id, youtube_channel_id, name, thumbnail_url, subscriber_count")
    .eq("vertical_id", verticalId)
    .order("subscriber_count", { ascending: false });
  return (data ?? []) as Channel[];
}

/**
 * Lookup a channel by slug. Since there are typically <30 channels per
 * vertical, fetching them all and matching in JS is cheap and avoids the
 * need for a dedicated slug column in Postgres.
 */
export async function findChannelBySlug(
  slug: string,
  verticalId: string,
): Promise<Channel | null> {
  const channels = await getChannelsForVertical(verticalId);
  return channels.find((c) => channelSlug(c.name) === slug) ?? null;
}

export function formatSubscribers(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}
