'use strict';
/* ==========================================================================
   Analytic evaluators: pure functions of the current state S, no time loop, no random roll.
   Every rate is per second of game time, in expectation:
   - actRates(skill, act): XP/s, inputs/s (minus the expected free crafts), outputs/s (doubles in
     expectation), by-products and rare finds as expected items/s.
   - fightRates(zi): DPS (auto-attacks + equipped techniques), kills/s with respawn, Character XP/s,
     gold/s, drops/s (Elites 1 in 20 and the Alpha every 50th foe included), HP lost/s once regen is
     counted, food/s, and the survival check (worst blow × defense < auto-eat threshold).
   - dungeonRates(id): one five-room run, no regen: time, damage, food, rewards.
   - shipRates() / farmRates(): the background systems (voyages, crops) as rates.
   Expected values of the special loot ids: 'GEM' = GEM_TABLE by weight, 'FRUIT' = FRUITS evenly.
   ========================================================================== */

const avgQ = (q) => (q[0] + q[1]) / 2;
// Speed: between two jumps the state only changes through gear swaps (equipBest tries them), so the stat
// helpers are memoised per (EPOCH, worn gear). macro.js bumps EPOCH after every jump and every spend.
let EPOCH = 0, EQV = 0;
// gear swaps bump EQV (equip / equipArm, and the planner's trial swaps)
{ const e1 = equip, e2 = equipArm; equip = function (...a) { EQV++; return e1.apply(this, a); }; equipArm = function (...a) { EQV++; return e2.apply(this, a); }; }
// one cache per gear combination (trial swaps go back and forth), all dropped when EPOCH moves
let MEMO_W, MEMO_A, MEMO_C, MEMO_U, MEMO_K = '';
const memoCombo = () => {
  const E = S.equip;
  if (E.weapon !== MEMO_W || E.armor !== MEMO_A || E.accessory !== MEMO_C || S.equipU !== MEMO_U) { MEMO_W = E.weapon; MEMO_A = E.armor; MEMO_C = E.accessory; MEMO_U = S.equipU; MEMO_K = MEMO_W + '|' + MEMO_A + '|' + MEMO_C + '|' + MEMO_U; }
  return MEMO_K;
};
const memo = (fn) => {
  let ep = -1, cas = null, combos = new Map();
  return function (a0, a1) {
    if (RT.fx && RT.fx.domain > 0) return fn.apply(this, arguments);
    if (ep !== EPOCH || cas !== RT.casting) { ep = EPOCH; cas = RT.casting; combos.clear(); }
    const ck0 = memoCombo();
    let cache = combos.get(ck0);
    if (!cache) { cache = new Map(); combos.set(ck0, cache); }
    const ck = a1 === undefined ? a0 : a0 + ',' + a1;
    let v = cache.get(ck);
    if (v === undefined) { v = fn.apply(this, arguments); cache.set(ck, v); }
    return v;
  };
};
hmul = memo(hmul); hadd = memo(hadd); gearStat = memo(gearStat);
// helpers that do not depend on the worn gear: one cache per EPOCH
const memoE = (fn) => {
  let ep = -1, cache = new Map();
  return function (a0, a1) {
    if (ep !== EPOCH) { ep = EPOCH; cache.clear(); }
    const ck = a1 === undefined ? a0 : a0 + ',' + a1;
    let v = cache.get(ck);
    if (v === undefined) { v = fn.apply(this, arguments); cache.set(ck, v); }
    return v;
  };
};
skPerk = memoE(skPerk); synergyBonus = memoE(synergyBonus); fruitFx = memoE(fruitFx); bountyRank = memoE(bountyRank); milestoneFx = memoE(milestoneFx);
compFx = memoE(compFx);
dmgMult = memo(dmgMult); hpMult = memo(hpMult); defMult = memo(defMult); goldMult = memo(goldMult); skillSpeed = memo(skillSpeed);
// Set bonuses depend only on what you wear; the engine recomputes them on every stat read.
{
  const base = setFx, byCombo = new Map();
  setFx = function (k) {
    const kk = memoCombo();
    let c = byCombo.get(kk);
    if (!c) { c = {}; byCombo.set(kk, c); }
    return k in c ? c[k] : (c[k] = base(k));
  };
}
// The collection tiers move only when something new is found.
{
  const base = colTiers;
  let n = -1, v = null;
  colTiers = function () { const m = Object.keys(S.found).length; if (m !== n) { n = m; v = base(); } return v; };
}
const addTo = (o, k, v) => { if (v) o[k] = (o[k] || 0) + v; };
// Spread an expected count of a loot id over the real items.
function addLoot(o, id, n) {
  if (!n) return;
  if (id === 'GEM') { const tot = GEM_TABLE.reduce((a, g) => a + g[1], 0); for (const [g, w] of GEM_TABLE) addTo(o, g, n * w / tot); return; }
  if (id === 'FRUIT') { for (const f of FRUITS) addTo(o, f, n / FRUITS.length); return; }
  addTo(o, id, n);
}

