/* 程式練功房 Service Worker
 * 策略：
 *   - HTML 導覽：network-first（拿得到新版就更新，斷網時回退快取）
 *   - 其餘同源資源（js/css/wasm/vendor）：cache-first（第一次抓到就快取，之後離線也能用）
 * 這讓「完整 vendor」再加一層快取：單元間切換、重整、斷網都不必重抓 12MB Pyodide。
 *   - 快取是「用到才存」：沒開過的頁面斷網時打不開。教師後台的「準備離線使用」
 *     會依 OFFLINE_FILES 一次預先下載全部（見下方 message 處理）。
 */
// 非 HTML 同源資源走 cache-first，所以題目與評測程式改版後必須換快取名，
// 否則已開過站的學生會一直吃到舊題目（activate 會自動清掉舊快取）。
const CACHE = 'coding-dojo-v6';

// 「準備離線使用」（教師後台按鈕）預先下載的檔案清單，路徑相對於 SW scope（repo 根）。
// 新增單元、頁面或 vendor 檔時要一併加進來，並遞增上面的 CACHE。
const OFFLINE_FILES = [
  './', 'index.html', 'teacher.html', 'dev-log.html',
  'css/style.css', 'css/svg-effects.css', 'css/dojo.css',
  'js/units.js', 'js/main.js', 'js/audio.js', 'js/sw-register.js', 'js/teacher.js',
  'js/offline-prep.js', 'js/devlog.js', 'js/verify-result.js', 'js/sheet-config.js', 'js/sheet-log.js',
  'js/eval/runner-host.js', 'js/eval/practice.js', 'js/eval/coding-runner.worker.js',
  'vendor/codemirror/cm6.bundle.js',
  'vendor/pyodide/pyodide.js', 'vendor/pyodide/pyodide.asm.js', 'vendor/pyodide/pyodide.asm.wasm',
  'vendor/pyodide/python_stdlib.zip', 'vendor/pyodide/pyodide-lock.json',
  'units/u1-output/index.html', 'units/u1-output/practice.html', 'units/u1-output/problems.js',
  'units/u2-condition/index.html', 'units/u2-condition/practice.html', 'units/u2-condition/problems.js',
  'units/u3-loop/index.html', 'units/u3-loop/practice.html', 'units/u3-loop/problems.js',
];
const absURL = (rel) => new URL(rel, self.registration.scope).href;

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

// ── 教師後台「準備離線使用」──
// 頁面用 MessageChannel 送 {type:'offline-status'} 或 {type:'offline-prepare'}，進度從 port 回傳：
//   {type:'progress', done, total, file, bytes, totalBytes?}、{type:'done', total, bytes}、{type:'error', file, message}
self.addEventListener('message', (e) => {
  const msg = e.data || {}, port = e.ports && e.ports[0];
  if (!port) return;
  if (msg.type === 'offline-status') e.waitUntil(offlineStatus(port));
  else if (msg.type === 'offline-prepare') e.waitUntil(offlinePrepare(port));
});

async function offlineStatus(port) {
  const c = await caches.open(CACHE);
  let have = 0;
  for (const f of OFFLINE_FILES) if (await c.match(absURL(f))) have++;
  port.postMessage({ type: 'status', have, total: OFFLINE_FILES.length, cache: CACHE });
}

async function offlinePrepare(port) {
  const c = await caches.open(CACHE);
  const total = OFFLINE_FILES.length;
  let done = 0, bytes = 0;
  for (const f of OFFLINE_FILES) {
    const url = absURL(f);
    try {
      const res = await fetch(url, { cache: 'reload' });   // 繞過 HTTP 快取，拿伺服器上的最新版
      if (!res.ok) throw new Error('HTTP ' + res.status);
      // 大檔（Pyodide wasm 約 8.6 MB）邊下載邊回報位元組，進度條才不會卡住不動
      const reader = res.body.getReader(), chunks = [];
      let got = 0, lastPost = 0;
      for (;;) {
        const { done: end, value } = await reader.read();
        if (end) break;
        chunks.push(value); got += value.byteLength;
        if (got - lastPost > 256 * 1024) {
          lastPost = got;
          port.postMessage({ type: 'progress', done, total, file: f, bytes: bytes + got });
        }
      }
      const body = new Blob(chunks, { type: res.headers.get('Content-Type') || '' });
      // body 已是解壓後的內容：拿掉壓縮與長度標頭，免得回放時標頭與內容不符
      const headers = new Headers(res.headers);
      headers.delete('Content-Encoding'); headers.delete('Content-Length');
      await c.put(url, new Response(body, { status: res.status, statusText: res.statusText, headers }));
      bytes += got; done++;
      port.postMessage({ type: 'progress', done, total, file: f, bytes });
    } catch (err) {
      port.postMessage({ type: 'error', file: f, message: String(err && err.message || err) });
      return;
    }
  }
  port.postMessage({ type: 'done', total, bytes, cache: CACHE });
}

// 斷網且這一頁沒快取過：回一頁獨立的離線說明（連結用絕對網址）。
// 舊版回退成根目錄的 index.html，但網址還停在子目錄，頁內相對路徑的 css/js 全部抓錯，畫面整個破掉。
function offlinePage() {
  const home = self.registration.scope;
  const html = `<!doctype html><html lang="zh-Hant"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1"><title>離線中｜程式練功房</title></head>
<body style="font-family:system-ui,-apple-system,'Noto Sans TC',sans-serif;max-width:34em;margin:3em auto;padding:0 16px;line-height:1.8;color:#222;background:#fff">
<h1 style="font-size:1.4em">目前沒有網路，這一頁還沒存到這台裝置</h1>
<p>請先在有網路的時候打開這一頁一次（練習頁會同時下載 Python 執行環境），之後斷網也能使用。也可以請老師在有網路時到「教師後台」按「準備離線使用」，一次把所有單元存進這台裝置。</p>
<p><a href="${home}">← 回單元地圖</a></p></body></html>`;
  return new Response(html, { headers: { 'Content-Type': 'text/html; charset=utf-8' } });
}
