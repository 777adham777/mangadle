'use strict';
/* ==========================================================================
   TRI-REALM — resource tiers (DOM-free). Loaded after depth.js, before loot.js.
   2026-11-25: the gathering skills had 7 to 10 nodes with gaps of up to 16 levels. Each one gets
   3 or 4 new nodes in its gaps (and one near the top), and every new resource has somewhere to go:
     Woodcutting  Ember Maple 39 · Thunderbark 65 · Sage Elm 80      → carvings, the fuel of the new ingots, gear
     Mining       Moonsilver 51 · Bloodstone 65 · Soul King Crystal 94 → three ingots (Smelting), gear, Mk IV tools
     Fishing      Ghost Ray 51 · Lantern Squid 64 · All Blue Tuna 95   → three dishes, gear
     Gravity      150× · 300× · 600× · 1000× sessions (Ki Surge, Ki Blaze, Ki Aura, Divine Ki) → gear, tools
     Research     Cursed Thread 43 · Cursed Bone 57 · Grudge Seal 71 · Finger of the King 90 → gear, artifacts, tools
     Hunting      Grizzly Hide 43 · Serpent Skin 58 · Griffon Plume 72 · Chimera Ant Chitin 90 → gear, tools
     Archaeology  four second sites (43, 57, 71, 90)                   → four museum artifacts, gear, tools
   Gear stats, values and recipes come from economy.js (GEAR_TIERS / GEAR_RECIPES, "Resource tiers").
   Each new item carries its fallback glyph and colour (icons.js) until a painted icon exists.
   ========================================================================== */

const TIER_ITEMS = [];   // new item ids, in order (icon briefs and checks read it)
const tItem = (id, name, emoji, value, extra, g, c) => {
  defItem(id, name, emoji, value, Object.assign({ glyph: g, color: c }, extra || {}));
  TIER_ITEMS.push(id);
};
// Insert nodes into a skill, then keep its list in level order.
const addNodes = (skill, ...acts) => { SKILLS[skill].actions.push(...acts); SKILLS[skill].actions.sort((a, b) => a.level - b.level); };
const node = (item, level, time, name, extra) => Object.assign(gather(item, level, time), name ? { name } : {}, extra ? { extra } : {});

/* ================================================================ Leaf Village · Woodcutting */
tItem('ember_maple', 'Ember Maple Log', '🍁', 22, { desc: 'A maple from the Land of Fire whose leaves never stop glowing. Its wood burns hot and slow: smelters swear by it.' }, 'maple-leaf', '#ff7a3a');
tItem('thunderbark', 'Thunderbark Log', '🪵', 62, { desc: 'Bark split by a hundred lightning strikes. The log still crackles when you pick it up.' }, 'lightning-storm', '#ffe04a');
tItem('sage_elm', 'Sage Elm Log', '🌳', 115, { desc: 'An elm from the mountain where the toads teach sage arts. Nature chakra pools in its rings.' }, 'leaf-swirl', '#9adf7a');
addNodes('woodcutting',
  node('ember_maple', 39, 4.8, null, [['shadowroot', 0.25, [1, 2]], ['nature_essence', 0.05, [1, 1]], ['chakra_sap', 0.06, [1, 2]]]),
  node('thunderbark', 65, 5.8, null, [['spirit_orchid', 0.25, [1, 2]], ['lightning_core', 0.05, [1, 1]], ['chakra_sap', 0.06, [1, 2]]]),
  node('sage_elm', 80, 6.5, null, [['dragon_moss', 0.25, [1, 2]], ['sage_chakra', 0.05, [1, 1]], ['chakra_sap', 0.06, [1, 2]]]),
);
// Their carvings: trade goods, like every other tree's
for (const [id, name, log, g] of [['maple_fan', 'Ember Maple Fan', 'ember_maple', 'flower-twirl'], ['thunder_totem', 'Thunderbark Totem', 'thunderbark', 'lightning-electron'], ['sage_toad', 'Sage Toad Statue', 'sage_elm', 'frog']]) {
  const tree = SKILLS.woodcutting.actions.find((a) => a.id === log);
  tItem(id, name, '🪵', Math.round(ITEMS[log].value * 1.6), { type: 'trade',
    desc: `Carved from ${ITEMS[log].name}. A trade good: ships take it as cargo and sell it abroad for 3× its value.` }, g, ITEMS[log].color);
  CARVINGS.push([id, name, log]);
  SKILLS.arts.actions.push(craft(id, tree.level, tree.time, { [log]: 1 }));
}

