'use strict';
/* ==========================================================================
   TRI-REALM IDLE — world systems (DOM-free). Each plugs into game.js hooks.
   1. Renown & Ascension (every world)
   ========================================================================== */

const worldIndex = (r) => WORLD_ORDER.indexOf(r);
// The newest world you have opened: its relics are what Ascended zones of older worlds drop.
const frontier = () => WORLD_ORDER.filter(realmOpen).pop() || 'seas';
const relicsOf = (r) => Object.keys(ITEMS).filter((k) => ITEMS[k].relic === r);
const zoneOfFight = () => (S.combat.zone != null ? ZONES[S.combat.zone] : null);

/* =============================================================== RENOWN */
// Everything you do in a world earns its Renown (0-100).
// Every 10 levels: +3% speed for that world's skills, +3% damage and defense in its zones.
// Every level anywhere: +0.2% XP on every skill. At 25 / 50 / 75: an Ascension tier for its zones.
const RENOWN_K = 8;                                    // points for level L = 8 × L²  (Lv 100 = 80k)
const renownOn = () => isUnlocked('feature:renown');
const renownPts = (r) => S.renown[r] || 0;
const renownLv = (r) => Math.min(100, Math.floor(Math.sqrt(renownPts(r) / RENOWN_K)));
function renownProg(r) {
  const L = renownLv(r);
  if (L >= 100) return { L, p: 1, need: 0 };
  const lo = RENOWN_K * L * L, hi = RENOWN_K * (L + 1) * (L + 1);
  return { L, p: (renownPts(r) - lo) / (hi - lo), need: Math.ceil(hi - renownPts(r)) };
}
const renownTier = (r) => Math.floor(renownLv(r) / 10);
const totalRenown = () => WORLD_ORDER.reduce((a, r) => a + renownLv(r), 0);
function addRenown(r, n) {
  if (!REALMS[r] || r === 'rift' || !renownOn()) return;
  const before = renownLv(r);
  S.renown[r] = renownPts(r) + n;
  const after = renownLv(r);
  if (after > before) { emit('renown', { realm: r, level: after }); if (after % 25 === 0 || after % 10 === 0) dirty = true; }
}
hook('action', (skill) => addRenown(SKILLS[skill].realm, 1));
hook('kill', (e, z) => addRenown(z.realm, (z.boss ? 25 : 1) * (1 + ascTier(z.realm))));
hook('speed', (skill) => 1 + 0.03 * renownTier(SKILLS[skill].realm));
hook('xp', () => 1 + 0.002 * totalRenown());
const inWorldFight = () => { const z = zoneOfFight(); return z ? 1 + 0.03 * renownTier(z.realm) : 1; };
hook('dmg', inWorldFight);
hook('def', inWorldFight);

/* ============================================================ ASCENSION */
// Replay a world's zones at higher tiers: stronger enemies, more XP, gold and Renown,
// and a chance at the newest world's relics. Old worlds keep paying off.
const ASC = [
  null,
  { name: 'Ascended',  hp: 4,  atk: 2.4, def: 1.5, xp: 4,  relic: 0.05 },
  { name: 'Exalted',   hp: 14, atk: 5,   def: 2.1, xp: 14, relic: 0.10 },
  { name: 'Mythic',    hp: 45, atk: 10,  def: 2.8, xp: 45, relic: 0.18 },
];
const maxAsc = (r) => (r === 'rift' || !renownOn() ? 0 : Math.min(3, Math.floor(renownLv(r) / 25)));
const ascTier = (r) => Math.min(S.asc[r] || 0, maxAsc(r));
function setAsc(r, t) { S.asc[r] = Math.max(0, Math.min(t, maxAsc(r))); const C = S.combat; if (C.zone != null && ZONES[C.zone].realm === r) { C.enemy = null; C.respawn = 0.6; } dirty = true; }
const ASC_CACHE = {};
scaleEnemy = (zi, e) => {
  const t = ascTier(ZONES[zi].realm);
  if (!t) return e;
  const key = zi + ':' + e.name + ':' + t;
  if (ASC_CACHE[key]) return ASC_CACHE[key];
  const A = ASC[t];
  return (ASC_CACHE[key] = Object.assign({}, e, {
    name: `${A.name} ${e.name}`, base: e.name, asc: t,
    hp: Math.round(e.hp * A.hp), atk: Math.round(e.atk * A.atk), def: Math.round(e.def * A.def),
    xp: Math.round(e.xp * A.xp), gold: [Math.round(e.gold[0] * A.xp), Math.round(e.gold[1] * A.xp)],
  }));
};
hook('kill', (e, z, loot, dropped) => {
  const t = ascTier(z.realm);
  if (!t) return;
  const pool = relicsOf(frontier());
  if (pool.length && Math.random() < ASC[t].relic * luckMult()) {
    const id = pick(pool);
    addItem(id, 1); loot[id] = (loot[id] || 0) + 1; dropped.push(ITEMS[id].name);
    emit('rare', { id, source: e.name });
  }
});

