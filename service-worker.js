// 修正内容：ダイス選択式点数計算機能のコンパクトな画面をオフラインでも確実に読み込むためキャッシュ名を更新
const CACHE_NAME = 'v5-yacht-score-pwa-compact-dice-calculator';
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

