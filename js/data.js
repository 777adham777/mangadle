'use strict';
/* ==========================================================================
   TRI-REALM IDLE — static game data
   Three worlds collided: the Shinobi Lands, the Soul Afterlands, the Endless Blue.
   ========================================================================== */

const REALMS = {
  shinobi: { name: 'Shinobi Lands',   icon: '🍃', color: '#ff7a1a', tagline: 'Hidden villages, chakra and cold steel.' },
  soul:    { name: 'Soul Afterlands', icon: '🌙', color: '#9b6bff', tagline: 'Spirit blades, masked husks and restless souls.' },
  seas:    { name: 'Endless Blue',    icon: '⚓', color: '#14a8ff', tagline: 'Pirates, bounties and cursed fruit.' },
};

/* ------------------------------------------------------------------ items */
// type: res (material) · food · equip · fruit · gem · chest (openable)
const ITEMS = {};
function defItem(id, name, icon, value, extra) {
  ITEMS[id] = Object.assign({ id, name, icon, value, type: 'res' }, extra || {});
}

// Shinobi — herbs
defItem('healing_leaf',    'Healing Leaf',     '🌿', 2);
defItem('moonpetal',       'Moonpetal',        '🌸', 5);
defItem('cloud_fern',      'Cloud Fern',       '🌾', 9);
defItem('shadowroot',      'Shadowroot',       '🥀', 14);
defItem('sage_lotus',      'Sage Lotus',       '🪷', 24);
defItem('spirit_orchid',   'Spirit Orchid',    '🌺', 40);
defItem('dragon_moss',     'Dragon Moss',      '🍀', 60);
defItem('world_tree_leaf', 'World Tree Leaf',  '🍁', 120);
// Shinobi — chakra
defItem('chakra_shard',    'Chakra Shard',     '🔹', 3);
defItem('chakra_orb',      'Chakra Orb',       '🔷', 9);
defItem('storm_chakra',    'Storm Chakra',     '🌩️', 20);
defItem('nature_essence',  'Nature Essence',   '💠', 32);
defItem('beast_ember',     'Beast Ember',      '🔥', 65);
defItem('lightning_core',  'Lightning Core',   '⚡', 95);
defItem('sage_chakra',     'Sage Chakra',      '☯️', 140);
// Soul — harvest
defItem('soul_fragment',   'Soul Fragment',    '✨', 3);
defItem('wisp_flame',      'Wisp Flame',       '🕯️', 6);
defItem('spirit_core',     'Spirit Core',      '🔮', 12);
defItem('husk_mask',       'Husk Mask Shard',  '🎭', 26);
defItem('grave_dust',      'Grave Dust',       '🪦', 40);
defItem('abyssal_essence', 'Abyssal Essence',  '🌑', 65);
defItem('phantom_silk',    'Phantom Silk',     '🕸️', 95);
defItem('echo_soul',       'Echoing Soul',     '🎐', 140);
// Soul — mining
defItem('spirit_ore',      'Spirit Ore',       '🪨', 2);
defItem('silver_reishi',   'Silver Reishi',    '⚪', 7);
defItem('frost_crystal',   'Frost Crystal',    '🧊', 12);
defItem('void_stone',      'Void Stone',       '⬛', 20);
defItem('black_iron',      'Black Iron',       '⚫', 32);
defItem('starsteel',       'Starsteel',        '🌟', 48);
defItem('sunstone',        'Sunstone',         '🔶', 80);
defItem('rift_ore',        'Rift Ore',         '🟪', 150);
// Seas — fish
defItem('minnow',          'Minnow',           '🐟', 2);
defItem('reef_bass',       'Reef Bass',        '🐠', 6);
defItem('sea_crab',        'Sea Crab',         '🦀', 10);
defItem('blue_marlin',     'Blue Marlin',      '🐡', 16);
defItem('tidal_eel',       'Tidal Eel',        '🐍', 30);
defItem('giant_octopus',   'Giant Octopus',    '🐙', 48);
defItem('abyss_angler',    'Abyss Angler',     '🦑', 75);
defItem('sea_king',        'Sea King',         '🐲', 160);
// Multiverse
defItem('rift_shard',      'Rift Shard',       '🔱', 2500);

// Gems — rare finds while mining, and inside chests. Used for jewelry.
defItem('jade',            'Jade',             '💚', 40,  { type: 'gem' });
defItem('sapphire',        'Sea Sapphire',     '💙', 90,  { type: 'gem' });
defItem('ruby',            'Blood Ruby',       '❤️', 180, { type: 'gem' });
defItem('void_diamond',    'Void Diamond',     '💎', 450, { type: 'gem' });

// Food (heal is scaled by your HP multiplier)
const food = (heal) => ({ type: 'food', heal });
defItem('grilled_minnow',  'Grilled Minnow',   '🍢', 4,   food(20));
defItem('bass_stew',       'Reef Bass Stew',   '🍲', 12,  food(50));
defItem('crab_dumplings',  'Crab Dumplings',   '🥟', 20,  food(75));
defItem('spirit_ramen',    'Spirit Ramen',     '🍜', 28,  food(95));
defItem('marlin_steak',    'Marlin Steak',     '🥩', 35,  food(120));
defItem('eel_bowl',        'Grilled Eel Bowl', '🍱', 65,  food(220));
defItem('takoyaki',        'Takoyaki',         '🍡', 100, food(320));
defItem('angler_feast',    'Angler Feast',     '🍖', 150, food(440));
defItem('sea_king_curry',  'Sea King Curry',   '🍛', 320, food(700));
defItem('soldier_pill',    'Soldier Pill',     '💊', 8,   food(40));
defItem('sage_pill',       'Sage Pill',        '🟢', 80,  food(280));
defItem('storm_pill',      'Storm Pill',       '🟣', 200, food(520));

