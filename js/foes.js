'use strict';
/* ==========================================================================
   TRI-REALM — foes (GDD §3), DOM-free.
   Every enemy has a kit: a role, an element it is weak to (and sometimes one it
   resists), a passive trait and signature moves. Moves replace a normal swing
   (the 2nd, then every 3rd); the big ones are telegraphed one swing ahead, so
   defensive techniques can answer them. Bosses change phase at 66% and 33% HP.
   Elites carry one random affix, Alphas two.

   Statuses (both sides) live in RT.st = { p: {...}, e: {...} } (not saved).
   Kits are power-neutral on average: each foe's attack and HP are scaled down
   by what its moves and traits add, so the tuned progression keeps its pace,
   but fights now have peaks to prepare for (food, defensive techniques, element).
   Loaded after techniques.js and weapons.js (wraps playerHit / enemyHit / dealDamage).
   ========================================================================== */

/* ------------------------------------------------------------ statuses */
const STATUS = {
  // on you
  poison: { name: 'Poison',   icon: 'dripping-goo',    side: 'p', bad: 1, desc: 'Loses HP every second.' },
  bleed:  { name: 'Bleed',    icon: 'triple-claws',    side: 'p', bad: 1, max: 5, desc: 'Loses HP every second. Stacks up to 5.' },
  burn:   { name: 'Burn',     icon: 'burning-embers',  side: 'p', bad: 1, desc: 'Loses HP every second.' },
  stun:   { name: 'Stunned',  icon: 'circle-sparks',   side: 'p', bad: 1, desc: 'Cannot attack or use techniques.' },
  weaken: { name: 'Weakened', icon: 'shattered-glass', side: 'p', bad: 1, desc: 'Deals 25% less damage.' },
  // on the foe
  shield: { name: 'Shield',   icon: 'double-ringed-orb', side: 'e', desc: 'Absorbs damage before HP.' },
  harden: { name: 'Hardened', icon: 'stone-block',     side: 'e', desc: 'Defense doubled.' },
  enrage: { name: 'Enraged',  icon: 'oni',             side: 'e', max: 3, desc: 'Each stack: hits 15% harder, attacks 8% faster.' },
  haste:  { name: 'Haste',    icon: 'wingfoot',        side: 'e', desc: 'Attacks 30% faster.' },
};
RT.st = { p: {}, e: {} };
const stOf = (side, id) => RT.st[side][id];
const stOn = (side, id) => { const s = RT.st[side][id]; return !!(s && s.t > 0); };
const stN = (side, id) => (stOn(side, id) ? RT.st[side][id].n : 0);
// v: power (damage per second for damage over time, absorb left for shields).
function addStatus(side, id, t, v) {
  const D = STATUS[id], cur = RT.st[side][id];
  if (cur && cur.t > 0) {
    cur.t = Math.max(cur.t, t);
    if (D.max) cur.n = Math.min(D.max, cur.n + 1);
    if (v) cur.v = id === 'shield' ? cur.v + v : Math.max(cur.v, v);
  } else RT.st[side][id] = { t, n: 1, v: v || 0, acc: 0 };
  emit('status', { side, id, add: true });
}
const clearStatus = (side) => { RT.st[side] = {}; };

/* ------------------------------------------------------------ roles + traits */
const ROLES = {
  brute:    { name: 'Bruiser',   icon: 'mailed-fist' },
  skirm:    { name: 'Skirmisher', icon: 'wingfoot' },
  assassin: { name: 'Assassin',  icon: 'hooded-assassin' },
  tank:     { name: 'Tank',      icon: 'shield' },
  caster:   { name: 'Caster',    icon: 'magic-swirl' },
  beast:    { name: 'Beast',     icon: 'paw' },
  spirit:   { name: 'Spirit',    icon: 'floating-ghost' },
  boss:     { name: 'Guardian',  icon: 'crown' },
};
// Passive traits (also the Elite / Alpha affixes). x = strength.
const TRAITS = {
  evasive:  { name: 'Evasive',  icon: 'dodge',          desc: (x) => `${pct(x)} of your auto-attacks miss.` },
  armored:  { name: 'Armored',  icon: 'spiked-armor',   desc: (x) => `Auto-attacks deal ${pct(x)} less. Techniques hit in full.` },
  regen:    { name: 'Regenerates', icon: 'heart-plus',  desc: (x) => `Recovers ${pct(x)} of its HP every second.` },
  frenzy:   { name: 'Frenzy',   icon: 'oni',            desc: () => 'Becomes Enraged below 35% HP.' },
  vampiric: { name: 'Vampiric', icon: 'heart-organ',    desc: (x) => `Heals for ${pct(x)} of the damage it deals.` },
  swift:    { name: 'Swift',    icon: 'wingfoot',       desc: () => 'Always hasted: attacks 30% faster.' },
  shielded: { name: 'Shielded', icon: 'double-ringed-orb', desc: (x) => `Starts each fight with a shield of ${pct(x)} of its HP.` },
  burning:  { name: 'Burning',  icon: 'burning-embers', desc: () => 'Its blows set you on fire.' },
};
const AFFIXES = [['evasive', 0.2], ['armored', 0.35], ['regen', 0.012], ['vampiric', 0.35], ['swift', 1], ['shielded', 0.25], ['burning', 1]];
// Weak: techniques with that tag and auto-attacks of a weapon awakened to it deal +30%. Resist: −25%.
const WEAK_MULT = 1.3, RESIST_MULT = 0.75;
// Life steal is capped per blow (share of the foe's max HP): late foes hit far harder than their own HP.
const DRAIN_CAP = 0.06, VAMP_CAP = 0.03;

