'use strict';
/* ==========================================================================
   ANIME IDLE RPG — the gear economy (DOM-free). One table sets every piece of equipment and its recipe.
   Loaded after builds.js (perks) and before the story / UI, so every file sees the final numbers.

   1. Every piece belongs to a STAGE: the battle stage (ZONES index, 0 = Training Grounds,
      28 = the Convergence) where it is meant to be worn. Its stats come from one power curve
      (WEAPON_ATK, ARMOR_DEF; HP = 5.6 × DEF), times its ROLE (a crafted piece 1.0, a schematic
      1.1, a rare drop 1.12, a boss drop 1.18, an Epic drop 1.25...). Pieces of the same stage are
      worth the same: what tells them apart is their perk (crit, bleed, life steal, thorns...).
   2. Perks keep their identity and are scaled to a budget by role (PERKS[k].unit = one perk),
      growing slowly with the stage.
   3. Recipes: the Crafting level follows the stage (ARTS_AT), so the recipes of a world unlock
      while you play in it, and their ingredients are what that world gives (its skills, its
      battles, its voyages) plus one older material, so earlier skills stay useful.
      Quantities come from a cost budget split in shares; boss parts and gems are fixed.
   4. Value follows the stage too: it sets the ingots a weapon is refined with (REF_INGOT)
      and the souls its awakening burns (forge.js AWK_SOULS).
   ========================================================================== */

// Stage → power. Interpolated between whole stages.
const WEAPON_ATK = [4, 10, 18, 26, 34, 42, 52, 62, 72, 84, 97, 110, 125, 140, 155, 170, 190, 210, 230, 250, 275, 300, 325, 350, 380, 410, 440, 470, 520, 560, 600];
const ARMOR_DEF = [5, 8, 13, 20, 28, 36, 45, 55, 66, 78, 90, 105, 120, 135, 150, 165, 185, 205, 225, 245, 270, 295, 320, 345, 370, 395, 420, 445, 480, 510, 540];
// Stage → Crafting level of its recipes: Leaf Village 1-30, Orange Town 36-48, Soul City 50-62,
// Kaio Planet 64-71, Shinjuku 73-78, Green Island 80-86, then the post-game.
const ARTS_AT = [[0, 1], [0.5, 4], [1, 8], [1.5, 12], [2, 18], [2.5, 24], [3, 30], [4, 36], [5, 42], [6, 46], [7, 48], [8, 50], [9, 54], [10, 58], [11, 61],
  [12, 64], [13, 67], [14, 69], [16, 73], [17, 75], [18, 77], [20, 80], [21, 82], [22, 84], [24, 88], [26, 92], [28, 95]];
const ECO_ROLE = {   // stats × , perk budget (in perk units), value ×
  craft:  [1.00, 1.0, 1.0], drop: [1.03, 1.0, 1.1], schem: [1.10, 1.3, 1.3], rare: [1.12, 1.3, 1.5],
  boss:   [1.18, 1.5, 1.8], epic: [1.25, 1.6, 2.2], relic: [1.20, 1.6, 2.5], legend: [1.35, 1.9, 3], util: [0.6, 1.0, 1.0],
  set:    [1.12, 1.3, 1.6],   // La Forge: a 6-piece set's piece (gear.js), forged from its sigil
};
// Accessories lean one way: offence, defence or a bit of both.
const ACC_SHAPE = { off: { atk: 0.5, hp: 0.2 }, def: { def: 0.45, hp: 0.45 }, hyb: { atk: 0.3, def: 0.22, hp: 0.25 } };
// One "perk" for the utility stats that are not in PERKS.
const ECO_UNIT = { dodge: 0.03, gold: 0.1, rare: 0.06, cxp: 0.06, speed: 0.04 };

