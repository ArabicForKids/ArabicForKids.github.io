const CACHE_NAME = 'arabic-for-kids-v1';
const ASSETS = [
  './',
  './index.html',
  './level1.html',
  './level2.html',
  './icon.svg',
  './manifest.json'
];

// 1. Install and cache core files
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(ASSETS);
    })
  );
  self.skipWaiting();
});

// 2. Clear old caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(
        keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))
      );
    })
  );
  self.clients.claim();
});

// 3. Intercept requests and serve from cache (Offline Support)
self.addEventListener('fetch', event => {
  // We skip caching dynamic TTS audio so it doesn't break, but we cache UI, Fonts, and Quran audio
  if (event.request.url.includes('translate_tts')) return;

  event.respondWith(
    caches.match(event.request).then(cachedResponse => {
      if (cachedResponse) return cachedResponse;

      return fetch(event.request).then(networkResponse => {
        // Cache external assets (like Tailwind, Lucide, Quran Audio) as they are requested
        if (networkResponse && networkResponse.status === 200) {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then(cache => {
            cache.put(event.request, responseToCache);
          });
        }
        return networkResponse;
      }).catch(() => {
        // Fallback for navigation if completely offline
        if (event.request.mode === 'navigate') {
          return caches.match('./index.html');
        }
      });
    })
  );
});
