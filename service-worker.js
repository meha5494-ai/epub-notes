const CACHE_NAME = 'epub-notes-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/styles.css',
  '/js/main.js',
  '/js/epub-manager.js',
  '/js/notes-manager.js',
  '/libs/epub.min.js',
  '/libs/idb-keyval.min.js'
];

// نصب سرویس ورکر و کش کردن فایل‌ها
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(urlsToCache))
  );
});

// استراتژی کش اول، سپس شبکه
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        return response || fetch(event.request);
      })
  );
});

// فعال‌سازی و حذف کش‌های قدیمی
self.addEventListener('activate', event => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});