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
  // Hair: each style has its own colour, drawn as a spiky silhouette on the head.
  hair: [
    { id: 'tuft', name: 'Messy Black', r: 1, need: FREE },
    { id: 'none', name: 'Shaved', r: 1, need: FREE },
    C('mop',    'Sea-Salt Mop',    'seas',    2, LV('fishing', 10)),
    C('spikes', 'Swept Spikes',    'shinobi', 2, LV('chakra', 10)),
    C('ember',  'Ember Crest',     'soul',    3, LV('harvest', 10)),
    C('flame',  'Ascended Flame',  'ki',      5, LV('gravity', 40)),
    C('frost',  'Frost Tousle',    'hex',     3, LV('exorcism', 10)),
    C('wild',   'Wild Broom',      'hunter',  3, LV('tracking', 10)),
    C('swept',  'Slicked Back',    'echo',    3, LV('archaeology', 10)),
    C('crest',  'Rift Crest',      'rift',    5, KILLS('tear', 5)),
  ],
  // Outfits are worn over the limbs: a top with sleeves, trousers, shoes, a sash.
  outfit: [
    { id: 'tee', name: 'Traveler', r: 1, need: FREE },
    { id: 'none', name: 'Bare', r: 1, need: FREE },
    C('corsair',  'Corsair Vest',     'seas',    3, LV('voyaging', 10)),
    C('shinobi',  'Shinobi Track',    'shinobi', 3, KILLS('mist', 50)),
    C('reaper',   'Reaper Robes',     'soul',    3, KILLS('desert', 50)),
    C('gi',       'Training Gi',      'ki',      3, KILLS('canyon', 50)),
    C('uniform',  'Exorcist Uniform', 'hex',     3, KILLS('shrine', 50)),
    C('wilds',    'Wilds Gear',       'hunter',  3, KILLS('cliffs', 50)),
    C('longcoat', 'Chained Longcoat', 'echo',    4, KILLS('museum', 50)),
    C('riftwear', 'Rift Raiment',     'rift',    5, KILLS('tear', 25)),
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
    C('stitch',  'Stitched Cheek', 'seas',    2, KILLS('reef', 50)),
    C('patch',   'Eyepatch',       'seas',    3, LV('voyaging', 20)),
    C('shades',  'Capsule Shades', 'ki',      2, LV('tinkering', 10)),
    C('blindfold', 'Sealed Eyes',  'hex',     4, LV('exorcism', 35)),
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
const COS_SLOTS = [['build', 'Build'], ['style', 'Style'], ['stance', 'Stance'], ['color', 'Colour'], ['hair', 'Hair'], ['outfit', 'Outfit'], ['hat', 'Hat'], ['face', 'Face'], ['back', 'Back'], ['aura', 'Aura']];
const COS_RARITY = ['', 'Common', 'Uncommon', 'Rare', 'Epic', 'Legendary'];
const cosOf = (slot, id) => COSMETICS[slot].find((c) => c.id === id) || COSMETICS[slot][0];
const avatarOn = () => isUnlocked('feature:avatar');
function avState() {
  if (!S.avatar || typeof S.avatar !== 'object') S.avatar = {};
  const A = S.avatar;
  // v2 of the cosmetic list: re-check what this save has earned (quietly)
  if (!A.got || typeof A.got !== 'object' || A.gv !== 3) { A.got = {}; A.gv = 3; A.seeded = 0; }
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
  guard:    { t1: 158, t2: 12, n: -10, h: -10, aF: [46, 60],  aB: [34, 100],  lF: [44, -64], lB: [-40, -8],  fF: 0,  fB: -8, g: 26,   dy: 18 },
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
  const len = { ab: 22 * s, ch: 24 * s, nk: 6 * s, ua: 27 * s, fa: 25 * s, th: 34 * s, sh: 33 * s, ft: 13 * s };
  const pelvis = [100, 128 + P.dy];
  const waist = add(pelvis, P.t1, len.ab);
  const chestA = P.t1 + P.t2;
  const chest = add(waist, chestA, len.ch);
  const neckA = chestA + P.n;
  const shoulder = add(chest, chestA, -4 * s);
  const headR = 25 * B.head;   // chibi proportions: a big head
  const neck = add(chest, neckA, len.nk);
  const head = add(neck, neckA, headR - 4);
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
// Art direction for every accessory: a bold readable silhouette that hugs the
// skull (edges sit on the head outline, radius ~20.5), one ink outline, a base
// colour, one shadow tone and one highlight. No tiny details that vanish small.
const HO = `stroke="${OL}" stroke-width="2.2" stroke-linejoin="round" stroke-linecap="round"`;
const hl = (d, c, w) => `<path d="${d}" fill="none" stroke="${c}" stroke-width="${w || 2}" stroke-linecap="round" stroke-linejoin="round"/>`;
const LAUREL = (() => {
  let s = `<path d="M-19,-4 Q-25,2 -27,10 L-23,10 Q-21,4 -17,0Z M-19,-3 Q-22,6 -20,14 L-17,12 Q-18,6 -16,1Z" fill="#c99a2e" ${HO}/>`;
  s += hl('M-20.2,-2 A20,20 0 0,1 15.5,-12.5', OL, 4.6) + hl('M-20.2,-2 A20,20 0 0,1 15.5,-12.5', '#8a6a1c', 2.2);
  for (let i = 0; i < 8; i++) {
    const th = (200 + i * 17) * D2R, x = Math.cos(th) * 20, y = Math.sin(th) * 20;
    for (const side of [-1, 1]) {
      const rot = r1(th / D2R - 90 + side * 32);
      s += `<path d="M0,0 Q5.5,-3.6 11,0 Q5.5,3.6 0,0Z" transform="translate(${r1(x)},${r1(y)}) rotate(${rot})" fill="${side > 0 ? '#f0cf62' : '#d4a83a'}" stroke="${OL}" stroke-width="1.3" stroke-linejoin="round"/>`;
    }
  }
  return s;
})();
const HATS = {
  // Endless Blue
  bucket: `<path d="M-17,-8 Q-18,-28 0,-29 Q18,-28 17,-9 Q0,-14 -17,-8Z" fill="#c9a66b" ${HO}/>`
    + `<path d="M-16.6,-13 Q0,-19 16.8,-14 L17,-9 Q0,-14 -17,-8Z" fill="#3f6688" ${HO}/>`
    + hl('M-9,-24 Q-1,-27 7,-25.5', '#e6cb94', 2.4)
    + `<path d="M-28,-3 Q-20,-13 0,-13.5 Q20,-13 29,-4 Q30,0 25,0 Q12,-8 0,-8 Q-14,-8 -24,1 Q-29,0 -28,-3Z" fill="#b08e55" ${HO}/>`
    + hl('M-22,-4 Q-10,-10 0,-10.5', '#d4b47a', 1.8)
    + `<path d="M-10,-15 L-15,-24 L-7,-19Z" fill="#ff5d73" ${HO} stroke-width="1.4"/><circle cx="-10" cy="-15.5" r="2" fill="#f4c66a" stroke="${OL}" stroke-width="1.2"/>`,
  bandana: `<path d="M-19,-6 Q-29,-9 -35,-2 L-28,1 Q-25,-3 -19,-2Z M-19,-4 Q-27,3 -29,11 L-22,9 Q-21,3 -17,-1Z" fill="#a82a37" ${HO}/>`
    + `<path d="M-20.6,-1 A20.6,20.6 0 0,1 18.8,-8.5 Q2,-11.5 -20.6,-1Z" fill="#d8434f" ${HO}/>`
    + hl('M17,-8.8 Q2,-11.5 -19,-2.2', '#a82a37', 2.4)
    + `<g fill="#fff"><circle cx="-7" cy="-15" r="1.7"/><circle cx="3" cy="-17.5" r="1.7"/><circle cx="11" cy="-13.5" r="1.7"/><circle cx="-14" cy="-9" r="1.7"/></g>`
    + `<circle cx="-19.6" cy="-4" r="3.8" fill="#b8323f" ${HO}/>`,
  chef: `<g transform="rotate(-8 0 -14)"><g fill="${OL}"><circle cx="-9" cy="-32" r="11.2"/><circle cx="10" cy="-32" r="11.2"/><circle cx="0" cy="-39" r="13.2"/></g>`
    + `<g fill="#fff"><circle cx="-9" cy="-32" r="9"/><circle cx="10" cy="-32" r="9"/><circle cx="0" cy="-39" r="11"/></g>`
    + hl('M-13,-33 Q-12,-38 -7,-40 M2,-46 Q6,-46 8,-43', '#dfe4ee', 2.2)
    + `<path d="M-14.5,-13 L-15.5,-28 Q0,-31 15.5,-28 L14.5,-14 Q0,-17 -14.5,-13Z" fill="#fff" ${HO}/>`
    + hl('M-8,-26.5 V-16 M0,-27.5 V-16 M8,-26.5 V-16', '#c8cfdc', 1.6) + '</g>',
  tricorn: `<path d="M-14,-29 Q-28,-42 -38,-30 Q-28,-32 -22,-24Z" fill="#f2f2f2" ${HO}/>` + hl('M-16,-28 Q-26,-35 -33,-31', '#c8cfdc', 1.4)
    + `<path d="M-32,-13 Q-28,-20 -19,-18 Q-16,-36 1,-36 Q18,-36 21,-19 Q29,-21 34,-14 Q31,-8 23,-11 Q1,-19 -21,-9 Q-31,-7 -32,-13Z" fill="#1f2738" ${HO}/>`
    + hl('M-18,-19 Q1,-24 20,-19', '#121722', 3)
    + hl('M-29,-12.5 Q-26,-16 -20,-14.2 Q1,-21 23,-14 Q28,-16 31,-13.5', '#f4c66a', 2)
    + hl('M-9,-31 Q0,-33.5 8,-32', '#3c4864', 2.2)
    + `<circle cx="7" cy="-24" r="4.4" fill="#f4c66a" ${HO} stroke-width="1.6"/><circle cx="7" cy="-24" r="1.8" fill="#8e2433"/>`,
  // Shinobi Lands
  hood: `<path d="M-19,-8 Q-30,-13 -43,-7 L-41,-1 Q-30,-6 -19,-3Z M-19,-5 Q-28,0 -37,9 L-32,12 Q-25,3 -18,-1Z" fill="#2f3a55" ${HO}/>`
    + `<path d="M-20.4,-7 Q-2,-19.5 19.6,-11.5 L20.5,-3.5 Q0,-10.5 -20.5,1Z" fill="#2f3a55" ${HO}/>`
    + hl('M-19,-1 Q0,-9 19,-4.6', '#1e2638', 2)
    + `<g transform="rotate(-14 11 -10)"><rect x="3.5" y="-15.5" width="15" height="10" rx="2.2" fill="#c7cfdd" ${HO} stroke-width="1.8"/>`
    + hl('M5.8,-13.6 H16', '#fff', 1.4) + hl('M7,-8.6 Q11,-12.6 15,-8.6', '#56627a', 1.8) + '</g>',
  // Soul Afterlands
  horns: `<path d="M4,-18 C7,-26 7,-34 15,-41 C15,-31 15,-23 13,-14Z" fill="#b9ae96" ${HO}/>`
    + `<path d="M-13,-13 C-17,-24 -15,-35 -24,-45 C-9,-39 -2,-29 -2,-19Z" fill="#efe8d6" ${HO}/>`
    + hl('M-13.6,-23 L-5.4,-24.6 M-16,-30.5 L-8.6,-32.4 M-19.2,-37.6 L-13.4,-39', '#b8ad95', 1.6) + hl('M7,-25 L13,-25 M9,-32 L14.4,-32.4', '#968b74', 1.4)
    + hl('M-9,-18 Q-11,-28 -17,-37', '#fff', 1.4),
  // Ki Frontier
  martial: `<path d="M-19,-6 C-30,-11 -38,-2 -51,-8 L-49,-1 C-38,4 -30,-4 -19,-2Z M-19,-4 C-27,4 -32,12 -45,12 L-41,18 C-30,17 -25,6 -18,0Z" fill="#e8443a" ${HO}/>`
    + `<path d="M-20.4,-6 Q-2,-17.5 19.7,-10.5 L20.4,-4 Q0,-10 -20.5,0Z" fill="#e8443a" ${HO}/>`
    + hl('M-19,-0.6 Q0,-9 19.5,-4.6', '#b02a22', 2) + hl('M-12,-11 Q0,-15 10,-13', '#ff8a7a', 1.6)
    + `<circle cx="-19.6" cy="-3" r="3.8" fill="#c22f27" ${HO}/>`,
  // Hexbound City
  talisman: hl('M-20.4,-5 Q0,-18 19.6,-9', OL, 4.4) + hl('M-20.4,-5 Q0,-18 19.6,-9', '#c0392b', 2)
    + `<g transform="rotate(-6 12 -14)"><path d="M5.5,-21 H18.5 V11 L15.3,8.6 L12,11 L8.7,8.6 L5.5,11Z" fill="#f3e2a0" ${HO} stroke-width="1.8"/>`
    + hl('M12,-15.5 V-8 M8.5,-12 H15.5 M9,-4.5 Q12,-1.5 15,-4.5 M12,-2.5 V5 M9.5,3 H14.5', '#c0392b', 1.8)
    + `<circle cx="12" cy="-18.5" r="1.8" fill="#c0392b"/></g>`,
  // Hunter's Wilds
  beast: `<path d="M3,-19 L9,-39 L17,-15Z" fill="#6e4520" ${HO}/>`
    + `<path d="M-21,11 Q-25,-21 0,-22.6 Q18,-22.4 21,-8 Q10,-13.5 -1,-11.5 Q-13,-6 -12,13Z" fill="#8a5a2f" ${HO}/>`
    + `<path d="M-13,-18 L-17,-40 L-1,-23Z" fill="#8a5a2f" ${HO}/><path d="M-12,-21.5 L-14.4,-34 L-5,-23.5Z" fill="#e0a07a"/>`
    + hl('M-15,-12 Q-15,-19 -5,-20.5', '#b07a44', 2.4)
    + `<path d="M19,-8.4 L17.3,-3 L15,-8.8Z M12.5,-10.6 L11.2,-5 L8.6,-10.6Z M5.5,-11.6 L4.6,-6.2 L1.8,-11.2Z" fill="#fff" ${HO} stroke-width="1.2"/>`,
  // Echo Quarter
  laurel: LAUREL,
  // The Rift
  crown: `<g transform="rotate(-8 0 -20)">`
    + `<path d="M-15,-13 L-18.5,-36 L-9,-26 L0,-41 L9,-26 L18.5,-36 L15,-13 Q0,-17 -15,-13Z" fill="#f4c66a" ${HO}/>`
    + `<path d="M-14.6,-17 Q0,-21 14.6,-17 L15,-13 Q0,-17 -15,-13Z" fill="#c9952e"/>` + hl('M-11.5,-25 L-14,-31 M3,-33 L1,-36', '#fff3c4', 1.8)
    + `<circle cx="0" cy="-22" r="3.6" fill="#ff3fb4" ${HO} stroke-width="1.4"/><circle cx="-1" cy="-23" r="1.1" fill="#ffd0ee"/>`
    + `<g fill="#ffd0ee" stroke="${OL}" stroke-width="1.2"><circle cx="-18.5" cy="-36" r="2.4"/><circle cx="0" cy="-41" r="2.6"/><circle cx="18.5" cy="-36" r="2.4"/></g></g>`,
};
function faceSVG(face, expr, eye) {
  if (face === 'blank') return '';
  const E = eye || OL, e = `fill="${E}"`, st = `stroke="${E}" stroke-width="2.2" stroke-linecap="round" fill="none"`;
  const scar = face === 'scar' ? `<path d="M13,-12 L18,1" stroke="#ff4d5e" stroke-width="2.2" stroke-linecap="round"/>` : '';
  const plain = ['dots', 'smile', 'fierce', 'scar', 'stitch'].includes(face);
  if (expr === 'hurt' && plain) return `<path d="M1,-5 l5,3 -5,3 M16,-5 l-5,3 5,3" ${st}/><path d="M5,9 Q9,6 13,9" ${st}/>` + scar;
  if (expr === 'happy' && plain) return `<path d="M1,-1 Q4,-6 7,-1 M10,-1 Q13,-6 16,-1" ${st}/><path d="M4,6 Q9.5,13 15,5" ${st}/>` + scar;
  const eyes = `<ellipse cx="4" cy="-2" rx="2" ry="3" ${e}/><ellipse cx="13" cy="-2" rx="2.3" ry="3.2" ${e}/>`;
  switch (face) {
    case 'smile': return eyes + `<path d="M4,6 Q9.5,12 15,5" ${st}/>`;
    case 'fierce': return `<path d="M0,-9 L7,-5 M17,-9 L11,-5" ${st}/><ellipse cx="4" cy="-1" rx="2" ry="2.4" ${e}/><ellipse cx="13" cy="-1" rx="2.2" ry="2.6" ${e}/><path d="M5,8 H14" ${st}/>`;
    case 'scar': return eyes + scar + `<path d="M6,7 H12" ${st}/>`;
    case 'stitch': return eyes + `<path d="M9,5.5 Q12.5,7.5 16.5,5" fill="none" stroke="${OL}" stroke-width="1.6" stroke-linecap="round"/><path d="M10.5,3.8 l0.6,3.4 M13,4.6 l0,3.4 M15.4,3.6 l-0.4,3.4" stroke="${OL}" stroke-width="1.3" stroke-linecap="round"/>`;
    case 'shades': return `<path d="M-2,-6.5 H20 L19,-1 Q15,3 11,-0.5 L10,-4 L9,-0.5 Q4.5,3 0.5,-0.5Z" fill="#15161b" stroke="${OL}" stroke-width="1.4" stroke-linejoin="round"/><path d="M2.5,-4.6 l3,0 M12.5,-4.6 l3,0" stroke="#6a7389" stroke-width="1.6" stroke-linecap="round"/><path d="M6,9 Q10,11 14,8" ${st}/>`;
    case 'blindfold': return `<path d="M-19.4,-6.5 Q0,-13 19.8,-8 L20.2,1 Q0,-4 -19.5,2Z" fill="#15161b" stroke="${OL}" stroke-width="2" stroke-linejoin="round"/><path d="M-17,-2 Q0,-8 18,-3.5" fill="none" stroke="#2c2f3a" stroke-width="1.6"/>`;
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
  flat:   (ink) => ({ body: ink, far: shade(ink, -0.22), rim: OL, rw: 2.5, eye: OL }),
  ink:    (ink) => ({ body: '#0d0f14', far: '#1c2029', rim: '#f2f4f8', rw: 1.8, eye: ink }),
  neon:   (ink) => ({ body: '#06070b', far: '#06070b', rim: ink, rw: 1.9, eye: ink, filter: 'avNeon' }),
  sketch: () => ({ body: '#ebe6da', far: '#c4bdae', rim: '#1d1d1f', rw: 1.4, eye: '#1d1d1f', filter: 'avSketch' }),
};
// A thick limb bending smoothly through its middle joint (a "noodle" limb), with a rim.
function curvy(a, j, b) { const c = [2 * j[0] - (a[0] + b[0]) / 2, 2 * j[1] - (a[1] + b[1]) / 2]; return `M${pt(a)}Q${pt(c)} ${pt(b)}`; }
const stroke = (d, w, col, rim, rw) => `<path d="${d}" fill="none" stroke="${rim}" stroke-width="${r1(w + rw * 2)}" stroke-linecap="round" stroke-linejoin="round"/><path d="${d}" fill="none" stroke="${col}" stroke-width="${r1(w)}" stroke-linecap="round" stroke-linejoin="round"/>`;

// A sub-curve of curvy() from parameter t0 to the end (de Casteljau split).
function curvyFrom(a, j, b, t0) {
  const c = [2 * j[0] - (a[0] + b[0]) / 2, 2 * j[1] - (a[1] + b[1]) / 2];
  const L = (p, q, k) => [p[0] + (q[0] - p[0]) * k, p[1] + (q[1] - p[1]) * k];
  const p0 = L(L(a, c, t0), L(c, b, t0), t0), p1 = L(c, b, t0);
  return `M${pt(p0)}Q${pt(p1)} ${pt(b)}`;
}
// Local frame at a point on the torso: +x forward (the way the figure faces), +y down the spine.
const frame = (J, p, inner) => `<g transform="translate(${pt(p)}) rotate(${r1(180 - J.chestA)})">${inner}</g>`;

/* ---------------------------------------------------------------- hair */
// Head-local polar point: 0° = forward (the face), -90° = straight up, -180° = back.
const HP = (a, r) => [Math.cos(a * D2R) * r, Math.sin(a * D2R) * r];
// sp: spikes from the forehead to the nape as [angle, length, half-width, lean].
// line: the hairline from the nape back to the forehead (it keeps the face clear).
const HAIR = {
  tuft:   { c: '#25262e', hi: '#4a4c5a', sp: [[-34, 7, 14, -8], [-62, 9, 14, -10], [-90, 10, 14, -12], [-118, 9, 14, -14], [-146, 8, 14, -14], [-176, 6, 14, -10]],
    line: 'Q-8,-2 0,-10 L4,-5 L7,-11 L11,-6 L13,-10' },
  mop:    { c: '#1d1e24', hi: '#3c3f4c', sp: [[-30, 5, 16, 0], [-62, 6, 16, -6], [-96, 6, 16, -8], [-130, 6, 16, -8], [-164, 5, 16, -6], [-192, 4, 12, 0]],
    line: 'Q-8,0 -1,-9 L3,-5 L6,-10 L10,-5 L13,-10 L16,-6' },
  spikes: { c: '#ffd23a', hi: '#fff0a0', sp: [[-30, 10, 12, -16], [-55, 15, 12, -22], [-82, 17, 12, -26], [-110, 16, 12, -28], [-138, 14, 12, -24], [-165, 11, 12, -18], [-190, 7, 10, -10]],
    line: 'Q-8,-2 -2,-10 L2,-3 L5,-10 L9,-2 L12,-10 L15,-4' },
  ember:  { c: '#ff8a2b', hi: '#ffc07a', sp: [[-28, 9, 12, 4], [-52, 12, 12, -12], [-78, 13, 12, -20], [-104, 13, 12, -24], [-130, 12, 12, -22], [-156, 10, 12, -18], [-184, 7, 12, -10]],
    line: 'Q-8,-2 -1,-10 L3,-4 L6,-10 L10,-4 L13,-10' },
  flame:  { c: '#ffcf3a', hi: '#fffbd0', glow: '#ffb21f', sp: [[-35, 14, 12, -25], [-60, 22, 12, -20], [-85, 30, 12, -6], [-108, 28, 12, 8], [-132, 24, 12, 16], [-158, 18, 12, 18], [-185, 10, 12, 10]],
    line: 'Q-8,-2 1,-10 L5,-3 L8,-11' },
  frost:  { c: '#eef0f6', hi: '#ffffff', sh: '#b9c0d0', sp: [[-40, 9, 13, -20], [-66, 13, 13, -14], [-92, 15, 13, -2], [-118, 14, 13, 10], [-145, 11, 13, 14], [-172, 7, 13, 8]],
    line: 'Q-8,-3 2,-11' },
  wild:   { c: '#2f8a3c', hi: '#7fd36a', sp: [[-45, 16, 10, -35], [-65, 24, 10, -22], [-85, 28, 10, -4], [-105, 27, 10, 12], [-125, 24, 10, 24], [-148, 18, 10, 30], [-172, 10, 10, 24]],
    line: 'Q-8,-3 2,-11' },
  swept:  { c: '#2b2340', hi: '#7a5fb0', sp: [[-30, 6, 16, -24], [-62, 9, 16, -30], [-96, 10, 16, -32], [-130, 9, 16, -30], [-164, 7, 16, -22]],
    line: 'Q-8,-3 2,-11' },
  crest:  { c: '#ff3fb4', hi: '#ffd0ee', sh: '#8b2bd6', sp: [[-40, 6, 12, -6], [-62, 14, 9, -10], [-84, 22, 9, -10], [-106, 24, 9, -8], [-130, 20, 9, -6], [-155, 13, 9, -4], [-185, 6, 12, 0]],
    line: 'Q-8,-3 2,-11' },
};
function hairSVG(id) {
  const h = HAIR[id];
  if (!h) return '';
  const R = 19.4, from = -25, to = -200, K = 1.3;   // K: spikes are drawn bold
  let d = `M${pt(HP(from, R))}`, prev = from;
  for (const [a, len, hw, lean] of h.sp) {
    const b0 = Math.min(prev, a + hw), b1 = a - hw;
    d += b0 < prev ? `A${R},${R} 0 0,0 ${pt(HP(b0, R))}` : `L${pt(HP(b0, R))}`;
    const tip = HP(a + lean, R + len * K);
    d += `Q${pt(HP(b0 + lean * 0.3, R + len * K * 0.5))} ${pt(tip)}Q${pt(HP(b1 + lean * 0.5, R + len * K * 0.45))} ${pt(HP(b1, R))}`;
    prev = b1;
  }
  if (prev > to) d += `A${R},${R} 0 0,0 ${pt(HP(to, R))}`;
  d += `${h.line}Z`;
  const glow = h.glow ? `<path d="${d}" fill="none" stroke="${h.glow}" stroke-width="9" opacity=".35" stroke-linejoin="round"/>` : '';
  const shadow = `<path d="M-17,6 Q-19,-6 -12,-13" fill="none" stroke="${h.sh || shade(h.c, -0.35)}" stroke-width="3.2" stroke-linecap="round"/>`;
  return glow + `<path d="${d}" fill="${h.c}" stroke="${OL}" stroke-width="2.4" stroke-linejoin="round"/>` + shadow
    + hl('M-9,-13 Q-1,-18.5 7,-15.5', h.hi, 2.4);
}

/* ---------------------------------------------------------------- outfits */
// top: c colour, sl sleeve length (0 none … 0.9 to the wrist), slc sleeve colour, wide (loose sleeves),
//      open (a vest showing the chest, 'skin' = body colour), v (inner V collar), collar 'high',
//      sh (shoulder band), zip / buttons / trim / chain details.
// bot: c colour, len (0.5 shorts, 1 full), wide (flare), cuff. skirt: coat length below the waist.
const OUTFITS = {
  tee:      { top: { c: '#59657a', sl: 0.36 }, bot: { c: '#2f3442', len: 1 }, shoe: '#22242c' },
  corsair:  { top: { c: '#d8343f', sl: 0.34, open: 'skin', trim: '#a8222d' }, bot: { c: '#3460c4', len: 0.5, cuff: '#e8e2d0' }, sash: '#f4c430', shoe: '#c9a66b' },
  shinobi:  { top: { c: '#ff8a1f', sl: 0.9, sh: '#22252e', zip: '#22252e', collar: 'high', cc: '#22252e' }, bot: { c: '#ff8a1f', len: 1, cuff: '#e8e6df' }, shoe: '#2f4a8a' },
  reaper:   { top: { c: '#1b1c22', sl: 0.66, wide: 1, v: '#f2f0ea' }, bot: { c: '#1b1c22', len: 1, wide: 1 }, sash: '#f2f0ea', shoe: '#f2f0ea' },
  gi:       { top: { c: '#ff7a1a', sl: 0.3, slc: '#2b4fb8', v: '#2b4fb8' }, bot: { c: '#ff7a1a', len: 1, wide: 0.5 }, sash: '#2b4fb8', wrist: '#2b4fb8', shoe: '#2b4fb8' },
  uniform:  { top: { c: '#1f2433', sl: 0.9, collar: 'high', buttons: '#f4c66a' }, bot: { c: '#1f2433', len: 1, wide: 0.4 }, skirt: 22, shoe: '#121418' },
  wilds:    { top: { c: '#3aa84a', sl: 0.3, v: '#2a7a35', trim: '#2a7a35' }, bot: { c: '#2f8a3c', len: 0.5 }, sash: '#8a5a2b', shoe: '#2f6a2c' },
  longcoat: { top: { c: '#1a1c26', sl: 0.9, collar: 'high', chain: '#f4c66a', trim: '#f4c66a' }, bot: { c: '#1a1c26', len: 1 }, skirt: 54, shoe: '#121418' },
  riftwear: { top: { c: '#2c1846', sl: 0.9, trim: '#ff3fb4', zip: '#ff3fb4', collar: 'high', cc: '#1a0f2a' }, bot: { c: '#2c1846', len: 1 }, sash: '#ff3fb4', wrist: '#ff3fb4', shoe: '#ff3fb4' },
};
// Points along the quadratic limb curve (same curve as curvy()) between t0 and t1.
function bez(L, t0, t1, n) {
  const [a, j, b] = L, c = [2 * j[0] - (a[0] + b[0]) / 2, 2 * j[1] - (a[1] + b[1]) / 2], out = [];
  n = n || 6;
  for (let i = 0; i <= n; i++) {
    const t = t0 + (t1 - t0) * i / n, u = 1 - t;
    out.push([u * u * a[0] + 2 * u * t * c[0] + t * t * b[0], u * u * a[1] + 2 * u * t * c[1] + t * t * b[1]]);
  }
  return out;
}
// Shift a polyline sideways (+d = towards the figure's front when the line runs up the spine).
function offsetPts(pts, d) {
  return pts.map((p, i) => {
    const a = pts[Math.max(0, i - 1)], b = pts[Math.min(pts.length - 1, i + 1)];
    const tx = b[0] - a[0], ty = b[1] - a[1], l = Math.hypot(tx, ty) || 1;
    return [p[0] - (ty / l) * d, p[1] + (tx / l) * d];
  });
}
const poly = (pts) => 'M' + pts.map(pt).join('L');
const lerpW = (n, w0, w1) => [...Array(n + 1)].map((_, i) => w0 + ((w1 - w0) * i) / n);
// A piece of cloth: a tapered shape along points with a thick ink outline.
// Dark cloth gets a lighter edge line so folds stay readable against the ink outline.
const lum = (hex) => { const n = parseInt(hex.slice(1), 16); return ((n >> 16) * 0.3 + ((n >> 8) & 255) * 0.59 + (n & 255) * 0.11) / 255; };
const cloth = (pts, w0, w1, col) => {
  const d = taper(pts, lerpW(pts.length - 1, w0, w1));
  return part(d, col, 4.6) + (col[0] === '#' && lum(col) < 0.2 && pts.length > 2 ? `<path d="${poly(offsetPts(pts, (w0 + w1) / 4 - 2.4))}" fill="none" stroke="${shade(col, 0.3)}" stroke-width="1.6" stroke-linecap="round" opacity=".9"/>` : '');
};
const inkLine = (d, w, col) => `<path d="${d}" fill="none" stroke="${OL}" stroke-width="${r1(w + 3)}" stroke-linecap="round" stroke-linejoin="round"/><path d="${d}" fill="none" stroke="${col}" stroke-width="${r1(w)}" stroke-linecap="round" stroke-linejoin="round"/>`;

/* ---------------------------------------------------------------- flame auras */
// A flickering flame silhouette around the body, in three layers (outer, mid, hot core).
function flameAura(cx, t, cols, o) {
  o = o || {};
  const base = 228, H = o.h || 186, w = o.w || 52, n = 13, out = [];
  [[1, 1, 0.3], [0.74, 0.84, 0.42], [0.46, 0.62, 0.5]].forEach(([kw, kh, op], li) => {
    const v = [];
    for (let i = 0; i <= n; i++) { const ph = Math.PI * (1 - i / n); v.push([cx + Math.cos(ph) * w * kw, base - H * kh * Math.pow(Math.sin(ph), 0.55)]); }
    let d = `M${pt(v[0])}`;
    for (let i = 0; i < n; i++) {
      const a = v[i], b = v[i + 1], m = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
      const ph = Math.PI * (1 - (i + 0.5) / n), s = Math.sin(ph);
      const L = (6 + 24 * s) * kh * (1 + 0.35 * Math.sin(t * 9 + i * 1.9 + li));
      const tip = [m[0] + Math.cos(ph) * L * 0.35 + Math.sin(t * 3 + i) * 2, m[1] - L];
      d += `Q${r1(a[0])},${r1(tip[1] + L * 0.6)} ${pt(tip)}Q${r1(b[0])},${r1(b[1] - L * 0.3)} ${pt(b)}`;
    }
    out.push(`<path d="${d}Z" fill="${cols[li]}" opacity="${op}"/>`);
  });
  return out.join('');
}
function bolts(cx, t, col) {
  if (Math.sin(t * 11) < 0.25) return '';
  const k = Math.floor(t * 5) % 3, z = (x, y, s) => `M${r1(x)},${r1(y)} l${6 * s},10 -5,3 ${7 * s},12 -4,2 ${5 * s},10`;
  const d = [z(cx - 44 + k * 6, 80 + k * 14, 1), z(cx + 40 - k * 4, 110 - k * 10, -1)].join('');
  return `<path d="${d}" fill="none" stroke="${col}" stroke-width="5" opacity=".35" stroke-linejoin="round"/><path d="${d}" fill="none" stroke="#fff" stroke-width="2" stroke-linejoin="round"/>`;
}

/* ---------------------------------------------------------------- the figure */
function drawAvatar(A, P, t, opt) {
  const B = cosOf('build', A.build).b, ink = A.ink || cosOf('color', A.color).ink;
  const St = STYLES[A.style] ? STYLES[A.style](ink) : STYLES.flat(ink);
  const J = solve(P, B), W = B.w, out = [];
  const LW = 12.5 * W, TW = 18 * W, armW = LW * 0.92, rw = St.rw;
  const cx = (J.pelvis[0] + J.chest[0]) / 2, cy = (J.pelvis[1] + J.chest[1]) / 2;
  const feetX = (J.lF[2][0] + J.lB[2][0]) / 2, air = P.air || 0, sp = P.t1, sway = Math.sin(t * 2.1);
  out.push(`<ellipse cx="${r1(feetX)}" cy="${GROUND + 1}" rx="${r1(34 - air * 0.5)}" ry="5.5" fill="#000" opacity="${r1(0.45 - air * 0.01)}"/>`);
  const aura = auraSVG(A.aura, cx, cy, t);
  if (aura) out.push(AURA_GLOW[A.aura] ? `<g style="mix-blend-mode:screen">${aura}</g>` : aura);
  // opt.weapon: an item id, '' for bare hands, or undefined for your equipped weapon
  const worn = opt.weapon !== undefined ? opt.weapon || null : S.equip && S.equip.weapon;
  const kind = worn && weaponKind(worn);
  const onHand = ['fist', 'claw'].includes(kind);
  const sheathed = worn && !onHand && (P.sh || P.prop) ? worn : null;
  // Gear in three layers: behind the body, worn over the torso, over the front arm.
  const G = gearSVG(A, J, P, t, B, { LW, TW, sheathed });
  const O = OUTFITS[A.outfit] || null, T = O && O.top, Bt = O && O.bot;
  const col = (v, far) => (v === 'skin' ? (far ? St.far : St.body) : far ? shade(v, -0.32) : v);
  const fig = [G.back];
  if (P.fx) fig.push(fxSVG(P.fx, J, worn ? RCOL[Math.min(6, typeof rarity === 'function' ? rarity(worn) : 1)] : ink));
  // 1. The bare body is one silhouette: every rim first, then every fill on top, so limbs,
  //    torso and head melt together with no seams. Far limbs are a shade darker (depth).
  const line = (d, w, c) => `<path d="${d}" fill="none" stroke="${c}" stroke-width="${r1(w)}" stroke-linecap="round" stroke-linejoin="round"/>`;
  const foot = (L) => `M${pt(L[2])}L${pt(L[3])}`;
  const parts = [[curvy(J.lB[0], J.lB[1], J.lB[2]), LW, St.far], [foot(J.lB), LW * 0.8, St.far], [curvy(J.aB[0], J.aB[1], J.aB[2]), armW, St.far],
    [curvy(J.pelvis, J.waist, J.neck), TW, St.body], [curvy(J.lF[0], J.lF[1], J.lF[2]), LW, St.body], [foot(J.lF), LW * 0.8, St.body]];
  const head = (r, c) => `<circle cx="${r1(J.head[0])}" cy="${r1(J.head[1])}" r="${r1(r)}" fill="${c}"/>`;
  fig.push(parts.map(([d, w]) => line(d, w + rw * 2, St.rim)).join('') + head(J.headR + rw, St.rim));
  fig.push(parts.map(([d, w, c]) => line(d, w, c)).join('') + head(J.headR, St.body));
  const hand = (p, far) => `<circle cx="${r1(p[0])}" cy="${r1(p[1])}" r="${r1(LW * 0.62)}" fill="${far ? St.far : St.body}" stroke="${St.rim}" stroke-width="${r1(rw * 2)}"/>`;
  // 2. Clothes, back to front: far shoe, trouser leg, sleeve and hand, then the near leg, then the torso.
  const shoe = (L, far) => (O && O.shoe ? cloth([bez(L, 0.92, 0.92, 1)[0], L[2], L[3]], LW * 0.95, LW * 0.8, col(O.shoe, far)) : '');
  const leg = (L, far) => {
    if (!Bt) return '';
    const w1 = Bt.wide ? LW + 5 + 9 * Bt.wide : LW + 4.5;
    let s = cloth(bez(L, 0, Bt.len, 6), LW + 5.5, w1, col(Bt.c, far));
    if (Bt.cuff) s += cloth(bez(L, Bt.len - 0.07, Bt.len, 2), w1 + 1, w1 + 2, col(Bt.cuff, far));
    return s;
  };
  const sleeve = (Ar, far) => {
    let s = '';
    if (T && T.sl) {
      const w1 = T.wide ? armW + 11 : armW + 4.5;
      s += cloth(bez(Ar, 0, T.sl, 6), armW + 5.5, w1, col(T.slc || T.c, far));
      if (T.trim && T.sl < 0.5) s += cloth(bez(Ar, T.sl - 0.05, T.sl, 2), w1 + 0.5, w1 + 1, col(T.trim, far));
    }
    if (O && O.wrist) s += cloth(bez(Ar, 0.76, 0.9, 2), armW + 3.5, armW + 3.5, col(O.wrist, far));
    return s;
  };
  fig.push(shoe(J.lB, true) + leg(J.lB, true) + sleeve(J.aB, true) + hand(J.aB[2], true));
  fig.push(shoe(J.lF, false) + leg(J.lF, false));
  if (O) fig.push(torsoCloth(O, J, B, TW, sp, sway, St));
  fig.push(G.under);
  // 3. The near arm over the torso (its outline starts below the shoulder: no seam on bare skin).
  const arm = J.aF;
  fig.push(line(curvyFrom(...arm, T && !T.sl ? 0.12 : 0.38), armW + rw * 2, St.rim) + line(curvy(...arm), armW, St.body) + sleeve(arm, false));
  fig.push(G.over);
  // 4. Head details ride on the head (rigid, tilting with the neck): shading, hair, face, hat.
  const ha = (P.h || 0) + (180 - J.neckA) * 0.6;
  const flat = A.style === 'flat' || !A.style;
  const cel = flat ? `<path d="M-4,-18.6 A19,19 0 0,0 -4,18.6 A24,24 0 0,1 -4,-18.6Z" fill="#000" opacity=".16"/><path d="M-10,-11 A13,13 0 0,1 2,-14.5" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round" opacity=".4"/>` : '';
  fig.push(`<g transform="translate(${pt(J.head)}) rotate(${r1(ha)}) scale(${r1((J.headR / 19) * 100) / 100})">${cel}${hairSVG(A.hair)}${faceSVG(A.face, P.expr, St.eye)}${HATS[A.hat] || ''}</g>`);
  // 5. Weapon or tool in the near hand; the hand is drawn over the grip.
  const hp = J.aF[2], fa = J.foreA.aF, prop = P.prop;
  const weapon = !prop && worn && !sheathed ? worn : null;
  if (weapon) fig.push(`<g transform="translate(${pt(hp)}) rotate(${rotTo(fa + P.g)}) scale(1.2)">${weaponSVG(weapon)}</g>`);
  if (prop === 'rod') fig.push(rodSVG(hp, fa + P.g, t));
  if (prop === 'pan') fig.push(panSVG(hp, fa + P.g, t));
  fig.push(hand(hp, false));
  out.push(St.filter ? `<g filter="url(#${St.filter})">${fig.join('')}</g>` : fig.join(''));
  return out.join('');
}
// The torso of an outfit: waistband, coat skirt, the top itself and its details, then the sash.
function torsoCloth(O, J, B, TW, sp, sway, St) {
  const T = O.top, Tc = [J.pelvis, J.waist, J.neck], wt = TW + 7, s = [];
  const c = (v) => (v === 'skin' ? St.body : v);
  if (O.bot) s.push(cloth(bez(Tc, -0.2, 0.1, 2), TW + 11, TW + 10, O.bot.c));
  if (O.skirt) {
    const top = add(J.pelvis, sp, 8), hw = (TW + 11) / 2;
    const bk = add(top, sp + 90, hw), fr = add(top, sp - 90, hw);
    const by = J.pelvis[1] + O.skirt * B.h;
    const kx = [J.lB[1][0], J.lF[1][0], J.pelvis[0]];
    const x0 = Math.min(...kx) - 10 - sway * 3 - O.skirt * 0.12, x1 = Math.max(...kx) + 6;
    const d = `M${pt(bk)}L${pt(fr)}Q${r1(x1 + 1)},${r1((fr[1] + by) / 2)} ${r1(x1)},${r1(by)}L${r1(x0)},${r1(by + 2)}Q${r1(x0 + 3)},${r1((bk[1] + by) / 2)} ${pt(bk)}Z`;
    s.push(part(d, T.c, 4.6) + `<path d="M${pt(add(top, sp - 90, hw * 0.3))}L${r1(x1 - 7)},${r1(by)}" stroke="${shade(T.c, 0.25)}" stroke-width="2"/>`);
    if (T.trim) s.push(`<path d="M${r1(x1)},${r1(by)}L${r1(x0)},${r1(by + 2)}" stroke="${T.trim}" stroke-width="2.2"/>`);
  }
  const body = bez(Tc, -0.14, 0.84, 8);
  s.push(cloth(body, wt + 1, wt, T.c));
  s.push(`<path d="${poly(offsetPts(bez(Tc, 0, 0.8, 6), -wt / 2 + 3))}" fill="none" stroke="${shade(T.c, -0.3)}" stroke-width="3" stroke-linecap="round" opacity=".8"/>`);
  if (T.sh) s.push(cloth(bez(Tc, 0.64, 0.84, 3), wt + 0.6, wt + 0.6, T.sh));
  const front = (k0, k1, inset) => poly(offsetPts(bez(Tc, k0, k1, 6), wt / 2 - inset));
  if (T.open) s.push(inkLine(front(0.06, 0.86, 4.2), 6.5, c(T.open)));
  if (T.trim && !T.open) s.push(`<path d="${front(-0.12, 0.84, 1.6)}" fill="none" stroke="${T.trim}" stroke-width="2.2" stroke-linecap="round"/>`);
  if (T.zip) s.push(`<path d="${front(-0.1, 0.84, 4.5)}" fill="none" stroke="${T.zip}" stroke-width="2" stroke-linecap="round"/>`);
  if (T.buttons) s.push(offsetPts(bez(Tc, 0.12, 0.7, 3), wt / 2 - 4.5).map((p) => `<circle cx="${r1(p[0])}" cy="${r1(p[1])}" r="2" fill="${T.buttons}" stroke="${OL}" stroke-width="1.1"/>`).join(''));
  const P84 = bez(Tc, 0.84, 0.84, 1)[0], hw = wt / 2;
  if (T.v) s.push(frame(J, P84, `<path d="M-1,-1 L${r1(hw - 0.5)},-1 L${r1(hw * 0.45)},13Z" fill="${c(T.v)}" stroke="${OL}" stroke-width="1.8" stroke-linejoin="round"/>`));
  if (O.sash) {
    const bp = add(J.pelvis, sp, 5), sw = (TW + 13) / 2, bk = add(bp, sp + 90, sw - 2);
    s.push(inkLine(`M${pt(add(bp, sp + 90, sw))}L${pt(add(bp, sp - 90, sw))}`, 6, O.sash));
    s.push(part(taper([bk, [bk[0] - 6 - sway * 2, bk[1] + 10], [bk[0] - 9 - sway * 3, bk[1] + 19]], [5.5, 4.4, 3.2]), O.sash, 3.4));
  }
  if (T.collar === 'high') s.push(frame(J, P84, `<path d="M${r1(-hw)},3 L${r1(-hw + 1)},-8 Q0,-11 ${r1(hw - 1)},-8 L${r1(hw)},3 Q0,6 ${r1(-hw)},3Z" fill="${T.cc || T.c}" ${HO} stroke-width="2.6"/>`
    + hl(`M${r1(-hw + 3)},-6 Q0,-8.5 ${r1(hw - 3)},-6`, shade(T.cc || T.c, 0.3), 1.6)));
  if (T.chain) {
    const a = offsetPts([P84], 0)[0], f = add(add(P84, sp, -26), sp - 90, hw - 3), b = add(add(P84, sp, -4), sp - 90, hw - 1);
    const d = `M${pt(add(a, sp + 90, hw * 0.4))}Q${pt(f)} ${pt(b)}`;
    s.push(`<path d="${d}" fill="none" stroke="${OL}" stroke-width="4.6" stroke-linecap="round"/><path d="${d}" fill="none" stroke="${T.chain}" stroke-width="2.6" stroke-dasharray="3.2 1.6" stroke-linecap="round"/>`);
  }
  return s.join('');
}

// A weapon carried at the waist: blades sit in a scabbard on the hip (hilt forward),
// heavy weapons hang from the belt, long ones (lance, bow) are slung behind the hip.
function sheathSVG(id) {
  const r = typeof rarity === 'function' ? rarity(id) : 1, c = RCOL[Math.min(6, r)] || RCOL[1];
  const o = `stroke="${OL}" stroke-width="2" stroke-linejoin="round"`;
  const grip = `<rect x="-9" y="-2.4" width="10" height="4.8" rx="1.5" fill="#5a3d26" ${o}/><circle cx="-10" cy="0" r="2.8" fill="${c}" ${o}/>`;
  const L = { katana: 54, short: 30, cutlass: 44 }[weaponKind(id)];
  if (!L) return weaponSVG(id);
  const guard = weaponKind(id) === 'katana' ? `<ellipse cx="2" cy="0" rx="2.6" ry="6" fill="${c}" ${o}/>` : `<rect x="0" y="-6" width="3.6" height="12" rx="1.5" fill="${c}" ${o}/>`;
  return grip + `<path d="M3,-3.4 L${L},-2.6 Q${L + 4},0 ${L},2.8 L3,3.4Z" fill="#2b2230" ${o}/>`
    + `<path d="M6,-1.6 L${L - 4},-1.1" stroke="#4a3b52" stroke-width="1.4" stroke-linecap="round"/>`
    + `<path d="M${L - 7},-2.8 L${L},-2.6 Q${L + 4},0 ${L},2.8 L${L - 7},3Z" fill="${c}" ${o}/>`
    + `<rect x="5" y="-3.8" width="4" height="7.6" rx="1" fill="${c}" ${o}/>` + guard;
}
// Where a carried weapon hangs: [layer, angle from the spine, distance along spine, forward offset, scale]
const CARRY = { katana: ['front', -52, 7, 3, 1], short: ['front', -48, 7, 3, 1], cutlass: ['front', -50, 7, 3, 1], cleaver: ['front', -40, 7, 2, 0.9],
  hammer: ['front', -24, 8, -3, 0.85], sickle: ['front', -18, 8, -3, 0.9], cannon: ['front', -14, 6, 1, 0.9],
  lance: ['back', -64, 9, 6, 0.9], bow: ['back', -90, 10, -8, 0.85] };

// Everything the figure wears besides the hat and face.
// back: behind the body · under: over the torso, under the front arm · over: over the front arm.
function gearSVG(A, J, P, t, B, o) {
  const back = [], under = [], over = [];
  const W = B.w, sway = Math.sin(t * 2.1), pel = J.pelvis, N = J.chest, sp = P.t1;
  const strap = (d, col) => `<path d="${d}" fill="none" stroke="${OL}" stroke-width="5.2" stroke-linecap="round"/><path d="${d}" fill="none" stroke="${col}" stroke-width="2.8" stroke-linecap="round"/>`;
  // a cape: hangs from a collar at the base of the neck and trails behind
  const cape = (c) => {
    back.push(capeSVG(J, B, P, t, c));
    under.push(frame(J, N, collarSVG(c)));
  };
  switch (A.back) {
    case 'shroud': cape({ fill: '#2a2238', fold: '#1a1424', edge: '#9b6bff', jag: 1, len: 64, collar: 'hood', cc: '#3a2f4f', clasp: '#e9e3d2' }); break;
    case 'pelt':   cape({ fill: '#c8873a', fold: '#a46a28', edge: '#e8c08a', stripes: 1, len: 50, collar: 'fur', cc: '#efe0c4', clasp: '#e8443a' }); break;
    case 'mantle': cape({ fill: '#1a0f2a', fold: '#2c1846', edge: '#ff3fb4', stars: 1, len: 62, collar: 'high', cc: '#2c1846', clasp: '#ff3fb4' }); break;
    case 'coat': {
      // captain's coat: long tails flaring behind, a fitted body with a gold edge, a cuffed sleeve, an epaulette
      const top = add(pel, sp, 14), hb = add(top, sp + 90, 5 * W), L = B.h;
      const tailA = [pel[0] - 30 - sway * 4, pel[1] + 50 * L], tailB = [pel[0] - 12, pel[1] + 46 * L];
      const tails = `M${pt(top)} L${pt(hb)} Q${r1(pel[0] - 20)},${r1(pel[1] + 14)} ${pt(tailA)} L${r1(pel[0] - 19)},${r1(pel[1] + 41 * L)} L${pt(tailB)} L${r1(pel[0] + 6)},${r1(pel[1] + 34 * L)} Z`;
      back.push(`<path d="${tails}" fill="#7a1d2b" stroke="${OL}" stroke-width="2.6" stroke-linejoin="round"/>`
        + `<path d="M${pt(hb)} Q${r1(pel[0] - 20)},${r1(pel[1] + 14)} ${pt(tailA)} L${r1(pel[0] - 19)},${r1(pel[1] + 41 * L)} L${pt(tailB)}" fill="none" stroke="#f4c66a" stroke-width="2" stroke-linejoin="round"/>`
        + `<path d="M${r1(pel[0] - 4)},${r1(pel[1] + 8)} L${r1(pel[0] - 15)},${r1(pel[1] + 38 * L)}" stroke="#5c1420" stroke-width="2"/>`);
      const body = curvy(add(pel, sp, -6), J.waist, N);
      under.push(`<path d="${body}" fill="none" stroke="${OL}" stroke-width="${r1(o.TW + 5)}" stroke-linecap="round"/><path d="${body}" fill="none" stroke="#8e2433" stroke-width="${r1(o.TW + 1)}" stroke-linecap="round"/>`);
      const edge = (k) => add([pel[0] + (N[0] - pel[0]) * k, pel[1] + (N[1] - pel[1]) * k], sp - 90, o.TW / 2 - 1);
      under.push(`<path d="M${pt(edge(0.02))}L${pt(edge(0.5))}L${pt(edge(0.9))}" fill="none" stroke="#f4c66a" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>`
        + [0.3, 0.55].map((k) => { const p = add(edge(k), sp + 90, 3); return `<circle cx="${r1(p[0])}" cy="${r1(p[1])}" r="1.8" fill="#f4c66a" stroke="${OL}" stroke-width="1"/>`; }).join(''));
      under.push(frame(J, N, `<path d="M-8,4 L-10,-7 Q-2,-3 3,-1 L8,4 Q0,7 -8,4Z" fill="#8e2433" ${HO}/>` + hl('M-9,-5 Q-3,-2 2,0', '#f4c66a', 1.8)));
      const a = J.aF, w = o.LW * 0.92, end = [a[1][0] + (a[2][0] - a[1][0]) * 0.4, a[1][1] + (a[2][1] - a[1][1]) * 0.4];
      const sl = `M${pt(a[0])}L${pt(a[1])}L${pt(end)}`;
      over.push(`<path d="${sl}" fill="none" stroke="${OL}" stroke-width="${r1(w + 4)}" stroke-linecap="round" stroke-linejoin="round"/><path d="${sl}" fill="none" stroke="#a82d3e" stroke-width="${r1(w + 0.6)}" stroke-linecap="round" stroke-linejoin="round"/>`
        + `<circle cx="${r1(end[0])}" cy="${r1(end[1])}" r="${r1(w / 2 + 1.2)}" fill="#f4c66a" stroke="${OL}" stroke-width="1.6"/>`);
      over.push(frame(J, J.shoulder, `<path d="M-7,-3 Q0,-7 8,-3 L7,2 Q0,0 -7,2Z" fill="#f4c66a" ${HO} stroke-width="1.6"/>` + hl('M-5,2.5 v4 M-1.5,2 v4.6 M2,2 v4.6 M5.5,2.5 v4', '#f4c66a', 1.4)));
      break;
    }
    case 'scarf': {
      const n = add(N, sp + 90, 2), w = (k) => Math.sin(t * 4 + k) * 4;
      const tail = (dy, k) => taper([[n[0] - 4, n[1] - 2], [n[0] - 20, n[1] + dy * 0.6 + w(k)], [n[0] - 40, n[1] + dy + w(k + 1)]], [6, 5, 3.4]);
      back.push(part(tail(6, 0), '#c4501a', 2.6) + part(tail(16, 1.2), '#ff8a2b', 2.6));
      under.push(frame(J, N, `<path d="M-9,-7 Q0,-3 8,-7 L9,1 Q0,5 -9,1Z" fill="#ff8a2b" ${HO}/>` + hl('M-8,-2 Q0,1 8,-2', '#c4501a', 1.8) + `<circle cx="-8" cy="-3" r="3.6" fill="#e06a24" ${HO}/>`));
      break;
    }
    case 'pack':
      back.push(frame(J, N, `<path d="M-15,-2 V-12" stroke="${OL}" stroke-width="3.6"/><path d="M-15,-2 V-12" stroke="#cfd6e4" stroke-width="1.8"/><circle cx="-15" cy="-13" r="3.2" fill="#ff8a2b" ${HO} stroke-width="1.6"/>`
        + `<rect x="-27" y="-1" width="22" height="30" rx="10" fill="#f2f2f2" ${HO} stroke-width="2.6"/><path d="M-27,11 H-5 V17 H-27Z" fill="#ff8a2b" ${HO} stroke-width="1.6"/>`
        + hl('M-23,4 Q-23,1 -19,1', '#fff', 2) + `<circle cx="-16" cy="7" r="2.4" fill="#4cc3ff" stroke="${OL}" stroke-width="1.2"/>`));
      under.push(frame(J, N, strap(`M-5,1 Q3,6 3,${r1(20 * B.h)}`, '#5b6475')));
      break;
    case 'quiver':
      back.push(frame(J, N, `<g transform="rotate(-24 -14 14)"><g stroke="${OL}" stroke-width="1.4" stroke-linejoin="round"><path d="M-22,-8 l-4,-11 l6,4Z" fill="#e8443a"/><path d="M-15,-9 l-1,-12 l5,5Z" fill="#f2f2f2"/><path d="M-9,-8 l2,-11 l4,6Z" fill="#9be15d"/></g>`
        + hl('M-21,-10 v6 M-14.5,-11 v7 M-8,-10 v6', '#5a3d26', 2)
        + `<rect x="-26" y="-6" width="21" height="40" rx="6" fill="#8a5a2b" ${HO} stroke-width="2.6"/>` + hl('M-26,1 H-5 M-26,25 H-5', '#5a3d26', 2.4) + hl('M-22,6 V20', '#b07a44', 2) + '</g>'));
      under.push(frame(J, N, strap(`M-6,0 Q1,8 6,${r1(18 * B.h)}`, '#5a3d26')));
      break;
    case 'sigil': {
      const c = add(add(N, J.chestA, -18), J.chestA + 90, 12), rot = r1(t * 30);
      const ticks = [...Array(12)].map((_, i) => { const a = i * 30; return `M${pt(add([0, 0], a, 30))}L${pt(add([0, 0], a, 35))}`; }).join('');
      const runes = [...Array(6)].map((_, i) => { const p = add([0, 0], i * 60 + 15, 24); return `<path d="M${r1(p[0] - 2.5)},${r1(p[1] - 3)} l5,3 -5,3" fill="none" stroke="#36d6a8" stroke-width="1.6"/>`; }).join('');
      back.push(`<g transform="translate(${pt(c)})"><circle r="38" fill="#36d6a8" opacity=".08"/><g transform="rotate(${rot})"><circle r="35" fill="none" stroke="#36d6a8" stroke-width="2.4"/><circle r="28" fill="none" stroke="#36d6a8" stroke-width="1.4" stroke-dasharray="4 3"/><path d="${ticks}" stroke="#36d6a8" stroke-width="2"/>${runes}</g><g transform="rotate(${-rot * 1.5})"><path d="M0,-18 L15.6,9 L-15.6,9Z M0,18 L15.6,-9 L-15.6,-9Z" fill="none" stroke="#7ff0d0" stroke-width="1.4"/></g></g>`);
      break;
    }
    case 'wings': {
      const f = Math.sin(t * 3) * 8;
      const wing = (s, op, k) => `<g transform="translate(-4,9) rotate(${r1(-18 + f * s)}) scale(${k})" opacity="${op}"><path d="M0,0 Q-30,-46 -70,-34 Q-52,-24 -62,-12 Q-44,-12 -48,1 Q-28,-4 -26,8 Q-12,2 0,7Z" fill="#f4f1ea" ${HO} stroke-width="2.6"/>`
        + hl('M-6,1 Q-30,-28 -58,-28 M-6,4 Q-28,-10 -46,-6 M-6,6 Q-20,0 -30,4', '#d4a83a', 1.8) + hl('M0,0 Q-30,-46 -70,-34', '#d4a83a', 2.2) + '</g>';
      back.push(frame(J, N, wing(0.6, 0.65, 0.9) + wing(1, 1, 1.08)));
      break;
    }
  }
  // a weapon that is put away hangs at the waist, on a belt
  if (o.sheathed) {
    const k = weaponKind(o.sheathed), c = CARRY[k] || CARRY.cutlass;
    const at = add(add(pel, sp, c[2]), sp - 90, c[3]);
    const g = `<g transform="translate(${pt(at)}) rotate(${rotTo(sp - 180 + c[1])}) scale(${c[4]})">${sheathSVG(o.sheathed)}</g>`;
    (c[0] === 'back' ? back : under).push(g);
  }
  if (o.sheathed || A.back === 'coat') {
    const bp = add(pel, sp, 7), hw = o.TW / 2 + 1.5;
    const d = `M${pt(add(bp, sp + 90, hw))}L${pt(add(bp, sp - 90, hw))}`;
    under.unshift(`<path d="${d}" stroke="${OL}" stroke-width="6.6" stroke-linecap="round"/><path d="${d}" stroke="#3a2a22" stroke-width="3.8" stroke-linecap="round"/>`
      + frame(J, bp, `<rect x="${r1(hw - 4.5)}" y="-3" width="5" height="6" rx="1" fill="#f4c66a" stroke="${OL}" stroke-width="1.4"/>`));
  }
  return { back: back.join(''), under: under.join(''), over: over.join('') };
}
// The collar a cape hangs from (neck-base frame: +x forward, +y down).
function collarSVG(c) {
  const clasp = `<circle cx="6" cy="2" r="3.2" fill="${c.clasp}" ${HO} stroke-width="1.6"/><circle cx="5.2" cy="1.2" r="1" fill="#fff" opacity=".7"/>`;
  if (c.collar === 'fur') return `<path d="M-11,-1 Q-9,-6 -5,-3 Q-3,-7 1,-3 Q3,-7 7,-3 Q11,-5 10,1 Q12,5 8,6 Q5,9 1,6 Q-2,9 -5,6 Q-9,8 -10,4 Q-14,2 -11,-1Z" fill="${c.cc}" ${HO}/>` + hl('M-7,2 Q0,4 6,2', '#d6c19c', 1.6) + clasp;
  if (c.collar === 'high') return `<path d="M-9,5 Q-17,-3 -14,-13 Q-7,-7 -3,-2 Q2,-1 8,-2 L9,4 Q0,8 -9,5Z" fill="${c.cc}" ${HO}/>` + hl('M-12,-9 Q-12,-2 -6,3', c.clasp, 1.6) + clasp;
  if (c.collar === 'hood') return `<path d="M-6,-2 Q-20,-6 -20,8 Q-12,10 -6,6Z" fill="${c.cc}" ${HO}/><path d="M-10,-2 Q0,2 8,-2 L8,4 Q0,8 -10,4Z" fill="${c.cc}" ${HO}/>` + clasp;
  return `<path d="M-10,-2 Q0,2 8,-2 L8,4 Q0,8 -10,4Z" fill="${c.cc}" ${HO}/>` + clasp;
}
// Motion effects: slash trail, thrust speed lines, kick impact, hit recoil.
function fxSVG(fx, J, col) {
  const sh = J.shoulder;
  const P = (a, r) => pt(add(sh, a, r));
  if (fx === 'slash') {
    const R = 64, a0 = 214, a1 = 74;
    const cres = (r, k) => `M${P(a0, r)} A${r},${r} 0 0,1 ${P(a1, r * 0.98)} A${r1(r * k)},${r1(r * k)} 0 0,0 ${P(a0, r * 0.94)}Z`;
    return `<path d="${cres(R, 1.3)}" fill="${col}" opacity=".45"/><path d="${cres(R * 0.96, 1.45)}" fill="#fff" opacity=".55"/>`;
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
// A cape hanging from the base of the neck and trailing behind (wind follows the lean).
function capeSVG(J, B, P, t, o) {
  const N = J.chest, A = J.chestA, pel = J.pelvis, sway = Math.sin(t * 2.1);
  const hemY = pel[1] + (o.len || 54) * B.h, back = -42 - sway * 6 - (P.t1 < 170 ? 14 : 0);
  const top = add(N, A - 90, 4), nape = add(add(N, A + 90, 8), A, 2);
  const blade = add(add(N, A, -14), A + 90, 24);          // the cloth bells out over the shoulder blade
  const tip = [pel[0] + back, hemY], end = [pel[0] + 2, hemY - 4];
  let hem;
  if (o.jag) {   // torn hem: zig-zag between the trailing tip and the heel of the cape
    const pts = [];
    for (let i = 1; i <= 6; i++) { const k = i / 6, x = tip[0] + (end[0] - tip[0]) * k, y = tip[1] + (end[1] - tip[1]) * k + (i % 2 ? 9 : 0) + Math.sin(t * 3 + i) * 1.5; pts.push(`${r1(x)},${r1(y)}`); }
    hem = 'L' + pts.join('L');
  } else hem = `Q${r1(pel[0] + back / 2 + 4)},${r1(hemY + 6 + sway * 3)} ${pt(end)}`;
  const mid = [(pel[0] + N[0]) / 2, (pel[1] + N[1]) / 2];
  const d = `M${pt(top)} L${pt(nape)} Q${pt(blade)} ${pt(tip)} ${hem} Q${pt(mid)} ${pt(top)}Z`;
  let s = `<path d="${d}" fill="${o.fill}" stroke="${OL}" stroke-width="3" stroke-linejoin="round"/>`;
  const fold = (k) => `M${pt(add(nape, A - 90, 6 * k))} Q${pt(add(blade, A - 90, 12 + 6 * k))} ${r1(pel[0] + back * (0.75 - 0.3 * k))},${r1(hemY - 4)}`;
  s += `<path d="${fold(0)}" fill="none" stroke="${o.fold}" stroke-width="2.6"/><path d="${fold(1)}" fill="none" stroke="${o.fold}" stroke-width="2" opacity=".7"/>`;
  s += `<path d="M${pt(add(nape, A, -4))} Q${pt(add(blade, A - 90, 6))} ${pt(add(blade, A, -18))}" fill="none" stroke="#fff" stroke-width="2" opacity=".14"/>`;
  if (o.edge) s += `<path d="M${pt(tip)} ${hem}" fill="none" stroke="${o.edge}" stroke-width="2.2" stroke-linejoin="round"/>`;
  if (o.stripes) s += [0.3, 0.55, 0.8].map((k) => { const x = N[0] + (tip[0] - N[0]) * k * 0.9, y = N[1] + (hemY - N[1]) * k; return `<path d="M${r1(x + 6)},${r1(y)} q-6,4 -13,2" fill="none" stroke="#5a3a1c" stroke-width="3" stroke-linecap="round"/>`; }).join('');
  if (o.stars) s += [[0.35, 0.4], [0.6, 0.65], [0.5, 0.85], [0.75, 0.5]].map(([kx, ky], i) => { const x = N[0] + (tip[0] - N[0]) * kx, y = N[1] + (hemY - N[1]) * ky; return `<circle cx="${r1(x)}" cy="${r1(y)}" r="${1.4 + (i % 2)}" fill="#ffd0ee" opacity="${r1(0.6 + Math.sin(t * 4 + i) * 0.4)}"/>`; }).join('');
  return s;
}
// Auras that glow are blended with "screen"; smoke stays a normal (dark) layer.
const AURA_GLOW = { bubbles: 1, leaves: 1, wisps: 1, embers: 1, smoke: 1, flies: 1, echo: 1, storm: 1 };
function auraSVG(id, cx, cy, t) {
  switch (id) {
    case 'bubbles': return flameAura(cx, t, ['#14a8ff', '#7fd3ff', '#e6f7ff'], { h: 150, w: 46 }) + [0, 1, 2, 3, 4].map((i) => {
      const k = (t * 0.35 + i / 5) % 1, x = cx + Math.sin(i * 2.4 + t) * 42, y = 220 - k * 170;
      return `<circle cx="${r1(x)}" cy="${r1(y)}" r="${r1(3 + (i % 3) * 1.6)}" fill="none" stroke="#7fd3ff" stroke-width="1.6" opacity="${r1(0.9 - k * 0.8)}"/>`;
    }).join('');
    case 'leaves': return flameAura(cx, t, ['#ff3a1a', '#ff8a2b', '#ffe0a0']) + [0, 1, 2, 3, 4, 5].map((i) => {
      const a = t * 1.4 + i * 1.05, x = cx + Math.cos(a) * 50, y = cy + Math.sin(a) * 16 - 20 + Math.sin(t * 2 + i) * 18, rot = r1(a / D2R * 2);
      return `<path transform="translate(${r1(x)},${r1(y)}) rotate(${rot})" d="M-6,0 Q0,-5 6,0 Q0,5 -6,0Z M-6,0 H6" fill="${i % 2 ? '#7fd36a' : '#ff9a4d'}" stroke="#2c5a1e" stroke-width=".8" opacity="${Math.sin(a) > 0 ? 0.95 : 0.6}"/>`;
    }).join('');
    case 'wisps': return flameAura(cx, t, ['#5a6bff', '#9fb0ff', '#f0f2ff'], { h: 196, w: 50 }) + [0, 1, 2, 3].map((i) => {
      const a = t * 0.9 + i * Math.PI / 2, x = cx + Math.cos(a) * 46, y = cy + Math.sin(a) * 26 - 10, f = Math.sin(t * 9 + i) * 2;
      return `<path transform="translate(${r1(x)},${r1(y)})" d="M0,8 Q-7,2 -3,-4 Q0,-8 ${r1(1 + f)},-16 Q5,-6 6,0 Q6,7 0,8Z" fill="#9b6bff" opacity=".8"/><circle cx="${r1(x)}" cy="${r1(y + 2)}" r="2.6" fill="#e8dcff"/>`;
    }).join('');
    case 'embers': return flameAura(cx, t, ['#ffb21f', '#ffe066', '#fffbe0'], { h: 200, w: 56 }) + bolts(cx, t, '#ffe066')
      + [0, 1, 2, 3].map((i) => { const k = (t * 0.6 + i / 4) % 1; return `<circle cx="${r1(cx - 30 + i * 20 + Math.sin(t * 3 + i) * 6)}" cy="${r1(200 - k * 150)}" r="2.2" fill="#fff0a0" opacity="${r1(1 - k)}"/>`; }).join('');
    case 'smoke': return flameAura(cx, t, ['#7a3bff', '#36d6a8', '#d8fff2'], { h: 180 }) + [0, 1, 2, 3, 4, 5].map((i) => {
      const k = (t * 0.25 + i / 6) % 1, x = cx - 30 + (i % 3) * 30 + Math.sin(t + i) * 8, y = 222 - k * 150, r = 8 + k * 16;
      return `<circle cx="${r1(x)}" cy="${r1(y)}" r="${r1(r)}" fill="${i % 2 ? '#123a33' : '#1d4d44'}" opacity="${r1((1 - k) * 0.55)}"/><circle cx="${r1(x + 3)}" cy="${r1(y - 3)}" r="${r1(r * 0.35)}" fill="#36d6a8" opacity="${r1((1 - k) * 0.35)}"/>`;
    }).join('');
    case 'flies': return flameAura(cx, t, ['#2fbf5a', '#9be15d', '#eaffd0'], { h: 176, w: 48 }) + [0, 1, 2, 3, 4, 5, 6].map((i) => {
      const x = cx + Math.sin(t * 0.7 + i * 2.1) * 56, y = cy - 10 + Math.cos(t * 0.9 + i * 1.3) * 60, on = Math.sin(t * 3 + i * 1.7) > -0.2;
      return on ? `<circle cx="${r1(x)}" cy="${r1(y)}" r="5" fill="#d8ff6a" opacity=".25"/><circle cx="${r1(x)}" cy="${r1(y)}" r="2" fill="#f4ffb0"/>` : '';
    }).join('');
    case 'echo': {
      // the Echo: a tall spirit figure standing just behind you
      const gx = cx - 42, gy = 196 + Math.sin(t * 1.4) * 5;
      const fig = `M${gx},${gy - 92} Q${gx - 2},${gy - 70} ${gx + 1},${gy - 44} M${gx - 2},${gy - 86} Q${gx + 14},${gy - 70} ${gx + 22},${gy - 80} M${gx - 2},${gy - 84} Q${gx - 18},${gy - 66} ${gx - 6},${gy - 58} M${gx + 1},${gy - 44} L${gx - 12},${gy} M${gx + 1},${gy - 44} L${gx + 14},${gy - 2}`;
      return flameAura(cx, t, ['#b04cff', '#ef7cff', '#ffe6ff'], { h: 160, w: 44 }) + `<g opacity=".8"><path d="${fig}" fill="none" stroke="#ef7cff" stroke-width="15" stroke-linecap="round" opacity=".25"/><path d="${fig}" fill="none" stroke="#ef7cff" stroke-width="8" stroke-linecap="round" opacity=".55"/><circle cx="${gx}" cy="${gy - 112}" r="19" fill="#ef7cff" opacity=".5"/><circle cx="${gx}" cy="${gy - 112}" r="14" fill="none" stroke="#ffd6ff" stroke-width="2" opacity=".7"/><path d="M${gx + 3},${gy - 114} h10" stroke="#fff" stroke-width="2.4" stroke-linecap="round"/></g>`;
    }
    case 'storm': {
      const on = Math.sin(t * 9) > 0.55, X = (d) => r1(cx + d), Y = (d) => r1(cy + d);
      return flameAura(cx, t, ['#8b2bd6', '#ff3fb4', '#ffe0f4'], { h: 204, w: 58 }) + `<ellipse cx="${r1(cx)}" cy="${r1(cy)}" rx="58" ry="84" fill="#ff3fb4" opacity="${r1(0.1 + Math.sin(t * 2) * 0.04)}"/><ellipse cx="${r1(cx)}" cy="${r1(cy)}" rx="40" ry="66" fill="#8b7bff" opacity=".12"/>`
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
