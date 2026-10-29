/* Bablo Hub resilient app shell: cache current release first, migrate safely, support weak networks. */
const VERSION = 'bablo-offline-v9-cache-order';
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
async function currentMatch(request) {
  const current = await caches.open(VERSION);
  return (await current.match(request, { ignoreSearch: true })) ||
    (await caches.match(request, { ignoreSearch: true }));
}
async function saveCopy(request, response) {
  if (!response || !response.ok || response.type === 'opaque') return;
  const cache = await caches.open(VERSION);
  await cache.put(request, response.clone());
}

self.addEventListener('install', event => {
  event.waitUntil((async () => {
    const cache = await caches.open(VERSION);
    // Migrate a saved shell before attempting network refreshes.
    for (const path of SHELL) {
      try {
        const old = await caches.match(path, { ignoreSearch: true });
        if (old && !(await cache.match(path))) await cache.put(path, old);
      } catch (_) {}
    }
    // Refresh independently; slow optional assets cannot block install.
    await Promise.all(SHELL.map(async path => {
      try {
        const response = await timedFetch(path, path === './' || path === './index.html' ? 20000 : 7000);
        if (response.ok) await cache.put(path, response);
      } catch (_) {}
    }));
    await self.skipWaiting();
  })());
});

self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    // The current cache has the migrated shell; remove obsolete Bablo caches to avoid stale HTML winning.
    const keys = await caches.keys();
    await Promise.all(keys
      .filter(key => (key.startsWith('bablo-shell-') || key.startsWith('bablo-offline-')) && key !== VERSION)
      .map(key => caches.delete(key)));
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', event => {
  const request = event.request;
  const url = new URL(request.url);
  if (request.method !== 'GET' || url.origin !== self.location.origin) return;
  const isNavigation = request.mode === 'navigate' || url.pathname.endsWith('/index.html') || url.pathname === '/';

  if (isNavigation) {
    event.respondWith((async () => {
      const cached = await currentMatch(request) ||
        await currentMatch('./index.html') ||
        await currentMatch('./');
      if (cached) {
        // Serve cached UI immediately; refresh cache in background when network allows.
        event.waitUntil(timedFetch(request, 12000).then(async response => {
          if (response.ok) {
            await saveCopy('./index.html', response);
            await saveCopy('./', response);
          }
        }).catch(() => {}));
        return cached;
      }
      try {
        const response = await timedFetch(request, 25000);
        if (response.ok) {
          await saveCopy('./index.html', response);
          await saveCopy('./', response);
        }
        return response;
      } catch (_) {
        return new Response('<!doctype html><html><meta name="viewport" content="width=device-width,initial-scale=1"><title>Bablo Hub</title><body style="font-family:system-ui;padding:24px;background:#0a1020;color:white"><h2>Bablo Hub</h2><p>The connection is too weak to load Bablo Hub.</p><p>Tap retry when your connection improves. Once the app loads successfully, it can be opened offline.</p><button onclick="location.reload()">Try again</button></body></html>', {status:200,headers:{'Content-Type':'text/html; charset=utf-8'}});
      }
    })());
    return;
  }

  event.respondWith((async () => {
    const cached = await currentMatch(request);
    if (cached) {
      event.waitUntil(timedFetch(request, 7000).then(response => saveCopy(request, response)).catch(() => {}));
      return cached;
    }
    try {
      const response = await timedFetch(request, 10000);
      if (response.ok) await saveCopy(request, response);
      return response;
    } catch (_) {
      return new Response('This resource has not been cached yet. Open it once while connected to save it for offline use.', {status:503,headers:{'Content-Type':'text/plain; charset=utf-8'}});
    }
  })());
});

self.addEventListener('push', event => {
  let data = {title:'Bablo Hub',body:'',url:'./'};
  try { data = Object.assign(data,event.data.json()); } catch (_) {}
  event.waitUntil(self.registration.showNotification(data.title,{body:data.body,icon:'icon-192.png',badge:'icon-192.png',data:{url:data.url||'./'}}));
});
self.addEventListener('notificationclick', event => {
  event.notification.close();
  const target=(event.notification.data&&event.notification.data.url)||'./';
  event.waitUntil(clients.matchAll({type:'window',includeUncontrolled:true}).then(list=>{
    for(let i=0;i<list.length;i++) if('focus' in list[i]) return list[i].focus();
    return clients.openWindow(target);
  }));
});
