// 📘 service-worker.js
const CACHE_NAME = 'epub-notes-v2';

// لیست فایل‌هایی که باید کش بشن
const urlsToCache = [
  './',
  './index.html',
  './styles.css',
  './manifest.json',
  './js/main.js',
  './js/epub-manager.js',
  './js/notes-manager.js',
  './libs/epub.min.js',
  './libs/idb-keyval.min.js',
  './icons/icon-192.png',
  './icons/icon-512.png'
];

// 🧩 نصب سرویس ورکر و ذخیره فایل‌ها در کش
self.addEventListener('install', event => {
  console.log('[Service Worker] Installing...');
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      console.log('[Service Worker] Caching files');
      return cache.addAll(urlsToCache);
    })
  );
});

// ⚙️ فعال‌سازی و حذف کش‌های قدیمی
self.addEventListener('activate', event => {
  console.log('[Service Worker] Activating...');
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('[Service Worker] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// 🌐 استراتژی "cache-first" برای پاسخ به درخواست‌ها
self.addEventListener('fetch', event => {
  // از window یا document استفاده نکن! (در Service Worker وجود ندارن)
  event.respondWith(
    caches.match(event.request).then(response => {
      // اگر در کش بود، همونو بده، در غیر این صورت از شبکه بگیر
      return response || fetch(event.request).catch(() => {
        // اگر شبکه در دسترس نبود و فایل در کش نیست، برگرد هیچی یا صفحه آفلاین دلخواه
        return caches.match('./index.html');
      });
    })
  );
});