/* =========================================================== TECHNIQUES */
// Shinobi Lands. Up to 3 techniques fire on their own in combat when ready, paid with a chakra bar
// that Chakra Focus grows. Slot 2 at Chakra 30, slot 3 at Chakra 60.
const techOn = () => isUnlocked('feature:techniques');
const techRank = (id) => S.tech.rank[id] || 0;
const techSlots = () => 1 + (skillLv('chakra') >= 30 ? 1 : 0) + (skillLv('chakra') >= 60 ? 1 : 0);
const chakraMax = () => 40 + 2 * skillLv('chakra');
const chakraRegen = () => 2 + 0.05 * skillLv('chakra');
const techCost = (id) => Math.round(TECHNIQUES[id].cost * Math.max(0.5, 1 - synergyBonus('techcost', 'chakra')));
const RT = { chakra: 0, cd: {}, fx: {} };     // combat runtime (not saved)
function equipTech(slot, id) {
  if (slot >= techSlots() || (id && !techRank(id))) return;
  S.tech.slots = S.tech.slots.map((x, i) => (i === slot ? id || null : x === id ? null : x));
  dirty = true;
}
hook('action', (skill, act) => {
  const o = act.out && Object.keys(act.out)[0], it = o && ITEMS[o];
  if (!it || it.type !== 'scroll') return;
  removeItem(o, count(o));
  const before = techRank(it.tech);
  S.tech.rank[it.tech] = Math.min(5, before + 1);
  if (!before) { const free = S.tech.slots.findIndex((x, i) => !x && i < techSlots()); if (free >= 0) S.tech.slots[free] = it.tech; }
  emit('technique', { id: it.tech, rank: S.tech.rank[it.tech] });
  dirty = true;
});
hook('block', (skill, act) => {
  const it = act.out && ITEMS[Object.keys(act.out)[0]];
  return it && it.type === 'scroll' && techRank(it.tech) >= 5 ? 'Mastered. This technique is already rank 5.' : '';
});
const CAST = {
  shadow_strike: (e, r) => dealDamage(e, Math.round(pMaxHit() * (2 + 0.5 * r) * mitig(e.def * hmul('edef'))), false, 'Shadow Strike'),
  fire_lotus:    (e, r) => dealDamage(e, Math.round(pMaxHit() * (4 + r) * mitig(e.def * hmul('edef'))), false, 'Fire Lotus'),
  healing_palm:  (e, r) => { const m = pMaxHp(), h = Math.round(m * (0.15 + 0.05 * r)); S.combat.hp = Math.min(m, S.combat.hp + h); emit('tech', { id: 'healing_palm', heal: h }); },
  mist_step:     () => { RT.fx.mist = 5; emit('tech', { id: 'mist_step' }); },
  iron_skin:     () => { RT.fx.skin = 6; emit('tech', { id: 'iron_skin' }); },
  sealing_mark:  () => { RT.fx.mark = 8; emit('tech', { id: 'sealing_mark' }); },
};
const TECH_WHEN = { healing_palm: () => S.combat.hp < 0.6 * pMaxHp() };
hook('combat', (dt, e) => {
  if (!techOn() || !e || (typeof pactOn === 'function' && pactOn('silence'))) return;
  RT.chakra = Math.min(chakraMax(), RT.chakra + chakraRegen() * dt);
  for (const k in RT.cd) RT.cd[k] -= dt;
  for (const k in RT.fx) RT.fx[k] -= dt;
  for (const id of S.tech.slots.slice(0, techSlots())) {
    if (!id || !techRank(id) || (RT.cd[id] || 0) > 0) continue;
    const T = TECHNIQUES[id], cost = techCost(id);
    if (RT.chakra < cost || (TECH_WHEN[id] && !TECH_WHEN[id]())) continue;
    RT.chakra -= cost; RT.cd[id] = T.cd;
    S.stats.techUses = (S.stats.techUses || 0) + 1;
    CAST[id](e, techRank(id));
    if (S.combat.enemy == null) return;
  }
});
hook('tick', (dt) => { if (S.combat.zone == null) { RT.chakra = Math.min(chakraMax(), RT.chakra + 10 * dt); RT.fx = {}; } });
hook('dodge', () => ((RT.fx.mist || 0) > 0 ? 0.5 + 0.05 * techRank('mist_step') : 0));
hook('taken', () => ((RT.fx.skin || 0) > 0 ? 0.65 - 0.05 * techRank('iron_skin') : 1));
hook('edef', () => ((RT.fx.mark || 0) > 0 ? 0.7 - 0.06 * techRank('sealing_mark') : 1));

/* ==================================================== AWAKENING + FORGE */
// Soul Afterlands. Per item (all copies share it): { xp, rel, gems, tier }.
const gearOn = () => isUnlocked('feature:awakening');
const GEAR0 = Object.freeze({ xp: 0, rel: 0, gems: [], tier: 0 });
const gearOf = (id) => S.gear[id] || GEAR0;
const gearMut = (id) => S.gear[id] || (S.gear[id] = { xp: 0, rel: 0, gems: [], tier: 0 });
const ownsGear = (id) => count(id) > 0 || Object.values(S.equip).includes(id);
const relNeed = (id, rel) => Math.round((1500 + ITEMS[id].value * 25) * (rel ? 5 : 1));
const relCost = (id, rel) => RELEASE_COST.find((c) => ITEMS[id].value < c[0])[rel + 1];
const socketCount = (id) => (!gearOn() ? 0 : ITEMS[id].slot === 'weapon' ? gearOf(id).rel : skillLv('smithing') >= 25 ? 1 : 0);
const reforgeRelic = () => relicsOf(frontier()).sort((a, b) => ITEMS[a].value - ITEMS[b].value)[0];
const reforgeCost = (id) => {
  const t = gearOf(id).tier, gold = Math.round(ITEMS[id].value * 2 * (t + 1) + 200 * (t + 1));
  if (t >= REFORGE_MAX - 1) return { gold, relic: 'rift_shard', n: 1, smith: 90 };   // Rift-forging
  return { gold, relic: reforgeRelic(), n: t + 1, smith: 15 * (t + 1) };
};
{
  const base = itemStat;
  itemStat = (id, k) => {
    const v = base(id, k), g = gearOf(id);
    if (!v || !gearOn()) return v;
    let m = 1 + 0.12 * g.tier;
    if (k === 'atk' && ITEMS[id].slot === 'weapon' && g.rel) m *= 1 + RELEASE[g.rel].atk;
    return k === 'gold' ? v * m : Math.round(v * m);
  };
}
function gemSum(k) {
  let s = 0;
  for (const slot in S.equip) { const id = S.equip[slot]; if (id) for (const gm of gearOf(id).gems) if (gm && GEM_FX[gm][k]) s += GEM_FX[gm][k]; }
  return s;
}
hook('dmg', () => 1 + gemSum('dmg'));
hook('def', () => 1 + gemSum('def'));
hook('hp', () => 1 + gemSum('hp'));
hook('kill', (e) => { const w = S.equip.weapon; if (w && gearOn()) gearMut(w).xp += e.xp; });
function awakenReason(id) {
  const g = gearOf(id), next = RELEASE[g.rel + 1];
  if (!gearOn()) return 'Locked';
  if (ITEMS[id].slot !== 'weapon') return 'Only weapons awaken';
  if (!next) return 'Fully released';
  if (skillLv('smithing') < next.smith) return `Needs Bladesmithing ${next.smith}`;
  if (g.xp < relNeed(id, g.rel)) return 'Not enough battle XP';
  if (!canAfford(relCost(id, g.rel))) return 'Missing souls';
  return '';
}
function awaken(id) {
  if (!ownsGear(id) || awakenReason(id)) return false;
  const g = gearMut(id), cost = relCost(id, g.rel);
  for (const k in cost) removeItem(k, cost[k]);
  g.rel++;
  emit('awaken', { id, rel: g.rel });
  dirty = true;
  return true;
}
function socketGem(id, i, gem) {
  if (!ownsGear(id) || i >= socketCount(id) || !GEM_FX[gem] || count(gem) < 1) return false;
  removeItem(gem, 1);
  const g = gearMut(id); g.gems[i] = gem;
  dirty = true;
  return true;
}
function reforgeReason(id) {
  const c = reforgeCost(id);
  if (!gearOn()) return 'Locked';
  if (gearOf(id).tier >= REFORGE_MAX) return 'Max tier';
  if (skillLv('smithing') < c.smith) return `Needs Bladesmithing ${c.smith}`;
  if (S.gold < c.gold) return 'Not enough gold';
  if (!c.relic || count(c.relic) < c.n) return 'Missing relics';
  return '';
}
function reforge(id) {
  if (!ownsGear(id) || reforgeReason(id)) return false;
  const c = reforgeCost(id);
  S.gold -= c.gold; removeItem(c.relic, c.n);
  gearMut(id).tier++;
  emit('reforge', { id, tier: gearOf(id).tier });
  dirty = true;
  return true;
}

