'use strict';
/* ==========================================================================
   Macro loop: jump from event to event.
   Each turn: housekeeping (claim, gates, spend), plan() a task, turn it into per-second rates
   (task + background ships and crops), find the first limiting event and jump straight to it:
     - the goal is reached (items made, kills, a gate offering, a key drop at its p50 / p90 time)
     - a skill levels up (rates change), an input or the food runs out, the HP deficit drops you
     - a session starts or ends, or the re-plan cap.
   Player model (OPT.sessions): 2-3 one-hour sessions a day; between them the game is closed, so it runs
   at REST_PACE (offline catch-up, up to BASE_OFFLINE_HOURS), only ONE action can run (no gather + craft
   chain) and nothing is re-planned: the task chosen at the end of the session (planOffline: one that
   lasts the whole gap, the night included) runs until the next session or until it stops on its own.
   Then every gain and cost is applied at once (O(1) per jump) and the clock moves to t + dt.
   Output (simRun): milestones, time per activity, bottlenecks, recipe profitability.
   ========================================================================== */

const MAC = { ref: {}, foodEaten: 0, goldBy: {}, spent: 0, walls: {}, projects: {}, trace: [], offLog: [], activeT: 0, offT: 0, offIdle: 0, offStopped: 0, offStart: 0, offTask: null, shipDur: 3600, t: 0, it: 0, split: {}, goalAt: {}, events: [], wants: {}, stockouts: {}, deaths: [], skipped: [], stuck: {},
  foodT: 0, fightT: 0, recipes: {}, equipBuf: {}, levels: [], night: false, lastGoal: -1, lastGoalT: 0 };
const Q = { 50: 0.6931, 90: 2.3026 };   // −ln(1 − q): the p50 / p90 waiting time of one Poisson arrival, × 1/λ
const Z = { 50: 0, 90: 1.2816 };
// Time (in units of 1/λ) until n arrivals at quantile q: exact for one, normal approximation above.
const arrivals = (n, lam, q) => (n <= 1 ? Q[q] / lam : (n + Z[q] * Math.sqrt(n)) / lam);

const HK = {
  event(name) { MAC.events.push([+(MAC.t / 3600).toFixed(2), name]); },
  want(name, cost) { const w = MAC.wants[name] || (MAC.wants[name] = { since: MAC.t, cost, hours: 0, seen: 0 }); w.cost = cost; w.seen = MAC.t; },
};
function wantsSettle() {
  for (const k in MAC.wants) { const w = MAC.wants[k]; if (w.seen < MAC.t) { w.hours += (w.seen - w.since) / 3600; w.done = true; } }
}

