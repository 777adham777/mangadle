'use strict';
/* ==========================================================================
   ANIME IDLE RPG — loot pass (loaded after worlds.js, before icons.js)
   - every world has a treasure chest, drop-only gear with a utility perk, and a
     very rare Rift Shard on its guardian
   - rarity (1 Common … 5 Legendary) comes from how hard an item is to get, not its price
   - nothing is salvaged (La Forge, 2026-11-26): crafted gear sells for its materials + a margin
   ========================================================================== */

/* ------------------------------------------------- treasure for worlds 4-7 */
// Chests: rare finds of the world's gathering skill + drops on its foes. 'GEM' = random gem, 'FRUIT' = random fruit.
defItem('capsule_crate', 'Capsule Crate', '🧰', 3000, chest([2000, 6000], [
  ['ki_orb', 30, [3, 8]], ['ki_core', 22, [2, 5]], ['seed_fire_pepper', 12, [1, 3]], ['GEM', 10, [1, 1]], ['seed_frost_melon', 8, [1, 2]],
  ['gravity_plate', 8, [1, 1]], ['warrior_sash', 4, [1, 1]], ['seed_star_fruit', 2, [1, 1]], ['FRUIT', 0.3, [1, 1]]]));
defItem('cursed_box', 'Cursed Box', '🧰', 6000, chest([5000, 12000], [
  ['hex_residue', 30, [3, 8]], ['hex_shade', 20, [2, 5]], ['hex_core', 14, [1, 3]], ['GEM', 12, [1, 1]], ['bound_talisman', 8, [1, 1]],
  ['veil_shard', 5, [1, 1]], ['cursed_fragment', 6, [1, 3]], ['FRUIT', 0.3, [1, 1]]]));
defItem('hunters_cache', "Hunter's Cache", '🧰', 12000, chest([10000, 25000], [
  ['swift_feather', 25, [3, 8]], ['stag_antler', 20, [2, 5]], ['lynx_pelt', 14, [1, 3]], ['GEM', 12, [1, 1]], ['seed_thunder_root', 10, [1, 2]],
  ['trail_stone', 8, [1, 1]], ['beast_essence', 8, [1, 2]], ['chimera_trap', 2, [1, 1]], ['FRUIT', 0.3, [1, 1]]]));
defItem('echo_reliquary', 'Sealed Reliquary', '🧰', 25000, chest([20000, 50000], [
  ['bronze_fragment', 25, [4, 10]], ['gold_fragment', 20, [3, 8]], ['obsidian_fragment', 15, [2, 5]], ['GEM', 12, [1, 1]], ['echo_dust', 12, [1, 3]],
  ['awakening_shard', 8, [1, 1]], ['pillar_glyph', 3, [1, 1]], ['FRUIT', 0.3, [1, 1]]]));
RARE_FINDS.gravity.push(['capsule_crate', 1 / 150]);
RARE_FINDS.exorcism.push(['cursed_box', 1 / 150]);
RARE_FINDS.tracking.push(['hunters_cache', 1 / 150]);
RARE_FINDS.archaeology.push(['echo_reliquary', 1 / 150]);
// Crafting skills get a small "lucky batch" find too, so every profession can surprise you.
RARE_FINDS.cooking.push(['sunken_chest', 1 / 400]);
RARE_FINDS.arts.push(['sealed_scroll', 1 / 400]);
RARE_FINDS.smithing.push(['GEM', 1 / 250]);

