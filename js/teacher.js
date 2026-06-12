/* 程式練功房 — 教師後台邏輯
 * 進度結構與 js/main.js 一致；匯出 envelope 對齊 livingtech-tools 教師後台：
 *   { platform:'coding-dojo', studentName, exportTime, tools:{ coding:{ module1..6, unitStars, totalStars, units } } }
 * 這樣未來只要把 "coding" 一行加進 livingtech 的 TOOLS 陣列就能合併彙整。
 */
(function () {
  const UNITS = window.DOJO_UNITS;                 // 全部單元（含鎖定）→ module flag 用
  const ACTIVE = UNITS.filter(u => !u.locked);     // 開放單元 → 表格欄位用
  const KEY = window.DOJO.PROGRESS_KEY;

  // 從一份 coding 進度（{units:...}）計算各單元統計
  function statsOf(codingRaw, unit) {
    return window.DOJO.unitStats({ units: (codingRaw && codingRaw.units) || {} }, unit);
  }

  // ── 把目前 localStorage 進度包成 tools.coding ──
  function buildCoding(raw) {
    const coding = { units: (raw && raw.units) || {}, unitStars: {}, totalStars: 0 };
    let total = 0;
    UNITS.forEach((u, idx) => {
      const st = statsOf(raw, u);
      coding['module' + (idx + 1)] = st.done;        // module1..6 = 各單元是否結業
      coding.unitStars[u.id] = st.stars;
      total += st.stars;
    });
    coding.totalStars = total;
    return coding;
  }

  // ── 本機進度表 ──
  function renderLocal() {
    let raw; try { raw = JSON.parse(localStorage.getItem(KEY)) || { units: {} }; } catch { raw = { units: {} }; }
    const tbody = document.getElementById('localBody');
    let html = '';
    let totalStars = 0, totalDone = 0, totalProblems = 0;
    ACTIVE.forEach(u => {
      const st = statsOf(raw, u);
      totalStars += st.stars; totalDone += st.doneProblems; totalProblems += st.totalProblems;
      html += `<tr>
        <td><span class="tool-cell" style="color:${u.color}">${u.emoji} ${u.id} ${u.title}</span></td>
        <td>${st.done ? '<span class="badge-done">✓ 結業</span>' : '進行中'}</td>
        <td><span class="bar"><span class="bar-fill" style="width:${st.totalProblems ? st.doneProblems / st.totalProblems * 100 : 0}%"></span></span> ${st.doneProblems}/${st.totalProblems} 題</td>
        <td><span class="stars-cell">★</span> ${st.stars} / ${st.maxStars}</td>
      </tr>`;
    });
    tbody.innerHTML = html;
    document.getElementById('localSummary').textContent =
      `共 ${totalDone}/${totalProblems} 題、★${totalStars}（第一波 Python 軌 U1–U3）`;
  }

  // ── 匯出個人進度 ──
  window.exportMyJSON = function () {
    let raw; try { raw = JSON.parse(localStorage.getItem(KEY)) || { units: {} }; } catch { raw = { units: {} }; }
    const name = prompt('請輸入學生姓名（建議「班級_座號_姓名」，如 1015_07_王小明）：', '');
    if (!name) return;
    const data = {
      platform: 'coding-dojo',
      studentName: name,
      exportTime: new Date().toISOString(),
      tools: { coding: buildCoding(raw) },
    };
    downloadBlob(JSON.stringify(data, null, 2), `${safe(name)}.json`, 'application/json');
    if (window.SoundFX) SoundFX.success();
    alert('進度已匯出，把這個 JSON 檔交給老師即可。');
  };

  // ── 還原個人進度（把 JSON 寫回本機 localStorage）──
  window.importMyJSON = function (ev) {
    const f = ev.target.files[0]; if (!f) return;
    const r = new FileReader();
    r.onload = e => {
      try {
        const d = JSON.parse(e.target.result);
        const coding = d.tools && d.tools.coding;
        if (!coding) throw new Error('找不到 coding 進度');
        localStorage.setItem(KEY, JSON.stringify({ units: coding.units || {} }));
        renderLocal();
        alert(`✓ 已還原「${d.studentName || '未具名'}」的進度到本機。`);
      } catch (err) { alert('檔案格式不對：' + err.message); }
    };
    r.readAsText(f);
    ev.target.value = '';
  };

  // ── 班級彙整 ──
  const roster = [];   // { name, coding }
  window.onClassFiles = function (ev) {
    const files = Array.from(ev.target.files || []);
    let pending = files.length;
    if (!pending) return;
    files.forEach(f => {
      const r = new FileReader();
      r.onload = e => {
        try {
          const d = JSON.parse(e.target.result);
          const coding = d.tools && d.tools.coding;
          if (coding) {
            const name = d.studentName || f.name.replace(/\.json$/i, '');
            const exist = roster.find(s => s.name === name);
            if (exist) exist.coding = coding; else roster.push({ name, coding });
          }
        } catch (err) { console.error('解析失敗', f.name, err); }
        if (--pending === 0) renderClass();
      };
      r.readAsText(f);
    });
    ev.target.value = '';
  };

  function renderClass() {
    const wrap = document.getElementById('classWrap');
    if (!roster.length) { wrap.innerHTML = '<p class="muted">尚未上傳任何學生 JSON。</p>'; return; }
    // 表頭
    let html = '<div class="class-scroll"><table class="class-table"><thead><tr><th>學生</th>';
    ACTIVE.forEach(u => html += `<th style="color:${u.color}">${u.emoji} ${u.id}</th>`);
    html += '<th>總★</th></tr></thead><tbody>';
    roster.slice().sort((a, b) => a.name.localeCompare(b.name)).forEach(s => {
      html += `<tr><td class="stu">${escapeHtml(s.name)}</td>`;
      let tStars = 0;
      ACTIVE.forEach(u => {
        const st = statsOf(s.coding, u);
        tStars += st.stars;
        html += `<td><span class="cell-prog"><span class="cell-fill" style="width:${st.totalProblems ? st.doneProblems / st.totalProblems * 100 : 0}%"></span></span>${st.doneProblems}/${st.totalProblems}・★${st.stars}</td>`;
      });
      html += `<td><b>★${tStars}</b></td></tr>`;
    });
    html += '</tbody></table></div>';
    // 摘要
    const n = roster.length;
    const avgStars = (roster.reduce((s, st) => s + ACTIVE.reduce((a, u) => a + statsOf(st.coding, u).stars, 0), 0) / n).toFixed(1);
    document.getElementById('classSummary').innerHTML =
      `<div class="sum-card"><div class="sum-n">${n}</div><div class="sum-l">已上傳學生</div></div>
       <div class="sum-card"><div class="sum-n">★${avgStars}</div><div class="sum-l">平均星數</div></div>`;
    wrap.innerHTML = html;
  }

  window.exportClassCSV = function () {
    if (!roster.length) { alert('請先上傳學生 JSON 檔。'); return; }
    const head = ['學生'].concat(ACTIVE.flatMap(u => [`${u.id}-完成題數`, `${u.id}-星數`])).concat(['總星數']);
    const rows = [head];
    roster.slice().sort((a, b) => a.name.localeCompare(b.name)).forEach(s => {
      const row = [s.name]; let t = 0;
      ACTIVE.forEach(u => { const st = statsOf(s.coding, u); row.push(st.doneProblems, st.stars); t += st.stars; });
      row.push(t); rows.push(row);
    });
    const csv = rows.map(r => r.map(c => `"${c}"`).join(',')).join('\n');
    downloadBlob('﻿' + csv, `程式練功房_班級進度_${new Date().toISOString().slice(0, 10)}.csv`, 'text/csv;charset=utf-8');
  };

  window.clearClass = function () {
    if (!roster.length || confirm('確定清空已上傳的班級資料？（不影響各學生本機進度）')) {
      roster.length = 0; renderClass();
    }
  };

  // ── 工具 ──
  function downloadBlob(content, filename, type) {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = filename; a.click();
    setTimeout(() => URL.revokeObjectURL(url), 500);
  }
  function safe(s) { return String(s).replace(/[/\\?%*:|"<>]/g, '_'); }
  function escapeHtml(s) { return String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c])); }

  // tabs
  document.addEventListener('DOMContentLoaded', () => {
    renderLocal();
    renderClass();
    document.querySelectorAll('.tab-btn').forEach(btn => {
      btn.addEventListener('pointerup', () => {
        document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
        document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
        btn.classList.add('active');
        document.getElementById(btn.dataset.tab).classList.add('active');
      });
    });
  });
})();
