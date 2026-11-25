'use strict';
/* ==========================================================================
   ANIME IDLE RPG — skill depth (DOM-free). Loaded after armory.js, before loot.js.
   Design: docs/SKILL-DEPTH.md. Every skill should keep surprising you as it levels:
   1. SKILL_PERKS: five named perks per skill (Lv 15, 35, 55, 70, 90), between the generic
      milestones (10, 25, 50, 75, 99). game.js applies them (perk()), world files read the
      mechanic ones (vein, forge, trophies, breakthroughs, giant crops, grades, scent, flawless).
   2. By-products: every gathering skill leaves something extra that feeds another skill.
   3. New nodes and recipes in the gaps (trees, fish, ores, ingots, alloys, dishes, routes, tools Mk IV).
   4. Tonics (Crafting): drunk from the Bank, they give what meals do not (double output,
      free crafts, more by-products).
   Wave 1 = Leaf Village, Orange Town, Soul City content + every skill's perks.
   Gear stats, values and recipes come from economy.js like every other piece.
   Each new item carries its fallback glyph and colour (icons.js) until its painted icon exists.
   ========================================================================== */

const DEPTH_ITEMS = [];   // new item ids, in brief order (the icon brief and the checks read it)
const dItem = (id, name, emoji, value, extra, g, c) => {
  defItem(id, name, emoji, value, Object.assign({ glyph: g, color: c }, extra || {}));
  DEPTH_ITEMS.push(id);
};