/* ================================================================ Orange Town · Fishing + Cooking */
tItem('ghost_ray', 'Ghost Ray', '🐟', 38, { desc: 'A pale ray that glides under ghost ships. Sailors say it follows the drowned home.' }, 'tropical-fish', '#b8c8ff');
tItem('lantern_squid', 'Lantern Squid', '🦑', 60, { desc: 'A squid that lights the deep with its own body. Its ink glows for a week.' }, 'lantern-flame', '#7ff0e0');
tItem('allblue_tuna', 'All Blue Tuna', '🐟', 220, { desc: 'A tuna from the sea where every ocean meets. Cooks cross the world for a single one.' }, 'double-fish', '#3fb8ff');
addNodes('fishing',
  node('ghost_ray', 51, 5.2, null, [['fish_oil', 0.06, [1, 2]]]),
  node('lantern_squid', 64, 5.7, null, [['fish_oil', 0.08, [1, 2]]]),
  node('allblue_tuna', 95, 7.6, null, [['fish_oil', 0.1, [1, 3]], ['gold_saffron', 0.05, [1, 1]]]),
);
tItem('ray_skewers', 'Ghost Ray Skewers', '🍢', 80, { type: 'food', heal: 290 }, 'eating', '#b8c8ff');
tItem('squid_ink_ramen', 'Glowing Ink Ramen', '🍜', 120, { type: 'food', heal: 390 }, 'noodles', '#7ff0e0');
tItem('allblue_feast', 'All Blue Tuna Banquet', '🍱', 420, { type: 'food', heal: 900 }, 'knife-fork', '#3fb8ff');
addNodes('cooking',
  craft('ray_skewers', 51, 3.5, { ghost_ray: 1 }),
  craft('squid_ink_ramen', 64, 4, { lantern_squid: 1, fish_oil: 1 }),
  craft('allblue_feast', 95, 5, { allblue_tuna: 1, world_tree_leaf: 1 }),
);

/* ================================================================ Soul City · Mining + Smelting */
tItem('moonsilver', 'Moonsilver Ore', '🪨', 38, { desc: 'Silver ore that only shines at night, mined from the walls of the Soul Palace road.' }, 'ore', '#cfe0ff');
tItem('bloodstone', 'Bloodstone', '🪨', 62, { desc: 'A red stone that warms in your hand, as if something under it still had a pulse.' }, 'mineral-heart', '#d8344a');
tItem('soul_crystal', 'Soul King Crystal', '💎', 190, { desc: 'A shard of the crystal that seals the king of souls. It weighs nothing and feels like it weighs a mountain.' }, 'floating-crystal', '#fff0a8');
addNodes('mining',
  node('moonsilver', 51, 5.2, null, [['reishi_dust', 0.07, [1, 2]]]),
  node('bloodstone', 65, 5.8, null, [['reishi_dust', 0.07, [1, 2]]]),
  node('soul_crystal', 94, 7.6, null, [['reishi_dust', 0.12, [1, 3]]]),
);
tItem('moonsilver_ingot', 'Moonsilver Ingot', '🟫', 95, { ingot: true, desc: 'Moonsilver smelted over Ember Maple. It stays cool in the hottest fight.' }, 'metal-bar', '#cfe0ff');
tItem('bloodstone_ingot', 'Bloodstone Ingot', '🟥', 160, { ingot: true, desc: 'Bloodstone smelted over Thunderbark. It drinks a little of every wound it opens.' }, 'metal-bar', '#d8344a');
tItem('soulking_ingot', 'Soul King Ingot', '🟨', 480, { ingot: true, desc: 'A crystal of the king of souls, forged over Sage Elm. The strongest metal any world has seen.' }, 'metal-bar', '#fff0a8');
INGOT_OF.moonsilver = 'moonsilver_ingot';
INGOT_OF.bloodstone = 'bloodstone_ingot';
INGOT_OF.soul_crystal = 'soulking_ingot';
addNodes('smithing',
  craft('moonsilver_ingot', 51, 5.2, { moonsilver: 2, ember_maple: 1 }),
  craft('bloodstone_ingot', 65, 5.8, { bloodstone: 2, thunderbark: 1 }),
  craft('soulking_ingot', 94, 7.6, { soul_crystal: 2, sage_elm: 1 }),
);

