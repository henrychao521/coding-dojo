// 程式練功房 — 共用進度系統（localStorage）＋ 首頁儀表板
// key 固定 coding_progress_v1；整站視為教師彙整格式裡的一個工具 "coding"。
const PROGRESS_KEY = 'coding_progress_v1';

// 進度結構：
// { units: { U1: { ex: { e1:{passed,stars,hints,attempts}, ... }, challenge:{...} }, U2:{...}, U3:{...} } }
function dojoDefault() { return { units: {} }; }

function loadProgress() {
  try { return JSON.parse(localStorage.getItem(PROGRESS_KEY)) || dojoDefault(); }
  catch (e) { return dojoDefault(); }
}
function saveProgress(p) { localStorage.setItem(PROGRESS_KEY, JSON.stringify(p)); }

// 取（或建）某單元的進度物件
function unitProg(p, unitId) {
  p.units = p.units || {};
  if (!p.units[unitId]) p.units[unitId] = { ex: {}, challenge: null };
  if (!p.units[unitId].ex) p.units[unitId].ex = {};
  return p.units[unitId];
}

// 記錄一題結果；同一題保留「最佳星數」，attempts/hints 取最新一次提交的數值。
// probId：練習題用 'e1'…；挑戰題用 'challenge'。回傳是否刷新了最佳成績。
function recordResult(unitId, probId, { passed, stars = 0, hints = 0, attempts = 1 } = {}) {
  const p = loadProgress();
  const u = unitProg(p, unitId);
  const slot = probId === 'challenge' ? (u.challenge || {}) : (u.ex[probId] || {});
  const prevStars = slot.stars || 0;
  const improved = passed && (!slot.passed || stars > prevStars);
  // hints 跟著「最佳成績」走：星數進步、或同星數但提示更少才更新，避免出現「3 星卻用了 2 次提示」
  const keepHints = slot.passed && !(passed && (stars > prevStars ||
    (stars === prevStars && hints < (slot.hints != null ? slot.hints : Infinity))));
  const next = {
    passed: slot.passed || passed,
    stars: Math.max(prevStars, passed ? stars : 0),
    hints: keepHints ? slot.hints : hints, attempts: (slot.attempts || 0) + attempts,
    updated: new Date().toISOString(),
  };
  if (probId === 'challenge') u.challenge = next; else u.ex[probId] = next;
  saveProgress(p);
  return improved;
}

// 單元星數（所有練習＋挑戰的星數總和）與完成數
function unitStats(p, unit) {
  const u = (p.units && p.units[unit.id]) || { ex: {}, challenge: null };
  let stars = 0, exDone = 0;
  for (let i = 1; i <= unit.exCount; i++) {
    const e = u.ex && u.ex['e' + i];
    if (e && e.passed) { exDone++; stars += e.stars || 0; }
  }
  const chDone = !!(u.challenge && u.challenge.passed);
  if (chDone) stars += u.challenge.stars || 0;
  const totalProblems = unit.exCount + (unit.challenge ? 1 : 0);
  const doneProblems = exDone + (chDone ? 1 : 0);
  const maxStars = totalProblems * 3;
  // 模組（單元）完成定義：挑戰題通過 = 結業
  return { stars, maxStars, exDone, chDone, doneProblems, totalProblems, done: chDone };
}

function totalStars(p) {
  return window.DOJO_UNITS.reduce((s, u) => s + unitStats(p, u).stars, 0);
}

// 對外 API
window.DOJO = {
  PROGRESS_KEY, loadProgress, saveProgress, recordResult, unitStats, totalStars,
};

// ── 共用：toast ──
function showToast(msg, type = '') {
  let t = document.querySelector('.toast');
  if (!t) { t = document.createElement('div'); t.className = 'toast'; document.body.appendChild(t); }
  t.className = 'toast show ' + type;
  t.textContent = msg;
  clearTimeout(showToast._timer);
  showToast._timer = setTimeout(() => { t.className = 'toast ' + type; }, 2200);
}
window.showToast = showToast;

// 取得從目前頁面回到 repo 根的相對前綴（依 main.js 自己的 src 推導）
function rootPrefix() {
  const s = document.querySelector('script[src$="js/main.js"]');
  const m = s && s.getAttribute('src').match(/^(.*?)js\/main\.js$/);
  return m ? m[1] : '';
}
window.dojoRootPrefix = rootPrefix;

// ── 自動注入授權 footer（沒有 footer 的頁面才加）──
document.addEventListener('DOMContentLoaded', () => {
  if (!document.querySelector('footer')) {
    const footer = document.createElement('footer');
    footer.innerHTML = `<p>© 珩宇老師製作・程式練功房 coding-dojo｜生活科技教學平台生態系</p>`;
    document.body.appendChild(footer);
  }
});

// ── 首頁（body.home）：標示單元完成、總進度儀表板 ──
document.addEventListener('DOMContentLoaded', () => {
  if (!document.body.classList.contains('home')) return;
  const p = loadProgress();
  const units = window.DOJO_UNITS;
  const activeUnits = units.filter(u => !u.locked);

  // 各單元卡片狀態
  document.querySelectorAll('.unit-card[data-unit]').forEach(card => {
    const u = window.DOJO_UNIT(card.dataset.unit);
    if (!u) return;
    const st = unitStats(p, u);
    const starEl = card.querySelector('.unit-stars');
    if (starEl && !u.locked) starEl.textContent = '★'.repeat(st.stars ? Math.min(3, Math.round(st.stars / st.totalProblems)) : 0).padEnd(3, '☆');
    const progEl = card.querySelector('.unit-progress-fill');
    if (progEl && !u.locked) progEl.style.width = (st.doneProblems / st.totalProblems * 100) + '%';
    const cntEl = card.querySelector('.unit-progress-text');
    if (cntEl && !u.locked) cntEl.textContent = `${st.doneProblems}/${st.totalProblems} 題・★${st.stars}`;
    if (st.done) card.classList.add('unit-done');
  });

  // 總進度儀表板
  const totalProblems = activeUnits.reduce((s, u) => s + unitStats(p, u).totalProblems, 0);
  const doneProblems = activeUnits.reduce((s, u) => s + unitStats(p, u).doneProblems, 0);
  const stars = totalStars(p);
  const pct = totalProblems ? Math.round(doneProblems / totalProblems * 100) : 0;
  const dash = document.getElementById('dashboard');
  if (dash) {
    dash.innerHTML = `
      <div class="dash-card">
        <div class="dash-left">
          <div class="dash-emoji">🥋</div>
          <div>
            <div class="dash-label">練功進度</div>
            <div class="dash-big">${pct}% 完成・收集 ${stars} 顆星</div>
            <div class="dash-sub">已通過 ${doneProblems} / ${totalProblems} 題（第一波 Python 軌 U1–U3）</div>
          </div>
        </div>
        <div class="dash-bar-wrap">
          <div class="dash-bar"><div class="dash-bar-fill" style="width:${pct}%"></div></div>
        </div>
      </div>`;
  }
});
