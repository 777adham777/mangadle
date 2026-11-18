'use strict';
/* ==========================================================================
   TRI-REALM IDLE — static game data
   Worlds collided: the Shinobi Lands (start), the Endless Blue, the Soul Afterlands, and more (worlds.js).
   ========================================================================== */

const REALMS = {
  shinobi: { name: 'Shinobi Lands',   icon: '🍃', color: '#ff7a1a', tagline: 'Hidden villages, chakra and cold steel.' },     // world 1: the forest village
  seas:    { name: 'Endless Blue',    icon: '⚓', color: '#14a8ff', tagline: 'Pirates, bounties and cursed fruit.' },          // world 2
  soul:    { name: 'Soul Afterlands', icon: '🌙', color: '#9b6bff', tagline: 'Spirit blades, masked husks and restless souls.' }, // world 3
};
// Worlds in the order they open. Later worlds append themselves (worlds.js).
const WORLD_ORDER = ['shinobi', 'seas', 'soul'];

/* ------------------------------------------------------------------ items */
// type: res (material) · food · equip · fruit · gem · chest (openable)
const ITEMS = {};
function defItem(id, name, icon, value, extra) {
  ITEMS[id] = Object.assign({ id, name, icon, value, type: 'res' }, extra || {});
}

// Shinobi — wood (every log also patches a ship's hull on Endless Blue voyages)
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
defItem('training_kunai',  'Training Kunai',   '🪵', 3,     eq('weapon', { atk: 2 }));     // your very first weapon (Shinobi Arts)
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

// More pills: Shinobi Arts keeps you alive until the Endless Blue's cooks take over.
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
  woodcutting: { name: 'Woodcutting', realm: 'shinobi', icon: '🪓', type: 'gather', desc: 'Fell the trees around the hidden village. Logs become kunai and weapon hafts, and patch the hulls of Endless Blue ships.' },
  herbalism: { name: 'Herbalism',     realm: 'shinobi', icon: '🌿', type: 'gather', desc: 'Forage medicinal herbs. They become pills, armor cloth and seasoning.' },
  chakra:    { name: 'Chakra Focus',  realm: 'shinobi', icon: '🌀', type: 'gather', desc: 'Meditate under waterfalls to condense chakra crystals: kunai, pills and the power inside every iconic craft.' },
  arts:      { name: 'Shinobi Arts',  realm: 'shinobi', icon: '📃', type: 'craft',  desc: 'Brew healing pills, craft kunai and weave armor. Your first source of gear and healing.' },
  harvest:   { name: 'Soul Harvest',  realm: 'soul',    icon: '👻', type: 'gather', desc: 'Guide wandering spirits onward. Their remains bind blades, jewelry and pills.' },
  mining:    { name: 'Reishi Mining', realm: 'soul',    icon: '⛏️', type: 'gather', desc: 'Mine ore crystallized from pure spiritual particles. Gems hide in the rock.' },
  smithing:  { name: 'Bladesmithing', realm: 'soul',    icon: '⚒️', type: 'craft',  desc: 'Forge soul-bound blades and set gems into jewelry. Most iconic weapons are made here.' },
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
// Voyages: loot.table = one guaranteed roll; loot.rare = independent chances ('FRUIT' = random Abyss Fruit)
const voyage = (id, name, icon, level, time, input, loot) => ({ id, name, icon, level, time, xp: xpFor(level, time, true), in: input, loot });
SKILLS.voyaging.actions = [
  voyage('coastal', 'Coastal Run', '🏝️', 1, 10, { grilled_minnow: 2, pine_log: 2 },
    { gold: [20, 60], table: [['minnow', [2, 5]], ['spirit_ore', [2, 4]], ['healing_leaf', [2, 4]]], rare: [['old_compass', 1 / 50], ['mist_steel', 1 / 20]] }),
  voyage('merchant', 'Merchant Route', '🚢', 12, 12, { bass_stew: 2, cedar_log: 2 },
    { gold: [70, 180], table: [['reef_bass', [2, 4]], ['silver_reishi', [2, 4]], ['chakra_orb', [1, 3]]], rare: [['sea_charm', 1 / 60], ['beast_fang', 1 / 25], ['FRUIT', 1 / 400]] }),
  voyage('cove', "Smuggler's Cove", '🏴‍☠️', 25, 14, { crab_dumplings: 2, bamboo: 2 },
    { gold: [150, 350], table: [['sea_crab', [2, 4]], ['frost_crystal', [2, 4]], ['wisp_flame', [2, 4]]], rare: [['sapphire', 1 / 30], ['husk_heart', 1 / 25], ['FRUIT', 1 / 300]] }),
  voyage('current', 'Treacherous Current', '🌊', 38, 16, { marlin_steak: 2, mistwood: 2 },
    { gold: [250, 600], table: [['void_stone', [2, 4]], ['spirit_core', [2, 4]], ['shadowroot', [2, 4]]], rare: [['sea_charm', 1 / 40], ['bone_ivory', 1 / 30], ['FRUIT', 1 / 200]] }),
  voyage('stormbelt', 'Storm Belt Crossing', '⛈️', 55, 20, { eel_bowl: 2, ironwood: 2 },
    { gold: [600, 1400], table: [['starsteel', [1, 3]], ['husk_mask', [1, 3]], ['nature_essence', [2, 4]]], rare: [['storm_crown', 1 / 120], ['tide_pearl', 1 / 25], ['FRUIT', 1 / 120]] }),
  voyage('ghostfleet', 'Ghost Fleet Waters', '👻', 68, 22, { takoyaki: 2, blossomwood: 2 },
    { gold: [1000, 2400], table: [['grave_dust', [2, 4]], ['black_iron', [2, 4]], ['giant_octopus', [1, 3]]], rare: [['ruby', 1 / 25], ['sovereign_shard', 1 / 100], ['FRUIT', 1 / 90]] }),
  voyage('worldsedge', 'Edge of the World', '🌌', 82, 26, { angler_feast: 2, spirit_oak: 2 },
    { gold: [1800, 4000], table: [['phantom_silk', [1, 3]], ['lightning_core', [1, 3]], ['sunstone', [1, 3]]], rare: [['storm_crown', 1 / 60], ['leviathan_scale', 1 / 20], ['tide_heart', 1 / 200], ['FRUIT', 1 / 50]] }),
];
SKILLS.strength.actions = [];
SKILLS.defense.actions = [];
SKILLS.vitality.actions = [];