/* ------------------------------------------------------------ skilling and crafting */
// cached per EPOCH (a jump or a spend changes the inputs); callers that edit the result clone it first
const AR = { ep: -1, eq: '', m: new Map() };
function actRates(skill, a) {
  const eq = memoCombo() + '|' + (S.kitchen && S.kitchen.spice);
  if (AR.ep !== EPOCH || AR.eq !== eq) { AR.ep = EPOCH; AR.eq = eq; AR.m.clear(); }
  const k = skill + ':' + a.id;
  let r = AR.m.get(k);
  if (!r) { r = actRatesNow(skill, a); AR.m.set(k, r); }
  return r;
}
const cloneRates = (r) => Object.assign({}, r, { xp: Object.assign({}, r.xp), inp: Object.assign({}, r.inp), out: Object.assign({}, r.out), made: Object.assign({}, r.made), renown: Object.assign({}, r.renown) });
function actRatesNow(skill, a) {
  const T = actionTime(skill, a), keep = a.in ? keepChance(skill, a) : 0, mult = 1 + doubleChance(skill, a.id);
  const r = { T, xp: { [skill]: a.xp * skillXpMult(skill) / T }, inp: {}, out: {}, made: {}, gold: 0, actions: 1 / T, key: skill + ':' + a.id };
  for (const k in a.in || {}) r.inp[k] = a.in[k] * (1 - keep) / T;
  r.renown = { [SKILLS[skill].realm]: 1 / T };
  // cooking with a spice picked: one spice per dish, and the dish counts as seasoned
  if (skill === 'cooking' && S.kitchen && S.kitchen.spice && SPICES[S.kitchen.spice]) {
    const sp = SPICES[S.kitchen.spice].item, dishes = Object.values(a.out || {}).reduce((x, n) => x + n, 0) * mult / T;
    if (count(sp) >= 1) { r.inp[sp] = (r.inp[sp] || 0) + dishes; r.seasoned = dishes; }
  }
  for (const k in a.out || {}) { r.out[k] = a.out[k] * mult / T; r.made[k] = r.out[k]; }
  const xm = a.extra ? extraMult(skill) : 1;
  for (const [k, ch, q] of a.extra || []) addLoot(r.out, k, Math.min(1, ch * xm) * avgQ(q) * mult / T);
  const up = skPerk(skill, 'up'), nx = up && nextNode(skill, a);
  if (nx) addTo(r.out, Object.keys(nx.out)[0], up / T);
  const rm = rareMult(skill);
  for (const [id, ch] of (RARE_FINDS[skill] || []).concat(GLOBAL_RARE)) addLoot(r.out, id, Math.min(1, ch * rm) / T);
  return r;
}

