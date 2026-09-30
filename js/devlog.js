/* 開發紀錄資料 — 維護規則：每個開發段落新增一筆，含三段式（需求逐字稿 / 決策脈絡 / 執行產出），
   每次更新連同程式碼一起 commit。新段落往陣列「最後面」加。 */
window.DEVLOG = [
  {
    tag: '段落 0', date: '2026-06-12', title: '完整規劃與技術選型',
    verbatim: '幫我建一個新的「程式練功房」教學網站（repo 名：coding-dojo），這是我教學平台生態系的第三個站。教國高中生「寫程式」的練習平台：瀏覽器內寫 code、立即執行、自動評測過關。Python 用 Pyodide（WASM）執行、JavaScript 用 Web Worker 沙箱執行……Pyodide 體積大，請先評估「完整 vendor」vs「CDN＋Service Worker 首次載入後快取」哪個適合教室，給我建議再動工。',
    context: '研讀既有兩站（livingtech-tools／pc13110-platform）的共用架構、進度系統與教師後台彙整格式。針對 Pyodide 載入提出三方案比較，建議「完整 vendor 核心 + Service Worker 快取」——因 GitHub Pages 不送 COOP/COEP，無窮迴圈只能靠 Worker terminate；CDN 首次必須連網與斷網教室原則衝突。題目評測法 U1 用 stdout 比對、U2 起改函式多組測資。',
    decisions: ['Pyodide 採「完整 vendor 核心 + SW 快取」', '無窮迴圈防護 = Worker terminate（非 SharedArrayBuffer）', 'CodeMirror 6 本機 esbuild 打包成單檔 vendor', '進度 envelope 對齊 livingtech，tools.coding'],
    outputs: ['完整規劃書（架構／題目清單／檔案結構）', '使用者確認三項決策後動工'],
  },
  {
    tag: '段落 1', date: '2026-06-12', title: 'Vendor 重量級函式庫',
    verbatim: '沒問題，先開工看看成果',
    context: '下載 Pyodide 0.29.4 核心 tarball（pyodide-core，僅含 runtime 不含科學套件），解壓後只取執行入門 Python 必要的 5 個檔。CodeMirror 6 在本機建臨時 npm 專案、用 esbuild 打包成單一 IIFE（暴露 window.CM6），部署端維持零建置。',
    decisions: ['Pyodide 版本鎖 0.29.4（314.0.0 是 alpha 不用）', '只 vendor 核心：總 12MB，遠低於 GitHub 100MB 單檔限', 'CM6 自訂淺色高亮配合全站橘藍視覺'],
    outputs: ['vendor/pyodide/（12MB：wasm/asm.js/stdlib/lock/js）', 'vendor/codemirror/cm6.bundle.js（486KB）'],
  },
  {
    tag: '段落 2', date: '2026-06-12', title: '共用層與自動評測引擎',
    verbatim: '（延續段落 0 規格：自動評測——每題多組測資斷言、無窮迴圈逾時保護 worker terminate、過關評 1–3 星）',
    context: '沿用 livingtech 的 css 設計 token 與 audio.js。新增 coding 專屬進度系統（key=coding_progress_v1，保留最佳星數）、dojo.css 樣式層。評測引擎分兩層：Worker 內跑 Pyodide 並在 Python 端做比對（stdout 模式 / 函式回傳多組測資，數值容差比較）；主控端用 setTimeout + worker.terminate() 攔截無窮迴圈，並背景重啟暖 Worker。值用 base64 安全帶進 Python，避免引號跳脫問題。',
    decisions: ['星級規則：全過後依提示次數 0→3★、1→2★、≥2→1★', '逾時預設 3 秒，逾時即 terminate 並重啟', 'func 模式比對在 Python 端用 math.isclose 容差'],
    outputs: ['js/units.js（單元唯一真實來源）、js/main.js（進度＋首頁儀表板）', 'css/dojo.css', 'js/eval/coding-runner.worker.js、runner-host.js、practice.js'],
  },
  {
    tag: '段落 3', date: '2026-06-12', title: 'Python 軌 U1–U3 內容',
    verbatim: '（段落 0 規格：第一波先做 Python 軌前三單元，每單元教學頁＋6–8 練習＋1 挑戰，情境用生活科技場景不要純數學）',
    context: '三單元各一教學頁（觀念講解＋純 JS 互動示範，不載 Pyodide 以保持地圖→教學頁輕快）＋題庫（7 練習＋1 挑戰＝24 題）＋共用練習頁外殼。題目情境全用馬達轉速、感測器讀值、材料計算、電路功率、輸送帶燈號等生科場景。',
    decisions: ['U1 stdout 模式以 setup 注入不同變數值產生多組測資', 'U2/U3 函式模式，挑戰題含「避免無窮迴圈」教學與逾時實測點', '教學頁互動示範用 range input（觸控友善）'],
    outputs: ['units/u1-output、u2-condition、u3-loop（各 index 教學頁＋practice.html＋problems.js）', '共 24 題可玩可評測'],
  },
  {
    tag: '段落 4', date: '2026-06-12', title: '首頁／教師後台／開發紀錄／SW',
    verbatim: '（段落 0 規格：index 單元地圖＋進度儀表板；teacher 本機進度＋JSON 匯入彙整＋CSV；dev-log 三段式維護規則；SW 首次載入後快取）',
    context: '首頁單元地圖由 DOJO_UNITS 動態產生（鎖定卡顯示第二波）。教師後台三功能：本機進度表、個人進度匯出/還原、班級多檔彙整＋CSV，envelope 對齊 livingtech 的 tools.coding。Service Worker：HTML network-first、其餘 cache-first，讓 12MB Pyodide 切換單元不重抓、斷網可用。',
    decisions: ['首頁不載 Pyodide（點進練習頁才暖機）', 'SW 只在首頁註冊一次、scope=repo 根控全站', 'teacher 匯出含 module1..6 旗標＋unitStars＋units 明細'],
    outputs: ['index.html、teacher.html＋js/teacher.js、dev-log.html＋js/devlog.js', 'sw.js、js/sw-register.js'],
  },
  {
    tag: '段落 5', date: '2026-06-12', title: '瀏覽器自動化實測',
    verbatim: '（段落 0 規格：完成後實測——每題評測正確含答錯／逾時案例、console 零錯誤、iPad viewport 觸控）',
    context: '用 tools/serve.py 起站、瀏覽器自動化驅動實測。直接打評測引擎跑 8 組斷言（stdout 正確/答錯、函式多組測資、浮點容差、含換行字串、函式名拼錯例外），再測無窮迴圈逾時與 terminate 後重啟。最後走完整 UI（編輯器→執行→星等彈窗→進度寫入）與各頁 console、iPad 768px 觸控版面、Service Worker 註冊。',
    decisions: ['確認 GitHub Pages 無 COOP/COEP 下 terminate 逾時方案可行', '保留實測數據於 verify-result.js 供開發紀錄頁顯示'],
    outputs: ['8 組評測斷言全綠、逾時 3 秒攔截、重啟後續測 5/5', 'UI 串接拿 3★並寫入 localStorage、全頁 console 零錯誤', 'iPad 44px 觸控達標、SW 啟用；驗收通過'],
  },
  {
    tag: '段落 6', date: '2026-09-28', title: '評測修正：布林題不再接受 1／0',
    verbatim: '（2026-09-28 跨平台審查：U2 布林題的 _eq 讓 return 1 也被判成 True 過關）',
    context: 'Python 的 bool 是 int 的子類別，1 == True 成立。舊版 _eq 只要任一邊是 bool 就直接用 ==，學生在 is_overheat 等題寫 return 1／return 0 也會拿到星星，沒有真正檢查「回傳布林值」這個 U2 核心觀念。',
    decisions: ['任一邊是 bool 時，兩邊都必須是 bool 才比較', 'Service Worker 快取名 v2 → v3，讓已開過站的學生拿到新評測程式'],
    outputs: ['js/eval/coding-runner.worker.js：_eq 布林分支改為型別嚴格比對', '影響 U2 e1 is_overheat、e3 in_safe_range、e4 enough_material、e6 low_voltage_warn；其餘題型不變', 'sw.js：CACHE = coding-dojo-v3'],
  },
  {
    tag: '段落 7', date: '2026-09-29', title: '第二輪審查（異家族模型）修正',
    verbatim: '（2026-09-29 第二輪審查：另一家族模型對 9/28 前原始碼的 15 條發現，逐條查證後修正）',
    context: '逐條實測：切換題目會用 starter 蓋掉學生程式；斷網時子目錄頁回退成根目錄 index.html，相對路徑全錯；無窮 print 在 3 秒逾時前可灌爆記憶體；提示次數被最新一次覆寫；U1 教學頁缺字串相接、U2/U3 用函式作答卻沒說明 def／return、U3「巢狀迴圈」其實只有一層。CSV 匯出沒有 BOM 一條查證為誤判（原始碼第一版就有 U+FEFF）。',
    decisions: ['切題保留每題程式碼（本次作答期間）', '斷網回退改為獨立離線頁', 'stdout 上限 10 萬字', '函式作答方式在 U2 教學頁先講三件事，不提前整個 U4', 'Pyodide 預先快取與單元結業定義列為待決定，未動'],
    outputs: ['js/eval/practice.js、sw.js、js/eval/coding-runner.worker.js、js/main.js', 'units/u1-output（字串相接小節、指定、e2／e4 敘述）、u2-condition（作答方式）、u3-loop（巢狀迴圈、e6 starter）', 'sw.js：CACHE = coding-dojo-v4'],
  },
  {
    tag: '段落 8', date: '2026-09-30', title: '離線使用：改寫說明＋教師後台「準備離線使用」',
    verbatim: '（2026-09-30 第二輪待決定 R2-13，選 A＋C：README／首頁「斷網可用」改寫成「開過一次後斷網可用」；教師後台加「準備離線使用」按鈕，預先下載 Pyodide 與各單元練習頁並顯示進度與完成）',
    context: '審查指出首頁與 README 宣稱「斷網教室可用」，但 Service Worker 是「用到才存」：約 12 MB 的 Python 執行環境要開過一次練習頁才會存進裝置，沒開過的單元斷網時只會看到離線說明頁。不採「安裝時就預載」（每位訪客首次多 12 MB），改由老師在需要斷網上課時於每台學生裝置按一次。',
    decisions: ['說明文字改為「開過一次後斷網可用」（首頁徽章、README、練習頁註解）', '預載清單 OFFLINE_FILES 與快取名只維護在 sw.js 一處；教師後台透過 MessageChannel 請 SW 下載並回報檔案數與位元組進度', '下載用 cache: reload 繞過 HTTP 快取；存入前拿掉 Content-Encoding／Content-Length，避免解壓後內容與標頭不符', 'Service Worker 快取名 v4 → v5'],
    outputs: ['sw.js（OFFLINE_FILES、offline-status／offline-prepare 訊息、離線頁補一句教師後台）、js/offline-prep.js（新）、teacher.html（「📶 離線準備」分頁）', 'Playwright 驗收：預載 33 個檔案 12.4 MB → 關伺服器＋context 斷網 → 開沒開過的 U2、U3 練習頁，Pyodide 就緒並執行 print(sum(range(1,11))) 得 55；對照組未預載時斷網只得到離線頁', 'sw.js：CACHE = coding-dojo-v5'],
  },
];