/* ------------------------------------------------------------ moves */
// m: damage per hit (× a normal swing) · n: hits · tele: telegraphed one swing ahead · pierce: share of your defense ignored
// st: [status, seconds, power] put on you when a hit lands (power = share of the foe's attack per second for damage over time)
// stun: seconds · drain: share of the damage healed · self: [status, seconds, power] on itself · heal: share of max HP
const mv = (name, o) => Object.assign({ name, m: 0, n: 1 }, o);
const hit = (name, m, o) => mv(name, Object.assign({ m }, o));
const POISON = (s, p) => ['poison', s || 6, p || 0.12], BLEED = (s, p) => ['bleed', s || 6, p || 0.07], BURN = (s, p) => ['burn', s || 5, p || 0.14];
const WEAKEN = (s) => ['weaken', s || 6];

// name -> kit. lore is one short line for the bestiary.
const FOE_KITS = {};
// phases (bosses): [{ at: HP share, name, enrage, shield, haste, add: move }]
function kit(name, role, o, moves, phases) { FOE_KITS[name] = Object.assign({ role, moves, phases: phases || null }, o); }
const PH = (name, o) => Object.assign({ name, enrage: 1 }, o);

/* World 1 · Leaf Village */
kit('Bandit Thug', 'brute', { weak: 'fire', lore: 'A village dropout who robs travellers on the training paths.' },
  [hit('Dirty Kick', 1, { stun: 1.2 })]);
kit('Rogue Apprentice', 'skirm', { weak: 'lightning', resist: 'wind', trait: ['evasive', 0.12], lore: 'Failed the academy exam twice. Its kunai are dipped in toad venom.' },
  [hit('Poisoned Kunai', 0.8, { st: POISON() })]);
kit('Mist Assassin', 'assassin', { weak: 'wind', trait: ['evasive', 0.18], lore: 'Strikes from a fog it carries with it. A strong wind leaves it bare.' },
  [hit('Silent Kill', 2.4, { tele: 1 }), hit('Smoke Needles', 0.45, { n: 3, st: BLEED() })]);
kit('Puppet Drone', 'tank', { weak: 'fire', resist: 'bleed', trait: ['armored', 0.3], lore: 'A wooden war puppet whose master is long dead. It still pulls its own strings.' },
  [hit('Poison Needles', 0.45, { n: 3, st: POISON(5, 0.1) })]);
kit('Ninken Alpha', 'beast', { weak: 'fire', trait: ['frenzy', 1], lore: 'Leads the ninja hounds of the ravine. It never lets go once it bites.' },
  [hit('Rending Bite', 1.2, { st: BLEED(6, 0.08) }), mv('Pack Howl', { self: ['haste', 6] })]);
kit('Stone Golem', 'tank', { weak: 'lightning', resist: 'bleed', trait: ['armored', 0.35], lore: 'Earth-style sentinel. Lightning cracks it like a dry riverbed.' },
  [hit('Boulder Slam', 2.2, { tele: 1, stun: 1.5 }), mv('Harden', { self: ['harden', 6] })]);
