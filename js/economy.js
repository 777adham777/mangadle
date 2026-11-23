'use strict';
/* ==========================================================================
   TRI-REALM — the gear economy (DOM-free). One table sets every piece of equipment and its recipe.
   Loaded after builds.js (perks) and before the story / UI, so every file sees the final numbers.

   1. Every piece belongs to a STAGE: the battle stage (ZONES index, 0 = Training Grounds,
      28 = the Convergence) where it is meant to be worn. Its stats come from one power curve
      (WEAPON_ATK, ARMOR_DEF; HP = 5.6 × DEF), times its ROLE (a crafted piece 1.0, a schematic
      1.1, a rare drop 1.12, a boss drop 1.18, an Epic drop 1.25...). Pieces of the same stage are
      worth the same: what tells them apart is their perk (crit, bleed, life steal, thorns...).
   2. Perks keep their identity and are scaled to a budget by role (PERKS[k].unit = one perk),
      growing slowly with the stage.
   3. Recipes: the Crafting level follows the stage (ARTS_AT), so the recipes of a world unlock
      while you play in it, and their ingredients are what that world gives (its skills, its
      battles, its voyages) plus one older material, so earlier skills stay useful.
      Quantities come from a cost budget split in shares; boss parts and gems are fixed.
   4. Value follows the stage too: it sets the ingots a weapon is refined with (REF_INGOT)
      and the souls its awakening burns (RELEASE_COST).
   ========================================================================== */

// Stage → power. Interpolated between whole stages.
const WEAPON_ATK = [4, 10, 18, 26, 34, 42, 52, 62, 72, 84, 97, 110, 125, 140, 155, 170, 190, 210, 230, 250, 275, 300, 325, 350, 380, 410, 440, 470, 520, 560, 600];
const ARMOR_DEF = [5, 8, 13, 20, 28, 36, 45, 55, 66, 78, 90, 105, 120, 135, 150, 165, 185, 205, 225, 245, 270, 295, 320, 345, 370, 395, 420, 445, 480, 510, 540];
// Stage → Crafting level of its recipes: Leaf Village 1-30, Orange Town 36-48, Soul City 50-62,
// Kaio Planet 64-71, Shinjuku 73-78, Green Island 80-86, then the post-game.
const ARTS_AT = [[0, 1], [0.5, 4], [1, 8], [1.5, 12], [2, 18], [2.5, 24], [3, 30], [4, 36], [5, 42], [6, 46], [7, 48], [8, 50], [9, 54], [10, 58], [11, 61],
  [12, 64], [13, 67], [14, 69], [16, 73], [17, 75], [18, 77], [20, 80], [21, 82], [22, 84], [24, 88], [26, 92], [28, 95]];
const ECO_ROLE = {   // stats × , perk budget (in perk units), value ×
  craft:  [1.00, 1.0, 1.0], drop: [1.03, 1.0, 1.1], schem: [1.10, 1.3, 1.3], rare: [1.12, 1.3, 1.5],
  boss:   [1.18, 1.5, 1.8], epic: [1.25, 1.6, 2.2], relic: [1.20, 1.6, 2.5], legend: [1.35, 1.9, 3], util: [0.6, 1.0, 1.0],
};
// Accessories lean one way: offence, defence or a bit of both.
const ACC_SHAPE = { off: { atk: 0.5, hp: 0.2 }, def: { def: 0.45, hp: 0.45 }, hyb: { atk: 0.3, def: 0.22, hp: 0.25 } };
// One "perk" for the utility stats that are not in PERKS.
const ECO_UNIT = { dodge: 0.03, gold: 0.1, rare: 0.06, cxp: 0.06, speed: 0.04 };

