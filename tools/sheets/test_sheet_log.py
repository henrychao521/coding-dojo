#!/usr/bin/env python3
"""作答紀錄端到端測試（只用本機假 endpoint，絕不送正式 Google 網址）。

  1. U1 e1 先答錯再答對（tries 1→2）、U1 e2 一次過、U2 e1（函式題）、U3 無窮迴圈逾時
     → 每次提交一筆 kind=exercise；a＝通過數/總數、k＝總數/總數、ok 與 a==k 一致、指紋與題庫一致
  2. 程式碼、輸出內容、錯誤訊息都沒有外送
  3. 班級座號只在學生填了才帶；清除後就不帶；存 sessionStorage
  4. 離線時佇列保留、恢復連線補送
  5. endpoint 空：不顯示元件、不送任何請求
  6. Service Worker「準備離線使用」預載含 sheet-log.js，斷網後練習頁可開、可評測
用法：python3 tools/sheets/test_sheet_log.py
"""
import json, socket, subprocess, sys, time, urllib.request
from pathlib import Path
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[2]


def free_port():
    with socket.socket() as so:
        so.bind(("127.0.0.1", 0)); return so.getsockname()[1]


SITE_PORT, EP_PORT = free_port(), free_port()   # 隨機空埠，避免和其他本機服務撞埠
EP = f"http://127.0.0.1:{EP_PORT}/exec"
SITE = f"http://localhost:{SITE_PORT}"
ITEMS = {q["q"]: q for q in json.loads((ROOT / "assets/sheet-items.json").read_text(encoding="utf-8"))["questions"]}
MARK = "SECRET_CODE_MARK_7731"   # 放在學生程式碼裡，確認沒有外洩
FAIL = []


def check(cond, msg):
    print(("  ✓ " if cond else "  ✗ ") + msg)
    if not cond: FAIL.append(msg)


def records():
    return json.loads(urllib.request.urlopen(f"http://127.0.0.1:{EP_PORT}/records").read())


def reset():
    urllib.request.urlopen(urllib.request.Request(f"http://127.0.0.1:{EP_PORT}/reset", data=b"", method="POST"))


def cfg_route(endpoint):
    body = f"window.SHEET_CONFIG = {{ platform: 'dojo', endpoint: {json.dumps(endpoint)}, token: 'test' }};"
    return lambda route: route.fulfill(status=200, content_type="application/javascript", body=body)


def block_external(route):
    u = route.request.url
    if u.startswith(SITE) or u.startswith(f"http://127.0.0.1:{EP_PORT}"): return route.continue_()
    return route.abort()


def open_practice(ctx, slug, endpoint=None):
    page = ctx.new_page()
    page.route("**/*", block_external)
    if endpoint is not None:
        page.route("**/js/sheet-config.js", cfg_route(endpoint))
    page.goto(f"{SITE}/units/{slug}/practice.html")
    page.wait_for_function("document.querySelector('.cm-editor')")
    return page


def submit(page, code, wait_ms=20000):
    page.evaluate("code => { const v = CM6.EditorView.findFromDOM(document.querySelector('.cm-editor'));"
                  " v.dispatch({ changes: { from: 0, to: v.state.doc.length, insert: code } }); }", code)
    page.click("#btnRun")
    page.wait_for_function("document.getElementById('btnRun').textContent.includes('執行並評測')", timeout=wait_ms)
    page.wait_for_timeout(500)
    # 過關彈窗開著就關掉
    if page.evaluate("!!document.querySelector('.star-modal.show')"):
        page.click(".star-modal.show .sc-stay"); page.wait_for_timeout(300)


def goto_prob(page, n):
    page.locator("#probNav .prob-pill").nth(n).dispatch_event("pointerup")
    page.wait_for_timeout(200)


def last():
    r = records()
    return (r["accepted"][-1] if r["accepted"] else {}), r