/* ------------------------------------------------------------ rates of a task */
function mergeRates(into, r, k) {
  k = k == null ? 1 : k;
  for (const f of ['out', 'inp', 'made', 'kills']) for (const id in r[f] || {}) into[f][id] = (into[f][id] || 0) + r[f][id] * k;
  for (const s in r.xp || {}) into.xp[s] = (into.xp[s] || 0) + r.xp[s] * k;
  into.gold += (r.gold || 0) * k;
  into.voyages += (r.voyages || 0) * k; into.harvests += (r.harvests || 0) * k;
  into.wxp += (r.wxp || 0) * k; into.seasoned += (r.seasoned || 0) * k;
  for (const w in r.renown || {}) into.renown[w] = (into.renown[w] || 0) + r.renown[w] * k;
}
const emptyRates = () => ({ out: {}, inp: {}, made: {}, kills: {}, xp: {}, renown: {}, wxp: 0, seasoned: 0, gold: 0, voyages: 0, harvests: 0, actions: 0, key: null, special: null, label: 'idle' });
function taskRates(t, single) {
  const R = emptyRates();
  if (!t || t.kind === 'wait') { R.label = t ? 'wait (' + t.why + ')' : 'idle (nothing to do)'; }
  else if (t.kind === 'act') {
    const a = findAction(t.skill, t.id);
    if (S.combat.zone != null) stopCombat();
    S.action = { skill: t.skill, id: t.id, prog: 0 };
    const r = (a.in && !single && chainRates(t.skill, a, 0, true)) || actRates(t.skill, a);
    mergeRates(R, r); R.actions = r.actions; R.mkey = r.key; R.label = t.skill; R.act = a; R.skill = t.skill;
    R.parts = r.parts || [[t.skill, 1]];
    if (t.special) { const out = Object.keys(a.out || {})[0]; R.special = { skill: t.skill, act: a, out, kind: t.special, lam: qChance(t.skill, a) / r.T }; }
    // one-shot actions whose result lives in an engine hook: a capture (chance per try), an Echo, a museum piece
    const o0 = a.out && Object.keys(a.out)[0];
    if (a.beast && !S.beasts[a.beast]) R.oneShot = { kind: 'beast', p: Math.min(1, captureChance(a) * luckMult()), T: r.T, act: a };
    else if (t.skill === 'bonding' && a.id === 'awaken') R.oneShot = { kind: 'echo', p: 1, T: r.T, act: a };
    else if (o0 && typeof ARTIFACTS !== 'undefined' && ARTIFACTS[o0] && !S.museum[o0]) R.oneShot = { kind: 'artifact', p: 1, T: r.T, act: a, out: o0 };
  } else if (t.kind === 'fight') {
    S.action = null; S.combat.zone = t.zi; P.lastZone = t.zi;
    const f = ownedFood(); if (f) S.combat.food = f;
    const r = fightRates(t.zi);
    mergeRates(R, r); R.fight = r; R.label = 'combat'; R.zi = t.zi;
    for (const id in r.schem) R.schem = Object.assign(R.schem || {}, { [id]: r.schem[id] });
  } else if (t.kind === 'dungeon') {
    S.action = null;
    const d = dungeonRates(t.id), per = 1 / d.t, z = ZONES[DG_BY[t.id].zi];
    let xp = 0; for (let i = 0; i < Math.min(DG_ROOMS, z.enemies.length); i++) xp += enemyAt(DG_BY[t.id].zi, i).xp;
    R.xp.character = xp * skillXpMult('character') * per;
    R.inp[dgKey(t.id)] = per; if (d.food && d.eat) R.inp[d.food] = d.eat * per;
    R.kills[z.id] = DG_ROOMS * per;
    R.dungeon = { id: t.id, per }; R.label = 'dungeon';
  }
  // the key drop: hunted to its quantile time, not added as fractions
  if (t && t.key) {
    const k = t.key, lam = k.fruit ? FRUITS.reduce((a, f) => a + (R.out[f] || 0), 0) : k.schem ? (R.schem || {})[k.id] || 0 : R.out[k.id] || 0;
    if (lam > 0) {
      const need = k.schem || k.fruit ? 1 : Math.max(1, Math.ceil(k.n - stock(k.id)));
      R.key = { id: k.id, need, lam, schem: !!k.schem, fruit: !!k.fruit };
      if (k.fruit) for (const f of FRUITS) delete R.out[f]; else delete R.out[k.id];
    }
  }
  R.want = t && t.want;
  return R;
}
// ships and crops change with levels and seeds, not every jump: cached per stat epoch and night/day
const BG = { k: null, ships: null, farm: null };
function backgroundRates(R) {
  // keyed on what changes ships and crops: Voyaging / Farming levels, the trip length, worlds (not every jump)
  const dur = MAC.shipDur || 3600, k = skillLv('voyaging') + '|' + skillLv('farming') + '|' + dur + '|' + Object.keys(S.gates).length + '|' + Math.floor(MAC.t / 21600);
  if (BG.k !== k) { BG.k = k; BG.ships = shipRates(dur); BG.farm = farmRates(); }
  mergeRates(R, BG.ships);
  mergeRates(R, BG.farm);
}

