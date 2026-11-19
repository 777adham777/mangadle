'use strict';
/* ==========================================================================
   TRI-REALM IDLE — Shiny & Perfect (game-wide quality system, DOM-free)
   - A gathering skill can bring up a SHINY version of what it gathers, a
     crafting skill can make a PERFECT version of what it crafts.
   - Every skill that opts in (QUALITY) keeps a log: the first shiny / perfect
     of each of its actions. Filling the log pays set bonuses at 25 / 50 / 75 /
     100 % (Q_TIERS). Skills opt in world by world.
   - Logs are filled by hand (claim): one shiny / perfect of each is spent to
     log it (a seasoned perfect dish counts), the others can be sold or used.
   - Shiny, perfect and seasoned items are "variants" of their base item
     (id `base~s`, `base~p`, `base~n~spice`, `base~p~spice`), created on demand
     so the item list does not explode. They have their own logs and do not
     count in the Collection Log.
   Loaded after systems.js. Seasonings themselves live in seas.js.
   ========================================================================== */

// Which skills roll a quality, and the base chance per item made.
// Shiny: per catch, up to ×2 with the action's mastery, and luck (~25 min for a first shiny Minnow, ~1h for a Sea King).
// Perfect: per dish, + mastery and levels above the recipe (1% → ~9%).
const QUALITY = {
  fishing: { kind: 'shiny',   base: 1 / 500, claim: true },
  cooking: { kind: 'perfect', base: 0.01, claim: true },
};
const Q_WORD = { s: 'Shiny', p: 'Perfect' };
const Q_CODE = { shiny: 's', perfect: 'p' };
// Log set bonuses, by share of the log filled: [share, fx, text].
// fx speed / double / xp apply to the log's own skill; shiny / perfect / spice / heal / hp apply everywhere.
const Q_TIERS = {
  fishing: [
    [0.25, { speed: 0.05 },  '+5% Fishing speed'],
    [0.5,  { double: 0.05 }, '+5% chance to catch two fish'],
    [0.75, { shiny: 0.5 },   'Shiny chance ×1.5 on every skill'],
    [1,    { xp: 0.1 },      '+10% Fishing XP and the Shiny Glimmer aura'],
  ],
  cooking: [
    [0.25, { heal: 0.1 },    'All food heals 10% more'],
    [0.5,  { perfect: 0.5 }, 'Perfect chance ×1.5'],
    [0.75, { spice: 0.5 },   'Seasoning effects +50%'],
    [1,    { hp: 0.1 },      '+10% max HP'],
  ],
};
const Q_OWN = { speed: 1, double: 1, xp: 1 };

/* ------------------------------------------------------------- variants */
const variantId = (base, q, spice) => base + '~' + (q || 'n') + (spice ? '~' + spice : '');
function parseVariant(id) {
  const p = String(id).split('~');
  if (p.length < 2 || p.length > 3 || !ITEMS[p[0]] || ITEMS[p[0]].variant) return null;
  const q = p[1] === 'n' ? '' : p[1];
  if ((q && !Q_WORD[q]) || (!q && !p[2]) || (q === 's' && p[2])) return null;
  return { base: p[0], q, spice: p[2] || '' };
}
const baseOf = (id) => (ITEMS[id] && ITEMS[id].variant ? ITEMS[id].base : id);
// How many of an item you own counting every version of it (plain, shiny, perfect, seasoned).
function familyCount(base) {
  let n = count(base);
  for (const v of VARIANTS[base] || []) n += count(v);
  return n;
}
const spiceOn = (sp) => typeof SPICES !== 'undefined' && SPICES[sp];
// Strength of a seasoning in a dish: perfect dishes ×1.5, Perfect Log bonus on top.
const spicePower = (perfect) => (perfect ? 1.5 : 1) * (1 + qFx('spice'));

