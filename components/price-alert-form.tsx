// ---------------------------------------------------------------------------
// Price Alert Form — client component
// ---------------------------------------------------------------------------

"use client";

import { useState, type FormEvent } from "react";
import { track } from "@vercel/analytics";

interface PriceAlertFormProps {
  productId: string;
  productName: string;
  currentBestPrice: number;
}

export function PriceAlertForm({
  productId,
  productName,
  currentBestPrice,
}: PriceAlertFormProps) {
  const [email, setEmail] = useState("");
  const [targetPrice, setTargetPrice] = useState(
    Math.floor(currentBestPrice * 0.9) / 100, // default: 10% below current best
  );
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setStatus("loading");
    setErrorMsg("");

    try {
      const res = await fetch("/api/price-alert", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          productId,
          targetPricePence: Math.round(targetPrice * 100),
        }),
      });

      if (!res.ok) {
        const body = await res.json();
        throw new Error(body.error ?? "Something went wrong");
      }

      setStatus("success");
      track("price_alert_created", {
        product_id: productId,
        target_pence: Math.round(targetPrice * 100),
        current_best_pence: currentBestPrice,
      });
    } catch (err) {
      setStatus("error");
      setErrorMsg(err instanceof Error ? err.message : "Something went wrong");
    }
  }

  if (status === "success") {
    return (
      <div className="rounded-xl border border-[var(--success)]/30 bg-[var(--success)]/5 p-4 text-center">
        <p className="text-sm font-medium text-[var(--success)]">
          Price alert set!
        </p>
        <p className="text-xs text-[var(--muted)] mt-1">
          We will email you when {productName} drops below{" "}
          {"\u00A3"}
          {targetPrice.toFixed(2)}.
        </p>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4 space-y-3"
    >
      <h3 className="text-sm font-bold">Set a Price Alert</h3>
      <p className="text-xs text-[var(--muted)]">
        Get emailed when this product drops below your target price.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-[1fr_120px] gap-3">
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          className="rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm text-[var(--foreground)] placeholder:text-[var(--muted)] focus:outline-none focus:ring-2 focus:ring-[var(--vertical-accent)]"
        />
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-[var(--muted)]">
            {"\u00A3"}
          </span>
          <input
            type="number"
            required
            min="0.01"
            step="0.01"
            value={targetPrice}
            onChange={(e) => setTargetPrice(parseFloat(e.target.value) || 0)}
            className="w-full rounded-lg border border-[var(--border)] bg-[var(--background)] pl-7 pr-3 py-2 text-sm text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--vertical-accent)]"
          />
        </div>
      </div>

      {status === "error" && (
        <p className="text-xs text-[var(--danger)]">{errorMsg}</p>
      )}

      <button
        type="submit"
        disabled={status === "loading"}
        className="w-full rounded-lg bg-[var(--vertical-accent)] px-4 py-2 text-sm font-medium text-white hover:opacity-90 transition-opacity disabled:opacity-50"
      >
        {status === "loading" ? "Setting alert..." : "Set Alert"}
      </button>
    </form>
  );
}