/* ------------------------------------------------------------ events */
const LV_MATTERS = {};
for (const k in SKILLS) {
  const m = LV_MATTERS[k] = new Set([EARLY_LV]);
  for (const a of SKILLS[k].actions || []) m.add(a.level);
  for (const p of SKILL_PERKS[k] || []) m.add(p.lv);
  for (const x of MILESTONES || []) m.add(x.lv);
  if (k === 'farming') for (const c of CROPS) m.add(c.level);
}
// skills with a recipe at nearly every level (Crafting) re-plan every third level only
const DENSE = new Set(Object.keys(SKILLS).filter((k) => (SKILLS[k].actions || []).length > 40));
const levelMatters = (s, L) => LV_MATTERS[s] && LV_MATTERS[s].has(L) && (!DENSE.has(s) || L % 3 === 0 || (SKILL_PERKS[s] || []).some((p) => p.lv === L));
// Character levels that open something (technique slots 8 / 20, unlock thresholds)
const UNLOCK_LV = new Set([8, 20]);
for (const u of UNLOCKS) { const m = /charLv\(\)\s*>=\s*(\d+)|skillLv\('character'\)\s*>=\s*(\d+)/.exec(String(u.need)); if (m) UNLOCK_LV.add(+(m[1] || m[2])); }
const XPCAP = () => XP_TABLE[EARLY_LV];
// XP rate as counted by the bar (the onboarding ×1.5 below level 5)
const effXp = (s, rate) => rate * (S.skills[s].xp < XPCAP() ? EARLY_XP : 1);
function nextEvent(R, task, pace) {
  const ev = [];
  const push = (dtSim, why) => { if (dtSim > 0 && isFinite(dtSim)) ev.push([dtSim / pace, why]); };
  // a level is an event only when it changes something: your fighting power (Character), a new action,
  // a perk or milestone, or the level the step asks for (several plain levels are crossed in one jump)
  const st0 = goalState(), I0 = st0 ? introspect(st0.g) : {};
  for (const s in R.xp) if (R.xp[s] > 0 && S.skills[s]) {
    const L = skillLv(s);
    let to = L + 1;
    if (s !== 'character') while (to < L + 60 && XP_TABLE[to + 1] != null && !levelMatters(s, to) && !(I0.lvl === s && to >= st0.g.n)) to++;
    else while (to < L + 3 && XP_TABLE[to + 1] != null && !(I0.lvl === s && to >= st0.g.n) && !(s === 'character' && UNLOCK_LV.has(to))) to++;   // Character: every 3 levels
    if (XP_TABLE[to] != null) push((XP_TABLE[to] - S.skills[s].xp) / effXp(s, R.xp[s]), 'level ' + s);
  }
  const net = {};
  for (const k in R.out) net[k] = (net[k] || 0) + R.out[k];
  for (const k in R.inp) net[k] = (net[k] || 0) - R.inp[k];
  for (const k in net) if (net[k] < -1e-12 && (!R.taskInp || R.taskInp[k])) push(Math.max(0, count(k)) / -net[k], 'out of ' + k);
  if (R.want && net[R.want.id] > 0 && !R.key) push((R.want.n - stock(R.want.id)) / net[R.want.id], 'want ' + R.want.id);
  if (R.key) push(arrivals(R.key.need, R.key.lam, OPT.q), 'key ' + R.key.id);
  if (R.special) push(Q[OPT.q] / R.special.lam, 'special ' + R.special.kind);
  if (R.oneShot) { const p = R.oneShot.p; push((p >= 1 ? 1 : Math.max(1, Math.ceil(Math.log(1 - OPT.q / 100) / Math.log(1 - p)))) * R.oneShot.T, 'oneshot ' + R.oneShot.kind); }
  if (R.fight && !R.fight.food && R.fight.deathT < Infinity) push(R.fight.deathT, 'death');
  // the goal itself
  const st = goalState();
  if (st) {
    const g = st.g, rem = g.n - st.cur, I = introspect(g);
    if (I.made && R.made[I.made] > 0) push(rem / R.made[I.made], 'goal');
    if (I.kills && R.kills[I.kills] > 0) push(rem / R.kills[I.kills], 'goal');
    if (I.gate) { const gs = gateState(I.gate); for (const k in gs.g.offer) if (net[k] > 0 && stock(k) < gs.g.offer[k]) push((gs.g.offer[k] - stock(k)) / net[k], 'gate offer'); }
    if (R.dungeon && /^dg_/.test(g.id)) push(1 / R.dungeon.per, 'dungeon clear');
  }
  // the end of the session, and the re-plan cap
  if (OPT.sessions) ev.push([sched().toNext, 'session end']);
  ev.push([OPT.cap, 'replan']);
  // ties (an input that runs out on the very action that completes the step): the step wins
  const rank = (w) => (/^(oneshot|goal|key|special|want|gate|dungeon)/.test(w) ? 0 : /^out of/.test(w) ? 2 : 1);
  ev.sort((a, b) => (Math.abs(a[0] - b[0]) <= 1e-6 * Math.max(1, a[0]) ? rank(a[1]) - rank(b[1]) : a[0] - b[0]));
  const e = ev[0];
  return [Math.max(OPT.minDt, e[0]), e[1]];
}