function ensureVariant(id) {
  if (ITEMS[id]) return ITEMS[id];
  const v = parseVariant(id);
  if (!v) return null;
  const b = ITEMS[v.base], sp = v.spice ? spiceOn(v.spice) : null;
  if (v.spice && (!sp || b.type !== 'food')) return null;
  const it = Object.assign({}, b, { id, variant: true, base: v.base, q: v.q, spice: v.spice || null });
  it.name = [v.q ? Q_WORD[v.q] : '', sp ? sp.adj : '', b.name].filter(Boolean).join(' ');
  it.value = v.q === 's' ? Math.max(50, b.value * 25) : Math.round(b.value * (v.q === 'p' ? 3 : 1) + (sp ? ITEMS[sp.item].value * 2 : 0));
  const br = b.rarity || 1;
  it.rarity = v.q === 's' ? 5 : v.q === 'p' ? Math.min(5, br + 1) : br;
  if (b.type === 'food') {
    // computed on read, so Perfect Log bonuses to seasonings apply to dishes already cooked
    const p = v.q === 'p', heal = (sp && sp.fx.heal) || 0;
    delete it.heal;
    Object.defineProperty(it, 'heal', { enumerable: true, get: () => Math.round(b.heal * (p ? 1.5 : 1) * (1 + heal * spicePower(p))) });
  }
  if (b.buff && v.q === 'p') it.buff = Object.assign({}, b.buff, { val: Math.round(b.buff.val * 1.5 * 1000) / 1000 });
  if (b.stats && v.q === 'p') it.stats = Object.fromEntries(Object.entries(b.stats).map(([k, x]) => [k, x < 1 ? Math.round(x * 1.2 * 1000) / 1000 : Math.round(x * 1.2)]));
  ITEMS[id] = it;
  (VARIANTS[v.base] = VARIANTS[v.base] || []).push(id);
  if (typeof ICONS !== 'undefined') ICONS.item[id] = ICONS.item[v.base];
  if (typeof ICON_MARK !== 'undefined') ICON_MARK[id] = sp ? { b: sp.icon, t: v.q === 'p' ? '★' : '' } : { b: v.q === 's' ? 'sparkles' : 'round-star', t: '' };
  return it;
}
// Before a save is checked: create every variant it holds.
function restoreVariants() {
  const ids = [...Object.keys(S.items || {}), ...Object.keys(S.found || {}), ...Object.keys((S.quality && S.quality.log) || {}),
    S.combat && S.combat.food, ...Object.values(S.equip || {})];
  for (const id of ids) if (id && !ITEMS[id]) ensureVariant(id);
}

/* ------------------------------------------------------------- chances */
const qKind = (skill) => (QUALITY[skill] ? QUALITY[skill].kind : null);
function shinyChance(skill, act) {
  return QUALITY[skill].base * (1 + masteryLv(skill, act.id) / 99) * luckMult() * (1 + qFx('shiny')) * hmul('shiny', skill);
}
function perfectChance(skill, act) {
  const over = Math.max(0, Math.min(60, skillLv(skill) - act.level));
  return Math.min(0.5, (QUALITY[skill].base + 0.0005 * masteryLv(skill, act.id) + 0.0005 * over) * (1 + qFx('perfect')) * hmul('perfect', skill));
}
const qChance = (skill, act) => (qKind(skill) === 'shiny' ? shinyChance(skill, act) : perfectChance(skill, act));

/* ------------------------------------------------------------- logs */
// One entry per action that makes an item: { act, base, vid, n (how many made so far), got (in the log),
// ready (owned but not logged yet: a claim log can take it), pay (the version handed in) }.
function qEntries(skill) {
  const code = Q_CODE[qKind(skill)], claim = QUALITY[skill].claim, C = S.quality.claim;
  return SKILLS[skill].actions.filter((a) => a.out).map((a) => {
    const base = Object.keys(a.out)[0], vid = variantId(base, code), n = S.quality.log[vid] || 0;
    const got = claim ? !!C[vid] : n > 0, pay = claim && !got ? qPay(base, vid) : null;
    return { act: a, base, vid, n, got, ready: !!pay, pay };
  });
}
// The copy a claim spends: the plain shiny / perfect first, else the cheapest seasoned perfect one.
function qPay(base, vid) {
  if (count(vid) > 0) return vid;
  const q = ITEMS[vid] ? ITEMS[vid].q : vid.split('~')[1];
  return (VARIANTS[base] || []).filter((k) => ITEMS[k].q === q && count(k) > 0).sort((a, b) => ITEMS[a].value - ITEMS[b].value)[0] || null;
}
const qCount = (skill) => qEntries(skill).filter((e) => e.got).length;
const qReady = (skill) => (QUALITY[skill] && QUALITY[skill].claim ? qEntries(skill).filter((e) => e.ready) : []);
function qTotal(skill) { return QUALITY[skill] ? qEntries(skill).reduce((a, e) => a + e.n, 0) : 0; }
function qTiers(skill) {
  const E = qEntries(skill), have = E.filter((e) => e.got).length;
  return (Q_TIERS[skill] || []).map(([f, fx, text]) => { const need = Math.max(1, Math.ceil(f * E.length)); return { need, fx, text, on: have >= need }; });
}
const qLogDone = (skill) => !!QUALITY[skill] && qEntries(skill).every((e) => e.got);
// Bonuses from every log, cached until a log gains a new entry (or another save is loaded).
let Q_CACHE = null, Q_CACHE_S = null, Q_VER = 0, Q_CACHE_VER = -1;
function qBonus() {
  if (Q_CACHE && Q_CACHE_S === S && Q_CACHE_VER === Q_VER) return Q_CACHE;
  const own = {}, all = {};
  for (const sk in QUALITY) for (const t of qTiers(sk)) if (t.on) for (const k in t.fx) {
    if (Q_OWN[k]) { own[sk] = own[sk] || {}; own[sk][k] = (own[sk][k] || 0) + t.fx[k]; } else all[k] = (all[k] || 0) + t.fx[k];
  }
  Q_CACHE = { own, all }; Q_CACHE_S = S; Q_CACHE_VER = Q_VER;
  return Q_CACHE;
}
const qFx = (k) => qBonus().all[k] || 0;
const qOwn = (skill, k) => ((qBonus().own[skill] || {})[k] || 0);
hook('speed', (skill) => 1 + qOwn(skill, 'speed'));
hook('double', (skill) => qOwn(skill, 'double'));
hook('xp', (skill) => 1 + qOwn(skill, 'xp'));
hook('hp', () => 1 + qFx('hp'));
hook('heal', () => 1 + qFx('heal'));