// Equipment
const eq = (slot, stats) => ({ type: 'equip', slot, stats });
// crafted weapons
defItem('iron_wakizashi',  'Iron Wakizashi',   '🔪', 15,    eq('weapon', { atk: 6 }));
defItem('spirit_katana',   'Spirit Katana',    '🗡️', 80,    eq('weapon', { atk: 15 }));
defItem('awakened_blade',  'Awakened Blade',   '⚔️', 300,   eq('weapon', { atk: 32 }));
defItem('black_warhammer', 'Black Iron Warhammer', '🔨', 600, eq('weapon', { atk: 45 }));
defItem('sovereign_blade', 'Sovereign Blade',  '🌙', 1000,  eq('weapon', { atk: 60 }));
defItem('sunforged_bow',   'Sunforged Bow',    '🏹', 2500,  eq('weapon', { atk: 85 }));
defItem('rift_cleaver',    'Rift Cleaver',     '🪓', 6000,  eq('weapon', { atk: 120 }));
// crafted armor
defItem('flak_vest',       'Flak Vest',        '🦺', 20,    eq('armor', { def: 6, hp: 20 }));
defItem('chakra_mesh',     'Chakra Mesh',      '🥋', 100,   eq('armor', { def: 14, hp: 60 }));
defItem('frost_garb',      'Frost Garb',       '🥼', 200,   eq('armor', { def: 20, hp: 100 }));
defItem('sage_robe',       'Sage Robe',        '👘', 350,   eq('armor', { def: 28, hp: 140 }));
defItem('beast_cloak',     'Beast Cloak',      '🧥', 1100,  eq('armor', { def: 50, hp: 280 }));
defItem('storm_mantle',    'Storm Mantle',     '🎽', 3000,  eq('armor', { def: 80, hp: 450 }));
// crafted accessories & jewelry
defItem('shinobi_headband','Shinobi Headband', '🎀', 40,    eq('accessory', { atk: 4, def: 4 }));
defItem('jade_amulet',     'Jade Amulet',      '🪬', 120,   eq('accessory', { atk: 5, hp: 50 }));
defItem('reishi_ring',     'Reishi Ring',      '💍', 150,   eq('accessory', { hp: 80, def: 6 }));
defItem('sapphire_charm',  'Sapphire Charm',   '🧿', 400,   eq('accessory', { def: 15, hp: 110 }));
defItem('ruby_crest',      'Ruby Crest',       '🏵️', 900,   eq('accessory', { atk: 30, hp: 120 }));
defItem('void_band',       'Void Diamond Band','💫', 3500,  eq('accessory', { atk: 45, def: 25, hp: 220 }));
// drop-only gear (see ZONES / chests for rates)
defItem('old_compass',     'Old Compass',      '🧭', 120,   eq('accessory', { atk: 2, def: 2, gold: 0.10 }));
defItem('sea_charm',       'Sea Charm',        '🐚', 400,   eq('accessory', { hp: 120, def: 10 }));
defItem('senbon',          'Senbon Needles',   '🥢', 90,    eq('weapon', { atk: 10 }));
defItem('puppet_plating',  'Puppet Plating',   '🪵', 110,   eq('armor', { def: 12, hp: 45 }));
defItem('wolf_fang',       'Wolf Fang Charm',  '🐾', 160,   eq('accessory', { atk: 9, hp: 30 }));
defItem('golem_heart',     'Golem Heart',      '🫀', 180,   eq('accessory', { def: 12, hp: 70 }));
defItem('fox_tail_charm',  'Fox Tail Charm',   '🦊', 900,   eq('accessory', { atk: 20, hp: 100 }));
defItem('husk_claw',       'Husk Claw',        '🦴', 350,   eq('weapon', { atk: 30 }));
defItem('reaper_scarf',    'Reaper Scarf',     '🧣', 400,   eq('accessory', { atk: 10, def: 10, hp: 60 }));
defItem('husk_carapace',   'Husk Carapace',    '🦂', 700,   eq('armor', { def: 40, hp: 200 }));
defItem('wraith_sickle',   'Wraith Sickle',    '🌘', 800,   eq('weapon', { atk: 48 }));
defItem('bone_lance',      'Bone Lance',       '🦯', 1200,  eq('weapon', { atk: 58 }));
defItem('prayer_beads',    'Prayer Beads',     '📿', 1100,  eq('accessory', { def: 20, hp: 150 }));
defItem('sovereign_mask',  'Sovereign Mask',   '👺', 2500,  eq('accessory', { atk: 40, def: 15, hp: 150 }));
defItem('sovereign_cloak', 'Sovereign Cloak',  '🦇', 2800,  eq('armor', { def: 70, hp: 400 }));
defItem('marine_coat',     'Marine Coat',      '👕', 2000,  eq('armor', { def: 55, hp: 300 }));
defItem('hand_cannon',     'Hand Cannon',      '💥', 2600,  eq('weapon', { atk: 80 }));
defItem('shark_tooth',     'Shark Tooth Necklace', '🦷', 2400, eq('accessory', { atk: 35, hp: 100 }));
defItem('leviathan_mail',  'Leviathan Scalemail', '🛡️', 6000, eq('armor', { def: 90, hp: 500 }));
defItem('corsair_cutlass', 'Corsair Cutlass',  '🪝', 6500,  eq('weapon', { atk: 100 }));
defItem('admiral_coat',    "Admiral's Greatcoat", '🪖', 12000, eq('armor', { def: 120, hp: 700 }));
defItem('storm_crown',     'Storm Crown',      '👑', 8000,  eq('accessory', { atk: 60, def: 30, hp: 300, gold: 0.25 }));
defItem('rift_eye',        'Eye of the Rift',  '🌌', 30000, eq('accessory', { atk: 90, def: 40, hp: 400 }));

