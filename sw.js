const CACHE="starpath-v5";
const ASSETS=["./","./index.html","./marvel.html","./styles.css","./app.js","./starwars-list.json","./marvel-list.json","./manifest.webmanifest"];
self.addEventListener("install",e=>e.waitUntil(caches.open(CACHE).then(c=>c.addAll(ASSETS)).then(()=>self.skipWaiting())));
self.addEventListener("activate",e=>e.waitUntil((async()=>{
  const names=await caches.keys();
  await Promise.all(names.filter(k=>k.startsWith("starpath-") && k!==CACHE).map(k=>caches.delete(k)));
  await self.clients.claim();
})()));
self.addEventListener("fetch",e=>{
  if(e.request.method!=="GET" || new URL(e.request.url).origin!==self.location.origin)return;
  e.respondWith(caches.match(e.request).then(c=>c||fetch(e.request)));
});
