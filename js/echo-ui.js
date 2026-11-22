'use strict';
/* ==========================================================================
   TRI-REALM IDLE — Echo Quarter: the dig, the workshop and the Echo (echo.js is the engine)
   Archaeology (POSE_DRIVE.dig): one cycle per dig. A pick swung into the ground in front of
   the feet (clods of the strata fly), then the avatar kneels and brushes the pit until the
   find shows, lifts it and looks at it. The grid square opens and the find flies to it.
   Restoration (POSE_DRIVE.restore): a delicate cycle at the pedestal: brush the dust off,
   tap the pieces home with a small mallet, polish, step back and inspect. The fragments float
   above the cloth and snap into place one by one; the finished piece gleams.
   Echo Bonding (POSE_DRIVE.commune): the avatar meditates in the air, then lands and runs a
   short kata with its Echo mirroring it behind (drawn live), and strikes a menacing pose.
   Resonance pulses rings; milestones bring the ゴゴゴ.
   The small animation kit (heGlint, heDust, hePlant, heK...) lives in hunt-ui.js.
   Loaded after hunt-ui.js.
   ========================================================================== */

/* ================================================================ tools */
// An archaeologist's pick: a short haft, a small steel head across it, the point on the leading side.
PROP_DRAW.hepick = (hand, a, t, P) => {
  const at = (d, side) => add(add(hand, a, d), a - 90, side);
  if (SPOT_CUR) SPOT_CUR.dig = at(31, 16);
  return part(taper([add(hand, a, -7), add(hand, a, 34)], [3.2, 2.8]), '#8a5a32', 2)
    + `<path d="M${pt(at(28, -8))} L${pt(at(34, -7))} L${pt(at(34, 6))} Q${pt(at(33, 12))} ${pt(at(31, 17))} L${pt(at(28, 6))}Z" fill="#b9c2cf" stroke="${OL}" stroke-width="1.8" stroke-linejoin="round"/>`
    + `<path d="M${pt(at(33, -4))} L${pt(at(33, 9))}" stroke="#fff" stroke-width="1" opacity=".6"/>`;
};
// A soft brush: a wooden handle, a brass ferrule, a fan of bristles.
PROP_DRAW.hebrush = (hand, a, t, P) => {
  const at = (d, side) => add(add(hand, a, d), a - 90, side);
  return part(taper([add(hand, a, -5), add(hand, a, 19)], [3, 2.6]), '#c08a4a', 1.8)
    + `<path d="M${pt(at(18, -2.4))} L${pt(at(21, -2.6))} L${pt(at(21, 2.6))} L${pt(at(18, 2.4))}Z" fill="#d8b44a" stroke="${OL}" stroke-width="1.4"/>`
    + `<path d="M${pt(at(21, -2.6))} L${pt(at(28, -5))} Q${pt(at(29.5, 0))} ${pt(at(28, 5))} L${pt(at(21, 2.6))}Z" fill="#f2e6c8" stroke="${OL}" stroke-width="1.4" stroke-linejoin="round"/>`;
};
// A jeweller's mallet: a slim haft, a small barrel head; it strikes with its lower face.
PROP_DRAW.hemallet = (hand, a, t, P) => {
  const at = (d, side) => add(add(hand, a, d), a - 90, side);
  const q = [at(18, -6), at(26, -6), at(26, 8), at(18, 8)];
  return part(taper([add(hand, a, -5), add(hand, a, 23)], [2.6, 2.2]), '#a8743f', 1.8)
    + `<path d="M${q.map(pt).join('L')}Z" fill="#c9a46a" stroke="${OL}" stroke-width="1.8" stroke-linejoin="round"/><path d="M${pt(at(19, 7))} L${pt(at(25, 7))}" stroke="#7a5a3a" stroke-width="1.6"/>`;
};
// The find, held up to the light.
PROP_DRAW.hefind = (hand, a, t, P) => {
  const c = add(hand, a, 4), s = 1 + 0.15 * Math.sin(t * 6);
  return `<path transform="translate(${pt(c)}) rotate(${r1(a)})" d="M-5,-6 L5,-7 L7,2 L1,8 L-6,3Z" fill="#e8d4a8" stroke="${OL}" stroke-width="1.6" stroke-linejoin="round"/>`
    + `<path transform="translate(${pt(add(c, a + 60, 9))}) scale(${r1(s * 10) / 10})" d="M0,-5 Q.8,-.8 5,0 Q.8,.8 0,5 Q-.8,.8 -5,0 Q-.8,-.8 0,-5Z" fill="#fff6c8"/>`;
};
// Two-handed tools: the back hand on the haft; blended with the key pose by weight w.
function heTwoHands(P, B, F, w) {
  const keyB = P.aB.slice();
  plantPose(P, B, { F: () => F, B: w > 0 ? (J) => add(add(J.aF[2], J.foreA.aF, 4.2 * B.w), P.R, P.s) : null });
  if (w < 1) P.aB = heMix2(keyB, P.aB, w);
  P.g = P.R - (P.aF[0] + P.aF[1]);
  return P;
}

