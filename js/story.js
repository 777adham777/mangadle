'use strict';
/* ==========================================================================
   TRI-REALM IDLE — the story (DOM-free)
   The objectives (GOALS in data.js) are the quests of a basic storyline, told in
   eight chapters: one per world, then the Rift. Each chapter has a guide (a
   portrait badge) who gives you every quest with a line of their own.
   Every quest pays gold and items that help with the next step; finishing a
   chapter also gives a piece of gear.
   The thread: you wake above the Leaf Village with a torn map and no memory.
   Worlds have been colliding since the sky cracked; every guardian was driven mad
   by a shard of the Rift. The map's marks light up one world at a time, and the
   one who drew it is waiting at the end.
   QUESTS is aligned with GOALS by index (saves store S.goal): keep them in step.
   Loaded after every file that defines items (foes.js, builds.js).
   ========================================================================== */

const NPCS = {
  ren:    { name: 'Old Ren',          title: 'Village carpenter' },
  kaede:  { name: 'Sensei Kaede',     title: 'Leaf instructor' },
  mira:   { name: 'Captain Mira',     title: 'Shipwright of Orange Town' },
  bart:   { name: 'Bartolo',          title: 'Galley cook' },
  kuro:   { name: 'Ferryman Kuro',    title: 'Guide of the dead' },
  tetsu:  { name: 'Tetsu',            title: 'Soul smith' },
  kai:    { name: 'Master Kai',       title: 'Gravity hermit' },
  yuki:   { name: 'Yuki',             title: 'Curse sorcerer' },
  nett:   { name: 'Examiner Nett',    title: 'Hunter Association' },
  selene: { name: 'Curator Selene',   title: 'Keeper of the museum' },
  carto:  { name: 'The Cartographer', title: 'Who drew your map' },
};

