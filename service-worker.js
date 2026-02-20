let CACHE_NAME="expense-pro";

async function getCacheName(){
  try{
    const res=await fetch("/manifest.json");
    const m=await res.json();
    CACHE_NAME="expense-pro-"+m.version;
  }catch(e){
    CACHE_NAME="expense-pro-fallback";
  }
}

const urls=[
"/",
"/index.html",
"/css/ui.css",
"/js/logic.js",
"/manifest.json",
"/icons/icon-192.png",
"/icons/icon-512.png"
];

self.addEventListener("install",e=>{
  e.waitUntil(
    getCacheName().then(()=>{
      return caches.open(CACHE_NAME).then(cache=>cache.addAll(urls));
    })
  );
  self.skipWaiting();
});

self.addEventListener("activate",e=>{
  e.waitUntil(
    getCacheName().then(()=>{
      return caches.keys().then(keys=>{
        return Promise.all(
          keys.filter(k=>k!==CACHE_NAME).map(k=>caches.delete(k))
        );
      });
    })
  );
  self.clients.claim();
});

self.addEventListener("fetch",e=>{
  e.respondWith(
    caches.match(e.request).then(res=>res||fetch(e.request))
  );
});