// GEAR_TIERS (id: [stage, role, accessory shape]) and GEAR_RECIPES live in gear.js (loaded before loot.js).
// Other Crafting recipes, moved to the world whose materials they use (level only).
const ARTS_LEVELS = {
  // ki tools (Kaio Planet), then the tools of later skills in their own world
  tool_woodcutting_1: 60, tool_fishing_1: 60, tool_mining_1: 61, tool_gravity_1: 62,
  tool_woodcutting_2: 66, tool_fishing_2: 66, tool_mining_2: 67, tool_gravity_2: 68,
  tool_woodcutting_3: 72, tool_fishing_3: 72, tool_mining_3: 73, tool_gravity_3: 74,
  tool_exorcism_1: 73, tool_exorcism_2: 76, tool_exorcism_3: 79,
  tool_tracking_1: 80, tool_tracking_2: 83, tool_tracking_3: 86,
  tool_archaeology_1: 88, tool_archaeology_2: 91, tool_archaeology_3: 94,
  tool_woodcutting_4: 92, tool_fishing_4: 92, tool_mining_4: 93,
  tool_gravity_4: 93, tool_exorcism_4: 93, tool_tracking_4: 94, tool_archaeology_4: 96,
  // hunting gear (Green Island)
  fish_bait: 78, scent_lure: 79, snare: 78, net_trap: 80, cage_trap: 82, spirit_trap: 84, wyrm_trap: 86, chimera_trap: 89,
  // curses and the Fox's fire
  scroll_hex: 74,
  rift_cleaver: 95,
};

/* ------------------------------------------------------------ helpers */
function ecoAt(table, s) {
  const i = Math.max(0, Math.min(table.length - 1, Math.floor(s))), j = Math.min(table.length - 1, i + 1), f = s - Math.floor(s);
  return table[i] + (table[j] - table[i]) * f;
}
function ecoArts(s) {
  let lv = 1;
  for (let i = 0; i < ARTS_AT.length; i++) {
    const [a, la] = ARTS_AT[i], nx = ARTS_AT[i + 1];
    if (s >= a) lv = !nx || s <= a ? la : la + (nx[1] - la) * Math.min(1, (s - a) / (nx[0] - a));
  }
  return Math.round(lv);
}
// Value bands keep the refinement ingots and the awakening souls in step with the stage.
const ECO_VALUE = [[2, 15, 5, 29], [4, 40, 15, 99], [8, 150, 25, 299], [12, 400, 60, 699], [16, 900, 120, 1499], [20, 2000, 400, 3999], [24, 6000, 1500, 14999], [Infinity, 30000, 10000, Infinity]];
function ecoValue(s, mult, weapon) {
  let lo = 0;
  for (const [hi, base, per, cap] of ECO_VALUE) {
    if (s < hi) { const v = (base + per * (s - lo)) * mult; return Math.round(weapon ? Math.min(cap, v) : v); }
    lo = hi;
  }
  return 0;
}
const ecoRound = (k, v) => (Math.abs(v) >= 3 ? Math.round(v) : Math.abs(v) >= 0.2 ? Math.round(v * 20) / 20 : Math.abs(v) >= 0.02 ? Math.round(v * 100) / 100 : Math.round(v * 1000) / 1000);

/* ------------------------------------------------------------ 1-2. stats and perks */
function gearStats(id) {
  const it = ITEMS[id], [s, role, shape] = GEAR_TIERS[id], [sm, pb] = ECO_ROLE[role];
  const W = ecoAt(WEAPON_ATK, s), D = ecoAt(ARMOR_DEF, s), H = Math.max(25, 5.6 * D);
  const old = it.stats || {}, out = {};
  // La Forge (gear.js SLOT_INFO): six armour slots share what one armour and one accessory used to give,
  // so a full kit of a stage is worth what the old pair was (the fight curve stays true).
  const SI = SLOT_INFO[it.slot], share = it.slot === 'weapon' || !SI ? 1 : SI.share;
  if (it.slot === 'weapon') out.atk = W * sm;
  else if (SI.kind === 'armor') { out.def = D * sm * share; out.hp = H * sm * share; }
  else { const sh = ACC_SHAPE[shape || 'hyb']; if (sh.atk) out.atk = W * sh.atk * sm * share; if (sh.def) out.def = D * sh.def * sm * share; if (sh.hp) out.hp = H * sh.hp * sm * share; }
  // a cursed piece keeps its price: the same share of a core stat, taken away
  const core = { atk: W, def: D, hp: H };
  const base = { atk: it.slot === 'weapon' ? W : W * 0.4 * share, def: D * 0.6 * share, hp: H * 0.6 * share };
  for (const k of ['atk', 'def', 'hp']) if ((old[k] || 0) < 0) out[k] = -Math.abs(old[k]) / (oldCore(id, k) || 1) * base[k];
  // perks: same identity, scaled to the role's budget
  const perks = Object.keys(old).filter((k) => !(k in core) && old[k] > 0);
  const unit = (k) => (PERKS[k] && PERKS[k].unit) || ECO_UNIT[k] || 0.1;
  const have = perks.reduce((a, k) => a + old[k] / unit(k), 0);
  const want = pb * (1 + s / 50) * share;
  for (const k of perks) out[k] = have ? old[k] * want / have : 0;
  for (const k in out) out[k] = k in core ? Math.sign(out[k]) * Math.max(1, Math.round(Math.abs(out[k]))) : ecoRound(k, out[k]);
  return out;
}
// The size of a stat before the pass (to keep a cursed piece's penalty in proportion).
function oldCore(id, k) {
  const it = ITEMS[id], o = it.stats || {};
  if (k === 'hp') return o.def ? o.def * 5.6 : o.atk ? o.atk * 2.5 : 100;
  if (k === 'def') return o.hp ? o.hp / 5.6 : o.atk || 10;
  return o.hp ? o.hp / 5 : o.def || 10;
}