/* ------------------------------------------- drop-only gear for worlds 4-7 */
// Each sits a little under the world's iconic gear but carries a utility perk (rare finds, skill speed,
// combat XP, gold, dodge), so a lucky drop stays worth wearing next to raw-stat pieces.
defItem('battle_scouter',   'Battle Visor',         '⚙️', 15000,  eq('accessory', { atk: 70, def: 35, hp: 380, rare: 0.06 }));
defItem('weighted_gi',      'Weighted Gi',           '🥋', 16000,  eq('armor', { def: 150, hp: 860, cxp: 0.08 }));
defItem('crimson_knuckles', 'Crimson Knuckles',      '🥊', 28000,  eq('weapon', { atk: 165, dodge: 0.03 }));
defItem('paper_blade',      'Paper Talisman Blade',  '🗡️', 25000,  eq('weapon', { atk: 205, rare: 0.05 }));
defItem('veil_shroud',      'Veil Shroud',           '🧥', 26000,  eq('armor', { def: 215, hp: 1150, dodge: 0.04 }));
defItem('matriarch_rosary', "Matriarch's Rosary",    '📿', 42000,  eq('accessory', { atk: 110, def: 55, hp: 600, speed: 0.05 }));
defItem('wyvern_bow',       'Wyvern-Bone Bow',       '🏹', 45000,  eq('weapon', { atk: 275, cxp: 0.08 }));
defItem('beastlord_mantle', 'Beastlord Mantle',      '🧥', 48000,  eq('armor', { def: 285, hp: 1600, gold: 0.12 }));
defItem('chimera_fang',     'Chimera Fang Pendant',  '🦷', 75000,  eq('accessory', { atk: 150, def: 60, hp: 700, dodge: 0.04 }));
defItem('ripple_gloves',    'Ripple Gloves',         '🥊', 90000,  eq('weapon', { atk: 370, speed: 0.04 }));
defItem('stone_mask',       'Stone Mask',            '🗿', 95000,  eq('accessory', { atk: 210, def: 90, hp: 1000, rare: 0.08 }));
defItem('sunlit_armor',     'Sunlit Pillar Armor',   '🛡️', 150000, eq('armor', { def: 400, hp: 2300, cxp: 0.06 }));

(() => {
  const foe = (name) => { for (const z of ZONES) for (const e of z.enemies) if (e.name === name) return e; throw new Error('No foe ' + name); };
  const drop = (name, ...d) => foe(name).drops.push(...d);
  // Kaio Planet
  drop('Raging Ape', ['battle_scouter', 1 / 250, [1, 1]], ['capsule_crate', 1 / 60, [1, 1]]);
  drop('Elite Soldier', ['battle_scouter', 1 / 250, [1, 1]]);
  drop('Wasteland Brawler', ['capsule_crate', 1 / 60, [1, 1]]);
  drop('Armored Commander', ['weighted_gi', 1 / 300, [1, 1]]);
  drop('Crimson Tyrant', ['crimson_knuckles', 1 / 25, [1, 1]], ['capsule_crate', 0.3, [1, 2]]);
  // Shinjuku
  drop('Grudge Spirit', ['paper_blade', 1 / 250, [1, 1]], ['cursed_box', 1 / 60, [1, 1]]);
  drop('Shrine Specter', ['paper_blade', 1 / 250, [1, 1]], ['cursed_box', 1 / 60, [1, 1]]);
  drop('Veil Walker', ['veil_shroud', 1 / 300, [1, 1]]);
  drop('Cursed Matriarch', ['matriarch_rosary', 1 / 25, [1, 1]], ['cursed_box', 0.3, [1, 2]]);
  // Green Island
  drop('Cliff Wyvern', ['wyvern_bow', 1 / 250, [1, 1]]);
  drop('Rival Examinee', ['hunters_cache', 1 / 60, [1, 1]]);
  drop('Bandit Hunter', ['hunters_cache', 1 / 60, [1, 1]]);
  drop('Ruin Guardian', ['beastlord_mantle', 1 / 300, [1, 1]]);
  drop('Chimera King', ['chimera_fang', 1 / 25, [1, 1]], ['hunters_cache', 0.3, [1, 2]]);
  // Echo Quarter
  drop('Sunlight Monk', ['ripple_gloves', 1 / 250, [1, 1]], ['echo_reliquary', 1 / 60, [1, 1]]);
  drop('Wind Pillar Guard', ['ripple_gloves', 1 / 300, [1, 1]]);
  drop('Living Statue', ['stone_mask', 1 / 300, [1, 1]]);
  drop('Echo Thief', ['echo_reliquary', 1 / 60, [1, 1]]);
  drop('Pillar Lord', ['sunlit_armor', 1 / 25, [1, 1]], ['echo_reliquary', 0.3, [1, 2]]);
  // Every world guardian: a very rare Rift Shard (Rift-forging, the Rift Cleaver).
  for (const z of ZONES) if (z.boss && z.realm !== 'rift') z.enemies[0].drops.push(['rift_shard', 1 / 400, [1, 1]]);
  // Early regular zones: one very rare jackpot each, so long farms can still surprise you.
  drop('Storm Corsair', ['FRUIT', 1 / 1500, [1, 1]]);
  drop('Stone Golem', ['ruby', 1 / 400, [1, 1]]);
  drop('Sand Wraith', ['void_diamond', 1 / 800, [1, 1]]);
  drop('Bone Priest', ['rift_shard', 1 / 3000, [1, 1]]);
})();

