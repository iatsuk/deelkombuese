const CACHE = 'kombuese-v7-1';
const ASSETS = ['./','./index.html','./favicon.svg','./manifest.webmanifest','./src/app.js','./src/cooking-visuals.js','./src/visuals.css','./src/legal.css','./assets/galley.png','./impressum/','./datenschutz/','./src/planner.js','./src/v3.css','./src/model.js','./src/data.js','./src/recipe-library.js','./src/dish-generator.js','./src/cooking-guide.js','./src/preferences.js','./src/recipe-export.js','./src/styles.css','./src/fonts.css','./fonts/golos-text-cyrillic.woff2','./fonts/golos-text-latin.woff2','./fonts/golos-text-latin-ext.woff2','./fonts/literata-cyrillic.woff2','./fonts/literata-latin.woff2','./fonts/literata-latin-ext.woff2'];
self.addEventListener('install',event=>{event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(ASSETS)).then(()=>self.skipWaiting()));});
self.addEventListener('activate',event=>{event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(key=>key.startsWith('kombuese-')&&key!==CACHE).map(key=>caches.delete(key)))).then(()=>self.clients.claim()));});
self.addEventListener('fetch',event=>{
  if(event.request.method!=='GET'||new URL(event.request.url).origin!==self.location.origin)return;
  event.respondWith((async()=>{
    let response;
    try { response=await fetch(event.request); }
    catch { return (await caches.match(event.request))||(event.request.mode==='navigate'?await caches.match('./index.html'):Response.error()); }
    if(response.ok){try{const cache=await caches.open(CACHE);await cache.put(event.request,response.clone());}catch{ /* Network response remains usable if storage is full. */ }}
    return response;
  })());
});
