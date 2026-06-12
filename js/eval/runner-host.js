/* 程式練功房 — 評測主控（主執行緒）
 * 負責：建立／重啟 Pyodide Worker、逾時 terminate、保持一個「暖」Worker。
 * 對外：window.DojoRunner
 *   DojoRunner.prewarm(onPhase)          先把 Pyodide 載起來（點進練習頁就呼叫）
 *   DojoRunner.run(spec, opts)           執行＋評測；回傳 Promise<result>
 *      spec = { mode:'stdout'|'func', code, funcName?, cases:[...] }
 *      opts = { timeoutMs=3000, onState }
 *      result = { ok, cases, stdout, error, timeout }
 */
(function () {
  const ABS = (rel) => new URL(rel, location.href).href;

  function rootPrefix() {
    const s = document.querySelector('script[src$="runner-host.js"]');
    const m = s && s.getAttribute('src').match(/^(.*?)js\/eval\/runner-host\.js$/);
    return m ? m[1] : (window.dojoRootPrefix ? window.dojoRootPrefix() : '');
  }

  const Runner = {
    worker: null,
    ready: false,
    readyPromise: null,
    booting: false,
    busy: false,
    _phaseCb: null,

    _urls() {
      const p = rootPrefix();
      return {
        workerUrl: ABS(p + 'js/eval/coding-runner.worker.js'),
        pyodideJsUrl: ABS(p + 'vendor/pyodide/pyodide.js'),
        indexURL: ABS(p + 'vendor/pyodide/'),
      };
    },

    prewarm(onPhase) {
      if (onPhase) this._phaseCb = onPhase;
      if (this.ready) return Promise.resolve();
      if (this.readyPromise) return this.readyPromise;
      const { workerUrl, pyodideJsUrl, indexURL } = this._urls();
      this.booting = true;
      this.worker = new Worker(workerUrl);
      this.readyPromise = new Promise((resolve, reject) => {
        this._pendingResolve = null;
        this.worker.onmessage = (e) => this._onMessage(e, resolve, reject);
        this.worker.onerror = (err) => {
          if (!this.ready) reject(new Error('Worker 載入失敗：' + (err.message || err.filename || '未知')));
        };
        this.worker.postMessage({ type: 'init', pyodideJsUrl, indexURL });
      });
      return this.readyPromise;
    },

    _onMessage(e, resolveReady, rejectReady) {
      const m = e.data;
      if (m.type === 'progress') { if (this._phaseCb) this._phaseCb(m.phase); return; }
      if (m.type === 'ready') {
        this.ready = true; this.booting = false;
        if (this._phaseCb) this._phaseCb('ready');
        resolveReady && resolveReady();
        return;
      }
      if (m.type === 'fatal') {
        this.ready = false; this.booting = false;
        rejectReady && rejectReady(new Error(m.error || 'Pyodide 初始化失敗'));
        return;
      }
      if (m.type === 'result' && this._pendingResolve && m.id === this._pendingId) {
        const done = this._pendingResolve;
        this._pendingResolve = null; this._pendingId = null;
        clearTimeout(this._timer);
        this.busy = false;
        done({ ...m, timeout: false });
      }
    },

    isReady() { return this.ready; },

    async run(spec, opts = {}) {
      const timeoutMs = opts.timeoutMs || 3000;
      if (this.busy) return { ok: false, cases: [], stdout: '', error: '上一次評測還在進行中', timeout: false };
      if (!this.ready) {
        if (opts.onState) opts.onState('booting');
        await this.prewarm(opts.onState ? (ph) => opts.onState(ph) : null);
      }
      if (opts.onState) opts.onState('running');
      this.busy = true;
      const id = 'r' + Date.now() + Math.floor(performance.now());
      this._pendingId = id;

      return new Promise((resolve) => {
        this._pendingResolve = resolve;
        this._timer = setTimeout(() => {
          // 逾時：很可能有無窮迴圈 → 殺掉 Worker，背景重啟一個暖的
          this._pendingResolve = null; this._pendingId = null;
          this.busy = false;
          this._hardReset();
          resolve({ ok: false, cases: [], stdout: '', error: '執行逾時（超過 ' + (timeoutMs / 1000) + ' 秒，可能寫出了無窮迴圈）', timeout: true });
        }, timeoutMs);
        this.worker.postMessage({ type: 'run', id, mode: spec.mode, code: spec.code, funcName: spec.funcName, cases: spec.cases });
      });
    },

    _hardReset() {
      try { this.worker && this.worker.terminate(); } catch (e) {}
      this.worker = null; this.ready = false; this.readyPromise = null;
      // 立即背景重啟，讓下一次 run 不用乾等
      setTimeout(() => this.prewarm(this._phaseCb), 0);
    },
  };

  window.DojoRunner = Runner;
})();
