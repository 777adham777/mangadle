'use strict';
/* ==========================================================================
   Planner: what a competent player does next. Ported from the old tick bot (scratch/bal/bot.js)
   and made deterministic: no random choice, every "is this fight OK" answer comes from fightRates.
   plan() returns a task:
     { kind: 'act', skill, id }    a skill action (gather / craft)
     { kind: 'fight', zi }         a stage
     { kind: 'dungeon', id }       dungeon runs (keys + food)
     { kind: 'wait', why }         nothing useful: background systems run (crops, ships)
   A task may carry key: { id, n } when it is the hunt for a rare drop (the macro loop then jumps to
   the p50 / p90 time of that drop instead of adding a fraction of it).
   ========================================================================== */

const P = { log: [], fail: {}, proj: null, noProj: {}, refineFlip: false, energyFocus: null, note: {} };
const PROD = {}, EXTRA = {}, DROPS = {};
for (const k in SKILLS) for (const a of SKILLS[k].actions) {
  for (const o in a.out || {}) (PROD[o] = PROD[o] || []).push({ skill: k, act: a, q: a.out[o] });
  for (const [t, ch, q] of a.extra || []) (EXTRA[t] = EXTRA[t] || []).push({ skill: k, act: a, ch, avg: (q[0] + q[1]) / 2 });
}
ZONES.forEach((z, zi) => z.enemies.forEach((e, ei) => { for (const [t, ch, q] of e.drops) (DROPS[t] = DROPS[t] || []).push({ zi, ei, ch, avg: (q[0] + q[1]) / 2, n: z.enemies.length }); }));
const simH = () => SIMT / 3600;
let SIMT = 0;
const plog = (m) => P.log.push(`[${simH().toFixed(2)}h] ${m}`);
// A rare thing to hunt for (macro loop: quantile time instead of fractions).
const isKey = (id, need) => need - stock(id) <= 3 && ITEMS[id] && (ITEMS[id].rarity >= 3 || ITEMS[id].type === 'schematic' || ITEMS[id].type === 'equip');

// what a goal's progress reads (S.stats.made / S.combat.kills / S.skills / S.gates)
function introspect(g) {
  const rec = {};
  const spy = (o, kind) => new Proxy(o, { get(t, p) { if (typeof p === 'string' && !(kind in rec)) rec[kind] = p; return t[p]; } });
  const m = S.stats.made, k = S.combat.kills, sk = S.skills, gt = S.gates;
  S.stats.made = spy(m, 'made'); S.combat.kills = spy(k, 'kills'); S.skills = spy(sk, 'lvl'); S.gates = spy(gt, 'gate');
  try { g.prog(); } catch (e) { /* goals that read other state */ }
  S.stats.made = m; S.combat.kills = k; S.skills = sk; S.gates = gt;
  return rec;
}

/* ------------------------------------------------------------ combat odds (analytic) */
const power = () => pMaxHit() * pMaxHp() / pSpeed() * (100 + pDef()) / 100;
let zoneRatio = function (zi) {
  let w = 0;
  ZONES[zi].enemies.forEach((_, i) => { const e = enemyAt(zi, i); w = Math.max(w, timeToKill(e) / timeToDie(e)); });
  return w;
};
// fightRates cache: kept while your fighting power is the same (level, gear, techniques, disciplines,
// fruit, food in the bag, open worlds); a new key empties it.
zoneRatio = memo(zoneRatio);   // same stage, same gear, same epoch: same answer
const FR = new Map();
let FRK = null;
const PK = { ep: -1, c: '', v: '' };
const powerKey = () => { const c = memoCombo(); if (PK.ep === EPOCH && PK.c === c) return PK.v; PK.ep = EPOCH; PK.c = c; return (PK.v = powerKeyNow()); };
const powerKeyNow = () => charLv() + '|' + S.equip.armor + S.equip.accessory + S.equipU + '|' + equipped().map((id) => id + techLv(id)).join(',') + '|' + Math.floor(totalTrain() / 10)
  + '|' + (S.fruit || '') + fruitRank() + '|' + Object.keys(S.gates).length + '|' + (S.combat.food && count(S.combat.food) >= 1 ? S.combat.food : '') + '|' + (S.shop.lucky_coin || 0) + (S.shop.satchel || 0) + '|' + Object.keys(P.fail).length;
