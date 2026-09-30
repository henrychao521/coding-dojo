# 🥋 程式練功房 coding-dojo

教國高中生「寫程式」的瀏覽器內練習平台：寫 code → 立即執行 → 自動評測過關。生活科技教學平台生態系的第三站（前兩站：livingtech-tools、pc13110-platform）。

## 特色
- **純前端零後端**：Python 用 [Pyodide](https://pyodide.org)（WASM）在瀏覽器執行。
- **自動評測**：每題多組測資斷言、無窮迴圈逾時保護（Worker `terminate()`）、過關依提示使用次數評 1–3 星。
- **開過一次後斷網可用**：Pyodide 核心與 CodeMirror 6 全部 vendor 進 repo，再加一層 Service Worker 快取。快取是「用到才存」，所以每台裝置要先在有網路時開過一次練習頁（約 12 MB）；要整間教室斷網上課，老師可在有網路時於每台學生裝置打開**教師後台 →「📶 離線準備」→「準備離線使用」**，一次預先下載 Python 執行環境與全部單元頁，並顯示進度與完成狀態。
- **全面觸控**：Pointer Events、按鈕 ≥44px，iPad 可用。
- **進度本機保存**：`localStorage`（key `coding_progress_v1`），可匯出 JSON、教師後台彙整與 CSV。

## 內容（第一波）
Python 軌 U1 輸出與變數 / U2 條件判斷 / U3 迴圈，每單元 7 練習 + 1 挑戰，共 24 題，情境皆取自生活科技（馬達轉速、感測器讀值、材料計算、電路功率…）。

第二波規劃：U4 函式 / U5 清單與字串 / U6 綜合小專題、Blockly 積木軌、JavaScript 軌、微控制器 Wokwi 橋接。

## 作答紀錄送到老師的 Google 試算表（選用）
規格見 `classroom-sheets/SPEC.md`（四個教學平台共用）。預設**完全不送**：`js/sheet-config.js` 的 `endpoint` 是空字串時，頁面不顯示任何告知或班級座號元件。
- 老師部署共用的 Apps Script（`Code.gs`，`CONFIG.PLATFORM = 'dojo'`、`CONFIG.ITEMS_URL` 指到本站 `assets/sheet-items.json`）後，把網頁應用程式網址貼到 `endpoint`，並遞增 `sw.js` 的 `CACHE`
- 每次「執行並評測」送一筆 `kind=exercise`：`q` = `U1.e3` 這種單元.題目代號、`t=code`、`a` = 通過測資數/總數（逾時 `timeout`）、`k` = 總數/總數、`ok` = 全部通過、`tries` = 本題第幾次提交、`meta` = 通過數、總數、秒數。**不送學生程式碼、輸出或錯誤訊息**
- 班級座號只在學生自己於右下角填寫時帶入（存 sessionStorage，關分頁就清掉）
- 改了題目或測資後重跑 `python3 tools/sheets/build_items.py`；測試 `python3 tools/sheets/test_sheet_log.py`（只用本機假 endpoint）

## 本機測試
```bash
python3 tools/serve.py 8733     # 然後開 http://localhost:8733
```
（用 `file://` 直接開會因 Worker／SW 限制無法評測，請務必用伺服器。）

## 技術
- 編輯器：CodeMirror 6（本機 esbuild 打包成 `vendor/codemirror/cm6.bundle.js`）
- 執行：Pyodide 0.29.4 核心（`vendor/pyodide/`，約 12MB）
- 無 build step；GitHub Pages（main 分支根目錄）直接部署。

© 珩宇老師製作
