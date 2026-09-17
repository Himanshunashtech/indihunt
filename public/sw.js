const CACHE_NAME = "indihunt-pwa-v1";
const STATIC_ASSETS = [
  "/",
  "/favicon.png",
  "/manifest.json",
  "/logo.png"
];

// Service Worker Install
self.addEventListener("install", (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS).catch((err) => {
        console.warn("[SW] Cache addAll warning:", err);
      });
    })
  );
});

// Service Worker Activate
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      );
    }).then(() => self.clients.claim())
  );
});

// Service Worker Fetch
self.addEventListener("fetch", (event) => {
  const request = event.request;

  // Bypass non-GET and chrome extension / API / Next.js static asset calls
  if (
    request.method !== "GET" ||
    !request.url.startsWith("http") ||
    request.url.includes("/api/") ||
    request.url.includes("/_next/")
  ) {
    return;
  }

  // Network first with cache fallback strategy
  event.respondWith(
    fetch(request)
      .then((networkResponse) => {
        if (
          networkResponse &&
          networkResponse.status === 200 &&
          networkResponse.type === "basic"
        ) {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, responseToCache);
          });
        }
        return networkResponse;
      })
      .catch(async () => {
        const cachedResponse = await caches.match(request);
        if (cachedResponse) {
          return cachedResponse;
        }
        if (request.mode === "navigate") {
          return caches.match("/");
        }
        return new Response("Offline", { status: 503, statusText: "Service Unavailable" });
      })
  );
});
