'use strict';
/* ==========================================================================
   TRI-REALM IDLE — avatar
   A rigged stick figure drawn in SVG.

   How it is built (classic stick-figure animation practice):
   - Skeleton with fixed bone lengths and forward kinematics: upper limbs are
     set with an absolute angle, elbows and knees bend relative to them.
     The figure is grounded automatically so the feet always touch the floor.
   - The spine is a smooth curve (the line of action), not a straight line,
     and poses use contrapposto, C and S curves, asymmetry.
   - Limbs are tapered "skeletal strokes" (thick at the shoulder, thin at the
     wrist), far-side limbs are darker for depth, every body part has its own
     ink outline so overlaps read clearly. The head is a rigid 3/4 shape.
   - Animation is pose to pose with easing, plus breathing and secondary
     motion (capes, scarves, wings follow with a delay).

   Cosmetics are purely visual and earned from feats, never bought.
   Loaded after ui.js, before ui-systems.js.
   ========================================================================== */

/* ================================================================ cosmetics */
const kzOf = (z) => S.combat.kills[z] || 0;
const lvOf = (k) => (S.skills[k] ? skillLv(k) : 0);
const FREE = () => true;
const LV = (k, n) => ({ need: () => lvOf(k) >= n, hint: `Reach ${SKILLS[k] ? SKILLS[k].name : k} level ${n}` });
const BOSS = (z, who) => ({ need: () => kzOf(z) >= 1, hint: `Defeat ${who}` });
const KILLS = (z, n) => ({ need: () => kzOf(z) >= n, hint: `Defeat ${n} foes in ${(ZONES.find((x) => x.id === z) || {}).name || z}` });
// Every cosmetic belongs to one world (w) and is earned there. Free basics have no world.
// r = rarity 1–5 (frame colour). The first entry of each slot is the default.
const C = (id, name, w, r, req, extra) => Object.assign({ id, name, w, r }, req, extra || {});
const COSMETICS = {
  build: [
    { id: 'athletic', name: 'Athletic', r: 1, need: FREE, b: { w: 1, h: 1, head: 1 } },
    { id: 'slim',     name: 'Slim',     r: 1, need: FREE, b: { w: 0.78, h: 1.04, head: 0.96 } },
    { id: 'stout',    name: 'Stout',    r: 1, need: FREE, b: { w: 1.4, h: 0.93, head: 1.06 } },
    { id: 'tall',     name: 'Tall',     r: 1, need: FREE, b: { w: 0.92, h: 1.12, head: 0.94 } },
  ],
  // How the figure is inked. Flat: bright body, darker rim. Ink: black body, white rim.
  // Neon: black body with a glowing rim. Sketch: pencil lines on paper.
  style: [
    { id: 'flat', name: 'Flat', r: 1, need: FREE },
    C('ink',    'Soul Ink',        'soul', 3, LV('harvest', 25)),
    C('neon',   'Neon Alley',      'hex',  4, LV('exorcism', 25)),
    C('sketch', 'Ancient Sketch',  'echo', 4, LV('restoration', 20)),
  ],
  stance: [
    { id: 'relaxed', name: 'Relaxed', r: 1, need: FREE },
    C('swagger',  "Captain's Swagger", 'seas',    2, { need: () => S.stats.voyages >= 10, hint: 'Return from 10 voyages' }),
    C('guard',    'Shinobi Guard',     'shinobi', 3, KILLS('training', 50)),
    C('meditate', 'Meditation',        'ki',      4, LV('gravity', 20)),
    C('striking', 'Striking Pose',     'echo',    5, LV('bonding', 10)),
  ],
  color: [
    { id: 'chalk', name: 'Chalk', r: 1, ink: '#eef1f6', need: FREE },
    C('tide',    'Tide Blue',     'seas',    2, LV('fishing', 15),     { ink: '#4cc3ff' }),
    C('coral',   'Coral',         'seas',    2, LV('cooking', 20),     { ink: '#ff8a7a' }),
    C('ember',   'Ember Orange',  'shinobi', 3, LV('chakra', 20),      { ink: '#ff8a2b' }),
    C('spirit',  'Spirit Violet', 'soul',    3, LV('harvest', 20),     { ink: '#b49bff' }),
    C('gilded',  'Ki Gold',       'ki',      4, LV('gravity', 30),     { ink: '#ffc93d' }),
    C('crimson', 'Tyrant Red',    'ki',      4, BOSS('tyrant', 'the Crimson Tyrant'), { ink: '#ff4d5e' }),
    C('hexteal', 'Hex Teal',      'hex',     3, LV('sigilcraft', 20),  { ink: '#36d6a8' }),
    C('wild',    'Wild Green',    'hunter',  3, LV('tracking', 20),    { ink: '#9be15d' }),
    C('orchid',  'Orchid',        'echo',    4, LV('archaeology', 20), { ink: '#ef7cff' }),
    C('void',    'Rift Void',     'rift',    5, KILLS('tear', 10),     { ink: '#8b7bff' }),
  ],
  hat: [
    { id: 'none', name: 'No hat', r: 1, need: FREE },
    C('bucket',   "Fisher's Bucket",   'seas',    2, { need: () => (S.stats.made.minnow || 0) >= 100, hint: 'Catch 100 Minnows' }),
    C('bandana',  'Deckhand Bandana',  'seas',    2, KILLS('shoals', 25)),
    C('chef',     'Galley Toque',      'seas',    3, LV('cooking', 30)),
    C('tricorn',  'Admiral Tricorn',   'seas',    4, BOSS('admiral', 'the Admiral of the Tide')),
    C('hood',     'Shinobi Headband',  'shinobi', 4, BOSS('fox', 'the Ashen Fox Beast')),
    C('horns',    'Bone Horns',        'soul',    4, BOSS('sovereign', 'the Masked Sovereign')),
    C('martial',  'Martial Headband',  'ki',      3, LV('gravity', 15)),
    C('talisman', 'Sealing Talisman',  'hex',     3, LV('exorcism', 15)),
    C('beast',    'Beast Hood',        'hunter',  4, LV('taming', 15)),
    C('laurel',   'Laurel Wreath',     'echo',    3, LV('archaeology', 15)),
    C('crown',    'Rift Crown',        'rift',    5, BOSS('convergence', 'the Rift Emperor')),
  ],
  face: [
    { id: 'blank', name: 'Faceless', r: 1, need: FREE },
    { id: 'dots',  name: 'Calm',     r: 1, need: FREE },
    { id: 'smile', name: 'Cheerful', r: 1, need: FREE },
    C('patch',   'Eyepatch',       'seas',    3, LV('voyaging', 20)),
    C('mask',    'Shinobi Mask',   'shinobi', 3, LV('arts', 20)),
    C('husk',    'Husk Mask',      'soul',    4, KILLS('districts', 100)),
    C('fierce',  'Battle Glare',   'ki',      2, KILLS('plains', 50)),
    C('scar',    "Survivor's Scar", 'ki',     3, { need: () => S.stats.deaths >= 1 && !!S.gates.ki, hint: 'Lose a fight after reaching the Ki Frontier' }),
    C('cursed',  'Cursed Marks',   'hex',     3, LV('pacts', 15)),
    C('paint',   'War Paint',      'hunter',  2, KILLS('thicket', 50)),
    C('marble',  'Marble Mask',    'echo',    4, LV('restoration', 30)),
    C('rifteye', 'Rift Eye',       'rift',    5, BOSS('unbound', 'the Heart of the Rift')),
  ],
  back: [
    { id: 'none', name: 'Nothing', r: 1, need: FREE },
    C('coat',   "Captain's Coat",  'seas',    4, { need: () => S.stats.voyages >= 25, hint: 'Return from 25 voyages' }),
    C('scarf',  'Shinobi Scarf',   'shinobi', 2, LV('herbalism', 15)),
    C('shroud', "Reaper's Shroud", 'soul',    3, LV('harvest', 30)),
    C('pack',   'Capsule Pack',    'ki',      3, LV('tinkering', 20)),
    C('sigil',  'Sigil Circle',    'hex',     5, BOSS('matriarch', 'the Cursed Matriarch')),
    C('quiver', 'Hunter Quiver',   'hunter',  3, LV('trapcraft', 20)),
    C('pelt',   'Chimera Pelt',    'hunter',  5, BOSS('chimera', 'the Chimera King')),
    C('wings',  'Marble Wings',    'echo',    5, BOSS('pillar', 'the Pillar Lord')),
    C('mantle', 'Rift Mantle',     'rift',    4, { need: () => !!S.gates.rift, hint: 'Tear open the Convergence' }),
  ],
  aura: [
    { id: 'none', name: 'No aura', r: 1, need: FREE },
    C('bubbles',  'Sea Bubbles',   'seas',    3, LV('fishing', 40)),
    C('leaves',   'Leaf Whirl',    'shinobi', 3, LV('herbalism', 30)),
    C('wisps',    'Soul Wisps',    'soul',    4, LV('mining', 30)),
    C('embers',   'Ki Flare',      'ki',      4, BOSS('tyrant', 'the Crimson Tyrant')),
    C('smoke',    'Cursed Smoke',  'hex',     4, LV('pacts', 30)),
    C('flies',    'Fireflies',     'hunter',  3, LV('tracking', 30)),
    C('echo',     'Standing Echo', 'echo',    5, { need: () => !!(S.echo && S.echo.id), hint: 'Awaken an Echo' }),
    C('storm',    'Rift Storm',    'rift',    5, KILLS('tear', 50)),
  ],
};
const COS_SLOTS = [['build', 'Build'], ['style', 'Style'], ['stance', 'Stance'], ['color', 'Colour'], ['hat', 'Hat'], ['face', 'Face'], ['back', 'Back'], ['aura', 'Aura']];
const COS_RARITY = ['', 'Common', 'Uncommon', 'Rare', 'Epic', 'Legendary'];
const cosOf = (slot, id) => COSMETICS[slot].find((c) => c.id === id) || COSMETICS[slot][0];
const avatarOn = () => isUnlocked('feature:avatar');
function avState() {
  if (!S.avatar || typeof S.avatar !== 'object') S.avatar = {};
  const A = S.avatar;
  // v2 of the cosmetic list: re-check what this save has earned (quietly)
  if (!A.got || typeof A.got !== 'object' || A.gv !== 2) { A.got = {}; A.gv = 2; A.seeded = 0; }
  for (const [s] of COS_SLOTS) if (!COSMETICS[s].some((c) => c.id === A[s])) A[s] = COSMETICS[s][0].id;
  return A;
}
const cosOwned = (slot, c) => !!avState().got[slot + ':' + c.id] || c.need();
function checkCosmetics() {
  const A = avState(), fresh = [];
  for (const [s] of COS_SLOTS) for (const c of COSMETICS[s]) {
    const k = s + ':' + c.id;
    if (!A.got[k] && c.need()) { A.got[k] = 1; if (c.hint) fresh.push([s, c]); }
  }
  return fresh;
}
const cosCount = () => COS_SLOTS.reduce((a, [s]) => a + COSMETICS[s].filter((c) => cosOwned(s, c)).length, 0);
const cosTotal = () => COS_SLOTS.reduce((a, [s]) => a + COSMETICS[s].length, 0);

