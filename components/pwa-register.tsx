"use client";

import { useEffect, useState } from "react";
import { X, Download } from "lucide-react";

// The `beforeinstallprompt` event type isn't in the default DOM lib.
interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const DISMISSED_KEY = "pwa-install-dismissed";
const DISMISSED_DURATION_DAYS = 14;

/**
 * Registers the service worker and shows a one-time install prompt card
 * when the browser signals the site is installable. Dismissals are
 * remembered in localStorage so users aren't nagged.
 */
export function PWARegister() {
  const [installEvent, setInstallEvent] = useState<BeforeInstallPromptEvent | null>(null);
  const [visible, setVisible] = useState(false);

  // Register the service worker on mount
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!("serviceWorker" in navigator)) return;
    // Register after page load to avoid blocking initial render
    const register = () => {
      navigator.serviceWorker.register("/sw.js").catch(() => {
        // Registration failures are non-fatal — PWA still works, just not offline
      });
    };
    if (document.readyState === "complete") register();
    else window.addEventListener("load", register, { once: true });
  }, []);

  // Listen for beforeinstallprompt + show the card if not recently dismissed
  useEffect(() => {
    if (typeof window === "undefined") return;

    function handler(event: Event) {
      event.preventDefault();
      const dismissed = localStorage.getItem(DISMISSED_KEY);
      if (dismissed) {
        const age = Date.now() - parseInt(dismissed, 10);
        if (age < DISMISSED_DURATION_DAYS * 24 * 60 * 60 * 1000) return;
      }
      setInstallEvent(event as BeforeInstallPromptEvent);
      // Small delay so the card doesn't pop during first paint
      setTimeout(() => setVisible(true), 3000);
    }

    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  async function handleInstall() {
    if (!installEvent) return;
    await installEvent.prompt();
    await installEvent.userChoice;
    setInstallEvent(null);
    setVisible(false);
  }

  function handleDismiss() {
    localStorage.setItem(DISMISSED_KEY, String(Date.now()));
    setVisible(false);
  }

  if (!visible || !installEvent) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-4 sm:max-w-sm z-50 animate-in slide-in-from-bottom-4 fade-in duration-300">
      <div className="rounded-xl border border-border bg-card shadow-2xl p-4 flex items-start gap-3">
        <div
          className="flex items-center justify-center w-10 h-10 rounded-lg shrink-0"
          style={{ backgroundColor: "var(--vertical-accent)", opacity: 0.15 }}
        >
          <Download className="w-5 h-5 text-[var(--vertical-accent)]" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-bold">Install to your home screen</h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            Get price drop alerts, offline access, and one-tap deal browsing.
          </p>
          <div className="flex items-center gap-2 mt-3">
            <button
              type="button"
              onClick={handleInstall}
              className="inline-flex items-center gap-1.5 rounded-lg bg-[var(--vertical-accent)] px-3 py-1.5 text-xs font-semibold text-white hover:opacity-90 transition-opacity"
            >
              Install
            </button>
            <button
              type="button"
              onClick={handleDismiss}
              className="text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              Not now
            </button>
          </div>
        </div>
        <button
          type="button"
          onClick={handleDismiss}
          className="text-muted-foreground hover:text-foreground transition-colors shrink-0"
          aria-label="Dismiss install prompt"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