/* ================================================================ KI: TOOLS + GADGETS */
// Tinkering tools upgrade a gathering skill for good (+15% speed per tier). Gadgets fill a new gear slot.
const toolTier = (skill) => S.tools[skill] || 0;
hook('speed', (skill) => 1 + 0.15 * toolTier(skill));
hook('action', (skill, act) => {
  const o = act.out && Object.keys(act.out)[0], it = o && ITEMS[o];
  if (!it || it.type !== 'tool') return;
  removeItem(o, count(o));
  if (it.tier > toolTier(it.toolFor)) { S.tools[it.toolFor] = it.tier; emit('tool', { id: o }); dirty = true; }
});
hook('block', (skill, act) => {
  const it = act.out && ITEMS[Object.keys(act.out)[0]];
  if (!it || it.type !== 'tool') return '';
  if (toolTier(it.toolFor) >= it.tier) return 'Built. You already have this tool.';
  if (toolTier(it.toolFor) < it.tier - 1) return `Build Mk ${'I'.repeat(it.tier - 1)} first.`;
  return '';
});
hook('rare', () => 1 + gearStat('rare'));
hook('speed', () => 1 + gearStat('speed'));
hook('xp', (skill) => (SKILLS[skill].type === 'combat' ? 1 + gearStat('cxp') : 1));
hook('dodge', () => gearStat('dodge'));

/* ================================================================ KI: MEAL BUFFS */
// Meals (Cooking + crops) give a timed buff when eaten from the Bank. One buff per stat; eating again refreshes.
const buffVal = (stat) => { const b = S.buffs[stat]; return b && b.t > 0 ? b.v : 0; };
const buffAll = () => buffVal('all');
function eatMeal(id) {
  const it = ITEMS[id];
  if (!it || it.type !== 'meal' || count(id) < 1) return false;
  removeItem(id, 1);
  const mins = it.buff.mins * (1 + synergyBonus('buff', 'cooking'));
  S.buffs[it.buff.stat] = { v: it.buff.val, t: mins * 60 };
  dirty = true;
  return true;
}
hook('tick', (dt) => { for (const k in S.buffs) { S.buffs[k].t -= dt; if (S.buffs[k].t <= 0) { delete S.buffs[k]; dirty = true; } } });
hook('speed', () => 1 + buffVal('speed') + buffAll());
hook('xp', () => 1 + buffVal('xp') + buffAll());
hook('dmg', () => 1 + buffVal('dmg') + buffAll());
hook('gold', () => 1 + buffVal('gold') + buffAll());
hook('rare', () => 1 + buffVal('rare') + buffAll());

/* ================================================================ KI: FARMING */
// Plots grow in real time, in parallel with whatever you are doing. 3 plots, +1 per 20 Farming levels.
// Auto-tend (Farming 15): harvest and replant on its own, offline too.
const CROP_BY = Object.fromEntries(CROPS.map((c) => [c.id, c]));
const plotCount = () => (skillOpen('farming') ? Math.min(7, 3 + Math.floor(skillLv('farming') / 20)) : 0);
const autoTendOn = () => skillLv('farming') >= 15;
function plots() { const P = S.farm.plots; while (P.length < plotCount()) P.push(null); return P.slice(0, plotCount()); }
function plant(i, cropId) {
  const c = CROP_BY[cropId], P = plots();
  if (!c || i >= P.length || P[i] || skillLv('farming') < c.level || count(c.seed) < 1) return false;
  removeItem(c.seed, 1);
  S.farm.plots[i] = { crop: cropId, t: 0 };
  dirty = true;
  return true;
}
function harvest(i) {
  const p = S.farm.plots[i], c = p && CROP_BY[p.crop];
  if (!c || p.t < c.mins * 60) return null;
  const dbl = Math.random() < doubleChance('farming', c.id) ? 2 : 1;
  const n = randInt(c.yield[0], c.yield[1]) * dbl, seeds = Math.random() < 0.6 ? randInt(1, 2) : 0;
  addItem(c.id, n); if (seeds) addItem(c.seed, seeds);
  S.stats.made[c.id] = (S.stats.made[c.id] || 0) + n;
  S.stats.harvests = (S.stats.harvests || 0) + 1;
  addXp('farming', c.xp);
  addRenown('ki', 5);
  S.farm.plots[i] = null;
  if (S.farm.auto && autoTendOn() && count(c.seed) > 0) plant(i, c.id);
  emit('harvest', { crop: c.id, n, seeds });
  dirty = true;
  return { n, seeds };
}
hook('tick', (dt) => {
  plots().forEach((p, i) => {
    if (!p) return;
    const c = CROP_BY[p.crop];
    if (!c) { S.farm.plots[i] = null; return; }
    const was = p.t < c.mins * 60;
    p.t = Math.min(c.mins * 60, p.t + dt * hmul('speed', 'farming'));
    if (p.t >= c.mins * 60) { if (S.farm.auto && autoTendOn()) harvest(i); else if (was) dirty = true; }
  });
});