// Uses that come from systems rather than recipes (shown in the Bank under "Used in").
EXTRA_USES.push(
  ['rift_shard', 'Rift-forge any gear to tier 6 (Bank → gear → Reforge)'],
  ['jade', 'Gem socket: +6% max HP'], ['sapphire', 'Gem socket: +6% defense'], ['ruby', 'Gem socket: +6% damage'], ['void_diamond', 'Gem socket: +4% damage, defense and HP'],
);
for (const c of RELEASE_COST) for (const o of [c[1], c[2]]) for (const k in o) if (!EXTRA_USES.some((u) => u[0] === k && u[1].startsWith('Weapon'))) EXTRA_USES.push([k, 'Weapon awakening (souls burned on release)']);
for (const f of FRUITS) EXTRA_USES.push([f, 'Eat a copy of the fruit you already ate to raise its rank (max 5)']);

/* ------------------------------------------------------------------ rarity */
const RARITY_NAME = ['', 'Common', 'Uncommon', 'Rare', 'Epic', 'Legendary'];
// Chance per try → tier. Boss fights are long, so a boss drop counts as ten times rarer.
const dropTier = (p) => (p >= 0.25 ? 1 : p >= 0.06 ? 2 : p >= 1 / 50 ? 3 : p >= 1 / 200 ? 4 : 5);
const levelTier = (L) => (L < 20 ? 1 : L < 45 ? 2 : L < 70 ? 3 : 4);
const CRAFTED = {};   // item id -> true when a recipe makes it
function computeRarity() {
  const best = {};
  const see = (id, t) => {
    if (id === 'FRUIT' || id === 'GEM' || !ITEMS[id]) return;
    best[id] = Math.min(best[id] || 9, t);
  };
  for (const k in SKILLS) for (const a of SKILLS[k].actions) {
    for (const o in a.out || {}) { see(o, levelTier(a.level)); CRAFTED[o] = CRAFTED[o] || !!a.in; }
    for (const [t, c] of a.extra || []) see(t, Math.max(levelTier(a.level), dropTier(c)));
    if (a.loot) { a.loot.table.forEach(([t]) => see(t, levelTier(a.level))); a.loot.rare.forEach(([t, c]) => see(t, dropTier(c))); }
  }
  for (const k in RARE_FINDS) for (const [t, c] of RARE_FINDS[k]) see(t, dropTier(c));
  for (const z of ZONES) for (const e of z.enemies) for (const [t, c] of e.drops) see(t, dropTier(z.boss ? c / 10 : c));
  for (const k in ITEMS) if (ITEMS[k].type === 'chest') {
    const tot = ITEMS[k].loot.reduce((a, l) => a + l[1], 0);
    for (const [t, w] of ITEMS[k].loot) see(t, dropTier((w / tot) / 100));   // chests themselves are rare
  }
  for (const s of SHOP) if (s.give) see(s.give[0], 1);
  for (const [id, , , , rate] of EXTRA_SOURCES) see(id, rate == null ? 2 : dropTier(rate));
  for (const c of CROPS) see(c.id, levelTier(c.level));
  for (const id in ITEMS) {
    const it = ITEMS[id];
    let r = best[id] || 3;
    if (it.relic) r = Math.max(r, 2);
    if (it.type === 'schematic') r = Math.max(r, 3);
    if (it.type === 'chest') r = Math.max(r, 2);
    if (it.type === 'artifact') r = 4;
    if (it.type === 'equip' && CRAFTED[id] && SCHEM_FOR(id)) r = Math.max(r, 4);   // iconic gear
    if (id.startsWith('ancient_')) r = 5;
    if (it.type === 'fruit' || it.type === 'wish' || id === 'rift_shard' || id === 'rift_eye' || id === 'rift_cleaver') r = 5;
    it.rarity = Math.min(5, Math.max(1, r));
  }
  Object.assign(ITEMS.jade, { rarity: 2 }); Object.assign(ITEMS.sapphire, { rarity: 3 });
  Object.assign(ITEMS.ruby, { rarity: 4 }); Object.assign(ITEMS.void_diamond, { rarity: 5 });
}
const SCHEM_FOR = (id) => Object.keys(ITEMS).find((k) => ITEMS[k].type === 'schematic' && ITEMS[k].teaches === id);

