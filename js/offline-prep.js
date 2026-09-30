/* 程式練功房 — 教師後台「準備離線使用」
 * 請 Service Worker（sw.js 的 OFFLINE_FILES）預先下載 Pyodide 與全部單元頁，顯示進度與完成狀態。
 * 快取實際由 SW 寫入，所以快取名與清單只維護在 sw.js 一處。
 */
(function () {
  const btn = document.getElementById('btnOffline');
  const fill = document.getElementById('offFill');
  const status = document.getElementById('offStatus');
  if (!btn) return;
  const MB = (b) => (b / 1048576).toFixed(1) + ' MB';

  function show(text, cls, pct) {
    status.textContent = text;
    status.className = 'off-status' + (cls ? ' ' + cls : '');
    if (pct != null) fill.style.width = Math.max(0, Math.min(100, pct)) + '%';
  }

  if (!('serviceWorker' in navigator) || !location.protocol.startsWith('http')) {
    btn.disabled = true;
    show('這個瀏覽器（或用 file:// 直接開檔）不支援 Service Worker，無法準備離線使用。請用 Chrome、Safari 或 Edge 從網址開啟。', 'err', 0);
    return;
  }

  // 等 SW 啟用後，透過 MessageChannel 對話
  async function talk(type, onMsg) {
    const reg = await navigator.serviceWorker.register('sw.js');
    await navigator.serviceWorker.ready;
    const sw = reg.active || navigator.serviceWorker.controller;
    if (!sw) throw new Error('Service Worker 尚未啟用');
    return new Promise((resolve) => {
      const ch = new MessageChannel();
      ch.port1.onmessage = (e) => { if (onMsg(e.data) === 'end') { ch.port1.close(); resolve(); } };
      sw.postMessage({ type }, [ch.port2]);
    });
  }

  function checkStatus() {
    return talk('offline-status', (m) => {
      if (m.have === m.total) show(`已準備好：${m.total} 個檔案都在這台裝置上，斷網也能開練習頁、執行程式。`, 'ok', 100);
      else if (m.have === 0) show('尚未準備。按上方按鈕開始下載（約 13 MB）。', '', 0);
      else show(`已存 ${m.have}／${m.total} 個檔案，還不完整。按上方按鈕補齊。`, '', m.have / m.total * 100);
      return 'end';
    }).catch((err) => show('無法檢查離線狀態：' + err.message, 'err', 0));
  }

  btn.addEventListener('click', () => {
    btn.disabled = true;
    show('準備中…', '', 0);
    talk('offline-prepare', (m) => {
      if (m.type === 'progress') {
        show(`下載中 ${m.done}／${m.total} 個檔案（${MB(m.bytes)}）：${m.file}`, '', m.done / m.total * 100);
        return;
      }
      if (m.type === 'done') {
        show(`完成！${m.total} 個檔案（${MB(m.bytes)}）已存進這台裝置，之後斷網也能開練習頁、執行程式。`, 'ok', 100);
        btn.disabled = false; btn.textContent = '↻ 重新準備';
        return 'end';
      }
      if (m.type === 'error') {
        show(`下載 ${m.file} 失敗（${m.message}）。請確認網路連線後再按一次。`, 'err');
        btn.disabled = false;
        return 'end';
      }
    }).catch((err) => { show('準備失敗：' + err.message, 'err'); btn.disabled = false; });
  });

  checkStatus();
})();
