import Link from "next/link";
import { getSiteBrand, getSiteVertical } from "@/lib/site";

export function Footer() {
  const brand = getSiteBrand();
  const vertical = getSiteVertical();
  const mp = vertical.slug === "tabletop" ? "/miniatures" : "";

  return (
    <footer className="border-t border-border bg-secondary/50 mt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm text-muted-foreground">
            {brand.siteName} — {brand.tagline}
          </p>
          <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-muted-foreground">
            <Link href="/about" className="hover:text-foreground transition-colors">
              About
            </Link>
            <Link href="/faq" className="hover:text-foreground transition-colors">
              FAQ
            </Link>
            <Link href="/contact" className="hover:text-foreground transition-colors">
              Contact
            </Link>
            <Link href={`${mp}/trending`} className="hover:text-foreground transition-colors">
              Trending
            </Link>
            {vertical.slug === "tabletop" && (
              <>
                <Link href="/boardgames" className="hover:text-foreground transition-colors">
                  Board Games
                </Link>
                <Link href="/miniatures/watch" className="hover:text-foreground transition-colors">
                  Miniatures
                </Link>
              </>
            )}
            <Link href={`${mp}/channels`} className="hover:text-foreground transition-colors">
              Channels
            </Link>
            <Link href="/privacy" className="hover:text-foreground transition-colors">
              Privacy
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
