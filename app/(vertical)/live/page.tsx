import { Nav } from "@/components/nav";
import { AdBetweenContent } from "@/components/ad-slot";
import { supabase } from "@/lib/supabase";
import { getSiteVertical } from "@/lib/site";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface LiveStream {
  id: string;
  platform: "twitch" | "youtube";
  stream_id: string;
  streamer_name: string;
  title: string;
  thumbnail_url: string | null;
  viewer_count: number;
  game_category: string | null;
  started_at: string;
}

interface EventGroup {
  keyword: string;
  streams: LiveStream[];
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatTimeAgo(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));

  if (diffMins < 1) return "just started";
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  return `${Math.floor(diffHours / 24)}d ago`;
}

function formatViewers(count: number): string {
  if (count >= 1_000_000) return `${(count / 1_000_000).toFixed(1)}M`;
  if (count >= 1_000) return `${(count / 1_000).toFixed(1)}K`;
  return String(count);
}

function getStreamUrl(stream: LiveStream): string {
  if (stream.platform === "twitch") {
    return `https://www.twitch.tv/${stream.streamer_name.toLowerCase().replace(/\s+/g, "")}`;
  }
  return `https://www.youtube.com/watch?v=${stream.stream_id}`;
}

/**
 * Basic event grouping: find title keywords (2+ words) that appear in
 * multiple stream titles. Streams sharing a keyword are grouped together.
 */
function groupEvents(streams: LiveStream[]): {
  events: EventGroup[];
  ungrouped: LiveStream[];
} {
  if (streams.length < 3) return { events: [], ungrouped: streams };

  // Extract meaningful multi-word phrases from titles
  const titleWords = streams.map((s) =>
    s.title
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, "")
      .split(/\s+/)
      .filter((w) => w.length > 3),
  );

  // Count 2-word bigrams across titles
  const bigramCounts = new Map<string, Set<number>>();
  for (let i = 0; i < titleWords.length; i++) {
    const words = titleWords[i];
    for (let j = 0; j < words.length - 1; j++) {
      const bigram = `${words[j]} ${words[j + 1]}`;
      if (!bigramCounts.has(bigram)) bigramCounts.set(bigram, new Set());
      bigramCounts.get(bigram)!.add(i);
    }
    // Also check single distinctive words (longer ones)
    for (const word of words) {
      if (word.length >= 6) {
        if (!bigramCounts.has(word)) bigramCounts.set(word, new Set());
        bigramCounts.get(word)!.add(i);
      }
    }
  }

  // Find keywords that appear in 3+ different streams
  const events: EventGroup[] = [];
  const grouped = new Set<number>();

  const sorted = [...bigramCounts.entries()]
    .filter(([, indices]) => indices.size >= 3)
    .sort((a, b) => b[1].size - a[1].size);

  for (const [keyword, indices] of sorted) {
    const newIndices = [...indices].filter((i) => !grouped.has(i));
    if (newIndices.length < 3) continue;

    const eventStreams = newIndices.map((i) => streams[i]);
    events.push({
      keyword: keyword.charAt(0).toUpperCase() + keyword.slice(1),
      streams: eventStreams.sort((a, b) => b.viewer_count - a.viewer_count),
    });
    for (const i of newIndices) grouped.add(i);
  }

  const ungrouped = streams.filter((_, i) => !grouped.has(i));
  return { events, ungrouped };
}

// ---------------------------------------------------------------------------
// Stream Card Component
// ---------------------------------------------------------------------------

