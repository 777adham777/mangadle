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
// Content made in the Studio (editor.html) plugs in here; see js/custom.js.
// face/back/aura: drawers by id · skill: skill id → animation id · attacks: extra attack sequences
// wear: drawn garment pieces by 'top:id' / 'bottom:id', called for each body part (see drawAvatar).
const AV_EXT = { face: {}, back: {}, aura: {}, skill: {}, attacks: [], wear: {} };
const C = (id, name, w, r, req, extra) => Object.assign({ id, name, w, r }, req, extra || {});
// One body for everyone (no builds): the base character sheet. Its proportions live in solve()
// and drawAvatar(); these factors stay at 1 for the code that still takes a body argument.
const BODY = { w: 1, h: 1, head: 1 };
const COSMETICS = {
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
  // Hair: each cut has its own colour, built from locks on a cap (see HAIR).
  hair: [
    { id: 'tuft', name: 'Messy Black', r: 1, need: FREE },
    { id: 'buzz', name: 'Buzz Cut', r: 1, need: FREE },
    { id: 'pony', name: 'High Ponytail', r: 1, need: FREE },
    { id: 'none', name: 'Bald', r: 1, need: FREE },
    C('mop',    'Sea-Salt Mop',    'seas',    2, LV('fishing', 10)),
    C('spikes', 'Swept Spikes',    'shinobi', 2, LV('character', 10)),
    C('bun',    'Warrior Topknot', 'shinobi', 3, LV('arts', 15)),
    C('ember',  'Ember Crest',     'soul',    3, LV('mining', 10)),
    C('long',   'Reaper Locks',    'soul',    3, LV('smithing', 15)),
    C('flame',  'Ascended Flame',  'ki',      5, LV('gravity', 40)),
    C('frost',  'Frost Tousle',    'hex',     3, LV('exorcism', 10)),
    C('wild',   'Wild Broom',      'hunter',  3, LV('tracking', 10)),
    C('swept',  'Slicked Back',    'echo',    3, LV('archaeology', 10)),
    C('crest',  'Rift Crest',      'rift',    5, KILLS('tear', 5)),
    // the 36 manga haircuts (pictures, js/hair-cuts.js), fitted to the head as it turns.
    // How they are earned is not decided yet: for now only the dev tool unlocks them.
    ...(typeof HAIR_CUTS !== 'undefined' ? Object.keys(HAIR_CUTS).map((id) => C('cut_' + id, HAIR_CUTS[id].name, HAIR_CUTS[id].world, 3, { need: () => false, hint: 'Not obtainable yet' })) : []),
  ],
  // Clothes are worn over the limbs, in two pieces you mix freely:
  // a top (with its sleeves, sash and wrist bands) and a bottom (trousers or shorts, belt and shoes).
  top: [
    { id: 'tee', name: 'Traveler Tee', r: 1, need: FREE },
    { id: 'none', name: 'Bare Chest', r: 1, need: FREE },
    C('corsair',  'Corsair Vest',      'seas',    3, LV('voyaging', 10)),
    C('shinobi',  'Shinobi Jacket',    'shinobi', 3, KILLS('mist', 50)),
    C('reaper',   'Reaper Kimono',     'soul',    3, KILLS('desert', 50)),
    C('gi',       'Training Gi',       'ki',      3, KILLS('canyon', 50)),
    C('uniform',  'Exorcist Jacket',   'hex',     3, KILLS('shrine', 50)),
    C('wilds',    'Wilds Tunic',       'hunter',  3, KILLS('cliffs', 50)),
    C('longcoat', 'Chained Longcoat',  'echo',    4, KILLS('museum', 50)),
    C('riftwear', 'Rift Raiment',      'rift',    5, KILLS('tear', 25)),
  ],
  bottom: [
    { id: 'tee', name: 'Traveler Trousers', r: 1, need: FREE },
    { id: 'none', name: 'Bare Legs', r: 1, need: FREE },
    C('corsair',  'Corsair Shorts',    'seas',    3, KILLS('storm', 25)),
    C('shinobi',  'Shinobi Trousers',  'shinobi', 3, KILLS('ravine', 50)),
    C('reaper',   'Reaper Hakama',     'soul',    3, KILLS('spire', 50)),
    C('gi',       'Gi Trousers',       'ki',      3, KILLS('citadel', 50)),
    C('uniform',  'Exorcist Slacks',   'hex',     3, KILLS('alleys', 50)),
    C('wilds',    'Wilds Shorts',      'hunter',  3, KILLS('ruins', 50)),
    C('longcoat', 'Longcoat Trousers', 'echo',    4, KILLS('pillars', 50)),
    C('riftwear', 'Rift Leggings',     'rift',    5, KILLS('tear', 40)),
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
    C('beast',    'Beast Hood',        'hunter',  4, LV('tracking', 15)),
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
    C('quiver', 'Hunter Quiver',   'hunter',  3, LV('tracking', 25)),
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
// Outfits are worn whole (no mixing a top with another bottom): the old clothes as matching pairs,
// then the outfits of the concept sheet (js/outfits.js), whose way to be earned is not decided yet (dev tool only).
const OLD_FIT_NAMES = { tee: 'Traveler', none: 'Bare', corsair: 'Corsair', shinobi: 'Shinobi', reaper: 'Reaper', gi: 'Training Gi', uniform: 'Exorcist', wilds: 'Wilds', longcoat: 'Chained Longcoat', riftwear: 'Rift Raiment' };
COSMETICS.outfit = COSMETICS.top.filter((c) => COSMETICS.bottom.some((b) => b.id === c.id)).map((c) => Object.assign({}, c, { name: OLD_FIT_NAMES[c.id] || c.name }))
  .concat(typeof FITS !== 'undefined' ? Object.keys(FITS).map((id) => C(id, FITS[id].name, FITS[id].world, 4, { need: () => false, hint: 'Not obtainable yet' })) : []);
const COS_SLOTS = [['style', 'Style'], ['stance', 'Stance'], ['color', 'Colour'], ['hair', 'Hair'], ['outfit', 'Outfit'], ['hat', 'Hat'], ['face', 'Face'], ['back', 'Back'], ['aura', 'Aura']];
const COS_RARITY = ['', 'Common', 'Uncommon', 'Rare', 'Epic', 'Legendary'];
const cosOf = (slot, id) => COSMETICS[slot].find((c) => c.id === id) || COSMETICS[slot][0];
const avatarOn = () => isUnlocked('feature:avatar');
function avState() {
  if (!S.avatar || typeof S.avatar !== 'object') S.avatar = {};
  const A = S.avatar;
  // v2 of the cosmetic list: re-check what this save has earned (quietly)
  if (!A.got || typeof A.got !== 'object' || A.gv !== 3) { A.got = {}; A.gv = 3; A.seeded = 0; }
  // a top and a bottom became one outfit, worn whole (the top decides); earning either half earns it
  if (A.top !== undefined || A.bottom !== undefined) {
    if (A.outfit === undefined) A.outfit = A.top !== undefined ? A.top : A.bottom;
    delete A.top; delete A.bottom;
  }
  for (const k of Object.keys(A.got)) if (/^(top|bottom):/.test(k)) { A.got['outfit:' + k.slice(k.indexOf(':') + 1)] = 1; delete A.got[k]; }
  const PIC_TO_FIT = { op1: 'rubber', op2: 'swordsman', op3: 'cook', op4: 'firefist', op5: 'surgeon', op6: 'kingcoat', na1: 'leafsuit', na2: 'jonin', na3: 'redcloud', na4: 'avenger', na5: 'flamecloak', na6: 'clantunic' };
  if (/^pic_/.test(A.outfit || '')) A.outfit = PIC_TO_FIT[A.outfit.slice(4)];
  for (const k of Object.keys(A.got)) if (/^outfit:pic_/.test(k)) { A.got['outfit:' + PIC_TO_FIT[k.slice(11)]] = 1; delete A.got[k]; }
  delete A.build;   // builds are gone: one body for everyone
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
  // fish, cook: full motion cycles, see POSE_DRIVE (their still poses are set there)
};
// ---- combat (2026-11-22 animation pass): every weapon family has its own stance and its own attacks.
// Families: blade (swords, katana, sickle) · quick (short blades) · heavy (hammer, cleaver) · spear · bow · gun · fist (bare, gauntlets, claws).
{
  const CP = (o) => Object.assign({}, POSES.guard, { bf: 1 }, o);
  Object.assign(POSES, {
    // stances (breathing / bouncing on top: see POSE_DRIVE.st_*)
    st_blade: POSES.guard,
    st_quick: CP({ t1: 168, t2: 8, n: -6, h: -6, aF: [64, 74], aB: [30, 118], lF: [34, -46], lB: [-30, 22], dy: 20, g: -72, fF: 16, fB: -22 }),
    st_heavy: CP({ t1: 174, t2: 6, n: -4, h: -2, aF: [36, 34], aB: [44, 36], lF: [32, -30], lB: [-30, 12], dy: 14, g: -22 }),
    st_spear: CP({ t1: 172, t2: 4, aF: [64, 30], aB: [36, 70], lF: [34, -34], lB: [-30, 16], dy: 14, g: -4 }),
    st_bow:   CP({ t1: 178, t2: 2, n: -2, h: -2, aF: [62, 28], aB: [14, 30], bf: 0, lF: [24, -16], lB: [-22, 10], dy: 6, g: 0 }),
    st_gun:   CP({ t1: 176, t2: 4, aF: [34, 56], aB: [44, 52], lF: [30, -28], lB: [-28, 14], dy: 12, g: 0 }),
    st_fist:  CP({ t1: 172, t2: 6, n: -6, h: -8, aF: [58, 112], aB: [40, 128], lF: [30, -34], lB: [-28, 18], dy: 14, g: 0 }),
    // blade: high arc (windup → strike → follow), rising cut, thrust
    bladeFollow: CP({ t1: 160, t2: 10, n: -10, h: -4, ht: 6, st: -8, aF: [44, 6], aB: [-58, 24], bf: 0, lF: [44, -54], lB: [-40, 6], fF: 0, fB: -22, dy: 20, g: -14, fx: 'slashTail' }),
    bladeLow: CP({ t1: 192, t2: -8, n: 4, h: -6, aF: [-30, 24], aB: [20, 90], lF: [34, -48], lB: [-30, 14], dy: 20, g: -64 }),
    spCoil: CP({ t1: 186, t2: -4, n: 2, h: -4, aF: [20, 70], aB: [10, 80], lF: [32, -40], lB: [-30, 16], dx: -6, dy: 16, g: 0 }),
    bladeRise: CP({ t1: 170, t2: 8, n: -10, h: -10, ht: 6, st: -8, aF: [148, 10], aB: [-50, 20], bf: 0, lF: [40, -40], lB: [-36, 4], fF: 4, fB: -20, dy: 8, g: 4, fx: 'rise' }),
    // quick: two fast slashes (out, back)
    qCoil: CP({ t1: 186, t2: -6, n: 4, h: -4, aF: [30, 120], aB: [10, 100], lF: [36, -52], lB: [-32, 22], dy: 24, g: -150 }),
    qSlashA: CP({ t1: 162, t2: 8, n: -10, h: -6, ht: 6, st: -8, aF: [100, -6], aB: [-40, 50], bf: 0, lF: [46, -62], lB: [-44, 10], fF: -2, fB: -22, dy: 22, g: 0, fx: 'qslash' }),
    qSlashB: CP({ t1: 166, t2: 8, n: -8, h: -8, aF: [118, 46], aB: [70, 20], lF: [44, -58], lB: [-42, 10], fF: -2, fB: -22, dy: 20, g: -90, fx: 'qslash2' }),
    // heavy: raised behind the head, slammed into the floor
    hvRaise: CP({ t1: 194, t2: -10, n: 8, h: -10, ht: -4, st: 8, aF: [196, -16], aB: [176, 2], lF: [32, -30], lB: [-30, 10], dy: 6, g: 40 }),
    hvSlam: CP({ t1: 148, t2: 14, n: -8, h: 2, ht: 6, st: -8, aF: [112, -36], aB: [100, -24], lF: [50, -66], lB: [-42, 8], fF: -4, fB: -24, dy: 30, g: -22, fx: 'smash' }),
    // bow: draw to the cheek, loose
    bowDraw: CP({ t1: 180, t2: 0, n: -4, h: -2, aF: [90, 0], aB: [96, -168], bf: 1, lF: [26, -18], lB: [-26, 12], dy: 8, g: 0 }),
    bowLoose: CP({ t1: 184, t2: -4, n: -6, h: -4, aF: [92, -2], aB: [-70, 36], bf: 0, lF: [26, -18], lB: [-26, 12], dy: 8, g: 0, fx: 'loose' }),
    // gun: aim, recoil
    gunAim: CP({ t1: 176, t2: 4, n: -4, h: -4, aF: [84, 6], aB: [76, 20], lF: [34, -34], lB: [-32, 16], dy: 14, g: 0 }),
    gunKick: CP({ t1: 192, t2: -8, n: 6, h: -10, aF: [112, -4], aB: [96, 10], lF: [30, -26], lB: [-34, 20], dx: -8, dy: 12, g: -6, fx: 'muzzle' }),
    // fist: jab, cross, uppercut
    jab: CP({ t1: 166, t2: 8, n: -8, h: -8, aF: [94, -4], aB: [40, 128], lF: [38, -44], lB: [-34, 14], dy: 16, g: 0, fx: 'jab' }),
    cross: CP({ t1: 158, t2: 10, n: -10, h: -8, ht: 6, st: -6, aF: [52, 118], aB: [90, 0], lF: [42, -52], lB: [-40, 6], fF: 0, fB: -24, dx: 6, dy: 18, g: 0, fx: 'cross' }),
    upper: CP({ t1: 170, t2: 6, n: -12, h: -12, aF: [136, 30], aB: [30, 120], lF: [30, -20], lB: [-26, 4], dy: 2, air: 6, g: 0, fx: 'upper' }),
    // reactions
    hurtBig: { tw: 1, t1: 212, t2: -16, n: 22, h: 24, ht: -8, st: 12, aF: [-54, 34], aB: [-84, 20], lF: [22, -30], lB: [-28, 4], fF: 12, fB: -10, g: -150, dx: -10, dy: 12, expr: 'hurt', fx: 'hit' },
    dodge: CP({ t1: 198, t2: -10, n: 6, h: -8, aF: [36, 96], aB: [-34, 64], bf: 0, lF: [36, -66], lB: [-26, 14], dx: -18, dy: 10, air: 6 }),
    ko: { tw: 0.8, t1: 214, t2: -14, n: 26, h: 30, ht: -6, st: 10, aF: [-24, 14], aB: [-44, 10], lF: [44, -104], lB: [-6, -90], fF: 10, fB: -40, g: -150, dy: 46, expr: 'hurt' },
    // techniques: a palm thrust (attacks), a hand seal (support, defense), a power-up (ultimates)
    cast: CP({ t1: 168, t2: 6, n: -8, h: -6, aF: [40, 116], aB: [92, -2], bf: 1, lF: [40, -48], lB: [-36, 10], dy: 16, g: 20, fx: 'cast' }),
    seal: CP({ t1: 180, t2: 2, n: 4, h: 6, aF: [24, 132], aB: [-12, 150], bf: 1, lF: [26, -22], lB: [-24, 12], dy: 8, g: -150 }),
    powerUp: CP({ tw: 0.6, t1: 182, t2: -6, n: -10, h: -12, aF: [44, -64], aB: [-44, 64], bf: 0, lF: [34, -40], lB: [-32, 14], dy: 18, g: -150, fx: 'aura' }),
    // victories
    flourish: CP({ tw: 0.8, t1: 182, t2: -4, n: -8, h: -10, aF: [168, -6], aB: [-40, -30], bf: 0, lF: [16, -6], lB: [-10, 4], dy: 0, g: 10, expr: 'happy' }),
  });
}
const POSE_KEYS = ['t1', 't2', 'n', 'h', 'ht', 'st', 'tw', 'fF', 'fB', 'g', 'dy', 'air', 'dx', 'rb', 'cr', 'pt', 'sa', 'fq', 'fl'];
function lerpPose(a, b, k) {
  const o = {};
  for (const key of POSE_KEYS) o[key] = (a[key] || 0) + ((b[key] || 0) - (a[key] || 0)) * k;
  for (const key of ['aF', 'aB', 'lF', 'lB']) o[key] = [0, 1].map((i) => a[key][i] + (b[key][i] - a[key][i]) * k);
  for (const key of ['expr', 'prop', 'sh', 'bf', 'ff', 'tool', 'panB']) o[key] = k < 0.5 ? a[key] : b[key];
  if (a.A != null && b.A != null) o.A = a.A + (b.A - a.A) * k; else o.A = k < 0.5 ? a.A : b.A;
  o.hang = (a.hang || 0) + ((b.hang || 0) - (a.hang || 0)) * k;
  o.fd = a.fd && b.fd ? a.fd.map((v, i) => v + (b.fd[i] - v) * k) : k < 0.5 ? a.fd : b.fd;
  o.fx = k > 0.3 ? b.fx : a.fx;
  return o;
}
const ease = {
  io: (x) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2),
  out: (x) => 1 - Math.pow(1 - x, 3),
  back: (x) => 1 + 2.4 * Math.pow(x - 1, 3) + 1.4 * Math.pow(x - 1, 2),
  in: (x) => x * x * x,
  lin: (x) => x,
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
// Proportions of the base character sheet (about 4.2 heads): a big round head on a very short neck,
// a short rounded-box torso a little wider at the hips, long straight legs (about 1.4 torsos),
// arms long enough that the round fists hang at the crotch.
// Bone lengths are fixed (forward kinematics); the body faces the viewer, so shoulders and hips
// sit apart, and they tilt against each other (contrapposto).
const GROUND = 226;
function solve(P, B) {
  const s = B.h, W = B.w;
  const len = { ab: 17 * s, ch: 20 * s, nk: 8 * s, ua: 23 * s, fa: 21 * s, th: 36 * s, sh: 35 * s, ft: 4 * s };
  const pelvis = [100 + (P.dx || 0), 120 + P.dy];
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
  const shF = add(sl, chestA - 90 + st, 13.5 * W * (1 - 0.18 * tw)), shB = add(sl, chestA + 90 + st, 13.5 * W * (1 - 0.42 * tw));
  const hipF = add(pelvis, P.t1 - 90 + ht, 8 * W * (1 - 0.2 * tw)), hipB = add(pelvis, P.t1 + 90 + ht, 8 * W * (1 - 0.4 * tw));
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

/* ================================================================ driven animations */
// Fishing and cooking are not single poses but full motion cycles, played in step with the
// action's progress: one cycle per fish caught or dish cooked. Each cycle is a set of key poses
// (pose to pose, with easing) plus continuous motion (the stirring, the bobbing rod, breathing).
// Two things keep the body grounded and believable:
// - planted feet: the legs are solved by IK so the feet never slide while the hips shift weight
//   from one leg to the other;
// - two-handed grips: the back hand is solved by IK onto the tool (the reel's crank, the spatula),
//   so it follows wherever the front hand carries the rod or the pan.
// Two-bone IK: [upper angle (absolute), bend] that put the end of a chain from o (bones l1, l2) on p.
// sgn: which way the middle joint points (+1 knees, forward; -1 elbows, downward).
function ik2(o, p, l1, l2, sgn) {
  const dx = p[0] - o[0], dy = p[1] - o[1];
  const d = Math.max(Math.abs(l1 - l2) + 0.01, Math.min(l1 + l2 - 0.01, Math.hypot(dx, dy)));
  const base = Math.atan2(dx, dy) / D2R;
  const al = Math.acos(Math.max(-1, Math.min(1, (l1 * l1 + d * d - l2 * l2) / (2 * l1 * d)))) / D2R;
  const be = Math.acos(Math.max(-1, Math.min(1, (l1 * l1 + l2 * l2 - d * d) / (2 * l1 * l2)))) / D2R;
  return [base + sgn * al, -sgn * (180 - be)];
}
// Blend two key poses (numbers and arrays blend, everything else switches half way).
function mixPose(a, b, k) {
  const o = {};
  for (const key in Object.assign({}, a, b)) {
    const x = a[key], y = b[key];
    if (typeof x === 'number' && typeof y === 'number') o[key] = x + (y - x) * k;
    else if (Array.isArray(x) && Array.isArray(y)) o[key] = x.map((v, i) => v + (y[i] - v) * k);
    else o[key] = k < 0.5 ? (x !== undefined ? x : y) : (y !== undefined ? y : x);
  }
  return o;
}
// The pose at u (0..1) along keys [[u, pose, easing into it]].
function keyPose(keys, u) {
  let i = 0;
  while (i < keys.length - 2 && u >= keys[i + 1][0]) i++;
  const [u0, a] = keys[i], [u1, b, e] = keys[i + 1];
  return mixPose(a, b, ease[e || 'io'](Math.max(0, Math.min(1, (u - u0) / (u1 - u0 || 1)))));
}
// 0 outside [a, d], 1 inside [b, c], smooth ramps between.
const win = (u, a, b, c, d) => (u <= a || u >= d ? 0 : u < b ? ease.io((u - a) / (b - a)) : u > c ? ease.io((d - u) / (d - c)) : 1);
// Solve the legs onto planted feet (P.feet: ankle x of the front and back foot), then each hand
// onto the point its function returns (given the solved rig): hands.B for the back hand, hands.F
// for the front one. Elbows point down, knees forward.
function plantPose(P, B, hands) {
  const s = B.h, W = B.w;
  let J = solve(P, B);
  const ox = J.pelvis[0] - 100 - (P.dx || 0), oy = J.pelvis[1] - 120 - (P.dy || 0);
  P.lF = ik2(J.hipF, [100 + P.feet[0] + ox, 120 + 69.5 * s + oy], 36 * s, 35 * s, 1);
  P.lB = ik2(J.hipB, [100 + P.feet[1] + ox, 120 + 69.5 * s + oy], 36 * s, 35 * s, 1);
  const reach = (k, sh, target) => {
    let fa = P[k][0] + P[k][1];
    for (let i = 0; i < 3; i++) { P[k] = ik2(sh, add(target, fa, -4.2 * W), 23 * s, 21 * s, -1); fa = P[k][0] + P[k][1]; }
  };
  if (hands && hands.F) { J = solve(P, B); reach('aF', J.shF, hands.F(J)); }
  if (hands && hands.B) { J = solve(P, B); reach('aB', J.shB, hands.B(J)); }
  return P;
}
// The reel hangs under the rod just behind the front hand; its crank turns around it.
const reelAt = (hand, a) => add(add(hand, a, -6), a - 90, 6.5);
const knobAt = (hand, a, cr) => add(reelAt(hand, a), cr, 4.6);
// The pan's centre, from the hand holding its handle.
const panAt0 = (hand, a) => add(hand, a, 24);

// ---- fishing: lift the catch, back-cast, cast, wait (crank in some slack), the bite, the strike.
// R: the rod's angle · rb: how much it bends · cr: the crank's angle.
const FISH_BASE = { hang: 0, sh: 1, prop: 'rod', bf: 1, fF: 12, fB: -192, feet: [13, -12], n: 2, t2: 2, ht: -2, st: 2, aB: [30, 90], lF: [0, 0], lB: [0, 0], cr: 40, rb: 0, dx: 0 };
const FK = (o) => Object.assign({}, FISH_BASE, o);
const FISH_WAIT = FK({ t1: 178, t2: 2, n: 2, h: 7, aF: [34, 56], R: 128, dy: 1, rb: 0.04, tw: 0.35 });
const FISH_LIFT = FK({ t1: 190, t2: -6, n: -4, h: -8, ht: -4, st: -2, aF: [140, 22], R: 170, dx: -4, dy: 1, rb: 0.25, tw: 0.45, expr: 'happy', hang: 1 });
const FISH_KEYS = [
  [0, FISH_LIFT],
  [0.05, FK({ t1: 186, t2: -4, n: -2, h: -6, ht: -3, aF: [150, 30], R: 184, dx: -3, dy: 1, rb: 0.12, tw: 0.45, expr: 'happy', hang: 1 })],
  [0.12, FK({ t1: 189, t2: -8, n: -2, h: -4, ht: -5, st: -4, aF: [168, 40], R: 208, dx: -6, dy: 3, rb: -0.2, tw: 0.55, hang: 1 })],
  [0.18, FK({ t1: 165, t2: 8, n: -6, h: 0, ht: 5, st: 4, aF: [96, 12], R: 116, dx: 6, dy: 4, rb: 0.14, tw: 0.6 }), 'out'],
  [0.26, FK({ t1: 172, t2: 6, n: -2, h: 4, ht: 3, aF: [62, 32], R: 112, dx: 4, dy: 2, rb: 0, tw: 0.45 })],
  [0.34, FISH_WAIT],
  [0.79, FISH_WAIT],
  [0.86, FK({ t1: 184, t2: -2, n: 4, h: 11, ht: -3, aF: [40, 50], R: 112, dx: -2, dy: 5, rb: 0.3, tw: 0.45 })],
  [0.93, FK({ t1: 185, t2: -2, n: 4, h: 11, ht: -3, aF: [42, 50], R: 110, dx: -2, dy: 6, rb: 0.34, tw: 0.45 })],
  [0.97, FK({ t1: 192, t2: -8, n: -4, h: -8, ht: -5, st: -3, aF: [128, 26], R: 164, dx: -5, dy: 2, rb: 0.45, tw: 0.5 }), 'out'],
  [1, FISH_LIFT],
];
const POSE_DRIVE = {};
POSE_DRIVE.fish = (u, t, B, calm) => {
  const P = keyPose(FISH_KEYS, u), w = win(u, 0.3, 0.36, 0.76, 0.8), bite = win(u, 0.8, 0.84, 0.93, 0.95);
  // waiting: the rod tip bobs, the weight drifts from foot to foot, the line is reeled in a little
  P.R += Math.sin(t * 1.3) * 2.2 * w; P.t1 += Math.sin(t * 0.7) * 1.4 * w; P.dx += Math.sin(t * 0.7) * 1.6 * w; P.h += Math.sin(t * 0.5) * 2 * w;
  if (u > 0.5 && u < 0.7) P.cr = 40 + ((u - 0.5) / 0.2) * 1080;
  // the bite: the fish tugs, the rod dips and shudders, the angler braces
  if (bite) { const j = Math.sin(t * 26) * 0.5 + Math.sin(t * 17) * 0.5; P.R -= (3 + 4 * j) * bite; P.rb += 0.08 * j * bite; P.t1 += j * 1.2 * bite; }
  const br = calm ? 0 : Math.sin(t * 2.2);
  P.t2 += br * 1.5; P.n -= br * 1.1;
  P.g = P.R - (P.aF[0] + P.aF[1]);
  return plantPose(P, B, { B: (J) => knobAt(add(J.aF[2], J.foreA.aF, 4.2 * B.w), J.foreA.aF + P.g, P.cr) });
};

// ---- cooking: stir, loosen, push, pull back and flick, follow the food up, catch it, settle.
// As at a real stove, seen from this side: the far hand holds the pan by its handle, the near
// hand stirs with a spatula. The pan rests on a burner fixed in the room (c: its centre, from the
// floor under the figure), so the body sways around it and both arms are solved onto it.
// The toss follows how cooks really do it: the motion is mostly back and forth, not up and down.
// Shake the pan to loosen the food, push it forward (far edge down) so the food slides to the far
// rim, then pull back sharply while the far lip flicks up: the food leaves the rim, arcs up and
// back towards the cook, flips, and the pan meets it under the arc and gives a little as it lands.
// A: the handle's angle · pt: the pan's tilt (+ lifts the far lip) · tx, ty: the spatula's tip in
// the pan · sa: the spatula's angle · fd: the food [x, height, spin] · fb: two small bits [x, h, x, h]
// · fq: squash (+ flattened, - stretched) · fl: 1 while the food is in the air.
const COOK_BASE = { sh: 1, panB: 1, tool: 'spatula', bf: 1, ff: 1, fF: 12, fB: -192, feet: [12, -13], n: 4, t2: 4, st: 2, ht: -2, aF: [30, 60], aB: [30, 90], lF: [0, 0], lB: [0, 0], tw: 0.7, dx: 0, dy: 1, pt: 0, tx: 2, ty: -1.5, sa: -18, g: 0 };
const CK = (o) => Object.assign({}, COOK_BASE, o);
const COOK_STIR = CK({ t1: 168, h: 18, c: [46, -10], A: 98, dx: 2 });
const COOK_T = { push: 0.565, launch: 0.645, land: 0.8 };
const COOK_PUSH = CK({ t1: 161, t2: 7, n: -1, h: 17, c: [57, -10], A: 97, pt: -15, dx: 6, dy: 3, tx: -3, ty: -16, sa: -6 });
const COOK_KEYS = [
  [0, COOK_STIR],
  [0.5, COOK_STIR],
  // loosen: two quick shakes, the spatula comes out of the pan (anticipation)
  [0.555, CK({ t1: 170, h: 16, c: [45, -11], A: 99, pt: 2, dx: 0, dy: 2, tx: -4, ty: -14, sa: -8 })],
  // push forward, far edge down: the food slides to the far rim
  [0.625, COOK_PUSH],
  [COOK_T.launch, CK(Object.assign({}, COOK_PUSH, { c: [58, -10], pt: -17, dx: 7 }))],
  // pull back sharply and flick the far lip up: the food leaves the pan
  [0.675, CK({ t1: 175, t2: 1, n: -4, h: 2, c: [43, -17], A: 101, pt: 24, dx: -2, dy: 1, tx: -2, ty: -22, sa: -4 }), 'out'],
  // follow the food up with the eyes, bring the pan back under it
  [0.745, CK({ t1: 170, t2: 3, n: -6, h: -4, c: [47, -13], A: 98, pt: 4, dx: 1, dy: 1, tx: -2, ty: -20, sa: -6 })],
  [COOK_T.land, CK({ t1: 168, t2: 4, n: 0, h: 10, c: [48, -10], A: 98, pt: -2, dx: 2, dy: 2, tx: -2, ty: -16, sa: -8 })],
  // the catch: the pan and the knees give a little, like catching a ball
  [0.835, CK({ t1: 166, t2: 5, n: 4, h: 16, c: [48, -5], A: 98, pt: 0, dx: 2, dy: 5, tx: 0, ty: -9, sa: -12 }), 'out'],
  [0.92, CK({ t1: 168, h: 17, c: [46, -9], A: 98, dx: 2, tx: 2, ty: -3, sa: -16 })],
  [1, COOK_STIR],
];
// Where the food is in the room (same frame as c): from the far rim at the launch to the pan's centre at the catch.
const COOK_FROM = [69, -10], COOK_TO = [48, -10];
function cookFood(k, peak, land) {
  const e = ease.io(k);
  return [COOK_FROM[0] + (COOK_TO[0] + land - COOK_FROM[0]) * e, COOK_FROM[1] + (COOK_TO[1] - COOK_FROM[1]) * k - Math.sin(Math.PI * k) * peak];
}
POSE_DRIVE.cook = (u, t, B, calm) => {
  const P = keyPose(COOK_KEYS, u), stir = win(u, -1, 0, 0.47, 0.52);
  // stirring: the spatula circles in the pan, the pan hand jiggles it, the body works with the stirring arm
  if (stir) {
    const ph = (u / 0.5) * Math.PI * 2 * 3;
    P.tx += (Math.cos(ph) - 1) * 6 * stir; P.ty += Math.sin(ph) * 2 * stir;
    P.A += Math.sin(t * 9) * 1.6 * stir; P.c = [P.c[0] + Math.sin(t * 9) * 0.6 * stir, P.c[1]];
    P.st += Math.cos(ph) * 2 * stir; P.sa += Math.sin(ph) * 8 * stir; P.t1 += Math.cos(ph) * 1 * stir;
    P.dx += Math.sin(t * 0.8) * 1.4 * stir; P.h += Math.sin(t * 0.6) * 2 * stir;
  }
  // loosening: two short shakes of the pan
  const sh = win(u, 0.5, 0.505, 0.55, 0.56);
  if (sh) { const w = Math.sin(((u - 0.5) / 0.06) * Math.PI * 4); P.c = [P.c[0] + w * 2.6 * sh, P.c[1]]; P.pt += w * 4 * sh; }
  // the food: pushed around by the spatula, slid to the far rim, tossed, caught (a hop as it lands)
  const T = COOK_T, rest = [P.tx * 0.3, 0, Math.sin(u * 20) * 6], bitsRest = [-6 + P.tx * 0.2, 0, 5.5 + P.tx * 0.25, 0];
  P.fq = 0; P.fl = 0;
  if (u < T.launch) {
    const s = ease.io(Math.max(0, Math.min(1, (u - T.push) / (T.launch - T.push))));
    P.fd = [rest[0] + (11 - rest[0]) * s, 0, rest[2] * (1 - s)];
    P.fb = [bitsRest[0] + (7 - bitsRest[0]) * s, 0, bitsRest[2] + (12 - bitsRest[2]) * s, 0];
  } else {
    const fly = (d, peak, land, x0) => {
      const k = (u - T.launch - d) / (T.land - T.launch);
      if (k <= 0) return [x0, 0];
      if (k >= 1) { const hop = Math.sin(Math.PI * Math.min(1, (u - T.land - d) / 0.04)); return [land, Math.max(0, hop) * 3]; }
      const p = cookFood(k, peak, land);
      return [p[0] - P.c[0], P.c[1] - p[1]];
    };
    const k = (u - T.launch) / (T.land - T.launch), m = fly(0, 44, 0, 11);
    P.fd = [m[0], m[1], k < 1 ? ease.io(k) * 360 : 0];
    P.fb = [...fly(0.012, 36, -6, 7), ...fly(0.022, 50, 5.5, 12)];
    P.fl = k > 0 && k < 1 ? 1 : 0;
    // stretched as it leaves, squashed flat as it lands
    P.fq = -0.25 * win(u, T.launch, T.launch + 0.01, T.launch + 0.03, T.launch + 0.06) + 0.45 * win(u, T.land - 0.005, T.land + 0.005, T.land + 0.012, T.land + 0.06);
  }
  const br = calm ? 0 : Math.sin(t * 2.2);
  P.t2 += br * 1.3; P.n -= br;
  const c = [100 + P.c[0], GROUND - 75 + P.c[1]];
  return plantPose(P, B, {
    B: () => add(c, P.A, -24),                                      // the pan's handle
    F: () => add([c[0] + P.tx, c[1] + P.ty], P.sa, -18),            // the spatula, its tip in the pan
  });
};

// ---- woodcutting: the felling swing, twice per log (a high cut, then a lower one: the notch is a V).
// Built from how an axe is really swung and from game animation practice:
// - a slow, readable wind-up (the weight goes onto the back foot, the axe rises behind the head, the
//   eyes stay on the cut), a short hang at the top, then a very fast strike: anticipation slow,
//   action fast ("delay the start and hold the ending");
// - the hands: the front hand stays near the end of the haft, the back hand slides up near the head
//   on the wind-up and down to meet the other hand at impact;
// - the hips drive the swing, the chest, head and arms follow and settle at different moments
//   (overlapping action), the knees drop the weight into the blow;
// - hit-stop: the axe freezes in the wood for a few frames, then quivers, is levered up and down to
//   free it and pulled back.
// G: the front hand, from the floor under the figure · R: the haft's angle · s: where the back hand
// holds the haft (distance from the front hand) · smR: the haft's angle a moment ago (the smear).
const WOOD_SWINGS = 2, WOOD_HIT = 0.55;
const WOOD_BASE = { sh: 1, prop: 'axe', bf: 1, fF: 12, fB: -194, feet: [17, -15], n: 0, t2: 2, st: 0, ht: 0, aF: [30, 60], aB: [30, 90], lF: [0, 0], lB: [0, 0], g: 0 };
function woodKeys(low) {
  const W = (o) => Object.assign({}, WOOD_BASE, o), y = low ? -9 : 0;
  const ready = W({ t1: 176, t2: 2, h: 9, tw: 0.75, dx: 2, dy: 3, G: [24, 84 + y], R: 120, s: 11 });
  const top = W({ t1: 195 - (low ? 3 : 0), t2: -10, n: 4, h: 4, tw: 0.42, st: 8, ht: -5, dx: -8, dy: -1, G: [-17, 136 + y * 0.6], R: 246 - (low ? 10 : 0), s: 27 });
  const hit = W({ t1: 163, t2: 9, n: -3, h: 13, tw: 0.92, st: -7, ht: 6, dx: 8, dy: 10, G: [31, 86 + y], R: 133 - (low ? 7 : 0), s: 7, expr: 'hurt' });
  const after = (o) => W(Object.assign({}, hit, { expr: undefined }, o));
  return [
    [0, ready],
    [0.1, W({ t1: 182, t2: -3, h: 6, tw: 0.62, dx: -2, dy: 2, G: [6, 118 + y], R: 190, s: 19 })],
    [0.4, top, 'out'],
    [0.47, W(Object.assign({}, top, { t1: top.t1 + 1, G: [-19, 137 + y * 0.6], R: top.R + 5 }))],
    [0.51, W({ t1: 178, t2: 4, n: 0, h: 7, tw: 0.72, st: -2, ht: 2, dx: 3, dy: 4, G: [14, 134 + y], R: 172 - (low ? 4 : 0), s: 15 }), 'in'],
    [WOOD_HIT, hit, 'lin'],
    [0.61, hit],                                                          // hit-stop: frozen in the wood
    [0.67, after({ t1: 161, t2: 10, h: 15, dy: 12, n: -1 }), 'out'],      // the body follows through
    [0.75, after({ t1: 169, t2: 5, h: 11, dy: 7, G: [28, 93 + y], R: hit.R + 11, s: 8 })],
    [0.81, after({ t1: 172, t2: 4, h: 10, dy: 6, G: [26, 82 + y], R: hit.R - 9, s: 9 })],
    [0.9, after({ t1: 177, t2: 2, h: 9, tw: 0.78, st: 0, ht: 0, dx: 1, dy: 4, G: [19, 86 + y], R: 114, s: 11 }), 'out'],
    [1, ready],
  ];
}
const WOOD_KEYS = [woodKeys(false), woodKeys(true)];
POSE_DRIVE.wood = (u, t, B, calm) => {
  const w = Math.max(0, Math.min(WOOD_SWINGS - 0.0001, u * WOOD_SWINGS)), i = Math.floor(w), v = w - i, keys = WOOD_KEYS[i % 2];
  const P = keyPose(keys, v);
  // the smear: where the haft was a moment ago, during the strike only
  if (v > 0.475 && v <= WOOD_HIT) P.smR = keyPose(keys, Math.max(0.47, v - 0.03)).R;
  // after the freeze the haft quivers in the wood, dying out
  const q = win(v, 0.6, 0.61, 0.63, 0.72);
  if (q) P.R += Math.sin(v * 900) * 2.2 * q * (1 - (v - 0.6) / 0.12);
  const br = calm ? 0 : Math.sin(t * 2.2);
  P.t2 += br * 1.2; P.n -= br * 0.8;
  const G = [100 + P.G[0], GROUND - P.G[1]];
  plantPose(P, B, {
    F: () => G,
    B: (J) => add(add(J.aF[2], J.foreA.aF, 4.2 * B.w), P.R, P.s),   // the sliding hand, on the haft
  });
  P.g = P.R - (P.aF[0] + P.aF[1]);
  return P;
};
// Which point of its cycle a driven pose is at: the running action's progress when it is long
// enough to show a whole cycle, otherwise a steady loop.
const DRIVE_SKILL = { fish: ['fishing', 4.5], cook: ['cooking', 3], wood: ['woodcutting', 3] };
function driveU(name, t) {
  const [sk, per] = DRIVE_SKILL[name] || ['', 2];
  if (S && S.action && S.action.skill === sk) {
    const a = findAction(sk, S.action.id), T = a && actionTime(sk, a);
    if (T >= 1.2) return Math.max(0, Math.min(0.9999, S.action.prog / T));
    if (T > 0) return ((t / Math.max(0.6, T)) % 1 + 1) % 1;
  }
  return ((t / per) % 1 + 1) % 1;
}
// Still versions (portraits, previews, the scene's first frame): mid-wait, mid-stir, ready to swing.
{
  const B0 = BODY;
  POSES.fish = POSE_DRIVE.fish(0.5, 0, B0, true);
  POSES.cook = POSE_DRIVE.cook(0.3, 0, B0, true);
  POSES.wood = POSE_DRIVE.wood(0.02, 0, B0, true);
}

// ---- combat stances: the weapon family (blade, quick, heavy, spear, bow, gun, fist) of what a fighter holds,
// and a living guard for each: breathing, weight shifting from foot to foot over planted feet, fist and
// knife fighters bouncing on the balls of their feet, and every ~7 s a small fidget (a blade twirl,
// a knife flip, a gun spin, a shoulder roll, a shadow jab, a test of the bowstring).
const CB_KIND = { katana: 'blade', cutlass: 'blade', sickle: 'blade', short: 'quick', hammer: 'heavy', cleaver: 'heavy', lance: 'spear', bow: 'bow', cannon: 'gun', fist: 'fist', claw: 'fist' };
function cbFam(id) {
  if (!id || !ITEMS[id]) return 'fist';
  const k = weaponKind(id);
  if (k !== 'cutlass') return CB_KIND[k] || 'blade';
  // a plain sword shape: the item's own family (weapons.js, or it.fam behind a manga name) refines it
  const af = ITEMS[id].fam || (typeof armFamily === 'function' ? armFamily(id) : '');
  return af === 'short' ? 'quick' : 'blade';
}
const cbStance = (id) => 'st_' + cbFam(id);
// a foe winding up a telegraphed move holds its family's charge pose (with the red glow and the "!")
const CB_CHARGE = { blade: 'windup', quick: 'qCoil', heavy: 'hvRaise', spear: 'spCoil', bow: 'bowDraw', gun: 'gunAim', fist: 'powerUp' };
let cbKoT = 0;   // until when your fighter lies knocked out (arena.js sets it on a defeat)
{
  const ST = {
    blade: { br: 2.2, bob: 0, sway: 3, fid: 'twirl' },
    quick: { br: 2.7, bob: 5, bf: 1.15, sway: 6, fid: 'flip' },
    heavy: { br: 1.6, bob: 0, sway: 1.5, fid: 'heft' },
    spear: { br: 2, bob: 0, sway: 2.5, fid: 'twirl' },
    bow:   { br: 1.8, bob: 0, sway: 1.5, fid: 'string' },
    gun:   { br: 2, bob: 0, sway: 2, fid: 'spin' },
    fist:  { br: 2.7, bob: 6, bf: 1.2, sway: 0, fid: 'jab' },
  };
  const mixA = (a, b, k) => [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k];
  const FID = {
    twirl: (P, k, v) => { P.g += 360 * ease.io(v); P.h -= 3 * k; },
    flip: (P, k, v) => { P.g += 720 * ease.io(v); P.aF = mixA(P.aF, [80, 70], k * 0.5); },
    spin: (P, k, v) => { P.g += 720 * ease.out(v); P.aF = mixA(P.aF, [70, 40], k * 0.6); P.h -= 4 * k; },
    heft: (P, k) => { P.aF = mixA(P.aF, [150, -40], k * 0.55); P.aB = mixA(P.aB, [120, -10], k * 0.4); P.t2 -= 4 * k; P.h -= 6 * k; },
    string: (P, k) => { P.aB = mixA(P.aB, [96, -168], k * 0.7); P.h -= 3 * k; },
    jab: (P, k, v) => { const j = Math.sin(Math.min(1, v * 2) * Math.PI) + 0.8 * Math.sin(Math.max(0, v * 2 - 1) * Math.PI); P.aF = mixA(P.aF, [94, -4], Math.min(1, j) * k); P.t1 -= 3 * j * k; },
  };
  const feetOf = (P0, B) => { const J = solve(P0, B), dx = P0.dx || 0; return [J.lF[2][0] - 100 - dx, J.lB[2][0] - 100 - dx]; };
  for (const f in ST) {
    const o = ST[f], name = 'st_' + f;
    POSE_DRIVE[name] = (u, t, B, calm) => {
      const P0 = POSES[name], P = Object.assign({}, P0, { aF: P0.aF.slice(), aB: P0.aB.slice() });
      if (calm) return P;
      const br = Math.sin(t * o.br), b = o.bob ? 0.5 - 0.5 * Math.cos(t * o.bf * 2 * Math.PI) : 0;
      P.t2 += br * 1.6; P.n -= br * 1.2; P.h = (P.h || 0) + Math.sin(t * 0.9) * 1.5;
      P.aF[0] += br * 1.4 - b * 3; P.aB[0] -= br * 1.4 + b * 2;
      P.g = (P0.g || 0) + Math.sin(t * 1.3) * o.sway;
      P.t1 += Math.sin(t * 0.8) * 1.4; P.dx = (P0.dx || 0) + Math.sin(t * 0.8) * 2;   // weight shift
      P.dy = (P0.dy || 0) + 1.2 + br * 1.2 + b * o.bob;
      const ph = (t % 7.3) / 7.3, k = win(ph, 0.8, 0.84, 0.93, 0.97);
      if (k) FID[o.fid](P, k, Math.max(0, Math.min(1, (ph - 0.82) / 0.13)));
      P.feet = feetOf(P0, B);
      return plantPose(P, B);
    };
  }
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
  const xf = AV_EXT.face[face];
  const plain = (xf && xf.eyes) || ['dots', 'smile', 'fierce', 'scar', 'stitch'].includes(face);
  const scar = face === 'scar' ? `<path d="M7,-6 L12,9" stroke="#ff4d5e" stroke-width="2.2" stroke-linecap="round"/>` : '';
  const xs = xf ? xf.svg : '';
  if (expr === 'hurt' && plain) return `<path d="M-5,-1 l5,3 -5,3 M12.5,-1 l-5,3 5,3" ${st}/><path d="M1,12 Q4.5,9 8,12" ${st}/>` + scar + xs;
  if (expr === 'happy' && plain) return `<path d="M-5,3 Q-2,-2 1,3 M7,3 Q9.5,-2 12,3" ${st}/><path d="M0,8 Q4.5,14 9.5,8" ${st}/>` + scar + xs;
  const eyes = `<ellipse cx="-2" cy="1" rx="2.1" ry="3.1" ${e}/><ellipse cx="9.5" cy="1" rx="1.8" ry="2.9" ${e}/>`
    + `<circle cx="-1.3" cy="-0.4" r=".8" fill="#fff" opacity=".8"/><circle cx="10.1" cy="-0.4" r=".7" fill="#fff" opacity=".8"/>`;
  if (xf) return (xf.eyes ? eyes : '') + xs;
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
const TORSO_W = [[-0.4, 15], [0, 15], [0.3, 13.9], [0.6, 13.3], [0.84, 13.2], [0.97, 11.6], [1.1, 5], [1.4, 4]];
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
// the bare hand: a ball, centred a little past the wrist (the grip point is its centre)
const HAND = circ([0.8, 0], 8.2);
// the bare foot: an inclined block, ankle at 0,0, sole on y = 5 (the ground), toe towards +x
const FOOT_BLOCK = 'M-6.6,5 C-9.6,5 -10.2,2.6 -10.2,-0.6 C-10.2,-4.6 -8,-7.4 -3.4,-7.6 C1.6,-7.8 5.8,-6 9.4,-3.4 C12.4,-1.2 14,0.8 14,2.6 C14,4.2 12.9,5 11.2,5Z';
const FOOT_SOLE = 'M-10,2.4 L13.8,2.4 C13.95,2.5 14,2.55 14,2.6 C14,4.2 12.9,5 11.2,5 L-6.6,5 C-8.8,5 -9.8,3.8 -10,2.4Z';
const SOLE = 'M-6.2,3 H13.8 Q15.4,3 15.4,4.6 Q15.4,6.2 13.8,6.2 H-6.2 Q-7.6,6.2 -7.6,4.6 Q-7.6,3 -6.2,3Z';

/* ---------------------------------------------------------------- hair */
// Head-local polar point: 0° = right, -90° = up, ±180° = left. The head faces the viewer.
const HP = (a, r) => [Math.cos(a * D2R) * r, Math.sin(a * D2R) * r];
// Every haircut is drawn the way anime hair is: a cap that hugs the skull with some volume, and
// locks (clumps) growing out of it. A lock is a tapered, curved blade from a root on the scalp to a
// sharp tip; all the locks and the cap merge into one silhouette with one outline.
// Three layers: back (behind the body: ponytails, long hair), front (over the head) and the fringe,
// which always stops above the eyes (eye tops sit at y = -2) or falls between them.
// Lock: x, y root · a direction (0 right, 90 down) · len · w width at the root · bend (degrees of curl)
// k: 'crown' (flattened under a covering hat) · hang: the direction is in world space (hair falls with gravity)
// sw: how much it sways (secondary motion)
const hj = (i, s) => { const v = Math.sin(i * 12.9898 + (s || 0) * 78.233) * 43758.5453; return v - Math.floor(v); };
// A lock drawn freehand (Studio brush) has a path: its spine relative to the root, turned as a whole
// by gravity (hang) and sway.
function lockPts(L, ha, t) {
  const sw = L.sw ? Math.sin(t * 2.1 + (L.ph || 0)) * L.sw : 0;
  let sp = [], n = 6;
  if (L.path && L.path.length > 1) {
    const r = ((L.hang ? -ha : 0) + sw) * D2R, c = Math.cos(r), s = Math.sin(r);
    sp = [[L.x, L.y], ...L.path.map(([x, y]) => [L.x + x * c - y * s, L.y + x * s + y * c])];
    n = sp.length - 1;
  } else {
    const step = L.len / n, a0 = (L.hang ? L.a - ha : L.a) + sw;
    let p = [L.x, L.y];
    for (let i = 0; i <= n; i++) {
      sp.push(p);
      const a = (a0 - L.bend / 2 + (L.bend * (i + 0.5)) / n) * D2R;
      p = [p[0] + Math.cos(a) * step, p[1] + Math.sin(a) * step];
    }
  }
  const hw = sp.map((_, i) => (L.w / 2) * Math.pow(1 - i / n, L.tp || 0.8) + (i === n ? 0 : 0.15));
  const Lf = offsetVar(sp, hw), Rt = offsetVar(sp, hw.map((h) => -h));
  return { pts: [...Lf.slice(0, n), [...sp[n], 1], ...Rt.slice(0, n).reverse()], sp };
}
// The cap: the skull outline pushed out by R (more on top), closed by the hairline across the
// forehead (y = line at the middle, curving down to y = side at the temples).
function hairCap(R, line, side, o) {
  o = o || {};
  const P = [], top = o.top || 1.5, a0 = 180 - Math.asin(Math.min(0.9, side / R)) / D2R, a1 = 360 + Math.asin(Math.min(0.9, side / R)) / D2R;
  for (let i = 0; i <= 12; i++) {
    const a = a0 + ((a1 - a0) * i) / 12, up = Math.max(0, -Math.sin(a * D2R));
    P.push(HP(a, R + up * top + (o.back && Math.cos(a * D2R) < 0 ? -Math.cos(a * D2R) * o.back : 0)));
  }
  const xr = P[12][0], xl = P[0][0];
  P[0].push(1); P[12].push(1);
  const hl = (x) => line + Math.pow(x / 16, 2) * (side - line) * 0.62;
  P.push([xr - 2.5, hl(xr - 2.5)], [xr * 0.45, hl(xr * 0.45) - (o.part || 0)], [0, line], [xl * 0.45, hl(xl * 0.45)], [xl + 2.5, hl(xl + 2.5)]);
  return P;
}
// Builders for the styles below.
const crownRing = (a0, a1, n, f) => [...Array(n)].map((_, i) => { const k = n > 1 ? i / (n - 1) : 0.5, a = a0 + (a1 - a0) * k, r = HP(a, 17); return Object.assign({ x: r[0], y: r[1], k: 'crown', bend: 0 }, f(a, k, i)); });
const lk = (x, y, a, len, w, bend, o) => Object.assign({ x, y, a, len, w, bend: bend || 0 }, o || {});
const HAIR = {
  // Messy black: short ragged spikes all round, a choppy fringe over the brows.
  tuft: { c: '#23242c', sh: '#101116', hi: '#5c5f73', cap: [20.4, -7, 5], locks: () => [
    ...crownRing(-184, -14, 11, (a, k, i) => ({ a: a + (a + 90) * 0.32 + (hj(i) - 0.5) * 22, len: 7 + hj(i, 1) * 4 + Math.sin(k * Math.PI) * 2.5, w: 9, bend: i % 2 ? 18 : -14 })),
    lk(14, -13, 70, 9, 7, -10), lk(8, -15, 86, 10.5, 8, 12), lk(1.5, -15.5, 96, 10, 8, -8), lk(-5, -15, 104, 10, 8, 10), lk(-11, -13, 112, 9.5, 7, -6),
    lk(-17, -6, 100, 11, 7, 12), lk(16.5, -6, 84, 8, 6, -10),
  ] },
  // Sea-salt mop: a shaggy round mop, soft clumps, ear-length at the sides, ragged bangs.
  mop: { c: '#1d1e24', sh: '#0c0d11', hi: '#4c5062', cap: [21.6, -7.5, 8], locks: () => [
    ...crownRing(-192, -8, 14, (a, k, i) => ({ a: a + (a + 90) * 0.55 + (hj(i, 2) - 0.5) * 34, len: 6 + hj(i, 3) * 3.5, w: 9.5, bend: i % 2 ? 40 : -34, tp: 0.55 })),
    lk(13, -14, 80, 10.5, 8, -24, { tp: 0.6 }), lk(7, -15.5, 92, 11, 8.5, 26, { tp: 0.6 }), lk(1, -15.5, 86, 10.5, 8, -22, { tp: 0.6 }), lk(-5, -15, 98, 11, 8.5, 24, { tp: 0.6 }), lk(-11, -14, 104, 10.5, 8, -20, { tp: 0.6 }),
    lk(-18, -4, 96, 14, 9, 22, { tp: 0.6 }), lk(-20, -9, 120, 12, 8, -18, { tp: 0.6 }), lk(17, -5, 86, 11, 7.5, -20, { tp: 0.6 }),
  ] },
  // Swept spikes: big golden spikes swept up and back, a few bangs, long locks framing the face.
  spikes: { c: '#ffd23a', sh: '#e39a12', hi: '#fff4b8', cap: [20.6, -8, 3], locks: () => [
    ...crownRing(-186, -28, 9, (a, k, i) => ({ a: a + (a + 90) * 0.18 - 14, len: 12 + Math.sin(k * Math.PI) * 10 + hj(i, 4) * 3, w: 11.5, bend: -14 })),
    lk(15, -12, 40, 10, 9, -16, { k: 'crown' }),
    lk(11, -15, 76, 11, 8.5, -8), lk(4, -16, 88, 11.5, 8.5, 10), lk(-4, -15.5, 98, 11, 8, -6),
    lk(16.5, -8, 94, 16, 7, 8), lk(-17, -6, 98, 15, 7.5, -10),
  ] },
  // Ember crest: wild orange spikes thrown forward and out, sharp bangs dropping between the eyes.
  ember: { c: '#ff8a2b', sh: '#c85612', hi: '#ffc896', cap: [20.6, -8, 4], locks: () => [
    ...crownRing(-182, -6, 10, (a, k, i) => ({ a: a + (a + 90) * 0.38 + 10 + (hj(i, 5) - 0.5) * 12, len: 9 + Math.sin(k * Math.PI) * 6 + hj(i, 6) * 3, w: 10.5, bend: 14 })),
    lk(12, -14, 74, 10, 8, -10), lk(5, -16, 90, 14, 8, 6), lk(-2, -15.5, 82, 13, 7.5, -8), lk(-9, -14, 102, 10, 7.5, 8),
    lk(-17, -5, 106, 10, 7, 14),
  ] },
  // Ascended flame: tall golden spikes standing straight up, a single bang over the forehead.
  flame: { c: '#ffd84a', sh: '#eb9b10', hi: '#fffbe0', cap: [21, -9, 2], locks: () => [
    ...crownRing(-178, -10, 9, (a, k, i) => ({ a: a * 0.45 - 90 * 0.55 - 8, len: 16 + Math.sin(k * Math.PI) * 16 + hj(i, 7) * 4, w: 12.5, bend: -10 })),
    lk(-17, -4, 160, 13, 9, -14, { k: 'crown' }), lk(17, -6, 20, 10, 8, -18, { k: 'crown' }),
    lk(3, -17, 100, 14, 6.5, 24), lk(9, -15, 80, 8, 6, -10), lk(-5, -15, 102, 8, 6, 8),
  ] },
  // Frost tousle: white hair pushed up and back, soft and fluffy, the face left open.
  frost: { c: '#f1f3f8', sh: '#aab3c6', hi: '#ffffff', cap: [20.4, -9.5, 1], locks: () => [
    ...crownRing(-176, -4, 11, (a, k, i) => ({ a: a * 0.42 - 90 * 0.58 + (hj(i, 8) - 0.5) * 20, len: 8 + Math.sin(k * Math.PI) * 7 + hj(i, 9) * 3, w: 11, bend: i % 2 ? 26 : -24, tp: 0.7 })),
    lk(13, -12, -40, 8, 8, 20, { k: 'crown', tp: 0.7 }), lk(6, -15, -70, 8, 8, -18, { k: 'crown', tp: 0.7 }),
    lk(-16, -8, 140, 7, 7, -18, { tp: 0.7 }), lk(16, -8, 40, 6, 6, 16, { tp: 0.7 }),
    lk(9, -14, 96, 8, 6.5, 22, { tp: 0.7 }), lk(1, -15, 84, 9, 6.5, -24, { tp: 0.7 }), lk(-8, -14, 108, 7.5, 6, 20, { tp: 0.7 }),
  ] },
  // Wild broom: a tall broom of green spikes, all standing up, leaning back a little.
  wild: { c: '#2f8a3c', sh: '#1a5a24', hi: '#86dc6e', cap: [20.2, -8, 2], locks: () => [
    ...crownRing(-170, -14, 12, (a, k, i) => ({ a: -90 + (a + 90) * 0.42 - 10 + (hj(i, 10) - 0.5) * 8, len: 18 + Math.sin(k * Math.PI) * 15 + hj(i, 11) * 5, w: 10, bend: (hj(i, 12) - 0.5) * 16 })),
    lk(12, -13, -50, 9, 8, -10, { k: 'crown' }), lk(-17, -4, 190, 10, 8, 12),
  ] },
  // Slicked back: combed flat and back, the ends flicking out at the nape, one loose strand.
  swept: { c: '#2b2340', sh: '#15102a', hi: '#8f74cc', cap: [20.8, -9.5, 5], back: 2.5, smooth: 1, locks: () => [
    lk(-17, -10, 176, 9, 9, -30), lk(-19, -3, 160, 10, 9, -36), lk(-18, 4, 140, 8, 8, -30), lk(-14, -15, 196, 7, 8, -24, { k: 'crown' }),
    lk(9, -17, 108, 13, 3.6, 70, { tp: 0.6 }),
  ], combs: [[-60, -170, 15], [-50, -175, 11], [-35, -160, 7]] },
  // Rift crest: a mohawk of tall spikes running front to back over shaved sides.
  crest: { c: '#ff4fbf', sh: '#8b2bd6', hi: '#ffd6f0', cap: [19.4, -9, 3], stubble: 1, locks: () => [
    ...crownRing(-132, -52, 7, (a, k, i) => ({ a: a + (a + 90) * 1.1, len: 12 + Math.sin(k * Math.PI) * 14, w: 9, bend: (k - 0.5) * 20 })),
  ] },
  // Buzz cut: short stubble hugging the skull.
  buzz: { c: '#3a342e', sh: '#211c17', hi: '#6a6258', cap: [19.5, -8.5, 6], buzz: 1, locks: () => [] },
  // High ponytail: hair pulled back to a tie high on the head, the tail swinging behind.
  pony: { c: '#7a3b1f', sh: '#4a200e', hi: '#c47a4a', cap: [20.4, -9, 5], back: 1.5, smooth: 1, tie: [-138, 23], locks: () => [
    lk(-15, -13, 128, 30, 11, -56, { hang: 1, sw: 6, back: 1, tp: 0.9 }), lk(-15, -13, 114, 33, 10, -42, { hang: 1, sw: 8, ph: 0.6, back: 1 }), lk(-15, -13, 102, 28, 8, -24, { hang: 1, sw: 9, ph: 1.2, back: 1 }),
    lk(12, -15, 110, 12, 7, 36), lk(5, -17, 140, 9, 6, 20), lk(17, -7, 92, 12, 5.5, 8),
  ], combs: [[-40, -140, 14], [-70, -140, 9]] },
  // Long and straight: a curtain to the shoulder blades, parted in the middle, locks framing the face.
  long: { c: '#2c2238', sh: '#160f20', hi: '#7a68a8', cap: [20.8, -8, 7], back: 1.5, smooth: 1, part: 2, locks: () => [
    lk(-17, -4, 104, 44, 13, 10, { hang: 1, sw: 3, back: 1, tp: 0.5 }), lk(-12, -12, 96, 46, 13, -4, { hang: 1, sw: 4, ph: 0.8, back: 1, tp: 0.5 }), lk(-4, -14, 88, 42, 12, -10, { hang: 1, sw: 3, ph: 1.6, back: 1, tp: 0.5 }),
    lk(17, -6, 92, 24, 7, -6, { tp: 0.6 }), lk(-18.5, -2, 98, 26, 8, 6, { tp: 0.6 }),
    lk(6, -16, 74, 11, 9, -14), lk(-6, -16, 106, 11, 9, 14),
  ], combs: [[-95, -150, 14], [-85, -30, 14]] },
  // Topknot: tied up in a bun on the crown, loose strands at the temples.
  bun: { c: '#3a2a1e', sh: '#1e140c', hi: '#7a5a40', cap: [20.2, -9, 5], back: 1, smooth: 1, bun: [-118, 22, 8.5], locks: () => [
    lk(16.5, -7, 96, 13, 4.4, 14, { tp: 0.6 }), lk(-17.5, -5, 92, 12, 4.4, -12, { tp: 0.6 }),
  ], combs: [[-150, -120, 15], [-60, -112, 13]] },
};
// Hats that cover the crown flatten the top locks; headbands leave them standing.
const HAT_COVER = { bucket: 1, chef: 1, tricorn: 1, beast: 1, bandana: 1 };
// The hair of a style, head-local (head radius 19): { front, back, lines, hi, shadow, extra }.
// ha: head rotation (hanging locks fall with gravity) · t: time (sway).
function hairShape(id, covered, ha, t) {
  const h = HAIR[id];
  if (!h) return null;
  const [R, line, side] = h.cap, locks = h.locks();
  const cap = hairCap(covered ? Math.min(R, 20) : R, line, side, { back: h.back, part: h.part, top: covered ? 0 : 1.5 });
  // a mohawk: the cap is only stubble; a strip along the top carries the crest
  const strip = () => [...[0, 1, 2, 3, 4].map((i) => HP(-134 + i * 21, 21)), [5, -12, 1], [0, -12.5], [-5, -12, 1]];
  const front = [h.stubble ? strip() : cap], back = [];
  let lines = '', hi = '';
  locks.forEach((L, i) => {
    if (covered && L.k === 'crown') { if (L.len < 9) return; L = Object.assign({}, L, { len: L.len * 0.3, path: L.path && L.path.map(([x, y]) => [x * 0.3, y * 0.3]) }); }
    const { pts, sp } = lockPts(L, ha || 0, t || 0);
    (L.back ? back : front).push(pts);
    // a strand line down the middle of bigger locks, a highlight on their lit (upper left) side
    if (L.len > 9 && !L.back && i % 2 === 0) lines += spline(sp.slice(1, 5).map((p, j) => [p[0] + (j - 1.5) * 0.3, p[1]]), false);
    if (L.k === 'crown' && L.len > 8 && i % 3 === 1) hi += spline(offsetVar(sp.slice(1, 4), [L.w * 0.18, L.w * 0.14, L.w * 0.1]), false);
  });
  if (h.buzz) for (let x = -14; x <= 14; x += 3.5) { const y = -8.5 + Math.pow(x / 16, 2) * 9; lines += `M${r1(x)},${r1(y - 0.3)}l${r1(x * 0.04)},-2.6`; }
  // combed hair: long curved lines from the hairline back across the cap
  for (const [a0, a1, r] of h.combs || []) {
    const pts = [0, 0.25, 0.5, 0.75, 1].map((k) => HP(a0 + (a1 - a0) * k, r + Math.sin(k * Math.PI) * 1.5));
    lines += spline(pts, false);
  }
  if (h.smooth) hi += `M${pt(HP(-150, 15.5))}A15.5,15.5 0 0,1 ${pt(HP(-118, 15.5))}M${pt(HP(-108, 15.5))}A15.5,15.5 0 0,1 ${pt(HP(-96, 15.5))}`;
  else if (!locks.length || covered) hi += `M${pt(HP(-150, 15))}A15,15 0 0,1 ${pt(HP(-120, 15))}`;
  // extras drawn over the cap: a hair tie, a bun
  let extra = '';
  if (h.tie) { const p = HP(h.tie[0], h.tie[1] - 4); extra += `<circle cx="${r1(p[0])}" cy="${r1(p[1])}" r="3.4" fill="#e8443a" stroke="${LINE}" stroke-width="1.6"/>`; }
  if (h.bun && !covered) {
    const [a, r, s] = h.bun, p = HP(a, r);
    front.push([...Array(10)].map((_, i) => [p[0] + Math.cos((i / 10) * 2 * Math.PI) * s, p[1] + Math.sin((i / 10) * 2 * Math.PI) * s * 0.9]));
    lines += `M${r1(p[0] - s * 0.6)},${r1(p[1] - s * 0.3)}Q${r1(p[0])},${r1(p[1] - s * 0.9)} ${r1(p[0] + s * 0.6)},${r1(p[1] - s * 0.2)}M${r1(p[0] - s * 0.5)},${r1(p[1] + s * 0.4)}Q${r1(p[0] + s * 0.2)},${r1(p[1])} ${r1(p[0] + s * 0.7)},${r1(p[1] + s * 0.3)}`;
    const q = HP(a, r - s * 0.85);
    extra += `<path d="M${r1(q[0] - 5)},${r1(q[1] + 1)} Q${r1(q[0])},${r1(q[1] - 2.5)} ${r1(q[0] + 5)},${r1(q[1] + 1)}" fill="none" stroke="${LINE}" stroke-width="4.4" stroke-linecap="round"/><path d="M${r1(q[0] - 5)},${r1(q[1] + 1)} Q${r1(q[0])},${r1(q[1] - 2.5)} ${r1(q[0] + 5)},${r1(q[1] + 1)}" fill="none" stroke="#c0392b" stroke-width="2.4" stroke-linecap="round"/>`;
  }
  // free hair masses drawn in the Studio merge into the same silhouette
  for (const m of h.masses || []) if (m.pts && m.pts.length > 2 && !(covered && m.crown)) (m.back ? back : front).push(m.pts);
  return { h, front: union(...front), back: back.length ? union(...back) : '', stub: h.stubble ? spline(cap, true) : '', lines, hi, extra };
}

/* ---------------------------------------------------------------- outfits */
// top: c colour · fit extra width · hem (v of its lower edge) · sl sleeve length (0 none, 0.9 to the wrist)
//      slc sleeve colour · wide (loose sleeve flare) · cuff · open (vest showing the chest) · v (inner V)
//      kimono (crossed lapels) · band [v, colour] across the shoulders · zip · buttons · emblem · trim
//      collar 'high' (cc colour, ch height) · chain · tails (coat length below the waist)
// bot: c colour · len (0.55 shorts, 1 full) · flare · cuff · fur cuff · wrap (bandage on the near thigh)
// sash [colour, knot position u] · belt · shoe [kind, colour] · wrist band colour
// Tops (with their sash and wrist bands) and bottoms (with their belt and shoes) are worn separately.
const TOPS = {
  tee:      { top: { c: '#5a6880', sl: 0.34, hem: -0.08 } },
  corsair:  { top: { c: '#d8343f', sl: 0.36, cuff: '#b8242f', open: 'skin', trim: '#ffd060', hem: -0.06 }, sash: ['#f4c430', -0.55] },
  shinobi:  { top: { c: '#ff8a1f', sl: 0.88, cuff: '#22252e', band: [0.64, '#22252e'], zip: '#e9e9ee', collar: 'high', cc: '#ff8a1f', ch: 3, hem: -0.14, fit: 2.8 } },
  reaper:   { top: { c: '#1b1c22', sl: 0.7, wide: 6, v: '#f2f0ea', kimono: 1, hem: -0.18, fit: 2.8 }, sash: ['#f2f0ea', 0.62] },
  gi:       { top: { c: '#ff7a1a', sl: 0.3, slc: '#2b4fb8', v: '#2b4fb8', emblem: '#f6f2e8', hem: -0.1, fit: 2.8 }, sash: ['#2b4fb8', 0.32], wrist: '#2b4fb8' },
  uniform:  { top: { c: '#1f2433', sl: 0.9, collar: 'high', ch: 5, buttons: '#f4c66a', zip: '#2c3348', hem: -0.3, fit: 3 } },
  wilds:    { top: { c: '#3aa84a', sl: 0.32, cuff: '#2a7a35', v: '#e9e4d2', hem: -0.1, fit: 2.6 } },
  longcoat: { top: { c: '#1a1c26', sl: 0.9, cuff: '#f4c66a', collar: 'high', ch: 4, cc: '#1a1c26', chain: '#f4c66a', trim: '#f4c66a', tails: 92, hem: 0, fit: 3.2 } },
  riftwear: { top: { c: '#2c1846', sl: 0.9, cuff: '#ff3fb4', trim: '#ff3fb4', zip: '#ff3fb4', collar: 'high', cc: '#1a0f2a', ch: 3, hem: -0.12, fit: 2.8 }, sash: ['#ff3fb4', 0.3], wrist: '#ff3fb4' },
};
const BOTTOMS = {
  tee:      { bot: { c: '#30364a', len: 1, flare: 0.6 }, belt: '#3a2a22', shoe: ['shoe', '#3a2c24'] },
  corsair:  { bot: { c: '#3460c4', len: 0.52, flare: 1.4, fur: '#f1ead8' }, shoe: ['sandal', '#9a6a3a'] },
  shinobi:  { bot: { c: '#ff8a1f', len: 1, flare: 1.6, wrap: '#ecebe6' }, shoe: ['sandal', '#2f4a8a'] },
  reaper:   { bot: { c: '#1b1c22', len: 1, flare: 7 }, shoe: ['tabi', '#c9a66b'] },
  gi:       { bot: { c: '#ff7a1a', len: 1, flare: 2.6 }, shoe: ['boot', '#2b4fb8'] },
  uniform:  { bot: { c: '#1f2433', len: 1, flare: 1.4 }, shoe: ['shoe', '#121418'] },
  wilds:    { bot: { c: '#2f8a3c', len: 0.55, flare: 1 }, belt: '#8a5a2b', shoe: ['boot', '#2f6a2c'] },
  longcoat: { bot: { c: '#262836', len: 1 }, shoe: ['shoe', '#121418'] },
  riftwear: { bot: { c: '#2c1846', len: 1, flare: 1 }, shoe: ['boot', '#ff3fb4'] },
};
// One outfit made of the worn top and bottom (an old single "outfit" id dresses both).
function outfitOf(A) {
  const tp = TOPS[A.top != null ? A.top : A.outfit], bo = BOTTOMS[A.bottom != null ? A.bottom : A.outfit];
  if (!tp && !bo) return null;
  return { top: tp && tp.top, sash: tp && tp.sash, wrist: tp && tp.wrist, glove: tp && tp.glove, bot: bo && bo.bot, belt: bo && bo.belt, shoe: bo && bo.shoe };
}

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

/* ---------------------------------------------------------------- outfits worn whole (FITS) */
// The outfits of the concept sheet, drawn from the body's own geometry every frame, so they can never
// come off it or clip through it: the torso shell follows torsoMap (u across, v up the spine), sleeves
// and trousers are tubes along the bones, a long coat's two panels hang from the waist to a point on
// each leg, shoes are built on the foot block. What is inside a garment (colour zones, openings, prints,
// seams, buttons, emblems) is placed in the garment's own coordinates, so it moves and turns with it.
// One shading rule for every piece: a flat colour, an ink outline, a cel shadow on the lower right.
// The data is in js/outfits.js (FITS); see the comment there for every field.
const FIT_MARKS = {
  // a spiral crest (shoulder or sleeve)
  spiral: (c) => `<circle r="5" fill="${c}" stroke="${LINE}" stroke-width=".9"/><path d="M0.2,0.3 C1.7,-0.2 1.5,2 -0.3,2.1 C-2.6,2.2 -2.9,-1.2 -0.7,-2.6 C1.9,-4.1 4.5,-1.6 3.7,1.3" fill="none" stroke="${shade(c, -0.5)}" stroke-width="1.1" stroke-linecap="round"/>`,
  // a cloud with a pale rim (coat print)
  cloud: (c, r) => `<path d="M-6.4,2.4 C-8.4,2.4 -8.6,-0.8 -6.2,-1.2 C-6.4,-4 -2.6,-4.8 -1.4,-2.6 C-0.4,-5.4 4,-5 4.2,-2 C6.8,-2.4 7.8,1.6 5.4,2.4 Z" fill="${c}" stroke="${r || '#f4f1ec'}" stroke-width="1.5" stroke-linejoin="round"/><path d="M-2.6,0.4 Q-1.4,-1.4 0.2,-0.2 M2.2,0.6 Q3.4,-0.8 4.4,0.6" fill="none" stroke="${shade(c, -0.35)}" stroke-width=".8" stroke-linecap="round"/>`,
  // a round fan crest: red top, white bottom, a short handle
  fan: (c) => `<path d="M0,6 V9" stroke="${LINE}" stroke-width="2.6" stroke-linecap="round"/><path d="M0,6 V8.6" stroke="#f4f1ec" stroke-width="1.2" stroke-linecap="round"/><path d="M-5,0.4 A5,5 0 0,1 5,0.4 Z" fill="${c}"/><path d="M-5,0.4 A5,5 0 0,0 5,0.4 Z" fill="#f4f1ec"/><circle r="5" fill="none" stroke="${LINE}" stroke-width=".9"/>`,
  // a smiling skull in a spiked ring (print)
  skull: (c, bg) => `<g stroke="${c}" stroke-width="1.3" stroke-linecap="round">${[0, 45, 90, 135, 180, 225, 270, 315].map((a) => { const x = Math.cos(a * D2R), y = Math.sin(a * D2R); return `<path d="M${r1(x * 5.2)},${r1(y * 5.2)} L${r1(x * 7.4)},${r1(y * 7.4)}"/>`; }).join('')}</g>`
    + `<circle r="5" fill="none" stroke="${c}" stroke-width="1.3"/><path d="M-3.2,-0.6 C-3.2,-4 3.2,-4 3.2,-0.6 C3.2,1.2 2.2,1.8 2,3 H-2 C-2.2,1.8 -3.2,1.2 -3.2,-0.6Z" fill="${c}"/>`
    + `<circle cx="-1.3" cy="-0.8" r=".9" fill="${bg}"/><circle cx="1.3" cy="-0.8" r=".9" fill="${bg}"/><path d="M-1.6,1.6 Q0,2.6 1.6,1.6" fill="none" stroke="${bg}" stroke-width=".6"/>`,
  // a five-petal flower (shirt print)
  flower: (c) => `<g fill="${c}">${[0, 72, 144, 216, 288].map((a) => `<ellipse cx="${r1(Math.cos(a * D2R) * 2.4)}" cy="${r1(Math.sin(a * D2R) * 2.4)}" rx="2.3" ry="1.6" transform="rotate(${a} ${r1(Math.cos(a * D2R) * 2.4)} ${r1(Math.sin(a * D2R) * 2.4)})"/>`).join('')}</g><circle r="1.1" fill="${shade(c, -0.35)}"/>`,
  // a worn patch (faded jeans)
  spot: (c) => `<path d="M-3,-1 C-2.6,-3 0.4,-3.2 1.6,-2 C3.4,-2.4 3.8,0.6 2.4,1.4 C2,3 -1,3 -1.6,1.6 C-3.6,1.6 -4,0 -3,-1Z" fill="${c}"/>`,
  // a pouch strapped to the thigh
  pouch: (c) => `<rect x="-3.4" y="-4.2" width="6.8" height="8.4" rx="1.6" fill="${c}" stroke="${LINE}" stroke-width=".9"/><path d="M-3.4,-1.2 H3.4" stroke="${LINE}" stroke-width=".8"/><rect x="-1" y="-1.9" width="2" height="1.4" rx=".4" fill="${shade(c, 0.35)}"/>`,
  // a breast pocket with a flap (vests)
  pocket: (c) => `<rect x="-3.6" y="-3.2" width="7.2" height="7.6" rx="1" fill="${c}" stroke="${LINE}" stroke-width=".8"/><path d="M-3.6,-0.6 H3.6" stroke="${LINE}" stroke-width=".8"/><circle cx="0" cy="-1.8" r=".7" fill="${shade(c, -0.4)}"/>`,
};
const fitMark = (m, p, rot, far) => `<g transform="translate(${pt(p)}) rotate(${r1(rot)}) scale(${r1(((m.size || 5) / 5) * 100) / 100})">${FIT_MARKS[m.n](far ? shade(m.c, -0.1) : m.c, m.c2)}</g>`;

// All the layers of a whole outfit for one frame. X: the drawing context of drawAvatar.
function fitLayers(F, X) {
  const { J, M, W, col, uid, sway } = X;
  const ex = F.fit || 2.4, uv = (u, v, e) => M(u, v, ex + (e || 0));
  // a point and the direction along a limb at t (0 root, 0.5 joint, 1 end)
  const lp = (L, t) => bez(L, t, t, 1)[0];
  const ld = (L, t) => { const a = bez(L, t - 0.02, t - 0.02, 1)[0], b = bez(L, t + 0.02, t + 0.02, 1)[0], l = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1; return [(b[0] - a[0]) / l, (b[1] - a[1]) / l]; };
  const lang = (L, t) => { const d = ld(L, t); return Math.atan2(d[1], d[0]) / D2R; };
  // one garment shape (several point lists merged): outline, flat colour, what is drawn inside it
  // (clipped to it), then the cel shadow: the shape minus itself moved up-left
  const garb = (shapes, c, far, inner, k) => {
    const id = X.cid(), kk = k || 1, dx = -2.3 * kk, dy = -1.7 * kk;
    const d = union(...shapes), d2 = union(...shapes.map((P) => P.map((p) => (p.length > 2 ? [p[0] + dx, p[1] + dy, 1] : [p[0] + dx, p[1] + dy]))));
    return `<clipPath id="${id}c"><path d="${d}"/></clipPath><mask id="${id}m"><path d="${d}" fill="#fff"/><path d="${d2}" fill="#000"/></mask>`
      + ink(d, col(c, far)) + (inner ? `<g clip-path="url(#${id}c)">${inner}</g>` : '') + `<path d="${d}" fill="#05060c" opacity="${far ? 0.3 : 0.22}" mask="url(#${id}m)"/>`;
  };
  const zone = (pts, c, far) => fillP(spline(pts, true), col(c, far));
  const seam = (pts, c, w, op) => lineP(spline(pts, false), c === 'line' ? LINE : c, w || 1.1, op);
  // a band round a limb (cuff, bandage, fur, shin wrap): a short tube a little wider than what it wraps
  const band = (L, b, far, w) => {
    const [t0, t1] = b.t, hw = (b.w || w) * W, C = bez(L, t0, t1, 3);
    let inner = '';
    if (b.wrap) for (const f of [0.22, 0.5, 0.78]) {
      const p = lp(L, t0 + (t1 - t0) * f), d = ld(L, t0 + (t1 - t0) * f), n = [-d[1], d[0]];
      inner += lineP(`M${r1(p[0] - n[0] * hw - d[0] * 0.9)},${r1(p[1] - n[1] * hw - d[1] * 0.9)} L${r1(p[0] + n[0] * hw + d[0] * 0.9)},${r1(p[1] + n[1] * hw + d[1] * 0.9)}`, shade(b.c, -0.3), 0.8);
    }
    const shapes = [tube(C, lerpW(3, hw, hw * 0.98), { flatStart: 1, flatEnd: 1 })];
    if (b.fur) for (const tt of [t0, t1]) for (let i = -2; i <= 2; i++) {
      const p = lp(L, tt), d = ld(L, tt), n = [-d[1], d[0]], q = [p[0] + n[0] * hw * i * 0.42 + d[0] * (tt === t0 ? -0.6 : 0.6), p[1] + n[1] * hw * i * 0.42 + d[1] * (tt === t0 ? -0.6 : 0.6)];
      shapes.push([...Array(8)].map((_, j) => [q[0] + Math.cos(j * Math.PI / 4) * 1.9, q[1] + Math.sin(j * Math.PI / 4) * 1.9]));
    }
    return garb(shapes, b.c, far, inner, 0.6);
  };
  const out = {};

  // ---- sleeves (an undersleeve first, if any)
  const sleeve = (Ar, far) => {
    let s = '';
    for (const S of [F.under, F.arms]) {
      if (!S) continue;
      const n = 8, C = bez(Ar, -0.08, S.len, n), w = S.w || [6.4, 5.6], hw = lerpW(n, w[0] * W, w[1] * W);
      let inner = '';
      for (const m of S.marks || []) if (!m.side || m.side === (far ? 'B' : 'F')) inner += fitMark(m, lp(Ar, m.t), lang(Ar, m.t) - 90, far);
      for (const z of S.zones || []) {   // a colour zone across the sleeve between t0 and t1
        const Cz = bez(Ar, z.t[0], z.t[1], 3);
        inner += zone(tube(Cz, lerpW(3, 9, 9), { flatStart: 1, flatEnd: 1 }), z.c, far);
      }
      s += garb([tube(C, hw, { flatEnd: 1 })], S.c, far, inner);
      if (S.len > 0.55) { const i = Math.round(n * 0.55), p = C[i], d = ld(Ar, 0.5), nn = [-d[1], d[0]]; s += lineP(`M${r1(p[0] + nn[0] * hw[i] * 0.7)},${r1(p[1] + nn[1] * hw[i] * 0.7)} Q${r1(p[0] + d[0] * 2)},${r1(p[1] + d[1] * 2)} ${r1(p[0] - nn[0] * hw[i] * 0.1 + d[0] * 3)},${r1(p[1] - nn[1] * hw[i] * 0.1 + d[1] * 3)}`, LINE, 1, 0.45); }
      for (const b of S.bands || []) s += band(Ar, b, far, (S.w || [6.4, 5.6])[1] + 0.4);
    }
    for (const b of F.armBands || []) s += band(Ar, b, far, 5.1);
    return s;
  };
  out.armB = sleeve(J.aB, true);
  out.armF = sleeve(J.aF, false);

  // ---- trousers: the hips and both legs as one shape, then bands, boots
  const Lg = F.legs;
  if (Lg) {
    const n = 8, pc = [bez(J.lB, -0.06, Lg.len, n), bez(J.lF, -0.06, Lg.len, n)], w = Lg.w || [9.4, 8.6];
    const pw = [...Array(n + 1)].map((_, i) => W * (w[0] + (w[1] - w[0]) * (i / n)));
    let inner = '';
    for (const m of Lg.marks || []) for (const [sd, L] of [['B', J.lB], ['F', J.lF]]) {
      if (m.side && m.side !== sd) continue;
      const p = lp(L, m.t), d = ld(L, m.t), nn = [-d[1], d[0]], hw = w[0] + (w[1] - w[0]) * Math.min(1, m.t / Lg.len);
      inner += fitMark(m, [p[0] + nn[0] * (m.s || 0) * hw, p[1] + nn[1] * (m.s || 0) * hw], lang(L, m.t) - 90, sd === 'B');
    }
    out.legs = garb([torsoOutline(M, -0.32, 0.22, 1.6), tube(pc[0], pw, { flatEnd: 1 }), tube(pc[1], pw, { flatEnd: 1 })], Lg.c, false, inner)
      + X.legEdge(pc[1], pw);
    if (Lg.len > 0.7) for (const C of pc) { const i = Math.round(n * 0.52); out.legs += lineP(spline([C[i - 1], C[i], C[i + 1]].map((p, j) => [p[0] + (j - 1) * 0.6, p[1]]), false), LINE, 0.9, 0.35); }
  } else out.legs = '';
  for (const [L, far] of [[J.lB, true], [J.lF, false]]) {
    for (const b of (Lg && Lg.bands) || []) if (!b.side || b.side === (far ? 'B' : 'F')) out.legs += band(L, b, far, (b.t[0] < (Lg ? Lg.len : 0) ? ((Lg.w || [9.4, 8.6])[1] + 0.5) : 7.4));
    for (const b of F.shinBands || []) out.legs += band(L, b, far, 7.4);
    const ft = F.feet || {};
    if (ft.k === 'boot' || ft.cuff) {   // the boot's shaft (or a sandal's ankle cuff) up the shin
      const t0 = ft.k === 'boot' ? ft.h || 0.72 : 0.88, C = bez(L, t0, 1, 4), c = ft.c;
      out.legs += garb([tube(C, [7.6, 7.4, 7.2, 7, 6.8].map((x) => x * W), { flatStart: 1 })], c, far, '', 0.8)
        + (ft.k === 'boot' ? band(L, { t: [t0 - 0.02, t0 + 0.05], c: ft.c2 || shade(c, 0.2) }, far, 8) : '');
    }
  }

  // ---- a long coat's panels (behind them, for an open coat, its lining)
  const Sk = F.skirt;
  out.lining = ''; out.skirt = '';
  if (Sk) {
    const top = Sk.top != null ? Sk.top : 0.14, th = Sk.hem || 0.6, legHw = 8.4 + (Sk.flare != null ? Sk.flare : 3);
    // the hem is pulled by its leg but hangs: halfway between the point on the leg and straight below the hip
    const at = (L) => {
      const q = lp(L, th), d = ld(L, th), r = Math.hypot(q[0] - L[0][0], q[1] - L[0][1]), hang = [L[0][0], L[0][1] + r];
      const p = [q[0] + (hang[0] - q[0]) * 0.45, q[1] + (hang[1] - q[1]) * 0.45];
      const dd = [p[0] - L[0][0], p[1] - L[0][1]], dl = Math.hypot(dd[0], dd[1]) || 1;
      return { p, n: [-dd[1] / dl, dd[0] / dl] };
    };
    const hb = at(J.lB), hf = at(J.lF);
    const outward = (me, other) => { const dx = me.p[0] - other.p[0], dy = me.p[1] - other.p[1]; return me.n[0] * dx + me.n[1] * dy >= 0 ? me.n : [-me.n[0], -me.n[1]]; };
    const nb = outward(hb, hf), nf = outward(hf, hb);
    const swB = [sway * 2.2, 0], swF = [sway * 1.2, 0];
    const oB = [hb.p[0] + nb[0] * legHw + swB[0], hb.p[1] + nb[1] * legHw], oF = [hf.p[0] + nf[0] * legHw + swF[0], hf.p[1] + nf[1] * legHw];
    let iB, iF;
    if (Sk.gap == null) { const m = [(hb.p[0] + hf.p[0]) / 2, (hb.p[1] + hf.p[1]) / 2]; iB = [m[0] + 3 + sway, m[1] + 1]; iF = [m[0] - 3 + sway, m[1] + 1]; }
    else { iB = [hb.p[0] - nb[0] * legHw * 0.35 + swB[0], hb.p[1] - nb[1] * legHw * 0.35]; iF = [hf.p[0] - nf[0] * legHw * 0.35 + swF[0], hf.p[1] - nf[1] * legHw * 0.35]; }
    const g = Sk.gap || 0;
    const quad = { B: [uv(-1.06, top, 1), uv(Sk.gap == null ? 0.12 : -g, top, 1), iB, oB], F: [uv(1.06, top, 1), uv(Sk.gap == null ? -0.12 : g, top, 1), iF, oF] };
    if (Sk.lining) out.lining = garb([[uv(-0.95, top, 1), uv(0.95, top, 1), [oF[0] - nf[0] * 3, oF[1] - 2, 1], [oB[0] - nb[0] * 3, oB[1] - 2, 1]]], Sk.lining, true, '', 0.7);
    for (const sd of ['B', 'F']) {
      const [wo, wi, hi, ho] = quad[sd], far = sd === 'B';
      const hip = M(sd === 'B' ? -1.12 : 1.12, -0.28, ex + 1);
      const shape = [wo, hip, [ho[0], ho[1], 1], [hi[0], hi[1], 1], wi];
      const bil = (a, b) => [wo[0] + (wi[0] - wo[0]) * a + ((ho[0] + (hi[0] - ho[0]) * a) - (wo[0] + (wi[0] - wo[0]) * a)) * b, wo[1] + (wi[1] - wo[1]) * a + ((ho[1] + (hi[1] - ho[1]) * a) - (wo[1] + (wi[1] - wo[1]) * a)) * b];
      let inner = '';
      if (Sk.flames) {   // flames licking up from the hem
        const up = [(wo[0] + wi[0]) / 2 - (ho[0] + hi[0]) / 2, (wo[1] + wi[1]) / 2 - (ho[1] + hi[1]) / 2], ul = Math.hypot(up[0], up[1]) || 1, U = [up[0] / ul, up[1] / ul];
        const N = 7, h = Sk.flames.h || 18, P = [[ho[0] - U[0] * 6, ho[1] - U[1] * 6, 1], [hi[0] - U[0] * 6, hi[1] - U[1] * 6, 1]];
        for (let i = 0; i <= N; i++) {
          const f = 1 - i / N, q = [hi[0] + (ho[0] - hi[0]) * (1 - f), hi[1] + (ho[1] - hi[1]) * (1 - f)], tip = i % 2 === 1;
          const hh = tip ? h * (0.75 + 0.25 * Math.sin(i * 2.3)) : h * 0.28;
          P.push(tip ? [q[0] + U[0] * hh, q[1] + U[1] * hh, 1] : [q[0] + U[0] * hh, q[1] + U[1] * hh]);
        }
        inner += fillP(spline(P, true), col(Sk.flames.c, far));
      }
      for (const m of Sk.marks || []) if (!m.side || m.side === sd) inner += fitMark(m, bil(m.a, m.b), m.rot || 0, far);
      if (Sk.trim) inner += lineP(spline([wi, [hi[0], hi[1], 1], [ho[0], ho[1], 1], hip], false), col(Sk.trim, far), 3.2);
      if (Sk.seam && sd === 'F') inner += lineP(spline([wi, hi], false), col(Sk.seam, far), 2.6);
      out.skirt += garb([shape], Sk.c, far, inner, 0.9);
    }
  }

  // ---- the torso shell and everything on it
  const T = F.top;
  const tin = (T.zones || []).map((z) => zone(z.pts.map(([u, v, k]) => (k ? [...uv(u, v), 1] : uv(u, v))), z.c)).join('')
    + (T.lines || []).map((l) => seam(l.pts.map(([u, v]) => uv(u, v)), l.c, l.w, l.op)).join('')
    + (T.marks || []).map((m) => fitMark(m, uv(m.u, m.v), 180 - J.chestA + (m.rot || 0))).join('');
  out.torso = garb([torsoOutline(M, T.hem != null ? T.hem : -0.08, 1, ex, 1)], T.c, false, tin);
  for (const d of T.dots || []) for (const [u, v] of d.pts) { const p = uv(u, v); out.torso += `<circle cx="${r1(p[0])}" cy="${r1(p[1])}" r="${d.r || 1.5}" fill="${d.c}" stroke="${LINE}" stroke-width=".8"/>`; }
  if (T.beads) {   // a necklace of beads hanging on the chest
    const B = T.beads, C = curveThrough(uv(B.from[0], B.from[1]), uv(B.mid[0], B.mid[1]), uv(B.to[0], B.to[1]), B.n - 1);
    for (const p of C) out.torso += `<circle cx="${r1(p[0])}" cy="${r1(p[1])}" r="${B.r || 1.8}" fill="${B.c}" stroke="${LINE}" stroke-width=".7"/><circle cx="${r1(p[0] - 0.5)}" cy="${r1(p[1] - 0.6)}" r=".5" fill="#fff" opacity=".6"/>`;
  }
  // a hood bunched behind the neck (drawn under the head)
  out.hood = F.hood ? frame(J, J.neckBase, garb([[[-12, 3], [-12.5, -4], [-7, -9.5], [0, -10.5], [7, -9.5], [12.5, -4], [12, 3], [0, 6]]], F.hood, false, '', 0.7)) : '';
  // epaulettes: a pad and a gold fringe on each shoulder
  out.over = '';
  if (F.epaulettes) for (const [sh, far] of [[J.shB, true], [J.shF, false]]) {
    const c = col(F.epaulettes, far), a = 180 - J.chestA;
    out.over += `<g transform="translate(${pt(sh)}) rotate(${r1(a)})">${[-4.5, -2.2, 0, 2.2, 4.5].map((x) => `<path d="M${x},1 V${r1(7.5 - Math.abs(x) * 0.4)}" stroke="${LINE}" stroke-width="2.6" stroke-linecap="round"/><path d="M${x},1 V${r1(7.5 - Math.abs(x) * 0.4)}" stroke="${c}" stroke-width="1.3" stroke-linecap="round"/>`).join('')}`
      + `<ellipse cx="0" cy="-0.5" rx="6.8" ry="3.4" fill="${c}" stroke="${LINE}" stroke-width="1.2"/><ellipse cx="-1.2" cy="-1.3" rx="3.4" ry="1.2" fill="#fff" opacity=".35"/></g>`;
  }

  // ---- at the waist: belts, sashes, a rope tied in a big knot
  out.waist = '';
  for (const b of F.belts || []) {
    const [a0, a1] = b.v, [c0, c1] = b.vR || b.v, [ua, ub] = b.u || [-1.08, 1.08];
    out.waist += garb([[uv(ua, a0, 0.6), uv(ub, c0, 0.6), uv(ub, c1, 0.6), uv(ua, a1, 0.6)].map((p) => [p[0], p[1], 1])], b.c, false, b.lines ? [0.3, 0.6].map((f) => seam([uv(-1.1, a0 + (a1 - a0) * f, 0.6), uv(1.1, c0 + (c1 - c0) * f, 0.6)], shade(b.c, -0.3), 0.8)).join('') : '', 0.4);
    if (b.buckle) out.waist += frame(J, uv(b.bu != null ? b.bu : 0.06, (a0 + a1) / 2), `<rect x="-3.2" y="-2.6" width="6.4" height="5.2" rx="1" fill="${b.buckle}" stroke="${LINE}" stroke-width="1"/><rect x="-1.4" y="-1.2" width="2.8" height="2.4" rx=".4" fill="${b.c}"/>`);
  }
  const Sa = F.sash;
  if (Sa) {
    const [v0, v1] = Sa.v, k = uv(Sa.u, (v0 + v1) / 2, 0.8);
    let s = garb([[uv(-1.1, v1, 0.8), uv(1.1, v1, 0.8), uv(1.1, v0, 0.8), uv(-1.1, v0, 0.8)].map((p) => [p[0], p[1], 1])], Sa.c, false, Sa.rope ? [-0.9, -0.6, -0.3, 0, 0.3, 0.6, 0.9].map((u) => seam([uv(u, v1, 0.8), uv(u + 0.12, v0, 0.8)], shade(Sa.c, -0.35), 0.9)).join('') : '', 0.5);
    const tail = (dx, ln, w) => tube([k, [k[0] + dx * 0.5 + sway, k[1] + ln * 0.5], [k[0] + dx + sway * 2, k[1] + ln]], [w, w * 0.95, w * 0.85], { flatEnd: !Sa.rope });
    for (const [dx, ln, w, dk] of Sa.tails || [[-3, 22, 3.4, 0], [3, 16, 3, -0.12]]) s += garb([tail(dx, ln, w)], dk ? shade(Sa.c, dk) : Sa.c, false, '', 0.6);
    s += garb([[...Array(10)].map((_, i) => [k[0] + Math.cos(i * Math.PI / 5) * (Sa.knot || 3.8), k[1] + Math.sin(i * Math.PI / 5) * (Sa.knot || 3.8) * 0.85])], Sa.c, false, '', 0.6);
    out.waist += s;
  }
  // ---- a high collar standing round the neck (drawn over the chin, like a jacket's)
  out.collar = '';
  if (F.collar) {
    const Co = F.collar, h = Co.h || 6, hw = 7.5 * W + ex, c = Co.c;
    out.collar = frame(J, J.neckBase, garb([[[-hw, 5, 1], [-hw + 0.8, -h, 1], [0, -h - 2.5], [hw - 0.8, -h, 1], [hw, 5, 1], [0, 8]]], c, false,
      (Co.lining ? `<path d="M${r1(-hw + 1.4)},${-h + 0.6} Q0,${-h - 3.6} ${r1(hw - 1.4)},${-h + 0.6} Q0,${-h + 2.4} ${r1(-hw + 1.4)},${-h + 0.6}Z" fill="${Co.lining}"/>` : '')
      + (Co.zip ? `<path d="M${r1(J.tw * 0.45 * hw)},${-h - 1.5} V5" stroke="${Co.zip}" stroke-width="1.4"/>` : '')
      + (Co.ribs ? [-0.6, -0.2, 0.2, 0.6].map((f) => `<path d="M${r1(f * hw)},${-h} V5" stroke="${shade(c, -0.35)}" stroke-width=".8"/>`).join('') : ''), 0.8));
  }
  return out;
}
// A shoe of a whole outfit, in the foot's frame (ankle at 0,0, sole on y = 5, toe towards +x).
function fitShoe(ft, far, X) {
  const { cel, col, shd, St } = X, sk = far ? St.far : St.body, c = ft.c;
  const foot = cel(FOOT_BLOCK, sk, shd('skin', far), 0.6);
  switch (ft.k) {
    case 'straw':    // a straw sandal: a thick sole, a thong between the toes
      return cel('M-10.4,2.8 H14.8 Q16.2,2.8 16.2,4.6 V6 Q16.2,7.4 14.8,7.4 H-10.4 Q-11.8,7.4 -11.8,6 V4.6 Q-11.8,2.8 -10.4,2.8Z', col(c, far), shd(c, far), 0.4)
        + foot + inkLine('M3.2,-6.4 Q4.6,-2 4.2,3.2 M3.2,-6.4 Q-1,-3.4 -3.6,3', col(ft.c2 || '#2a2522', far), 1.8);
    case 'ninja': {  // an open-toed sandal: the heel and the instep covered, the toes out
      const body = 'M-9.6,4.4 C-10.4,-1 -9.6,-6 -6.4,-7.4 C-2,-8.6 3.4,-7 6.6,-4.6 L8,4.4 Z';
      return cel('M-10.6,3.6 H14.8 Q16,3.6 16,5 V5.6 Q16,7 14.6,7 H-10.6 Q-11.8,7 -11.8,5.6 V5 Q-11.8,3.6 -10.6,3.6Z', col(ft.c2 || shade(c, -0.25), far), shd(ft.c2 || c, far), 0.4)
        + foot + cel(body, col(c, far), shd(c, far), 0.6) + inkLine('M6.6,-4.6 L8,4.4', col(shade(c, -0.3), far), 0.8);
    }
    case 'sneaker':
      return cel(FOOT_BLOCK, col(c, far), shd(c, far), 0.6) + fillP('M-9.4,1.6 L14.4,1.6 C14.6,2.2 14.6,2.6 14.6,2.8 C14.6,4.6 13.4,5.4 12,5.4 L-7,5.4 C-8.8,5.4 -9.6,4 -9.4,1.6Z', col(ft.c2 || '#ecebe8', far))
        + lineP('M-9.4,1.6 L14.4,1.6', LINE, 0.9) + lineP('M6,-3.6 Q9,-1.6 10.6,1.4', LINE, 0.8, 0.6);
    default:         // boot, shoe: the foot block in leather, a darker heel and sole
      return cel(FOOT_BLOCK, col(c, far), shd(c, far), 0.6) + fillP(FOOT_SOLE, shade(col(c, far), -0.4), 0.9);
  }
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
  const B = BODY, skin = A.ink || cosOf('color', A.color).ink;
  const St = STYLES[A.style] ? STYLES[A.style](skin) : STYLES.flat(skin);
  LINE = St.line;
  const J = solve(P, B), W = B.w, M = torsoMap(J, W), out = [];
  // the player wears one outfit whole; foes and the Studio may still give a top and a bottom
  if (A.outfit != null && A.top == null && A.bottom == null) A = Object.assign({}, A, { top: A.outfit, bottom: A.outfit });
  const O = outfitOf(A), T = O && O.top, Bt = O && O.bot;
  const FT = typeof FITS !== 'undefined' && A.top != null && A.top === A.bottom ? FITS[A.top] || null : null;
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
  // garment pieces drawn in the Studio, mapped onto a body part (where) and following it as it moves
  const XW = [AV_EXT.wear['bottom:' + A.bottom], AV_EXT.wear['top:' + A.top]].filter(Boolean);
  const xw = (where, o) => (XW.length ? XW.map((f) => f(where, Object.assign({ J, P, B, W, t, M, cel, col, shd, ex: (T && T.fit) || 2, clipId: () => uid + nClip++ }, o))).join('') : '');
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
  if (P.fx) out.push(fxSVG(P.fx, J, worn ? RCOL[Math.min(6, typeof rarity === 'function' ? rarity(worn) : 1)] : skin, P, B.w));
  const hs = J.headR / 19, ha = (P.h || 0) + (180 - J.neckA) * 0.6;
  const onHead = (inner) => `<g transform="translate(${pt(J.head)}) rotate(${r1(ha)}) scale(${r1(hs * 1000) / 1000})">${inner}</g>`;
  // hair: long locks hang behind the body, the rest sits on the head (shifted as the head turns)
  // hair v2 (js/hair2.js): layered clumps, drawn by its own renderer
  const h2def = HAIR[A.hair] && HAIR[A.hair].v2;
  const h2 = h2def && typeof hair2SVG === 'function' ? hair2SVG(h2def, { t, ha, uid: uid + 'h2', covered: !!HAT_COVER[A.hat], face: [(-2.2 * (P.tw || 0)) / (1 + 0.07 * (P.tw || 0)), 19 / (1 + 0.07 * (P.tw || 0))] }) : null;
  const hair = h2 ? null : hairShape(A.hair, !!HAT_COVER[A.hat], ha, t), tw = P.tw || 0;
  const hairT = (s) => `<g transform="translate(${r1(2.2 * tw)},0) scale(${r1((1 + 0.07 * tw) * 100) / 100},1)">${s}</g>`;
  // a manga haircut picture (js/hair-cuts.js): morphed for this head and its turn by HAIR_FIT
  const cutId = typeof HAIR_CUTS !== 'undefined' && /^cut_/.test(A.hair || '') ? A.hair.slice(4) : null;
  const cut = cutId && HAIR_CUTS[cutId] ? HAIR_FIT.get(cutId, HAIR_FIT.avKey(tw)) : null;
  const cutS = cut ? `<image href="${cut.href}" x="${r1(cut.x)}" y="${r1(cut.y)}" width="${r1(cut.w)}" height="${r1(cut.h)}" preserveAspectRatio="none"/>` : '';
  const fig = [G.back];
  if (hair && hair.back) fig.push(onHead(hairT(cel(hair.back, shade(hair.h.c, -0.08), hair.h.sh, 0.9))));
  if (h2 && h2.back) fig.push(onHead(hairT(h2.back)));

  // ---- limbs
  const crease = (C, i, hw) => {
    const [nx, ny, tx, ty] = nrm(C, i), s = nx + 0.5 * ny >= 0 ? 1 : -1, p = C[i];
    const a = [p[0] + nx * s * hw * 0.8, p[1] + ny * s * hw * 0.8], b = [p[0] + nx * s * hw * 0.1 + tx * 3, p[1] + ny * s * hw * 0.1 + ty * 3];
    return lineP(`M${pt(a)}Q${r1((a[0] + b[0]) / 2 + tx * 2)},${r1((a[1] + b[1]) / 2 + ty * 2)} ${pt(b)}`, LINE, 1, 0.5);
  };
  // an arm: skin, sleeve, cuff, wrist band, and an oval mitten hand
  const arm = (Ar, fa, far) => {
    const n = 8, C = bez(Ar, 0, 1, n), sk = far ? St.far : St.body;
    let s = cel(spline(tube(C, lerpW(n, 4.5 * W, 4.1 * W)), true), sk, shd('skin', far), 0.8);
    if (T && T.sl) {
      const Cs = bez(Ar, -0.08, T.sl, n), w1 = (T.wide ? 6.4 + T.wide : 6.4) * W, hw = lerpW(n, 7.2 * W, w1), c = T.slc || T.c;
      s += piece(tube(Cs, hw, { flatEnd: 1 }), c, far);
      if (T.sl > 0.55) s += crease(Cs, Math.round(n * 0.55), hw[4]);
      if (T.cuff) s += piece(tube(bez(Ar, T.sl - 0.08, T.sl, 2), [w1 + 0.2, w1 + 0.35, w1 + 0.5], { flatStart: 1, flatEnd: 1 }), T.cuff, far, 0.6);
    }
    if (FL) s += far ? FL.armB : FL.armF;
    s += xw(far ? 'armB' : 'armF', { L: Ar, far });
    if (O && O.wrist) s += piece(tube(bez(Ar, 0.78, 0.93, 2), [5.4 * W, 5.3 * W, 5.2 * W], { flatStart: 1, flatEnd: 1 }), O.wrist, far, 0.6);
    const hp = add(Ar[2], fa, 4.2 * W), r = rotTo(fa);
    const hand = `<g transform="translate(${pt(hp)}) rotate(${r})">${cel(HAND, O && O.glove ? col(O.glove, far) : sk, O && O.glove ? shd(O.glove, far) : shd('skin', far), 0.8)}</g>`;
    return { s, hand, hp };
  };
  // the foot: an inclined block (high at the heel, sloping to a round toe, flat sole), pointing the
  // way the foot points, never upside down
  const shoe = (L, far) => {
    let a = Math.atan2(L[3][0] - L[2][0], L[3][1] - L[2][1]) / D2R;
    // a foot standing on the floor lies flat on it (the block is long: a small tilt would lift the toe)
    const flatA = Math.sin(a * D2R) < 0 ? -90 : 90, dA = ((a - flatA + 540) % 360) - 180;
    const onFloor = Math.max(0, Math.min(1, (L[2][1] + 5 - (GROUND - 7)) / 5));
    if (Math.abs(dA) < 35) a -= dA * onFloor;
    const flip = Math.sin(a * D2R) < 0, sk = far ? St.far : St.body;
    const [k, c] = FT && FT.feet ? ['fit'] : (O && O.shoe) || ['bare'];
    const foot = FOOT_BLOCK;
    const boot = 'M-7.4,-6.2 C-1,-7.2 6,-6.4 9.8,-2.6 C11.8,-0.8 11.8,3.8 11,5.2 L-8,5.2 C-9,2.4 -9,-3.4 -7.4,-6.2Z';
    let g;
    if (k === 'fit') g = fitShoe(FT.feet, far, { cel, col, shd, St });
    else if (k === 'sandal') g = piece([[-8.6, 3.2, 1], [11.6, 3.2, 1], [11.6, 6.4, 1], [-8.6, 6.4, 1]], c, far, 0.4) + cel(foot, sk, shd('skin', far), 0.6) + inkLine('M1.6,-5 Q3.4,-0.6 2.4,3.6', col(c, far), 1.8);
    else if (k === 'tabi') g = piece([[-8.6, 3.4, 1], [11.6, 3.4, 1], [11.6, 6.4, 1], [-8.6, 6.4, 1]], c, far, 0.4) + cel(foot, far ? '#d6d2c6' : '#f2f0ea', '#c4c0b4', 0.6) + inkLine('M4.5,-4.6 L2.6,3.6', '#2a2a30', 1.3);
    else if (k === 'shoe' || k === 'boot') g = cel(boot, col(c, far), shd(c, far), 0.7) + fillP('M-8.2,3 H11.4 V5.2 H-8.2Z', shade(c, -0.42));
    else g = cel(foot, sk, shd('skin', far), 0.6) + fillP(FOOT_SOLE, shd('skin', far), 0.75);
    const tr = flip ? `translate(${pt(L[2])}) scale(-1,1) rotate(${rotTo(-a)})` : `translate(${pt(L[2])}) rotate(${rotTo(a)})`;
    return `<g transform="${tr} scale(${r1(W * (far ? 0.92 : 1) * 100) / 100})">${g}</g>`;
  };
  const legC = (L) => bez(L, -0.04, 1, 8);
  const legW = (n) => lerpW(n, 7 * W, 6.5 * W);
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
    // trousers worn without a belt or sash still get their own waistband
    if (!O.sash) return Bt ? piece([M(-1.03, 0.1, ex + 0.3, 1), M(1.03, 0.1, ex + 0.3, 1), M(1.03, 0.03, ex + 0.3, 1), M(-1.03, 0.03, ex + 0.3, 1)], shade(Bt.c, -0.2), false, 0.4) : '';
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

  // ---- an outfit worn whole: all its layers for this frame
  const FL = FT ? fitLayers(FT, { J, M, W, col, sway, legEdge, cid: () => uid + nClip++ }) : null;

  // ---- which arms hang at the sides (behind the torso) and which cross in front of it
  const crossing = (Ar, fa, front) => { const h = add(Ar[2], fa, 4); return h[1] > J.neck[1] && (front ? h[0] < J.shF[0] - 1 : h[0] > J.shB[0] + 1); };
  const backX = P.bf || crossing(J.aB, J.foreA.aB, false), frontX = P.ff || crossing(J.aF, J.foreA.aF, true);
  const back = arm(J.aB, J.foreA.aB, true), front = arm(J.aF, J.foreA.aF, false);
  if (!backX) fig.push(back.s);
  if (!frontX) fig.push(front.s);
  // below the waist the body is one shape: the hips and both whole legs merged, so the torso
  // flows into the legs with no seam; the same for the trousers over it
  if (FL) fig.push(FL.lining);
  const skinC = [bez(J.lB, -0.04, 0.95, 8), bez(J.lF, -0.04, 0.95, 8)], skinW = legW(8);
  const neckC = [add(J.neckBase, J.neckA, -6), J.neck, add(J.neck, J.neckA, 9)], neckW = [3.9 * W, 3.7 * W, 3.7 * W];
  fig.push(cel(union(tube(neckC, neckW), torsoOutline(M, -0.3, 1, 0), tube(skinC[0], skinW), tube(skinC[1], skinW)), St.body, St.sh) + legEdge(skinC[1], skinW)
    + fillP(spline(tube([add(J.neckBase, J.neckA, 1), add(J.neck, J.neckA, 9)], [neckW[1], neckW[2]], { flatStart: 1 }), true), St.sh, 0.7));
  fig.push(shoe(J.lB, true), shoe(J.lF, false));
  if (FL) fig.push(FL.legs, FL.skirt);
  if (Bt) {
    const pc = [bez(J.lB, -0.06, Bt.len, 8), bez(J.lF, -0.06, Bt.len, 8)], pw = pantW(8);
    fig.push(cel(union(torsoOutline(M, -0.32, 0.22, 1.6), tube(pc[0], pw, { flatEnd: 1 }), tube(pc[1], pw, { flatEnd: 1 })), Bt.c, shd(Bt.c)) + legEdge(pc[1], pw));
  }
  fig.push(legDetails(J.lB, true) + xw('legB', { L: J.lB, far: true }), legDetails(J.lF, false) + xw('legF', { L: J.lF, far: false }));
  fig.push(tails());
  // the torso: bare (a plain rounded box) or dressed
  if (T) fig.push(top());
  if (FL) fig.push(FL.torso, FL.hood, FL.collar);
  fig.push(xw('torso'));
  if (O) fig.push(sash());
  if (FL) fig.push(FL.waist, FL.over);
  fig.push(xw('torsoTop'));
  // hands hanging at the sides come over the clothes
  if (!backX) fig.push(back.hand);
  if (!frontX && !(worn && !sheathed && !P.prop) && !P.prop) fig.push(front.hand);
  fig.push(G.under);
  // the head: a flat round disc, the face, the hair, the hat
  // the hair casts a soft shadow on the forehead, under the fringe
  const hcId = uid + 'hc';
  const hairS = hair ? (hair.stub ? fillP(hair.stub, hair.h.sh, 0.22) : '')
    + `<clipPath id="${hcId}"><circle r="19"/></clipPath><g clip-path="url(#${hcId})"><path d="${hair.front}" fill="${St.sh}" opacity=".45" transform="translate(1.2,2.6)"/></g>`
    + cel(hair.front, hair.h.c, hair.h.sh, 0.9) + (hair.lines ? lineP(hair.lines, LINE, 1, 0.5) : '') + (hair.hi ? lineP(hair.hi, hair.h.hi, 2.2, 0.85) : '') + hair.extra : '';
  const faceG = `<g transform="translate(${r1(-3.7 * (1 - tw))},1)">${faceSVG(A.face, P.expr, St.eye)}</g>`;
  // v2: the nape behind the head, the fringe's shadow on the forehead, then the hair over the face
  if (h2) fig.push(onHead(hairT(h2.nape) + ink(circ([0, 0], 19), St.body, 2.4)
    + `<clipPath id="${uid}fs"><circle r="19"/></clipPath><g clip-path="url(#${uid}fs)">${hairT(`<path d="${h2.shadow}" fill="${St.sh}" opacity=".85" transform="translate(.6,2.8)"/>`)}</g>`
    + faceG + hairT(h2.main) + (HATS[A.hat] || '')));
  else fig.push(onHead(ink(circ([0, 0], 19), St.body, 2.4) + faceG + hairT(hairS + cutS) + (HATS[A.hat] || '')));
  fig.push(collar());
  if (backX) fig.push(back.s + back.hand);
  if (P.panB) fig.push(panSVG(back.hp, P.A, t, P, '#ffb36b'), back.hand);
  if (frontX) fig.push(front.s);
  // the weapon or tool gripped in the front fist, drawn over everything else
  const fa = J.foreA.aF, prop = P.prop, weapon = !prop && worn && !sheathed ? worn : null, grip = front.hp;
  if (weapon) fig.push(`<g transform="translate(${pt(grip)}) rotate(${rotTo(fa + P.g)})">${weaponSVG(weapon)}</g>`);
  if (prop === 'rod') fig.push(rodSVG(grip, fa + P.g, t, P));
  if (prop === 'pan') fig.push(panSVG(grip, fa + P.g, t, P, '#ffb36b'));
  if (P.tool === 'spatula') fig.push(spatulaSVG(front.hp, P.sa || 40));
  if (prop === 'rod' && backX) fig.push(back.hand);
  if (prop === 'axe') fig.push(axeSVG(grip, fa + P.g, t, P));
  if (prop === 'axe' && backX) fig.push(back.hand);   // the sliding hand wraps the haft
  if (PROP_DRAW[prop]) { fig.push(PROP_DRAW[prop](grip, fa + P.g, t, P)); if (backX) fig.push(back.hand); }
  if (frontX || weapon || prop || P.tool) fig.push(front.hand);
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
    default: if (AV_EXT.back[A.back]) AV_EXT.back[A.back]({ back, under, over, fx }, { J, P, t, B, M, mantle, hood, strap });
  }
  // a weapon that is put away hangs at the waist or across the back
  if (o.sheathed) {
    const c = CARRY[weaponKind(o.sheathed)] || CARRY.cutlass, at = M(c[0], c[1], 2);
    (c[4] === 'back' ? back : under).push(`<g transform="translate(${pt(at)}) rotate(${rotTo(c[2] + P.t1 - 180)}) scale(${c[3]})">${sheathSVG(o.sheathed)}</g>`);
  }
  return { back: back.join(''), under: under.join(''), over: over.join(''), fx: fx.join('') };
}
// Motion effects: slash trail, thrust speed lines, kick impact, hit recoil.
// Combat effects of the weapon-family attacks (drawn behind the figure).
// A swept crescent (a weapon trail) around c, from angle a0 to a1: thick in the middle, thin at both ends.
function trailArc(c, r, a0, a1, k, col, op) {
  const sw = a1 < a0 ? 1 : 0, lg = Math.abs(a1 - a0) > 180 ? 1 : 0;
  const p0 = add(c, a0, r), p1 = add(c, a1, r * 0.98), p2 = add(c, a0, r * 0.94), R = r1(r), Rk = r1(r * k);
  return `<path d="M${pt(p0)} A${R},${R} 0 ${lg},${sw} ${pt(p1)} A${Rk},${Rk} 0 ${lg},${1 - sw} ${pt(p2)}Z" fill="${col}" opacity="${op}"/>`;
}
const speedLines = (x, y0, n, gap, len, col) => [...Array(n)].map((_, i) => `<path d="M${r1(x - len - (i % 2) * 12)},${r1(y0 + i * gap)} h${len}" stroke="${i % 2 ? col : '#fff'}" stroke-width="${2.4 - (i % 2) * 0.8}" stroke-linecap="round" opacity=".65"/>`).join('');
const handAt = (J, k, W) => add(J[k][2], J.foreA[k], 4.2 * W);
const tipAt = (J, P, W, len) => add(handAt(J, 'aF', W), J.foreA.aF + (P.g || 0), len);
const FX2 = {
  slashTail: (J, col) => trailArc(J.shoulder, 60, 150, 26, 1.5, col, 0.35) + trailArc(J.shoulder, 57, 140, 34, 1.7, '#fff', 0.35),
  rise: (J, col) => trailArc(J.shoulder, 64, -6, 164, 1.35, col, 0.45) + trailArc(J.shoulder, 61, 4, 160, 1.5, '#fff', 0.55),
  qslash: (J, col) => trailArc(J.shoulder, 56, 150, 58, 1.9, col, 0.5) + trailArc(J.shoulder, 54, 144, 64, 2.2, '#fff', 0.6),
  qslash2: (J, col) => trailArc(J.shoulder, 50, 50, 150, 1.9, col, 0.5) + trailArc(J.shoulder, 48, 58, 146, 2.2, '#fff', 0.6),
  smash: (J, col, P, W) => {
    const t = tipAt(J, P, W, 40), x = t[0], g = GROUND;
    let s = trailArc(J.shoulder, 70, 200, 96, 1.4, col, 0.4) + trailArc(J.shoulder, 67, 192, 100, 1.55, '#fff', 0.45);
    s += `<ellipse cx="${r1(x)}" cy="${g}" rx="34" ry="7" fill="none" stroke="#fff" stroke-width="3" opacity=".7"/><ellipse cx="${r1(x)}" cy="${g}" rx="22" ry="4" fill="${col}" opacity=".5"/>`;
    for (let i = 0; i < 5; i++) { const a = -60 + i * 30, d = add([x, g - 2], 180 + a, 18 + (i % 2) * 8); s += `<path d="M${pt(d)} l${r1(-2 + (i % 3))},-5 l5,1 l-1,5z" fill="#cfc4b4" stroke="${OL}" stroke-width="1.2"/>`; }
    return s + burst([x, g - 6], 16, col);
  },
  loose: (J, col, P, W) => { const h = handAt(J, 'aF', W); return `<path d="M${r1(h[0] - 30)},${r1(h[1] - 4)} q-8,4 -2,10 M${r1(h[0] - 26)},${r1(h[1] + 6)} q-8,4 -2,10" stroke="#fff" stroke-width="2" fill="none" opacity=".7" stroke-linecap="round"/>` + speedLines(h[0] + 60, h[1] - 3, 2, 6, 34, col); },
  muzzle: (J, col, P, W) => { const t = tipAt(J, P, W, 34); return `<circle cx="${r1(t[0] - 6)}" cy="${r1(t[1] - 10)}" r="7" fill="#d8d4cc" opacity=".55"/><circle cx="${r1(t[0] - 16)}" cy="${r1(t[1] - 4)}" r="5" fill="#d8d4cc" opacity=".45"/>` + burst(add(t, J.foreA.aF + (P.g || 0), 8), 15, '#ffb23a'); },
  jab: (J, col, P, W) => { const h = handAt(J, 'aF', W); return speedLines(h[0] - 10, h[1] - 6, 3, 6, 26, col) + burst(add(h, 90, 12), 11, col); },
  cross: (J, col, P, W) => { const h = handAt(J, 'aB', W); return speedLines(h[0] - 12, h[1] - 6, 3, 6, 32, col) + burst(add(h, 90, 12), 14, col); },
  upper: (J, col, P, W) => { const h = handAt(J, 'aF', W); return trailArc([h[0] - 6, h[1] + 30], 34, 30, 170, 1.6, col, 0.45) + burst(add(h, 160, 10), 12, col); },
  cast: (J, col, P, W) => { const h = handAt(J, 'aB', W), c = [h[0] + 8, h[1]]; return `<circle cx="${r1(c[0])}" cy="${r1(c[1])}" r="15" fill="#bff6ff" opacity=".35"/><circle cx="${r1(c[0])}" cy="${r1(c[1])}" r="8" fill="#fff" opacity=".85"/>` + [0, 45, 90, 135].map((a) => `<path d="M${pt(add(c, a, 11))}L${pt(add(c, a, 22))}M${pt(add(c, a + 180, 11))}L${pt(add(c, a + 180, 22))}" stroke="#bff6ff" stroke-width="2" stroke-linecap="round" opacity=".8"/>`).join(''); },
  aura: (J) => { const c = J.pelvis; return `<ellipse cx="${r1(c[0])}" cy="${r1(c[1] - 22)}" rx="46" ry="74" fill="#fff0a8" opacity=".3"/>` + [-30, -14, 14, 30].map((dx, i) => `<path d="M${r1(c[0] + dx)},${GROUND - 4} q${i % 2 ? 6 : -6},-40 0,-${84 + (i % 2) * 22}" stroke="#fff3b0" stroke-width="2.4" fill="none" opacity=".6" stroke-linecap="round"/>`).join(''); },
};
function fxSVG(fx, J, col, Pz, W) {
  if (Pz && FX2[fx]) return FX2[fx](J, col, Pz, W || 1);
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

// A fishing rod: cork grip, a reel under it with a turning crank, a blank that bends under load.
function rodPts(hand, a, rb) {
  const pts = [], n = 8;
  let p = add(hand, a, -10);
  for (let i = 0; i <= n; i++) { pts.push(p); p = add(p, a - rb * 46 * Math.pow((i + 0.5) / n, 2), 88 / n); }
  return pts;
}
function rodSVG(hand, a, t, P, noLine, col) {
  P = P || {};
  const pts = rodPts(hand, a, P.rb || 0), tip = pts[pts.length - 1], rl = reelAt(hand, a), kb = knobAt(hand, a, P.cr || 0);
  let s = '';
  // (no scene around: the hook hangs from the tip while the rod is up, else the bobber floats at the feet)
  const bob = P.hang > 0.5 ? [tip[0] + Math.sin(t * 4.2) * 4, tip[1] + 16] : [tip[0] + 22, GROUND - 6 + Math.sin(t * 2.4) * 2.5];
  if (!noLine) { s += `<path d="M${pt(tip)} Q${r1((tip[0] + bob[0]) / 2 + 4)},${r1(P.hang > 0.5 ? bob[1] - 8 : bob[1] - 30)} ${pt(bob)}" fill="none" stroke="#cfd6e4" stroke-width="1" opacity=".8"/>`; }
  s += part(taper(pts, pts.map((_, i) => 4.4 - (2.8 * i) / (pts.length - 1))), col || '#8a5a2b', 2.4);
  s += part(taper([add(hand, a, -10), add(hand, a, 7)], [5.6, 5]), '#c89a62', 2);
  s += inkLine(`M${pt(add(hand, a, -6))}L${pt(rl)}`, '#9aa3b5', 1.6);
  s += `<circle cx="${r1(rl[0])}" cy="${r1(rl[1])}" r="4.6" fill="#cfd6e4" stroke="${OL}" stroke-width="1.6"/><circle cx="${r1(rl[0])}" cy="${r1(rl[1])}" r="1.8" fill="#6c7385"/>`;
  s += inkLine(`M${pt(rl)}L${pt(kb)}`, '#9aa3b5', 1.4) + `<circle cx="${r1(kb[0])}" cy="${r1(kb[1])}" r="1.9" fill="#3b3f4a" stroke="${OL}" stroke-width="1"/>`;
  if (!noLine) s += `<circle cx="${r1(bob[0])}" cy="${r1(bob[1])}" r="3.4" fill="#ff4d5e" stroke="${OL}" stroke-width="1.6"/>`;
  return s;
}
// A woodcutter's axe: the blade sits on the leading side of the haft (towards the swing).
// During the strike a smear (P.smR: where the haft was a moment ago) fans out behind the head: one
// solid arc the colour of the blade, the way 2D animators draw a fast swing in a single frame.
function axeSVG(hand, a, t, P) {
  const at = (d, side) => add(add(hand, a, d), a - 90, side);
  let sm = '';
  if (P && P.smR != null && Math.abs(P.smR - a) > 4) {
    const n = 7, outer = [], inner = [];
    for (let i = 0; i <= n; i++) { const b = P.smR + (a - P.smR) * (i / n); outer.push(add(add(hand, b, 52), b - 90, 26)); inner.push(add(hand, b, 30 + 14 * (i / n))); }
    sm = `<path d="M${outer.map(pt).join('L')}L${inner.reverse().map(pt).join('L')}Z" fill="#eef3fb" opacity=".42"/>`
      + `<path d="M${outer.slice(2).map(pt).join('L')}" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" opacity=".8"/>`;
  }
  return sm + part(taper([add(hand, a, -12), add(hand, a, 54)], [3.6, 3]), '#8a5a2b', 2.2)
    + `<path d="M${pt(at(38, 2))} L${pt(at(54, 2))} Q${pt(at(60, 12))} ${pt(at(60, 24))} Q${pt(at(46, 30))} ${pt(at(30, 24))} Q${pt(at(32, 12))} ${pt(at(38, 2))}Z" fill="#cfd6e4" stroke="${OL}" stroke-width="2" stroke-linejoin="round"/>`
    + `<path d="M${pt(at(32, 22))} Q${pt(at(46, 27))} ${pt(at(59, 22))}" fill="none" stroke="#fff" stroke-width="1.6" opacity=".7"/>`;
}
// Other tools swung with both hands like the axe (pickaxe, smith's hammer...): prop id -> drawer(hand, angle, t, P).
// Skill scenes register them (soul-ui.js).
const PROP_DRAW = {};
// A frying pan held by its handle: a shallow dish seen from above, tilted when it is flicked.
// The food sits in it, or flies and spins above it (P.fd: [x, height, spin]).
function panSVG(hand, a, t, P, food) {
  P = P || {};
  const end = add(hand, a, 10), c = panAt0(hand, a), fd = P.fd || [0, 0, 0];
  let s = part(taper([add(hand, a, -4), end], [3.8, 3.4]), '#3b3f4a', 2.2);
  s += `<g transform="translate(${pt(c)}) rotate(${r1(rotTo(a + (P.pt || 0)))})">`
    + `<path d="M-15,0 A15,5.2 0 0,0 15,0 L13.6,4.4 A13.6,4.4 0 0,1 -13.6,4.4Z" fill="#1d2028" stroke="${OL}" stroke-width="2" stroke-linejoin="round"/>`
    + `<ellipse rx="15" ry="5.2" fill="#2a2e38" stroke="${OL}" stroke-width="2"/><ellipse cy=".6" rx="12" ry="3.8" fill="#3a3f4c"/>`
    + `<path d="M-11,-2.6 Q-4,-4.4 4,-4" fill="none" stroke="#6c7385" stroke-width="1.2" opacity=".7"/></g>`;
  // the food: a main piece and two small bits; squashed as it lands (P.fq), stretched as it leaves
  if (food) {
    const q = P.fq || 0, fb = P.fb || [-6, 0, 5.5, 0], sq = `scale(${r1((1 + q * 0.5) * 10) / 10},${r1((1 - q) * 100) / 100})`;
    for (const i of [0, 2]) s += `<g transform="translate(${r1(c[0] + fb[i])},${r1(c[1] - 1.2 - fb[i + 1])}) rotate(${r1(fd[2] * (i ? -1.3 : 0.8))})"><ellipse rx="3.4" ry="2.2" fill="${shade(food, -0.12)}" stroke="${OL}" stroke-width="1.3"/></g>`;
    s += `<g transform="translate(${r1(c[0] + fd[0])},${r1(c[1] - 1.5 - fd[1])}) rotate(${r1(fd[2])}) ${sq}"><ellipse rx="7.5" ry="3.2" fill="${food}" stroke="${OL}" stroke-width="1.6"/><path d="M-4,-1 h6" stroke="#fff" stroke-width="1.2" opacity=".55"/></g>`;
  }
  return s;
}
// A wooden spatula from the back hand towards the pan (angle a).
function spatulaSVG(hand, a) {
  const tip = add(hand, a, 18);
  return part(taper([add(hand, a, -5), add(hand, a, 11)], [2.6, 2.4]), '#a8743f', 2)
    + `<g transform="translate(${pt(tip)}) rotate(${rotTo(a)})"><path d="M-7,-2 L2,-4.6 Q7,-4.6 7,0 Q7,4.6 2,4.6 L-7,2Z" fill="#c8925a" stroke="${OL}" stroke-width="1.6" stroke-linejoin="round"/></g>`;
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
    default: return AV_EXT.aura[id] ? AV_EXT.aura[id](cx, cy, t) : '';
  }
}

/* ================================================================ animation */
// Every <svg class="avatar" data-av="battle|auto|preview"> on screen is animated (~30 fps).
const AVS = new WeakMap();
let avUid = 0;
function basePose(el) {
  const A = avState(), ctx = el.dataset.av;
  if (ctx === 'preview') return el.dataset.pose || A.stance;
  if (ctx === 'battle') return performance.now() < cbKoT ? 'ko' : S.combat.zone != null ? cbStance(S.equip && S.equip.weapon) : A.stance;
  if (ctx === 'ko') return 'ko';   // a defeated foe (arena.js)
  if (ctx === 'enemy') return typeof foeWinding === 'function' && foeWinding() ? CB_CHARGE[cbFam(el.dataset.weapon)] : cbStance(el.dataset.weapon);
  if (S.action && AV_EXT.skill[S.action.skill] && POSE_DRIVE[AV_EXT.skill[S.action.skill]]) return AV_EXT.skill[S.action.skill];
  if (S.action) return S.action.skill === 'fishing' ? 'fish' : S.action.skill === 'cooking' ? 'cook' : S.action.skill === 'woodcutting' ? 'wood' : A.stance;
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
    if (st.look === undefined) st.look = el.dataset.over ? JSON.parse(el.dataset.over) : null;
    const look = st.look ? Object.assign({}, A, st.look) : A;
    const base = basePose(el), drv = POSE_DRIVE[base];
    if (st.cut || now - st.t0 >= st.dur) {
      const nx = st.seq.shift();
      // a step that follows another starts where the last one ended (not at this frame), so sequences keep their timing
      const chain = !st.cut && st.seqOn;
      st.seqOn = !!nx;
      if (nx) Object.assign(st, { from: st.cur, to: POSES[nx[0]], t0: chain ? Math.max(now - 40, st.t0 + st.dur) : now, dur: nx[1], easing: nx[2] || 'io', drive: null });
      else if (drv) { if (st.drive !== base) Object.assign(st, { from: st.cur, to: null, t0: now, dur: 420, easing: 'io', drive: base }); }
      else {
        const want = POSES[base] || POSES.relaxed;
        if (want !== st.to || st.drive) Object.assign(st, { from: st.cur, to: want, t0: now, dur: 380, easing: 'io', drive: null });
      }
      st.cut = false;
    }
    const k = Math.min(1, (now - st.t0) / st.dur);
    let P, Pd;
    if (st.drive) {
      // a motion cycle (it breathes on its own); blended in from the previous pose
      const D = POSE_DRIVE[st.drive] ? POSE_DRIVE[st.drive](driveU(st.drive, t), t, BODY, calm) : st.cur;
      P = Pd = k < 1 ? lerpPose(st.from, D, ease.io(k)) : D;
    } else {
      P = lerpPose(st.from, st.to, ease[st.easing](k));
      // breathing: the chest rises, the head and arms follow a little behind
      const br = calm ? 0 : Math.sin(t * 2.2);
      Pd = Object.assign({}, P, { t2: P.t2 + br * 1.6, n: P.n - br * 1.2, aF: [P.aF[0] + br * 1.4, P.aF[1]], aB: [P.aB[0] - br * 1.4, P.aB[1]] });
      if (P.air) Pd.air = P.air + Math.sin(t * 1.6) * 4;
    }
    st.cur = P;
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
const nextAttack = () => {
  const n = atkN++, x = AV_EXT.attacks;
  return x.length && n % 3 === 2 ? x[Math.floor(n / 3) % x.length] : ATTACKS[[0, 1, 0, 2][n % 4]];
};
const playerAv = () => document.querySelector('[data-portrait="player"] svg.avatar');
// The fight itself (each weapon family's swings, impacts, hurt, KO, victory) is choreographed in arena.js.

/* ================================================================ view */
let avSlot = 'style', avPreview = '';
const PREVIEWS = [['', 'Stance'], ['guard', 'Guard'], ['strike', 'Attack'], ['victory', 'Victory'], ['hurt', 'Hurt'], ['fish', 'Fishing'], ['cook', 'Cooking'], ['wood', 'Chopping']];
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
