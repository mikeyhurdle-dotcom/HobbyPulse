// ---------------------------------------------------------------------------
// Newsletter Signup Form — client component
// ---------------------------------------------------------------------------

"use client";

import { useState, type FormEvent } from "react";
import { Mail, CheckCircle2 } from "lucide-react";
import { track } from "@vercel/analytics";

interface NewsletterFormProps {
  vertical: string;
}

export function NewsletterForm({ vertical }: NewsletterFormProps) {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<
    "idle" | "loading" | "success" | "error" | "already-subscribed"
  >("idle");
  const [errorMsg, setErrorMsg] = useState("");

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setStatus("loading");
    setErrorMsg("");

    try {
      const res = await fetch("/api/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, vertical }),
      });

      if (res.status === 409) {
        setStatus("already-subscribed");
        track("newsletter_signup", { vertical, result: "already_subscribed" });
        return;
      }

      if (!res.ok) {
        const body = await res.json();
        throw new Error(body.error ?? "Something went wrong");
      }

      setStatus("success");
      track("newsletter_signup", { vertical, result: "success" });
    } catch (err) {
      setStatus("error");
      setErrorMsg(err instanceof Error ? err.message : "Something went wrong");
      track("newsletter_signup", { vertical, result: "error" });
    }
  }

  if (status === "success") {
    return (
      <div className="rounded-xl border border-[var(--success)]/30 bg-[var(--success)]/5 p-6 text-center">
        <CheckCircle2 className="w-8 h-8 text-[var(--success)] mx-auto mb-2" />
        <p className="text-sm font-medium text-[var(--success)]">
          You&apos;re in!
        </p>
        <p className="text-xs text-muted-foreground mt-1">
          We&apos;ll send you the best deals and content.
        </p>
      </div>
    );
  }

  if (status === "already-subscribed") {
    return (
      <div className="rounded-xl border border-[var(--vertical-accent)]/30 bg-[var(--vertical-accent)]/5 p-6 text-center">
        <Mail className="w-8 h-8 text-[var(--vertical-accent)] mx-auto mb-2" />
        <p className="text-sm font-medium">You&apos;re already subscribed!</p>
        <p className="text-xs text-muted-foreground mt-1">
          We&apos;ll keep sending you the good stuff.
        </p>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-xl border border-border bg-card p-4 sm:p-6 space-y-4"
    >
      <div className="flex items-center gap-3">
        <div
          className="flex items-center justify-center w-10 h-10 rounded-lg shrink-0"
          style={{ backgroundColor: "var(--vertical-accent)", opacity: 0.15 }}
        >
          <Mail className="w-5 h-5 text-[var(--vertical-accent)]" />
        </div>
        <div>
          <h3 className="text-sm font-bold">Stay in the loop</h3>
          <p className="text-xs text-muted-foreground">
            The best deals and content, straight to your inbox. No spam.
          </p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-[var(--vertical-accent)]"
        />
        <button
          type="submit"
          disabled={status === "loading"}
          className="rounded-lg bg-[var(--vertical-accent)] px-5 py-2 text-sm font-medium text-white hover:opacity-90 transition-opacity disabled:opacity-50 shrink-0"
        >
          {status === "loading" ? "Subscribing..." : "Subscribe"}
        </button>
      </div>

      {status === "error" && (
        <p className="text-xs text-destructive">{errorMsg}</p>
      )}
    </form>
  );
}
