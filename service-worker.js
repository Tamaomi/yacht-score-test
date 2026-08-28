
// 修正内容：ダイス選択式点数計算機能で下段役までスクロール選択できるようにキャッシュ名を更新
const CACHE_NAME = 'v10-yacht-score-pwa-dice-scroll-space';
const FILES = [
  './',
  './index.html',
  './style.css',
  './script.js',
  './manifest.json',
  './honda.png',
  './icons/icon-192.png',
  './icons/icon-512.png'
];

self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(FILES)));
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => Promise.all(keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))))
  );
  self.clients.claim();
});

self.addEventListener('fetch', event => {
  event.respondWith(caches.match(event.request).then(cached => cached || fetch(event.request)));
});

