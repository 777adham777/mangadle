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
  if (!techOn() || !e) return;
  RT.chakra = Math.min(chakraMax(), RT.chakra + chakraRegen() * dt);
  for (const k in RT.cd) RT.cd[k] -= dt;
  for (const k in RT.fx) RT.fx[k] -= dt;
  for (const id of S.tech.slots.slice(0, techSlots())) {
    if (!id || !techRank(id) || (RT.cd[id] || 0) > 0) continue;
    const T = TECHNIQUES[id];
    if (RT.chakra < T.cost || (TECH_WHEN[id] && !TECH_WHEN[id]())) continue;
    RT.chakra -= T.cost; RT.cd[id] = T.cd;
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
const reforgeCost = (id) => { const t = gearOf(id).tier; return { gold: Math.round(ITEMS[id].value * 2 * (t + 1) + 200 * (t + 1)), relic: reforgeRelic(), n: t + 1, smith: 15 * (t + 1) }; };
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