/* ================================================================ 1. skill perks */
// fx keys: speed · dbl (double chance) · xp · rare (× rare finds) · keep (chance a craft uses no
// materials) · extra (× by-products) · up (chance to also get the next node's resource) · ship
// (+ ships) · grow (crop growth) · and the mechanic ones read by world files: lode, heat, white,
// kg, limit, giant, mutate, grade, scent, shiny, flawless.
const SKILL_PERKS = {};
{
  const P = (skill, ...list) => { SKILL_PERKS[skill] = list.map(([lv, name, desc, fx]) => ({ lv, name, desc, fx })); };
  P('woodcutting',
    [15, 'Clean Cut', '+6% chance to fell two logs', { dbl: 0.06 }],
    [35, 'Sap Tapper', 'By-products ×1.6 (Chakra Sap and the forest floor)', { extra: 0.6 }],
    [55, 'Forest Stride', '+10% Woodcutting speed', { speed: 0.1 }],
    [70, 'Amber Eye', 'Rare finds ×1.5 (amber, nests, pouches)', { rare: 0.5 }],
    [90, 'Root of the World', '4% chance per chop to also get a log of the next tree up', { up: 0.04 }]);
  P('arts',
    [15, 'Steady Hands', '+6% Crafting speed', { speed: 0.06 }],
    [35, 'Thrifty Hands', '5% chance a craft uses no materials', { keep: 0.05 }],
    [55, 'Batch Work', '+8% chance to craft two', { dbl: 0.08 }],
    [70, "Artisan's Eye", '+12% Crafting XP', { xp: 0.12 }],
    [90, 'Living Legacy', '+8% more chance a craft uses no materials', { keep: 0.08 }]);
  P('fishing',
    [15, 'Patient Line', '+6% Fishing speed', { speed: 0.06 }],
    [35, 'Net Mender', 'By-catch ×1.5 (Fish Oil and seasonings)', { extra: 0.5 }],
    [55, 'Trophy Waters', 'Every fish comes out 15% heavier (more trophies)', { kg: 0.15 }],
    [70, 'Deep Waters', '+8% chance to land two fish', { dbl: 0.08 }],
    [90, 'Lord of the Deep', '4% chance per catch to also land a fish of the next spot up', { up: 0.04 }]);
  P('cooking',
    [15, 'Hot Pan', '+6% Cooking speed', { speed: 0.06 }],
    [35, 'Spice Saver', '6% chance a dish uses no ingredients', { keep: 0.06 }],
    [55, 'Double Batch', '+8% chance to cook two', { dbl: 0.08 }],
    [70, "Chef's Instinct", '+12% Cooking XP', { xp: 0.12 }],
    [90, 'Allsea', '+8% more chance a dish uses no ingredients', { keep: 0.08 }]);
  P('voyaging',
    [15, 'Light Hull', '+8% hauls on every voyage', { speed: 0.08 }],
    [35, 'Lucky Charts', 'Voyage rare finds ×1.4', { rare: 0.4 }],
    [55, 'Trade Winds', '+12% Voyaging XP', { xp: 0.12 }],
    [70, 'Third Ship', 'One more ship at sea', { ship: 1 }],
    [90, 'Grand Current Legend', '+15% hauls on every voyage', { speed: 0.15 }]);
  P('mining',
    [15, 'Steady Pick', '+6% Reishi Mining speed', { speed: 0.06 }],
    [35, 'Rock Reader', 'By-products ×1.6 (Reishi Dust)', { extra: 0.6 }],
    [55, 'Lode Sense', 'Mother Lodes crack open twice as often', { lode: 1 }],
    [70, 'Deep Seam', '+8% chance to mine two ores', { dbl: 0.08 }],
    [90, 'Heart of the Mountain', '4% chance per ore to also get an ore of the next vein up', { up: 0.04 }]);
  P('smithing',
    [15, 'Bellows', 'The forge heats up 50% faster', { heat: 0.5 }],
    [35, 'Flux Master', '6% chance a smelt uses no ore', { keep: 0.06 }],
    [55, 'White Flame', 'White Heat lasts 3 more smelts', { white: 3 }],
    [70, 'Twin Mold', '+8% chance to smelt two', { dbl: 0.08 }],
    [90, 'Soul Forge', '+8% more chance a smelt uses no ore', { keep: 0.08 }]);
  P('gravity',
    [15, 'Iron Will', '+6% Gravity Training speed', { speed: 0.06 }],
    [35, 'Heavy Breath', '+8% chance to gather two', { dbl: 0.08 }],
    [55, "Master Kai's Lesson", '+12% Gravity Training XP', { xp: 0.12 }],
    [70, 'Rebound', 'Every breakthrough is worth 25% more', { limit: 0.25 }],
    [90, 'Limit Breaker', 'Every breakthrough is worth 25% more again', { limit: 0.25 }]);
  P('farming',
    [15, 'Green Thumb', 'Crops grow 10% faster', { grow: 0.1 }],
    [35, 'Bumper Crop', '+10% chance of a double harvest', { dbl: 0.1 }],
    [55, "Giant's Garden", 'Giant crops ×1.5', { giant: 0.5 }],
    [70, 'Seed Keeper', 'Mutations ×1.5', { mutate: 0.5 }],
    [90, 'Eternal Harvest', 'Crops grow 15% faster', { grow: 0.15 }]);
  P('exorcism',
    [15, 'Sharp Eyes', '+6% Cursed Research speed', { speed: 0.06 }],
    [35, 'Grade Reader', 'Grade 2, Grade 1 and Special Grade curses ×1.4', { grade: 0.4 }],
    [55, 'Binding Study', '+8% chance to gather two', { dbl: 0.08 }],
    [70, 'Domain Scholar', '+12% Cursed Research XP', { xp: 0.12 }],
    [90, 'Clearsight', 'High-grade curses ×1.6 more', { grade: 0.6 }]);
  P('tracking',
    [15, 'Light Step', '+6% Hunting speed', { speed: 0.06 }],
    [35, 'Strong Scent', 'The scent builds 50% faster (Prime Prey sooner)', { scent: 0.5 }],
    [55, 'Trap Saver', '10% chance a hunt uses no trap', { keep: 0.1 }],
    [70, 'Beast Sense', 'Shiny beasts ×1.5', { shiny: 0.5 }],
    [90, "Hunter's License", 'Hunting rare finds ×1.5', { rare: 0.5 }]);
  P('archaeology',
    [15, 'Fine Brush', '+6% Archaeology speed', { speed: 0.06 }],
    [35, 'Layer Reader', '+8% chance to dig up two', { dbl: 0.08 }],
    [55, 'Field Notes', '+12% Archaeology XP', { xp: 0.12 }],
    [70, 'Relic Sense', 'Archaeology rare finds ×1.5', { rare: 0.5 }],
    [90, 'Lost Civilisation', '4% chance per dig to also find a fragment of the next site up', { up: 0.04 }]);
  P('restoration',
    [15, 'Gentle Hands', '+6% Restoration speed', { speed: 0.06 }],
    [35, 'Spare Parts', '6% chance a restoration uses no materials', { keep: 0.06 }],
    [55, 'Steady Glue', '+8% chance of a Flawless restoration', { flawless: 0.08 }],
    [70, "Restorer's Eye", '+12% Restoration XP', { xp: 0.12 }],
    [90, 'Living History', '+10% more chance of a Flawless restoration', { flawless: 0.1 }]);
  P('bonding',
    [15, 'Calm Mind', '+6% Echo Bonding speed', { speed: 0.06 }],
    [35, 'Echo Voice', '+12% Echo Bonding XP', { xp: 0.12 }],
    [55, 'Deep Bond', '+10% Echo Bonding speed', { speed: 0.1 }],
    [70, 'Resonance', 'Echo Bonding rare finds ×1.5', { rare: 0.5 }],
    [90, 'Two Souls', '+15% Echo Bonding XP', { xp: 0.15 }]);
}