/* ------------------------------------------------------------ combat */
// Damage of one cast of an equipped technique against e (the engine's own CAST, with dealDamage counted
// instead of applied). Buffs and heals are not counted: only the damage.
// A cast's damage scales with your max hit: cached as a multiple of it, per technique level, foe defense
// and technique power.
const TCD = new Map();
function techCastDamage(id, e) {
  const L = techLv(id);
  if (!L || !CAST[id]) return 0;
  const mh = pMaxHit(), k = id + '|' + L + '|' + e.def + '|' + Math.round(techPower() * 1000) + '|' + Math.round(hmul('edef') * 1000);
  let m = TCD.get(k);
  if (m === undefined) { m = techCastProbe(id, e, L) / Math.max(1, mh); TCD.set(k, m); }
  return m * mh;
}
function techCastProbe(id, e, L) {
  const C = S.combat, keep = { enemy: C.enemy, eHp: C.eHp, hp: C.hp, zone: C.zone }, fx = Object.assign({}, RT.fx), dom = S.stats.domains, saved = dealDamage;
  let dmg = 0;
  dealDamage = (en, d) => { dmg += d; };
  C.enemy = 0; C.eHp = 1e18;
  RT.casting = id;
  try { CAST[id](e, L); } catch (err) { /* a cast that needs more battle state: counted as 0 */ }
  RT.casting = null; dealDamage = saved;
  Object.assign(C, keep); RT.fx = fx; S.stats.domains = dom;
  return dmg;
}
const kitTrait = (e, t) => { const k = typeof kitOf === 'function' ? kitOf(e) : null; return k && k.trait && k.trait[0] === t ? k.trait[1] : 0; };
// The hardest single blow: the kit's biggest move (or a full-roll normal swing), after your defense.
function maxBlow(e) {
  const k = typeof kitOf === 'function' ? kitOf(e) : null;
  let m = 1;
  if (k) for (const mv of (k.moves || []).concat((k.phases || []).map((p) => p.add).filter(Boolean))) m = Math.max(m, (mv.m || 0) * (mv.n > 1 ? 1 : 1));
  return e.atk * hmul('taken') * m * mitig(pDef());
}
function foeEval(e, techs) {
  const auto = 0.75 * pMaxHit() * mitig(e.def * hmul('edef')) / pSpeed() * (1 - kitTrait(e, 'evasive')) * (1 - kitTrait(e, 'armored'));
  let tech = 0;
  for (const id of techs) tech += techCastDamage(id, e) / Math.max(1, techCd(id));
  const dps = auto + tech, ttk = e.hp / Math.max(1e-9, dps);
  const inDps = 0.75 * e.atk * hmul('taken') * mitig(pDef()) * (1 - pDodge()) / (e.spd * hmul('espd', e));
  return { e, dps, ttk, inDps, dmgIn: inDps * ttk, blow: maxBlow(e) };
}
// A stage: foes are picked evenly; outside boss / dungeon stages 1 in 20 is an Elite and every 50th the Alpha.
function spawnMix(zi) {
  const z = ZONES[zi], n = z.enemies.length, out = [];
  const plain = z.boss || z.tear || z.dungeon;
  for (let i = 0; i < n; i++) {
    const e = enemyAt(zi, i);
    if (plain) { out.push([e, 1 / n]); continue; }
    out.push([e, (49 / 50) * 0.95 / n]);
    out.push([rankedEnemy(e, 1), (49 / 50) * 0.05 / n]);
  }
  if (!plain) out.push([rankedEnemy(enemyAt(zi, n - 1), 2), 1 / 50]);
  return out;
}
function dropsOf(e, luck, o, w) {
  for (const [id, ch, q] of e.drops) {
    if (ITEMS[id] && ITEMS[id].type === 'schematic') { if (!S.known[id]) addTo(o.schem, id, Math.min(1, ch * luck) * w); continue; }
    addLoot(o.drops, id, Math.min(1, ch < 0.2 ? ch * luck : ch) * avgQ(q) * w);
  }
}
function fightRates(zi) {
  const z = ZONES[zi], techs = equipped().filter((id) => ['attack', 'ultimate'].includes(TECHNIQUES[id].cat));
  const respawn = z.boss ? BOSS_RESPAWN : FOE_RESPAWN, luck = luckMult(), gm = goldMult(), xm = skillXpMult('character');
  const o = { drops: {}, schem: {} };
  let cyc = 0, xp = 0, gold = 0, dmg = 0, blow = 0, worstFight = 0, ttkMax = 0, wxp = 0, ren = 0;
  const plain = z.boss || z.tear || z.dungeon, n = z.enemies.length, ed = hmul('edef');
  const add = (e, w, f) => {
    cyc += w * (f.ttk + respawn); xp += w * e.xp * xm; gold += w * avgQ(e.gold) * gm; dmg += w * f.dmgIn; wxp += w * e.xp;
    dropsOf(e, luck, o, w);
  };
  for (let i = 0; i < n; i++) {
    const e = enemyAt(zi, i), f = foeEval(e, techs);
    blow = Math.max(blow, f.blow); worstFight = Math.max(worstFight, f.dmgIn); ttkMax = Math.max(ttkMax, f.ttk);
    if (plain) { add(e, 1 / n, f); continue; }
    add(e, (49 / 50) * 0.95 / n, f);
    // the Elite version, scaled from the plain one (RANK[1]: HP, attack, defense, rewards)
    const R1 = RANK[1], el = rankedEnemy(e, 1), dr = mitig(el.def * ed) / mitig(e.def * ed);
    const ttk = f.ttk * (el.hp / e.hp) / dr;
    add(el, (49 / 50) * 0.05 / n, { ttk, dmgIn: f.inDps * (el.atk / e.atk) * ttk });
  }
  if (!plain) { const al = rankedEnemy(enemyAt(zi, n - 1), 2); add(al, 1 / 50, foeEval(al, techs)); }
  const kps = 1 / cyc, max = pMaxHp(), regen = z.dungeon ? 0 : max * 0.008;
  // what the engine's kill hooks add: weapon XP, renown
  wxp *= (1 + discFx('wxp')) * kps;
  ren = (z.boss ? 25 : 1) * (1 + (typeof ascTier === 'function' ? ascTier(z.realm) : 0)) * kps;
  const hpLoss = Math.max(0, dmg * kps - regen);        // HP/s you cannot regenerate
  const food = S.combat.food && count(S.combat.food) > 0 ? S.combat.food : null, heal = food ? foodHeal(food) : 0;
  const thr = autoEatThreshold() * max;
  const r = { zi, kps, cycle: cyc, xp: { character: xp * kps }, gold: gold * kps, out: {}, inp: {}, made: {}, kills: { [z.id]: kps }, schem: {},
    hpLoss, blow, worstFight, ttkMax, food, heal, wxp, renown: { [z.realm]: ren } };
  for (const k in o.drops) r.out[k] = o.drops[k] * kps;
  for (const k in o.schem) r.schem[k] = o.schem[k] * kps;
  // survival: a blow must never take you from the auto-eat line to 0; without food, the HP pool must hold.
  if (food) {
    r.safe = blow < thr && worstFight < max * 4;
    r.inp[food] = hpLoss / Math.max(1, heal);
  } else {
    r.safe = blow < max && worstFight < max * 0.9;
    r.deathT = hpLoss > 0 ? max / hpLoss : Infinity;   // seconds until the regen deficit drops you
  }
  r.ratio = ttkMax * blow / Math.max(1, max);           // a rough danger index for reports
  return r;
}