/* ------------------------------------------------------------ 3. recipes */
// A recipe costs about the same TIME at every stage, a little more as you go: the budget is a
// number of "gathering actions" split in shares, and each material counts for how many of it one
// action or one victory brings (a log: 1 per chop; an ingot: 2 ores and a smelt; a 15% drop: 0.15).
// RECIPE_PACE (pace pass 2026-11-24): a new piece of gear costs twice the work it used to, and its
// craft pays that many times the Crafting XP, so the Crafting level still keeps up with the recipes.
const RECIPE_PACE = 2;
const RECIPE_ACTIONS = (s) => RECIPE_PACE * (8 + 4 * s);
let ECO_YIELD = null;
function ecoYield(k) {
  if (!ECO_YIELD) {
    ECO_YIELD = {};
    const best = (id, y) => { ECO_YIELD[id] = Math.max(ECO_YIELD[id] || 0, y); };
    for (const sk in SKILLS) for (const a of SKILLS[sk].actions || []) {
      if (SKILLS[sk].type === 'gather') for (const o in a.out || {}) best(o, a.out[o]);
      for (const [o, p, q] of a.extra || []) best(o, p * ((q ? q[0] + q[1] : 2) / 2));
    }
    for (const z of ZONES) for (const e of z.enemies) for (const [o, p, q] of e.drops || []) best(o, p * ((q ? q[0] + q[1] : 2) / 2));
    for (const ore in INGOT_OF) ECO_YIELD[INGOT_OF[ore]] = 0.4;
  }
  return Math.min(1, Math.max(0.15, ECO_YIELD[k] || 0.5));
}
function gearRecipe(id) {
  const [s] = GEAR_TIERS[id], spec = GEAR_RECIPES[id];
  const budget = RECIPE_ACTIONS(s);
  const inp = {};
  for (const k in spec) {
    if (!ITEMS[k]) continue;
    const v = spec[k];
    inp[k] = Array.isArray(v) ? v[0] : Math.max(1, Math.round(budget * v * ecoYield(k)));
  }
  return inp;
}

/* ======================================================== combat drop pacing (2026-11-25) */
// Plain stage foes dropped far too much: a night of battle brought ~16,000 materials. Their common drops
// (materials, food, spices at 5% or more) now come half as often and in half the quantity ([2, 4] → [1, 2]).
// World relics on stage foes too (a night still brought ~1,500 Leviathan Scales; a gate asks for 5).
// Guardians, dungeons, rare drops, gear, schematics, chests and scrolls keep their rates. Applied before the
// recipes are priced, so gear that asks for these drops asks for fewer of them (same time per piece).
const DROP_PACE = { chance: 0.5, qty: 0.5, types: ['res', 'food', 'spice'], from: 0.05 };
for (const z of ZONES) if (!z.boss && !z.dungeon) for (const e of z.enemies) e.drops = e.drops.map(([id, ch, q]) => {
  const it = ITEMS[id];
  if (!it || ch < DROP_PACE.from || !DROP_PACE.types.includes(it.type)) return [id, ch, q];
  return [id, ch * DROP_PACE.chance, [Math.max(1, Math.round(q[0] * DROP_PACE.qty)), Math.max(1, Math.ceil(q[1] * DROP_PACE.qty))]];
});