/* ================================================================ 2-3. Leaf Village */
// Woodcutting: Chakra Sap on every tree, Fossil Amber as a rare find, two new trees.
dItem('chakra_sap', 'Chakra Sap', '🍯', 6, { desc: 'Sap that soaked up the forest\'s chakra. Every tree weeps a little of it. Tonics, lacquer and pendants.' }, 'pill-drop', '#f0b84a');
dItem('fossil_amber', 'Fossil Amber', '🟠', 500, { desc: 'Resin hardened over a thousand years, sometimes with a leaf still inside. A rare find in any tree.' }, 'topaz', '#ff9a2a');
dItem('living_wood', 'Living Wood Log', '🪵', 60, { desc: 'Wood from a tree grown by a wood-release jutsu. It still creaks and shifts after it is cut.' }, 'plant-roots', '#7fbf5a');
dItem('divine_root', 'Divine Tree Root', '🌳', 260, { desc: 'A root of the tree that once drank the whole world\'s chakra. Each one hums.' }, 'plant-roots', '#c8a0ff');
for (const a of SKILLS.woodcutting.actions) a.extra = (a.extra || []).concat([['chakra_sap', 0.06, [1, 2]]]);
SKILLS.woodcutting.actions.push(
  Object.assign(gather('living_wood', 52, 5.3), { extra: [['spirit_orchid', 0.2, [1, 2]], ['nature_essence', 0.08, [1, 1]], ['chakra_sap', 0.08, [1, 2]]] }),
  Object.assign(gather('divine_root', 95, 8), { extra: [['world_tree_leaf', 0.3, [1, 2]], ['sage_chakra', 0.08, [1, 1]], ['chakra_sap', 0.12, [1, 3]]] }),
);
SKILLS.woodcutting.actions.sort((a, b) => a.level - b.level);
RARE_FINDS.woodcutting.push(['fossil_amber', 1 / 40]);
// Their carvings (trade goods, expedition cargo), like every other tree
for (const [id, name, log] of [['living_idol', 'Living Wood Idol', 'living_wood'], ['divine_relief', 'Divine Root Relief', 'divine_root']]) {
  const tree = SKILLS.woodcutting.actions.find((a) => a.id === log);
  defItem(id, name, '🪵', Math.round(ITEMS[log].value * 1.6), { type: 'trade', glyph: 'puppet', color: ITEMS[log].color,
    desc: `Carved from ${ITEMS[log].name}. A trade good: ships take it as cargo and sell it abroad for 3× its value.` });
  CARVINGS.push([id, name, log]);
  DEPTH_ITEMS.push(id);
  SKILLS.arts.actions.push(craft(id, tree.level, tree.time, { [log]: 1 }));
}

