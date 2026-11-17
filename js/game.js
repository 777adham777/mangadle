'use strict';
/* ==========================================================================
   TRI-REALM IDLE — engine (logic is DOM-free; UI lives in ui.js)
   ========================================================================== */

const SAVE_KEY = 'trirealm_idle_save_v1';
const MAX_LEVEL = 99;
const BASE_OFFLINE_HOURS = 12;

// Classic exponential XP curve (level 99 ≈ 13M xp)
const XP_TABLE = (() => {
  const t = [0, 0];
  let pts = 0;
  for (let l = 1; l < 120; l++) { pts += Math.floor(l + 300 * Math.pow(2, l / 7)); t[l + 1] = Math.floor(pts / 4); }
  return t;
})();
function levelOf(xp) {
  let lo = 1, hi = MAX_LEVEL;
  while (lo < hi) { const mid = (lo + hi + 1) >> 1; if (xp >= XP_TABLE[mid]) lo = mid; else hi = mid - 1; }
  return lo;
}

/* ------------------------------------------------------------- state */
let S = null;
let SIM = false;          // true while simulating offline time (suppresses toasts / logs)
let dirty = true;         // UI needs a structural re-render
let logVer = 0;

function defaultState() {
  const skills = {};
  for (const id in SKILLS) skills[id] = { xp: 0 };
  return {
    v: 2,
    gold: 50,
    bounty: 0,
    items: {},
    skills,
    mastery: {},
    action: null,                       // { skill, id, prog }
    combat: { zone: null, enemy: null, eHp: 0, pT: 0, eT: 0, respawn: 0, hp: 50,
              style: 'strength', food: 'soldier_pill', kills: {}, log: [] },
    equip: { weapon: null, armor: null, accessory: null },
    fruit: null,
    shop: {},
    energy: { capLv: 0, powLv: 0, alloc: {}, lvl: {}, prog: {}, step: '10' },
    karma: 0, karmaTotal: 0, perks: {}, rebirths: 0,
    stats: { kills: 0, actions: 0, playtime: 0, deaths: 0, bossKills: 0, made: {}, voyages: 0, opened: 0 },
    found: {},                          // collection log: item id -> 1 once ever obtained
    pets: {},                           // pet id -> 1
    goal: 0,
    unlocked: {},                       // unlock id -> 1 (see UNLOCKS)
    gates: {},                          // world id -> 1 once its gate is opened (see GATES)
    known: {},                          // schematic id -> 1 once learned
    ui: { view: 'home', bank: 'all', tab: {} },
    last: Date.now(),
  };
}

function isObj(o) { return o && typeof o === 'object' && !Array.isArray(o); }
function mergeDefaults(target, def) {
  for (const k in def) {
    if (target[k] === undefined) target[k] = JSON.parse(JSON.stringify(def[k]));
    else if (isObj(def[k]) && isObj(target[k]) && Object.keys(def[k]).length) mergeDefaults(target[k], def[k]);
  }
  return target;
}
function sanitize() {
  for (const id in S.items) if (!ITEMS[id] || !(S.items[id] > 0)) delete S.items[id];
  for (const slot in S.equip) if (S.equip[slot] && !ITEMS[S.equip[slot]]) S.equip[slot] = null;
  if (S.fruit && !ITEMS[S.fruit]) S.fruit = null;
  if (S.action && (!SKILLS[S.action.skill] || !findAction(S.action.skill, S.action.id))) S.action = null;
  const C = S.combat;
  if (C.zone != null && !ZONES[C.zone]) { C.zone = null; C.enemy = null; }
  if (C.food && !ITEMS[C.food]) C.food = null;
  // collection log: anything you already own counts as found (older saves)
  for (const id in S.items) S.found[id] = 1;
  for (const slot in S.equip) if (S.equip[slot]) S.found[S.equip[slot]] = 1;
  if (S.fruit) S.found[S.fruit] = 1;
  for (const id in S.found) if (!ITEMS[id]) delete S.found[id];
  for (const id in S.pets) if (!PET_BY[id]) delete S.pets[id];
  for (const id in S.known) if (!ITEMS[id] || ITEMS[id].type !== 'schematic') delete S.known[id];
  for (const id in S.items) if (ITEMS[id].type === 'schematic') { learnSchematic(id, true); delete S.items[id]; }
}

