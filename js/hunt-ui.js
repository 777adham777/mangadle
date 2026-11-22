'use strict';
/* ==========================================================================
   TRI-REALM IDLE — Green Island: the hunt (hunt.js is the engine)
   Trails: your avatar sneaks along a forest trail (the forest scrolls past while it walks),
   kneels to read the tracks, the bush ahead rustles, the quarry breaks cover and bolts,
   the hunter pounces and pins it. The scent meter fills; at 100% the next quarry is Prime Prey.
   Beast hunts: the hunter crouches in cover, the beast walks in with its own gait, sniffs
   at the bait, the trap snaps, the hunter bursts out and pins it. A Shiny beast shines gold.
   Also holds the small animation kit shared with echo-ui.js (heGlint, heDust, hePlant...).
   Loaded after hex-ui.js.
   ========================================================================== */

const PREY_LOOK = {
  wild_fur:      ['quad', { body: '#b89a7a', belly: '#f0e2cc', eye: '#2a1a0a', ear: 'pointy', earIn: '#e8b0a0', tail: 'thin', size: 0.7 }],
  swift_feather: ['wyvern', { body: '#4a8ac8', belly: '#e8f0ff', wing: '#2a5a9a', eye: '#ffdf3a' }],
  boar_tusk:     ['quad', { body: '#6a4a3a', belly: '#9a7a5a', horns: '#f2e6c8', eye: '#ff6a3a', ear: 'round', size: 0.9 }],
  stag_antler:   ['quad', { body: '#a86a3a', belly: '#f0dcae', horns: '#e9e4da', eye: '#2a1a0a', ear: 'pointy', tail: 'thin' }],
  lynx_pelt:     ['quad', { body: '#c9a46a', belly: '#f6e6be', eye: '#9aff6a', slit: 1, ear: 'pointy', earIn: '#3a2a1a', tail: 'thin' }],
  wyrm_scale:    ['wyvern', { body: '#5a7a4a', belly: '#d8e2b0', wing: '#8a6a4a', eye: '#ffdf3a' }],
  chimera_mane:  ['quad', { body: '#c99a4a', belly: '#f0dcae', mane: '#7a4a22', horns: '#e9e4da', tail: 'snake', tailCol: '#5c9a4a', eye: '#ffdf3a', slit: 1, ear: 'round' }],
};
for (const k in PREY_LOOK) CREATURES['Prey:' + k] = PREY_LOOK[k];
// The beasts you trap, drawn as creatures (each walks in with its own gait).
const BEAST_LOOK = {
  reef_turtle: ['quad', { body: '#4a9a7a', belly: '#d8e8a8', eye: '#2a1a0a', ear: 'round', size: 0.7 }],
  storm_gull:  ['wyvern', { body: '#e8eef4', belly: '#ffffff', wing: '#7a8a9a', eye: '#ffdf3a' }],
  ninken_pup:  ['quad', { body: '#b07a4a', belly: '#f0dcae', eye: '#2a1a0a', ear: 'pointy', earIn: '#e8b0a0', tail: 'thin', size: 0.75 }],
  ghost_cat:   ['quad', { body: '#cfc8f0', belly: '#f4f0ff', eye: '#7df9ff', slit: 1, ear: 'pointy', earIn: '#9a8ad8', tail: 'thin', tails: 2, size: 0.8 }],
  thunder_ape: ['ape', { body: '#5a5a7a', skin: '#e8c89a', eye: '#ffe14a' }],
  cursed_toad: ['blob', { body: '#6a9a3a', eye: '#ff5ae0' }],
  great_stag:  ['quad', { body: '#8a5a32', belly: '#f0dcae', horns: '#f2ead8', eye: '#2a1a0a', ear: 'pointy', tail: 'thin' }],
  sky_lynx:    ['quad', { body: '#9fc8e8', belly: '#f4f8ff', wings: '#e8f4ff', eye: '#ffdf3a', slit: 1, ear: 'pointy', earIn: '#3a4a6a', tail: 'thin' }],
  stone_owl:   ['wyvern', { body: '#8a8a92', belly: '#c8c4bc', wing: '#5a5a62', eye: '#f08cff' }],
};
for (const k in BEAST_LOOK) CREATURES['Beast:' + k] = BEAST_LOOK[k];
const HUNT_BOX = { x: 150, y: 58, h: 194 };

