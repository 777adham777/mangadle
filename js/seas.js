'use strict';
/* ==========================================================================
   ANIME IDLE RPG — Orange Town overhaul (world 1), DOM-free
   - Seasonings for the Cooking spice rack: each dish cooked while one is
     picked uses one and comes out seasoned. Seasoned dishes give a battle
     buff when eaten (more healing, damage, attack speed, less damage taken,
     regeneration). Sources: fishing by-catch, voyages, Orange Town foes,
     the Sunken Chest and the Market.
   - Catch weights: every fish has a size; records are kept per fish.
   Shiny fish and Perfect dishes come from quality.js. Loaded after it.
   ========================================================================== */

// fx: heal (more healing from the dish itself) · dmg · guard (less damage taken) · haste (attack speed) · regen (max HP per second)
// secs: how long the battle buff lasts after you eat the dish (0 = healing only).
const SPICES = {
  salt:    { item: 'sea_salt',     name: 'Sea Salt',       adj: 'Salted',       col: '#eef4f8', icon: 'salt-shaker',   fx: { heal: 0.25 },                         secs: 0 },
  pepper:  { item: 'peppercorns',  name: 'Peppercorns',    adj: 'Peppered',     col: '#5b4638', icon: 'pepper-grains', fx: { dmg: 0.12 },                          secs: 30 },
  lemon:   { item: 'coral_lemon',  name: 'Coral Lemon',    adj: 'Zesty',        col: '#ffe14d', icon: 'cut-lemon',     fx: { guard: 0.2 },                         secs: 20 },
  kelp:    { item: 'sea_kelp',     name: 'Sea Kelp',       adj: 'Kelp-Wrapped', col: '#3fbf7a', icon: 'kelp',          fx: { regen: 0.025 },                       secs: 8 },
  chili:   { item: 'fire_chili',   name: 'Fire Chili',     adj: 'Spicy',        col: '#ff4a2a', icon: 'chili-pepper',  fx: { haste: 0.15 },                        secs: 20 },
  saffron: { item: 'gold_saffron', name: 'Golden Saffron', adj: 'Royal',        col: '#ffbf2e', icon: 'saffron',       fx: { heal: 0.4, dmg: 0.1, guard: 0.1 },    secs: 30 },
};
const SPICE_ORDER = ['salt', 'pepper', 'lemon', 'kelp', 'chili', 'saffron'];
const SPICE_OF_ITEM = {};
SPICE_ORDER.forEach((k, i) => {
  const s = SPICES[k];
  defItem(s.item, s.name, '🧂', [3, 6, 10, 8, 14, 60][i], { type: 'spice', spice: k, rarity: [1, 1, 2, 2, 2, 3][i] });
  SPICE_OF_ITEM[s.item] = k;
});
// "+25% healing, +12% damage for 30s" (m scales the numbers: perfect dishes, Perfect Log bonus)
function spiceText(k, m) {
  const s = SPICES[k], f = s.fx, x = (v) => Math.round(v * (m || 1) * 1000) / 10, out = [];
  if (f.heal) out.push(`+${x(f.heal)}% healing`);
  if (f.dmg) out.push(`+${x(f.dmg)}% damage`);
  if (f.guard) out.push(`−${x(f.guard)}% damage taken`);
  if (f.haste) out.push(`attacks ${x(f.haste)}% faster`);
  if (f.regen) out.push(`heals ${x(f.regen)}% max HP per second`);
  return out.join(', ') + (s.secs ? ` for ${s.secs}s` : '');
}

/* ------------------------------------------------------------ the spice rack */
const spicesOpen = () => isUnlocked('feature:spices');
// The seasoning that goes into this dish, if any (quality.js calls this for every craft).
function spiceFor(skill, out) {
  if (skill !== 'cooking' || !ITEMS[out] || ITEMS[out].type !== 'food' || !spicesOpen()) return null;
  const s = S.kitchen.spice;
  return s && SPICES[s] && count(SPICES[s].item) > 0 ? s : null;
}
// The cook hands you a pouch of salt with the rack, so it can be used right away (once per save).
hook('tick', () => { if (!S.kitchen.gift && spicesOpen()) { S.kitchen.gift = 1; addItem('sea_salt', 10); } });
function useSpice(k) { const id = SPICES[k].item; if (count(id) < 1) return false; removeItem(id, 1); return true; }
function pickSpice(k) {
  if (!spicesOpen() || (k && !SPICES[k])) return;
  S.kitchen.spice = S.kitchen.spice === k ? null : k;
  dirty = true;
}

/* ------------------------------------------------------------ battle buffs */
// Live buffs from seasoned dishes eaten in battle (stat -> { v, t, max, spice }). Not saved: they last seconds.
const SPICE_RT = {};
hook('eat', (id) => {
  const it = ITEMS[id], sp = it && it.spice && SPICES[it.spice];
  if (!sp || !sp.secs) return;
  const m = spicePower(it.q === 'p');
  for (const k in sp.fx) if (k !== 'heal') SPICE_RT[k] = { v: sp.fx[k] * m, t: sp.secs, max: sp.secs, spice: it.spice };
  emit('spicebuff', { spice: it.spice });
});
const spiceV = (k) => (SPICE_RT[k] && SPICE_RT[k].t > 0 ? SPICE_RT[k].v : 0);
hook('tick', (dt) => {
  for (const k in SPICE_RT) { SPICE_RT[k].t -= dt; if (SPICE_RT[k].t <= 0) delete SPICE_RT[k]; }
  const r = spiceV('regen'), C = S.combat;
  if (r && C.zone != null && C.hp > 0) C.hp = Math.min(pMaxHp(), C.hp + pMaxHp() * r * dt);
});
hook('dmg', () => 1 + spiceV('dmg'));
hook('taken', () => 1 - Math.min(0.6, spiceV('guard')));
hook('haste', () => 1 + spiceV('haste'));