/* ------------------------------------------------------------ apply */
// dungeon set pieces (dungeons.js) are priced like every other piece
if (typeof DUNGEON_TIERS !== 'undefined') Object.assign(GEAR_TIERS, DUNGEON_TIERS);
// gear.js: generic pieces, set pieces (role 'set') and weapons forged from shards
Object.assign(GEAR_TIERS, GEN_TIERS); Object.assign(GEAR_RECIPES, GEN_RECIPES);
(function applyEconomy() {
  // stats first: the recipe costs read the new values
  for (const id in GEAR_TIERS) {
    const it = ITEMS[id];
    if (!it || it.type !== 'equip') continue;
    const [s, role] = GEAR_TIERS[id];
    it.stats = gearStats(id);
    it.value = ecoValue(s, ECO_ROLE[role][2], it.slot === 'weapon');
    it.stage = s;
  }
  const arts = SKILLS.arts.actions;
  for (const a of arts) {
    const id = Object.keys(a.out || {})[0];
    let lv = null;
    if (GEAR_TIERS[id] && GEAR_RECIPES[id]) { lv = ecoArts(GEAR_TIERS[id][0]); a.in = gearRecipe(id); a.time = Math.round((4 + 0.2 * GEAR_TIERS[id][0]) * 2) / 2; }
    else if (ARTS_LEVELS[id] != null) lv = ARTS_LEVELS[id];
    if (lv == null) continue;
    a.level = lv;
    a.xp = xpFor(lv, a.time, true) * (GEAR_TIERS[id] && GEAR_RECIPES[id] ? RECIPE_PACE : 1);
  }
  arts.sort((x, y) => x.level - y.level);
})();


/* ======================================================== pace pass 3 (2026-11-25) */
// The user: the early game is fine, but from Orange Town on, materials and gold piled up so fast that
// nothing was a choice (the bot ended a week with 258 M gold, all the Market costs ~140 M, and 200,000
// materials in the Bank). Three cuts, all past the first world:
// - SKILL_PACE: an action takes longer the higher its level (×1 up to level 10, ×1.6 from level 40 on),
//   for the same XP and the same output: fewer materials and less XP per hour in the mid game.
// - GOLD_PACE: foes, voyages and chests of later worlds pay less gold (Leaf Village ×1, Orange Town ×0.4,
//   Soul City ×0.25, then ×0.15). The Market's later tiers become a choice, not a formality.
// - DROP_PACE above now keeps 35% of the plain foes' common drops (was 50%).
DROP_PACE.chance = 0.35;   // applied above at 0.5: the extra cut is made here (×0.7)
for (const z of ZONES) if (!z.boss && !z.dungeon) for (const e of z.enemies) for (const d of e.drops) {
  const it = ITEMS[d[0]];
  if (it && d[1] >= 0.05 * 0.5 && DROP_PACE.types.includes(it.type) && !it.relic) d[1] *= 0.7;
}
const SKILL_PACE = (lv) => 1 + 0.6 * Math.max(0, Math.min(1, (lv - 10) / 30));
for (const k in SKILLS) {
  const sk = SKILLS[k];
  if (sk.type === 'voyage' || sk.type === 'combat') continue;
  for (const a of sk.actions || []) if (a.time && a.level > 10) a.time = Math.round(a.time * SKILL_PACE(a.level) * 10) / 10;
}
const GOLD_PACE = (realm) => { const i = WORLD_ORDER.indexOf(realm); return i <= 0 ? 1 : i === 1 ? 0.4 : i === 2 ? 0.25 : 0.15; };
const paceGold = (g, m) => [Math.max(1, Math.round(g[0] * m)), Math.max(1, Math.round(g[1] * m))];
for (const z of ZONES) { const m = GOLD_PACE(z.realm); if (m < 1 && !z.curved && !z.dungeon) for (const e of z.enemies) if (e.gold) e.gold = paceGold(e.gold, m); }
// Voyages: the far routes (Voyaging 25+) sail into the late game, so they pay like a late world.
for (const a of SKILLS.voyaging.actions) if (a.loot && a.loot.gold) a.loot.gold = paceGold(a.loot.gold, a.level >= 25 ? 0.05 : GOLD_PACE('seas'));
for (const id in ITEMS) { const it = ITEMS[id]; if (it.type === 'chest' && it.gold && typeof homeOf === 'function') { const m = GOLD_PACE(homeOf(id)); if (m < 1) it.gold = paceGold(it.gold, m); } }

