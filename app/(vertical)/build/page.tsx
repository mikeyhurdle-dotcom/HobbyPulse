// ---------------------------------------------------------------------------
// Build My Army Cheap — /build
// ---------------------------------------------------------------------------
// Paste an army list, find the cheapest way to buy every unit.
// ---------------------------------------------------------------------------

"use client";

import { Suspense, useState, useEffect, type FormEvent } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Nav } from "@/components/nav";

interface MatchedUnit {
  name: string;
  qty: number;
  points: number;
  bestPrice: number | null;
  rrpPence: number | null;
  source: string | null;
  buyUrl: string | null;
  productSlug: string | null;
}

interface BuildResult {
  faction: string;
  detachment: string;
  totalPoints: number;
  units: MatchedUnit[];
  totalCost: number;
  totalRrp: number;
  totalSavings: number;
  savingsPercent: number;
}

function formatPrice(pence: number): string {
  return `\u00A3${(pence / 100).toFixed(2)}`;
}

const PLACEHOLDER_LIST = `++ Army Roster (2000 Points) ++

++ Character ++
Captain in Terminator Armour [105 pts]

++ Battleline ++
5x Intercessors [90 pts]
5x Assault Intercessors [90 pts]

++ Infantry ++
5x Terminators [200 pts]
3x Bladeguard Veterans [100 pts]
3x Eradicators [95 pts]

++ Vehicle ++
Redemptor Dreadnought [210 pts]

++ Total: 890 pts ++`;

export default function BuildPage() {
  return (
    <Suspense fallback={
      <>
        <Nav active="build" />
        <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
          <h1 className="text-3xl font-bold tracking-tight mb-2">Build My Army Cheap</h1>
          <p className="text-[var(--muted)]">Loading...</p>
        </main>
      </>
    }>
      <BuildPageInner />
    </Suspense>
  );
}

