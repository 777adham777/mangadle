'use strict';
/* ==========================================================================
   TRI-REALM IDLE — while you were away: the away log + allies, DOM-free
   - The away log: from the moment you leave (page hidden, or the game closed) until
     you come back, notable events are written down with their time, even during the
     offline simulation (SIM silences the event bus, so game.js taps emit() for us).
   - Allies (One Piece: your nakama across the worlds). While you are away at least an
     hour, the guides of the story drop by (1 visit, 2 from 3 h, 3 from 7 h). Each visit
     brings a real gift from their trade (about 15 minutes of it, no materials used)
     and +1 bond (max 5). Bond n gives +2n% to their trade for good; a sworn ally
     (bond 5) brings a double gift.
   Loaded after missions.js (before guide.js: the balance bot loads it too).
   ========================================================================== */

/* ---------------------------------------------------------------- the away log */
let AWAY = null;
const AWAY_KEEP = { rare: 1, pet: 1, levelup: 1, kill: 1, schematic: 1, mission: 1, death: 1, card: 1, expedition: 1, hunted: 1, dgclear: 1, dgend: 1 };
function awayBegin() {
  if (AWAY) return AWAY;
  AWAY = { t: 0, ev: [], since: Date.now() };
  return AWAY;
}
const awayDrop = () => { AWAY = null; };
hook('tick', (dt) => { if (AWAY) AWAY.t += dt; });
EMIT_TAP = (ev, d) => {
  if (!AWAY || !AWAY_KEEP[ev] || AWAY.ev.length > 400) return;
  const t = AWAY.t;
  if (ev === 'kill') {
    if (d.boss) AWAY.ev.push({ k: 'boss', t, name: d.enemy.name });
    // technique scrolls wait in the Bank: one line counts them
    let n = 0;
    for (const id in d.loot || {}) if (ITEMS[id] && ITEMS[id].type === 'scroll') n += d.loot[id];
    if (n) { if (!AWAY.scroll) AWAY.ev.push(AWAY.scroll = { k: 'scroll', t, n: 0 }); AWAY.scroll.n += n; }
    return;
  }
  if (ev === 'dgclear') { AWAY.ev.push({ k: 'dg', t, id: d.id, piece: d.piece }); return; }
  if (ev === 'dgend') { if (d.why === 'defeat') AWAY.ev.push({ k: 'dgfail', t, id: d.id, room: d.room }); return; }
  if (ev === 'rare') { AWAY.ev.push({ k: 'rare', t, id: d.id, source: d.source }); return; }
  if (ev === 'pet') { AWAY.ev.push({ k: 'pet', t, id: d.id, name: d.name }); return; }
  if (ev === 'levelup') { AWAY.ev.push({ k: 'level', t, skill: d.skill, level: d.level }); return; }
  if (ev === 'schematic') { AWAY.ev.push({ k: 'schem', t, id: d }); return; }
  if (ev === 'mission') { if (d.why === 'done' || d.why === 'skip' || d.why === 'stopped') AWAY.ev.push({ k: 'mission', t, why: d.why, name: d.name, n: d.m.n, done: d.m.done || 0, reason: d.reason }); return; }
  if (ev === 'death') { if (!d.rank) AWAY.ev.push({ k: 'death', t, name: d.name }); return; }
  if (ev === 'card') { AWAY.ev.push({ k: 'card', t, id: d.id }); return; }
  if (ev === 'hunted') { AWAY.ev.push({ k: 'hunt', t, id: d.id, real: d.real }); return; }
  if (ev === 'expedition') AWAY.ev.push({ k: 'ship', t, id: d.id, hauls: d.hauls });
};