function frate(zi) {
  const k = powerKey();
  if (k !== FRK) { FRK = k; FR.clear(); }
  if (!FR.has(zi)) FR.set(zi, fightRates(zi));
  return FR.get(zi);
}
// Food decides what you can hold (2026-11-25): no HP comes back in battle, so a stage is yours if no blow
// can drop you from the auto-eat line and you have (or can make) food; a guardian if, on top of that, your
// stock covers the whole fight. Time spent making the food counts against a stage's XP per hour.
const eatLine = () => autoEatThreshold() * pMaxHp();
const FPS = { ep: -1, m: new Map() };
function foodProdSec(id) {
  if (FPS.ep !== EPOCH) { FPS.ep = EPOCH; FPS.m.clear(); }
  if (FPS.m.has(id)) return FPS.m.get(id);
  const v = foodProdSecNow(id); FPS.m.set(id, v); return v;
}
function foodProdSecNow(id) {
  const p = producerOf(id);
  if (!p) return 60;
  const c = chainRates(p.skill, p.act, 0, false);
  return c && c.out[id] > 0 ? 1 / c.out[id] : 60;
}
function foodCost(zi) {
  const r = frate(zi);
  if (!(r.hpLoss > 0)) return { perS: 0, prodPerS: 0 };
  const bf = ownedFood() || bestFood();
  if (!bf) return null;
  const perS = r.hpLoss / Math.max(1, foodHeal(bf));
  return { bf, perS, prodPerS: perS * foodProdSec(bf) };
}
function bossOk(zi) {
  const r = frate(zi);
  if (r.blow >= eatLine()) return false;                     // one blow from the eat line: gear and HP first
  const f = ownedFood(), pool = pMaxHp() * (1 - autoEatThreshold()) + (f ? foodStock() * foodHeal(f) : 0);
  return r.worstFight < pool;
}
function zoneOk(zi, lim) {
  if (!ZONES[zi] || !zoneUnlocked(zi) || ZONES[zi].tear || ZONES[zi].dungeon || !ZONES[zi].enemies.length) return false;
  const f = P.fail[zi];
  if (f && power() < f * 1.12) return false;
  if (ZONES[zi].boss) return bossOk(zi);
  const r = frate(zi);
  if (r.blow >= eatLine()) return false;
  if (zoneRatio(zi) < (lim || 0.9) && (r.hpLoss === 0 || r.deathT > 2 * 3600)) return true;
  return zoneRatio(zi) < 4 && !!foodCost(zi);
}
const zoneXph = (zi) => frate(zi).xp.character * 3600;
// XP per hour once the time to make the food it eats is counted
const zoneEff = (zi) => { const c = foodCost(zi); return zoneXph(zi) / (1 + (c ? c.prodPerS : 0)); };
// The best XP is in the hardest stages you can hold: from the last unlocked stage down, the best of the
// first three that pass.
const BXZ = { key: null, zi: 0 };
function bestXpZone() {
  const k = powerKey();
  if (BXZ.key === k) return BXZ.zi;
  let best = null, bv = 0, seen = 0;
  for (let zi = ZONES.length - 1; zi >= 0 && seen < 4; zi--) {
    const z = ZONES[zi];
    if (z.boss || !zoneUnlocked(zi) || !zoneOk(zi, 0.7)) continue;
    seen++;
    const v = zoneEff(zi); if (v > bv) { bv = v; best = zi; }
  }
  BXZ.key = k; BXZ.zi = best == null ? 0 : best;
  return BXZ.zi;
}

/* ------------------------------------------------------------ food */
function foodGatherable(id, d) {
  d = d || 0; if (d > 3) return false;
  for (const p of PROD[id] || []) {
    if (!skillOpen(p.skill) || skillLv(p.skill) < p.act.level || (p.act.schem && !S.known[p.act.schem])) continue;
    if (!p.act.in) return true;
    if (Object.keys(p.act.in).every((k) => foodGatherable(k, d + 1))) return true;
  }
  for (const p of EXTRA[id] || []) if (skillOpen(p.skill) && skillLv(p.skill) >= p.act.level && !p.act.in) return true;
  return false;
}
function bestFood() {
  let best = null;
  for (const id in ITEMS) {
    const it = ITEMS[id];
    if (it.type !== 'food' || it.variant || !foodGatherable(id)) continue;
    if (!best || it.heal > ITEMS[best].heal) best = id;
  }
  return best;
}
const OF = { k: null, v: null };
function ownedFood() {
  const k = EPOCH + '|' + Object.keys(S.items).length;
  if (OF.k === k) return OF.v;
  OF.k = k; return (OF.v = ownedFoodNow());
}
function ownedFoodNow() {
  let best = null;
  for (const id in S.items) { const it = ITEMS[id]; if (it && it.type === 'food' && S.items[id] >= 5 && (!best || foodHeal(id) > foodHeal(best))) best = id; }
  return best;
}
const foodStock = () => Object.keys(S.items).filter((k) => ITEMS[k] && ITEMS[k].type === 'food').reduce((a, k) => a + S.items[k], 0);

