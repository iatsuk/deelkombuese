importScripts('./offline-assets.js');
const CACHE = self.KAMBUZ_CACHE_NAME;
const ASSETS = self.KAMBUZ_OFFLINE_ASSETS;
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE)
      .then((cache) => cache.addAll(ASSETS))
      .then(() => self.skipWaiting()),
  );
});
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key.startsWith('kombuese-') && key !== CACHE)
            .map((key) => caches.delete(key)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET' || new URL(event.request.url).origin !== self.location.origin)
    return;
  event.respondWith(
    (async () => {
      let response;
      try {
        response = await fetch(event.request);
      } catch {
        return (
          (await caches.match(event.request)) ||
          (event.request.mode === 'navigate'
            ? await caches.match('./index.html')
            : Response.error())
        );
      }
      if (response.ok) {
        try {
          const cache = await caches.open(CACHE);
          await cache.put(event.request, response.clone());
        } catch {
          /* Network response remains usable if storage is full. */
        }
      }
      return response;
    })(),
  );
});