/* ---------------------------------------------------------------- world lock */
// Every item belongs to one universe, and only drops there (user rule, 2026-11-25): no Log Pose in the Leaf
// Village, no Devil Fruit off a Shinjuku curse, no Soul City ore in a voyage haul, no fish dug up in the Echo
// Quarter. A foe drops, a skill finds (rare finds, by-products), a ship hauls and a chest holds only items of
// its own world. Exceptions: gems (plain minerals every world refines with), the Rift Shard (the tear runs
// through every world) and the Rift itself (the crossover, where every world bleeds in).
// An item's world: HOME_OVERRIDE, else its world relic, else the world whose skill gathers it, else the world
// of most foes that drop it, else of its first source.
const WORLD_NEUTRAL = new Set(['GEM', 'jade', 'sapphire', 'ruby', 'void_diamond', 'rift_shard']);
const HOME_OVERRIDE = {
  nature_essence: 'shinobi',   // Senjutsu: the Leaf Village's sage chakra
  fossil_amber: 'shinobi',     // tree resin from the Leaf Village woods
  old_compass: 'seas',         // the Log Pose: the Grand Line's compass
  FRUIT: 'seas',               // Devil Fruits are One Piece's
};
for (const id in ITEMS) if (/^seed_/.test(id)) HOME_OVERRIDE[id] = 'ki';   // Farming lives on Kaio Planet
const ITEM_HOME = {};
function computeHomes() {
  const votes = {}, first = {}, vote = (id, r, w) => { if (!r || r === 'rift') return; (votes[id] = votes[id] || {})[r] = (votes[id][r] || 0) + w; if (!first[id]) first[id] = r; };
  const gathered = {};
  for (const k in SKILLS) if (SKILLS[k].type !== 'craft') for (const a of SKILLS[k].actions || []) for (const o in a.out || {}) gathered[o] = gathered[o] || SKILLS[k].realm;
  for (const z of ZONES) for (const e of z.enemies) for (const [d] of e.drops) vote(d, z.realm, 1);
  for (const k in RARE_FINDS) if (SKILLS[k]) for (const [d] of RARE_FINDS[k]) vote(d, SKILLS[k].realm, 0.5);
  for (const k in SKILLS) for (const a of SKILLS[k].actions || []) for (const [d] of a.extra || []) vote(d, SKILLS[k].realm, 0.5);
  for (const id in ITEMS) {
    const v = votes[id];
    ITEM_HOME[id] = HOME_OVERRIDE[id] || ITEMS[id].relic || gathered[id] || (v ? Object.keys(v).sort((a, b) => v[b] - v[a])[0] : null);
  }
  ITEM_HOME.FRUIT = 'seas';
}
const homeOf = (id) => (id === 'FRUIT' ? 'seas' : ITEM_HOME[id]);
const inWorld = (id, realm) => !realm || realm === 'rift' || WORLD_NEUTRAL.has(id) || !homeOf(id) || homeOf(id) === realm;
const WORLD_LOCK_CUT = [];   // what the lock removed (dev checks read it)
function worldLock() {
  computeHomes();
  const keep = (list, realm, where) => {
    for (let i = list.length - 1; i >= 0; i--) if (!inWorld(list[i][0], realm)) { WORLD_LOCK_CUT.push([list[i][0], where]); list.splice(i, 1); }
  };
  for (const z of ZONES) for (const e of z.enemies) keep(e.drops, z.realm, e.name);
  for (const k in RARE_FINDS) if (SKILLS[k]) keep(RARE_FINDS[k], SKILLS[k].realm, 'find:' + k);
  for (const k in SKILLS) for (const a of SKILLS[k].actions || []) {
    if (a.extra) keep(a.extra, SKILLS[k].realm, k + ':' + a.id);
    if (a.loot) for (const t in a.loot) if (Array.isArray(a.loot[t])) keep(a.loot[t], SKILLS[k].realm, 'haul:' + a.id);
  }
  // A chest holds its own world's things (a chest's world is where it is found).
  for (const id in ITEMS) if (ITEMS[id].type === 'chest' && ITEMS[id].loot) keep(ITEMS[id].loot, homeOf(id), id);
}
worldLock();
computeRarity();

