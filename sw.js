const CACHE_NAME="3i-atlas-pro-v1";
const ASSETS=["./","./index.html","./css/styles.css","./js/app.js","./data/ephemeris.json","./manifest.json"];
self.addEventListener("install",e=>{
  e.waitUntil(caches.open(CACHE_NAME).then(c=>c.addAll(ASSETS)));
});
self.addEventListener("fetch",e=>{
  e.respondWith(caches.match(e.request).then(r=>r||fetch(e.request)));
});
