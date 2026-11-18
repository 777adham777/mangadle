'use strict';
/* ==========================================================================
   TRI-REALM IDLE — avatar
   A rigged anime stick figure drawn in SVG, in the style of the concept art:
   a slim coloured body dressed in clothes, big spiky hair, a pale sticker rim.

   How it is built (2D cut-out animation practice):
   - Skeleton with fixed bone lengths and forward kinematics, in a 3/4 front
     view turned to the right: shoulders and hips sit apart, the front arm and
     leg are drawn over the body, the back ones behind it. Grounded automatically.
   - Every part is a smooth closed shape (Catmull-Rom spline) with an ink
     outline painted behind its fill, so pieces overlap cleanly. Limbs and
     sleeves are tubes along the bones; the torso is mapped as (u, v) so
     garments, openings, zips and sashes are placed on it like on a pattern.
   - Cel shading: one shadow band on the side away from the light, darker
     far-side limbs, folds at elbows and knees, highlights on hair and head.
   - Animation is pose to pose with easing, plus breathing and secondary
     motion (capes, scarves, sashes and wings sway).

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
    C('ink',    'Soul Ink',        'soul', 3, LV('mining', 25)),
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
    C('ember',   'Ember Orange',  'shinobi', 3, LV('character', 20),   { ink: '#ff8a2b' }),
    C('spirit',  'Spirit Violet', 'soul',    3, LV('mining', 20),     { ink: '#b49bff' }),
    C('gilded',  'Ki Gold',       'ki',      4, LV('gravity', 30),     { ink: '#ffc93d' }),
    C('crimson', 'Tyrant Red',    'ki',      4, BOSS('tyrant', 'the Crimson Tyrant'), { ink: '#ff4d5e' }),
    C('hexteal', 'Hex Teal',      'hex',     3, LV('exorcism', 20),  { ink: '#36d6a8' }),
    C('wild',    'Wild Green',    'hunter',  3, LV('tracking', 20),    { ink: '#9be15d' }),
    C('orchid',  'Orchid',        'echo',    4, LV('archaeology', 20), { ink: '#ef7cff' }),
    C('void',    'Rift Void',     'rift',    5, KILLS('tear', 10),     { ink: '#8b7bff' }),
  ],
  // Hair: each style has its own colour, drawn as a spiky silhouette on the head.
  hair: [
    { id: 'tuft', name: 'Messy Black', r: 1, need: FREE },
    { id: 'none', name: 'Shaved', r: 1, need: FREE },
    C('mop',    'Sea-Salt Mop',    'seas',    2, LV('fishing', 10)),
    C('spikes', 'Swept Spikes',    'shinobi', 2, LV('character', 10)),
    C('ember',  'Ember Crest',     'soul',    3, LV('mining', 10)),
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
    C('shades',  'Capsule Shades', 'ki',      2, LV('gravity', 15)),
    C('blindfold', 'Sealed Eyes',  'hex',     4, LV('exorcism', 35)),
    C('mask',    'Shinobi Mask',   'shinobi', 3, LV('arts', 20)),
    C('husk',    'Husk Mask',      'soul',    4, KILLS('districts', 100)),
    C('fierce',  'Battle Glare',   'ki',      2, KILLS('plains', 50)),
    C('scar',    "Survivor's Scar", 'ki',     3, { need: () => S.stats.deaths >= 1 && !!S.gates.ki, hint: 'Lose a fight after reaching Kaio Planet' }),
    C('cursed',  'Cursed Marks',   'hex',     3, { need: () => (S.stats.pactTime || 0) >= 3600, hint: 'Hold Binding Vows for 1 hour' }),
    C('paint',   'War Paint',      'hunter',  2, KILLS('thicket', 50)),
    C('marble',  'Marble Mask',    'echo',    4, LV('restoration', 30)),
    C('rifteye', 'Rift Eye',       'rift',    5, BOSS('unbound', 'the Heart of the Rift')),
  ],
  back: [
    { id: 'none', name: 'Nothing', r: 1, need: FREE },
    C('coat',   "Captain's Coat",  'seas',    4, { need: () => S.stats.voyages >= 25, hint: 'Return from 25 voyages' }),
    C('scarf',  'Shinobi Scarf',   'shinobi', 2, LV('woodcutting', 15)),
    C('shroud', "Reaper's Shroud", 'soul',    3, LV('mining', 30)),
    C('pack',   'Capsule Pack',    'ki',      3, LV('farming', 20)),
    C('sigil',  'Sigil Circle',    'hex',     5, BOSS('matriarch', 'the Cursed Matriarch')),
    C('quiver', 'Hunter Quiver',   'hunter',  3, LV('trapcraft', 20)),
    C('pelt',   'Chimera Pelt',    'hunter',  5, BOSS('chimera', 'the Chimera King')),
    C('wings',  'Marble Wings',    'echo',    5, BOSS('pillar', 'the Pillar Lord')),
    C('mantle', 'Rift Mantle',     'rift',    4, { need: () => !!S.gates.rift, hint: 'Tear open the Convergence' }),
  ],
  aura: [
    { id: 'none', name: 'No aura', r: 1, need: FREE },
    C('bubbles',  'Sea Bubbles',   'seas',    3, LV('fishing', 40)),
    C('leaves',   'Leaf Whirl',    'shinobi', 3, LV('woodcutting', 30)),
    C('wisps',    'Soul Wisps',    'soul',    4, LV('mining', 30)),
    C('embers',   'Ki Flare',      'ki',      4, BOSS('tyrant', 'the Crimson Tyrant')),
    C('smoke',    'Cursed Smoke',  'hex',     4, { need: () => (S.stats.pactTime || 0) >= 36000, hint: 'Hold Binding Vows for 10 hours' }),
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
// The figure stands in a 3/4 front view, turned towards the right (where foes stand).
// Its front arm and leg are on the right (drawn over the body), the back ones on the left.
// Angles in degrees: 0 points down, 90 right, 180 up, -90 left.
// t1: abdomen (absolute) · t2: chest (relative) · n: neck (relative) · h: head tilt
// aF / aB: front / back arm [upper (absolute), elbow bend] · lF / lB: legs [thigh (absolute), knee bend]
// fF / fB: foot tilt · g: weapon angle relative to the forearm · dy: crouch · air: float above the ground
// bf: the back arm crosses in front of the chest (drawn over the torso) · sh: weapon stays sheathed
// tw: turn towards the foe (0 faces the viewer, 1 is a 3/4 view facing right; combat poses turn)
// ht / st: hip and shoulder tilt (contrapposto: the hip over the weight-bearing leg rises, the shoulder above it drops)
const POSES = {
  relaxed:  { sh: 1, t1: 179, t2: 2,  n: 0,  h: 3,   ht: -3, st: 2,  aF: [11, 6],    aB: [-11, -6],  lF: [9, -2],   lB: [-9, 2],   fF: 10, fB: -190, g: -150, dy: 0 },
  guard:    { tw: 1, t1: 174, t2: 6,  n: -4, h: -4,  ht: 3,  st: -4, aF: [50, 84],   aB: [-6, 140],  lF: [26, -24], lB: [-24, 14], fF: 14, fB: -16, g: 34,   dy: 10, bf: 1 },
  swagger:  { sh: 1, t1: 184, t2: -6, n: -2, h: -8,  ht: 6,  st: -4, aF: [44, -100], aB: [-44, 100], lF: [5, -2],   lB: [-17, 10], fF: 8,  fB: -196, g: -170, dy: 0 },
  heroic:   { t1: 180, t2: -3, n: -6, h: -8,  ht: -4, st: 7,  aF: [174, -10], aB: [-16, -10], lF: [16, -6],  lB: [-8, 3],   fF: 10, fB: -190, g: -6,   dy: 0 },
  striking: { tw: 0.5, sh: 1, t1: 192, t2: -10, n: -8, h: -12, ht: 7, st: -7, aF: [146, 52], aB: [-62, -64], lF: [20, -30], lB: [-8, 2],   fF: 20, fB: -190, g: -150, dy: 0 },
  meditate: { sh: 1, t1: 180, t2: 0,  n: 4,  h: 6,   aF: [26, 44],   aB: [-26, -44], lF: [74, -150], lB: [-74, 150], fF: 0, fB: -180, g: -150, dy: 0, air: 22 },
  // attacks: anticipation pose, then the hit pose (with its effect)
  windup:   { tw: 1, t1: 190, t2: -8, n: 6,  h: -4,  ht: -4, st: 8,  aF: [206, -34], aB: [46, 74],   lF: [30, -36], lB: [-28, 8],  fF: 10, fB: -14, g: -40,  dy: 12, bf: 1 },
  strike:   { tw: 1, t1: 166, t2: 6,  n: -10, h: -6, ht: 6,  st: -8, aF: [100, 4],   aB: [-50, 30],  lF: [40, -48], lB: [-38, 6],  fF: 0,  fB: -20, g: -4,   dy: 16, fx: 'slash' },
  coil:     { tw: 1, t1: 185, t2: -5, n: 4,  h: -6,  ht: -3, st: 4,  aF: [28, 112],  aB: [-14, 140], lF: [30, -38], lB: [-28, 8],  fF: 10, fB: -14, g: -6,   dy: 12, bf: 1 },
  thrust:   { tw: 1, t1: 160, t2: 5,  n: -12, h: -6, ht: 6,  st: -6, aF: [94, -2],   aB: [-60, 36],  lF: [48, -58], lB: [-46, 6],  fF: -4, fB: -24, g: 0,    dy: 20, fx: 'thrust' },
  chamber:  { tw: 1, t1: 192, t2: -6, n: 6,  h: -4,  ht: 10, st: -4, aF: [44, 86],   aB: [-52, 60],  lF: [96, -122], lB: [-6, 2],  fF: 20, fB: -10, g: -90,  dy: 0 },
  kick:     { tw: 1, t1: 204, t2: -10, n: 8, h: -6,  ht: 12, st: -6, aF: [58, 44],   aB: [-82, 30],  lF: [94, -4],  lB: [-10, 2],  fF: -10, fB: -10, g: -150, dy: 0, fx: 'kick' },
  hurt:     { tw: 1, t1: 200, t2: -12, n: 16, h: 16, ht: -6, st: 10, aF: [-30, 40],  aB: [-60, 30],  lF: [16, -24], lB: [-22, 6],  fF: 10, fB: -12, g: -150, dy: 6, expr: 'hurt', fx: 'hit' },
  victory:  { tw: 0.6, t1: 184, t2: -5, n: -10, h: -12, ht: 6, st: 10, aF: [180, -8],  aB: [-130, 36], lF: [30, -86], lB: [-8, -26], fF: 20, fB: -40, g: 0,    dy: 0, air: 24, expr: 'happy' },
  fish:     { sh: 1, t1: 178, t2: 3,  n: 2,  h: 6,   ht: -3, st: 2,  aF: [54, 40],   aB: [20, 98],   lF: [10, -6],  lB: [-8, 2],   fF: 10, fB: -190, g: -36,  dy: 2, prop: 'rod', bf: 1 },
  cook:     { sh: 1, t1: 176, t2: 5,  n: 5,  h: 10,  ht: -3, st: 2,  aF: [40, 54],   aB: [8, 110],   lF: [10, -6],  lB: [-8, 2],   fF: 10, fB: -190, g: -90,  dy: 2, prop: 'pan', bf: 1 },
};
const POSE_KEYS = ['t1', 't2', 'n', 'h', 'ht', 'st', 'tw', 'fF', 'fB', 'g', 'dy', 'air'];
function lerpPose(a, b, k) {
  const o = {};
  for (const key of POSE_KEYS) o[key] = (a[key] || 0) + ((b[key] || 0) - (a[key] || 0)) * k;
  for (const key of ['aF', 'aB', 'lF', 'lB']) o[key] = [0, 1].map((i) => a[key][i] + (b[key][i] - a[key][i]) * k);
  for (const key of ['expr', 'prop', 'sh', 'bf']) o[key] = k < 0.5 ? a[key] : b[key];
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
// Proportions of the concept art (about 4.4 heads): a big round head on a short neck, a sturdy
// torso as wide as the head, legs a little longer than the torso, arms reaching the hips.
// Bone lengths are fixed (forward kinematics); the body faces the viewer, so shoulders and hips
// sit apart, and they tilt against each other (contrapposto).
const GROUND = 226;
function solve(P, B) {
  const s = B.h, W = B.w;
  const len = { ab: 24 * s, ch: 28 * s, nk: 6 * s, ua: 23 * s, fa: 21 * s, th: 36 * s, sh: 35 * s, ft: 4 * s };
  const pelvis = [100, 120 + P.dy];
  const waist = add(pelvis, P.t1, len.ab);
  const chestA = P.t1 + P.t2;
  const neckBase = add(waist, chestA, len.ch);
  const neckA = chestA + P.n;
  const headR = 20 * B.head;
  const neck = add(neckBase, neckA, len.nk);
  const head = add(neck, neckA, headR * 0.85);
  const sl = add(neckBase, chestA, -7 * s);                 // the shoulder line
  const st = P.st || 0, ht = P.ht || 0;
  const tw = P.tw || 0;
  const shF = add(sl, chestA - 90 + st, 12.5 * W * (1 - 0.18 * tw)), shB = add(sl, chestA + 90 + st, 12.5 * W * (1 - 0.42 * tw));
  const hipF = add(pelvis, P.t1 - 90 + ht, 7.5 * W * (1 - 0.2 * tw)), hipB = add(pelvis, P.t1 + 90 + ht, 7.5 * W * (1 - 0.4 * tw));
  const arm = (o, a) => { const e = add(o, a[0], len.ua); return [o, e, add(e, a[0] + a[1], len.fa)]; };
  const leg = (o, l, ft) => {
    const k = add(o, l[0], len.th), an = add(k, l[0] + l[1], len.sh);
    return [o, k, an, add(an, 90 + ft, len.ft)];
  };
  const J = { pelvis, waist, neckBase, chest: neckBase, neck, head, headR, chestA, neckA, shF, shB, shoulder: shF, hipF, hipB, ht, st, tw,
    aF: arm(shF, P.aF), aB: arm(shB, P.aB), lF: leg(hipF, P.lF, P.fF), lB: leg(hipB, P.lB, P.fB) };
  // ground the figure: the lowest sole rests on the floor (unless floating)
  const low = Math.max(J.lF[2][1] + 5, J.lF[3][1] + 4, J.lB[2][1] + 5, J.lB[3][1] + 4);
  const shift = GROUND - low - (P.air || 0);
  const mv = (p) => [p[0], p[1] + shift];
  for (const k of ['pelvis', 'waist', 'neckBase', 'chest', 'neck', 'head', 'shF', 'shB', 'shoulder', 'hipF', 'hipB']) J[k] = mv(J[k]);
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
  // Orange Town
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
  // Leaf Village
  hood: `<path d="M-18.6,-5 Q-30,-13 -43,-8 L-41,-1.5 Q-30,-6 -18.6,0Z M-18.6,-2 Q-27,3 -35,12 L-30,15 Q-24,6 -17.6,2Z" fill="#2f3a55" ${HO}/>`
    + `<path d="M-19.6,-6 Q0,-14 19.6,-6 L19.8,1.5 Q0,-6.5 -19.8,1.5Z" fill="#2f3a55" ${HO}/>` + hl('M-18.6,-0.6 Q0,-8 18.6,-0.6', '#1e2638', 1.6)
    + `<rect x="-7.5" y="-12.6" width="15" height="9.4" rx="2.2" fill="#c7cfdd" ${HO} stroke-width="1.8"/>` + hl('M-5.4,-10.8 H5.4', '#fff', 1.3) + hl('M-3.2,-6.6 Q0,-9.8 3.2,-6.6', '#56627a', 1.6),
  // Soul City
  horns: `<path d="M4,-18 C7,-26 7,-34 15,-41 C15,-31 15,-23 13,-14Z" fill="#b9ae96" ${HO}/>`
    + `<path d="M-13,-13 C-17,-24 -15,-35 -24,-45 C-9,-39 -2,-29 -2,-19Z" fill="#efe8d6" ${HO}/>`
    + hl('M-13.6,-23 L-5.4,-24.6 M-16,-30.5 L-8.6,-32.4 M-19.2,-37.6 L-13.4,-39', '#b8ad95', 1.6) + hl('M7,-25 L13,-25 M9,-32 L14.4,-32.4', '#968b74', 1.4)
    + hl('M-9,-18 Q-11,-28 -17,-37', '#fff', 1.4),
  // Kaio Planet
  martial: `<path d="M-19,-6 C-30,-11 -38,-2 -51,-8 L-49,-1 C-38,4 -30,-4 -19,-2Z M-19,-4 C-27,4 -32,12 -45,12 L-41,18 C-30,17 -25,6 -18,0Z" fill="#e8443a" ${HO}/>`
    + `<path d="M-20.4,-6 Q-2,-17.5 19.7,-10.5 L20.4,-4 Q0,-10 -20.5,0Z" fill="#e8443a" ${HO}/>`
    + hl('M-19,-0.6 Q0,-9 19.5,-4.6', '#b02a22', 2) + hl('M-12,-11 Q0,-15 10,-13', '#ff8a7a', 1.6)
    + `<circle cx="-19.6" cy="-3" r="3.8" fill="#c22f27" ${HO}/>`,
  // Shinjuku
  talisman: hl('M-20.4,-5 Q0,-18 19.6,-9', OL, 4.4) + hl('M-20.4,-5 Q0,-18 19.6,-9', '#c0392b', 2)
    + `<g transform="rotate(-6 12 -14)"><path d="M5.5,-21 H18.5 V11 L15.3,8.6 L12,11 L8.7,8.6 L5.5,11Z" fill="#f3e2a0" ${HO} stroke-width="1.8"/>`
    + hl('M12,-15.5 V-8 M8.5,-12 H15.5 M9,-4.5 Q12,-1.5 15,-4.5 M12,-2.5 V5 M9.5,3 H14.5', '#c0392b', 1.8)
    + `<circle cx="12" cy="-18.5" r="1.8" fill="#c0392b"/></g>`,
  // Green Island
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
// Faces in head-local space (radius 19). The face is turned to the right: near eye at x -2, far eye at x 9.5.
function faceSVG(face, expr, eye) {
  if (face === 'blank') return '';
  const E = eye || OL, e = `fill="${E}"`, st = `stroke="${E}" stroke-width="2.2" stroke-linecap="round" fill="none"`;
  const O2 = `stroke="${OL}" stroke-width="2" stroke-linejoin="round"`;
  const plain = ['dots', 'smile', 'fierce', 'scar', 'stitch'].includes(face);
  const scar = face === 'scar' ? `<path d="M7,-6 L12,9" stroke="#ff4d5e" stroke-width="2.2" stroke-linecap="round"/>` : '';
  if (expr === 'hurt' && plain) return `<path d="M-5,-1 l5,3 -5,3 M12.5,-1 l-5,3 5,3" ${st}/><path d="M1,12 Q4.5,9 8,12" ${st}/>` + scar;
  if (expr === 'happy' && plain) return `<path d="M-5,3 Q-2,-2 1,3 M7,3 Q9.5,-2 12,3" ${st}/><path d="M0,8 Q4.5,14 9.5,8" ${st}/>` + scar;
  const eyes = `<ellipse cx="-2" cy="1" rx="2.1" ry="3.1" ${e}/><ellipse cx="9.5" cy="1" rx="1.8" ry="2.9" ${e}/>`
    + `<circle cx="-1.3" cy="-0.4" r=".8" fill="#fff" opacity=".8"/><circle cx="10.1" cy="-0.4" r=".7" fill="#fff" opacity=".8"/>`;
  switch (face) {
    case 'dots': return eyes;
    case 'smile': return eyes + `<path d="M0.5,8.5 Q4.5,12.5 9,8.5" ${st}/>`;
    case 'fierce': return `<path d="M-6.5,-4.5 L1,-2 M13.5,-5 L7,-2" ${st}/><ellipse cx="-2" cy="2" rx="2" ry="2.4" ${e}/><ellipse cx="9.5" cy="2" rx="1.8" ry="2.3" ${e}/><path d="M1.5,10.5 H8" ${st}/>`;
    case 'scar': return eyes + scar + `<path d="M2,10.5 H7" ${st}/>`;
    case 'stitch': return eyes + `<path d="M-6.5,6.5 Q-2,8.6 2.6,6.4" fill="none" stroke="${OL}" stroke-width="1.6" stroke-linecap="round"/><path d="M-4.8,5 l.5,3.2 M-2,5.6 v3.2 M0.8,5 l-.4,3.2" stroke="${OL}" stroke-width="1.3" stroke-linecap="round"/>`;
    case 'patch': return `<path d="M-19,-7 Q2,-11 19.6,-3" fill="none" stroke="#15161b" stroke-width="2"/><ellipse cx="-2" cy="1" rx="2.1" ry="3.1" ${e}/><ellipse cx="9.5" cy="1" rx="5" ry="5.4" fill="#15161b" ${O2}/><path d="M6.5,-2 q3,-2 6,0" fill="none" stroke="#3a3d47" stroke-width="1.2"/>`;
    case 'mask': return `<ellipse cx="-2" cy="-1" rx="2" ry="2.8" ${e}/><ellipse cx="9.5" cy="-1" rx="1.8" ry="2.7" ${e}/><path d="M-18.7,4 Q2,1.5 18.8,3.4 A19,19 0 0,1 -18.7,4Z" fill="#323a4b" ${O2}/><path d="M-16,9 Q2,7 16.5,8.5 M-12,13.5 Q2,12 12,13" fill="none" stroke="#4c566b" stroke-width="1.3"/>`;
    case 'husk': return `<path d="M-10,-15 Q6,-19.5 17,-9 Q21.2,0 18.4,9 Q14.5,17.5 4,18.4 Q-8,18.4 -13.5,10 Q-17.5,2 -15.4,-7 Q-14,-12.5 -10,-15Z" fill="#f2ede0" ${O2}/>`
      + `<path d="M9,-15 Q15,-11 17,-4 Q12,-1 9,-15Z" fill="#d9d2c0"/><path d="M-7,-1.5 Q-2.5,-6 2,-1.5 Q-2.5,2.5 -7,-1.5Z M6,-2 Q10,-6 14,-2 Q10,2 6,-2Z" fill="#15161b"/>`
      + `<path d="M-4.5,10 H13 M-1.5,8 v5 M2,8 v5.6 M5.5,8 v5.6 M9,8 v5.6 M12,8 v4.6" stroke="#15161b" stroke-width="1.2"/><path d="M2,-17.5 L4,-8 M13,-14 L12,-6" stroke="#c0392b" stroke-width="2" stroke-linecap="round"/>`;
    case 'cursed': return eyes + `<path d="M-4,5.5 l1.5,4.5 M-0.5,5.5 l.6,3.6 M7.5,5.5 l1.5,4.5 M11,5.5 l.6,3.6" stroke="#36d6a8" stroke-width="1.8" stroke-linecap="round"/><circle cx="16" cy="7" r="1.4" fill="#36d6a8"/>`;
    case 'paint': return eyes + `<path d="M-8,6.5 l7,-1.2 M6,6.5 l7,-1.2" stroke="#5aa83a" stroke-width="2.8" stroke-linecap="round"/>`;
    case 'marble': return `<path d="M-14,-10 Q4,-17 19.2,-8 L19.6,2.5 Q13,5.5 8,1.5 Q3,5.5 -3,2.5 Q-11,3.5 -15.5,-0.5Z" fill="#f4f1ea" stroke="#d4a83a" stroke-width="1.8" stroke-linejoin="round"/><ellipse cx="-2" cy="-2" rx="2.6" ry="3" fill="#15161b"/><ellipse cx="9.5" cy="-2" rx="2.4" ry="2.9" fill="#15161b"/><path d="M-6,-8 q3,-3 6,0 M7,-9 q3,-3 6,0" fill="none" stroke="#d4a83a" stroke-width="1.2"/>`;
    case 'rifteye': return `<circle cx="4" cy="0" r="10" fill="#ff3fb4" opacity=".28"/><ellipse cx="4" cy="0" rx="6.5" ry="7.5" fill="#ff3fb4" ${O2}/><ellipse cx="4" cy="0" rx="4" ry="5.5" fill="#ffe3f4"/><rect x="3" y="-5" width="2" height="10" rx="1" fill="#15161b"/>`;
    case 'shades': return `<path d="M-7.5,-3 H16 L15.2,2.6 Q11.6,6 8.2,2.8 L6.6,-0.4 L4.6,2.8 Q0,6.2 -4.6,2.6 Q-7.4,1 -7.5,-3Z" fill="#15161b" ${O2}/><path d="M-4.5,-1 l3.4,0 M9,-1 l3.2,0" stroke="#7a849c" stroke-width="1.6" stroke-linecap="round"/><path d="M1.5,10.5 Q5,12 8.5,10" ${st}/>`;
    case 'blindfold': return `<path d="M-19.3,-4.5 Q2,-10 19.8,-5.5 L19.6,4.5 Q2,0.5 -19,6Z" fill="#15161b" ${O2}/><path d="M-17,1.5 Q2,-4 18,-0.5" fill="none" stroke="#2c2f3a" stroke-width="1.6"/>`;
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

/* ================================================================ shapes */
// Ink styles. body: skin · far: far-side limbs · sh: cel shadow · line: every outline.
const STYLES = {
  flat:   (ink) => ({ body: ink, far: shade(ink, -0.12), sh: shade(ink, -0.25), line: OL, eye: OL, sticker: 1 }),
  ink:    (ink) => ({ body: '#13151c', far: '#1b1e27', sh: '#08090d', line: '#e9ecf3', eye: ink, sticker: 1 }),
  neon:   (ink) => ({ body: '#06070b', far: '#0a0c11', sh: '#000000', line: ink, eye: ink, filter: 'avNeon' }),
  sketch: () => ({ body: '#ebe6da', far: '#ddd6c6', sh: '#c9c2b2', line: '#1d1d1f', eye: '#1d1d1f', filter: 'avSketch' }),
};
let LINE = OL;   // outline colour of the figure being drawn (set by drawAvatar)
// Smooth path through points (Catmull-Rom). A point [x, y, 1] is a sharp corner.
function spline(P, closed) {
  const n = P.length;
  const at = (i) => (closed ? P[(i + n) % n] : P[Math.max(0, Math.min(n - 1, i))]);
  let d = `M${pt(P[0])}`;
  for (let i = 0; i < (closed ? n : n - 1); i++) {
    const p0 = at(i - 1), p1 = at(i), p2 = at(i + 1), p3 = at(i + 2);
    const c1 = p1[2] ? [p1[0] + (p2[0] - p1[0]) / 3, p1[1] + (p2[1] - p1[1]) / 3] : [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
    const c2 = p2[2] ? [p2[0] - (p2[0] - p1[0]) / 3, p2[1] - (p2[1] - p1[1]) / 3] : [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
    d += `C${pt(c1)} ${pt(c2)} ${pt(p2)}`;
  }
  return closed ? d + 'Z' : d;
}
// A filled shape with an ink outline painted behind the fill (so it only shows outside,
// and every sub-shape of one path merges into a single silhouette).
const ink = (d, fill, w) => `<path d="${d}" fill="${fill}" stroke="${LINE}" stroke-width="${w || 2.2}" stroke-linejoin="round" stroke-linecap="round" paint-order="stroke"/>`;
const fillP = (d, fill, op) => `<path d="${d}" fill="${fill}"${op != null ? ` opacity="${op}"` : ''}/>`;
const lineP = (d, col, w, op) => `<path d="${d}" fill="none" stroke="${col}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"${op != null ? ` opacity="${op}"` : ''}/>`;
const inkLine = (d, col, w) => lineP(d, LINE, w + 2) + lineP(d, col, w);
// Points along a limb (t 0 = root, 0.5 = elbow or knee, 1 = wrist or ankle): straight bones
// blended with a little of the smooth curve through the joint, so bends are soft but never loop.
function bez(L, t0, t1, n) {
  const [a, j, b] = L, c = [2 * j[0] - (a[0] + b[0]) / 2, 2 * j[1] - (a[1] + b[1]) / 2], out = [];
  n = n || 6;
  for (let i = 0; i <= n; i++) {
    const t = t0 + ((t1 - t0) * i) / n, u = 1 - t;
    const q = [u * u * a[0] + 2 * u * t * c[0] + t * t * b[0], u * u * a[1] + 2 * u * t * c[1] + t * t * b[1]];
    const k = t <= 0.5 ? t * 2 : (t - 0.5) * 2, s0 = t <= 0.5 ? a : j, s1 = t <= 0.5 ? j : b;
    const l = [s0[0] + (s1[0] - s0[0]) * k, s0[1] + (s1[1] - s0[1]) * k];
    out.push([l[0] * 0.72 + q[0] * 0.28, l[1] * 0.72 + q[1] * 0.28]);
  }
  return out;
}
const lerpW = (n, w0, w1) => [...Array(n + 1)].map((_, i) => w0 + ((w1 - w0) * i) / n);
const nrm = (C, i) => {
  const a = C[Math.max(0, i - 1)], b = C[Math.min(C.length - 1, i + 1)], tx = b[0] - a[0], ty = b[1] - a[1], l = Math.hypot(tx, ty) || 1;
  return [-ty / l, tx / l, tx / l, ty / l];
};
const offsetVar = (C, ds) => C.map((p, i) => { const [nx, ny] = nrm(C, i); return [p[0] + nx * ds[i], p[1] + ny * ds[i]]; });
// A limb-shaped tube along a centre line with per-point half-widths; round or open (flat) ends.
function tube(C, hw, o) {
  o = o || {};
  const n = C.length, L = offsetVar(C, hw), R = offsetVar(C, hw.map((h) => -h));
  const cap = (i, s) => {
    const [nx, ny, tx, ty] = nrm(C, i), h = hw[i], p = C[i];
    return [[p[0] + (nx + tx * s) * 0.72 * h, p[1] + (ny + ty * s) * 0.72 * h], [p[0] + tx * s * h, p[1] + ty * s * h], [p[0] + (-nx + tx * s) * 0.72 * h, p[1] + (-ny + ty * s) * 0.72 * h]];
  };
  if (o.flatStart) { L[0].push(1); R[0].push(1); }
  if (o.flatEnd) { L[n - 1].push(1); R[n - 1].push(1); }
  const P = L.slice();
  if (!o.flatEnd) P.push(...cap(n - 1, 1));
  P.push(...R.reverse());
  if (!o.flatStart) P.push(...cap(0, -1).reverse());
  return P;
}
// The cel shadow of a tube: a band on the side facing away from the light (upper left).
function tubeBand(C, hw, k0, k1) {
  const n = C.length, [nx, ny] = nrm(C, Math.floor(n / 2));
  const s = nx + 0.5 * ny >= 0 ? 1 : -1;
  const Ou = offsetVar(C, hw.map((h) => s * h * (k1 || 0.93))), In = offsetVar(C, hw.map((h) => s * h * (k0 || 0.3))).reverse();
  for (const A of [Ou, In]) { A[0].push(1); A[n - 1].push(1); }
  return Ou.concat(In);
}
// Local frame at a point on the torso: +x to the right (front), +y down the spine.
const frame = (J, p, inner) => `<g transform="translate(${pt(p)}) rotate(${r1(180 - J.chestA)})">${inner}</g>`;

/* ---------------------------------------------------------------- torso */
// The torso is mapped as (u, v): u from -1 (left edge) to 1 (right edge), v from 0 (pelvis) to 1 (neck).
const TORSO_W = [[-0.4, 13.2], [0, 13.2], [0.3, 12.2], [0.6, 13], [0.84, 14.2], [0.97, 12.6], [1.1, 5.4], [1.4, 4.2]];
function hwAt(v) {
  if (v <= TORSO_W[0][0]) return TORSO_W[0][1];
  for (let i = 1; i < TORSO_W.length; i++) if (v <= TORSO_W[i][0]) { const [a, x] = TORSO_W[i - 1], [b, y] = TORSO_W[i]; return x + ((y - x) * (v - a)) / (b - a); }
  return TORSO_W[TORSO_W.length - 1][1];
}
function torsoMap(J, W) {
  const tw = J.tw || 0, k = 1 - 0.14 * tw;
  const a = J.pelvis, j = J.waist, b = J.neckBase, c = [2 * j[0] - (a[0] + b[0]) / 2, 2 * j[1] - (a[1] + b[1]) / 2];
  return (u, v, ex, corner) => {
    const w = 1 - v, p = [w * w * a[0] + 2 * w * v * c[0] + v * v * b[0], w * w * a[1] + 2 * w * v * c[1] + v * v * b[1]];
    const dx = 2 * w * (c[0] - a[0]) + 2 * v * (b[0] - c[0]), dy = 2 * w * (c[1] - a[1]) + 2 * v * (b[1] - c[1]), l = Math.hypot(dx, dy) || 1;
    u += tw * 0.45 * Math.max(0, 1 - Math.abs(u));
    const hw = (hwAt(v) + (ex || 0)) * W * k, q = [p[0] - (dy / l) * u * hw, p[1] + (dx / l) * u * hw];
    if (corner) q.push(1);
    return q;
  };
}
// Outline of the torso (or a garment on it) from v0 up to v1, with round shoulders when it reaches the neck.
function torsoOutline(M, v0, v1, ex, soft) {
  const vs = [v0];
  for (const v of [0.12, 0.3, 0.5, 0.68, 0.84]) if (v > v0 + 0.05 && v < v1 - 0.05) vs.push(v);
  const top = v1 >= 0.95
    ? [M(-0.97, 0.9, ex), M(-0.72, 1.0, ex), M(-0.32, 1.05, ex), M(0.32, 1.05, ex), M(0.72, 1.0, ex), M(0.97, 0.9, ex)]
    : [M(-1, v1, ex, 1), M(1, v1, ex, 1)];
  const L = vs.map((v, i) => M(-1, v, ex, i === 0 && !soft)), R = vs.slice().reverse().map((v, i) => M(1, v, ex, i === vs.length - 1 && !soft));
  return soft ? [...L, ...top, ...R, M(0.55, v0 - 0.035, ex), M(-0.55, v0 - 0.035, ex)] : [...L, ...top, ...R];
}
function torsoShade(M, v0, v1, ex, u0) {
  const vs = [...Array(7)].map((_, i) => v0 + ((v1 - v0) * i) / 6);
  return vs.map((v, i) => M(0.95, v, ex, i === 0 || i === 6)).concat(vs.slice().reverse().map((v, i) => M(u0 || 0.42, v, ex, i === 0 || i === 6)));
}

/* ---------------------------------------------------------------- hands and feet */
// Shapes in a local frame: +x along the forearm / towards the toe.
const FIST = spline([[-1.2, -4.6], [3.6, -5.7], [8, -3.9], [9.5, 0.4], [7.7, 4.5], [3, 5.5], [-1.2, 4.3], [-2.6, 0]], true);
const FOOT = spline([[-4, -3.4], [2, -4], [8, -2.2], [12.4, 0.6], [12.3, 3.6, 1], [-4.4, 3.6, 1], [-5.6, 0.4]], true);
const SHOE = spline([[-5, -4.6], [1.6, -5.6], [8.2, -3.6], [13.6, 0.4], [13.8, 4.6, 1], [-5.8, 4.6, 1], [-6.8, 0]], true);
const SOLE = 'M-6.2,3 H13.8 Q15.4,3 15.4,4.6 Q15.4,6.2 13.8,6.2 H-6.2 Q-7.6,6.2 -7.6,4.6 Q-7.6,3 -6.2,3Z';

/* ---------------------------------------------------------------- hair */
// Head-local polar point: 0° = right, -90° = up, ±180° = left. The head faces the viewer.
const HP = (a, r) => [Math.cos(a * D2R) * r, Math.sin(a * D2R) * r];
// Spiky anime hair is a handful of big clumps (V shapes) around the crown plus a fringe of
// pointed strands over the forehead, read as one clean silhouette with a few inner lines.
// sp: crown spikes from left to right [angle, length, lean] (lean defaults to fanning outwards)
// fr: fringe tips [x, y] from right to left · line: hairline height · side: how low it reaches at the temples
// fan: how much the spikes fan outwards · c / sh / hi: colour, cel shadow, highlight
const HAIR = {
  tuft:   { c: '#23242c', sh: '#101116', hi: '#5c5f73', line: -8, side: 5, fan: 0.3,
    sp: [[-176, 7], [-160, 9], [-144, 8], [-128, 10], [-112, 9], [-96, 11], [-80, 10], [-64, 11], [-48, 9], [-32, 10], [-16, 8], [-2, 7]],
    fr: [[13, 4], [7, 7], [1, 4], [-5, 7], [-11, 4.5]] },
  mop:    { c: '#1d1e24', sh: '#0c0d11', hi: '#4c5062', line: -8.5, side: 8, fan: 0.4,
    sp: [[-178, 5], [-158, 6], [-138, 6], [-118, 7], [-98, 7], [-78, 7], [-58, 7], [-38, 6], [-18, 6], [0, 5]],
    fr: [[13, 7], [7, 9], [1, 7], [-5, 9], [-11, 7]] },
  spikes: { c: '#ffd23a', sh: '#e39a12', hi: '#fff4b8', line: -9, side: 3, fan: 0.22, k: 0.75,
    sp: [[-174, 11], [-152, 15], [-130, 18], [-108, 20], [-88, 21], [-68, 19], [-46, 17], [-24, 14], [-4, 10]],
    fr: [[11, 4], [3, 7], [-5, 4], [-12, 3]] },
  ember:  { c: '#ff8a2b', sh: '#c85612', hi: '#ffc896', line: -8, side: 4, fan: 0.3, k: 0.85,
    sp: [[-172, 9], [-150, 13], [-128, 15], [-106, 16, 6], [-84, 17, 10], [-62, 16, 14], [-40, 15, 16], [-18, 12, 16], [0, 9, 14]],
    fr: [[12, 4], [4, 7.5], [-4, 3.5], [-11, 5.5]] },
  flame:  { c: '#ffd84a', sh: '#eb9b10', hi: '#fffbe0', line: -9, side: 2, fan: 0.16, k: 0.8,
    sp: [[-168, 14], [-144, 22], [-120, 30], [-96, 36], [-74, 33], [-52, 26], [-30, 19], [-8, 12]],
    fr: [[9, 2], [3, 8.5], [-4, 3], [-10, 5]] },
  frost:  { c: '#f1f3f8', sh: '#aab3c6', hi: '#ffffff', line: -7, side: 0, fan: 0.08,
    sp: [[-170, 8], [-150, 12], [-130, 15], [-110, 17], [-90, 18], [-70, 17], [-50, 15], [-30, 12], [-10, 8]],
    fr: [[13, -4], [7, -2], [1, -4.5], [-5, -2], [-11, -4]] },
  wild:   { c: '#2f8a3c', sh: '#1a5a24', hi: '#86dc6e', line: -7, side: 2, fan: 0.05, bias: -6, k: 0.8,
    sp: [[-172, 10], [-152, 18], [-132, 26], [-112, 32], [-94, 34], [-76, 30], [-58, 24], [-38, 16], [-18, 10]],
    fr: [[11, -3], [5, -1], [-1, -3.5]] },
  swept:  { c: '#2b2340', sh: '#15102a', hi: '#8f74cc', line: -10, side: 4, fan: 0.5,
    sp: [[-170, 4], [-145, 6], [-120, 7], [-95, 8], [-70, 7], [-45, 6], [-20, 5]], fr: [] },
  crest:  { c: '#ff4fbf', sh: '#8b2bd6', hi: '#ffd6f0', line: -8.5, side: 3, fan: 0.05, k: 0.8,
    sp: [[-160, 4], [-134, 6], [-112, 16], [-96, 26], [-84, 28], [-70, 18], [-46, 6], [-20, 4]],
    fr: [[6, -1], [-2, 1.5]] },
};
// Hats that cover the crown flatten the top spikes; headbands leave them standing.
const HAT_COVER = { bucket: 1, chef: 1, tricorn: 1, beast: 1, bandana: 1 };
// Returns the hair silhouette path and its inner lines (head-local, head radius 19).
function hairShape(id, covered) {
  const h = HAIR[id];
  if (!h) return null;
  const RV = 19.4, side = h.side, sx = Math.sqrt(RV * RV - side * side);
  const hy = (x) => h.line + Math.pow(x / 17, 2) * 4.5;
  const sp = h.sp.map(([a, len, lean]) => {
    if (covered && a < -32 && a > -150) len *= 0.15;
    return [a, len * (h.k || 1), lean != null ? lean : (a + 90) * h.fan + (h.bias || 0)];
  });
  let d = `M${r1(-sx)},${r1(side)}`, lines = '';
  const tipOf = ([a, len, lean]) => HP(a + lean, RV + len);
  sp.forEach((s, i) => {
    const prevA = i ? sp[i - 1][0] : Math.atan2(side, -sx) / D2R - 360, nextA = i < sp.length - 1 ? sp[i + 1][0] : Math.atan2(side, sx) / D2R;
    const v0 = HP((prevA + s[0]) / 2, RV + (i ? 1 : 0)), v1 = HP((s[0] + nextA) / 2, RV + (i < sp.length - 1 ? 1 : 0)), tip = tipOf(s);
    const ax = HP(s[0] + s[2] * 0.4, RV + s[1] * 0.5);   // the clump's axis: its edges bow towards it
    const bow = (p) => [p[0] + (ax[0] - p[0]) * 0.16, p[1] + (ax[1] - p[1]) * 0.16];
    if (!i) d += `L${pt(v0)}`;
    d += `Q${pt(bow([(v0[0] + tip[0]) / 2, (v0[1] + tip[1]) / 2]))} ${pt(tip)}Q${pt(bow([(v1[0] + tip[0]) / 2, (v1[1] + tip[1]) / 2]))} ${pt(v1)}`;
    if (s[1] > 9 && i % 2) lines += `M${pt(HP(s[0] + 4, RV - 3))}Q${pt(HP(s[0] + s[2] * 0.3, RV + s[1] * 0.3))} ${pt(HP(s[0] + s[2] * 0.7, RV + s[1] * 0.62))}`;
  });
  d += `L${r1(sx)},${r1(side)}`;
  // the fringe, from the right temple to the left one
  let prev = [Math.min(sx - 1, 16.5), hy(16.5)];
  d += `Q${r1(sx - 1)},${r1((side + prev[1]) / 2)} ${pt(prev)}`;
  h.fr.forEach(([x, y], i) => {
    const nx = i < h.fr.length - 1 ? (x + h.fr[i + 1][0]) / 2 : -16.5, nb = [nx, hy(nx) + (i < h.fr.length - 1 ? 2 : 0)];
    d += `Q${r1(prev[0] - (prev[0] - x) * 0.15)},${r1(y - (y - prev[1]) * 0.45)} ${r1(x)},${r1(y)}Q${r1(x - (x - nb[0]) * 0.15)},${r1(nb[1] + (y - nb[1]) * 0.5)} ${pt(nb)}`;
    prev = nb;
  });
  if (!h.fr.length) d += `Q0,${r1(h.line - 2)} -16.5,${r1(hy(-16.5))}`;
  d += `Q${r1(-sx + 1)},${r1((side + hy(-16.5)) / 2)} ${r1(-sx)},${r1(side)}Z`;
  return { d, lines, h };
}

/* ---------------------------------------------------------------- outfits */
// top: c colour · fit extra width · hem (v of its lower edge) · sl sleeve length (0 none, 0.9 to the wrist)
//      slc sleeve colour · wide (loose sleeve flare) · cuff · open (vest showing the chest) · v (inner V)
//      kimono (crossed lapels) · band [v, colour] across the shoulders · zip · buttons · emblem · trim
//      collar 'high' (cc colour, ch height) · chain · tails (coat length below the waist)
// bot: c colour · len (0.55 shorts, 1 full) · flare · cuff · fur cuff · wrap (bandage on the near thigh)
// sash [colour, knot position u] · belt · shoe [kind, colour] · wrist band colour
const OUTFITS = {
  tee:      { top: { c: '#5a6880', sl: 0.34, hem: -0.08 }, bot: { c: '#30364a', len: 1, flare: 0.6 }, belt: '#3a2a22', shoe: ['shoe', '#3a2c24'] },
  corsair:  { top: { c: '#d8343f', sl: 0.36, cuff: '#b8242f', open: 'skin', trim: '#ffd060', hem: -0.06 }, bot: { c: '#3460c4', len: 0.52, flare: 1.4, fur: '#f1ead8' }, sash: ['#f4c430', -0.55], shoe: ['sandal', '#9a6a3a'] },
  shinobi:  { top: { c: '#ff8a1f', sl: 0.88, cuff: '#22252e', band: [0.64, '#22252e'], zip: '#e9e9ee', collar: 'high', cc: '#ff8a1f', ch: 3, hem: -0.14, fit: 2.8 }, bot: { c: '#ff8a1f', len: 1, flare: 1.6, wrap: '#ecebe6' }, shoe: ['sandal', '#2f4a8a'] },
  reaper:   { top: { c: '#1b1c22', sl: 0.7, wide: 6, v: '#f2f0ea', kimono: 1, hem: -0.18, fit: 2.8 }, bot: { c: '#1b1c22', len: 1, flare: 7 }, sash: ['#f2f0ea', 0.62], shoe: ['tabi', '#c9a66b'] },
  gi:       { top: { c: '#ff7a1a', sl: 0.3, slc: '#2b4fb8', v: '#2b4fb8', emblem: '#f6f2e8', hem: -0.1, fit: 2.8 }, bot: { c: '#ff7a1a', len: 1, flare: 2.6 }, sash: ['#2b4fb8', 0.32], wrist: '#2b4fb8', shoe: ['boot', '#2b4fb8'] },
  uniform:  { top: { c: '#1f2433', sl: 0.9, collar: 'high', ch: 5, buttons: '#f4c66a', zip: '#2c3348', hem: -0.3, fit: 3 }, bot: { c: '#1f2433', len: 1, flare: 1.4 }, shoe: ['shoe', '#121418'] },
  wilds:    { top: { c: '#3aa84a', sl: 0.32, cuff: '#2a7a35', v: '#e9e4d2', hem: -0.1, fit: 2.6 }, bot: { c: '#2f8a3c', len: 0.55, flare: 1 }, belt: '#8a5a2b', shoe: ['boot', '#2f6a2c'] },
  longcoat: { top: { c: '#1a1c26', sl: 0.9, cuff: '#f4c66a', collar: 'high', ch: 4, cc: '#1a1c26', chain: '#f4c66a', trim: '#f4c66a', tails: 92, hem: 0, fit: 3.2 }, bot: { c: '#262836', len: 1 }, shoe: ['shoe', '#121418'] },
  riftwear: { top: { c: '#2c1846', sl: 0.9, cuff: '#ff3fb4', trim: '#ff3fb4', zip: '#ff3fb4', collar: 'high', cc: '#1a0f2a', ch: 3, hem: -0.12, fit: 2.8 }, bot: { c: '#2c1846', len: 1, flare: 1 }, sash: ['#ff3fb4', 0.3], wrist: '#ff3fb4', shoe: ['boot', '#ff3fb4'] },
};

/* ---------------------------------------------------------------- flame auras */
// Flickering flames hugging the body in three layers (soft outer glow, mid, hot core),
// with tongues licking upwards and small flames breaking off and rising.
function flameAura(cx, t, cols, o) {
  o = o || {};
  const base = 230, H = o.h || 196, w = o.w || 50, n = 15, out = [];
  [[1, 1, 0.55, 1], [0.78, 0.86, 0.65, 0], [0.5, 0.66, 0.6, 0]].forEach(([kw, kh, op, blur], li) => {
    const v = [];
    for (let i = 0; i <= n; i++) {
      const ph = Math.PI * (1 - i / n), up = Math.pow(Math.sin(ph), 0.5);
      v.push([cx + Math.cos(ph) * w * kw * (0.66 + 0.34 * Math.sin(Math.PI * Math.min(1, up * 1.1))), base - H * kh * up]);
    }
    let d = `M${pt(v[0])}`;
    for (let i = 0; i < n; i++) {
      const a = v[i], b = v[i + 1], m = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
      const ph = Math.PI * (1 - (i + 0.5) / n), s = Math.sin(ph), side = Math.cos(ph);
      const L = (5 + 26 * s * s) * kh * (0.75 + 0.45 * (0.5 + 0.5 * Math.sin(t * 8.5 + i * 2.3 + li * 1.7)));
      const tip = [m[0] + side * L * 0.45 + Math.sin(t * 3.2 + i) * 2.2, m[1] - L * (0.55 + 0.45 * s)];
      d += `Q${r1(a[0] + side * 2)},${r1(a[1] - L * 0.55)} ${pt(tip)}Q${r1(m[0] + (b[0] - m[0]) * 0.3)},${r1(b[1] - L * 0.25)} ${pt(b)}`;
    }
    out.push(`<path d="${d}Z" fill="${cols[li]}" opacity="${op}"${blur ? ' filter="url(#avBlur)"' : ''}/>`);
  });
  for (let i = 0; i < 4; i++) {
    const k = (t * 0.7 + i / 4) % 1, x = cx + (i % 2 ? 1 : -1) * (w * 0.55 + Math.sin(t * 2 + i) * 6), y = base - H * (0.35 + k * 0.75), r = (1 - k) * 5 + 2;
    out.push(`<path d="M${r1(x - r)},${r1(y)}Q${r1(x - r)},${r1(y + r * 1.1)} ${r1(x)},${r1(y + r * 1.2)}Q${r1(x + r)},${r1(y + r * 1.1)} ${r1(x + r)},${r1(y)}Q${r1(x + r * 0.4)},${r1(y - r)} ${r1(x)},${r1(y - r * 2.6)}Q${r1(x - r * 0.4)},${r1(y - r)} ${r1(x - r)},${r1(y)}Z" fill="${cols[1]}" opacity="${r1(0.85 * (1 - k))}"/>`);
  }
  return out.join('');
}
function bolts(cx, t, col) {
  if (Math.sin(t * 11) < 0.2) return '';
  const k = Math.floor(t * 5) % 3, z = (x, y, s) => `M${r1(x)},${r1(y)} l${6 * s},11 -5,3 ${8 * s},13 -4,2 ${6 * s},11`;
  const d = [z(cx - 46 + k * 6, 70 + k * 16, 1), z(cx + 42 - k * 4, 104 - k * 12, -1), z(cx - 30 + k * 18, 150 - k * 8, 1)].join('');
  return lineP(d, col, 5, 0.4) + lineP(d, '#fff', 2);
}

/* ---------------------------------------------------------------- the figure */
// Built like the concept art: a homogeneous body read as one silhouette. Arms hanging at the
// sides sit behind the torso, so the shoulder covers where they join; the trousers are one "Π"
// (hips and the tops of both legs merged); the bare body is one bean shape over the legs.
// Line weight: every piece has only a thin inner line; the thick outer contour and the pale rim
// around the whole figure come from one filter (avStk). Cel shading: each piece is clipped to
// itself and a lit copy shifted up-left leaves a crisp shadow on its lower right edge.
const area = (P) => P.reduce((a, p, i) => { const q = P[(i + 1) % P.length]; return a + p[0] * q[1] - q[0] * p[1]; }, 0);
const wind = (P) => (area(P) > 0 ? P.slice().reverse() : P);
// One path made of several closed shapes wound the same way: it fills and outlines as a single silhouette.
const union = (...shapes) => shapes.filter(Boolean).map((P) => spline(wind(P), true)).join('');
function drawAvatar(A, P, t, opt) {
  const B = cosOf('build', A.build).b, skin = A.ink || cosOf('color', A.color).ink;
  const St = STYLES[A.style] ? STYLES[A.style](skin) : STYLES.flat(skin);
  LINE = St.line;
  const J = solve(P, B), W = B.w, M = torsoMap(J, W), out = [];
  const O = OUTFITS[A.outfit] || null, T = O && O.top, Bt = O && O.bot;
  const sway = Math.sin(t * 2.1), air = P.air || 0;
  const col = (v, far) => (v === 'skin' ? (far ? St.far : St.body) : far ? shade(v, -0.1) : v);
  const shd = (v, far) => (v === 'skin' ? (far ? shade(St.sh, -0.08) : St.sh) : lum(v) < 0.2 ? shade(v, 0.16) : shade(v, far ? -0.32 : -0.24));
  const uid = (opt.uid || 'av') + '_';
  let nClip = 0;
  const cel = (d, fill, sh, k) => {
    const id = uid + nClip++, dx = -2.3 * (k || 1), dy = -1.7 * (k || 1);
    return `<clipPath id="${id}"><path d="${d}"/></clipPath>` + ink(d, fill)
      + `<g clip-path="url(#${id})"><path d="${d}" fill="${sh}"/><path d="${d}" fill="${fill}" transform="translate(${dx},${dy})"/></g>`;
  };
  const piece = (P2, c, far, k) => cel(spline(P2, true), col(c, far), shd(c, far), k);
  const cx = J.pelvis[0], cy = (J.pelvis[1] + J.neckBase[1]) / 2;
  const feetX = (J.lF[2][0] + J.lB[2][0]) / 2;
  out.push(`<ellipse cx="${r1(feetX)}" cy="${GROUND + 1}" rx="${r1(30 - air * 0.4)}" ry="5" fill="#000" opacity="${r1(0.45 - air * 0.01)}"/>`);
  const aura = auraSVG(A.aura, cx, cy, t);
  if (aura) out.push(AURA_GLOW[A.aura] ? `<g style="mix-blend-mode:screen">${aura}</g>` : aura);
  // opt.weapon: an item id, '' for bare hands, or undefined for your equipped weapon
  const worn = opt.weapon !== undefined ? opt.weapon || null : S.equip && S.equip.weapon;
  const kind = worn && weaponKind(worn);
  const onHand = ['fist', 'claw'].includes(kind);
  const sheathed = worn && !onHand && (P.sh || P.prop) ? worn : null;
  const G = gearSVG(A, J, P, t, B, M, { sheathed, O });
  if (G.fx) out.push(G.fx);
  if (P.fx) out.push(fxSVG(P.fx, J, worn ? RCOL[Math.min(6, typeof rarity === 'function' ? rarity(worn) : 1)] : skin));
  const hs = J.headR / 19, ha = (P.h || 0) + (180 - J.neckA) * 0.6;
  const onHead = (inner) => `<g transform="translate(${pt(J.head)}) rotate(${r1(ha)}) scale(${r1(hs * 1000) / 1000})">${inner}</g>`;
  const fig = [G.back];

  // ---- limbs
  const crease = (C, i, hw) => {
    const [nx, ny, tx, ty] = nrm(C, i), s = nx + 0.5 * ny >= 0 ? 1 : -1, p = C[i];
    const a = [p[0] + nx * s * hw * 0.8, p[1] + ny * s * hw * 0.8], b = [p[0] + nx * s * hw * 0.1 + tx * 3, p[1] + ny * s * hw * 0.1 + ty * 3];
    return lineP(`M${pt(a)}Q${r1((a[0] + b[0]) / 2 + tx * 2)},${r1((a[1] + b[1]) / 2 + ty * 2)} ${pt(b)}`, LINE, 1, 0.5);
  };
  // an arm: skin, sleeve, cuff, wrist band, and an oval mitten hand
  const arm = (Ar, fa, far) => {
    const n = 8, C = bez(Ar, 0, 1, n), sk = far ? St.far : St.body;
    let s = cel(spline(tube(C, lerpW(n, 4.6 * W, 4 * W)), true), sk, shd('skin', far), 0.8);
    if (T && T.sl) {
      const Cs = bez(Ar, -0.08, T.sl, n), w1 = (T.wide ? 6.4 + T.wide : 6.4) * W, hw = lerpW(n, 7.2 * W, w1), c = T.slc || T.c;
      s += piece(tube(Cs, hw, { flatEnd: 1 }), c, far);
      if (T.sl > 0.55) s += crease(Cs, Math.round(n * 0.55), hw[4]);
      if (T.cuff) s += piece(tube(bez(Ar, T.sl - 0.08, T.sl, 2), [w1 + 0.2, w1 + 0.35, w1 + 0.5], { flatStart: 1, flatEnd: 1 }), T.cuff, far, 0.6);
    }
    if (O && O.wrist) s += piece(tube(bez(Ar, 0.78, 0.93, 2), [5.4 * W, 5.3 * W, 5.2 * W], { flatStart: 1, flatEnd: 1 }), O.wrist, far, 0.6);
    const hp = add(Ar[2], fa, 4.2 * W), r = rotTo(fa);
    const hand = `<g transform="translate(${pt(hp)}) rotate(${r})">${cel('M-6.6,-0.4C-6.6,-5.4 -3.4,-7 0.6,-7C5,-7 7.6,-4 7.6,0C7.6,4.2 4.8,7 0.4,7C-3.6,7 -6.6,4.6 -6.6,-0.4Z', sk, shd('skin', far), 0.8)}</g>`;
    return { s, hand, hp };
  };
  // the foot: a rounded stub (or shoe) pointing the way the foot points, never upside down
  const shoe = (L, far) => {
    let a = Math.atan2(L[3][0] - L[2][0], L[3][1] - L[2][1]) / D2R;
    const flip = Math.sin(a * D2R) < 0, sk = far ? St.far : St.body;
    const [k, c] = (O && O.shoe) || ['bare'];
    const foot = 'M-6.5,-4.6 C-1,-5.6 5,-5 8.6,-2 C10.4,-0.4 10.4,3.4 9.6,4.6 L-7,4.6 C-8,2 -8,-2.4 -6.5,-4.6Z';
    const boot = 'M-7.4,-6.2 C-1,-7.2 6,-6.4 9.8,-2.6 C11.8,-0.8 11.8,3.8 11,5.2 L-8,5.2 C-9,2.4 -9,-3.4 -7.4,-6.2Z';
    let g;
    if (k === 'sandal') g = piece([[-8.6, 3.2, 1], [11.6, 3.2, 1], [11.6, 6.4, 1], [-8.6, 6.4, 1]], c, far, 0.4) + cel(foot, sk, shd('skin', far), 0.6) + inkLine('M1.6,-5 Q3.4,-0.6 2.4,3.6', col(c, far), 1.8);
    else if (k === 'tabi') g = piece([[-8.6, 3.4, 1], [11.6, 3.4, 1], [11.6, 6.4, 1], [-8.6, 6.4, 1]], c, far, 0.4) + cel(foot, far ? '#d6d2c6' : '#f2f0ea', '#c4c0b4', 0.6) + inkLine('M4.5,-4.6 L2.6,3.6', '#2a2a30', 1.3);
    else if (k === 'shoe' || k === 'boot') g = cel(boot, col(c, far), shd(c, far), 0.7) + fillP('M-8.2,3 H11.4 V5.2 H-8.2Z', shade(c, -0.42));
    else g = cel(foot, sk, shd('skin', far), 0.6);
    const tr = flip ? `translate(${pt(L[2])}) scale(-1,1) rotate(${rotTo(-a)})` : `translate(${pt(L[2])}) rotate(${rotTo(a)})`;
    return `<g transform="${tr} scale(${r1(W * (far ? 0.92 : 1) * 100) / 100})">${g}</g>`;
  };
  const legC = (L) => bez(L, -0.04, 1, 8);
  const legW = (n) => lerpW(n, 6.4 * W, 5.4 * W);
  const pantW = (n) => [...Array(n + 1)].map((_, i) => W * (i <= n / 2 ? 9.8 - 1.2 * (i / (n / 2)) : 8.6 + (Bt.flare || 0) * 0.9 * ((i - n / 2) / (n / 2))));
  // details on a trouser leg (creases, bandage, fur cuff) and boots, drawn over the merged trousers
  const legDetails = (L, far) => {
    const n = 8;
    let s = '';
    if (Bt) {
      const Cp = bez(L, -0.06, Bt.len, n), hw = pantW(n);
      if (Bt.len > 0.7) s += crease(Cp, Math.round(n * 0.5), hw[4]) + crease(Cp, n - 1, hw[n - 1]);
      if (Bt.wrap && !far) s += piece(tube(bez(L, 0.36, 0.5, 3), [10.2, 10, 9.8, 9.7].map((x) => x * W), { flatStart: 1, flatEnd: 1 }), Bt.wrap, far, 0.5)
        + (() => { const C = bez(L, 0.43, 0.43, 1)[0], [nx, ny] = nrm(bez(L, 0.4, 0.46, 2), 1), w = 9.6 * W; return lineP(`M${r1(C[0] - nx * w)},${r1(C[1] - ny * w)}L${r1(C[0] + nx * w)},${r1(C[1] + ny * w)}`, '#b9b6ad', 1.2); })();
      if (Bt.fur) {
        const E = bez(L, Bt.len - 0.07, Bt.len + 0.01, 2), e = hw[n] + 0.4 * W;
        s += piece(tube(E, [e + 0.6, e + 1, e + 0.8], { flatStart: 1, flatEnd: 1 }), Bt.fur, far, 0.5);
      }
    }
    if (O && O.shoe && O.shoe[0] === 'boot') {
      const Cb = bez(L, 0.7, 1, 4), c = O.shoe[1], bw = [7.2, 7, 6.8, 6.6, 6.4].map((x) => x * W);
      s += piece(tube(Cb, bw, { flatStart: 1 }), c, far, 0.8) + piece(tube(bez(L, 0.68, 0.75, 2), [7.8, 7.8, 7.7].map((x) => x * W), { flatStart: 1, flatEnd: 1 }), shade(c, 0.22), far, 0.5);
    }
    return s;
  };
  // the two side edges of a leg's lower half, as thin lines: they only show where it overlaps the other leg
  const legEdge = (C, hw) => { const i0 = Math.round(C.length * 0.45), c = C.slice(i0), w = hw.slice(i0); return lineP(spline(offsetVar(c, w), false) + spline(offsetVar(c, w.map((x) => -x)), false), LINE, 1.2, 0.9); };

  // ---- torso pieces (the front line of a garment runs down the middle, u = 0)
  const ex = (T && T.fit) || 2;
  const tails = () => {
    if (!T || !T.tails) return '';
    const pl = J.pelvis, by = Math.min(GROUND - 3, pl[1] + T.tails * B.h);
    const xs = [J.lB[1][0], J.lF[1][0], J.lB[2][0], J.lF[2][0]];
    const lx = Math.max(pl[0] - 40, Math.min(pl[0] - 17 * W, ...xs.map((x) => x - 10)) - 3 - sway * 4);
    const rx = Math.min(pl[0] + 40, Math.max(pl[0] + 17 * W, ...xs.map((x) => x + 10)) + 3 + sway);
    const sp = M(0, 0.02, ex), my = (pl[1] + by) / 2;
    const Lp = [M(-1, 0.16, ex), [lx + 3, my], [lx, by, 1], [sp[0] - 3 + sway * 2, by - 2, 1], sp, M(-0.4, 0.14, ex)];
    const Rp = [sp, [sp[0] + 3 + sway, by - 2, 1], [rx, by - 4, 1], [rx - 3, my], M(1, 0.16, ex), M(0.4, 0.14, ex)];
    let s = piece(Lp, T.c) + piece(Rp, shade(T.c, 0.04));
    if (T.trim) s += lineP(`M${pt(sp)}L${r1(sp[0] - 3 + sway * 2)},${r1(by - 2)}M${r1(lx)},${r1(by)}L${r1(sp[0] - 3 + sway * 2)},${r1(by - 2)}M${r1(sp[0] + 3 + sway)},${r1(by - 2)}L${r1(rx)},${r1(by - 4)}`, T.trim, 1.8);
    return s;
  };
  const top = () => {
    const v0 = T.hem != null ? T.hem : -0.1;
    let s = piece(torsoOutline(M, v0, 1, ex, 1), T.c);
    if (T.band) s += piece(torsoOutline(M, T.band[0], 1, ex + 0.2), T.band[1]);
    if (T.open) s += cel(spline([M(-0.3, 1.06, ex), M(-0.16, 0.6, ex), M(-0.1, v0 + 0.02, ex, 1), M(0.18, v0 + 0.02, ex, 1), M(0.24, 0.6, ex), M(0.38, 1.04, ex)], true), col(T.open), St.sh, 0.7)
      + lineP(spline([M(-0.12, 0.64, ex), M(0.04, 0.61, ex), M(0.2, 0.64, ex)], false), St.sh, 1.1) + lineP(spline([M(0.04, 0.5, ex), M(0.04, 0.3, ex)], false), St.sh, 1);
    if (T.v) s += ink(spline([M(-0.46, 1.06, ex), M(0.04, 0.66, ex, 1), M(0.52, 1.06, ex), M(0.04, 1.0, ex)], true), col(T.v));
    if (T.kimono) s += lineP(spline([M(0.5, 1.04, ex), M(0.12, 0.62, ex), M(-0.3, 0.16, ex)], false), LINE, 1.3);
    if (T.zip) s += lineP(spline([M(0, v0 + 0.02, ex), M(0, 0.5, ex), M(0, 1.02, ex)], false), T.zip, 1.4);
    if (T.trim && !T.open && !T.tails) s += lineP(spline([M(0.05, v0 + 0.02, ex), M(0.05, 0.5, ex), M(0.05, 1.0, ex)], false), T.trim, 1.4, 0.85);
    if (T.tails) s += lineP(spline([M(0, 0.02, ex), M(0, 0.5, ex), M(0.02, 1.02, ex)], false), T.trim || LINE, 1.4);
    if (T.buttons) s += [0.12, 0.34, 0.56, 0.78].map((v) => { const p = M(0.05, v, ex); return `<circle cx="${r1(p[0])}" cy="${r1(p[1])}" r="1.5" fill="${T.buttons}" stroke="${LINE}" stroke-width=".8"/>`; }).join('');
    if (T.emblem) { const p = M(0.55, 0.74, ex); s += `<circle cx="${r1(p[0])}" cy="${r1(p[1])}" r="${r1(3.4 * W)}" fill="${T.emblem}" stroke="${LINE}" stroke-width="1.2"/><circle cx="${r1(p[0])}" cy="${r1(p[1])}" r="${r1(1.3 * W)}" fill="${T.c}"/>`; }
    s += lineP(spline([M(-0.8, 0.36, ex), M(-0.5, 0.32, ex), M(-0.22, 0.35, ex)], false), LINE, 1, 0.4);
    return s;
  };
  const sash = () => {
    if (O.belt && !O.sash) {
      const P2 = [M(-1.04, 0.12, ex + 0.4, 1), M(1.04, 0.12, ex + 0.4, 1), M(1.04, 0.03, ex + 0.4, 1), M(-1.04, 0.03, ex + 0.4, 1)], b = M(0.05, 0.075, ex);
      return piece(P2, O.belt, false, 0.4) + frame(J, b, `<rect x="-2.8" y="-2.4" width="5.6" height="4.8" rx=".8" fill="#f4c66a" stroke="${LINE}" stroke-width="1"/>`);
    }
    if (!O.sash) return '';
    const [c, u] = O.sash, P2 = [M(-1.06, 0.17, ex + 0.5, 1), M(1.06, 0.17, ex + 0.5, 1), M(1.06, 0.01, ex + 0.5, 1), M(-1.06, 0.01, ex + 0.5, 1)];
    const k = M(u, 0.09, ex + 0.5);
    const tail = (dx, ln) => tube([k, [k[0] + dx * 0.5 + sway, k[1] + ln * 0.5], [k[0] + dx + sway * 2, k[1] + ln]], [3.2, 3, 2.6], { flatEnd: 1 });
    return piece(P2, c, false, 0.5) + piece(tail(-4, 19), c, false, 0.6) + piece(tail(3, 15), shade(c, -0.12), false, 0.6) + cel(circ(k, 3.6), c, shade(c, -0.25), 0.6);
  };
  const collar = () => {
    if (!T || T.collar !== 'high') return '';
    const h = T.ch || 6, c = T.cc || T.c, hw = 7.5 * W + ex;
    return frame(J, J.neckBase, cel(`M${r1(-hw)},5 L${r1(-hw + 0.8)},${-h} Q0,${-h - 2.5} ${r1(hw - 0.8)},${-h} L${r1(hw)},5 Q0,8 ${r1(-hw)},5Z`, c, shd(c), 0.8)
      + lineP(`M${r1(J.tw * 0.45 * hw)},${-h - 1.5} L${r1(J.tw * 0.45 * hw)},5`, LINE, 1, 0.6)
      + (T.chain ? inkLine(`M${r1(-hw + 2)},2 Q${r1(-hw * 0.3)},13 ${r1(hw * 0.2)},4`, T.chain, 1.6) : ''));
  };

  // ---- which arms hang at the sides (behind the torso) and which cross in front of it
  const crossing = (Ar, fa, front) => { const h = add(Ar[2], fa, 4); return h[1] > J.neck[1] && (front ? h[0] < J.shF[0] - 1 : h[0] > J.shB[0] + 1); };
  const backX = P.bf || crossing(J.aB, J.foreA.aB, false), frontX = crossing(J.aF, J.foreA.aF, true);
  const back = arm(J.aB, J.foreA.aB, true), front = arm(J.aF, J.foreA.aF, false);
  if (!backX) fig.push(back.s);
  if (!frontX) fig.push(front.s);
  // below the waist the body is one shape: the hips and both whole legs merged, so the torso
  // flows into the legs with no seam; the same for the trousers over it
  const skinC = [legC(J.lB), legC(J.lF)], skinW = legW(8);
  fig.push(cel(union(torsoOutline(M, -0.3, 1, 0), tube(skinC[0], skinW), tube(skinC[1], skinW)), St.body, St.sh) + legEdge(skinC[1], skinW));
  fig.push(shoe(J.lB, true), shoe(J.lF, false));
  if (Bt) {
    const pc = [bez(J.lB, -0.06, Bt.len, 8), bez(J.lF, -0.06, Bt.len, 8)], pw = pantW(8);
    fig.push(cel(union(torsoOutline(M, -0.32, 0.22, 1.6), tube(pc[0], pw, { flatEnd: 1 }), tube(pc[1], pw, { flatEnd: 1 })), Bt.c, shd(Bt.c)) + legEdge(pc[1], pw));
  }
  fig.push(legDetails(J.lB, true), legDetails(J.lF, false));
  fig.push(tails());
  // the neck, the torso (bare or dressed)
  fig.push(cel(spline(tube([add(J.neckBase, J.neckA, -6), J.neck, add(J.neck, J.neckA, 9)], [4.4 * W, 4.1 * W, 4.1 * W]), true), St.far, shd('skin', true), 0.6));
  if (!T) fig.push(lineP(spline([M(-0.4, 0.64, 0), M(0, 0.6, 0), M(0.4, 0.64, 0)], false), St.sh, 1.2, 0.8) + lineP(spline([M(0, 0.52, 0), M(0, 0.32, 0)], false), St.sh, 1, 0.7));
  else fig.push(top());
  if (O) fig.push(sash());
  // hands hanging at the sides come over the clothes
  if (!backX) fig.push(back.hand);
  if (!frontX && !(worn && !sheathed && !P.prop) && !P.prop) fig.push(front.hand);
  fig.push(G.under);
  // the head: a flat round disc, the face, the hair, the hat
  const hair = hairShape(A.hair, !!HAT_COVER[A.hat]);
  const hairS = hair ? cel(hair.d, hair.h.c, hair.h.sh, 0.9) + (hair.lines ? lineP(hair.lines, LINE, 1, 0.55) : '') + lineP('M-13,-15 Q-6,-20.5 3,-21', hair.h.hi, 2.2, 0.85) : '';
  const tw = P.tw || 0;
  fig.push(onHead(ink(circ([0, 0], 19), St.body, 2.4) + `<g transform="translate(${r1(-3.7 * (1 - tw))},1)">${faceSVG(A.face, P.expr, St.eye)}</g>`
    + `<g transform="translate(${r1(2.2 * tw)},0) scale(${r1((1 + 0.07 * tw) * 100) / 100},1)">${hairS}</g>` + (HATS[A.hat] || '')));
  fig.push(collar());
  if (backX) fig.push(back.s + back.hand);
  if (frontX) fig.push(front.s);
  // the weapon or tool gripped in the front fist, drawn over everything else
  const fa = J.foreA.aF, prop = P.prop, weapon = !prop && worn && !sheathed ? worn : null, grip = front.hp;
  if (weapon) fig.push(`<g transform="translate(${pt(grip)}) rotate(${rotTo(fa + P.g)})">${weaponSVG(weapon)}</g>`);
  if (prop === 'rod') fig.push(rodSVG(grip, fa + P.g, t));
  if (prop === 'pan') fig.push(panSVG(grip, fa + P.g, t));
  if (prop === 'axe') fig.push(axeSVG(grip, fa + P.g, t));
  if (frontX || weapon || prop) fig.push(front.hand);
  fig.push(G.over);
  let figS = fig.join('');
  if (St.filter) figS = `<g filter="url(#${St.filter})">${figS}</g>`;
  else figS = `<g filter="url(#avStk${AURA_COL[A.aura] ? '-' + A.aura : ''})">${figS}</g>`;
  out.push(figS);
  LINE = OL;
  return out.join('');
}
const lum = (hex) => { const n = parseInt(String(hex).slice(1), 16); return ((n >> 16) * 0.3 + ((n >> 8) & 255) * 0.59 + (n & 255) * 0.11) / 255; };

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
// Where a put-away weapon hangs: [u, v on the torso, angle of the blade, scale, layer].
// Blades sit on the back hip, hilt forward; heavy weapons hang at the front hip; long ones are slung on the back.
const CARRY = { katana: [-0.95, 0.04, -58, 1, 'under'], short: [-0.95, 0.04, -50, 1, 'under'], cutlass: [-0.95, 0.04, -54, 1, 'under'],
  cleaver: [1, 0.04, 14, 0.9, 'under'], hammer: [1, 0.06, 8, 0.85, 'under'], sickle: [1, 0.06, 10, 0.9, 'under'], cannon: [1, 0.06, 4, 0.9, 'under'],
  lance: [-0.3, 0.55, 150, 0.9, 'back'], bow: [-0.2, 0.62, 84, 0.85, 'back'] };

// Everything the figure wears on its back. back: behind the body · under: over the torso, under the head and arms.
function gearSVG(A, J, P, t, B, M, o) {
  const back = [], under = [], over = [], fx = [];
  const W = B.w, sway = Math.sin(t * 2.1);
  const strap = (pts, c) => inkLine(spline(pts, false), c, 3);
  const mantle = (cc, clasp, kind) => {
    const e = 3.8;
    let s;
    if (kind === 'fur') {
      const P2 = [];
      for (let i = 0; i <= 12; i++) { const u = -1.2 + (2.4 * i) / 12; P2.push(M(u, 0.86 + Math.cos(u * 1.2) * 0.2 + (i % 2 ? 0.05 : 0), e)); }
      for (let i = 12; i >= 0; i--) { const u = -1.15 + (2.3 * i) / 12; P2.push(M(u, 0.76 + Math.cos(u * 1.2) * 0.16 - (i % 2 ? 0.05 : 0), e)); }
      s = ink(spline(P2, true), cc) + lineP(spline([M(-0.8, 0.9, e), M(0, 1.02, e), M(0.8, 0.9, e)], false), shade(cc, -0.18), 1.6);
    } else {
      const P2 = [M(-1.14, 0.78, e), M(-1.06, 0.98, e), M(-0.55, 1.09, e), M(0, 1.11, e), M(0.6, 1.09, e), M(1.1, 0.98, e), M(1.16, 0.78, e), M(0.64, 0.84, e), M(0.32, 0.7, e, 1), M(0.02, 0.84, e)];
      s = ink(spline(P2, true), cc) + fillP(spline([M(0.64, 0.86, e), M(1.12, 0.8, e), M(1.08, 0.97, e), M(0.7, 1.05, e)], true), shade(cc, -0.25), 0.9);
    }
    const c = M(0.32, 0.79, e);
    return s + `<circle cx="${r1(c[0])}" cy="${r1(c[1])}" r="3.2" fill="${clasp}" stroke="${LINE}" stroke-width="2" paint-order="stroke"/><circle cx="${r1(c[0] - 0.9)}" cy="${r1(c[1] - 0.9)}" r="1" fill="#fff" opacity=".7"/>`;
  };
  const hood = (c) => back.push(ink(spline([add(J.shB, J.chestA, 2), add(J.head, J.neckA - 120, J.headR + 6), add(J.head, J.neckA + 160, J.headR + 7), add(J.head, J.neckA + 100, J.headR + 4), add(J.shF, J.chestA, 2)], true), c));
  switch (A.back) {
    case 'shroud': hood('#3a2f4f'); back.push(capeSVG(J, B, P, t, { fill: '#2a2238', lining: '#181221', edge: '#9b6bff', jag: 1, len: 116 })); under.push(mantle('#3a2f4f', '#e9e3d2')); break;
    case 'pelt':   back.push(capeSVG(J, B, P, t, { fill: '#c8873a', lining: '#8a5a24', edge: '#e8c08a', stripes: 1, len: 100 })); under.push(mantle('#efe0c4', '#e8443a', 'fur')); break;
    case 'mantle':
      back.push(ink(spline([add(J.shB, J.chestA, 1), add(J.head, J.neckA - 135, J.headR + 5), add(J.head, J.neckA + 175, J.headR + 3), add(J.head, J.neckA + 135, J.headR + 5), add(J.shF, J.chestA, 1)], true), '#2c1846')
        + lineP(spline([add(J.head, J.neckA - 128, J.headR + 2), add(J.head, J.neckA + 175, J.headR), add(J.head, J.neckA + 128, J.headR + 2)], false), '#ff3fb4', 1.8));
      back.push(capeSVG(J, B, P, t, { fill: '#1a0f2a', lining: '#2c1846', edge: '#ff3fb4', stars: 1, len: 124 })); under.push(mantle('#2c1846', '#ff3fb4')); break;
    case 'coat': {
      // a captain's coat worn over the shoulders: empty sleeves hang at the sides
      const sl = (sh, dx) => { const C = [sh, [sh[0] + dx * 0.5 + sway, sh[1] + 22], [sh[0] + dx + sway * 2, sh[1] + 46]]; return ink(spline(tube(C, [5.2, 5.6, 6.2], { flatEnd: 1 }), true), '#7a1d2b') + ink(spline(tube([C[2], add(C[2], 0, 4)], [6.4, 6.4], { flatStart: 1, flatEnd: 1 }), true), '#f4c66a'); };
      back.push(capeSVG(J, B, P, t, { fill: '#8e2433', lining: '#5c1420', edge: '#f4c66a', len: 106 }), sl(add(J.shB, J.chestA + 90, 4), -8), sl(add(J.shF, J.chestA - 90, 4), 7));
      const ep = (p) => frame(J, p, `<path d="M-7,-2 Q0,-7 7,-2 L6.5,2.5 Q0,0.5 -6.5,2.5Z" fill="#f4c66a" stroke="${LINE}" stroke-width="2" paint-order="stroke"/>` + lineP('M-5,3 v4 M-1.7,2.6 v4.6 M1.7,2.6 v4.6 M5,3 v4', '#f4c66a', 1.4));
      under.push(mantle('#8e2433', '#f4c66a'), ep(J.shB), ep(J.shF));
      break;
    }
    case 'scarf': {
      const e = 3, k = M(-0.7, 1, e), w = (i) => Math.sin(t * 4 + i) * 4;
      const tail = (dy, i, c) => ink(spline(tube([k, [k[0] - 14, k[1] + dy * 0.4 + w(i)], [k[0] - 30, k[1] + dy * 0.8 + w(i + 1)], [k[0] - 44, k[1] + dy + w(i + 2)]], [4.4, 4, 3.6, 3], { flatEnd: 1 }), true), c, 3.4);
      back.push(tail(14, 0, '#c4501a'), tail(4, 1.3, '#ff8a2b'));
      under.push(ink(spline([M(-0.92, 0.9, e), M(-0.86, 1.14, e), M(0, 1.22, e), M(0.86, 1.14, e), M(0.94, 0.9, e), M(0, 0.96, e)], true), '#ff8a2b')
        + fillP(spline([M(0.4, 0.95, e), M(0.92, 0.92, e), M(0.86, 1.12, e), M(0.45, 1.18, e)], true), '#d0601c', 0.9) + `<circle cx="${r1(k[0])}" cy="${r1(k[1])}" r="4.2" fill="#e06a24" stroke="${LINE}" stroke-width="2" paint-order="stroke"/>`);
      break;
    }
    case 'pack':
      back.push(frame(J, M(-1.05, 0.56, 0), `<path d="M-2,-18 V-27" stroke="${LINE}" stroke-width="4.4"/><path d="M-2,-18 V-27" stroke="#cfd6e4" stroke-width="2"/><circle cx="-2" cy="-28" r="3.4" fill="#ff8a2b" stroke="${LINE}" stroke-width="2" paint-order="stroke"/>`
        + `<rect x="-14" y="-19" width="24" height="36" rx="10" fill="#f2f2f2" stroke="${LINE}" stroke-width="2.2" paint-order="stroke"/><path d="M-14,-4 H10 V3 H-14Z" fill="#ff8a2b"/><path d="M-14,-4 H10 M-14,3 H10" stroke="${LINE}" stroke-width="1.6"/>`
        + lineP('M-10,-13 Q-10,-16 -6,-16', '#fff', 2.2) + `<circle cx="-2" cy="10" r="2.6" fill="#4cc3ff" stroke="${LINE}" stroke-width="1.4"/>`));
      under.push(strap([M(-0.55, 1.0, 2.5), M(-0.6, 0.7, 2.5), M(-0.66, 0.36, 2.5)], '#5b6475'), strap([M(0.72, 1.0, 2.5), M(0.66, 0.7, 2.5), M(0.6, 0.36, 2.5)], '#5b6475'));
      break;
    case 'quiver':
      back.push(frame(J, M(-0.55, 0.62, 0), `<g transform="rotate(32)"><g stroke="${LINE}" stroke-width="1.4" stroke-linejoin="round"><path d="M-6,-36 l-4,-11 l6,4Z" fill="#e8443a"/><path d="M1,-37 l-1,-12 l5,5Z" fill="#f2f2f2"/><path d="M7,-36 l2,-11 l4,6Z" fill="#9be15d"/></g>`
        + lineP('M-5,-38 v6 M1.5,-39 v7 M8,-38 v6', '#5a3d26', 2)
        + `<rect x="-10" y="-34" width="21" height="44" rx="6" fill="#8a5a2b" stroke="${LINE}" stroke-width="2.2" paint-order="stroke"/>` + lineP('M-10,-27 H11 M-10,0 H11', '#5a3d26', 2.4) + lineP('M-6,-22 V-6', '#b07a44', 2) + '</g>'));
      under.push(strap([M(-0.85, 0.98, 2.5), M(0, 0.62, 2.5), M(0.95, 0.16, 2.5)], '#5a3d26'));
      break;
    case 'sigil': {
      const c = add(J.neckBase, J.chestA, -16), rot = r1(t * 30);
      const ticks = [...Array(12)].map((_, i) => `M${pt(add([0, 0], i * 30, 34))}L${pt(add([0, 0], i * 30, 39))}`).join('');
      const runes = [...Array(6)].map((_, i) => { const p = add([0, 0], i * 60 + 15, 27); return `<path d="M${r1(p[0] - 2.5)},${r1(p[1] - 3)} l5,3 -5,3" fill="none" stroke="#36d6a8" stroke-width="1.6"/>`; }).join('');
      fx.push(`<g transform="translate(${pt(c)})"><circle r="42" fill="#36d6a8" opacity=".08"/><g transform="rotate(${rot})"><circle r="39" fill="none" stroke="#36d6a8" stroke-width="2.4"/><circle r="31" fill="none" stroke="#36d6a8" stroke-width="1.4" stroke-dasharray="4 3"/><path d="${ticks}" stroke="#36d6a8" stroke-width="2"/>${runes}</g><g transform="rotate(${-rot * 1.5})"><path d="M0,-20 L17.3,10 L-17.3,10Z M0,20 L17.3,-10 L-17.3,-10Z" fill="none" stroke="#7ff0d0" stroke-width="1.4"/></g></g>`);
      break;
    }
    case 'wings': {
      const f = Math.sin(t * 3) * 8;
      const wing = (k, flip) => `<g transform="rotate(${r1(-14 + f)}) scale(${flip ? -k : k},${k})"><path d="M0,0 Q-30,-46 -70,-34 Q-52,-24 -62,-12 Q-44,-12 -48,1 Q-28,-4 -26,8 Q-12,2 0,7Z" fill="#f4f1ea" stroke="${LINE}" stroke-width="2.2" stroke-linejoin="round" paint-order="stroke"/>`
        + lineP('M-6,1 Q-30,-28 -58,-28 M-6,4 Q-28,-10 -46,-6 M-6,6 Q-20,0 -30,4', '#d4a83a', 1.8) + '</g>';
      back.push(frame(J, M(-0.35, 0.82, 0), wing(1.05, false)), frame(J, M(0.4, 0.82, 0), wing(0.85, true)));
      break;
    }
  }
  // a weapon that is put away hangs at the waist or across the back
  if (o.sheathed) {
    const c = CARRY[weaponKind(o.sheathed)] || CARRY.cutlass, at = M(c[0], c[1], 2);
    (c[4] === 'back' ? back : under).push(`<g transform="translate(${pt(at)}) rotate(${rotTo(c[2] + P.t1 - 180)}) scale(${c[3]})">${sheathSVG(o.sheathed)}</g>`);
  }
  return { back: back.join(''), under: under.join(''), over: over.join(''), fx: fx.join('') };
}
// Motion effects: slash trail, thrust speed lines, kick impact, hit recoil.
function fxSVG(fx, J, col) {
  const sh = J.shoulder;
  const P = (a, r) => pt(add(sh, a, r));
  if (fx === 'slash') {
    const R = 66, a0 = 214, a1 = 74;
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
    const c = add(J.chest, 90, 28);
    return burst(c, 10, '#ff4d5e') + [0, 1, 2].map((i) => `<path d="M${r1(J.chest[0] - 32)},${r1(J.chest[1] - 6 + i * 14)} h-22" stroke="#fff" stroke-width="2" opacity=".5" stroke-linecap="round"/>`).join('');
  }
  return '';
}
// A comic impact star.
function burst(c, r, col) {
  const pts = [];
  for (let i = 0; i < 16; i++) pts.push(pt(add(c, i * 22.5, i % 2 ? r * 0.45 : r)));
  return `<path d="M${pts.join('L')}Z" fill="#fff" stroke="${col}" stroke-width="2.4" stroke-linejoin="round"/>`;
}
// Shared SVG filters (one copy per page): the Neon and Sketch styles, a soft blur for auras, and the
// "sticker" rim: a pale outline around the whole figure, plus a coloured glow when an aura is worn.
const AURA_COL = { bubbles: '#9fd8ff', leaves: '#ff6a2b', wisps: '#8fa0ff', embers: '#ffc93d', smoke: '#9b6bff', flies: '#7fe36a', echo: '#ef7cff', storm: '#ff3fb4' };
const stickerFilter = (id, glow) => `<filter id="${id}" x="-30%" y="-20%" width="160%" height="140%" color-interpolation-filters="sRGB">`
  + `<feMorphology in="SourceAlpha" operator="dilate" radius="1.25" result="k"/><feMorphology in="SourceAlpha" operator="dilate" radius="2.5" result="w"/>`
  + `<feFlood flood-color="#e9edf6"/><feComposite in2="w" operator="in" result="W"/><feFlood flood-color="#0a0c11"/><feComposite in2="k" operator="in" result="K"/>`
  + (glow ? `<feGaussianBlur in="w" stdDeviation="3.2" result="b"/><feFlood flood-color="${glow}"/><feComposite in2="b" operator="in" result="g"/>` : '')
  + `<feMerge>${glow ? '<feMergeNode in="g"/><feMergeNode in="g"/>' : ''}<feMergeNode in="W"/><feMergeNode in="K"/><feMergeNode in="SourceGraphic"/></feMerge></filter>`;
const AV_DEFS = `<defs>
    <filter id="avNeon" x="-40%" y="-40%" width="180%" height="180%"><feGaussianBlur in="SourceGraphic" stdDeviation="3.2" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
    <filter id="avSketch" x="-10%" y="-10%" width="120%" height="120%"><feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="2" seed="3" result="n"/><feDisplacementMap in="SourceGraphic" in2="n" scale="3" xChannelSelector="R" yChannelSelector="G"/></filter>
    <filter id="avBlur" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="3"/></filter>
    ${stickerFilter('avStk')}${Object.entries(AURA_COL).map(([k, c]) => stickerFilter('avStk-' + k, c)).join('')}
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
// A woodcutter's axe: the blade sits on the leading side of the haft (towards the swing).
function axeSVG(hand, a, t) {
  const at = (d, side) => add(add(hand, a, d), a - 90, side);
  return part(taper([add(hand, a, -12), add(hand, a, 54)], [3.6, 3]), '#8a5a2b', 2.2)
    + `<path d="M${pt(at(38, 2))} L${pt(at(54, 2))} Q${pt(at(60, 12))} ${pt(at(60, 24))} Q${pt(at(46, 30))} ${pt(at(30, 24))} Q${pt(at(32, 12))} ${pt(at(38, 2))}Z" fill="#cfd6e4" stroke="${OL}" stroke-width="2" stroke-linejoin="round"/>`
    + `<path d="M${pt(at(32, 22))} Q${pt(at(46, 27))} ${pt(at(59, 22))}" fill="none" stroke="#fff" stroke-width="1.6" opacity=".7"/>`;
}
function panSVG(hand, a, t) {
  const end = add(hand, a, 16), c = add(end, a, 15), flip = (t * 1.3) % 1, up = Math.sin(flip * Math.PI) * 26;
  return part(taper([hand, end], [3.6, 3.6]), '#3b3f4a', 2.2)
    + `<ellipse cx="${r1(c[0])}" cy="${r1(c[1])}" rx="16" ry="5" fill="#2a2e38" stroke="${OL}" stroke-width="2.4"/>`
    + `<g transform="translate(${r1(c[0])},${r1(c[1] - 4 - up)}) rotate(${r1(flip * 360)})"><ellipse rx="7" ry="3" fill="#ffb36b" stroke="${OL}" stroke-width="1.6"/><path d="M6,0 l4,-3 v6z" fill="#ffb36b" stroke="${OL}" stroke-width="1.2"/></g>`;
}
// A cape hanging from the shoulders behind the body. From the front we see its lining between
// the outer edges; it trails to the left (behind a figure facing right) and sways.
function capeSVG(J, B, P, t, o) {
  const sway = Math.sin(t * 2.1), A = J.chestA, lean = (180 - P.t1) * 0.5;
  const tl = add(J.shB, A + 90, 5), tr = add(J.shF, A - 90, 4), top = add(J.neckBase, A, 3);
  const hemY = Math.min(GROUND - 2, J.neckBase[1] + (o.len || 100) * B.h);
  const hl = [tl[0] - 16 - sway * 6 - lean, hemY + 3], hr = [tr[0] + 9 + sway * 2 - lean * 0.3, hemY - 5];
  const midY = (tl[1] + hemY) / 2;
  const hem = [];
  if (o.jag) for (let i = 1; i < 8; i++) { const k = i / 8; hem.push([hr[0] + (hl[0] - hr[0]) * k, hr[1] + (hl[1] - hr[1]) * k + (i % 2 ? 11 : 0) + Math.sin(t * 3 + i) * 1.5, 1]); }
  else hem.push([(hl[0] + hr[0]) / 2 + sway * 2, Math.max(hl[1], hr[1]) + 5 + sway * 2]);
  const outline = [top, tr, [tr[0] + 7, midY], [...hr, 1], ...hem, [...hl, 1], [tl[0] - 11 - sway * 3 - lean * 0.6, midY], tl];
  let s = ink(spline(outline, true), o.fill);
  // the lining: everything but a rim along the outer edges
  const inset = [add(top, A, -4), add(tr, A + 90, 5), [tr[0] + 2, midY], [hr[0] - 5, hr[1] - 2, 1], ...hem.map((p) => [p[0], p[1] - 4, p[2]]), [hl[0] + 6, hl[1] - 2, 1], [tl[0] - 5 - sway * 3 - lean * 0.6, midY], add(tl, A - 90, 5)];
  s += fillP(spline(inset, true), o.lining, 0.95);
  const fold = (k, w) => lineP(`M${pt(add(top, A + 90, 14 * k - 4))} Q${r1(tl[0] - 2 - 10 * k - sway * 3)},${r1(midY + 8)} ${r1(hl[0] + (hr[0] - hl[0]) * (0.2 + 0.3 * k))},${r1(hemY - 2)}`, shade(o.lining, -0.35), w);
  s += fold(0.2, 2.4) + fold(1, 1.8);
  if (o.edge) s += lineP(spline([[...hr, 1], ...hem, [...hl, 1]], false), o.edge, 2.4);
  if (o.stripes) s += [0.3, 0.55, 0.8].map((k) => { const x = tl[0] - 10 - 6 * k - sway * 3, y = tl[1] + (hemY - tl[1]) * k; return lineP(`M${r1(x + 5)},${r1(y)} q-5,4 -11,2`, '#5a3a1c', 3); }).join('');
  if (o.stars) s += [[0.25, 0.4], [0.7, 0.62], [0.4, 0.82], [0.85, 0.35]].map(([kx, ky], i) => { const x = hl[0] + (hr[0] - hl[0]) * kx, y = tl[1] + (hemY - tl[1]) * ky; return `<circle cx="${r1(x)}" cy="${r1(y)}" r="${1.4 + (i % 2)}" fill="#ffd0ee" opacity="${r1(0.6 + Math.sin(t * 4 + i) * 0.4)}"/>`; }).join('');
  return s;
}
// Auras are blended with "screen" so they glow over any background.
const AURA_GLOW = { bubbles: 1, leaves: 1, wisps: 1, embers: 1, smoke: 1, flies: 1, echo: 1, storm: 1 };
function auraSVG(id, cx, cy, t) {
  switch (id) {
    case 'bubbles': {   // sea steam: white puffs rolling up around the body, and bubbles
      const puffs = [...Array(10)].map((_, i) => {
        const k = (t * 0.28 + i / 10) % 1, side = i % 2 ? 1 : -1, x = cx + side * (24 + Math.sin(i * 1.7 + t) * 8 + k * 16), y = 220 - k * 160, r = 8 + k * 10;
        return `<circle cx="${r1(x)}" cy="${r1(y)}" r="${r1(r)}" fill="#eef6ff" opacity="${r1((1 - k) * 0.5)}"/><circle cx="${r1(x - r * 0.3)}" cy="${r1(y - r * 0.3)}" r="${r1(r * 0.45)}" fill="#fff" opacity="${r1((1 - k) * 0.4)}"/>`;
      }).join('');
      return flameAura(cx, t, ['#1e8fe0', '#7fd3ff', '#e6f7ff'], { h: 150, w: 44 }) + puffs + [0, 1, 2, 3, 4].map((i) => {
        const k = (t * 0.35 + i / 5) % 1, x = cx + Math.sin(i * 2.4 + t) * 46, y = 220 - k * 170;
        return `<circle cx="${r1(x)}" cy="${r1(y)}" r="${r1(3 + (i % 3) * 1.6)}" fill="none" stroke="#bfe8ff" stroke-width="1.6" opacity="${r1(0.9 - k * 0.8)}"/>`;
      }).join('');
    }
    case 'leaves': return flameAura(cx, t, ['#ff2a12', '#ff7a2b', '#ffe0a0']) + [0, 1, 2, 3, 4, 5].map((i) => {
      const a = t * 1.4 + i * 1.05, x = cx + Math.cos(a) * 52, y = cy + Math.sin(a) * 16 - 20 + Math.sin(t * 2 + i) * 18, rot = r1((a / D2R) * 2);
      return `<path transform="translate(${r1(x)},${r1(y)}) rotate(${rot})" d="M-6,0 Q0,-5 6,0 Q0,5 -6,0Z M-6,0 H6" fill="${i % 2 ? '#7fd36a' : '#ff9a4d'}" stroke="#2c5a1e" stroke-width=".8" opacity="${Math.sin(a) > 0 ? 0.95 : 0.6}"/>`;
    }).join('');
    case 'wisps': return flameAura(cx, t, ['#3a52ff', '#8fa8ff', '#f0f4ff'], { h: 204, w: 50 }) + [0, 1, 2, 3].map((i) => {
      const a = t * 0.9 + (i * Math.PI) / 2, x = cx + Math.cos(a) * 48, y = cy + Math.sin(a) * 28 - 10, f = Math.sin(t * 9 + i) * 2;
      return `<path transform="translate(${r1(x)},${r1(y)})" d="M0,8 Q-7,2 -3,-4 Q0,-8 ${r1(1 + f)},-16 Q5,-6 6,0 Q6,7 0,8Z" fill="#b49bff" opacity=".8"/><circle cx="${r1(x)}" cy="${r1(y + 2)}" r="2.6" fill="#e8dcff"/>`;
    }).join('');
    case 'embers': return flameAura(cx, t, ['#ffa000', '#ffe066', '#fffbe0'], { h: 208, w: 56 }) + bolts(cx, t, '#ffe066')
      + [0, 1, 2, 3].map((i) => { const k = (t * 0.6 + i / 4) % 1; return `<circle cx="${r1(cx - 30 + i * 20 + Math.sin(t * 3 + i) * 6)}" cy="${r1(200 - k * 150)}" r="2.2" fill="#fff0a0" opacity="${r1(1 - k)}"/>`; }).join('');
    case 'smoke': return flameAura(cx, t, ['#6a22ff', '#a66bff', '#efe4ff'], { h: 190 }) + [0, 1, 2, 3, 4, 5].map((i) => {
      const k = (t * 0.25 + i / 6) % 1, x = cx - 34 + (i % 3) * 34 + Math.sin(t + i) * 8, y = 222 - k * 150, r = 6 + k * 12;
      return `<circle cx="${r1(x)}" cy="${r1(y)}" r="${r1(r)}" fill="${i % 2 ? '#2a1450' : '#36d6a8'}" opacity="${r1((1 - k) * 0.4)}"/>`;
    }).join('');
    case 'flies': return flameAura(cx, t, ['#16b84a', '#8be35d', '#eaffd0'], { h: 184, w: 48 }) + [0, 1, 2, 3, 4, 5, 6].map((i) => {
      const x = cx + Math.sin(t * 0.7 + i * 2.1) * 58, y = cy - 10 + Math.cos(t * 0.9 + i * 1.3) * 62, on = Math.sin(t * 3 + i * 1.7) > -0.2;
      return on ? `<circle cx="${r1(x)}" cy="${r1(y)}" r="5" fill="#d8ff6a" opacity=".25"/><circle cx="${r1(x)}" cy="${r1(y)}" r="2" fill="#f4ffb0"/>` : '';
    }).join('');
    case 'echo': {
      // the Echo: a tall spirit figure standing just behind you
      const gx = cx - 44, gy = 196 + Math.sin(t * 1.4) * 5;
      const fig = `M${gx},${gy - 96} Q${gx - 2},${gy - 72} ${gx + 1},${gy - 44} M${gx - 2},${gy - 90} Q${gx + 14},${gy - 72} ${gx + 22},${gy - 82} M${gx - 2},${gy - 88} Q${gx - 18},${gy - 68} ${gx - 6},${gy - 60} M${gx + 1},${gy - 44} L${gx - 12},${gy} M${gx + 1},${gy - 44} L${gx + 14},${gy - 2}`;
      return flameAura(cx, t, ['#9a2cff', '#ef7cff', '#ffe6ff'], { h: 170, w: 44 }) + `<g opacity=".8"><path d="${fig}" fill="none" stroke="#ef7cff" stroke-width="15" stroke-linecap="round" opacity=".25"/><path d="${fig}" fill="none" stroke="#ef7cff" stroke-width="8" stroke-linecap="round" opacity=".55"/><circle cx="${gx}" cy="${gy - 114}" r="17" fill="#ef7cff" opacity=".5"/><circle cx="${gx}" cy="${gy - 114}" r="12" fill="none" stroke="#ffd6ff" stroke-width="2" opacity=".7"/><path d="M${gx + 3},${gy - 116} h9" stroke="#fff" stroke-width="2.4" stroke-linecap="round"/></g>`;
    }
    case 'storm': {
      const on = Math.sin(t * 9) > 0.55, X = (d) => r1(cx + d), Y = (d) => r1(cy + d);
      return flameAura(cx, t, ['#8b2bd6', '#ff3fb4', '#ffe0f4'], { h: 212, w: 58 })
        + (on ? `<path d="M${X(-50)},${Y(-40)} l12,14 -7,4 13,16 M${X(52)},${Y(-20)} l-10,12 7,3 -12,16" fill="none" stroke="#ffd0ee" stroke-width="2.4" stroke-linejoin="round"/>` : '');
    }
    default: return '';
  }
}

/* ================================================================ animation */
// Every <svg class="avatar" data-av="battle|auto|preview"> on screen is animated (~30 fps).
const AVS = new WeakMap();
let avUid = 0;
function basePose(el) {
  const A = avState(), ctx = el.dataset.av;
  if (ctx === 'preview') return el.dataset.pose || A.stance;
  if (ctx === 'battle') return S.combat.zone != null ? 'guard' : A.stance;
  if (ctx === 'enemy') return 'guard';
  if (S.action) return S.action.skill === 'fishing' ? 'fish' : S.action.skill === 'cooking' ? 'cook' : S.action.skill === 'woodcutting' && POSES.chopUp ? 'chopUp' : A.stance;
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
    if (!el.dataset.uid) el.dataset.uid = 'av' + ++avUid;
    el.innerHTML = avWrap(drawAvatar(look, Pd, t, { weapon, uid: el.dataset.uid }), el.dataset.flip);
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
  const uid = 'av' + ++avUid;
  return `<svg class="avatar ${opts.cls || ''}" viewBox="22 18 156 218" aria-hidden="true" data-uid="${uid}" ${anim}>${avWrap(drawAvatar(A, pose, 0.6, { weapon: opts.weapon, uid }), opts.flip)}</svg>`;
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
