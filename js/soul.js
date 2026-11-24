'use strict';
/* ==========================================================================
   TRI-REALM IDLE — Soul City overhaul (world 3), DOM-free
   Reishi Mining
   - The vein: mining the same ore again and again digs deeper into its vein (+4% per
     ore, up to 100%). A deep vein gives up to +15% double ore and twice the gems.
     Switching ore starts a new vein.
   - Mother Lode: now and then a crystal heart cracks open in the rock (more often in a
     deep vein): the next 10 ores come out ×3.
   - Radiant ore: the Shiny version of every ore, for the Shiny Log.
   Smelting
   - Forge heat: every ingot stokes the forge (+2%). Heat makes smelting faster (up to
     +10%) and Pure ingots likelier (up to ×2). The forge cools while you do something else.
   - White Heat: at 100% the furnace roars white: the next 6 smelts give ×2 ingots and half
     of them come out Pure.
   - Pure ingots (the Perfect version of every ingot, for the Perfect Log) refine weapons
     at half the cost: a refinement takes them first when you have enough.
   Loaded after quality.js and weapons.js.
   ========================================================================== */

/* ------------------------------------------------------------ quality */
QUALITY.mining = { kind: 'shiny', base: 1 / 400, claim: true };
QUALITY.smithing = { kind: 'perfect', base: 0.01, claim: true };
Q_TIERS.mining = [
  [0.25, { speed: 0.05 },  '+5% Reishi Mining speed'],
  [0.5,  { rare: 0.25 },   'Gems and rare finds ×1.25 while mining'],
  [0.75, { double: 0.05 }, '+5% chance to mine two ores'],
  [1,    { xp: 0.1 },      '+10% Reishi Mining XP'],
];
Q_TIERS.smithing = [
  [0.25, { speed: 0.05 },   '+5% Smelting speed'],
  [0.5,  { double: 0.05 },  '+5% chance to smelt two ingots'],
  [0.75, { perfect: 0.25 }, 'Perfect chance ×1.25 on every skill'],
  [1,    { xp: 0.1 },       '+10% Smelting XP'],
];

/* ------------------------------------------------------------ state */
{
  const base = defaultState;
  defaultState = function () { return Object.assign(base(), { soul: { vein: { id: null, d: 0 }, lode: 0, heat: 0, white: 0 } }); };
}
const SOUL = () => { if (!S.soul) S.soul = { vein: { id: null, d: 0 }, lode: 0, heat: 0, white: 0 }; return S.soul; };

/* ------------------------------------------------------------ the vein, the Mother Lode */
const VEIN_STEP = 4, LODE_N = 10, LODE_CHANCE = 1 / 200;
const veinDepth = (id) => { const V = SOUL().vein; return id && V.id === id ? V.d : 0; };
const curVein = () => (S.action && S.action.skill === 'mining' ? veinDepth(S.action.id) : 0);
hook('double', (skill) => (skill === 'mining' ? 0.15 * curVein() / 100 : 0));
hook('rare', (skill) => (skill === 'mining' ? 1 + curVein() / 100 : 1));
hook('action', (skill, act, mult, gains) => {
  if (skill !== 'mining' || !act.out) return;
  const O = SOUL(), V = O.vein, ore = Object.keys(act.out)[0];
  if (V.id === act.id) V.d = Math.min(100, V.d + VEIN_STEP); else { O.vein = { id: act.id, d: VEIN_STEP }; O.lode = 0; }
  if (O.lode > 0) {
    const n = 2 * (gains[ore] || 1);
    addItem(ore, n); gains[ore] = (gains[ore] || 0) + n;
    S.stats.made[ore] = (S.stats.made[ore] || 0) + n;
    O.lode--;
    if (!O.lode) emit('lodeend', { ore });
  } else if (Math.random() < LODE_CHANCE * luckMult() * (1 + O.vein.d / 100) * (1 + skPerk('mining', 'lode'))) {
    O.lode = LODE_N;
    S.stats.lodes = (S.stats.lodes || 0) + 1;
    emit('lode', { ore });
  }
});

/* ------------------------------------------------------------ forge heat, White Heat */
const HEAT_STEP = 2, WHITE_N = 6;
const forgeHeat = () => SOUL().heat;
hook('speed', (skill) => (skill === 'smithing' ? 1 + forgeHeat() / 1000 : 1));
hook('perfect', (skill) => (skill === 'smithing' ? (1 + forgeHeat() / 100) * (SOUL().white > 0 ? 50 : 1) : 1));
hook('action', (skill, act, mult, gains) => {
  if (skill !== 'smithing' || !act.out) return;
  const O = SOUL(), ingot = Object.keys(act.out)[0];
  if (O.white > 0) {
    // White Heat: a second ingot of every version that came out
    for (const k of Object.keys(gains)) if (baseOf(k) === ingot) { const n = gains[k]; addItem(k, n); gains[k] += n; S.stats.made[ingot] = (S.stats.made[ingot] || 0) + n; }
    O.white--;
    if (!O.white) emit('whiteend', {});
    return;
  }
  O.heat = Math.min(100, O.heat + HEAT_STEP * (1 + skPerk('smithing', 'heat')));
  if (O.heat >= 100) { O.heat = 0; O.white = WHITE_N + skPerk('smithing', 'white'); S.stats.whiteHeats = (S.stats.whiteHeats || 0) + 1; emit('whiteheat', { ingot }); }
});
// The forge cools down while you do something else (fully in about 3 minutes).
hook('tick', (dt) => {
  const O = SOUL();
  if (O.heat > 0 && !(S.action && S.action.skill === 'smithing')) O.heat = Math.max(0, O.heat - dt * 0.55);
});

/* ------------------------------------------------------------ Pure ingots refine at half cost */
{
  const base = refCost;
  refCost = function (a) {
    const c = base(a);
    for (const k of Object.keys(c)) {
      if (!ITEMS[k] || !ITEMS[k].ingot) continue;
      const vid = variantId(k, 'p'), half = Math.ceil(c[k] / 2);
      if (count(vid) >= half) { ensureVariant(vid); delete c[k]; c[vid] = half; }
    }
    return c;
  };
}
EXTRA_USES.push(...Object.values(INGOT_OF).map((k) => [variantId(k, 'p'), 'Refines a weapon at half the ingots']));
