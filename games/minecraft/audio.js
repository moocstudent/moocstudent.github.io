// audio.js — Web Audio API 音效与背景音乐
const SFX = (() => {
  let _ctx = null;

  function ctx() {
    if (!_ctx) _ctx = new (window.AudioContext || window.webkitAudioContext)();
    if (_ctx.state === 'suspended') _ctx.resume();
    return _ctx;
  }

  /* ── 基础发声 ─────────────────────────── */
  function tone(freq, dur, type = 'sine', vol = 0.18, delay = 0) {
    const c = ctx();
    const osc = c.createOscillator();
    const g = c.createGain();
    osc.connect(g); g.connect(c.destination);
    osc.type = type; osc.frequency.value = freq;
    const t = c.currentTime + delay;
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    osc.start(t); osc.stop(t + dur + 0.02);
  }

  function noise(dur, bandFreq, vol = 0.14) {
    const c = ctx();
    const size = Math.floor(c.sampleRate * dur);
    const buf = c.createBuffer(1, size, c.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < size; i++) d[i] = Math.random() * 2 - 1;
    const src = c.createBufferSource(); src.buffer = buf;
    const flt = c.createBiquadFilter();
    flt.type = 'bandpass'; flt.frequency.value = bandFreq; flt.Q.value = 1.5;
    const g = c.createGain();
    g.gain.setValueAtTime(vol, c.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + dur);
    src.connect(flt); flt.connect(g); g.connect(c.destination);
    src.start(); src.stop(c.currentTime + dur);
  }

  /* ── 挖掘音效 ─────────────────────────── */
  function dig(type) {
    switch (type) {
      case 'grass': case 'dirt': noise(0.14, 340, 0.22); break;
      case 'stone': case 'cobblestone': case 'obsidian':
        noise(0.1, 900, 0.18); tone(100, 0.09, 'square', 0.07); break;
      case 'wood': case 'plank': case 'bookshelf':
        noise(0.12, 520, 0.18); tone(190, 0.08, 'sine', 0.06); break;
      case 'sand': case 'gravel': noise(0.13, 200, 0.18); break;
      case 'leaves': noise(0.08, 720, 0.12); break;
      case 'glass': tone(1300, 0.05, 'sine', 0.14); noise(0.07, 2000, 0.09); break;
      default: noise(0.1, 450, 0.14);
    }
  }

  function place() { noise(0.08, 420, 0.14); tone(260, 0.05, 'sine', 0.07); }

  function step(type) {
    const f = (type === 'stone' || type === 'cobblestone') ? 650 :
              (type === 'wood'  || type === 'plank')       ? 380 : 280;
    noise(0.055, f, 0.06);
  }

  /* ── 动物音效 ─────────────────────────── */
  function chicken() {
    tone(920, 0.07, 'square', 0.14);
    tone(1120, 0.06, 'square', 0.11, 0.09);
    tone(920, 0.05, 'square', 0.09, 0.17);
  }

  function pig() {
    tone(330, 0.18, 'sine', 0.18);
    tone(290, 0.13, 'sine', 0.13, 0.21);
  }

  function cow() {
    tone(145, 0.34, 'sine', 0.2);
    tone(115, 0.28, 'sine', 0.15, 0.38);
  }

  function sheep() {
    const c = ctx();
    const osc = c.createOscillator(), g = c.createGain();
    osc.connect(g); g.connect(c.destination); osc.type = 'sine';
    osc.frequency.setValueAtTime(510, c.currentTime);
    osc.frequency.linearRampToValueAtTime(400, c.currentTime + 0.22);
    osc.frequency.linearRampToValueAtTime(490, c.currentTime + 0.38);
    g.gain.setValueAtTime(0.17, c.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.42);
    osc.start(); osc.stop(c.currentTime + 0.45);
  }

  function horse() {
    const c = ctx();
    const osc = c.createOscillator(), g = c.createGain();
    osc.connect(g); g.connect(c.destination); osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(360, c.currentTime);
    osc.frequency.linearRampToValueAtTime(560, c.currentTime + 0.15);
    osc.frequency.linearRampToValueAtTime(310, c.currentTime + 0.48);
    g.gain.setValueAtTime(0.16, c.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.52);
    osc.start(); osc.stop(c.currentTime + 0.56);
  }

  function zombie() {
    const c = ctx();
    const osc = c.createOscillator(), g = c.createGain();
    osc.connect(g); g.connect(c.destination); osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(72 + Math.random() * 28, c.currentTime);
    osc.frequency.linearRampToValueAtTime(52, c.currentTime + 0.46);
    g.gain.setValueAtTime(0.14, c.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.52);
    osc.start(); osc.stop(c.currentTime + 0.56);
  }

  /* ── 背景音乐（C418 风格安静旋律）─────── */
  // 音符频率
  const N = { G3:196, A3:220, B3:246.9, C4:261.6, D4:293.7,
               E4:329.6, F4:349.2, G4:392, A4:440, B4:493.9 };

  // 旋律 [频率|null, 时值(秒)]
  const MELODY = [
    [N.E4,1.2],[null,0.4],[N.G4,1.0],[N.A4,0.8],[N.G4,0.4],[N.E4,1.0],
    [N.D4,0.8],[null,0.2],[N.C4,0.6],[N.E4,1.6],[null,0.8],
    [N.G4,1.2],[null,0.4],[N.A4,1.0],[N.B4,0.8],[N.A4,0.4],[N.G4,1.0],
    [N.F4,0.8],[null,0.2],[N.E4,0.6],[N.D4,0.8],[N.C4,2.2],[null,1.5],
  ];

  // 低音伴奏
  const BASS = [
    [N.C4/2,2],[N.G3/2,2],[N.A3/2,2],[N.G3/2,2],
    [N.C4/2,2],[N.G3/2,2],[N.F4/2,2],[N.G3/2,2],
  ];

  let musicOn = false, musicTimer = null;

  function schedNote(freq, t, dur, vol, type = 'sine') {
    const c = ctx();
    const osc = c.createOscillator(), g = c.createGain();
    osc.connect(g); g.connect(c.destination);
    osc.type = type; osc.frequency.value = freq;
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(vol, t + 0.06);
    g.gain.setValueAtTime(vol, t + dur - 0.1);
    g.gain.linearRampToValueAtTime(0, t + dur);
    osc.start(t); osc.stop(t + dur + 0.02);
  }

  function playSegment(startT) {
    if (!musicOn) return;
    const c = ctx();
    let t = startT, total = 0;
    MELODY.forEach(([f, dur]) => { if (f) schedNote(f, t, dur * 0.88, 0.055); t += dur; total += dur; });
    t = startT;
    BASS.forEach(([f, dur]) => { schedNote(f, t, dur * 0.75, 0.04); t += dur; });
    musicTimer = setTimeout(() => { if (musicOn) playSegment(ctx().currentTime + 0.1); }, total * 1000 + 300);
  }

  function startMusic() {
    if (musicOn) return;
    musicOn = true;
    playSegment(ctx().currentTime + 0.6);
  }

  function stopMusic() {
    musicOn = false;
    if (musicTimer) { clearTimeout(musicTimer); musicTimer = null; }
  }

  /* ── 战斗音效 ─────────────────────────── */
  function hit() {
    noise(0.07, 320, 0.22);
    tone(85, 0.09, 'sine', 0.14);
  }

  function mobDie() {
    tone(160, 0.12, 'sine', 0.18);
    tone(110, 0.18, 'sine', 0.14, 0.1);
    noise(0.12, 260, 0.12);
  }

  return { dig, place, step, chicken, pig, cow, sheep, horse, zombie, hit, mobDie, startMusic, stopMusic };
})();
