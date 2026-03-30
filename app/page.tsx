import Link from "next/link";

const verticals = [
  {
    slug: "warhammer",
    name: "Warhammer 40K",
    description: "Battle reports, army lists, and second-hand deals",
    emoji: "⚔️",
  },
  {
    slug: "simracing",
    name: "Sim Racing",
    description: "Race replays, setup guides, wheels and rigs",
    emoji: "🏎️",
    comingSoon: true,
  },
];

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-8">
      <h1 className="text-4xl font-bold tracking-tight mb-2">HobbyPulse</h1>
      <p className="text-[var(--muted)] mb-12 text-center max-w-md">
        Watch, compare, and save on your hobby.
      </p>

      <div className="grid gap-4 w-full max-w-lg">
        {verticals.map((v) => (
          <Link
            key={v.slug}
            href={v.comingSoon ? "#" : `/${v.slug}/watch`}
            className={`block p-6 rounded-xl border border-[var(--border)] bg-[var(--surface)] hover:bg-[var(--surface-light)] transition-colors ${
              v.comingSoon ? "opacity-50 cursor-not-allowed" : ""
            }`}
          >
            <div className="flex items-center gap-3">
              <span className="text-2xl">{v.emoji}</span>
              <div>
                <h2 className="text-lg font-semibold">
                  {v.name}
                  {v.comingSoon && (
                    <span className="ml-2 text-xs text-[var(--muted)] font-normal">
                      Coming Soon
                    </span>
                  )}
                </h2>
                <p className="text-sm text-[var(--muted)]">{v.description}</p>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </main>
  );
}