/* ================================================================ poses */
// Angles in degrees: 0 points down, 90 forward (the figure faces right), 180 up, -90 back.
// t1: abdomen (absolute) · t2: chest (relative) · n: neck (relative) · h: head tilt
// aF / aB: front / back arm [upper (absolute), elbow bend] · lF / lB: legs [thigh (absolute), knee bend]
// fF / fB: foot tilt · g: weapon angle relative to the forearm · dy: crouch · air: float above the ground
const POSES = {
  relaxed:  { sh: 1, t1: 176, t2: -6, n: 8,  h: 6,   aF: [14, 20],   aB: [-16, 14],  lF: [18, -24], lB: [-8, -2],  fF: 6,  fB: 0,  g: -150, dy: 0 },
  guard:    { t1: 158, t2: 12, n: -10, h: -10, aF: [64, 70],  aB: [34, 100],  lF: [44, -64], lB: [-40, -8],  fF: 0,  fB: -8, g: -70,  dy: 18 },
  swagger:  { sh: 1, t1: 188, t2: -10, n: -4, h: -14, aF: [36, -118], aB: [-46, 118], lF: [12, -8], lB: [-16, -2], fF: 10, fB: 0,  g: -170, dy: 0 },
  heroic:   { t1: 182, t2: -8, n: -10, h: -12, aF: [178, -12], aB: [-42, 114], lF: [28, -8],  lB: [-26, -4], fF: 4,  fB: 0,  g: -6,   dy: 0 },
  striking: { sh: 1, t1: 198, t2: -18, n: -20, h: -20, aF: [150, 72], aB: [-64, -96], lF: [34, -74], lB: [-12, -4], fF: 34, fB: 0, g: -150, dy: 0 },
  meditate: { sh: 1, t1: 180, t2: 0,  n: 6,  h: 8,   aF: [24, 66],   aB: [-6, 78],   lF: [84, -152], lB: [76, -146], fF: 60, fB: 60, g: -150, dy: 0, air: 18 },
  // attacks: anticipation pose, then the hit pose (with its effect)
  windup:   { t1: 198, t2: -14, n: 10, h: -4,  aF: [210, -50], aB: [70, 60],   lF: [36, -52], lB: [-40, -10], fF: 0,  fB: -8, g: -40,  dy: 16 },
  strike:   { t1: 140, t2: 14, n: -14, h: -10, aF: [104, 4],   aB: [-60, 30],  lF: [62, -78], lB: [-54, 0],   fF: -6, fB: -20, g: -4,  dy: 26, fx: 'slash' },
  coil:     { t1: 188, t2: -8, n: 4,  h: -6,   aF: [10, 96],   aB: [80, 40],   lF: [40, -60], lB: [-36, -8],  fF: 0,  fB: -8, g: -6,   dy: 20 },
  thrust:   { t1: 132, t2: 10, n: -16, h: -8,  aF: [94, -2],   aB: [-70, 20],  lF: [70, -84], lB: [-60, 4],   fF: -10, fB: -24, g: 0,  dy: 34, fx: 'thrust' },
  chamber:  { t1: 196, t2: -10, n: 6, h: -4,   aF: [40, 80],   aB: [-40, 60],  lF: [100, -120], lB: [-6, -4], fF: 20, fB: 0,  g: -90,  dy: 0 },
  kick:     { t1: 214, t2: -16, n: 12, h: -6,  aF: [-40, 40],  aB: [60, 50],   lF: [100, -4], lB: [-10, -2],  fF: -10, fB: 0, g: -150, dy: 0, fx: 'kick' },
  hurt:     { t1: 204, t2: -18, n: 20, h: 20,  aF: [-40, 50],  aB: [-20, 60],  lF: [16, -30], lB: [-28, -10], fF: 10, fB: 0,  g: -150, dy: 8, expr: 'hurt', fx: 'hit' },
  victory:  { t1: 184, t2: -8, n: -14, h: -16, aF: [190, -6],  aB: [-140, -30], lF: [40, -100], lB: [-10, -60], fF: 20, fB: 30, g: 0,   dy: 0, air: 26, expr: 'happy' },
  fish:     { sh: 1, t1: 172, t2: 4,  n: 2,  h: 6,   aF: [52, 44],   aB: [34, 70],   lF: [18, -20], lB: [-12, -6], fF: 4,  fB: 0,  g: -36,  dy: 2, prop: 'rod' },
  cook:     { sh: 1, t1: 170, t2: 6,  n: 6,  h: 12,  aF: [44, 50],   aB: [20, 92],   lF: [14, -14], lB: [-12, -6], fF: 2,  fB: 0,  g: -90,  dy: 2, prop: 'pan' },
};
const POSE_KEYS = ['t1', 't2', 'n', 'h', 'fF', 'fB', 'g', 'dy', 'air'];
function lerpPose(a, b, k) {
  const o = {};
  for (const key of POSE_KEYS) o[key] = (a[key] || 0) + ((b[key] || 0) - (a[key] || 0)) * k;
  for (const key of ['aF', 'aB', 'lF', 'lB']) o[key] = [0, 1].map((i) => a[key][i] + (b[key][i] - a[key][i]) * k);
  o.expr = k < 0.5 ? a.expr : b.expr;
  o.prop = k < 0.5 ? a.prop : b.prop;
  o.sh = k < 0.5 ? a.sh : b.sh;
  o.fx = k > 0.3 ? b.fx : a.fx;
  return o;
}
const ease = {
  io: (x) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2),
  out: (x) => 1 - Math.pow(1 - x, 3),
  back: (x) => 1 + 2.4 * Math.pow(x - 1, 3) + 1.4 * Math.pow(x - 1, 2),
};

/* ================================================================ geometry */
const D2R = Math.PI / 180;
const dir = (a) => [Math.sin(a * D2R), Math.cos(a * D2R)];
const add = (p, a, len) => { const d = dir(a); return [p[0] + d[0] * len, p[1] + d[1] * len]; };
const r1 = (v) => Math.round(v * 10) / 10;
const pt = (p) => `${r1(p[0])},${r1(p[1])}`;
const circ = (p, r) => `M${r1(p[0] - r)},${r1(p[1])}a${r1(r)},${r1(r)} 0 1,0 ${r1(2 * r)},0a${r1(r)},${r1(r)} 0 1,0 ${r1(-2 * r)},0`;
// A tapered stroke through points with per-point widths, round caps and joints.
function taper(pts, ws) {
  const L = [], R = [];
  for (let i = 0; i < pts.length; i++) {
    const a = pts[Math.max(0, i - 1)], b = pts[Math.min(pts.length - 1, i + 1)];
    let tx = b[0] - a[0], ty = b[1] - a[1];
    const l = Math.hypot(tx, ty) || 1; tx /= l; ty /= l;
    const h = ws[i] / 2;
    L.push([pts[i][0] - ty * h, pts[i][1] + tx * h]);
    R.push([pts[i][0] + ty * h, pts[i][1] - tx * h]);
  }
  let d = 'M' + L.map(pt).join('L') + 'L' + R.reverse().map(pt).join('L') + 'Z';
  for (let i = 0; i < pts.length; i++) d += circ(pts[i], ws[i] / 2);
  return d;
}
// Quadratic curve through a middle point, sampled (for the spine).
function curveThrough(a, m, b, n) {
  const c = [2 * m[0] - (a[0] + b[0]) / 2, 2 * m[1] - (a[1] + b[1]) / 2], out = [];
  for (let i = 0; i <= n; i++) {
    const t = i / n, u = 1 - t;
    out.push([u * u * a[0] + 2 * u * t * c[0] + t * t * b[0], u * u * a[1] + 2 * u * t * c[1] + t * t * b[1]]);
  }
  return out;
}
function shade(hex, f) {   // f < 0 darkens, f > 0 lightens
  const n = parseInt(hex.slice(1), 16);
  const ch = [n >> 16, (n >> 8) & 255, n & 255].map((c) => Math.round(f < 0 ? c * (1 + f) : c + (255 - c) * f));
  return '#' + ch.map((c) => c.toString(16).padStart(2, '0')).join('');
}
const OL = '#0a0c11';
// One body part: an ink outline behind its fill, so overlapping parts stay readable.
const part = (d, fill, ow) => `<path d="${d}" fill="${OL}" stroke="${OL}" stroke-width="${ow || 3.2}" stroke-linejoin="round"/><path d="${d}" fill="${fill}"/>`;

