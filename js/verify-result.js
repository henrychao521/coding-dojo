// 實測結果（2026-06-12，本機 tools/serve.py + 瀏覽器自動化實測）。
window.VERIFY = {
  summary: '評測引擎 8 組斷言全數正確（含答錯、函式名拼錯 NameError、浮點容差、含換行字串）；無窮迴圈於 3 秒逾時並 terminate Worker、背景重啟後可續測；UI 串接（編輯器→執行→3★彈窗→進度寫入）正常；首頁／教師後台／dev-log／練習頁 console 全零錯誤；iPad（768px）按鈕皆 44px、版面正確堆疊；Service Worker 註冊啟用。',
  items: [
    'stdout 正確/答錯比對正確',
    'stdout 多組 setup 測資正確',
    'func 回傳多組測資斷言正確',
    '浮點 isclose 容差比較正確',
    '函式名拼錯 → 友善 NameError',
    '無窮迴圈 3 秒逾時 + Worker terminate',
    '逾時後背景重啟可續測（5/5 過）',
    'UI：執行→3★彈窗→localStorage 寫入',
    '教師後台讀本機進度（1/24・★3）',
    '全頁 console 零錯誤',
    'iPad 768px：按鈕 44px、單欄堆疊',
    'Service Worker 註冊啟用、scope 全站',
  ],
};
