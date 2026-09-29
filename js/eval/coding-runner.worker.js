/* 程式練功房 — Python 評測 Worker（classic worker）
 * 在 Worker 內跑 Pyodide，所有比對邏輯都在 Python 端做，回傳純資料。
 * 無窮迴圈防護：runPython 是同步的，卡住時由 host 端 worker.terminate()
 * （GitHub Pages 不送 COOP/COEP，無法用 SharedArrayBuffer 中斷，只能 terminate）。
 *
 * 訊息協定：
 *   host → worker: { type:'init', pyodideJsUrl, indexURL }
 *                  { type:'run', id, mode:'stdout'|'func', code, funcName?, cases:[...] }
 *   worker → host: { type:'ready' } / { type:'progress', phase } / { type:'fatal', error }
 *                  { type:'result', id, ok, cases:[...], stdout, error }
 */
let pyodide = null;
let booting = null;

self.onmessage = async (e) => {
  const msg = e.data;
  if (msg.type === 'init') {
    boot(msg).catch(err => self.postMessage({ type: 'fatal', error: String(err) }));
  } else if (msg.type === 'run') {
    try {
      await booting;
      const out = runJob(msg);
      self.postMessage({ type: 'result', id: msg.id, ...out });
    } catch (err) {
      self.postMessage({ type: 'result', id: msg.id, ok: false, cases: [], stdout: '', error: shortErr(err) });
    }
  }
};

async function boot({ pyodideJsUrl, indexURL }) {
  if (booting) return booting;
  booting = (async () => {
    self.postMessage({ type: 'progress', phase: 'loading-runtime' });
    importScripts(pyodideJsUrl);
    pyodide = await loadPyodide({ indexURL });
    pyodide.runPython(HARNESS_PY);
    self.postMessage({ type: 'ready' });
  })();
  return booting;
}

// Python 端評測輔助層
const HARNESS_PY = `
import sys, io, json, math, base64, traceback

def __b64d(s):
    return base64.b64decode(s).decode('utf-8')

def _eq(a, b):
    # bool 是 int 的子類別（1 == True），要先擋：期望布林就必須回傳布林，
    # 否則 return 1 / return 0 也會被當成 True / False 過關
    if isinstance(a, bool) or isinstance(b, bool):
        return isinstance(a, bool) and isinstance(b, bool) and a == b
    if isinstance(a, (int, float)) and isinstance(b, (int, float)):
        return math.isclose(float(a), float(b), rel_tol=1e-6, abs_tol=1e-9)
    return a == b

class _CappedIO(io.StringIO):
    # 迴圈裡有 print 的無窮迴圈，在 3 秒逾時前就可能把輸出灌到數十 MB，低階平板的分頁會直接當掉；
    # 超過上限就丟例外提前結束
    LIMIT = 100000
    def write(self, s):
        if self.tell() + len(s) > self.LIMIT:
            raise RuntimeError("輸出超過 10 萬字，程式可能卡在會一直 print 的迴圈裡")
        return super().write(s)

def _run_stdout(user_code, setup_code):
    ns = {}
    old = sys.stdout
    buf = _CappedIO()
    sys.stdout = buf
    try:
        if setup_code:
            exec(setup_code, ns)
        exec(user_code, ns)
    finally:
        sys.stdout = old
    return buf.getvalue()

def _call_func(user_code, func_name, args):
    ns = {}
    old = sys.stdout
    sys.stdout = _CappedIO()      # 函式模式不比對輸出，但一樣要擋住無窮 print
    try:
        exec(user_code, ns)
        if func_name not in ns or not callable(ns[func_name]):
            raise NameError("找不到函式 " + func_name + "（請確認函式名稱拼寫正確）")
        return ns[func_name](*args)
    finally:
        sys.stdout = old

def _run_func_case(user_code, func_name, args, expected):
    r = _call_func(user_code, func_name, args)
    return (_eq(r, expected), repr(r))
`;

function runJob(job) {
  const { mode, code, funcName, cases } = job;
  const results = [];
  let fullStdout = '';
  let hadError = null;

  if (mode === 'stdout') {
    for (const c of cases) {
      try {
        const out = String(pyodide.runPython(`_run_stdout(${pyB64(code)}, ${pyB64(c.setup || '')})`));
        if (!fullStdout) fullStdout = out;
        const pass = normalize(out) === normalize(c.expected);
        results.push({ pass, label: c.label || '輸出比對', expected: c.expected, got: out });
      } catch (err) {
        hadError = shortErr(err);
        results.push({ pass: false, label: c.label || '輸出比對', expected: c.expected, got: '', error: hadError });
        break;
      }
    }
  } else { // func
    for (const c of cases) {
      let tup = null;
      try {
        tup = pyodide.runPython(
          `_run_func_case(${pyB64(code)}, ${pyB64(funcName)}, ${pyJson(c.args || [])}, ${pyJson(c.expected)})`
        );
        const ok = tup.get(0);
        const gotRepr = String(tup.get(1));
        results.push({ pass: !!ok, label: caseLabel(c, funcName), expected: JSON.stringify(c.expected), got: gotRepr });
      } catch (err) {
        hadError = shortErr(err);
        results.push({ pass: false, label: caseLabel(c, funcName), expected: JSON.stringify(c.expected), got: '', error: hadError });
        break;
      } finally {
        if (tup && tup.destroy) tup.destroy();
      }
    }
  }

  const ok = results.length > 0 && results.every(r => r.pass);
  return { ok, cases: results, stdout: fullStdout, error: hadError };
}

function caseLabel(c, fn) {
  const a = (c.args || []).map(v => JSON.stringify(v)).join(', ');
  return `${fn}(${a})`;
}

// ── 把 JS 值安全帶進 Python（base64，避免任何引號/換行/跳脫問題）──
function b64(str) {
  const bytes = new TextEncoder().encode(String(str));
  let bin = '';
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin);
}
function pyB64(rawStr) { return `__b64d("${b64(rawStr)}")`; }              // → Python str
function pyJson(value) { return `json.loads(__b64d("${b64(JSON.stringify(value))}"))`; } // → Python 物件

function normalize(s) {
  return String(s).replace(/\r\n/g, '\n').replace(/[ \t]+\n/g, '\n').replace(/\n+$/g, '').trim();
}

function shortErr(err) {
  const m = String((err && err.message) || err);
  const lines = m.split('\n').map(s => s.trim()).filter(Boolean);
  // 取 traceback 最後一行（Python 例外訊息最有用的部分）
  const last = lines[lines.length - 1] || m;
  return last.length > 240 ? last.slice(0, 240) + '…' : last;
}
