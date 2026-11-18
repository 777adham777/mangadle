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
// Late worlds stack many multipliers (techniques, awakening, forms, Domain, companions, Echo) on HP and defense,
// so their foes hit much harder. Tuned with a simulation: each guardian is about as dangerous at world entry
// as the Crimson Tyrant (time-to-kill / time-to-die ~0.9).
const ATK_SCALE = { hex: 4.5, hunter: 9, echo: 30, rift: 30 };
function finalizeWorlds() {
  UNLOCKS.push(...UNLOCK_TAIL);
  for (const z of ZONES) if (ATK_SCALE[z.realm]) for (const e of z.enemies) e.atk = Math.round(e.atk * ATK_SCALE[z.realm]);
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
// Tiers 1-5 cost the newest world's relics; tier 6 (Rift-forged) costs a Rift Shard.
const REFORGE_MAX = 6;

/* ======================================================= WORLDS 4-7 (below) */
const CROPS = [];          // Farming (Kaio Planet)
// Sources that come from systems rather than actions/drops: [item, iconKind, iconId, text, rate|null]. Shown in the Bank.
const EXTRA_SOURCES = [];
// Uses that come from systems rather than recipes: [item, text].
const EXTRA_USES = [];


/* ========================================================= WORLD 4: KI FRONTIER */
// Gravity Training builds raw power and unlocks transformations; Farming grows crops on real-time
// plots; Tinkering builds tools for every gathering skill and gadgets for a new gear slot.
// Dragon Balls: one hides in each world — gather all 7 for a permanent wish.
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
  for (let i = 1; i <= 7; i++) { defItem('wish_stone_' + i, `${i}-Star Dragon Ball`, '🔮', 5000, { type: 'wish', star: i }); EXTRA_SOURCES.push(['wish_stone_' + i, 'ui', 'wish', `Any skill or foe of world ${i} (once Dragon Balls are unlocked)`, 1 / 1500]); }
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
    { id: 'tools_ki', cat: 'Tools', realm: 'ki', name: 'Capsule Workshop', icon: '🛠️', desc: '+10% speed for Kaio Planet skills per tier.', costs: [20000, 80000, 300000, 1e6, 3e6] },
  );
  SYNERGIES.push(
    { from: 'gravity',   to: 'combat',  kind: 'xp',   per: 0.004, name: 'Heavy Bones',   desc: 'Training under gravity speeds up combat XP' },
    { from: 'farming',   to: 'cooking', kind: 'buff', per: 0.006, name: 'Fresh Harvest', desc: 'Buff meals last longer' },
    { from: 'tinkering', to: 'fishing', kind: 'rare', per: 0.004, name: 'Sonar',         desc: 'Rare catches are more likely' },
  );

  const E = (name, hp, atk, def, spd, xp, gold, drops) => en(name, '', hp, atk, def, spd, xp, gold, drops);
  addWorld({
    id: 'ki',
    realm: { name: 'Kaio Planet', icon: '⚡', color: '#ffb93d', ui: '#ffc65a', tagline: 'Endless plains, gravity chambers and warriors who never stop growing.' },
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
      { id: 'feature:wishes', name: 'Dragon Balls', need: () => skillLv('tinkering') >= 10,
        hint: () => 'Reach Tinkering level 10', why: 'Your new radar picks up seven strange signals, one in every world.' },
    ],
  });
})();

