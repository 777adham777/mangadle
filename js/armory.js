'use strict';
/* ==========================================================================
   TRI-REALM — the manga armory (DOM-free). Loaded after lore.js, before loot.js.
   53 more pieces of equipment, spread over every world, each one a nod to that world's manga.

   - Their stats, value and recipe cost come from economy.js (GEAR_TIERS / GEAR_RECIPES), like every
     other piece: the numbers written here are only each piece's perk identity.
   - A new player is never buried under them: the Leaf Village only gets lucky drops (no new recipe),
     the recipes start in Orange Town, and the workshop hides a world's gear recipes until that world
     is open (workshop-ui.js).
   - Sources: rare drops (Epic once loot.js caps them), skill finds, voyage hauls, guardian drops,
     crafted pieces and three schematics. Drop-only pieces can be salvaged like the others (loot.js).
   - Each item carries its fallback glyph and colour (icons.js) until its painted icon exists.
   ========================================================================== */

const ARMORY = [];   // ids, in world order (the icon brief and the checks read it)
{
  // id, name, emoji, slot, perks (identity only), extra: { fam: weapon family, g: glyph, c: colour, lore }
  const A = (id, name, emoji, slot, perks, x) => {
    defItem(id, name, emoji, 100, Object.assign(eq(slot, Object.assign({}, perks)), { lore: x.lore, glyph: x.g, color: x.c }, x.fam ? { fam: x.fam } : {}));
    ARMORY.push(id);
  };

  /* ------------------------------------------------- Leaf Village (Naruto): lucky drops only */
  A('leaf_weights', "Rock's Leg Weights", '🏋️', 'accessory', { cxp: 0.06 },
    { g: 'weight', c: '#3fa860', lore: 'Lead weights strapped to the shins. Take them off and the whole world slows down.' });
  A('three_prong_kunai', 'Three-Pronged Kunai', '🗡️', 'weapon', { crit: 0.05, first: 0.5 },
    { fam: 'short', g: 'flying-dagger', c: '#ffd86a', lore: 'A kunai marked with a seal formula. Wherever it lands, a yellow flash follows.' });
  A('chakra_threads', "Puppeteer's Chakra Threads", '🧵', 'accessory', { tech: 0.08 },
    { g: 'puppet', c: '#8ad0ff', lore: "Ten threads of blue chakra, one per finger. The Sand's puppet masters never fight alone." });
  A('springtime_suit', 'Springtime Jumpsuit', '🥋', 'armor', { dodge: 0.03, counter: 0.5 },
    { g: 'leather-vest', c: '#3fd16a', lore: 'Green, skin-tight and blindingly earnest. The Power of Youth is not optional.' });
  A('sand_gourd', 'Gourd of Living Sand', '🏺', 'accessory', { guard: 0.05, thorns: 0.1 },
    { g: 'sandstorm', c: '#d8b46a', lore: 'A gourd packed with chakra-soaked sand. It moves to shield you before you even think of it.' });
  A('shark_skin_sword', 'Shark-Skin Greatsword', '🦈', 'weapon', { leech: 0.05 },
    { fam: 'heavy', g: 'shark-fin', c: '#4a8cc8', lore: 'A living blade wrapped in scales, swallowed by the Ashen Fox along with its swordsman. It shaves foes and eats their chakra.' });

  /* ------------------------------------------------- Orange Town (One Piece) */
  A('justice_coat', 'Justice Greatcoat', '🧥', 'armor', { guard: 0.06 },
    { g: 'cape', c: '#eef2f8', lore: 'A navy coat with one word on its back. Absolute, it says, and it means it.' });
  A('red_vest', "Rubber Captain's Vest", '🦺', 'armor', { wind: 0.2, berserk: 0.1 },
    { g: 'leather-vest', c: '#e8423a', lore: 'A red vest that has survived bullets, blades and a lot of stretching. Its captain never stops laughing.' });
  A('straw_hat', 'Treasured Straw Hat', '👒', 'accessory', { rare: 0.06, wind: 0.1 },
    { g: 'captain-hat-profile', c: '#f2c94c', lore: 'A battered straw hat with a red band, handed over with a promise. Whoever wears it is going to be king.' });
  A('wado_blade', 'Pure-White Wado Blade', '🗡️', 'weapon', { crit: 0.05, critDmg: 0.2 },
    { fam: 'blade', g: 'katana', c: '#f5f3ec', lore: 'A white-hilted katana carried for a promise between two children. It cuts only what its owner means to.' });
  A('black_leg_boots', 'Black-Leg Chef Shoes', '👞', 'weapon', { tag_fire: 0.2, first: 0.5 },
    { fam: 'short', g: 'wingfoot', c: '#3a3a46', lore: "A cook's polished shoes. His hands are for cooking, so his legs do the fighting, and they burn." });
  A('weather_baton', 'Weather Baton', '🌩️', 'weapon', { tag_lightning: 0.2, tech: 0.08 },
    { fam: 'cutlass', g: 'lightning-storm', c: '#5ab8ff', lore: "A navigator's three-part staff. Heat, cold and a little bubble of wind: enough to brew a thunderstorm." });
  A('sniper_goggles', 'Sniper King Goggles', '🥽', 'accessory', { first: 0.8 },
    { g: 'binoculars', c: '#ffb03a', lore: 'Flip-down goggles lost overboard by a long-nosed sniper. Through them, every target is a bullseye.' });
  A('seastone_cuffs', 'Seastone Cuffs', '⛓️', 'accessory', { guard: 0.05, thorns: 0.1 },
    { g: 'crossed-chains', c: '#6e8c9a', lore: 'Cuffs of sea-prism stone. A fruit user who touches them goes as weak as the sea makes them.' });

  /* ------------------------------------------------- Soul City (Bleach) */
  A('asauchi', 'Asauchi Blank Blade', '🗡️', 'weapon', { cdr: 0.06, tech: 0.06 },
    { fam: 'blade', g: 'katana', c: '#c8d0e0', lore: 'The nameless zanpakuto every academy student receives. Talk to it long enough and it answers.' });
  A('flash_sandals', 'Flash-Step Sandals', '🩴', 'accessory', { dodge: 0.03, counter: 0.5 },
    { g: 'run', c: '#e8e2d0', lore: 'Straw sandals worn thin by flash steps. One step, and you are already behind them.' });
  A('quincy_cross', 'Quincy Cross', '✝️', 'accessory', { first: 0.8, crit: 0.04 },
    { g: 'triquetra', c: '#c8e4ff', lore: 'A silver cross on a chain. Drawn through the fingers, it gathers spirit particles into a bow.' });
  A('hollow_mask_half', 'Shattered Hollow Mask', '👹', 'accessory', { berserk: 0.2, crit: 0.04 },
    { g: 'cracked-mask', c: '#f1ece0', lore: 'Half of a white mask with red stripes. Put it on and something inside you starts to laugh.' });
  A('captain_haori', "Captain's Haori", '🥋', 'armor', { tech: 0.08, guard: 0.04 },
    { g: 'kimono', c: '#f5f5f0', lore: 'A sleeveless white coat with a division number on its back. Thirteen exist; this one is yours.' });
  A('bankai_blade', 'Black Moon Bankai Blade', '⚔️', 'weapon', { crit: 0.06, critDmg: 0.2, cdr: 0.05 },
    { fam: 'blade', g: 'energy-sword', c: '#2a2a36', lore: 'A slim black blade with a broken-chain hilt. All its power fits in one edge and one fang of moonlight.' });

  /* ------------------------------------------------- Kaio Planet (Dragon Ball) */
  A('turtle_gi', 'Turtle School Gi', '🥋', 'armor', { counter: 0.5, cxp: 0.04 },
    { g: 'saiyan-suit', c: '#ff8a1f', lore: 'An orange gi with a kanji on the back. Trained in it, you deliver milk up mountainsides before breakfast.' });
  A('power_pole', 'Extending Power Pole', '🦯', 'weapon', { first: 1, crit: 0.04 },
    { fam: 'heavy', g: 'tree-branch', c: '#d8362a', lore: 'A red pole that grows on command. It once reached all the way to the top of a sacred tower.' });
  A('nimbus_charm', 'Flying Nimbus Charm', '☁️', 'accessory', { dodge: 0.03, speed: 0.04 },
    { g: 'fog', c: '#ffd84a', lore: 'A wisp of golden cloud in a glass charm. It only carries the pure of heart, so mind your thoughts.' });
  A('senzu_pouch', 'Senzu Bean Pouch', '🫘', 'accessory', { wind: 0.2, regen: 0.004 },
    { g: 'shoulder-bag', c: '#7fd06a', lore: 'A little cloth bag with a few beans rattling inside. One bean is ten days of food, or one more round.' });
  A('ki_blaster', 'Capsule Ki Blaster', '🔫', 'weapon', { tech: 0.1, cdr: 0.06 },
    { fam: 'ranged', g: 'pistol-gun', c: '#4ad0ff', lore: "Pops out of a capsule and fires condensed ki. A genius inventor's toy for those who can't blast on their own." });
  A('z_sword', 'Z Sword', '🗡️', 'weapon', { boss: 0.2, critDmg: 0.25 },
    { fam: 'heavy', g: 'broadsword', c: '#c0c8d8', lore: 'Said to be unbreakable. Pull it from the stone, then train with it until you are stronger than the sword.' });
  A('fusion_earrings', 'Fusion Earrings', '🟡', 'accessory', { tech: 0.08, crit: 0.05 },
    { g: 'ring', c: '#ffd23f', lore: 'One earring for each of two warriors. Wear the pair alone and you only become twice as stylish.' });

  /* ------------------------------------------------- Shinjuku (Jujutsu Kaisen) */
  A('jujutsu_uniform', 'Jujutsu High Uniform', '🧥', 'armor', { tech: 0.06, cdr: 0.06 },
    { g: 'ninja-armor', c: '#1e2440', lore: "A dark high-collar uniform with a spiral button, tailored to each student's technique." });
  A('resonance_hammer', 'Straw Doll Hammer & Nails', '🔨', 'weapon', { bleedHit: 0.12, tag_bleed: 0.15 },
    { fam: 'heavy', g: 'warhammer', c: '#c0703e', lore: 'A hammer, a pouch of nails and a straw doll. Strike the doll and the curse feels it too.' });
  A('playful_cloud', 'Playful Cloud Staff', '🥢', 'weapon', { critDmg: 0.25, berserk: 0.1 },
    { fam: 'heavy', g: 'crossed-chains', c: '#c84a3a', lore: 'A three-section staff with no technique in it at all. It hits exactly as hard as the arms that swing it.' });
  A('cursed_finger', 'Withered Cursed Finger', '🦴', 'accessory', { atk: 100, hp: -60, berserk: 0.2, leech: 0.03 },
    { g: 'death-skull', c: '#6a4a3a', lore: 'A blackened finger in a sealed box. Twenty of them exist. Swallowing one is a very bad idea.' });
  A('sealing_cube', 'Prison Realm Cube', '🧊', 'accessory', { guard: 0.06, wind: 0.15 },
    { g: 'cubes', c: '#8a6cff', lore: "A small cube with an eye on every face. Say 'gate open' and a thousand years go by inside." });
  A('inverted_spear', 'Inverted Spear of Heaven', '🔱', 'weapon', { exec: 0.2, boss: 0.15 },
    { fam: 'short', g: 'broad-dagger', c: '#b8c0d8', lore: 'A short blade with a jagged guard. Whatever it touches, every cursed technique stops at once.' });
  A('limitless_blindfold', 'Six-Eyes Blindfold', '🕶️', 'accessory', { crit: 0.06, cdr: 0.08 },
    { g: 'third-eye', c: '#f0f4ff', lore: 'A black blindfold. Not to see less: to see far, far too much, and stay sane.' });

  /* ------------------------------------------------- Green Island (Hunter × Hunter) */
  A('hunter_rod', "Hunter's Fishing Rod", '🎣', 'weapon', { first: 1, rare: 0.03 },
    { fam: 'ranged', g: 'fishing-pole', c: '#4fbf7a', lore: "A boy's fishing rod from Whale Island. He passed the Hunter Exam with it, and fished a few examinees too." });
  A('ten_vest', 'Ten Training Vest', '🦺', 'armor', { guard: 0.05, regen: 0.004 },
    { g: 'leather-vest', c: '#e8c070', lore: 'A plain vest for Ten practice. Keep your aura flowing round your body and arrows bounce off.' });
  A('medic_briefcase', "Doctor's Briefcase", '💼', 'accessory', { regen: 0.005, wind: 0.15 },
    { g: 'health-capsule', c: '#6a4a32', lore: 'A battered briefcase full of bandages, and one hidden knife. Its owner is going to be a doctor.' });
  A('steel_skateboard', 'Steel Skateboard', '🛹', 'accessory', { dodge: 0.03, speed: 0.04 },
    { g: 'wingfoot', c: '#a0a8b8', lore: 'Far heavier than it looks. Its owner rides it everywhere and never notices.' });
  A('steel_yoyos', 'Steel Yo-Yos', '🪀', 'weapon', { crit: 0.05, tag_lightning: 0.2 },
    { fam: 'short', g: 'striking-balls', c: '#c8d0e0', lore: 'Two yo-yos of fifty kilos each, thrown with a flick of the finger. Lightning crackles along the strings.' });
  A('chain_of_judgement', 'Chain of Judgement', '🔗', 'accessory', { boss: 0.15, counter: 0.5 },
    { g: 'andromeda-chain', c: '#e8e0c0', lore: 'A chain with a sword-shaped tip, bound to its maker by a vow. It strikes only its chosen foes, and never misses.' });
  A('joker_cards', 'Joker Throwing Cards', '🃏', 'weapon', { crit: 0.06, critDmg: 0.25 },
    { fam: 'ranged', g: 'folded-paper', c: '#e83a5a', lore: 'A deck coated in sticky, stretchy aura. Every card is a blade, and the magician is always smiling.' });
  A('royal_carapace', 'Royal Guard Carapace', '🐜', 'armor', { thorns: 0.2, guard: 0.06 },
    { g: 'spiked-shoulder-armor', c: '#4a5a3a', lore: "Shell plates shed by one of the Chimera King's royal guards. Harder than steel, still faintly warm." });

  /* ------------------------------------------------- Echo Quarter (JoJo, Demon Slayer) */
  A('nichirin_blade', 'Nichirin Blade', '⚔️', 'weapon', { exec: 0.15, tag_wind: 0.15 },
    { fam: 'blade', g: 'katana', c: '#3a6aff', lore: 'Forged from ore that drinks the sun. Its colour changes to match the first one to draw it.' });
  A('fox_warding_mask', 'Warding Fox Mask', '🎭', 'accessory', { guard: 0.05, wind: 0.15 },
    { g: 'fox-head', c: '#f5f1e6', lore: 'A carved fox mask, made by an old master for every pupil. It wards off evil, though not all of it.' });
  A('slayer_uniform', 'Slayer Corps Uniform', '🥋', 'armor', { guard: 0.05, counter: 0.5 },
    { g: 'armor-vest', c: '#1a1c2a', lore: "Black, with a kanji on the back. Its fibres hold against a lesser demon's claws." });
  A('stopped_watch', 'Stopped Pocket Watch', '⏱️', 'accessory', { cdr: 0.08, dodge: 0.03 },
    { g: 'stopwatch', c: '#ffd84a', lore: 'A gold watch whose hands froze at one exact second. Hold it and, for a moment, time stops for you too.' });
  A('steel_balls', 'Spinning Steel Balls', '⚪', 'weapon', { first: 1, counter: 0.5 },
    { fam: 'ranged', g: 'double-ringed-orb', c: '#c8ccd4', lore: 'Two steel balls that spin along the golden ratio. Throw one and it keeps turning inside the target.' });
  A('checkered_haori', 'Checkered Haori', '🟩', 'armor', { regen: 0.006, wind: 0.2 },
    { g: 'kimono', c: '#2a8a5a', lore: "Green and black checks, mended a hundred times. A big brother's coat, still warm from the hearth." });
  A('stand_arrow', 'Stand Arrow', '🏹', 'accessory', { tech: 0.1, crit: 0.05 },
    { g: 'bow-arrow', c: '#d8b04a', lore: 'An ancient arrowhead of meteorite stone. Those it pierces either die or awaken a Stand.' });
  A('hanafuda_earrings', 'Hanafuda Earrings', '🎴', 'accessory', { tag_fire: 0.2, crit: 0.05 },
    { g: 'star-prominences', c: '#ff6a3a', lore: 'Paper-card earrings painted with a rising sun, handed down a family of charcoal burners along with a dance.' });

  /* ------------------------------------------------- The Rift (every world at once) */
  A('torn_mask', 'Torn Stone-Hollow Mask', '💀', 'accessory', { leech: 0.04, berserk: 0.15 },
    { g: 'skull-mask', c: '#ff5bd8', lore: "A stone mask fused to a Hollow's bone face, where two worlds tore into each other. Neither half asked." });
  A('rift_mantle', 'Mantle of Seven Worlds', '🧣', 'armor', { guard: 0.06, regen: 0.006, thorns: 0.1 },
    { g: 'cape-armor', c: '#ff5bd8', lore: 'Woven from a scrap of every world you crossed. Each patch keeps its own weather.' });
  A('crossover_blade', 'Seven-Worlds Blade', '⚔️', 'weapon', { crit: 0.08, tech: 0.1, boss: 0.15 },
    { fam: 'blade', g: 'shining-sword', c: '#ff5bd8', lore: 'A blade with seven edges, each from a different world. It is never quite the same sword twice.' });

  // Three schematics: the world's finest crafted piece needs one, like the iconic gear.
  for (const id of ['z_sword', 'inverted_spear', 'joker_cards']) defItem('schem_' + id, 'Schematic: ' + ITEMS[id].name, '📜', 15000, schem(id));

  /* ------------------------------------------------- where each piece comes from */
  const foe = (name) => { for (const z of ZONES) for (const e of z.enemies) if (e.name === name) return e; throw new Error('armory: no foe ' + name); };
  const drop = (name, id, p) => foe(name).drops.push([id, p, [1, 1]]);
  // Declared rates set the rarity, then loot.js caps them: a regular foe's 1/40 is a Rare drop (1 in 150 kills),
  // a guardian's 1/20 an Epic one (1 in 300), the Unbound's blade a Legendary chase. Schematics are never capped.
  drop('Rogue Apprentice', 'leaf_weights', 1 / 40);
  drop('Mist Assassin', 'three_prong_kunai', 1 / 40);
  drop('Puppet Drone', 'chakra_threads', 1 / 40);
  drop('Ninken Alpha', 'springtime_suit', 1 / 40);
  drop('Stone Golem', 'sand_gourd', 1 / 40);
  drop('Ashen Fox Beast', 'shark_skin_sword', 1 / 20);
  drop('Navy Recruit', 'justice_coat', 1 / 40);
  drop('Reef Shark', 'sniper_goggles', 1 / 40);
  drop('Storm Corsair', 'weather_baton', 1 / 40);
  drop('Lesser Husk', 'asauchi', 1 / 40);
  drop('Sand Wraith', 'quincy_cross', 1 / 40);
  drop('Towering Husk', 'hollow_mask_half', 1 / 40);
  drop('Masked Sovereign', 'bankai_blade', 1 / 20);
  drop('Elite Soldier', 'ki_blaster', 1 / 40);
  drop('Horned Mutant', 'schem_z_sword', 1 / 150);
  drop('Crimson Tyrant', 'fusion_earrings', 1 / 20);
  drop('Grudge Spirit', 'resonance_hammer', 1 / 40);
  drop('Hollow Sorcerer', 'playful_cloud', 1 / 40);
  drop('Bound Corpse', 'sealing_cube', 1 / 40);
  drop('Elder Curse', 'schem_inverted_spear', 1 / 150);
  drop('Cursed Matriarch', 'limitless_blindfold', 1 / 20);
  drop('Rival Examinee', 'steel_skateboard', 1 / 40);
  drop('Bandit Hunter', 'steel_yoyos', 1 / 40);
  drop('Ruin Guardian', 'chain_of_judgement', 1 / 40);
  drop('Feral Chimera', 'schem_joker_cards', 1 / 150);
  drop('Chimera King', 'royal_carapace', 1 / 20);
  drop('Pillar Warrior', 'slayer_uniform', 1 / 40);
  drop('Masked Vampire', 'steel_balls', 1 / 40);
  drop('Echo Thief', 'stand_arrow', 1 / 40);
  drop('Pillar Lord', 'hanafuda_earrings', 1 / 20);
  drop('Rift Emperor', 'torn_mask', 1 / 20);
  drop('The Unbound', 'crossover_blade', 1 / 40);
  // Skill finds (Rare: loot.js caps them to 1 in 300 actions).
  RARE_FINDS.cooking.push(['black_leg_boots', 1 / 40]);
  RARE_FINDS.gravity.push(['nimbus_charm', 1 / 40]);
  RARE_FINDS.exorcism.push(['cursed_finger', 1 / 40]);
  RARE_FINDS.archaeology.push(['stopped_watch', 1 / 40]);
  // A voyage haul (Rare: capped to 1 in 100 hauls).
  SKILLS.voyaging.actions.find((a) => a.id === 'current').loot.rare.push(['straw_hat', 1 / 40]);
  // Crafted pieces: economy.js sets their level, time, XP and ingredients from their stage. The levels
  // here only match it, because loot.js reads them for the rarity before economy.js runs.
  const arts = SKILLS.arts.actions;
  const made = { red_vest: 39, wado_blade: 44, seastone_cuffs: 47, flash_sandals: 52, captain_haori: 60, turtle_gi: 64, power_pole: 66, senzu_pouch: 69,
    jujutsu_uniform: 73, hunter_rod: 80, ten_vest: 81, medic_briefcase: 82, nichirin_blade: 88, fox_warding_mask: 89, checkered_haori: 92, rift_mantle: 95 };
  for (const id in made) arts.push(craft(id, made[id], 5, {}));
  for (const [id, lv] of [['z_sword', 71], ['inverted_spear', 78], ['joker_cards', 85]]) arts.push(needs('schem_' + id, craft(id, lv, 5, {})));
}
