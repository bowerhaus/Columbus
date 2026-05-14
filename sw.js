const CACHE = 'columbus-v1';
const SHELL = [
  './',
  './index.html',
  './manifest.json',
  './css/app.css',
  './src/main.js',
  './src/geodesy.js',
  './src/landfall.js',
  './src/compass.js',
  './src/overlay.js',
  './data/land-110m.json',
  './data/countries-110m.json',
  './icons/icon-192.png',
  './icons/icon-512.png',
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  // Cache-first for same-origin requests; network-only for CDN (fonts, d3, topojson)
  if (!e.request.url.startsWith(self.location.origin)) return;
  e.respondWith(
    caches.match(e.request).then(cached => cached || fetch(e.request).then(res => {
      if (res.ok) {
        const clone = res.clone();
        caches.open(CACHE).then(c => c.put(e.request, clone));
      }
      return res;
    }))
  );
});
