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
function appAddress(url) {
  const scope = new URL(self.registration.scope);
  const parts = url.pathname.slice(scope.pathname.length).split('/').filter(Boolean);
  if (!parts.length) return null;
  const language = ['en', 'de'].includes(parts[0]) ? parts.shift() : 'ru';
  const [section, id] = parts;
  const hash =
    section === 'generators'
      ? '#generators' + (id ? '/' + id : '')
      : section === 'products'
        ? '#pantry'
        : '#recipes';
  return new URL('./?lang=' + language + hash, scope).href;
}
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET' || new URL(event.request.url).origin !== self.location.origin)
    return;
  event.respondWith(
    (async () => {
      let response;
      try {
        response = await fetch(event.request);
      } catch {
        const cached = await caches.match(event.request);
        if (cached || event.request.mode !== 'navigate') return cached || Response.error();
        // A page never visited opens the app root offline, on the page's language and view.
        const address = appAddress(new URL(event.request.url));
        return address ? Response.redirect(address, 302) : caches.match('./index.html');
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