/* ------------------------------------------------------------ applying a jump */
function giveItem(id, n) {
  if (n <= 0) return;
  const it = ITEMS[id];
  if (it && it.type === 'tool') {             // a tool is used at once (systems.js 'action' hook)
    const b = (MAC.equipBuf[id] || 0) + n;
    MAC.equipBuf[id] = b >= 1 - 1e-6 ? 0 : b;
    if (b >= 1 - 1e-6 && it.tier > toolTier(it.toolFor)) { S.tools[it.toolFor] = it.tier; HK.event('tool ' + id); }
    return;
  }
  if (it && it.type === 'equip') {            // gear comes whole (weapons are copies)
    const b = (MAC.equipBuf[id] || 0) + n, whole = Math.floor(b + 1e-6);
    MAC.equipBuf[id] = Math.max(0, b - whole);
    if (whole > 0) addItem(id, whole);
    return;
  }
  addItem(id, n);
}
function gainXp(s, amt) {
  const x = S.skills[s].xp, cap = XPCAP();
  let g = amt;
  if (x < cap) g = Math.min(amt * EARLY_XP, cap - x) + Math.max(0, amt - (cap - x) / EARLY_XP);
  const before = skillLv(s);
  S.skills[s].xp += g;
  if (skillLv(s) > before) { MAC.levels.push([+(MAC.t / 3600).toFixed(2), s, skillLv(s)]); emit('levelup', { skill: s, level: skillLv(s) }); }
}
function applyJump(R, dtSim) {
  for (const s in R.xp) gainXp(s, R.xp[s] * dtSim);
  for (const k in R.inp) { const n = Math.min(count(k), R.inp[k] * dtSim); if (n > 0) removeItem(k, n); }
  for (const k in R.out) giveItem(k, R.out[k] * dtSim);
  for (const k in R.made) S.stats.made[k] = (S.stats.made[k] || 0) + R.made[k] * dtSim;
  for (const z in R.kills) S.combat.kills[z] = (S.combat.kills[z] || 0) + R.kills[z] * dtSim;
  if (R.fight) S.stats.kills += R.fight.kps * dtSim;
  S.gold += R.gold * dtSim;
  const gk = R.fight ? 'foes' : R.dungeon ? 'dungeons' : 'other';
  const shipG = (BG.ships && BG.ships.gold) || 0;
  MAC.goldBy[gk] = (MAC.goldBy[gk] || 0) + (R.gold - shipG) * dtSim;
  MAC.goldBy.voyages = (MAC.goldBy.voyages || 0) + shipG * dtSim;
  S.stats.voyages += R.voyages * dtSim; S.stats.harvests = (S.stats.harvests || 0) + R.harvests * dtSim;
  if (R.mkey) { S.mastery[R.mkey] = (S.mastery[R.mkey] || 0) + R.actions * dtSim; S.stats.actions += R.actions * dtSim; }
  if (R.dungeon) {
    const st = dgState(R.dungeon.id), before = st.clears, n = R.dungeon.per * dtSim;
    st.clears += n; st.runs += n; S.stats.dungeons = (S.stats.dungeons || 0) + n;
    giveItem(dgChest(R.dungeon.id), n);
    const pieces = (before < 1 && st.clears >= 1 ? 1 : 0) + Math.max(0, st.clears - Math.max(1, before)) / (1 / Math.max(DG_PIECE * luckMult(), 1 / (DG_PITY + 1)));
    const miss = dgPieces(R.dungeon.id).filter((p) => !S.found[p]);
    if (pieces > 0) giveItem(miss[0] || dgPieces(R.dungeon.id)[0], pieces);
  }
  // what the engine's hooks would have done along the way
  for (const w in R.renown) addRenown(w, R.renown[w] * dtSim);
  if (R.harvests) addRenown('ki', 5 * R.harvests * dtSim);
  if (R.wxp) { const a = curArm(); if (a) a.xp = Math.min(armXpAt(ARM_MAX), a.xp + R.wxp * dtSim); }
  if (R.seasoned) S.stats.seasoned = (S.stats.seasoned || 0) + R.seasoned * dtSim;
  if (R.fight && S.ki.form && FORM_BY[S.ki.form] && formOpen(FORM_BY[S.ki.form])) {   // stamina cycles: on at 60%, drains, refills at 3/s
    const f = FORM_BY[S.ki.form], m = staminaMax() * 0.6;
    S.stats.transforms = (S.stats.transforms || 0) + dtSim / (m / f.drain + m / 3);
  }
  if (typeof chamberOn === 'function' && chamberOn()) {
    const C = S.chamber;
    if (!C.given) { C.given = 1; C.store = Math.min(chamberCap(), C.store + 3600); }
    if (R.act && C.store > 0) { const use = Math.min(dtSim, C.store); C.store -= use; S.stats.chamberTime = (S.stats.chamberTime || 0) + use; }
  }
  S.stats.playtime += dtSim;
  if (pactsOn() && S.pacts.active.length) S.stats.pactTime = (S.stats.pactTime || 0) + dtSim;
  tickEnergy(dtSim);
  S.combat.hp = pMaxHp();
}
function applyKey(R) {
  const k = R.key;
  if (k.schem) { if (!S.known[k.id]) learnSchematic(k.id); }
  else if (k.fruit) addItem(FRUITS[0], 1);
  else addItem(k.id, k.need);
  HK.event('drop ' + k.id + ' (p' + OPT.q + ')');
}
function applySpecial(R) {
  const s = R.special, q = s.kind === 'shiny' ? 's' : 'p', vid = variantId(s.out, q);
  addItem(vid, 1); logQuality(s.skill, s.out, q, 1, vid);
  HK.event(s.kind + ' ' + s.out + ' (p' + OPT.q + ')');
}

function applyOneShot(R) {
  const o = R.oneShot;
  if (o.kind === 'beast') { S.beasts[o.act.beast] = { xp: 0 }; if (companions().length < compSlots()) S.companions = companions().concat(o.act.beast); HK.event('tamed ' + o.act.beast + ' (p' + OPT.q + ')'); }
  else if (o.kind === 'artifact') { removeItem(o.out, count(o.out)); S.museum[o.out] = 1; HK.event('artifact ' + o.out); }
  else if (o.kind === 'echo') { __rng.strict = false; try { rollEcho(); } finally { __rng.strict = true; } HK.event('echo awakened (median roll)'); }
  if (S.action) S.action = null;
}

