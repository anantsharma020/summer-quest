// Service worker: network-first so updates arrive automatically on the next
// launch (no reinstall needed); falls back to cache when offline.
const CACHE = 'summer-quest-v6';
const ASSETS = [
  './', './index.html', './styles.css', './manifest.webmanifest',
  './icon.svg', './icon-maskable.svg',
  './js/main.js', './js/ui.js', './js/ui-svg.js', './js/state.js',
  './js/engine.js', './js/db.js', './js/data.js', './js/howto.js', './js/media.js',
];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});

// Network-first: always try the network (so the user gets the latest deploy),
// update the cache on success, and fall back to cache (then the app shell)
// when offline.
self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;
  if (new URL(e.request.url).origin !== self.location.origin) return;
  e.respondWith(
    fetch(e.request).then(res => {
      const copy = res.clone();
      caches.open(CACHE).then(c => c.put(e.request, copy)).catch(() => {});
      return res;
    }).catch(() => caches.match(e.request).then(c => c || caches.match('./index.html')))
  );
});