/* ------------------------------------------------------------ helpers */
const rand = (a, b) => a + Math.random() * (b - a);
const randInt = (a, b) => Math.floor(rand(a, b + 1));
const pick = (a) => a[Math.floor(Math.random() * a.length)];
function fmt(n) {
  if (!isFinite(n)) return '∞';
  const neg = n < 0; n = Math.abs(n);
  let s;
  if (n < 1000) s = (n < 10 && n % 1 ? n.toFixed(1) : Math.floor(n)).toString();
  else {
    const units = ['K', 'M', 'B', 'T', 'Qa', 'Qi'];
    let i = -1;
    while (n >= 1000 && i < units.length - 1) { n /= 1000; i++; }
    s = (n < 100 ? n.toFixed(2) : n.toFixed(1)).replace(/\.?0+$/, '') + units[i];
  }
  return (neg ? '-' : '') + s;
}
function fmtTime(s) {
  if (!isFinite(s)) return '∞';
  if (s < 10) return s.toFixed(1) + 's';
  if (s < 60) return Math.round(s) + 's';
  if (s < 3600) return Math.floor(s / 60) + 'm ' + Math.round(s % 60) + 's';
  if (s < 86400) return Math.floor(s / 3600) + 'h ' + Math.floor((s % 3600) / 60) + 'm';
  return Math.floor(s / 86400) + 'd ' + Math.floor((s % 86400) / 3600) + 'h';
}
const pct = (x) => (Math.round(x * 1000) / 10) + '%';

// notifications are wired up by the UI layer
let notify = () => {};
function toast(msg, cls) { if (!SIM) notify(msg, cls); }

// tiny event bus: the UI listens for juicy moments (hits, level-ups, loot) to animate them
const BUS = {};
function on(ev, fn) { (BUS[ev] = BUS[ev] || []).push(fn); }
function emit(ev, d) { if (!SIM && BUS[ev]) for (const fn of BUS[ev]) fn(d); }

/* -------------------------------------------------------------- items */
const count = (id) => S.items[id] || 0;
function addItem(id, n) {
  if (n <= 0) return;
  S.items[id] = (S.items[id] || 0) + n;
  if (!S.found[id]) { S.found[id] = 1; emit('newitem', id); }
}
function removeItem(id, n) { S.items[id] = count(id) - n; if (S.items[id] <= 0) delete S.items[id]; }
function canAfford(inputs) { for (const k in inputs) if (count(k) < inputs[k]) return false; return true; }
function findAction(skill, id) { return SKILLS[skill].actions.find((a) => a.id === id); }

/* ------------------------------------------------------------- levels */
const skillLv = (id) => levelOf(S.skills[id].xp);
const skillXpMult = (id) => xpMult() * (hasPetFor(id) ? 1.05 : 1) * (1 + synergyBonus('xp', id));
function addXp(id, amt) {
  const before = skillLv(id);
  S.skills[id].xp += amt * skillXpMult(id);
  const after = skillLv(id);
  if (after > before) { emit('levelup', { skill: id, level: after }); dirty = true; }
}

/* -------------------------------------------------------- multipliers */
const fruitFx = () => (S.fruit ? ITEMS[S.fruit].fx : {});
function gearStat(k) {
  let s = 0;
  for (const slot in S.equip) { const id = S.equip[slot]; if (id && ITEMS[id].stats[k]) s += ITEMS[id].stats[k]; }
  return s;
}
const tl = (t) => S.energy.lvl[t] || 0;
const pl = (p) => S.perks[p] || 0;
function bountyRank() { let r = 0; BOUNTY_RANKS.forEach((b, i) => { if (S.bounty >= b[0]) r = i; }); return r; }

/* --------------------------------------------- milestones, pets, luck */
const PET_BY = Object.fromEntries(PETS.map((p) => [p.id, p]));
const hasPetFor = (skill) => PETS.some((p) => p.skill === skill && S.pets[p.id]);
const bossPets = () => PETS.filter((p) => p.zone && S.pets[p.id]).length;
function milestoneFx(skill) {
  const L = skillLv(skill), fx = { speed: 0, dbl: 0, rare: 0 };
  for (const m of MILESTONES) if (L >= m.lv) { fx.speed += m.speed || 0; fx.dbl += m.dbl || 0; fx.rare += m.rare || 0; }
  return fx;
}
const combatMilestones = (skill) => COMBAT_MILESTONES.filter((lv) => skillLv(skill) >= lv).length;
const luckMult = () => 1 + 0.15 * (S.shop.lucky_coin || 0);
const rareMult = (skill) => (1 + milestoneFx(skill).rare) * luckMult() * (1 + synergyBonus('rare', skill));
function collectionPct() {
  const total = Object.keys(ITEMS).length + PETS.length;
  return (Object.keys(S.found).length + Object.keys(S.pets).length) / total;
}