/* ------------------------------------------------------------ sessions */
// t = 0 is 08:00 on day 1. sched(): are you playing, and how long until the next boundary.
const hod = (t) => (OPT.dayStart + t / 3600) % 24;
function sched(t) {
  t = t == null ? MAC.t : t;
  if (!OPT.sessions) return { active: true, toNext: Infinity };
  const h = hod(t);
  for (const [a, b] of OPT.sessions) if (h >= a - 1e-9 && h < b - 1e-9) return { active: true, toNext: (b - h) * 3600 };
  const starts = OPT.sessions.map(([a]) => (a - h + 24) % 24 || 24);
  return { active: false, toNext: Math.min(...starts) * 3600 };
}
// How long a single action / fight can run on its own (real seconds, at the closed-game pace).
function lastsFor(t) {
  if (!t || t.kind === 'wait' || t.kind === 'dungeon') return 0;
  const R = taskRates(t, true);
  if (R.oneShot || (R.fight && !R.fight.safe)) return 0;
  let run = Infinity;
  for (const k in R.inp) if (R.inp[k] > 0) run = Math.min(run, count(k) / R.inp[k]);
  if (R.fight && !R.fight.food && R.fight.deathT < Infinity) run = Math.min(run, R.fight.deathT);
  return run / REST_PACE;
}
// The farm you set before closing the game: the step's own task if it can run alone for the whole gap,
// else the gathering behind it, else the best XP fight you can hold, else your best gathering.
function planOffline(gap) {
  const need = Math.min(gap, BASE_OFFLINE_HOURS * 3600) * 0.95, cands = [];
  const t0 = plan();
  if (t0 && t0.kind !== 'dungeon') cands.push(t0);
  if (t0 && t0.kind === 'act') {
    const a = findAction(t0.skill, t0.id);
    for (const k in a.in || {}) { const p = producerOf(k); if (p && !p.act.in) cands.push({ kind: 'act', skill: p.skill, id: p.act.id }); }
  }
  if (featureOpen('battle')) cands.push(fightTask(bestXpZone()));
  for (const k of [t0 && t0.skill, 'woodcutting', 'mining', 'fishing'].filter(Boolean)) if (SKILLS[k] && SKILLS[k].type === 'gather') { const t = trainTask(k); if (t) cands.push(t); }
  let best = null, bl = -1;
  for (const c of cands) { const l = lastsFor(c); if (l >= need) return c; if (l > bl) { bl = l; best = c; } }
  return best || { kind: 'wait', why: 'nothing lasts' };
}
const durFor = (gap) => { let d = 600; for (const [x] of EXP_DURS) if (x <= gap) d = x; return d; };
const taskName = (t) => (!t ? 'idle' : t.kind === 'act' ? t.skill + ':' + t.id : t.kind === 'fight' ? 'fight ' + ZONES[t.zi].id : t.kind === 'wait' ? 'wait (' + t.why + ')' : t.kind);
// Game closed: the chosen task runs alone at REST_PACE until the next session, the offline limit,
// or until it stops by itself (out of materials or food, a fight you cannot hold).
function offlineJump(SC) {
  const left = BASE_OFFLINE_HOURS * 3600 - (MAC.t - MAC.offStart);
  const task = left > 0 && MAC.offTask ? MAC.offTask : { kind: 'wait', why: left > 0 ? 'before the first session' : 'offline limit' };
  const R = taskRates(task, true);
  const tin = Object.assign({}, R.inp);
  backgroundRates(R);
  const ev = [[SC.toNext, 'session start']];
  if (left > 0 && task.kind !== 'wait') ev.push([left, 'offline limit']);
  // only the task's own inputs stop it (ships simply stay in port when the wood runs out)
  const net = {};
  for (const k in tin) net[k] = (R.out[k] || 0) - R.inp[k];
  for (const k in net) if (net[k] < -1e-12) ev.push([Math.max(0, count(k)) / -net[k] / REST_PACE, 'out of ' + k]);
  if (R.fight && !R.fight.food && R.fight.deathT < Infinity) ev.push([R.fight.deathT / REST_PACE, 'death']);
  if (R.key) ev.push([arrivals(R.key.need, R.key.lam, OPT.q) / REST_PACE, 'key ' + R.key.id]);
  ev.sort((a, b) => a[0] - b[0]);
  const dt = Math.max(OPT.minDt, ev[0][0]), why = ev[0][1];
  applyJump(R, dt * REST_PACE);
  if (why.startsWith('key ')) applyKey(R);
  if (/^(out of|death|offline limit)/.test(why)) { MAC.offTask = { kind: 'wait', why: 'stopped offline: ' + why }; MAC.offStopped++; }
  if (task.kind === 'wait') MAC.offIdle += dt;
  if (R.parts) for (const [k, f] of R.parts) MAC.split[k] = (MAC.split[k] || 0) + dt * f;
  else MAC.split[R.label] = (MAC.split[R.label] || 0) + dt;
  if (R.fight) MAC.fightT += dt;
  MAC.offT += dt;
  if (OPT.trace && MAC.t < OPT.trace * 3600) MAC.trace.push(`${(MAC.t / 3600).toFixed(2)}h OFFLINE ${taskName(task)} → ${why} (${(dt / 60).toFixed(1)} min) char ${charLv()}`);
  MAC.t += dt;
}