/* ================================================================ KI: TRANSFORMATIONS */
// Pick a form on the Battlefield. In combat it multiplies your power but drains stamina;
// at 0 you drop out of it until stamina is back to 60%. Gravity Training grows stamina and unlocks forms.
const FORMS = [
  { id: 'surge',    name: 'Ki Surge',         grav: 10, dmg: 1.3, hp: 1.0, drain: 2 },
  { id: 'ascended', name: 'Ascended Warrior', grav: 40, dmg: 1.7, hp: 1.2, drain: 4 },
  { id: 'limit',    name: 'Limit Break',      grav: 75, dmg: 2.5, hp: 1.4, drain: 8 },
];
const FORM_BY = Object.fromEntries(FORMS.map((f) => [f.id, f]));
const transformOn = () => isUnlocked('feature:transform');
const staminaMax = () => 100 + 2 * (S.skills.gravity ? skillLv('gravity') : 0);
const formOpen = (f) => transformOn() && skillLv('gravity') >= f.grav;
const activeForm = () => (S.ki.on && S.ki.form && FORM_BY[S.ki.form]) || null;
function chooseForm(id) { S.ki.form = id && FORM_BY[id] && formOpen(FORM_BY[id]) ? id : null; if (!S.ki.form) S.ki.on = false; dirty = true; }
hook('tick', (dt) => {
  const K = S.ki, max = staminaMax(), fighting = S.combat.zone != null;
  if (K.stamina == null) K.stamina = max;
  const f = K.form && FORM_BY[K.form];
  if (f && fighting && formOpen(f)) {
    if (!K.on && K.stamina >= max * 0.6) { K.on = true; S.stats.transforms = (S.stats.transforms || 0) + 1; emit('transform', f); }
    if (K.on) { K.stamina -= f.drain * dt; if (K.stamina <= 0) { K.stamina = 0; K.on = false; emit('transform', null); } }
  } else if (K.on) K.on = false;
  if (!K.on) K.stamina = Math.min(max, K.stamina + 3 * dt);
});
hook('dmg', () => { const f = activeForm(); return f ? f.dmg : 1; });
hook('hp', () => { const f = activeForm(); return f ? f.hp : 1; });
// Gravity Training also deepens Inner Power: +2% energy power per level.
hook('energy', () => (S.skills.gravity && skillOpen('gravity') ? 1 + 0.02 * skillLv('gravity') : 1));

/* ================================================================ KI: WISH STONES */
// One stone hides in each world (rare find from its skills and foes). All 7: make a permanent wish.
const WISHES = [
  { id: 'power',   name: 'Boundless Power', desc: '+10% damage',              stat: 'dmg',   val: 0.10 },
  { id: 'body',    name: 'Iron Body',       desc: '+10% max HP',              stat: 'hp',    val: 0.10 },
  { id: 'haste',   name: 'Endless Haste',   desc: '+8% speed on every skill', stat: 'speed', val: 0.08 },
  { id: 'fortune', name: 'Golden Fortune',  desc: '+15% gold',                stat: 'gold',  val: 0.15 },
  { id: 'wisdom',  name: 'Ancient Wisdom',  desc: '+8% XP on every skill',    stat: 'xp',    val: 0.08 },
  { id: 'luck',    name: 'Lucky Star',      desc: '+10% rare finds',          stat: 'rare',  val: 0.10 },
];
const wishesOn = () => isUnlocked('feature:wishes');
const stoneFor = (realm) => { const i = worldIndex(realm); return i >= 0 && i < 7 ? 'wish_stone_' + (i + 1) : null; };
const hasAllStones = () => [1, 2, 3, 4, 5, 6, 7].every((i) => count('wish_stone_' + i) > 0);
function tryStone(realm, chance, source) {
  const id = stoneFor(realm);
  if (!wishesOn() || !id || count(id) > 0 || Math.random() >= chance * luckMult()) return;
  addItem(id, 1);
  emit('rare', { id, source });
}
hook('action', (skill) => tryStone(SKILLS[skill].realm, 1 / 1500, SKILLS[skill].name));
hook('kill', (e, z) => tryStone(z.realm, z.boss ? 1 / 40 : 1 / 900, e.name));
function makeWish(id) {
  const w = WISHES.find((x) => x.id === id);
  if (!w || !hasAllStones()) return false;
  for (let i = 1; i <= 7; i++) removeItem('wish_stone_' + i, 1);
  S.wishes[id] = (S.wishes[id] || 0) + 1;
  emit('wish', w);
  dirty = true;
  return true;
}
const wishVal = (stat) => WISHES.reduce((a, w) => a + (w.stat === stat ? w.val * (S.wishes[w.id] || 0) : 0), 0);
for (const st of ['dmg', 'hp', 'gold', 'rare']) hook(st, () => 1 + wishVal(st));
hook('speed', () => 1 + wishVal('speed'));
hook('xp', () => 1 + wishVal('xp'));