/* ====================================================== WORLD 5: HEXBOUND CITY */
// Exorcism purifies spirits from every world (cursed essence + that world's materials).
// Sigilcraft binds essence into sigils for your Domain (a 3×3 board of rules) and cursed gear.
// Pacts: self-imposed restrictions for big bonuses that grow the longer you hold them.
const SIGILS = {};   // id -> { tag (world), kind, target, val, desc }
(() => {
  const h = (id, name, v) => defItem(id, name, '🕯️', v);
  h('hex_ash', 'Curse Ash', 70); h('hex_residue', 'Curse Residue', 120); h('hex_ember', 'Grudge Ember', 190); h('hex_shade', 'Shade Essence', 280);
  h('hex_core', 'Curse Core', 400); h('hex_void', 'Void Grudge', 560); h('hex_crown', 'Crown of Grudges', 800);
  defItem('bound_talisman', 'Bound Talisman', '🧧', 3000, relic('hex'));
  defItem('veil_shard', 'Veil Shard', '🔷', 4500, relic('hex'));
  defItem('matriarch_eye', "Matriarch's Eye", '👁️', 15000, relic('hex'));

  SKILLS.exorcism = { name: 'Exorcism', realm: 'hex', icon: '🕯️', type: 'gather',
    desc: 'Purify restless spirits from every world. They leave cursed essence and the materials of the world they came from.' };
  SKILLS.sigilcraft = { name: 'Sigilcraft', realm: 'hex', icon: '🔯', type: 'craft',
    desc: 'Bind cursed essence and materials into sigils for your Domain, and forge cursed gear with a price.' };
  SKILLS.pacts = { name: 'Pacts', realm: 'hex', icon: '📿', type: 'pact',
    desc: 'Swear binding vows: a restriction for a big bonus. The longer you hold them, the more this skill grows, and the stronger they get.' };
  const X = (item, level, time, name, extra) => Object.assign(gather(item, level, time), { name, extra });
  SKILLS.exorcism.actions = [
    X('hex_ash', 1, 3, 'Harbor Wraiths', [['reef_bass', 0.4, [1, 2]], ['tide_pearl', 0.02, [1, 1]]]),
    X('hex_residue', 12, 3.5, 'Village Phantoms', [['moonpetal', 0.4, [1, 2]], ['chakra_orb', 0.3, [1, 2]], ['mist_steel', 0.03, [1, 1]]]),
    X('hex_ember', 24, 4, 'Lost Souls', [['spirit_core', 0.4, [1, 2]], ['void_stone', 0.3, [1, 2]], ['husk_heart', 0.03, [1, 1]]]),
    X('hex_shade', 36, 4.5, 'Plateau Ghosts', [['ki_core', 0.35, [1, 2]], ['gravity_plate', 0.02, [1, 1]]]),
    X('hex_core', 50, 5, 'Alley Curses', [['bound_talisman', 0.03, [1, 1]], ['grave_dust', 0.3, [1, 2]]]),
    X('hex_void', 64, 5.5, 'Shrine Specters', [['phantom_silk', 0.3, [1, 2]], ['veil_shard', 0.03, [1, 1]]]),
    X('hex_crown', 78, 6.5, 'Abyss Grudges', [['echo_soul', 0.25, [1, 1]], ['sunstone', 0.3, [1, 2]], ['veil_shard', 0.05, [1, 1]]]),
  ];
  // Sigils: world sigils speed up that world's skills; Hexbound sigils boost you. Same-world neighbours amplify each other.
  const sig = (id, name, tag, kind, val, desc) => { defItem(id, name, '🔯', 300, { type: 'sigil' }); SIGILS[id] = { tag, kind, target: kind === 'speed' ? tag : null, val, desc }; };
  sig('sigil_tide', 'Tide Sigil', 'seas', 'speed', 0.10, 'Orange Town skills');
  sig('sigil_leaf', 'Leaf Sigil', 'shinobi', 'speed', 0.10, 'Leaf Village skills');
  sig('sigil_soul', 'Soul Sigil', 'soul', 'speed', 0.10, 'Soul City skills');
  sig('sigil_ki', 'Ki Sigil', 'ki', 'speed', 0.10, 'Kaio Planet skills');
  sig('sigil_hex', 'Hex Sigil', 'hex', 'speed', 0.10, 'Shinjuku skills');
  sig('sigil_blade', 'Blade Sigil', 'hex', 'dmg', 0.08, 'damage');
  sig('sigil_ward', 'Ward Sigil', 'hex', 'def', 0.08, 'defense');
  sig('sigil_heart', 'Heart Sigil', 'hex', 'hp', 0.08, 'max HP');
  sig('sigil_coin', 'Coin Sigil', 'hex', 'gold', 0.10, 'gold');
  sig('sigil_lore', 'Lore Sigil', 'hex', 'xp', 0.05, 'XP on every skill');
  sig('sigil_luck', 'Luck Sigil', 'hex', 'rare', 0.08, 'rare finds');
  // cursed gear: huge stats with a price
  defItem('cursed_cleaver', 'Cursed Cleaver', '🪓', 30000, eq('weapon', { atk: 225, hp: -300 }));
  defItem('grudge_mail', 'Grudge Mail', '🥋', 30000, eq('armor', { def: 240, hp: 1300, atk: -25 }));
  defItem('hex_eye', 'Hex Eye', '🧿', 30000, eq('accessory', { atk: 120, hp: 520, def: -40, rare: 0.10 }));
  defItem('schem_cursed_cleaver', 'Schematic: Cursed Cleaver', '📜', 20000, schem('cursed_cleaver'));
  defItem('schem_grudge_mail', 'Schematic: Grudge Mail', '📜', 20000, schem('grudge_mail'));
  defItem('schem_hex_eye', 'Schematic: Hex Eye', '📜', 20000, schem('hex_eye'));
  SKILLS.sigilcraft.actions = [
    craft('sigil_tide', 3, 5, { hex_ash: 10, blue_marlin: 10, tide_pearl: 1 }),
    craft('sigil_blade', 8, 5, { hex_ash: 15, chakra_orb: 10 }),
    craft('sigil_leaf', 15, 5.5, { hex_residue: 10, storm_chakra: 10, shadowroot: 8 }),
    craft('sigil_ward', 20, 5.5, { hex_residue: 15, void_stone: 10 }),
    craft('sigil_soul', 28, 6, { hex_ember: 10, void_stone: 12, spirit_core: 8 }),
    craft('sigil_heart', 34, 6, { hex_ember: 15, vital_bean: 5, wisp_flame: 10 }),
    craft('sigil_ki', 40, 6.5, { hex_shade: 10, ki_core: 10, gravity_plate: 1 }),
    craft('sigil_coin', 46, 6.5, { hex_shade: 15, sapphire: 2, tide_pearl: 2 }),
    craft('sigil_hex', 52, 7, { hex_core: 12, bound_talisman: 1, grave_dust: 10 }),
    needs('schem_cursed_cleaver', craft('cursed_cleaver', 55, 9, { hex_core: 20, bound_talisman: 3, starsteel: 15, ashen_tail: 2 })),
    craft('sigil_lore', 60, 7, { hex_void: 12, sage_lotus: 10, ki_flare: 6 }),
    needs('schem_grudge_mail', craft('grudge_mail', 66, 10, { hex_void: 20, veil_shard: 3, phantom_silk: 10, warrior_sash: 2 })),
    craft('sigil_luck', 72, 7.5, { hex_void: 15, void_diamond: 1, ruby: 2 }),
    needs('schem_hex_eye', craft('hex_eye', 80, 10, { hex_crown: 12, matriarch_eye: 1, void_diamond: 1, tyrant_horn: 1 })),
  ];
  SKILLS.pacts.actions = [];
  for (const s of ['exorcism', 'sigilcraft', 'pacts']) RARE_FINDS[s] = [];
  SHOP.push({ id: 'tools_hex', cat: 'Tools', realm: 'hex', name: 'Warded Satchel', icon: '🛠️', desc: '+10% speed for Shinjuku skills per tier.', costs: [50000, 200000, 800000, 3e6, 9e6] });
  SYNERGIES.push(
    { from: 'exorcism',   to: 'harvest', kind: 'speed',    per: 0.003, name: 'Spirit Sense',  desc: 'Soul Harvest goes faster' },
    { from: 'sigilcraft', to: 'chakra',  kind: 'techcost', per: 0.003, name: 'Sealed Script', desc: 'Techniques cost less chakra' },
    { from: 'pacts',      to: 'gravity', kind: 'speed',    per: 0.003, name: 'Iron Vow',      desc: 'Gravity Training goes faster' },
  );
  // Tinkering learns a tool for Exorcism too
  [1, 2, 3].forEach((t) => {
    const id = `tool_exorcism_${t}`;
    defItem(id, `Spirit Bell Mk ${'I'.repeat(t)}`, '🔧', 300 * t, { type: 'tool', toolFor: 'exorcism', tier: t });
    SKILLS.tinkering.actions.push(craft(id, [20, 50, 80][t - 1], 5 + t, { [['ki_orb', 'ki_flare', 'ki_star'][t - 1]]: 8 * t, [['hex_ash', 'hex_core', 'hex_crown'][t - 1]]: 12 * t }));
  });
  SKILLS.tinkering.actions.sort((a, b) => a.level - b.level);

  const E = (name, hp, atk, def, spd, xp, gold, drops) => en(name, '', hp, atk, def, spd, xp, gold, drops);
  addWorld({
    id: 'hex',
    realm: { name: 'Shinjuku', icon: '🕯️', color: '#36d6a8', ui: '#4fe3b8', tagline: 'Neon alleys, sealed shrines and curses that feed on fear.' },
    zones: [
      { id: 'alleys', name: 'Shadow Alleys', realm: 'hex', rec: 108, enemies: [
        E('Grudge Spirit', 18000, 1100, 420, 2.4, 4000, [1200, 2200], [['hex_residue', 0.3, [2, 4]], ['bound_talisman', 0.08, [1, 1]]]),
        E('Hollow Sorcerer', 21000, 1050, 460, 2.7, 4300, [1300, 2400], [['hex_ember', 0.25, [1, 3]], ['bound_talisman', 0.1, [1, 1]], ['schem_cursed_cleaver', 1 / 150, [1, 1]]]),
      ] },
      { id: 'shrine', name: 'Collapsed Shrine', realm: 'hex', rec: 111, enemies: [
        E('Shrine Specter', 24000, 1300, 470, 2.2, 5200, [1600, 2800], [['hex_shade', 0.25, [1, 3]], ['veil_shard', 0.08, [1, 1]]]),
        E('Bound Corpse', 28000, 1250, 520, 2.6, 5600, [1700, 3000], [['hex_core', 0.2, [1, 2]], ['veil_shard', 0.1, [1, 1]], ['schem_grudge_mail', 1 / 150, [1, 1]]]),
      ] },
      { id: 'veil', name: 'Behind the Veil', realm: 'hex', rec: 114, enemies: [
        E('Veil Walker', 32000, 1550, 520, 2.3, 7000, [2200, 3800], [['hex_void', 0.2, [1, 2]], ['veil_shard', 0.12, [1, 2]]]),
        E('Elder Curse', 36000, 1500, 560, 2.7, 7500, [2300, 4000], [['hex_crown', 0.15, [1, 2]], ['bound_talisman', 0.12, [1, 2]]]),
      ] },
      { id: 'matriarch', name: 'The Grudge Cathedral', realm: 'hex', rec: 117, boss: true, enemies: [
        E('Cursed Matriarch', 150000, 2100, 600, 2.3, 40000, [25000, 50000], [['matriarch_eye', 0.6, [1, 1]], ['hex_crown', 1, [2, 4]], ['schem_hex_eye', 1 / 6, [1, 1]], ['FRUIT', 1 / 8, [1, 1]]]),
      ] },
    ],
    gate: { name: 'The Hex Gate', boss: 'tyrant',
      lore: "The Crimson Tyrant's horn hummed with a curse not of this world. Offer it, with what your farm and your training made, and a gate of black paper will open.",
      offer: { tyrant_horn: 1, gravity_plate: 5, ki_nova: 20, fire_pepper: 10 } },
    unlocks: [
      { id: 'skill:exorcism', name: 'Exorcism', need: () => !!S.gates.hex || usedSkill('exorcism') },
      { id: 'skill:sigilcraft', name: 'Sigilcraft', need: () => skillLv('exorcism') >= 5 || usedSkill('sigilcraft'),
        hint: () => 'Reach Exorcism level 5', why: 'An old sorcerer shows you how to bind cursed essence into sigils.' },
      { id: 'feature:domain', name: 'Your Domain', need: () => skillLv('sigilcraft') >= 5 || S.domain.cells.some(Boolean),
        hint: () => 'Reach Sigilcraft level 5', why: 'You can now shape a Domain of your own: place sigils on its board (menu: Domain).' },
      { id: 'skill:pacts', name: 'Pacts', need: () => (S.combat.kills.alleys || 0) >= 10 || usedSkill('pacts'),
        hint: () => 'Defeat 10 foes in the Shadow Alleys', why: 'A dying sorcerer teaches you the oldest trick: binding vows.' },
    ],
  });
})();