kit('Ashen Fox Beast', 'boss', { weak: 'wind', resist: 'fire', lore: 'A tailed beast sealed under the den. Each tail it frees burns hotter.' },
  [hit('Fox Fire', 0.9, { st: BURN(6, 0.15) }), hit('Tail Sweep', 0.6, { n: 3 })],
  [PH('The tails ignite', { add: hit('Ash Bomb', 2.6, { tele: 1, st: BURN() }) }), PH('Nine-Tail Fury', { shield: 0.15 })]);

/* World 2 · Orange Town */
kit('Navy Recruit', 'brute', { weak: 'bleed', lore: 'Fresh from boot camp, eager for a bounty to report.' },
  [mv('Formation Guard', { self: ['shield', 0, 0.15] }), hit('Bayonet Thrust', 1.5, { pierce: 0.3 })]);
kit('Cannon Brute', 'brute', { weak: 'wind', resist: 'fire', lore: 'Carries a ship cannon on one shoulder and fires it point-blank.' },
  [hit('Point-Blank Shot', 2.6, { tele: 1, st: BURN(4) })]);
kit('Merfolk Brawler', 'brute', { weak: 'lightning', lore: 'Fights with the weight of the sea behind every punch.' },
  [hit('Sea Karate', 1.4, { stun: 1 }), hit('Tide Grip', 0.8, { st: WEAKEN() })]);
kit('Reef Shark', 'beast', { weak: 'lightning', trait: ['frenzy', 1], lore: 'Smells blood from three reefs away.' },
  [hit('Frenzied Bite', 1.1, { st: BLEED() })]);
kit('Sea Leviathan', 'beast', { weak: 'lightning', resist: 'fire', trait: ['regen', 0.008], lore: 'An ancient serpent of the Storm Belt. Its scales close as fast as they crack.' },
  [hit('Tidal Crush', 2.4, { tele: 1 }), hit('Constrict', 0.6, { n: 2, stun: 1.2 })]);
kit('Storm Corsair', 'skirm', { weak: 'fire', resist: 'lightning', trait: ['evasive', 0.12], lore: 'Rides the thunderheads and boards ships mid-storm.' },
  [hit('Thunder Cutlass', 0.9, { n: 2 }), mv('Smoke Bomb', { self: ['haste', 5] })]);
kit('Admiral of the Tide', 'boss', { weak: 'lightning', resist: 'wind', lore: 'Commands the fleet and the current alike. Never retreats.' },
  [hit('Tide Saber', 0.6, { n: 3 }), mv('Iron Will', { self: ['shield', 0, 0.12] })],
  [PH('All hands on deck', { add: hit('Tsunami Cannon', 3, { tele: 1, st: WEAKEN() }) }), PH("Admiral's resolve", { haste: 1 })]);

/* World 3 · Soul City */
kit('Lesser Husk', 'beast', { weak: 'bleed', trait: ['frenzy', 1], lore: 'A lost soul gone hungry. The mask is all that is left of its face.' },
  [hit('Soul Bite', 1.2, { drain: 0.5 })]);
kit('Lurking Husk', 'assassin', { weak: 'lightning', trait: ['evasive', 0.15], lore: 'Waits on the rooftops, legs folded like a spider.' },
  [hit('Venom Lash', 0.8, { st: POISON() }), hit('Ambush', 2.2, { tele: 1 })]);
kit('Towering Husk', 'caster', { weak: 'wind', resist: 'bleed', lore: 'A hundred husks fused into one. It fires light from its mask.' },
  [hit('Mask Beam', 2.6, { tele: 1, st: BURN() }), hit('Stomp', 1, { stun: 1.2 })]);
kit('Sand Wraith', 'spirit', { weak: 'fire', resist: 'bleed', trait: ['evasive', 0.2], lore: 'The desert wind given a will. Nothing in it bleeds.' },
  [hit('Sandstorm', 0.35, { n: 4, st: WEAKEN(5) })]);
kit('Masked Lancer', 'brute', { weak: 'lightning', lore: 'Its bone lance goes through armour as if it were paper.' },
  [hit('Piercing Lance', 1.6, { pierce: 0.5 }), mv('Bone Guard', { self: ['harden', 6] })]);
kit('Bone Priest', 'caster', { weak: 'fire', resist: 'drain', lore: 'Prays to the masks. They answer by mending its bones.' },
  [mv('Dark Prayer', { heal: 0.12 }), hit('Curse of Bone', 0.8, { st: POISON(6, 0.14) })]);