/* ================================================================ rig */
const GROUND = 226;
function solve(P, B) {
  const s = B.h;
  const len = { ab: 24 * s, ch: 25 * s, nk: 8 * s, ua: 29 * s, fa: 27 * s, th: 37 * s, sh: 37 * s, ft: 12 * s };
  const pelvis = [100, 128 + P.dy];
  const waist = add(pelvis, P.t1, len.ab);
  const chestA = P.t1 + P.t2;
  const chest = add(waist, chestA, len.ch);
  const neckA = chestA + P.n;
  const shoulder = add(chest, chestA, -4 * s);
  const headR = 21 * B.head;
  const neck = add(chest, neckA, len.nk);
  const head = add(neck, neckA, headR - 2);
  const arm = (a) => { const e = add(shoulder, a[0], len.ua); return [shoulder, e, add(e, a[0] + a[1], len.fa)]; };
  const leg = (l, ft) => {
    const k = add(pelvis, l[0], len.th), an = add(k, l[0] + l[1], len.sh);
    return [pelvis, k, an, add(an, 90 + ft, len.ft)];
  };
  const J = { pelvis, waist, chest, shoulder, neck, head, headR, chestA, neckA,
    aF: arm(P.aF), aB: arm(P.aB), lF: leg(P.lF, P.fF), lB: leg(P.lB, P.fB) };
  // ground the figure: the lowest foot point rests on the floor (unless floating)
  const low = Math.max(J.lF[2][1], J.lF[3][1], J.lB[2][1], J.lB[3][1]);
  const shift = GROUND - low - (P.air || 0);
  const mv = (p) => [p[0], p[1] + shift];
  for (const k of ['pelvis', 'waist', 'chest', 'shoulder', 'neck', 'head']) J[k] = mv(J[k]);
  for (const k of ['aF', 'aB', 'lF', 'lB']) J[k] = J[k].map(mv);
  J.foreA = { aF: P.aF[0] + P.aF[1], aB: P.aB[0] + P.aB[1] };
  return J;
}

