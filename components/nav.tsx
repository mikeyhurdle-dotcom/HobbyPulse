import Link from "next/link";
import { getSiteBrand } from "@/lib/site";

const tabs = [
  { name: "Watch", href: "/watch", key: "watch", icon: "\u25B6" },
  { name: "Deals", href: "/deals", key: "deals", icon: "\u00A3" },
  { name: "Build", href: "/build", key: "build", icon: "\u00A3" },
  { name: "Live", href: "/live", key: "live", icon: "\u25CF" },
];

export function Nav({ active }: { active: string }) {
  const brand = getSiteBrand();

  return (
    <nav className="sticky top-0 z-50 border-b border-[var(--border)] bg-[var(--background)]/80 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-14">
          <Link
            href="/"
            className="font-[family-name:var(--font-display)] font-bold text-lg tracking-tight hover:text-[var(--accent-light)] transition-colors"
          >
            {brand.siteName}
          </Link>

          {/* Tab navigation */}
          <div className="flex items-center gap-1">
            {tabs.map((tab) => (
              <Link
                key={tab.key}
                href={tab.href}
                className={`relative px-3 sm:px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  active === tab.key
                    ? "bg-[var(--surface-raised)] text-[var(--foreground)]"
                    : "text-[var(--muted)] hover:text-[var(--foreground)] hover:bg-[var(--surface)]"
                }`}
              >
                <span className="sm:hidden text-xs mr-1">{tab.icon}</span>
                <span>{tab.name}</span>
                {active === tab.key && (
                  <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-6 h-0.5 rounded-full bg-[var(--vertical-accent)]" />
                )}
                {tab.key === "live" && (
                  <span className="ml-1.5 inline-block w-1.5 h-1.5 rounded-full bg-[var(--danger)] animate-pulse" />
                )}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </nav>
  );
}