/* ================================================================ the dig */
// One cycle per dig: lift the last find · stand · wind the pick up · strike (hit-stop, quiver)
// · lever it out · kneel · brush the pit (five strokes) · lift the find. Two swings alternate.
const DG_PIT = [159, 226];          // rig: where the pick's point lands (the pit's centre)
const DG_HIT = 0.36;
let DG_VAR = 0;
const DG = (o) => heK(Object.assign({ prop: 'hepick', G: [24, 60], R: 112, s: 12 }, o));
const DG_LIFT = DG({ prop: 'hefind', tw: 0.6, t1: 168, t2: 2, n: -6, h: -12, dy: 26, dx: 4, feet: [30, -8], G: [30, 96], R: 160, s: 0, aB: [30, 70], expr: 'happy' });
const DG_KNEEL = DG({ prop: 'hebrush', tw: 0.75, t1: 140, t2: 12, n: 6, h: 18, dy: 36, dx: 6, feet: [30, -8], G: [42, 24], R: 40, s: 0, aB: [40, 60] });
function dgKeys(v) {
  const ready = DG({ tw: 0.7, t1: 172, t2: 4, n: 2, h: 10, dy: 6, feet: [18, -14], G: [26, 62], R: 112, s: 12 });
  const top = DG({ tw: 0.45, t1: 192 - v * 4, t2: -8, n: 2, h: 4, ht: -4, st: 6, dy: 2, dx: -6, feet: [18, -14], G: [-10 + v * 8, 148 - v * 16], R: 212 + v * 12, s: 20 });
  const strike = DG({ tw: 0.85, t1: 150, t2: 10, n: -2, h: 16, ht: 5, st: -6, dy: 18, dx: 6, feet: [18, -14], G: [28, 20], R: 80, s: 9, expr: 'hurt' });
  const after = (o) => DG(Object.assign({}, strike, { expr: undefined }, o));
  return [
    [0, DG_LIFT],
    [0.08, ready],
    [0.26, top, 'out'],
    [0.31, DG(Object.assign({}, top, { G: [top.G[0] - 2, top.G[1] + 3], R: top.R + 4 }))],
    [DG_HIT, strike, 'in'],
    [0.41, strike],                                               // hit-stop: the point bites
    [0.46, after({ R: 64, t1: 156, dy: 14, G: [26, 26] }), 'out'],   // lever the earth up
    [0.5, after({ R: 100, t1: 160, dy: 12, G: [22, 40], s: 10 })],
    [0.56, DG_KNEEL],
    [0.86, DG_KNEEL],
    [0.93, DG_LIFT, 'out'],
    [1, DG_LIFT],
  ];
}
const DG_KEYS = [dgKeys(0), dgKeys(1)];
POSE_DRIVE.dig = (u, t, B, calm) => {
  const P = keyPose(DG_KEYS[DG_VAR % 2], u);
  // the quiver after the bite
  const q = win(u, DG_HIT, DG_HIT + 0.005, DG_HIT + 0.02, 0.41);
  if (q) P.R += Math.sin(u * 900) * 2.4 * q;
  // brushing: five strokes across the pit, the wrist rolling with each
  const bw = win(u, 0.55, 0.58, 0.84, 0.87), ph = ((u - 0.56) / 0.3) * Math.PI * 10;
  if (bw) { P.G = [P.G[0] + Math.sin(ph) * 9 * bw, P.G[1] + Math.abs(Math.cos(ph)) * 2 * bw]; P.R += Math.cos(ph) * 12 * bw; P.t1 += Math.sin(ph) * 1.5 * bw; P.h += Math.sin(ph * 0.5) * 2 * bw; }
  const br = calm ? 0 : Math.sin(t * 2.2);
  P.t2 += br * 1.2; P.n -= br * 0.8;
  return heTwoHands(P, B, [100 + P.G[0], GROUND - P.G[1]], win(u, 0.04, 0.08, 0.47, 0.53));
};
DRIVE_SKILL.dig = ['archaeology', 2];
POSES.dig = POSE_DRIVE.dig(0.1, 0, BODY, true);

