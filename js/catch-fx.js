'use strict';
/* ==========================================================================
   TRI-REALM IDLE — Fishing: the catch, drawn
   Every catch is a drawn fish (its own shape and colours, sized by its weight) that the line pulls
   out of the water in an arc to the angler's feet.
   A shiny fish or a big one (trophy, or a record well above the usual size) gets a showcase:
   1. the fight: the line goes taut, the rod bends double, the angler braces, the water churns
      (and glows gold under a shiny);
   2. the burst: a column of water, the fish leaps high out of the sea;
   3. the hit-stop: it hangs in the air for a beat under a burst of light while its weight counts up;
   4. it drops at the angler's feet with a thud.
   Loaded after spot-ui.js (uses spotNow, spotPop, partAdd, SPOT, FISH_KG, fmtKg, driveU).
   ========================================================================== */

/* ================================================================ fish art */
// Each fish faces right, drawn in a -70..70 × -40..40 box. c: back, belly, fin, mark · s: the shiny palette.
const FISH_ART = {
  minnow:        { kind: 'fish', L: 74, H: 22, c: ['#7f97ad', '#e8eef4', '#9fb4c6', '#5a7086'], s: ['#e0a21a', '#fff2b0', '#ffd45a', '#a8700a'], size: 46 },
  reef_bass:     { kind: 'fish', L: 96, H: 44, c: ['#4f7a3a', '#e6dc9a', '#6f9a4a', '#2f4a22'], s: ['#d8486a', '#ffd6e0', '#ff86a6', '#8a1838'], size: 74, stripes: 4, mouth: 1 },
  sea_crab:      { kind: 'crab', c: ['#d8502a', '#f3a070', '#b8381a', '#7a1e0a'], s: ['#2f7ad8', '#a8d4ff', '#4f9aff', '#123e86'], size: 64 },
  blue_marlin:   { kind: 'marlin', L: 130, H: 30, c: ['#1f4f9a', '#dfe8f2', '#2d6bd0', '#7fc0ff'], s: ['#1a1a24', '#ffe08a', '#d8a020', '#ffd34a'], size: 168 },
  tidal_eel:     { kind: 'eel', c: ['#3a6a7a', '#c8e0c0', '#5a9aa0', '#21404a'], s: ['#c8a020', '#fff0a0', '#ffe060', '#7a5a08'], size: 128 },
  giant_octopus: { kind: 'octo', c: ['#c8485a', '#f39aa8', '#a83040', '#7a1828'], s: ['#7a3ad8', '#d8b0ff', '#a070ff', '#3a1478'], size: 116 },
  abyss_angler:  { kind: 'angler', L: 80, H: 56, c: ['#2e2c48', '#56527a', '#3e3a62', '#8ff3ff'], s: ['#e8f4ff', '#ffffff', '#bfe6ff', '#ff7af0'], size: 92 },
  sea_king:      { kind: 'king', c: ['#1f8a7a', '#f2d26a', '#2fb89e', '#0e4a40'], s: ['#d83a2a', '#ffd84a', '#ff7040', '#6a1008'], size: 210 },
};
const INK = '#0a0c11';
let fishUid = 0;
const r1f = (v) => Math.round(v * 10) / 10;
function fishBody(F, col, id) {
  const a = F.L / 2, b = F.H / 2, [back, belly, fin, mark] = col;
  const body = `M${a} ${r1f(b * 0.1)} C${r1f(a * 0.8)} ${r1f(-b * 1.12)} ${r1f(-a * 0.42)} ${r1f(-b * 1.02)} ${r1f(-a * 0.76)} ${r1f(-b * 0.2)} L${r1f(-a * 0.76)} ${r1f(b * 0.2)} C${r1f(-a * 0.42)} ${r1f(b * 1.02)} ${r1f(a * 0.8)} ${r1f(b * 1.06)} ${a} ${r1f(b * 0.1)}Z`;
  const tail = `M${r1f(-a * 0.7)} 0 L${r1f(-a * 1.14)} ${r1f(-b * 1.05)} Q${r1f(-a * 0.98)} 0 ${r1f(-a * 1.14)} ${r1f(b * 1.05)}Z`;
  const dorsal = F.kind === 'marlin'
    ? `M${r1f(a * 0.5)} ${r1f(-b * 0.85)} Q${r1f(a * 0.05)} ${r1f(-b * 2.9)} ${r1f(-a * 0.52)} ${r1f(-b * 0.8)}Z`
    : `M${r1f(a * 0.28)} ${r1f(-b * 0.92)} Q${r1f(-a * 0.02)} ${r1f(-b * 1.75)} ${r1f(-a * 0.42)} ${r1f(-b * 0.74)}Z`;
  const anal = `M${r1f(-a * 0.2)} ${r1f(b * 0.86)} Q${r1f(-a * 0.36)} ${r1f(b * 1.5)} ${r1f(-a * 0.56)} ${r1f(b * 0.6)}Z`;
  let s = `<g stroke="${INK}" stroke-width="2.4" stroke-linejoin="round" paint-order="stroke">`;
  s += `<path d="${tail}" fill="${fin}"/><path d="${dorsal}" fill="${fin}"/><path d="${anal}" fill="${fin}"/>`;
  if (F.kind === 'marlin') s += `<path d="M${r1f(a * 0.92)} ${r1f(-b * 0.12)} L${a + 44} ${r1f(-b * 0.02)} L${r1f(a * 0.92)} ${r1f(b * 0.26)}Z" fill="${back}"/>`;
  if (F.kind === 'angler') s += `<path d="M${r1f(a * 0.45)} ${r1f(-b * 0.85)} Q${r1f(a * 0.95)} ${r1f(-b * 2.1)} ${r1f(a * 1.25)} ${r1f(-b * 1.15)}" fill="none" stroke-width="2.4"/>`;
  s += `<path d="${body}" fill="${back}"/></g>`;
  // belly, stripes, gill, eye (clipped to the body)
  s += `<clipPath id="fb${id}"><path d="${body}"/></clipPath><g clip-path="url(#fb${id})">`;
  s += `<ellipse cx="${r1f(a * 0.05)}" cy="${r1f(b * 0.95)}" rx="${r1f(a * 1.05)}" ry="${r1f(b * 0.75)}" fill="${belly}"/>`;
  if (F.stripes) for (let i = 0; i < F.stripes; i++) { const x = a * (0.25 - i * 0.26); s += `<path d="M${r1f(x)} ${-b} q${r1f(-a * 0.08)} ${b} 0 ${r1f(b * 1.4)}" stroke="${mark}" stroke-width="${r1f(a * 0.09)}" fill="none" opacity=".55"/>`; }
  if (F.kind === 'marlin') for (let i = 0; i < 6; i++) { const x = a * (0.35 - i * 0.18); s += `<path d="M${r1f(x)} ${r1f(-b * 0.9)} v${r1f(b * 1.1)}" stroke="${mark}" stroke-width="2.4" opacity=".7"/>`; }
  s += `<ellipse cx="${r1f(a * 0.2)}" cy="${r1f(-b * 0.45)}" rx="${r1f(a * 0.7)}" ry="${r1f(b * 0.22)}" fill="#fff" opacity=".18"/>`;
  s += `</g>`;
  s += `<path d="M${r1f(a * 0.42)} ${r1f(-b * 0.55)} q${r1f(-a * 0.1)} ${r1f(b * 0.55)} 0 ${r1f(b * 1.05)}" stroke="${INK}" stroke-width="1.6" fill="none" opacity=".6"/>`;
  const er = Math.max(2.6, b * (F.kind === 'angler' ? 0.15 : 0.2));
  s += `<circle cx="${r1f(a * 0.66)}" cy="${r1f(-b * 0.24)}" r="${r1f(er)}" fill="#fff" stroke="${INK}" stroke-width="1.4"/><circle cx="${r1f(a * 0.66 + er * 0.25)}" cy="${r1f(-b * 0.24)}" r="${r1f(er * 0.55)}" fill="${INK}"/>`;
  if (F.mouth || F.kind === 'angler') s += `<path d="M${a} ${r1f(b * 0.12)} q${r1f(-a * 0.2)} ${r1f(b * 0.1)} ${r1f(-a * 0.32)} ${r1f(-b * 0.02)}" stroke="${INK}" stroke-width="1.8" fill="none"/>`;
  if (F.kind === 'angler') {
    for (let i = 0; i < 4; i++) s += `<path d="M${r1f(a * (0.93 - i * 0.1))} ${r1f(b * 0.1)} l-1.5 4 l-1.5 -4" fill="#fff" stroke="${INK}" stroke-width=".8"/>`;
    s += `<circle class="fa-lure" cx="${r1f(a * 1.25)}" cy="${r1f(-b * 1.12)}" r="5" fill="${mark}" stroke="${INK}" stroke-width="1.4"/><circle cx="${r1f(a * 1.25)}" cy="${r1f(-b * 1.12)}" r="13" fill="${mark}" opacity=".3"/>`;
  }
  return s;
}
function crabSVG(col) {
  const [back, belly, fin, mark] = col;
  let s = `<g stroke="${INK}" stroke-width="2.4" stroke-linejoin="round" stroke-linecap="round" paint-order="stroke">`;
  for (const sx of [-1, 1]) for (let i = 0; i < 3; i++) s += `<path d="M${sx * (14 + i * 6)} ${6 + i * 2} q${sx * 14} ${6 + i * 3} ${sx * (20 + i * 4)} ${18 + i * 2}" fill="none" stroke="${fin}" stroke-width="5"/>`;
  for (const sx of [-1, 1]) s += `<path d="M${sx * 22} -6 q${sx * 16} -14 ${sx * 30} -10" fill="none" stroke="${back}" stroke-width="6"/><path d="M${sx * 50} -14 q${sx * 12} -16 ${sx * 2} -24 q${sx * 2} 10 ${sx * -6} 12 q${sx * 8} 4 ${sx * -2} 12Z" fill="${back}"/>`;
  s += `<path d="M-34 2 Q-32 -24 0 -24 Q32 -24 34 2 Q30 18 0 18 Q-30 18 -34 2Z" fill="${back}"/>`;
  s += `<path d="M-6 -22 v-10 M6 -22 v-10" stroke-width="2.4" fill="none"/></g>`;
  s += `<path d="M-26 6 Q0 20 26 6" fill="none" stroke="${belly}" stroke-width="4" opacity=".8"/><circle cx="-10" cy="-10" r="3" fill="${mark}" opacity=".6"/><circle cx="12" cy="-6" r="2.4" fill="${mark}" opacity=".6"/>`;
  s += `<circle cx="-6" cy="-34" r="4" fill="#fff" stroke="${INK}" stroke-width="1.4"/><circle cx="-5" cy="-34" r="2" fill="${INK}"/><circle cx="6" cy="-34" r="4" fill="#fff" stroke="${INK}" stroke-width="1.4"/><circle cx="7" cy="-34" r="2" fill="${INK}"/>`;
  return s;
}
function eelSVG(col) {
  const [back, belly, fin, mark] = col, d = 'M52 -2 C30 -22 8 20 -14 2 S-50 -14 -66 4';
  return `<path d="${d}" fill="none" stroke="${INK}" stroke-width="19" stroke-linecap="round"/>`
    + `<path d="${d}" fill="none" stroke="${fin}" stroke-width="15" stroke-linecap="round"/>`
    + `<path d="${d}" fill="none" stroke="${back}" stroke-width="11" stroke-linecap="round"/>`
    + `<path d="M52 2 C30 -16 8 26 -14 7 S-50 -8 -64 8" fill="none" stroke="${belly}" stroke-width="3.2" stroke-linecap="round" opacity=".85"/>`
    + `<path d="M40 -10 C26 -22 12 4 -6 -6" fill="none" stroke="${mark}" stroke-width="2" opacity=".6"/>`
    + `<ellipse cx="56" cy="-2" rx="12" ry="8" fill="${back}" stroke="${INK}" stroke-width="2.4"/><circle cx="60" cy="-5" r="3" fill="#fff" stroke="${INK}" stroke-width="1.2"/><circle cx="61" cy="-5" r="1.6" fill="${INK}"/><path d="M68 0 h-8" stroke="${INK}" stroke-width="1.6"/>`;
}
function octoSVG(col) {
  const [back, belly, fin, mark] = col;
  let s = '';
  const arms = [[-4, 10, -30, 22, -54, 10, -50, -2], [0, 12, -18, 34, -40, 34, -44, 24], [6, 12, -2, 36, -18, 40, -24, 32], [10, 12, 14, 34, 2, 42, -6, 38], [14, 10, 30, 28, 24, 40, 16, 40], [-8, 6, -36, 6, -58, -6, -56, -16]];
  for (const [x0, y0, a, b, c, dd, e, f] of arms) {
    const p = `M${x0} ${y0} C${a} ${b} ${c} ${dd} ${e} ${f}`;
    s += `<path d="${p}" fill="none" stroke="${INK}" stroke-width="11" stroke-linecap="round"/><path d="${p}" fill="none" stroke="${fin}" stroke-width="7" stroke-linecap="round"/>`;
  }
  s += `<path d="M-14 8 Q-26 -30 8 -34 Q40 -34 34 0 Q28 16 6 14 Q-8 16 -14 8Z" fill="${back}" stroke="${INK}" stroke-width="2.4"/>`;
  for (const [x, y, r] of [[4, -22, 3.4], [18, -16, 2.6], [-4, -8, 2.2], [24, -2, 2]]) s += `<circle cx="${x}" cy="${y}" r="${r}" fill="${mark}" opacity=".7"/>`;
  s += `<ellipse cx="10" cy="-28" rx="10" ry="4" fill="#fff" opacity=".2"/>`;
  s += `<circle cx="22" cy="4" r="4.2" fill="#fff" stroke="${INK}" stroke-width="1.4"/><circle cx="23" cy="4" r="2.4" fill="${INK}"/>`;
  return s + `<path d="M-10 10 Q6 18 26 10" fill="none" stroke="${belly}" stroke-width="2.4" opacity=".7"/>`;
}
function kingSVG(col) {
  const [back, belly, fin, mark] = col, d = 'M30 -6 C10 -30 -14 20 -34 0 S-58 -22 -70 -4';
  let s = '';
  for (const [x, y] of [[18, -20], [2, -6], [-16, 4], [-36, -6], [-52, -16]]) s += `<path d="M${x} ${y} l-6 -12 l-4 12Z" fill="${fin}" stroke="${INK}" stroke-width="1.8" stroke-linejoin="round"/>`;
  s += `<path d="${d}" fill="none" stroke="${INK}" stroke-width="21" stroke-linecap="round"/><path d="${d}" fill="none" stroke="${back}" stroke-width="16" stroke-linecap="round"/>`;
  s += `<path d="M30 0 C10 -22 -14 28 -34 7 S-58 -14 -68 2" fill="none" stroke="${belly}" stroke-width="5" stroke-linecap="round"/>`;
  s += `<path d="M26 -14 C10 -26 -8 6 -24 -4" fill="none" stroke="${mark}" stroke-width="2.4" opacity=".7"/>`;
  // the head: snout, jaw, horn, whisker
  s += `<g stroke="${INK}" stroke-width="2.4" stroke-linejoin="round" paint-order="stroke"><path d="M36 -26 l-8 -16 l14 10Z" fill="${fin}"/>`
    + `<path d="M24 -16 Q40 -32 62 -18 L70 -12 Q66 -4 54 -4 L66 4 Q56 10 40 6 Q26 4 24 -16Z" fill="${back}"/></g>`
    + `<path d="M62 -10 q10 4 14 16" fill="none" stroke="${belly}" stroke-width="2"/><path d="M44 2 l4 -4 l3 4 l3 -4 l3 4" fill="#fff" stroke="${INK}" stroke-width=".8"/>`
    + `<circle cx="46" cy="-18" r="4" fill="#ffe14d" stroke="${INK}" stroke-width="1.4"/><path d="M46 -21.5 v7" stroke="${INK}" stroke-width="1.6"/>`;
  return s;
}
// One drawn fish as an <svg>; shiny ones get their own colours, a moving sheen and sparkles.
function fishArt(fish, shiny) {
  const F = FISH_ART[fish] || FISH_ART.minnow, col = shiny ? F.s : F.c, id = ++fishUid;
  let inner = F.kind === 'crab' ? crabSVG(col) : F.kind === 'eel' ? eelSVG(col) : F.kind === 'octo' ? octoSVG(col) : F.kind === 'king' ? kingSVG(col) : fishBody(F, col, id);
  if (shiny) {
    inner = `<defs><linearGradient id="fsh${id}" x1="0" y1="0" x2="1" y2="0.4"><stop offset=".3" stop-color="#fff" stop-opacity="0"/><stop offset=".48" stop-color="#fff" stop-opacity=".85"/><stop offset=".54" stop-color="#9ff3ff" stop-opacity=".6"/><stop offset=".6" stop-color="#ff9af0" stop-opacity=".45"/><stop offset=".72" stop-color="#fff" stop-opacity="0"/>`
      + `<animateTransform attributeName="gradientTransform" type="translate" values="-1 0;1 0" dur="1.3s" repeatCount="indefinite"/></linearGradient>`
      + `<mask id="fsm${id}"><g fill="#fff" stroke="#fff">${inner.replace(/fill="[^"]*"/g, 'fill="#fff"').replace(/stroke="[^"]*"/g, 'stroke="#fff"')}</g></mask></defs>`
      + inner + `<rect x="-90" y="-60" width="180" height="120" fill="url(#fsh${id})" mask="url(#fsm${id})" style="mix-blend-mode:screen"/>`;
  }
  return `<svg class="fart" viewBox="-80 -48 160 96" aria-hidden="true">${inner}</svg>`;
}
// How wide a fish is drawn (scene units): its own size, grown with the cube root of its weight.
const fishSize = (fish, kg) => {
  const F = FISH_ART[fish] || FISH_ART.minnow, k = FISH_KG[fish] ? Math.cbrt(kg / FISH_KG[fish]) : 1;
  return F.size * Math.max(0.8, Math.min(1.7, k));
};