def main():
    ep = subprocess.Popen([sys.executable, str(ROOT / "tools/sheets/fake_endpoint.py"), str(EP_PORT), "dojo"])
    site = subprocess.Popen([sys.executable, str(ROOT / "tools/serve.py"), str(SITE_PORT)],
                            stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    for url in (SITE + "/index.html", f"http://127.0.0.1:{EP_PORT}/"):   # 等兩個伺服器都起來
        for _ in range(50):
            try:
                urllib.request.urlopen(url, timeout=1); break
            except Exception:
                time.sleep(0.2)
    try:
        with sync_playwright() as pw:
            b = pw.chromium.launch(channel="chrome")
            ctx = b.new_context(viewport={"width": 1280, "height": 900}, service_workers="block")

            print("1. U1：填班級座號，e1 先錯再對、e2 一次過")
            reset()
            page = open_practice(ctx, "u1-output", EP)
            check(page.locator("#sl-btn").is_visible(), "右下角有「填班級座號」元件")
            check(page.locator("#sl-foot").count() == 1 and "老師" in page.inner_text("#sl-foot"), "頁面有告知文字")
            page.click("#sl-btn"); page.fill("#sl-class", "２０３"); page.fill("#sl-seat", "7"); page.click("#sl-save")
            check("203 班 7 號" in page.inner_text("#sl-btn"), "全形轉半形並顯示目前值")
            page.wait_for_function("document.getElementById('bootStatus').textContent.includes('就緒') || getComputedStyle(document.getElementById('bootStatus')).display === 'none'", timeout=60000)
            submit(page, f'# {MARK}\nprint("hi {MARK}")\n')
            d, r = last()
            it = (d.get("items") or [{}])[0]
            check(len(r["accepted"]) == 1 and not r["rejected"], f"第 1 次提交收到 1 筆（拒 {[x['why'] for x in r['rejected']]}）")
            check(d.get("kind") == "exercise" and d.get("page") == "units/u1-output/practice", f"kind／page：{d.get('kind')} {d.get('page')}")
            check(it.get("q") == "U1.e1" and it.get("t") == "code" and it.get("ok") == 0 and it.get("a") == "0/1"
                  and it.get("k") == "1/1" and it.get("tries") == 1, f"答錯：{it}")
            check(d.get("class") == "203" and d.get("seat") == "7", "班級座號有帶")
            submit(page, 'print("歡迎來到生科程式練功房")\n')
            d, r = last(); it = d["items"][0]
            check(it["ok"] == 1 and it["a"] == "1/1" and it["tries"] == 2, f"再答對：ok=1、tries=2（{it}）")
            check(it["h"] == ITEMS["U1.e1"]["h"], "指紋與 sheet-items.json 相同")
            check(isinstance(d.get("meta", {}).get("sec"), (int, float)) and d["meta"].get("max") == 1, f"meta {d.get('meta')}")
            goto_prob(page, 1)
            submit(page, f"print(rpm)  # {MARK}\n")
            d, r = last(); it = d["items"][0]
            check(it["q"] == "U1.e2" and it["ok"] == 1 and it["a"] == "3/3" and it["tries"] == 1
                  and it["h"] == ITEMS["U1.e2"]["h"], f"e2 一次過：{it}")
            check(len({x["sid"] for x in r["accepted"]}) == 3, "每次提交各自一個 sid")

            print("2. 同一分頁換單元：U2 函式題（清除班級座號後不帶）")
            page.click("#sl-btn"); page.click("#sl-panel .sl-clear")
            check("選填" in page.inner_text("#sl-btn"), "清除後顯示「填班級座號（選填）」")
            page.goto(f"{SITE}/units/u2-condition/practice.html"); page.wait_for_function("document.querySelector('.cm-editor')")
            submit(page, f"def is_overheat(t):\n    return t >= 60  # {MARK}\n", 60000)
            d, r = last(); it = d["items"][0]
            check(it["q"] == "U2.e1" and it["ok"] == 0 and it["a"] == "3/4" and it["k"] == "4/4", f"部分通過：{it}")
            check(d["class"] == "" and d["seat"] == "", "清除後 class／seat 為空")
            submit(page, "def is_overheat(t):\n    return t > 60\n")
            d, r = last(); it = d["items"][0]
            check(it["ok"] == 1 and it["tries"] == 2 and it["h"] == ITEMS["U2.e1"]["h"], f"再答對：{it}")
            check(page.evaluate("sessionStorage.getItem('sheetlog-identity')") is None, "sessionStorage 已清除")

            print("3. U3：無窮迴圈逾時")
            page.goto(f"{SITE}/units/u3-loop/practice.html"); page.wait_for_function("document.querySelector('.cm-editor')")
            submit(page, f"while True:\n    pass  # {MARK}\n", 60000)
            d, r = last(); it = d["items"][0]
            check(it["q"] == "U3.e1" and it["ok"] == 0 and it["a"] == "timeout", f"逾時：{it}")
            raw = json.dumps(r["raw"], ensure_ascii=False)
            check(MARK not in raw and "print(" not in raw and "def " not in raw and "while" not in raw and "hi " not in raw,
                  "程式碼、輸出內容都沒有外送")
            check(all(set(x) <= {"q", "h", "t", "ok", "a", "k", "tries"} for a in r["accepted"] for x in a["items"]), "題目欄位只有規格內的")
            check(not r["rejected"] and len(r["accepted"]) == 6, f"總共 6 筆全數收下（收 {len(r['accepted'])}）")

            print("4. 離線佇列補送")
            reset()
            ctx.set_offline(True)
            submit(page, "total = 0\n", 60000)
            q = page.evaluate("JSON.parse(localStorage.getItem('sheetlog-queue-dojo') || '[]').length")
            check(q == 1 and not records()["accepted"], f"離線時留在佇列（{q} 筆）")
            ctx.set_offline(False)
            page.evaluate("window.dispatchEvent(new Event('online'))"); page.wait_for_timeout(1000)
            q = page.evaluate("JSON.parse(localStorage.getItem('sheetlog-queue-dojo') || '[]').length")
            check(q == 0 and len(records()["accepted"]) == 1, "恢復連線後補送、佇列清空")
            page.close(); ctx.close()

            print("5. endpoint 空（正式預設設定）")
            reset()
            ctx = b.new_context(viewport={"width": 1280, "height": 900}, service_workers="block")
            page = open_practice(ctx, "u1-output", None)
            posts = []
            page.on("request", lambda rq: posts.append(rq.url) if rq.method == "POST" else None)
            check(page.evaluate("SheetLog.enabled()") is False, "預設 endpoint 為空")
            check(page.locator("#sl-wrap").count() == 0 and page.locator("#sl-foot").count() == 0, "不顯示元件與告知")
            submit(page, 'print("歡迎來到生科程式練功房")\n', 60000)
            check(not posts and not records()["raw"], "沒有送出任何請求")
            check(page.evaluate("localStorage.getItem('sheetlog-queue-dojo')") is None, "沒有寫入佇列")
            ctx.close()

            print("6. Service Worker 預載與斷網")
            ctx = b.new_context(viewport={"width": 1280, "height": 900})
            page = ctx.new_page()
            page.route("**/*", block_external)
            page.goto(SITE + "/index.html")
            res = page.evaluate("""async () => {
              const reg = await navigator.serviceWorker.register('sw.js'); await navigator.serviceWorker.ready;
              const sw = reg.active || navigator.serviceWorker.controller;
              return await new Promise(res => { const ch = new MessageChannel();
                ch.port1.onmessage = e => { if (e.data.type === 'done' || e.data.type === 'error') res(e.data); };
                sw.postMessage({ type: 'offline-prepare' }, [ch.port2]); });
            }""")
            check(res.get("type") == "done", f"準備離線使用完成：{res}")
            cached = page.evaluate("""async () => { const c = await caches.open('coding-dojo-v6');
              return [!!(await c.match('js/sheet-log.js')), !!(await c.match('js/sheet-config.js')), (await caches.keys())]; }""")
            check(cached[0] and cached[1] and cached[2] == ["coding-dojo-v6"], f"快取 coding-dojo-v6 含 sheet-log.js／sheet-config.js（{cached}）")
            page.reload(); page.wait_for_timeout(500)
            ctx.set_offline(True)
            page.goto(f"{SITE}/units/u3-loop/practice.html")
            page.wait_for_function("document.querySelector('.cm-editor') && window.SheetLog", timeout=20000)
            submit(page, "total = 0\nfor i in range(3):\n    total += i\nprint(total)\n", 90000)
            check(page.locator("#results").is_visible() and "測資" in page.inner_text("#results"), "斷網時練習頁可開、可評測")
            ctx.close()
            b.close()
    finally:
        ep.terminate(); site.terminate()
    print("\n結果：" + ("全部通過" if not FAIL else f"{len(FAIL)} 項失敗"))
    sys.exit(1 if FAIL else 0)


if __name__ == "__main__":
    main()
