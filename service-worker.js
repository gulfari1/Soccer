// service-worker.js
const CACHE_NAME = 'pl-v1';
const ASSETS = [
  '/',
  '/index.html',
  '/scores.html',
  '/players.html',
  '/styles.css',
  '/app.js',
  '/logos/*.webp'
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(ASSETS))
  );
});

self.addEventListener('fetch', (e) => {
  e.respondWith(
    caches.match(e.request)
      .then(res => res || fetch(e.request))
});