/* --------------------------------------------- rare finds, pets, milestones */
// Rolled on every completed action of that skill (chance per action). 'GEM' rolls GEM_TABLE.
const RARE_FINDS = {
  woodcutting: [['bird_nest', 1 / 150]],
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
  { id: 'woodpecker',    name: 'Woodpecker',         icon: '🐦', skill: 'woodcutting' },
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
  // World 1 — Shinobi Lands
  { id: 'training', name: 'Training Grounds', realm: 'shinobi', rec: 1, enemies: [
    en('Bandit Thug', '🗡️', 25, 4, 0, 3, 10, [2, 6], [['healing_leaf', 0.4, [1, 3]], ['pine_log', 0.3, [2, 4]], ['soldier_pill', 0.08, [1, 2]], ['old_compass', 1 / 400, [1, 1]]]),
    en('Rogue Apprentice', '🥷', 35, 5, 2, 2.8, 15, [4, 9], [['chakra_shard', 0.3, [1, 3]], ['soldier_pill', 0.05, [1, 1]], ['shinobi_headband', 1 / 150, [1, 1]]]),
  ] },
  { id: 'mist', name: 'Misty Forest', realm: 'shinobi', rec: 10, enemies: [
    en('Mist Assassin', '🌫️', 100, 14, 8, 2.6, 32, [10, 22], [['moonpetal', 0.3, [1, 3]], ['mist_steel', 0.12, [1, 2]], ['senbon', 1 / 40, [1, 1]], ['schem_fog_cleaver', 1 / 80, [1, 1]]]),
    en('Puppet Drone', '🪆', 130, 12, 15, 3, 36, [12, 24], [['chakra_orb', 0.25, [1, 2]], ['mist_steel', 0.18, [1, 2]], ['puppet_plating', 1 / 40, [1, 1]], ['bird_nest', 1 / 40, [1, 1]]]),
  ] },
  { id: 'ravine', name: 'Fang Ravine', realm: 'shinobi', rec: 22, enemies: [
    en('Ninken Alpha', '🐺', 220, 24, 18, 2.4, 65, [20, 40], [['shadowroot', 0.3, [1, 3]], ['beast_fang', 0.15, [1, 2]], ['wolf_fang', 1 / 50, [1, 1]], ['herb_pouch', 1 / 40, [1, 1]], ['schem_sealing_talisman', 1 / 100, [1, 1]]]),
    en('Stone Golem', '🗿', 320, 22, 35, 3.2, 80, [25, 45], [['storm_chakra', 0.25, [1, 2]], ['mist_steel', 0.15, [1, 3]], ['jade', 1 / 30, [1, 1]], ['golem_heart', 1 / 60, [1, 1]]]),
  ] },
  { id: 'fox', name: 'Den of the Ashen Fox', realm: 'shinobi', rec: 32, boss: true, enemies: [
    en('Ashen Fox Beast', '🦊', 1600, 45, 35, 2.5, 700, [300, 600], [['storm_chakra', 1, [2, 4]], ['ashen_tail', 0.5, [1, 1]], ['sealed_scroll', 0.25, [1, 2]], ['fox_tail_charm', 1 / 8, [1, 1]], ['schem_ashen_fang', 1 / 6, [1, 1]]]),
  ] },
  // World 2 — Endless Blue
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
    en('Lesser Husk', '👹', 2000, 130, 100, 2.5, 380, [120, 220], [['soul_fragment', 0.5, [2, 5]], ['husk_heart', 0.1, [1, 1]], ['husk_claw', 1 / 120, [1, 1]]]),
    en('Lurking Husk', '👺', 2600, 150, 120, 3, 440, [150, 260], [['spirit_core', 0.2, [1, 2]], ['husk_heart', 0.12, [1, 1]], ['reaper_scarf', 1 / 120, [1, 1]], ['lost_lantern', 1 / 50, [1, 1]], ['schem_reapers_edge', 1 / 120, [1, 1]]]),
  ] },
  { id: 'desert', name: 'Desert of Endless Night', realm: 'soul', rec: 74, enemies: [
    en('Towering Husk', '🏜️', 3400, 200, 150, 2.3, 620, [200, 350], [['husk_mask', 0.2, [1, 2]], ['husk_heart', 0.15, [1, 2]], ['husk_carapace', 1 / 150, [1, 1]]]),
    en('Sand Wraith', '🌪️', 3000, 240, 130, 2.1, 600, [200, 350], [['void_stone', 0.3, [1, 3]], ['sapphire', 1 / 60, [1, 1]], ['wraith_sickle', 1 / 150, [1, 1]]]),
  ] },
  { id: 'spire', name: 'The Bone Spire', realm: 'soul', rec: 82, enemies: [
    en('Masked Lancer', '💀', 6500, 320, 200, 3, 1100, [350, 600], [['husk_mask', 0.3, [1, 3]], ['bone_ivory', 0.15, [1, 2]], ['bone_lance', 1 / 200, [1, 1]]]),
    en('Bone Priest', '☠️', 5200, 360, 190, 2.2, 1050, [350, 600], [['grave_dust', 0.15, [1, 2]], ['bone_ivory', 0.15, [1, 2]], ['ruby', 1 / 80, [1, 1]], ['prayer_beads', 1 / 200, [1, 1]], ['schem_ferryman_robe', 1 / 120, [1, 1]]]),
  ] },
  { id: 'sovereign', name: 'Throne of Masks', realm: 'soul', rec: 90, boss: true, enemies: [
    en('Masked Sovereign', '🎭', 22000, 520, 280, 2.4, 9000, [6000, 12000], [['abyssal_essence', 1, [3, 6]], ['lost_lantern', 0.5, [1, 3]], ['sovereign_shard', 0.6, [1, 2]], ['sovereign_mask', 1 / 10, [1, 1]], ['sovereign_cloak', 1 / 12, [1, 1]], ['schem_eclipse_blade', 1 / 6, [1, 1]]]),
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
  { id: 'buy_pills',     cat: 'Supplies', name: '10× Soldier Pill',   icon: '💊', desc: 'Emergency pills for a struggling adventurer.', cost: 80, give: ['soldier_pill', 10] },
  { id: 'buy_shards',    cat: 'Supplies', name: '20× Chakra Shard',   icon: '🔹', desc: 'A pouch of raw chakra crystals.', cost: 60, give: ['chakra_shard', 20] },
];

/* ------------------------------------------------------------ goal chain */
// A guided path so a new player always knows the next thing to do.
// prog() returns [current]; go = view the GO button opens. Append only: saves store the index.
const made = (id) => () => [S.stats.made[id] || 0];
const kills = (zone) => () => [S.combat.kills[zone] || 0];
const lvl = (k) => () => [S.skills[k] ? skillLv(k) : 0];
const gate = (r) => () => [S.gates[r] ? 1 : 0];
// v6: Shinobi → Endless Blue → Soul → Ki → Hexbound → Hunter's Wilds → Echo Quarter → Rift.
// Saves store the index: inserting an objective shifts every index after it (add a migration in game.js),
// and keep ICONS.goal (icons.js) and GUIDE (guide.js) in step.
const G = (text, go, n, prog, reward) => ({ text, go, n, prog, reward });
const GOALS = [
  // Shinobi Lands
  G('Chop 10 Pine Logs', 'realm:shinobi:woodcutting', 10, made('pine_log'), 20),
  G('Reach Woodcutting level 5', 'realm:shinobi:woodcutting', 5, lvl('woodcutting'), 25),
  G('Carve a Training Kunai', 'realm:shinobi:arts', 1, made('training_kunai'), 30),
  G('Equip your Training Kunai', 'hero', 1, () => [S.equip.weapon ? 1 : 0], 30),
  G('Gather 10 Healing Leaves', 'realm:shinobi:herbalism', 10, made('healing_leaf'), 30),
  G('Brew 5 Soldier Pills', 'realm:shinobi:arts', 5, made('soldier_pill'), 40),
  G('Equip food for battle', 'hero', 1, () => [S.combat.food ? 1 : 0], 60),
  G('Defeat 10 foes at the Training Grounds', 'battle', 10, kills('training'), 60),
  G('Condense 10 Chakra Shards', 'realm:shinobi:chakra', 10, made('chakra_shard'), 200),
  G('Equip a technique', 'battle', 1, () => [S.tech && S.tech.slots.filter(Boolean).length ? 1 : 0], 250),
  G('Buy any upgrade in the Market', 'market', 1, () => [['tools_shinobi', 'tools_soul', 'tools_seas', 'abundance', 'satchel', 'lucky_coin'].reduce((a, k) => a + (S.shop[k] || 0), 0)], 300),
  G('Defeat 10 foes in the Misty Forest', 'battle', 10, kills('mist'), 400),
  G('Reach Chakra Focus level 15', 'realm:shinobi:chakra', 15, lvl('chakra'), 500),
  G('Put energy into any training', 'power', 1, () => [energyUsed() > 0 ? 1 : 0], 500),
  G('Learn a schematic from a defeated foe', 'battle', 1, () => [Object.keys(S.known).length], 600),
  G('Defeat the Ashen Fox Beast', 'battle', 1, kills('fox'), 1000),
  G('Open the Hidden Harbour', 'home', 1, gate('seas'), 1200),
  // Endless Blue
  G('Catch 10 Minnows', 'realm:seas:fishing', 10, made('minnow'), 600),
  G('Reach Fishing level 5', 'realm:seas:fishing', 5, lvl('fishing'), 600),
  G('Cook 5 Grilled Minnows', 'realm:seas:cooking', 5, made('grilled_minnow'), 700),
  G('Reach Cooking level 10', 'realm:seas:cooking', 10, lvl('cooking'), 800),
  G('Season 5 dishes', 'realm:seas:cooking', 5, () => [S.stats.seasoned || 0], 900),
  G('Return from 3 voyages', 'realm:seas:voyaging', 3, () => [S.stats.voyages], 1000),
  G('Defeat 10 foes at Rookie Shoals', 'battle', 10, kills('shoals'), 1000),
  G('Cook a Perfect dish', 'realm:seas:cooking', 1, () => [qTotal('cooking')], 1200),
  G('Defeat 10 foes in Merfolk Reef', 'battle', 10, kills('reef'), 1500),
  G('Catch a Shiny fish', 'realm:seas:fishing', 1, () => [qTotal('fishing')], 2000),
  G('Defeat the Admiral of the Tide', 'battle', 1, kills('admiral'), 3000),
  G('Open the Drowned Seal', 'home', 1, gate('soul'), 3500),
  // Soul Afterlands
  G('Mine 20 Spirit Ore', 'realm:soul:mining', 20, made('spirit_ore'), 2000),
  G('Defeat 10 foes in the Outer Districts', 'battle', 10, kills('districts'), 2500),
  G('Forge a Spirit Katana', 'realm:soul:smithing', 1, made('spirit_katana'), 3000),
  G('Awaken a weapon (First Release)', 'hero', 1, () => [Object.values(S.gear || {}).some((g) => g.rel > 0) ? 1 : 0], 4000),
  G('Rebirth for the first time', 'power', 1, () => [S.rebirths], 5000),
  G('Reach Renown 25 in any world', 'home', 25, () => [Math.max(0, ...WORLD_ORDER.map(renownLv))], 6000),
  G('Defeat the Masked Sovereign', 'battle', 1, kills('sovereign'), 10000),
  G('Climb the Throne Stair', 'home', 1, gate('ki'), 12000),
  // Ki Frontier
  G('Reach Gravity Training level 10', 'realm:ki:gravity', 10, lvl('gravity'), 8000),
  G('Harvest your first crop', 'realm:ki:farming', 1, () => [S.stats.harvests || 0], 8000),
  G('Craft a tool in Tinkering', 'realm:ki:tinkering', 1, () => [Object.keys(S.tools || {}).length], 10000),
  G('Transform in battle', 'battle', 1, () => [S.stats.transforms || 0], 12000),
  G('Defeat the Crimson Tyrant', 'battle', 1, kills('tyrant'), 25000),
  G('Open the Hex Gate', 'home', 1, gate('hex'), 30000),
  // Hexbound City
  G('Reach Exorcism level 10', 'realm:hex:exorcism', 10, lvl('exorcism'), 20000),
  G('Place 3 sigils in your Domain', 'domain', 3, () => [(S.domain ? S.domain.cells.filter(Boolean).length : 0)], 25000),
  G('Hold a Pact for 30 minutes', 'realm:hex:pacts', 1800, () => [Math.floor(S.stats.pactTime || 0)], 25000),
  G('Defeat the Cursed Matriarch', 'battle', 1, kills('matriarch'), 50000),
  G("Open the Hunter's Trail", 'home', 1, gate('hunter'), 60000),
  // Hunter's Wilds
  G('Reach Tracking level 10', 'realm:hunter:tracking', 10, lvl('tracking'), 40000),
  G('Tame your first beast', 'realm:hunter:taming', 1, () => [Object.keys(S.beasts || {}).length], 45000),
  G('Complete 3 contracts', 'contracts', 3, () => [S.stats.contracts || 0], 50000),
  G('Defeat the Chimera King', 'battle', 1, kills('chimera'), 90000),
  G('Open the Echo Door', 'home', 1, gate('echo'), 100000),
  // Echo Quarter
  G('Reach Archaeology level 10', 'realm:echo:archaeology', 10, lvl('archaeology'), 70000),
  G('Awaken an Echo', 'realm:echo:bonding', 1, () => [S.echo && S.echo.id ? 1 : 0], 80000),
  G('Give your Echo a task', 'realm:echo:bonding', 1, () => [S.echo && S.echo.task ? 1 : 0], 80000),
  G('Restore an artifact', 'realm:echo:restoration', 1, () => [Object.keys(S.museum || {}).length], 90000),
  G('Defeat the Pillar Lord', 'battle', 1, kills('pillar'), 150000),
  G('Tear open the Convergence', 'home', 1, gate('rift'), 200000),
  // The Rift and beyond
  G('Make a wish with the 7 Wish Stones', 'realm:ki:gravity', 1, () => [Object.values(S.wishes || {}).reduce((a, b) => a + b, 0)], 150000),
  G('Eat an Abyss Fruit', 'hero', 1, () => [S.fruit ? 1 : 0], 100000),
  G('Defeat the Rift Emperor', 'battle', 1, kills('convergence'), 400000),
  G('Forge the Rift Cleaver', 'realm:soul:smithing', 1, made('rift_cleaver'), 500000),
  G('Fill 75% of the Collection Log', 'hero:collection', 75, () => [Math.floor(collectionPct() * 100)], 500000),
];

/* ------------------------------------------------------------- synergies */
// Every profession feeds at least one other. Bonus = per × (source level − 1), so Lv 99 gives ~98× per.
// to: a skill id, 'gather' / 'craft' (every skill of that type), 'all', or 'combat'.
// kind: speed · double (chance for ×2 output) · xp · rare (rare-find chance) · heal (food) · dmg · hp
const SYNERGIES = [
  { from: 'woodcutting', to: 'arts',    kind: 'double', per: 0.002, name: 'Fine Grain',       desc: 'Good wood: chance to craft two items at once' },
  { from: 'fishing',   to: 'cooking',   kind: 'double', per: 0.002, name: 'Fresh Catch',      desc: 'Fat fish: chance to cook two dishes at once' },
  { from: 'herbalism', to: 'cooking',   kind: 'heal',   per: 0.005, name: 'Seasoning',        desc: 'Herbs make every dish heal more in battle' },
  { from: 'cooking',   to: 'voyaging',  kind: 'speed',  per: 0.004, name: 'Good Provisions',  desc: 'A well-fed crew sails faster' },
  { from: 'voyaging',  to: 'all',       kind: 'rare',   per: 0.004, name: "Explorer's Eye",   desc: 'Rare finds are more likely on every skill' },
  { from: 'mining',    to: 'smithing',  kind: 'double', per: 0.002, name: 'Pure Ore',         desc: 'Chance to forge two items from one batch' },
  { from: 'smithing',  to: 'gather',    kind: 'speed',  per: 0.002, name: 'Sharp Tools',      desc: 'Every gathering skill works faster' },
  { from: 'harvest',   to: 'craft',     kind: 'xp',     per: 0.003, name: 'Guiding Spirits',  desc: 'Wandering souls steady your hands: more crafting XP' },
  { from: 'chakra',    to: 'combat',    kind: 'dmg',    per: 0.003, name: 'Chakra Strikes',   desc: 'Chakra-infused attacks deal more damage' },
  { from: 'arts',      to: 'combat',    kind: 'hp',     per: 0.003, name: 'Body Seals',       desc: 'Protective seals raise your max HP' },
  { from: 'strength',  to: 'mining',    kind: 'speed',  per: 0.003, name: 'Heavy Swing',      desc: 'Strong arms break rock faster' },
  { from: 'defense',   to: 'harvest',   kind: 'speed',  per: 0.003, name: 'Steady Nerves',    desc: 'Spirits trust a calm guardian: faster harvest' },
  { from: 'vitality',  to: 'herbalism', kind: 'speed',  per: 0.003, name: 'Endurance',        desc: 'Forage longer without rest' },
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
  { id: 'realm:shinobi',      name: 'Shinobi Lands',   need: () => true },
  { id: 'skill:woodcutting',  name: 'Woodcutting',     need: () => true },
  { id: 'skill:arts',         name: 'Shinobi Arts',    need: () => skillLv('woodcutting') >= 5 || usedSkill('arts'),
    hint: () => 'Reach Woodcutting level 5', why: 'The village carpenter shows you how to carve your own kunai.' },
  { id: 'skill:herbalism',    name: 'Herbalism',       need: () => (S.stats.made.training_kunai || 0) >= 1 || usedSkill('herbalism'),
    hint: () => 'Carve a Training Kunai', why: 'An old medic shakes her head: "A blade will not keep you alive. Let me show you the healing herbs."' },
  { id: 'feature:battle',     name: 'Battlefield',     need: () => (S.stats.made.soldier_pill || 0) >= 5 || S.stats.kills > 0,
    hint: () => 'Brew 5 Soldier Pills', why: 'Armed and with pills in your pouch, the instructors let you train with real opponents.' },
  { id: 'skill:chakra',       name: 'Chakra Focus',    need: () => (S.combat.kills.training || 0) >= 10 || usedSkill('chakra'),
    hint: () => 'Defeat 10 foes at the Training Grounds', why: 'A beaten rogue apprentice teaches you to mould chakra.' },
  { id: 'feature:avatar',     name: 'Avatar',          need: () => S.stats.kills >= 30,
    why: 'A village painter wants to sketch the new fighter. Dress your hero in Bank → Avatar; feats across the worlds unlock new looks.' },
  { id: 'feature:techniques', name: 'Techniques',      need: () => skillLv('chakra') >= 5 || (S.tech && S.tech.slots.some(Boolean)),
    hint: () => 'Reach Chakra Focus level 5', why: 'Your chakra is steady enough to shape it into techniques. Brew their scrolls in Shinobi Arts.' },
  { id: 'feature:collection', name: 'Collection Log',  need: () => Object.keys(S.found).length >= 12,
    hint: () => 'Discover 12 different items', why: 'You start keeping a journal of everything you find.' },
  { id: 'feature:market',     name: 'Market',          need: () => S.gold >= 500 || Object.keys(S.shop).length > 0,
    hint: () => 'Carry 500 gold', why: 'A travelling merchant noticed your heavy purse.' },
  { id: 'feature:power',      name: 'Inner Power',     need: () => skillLv('chakra') >= 15 || S.rebirths > 0 || S.karma > 0,
    hint: () => 'Reach Chakra Focus level 15', why: 'Your chakra runs deep enough to train your inner power.' },
  worldUnlock('seas', 'Endless Blue'),
  { id: 'skill:fishing',      name: 'Fishing',         need: () => !!S.gates.seas || usedSkill('fishing') },
  { id: 'skill:cooking',      name: 'Cooking',         need: () => skillLv('fishing') >= 5 || usedSkill('cooking'),
    hint: () => 'Reach Fishing level 5', why: 'A ship cook trades you a pan for a good catch.' },
  { id: 'feature:spices',     name: 'Spice Rack',      need: () => skillLv('cooking') >= 8 || (S.stats.seasoned || 0) > 0,
    hint: () => 'Reach Cooking level 8', why: 'The galley cook lends you her spice rack. Season dishes for small battle buffs; your catches now bring up sea salt.' },
  { id: 'skill:voyaging',     name: 'Voyaging',        need: () => skillLv('cooking') >= 10 || usedSkill('voyaging'),
    hint: () => 'Reach Cooking level 10', why: 'With proper provisions and timber for the hull, a captain agrees to take you aboard.' },
  worldUnlock('soul', 'Soul Afterlands'),
  { id: 'skill:mining',       name: 'Reishi Mining',   need: () => !!S.gates.soul || usedSkill('mining') },
  { id: 'skill:smithing',     name: 'Bladesmithing',   need: () => skillLv('mining') >= 5 || usedSkill('smithing'),
    hint: () => 'Reach Reishi Mining level 5', why: 'A soul smith offers you his spare anvil for your ore.' },
  { id: 'skill:harvest',      name: 'Soul Harvest',    need: () => (S.combat.kills.districts || 0) >= 10 || usedSkill('harvest'),
    hint: () => 'Defeat 10 foes in the Outer Districts', why: 'Freed husks leave wandering souls behind. Someone has to guide them.' },
  { id: 'feature:awakening',  name: 'Weapon Awakening', need: () => skillLv('smithing') >= 15 || Object.values(S.gear || {}).some((g) => g.rel > 0),
    hint: () => 'Reach Bladesmithing level 15', why: 'Your blades start to answer you. Awaken, socket and reforge them from the Bank.' },
  { id: 'feature:renown',     name: 'Renown & Ascension', need: () => !!S.gates.soul,
    hint: () => 'Open the Soul Afterlands', why: 'Word of you spreads across worlds. Every world now tracks your Renown.' },
];
const UNLOCK_TAIL = [{ id: 'realm:rift', name: 'The Rift', need: () => !!S.gates.rift, hint: gateHint('rift') }];
// worlds.js pushes each new world's unlocks, then the Rift closes the list.
