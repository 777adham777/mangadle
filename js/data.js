'use strict';
/* ==========================================================================
   ANIME IDLE RPG — static game data
   Worlds collided: the Leaf Village (start), Orange Town, Soul City, and more (worlds.js).
   ========================================================================== */

const REALMS = {
  shinobi: { name: 'Leaf Village',   icon: '🍃', color: '#ff7a1a', tagline: 'Hidden villages, chakra and cold steel.' },     // world 1: the forest village
  seas:    { name: 'Orange Town',    icon: '⚓', color: '#14a8ff', tagline: 'Pirates, bounties and cursed fruit.' },          // world 2
  soul:    { name: 'Soul City', icon: '🌙', color: '#9b6bff', tagline: 'Spirit blades, masked husks and restless souls.' }, // world 3
};
// Worlds in the order they open. Later worlds append themselves (worlds.js).
const WORLD_ORDER = ['shinobi', 'seas', 'soul'];

/* ------------------------------------------------------------------ items */
// type: res (material) · food · equip · fruit · gem · chest (openable)
const ITEMS = {};
function defItem(id, name, icon, value, extra) {
  ITEMS[id] = Object.assign({ id, name, icon, value, type: 'res' }, extra || {});
}

// Shinobi — wood (every log also patches a ship's hull on Orange Town voyages)
defItem('pine_log',        'Pine Log',         '🪵', 2);
defItem('cedar_log',       'Cedar Log',        '🪵', 6);
defItem('bamboo',          'Bamboo Stalk',     '🎋', 10);
defItem('mistwood',        'Mistwood Log',     '🪵', 16);
defItem('ironwood',        'Ironwood Log',     '🪵', 30);
defItem('blossomwood',     'Blossomwood Log',  '🌸', 48);
defItem('spirit_oak',      'Spirit Oak Log',   '🪵', 75);
defItem('heartwood',       'Sacred Heartwood', '🌳', 160);
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
// Soul — ingots (Smelting): weapons are forged from them in Crafting, and refined with them
const ingot = (id, name, value) => defItem(id, name, '🟫', value, { ingot: true });
ingot('reishi_ingot', 'Reishi Ingot', 5); ingot('silver_ingot', 'Silver Ingot', 18); ingot('frost_ingot', 'Frost Ingot', 30);
ingot('void_ingot', 'Void Ingot', 50); ingot('black_ingot', 'Black Iron Ingot', 80); ingot('star_ingot', 'Starsteel Ingot', 120);
ingot('sun_ingot', 'Sun Ingot', 200); ingot('rift_ingot', 'Rift Ingot', 380);
// Seas — fish
defItem('minnow',          'Minnow',           '🐟', 2);
defItem('reef_bass',       'Reef Bass',        '🐠', 6);
defItem('sea_crab',        'Sea Crab',         '🦀', 10);
defItem('blue_marlin',     'Blue Marlin',      '🐡', 16);
defItem('tidal_eel',       'Tidal Eel',        '🐍', 30);
defItem('giant_octopus',   'Giant Octopus',    '🐙', 48);
defItem('abyss_angler',    'Abyss Angler',     '🦑', 75);
defItem('sea_king',        'Sea Titan',        '🐲', 160);
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
defItem('sea_king_curry',  'Sea Titan Curry',  '🍛', 320, food(700));
defItem('soldier_pill',    'Soldier Pill',     '💊', 8,   food(40));
defItem('sage_pill',       'Sage Pill',        '🟢', 80,  food(280));
defItem('storm_pill',      'Storm Pill',       '🟣', 200, food(520));

// Equipment
const eq = (slot, stats) => ({ type: 'equip', slot, stats });
// crafted weapons
defItem('training_kunai',  'Wooden Sword',     '🪵', 3,     eq('weapon', { atk: 2 }));     // your very first weapon (Crafting)
defItem('rusty_cutlass',   'Rusty Cutlass',    '🗡️', 60,    eq('weapon', { atk: 20 }));
defItem('iron_wakizashi',  'Iron Wakizashi',   '🔪', 15,    eq('weapon', { atk: 6 }));
defItem('spirit_katana',   'Spirit Katana',    '🗡️', 80,    eq('weapon', { atk: 15 }));
defItem('awakened_blade',  'Awakened Blade',   '⚔️', 300,   eq('weapon', { atk: 32 }));
defItem('black_warhammer', 'Black Iron Warhammer', '🔨', 600, eq('weapon', { atk: 45 }));
defItem('sovereign_blade', 'Sovereign Blade',  '🌙', 1000,  eq('weapon', { atk: 60 }));
defItem('sunforged_bow',   'Sunforged Bow',    '🏹', 2500,  eq('weapon', { atk: 85 }));
defItem('rift_cleaver',    'Rift Cleaver',     '🪓', 30000, eq('weapon', { atk: 145 }));
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
defItem('sea_charm',       'Sea Charm',        '🐚', 400,   eq('accessory', { hp: 50, def: 4 }));
defItem('senbon',          'Senbon Needles',   '🥢', 90,    eq('weapon', { atk: 9 }));
defItem('puppet_plating',  'Puppet Plating',   '🪵', 110,   eq('armor', { def: 8, hp: 30 }));
defItem('wolf_fang',       'Wolf Fang Charm',  '🐾', 160,   eq('accessory', { atk: 8, hp: 25 }));
defItem('golem_heart',     'Golem Heart',      '🫀', 180,   eq('accessory', { def: 8, hp: 60 }));
defItem('fox_tail_charm',  'Fox Tail Charm',   '🦊', 900,   eq('accessory', { atk: 18, def: 6, hp: 90 }));
defItem('husk_claw',       'Husk Claw',        '🦴', 350,   eq('weapon', { atk: 80 }));
defItem('reaper_scarf',    'Reaper Scarf',     '🧣', 400,   eq('accessory', { atk: 35, hp: 110 }));
defItem('husk_carapace',   'Husk Carapace',    '🦂', 700,   eq('armor', { def: 58, hp: 320 }));
defItem('wraith_sickle',   'Wraith Sickle',    '🌘', 800,   eq('weapon', { atk: 98 }));
defItem('bone_lance',      'Bone Lance',       '🦯', 1200,  eq('weapon', { atk: 104 }));
defItem('prayer_beads',    'Prayer Beads',     '📿', 1100,  eq('accessory', { def: 32, hp: 320 }));
defItem('sovereign_mask',  'Sovereign Mask',   '👺', 2500,  eq('accessory', { atk: 62, def: 30, hp: 300, gold: 0.25 }));
defItem('sovereign_cloak', 'Sovereign Cloak',  '🦇', 2800,  eq('armor', { def: 122, hp: 720 }));
defItem('marine_coat',     'Marine Coat',      '👕', 2000,  eq('armor', { def: 40, hp: 200 }));
defItem('hand_cannon',     'Hand Cannon',      '💥', 2600,  eq('weapon', { atk: 30 }));
defItem('shark_tooth',     'Shark Tooth Necklace', '🦷', 2400, eq('accessory', { atk: 12, def: 10, hp: 60 }));
defItem('leviathan_mail',  'Leviathan Scalemail', '🛡️', 6000, eq('armor', { def: 52, hp: 260 }));
defItem('corsair_cutlass', 'Corsair Cutlass',  '🪝', 6500,  eq('weapon', { atk: 38 }));
defItem('admiral_coat',    "Admiral's Greatcoat", '🪖', 12000, eq('armor', { def: 64, hp: 340 }));
defItem('storm_crown',     'Storm Crown',      '👑', 8000,  eq('accessory', { atk: 40, def: 15, hp: 150, gold: 0.15 }));
defItem('rift_eye',        'Eye of the Rift',  '🌌', 30000, eq('accessory', { atk: 90, def: 40, hp: 400 }));

// World relics: rare combat drops. Every world's iconic gear is forged from its own relics.
const relic = (realm) => ({ relic: realm });
defItem('mist_steel',      'Mist Steel',          '🌫️', 45,   relic('shinobi'));
defItem('beast_fang',      'Ninken Fang',         '🦷', 70,   relic('shinobi'));
defItem('ashen_tail',      'Ashen Fox Tail',      '🦊', 400,  relic('shinobi'));
defItem('husk_heart',      'Husk Heart',          '🫀', 160,  relic('soul'));
defItem('bone_ivory',      'Spire Ivory',         '🦴', 260,  relic('soul'));
defItem('sovereign_shard', 'Sovereign Mask Shard','🎭', 1200, relic('soul'));
defItem('tide_pearl',      'Tide Pearl',          '🫧', 600,  relic('seas'));
defItem('leviathan_scale', 'Leviathan Scale',     '🐉', 900,  relic('seas'));
defItem('tide_heart',      'Heart of the Tide',   '🌊', 5000, relic('seas'));

// More pills: Crafting keeps you alive until Orange Town's cooks take over.
defItem('moon_pill',       'Moonpetal Pill',      '🌕', 25,  food(90));
defItem('shadow_pill',     'Shadowroot Pill',     '🌑', 45,  food(150));

// Iconic gear — each needs a schematic dropped in its world, and that world's relics.
defItem('crystal_kunai',   'Crystal Kunai',       '🔪', 12,    eq('weapon', { atk: 5 }));
defItem('chakra_blade',    'Chakra Blade',        '🗡️', 60,    eq('weapon', { atk: 13 }));
defItem('fog_cleaver',     'Fog Cleaver',         '🪓', 400,   eq('weapon', { atk: 26 }));
defItem('sealing_talisman','Sealing Talisman',    '🧧', 500,   eq('accessory', { atk: 12, hp: 80 }));
defItem('ashen_fang',      'Ashen Fang Tanto',    '🔥', 1500,  eq('weapon', { atk: 40 }));
defItem('reapers_edge',    "Reaper's Edge",       '🌙', 2500,  eq('weapon', { atk: 54 }));
defItem('ferryman_robe',   "Ferryman's Robe",     '🧥', 2500,  eq('armor', { def: 48, hp: 280 }));
defItem('eclipse_blade',   'Eclipse Blade',       '🌑', 6000,  eq('weapon', { atk: 78 }));
defItem('kraken_compass',  'Kraken Compass',      '🧭', 6000,  eq('accessory', { atk: 40, def: 25, hp: 200, gold: 0.15 }));
defItem('stormcaller',     'Stormcaller Cutlass', '⚡', 12000, eq('weapon', { atk: 105 }));
defItem('tide_mantle',     'Tidesovereign Mantle','🌊', 15000, eq('armor', { def: 135, hp: 780 }));