const STRATA = ['#c9a46a', '#a8794a', '#8a5a3a', '#6a4a3a', '#4a3a3a'];
function digBg(x0) {
  const H = WOOD_GROUND;
  let s = `<defs>${spGrad('dg-sky', ['#f2b8ff', '#ffe0c8', '#fff4e0'])}${spGlow('dg-sun', '#fff6c8')}</defs>`;
  s += `<rect width="800" height="320" fill="url(#dg-sky)"/><circle class="dg-sun" cx="120" cy="60" r="60" fill="url(#dg-sun)"/>`;
  // ruined pillars far away
  for (const [x, h] of [[40, 120], [90, 90], [190, 140], [260, 70]]) s += `<rect x="${x}" y="${H - h}" width="22" height="${h}" fill="#e8e0d4" opacity=".7"/><rect x="${x - 4}" y="${H - h - 8}" width="30" height="8" fill="#d8cebe" opacity=".7"/>`;
  s += `<rect y="${H - 6}" width="800" height="${326 - H}" fill="#b8925a"/>`;
  // the cliff of strata, a backdrop to the right of the pit
  const face = `M${x0} -10 L${x0 + 20} 60 L${x0 + 4} 140 L${x0 + 16} 200 L${x0 - 2} ${H} H800 V-10Z`;
  s += `<clipPath id="dg-clip"><path d="${face}"/></clipPath><g clip-path="url(#dg-clip)">`;
  STRATA.forEach((c, i) => { const y = -10 + i * 56; s += `<path d="M${x0 - 20} ${y} Q${x0 + 200} ${y + 10} 820 ${y - 6} V${y + 60} Q${x0 + 200} ${y + 66} ${x0 - 20} ${y + 56}Z" fill="${c}"/>`; });
  const r = sceneRng(13);
  for (let i = 0; i < 16; i++) { const x = x0 + 30 + r() * 400, y = r() * (H - 20); s += `<ellipse cx="${x.toFixed(0)}" cy="${y.toFixed(0)}" rx="${(3 + r() * 6).toFixed(1)}" ry="${(2 + r() * 3).toFixed(1)}" fill="#f2ead8" opacity=".55"/>`; }
  s += `</g><path d="${face}" fill="none" stroke="#0a0c11" stroke-width="3"/>`;
  // the site: string lines and pegs around the pit, a sieve, a bucket
  s += `<path d="M150 ${H + 4} L350 ${H + 4} M150 ${H + 34} L350 ${H + 34}" stroke="#f2ead8" stroke-width="1.2" opacity=".8"/>`;
  for (const x of [150, 350]) s += `<path d="M${x} ${H - 4} v42" stroke="#6a4a2a" stroke-width="3"/>`;
  s += `<path d="M30 ${H + 20} l26 -8 l4 10 l-26 8Z" fill="#7a5a3a" stroke="#0a0c11" stroke-width="2"/><path d="M70 ${H + 30} l4 -26 h28 l4 26z" fill="#8a9aa8" stroke="#0a0c11" stroke-width="2"/>`;
  return s;
}
const DIG_IC = { cache: 'chest', relic: 'gem', shard: 'rare', intact: 'shiny' };
function gridHTML(id) {
  const G = gridOf(id);
  return `<div class="dg-grid" data-dgrid="${id}"><small>Excavation · ${G.n} / ${DIG_N}</small><div class="dg-cells">${G.cells.map((w, i) => `<i class="${G.open[i] ? 'o ' + (w || 'dirt') : ''}">${G.open[i] && w ? ui(DIG_IC[w]) : ''}</i>`).join('')}</div></div>`;
}
function digHTML() {
  const a = S.action && S.action.skill === 'archaeology' ? findAction('archaeology', S.action.id) : null;
  const best = SKILLS.archaeology.actions.filter((x) => x.level <= skillLv('archaeology')).pop() || SKILLS.archaeology.actions[0];
  const site = (a || best).id, pit = rigToSpot(WOOD_BOX, DG_PIT);
  SPOT.dig = { look: site, pit, hit: [pit[0], pit[1] - 20] };
  const last = SPOT.last_archaeology;
  return `<section class="win spot-win" style="--rc:${rc('echo')}">
    <div class="spot sp-dig he-dig ${a ? 'on' : ''}" data-spot="archaeology">
      <svg class="spot-bg" viewBox="0 0 800 320" preserveAspectRatio="none" aria-hidden="true">${digBg(Math.round(pit[0] + 170))}</svg>
      ${spotAvatar(WOOD_BOX, a ? 'dig' : '')}
      <svg class="spot-fx" viewBox="0 0 800 320" preserveAspectRatio="none" aria-hidden="true"><defs><filter id="sp-soft" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="2.4"/></filter></defs><g data-spotfx></g><g data-parts></g></svg>
      <div class="spot-pops"></div>
      <div class="spot-hud"><span class="sh-name"><small>Dig site</small><b>${esc((a || best).name.replace('Dig: ', ''))}</b></span>${last ? `<span class="sh-last">${last}</span>` : '<span class="sh-last" hidden></span>'}</div>
      ${gridHTML(site)}
    </div>
    <div class="spot-bar">${spotStats('archaeology')}</div>
  </section>`;
}
// The pit: a shallow scrape before the first bite, a crater after; the find shows through as it is brushed.
function pitSVG(W, u, on) {
  const [x, y] = W.pit, d = on && u >= DG_HIT && u < 0.995 ? 1 : 0.35, rv = on ? heClamp((u - 0.58) / 0.26) * (u < 0.9 ? 1 : 0) : 0;
  let s = `<path d="M${x - 46} ${y + 6} q10 -12 22 -10 q8 -6 14 2 l-2 10Z" fill="#9a7444" stroke="#0a0c11" stroke-width="1.5"/>`;
  s += `<ellipse cx="${x}" cy="${y + 4}" rx="${(14 + 10 * d).toFixed(1)}" ry="${(4 + 3 * d).toFixed(1)}" fill="#5a3e26" stroke="#0a0c11" stroke-width="1.6"/>`;
  s += `<ellipse cx="${x}" cy="${y + 5.5}" rx="${(9 + 7 * d).toFixed(1)}" ry="${(2.2 + 2 * d).toFixed(1)}" fill="#3a2818"/>`;
  if (rv > 0) s += `<g opacity="${rv.toFixed(2)}"><path d="M${x - 6} ${y + 6} l5 -5 l8 1 l1 5Z" fill="#e8d4a8" stroke="#0a0c11" stroke-width="1.2"/><circle cx="${x + 2}" cy="${y + 3}" r="${(4 + rv * 8).toFixed(1)}" fill="#fff6c8" opacity="${(rv * 0.35).toFixed(2)}"/></g>`;
  return s;
}
const DGS = { prev: null };
function digFrame(el) {
  const k = actFrac('archaeology'), av = el.querySelector('.spot-av svg.avatar'), g = el.querySelector('[data-spotfx]'), W = SPOT.dig;
  el.classList.toggle('on', k >= 0);
  setPose(av, k >= 0 ? 'dig' : '');
  if (!W || !g) return;
  const u = k >= 0 ? heU('dig') : 0, prev = DGS.prev;
  DGS.prev = k >= 0 ? u : null;
  if (prev != null && prev - u > 0.5) DG_VAR++;
  g.innerHTML = pitSVG(W, u, k >= 0);
  if (k < 0 || avCalm()) return;
  const [x, y] = W.pit, r = Math.random;
  if (heCross(prev, u, DG_HIT)) {
    partAdd({ kind: 'flash', x, y: y - 2, life: 0.12, g: 0 });
    for (let i = 0; i < 9; i++) partAdd({ kind: 'chip', x: x + (r() - 0.5) * 10, y: y - 2, vx: (r() - 0.65) * 260, vy: -120 - r() * 200, vr: (r() - 0.5) * 900, w: 3 + r() * 5, h: 3 + r() * 3, col: STRATA[Math.floor(r() * STRATA.length)], life: 1.3, floor: y + 4 + r() * 26 });
    heDust(x, y, '#c9a46a', 4, 0.3);
  }
  if (heCross(prev, u, 0.46)) for (let i = 0; i < 4; i++) partAdd({ kind: 'chip', x: x + 6, y: y - 4, vx: 40 + r() * 80, vy: -90 - r() * 90, vr: 600, w: 3 + r() * 3, h: 3, col: STRATA[i % 3], life: 1, floor: y + 10 + r() * 20 });
  if (u > 0.57 && u < 0.85 && r() < 0.22) heDust(x + (r() - 0.5) * 18, y + 2, '#d8b888', 1, r() < 0.5 ? -1 : 1);
  if (heCross(prev, u, 0.86)) heGlint(x, y - 2, '#fff6c8', 5, 20);
}

