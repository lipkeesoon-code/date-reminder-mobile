const CACHE_NAME = 'date-reminder-v1';

// 激活时跳过等待，确保能立即接管页面
self.addEventListener('install', (event) => {
  self.skipWaiting();
});

// 激活后立即接管客户端
self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

// 监听 fetch 请求，采用网络优先策略，避免产生缓存不更新的问题
self.addEventListener('fetch', (event) => {
  event.respondWith(
    fetch(event.request).catch((err) => {
      // 离线时尝试从缓存中查找
      return caches.match(event.request);
    })
  );
});