// The reference player of each stage: your stats at your first fight there (a guardian: when it opens,
// before any preparation), in your best gear for it. tools/sim/fit-curve.js sizes every stage against it.
function recordRefs(fightZi) {
  ZONES.forEach((z, zi) => {
    if (MAC.ref[z.id] || z.dungeon || !z.enemies.length || !zoneUnlocked(zi)) return;
    if (z.boss || zi !== fightZi) return;   // guardians: recorded when they become the step (walls)
    equipBest(zi);
    const techs = equipped().filter((id) => ['attack', 'ultimate'].includes(TECHNIQUES[id].cat));
    const e0 = enemyAt(zi, 0), f = foeEval(e0, techs), auto = 0.75 * pMaxHit() * mitig(e0.def * hmul('edef')) / pSpeed();
    MAC.ref[z.id] = { h: +(MAC.t / 3600).toFixed(2), lv: charLv(), maxHit: pMaxHit(), speed: pSpeed(), edef: hmul('edef'), tech: Math.max(1, f.dps / Math.max(1e-9, auto)),
      hp: pMaxHp(), def: pDef(), dodge: pDodge(), taken: hmul('taken'), eat: autoEatThreshold() * pMaxHp(), xm: skillXpMult('character'), gm: goldMult() };
  });
}

/* ------------------------------------------------------------ the run */
const statSig = () => { let sk = 0; for (const k in S.skills) sk += skillLv(k); let ren = 0; for (const r of WORLD_ORDER) ren += Math.floor(renownLv(r) / 5);
  return sk + '|' + totalTrain() + '|' + Math.floor(S.stats.actions / 400) + '|' + Object.keys(S.found).length + '|' + ren + '|' + S.arms.map((a) => Math.floor(Math.sqrt(a.xp) / 20) + '.' + a.ref + a.awk).join() + '|' + Math.floor(Math.log2(1 + S.bounty)); };
const hkSig = () => Object.keys(S.items).length + '|' + Object.values(S.tech.lv).reduce((a, b) => a + b, 0) + loadout().join() + '|' + (S.fruit || '') + fruitRank() + '|' + S.energy.capLv + S.energy.powLv
  + '|' + Object.values(S.shop).reduce((a, b) => a + b, 0) + '|' + Object.keys(S.gates).length + '|' + S.goal + '|' + (S.ki.form || '') + '|' + (S.companions || []).join();
