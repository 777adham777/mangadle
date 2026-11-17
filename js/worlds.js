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
const CROPS = [];          // Farming (Ki Frontier)
// Sources that come from systems rather than actions/drops: [item, iconKind, iconId, text, rate|null]. Shown in the Bank.
const EXTRA_SOURCES = [];


/* ========================================================= WORLD 4: KI FRONTIER */
// Gravity Training builds raw power and unlocks transformations; Farming grows crops on real-time
// plots; Tinkering builds tools for every gathering skill and gadgets for a new gear slot.
// Wish Stones: one hides in each world — gather all 7 for a permanent wish.
(() => {
  const k = (id, name, v) => defItem(id, name, '✨', v);
  k('ki_dust', 'Ki Dust', 30); k('ki_spark', 'Ki Spark', 60); k('ki_orb', 'Ki Orb', 110); k('ki_core', 'Ki Core', 180);
  k('ki_flare', 'Ki Flare', 280); k('ki_nova', 'Ki Nova', 420); k('ki_star', 'Ki Star', 650);
  // relics
  defItem('gravity_plate', 'Gravity Plate', '⬛', 1500, relic('ki'));
  defItem('warrior_sash', 'Warrior Sash', '🎗️', 2200, relic('ki'));
  defItem('tyrant_horn', 'Tyrant Horn', '🦏', 9000, relic('ki'));
  // crops + seeds
  CROPS.push(
    { id: 'vital_bean',   name: 'Vital Bean',   level: 1,  mins: 5,   yield: [2, 4] },
    { id: 'sun_wheat',    name: 'Sun Wheat',    level: 10, mins: 15,  yield: [3, 6] },
    { id: 'moon_rice',    name: 'Moon Rice',    level: 20, mins: 30,  yield: [3, 6] },
    { id: 'fire_pepper',  name: 'Fire Pepper',  level: 35, mins: 60,  yield: [3, 6] },
    { id: 'frost_melon',  name: 'Frost Melon',  level: 50, mins: 120, yield: [3, 5] },
    { id: 'thunder_root', name: 'Thunder Root', level: 65, mins: 180, yield: [3, 5] },
    { id: 'star_fruit',   name: 'Star Fruit',   level: 80, mins: 240, yield: [2, 4] },
  );
  for (const c of CROPS) {
    c.seed = 'seed_' + c.id; c.xp = xpFor(c.level, c.mins * 60 * 0.25);
    defItem(c.seed, c.name + ' Seed', '🌱', 10 + c.level * 3, { type: 'seed' });
    if (c.id === 'vital_bean') defItem(c.id, c.name, '🫘', 60, { type: 'food', heal: 1600 });
    else defItem(c.id, c.name, '🌾', 20 + c.level * 4);
  }
  // meals: Cooking + crops = timed buffs (eat from the Bank)
  const meal = (id, name, v, stat, val, mins) => defItem(id, name, '🍱', v, { type: 'meal', buff: { stat, val, mins } });
  meal('sunbread', 'Sunbread', 80, 'speed', 0.10, 30);
  meal('moon_onigiri', 'Moon Onigiri', 140, 'xp', 0.10, 30);
  meal('pepper_stew', 'Fire Pepper Stew', 220, 'dmg', 0.12, 30);
  meal('melon_sorbet', 'Frost Melon Sorbet', 320, 'gold', 0.20, 30);
  meal('thunder_ramen', 'Thunder Ramen', 450, 'rare', 0.15, 30);
  meal('star_feast', 'Star Feast', 800, 'all', 0.08, 45);
  SKILLS.cooking.actions.push(
    craft('sunbread', 15, 3, { sun_wheat: 2, reef_bass: 1 }),
    craft('moon_onigiri', 30, 3.5, { moon_rice: 2, blue_marlin: 1 }),
    craft('pepper_stew', 45, 4, { fire_pepper: 2, tidal_eel: 1 }),
    craft('melon_sorbet', 60, 4, { frost_melon: 2, wisp_flame: 2 }),
    craft('thunder_ramen', 75, 4.5, { thunder_root: 2, abyss_angler: 1 }),
    craft('star_feast', 90, 5, { star_fruit: 2, sea_king: 1, world_tree_leaf: 1 }),
  );
  SKILLS.cooking.actions.sort((a, b) => a.level - b.level);
  // gadgets (new equipment slot) + iconic Ki gear
  const gad = (id, name, v, stats) => defItem(id, name, '⚙️', v, eq('gadget', stats));
  gad('power_scanner', 'Power Scanner', 1500, { rare: 0.15 });
  gad('weighted_bands', 'Weighted Bands', 2500, { cxp: 0.12 });
  gad('jet_boots', 'Jet Boots', 4000, { dodge: 0.08 });
  gad('drone_buddy', 'Drone Buddy', 6000, { gold: 0.20 });
  gad('barrier_belt', 'Barrier Belt', 9000, { hp: 400, def: 40 });
  gad('hyper_capsule', 'Hyper Capsule', 15000, { speed: 0.08 });
  defItem('power_gauntlets', 'Power Gauntlets', '🥊', 20000, eq('weapon', { atk: 150 }));
  defItem('battle_armor', 'Battle Armor Mk-X', '🦾', 20000, eq('armor', { def: 165, hp: 950 }));
  defItem('gravity_bracer', 'Gravity Bracer', '⭕', 20000, eq('accessory', { atk: 80, def: 40, hp: 420 }));
  defItem('schem_power_gauntlets', 'Schematic: Power Gauntlets', '📜', 15000, schem('power_gauntlets'));
  defItem('schem_battle_armor', 'Schematic: Battle Armor Mk-X', '📜', 15000, schem('battle_armor'));
  defItem('schem_gravity_bracer', 'Schematic: Gravity Bracer', '📜', 15000, schem('gravity_bracer'));
  // wish stones (one per world)
  for (let i = 1; i <= 7; i++) { defItem('wish_stone_' + i, `Wish Stone ★${i}`, '🔮', 5000, { type: 'wish', star: i }); EXTRA_SOURCES.push(['wish_stone_' + i, 'ui', 'wish', `Any skill or foe of world ${i} (once Wish Stones are unlocked)`, 1 / 1500]); }
  for (const c of CROPS) EXTRA_SOURCES.push([c.id, 'skill', 'farming', `Farming · plant ${c.name} Seed (${c.mins} min)`, null]);

  SKILLS.gravity = { name: 'Gravity Training', realm: 'ki', icon: '💪', type: 'gather',
    desc: 'Train under crushing gravity. Each level raises Inner Power by 2%, grows your stamina and unlocks transformations.' };
  SKILLS.farming = { name: 'Farming', realm: 'ki', icon: '🌱', type: 'farm',
    desc: 'Plant seeds on plots that grow in real time, even while you do something else. Crops feed buff meals and Vital Beans.' };
  SKILLS.tinkering = { name: 'Tinkering', realm: 'ki', icon: '⚙️', type: 'craft',
    desc: 'Build tools that permanently speed up every gathering skill, and gadgets for a new gear slot.' };
  SKILLS.gravity.actions = [
    gather('ki_dust', 1, 3), gather('ki_spark', 10, 3.5), gather('ki_orb', 22, 4), gather('ki_core', 35, 4.5),
    gather('ki_flare', 50, 5), gather('ki_nova', 65, 5.5), gather('ki_star', 80, 6.5),
  ];
  ['1×', '10×', '50×', '100×', '200×', '400×', '800×'].forEach((g, i) => { SKILLS.gravity.actions[i].name = `${g} Gravity Session`; });
  SKILLS.farming.actions = [];
  // Tools: one line per gathering skill, 3 tiers each, +15% speed per tier. Built from that skill's own materials + ki.
  const toolSkills = ['fishing', 'herbalism', 'chakra', 'mining', 'harvest', 'gravity'];
  const toolNames = { fishing: 'Sonar Rod', herbalism: 'Auto-Sickle', chakra: 'Focus Lens', mining: 'Ki Drill', harvest: 'Spirit Lantern', gravity: 'Gravity Rig' };
  const tinker = [];
  toolSkills.forEach((sk, si) => {
    const mats = SKILLS[sk].actions.map((a) => Object.keys(a.out)[0]);
    [1, 2, 3].forEach((t) => {
      const id = `tool_${sk}_${t}`;
      defItem(id, `${toolNames[sk]} Mk ${'I'.repeat(t)}`, '🔧', 300 * t, { type: 'tool', toolFor: sk, tier: t });
      const kiMat = (si % 2 ? ['ki_dust', 'ki_orb', 'ki_flare'] : ['ki_spark', 'ki_core', 'ki_nova'])[t - 1];
      const mat = mats[Math.min(mats.length - 1, t * 2 - 1)];
      tinker.push(craft(id, [4, 34, 68][t - 1] + si * 2, 5 + t, sk === 'gravity' ? { [kiMat]: 12 * t, [['spirit_ore', 'black_iron', 'sunstone'][t - 1]]: 10 * t } : { [kiMat]: 6 * t, [mat]: 12 * t }));
    });
  });
  tinker.push(
    craft('power_scanner', 12, 6, { ki_spark: 10, sapphire: 1, chakra_orb: 10 }),
    craft('weighted_bands', 25, 6, { ki_orb: 12, black_iron: 10, gravity_plate: 1 }),
    craft('jet_boots', 40, 7, { ki_core: 12, starsteel: 10, warrior_sash: 1 }),
    craft('drone_buddy', 55, 7, { ki_flare: 12, sunstone: 8, tide_pearl: 2 }),
    craft('barrier_belt', 65, 8, { ki_nova: 10, gravity_plate: 3, husk_heart: 4 }),
    craft('hyper_capsule', 85, 9, { ki_star: 10, tyrant_horn: 1, void_diamond: 1 }),
    needs('schem_power_gauntlets', craft('power_gauntlets', 45, 9, { gravity_plate: 4, ki_core: 20, starsteel: 15, beast_ember: 6 })),
    needs('schem_battle_armor', craft('battle_armor', 60, 10, { warrior_sash: 4, ki_flare: 20, sunstone: 12, phantom_silk: 6 })),
    needs('schem_gravity_bracer', craft('gravity_bracer', 75, 10, { tyrant_horn: 1, ki_nova: 15, ruby: 2, sage_chakra: 4 })),
  );
  SKILLS.tinkering.actions = tinker.sort((a, b) => a.level - b.level);
  for (const s of ['gravity', 'farming', 'tinkering']) { RARE_FINDS[s] = []; }
  RARE_FINDS.herbalism.push(['seed_vital_bean', 1 / 60], ['seed_sun_wheat', 1 / 120], ['seed_moon_rice', 1 / 250], ['seed_fire_pepper', 1 / 500]);
  RARE_FINDS.gravity.push(['seed_frost_melon', 1 / 400], ['seed_thunder_root', 1 / 700], ['seed_star_fruit', 1 / 1200]);
  SHOP.push(
    { id: 'buy_beans', cat: 'Supplies', realm: 'ki', name: '5× Vital Bean Seed', icon: '🌱', desc: 'Starter seeds for your first plots.', cost: 400, give: ['seed_vital_bean', 5] },
    { id: 'buy_wheat', cat: 'Supplies', realm: 'ki', name: '5× Sun Wheat Seed', icon: '🌱', desc: 'Grows into flour for Sunbread.', cost: 1500, give: ['seed_sun_wheat', 5] },
    { id: 'tools_ki', cat: 'Tools', realm: 'ki', name: 'Capsule Workshop', icon: '🛠️', desc: '+10% speed for Ki Frontier skills per tier.', costs: [20000, 80000, 300000, 1e6, 3e6] },
  );
  SYNERGIES.push(
    { from: 'gravity',   to: 'combat',  kind: 'xp',   per: 0.004, name: 'Heavy Bones',   desc: 'Training under gravity speeds up combat XP' },
    { from: 'farming',   to: 'cooking', kind: 'buff', per: 0.006, name: 'Fresh Harvest', desc: 'Buff meals last longer' },
    { from: 'tinkering', to: 'fishing', kind: 'rare', per: 0.004, name: 'Sonar',         desc: 'Rare catches are more likely' },
  );

  const E = (name, hp, atk, def, spd, xp, gold, drops) => en(name, '', hp, atk, def, spd, xp, gold, drops);
  addWorld({
    id: 'ki',
    realm: { name: 'Ki Frontier', icon: '⚡', color: '#ffb93d', ui: '#ffc65a', tagline: 'Endless plains, gravity chambers and warriors who never stop growing.' },
    zones: [
      { id: 'plains', name: 'Rocky Plains', realm: 'ki', rec: 92, enemies: [
        E('Wasteland Brawler', 6000, 560, 240, 2.5, 1300, [400, 800], [['ki_spark', 0.3, [2, 4]], ['gravity_plate', 0.08, [1, 1]], ['seed_moon_rice', 0.03, [1, 2]]]),
        E('Raging Ape', 7500, 520, 280, 3, 1450, [450, 850], [['ki_orb', 0.25, [1, 3]], ['gravity_plate', 0.1, [1, 1]], ['schem_power_gauntlets', 1 / 150, [1, 1]]]),
      ] },
      { id: 'canyon', name: 'Thunder Canyon', realm: 'ki', rec: 96, enemies: [
        E('Sprout Fiend', 9000, 700, 300, 2.2, 1900, [600, 1100], [['ki_core', 0.25, [1, 3]], ['warrior_sash', 0.08, [1, 1]], ['seed_fire_pepper', 0.04, [1, 2]]]),
        E('Elite Soldier', 10500, 760, 330, 2.4, 2100, [650, 1200], [['ki_flare', 0.2, [1, 2]], ['warrior_sash', 0.1, [1, 1]], ['schem_battle_armor', 1 / 150, [1, 1]]]),
      ] },
      { id: 'citadel', name: 'Frost Citadel', realm: 'ki', rec: 100, enemies: [
        E('Armored Commander', 14000, 900, 380, 2.4, 2800, [900, 1600], [['ki_nova', 0.2, [1, 2]], ['gravity_plate', 0.12, [1, 2]], ['seed_frost_melon', 0.04, [1, 2]]]),
        E('Horned Mutant', 16000, 860, 420, 2.8, 3000, [950, 1700], [['ki_nova', 0.25, [1, 2]], ['warrior_sash', 0.12, [1, 2]], ['seed_thunder_root', 0.03, [1, 1]]]),
      ] },
      { id: 'tyrant', name: 'The Crimson Throne', realm: 'ki', rec: 104, boss: true, enemies: [
        E('Crimson Tyrant', 70000, 1400, 480, 2.3, 18000, [12000, 25000], [['tyrant_horn', 0.6, [1, 1]], ['ki_star', 1, [2, 4]], ['seed_star_fruit', 0.3, [1, 2]], ['schem_gravity_bracer', 1 / 6, [1, 1]], ['FRUIT', 1 / 10, [1, 1]]]),
      ] },
    ],
    gate: { name: 'The Throne Stair', boss: 'sovereign',
      lore: 'Behind the Throne of Masks, a stair climbs out of the afterlife into a sky full of thunder. It only takes the toll of a ruler.',
      offer: { sovereign_shard: 2, black_iron: 25, grave_dust: 15, sage_pill: 10 } },
    unlocks: [
      { id: 'skill:gravity', name: 'Gravity Training', need: () => !!S.gates.ki || usedSkill('gravity') },
      { id: 'skill:farming', name: 'Farming', need: () => skillLv('gravity') >= 5 || usedSkill('farming'),
        hint: () => 'Reach Gravity Training level 5', why: 'An old farmer on the plains hands you Vital Bean seeds and three plots.' },
      { id: 'feature:transform', name: 'Transformations', need: () => skillLv('gravity') >= 10,
        hint: () => 'Reach Gravity Training level 10', why: 'Your body can finally hold a surge of ki. Pick a form on the Battlefield.' },
      { id: 'skill:tinkering', name: 'Tinkering', need: () => (S.combat.kills.plains || 0) >= 10 || usedSkill('tinkering'),
        hint: () => 'Defeat 10 foes on the Rocky Plains', why: 'You salvage scrap from fallen soldiers. A capsule engineer shows you how to use it.' },
      { id: 'feature:wishes', name: 'Wish Stones', need: () => skillLv('tinkering') >= 10,
        hint: () => 'Reach Tinkering level 10', why: 'Your new radar picks up seven strange signals, one in every world.' },
    ],
  });
})();

/* ====================================================================== end */
finalizeWorlds();
