'use strict';
/* ==========================================================================
   ANIME IDLE RPG — the Task Queue, DOM-free
   Queue tasks in order: each one is an activity (a skill action or a Battlefield
   stage) and a size. When the running task is done, or its activity stops
   (out of materials, defeat), the next one starts on its own, offline too.
   - Sizes: ×25 · ×100 · ×500 · ×2000 · until it stops.
   - Slots: 2 when it opens, +1 at Soul City, Shinjuku and Green Island (5). The running task takes one.
   - "Prepare" (from 3 slots): queues the gathering a craft task is missing, before it.
   - Stopping an activity yourself pauses the queue, so it never starts something behind your back.
   (Internal names keep the old "mission" prefix: saves store S.missions.)
   Loaded after tasks.js (before guide.js: the balance bot loads it too).
   ========================================================================== */

const MS_SIZES = [25, 100, 500, 2000, 0];
const msOn = () => isUnlocked('feature:missions');
const msSlots = () => 2 + (S.gates.soul ? 1 : 0) + (S.gates.hex ? 1 : 0) + (S.gates.hunter ? 1 : 0);
const msPrepOn = () => msSlots() >= 3;
function msState() {
  if (!S.missions || typeof S.missions !== 'object') S.missions = {};
  const M = S.missions;
  if (!Array.isArray(M.list)) M.list = [];
  if (M.cur === undefined) M.cur = null;
  return M;
}
const msUsed = () => { const M = msState(); return M.list.length + (M.cur ? 1 : 0); };
const msFree = () => msSlots() - msUsed();

// What a mission is: its name, icon reference and whether it can start right now.
function msZoneIndex(m) { return ZONES.findIndex((z) => z.id === m.zone); }
function msName(m) {
  if (m.k === 'zone') { const z = ZONES[msZoneIndex(m)]; return z ? z.name : 'Unknown stage'; }
  const a = SKILLS[m.skill] && findAction(m.skill, m.id);
  return a ? a.name : 'Unknown task';
}
function msWhy(m) {
  if (m.k === 'zone') {
    const zi = msZoneIndex(m);
    if (zi < 0) return 'This stage is gone';
    if (!isUnlocked('feature:battle') || !zoneUnlocked(zi)) return 'Stage locked';
    return '';
  }
  const s = SKILLS[m.skill], a = s && findAction(m.skill, m.id);
  if (!a) return 'Unknown task';
  if (!skillOpen(m.skill)) return 'Skill locked';
  if (a.schem && !S.known[a.schem]) return 'Schematic needed';
  if (skillLv(m.skill) < a.level) return `Needs ${s.name} Lv ${a.level}`;
  if (a.in && !canAfford(a.in)) return 'Missing materials';
  return actionBlock(m.skill, a) || '';
}
const msRunning = (m) => (m.k === 'zone'
  ? S.combat.zone != null && ZONES[S.combat.zone] && ZONES[S.combat.zone].id === m.zone
  : !!S.action && S.action.skill === m.skill && S.action.id === m.id);
const idleNow = () => !S.action && S.combat.zone == null;

/* ---------------------------------------------------------------- the board */
function postMission(m, at) {
  const M = msState();
  if (!msOn()) return false;
  if (msFree() <= 0) { toast(`The queue is full (${msSlots()} tasks).`, 'bad'); return false; }
  const x = m.k === 'zone' ? { k: 'zone', zone: m.zone, n: m.n || 0 } : { k: 'act', skill: m.skill, id: m.id, n: m.n || 0 };
  if (at == null || at < 0 || at > M.list.length) M.list.push(x); else M.list.splice(at, 0, x);
  M.paused = 0;
  dirty = true;
  return true;
}
function dropMission(i) { const M = msState(); if (i === -1) M.cur = null; else M.list.splice(i, 1); dirty = true; }
function moveMission(i, d) {
  const L = msState().list, j = i + d;
  if (j < 0 || j >= L.length) return;
  [L[i], L[j]] = [L[j], L[i]];
  dirty = true;
}
function resumeBoard() { msState().paused = 0; dirty = true; }

