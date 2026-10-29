/* Bablo Hub offline support. Online-only services (auth, Supabase, uploads, leaderboards) still require internet. */
const VERSION = 'bablo-offline-v7';
const SHELL = [
  './', './index.html', './manifest.json', './icon-192.png', './icon-512.png',
  './mls101-data.js', './mts-maths-topics.js', './mts-maths-induction-extra.js',
  './practicals/', './practicals/index.html',
  './practicals/chm107-practicals.html', './practicals/phy107-practical.html'
];

self.addEventListener('install', event => {
  event.waitUntil((async () => {
    const cache = await caches.open(VERSION);
    // One missing optional asset must not prevent the app shell from installing.
    await Promise.all(SHELL.map(async path => {
      try {
        const response = await fetch(path, { cache: 'reload' });
        if (response.ok) await cache.put(path, response);
      } catch (_) { /* keep installing; other shell assets may still be cached */ }
    }));
    await self.skipWaiting();
  })());
});

self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter(key => key.startsWith('bablo-shell-') || key.startsWith('bablo-offline-'))
      .filter(key => key !== VERSION).map(key => caches.delete(key)));
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', event => {
  const request = event.request;
  const url = new URL(request.url);
  if (request.method !== 'GET' || url.origin !== self.location.origin) return;

  // Keep page navigation responsive offline, while preferring fresh content online.
  if (request.mode === 'navigate' || url.pathname.endsWith('/index.html') || url.pathname === '/') {
    event.respondWith((async () => {
      try {
        const response = await fetch(request);
        if (response && response.ok) {
          const cache = await caches.open(VERSION);
          await cache.put('./index.html', response.clone());
          if (request.mode === 'navigate') await cache.put('./', response.clone());
        }
        return response;
      } catch (_) {
        return (await caches.match(request)) ||
          (await caches.match('./index.html')) ||
          (await caches.match('./')) ||
          new Response('Bablo Hub is not available offline yet. Open it once while connected to the internet.', {
            status: 503, headers: { 'Content-Type': 'text/plain; charset=utf-8' }
          });
      }
    })());
    return;
  }

  // Cache same-origin assets and practical manuals for offline access.
  event.respondWith((async () => {
    const cached = await caches.match(request);
    if (cached) {
      fetch(request).then(async response => {
        if (response && response.ok) (await caches.open(VERSION)).put(request, response);
      }).catch(() => {});
      return cached;
    }
    try {
      const response = await fetch(request);
      if (response && response.ok && response.type !== 'opaque') {
        (await caches.open(VERSION)).put(request, response.clone());
      }
      return response;
    } catch (_) {
      return new Response('This resource has not been saved for offline use yet.', {
        status: 503, headers: { 'Content-Type': 'text/plain; charset=utf-8' }
      });
    }
  })());
});

/* Push alerts remain supported; delivery still needs connectivity. */
self.addEventListener('push', function (event) {
  let data = { title: 'Bablo Hub', body: '', url: './' };
  try { data = Object.assign(data, event.data.json()); } catch (_) {}
  event.waitUntil(self.registration.showNotification(data.title, {
    body: data.body, icon: 'icon-192.png', badge: 'icon-192.png',
    data: { url: data.url || './' }
  }));
});
self.addEventListener('notificationclick', function (event) {
  event.notification.close();
  const target = (event.notification.data && event.notification.data.url) || './';
  event.waitUntil(clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function (list) {
    for (let i = 0; i < list.length; i++) if ('focus' in list[i]) return list[i].focus();
    return clients.openWindow(target);
  }));
});