/* ================================================================ drawing */
// Head-local drawings: head centre at 0,0, radius 19, facing right (3/4 view).
const LAUREL = (() => {
  let s = '';
  for (let i = 0; i < 9; i++) {
    const a = (198 + i * 17) * D2R, x = Math.cos(a) * 19.5, y = Math.sin(a) * 19.5 + 4, rot = (a / D2R) + 90 + (i % 2 ? 28 : -28);
    s += `<ellipse cx="${r1(x)}" cy="${r1(y)}" rx="5.2" ry="2.4" transform="rotate(${r1(rot)} ${r1(x)} ${r1(y)})" fill="${i % 2 ? '#e8c35a' : '#d4a83a'}" stroke="${OL}" stroke-width="1.2"/>`;
  }
  return s + `<path d="M-18,6 q-6,6 -4,14 M-17,7 q-9,3 -10,10" fill="none" stroke="#d4a83a" stroke-width="2" stroke-linecap="round"/>`;
})();
const HATS = {
  bucket: `<path d="M-15,-9 Q-15,-27 1,-27 Q16,-27 16,-9Z" fill="#c9a66b" stroke="${OL}" stroke-width="2.4"/><path d="M-15,-13 H16" stroke="#7d5f30" stroke-width="3"/><ellipse cx="1" cy="-9" rx="25" ry="4.6" fill="#b08e55" stroke="${OL}" stroke-width="2.4"/>`,
  bandana: `<path d="M-18,-16 l-13,-5 l2,9Z M-18,-14 l-11,8 l7,2Z" fill="#b8323f" stroke="${OL}" stroke-width="2.2" stroke-linejoin="round"/><path d="M-19.5,-3 Q-20,-22 0,-22.5 Q19,-22 19.5,-6 Q2,-12 -19.5,-3Z" fill="#d8434f" stroke="${OL}" stroke-width="2.4"/><circle cx="-6" cy="-15" r="1.6" fill="#fff"/><circle cx="4" cy="-17" r="1.6" fill="#fff"/><circle cx="12" cy="-13" r="1.6" fill="#fff"/>`,
  chef: `<g stroke="${OL}" stroke-width="2.4"><circle cx="-10" cy="-31" r="9" fill="#fff"/><circle cx="11" cy="-31" r="9" fill="#fff"/><circle cx="0" cy="-37" r="11" fill="#fff"/><path d="M-14,-14 L-14,-27 H14 L14,-14Z" fill="#fff"/></g><path d="M-9,-30 Q0,-34 9,-30" fill="none" stroke="#d6dbe6" stroke-width="2"/><path d="M-14,-17 H14" stroke="#d6dbe6" stroke-width="2"/>`,
  tricorn: `<path d="M-27,-11 Q-24,-35 0,-35 Q24,-35 30,-9 Q15,-20 1,-16 Q-13,-20 -27,-11Z" fill="#1d2433" stroke="${OL}" stroke-width="2.4" stroke-linejoin="round"/><path d="M-24,-13 Q-12,-21 1,-18 Q15,-21 27,-11" fill="none" stroke="#f4c66a" stroke-width="2"/><path d="M0,-30 l4,4 -4,4 -4,-4Z" fill="#f4c66a" stroke="${OL}" stroke-width="1.2"/><path d="M-10,-28 q4,-6 8,-3" fill="none" stroke="#fff" stroke-width="1.4" opacity=".6"/>`,
  hood: `<path d="M-17,-11 Q-27,-14 -38,-5 M-17,-9 Q-26,-3 -34,6" fill="none" stroke="${OL}" stroke-width="6" stroke-linecap="round"/><path d="M-17,-11 Q-27,-14 -38,-5 M-17,-9 Q-26,-3 -34,6" fill="none" stroke="#3b4660" stroke-width="3.2" stroke-linecap="round"/><path d="M-19,-6 Q-18,-17 0,-17.5 Q17,-17 19,-8 L18.5,-2 Q2,-10 -19,0Z" fill="#3b4660" stroke="${OL}" stroke-width="2.4"/><rect x="2" y="-15" width="13" height="8" rx="1.5" fill="#c7cfdd" stroke="${OL}" stroke-width="1.8" transform="rotate(8 8 -11)"/><path d="M5,-11 q3.5,-3 7,0" fill="none" stroke="#56627a" stroke-width="1.6"/>`,
  horns: `<g stroke="${OL}" stroke-width="2.2" stroke-linejoin="round"><path d="M-9,-16 Q-24,-24 -21,-43 Q-14,-28 -1,-19Z" fill="#d8d0bd"/><path d="M8,-18 Q15,-34 6,-47 Q21,-38 17,-14Z" fill="#ece5d4"/></g><path d="M-15,-28 l4,2 M-17,-34 l4,1 M11,-30 l4,1 M11,-37 l4,0" stroke="#9c9586" stroke-width="1.4"/>`,
  martial: `<path d="M-18,-6 C-30,-9 -36,0 -48,-8 M-18,-4 C-28,2 -34,10 -44,8" fill="none" stroke="${OL}" stroke-width="6.4" stroke-linecap="round"/><path d="M-18,-6 C-30,-9 -36,0 -48,-8 M-18,-4 C-28,2 -34,10 -44,8" fill="none" stroke="#e8443a" stroke-width="3.6" stroke-linecap="round"/><path d="M-19.6,-5 Q-18,-15 0,-15.5 Q18,-15 19.6,-8 L19.6,-2 Q2,-8 -19.6,1Z" fill="#e8443a" stroke="${OL}" stroke-width="2.2"/><circle cx="-19" cy="-4" r="3.4" fill="#c22f27" stroke="${OL}" stroke-width="1.6"/>`,
  talisman: `<path d="M-18,-9 Q-4,-21 9,-18" fill="none" stroke="#c0392b" stroke-width="1.6"/><g transform="rotate(-5 10 -14)"><rect x="4.5" y="-19" width="11" height="34" rx="1" fill="#f5e6a8" stroke="${OL}" stroke-width="1.8"/><path d="M10,-15 v9 M6.5,-11 h7 M7,-3 q3,3.5 6,0 M10,0 v10 M7,8 h6" fill="none" stroke="#c0392b" stroke-width="1.6" stroke-linecap="round"/></g>`,
  beast: `<g stroke="${OL}" stroke-width="2.2" stroke-linejoin="round"><path d="M-13,-17 L-18,-38 L-2,-22Z M3,-22 L10,-40 L15,-18Z" fill="#9a6a3c"/><path d="M-12,-21 L-15,-32 L-6,-23Z M5,-23 L9,-33 L12,-21Z" fill="#e0a07a" stroke="none"/><path d="M-21,10 Q-25,-22 0,-23 Q18,-23 20.5,-11 Q8,-17 -5,-12 Q-14,-4 -12,11Z" fill="#9a6a3c"/></g><path d="M-16,4 l-4,3 M-17,-4 l-5,1 M-12,-16 l-2,-4" stroke="#6e4a28" stroke-width="1.6" stroke-linecap="round"/>`,
  laurel: LAUREL,
  crown: `<path d="M-14,-15 L-17,-34 L-8,-25 L0,-39 L8,-25 L17,-34 L14,-15Z" fill="#f4c66a" stroke="${OL}" stroke-width="2.4" stroke-linejoin="round"/><path d="M-14,-19 H14" stroke="#a87b22" stroke-width="2"/><circle cx="0" cy="-23" r="3" fill="#ff3fb4" stroke="${OL}" stroke-width="1.4"/><circle cx="-17" cy="-34" r="2" fill="#ffd0ee"/><circle cx="17" cy="-34" r="2" fill="#ffd0ee"/><circle cx="0" cy="-39" r="2.2" fill="#ffd0ee"/>`,
};
function faceSVG(face, expr, eye) {
  if (face === 'blank') return '';
  const E = eye || OL, e = `fill="${E}"`, st = `stroke="${E}" stroke-width="2.2" stroke-linecap="round" fill="none"`;
  const scar = face === 'scar' ? `<path d="M13,-12 L18,1" stroke="#ff4d5e" stroke-width="2.2" stroke-linecap="round"/>` : '';
  const plain = ['dots', 'smile', 'fierce', 'scar'].includes(face);
  if (expr === 'hurt' && plain) return `<path d="M1,-5 l5,3 -5,3 M16,-5 l-5,3 5,3" ${st}/><path d="M5,9 Q9,6 13,9" ${st}/>` + scar;
  if (expr === 'happy' && plain) return `<path d="M1,-1 Q4,-6 7,-1 M10,-1 Q13,-6 16,-1" ${st}/><path d="M4,6 Q9.5,13 15,5" ${st}/>` + scar;
  const eyes = `<ellipse cx="4" cy="-2" rx="2" ry="3" ${e}/><ellipse cx="13" cy="-2" rx="2.3" ry="3.2" ${e}/>`;
  switch (face) {
    case 'smile': return eyes + `<path d="M4,6 Q9.5,12 15,5" ${st}/>`;
    case 'fierce': return `<path d="M0,-9 L7,-5 M17,-9 L11,-5" ${st}/><ellipse cx="4" cy="-1" rx="2" ry="2.4" ${e}/><ellipse cx="13" cy="-1" rx="2.2" ry="2.6" ${e}/><path d="M5,8 H14" ${st}/>`;
    case 'scar': return eyes + scar + `<path d="M6,7 H12" ${st}/>`;
    case 'patch': return `<path d="M-19,-9 Q0,-15 19,-9" fill="none" stroke="#15161b" stroke-width="2"/><ellipse cx="4" cy="-2" rx="2" ry="3" ${e}/><ellipse cx="13" cy="-2" rx="5.4" ry="5.8" fill="#15161b" stroke="${OL}" stroke-width="1.2"/><path d="M10,-5 q3,-2 6,0" fill="none" stroke="#3a3d47" stroke-width="1.2"/>`;
    case 'mask': return `<ellipse cx="4" cy="-4" rx="2" ry="2.8" ${e}/><ellipse cx="13" cy="-4" rx="2.2" ry="3" ${e}/><path d="M-6,1 H19.5 Q18.5,15 8,16.5 Q-3,15 -6,1Z" fill="#323a4b" stroke="${OL}" stroke-width="2"/><path d="M-1,6 H16 M1,10.5 H14" stroke="#4c566b" stroke-width="1.2"/>`;
    case 'husk': return `<path d="M-4,-17 Q19,-19 20.5,0 Q19.5,13 8,17 Q-1,18 -4,12Z" fill="#f2ede0" stroke="${OL}" stroke-width="2"/><ellipse cx="5" cy="-4" rx="3.2" ry="4.4" fill="#15161b"/><ellipse cx="14" cy="-4" rx="3.4" ry="4.6" fill="#15161b"/><path d="M1,9 H18 M4.5,7 v5 M8.5,7 v6 M12.5,7 v6 M16,7 v5" stroke="#15161b" stroke-width="1.2"/><path d="M9,-17 L12,-9 M17,-14 L16,-8" stroke="#c0392b" stroke-width="1.8" stroke-linecap="round"/>`;
    case 'cursed': return eyes + `<path d="M1,3 l2.5,5 M5,3 l1,4 M11,3 l2.5,5 M15,3 l1,4" stroke="#36d6a8" stroke-width="1.8" stroke-linecap="round"/><path d="M-6,-12 q4,-4 8,0 q4,4 8,0" fill="none" stroke="#36d6a8" stroke-width="1.6"/><circle cx="18" cy="6" r="1.4" fill="#36d6a8"/>`;
    case 'paint': return eyes + `<path d="M-3,3 l9,-1.5 M10,3 l9,-1.5" stroke="#5aa83a" stroke-width="2.8" stroke-linecap="round"/><path d="M-1,-11 l14,-2.5" stroke="#9a6a3c" stroke-width="2.8" stroke-linecap="round"/>`;
    case 'marble': return `<path d="M-5,-10 Q8,-15 21,-10 L20.5,1 Q14,4 8.5,-0.5 Q3,4 -4,2Z" fill="#f4f1ea" stroke="#d4a83a" stroke-width="1.8" stroke-linejoin="round"/><ellipse cx="4" cy="-4" rx="2.6" ry="3" fill="#15161b"/><ellipse cx="13.5" cy="-4" rx="2.8" ry="3.2" fill="#15161b"/><path d="M0,-10 q3,-3 6,0 M12,-11 q3,-3 6,0" fill="none" stroke="#d4a83a" stroke-width="1.2"/>`;
    case 'rifteye': return `<circle cx="9" cy="-2" r="10" fill="#ff3fb4" opacity=".28"/><ellipse cx="9" cy="-2" rx="6.5" ry="7.5" fill="#ff3fb4" stroke="${OL}" stroke-width="1.6"/><ellipse cx="9" cy="-2" rx="4" ry="5.5" fill="#ffe3f4"/><rect x="8" y="-7" width="2" height="10" rx="1" fill="#15161b"/>`;
    default: return eyes;
  }
}
// Weapon drawn along +x from the grip (0,0); its shape follows the equipped item.
function weaponKind(id) {
  const n = id || '';
  return /bow/.test(n) ? 'bow' : /hammer/.test(n) ? 'hammer' : /cannon/.test(n) ? 'cannon' : /gauntlet/.test(n) ? 'fist'
    : /claw/.test(n) ? 'claw' : /sickle/.test(n) ? 'sickle' : /lance/.test(n) ? 'lance' : /cleaver/.test(n) ? 'cleaver'
    : /katana|blade/.test(n) ? 'katana' : /kunai|senbon|tanto|fang|wakizashi/.test(n) ? 'short' : 'cutlass';
}
const RCOL = ['#9aa3b5', '#9aa3b5', '#5fd38a', '#4cc3ff', '#b07cff', '#f4c66a', '#ff7a59'];
function weaponSVG(id) {
  const r = typeof rarity === 'function' ? rarity(id) : 1, c = RCOL[Math.min(6, r)] || RCOL[1];
  const m = '#dfe4ee', o = `stroke="${OL}" stroke-width="2" stroke-linejoin="round"`;
  const glow = (d) => (r >= 4 ? `<path d="${d}" fill="none" stroke="${c}" stroke-width="7" opacity=".28" stroke-linejoin="round"/>` : '');
  const grip = `<rect x="-9" y="-2.4" width="10" height="4.8" rx="1.5" fill="#5a3d26" ${o}/><circle cx="-10" cy="0" r="2.8" fill="${c}" ${o}/>`;
  const guard = `<rect x="0" y="-7" width="3.6" height="14" rx="1.5" fill="${c}" ${o}/>`;
  let b;
  switch (weaponKind(id)) {
    case 'katana': b = 'M3,-2.2 Q30,-5 56,-6 Q44,1 3,2.2Z'; return glow(b) + grip + `<path d="${b}" fill="${m}" ${o}/><path d="M5,-1 Q30,-3.5 50,-4.6" stroke="#fff" stroke-width="1" fill="none"/><ellipse cx="2" cy="0" rx="2.6" ry="6" fill="${c}" ${o}/>`;
    case 'short': b = 'M3,-2.4 L26,-1 L31,0 L26,1.2 L3,2.4Z'; return glow(b) + grip + `<path d="${b}" fill="${m}" ${o}/>` + guard;
    case 'cleaver': b = 'M3,-3 L40,-11 Q46,-4 42,6 L3,3Z'; return glow(b) + grip + `<path d="${b}" fill="${m}" ${o}/><path d="M6,-1 L40,-7" stroke="#fff" stroke-width="1"/>` + guard;
    case 'hammer': b = 'M30,-12 h14 v24 h-14z'; return glow(b) + `<rect x="-8" y="-2.2" width="40" height="4.4" rx="1.5" fill="#5a3d26" ${o}/><path d="${b}" fill="#6c7385" ${o}/><path d="M33,-12 v24" stroke="${c}" stroke-width="2"/>`;
    case 'sickle': b = 'M30,-2 Q30,-26 8,-30 Q22,-20 24,-2Z'; return glow(b) + `<rect x="-8" y="-2.2" width="38" height="4.4" rx="1.5" fill="#3d2f2a" ${o}/><path d="${b}" fill="${m}" ${o}/>`;
    case 'lance': b = 'M54,-5 L72,0 L54,5Z'; return glow(b) + `<rect x="-14" y="-2" width="70" height="4" rx="1.5" fill="#d8d0bd" ${o}/><path d="${b}" fill="${m}" ${o}/><circle cx="52" cy="0" r="3" fill="${c}" ${o}/>`;
    case 'bow': b = 'M4,-38 Q30,0 4,38'; return glow(b) + `<path d="M4,-38 L4,38" stroke="#e8e2d4" stroke-width="1"/><path d="${b}" fill="none" stroke="${OL}" stroke-width="6" stroke-linecap="round"/><path d="${b}" fill="none" stroke="${c}" stroke-width="3" stroke-linecap="round"/>`;
    case 'cannon': b = 'M0,-6 h30 v12 h-30z'; return glow(b) + `<path d="M-6,0 l-4,10 h6 l3,-8z" fill="#5a3d26" ${o}/><path d="${b}" fill="#3a404d" ${o}/><rect x="26" y="-7.5" width="6" height="15" rx="1.5" fill="${c}" ${o}/>`;
    case 'fist': return `<circle cx="2" cy="0" r="8.5" fill="#6c7385" ${o}/><path d="M-2,-6 v12 M3,-7 v14" stroke="${c}" stroke-width="2"/>`;
    case 'claw': b = 'M2,-4 Q20,-12 30,-4 M2,0 Q22,-2 32,4 M2,4 Q18,10 28,12'; return `<path d="${b}" fill="none" stroke="${OL}" stroke-width="5" stroke-linecap="round"/><path d="${b}" fill="none" stroke="${m}" stroke-width="2.6" stroke-linecap="round"/>`;
    default: b = 'M3,-2.6 Q26,-7 46,-3 Q34,4 3,2.6Z'; return glow(b) + grip + `<path d="${b}" fill="${m}" ${o}/><path d="M6,-1.6 Q26,-4.6 42,-2.6" stroke="#fff" stroke-width="1" fill="none"/>` + guard;
  }
}
// rotate() so that local +x points along angle a (our angle convention)
const rotTo = (a) => r1(90 - a);