// Crafting: tonics (drunk from the Bank, a timed buff like a meal) — what meals do not give.
//   dbl: double output on every skill · keep: crafts use no materials · extra: by-products ×
{
  const T = [
    ['abundance', 'Abundance Tonic', 'dbl', [0.05, 0.10, 0.15], 'clover', '#5fd07a', 'Every action has a better chance to give twice.'],
    ['thrift', 'Thrift Tonic', 'keep', [0.06, 0.12, 0.18], 'recycle', '#5ab8ff', 'Crafts, dishes and smelts sometimes use no materials.'],
    ['forager', "Forager's Tonic", 'extra', [0.3, 0.6, 1.0], 'herbs-bundle', '#ffbf2e', 'By-products (sap, oil, dust, herbs, by-catch) come more often.'],
  ];
  const MINS = [20, 30, 40], LV = [12, 42, 74], VAL = [30, 120, 400], ROMAN = ['I', 'II', 'III'];
  const INPUTS = {
    abundance: [{ healing_leaf: 4, chakra_sap: 2 }, { sage_lotus: 2, chakra_sap: 3, fish_oil: 2 }, { dragon_moss: 2, chakra_sap: 4, ki_core: 2 }],
    thrift:    [{ moonpetal: 3, chakra_sap: 2 }, { shadowroot: 3, chakra_sap: 3, reishi_dust: 2 }, { spirit_orchid: 2, reishi_dust: 4, ki_orb: 3 }],
    forager:   [{ cloud_fern: 3, chakra_sap: 2 }, { sage_lotus: 2, fish_oil: 3, reishi_dust: 1 }, { dragon_moss: 2, fish_oil: 4, moon_rice: 3 }],
  };
  // fish_oil and reishi_dust are defined below; the recipes only need their ids.
  T.forEach(([k, name, stat, vals, g, c, what]) => vals.forEach((v, i) => {
    const id = `${k}_tonic_${i + 1}`;
    dItem(id, `${name} ${ROMAN[i]}`, '🧪', VAL[i], { type: 'tonic', buff: { stat, val: v, mins: MINS[i] }, desc: what + ' Drink it from the Bank.' }, g, c);
  }));
  // recipes are added once every ingredient exists (end of this file)
  var TONIC_RECIPES = () => T.forEach(([k]) => [0, 1, 2].forEach((i) => SKILLS.arts.actions.push(craft(`${k}_tonic_${i + 1}`, LV[i], 3 + i, INPUTS[k][i], 2))));
}

/* ================================================================ Orange Town */
// Fishing: Fish Oil from every catch, two new fish.
dItem('fish_oil', 'Fish Oil', '🫙', 5, { desc: 'Rendered from the catch. Lamps, tempura, tonics and harpoon grease.' }, 'pill-drop', '#e8c860');
dItem('thunder_catfish', 'Thunder Catfish', '🐟', 22, { desc: 'A whiskered catfish that stores lightning in its belly. It shocks the line.' }, 'flying-trout', '#ffd23f');
dItem('coral_dragonet', 'Coral Dragonet', '🐉', 110, { desc: 'A tiny sea dragon that lives in the reefs off the edge of the world. Worth a fortune at any port.' }, 'sea-dragon', '#ff6f9a');
for (const a of SKILLS.fishing.actions) a.extra = (a.extra || []).concat([['fish_oil', 0.06, [1, 2]]]);
SKILLS.fishing.actions.push(gather('thunder_catfish', 38, 4.7), gather('coral_dragonet', 78, 6.5));
SKILLS.fishing.actions.sort((a, b) => a.level - b.level);

// Cooking: the 30 → 58 gap, and a use for the oil.
dItem('catfish_hotpot', 'Thunder Catfish Hotpot', '🍲', 60, { type: 'food', heal: 170 }, 'cooking-pot', '#ffd23f');
dItem('oil_tempura', 'Fish-Oil Tempura', '🍤', 95, { type: 'food', heal: 270 }, 'fish-cooked', '#f2c46a');
dItem('dragonet_sashimi', 'Coral Dragonet Sashimi', '🍣', 260, { type: 'food', heal: 560 }, 'sushis', '#ff6f9a');
SKILLS.cooking.actions.push(
  craft('catfish_hotpot', 40, 4, { thunder_catfish: 1 }),
  craft('oil_tempura', 52, 4.5, { tidal_eel: 1, fish_oil: 2 }),
  craft('dragonet_sashimi', 80, 6, { coral_dragonet: 1 }),
);
SKILLS.cooking.actions.sort((a, b) => a.level - b.level);

