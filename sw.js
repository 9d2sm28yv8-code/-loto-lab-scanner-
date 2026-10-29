// Cambia il numero quando vuoi forzare l'aggiornamento della copia salvata
const V = 'lotolab-v1';
const BASE = self.registration.scope;
const SHELL = ['./', 'index.html', 'manifest.webmanifest', 'icon-192.png', 'icon-512.png', 'apple-touch-icon.png'].map(p => new URL(p, BASE).href);

self.addEventListener('install', e => {
  e.waitUntil(caches.open(V).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== V).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  // Le ricerche su Open Food Facts non vanno salvate: sempre in rete
  if (url.hostname.endsWith('openfoodfacts.org')) return;
  const sameOrigin = url.origin === location.origin;
  if (sameOrigin) {
    // Pagina e file dell'app: prima la rete (così gli aggiornamenti arrivano), poi la copia salvata
    e.respondWith(
      fetch(req).then(r => { const copy = r.clone(); caches.open(V).then(c => c.put(req, copy)); return r; })
        .catch(() => caches.match(req).then(m => m || caches.match(new URL('index.html', BASE).href)))
    );
  } else {
    // Librerie e font esterni: copia salvata se c'è, altrimenti rete e poi salvataggio
    e.respondWith(
      caches.match(req).then(m => m || fetch(req).then(r => { const copy = r.clone(); caches.open(V).then(c => c.put(req, copy)); return r; }))
    );
  }
});