function BuildPageInner() {
  const searchParams = useSearchParams();
  const [listText, setListText] = useState("");
  const [result, setResult] = useState<BuildResult | null>(null);
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  // Pre-fill from query param (used by "Buy This Army" button)
  useEffect(() => {
    const prefilledList = searchParams.get("list");
    if (prefilledList) {
      setListText(prefilledList);
    }
  }, [searchParams]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setStatus("loading");
    setErrorMsg("");
    setResult(null);

    try {
      const res = await fetch("/api/build", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ listText }),
      });

      const body = await res.json();
      if (!res.ok) throw new Error(body.error ?? "Something went wrong");

      setResult(body as BuildResult);
      setStatus("idle");
    } catch (err) {
      setStatus("error");
      setErrorMsg(err instanceof Error ? err.message : "Something went wrong");
    }
  }

  function copyShoppingList() {
    if (!result) return;
    const lines = result.units
      .filter((u) => u.bestPrice !== null)
      .map(
        (u) =>
          `${u.qty}x ${u.name} — ${formatPrice(u.bestPrice!)} (${u.source})${u.buyUrl ? `\n   ${u.buyUrl}` : ""}`,
      );
    const summary = `\nTotal: ${formatPrice(result.totalCost)}${result.totalSavings > 0 ? ` (save ${formatPrice(result.totalSavings)} / ${result.savingsPercent}% off RRP)` : ""}`;
    navigator.clipboard.writeText(lines.join("\n") + "\n" + summary);
  }

  return (
    <>
      <Nav active="build" />
      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        <h1 className="text-3xl font-bold tracking-tight mb-2">
          Build My Army Cheap
        </h1>
        <p className="text-[var(--muted)] mb-8">
          Paste your army list below and we will find the cheapest way to buy
          every unit across all our tracked retailers.
        </p>

        {/* Input form */}
        <form onSubmit={handleSubmit} className="space-y-4 mb-10">
          <textarea
            value={listText}
            onChange={(e) => setListText(e.target.value)}
            placeholder={PLACEHOLDER_LIST}
            rows={14}
            className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3 text-sm font-[family-name:var(--font-mono)] text-[var(--foreground)] placeholder:text-[var(--muted)]/50 focus:outline-none focus:ring-2 focus:ring-[var(--vertical-accent)] focus:border-transparent resize-y"
          />

          {status === "error" && (
            <p className="text-sm text-[var(--danger)]">{errorMsg}</p>
          )}

          <button
            type="submit"
            disabled={status === "loading" || listText.trim().length < 10}
            className="rounded-lg bg-[var(--vertical-accent)] px-6 py-2.5 text-sm font-medium text-white hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {status === "loading" ? "Parsing & searching..." : "Find Best Prices"}
          </button>
        </form>

        {/* Results */}
        {result && (
          <div className="space-y-6">
            {/* Empty-state banner when nothing in our catalogue matches.
                Prevents the table from rendering as a wall of "Not found"
                and explains the common cause (game system not tracked yet,
                e.g. Age of Sigmar, which the deals cron doesn't scrape). */}
            {result.units.length > 0 &&
              result.units.every((u) => u.bestPrice === null) && (
                <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4 text-sm">
                  <p className="font-medium">
                    No matches in our catalogue yet.
                  </p>
                  <p className="text-[var(--muted)] mt-1">
                    We parsed your list ({result.units.length} units) but
                    none of these products are in our deals database right
                    now. This is usually because we don&apos;t track this
                    game system in our deals pipeline yet (for example Age
                    of Sigmar is still being added).
                  </p>
                </div>
              )}

            {/* Header */}
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div>
                <h2 className="text-xl font-bold tracking-tight">
                  {result.faction}
                  {result.detachment ? ` — ${result.detachment}` : ""}
                </h2>
                <p className="text-sm text-[var(--muted)]">
                  {result.totalPoints} pts - {result.units.length} units
                </p>
              </div>
              <button
                onClick={copyShoppingList}
                className="rounded-lg border border-[var(--border)] bg-[var(--surface)] px-4 py-2 text-sm font-medium hover:bg-[var(--surface-hover)] transition-colors"
              >
                Copy Shopping List
              </button>
            </div>

            {/* Unit table */}
            <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] overflow-hidden">
              {/* Header */}
              <div className="hidden sm:grid grid-cols-[1fr_60px_100px_100px_100px_100px] gap-3 px-4 py-3 border-b border-[var(--border)] text-xs font-medium text-[var(--muted)] uppercase tracking-wider">
                <span>Unit</span>
                <span>Qty</span>
                <span>Best Price</span>
                <span>RRP</span>
                <span>Source</span>
                <span></span>
              </div>

              {result.units.map((unit, i) => {
                const savings =
                  unit.rrpPence && unit.bestPrice
                    ? unit.rrpPence - unit.bestPrice
                    : 0;

                return (
                  <div
                    key={i}
                    className="grid grid-cols-1 sm:grid-cols-[1fr_60px_100px_100px_100px_100px] gap-2 sm:gap-3 px-4 py-3 items-center border-b border-[var(--border)] last:border-b-0"
                  >
                    {/* Name */}
                    <div>
                      <span className="text-sm font-medium">{unit.name}</span>
                      {unit.points > 0 && (
                        <span className="text-xs text-[var(--muted)] ml-2">
                          {unit.points} pts
                        </span>
                      )}
                    </div>

                    {/* Qty */}
                    <span className="text-sm font-[family-name:var(--font-mono)]">
                      {unit.qty}
                    </span>

                    {/* Best price */}
                    <span className="text-sm font-bold text-[var(--success)]">
                      {unit.bestPrice !== null ? formatPrice(unit.bestPrice) : (
                        <span className="text-[var(--muted)] font-normal">
                          Not found
                        </span>
                      )}
                    </span>

                    {/* RRP */}
                    <span className="text-sm text-[var(--muted)]">
                      {unit.rrpPence ? (
                        <>
                          <span className="line-through">
                            {formatPrice(unit.rrpPence)}
                          </span>
                          {savings > 0 && (
                            <span className="text-[var(--success)] ml-1 text-xs">
                              -{Math.round((savings / unit.rrpPence) * 100)}%
                            </span>
                          )}
                        </>
                      ) : (
                        "--"
                      )}
                    </span>

                    {/* Source */}
                    <span className="text-xs text-[var(--muted)]">
                      {unit.source ?? "--"}
                    </span>

                    {/* Buy link */}
                    {unit.buyUrl ? (
                      <a
                        href={unit.buyUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center justify-center rounded-lg bg-[var(--success)] px-3 py-1.5 text-xs font-medium text-white hover:opacity-90 transition-opacity"
                      >
                        Buy
                      </a>
                    ) : unit.productSlug ? (
                      <Link
                        href={`/deals?q=${encodeURIComponent(unit.name)}`}
                        className="inline-flex items-center justify-center rounded-lg border border-[var(--border)] px-3 py-1.5 text-xs font-medium hover:bg-[var(--surface-hover)] transition-colors"
                      >
                        Search
                      </Link>
                    ) : (
                      <Link
                        href={`/deals?q=${encodeURIComponent(unit.name)}`}
                        className="inline-flex items-center justify-center rounded-lg border border-[var(--border)] px-3 py-1.5 text-xs font-medium hover:bg-[var(--surface-hover)] transition-colors"
                      >
                        Search
                      </Link>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Shopping cart summary */}
            <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-raised)] p-6">
              <h3 className="text-lg font-bold mb-4">Shopping Cart Summary</h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
                <div>
                  <p className="text-2xl font-bold text-[var(--success)]">
                    {formatPrice(result.totalCost)}
                  </p>
                  <p className="text-xs text-[var(--muted)] mt-1">Total Cost</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-[var(--muted)]">
                    {result.totalRrp > 0 ? formatPrice(result.totalRrp) : "--"}
                  </p>
                  <p className="text-xs text-[var(--muted)] mt-1">Total RRP</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-[var(--success)]">
                    {result.totalSavings > 0
                      ? formatPrice(result.totalSavings)
                      : "--"}
                  </p>
                  <p className="text-xs text-[var(--muted)] mt-1">
                    Total Savings
                  </p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-[var(--success)]">
                    {result.savingsPercent > 0
                      ? `${result.savingsPercent}%`
                      : "--"}
                  </p>
                  <p className="text-xs text-[var(--muted)] mt-1">Off RRP</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </>
  );
}