// Schematics: drop once each, and teach the recipe for good (they never sit in the bank).
const schem = (teaches) => ({ type: 'schematic', teaches });
defItem('schem_fog_cleaver',      'Schematic: Fog Cleaver',         '📜', 300,   schem('fog_cleaver'));
defItem('schem_sealing_talisman', 'Schematic: Sealing Talisman',    '📜', 400,   schem('sealing_talisman'));
defItem('schem_ashen_fang',       'Schematic: Ashen Fang Tanto',    '📜', 1200,  schem('ashen_fang'));
defItem('schem_reapers_edge',     "Schematic: Reaper's Edge",       '📜', 2000,  schem('reapers_edge'));
defItem('schem_ferryman_robe',    "Schematic: Ferryman's Robe",     '📜', 2000,  schem('ferryman_robe'));
defItem('schem_eclipse_blade',    'Schematic: Eclipse Blade',       '📜', 5000,  schem('eclipse_blade'));
defItem('schem_kraken_compass',   'Schematic: Kraken Compass',      '📜', 5000,  schem('kraken_compass'));
defItem('schem_stormcaller',      'Schematic: Stormcaller Cutlass', '📜', 9000,  schem('stormcaller'));
defItem('schem_tide_mantle',      'Schematic: Tidesovereign Mantle','📜', 12000, schem('tide_mantle'));
defItem('schem_rift_cleaver',     'Schematic: Rift Cleaver',        '📜', 25000, schem('rift_cleaver'));

// Devil Fruits — eat one for a permanent power. Only one at a time. The sea hates you (-40% fishing speed).
const fr = (fx, desc) => ({ type: 'fruit', fx, desc });
defItem('ember_fruit',    'Ember Fruit',    '🍎', 5000, fr({ dmg: 0.30 },                 '+30% damage. Your strikes burn.'));
defItem('quake_fruit',    'Quake Fruit',    '🍇', 5000, fr({ dmg: 0.60, atkSpeed: 0.15 }, '+60% damage, attacks 15% slower.'));
defItem('mist_fruit',     'Mist Fruit',     '🫐', 5000, fr({ dodge: 0.20 },               '20% chance to dodge enemy attacks.'));
defItem('gilded_fruit',   'Gilded Fruit',   '🍋', 5000, fr({ gold: 0.75 },                '+75% gold from every source.'));
defItem('bloom_fruit',    'Bloom Fruit',    '🍈', 5000, fr({ skill: 0.20 },               '+20% speed on every skill.'));
defItem('colossus_fruit', 'Colossus Fruit', '🍉', 5000, fr({ hp: 0.50 },                  '+50% max HP.'));
const FRUITS = ['ember_fruit', 'quake_fruit', 'mist_fruit', 'gilded_fruit', 'bloom_fruit', 'colossus_fruit'];

// Chests — rare finds you open from the Hero page. loot: weighted [item, weight, [min,max]].
// 'FRUIT' = random Devil Fruit, 'GEM' = random gem.
const chest = (gold, loot) => ({ type: 'chest', gold, loot });
defItem('herb_pouch',    "Wanderer's Pouch", '👛', 60, chest([20, 80], [
  ['healing_leaf', 30, [5, 15]], ['moonpetal', 25, [3, 8]], ['cloud_fern', 15, [2, 6]], ['soldier_pill', 12, [2, 5]],
  ['sage_lotus', 8, [1, 3]], ['jade', 6, [1, 1]], ['dragon_moss', 3, [1, 2]], ['shinobi_headband', 1, [1, 1]]]));
defItem('bird_nest',     'Bird Nest',        '🪺', 60, chest([20, 80], [
  ['pine_log', 30, [5, 15]], ['cedar_log', 20, [3, 8]], ['healing_leaf', 15, [3, 8]], ['bamboo', 12, [2, 5]],
  ['mistwood', 8, [1, 3]], ['jade', 6, [1, 1]], ['blossomwood', 3, [1, 2]], ['old_compass', 1, [1, 1]]]));
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
  woodcutting: { name: 'Woodcutting', realm: 'shinobi', icon: '🪓', type: 'gather', desc: 'Fell the trees around the hidden village. Logs become weapons and hafts, the undergrowth gives healing herbs, and wood patches the hulls of Orange Town ships.' },
  arts:      { name: 'Crafting',      realm: 'shinobi', icon: '🔨', type: 'craft',  desc: 'Turn wood, herbs and battle spoils into weapons, armor, healing pills and technique scrolls.' },
  mining:    { name: 'Reishi Mining', realm: 'soul',    icon: '⛏️', type: 'gather', desc: 'Mine ore crystallized from pure spiritual particles. Stay on a vein to dig deeper (more ore, more gems); a Mother Lode triples the next ores. Gems and Radiant ores hide in the rock.' },
  smithing:  { name: 'Smelting',      realm: 'soul',    icon: '🔥', type: 'craft',  desc: 'Smelt Soul City ore over a wood fire into ingots for weapons and refinement. Keep the forge hot for speed and Pure ingots (half-cost refinement); at White Heat every smelt doubles.' },
  fishing:   { name: 'Fishing',       realm: 'seas',    icon: '🎣', type: 'gather', desc: 'Cast your line into the endless blue. Fruit eaters fish 40% slower.' },
  cooking:   { name: 'Cooking',       realm: 'seas',    icon: '🍳', type: 'craft',  desc: 'A good cook keeps the crew alive. Food heals in combat, and packed as provisions it brings back more from expeditions.' },
  voyaging:  { name: 'Voyaging',      realm: 'seas',    icon: '⛵', type: 'voyage', desc: 'Send ships on expeditions of 10 minutes to 8 hours. They sail while you do anything else and come back with gold, spices, relics and treasure.' },
  character: { name: 'Character',    realm: 'combat',  icon: '🧍', type: 'combat', desc: 'Your hero. Every foe defeated gives XP; every level raises Attack, Defense, Vitality, Speed and Luck.' },
};

// One knob for the whole XP economy: XP per second of work grows smoothly with the level an action unlocks at.
// Crafting pays a bonus because it consumes materials. Tuned with a time-to-99 simulation:
// gathering ~1h to Lv25, ~8h to Lv50, ~40h to Lv75, ~230h to Lv99 (pace pass 2026-11-24: was 2.6,
// twice as fast, so levels came too cheaply to feel earned).
const XP_RATE = 1.3, XP_GROWTH = 1.03, CRAFT_BONUS = 1.4;
const xpFor = (level, time, craft) => Math.round(time * XP_RATE * Math.pow(XP_GROWTH, level) * (craft ? CRAFT_BONUS : 1));

const gather = (item, level, time) => ({ id: item, name: ITEMS[item].name, level, time, xp: xpFor(level, time), out: { [item]: 1 } });
const craft = (item, level, time, inputs, qty) => ({ id: item, name: ITEMS[item].name, level, time, xp: xpFor(level, time, true), in: inputs, out: { [item]: qty || 1 } });
// A recipe that also needs its schematic to be learned first.
const needs = (schemId, recipe) => Object.assign(recipe, { schem: schemId });

