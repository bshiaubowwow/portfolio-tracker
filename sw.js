const CACHE_NAME = 'portfolio-v5';
const SHELL_ASSETS = [
  '/portfolio-tracker/',
  '/portfolio-tracker/index.html',
  '/portfolio-tracker/manifest.json',
  '/portfolio-tracker/icon-192.png',
  '/portfolio-tracker/icon-512.png',
  'https://fonts.googleapis.com/css2?family=Syne:wght@400;500;600;700&family=DM+Mono:wght@300;400;500&display=swap',
];

// Install — cache app shell
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(SHELL_ASSETS))
  );
  self.skipWaiting();
});

// Activate — clean old caches
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Fetch — network-first for API/data, cache-first for shell
self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);

  // Always go to network for data requests (Google Apps Script, Yahoo Finance, proxies)
  if (url.hostname.includes('script.google.com') ||
      url.hostname.includes('yahoo') ||
      url.hostname.includes('allorigins')) {
    return;
  }

  // For everything else: try network first, fall back to cache
  e.respondWith(
    fetch(e.request)
      .then(response => {
        // Cache successful responses for next time
        if (response.ok) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(e.request, clone));
        }
        return response;
      })
      .catch(() => caches.match(e.request))
  );
});
