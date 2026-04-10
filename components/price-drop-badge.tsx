import { TrendingDown } from "lucide-react";

interface PriceDropBadgeProps {
  dropPercent: number;
  /** "sm" = card badge, "md" = product header. */
  size?: "sm" | "md";
  className?: string;
}

/**
 * Red "dropped X%" badge surfaced when a listing's price has fallen
 * by ≥10% over the lookback window (see lib/price-drops.ts).
 */
export function PriceDropBadge({ dropPercent, size = "sm", className }: PriceDropBadgeProps) {
  const base =
    "inline-flex items-center gap-1 rounded-full bg-[var(--danger)] text-white font-bold shadow-sm";
  const sized =
    size === "sm" ? "px-2 py-0.5 text-[10px]" : "px-3 py-1 text-xs";

  return (
    <span className={`${base} ${sized} ${className ?? ""}`}>
      <TrendingDown className={size === "sm" ? "w-2.5 h-2.5" : "w-3.5 h-3.5"} />
      Dropped {dropPercent}%
    </span>
  );
}
