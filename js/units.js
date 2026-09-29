// 程式練功房 — 單元 metadata（全站唯一真實來源）
// 首頁地圖、教師後台、練習頁都讀這份；exCount 必須與該單元 problems.js 的練習題數一致。
// 每單元 = exCount 道練習題 + 1 道挑戰題。
window.DOJO_UNITS = [
  {
    id: 'U1', slug: 'u1-output', track: 'python',
    title: '輸出與變數', emoji: '🖨️', color: '#FF7A00',
    exCount: 7, challenge: true, locked: false,
    blurb: 'print 輸出、變數、數值與字串運算、f-string 格式化。',
    concepts: ['print() 輸出', '變數命名與指定', '數值運算', '字串相接', 'f-string 格式化', '型別轉換 int()/str()'],
  },
  {
    id: 'U2', slug: 'u2-condition', track: 'python',
    title: '條件判斷', emoji: '🔀', color: '#2EBD66',
    exCount: 7, challenge: true, locked: false,
    blurb: 'if / elif / else、比較與邏輯運算、邊界條件。',
    concepts: ['if / elif / else', '比較運算子', '邏輯 and / or / not', '範圍判斷', '邊界值處理'],
  },
  {
    id: 'U3', slug: 'u3-loop', track: 'python',
    title: '迴圈', emoji: '🔁', color: '#2C5FBF',
    exCount: 7, challenge: true, locked: false,
    blurb: 'for / while、range、累加器、巢狀迴圈、無窮迴圈的代價。',
    concepts: ['for + range', 'while 迴圈', '累加器模式', '計數與找極值', '巢狀迴圈', '避免無窮迴圈'],
  },
  // ── 第二波（規劃中，地圖上顯示為鎖定）──
  {
    id: 'U4', slug: 'u4-function', track: 'python',
    title: '函式', emoji: '🧩', color: '#9B59D9',
    exCount: 7, challenge: true, locked: true,
    blurb: '定義函式、參數與回傳值、把重複邏輯封裝起來。',
    concepts: ['def 定義函式', '參數', 'return 回傳值', '函式組合'],
  },
  {
    id: 'U5', slug: 'u5-list-string', track: 'python',
    title: '清單與字串', emoji: '📋', color: '#0891B2',
    exCount: 7, challenge: true, locked: true,
    blurb: 'list 操作、走訪、字串處理、資料整理。',
    concepts: ['list 建立與索引', '走訪清單', '字串切片', '資料統計'],
  },
  {
    id: 'U6', slug: 'u6-project', track: 'python',
    title: '綜合小專題', emoji: '🛠️', color: '#DC2626',
    exCount: 6, challenge: true, locked: true,
    blurb: '把前五單元的觀念整合成一個生科情境小專題。',
    concepts: ['整合應用', '問題拆解', '逐步建構'],
  },
];

// 依 id 或 slug 取單元
window.DOJO_UNIT = function (key) {
  return window.DOJO_UNITS.find(u => u.id === key || u.slug === key) || null;
};
