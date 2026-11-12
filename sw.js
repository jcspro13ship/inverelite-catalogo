// InverElite — service worker
// Permite instalar la app y abrirla aunque la conexión falle.
// Los datos (Google Sheets, Apps Script, fotos) NO se guardan aquí: siempre van a la red.
const CACHE = 'inverelite-v2';
const SHELL = ['./', 'index.html', 'app.js', 'config.js', 'manifest.webmanifest',
  'icons/icon-192.png', 'icons/icon-512.png',
  'vendor/tailwind.js', 'vendor/react.production.min.js', 'vendor/react-dom.production.min.js',
  'vendor/babel.min.js', 'vendor/lucide.min.js', 'vendor/papaparse.min.js'];
const FONT_HOSTS = ['fonts.googleapis.com', 'fonts.gstatic.com'];

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

  // Fuentes de Google: red primero; la copia guardada solo si no hay conexión.
  // Solo se guardan respuestas correctas, nunca una respuesta fallida o bloqueada.
  if (FONT_HOSTS.indexOf(url.hostname) !== -1) {
    e.respondWith(
      fetch(req).then((resp) => {
        if (resp.ok) { const copy = resp.clone(); caches.open(CACHE).then((c) => c.put(req, copy)); }
        return resp;
      }).catch(() => caches.match(req).then((r) => r || Response.error()))
    );
  }
  // Todo lo demás (Sheets, Apps Script, fotos de Drive) pasa directo a la red.
});
