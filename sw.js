// InverElite — service worker
// Permite instalar la app y abrirla aunque la conexión falle.
// Los datos (Google Sheets, Apps Script, fotos) NO se guardan aquí: siempre van a la red.
const CACHE = 'inverelite-v1';
const SHELL = ['./', 'index.html', 'app.js', 'config.js', 'manifest.webmanifest',
  'icons/icon-192.png', 'icons/icon-512.png'];
const CDN_HOSTS = ['unpkg.com', 'cdn.jsdelivr.net', 'cdn.tailwindcss.com',
  'fonts.googleapis.com', 'fonts.gstatic.com'];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);

  // Archivos de la app: primero la red (para recibir siempre la última versión),
  // y la copia guardada solo si no hay conexión.
  if (url.origin === self.location.origin) {
    e.respondWith(
      fetch(req).then((resp) => {
        if (resp.ok) { const copy = resp.clone(); caches.open(CACHE).then((c) => c.put(req, copy)); }
        return resp;
      }).catch(() => caches.match(req, { ignoreSearch: true }).then((r) => r || caches.match('index.html')))
    );
    return;
  }

  // Librerías y fuentes: copia guardada al instante y se refresca en segundo plano.
  if (CDN_HOSTS.indexOf(url.hostname) !== -1) {
    e.respondWith(
      caches.open(CACHE).then((c) => c.match(req).then((cached) => {
        const net = fetch(req).then((resp) => { c.put(req, resp.clone()); return resp; }).catch(() => cached);
        return cached || net;
      }))
    );
  }
  // Todo lo demás (Sheets, Apps Script, fotos de Drive) pasa directo a la red.
});