/* ================================================================ shared animation kit (hunt + echo) */
// Two particles of their own (moved by seas-ui.js partStep, drawn here):
// heglint: a turning four-point sparkle · hedust: a soft coloured puff that swells and fades.
{
  const base = partSVG;
  partSVG = function (p) {
    if (p.kind !== 'heglint' && p.kind !== 'hedust') return base(p);
    const o = Math.max(0, Math.min(1, (p.life - p.age) / (p.life * 0.45))), f = (v) => v.toFixed(1);
    if (p.kind === 'hedust') return `<circle cx="${f(p.x)}" cy="${f(p.y)}" r="${f(p.size * (1 + p.age * 2.4))}" fill="${p.col || '#c9a46a'}" opacity="${(o * 0.42).toFixed(2)}"/>`;
    const r = (p.size || 5) * (0.55 + 0.45 * Math.sin(p.age * 12 + p.seed)), q = r * 0.18;
    return `<path transform="translate(${f(p.x)},${f(p.y)}) rotate(${f(p.r)})" d="M0,${f(-r)} Q${f(q)},${f(-q)} ${f(r)},0 Q${f(q)},${f(q)} 0,${f(r)} Q${f(-q)},${f(q)} ${f(-r)},0 Q${f(-q)},${f(-q)} 0,${f(-r)}Z" fill="${p.col || '#fff6c8'}" opacity="${o.toFixed(2)}"/>`;
  };
}
const heGlint = (x, y, col, n, spread) => { for (let k = 0; k < n; k++) partAdd({ kind: 'heglint', x: x + (Math.random() - 0.5) * spread, y: y + (Math.random() - 0.5) * spread, vx: (Math.random() - 0.5) * 70, vy: -20 - Math.random() * 60, g: 0, life: 0.6 + Math.random() * 0.6, size: 3 + Math.random() * 4, vr: (Math.random() - 0.5) * 300, col }); };
const heDust = (x, y, col, n, dir) => { for (let k = 0; k < n; k++) partAdd({ kind: 'hedust', x: x + (Math.random() - 0.5) * 16, y, vx: (dir || 0) * 50 + (Math.random() - 0.5) * 80, vy: -8 - Math.random() * 26, g: 0, life: 0.5 + Math.random() * 0.4, size: 3 + Math.random() * 3, col }); };
const heLeaves = (x, y, n, spread) => { for (let k = 0; k < n; k++) partAdd({ kind: 'leaf', x: x + (Math.random() - 0.5) * (spread || 40), y: y + (Math.random() - 0.5) * 20, vx: (Math.random() - 0.3) * 160, vy: -60 - Math.random() * 90, vr: (Math.random() - 0.5) * 400, g: 0, col: k % 2 ? '#3f8a44' : '#6ab04a', life: 1.6 + Math.random(), floor: 262 + Math.random() * 30, seed: Math.random() * 6 }); };
// Every key a driven pose needs, so key poses always blend number to number.
const HE_POSE = { sh: 1, tw: 0.5, t1: 180, t2: 0, n: 0, h: 0, ht: 0, st: 0, aF: [11, 6], aB: [-11, -6], lF: [30, -60], lB: [-20, -40], fF: 12, fB: -192, g: -150, dy: 0, dx: 0, air: 0, feet: [12, -14] };
const heK = (o) => Object.assign({}, HE_POSE, o);
const heMix2 = (a, b, k) => [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k];
const heClamp = (x) => Math.max(0, Math.min(1, x));
// The legs on planted feet when grounded, their own key angles when airborne (blended in between).
function hePlant(P, B, hands) {
  const fk = { lF: P.lF.slice(), lB: P.lB.slice() }, k = heClamp(((P.air || 0) - 4) / 16);
  plantPose(P, B, hands);
  if (k > 0) { P.lF = heMix2(P.lF, fk.lF, k); P.lB = heMix2(P.lB, fk.lB, k); }
  return P;
}
// A driven cycle's progress as the avatar sees it.
const heT = () => (avCalm() ? 0.6 : performance.now() / 1000);
const heU = (drive) => driveU(drive, heT());
// Did the cycle pass x since the last frame (it wraps at 1)?
const heCross = (prev, u, x) => prev != null && (prev <= u ? prev < x && u >= x : (prev < x || u >= x) && prev - u > 0.5);
const heAv = (el) => el && el.querySelector('.spot-av');

