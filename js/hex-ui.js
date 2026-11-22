'use strict';
/* ==========================================================================
   TRI-REALM IDLE — Shinjuku: the exorcism (hex.js is the engine)
   A rainy neon alley at night. Your avatar gathers cursed energy, joins its hands in a seal,
   then strikes the writhing curse in its sealing circle: a talisman, a palm of cursed energy
   or a fan of three talismans (strong grades take a Black Flash and shake the alley). Its grade hangs over it before the
   fight (a Grade 1 is bigger and darker, a Special Grade burns red); when it falls it
   is torn apart into rising smoke and the next one rises.
   Loaded after kaio-ui.js.
   ========================================================================== */

// One drawn curse per study (creature plans from creatures.js).
const CURSE_LOOK = {
  hex_ash:     ['spirit', { robe: '#2a5a7a', face: '#0c1620', eye: '#7df9ff', mouth: 1 }],
  hex_residue: ['spirit', { robe: '#e8e4f2', face: '#1a1626', eye: '#ffd23a', talismans: 1 }],
  hex_ember:   ['husk', { body: '#3a2a2a', mask: '#f2e6d4', eye: '#ff7a3a' }],
  hex_shade:   ['spirit', { robe: '#c9a46a', face: '#2a1a0a', eye: '#ffe46a', sand: '#e8d29a', claw: '#f3ead2' }],
  hex_core:    ['blob', { body: '#5a2a6a', eye: '#d4ff3a', moss: '#2f6a4a' }],
  hex_void:    ['spirit', { robe: '#d8e4f2', face: '#101420', eye: '#7df9ff', talismans: 1, halo: '#7df9ff' }],
  hex_crown:   ['spirit', { robe: '#1a1026', face: '#05040c', eyes: 'many', eye: '#ff5ab4', mouth: 1, halo: '#8b2bd6' }],
};
for (const k in CURSE_LOOK) CREATURES['Curse:' + k] = CURSE_LOOK[k];
const HEX_BOX = { x: 110, y: 58, h: 194 };
const CURSE_AT = [490, 186];
// Three techniques, one per curse: a thrown talisman, a palm of cursed energy, a fan of three
// talismans. Each starts the same way: energy gathered in meditation, then hands joined in a seal.
const HXP = {
  seal: { sh: 1, tw: 0.8, t1: 178, t2: 0, n: 2, h: 4, ht: 0, st: 0, aF: [40, 100], aB: [30, 110], lF: [22, -28], lB: [-20, 10], fF: 10, fB: -16, g: -150, dy: 8, bf: 1 },
  wind: Object.assign({}, POSES.windup, { sh: 1 }),
  throw: Object.assign({}, POSES.strike, { sh: 1, fx: '' }),
  after: Object.assign({}, POSES.guard, { sh: 1, t1: 170, dy: 12 }),
  charge: Object.assign({}, GP.charge, { sh: 1 }),
  palm: Object.assign({}, GP.palms, { sh: 1 }),
  fan: Object.assign({}, POSES.strike, { sh: 1, fx: '', aF: [118, -6], t1: 170 }),
};
const HEX_TECH = [
  [[0, POSES.meditate], [0.45, POSES.meditate], [0.55, HXP.seal, 'out'], [0.64, HXP.wind], [0.72, HXP.throw, 'out'], [0.8, HXP.throw], [0.9, HXP.after], [1, POSES.meditate]],
  [[0, POSES.meditate], [0.45, POSES.meditate], [0.55, HXP.seal, 'out'], [0.64, HXP.charge], [0.72, HXP.palm, 'out'], [0.84, HXP.palm], [0.92, HXP.after], [1, POSES.meditate]],
  [[0, POSES.meditate], [0.45, POSES.meditate], [0.55, HXP.seal, 'out'], [0.64, HXP.wind], [0.72, HXP.fan, 'out'], [0.8, HXP.fan], [0.9, HXP.after], [1, POSES.meditate]],
];
const HXS = { n: 0, v: null };
POSE_DRIVE.exorcise = (u, t, B, calm) => {
  if (HXS.v != null && u < HXS.v - 0.5) HXS.n++;
  HXS.v = u;
  return keyPose(HEX_TECH[HXS.n % 3], u);
};
DRIVE_SKILL.exorcise = ['exorcism', 3.5];
POSES.exorcise = POSE_DRIVE.exorcise(0, 0, BODY, true);
const HEX_THROW = 0.72;