const STYLES = {
  flat:   (ink) => ({ body: ink, far: shade(ink, -0.3), rim: shade(ink, -0.58), rw: 1.7, eye: OL }),
  ink:    (ink) => ({ body: '#0d0f14', far: '#1c2029', rim: '#f2f4f8', rw: 1.3, eye: ink }),
  neon:   (ink) => ({ body: '#06070b', far: '#06070b', rim: ink, rw: 1.9, eye: ink, filter: 'avNeon' }),
  sketch: () => ({ body: '#ebe6da', far: '#c4bdae', rim: '#1d1d1f', rw: 1.4, eye: '#1d1d1f', filter: 'avSketch' }),
};
// A thick limb bending smoothly through its middle joint (a "noodle" limb), with a rim.
function curvy(a, j, b) { const c = [2 * j[0] - (a[0] + b[0]) / 2, 2 * j[1] - (a[1] + b[1]) / 2]; return `M${pt(a)}Q${pt(c)} ${pt(b)}`; }
const stroke = (d, w, col, rim, rw) => `<path d="${d}" fill="none" stroke="${rim}" stroke-width="${r1(w + rw * 2)}" stroke-linecap="round" stroke-linejoin="round"/><path d="${d}" fill="none" stroke="${col}" stroke-width="${r1(w)}" stroke-linecap="round" stroke-linejoin="round"/>`;

function drawAvatar(A, P, t, opt) {
  const B = cosOf('build', A.build).b, ink = A.ink || cosOf('color', A.color).ink;
  const St = STYLES[A.style] ? STYLES[A.style](ink) : STYLES.flat(ink);
  const J = solve(P, B), W = B.w, out = [];
  const LW = 10.5 * W, TW = 12 * W;   // limb and torso thickness (about a quarter of the head)
  const cx = (J.pelvis[0] + J.chest[0]) / 2, cy = (J.pelvis[1] + J.chest[1]) / 2;
  const feetX = (J.lF[2][0] + J.lB[2][0]) / 2, air = P.air || 0;
  out.push(`<ellipse cx="${r1(feetX)}" cy="${GROUND + 1}" rx="${r1(32 - air * 0.5)}" ry="5" fill="#000" opacity="${r1(0.42 - air * 0.01)}"/>`);
  const aura = auraSVG(A.aura, cx, cy, t);
  if (aura) out.push(AURA_GLOW[A.aura] ? `<g style="mix-blend-mode:screen">${aura}</g>` : aura);
  const fig = [];
  fig.push(backSVG(A.back, J, t, B, P));
  // opt.weapon: an item id, '' for bare hands, or undefined for your equipped weapon
  const worn = opt.weapon !== undefined ? opt.weapon || null : S.equip && S.equip.weapon;
  const kind = worn && weaponKind(worn);
  if (worn && P.sh && !['fist', 'claw'].includes(kind)) fig.push(`<g transform="translate(${pt(add(add(J.shoulder, J.chestA, 10), J.chestA - 90, 14))}) rotate(${rotTo(J.chestA - 232)})">${weaponSVG(worn)}</g>`);
  if (P.fx) fig.push(fxSVG(P.fx, J, worn ? RCOL[Math.min(6, typeof rarity === 'function' ? rarity(worn) : 1)] : ink));
  // The body is one silhouette: every rim first, then every fill on top,
  // so limbs, torso and head melt together with no seams between them.
  const parts = [
    [curvy(J.lB[0], J.lB[1], J.lB[2]), LW], [curvy(J.aB[0], J.aB[1], J.aB[2]), LW * 0.92],
    [curvy(J.pelvis, J.waist, J.neck), TW],
    [curvy(J.lF[0], J.lF[1], J.lF[2]), LW], [curvy(J.aF[0], J.aF[1], J.aF[2]), LW * 0.92],
  ];
  const line = (d, w, col) => `<path d="${d}" fill="none" stroke="${col}" stroke-width="${r1(w)}" stroke-linecap="round" stroke-linejoin="round"/>`;
  const head = (r, col) => `<circle cx="${r1(J.head[0])}" cy="${r1(J.head[1])}" r="${r1(r)}" fill="${col}"/>`;
  fig.push(parts.map(([d, w]) => line(d, w + St.rw * 2, St.rim)).join('') + head(J.headR + St.rw, St.rim));
  fig.push(parts.map(([d, w]) => line(d, w, St.body)).join('') + head(J.headR, St.body));
  // head details ride on the head (rigid, tilting with the neck)
  const ha = (P.h || 0) + (180 - J.neckA) * 0.6;
  const gloss = A.style === 'flat' || !A.style ? `<path d="M-11,-10 A13,13 0 0,1 2,-14" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round" opacity=".35"/>` : '';
  fig.push(`<g transform="translate(${pt(J.head)}) rotate(${r1(ha)}) scale(${r1(J.headR / 19 * 100) / 100})">${gloss}${faceSVG(A.face, P.expr, St.eye)}${HATS[A.hat] || ''}</g>`);
  // weapon or tool in the near hand; the hand is redrawn over the grip
  const hand = J.aF[2], fa = J.foreA.aF, prop = P.prop;
  const weapon = !prop && worn && (!P.sh || ['fist', 'claw'].includes(kind)) ? worn : null;
  if (weapon) fig.push(`<g transform="translate(${pt(hand)}) rotate(${rotTo(fa + P.g)})">${weaponSVG(weapon)}</g>`);
  if (prop === 'rod') fig.push(rodSVG(hand, fa + P.g, t));
  if (prop === 'pan') fig.push(panSVG(hand, fa + P.g, t));
  if (weapon || prop) fig.push(`<circle cx="${r1(hand[0])}" cy="${r1(hand[1])}" r="${r1(LW * 0.46)}" fill="${St.body}"/>`);
  if (A.back === 'scarf') fig.push(part(taper([add(J.chest, J.chestA, -2), J.neck], [9 * W, 8 * W]), '#ff8a2b', 2.2));
  out.push(St.filter ? `<g filter="url(#${St.filter})">${fig.join('')}</g>` : fig.join(''));
  return out.join('');
}
// Motion effects: slash trail, thrust speed lines, kick impact, hit recoil.
function fxSVG(fx, J, col) {
  const sh = J.shoulder;
  const P = (a, r) => pt(add(sh, a, r));
  if (fx === 'slash') {
    const R = 84, a0 = 226, a1 = 72;
    const cres = (r, k) => `M${P(a0, r)} A${r},${r} 0 0,1 ${P(a1, r * 0.98)} A${r1(r * k)},${r1(r * k)} 0 0,0 ${P(a0, r * 0.94)}Z`;
    return `<path d="${cres(R, 1.3)}" fill="${col}" opacity=".55"/><path d="${cres(R * 0.96, 1.45)}" fill="#fff" opacity=".7"/>`;
  }
  if (fx === 'thrust') {
    const y0 = J.chest[1], x0 = J.pelvis[0];
    return [0, 1, 2, 3].map((i) => { const y = y0 - 8 + i * 14, x = x0 - 34 - (i % 2) * 16; return `<path d="M${r1(x - 40)},${r1(y)} H${r1(x)}" stroke="${i % 2 ? col : '#fff'}" stroke-width="${3 - (i % 2)}" stroke-linecap="round" opacity=".7"/>`; }).join('')
      + burst(add(J.aF[2], J.foreA.aF, 46), 13, col);
  }
  if (fx === 'kick') return `<path d="M${pt(add(J.lF[1], -90, 6))} Q${pt(add(J.pelvis, 0, 26))} ${pt(add(J.lF[2], 0, 4))}" fill="none" stroke="#fff" stroke-width="3" opacity=".5" stroke-linecap="round"/>` + burst(add(J.lF[2], 90, 8), 18, col);
  if (fx === 'hit') {
    const c = add(J.chest, 90, 26);
    return burst(c, 10, '#ff4d5e') + [0, 1, 2].map((i) => `<path d="M${r1(J.chest[0] - 30)},${r1(J.chest[1] - 6 + i * 14)} h-22" stroke="#fff" stroke-width="2" opacity=".5" stroke-linecap="round"/>`).join('');
  }
  return '';
}
// A comic impact star.
function burst(c, r, col) {
  const pts = [];
  for (let i = 0; i < 16; i++) pts.push(pt(add(c, i * 22.5, i % 2 ? r * 0.45 : r)));
  return `<path d="M${pts.join('L')}Z" fill="#fff" stroke="${col}" stroke-width="2.4" stroke-linejoin="round"/>`;
}
// Shared SVG filters for the Neon and Sketch styles (one copy per page).
const AV_DEFS = `<defs>
    <filter id="avNeon" x="-40%" y="-40%" width="180%" height="180%"><feGaussianBlur in="SourceGraphic" stdDeviation="3.2" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
    <filter id="avSketch" x="-10%" y="-10%" width="120%" height="120%"><feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="2" seed="3" result="n"/><feDisplacementMap in="SourceGraphic" in2="n" scale="3" xChannelSelector="R" yChannelSelector="G"/></filter>
  </defs>`;
