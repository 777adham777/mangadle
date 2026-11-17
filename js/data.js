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
const ITEMS = {};
function defItem(id, name, icon, value, extra) {
  ITEMS[id] = Object.assign({ id, name, icon, value, type: 'res' }, extra || {});
}

// Shinobi resources
defItem('healing_leaf',   'Healing Leaf',    '🌿', 2);
defItem('moonpetal',      'Moonpetal',       '🌸', 6);
defItem('shadowroot',     'Shadowroot',      '🥀', 14);
defItem('sage_lotus',     'Sage Lotus',      '🪷', 30);
defItem('dragon_moss',    'Dragon Moss',     '🍀', 60);
defItem('chakra_shard',   'Chakra Shard',    '🔹', 3);
defItem('chakra_orb',     'Chakra Orb',      '🔷', 10);
defItem('nature_essence', 'Nature Essence',  '💠', 25);
defItem('beast_ember',    'Beast Ember',     '🔥', 70);
// Soul resources
defItem('soul_fragment',  'Soul Fragment',   '✨', 3);
defItem('spirit_core',    'Spirit Core',     '🔮', 12);
defItem('husk_mask',      'Husk Mask Shard', '🎭', 28);
defItem('abyssal_essence','Abyssal Essence', '🌑', 65);
defItem('spirit_ore',     'Spirit Ore',      '🪨', 2);
defItem('silver_reishi',  'Silver Reishi',   '⚪', 8);
defItem('void_stone',     'Void Stone',      '⬛', 20);
defItem('starsteel',      'Starsteel',       '🌟', 50);
// Seas resources
defItem('minnow',         'Minnow',          '🐟', 2);
defItem('reef_bass',      'Reef Bass',       '🐠', 7);
defItem('blue_marlin',    'Blue Marlin',     '🐡', 16);
defItem('tidal_eel',      'Tidal Eel',       '🐍', 40);
defItem('abyss_angler',   'Abyss Angler',    '🦑', 80);
// Multiverse
defItem('rift_shard',     'Rift Shard',      '🔱', 2500);

// Food (heal is scaled by your HP multiplier)
defItem('grilled_minnow', 'Grilled Minnow',  '🍢', 5,   { type: 'food', heal: 20 });
defItem('bass_stew',      'Reef Bass Stew',  '🍲', 15,  { type: 'food', heal: 50 });
defItem('spirit_ramen',   'Spirit Ramen',    '🍜', 30,  { type: 'food', heal: 90 });
defItem('marlin_steak',   'Marlin Steak',    '🥩', 35,  { type: 'food', heal: 110 });
defItem('eel_bowl',       'Grilled Eel Bowl','🍱', 80,  { type: 'food', heal: 220 });
defItem('angler_feast',   'Angler Feast',    '🍖', 160, { type: 'food', heal: 420 });
defItem('soldier_pill',   'Soldier Pill',    '💊', 8,   { type: 'food', heal: 40 });
defItem('sage_pill',      'Sage Pill',       '🟢', 90,  { type: 'food', heal: 280 });

