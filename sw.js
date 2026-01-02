// Simple offline cache
const CACHE = 'habit-pwa-cache-v1';
const ASSETS = [
  './',
  './index.html',
  './manifest.webmanifest',
  './sw.js'
];

self.addEventListener('install', (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE);
    await cache.addAll(ASSETS);
    self.skipWaiting();
  })());
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.map(k => (k !== CACHE) ? caches.delete(k) : null));
    self.clients.claim();
  })());
});

self.addEventListener('fetch', (event) => {
  event.respondWith((async () => {
    const cached = await caches.match(event.request);
    if (cached) return cached;
    try {
      const fresh = await fetch(event.request);
      const cache = await caches.open(CACHE);
      // Cache GET requests only
      if (event.request.method === 'GET' && fresh && fresh.status === 200) cache.put(event.request, fresh.clone());
      return fresh;
    } catch (e) {
      // fallback to app shell
      const shell = await caches.match('./index.html');
      return shell || new Response('Offline', {status: 503});
    }
  })());
});
