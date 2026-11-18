'use strict';
/* ==========================================================================
   TRI-REALM — weapons (GDD §2.3), DOM-free. Every weapon you craft or find is its own copy
   with its own progression; nothing replaces or destroys it when a better one drops.
   S.arms = [{ u, id, xp, ref, awk, el }], S.equipU = the copy you wield (S.equip.weapon = its item id).
   A. Level (1-50): the wielded weapon earns battle XP. +2% weapon attack per level.
   B. Refinement (+1 to +10, Soul City): ingots of the weapon's tier, plus a gem at +4, +7 and +10.
      +10% weapon attack per step. Step +n needs weapon level 5n.
   C. Awakening (Soul City): I at level 25 and +5 (choose an element), II at level 50 and +10
      (the passive of its family). Costs the souls of Soul City; II also a Soul City relic.
   Armor and accessories keep the simpler shared progression (sockets, reforge) in systems.js.
   ========================================================================== */

const isWeapon = (id) => !!(ITEMS[id] && ITEMS[id].type === 'equip' && ITEMS[id].slot === 'weapon');
const ARM_MAX = 50, REF_MAX = 10;
const armXpAt = (L) => Math.round(60 * Math.pow(L - 1, 2.5));        // total XP to reach level L
const armLv = (a) => { let L = 1; while (L < ARM_MAX && a.xp >= armXpAt(L + 1)) L++; return L; };
const armOf = (u) => S.arms.find((a) => a.u === u) || null;
const curArm = () => (S.equipU ? armOf(S.equipU) : null);
const forgeOn = () => isUnlocked('feature:awakening');

/* ------------------------------------------------------------ elements + families */
// Awakening I: an element. It shapes your auto-attacks and powers techniques with the same tag by 25%.
const ELEMENTS = {
  fire:      { name: 'Fire',      icon: 'fire',          desc: 'Auto-attacks deal 15% more damage.' },
  lightning: { name: 'Lightning', icon: 'lightning-trio', desc: '15% chance for an auto-attack to strike twice.' },
  wind:      { name: 'Wind',      icon: 'wingfoot',      desc: 'You attack 12% faster.' },
  bleed:     { name: 'Bleed',     icon: 'fangs',         desc: 'Auto-attacks ignore 20% of the foe\'s defense.' },
  drain:     { name: 'Drain',     icon: 'heart-plus',    desc: 'Auto-attacks heal you for 8% of the damage dealt.' },
};
// Awakening II: the passive of the weapon's family.
const FAMILIES = {
  short:   { name: 'Short blade', desc: 'You attack 15% faster.' },
  blade:   { name: 'Sword',       desc: 'Your techniques recharge 15% faster.' },
  heavy:   { name: 'Heavy',       desc: '+25% damage against bosses.' },
  ranged:  { name: 'Ranged',      desc: 'The first hit of every fight deals triple damage.' },
  cutlass: { name: 'Cutlass',     desc: '+10 Luck.' },
};
function armFamily(id) {
  const n = ITEMS[id].name.toLowerCase();
  if (/bow|cannon|gun/.test(n)) return 'ranged';
  if (/hammer|cleaver|axe|claw|lance|sickle|gauntlet|fist/.test(n)) return 'heavy';
  if (/kunai|senbon|tanto|fang|wakizashi|dagger|needle/.test(n)) return 'short';
  if (/katana|blade|edge|sword|saber/.test(n)) return 'blade';
  return 'cutlass';
}
const armEl = (a) => (a && a.awk >= 1 ? a.el : null);
const armFam = (a) => (a && a.awk >= 2 ? armFamily(a.id) : null);

/* ------------------------------------------------------------ stats */
const armMult = (a) => (1 + 0.02 * (armLv(a) - 1)) * (1 + 0.1 * a.ref);
const armAtk = (a) => Math.round((ITEMS[a.id].stats.atk || 0) * armMult(a));
{
  const base = itemStat;
  itemStat = (id, k) => {
    const v = base(id, k), a = curArm();
    return k === 'atk' && a && a.id === id && v ? Math.round(v * armMult(a)) : v;
  };
}

