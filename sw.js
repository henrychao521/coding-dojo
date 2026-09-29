/* 程式練功房 Service Worker
 * 策略：
 *   - HTML 導覽：network-first（拿得到新版就更新，斷網時回退快取）
 *   - 其餘同源資源（js/css/wasm/vendor）：cache-first（第一次抓到就快取，之後離線也能用）
 * 這讓「完整 vendor」再加一層快取：單元間切換、重整、斷網都不必重抓 12MB Pyodide。
 */
// 非 HTML 同源資源走 cache-first，所以題目與評測程式改版後必須換快取名，
// 否則已開過站的學生會一直吃到舊題目（activate 會自動清掉舊快取）。
const CACHE = 'coding-dojo-v4';

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
      }).catch(() => caches.match(req).then(r => r || offlinePage()))
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

// 斷網且這一頁沒快取過：回一頁獨立的離線說明（連結用絕對網址）。
// 舊版回退成根目錄的 index.html，但網址還停在子目錄，頁內相對路徑的 css/js 全部抓錯，畫面整個破掉。
function offlinePage() {
  const home = self.registration.scope;
  const html = `<!doctype html><html lang="zh-Hant"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1"><title>離線中｜程式練功房</title></head>
<body style="font-family:system-ui,-apple-system,'Noto Sans TC',sans-serif;max-width:34em;margin:3em auto;padding:0 16px;line-height:1.8;color:#222;background:#fff">
<h1 style="font-size:1.4em">目前沒有網路，這一頁還沒存到這台裝置</h1>
<p>請先在有網路的時候打開這一頁一次（練習頁會同時下載 Python 執行環境），之後斷網也能使用。</p>
<p><a href="${home}">← 回單元地圖</a></p></body></html>`;
  return new Response(html, { headers: { 'Content-Type': 'text/html; charset=utf-8' } });
}