// Abyss Fruits — eat one for a permanent power. Only one at a time. The sea hates you (-40% fishing speed).
const fr = (fx, desc) => ({ type: 'fruit', fx, desc });
defItem('ember_fruit',    'Ember Fruit',    '🍎', 5000, fr({ dmg: 0.30 },                 '+30% damage. Your strikes burn.'));
defItem('quake_fruit',    'Quake Fruit',    '🍇', 5000, fr({ dmg: 0.60, atkSpeed: 0.15 }, '+60% damage, attacks 15% slower.'));
defItem('mist_fruit',     'Mist Fruit',     '🫐', 5000, fr({ dodge: 0.20 },               '20% chance to dodge enemy attacks.'));
defItem('gilded_fruit',   'Gilded Fruit',   '🍋', 5000, fr({ gold: 0.75 },                '+75% gold from every source.'));
defItem('bloom_fruit',    'Bloom Fruit',    '🍈', 5000, fr({ skill: 0.20 },               '+20% speed on every skill.'));
defItem('colossus_fruit', 'Colossus Fruit', '🍉', 5000, fr({ hp: 0.50 },                  '+50% max HP.'));
const FRUITS = ['ember_fruit', 'quake_fruit', 'mist_fruit', 'gilded_fruit', 'bloom_fruit', 'colossus_fruit'];

// Chests — rare finds you open from the Hero page. loot: weighted [item, weight, [min,max]].
// 'FRUIT' = random Abyss Fruit, 'GEM' = random gem.
const chest = (gold, loot) => ({ type: 'chest', gold, loot });
defItem('herb_pouch',    "Wanderer's Pouch", '👛', 60, chest([20, 80], [
  ['healing_leaf', 30, [5, 15]], ['moonpetal', 25, [3, 8]], ['cloud_fern', 15, [2, 6]], ['soldier_pill', 12, [2, 5]],
  ['sage_lotus', 8, [1, 3]], ['jade', 6, [1, 1]], ['dragon_moss', 3, [1, 2]], ['shinobi_headband', 1, [1, 1]]]));
defItem('sealed_scroll', 'Sealed Scroll',    '📜', 90, chest([30, 120], [
  ['chakra_orb', 30, [2, 6]], ['storm_chakra', 20, [1, 4]], ['nature_essence', 15, [1, 3]], ['sage_pill', 10, [1, 3]],
  ['sapphire', 5, [1, 1]], ['beast_ember', 4, [1, 2]], ['fox_tail_charm', 0.5, [1, 1]]]));
defItem('lost_lantern',  'Lost Lantern',     '🏮', 90, chest([30, 120], [
  ['soul_fragment', 30, [5, 15]], ['spirit_core', 25, [2, 5]], ['husk_mask', 15, [1, 3]], ['grave_dust', 10, [1, 3]],
  ['ruby', 4, [1, 1]], ['reishi_ring', 2, [1, 1]], ['sovereign_mask', 0.3, [1, 1]]]));
defItem('sunken_chest',  'Sunken Chest',     '🧰', 250, chest([100, 400], [
  ['reef_bass', 25, [3, 8]], ['blue_marlin', 20, [2, 5]], ['sapphire', 10, [1, 1]], ['ruby', 6, [1, 1]],
  ['sea_charm', 3, [1, 1]], ['void_diamond', 2, [1, 1]], ['FRUIT', 0.5, [1, 1]]]));
defItem('treasure_map',  'Treasure Map',     '🗺️', 800, chest([500, 2000], [
  ['starsteel', 25, [2, 5]], ['sunstone', 15, [1, 3]], ['ruby', 12, [1, 1]], ['void_diamond', 8, [1, 1]],
  ['FRUIT', 2, [1, 1]], ['storm_crown', 1.5, [1, 1]], ['rift_shard', 0.5, [1, 1]]]));
const GEM_TABLE = [['jade', 60], ['sapphire', 25], ['ruby', 12], ['void_diamond', 3]];

/* ----------------------------------------------------------------- skills */
const SKILLS = {
  herbalism: { name: 'Herbalism',     realm: 'shinobi', icon: '🌿', type: 'gather', desc: 'Forage medicinal herbs from the forests around the hidden villages.' },
  chakra:    { name: 'Chakra Focus',  realm: 'shinobi', icon: '🌀', type: 'gather', desc: 'Meditate under waterfalls to condense raw chakra into crystals.' },
  arts:      { name: 'Shinobi Arts',  realm: 'shinobi', icon: '📃', type: 'craft',  desc: 'Brew combat pills and weave armor using materials from every realm.' },
  harvest:   { name: 'Soul Harvest',  realm: 'soul',    icon: '👻', type: 'gather', desc: 'Guide wandering spirits onward and keep what they leave behind.' },
  mining:    { name: 'Reishi Mining', realm: 'soul',    icon: '⛏️', type: 'gather', desc: 'Mine ore crystallized from pure spiritual particles. Gems hide in the rock.' },
  smithing:  { name: 'Bladesmithing', realm: 'soul',    icon: '⚒️', type: 'craft',  desc: 'Forge soul-bound blades and set gems into jewelry.' },
  fishing:   { name: 'Fishing',       realm: 'seas',    icon: '🎣', type: 'gather', desc: 'Cast your line into the endless blue. Fruit eaters fish 40% slower.' },
  cooking:   { name: 'Cooking',       realm: 'seas',    icon: '🍳', type: 'craft',  desc: 'A good cook keeps the crew alive. Food heals in combat and supplies voyages.' },
  voyaging:  { name: 'Voyaging',      realm: 'seas',    icon: '⛵', type: 'voyage', desc: 'Set sail on expeditions. Consumes food as supplies and returns with gold and treasure.' },
  strength:  { name: 'Strength',      realm: 'combat',  icon: '💪', type: 'combat', desc: 'Raises your max hit. Trained by fighting with the Strength style.' },
  defense:   { name: 'Defense',       realm: 'combat',  icon: '🛡️', type: 'combat', desc: 'Reduces the damage you take. Trained by fighting with the Defense style.' },
  vitality:  { name: 'Vitality',      realm: 'combat',  icon: '❤️', type: 'combat', desc: '+10 base max HP per level. Always earns a share of combat XP.' },
};

