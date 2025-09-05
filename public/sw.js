const CACHE_NAME = 'app-cache-v1';

self.addEventListener('install', (event) => {
  // Skip waiting and take control immediately
  self.skipWaiting();
  
  event.waitUntil(
    caches.open(CACHE_NAME)
  );
});

self.addEventListener('activate', (event) => {
  // Immediately claim all clients
  self.clients.claim();
  
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          // Delete old caches that are not the current cache
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// Optional: Add fetch event handler for caching strategies
self.addEventListener('fetch', (event) => {
  // You can implement caching strategies here if needed
  // For now, we'll use a network-first strategy
  event.respondWith(
    fetch(event.request).catch(() => {
      return caches.match(event.request);
    })
  );
});
