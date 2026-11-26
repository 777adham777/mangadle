'use strict';
/* ==========================================================================
   ANIME IDLE RPG — gear: slots, pieces, sets, shards (La Forge P9 + P6, 2026-11-26, docs/FORGE.md).
   DOM-free data. Loaded after tiers.js; loot.js runs gearPass() before its world lock and rarity,
   so every new item, drop and recipe below is seen like any other.
   1. Slots: a weapon and six armour slots, all open from the start. Old armour is worn on the chest,
      old accessories where they go (a hat on the head, a ring on a finger...).
   2. Generic pieces: each world forges a basic piece for every slot in two tiers; the slots fill up
      as Crafting opens their recipes (at level 1 there is a chest piece only).
   3. Sets: 2-3 per world, 6 pieces, rarer and stronger than generic pieces (role 'set'). They are
      forged from their set's sigil, dropped by the foes whose mechanics the set answers. Bonuses at
      2, 4 and 6 pieces (sets.js) counter those mechanics. Nothing in a set drops whole any more.
   4. Shards: a weapon never drops whole either. Its foe drops a shard instead (3 × the old chance ×
      8/9: the same time on average, but you see it coming); 3 shards and the world's materials forge it.
   economy.js prices every piece (GEN_TIERS, GEN_RECIPES are merged into its tables).
   ========================================================================== */

const GEAR_SLOTS = ['weapon', 'head', 'chest', 'legs', 'feet', 'amulet', 'ring'];
const ARMOR_SLOTS = GEAR_SLOTS.slice(1);
// share: of the old armour's defense and HP (head/chest/legs/feet), of the old accessory (amulet/ring).
const SLOT_INFO = {
  weapon: { name: 'Weapon', noun: 'Blade', glyph: 'broadsword' },
  head:   { name: 'Head',   noun: 'Helm',    share: 0.2,  kind: 'armor', glyph: 'pf-helm',     off: 0.2 },
  chest:  { name: 'Chest',  noun: 'Garb',    share: 0.4,  kind: 'armor', glyph: 'chest-armor', off: 0 },
  legs:   { name: 'Legs',   noun: 'Greaves', share: 0.25, kind: 'armor', glyph: 'pf-greaves',  off: 0.4 },
  feet:   { name: 'Feet',   noun: 'Boots',   share: 0.15, kind: 'armor', glyph: 'pf-boot',     off: 0.5 },
  amulet: { name: 'Amulet', noun: 'Amulet',  share: 0.5,  kind: 'jewel', glyph: 'gem-pendant', off: 0.7 },
  ring:   { name: 'Ring',   noun: 'Ring',    share: 0.5,  kind: 'jewel', glyph: 'ring',        off: 0.9 },
};
const GEN_TIERS = {}, GEN_RECIPES = {};   // economy.js merges these over the two tables below

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
  // ---- Skill depth (depth.js): placed where their skill level is realistically reached
  amber_pendant: [5, 'craft', 'def'], thunder_harpoon: [9, 'craft'], sekki_bracers: [12.5, 'craft', 'def'], living_wood_mail: [13, 'craft'],
  frostvoid_scythe: [15, 'craft'], sunstar_plate: [23, 'craft'], kido_focus: [24.5, 'craft'], divine_bow: [28.5, 'craft'],
  // ---- Resource tiers (tiers.js, 2026-11-25): where their gathering level is reached
  ember_maple_bow: [4.5, 'craft'], moonsilver_blade: [9, 'craft'], surge_gi: [14, 'craft'], bloodstone_gauntlets: [16, 'craft'],
  threadbound_charm: [18, 'craft', 'off'], griffon_cloak: [22, 'craft'], crystal_ward: [24, 'craft', 'def'], meteor_hammer: [25.5, 'craft'],
  kings_ring: [29.5, 'craft', 'hyb'], soulking_blade: [30, 'craft'],
  // ---- The Rift (28+)
  rift_cleaver: [28.5, 'legend'], rift_eye: [29, 'legend', 'hyb'],
  // ---- The manga armory (armory.js), world by world
  leaf_weights: [0.8, 'drop', 'hyb'], three_prong_kunai: [1.5, 'drop'], chakra_threads: [1.5, 'drop', 'off'], springtime_suit: [2.2, 'drop'],
  sand_gourd: [2.5, 'drop', 'def'], shark_skin_sword: [3.5, 'boss'],
  justice_coat: [4.5, 'drop'], red_vest: [4.5, 'craft'], straw_hat: [4.5, 'rare', 'hyb'], black_leg_boots: [5, 'drop'], wado_blade: [5.5, 'craft'],
  sniper_goggles: [5.5, 'drop', 'off'], weather_baton: [6, 'drop'], seastone_cuffs: [6.5, 'craft', 'def'],
  asauchi: [8, 'drop'], flash_sandals: [8.5, 'craft', 'hyb'], quincy_cross: [9, 'drop', 'off'], hollow_mask_half: [9.5, 'drop', 'off'],
  captain_haori: [10.5, 'craft'], bankai_blade: [11.5, 'boss'],
  turtle_gi: [12, 'craft'], power_pole: [12.5, 'craft'], nimbus_charm: [13.5, 'drop', 'hyb'], senzu_pouch: [14, 'craft', 'def'],
  ki_blaster: [14, 'drop'], z_sword: [15, 'schem'], fusion_earrings: [15.5, 'epic', 'hyb'],
  jujutsu_uniform: [16, 'craft'], resonance_hammer: [16.5, 'drop'], playful_cloud: [17.5, 'drop'], cursed_finger: [17.5, 'drop', 'off'],
  sealing_cube: [18.5, 'drop', 'def'], inverted_spear: [18.5, 'schem'], limitless_blindfold: [19.5, 'epic', 'off'],
  hunter_rod: [20, 'craft'], ten_vest: [20.5, 'craft'], steel_skateboard: [20.5, 'drop', 'hyb'], medic_briefcase: [21, 'craft', 'def'],
  steel_yoyos: [21.5, 'drop'], chain_of_judgement: [22, 'drop', 'off'], joker_cards: [22.5, 'schem'], royal_carapace: [23.5, 'epic'],
  nichirin_blade: [24, 'craft'], fox_warding_mask: [24.5, 'craft', 'def'], slayer_uniform: [25, 'drop'], stopped_watch: [25, 'drop', 'hyb'],
  steel_balls: [25.5, 'drop'], checkered_haori: [26, 'craft'], stand_arrow: [26.5, 'epic', 'off'], hanafuda_earrings: [27.5, 'epic', 'off'],
  torn_mask: [28.5, 'rare', 'hyb'], rift_mantle: [28.5, 'relic'], crossover_blade: [29.5, 'legend'],
};