function dmgMult()  { return (1 + synergyBonus('dmg', 'combat')) * (1 + 0.01 * tl('chakra')) * (1 + 0.1 * pl('warrior')) * (1 + (fruitFx().dmg || 0)) * (1 + 0.05 * bountyRank()) * (1 + 0.04 * combatMilestones('strength')) * (1 + 0.03 * bossPets()); }
function hpMult()   { return (1 + synergyBonus('hp', 'combat')) * (1 + 0.01 * tl('reiatsu')) * (1 + 0.1 * pl('warrior')) * (1 + (fruitFx().hp || 0)) * (1 + 0.04 * combatMilestones('vitality')) * (1 + 0.03 * bossPets()); }
function defMult()  { return (1 + 0.01 * tl('will')) * (1 + 0.04 * combatMilestones('defense')); }
function goldMult() { return (1 + 0.01 * tl('fortune')) * (1 + 0.15 * pl('merchant')) * (1 + (fruitFx().gold || 0)) * (1 + gearStat('gold')); }
function xpMult()   { return (1 + 0.005 * tl('wisdom')) * (1 + 0.1 * pl('mentor')); }

// Mastery: per-action level from how many times you've done it. Lv L needs (L/2)^2 completions (Lv 99 ~ 2450).
function masteryLv(skill, act) { return Math.min(99, Math.floor(Math.sqrt(S.mastery[skill + ':' + act] || 0) * 2)); }
function masteryProg(skill, act) {
  const n = S.mastery[skill + ':' + act] || 0, L = masteryLv(skill, act);
  if (L >= 99) return { L, p: 1, need: 0 };
  const lo = Math.pow(L / 2, 2), hi = Math.pow((L + 1) / 2, 2);
  return { L, p: (n - lo) / (hi - lo), need: Math.ceil(hi - n) };
}
function skillSpeed(skillId, actId) {
  const sk = SKILLS[skillId];
  let m = (1 + 0.002 * tl('swift')) * (1 + 0.1 * (S.shop['tools_' + sk.realm] || 0)) * (1 + (fruitFx().skill || 0));
  if (actId) m *= 1 + 0.003 * masteryLv(skillId, actId);
  if (sk.type !== 'combat') m *= 1 + milestoneFx(skillId).speed;
  if (hasPetFor(skillId)) m *= 1.05;
  m *= 1 + synergyBonus('speed', skillId);
  if (skillId === 'fishing' && S.fruit) m *= 0.6;
  return m;
}
const actionTime = (skillId, act) => act.time / skillSpeed(skillId, act.id);
function doubleChance(skillId, actId) {
  let c = 0.002 * masteryLv(skillId, actId);
  if (SKILLS[skillId].type === 'gather') c += 0.05 * (S.shop.abundance || 0);
  c += milestoneFx(skillId).dbl;
  c += synergyBonus('double', skillId);
  return Math.min(1, c);
}

/* ------------------------------------------------- unlocks + synergies */
const UNLOCK_BY = Object.fromEntries(UNLOCKS.map((u) => [u.id, u]));
// Anything not listed in UNLOCKS is always open. Combat skills open with the Battlefield.
function isUnlocked(id) {
  if (id.startsWith('skill:') && SKILLS[id.slice(6)] && SKILLS[id.slice(6)].realm === 'combat') id = 'feature:battle';
  return !UNLOCK_BY[id] || !!S.unlocked[id];
}
const skillOpen = (k) => isUnlocked('skill:' + k);
const realmOpen = (r) => isUnlocked('realm:' + r);
// Marks every unlock whose condition is now met; returns the newly opened entries (in list order).
function checkUnlocks() {
  const fresh = [];
  for (const u of UNLOCKS) if (!S.unlocked[u.id] && u.need()) { S.unlocked[u.id] = 1; fresh.push(u); }
  if (fresh.length) dirty = true;
  return fresh;
}
const nextUnlock = () => UNLOCKS.find((u) => !S.unlocked[u.id] && u.hint);

