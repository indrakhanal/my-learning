const CACHE = "learning-notes-v5";
const APP_SHELL = ["/", "/manifest.webmanifest", "/icon.svg"];

async function cacheResponse(request, response) {
  if (!response.ok || response.bodyUsed || response.type === "opaque") return response;

  try {
    const cache = await caches.open(CACHE);
    await cache.put(request, response.clone());
  } catch (error) {
    // A cache failure must never prevent a fresh page or asset from loading.
    console.warn("Could not cache response", error);
  }
  return response;
}

self.addEventListener("install", event => event.waitUntil(
  caches.open(CACHE).then(cache => cache.addAll(APP_SHELL)).then(() => self.skipWaiting())
));

self.addEventListener("activate", event => event.waitUntil(
  caches.keys().then(keys => Promise.all(keys.filter(key => key.startsWith("learning-notes-") && key !== CACHE).map(key => caches.delete(key)))).then(() => self.clients.claim())
));

self.addEventListener("fetch", event => {
  if (event.request.method !== "GET") return;
  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) return;

  // Content and Next.js server-rendered routes must refresh from the API-backed network response.
  if (event.request.mode === "navigate") {
    event.respondWith((async () => {
      try {
        return await cacheResponse(event.request, await fetch(event.request));
      } catch {
        return (await caches.match(event.request)) || (await caches.match("/")) || new Response("Offline", { status: 503 });
      }
    })());
    return;
  }

  // Versioned static assets remain available offline. Dynamic API requests are cross-origin and are never cached here.
  event.respondWith((async () => {
    const cached = await caches.match(event.request);
    if (cached) return cached;
    return cacheResponse(event.request, await fetch(event.request));
  })());
});