// Crafting recipes of the gear (economy.js prices them). Shares split the cost budget; [n] = a fixed count (boss parts, gems).
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
  // Resource tiers (tiers.js): the new nodes, a new ingot or dish, one older material
  ember_maple_bow:      { beast_ember: [1], ember_maple: 0.5, storm_chakra: 0.3, sea_kelp: 0.2 },
  moonsilver_blade:     { moonsilver_ingot: 0.5, soul_fragment: 0.3, ghost_ray: 0.2 },
  surge_gi:             { ki_surge: 0.4, moonsilver_ingot: 0.3, phantom_silk: 0.3 },
  bloodstone_gauntlets: { bloodstone_ingot: 0.4, ki_blaze: 0.3, thunderbark: 0.3 },
  threadbound_charm:    { hex_thread: 0.4, hex_bone: 0.3, lantern_squid: 0.2, ki_surge: 0.1 },
  griffon_cloak:        { griffon_plume: 0.35, serpent_skin: 0.25, hex_seal: 0.2, ki_blaze: 0.1, grizzly_hide: 0.1 },
  crystal_ward:         { crystal_fragment: 0.4, silver_fragment: 0.3, grizzly_hide: 0.15, serpent_skin: 0.15 },
  meteor_hammer:        { meteor_fragment: 0.4, bloodstone_ingot: 0.3, ki_aura: 0.3 },
  kings_ring:           { king_finger: [2], divine_ki: 0.4, arrow_fragment: 0.3, soulking_ingot: 0.3 },
  soulking_blade:       { soulking_ingot: 0.5, ant_chitin: 0.3, sage_elm: 0.1, allblue_tuna: 0.1 },
  // The manga armory (armory.js): each world's own materials plus one older one
  red_vest:         { beast_ember: [1], sea_kelp: 0.4, sea_crab: 0.3, shadowroot: 0.3 },
  wado_blade:       { tide_pearl: [1], mist_steel: 0.4, ironwood: 0.3, sea_salt: 0.3 },
  seastone_cuffs:   { leviathan_scale: [1], void_stone: 0.4, sea_kelp: 0.3, frost_crystal: 0.3 },
  flash_sandals:    { wisp_flame: 0.3, reishi_ingot: 0.3, frost_ingot: 0.2, cloud_fern: 0.2 },
  captain_haori:    { bone_ivory: [2], black_ingot: 0.4, phantom_silk: 0.3, spirit_orchid: 0.3 },
  turtle_gi:        { ki_spark: 0.4, moon_rice: 0.3, phantom_silk: 0.3 },
  power_pole:       { ki_orb: 0.4, star_ingot: 0.3, ironwood: 0.3 },
  senzu_pouch:      { vital_bean: 0.4, ki_flare: 0.3, phantom_silk: 0.3 },
  z_sword:          { warrior_sash: [2], ki_nova: 0.4, star_ingot: 0.4, starsteel: 0.2 },
  jujutsu_uniform:  { hex_residue: 0.4, phantom_silk: 0.3, star_ingot: 0.3 },
  inverted_spear:   { veil_shard: [2], hex_void: 0.4, sun_ingot: 0.3, ki_nova: 0.3 },
  hunter_rod:       { swift_feather: 0.4, spirit_oak: 0.3, sun_ingot: 0.3 },
  ten_vest:         { wild_fur: 0.3, lynx_pelt: 0.3, hex_shade: 0.2, sun_ingot: 0.2 },
  medic_briefcase:  { stag_antler: 0.4, sun_ingot: 0.3, spirit_orchid: 0.3 },
  joker_cards:      { beastlord_claw: [1], wyrm_scale: 0.4, phantom_silk: 0.3, hex_crown: 0.3 },
  nichirin_blade:   { starmetal_fragment: 0.4, sun_ingot: 0.4, sunstone: 0.2 },
  fox_warding_mask: { bronze_fragment: 0.4, jade_fragment: 0.3, spirit_oak: 0.3 },
  checkered_haori:  { pillar_fragment: 0.4, gold_fragment: 0.3, phantom_silk: 0.3 },
  rift_mantle:      { lord_visage: [1], rift_ingot: 0.4, echo_soul: 0.3, chimera_mane: 0.3 },
  // Skill depth (depth.js): the new nodes, by-products and alloys
  amber_pendant:    { fossil_amber: [1], chakra_sap: 0.5, cedar_log: 0.3, moonpetal: 0.2 },
  thunder_harpoon:  { thunder_catfish: 0.4, fish_oil: 0.2, ironwood: 0.2, silver_ingot: 0.2 },
  sekki_bracers:    { sekki_ingot: 0.5, reishi_dust: 0.3, ki_orb: 0.2 },
  living_wood_mail: { living_wood: 0.5, sekki_ingot: 0.2, ki_spark: 0.15, chakra_sap: 0.15 },
  frostvoid_scythe: { frostvoid_alloy: [3], ki_core: 0.4, husk_mask: 0.3, living_wood: 0.3 },
  sunstar_plate:    { sunstar_alloy: [3], lynx_pelt: 0.4, hex_void: 0.3, reishi_dust: 0.3 },
  kido_focus:       { kido_ingot: 0.5, bronze_fragment: 0.3, chakra_sap: 0.2 },
  divine_bow:       { divine_root: 0.5, sunstar_alloy: [2], kido_ingot: 0.3, echo_soul: 0.2 },
};

