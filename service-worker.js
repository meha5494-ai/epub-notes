// 📘 Service Worker for EPUB Notes App (v3)
// بهینه‌شده برای GitHub Pages و رفع کش نسخه‌های قدیمی

const CACHE_NAME = 'epub-notes-cache-v3'; // 🔁 هر بار که فایل‌ها تغییر می‌کنند، عدد نسخه را افزایش بده

// فایل‌هایی که باید کش شوند
const urlsToCache = [
    './',
    './index.html',
    './styles.css',
    './manifest.json',
    './js/main.js',
    './js/epub-manager.js',
    './js/notes-manager.js',
    './icons/icon-192.png',
    './icons/icon-512.png'
];

// 📦 نصب (Install)
self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('[ServiceWorker] Opened cache:', CACHE_NAME);
                return cache.addAll(urlsToCache);
            })
            .catch(err => console.error('[ServiceWorker] Cache install failed:', err))
    );
});

// 🔄 فعال‌سازی (Activate) و پاک‌سازی کش‌های قدیمی
self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cacheName => {
                    if (cacheName !== CACHE_NAME) {
                        console.log('[ServiceWorker] Deleting old cache:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
    self.clients.claim(); // فعال‌سازی سریع در تب فعلی
});

// 🌐 واکشی (Fetch) — اول شبکه، سپس کش در صورت قطع اینترنت
self.addEventListener('fetch', event => {
    event.respondWith(
        fetch(event.request)
            .then(response => {
                // اگر درخواست موفق بود، آن را در کش ذخیره می‌کنیم
                if (!response || response.status !== 200 || response.type !== 'basic') {
                    return response;
                }

                const responseToCache = response.clone();
                caches.open(CACHE_NAME).then(cache => {
                    cache.put(event.request, responseToCache);
                });

                return response;
            })
            .catch(() => {
                // اگر شبکه در دسترس نبود، از کش استفاده کن
                return caches.match(event.request);
            })
    );
});
