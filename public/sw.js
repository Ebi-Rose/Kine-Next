// ── Kinē Service Worker ──
// Minimal SW: only caches static assets (icons, manifest).
// Page navigations always go to the network — no stale HTML.

const CACHE_NAME = "kine-v4";

const PRECACHE_URLS = [
  "/manifest.json",
  "/icon-192.png",
  "/icon-512.png",
  "/offline.html",
];

// Install: pre-cache static assets only
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE_URLS))
  );
  self.skipWaiting();
});

// Activate: delete ALL old caches
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Fetch: only intercept static assets, let everything else hit the network
self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);

  // Only handle static assets we pre-cached
  if (PRECACHE_URLS.includes(url.pathname)) {
    event.respondWith(
      caches.match(event.request).then((cached) => cached || fetch(event.request))
    );
    return;
  }

  // Pages: try network, fall back to offline page
  if (event.request.mode === "navigate") {
    event.respondWith(
      fetch(event.request).catch(() => caches.match("/offline.html"))
    );
    return;
  }

  // Everything else (API, JS chunks): straight to network, no caching
});