/* ------------------------------------------------------------ copies in the bank */
// Weapons never sit in S.items: count/add/remove go through the copies.
function newArm(id) {
  S.armSeq = (S.armSeq || 0) + 1;
  const a = { u: 'w' + S.armSeq, id, xp: 0, ref: 0, awk: 0, el: null };
  S.arms.push(a);
  return a;
}
const armWorth = (a) => a.awk * 1e9 + a.ref * 1e7 + a.xp;
const spareArms = (id) => S.arms.filter((a) => a.id === id && a.u !== S.equipU);
function equipArm(u) {
  const a = armOf(u);
  if (!a) return;
  S.equipU = u; S.equip.weapon = a.id;
  dirty = true;
}
{
  const baseAdd = addItem, baseRemove = removeItem, baseEquip = equip, baseUnequip = unequip;
  addItem = function (id, n) {
    if (!isWeapon(id)) return baseAdd(id, n);
    if (n <= 0) return;
    for (let i = 0; i < n; i++) newArm(id);
    if (!S.found[id]) { S.found[id] = 1; emit('newitem', id); }
  };
  removeItem = function (id, n) {
    if (!isWeapon(id)) return baseRemove(id, n);
    const out = spareArms(id).sort((x, y) => armWorth(x) - armWorth(y)).slice(0, n).map((a) => a.u);
    S.arms = S.arms.filter((a) => !out.includes(a.u));
  };
  equip = function (id) {
    if (!isWeapon(id)) return baseEquip(id);
    const best = spareArms(id).sort((x, y) => armWorth(y) - armWorth(x))[0];
    if (best) equipArm(best.u);
  };
  unequip = function (slot) {
    if (slot === 'weapon') { S.equipU = null; S.equip.weapon = null; dirty = true; return; }
    return baseUnequip(slot);
  };
}
// count() lives in game.js and reads S.items; weapons are counted here.
const armCount = (id) => spareArms(id).length;
function sellArm(u) {
  const a = armOf(u);
  if (!a || a.u === S.equipU) return;
  S.arms = S.arms.filter((x) => x !== a);
  S.gold += ITEMS[a.id].value * (1 + a.ref);
  dirty = true;
}
function salvageArm(u) {
  const a = armOf(u), it = a && ITEMS[a.id];
  if (!a || a.u === S.equipU || !it.salvage) return null;
  S.arms = S.arms.filter((x) => x !== a);
  for (const k in it.salvage) addItem(k, it.salvage[k]);
  dirty = true;
  return it.salvage;
}
// Older saves kept weapons as stacks in the bank: turn each into a copy (the equipped one too).
function migrateArms() {
  if (!Array.isArray(S.arms)) S.arms = [];
  for (const id in S.items) if (isWeapon(id)) { const n = S.items[id]; delete S.items[id]; for (let i = 0; i < n; i++) newArm(id); }
  if (S.equip.weapon && !curArm()) {
    const a = newArm(S.equip.weapon);
    a.xp = (S.gear[S.equip.weapon] && S.gear[S.equip.weapon].xp) || 0;
    S.equipU = a.u;
  }
  S.arms = S.arms.filter((a) => isWeapon(a.id));
  if (S.equipU && !curArm()) { S.equipU = null; S.equip.weapon = null; }
  for (const id in S.gear) if (isWeapon(id)) delete S.gear[id];
}
{
  const base = sanitize;
  sanitize = function () { base(); migrateArms(); };
}

/* ------------------------------------------------------------ A. battle XP */
hook('kill', (e) => {
  const a = curArm();
  if (!a || armLv(a) >= ARM_MAX) return;
  const before = armLv(a);
  a.xp = Math.min(armXpAt(ARM_MAX), a.xp + e.xp * (1 + discFx('wxp')));
  if (armLv(a) > before) emit('armlevel', { a, lv: armLv(a) });
});

/* ------------------------------------------------------------ B. refinement */
const REF_INGOT = [[30, 'reishi_ingot'], [100, 'silver_ingot'], [300, 'frost_ingot'], [700, 'void_ingot'], [1500, 'black_ingot'], [4000, 'star_ingot'], [15000, 'sun_ingot'], [Infinity, 'rift_ingot']];
const REF_GEM = { 4: 'jade', 7: 'ruby', 10: 'void_diamond' };
function refCost(a) {
  const next = a.ref + 1, ing = REF_INGOT.find((x) => ITEMS[a.id].value < x[0])[1], c = { [ing]: 2 + 2 * a.ref };
  if (REF_GEM[next]) c[REF_GEM[next]] = 1;
  return c;
}
function refReason(a) {
  if (!forgeOn()) return 'Locked';
  if (a.ref >= REF_MAX) return 'Fully refined';
  if (armLv(a) < 5 * (a.ref + 1)) return `Needs weapon level ${5 * (a.ref + 1)}`;
  if (!canAfford(refCost(a))) return 'Missing materials';
  return '';
}
function refine(u) {
  const a = armOf(u);
  if (!a || refReason(a)) return false;
  const c = refCost(a);
  for (const k in c) takeStock(k, c[k]);
  a.ref++;
  emit('refine', { a });
  dirty = true;
  return true;
}

