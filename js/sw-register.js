// 註冊 Service Worker（只在首頁載入一次；scope = repo 根，控制全站）
// 本機用 file:// 開啟時會失敗，屬正常；用 tools/serve.py 或 GitHub Pages 才會註冊。
if ('serviceWorker' in navigator && location.protocol.startsWith('http')) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('sw.js').catch(err => {
      console.info('[coding-dojo] Service Worker 未註冊：', err && err.message);
    });
  });
}