/* ===================================================== WORLD 6: HUNTER'S WILDS */
// Tracking reads trails (beast materials, wild seeds); Trapcraft builds traps and baits;
// Beast Taming captures a companion in any world. The Hunter Licence brings contracts across
// every world, and the Greed Island Cards collects cards from all of them.
const BEASTS = {};   // id -> { name, realm, kind, base, per, desc }
(() => {
  const t = (id, name, v) => defItem(id, name, '🐾', v);
  t('wild_fur', 'Wild Fur', 90); t('swift_feather', 'Swift Feather', 150); t('boar_tusk', 'Boar Tusk', 230); t('stag_antler', 'Stag Antler', 340);
  t('lynx_pelt', 'Lynx Pelt', 480); t('wyrm_scale', 'Wyrm Scale', 660); t('chimera_mane', 'Chimera Mane', 900);
  defItem('trail_stone', 'Trail Stone', '🪨', 6000, relic('hunter'));
  defItem('beastlord_claw', 'Beastlord Claw', '🦴', 9000, relic('hunter'));
  defItem('chimera_heart', 'Chimera Heart', '❤️‍🔥', 30000, relic('hunter'));
  defItem('beast_essence', 'Beast Essence', '✨', 500);
  EXTRA_USES.push(['beast_essence', 'Feed a tamed beast (Beast Taming)']);
  // traps (Beast Taming) and baits (Fishing, Tracking)
  const trap = (id, name, tier) => defItem(id, name, '🪤', 100 * tier, { type: 'trap', tier });
  trap('snare', 'Snare', 1); trap('net_trap', 'Net Trap', 2); trap('cage_trap', 'Cage Trap', 3);
  trap('spirit_trap', 'Spirit Trap', 4); trap('wyrm_trap', 'Wyrm Trap', 5); trap('chimera_trap', 'Chimera Trap', 6);
  defItem('fish_bait', 'Fish Bait', '🪱', 30, { type: 'bait', baitFor: 'fishing' });
  defItem('scent_lure', 'Scent Lure', '🧴', 60, { type: 'bait', baitFor: 'tracking' });
  // iconic Hunter gear
  defItem('hunter_glaive', "Hunter's Glaive", '🔱', 60000, eq('weapon', { atk: 300 }));
  defItem('wildhide_coat', 'Wildhide Coat', '🧥', 60000, eq('armor', { def: 310, hp: 1750 }));
  defItem('star_badge', 'Star Hunter Badge', '⭐', 60000, eq('accessory', { atk: 165, def: 60, hp: 700, gold: 0.15 }));
  defItem('schem_hunter_glaive', "Schematic: Hunter's Glaive", '📜', 40000, schem('hunter_glaive'));
  defItem('schem_wildhide_coat', 'Schematic: Wildhide Coat', '📜', 40000, schem('wildhide_coat'));
  defItem('schem_star_badge', 'Schematic: Star Hunter Badge', '📜', 40000, schem('star_badge'));

  SKILLS.tracking = { name: 'Tracking', realm: 'hunter', icon: '🐾', type: 'gather',
    desc: 'Read trails to find beast materials and wild seeds. A good tracker also gets better contracts.' };
  SKILLS.trapcraft = { name: 'Trapcraft', realm: 'hunter', icon: '🪤', type: 'craft',
    desc: 'Build traps for Beast Taming and baits that make Fishing and Tracking luckier.' };
  SKILLS.taming = { name: 'Beast Taming', realm: 'hunter', icon: '🦁', type: 'tame',
    desc: 'Trap beasts from every world. One companion at a time fights or works beside you and grows with you.' };
  const TR = (item, level, time, name, extra) => Object.assign(gather(item, level, time), { name, extra });
  SKILLS.tracking.actions = [
    TR('wild_fur', 1, 3, 'Rabbit Trails', [['seed_vital_bean', 0.03, [1, 1]], ['seed_sun_wheat', 0.02, [1, 1]]]),
    TR('swift_feather', 10, 3.5, 'Bird Nests', [['seed_moon_rice', 0.02, [1, 1]]]),
    TR('boar_tusk', 22, 4, 'Boar Wallows', [['seed_fire_pepper', 0.02, [1, 1]], ['trail_stone', 0.01, [1, 1]]]),
    TR('stag_antler', 35, 4.5, 'Stag Paths', [['seed_frost_melon', 0.015, [1, 1]], ['trail_stone', 0.015, [1, 1]]]),
    TR('lynx_pelt', 50, 5, 'Lynx Den', [['seed_thunder_root', 0.012, [1, 1]], ['trail_stone', 0.02, [1, 1]]]),
    TR('wyrm_scale', 65, 5.5, 'Wyrm Tracks', [['seed_star_fruit', 0.01, [1, 1]], ['beastlord_claw', 0.015, [1, 1]]]),
    TR('chimera_mane', 80, 6.5, 'Chimera Spoor', [['beastlord_claw', 0.025, [1, 1]], ['beast_essence', 0.05, [1, 1]]]),
  ];
  SKILLS.trapcraft.actions = [
    craft('fish_bait', 1, 2, { minnow: 2, wild_fur: 1 }, 5),
    craft('snare', 3, 4, { wild_fur: 6, cloud_fern: 4 }),
    craft('scent_lure', 10, 3, { swift_feather: 2, moonpetal: 3 }, 4),
    craft('net_trap', 15, 5, { swift_feather: 8, wisp_flame: 3, wild_fur: 6 }),
    craft('cage_trap', 30, 6, { boar_tusk: 8, black_iron: 8 }),
    needs('schem_hunter_glaive', craft('hunter_glaive', 40, 10, { trail_stone: 4, stag_antler: 12, starsteel: 20, tyrant_horn: 1 })),
    craft('spirit_trap', 45, 6.5, { stag_antler: 8, hex_core: 6, veil_shard: 1 }),
    needs('schem_wildhide_coat', craft('wildhide_coat', 55, 10, { beastlord_claw: 3, lynx_pelt: 15, warrior_sash: 3, hex_void: 10 })),
    craft('wyrm_trap', 60, 7, { lynx_pelt: 8, sunstone: 8, gravity_plate: 2 }),
    needs('schem_star_badge', craft('star_badge', 70, 10, { chimera_heart: 1, wyrm_scale: 12, void_diamond: 1, matriarch_eye: 1 })),
    craft('chimera_trap', 75, 8, { wyrm_scale: 8, chimera_mane: 4, beastlord_claw: 1 }),
  ];
  // Beasts: captured with a trap in Beast Taming. Each gives one bonus that grows with its level (max 20).
  const B = (id, name, realm, level, trapId, kind, base, per, desc) => { BEASTS[id] = { name, realm, level, trap: trapId, kind, base, per, desc }; };
  B('reef_turtle', 'Reef Turtle', 'seas', 1, 'snare', 'speed:fishing', 0.10, 0.01, 'Fishing speed');
  B('storm_gull', 'Storm Gull', 'seas', 8, 'snare', 'speed:voyaging', 0.10, 0.01, 'Voyaging speed');
  B('ninken_pup', 'Ninken Pup', 'shinobi', 15, 'net_trap', 'dmg', 0.06, 0.005, 'damage');
  B('ghost_cat', 'Ghost Cat', 'soul', 25, 'cage_trap', 'rare', 0.08, 0.006, 'rare finds');
  B('thunder_ape', 'Thunder Ape', 'ki', 35, 'cage_trap', 'hp', 0.08, 0.006, 'max HP');
  B('cursed_toad', 'Cursed Toad', 'hex', 45, 'spirit_trap', 'xp', 0.05, 0.004, 'XP on every skill');
  B('great_stag', 'Great Stag', 'hunter', 55, 'wyrm_trap', 'gather', 0.06, 0.005, 'gathering speed');
  B('sky_lynx', 'Sky Lynx', 'hunter', 70, 'chimera_trap', 'dodge', 0.04, 0.003, 'dodge chance');
  const xpOf = (lv, tm) => xpFor(lv, tm, true);
  SKILLS.taming.actions = Object.entries(BEASTS).map(([id, b]) => ({ id: 'tame_' + id, name: `Hunt: ${b.name}`, level: b.level, time: 8 + b.level / 10, xp: xpOf(b.level, 8 + b.level / 10), in: { [b.trap]: 1 }, beast: id, icon: ['beast', id], kind: 'Beast hunt' }));
  for (const s of ['tracking', 'trapcraft', 'taming']) RARE_FINDS[s] = [];
  SHOP.push({ id: 'tools_hunter', cat: 'Tools', realm: 'hunter', name: 'Hunter Kit', icon: '🛠️', desc: "+10% speed for Green Island skills per tier.", costs: [120000, 500000, 2e6, 7e6, 2e7] });
  SYNERGIES.push(
    { from: 'tracking',  to: 'herbalism', kind: 'rare',   per: 0.004, name: 'Wild Seeds', desc: 'More rare finds (and seeds) while foraging' },
    { from: 'trapcraft', to: 'fishing',   kind: 'double', per: 0.002, name: 'Bait Craft', desc: 'Chance to catch two fish' },
    { from: 'taming',    to: 'farming',   kind: 'double', per: 0.003, name: 'Beast Plough', desc: 'Chance for a double harvest' },
  );
  defItem('sigil_hunt', 'Hunt Sigil', '🔯', 300, { type: 'sigil' });
  SIGILS.sigil_hunt = { tag: 'hunter', kind: 'speed', target: 'hunter', val: 0.10, desc: "Green Island skills" };
  SKILLS.sigilcraft.actions.push(craft('sigil_hunt', 62, 7, { hex_void: 10, trail_stone: 1, stag_antler: 10 }));
  SKILLS.sigilcraft.actions.sort((a, b) => a.level - b.level);
  [1, 2, 3].forEach((tier) => {
    const id = `tool_tracking_${tier}`;
    defItem(id, `Hunter's Compass Mk ${'I'.repeat(tier)}`, '🔧', 300 * tier, { type: 'tool', toolFor: 'tracking', tier });
    SKILLS.tinkering.actions.push(craft(id, [25, 55, 85][tier - 1], 5 + tier, { [['ki_core', 'ki_nova', 'ki_star'][tier - 1]]: 8 * tier, [['wild_fur', 'stag_antler', 'wyrm_scale'][tier - 1]]: 12 * tier }));
  });
  SKILLS.tinkering.actions.sort((a, b) => a.level - b.level);

  const E = (name, hp, atk, def, spd, xp, gold, drops) => en(name, '', hp, atk, def, spd, xp, gold, drops);
  addWorld({
    id: 'hunter',
    realm: { name: "Green Island", icon: '🐾', color: '#9be15d', ui: '#a8e86b', tagline: 'Untamed forests, licensed hunters and beasts worth a fortune.' },
    zones: [
      { id: 'thicket', name: 'Exam Thicket', realm: 'hunter', rec: 118, enemies: [
        E('Rival Examinee', 48000, 2500, 650, 2.3, 10000, [3000, 5000], [['swift_feather', 0.3, [2, 4]], ['trail_stone', 0.08, [1, 1]]]),
        E('Swamp Mimic', 54000, 2400, 700, 2.7, 10500, [3200, 5200], [['boar_tusk', 0.3, [1, 3]], ['trail_stone', 0.1, [1, 1]], ['schem_hunter_glaive', 1 / 150, [1, 1]]]),
      ] },
      { id: 'cliffs', name: 'Wyvern Cliffs', realm: 'hunter', rec: 119, enemies: [
        E('Cliff Wyvern', 62000, 2850, 700, 2.2, 12500, [3800, 6000], [['wyrm_scale', 0.2, [1, 2]], ['beastlord_claw', 0.06, [1, 1]]]),
        E('Bandit Hunter', 66000, 2800, 740, 2.5, 13000, [4000, 6400], [['lynx_pelt', 0.25, [1, 2]], ['trail_stone', 0.12, [1, 2]], ['schem_wildhide_coat', 1 / 150, [1, 1]]]),
      ] },
      { id: 'ruins', name: 'Beastlord Ruins', realm: 'hunter', rec: 120, enemies: [
        E('Ruin Guardian', 78000, 3200, 780, 2.6, 16000, [5000, 8000], [['chimera_mane', 0.15, [1, 2]], ['beastlord_claw', 0.1, [1, 1]]]),
        E('Feral Chimera', 72000, 3400, 760, 2.2, 15500, [5000, 8000], [['wyrm_scale', 0.25, [1, 2]], ['beastlord_claw', 0.12, [1, 1]], ['beast_essence', 0.1, [1, 1]]]),
      ] },
      { id: 'chimera', name: "The Chimera King's Nest", realm: 'hunter', rec: 120, boss: true, enemies: [
        E('Chimera King', 320000, 4300, 820, 2.3, 90000, [60000, 120000], [['chimera_heart', 0.6, [1, 1]], ['chimera_mane', 1, [2, 4]], ['beast_essence', 1, [2, 4]], ['schem_star_badge', 1 / 6, [1, 1]], ['FRUIT', 1 / 6, [1, 1]]]),
      ] },
    ],
    gate: { name: "The Hunter's Trail", boss: 'matriarch',
      lore: "The Matriarch's eye still sees: a trail leading out of the cursed city into a green, roaring wild. Pay the hunters' toll to walk it.",
      offer: { matriarch_eye: 1, veil_shard: 4, hex_void: 20, bound_talisman: 3 } },
    unlocks: [
      { id: 'skill:tracking', name: 'Tracking', need: () => !!S.gates.hunter || usedSkill('tracking') },
      { id: 'skill:trapcraft', name: 'Trapcraft', need: () => skillLv('tracking') >= 5 || usedSkill('trapcraft'),
        hint: () => 'Reach Tracking level 5', why: 'An old trapper trades you her tools for your furs.' },
      { id: 'skill:taming', name: 'Beast Taming', need: () => (S.stats.made.snare || 0) >= 1 || usedSkill('taming'),
        hint: () => 'Build your first Snare in Trapcraft', why: 'With a snare in hand, you can try to tame a beast of your own.' },
      { id: 'feature:contracts', name: 'Hunter Licence', need: () => (S.combat.kills.thicket || 0) >= 10 || (S.contracts && S.contracts.stars > 0),
        hint: () => 'Defeat 10 foes in the Exam Thicket', why: 'You passed the Hunter Exam. Contracts now come in from every world (menu: Contracts).' },
    ],
  });
})();