const OPT = { maxH: 800, q: 50, sessions: [[8, 9], [13, 14], [20, 21]], dayStart: 8, cap: 7200, minDt: 1, stuckH: 72 };
function simRun(o) {
  Object.assign(OPT, o || {});
  newGame();
  S.ui.noTips = 1;
  __rng.strict = true; __rng.calls = 0;
  const T = OPT.maxH * 3600;
  while (MAC.t < T && MAC.it++ < 200000) {
    const SC = sched();
    MAC.night = !SC.active;
    SIMT = MAC.t;
    if (!SC.active) { offlineJump(SC); continue; }
    MAC.shipDur = 3600;
    // the stat caches are dropped only when something a stat reads has moved
    const ss = statSig();
    if (ss !== MAC.statSig) { MAC.statSig = ss; EPOCH++; }
    const hk0 = hkSig(), g0 = S.gold, gl0 = S.goal;
    housekeeping(HK);
    { const dg = S.gold - g0; if (dg < 0) MAC.spent -= dg; else if (S.goal > gl0) MAC.goldBy['quest rewards'] = (MAC.goldBy['quest rewards'] || 0) + dg; else MAC.goldBy['chests & misc'] = (MAC.goldBy['chests & misc'] || 0) + dg; }
    if (hkSig() !== hk0) EPOCH++;   // a purchase, a technique, a fruit, a gate: the stats moved
    recordRefs();
    if (S.goal >= GOALS.length - 1) break;
    if (OPT.stopAt && GOALS[S.goal].id === OPT.stopAt) break;
    if (S.goal !== MAC.lastGoal) {
      if (MAC.lastGoal >= 0) MAC.goalAt[MAC.lastGoal] = MAC.t;
      MAC.lastGoal = S.goal; MAC.lastGoalT = MAC.t;
    }
    const task = plan();
    // a step the model cannot play: skipped at once (and listed), so it does not eat the patience
    if (task && task.kind === 'unmodelled') { const g = GOALS[S.goal]; MAC.skipped.push({ goal: S.goal, id: g.id, text: g.text, h: +(MAC.t / 3600).toFixed(1), task: 'not modelled: ' + task.why }); MAC.goalAt[S.goal] = MAC.t; S.goal++; MAC.lastGoal = S.goal; MAC.lastGoalT = MAC.t; continue; }
    { const g = GOALS[S.goal], I = g && introspect(g); const z = I && I.kills && ZONES.find((x) => x.id === I.kills);
      if (z && z.boss) { let w = MAC.walls[z.id]; if (!w) { const zi = ZONES.indexOf(z); equipBest(zi); w = MAC.walls[z.id] = { start: MAC.t, prep: 0, fight: 0, lv0: charLv(), r0: zoneRatio(zi), b0: frate(zi).blow / eatLine() };
          if (!MAC.ref[z.id]) { const techs = equipped().filter((id) => ['attack', 'ultimate'].includes(TECHNIQUES[id].cat)), e0 = enemyAt(zi, 0), f = foeEval(e0, techs), auto = 0.75 * pMaxHit() * mitig(e0.def * hmul('edef')) / pSpeed();
            const W = worldGearEat(zi);
            MAC.ref[z.id] = { h: +(MAC.t / 3600).toFixed(2), lv: charLv(), maxHit: pMaxHit(), speed: pSpeed(), edef: hmul('edef'), tech: Math.max(1, f.dps / Math.max(1e-9, auto)), hp: pMaxHp(), def: pDef(), dodge: pDodge(), taken: hmul('taken'), eat: autoEatThreshold() * pMaxHp(), eatWith: W.eat, defWith: W.def, xm: skillXpMult('character'), gm: goldMult() }; } } MAC.curWall = w; } else MAC.curWall = null; }
    if (task && task.kind === 'fight') recordRefs(task.zi);
    const R = taskRates(task);
    R.taskInp = Object.assign({}, R.inp);
    backgroundRates(R);
    const pace = 1;
    const [dt, why] = nextEvent(R, task, pace);
    const dtSim = dt * pace;
    applyJump(R, dtSim);
    if (why.startsWith('key ')) applyKey(R);
    if (why.startsWith('special ')) applySpecial(R);
    if (why.startsWith('oneshot ')) applyOneShot(R);
    if (why === 'death') { MAC.deaths.push([+(MAC.t / 3600).toFixed(2), ZONES[R.zi].id]); P.fail[R.zi] = power(); }
    if (why.startsWith('out of ')) { const k = why.slice(7); MAC.stockouts[k] = (MAC.stockouts[k] || 0) + 1; }
    if (OPT.trace && MAC.t < OPT.trace * 3600) MAC.trace.push(`${(MAC.t / 3600).toFixed(2)}h g${S.goal} ${R.label}${task && task.kind === 'act' ? ':' + task.id : task && task.kind === 'fight' ? ':' + ZONES[task.zi].id : ''}${task && task.want ? ' want ' + task.want.id + ' ' + task.want.n : ''} → ${why} (${(dt / 60).toFixed(1)} min) char ${charLv()}`);
    if (R.parts) for (const [k, f] of R.parts) MAC.split[k] = (MAC.split[k] || 0) + dt * f;
    else MAC.split[R.label] = (MAC.split[R.label] || 0) + dt;
    if (R.fight) MAC.fightT += dt;
    MAC.activeT += dt;
    if (MAC.curWall) { if (task && task.kind === 'fight' && ZONES[task.zi].boss) MAC.curWall.fight += dt; else MAC.curWall.prep += dt; MAC.curWall.end = MAC.t + dt; MAC.curWall.lv1 = charLv(); }
    if (why === 'session end') {
      const gap = sched(MAC.t + dt + 1).toNext + 1;
      MAC.offTask = planOffline(gap); MAC.offStart = MAC.t + dt; MAC.shipDur = durFor(gap);
      MAC.offLog.push([+((MAC.t + dt) / 3600).toFixed(1), taskName(MAC.offTask), +(Math.min(99, lastsFor(MAC.offTask) / 3600)).toFixed(1), +(gap / 3600).toFixed(1)]);
    }
    if ((task && task.forFood) || (R.want && ITEMS[R.want.id] && ITEMS[R.want.id].type === 'food')) MAC.foodT += dt;
    if (R.fight && R.fight.foodPerS) MAC.foodEaten += R.fight.foodPerS * dt;
    if (R.act && R.act.in) { const rk = R.skill + ':' + R.act.id; MAC.recipes[rk] = (MAC.recipes[rk] || 0) + dt; }
    MAC.t += dt;
    // a goal that drags on: skipped and reported
    if (MAC.t - MAC.lastGoalT > OPT.stuckH * 3600) {
      const g = GOALS[S.goal];
      MAC.skipped.push({ goal: S.goal, id: g.id, text: g.text, h: +(MAC.t / 3600).toFixed(1), task: R.label + (task && task.want ? ' → ' + task.want.id : '') });
      // the step is forced so the rest of the path can be measured: a guardian counts as beaten (with its
      // sure drops), a gate opens
      const I = introspect(g), zi = I.kills ? ZONES.findIndex((z) => z.id === I.kills) : -1;
      if (zi >= 0) { S.combat.kills[I.kills] = Math.max(1, S.combat.kills[I.kills] || 0); for (const [d, ch, q] of ZONES[zi].enemies[0].drops) if (ch >= 0.5 && ITEMS[d]) addItem(d, q[1]); MAC.skipped[MAC.skipped.length - 1].forced = 'beaten (ratio ' + zoneRatio(zi).toFixed(2) + ')'; }
      if (I.gate) { S.gates[I.gate] = 1; MAC.skipped[MAC.skipped.length - 1].forced = 'gate opened'; }
      checkUnlocks();
      MAC.goalAt[S.goal] = MAC.t; S.goal++; MAC.lastGoal = S.goal; MAC.lastGoalT = MAC.t;
    }
  }
  MAC.goalAt[S.goal] = MAC.goalAt[S.goal] || MAC.t;
  wantsSettle();
  __rng.strict = false;
  return simReport();
}

