'use strict';
/* ==========================================================================
   TRI-REALM IDLE — Kaio Planet overhaul (world 4), DOM-free
   Gravity Training
   - Strain: every session strains your body, more under heavier gravity. At 100%
     you break through your limit: a burst of XP (5 sessions' worth) and, for good,
     +0.3% damage and max HP (up to Limit 100: +30%).
   - Golden Aura: the Shiny version of every session's ki, for the Shiny Log.
   Farming
   - Giant crops: a harvest can come up Giant (1 in 40, luckier with Luck and Shiny
     bonuses): the plot yields three times as much and the Giant crop fills the Shiny Log.
   - Mutations: 8% of harvests leave a seed of the next crop, so a farm grows itself
     towards the rare crops.
   Loaded after soul.js.
   ========================================================================== */

/* ------------------------------------------------------------ quality */
QUALITY.gravity = { kind: 'shiny', base: 1 / 400, claim: true };
QUALITY.farming = { kind: 'shiny', base: 1 / 40, claim: true };
Q_TIERS.gravity = [
  [0.25, { speed: 0.05 },  '+5% Gravity Training speed'],
  [0.5,  { xp: 0.05 },     '+5% Gravity Training XP'],
  [0.75, { double: 0.05 }, '+5% chance of a double session'],
  [1,    { xp: 0.1 },      '+10% Gravity Training XP'],
];
Q_TIERS.farming = [
  [0.25, { speed: 0.05 },  'Crops grow 5% faster'],
  [0.5,  { double: 0.05 }, '+5% chance of a double harvest'],
  [0.75, { shiny: 0.25 },  'Shiny chance ×1.25 on every skill'],
  [1,    { xp: 0.1 },      '+10% Farming XP'],
];
// Farming has no actions: its Shiny Log lists the crops.
{
  const base = qEntries;
  qEntries = function (skill) {
    if (skill !== 'farming') return base(skill);
    const C = S.quality.claim;
    return CROPS.map((c) => {
      const vid = variantId(c.id, 's'), n = S.quality.log[vid] || 0, got = !!C[vid], pay = !got ? qPay(c.id, vid) : null;
      return { act: { id: c.id, level: c.level, name: c.name }, base: c.id, vid, n, got, ready: !!pay, pay };
    });
  };
}

/* ------------------------------------------------------------ Gravity: strain and breakthroughs */
const LIMIT_MAX = 100, LIMIT_FX = 0.003, BREAK_XP = 5;
const KI = () => { const K = S.ki; if (K.strain == null) K.strain = 0; if (K.limit == null) K.limit = 0; return K; };
// Heavier sessions strain more: 1× gravity 0.4% per session ... 800× 1%.
const strainOf = (act) => 0.4 + 0.1 * Math.max(0, SKILLS.gravity.actions.indexOf(act));
hook('action', (skill, act) => {
  if (skill !== 'gravity') return;
  const K = KI();
  K.strain += strainOf(act);
  if (K.strain < 100) return;
  K.strain -= 100;
  if (K.limit < LIMIT_MAX) K.limit++;
  addXp('gravity', act.xp * BREAK_XP);
  S.stats.breakthroughs = (S.stats.breakthroughs || 0) + 1;
  emit('breakthrough', { limit: K.limit, act });
});
// Zenkai / Limit Breaker (Gravity perks) make every breakthrough worth more.
const limitFx = () => LIMIT_FX * (1 + skPerk('gravity', 'limit')) * (S.ki.limit || 0);
hook('dmg', () => 1 + limitFx());
hook('hp', () => 1 + limitFx());

/* ------------------------------------------------------------ Farming: giant crops and mutations */
const MUTATE = 0.08;
const giantChance = () => QUALITY.farming.base * luckMult() * (1 + qFx('shiny')) * hmul('shiny', 'farming') * (1 + skPerk('farming', 'giant'));
{
  const base = harvest;
  harvest = function (i) {
    const p = S.farm.plots[i], c = p && CROP_BY[p.crop];
    const res = base(i);
    if (!res || !c) return res;
    if (Math.random() < giantChance()) {
      const vid = variantId(c.id, 's');
      ensureVariant(vid);
      addItem(vid, 1);
      addItem(c.id, res.n * 2);
      S.stats.made[c.id] = (S.stats.made[c.id] || 0) + res.n * 2;
      res.giant = vid; res.n *= 3;
      logQuality('farming', c.id, 's', 1, vid);
      emit('giant', { crop: c.id, plot: i, n: res.n });
    }
    const nx = CROPS[CROPS.indexOf(c) + 1];
    if (nx && Math.random() < MUTATE * luckMult() * (1 + skPerk('farming', 'mutate'))) { addItem(nx.seed, 1); res.mut = nx.seed; emit('mutation', { from: c.id, seed: nx.seed, plot: i }); }
    return res;
  };
}
for (const c of CROPS.slice(1)) EXTRA_SOURCES.push([c.seed, 'skill', 'farming', `Farming · mutation from the crop before it (${Math.round(MUTATE * 100)}% per harvest)`, MUTATE]);