function avDefs() {
  if (typeof document === 'undefined' || !document.body || !document.createElementNS || document.getElementById('av-defs')) return;
  const d = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  d.id = 'av-defs';
  d.setAttribute('style', 'position:absolute;width:0;height:0;overflow:hidden');
  d.innerHTML = AV_DEFS;
  document.body.appendChild(d);
}
if (typeof document !== 'undefined' && document.addEventListener) {
  if (document.body) avDefs(); else document.addEventListener('DOMContentLoaded', avDefs);
}

function rodSVG(hand, a, t) {
  const tip = add(hand, a, 74), bob = [tip[0] + 22, GROUND - 6 + Math.sin(t * 2.4) * 2.5];
  return `<path d="M${pt(tip)} Q${r1((tip[0] + bob[0]) / 2 + 4)},${r1(bob[1] - 30)} ${pt(bob)}" fill="none" stroke="#cfd6e4" stroke-width="1" opacity=".8"/>`
    + part(taper([add(hand, a, -10), tip], [4.2, 1.8]), '#8a5a2b', 2.4)
    + `<circle cx="${r1(bob[0])}" cy="${r1(bob[1])}" r="3.4" fill="#ff4d5e" stroke="${OL}" stroke-width="1.6"/><path d="M${r1(bob[0] - 3.4)},${r1(bob[1])} h6.8" stroke="#fff" stroke-width="1.4"/>`;
}
function panSVG(hand, a, t) {
  const end = add(hand, a, 16), c = add(end, a, 15), flip = (t * 1.3) % 1, up = Math.sin(flip * Math.PI) * 26;
  return part(taper([hand, end], [3.6, 3.6]), '#3b3f4a', 2.2)
    + `<ellipse cx="${r1(c[0])}" cy="${r1(c[1])}" rx="16" ry="5" fill="#2a2e38" stroke="${OL}" stroke-width="2.4"/>`
    + `<g transform="translate(${r1(c[0])},${r1(c[1] - 4 - up)}) rotate(${r1(flip * 360)})"><ellipse rx="7" ry="3" fill="#ffb36b" stroke="${OL}" stroke-width="1.6"/><path d="M6,0 l4,-3 v6z" fill="#ffb36b" stroke="${OL}" stroke-width="1.2"/></g>`;
}
// A cape hanging from the shoulders and trailing behind (wind follows the lean).
function capeSVG(J, B, P, t, o) {
  const sh = J.shoulder, pel = J.pelvis, sway = Math.sin(t * 2.1);
  const hemY = pel[1] + (o.len || 54) * B.h, back = -42 - sway * 6 - (P.t1 < 170 ? 14 : 0);
  const a = [sh[0] + 4, sh[1] - 2], tip = [pel[0] + back, hemY], end = [pel[0] - 2, hemY - 4];
  let hem;
  if (o.jag) {   // torn hem: zig-zag between the trailing tip and the heel of the cape
    const pts = [];
    for (let i = 1; i <= 6; i++) { const k = i / 6, x = tip[0] + (end[0] - tip[0]) * k, y = tip[1] + (end[1] - tip[1]) * k + (i % 2 ? 9 : 0) + Math.sin(t * 3 + i) * 1.5; pts.push(`${r1(x)},${r1(y)}`); }
    hem = 'L' + pts.join('L');
  } else hem = `Q${r1(pel[0] + back / 2 + 4)},${r1(hemY + 6 + sway * 3)} ${pt(end)}`;
  const d = `M${pt(a)} Q${r1(sh[0] - 30)},${r1(sh[1] + 30)} ${pt(tip)} ${hem} Q${r1(pel[0] + 2)},${r1(sh[1] + 30)} ${r1(sh[0] + 8)},${r1(sh[1])}Z`;
  let s = `<path d="${d}" fill="${o.fill}" stroke="${OL}" stroke-width="3" stroke-linejoin="round"/>`;
  s += `<path d="M${r1(sh[0] - 2)},${r1(sh[1] + 6)} Q${r1(sh[0] - 14)},${r1(sh[1] + 34)} ${r1(pel[0] + back * 0.7)},${r1(hemY - 4)}" fill="none" stroke="${o.fold}" stroke-width="2.4"/>`;
  if (o.edge) s += `<path d="M${pt(tip)} ${hem}" fill="none" stroke="${o.edge}" stroke-width="2.2" stroke-linejoin="round"/>`;
  if (o.stripes) s += [0.3, 0.55, 0.8].map((k) => `<path d="M${r1(sh[0] - 6 - 20 * k)},${r1(sh[1] + 20 + 50 * k)} q-6,4 -12,2" fill="none" stroke="#5a3a1c" stroke-width="3" stroke-linecap="round"/>`).join('');
  if (o.stars) s += [[0.35, 0.4], [0.6, 0.65], [0.5, 0.85], [0.75, 0.5]].map(([kx, ky], i) => { const x = sh[0] + (tip[0] - sh[0]) * kx, y = sh[1] + (hemY - sh[1]) * ky; return `<circle cx="${r1(x)}" cy="${r1(y)}" r="${1.4 + (i % 2)}" fill="#ffd0ee" opacity="${r1(0.6 + Math.sin(t * 4 + i) * 0.4)}"/>`; }).join('');
  return s;
}
function backSVG(id, J, t, B, P) {
  const W = B.w, sh = J.shoulder, pel = J.pelvis, sway = Math.sin(t * 2.1);
  switch (id) {
    case 'coat': {
      const fl = 36 + sway * 4;
      const d = `M${pt([sh[0] - 9 * W, sh[1]])} L${pt([sh[0] + 9 * W, sh[1]])} L${r1(pel[0] + 10 * W)},${r1(pel[1] + 32)} L${r1(pel[0] - 4)},${r1(pel[1] + 24)} L${r1(pel[0] - fl)},${r1(pel[1] + 46)} Z`;
      return `<path d="${d}" fill="#8e2433" stroke="${OL}" stroke-width="3" stroke-linejoin="round"/><path d="M${pt([sh[0] - 7 * W, sh[1] + 2])} L${r1(pel[0] - fl + 3)},${r1(pel[1] + 37)} M${r1(pel[0] + 8 * W)},${r1(pel[1] + 30)} L${r1(pel[0] - 2)},${r1(pel[1] + 23)}" stroke="#f4c66a" stroke-width="2.2"/>`;
    }
    case 'shroud': return capeSVG(J, B, P, t, { fill: '#2a2238', fold: '#1a1424', edge: '#9b6bff', jag: 1, len: 62 });
    case 'pelt':   return capeSVG(J, B, P, t, { fill: '#c8873a', fold: '#a46a28', edge: '#e8c08a', stripes: 1, len: 50 });
    case 'mantle': return capeSVG(J, B, P, t, { fill: '#1a0f2a', fold: '#2c1846', edge: '#ff3fb4', stars: 1, len: 60 });
    case 'pack': return `<g transform="translate(${pt(J.waist)}) rotate(${r1(rotTo(J.chestA) + 90)})"><path d="M-14,-24 V-36" stroke="${OL}" stroke-width="3.4"/><path d="M-14,-24 V-36" stroke="#cfd6e4" stroke-width="1.6"/><circle cx="-14" cy="-37" r="3" fill="#ff8a2b" stroke="${OL}" stroke-width="1.4"/><rect x="-27" y="-24" width="22" height="30" rx="9" fill="#f2f2f2" stroke="${OL}" stroke-width="2.6"/><rect x="-27" y="-12" width="22" height="7" fill="#ff8a2b" stroke="${OL}" stroke-width="1.6"/><circle cx="-16" cy="-17" r="2.2" fill="#4cc3ff"/></g>`;
    case 'quiver': return `<g transform="translate(${pt(J.waist)}) rotate(${r1(rotTo(J.chestA) + 70)})"><g stroke="${OL}" stroke-width="1.4"><path d="M-22,-30 l-3,-10 l5,3Z" fill="#e8443a"/><path d="M-16,-31 l-1,-11 l4,4Z" fill="#f2f2f2"/><path d="M-10,-30 l2,-10 l3,5Z" fill="#9be15d"/></g><path d="M-21,-32 v6 M-15,-33 v6 M-9,-32 v6" stroke="#5a3d26" stroke-width="2"/><rect x="-26" y="-28" width="20" height="38" rx="5" fill="#8a5a2b" stroke="${OL}" stroke-width="2.6"/><path d="M-26,-20 h20 M-26,2 h20" stroke="#5a3d26" stroke-width="2"/></g>`;
    case 'sigil': {
      const c = add(add(J.chest, J.chestA, -16), J.chestA - 90, 12), rot = r1(t * 30);
      const ticks = [...Array(12)].map((_, i) => { const a = i * 30; return `M${pt(add([0, 0], a, 30))}L${pt(add([0, 0], a, 35))}`; }).join('');
      const runes = [...Array(6)].map((_, i) => { const p = add([0, 0], i * 60 + 15, 24); return `<path d="M${r1(p[0] - 2.5)},${r1(p[1] - 3)} l5,3 -5,3" fill="none" stroke="#36d6a8" stroke-width="1.6"/>`; }).join('');
      return `<g transform="translate(${pt(c)})"><circle r="38" fill="#36d6a8" opacity=".08"/><g transform="rotate(${rot})"><circle r="35" fill="none" stroke="#36d6a8" stroke-width="2.4"/><circle r="28" fill="none" stroke="#36d6a8" stroke-width="1.4" stroke-dasharray="4 3"/><path d="${ticks}" stroke="#36d6a8" stroke-width="2"/>${runes}</g><g transform="rotate(${-rot * 1.5})"><path d="M0,-18 L15.6,9 L-15.6,9Z M0,18 L15.6,-9 L-15.6,-9Z" fill="none" stroke="#7ff0d0" stroke-width="1.4"/></g></g>`;
    }
    case 'wings': {
      const f = Math.sin(t * 3) * 10, base = add(J.chest, J.chestA, -10);
      const wing = (s, op) => `<g transform="translate(${pt(base)}) rotate(${r1(-20 + f * s)})" opacity="${op}"><path d="M0,0 Q-36,-40 -62,-26 Q-46,-18 -54,-6 Q-38,-8 -40,4 Q-22,-2 0,6Z" fill="#f4f1ea" stroke="${OL}" stroke-width="2.6" stroke-linejoin="round"/><path d="M-6,0 Q-30,-24 -52,-22 M-6,3 Q-28,-8 -44,-4" fill="none" stroke="#d4a83a" stroke-width="1.8"/><path d="M0,0 Q-36,-40 -62,-26" fill="none" stroke="#d4a83a" stroke-width="2"/></g>`;
      return wing(0.6, 0.7) + wing(1, 1);
    }
    case 'scarf': {
      const n = J.neck, w = (k) => Math.sin(t * 4 + k) * 4;
      const tail = (dy, k) => taper([[n[0] - 2, n[1] + 3], [n[0] - 18, n[1] + 5 + dy + w(k)], [n[0] - 36, n[1] + 3 + dy * 1.6 + w(k + 1)]], [5.4, 4.6, 3]);
      return part(tail(2, 0), '#c4501a', 2.6) + part(tail(10, 1.2), '#ff8a2b', 2.6);
    }
    default: return '';
  }
}
// Auras that glow are blended with "screen"; smoke stays a normal (dark) layer.
const AURA_GLOW = { bubbles: 1, leaves: 1, wisps: 1, embers: 1, flies: 1, echo: 1, storm: 1 };
function auraSVG(id, cx, cy, t) {
  switch (id) {
    case 'bubbles': return [0, 1, 2, 3, 4].map((i) => {
      const k = (t * 0.35 + i / 5) % 1, x = cx + Math.sin(i * 2.4 + t) * 42, y = 220 - k * 170;
      return `<circle cx="${r1(x)}" cy="${r1(y)}" r="${r1(3 + (i % 3) * 1.6)}" fill="none" stroke="#7fd3ff" stroke-width="1.6" opacity="${r1(0.9 - k * 0.8)}"/>`;
    }).join('');
    case 'leaves': return [0, 1, 2, 3, 4, 5].map((i) => {
      const a = t * 1.4 + i * 1.05, x = cx + Math.cos(a) * 50, y = cy + Math.sin(a) * 16 - 20 + Math.sin(t * 2 + i) * 18, rot = r1(a / D2R * 2);
      return `<path transform="translate(${r1(x)},${r1(y)}) rotate(${rot})" d="M-6,0 Q0,-5 6,0 Q0,5 -6,0Z M-6,0 H6" fill="${i % 2 ? '#7fd36a' : '#ff9a4d'}" stroke="#2c5a1e" stroke-width=".8" opacity="${Math.sin(a) > 0 ? 0.95 : 0.6}"/>`;
    }).join('');
    case 'wisps': return [0, 1, 2, 3].map((i) => {
      const a = t * 0.9 + i * Math.PI / 2, x = cx + Math.cos(a) * 46, y = cy + Math.sin(a) * 26 - 10, f = Math.sin(t * 9 + i) * 2;
      return `<path transform="translate(${r1(x)},${r1(y)})" d="M0,8 Q-7,2 -3,-4 Q0,-8 ${r1(1 + f)},-16 Q5,-6 6,0 Q6,7 0,8Z" fill="#9b6bff" opacity=".8"/><circle cx="${r1(x)}" cy="${r1(y + 2)}" r="2.6" fill="#e8dcff"/>`;
    }).join('');
    case 'embers': {
      const tongue = (dx, h, w, k) => { const f = Math.sin(t * 8 + k) * 5, x = cx + dx, top = 214 - h;
        return `M${r1(x - w)},214 Q${r1(x - w * 0.9)},${r1(top + h * 0.45)} ${r1(x + f * 0.6)},${r1(top + f)} Q${r1(x + w * 0.9)},${r1(top + h * 0.45)} ${r1(x + w)},214Z`; };
      return `<path d="${tongue(-26, 110, 18, 1)}${tongue(26, 120, 18, 2)}${tongue(0, 160, 26, 3)}" fill="#ffb21f" opacity=".45"/>`
        + `<path d="${tongue(-22, 80, 10, 4)}${tongue(22, 90, 10, 5)}${tongue(0, 120, 15, 6)}" fill="#fff0a0" opacity=".55"/>`
        + [0, 1, 2, 3].map((i) => { const k = (t * 0.6 + i / 4) % 1; return `<circle cx="${r1(cx - 30 + i * 20 + Math.sin(t * 3 + i) * 6)}" cy="${r1(200 - k * 150)}" r="2.2" fill="#fff0a0" opacity="${r1(1 - k)}"/>`; }).join('');
    }
    case 'smoke': return [0, 1, 2, 3, 4, 5].map((i) => {
      const k = (t * 0.25 + i / 6) % 1, x = cx - 30 + (i % 3) * 30 + Math.sin(t + i) * 8, y = 222 - k * 150, r = 8 + k * 16;
      return `<circle cx="${r1(x)}" cy="${r1(y)}" r="${r1(r)}" fill="${i % 2 ? '#123a33' : '#1d4d44'}" opacity="${r1((1 - k) * 0.55)}"/><circle cx="${r1(x + 3)}" cy="${r1(y - 3)}" r="${r1(r * 0.35)}" fill="#36d6a8" opacity="${r1((1 - k) * 0.35)}"/>`;
    }).join('');
    case 'flies': return [0, 1, 2, 3, 4, 5, 6].map((i) => {
      const x = cx + Math.sin(t * 0.7 + i * 2.1) * 56, y = cy - 10 + Math.cos(t * 0.9 + i * 1.3) * 60, on = Math.sin(t * 3 + i * 1.7) > -0.2;
      return on ? `<circle cx="${r1(x)}" cy="${r1(y)}" r="5" fill="#d8ff6a" opacity=".25"/><circle cx="${r1(x)}" cy="${r1(y)}" r="2" fill="#f4ffb0"/>` : '';
    }).join('');
    case 'echo': {
      // the Echo: a tall spirit figure standing just behind you
      const gx = cx - 42, gy = 196 + Math.sin(t * 1.4) * 5;
      const fig = `M${gx},${gy - 92} Q${gx - 2},${gy - 70} ${gx + 1},${gy - 44} M${gx - 2},${gy - 86} Q${gx + 14},${gy - 70} ${gx + 22},${gy - 80} M${gx - 2},${gy - 84} Q${gx - 18},${gy - 66} ${gx - 6},${gy - 58} M${gx + 1},${gy - 44} L${gx - 12},${gy} M${gx + 1},${gy - 44} L${gx + 14},${gy - 2}`;
      return `<g opacity=".8"><path d="${fig}" fill="none" stroke="#ef7cff" stroke-width="15" stroke-linecap="round" opacity=".25"/><path d="${fig}" fill="none" stroke="#ef7cff" stroke-width="8" stroke-linecap="round" opacity=".55"/><circle cx="${gx}" cy="${gy - 112}" r="19" fill="#ef7cff" opacity=".5"/><circle cx="${gx}" cy="${gy - 112}" r="14" fill="none" stroke="#ffd6ff" stroke-width="2" opacity=".7"/><path d="M${gx + 3},${gy - 114} h10" stroke="#fff" stroke-width="2.4" stroke-linecap="round"/></g>`;
    }
    case 'storm': {
      const on = Math.sin(t * 9) > 0.55, X = (d) => r1(cx + d), Y = (d) => r1(cy + d);
      return `<ellipse cx="${r1(cx)}" cy="${r1(cy)}" rx="58" ry="84" fill="#ff3fb4" opacity="${r1(0.1 + Math.sin(t * 2) * 0.04)}"/><ellipse cx="${r1(cx)}" cy="${r1(cy)}" rx="40" ry="66" fill="#8b7bff" opacity=".12"/>`
        + (on ? `<path d="M${X(-48)},${Y(-40)} l12,14 -7,4 13,16 M${X(50)},${Y(-20)} l-10,12 7,3 -12,16" fill="none" stroke="#ffd0ee" stroke-width="2.4" stroke-linejoin="round"/>` : '');
    }
    default: return '';
  }
}

