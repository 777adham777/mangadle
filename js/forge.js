'use strict';
/* ==========================================================================
   ANIME IDLE RPG — the forge (La Forge, 2026-11-26, docs/FORGE.md). DOM-free.
   One place for the power of a piece of gear and everything that raises it:
   - itemStat: base stats × the wielded weapon's mastery and refinement, × the reforge tier of armour.
   - Weapons (GDD §2.3): every weapon you craft is its own copy; nothing replaces or destroys it.
     S.arms = [{ u, id, ref, awk, el }], S.equipU = the copy you wield (S.equip.weapon = its item id).
     A. Mastery (1-50): battle XP goes to the FAMILY of the wielded weapon (S.wm), so a new sword
        starts at your sword mastery. +2% weapon attack per mastery level.
     B. Refinement (+1 to +10): ingots of the weapon's tier, a gem at +4, +7 and +10. +10% weapon
        attack per step; step +n needs mastery 5n.
     C. Awakening: I at mastery 15 and +3 (choose an element), II at mastery 35 and +7 (the passive of
        its family). Souls of Soul City; II also the guardian material of the weapon's world.
     D. Transfer: a stronger weapon takes over the refinement, awakening and element of an older one,
        for free. The old one stays in your rack, back to +0: nothing is melted.
   - Armour and jewellery: one gem socket (Smelting 25) and reforge tiers (+12% stats each).
   Replaces weapons.js and the forge part of systems.js (the per-item awakening, weapon sockets, the
   hidden weapon reforge and inheritance are gone).
   ========================================================================== */

const isWeapon = (id) => !!(ITEMS[id] && ITEMS[id].type === 'equip' && ITEMS[id].slot === 'weapon');
const ARM_MAX = 50, REF_MAX = 10;
const armXpAt = (L) => Math.round(60 * Math.pow(L - 1, 2.5));        // total mastery XP to reach level L
const armOf = (u) => S.arms.find((a) => a.u === u) || null;
const curArm = () => (S.equipU ? armOf(S.equipU) : null);
const forgeOn = () => isUnlocked('feature:awakening');
const gearOn = forgeOn;
// Forge costs (refinement, awakening, reforge) follow the stage band of a piece (economy.js sets it.tv);
// its value is its sale price (materials + a margin), which would make them explode.
const forgeVal = (id) => { const it = ITEMS[baseOf(id)] || ITEMS[id]; return it.tv || it.value; };

/* ------------------------------------------------------------ elements + families */
// Awakening I: an element. It shapes your auto-attacks and powers techniques with the same tag by 25%.
const ELEMENTS = {
  fire:      { name: 'Fire',      icon: 'fire',          desc: 'Auto-attacks deal 15% more damage.' },
  lightning: { name: 'Lightning', icon: 'lightning-trio', desc: '15% chance for an auto-attack to strike twice.' },
  wind:      { name: 'Wind',      icon: 'wingfoot',      desc: 'You attack 12% faster.' },
  bleed:     { name: 'Bleed',     icon: 'fangs',         desc: 'Auto-attacks ignore 20% of the foe\'s defense.' },
  drain:     { name: 'Drain',     icon: 'heart-plus',    desc: 'Auto-attacks heal you for 8% of the damage dealt.' },
};
// The five families: mastery and the Awakening II passive.
const FAMILIES = {
  short:   { name: 'Short blade', desc: 'You attack 15% faster.' },
  blade:   { name: 'Sword',       desc: 'Your techniques recharge 15% faster.' },
  heavy:   { name: 'Heavy',       desc: '+25% damage against bosses.' },
  ranged:  { name: 'Ranged',      desc: 'The first hit of every fight deals triple damage.' },
  cutlass: { name: 'Cutlass',     desc: '+10 Luck.' },
};
// Dungeon weapons name their own kind (dungeons.js): each belongs to one of the five families.
const FAM_ALIAS = { lance: 'heavy', sickle: 'heavy', fist: 'heavy', cleaver: 'heavy', claw: 'heavy' };
function armFamily(id) {
  const f = ITEMS[id].fam;   // set when a manga name hides the family (lore.js, dungeons.js)
  if (f) return FAMILIES[f] ? f : FAM_ALIAS[f] || 'heavy';
  const n = ITEMS[id].name.toLowerCase();
  if (/bow|cannon|gun/.test(n)) return 'ranged';
  if (/hammer|cleaver|axe|claw|lance|sickle|gauntlet|fist/.test(n)) return 'heavy';
  if (/kunai|senbon|tanto|fang|wakizashi|dagger|needle/.test(n)) return 'short';
  if (/katana|blade|edge|sword|saber/.test(n)) return 'blade';
  return 'cutlass';
}
const armEl = (a) => (a && a.awk >= 1 ? a.el : null);
const armFam = (a) => (a && a.awk >= 2 ? armFamily(a.id) : null);