// Voyaging: a route in the 38 → 55 gap and one after 82.
SKILLS.voyaging.actions.push(
  voyage('fishman', 'Merfolk Isle', '🧜', 46, 18, { catfish_hotpot: 2, ironwood: 2 },
    { gold: [400, 900], table: [['thunder_catfish', [1, 3]], ['tidal_eel', [1, 3]]], rare: [['tide_pearl', 1 / 20], ['leviathan_scale', 1 / 60], ['FRUIT', 1 / 150]] }),
  voyage('final_island', 'The Final Island', '🏝️', 95, 30, { dragonet_sashimi: 2, heartwood: 2 },
    { gold: [4000, 9000], table: [['coral_dragonet', [1, 3]], ['sea_king', [1, 2]]], rare: [['tide_heart', 1 / 60], ['allblue_tuna', 1 / 30], ['FRUIT', 1 / 40]] }),
);
SKILLS.voyaging.actions.sort((a, b) => a.level - b.level);

/* ================================================================ Soul City */
// Reishi Mining: Reishi Dust from every ore, two new ores.
dItem('reishi_dust', 'Reishi Dust', '✨', 5, { desc: 'Spirit particles knocked loose with every ore. Flux for alloys, a base for tonics.' }, 'sparkles', '#bfe0ff');
dItem('sekki_stone', 'Hushstone', '🪨', 26, { desc: 'Grey stone that swallows spiritual pressure. The walls of the old training grounds were built from it.' }, 'stone-block', '#8a8f9a');
dItem('kido_quartz', 'Spellcraft Quartz', '💎', 115, { desc: 'Quartz that formed around a spell nobody finished. It glows when you say its number.' }, 'crystal-cluster', '#7fe0ff');
for (const a of SKILLS.mining.actions) a.extra = (a.extra || []).concat([['reishi_dust', 0.07, [1, 2]]]);
SKILLS.mining.actions.push(gather('sekki_stone', 38, 4.7), gather('kido_quartz', 80, 6.5));
SKILLS.mining.actions.sort((a, b) => a.level - b.level);

// Smelting: two ingots and the first alloys (two ingots + dust).
dItem('sekki_ingot', 'Hushstone Ingot', '🟫', 60, { ingot: true, desc: 'Smelted Hushstone. Armour made of it shrugs off spiritual pressure.' }, 'metal-bar', '#8a8f9a');
dItem('kido_ingot', 'Spellcraft Ingot', '🟫', 280, { ingot: true, desc: 'Smelted Spellcraft Quartz. It holds a spell the way a bell holds a note.' }, 'metal-bar', '#7fe0ff');
dItem('frostvoid_alloy', 'Frostvoid Alloy', '🟪', 140, { desc: 'Frost and void ingots folded together with reishi dust. Cold that eats light.' }, 'metal-bar', '#9a8cff');
dItem('sunstar_alloy', 'Sunstar Alloy', '🟨', 520, { desc: 'Starsteel and sun ingots fused in a white-hot forge. It never cools all the way.' }, 'metal-bar', '#ffcf4a');
INGOT_OF.sekki_stone = 'sekki_ingot';
INGOT_OF.kido_quartz = 'kido_ingot';
SKILLS.smithing.actions.push(
  craft('sekki_ingot', 40, 4.7, { sekki_stone: 2, mistwood: 1 }),
  craft('frostvoid_alloy', 50, 5.5, { frost_ingot: 1, void_ingot: 1, reishi_dust: 3 }),
  craft('sunstar_alloy', 76, 6.5, { star_ingot: 1, sun_ingot: 1, reishi_dust: 4 }),
  craft('kido_ingot', 82, 6.5, { kido_quartz: 2, spirit_oak: 1 }),
);
SKILLS.smithing.actions.sort((a, b) => a.level - b.level);