const synHits = (s, target) => s.to === target || s.to === 'all' || (SKILLS[target] && SKILLS[target].type === s.to);
const synValue = (s) => (skillOpen(s.from) ? s.per * (skillLv(s.from) - 1) : 0);
function synergyBonus(kind, target) {
  let b = 0;
  for (const s of SYNERGIES) if (s.kind === kind && synHits(s, target)) b += synValue(s);
  return b;
}
// Synergies a skill receives / gives. Combat skills share the 'combat' target.
const synergiesInto = (k) => SYNERGIES.filter((s) => synHits(s, k) || (SKILLS[k].realm === 'combat' && s.to === 'combat'));
const synergiesFrom = (k) => SYNERGIES.filter((s) => s.from === k);
const synTargetOpen = (s) => (s.to === 'combat' ? isUnlocked('feature:battle') : SKILLS[s.to] ? skillOpen(s.to) : true);

/* ------------------------------------------------------- combat stats */
const pMaxHit = () => (8 + 1.5 * skillLv('strength') + gearStat('atk')) * dmgMult();
const pDef    = () => (1.5 * skillLv('defense') + gearStat('def')) * defMult();
const pMaxHp  = () => Math.floor((40 + 10 * skillLv('vitality') + gearStat('hp')) * hpMult());
const pSpeed  = () => 2.4 * (1 + (fruitFx().atkSpeed || 0));
const pDodge  = () => fruitFx().dodge || 0;
const mitig   = (def) => 100 / (100 + def);
const autoEatThreshold = () => [0.4, 0.55, 0.7][S.shop.satchel || 0];
const foodHeal = (id) => Math.floor(ITEMS[id].heal * hpMult() * (1 + synergyBonus('heal', 'cooking')));

function timeToKill(e) { return e.hp / (0.75 * pMaxHit() * mitig(e.def) / pSpeed()); }
function timeToDie(e)  { return pMaxHp() / (0.75 * e.atk * mitig(pDef()) * (1 - pDodge()) / e.spd); }
function zoneDanger(zi) {
  let worst = 0;
  for (const e of ZONES[zi].enemies) worst = Math.max(worst, timeToKill(e) / timeToDie(e));
  if (worst < 0.35) return ['Easy', 'easy'];
  if (worst < 0.8) return ['Fair', 'fair'];
  if (worst < 1.6) return ['Risky', 'risky'];
  return ['Deadly', 'deadly'];
}

/* ------------------------------------------------------------- energy */
const energyCap   = () => Math.floor((100 + 25 * S.energy.capLv) * (1 + 0.2 * pl('reserves')));
const energyPower = () => (1 + 0.1 * S.energy.powLv) * (1 + 0.25 * pl('fire'));
const energyUsed  = () => Object.values(S.energy.alloc).reduce((a, b) => a + b, 0);
const energyIdle  = () => energyCap() - energyUsed();
const TRAIN_BY = Object.fromEntries(TRAININGS.map((t) => [t.id, t]));
const trainCost = (t, L) => TRAIN_BY[t].base * Math.pow(1 + L / 10, 2);
const capCost = () => Math.floor(50 * Math.pow(1.35, S.energy.capLv));
const powCost = () => Math.floor(200 * Math.pow(1.55, S.energy.powLv));
const totalTrain = () => TRAININGS.reduce((a, t) => a + tl(t.id), 0);
const karmaGain = () => { const t = totalTrain(); return t < 200 ? 0 : Math.floor(Math.pow(t / 40, 1.2)); };
const perkCost = (p) => pl(p) + 1;

/* ========================================================== simulation */
function step(dt) {
  tickAction(dt);
  tickCombat(dt);
  tickEnergy(dt);
  S.stats.playtime += dt;
}
function advance(seconds) {
  let t = seconds;
  while (t > 0) { const s = Math.min(1, t); step(s); t -= s; }
}

/* ------------------------------------------------------------- skills */
function startAction(skill, id) {
  const act = findAction(skill, id);
  if (!act) return;
  if (S.action && S.action.skill === skill && S.action.id === id) { stopAction(); return; }
  if (!skillOpen(skill)) return;
  if (act.schem && !S.known[act.schem]) return toast(`Requires the ${ITEMS[act.schem].name}`, 'bad');
  if (skillLv(skill) < act.level) return toast(`Requires ${SKILLS[skill].name} level ${act.level}`, 'bad');
  if (act.in && !canAfford(act.in)) return toast('Not enough materials.', 'bad');
  stopCombat();
  S.action = { skill, id, prog: 0 };
  dirty = true;
}
function stopAction(msg) { S.action = null; dirty = true; if (msg) toast(msg, 'bad'); }

