'use strict';
/* ==========================================================================
   ANIME IDLE RPG — the Scouter (Dragon Ball), DOM-free
   Reads a stage's foes, then plays the fight out with the real engine on a copy of
   your save (nothing of yours changes): win chance, the move that brings you down,
   and up to two fixes taken from what you own, each one checked the same way.
   - Unlocked by your first defeat once Orange Town is open (a Scouter falls out of
     the cracked sky). A stage can be scanned once you have fought there.
   - Boss stage: a trial is won when the guardian falls. Other stages: 8 kills in a row.
   - Fixes: better battle food, armour / accessory, a weapon awakened to the foe's
     weakness, a defensive technique, an attack technique of the weak element.
   Loaded after huntlist.js (before guide.js: the balance bot loads it too).
   ========================================================================== */

const scoutOn = () => isUnlocked('feature:scouter');
function scoutState() {
  if (!S.scout || typeof S.scout !== 'object') S.scout = {};
  if (!S.scout.lost) S.scout.lost = {};
  return S.scout;
}
const scoutSeen = (zi) => { const z = ZONES[zi]; return !!z && zoneUnlocked(zi) && ((S.combat.kills[z.id] || 0) > 0 || !!(S.scout && S.scout.lost && S.scout.lost[z.id])); };
// Remember where you lost (the event also feeds the away log through report.js).
{
  const prev = EMIT_TAP;
  EMIT_TAP = (ev, d) => {
    if (ev === 'death' && d && !d.rank && S && S.combat.zone != null && ZONES[S.combat.zone]) {
      const z = ZONES[S.combat.zone], st = scoutState();
      st.lost[z.id] = (st.lost[z.id] || 0) + 1;
      st.last = z.id;
    }
    if (prev) prev(ev, d);
  };
}
// Power level (flavour, the Scouter's readout): damage per second × survivability.
const powerLevel = () => Math.round((pMaxHit() * 0.75 / pSpeed()) * Math.sqrt(pMaxHp() / mitig(pDef())));
function foePowerLevel(zi) {
  const es = ZONES[zi].enemies.map((_, i) => enemyAt(zi, i));
  return Math.round(Math.max(...es.map((e) => (e.atk * 0.75 / e.spd) * Math.sqrt(e.hp / mitig(e.def))) ));
}

/* ---------------------------------------------------------------- fixes */
const SCOUT_SLOTS = ARMOR_SLOTS;   // gear.js
const gearScore = (id) => { const s = ITEMS[id].stats || {}; return (s.def || 0) * 2 + (s.hp || 0) / 4 + (s.atk || 0) * 1.5 + (s.spd || 0) * 3 + (s.luck || 0); };
const zoneWeak = (zi) => { const K = typeof kitOf === 'function' ? kitOf(ZONES[zi].enemies[ZONES[zi].enemies.length - 1]) : null; return K && K.weak ? K.weak : null; };
// Candidate changes, as functions that work on whatever S is (the copy, or your save when applied).
function scoutFixes(zi) {
  const out = [], weak = zoneWeak(zi);
  const foods = Object.keys(S.items).filter((k) => ITEMS[k] && ITEMS[k].type === 'food' && ITEMS[k].heal && count(k) >= 5).sort((a, b) => foodHeal(b) - foodHeal(a));
  if (foods.length && foods[0] !== S.combat.food) {
    const f = foods[0];
    out.push({ key: 'food:' + f, kind: 'food', id: f, label: `Eat ${ITEMS[f].name}`, sub: `heals ${fmt(foodHeal(f))} HP`, apply: () => { S.combat.food = f; } });
  }
  for (const slot of SCOUT_SLOTS) {
    const cur = S.equip[slot], best = Object.keys(S.items).filter((k) => ITEMS[k] && ITEMS[k].type === 'equip' && ITEMS[k].slot === slot && count(k) > 0).sort((a, b) => gearScore(b) - gearScore(a))[0];
    if (best && (!cur || gearScore(best) > gearScore(cur))) out.push({ key: 'equip:' + best, kind: 'item', id: best, label: `Wear ${ITEMS[best].name}`, sub: SLOT_INFO[slot].name.toLowerCase(), apply: () => { equip(best); } });
  }
  if (weak && typeof armEl === 'function' && S.arms) {
    const w = S.arms.filter((a) => a.u !== S.equipU && armEl(a) === weak).sort((a, b) => armAtk(b) - armAtk(a))[0];
    if (w) out.push({ key: 'arm:' + w.u, kind: 'item', id: w.id, label: `Wield your ${ITEMS[w.id].name}`, sub: `awakened to ${weak}: its weakness`, apply: () => { equipArm(w.u); } });
  }
  if (typeof TECH_SLOTS !== 'undefined' && techOn()) {
    // Where a suggested technique goes: a free slot, else the slot of your weakest technique of another kind.
    const slotFor = (keep) => { const f = freeSlot('active'); if (f) return f.i;
      const c = equipped().filter((x) => techKind(x) === 'active' && TECHNIQUES[x].cat !== keep).sort((x, y) => techLv(x) - techLv(y))[0]; return c ? slotOf(c) : -1; };
    const eq = equipped();
    if (!eq.some((x) => TECHNIQUES[x].cat === 'defense')) {
      const t = Object.keys(S.tech.lv).filter((x) => TECHNIQUES[x] && TECHNIQUES[x].cat === 'defense').sort((x, y) => techLv(y) - techLv(x))[0], i = t ? slotFor('defense') : -1;
      if (i >= 0) out.push({ key: `tech:${i}:${t}`, kind: 'tech', id: t, label: `${TECHNIQUES[t].name} in slot ${i + 1}`, sub: 'a defense: fires before a big blow', apply: () => { equipTech(i, t); } });
    }
    if (weak && !eq.some((x) => TECHNIQUES[x].tags.includes(weak))) {
      const t = Object.keys(S.tech.lv).filter((x) => TECHNIQUES[x] && TECHNIQUES[x].cat === 'attack' && TECHNIQUES[x].tags.includes(weak) && !isEquipped(x)).sort((x, y) => techLv(y) - techLv(x))[0];
      const i = t ? slotFor('defense') : -1;
      if (i >= 0) out.push({ key: `tech:${i}:${t}`, kind: 'tech', id: t, label: `${TECHNIQUES[t].name} in slot ${i + 1}`, sub: `${weak}: its weakness`, apply: () => { equipTech(i, t); } });
    }
  }
  return out;
}

