// Service worker: cache the app shell for offline use.
const CACHE = 'summer-quest-v2';
const ASSETS = [
  './', './index.html', './styles.css', './manifest.webmanifest',
  './icon.svg', './icon-maskable.svg',
  './js/main.js', './js/ui.js', './js/ui-svg.js', './js/state.js',
  './js/engine.js', './js/db.js', './js/data.js',
];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});

self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;
  e.respondWith(
    caches.match(e.request).then(cached => cached || fetch(e.request).then(res => {
      const copy = res.clone();
      caches.open(CACHE).then(c => c.put(e.request, copy)).catch(() => {});
      return res;
    }).catch(() => cached))
  );
});