/* ------------------------------------------------------------ obtaining things */
function trainTask(skill) {
  if (!skillOpen(skill)) return unlockTask('skill:' + skill);
  const s = SKILLS[skill];
  if (skill === 'character') return fightTask(bestXpZone());
  if (skill === 'farming' || skill === 'voyaging') return null;   // background systems level them
  const acts = s.actions.filter((a) => skillLv(skill) >= a.level && (!a.schem || S.known[a.schem]) && !actionBlock(skill, a) && !a.beast && a.id !== 'awaken');
  // XP per second, counting ~4 s of gathering behind each input unit (or gear recipes look like free XP)
  // La Forge: a piece never crafted pays its first-craft lump once (the task stops after one)
  const outOf = (a) => Object.keys(a.out || {})[0], fresh = (a) => a.first > 0 && !(S.stats.made[outOf(a)] >= 1 - 1e-6);
  const eff = (a) => (a.xp + (fresh(a) ? a.first : 0)) / (a.time + (a.in ? Object.values(a.in).reduce((t, n) => t + 4 * n, 0) : 0));
  acts.sort((a, b) => eff(b) - eff(a));
  for (const a of acts) {
    if (!a.in || canAfford(a.in) || chainRates(skill, a, 0, true)) return Object.assign({ kind: 'act', skill, id: a.id }, fresh(a) ? { want: { id: outOf(a), n: stock(outOf(a)) + 1 } } : {});
    if (Object.keys(a.in).every((k) => foodGatherable(k))) {
      for (const k in a.in) if (stock(k) < a.in[k]) return needTask(k, a.in[k] * 60, 1);
    }
  }
  return null;
}
function schemTask(sid) {
  let best = null, bv = 0;
  for (const s of DROPS[sid] || []) { if (!zoneOk(s.zi)) continue; const v = s.ch / s.n * frate(s.zi).kps; if (v > bv) { bv = v; best = s.zi; } }
  return best == null ? null : Object.assign(fightTask(best), { key: { id: sid, n: 1, schem: true } });
}
// A closed skill whose unlock asks for a level in another one ("Mining 5 opens Smelting"): train that.
function unlockTask(key) {
  const u = UNLOCKS.find((x) => x.id === key);
  const m = u && /skillLv\('(\w+)'\)\s*>=\s*(\d+)/.exec(String(u.need));
  if (!m || skillLv(m[1]) >= +m[2]) return null;
  return m[1] === 'character' ? fightTask(bestXpZone()) : trainTask(m[1]);
}
function needTask(id, n, d) {
  d = d || 0;
  if (stock(id) >= n || d > 8) return null;
  for (const p of PROD[id] || []) if (!skillOpen(p.skill) && !p.act.beast) { const t = unlockTask('skill:' + p.skill); if (t) return t; }
  const prods = (PROD[id] || []).filter((p) => skillOpen(p.skill) && !p.act.beast);
  prods.sort((a, b) => a.act.level - b.act.level);
  for (const p of prods) {
    const a = p.act;
    if (a.schem && !S.known[a.schem]) { const t = schemTask(a.schem); if (t) return t; continue; }
    if (skillLv(p.skill) < a.level) { const t = trainTask(p.skill); if (t) return t; continue; }
    if (actionBlock(p.skill, a)) continue;
    const crafts = Math.min(60, Math.ceil((n - stock(id)) / p.q));
    if (a.in && !canAfford(a.in) && chainRates(p.skill, a, 0, true)) return { kind: 'act', skill: p.skill, id: a.id, want: { id, n } };
    for (const k in a.in || {}) if (stock(k) < a.in[k]) { const t = needTask(k, a.in[k] * crafts, d + 1); if (t) return t; return null; }
    if (p.skill === 'voyaging') return null;
    return { kind: 'act', skill: p.skill, id: a.id, want: { id, n } };
  }
  // by-products of an action, or combat drops: the faster source
  let best = null, bv = 0;
  for (const p of EXTRA[id] || []) {
    if (!skillOpen(p.skill) || skillLv(p.skill) < p.act.level || p.act.in) continue;
    const v = p.ch * p.avg / p.act.time;
    if (v > bv) { bv = v; best = p; }
  }
  let bz = null, bzv = 0;
  for (const s of DROPS[id] || []) {
    if (!zoneOk(s.zi)) continue;
    const v = Math.min(1, s.ch * luckMult()) * s.avg / s.n * frate(s.zi).kps;
    if (v > bzv) { bzv = v; bz = s.zi; }
  }
  const key = isKey(id, n) ? { id, n } : null;
  if (best && bv >= bzv) return { kind: 'act', skill: best.skill, id: best.act.id, want: { id, n }, key };
  if (bz != null) return Object.assign(fightTask(bz), { want: { id, n }, key });
  if (typeof CROP_BY !== 'undefined' && CROP_BY[id]) return { kind: 'wait', why: 'crops: ' + id, want: { id, n } };
  P.note['no source: ' + id] = (P.note['no source: ' + id] || 0) + 1;
  return null;
}
function fightTask(zi) { return zi == null ? null : { kind: 'fight', zi }; }

