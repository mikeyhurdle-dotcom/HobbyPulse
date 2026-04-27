import { wrapAffiliateUrl } from "@/lib/affiliate";
import { prettySource, formatGbp, type RetailerPrice } from "@/lib/price-comparison";
import { TrendingDown, ExternalLink } from "lucide-react";

interface PriceComparisonStripProps {
  prices: RetailerPrice[];
  source: string;
}

/**
 * Renders a compact retailer price-comparison row.
 * Gated upstream on having ≥2 retailer prices — caller should not render
 * when prices.length < 2.
 */
export function PriceComparisonStrip({ prices, source }: PriceComparisonStripProps) {
  if (prices.length < 2) return null;

  const lowest = prices[0];

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      <div className="px-4 py-3 border-b border-border bg-secondary/40 flex items-center gap-2">
        <TrendingDown className="w-4 h-4 text-[var(--vertical-accent)]" />
        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Best price across {prices.length} retailers
        </h3>
      </div>
      <ul className="divide-y divide-border">
        {prices.map((p) => {
          const isLowest = p.price_pence === lowest.price_pence;
          const href = wrapAffiliateUrl(p.affiliate_url ?? p.source_url, source);
          return (
            <li key={p.source}>
              <a
                href={href}
                target="_blank"
                rel="noopener noreferrer sponsored"
                className={`flex items-center justify-between gap-3 px-4 py-3 transition-colors ${
                  isLowest
                    ? "bg-[var(--vertical-accent-glow)] hover:bg-[var(--vertical-accent)]/15"
                    : "hover:bg-secondary"
                }`}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span className={`text-sm font-medium truncate ${isLowest ? "text-foreground" : ""}`}>
                    {prettySource(p.source)}
                  </span>
                  {isLowest && (
                    <span
                      className="inline-flex items-center rounded-full px-2 py-0.5 text-[9px] font-bold tracking-wider text-white"
                      style={{ backgroundColor: "var(--vertical-accent)" }}
                    >
                      LOWEST
                    </span>
                  )}
                  {p.in_stock === false && (
                    <span className="inline-flex items-center rounded-full px-2 py-0.5 text-[9px] font-medium border border-border text-muted-foreground">
                      Out of stock
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span
                    className={`text-base font-bold tracking-tight font-[family-name:var(--font-mono)] ${
                      isLowest ? "text-[var(--vertical-accent)]" : "text-foreground"
                    }`}
                  >
                    {formatGbp(p.price_pence)}
                  </span>
                  <ExternalLink className="w-3.5 h-3.5 text-muted-foreground" />
                </div>
              </a>
            </li>
          );
        })}
      </ul>
      <p className="px-4 py-2 text-[10px] text-muted-foreground border-t border-border bg-secondary/30">
        Prices updated daily. Affiliate links — we may earn a small commission.
      </p>
    </div>
  );
}
