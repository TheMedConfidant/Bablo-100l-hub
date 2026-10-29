/* Bablo Hub: resilient loading on weak networks + offline shell cache. */
const VERSION = 'bablo-offline-v8-fast-open';
const SHELL = [
  './', './index.html', './manifest.json', './icon-192.png', './icon-512.png',
  './mls101-data.js', './mts-maths-topics.js', './mts-maths-induction-extra.js',
  './practicals/', './practicals/index.html',
  './practicals/chm107-practicals.html', './practicals/phy107-practical.html'
];

function timedFetch(request, ms) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ms);
  return fetch(request, { signal: controller.signal }).finally(() => clearTimeout(timer));
}
async function findCached(request) {
  // Search older app caches too, so an upgrade doesn't strand a user's previously cached copy.
  return await caches.match(request, { ignoreSearch: true });
}
async function saveCopy(request, response) {
  if (!response || !response.ok || response.type === 'opaque') return;
  const cache = await caches.open(VERSION);
  await cache.put(request, response.clone());
}

self.addEventListener('install', event => {
  event.waitUntil((async () => {
    const cache = await caches.open(VERSION);
    // Put the previous cached app first if available, so weak networks don't block installation.
    for (const path of SHELL) {
      try {
        const old = await findCached(path);
        if (old) await cache.put(path, old);
      } catch (_) {}
    }
    // Refresh shell assets with per-file timeouts; no single slow request can hang install forever.
    await Promise.all(SHELL.map(async path => {
      try {
        const response = await timedFetch(path, path === './' || path === './index.html' ? 18000 : 7000);
        if (response.ok) await cache.put(path, response);
      } catch (_) {}
    }));
    await self.skipWaiting();
  })());
});

self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    // Keep older caches as a fallback for this release; delete only clearly obsolete temporary caches.
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', event => {
  const request = event.request;
  const url = new URL(request.url);
  if (request.method !== 'GET' || url.origin !== self.location.origin) return;

  const isNavigation = request.mode === 'navigate' ||
    url.pathname.endsWith('/index.html') || url.pathname === '/';

  if (isNavigation) {
    event.respondWith((async () => {
      const cached = await findCached(request) ||
        await findCached('./index.html') ||
        await findCached('./');
      // If the user has opened Bablo before, show the saved app immediately.
      if (cached) {
        event.waitUntil(timedFetch(request, 12000).then(async response => {
          if (response.ok) {
            await saveCopy('./index.html', response);
            await saveCopy('./', response);
          }
        }).catch(() => {}));
        return cached;
      }
      // First-ever visit: try the network, but don't leave a spinner forever on a weak connection.
      try {
        const response = await timedFetch(request, 25000);
        if (response.ok) {
          await saveCopy('./index.html', response);
          await saveCopy('./', response);
        }
        return response;
      } catch (_) {
        return new Response(
          '<!doctype html><html><meta name="viewport" content="width=device-width,initial-scale=1"><title>Bablo Hub</title><body style="font-family:system-ui;padding:24px;background:#0a1020;color:white"><h2>Bablo Hub</h2><p>The connection is too weak to load Bablo Hub right now.</p><p>If you have opened the app on this phone before, reopen it once the connection improves so it can save an offline copy.</p><button onclick="location.reload()">Try again</button></body></html>',
          { status: 200, headers: { 'Content-Type': 'text/html; charset=utf-8' } }
        );
      }
    })());
    return;
  }

  // Serve saved assets instantly, and refresh them in the background when the network permits.
  event.respondWith((async () => {
    const cached = await findCached(request);
    if (cached) {
      event.waitUntil(timedFetch(request, 7000).then(response => saveCopy(request, response)).catch(() => {}));
      return cached;
    }
    try {
      const response = await timedFetch(request, 10000);
      if (response.ok) await saveCopy(request, response);
      return response;
    } catch (_) {
      return new Response('This resource is not cached yet. Connect briefly and open it once to save it for offline use.', {
        status: 503, headers: { 'Content-Type': 'text/plain; charset=utf-8' }
      });
    }
  })());
});

/* Push notifications are supported; delivery itself requires connectivity. */
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