function hexBg() {
  const H = 250;
  let s = `<defs>${spGrad('hx-sky', ['#090a1c', '#1a1438', '#2c1a4a'])}${spGlow('hx-pink', '#ff4fb4')}${spGlow('hx-cyan', '#4ff0ff')}${spGlow('hx-seal', '#c48cff')}</defs>`;
  s += `<rect width="800" height="320" fill="url(#hx-sky)"/>`;
  // far towers with lit windows
  const r = sceneRng(29);
  for (let i = 0; i < 14; i++) {
    const x = i * 60 - 10 + r() * 20, w = 40 + r() * 30, h = 120 + r() * 140;
    s += `<rect x="${x.toFixed(0)}" y="${(H - h).toFixed(0)}" width="${w.toFixed(0)}" height="${h.toFixed(0)}" fill="#120f24"/>`;
    for (let k = 0; k < 8; k++) if (r() < 0.45) s += `<rect x="${(x + 5 + r() * (w - 12)).toFixed(0)}" y="${(H - h + 8 + r() * (h - 30)).toFixed(0)}" width="4" height="6" fill="${r() < 0.5 ? '#ffd27a' : '#7df9ff'}" opacity=".6"/>`;
  }
  // neon signs
  for (const [x, y, w, c, g] of [[40, 70, 70, '#ff4fb4', 'hx-pink'], [330, 50, 90, '#4ff0ff', 'hx-cyan'], [690, 90, 60, '#ff4fb4', 'hx-pink']]) {
    s += `<circle cx="${x + w / 2}" cy="${y + 14}" r="${w}" fill="url(#${g})" opacity=".35" class="hx-neon"/><rect x="${x}" y="${y}" width="${w}" height="28" rx="4" fill="#0a0a14" stroke="${c}" stroke-width="3" class="hx-neon"/>`;
    s += `<path d="M${x + 10} ${y + 14} h${w - 20}" stroke="${c}" stroke-width="4" stroke-dasharray="8 5" class="hx-neon"/>`;
  }
  // the wet street, a reflection of the neon
  s += `<rect y="${H}" width="800" height="${320 - H}" fill="#151225"/><rect y="${H}" width="800" height="3" fill="#3a2f5a"/>`;
  for (const [x, c] of [[75, '#ff4fb4'], [375, '#4ff0ff'], [720, '#ff4fb4']]) s += `<rect x="${x - 20}" y="${H + 10}" width="40" height="50" fill="${c}" opacity=".12"/>`;
  // the sealing circle under the curse
  s += `<ellipse cx="${CURSE_AT[0]}" cy="${H + 12}" rx="110" ry="18" fill="none" stroke="#c48cff" stroke-width="3" opacity=".8" class="hx-seal"/><ellipse cx="${CURSE_AT[0]}" cy="${H + 12}" rx="86" ry="13" fill="none" stroke="#c48cff" stroke-width="1.5" stroke-dasharray="6 6" opacity=".7"/>`;
  s += `<ellipse cx="${CURSE_AT[0]}" cy="${H + 12}" rx="120" ry="40" fill="url(#hx-seal)" opacity=".25"/>`;
  return s;
}
function curseHTML(a) {
  const G = curGrade(), id = a ? Object.keys(a.out)[0] : 'hex_ash', sc = { g4: 0.8, g3: 0.9, g2: 1, g1: 1.12, sp: 1.28 }[G.id];
  return `<div class="hx-curse g-${G.id}" style="left:${(CURSE_AT[0] / 8).toFixed(2)}%;top:${(CURSE_AT[1] / 3.2).toFixed(2)}%;--sc:${sc};--gc:${G.col}">
    <span class="hx-grade">${esc(G.name)}</span>${creatureSVG('Curse:' + id)}</div>`;
}
function hexHTML() {
  const a = S.action && S.action.skill === 'exorcism' ? findAction('exorcism', S.action.id) : null;
  const best = SKILLS.exorcism.actions.filter((x) => x.level <= skillLv('exorcism')).pop();
  const last = SPOT.last_exorcism;
  return `<section class="win spot-win" style="--rc:${rc('hex')}">
    <div class="spot sp-hex ${a ? 'on' : ''}" data-spot="exorcism">
      <svg class="spot-bg" viewBox="0 0 800 320" preserveAspectRatio="none" aria-hidden="true">${hexBg()}</svg>
      <div class="hx-rain"></div>
      ${spotAvatar(HEX_BOX, a ? 'exorcise' : '')}
      <div class="hx-slot">${curseHTML(a || best)}</div>
      <svg class="spot-fx" viewBox="0 0 800 320" preserveAspectRatio="none" aria-hidden="true"><defs><filter id="sp-soft" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="2.4"/></filter></defs><g data-spotfx></g><g data-parts></g></svg>
      <div class="spot-pops"></div>
      <div class="spot-hud"><span class="sh-name"><small>Shinjuku, after dark</small><b>${esc(a ? a.name : 'Pick a curse to study')}</b></span>${last ? `<span class="sh-last">${last}</span>` : '<span class="sh-last" hidden></span>'}</div>
    </div>
    <div class="spot-bar">${spotStats('exorcism')}</div>
  </section>`;
}
UIX.realmScene.push((realm, skill) => (skill === 'exorcism' ? hexHTML() : ''));
{
  const base = spotStats;
  spotStats = function (skill) {
    if (skill === 'exorcism' && !S.action) return `<div class="spot-idle">${ui('play')}<span>Pick a curse to study. Its grade shows before you face it.</span></div>`;
    return base(skill);
  };
}
// The talisman in flight: from the hand to the curse (dy: a fanned one's offset).
const talisAt = (k, dy) => {
  const x0 = HEX_BOX.x + HEX_BOX.h * 0.62, y0 = HEX_BOX.y + HEX_BOX.h * 0.36, [x1, y1] = CURSE_AT, e = ease.out(k);
  return [x0 + (x1 - x0) * e, y0 + (y1 - 20 - y0) * e - Math.sin(Math.PI * k) * (30 + (dy || 0)) + (dy || 0) * Math.sin(Math.PI * k) * 0.4];
};
function talisSVG(k, dy) {
  const [x, y] = talisAt(k, dy), rot = k * 720;
  return `<g transform="translate(${x.toFixed(1)} ${y.toFixed(1)}) rotate(${rot.toFixed(0)})"><rect x="-6" y="-10" width="12" height="20" fill="#f4ecd0" stroke="#0a0c11" stroke-width="1.5"/><path d="M-3 -6 h6 M-3 -1 h6 M-2 4 h4" stroke="#c8341a" stroke-width="1.6"/></g>`
    + `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="14" fill="#c48cff" opacity=".35" filter="url(#sp-soft)"/>`;
}
const hexGi = () => ['g4', 'g3', 'g2', 'g1', 'sp'].indexOf(HEX().grade);
UPD.push(() => {
  const el = spotNow();
  if (!el || el.dataset.spot !== 'exorcism') return;
  const k = actFrac('exorcism'), av = el.querySelector('.spot-av svg.avatar'), g = el.querySelector('[data-spotfx]'), r = Math.random;
  el.classList.toggle('on', k >= 0);
  setPose(av, k >= 0 ? 'exorcise' : '');
  if (!g) return;
  const gi = Math.max(0, hexGi());
  // the curse bleeds cursed smoke, more the stronger it is
  if (r() < 0.08 + gi * 0.05) partAdd({ kind: 'wisp', x: CURSE_AT[0] + (r() - 0.5) * 70, y: CURSE_AT[1] + 10 + (r() - 0.5) * 40, vx: (r() - 0.5) * 14, vy: -26 - r() * 20, g: 0, life: 1.3, size: 4 + gi * 1.5, col: gi >= 4 ? '#5a0a14' : '#2a0f45', op: 0.5 });
  if (k < 0) { if (g.innerHTML) g.innerHTML = ''; SPOT.hexV = null; return; }
  const u = driveU('exorcise', performance.now() / 1000), prev = SPOT.hexV, tech = HXS.n % 3;
  SPOT.hexV = u;
  // gathering: cursed energy curls up around the meditating body, then flares in the joined hands
  if (u < 0.5 && r() < 0.35) partAdd({ kind: 'wisp', x: HEX_BOX.x + 70 + (r() - 0.5) * 100, y: HEX_BOX.y + 160 + (r() - 0.5) * 30, vx: (r() - 0.5) * 10, vy: -40 - r() * 30, g: 0, life: 0.9, size: 4 + r() * 3, col: r() < 0.5 ? '#7a3cff' : '#3a1a8a', op: 0.6 });
  if (u >= 0.5 && u < 0.72 && r() < 0.6) {
    const hp = avPoint(av, HEX_BOX, 'aF');
    if (hp) partAdd({ kind: 'wisp', x: hp[0] + (r() - 0.5) * 14, y: hp[1], vx: (r() - 0.5) * 20, vy: -60 - r() * 40, g: 0, life: 0.5, size: 5 + r() * 3, col: r() < 0.6 ? '#9a5cff' : '#e8d4ff', op: 0.8 });
  }
  // the technique in flight for the last part of the cycle
  const fly = u >= HEX_THROW && u < 0.95, kf = (u - HEX_THROW) / (0.95 - HEX_THROW);
  if (!fly) g.innerHTML = '';
  else if (tech === 1) {   // a palm of cursed energy: an orb that grows as it flies
    const [x, y] = talisAt(kf, -30), rr = 9 + kf * 8;
    g.innerHTML = `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${(rr * 1.9).toFixed(1)}" fill="#7a3cff" opacity=".35" filter="url(#sp-soft)"/><circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${rr.toFixed(1)}" fill="#1a0630" stroke="#c48cff" stroke-width="3"/><circle cx="${(x - 2).toFixed(1)}" cy="${(y - 2).toFixed(1)}" r="${(rr * 0.4).toFixed(1)}" fill="#e8d4ff" opacity=".8"/>`;
    if (r() < 0.8) partAdd({ kind: 'wisp', x: x - 6, y, vx: -40, vy: (r() - 0.5) * 30, g: 0, life: 0.4, size: 4, col: '#7a3cff', op: 0.7 });
  } else {
    const fan = tech === 2 ? [-26, 0, 26] : [0];
    g.innerHTML = fan.map((dy) => talisSVG(kf, dy)).join('');
    if (r() < 0.7) { const [x, y] = talisAt(kf, 0); partAdd({ kind: 'wisp', x, y, vx: -30, vy: -10, g: 0, life: 0.35, size: 3.5, col: '#c48cff', op: 0.6 }); }
  }
  if (prev != null && prev < HEX_THROW && u >= HEX_THROW) { const hp = avPoint(av, HEX_BOX, 'aF'); if (hp) spotPop('', hp[0], hp[1], 'hx-ring', 500); }
  if (prev != null && prev < 0.95 && u >= 0.95) hexImpact(el, gi, tech);
});
// The technique lands: a flash and a violet shock on the curse, cursed energy torn out of it;
// stronger curses take a bigger, redder blow (and shake the alley). Now and then: a Black Flash.
function hexImpact(el, gi, tech) {
  const r = Math.random, [x, y] = [CURSE_AT[0], CURSE_AT[1] - 20], black = gi >= 3 || r() < 0.12;
  retrigger(el.querySelector('.hx-curse'), 'hit');
  partAdd({ kind: 'flash', x, y, life: 0.18 + gi * 0.03, g: 0 });
  spotPop('', x, y, 'hx-shock' + (gi >= 4 ? ' sp' : ''), 650);
  if (black) spotPop(crackleSVG(), x, y, 'hx-crackle', 520);
  const n = 6 + gi * 3 + (tech === 2 ? 4 : 0);
  for (let i = 0; i < n; i++) {
    const a = r() * Math.PI * 2, v = 80 + r() * (120 + gi * 40);
    partAdd({ kind: i % 2 ? 'wisp' : 'star', x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v * 0.7, g: 0, life: 0.5 + r() * 0.3, size: i % 2 ? 5 : 3, vr: 300, col: i % 2 ? (gi >= 4 ? '#8a0a1a' : '#2a0f45') : black ? '#ff4a5a' : '#e8d4ff', op: 0.8 });
  }
  if (gi >= 2) retrigger(el, 'thud');
}
// Red-and-black lightning around the point of impact (100 x 100 box).
function crackleSVG() {
  const r = Math.random;
  let d = '';
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2 + r() * 0.5;
    let x = 50, y = 50;
    d += `M${x} ${y}`;
    for (let k = 1; k <= 4; k++) { const rr = k * 11; x = 50 + Math.cos(a) * rr + (r() - 0.5) * 12; y = 50 + Math.sin(a) * rr + (r() - 0.5) * 12; d += ` L${x.toFixed(1)} ${y.toFixed(1)}`; }
  }
  return `<svg viewBox="0 0 100 100"><path d="${d}" fill="none" stroke="#0a0008" stroke-width="6" stroke-linejoin="round"/><path d="${d}" fill="none" stroke="#ff3a4a" stroke-width="2.6" stroke-linejoin="round"/><circle cx="50" cy="50" r="10" fill="#0a0008"/></svg>`;
}
// The curse falls: smoke, its loot, and the next one rises with its own grade.
on('exorcised', (d) => {
  const id = Object.keys(d.act.out)[0], it = ITEMS[id], G = GRADE_BY[d.grade];
  setLast('exorcism', `<small>${esc(G.name)} exorcised</small><b>${esc(it.name)}</b><em>${fmt(familyCount(id))} owned</em>`);
  const el = spotNow();
  if (!el || el.dataset.spot !== 'exorcism') return;
  const r = Math.random, gi = ['g4', 'g3', 'g2', 'g1', 'sp'].indexOf(d.grade);
  // banishment: the curse is pulled apart into rising smoke, the seal under it flares
  const c = el.querySelector('.hx-curse');
  if (c) retrigger(c, 'banish');
  spotPop('', CURSE_AT[0], 262, 'hx-sealflash' + (gi >= 4 ? ' sp' : ''), 800);
  for (let i = 0; i < 8 + gi * 3; i++) partAdd({ kind: 'wisp', x: CURSE_AT[0] + (r() - 0.5) * 80, y: CURSE_AT[1] + (r() - 0.5) * 50, vx: (r() - 0.5) * 30, vy: -60 - r() * 60, g: 0, size: 5 + r() * 5, life: 0.9 + r() * 0.4, col: gi >= 4 ? '#5a0a14' : '#1a0a2a', op: 0.7 });
  for (let i = 0; i < 6; i++) partAdd({ kind: 'puff', x: CURSE_AT[0] + (r() - 0.5) * 60, y: CURSE_AT[1] - 10 + (r() - 0.5) * 40, vx: (r() - 0.5) * 40, vy: -30 - r() * 30, g: 0, size: 6 + r() * 6, life: 1.2 });
  spotPop(`<span class="tile-art">${itemIc(id)}</span>`, CURSE_AT[0], CURSE_AT[1] - 30, 'dish', 1300);
  if (G.m > 1) spotPop(`<b>${esc(G.name)} · ×${G.m}</b>`, CURSE_AT[0], CURSE_AT[1] - 100, 'tag' + (G.m >= 3 ? ' gold' : ''), 1500);
  const slot = el.querySelector('.hx-slot');
  if (slot) setTimeout(() => { if (slot.isConnected) { slot.innerHTML = curseHTML(d.act); retrigger(slot.firstElementChild, 'rise'); } }, 480);
});
on('gradeahead', (d) => {
  const el = spotNow();
  if (!el || el.dataset.spot !== 'exorcism') return;
  setTimeout(() => spotPop(`${ui('skull')}${d.grade === 'sp' ? 'A Special Grade curse appears!' : 'A Grade 1 curse appears'}`, CURSE_AT[0] - 60, 70, 'tag gold', 2000), 500);
});
on('specialgrade', (d) => {
  toast(`Special Grade curse exorcised: ×6 spoils, 3 Cursed Fragments and ${ITEMS[d.item].name}!`, 'rare');
  const el = spotNow();
  if (!el || el.dataset.spot !== 'exorcism') { burst('Special Grade!', `${ITEMS[d.item].name} · ×6 spoils`, itemIc(d.item), '#ff4a5a'); return; }
  sxBurst(el, CURSE_AT[0], CURSE_AT[1] - 20, true, 'Special Grade!', '×6 spoils · 3 Cursed Fragments');
});