// Prepare (3+ slots): for a craft task of a fixed size, post the gathering it lacks right before it.
// Producers are the highest-level action you can run that makes the item; goes two steps deep.
function msProducer(item) {
  let best = null;
  for (const k in SKILLS) {
    if (!skillOpen(k) || SKILLS[k].type === 'voyage' || SKILLS[k].realm === 'combat') continue;
    for (const a of SKILLS[k].actions) {
      if (!a.out || !a.out[item] || a.loot || skillLv(k) < a.level || (a.schem && !S.known[a.schem])) continue;
      if (!best || a.level > best.a.level) best = { skill: k, a };
    }
  }
  return best;
}
function prepareMission(i) {
  const M = msState(), m = M.list[i];
  if (!msPrepOn() || !m || m.k !== 'act' || !m.n) return 0;
  const a = findAction(m.skill, m.id);
  if (!a || !a.in) return 0;
  const steps = [], want = {};
  const need = (inputs, times, depth) => {
    for (const k in inputs) {
      const total = inputs[k] * times + (want[k] || 0);
      const lack = total - stock(k);
      want[k] = total;
      if (lack <= 0) continue;
      const p = msProducer(k);
      if (!p) continue;
      const runs = Math.ceil(lack / p.a.out[k]);
      if (depth < 2 && p.a.in) need(p.a.in, runs, depth + 1);
      steps.push({ k: 'act', skill: p.skill, id: p.a.id, n: runs });
    }
  };
  need(a.in, m.n, 0);
  let added = 0;
  for (const s of steps) { if (msFree() <= 0) break; M.list.splice(i + added, 0, s); added++; }
  if (added < steps.length) toast(`Not enough room in the queue: ${steps.length - added} step${steps.length - added > 1 ? 's' : ''} left out.`, 'bad');
  dirty = true;
  return added;
}

// You stopped something yourself (outside an engine tick): the queue waits for you.
// (Retreating from a fight is caught by the UI: stopCombat also runs when you simply switch activity.)
const msPauseIfMine = () => { if (!IN_STEP && S.missions && msOn() && msState().list.length) S.missions.paused = 1; };
{
  const baseStopAction = stopAction;
  stopAction = function (msg) { if (S.action) msPauseIfMine(); return baseStopAction(msg); };
}

/* ---------------------------------------------------------------- running it */
function msFinish(cur, why) {
  const M = msState();
  if (M.cur !== cur) return;
  M.cur = null;
  S.stats.missions = (S.stats.missions || 0) + (why === 'done' ? 1 : 0);
  emit('mission', { m: cur, why, name: msName(cur) });
  dirty = true;
}
function msStartNext() {
  const M = msState();
  let guard = 0;
  while (M.list.length && guard++ < 10) {
    const m = M.list.shift(), why = msWhy(m);
    if (why) { emit('mission', { m, why: 'skip', reason: why, name: msName(m) }); continue; }
    if (m.k === 'zone') startCombat(msZoneIndex(m)); else startAction(m.skill, m.id);
    if (msRunning(m)) { M.cur = Object.assign({}, m, { done: 0 }); emit('mission', { m: M.cur, why: 'start', name: msName(m) }); dirty = true; return; }
  }
}
hook('tick', () => {
  if (!S.missions || !msOn()) return;
  const M = msState();
  if (M.cur && !msRunning(M.cur)) msFinish(M.cur, M.cur.n && M.cur.done >= M.cur.n ? 'done' : 'stopped');
  if (!M.cur && !M.paused && M.list.length && idleNow()) msStartNext();
});
hook('action', (skill, act) => {
  const M = S.missions && S.missions.cur;
  if (!M || M.k !== 'act' || M.skill !== skill || M.id !== act.id || !msRunning(M)) return;
  M.done++;
  if (M.n && M.done >= M.n) { msFinish(M, 'done'); S.action = null; dirty = true; }
});
hook('kill', (e, z) => {
  const M = S.missions && S.missions.cur;
  if (!M || M.k !== 'zone' || M.zone !== z.id) return;
  M.done++;
  if (M.n && M.done >= M.n) { msFinish(M, 'done'); stopCombat(); }
});