/* ================================================================ HEX: DOMAIN */
// A 3×3 board of sigils. Cells open with Sigilcraft (3, +1 every 12 levels). Each sigil gets
// +25% per orthogonal neighbour from the same world, +50% if its whole row or column is one world.
// Sigilcraft level adds up to +50% to everything. With 3+ sigils, every fight opens with a Domain Release.
const domainOn = () => isUnlocked('feature:domain');
const domainCells = () => (domainOn() ? Math.min(9, 3 + Math.floor(skillLv('sigilcraft') / 12)) : 0);
const cellOpen = (i) => i < domainCells();
function sigilPower(i) {
  const C = S.domain.cells, id = C[i], sg = id && SIGILS[id];
  if (!sg || !cellOpen(i)) return 0;
  const tagAt = (j) => (cellOpen(j) && C[j] && SIGILS[C[j]] ? SIGILS[C[j]].tag : null);
  const r = Math.floor(i / 3), c = i % 3;
  let m = 1;
  for (const [dr, dc] of [[-1, 0], [1, 0], [0, -1], [0, 1]]) {
    const rr = r + dr, cc = c + dc;
    if (rr >= 0 && rr < 3 && cc >= 0 && cc < 3 && tagAt(rr * 3 + cc) === sg.tag) m += 0.25;
  }
  const row = [0, 1, 2].every((k) => tagAt(r * 3 + k) === sg.tag), col = [0, 1, 2].every((k) => tagAt(k * 3 + c) === sg.tag);
  if (row || col) m += 0.5;
  return sg.val * m * (1 + Math.min(0.5, skillLv('sigilcraft') / 200));
}
function domainTotals() {
  const t = {};
  S.domain.cells.forEach((id, i) => { const sg = id && SIGILS[id]; if (!sg) return; const k = sg.kind === 'speed' ? 'speed:' + sg.target : sg.kind; t[k] = (t[k] || 0) + sigilPower(i); });
  return t;
}
let DOMAIN_CACHE = null, DOMAIN_SIG = '';
function domainFx(k) {
  const sig = S.domain.cells.join(',') + '|' + (S.skills.sigilcraft ? skillLv('sigilcraft') : 0) + '|' + domainCells();
  if (sig !== DOMAIN_SIG) { DOMAIN_SIG = sig; DOMAIN_CACHE = domainTotals(); }
  return DOMAIN_CACHE[k] || 0;
}
function placeSigil(i, id) {
  if (!cellOpen(i) || !SIGILS[id] || count(id) < 1) return false;
  if (S.domain.cells[i]) addItem(S.domain.cells[i], 1);
  removeItem(id, 1);
  S.domain.cells[i] = id;
  dirty = true;
  return true;
}
function removeSigil(i) { const id = S.domain.cells[i]; if (!id) return; addItem(id, 1); S.domain.cells[i] = null; dirty = true; }
hook('speed', (skill) => 1 + domainFx('speed:' + SKILLS[skill].realm));
for (const k of ['dmg', 'def', 'hp', 'gold', 'rare']) hook(k, () => 1 + domainFx(k));
hook('xp', () => 1 + domainFx('xp'));
const domainSigils = () => S.domain.cells.filter((id, i) => id && cellOpen(i)).length;
const releaseMult = () => 1 + 0.5 * domainSigils();
hook('spawn', () => { RT.release = domainOn() && domainSigils() >= 3; });
hook('combat', (dt, e) => {
  if (!RT.release || !e) return;
  RT.release = false;
  dealDamage(e, Math.round(pMaxHit() * releaseMult() * mitig(e.def * hmul('edef'))), false, 'Domain Release');
});

/* ================================================================ HEX: PACTS */
// Restrictions you choose for big bonuses. 1 slot, 2 at Pacts 40, 3 at Pacts 80.
// Holding pacts trains the Pacts skill, and every Pacts level makes their bonuses 1% stronger.
const PACTS = [
  { id: 'fast',    name: 'Empty Stomach',  vow: 'You never eat in battle.',                 gift: (m) => `+${Math.round(40 * m)}% damage` },
  { id: 'glass',   name: 'Glass Body',     vow: '−35% max HP.',                             gift: (m) => `+${Math.round(60 * m)}% damage` },
  { id: 'silence', name: 'Vow of Silence', vow: 'Your techniques are sealed.',               gift: (m) => `+${Math.round(35 * m)}% max HP, +${Math.round(20 * m)}% defense` },
  { id: 'poverty', name: 'Vow of Poverty', vow: '−60% gold from every source.',              gift: (m) => `+${Math.round(40 * m)}% rare finds` },
  { id: 'focus',   name: 'Single Focus',   vow: 'Combat XP −50%.',                          gift: (m) => `+${Math.round(30 * m)}% skill speed` },
  { id: 'blind',   name: 'Blindfold',      vow: 'Rare finds −50%.',                         gift: (m) => `+${Math.round(25 * m)}% XP on every skill` },
];
const pactsOn = () => skillOpen('pacts');
const pactSlots = () => (pactsOn() ? 1 + (skillLv('pacts') >= 40 ? 1 : 0) + (skillLv('pacts') >= 80 ? 1 : 0) : 0);
const pactOn = (id) => pactsOn() && S.pacts.active.slice(0, pactSlots()).includes(id);
const pactMult = () => 1 + skillLv('pacts') / 100;
function togglePact(id) {
  const A = S.pacts.active;
  if (A.includes(id)) S.pacts.active = A.filter((x) => x !== id);
  else if (A.length < pactSlots()) A.push(id);
  else return false;
  dirty = true;
  return true;
}
hook('tick', (dt) => {
  const n = S.pacts.active.slice(0, pactSlots()).length;
  if (!n) return;
  S.stats.pactTime = (S.stats.pactTime || 0) + dt;
  addXp('pacts', xpFor(skillLv('pacts'), 1) * 0.5 * n * dt);
});
hook('dmg', () => (pactOn('fast') ? 1 + 0.4 * pactMult() : 1) * (pactOn('glass') ? 1 + 0.6 * pactMult() : 1));
hook('hp', () => (pactOn('glass') ? 0.65 : 1) * (pactOn('silence') ? 1 + 0.35 * pactMult() : 1));
hook('def', () => (pactOn('silence') ? 1 + 0.2 * pactMult() : 1));
hook('gold', () => (pactOn('poverty') ? 0.4 : 1));
hook('rare', () => (pactOn('poverty') ? 1 + 0.4 * pactMult() : 1) * (pactOn('blind') ? 0.5 : 1));
hook('speed', () => (pactOn('focus') ? 1 + 0.3 * pactMult() : 1));
hook('xp', (skill) => (pactOn('focus') && SKILLS[skill].type === 'combat' ? 0.5 : 1) * (pactOn('blind') ? 1 + 0.25 * pactMult() : 1));