function tickAction(dt) {
  const a = S.action;
  if (!a) return;
  const act = findAction(a.skill, a.id);
  if (!act) { S.action = null; return; }
  a.prog += dt;
  let T = actionTime(a.skill, act);
  let guard = 0;
  while (a.prog >= T && guard++ < 100) {
    if (act.in && !canAfford(act.in)) { stopAction(`Out of materials for ${act.name}.`); return; }
    a.prog -= T;
    completeAction(a.skill, act);
    T = actionTime(a.skill, act);
  }
}

function completeAction(skill, act) {
  if (act.in) for (const k in act.in) removeItem(k, act.in[k]);
  const mult = Math.random() < doubleChance(skill, act.id) ? 2 : 1;
  const gains = {};
  if (act.out) for (const k in act.out) {
    const n = act.out[k] * mult;
    addItem(k, n); gains[k] = n;
    S.stats.made[k] = (S.stats.made[k] || 0) + n;
  }
  let gold = 0;
  if (act.loot) { gold = rollLoot(act.loot, mult, gains); S.stats.voyages++; }
  rollRareFinds(skill, act, gains);
  addXp(skill, act.xp);
  const key = skill + ':' + act.id;
  S.mastery[key] = (S.mastery[key] || 0) + 1;
  S.stats.actions++;
  emit('action', { skill, act, gains, gold, xp: act.xp * skillXpMult(skill), double: mult > 1 });
}

function rollRareFinds(skill, act, gains) {
  const m = rareMult(skill);
  for (const [id, ch] of (RARE_FINDS[skill] || []).concat(GLOBAL_RARE)) {
    if (Math.random() < ch * m) {
      const real = id === 'GEM' ? rollWeighted(GEM_TABLE) : id === 'FRUIT' ? pick(FRUITS) : id;
      addItem(real, 1); gains[real] = (gains[real] || 0) + 1;
      emit('rare', { id: real, source: SKILLS[skill].name });
    }
  }
  const pet = PETS.find((p) => p.skill === skill);
  if (pet && !S.pets[pet.id] && Math.random() < (act.time / (PET_HOURS * 3600)) * luckMult()) givePet(pet);
}
function givePet(pet) {
  S.pets[pet.id] = 1;
  emit('pet', pet);
  dirty = true;
}
function weightedIndex(table) {
  const total = table.reduce((a, t) => a + t[1], 0);
  let r = Math.random() * total;
  for (let i = 0; i < table.length; i++) { r -= table[i][1]; if (r < 0) return i; }
  return table.length - 1;
}
const rollWeighted = (table) => table[weightedIndex(table)][0];

/* ------------------------------------------------------------- chests */
// Opens up to 1000 at a time so huge stacks stay instant. Returns { n, gold, items: {id: qty} }.
function openChest(id, n) {
  const it = ITEMS[id];
  n = Math.min(n, count(id), 1000);
  if (!it || it.type !== 'chest' || n <= 0) return null;
  removeItem(id, n);
  const res = { gold: 0, items: {}, n };
  for (let i = 0; i < n; i++) {
    res.gold += Math.floor(randInt(it.gold[0], it.gold[1]) * goldMult());
    const [lid, , q] = it.loot[weightedIndex(it.loot)];
    const real = lid === 'FRUIT' ? pick(FRUITS) : lid === 'GEM' ? rollWeighted(GEM_TABLE) : lid;
    res.items[real] = (res.items[real] || 0) + randInt(q[0], q[1]);
  }
  S.gold += res.gold;
  for (const k in res.items) addItem(k, res.items[k]);
  S.stats.opened += n;
  dirty = true;
  return res;
}

function rollLoot(l, mult, gains) {
  const g = Math.floor(randInt(l.gold[0], l.gold[1]) * goldMult());
  S.gold += g;
  if (l.table) { const [id, q] = pick(l.table); const n = randInt(q[0], q[1]) * mult; addItem(id, n); gains[id] = (gains[id] || 0) + n; }
  for (const [id, ch] of l.rare || []) if (Math.random() < ch * luckMult()) giveDrop(id, 1, true);
  return g;
}
function giveDrop(id, n, announce) {
  if (id === 'FRUIT') { id = pick(FRUITS); announce = true; }
  addItem(id, n);
  if (announce) emit('rare', { id, source: 'Voyage' });
}