/* ================================================================ animation */
// Every <svg class="avatar" data-av="battle|auto|preview"> on screen is animated (~30 fps).
const AVS = new WeakMap();
function basePose(el) {
  const A = avState(), ctx = el.dataset.av;
  if (ctx === 'preview') return el.dataset.pose || A.stance;
  if (ctx === 'battle') return S.combat.zone != null ? 'guard' : A.stance;
  if (ctx === 'enemy') return 'guard';
  if (S.action) return S.action.skill === 'fishing' ? 'fish' : S.action.skill === 'cooking' ? 'cook' : A.stance;
  return A.stance;
}
function avAnim(el) {
  let st = AVS.get(el);
  if (!st) {
    const p = POSES[basePose(el)] || POSES.relaxed;
    st = { from: p, to: p, cur: p, t0: 0, dur: 1, easing: 'io', seq: [], cut: false };
    AVS.set(el, st);
  }
  return st;
}
// Play a list of [pose, ms, easing] steps, then return to the base pose.
function avPlay(el, steps) { if (!el) return; const st = avAnim(el); st.seq = steps.slice(); st.cut = true; }
let avLast = 0;
const avCalm = () => typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
function avFrame(now) {
  requestAnimationFrame(avFrame);
  if (now - avLast < 33 || !S || document.hidden) return;
  avLast = now;
  const els = document.querySelectorAll('svg.avatar[data-av]');
  if (!els.length) return;
  const calm = avCalm(), A = avState(), t = calm ? 0.6 : now / 1000;
  for (const el of els) {
    const st = avAnim(el);
    if (st.cut || now - st.t0 >= st.dur) {
      const nx = st.seq.shift();
      if (nx) Object.assign(st, { from: st.cur, to: POSES[nx[0]], t0: now, dur: nx[1], easing: nx[2] || 'io' });
      else {
        const want = POSES[basePose(el)] || POSES.relaxed;
        if (want !== st.to) Object.assign(st, { from: st.cur, to: want, t0: now, dur: 380, easing: 'io' });
      }
      st.cut = false;
    }
    const k = Math.min(1, (now - st.t0) / st.dur);
    const P = lerpPose(st.from, st.to, ease[st.easing](k));
    st.cur = P;
    // breathing: the chest rises, the head and arms follow a little behind
    const br = calm ? 0 : Math.sin(t * 2.2);
    const Pd = Object.assign({}, P, { t2: P.t2 + br * 1.6, n: P.n - br * 1.2, aF: [P.aF[0] + br * 1.4, P.aF[1]], aB: [P.aB[0] - br * 1.4, P.aB[1]] });
    if (P.air) Pd.air = P.air + Math.sin(t * 1.6) * 4;
    if (st.look === undefined) st.look = el.dataset.over ? JSON.parse(el.dataset.over) : null;
    const look = st.look ? Object.assign({}, A, st.look) : A;
    const weapon = el.dataset.weapon !== undefined ? el.dataset.weapon : undefined;
    el.innerHTML = avWrap(drawAvatar(look, Pd, t, { weapon }), el.dataset.flip);
  }
}
requestAnimationFrame(avFrame);

