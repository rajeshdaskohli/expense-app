const CACHE_NAME="expense-pro-v3";

const urls=[
"/",
"/index.html",
"/css/ui.css",
"/js/logic.js",
"/manifest.json"
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
