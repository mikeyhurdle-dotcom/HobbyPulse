import Link from "next/link";
import { getAllVerticals } from "@/lib/verticals";

const tabs = [
  { name: "Watch", href: "watch", icon: "▶" },
  { name: "Deals", href: "deals", icon: "£" },
  { name: "Live", href: "live", icon: "●" },
];

export function Nav({
  vertical,
  active,
}: {
  vertical: string;
  active: string;
}) {
  const allVerticals = getAllVerticals();
  const current = allVerticals.find((v) => v.slug === vertical);

  return (
    <nav className="sticky top-0 z-50 border-b border-[var(--border)] bg-[var(--background)]/80 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        {/* Top bar */}
        <div className="flex items-center justify-between h-14">
          <div className="flex items-center gap-4">
            <Link
              href="/"
              className="font-[family-name:var(--font-display)] font-bold text-lg tracking-tight hover:text-[var(--accent-light)] transition-colors"
            >
              HobbyPulse
            </Link>

            {/* Vertical switcher pills */}
            <div className="hidden sm:flex items-center gap-1 rounded-lg bg-[var(--surface)] p-1">
              {allVerticals.map((v) => (
                <Link
                  key={v.slug}
                  href={`/${v.slug}/${active || "watch"}`}
                  className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${
                    vertical === v.slug
                      ? "bg-[var(--vertical-accent)] text-white shadow-sm"
                      : "text-[var(--muted)] hover:text-[var(--foreground)]"
                  }`}
                >
                  {v.name}
                </Link>
              ))}
            </div>
          </div>

          {/* Current vertical name (mobile) + Tab navigation */}
          <div className="flex items-center gap-1">
            {tabs.map((tab) => (
              <Link
                key={tab.href}
                href={`/${vertical}/${tab.href}`}
                className={`relative px-3 sm:px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  active === tab.href
                    ? "bg-[var(--surface-raised)] text-[var(--foreground)]"
                    : "text-[var(--muted)] hover:text-[var(--foreground)] hover:bg-[var(--surface)]"
                }`}
              >
                <span className="sm:hidden text-xs mr-1">{tab.icon}</span>
                <span>{tab.name}</span>
                {active === tab.href && (
                  <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-6 h-0.5 rounded-full bg-[var(--vertical-accent)]" />
                )}
                {tab.href === "live" && (
                  <span className="ml-1.5 inline-block w-1.5 h-1.5 rounded-full bg-[var(--danger)] animate-pulse" />
                )}
              </Link>
            ))}
          </div>
        </div>

        {/* Mobile vertical switcher */}
        <div className="sm:hidden flex items-center gap-1 pb-2 -mt-1">
          {current && (
            <span className="text-xs text-[var(--vertical-accent-light)] font-medium mr-2">
              {current.name}
            </span>
          )}
          {allVerticals.map((v) => (
            <Link
              key={v.slug}
              href={`/${v.slug}/${active || "watch"}`}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
                vertical === v.slug
                  ? "bg-[var(--vertical-accent)] text-white"
                  : "bg-[var(--surface)] text-[var(--muted)]"
              }`}
            >
              {v.name}
            </Link>
          ))}
        </div>
      </div>
    </nav>
  );
}
