// Service Worker - للتطبيق بدون إنترنت
const CACHE_NAME = 'quran-app-v1';
const urlsToCache = [
  './',
  './index.html',
  './quran.json',
  './manifest.json'
];

// تثبيت Service Worker
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      console.log('✅ تم فتح الذاكرة المؤقتة');
      return cache.addAll(urlsToCache).catch(err => {
        console.log('⚠️ خطأ في تخزين الملفات:', err);
      });
    })
  );
  self.skipWaiting();
});

// تفعيل Service Worker
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('🗑️ حذف الذاكرة القديمة:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// التعامل مع الطلبات (Fetch)
self.addEventListener('fetch', event => {
  // تخطي الطلبات غير GET
  if (event.request.method !== 'GET') {
    return;
  }

  event.respondWith(
    caches.match(event.request).then(response => {
      // إذا وجدنا الملف في الذاكرة، أرجعه
      if (response) {
        return response;
      }

      // وإلا حاول جلب من الإنترنت
      return fetch(event.request).then(response => {
        // تحقق من أن الرد صحيح
        if (!response || response.status !== 200 || response.type !== 'basic') {
          return response;
        }

        // انسخ الرد قبل استخدامه
        const responseToCache = response.clone();

        // خزن الرد الجديد
        caches.open(CACHE_NAME).then(cache => {
          cache.put(event.request, responseToCache);
        });

        return response;
      }).catch(() => {
        // في حالة الخطأ والعدم اتصال، استخدم من الذاكرة
        return caches.match('./index.html');
      });
    })
  );
});

console.log('📱 Service Worker جاهز!');