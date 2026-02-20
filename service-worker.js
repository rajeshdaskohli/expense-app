const CACHE_NAME="expense-pro-v4";

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
caches.open(CACHE_NAME).then(cache=>cache.addAll(urls))
);
});

self.addEventListener("fetch",e=>{
e.respondWith(
caches.match(e.request).then(res=>res||fetch(e.request))
);
});