kit('Masked Sovereign', 'boss', { weak: 'lightning', resist: 'bleed', lore: 'Wears a mask for every soul it has eaten. Breaking one only reveals the next.' },
  [hit('Mask Shatter', 0.6, { n: 3 }), hit('Black Coffin', 3, { tele: 1 })],
  [PH('A second mask', { shield: 0.15 }), PH('Sovereign Roar', { add: hit('Hollow Roar', 1, { stun: 1.5, st: WEAKEN() }) })]);

/* World 4 · Kaio Planet */
kit('Wasteland Brawler', 'brute', { weak: 'bleed', lore: 'Trains by punching boulders until the boulders give up.' },
  [hit('Haymaker', 2.2, { tele: 1 }), hit('Rush Combo', 0.4, { n: 4 })]);
kit('Raging Ape', 'beast', { weak: 'bleed', trait: ['frenzy', 1], lore: 'Grows wilder under the full moon. Cut the tail and it calms.' },
  [hit('Ground Pound', 1.2, { stun: 1.2 }), hit('Mouth Beam', 2.6, { tele: 1, st: BURN() })]);
kit('Sprout Fiend', 'skirm', { weak: 'fire', lore: 'Grown from a seed in a single night. Latches on and does not let go.' },
  [hit('Acid Spit', 0.8, { st: POISON() }), hit('Latch On', 0.9, { drain: 0.6 })]);
kit('Elite Soldier', 'caster', { weak: 'lightning', lore: 'Reads your power on its visor before it fires.' },
  [hit('Energy Volley', 0.6, { n: 3 }), mv('Power Read', { self: ['haste', 5] })]);
kit('Armored Commander', 'tank', { weak: 'bleed', resist: 'fire', trait: ['armored', 0.3], lore: 'Plate on plate on plate. Its hammer cracks the ground it lands on.' },
  [hit('Hammer Drop', 2.4, { tele: 1, stun: 1.2 })]);
kit('Horned Mutant', 'beast', { weak: 'wind', trait: ['regen', 0.01], lore: 'A failed experiment that keeps growing new horns.' },
  [hit('Horn Charge', 1.6), mv('Mutate', { self: ['enrage', 99] })]);
kit('Crimson Tyrant', 'boss', { weak: 'drain', resist: 'fire', lore: 'Rules the crimson throne through three forms, each worse than the last.' },
  [hit('Crimson Barrage', 0.4, { n: 5 }), hit('Death Ball', 3.2, { tele: 1, st: BURN(6, 0.16) })],
  [PH('Second Form', { haste: 1 }), PH('Final Form', { shield: 0.15 })]);

/* World 5 · Shinjuku */
kit('Grudge Spirit', 'spirit', { weak: 'fire', resist: 'bleed', trait: ['evasive', 0.15], lore: 'A grudge so old it forgot who it hated. Now it hates you.' },
  [hit('Grudge', 0.6, { st: WEAKEN() }), hit('Wail', 0.5, { n: 3 })]);
kit('Hollow Sorcerer', 'caster', { weak: 'bleed', lore: 'Sold its name for a cursed technique. Hides behind barriers.' },
  [hit('Rot', 0.8, { st: POISON(7, 0.15) }), mv('Barrier', { self: ['shield', 0, 0.15] })]);
kit('Shrine Specter', 'spirit', { weak: 'fire', resist: 'bleed', trait: ['regen', 0.01], lore: 'Haunts the collapsed shrine, pinning trespassers with paper seals.' },
  [hit('Talisman Bind', 0.8, { stun: 1.5 }), hit('Spirit Flame', 0.9, { st: BURN() })]);
kit('Bound Corpse', 'tank', { weak: 'fire', trait: ['armored', 0.25], lore: 'Sewn together and wrapped in seals. Fire undoes both.' },
  [hit('Grave Grip', 1.2, { st: WEAKEN() }), hit('Rot Burst', 1, { st: POISON() })]);
kit('Veil Walker', 'assassin', { weak: 'lightning', trait: ['evasive', 0.2], lore: 'Steps between this side of the veil and the other mid-swing.' },
  [hit('Veil Cut', 2.5, { tele: 1, pierce: 0.4 })]);
kit('Elder Curse', 'caster', { weak: 'drain', resist: 'fire', trait: ['regen', 0.012], lore: 'A curse that has eaten other curses. It feeds on whatever it bites.' },
  [hit('Maw of Curses', 1.3, { drain: 0.5 }), hit('Miasma', 0.6, { st: POISON(6, 0.14) })]);