/* ------------------------------------------------------------ getting stronger */
function evalWith(slot, id, u, zi) {
  const keep = S.equip[slot], keepU = S.equipU;
  S.equip[slot] = id; if (slot === 'weapon') S.equipU = u;
  const r = zoneRatio(zi);
  S.equip[slot] = keep; S.equipU = keepU;
  return r;
}
// equipBest is the costliest step: it runs again only when your gear, level band or target changes.
// The choice is remembered per (target, level band, gear owned) and simply put back on.
const EB = new Map();
function equipBest(zi) {
  const owned = Object.keys(S.items).filter((k) => ITEMS[k] && ITEMS[k].type === 'equip' && S.items[k] >= 1);
  const sig = ZONES[zi].realm + (ZONES[zi].boss ? 'B' : '') + '|' + Math.floor(charLv() / 15) + '|' + S.arms.map((a) => a.u + ':' + a.ref + a.awk).join(',') + '|' + owned.concat([S.equip.armor, S.equip.accessory]).sort().join(',');
  const got = EB.get(sig);
  if (got) {
    if (got.u && S.equipU !== got.u && S.arms.some((a) => a.u === got.u)) equipArm(got.u);
    for (const slot of ['armor', 'accessory']) if (got[slot] && S.equip[slot] !== got[slot] && count(got[slot]) >= 1) equip(got[slot]);
    return;
  }
  equipBestNow(zi);
  EB.set(sig, { u: S.equipU, armor: S.equip.armor, accessory: S.equip.accessory });
}
function equipBestNow(zi) {
  for (const slot of ['weapon', 'armor', 'accessory']) {
    let best = null, bu = null, br = evalWith(slot, S.equip[slot], S.equipU, zi);
    if (slot === 'weapon') {
      for (const a of S.arms.slice().sort((x, y) => armBaseAtk(y) - armBaseAtk(x)).slice(0, 2)) { const r = evalWith(slot, a.id, a.u, zi); if (r < br - 1e-9) { br = r; best = a.id; bu = a.u; } }
      if (bu) equipArm(bu);
    } else {
      const cands = Object.keys(S.items).filter((id) => ITEMS[id] && ITEMS[id].type === 'equip' && ITEMS[id].slot === slot && S.items[id] >= 1).sort((x, y) => gearScore(y) - gearScore(x)).slice(0, 2);
      for (const id of cands) { const r = evalWith(slot, id, null, zi); if (r < br - 1e-9) { br = r; best = id; } }
      if (best) equip(best);
    }
  }
}
// The world's armour and accessory for a guardian: the best crafted pieces of the stages between the
// previous guardian and this one. worldGearEat: your auto-eat line (and defense) if you wore them.
function worldGear(zi) {
  const lo = ZONES.slice(0, zi).map((z, i) => (z.boss && !z.dungeon ? i : -1)).filter((i) => i >= 0).pop();
  const best = {};
  for (const id in PROD) {
    const it = ITEMS[id];
    if (!it || it.type !== 'equip' || !['armor', 'accessory'].includes(it.slot) || it.stage == null) continue;
    if (it.stage > zi + 0.7 || it.stage < (lo == null ? 0 : lo)) continue;
    if (!PROD[id].some((p) => SKILLS[p.skill].type === 'craft')) continue;
    const v = (it.stats.hp || 0) + 4 * (it.stats.def || 0);
    if (!best[it.slot] || v > best[it.slot].v) best[it.slot] = { id, v };
  }
  return { armor: best.armor && best.armor.id, accessory: best.accessory && best.accessory.id };
}
function worldGearEat(zi) {
  const g = worldGear(zi), keep = { armor: S.equip.armor, accessory: S.equip.accessory };
  if (g.armor) S.equip.armor = g.armor;
  if (g.accessory) S.equip.accessory = g.accessory;
  const r = { eat: autoEatThreshold() * pMaxHp(), def: pDef(), taken: hmul('taken'), gear: g };
  S.equip.armor = keep.armor; S.equip.accessory = keep.accessory;
  return r;
}
function gearProject(zi) {
  const cur = zoneRatio(zi);
  let best = null, bg = 0.04;
  for (const id in PROD) {
    const it = ITEMS[id];
    if (!it || it.type !== 'equip' || count(id) >= 1 || S.equip[it.slot] === id) continue;
    const p = PROD[id].find((x) => skillOpen(x.skill));
    if (!p || (p.act.schem && !S.known[p.act.schem]) || skillLv(p.skill) + 5 < p.act.level) continue;
    if (p.act.in && !Object.keys(p.act.in).every((k) => stock(k) >= p.act.in[k] || producerOf(k) || (DROPS[k] || []).some((s) => zoneUnlocked(s.zi)))) continue;
    if (P.noProj[id] > simH()) continue;
    const g = cur / evalWith(it.slot, id, null, zi) - 1;
    if (g > bg) { bg = g; best = id; }
  }
  return best;
}
function refineTask() {
  const a = curArm();
  if (!a || !forgeOn()) return null;
  const why = refReason(a);
  if (!why) { refine(a.u); return null; }
  if (why === 'Missing materials') { const c = refCost(a); for (const k in c) if (stock(k) < c[k]) return needTask(k, c[k] + 6); }
  if (why === 'Not enough gold') P.goldWant = { what: 'refine +' + (a.ref + 1), g: refGold(a) };
  return null;
}
function powerUp(zi) {
  // half the time goes to fighting for Character XP (30-minute blocks), half to gear and refining
  if (Math.floor(simH() * 2) % 2 === 0 && featureOpen('battle')) return fightTask(bestXpZone());
  if (!P.proj || P.proj.until < simH() || count(P.proj.id) >= 1 || S.equip[ITEMS[P.proj.id].slot] === P.proj.id) {
    const id = gearProject(zi);
    P.proj = id ? { id, until: simH() + 4 } : null;
    if (id) plog(`project ${id} for ${ZONES[zi].id}`);
  }
  if (P.proj) {
    const t = needTask(P.proj.id, 1);
    if (t) return t;
    P.noProj[P.proj.id] = simH() + 6; P.proj = null;
  }
  P.refineFlip = !P.refineFlip;               // deterministic: refine every other time
  const r = refineTask();
  if (r && P.refineFlip) return r;
  return fightTask(bestXpZone());
}
function combatGoal(zi) {
  if (zi < 0) return null;
  if (!zoneUnlocked(zi)) { let k = zi - 1; while (k > 0 && !zoneUnlocked(k)) k--; return combatGoal(k); }
  equipBest(zi);
  if (zoneOk(zi, 0.85)) return fightTask(zi);
  // a guardian you could survive blow by blow, but not to the end: cook enough for the whole fight
  if (ZONES[zi].boss && zoneUnlocked(zi) && frate(zi).blow < eatLine()) {
    const bf = ownedFood() || bestFood();
    if (bf) { const n = Math.ceil(frate(zi).worstFight / Math.max(1, foodHeal(bf)) * 1.2); if (foodStock() < n) { const t = needTask(bf, n); if (t) return Object.assign(t, { forFood: true }); } }
  }
  // a guardian whose blow you cannot stand yet: its world's armour and accessory first
  if (ZONES[zi].boss && frate(zi).blow >= eatLine()) {
    const g = worldGear(zi);
    for (const slot of ['armor', 'accessory']) { const id = g[slot]; if (id && S.equip[slot] !== id && count(id) < 1 && !(P.noProj[id] > simH())) { const t = needTask(id, 1); if (t) return t; P.noProj[id] = simH() + 6; } }
  }
  return powerUp(zi);
}

