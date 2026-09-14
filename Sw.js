const CACHE_NAME = 'gestor-v1';
const ASSETS = [
  '/',
  '/www/Index.html',
  '/manifest.json'
];

// 🔹 INSTALAÇÃO (cache inicial)
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(ASSETS).catch(err => {
        console.log('Cache addAll error:', err);
      });
    })
  );
  self.skipWaiting();
});

// 🔹 ATIVAÇÃO (limpa cache antigo)
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(
        keys.map(key => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// 🔹 FETCH (estratégia: network first + fallback cache)
self.addEventListener('fetch', event => {
  // Ignora requisições não-GET
  if (event.request.method !== 'GET') {
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then(response => {
        // Se sucesso, armazena em cache
        if (response && response.status === 200) {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then(cache => {
            cache.put(event.request, responseClone);
          });
        }
        return response;
      })
      .catch(() => {
        // Offline: retorna do cache
        return caches.match(event.request).then(response => {
          if (response) {
            return response;
          }
          // Fallback para página HTML
          if (event.request.mode === 'navigate') {
            return caches.match('/www/Index.html');
          }
        });
      })
  );
});