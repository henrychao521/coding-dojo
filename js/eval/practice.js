/* 程式練功房 — 練習頁通用控制器
 * 依賴（頁面需先載入）：
 *   - vendor/codemirror/cm6.bundle.js  → window.CM6
 *   - js/eval/runner-host.js           → window.DojoRunner
 *   - js/units.js, js/main.js          → DOJO_UNITS / window.DOJO
 *   - 該單元 problems.js               → window.PROBLEMS = { exercises:[...], challenge:{...} }
 * 頁面需設定 window.UNIT_ID（如 'U1'）。
 */
(function () {
  const UNIT_ID = window.UNIT_ID;
  const unit = window.DOJO_UNIT(UNIT_ID);
  const P = window.PROBLEMS;
  const problems = P.exercises.concat([Object.assign({ id: 'challenge', isChallenge: true }, P.challenge)]);

  // 星級規則：全部測資通過後，依提示使用次數給星（0→3、1→2、≥2→1）
  function starsFor(hints) { return hints <= 0 ? 3 : hints === 1 ? 2 : 1; }

  // 每題的暫存狀態（本次 session）；code = 切換題目前編輯器裡的內容，切回來時還原
  // t0 = 本次開頁第一次看到這一題的時間（作答紀錄的秒數）
  const state = problems.map(() => ({ hints: 0, attempts: 0, code: null, t0: 0 }));
  let cur = 0;
  let editor = null;
  const editorCompartments = {};

  // ── 建 CodeMirror 編輯器 ──
  function makeEditor(host, doc) {
    const C = window.CM6;
    const langExt = unit.track === 'javascript' ? C.javascript() : C.python();
    const extensions = [
      C.lineNumbers(),
      C.highlightActiveLineGutter(),
      C.highlightSpecialChars(),
      C.history(),
      C.drawSelection(),
      C.indentUnit.of('    '),
      C.bracketMatching(),
      C.closeBrackets(),
      C.autocompletion(),
      C.highlightActiveLine(),
      C.syntaxHighlighting(C.dojoHighlight),
      C.syntaxHighlighting(C.defaultHighlightStyle, { fallback: true }),
      langExt,
      C.keymap.of([C.indentWithTab, ...C.closeBracketsKeymap, ...C.defaultKeymap, ...C.historyKeymap]),
      C.EditorView.lineWrapping,
    ];
    const stateObj = C.EditorState.create({ doc, extensions });
    return new C.EditorView({ state: stateObj, parent: host });
  }

  function setEditorDoc(doc) {
    const C = window.CM6;
    editor.dispatch({ changes: { from: 0, to: editor.state.doc.length, insert: doc } });
  }
  function getCode() { return editor.state.doc.toString(); }

  // ── 渲染題目導覽 pills ──
  const navEl = document.getElementById('probNav');
  function renderNav() {
    const p = window.DOJO.loadProgress();
    const u = (p.units && p.units[UNIT_ID]) || { ex: {}, challenge: null };
    navEl.innerHTML = '';
    problems.forEach((prob, i) => {
      const pill = document.createElement('button');
      pill.className = 'prob-pill' + (prob.isChallenge ? ' challenge' : '');
      pill.type = 'button';
      pill.textContent = prob.isChallenge ? '★挑戰' : ('e' + (i + 1));
      pill.setAttribute('aria-current', i === cur ? 'true' : 'false');
      const rec = prob.isChallenge ? u.challenge : (u.ex && u.ex['e' + (i + 1)]);
      if (rec && rec.passed) pill.classList.add('passed');
      pill.addEventListener('pointerup', () => { if (i !== cur) { goTo(i); } });
      navEl.appendChild(pill);
    });
  }

  // ── 渲染目前題目 ──
  const titleEl = document.getElementById('probTitle');
  const tagEl = document.getElementById('probTag');
  const descEl = document.getElementById('probDesc');
  const examplesEl = document.getElementById('probExamples');
  const hintZone = document.getElementById('hintZone');
  const resultsEl = document.getElementById('results');
  const progLabel = document.getElementById('progLabel');

  // 切題前先把目前寫的程式存起來，否則 renderProblem 會用 starter 蓋掉
  function goTo(i) {
    state[cur].code = getCode();
    cur = i;
    renderProblem();
  }

  function renderProblem() {
    const prob = problems[cur];
    if (!state[cur].t0) state[cur].t0 = Date.now();
    tagEl.className = 'pp-tag' + (prob.isChallenge ? ' challenge' : '');
    tagEl.textContent = prob.isChallenge ? '挑戰題' : ('練習 ' + (cur + 1) + ' / ' + P.exercises.length);
    titleEl.textContent = prob.title;
    descEl.innerHTML = prob.desc;
    // 範例表
    if (prob.examples && prob.examples.length) {
      let h = '<div class="pp-examples"><table><thead><tr><th>輸入 / 情境</th><th>預期結果</th></tr></thead><tbody>';
      prob.examples.forEach(ex => { h += `<tr><td>${escapeHtml(ex.in)}</td><td>${escapeHtml(ex.out)}</td></tr>`; });
      h += '</tbody></table></div>';
      examplesEl.innerHTML = h;
    } else examplesEl.innerHTML = '';
    // 編輯器內容：這一題寫過就還原，沒寫過才放 starter
    setEditorDoc(state[cur].code != null ? state[cur].code : (prob.starter || ''));
    // 提示區（已揭露的提示）
    renderHints();
    // 清空結果
    resultsEl.innerHTML = '';
    resultsEl.style.display = 'none';
    updateProgLabel();
    renderNav();
    updateHintBtn();
  }

  function renderHints() {
    const prob = problems[cur];
    const shown = state[cur].hints;
    hintZone.innerHTML = '';
    for (let i = 0; i < shown && i < (prob.hints || []).length; i++) {
      const d = document.createElement('div');
      d.className = 'hint-item';
      d.innerHTML = `💡 提示 ${i + 1}：${prob.hints[i]}`;
      hintZone.appendChild(d);
    }
  }

  function updateProgLabel() {
    const p = window.DOJO.loadProgress();
    const st = window.DOJO.unitStats(p, unit);
    progLabel.textContent = `本單元 ${st.doneProblems}/${st.totalProblems} 題・★${st.stars}`;
  }

  // ── 提示按鈕 ──
  const hintBtn = document.getElementById('btnHint');
  function updateHintBtn() {
    const prob = problems[cur];
    const total = (prob.hints || []).length;
    const shown = state[cur].hints;
    if (shown >= total) { hintBtn.disabled = true; hintBtn.textContent = '💡 沒有更多提示'; }
    else { hintBtn.disabled = false; hintBtn.textContent = `💡 看提示（${shown}/${total}，會降星）`; }
  }
  hintBtn.addEventListener('pointerup', () => {
    const prob = problems[cur];
    if (state[cur].hints < (prob.hints || []).length) {
      state[cur].hints++;
      renderHints();
      updateHintBtn();
      if (window.SoundFX) SoundFX.pop();
    }
  });

  // ── 重設按鈕 ──
  document.getElementById('btnReset').addEventListener('pointerup', () => {
    setEditorDoc(problems[cur].starter || '');
    if (window.SoundFX) SoundFX.click();
  });

  // ── 執行 / 評測 ──
  const runBtn = document.getElementById('btnRun');
  runBtn.addEventListener('pointerup', runCurrent);

  async function runCurrent() {
    const prob = problems[cur];
    state[cur].attempts++;
    runBtn.disabled = true;
    runBtn.textContent = '⏳ 執行中…';
    resultsEl.style.display = 'block';
    resultsEl.innerHTML = `<div class="results-head"><span class="rh-title">執行結果</span></div>
      <div class="pyo-loading"><span class="pyo-spin"></span><span id="runPhase">準備執行環境…</span></div>`;

    const spec = { mode: prob.mode, code: getCode(), funcName: prob.funcName, cases: prob.cases };
    const res = await window.DojoRunner.run(spec, {
      timeoutMs: prob.timeoutMs || 3000,
      onState: (ph) => {
        const el = document.getElementById('runPhase');
        if (!el) return;
        if (ph === 'loading-runtime' || ph === 'booting') el.textContent = '首次載入 Python 執行環境（約數秒）…';
        else if (ph === 'running') el.textContent = '執行你的程式…';
      },
    });

    runBtn.disabled = false;
    runBtn.textContent = '▶ 執行並評測';
    renderResults(res, prob);
    logSubmission(prob, res, state[cur]);

    if (res.ok) {
      const stars = starsFor(state[cur].hints);
      const improved = window.DOJO.recordResult(UNIT_ID, prob.id, {
        passed: true, stars, hints: state[cur].hints, attempts: 1,
      });
      if (window.SoundFX) SoundFX.star(stars);
      showStarModal(stars, prob, improved);
      renderNav();
      updateProgLabel();
    } else {
      if (window.SoundFX) { res.timeout ? SoundFX.warn() : SoundFX.error(); }
    }
  }

  function renderResults(res, prob) {
    let h = `<div class="results-head"><span class="rh-title">執行結果</span>`;
    if (!res.timeout) {
      const pass = res.cases.filter(c => c.pass).length;
      const cls = res.ok ? 'ok' : (pass > 0 ? 'timeout' : 'bad');
      h += `<span class="rh-summary" style="color:var(--${res.ok ? 'ok' : 'bad'})">通過 ${pass} / ${res.cases.length} 測資</span>`;
    }
    h += `</div>`;

    if (res.timeout) {
      h += `<div class="result-row timeout"><span class="rr-ico">⏱️</span><div><b>執行逾時</b><div class="rr-detail">${escapeHtml(res.error)}<br>檢查迴圈的結束條件是否一定會成立。</div></div></div>`;
    } else {
      // stdout 模式：先顯示一次實際輸出
      if (prob.mode === 'stdout' && res.cases.length) {
        const first = res.cases[0];
        h += `<div class="stdout-box${first.got ? '' : ' empty-out'}">${first.got ? escapeHtml(first.got) : '（沒有任何輸出）'}</div>`;
      }
      res.cases.forEach((c, i) => {
        const ico = c.pass ? '✅' : (c.error ? '🐞' : '❌');
        const cls = c.pass ? 'pass' : 'fail';
        let detail = '';
        if (c.error) {
          detail = `<div class="rr-detail" style="color:var(--bad)">錯誤：${escapeHtml(c.error)}</div>`;
        } else if (!c.pass) {
          detail = `<div class="rr-detail">預期 <b>${escapeHtml(trimRepr(c.expected))}</b>，你的結果 <b>${escapeHtml(trimRepr(c.got))}</b></div>`;
        }
        h += `<div class="result-row ${cls}"><span class="rr-ico">${ico}</span><div><div>測資 ${i + 1}：<code>${escapeHtml(c.label)}</code></div>${detail}</div></div>`;
      });
    }
    resultsEl.innerHTML = h;
  }

  // ── 作答紀錄 → 老師的 Google 試算表（js/sheet-log.js；sheet-config.js 的 endpoint 空就完全不送）──
  // 每次「執行並評測」送一筆 kind=exercise，只含一題：
  //   q = 單元代號.題目 id（例 U1.e3、U2.challenge），t = code，ok = 全部測資通過，
  //   a = 通過測資數/總數（逾時記 timeout），k = 總數/總數（a 等於 k 才是 ok），
  //   tries = 本次開頁這一題第幾次提交，meta = 通過數、總數、這一題看了幾秒。
  // 不送學生程式碼、輸出內容或錯誤訊息。
  function sheetCore(prob) {
    // 指紋內容和 tools/sheets/build_items.py 相同：題名＋說明＋評測方式、每組測資的 JSON
    return {
      type: 'code',
      stem: prob.title + '\n' + prob.desc + '\n' + prob.mode + (prob.funcName ? ':' + prob.funcName : ''),
      items: (prob.cases || []).map(c => JSON.stringify(c)),
    };
  }
  function logSubmission(prob, res, st) {
    if (!window.SheetLog || !SheetLog.enabled()) return;
    const total = (prob.cases || []).length;
    const pass = res.timeout ? 0 : (res.cases || []).filter(c => c.pass).length;
    const ok = !!res.ok && !res.timeout;
    const a = res.timeout ? 'timeout' : pass + '/' + total;
    const sec = Math.round((Date.now() - (st.t0 || Date.now())) / 1000);
    const tries = st.attempts;
    SheetLog.hash(sheetCore(prob)).then(h => SheetLog.send({
      page: 'units/' + unit.slug + '/practice', kind: 'exercise',
      items: [{ q: UNIT_ID + '.' + prob.id, h, t: 'code', ok: ok ? 1 : 0, a, k: total + '/' + total, tries }],
      meta: { score: pass, max: total, sec },
    }));
  }

  // ── 過關星等彈窗 ──
  let modal = null;
  function showStarModal(stars, prob, improved) {
    if (!modal) {
      modal = document.createElement('div');
      modal.className = 'star-modal';
      document.body.appendChild(modal);
    }
    const isLast = cur >= problems.length - 1;
    const starStr = [1, 2, 3].map(n => `<span class="${n <= stars ? 'on' : 'off'}">★</span>`).join('');
    const subtitle = stars === 3 ? '完美！一次就過、沒看提示。'
      : stars === 2 ? '做得好！用了 1 個提示。'
        : '過關！多練幾次就能拿三星。';
    modal.innerHTML = `
      <div class="star-card">
        <div class="sc-emoji">${prob.isChallenge ? '🏆' : '🎉'}</div>
        <h2>${prob.isChallenge ? '挑戰成功！' : '通過了！'}</h2>
        <div class="sc-stars">${starStr}</div>
        <div class="sc-msg">${subtitle}${improved ? '' : '（本題之前已通過，保留最佳成績）'}</div>
        <div class="sc-actions">
          ${isLast ? `<a class="sc-next" href="../../index.html">回單元地圖 →</a>` : `<button class="sc-next" type="button">下一題 →</button>`}
          <button class="sc-stay" type="button">留在本題</button>
        </div>
      </div>`;
    requestAnimationFrame(() => modal.classList.add('show'));
    const close = () => modal.classList.remove('show');
    modal.querySelector('.sc-stay').addEventListener('pointerup', close);
    const next = modal.querySelector('button.sc-next');
    if (next) next.addEventListener('pointerup', () => { close(); if (cur < problems.length - 1) goTo(cur + 1); });
    modal.addEventListener('pointerup', (e) => { if (e.target === modal) close(); });
  }

  // ── 工具 ──
  function escapeHtml(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c])); }
  function trimRepr(s) { s = String(s); return s.length > 80 ? s.slice(0, 80) + '…' : s; }

  // ── 啟動 ──
  document.addEventListener('DOMContentLoaded', () => {
    editor = makeEditor(document.getElementById('cmHost'), '');
    renderProblem();
    // 點進練習頁就開始暖機 Pyodide（首頁不載，避免拖慢地圖）
    const phaseEl = document.getElementById('bootStatus');
    window.DojoRunner.prewarm((ph) => {
      if (!phaseEl) return;
      if (ph === 'ready') { phaseEl.textContent = '✓ Python 環境就緒'; phaseEl.className = 'boot-ready'; setTimeout(() => phaseEl.style.display = 'none', 1500); }
      else phaseEl.textContent = '⏳ 載入 Python 環境中…';
    }).catch(err => { if (phaseEl) phaseEl.textContent = '⚠ Python 環境載入失敗：' + err.message; });
  });
})();