// One knob for the whole XP economy: XP per second of work grows smoothly with the level an action unlocks at.
// Crafting pays a bonus because it consumes materials. Tuned with a time-to-99 simulation:
// gathering ~0.5h to Lv25, ~3.5h to Lv50, ~18h to Lv75, ~90h to Lv99.
const XP_RATE = 2.6, XP_GROWTH = 1.03, CRAFT_BONUS = 1.4;
const xpFor = (level, time, craft) => Math.round(time * XP_RATE * Math.pow(XP_GROWTH, level) * (craft ? CRAFT_BONUS : 1));

const gather = (item, level, time) => ({ id: item, name: ITEMS[item].name, level, time, xp: xpFor(level, time), out: { [item]: 1 } });
const craft = (item, level, time, inputs, qty) => ({ id: item, name: ITEMS[item].name, level, time, xp: xpFor(level, time, true), in: inputs, out: { [item]: qty || 1 } });

SKILLS.herbalism.actions = [
  gather('healing_leaf', 1, 3),
  gather('moonpetal', 10, 3.5),
  gather('cloud_fern', 20, 4),
  gather('shadowroot', 32, 4.5),
  gather('sage_lotus', 45, 5),
  gather('spirit_orchid', 58, 5.5),
  gather('dragon_moss', 72, 6),
  gather('world_tree_leaf', 88, 7),
];
SKILLS.chakra.actions = [
  gather('chakra_shard', 1, 3),
  gather('chakra_orb', 12, 3.5),
  gather('storm_chakra', 25, 4),
  gather('nature_essence', 40, 5),
  gather('beast_ember', 55, 5.5),
  gather('lightning_core', 70, 6),
  gather('sage_chakra', 84, 7),
];
SKILLS.arts.actions = [
  craft('soldier_pill', 1, 3, { healing_leaf: 3, chakra_shard: 1 }),
  craft('flak_vest', 6, 4, { spirit_ore: 6, chakra_shard: 3 }),
  craft('shinobi_headband', 12, 4, { spirit_ore: 5, chakra_orb: 2 }),
  craft('chakra_mesh', 20, 5, { silver_reishi: 8, chakra_orb: 8, moonpetal: 4 }),
  craft('frost_garb', 30, 5, { frost_crystal: 8, cloud_fern: 6, storm_chakra: 4 }),
  craft('sage_robe', 40, 6, { shadowroot: 6, nature_essence: 6, void_stone: 6 }),
  craft('sage_pill', 48, 4, { sage_lotus: 2, nature_essence: 1 }),
  craft('beast_cloak', 62, 7, { beast_ember: 6, spirit_orchid: 6, starsteel: 8 }),
  craft('storm_pill', 72, 5, { dragon_moss: 2, lightning_core: 1 }),
  craft('storm_mantle', 86, 8, { phantom_silk: 8, sage_chakra: 4, sunstone: 8 }),
];
SKILLS.harvest.actions = [
  gather('soul_fragment', 1, 3),
  gather('wisp_flame', 10, 3.5),
  gather('spirit_core', 20, 4),
  gather('husk_mask', 35, 4.5),
  gather('grave_dust', 50, 5),
  gather('abyssal_essence', 63, 5.5),
  gather('phantom_silk', 75, 6),
  gather('echo_soul', 88, 7),
];
SKILLS.mining.actions = [
  gather('spirit_ore', 1, 3),
  gather('silver_reishi', 12, 3.5),
  gather('frost_crystal', 22, 4),
  gather('void_stone', 32, 4.5),
  gather('black_iron', 45, 5),
  gather('starsteel', 58, 5.5),
  gather('sunstone', 72, 6),
  gather('rift_ore', 88, 7),
];
SKILLS.smithing.actions = [
  craft('iron_wakizashi', 1, 4, { spirit_ore: 5 }),
  craft('jade_amulet', 10, 4, { jade: 1, silver_reishi: 3 }),
  craft('spirit_katana', 15, 5, { silver_reishi: 8, soul_fragment: 10 }),
  craft('reishi_ring', 25, 5, { frost_crystal: 4, spirit_core: 4 }),
  craft('awakened_blade', 35, 6, { void_stone: 10, spirit_core: 5, chakra_orb: 5 }),
  craft('sapphire_charm', 42, 5, { sapphire: 1, void_stone: 4, wisp_flame: 6 }),
  craft('black_warhammer', 50, 6, { black_iron: 12, husk_mask: 4 }),
  craft('ruby_crest', 56, 6, { ruby: 1, black_iron: 4, grave_dust: 4 }),
  craft('sovereign_blade', 64, 7, { starsteel: 12, husk_mask: 6, beast_ember: 4 }),
  craft('sunforged_bow', 75, 8, { sunstone: 12, abyssal_essence: 6, spirit_orchid: 4 }),
  craft('void_band', 80, 7, { void_diamond: 1, sunstone: 4, echo_soul: 2 }),
  craft('rift_cleaver', 90, 10, { rift_ore: 20, echo_soul: 10, rift_shard: 1 }),
];
SKILLS.fishing.actions = [
  gather('minnow', 1, 3),
  gather('reef_bass', 10, 3.5),
  gather('sea_crab', 20, 4),
  gather('blue_marlin', 30, 4.5),
  gather('tidal_eel', 45, 5),
  gather('giant_octopus', 58, 5.5),
  gather('abyss_angler', 70, 6),
  gather('sea_king', 88, 7),
];
SKILLS.cooking.actions = [
  craft('grilled_minnow', 1, 2, { minnow: 1 }),
  craft('bass_stew', 10, 2.5, { reef_bass: 1 }),
  craft('crab_dumplings', 20, 2.5, { sea_crab: 1, healing_leaf: 1 }),
  craft('spirit_ramen', 25, 3, { reef_bass: 1, moonpetal: 1, wisp_flame: 1 }),
  craft('marlin_steak', 30, 3, { blue_marlin: 1 }),
  craft('eel_bowl', 45, 3, { tidal_eel: 1 }),
  craft('takoyaki', 58, 3.5, { giant_octopus: 1 }),
  craft('angler_feast', 70, 3.5, { abyss_angler: 1 }),
  craft('sea_king_curry', 88, 4, { sea_king: 1, world_tree_leaf: 1 }),
];
// Voyages: loot.table = one guaranteed roll; loot.rare = independent chances ('FRUIT' = random Abyss Fruit)
const voyage = (id, name, icon, level, time, input, loot) => ({ id, name, icon, level, time, xp: xpFor(level, time, true), in: input, loot });
SKILLS.voyaging.actions = [
  voyage('coastal', 'Coastal Run', '🏝️', 1, 10, { grilled_minnow: 2 },
    { gold: [20, 60], table: [['minnow', [2, 5]], ['spirit_ore', [2, 4]], ['healing_leaf', [2, 4]]], rare: [['old_compass', 1 / 50]] }),
  voyage('merchant', 'Merchant Route', '🚢', 12, 12, { bass_stew: 2 },
    { gold: [70, 180], table: [['reef_bass', [2, 4]], ['silver_reishi', [2, 4]], ['chakra_orb', [1, 3]]], rare: [['sea_charm', 1 / 60], ['FRUIT', 1 / 400]] }),
  voyage('cove', "Smuggler's Cove", '🏴‍☠️', 25, 14, { crab_dumplings: 2 },
    { gold: [150, 350], table: [['sea_crab', [2, 4]], ['frost_crystal', [2, 4]], ['wisp_flame', [2, 4]]], rare: [['sapphire', 1 / 30], ['FRUIT', 1 / 300]] }),
  voyage('current', 'Treacherous Current', '🌊', 38, 16, { marlin_steak: 2 },
    { gold: [250, 600], table: [['void_stone', [2, 4]], ['spirit_core', [2, 4]], ['shadowroot', [2, 4]]], rare: [['sea_charm', 1 / 40], ['FRUIT', 1 / 200]] }),
  voyage('stormbelt', 'Storm Belt Crossing', '⛈️', 55, 20, { eel_bowl: 2 },
    { gold: [600, 1400], table: [['starsteel', [1, 3]], ['husk_mask', [1, 3]], ['nature_essence', [2, 4]]], rare: [['storm_crown', 1 / 120], ['FRUIT', 1 / 120]] }),
  voyage('ghostfleet', 'Ghost Fleet Waters', '👻', 68, 22, { takoyaki: 2 },
    { gold: [1000, 2400], table: [['grave_dust', [2, 4]], ['black_iron', [2, 4]], ['giant_octopus', [1, 3]]], rare: [['ruby', 1 / 25], ['FRUIT', 1 / 90]] }),
  voyage('worldsedge', 'Edge of the World', '🌌', 82, 26, { angler_feast: 2 },
    { gold: [1800, 4000], table: [['phantom_silk', [1, 3]], ['lightning_core', [1, 3]], ['sunstone', [1, 3]]], rare: [['storm_crown', 1 / 60], ['FRUIT', 1 / 50]] }),
];
SKILLS.strength.actions = [];
SKILLS.defense.actions = [];
SKILLS.vitality.actions = [];