/* ================================================================ the workshop */
// One cycle per artifact (5-8 s): lean in · brush the dust off · tap the pieces home with the
// mallet (a flick of the wrist, a tiny hit-stop each time) · polish with the palm · step back,
// hand on chin, a nod. The back hand steadies the piece while the front one works.
const RS_C = [174, 150];            // rig: the artifact's centre on the pedestal
const RS_SNAP = [0.16, 0.28, 0.42, 0.5, 0.58];
const RS_TAPS = [0.42, 0.5, 0.58, 0.65, 0.71];
const RS_LEAN = heK({ tw: 0.75, t1: 160, t2: 8, n: 4, h: 16, dy: 8, dx: 24, feet: [40, 2], aB: [40, 60], aF: [40, 60] });
const RS_BACK = heK({ tw: 0.5, t1: 182, t2: -2, n: -2, h: 6, dy: 0, dx: 2, feet: [14, -12], aB: [-20, 120], aF: [40, 120] });
const RS_KEYS = [[0, RS_BACK], [0.06, RS_LEAN], [0.84, RS_LEAN], [0.9, RS_BACK], [1, RS_BACK]];
// The mallet's lift between taps: up slowly, down fast, a short hold in contact.
function rsLift(u) {
  const T = RS_TAPS;
  if (u < T[0]) return heClamp((u - 0.33) / 0.05);
  for (let i = 0; i < T.length - 1; i++) if (u < T[i + 1]) { const k = (u - T[i]) / (T[i + 1] - T[i]); return k < 0.12 ? 0 : k < 0.7 ? ease.out((k - 0.12) / 0.58) : 1 - ease.in((k - 0.7) / 0.3); }
  return 0.6 * heClamp((u - T[T.length - 1]) / 0.04);
}
const rsTapAt = (u) => { let i = 0; while (i < RS_TAPS.length - 1 && u >= RS_TAPS[i] + 0.02) i++; return [RS_C[0] - 6 + (i % 2) * 11, RS_C[1] - 16 + (i % 3) * 3]; };
// The front hand's target (and the tool) for each phase; neighbours blend over 0.03 either side.
const RS_PH = [
  [0, 0.33, 'hebrush', (u) => { const ph = ((u - 0.05) / 0.25) * Math.PI * 8, R = 32 + 10 * Math.sin(ph * 0.5); return { R, F: add([RS_C[0] - 4 + 9 * Math.sin(ph), RS_C[1] - 14 + 4 * Math.cos(ph)], R, -26) }; }],
  [0.33, 0.76, 'hemallet', (u) => { const T = rsTapAt(u); return { R: 90 + 34 * rsLift(u), F: [T[0] - 22, T[1] - 8] }; }],
  [0.76, 0.86, undefined, (u) => { const a = u * 60; return { R: 90, F: [RS_C[0] - 12 + Math.cos(a) * 6, RS_C[1] - 6 + Math.sin(a) * 4] }; }],
  [0.86, 1.01, undefined, null],
];
POSE_DRIVE.restore = (u, t, B, calm) => {
  const P = keyPose(RS_KEYS, u);
  const br = calm ? 0 : Math.sin(t * 2);
  P.t2 += br; P.n -= br * 0.8;
  // contact: the body gives a hair on every tap
  for (const x of RS_TAPS) P.dy += win(u, x - 0.005, x, x + 0.01, x + 0.03) * 1.2;
  // inspecting: weight back, a slow nod
  const ins = win(u, 0.86, 0.9, 1.1, 1.2);
  if (ins) { P.h += Math.sin((u - 0.86) * 60) * 5 * ins; P.expr = u > 0.94 ? 'happy' : undefined; }
  let i = 0;
  while (i < RS_PH.length - 1 && u >= RS_PH[i][1]) i++;
  const [, end, prop, fn] = RS_PH[i];
  P.prop = prop;
  const target = (f, J) => (f ? f(u) : { R: 120, F: [J.head[0] + 9, J.head[1] + 17] });
  let w = 0, other = null;
  if (i > 0 && u < RS_PH[i][0] + 0.03) { w = 0.5 - 0.5 * ease.io((u - RS_PH[i][0]) / 0.03); other = RS_PH[i - 1][3]; }
  else if (i < RS_PH.length - 1 && u > end - 0.03) { w = 0.5 * ease.io((u - (end - 0.03)) / 0.03); other = RS_PH[i + 1][3]; }
  const steady = 1 - ins;
  const keyB = P.aB.slice();
  plantPose(P, B, {
    F: (J) => { const a = target(fn, J); if (!w) { P.R = a.R; return a.F; } const b = target(other, J); P.R = a.R + (b.R - a.R) * w; return heMix2(a.F, b.F, w); },
    B: steady > 0 ? () => [RS_C[0] - 17, RS_C[1] + 4] : null,
  });
  if (steady < 1) P.aB = heMix2(keyB, P.aB, steady);
  P.g = P.R - (P.aF[0] + P.aF[1]);
  return P;
};
DRIVE_SKILL.restore = ['restoration', 3];
POSES.restore = POSE_DRIVE.restore(0.1, 0, BODY, true);
function shopBg(hit) {
  const H = WOOD_GROUND, [hx, hy] = hit, top = Math.round(hy + 8);
  let s = `<defs>${spGrad('rs-wall', ['#2a2438', '#3a3050', '#2a2438'])}${spGlow('rs-lamp', '#fff0c8')}${spGlow('rs-flaw', '#ffe27a')}</defs>`;
  s += `<rect width="800" height="320" fill="url(#rs-wall)"/>`;
  // museum shelves with restored pieces
  for (const y of [70, 140]) { s += `<rect x="430" y="${y}" width="340" height="8" fill="#6a4a3a" stroke="#0a0c11" stroke-width="2"/>`; for (let i = 0; i < 5; i++) s += `<path d="M${450 + i * 66} ${y} q-8 -22 4 -34 q12 -6 18 6 q6 14 -4 28Z" fill="${['#e8d4a8', '#9fd8c8', '#d8a8c8', '#c8c8e8', '#e8c8a0'][i]}" stroke="#0a0c11" stroke-width="1.6" opacity=".9"/>`; }
  s += `<g class="rs-lampglow"><circle cx="300" cy="40" r="140" fill="url(#rs-lamp)" opacity=".45"/></g><path d="M300 0 v26" stroke="#0a0c11" stroke-width="2"/><path d="M288 26 h24 l-6 10 h-12z" fill="#e8c86a" stroke="#0a0c11" stroke-width="2"/>`;
  // motes drifting in the lamp light
  for (let i = 0; i < 7; i++) s += `<circle class="rs-mote" style="animation-delay:${(-i * 1.3).toFixed(1)}s" cx="${240 + i * 18}" cy="${70 + (i % 3) * 30}" r="1.4" fill="#fff6c8"/>`;
  s += `<rect y="${H - 2}" width="800" height="${322 - H}" fill="#2a2030"/><rect y="${H - 2}" width="800" height="3" fill="#4a3a50"/>`;
  // the pedestal and its velvet cloth
  const px = hx + 20;
  s += `<rect x="${px - 26}" y="${top + 16}" width="52" height="${H - top - 14}" fill="#e8e0d4" stroke="#0a0c11" stroke-width="2.5"/><rect x="${px - 34}" y="${top + 8}" width="68" height="10" fill="#d8cebe" stroke="#0a0c11" stroke-width="2.5"/>`;
  s += `<path d="M${px - 30} ${top + 8} q30 -8 60 0 v6 h-60z" fill="#8a2a4a"/>`;
  return s;
}
// The artifact: five fragments float above the cloth and snap into place one by one (u: the cycle).
const RS_PIECES = [[-8, -26, -1, -1], [6, -30, 1, -1], [-10, -12, -1, 0.4], [8, -10, 1, 0.6], [0, -40, 0, -1.4]];
function artifactSVG(W, u, t, on) {
  const [hx, hy] = W.hit, px = hx + 20, base = hy + 6, col = W.col || '#e8d4a8';
  const done = on ? RS_SNAP.filter((x) => u >= x).length / RS_SNAP.length : 1, appear = on ? heClamp(u / 0.05) : 1;
  let s = `<circle cx="${px}" cy="${base - 22}" r="${(22 + done * 10).toFixed(1)}" fill="url(#rs-lamp)" opacity="${(0.2 + done * 0.3).toFixed(2)}"/>`;
  let shapes = '';
  RS_PIECES.forEach(([x, y, dx, dy], i) => {
    const sn = RS_SNAP[i], k = on ? (u >= sn ? 1 : ease.in(heClamp((u - (sn - 0.08)) / 0.08))) : 1, f = 1 - k;
    const bob = f * Math.sin(t * 2.2 + i * 1.7) * 3, rot = f * (dx * 40 + Math.sin(t * 1.3 + i) * 10);
    const tx = px + x + dx * 16 * f, ty = base + y + dy * 12 * f - f * 14 + bob;
    const d = `M-7 -7 L7 -6 L6 7 L-6 6Z`;
    shapes += `<path transform="translate(${tx.toFixed(1)} ${ty.toFixed(1)}) rotate(${rot.toFixed(0)})" d="${d}"/>`;
    s += `<path transform="translate(${tx.toFixed(1)} ${ty.toFixed(1)}) rotate(${rot.toFixed(0)})" d="${d}" fill="${col}" stroke="#0a0c11" stroke-width="1.5" opacity="${appear.toFixed(2)}"/>`;
    if (f > 0.2 && on) s += `<ellipse cx="${tx.toFixed(1)}" cy="${(base + 4).toFixed(1)}" rx="${(5 * f).toFixed(1)}" ry="1.4" fill="#000" opacity="${(0.25 * f).toFixed(2)}"/>`;
  });
  // seams between snapped pieces fade as it is polished
  const seam = on ? (1 - heClamp((u - 0.76) / 0.1)) * heClamp((u - RS_SNAP[1]) / 0.05) : 0;
  if (seam > 0.02) s += `<path d="M${px - 1} ${base - 36} l2 10 l-3 8 l2 8 M${px - 14} ${base - 19} h26" stroke="#5a3a2a" stroke-width="1.1" fill="none" opacity="${(seam * 0.8).toFixed(2)}"/>`;
  // the gleam: a band of light sweeps across the finished piece
  const gl = on ? heClamp((u - 0.9) / 0.08) : 0;
  if (gl > 0 && gl < 1) s += `<clipPath id="rs-gclip">${shapes}</clipPath><g clip-path="url(#rs-gclip)"><path transform="translate(${(px - 30 + gl * 60).toFixed(1)} ${base - 26}) rotate(25)" d="M-4 -40 h8 v80 h-8Z" fill="#fff" opacity=".85"/></g>`;
  return s;
}
function shopHTML() {
  const a = S.action && S.action.skill === 'restoration' ? findAction('restoration', S.action.id) : null;
  const c = rigToSpot(WOOD_BOX, RS_C), hit = [c[0] - 20, c[1] + 12];
  SPOT.shop = { hit, c, col: a && ARTIFACTS[Object.keys(a.out)[0]] ? '#9fd8c8' : '#e8d4a8' };
  const last = SPOT.last_restoration;
  return `<section class="win spot-win" style="--rc:${rc('echo')}">
    <div class="spot sp-shop ${a ? 'on' : ''}" data-spot="restoration">
      <svg class="spot-bg" viewBox="0 0 800 320" preserveAspectRatio="none" aria-hidden="true">${shopBg(hit)}</svg>
      ${spotAvatar(WOOD_BOX, a ? 'restore' : '')}
      <svg class="spot-fx" viewBox="0 0 800 320" preserveAspectRatio="none" aria-hidden="true"><defs><filter id="sp-soft" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="2.4"/></filter></defs><g data-spotfx></g><g data-parts></g></svg>
      <div class="spot-pops"></div>
      <div class="spot-hud"><span class="sh-name"><small>Museum workshop</small><b>${esc(a ? a.name : 'Pick a piece to restore')}</b></span>${last ? `<span class="sh-last">${last}</span>` : '<span class="sh-last" hidden></span>'}</div>
    </div>
    <div class="spot-bar">${spotStats('restoration')}</div>
  </section>`;
}
const RSS = { prev: null };
function shopFrame(el) {
  const k = actFrac('restoration'), av = el.querySelector('.spot-av svg.avatar'), g = el.querySelector('[data-spotfx]'), W = SPOT.shop;
  el.classList.toggle('on', k >= 0);
  setPose(av, k >= 0 ? 'restore' : '');
  if (!W || !g) return;
  const u = k >= 0 ? heU('restore') : 1, prev = RSS.prev, t = heT();
  RSS.prev = k >= 0 ? u : null;
  g.innerHTML = artifactSVG(W, u, t, k >= 0);
  if (k < 0 || avCalm()) return;
  const [hx, hy] = W.hit, px = hx + 20, base = hy + 6;
  RS_SNAP.forEach((x, i) => {
    if (!heCross(prev, u, x)) return;
    const [ox, oy] = RS_PIECES[i];
    partAdd({ kind: 'flash', x: px + ox, y: base + oy, life: 0.12, g: 0 });
    heGlint(px + ox, base + oy, '#fff0c8', 3, 10);
  });
  for (const x of RS_TAPS) if (heCross(prev, u, x) && !RS_SNAP.includes(x)) heDust(px - 4 + Math.random() * 10, base - 20, '#e8d4a8', 2, 0);
  if (u > 0.06 && u < 0.32 && Math.random() < 0.18) heDust(px + (Math.random() - 0.5) * 20, base - 20 - Math.random() * 12, '#d8cebe', 1, Math.random() < 0.5 ? -1 : 1);
  if (u > 0.77 && u < 0.85 && Math.random() < 0.08) heGlint(px + (Math.random() - 0.5) * 24, base - 22, '#fff6c8', 1, 8);
  if (heCross(prev, u, 0.93)) heGlint(px, base - 24, '#fff6c8', 6, 30);
}