// from: index of the chapter's first quest · end: the line when it closes · reward: items
const CHAPTERS = [
  { id: 'leaf', n: 1, from: 0, realm: 'shinobi', title: 'The Apprentice of the Leaf', cast: ['ren', 'kaede'],
    intro: ['You wake in the forest above the Leaf Village with a torn map in your fist and no memory of how you got there.',
      'An old carpenter finds you. "Worlds have been crashing into each other since the sky cracked. You fell out of one, eh? Then you\'ll need to learn to stand on your own."'],
    end: 'The Ashen Fox lies still. In its den, a shard of light pulses, and the first mark on your map lights up: a harbour no map shows.',
    reward: { items: { old_compass: 1, sealed_scroll: 2 } } },
  { id: 'blue', n: 2, from: 17, realm: 'seas', title: 'A Harbour No Map Shows', cast: ['mira', 'bart'],
    intro: ['The river spills you into Orange Town, a port of crooked masts and loud gulls.',
      'A captain looks at your map and whistles. "That mark is under the Admiral\'s flagship. Nobody sails there hungry, and nobody sails there alone."'],
    end: 'The Admiral falls. Under his flagship a drowned seal glows with the same light as your map. The sea itself seems to breathe out.',
    reward: { items: { sea_charm: 1, treasure_map: 1 } } },
  { id: 'soul', n: 3, from: 29, realm: 'soul', title: 'Below the Drowned Seal', cast: ['kuro', 'tetsu'],
    intro: ['Beyond the seal there is no sea, only grey streets and lanterns that never go out.',
      'A ferryman studies you. "The living don\'t come here. Unless they carry a map like yours. Then they always come back changed."'],
    end: 'The Masked Sovereign\'s mask splits in two. Behind his throne, a stair climbs out of the afterlife into a sky full of thunder.',
    reward: { items: { reaper_scarf: 1, ruby: 1 } } },
  { id: 'ki', n: 4, from: 39, realm: 'ki', title: 'The Gravity Stair', cast: ['kai'],
    intro: ['At the top of the stair: endless plains, a tiny planet of a house and an old man doing push-ups on one finger.',
      '"You fight like someone in a hurry," he says without looking up. "Slow down. Get heavy. Then we\'ll talk about that map."'],
    end: 'The Crimson Tyrant\'s horn still hums. Its curse is not from this world, and it is pulling at a gate of black paper.',
    reward: { items: { weighted_gi: 1, capsule_crate: 2 } } },
  { id: 'hex', n: 5, from: 46, realm: 'hex', title: 'Paper Gates', cast: ['yuki'],
    intro: ['Neon, rain and talismans on every door. The curses of Shinjuku turn to look at you as you pass.',
      'A blindfolded sorcerer smiles. "Curses feed on fear. Lately they feed on shards like the one your map is chasing. Let\'s starve them."'],
    end: 'The Matriarch\'s eye closes for good, but not before it shows you a trail into a green, roaring wild.',
    reward: { items: { paper_blade: 1, cursed_box: 2 } } },
  { id: 'hunt', n: 6, from: 51, realm: 'hunter', title: 'The Hunter\'s Licence', cast: ['nett'],
    intro: ['Green Island: trees as tall as towers and beasts worth a fortune.',
      'An examiner taps your map. "Everyone on this island wants that. Pass the exam, earn a licence, and maybe I\'ll tell you who drew it."'],
    end: 'The Chimera King\'s heart is still beating. Behind its nest, a stone door carved with strange poses waits for it.',
    reward: { items: { chimera_fang: 1, hunters_cache: 2 } } },
  { id: 'echo', n: 7, from: 56, realm: 'echo', title: 'Echoes in Stone', cast: ['selene'],
    intro: ['Marble plazas, pillars and statues that seem to hold their breath. Every stone here remembers another world.',
      'A curator adjusts her glasses. "Your map is a museum piece, you know. Its maker was here once. Dig, and you\'ll find out."'],
    end: 'The Pillar Lord kneels. On his throne someone has left a note in the same ink as your map: "Seven relics. One gate. Come."',
    reward: { items: { stone_mask: 1, echo_reliquary: 1 } } },
  { id: 'rift', n: 8, from: 62, realm: 'rift', title: 'Where Worlds Meet', cast: ['carto'],
    intro: ['The gate tears open. A figure in a burning cloak waits on the other side, holding the other half of your map.',
      '"I drew it," says the Cartographer. "Every mark is a world the Rift was swallowing. The Rift Emperor wants them all to be one. Someone who belongs to all of them can stop him."'],
    end: 'The Rift is quiet. The map in your hand is whole again, and every world on it is still its own. For now.',
    reward: { items: { rift_shard: 1 } } },
];
// One per GOALS entry: s: the guide's line, w: which of the chapter's cast says it, i: items on claim.
const Q = (s, i, w) => ({ s, i: i || {}, w: w || 0 });
const QUESTS = [
  // 1 · Leaf Village
  Q('Every shinobi starts with an axe. Fell ten pines for me and we\'ll see what you\'re made of.', { healing_leaf: 6 }),
  Q('Good arms. Keep chopping until the wood starts talking back.', { bird_nest: 1 }),
  Q('Five pine logs and some patience: carve yourself a sword.', { soldier_pill: 3 }),
  Q('A sword in the bank cuts nothing. Strap it on.', { chakra_shard: 10 }),
  Q('Healing leaves from the undergrowth, pressed into pills. You\'ll thank me later.', { soldier_pill: 5 }),
  Q('Put pills in your pouch. In a fight you swallow one without thinking.', { soldier_pill: 10 }),
  Q('So you\'re Ren\'s stray. Ten opponents at the Training Grounds. No excuses.', { scroll_shinobi: 1 }, 1),
  Q('Foes carry technique scrolls. Read one and the technique is yours forever.', { herb_pouch: 1 }, 1),
  Q('Level ten. Now you\'re worth sparring with. Here, a lighter blade for a quicker hand.', { crystal_kunai: 1 }, 1),
  Q('A travelling merchant came by. Spend your coin on tools, not trinkets.', { sealed_scroll: 1 }),
  Q('The Misty Forest: assassins, puppets, and steel worth taking.', { mist_steel: 2 }, 1),
  Q('Duplicate scrolls become fragments. Feed them to a technique and it grows.', { scroll_shinobi: 2 }, 1),
  Q('Twenty. Your chakra has depth now. Don\'t waste it.', { moon_pill: 10 }, 1),
  Q('Split your chakra between disciplines. It trains even while you sleep.', { chakra_orb: 10 }, 1),
  Q('Some foes carry blueprints for gear worth a legend. Find one.', { mist_steel: 4 }, 1),
  Q('The Ashen Fox went mad when something fell into its den. End it.', { shadow_pill: 10, sealed_scroll: 2 }, 1),
  Q('The river leads to a harbour no map shows. Make the shipwrights their offering.', {}),
  // 2 · Orange Town
  Q('Welcome aboard, landlubber. Nobody sails hungry: catch me something.', { sea_salt: 10 }),
  Q('Feel the bite before the float dips. Level five and I\'ll find you a stove.', { minnow: 10 }),
  Q('Fish raw is bait. Fish grilled is courage! Five of them.', { peppercorns: 10 }, 1),
  Q('Ten! A real cook. In a fight, food heals far more than any pill.', { reef_bass: 10 }, 1),
  Q('Salt heals more, pepper hits harder. Season five dishes and taste the difference.', { coral_lemon: 5, fire_chili: 5 }, 1),
  Q('My crew sails while you work. Send them out and they bring back the world.', { cedar_log: 20 }),
  Q('Navy recruits guard the shoals. Teach them some manners.', { scroll_seas: 1 }),
  Q('One day the pan sings. That\'s a Perfect dish. Hand one in to the log!', { gold_saffron: 2 }, 1),
  Q('The merfolk are restless. Something is pulling at the tides.', { tide_pearl: 2 }),
  Q('Old sailors say a shiny fish is the sea\'s blessing. Go get blessed.', { sunken_chest: 1 }),
  Q('The Admiral hoards everything the sea coughs up. Something glows in his hold.', { treasure_map: 1 }),
  Q('Under his flagship lies a seal between the living and the dead. Your map points right at it.', {}),
  // 3 · Soul City
  Q('Dig if you want to stay. The ore here is spirit made solid.', { jade: 1 }),
  Q('Ore is a promise. An ingot is a promise kept. Ten of them, over a wood fire.', { reishi_ingot: 10 }, 1),
  Q('Husks roam the outer districts. Take what they drop: hearts, masks, all of it.', { husk_heart: 2 }),
  Q('Every soul blade starts nameless. Forge one from your ingots.', { silver_ingot: 6 }, 1),
  Q('Ingots of its tier, and a gem at +4, +7 and +10. Refine it.', { jade: 1 }, 1),
  Q('Feed it souls and it wakes with an element. Choose well, it remembers.', { spirit_core: 10 }, 1),
  Q('Your spiritual pressure is a whisper. Train it until the lanterns flicker.', { soul_fragment: 20 }),
  Q('Word travels between worlds. Give it something to say.', { lost_lantern: 1 }),
  Q('The Sovereign wears a mask cut from the same light as your map.', { ruby: 1 }),
  Q('A stair climbs out of here into thunder. It takes a ruler\'s toll.', {}),
  // 4 · Kaio Planet
  Q('Ten times your weight. Then ten more. Get heavy.', { ki_spark: 10 }),
  Q('A warrior who can\'t grow a bean starves on the plains. Plant something.', { seed_sun_wheat: 5 }),
  Q('Ki in a tool makes the work fly. Build one in Crafting.', { ki_orb: 10 }),
  Q('Time runs differently in that room. Spend an hour, live a day.', { seed_moon_rice: 5 }),
  Q('Push past your limit in battle. Once, just to know it\'s there.', { vital_bean: 5 }),
  Q('The Tyrant\'s horn hums with a curse that isn\'t from here. Break him.', { capsule_crate: 2 }),
  Q('Offer the horn. A gate of black paper will open.', {}),
  // 5 · Shinjuku
  Q('Study the curses. Know what they eat and you know how to starve them.', { cursed_fragment: 3 }),
  Q('A domain is a world you carry inside you. Its scroll is out there.', { scroll_hex: 1 }),
  Q('Bind yourself. Give something up and you get something back.', { cursed_fragment: 5 }),
  Q('Her eye still sees, even now. Close it.', { cursed_box: 2 }),
  Q('The eye points to a green, roaring wild. Pay the hunters\' toll.', {}),
  // 6 · Green Island
  Q('First lesson: read the trail before you chase the beast.', { wild_fur: 10, snare: 2 }),
  Q('A beast that trusts you is worth ten blades.', { net_trap: 2 }),
  Q('Licensed hunters take contracts from every world. Take three.', { hunters_cache: 1 }),
  Q('The Chimera King nests on a door that shouldn\'t exist.', { beast_essence: 5 }),
  Q('Its heart still beats. The door is waiting for it.', {}),
  // 7 · Echo Quarter
  Q('Every fragment here remembers a world that touched this one. Dig.', { clay_fragment: 20 }),
  Q('Three shards that hum together. Wake what sleeps inside them.', { awakening_shard: 1 }),
  Q('An Echo works beside you. Give it something to do.', { echo_dust: 3 }),
  Q('Restore one artifact and the museum remembers for you.', { bronze_fragment: 20 }),
  Q('The Pillar Lord guards the last door. Your map ends at his throne.', { echo_reliquary: 1 }),
  Q('Seven relics, one from every world. The gate is waiting.', {}),
  // 8 · The Rift
  Q('Seven stars hide in seven worlds. Bring them together and make a wish.', {}),
  Q('The sea\'s cursed fruit: one bite, one power, forever.', {}),
  Q('He wants every world to be one. Show him why they shouldn\'t be.', { rift_shard: 1 }),
  Q('Forge the blade that cuts between worlds.', {}),
  Q('Go back. Every world still keeps secrets.', {}),
];
// drop rewards for items that do not exist (content changes) rather than break a claim
for (const q of QUESTS) for (const k in q.i) if (!ITEMS[k]) delete q.i[k];
for (const c of CHAPTERS) for (const k in c.reward.items) if (!ITEMS[k]) delete c.reward.items[k];