/* ------------------------------------------------------------- combat */
function zoneUnlocked(zi) {
  if (!realmOpen(ZONES[zi].realm)) return false;   // other worlds wait behind their gate
  if (zi === 0) return true;
  const prev = ZONES[zi - 1];
  return (S.combat.kills[prev.id] || 0) >= (prev.boss ? 1 : 10);
}
function startCombat(zi) {
  if (!ZONES[zi] || !zoneUnlocked(zi) || !isUnlocked('feature:battle')) return;
  const C = S.combat;
  if (C.zone === zi) return;
  S.action = null;
  C.zone = zi; C.enemy = null; C.respawn = 0.6;
  clog(`Entered ${ZONES[zi].name}.`, 'sys');
  dirty = true;
}
function stopCombat() {
  const C = S.combat;
  if (C.zone == null) return;
  C.zone = null; C.enemy = null;
  dirty = true;
}
const curEnemy = () => { const C = S.combat; return C.zone != null && C.enemy != null ? ZONES[C.zone].enemies[C.enemy] : null; };
function clog(m, c) { if (SIM) return; const L = S.combat.log; L.unshift({ m, c }); if (L.length > 40) L.pop(); logVer++; }

function tickCombat(dt) {
  const C = S.combat;
  const max = pMaxHp();
  if (C.hp > max) C.hp = max;
  if (C.zone == null) { C.hp = Math.min(max, C.hp + max * 0.03 * dt); return; }
  C.hp = Math.min(max, C.hp + max * 0.008 * dt);
  if (C.enemy == null) {
    C.respawn -= dt;
    if (C.respawn <= 0) spawnEnemy();
    return;
  }
  const e = curEnemy();
  C.pT -= dt; C.eT -= dt;
  let guard = 0;
  while ((C.pT <= 0 || C.eT <= 0) && guard++ < 50) {
    if (C.pT <= C.eT) { playerHit(e); if (C.enemy == null) return; C.pT += pSpeed(); }
    else { enemyHit(e); if (C.zone == null) return; C.eT += e.spd; }
  }
}
function spawnEnemy() {
  const C = S.combat, z = ZONES[C.zone];
  C.enemy = Math.floor(Math.random() * z.enemies.length);
  const e = z.enemies[C.enemy];
  C.eHp = e.hp; C.pT = 0.4; C.eT = e.spd * 0.8;
  emit('spawn', e);
}
function playerHit(e) {
  const C = S.combat;
  const roll = rand(0.5, 1);
  const dmg = Math.max(1, Math.round(pMaxHit() * roll * mitig(e.def)));
  C.eHp -= dmg;
  emit('hit', { target: 'enemy', dmg, crit: roll > 0.9 });
  if (C.eHp <= 0) killEnemy(e);
}
function killEnemy(e) {
  const C = S.combat, z = ZONES[C.zone];
  const g = Math.floor(randInt(e.gold[0], e.gold[1]) * goldMult());
  S.gold += g;
  const vitShare = e.xp / 3;
  if (C.style === 'strength') addXp('strength', e.xp);
  else if (C.style === 'defense') addXp('defense', e.xp);
  else { addXp('strength', e.xp / 2); addXp('defense', e.xp / 2); }
  addXp('vitality', vitShare);
  S.bounty += e.xp * 10;
  const dropped = [], loot = {};
  for (const [id, ch, q] of e.drops) {
    if (ITEMS[id] && ITEMS[id].type === 'schematic') {
      if (!S.known[id] && Math.random() < ch * luckMult()) { learnSchematic(id); dropped.push(ITEMS[id].name); }
      continue;
    }
    if (Math.random() < (ch < 0.2 ? ch * luckMult() : ch)) {
      const real = id === 'FRUIT' ? pick(FRUITS) : id;
      const n = randInt(q[0], q[1]);
      addItem(real, n); loot[real] = n;
      dropped.push(`${ITEMS[real].name}${n > 1 ? " ×" + n : ""}`);
      if (ch < 0.2) emit('rare', { id: real, source: e.name });
    }
  }
  C.kills[z.id] = (C.kills[z.id] || 0) + 1;
  const pet = PETS.find((p) => p.zone === z.id);
  if (pet && !S.pets[pet.id] && Math.random() < pet.chance * luckMult()) givePet(pet);
  S.stats.kills++;
  if (z.boss) { S.stats.bossKills++; if (C.kills[z.id] === 1) toast(`${e.name} defeated! A new path opens...`, 'rare'); }
  clog(`Defeated ${e.name}: +${fmt(g)} gold${dropped.length ? ", " + dropped.join(", ") : ""}`, 'win');
  C.enemy = null; C.respawn = z.boss ? 3 : 1.2;
  emit('kill', { enemy: e, gold: g, loot, boss: !!z.boss });
}
function enemyHit(e) {
  const C = S.combat;
  if (Math.random() < pDodge()) { clog(`You mist-step past ${e.name}'s attack.`, 'sys'); emit('hit', { target: 'player', dodge: true }); return; }
  const dmg = Math.max(1, Math.round(e.atk * rand(0.5, 1) * mitig(pDef())));
  C.hp -= dmg;
  emit('hit', { target: 'player', dmg });
  autoEat();
  if (C.hp <= 0) {
    C.hp = 0;
    S.stats.deaths++;
    clog(`You were defeated by ${e.name}. Retreating to recover...`, 'lose');
    toast(`Defeated by ${e.name}! Train harder or bring more food.`, 'bad');
    emit('death', e);
    stopCombat();
  }
}
function autoEat() {
  const C = S.combat, max = pMaxHp(), thr = autoEatThreshold() * max;
  let n = 0;
  while (C.hp < thr && C.food && count(C.food) > 0 && n++ < 10) {
    C.hp = Math.min(max, C.hp + foodHeal(C.food));
    emit('eat', { id: C.food, heal: foodHeal(C.food) });
    removeItem(C.food, 1);
  }
}

