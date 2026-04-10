"use client";

import { useState } from "react";
import { Check, Copy, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ShareButtonsProps {
  /** Absolute URL to share. */
  url: string;
  /** Page title — used as the Reddit submission title and X tweet text. */
  title: string;
  /** Optional extra context appended to the X share text. */
  subtext?: string;
  className?: string;
}

/**
 * Lightweight share row: Reddit, X (Twitter), and copy-link.
 * Client component — uses navigator.clipboard and window.open.
 */
export function ShareButtons({ url, title, subtext, className }: ShareButtonsProps) {
  const [copied, setCopied] = useState(false);

  const redditUrl = `https://www.reddit.com/submit?url=${encodeURIComponent(url)}&title=${encodeURIComponent(title)}`;
  const xText = subtext ? `${title} — ${subtext}` : title;
  const xUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(xText)}&url=${encodeURIComponent(url)}`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard blocked — silently ignore.
    }
  };

  return (
    <div className={`flex items-center gap-2 ${className ?? ""}`}>
      <span className="text-xs text-muted-foreground mr-1 inline-flex items-center gap-1">
        <Share2 className="w-3.5 h-3.5" />
        Share
      </span>
      <Button
        asChild
        variant="outline"
        size="sm"
        className="h-8 px-2.5 text-xs"
      >
        <a
          href={redditUrl}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Share on Reddit"
        >
          Reddit
        </a>
      </Button>
      <Button
        asChild
        variant="outline"
        size="sm"
        className="h-8 px-2.5 text-xs"
      >
        <a
          href={xUrl}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Share on X"
        >
          X
        </a>
      </Button>
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={handleCopy}
        className="h-8 px-2.5 text-xs gap-1.5"
        aria-label="Copy link"
      >
        {copied ? (
          <>
            <Check className="w-3.5 h-3.5" />
            Copied
          </>
        ) : (
          <>
            <Copy className="w-3.5 h-3.5" />
            Copy link
          </>
        )}
      </Button>
    </div>
  );
}
