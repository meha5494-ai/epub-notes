const CACHE_NAME = 'epub-notes-cache-v1';
const urlsToCache = [
    './',
    'index.html',
    'styles.css',
    'manifest.json',
    'js/main.js',
    'js/epub-manager.js',
    'js/notes-manager.js',
    'icons/icon-192.png',
    'icons/icon-512.png',
    // CDN URLs (It's better to let browser handle CDN caching, but including for robustness)
    'https://cdn.jsdelivr.net/gh/rastikerdar/vazirmatn@v33.003/Vazirmatn-font-face.css',
    'https://cdn.jsdelivr.net/npm/epubjs/dist/epub.min.js',
    'https://cdn.jsdelivr.net/npm/idb-keyval@6/dist/umd.js',
    'https://cdnjs.cloudflare.com/ajax/libs/jszip/3.1.5/jszip.min.js'
];

self.addEventListener('install', event => {
    // Perform install steps
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('Opened cache');
                return cache.addAll(urlsToCache);
            })
    );
});

self.addEventListener('fetch', event => {
    event.respondWith(
        caches.match(event.request)
            .then(response => {
                // Cache hit - return response
                if (response) {
                    return response;
                }
                // If not in cache, fetch from network
                return fetch(event.request);
            })
    );
});

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