/* --------------------------------------------- rare finds, pets, milestones */
// Rolled on every completed action of that skill (chance per action). 'GEM' rolls GEM_TABLE.
const RARE_FINDS = {
  herbalism: [['herb_pouch', 1 / 150]],
  chakra:    [['sealed_scroll', 1 / 150]],
  harvest:   [['lost_lantern', 1 / 150]],
  mining:    [['GEM', 1 / 80]],
  fishing:   [['sunken_chest', 1 / 200], ['FRUIT', 1 / 2500]],
  voyaging:  [['treasure_map', 1 / 25]],
  cooking:   [], arts: [], smithing: [],
};
const GLOBAL_RARE = [['rift_shard', 1 / 30000]];   // any non-combat action

// Pets: very rare, permanent. Skill pets: +5% speed & XP in their skill. Boss pets: +3% damage & max HP.
// Skill pet chance scales with action time: ~1 per PET_HOURS hours of that skill on average.
const PET_HOURS = 10;
const PETS = [
  { id: 'leaf_toad',     name: 'Leaf Toad',          icon: '🐸', skill: 'herbalism' },
  { id: 'sage_slug',     name: 'Sage Slug',          icon: '🐌', skill: 'chakra' },
  { id: 'scroll_cat',    name: 'Scroll Cat',         icon: '🐈', skill: 'arts' },
  { id: 'hell_moth',     name: 'Hell Butterfly',     icon: '🦋', skill: 'harvest' },
  { id: 'ore_badger',    name: 'Ore Badger',         icon: '🦡', skill: 'mining' },
  { id: 'forge_newt',    name: 'Forge Salamander',   icon: '🦎', skill: 'smithing' },
  { id: 'sea_otter',     name: 'Sea Otter',          icon: '🦦', skill: 'fishing' },
  { id: 'galley_mouse',  name: 'Galley Mouse',       icon: '🐭', skill: 'cooking' },
  { id: 'ship_parrot',   name: 'Ship Parrot',        icon: '🦜', skill: 'voyaging' },
  { id: 'ashen_kit',     name: 'Ashen Kit',          icon: '🐕', zone: 'fox',         chance: 1 / 30 },
  { id: 'hollow_pup',    name: 'Hollow Pup',         icon: '🐺', zone: 'sovereign',   chance: 1 / 30 },
  { id: 'gull_officer',  name: 'Seagull Lieutenant', icon: '🕊️', zone: 'admiral',     chance: 1 / 30 },
  { id: 'rift_wisp',     name: 'Rift Wisp',          icon: '👀', zone: 'convergence', chance: 1 / 20 },
];