kit('Cursed Matriarch', 'boss', { weak: 'lightning', resist: 'drain', lore: 'Mother of every grudge in Shinjuku. Her domain is a lullaby you do not wake from.' },
  [hit('Grudge Needles', 0.4, { n: 4, st: BLEED() }), hit('Cursed Lullaby', 3, { tele: 1, stun: 1.5 })],
  [PH('Grudge Cradle', { shield: 0.15 }), PH('Mother of Curses', { add: mv('Feed on Fear', { heal: 0.08 }) })]);

/* World 6 · Green Island */
kit('Rival Examinee', 'skirm', { weak: 'wind', trait: ['evasive', 0.12], lore: 'Wants your exam badge and will not ask twice.' },
  [hit('Yo-yo Lash', 0.5, { n: 3 }), mv('Speed Burst', { self: ['haste', 5] })]);
kit('Swamp Mimic', 'tank', { weak: 'fire', trait: ['armored', 0.25], lore: 'Looks like a mossy treasure chest. It is a mouth.' },
  [hit('Tongue Snare', 0.8, { stun: 1.5 }), hit('Swallow', 2.4, { tele: 1, drain: 0.5 })]);
kit('Cliff Wyvern', 'beast', { weak: 'lightning', resist: 'wind', trait: ['evasive', 0.15], lore: 'Nests on the sheer cliffs and dives from the clouds.' },
  [hit('Sky Dive', 2.5, { tele: 1 }), hit('Venom Tail', 0.8, { st: POISON() })]);
kit('Bandit Hunter', 'skirm', { weak: 'bleed', lore: 'Hunts hunters for their licences.' },
  [hit('Snare Arrow', 0.8, { stun: 1.2 }), hit('Arrow Rain', 0.4, { n: 4 })]);
kit('Ruin Guardian', 'tank', { weak: 'lightning', resist: 'bleed', trait: ['armored', 0.35], lore: 'An ancient machine still guarding a city no one remembers.' },
  [hit('Ancient Beam', 2.8, { tele: 1 }), mv('Self-Repair', { heal: 0.1 })]);
kit('Feral Chimera', 'beast', { weak: 'lightning', resist: 'fire', trait: ['frenzy', 1], lore: 'Lion, goat and serpent, all three hungry.' },
  [hit('Triple Maul', 0.6, { n: 3, st: BLEED() }), hit('Serpent Tail', 0.8, { st: POISON() })]);
kit('Chimera King', 'boss', { weak: 'fire', resist: 'bleed', lore: 'King of every chimera on the island. Its roar freezes prey in place.' },
  [hit("King's Roar", 0.8, { stun: 1.5, st: WEAKEN() }), hit('Royal Maul', 0.6, { n: 3, st: BLEED() })],
  [PH('Wings of the King', { haste: 1, add: hit('Royal Dive', 3, { tele: 1 }) }), PH('Last King', { shield: 0.15 })]);

/* Echo Quarter */
kit('Masked Vampire', 'assassin', { weak: 'fire', resist: 'bleed', trait: ['vampiric', 0.3], lore: 'Fears only the sun. Drinks from every wound it opens.' },
  [hit('Blood Drain', 1.2, { drain: 0.8 })]);
kit('Sunlight Monk', 'brute', { weak: 'drain', resist: 'fire', lore: 'Breathes in the sun and strikes with it.' },
  [hit('Sunlight Overdrive', 0.6, { n: 3, st: BURN() }), mv('Breathing Form', { heal: 0.1 })]);
kit('Living Statue', 'tank', { weak: 'lightning', resist: 'bleed', trait: ['armored', 0.4], lore: 'A marble guard that turns its prey into more marble.' },
  [hit('Petrify', 0.6, { stun: 2 }), hit('Marble Crush', 2.4, { tele: 1 })]);
kit('Echo Thief', 'skirm', { weak: 'lightning', trait: ['evasive', 0.22], lore: 'Steals your breath, then your echo, then your name.' },
  [hit('Steal Breath', 0.6, { st: WEAKEN() }), hit('Echo Strike', 1, { n: 2 })]);
kit('Pillar Warrior', 'brute', { weak: 'fire', resist: 'wind', trait: ['regen', 0.008], lore: 'Built like one of the pillars it guards.' },
  [hit('Pillar Smash', 2.6, { tele: 1 }), hit('Blade Arms', 0.9, { st: BLEED() })]);
kit('Wind Pillar Guard', 'skirm', { weak: 'fire', resist: 'wind', trait: ['evasive', 0.15], lore: 'Wears the wind like armour.' },
  [hit('Divine Sandstorm', 0.45, { n: 4, st: BLEED() })]);
