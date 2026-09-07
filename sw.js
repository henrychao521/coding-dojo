/* 程式練功房 Service Worker
 * 策略：
 *   - HTML 導覽：network-first（拿得到新版就更新，斷網時回退快取）
 *   - 其餘同源資源（js/css/wasm/vendor）：cache-first（第一次抓到就快取，之後離線也能用）
 * 這讓「完整 vendor」再加一層快取：單元間切換、重整、斷網都不必重抓 12MB Pyodide。
 */
// 非 HTML 同源資源走 cache-first，所以題目與評測程式改版後必須換快取名，
// 否則已開過站的學生會一直吃到舊題目（activate 會自動清掉舊快取）。
const CACHE = 'coding-dojo-v2';

self.addEventListener('install', (e) => {
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== location.origin) return; // 只管同源（字型 CDN 等交給瀏覽器）

  const isHTML = req.mode === 'navigate' || (req.headers.get('accept') || '').includes('text/html');

  if (isHTML) {
    e.respondWith(
      fetch(req).then(res => {
        const copy = res.clone();
        caches.open(CACHE).then(c => c.put(req, copy));
        return res;
      }).catch(() => caches.match(req).then(r => r || caches.match('index.html')))
    );
  } else {
    e.respondWith(
      caches.match(req).then(cached => cached || fetch(req).then(res => {
        if (res.ok) { const copy = res.clone(); caches.open(CACHE).then(c => c.put(req, copy)); }
        return res;
      }))
    );
  }
});
