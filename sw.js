const CACHE_NAME = "taaloola-v2";
const ASSETS_TO_CACHE = [
  "./",
  "./index.html",
  "./admin.html",
  "./firebase-config.js",
  "./manifest.json"
];

// Install Event - Pre-cache Shell Assets
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
  self.skipWaiting();
});

// Activate Event - Clean up Old Caches
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch Event - Stale-While-Revalidate Strategy for dynamic assets
self.addEventListener("fetch", (event) => {
  // Only cache GET requests
  if (event.request.method !== "GET") return;

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      const fetchPromise = fetch(event.request).then((networkResponse) => {
        // Cache successful and same-origin or image requests
        if (
          networkResponse.status === 200 &&
          (event.request.url.startsWith(self.location.origin) ||
            event.request.destination === "image" ||
            event.request.url.includes("unpkg.com") ||
            event.request.url.includes("googleapis.com") ||
            event.request.url.includes("gstatic.com"))
        ) {
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, networkResponse.clone());
          });
        }
        return networkResponse;
      }).catch(() => {
        // Fallback for offline mode if asset is not in cache
        return cachedResponse;
      });

      return cachedResponse || fetchPromise;
    })
  );
});