/* ================================================================ gear (stats in economy.js) */
{
  const A = (id, name, emoji, slot, perks, x) => dItem(id, name, emoji, 100,
    Object.assign(eq(slot, Object.assign({}, perks)), { lore: x.lore }, x.fam ? { fam: x.fam } : {}), x.g, x.c);
  A('amber_pendant', 'Amber Pendant', '📿', 'accessory', { rare: 0.06 },
    { g: 'gem-pendant', c: '#ff9a2a', lore: 'A drop of fossil amber on a sap-lacquered cord. Lucky things seem to find whoever wears it.' });
  A('thunder_harpoon', 'Thunder Harpoon', '🔱', 'weapon', { tag_lightning: 0.2 },
    { fam: 'ranged', g: 'barbed-spear', c: '#ffd23f', lore: 'A whaler\'s harpoon greased with fish oil and tipped with a catfish\'s spark. It hits before it lands.' });
  A('sekki_bracers', 'Hushstone Bracers', '🛡️', 'accessory', { guard: 0.06 },
    { g: 'mailed-fist', c: '#8a8f9a', lore: 'Bracers cast from Hushstone ingots. Spiritual pressure slides off them like rain.' });
  A('living_wood_mail', 'Living Wood Mail', '🌿', 'armor', { regen: 0.006 },
    { g: 'leather-armor', c: '#7fbf5a', lore: 'Plates of living wood that keep growing. Cut them and they close by morning.' });
  A('frostvoid_scythe', 'Frostvoid Scythe', '⚔️', 'weapon', { exec: 0.15 },
    { fam: 'heavy', g: 'reaper-scythe', c: '#9a8cff', lore: 'A blade of frostvoid alloy. Its edge is so cold the wounds go dark.' });
  A('sunstar_plate', 'Sunstar Plate', '🛡️', 'armor', { thorns: 0.15, guard: 0.06 },
    { g: 'chest-armor', c: '#ffcf4a', lore: 'Armour that still glows from the forge. Whatever strikes it gets burned.' });
  A('kido_focus', 'Spellcraft Focus Staff', '🪄', 'weapon', { tech: 0.1, cdr: 0.08 },
    { fam: 'blade', g: 'skull-staff', c: '#7fe0ff', lore: 'A staff with a Spellcraft ingot at its head. Spells cast through it skip half their incantation.' });
  A('divine_bow', 'Divine Root Longbow', '🏹', 'weapon', { first: 1, crit: 0.06 },
    { g: 'bow-arrow', c: '#c8a0ff', lore: 'A bow bent from a divine root and strung with sunstar wire. The first arrow decides the fight.' });
  // Crafted placeholders: economy.js sets level, time, XP and ingredients from the stage. The levels
  // here only match it, because loot.js reads them for the rarity before economy.js runs.
  const made = { amber_pendant: 42, thunder_harpoon: 54, sekki_bracers: 66, living_wood_mail: 67, frostvoid_scythe: 71, sunstar_plate: 86, kido_focus: 89, divine_bow: 95 };
  for (const id in made) SKILLS.arts.actions.push(craft(id, made[id], 5, {}));
}

/* ================================================================ tools Mk IV */
{
  const tool = (sk, name, lv, inp, c) => {
    dItem(`tool_${sk}_4`, `${name} Mk IV`, '🔧', 1200, { type: 'tool', toolFor: sk, tier: 4 }, 'cog', c);
    SKILLS.arts.actions.push(craft(`tool_${sk}_4`, lv, 9, inp));
  };
  tool('woodcutting', 'Chakra Saw', 92, { divine_root: 20, chakra_sap: 30, ki_star: 12 }, '#c8a0ff');
  tool('fishing', 'Sonar Rod', 92, { coral_dragonet: 20, fish_oil: 30, ki_star: 12 }, '#ff6f9a');
  tool('mining', 'Ki Drill', 93, { kido_ingot: 15, reishi_dust: 30, ki_nova: 15 }, '#7fe0ff');
}

TONIC_RECIPES();
SKILLS.arts.actions.sort((a, b) => a.level - b.level);
