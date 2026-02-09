const CACHE_NAME = "expense-app-cache-v1";

self.addEventListener("install", event => {
  console.log("Service Worker Installed");
  self.skipWaiting();
});

self.addEventListener("activate", event => {
  console.log("Service Worker Activated");
  event.waitUntil(clients.claim());
});

self.addEventListener("fetch", event => {
  // फिलहाल सिर्फ pass-through
  event.respondWith(fetch(event.request));
});
