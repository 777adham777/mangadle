'use strict';
/* ==========================================================================
   TRI-REALM IDLE — loot pass (loaded after worlds.js, before icons.js)
   - every world has a treasure chest, drop-only gear with a utility perk, and a
     very rare Rift Shard on its guardian
   - rarity (1 Common … 5 Legendary) comes from how hard an item is to get, not its price
   - drop-only gear can be salvaged into its world's relics, so old loot keeps a use
   ========================================================================== */

/* ------------------------------------------------- treasure for worlds 4-7 */
// Chests: rare finds of the world's gathering skill + drops on its foes. 'GEM' = random gem, 'FRUIT' = random fruit.
defItem('capsule_crate', 'Capsule Crate', '🧰', 3000, chest([2000, 6000], [
  ['ki_orb', 30, [3, 8]], ['ki_core', 22, [2, 5]], ['seed_fire_pepper', 12, [1, 3]], ['GEM', 10, [1, 1]], ['seed_frost_melon', 8, [1, 2]],
  ['gravity_plate', 8, [1, 1]], ['warrior_sash', 4, [1, 1]], ['seed_star_fruit', 2, [1, 1]], ['FRUIT', 0.3, [1, 1]]]));
defItem('cursed_box', 'Cursed Box', '🧰', 6000, chest([5000, 12000], [
  ['hex_residue', 30, [3, 8]], ['hex_shade', 20, [2, 5]], ['hex_core', 14, [1, 3]], ['GEM', 12, [1, 1]], ['bound_talisman', 8, [1, 1]],
  ['veil_shard', 5, [1, 1]], ['sigil_luck', 1, [1, 1]], ['FRUIT', 0.3, [1, 1]]]));
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
defItem('battle_scouter',   'Battle Scouter',        '⚙️', 15000,  eq('accessory', { atk: 70, def: 35, hp: 380, rare: 0.06 }));
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

/* ---------------------------------------------------------------- salvage */
// Drop-only gear (never crafted) can be broken down into the relics of the world it comes from.
// Higher rarity gives more. Crafted gear is not salvageable: it would turn cheap materials into relics.
const SALVAGE_N = [0, 1, 1, 1, 2, 4];
function computeSalvage() {
  const realmOf = {};
  for (const z of ZONES) for (const e of z.enemies) for (const [t] of e.drops) if (!realmOf[t]) realmOf[t] = z.realm;
  for (const a of SKILLS.voyaging.actions) for (const [t] of a.loot.rare) if (!realmOf[t]) realmOf[t] = 'seas';
  for (const id in ITEMS) {
    const it = ITEMS[id];
    if (it.type !== 'equip' || CRAFTED[id]) continue;
    const realm = realmOf[id];
    const relics = Object.keys(ITEMS).filter((k) => ITEMS[k].relic === realm).sort((a, b) => ITEMS[a].value - ITEMS[b].value);
    if (!relics.length) continue;   // Rift gear: nothing to break it into
    const give = { [relics[0]]: SALVAGE_N[it.rarity] };
    if (it.rarity >= 5 && relics[1]) give[relics[1]] = 1;
    it.salvage = give;
  }
}
computeRarity();
computeSalvage();