/* ------------------------------------------------------------ the quest at hand */
function questTask() {
  const st = goalState();
  if (!st) return null;
  const g = st.g, txt = g.text, rem = g.n - st.cur;
  if (/^dg_/.test(g.id || '')) {
    const id = g.id.slice(3), d = DG_BY[id], gzi = ZONES.findIndex((z) => z.id === d.guard);
    equipBest(gzi);
    const r = dungeonRates(id);
    if (!r.ok) {
      // survivable blow by blow but short of food: cook what the five rooms eat (×1.3), else get stronger
      const bf = ownedFood() || bestFood();
      if (bf && r.blowOk) { const n = Math.ceil(r.dmg / Math.max(1, foodHeal(bf)) * 1.3); if (foodStock() < n) { const t = needTask(bf, n); if (t) return Object.assign(t, { forFood: true }); } }
      return powerUp(gzi);
    }
    if (count(dgKey(id)) < 1) return needTask(dgKey(id), 1) || fightTask(gzi);
    return { kind: 'dungeon', id };
  }
  if (/^Wear a weapon, an armor/.test(txt)) {
    for (const slot of ['armor', 'accessory']) {
      if (S.equip[slot]) continue;
      const own = Object.keys(S.items).find((k) => ITEMS[k] && ITEMS[k].type === 'equip' && ITEMS[k].slot === slot && S.items[k] >= 1);
      if (own) { equip(own); continue; }
      const rec = SKILLS.arts.actions.filter((a) => a.out && ITEMS[Object.keys(a.out)[0]].slot === slot && !a.schem && a.level <= skillLv('arts')).sort((x, y) => x.level - y.level)[0];
      if (rec) return needTask(Object.keys(rec.out)[0], 1);
    }
    return fightTask(bestXpZone());
  }
  const R = introspect(g);
  P.energyFocus = /Reiatsu/.test(txt) ? 'reiatsu' : null;
  if (R.gate) {
    const gs = gateState(R.gate);
    if (!gs.boss) return combatGoal(ZONES.findIndex((z) => z.id === gs.g.boss));
    for (const k in gs.g.offer) if (stock(k) < gs.g.offer[k]) return needTask(k, gs.g.offer[k]);
    return null;
  }
  if (R.kills) return combatGoal(ZONES.findIndex((z) => z.id === R.kills));
  if (R.lvl) return R.lvl === 'character' ? fightTask(bestXpZone()) : trainTask(R.lvl);
  if (R.made) return needTask(R.made, stock(R.made) + rem);
  if (/Character level/.test(txt)) return fightTask(bestXpZone());
  if (/technique|Domain Expansion/.test(txt)) {
    if (/Domain/.test(txt)) { const zi = ZONES.map((z, i) => i).filter((i) => ZONES[i].realm === 'hex' && zoneOk(i, 0.8)).pop(); return fightTask(zi != null ? zi : bestXpZone()); }
    return fightTask(bestXpZone());
  }
  if (/Equip|Buy any upgrade|energy into/.test(txt)) { if (!featureOpen('battle') || /food/.test(txt)) return needTask('soldier_pill', 10); return fightTask(bestXpZone()); }
  if (/schematic/.test(txt)) { const sids = Object.keys(DROPS).filter((k) => ITEMS[k] && ITEMS[k].type === 'schematic' && !S.known[k]); for (const s of sids) { const t = schemTask(s); if (t) return t; } return fightTask(bestXpZone()); }
  if (/Season/.test(txt)) { const sp = typeof SPICES !== 'undefined' && Object.keys(SPICES).find((k) => count(SPICES[k].item) >= 1); if (sp && S.kitchen.spice !== sp) pickSpice(sp); return trainTask(sp ? 'cooking' : 'fishing'); }
  if (/voyages/.test(txt)) return trainTask('cooking') || trainTask('fishing');
  if (/Perfect dish/.test(txt)) return Object.assign(trainTask('cooking') || {}, { special: 'perfect' });
  if (/Shiny fish/.test(txt)) return Object.assign(trainTask('fishing') || {}, { special: 'shiny' });
  if (/Refine a weapon/.test(txt)) { const a = curArm(); if (a && armLv(a) < 5) return fightTask(bestXpZone()); return refineTask() || fightTask(bestXpZone()); }
  if (/Awaken a weapon/.test(txt)) {
    const a = curArm();
    if (!a) return fightTask(bestXpZone());
    if (armLv(a) < AWK[1].lv || a.ref < AWK[1].ref) { const r = refineTask(); if (r && armLv(a) >= 5 * (a.ref + 1)) return r; return fightTask(bestXpZone()); }
    const c = awkCost(a); for (const k in c) if (stock(k) < c[k]) return needTask(k, c[k]);
    return null;
  }
  if (/Reiatsu|Renown/.test(txt)) { const zi = ZONES.map((z, i) => i).filter((i) => ZONES[i].realm === frontier() && zoneOk(i, 0.7)).pop(); return zi != null ? fightTask(zi) : trainTask('mining'); }
  if (/first crop/.test(txt)) { const c = CROPS.find((x) => count(x.seed) >= 1); if (c) return trainTask('gravity'); return needTask(CROPS[0].seed, 1) || trainTask('gravity'); }
  if (/tool with ki/.test(txt)) { const t = Object.keys(ITEMS).filter((k) => ITEMS[k].type === 'tool' && PROD[k]).sort((a, b) => PROD[a][0].act.level - PROD[b][0].act.level); for (const k of t) { const r = needTask(k, 1); if (r) return r; } return trainTask('gravity'); }
  if (/Time Chamber/.test(txt)) return trainTask('gravity');
  if (/Transform/.test(txt)) return fightTask(bestXpZone());
  if (/Binding Vow/.test(txt)) return trainTask('exorcism');
  if (/first companion/.test(txt)) {
    const acts = SKILLS.tracking.actions.filter((a) => a.beast && skillLv('tracking') >= a.level).sort((a, b) => a.level - b.level);
    for (const a of acts) { if (canAfford(a.in)) return { kind: 'act', skill: 'tracking', id: a.id }; for (const k in a.in) { const t = needTask(k, a.in[k]); if (t) return t; } }
    return trainTask('tracking');
  }
  if (/contracts/.test(txt)) return { kind: 'unmodelled', why: 'contracts are random draws' };
  if (/Awaken an Echo/.test(txt)) { if (count('awakening_shard') >= 3) return { kind: 'act', skill: 'bonding', id: 'awaken' }; return needTask('awakening_shard', 3); }
  if (/Echo a task/.test(txt)) return { kind: 'unmodelled', why: 'Echo tasks are not modelled' };
  if (/Restore an artifact/.test(txt)) {
    const acts = SKILLS.restoration.actions.filter((a) => skillLv('restoration') >= a.level).sort((a, b) => a.level - b.level);
    for (const a of acts) if (canAfford(a.in)) return { kind: 'act', skill: 'restoration', id: a.id };
    for (const a of acts) for (const k in a.in) if (stock(k) < a.in[k]) { const t = needTask(k, a.in[k]); if (t) return t; }
    return trainTask('archaeology');
  }
  if (/Shenron/.test(txt)) return { kind: 'unmodelled', why: 'the seven balls are random finds' };
  if (/Devil Fruit/.test(txt)) { const zi = ZONES.map((z, i) => i).filter((i) => ZONES[i].boss && ZONES[i].realm === 'seas' && zoneOk(i, 0.6)).pop(); return zi != null ? Object.assign(fightTask(zi), { key: { id: FRUITS[0], n: 1, fruit: true } }) : null; }
  return null;
}

