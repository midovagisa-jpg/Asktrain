// FitChat Service Worker
// ВАЖНО: при каждом новом деплое меняй CACHE_VERSION (например 'v8', 'v9'...).
// Это заставит браузер скачать новый sw.js, установить его и показать
// в приложении баннер "Доступно обновление" (см. applyAppUpdate() в index.html).
const CACHE_VERSION = 'fitchat-v1';
const CACHE_FILES = [
  './',
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png',
  './icon-180.png',
  './favicon-32.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_VERSION).then((cache) => cache.addAll(CACHE_FILES)).catch(() => {})
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_VERSION).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Позволяет странице принудительно активировать новый воркер сразу
// (вызывается из applyAppUpdate() кнопкой "Обновить" в баннере)
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

self.addEventListener('fetch', (event) => {
  // Сеть в приоритете (чтобы данные Firebase были всегда свежими),
  // а статические файлы — из кэша как запасной вариант офлайн.
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        if (event.request.method === 'GET' && response.ok) {
          const clone = response.clone();
          caches.open(CACHE_VERSION).then((cache) => cache.put(event.request, clone)).catch(() => {});
        }
        return response;
      })
      .catch(() => caches.match(event.request))
  );
});