/* ================================================================ particles */
// spray: a white water drop · star: a four-point sparkle that turns and fades · ray-dot: a small glow
{
  const base = partSVG;
  partSVG = function (p) {
    const o = Math.max(0, Math.min(1, (p.life - p.age) / (p.life * 0.4))), f = (v) => v.toFixed(1);
    if (p.kind === 'spray') return `<circle cx="${f(p.x)}" cy="${f(p.y)}" r="${f(p.size || 2.2)}" fill="${p.col || '#ffffff'}" opacity="${(o * 0.9).toFixed(2)}"/>`;
    if (p.kind === 'star') {
      const r = (p.size || 6) * (0.6 + 0.4 * Math.sin(p.age * 10 + p.seed)), q = r * 0.2;
      return `<path transform="translate(${f(p.x)},${f(p.y)}) rotate(${f(p.r)})" d="M0,${f(-r)} Q${f(q)},${f(-q)} ${f(r)},0 Q${f(q)},${f(q)} 0,${f(r)} Q${f(-q)},${f(q)} ${f(-r)},0 Q${f(-q)},${f(-q)} 0,${f(-r)}Z" fill="${p.col || '#fff6c8'}" opacity="${o.toFixed(2)}"/>`;
    }
    if (p.kind === 'foam') return `<ellipse cx="${f(p.x)}" cy="${f(p.y)}" rx="${f(p.size * (1 + p.age))}" ry="${f(p.size * 0.35 * (1 + p.age))}" fill="#fff" opacity="${(o * 0.55).toFixed(2)}"/>`;
    return base(p);
  };
}