/* ------------------------------------------------------------ C. awakening */
const AWK = [null, { lv: 25, ref: 5, name: 'Awakening I' }, { lv: 50, ref: 10, name: 'Awakening II' }];
const AWK_RELIC = 'husk_heart';
function awkCost(a) {
  const next = a.awk + 1, tier = RELEASE_COST.find((c) => ITEMS[a.id].value < c[0]), c = Object.assign({}, tier[next]);
  if (next === 2) c[AWK_RELIC] = (c[AWK_RELIC] || 0) + 3;
  return c;
}
function awkReason(a) {
  const next = AWK[a.awk + 1];
  if (!forgeOn()) return 'Locked';
  if (!next) return 'Fully awakened';
  if (armLv(a) < next.lv) return `Needs weapon level ${next.lv}`;
  if (a.ref < next.ref) return `Needs refinement +${next.ref}`;
  if (!canAfford(awkCost(a))) return 'Missing materials';
  return '';
}
function awakenArm(u, el) {
  const a = armOf(u);
  if (!a || awkReason(a) || (a.awk === 0 && !ELEMENTS[el])) return false;
  const c = awkCost(a);
  for (const k in c) takeStock(k, c[k]);
  a.awk++;
  if (a.awk === 1) a.el = el;
  S.stats.awakened = (S.stats.awakened || 0) + 1;
  emit('awakenarm', { a });
  dirty = true;
  return true;
}

/* ------------------------------------------------------------ in battle */
const fightingBoss = () => { const z = zoneOfFight(); return !!(z && z.boss); };
{
  // Auto-attacks: the element of the wielded weapon, the ranged opener.
  playerHit = function (e) {
    const a = curArm(), el = armEl(a), C = S.combat;
    const tL = typeof pasLv === 'function' ? pasLv('nen_trans') : 0, scarlet = (RT.fx.scarlet || 0) > 0;
    const roll = scarlet ? 1 : rand(0.5, 1);
    let m = (tL ? 1 + 0.08 + 0.01 * (tL - 1) + (tL >= 10 ? 0.1 : 0) : 1) * (scarlet ? 1.5 : 1) * (el === 'fire' ? 1.15 : 1) * (typeof inDomain === 'function' && inDomain('domain_blaze') && RT.domainLv >= 10 ? 1.25 : 1);
    if (armFam(a) === 'ranged' && RT.opener) { m *= 3; RT.opener = false; }
    const def = e.def * hmul('edef') * (el === 'bleed' ? 0.8 : 1);
    const hit = () => {
      const dmg = Math.max(1, Math.round(pMaxHit() * roll * m * mitig(def)));
      dealDamage(e, dmg, scarlet || roll > 0.9);
      if (el === 'drain') C.hp = Math.min(pMaxHp(), C.hp + dmg * 0.08);
    };
    hit();
    if (el === 'lightning' && C.enemy != null && Math.random() < 0.15) hit();
  };
}
hook('spawn', () => { RT.opener = true; });
hook('haste', () => { const a = curArm(); return (armEl(a) === 'wind' ? 1.12 : 1) * (armFam(a) === 'short' ? 1.15 : 1); });
hook('dmg', () => (armFam(curArm()) === 'heavy' && fightingBoss() ? 1.25 : 1));
hook('luckStat', () => (armFam(curArm()) === 'cutlass' ? 10 : 0));
hook('combat', (dt) => { if (armFam(curArm()) === 'blade') for (const k in RT.cd) RT.cd[k] -= dt * 0.15; });
// A technique whose tag matches your weapon's element is 25% stronger (techniques.js reads this).
const armTechMult = (id) => { const el = armEl(curArm()); return el && id && TECHNIQUES[id].tags.includes(el) ? 1.25 : 1; };