/* ================================================================ the hunter's motion */
// Trail run (one cycle per catch): sneak in a low crouch, kneel and read a print (a hand on it),
// look up as the bush ahead rustles, coil, pounce on the quarry as it bolts, pin it.
// Two pounces alternate: a low diving lunge, or a high leap.
let HN_VAR = 0;
const HN_SNEAK = heK({ tw: 0.65, t1: 166, t2: 5, n: -3, h: 0, aF: [34, 44], aB: [14, 60], feet: [12, -14], dy: 14 });
const HN_RISE = heK({ tw: 0.6, t1: 170, t2: 3, n: -2, h: 2, aF: [34, 50], aB: [16, 70], feet: [16, -12], dy: 10 });
function hnKeys(v) {
  const read = heK({ tw: 0.7, t1: 144, t2: 10, n: 6, h: 16, aF: [70, 20], aB: [30, 96], feet: [24, -20], dy: 34 });
  const look = heK(Object.assign({}, read, { t1: 156, t2: 2, n: -10, h: -12, ht: 3, st: -3 }));
  const coil = heK({ tw: 0.95, t1: 168, t2: -2, n: -6, h: -10, aF: [-30, 100], aB: [-46, 76], feet: [20, -24], dy: 40, dx: -6, ht: -4, st: 6 });
  const fly = v ? heK({ tw: 1, t1: 116, t2: 4, n: -14, h: -14, aF: [104, -6], aB: [94, -14], dx: 40, air: 14, lF: [-16, -40], lB: [-60, -26], feet: [40, 20] })
    : heK({ tw: 1, t1: 134, t2: 2, n: -10, h: -12, aF: [118, -8], aB: [108, -18], dx: 34, air: 46, lF: [14, -96], lB: [-48, -64], feet: [40, 20] });
  const pin = heK({ tw: 0.9, t1: 132, t2: 12, n: 2, h: 12, aF: [72, 14], aB: [58, 22], feet: [52, 22], dy: 34, dx: 40, expr: 'happy' });
  return [
    [0, Object.assign({}, pin, { t1: 150, dy: 28 })],
    [0.1, HN_RISE],
    [0.16, HN_SNEAK],
    [0.4, HN_SNEAK],
    [0.47, read],
    [0.53, read],
    [0.58, look, 'out'],
    [0.7, look],
    [0.76, coil],
    [0.83, fly, 'out'],
    [0.88, pin, 'in'],
    [1, Object.assign({}, pin, { t1: 150, dy: 28 })],
  ];
}
const HN_KEYS = [hnKeys(0), hnKeys(1)];
const HN_T = { walk0: 0.06, walk1: 0.42, rustle: 0.5, pop: 0.58, bolt: 0.72, leap: 0.76, pin: 0.88 };
POSE_DRIVE.stalk = (u, t, B, calm) => {
  const P = keyPose(HN_KEYS[HN_VAR % 2], u);
  // the sneak: slow careful strides on bent knees, the arms low and quiet
  const w = win(u, 0.1, 0.17, 0.38, 0.44), ph = t * 7, s = Math.sin(ph), c = Math.cos(ph);
  if (w) { P.feet = [P.feet[0] + 13 * s * w, P.feet[1] - 13 * s * w]; P.dy += Math.abs(c) * 2.4 * w; P.aF = [P.aF[0] - 12 * s * w, P.aF[1]]; P.aB = [P.aB[0] + 10 * s * w, P.aB[1]]; P.t1 += Math.sin(ph * 2) * 1.2 * w; P.h += Math.sin(t * 1.3) * 3 * w; }
  const br = calm ? 0 : Math.sin(t * 2.4);
  P.t2 += br * 1.2; P.n -= br;
  hePlant(P, B);
  if (w) { const lf = Math.max(0, c) * w, lb = Math.max(0, -c) * w; P.lF = [P.lF[0] + 14 * lf, P.lF[1] - 26 * lf]; P.lB = [P.lB[0] + 14 * lb, P.lB[1] - 26 * lb]; }
  // reading the tracks: the front hand comes down flat on the print
  const r = win(u, 0.43, 0.48, 0.54, 0.59);
  if (r) { const Q = plantPose(Object.assign({}, P, { aF: P.aF.slice(), feet: P.feet.slice() }), B, { F: () => [100 + P.feet[0] + 30, GROUND - 3] }); P.aF = heMix2(P.aF, Q.aF, r); }
  return hnPin(P, B, Math.max(win(u, 0.86, 0.885, 0.99, 1.01), win(u, -1, 0, 0.03, 0.08)));
};
// Pinning: both hands press down on the quarry's back, in front of the knees.
function hnPin(P, B, k) {
  if (!k) return P;
  const Q = plantPose(Object.assign({}, P, { aF: P.aF.slice(), aB: P.aB.slice(), feet: P.feet.slice() }), B, { F: () => [100 + (P.dx || 0) + 50, GROUND - 22], B: () => [100 + (P.dx || 0) + 38, GROUND - 18] });
  P.aF = heMix2(P.aF, Q.aF, k); P.aB = heMix2(P.aB, Q.aB, k);
  return P;
}
DRIVE_SKILL.stalk = ['tracking', 1.6];
POSES.stalk = POSE_DRIVE.stalk(0.3, 0, BODY, true);
// Beast hunt: crouched in cover, a peek over the bush, tense while the beast noses the bait,
// the trap snaps, burst out of cover and pin the beast.
const AM_HIDE = heK({ tw: 0.7, t1: 156, t2: 12, n: 4, h: 10, aF: [58, 76], aB: [30, 100], feet: [16, -20], dy: 52 });
const AM_PIN = heK({ tw: 0.9, t1: 140, t2: 10, n: 2, h: 12, aF: [70, 16], aB: [58, 24], feet: [56, 26], dy: 34, dx: 44, expr: 'happy' });
const AM_KEYS = [
  [0, Object.assign({}, AM_PIN, { t1: 154, dy: 24 })],
  [0.06, heK({ tw: 0.6, t1: 172, t2: 4, n: -2, h: 2, aF: [40, 50], aB: [20, 70], feet: [18, -10], dy: 12, dx: 6 })],
  [0.14, AM_HIDE],
  [0.32, AM_HIDE],
  [0.37, heK(Object.assign({}, AM_HIDE, { t1: 172, t2: 2, n: -8, h: -8, dy: 30, aF: [86, 60], aB: [60, 70] })), 'out'],
  [0.47, heK(Object.assign({}, AM_HIDE, { t1: 173, t2: 2, n: -8, h: -4, dy: 30, aF: [88, 58], aB: [62, 70] }))],
  [0.53, AM_HIDE],
  [0.7, AM_HIDE],
  [0.78, heK({ tw: 0.95, t1: 164, t2: -2, n: -6, h: -10, aF: [-24, 98], aB: [-44, 78], feet: [16, -22], dy: 46, dx: -4, ht: -4, st: 6 })],
  [0.81, heK({ tw: 0.95, t1: 165, t2: -2, n: -6, h: -11, aF: [-28, 100], aB: [-48, 80], feet: [16, -22], dy: 47, dx: -5, ht: -4, st: 6 })],
  [0.86, heK({ tw: 1, t1: 120, t2: 4, n: -12, h: -14, aF: [112, -8], aB: [102, -16], dx: 40, air: 34, lF: [4, -74], lB: [-58, -44], feet: [40, 20] }), 'out'],
  [0.9, AM_PIN, 'in'],
  [1, Object.assign({}, AM_PIN, { t1: 154, dy: 24 })],
];
const AM_T = { snap: 0.76, leap: 0.81, pin: 0.9 };
POSE_DRIVE.ambush = (u, t, B, calm) => {
  const P = keyPose(AM_KEYS, u), hide = win(u, 0.1, 0.16, 0.7, 0.76);
  if (!calm && hide) { P.t1 += Math.sin(t * 1.1) * 1.6 * hide; P.h += Math.sin(t * 0.7) * 4 * hide; }
  const ten = win(u, 0.74, 0.77, 0.8, 0.82);   // tense: the held breath trembles
  if (!calm && ten) P.dy += Math.sin(t * 40) * 0.7 * ten;
  const br = calm ? 0 : Math.sin(t * 2.2);
  P.t2 += br * 1.4; P.n -= br;
  return hnPin(hePlant(P, B), B, Math.max(win(u, 0.88, 0.905, 0.99, 1.01), win(u, -1, 0, 0.02, 0.05)));
};
DRIVE_SKILL.ambush = ['tracking', 4];
POSES.ambush = POSE_DRIVE.ambush(0.3, 0, BODY, true);