/* ================================================================ the show */
// FS: the catch on screen. { d, t0, big (showcase), fish, shiny, kg, from, apex, land, size, el, phase }
let FS = null;
// flop: after landing, the fish flops on the boards for a moment before it is bagged (out: fades)
const FS_T = { fight: 1.0, burst: 1.12, apex: 1.62, hold: 2.42, land: 2.92, out: 3.4, end: 3.68 };
const FS_QUICK = { apex: 0.42, land: 0.95, out: 1.2, end: 1.45 };
const fsNow = () => performance.now() / 1000;
const fsK = () => (FS ? fsNow() - FS.t0 : 0);
// A showcase for a shiny fish, a trophy, or a record well above the usual size.
const fsBig = (d) => d.shiny || d.trophy || (d.record && FISH_KG[d.fish] && d.kg >= 1.25 * FISH_KG[d.fish]);
function catchShow(d) {
  const el = spotNow();
  if (!el || el.dataset.spot !== 'fishing' || document.hidden) return false;
  if (avCalm()) return false;
  const sp = SPOT.fish || FISH_SPOTS[0], big = fsBig(d);
  if (FS && FS.big && !big && fsK() < FS_T.end) return true;   // a showcase is on: small catches stay quiet
  if (FS && FS.el) FS.el.remove();
  if (FS && FS.ui) FS.ui.forEach((x) => x.remove());
  const size = fishSize(d.fish, d.kg), zoom = Math.max(1.15, Math.min(2.6, (150 + size * 0.6) / size));
  FS = { d, t0: fsNow(), big, zoom, fish: d.fish, shiny: d.shiny, kg: d.kg, size, phase: 0, ui: [],
    from: [sp.bob[0], sp.bob[1] + 4], apex: big ? [360, 168] : [sp.bob[0] - 120, sp.bob[1] - 120], land: [222, 244] };
  const box = el.querySelector('.spot-pops');
  const e = document.createElement('div');
  e.className = 'fs-fish' + (d.shiny ? ' shiny' : '') + (big ? ' big' : '');
  e.style.width = (size / 8).toFixed(2) + '%';
  e.innerHTML = (big ? '<i class="fs-rays"></i>' : '') + fishArt(d.fish, d.shiny);
  e.style.opacity = big ? '0' : '1';
  box.appendChild(e);
  FS.el = e;
  if (big) el.classList.add('fs-fight');
  return true;
}
// The line is taut to the hook while a fish is on: the scene's fishing frame asks here (seas-ui.js).
function catchHook() {
  if (!FS) return null;
  const k = fsK(), T = FS.big ? FS_T : FS_QUICK;
  if (FS.big && k < FS_T.burst) {
    const j = Math.sin(k * 23) * 7 + Math.sin(k * 37) * 4;
    return { x: FS.from[0] + j, y: FS.from[1] + 6 + Math.sin(k * 19) * 3, under: true };
  }
  if (!FS.pos || k > T.land) return null;
  return { x: FS.pos[0], y: FS.pos[1], under: false };
}
// The angler holds the strike while fighting, then the lift while the fish is in the air.
{
  const base = driveU;
  driveU = function (name, t) {
    const u = base(name, t);
    if (name !== 'fish' || !FS) return u;
    const k = fsK();
    if (FS.big) {
      if (k < FS_T.fight) return 0.9;
      if (k < FS_T.burst) return 0.9 + 0.0999 * ((k - FS_T.fight) / (FS_T.burst - FS_T.fight));
      if (k < FS_T.land) return 0;
      return u * Math.min(1, (k - FS_T.land) / 0.4);
    }
    return u;
  };
  const baseFish = POSE_DRIVE.fish;
  POSE_DRIVE.fish = (u, t, B, calm) => {
    const P = baseFish(u, t, B, calm);
    if (FS && FS.big) {
      const k = fsK();
      if (k < FS_T.burst) P.rb += 0.32 + 0.1 * Math.sin(t * 31);
      else if (k < FS_T.hold) P.rb += 0.15;
    }
    return P;
  };
}
const fsEase = { out: (x) => 1 - Math.pow(1 - x, 3), in: (x) => x * x * x, io: (x) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2) };
// Where the fish is at time k: up from the water to the apex, a slow drift there, down to the feet.
function fsPath(k) {
  const T = FS.big ? FS_T : FS_QUICK, [x0, y0] = FS.from, [xa, ya] = FS.apex, [xl, yl] = FS.land;
  const k0 = FS.big ? FS_T.burst : 0;
  if (k < k0) return null;
  if (k < T.apex) {
    const f = fsEase.out((k - k0) / (T.apex - k0));
    return { x: x0 + (xa - x0) * f, y: y0 + (ya - y0) * f, rot: 38 - 30 * f, s: FS.big ? 0.7 + (FS.zoom - 0.7) * f : 0.75 + 0.25 * f };
  }
  const hold = FS.big ? T.hold : T.apex;
  if (k < hold) {
    const f = (k - T.apex) / (hold - T.apex);
    return { x: xa - 14 * f, y: ya - 6 * Math.sin(Math.PI * f), rot: 8 + Math.sin(k * 7) * 9, s: (FS.big ? FS.zoom : 1) + 0.08 * Math.sin(Math.PI * f) };
  }
  if (k > T.land) {   // flopping on the boards: little hops and a wriggle, dying out
    const q = k - T.land, damp = Math.max(0, 1 - q / (T.out - T.land)), s = FS.big ? 0.9 : 0.9;
    return { x: xl + Math.sin(q * 23) * 2 * damp, y: yl - Math.abs(Math.sin(q * 17)) * 9 * damp, rot: -52 + Math.sin(q * 31) * 22 * damp, s: FS.big ? s : 0.9 };
  }
  const f = Math.min(1, (k - hold) / (T.land - hold)), e = fsEase.in(f);
  return { x: xa - (FS.big ? 14 : 0) + (xl - xa + (FS.big ? 14 : 0)) * fsEase.out(f), y: ya + (yl - ya) * e, rot: 8 - 60 * e, s: FS.big ? FS.zoom - (FS.zoom - 0.9) * fsEase.out(f) : 1 - 0.1 * f };
}
const fsPop = (html, x, y, cls, life) => { const p = spotPop(html, x, y, cls, life); if (p && FS) FS.ui.push(p); return p; };
function fsBanner() {
  const d = FS.d, it = ITEMS[d.shiny ? variantId(d.fish, 's') : d.fish], ratio = FISH_KG[d.fish] ? d.kg / FISH_KG[d.fish] : 1;
  const title = d.shiny ? (d.trophy ? 'Shiny trophy!' : 'Shiny!') : d.record ? 'New record!' : 'Big catch!';
  const p = fsPop(`<b class="fsb-t">${ui(d.shiny ? 'shiny' : 'record')}${title}</b><span class="fsb-sub"><span class="fsb-n">${esc(it.name)}</span><b data-fskg>0</b>${ratio >= 1.15 ? `<small>×${ratio.toFixed(1)} size</small>` : ''}</span>`,
    400, 46, 'fs-banner' + (d.shiny ? ' shiny' : ''), 2600);
  if (p) FS.kgEl = p.querySelector('[data-fskg]');
}
UPD.push(() => {
  if (!FS) return;
  const el = spotNow(), k = fsK(), T = FS.big ? FS_T : FS_QUICK;
  if (!el || el.dataset.spot !== 'fishing' || k > T.end) {
    if (FS.el) FS.el.remove();
    if (el) el.classList.remove('fs-fight', 'fs-hold');
    FS = null;
    return;
  }
  // a re-render (a first shiny re-renders the page) gives a new scene: carry the fish over
  const box = el.querySelector('.spot-pops');
  if (FS.el && !FS.el.isConnected && box) box.appendChild(FS.el);
  if (FS.big && !el.classList.contains('fs-fight') && k < FS_T.burst) el.classList.add('fs-fight');
  const r = Math.random, [bx, by] = FS.from, gold = FS.shiny;
  // 1. the fight: the water churns where the line goes in (gold light under a shiny)
  if (FS.big && k < FS_T.burst) {
    if (r() < 0.55) partAdd({ kind: 'spray', x: bx + (r() - 0.5) * 30, y: by, vx: (r() - 0.5) * 160, vy: -120 - r() * 160, g: 700, life: 0.6, size: 1.6 + r() * 1.6, floor: by + 6 });
    if (r() < 0.12) partAdd({ kind: 'foam', x: bx + (r() - 0.5) * 20, y: by + 4, g: 0, life: 0.7, size: 8 + r() * 6 });
    if (gold && r() < 0.35) partAdd({ kind: 'star', x: bx + (r() - 0.5) * 50, y: by + 6, vx: (r() - 0.5) * 20, vy: -40 - r() * 50, g: -20, life: 0.9, size: 4 + r() * 4, vr: 200, col: r() < 0.5 ? '#ffe27a' : '#9ff3ff' });
    if (FS.phase < 1) { FS.phase = 1; FS.glow = fsPop('', bx, by + 6, 'fs-glow' + (gold ? ' gold' : ''), (FS_T.burst + 0.3) * 1000); fsPop('!!', bx, by - 44, 'fs-bang', 1100); }
    if (Math.floor(k / 0.22) !== FS.ring) { FS.ring = Math.floor(k / 0.22); fsPop('', bx, by + 4, 'splash', 700); }
  }
  // 2. the burst: a column of water, a thud, the fish leaps
  if (FS.big && k >= FS_T.burst && FS.phase < 2) {
    FS.phase = 2;
    el.classList.remove('fs-fight');
    retrigger(el, 'thud');
    fsPop('', bx, by - 6, 'fs-geyser' + (gold ? ' gold' : ''), 1000);
    for (let i = 0; i < 26; i++) partAdd({ kind: 'spray', x: bx + (r() - 0.5) * 26, y: by, vx: (r() - 0.5) * 340, vy: -200 - r() * 380, g: 800, life: 1.1, size: 1.6 + r() * 2.6, floor: by + 8 });
    if (gold) for (let i = 0; i < 14; i++) partAdd({ kind: 'star', x: bx, y: by - 10, vx: (r() - 0.5) * 300, vy: -100 - r() * 260, g: 120, life: 1.3, size: 5 + r() * 5, vr: 300, col: ['#ffe27a', '#9ff3ff', '#ff9af0', '#ffffff'][i % 4] });
  }
  if (!FS.big && FS.phase < 2) { FS.phase = 2; fsPop('', bx, by + 2, 'splash', 800); for (let i = 0; i < 8; i++) partAdd({ kind: 'spray', x: bx, y: by, vx: (r() - 0.5) * 160, vy: -120 - r() * 160, g: 800, life: 0.8, size: 1.5 + r() * 1.5, floor: by + 8 }); }
  // the fish itself
  const P = fsPath(k);
  FS.pos = null;
  if (P && FS.el) {
    const f = (FS.size * P.s) / 2, rad = (P.rot * Math.PI) / 180;
    FS.pos = [P.x - Math.cos(rad) * f * 0.9, P.y - Math.sin(rad) * f * 0.9];   // its mouth (it faces the angler)
    FS.el.style.opacity = '1';
    FS.el.style.left = (P.x / 8).toFixed(2) + '%';
    FS.el.style.top = (P.y / 3.2).toFixed(2) + '%';
    FS.el.style.transform = `translate(-50%, -50%) rotate(${P.rot.toFixed(1)}deg) scale(${(-P.s).toFixed(3)}, ${P.s.toFixed(3)})`;
    // a trail of drops as it leaves the water
    if (k < T.apex && r() < 0.6) partAdd({ kind: 'spray', x: P.x + (r() - 0.5) * f, y: P.y + 6, vx: (r() - 0.5) * 40, vy: 20, g: 600, life: 0.7, size: 1.4 + r() * 1.4 });
  }
  // 3. the hit-stop: light, the banner, the weight counting up
  if (FS.big && k >= FS_T.apex && FS.phase < 3) {
    FS.phase = 3;
    el.classList.add('fs-hold');
    FS.el.classList.add('hold');
    fsBanner();
    if (gold) for (let i = 0; i < 18; i++) { const a = (i / 18) * Math.PI * 2; partAdd({ kind: 'star', x: FS.apex[0] + Math.cos(a) * 20, y: FS.apex[1] + Math.sin(a) * 12, vx: Math.cos(a) * 150, vy: Math.sin(a) * 90, g: 0, life: 1.1, size: 5 + r() * 4, vr: 260, col: ['#ffe27a', '#9ff3ff', '#ff9af0'][i % 3] }); }
  }
  if (FS.big && FS.phase >= 3 && FS.kgEl) {
    const f = Math.min(1, (k - FS_T.apex) / 0.65);
    FS.kgEl.textContent = fmtKg(FS.kg * fsEase.out(f));
    if (gold && k < FS_T.hold && r() < 0.3 && FS.pos) partAdd({ kind: 'star', x: FS.apex[0] + (r() - 0.5) * FS.size, y: FS.apex[1] + (r() - 0.5) * FS.size * 0.5, g: 0, life: 0.6, size: 3 + r() * 4, vr: 200, col: '#fff6c8' });
  }
  if (FS.big && k >= FS_T.hold && FS.phase < 4) { FS.phase = 4; el.classList.remove('fs-hold'); FS.el.classList.remove('hold'); }
  // 4. it lands at the angler's feet
  if (k >= T.land && FS.phase < 5) {
    FS.phase = 5;
    const [lx, ly] = FS.land;
    if (FS.big) retrigger(el, 'thud');
    for (let i = 0; i < (FS.big ? 10 : 4); i++) partAdd({ kind: 'spray', x: lx, y: ly, vx: (r() - 0.5) * 200, vy: -80 - r() * 120, g: 700, life: 0.7, size: 1.5 + r() * 1.5, floor: ly + 8 });
    const id = FS.shiny ? variantId(FS.fish, 's') : FS.fish;
    spotPop(`<b>+1 ${esc(ITEMS[id].name)}</b><small>${fmtKg(FS.kg)}</small>`, lx + 40, ly - 60, 'tag' + (FS.shiny ? ' gold' : ''), 1500);
  }
  if (k >= T.out && FS.phase < 6) { FS.phase = 6; FS.el.classList.add('out'); }
});