/* ================================================================ the Echo */
const ECHO_COL = { gilded_hand: '#ffd75e', rewind: '#7df9ff', star_fist: '#ff7a5a', silent_tide: '#5ab8ff', paper_moon: '#e8e4ff', iron_bloom: '#9aff8a' };
// One cycle per commune: meditate in the air · land · guard · two strikes (the Echo strikes with
// you, a beat later and bigger) · a menacing pose · fold back into the air.
const BD_MED = heK(Object.assign({}, POSES.meditate, { tw: 0 }));
const BD_STAND = heK({ tw: 0.4, t1: 180, t2: 0, n: 0, h: 2, aF: [20, 30], aB: [-20, -30], lF: [10, -4], lB: [-10, 4], fF: 10, fB: -190 });
const BD_GUARD = heK(Object.assign({}, POSES.guard, { fx: undefined, g: -150, sh: 1, bf: 0 }));
const BD_PUNCH = heK(Object.assign({}, POSES.thrust, { fx: undefined, g: -150, sh: 1, aF: [94, -4] }));
const BD_PUNCH2 = heK(Object.assign({}, POSES.strike, { fx: undefined, g: -150, sh: 1, aF: [88, 2], aB: [-60, 40] }));
const BD_POSE = heK({ tw: 0.25, t1: 194, t2: -14, n: -8, h: -16, ht: 12, st: -12, aF: [158, 128], aB: [-128, -96], lF: [30, -36], lB: [-14, 4], fF: 18, fB: -190, dy: 2 });
const BD_T = { land: 0.56, p1: 0.69, p2: 0.76, pose: 0.8 };
const BD_KEYS = [
  [0, BD_MED], [0.5, BD_MED], [BD_T.land, BD_STAND, 'out'], [0.62, BD_GUARD], [0.66, BD_GUARD],
  [BD_T.p1, BD_PUNCH, 'back'], [0.73, BD_GUARD], [BD_T.p2, BD_PUNCH2, 'back'], [BD_T.pose, BD_POSE, 'out'], [0.9, BD_POSE], [0.96, BD_MED], [1, BD_MED],
];
const bdMedW = (u) => Math.max(win(u, -1, 0, 0.48, 0.54), win(u, 0.91, 0.97, 1.1, 1.2));
POSE_DRIVE.commune = (u, t, B, calm) => {
  const P = keyPose(BD_KEYS, u), m = bdMedW(u);
  if (!calm) {
    P.air += Math.sin(t * 1.6) * 4 * m;
    const br = Math.sin(t * 1.8);
    P.t2 += br * 1.6; P.n -= br * 1.2; P.aF = [P.aF[0] + br * 1.4 * m, P.aF[1]]; P.aB = [P.aB[0] - br * 1.4 * m, P.aB[1]];
    const hold = win(u, BD_T.pose, BD_T.pose + 0.02, 0.88, 0.9);
    P.t1 += Math.sin(t * 1.2) * 2 * hold; P.h += Math.sin(t * 0.9) * 2 * hold;
  }
  return P;
};
DRIVE_SKILL.commune = ['bonding', 4];
POSES.commune = POSE_DRIVE.commune(0.2, 0, BODY, true);
// The Echo's own pose: arms folded and floating while you meditate; with you (a beat late, every
// limb pushed further) in the kata; a flurry of fists while it resonates.
const GH_IDLE = heK({ tw: 0.3, t1: 180, t2: -4, n: -6, h: -10, ht: -4, st: 6, aF: [44, -100], aB: [-44, 100], lF: [16, -10], lB: [-10, 6], fF: 10, fB: -190 });
function ghostPose(u, t, calm, rush) {
  const v = (u - 0.025 + 1) % 1, m = bdMedW(v);
  let P = POSE_DRIVE.commune(v, t - 0.15, BODY, calm);
  P = mixPose(P, GH_IDLE, m);
  P.air = 18 + (calm ? 0 : Math.sin(t * 1.3) * 5);
  if (rush && !calm) { const f = (Math.sin(t * 22) + 1) / 2; P = mixPose(P, mixPose(BD_PUNCH, BD_PUNCH2, f), 0.85); P.air = 18; P.dx = Math.sin(t * 22) * 2; }
  P.sh = 1; P.prop = undefined; P.expr = undefined;
  return P;
}
function echoFigure() {
  if (!echoOn()) return '';
  const c = ECHO_COL[S.echo.id] || '#c48cff', solid = 0.3 + 0.7 * Math.min(1, bondLv() / 40);
  return `<div class="ec-ghost he-ghost" style="--ec:${c};--solid:${solid.toFixed(2)}"><svg class="avatar" viewBox="22 18 156 218" aria-hidden="true" data-heghost></svg></div>`;
}
const BOND_BOX = { x: 330, y: 70, h: 180 };
function bondBg() {
  let s = `<defs>${spGrad('ec-sky', ['#1a0f2a', '#3a1f4a', '#5a2a5a'])}${spGlow('ec-glow', '#f08cff')}</defs><rect width="800" height="320" fill="url(#ec-sky)"/>`;
  s += spStars(61, 60, 200);
  for (const [x, h] of [[60, 160], [140, 200], [640, 190], [720, 150]]) s += `<rect x="${x}" y="${250 - h}" width="34" height="${h}" fill="#2a1a3a" stroke="#0a0c11" stroke-width="2"/><rect x="${x - 6}" y="${242 - h}" width="46" height="10" fill="#3a2a4a"/>`;
  s += `<circle cx="400" cy="170" r="200" fill="url(#ec-glow)" opacity=".25" class="ec-pulse"/><rect y="250" width="800" height="70" fill="#1a1024"/>`;
  s += `<ellipse class="ec-circle" cx="400" cy="262" rx="160" ry="16" fill="none" stroke="#f08cff" stroke-width="2" opacity=".6"/>`;
  return s;
}
function bondHTML() {
  const a = S.action && S.action.skill === 'bonding' ? findAction('bonding', S.action.id) : null, E = S.echo || {};
  return `<section class="win spot-win" style="--rc:${rc('echo')}">
    <div class="spot sp-bond he-bond ${a ? 'on' : ''} ${E.rush > 0 ? 'rush' : ''}" data-spot="bonding" style="--ec:${ECHO_COL[E.id] || '#f08cff'}">
      <svg class="spot-bg" viewBox="0 0 800 320" preserveAspectRatio="none" aria-hidden="true">${bondBg()}</svg>
      <div class="ec-slot" style="left:${((BOND_BOX.x - 92) / 8).toFixed(2)}%;top:${((BOND_BOX.y - 60) / 3.2).toFixed(2)}%">${echoFigure()}</div>
      ${spotAvatar(BOND_BOX, a ? 'commune' : 'meditate')}
      <svg class="spot-fx" viewBox="0 0 800 320" preserveAspectRatio="none" aria-hidden="true"><defs><filter id="sp-soft" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="2.4"/></filter></defs><g data-spotfx></g><g data-parts></g></svg>
      <div class="spot-pops"></div>
      <div class="spot-hud"><span class="sh-name"><small>${echoOn() ? esc(ECHO_BY[E.id].name) : 'No Echo yet'}</small><b>${echoOn() ? `Bond level ${bondLv()}` : 'Awaken an Echo with 3 shards'}</b></span></div>
      <div class="sx-meter" data-sxm="bond"><small>Resonance</small><span class="sx-bar"><i></i></span><b></b></div>
    </div>
    <div class="spot-bar">${spotStats('bonding')}</div>
  </section>`;
}
// The menacing ゴゴゴ: three glyphs that throb beside the pair.
function heGogo(big) {
  const n = big ? 4 : 3, html = Array.from({ length: n }, (_, i) => `<i style="--i:${i}">ゴ</i>`).join('');
  spotPop(html, 560, 110, 'he-gogo' + (big ? ' big' : ''), 2400);
  if (big) spotPop(html, 210, 90, 'he-gogo left', 2400);
}
const BDS = { prev: null, ring: 0, gt: 0, cyc: 0 };
function bondFrame(el) {
  const k = actFrac('bonding'), E = S.echo || {}, av = el.querySelector('.spot-av svg.avatar'), calm = avCalm(), t = heT();
  el.classList.toggle('on', k >= 0);
  el.classList.toggle('rush', E.rush > 0);
  setPose(av, k >= 0 ? 'commune' : 'meditate');
  meterSet(el, 'bond', E.rush > 0 ? 1 : (E.res || 0) / 100, E.rush > 0 ? `Resonating · ${Math.ceil(E.rush)}s` : `${Math.floor(E.res || 0)}%`, E.rush > 0);
  const u = k >= 0 ? heU('commune') : 0.2, prev = BDS.prev;
  BDS.prev = k >= 0 ? u : null;
  if (prev != null && prev - u > 0.5) BDS.cyc++;
  // the Echo, drawn live at ~30 fps
  const gsv = el.querySelector('[data-heghost]'), now = performance.now();
  if (gsv && (now - BDS.gt > 33 || !gsv.firstChild)) {
    BDS.gt = now;
    const look = Object.assign({}, avState(), { aura: 'none', back: 'none', hat: 'none', ink: ECHO_COL[E.id] || '#c48cff' });
    try { gsv.innerHTML = drawAvatar(look, ghostPose(u, t, calm, E.rush > 0), t, { uid: 'heghost', weapon: '' }); } catch (e) { /* rig busy */ }
  }
  if (k < 0 || calm) return;
  const col = ECHO_COL[E.id] || '#f08cff', cx = BOND_BOX.x + 64, cy = BOND_BOX.y + 110;
  // resonance rings: slow while it builds, fast while it blazes
  const every = E.rush > 0 ? 0.45 : 1.6 - Math.min(1, (E.res || 0) / 100) * 0.8;
  if (now - BDS.ring > every * 1000) { BDS.ring = now; spotPop('', cx, cy, 'he-ring' + (E.rush > 0 ? ' hot' : ''), 1400); }
  if (Math.random() < (E.rush > 0 ? 0.5 : 0.25)) partAdd({ kind: 'heglint', x: cx + (Math.random() - 0.5) * 150, y: BOND_BOX.y + 150, vx: 0, vy: -40 - Math.random() * 50, g: 0, life: 1.2, size: 3, vr: 200, col });
  // the Echo's fists land: an impact ring in front of it
  for (const x of [BD_T.p1, BD_T.p2]) if (heCross(prev, u, x + 0.025)) { partAdd({ kind: 'flash', x: 420, y: 118, life: 0.16, g: 0 }); heGlint(420, 118, col, 4, 20); }
  if (E.rush > 0 && Math.random() < 0.3) partAdd({ kind: 'flash', x: 400 + Math.random() * 40, y: 100 + Math.random() * 40, life: 0.1, g: 0 });
  // the menacing pose: every third cycle, the ゴゴゴ
  if (heCross(prev, u, BD_T.pose + 0.01) && (BDS.cyc % 3 === 2 || E.rush > 0)) heGogo(false);
}
UIX.realmScene.push((realm, skill) => (skill === 'archaeology' ? digHTML() : skill === 'restoration' ? shopHTML() : skill === 'bonding' ? bondHTML() : ''));
{
  const base = spotStats;
  spotStats = function (skill) {
    if (!S.action && skill === 'archaeology') return `<div class="spot-idle">${ui('play')}<span>Pick a dig site. Every dig opens a square of its grid.</span></div>`;
    if (!S.action && skill === 'restoration') return `<div class="spot-idle">${ui('play')}<span>Pick a piece to restore. A Flawless artifact counts ×1.5 in the museum.</span></div>`;
    if (!S.action && skill === 'bonding') return `<div class="spot-idle">${ui('play')}<span>Commune with your Echo to deepen the bond and build resonance.</span></div>`;
    return base(skill);
  };
}