/* ================================================================ the scene */
function bigTree(x, h, w, c) {
  return `<rect x="${x - w / 2}" y="${250 - h}" width="${w}" height="${h + 10}" fill="${c}" stroke="#0a0c11" stroke-width="2"/><circle cx="${x}" cy="${250 - h}" r="${w * 1.6}" fill="#2f6a34" stroke="#0a0c11" stroke-width="2"/><circle cx="${x - w}" cy="${250 - h + 14}" r="${w * 1.1}" fill="#3f8a44"/>`;
}
const hnBushSVG = (c1, c2) => `<svg viewBox="0 0 120 80" aria-hidden="true"><path d="M6 80 Q-4 50 22 42 Q24 14 52 18 Q68 0 88 16 Q116 18 110 46 Q126 60 114 80Z" fill="${c1}" stroke="#0a0c11" stroke-width="2.5"/><path d="M26 54 q10 -12 22 -6 M60 34 q12 -10 24 0 M78 58 q10 -8 20 0" stroke="${c2}" stroke-width="3" fill="none" stroke-linecap="round"/></svg>`;
function huntBg() {
  let s = `<defs>${spGrad('hn-sky', ['#9fd8a8', '#d8f0c0', '#f4f8d8'])}${spGlow('hn-ray', '#fffbe0')}${spGlow('hn-gold', '#ffe27a')}</defs>`;
  s += `<rect width="800" height="320" fill="url(#hn-sky)"/>`;
  [180, 420, 640].forEach((x, i) => { s += `<path class="hn-shaft" style="animation-delay:${-i * 1.7}s" d="M${x} 0 l60 0 l-120 260 l-40 0Z" fill="#fffbe0" opacity=".18"/>`; });
  // far layer (scrolls slowly), near layer (scrolls fast): drawn twice across 1600 px
  let far = '', near = '';
  for (let k = 0; k < 2; k++) {
    const r = sceneRng(11);
    for (let i = 0; i < 9; i++) far += `<g opacity=".55">${bigTree(k * 800 + i * 95 + r() * 30, 150 + r() * 70, 14 + r() * 8, '#4a3a2a')}</g>`;
    const q = sceneRng(23);
    for (let i = 0; i < 5; i++) near += bigTree(k * 800 + i * 170 + q() * 40, 230 + q() * 40, 26 + q() * 10, '#5a3a22');
    for (let i = 0; i < 14; i++) near += `<path d="M${k * 800 + i * 60 + 10} 258 q10 -24 26 -30 q-6 16 4 28 q6 -18 20 -20 q-8 14 -4 24Z" fill="#3f8a3a" stroke="#0a0c11" stroke-width="1.4"/>`;
  }
  s += `<g class="hn-far" data-hnl="far">${far}</g>`;
  s += `<rect y="250" width="800" height="70" fill="#6a5034"/><path d="M0 262 Q400 252 800 262" stroke="#4a3622" stroke-width="5" fill="none"/>`;
  let prints = '';
  for (let k = 0; k < 2; k++) for (let i = 0; i < 12; i++) { const x = k * 800 + i * 68 + 20, y = 278 + (i % 2) * 12; prints += `<g transform="translate(${x} ${y})" fill="#3a2a18"><ellipse rx="5" ry="3.6"/><circle cx="-5" cy="-5" r="1.8"/><circle cx="0" cy="-7" r="1.8"/><circle cx="5" cy="-5" r="1.8"/></g>`; }
  s += `<g class="hn-prints" data-hnl="near">${prints}</g><g class="hn-near" data-hnl="near">${near}</g>`;
  return s;
}
function huntHTML() {
  const a = S.action && S.action.skill === 'tracking' ? findAction('tracking', S.action.id) : null;
  const last = SPOT.last_tracking, beast = a && a.beast;
  const prey = a && a.out ? Object.keys(a.out)[0] : null, shiny = beast && S.beasts[beast] && S.beasts[beast].shiny;
  const bait = beast && Object.keys(a.in)[0];
  return `<section class="win spot-win" style="--rc:${rc('hunter')}">
    <div class="spot sp-hunt he-hunt ${a ? 'on' : ''} ${beast ? 'beast' : ''} ${primeNext() ? 'prime' : ''}" data-spot="tracking">
      <svg class="spot-bg" viewBox="0 0 800 320" preserveAspectRatio="none" aria-hidden="true">${huntBg()}</svg>
      ${beast ? `<div class="hn-trap2" style="left:66%;top:79%"><svg viewBox="0 0 60 30" aria-hidden="true"><path class="hn-jaw b" d="M8 24 Q30 -10 52 24" fill="none" stroke="#5d6470" stroke-width="4"/><path class="hn-jaw f" d="M8 24 Q30 -10 52 24" fill="none" stroke="#9aa4b4" stroke-width="4"/><rect x="4" y="22" width="52" height="6" rx="2" fill="#4a3424" stroke="#0a0c11" stroke-width="2"/></svg>${bait && ITEMS[bait] ? `<span class="hn-bait">${itemIc(bait)}</span>` : ''}</div>
        <div class="hn-bst ${shiny ? 'shiny' : ''}" style="left:105%;top:66%">${creatureSVG('Beast:' + beast)}</div>` : ''}
      ${!beast ? [0, 1, 2].map((i) => `<div class="hn-bush" data-hnb="${i}" style="left:110%">${hnBushSVG('#3f8a44', '#2f6a34')}</div>`).join('') : ''}
      ${prey ? `<div class="hn-q" style="left:54%;top:69%;opacity:0">${creatureSVG('Prey:' + prey)}</div>` : ''}
      ${spotAvatar(HUNT_BOX, a ? (beast ? 'ambush' : 'stalk') : '')}
      ${beast ? `<div class="hn-cover">${hnBushSVG('#4a9a4a', '#2f6a34')}</div>` : ''}
      <svg class="spot-fx" viewBox="0 0 800 320" preserveAspectRatio="none" aria-hidden="true"><defs><filter id="sp-soft" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="2.4"/></filter></defs><g data-spotfx></g><g data-parts></g></svg>
      <div class="spot-pops"></div>
      <div class="spot-hud"><span class="sh-name"><small>Green Island</small><b>${esc(a ? a.name : 'Pick a trail or a beast')}</b></span>${last ? `<span class="sh-last">${last}</span>` : '<span class="sh-last" hidden></span>'}</div>
      <div class="sx-meter" data-sxm="hunt"><small>Scent</small><span class="sx-bar"><i></i></span><b></b></div>
    </div>
    <div class="spot-bar">${spotStats('tracking')}</div>
  </section>`;
}
UIX.realmScene.push((realm, skill) => (skill === 'tracking' ? huntHTML() : ''));
{
  const base = spotStats;
  spotStats = function (skill) {
    if (skill === 'tracking' && !S.action) return `<div class="spot-idle">${ui('play')}<span>Pick a trail to follow, or a beast to trap.</span></div>`;
    return base(skill);
  };
}