kit('Pillar Lord', 'boss', { weak: 'fire', resist: 'wind', lore: 'Older than the city. Every pillar is a bone of its old body.' },
  [hit('Blade Flurry', 0.4, { n: 5 }), mv('Light Mode', { self: ['haste', 6] })],
  [PH('Pillars awaken', { shield: 0.15 }), PH('Ultimate Being', { add: hit('Ultimate Ray', 3.4, { tele: 1 }) })]);

/* The Rift */
kit('Rift Emperor', 'boss', { weak: 'drain', lore: 'Sits where every world tears into one, and claims all of them.' },
  [hit('Rift Rend', 3, { tele: 1, pierce: 0.4 }), hit('Collapse', 1, { stun: 1.5, st: WEAKEN() })],
  [PH('Worlds fold', { shield: 0.15 }), PH('Emperor of the Rift', { haste: 1 })]);
kit('The Unbound', 'boss', { weak: 'drain', resist: 'fire', lore: 'What was sealed behind the Rift. It does not have a shape, only an appetite.' },
  [hit('Void Pulse', 0.35, { n: 6 }), hit('Unmaking', 3.5, { tele: 1, st: WEAKEN() })],
  [PH('It wakes', { shield: 0.15 }), PH('Unbound', { haste: 1, add: mv('Devour Light', { heal: 0.06 }) })]);

const FIRST_SPECIAL = 2, EVERY = 3;
const kitOf = (e) => (e ? FOE_KITS[e.base || e.name] || null : null);

/* ------------------------------------------------------------ power-neutral scaling */
// Expected extra damage (in normal swings) and extra toughness of a kit, over a nominal fight
// (6 enemy swings for commons, 24 for bosses). Divided out of each foe's attack and HP once, at load.
function kitWeight(e, K, boss) {
  const N = boss ? 24 : 6, T = N * e.spd, avgHit = 0.75 * e.atk;
  let swings = 0, bulk = 1, sp = 0;
  const moves = K.moves.concat(K.phases ? K.phases.filter((p) => p.add).map((p) => p.add) : []);
  for (let i = 1; i <= N; i++) {
    if (i < FIRST_SPECIAL || (i - FIRST_SPECIAL) % EVERY) { swings += 1; continue; }
    const m = moves[sp++ % moves.length];
    swings += m.m * m.n;
    if (m.st) { const [id, s, p] = m.st; if (p) swings += (p * e.atk * s) / avgHit; else if (id === 'weaken') bulk += (0.25 * s) / T; }
    if (m.stun) bulk += m.stun / T;
    if (m.drain) bulk += Math.min(DRAIN_CAP, (m.drain * m.m * m.n * avgHit) / e.hp);
    if (m.heal) bulk += m.heal;
    if (m.self) { const [id, s, v] = m.self; if (id === 'shield') bulk += v; else if (id === 'harden') bulk += (0.35 * s) / T; else if (id === 'haste') swings += (0.3 * s) / e.spd; else if (id === 'enrage') swings += 0.15 * (N - i); }
  }
  let threat = swings / N;
  const [tr, x] = K.trait || [];
  if (tr === 'evasive' || tr === 'armored') bulk /= 1 - 0.7 * x;
  if (tr === 'regen') bulk += x * T;
  if (tr === 'frenzy') threat *= 1.08;
  if (tr === 'vampiric') bulk += N * Math.min(VAMP_CAP, (x * avgHit) / e.hp);
  if (K.phases) {
    threat *= 1 + 0.15 * (0.66 + 0.33) + (K.phases.some((p) => p.haste) ? 0.1 : 0);
    for (const p of K.phases) if (p.shield) bulk += p.shield;
  }
  return { threat: Math.max(1, threat), bulk: Math.max(1, bulk) };
}
for (const z of ZONES) for (const e of z.enemies) {
  const K = kitOf(e);
  if (!K || e.kitScaled) continue;
  const w = kitWeight(e, K, !!z.boss);
  e.atk = Math.max(1, Math.round(e.atk / w.threat));
  e.hp = Math.max(1, Math.round(e.hp / w.bulk));
  e.kitScaled = true;
}

