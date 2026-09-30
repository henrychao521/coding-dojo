#!/usr/bin/env python3
"""產生 assets/sheet-items.json：給老師試算表「匯入最新題庫」用（規格 classroom-sheets/SPEC.md 第 2 節）。

題目來源：js/units.js 未鎖定的單元 × units/<slug>/problems.js（用 node 直接載入，和網頁同一份資料）。
  q = 單元代號.題目 id（U1.e1…U1.challenge），t = code，page = units/<slug>/practice
  stem = 題目名稱＋說明（去 HTML）前 80 字
指紋 h 和 js/eval/practice.js 的 sheetCore 相同：
  {type:'code', stem: 題名\\n說明原文\\n評測方式[:函式名], items: 每組測資的 JSON 字串（由 JS 產生）}
  以 json.dumps(sort_keys=True, ensure_ascii=False) 做 SHA-1 取前 8 碼（同 EMT build.py q_hash）。
  題目、說明或測資改了，指紋就變，試算表會把新舊版分開分析。

用法：python3 tools/sheets/build_items.py            （寫入 assets/sheet-items.json）
      python3 tools/sheets/build_items.py --check    （只比對，不一致就結束碼 1）
"""
import datetime, hashlib, html, json, re, subprocess, sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / "assets" / "sheet-items.json"

NODE = r"""
const fs = require('fs'), vm = require('vm');
const win = {};
vm.runInNewContext(fs.readFileSync('js/units.js', 'utf8'), { window: win });
const out = [];
for (const u of win.DOJO_UNITS.filter(u => !u.locked)) {
  const w = {};
  vm.runInNewContext(fs.readFileSync('units/' + u.slug + '/problems.js', 'utf8'), { window: w });
  const P = w.PROBLEMS;
  const probs = P.exercises.concat([Object.assign({ id: 'challenge' }, P.challenge)]);
  for (const p of probs) out.push({
    unit: u.id, slug: u.slug, id: p.id, title: p.title, desc: p.desc,
    // 以下兩欄和 js/eval/practice.js 的 sheetCore 逐字相同
    coreStem: p.title + '\n' + p.desc + '\n' + p.mode + (p.funcName ? ':' + p.funcName : ''),
    coreItems: (p.cases || []).map(c => JSON.stringify(c)),
    nCases: (p.cases || []).length,
  });
}
process.stdout.write(JSON.stringify(out));
"""


def q_hash(core):
    c = {k: core.get(k) for k in ("type", "stem", "options", "answer", "items")}
    return hashlib.sha1(json.dumps(c, ensure_ascii=False, sort_keys=True).encode("utf-8")).hexdigest()[:8]


def plain(s):
    return re.sub(r"\s+", " ", html.unescape(re.sub(r"<[^>]*>", "", s or ""))).strip()


def build():
    raw = json.loads(subprocess.run(["node", "-e", NODE], cwd=ROOT, check=True,
                                    capture_output=True, text=True).stdout)
    qs, seen = [], set()
    for p in raw:
        q = f"{p['unit']}.{p['id']}"
        if q in seen:
            raise SystemExit(f"題目代號重複：{q}")
        seen.add(q)
        stem = (p["title"] + "：" + plain(p["desc"]))[:80]
        qs.append({"q": q, "h": q_hash({"type": "code", "stem": p["coreStem"], "items": p["coreItems"]}),
                   "t": "code", "page": f"units/{p['slug']}/practice", "stem": stem,
                   "options": {}, "answer": f"{p['nCases']}/{p['nCases']}", "items": []})
    return qs


def main():
    qs = build()
    old = json.loads(OUT.read_text(encoding="utf-8")) if OUT.exists() else {}
    changed = qs != old.get("questions")
    if "--check" in sys.argv:
        print("sheet-items.json " + ("需要重新產生" if changed else "已是最新"))
        sys.exit(1 if changed else 0)
    version = old.get("version") if not changed and old.get("version") else datetime.date.today().isoformat()
    OUT.parent.mkdir(exist_ok=True)
    OUT.write_text(json.dumps({"platform": "dojo", "version": version, "questions": qs},
                              ensure_ascii=False, indent=1) + "\n", encoding="utf-8")
    print(f"寫入 {OUT.relative_to(ROOT)}：共 {len(qs)} 題")


if __name__ == "__main__":
    main()
