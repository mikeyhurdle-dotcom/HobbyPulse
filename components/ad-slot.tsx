// ---------------------------------------------------------------------------
// Ad Slot Component — reusable AdSense ad unit
// ---------------------------------------------------------------------------
// Only renders when NEXT_PUBLIC_ADSENSE_PUB_ID is set.
// Exports three named presets: AdSidebar, AdBetweenContent, AdMobileFooter.
// ---------------------------------------------------------------------------

"use client";

import { useEffect, useRef } from "react";

type AdFormat = "horizontal" | "vertical" | "rectangle" | "leaderboard";

interface AdSlotProps {
  slot: string;
  format: AdFormat;
  className?: string;
}

const FORMAT_STYLES: Record<AdFormat, { width: string; height: string }> = {
  horizontal: { width: "728px", height: "90px" },
  vertical: { width: "300px", height: "600px" },
  rectangle: { width: "300px", height: "250px" },
  leaderboard: { width: "728px", height: "90px" },
};

declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    adsbygoogle?: any[];
  }
}

export function AdSlot({ slot, format, className }: AdSlotProps) {
  const pubId = process.env.NEXT_PUBLIC_ADSENSE_PUB_ID;
  const adRef = useRef<HTMLModElement>(null);
  const pushed = useRef(false);

  useEffect(() => {
    if (!pubId || pushed.current) return;
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
      pushed.current = true;
    } catch {
      // AdSense not loaded — fail silently
    }
  }, [pubId]);

  if (!pubId) return null;

  const style = FORMAT_STYLES[format];

  return (
    <div
      className={className}
      style={{ maxWidth: style.width, margin: "0 auto" }}
    >
      <ins
        ref={adRef}
        className="adsbygoogle"
        style={{
          display: "block",
          width: style.width,
          height: style.height,
          maxWidth: "100%",
        }}
        data-ad-client={pubId}
        data-ad-slot={slot}
        data-ad-format="auto"
        data-full-width-responsive="true"
      />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Named Presets
// ---------------------------------------------------------------------------

/** Sidebar ad — 300x250 rectangle */
export function AdSidebar({ className }: { className?: string }) {
  const slot = process.env.NEXT_PUBLIC_AD_SLOT_SIDEBAR ?? "";
  return <AdSlot slot={slot} format="rectangle" className={className} />;
}

/** Between-content ad — 728x90 leaderboard */
export function AdBetweenContent({ className }: { className?: string }) {
  const slot = process.env.NEXT_PUBLIC_AD_SLOT_BETWEEN ?? "";
  return <AdSlot slot={slot} format="leaderboard" className={className} />;
}

/** Mobile footer ad — 320x50 sticky bottom bar, mobile only */
export function AdMobileFooter({ className }: { className?: string }) {
  const slot = process.env.NEXT_PUBLIC_AD_SLOT_MOBILE ?? "";
  return (
    <div className={`fixed bottom-0 left-0 right-0 z-40 sm:hidden ${className ?? ""}`}>
      <AdSlot
        slot={slot}
        format="horizontal"
        className="bg-[var(--background)] border-t border-[var(--border)] py-1"
      />
    </div>
  );
}
