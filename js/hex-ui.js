'use strict';
/* ==========================================================================
   TRI-REALM IDLE — Shinjuku: the exorcism (hex.js is the engine)
   A rainy neon alley at night. Your avatar gathers cursed energy, then throws a talisman
   at the curse floating inside a sealing circle. Its grade hangs over it before the
   fight (a Grade 1 is bigger and darker, a Special Grade burns red); when it falls it
   dissolves into smoke and the next one rises.
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
POSE_DRIVE.exorcise = (u, t, B, calm) => keyPose([[0, POSES.meditate], [0.5, POSES.meditate], [0.62, POSES.windup], [0.72, POSES.strike, 'out'], [0.86, POSES.guard], [1, POSES.meditate]], u);
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
// The talisman in flight: from the hand to the curse.
function talisSVG(k) {
  const x0 = HEX_BOX.x + HEX_BOX.h * 0.62, y0 = HEX_BOX.y + HEX_BOX.h * 0.36, [x1, y1] = CURSE_AT;
  const x = x0 + (x1 - x0) * k, y = y0 + (y1 - 20 - y0) * k - Math.sin(Math.PI * k) * 30, rot = k * 720;
  return `<g transform="translate(${x.toFixed(1)} ${y.toFixed(1)}) rotate(${rot.toFixed(0)})"><rect x="-6" y="-10" width="12" height="20" fill="#f4ecd0" stroke="#0a0c11" stroke-width="1.5"/><path d="M-3 -6 h6 M-3 -1 h6 M-2 4 h4" stroke="#c8341a" stroke-width="1.6"/></g>`
    + `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="14" fill="#c48cff" opacity=".35" filter="url(#sp-soft)"/>`;
}
UPD.push(() => {
  const el = spotNow();
  if (!el || el.dataset.spot !== 'exorcism') return;
  const k = actFrac('exorcism'), av = el.querySelector('.spot-av svg.avatar'), g = el.querySelector('[data-spotfx]');
  el.classList.toggle('on', k >= 0);
  setPose(av, k >= 0 ? 'exorcise' : '');
  if (!g) return;
  if (k < 0) { if (g.innerHTML) g.innerHTML = ''; SPOT.hexV = null; return; }
  const u = driveU('exorcise', performance.now() / 1000), prev = SPOT.hexV;
  SPOT.hexV = u;
  // gathering energy: motes drift into the hands while meditating
  if (u < 0.5 && Math.random() < 0.3) partAdd({ kind: 'star', x: HEX_BOX.x + 70 + (Math.random() - 0.5) * 120, y: HEX_BOX.y + 120 + (Math.random() - 0.5) * 60, vx: 0, vy: -20, g: 0, life: 0.8, size: 2.5, vr: 200, col: '#c48cff' });
  // the talisman flies for the last part of the cycle
  g.innerHTML = u >= HEX_THROW && u < 0.95 ? talisSVG((u - HEX_THROW) / (0.95 - HEX_THROW)) : '';
  if (prev != null && prev < 0.95 && u >= 0.95) {
    const c = el.querySelector('.hx-curse');
    retrigger(c, 'hit');
    partAdd({ kind: 'flash', x: CURSE_AT[0], y: CURSE_AT[1] - 20, life: 0.18, g: 0 });
    for (let i = 0; i < 8; i++) partAdd({ kind: 'star', x: CURSE_AT[0], y: CURSE_AT[1] - 20, vx: (Math.random() - 0.5) * 220, vy: (Math.random() - 0.5) * 160, g: 0, life: 0.6, size: 3, vr: 300, col: '#e8d4ff' });
  }
});
// The curse falls: smoke, its loot, and the next one rises with its own grade.
on('exorcised', (d) => {
  const id = Object.keys(d.act.out)[0], it = ITEMS[id], G = GRADE_BY[d.grade];
  setLast('exorcism', `<small>${esc(G.name)} exorcised</small><b>${esc(it.name)}</b><em>${fmt(familyCount(id))} owned</em>`);
  const el = spotNow();
  if (!el || el.dataset.spot !== 'exorcism') return;
  const r = Math.random;
  for (let i = 0; i < 10; i++) partAdd({ kind: 'puff', x: CURSE_AT[0] + (r() - 0.5) * 60, y: CURSE_AT[1] - 10 + (r() - 0.5) * 40, vx: (r() - 0.5) * 40, vy: -30 - r() * 30, g: 0, size: 6 + r() * 6, life: 1.2 });
  spotPop(`<span class="tile-art">${itemIc(id)}</span>`, CURSE_AT[0], CURSE_AT[1] - 30, 'dish', 1300);
  if (G.m > 1) spotPop(`<b>${esc(G.name)} · ×${G.m}</b>`, CURSE_AT[0], CURSE_AT[1] - 100, 'tag' + (G.m >= 3 ? ' gold' : ''), 1500);
  const slot = el.querySelector('.hx-slot');
  if (slot) setTimeout(() => { if (slot.isConnected) { slot.innerHTML = curseHTML(d.act); retrigger(slot.firstElementChild, 'rise'); } }, 450);
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