/* ================================================================ HUNTER: BAIT */
// While you carry bait for a skill (and bait is on), each action uses one: +50% rare finds, +10% double.
const baitFor = (skill) => Object.keys(ITEMS).find((k) => ITEMS[k].type === 'bait' && ITEMS[k].baitFor === skill && count(k) > 0);
const baitOn = (skill) => S.useBait !== false && !!baitFor(skill);
hook('rare', (skill) => (skill && baitOn(skill) ? 1.5 : 1));
hook('double', (skill) => (baitOn(skill) ? 0.1 : 0));
hook('action', (skill) => { const b = S.useBait !== false && baitFor(skill); if (b) removeItem(b, 1); });

/* ================================================================ HUNTER: BEASTS */
// Beast Taming actions use a trap: capture chance 30% + 2% per level above the beast (max 85%).
// Already tamed: it leaves Beast Essence instead. One companion is active; it gains levels (max 20)
// over time and from essence, and its bonus grows with them.
const beastLv = (id) => { const b = S.beasts[id]; return b ? Math.min(20, 1 + Math.floor(Math.sqrt(b.xp / 40))) : 0; };
const beastVal = (id) => { const B = BEASTS[id]; return B.base + B.per * (beastLv(id) - 1); };
const companion = () => (S.companion && S.beasts[S.companion] ? S.companion : null);
const captureChance = (act) => Math.min(0.85, 0.3 + 0.02 * Math.max(0, skillLv('taming') - act.level));
hook('action', (skill, act) => {
  if (!act.beast) return;
  if (S.beasts[act.beast]) { const n = randInt(1, 2); addItem('beast_essence', n); return; }
  if (Math.random() < captureChance(act) * luckMult()) {
    S.beasts[act.beast] = { xp: 0 };
    if (!companion()) S.companion = act.beast;
    emit('tamed', act.beast);
    dirty = true;
  }
});
function setCompanion(id) { if (S.beasts[id]) { S.companion = id; dirty = true; } }
function feedBeast(id, n) {
  n = Math.min(n, count('beast_essence'));
  if (!S.beasts[id] || n <= 0 || beastLv(id) >= 20) return false;
  removeItem('beast_essence', n);
  S.beasts[id].xp += 25 * n;
  dirty = true;
  return true;
}
hook('tick', (dt) => { const c = companion(); if (c && beastLv(c) < 20) S.beasts[c].xp += dt / 10; });
function compFx(kind, skill) {
  const c = companion();
  if (!c) return 0;
  const K = BEASTS[c].kind;
  if (K === kind) return beastVal(c);
  if (kind === 'speed' && skill && (K === 'speed:' + skill || (K === 'gather' && SKILLS[skill].type === 'gather'))) return beastVal(c);
  return 0;
}
hook('speed', (skill) => 1 + compFx('speed', skill));
for (const k of ['dmg', 'hp', 'rare']) hook(k, () => 1 + compFx(k));
hook('xp', () => 1 + compFx('xp'));
hook('dodge', () => compFx('dodge'));

/* ================================================================ HUNTER: CONTRACTS */
// Licence ranks from stars: Bronze 10, Silver 40, Gold 100. 3 contracts (4 at Silver, 5 at Gold),
// new ones every 4 hours; targets come from every world you have opened.
const CONTRACT_HOURS = 4;
const RANKS = [[0, 'Unranked', 1], [10, 'Bronze Hunter', 1.25], [40, 'Silver Hunter', 1.5], [100, 'Gold Hunter', 2]];
const contractsOn = () => isUnlocked('feature:contracts');
const licence = () => { let r = 0; RANKS.forEach((x, i) => { if (S.contracts.stars >= x[0]) r = i; }); return r; };
const contractSlots = () => 3 + (licence() >= 2 ? 1 : 0) + (licence() >= 3 ? 1 : 0);
function rollContract() {
  const worlds = WORLD_ORDER.filter(realmOpen);
  const r = pick(worlds), kinds = ['kill', 'gather', 'craft'];
  for (let tries = 0; tries < 20; tries++) {
    const kind = pick(kinds);
    if (kind === 'kill') {
      const zs = ZONES.filter((z, i) => z.realm === r && !z.boss && zoneUnlocked(i));
      if (!zs.length) continue;
      const z = pick(zs), n = randInt(3, 8) * 10;
      return { kind, realm: r, target: z.id, n, base: S.combat.kills[z.id] || 0, stars: 1 + (worldIndex(r) >= 3 ? 1 : 0) };
    }
    const sks = Object.keys(SKILLS).filter((k) => SKILLS[k].realm === r && skillOpen(k) && SKILLS[k].type === (kind === 'gather' ? 'gather' : 'craft'));
    if (!sks.length) continue;
    const sk = pick(sks), acts = SKILLS[sk].actions.filter((a) => a.out && a.level <= skillLv(sk) && !a.schem && ITEMS[Object.keys(a.out)[0]].type !== 'tool' && ITEMS[Object.keys(a.out)[0]].type !== 'scroll');
    if (!acts.length) continue;
    const a = pick(acts), item = Object.keys(a.out)[0], n = kind === 'gather' ? randInt(10, 25) * 10 : randInt(2, 6) * 10;
    return { kind, realm: r, target: item, skill: sk, n, base: S.stats.made[item] || 0, stars: 1 + (a.level >= 50 ? 1 : 0) };
  }
  return null;
}
function refreshContracts(force) {
  const C = S.contracts, now = Date.now();
  if (!contractsOn()) return;
  if (!force && C.next && now < C.next && C.list.length) { while (C.list.length < contractSlots()) { const c = rollContract(); if (!c) break; C.list.push(c); } return; }
  C.list = [];
  for (let i = 0; i < contractSlots(); i++) { const c = rollContract(); if (c) C.list.push(c); }
  C.next = now + CONTRACT_HOURS * 3600 * 1000;
  C.rerolls = licence() >= 2 ? 1 : 0;
  dirty = true;
}
const contractProg = (c) => Math.min(c.n, (c.kind === 'kill' ? S.combat.kills[c.target] || 0 : S.stats.made[c.target] || 0) - c.base);
function claimContract(i) {
  const C = S.contracts, c = C.list[i];
  if (!c || contractProg(c) < c.n) return null;
  const mult = RANKS[licence()][2], gold = Math.round((500 + 400 * worldIndex(c.realm) ** 2) * c.stars * mult * 10);
  S.gold += gold;
  C.stars += c.stars;
  S.stats.contracts = (S.stats.contracts || 0) + 1;
  addRenown('hunter', 20); addRenown(c.realm, 40);
  const card = Math.random() < 0.7 ? giveCard(c.realm, 'Contract') : null;
  C.list.splice(i, 1);
  const nc = rollContract(); if (nc) C.list.splice(i, 0, nc);
  emit('contract', { gold, stars: c.stars, card });
  dirty = true;
  return { gold, card };
}
function rerollContract(i) {
  const C = S.contracts;
  if (!C.list[i]) return false;
  const cost = 5000 * (1 + worldIndex(frontier()));
  if (C.rerolls > 0) C.rerolls--; else if (S.gold >= cost) S.gold -= cost; else return false;
  const nc = rollContract(); if (nc) C.list[i] = nc;
  dirty = true;
  return true;
}
const rerollCost = () => (S.contracts.rerolls > 0 ? 0 : 5000 * (1 + worldIndex(frontier())));
hook('tick', () => { if (contractsOn() && (!S.contracts.next || Date.now() >= S.contracts.next || S.contracts.list.length < contractSlots())) refreshContracts(); });

