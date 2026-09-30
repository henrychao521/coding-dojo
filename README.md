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
