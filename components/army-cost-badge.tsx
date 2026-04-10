import Link from "next/link";
import { TrendingDown, ShoppingCart, ArrowRight } from "lucide-react";
import type { ArmyCostResult } from "@/lib/army-cost";

interface ArmyCostBadgeProps {
  cost: ArmyCostResult;
  faction?: string | null;
  buildUrl: string;
}

function formatPrice(pence: number): string {
  return `\u00A3${(pence / 100).toFixed(2)}`;
}

/**
 * Prominent card rendered above parsed army lists on battle report pages.
 * Shows total build cost + RRP savings + deep link into /build with the
 * list pre-filled. This is a high-intent conversion surface: viewers are
 * already watching the army being played.
 */
export function ArmyCostBadge({ cost, faction, buildUrl }: ArmyCostBadgeProps) {
  if (cost.matchedUnitCount === 0) return null;

  const matchRate = Math.round(
    (cost.matchedUnitCount / (cost.matchedUnitCount + cost.unmatchedUnitCount)) * 100,
  );

  return (
    <div className="rounded-xl border border-[var(--vertical-accent)]/40 bg-gradient-to-br from-[var(--vertical-accent-glow)] to-transparent p-5 mb-3">
      <div className="flex items-start gap-4 flex-wrap">
        <div
          className="flex items-center justify-center w-12 h-12 rounded-xl shrink-0"
          style={{ backgroundColor: "var(--vertical-accent)", opacity: 0.15 }}
        >
          <ShoppingCart className="w-6 h-6 text-[var(--vertical-accent)]" />
        </div>

        <div className="flex-1 min-w-[200px]">
          <p className="text-[10px] uppercase tracking-wider font-bold text-[var(--vertical-accent-light)] mb-1">
            Build this {faction ?? "army"}
          </p>
          <div className="flex items-baseline gap-3 flex-wrap">
            <span className="text-3xl font-bold text-[var(--success)]">
              {formatPrice(cost.totalCost)}
            </span>
            {cost.totalRrp > cost.totalCost && (
              <>
                <span className="text-base text-muted-foreground line-through">
                  RRP {formatPrice(cost.totalRrp)}
                </span>
                {cost.savingsPercent > 0 && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-[var(--success)]/10 text-[var(--success)] px-2.5 py-0.5 text-xs font-bold">
                    <TrendingDown className="w-3 h-3" />
                    Save {cost.savingsPercent}%
                  </span>
                )}
              </>
            )}
          </div>
          <p className="text-xs text-muted-foreground mt-1.5">
            Cheapest across every retailer we track ·{" "}
            {cost.matchedUnitCount} of {cost.matchedUnitCount + cost.unmatchedUnitCount} units matched
            {matchRate < 100 && ` (${matchRate}%)`}
          </p>
        </div>

        <Link
          href={buildUrl}
          className="inline-flex items-center gap-2 rounded-lg bg-[var(--vertical-accent)] px-5 py-2.5 text-sm font-semibold text-white hover:opacity-90 transition-opacity shrink-0"
        >
          Build this army
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );
}
