/* Chanchito service worker.
   Para publicar una versión nueva: cambiá VERSION (y anotá qué cambió en NOTES).
   Los usuarios ven "Hay una versión nueva" y la instalan con el botón Actualizar. */
const VERSION = '1.4.8';
const NOTES = 'Arreglado: la caja de cada tarjeta muestra la fecha de vencimiento que elegiste.';
const CACHE = 'chanchito-' + VERSION;
const FILES = [
  './', './index.html', './config.js', './js/backend.js', './manifest.webmanifest',
  './vendor/supabase.js', './vendor/chart.umd.js',
  './icons/icon-192.png', './icons/icon-512.png', './icons/maskable-192.png', './icons/maskable-512.png',
  './icons/apple-touch-icon.png', './icons/favicon.png'
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES.map(f => new Request(f, { cache: 'reload' })))));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k.startsWith('chanchito-') && k !== CACHE).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});
self.addEventListener('message', e => {
  if (e.data === 'SKIP_WAITING') self.skipWaiting();
  if (e.data === 'GET_VERSION') e.source && e.source.postMessage({ type: 'VERSION', version: VERSION, notes: NOTES });
});
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;       // Supabase y otros: siempre red
  if (url.pathname.endsWith('/sw.js')) return;
  const isPage = req.mode === 'navigate';
  e.respondWith(
    caches.open(CACHE).then(async c => {
      const hit = await c.match(isPage ? './index.html' : req, { ignoreSearch: isPage });
      if (hit) return hit;
      try { const res = await fetch(req); if (res.ok && url.pathname.indexOf('/icons/') >= 0) c.put(req, res.clone()); return res; }
      catch (err) { return isPage ? c.match('./index.html') : Response.error(); }
    })
  );
});
self.addEventListener('notificationclick', e => {
  e.notification.close();
  e.waitUntil(self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(cs => {
    for (const c of cs) { if ('focus' in c) return c.focus(); }
    return self.clients.openWindow('./');
  }));
});
