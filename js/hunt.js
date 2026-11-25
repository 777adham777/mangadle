'use strict';
/* ==========================================================================
   ANIME IDLE RPG — Green Island overhaul (world 6), DOM-free
   Hunting
   - Scent: every trail you follow strengthens the scent (+0.75%). At 100% you sight
     Prime Prey: that run gives ×3 and its material comes out Prime (the Shiny version,
     for the Shiny Log) with 2 Beast Essence. Switching trail keeps the scent.
   - Shiny beasts: a beast you trap can be Shiny (1 in 40, with Luck). A Shiny
     companion gives 50% more. Hunting a beast you already tamed can still turn up its
     Shiny form (1 in 250): yours becomes Shiny.
   Loaded after hex.js.
   ========================================================================== */

QUALITY.tracking = { kind: 'shiny', base: 0, claim: true };   // only Prime Prey leaves Prime materials
Q_TIERS.tracking = [
  [0.25, { speed: 0.05 },  '+5% Hunting speed'],
  [0.5,  { double: 0.05 }, '+5% chance of a double catch'],
  [0.75, { rare: 0.25 },   'Rare finds ×1.25 while hunting'],
  [1,    { xp: 0.1 },      '+10% Hunting XP'],
];
const SCENT_STEP = 0.75, PRIME_MULT = 3, SHINY_BEAST = 1 / 40, SHINY_REHUNT = 1 / 250, SHINY_BEAST_FX = 1.5;
const HUNT = () => { if (!S.hunt) S.hunt = { scent: 0 }; return S.hunt; };
const primeNext = () => HUNT().scent >= 100;
hook('action', (skill, act, mult, gains) => {
  if (skill !== 'tracking') return;
  if (act.beast) return;
  if (!act.out) return;
  const H = HUNT(), out = Object.keys(act.out)[0];
  if (H.scent >= 100) {
    H.scent = 0;
    for (const k of Object.keys(gains)) { const n = gains[k] * (PRIME_MULT - 1); addItem(k, n); gains[k] += n; if (k === out) S.stats.made[k] = (S.stats.made[k] || 0) + n; }
    const vid = variantId(out, 's');
    ensureVariant(vid);
    removeItem(out, 1); addItem(vid, 1);
    gains[out] -= 1; if (gains[out] <= 0) delete gains[out];
    gains[vid] = (gains[vid] || 0) + 1;
    addItem('beast_essence', 2); gains.beast_essence = (gains.beast_essence || 0) + 2;
    S.stats.primes = (S.stats.primes || 0) + 1;
    logQuality('tracking', out, 's', 1, vid);
    emit('prime', { act, item: vid });
    return;
  }
  H.scent = Math.min(100, H.scent + SCENT_STEP * (1 + skPerk('tracking', 'scent')));
  if (H.scent >= 100) emit('scent', { act });
});
// Shiny beasts: on capture, or by hunting one you already have.
hook('action', (skill, act) => {
  if (skill !== 'tracking' || !act.beast) return;
  const B = S.beasts[act.beast];
  if (!B || B.shiny) return;
  const fresh = B.xp === 0 && !B.seen;
  B.seen = 1;
  if (Math.random() < (fresh ? SHINY_BEAST : SHINY_REHUNT) * luckMult() * (1 + skPerk('tracking', 'shiny'))) {
    B.shiny = 1;
    S.stats.shinyBeasts = (S.stats.shinyBeasts || 0) + 1;
    emit('shinybeast', { id: act.beast });
    dirty = true;
  }
});
// A Shiny companion gives half as much again.
compFx = function (kind, skill) {
  let t = 0;
  for (const c of companions()) {
    const K = BEASTS[c].kind, v = beastVal(c) * (1 + discFx('pet')) * (S.beasts[c].shiny ? SHINY_BEAST_FX : 1);
    if (K === kind) t += v;
    else if (kind === 'speed' && skill && (K === 'speed:' + skill || (K === 'gather' && SKILLS[skill].type === 'gather'))) t += v;
  }
  return t;
};
