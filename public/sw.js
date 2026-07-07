// Service Worker — Glass Phone SBS
// Cache de assets estáticos para funcionamento offline básico

const CACHE_NAME = "glassphone-v1";
const STATIC_ASSETS = [
  "/",
  "/glassphone-logo.png",
  "/glassphone-logo-dark.png",
  "/hero1.jpg",
  "/hero2.jpg",
  "/hero3.jpg",
  "/manifest.json",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  // Apenas GET, não interceptar API calls
  if (event.request.method !== "GET") return;
  const url = new URL(event.request.url);
  if (url.origin !== location.origin) return;
  if (url.pathname.startsWith("/api") || url.pathname.startsWith("/__")) return;

  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;
      return fetch(event.request).then((response) => {
        // Cachear apenas assets estáticos (imagens, fontes, etc.)
        if (
          response.ok &&
          (event.request.destination === "image" ||
            event.request.destination === "font" ||
            event.request.destination === "style")
        ) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
        }
        return response;
      }).catch(() => {
        // Offline fallback para navegação
        if (event.request.destination === "document") {
          return caches.match("/") as Promise<Response>;
        }
        return new Response("Offline", { status: 503 });
      });
    })
  );
});
