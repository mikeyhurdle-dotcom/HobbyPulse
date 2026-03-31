"use client";

import { useEffect, useState, useCallback } from "react";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface DiscoveredVideo {
  id: string;
  youtube_video_id: string;
  title: string;
  thumbnail_url: string | null;
  published_at: string | null;
  view_count: number | null;
  duration_seconds: number | null;
  content_type: string;
  is_short: boolean;
}

interface ChannelCandidate {
  id: string;
  youtube_channel_id: string;
  channel_name: string;
  thumbnail_url: string | null;
  subscriber_count: number | null;
  video_count: number;
  battle_report_count: number;
  status: string;
  first_seen_at: string;
  last_seen_at: string;
  discovered_videos: DiscoveredVideo[];
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatDate(dateStr: string | null): string {
  if (!dateStr) return "--";
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays}d ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`;
  return date.toLocaleDateString();
}

function formatViews(count: number | null): string {
  if (count === null || count === undefined) return "--";
  if (count >= 1_000_000) return `${(count / 1_000_000).toFixed(1)}M`;
  if (count >= 1_000) return `${(count / 1_000).toFixed(1)}K`;
  return String(count);
}

function formatDuration(seconds: number | null): string {
  if (!seconds) return "--";
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0)
    return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  return `${m}:${String(s).padStart(2, "0")}`;
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function DiscoveryPage() {
  const [candidates, setCandidates] = useState<ChannelCandidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionInProgress, setActionInProgress] = useState<string | null>(null);
  const [expandedChannel, setExpandedChannel] = useState<string | null>(null);

  const fetchCandidates = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch("/api/channels/candidates", {
        headers: {
          Authorization: `Bearer ${getCronSecret()}`,
        },
      });
      if (!res.ok) {
        throw new Error(`API error: ${res.status}`);
      }
      const data = await res.json();
      setCandidates(data.candidates ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch candidates");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCandidates();
  }, [fetchCandidates]);

  async function handleAction(channelId: string, action: "approve" | "dismiss") {
    setActionInProgress(channelId);
    try {
      const res = await fetch("/api/channels/approve", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${getCronSecret()}`,
        },
        body: JSON.stringify({ channelId, action }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? `Failed: ${res.status}`);
      }

      // Remove from list
      setCandidates((prev) =>
        prev.filter((c) => c.youtube_channel_id !== channelId),
      );
    } catch (err) {
      alert(err instanceof Error ? err.message : "Action failed");
    } finally {
      setActionInProgress(null);
    }
  }

  const hotCandidates = candidates.filter((c) => c.battle_report_count >= 3);
  const otherCandidates = candidates.filter((c) => c.battle_report_count < 3);

  return (
    <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
      <h1 className="text-3xl font-bold tracking-tight mb-2">
        Channel Discovery
      </h1>
      <p className="text-[var(--muted)] mb-8">
        Channels discovered from YouTube search. Approve to start monitoring via
        RSS, or dismiss.
      </p>

      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4 text-center">
          <p className="text-2xl font-bold">{candidates.length}</p>
          <p className="text-xs text-[var(--muted)] mt-1">Pending</p>
        </div>
        <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4 text-center">
          <p className="text-2xl font-bold text-[var(--success)]">
            {hotCandidates.length}
          </p>
          <p className="text-xs text-[var(--muted)] mt-1">Hot (3+ reports)</p>
        </div>
        <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4 text-center">
          <p className="text-2xl font-bold">
            {candidates.reduce((sum, c) => sum + c.video_count, 0)}
          </p>
          <p className="text-xs text-[var(--muted)] mt-1">Total Videos</p>
        </div>
        <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4 text-center">
          <p className="text-2xl font-bold">
            {candidates.reduce((sum, c) => sum + c.battle_report_count, 0)}
          </p>
          <p className="text-xs text-[var(--muted)] mt-1">Battle Reports</p>
        </div>
      </div>

      {loading && (
        <div className="text-center py-16 text-[var(--muted)]">
          Loading candidates...
        </div>
      )}

      {error && (
        <div className="rounded-xl border border-[var(--danger)] bg-[var(--surface)] p-4 mb-8">
          <p className="text-[var(--danger)] text-sm">{error}</p>
          <p className="text-xs text-[var(--muted)] mt-2">
            Make sure CRON_SECRET is set. Enter it below:
          </p>
          <input
            type="password"
            placeholder="CRON_SECRET"
            className="mt-2 w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm"
            onChange={(e) => {
              if (typeof window !== "undefined") {
                sessionStorage.setItem("cron_secret", e.target.value);
              }
            }}
          />
          <button
            onClick={fetchCandidates}
            className="mt-2 rounded-lg bg-[var(--vertical-accent)] px-4 py-2 text-sm font-medium text-white"
          >
            Retry
          </button>
        </div>
      )}

      {!loading && !error && candidates.length === 0 && (
        <div className="text-center py-16">
          <p className="text-[var(--muted)] text-lg">
            No pending channel candidates.
          </p>
          <p className="text-[var(--muted)] text-sm mt-1">
            Run the discovery cron to find new channels.
          </p>
        </div>
      )}

      {/* Hot candidates section */}
      {hotCandidates.length > 0 && (
        <section className="mb-8">
          <h2 className="text-lg font-semibold mb-4 text-[var(--success)]">
            Hot Candidates (3+ battle reports)
          </h2>
          <div className="space-y-3">
            {hotCandidates.map((candidate) => (
              <CandidateCard
                key={candidate.id}
                candidate={candidate}
                isExpanded={expandedChannel === candidate.youtube_channel_id}
                onToggle={() =>
                  setExpandedChannel(
                    expandedChannel === candidate.youtube_channel_id
                      ? null
                      : candidate.youtube_channel_id,
                  )
                }
                onAction={handleAction}
                actionInProgress={actionInProgress}
                isHot
              />
            ))}
          </div>
        </section>
      )}

      {/* Other candidates */}
      {otherCandidates.length > 0 && (
        <section>
          <h2 className="text-lg font-semibold mb-4">Other Candidates</h2>
          <div className="space-y-3">
            {otherCandidates.map((candidate) => (
              <CandidateCard
                key={candidate.id}
                candidate={candidate}
                isExpanded={expandedChannel === candidate.youtube_channel_id}
                onToggle={() =>
                  setExpandedChannel(
                    expandedChannel === candidate.youtube_channel_id
                      ? null
                      : candidate.youtube_channel_id,
                  )
                }
                onAction={handleAction}
                actionInProgress={actionInProgress}
                isHot={false}
              />
            ))}
          </div>
        </section>
      )}
    </main>
  );
}