// Public: an avatar <svg>. opts: { ctx: 'battle'|'auto'|'preview', pose, still, cls }. over: { slot: id } for previews.
// Mirror a drawing so the figure faces left (around the centre of the 200-wide rig).
const avWrap = (svg, flip) => (flip ? `<g transform="translate(200,0) scale(-1,1)">${svg}</g>` : svg);
function avatarSVG(over, opts) {
  opts = opts || {};
  const A = Object.assign({}, avState(), over || {});
  const fighting = opts.ctx === 'enemy' || (opts.ctx === 'battle' && S.combat.zone != null);
  const pose = POSES[opts.pose || (fighting ? 'guard' : A.stance)] || POSES.relaxed;
  // other figures (foes) carry their own look, weapon and facing on the element
  const own = over && opts.ctx === 'enemy' ? ` data-over="${esc(JSON.stringify(over))}"` : '';
  const extra = `${own}${opts.flip ? ' data-flip="1"' : ''}${opts.weapon !== undefined ? ` data-weapon="${opts.weapon}"` : ''}`;
  const anim = opts.still ? '' : `data-av="${opts.ctx || 'auto'}"${opts.pose ? ` data-pose="${opts.pose}"` : ''}${extra}`;
  return `<svg class="avatar ${opts.cls || ''}" viewBox="22 18 156 218" aria-hidden="true" ${anim}>${avWrap(drawAvatar(A, pose, 0.6, { weapon: opts.weapon }), opts.flip)}</svg>`;
}
const ATTACKS = [
  [['windup', 110, 'out'], ['strike', 90, 'back'], ['strike', 120], ['guard', 260]],
  [['coil', 110, 'out'], ['thrust', 80, 'back'], ['thrust', 130], ['guard', 260]],
  [['chamber', 120, 'out'], ['kick', 90, 'back'], ['kick', 130], ['guard', 300]],
];
let atkN = 0;
const nextAttack = () => ATTACKS[[0, 1, 0, 2][atkN++ % 4]];
const playerAv = () => document.querySelector('[data-portrait="player"] svg.avatar');
on('hit', (d) => {
  if (d.target === 'enemy') avPlay(playerAv(), nextAttack());
  else if (!d.dodge) avPlay(playerAv(), [['hurt', 90, 'out'], ['hurt', 160], ['guard', 320]]);
});
on('kill', () => avPlay(playerAv(), [['victory', 240, 'back'], ['victory', 420], ['guard', 380, 'out']]));

/* ================================================================ view */
let avSlot = 'build', avPreview = '';
const PREVIEWS = [['', 'Stance'], ['guard', 'Guard'], ['strike', 'Attack'], ['victory', 'Victory'], ['hurt', 'Hurt'], ['fish', 'Fishing'], ['cook', 'Cooking']];
function avatarHTML() {
  const A = avState();
  return `
  ${ptitle('Hero', 'Avatar', heroTabs('avatar'))}
  <div class="av-layout">
    <section class="win av-stage">
      <div class="av-floor" style="--ink:${cosOf('color', A.color).ink}">${avatarSVG(null, { ctx: 'preview', pose: avPreview || undefined, cls: 'big' })}</div>
      <nav class="av-poses">${PREVIEWS.map(([k, l]) => `<button class="${avPreview === k ? 'on' : ''}" data-avpose="${k}">${l}</button>`).join('')}</nav>
      <div class="av-worn">${COS_SLOTS.map(([s, l]) => `<button class="${s === avSlot ? 'on' : ''}" data-avslot="${s}"><small>${l}</small><b class="r${cosOf(s, A[s]).r}">${esc(cosOf(s, A[s]).name)}</b></button>`).join('')}</div>
      <div class="av-foot"><span class="muted small">${cosCount()} / ${cosTotal()} found · only for looks, each earned from a feat</span>${gbtn('Random look', 'star', 'data-avrandom', 'dark')}</div>
    </section>
    <section class="win av-pick">
      <nav class="seg av-tabs">${COS_SLOTS.map(([s, l]) => `<button class="${s === avSlot ? 'on' : ''}" data-avslot="${s}">${l}<em>${COSMETICS[s].filter((c) => cosOwned(s, c)).length}/${COSMETICS[s].length}</em></button>`).join('')}</nav>
      <div class="av-grid">${COSMETICS[avSlot].map((c) => {
        const own = cosOwned(avSlot, c), on = A[avSlot] === c.id;
        const pose = avSlot === 'stance' ? c.id : undefined;
        const tint = cosOf('color', avSlot === 'color' ? c.id : A.color).ink;
        return `<button class="av-card r${c.r} ${on ? 'on' : ''} ${own ? '' : 'locked'}" style="--ink:${tint}" ${own ? `data-cos="${avSlot}:${c.id}"` : ''} title="${esc(own ? c.name : c.hint || '')}">
          <span class="av-mini">${avatarSVG({ [avSlot]: c.id }, { still: true, pose, cls: own ? '' : 'dim' })}</span>
          <span class="av-rar">${COS_RARITY[c.r]}</span>${c.w && REALMS[c.w] ? `<span class="av-world" style="--wc:${REALMS[c.w].color}">${ic('realm', c.w)}${esc(REALMS[c.w].name)}</span>` : '<span class="av-world free">Basic</span>'}
          <b>${esc(c.name)}</b><small>${on ? `${ui('check')} Worn` : own ? 'Click to wear' : `${ui('lock')} ${esc(c.hint)}`}</small></button>`;
      }).join('')}</div>
    </section>
  </div>`;
}

/* ================================================================ input + announcements */
document.addEventListener('click', (ev) => {
  const t = ev.target.closest('[data-avslot], [data-cos], [data-avpose], [data-avrandom]');
  if (!t) return;
  const A = avState();
  if (t.dataset.avslot) avSlot = t.dataset.avslot;
  else if (t.dataset.cos) { const [s, id] = t.dataset.cos.split(':'); A[s] = id; }
  else if ('avpose' in t.dataset) {
    avPreview = t.dataset.avpose;
    if (avPreview === 'strike') { avPreview = 'guard'; setTimeout(() => avPlay(document.querySelector('.av-floor svg.avatar'), ATTACKS[0].concat(ATTACKS[1], ATTACKS[2])), 80); }
  } else if ('avrandom' in t.dataset) {
    for (const [s] of COS_SLOTS) {
      if (s === 'build') continue;
      const own = COSMETICS[s].filter((c) => cosOwned(s, c));
      A[s] = own[Math.floor(Math.random() * own.length)].id;
    }
  }
  dirty = true;
});
let lastCosPoll = 0;
UPD.push(() => {
  const now = performance.now();
  if (now - lastCosPoll < 1000 || !S) return;
  lastCosPoll = now;
  const quiet = !avState().seeded;   // first check on a save: older feats unlock silently
  const fresh = checkCosmetics();
  S.avatar.seeded = 1;
  for (const [s] of COS_SLOTS) if (!cosOwned(s, cosOf(s, S.avatar[s]))) S.avatar[s] = COSMETICS[s][0].id;
  if (quiet || !avatarOn()) return;
  for (const [s, c] of fresh) toast(`New cosmetic: ${c.name} (${COS_SLOTS.find((x) => x[0] === s)[1]}). Wear it in Bank → Avatar.`, 'rare');
  if (fresh.length && S.ui.view === 'hero:avatar') dirty = true;
});