/* ================================================================ HUNTER: CARD BOOK */
// One page per world: a card for each of its foes and relics. Cards come from contracts (70%),
// and very rarely from that world's foes. A full page: +10% speed for its skills, +5% damage & defense in its zones.
const CARDS = {};      // id -> { realm, name, kind ('foe' | 'relic'), ref }
function buildCards() {
  for (const r of WORLD_ORDER) {
    const foes = [...new Set(ZONES.filter((z) => z.realm === r).flatMap((z) => z.enemies.map((e) => e.name)))];
    foes.forEach((n, i) => { CARDS[`card_${r}_f${i}`] = { realm: r, name: n, kind: 'foe', ref: n }; });
    relicsOf(r).forEach((k, i) => { CARDS[`card_${r}_r${i}`] = { realm: r, name: ITEMS[k].name, kind: 'relic', ref: k }; });
  }
}
buildCards();
const cardsOf = (r) => Object.keys(CARDS).filter((k) => CARDS[k].realm === r);
const pageDone = (r) => { const c = cardsOf(r); return c.length > 0 && c.every((k) => S.cards[k]); };
function giveCard(realm, source) {
  const pool = cardsOf(realm).filter((k) => !S.cards[k]);
  if (!pool.length) { S.gold += 2000 * (1 + worldIndex(realm)); return null; }
  const id = pick(pool);
  S.cards[id] = 1;
  emit('card', { id, source, done: pageDone(realm) });
  dirty = true;
  return id;
}
hook('kill', (e, z) => { if (contractsOn() && Math.random() < 1 / 2500 * luckMult()) giveCard(z.realm, e.name); });
hook('speed', (skill) => (pageDone(SKILLS[skill].realm) ? 1.1 : 1));
const cardZoneFx = () => { const z = zoneOfFight(); return z && pageDone(z.realm) ? 1.05 : 1; };
hook('dmg', cardZoneFx);
hook('def', cardZoneFx);

/* ================================================================ ECHO: MUSEUM */
// Each artifact restored once = a permanent bonus (it goes to the museum, not the bank).
hook('action', (skill, act) => {
  const o = act.out && Object.keys(act.out)[0];
  if (!o || !ARTIFACTS[o]) return;
  removeItem(o, count(o));
  if (!S.museum[o]) { S.museum[o] = 1; emit('artifact', o); dirty = true; }
});
hook('block', (skill, act) => { const o = act.out && Object.keys(act.out)[0]; return o && ARTIFACTS[o] && S.museum[o] ? 'In the museum. Already restored.' : ''; });
const museumFx = (kind, realm) => Object.keys(S.museum).reduce((a, id) => { const A = ARTIFACTS[id]; return a + (A && A.kind === kind && (kind !== 'speed' || A.realm === realm) ? A.val : 0); }, 0);
hook('speed', (skill) => 1 + museumFx('speed', SKILLS[skill].realm));
for (const k of ['dmg', 'hp', 'gold']) hook(k, () => 1 + museumFx(k));
hook('xp', () => 1 + museumFx('xp'));

