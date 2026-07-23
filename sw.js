/* Poros-Aidant — service worker
   Stratégie « réseau d'abord » : la version en ligne est toujours privilégiée,
   le cache ne sert que de secours en cas de coupure de connexion.
   Ce choix évite qu'une ancienne version reste figée chez les visiteurs
   après une mise à jour du site. */

const CACHE = 'poros-aidant-v1';

self.addEventListener('install', function (e) {
  self.skipWaiting();
});

self.addEventListener('activate', function (e) {
  e.waitUntil(
    caches.keys().then(function (noms) {
      return Promise.all(
        noms.filter(function (n) { return n !== CACHE; })
            .map(function (n) { return caches.delete(n); })
      );
    }).then(function () { return self.clients.claim(); })
  );
});

self.addEventListener('fetch', function (e) {
  const req = e.request;

  // On ne gère que les pages du site, en lecture seule
  if (req.method !== 'GET') return;
  if (new URL(req.url).origin !== self.location.origin) return;

  e.respondWith(
    fetch(req)
      .then(function (rep) {
        if (rep && rep.status === 200) {
          const copie = rep.clone();
          caches.open(CACHE).then(function (c) { c.put(req, copie); });
        }
        return rep;
      })
      .catch(function () {
        return caches.match(req).then(function (cache) {
          return cache || caches.match('/');
        });
      })
  );
});