/* ------------------------------------------------------------ where seasonings come from */
// Fishing by-catch: only once the spice rack is open (the cook teaches you to keep it).
// [item, chance per catch, [min, max], from fish of this level up]
const BYCATCH = [['sea_salt', 0.2, [1, 2], 1], ['sea_kelp', 0.12, [1, 1], 20]];
hook('action', (skill, act, mult, gains) => {
  if (skill !== 'fishing' || !spicesOpen()) return;
  for (const [id, ch, q, lv] of BYCATCH) if (act.level >= lv && Math.random() < ch * extraMult('fishing')) { const n = randInt(q[0], q[1]); addItem(id, n); gains[id] = (gains[id] || 0) + n; }
});
(() => {
  const foe = (name) => { for (const z of ZONES) for (const e of z.enemies) if (e.name === name) return e; throw new Error('No foe ' + name); };
  foe('Merfolk Brawler').drops.push(['coral_lemon', 0.25, [1, 2]]);
  foe('Reef Shark').drops.push(['sea_kelp', 0.25, [1, 3]]);
  foe('Sea Leviathan').drops.push(['sea_kelp', 0.3, [2, 4]]);
  foe('Storm Corsair').drops.push(['fire_chili', 0.25, [1, 3]]);
  foe('Admiral of the Tide').drops.push(['gold_saffron', 0.5, [1, 3]]);
  // Every port sells something to cook with: voyages bring it back as extra cargo.
  const cargo = (id, ...x) => { const a = SKILLS.voyaging.actions.find((v) => v.id === id); a.extra = (a.extra || []).concat(x); };
  cargo('coastal', ['sea_salt', 0.6, [2, 5]]);
  cargo('merchant', ['peppercorns', 0.6, [2, 5]]);
  cargo('cove', ['fire_chili', 0.5, [2, 4]]);
  cargo('current', ['coral_lemon', 0.5, [2, 4]], ['sea_kelp', 0.4, [2, 4]]);
  cargo('stormbelt', ['fire_chili', 0.4, [2, 5]], ['gold_saffron', 0.15, [1, 2]]);
  cargo('ghostfleet', ['gold_saffron', 0.2, [1, 2]]);
  cargo('worldsedge', ['gold_saffron', 0.3, [1, 3]]);
  ITEMS.sunken_chest.loot.push(['peppercorns', 8, [3, 8]], ['coral_lemon', 6, [2, 5]], ['gold_saffron', 4, [1, 2]]);
  SHOP.push({ id: 'buy_pepper', cat: 'Supplies', realm: 'seas', name: '20× Peppercorns', icon: '🧂', desc: 'Seasons dishes (Cooking).', cost: 150, give: ['peppercorns', 20] });
  for (const [id, ch, , lv] of BYCATCH) EXTRA_SOURCES.push([id, 'skill', 'fishing', `Fishing · ${lv > 1 ? `fish of level ${lv}+` : 'any catch'} (spice rack open)`, ch]);
  for (const k of SPICE_ORDER) EXTRA_USES.push([SPICES[k].item, 'Cooking spice rack: seasons battle food']);
})();

/* ------------------------------------------------------------ catch weights */
// Typical weight (kg) of each fish. Every catch rolls a size around it; mastery grows the fish a little.
const FISH_KG = { minnow: 0.06, reef_bass: 1.4, sea_crab: 0.9, blue_marlin: 95, tidal_eel: 7, giant_octopus: 48, abyss_angler: 14, sea_king: 680, thunder_catfish: 12, coral_dragonet: 30 };
function gauss() { let u = 0, v = 0; while (!u) u = Math.random(); while (!v) v = Math.random(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v); }
// A catch this many times the usual weight is a trophy.
const TROPHY_KG = 1.6;
const fmtKg = (kg) => (kg >= 100 ? Math.round(kg) : kg >= 10 ? kg.toFixed(1) : kg >= 1 ? kg.toFixed(2) : kg.toFixed(3)) + ' kg';
hook('action', (skill, act, mult, gains) => {
  if (skill !== 'fishing' || !act.out) return;
  const fish = Object.keys(act.out)[0], kg0 = FISH_KG[fish];
  if (!kg0) return;
  const shiny = !!gains[variantId(fish, 's')];
  const kg = kg0 * Math.exp(gauss() * 0.25 + masteryLv(skill, act.id) / 400) * (shiny ? 1.25 : 1) * (1 + skPerk('fishing', 'kg'));
  const R = S.quality.rec, best = R[fish] || 0, trophy = kg >= kg0 * TROPHY_KG;
  if (kg > best) R[fish] = Math.round(kg * 1000) / 1000;
  // A trophy is worth landing: it brings a second fish up with it and triple XP.
  if (trophy) { addItem(fish, 1); gains[fish] = (gains[fish] || 0) + 1; addXp('fishing', act.xp * 2); S.stats.trophies = (S.stats.trophies || 0) + 1; }
  emit('catch', { fish, kg, shiny, record: kg > best && best > 0, trophy });
});
