'use strict';
/* ==========================================================================
   Sound effects (2026-11-27). The sounds are synthesized by tools/sfx_synth.py into assets/sfx: koto, taiko,
   rin bells, shakuhachi, wood, washi paper and steel, all in D yo-pentatonic so the game has one voice.
   Web Audio: the files load after the first click or key (browsers only start audio then). Each play takes
   another variant and a small pitch jitter, busy sounds are throttled, and the game goes quiet in a hidden tab.
   Settings → Display → Sound. Loaded after ux3.js (it adds its row to UXSET).
   ========================================================================== */

// name: [variants, volume, min gap ms, max voices, pitch jitter]
// The loot and level-up sounds are tuned phrases: no jitter, or they would drift off the scale.
const SOUNDS = {
  hit_normal: [4, 0.5, 45, 3, 0.06],
  hit_crit: [3, 0.7, 70, 2, 0.05],
  foe_death: [3, 0.55, 150, 2, 0.04],
  loot_common: [3, 0.5, 90, 2, 0.05],
  loot_rare: [1, 0.75, 250, 1, 0],
  loot_epic: [1, 0.85, 400, 1, 0],
  loot_legendary: [1, 1, 800, 1, 0],
  level_up: [1, 0.8, 1200, 1, 0],
  ui_click: [3, 0.45, 35, 2, 0.04],
  ui_tab: [2, 0.5, 60, 1, 0.04],
};
UXSET.sound = { label: 'Sound', help: '', opts: [['off', 'Off'], ['30', 'Low'], ['60', 'Medium'], ['100', 'High']], def: '60' };

const sfx = { ctx: null, out: null, buf: {}, last: {}, live: {}, prev: {}, gesture: 0, tabAt: 0 };
const sfxExt = (() => { const a = document.createElement('audio'); return a.canPlayType && a.canPlayType('audio/ogg; codecs="vorbis"') ? 'ogg' : 'mp3'; })();
const sfxVol = () => (+uxSet('sound') || 0) / 100;   // 'off' → 0

function sfxStart() {
  if (sfx.ctx) { if (sfx.ctx.state === 'suspended' && !document.hidden) sfx.ctx.resume().catch(() => {}); return; }
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC || !sfxVol()) return;
  sfx.ctx = new AC();
  sfx.out = sfx.ctx.createGain();
  sfx.out.gain.value = sfxVol();
  // A soft limiter: a legendary drop over a crit over a level-up never clips.
  const lim = sfx.ctx.createDynamicsCompressor();
  lim.threshold.value = -6; lim.knee.value = 6; lim.ratio.value = 8; lim.attack.value = 0.002; lim.release.value = 0.15;
  sfx.out.connect(lim).connect(sfx.ctx.destination);
  for (const name in SOUNDS) {
    const n = SOUNDS[name][0];
    sfx.buf[name] = [];
    for (let i = 1; i <= n; i++) {
      fetch(`assets/sfx/${n > 1 ? name + '_' + i : name}.${sfxExt}`)
        .then((r) => r.arrayBuffer())
        .then((ab) => new Promise((ok, ko) => sfx.ctx.decodeAudioData(ab, ok, ko)))
        .then((b) => sfx.buf[name].push(b))
        .catch(() => {});
    }
  }
}

// o: { vol, rate, delay (s) }
function sfxPlay(name, o) {
  o = o || {};
  const D = SOUNDS[name], bufs = sfx.buf[name];
  if (SIM || !D || !sfx.ctx || sfx.ctx.state !== 'running' || document.hidden || !sfxVol() || !bufs || !bufs.length) return;
  const now = performance.now();
  if (now - (sfx.last[name] || 0) < D[2] || (sfx.live[name] || 0) >= D[3]) return;
  sfx.last[name] = now;
  let i = Math.floor(Math.random() * bufs.length);
  if (bufs.length > 1 && i === sfx.prev[name]) i = (i + 1) % bufs.length;   // never the same variant twice in a row
  sfx.prev[name] = i;
  const src = sfx.ctx.createBufferSource(), g = sfx.ctx.createGain();
  src.buffer = bufs[i];
  src.playbackRate.value = (o.rate || 1) * (1 + (Math.random() * 2 - 1) * D[4]);
  g.gain.value = D[1] * (o.vol != null ? o.vol : 1);
  src.connect(g).connect(sfx.out);
  sfx.live[name] = (sfx.live[name] || 0) + 1;
  src.onended = () => { sfx.live[name]--; g.disconnect(); };
  src.start(sfx.ctx.currentTime + (o.delay || 0));
}

// Several finds in one tick (a kill's loot + its 'rare' event, a chest...) play one sound: the best one.
let sfxLootR = 0;
function sfxLoot(r) {
  if (!sfxLootR) setTimeout(() => {
    const best = sfxLootR;
    sfxLootR = 0;
    sfxPlay(best >= 5 ? 'loot_legendary' : best >= 4 ? 'loot_epic' : best >= 3 ? 'loot_rare' : 'loot_common', { delay: 0.12 });
  }, 0);
  sfxLootR = Math.max(sfxLootR, r);
}

/* ---------------------------------------------------------------- game events */
on('hit', (d) => {
  if (!inBattleView() || d.dot || d.dodge) return;
  if (d.target === 'enemy') sfxPlay(d.crit || d.label ? 'hit_crit' : 'hit_normal', { vol: d.blocked ? 0.6 : 1 });
  else sfxPlay('hit_normal', { rate: 0.78, vol: 0.7 });   // a blow you take: the same flesh, lower and softer
});
on('kill', (d) => {
  const ids = Object.keys(d.loot || {}), r = ids.length ? Math.max(...ids.map(rarity)) : 0;
  if (inBattleView()) sfxPlay('foe_death');
  if (r && (inBattleView() || r >= 3)) sfxLoot(r);
});
on('rare', (d) => sfxLoot(rarity(d.id)));
on('schematic', () => sfxLoot(4));
on('pet', () => sfxLoot(5));
on('levelup', () => sfxPlay('level_up'));

/* ---------------------------------------------------------------- the interface */
// A page change the player asked for turns a page; any other button gives a wooden click.
{
  const base = setView;
  setView = function (v) {
    const was = S.ui.view;
    base(v);
    if (S.ui.view !== was && performance.now() - sfx.gesture < 600) { sfx.tabAt = performance.now(); sfxPlay('ui_tab'); }
  };
}
const sfxGesture = () => { sfx.gesture = performance.now(); sfxStart(); };
document.addEventListener('pointerdown', sfxGesture, true);
document.addEventListener('keydown', sfxGesture, true);
document.addEventListener('click', (ev) => {
  const t = ev.target.closest('button, a[href], [role="button"], [data-nav], summary');
  if (!t || t.disabled) return;
  const set = t.dataset && t.dataset.uxset && t.dataset.uxset.startsWith('sound:');
  setTimeout(() => {
    if (set) { sfxStart(); if (sfx.out) sfx.out.gain.value = sfxVol(); }
    if (performance.now() - sfx.tabAt > 80) sfxPlay('ui_click');
  }, 0);
});
document.addEventListener('visibilitychange', () => {
  if (!sfx.ctx) return;
  if (document.hidden) sfx.ctx.suspend().catch(() => {});
  else if (sfxVol()) sfx.ctx.resume().catch(() => {});
});