/* ================================================================ ECHO: YOUR ECHO */
// Awaken (3 Awakening Shards) rolls an Echo with 6 grades (E..A). Communing deepens the bond: every 10 bond
// levels raises every grade by one (max A). Give it a task: it runs that action in parallel, at its own speed.
//   Power: +5% damage per grade · Speed: its action speed · Range: which worlds it can work in
//   Durability: +4% max HP per grade · Precision: +5% double chance per grade · Potential: faster bond growth
const GRADES = ['E', 'D', 'C', 'B', 'A'];
const ESTATS = [['pow', 'Power'], ['spd', 'Speed'], ['rng', 'Range'], ['dur', 'Durability'], ['prc', 'Precision'], ['pot', 'Potential']];
const ECHO_BY = Object.fromEntries(ECHOES.map((e) => [e.id, e]));
const echoOn = () => !!(S.echo && S.echo.id);
const bondLv = () => Math.min(40, Math.floor(Math.sqrt((S.echo.bond || 0) / 30)));
const grade = (st) => (echoOn() ? Math.min(4, (S.echo.grades[st] || 0) + Math.floor(bondLv() / 10)) : 0);
const echoAbility = (id) => echoOn() && S.echo.id === id;
const echoRange = () => 2 + Math.round(grade('rng') * 1.5);           // number of worlds (in order) it can reach
const echoCanWork = (skill) => { const r = SKILLS[skill].realm; return r === 'echo' || worldIndex(r) < echoRange(); };
const echoSpeedMult = (skill) => [0.3, 0.45, 0.6, 0.8, 1][grade('spd')] * (echoAbility('silent_tide') && SKILLS[skill].realm === 'seas' ? 1.5 : 1) * (1 + compFx('echo'));
function rollEcho() {
  const e = pick(ECHOES), g = {};
  for (const [k] of ESTATS) g[k] = Math.min(4, randInt(0, 2) + (Math.random() < 0.1 ? 1 : 0));
  S.echo = { id: e.id, grades: g, bond: 0, task: null, prog: 0 };
  emit('echo', e);
  dirty = true;
}
function releaseEcho() { S.echo = { id: null, grades: null, bond: 0, task: null, prog: 0 }; dirty = true; }
hook('action', (skill, act) => {
  if (skill !== 'bonding') return;
  if (act.id === 'awaken') { rollEcho(); if (S.action && S.action.id === 'awaken') S.action = null; }
  else if (echoOn()) S.echo.bond += (act.id === 'deep_commune' ? 4 : 1) * (1 + 0.25 * grade('pot'));
});
hook('block', (skill, act) => {
  if (skill !== 'bonding') return '';
  if (act.id === 'awaken' && echoOn()) return 'You already have an Echo. Release it first to awaken another.';
  if (act.id !== 'awaken' && !echoOn()) return 'Awaken an Echo first.';
  return '';
});
function setEchoTask(skill, id) {
  if (!echoOn()) return false;
  if (!skill) { S.echo.task = null; dirty = true; return true; }
  const a = findAction(skill, id);
  if (!a || !skillOpen(skill) || skill === 'bonding' || SKILLS[skill].type === 'farm' || skillLv(skill) < a.level || (a.schem && !S.known[a.schem]) || !echoCanWork(skill)) return false;
  S.echo.task = { skill, id }; S.echo.prog = 0;
  dirty = true;
  return true;
}
function echoTaskBlock() {
  const t = S.echo.task, a = t && findAction(t.skill, t.id);
  if (!a) return 'No task';
  if (!echoCanWork(t.skill)) return 'Out of range';
  if (a.in && !canAfford(a.in)) return 'Out of materials';
  return actionBlock(t.skill, a);
}
hook('tick', (dt) => {
  if (!echoOn() || !S.echo.task) return;
  const t = S.echo.task, a = findAction(t.skill, t.id);
  if (!a || echoTaskBlock()) return;
  S.echo.prog += dt * echoSpeedMult(t.skill);
  const T = actionTime(t.skill, a);
  let guard = 0;
  while (S.echo.prog >= T && guard++ < 50) {
    if (echoTaskBlock()) break;
    S.echo.prog -= T;
    const refund = a.in && echoAbility('rewind') && Math.random() < 0.15 ? Object.assign({}, a.in) : null;
    ECHO_ACTING = true;
    completeAction(t.skill, a);
    ECHO_ACTING = false;
    if (refund) for (const k in refund) addItem(k, refund[k]);
    if (echoAbility('gilded_hand')) S.gold += a.xp * 5;
    S.stats.echoActions = (S.stats.echoActions || 0) + 1;
  }
});
let ECHO_ACTING = false;
hook('double', (skill) => (ECHO_ACTING ? 0.05 * grade('prc') : 0));
hook('dmg', () => 1 + 0.05 * grade('pow') * (echoAbility('star_fist') ? 2 : 1));
hook('hp', () => 1 + 0.04 * grade('dur') * (echoAbility('iron_bloom') ? 2 : 1));
hook('def', () => (echoAbility('iron_bloom') ? 1.1 : 1));
hook('rare', () => (echoAbility('paper_moon') ? 1.1 : 1));

/* ================================================================ RIFT: TEARS */
// The Rift Tear changes every hour: one foe from each of two worlds you have opened, torn to Rift strength,
// with their world's drops (doubled) and relics.
const TEAR = ZONES.find((z) => z.tear);
let TEAR_KEY = '';
function tearWorlds(hour) {
  const ws = WORLD_ORDER.filter((r) => r !== 'rift');
  const a = hour % ws.length, b = (a + 1 + (Math.floor(hour / ws.length) % (ws.length - 1))) % ws.length;
  return [ws[a], ws[b]];
}
function updateTear() {
  if (!TEAR) return;
  const hour = Math.floor(Date.now() / 3600000), key = String(hour);
  if (key === TEAR_KEY) return;
  TEAR_KEY = key;
  TEAR.worlds = tearWorlds(hour);
  TEAR.until = (hour + 1) * 3600000;
  TEAR.name = `Rift Tear: ${REALMS[TEAR.worlds[0]].name} × ${REALMS[TEAR.worlds[1]].name}`;
  TEAR.enemies = TEAR.worlds.map((r, i) => {
    const pool = ZONES.filter((z) => z.realm === r && !z.boss).flatMap((z) => z.enemies);
    const e = pool[(hour * 7 + i * 3) % pool.length];
    const drops = e.drops.filter(([d]) => !(ITEMS[d] && ITEMS[d].type === 'schematic')).map(([d, ch, q]) => [d, Math.min(1, ch * 2), q]);
    const rl = relicsOf(r); if (rl.length) drops.push([rl[0], 0.2, [1, 2]]);
    return en(`Torn ${e.name}`, '', 160000, Math.round(6800 * ATK_SCALE.rift), 1100, 2.3, 60000, [40000, 70000], drops);
  });
  TEAR.enemies.forEach((x, i) => { x.base = TEAR.enemies[i].name.replace('Torn ', ''); });
  const C = S && S.combat;
  if (C && C.zone != null && ZONES[C.zone] === TEAR) { C.enemy = null; C.respawn = 1; }
}
updateTear();
hook('tick', updateTear);
