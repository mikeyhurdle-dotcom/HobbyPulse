import Link from "next/link";

const verticals = [
  {
    slug: "warhammer",
    name: "Warhammer 40K",
    description: "Battle reports, army lists, and second-hand deals",
    tag: "Live",
  },
  {
    slug: "simracing",
    name: "Sim Racing",
    description: "Race replays, setup guides, wheels and rigs",
    comingSoon: true,
  },
];

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-6 sm:p-8">
      <div className="mb-12 text-center">
        <h1 className="font-[family-name:var(--font-display)] text-5xl sm:text-6xl font-bold tracking-tight mb-3">
          Hobby<span className="text-[var(--accent)]">Pulse</span>
        </h1>
        <p className="text-[var(--muted)] text-lg max-w-md mx-auto">
          Watch, compare, and save on your hobby.
        </p>
      </div>

      <div className="grid gap-4 w-full max-w-lg">
        {verticals.map((v) => (
          <Link
            key={v.slug}
            href={v.comingSoon ? "#" : `/${v.slug}/watch`}
            className={`group block p-6 rounded-2xl border border-[var(--border)] bg-[var(--surface)] transition-all ${
              v.comingSoon
                ? "opacity-40 cursor-not-allowed"
                : "hover:bg-[var(--surface-hover)] hover:border-[var(--border-light)] hover:shadow-lg hover:shadow-[var(--accent-glow)]"
            }`}
          >
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-[family-name:var(--font-display)] text-xl font-bold tracking-tight">
                  {v.name}
                </h2>
                <p className="text-sm text-[var(--muted)] mt-1">
                  {v.description}
                </p>
              </div>
              <div className="flex flex-col items-end gap-2">
                {v.tag && (
                  <span className="px-2.5 py-0.5 rounded-full bg-[var(--accent)]/10 text-[var(--accent-light)] text-xs font-medium">
                    {v.tag}
                  </span>
                )}
                {v.comingSoon && (
                  <span className="px-2.5 py-0.5 rounded-full bg-[var(--surface-raised)] text-[var(--muted)] text-xs font-medium">
                    Coming Soon
                  </span>
                )}
                {!v.comingSoon && (
                  <span className="text-[var(--muted)] group-hover:text-[var(--foreground)] group-hover:translate-x-1 transition-all text-lg">
                    &rarr;
                  </span>
                )}
              </div>
            </div>
          </Link>
        ))}
      </div>

      <p className="mt-16 text-xs text-[var(--muted)]">
        Built for hobbyists, by hobbyists.
      </p>
    </main>
  );
}