function logQuality(skill, base, q, n, item) {
  const vid = variantId(base, q), L = S.quality.log, first = !L[vid];
  const tiersBefore = first ? qTiers(skill).filter((t) => t.on).length : 0;
  L[vid] = (L[vid] || 0) + n;
  if (first) { Q_VER++; dirty = true; }
  emit('quality', { skill, base, q, item: item || vid, first, have: qCount(skill), total: qEntries(skill).length });
  if (!first || QUALITY[skill].claim) return;
  qTierCheck(skill, tiersBefore);
}
function qTierCheck(skill, before) {
  const T = qTiers(skill), after = T.filter((t) => t.on).length;
  if (after > before) emit('qtier', { skill, tier: T[after - 1], i: after - 1 });
}
// Claim logs: spend one shiny of each to log it (the rest can be sold).
function qClaim(skill, base, pay) {
  const e = qEntries(skill).find((x) => x.base === base);
  if (!e || !e.ready) return false;
  if (pay && count(pay) > 0 && ITEMS[pay].base === base && ITEMS[pay].q === Q_CODE[qKind(skill)]) e.pay = pay;
  const before = qTiers(skill).filter((t) => t.on).length;
  removeItem(e.pay, 1);
  if (S.combat.food === e.pay && !count(e.pay)) dirty = true;   // the battle food falls back to another version (tick hook)
  S.quality.claim[e.vid] = 1;
  Q_VER++; dirty = true;
  emit('qclaim', { skill, base, item: e.vid, have: qCount(skill), total: qEntries(skill).length });
  qTierCheck(skill, before);
  return true;
}

/* ------------------------------------------------------------- the roll */
// Runs after the action has added its output: turns some of it into variants.
function toVariant(base, vid, n, gains) {
  ensureVariant(vid);
  removeItem(base, n); addItem(vid, n);
  gains[base] -= n; if (gains[base] <= 0) delete gains[base];
  gains[vid] = (gains[vid] || 0) + n;
}
hook('action', (skill, act, mult, gains) => {
  const out = act.out && Object.keys(act.out)[0];
  if (!out || !gains[out]) return;
  const kind = qKind(skill);
  const spice = typeof spiceFor === 'function' ? spiceFor(skill, out) : null;
  if (!kind && !spice) return;
  if (kind === 'shiny') {
    if (Math.random() < shinyChance(skill, act)) { const vid = variantId(out, 's'); toVariant(out, vid, 1, gains); logQuality(skill, out, 's', 1, vid); }
    return;
  }
  // Perfect, and seasoning (one per dish while the spice rack has some)
  const pc = kind === 'perfect' ? perfectChance(skill, act) : 0, made = {};
  let perfects = 0, seasoned = 0, lastP = null;
  for (let i = 0, n = gains[out]; i < n; i++) {
    const p = pc > 0 && Math.random() < pc, s = spice && useSpice(spice) ? spice : '';
    if (!p && !s) continue;
    const vid = variantId(out, p ? 'p' : '', s);
    made[vid] = (made[vid] || 0) + 1;
    if (p) { perfects++; lastP = vid; }
    if (s) seasoned++;
  }
  for (const vid in made) toVariant(out, vid, made[vid], gains);
  if (seasoned) S.stats.seasoned = (S.stats.seasoned || 0) + seasoned;
  if (perfects) logQuality(skill, out, 'p', perfects, lastP);
});

// Battle food that runs out falls back to another version of the same dish (plain, perfect or seasoned).
hook('tick', () => {
  const C = S.combat, f = C.food;
  if (!f || !ITEMS[f] || count(f) > 0) return;
  const base = baseOf(f);
  const alt = [base, ...(VARIANTS[base] || [])].find((k) => count(k) > 0 && ITEMS[k].type === 'food');
  if (alt && alt !== f) { C.food = alt; dirty = true; }
});