function StreamCard({ stream }: { stream: LiveStream }) {
  return (
    <a
      href={getStreamUrl(stream)}
      target="_blank"
      rel="noopener noreferrer"
      className="group rounded-xl border border-[var(--border)] bg-[var(--surface)] overflow-hidden hover:border-[var(--border-light)] hover:bg-[var(--surface-hover)] transition-all"
    >
      {/* Thumbnail */}
      <div className="relative aspect-video bg-[var(--surface-hover)]">
        {stream.thumbnail_url ? (
          <img
            src={stream.thumbnail_url}
            alt={stream.title}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-[var(--muted)]">
            No thumbnail
          </div>
        )}

        {/* LIVE badge */}
        <span className="absolute top-2 left-2 flex items-center gap-1 px-2 py-0.5 rounded bg-[var(--danger)] text-white text-[10px] font-bold uppercase tracking-wide">
          <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
          Live
        </span>

        {/* Platform badge */}
        <span
          className={`absolute top-2 right-2 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide text-white ${
            stream.platform === "twitch" ? "bg-[#9146FF]" : "bg-[#FF0000]"
          }`}
        >
          {stream.platform === "twitch" ? "Twitch" : "YouTube"}
        </span>

        {/* Viewer count */}
        <span className="absolute bottom-2 right-2 bg-black/80 text-white text-xs font-[family-name:var(--font-mono)] px-1.5 py-0.5 rounded">
          {formatViewers(stream.viewer_count)} viewers
        </span>
      </div>

      {/* Info */}
      <div className="p-4 space-y-2">
        <h3 className="text-sm font-medium leading-snug line-clamp-2 group-hover:text-[var(--vertical-accent-light)] transition-colors">
          {stream.title}
        </h3>

        <div className="flex items-center gap-2 text-xs text-[var(--muted)]">
          <span className="font-medium text-[var(--foreground)]">
            {stream.streamer_name}
          </span>
        </div>

        <div className="flex items-center gap-2 text-xs text-[var(--muted)]">
          {stream.game_category && (
            <>
              <span>{stream.game_category}</span>
              <span>-</span>
            </>
          )}
          <span>started {formatTimeAgo(stream.started_at)}</span>
        </div>
      </div>
    </a>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default async function LivePage() {
  const config = getSiteVertical();

  // Fetch the vertical_id
  const { data: verticalRow } = await supabase
    .from("verticals")
    .select("id")
    .eq("slug", config.slug)
    .single();

  const verticalId = verticalRow?.id;

  // Fetch live streams
  const { data: streams } = await supabase
    .from("live_streams")
    .select(
      "id, platform, stream_id, streamer_name, title, thumbnail_url, viewer_count, game_category, started_at",
    )
    .eq("vertical_id", verticalId ?? "")
    .eq("is_live", true)
    .order("viewer_count", { ascending: false });

  const liveStreams = (streams ?? []) as LiveStream[];
  const streamCount = liveStreams.length;

  // Group events
  const { events, ungrouped } = groupEvents(liveStreams);

  return (
    <>
      <Nav active="live" />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <div className="flex items-center gap-3 mb-2">
          <h1 className="text-3xl font-bold tracking-tight">Live</h1>
          <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[var(--danger)]/10 text-[var(--danger)] text-xs font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-[var(--danger)] animate-pulse" />
            {streamCount} {streamCount === 1 ? "stream" : "streams"}
          </span>
        </div>
        <p className="text-[var(--muted)] mb-8">
          {config.liveDescription}
        </p>

        {/* Ad slot */}
        <AdBetweenContent className="mb-8" />

        {streamCount === 0 ? (
          /* Empty state */
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-16 h-16 rounded-2xl bg-[var(--surface)] border border-[var(--border)] flex items-center justify-center mb-4">
              <span className="text-2xl text-[var(--muted)]">●</span>
            </div>
            <p className="text-[var(--muted)] text-sm">
              No live streams right now. Check back soon.
            </p>
          </div>
        ) : (
          <div className="space-y-10">
            {/* Event groups */}
            {events.map((event) => (
              <details key={event.keyword} open className="group/event">
                <summary className="flex items-center gap-3 cursor-pointer mb-4 select-none">
                  <span className="text-lg font-bold tracking-tight">
                    {event.keyword}
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-[var(--vertical-accent)]/10 text-[var(--vertical-accent-light)] text-xs font-medium">
                    {event.streams.length} streams
                  </span>
                  <span className="text-xs text-[var(--muted)] group-open/event:rotate-90 transition-transform">
                    ▶
                  </span>
                </summary>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                  {event.streams.map((stream) => (
                    <StreamCard key={stream.id} stream={stream} />
                  ))}
                </div>
              </details>
            ))}

            {/* Ungrouped streams */}
            {ungrouped.length > 0 && (
              <div>
                {events.length > 0 && (
                  <h2 className="text-lg font-bold tracking-tight mb-4">
                    Other Streams
                  </h2>
                )}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                  {ungrouped.map((stream) => (
                    <StreamCard key={stream.id} stream={stream} />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </>
  );
}