/* ------------------------------------------------------------ A. mastery */
const famXp = (f) => (S.wm && S.wm[f]) || 0;
const famLv = (f) => { let L = 1; while (L < ARM_MAX && famXp(f) >= armXpAt(L + 1)) L++; return L; };
const armLv = (a) => famLv(armFamily(a.id));
function addFamXp(f, x) {
  if (!S.wm) S.wm = {};
  const before = famLv(f);
  S.wm[f] = Math.min(armXpAt(ARM_MAX), famXp(f) + x);
  if (famLv(f) > before) emit('famlevel', { f, lv: famLv(f) });
}
hook('kill', (e) => { const a = curArm(); if (a) addFamXp(armFamily(a.id), e.xp * (1 + discFx('wxp'))); });

/* ------------------------------------------------------------ the power of a piece */
const armMult = (a) => (1 + 0.02 * (armLv(a) - 1)) * (1 + 0.1 * a.ref);
const armAtk = (a) => Math.round((ITEMS[a.id].stats.atk || 0) * armMult(a));
const REFORGE_STEP = 0.12;
itemStat = (id, k) => {
  const it = ITEMS[id], v = (it.stats && it.stats[k]) || 0;
  if (!v) return 0;
  if (it.slot === 'weapon') { const a = curArm(); return k === 'atk' && a && a.id === id ? Math.round(v * armMult(a)) : v; }
  const t = gearOn() ? gearOf(id).tier : 0;
  if (!t) return v;
  const m = 1 + REFORGE_STEP * t;
  return Number.isInteger(v) ? Math.round(v * m) : v * m;   // perks and other fractional stats keep their decimals
};

/* ------------------------------------------------------------ copies in the bank */
// Weapons never sit in S.items: count/add/remove go through the copies.
function newArm(id) {
  S.armSeq = (S.armSeq || 0) + 1;
  const a = { u: 'w' + S.armSeq, id, ref: 0, awk: 0, el: null };
  S.arms.push(a);
  return a;
}
const armWorth = (a) => a.awk * 1e9 + a.ref * 1e7 + (ITEMS[a.id].stats.atk || 0);
const spareArms = (id) => S.arms.filter((a) => a.id === id && a.u !== S.equipU);
// New copies stack: a copy that was never refined or awakened is interchangeable with every other new
// copy of the same weapon (the bank shows them as one tile ×N). A refined copy is a weapon of its own.
const armFresh = (a) => !a.ref && !a.awk;
const freshArms = (id) => spareArms(id).filter(armFresh);
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
  S.gold += ITEMS[a.id].value;
  dirty = true;
}
// Older saves: weapons kept as stacks in the bank; per-copy battle XP (now the family's mastery).
function migrateArms() {
  if (!Array.isArray(S.arms)) S.arms = [];
  if (!S.wm) S.wm = {};
  for (const id in S.items) if (isWeapon(id)) { const n = S.items[id]; delete S.items[id]; for (let i = 0; i < n; i++) newArm(id); }
  if (S.equip.weapon && !curArm()) { const a = newArm(S.equip.weapon); S.equipU = a.u; }
  S.arms = S.arms.filter((a) => isWeapon(a.id));
  for (const a of S.arms) {
    if (a.xp) { const f = armFamily(a.id); S.wm[f] = Math.max(famXp(f), a.xp); }
    delete a.xp;
  }
  if (S.equipU && !curArm()) { S.equipU = null; S.equip.weapon = null; }
  for (const id in S.gear) if (isWeapon(id) || !ITEMS[id]) delete S.gear[id];
}
{
  const base = sanitize;
  sanitize = function () { base(); migrateArms(); };
}