/* ---------------------------------------------------------------- the simulation */
// A trial lasts until someone falls (a fighter still standing at the time limit counts as a win: idle fights go on).
const scoutLimit = (zi) => Math.min(1800, Math.max(300, 4 * timeToKill(enemyAt(zi, ZONES[zi].enemies.length - 1)) * (ZONES[zi].boss ? 1 : 8)));
// Runs n trials on a copy of the save. fix (optional) is applied to the copy first.
// Returns { n, wins, causes: {move: count}, bossLeft: [..], secs: [..] }.
function scoutTrials(zi, n, fix) {
  const saved = S, savedRT = JSON.stringify(RT), savedAway = typeof AWAY !== 'undefined' ? AWAY : null, savedTap = EMIT_TAP, savedSim = SIM;
  const base = JSON.stringify(S), z = ZONES[zi], res = { n: 0, wins: 0, slow: 0, causes: {}, bossLeft: [], secs: [] }, limit = scoutLimit(zi);
  let move = '', hurt = [], clock = 0;
  try {
    SIM = true;
    if (typeof AWAY !== 'undefined') AWAY = null;
    EMIT_TAP = (ev, d) => {
      if (ev === 'foemove' && d && d.m) move = d.m.name;
      else if (ev === 'hit' && d && d.target === 'player' && d.dmg) hurt.push([clock, d.dmg, d.dot ? `${d.dot} damage` : RT.foeMult && RT.foeMult !== 1 ? move : 'basic attacks']);
    };
    for (let t = 0; t < n; t++) {
      S = JSON.parse(base);
      const rt = JSON.parse(savedRT);
      for (const k in RT) delete RT[k];
      Object.assign(RT, rt, { st: { p: {}, e: {} } });
      if (fix) fix.apply();
      const C = S.combat;
      S.action = null; S.exped.ships = []; if (S.missions) { S.missions.list = []; S.missions.cur = null; }
      C.zone = null; C.enemy = null; C.hp = pMaxHp();
      startCombat(zi);
      const k0 = C.kills[z.id] || 0, need = z.boss ? 1 : 8;
      move = ''; hurt = []; clock = 0;
      let won = false, lastFoe = 1;
      while (clock < limit) {
        step(1); clock += 1;
        if (C.enemy != null) { const e = curEnemy(); if (e) lastFoe = Math.max(0, C.eHp / e.hp); }
        if ((C.kills[z.id] || 0) - k0 >= need) { won = true; break; }
        if (C.zone == null) break;
      }
      res.n++;
      if (!won && C.zone != null) { won = true; res.slow++; }
      if (won) { res.wins++; res.secs.push(clock); continue; }
      let cause = 'basic attacks';
      {
        const tally = {};
        for (const [at, dmg, what] of hurt) if (at >= clock - 8) tally[what] = (tally[what] || 0) + dmg;
        cause = Object.keys(tally).sort((a, b) => tally[b] - tally[a])[0] || 'basic attacks';
        if (z.boss) res.bossLeft.push(lastFoe);
      }
      res.causes[cause] = (res.causes[cause] || 0) + 1;
    }
  } finally {
    S = saved;
    for (const k in RT) delete RT[k];
    Object.assign(RT, JSON.parse(savedRT));
    if (typeof AWAY !== 'undefined') AWAY = savedAway;
    EMIT_TAP = savedTap; SIM = savedSim;
  }
  return res;
}
function scoutMerge(a, b) {
  if (!a) return b;
  a.n += b.n; a.wins += b.wins; a.slow += b.slow;
  for (const k in b.causes) a.causes[k] = (a.causes[k] || 0) + b.causes[k];
  a.bossLeft.push(...b.bossLeft); a.secs.push(...b.secs);
  return a;
}
const scoutPct = (r) => (r && r.n ? r.wins / r.n : 0);
function scoutCause(r) {
  const k = Object.keys(r.causes).sort((a, b) => r.causes[b] - r.causes[a])[0];
  if (!k) return null;
  const left = r.bossLeft.length ? r.bossLeft.reduce((a, b) => a + b, 0) / r.bossLeft.length : null;
  return { what: k, share: r.causes[k] / Math.max(1, r.n - r.wins), left };
}