/* ================================================================ per frame */
// The camera: the near layer slides HN_WALK px while the hunter sneaks, then pans HN_LUNGE px to
// catch up after the pounce (the hunter slides back to his mark at the same speed, so he stays put
// on the ground). Bushes ride on the near layer; the quarry hides in the one that stops ahead.
const HN = { prev: null, cyc: 0, ambPrev: null };
const HN_WALK = 190, HN_LUNGE = 150, HN_BUSH = 438, AM_LUNGE = 252, HN_AVW = HUNT_BOX.h * 156 / 218;
const hnGround = (u) => HN_LUNGE * ease.io(heClamp(u / 0.3)) + HN_WALK * ease.io(heClamp((u - HN_T.walk0) / (HN_T.walk1 - HN_T.walk0)));
const hnLunge = (u, L, back, go, dur) => (u < back ? L * (1 - ease.io(u / back)) : u < go ? 0 : L * ease.out(heClamp((u - go) / dur)));
function hnPlace(q, x, y, sx, rot, sc, op) {
  q.style.left = (x / 8).toFixed(2) + '%';
  q.style.top = (y / 3.2).toFixed(2) + '%';
  q.style.transform = `translate(-50%,-50%) rotate(${rot.toFixed(1)}deg) scale(${(sx * sc).toFixed(3)},${sc.toFixed(3)})`;
  if (op != null) q.style.opacity = op.toFixed(2);
}
const hnLeafFall = () => partAdd({ kind: 'leaf', x: Math.random() * 800, y: -8, vx: -10, vy: 16, vr: 120, g: 0, col: Math.random() < 0.5 ? '#6ab04a' : '#c9b04a', life: 5, floor: 262 + Math.random() * 40, seed: Math.random() * 6 });
function hnTrail(el, u, t, calm) {
  const prev = HN.prev;
  if (prev != null && prev - u > 0.5) { HN.cyc++; HN_VAR++; }
  HN.prev = u;
  // the world scrolls with the sneak
  const G = HN.cyc * (HN_WALK + HN_LUNGE) + hnGround(u);
  for (const g of el.querySelectorAll('[data-hnl]')) g.setAttribute('transform', `translate(${(-((G * (g.dataset.hnl === 'far' ? 0.28 : 1)) % 800)).toFixed(1)} 0)`);
  const av = heAv(el);
  if (av) av.style.translate = `${(hnLunge(u, HN_LUNGE, 0.3, HN_T.leap, 0.1) / HN_AVW * 100).toFixed(2)}% 0`;
  // three bushes in turn: the one ahead, the last one, and the one before it (off screen)
  const ahead = HN_BUSH + HN_WALK + HN_LUNGE - hnGround(u);
  for (const b of el.querySelectorAll('[data-hnb]')) {
    const age = (HN.cyc - +b.dataset.hnb + 300) % 3, x = ahead - age * (HN_WALK + HN_LUNGE);
    let rot = 0;
    if (age === 0 && !calm) rot = Math.sin(t * 38) * 7 * win(u, HN_T.rustle - 0.06, HN_T.rustle, HN_T.pop, HN_T.pop + 0.02) + Math.sin(t * 30) * 5 * win(u, HN_T.leap + 0.04, HN_T.pin - 0.01, HN_T.pin, HN_T.pin + 0.06);
    b.style.left = (x / 8).toFixed(2) + '%';
    b.style.transform = `translate(-50%,-100%) rotate(${rot.toFixed(1)}deg)`;
  }
  // the quarry: hidden in the bush, pops up, freezes, bolts, is pinned
  const q = el.querySelector('.hn-q');
  if (q) {
    const prime = el.classList.contains('prime');
    let x = HN_BUSH + 10, y = 222, sx = 1, rot = 0, sc = prime ? 1.12 : 1, op = 0;
    if (u >= HN_T.rustle + 0.04 && u < 0.98) {
      op = 1;
      const pop = heClamp((u - (HN_T.rustle + 0.04)) / 0.06);
      y += (1 - ease.back(pop)) * 50;
      if (!calm && u < HN_T.bolt) { y -= Math.abs(Math.sin(t * 5)) * 2; rot = Math.sin(t * 9) * 2; }
      if (u >= HN_T.bolt) {
        const b = heClamp((u - HN_T.bolt) / (HN_T.pin - HN_T.bolt));
        sx = -1; x += 46 * ease.out(b); y -= Math.abs(Math.sin(b * Math.PI * 2)) * 16; rot = -Math.sin(b * Math.PI * 4) * 8;
      }
      if (u >= HN_T.pin) { const c = heClamp((u - HN_T.pin) / 0.1); sc *= 1 - 0.45 * c; op = 1 - c; y += 8 * c; }
    }
    hnPlace(q, x, y, sx, rot, sc, op);
    q.classList.toggle('lit', u >= HN_T.pin && u < HN_T.pin + 0.04);
  }
  if (calm) return;
  // footfalls, the bush bursting, the leap, the pin
  if (win(u, 0.12, 0.17, 0.38, 0.42) && Math.random() < 0.06) heDust(219 + Math.random() * 20, 246, '#b8925a', 1, -1);
  if (heCross(prev, u, HN_T.pop - 0.04)) heLeaves(HN_BUSH + 10, 220, 5, 60);
  if (heCross(prev, u, HN_T.leap + 0.02)) heDust(230, 248, '#b8925a', 4, -1);
  if (heCross(prev, u, HN_T.pin)) {
    const x = HN_BUSH + 50;
    partAdd({ kind: 'flash', x, y: 226, life: 0.16, g: 0 });
    heDust(x, 252, '#b8925a', 6, 0);
    heLeaves(x, 224, 6, 70);
    if (el.classList.contains('prime')) { heGlint(x, 220, '#ffe27a', 10, 60); retrigger(el, 'thud'); }
  }
  if (Math.random() < 0.012) hnLeafFall();
}
function hnAmbush(el, u, t, calm) {
  const prev = HN.ambPrev;
  HN.ambPrev = u;
  const av = heAv(el);
  if (av) av.style.translate = `${(hnLunge(u, AM_LUNGE, 0.12, AM_T.leap, 0.07) / HN_AVW * 100).toFixed(2)}% 0`;
  const cover = el.querySelector('.hn-cover');
  if (cover) { const r = calm ? 0 : Math.sin(t * 30) * 6 * win(u, 0.33, 0.35, 0.38, 0.42) + Math.sin(t * 36) * 9 * win(u, AM_T.leap - 0.01, AM_T.leap, AM_T.leap + 0.03, AM_T.leap + 0.07); cover.style.transform = `translate(-50%,-100%) rotate(${r.toFixed(1)}deg)`; }
  // the beast: walks in with its own gait, sniffs around, steps onto the bait, the jaws snap, it struggles, pinned
  const bst = el.querySelector('.hn-bst'), trapX = 528;
  if (bst) {
    let x, y = 214, rot = 0, sc = 1, op = 1, sx = 1;
    const gait = (amp, f) => { if (!calm) { y -= Math.abs(Math.sin(t * f)) * amp; rot += Math.sin(t * f) * amp * 0.6; } };
    if (u < 0.3) { x = 860 - 250 * ease.out(u / 0.3); gait(6, 10); }
    else if (u < 0.6) { const k = (u - 0.3) / 0.3; x = 610 - 14 * k + Math.sin(k * Math.PI * 2) * 10; rot = calm ? 0 : -6 + Math.sin(t * 7) * 5; if (k > 0.4 && k < 0.6) sx = -1; }
    else if (u < AM_T.snap) { x = 596 - (596 - trapX - 8) * ease.io((u - 0.6) / (AM_T.snap - 0.6)); gait(3, 6); }
    else { x = trapX + 8; const j = heClamp((u - AM_T.snap) / 0.04); y -= Math.sin(j * Math.PI) * 18; if (!calm && u < AM_T.pin) rot = Math.sin(t * 34) * 9; }
    if (u >= AM_T.pin) { const c = heClamp((u - AM_T.pin) / 0.08); sc = 1 - 0.08 * c; y += 4 * c; }
    if (u >= 0.95) { const c = (u - 0.95) / 0.05; sc *= 1 - 0.5 * c; op = 1 - c; }
    hnPlace(bst, x, y, sx, rot, sc, op);
  }
  const trap = el.querySelector('.hn-trap2');
  if (trap) trap.classList.toggle('shut', u >= AM_T.snap && u < 0.98);
  if (calm) return;
  if (heCross(prev, u, AM_T.snap)) { partAdd({ kind: 'flash', x: trapX, y: 248, life: 0.14, g: 0 }); for (let k = 0; k < 6; k++) partAdd({ kind: 'spark', x: trapX, y: 248, vx: (Math.random() - 0.5) * 260, vy: -80 - Math.random() * 160, g: 600, life: 0.5, floor: 262 }); heDust(trapX, 254, '#b8925a', 4, 0); retrigger(el, 'thud'); }
  if (heCross(prev, u, AM_T.leap + 0.01)) heLeaves(268, 190, 9, 80);
  if (heCross(prev, u, AM_T.pin)) { partAdd({ kind: 'flash', x: trapX, y: 220, life: 0.16, g: 0 }); heDust(trapX, 254, '#b8925a', 6, 0); }
  if (heCross(prev, u, 0.95)) heGlint(trapX + 8, 214, el.querySelector('.hn-bst.shiny') ? '#ffe27a' : '#e8fff0', 8, 50);
  if (Math.random() < 0.01) hnLeafFall();
}
UPD.push(() => {
  const el = spotNow();
  if (!el || el.dataset.spot !== 'tracking') { HN.prev = HN.ambPrev = null; return; }
  const k = actFrac('tracking'), av = el.querySelector('.spot-av svg.avatar'), a = k >= 0 && findAction('tracking', S.action.id);
  el.classList.toggle('on', k >= 0);
  setPose(av, k >= 0 ? (a && a.beast ? 'ambush' : 'stalk') : '');
  const H = HUNT();
  el.classList.toggle('prime', H.scent >= 100);
  meterSet(el, 'hunt', H.scent / 100, H.scent >= 100 ? 'Prime Prey!' : `${Math.floor(H.scent)}%`, H.scent >= 100);
  if (k < 0) { const s = heAv(el); if (s && s.style.translate) s.style.translate = ''; return; }
  if (a && a.beast) hnAmbush(el, heU('ambush'), heT(), avCalm()); else hnTrail(el, heU('stalk'), heT(), avCalm());
});