// Equipment
const eq = (slot, stats) => ({ type: 'equip', slot, stats });
defItem('iron_wakizashi',  'Iron Wakizashi',   '🔪', 15,   eq('weapon', { atk: 6 }));
defItem('spirit_katana',   'Spirit Katana',    '🗡️', 80,   eq('weapon', { atk: 15 }));
defItem('awakened_blade',  'Awakened Blade',   '⚔️', 300,  eq('weapon', { atk: 32 }));
defItem('sovereign_blade', 'Sovereign Blade',  '🌙', 1000, eq('weapon', { atk: 60 }));
defItem('rift_cleaver',    'Rift Cleaver',     '🪓', 6000, eq('weapon', { atk: 120 }));
defItem('flak_vest',       'Flak Vest',        '🦺', 20,   eq('armor', { def: 6, hp: 20 }));
defItem('chakra_mesh',     'Chakra Mesh',      '🥋', 100,  eq('armor', { def: 14, hp: 60 }));
defItem('sage_robe',       'Sage Robe',        '👘', 350,  eq('armor', { def: 28, hp: 140 }));
defItem('beast_cloak',     'Beast Cloak',      '🧥', 1100, eq('armor', { def: 50, hp: 280 }));
defItem('shinobi_headband','Shinobi Headband', '🎀', 40,   eq('accessory', { atk: 4, def: 4 }));
defItem('reishi_ring',     'Reishi Ring',      '💍', 150,  eq('accessory', { hp: 80, def: 6 }));
defItem('old_compass',     'Old Compass',      '🧭', 120,  eq('accessory', { atk: 2, def: 2, gold: 0.10 }));
defItem('sea_charm',       'Sea Charm',        '🐚', 400,  eq('accessory', { hp: 120, def: 10 }));
defItem('fox_tail_charm',  'Fox Tail Charm',   '🦊', 900,  eq('accessory', { atk: 20, hp: 100 }));
defItem('sovereign_mask',  'Sovereign Mask',   '👺', 2500, eq('accessory', { atk: 40, def: 15, hp: 150 }));
defItem('storm_crown',     'Storm Crown',      '👑', 8000, eq('accessory', { atk: 60, def: 30, hp: 300, gold: 0.25 }));

// Abyss Fruits — eat one for a permanent power. Only one at a time. The sea hates you (-40% fishing speed).
const fr = (fx, desc) => ({ type: 'fruit', fx, desc });
defItem('ember_fruit',    'Ember Fruit',    '🍎', 5000, fr({ dmg: 0.30 },                 '+30% damage. Your strikes burn.'));
defItem('quake_fruit',    'Quake Fruit',    '🍇', 5000, fr({ dmg: 0.60, atkSpeed: 0.15 }, '+60% damage, attacks 15% slower.'));
defItem('mist_fruit',     'Mist Fruit',     '🫐', 5000, fr({ dodge: 0.20 },               '20% chance to dodge enemy attacks.'));
defItem('gilded_fruit',   'Gilded Fruit',   '🍋', 5000, fr({ gold: 0.75 },                '+75% gold from every source.'));
defItem('bloom_fruit',    'Bloom Fruit',    '🍈', 5000, fr({ skill: 0.20 },               '+20% speed on every skill.'));
defItem('colossus_fruit', 'Colossus Fruit', '🍉', 5000, fr({ hp: 0.50 },                  '+50% max HP.'));
const FRUITS = ['ember_fruit', 'quake_fruit', 'mist_fruit', 'gilded_fruit', 'bloom_fruit', 'colossus_fruit'];

/* ----------------------------------------------------------------- skills */
const SKILLS = {
  herbalism: { name: 'Herbalism',     realm: 'shinobi', icon: '🌿', type: 'gather', desc: 'Forage medicinal herbs from the forests around the hidden villages.' },
  chakra:    { name: 'Chakra Focus',  realm: 'shinobi', icon: '🌀', type: 'gather', desc: 'Meditate under waterfalls to condense raw chakra into crystals.' },
  arts:      { name: 'Shinobi Arts',  realm: 'shinobi', icon: '📜', type: 'craft',  desc: 'Brew combat pills and weave armor using materials from every realm.' },
  harvest:   { name: 'Soul Harvest',  realm: 'soul',    icon: '👻', type: 'gather', desc: 'Guide wandering spirits onward and keep what they leave behind.' },
  mining:    { name: 'Reishi Mining', realm: 'soul',    icon: '⛏️', type: 'gather', desc: 'Mine ore crystallized from pure spiritual particles.' },
  smithing:  { name: 'Bladesmithing', realm: 'soul',    icon: '⚒️', type: 'craft',  desc: 'Forge soul-bound blades that answer only to their wielder.' },
  fishing:   { name: 'Fishing',       realm: 'seas',    icon: '🎣', type: 'gather', desc: 'Cast your line into the endless blue. Fruit eaters fish 40% slower.' },
  cooking:   { name: 'Cooking',       realm: 'seas',    icon: '🍳', type: 'craft',  desc: 'A good cook keeps the crew alive. Food heals in combat and supplies voyages.' },
  voyaging:  { name: 'Voyaging',      realm: 'seas',    icon: '⛵', type: 'voyage', desc: 'Set sail on expeditions. Consumes food as supplies and returns with gold and treasure.' },
  strength:  { name: 'Strength',      realm: 'combat',  icon: '💪', type: 'combat', desc: 'Raises your max hit. Trained by fighting with the Strength style.' },
  defense:   { name: 'Defense',       realm: 'combat',  icon: '🛡️', type: 'combat', desc: 'Reduces the damage you take. Trained by fighting with the Defense style.' },
  vitality:  { name: 'Vitality',      realm: 'combat',  icon: '❤️', type: 'combat', desc: '+10 base max HP per level. Always earns a share of combat XP.' },
};

