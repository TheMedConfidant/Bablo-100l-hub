/* Bablo 100L Hub service worker: lets the app open offline. Live data (Supabase) is never cached. */
const VERSION = 'bablo-shell-v3';
const SHELL = ['./', './index.html', './manifest.json', './icon-192.png', './icon-512.png'];
self.addEventListener('install', e => { e.waitUntil(caches.open(VERSION).then(c => c.addAll(SHELL)).then(() => self.skipWaiting())); });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== VERSION).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);
  if (e.request.method !== 'GET' || url.origin !== self.location.origin) return;   // never touch Supabase or other sites
  // page: network first so updates arrive; fall back to the cached copy when offline
  if (e.request.mode === 'navigate' || url.pathname.endsWith('/index.html') || url.pathname === '/' ) {
    e.respondWith(fetch(e.request).then(r => { const copy = r.clone(); caches.open(VERSION).then(c => c.put('./index.html', copy)); return r; }).catch(() => caches.match('./index.html')));
    return;
  }
  // icons and manifest: cache first
  e.respondWith(caches.match(e.request).then(hit => hit || fetch(e.request)));
});

/* push alerts: show the message, and open the app when it is tapped */
self.addEventListener('push', function (e) {
  var data = { title: 'Bablo Hub', body: '', url: './' };
  try { data = Object.assign(data, e.data.json()); } catch (err) { /* plain text or empty */ }
  e.waitUntil(self.registration.showNotification(data.title, { body: data.body, icon: 'icon-192.png', badge: 'icon-192.png', data: { url: data.url || './' } }));
});
self.addEventListener('notificationclick', function (e) {
  e.notification.close();
  var target = (e.notification.data && e.notification.data.url) || './';
  e.waitUntil(clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function (list) {
    for (var i = 0; i < list.length; i++) { if ('focus' in list[i]) return list[i].focus(); }
    return clients.openWindow(target);
  }));
});