/* ------------------------------------------------------------ housekeeping (deterministic) */
// Scrolls are read in expectation: each one adds its draw odds to the techniques of its world; a
// technique gets its levels as the expected count crosses whole numbers. Cursed Fragments level the
// weakest equipped technique. Then the loadout: best per slot kind.
const TEV = {};
function bestTechs() {
  for (const id of scrollIds()) {
    const n = Math.floor(count(id)), odds = scrollOdds(id);
    if (!n || !odds.length) continue;
    removeItem(id, n);
    for (const [t, p] of odds) TEV[t] = (TEV[t] || 0) + p * n;
  }
  for (const t in TEV) { const L = Math.min(TECH_MAX, Math.floor(TEV[t] + 1e-9)); while (techLv(t) < L) if (!gainTech(t, 'sim')) break; }
  let g = 0;
  while (count('cursed_fragment') >= CURSED_PER_LEVEL && g++ < 20) {
    const t = equipped().filter((x) => techLv(x) < TECH_MAX).sort((x, y) => techLv(x) - techLv(y))[0];
    if (!t || !infuseTech(t)) break;
    TEV[t] = Math.max(TEV[t] || 0, techLv(t));
  }
  const known = Object.keys(S.tech.lv).filter((id) => techLv(id));
  const W = { attack: 2.6, defense: 3.5, support: 2 };
  const by = (kind) => known.filter((x) => techKind(x) === kind);
  const L = loadout();
  const fill = (kind, ids) => { const open = openSlots().filter((s) => s.kind === kind); open.forEach((s, k) => { L[s.i] = ids[k] || null; }); };
  const def = by('active').filter((x) => TECHNIQUES[x].cat === 'defense').sort((x, y) => techLv(y) - techLv(x))[0];
  const act = (def ? [def] : []).concat(by('active').filter((x) => x !== def).sort((x, y) => techLv(y) * W[TECHNIQUES[y].cat] - techLv(x) * W[TECHNIQUES[x].cat]));
  const nAct = openSlots().filter((s) => s.kind === 'active').length;
  const pickA = act.slice(0, nAct).sort((x, y) => (TECHNIQUES[x].cat === 'defense') - (TECHNIQUES[y].cat === 'defense'));
  fill('active', pickA);
  fill('passive', by('passive').sort((x, y) => techLv(y) - techLv(x)));
  fill('ultimate', by('ultimate').sort((x, y) => techLv(y) - techLv(x)));
}
// Spending: the player keeps a reserve; what could not be bought is noted for the bottleneck report.
function housekeeping(H) {
  checkUnlocks();
  let g = 0; while (goalState() && goalState().done && g++ < 5) claimGoal();
  for (const r of GATE_ORDER) if (gateState(r).ready) { openGate(r); plog('GATE ' + r); H.event('gate ' + r); }
  checkUnlocks();
  for (const id of Object.keys(S.items)) if (ITEMS[id] && ITEMS[id].type === 'chest' && S.items[id] >= 1) openChestEV(id, Math.floor(S.items[id]));
  const fr0 = FRUITS.filter((f) => count(f) >= 1);
  if (fr0.length) { const pref = ['quake_fruit', 'ember_fruit', 'colossus_fruit', 'mist_fruit', 'bloom_fruit', 'gilded_fruit']; if (!S.fruit) eatFruit(pref.find((f) => count(f) >= 1)); else if (count(S.fruit) >= 1 && fruitRank() < FRUIT_RANK_MAX) eatFruit(S.fruit); }
  if (featureOpen('power')) {
    // a player buys when it is affordable and keeps a small reserve (energy: half the purse, Market: 80%)
    if (capCost() < S.gold * 0.5) buyCap(); else H.want('energy cap', capCost());
    if (powCost() < S.gold * 0.5) buyPow(); else H.want('energy power', powCost());
    const open = TRAININGS.filter(disciplineOpen);
    if (energyIdle() > 0 && open.length) {
      releaseAll(); const per = Math.floor(energyCap() / open.length);
      for (const t of open) S.energy.alloc[t.id] = per;
      const focus = P.energyFocus && open.find((t) => t.id === P.energyFocus);
      if (focus) { releaseAll(); S.energy.alloc[focus.id] = energyCap(); }
    }
  }
  if (featureOpen('market')) for (const it of SHOP) {
    if (it.give || (it.realm && !realmOpen(it.realm))) continue;
    if (it.id.startsWith('tools_') && !realmOpen(it.id.slice(6))) continue;
    const c = shopCost(it);
    if (c === undefined) continue;
    if (c < S.gold * 0.8) buyShop(it.id); else H.want('market ' + it.id, c);
  }
  bestTechs();
  if (typeof FORMS !== 'undefined' && transformOn()) { const f = FORMS.filter(formOpen).pop(); if (f && S.ki.form !== f.id) chooseForm(f.id); }
  if (typeof BEASTS !== 'undefined' && S.beasts) { const own = Object.keys(S.beasts).sort((a, b) => beastVal(b) - beastVal(a)); for (const id of own.slice(0, compSlots())) if (!isCompanion(id)) setCompanion(id); }
  const a = curArm();
  if (a && forgeOn()) {
    if (!refReason(a)) refine(a.u); else if (refReason(a) === 'Not enough gold') H.want('forge refine +' + (a.ref + 1), refGold(a));
    if (!awkReason(a)) awakenArm(a.u, 'fire'); else if (awkReason(a) === 'Not enough gold') H.want('forge awakening ' + (a.awk + 1), awkGold(a));
  }
  if (pactsOn()) { const want = goalState() && /Binding Vow/.test(goalState().g.text); if (want !== pactOn('poverty')) togglePact('poverty'); }
  equipBest(S.combat.zone != null ? S.combat.zone : P.lastZone || 0);
  const f = ownedFood() || Object.keys(S.items).find((k) => ITEMS[k] && ITEMS[k].type === 'food' && S.items[k] >= 1); if (f) S.combat.food = f;
}
// Food: a fight that costs HP needs a stock that lasts. The bot keeps enough of its best food for
// FOOD_HOURS of that fight (an offline night included) and cooks before it goes back to fighting.
const FOOD_HOURS = 12, FOOD_CAP = 1500;
function foodNeed(zi) {
  const r = frate(zi), bf = ownedFood() || bestFood();
  if (!(r.hpLoss > 0) || !bf || ZONES[zi].boss) return null;     // guardians: combatGoal sizes the stock
  return { id: bf, n: Math.min(FOOD_CAP, Math.ceil(r.hpLoss * FOOD_HOURS * 3600 * REST_PACE / Math.max(1, foodHeal(bf)))) };
}
function withFood(t) {
  if (!t || t.kind !== 'fight') return t;
  const need = foodNeed(t.zi);
  if (!need) return t;
  const have = foodStock(), low = have < need.n * 0.25;
  // below a quarter of the target: cook first; otherwise top the stock up during sessions
  if (low || (have < need.n && !MAC.night && sched().toNext < 1800)) { const f = needTask(need.id, need.n); if (f) { MAC.foodWant = true; return Object.assign(f, { forFood: true }); } }
  return t;
}
// La Forge (P1): a player crafts each new piece once, for its first-craft XP: at once when the materials are
// in the bank, or after a short gathering trip (60 units at most, gathered or crafted, never a rare drop).
function forgeTask() {
  if (!skillOpen('arts') || MAC.night) return null;
  const lv = skillLv('arts');
  let best = null, bc = Infinity;
  for (const a of SKILLS.arts.actions) {
    if (!(a.first > 0) || a.level > lv || (a.schem && !S.known[a.schem]) || actionBlock('arts', a)) continue;
    const o = Object.keys(a.out)[0];
    if (S.stats.made[o] >= 1 - 1e-6) continue;
    const miss = Object.keys(a.in || {}).reduce((t, k) => t + Math.max(0, a.in[k] - stock(k)), 0);
    if (miss < bc) { bc = miss; best = a; }
  }
  if (!best) return null;
  const o = Object.keys(best.out)[0];
  if (bc <= 0) return { kind: 'act', skill: 'arts', id: best.id, want: { id: o, n: stock(o) + 1 } };
  if (bc > 60) return null;
  for (const k in best.in) if (stock(k) < best.in[k]) return producerOf(k) ? needTask(k, best.in[k]) : null;
  return null;
}
function plan() {
  let t = null;
  try { t = questTask(); } catch (e) { plog('ERR ' + e.message); P.note['planner error: ' + e.message] = (P.note['planner error: ' + e.message] || 0) + 1; }
  // nothing to do for this step: the time goes to the best XP fight (or the step's own skill)
  if (t && t.kind === 'unmodelled') return t;
  if (!t || (!t.kind && !t.special)) {
    const st = goalState(), id = st && st.g.id;
    if (id) P.note['no plan: ' + id] = (P.note['no plan: ' + id] || 0) + 1;
    t = featureOpen('battle') && zoneOk(bestXpZone(), 0.9) ? fightTask(bestXpZone()) : trainTask('woodcutting');
  }
  if (t && (t.kind === 'fight' || t.kind === 'act') && !t.forFood && !t.key && !(t.kind === 'fight' && ZONES[t.zi].boss)) { const f = forgeTask(); if (f) t = f; }
  return withFood(t);
}
