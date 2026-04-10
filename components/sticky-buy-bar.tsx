"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowRight } from "lucide-react";

interface StickyBuyBarProps {
  productName: string;
  price: number;
  source: string;
  buyUrl: string;
  /** Id of the element whose visibility controls the bar. When the element
   *  leaves the viewport (scroll past), the bar appears. Typically the
   *  primary price comparison table. */
  targetId: string;
}

function formatPrice(pence: number): string {
  return `\u00A3${(pence / 100).toFixed(2)}`;
}

/**
 * Fixed-bottom buy CTA that appears when the primary listings table scrolls
 * out of view. Keeps the affiliate link one tap away no matter where the
 * user is in the page. Slides up with a spring-style transform.
 */
export function StickyBuyBar({
  productName,
  price,
  source,
  buyUrl,
  targetId,
}: StickyBuyBarProps) {
  const [visible, setVisible] = useState(false);
  const observerRef = useRef<IntersectionObserver | null>(null);

  useEffect(() => {
    const target = document.getElementById(targetId);
    if (!target || typeof IntersectionObserver === "undefined") return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        // Show the bar only after the table has been scrolled above the
        // viewport. `boundingClientRect.top < 0` means the top of the table
        // is above the viewport top, so we're past it.
        setVisible(
          !entry.isIntersecting && entry.boundingClientRect.top < 0,
        );
      },
      { threshold: 0, rootMargin: "0px 0px -40% 0px" },
    );

    observer.observe(target);
    observerRef.current = observer;
    return () => observer.disconnect();
  }, [targetId]);

  return (
    <div
      className={`fixed inset-x-0 bottom-0 z-40 pointer-events-none transition-transform duration-300 ease-out ${
        visible ? "translate-y-0" : "translate-y-full"
      }`}
      aria-hidden={!visible}
    >
      <div className="mx-auto max-w-3xl p-3 sm:p-4">
        <div className="pointer-events-auto rounded-xl border border-border bg-card/95 backdrop-blur shadow-2xl px-4 py-3 flex items-center gap-3">
          <div className="flex-1 min-w-0">
            <p className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground">
              Cheapest right now
            </p>
            <p className="text-sm font-medium truncate">{productName}</p>
          </div>
          <div className="text-right shrink-0">
            <p className="text-lg font-bold text-[var(--success)] leading-tight">
              {formatPrice(price)}
            </p>
            <p className="text-[10px] text-muted-foreground leading-tight">{source}</p>
          </div>
          <a
            href={buyUrl}
            target="_blank"
            rel="noopener noreferrer sponsored"
            className="inline-flex items-center gap-1 rounded-lg bg-[var(--vertical-accent)] px-4 py-2.5 text-sm font-semibold text-white hover:opacity-90 transition-opacity shrink-0"
          >
            Buy
            <ArrowRight className="w-4 h-4" />
          </a>
        </div>
      </div>
    </div>
  );
}
