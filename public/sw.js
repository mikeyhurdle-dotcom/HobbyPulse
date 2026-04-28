// ---------------------------------------------------------------------------
// HobbyPulse service worker — minimal offline shell
// ---------------------------------------------------------------------------
// Strategy:
//  - Stale-while-revalidate for navigations (fast repeat visits, fresh content)
//  - Cache-first for static assets (_next/static, fonts, SVGs)
//  - Network-only for API calls (never cache data)
// This is intentionally tiny — no complex precache, no background sync. The
// goal is installability + a decent offline page, not a full offline app.
// ---------------------------------------------------------------------------

const CACHE_VERSION = "hobbypulse-v2-rebrand-2026-04";
const RUNTIME_CACHE = `${CACHE_VERSION}-runtime`;

self.addEventListener("install", (event) => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(
        keys
          .filter((k) => !k.startsWith(CACHE_VERSION))
          .map((k) => caches.delete(k)),
      );
      await self.clients.claim();
    })(),
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;

  // Only handle GETs on the same origin
  if (request.method !== "GET") return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  // Never cache API or cron routes
  if (url.pathname.startsWith("/api/")) return;

  // Static assets — cache-first
  if (
    url.pathname.startsWith("/_next/static/") ||
    url.pathname.startsWith("/fonts/") ||
    url.pathname.endsWith(".svg") ||
    url.pathname.endsWith(".woff2")
  ) {
    event.respondWith(cacheFirst(request));
    return;
  }

  // Navigations — stale-while-revalidate so repeat visits are instant but
  // content updates in the background.
  if (request.mode === "navigate") {
    event.respondWith(staleWhileRevalidate(request));
    return;
  }
});

async function cacheFirst(request) {
  const cache = await caches.open(RUNTIME_CACHE);
  const cached = await cache.match(request);
  if (cached) return cached;
  try {
    const fresh = await fetch(request);
    if (fresh && fresh.status === 200) cache.put(request, fresh.clone());
    return fresh;
  } catch (err) {
    if (cached) return cached;
    throw err;
  }
}

async function staleWhileRevalidate(request) {
  const cache = await caches.open(RUNTIME_CACHE);
  const cached = await cache.match(request);
  const fetchPromise = fetch(request)
    .then((response) => {
      if (response && response.status === 200) {
        cache.put(request, response.clone());
      }
      return response;
    })
    .catch(() => cached);
  return cached || fetchPromise;
}
