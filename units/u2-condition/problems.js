/* U2 條件判斷 — 題庫
 * 函式模式：你要完成一個函式，系統用多組 (輸入 → 預期回傳) 測資自動斷言。
 */
window.PROBLEMS = {
  exercises: [
    {
      id: 'e1', title: '過熱警示', mode: 'func', funcName: 'is_overheat',
      desc: '完成函式 <code>is_overheat(t)</code>：當溫度 <code>t</code> 大於 60 時回傳 <code>True</code>，否則回傳 <code>False</code>。',
      starter: 'def is_overheat(t):\n    # 在這裡完成，記得用 return 回傳結果\n    pass\n',
      examples: [{ in: 't = 80', out: 'True' }, { in: 't = 60', out: 'False' }],
      cases: [
        { args: [80], expected: true }, { args: [60], expected: false },
        { args: [61], expected: true }, { args: [20], expected: false },
      ],
      hints: ['用比較運算子 <code>&gt;</code>。', '答案：<code>return t &gt; 60</code>'],
    },
    {
      id: 'e2', title: '馬達轉速分級', mode: 'func', funcName: 'motor_level',
      desc: '完成 <code>motor_level(rpm)</code>：rpm 小於 100 回傳 <code>"低"</code>；100 到 299 回傳 <code>"中"</code>；300 以上回傳 <code>"高"</code>。',
      starter: 'def motor_level(rpm):\n    # 用 if / elif / else\n    pass\n',
      examples: [{ in: 'rpm = 50', out: '低' }, { in: 'rpm = 100', out: '中' }, { in: 'rpm = 300', out: '高' }],
      cases: [
        { args: [50], expected: '低' }, { args: [99], expected: '低' },
        { args: [100], expected: '中' }, { args: [299], expected: '中' },
        { args: [300], expected: '高' }, { args: [500], expected: '高' },
      ],
      hints: ['用 <code>if / elif / else</code> 三段。', '注意邊界：100 算「中」、300 算「高」。'],
    },
    {
      id: 'e3', title: '安全範圍判斷', mode: 'func', funcName: 'in_safe_range',
      desc: '完成 <code>in_safe_range(value, low, high)</code>：當感測器讀值 <code>value</code> 落在 <code>low</code> 到 <code>high</code> 之間（含兩端）回傳 <code>True</code>，否則 <code>False</code>。',
      starter: 'def in_safe_range(value, low, high):\n    pass\n',
      examples: [{ in: 'value=5, low=0, high=10', out: 'True' }, { in: 'value=11, low=0, high=10', out: 'False' }],
      cases: [
        { args: [5, 0, 10], expected: true }, { args: [0, 0, 10], expected: true },
        { args: [10, 0, 10], expected: true }, { args: [11, 0, 10], expected: false },
        { args: [-1, 0, 10], expected: false },
      ],
      hints: ['Python 可以連續比較：<code>low &lt;= value &lt;= high</code>。', '答案：<code>return low &lt;= value &lt;= high</code>'],
    },
    {
      id: 'e4', title: '材料夠不夠裁', mode: 'func', funcName: 'enough_material',
      desc: '完成 <code>enough_material(need, stock)</code>：庫存 <code>stock</code> 大於等於需要量 <code>need</code> 時回傳 <code>True</code>（夠裁），否則 <code>False</code>。',
      starter: 'def enough_material(need, stock):\n    pass\n',
      examples: [{ in: 'need=3, stock=5', out: 'True' }, { in: 'need=6, stock=5', out: 'False' }],
      cases: [
        { args: [3, 5], expected: true }, { args: [5, 5], expected: true }, { args: [6, 5], expected: false },
      ],
      hints: ['用 <code>&gt;=</code>。', '答案：<code>return stock &gt;= need</code>'],
    },
    {
      id: 'e5', title: '紅外線測距行動', mode: 'func', funcName: 'ir_action',
      desc: '測距機器人。完成 <code>ir_action(dist)</code>：距離小於 10 回傳 <code>"停"</code>；10 到 29 回傳 <code>"慢"</code>；30 以上回傳 <code>"前進"</code>。',
      starter: 'def ir_action(dist):\n    pass\n',
      examples: [{ in: 'dist = 5', out: '停' }, { in: 'dist = 10', out: '慢' }, { in: 'dist = 30', out: '前進' }],
      cases: [
        { args: [5], expected: '停' }, { args: [10], expected: '慢' },
        { args: [29], expected: '慢' }, { args: [30], expected: '前進' }, { args: [100], expected: '前進' },
      ],
      hints: ['三段用 <code>if / elif / else</code>。', '邊界：10 → 慢、30 → 前進。'],
    },
    {
      id: 'e6', title: '低電壓警示', mode: 'func', funcName: 'low_voltage_warn',
      desc: '完成 <code>low_voltage_warn(v)</code>：電壓 <code>v</code> 小於或等於 3.3 伏特時回傳 <code>True</code>（要警示），否則 <code>False</code>。',
      starter: 'def low_voltage_warn(v):\n    pass\n',
      examples: [{ in: 'v = 3.3', out: 'True' }, { in: 'v = 5.0', out: 'False' }],
      cases: [
        { args: [3.3], expected: true }, { args: [3.31], expected: false },
        { args: [2.0], expected: true }, { args: [5.0], expected: false },
      ],
      hints: ['3.3 也要算警示，所以用 <code>&lt;=</code> 不是 <code>&lt;</code>。', '答案：<code>return v &lt;= 3.3</code>'],
    },
    {
      id: 'e7', title: '自動照明', mode: 'func', funcName: 'light_action',
      desc: '完成 <code>light_action(light)</code>：光感值小於 200（太暗）回傳 <code>"開燈"</code>；大於 800（太亮）回傳 <code>"關燈"</code>；其餘回傳 <code>"維持"</code>。',
      starter: 'def light_action(light):\n    pass\n',
      examples: [{ in: 'light = 100', out: '開燈' }, { in: 'light = 900', out: '關燈' }, { in: 'light = 500', out: '維持' }],
      cases: [
        { args: [100], expected: '開燈' }, { args: [199], expected: '開燈' },
        { args: [200], expected: '維持' }, { args: [800], expected: '維持' },
        { args: [801], expected: '關燈' }, { args: [500], expected: '維持' },
      ],
      hints: ['先判斷 <code>&lt; 200</code>，再判斷 <code>&gt; 800</code>，剩下的 <code>else</code>。', '200 和 800 都算「維持」。'],
    },
  ],
  challenge: {
    title: '挑戰：交通號誌狀態機', mode: 'func', funcName: 'traffic_light',
    desc: '交通號誌一個週期 60 秒：第 <b>0–29</b> 秒亮「綠」、第 <b>30–34</b> 秒亮「黃」、第 <b>35–59</b> 秒亮「紅」。完成 <code>traffic_light(sec)</code> 回傳該秒的燈色字串。',
    starter: 'def traffic_light(sec):\n    # 三段時間，分別回傳 "綠" / "黃" / "紅"\n    pass\n',
    examples: [{ in: 'sec = 0', out: '綠' }, { in: 'sec = 30', out: '黃' }, { in: 'sec = 35', out: '紅' }],
    cases: [
      { args: [0], expected: '綠' }, { args: [29], expected: '綠' },
      { args: [30], expected: '黃' }, { args: [34], expected: '黃' },
      { args: [35], expected: '紅' }, { args: [59], expected: '紅' },
    ],
    hints: ['用 <code>if / elif / else</code> 三段判斷 sec 落在哪個區間。', '邊界：30 開始黃、35 開始紅。'],
  },
};