/* ================================================================ Kaio Planet · Gravity */
{
  const k = (id, name, v, g, c, desc) => tItem(id, name, '✨', v, { desc }, g, c);
  k('ki_surge', 'Ki Surge', 230, 'aura', '#7fd4ff', 'Ki squeezed out at 150 times normal gravity. It surges up your arms in waves.');
  k('ki_blaze', 'Ki Blaze', 350, 'fire', '#ff9a3a', 'Ki that burns like a flame at 300 times normal gravity.');
  k('ki_aura', 'Ki Aura', 530, 'concentration-orb', '#ffe36a', 'A full golden aura, held at 600 times normal gravity.');
  k('divine_ki', 'Divine Ki', 900, 'spark-spirit', '#e8d0ff', 'Ki so calm and so dense it no longer feels like yours. Only reached at 1000 times normal gravity.');
  addNodes('gravity',
    node('ki_surge', 43, 4.8, '150× Gravity Session'),
    node('ki_blaze', 58, 5.3, '300× Gravity Session'),
    node('ki_aura', 72, 6, '600× Gravity Session'),
    node('divine_ki', 90, 7.2, '1000× Gravity Session'),
  );
}

/* ================================================================ Shinjuku · Cursed Research */
{
  const h = (id, name, v, g, c, desc) => tItem(id, name, '🕯️', v, { desc }, g, c);
  h('hex_thread', 'Cursed Thread', 340, 'spider-web', '#c070ff', 'Thread spun by a curse that lived inside a puppet. It ties itself in knots.');
  h('hex_bone', 'Cursed Bone', 480, 'horned-skull', '#d8d0c0', 'A bone a grudge would not let go of, even after the grave.');
  h('hex_seal', 'Grudge Seal', 680, 'tied-scroll', '#ff5a8a', 'A paper seal that held a curse in an underground station for a hundred years. It is still warm.');
  h('king_finger', 'Finger of the King', 1200, 'claw', '#ff3050', 'One of the twenty fingers of the King of Curses. It twitches when someone strong walks by.');
  const X = (item, level, time, name, extra) => node(item, level, time, name, extra.concat([['cursed_fragment', 0.04 + level / 1500, [1, 1]]]));
  addNodes('exorcism',
    X('hex_thread', 43, 4.8, 'Puppet Curses', [['storm_chakra', 0.3, [1, 2]], ['bound_talisman', 0.015, [1, 1]]]),
    X('hex_bone', 57, 5.2, 'Graveyard Wraiths', [['bone_ivory', 0.2, [1, 2]], ['grave_dust', 0.3, [1, 2]]]),
    X('hex_seal', 71, 6, 'Station Curses', [['ki_flare', 0.3, [1, 2]], ['veil_shard', 0.04, [1, 1]]]),
    X('king_finger', 90, 7.2, 'The King of Curses', [['echo_soul', 0.3, [1, 1]], ['veil_shard', 0.06, [1, 1]]]),
  );
}

/* ================================================================ Green Island · Hunting */
{
  const t = (id, name, v, g, c, desc) => tItem(id, name, '🐾', v, { desc }, g, c);
  t('grizzly_hide', 'Grizzly Hide', 410, 'fur-shirt', '#8a5a3a', 'The hide of a forest bear that fished with its bare claws. Arrows bounce off it.');
  t('serpent_skin', 'Serpent Skin', 570, 'sea-serpent', '#5ac88a', 'A skin shed by a swamp serpent longer than a river barge.');
  t('griffon_plume', 'Griffon Plume', 780, 'wing-cloak', '#ffd27a', 'A golden flight feather. It falls slower than it should.');
  t('ant_chitin', 'Chimera Ant Chitin', 1250, 'spiked-armor', '#5a7a3a', 'Shell from the soldiers of a royal hive. Harder than steel and lighter than wood.');
  const TR = (item, level, time, name, extra) => node(item, level, time, name, extra.concat([['game_meat', 0.25, [1, 2]]]));
  addNodes('tracking',
    TR('grizzly_hide', 43, 4.8, 'Bear Caves', [['seed_fire_pepper', 0.015, [1, 1]], ['trail_stone', 0.012, [1, 1]]]),
    TR('serpent_skin', 58, 5.2, 'Swamp Coils', [['seed_thunder_root', 0.01, [1, 1]], ['trail_stone', 0.02, [1, 1]]]),
    TR('griffon_plume', 72, 6, 'Griffon Roosts', [['seed_star_fruit', 0.01, [1, 1]], ['beastlord_claw', 0.02, [1, 1]]]),
    TR('ant_chitin', 90, 7.2, 'The Ant Hive', [['beastlord_claw', 0.03, [1, 1]], ['beast_essence', 0.06, [1, 1]]]),
  );
}