SKILLS.woodcutting.actions = [
  gather('pine_log', 1, 3),
  gather('cedar_log', 10, 3.5),
  gather('bamboo', 20, 4),
  gather('mistwood', 32, 4.5),
  gather('ironwood', 45, 5),
  gather('blossomwood', 58, 5.5),
  gather('spirit_oak', 72, 6),
  gather('heartwood', 88, 7),
];
// The forest floor: every tree also turns up herbs, and the old woods hold raw chakra.
// (Herbs and chakra used to have their own skills; the GDD's first world is Woodcutting + Crafting + Combat.)
const UNDERGROWTH = {
  pine_log: [['healing_leaf', 0.3, [1, 2]]], cedar_log: [['moonpetal', 0.25, [1, 2]]], bamboo: [['cloud_fern', 0.25, [1, 2]]],
  mistwood: [['shadowroot', 0.25, [1, 2]]], ironwood: [['sage_lotus', 0.25, [1, 2]], ['nature_essence', 0.08, [1, 1]]],
  blossomwood: [['spirit_orchid', 0.25, [1, 2]], ['nature_essence', 0.1, [1, 1]]],
  spirit_oak: [['dragon_moss', 0.25, [1, 2]], ['lightning_core', 0.06, [1, 1]]], heartwood: [['world_tree_leaf', 0.25, [1, 2]], ['sage_chakra', 0.06, [1, 1]]],
};
for (const a of SKILLS.woodcutting.actions) if (UNDERGROWTH[a.id]) a.extra = UNDERGROWTH[a.id];
SKILLS.arts.actions = [
  craft('training_kunai', 1, 4, { pine_log: 5 }),
  craft('soldier_pill', 1, 3, { healing_leaf: 2 }),
  craft('crystal_kunai', 4, 4, { chakra_shard: 5, pine_log: 2 }),
  craft('flak_vest', 7, 4, { healing_leaf: 8, chakra_shard: 3 }),
  craft('shinobi_headband', 12, 4, { moonpetal: 4, chakra_orb: 2 }),
  craft('moon_pill', 15, 3.5, { moonpetal: 2, chakra_orb: 1 }),
  craft('chakra_blade', 18, 5, { chakra_orb: 8, cloud_fern: 4, cedar_log: 4 }),
  craft('chakra_mesh', 22, 5, { cloud_fern: 6, chakra_orb: 8, moonpetal: 4 }),
  needs('schem_fog_cleaver', craft('fog_cleaver', 26, 6, { mist_steel: 6, storm_chakra: 5, bamboo: 6 })),
  craft('shadow_pill', 30, 4, { shadowroot: 2, storm_chakra: 1 }),
  needs('schem_sealing_talisman', craft('sealing_talisman', 32, 6, { beast_fang: 4, shadowroot: 6, storm_chakra: 6 })),
  craft('frost_garb', 34, 5, { frost_crystal: 8, cloud_fern: 6, storm_chakra: 4 }),
  craft('sage_robe', 40, 6, { shadowroot: 6, nature_essence: 6, void_stone: 6 }),
  needs('schem_ashen_fang', craft('ashen_fang', 42, 7, { ashen_tail: 2, mist_steel: 10, nature_essence: 6 })),
  craft('sage_pill', 48, 4, { sage_lotus: 2, nature_essence: 1, wisp_flame: 1 }),
  needs('schem_ferryman_robe', craft('ferryman_robe', 56, 7, { bone_ivory: 5, husk_mask: 8, spirit_orchid: 4 })),
  craft('beast_cloak', 62, 7, { beast_ember: 6, spirit_orchid: 6, starsteel: 8 }),
  craft('storm_pill', 72, 5, { dragon_moss: 2, lightning_core: 1, abyssal_essence: 1 }),
  needs('schem_tide_mantle', craft('tide_mantle', 84, 9, { tide_heart: 1, leviathan_scale: 6, phantom_silk: 8, sage_chakra: 4 })),
  craft('storm_mantle', 86, 8, { phantom_silk: 8, sage_chakra: 4, sunstone: 8 }),
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
  craft('iron_wakizashi', 1, 4, { spirit_ore: 5, pine_log: 2 }),
  craft('jade_amulet', 10, 4, { jade: 1, silver_reishi: 3 }),
  craft('spirit_katana', 15, 5, { silver_reishi: 8, soul_fragment: 10 }),
  craft('reishi_ring', 25, 5, { frost_crystal: 4, spirit_core: 4 }),
  craft('awakened_blade', 32, 6, { void_stone: 10, spirit_core: 5, chakra_orb: 5 }),
  needs('schem_reapers_edge', craft('reapers_edge', 40, 7, { husk_heart: 5, void_stone: 12, spirit_core: 8, storm_chakra: 6 })),
  craft('sapphire_charm', 42, 5, { sapphire: 1, void_stone: 4, wisp_flame: 6 }),
  craft('black_warhammer', 50, 6, { black_iron: 12, husk_mask: 4 }),
  craft('ruby_crest', 56, 6, { ruby: 1, black_iron: 4, grave_dust: 4 }),
  craft('sovereign_blade', 62, 7, { starsteel: 12, husk_mask: 6, beast_ember: 4 }),
  needs('schem_eclipse_blade', craft('eclipse_blade', 66, 8, { sovereign_shard: 2, starsteel: 12, abyssal_essence: 6, ashen_tail: 2 })),
  needs('schem_kraken_compass', craft('kraken_compass', 70, 7, { tide_pearl: 5, sapphire: 2, giant_octopus: 3 })),
  craft('sunforged_bow', 75, 8, { sunstone: 12, abyssal_essence: 6, spirit_orchid: 4 }),
  needs('schem_stormcaller', craft('stormcaller', 78, 9, { leviathan_scale: 4, sunstone: 10, lightning_core: 4, tide_pearl: 3 })),
  craft('void_band', 80, 7, { void_diamond: 1, sunstone: 4, echo_soul: 2 }),
  needs('schem_rift_cleaver', craft('rift_cleaver', 90, 10, { rift_ore: 20, echo_soul: 10, rift_shard: 1, ashen_tail: 2, sovereign_shard: 2, tide_heart: 1, heartwood: 5 })),
];
// Smelting became Smelting (GDD): its weapon and jewelry recipes move to Crafting, made from ingots
// (2 ore → 1 ingot, so an old recipe's ore count is halved). Smelting turns ore into ingots over a wood fire.
const INGOT_OF = { spirit_ore: 'reishi_ingot', silver_reishi: 'silver_ingot', frost_crystal: 'frost_ingot', void_stone: 'void_ingot',
  black_iron: 'black_ingot', starsteel: 'star_ingot', sunstone: 'sun_ingot', rift_ore: 'rift_ingot' };
for (const a of SKILLS.smithing.actions) {
  const inp = {};
  for (const k in a.in) { const ig = INGOT_OF[k]; if (ig) inp[ig] = (inp[ig] || 0) + Math.ceil(a.in[k] / 2); else inp[k] = a.in[k]; }
  a.in = inp;
  SKILLS.arts.actions.push(a);
}
// Carvings: one recipe per tree, made from that wood alone, so Crafting always has a recipe you can
// spam with nothing but Woodcutting. They are trade goods: 1 log in, worth 1.6× the log at sale.
// Same level and time as the tree, so an hour of carving uses about an hour of chopping.
const CARVINGS = [
  ['pine_crate', 'Pine Crate', 'pine_log'], ['cedar_toolbox', 'Cedar Toolbox', 'cedar_log'], ['bamboo_puppet', 'Bamboo Puppet', 'bamboo'],
  ['mist_mask', 'Mistwood Mask', 'mistwood'], ['ironwood_beam', 'Ironwood Beam', 'ironwood'], ['blossom_lantern', 'Blossom Lantern', 'blossomwood'],
  ['oak_totem', 'Spirit Oak Totem', 'spirit_oak'], ['heart_shrine', 'Heartwood Shrine', 'heartwood'],
];
for (const [id, name, log] of CARVINGS) {
  const tree = SKILLS.woodcutting.actions.find((a) => a.id === log);
  defItem(id, name, '🪵', Math.round(ITEMS[log].value * 1.6), { type: 'trade', desc: `Carved from ${ITEMS[log].name}. A trade good: ships take it as cargo and sell it abroad for 3× its value.` });
  SKILLS.arts.actions.push(craft(id, tree.level, tree.time, { [log]: 1 }));
}
SKILLS.arts.actions.sort((a, b) => a.level - b.level);
SKILLS.smithing.actions = [
  craft('reishi_ingot', 1, 3, { spirit_ore: 2, pine_log: 1 }),
  craft('silver_ingot', 12, 3.5, { silver_reishi: 2, cedar_log: 1 }),
  craft('frost_ingot', 22, 4, { frost_crystal: 2, bamboo: 1 }),
  craft('void_ingot', 32, 4.5, { void_stone: 2, mistwood: 1 }),
  craft('black_ingot', 45, 5, { black_iron: 2, ironwood: 1 }),
  craft('star_ingot', 58, 5.5, { starsteel: 2, blossomwood: 1 }),
  craft('sun_ingot', 72, 6, { sunstone: 2, spirit_oak: 1 }),
  craft('rift_ingot', 88, 7, { rift_ore: 2, heartwood: 1 }),
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
  craft('crab_dumplings', 20, 2.5, { sea_crab: 1 }),
  craft('spirit_ramen', 25, 3, { reef_bass: 1, moonpetal: 1, wisp_flame: 1 }),
  craft('marlin_steak', 30, 3, { blue_marlin: 1 }),
  craft('eel_bowl', 45, 3, { tidal_eel: 1 }),
  craft('takoyaki', 58, 3.5, { giant_octopus: 1 }),
  craft('angler_feast', 70, 3.5, { abyss_angler: 1, sage_lotus: 1 }),
  craft('sea_king_curry', 88, 4, { sea_king: 1, world_tree_leaf: 1 }),
];
// Voyages: loot.table = one guaranteed roll; loot.rare = independent chances ('FRUIT' = random Devil Fruit)
const voyage = (id, name, icon, level, time, input, loot) => ({ id, name, icon, level, time, xp: xpFor(level, time, true), in: input, loot });
SKILLS.voyaging.actions = [
  voyage('coastal', 'Coastal Run', '🏝️', 1, 10, { grilled_minnow: 2, pine_log: 2 },
    { gold: [20, 60], table: [['minnow', [2, 5]], ['reef_bass', [1, 2]]], rare: [['old_compass', 1 / 50], ['tide_pearl', 1 / 60]] }),
  voyage('merchant', 'Merchant Route', '🚢', 12, 12, { bass_stew: 2, cedar_log: 2 },
    { gold: [70, 180], table: [['reef_bass', [2, 4]], ['minnow', [3, 6]], ['sea_crab', [1, 2]]], rare: [['sea_charm', 1 / 60], ['old_compass', 1 / 40], ['FRUIT', 1 / 400]] }),
  voyage('cove', "Smuggler's Cove", '🏴‍☠️', 25, 14, { crab_dumplings: 2, bamboo: 2 },
    { gold: [150, 350], table: [['sea_crab', [2, 4]], ['blue_marlin', [1, 2]]], rare: [['sapphire', 1 / 30], ['tide_pearl', 1 / 30], ['FRUIT', 1 / 300]] }),
  voyage('current', 'Treacherous Current', '🌊', 38, 16, { marlin_steak: 2, mistwood: 2 },
    { gold: [250, 600], table: [['blue_marlin', [2, 4]], ['tidal_eel', [1, 2]]], rare: [['sea_charm', 1 / 40], ['leviathan_scale', 1 / 40], ['FRUIT', 1 / 200]] }),
  voyage('stormbelt', 'Storm Belt Crossing', '⛈️', 55, 20, { eel_bowl: 2, ironwood: 2 },
    { gold: [600, 1400], table: [['tidal_eel', [2, 4]], ['abyss_angler', [1, 2]]], rare: [['storm_crown', 1 / 120], ['tide_pearl', 1 / 25], ['FRUIT', 1 / 120]] }),
  voyage('ghostfleet', 'Ghost Fleet Waters', '👻', 68, 22, { takoyaki: 2, blossomwood: 2 },
    { gold: [1000, 2400], table: [['giant_octopus', [1, 3]], ['ghost_ray', [1, 3]]], rare: [['ruby', 1 / 25], ['leviathan_scale', 1 / 30], ['FRUIT', 1 / 90]] }),
  voyage('worldsedge', 'Edge of the World', '🌌', 82, 26, { angler_feast: 2, spirit_oak: 2 },
    { gold: [1800, 4000], table: [['lantern_squid', [1, 3]], ['abyss_angler', [1, 3]]], rare: [['storm_crown', 1 / 60], ['leviathan_scale', 1 / 20], ['tide_heart', 1 / 200], ['FRUIT', 1 / 50]] }),
];
SKILLS.character.actions = [];