// Level milestones for every non-combat skill.
const MILESTONES = [
  { lv: 10, name: 'Apprentice',  desc: '+5% speed',               speed: 0.05 },
  { lv: 25, name: 'Adept',       desc: '+5% double output',        dbl: 0.05 },
  { lv: 50, name: 'Expert',      desc: '+10% speed',              speed: 0.10 },
  { lv: 75, name: 'Master',      desc: 'Rare finds ×1.5',         rare: 0.5 },
  { lv: 99, name: 'Grandmaster', desc: '+10% speed, +10% double, rare finds ×2', speed: 0.10, dbl: 0.10, rare: 0.5 },
];
// Combat skills: each milestone gives +4% of that skill's stat.
const COMBAT_MILESTONES = [10, 25, 50, 75, 99];
const COMBAT_STAT = { strength: 'damage', defense: 'defense', vitality: 'max HP' };

/* ----------------------------------------------------------------- combat */
// enemy: hp, atk (max hit), def, spd (seconds per attack), xp, gold [min,max], drops [[item, chance, [min,max]]]
const en = (name, icon, hp, atk, def, spd, xp, gold, drops) => ({ name, icon, hp, atk, def, spd, xp, gold, drops: drops || [] });

const ZONES = [
  { id: 'training', name: 'Training Grounds', realm: 'shinobi', rec: 1, enemies: [
    en('Bandit Thug', '🗡️', 25, 4, 0, 3, 10, [2, 6], [['healing_leaf', 0.3, [1, 3]], ['minnow', 0.2, [1, 2]], ['old_compass', 1 / 400, [1, 1]]]),
    en('Rogue Apprentice', '🥷', 35, 5, 2, 2.8, 15, [4, 9], [['chakra_shard', 0.3, [1, 3]], ['soldier_pill', 0.05, [1, 1]], ['shinobi_headband', 1 / 150, [1, 1]]]),
  ] },
  { id: 'mist', name: 'Misty Forest', realm: 'shinobi', rec: 10, enemies: [
    en('Mist Assassin', '🌫️', 100, 14, 8, 2.6, 32, [10, 22], [['moonpetal', 0.3, [1, 3]], ['chakra_orb', 0.1, [1, 2]], ['senbon', 1 / 60, [1, 1]]]),
    en('Puppet Drone', '🪆', 130, 12, 15, 3, 36, [12, 24], [['spirit_ore', 0.4, [2, 5]], ['silver_reishi', 0.1, [1, 2]], ['puppet_plating', 1 / 60, [1, 1]]]),
  ] },
  { id: 'ravine', name: 'Fang Ravine', realm: 'shinobi', rec: 22, enemies: [
    en('Ninken Alpha', '🐺', 220, 24, 18, 2.4, 65, [20, 40], [['shadowroot', 0.3, [1, 3]], ['wolf_fang', 1 / 80, [1, 1]], ['herb_pouch', 1 / 40, [1, 1]]]),
    en('Stone Golem', '🗿', 320, 22, 35, 3.2, 80, [25, 45], [['void_stone', 0.25, [1, 2]], ['jade', 1 / 30, [1, 1]], ['golem_heart', 1 / 80, [1, 1]]]),
  ] },
  { id: 'fox', name: 'Den of the Ashen Fox', realm: 'shinobi', rec: 32, boss: true, enemies: [
    en('Ashen Fox Beast', '🦊', 1600, 45, 35, 2.5, 700, [300, 600], [['beast_ember', 1, [2, 4]], ['nature_essence', 0.5, [2, 4]], ['sealed_scroll', 0.25, [1, 2]], ['fox_tail_charm', 1 / 8, [1, 1]]]),
  ] },
  { id: 'districts', name: 'Outer Districts', realm: 'soul', rec: 38, enemies: [
    en('Lesser Husk', '👹', 420, 35, 30, 2.6, 95, [30, 60], [['soul_fragment', 0.5, [2, 5]], ['husk_claw', 1 / 120, [1, 1]]]),
    en('Lurking Husk', '👺', 540, 40, 40, 2.6, 115, [35, 70], [['spirit_core', 0.2, [1, 2]], ['reaper_scarf', 1 / 120, [1, 1]], ['lost_lantern', 1 / 50, [1, 1]]]),
  ] },
  { id: 'desert', name: 'Desert of Endless Night', realm: 'soul', rec: 46, enemies: [
    en('Towering Husk', '🏜️', 950, 60, 50, 3, 190, [50, 90], [['husk_mask', 0.2, [1, 2]], ['husk_carapace', 1 / 150, [1, 1]]]),
    en('Sand Wraith', '🌪️', 780, 70, 45, 2.2, 180, [50, 90], [['void_stone', 0.3, [1, 3]], ['sapphire', 1 / 60, [1, 1]], ['wraith_sickle', 1 / 150, [1, 1]]]),
  ] },
  { id: 'spire', name: 'The Bone Spire', realm: 'soul', rec: 55, enemies: [
    en('Masked Lancer', '💀', 1400, 90, 70, 2.4, 290, [80, 140], [['husk_mask', 0.3, [1, 3]], ['grave_dust', 0.15, [1, 2]], ['bone_lance', 1 / 200, [1, 1]]]),
    en('Bone Priest', '☠️', 1250, 100, 60, 2.5, 280, [80, 140], [['abyssal_essence', 0.1, [1, 2]], ['ruby', 1 / 80, [1, 1]], ['prayer_beads', 1 / 200, [1, 1]]]),
  ] },
  { id: 'sovereign', name: 'Throne of Masks', realm: 'soul', rec: 64, boss: true, enemies: [
    en('Masked Sovereign', '🎭', 9000, 160, 110, 2.4, 2800, [1500, 3000], [['abyssal_essence', 1, [3, 6]], ['lost_lantern', 0.5, [1, 3]], ['sovereign_mask', 1 / 10, [1, 1]], ['sovereign_cloak', 1 / 12, [1, 1]]]),
  ] },
  { id: 'shoals', name: 'Rookie Shoals', realm: 'seas', rec: 68, enemies: [
    en('Navy Recruit', '⚓', 2000, 130, 100, 2.5, 380, [120, 220], [['reef_bass', 0.4, [2, 4]], ['marine_coat', 1 / 150, [1, 1]]]),
    en('Cannon Brute', '💣', 2600, 150, 120, 3, 440, [150, 260], [['starsteel', 0.1, [1, 2]], ['hand_cannon', 1 / 180, [1, 1]]]),
  ] },
  { id: 'reef', name: 'Merfolk Reef', realm: 'seas', rec: 74, enemies: [
    en('Merfolk Brawler', '🧜', 3400, 200, 150, 2.3, 620, [200, 350], [['blue_marlin', 0.4, [2, 4]], ['sea_charm', 1 / 80, [1, 1]], ['sunken_chest', 1 / 40, [1, 1]]]),
    en('Reef Shark', '🦈', 3000, 240, 130, 2.1, 600, [200, 350], [['tidal_eel', 0.3, [1, 3]], ['shark_tooth', 1 / 150, [1, 1]]]),
  ] },
  { id: 'storm', name: 'The Storm Belt', realm: 'seas', rec: 82, enemies: [
    en('Sea Leviathan', '🐉', 6500, 320, 200, 3, 1100, [350, 600], [['abyss_angler', 0.3, [1, 3]], ['leviathan_mail', 1 / 250, [1, 1]], ['FRUIT', 1 / 200, [1, 1]]]),
    en('Storm Corsair', '🏴‍☠️', 5200, 360, 190, 2.2, 1050, [350, 600], [['starsteel', 0.3, [1, 3]], ['treasure_map', 1 / 60, [1, 1]], ['corsair_cutlass', 1 / 250, [1, 1]]]),
  ] },
  { id: 'admiral', name: "Admiral's Flagship", realm: 'seas', rec: 90, boss: true, enemies: [
    en('Admiral of the Tide', '🎖️', 22000, 520, 280, 2.4, 9000, [6000, 12000], [['treasure_map', 0.5, [1, 2]], ['admiral_coat', 1 / 12, [1, 1]], ['storm_crown', 1 / 12, [1, 1]], ['FRUIT', 1 / 4, [1, 1]]]),
  ] },
  { id: 'convergence', name: 'The Convergence', realm: 'rift', rec: 99, boss: true, enemies: [
    en('Rift Emperor', '👁️', 60000, 900, 400, 2.2, 30000, [30000, 60000], [['rift_shard', 1, [1, 1]], ['rift_eye', 1 / 25, [1, 1]], ['FRUIT', 1 / 2, [1, 1]]]),
  ] },
];
REALMS.rift = { name: 'The Rift', icon: '🔱', color: '#ff3fb4', tagline: 'Where the three worlds tear into one.', hidden: true };