/* ------------------------------------------------------------ dungeons */
function dungeonRates(id) {
  const d = DG_BY[id], zi = d.zi, z = ZONES[zi], techs = equipped().filter((x) => ['attack', 'ultimate'].includes(TECHNIQUES[x].cat));
  let t = 0, dmg = 0, blow = 0;
  const rooms = Math.min(DG_ROOMS, z.enemies.length);
  for (let i = 0; i < rooms; i++) { const f = foeEval(enemyAt(zi, i), techs); t += f.ttk + FOE_RESPAWN; dmg += f.dmgIn; blow = Math.max(blow, f.blow); }
  const max = pMaxHp(), food = S.combat.food && count(S.combat.food) > 0 ? S.combat.food : null, heal = food ? foodHeal(food) : 0;
  const eat = Math.max(0, Math.ceil((dmg - max * (1 - autoEatThreshold())) / Math.max(1, heal)));
  const ok = blow < autoEatThreshold() * max && (dmg < max * 0.95 || (food && count(food) >= eat));
  return { id, t, dmg, eat: food ? eat : 0, food, ok };
}

/* ------------------------------------------------------------ background: voyages and crops */
// Each ship sails the best destination it can pay for, with provisions when you have them.
function shipPlan(dur) {
  if (!expOn()) return [];
  const dests = SKILLS.voyaging.actions.filter((a) => skillLv('voyaging') >= a.level).sort((a, b) => b.level - a.level);
  const out = [];
  for (let s = 0; s < shipSlots(); s++) {
    const a = dests.find((x) => { const c = expCost(x, dur); return stock(c.hull) >= c.hullN * (s + 1); });
    if (a) out.push(a);
  }
  return out;
}
function shipRates(dur) {
  const r = { xp: {}, out: {}, inp: {}, gold: 0, voyages: 0 };
  for (const a of shipPlan(dur)) {
    const c = expCost(a, dur), food = stock(c.dish) >= c.dishN, n = expHauls(a, dur, food), per = 1 / dur;
    addTo(r.inp, c.hull, c.hullN * per); if (food) addTo(r.inp, c.dish, c.dishN * per);
    r.gold += n * avgQ(a.loot.gold) * goldMult() * per;
    if (a.loot.table) for (const [id, q] of a.loot.table) addLoot(r.out, id, n * avgQ(q) / a.loot.table.length * per);
    for (const [id, ch] of a.loot.rare || []) addLoot(r.out, id, n * Math.min(1, ch * luckMult()) * per);
    for (const [id, ch] of (RARE_FINDS.voyaging || []).concat(GLOBAL_RARE)) addLoot(r.out, id, n * Math.min(1, ch * rareMult('voyaging')) * per);
    addTo(r.xp, 'voyaging', n * a.xp * EXP_XP * skillXpMult('voyaging') * per);
    r.voyages += per;
  }
  return r;
}
function farmRates() {
  const r = { xp: {}, out: {}, inp: {}, made: {}, harvests: 0 };
  if (!skillOpen('farming') || (!autoTendOn() && typeof MAC !== 'undefined' && MAC.night)) return r;   // before auto-tend you harvest by hand, awake
  for (let i = 0; i < plotCount(); i++) {
    const c = CROPS.filter((x) => skillLv('farming') >= x.level && count(x.seed) >= 1).sort((a, b) => b.level - a.level)[0];
    if (!c) break;
    const per = 1 / (c.mins * 60), n = avgQ(c.yield) * (1 + doubleChance('farming', c.id));
    addTo(r.out, c.id, n * per); addTo(r.made, c.id, n * per);
    addTo(r.inp, c.seed, per * (1 - 0.6 * 1.5));          // a seed planted, 0.9 seeds back on average
    addTo(r.xp, 'farming', c.xp * skillXpMult('farming') * per);
    r.harvests += per;
  }
  return r;
}