/* ------------------------------------------------- schematics + gates */
// The recipe a schematic teaches: { skill, act }.
function schemRecipe(id) {
  for (const k in SKILLS) for (const a of SKILLS[k].actions) if (a.schem === id) return { skill: k, act: a };
  return null;
}
function learnSchematic(id, quiet) {
  if (S.known[id]) return;
  S.known[id] = 1;
  S.found[id] = 1;
  if (!quiet) emit('schematic', id);
  dirty = true;
}
function gateState(r) {
  const g = GATES[r];
  const boss = (S.combat.kills[g.boss] || 0) > 0, items = canAfford(g.offer);
  return { g, boss, items, ready: boss && items && !S.gates[r], open: !!S.gates[r] };
}
const nextGate = () => GATE_ORDER.find((r) => !S.gates[r]);
function openGate(r) {
  const st = gateState(r);
  if (!st.ready) return false;
  for (const k in st.g.offer) removeItem(k, st.g.offer[k]);
  S.gates[r] = 1;
  dirty = true;
  return true;
}

/* ---------------------------------------------------------- equipment */
function equip(id) {
  const it = ITEMS[id];
  if (!it || it.type !== 'equip' || count(id) < 1) return;
  const old = S.equip[it.slot];
  removeItem(id, 1);
  if (old) addItem(old, 1);
  S.equip[it.slot] = id;
  dirty = true;
}
function unequip(slot) { const id = S.equip[slot]; if (!id) return; addItem(id, 1); S.equip[slot] = null; dirty = true; }
function eatFruit(id) {
  if (ITEMS[id].type !== 'fruit' || count(id) < 1) return;
  removeItem(id, 1);
  S.fruit = id;
  toast(`You ate the ${ITEMS[id].name}. ${ITEMS[id].desc}`, 'rare');
  dirty = true;
}
function sell(id, n) {
  n = Math.min(n, count(id));
  if (n <= 0) return;
  removeItem(id, n);
  S.gold += ITEMS[id].value * n;
  if (S.combat.food === id && !count(id)) { /* keep selection, just empty */ }
  dirty = true;
}

/* ------------------------------------------------------------- energy */
function tickEnergy(dt) {
  const P = energyPower();
  for (const t of TRAININGS) {
    const a = S.energy.alloc[t.id];
    if (!a) continue;
    let prog = (S.energy.prog[t.id] || 0) + dt * a * P;
    let L = tl(t.id), cost = trainCost(t.id, L), guard = 0;
    while (prog >= cost && guard++ < 10000) { prog -= cost; L++; cost = trainCost(t.id, L); }
    S.energy.lvl[t.id] = L;
    S.energy.prog[t.id] = prog;
  }
}
function stepAmount() {
  const st = S.energy.step;
  if (st === 'max') return Infinity;
  if (st.endsWith('%')) return Math.max(1, Math.floor(energyCap() * parseInt(st, 10) / 100));
  return +st;
}
function allocate(t, dir) {
  let amt = stepAmount();
  const cur = S.energy.alloc[t] || 0;
  if (dir > 0) amt = Math.min(amt, energyIdle()); else amt = -Math.min(amt, cur);
  S.energy.alloc[t] = cur + amt;
  if (!S.energy.alloc[t]) delete S.energy.alloc[t];
  dirty = true;
}
function releaseAll() { S.energy.alloc = {}; dirty = true; }
function buyCap() { const c = capCost(); if (S.gold < c) return; S.gold -= c; S.energy.capLv++; dirty = true; }
function buyPow() { const c = powCost(); if (S.gold < c) return; S.gold -= c; S.energy.powLv++; dirty = true; }