const gather = (item, level, time, xp) => ({ id: item, name: ITEMS[item].name, level, time, xp, out: { [item]: 1 } });
const craft = (item, level, time, xp, inputs, qty) => ({ id: item, name: ITEMS[item].name, level, time, xp, in: inputs, out: { [item]: qty || 1 } });

SKILLS.herbalism.actions = [
  gather('healing_leaf', 1, 3, 8),
  gather('moonpetal', 10, 4, 18),
  gather('shadowroot', 25, 5, 35),
  gather('sage_lotus', 45, 6, 60),
  gather('dragon_moss', 70, 8, 110),
];
SKILLS.chakra.actions = [
  gather('chakra_shard', 1, 3, 8),
  gather('chakra_orb', 15, 4.5, 22),
  gather('nature_essence', 35, 6, 45),
  gather('beast_ember', 60, 9, 95),
];
SKILLS.arts.actions = [
  craft('soldier_pill', 1, 3, 10, { healing_leaf: 3, chakra_shard: 1 }),
  craft('flak_vest', 5, 4, 25, { spirit_ore: 6, chakra_shard: 3 }),
  craft('shinobi_headband', 12, 4, 40, { spirit_ore: 5, chakra_orb: 2 }),
  craft('chakra_mesh', 20, 5, 70, { silver_reishi: 8, chakra_orb: 8, moonpetal: 4 }),
  craft('sage_robe', 40, 6, 140, { shadowroot: 6, nature_essence: 6, void_stone: 6 }),
  craft('sage_pill', 45, 4, 60, { sage_lotus: 2, nature_essence: 1 }),
  craft('beast_cloak', 65, 8, 300, { beast_ember: 6, dragon_moss: 8, starsteel: 8 }),
];
SKILLS.harvest.actions = [
  gather('soul_fragment', 1, 3, 8),
  gather('spirit_core', 15, 4.5, 22),
  gather('husk_mask', 35, 6, 45),
  gather('abyssal_essence', 60, 9, 95),
];
SKILLS.mining.actions = [
  gather('spirit_ore', 1, 3, 7),
  gather('silver_reishi', 12, 4, 16),
  gather('void_stone', 30, 5.5, 34),
  gather('starsteel', 55, 7, 70),
];
SKILLS.smithing.actions = [
  craft('iron_wakizashi', 1, 4, 20, { spirit_ore: 5 }),
  craft('spirit_katana', 15, 5, 60, { silver_reishi: 8, soul_fragment: 10 }),
  craft('reishi_ring', 25, 5, 90, { void_stone: 4, spirit_core: 4 }),
  craft('awakened_blade', 35, 6, 140, { void_stone: 10, spirit_core: 5, chakra_orb: 5 }),
  craft('sovereign_blade', 60, 8, 320, { starsteel: 12, husk_mask: 6, beast_ember: 4 }),
  craft('rift_cleaver', 85, 10, 800, { starsteel: 20, abyssal_essence: 10, rift_shard: 1 }),
];
SKILLS.fishing.actions = [
  gather('minnow', 1, 3, 7),
  gather('reef_bass', 10, 4, 15),
  gather('blue_marlin', 25, 5, 30),
  gather('tidal_eel', 45, 6.5, 55),
  gather('abyss_angler', 70, 8, 100),
];
SKILLS.cooking.actions = [
  craft('grilled_minnow', 1, 2, 6, { minnow: 1 }),
  craft('bass_stew', 10, 2.5, 14, { reef_bass: 1 }),
  craft('spirit_ramen', 20, 3, 24, { reef_bass: 1, moonpetal: 1 }),
  craft('marlin_steak', 25, 3, 28, { blue_marlin: 1 }),
  craft('eel_bowl', 45, 3.5, 50, { tidal_eel: 1 }),
  craft('angler_feast', 70, 4, 90, { abyss_angler: 1 }),
];
// Voyages: loot.table = one guaranteed roll; loot.rare = independent chances ('FRUIT' = random Abyss Fruit)
SKILLS.voyaging.actions = [
  { id: 'coastal', name: 'Coastal Run', icon: '🏝️', level: 1, time: 10, xp: 25, in: { grilled_minnow: 2 },
    loot: { gold: [20, 60], table: [['minnow', [2, 5]], ['spirit_ore', [2, 4]], ['healing_leaf', [2, 4]]], rare: [['old_compass', 0.02]] } },
  { id: 'merchant', name: 'Merchant Route', icon: '🚢', level: 15, time: 15, xp: 70, in: { bass_stew: 2 },
    loot: { gold: [80, 200], table: [['reef_bass', [2, 4]], ['silver_reishi', [2, 4]], ['chakra_orb', [1, 3]]], rare: [['sea_charm', 0.02], ['FRUIT', 0.003]] } },
  { id: 'current', name: 'Treacherous Current', icon: '🌊', level: 35, time: 20, xp: 160, in: { marlin_steak: 2 },
    loot: { gold: [200, 500], table: [['void_stone', [2, 4]], ['spirit_core', [2, 4]], ['shadowroot', [2, 4]]], rare: [['sea_charm', 0.03], ['FRUIT', 0.008]] } },
  { id: 'stormbelt', name: 'Storm Belt Crossing', icon: '⛈️', level: 55, time: 25, xp: 340, in: { eel_bowl: 2 },
    loot: { gold: [500, 1200], table: [['starsteel', [1, 3]], ['husk_mask', [1, 3]], ['nature_essence', [2, 4]]], rare: [['storm_crown', 0.01], ['FRUIT', 0.015]] } },
  { id: 'worldsedge', name: "Edge of the World", icon: '🌌', level: 80, time: 30, xp: 700, in: { angler_feast: 2 },
    loot: { gold: [1500, 3500], table: [['abyssal_essence', [1, 3]], ['beast_ember', [1, 3]], ['dragon_moss', [2, 4]]], rare: [['storm_crown', 0.02], ['FRUIT', 0.03]] } },
];
SKILLS.strength.actions = [];
SKILLS.defense.actions = [];
SKILLS.vitality.actions = [];