/* ======================================================== food that runs out (2026-11-25) */
// A farm lives on its food stock: every food heals 40% less than it used to, so a night of farming asks for
// a real stock, cooked during your sessions (stage foes are sized against it: js/curve.js).
const FOOD_HEAL_PACE = 0.6;
for (const id in ITEMS) {
  const it = ITEMS[id];
  if (it.type === 'food' && it.heal) it.heal = Math.max(1, Math.round(it.heal * FOOD_HEAL_PACE));
}

/* ======================================================== La Forge, lot 1 (2026-11-26, docs/FORGE.md) */
// P1 · Crafting levels from gear. The first craft of every piece pays a lump of XP: together, the first
// crafts of a world's pieces pay FIRST_FORGE_SHARE of the Crafting XP between its first recipe and the next
// world's (it was 1-2%: the levels came from carvings). Carvings go back to being expedition cargo (less XP).
const FIRST_FORGE_SHARE = 0.4, CARVING_XP = 0.6;
const FIRST_XP = {};   // gear id -> bonus XP of its first craft (game.js completeAction, the simulator)
const gearWorld = (s) => Math.min(7, Math.floor(s / 4));
function applyFirstForge() {
  const arts = SKILLS.arts.actions, byW = {};
  for (const a of arts) {
    const id = Object.keys(a.out || {})[0], it = ITEMS[id];
    if (!it || it.type !== 'equip' || it.stage == null) continue;
    (byW[gearWorld(it.stage)] = byW[gearWorld(it.stage)] || []).push(a);
  }
  const ws = Object.keys(byW).map(Number).sort((x, y) => x - y);
  ws.forEach((w, i) => {
    const acts = byW[w], lo = Math.min(...acts.map((a) => a.level));
    const nx = byW[ws[i + 1]], hi = nx ? Math.min(...nx.map((a) => a.level)) : Math.min(99, Math.max(...acts.map((a) => a.level)) + 4);
    const per = FIRST_FORGE_SHARE * (XP_TABLE[hi] - XP_TABLE[lo]) / acts.length;
    for (const a of acts) { a.first = Math.max(0, Math.round(per - a.xp)); FIRST_XP[Object.keys(a.out)[0]] = a.first; }
  });
  for (const [id] of CARVINGS) { const a = arts.find((x) => x.out && x.out[id]); if (a) a.xp = Math.max(1, Math.round(a.xp * CARVING_XP)); }
}

// P2 + P4 · Prices. Transforming always pays a little: an ingot is worth its inputs + 5% (level 1) to 10%
// (level 99); a crafted piece sells for its materials + a margin that depends on the piece. Nothing is
// salvaged any more (no recycling: user rule). Forge costs keep the stage bands (it.tv, forge.js forgeVal).
const SELL_MARGIN = { craft: 0.05, util: 0.05, schem: 0.07, set: 0.08, frag: 0.1 };
const inValue = (inp) => Object.keys(inp || {}).reduce((t, k) => t + (ITEMS[k] ? ITEMS[k].value * inp[k] : 0), 0);
function applyPrices() {
  for (const a of SKILLS.smithing.actions.slice().sort((x, y) => x.level - y.level)) {
    const o = Object.keys(a.out || {})[0];
    if (!o || !a.in || !ITEMS[o]) continue;
    const m = 1.05 + 0.05 * Math.min(1, (a.level - 1) / 98);
    ITEMS[o].value = Math.max(1, Math.ceil(inValue(a.in) * m / a.out[o]));
  }
  for (const a of SKILLS.arts.actions) {
    const o = Object.keys(a.out || {})[0], it = ITEMS[o];
    if (!it || it.type !== 'equip' || !GEAR_TIERS[o] || !a.in) continue;
    it.tv = it.tv || it.value;
    const role = it.frag ? 'frag' : GEAR_TIERS[o][1];
    it.value = Math.max(1, Math.ceil(inValue(a.in) * (1 + (SELL_MARGIN[role] || 0.05)) / a.out[o]));
  }
  // The Market never sells a material below 1.25 × its sale value (or buy, craft, sell would mint gold).
  for (const s of SHOP) if (s.give && ITEMS[s.give[0]]) s.cost = Math.max(s.cost, Math.ceil(ITEMS[s.give[0]].value * s.give[1] * 1.25));
}
applyPrices();
applyFirstForge();
