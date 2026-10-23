const CACHE="starpath-v6";
const ASSETS=["./","./index.html","./marvel.html","./styles.css","./app.js","./starwars-list.json","./marvel-list.json","./manifest.webmanifest"];
self.addEventListener("install",e=>e.waitUntil(caches.open(CACHE).then(c=>c.addAll(ASSETS)).then(()=>self.skipWaiting())));
self.addEventListener("activate",e=>e.waitUntil((async()=>{
  const names=await caches.keys();
  await Promise.all(names.filter(k=>k.startsWith("starpath-") && k!==CACHE).map(k=>caches.delete(k)));
  await self.clients.claim();
})()));
self.addEventListener("fetch",e=>{
  if(e.request.method!=="GET" || new URL(e.request.url).origin!==self.location.origin)return;
  // Network first: new catalog entries appear on the next visit; cached files
  // remain available offline. Never delete the user's browser progress.
  e.respondWith(fetch(e.request).then(response=>{
    if(response.ok){
      const copy=response.clone();
      e.waitUntil(caches.open(CACHE).then(cache=>cache.put(e.request,copy)));
    }
    return response;
  }).catch(()=>caches.match(e.request)));
});