/* ======================================================= WORLD 7: ECHO QUARTER */
// Archaeology digs one site per world; Restoration rebuilds artifacts (permanent museum bonuses)
// and ancient versions of iconic gear; Echo Bonding awakens an Echo that runs a second activity in parallel.
const ARTIFACTS = {};   // id -> { realm, desc, kind, val }
const ECHOES = [
  { id: 'gilded_hand', name: 'Gilded Hand', ability: 'Each action your Echo finishes also pays gold (5× its XP).' },
  { id: 'rewind',      name: 'Rewind',      ability: 'Crafts done by your Echo have a 15% chance to give their materials back.' },
  { id: 'star_fist',   name: 'Star Fist',   ability: 'Power counts double in combat.' },
  { id: 'silent_tide', name: 'Silent Tide', ability: 'Works 50% faster on Orange Town skills.' },
  { id: 'paper_moon',  name: 'Paper Moon',  ability: '+10% rare finds on everything you do.' },
  { id: 'iron_bloom',  name: 'Iron Bloom',  ability: 'Durability counts double, +10% defense.' },
];
(() => {
  const f = (id, name, v) => defItem(id, name, '🏺', v);
  f('clay_fragment', 'Clay Fragment', 120); f('bronze_fragment', 'Bronze Fragment', 200); f('jade_fragment', 'Jade Fragment', 300);
  f('gold_fragment', 'Gold Fragment', 430); f('obsidian_fragment', 'Obsidian Fragment', 600); f('starmetal_fragment', 'Starmetal Fragment', 820); f('pillar_fragment', 'Pillar Fragment', 1100);
  defItem('awakening_shard', 'Awakening Shard', '💠', 4000);
  defItem('echo_dust', 'Echo Dust', '✨', 900, relic('echo'));
  defItem('pillar_glyph', 'Pillar Glyph', '🗿', 14000, relic('echo'));
  defItem('lord_visage', "Pillar Lord's Visage", '🗿', 45000, relic('echo'));
  // museum artifacts: restore each once for a permanent bonus
  const art = (id, name, realm, kind, val, desc) => { defItem(id, name, '🏺', 20000, { type: 'artifact' }); ARTIFACTS[id] = { realm, kind, val, desc }; };
  art('mermaid_compass', "Mermaid's Compass", 'seas', 'speed', 0.08, 'Orange Town skills +8% speed');
  art('founders_scroll', "Founder's Scroll", 'shinobi', 'speed', 0.08, 'Leaf Village skills +8% speed');
  art('reaper_hourglass', "Reaper's Hourglass", 'soul', 'speed', 0.08, 'Soul City skills +8% speed');
  art('gravity_seal', 'Ancient Gravity Seal', 'ki', 'dmg', 0.05, '+5% damage');
  art('sealed_grimoire', 'Sealed Grimoire', 'hex', 'xp', 0.05, '+5% XP on every skill');
  art('first_licence', 'The First Licence', 'hunter', 'gold', 0.10, '+10% gold');
  art('sunstone_visage', 'Sunstone Visage', 'echo', 'hp', 0.06, '+6% max HP');
  // ancient iconic gear (Restoration): the original + fragments + relics -> a tier above everything
  defItem('ancient_fog_cleaver', 'Ancient Fog Cleaver', '🪓', 120000, eq('weapon', { atk: 400 }));
  defItem('ancient_ferryman_robe', "Ancient Ferryman's Robe", '🧥', 120000, eq('armor', { def: 420, hp: 2400 }));
  defItem('ancient_stormcaller', 'Ancient Stormcaller', '⚡', 150000, eq('weapon', { atk: 440 }));
  defItem('ancient_gravity_bracer', 'Ancient Gravity Bracer', '⭕', 130000, eq('accessory', { atk: 230, def: 100, hp: 1100 }));

  SKILLS.archaeology = { name: 'Archaeology', realm: 'echo', icon: '⛏️', type: 'gather',
    desc: 'Dig one site in every world. Fragments, that world\'s materials, and rare Awakening Shards.' };
  SKILLS.restoration = { name: 'Restoration', realm: 'echo', icon: '🏺', type: 'craft',
    desc: 'Restore artifacts for permanent museum bonuses, and rebuild ancient versions of iconic gear.' };
  SKILLS.bonding = { name: 'Echo Bonding', realm: 'echo', icon: '👤', type: 'bond',
    desc: 'Awaken an Echo, a spirit that stands beside you. It runs a second activity in parallel and grows as your bond deepens.' };
  const D = (item, level, time, name, extra) => Object.assign(gather(item, level, time), { name, extra });
  SKILLS.archaeology.actions = [
    D('clay_fragment', 1, 3.5, 'Dig: Sunken Wreck', [['tide_pearl', 0.03, [1, 1]], ['reef_bass', 0.3, [1, 2]], ['awakening_shard', 0.01, [1, 1]]]),
    D('bronze_fragment', 12, 4, 'Dig: Hidden Village', [['mist_steel', 0.04, [1, 1]], ['chakra_orb', 0.3, [1, 2]], ['awakening_shard', 0.012, [1, 1]]]),
    D('jade_fragment', 24, 4.5, 'Dig: Grave of Kings', [['husk_heart', 0.04, [1, 1]], ['spirit_core', 0.3, [1, 2]], ['awakening_shard', 0.015, [1, 1]]]),
    D('gold_fragment', 36, 5, 'Dig: Crater Field', [['gravity_plate', 0.03, [1, 1]], ['ki_core', 0.3, [1, 2]], ['awakening_shard', 0.018, [1, 1]]]),
    D('obsidian_fragment', 50, 5.5, 'Dig: Sealed Archive', [['bound_talisman', 0.03, [1, 1]], ['hex_core', 0.3, [1, 2]], ['awakening_shard', 0.022, [1, 1]]]),
    D('starmetal_fragment', 64, 6, 'Dig: Fossil Canyon', [['trail_stone', 0.03, [1, 1]], ['lynx_pelt', 0.3, [1, 2]], ['awakening_shard', 0.026, [1, 1]]]),
    D('pillar_fragment', 78, 7, 'Dig: Pillar Temple', [['echo_dust', 0.08, [1, 2]], ['pillar_glyph', 0.02, [1, 1]], ['awakening_shard', 0.03, [1, 1]]]),
  ];
  SKILLS.restoration.actions = [
    craft('mermaid_compass', 5, 8, { clay_fragment: 40, tide_heart: 1, sapphire: 2 }),
    craft('founders_scroll', 18, 9, { bronze_fragment: 40, ashen_tail: 2, sage_lotus: 10 }),
    craft('reaper_hourglass', 30, 10, { jade_fragment: 40, sovereign_shard: 2, echo_soul: 5 }),
    craft('ancient_fog_cleaver', 38, 12, { fog_cleaver: 1, bronze_fragment: 60, mist_steel: 30, pillar_glyph: 1 }),
    craft('gravity_seal', 44, 10, { gold_fragment: 40, tyrant_horn: 1, ki_nova: 10 }),
    craft('ancient_ferryman_robe', 52, 12, { ferryman_robe: 1, jade_fragment: 80, bone_ivory: 20, pillar_glyph: 2 }),
    craft('sealed_grimoire', 58, 11, { obsidian_fragment: 40, matriarch_eye: 1, hex_crown: 6 }),
    craft('ancient_stormcaller', 66, 13, { stormcaller: 1, clay_fragment: 120, leviathan_scale: 20, lord_visage: 1 }),
    craft('first_licence', 72, 11, { starmetal_fragment: 40, chimera_heart: 1, beastlord_claw: 3 }),
    craft('ancient_gravity_bracer', 80, 13, { gravity_bracer: 1, gold_fragment: 100, tyrant_horn: 2, lord_visage: 1 }),
    craft('sunstone_visage', 86, 12, { pillar_fragment: 40, lord_visage: 1, echo_dust: 20 }),
  ];
  // Echo Bonding: awaken (3 shards) and commune (bond XP)
  SKILLS.bonding.actions = [
    { id: 'commune', name: 'Commune with your Echo', level: 1, time: 6, xp: xpFor(1, 6, true) * 2, icon: ['ui', 'echo'], kind: 'Ritual' },
    { id: 'awaken', name: 'Awaken an Echo', level: 1, time: 15, xp: xpFor(10, 15, true), in: { awakening_shard: 3 }, icon: ['ui', 'awaken2'], kind: 'Ritual' },
    { id: 'deep_commune', name: 'Deep Communion', level: 40, time: 10, xp: xpFor(40, 10, true) * 2, in: { echo_dust: 1 }, icon: ['ui', 'echo'], kind: 'Ritual' },
  ];
  for (const s of ['archaeology', 'restoration', 'bonding']) RARE_FINDS[s] = [];
  SHOP.push({ id: 'tools_echo', cat: 'Tools', realm: 'echo', name: "Curator's Kit", icon: '🛠️', desc: '+10% speed for Echo Quarter skills per tier.', costs: [300000, 1.2e6, 5e6, 2e7, 6e7] });
  SYNERGIES.push(
    { from: 'archaeology', to: 'mining',   kind: 'rare', per: 0.004, name: 'Strata Reading', desc: 'More gems and rare finds while mining' },
    { from: 'restoration', to: 'smithing', kind: 'xp',   per: 0.003, name: 'Old Techniques', desc: 'More Bladesmithing XP' },
    { from: 'bonding',     to: 'all',      kind: 'xp',   per: 0.001, name: 'Shared Will',    desc: 'A little more XP on every skill' },
  );
  defItem('sigil_echo', 'Echo Sigil', '🔯', 300, { type: 'sigil' });
  SIGILS.sigil_echo = { tag: 'echo', kind: 'speed', target: 'echo', val: 0.10, desc: 'Echo Quarter skills' };
  SKILLS.sigilcraft.actions.push(craft('sigil_echo', 76, 7.5, { hex_crown: 8, echo_dust: 4, pillar_fragment: 10 }));
  SKILLS.sigilcraft.actions.sort((a, b) => a.level - b.level);
  [1, 2, 3].forEach((tier) => {
    const id = `tool_archaeology_${tier}`;
    defItem(id, `Brush & Pick Mk ${'I'.repeat(tier)}`, '🔧', 300 * tier, { type: 'tool', toolFor: 'archaeology', tier });
    SKILLS.tinkering.actions.push(craft(id, [30, 60, 88][tier - 1], 5 + tier, { [['ki_core', 'ki_nova', 'ki_star'][tier - 1]]: 8 * tier, [['clay_fragment', 'obsidian_fragment', 'pillar_fragment'][tier - 1]]: 12 * tier }));
  });
  SKILLS.tinkering.actions.sort((a, b) => a.level - b.level);
  BEASTS.stone_owl = { name: 'Stone Owl', realm: 'echo', level: 80, trap: 'chimera_trap', kind: 'echo', base: 0.10, per: 0.008, desc: 'Echo speed' };
  SKILLS.taming.actions.push({ id: 'tame_stone_owl', name: 'Hunt: Stone Owl', level: 80, time: 16, xp: xpFor(80, 16, true), in: { chimera_trap: 1 }, beast: 'stone_owl', icon: ['beast', 'stone_owl'], kind: 'Beast hunt' });

  const E = (name, hp, atk, def, spd, xp, gold, drops) => en(name, '', hp, atk, def, spd, xp, gold, drops);
  addWorld({
    id: 'echo',
    realm: { name: 'Echo Quarter', icon: '🗿', color: '#ef7cff', ui: '#f08cff', tagline: 'Ancient pillars, striking poses and spirits that stand beside you.' },
    zones: [
      { id: 'plaza', name: 'Marble Plaza', realm: 'echo', rec: 120, enemies: [
        E('Masked Vampire', 85000, 3900, 880, 2.3, 22000, [7000, 11000], [['pillar_fragment', 0.2, [1, 2]], ['echo_dust', 0.12, [1, 2]]]),
        E('Sunlight Monk', 92000, 3800, 920, 2.6, 23000, [7500, 11500], [['starmetal_fragment', 0.3, [1, 2]], ['echo_dust', 0.12, [1, 2]], ['awakening_shard', 0.02, [1, 1]]]),
      ] },
      { id: 'museum', name: 'Haunted Museum', realm: 'echo', rec: 120, enemies: [
        E('Living Statue', 105000, 4300, 980, 2.8, 27000, [9000, 14000], [['pillar_glyph', 0.06, [1, 1]], ['obsidian_fragment', 0.3, [1, 2]]]),
        E('Echo Thief', 98000, 4500, 920, 2.1, 26000, [9000, 14000], [['awakening_shard', 0.04, [1, 1]], ['echo_dust', 0.15, [1, 2]]]),
      ] },
      { id: 'pillars', name: 'Hall of Pillars', realm: 'echo', rec: 120, enemies: [
        E('Pillar Warrior', 125000, 4900, 1020, 2.5, 33000, [11000, 17000], [['pillar_glyph', 0.08, [1, 1]], ['pillar_fragment', 0.3, [1, 2]]]),
        E('Wind Pillar Guard', 118000, 5100, 990, 2.2, 32000, [11000, 17000], [['pillar_glyph', 0.08, [1, 1]], ['awakening_shard', 0.03, [1, 1]]]),
      ] },
      { id: 'pillar', name: 'The Pillar Throne', realm: 'echo', rec: 120, boss: true, enemies: [
        E('Pillar Lord', 520000, 6200, 1080, 2.3, 160000, [120000, 220000], [['lord_visage', 0.6, [1, 1]], ['pillar_glyph', 1, [1, 3]], ['awakening_shard', 0.5, [1, 2]], ['FRUIT', 1 / 5, [1, 1]]]),
      ] },
    ],
    gate: { name: 'The Echo Door', boss: 'chimera',
      lore: "The Chimera King's heart still beats. Behind its nest, a stone door carved with strange poses is waiting for it.",
      offer: { chimera_heart: 1, beastlord_claw: 3, chimera_mane: 10, trail_stone: 5 } },
    unlocks: [
      { id: 'skill:archaeology', name: 'Archaeology', need: () => !!S.gates.echo || usedSkill('archaeology') },
      { id: 'skill:restoration', name: 'Restoration', need: () => skillLv('archaeology') >= 5 || usedSkill('restoration'),
        hint: () => 'Reach Archaeology level 5', why: 'A curator offers to teach you how to restore what you dig up.' },
      { id: 'skill:bonding', name: 'Echo Bonding', need: () => skillLv('archaeology') >= 10 || usedSkill('bonding') || !!S.echo.id,
        hint: () => 'Reach Archaeology level 10', why: 'Among the fragments, a shard hums with a will of its own. Three of them could wake an Echo.' },
    ],
  });

  /* --------------------------------------------------------------- THE RIFT: finale */
  // The Convergence (Rift Emperor), then the Rift Tear (rotating foes from two worlds), then the Unbound.
  GATES.rift.offer = { tide_heart: 1, ashen_tail: 2, sovereign_shard: 2, tyrant_horn: 1, matriarch_eye: 1, chimera_heart: 1, lord_visage: 1 };
  GATES.rift.lore = 'Every world touches at a single point. A relic from each of the seven will tear it open.';
  const rz = ZONES.find((z) => z.id === 'convergence');
  rz.rec = 120;
  rz.enemies = [E('Rift Emperor', 1200000, 8000, 1150, 2.2, 400000, [400000, 700000], [['rift_shard', 1, [1, 2]], ['rift_eye', 1 / 12, [1, 1]], ['awakening_shard', 0.5, [1, 2]], ['FRUIT', 1 / 3, [1, 1]]])];
  ZONES.push(
    { id: 'tear', name: 'Rift Tear', realm: 'rift', rec: 120, tear: true, enemies: [] },
    { id: 'unbound', name: 'Heart of the Rift', realm: 'rift', rec: 120, boss: true, enemies: [
      E('The Unbound', 3000000, 11000, 1300, 2.2, 1200000, [1.2e6, 2e6], [['rift_shard', 1, [2, 4]], ['rift_eye', 1 / 6, [1, 1]], ['FRUIT', 1 / 2, [1, 1]], ['lord_visage', 0.5, [1, 1]]]),
    ] },
  );
  defItem('rift_eye', 'Eye of the Rift', '🌌', 30000, eq('accessory', { atk: 260, def: 120, hp: 1400, rare: 0.10 }));
  defItem('rift_cleaver', 'Rift Cleaver', '🪓', 300000, eq('weapon', { atk: 520 }));
})();

/* ====================================================================== end */
finalizeWorlds();
