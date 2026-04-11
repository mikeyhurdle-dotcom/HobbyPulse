import { ExternalLink } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { amazonUrlFromAsin, wrapAffiliateUrl } from "@/lib/affiliate";

// ---------------------------------------------------------------------------
// BuyLinks — affiliate link card for board game articles
// ---------------------------------------------------------------------------

export interface BuyLink {
  retailer: string;
  url: string;
  /** Optional ASIN — if provided, generates an Amazon affiliate link */
  asin?: string;
}

interface BuyLinksProps {
  gameName: string;
  links: BuyLink[];
  source?: string;
}

const RETAILER_COLOURS: Record<string, string> = {
  Amazon: "#ff9900",
  "Zatu Games": "#1a73e8",
  "Wayland Games": "#e91e63",
  eBay: "#e53238",
};

export function BuyLinks({ gameName, links, source = "buy-links" }: BuyLinksProps) {
  if (links.length === 0) return null;

  const resolvedLinks = links.map((link) => {
    if (link.asin) {
      return {
        ...link,
        url: amazonUrlFromAsin(link.asin, source),
      };
    }
    return {
      ...link,
      url: wrapAffiliateUrl(link.url, source),
    };
  });

  return (
    <Card className="border-border bg-card">
      <CardContent className="p-5">
        <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-3">
          Where to Buy {gameName}
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {resolvedLinks.map((link) => (
            <a
              key={link.retailer}
              href={link.url}
              target="_blank"
              rel="noopener noreferrer sponsored"
              className="flex items-center justify-between gap-3 rounded-lg border border-border px-4 py-3 text-sm font-medium hover:bg-secondary transition-colors group"
            >
              <span className="flex items-center gap-2">
                <span
                  className="w-2 h-2 rounded-full shrink-0"
                  style={{
                    backgroundColor:
                      RETAILER_COLOURS[link.retailer] ??
                      "var(--vertical-accent)",
                  }}
                />
                {link.retailer}
              </span>
              <ExternalLink className="w-3.5 h-3.5 text-muted-foreground group-hover:text-foreground transition-colors" />
            </a>
          ))}
        </div>
        <p className="mt-3 text-[10px] text-muted-foreground">
          We may earn a small commission from purchases made through these
          links. This helps support TabletopWatch at no extra cost to you.
        </p>
      </CardContent>
    </Card>
  );
}