/* ------------------------------------------------------------ B. refinement */
const REF_INGOT = [[30, 'reishi_ingot'], [100, 'silver_ingot'], [300, 'frost_ingot'], [700, 'void_ingot'], [1500, 'black_ingot'], [4000, 'star_ingot'], [15000, 'sun_ingot'], [Infinity, 'rift_ingot']];
const REF_GEM = { 4: 'jade', 7: 'ruby', 10: 'void_diamond' };
// A weapon forged from shards (gear.js) takes one of its own shards instead of the ingots, while you have one.
const refShard = (a) => { const sh = a.id + '_shard'; return ITEMS[sh] && ITEMS[sh].shardOf === a.id && count(sh) >= 1 ? sh : null; };
function refCost(a) {
  const next = a.ref + 1, sh = refShard(a), ing = REF_INGOT.find((x) => forgeVal(a.id) < x[0])[1], c = sh ? { [sh]: 1 } : { [ing]: 2 + 2 * a.ref };
  if (REF_GEM[next]) c[REF_GEM[next]] = 1;
  return c;
}
// Gold for the forge (balance pass 2026-11-25): each refinement costs more than the last, an awakening
// costs a small fortune; both scale with the weapon's stage band.
const FORGE_GOLD = { ref: 4, awk: [0, 60, 200] };
const refGold = (a) => Math.round(forgeVal(a.id) * FORGE_GOLD.ref * (a.ref + 1) * (a.ref + 1));
const awkGold = (a) => Math.round(forgeVal(a.id) * (FORGE_GOLD.awk[a.awk + 1] || 0));
function refReason(a) {
  if (!forgeOn()) return 'Locked';
  if (a.ref >= REF_MAX) return 'Fully refined';
  if (armLv(a) < 5 * (a.ref + 1)) return `Needs ${FAMILIES[armFamily(a.id)].name} mastery ${5 * (a.ref + 1)}`;
  if (!canAfford(refCost(a))) return 'Missing materials';
  if (S.gold < refGold(a)) return 'Not enough gold';
  return '';
}
function refine(u) {
  const a = armOf(u);
  if (!a || refReason(a)) return false;
  const c = refCost(a);
  for (const k in c) takeStock(k, c[k]);
  S.gold -= refGold(a);
  a.ref++;
  emit('refine', { a });
  dirty = true;
  return true;
}

/* ------------------------------------------------------------ C. awakening */
const AWK = [null, { lv: 15, ref: 3, name: 'Awakening I' }, { lv: 35, ref: 7, name: 'Awakening II' }];
// Souls burned per awakening, by the weapon's stage band (forgeVal).
const AWK_SOULS = [
  [200,      { soul_fragment: 20, wisp_flame: 8 },      { spirit_core: 20, husk_mask: 6 }],
  [1000,     { spirit_core: 15, husk_mask: 5 },         { grave_dust: 15, abyssal_essence: 6 }],
  [5000,     { grave_dust: 15, abyssal_essence: 6 },    { phantom_silk: 12, echo_soul: 4 }],
  [Infinity, { phantom_silk: 10, echo_soul: 4 },        { echo_soul: 12, sovereign_shard: 2 }],
];
// Awakening II also burns the guardian material of the weapon's world (its stage: 4 stages a world).
const GUARD_MAT = ['ashen_tail', 'tide_heart', 'sovereign_shard', 'tyrant_horn', 'matriarch_eye', 'chimera_heart', 'lord_visage', 'rift_shard'];
const awkRelic = (id) => GUARD_MAT[Math.max(0, Math.min(GUARD_MAT.length - 1, Math.floor((ITEMS[baseOf(id)].stage || 0) / 4)))];
function awkCost(a) {
  const next = a.awk + 1, tier = AWK_SOULS.find((c) => forgeVal(a.id) < c[0]), c = Object.assign({}, tier[next]);
  if (next === 2) { const r = awkRelic(a.id); c[r] = (c[r] || 0) + 2; }
  return c;
}
function awkReason(a) {
  const next = AWK[a.awk + 1];
  if (!forgeOn()) return 'Locked';
  if (!next) return 'Fully awakened';
  if (armLv(a) < next.lv) return `Needs ${FAMILIES[armFamily(a.id)].name} mastery ${next.lv}`;
  if (a.ref < next.ref) return `Needs refinement +${next.ref}`;
  if (!canAfford(awkCost(a))) return 'Missing materials';
  if (S.gold < awkGold(a)) return 'Not enough gold';
  return '';
}
function awakenArm(u, el) {
  const a = armOf(u);
  if (!a || awkReason(a) || (a.awk === 0 && !ELEMENTS[el])) return false;
  const c = awkCost(a);
  for (const k in c) takeStock(k, c[k]);
  S.gold -= awkGold(a);
  a.awk++;
  if (a.awk === 1) a.el = el;
  S.stats.awakened = (S.stats.awakened || 0) + 1;
  emit('awakenarm', { a });
  dirty = true;
  return true;
}

