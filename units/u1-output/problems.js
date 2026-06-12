/* U1 輸出與變數 — 題庫
 * 多數題用 stdout 模式：每組測資以 setup 設定不同的變數值，再比對你的輸出。
 * （setup 會在你的程式之前先執行，幫你把變數準備好。）
 */
window.PROBLEMS = {
  exercises: [
    {
      id: 'e1', title: '第一行程式', mode: 'stdout',
      desc: '用 <code>print()</code> 印出一行字：<b>歡迎來到生科程式練功房</b>。',
      starter: '# 用 print 印出指定的文字\n',
      examples: [{ in: '（固定）', out: '歡迎來到生科程式練功房' }],
      cases: [{ label: '輸出比對', setup: '', expected: '歡迎來到生科程式練功房' }],
      hints: ['<code>print()</code> 的括號裡放字串，文字要用引號 <code>"</code> 包起來。', '答案：<code>print("歡迎來到生科程式練功房")</code>'],
    },
    {
      id: 'e2', title: '印出馬達轉速', mode: 'stdout',
      desc: '變數 <code>rpm</code> 已經幫你準備好（代表馬達每分鐘的轉速）。請把 <code>rpm</code> 的值印出來。',
      starter: '# rpm 已經存在，直接把它印出來\n',
      examples: [{ in: 'rpm = 120', out: '120' }, { in: 'rpm = 240', out: '240' }],
      cases: [
        { label: 'rpm=120', setup: 'rpm = 120', expected: '120' },
        { label: 'rpm=240', setup: 'rpm = 240', expected: '240' },
        { label: 'rpm=75', setup: 'rpm = 75', expected: '75' },
      ],
      hints: ['印出變數不需要引號：<code>print(變數名)</code>。', '答案：<code>print(rpm)</code>'],
    },
    {
      id: 'e3', title: '標示材料', mode: 'stdout',
      desc: '變數 <code>material</code> 是材料名稱。請印出「材料：」再接上材料名稱，例如材料是 <code>木板</code> 就印出 <code>材料：木板</code>。',
      starter: '# 把 "材料：" 和 material 接起來印出\n',
      examples: [{ in: "material = '木板'", out: '材料：木板' }, { in: "material = '壓克力'", out: '材料：壓克力' }],
      cases: [
        { label: '木板', setup: "material = '木板'", expected: '材料：木板' },
        { label: '壓克力', setup: "material = '壓克力'", expected: '材料：壓克力' },
        { label: '鋁條', setup: "material = '鋁條'", expected: '材料：鋁條' },
      ],
      hints: ['用 <code>+</code> 把兩個字串接起來。', '答案：<code>print("材料：" + material)</code>'],
    },
    {
      id: 'e4', title: '齒輪減速比', mode: 'stdout',
      desc: '變數 <code>big</code>（大齒輪齒數）、<code>small</code>（小齒輪齒數）。減速比 = 大齒數 ÷ 小齒數。請算出減速比並印出。',
      starter: '# 減速比 = big 除以 small\n',
      examples: [{ in: 'big=48, small=12', out: '4.0' }, { in: 'big=50, small=10', out: '5.0' }],
      cases: [
        { label: '48/12', setup: 'big = 48\nsmall = 12', expected: '4.0' },
        { label: '50/10', setup: 'big = 50\nsmall = 10', expected: '5.0' },
        { label: '36/12', setup: 'big = 36\nsmall = 12', expected: '3.0' },
      ],
      hints: ['除法用 <code>/</code>。', '答案：<code>print(big / small)</code>'],
    },
    {
      id: 'e5', title: '溫度讀值（f-string）', mode: 'stdout',
      desc: '變數 <code>temp</code> 是溫度感測器讀到的攝氏溫度。請用 <b>f-string</b> 印出：<code>目前溫度：25°C</code>（把 25 換成實際讀值）。',
      starter: '# 用 f-string：f"...{temp}..."\n',
      examples: [{ in: 'temp = 25', out: '目前溫度：25°C' }, { in: 'temp = 18', out: '目前溫度：18°C' }],
      cases: [
        { label: 'temp=25', setup: 'temp = 25', expected: '目前溫度：25°C' },
        { label: 'temp=30', setup: 'temp = 30', expected: '目前溫度：30°C' },
        { label: 'temp=18', setup: 'temp = 18', expected: '目前溫度：18°C' },
      ],
      hints: ['f-string 寫法：<code>f"目前溫度：{temp}°C"</code>。', '答案：<code>print(f"目前溫度：{temp}°C")</code>'],
    },
    {
      id: 'e6', title: '木料總長', mode: 'stdout',
      desc: '變數 <code>a</code>、<code>b</code> 是兩段木料的長度（公分）。請算出總長並印出（只印數字）。',
      starter: '# 印出 a 和 b 的總和\n',
      examples: [{ in: 'a=30, b=45', out: '75' }, { in: 'a=12, b=8', out: '20' }],
      cases: [
        { label: '30+45', setup: 'a = 30\nb = 45', expected: '75' },
        { label: '12+8', setup: 'a = 12\nb = 8', expected: '20' },
        { label: '100+55', setup: 'a = 100\nb = 55', expected: '155' },
      ],
      hints: ['加法用 <code>+</code>。', '答案：<code>print(a + b)</code>'],
    },
    {
      id: 'e7', title: '字串轉數字', mode: 'stdout',
      desc: '變數 <code>s</code> 是「字串」形式的數字（例如 <code>"24"</code>，注意有引號）。請把它轉成整數後加上 <code>6</code>，再印出結果。',
      starter: '# 先用 int() 把 s 轉成整數，再加 6\n',
      examples: [{ in: "s = '24'", out: '30' }, { in: "s = '100'", out: '106' }],
      cases: [
        { label: '"24"+6', setup: "s = '24'", expected: '30' },
        { label: '"100"+6', setup: "s = '100'", expected: '106' },
        { label: '"0"+6', setup: "s = '0'", expected: '6' },
      ],
      hints: ['字串轉整數用 <code>int()</code>。如果直接 <code>s + 6</code> 會出錯，因為字串不能加數字。', '答案：<code>print(int(s) + 6)</code>'],
    },
  ],
  challenge: {
    title: '挑戰：電池功率計算', mode: 'stdout',
    desc: '變數 <code>v</code>（電壓，伏特）、<code>i</code>（電流，安培）。電功率公式 <b>P = 電壓 × 電流</b>。請算出功率並用 f-string 印出：<code>功率：6 W</code>（把 6 換成實際算出的值）。',
    starter: '# 功率 = v 乘以 i，用 f-string 印出「功率：? W」\n',
    examples: [{ in: 'v=3, i=2', out: '功率：6 W' }, { in: 'v=12, i=1', out: '功率：12 W' }],
    cases: [
      { label: '3×2', setup: 'v = 3\ni = 2', expected: '功率：6 W' },
      { label: '5×2', setup: 'v = 5\ni = 2', expected: '功率：10 W' },
      { label: '12×1', setup: 'v = 12\ni = 1', expected: '功率：12 W' },
      { label: '9×0', setup: 'v = 9\ni = 0', expected: '功率：0 W' },
    ],
    hints: ['乘法用 <code>*</code>，可以直接寫在 f-string 裡：<code>{v * i}</code>。', '答案：<code>print(f"功率：{v * i} W")</code>'],
  },
};