/* ================================================================ Echo Quarter · Archaeology + Restoration */
{
  const f = (id, name, v, g, c, desc) => tItem(id, name, '🏺', v, { desc }, g, c);
  f('silver_fragment', 'Silver Fragment', 520, 'two-coins', '#d8e0ea', 'Tarnished silver from a sunken navy fortress: buttons, coins, the rim of a bell.');
  f('crystal_fragment', 'Crystal Fragment', 710, 'gems', '#a8e8ff', 'A sliver of the crystal walls of a palace for souls.');
  f('meteor_fragment', 'Meteor Fragment', 960, 'falling-star', '#ff9a5a', 'Metal from a space pod that crashed long ago. Still faintly warm.');
  f('arrow_fragment', 'Arrowhead Fragment', 1500, 'triple-needle', '#ffd86a', 'A piece of an arrowhead older than the desert it was buried in. Touching it stings.');
  // A second site in four worlds. The first relic among a site's finds is the one its grid hides (echo.js).
  const D = (item, level, time, name, extra) => node(item, level, time, name, extra);
  addNodes('archaeology',
    D('silver_fragment', 43, 5.2, 'Dig: Marine Fortress', [['tide_pearl', 0.04, [1, 1]], ['blue_marlin', 0.3, [1, 2]], ['awakening_shard', 0.02, [1, 1]]]),
    D('crystal_fragment', 57, 5.7, 'Dig: Soul Palace', [['husk_heart', 0.04, [1, 1]], ['spirit_core', 0.3, [1, 2]], ['awakening_shard', 0.024, [1, 1]]]),
    D('meteor_fragment', 71, 6.5, 'Dig: Pod Crash Site', [['gravity_plate', 0.03, [1, 1]], ['ki_flare', 0.3, [1, 2]], ['awakening_shard', 0.028, [1, 1]]]),
    D('arrow_fragment', 90, 7.6, 'Dig: Desert Crypt', [['pillar_glyph', 0.025, [1, 1]], ['echo_dust', 0.1, [1, 2]], ['awakening_shard', 0.035, [1, 1]]]),
  );
  // Four museum artifacts (permanent bonuses), one per new site
  const art = (id, name, realm, kind, val, desc, g, c) => { tItem(id, name, '🏺', 20000, { type: 'artifact' }, g, c); ARTIFACTS[id] = { realm, kind, val, desc }; };
  art('silver_den_den', 'Silver Den Den Mushi', 'seas', 'gold', 0.05, '+5% gold', 'snail', '#d8e0ea');
  art('palace_bell', 'Soul Palace Bell', 'soul', 'xp', 0.03, '+3% XP on every skill', 'stone-throne', '#a8e8ff');
  art('pod_core', 'Space Pod Core', 'ki', 'dmg', 0.04, '+4% damage', 'smoking-orb', '#ff9a5a');
  art('first_arrowhead', 'The First Arrowhead', 'echo', 'hp', 0.04, '+4% max HP', 'broad-dagger', '#ffd86a');
  addNodes('restoration',
    craft('silver_den_den', 48, 10, { silver_fragment: 40, tide_heart: 1, ghost_ray: 20 }),
    craft('palace_bell', 62, 11, { crystal_fragment: 40, sovereign_shard: 2, hex_bone: 8, hex_thread: 8 }),
    craft('pod_core', 76, 12, { meteor_fragment: 40, tyrant_horn: 1, ki_aura: 8 }),
    craft('first_arrowhead', 92, 13, { arrow_fragment: 40, lord_visage: 1, king_finger: 4 }),
  );
}