const BOUNTY_RANKS = [
  [0, 'Nobody'], [5e3, 'Rookie Outlaw'], [5e4, 'Rising Star'], [5e5, 'Warlord'],
  [5e6, 'Sea Emperor'], [5e7, 'Multiverse Legend'],
];

/* ------------------------------------------------- inner power (energy) */
const TRAININGS = [
  { id: 'chakra',  name: 'Chakra Control',    icon: '🌀', base: 25, per: 1,     unit: '% damage' },
  { id: 'reiatsu', name: 'Spirit Pressure',   icon: '🌙', base: 25, per: 1,     unit: '% max HP' },
  { id: 'will',    name: 'Iron Will',         icon: '🛡️', base: 30, per: 1,     unit: '% defense' },
  { id: 'swift',   name: 'Swiftness',         icon: '💨', base: 40, per: 0.2,   unit: '% skill speed' },
  { id: 'fortune', name: 'Fortune',           icon: '💰', base: 50, per: 1,     unit: '% gold' },
  { id: 'wisdom',  name: 'Wisdom',            icon: '📖', base: 60, per: 0.5,   unit: '% XP' },
];

const PERKS = [
  { id: 'fire',     name: 'Inner Fire',      icon: '🔥', desc: '+25% energy power per level' },
  { id: 'reserves', name: 'Vast Reserves',   icon: '🔋', desc: '+20% energy cap per level' },
  { id: 'mentor',   name: "Mentor's Wisdom", icon: '🧙', desc: '+10% skill XP per level' },
  { id: 'merchant', name: 'Merchant Blood',  icon: '🪙', desc: '+15% gold per level' },
  { id: 'warrior',  name: 'Warrior Soul',    icon: '⚔️', desc: '+10% damage and max HP per level' },
  { id: 'dilation', name: 'Time Dilation',   icon: '⏳', desc: '+2h offline progress cap per level', max: 6 },
];