/* ================================================================ per frame and outcomes */
UPD.push(() => {
  const el = spotNow();
  if (!el) return;
  if (el.dataset.spot === 'archaeology') digFrame(el);
  else if (el.dataset.spot === 'restoration') shopFrame(el);
  else if (el.dataset.spot === 'bonding') bondFrame(el);
});
const DIG_COL = { cache: '#ffd75e', relic: '#9fd8ff', shard: '#f08cff', intact: '#ffe27a' };
on('dug', (d) => {
  const el = spotNow();
  const id = Object.keys(d.act.out)[0];
  setLast('archaeology', `<small>Last dig</small><b>${esc(ITEMS[id].name)}</b><em>${fmt(familyCount(id))} owned</em>`);
  if (!el || el.dataset.spot !== 'archaeology') return;
  const box = el.querySelector('.dg-grid');
  if (box) { box.outerHTML = gridHTML(d.act.id); const c = el.querySelectorAll('.dg-cells i')[d.cell]; if (c) retrigger(c, 'pop'); }
  const [hx, hy] = SPOT.dig.pit;
  spotPop(`<span class="tile-art">${itemIc(id)}</span>`, hx + 26, hy - 24, 'dish', 1300);
  // the find flies to its square of the grid
  const p = spotPop(`<span class="tile-art">${itemIc(id)}</span>`, hx, hy - 30, 'he-fly', 1100);
  if (p) { p.style.setProperty('--x0', (hx / 8).toFixed(2) + '%'); p.style.setProperty('--y0', ((hy - 30) / 3.2).toFixed(2) + '%'); }
  if (d.what) heGlint(hx, hy - 20, DIG_COL[d.what] || '#fff6c8', d.what === 'intact' ? 14 : 8, 40);
  if (d.what === 'cache') spotPop(`<b>Cache! ×3</b>`, hx + 60, hy - 90, 'tag gold', 1500);
  else if (d.what === 'relic') spotPop(`<b>A relic!</b>`, hx + 60, hy - 90, 'tag gold', 1500);
  else if (d.what === 'shard') spotPop(`<b>Stand Arrow Shard!</b>`, hx + 60, hy - 90, 'tag gold', 1800);
  else if (d.what === 'intact') { sxBurst(el, hx + 40, hy - 40, true, 'Intact find!', ITEMS[variantId(id, 's')].name); spotPop('', hx, hy, 'he-beam', 1600); heCheer(el); }
});
on('siteclear', (d) => {
  toast(`${d.act.name.replace('Dig: ', '')} cleared: +3 Echo Dust and a fresh grid.`, 'rare');
  const el = spotNow();
  if (el && el.dataset.spot === 'archaeology') { spotPop(`${ui('trophy')}Site cleared!`, 400, 54, 'banner', 2200); const b = el.querySelector('.dg-grid'); if (b) retrigger(b, 'clear'); }
});
on('action', (d) => {
  if (d.skill !== 'restoration') return;
  const id = Object.keys(d.act.out || {})[0];
  if (!id) return;
  setLast('restoration', `<small>Last restored</small><b>${esc(ITEMS[id].name)}</b>`);
  const el = spotNow();
  if (el && el.dataset.spot === 'restoration' && SPOT.shop) spotPop(`<span class="tile-art">${itemIc(id)}</span>`, SPOT.shop.hit[0] + 20, SPOT.shop.hit[1] - 40, 'dish', 1400);
});
on('flawless', (d) => {
  const A = ARTIFACTS[d.id];
  toast(`Flawless ${ITEMS[d.id].name}! Its museum bonus counts ×1.5: ${A.desc}.`, 'rare');
  const el = spotNow();
  if (!el || el.dataset.spot !== 'restoration') { burst('Flawless!', `${ITEMS[d.id].name} · museum bonus ×1.5`, itemIc(d.id), '#ffd75e'); return; }
  const x = SPOT.shop.hit[0] + 20, y = SPOT.shop.hit[1] - 20;
  sxBurst(el, x, y, true, 'Flawless!', 'Museum bonus ×1.5');
  spotPop('', x, y - 10, 'he-beam', 1600);
  for (let i = 0; i < 12; i++) { const a = (i / 12) * Math.PI * 2; partAdd({ kind: 'heglint', x, y: y - 10, vx: Math.cos(a) * 120, vy: Math.sin(a) * 120, g: 0, life: 0.9, size: 5, vr: 300, col: i % 2 ? '#ffe27a' : '#fff6c8' }); }
  heCheer(el);
});
on('resonance', () => {
  toast('Resonance! Your Echo works three times as fast for 60 seconds.', 'rare');
  const el = spotNow();
  if (el && el.dataset.spot === 'bonding') { sxBurst(el, BOND_BOX.x + 40, BOND_BOX.y + 60, true, 'Resonance!', 'Echo ×3 speed · 60s'); heGogo(true); }
});
on('bondup', (d) => {
  const el = spotNow();
  if (d.grade) { burst('Echo evolves', `Bond ${d.lv} · every grade rises`, ui('star'), '#f08cff'); dirty = true; }
  else if (el && el.dataset.spot === 'bonding') {
    spotPop(`<b>Bond level ${d.lv}</b>`, 400, 80, 'tag gold', 1600);
    heGogo(d.lv % 5 === 0);
    spotPop('', BOND_BOX.x + 64, BOND_BOX.y + 110, 'he-ring hot', 1400);
    const h = el.querySelector('.sh-name b'); if (h) h.textContent = `Bond level ${d.lv}`;
    const gst = el.querySelector('.ec-ghost'); if (gst) gst.style.setProperty('--solid', (0.3 + 0.7 * Math.min(1, d.lv / 40)).toFixed(2));
  }
});