/* ----------------------------------------------------------------- combat */
// enemy: hp, atk (max hit), def, spd (seconds per attack), xp, gold [min,max], drops [[item, chance, [min,max]]]
const en = (name, icon, hp, atk, def, spd, xp, gold, drops) => ({ name, icon, hp, atk, def, spd, xp, gold, drops: drops || [] });

const ZONES = [
  { id: 'training', name: 'Training Grounds', realm: 'shinobi', rec: 1, enemies: [
    en('Bandit Thug', '🗡️', 25, 4, 0, 3, 10, [2, 6], [['healing_leaf', 0.3, [1, 3]], ['minnow', 0.2, [1, 2]]]),
    en('Rogue Apprentice', '🥷', 35, 5, 2, 2.8, 15, [4, 9], [['chakra_shard', 0.3, [1, 3]], ['soldier_pill', 0.05, [1, 1]]]),
  ] },
  { id: 'mist', name: 'Misty Forest', realm: 'shinobi', rec: 10, enemies: [
    en('Mist Assassin', '🌫️', 100, 14, 8, 2.6, 32, [10, 22], [['moonpetal', 0.3, [1, 3]], ['chakra_orb', 0.1, [1, 2]]]),
    en('Puppet Drone', '🪆', 130, 12, 15, 3, 36, [12, 24], [['spirit_ore', 0.4, [2, 5]], ['silver_reishi', 0.1, [1, 2]]]),
  ] },
  { id: 'ravine', name: 'Fang Ravine', realm: 'shinobi', rec: 22, enemies: [
    en('Ninken Alpha', '🐺', 220, 24, 18, 2.4, 65, [20, 40], [['shadowroot', 0.3, [1, 3]]]),
    en('Stone Golem', '🗿', 320, 22, 35, 3.2, 80, [25, 45], [['void_stone', 0.25, [1, 2]]]),
  ] },
  { id: 'fox', name: 'Den of the Ashen Fox', realm: 'shinobi', rec: 32, boss: true, enemies: [
    en('Ashen Fox Beast', '🦊', 1600, 45, 35, 2.5, 700, [300, 600], [['beast_ember', 1, [2, 4]], ['nature_essence', 0.5, [2, 4]], ['fox_tail_charm', 0.15, [1, 1]]]),
  ] },
  { id: 'districts', name: 'Outer Districts', realm: 'soul', rec: 38, enemies: [
    en('Lesser Husk', '👹', 420, 35, 30, 2.6, 95, [30, 60], [['soul_fragment', 0.5, [2, 5]]]),
    en('Lurking Husk', '👺', 540, 40, 40, 2.6, 115, [35, 70], [['spirit_core', 0.2, [1, 2]]]),
  ] },
  { id: 'desert', name: 'Desert of Endless Night', realm: 'soul', rec: 46, enemies: [
    en('Towering Husk', '🏜️', 950, 60, 50, 3, 190, [50, 90], [['husk_mask', 0.2, [1, 2]]]),
    en('Sand Wraith', '🌪️', 780, 70, 45, 2.2, 180, [50, 90], [['void_stone', 0.3, [1, 3]]]),
  ] },
  { id: 'spire', name: 'The Bone Spire', realm: 'soul', rec: 55, enemies: [
    en('Masked Lancer', '💀', 1400, 90, 70, 2.4, 290, [80, 140], [['husk_mask', 0.3, [1, 3]]]),
    en('Bone Priest', '☠️', 1250, 100, 60, 2.5, 280, [80, 140], [['abyssal_essence', 0.1, [1, 2]]]),
  ] },
  { id: 'sovereign', name: 'Throne of Masks', realm: 'soul', rec: 64, boss: true, enemies: [
    en('Masked Sovereign', '🎭', 9000, 160, 110, 2.4, 2800, [1500, 3000], [['abyssal_essence', 1, [3, 6]], ['sovereign_mask', 0.15, [1, 1]]]),
  ] },
  { id: 'shoals', name: 'Rookie Shoals', realm: 'seas', rec: 68, enemies: [
    en('Navy Recruit', '⚓', 2000, 130, 100, 2.5, 380, [120, 220], [['reef_bass', 0.4, [2, 4]]]),
    en('Cannon Brute', '💣', 2600, 150, 120, 3, 440, [150, 260], [['starsteel', 0.1, [1, 2]]]),
  ] },
  { id: 'reef', name: 'Merfolk Reef', realm: 'seas', rec: 74, enemies: [
    en('Merfolk Brawler', '🧜', 3400, 200, 150, 2.3, 620, [200, 350], [['blue_marlin', 0.4, [2, 4]], ['sea_charm', 0.01, [1, 1]]]),
    en('Reef Shark', '🦈', 3000, 240, 130, 2.1, 600, [200, 350], [['tidal_eel', 0.3, [1, 3]]]),
  ] },
  { id: 'storm', name: 'The Storm Belt', realm: 'seas', rec: 82, enemies: [
    en('Sea Leviathan', '🐉', 6500, 320, 200, 3, 1100, [350, 600], [['abyss_angler', 0.3, [1, 3]], ['FRUIT', 0.005, [1, 1]]]),
    en('Storm Corsair', '🏴‍☠️', 5200, 360, 190, 2.2, 1050, [350, 600], [['starsteel', 0.3, [1, 3]]]),
  ] },
  { id: 'admiral', name: "Admiral's Flagship", realm: 'seas', rec: 90, boss: true, enemies: [
    en('Admiral of the Tide', '🎖️', 22000, 520, 280, 2.4, 9000, [6000, 12000], [['storm_crown', 0.15, [1, 1]], ['FRUIT', 0.25, [1, 1]]]),
  ] },
  { id: 'convergence', name: 'The Convergence', realm: 'rift', rec: 99, boss: true, enemies: [
    en('Rift Emperor', '👁️', 60000, 900, 400, 2.2, 30000, [30000, 60000], [['rift_shard', 1, [1, 1]], ['FRUIT', 0.5, [1, 1]]]),
  ] },
];
REALMS.rift = { name: 'The Rift', icon: '🔱', color: '#ff3fb4', tagline: 'Where the three worlds tear into one.', hidden: true };