// ---------------------------------------------------------------------------
// Candidate Card Component
// ---------------------------------------------------------------------------

function CandidateCard({
  candidate,
  isExpanded,
  onToggle,
  onAction,
  actionInProgress,
  isHot,
}: {
  candidate: ChannelCandidate;
  isExpanded: boolean;
  onToggle: () => void;
  onAction: (channelId: string, action: "approve" | "dismiss") => void;
  actionInProgress: string | null;
  isHot: boolean;
}) {
  const isProcessing = actionInProgress === candidate.youtube_channel_id;

  return (
    <div
      className={`rounded-xl border bg-[var(--surface)] overflow-hidden ${
        isHot ? "border-[var(--success)]" : "border-[var(--border)]"
      }`}
    >
      {/* Header */}
      <div className="flex items-center gap-4 px-4 py-3">
        {/* Channel info */}
        <button
          onClick={onToggle}
          className="flex-1 flex items-center gap-3 text-left"
        >
          <div className="w-10 h-10 rounded-full bg-[var(--surface-hover)] flex items-center justify-center text-[var(--muted)] text-xs shrink-0">
            {candidate.thumbnail_url ? (
              <img
                src={candidate.thumbnail_url}
                alt={candidate.channel_name}
                className="w-10 h-10 rounded-full"
              />
            ) : (
              candidate.channel_name.charAt(0).toUpperCase()
            )}
          </div>
          <div className="min-w-0">
            <p className="font-medium text-sm truncate">
              {candidate.channel_name}
            </p>
            <p className="text-xs text-[var(--muted)]">
              {candidate.subscriber_count
                ? `${formatViews(candidate.subscriber_count)} subs`
                : "Subs unknown"}{" "}
              &middot; {candidate.video_count} videos &middot;{" "}
              {candidate.battle_report_count} reports
            </p>
          </div>
        </button>

        {/* Timestamps */}
        <div className="hidden sm:block text-right shrink-0">
          <p className="text-xs text-[var(--muted)]">
            First: {formatDate(candidate.first_seen_at)}
          </p>
          <p className="text-xs text-[var(--muted)]">
            Last: {formatDate(candidate.last_seen_at)}
          </p>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() =>
              onAction(candidate.youtube_channel_id, "approve")
            }
            disabled={isProcessing}
            className="rounded-lg bg-[var(--success)] px-3 py-1.5 text-xs font-medium text-white hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {isProcessing ? "..." : "Approve"}
          </button>
          <button
            onClick={() =>
              onAction(candidate.youtube_channel_id, "dismiss")
            }
            disabled={isProcessing}
            className="rounded-lg border border-[var(--border)] px-3 py-1.5 text-xs font-medium text-[var(--muted)] hover:text-[var(--danger)] hover:border-[var(--danger)] transition-colors disabled:opacity-50"
          >
            Dismiss
          </button>
        </div>
      </div>

      {/* Expanded: discovered videos */}
      {isExpanded && candidate.discovered_videos.length > 0 && (
        <div className="border-t border-[var(--border)] px-4 py-3">
          <p className="text-xs font-medium text-[var(--muted)] uppercase tracking-wider mb-3">
            Discovered Videos
          </p>
          <div className="space-y-2">
            {candidate.discovered_videos.map((video) => (
              <a
                key={video.id}
                href={`https://www.youtube.com/watch?v=${video.youtube_video_id}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 rounded-lg p-2 hover:bg-[var(--surface-hover)] transition-colors"
              >
                {video.thumbnail_url && (
                  <img
                    src={video.thumbnail_url}
                    alt=""
                    className="w-24 aspect-video rounded object-cover shrink-0"
                  />
                )}
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium line-clamp-1">
                    {video.title}
                  </p>
                  <p className="text-xs text-[var(--muted)]">
                    {formatDate(video.published_at)} &middot;{" "}
                    {formatViews(video.view_count)} views &middot;{" "}
                    {formatDuration(video.duration_seconds)}
                  </p>
                </div>
                <span
                  className="shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium border"
                  style={{
                    borderColor:
                      video.content_type === "battle-report"
                        ? "#22c55e"
                        : "var(--border)",
                    color:
                      video.content_type === "battle-report"
                        ? "#22c55e"
                        : "var(--muted)",
                  }}
                >
                  {video.content_type}
                </span>
              </a>
            ))}
          </div>
        </div>
      )}

      {isExpanded && candidate.discovered_videos.length === 0 && (
        <div className="border-t border-[var(--border)] px-4 py-6 text-center">
          <p className="text-xs text-[var(--muted)]">
            No discovered videos yet.
          </p>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Helper to get CRON_SECRET from sessionStorage (for admin use)
// ---------------------------------------------------------------------------
function getCronSecret(): string {
  if (typeof window !== "undefined") {
    return sessionStorage.getItem("cron_secret") ?? "";
  }
  return "";
}