const chapterAt = (i) => { let c = CHAPTERS[0]; for (const x of CHAPTERS) if (i >= x.from) c = x; return c; };
const chapterEnd = (c) => { const k = CHAPTERS.indexOf(c); return k + 1 < CHAPTERS.length ? CHAPTERS[k + 1].from - 1 : GOALS.length - 1; };
const questOf = (i) => QUESTS[i] || Q('', {});
const questNpc = (i) => NPCS[chapterAt(i).cast[questOf(i).w] || chapterAt(i).cast[0]];
function storyState() { if (!S.story) S.story = { seen: {}, done: {} }; return S.story; }

// Claiming a quest also gives its items; the last quest of a chapter gives the chapter's reward.
// Everything goes to the bank (scrolls too: you read them when you choose).
function storyGive(k, n) { addItem(k, n); }
{
  const base = claimGoal;
  claimGoal = function () {
    const st = goalState();
    if (!st || !st.done) return;
    const i = S.goal, q = questOf(i), ch = chapterAt(i);
    base();
    if (S.goal === i) return;
    for (const k in q.i) storyGive(k, q.i[k]);
    if (i === chapterEnd(ch)) {
      const R = ch.reward;
      for (const k in R.items) storyGive(k, R.items[k]);
      storyState().done[ch.id] = 1;
      emit('chapter', ch);
    }
  };
}
