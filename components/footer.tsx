import Link from "next/link";
import { getSiteBrand } from "@/lib/site";

export function Footer() {
  const brand = getSiteBrand();

  return (
    <footer className="border-t border-[var(--border)] bg-[var(--surface)] mt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm text-[var(--muted)]">
            {brand.siteName} — {brand.tagline}
          </p>
          <div className="flex items-center gap-6 text-sm text-[var(--muted)]">
            <Link href="/about" className="hover:text-[var(--foreground)] transition-colors">
              About
            </Link>
            <Link href="/privacy" className="hover:text-[var(--foreground)] transition-colors">
              Privacy
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
