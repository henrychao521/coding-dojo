/* U3 迴圈 — 題庫（函式模式）
 * 挑戰題特別提醒「避免無窮迴圈」——若不小心寫成無窮迴圈，評測會在數秒後逾時並提醒你。
 */
window.PROBLEMS = {
  exercises: [
    {
      id: 'e1', title: '累加求總和', mode: 'func', funcName: 'sum_readings',
      desc: '完成 <code>sum_readings(n)</code>：把 <code>1</code> 到 <code>n</code> 的整數全部加起來回傳。例如 n=5 → 1+2+3+4+5 = 15。',
      starter: 'def sum_readings(n):\n    total = 0\n    # 用 for 迴圈累加\n    return total\n',
      examples: [{ in: 'n = 5', out: '15' }, { in: 'n = 10', out: '55' }],
      cases: [
        { args: [5], expected: 15 }, { args: [1], expected: 1 },
        { args: [10], expected: 55 }, { args: [100], expected: 5050 },
      ],
      hints: ['用 <code>for i in range(1, n + 1):</code> 走訪 1 到 n。', '在迴圈裡 <code>total += i</code> 累加。'],
    },
    {
      id: 'e2', title: '需要幾趟', mode: 'func', funcName: 'trips_needed',
      desc: '一台輸送車一趟最多載 <code>k</code> 個零件，共有 <code>parts</code> 個。完成 <code>trips_needed(parts, k)</code> 回傳至少要幾趟（最後一趟沒裝滿也算一趟）。',
      starter: 'def trips_needed(parts, k):\n    pass\n',
      examples: [{ in: 'parts=10, k=3', out: '4' }, { in: 'parts=9, k=3', out: '3' }],
      cases: [
        { args: [10, 3], expected: 4 }, { args: [9, 3], expected: 3 },
        { args: [1, 5], expected: 1 }, { args: [0, 5], expected: 0 }, { args: [12, 4], expected: 3 },
      ],
      hints: ['用 while 迴圈：還有零件就 +1 趟、減掉 k 個。', '也可以用無條件進位：<code>(parts + k - 1) // k</code>。'],
    },
    {
      id: 'e3', title: '找最大讀值', mode: 'func', funcName: 'max_reading',
      desc: '完成 <code>max_reading(readings)</code>：回傳清單 <code>readings</code> 裡的最大值（請自己用迴圈找，不要用內建的 <code>max</code>）。',
      starter: 'def max_reading(readings):\n    best = readings[0]\n    # 走訪其餘元素，比較更新 best\n    return best\n',
      examples: [{ in: '[3, 7, 2, 9, 4]', out: '9' }, { in: '[-1, -8, -3]', out: '-1' }],
      cases: [
        { args: [[3, 7, 2, 9, 4]], expected: 9 }, { args: [[5]], expected: 5 },
        { args: [[-1, -8, -3]], expected: -1 }, { args: [[10, 10, 2]], expected: 10 },
      ],
      hints: ['先假設第一個是最大：<code>best = readings[0]</code>。', '走訪時 <code>if x &gt; best: best = x</code>。'],
    },
    {
      id: 'e4', title: '超標次數', mode: 'func', funcName: 'count_over',
      desc: '完成 <code>count_over(readings, limit)</code>：回傳清單裡數值「超過」<code>limit</code> 的個數。',
      starter: 'def count_over(readings, limit):\n    count = 0\n    return count\n',
      examples: [{ in: '[10,20,30,40], limit=25', out: '2' }, { in: '[1,2,3], limit=5', out: '0' }],
      cases: [
        { args: [[10, 20, 30, 40], 25], expected: 2 },
        { args: [[1, 2, 3], 5], expected: 0 },
        { args: [[5, 5, 5], 4], expected: 3 },
      ],
      hints: ['走訪每個數值，<code>if x &gt; limit:</code> 就把 count 加 1。'],
    },
    {
      id: 'e5', title: '加速到目標', mode: 'func', funcName: 'accel_time',
      desc: '馬達每過 1 秒轉速增加 10 rpm，從 0 開始。完成 <code>accel_time(target)</code> 回傳轉速第一次「達到或超過」<code>target</code> 所需的秒數。',
      starter: 'def accel_time(target):\n    speed = 0\n    seconds = 0\n    # 還沒到 target 就繼續加速\n    return seconds\n',
      examples: [{ in: 'target = 25', out: '3' }, { in: 'target = 100', out: '10' }],
      cases: [
        { args: [0], expected: 0 }, { args: [10], expected: 1 },
        { args: [25], expected: 3 }, { args: [100], expected: 10 }, { args: [5], expected: 1 },
      ],
      hints: ['用 <code>while speed &lt; target:</code>，每圈 <code>speed += 10</code>、<code>seconds += 1</code>。', 'target=0 時一開始就達標，應回傳 0。'],
    },
    {
      id: 'e6', title: '輸送帶燈號（巢狀）', mode: 'func', funcName: 'belt_pattern',
      desc: '完成 <code>belt_pattern(n)</code>：回傳階梯燈號字串，第 1 列 1 顆 <code>●</code>、第 2 列 2 顆…第 n 列 n 顆，列與列之間用換行 <code>\\n</code> 隔開。例如 n=3 回傳 <code>"●\\n●●\\n●●●"</code>。',
      starter: 'def belt_pattern(n):\n    rows = []\n    # 第 i 列有 i 顆 ●\n    return "\\n".join(rows)\n',
      examples: [{ in: 'n = 1', out: '●' }, { in: 'n = 3', out: '●（換行）●●（換行）●●●' }],
      cases: [
        { args: [1], expected: '●' },
        { args: [2], expected: '●\n●●' },
        { args: [3], expected: '●\n●●●' },
      ],
      hints: ['外層 <code>for i in range(1, n + 1):</code>，每列字串是 <code>"●" * i</code>。', '把每列收進清單，最後 <code>"\\n".join(rows)</code> 接起來。'],
    },
    {
      id: 'e7', title: '平均讀值', mode: 'func', funcName: 'average',
      desc: '完成 <code>average(readings)</code>：回傳清單所有讀值的平均（總和 ÷ 數量）。',
      starter: 'def average(readings):\n    total = 0\n    # 累加後除以數量\n    return total / len(readings)\n',
      examples: [{ in: '[10, 20, 30]', out: '20.0' }, { in: '[1, 2]', out: '1.5' }],
      cases: [
        { args: [[10, 20, 30]], expected: 20 }, { args: [[5, 5, 5, 5]], expected: 5 },
        { args: [[1, 2]], expected: 1.5 }, { args: [[3, 4, 5, 6]], expected: 4.5 },
      ],
      hints: ['用迴圈累加總和，或直接用 <code>sum(readings)</code>。', '平均 = 總和 <code>/</code> <code>len(readings)</code>。'],
    },
  ],
  challenge: {
    title: '挑戰：電池放電模擬', mode: 'func', funcName: 'battery_drain',
    desc: '電池電量 <code>level</code>，每一步消耗 <code>step</code> 電量。完成 <code>battery_drain(level, step)</code> 回傳電量第一次「歸零或變負」需要幾步。<br><b>⚠️ 小提醒：</b>迴圈每一步電量要真的減少，否則會變成無窮迴圈（評測會在數秒後逾時提醒你）。',
    starter: 'def battery_drain(level, step):\n    steps = 0\n    # 當電量還大於 0 就繼續放電\n    return steps\n',
    examples: [{ in: 'level=10, step=2', out: '5' }, { in: 'level=10, step=3', out: '4' }],
    cases: [
      { args: [10, 2], expected: 5 }, { args: [10, 3], expected: 4 },
      { args: [5, 5], expected: 1 }, { args: [7, 1], expected: 7 }, { args: [0, 3], expected: 0 },
    ],
    hints: ['用 <code>while level &gt; 0:</code>，每圈 <code>level -= step</code>、<code>steps += 1</code>。', 'level=0 時一開始就歸零，應回傳 0（迴圈一次都不跑）。'],
  },
};
