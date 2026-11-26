'use strict';
/* ==========================================================================
   ANIME IDLE RPG — sets and wards (La Forge P9, 2026-11-26, docs/FORGE.md). DOM-free.
   Every set of gear.js (GEAR_SETS, plus one per dungeon) becomes a 6-piece set with bonuses at
   2, 4 and 6 pieces worn (builds.js setFx). Their bonuses are mostly WARDS: each answers one
   mechanic of the foes the set is made against (foes.js reads them through ward()):
     acc evasive foes · pierce armoured / hardened foes · wounds regeneration, drain and heals
     calm enrage and haste · parry telegraphed blows · brace multi-hit attacks · steady armour-piercing
     shieldBreak shields · rPoison rBleed rBurn rWeaken rStun the statuses put on you.
   A tier a set does not name is read from its foes' kits: the two mechanics they use most.
   Loaded after dungeons.js (every set exists), before economy.js.
   ========================================================================== */

// Wards are perks: they show in stat lines, the build panel and the set inspector (builds-ui.js).
Object.assign(PERKS, {
  acc:         { name: 'Accuracy',        icon: 'broadsword',     arch: 'ward', unit: 0.25, tip: 'Evasive foes dodge this much less often.' },
  pierce:      { name: 'Armor breaker',   icon: 'broken-shield',  arch: 'ward', unit: 0.35, tip: 'Armored and hardened foes shrug off this much less of your auto-attacks.' },
  wounds:      { name: 'Grievous wounds', icon: 'triple-claws',   arch: 'ward', unit: 0.6, tip: 'Foes heal and regenerate this much less.' },
  calm:        { name: 'Composure',       icon: 'meditation',     arch: 'ward', unit: 0.5, tip: 'Enraged and hasted foes gain this much less from it.' },
  parry:       { name: 'Parry',           icon: 'shield',         arch: 'ward', unit: 0.3, neg: true, tip: 'Telegraphed blows deal this much less.' },
  brace:       { name: 'Brace',           icon: 'spiked-armor',   arch: 'ward', unit: 0.25, neg: true, tip: 'Attacks of several hits deal this much less.' },
  steady:      { name: 'Steady',          icon: 'shield',         arch: 'ward', unit: 0.5, tip: 'Armour-piercing blows ignore this much less of your defense.' },
  shieldBreak: { name: 'Shield breaker',  icon: 'double-ringed-orb', arch: 'ward', unit: 0.4, tip: 'Your hits tear through shields this much faster.' },
  rPoison:     { name: 'Poison ward',     icon: 'dripping-goo',   arch: 'ward', unit: 0.5, neg: true, tip: 'Poison on you lasts and hurts this much less.' },
  rBleed:      { name: 'Bleed ward',      icon: 'triple-claws',   arch: 'ward', unit: 0.5, neg: true, tip: 'Bleeding on you lasts and hurts this much less.' },
  rBurn:       { name: 'Burn ward',       icon: 'burning-embers', arch: 'ward', unit: 0.5, neg: true, tip: 'Burns on you last and hurt this much less.' },
  rWeaken:     { name: 'Weaken ward',     icon: 'shattered-glass', arch: 'ward', unit: 0.5, neg: true, tip: 'Weaken on you lasts this much less.' },
  rStun:       { name: 'Tenacity',        icon: 'circle-sparks',  arch: 'ward', unit: 0.5, neg: true, tip: 'Stuns on you last this much less.' },
});
ARCHES.ward = { name: 'Warden', icon: 'shield', desc: 'Answers the foe' };

// What answers a kit: [ward, value] for each mechanic it uses (several moves count several times).
const STATUS_WARD = { poison: 'rPoison', bleed: 'rBleed', burn: 'rBurn', weaken: 'rWeaken' };
const WARD_VAL = { acc: 0.25, pierce: 0.35, wounds: 0.6, calm: 0.5, parry: 0.3, brace: 0.25, steady: 0.5, shieldBreak: 0.4, rPoison: 0.5, rBleed: 0.5, rBurn: 0.5, rWeaken: 0.5, rStun: 0.5 };
function kitWards(K) {
  const out = [], add = (k) => { if (k) out.push(k); };
  const tr = K.trait && K.trait[0];
  add({ evasive: 'acc', armored: 'pierce', regen: 'wounds', vampiric: 'wounds', frenzy: 'calm', swift: 'calm', shielded: 'shieldBreak', burning: 'rBurn' }[tr]);
  const moves = K.moves.concat((K.phases || []).filter((p) => p.add).map((p) => p.add));
  for (const m of moves) {
    if (m.tele) add('parry');
    if (m.n > 1) add('brace');
    if (m.stun) add('rStun');
    if (m.pierce) add('steady');
    if (m.drain || m.heal) add('wounds');
    if (m.st) add(STATUS_WARD[m.st[0]]);
    if (m.self) add({ shield: 'shieldBreak', haste: 'calm', enrage: 'calm', harden: 'pierce' }[m.self[0]]);
  }
  for (const p of K.phases || []) { if (p.shield) add('shieldBreak'); if (p.haste) add('calm'); }
  return out;
}
// The wards a set's foes call for, most used first.
function setWards(S0) {
  const n = {};
  for (const name of S0.from || []) { const K = FOE_KITS[name]; if (K) for (const k of kitWards(K)) n[k] = (n[k] || 0) + 1; }
  return Object.keys(n).sort((a, b) => n[b] - n[a] || a.localeCompare(b));
}

/* ------------------------------------------------------------ the sets */
for (const S0 of GEAR_SETS) {
  if (!S0.slots) continue;   // a world not in this build
  const used = new Set(Object.keys(Object.assign({}, S0.b2, S0.b4, S0.b6))), want = setWards(S0).filter((k) => !used.has(k));
  const auto = () => { const k = want.shift(); return k ? { [k]: WARD_VAL[k] } : {}; };
  const b4 = S0.b4 || Object.assign(auto(), auto());
  const b6 = S0.b6 || auto();
  const set = { id: S0.id, name: S0.name, realm: S0.realm, color: S0.color, pieces: ARMOR_SLOTS.map((s) => S0.slots[s]), b2: S0.b2 || auto(), b4, b6, from: S0.from || [], sigil: sigilOf(S0.id) };
  SETS.push(set);
  for (const id of set.pieces) (SET_OF[id] = SET_OF[id] || []).push(set);
}