/* ------------------------------------------------------------------- shop */
const SHOP = [
  { id: 'tools_shinobi', cat: 'Tools', name: 'Shinobi Tool Pouch', icon: '🎒', desc: '+10% speed for Shinobi Lands skills per tier.', costs: [150, 1200, 6000, 30000, 150000] },
  { id: 'tools_soul',    cat: 'Tools', name: 'Soul Lantern',       icon: '🏮', desc: '+10% speed for Soul Afterlands skills per tier.', costs: [150, 1200, 6000, 30000, 150000] },
  { id: 'tools_seas',    cat: 'Tools', name: 'Ship Upgrades',      icon: '🛠️', desc: '+10% speed for Endless Blue skills per tier.', costs: [150, 1200, 6000, 30000, 150000] },
  { id: 'abundance',     cat: 'Charms', name: 'Abundance Charm',   icon: '🍀', desc: '+5% chance per tier to double gathering output.', costs: [500, 5000, 50000, 500000] },
  { id: 'lucky_coin',    cat: 'Charms', name: 'Lucky Coin',        icon: '🎲', desc: '+15% chance per tier for every rare find (chests, gems, pets, rare drops).', costs: [2000, 20000, 200000] },
  { id: 'satchel',       cat: 'Charms', name: 'Auto-Eat Satchel',  icon: '👝', desc: 'Raises the auto-eat threshold: 40% → 55% → 70% HP.', costs: [1000, 20000] },
  { id: 'buy_minnow',    cat: 'Supplies', name: '10× Grilled Minnow', icon: '🍢', desc: 'Emergency rations for a struggling adventurer.', cost: 80, give: ['grilled_minnow', 10] },
  { id: 'buy_ore',       cat: 'Supplies', name: '20× Spirit Ore',     icon: '🪨', desc: 'A crate of basic ore.', cost: 60, give: ['spirit_ore', 20] },
];

/* ------------------------------------------------------------ goal chain */
// A guided path so a new player always knows the next thing to do.
// prog() returns [current]; go = view the GO button opens. Append only: saves store the index.
const made = (id) => () => [S.stats.made[id] || 0];
const kills = (zone) => () => [S.combat.kills[zone] || 0];
const GOALS = [
  { text: 'Catch 5 Minnows',              icon: '🎣', go: 'realm:seas:fishing',      n: 5,   prog: made('minnow'), reward: 40 },
  { text: 'Cook 5 Grilled Minnows',        icon: '🍳', go: 'realm:seas:cooking',      n: 5,   prog: made('grilled_minnow'), reward: 60 },
  { text: 'Defeat 5 foes at the Training Grounds', icon: '⚔️', go: 'battle',          n: 5,   prog: kills('training'), reward: 100 },
  { text: 'Mine 10 Spirit Ore',            icon: '⛏️', go: 'realm:soul:mining',       n: 10,  prog: made('spirit_ore'), reward: 100 },
  { text: 'Forge an Iron Wakizashi',       icon: '⚒️', go: 'realm:soul:smithing',     n: 1,   prog: made('iron_wakizashi'), reward: 120 },
  { text: 'Equip a weapon',                icon: '🗡️', go: 'hero',                    n: 1,   prog: () => [S.equip.weapon ? 1 : 0], reward: 150 },
  { text: 'Put energy into any training',  icon: '🔋', go: 'power',                   n: 1,   prog: () => [energyUsed() > 0 ? 1 : 0], reward: 150 },
  { text: 'Return from 3 voyages',         icon: '⛵', go: 'realm:seas:voyaging',     n: 3,   prog: () => [S.stats.voyages], reward: 250 },
  { text: 'Unlock the Misty Forest',       icon: '🌫️', go: 'battle',                  n: 10,  prog: kills('training'), reward: 300 },
  { text: 'Buy any upgrade in the Market', icon: '🏪', go: 'market',                  n: 1,   prog: () => [['tools_shinobi', 'tools_soul', 'tools_seas', 'abundance', 'satchel', 'lucky_coin'].reduce((a, k) => a + (S.shop[k] || 0), 0)], reward: 300 },
  { text: 'Reach Strength level 20',       icon: '💪', go: 'battle',                  n: 20,  prog: () => [skillLv('strength')], reward: 500 },
  { text: 'Defeat the Ashen Fox Beast',    icon: '🦊', go: 'battle',                  n: 1,   prog: kills('fox'), reward: 2000 },
  { text: 'Reach Total Level 200',         icon: '📈', go: 'home',                    n: 200, prog: () => [Object.keys(SKILLS).reduce((a, k) => a + skillLv(k), 0)], reward: 2500 },
  { text: 'Rebirth for the first time',    icon: '♻️', go: 'power',                   n: 1,   prog: () => [S.rebirths], reward: 3000 },
  { text: 'Defeat the Masked Sovereign',   icon: '🎭', go: 'battle',                  n: 1,   prog: kills('sovereign'), reward: 10000 },
  { text: 'Eat an Abyss Fruit',            icon: '🍎', go: 'hero',                    n: 1,   prog: () => [S.fruit ? 1 : 0], reward: 10000 },
  { text: 'Defeat the Admiral of the Tide', icon: '🎖️', go: 'battle',                 n: 1,   prog: kills('admiral'), reward: 40000 },
  { text: 'Defeat the Rift Emperor',       icon: '👁️', go: 'battle',                  n: 1,   prog: kills('convergence'), reward: 100000 },
  { text: 'Fill 75% of the Collection Log', icon: '📖', go: 'hero:collection',        n: 75,  prog: () => [Math.floor(collectionPct() * 100)], reward: 150000 },
];