/* ================================================================ tools Mk IV (the skills of worlds 4-7) */
{
  const tool = (sk, name, lv, inp, c) => {
    tItem(`tool_${sk}_4`, `${name} Mk IV`, '🔧', 1200, { type: 'tool', toolFor: sk, tier: 4 }, 'cog', c);
    SKILLS.arts.actions.push(craft(`tool_${sk}_4`, lv, 9, inp));
  };
  tool('gravity', 'Gravity Rig', 93, { divine_ki: 20, bloodstone_ingot: 15, ki_star: 12 }, '#e8d0ff');
  tool('exorcism', 'Spirit Bell', 93, { king_finger: 12, hex_seal: 30, ki_star: 12 }, '#ff3050');
  tool('tracking', "Hunter's Compass", 94, { ant_chitin: 20, griffon_plume: 30, ki_star: 12 }, '#5a7a3a');
  tool('archaeology', 'Brush & Pick', 96, { arrow_fragment: 20, meteor_fragment: 30, ki_star: 12 }, '#ffd86a');
}

/* ================================================================ gear (stats and recipes in economy.js) */
{
  const A = (id, name, emoji, slot, perks, x) => tItem(id, name, emoji, 100,
    Object.assign(eq(slot, Object.assign({}, perks)), { lore: x.lore }, x.fam ? { fam: x.fam } : {}), x.g, x.c);
  A('ember_maple_bow', 'Ember Maple Bow', '🏹', 'weapon', { tag_fire: 0.2 },
    { fam: 'ranged', g: 'bow-arrow', c: '#ff7a3a', lore: 'A bow of glowing maple strung with fox-fire. Its arrows leave sparks in the air.' });
  A('moonsilver_blade', 'Moonsilver Blade', '🗡️', 'weapon', { crit: 0.06 },
    { fam: 'blade', g: 'crescent-blade', c: '#cfe0ff', lore: 'A blade of moonsilver wrapped in ray leather. It only shows its edge at night.' });
  A('surge_gi', 'Surge Gi', '🥋', 'armor', { regen: 0.006 },
    { g: 'kimono', c: '#7fd4ff', lore: 'A training gi woven with moonsilver thread. Ki surges through it like current through wire.' });
  A('bloodstone_gauntlets', 'Bloodstone Gauntlets', '🥊', 'weapon', { tag_drain: 0.2 },
    { fam: 'heavy', g: 'mailed-fist', c: '#d8344a', lore: 'Gauntlets of bloodstone over a Thunderbark core. Each punch takes back a little of what it gives.' });
  A('threadbound_charm', 'Threadbound Charm', '🧿', 'accessory', { tag_bleed: 0.2 },
    { g: 'necklace', c: '#c070ff', lore: 'Cursed thread wound around a bone and a squid\'s glowing ink. Wounds it touches will not close.' });
  A('crystal_ward', 'Crystal Ward Charm', '🔮', 'accessory', { guard: 0.05 },
    { g: 'crystal-ball', c: '#a8e8ff', lore: 'Palace crystal set in navy silver on a grizzly-hide cord. Blows slow down before they reach you.' });
  A('griffon_cloak', 'Griffon Cloak', '🧥', 'armor', { guard: 0.06 },
    { g: 'cloak', c: '#ffd27a', lore: 'Griffon plumes over serpent skin, bound with a grudge seal. It catches the wind and the blades.' });
  A('meteor_hammer', 'Meteor Hammer', '🔨', 'weapon', { exec: 0.15 },
    { fam: 'heavy', g: 'warhammer', c: '#ff9a5a', lore: 'A hammer head forged from a crashed pod. It lands like the meteor it came from.' });
  A('kings_ring', 'Ring of the King', '💍', 'accessory', { tech: 0.1 },
    { g: 'diamond-ring', c: '#ff3050', lore: 'Two fingers of the King of Curses set in Soul King gold. Every technique you cast feels borrowed from him.' });
  A('soulking_blade', 'Soul King Blade', '⚔️', 'weapon', { crit: 0.06, first: 1 },
    { fam: 'blade', g: 'shining-sword', c: '#fff0a8', lore: 'Forged from the crystal that seals the king of souls, its guard of ant chitin. The last sword anyone will need.' });
  // Crafted placeholders: economy.js sets level, time, XP and ingredients from the stage. The levels
  // here only match it, because loot.js reads them for the rarity before economy.js runs.
  const made = { ember_maple_bow: 39, moonsilver_blade: 54, surge_gi: 69, bloodstone_gauntlets: 73, threadbound_charm: 77, griffon_cloak: 84, crystal_ward: 88, meteor_hammer: 90, kings_ring: 95, soulking_blade: 95 };
  for (const id in made) SKILLS.arts.actions.push(craft(id, made[id], 5, {}));
}
SKILLS.arts.actions.sort((a, b) => a.level - b.level);