/* ------------------------------------------------------------ D. transfer */
// A stronger weapon takes over an older one's refinement, awakening and element, for free. The older one
// stays in the rack, back to +0. Mastery belongs to the family, so a new weapon is never a reset.
const armBaseAtk = (a) => (ITEMS[a.id].stats.atk || 0);
const transferFrom = (b, a) => !!(a && b && a.u !== b.u && armBaseAtk(b) > armBaseAtk(a) && (a.ref > b.ref || a.awk > b.awk));
// The copy that would give b the most.
const transferDonor = (b) => S.arms.filter((a) => transferFrom(b, a)).sort((x, y) => armWorth(y) - armWorth(x))[0] || null;
function transferArm(bu, au) {
  const b = armOf(bu), a = armOf(au);
  if (!transferFrom(b, a)) return false;
  b.ref = Math.max(a.ref, b.ref);
  if (a.awk > b.awk) { b.awk = a.awk; b.el = a.el; }
  a.ref = 0; a.awk = 0; a.el = null;
  if (a.u === S.equipU) equipArm(b.u);
  emit('transfer', { a: b, from: a.id });
  dirty = true;
  return true;
}

/* ------------------------------------------------------------ armour: reforge and the gem socket */
// Per item (all copies share it): { gems: [], tier }.
const GEAR0 = Object.freeze({ gems: [], tier: 0 });
const gearOf = (id) => S.gear[id] || GEAR0;
const gearMut = (id) => S.gear[id] || (S.gear[id] = { gems: [], tier: 0 });
const ownsGear = (id) => count(id) > 0 || Object.values(S.equip).includes(id);
const GEM_FX = { jade: { hp: 0.06 }, sapphire: { def: 0.06 }, ruby: { dmg: 0.06 }, void_diamond: { dmg: 0.04, def: 0.04, hp: 0.04 } };
// Tiers 1-5 cost the newest world's relics; tier 6 (Rift-forged) costs a Rift Shard.
const REFORGE_MAX = 6;
const socketCount = (id) => (!gearOn() || isWeapon(id) ? 0 : skillLv('smithing') >= 25 ? 1 : 0);
const reforgeRelic = () => relicsOf(frontier()).sort((a, b) => ITEMS[a].value - ITEMS[b].value)[0];
const reforgeCost = (id) => {
  const t = gearOf(id).tier, gold = Math.round(forgeVal(id) * 2 * (t + 1) + 200 * (t + 1));
  if (t >= REFORGE_MAX - 1) return { gold, relic: 'rift_shard', n: 1, smith: 90 };   // Rift-forging
  return { gold, relic: reforgeRelic(), n: t + 1, smith: 15 * (t + 1) };
};
function gemSum(k) {
  let s = 0;
  for (const slot in S.equip) { const id = S.equip[slot]; if (id) for (const gm of gearOf(id).gems) if (gm && GEM_FX[gm][k]) s += GEM_FX[gm][k]; }
  return s;
}
hook('dmg', () => 1 + gemSum('dmg'));
hook('def', () => 1 + gemSum('def'));
hook('hp', () => 1 + gemSum('hp'));
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
  if (isWeapon(id)) return 'Weapons are refined';
  if (gearOf(id).tier >= REFORGE_MAX) return 'Max tier';
  if (skillLv('smithing') < c.smith) return `Needs Smelting ${c.smith}`;
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

// Bank: what the awakening souls are for.
for (const c of AWK_SOULS) for (const o of [c[1], c[2]]) for (const k in o) if (!EXTRA_USES.some((u) => u[0] === k && u[1].startsWith('Weapon'))) EXTRA_USES.push([k, 'Weapon awakening (souls burned on awakening)']);
