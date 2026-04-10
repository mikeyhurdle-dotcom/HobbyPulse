"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { X, Play } from "lucide-react";

interface NextVideo {
  youtubeVideoId: string;
  title: string;
  thumbnailUrl: string | null;
  channelName: string | null;
}

interface YouTubePlayerProps {
  videoId: string;
  title: string;
  nextVideo?: NextVideo | null;
}

// Typed access to the YouTube IFrame API globals we care about. The full
// types live in `@types/youtube` but declaring the minimum surface keeps us
// dependency-free.
declare global {
  interface Window {
    YT?: {
      Player: new (
        elementId: string | HTMLElement,
        opts: {
          events?: {
            onStateChange?: (event: { data: number }) => void;
          };
        },
      ) => unknown;
      PlayerState?: { ENDED: number };
    };
    onYouTubeIframeAPIReady?: () => void;
  }
}

const COUNTDOWN_SECONDS = 7;

/**
 * YouTube embed wrapped with an autoplay-next overlay.
 *
 * When the video ends, a countdown card appears over the player inviting the
 * user to continue to the next video. They can cancel to stay on the page.
 * Uses the YouTube IFrame API loaded once per session.
 */
export function YouTubePlayer({ videoId, title, nextVideo }: YouTubePlayerProps) {
  const router = useRouter();
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [ended, setEnded] = useState(false);
  const [countdown, setCountdown] = useState(COUNTDOWN_SECONDS);
  const [cancelled, setCancelled] = useState(false);

  // Attach YouTube IFrame API listener once the script is available.
  useEffect(() => {
    if (!nextVideo) return;

    let player: unknown = null;

    function onReady() {
      if (!iframeRef.current || !window.YT) return;
      player = new window.YT.Player(iframeRef.current, {
        events: {
          onStateChange: (event) => {
            // state 0 === ENDED
            if (event.data === 0) setEnded(true);
          },
        },
      });
    }

    if (window.YT && window.YT.Player) {
      onReady();
    } else {
      // Load the IFrame API script once. The global callback fires when ready.
      const existing = document.getElementById("yt-iframe-api");
      if (!existing) {
        const tag = document.createElement("script");
        tag.id = "yt-iframe-api";
        tag.src = "https://www.youtube.com/iframe_api";
        document.head.appendChild(tag);
      }
      window.onYouTubeIframeAPIReady = onReady;
    }

    return () => {
      // Best-effort cleanup; YT.Player has no typed `destroy` in our minimal
      // declaration, so cast to the loose shape we care about.
      const p = player as { destroy?: () => void } | null;
      p?.destroy?.();
    };
  }, [nextVideo, videoId]);

  // Reset state whenever the videoId changes (client-side nav between videos).
  useEffect(() => {
    setEnded(false);
    setCountdown(COUNTDOWN_SECONDS);
    setCancelled(false);
  }, [videoId]);

  // Tick the countdown once the video has ended.
  useEffect(() => {
    if (!ended || cancelled || !nextVideo) return;

    if (countdown <= 0) {
      router.push(`/watch/${nextVideo.youtubeVideoId}`);
      return;
    }

    const id = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(id);
  }, [ended, cancelled, countdown, nextVideo, router]);

  return (
    <div className="relative aspect-video rounded-xl overflow-hidden border border-border bg-black">
      <iframe
        ref={iframeRef}
        src={`https://www.youtube.com/embed/${videoId}?enablejsapi=1`}
        title={title}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        allowFullScreen
        className="w-full h-full"
      />

      {/* Autoplay-next overlay */}
      {ended && !cancelled && nextVideo && (
        <div className="absolute inset-0 bg-black/90 flex items-center justify-center p-4 sm:p-8">
          <div className="max-w-md w-full rounded-2xl border border-border bg-card p-5 shadow-2xl">
            <div className="flex items-center justify-between mb-3">
              <p className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground">
                Up next in {countdown}s
              </p>
              <button
                type="button"
                onClick={() => setCancelled(true)}
                className="inline-flex items-center justify-center w-7 h-7 rounded-full border border-border text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
                aria-label="Cancel autoplay"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            <Link
              href={`/watch/${nextVideo.youtubeVideoId}`}
              className="block group"
            >
              <div className="relative aspect-video bg-muted rounded-lg overflow-hidden mb-3">
                {nextVideo.thumbnailUrl && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={nextVideo.thumbnailUrl}
                    alt={nextVideo.title}
                    className="w-full h-full object-cover"
                  />
                )}
                <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                  <div
                    className="w-14 h-14 rounded-full flex items-center justify-center shadow-lg"
                    style={{ backgroundColor: "var(--vertical-accent)" }}
                  >
                    <Play className="w-6 h-6 text-white fill-white ml-0.5" />
                  </div>
                </div>
              </div>
              <h3 className="text-sm font-semibold leading-snug line-clamp-2 group-hover:text-[var(--vertical-accent-light)] transition-colors">
                {nextVideo.title}
              </h3>
              {nextVideo.channelName && (
                <p className="text-xs text-muted-foreground mt-1">
                  {nextVideo.channelName}
                </p>
              )}
            </Link>

            <button
              type="button"
              onClick={() => setCancelled(true)}
              className="mt-4 w-full rounded-lg border border-border bg-background hover:bg-secondary text-xs font-medium py-2 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
