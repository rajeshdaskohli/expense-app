self.addEventListener("install", () => {
  console.log("SW Installed");
});

self.addEventListener("activate", () => {
  console.log("SW Activated");
});

self.addEventListener("fetch", (event) => {
  event.respondWith(fetch(event.request));
});
