import Link from "next/link";

const tabs = [
  { name: "Watch", href: "watch" },
  { name: "Deals", href: "deals" },
  { name: "Live", href: "live" },
];

export function Nav({ vertical, active }: { vertical: string; active: string }) {
  return (
    <nav className="border-b border-[var(--border)] bg-[var(--surface)]">
      <div className="max-w-7xl mx-auto px-4 flex items-center justify-between h-14">
        <Link href="/" className="font-bold text-lg tracking-tight">
          HobbyPulse
        </Link>

        <div className="flex items-center gap-1">
          {tabs.map((tab) => (
            <Link
              key={tab.href}
              href={`/${vertical}/${tab.href}`}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                active === tab.href
                  ? "bg-[var(--accent)] text-white"
                  : "text-[var(--muted)] hover:text-[var(--foreground)]"
              }`}
            >
              {tab.name}
            </Link>
          ))}
        </div>
      </div>
    </nav>
  );
}