// id: [stage, role, accessory shape]
const GEAR_TIERS = {
  // ---- Leaf Village (stages 0-3)
  training_kunai: [0, 'craft'], crystal_kunai: [0.5, 'craft'], senbon: [1, 'drop'], iron_wakizashi: [1.5, 'craft'], chakra_blade: [2, 'craft'], fog_cleaver: [2.5, 'schem'],
  flak_vest: [0.3, 'craft'], puppet_plating: [1, 'drop'], chakra_mesh: [2, 'craft'], frost_garb: [2.8, 'craft'],
  shinobi_headband: [1, 'craft', 'hyb'], jade_amulet: [2, 'craft', 'def'], wolf_fang: [2, 'drop', 'off'], sealing_talisman: [2.5, 'schem', 'off'],
  golem_heart: [2.5, 'rare', 'def'], old_compass: [3, 'util', 'hyb'], fox_tail_charm: [3.5, 'boss', 'off'],
  // ---- Orange Town (4-7); the Ashen Fox's parts open it
  ashen_fang: [4, 'schem'], rusty_cutlass: [4, 'drop'], hand_cannon: [4.5, 'rare'], corsair_cutlass: [6, 'rare'], stormcaller: [6.5, 'schem'],
  beast_cloak: [4, 'craft'], marine_coat: [4, 'rare'], sage_robe: [5, 'craft'], leviathan_mail: [6, 'rare'], admiral_coat: [7.5, 'boss'],
  sea_charm: [5, 'drop', 'def'], shark_tooth: [5, 'rare', 'off'], kraken_compass: [5.5, 'schem', 'hyb'], storm_crown: [7.5, 'boss', 'off'],
  // ---- Soul City (8-11); the Admiral's coat schematic opens it
  spirit_katana: [8, 'craft'], husk_claw: [8.5, 'rare'], awakened_blade: [9, 'craft'], reapers_edge: [9.5, 'schem'], wraith_sickle: [9.5, 'rare'],
  black_warhammer: [10, 'craft'], bone_lance: [10.5, 'rare'], sovereign_blade: [10.5, 'craft'], sunforged_bow: [11, 'craft'],
  tide_mantle: [8, 'schem'], husk_carapace: [9, 'rare'], ferryman_robe: [10, 'schem'], sovereign_cloak: [11.5, 'boss'],
  reishi_ring: [8, 'craft', 'def'], reaper_scarf: [8.5, 'rare', 'off'], sapphire_charm: [9, 'craft', 'def'], prayer_beads: [10.5, 'rare', 'def'],
  ruby_crest: [10.5, 'craft', 'off'], sovereign_mask: [11.5, 'boss', 'hyb'],
  // ---- Kaio Planet (12-15); the Sovereign's schematic opens it
  eclipse_blade: [12, 'schem'], power_gauntlets: [13, 'schem'], crimson_knuckles: [15.5, 'epic'],
  storm_mantle: [12.5, 'craft'], battle_armor: [13.5, 'schem'], weighted_gi: [14, 'epic'],
  void_band: [12.5, 'craft', 'hyb'], battle_scouter: [13, 'epic', 'off'],
  // ---- Shinjuku (16-19); the Tyrant's schematic opens it
  cursed_cleaver: [17, 'schem'], paper_blade: [17, 'epic'], grudge_mail: [17.5, 'schem'], veil_shroud: [18, 'epic'],
  gravity_bracer: [16, 'schem', 'hyb'], matriarch_rosary: [19.5, 'epic', 'hyb'],
  // ---- Green Island (20-23); the Matriarch's schematic opens it
  hunter_glaive: [21, 'schem'], wyvern_bow: [21.5, 'epic'], wildhide_coat: [21.5, 'schem'], beastlord_mantle: [22, 'epic'],
  hex_eye: [20, 'schem', 'off'], chimera_fang: [23.5, 'epic', 'off'],
  // ---- Echo Quarter (24-27); the Chimera King's schematic opens it
  ripple_gloves: [24.5, 'epic'], ancient_fog_cleaver: [25, 'relic'], ancient_stormcaller: [26.5, 'relic'],
  ancient_ferryman_robe: [25.5, 'relic'], sunlit_armor: [27.5, 'epic'],
  star_badge: [24, 'schem', 'hyb'], stone_mask: [25, 'epic', 'hyb'], ancient_gravity_bracer: [27, 'relic', 'hyb'],
  // ---- The Rift (28+)
  rift_cleaver: [28.5, 'legend'], rift_eye: [29, 'legend', 'hyb'],
};