/* ------------------------------------------------------------ in battle */
// Runtime of the current foe: swings so far, the next special, Elite affixes, boss phase.
RT.foe = { n: 0, sp: 0, next: null, phase: 0, frenzy: false };
const foeTraits = () => {
  const out = {}, K = kitOf(curEnemy());
  if (K && K.trait) out[K.trait[0]] = K.trait[1];
  for (const [id, x] of S.combat.affix || []) out[id] = Math.max(out[id] || 0, x);
  return out;
};
const foeWinding = () => !!(RT.foe.next && RT.foe.next.tele && S.combat.enemy != null);
playerHeld = () => stOn('p', 'stun');

function foeMoves(K) {
  const ms = K.moves.slice();
  if (K.phases) K.phases.forEach((p, i) => { if (p.add && RT.foe.phase > i) ms.push(p.add); });
  return ms;
}
// After each swing, decide what the next one is.
function planNext(K) {
  const n = RT.foe.n + 1;
  RT.foe.next = null;
  if (n < FIRST_SPECIAL || (n - FIRST_SPECIAL) % EVERY) return;
  const ms = foeMoves(K);
  RT.foe.next = ms[RT.foe.sp++ % ms.length];
  if (RT.foe.next.tele) emit('winding', RT.foe.next);
}

hook('spawn', (e) => {
  const C = S.combat;
  clearStatus('e');
  RT.foe = { n: 0, sp: 0, next: null, phase: 0, frenzy: false };
  C.affix = [];
  if (e.rank) {
    const pool = AFFIXES.slice();
    for (let i = 0; i < e.rank && pool.length; i++) C.affix.push(pool.splice(Math.floor(Math.random() * pool.length), 1)[0]);
  }
  const tr = foeTraits();
  if (tr.shielded) addStatus('e', 'shield', 1e9, Math.round(e.hp * tr.shielded));
  if (tr.swift) addStatus('e', 'haste', 1e9);
  const K = kitOf(e);
  if (K) planNext(K);
});
hook('tick', () => { if (S.combat.zone == null) { clearStatus('p'); clearStatus('e'); RT.foe.next = null; } });

// Attack speed and power of the foe.
hook('espd', () => 1 / ((stOn('e', 'haste') ? 1.3 : 1) * (1 + 0.08 * stN('e', 'enrage'))));
// RT.foeMult / RT.foePierce: set while a move's hit goes through the normal swing.
hook('taken', () => (RT.foeMult || 1) * (1 + 0.15 * stN('e', 'enrage')));
hook('def', () => 1 - (RT.foePierce || 0));
hook('edef', () => (stOn('e', 'harden') ? 2 : 1));
hook('dmg', () => (stOn('p', 'weaken') ? 0.75 : 1));