const GEAR_SET_OF = {};                    // item id -> set id

/* ------------------------------------------------------------ 1. slots */
const SLOT_OVERRIDE = { leaf_weights: 'legs', flash_sandals: 'feet', cata_shroud: 'chest', cata_mask: 'head', womb_wrap: 'chest', nest_antenna: 'head', tomb_mask: 'head', tomb_scarf: 'amulet' };
function slotFor(id) {
  const it = ITEMS[id];
  if (SLOT_OVERRIDE[id]) return SLOT_OVERRIDE[id];
  if (it.slot === 'armor') return /\bhood\b|helm/i.test(it.name) ? 'head' : 'chest';
  const n = it.name;
  if (/headband|\bhat\b|crown|mask|goggles|visor|blindfold|hood|helm|scouter|antenna|wrap\b|shroud/i.test(n)) return 'head';
  if (/sandal|boot|shoe/i.test(n)) return 'feet';
  if (/weights|greave|legging/i.test(n)) return 'legs';
  if (/\bring\b|\bband\b|bracer|cuffs|earring|bangle/i.test(n)) return 'ring';
  return 'amulet';
}
const remapSlots = () => { for (const id in ITEMS) { const it = ITEMS[id]; if (it.type === 'equip' && (it.slot === 'armor' || it.slot === 'accessory')) it.slot = slotFor(id); } };