/* ---------------------------------------------------------------- allies */
// skill: the trade their gift comes from (its best task you can do) · perk: what their bond raises.
const ALLIES = {
  ren:    { skill: 'woodcutting', perk: 'speed', gift: 'logs from his own axe' },
  kaede:  { skill: null, perk: 'dmg', gift: 'technique fragments', tech: true },
  mira:   { skill: 'voyaging', perk: 'speed', gift: 'a ship\'s haul', voyage: true },
  bart:   { skill: 'cooking', perk: 'speed', gift: 'dishes from the galley' },
  kuro:   { skill: 'mining', perk: 'speed', gift: 'ore from the drowned seams' },
  tetsu:  { skill: 'smithing', perk: 'speed', gift: 'ingots from his forge' },
  kai:    { skill: 'gravity', perk: 'speed', gift: 'a gravity session' },
  yuki:   { skill: 'exorcism', perk: 'speed', gift: 'cursed materials' },
  nett:   { skill: 'tracking', perk: 'speed', gift: 'spoils of a hunt' },
  selene: { skill: 'archaeology', perk: 'speed', gift: 'finds from her dig' },
};
const ALLY_MAX = 5, ALLY_MIN = 15;
const alliesState = () => { if (!S.allies || typeof S.allies !== 'object') S.allies = {}; if (!S.allies.bond) S.allies.bond = {}; return S.allies; };
const allyBond = (id) => (S.allies && S.allies.bond && S.allies.bond[id]) || 0;
// An ally can visit once you have met them in the story (their chapter has begun).
function alliesMet() {
  const out = [];
  if (typeof CHAPTERS === 'undefined') return out;
  for (const ch of CHAPTERS) {
    if (S.goal < ch.from || (ch.realm !== 'rift' && !realmOpen(ch.realm))) continue;
    for (const id of ch.cast) if (ALLIES[id] && (!ALLIES[id].skill || SKILLS[ALLIES[id].skill])) out.push(id);
  }
  return out;
}
const alliesOn = () => isUnlocked('feature:allies');
function allyPerkText(id, n) {
  const A = ALLIES[id], v = 2 * (n == null ? allyBond(id) : n);
  return A.perk === 'dmg' ? `+${v}% damage` : `+${v}% ${SKILLS[A.skill].name} speed`;
}
hook('speed', (skill) => {
  if (!S.allies || !S.allies.bond) return 1;
  let m = 1;
  for (const id in S.allies.bond) if (ALLIES[id] && ALLIES[id].perk === 'speed' && ALLIES[id].skill === skill) m *= 1 + 0.02 * S.allies.bond[id];
  return m;
});
hook('dmg', () => 1 + 0.02 * allyBond('kaede'));

// The best task of a skill you can run right now (a gift is that task done without materials).
function allyTask(skill) {
  if (!SKILLS[skill] || !skillOpen(skill)) return null;
  let best = null;
  for (const a of SKILLS[skill].actions) if (skillLv(skill) >= a.level && !(a.schem && !S.known[a.schem]) && (!best || a.level > best.level)) best = a;
  return best;
}
// One visit: returns { id, gains: {item: n}, gold, xp, bond, sworn }.
function allyVisit(id) {
  const A = ALLIES[id], st = alliesState();
  const sworn = allyBond(id) >= ALLY_MAX, mult = sworn ? 2 : 1;
  const res = { id, gains: {}, gold: 0, xp: 0, skill: A.skill, frag: null };
  if (A.tech) {
    const known = typeof TECHNIQUES !== 'undefined' ? Object.keys(S.tech.lv).filter((t) => TECHNIQUES[t]) : [];
    if (known.length) { const t = pick(known); const n = 4 * mult; S.tech.frag[t] = (S.tech.frag[t] || 0) + n; res.frag = { id: t, n }; }
    else { res.gold = Math.round(250 * (1 + charLv() / 5)) * mult; S.gold += res.gold; }
  } else if (A.voyage) {
    const a = allyTask('voyaging');
    if (a && a.loot) for (let i = 0; i < 6 * mult; i++) res.gold += rollLoot(a.loot, 1, res.gains);
    else { res.gold = Math.round(300 * (1 + charLv() / 5)) * mult; S.gold += res.gold; }
  } else {
    const a = allyTask(A.skill);
    if (a) {
      const n = Math.max(1, Math.round((ALLY_MIN * 60 / actionTime(A.skill, a)) * mult));
      for (const k in a.out || {}) { const q = a.out[k] * n; addItem(k, q); res.gains[k] = (res.gains[k] || 0) + q; }
      res.xp = a.xp * n * 0.5;
      addXp(A.skill, res.xp);
      res.xp *= skillXpMult(A.skill);
    } else { res.gold = Math.round(300 * (1 + charLv() / 5)) * mult; S.gold += res.gold; }
  }
  st.bond[id] = Math.min(ALLY_MAX, allyBond(id) + 1);
  res.bond = st.bond[id];
  res.sworn = sworn;
  st.visits = (st.visits || 0) + 1;
  return res;
}
const visitsFor = (secs) => (secs < 3600 ? 0 : secs < 3 * 3600 ? 1 : secs < 7 * 3600 ? 2 : 3);
// Called once when you come back. Picks who visits (allies you are less close to come more often).
function allyVisits(secs) {
  if (!alliesOn()) return [];
  const met = [...new Set(alliesMet())], out = [];
  for (let i = 0; i < visitsFor(secs) && met.length; i++) {
    const pool = met.filter((id) => !out.some((v) => v.id === id));
    if (!pool.length) break;
    const id = rollWeighted(pool.map((x) => [x, ALLY_MAX + 1 - Math.min(ALLY_MAX, allyBond(x))]));
    out.push(allyVisit(id));
  }
  return out;
}
// The end of an absence: the log, plus the visits (applied now, so they count in the haul).
function awayEnd(secs) {
  const rec = AWAY || { t: 0, ev: [], since: Date.now() - secs * 1000 };
  AWAY = null;
  rec.secs = secs;
  rec.visits = allyVisits(secs);
  rec.friends = typeof friendVisits === 'function' ? friendVisits(secs) : [];
  return rec;
}