/* ================================================================ outcomes */
const heCheer = (el) => { const av = el && el.querySelector('.spot-av svg.avatar'); if (av && !avCalm()) avPlay(av, [['victory', 220, 'back'], ['victory', 520]]); };
on('action', (d) => {
  if (d.skill !== 'tracking') return;
  const id = d.act.out && Object.keys(d.act.out)[0], it = id && ITEMS[id];
  if (it) setLast('tracking', `<small>Last catch</small><b>${esc(it.name)}</b><em>${fmt(familyCount(id))} owned</em>`);
  const el = spotNow();
  if (!el || el.dataset.spot !== 'tracking') return;
  const x = d.act.beast ? 536 : HN_BUSH + 50;
  if (it) spotPop(`<span class="tile-art">${itemIc(id)}</span>`, x, 196, 'dish', 1300);
  const meat = d.gains.game_meat;
  if (meat) spotPop(`<b>+${fmt(meat)} ${esc(ITEMS.game_meat.name)}</b>`, x + 20, 132, 'tag', 1400);
});
on('scent', () => {
  const el = spotNow();
  toast('Prime Prey sighted! Your next trail run gives ×3 and a Prime material.', 'rare');
  if (el && el.dataset.spot === 'tracking') { spotPop(`${ui('pet')}Prime Prey sighted!`, 520, 80, 'tag gold', 2200); heGlint(HN_BUSH, 200, '#ffe27a', 8, 80); }
});
on('prime', (d) => {
  const el = spotNow();
  if (!el || el.dataset.spot !== 'tracking') { burst('Prime Prey!', `${ITEMS[d.item].name} · ×3 catch`, itemIc(d.item), '#ffd75e'); return; }
  sxBurst(el, HN_BUSH + 50, 200, true, 'Prime Prey!', `${ITEMS[d.item].name} · ×3 catch`);
  heGlint(HN_BUSH + 50, 210, '#ffe27a', 14, 90);
  heCheer(el);
});
on('shinybeast', (d) => {
  const B = BEASTS[d.id];
  toast(`Shiny ${B.name}! As a companion it gives 50% more.`, 'rare');
  const el = spotNow();
  if (!el || el.dataset.spot !== 'tracking') { burst('Shiny beast!', `${B.name} · its bonus ×1.5`, ic('beast', d.id), '#ffd75e'); return; }
  sxBurst(el, 536, 210, true, 'Shiny beast!', `${B.name} · its bonus ×1.5`);
  const b = el.querySelector('.hn-bst');
  if (b) b.classList.add('shiny');
  heGlint(536, 210, '#ffe27a', 16, 100);
  heCheer(el);
});
on('tamed', () => { const el = spotNow(); if (el && el.dataset.spot === 'tracking') { const b = el.querySelector('.hn-bst'); if (b) retrigger(b, 'tamed'); heGlint(536, 200, '#9ff3c8', 10, 70); } });