/* ------------------------------------------------------------ rebirth */
function rebirth() {
  const g = karmaGain();
  if (g <= 0) return false;
  S.karma += g; S.karmaTotal += g; S.rebirths++;
  S.energy = { capLv: 0, powLv: 0, alloc: {}, lvl: {}, prog: {}, step: S.energy.step };
  toast(`Reborn! +${g} Karma.`, 'rare');
  dirty = true;
  return true;
}
function buyPerk(id) {
  const p = PERKS.find((x) => x.id === id);
  if (!p || (p.max && pl(id) >= p.max)) return;
  const c = perkCost(id);
  if (S.karma < c) return;
  S.karma -= c; S.perks[id] = pl(id) + 1;
  // keep allocations valid if the cap changed
  dirty = true;
}

/* --------------------------------------------------------------- shop */
function shopCost(it) { return it.costs ? it.costs[S.shop[it.id] || 0] : it.cost; }
function buyShop(id) {
  const it = SHOP.find((x) => x.id === id);
  if (!it) return;
  const c = shopCost(it);
  if (c === undefined || S.gold < c) return;
  S.gold -= c;
  if (it.give) addItem(it.give[0], it.give[1]);
  else S.shop[id] = (S.shop[id] || 0) + 1;
  toast(`Purchased ${it.name}.`, 'good');
  dirty = true;
}

/* -------------------------------------------------------- persistence */
function snapshot() {
  return {
    gold: S.gold, items: Object.assign({}, S.items),
    levels: Object.fromEntries(Object.keys(SKILLS).map((k) => [k, skillLv(k)])),
    train: totalTrain(), kills: S.stats.kills,
  };
}
function offlineSeconds(elapsed) { return Math.min(elapsed, (BASE_OFFLINE_HOURS + 2 * pl('dilation')) * 3600); }
function serialize() { S.last = Date.now(); return JSON.stringify(S); }
function loadFrom(json) {
  const d = JSON.parse(json);
  if (!isObj(d) || !d.skills) throw new Error('Not a valid save');
  const legacy = !d.unlocked, oldV = d.v || 1;
  S = mergeDefaults(d, defaultState());
  sanitize();
  if (oldV < 2) migrateV2();
  if (legacy || oldV < 2) checkUnlocks();   // open what older saves already reached, quietly
}
// v2 moved the start to the Shinobi Lands and put worlds behind gates. Keep everything a player already had.
function migrateV2() {
  const used = (r) => Object.keys(SKILLS).some((k) => SKILLS[k].realm === r && S.skills[k].xp > 0) || S.unlocked['realm:' + r];
  const kz = (z) => (S.combat.kills[z] || 0) > 0;
  if (used('soul') || kz('districts')) S.gates.soul = 1;
  if (used('seas') || kz('shoals')) S.gates.seas = 1;
  if (kz('admiral')) S.gates.rift = 1;
  for (const id in ITEMS) if (ITEMS[id].type === 'schematic' && (S.stats.made[ITEMS[id].teaches] || S.found[ITEMS[id].teaches])) S.known[id] = 1;
  if (S.combat.food && !ITEMS[S.combat.food]) S.combat.food = 'soldier_pill';
  S.v = 2;
  S.goal = 0;
  skipDoneGoals();
}
// New objective list: skip the ones an older save has already done (no reward, they were paid before).
function skipDoneGoals() { let st; while ((st = goalState()) && st.done) S.goal++; }


/* --------------------------------------------------------------- goals */
function goalState() {
  const g = GOALS[S.goal];
  if (!g) return null;
  const cur = Math.min(g.n, g.prog()[0]);
  return { g, cur, done: cur >= g.n };
}
function claimGoal() {
  const st = goalState();
  if (!st || !st.done) return;
  S.gold += st.g.reward;
  S.goal++;
  emit('goal', st.g);
  dirty = true;
}
