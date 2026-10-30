const CACHE = "fluide-v23";
const ASSETS = [
  "./",
  "./index.html",
  "./manifest.webmanifest",
  "./css/app.css",
  "./js/app.js",
  "./js/store.js",
  "./js/exercices.js",
  "./js/ui.js",
  "./js/views/today.js",
  "./js/views/templates.js",
  "./js/views/workout.js",
  "./js/views/progress.js",
  "./js/views/profile.js",
  "./icons/icon-192.png",
  "./icons/icon-512.png",
  "./icons/icon-maskable-512.png",
  "./icons/apple-touch-icon.png"
];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS.map(u => new Request(u, { cache: "reload" })))).then(() => self.skipWaiting()));
});

self.addEventListener("activate", e => {
  e.waitUntil(
    caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

// Réseau d'abord (pour les mises à jour), cache si hors ligne. La police Inter est mise en cache au passage.
self.addEventListener("fetch", e => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  const font = url.host === "fonts.googleapis.com" || url.host === "fonts.gstatic.com";
  if (url.origin !== self.location.origin && !font) return;
  e.respondWith(
    // « no-cache » : on revalide auprès du serveur au lieu de servir le cache HTTP (GitHub Pages garde 10 min).
    fetch(req, font ? undefined : { cache: "no-cache" }).then(res => {
      const copy = res.clone();
      caches.open(CACHE).then(c => c.put(req, copy));
      return res;
    }).catch(() => caches.match(req, { ignoreSearch: true }).then(r => r || caches.match("./index.html")))
  );
});
