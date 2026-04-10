import Link from "next/link";
import { getSiteBrand } from "@/lib/site";

export function Footer() {
  const brand = getSiteBrand();

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
            <Link href="/trending" className="hover:text-foreground transition-colors">
              Trending
            </Link>
            <Link href="/releases" className="hover:text-foreground transition-colors">
              Releases
            </Link>
            <Link href="/armies" className="hover:text-foreground transition-colors">
              Armies
            </Link>
            <Link href="/channels" className="hover:text-foreground transition-colors">
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