/* ------------------------------------------------------------ drop rate pass */
// Balance pass (2026-11-23): an Epic or Legendary drop must be an event. The rates above were set one by one
// and, with Luck, Elites and boss farming, a player saw ~100 Epic+ drops an hour. Now the item's rarity caps
// its chance per try, by kind of try. A regular foe dies every ~10 s, a boss every ~30-60 s, a ship brings one
// haul a minute, a skill action takes ~3-6 s:
//   Rare (3★) ~ a few an hour · Epic (4★) ~ one every hour or two · Legendary (5★) ~ one a day or two.
// Progression items are never capped: world relics, gate offerings, schematics (learned once) and pets.
const RATE_CAP = {
  foe:  [1, 1, 1, 1 / 150, 1 / 1500, 1 / 12000],
  boss: [1, 1, 1, 1 / 10,  1 / 300,  1 / 3000],
  haul: [1, 1, 1, 1 / 100, 1 / 900,  1 / 9000],
  find: [1, 1, 1, 1 / 300, 1 / 4000, 1 / 40000],
};
const OFFERED = new Set(Object.values(GATES).flatMap((g) => Object.keys(g.offer)));
function capRates() {
  const cap = (list, kind) => {
    for (const d of list) {
      const id = d[0], it = ITEMS[id];
      if (id === 'GEM' || (it && (it.relic || it.type === 'schematic' || OFFERED.has(id)))) continue;
      const r = id === 'FRUIT' ? 5 : it ? it.rarity : 0;
      if (r >= 3) d[1] = Math.min(d[1], RATE_CAP[kind][r]);
    }
  };
  for (const z of ZONES) for (const e of z.enemies) cap(e.drops, z.boss ? 'boss' : 'foe');
  for (const a of SKILLS.voyaging.actions) cap(a.loot.rare, 'haul');
  for (const k in RARE_FINDS) cap(RARE_FINDS[k], 'find');
  cap(GLOBAL_RARE, 'find');
  // Chests are the jackpot rolls: a Devil Fruit stays a long shot inside them too.
  for (const id in ITEMS) if (ITEMS[id].type === 'chest') for (const l of ITEMS[id].loot) if (l[0] === 'FRUIT') l[1] = Math.min(l[1], 0.3);
  for (const p of PETS) if (p.chance) p.chance = Math.min(p.chance, 1 / 150);
}
capRates();