// Crafting recipes of the gear. Shares split the cost budget; [n] = a fixed count (boss parts, gems).
const GEAR_RECIPES = {
  // Leaf Village: wood, herbs and the chakra of its battles
  training_kunai:   { pine_log: 1 },
  crystal_kunai:    { chakra_shard: 0.6, pine_log: 0.4 },
  flak_vest:        { healing_leaf: 0.5, chakra_shard: 0.3, pine_log: 0.2 },
  shinobi_headband: { moonpetal: 0.5, chakra_orb: 0.3, cedar_log: 0.2 },
  iron_wakizashi:   { mist_steel: [1], chakra_orb: 0.5, cedar_log: 0.3, chakra_shard: 0.2 },
  chakra_blade:     { chakra_orb: 0.5, cloud_fern: 0.25, bamboo: 0.25 },
  chakra_mesh:      { cloud_fern: 0.4, chakra_orb: 0.35, moonpetal: 0.25 },
  jade_amulet:      { jade: [1], moonpetal: 0.4, bamboo: 0.3, healing_leaf: 0.3 },
  fog_cleaver:      { mist_steel: 0.4, storm_chakra: 0.3, bamboo: 0.3 },
  sealing_talisman: { beast_fang: [2], shadowroot: 0.5, storm_chakra: 0.5 },
  frost_garb:       { beast_fang: [1], cloud_fern: 0.3, storm_chakra: 0.4, mistwood: 0.3 },
  // Orange Town: the Fox's parts, sea drops, fish, spices, the ore its voyages bring back
  ashen_fang:       { ashen_tail: [2], beast_ember: [2], mist_steel: 0.4, ironwood: 0.3, storm_chakra: 0.3 },
  beast_cloak:      { beast_ember: [3], storm_chakra: 0.4, mistwood: 0.3, cloud_fern: 0.3 },
  sage_robe:        { sage_lotus: 0.4, nature_essence: 0.3, shadowroot: 0.2, sea_kelp: 0.1 },
  kraken_compass:   { tide_pearl: [2], blue_marlin: 0.4, coral_lemon: 0.3, frost_crystal: 0.3 },
  stormcaller:      { leviathan_scale: [2], tide_pearl: [1], ironwood: 0.4, void_stone: 0.3, storm_chakra: 0.3 },
  // Soul City: ingots and souls
  tide_mantle:      { tide_heart: [1], leviathan_scale: [3], frost_ingot: 0.4, tidal_eel: 0.3, blossomwood: 0.3 },
  spirit_katana:    { silver_ingot: 0.5, soul_fragment: 0.3, cedar_log: 0.2 },
  reishi_ring:      { reishi_ingot: 0.3, frost_ingot: 0.3, spirit_core: 0.3, moonpetal: 0.1 },
  awakened_blade:   { void_ingot: 0.5, spirit_core: 0.3, chakra_orb: 0.2 },
  sapphire_charm:   { sapphire: [1], void_ingot: 0.4, wisp_flame: 0.4, coral_lemon: 0.2 },
  reapers_edge:     { husk_heart: [3], void_ingot: 0.4, spirit_core: 0.3, grave_dust: 0.3 },
  black_warhammer:  { black_ingot: 0.6, husk_mask: 0.3, ironwood: 0.1 },
  ferryman_robe:    { bone_ivory: [3], husk_mask: 0.4, frost_ingot: 0.3, spirit_orchid: 0.3 },
  sovereign_blade:  { beast_ember: [2], star_ingot: 0.5, grave_dust: 0.3, husk_mask: 0.2 },
  ruby_crest:       { ruby: [1], black_ingot: 0.5, grave_dust: 0.5 },
  sunforged_bow:    { abyssal_essence: [2], star_ingot: 0.4, spirit_orchid: 0.3, wisp_flame: 0.3 },
  // Kaio Planet: ki, the gravity relics, ingots
  eclipse_blade:    { sovereign_shard: [2], star_ingot: 0.4, abyssal_essence: 0.3, ki_orb: 0.3 },
  storm_mantle:     { phantom_silk: 0.4, ki_orb: 0.3, black_ingot: 0.2, sage_lotus: 0.1 },
  void_band:        { sapphire: [1], echo_soul: 0.3, star_ingot: 0.3, ki_spark: 0.2, dragon_moss: 0.2 },
  power_gauntlets:  { gravity_plate: [2], ki_core: 0.4, star_ingot: 0.4, spirit_core: 0.2 },
  battle_armor:     { warrior_sash: [2], ki_flare: 0.4, black_ingot: 0.3, phantom_silk: 0.3 },
  // Shinjuku: curses
  gravity_bracer:   { tyrant_horn: [1], star_ingot: 0.4, ki_nova: 0.3, hex_ash: 0.3 },
  cursed_cleaver:   { bound_talisman: [2], hex_core: 0.4, star_ingot: 0.3, hex_ember: 0.3 },
  grudge_mail:      { veil_shard: [2], hex_shade: 0.4, phantom_silk: 0.3, hex_residue: 0.3 },
  // Green Island: beasts
  hex_eye:          { matriarch_eye: [1], hex_void: 0.4, wild_fur: 0.3, sun_ingot: 0.3 },
  hunter_glaive:    { trail_stone: [2], stag_antler: 0.4, sun_ingot: 0.3, swift_feather: 0.3 },
  wildhide_coat:    { beastlord_claw: [2], lynx_pelt: 0.4, boar_tusk: 0.3, hex_void: 0.3 },
  // Echo Quarter
  star_badge:       { chimera_heart: [1], sage_chakra: [2], wyrm_scale: 0.4, chimera_mane: 0.3, sun_ingot: 0.3 },
};
// Other Crafting recipes, moved to the world whose materials they use (level only).
const ARTS_LEVELS = {
  // ki tools (Kaio Planet), then the tools of later skills in their own world
  tool_woodcutting_1: 60, tool_fishing_1: 60, tool_mining_1: 61, tool_gravity_1: 62,
  tool_woodcutting_2: 66, tool_fishing_2: 66, tool_mining_2: 67, tool_gravity_2: 68,
  tool_woodcutting_3: 72, tool_fishing_3: 72, tool_mining_3: 73, tool_gravity_3: 74,
  tool_exorcism_1: 73, tool_exorcism_2: 76, tool_exorcism_3: 79,
  tool_tracking_1: 80, tool_tracking_2: 83, tool_tracking_3: 86,
  tool_archaeology_1: 88, tool_archaeology_2: 91, tool_archaeology_3: 94,
  // hunting gear (Green Island)
  fish_bait: 78, scent_lure: 79, snare: 78, net_trap: 80, cage_trap: 82, spirit_trap: 84, wyrm_trap: 86, chimera_trap: 89,
  // curses and the Fox's fire
  scroll_hex: 74, scroll_fire_lotus: 40,
  rift_cleaver: 95,
};