/* ------------------------------------------------------------ helpers */
const WORLD_STAGE0 = { shinobi: 0, seas: 4, soul: 8, ki: 12, hex: 16, hunter: 20, echo: 24 };
const gearRealmOf = (s) => Object.keys(WORLD_STAGE0).filter((r) => WORLD_STAGE0[r] <= s).sort((a, b) => WORLD_STAGE0[b] - WORLD_STAGE0[a])[0] || 'shinobi';
const crafts = (id) => SKILLS.arts.actions.some((a) => a.out && a.out[id]);
function addCraft(id) { if (!crafts(id)) SKILLS.arts.actions.push(craft(id, 1, 5, {})); }   // economy.js sets level, time, inputs and XP
function defPiece(id, name, slot, extra) {
  const S0 = SLOT_INFO[slot];
  defItem(id, name, '🛡️', 100, Object.assign(eq(slot, {}), { glyph: S0.glyph }, extra || {}));
}
// Where the foes that drop a thing live (the first of them), for shards and sigils.
function foesByName(names) { const out = []; for (const z of ZONES) for (const e of z.enemies) if (names.includes(e.name) && !z.dungeon) out.push(e); return out; }

/* ------------------------------------------------------------ 2. generic pieces */
// Two tiers a world. mats: the recipe's shares (economy.js turns them into counts for the stage).
// A slot an older crafted piece of the world already fills (within 0.8 of a stage) is skipped.
const WORLD_GEAR = {
  shinobi: [{ stage: 0.6, name: 'Genin', mats: { chakra_shard: 0.35, healing_leaf: 0.25, pine_log: 0.2, cedar_log: 0.2 } },
            { stage: 2.2, name: 'Chunin', mats: { chakra_orb: 0.35, moonpetal: 0.25, bamboo: 0.25, cedar_log: 0.15 } }],
  seas:    [{ stage: 4.6, name: 'Deckhand', mats: { sea_kelp: 0.3, coral_lemon: 0.2, mistwood: 0.25, sea_crab: 0.25 } },
            { stage: 6.4, name: 'Bosun', mats: { tidal_eel: 0.3, ironwood: 0.3, blue_marlin: 0.2, frost_crystal: 0.2 } }],
  soul:    [{ stage: 8.6, name: 'Reaper', mats: { silver_ingot: 0.35, soul_fragment: 0.3, wisp_flame: 0.2, cedar_log: 0.15 } },
            { stage: 10.4, name: 'Lieutenant', mats: { void_ingot: 0.35, spirit_core: 0.3, husk_mask: 0.15, blossomwood: 0.2 } }],
};
// Later worlds: two tiers named after the world, materials of its nearest crafted piece (its shares only).
const LATER_TIER = { ki: ['Kaio', 'Saiyan'], hex: ['Exorcist', 'Grade One'], hunter: ['Rookie', 'Pro Hunter'], echo: ['Ripple', 'Pillar'] };
function nearestShares(stage) {
  let best = null, bd = Infinity;
  for (const id in GEAR_RECIPES) { const t = GEAR_TIERS[id] && GEAR_TIERS[id][0]; if (t == null || gearRealmOf(t) !== gearRealmOf(stage)) continue; const d = Math.abs(t - stage); if (d < bd) { bd = d; best = id; } }
  const spec = best ? GEAR_RECIPES[best] : { pine_log: 1 }, out = {};
  for (const k in spec) if (!Array.isArray(spec[k]) && ITEMS[k]) out[k] = spec[k];
  const tot = Object.values(out).reduce((a, x) => a + x, 0) || 1;
  for (const k in out) out[k] /= tot;
  return out;
}
function tierMats(realm, stage) {
  const T = WORLD_GEAR[realm];
  if (!T) return nearestShares(stage);
  return (stage >= T[1].stage - 0.3 ? T[1] : T[0]).mats;
}
const CRAFTED_SLOT_AT = (realm, slot, stage) => Object.keys(ITEMS).some((id) => {
  const it = ITEMS[id];
  return it.type === 'equip' && it.slot === slot && crafts(id) && gearHintStage(id) != null && gearRealmOf(gearHintStage(id)) === realm && Math.abs(gearHintStage(id) - stage) <= 0.8;
});
const gearHintStage = (id) => (GEN_TIERS[id] ? GEN_TIERS[id][0] : GEAR_TIERS[id] ? GEAR_TIERS[id][0] : null);
function genericPieces() {
  for (const realm of Object.keys(WORLD_STAGE0)) {
    const tiers = WORLD_GEAR[realm] || LATER_TIER[realm].map((name, i) => ({ stage: WORLD_STAGE0[realm] + (i ? 2.2 : 0.6), name, mats: null }));
    tiers.forEach((T, ti) => {
      for (const slot of ARMOR_SLOTS) {
        const st = Math.round((T.stage + SLOT_INFO[slot].off) * 10) / 10;
        if (CRAFTED_SLOT_AT(realm, slot, st)) continue;
        const id = `g_${realm}_${ti + 1}_${slot}`;
        defPiece(id, `${T.name} ${SLOT_INFO[slot].noun}`, slot, { color: ['#9aa6b8', '#c8b07a'][ti], lore: `Basic ${SLOT_INFO[slot].name.toLowerCase()} gear of ${REALMS[realm].name}.` });
        GEN_TIERS[id] = [st, 'craft', slot === 'ring' ? 'off' : slot === 'amulet' ? 'def' : undefined];
        GEN_RECIPES[id] = Object.assign({}, T.mats || nearestShares(st));
        addCraft(id);
      }
    });
  }
}

