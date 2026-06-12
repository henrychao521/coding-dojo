// 共用音效系統 — Web Audio API（不依賴外部音檔）
// 提供：點擊、成功、錯誤、解鎖、鋸條動作、警告音
const SoundFX = (() => {
  let ctx = null;
  let muted = localStorage.getItem('sfx_muted') === '1';
  let sawOscillator = null;
  let sawGain = null;

  function ensureCtx() {
    if (!ctx) {
      try {
        ctx = new (window.AudioContext || window.webkitAudioContext)();
      } catch (e) { return null; }
    }
    if (ctx.state === 'suspended') ctx.resume();
    return ctx;
  }

  function tone({ freq = 440, type = 'sine', duration = 0.15, vol = 0.15, attack = 0.01, decay = 0.05 }) {
    if (muted) return;
    const c = ensureCtx();
    if (!c) return;
    const osc = c.createOscillator();
    const g = c.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    g.gain.setValueAtTime(0, c.currentTime);
    g.gain.linearRampToValueAtTime(vol, c.currentTime + attack);
    g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + duration);
    osc.connect(g);
    g.connect(c.destination);
    osc.start(c.currentTime);
    osc.stop(c.currentTime + duration);
  }

  function chord(freqs, opts = {}) {
    freqs.forEach((f, i) => setTimeout(() => tone({ freq: f, ...opts }), i * 80));
  }

  return {
    isMuted: () => muted,
    toggle() {
      muted = !muted;
      localStorage.setItem('sfx_muted', muted ? '1' : '0');
      if (muted) this.stopSaw();
      return muted;
    },
    click() { tone({ freq: 800, duration: 0.06, vol: 0.08, type: 'square' }); },
    pop() { tone({ freq: 600, duration: 0.1, vol: 0.1, type: 'triangle' }); },
    success() { chord([523, 659, 784], { duration: 0.18, vol: 0.12, type: 'sine' }); },
    win() { chord([523, 659, 784, 1046], { duration: 0.25, vol: 0.13, type: 'sine' }); },
    error() { tone({ freq: 220, duration: 0.2, vol: 0.12, type: 'sawtooth' }); setTimeout(() => tone({ freq: 180, duration: 0.2, vol: 0.12, type: 'sawtooth' }), 120); },
    warn() { tone({ freq: 880, duration: 0.1, vol: 0.1, type: 'square' }); setTimeout(() => tone({ freq: 880, duration: 0.1, vol: 0.1, type: 'square' }), 150); },
    unlock() { chord([392, 523, 659, 784], { duration: 0.3, vol: 0.14, type: 'sine' }); },
    star(n) {
      const freqs = [];
      for (let i = 0; i < n; i++) freqs.push(523 + i * 130);
      chord(freqs, { duration: 0.2, vol: 0.13 });
    },
    // 鋸條持續運行的音（環境音）
    startSaw() {
      if (muted) return;
      const c = ensureCtx();
      if (!c || sawOscillator) return;
      sawOscillator = c.createOscillator();
      sawGain = c.createGain();
      sawOscillator.type = 'sawtooth';
      sawOscillator.frequency.value = 80;
      sawGain.gain.value = 0.04;
      // 加 LFO 製造振動感
      const lfo = c.createOscillator();
      const lfoGain = c.createGain();
      lfo.frequency.value = 12;
      lfoGain.gain.value = 4;
      lfo.connect(lfoGain);
      lfoGain.connect(sawOscillator.frequency);
      lfo.start();
      sawOscillator.connect(sawGain);
      sawGain.connect(c.destination);
      sawOscillator.start();
      sawOscillator._lfo = lfo;
    },
    stopSaw() {
      if (sawOscillator) {
        try {
          sawOscillator._lfo?.stop();
          sawOscillator.stop();
        } catch (e) {}
        sawOscillator = null;
        sawGain = null;
      }
    },
    setSawSpeed(speed) {
      // speed: 0~1
      if (sawGain && sawOscillator) {
        sawGain.gain.setTargetAtTime(0.03 + speed * 0.06, ctx.currentTime, 0.05);
        sawOscillator.frequency.setTargetAtTime(70 + speed * 60, ctx.currentTime, 0.05);
      }
    },
    // 切割摩擦聲
    cutFriction() {
      if (muted) return;
      const c = ensureCtx();
      if (!c) return;
      const bufferSize = c.sampleRate * 0.05;
      const buffer = c.createBuffer(1, bufferSize, c.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) data[i] = (Math.random() * 2 - 1) * 0.3;
      const noise = c.createBufferSource();
      noise.buffer = buffer;
      const filter = c.createBiquadFilter();
      filter.type = 'highpass';
      filter.frequency.value = 1500;
      const g = c.createGain();
      g.gain.value = 0.06;
      noise.connect(filter);
      filter.connect(g);
      g.connect(c.destination);
      noise.start();
    },
  };
})();

// 浮動的喇叭按鈕
document.addEventListener('DOMContentLoaded', () => {
  const btn = document.createElement('button');
  btn.className = 'sound-toggle';
  btn.innerHTML = SoundFX.isMuted() ? '🔇' : '🔊';
  btn.title = SoundFX.isMuted() ? '音效：關' : '音效：開';
  btn.setAttribute('aria-label', '切換音效');
  btn.addEventListener('click', () => {
    const muted = SoundFX.toggle();
    btn.innerHTML = muted ? '🔇' : '🔊';
    btn.title = muted ? '音效：關' : '音效：開';
    if (!muted) SoundFX.click();
  });
  document.body.appendChild(btn);
});