/* ------------------------------------------------------------ helpers */
function ecoAt(table, s) {
  const i = Math.max(0, Math.min(table.length - 1, Math.floor(s))), j = Math.min(table.length - 1, i + 1), f = s - Math.floor(s);
  return table[i] + (table[j] - table[i]) * f;
}
function ecoArts(s) {
  let lv = 1;
  for (let i = 0; i < ARTS_AT.length; i++) {
    const [a, la] = ARTS_AT[i], nx = ARTS_AT[i + 1];
    if (s >= a) lv = !nx || s <= a ? la : la + (nx[1] - la) * Math.min(1, (s - a) / (nx[0] - a));
  }
  return Math.round(lv);
}
// Value bands keep the refinement ingots and the awakening souls in step with the stage.
const ECO_VALUE = [[2, 15, 5, 29], [4, 40, 15, 99], [8, 150, 25, 299], [12, 400, 60, 699], [16, 900, 120, 1499], [20, 2000, 400, 3999], [24, 6000, 1500, 14999], [Infinity, 30000, 10000, Infinity]];
function ecoValue(s, mult, weapon) {
  let lo = 0;
  for (const [hi, base, per, cap] of ECO_VALUE) {
    if (s < hi) { const v = (base + per * (s - lo)) * mult; return Math.round(weapon ? Math.min(cap, v) : v); }
    lo = hi;
  }
  return 0;
}
const ecoRound = (k, v) => (Math.abs(v) >= 3 ? Math.round(v) : Math.abs(v) >= 0.2 ? Math.round(v * 20) / 20 : Math.abs(v) >= 0.02 ? Math.round(v * 100) / 100 : Math.round(v * 1000) / 1000);