/* ------------------------------------------------------------ report */
// Recipes in use: value made vs value used, and XP per hour once the gathering of the inputs is counted.
function recipeCheck() {
  const out = [];
  for (const rk in MAC.recipes) {
    const [skill, id] = rk.split(':'), a = findAction(skill, id);
    if (!a || !a.in) continue;
    const vin = Object.entries(a.in).reduce((t, [k, n]) => t + (ITEMS[k] ? ITEMS[k].value : 0) * n, 0);
    const vout = Object.entries(a.out || {}).reduce((t, [k, n]) => t + (ITEMS[k] ? ITEMS[k].value : 0) * n, 0);
    let gatherT = 0;
    for (const [k, n] of Object.entries(a.in)) { const p = (PROD[k] || []).find((x) => !x.act.in); gatherT += n * (p ? actionTime(p.skill, p.act) / p.q : 4); }
    const xph = a.xp * skillXpMult(skill) / (actionTime(skill, a) + gatherT) * 3600;
    const best = SKILLS[skill].actions.filter((x) => !x.in && skillLv(skill) >= x.level).map((x) => x.xp * skillXpMult(skill) / actionTime(skill, x) * 3600).sort((x, y) => y - x)[0] || 0;
    out.push({ recipe: rk, hours: +(MAC.recipes[rk] / 3600).toFixed(2), valueIn: Math.round(vin), valueOut: Math.round(vout), loss: vout < vin, xphAllIn: Math.round(xph), xphBestGather: Math.round(best) });
  }
  return out.sort((a, b) => b.hours - a.hours);
}
function simReport() {
  const H = (s) => +(s / 3600).toFixed(2);
  const milestones = Object.keys(MAC.goalAt).map(Number).sort((a, b) => a - b).filter((i) => GOALS[i]).map((i) => ({ i, id: GOALS[i].id, text: GOALS[i].text, h: H(MAC.goalAt[i]) }));
  const split = Object.entries(MAC.split).map(([k, v]) => [k, H(v)]).sort((a, b) => b[1] - a[1]);
  const wants = Object.entries(MAC.wants).map(([k, w]) => ({ what: k, cost: Math.round(w.cost), waitedH: +((w.done ? w.hours : (MAC.t - w.since) / 3600)).toFixed(1), bought: !!w.done })).sort((a, b) => b.waitedH - a.waitedH);
  const sk = Object.keys(S.skills).filter((k) => k !== 'character');
  return {
    hours: H(MAC.t), jumps: MAC.it, goal: S.goal, goals: GOALS.length, char: charLv(), avgSkill: +(sk.reduce((a, k) => a + skillLv(k), 0) / sk.length).toFixed(1),
    gold: Math.round(S.gold), bankItems: Math.round(Object.keys(S.items).reduce((a, k) => a + (ITEMS[k] && ITEMS[k].type !== 'equip' ? S.items[k] : 0), 0)),
    milestones, events: MAC.events, split, skipped: MAC.skipped, deaths: MAC.deaths, stockouts: MAC.stockouts, wants,
    food: { cookH: H((MAC.split.cooking || 0) + (MAC.split.fishing || 0)), foodH: H(MAC.foodT), fightH: H(MAC.fightT), ratio: MAC.fightT ? +(MAC.foodT / MAC.fightT).toFixed(3) : 0, eatenPerFightH: MAC.fightT ? Math.round(MAC.foodEaten / (MAC.fightT / 3600)) : 0 },
    ref: MAC.ref,
    goldBy: Object.fromEntries(Object.entries(MAC.goldBy).map(([k, v]) => [k, Math.round(v)])), goldSpent: Math.round(MAC.spent),
    walls: Object.fromEntries(Object.entries(MAC.walls).map(([k, w]) => [k, { r0: +w.r0.toFixed(2), b0: +w.b0.toFixed(2), fromH: H(w.start), toH: H(w.end || w.start), prepH: H(w.prep), fightH: H(w.fight), lv: w.lv0 + '→' + (w.lv1 || w.lv0) }])),
    play: { activeH: H(MAC.activeT), offlineH: H(MAC.offT), offlineIdleH: H(MAC.offIdle), offlineStops: MAC.offStopped, sessions: OPT.sessions, offLog: MAC.offLog },
    recipes: recipeCheck(), notes: P.note, medianRolls: __rng.calls, trace: MAC.trace, log: P.log,
  };
}