const BOUNTY_RANKS = [
  [0, 'Nobody'], [5e3, 'Rookie Outlaw'], [5e4, 'Rising Star'], [5e5, 'Warlord'],
  [5e6, 'Sea Emperor'], [5e7, 'Multiverse Legend'],
];

/* ------------------------------------------------- inner power (energy) */
// base = energy-seconds for first level; cost grows linearly with level
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
  { id: 'satchel',       cat: 'Charms', name: 'Auto-Eat Satchel',  icon: '👝', desc: 'Raises the auto-eat threshold: 40% → 55% → 70% HP.', costs: [1000, 20000] },
  { id: 'buy_minnow',    cat: 'Supplies', name: '10× Grilled Minnow', icon: '🍢', desc: 'Emergency rations for a struggling adventurer.', cost: 80, give: ['grilled_minnow', 10] },
  { id: 'buy_ore',       cat: 'Supplies', name: '20× Spirit Ore',     icon: '🪨', desc: 'A crate of basic ore.', cost: 60, give: ['spirit_ore', 20] },
];

/* ------------------------------------------------------------ goal chain */
// A guided path so a new player always knows the next thing to do.
// prog() returns [current, target]; go = view the GO button opens.
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
  { text: 'Buy any upgrade in the Market', icon: '🏪', go: 'market',                  n: 1,   prog: () => [['tools_shinobi', 'tools_soul', 'tools_seas', 'abundance', 'satchel'].reduce((a, k) => a + (S.shop[k] || 0), 0)], reward: 300 },
  { text: 'Reach Strength level 20',       icon: '💪', go: 'battle',                  n: 20,  prog: () => [skillLv('strength')], reward: 500 },
  { text: 'Defeat the Ashen Fox Beast',    icon: '🦊', go: 'battle',                  n: 1,   prog: kills('fox'), reward: 2000 },
  { text: 'Reach Total Level 200',         icon: '📈', go: 'home',                    n: 200, prog: () => [Object.keys(SKILLS).reduce((a, k) => a + skillLv(k), 0)], reward: 2500 },
  { text: 'Rebirth for the first time',    icon: '♻️', go: 'power',                   n: 1,   prog: () => [S.rebirths], reward: 3000 },
  { text: 'Defeat the Masked Sovereign',   icon: '🎭', go: 'battle',                  n: 1,   prog: kills('sovereign'), reward: 10000 },
  { text: 'Eat an Abyss Fruit',            icon: '🍎', go: 'hero',                    n: 1,   prog: () => [S.fruit ? 1 : 0], reward: 10000 },
  { text: 'Defeat the Admiral of the Tide', icon: '🎖️', go: 'battle',                 n: 1,   prog: kills('admiral'), reward: 40000 },
  { text: 'Defeat the Rift Emperor',       icon: '👁️', go: 'battle',                  n: 1,   prog: kills('convergence'), reward: 100000 },
];