/* ------------------------------------------------------------ chests in expectation */
function openChestEV(id, n) {
  const it = ITEMS[id];
  if (!it || it.type !== 'chest' || n <= 0) return;
  S.items[id] -= n; if (S.items[id] < 1e-9) delete S.items[id];
  S.gold += n * avgQ(it.gold) * goldMult();
  const tot = it.loot.reduce((a, l) => a + l[1], 0), rolls = it.rolls || 1, got = {};
  for (const [lid, w, q] of it.loot) addLoot(got, lid, n * rolls * (w / tot) * avgQ(q));
  for (const k in got) addItem(k, got[k]);
  S.stats.opened += n;
}

/* ------------------------------------------------------------ production chains */
// A craft whose inputs run short is played as a steady chain: the gathering (or the craft one step
// down) of each missing input runs alongside, at the share of time that balances what the craft eats.
// Returns rates per second of the whole chain, with .parts = [[skill, share of time]].
function producerOf(k) {
  const ps = (typeof PROD !== 'undefined' ? PROD[k] || [] : []).filter((p) => skillOpen(p.skill) && skillLv(p.skill) >= p.act.level && (!p.act.schem || S.known[p.act.schem])
    && !p.act.beast && SKILLS[p.skill].type !== 'voyage' && !actionBlock(p.skill, p.act));
  ps.sort((x, y) => (x.act.in ? 1 : 0) - (y.act.in ? 1 : 0) || (y.q / actionTime(y.skill, y.act)) - (x.q / actionTime(x.skill, x.act)));
  return ps[0] || null;
}
const CR = { ep: -1, m: new Map() };
function chainRates(skill, a, depth, top) {
  if (depth) return chainRatesNow(skill, a, depth, top);
  if (CR.ep !== EPOCH) { CR.ep = EPOCH; CR.m.clear(); }
  const k = skill + ':' + a.id + ':' + memoCombo() + ':' + (top ? Object.keys(a.in || {}).map((x) => (count(x) >= a.in[x] * 20 ? 1 : 0)).join('') : '');
  if (!CR.m.has(k)) CR.m.set(k, chainRatesNow(skill, a, depth, top));
  return CR.m.get(k);
}
function chainRatesNow(skill, a, depth, top) {
  depth = depth || 0;
  const c = cloneRates(actRates(skill, a));
  c.parts = [[skill, 1]];
  if (!a.in) return c;
  let tot = 1;
  for (const k in a.in) {
    if (top && count(k) >= a.in[k] * 20) continue;                 // enough in the bank: it is used first
    const p = producerOf(k);
    if (!p || depth >= 3 || (p.skill === skill && p.act.id === a.id)) return null;
    const pr = chainRatesNow(p.skill, p.act, depth + 1, false);
    if (!pr || !(pr.out[k] > 0)) return null;
    const w = c.inp[k] / pr.out[k];
    for (const f of ['out', 'inp', 'made']) for (const id in pr[f]) c[f][id] = (c[f][id] || 0) + pr[f][id] * w;
    for (const s in pr.xp) c.xp[s] = (c.xp[s] || 0) + pr.xp[s] * w;
    for (const [s, f] of pr.parts) c.parts.push([s, f * w]);
    tot += w;
  }
  // per second of the whole chain, internal flows netted out
  for (const f of ['out', 'inp', 'made']) for (const id in c[f]) c[f][id] /= tot;
  for (const s in c.xp) c.xp[s] /= tot;
  c.parts = c.parts.map(([s, f]) => [s, f / tot]);
  c.actions /= tot;
  for (const id in c.inp) if (c.out[id]) { const d = c.out[id] - c.inp[id]; if (d >= 0) { c.out[id] = d; delete c.inp[id]; } else { c.inp[id] = -d; delete c.out[id]; } }
  c.chain = tot > 1;
  return c;
}