/* ------------------------------------------------------------ 3. sets */
// pieces: existing items by slot (they stop dropping and become crafted); the other slots get new pieces.
// from: the foes whose mechanics the set answers drop its sigil (p each kill). b2 / b4 / b6: sets.js.
// auto: later worlds, whose 4-piece bonus is read from the source foes' kits (sets.js).
const GEAR_SETS = [
  // Leaf Village: the fog and the puppets
  { id: 'mistwalker', realm: 'shinobi', name: 'Mist Walker', stage: 2.4, color: '#8fb8c8', pieces: { chest: 'springtime_suit', legs: 'leaf_weights', amulet: 'wolf_fang' },
    from: ['Mist Assassin', 'Rogue Apprentice'], p: 1 / 40, b2: { acc: 0.25 }, b4: { rPoison: 0.5, rBleed: 0.5 }, b6: { parry: 0.3 } },
  { id: 'puppeteer', realm: 'shinobi', name: 'Puppet Master', stage: 2.8, color: '#b08a5a', pieces: { chest: 'puppet_plating', amulet: 'sand_gourd', ring: 'chakra_threads' },
    from: ['Puppet Drone', 'Stone Golem'], p: 1 / 40, b2: { pierce: 0.35 }, b4: { rStun: 0.5 }, b6: { brace: 0.3, rPoison: 0.3 } },
  // Orange Town: the navy and the storm
  { id: 'marine', realm: 'seas', name: 'Marine Justice', stage: 5.4, color: '#dfe6f2', pieces: { chest: 'justice_coat', amulet: 'sea_charm' },
    from: ['Navy Recruit', 'Merfolk Brawler'], p: 1 / 40, b2: { rStun: 0.5 }, b4: { rWeaken: 0.5, shieldBreak: 0.4 }, b6: { calm: 0.5 } },
  { id: 'stormrider', realm: 'seas', name: 'Storm Rider', stage: 6.6, color: '#6a8ad8', pieces: { head: 'sniper_goggles', amulet: 'shark_tooth' },
    from: ['Storm Corsair', 'Sea Leviathan'], p: 1 / 40, b2: { acc: 0.25 }, b4: { wounds: 0.6, brace: 0.2 }, b6: { parry: 0.35 } },
  // Soul City: the husks and the bone court
  { id: 'huskhunter', realm: 'soul', name: 'Husk Hunter', stage: 9.6, color: '#d8d0c0', pieces: { head: 'hollow_mask_half', chest: 'husk_carapace', amulet: 'reaper_scarf' },
    from: ['Lurking Husk', 'Towering Husk'], p: 1 / 40, b2: { wounds: 0.6 }, b4: { acc: 0.25, rBurn: 0.5 }, b6: { parry: 0.35 } },
  { id: 'boneward', realm: 'soul', name: 'Bone Ward', stage: 10.6, color: '#a8a0c8', pieces: { amulet: 'quincy_cross', ring: 'prayer_beads' },
    from: ['Masked Lancer', 'Bone Priest', 'Sand Wraith'], p: 1 / 45, b2: { rWeaken: 0.5 }, b4: { steady: 0.5, rPoison: 0.5 }, b6: { wounds: 0.6, brace: 0.3 } },
  // Later worlds (hidden past the beta): the old crews, 6 pieces each, a counter read from their foes
  { id: 'saiyan', realm: 'ki', name: 'Gravity Warrior', stage: 14.6, color: '#f0ead0', auto: true, b2: { counter: 0.5, guard: 0.05 }, b6: { formDrain: 0.4 } },
  { id: 'turtle', realm: 'ki', name: 'Iron Shell School', stage: 13.4, color: '#f0a040', auto: true, b2: { counter: 0.5 }, b6: { first: 1, formDrain: 0.3 } },
  { id: 'curse', realm: 'hex', name: 'Curse Bearer', stage: 18.6, color: '#c040a0', auto: true, b2: { berserk: 0.2 }, b6: { leech: 0.05, exec: 0.25 } },
  { id: 'jujutsu', realm: 'hex', name: 'Sorcery High', stage: 17.4, color: '#3a4a8a', auto: true, b2: { tech: 0.1 }, b6: { cdr: 0.1, exec: 0.15 } },
  { id: 'star', realm: 'hunter', name: 'Star Hunter', stage: 22.6, color: '#c8b088', auto: true, b2: { boss: 0.15 }, b6: { first: 2, crit: 0.06 } },
  { id: 'exam', realm: 'hunter', name: 'Hunter Selection', stage: 21.4, color: '#80d060', auto: true, b2: { first: 1 }, b6: { crit: 0.06, boss: 0.15 } },
  { id: 'slayer', realm: 'echo', name: 'Dusk Slayer Corps', stage: 25.6, color: '#e85a50', auto: true, b2: { exec: 0.15 }, b6: { tag_fire: 0.25, burnHit: 1 } },
];
const SIGIL_N = { head: 2, chest: 4, legs: 3, feet: 2, amulet: 2, ring: 2 };
const sigilOf = (sid) => 'sig_' + sid;
// Registers a set: its sigil, its six pieces (new ones where it names none), their recipes.
function makeSet(S0) {
  const sig = sigilOf(S0.id);
  defItem(sig, `${S0.name} Sigil`, '🔶', 40 + 15 * S0.stage, { type: 'res', glyph: 'rune-stone', color: S0.color, sigil: S0.id, lore: `Forges the ${S0.name} set.` });
  S0.slots = {};
  for (const slot of ARMOR_SLOTS) {
    let id = (S0.pieces || {})[slot];
    if (!id || !ITEMS[id]) {
      id = `set_${S0.id}_${slot}`;
      defPiece(id, `${S0.name} ${SLOT_INFO[slot].noun}`, slot, { color: S0.color });
    } else ITEMS[id].slot = slot;
    ITEMS[id].set = S0.id;
    ITEMS[id].lore = ITEMS[id].lore || `${S0.name} set.`;
    GEAR_SET_OF[id] = S0.id;
    const st = Math.round((S0.stage + SLOT_INFO[slot].off * 0.5) * 10) / 10;
    GEN_TIERS[id] = [st, 'set', slot === 'ring' ? 'off' : slot === 'amulet' ? 'hyb' : undefined];
    GEN_RECIPES[id] = Object.assign({ [sig]: [SIGIL_N[slot]] }, tierMats(S0.realm, st) || nearestShares(st));
    // it is crafted now: take it out of every drop table and every other recipe that made it
    for (const z of ZONES) for (const e of z.enemies) e.drops = e.drops.filter((d) => d[0] !== id);
    SKILLS.arts.actions = SKILLS.arts.actions.filter((a) => !(a.out && a.out[id]));
    addCraft(id);
    S0.slots[slot] = id;
  }
}
function stageSets() {
  for (const S0 of GEAR_SETS) {
    if (!REALMS[S0.realm]) continue;
    makeSet(S0);
    // the sigil: from the named foes, or (later worlds) the two toughest foes of the world's stages
    let src = S0.from ? foesByName(S0.from) : [];
    if (!src.length) {
      const pool = [];
      for (const z of ZONES) if (z.realm === S0.realm && !z.boss && !z.dungeon) pool.push(...z.enemies);
      src = pool.sort((a, b) => b.hp - a.hp).slice(0, 2);
      S0.from = src.map((e) => e.name);
    }
    for (const e of src) e.drops.push([sigilOf(S0.id), S0.p || 1 / 40, [1, 1]]);
  }
}