// What lands with a hit: statuses, stun, drain, vampiric heal, burning affix.
function foeLands(e, dmg, m) {
  const C = S.combat, tr = foeTraits();
  if (m && m.st) { const [id, s, p] = m.st; addStatus('p', id, s, p ? p * e.atk * mitig(pDef()) : 0); }
  if (m && m.stun) addStatus('p', 'stun', m.stun);
  if (tr.burning) addStatus('p', 'burn', 4, 0.1 * e.atk * mitig(pDef()));
  const heal = Math.min(e.hp * DRAIN_CAP, dmg * ((m && m.drain) || 0)) + Math.min(e.hp * VAMP_CAP, dmg * (tr.vampiric || 0));
  if (heal > 0 && C.enemy != null) { C.eHp = Math.min(e.hp, C.eHp + heal); emit('foeheal', { amt: Math.round(heal) }); }
}
function foeMove(e, m, base) {
  const C = S.combat;
  clog(`${e.name} uses ${m.name}!`, 'foe');
  emit('foemove', { e, m });
  if (m.self) { const [id, s, v] = m.self; addStatus('e', id, s || 1e9, id === 'shield' ? Math.round(e.hp * v) : v); }
  if (m.heal) { C.eHp = Math.min(e.hp, C.eHp + e.hp * m.heal); emit('foeheal', { amt: Math.round(e.hp * m.heal) }); }
  for (let i = 0; i < m.n && m.m; i++) {
    RT.foeMult = m.m; RT.foePierce = m.pierce || 0;
    base(e);
    RT.foeMult = 1; RT.foePierce = 0;
    if (C.zone == null || C.enemy == null) return;
    if (foeLanded) foeLands(e, foeLanded, m);
  }
}
{
  const base = enemyHit;
  enemyHit = function (e) {
    const K = kitOf(e), C = S.combat;
    const m = K && RT.foe.next;
    if (m) foeMove(e, m, base);
    else { base(e); if (C.zone != null && C.enemy != null && foeLanded) foeLands(e, foeLanded, null); }
    if (C.zone == null || C.enemy == null) return;
    RT.foe.n++;
    if (K) planNext(K); else RT.foe.next = null;
  };
}
// Auto-attacks: evasive foes dodge some; armored ones shrug part of them off.
{
  const base = playerHit;
  playerHit = function (e) {
    const tr = foeTraits();
    if (tr.evasive && Math.random() < tr.evasive) {
      clog(`${e.name} evades your attack.`, 'sys');
      emit('hit', { target: 'enemy', dodge: true });
      return;
    }
    RT.auto = true;
    base(e);
    RT.auto = false;
  };
}
// Every hit on the foe: element (weak / resist), armor against auto-attacks, shield first, boss phases.
function hitTags() {
  if (RT.casting && TECHNIQUES[RT.casting]) return TECHNIQUES[RT.casting].tags;
  if (RT.auto && typeof armEl === 'function') { const el = armEl(curArm()); return el ? [el] : []; }
  return [];
}
{
  const base = dealDamage;
  dealDamage = function (e, dmg, crit, label, extra) {
    const C = S.combat, K = kitOf(e);
    if (C.enemy == null) return;
    extra = extra || {};
    if (K) {
      const tags = hitTags();
      if (K.weak && tags.includes(K.weak)) { dmg *= WEAK_MULT; extra.elem = 'weak'; }
      else if (K.resist && tags.includes(K.resist)) { dmg *= RESIST_MULT; extra.elem = 'resist'; }
    }
    const tr = foeTraits();
    if (RT.auto && tr.armored) dmg *= 1 - tr.armored;
    dmg = Math.max(1, Math.round(dmg));
    const sh = stOf('e', 'shield');
    if (sh && sh.t > 0 && sh.v > 0) {
      const a = Math.min(sh.v, dmg);
      sh.v -= a; dmg -= a;
      if (sh.v <= 0) { sh.t = 0; clog(`${e.name}'s shield breaks!`, 'sys'); emit('status', { side: 'e', id: 'shield', broke: true }); }
      if (!dmg) { emit('hit', { target: 'enemy', dmg: a, blocked: a, label }); return; }
      extra.blocked = a;
    }
    base(e, dmg, crit, label, extra);
    if (C.enemy == null) return;
    // Frenzy, then boss phases at 66% / 33%.
    if (tr.frenzy && !RT.foe.frenzy && C.eHp < e.hp * 0.35) { RT.foe.frenzy = true; addStatus('e', 'enrage', 1e9); clog(`${e.name} flies into a frenzy!`, 'foe'); emit('foemove', { e, m: { name: 'Frenzy' } }); }
    if (K && K.phases) {
      const want = C.eHp < e.hp * 0.33 ? 2 : C.eHp < e.hp * 0.66 ? 1 : 0;
      while (RT.foe.phase < Math.min(want, K.phases.length)) {
        const P = K.phases[RT.foe.phase++];
        if (P.enrage) addStatus('e', 'enrage', 1e9);
        if (P.haste) addStatus('e', 'haste', 1e9);
        if (P.shield) addStatus('e', 'shield', 1e9, Math.round(e.hp * P.shield));
        clog(`${e.name}: ${P.name}!`, 'foe');
        emit('phase', { e, n: RT.foe.phase + 1, name: P.name });
      }
    }
  };
}
// Statuses tick: damage over time on you, regeneration on the foe, timers run down.
hook('combat', (dt, e) => {
  const C = S.combat;
  if (!e || C.enemy == null) return;
  const tr = foeTraits();
  if (tr.regen && C.eHp < e.hp) C.eHp = Math.min(e.hp, C.eHp + e.hp * tr.regen * dt);
  for (const id of ['poison', 'bleed', 'burn']) {
    const s = RT.st.p[id];
    if (!s || s.t <= 0) continue;
    s.acc += Math.min(dt, s.t);
    while (s.acc >= 1) {
      s.acc -= 1;
      const dmg = Math.max(1, Math.round(s.v * s.n * hmul('taken')));
      C.hp -= dmg;
      emit('hit', { target: 'player', dmg, dot: id });
      autoEat();
      if (C.hp <= 0) { playerDown(e); return; }
    }
  }
  for (const side of ['p', 'e']) for (const id in RT.st[side]) {
    const s = RT.st[side][id];
    s.t -= dt;
    if (s.t <= 0) delete RT.st[side][id];
  }
});
// Stunned: techniques wait too (techniques.js checks playerHeld before casting).