/* ------------------------------------------------------------ 1-2. stats and perks */
function gearStats(id) {
  const it = ITEMS[id], [s, role, shape] = GEAR_TIERS[id], [sm, pb] = ECO_ROLE[role];
  const W = ecoAt(WEAPON_ATK, s), D = ecoAt(ARMOR_DEF, s), H = Math.max(25, 5.6 * D);
  const old = it.stats || {}, out = {};
  if (it.slot === 'weapon') out.atk = W * sm;
  else if (it.slot === 'armor') { out.def = D * sm; out.hp = H * sm; }
  else { const sh = ACC_SHAPE[shape || 'hyb']; if (sh.atk) out.atk = W * sh.atk * sm; if (sh.def) out.def = D * sh.def * sm; if (sh.hp) out.hp = H * sh.hp * sm; }
  // a cursed piece keeps its price: the same share of a core stat, taken away
  const core = { atk: W, def: D, hp: H };
  const base = { atk: it.slot === 'weapon' ? W : W * 0.4, def: D * 0.6, hp: H * 0.6 };
  for (const k of ['atk', 'def', 'hp']) if ((old[k] || 0) < 0) out[k] = -Math.abs(old[k]) / (oldCore(id, k) || 1) * base[k];
  // perks: same identity, scaled to the role's budget
  const perks = Object.keys(old).filter((k) => !(k in core) && old[k] > 0);
  const unit = (k) => (PERKS[k] && PERKS[k].unit) || ECO_UNIT[k] || 0.1;
  const have = perks.reduce((a, k) => a + old[k] / unit(k), 0);
  const want = pb * (1 + s / 50);
  for (const k of perks) out[k] = have ? old[k] * want / have : 0;
  for (const k in out) out[k] = k in core ? Math.sign(out[k]) * Math.max(1, Math.round(Math.abs(out[k]))) : ecoRound(k, out[k]);
  return out;
}
// The size of a stat before the pass (to keep a cursed piece's penalty in proportion).
function oldCore(id, k) {
  const it = ITEMS[id], o = it.stats || {};
  if (k === 'hp') return o.def ? o.def * 5.6 : o.atk ? o.atk * 2.5 : 100;
  if (k === 'def') return o.hp ? o.hp / 5.6 : o.atk || 10;
  return o.hp ? o.hp / 5 : o.def || 10;
}

/* ------------------------------------------------------------ 3. recipes */
// A recipe costs about the same TIME at every stage, a little more as you go: the budget is a
// number of "gathering actions" split in shares, and each material counts for how many of it one
// action or one victory brings (a log: 1 per chop; an ingot: 2 ores and a smelt; a 15% drop: 0.15).
const RECIPE_ACTIONS = (s) => 8 + 4 * s;
let ECO_YIELD = null;
function ecoYield(k) {
  if (!ECO_YIELD) {
    ECO_YIELD = {};
    const best = (id, y) => { ECO_YIELD[id] = Math.max(ECO_YIELD[id] || 0, y); };
    for (const sk in SKILLS) for (const a of SKILLS[sk].actions || []) {
      if (SKILLS[sk].type === 'gather') for (const o in a.out || {}) best(o, a.out[o]);
      for (const [o, p, q] of a.extra || []) best(o, p * ((q ? q[0] + q[1] : 2) / 2));
    }
    for (const z of ZONES) for (const e of z.enemies) for (const [o, p, q] of e.drops || []) best(o, p * ((q ? q[0] + q[1] : 2) / 2));
    for (const ore in INGOT_OF) ECO_YIELD[INGOT_OF[ore]] = 0.4;
  }
  return Math.min(1, Math.max(0.15, ECO_YIELD[k] || 0.5));
}
function gearRecipe(id) {
  const [s] = GEAR_TIERS[id], spec = GEAR_RECIPES[id];
  const budget = RECIPE_ACTIONS(s);
  const inp = {};
  for (const k in spec) {
    if (!ITEMS[k]) continue;
    const v = spec[k];
    inp[k] = Array.isArray(v) ? v[0] : Math.max(1, Math.round(budget * v * ecoYield(k)));
  }
  return inp;
}

/* ------------------------------------------------------------ apply */
(function applyEconomy() {
  // stats first: the recipe costs read the new values
  for (const id in GEAR_TIERS) {
    const it = ITEMS[id];
    if (!it || it.type !== 'equip') continue;
    const [s, role] = GEAR_TIERS[id];
    it.stats = gearStats(id);
    it.value = ecoValue(s, ECO_ROLE[role][2], it.slot === 'weapon');
    it.stage = s;
  }
  const arts = SKILLS.arts.actions;
  for (const a of arts) {
    const id = Object.keys(a.out || {})[0];
    let lv = null;
    if (GEAR_TIERS[id] && GEAR_RECIPES[id]) { lv = ecoArts(GEAR_TIERS[id][0]); a.in = gearRecipe(id); a.time = Math.round((4 + 0.2 * GEAR_TIERS[id][0]) * 2) / 2; }
    else if (ARTS_LEVELS[id] != null) lv = ARTS_LEVELS[id];
    if (lv == null) continue;
    a.level = lv;
    a.xp = xpFor(lv, a.time, true);
  }
  arts.sort((x, y) => x.level - y.level);
})();