/* ------------------------------------------------------------ 4. shards */
// Every weapon that only drops: its sources drop a shard instead; 3 shards + the world's materials forge it.
const SHARD_N = 3, SHARD_RATE = SHARD_N * 8 / 9;
const shardOf = (id) => id + '_shard';
function makeShard(w) {
  const sh = shardOf(w), it = ITEMS[w];
  if (ITEMS[sh]) return sh;
  defItem(sh, `${it.name} Shard`, '💎', 30, { type: 'res', glyph: 'crystal-shine', color: it.color || '#c0d8ff', shardOf: w, lore: `Three of them forge the ${it.name}. More refine it.` });
  it.frag = 1;
  return sh;
}
function shardRecipe(w, stage) {
  GEN_RECIPES[w] = Object.assign({ [shardOf(w)]: [SHARD_N] }, tierMats(gearRealmOf(stage), stage) || nearestShares(stage));
  addCraft(w);
}
function swapToShards(list) {
  for (let i = 0; i < list.length; i++) {
    const d = list[i];
    if (!isWeaponId(d[0]) || crafts(d[0])) continue;
    const sh = makeShard(d[0]);
    list[i] = [sh, Math.min(1, d[1] * SHARD_RATE), d[2] || [1, 1]].concat(d.slice(3));
  }
}
const isWeaponId = (id) => !!(ITEMS[id] && ITEMS[id].type === 'equip' && ITEMS[id].slot === 'weapon');
function weaponShards() {
  const before = new Set(Object.keys(ITEMS).filter((k) => ITEMS[k].shardOf));
  for (const z of ZONES) if (!z.dungeon) for (const e of z.enemies) swapToShards(e.drops);
  for (const k in RARE_FINDS) swapToShards(RARE_FINDS[k]);
  for (const a of SKILLS.voyaging.actions) if (a.loot && a.loot.rare) swapToShards(a.loot.rare);
  for (const id in ITEMS) if (ITEMS[id].type === 'chest' && ITEMS[id].loot) for (const l of ITEMS[id].loot) if (isWeaponId(l[0]) && !crafts(l[0])) { makeShard(l[0]); l[0] = shardOf(l[0]); }
  for (const id in ITEMS) if (ITEMS[id].shardOf && !before.has(id)) { const w = ITEMS[id].shardOf; shardRecipe(w, gearHintStage(w) != null ? gearHintStage(w) : 4); }
}

/* ------------------------------------------------------------ the pass */
let GEAR_PASS_DONE = false;
function gearPass() {
  if (GEAR_PASS_DONE) return;
  GEAR_PASS_DONE = true;
  remapSlots();
  genericPieces();
  stageSets();
  weaponShards();
  SKILLS.arts.actions.sort((a, b) => a.level - b.level);
}

// Rarity (loot.js, after computeRarity): a set piece is Epic; a weapon forged from shards is one step
// rarer than its shard (it used to drop whole at a third of the shard's chance).
function gearRarity() {
  for (const id in GEAR_SET_OF) if (ITEMS[id]) ITEMS[id].rarity = Math.max(4, ITEMS[id].rarity || 1);
  for (const id in ITEMS) { const w = ITEMS[id].shardOf; if (w && ITEMS[w]) ITEMS[w].rarity = Math.min(5, Math.max(ITEMS[w].rarity || 1, (ITEMS[id].rarity || 1) + 1)); }
}
