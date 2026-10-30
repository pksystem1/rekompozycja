/* Service worker: działanie offline (strategia: z pamięci podręcznej, a w tle aktualizacja). */
const CACHE="trening-v4";
const ASSETS=["./","./index.html","./styles.css","./plan.js","./cwiczenia.js","./app.js","./manifest.webmanifest","./icons/icon-192.png","./icons/icon-512.png","./icons/icon-maskable-512.png","./icons/apple-touch-icon.png"];
self.addEventListener("install",e=>{
  e.waitUntil(caches.open(CACHE).then(c=>c.addAll(ASSETS)).then(()=>self.skipWaiting()));
});
self.addEventListener("activate",e=>{
  e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));
});
self.addEventListener("fetch",e=>{
  const r=e.request;
  if(r.method!=="GET"||new URL(r.url).origin!==location.origin)return;
  e.respondWith(caches.open(CACHE).then(cache=>cache.match(r,{ignoreSearch:true}).then(hit=>{
    const net=fetch(r).then(res=>{if(res&&res.ok)cache.put(r,res.clone());return res}).catch(()=>hit||cache.match("./index.html"));
    return hit||net;
  })));
});
