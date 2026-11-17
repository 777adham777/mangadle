'use strict';
/* ==========================================================================
   TRI-REALM IDLE — worlds beyond the first three
   Each world registers itself with addWorld(): realm, skills + actions, zones,
   relics, schematics, gate and unlocks. Loaded after data.js, before game.js.
   ========================================================================== */

// def: { id, realm: {...}, zones: [...], gate: {...}, unlocks: [...] }
// Zones go before the Rift; the gate goes before the Rift's gate; unlocks before the Rift's unlock.
function addWorld(def) {
  REALMS[def.id] = def.realm;
  // keep the Rift last in REALMS iteration order
  const rift = REALMS.rift; delete REALMS.rift; REALMS.rift = rift;
  WORLD_ORDER.push(def.id);
  const ri = ZONES.findIndex((z) => z.realm === 'rift');
  ZONES.splice(ri, 0, ...def.zones);
  GATES[def.id] = def.gate;
  GATE_ORDER.splice(GATE_ORDER.indexOf('rift'), 0, def.id);
  UNLOCKS.push({ id: 'realm:' + def.id, name: def.realm.name, need: () => !!S.gates[def.id], hint: gateHint(def.id) }, ...def.unlocks);
}

/* ------------------------------------------------------------ finalize */
// Runs after every world registered (bottom of this file).
function finalizeWorlds() {
  UNLOCKS.push(...UNLOCK_TAIL);
  // The Rift opens after the last world's guardian.
  const ri = ZONES.findIndex((z) => z.realm === 'rift');
  GATES.rift.boss = ZONES[ri - 1].id;
}

/* ============================================== SHINOBI: technique scrolls */
// Brewed in Shinobi Arts. Each craft teaches the technique or raises its rank (max 5).
// Effects live in systems.js (TECHNIQUES). 'val' scales with rank.
const TECHNIQUES = {
  shadow_strike: { name: 'Shadow Strike', cost: 20, cd: 8,  desc: (r) => `Strike for ${2 + 0.5 * r}× your max hit.` },
  healing_palm:  { name: 'Healing Palm',  cost: 25, cd: 12, desc: (r) => `Below 60% HP: heal ${15 + 5 * r}% of max HP.` },
  mist_step:     { name: 'Mist Step',     cost: 20, cd: 15, desc: (r) => `For 5s: ${50 + 5 * r}% chance to dodge.` },
  iron_skin:     { name: 'Iron Skin',     cost: 20, cd: 14, desc: (r) => `For 6s: take ${35 + 5 * r}% less damage.` },
  sealing_mark:  { name: 'Sealing Mark',  cost: 25, cd: 16, desc: (r) => `For 8s: enemy defense −${30 + 6 * r}%.` },
  fire_lotus:    { name: 'Fire Lotus',    cost: 45, cd: 20, desc: (r) => `Burst for ${4 + r}× your max hit.` },
};
for (const id in TECHNIQUES) defItem('scroll_' + id, 'Scroll: ' + TECHNIQUES[id].name, '📜', 50, { type: 'scroll', tech: id });
SKILLS.arts.actions.push(
  craft('scroll_shadow_strike', 8, 5, { chakra_shard: 8, healing_leaf: 6 }),
  craft('scroll_healing_palm', 14, 5, { healing_leaf: 12, chakra_orb: 3 }),
  craft('scroll_mist_step', 20, 6, { mist_steel: 3, chakra_orb: 5 }),
  craft('scroll_iron_skin', 28, 6, { beast_fang: 2, storm_chakra: 4, cloud_fern: 6 }),
  craft('scroll_sealing_mark', 36, 7, { storm_chakra: 6, shadowroot: 6, jade: 1 }),
  craft('scroll_fire_lotus', 50, 8, { beast_ember: 4, nature_essence: 4, ashen_tail: 1 }),
);
SKILLS.arts.actions.sort((a, b) => a.level - b.level);

/* ========================================== SOUL: awakening, gems, reforge */
// Weapons earn XP in battle and are released twice with souls. Sockets take gems. Reforge raises any
// piece of gear (+12% stats per tier, max 5) with the newest world's relics, so favourites never go stale.
const RELEASE = [
  null,
  { name: 'First Release', atk: 0.4, smith: 15 },
  { name: 'Final Release', atk: 1.0, smith: 50 },
];
// Souls burned per release, by how strong the weapon is (item value).
const RELEASE_COST = [
  [200,      { soul_fragment: 20, wisp_flame: 8 },      { spirit_core: 20, husk_mask: 6 }],
  [1000,     { spirit_core: 15, husk_mask: 5 },         { grave_dust: 15, abyssal_essence: 6 }],
  [5000,     { grave_dust: 15, abyssal_essence: 6 },    { phantom_silk: 12, echo_soul: 4 }],
  [Infinity, { phantom_silk: 10, echo_soul: 4 },        { echo_soul: 12, sovereign_shard: 2 }],
];
const GEM_FX = { jade: { hp: 0.06 }, sapphire: { def: 0.06 }, ruby: { dmg: 0.06 }, void_diamond: { dmg: 0.04, def: 0.04, hp: 0.04 } };
const REFORGE_MAX = 5;

/* ======================================================= WORLDS 4-7 (below) */

/* ====================================================================== end */
finalizeWorlds();