/* --------------------------------------------- rare finds, pets, milestones */
// Rolled on every completed action of that skill (chance per action). 'GEM' rolls GEM_TABLE.
const RARE_FINDS = {
  woodcutting: [['bird_nest', 1 / 150], ['herb_pouch', 1 / 300]],
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
  { id: 'woodpecker',    name: 'Woodpecker',         icon: '🐦', skill: 'woodcutting' },
  { id: 'scroll_cat',    name: 'Scroll Cat',         icon: '🐈', skill: 'arts' },
  { id: 'ore_badger',    name: 'Ore Badger',         icon: '🦡', skill: 'mining' },
  { id: 'forge_newt',    name: 'Forge Salamander',   icon: '🦎', skill: 'smithing' },
  { id: 'sea_otter',     name: 'Sea Otter',          icon: '🦦', skill: 'fishing' },
  { id: 'galley_mouse',  name: 'Galley Mouse',       icon: '🐭', skill: 'cooking' },
  { id: 'ship_parrot',   name: 'Ship Parrot',        icon: '🦜', skill: 'voyaging' },
  { id: 'ashen_kit',     name: 'Ashen Kit',          icon: '🐕', zone: 'fox',         chance: 1 / 30 },
  { id: 'hollow_pup',    name: 'Husk Pup',           icon: '🐺', zone: 'sovereign',   chance: 1 / 30 },
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
// Character level: each milestone gives +4% damage, defense and max HP.
const COMBAT_MILESTONES = [10, 25, 50, 75, 99];

/* ----------------------------------------------------------------- combat */
// enemy: hp, atk (max hit), def, spd (seconds per attack), xp, gold [min,max], drops [[item, chance, [min,max]]]
const en = (name, icon, hp, atk, def, spd, xp, gold, drops) => ({ name, icon, hp, atk, def, spd, xp, gold, drops: drops || [] });

const ZONES = [
  // World 1 — Leaf Village
  { id: 'training', name: 'Training Grounds', realm: 'shinobi', rec: 1, enemies: [
    en('Bandit Thug', '🗡️', 25, 4, 0, 3, 10, [2, 6], [['healing_leaf', 0.4, [1, 3]], ['pine_log', 0.3, [2, 4]], ['chakra_shard', 0.15, [1, 2]], ['soldier_pill', 0.08, [1, 2]], ['old_compass', 1 / 400, [1, 1]]]),
    en('Rogue Apprentice', '🥷', 35, 5, 2, 2.8, 15, [4, 9], [['chakra_shard', 0.3, [1, 3]], ['soldier_pill', 0.05, [1, 1]], ['shinobi_headband', 1 / 150, [1, 1]]]),
  ] },
  { id: 'mist', name: 'Misty Forest', realm: 'shinobi', rec: 10, enemies: [
    en('Mist Assassin', '🌫️', 100, 14, 8, 2.6, 32, [10, 22], [['moonpetal', 0.3, [1, 3]], ['chakra_orb', 0.15, [1, 2]], ['sealed_scroll', 1 / 80, [1, 1]], ['mist_steel', 0.12, [1, 2]], ['senbon', 1 / 40, [1, 1]], ['schem_fog_cleaver', 1 / 80, [1, 1]]]),
    en('Puppet Drone', '🪆', 130, 12, 15, 3, 36, [12, 24], [['chakra_orb', 0.25, [1, 2]], ['mist_steel', 0.18, [1, 2]], ['puppet_plating', 1 / 40, [1, 1]], ['bird_nest', 1 / 40, [1, 1]]]),
  ] },
  { id: 'ravine', name: 'Fang Ravine', realm: 'shinobi', rec: 22, enemies: [
    en('Ninken Alpha', '🐺', 220, 24, 18, 2.4, 65, [20, 40], [['shadowroot', 0.3, [1, 3]], ['storm_chakra', 0.15, [1, 2]], ['sealed_scroll', 1 / 60, [1, 1]], ['beast_fang', 0.15, [1, 2]], ['wolf_fang', 1 / 50, [1, 1]], ['herb_pouch', 1 / 40, [1, 1]], ['schem_sealing_talisman', 1 / 100, [1, 1]]]),
    en('Stone Golem', '🗿', 320, 22, 35, 3.2, 80, [25, 45], [['storm_chakra', 0.25, [1, 2]], ['mist_steel', 0.15, [1, 3]], ['jade', 1 / 30, [1, 1]], ['golem_heart', 1 / 60, [1, 1]]]),
  ] },
  { id: 'fox', name: 'Den of the Ashen Fox', realm: 'shinobi', rec: 32, boss: true, enemies: [
    en('Ashen Fox Beast', '🦊', 1600, 45, 35, 2.5, 700, [300, 600], [['storm_chakra', 1, [2, 4]], ['beast_ember', 0.5, [1, 2]], ['ashen_tail', 0.5, [1, 1]], ['sealed_scroll', 0.25, [1, 2]], ['fox_tail_charm', 1 / 8, [1, 1]], ['schem_ashen_fang', 1 / 6, [1, 1]]]),
  ] },
  // World 2 — Orange Town
  { id: 'shoals', name: 'Rookie Shoals', realm: 'seas', rec: 38, enemies: [
    en('Navy Recruit', '⚓', 420, 35, 30, 2.6, 95, [30, 60], [['reef_bass', 0.4, [2, 4]], ['marine_coat', 1 / 60, [1, 1]], ['rusty_cutlass', 1 / 30, [1, 1]]]),
    en('Cannon Brute', '💣', 540, 40, 40, 2.6, 115, [35, 70], [['minnow', 0.4, [2, 4]], ['hand_cannon', 1 / 60, [1, 1]]]),
  ] },
  { id: 'reef', name: 'Merfolk Reef', realm: 'seas', rec: 46, enemies: [
    en('Merfolk Brawler', '🧜', 950, 60, 50, 3, 190, [50, 90], [['blue_marlin', 0.4, [2, 4]], ['tide_pearl', 0.15, [1, 1]], ['sea_charm', 1 / 40, [1, 1]], ['sunken_chest', 1 / 40, [1, 1]], ['schem_kraken_compass', 1 / 100, [1, 1]]]),
    en('Reef Shark', '🦈', 780, 70, 45, 2.2, 180, [50, 90], [['tidal_eel', 0.3, [1, 3]], ['tide_pearl', 0.1, [1, 1]], ['shark_tooth', 1 / 60, [1, 1]]]),
  ] },
  { id: 'storm', name: 'The Storm Belt', realm: 'seas', rec: 55, enemies: [
    en('Sea Leviathan', '🐉', 1400, 90, 70, 2.4, 290, [80, 140], [['abyss_angler', 0.3, [1, 3]], ['leviathan_scale', 0.2, [1, 2]], ['leviathan_mail', 1 / 80, [1, 1]], ['FRUIT', 1 / 200, [1, 1]]]),
    en('Storm Corsair', '🏴‍☠️', 1250, 100, 60, 2.5, 280, [80, 140], [['sea_crab', 0.3, [1, 3]], ['leviathan_scale', 0.1, [1, 1]], ['treasure_map', 1 / 60, [1, 1]], ['corsair_cutlass', 1 / 80, [1, 1]], ['schem_stormcaller', 1 / 150, [1, 1]]]),
  ] },
  { id: 'admiral', name: "Admiral's Flagship", realm: 'seas', rec: 64, boss: true, enemies: [
    en('Admiral of the Tide', '🎖️', 9000, 160, 110, 2.4, 2800, [1500, 3000], [['tide_heart', 0.6, [1, 1]], ['nature_essence', 0.5, [2, 4]], ['treasure_map', 0.15, [1, 1]], ['admiral_coat', 1 / 8, [1, 1]], ['storm_crown', 1 / 8, [1, 1]], ['FRUIT', 1 / 25, [1, 1]], ['schem_tide_mantle', 1 / 6, [1, 1]], ['schem_rift_cleaver', 1 / 5, [1, 1]]]),
  ] },
  { id: 'districts', name: 'Outer Districts', realm: 'soul', rec: 68, enemies: [
    en('Lesser Husk', '👹', 2000, 130, 100, 2.5, 380, [120, 220], [['soul_fragment', 0.5, [2, 5]], ['wisp_flame', 0.3, [1, 3]], ['husk_heart', 0.1, [1, 1]], ['husk_claw', 1 / 120, [1, 1]]]),
    en('Lurking Husk', '👺', 2600, 150, 120, 3, 440, [150, 260], [['spirit_core', 0.2, [1, 2]], ['husk_heart', 0.12, [1, 1]], ['reaper_scarf', 1 / 120, [1, 1]], ['lost_lantern', 1 / 50, [1, 1]], ['schem_reapers_edge', 1 / 120, [1, 1]]]),
  ] },
  { id: 'desert', name: 'Desert of Endless Night', realm: 'soul', rec: 74, enemies: [
    en('Towering Husk', '🏜️', 3400, 200, 150, 2.3, 620, [200, 350], [['husk_mask', 0.2, [1, 2]], ['husk_heart', 0.15, [1, 2]], ['husk_carapace', 1 / 150, [1, 1]]]),
    en('Sand Wraith', '🌪️', 3000, 240, 130, 2.1, 600, [200, 350], [['void_stone', 0.3, [1, 3]], ['grave_dust', 0.2, [1, 2]], ['sapphire', 1 / 60, [1, 1]], ['wraith_sickle', 1 / 150, [1, 1]]]),
  ] },
  { id: 'spire', name: 'The Bone Spire', realm: 'soul', rec: 82, enemies: [
    en('Masked Lancer', '💀', 6500, 320, 200, 3, 1100, [350, 600], [['husk_mask', 0.3, [1, 3]], ['abyssal_essence', 0.12, [1, 2]], ['bone_ivory', 0.15, [1, 2]], ['bone_lance', 1 / 200, [1, 1]]]),
    en('Bone Priest', '☠️', 5200, 360, 190, 2.2, 1050, [350, 600], [['grave_dust', 0.15, [1, 2]], ['phantom_silk', 0.08, [1, 1]], ['bone_ivory', 0.15, [1, 2]], ['ruby', 1 / 80, [1, 1]], ['prayer_beads', 1 / 200, [1, 1]], ['schem_ferryman_robe', 1 / 120, [1, 1]]]),
  ] },
  { id: 'sovereign', name: 'Throne of Masks', realm: 'soul', rec: 90, boss: true, enemies: [
    en('Masked Sovereign', '🎭', 22000, 520, 280, 2.4, 9000, [6000, 12000], [['abyssal_essence', 1, [3, 6]], ['phantom_silk', 0.6, [1, 3]], ['echo_soul', 0.5, [1, 2]], ['lost_lantern', 0.5, [1, 3]], ['sovereign_shard', 0.6, [1, 2]], ['sovereign_mask', 1 / 10, [1, 1]], ['sovereign_cloak', 1 / 12, [1, 1]], ['schem_eclipse_blade', 1 / 6, [1, 1]]]),
  ] },
  { id: 'convergence', name: 'The Convergence', realm: 'rift', rec: 99, boss: true, enemies: [
    en('Rift Emperor', '👁️', 60000, 900, 400, 2.2, 30000, [30000, 60000], [['rift_shard', 1, [1, 1]], ['rift_eye', 1 / 25, [1, 1]], ['FRUIT', 1 / 2, [1, 1]]]),
  ] },
];
REALMS.rift = { name: 'The Rift', icon: '🔱', color: '#ff3fb4', tagline: 'Where every world tears into one.', hidden: true };

const BOUNTY_RANKS = [
  [0, 'Nobody'], [5e3, 'Rookie Outlaw'], [5e4, 'Rising Star'], [5e5, 'Warlord'],
  [5e6, 'Sea Emperor'], [5e7, 'Multiverse Legend'],
];

/* ------------------------------------------------- energy disciplines (Inner Power) */
// GDD: one shared energy mastery; each world adds its discipline. You split your energy between them
// and they level forever, even offline. Each has a combat effect plus an idle one.
// fx: what one level gives (applied in game.js / systems.js / techniques.js). world: opens with that world.
const TRAININGS = [
  { id: 'chakra',  name: 'Chakra',        world: 'shinobi', base: 25, desc: '+1% technique power, +0.2% skill speed',  fx: { tech: 0.01, speed: 0.002 } },
  { id: 'haki',    name: 'Resolve',       world: 'seas',    base: 30, desc: '+0.5% damage, +1% gold',                  fx: { dmg: 0.005, gold: 0.01 } },
  { id: 'reiatsu', name: 'Soul Force',    world: 'soul',    base: 35, desc: '+1% max HP, +1% weapon XP',               fx: { hp: 0.01, wxp: 0.01 } },
  { id: 'ki',      name: 'Ki',            world: 'ki',      base: 40, desc: '+1% defense, +0.2 Speed',                 fx: { def: 0.01, spd: 0.2 } },
  { id: 'cursed',  name: 'Cursed Energy', world: 'hex',     base: 50, desc: '+0.5% XP on every skill, +0.5% technique power', fx: { xp: 0.005, tech: 0.005 } },
  { id: 'nen',     name: 'Aura',          world: 'hunter',  base: 60, desc: '+0.1 Luck, +1% companion bonus',          fx: { luck: 0.1, pet: 0.01 } },
];
const disciplineOpen = (t) => realmOpen(t.world);
// Total bonus of one kind across the disciplines (level × per-level value).
const discFx = (k) => TRAININGS.reduce((a, t) => a + (t.fx[k] || 0) * (S.energy.lvl[t.id] || 0), 0);

/* ------------------------------------------------------------------- shop */
const SHOP = [
  { id: 'tools_shinobi', cat: 'Tools', realm: 'shinobi', name: 'Shinobi Tool Pouch', icon: '🎒', desc: '+10% speed for Leaf Village skills per tier.', costs: [150, 1200, 6000, 30000, 150000] },
  { id: 'tools_soul',    cat: 'Tools', realm: 'soul', name: 'Soul Lantern',       icon: '🏮', desc: '+10% speed for Soul City skills per tier.', costs: [150, 1200, 6000, 30000, 150000] },
  { id: 'tools_seas',    cat: 'Tools', realm: 'seas', name: 'Ship Upgrades',      icon: '🛠️', desc: '+10% speed for Orange Town skills per tier.', costs: [150, 1200, 6000, 30000, 150000] },
  { id: 'abundance',     cat: 'Charms', name: 'Abundance Charm',   icon: '🍀', desc: '+5% chance per tier to double gathering output.', costs: [500, 5000, 50000, 500000] },
  { id: 'lucky_coin',    cat: 'Charms', name: 'Lucky Coin',        icon: '🎲', desc: '+8 Luck per tier.', costs: [2000, 20000, 200000] },
  { id: 'satchel',       cat: 'Charms', name: 'Auto-Eat Satchel',  icon: '👝', desc: 'Eat earlier: 40% → 55% → 70% HP.', costs: [1000, 20000] },
  { id: 'buy_pills',     cat: 'Supplies', name: '10× Soldier Pill',   icon: '💊', desc: 'Heals in battle.', cost: 80, give: ['soldier_pill', 10] },
  { id: 'buy_shards',    cat: 'Supplies', name: '20× Chakra Shard',   icon: '🔹', desc: 'Crafting material.', cost: 60, give: ['chakra_shard', 20] },
];

/* ------------------------------------------------------------ the path (main quests) */
// One step at a time, so a new player always knows the next thing to do (2026-11-25 rework: no dialogue,
// each step says why it matters; every stage of every world is a step; each world ends the same way:
// its guardian, its dungeon, its gate). prog() returns [current]; go = the view the Go button opens.
// Saves store the index (S.goal) and the path version (S.goalV): game.js maps an old index through
// OLD_GOAL_IDS. Keep ICONS.goal (icons.js, by id) and GUIDE (guide.js, by id) in step.
const QUEST_MADE = new Set();   // items a quest step asks you to make (forge.js: always discovered)
const gMade = (id) => { QUEST_MADE.add(id); return () => [S.stats.made[id] || 0]; };
const gKills = (zone) => () => [S.combat.kills[zone] || 0];
const gLvl = (k) => () => [S.skills[k] ? skillLv(k) : 0];
const gGate = (r) => () => [S.gates[r] ? 1 : 0];
const dgDone = (id) => () => [typeof dgState === 'function' ? dgState(id).clears : 0];
let PATH_CH = null;
const gChapter = (id) => { PATH_CH = id; };
// id, text, go, n, prog, gold, items on claim, why (one line: what it opens or teaches)
const gStep = (id, text, go, n, prog, reward, items, why) => ({ id, ch: PATH_CH, text, go, n, prog, reward, items: items || {}, why: why || '' });
// A stage step: its text names the stage once every world has added its zones (story.js).
const stage10 = (id, zone, name, reward, items, why, n) => Object.assign(gStep(id, `Defeat ${n || 10} foes in ${name}`, 'battle', n || 10, gKills(zone), reward, items, why), { zone });
const GOALS = [
  gChapter('leaf'),
  gStep('chop10', 'Chop 10 Pine Logs', 'realm:shinobi:woodcutting', 10, gMade('pine_log'), 20, { healing_leaf: 6 }),
  gStep('wc5', 'Reach Woodcutting level 3', 'realm:shinobi:woodcutting', 3, gLvl('woodcutting'), 25, { bird_nest: 1 }, 'Level 3 opens Crafting.'),
  gStep('sword', 'Carve a Wooden Sword', 'realm:shinobi:arts', 1, gMade('training_kunai'), 30, { soldier_pill: 3 }, 'Crafting turns wood into gear. This is your first weapon.'),
  gStep('equip_sword', 'Equip your Wooden Sword', 'character', 1, () => [S.equip.weapon ? 1 : 0], 30, { chakra_shard: 10 }, 'Gear does nothing in the Bank: wear it.'),
  gStep('pills5', 'Brew 5 Soldier Pills', 'realm:shinobi:arts', 5, gMade('soldier_pill'), 40, { soldier_pill: 5 }, 'Pills heal you in battle. Five of them open the Battlefield.'),
  gStep('food', 'Equip food for battle', 'character', 1, () => [S.combat.food ? 1 : 0], 60, { soldier_pill: 5 }, 'You eat on your own when your HP drops low.'),
  gStep('training10', 'Defeat 10 foes at the Training Grounds', 'battle', 10, gKills('training'), 60, { scroll_shinobi: 1 }, 'Ten wins open the next stage, the Misty Forest.'),
  gStep('tech1', 'Learn a technique', 'techniques', 1, () => [Object.keys(S.tech.lv).length], 150, { herb_pouch: 1 }, 'Foes drop scrolls. Read one on the Techniques page: it teaches a technique that fires on its own in battle.'),
  gStep('char10', 'Reach Character level 10', 'battle', 10, () => [charLv()], 200, { crystal_kunai: 1 }, 'Every level raises your five stats. Fights give the XP.'),
  gStep('market', 'Buy any upgrade in the Market', 'market', 1, () => [['tools_shinobi', 'tools_soul', 'tools_seas', 'abundance', 'satchel', 'lucky_coin'].reduce((a, k) => a + (S.shop[k] || 0), 0)], 300, { sealed_scroll: 1 }, 'Gold buys tools that make a whole world faster.'),
  stage10('mist10', 'mist', 'the Misty Forest', 400, { mist_steel: 2 }, 'Opens Fang Ravine. Its steel goes into better blades.'),
  gStep('wear3', 'Wear three pieces of gear', 'character', 3, () => [GEAR_SLOTS.filter((s) => S.equip[s]).length], 450, { chakra_orb: 6 }, 'A weapon and six armour slots. Crafting makes all of them.'),
  gStep('techup', 'Level up a technique', 'techniques', 1, () => [Object.values(S.tech.lv).some((l) => l > 1) ? 1 : 0], 500, { scroll_shinobi: 2 }, 'A scroll that draws a technique you know raises it one level. Levels 5 and 10 change how it works.'),
  gStep('char20', 'Reach Character level 20', 'battle', 20, () => [charLv()], 500, { moon_pill: 10 }, 'Level 20 opens the Energy Disciplines.'),
  gStep('energy', 'Put energy into any training', 'power', 1, () => [energyUsed() > 0 ? 1 : 0], 500, { chakra_orb: 10 }, 'Disciplines grow on their own, even offline, and never reset.'),
  gStep('arts20', 'Reach Crafting level 20', 'realm:shinobi:arts', 20, gLvl('arts'), 600, { mist_steel: 3 }, "The Leaf's best gear is crafted between levels 18 and 30."),
  gStep('schem', 'Learn a schematic from a defeated foe', 'battle', 1, () => [Object.keys(S.known).length], 600, { mist_steel: 4 }, 'A schematic teaches a legendary recipe for good.'),
  stage10('ravine25', 'ravine', 'Fang Ravine', 800, { storm_chakra: 10 }, "Its foes hit the way the Ashen Fox does: a good test before its den.", 25),
  gStep('fox', 'Defeat the Ashen Fox Beast', 'battle', 1, gKills('fox'), 1000, { shadow_pill: 10, sealed_scroll: 2 }, 'The guardian of the Leaf. Its tail is part of the gate offering.'),
  gStep('dg_archive', 'Clear the Sealed Archive', 'battle#gs-dungeons', 1, dgDone('archive'), 1100, { moon_pill: 10 }, 'Each guardian opens a dungeon: five rooms, no rest, a set to collect.'),
  gStep('gate_seas', 'Open the Hidden Harbour', 'home', 1, gGate('seas'), 1200, {}, 'The offering opens a new world: Orange Town.'),
  gChapter('blue'),
  gStep('minnow10', 'Catch 10 Minnows', 'realm:seas:fishing', 10, gMade('minnow'), 600, { sea_salt: 10 }, 'Fish become food, and food heals far more than pills.'),
  gStep('fish5', 'Reach Fishing level 5', 'realm:seas:fishing', 5, gLvl('fishing'), 600, { minnow: 10 }, 'Level 5 opens Cooking.'),
  gStep('cook5', 'Cook 5 Grilled Minnows', 'realm:seas:cooking', 5, gMade('grilled_minnow'), 700, { peppercorns: 10 }, 'Cooked fish heals in battle. Equip it as your food.'),
  gStep('cook10', 'Reach Cooking level 10', 'realm:seas:cooking', 10, gLvl('cooking'), 800, { reef_bass: 10 }, 'Level 10 opens Voyaging; level 8 the spice rack.'),
  gStep('season5', 'Season 5 dishes', 'realm:seas:cooking', 5, () => [S.stats.seasoned || 0], 900, { coral_lemon: 5, fire_chili: 5 }, 'A seasoned dish gives a battle buff when you eat it.'),
  gStep('voyage3', 'Return from 3 voyages', 'realm:seas:voyaging', 3, () => [S.stats.voyages], 1000, { cedar_log: 20 }, 'Ships sail while you do anything else, offline too.'),
  stage10('shoals10', 'shoals', 'Rookie Shoals', 1000, { scroll_seas: 1 }, 'Opens Merfolk Reef. The sea hits much harder than the forest.'),
  gStep('perfect', 'Cook a Perfect dish', 'realm:seas:cooking', 1, () => [qTotal('cooking')], 1200, { gold_saffron: 2 }, 'Perfect dishes heal 50% more. Each goes in the Perfect Log.'),
  stage10('reef10', 'reef', 'Merfolk Reef', 1500, { tide_pearl: 2 }, 'Opens the Storm Belt.'),
  stage10('storm10', 'storm', 'the Storm Belt', 1800, { leviathan_scale: 2 }, "Opens the Admiral's Flagship."),
  gStep('shiny', 'Catch a Shiny fish', 'realm:seas:fishing', 1, () => [qTotal('fishing')], 2000, { sunken_chest: 1 }, 'Shiny catches are rare. Mastery of a fish raises the odds.'),
  gStep('admiral', 'Defeat the Admiral of the Tide', 'battle', 1, gKills('admiral'), 3000, { treasure_map: 1 }, 'The guardian of the sea. Its heart opens the next gate.'),
  gStep('dg_wreck', "Clear Davy's Wreck", 'battle#gs-dungeons', 1, dgDone('wreck'), 3200, { tide_pearl: 3 }, 'The Admiral opened a dungeon. Its set steals life.'),
  gStep('gate_soul', 'Open the Drowned Seal', 'home', 1, gGate('soul'), 3500, {}, 'The offering opens a new world: Soul City.'),
  gChapter('soul'),
  gStep('ore20', 'Mine 20 Reishi Ore', 'realm:soul:mining', 20, gMade('spirit_ore'), 2000, { jade: 1 }, 'Ore becomes ingots, and ingots become better weapons.'),
  gStep('ingot10', 'Smelt 10 Reishi Ingots', 'realm:soul:smithing', 10, gMade('reishi_ingot'), 2500, { reishi_ingot: 10 }, 'Ingots forge gear and refine the weapons you own.'),
  stage10('districts10', 'districts', 'the Outer Districts', 2500, { husk_heart: 2 }, 'Opens the Desert of Endless Night.'),
  gStep('katana', 'Craft a Nameless Katana from ingots', 'realm:shinobi:arts', 1, gMade('spirit_katana'), 3000, { silver_ingot: 6 }, 'Soul City weapons are forged from its ingots.'),
  stage10('desert10', 'desert', 'the Desert of Endless Night', 3200, { phantom_silk: 4 }, 'Opens the Spire.'),
  gStep('refine1', 'Refine a weapon to +1', 'hero', 1, () => [S.arms.some((a) => a.ref > 0) ? 1 : 0], 3500, { jade: 1 }, 'Refining makes the weapon you love keep up with new worlds.'),
  gStep('awaken', 'Awaken a weapon', 'hero', 1, () => [S.arms.some((a) => a.awk > 0) ? 1 : 0], 4000, { spirit_core: 10 }, 'An awakened weapon gets an element and its family power.'),
  stage10('spire10', 'spire', 'the Spire', 4500, { void_stone: 3 }, "Opens the Sovereign's throne."),
  gStep('reiatsu10', 'Reach Soul Force level 10', 'power', 10, () => [S.energy.lvl.reiatsu || 0], 5000, { soul_fragment: 20 }, 'Each world adds a discipline. Soul Force hardens your body.'),
  gStep('renown25', 'Reach Renown 25 in any world', 'home', 25, () => [Math.max(0, ...WORLD_ORDER.map(renownLv))], 6000, { lost_lantern: 1 }, 'Renown grows with all you do in a world. It opens Ascension.'),
  gStep('sovereign', 'Defeat the Masked Sovereign', 'battle', 1, gKills('sovereign'), 10000, { ruby: 1 }, 'The guardian of the dead. Its mask is part of the toll.'),
  gStep('dg_catacombs', 'Clear the Husk Catacombs', 'battle#gs-dungeons', 1, dgDone('catacombs'), 11000, { spirit_core: 10 }, 'Its set rewards finishing blows.'),
  gStep('gate_ki', 'Climb the Throne Stair', 'home', 1, gGate('ki'), 12000, {}, 'The toll opens a new world: Titan Planet.'),
  gChapter('ki'),
  gStep('gravity10', 'Reach Gravity Training level 10', 'realm:ki:gravity', 10, gLvl('gravity'), 8000, { ki_spark: 10 }, 'Gravity Training makes you stronger the longer you train.'),
  gStep('crop1', 'Harvest your first crop', 'realm:ki:farming', 1, () => [S.stats.harvests || 0], 8000, { seed_sun_wheat: 5 }, 'Crops grow on their own and feed new dishes.'),
  stage10('plains10', 'plains', 'the Wasteland Plains', 8500, { ki_orb: 6 }, 'Opens the Canyon.'),
  gStep('tool', 'Craft a tool with ki', 'realm:shinobi:arts', 1, () => [Object.keys(S.tools || {}).length], 10000, { ki_orb: 10 }, 'A tool makes a gathering skill faster for good.'),
  stage10('canyon10', 'canyon', 'the Canyon', 10000, { ki_nova: 4 }, 'Opens the Citadel.'),
  gStep('chamber1h', 'Spend an hour in the Time Chamber', 'home', 3600, () => [Math.floor(S.stats.chamberTime || 0)], 12000, { seed_moon_rice: 5 }, 'Time away past the offline limit fills the Chamber.'),
  gStep('transform', 'Transform in battle', 'battle', 1, () => [S.stats.transforms || 0], 12000, { vital_bean: 5 }, 'A transformation burns stamina for a burst of power.'),
  stage10('citadel10', 'citadel', 'the Citadel', 14000, { gravity_plate: 2 }, "Opens the Tyrant's arena."),
  gStep('tyrant', 'Defeat the Crimson Tyrant', 'battle', 1, gKills('tyrant'), 25000, { capsule_crate: 2 }, 'The guardian of the plains. Its horn opens the next gate.'),
  gStep('dg_pit', 'Clear the Gravity Pit', 'battle#gs-dungeons', 1, dgDone('pit'), 27000, { ki_core: 6 }, 'Its set makes critical hits land harder.'),
  gStep('gate_hex', 'Open the Hex Gate', 'home', 1, gGate('hex'), 30000, {}, 'The offering opens a new world: Shinjuku.'),
  gChapter('hex'),
  gStep('hex10', 'Reach Cursed Research level 10', 'realm:hex:exorcism', 10, gLvl('exorcism'), 20000, { cursed_fragment: 3 }, 'Curses give Cursed Fragments: 5 of them raise the technique of your choice by one level.'),
  stage10('alleys10', 'alleys', 'the Neon Alleys', 21000, { hex_ember: 4 }, 'Opens the Shrine.'),
  gStep('domain', 'Learn a Domain Release', 'techniques', 1, () => [TECH_POOLS.hex.filter(techLv).length ? 1 : 0], 25000, { scroll_hex: 1 }, 'A Domain is an Ultimate: a world of your own rules. It goes in your one Ultimate slot.'),
  stage10('shrine10', 'shrine', 'the Shrine', 25000, { hex_shade: 4 }, 'Opens the Veil.'),
  gStep('vow30', 'Hold a Cursed Pact for 30 minutes', 'realm:hex:exorcism', 1800, () => [Math.floor(S.stats.pactTime || 0)], 25000, { cursed_fragment: 5 }, 'Give something up, get something back.'),
  stage10('veil10', 'veil', 'the Veil', 30000, { veil_shard: 2 }, "Opens the Matriarch's domain."),
  gStep('matriarch', 'Defeat the Cursed Matriarch', 'battle', 1, gKills('matriarch'), 50000, { cursed_box: 2 }, 'The guardian of the curses. Its eye opens the trail.'),
  gStep('dg_womb', 'Clear the Cursed Womb', 'battle#gs-dungeons', 1, dgDone('womb'), 55000, { cursed_fragment: 5 }, 'Its set makes every wound bleed more.'),
  gStep('gate_hunter', "Open the Hunter's Trail", 'home', 1, gGate('hunter'), 60000, {}, 'The toll opens a new world: Green Island.'),
  gChapter('hunt'),
  gStep('hunt10', 'Reach Hunting level 10', 'realm:hunter:tracking', 10, gLvl('tracking'), 40000, { wild_fur: 10, snare: 2 }, 'Hunting tracks beasts for materials, meat and companions.'),
  stage10('thicket10', 'thicket', 'the Thicket', 41000, { swift_feather: 4 }, 'Opens the Cliffs.'),
  gStep('companion', 'Hunt down your first companion', 'realm:hunter:tracking', 1, () => [Object.keys(S.beasts || {}).length], 45000, { net_trap: 2 }, 'A companion fights beside you with its own bonus.'),
  stage10('cliffs10', 'cliffs', 'the Cliffs', 46000, { wyrm_scale: 3 }, 'Opens the Ruins.'),
  gStep('contracts3', 'Complete 3 contracts', 'contracts', 3, () => [S.stats.contracts || 0], 50000, { hunters_cache: 1 }, 'Contracts send you back to every world for rewards.'),
  stage10('ruins10', 'ruins', 'the Ruins', 55000, { lynx_pelt: 3 }, "Opens the Chimera King's nest."),
  gStep('chimera', 'Defeat the Chimera King', 'battle', 1, gKills('chimera'), 90000, { beast_essence: 5 }, 'The guardian of the island. Its heart opens the door.'),
  gStep('dg_nest', 'Clear the Chimera Nest', 'battle#gs-dungeons', 1, dgDone('nest'), 95000, { beast_essence: 5 }, 'Its set opens every fight with a huge blow.'),
  gStep('gate_echo', 'Open the Echo Door', 'home', 1, gGate('echo'), 100000, {}, 'The door opens the last world: the Echo Quarter.'),
  gChapter('echo'),
  gStep('arch10', 'Reach Archaeology level 10', 'realm:echo:archaeology', 10, gLvl('archaeology'), 70000, { clay_fragment: 20 }, 'Digs turn up shards of every world.'),
  stage10('plaza10', 'plaza', 'the Plaza', 72000, { pillar_fragment: 4 }, 'Opens the Museum.'),
  gStep('echo_awaken', 'Awaken an Echo', 'realm:echo:bonding', 1, () => [S.echo && S.echo.id ? 1 : 0], 80000, { awakening_shard: 1 }, 'An Echo works a second activity beside you.'),
  stage10('museum10', 'museum', 'the Museum', 80000, { obsidian_fragment: 3 }, 'Opens the Pillars.'),
  gStep('echo_task', 'Give your Echo a task', 'realm:echo:bonding', 1, () => [S.echo && S.echo.task ? 1 : 0], 80000, { echo_dust: 3 }, 'Two skills at once, offline too.'),
  gStep('artifact', 'Restore an artifact', 'realm:echo:restoration', 1, () => [Object.keys(S.museum || {}).length], 90000, { bronze_fragment: 20 }, 'Each artifact gives a lasting bonus.'),
  stage10('pillars10', 'pillars', 'the Pillars', 100000, { starmetal_fragment: 3 }, "Opens the Pillar Lord's throne."),
  gStep('pillar', 'Defeat the Pillar Lord', 'battle', 1, gKills('pillar'), 150000, { echo_reliquary: 1 }, 'The last guardian. Seven relics open the Convergence.'),
  gStep('dg_tomb', 'Clear the Pillar Tomb', 'battle#gs-dungeons', 1, dgDone('tomb'), 160000, { pillar_fragment: 6 }, 'Its set sets every blow on fire.'),
  gStep('gate_rift', 'Tear open the Convergence', 'home', 1, gGate('rift'), 200000, {}, 'Every world meets in the Rift.'),
  gChapter('rift'),
  gStep('shenron', 'Summon Ryujin with the 7 Wish Orbs', 'realm:ki:gravity', 1, () => [Object.values(S.wishes || {}).reduce((a, b) => a + b, 0)], 150000, {}, 'Seven orbs hide in seven worlds. A wish is forever.'),
  gStep('fruit', 'Eat an Abyss Fruit', 'hero', 1, () => [S.fruit ? 1 : 0], 100000, {}, 'One fruit, one power, for good.'),
  gStep('emperor', 'Defeat the Rift Emperor', 'battle', 1, gKills('convergence'), 400000, { rift_shard: 1 }, 'He wants every world to be one.'),
  gStep('cleaver', 'Forge the Rift Cleaver', 'realm:shinobi:arts', 1, gMade('rift_cleaver'), 500000, {}, 'The blade that cuts between worlds.'),
  gStep('col75', 'Fill 75% of the Collection Log', 'hero:collection', 75, () => [Math.floor(collectionPct() * 100)], 500000, {}, 'Every world still keeps secrets.'),
].filter(Boolean);
// The path before 2026-11-25 (saves store an index into it): its ids in order.
const OLD_GOAL_IDS = ['chop10', 'wc5', 'sword', 'equip_sword', 'pills5', 'food', 'training10', 'tech1', 'char10', 'market', 'mist10', 'techup', 'char20', 'energy', 'schem', 'fox', 'gate_seas',
  'minnow10', 'fish5', 'cook5', 'cook10', 'season5', 'voyage3', 'shoals10', 'perfect', 'reef10', 'shiny', 'admiral', 'gate_soul',
  'ore20', 'ingot10', 'districts10', 'katana', 'refine1', 'awaken', 'reiatsu10', 'renown25', 'sovereign', 'gate_ki',
  'gravity10', 'crop1', 'tool', 'chamber1h', 'transform', 'tyrant', 'gate_hex',
  'hex10', 'domain', 'vow30', 'matriarch', 'gate_hunter',
  'hunt10', 'companion', 'contracts3', 'chimera', 'gate_echo',
  'arch10', 'echo_awaken', 'echo_task', 'artifact', 'pillar', 'gate_rift',
  'shenron', 'fruit', 'emperor', 'cleaver', 'col75'];
const GOAL_BY = Object.fromEntries(GOALS.map((g, i) => [g.id, i]));

/* ------------------------------------------------------------- synergies */
// Every profession feeds at least one other. Bonus = per × (source level − 1), so Lv 99 gives ~98× per.
// to: a skill id, 'gather' / 'craft' (every skill of that type), 'all', or 'combat'.
// kind: speed · double (chance for ×2 output) · xp · rare (rare-find chance) · heal (food) · dmg · hp
const SYNERGIES = [
  { from: 'woodcutting', to: 'arts',    kind: 'double', per: 0.002, name: 'Fine Grain',       desc: 'Good wood: chance to craft two items at once' },
  { from: 'fishing',   to: 'cooking',   kind: 'double', per: 0.002, name: 'Fresh Catch',      desc: 'Fat fish: chance to cook two dishes at once' },
  { from: 'cooking',   to: 'voyaging',  kind: 'speed',  per: 0.004, name: 'Good Provisions',  desc: 'A well-fed crew sails faster' },
  { from: 'voyaging',  to: 'all',       kind: 'rare',   per: 0.004, name: "Explorer's Eye",   desc: 'Rare finds are more likely on every skill' },
  { from: 'mining',    to: 'smithing',  kind: 'double', per: 0.002, name: 'Pure Ore',         desc: 'Chance to smelt two ingots from one batch' },
  { from: 'smithing',  to: 'gather',    kind: 'speed',  per: 0.002, name: 'Sharp Tools',      desc: 'Every gathering skill works faster' },
  { from: 'arts',      to: 'combat',    kind: 'hp',     per: 0.003, name: 'Body Seals',       desc: 'Protective seals raise your max HP' },
  { from: 'woodcutting', to: 'cooking', kind: 'heal',   per: 0.005, name: 'Seasoning',        desc: 'Forest herbs make every dish heal more in battle' },
];

/* ------------------------------------------------------------------ gates */
// Keyed by the world they open. A world opens only after the previous world's guardian falls
// AND you make an offering built from the skills you already have (Overview → Open the gate).
const GATES = {
  seas: { name: 'The Hidden Harbour', boss: 'fox',
    lore: 'Behind the Ashen Fox\'s den, a river runs out of the forest to a harbour no map shows. The shipwrights there want timber, pills and proof of strength before they let you sail.',
    offer: { ashen_tail: 1, shadow_pill: 10, storm_chakra: 20, mistwood: 20 } },
  soul: { name: 'The Drowned Seal', boss: 'admiral',
    lore: 'Under the Admiral\'s flagship lies a sunken seal between the living and the dead. Feed it the sea\'s treasures and it will break.',
    offer: { tide_heart: 1, tide_pearl: 3, marlin_steak: 20, blue_marlin: 10 } },
  rift: { name: 'The Convergence', boss: 'sovereign',
    lore: 'Every world touches at a single point. A relic from each will tear it open.',
    offer: { tide_heart: 1, sovereign_shard: 2, ashen_tail: 3, sunstone: 20, lightning_core: 8 } },
};
// Order gates are met in. New worlds insert themselves before the Rift (worlds.js).
const GATE_ORDER = ['seas', 'soul', 'rift'];

/* ---------------------------------------------------------------- unlocks */
// Worlds, skills and menus open one at a time, each from something that happens in the world.
// Listed in the order a player meets them; the first locked one is shown as "Next unlock".
// need(): condition. Already-used content always counts as unlocked (older saves).
const usedSkill = (...ks) => ks.some((k) => S.skills[k] && S.skills[k].xp > 0);
const bossName = (zone) => ZONES.find((z) => z.id === zone).enemies[0].name;
const gateHint = (r) => () => `Defeat the ${bossName(GATES[r].boss)}, then make the offering at ${GATES[r].name} (Overview)`;
const worldUnlock = (r, name) => ({ id: 'realm:' + r, name, need: () => !!S.gates[r], hint: gateHint(r) });
const UNLOCKS = [
  { id: 'realm:shinobi',      name: 'Leaf Village',   need: () => true },
  { id: 'skill:woodcutting',  name: 'Woodcutting',     need: () => true },
  { id: 'skill:arts',         name: 'Crafting',        need: () => skillLv('woodcutting') >= 3 || usedSkill('arts'),
    hint: () => 'Reach Woodcutting level 3', why: 'The village carpenter shows you how to carve your own sword.' },
  { id: 'feature:battle',     name: 'Battlefield',     need: () => (S.stats.made.soldier_pill || 0) >= 5 || S.stats.kills > 0,
    hint: () => 'Brew 5 Soldier Pills', why: 'Armed and with pills in your pouch, the instructors let you train with real opponents.' },
  { id: 'feature:techniques', name: 'Techniques',      need: () => Object.keys(S.tech.lv).length > 0 || !!S.stats.scrollFound,
    hint: () => 'Find a technique scroll in battle', why: 'A defeated foe dropped a scroll. Read it on the Techniques page: it draws a technique of its world (rarer scrolls, rarer techniques); one you know goes up a level. Techniques fire on their own in battle.' },
  { id: 'feature:trials',     name: 'World Trials',    need: () => (S.combat.kills.training || 0) >= 10,
    hint: () => 'Defeat 10 foes at the Training Grounds', why: 'Six trials per world, beside the path: go deeper in its skills, beat its guardian on an empty stomach, race its dungeon. Each pays well, and all six give the world its seal: +5% speed and XP for its skills.' },
  { id: 'feature:dungeons',   name: 'Dungeons',        need: () => (S.combat.kills.fox || 0) >= 1,
    hint: () => 'Defeat the Ashen Fox Beast', why: "Behind the Fox's den, a stair leads under the Warden Rock. Every world hides a dungeon: five rooms in a row, no rest, a chest and a set at the end. Its guardian gives you the first key." },
  { id: 'feature:collection', name: 'Collection Log',  need: () => Object.keys(S.found).length >= 12,
    hint: () => 'Discover 12 different items', why: 'You start keeping a journal of everything you find.' },
  { id: 'feature:market',     name: 'Market',          need: () => S.gold >= 500 || Object.keys(S.shop).length > 0,
    hint: () => 'Carry 500 gold', why: 'A travelling merchant noticed your heavy purse.' },
  { id: 'feature:power',      name: 'Energy Disciplines',     need: () => charLv() >= 20 || energyUsed() > 0,
    hint: () => 'Reach Character level 20', why: 'Your chakra runs deep enough to train it. Every world you reach adds a new discipline.' },
  worldUnlock('seas', 'Orange Town'),
  { id: 'skill:fishing',      name: 'Fishing',         need: () => !!S.gates.seas || usedSkill('fishing') },
  { id: 'skill:cooking',      name: 'Cooking',         need: () => skillLv('fishing') >= 5 || usedSkill('cooking'),
    hint: () => 'Reach Fishing level 5', why: 'A ship cook trades you a pan for a good catch.' },
  { id: 'feature:spices',     name: 'Spice Rack',      need: () => skillLv('cooking') >= 8 || (S.stats.seasoned || 0) > 0,
    hint: () => 'Reach Cooking level 8', why: 'The galley cook lends you her spice rack. Season dishes for small battle buffs; your catches now bring up sea salt.' },
  { id: 'skill:voyaging',     name: 'Voyaging',        need: () => skillLv('cooking') >= 10 || usedSkill('voyaging'),
    hint: () => 'Reach Cooking level 10', why: 'With proper provisions and timber for the hull, a captain agrees to take you aboard.' },
  { id: 'feature:allies',     name: 'Allies',          need: () => isUnlocked('skill:voyaging') || !!(S.allies && S.allies.visits),
    hint: () => 'Reach Cooking level 10', why: 'Captain Mira: "A crew looks after its own." While you are away for an hour or more, the friends you made drop by with a gift, and each visit tightens your bond.' },
  { id: 'feature:tasks',      name: 'Daily objectives', need: () => !!S.gates.seas,
    hint: () => 'Reach Orange Town', why: 'The harbour board posts new jobs every day and every week, in every world you know. See the Overview.' },
  { id: 'feature:poster',     name: 'Wanted poster',   need: () => (S.bounty || 0) >= 5000,
    hint: () => 'Earn a Bounty of 5,000', why: 'Your first wanted poster is up. Open it from the Character view: share the image with a friend, and swap friend codes so your heroes visit each other.' },
  { id: 'feature:omens',      name: 'Opportunities',   need: () => (!!S.gates.seas && charLv() >= 30) || !!(S.omen && S.omen.n),
    hint: () => 'Reach Character level 30 in Orange Town', why: 'Keep an eye on the screen: now and then something from the world you are in shows up for 30 seconds (a messenger toad, a bottle in the waves...). Take it for a small bonus. Missing one costs nothing.' },
  { id: 'feature:scouter',    name: 'Power Visor',     need: () => (!!S.gates.seas && S.stats.deaths >= 1) || !!(S.scout && S.scout.n),
    hint: () => 'Lose a fight in Orange Town or later', why: 'A strange device falls out of the cracked sky: a Power Visor. It reads the power of a stage and plays the fight out for you: win chance, what brings you down, and what to change. Battlefield.' },
  { id: 'feature:missions',   name: 'Task Queue',   need: () => (!!S.gates.seas && skillLv('fishing') >= 10) || !!(S.missions && S.missions.list && S.missions.list.length),
    hint: () => 'Reach Fishing level 10 in Orange Town', why: 'You can now queue tasks: each one starts when the previous one is done, even while you are away. Open the queue from the activity bar.' },
  worldUnlock('soul', 'Soul City'),
  { id: 'skill:mining',       name: 'Reishi Mining',   need: () => !!S.gates.soul || usedSkill('mining') },
  { id: 'skill:smithing',     name: 'Smelting',        need: () => skillLv('mining') >= 5 || usedSkill('smithing'),
    hint: () => 'Reach Reishi Mining level 5', why: 'A soul smith offers you his spare anvil for your ore.' },
  { id: 'feature:awakening',  name: 'Weapon Forge',     need: () => skillLv('smithing') >= 5 || S.arms.some((a) => a.ref > 0),
    hint: () => 'Reach Smelting level 5', why: 'The smelter shows you how to refine your weapons with ingots and, later, awaken them. Pick a weapon in the Bank.' },
  { id: 'feature:renown',     name: 'Renown & Ascension', need: () => !!S.gates.soul,
    hint: () => 'Open Soul City', why: 'Word of you spreads across worlds. Every world now tracks your Renown.' },
  { id: 'feature:hardcore',   name: 'Hardcore mode',   need: () => (S.combat.kills.districts || 0) >= 25 || !!(S.hard && S.hard.kills),
    hint: () => 'Defeat 25 foes in the Outer Districts of Soul City', why: 'A switch on top of the stage list: every stage, guardians too, fights at Hardcore strength (×3 HP, ×2.5 attack) and pays for it (drops ×3, gold ×3, XP ×1.5).' },
  { id: 'feature:huntlist',   name: 'Hunt List',       need: () => (!!S.gates.soul && skillLv('mining') >= 10) || !!(S.hlist && S.hlist.list && (S.hlist.list.length || S.hlist.done)),
    hint: () => 'Reach Reishi Mining level 10 in Soul City', why: 'The Hunter Guild sends you a provisional charter. Pin up to 3 items you want (Collection or Bank): the Hunt List tracks where they drop, your odds and how long they should take.' },
];
const UNLOCK_TAIL = [{ id: 'realm:rift', name: 'The Rift', need: () => !!S.gates.rift, hint: gateHint('rift') }];
// worlds.js pushes each new world's unlocks, then the Rift closes the list.
