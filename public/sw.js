// Service worker OpenRss
// La version vient de l'URL d'enregistrement (/sw.js?v=x.y.z) : chaque release
// installe un nouveau SW et purge les anciens caches.
const VERSION = new URL(self.location.href).searchParams.get("v") || "dev";
const CACHE = `openrss-${VERSION}`;
const OFFLINE_URL = "/offline.html";
const PRECACHE = ["/", OFFLINE_URL, "/manifest.webmanifest", "/icons/icon-192.png"];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(PRECACHE)));
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((key) => key !== CACHE).map((key) => caches.delete(key)))
      )
      .then(() => self.clients.claim())
  );
});

// Déclenché par le toast "Nouvelle version disponible"
self.addEventListener("message", (event) => {
  if (event.data === "SKIP_WAITING") self.skipWaiting();
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Uniquement les GET same-origin ; les API ne sont jamais mises en cache
  if (request.method !== "GET" || url.origin !== self.location.origin) return;
  if (url.pathname.startsWith("/api/")) return;

  // Pages : réseau d'abord, puis cache, puis page hors ligne
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response.ok) {
            const copy = response.clone();
            caches.open(CACHE).then((cache) => cache.put(request, copy));
          }
          return response;
        })
        .catch(async () => (await caches.match(request)) || caches.match(OFFLINE_URL))
    );
    return;
  }

  // Assets statiques (JS/CSS/fonts hashés, icônes) : cache d'abord
  if (url.pathname.startsWith("/_next/static/") || url.pathname.startsWith("/icons/")) {
    event.respondWith(
      caches.match(request).then(
        (cached) =>
          cached ||
          fetch(request).then((response) => {
            if (response.ok) {
              const copy = response.clone();
              caches.open(CACHE).then((cache) => cache.put(request, copy));
            }
            return response;
          })
      )
    );
  }
});
