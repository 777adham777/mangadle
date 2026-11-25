'use strict';
/* ==========================================================================
   TRI-REALM — techniques (GDD §2.2), DOM-free. Data: TECHNIQUES / TECH_RAR in worlds.js.
   Reworked twice on 2026-11-25; the user's final rules:
   - Every technique has a rarity (1 Common … 5 Legendary). Scrolls come in four rarities per world
     (Common, Rare, Epic, Legendary). Reading one draws a technique of its world: the rarer the scroll,
     the likelier a rare technique (SCROLL_ODDS). A technique you know goes up one level (max 10);
     mastered ones leave the draw.
   - Cursed Fragments are the one sure path: CURSED_PER_LEVEL of them level a technique you choose.
   - Seven slots by kind: 3 Active (attack, defense, support; they fire in slot order, defensive ones
     wait for their moment), 3 Passive (always on), 1 Ultimate (fires when ready).
   State: S.tech = { lv: { id: level }, loadout: [id | null] × 7, pity, v: 3 }.
   ========================================================================== */

const techOn = () => isUnlocked('feature:techniques');
const techLv = (id) => S.tech.lv[id] || 0;
const techTier = (id, t) => techLv(id) >= t;
const techRar = (id) => (TECHNIQUES[id] && TECHNIQUES[id].rar) || 1;
const CURSED_PER_LEVEL = 5;

const TECH_CATS = {
  attack:   { name: 'Attack',   icon: 'atk',  kind: 'active',   how: 'Fires as soon as it is ready' },
  defense:  { name: 'Defense',  icon: 'def',  kind: 'active',   how: 'Fires when you are hurt or before a big blow' },
  support:  { name: 'Support',  icon: 'tsup', kind: 'active',   how: 'Fires as soon as it is ready' },
  passive:  { name: 'Passive',  icon: 'tpas', kind: 'passive',  how: 'Always on while equipped' },
  ultimate: { name: 'Ultimate', icon: 'tult', kind: 'ultimate', how: 'Fires when ready' },
};
const SLOT_KINDS = { active: 'Active', passive: 'Passive', ultimate: 'Ultimate' };
const techKind = (id) => TECH_CATS[TECHNIQUES[id].cat].kind;
// 3 Active, 3 Passive, 1 Ultimate. They open with your Character level, then with your worlds.
const TECH_SLOTS = [
  { kind: 'active',   open: () => true },
  { kind: 'active',   open: () => charLv() >= 8,  hint: 'Character level 8' },
  { kind: 'active',   open: () => charLv() >= 20, hint: 'Character level 20' },
  { kind: 'passive',  open: () => charLv() >= 12, hint: 'Character level 12' },
  { kind: 'passive',  open: () => !!S.gates.soul, hint: 'Reach Soul City' },
  { kind: 'passive',  open: () => !!S.gates.ki,   hint: 'Reach Kaio Planet' },
  { kind: 'ultimate', open: () => !!S.gates.hex,  hint: 'Reach Shinjuku' },
].map((s, i, all) => Object.assign(s, { i, name: `${SLOT_KINDS[s.kind]} ${all.slice(0, i + 1).filter((x) => x.kind === s.kind).length}` }));
const loadout = () => { const L = Array.isArray(S.tech.loadout) ? S.tech.loadout : (S.tech.loadout = []); while (L.length < TECH_SLOTS.length) L.push(null); return L; };
const slotOpen = (i) => !!(TECH_SLOTS[i] && TECH_SLOTS[i].open());
const openSlots = () => TECH_SLOTS.filter((s) => s.open());
const slotOf = (id) => loadout().indexOf(id);
const isEquipped = (id) => !!id && slotOpen(slotOf(id));
// What fights: actives in slot order (Narrow Path: only the first two), passives, the Ultimate.
const equipped = () => {
  const narrow = typeof pactOn === 'function' && pactOn('narrow');
  let act = 0;
  return openSlots().filter((s) => s.kind !== 'active' || (!narrow || act++ < 2)).map((s) => loadout()[s.i]).filter((id) => id && techLv(id));
};
const freeSlot = (kind) => openSlots().find((s) => s.kind === kind && !loadout()[s.i]);

// Put a technique in slot i (or empty it with id = null). Slot kinds must match; moved from another
// slot of the same kind, the two swap.
function equipTech(i, id) {
  if (!slotOpen(i) || (id && (!techLv(id) || techKind(id) !== TECH_SLOTS[i].kind))) return false;
  const L = loadout();
  if (id) { const j = L.indexOf(id); if (j >= 0 && j !== i) L[j] = L[i] && slotOpen(j) ? L[i] : null; }
  L[i] = id || null;
  dirty = true;
  return true;
}
function unequipTech(id) { const j = slotOf(id); if (j < 0) return false; loadout()[j] = null; dirty = true; return true; }
// Move an Active technique up (-1) or down (+1): the firing order.
function moveTech(i, d) {
  const L = loadout();
  let j = i + d;
  while (TECH_SLOTS[j] && TECH_SLOTS[j].kind !== TECH_SLOTS[i].kind) j += d;
  if (!slotOpen(i) || !slotOpen(j)) return false;
  [L[i], L[j]] = [L[j], L[i]];
  dirty = true;
  return true;
}
function autoEquip(id) {
  if (isEquipped(id)) return true;
  const s = freeSlot(techKind(id));
  return s ? equipTech(s.i, id) : false;
}

/* ------------------------------------------------------------ scrolls and the draw */
// Scroll rarities: [suffix, rarity, name]. The Common one keeps the old id (quests, chests, Crafting).
const SCROLL_TIERS = [['', 1, ''], ['_r3', 3, 'Rare '], ['_r4', 4, 'Epic '], ['_r5', 5, 'Legendary ']];
// Chance weights of a technique's rarity (1-5) for each scroll rarity.
const SCROLL_ODDS = { 1: [0, 60, 30, 9, 1, 0], 3: [0, 20, 30, 35, 12, 3], 4: [0, 5, 15, 35, 35, 10], 5: [0, 0, 5, 20, 40, 35] };
const scrollId = (realm, rar) => 'scroll_' + realm + (SCROLL_TIERS.find((t) => t[1] === rar) || SCROLL_TIERS[0])[0];
const isScroll = (id) => !!(ITEMS[id] && ITEMS[id].type === 'scroll');
const scrollIds = () => Object.keys(S.items).filter((k) => isScroll(k) && S.items[k] >= 1);
const scrollsOwned = () => scrollIds().reduce((a, k) => a + Math.floor(S.items[k]), 0);
// What a scroll can draw now: its world's techniques not yet mastered, with their chance (sums to 1).
function scrollOdds(id) {
  const it = ITEMS[id];
  if (!it || !it.pool) return [];
  const W = SCROLL_ODDS[it.srar || 1], ids = (TECH_POOLS[it.pool] || []).filter((t) => techLv(t) < TECH_MAX);
  const tot = ids.reduce((a, t) => a + W[techRar(t)], 0);
  if (!tot) return ids.map((t) => [t, 1 / ids.length]);
  return ids.map((t) => [t, W[techRar(t)] / tot]).filter((x) => x[1] > 0);
}
const scrollBlock = (id) => (!isScroll(id) ? 'Not a scroll.' : scrollOdds(id).length ? '' : 'Every technique of this world is mastered.');
// Learn a technique, or raise it one level. Returns { id, fresh, lv }.
function gainTech(id, source) {
  if (!TECHNIQUES[id] || techLv(id) >= TECH_MAX) return null;
  const fresh = !techLv(id);
  S.tech.lv[id] = techLv(id) + 1;
  if (fresh) autoEquip(id);
  const res = { id, fresh, lv: S.tech.lv[id], source };
  emit(fresh ? 'technique' : 'techup', res);
  dirty = true;
  return res;
}
// Read n scrolls of one stack ('all' = the whole stack). Returns { id, n, res: [gainTech results] }.
function readScrolls(id, n) {
  if (scrollBlock(id)) return null;
  const k = Math.min(Math.floor(count(id)), n === 'all' ? Infinity : Math.max(1, n | 0));
  if (!k) return null;
  const res = [];
  for (let i = 0; i < k; i++) {
    const odds = scrollOdds(id);
    if (!odds.length) break;
    removeItem(id, 1);
    let r = Math.random(), pick = odds[odds.length - 1][0];
    for (const [t, p] of odds) { if (r < p) { pick = t; break; } r -= p; }
    const g = gainTech(pick, 'read');
    if (g) res.push(g);
  }
  S.stats.scrolls = (S.stats.scrolls || 0) + res.length;
  emit('scrollsread', { id, n: res.length, res });
  return { id, n: res.length, res };
}
function readAllScrolls() {
  const out = [];
  for (const id of scrollIds().sort((a, b) => ITEMS[a].srar - ITEMS[b].srar)) { const r = readScrolls(id, 'all'); if (r && r.n) out.push(r); }
  return out;
}
// The sure path: Cursed Fragments level a technique you already know.
const infuseCost = () => CURSED_PER_LEVEL;
function infuseTech(id) {
  if (!techLv(id) || techLv(id) >= TECH_MAX || count('cursed_fragment') < CURSED_PER_LEVEL) return false;
  removeItem('cursed_fragment', CURSED_PER_LEVEL);
  return !!gainTech(id, 'infuse');
}
// Scrolls you could read now (the menu badge).
const techReady = () => (techOn() ? scrollIds().filter((k) => !scrollBlock(k)).reduce((a, k) => a + Math.floor(count(k)), 0) : 0);

// Older saves. v1 (typed slots + fragments) and v2 (currency, six open slots): techniques keep their
// level, the loadout fills the new slots by kind, fragments become Common scrolls of their world.
function techMigrateSave(d) {
  const T = d.tech, items = d.items = d.items || {};
  const lv = {};
  for (const id in T.lv || {}) if (TECHNIQUES[id] && T.lv[id] > 0) lv[id] = Math.min(TECH_MAX, T.lv[id]);
  const old = Array.isArray(T.loadout) ? T.loadout : ['atk1', 'def', 'atk2', 'atk3', 'sup', 'pas', 'ult'].map((k) => (T.slots && !Array.isArray(T.slots) ? T.slots[k] : null));
  const out = TECH_SLOTS.map(() => null);
  for (const id of old) {
    if (!id || !lv[id] || out.includes(id)) continue;
    const i = TECH_SLOTS.findIndex((s, k) => s.kind === TECH_CATS[TECHNIQUES[id].cat].kind && !out[k]);
    if (i >= 0) out[i] = id;
  }
  const give = (k, n) => { if (n > 0) items[k] = (items[k] || 0) + n; };
  for (const id in T.frag || {}) if (TECHNIQUES[id]) give('scroll_' + TECHNIQUES[id].realm, Math.ceil((T.frag[id] || 0) / 3));
  for (const id in TECHNIQUES) { const k = 'scroll_' + id; if (items[k]) { give('scroll_' + TECHNIQUES[id].realm, items[k]); delete items[k]; } }
  d.tech = { lv, loadout: out, pity: T.pity || 0, v: 3 };
}

/* ------------------------------------------------------------ scroll drops */
// Every foe of a world with techniques can drop its scrolls; guardians drop them far more often.
// Pity (Common): 120 kills in a row without any scroll guarantees one; your very first comes by the 10th kill.
const SCROLL_RATE = { 1: 1 / 80, 3: 1 / 450, 4: 1 / 2500, 5: 1 / 12000 };
const SCROLL_BOSS = 8, SCROLL_PITY = 120;
for (const r in TECH_POOLS) for (const [suf, rar, nm] of SCROLL_TIERS) {
  const id = 'scroll_' + r + suf;
  if (!ITEMS[id]) defItem(id, nm + (SCROLL_NAME[r] || `${REALMS[r] ? REALMS[r].name : r} Scroll`), '📜', 40 * rar * rar, { type: 'scroll', pool: r, base: 'scroll_' + r });
  Object.assign(ITEMS[id], { srar: rar, rarity: rar, pool: r,
    desc: `Read it to learn a technique of its world, or raise one you know by a level. The rarer the scroll, the likelier a rare technique.` });
  if (typeof ICONS !== 'undefined' && ICONS.item && !ICONS.item[id]) { ICONS.item[id] = ICONS.item['scroll_' + r]; if (typeof ICON_COLOR !== 'undefined') ICON_COLOR[id] = ICON_COLOR['scroll_' + r]; }
}
for (const z of ZONES) {
  if (!TECH_POOLS[z.realm]) continue;
  for (const e of z.enemies) for (const [suf, rar] of SCROLL_TIERS) e.drops.push(['scroll_' + z.realm + suf, Math.min(0.5, SCROLL_RATE[rar] * (z.boss ? SCROLL_BOSS : 1)), [1, 1]]);
}
hook('kill', (e, z, loot, dropped) => {
  const sid = 'scroll_' + z.realm;
  if (!TECH_POOLS[z.realm]) return;
  S.tech.pity = (S.tech.pity || 0) + 1;
  const any = SCROLL_TIERS.some(([suf]) => loot[sid + suf]);
  const first = !Object.keys(S.tech.lv).length && !scrollsOwned() && !S.stats.scrollFound;
  if (!any && (S.tech.pity >= SCROLL_PITY || (first && S.stats.kills >= 9))) {
    addItem(sid, 1); loot[sid] = 1; dropped.push(ITEMS[sid].name);
  }
  if (!any && !loot[sid]) return;
  S.tech.pity = 0;
  if (!S.stats.scrollFound) { S.stats.scrollFound = 1; emit('firstscroll', sid); }
});

/* ------------------------------------------------------------ in battle */
// Chakra / Cursed Energy, and a weapon whose awakened element matches the technique's tag (weapons.js).
const domainOpen = () => (RT.fx.domain || 0) > 0;
// A technique sharing an element tag with the open domain is 50% stronger.
const domainMult = (id) => (id && domainOpen() && RT.domainTags && TECHNIQUES[id].tags.some((t) => t !== 'domain' && RT.domainTags.includes(t)) ? 1.5 : 1);
const techPower = () => (1 + discFx('tech')) * (pasLv('chakra_control') ? 1 + 0.08 + 0.01 * (pasLv('chakra_control') - 1) + (pasLv('chakra_control') >= 10 ? 0.1 : 0) : 1) * (typeof armTechMult === 'function' ? armTechMult(RT.casting) : 1) * domainMult(RT.casting)
  * (typeof pactOn === 'function' && pactOn('narrow') ? 1 + 0.3 * pactMult() : 1) * ((RT.fx.scarlet || 0) > 0 ? 1.3 + 0.03 * ((isEquipped('nen_special') ? techLv('nen_special') : 1) - 1) : 1);
// pierce: share of the foe's defense ignored.
const strike = (e, mult, label, crit, pierce) => dealDamage(e, Math.max(1, Math.round(pMaxHit() * mult * techPower() * mitig(e.def * hmul('edef') * (1 - (pierce || 0))))), !!crit, label);
const alive = () => S.combat.enemy != null;
const CD10 = { fire_lotus: 14, healing_palm: 8, cannon_volley: 13, ki_blast: 9, nen_enhance: 10 };
const techCd = (id) => (CD10[id] && techTier(id, 10) ? CD10[id] : TECHNIQUES[id].cd);
const CAST = {
  shadow_strike(e, L) {
    const m = (2 + 0.2 * (L - 1)) * (L >= 5 ? 1.5 : 1);
    strike(e, m, 'Shadow Strike', L >= 5);
    if (L >= 10 && alive()) strike(e, m, 'Shadow Strike', true);
  },
  kunai_volley(e, L) {
    const n = L >= 10 ? 5 : L >= 5 ? 4 : 3;
    for (let i = 0; i < n && alive(); i++) strike(e, 0.7 + 0.08 * (L - 1), i ? '' : 'Kunai Volley');
  },
  fire_lotus(e, L) {
    strike(e, 4 + 0.4 * (L - 1), 'Fire Lotus');
    if (L >= 5) { RT.fx.burn = 4; RT.burnT = 0; }
  },
  healing_palm(e, L) {
    const m = pMaxHp(), h = Math.round(m * (0.15 + 0.02 * (L - 1)) * techPower());
    S.combat.hp = Math.min(m, S.combat.hp + h);
    if (L >= 5) RT.fx.regen = 5;
    emit('tech', { id: 'healing_palm', heal: h });
  },
  mist_step(e, L) { RT.fx.mist = L >= 5 ? 7 : 5; emit('tech', { id: 'mist_step' }); },
  iron_skin(e, L) {
    RT.fx.skin = L >= 5 ? 8 : 6;
    if (L >= 10) { const m = pMaxHp(); S.combat.hp = Math.min(m, S.combat.hp + Math.round(m * 0.05)); }
    emit('tech', { id: 'iron_skin' });
  },
  sealing_mark(e, L) { RT.fx.mark = L >= 5 ? 12 : 8; emit('tech', { id: 'sealing_mark' }); },
  iron_fist(e, L) { const m = 2.5 + 0.25 * (L - 1), p = L >= 5 ? 0.3 : 0; strike(e, m, 'Armament Fist', false, p); if (L >= 10 && alive()) strike(e, m, '', false, p); },
  foresight(e, L) { RT.fx.fore = L >= 5 ? 7 : 5; emit('tech', { id: 'foresight' }); },
  cannon_volley(e, L) { const m = 4.5 + 0.45 * (L - 1); strike(e, m, 'Cannon Volley'); if (L >= 5 && alive()) strike(e, m / 2, ''); },
  reaper_slash(e, L) { const m = 3 + 0.3 * (L - 1), p = L >= 5 ? 0.25 : 0; strike(e, m, 'Reaper Slash', false, p); if (L >= 10 && alive()) strike(e, m, '', false, p); },
  soul_ward(e, L) {
    const mx = pMaxHp(), h = Math.round(mx * (0.1 + 0.015 * (L - 1)) * (L >= 10 ? 2 : 1) * techPower());
    S.combat.hp = Math.min(mx, S.combat.hp + h); RT.fx.ward = L >= 5 ? 8 : 5; emit('tech', { id: 'soul_ward', heal: h });
  },
  spirit_chain(e, L) { RT.fx.chain = L >= 5 ? 12 : 8; emit('tech', { id: 'spirit_chain' }); },
  ki_blast(e, L) { const m = 3.5 + 0.35 * (L - 1); strike(e, m, 'Ki Blast'); if (L >= 5 && alive()) strike(e, m / 2, ''); },
  nen_enhance(e, L) { strike(e, 5 + 0.5 * (L - 1), 'Rock Fist', false, L >= 5 ? 0.3 : 0); },
  nen_emit(e, L) { const n = L >= 10 ? 7 : L >= 5 ? 6 : 5; for (let i = 0; i < n && alive(); i++) strike(e, 0.9 + 0.09 * (L - 1), i ? '' : 'Aura Bullets'); },
  nen_conjure(e, L) {
    RT.fx.cshield = L >= 5 ? 7 : 5;
    if (L >= 10) { const m = pMaxHp(); S.combat.hp = Math.min(m, S.combat.hp + Math.round(m * 0.05)); }
    emit('tech', { id: 'nen_conjure' });
  },
  nen_manip(e, L) { RT.fx.puppet = L >= 5 ? 12 : 8; emit('tech', { id: 'nen_manip' }); },
  nen_special(e, L) { RT.fx.scarlet = L >= 5 ? 15 : 10; if (L >= 10) strike(e, 8, 'Scarlet Eyes', true); emit('tech', { id: 'nen_special' }); },
  domain_blaze(e, L) { strike(e, 6 + 0.6 * (L - 1), 'Infinite Blaze'); openDomain('domain_blaze', L); },
  domain_storm(e, L) { strike(e, 5 + 0.5 * (L - 1), 'Storm Sanctum'); openDomain('domain_storm', L); },
  domain_garden(e, L) { for (let i = 0; i < 6 && alive(); i++) strike(e, 1 + 0.1 * (L - 1), i ? '' : 'Crimson Garden'); openDomain('domain_garden', L); },
  domain_shrine(e, L) { const m = pMaxHp(); S.combat.hp = Math.min(m, S.combat.hp + Math.round(m * (0.3 + 0.02 * (L - 1)) * techPower())); openDomain('domain_shrine', L); },
};
// Domain Expansion: one domain at a time; its rule lasts 10s (15s from level 5).
function openDomain(id, L) {
  RT.fx.domain = L >= 5 ? 15 : 10;
  RT.domainId = id; RT.domainLv = L; RT.domainTags = TECHNIQUES[id].tags;
  S.stats.domains = (S.stats.domains || 0) + 1;
  emit('tech', { id });
}
const inDomain = (id) => domainOpen() && RT.domainId === id;
hook('haste', () => (inDomain('domain_storm') ? 1.2 : 1));
hook('edef', () => (inDomain('domain_garden') ? (RT.domainLv >= 10 ? 0.5 : 0.7) : 1));
hook('taken', () => (inDomain('domain_shrine') ? 0.7 : 1));
hook('combat', (dt) => {
  if (!domainOpen()) return;
  if (inDomain('domain_storm') && RT.domainLv >= 10) for (const k in RT.cd) if (k !== 'domain_storm') RT.cd[k] -= dt;
  if (inDomain('domain_shrine') && RT.domainLv >= 10) { const m = pMaxHp(); S.combat.hp = Math.min(m, S.combat.hp + m * 0.03 * dt); }
});
// Defensive techniques wait for their moment.
// ...or when the foe is winding up a telegraphed move (foes.js).
const hurt = () => S.combat.hp < 0.85 * pMaxHp() || (typeof foeWinding === 'function' && foeWinding());
const TECH_WHEN = { healing_palm: () => S.combat.hp < 0.6 * pMaxHp(), mist_step: hurt, iron_skin: hurt, foresight: hurt, nen_conjure: hurt,
  soul_ward: () => S.combat.hp < 0.7 * pMaxHp() };
hook('combat', (dt, e) => {
  if (!techOn() || !e || (typeof pactOn === 'function' && pactOn('silence'))) return;
  for (const k in RT.cd) RT.cd[k] -= dt;
  for (const k in RT.fx) RT.fx[k] -= dt;
  // running effects
  if ((RT.fx.burn || 0) > 0) {
    RT.burnT = (RT.burnT || 0) + dt;
    while (RT.burnT >= 1 && alive()) { RT.burnT -= 1; strike(e, 0.15, ''); }
    if (!alive()) return;
  }
  if ((RT.fx.regen || 0) > 0) { const m = pMaxHp(); S.combat.hp = Math.min(m, S.combat.hp + m * 0.02 * dt); }
  for (const id of equipped()) {
    if (playerHeld()) break;                 // stunned: no techniques
    if (TECHNIQUES[id].cat === 'passive' || (RT.cd[id] || 0) > 0 || (TECH_WHEN[id] && !TECH_WHEN[id]())) continue;
    RT.cd[id] = techCd(id);
    S.stats.techUses = (S.stats.techUses || 0) + 1;
    RT.casting = id;
    CAST[id](e, techLv(id));
    RT.casting = null;
    if (!alive()) return;
  }
});
hook('tick', () => { if (S.combat.zone == null) { RT.fx = {}; RT.cd = {}; } });
const fxOn = (k) => (RT.fx[k] || 0) > 0;
const eqLv = (id) => (isEquipped(id) ? techLv(id) : 0);
hook('dodge', () => (fxOn('mist') ? 0.4 + 0.03 * (eqLv('mist_step') - 1) : 0) + (fxOn('fore') ? 0.35 + 0.03 * (eqLv('foresight') - 1) : 0));
hook('taken', () => (fxOn('ward') ? 0.8 : 1) * (fxOn('chain') ? 1 - (0.2 + 0.02 * (eqLv('spirit_chain') - 1)) : 1) * (fxOn('cshield') ? 1 - (0.4 + 0.03 * (eqLv('nen_conjure') - 1)) : 1));
hook('dmg', () => (fxOn('chain') && eqLv('spirit_chain') >= 10 ? 1.15 : 1));
hook('combat', (dt) => { if (fxOn('puppet')) S.combat.eT += dt * (eqLv('nen_manip') >= 10 ? 0.4 : 0.25); });
// Passive techniques: a bonus while equipped (in an open slot that fights).
function pasLv(id) { return isEquipped(id) ? techLv(id) : 0; }   // passives are never cut by Narrow Path (it limits actives)
// The first three worlds' passives
hook('hp', () => (pasLv('chakra_control') >= 5 ? 1.05 : 1));
hook('dodge', () => { const L = pasLv('observation_haki'); return L ? 0.04 + 0.005 * (L - 1) + (L >= 10 ? 0.05 : 0) : 0; });
hook('def', () => (pasLv('observation_haki') >= 5 ? 1.05 : 1));
hook('taken', () => { const L = pasLv('reiatsu_pressure'); return L ? 1 - (0.06 + 0.01 * (L - 1) + (L >= 10 ? 0.06 : 0)) : 1; });
hook('dmg', () => (pasLv('reiatsu_pressure') >= 5 ? 1.05 : 1));
hook('dmg', () => { const L = pasLv('battle_instinct'); return L ? 1 + 0.05 + 0.01 * (L - 1) : 1; });
hook('hp', () => { const a = pasLv('battle_instinct'), b = pasLv('iron_body'); return (a >= 5 ? 1.05 : 1) * (b ? 1 + 0.08 + 0.015 * (b - 1) : 1); });
hook('def', () => (pasLv('iron_body') >= 5 ? 1.05 : 1));
hook('spdStat', () => (pasLv('battle_instinct') >= 10 ? 10 : 0));
hook('speed', () => { const L = pasLv('zen_focus'); return L ? 1 + 0.04 + 0.006 * (L - 1) : 1; });
hook('xp', () => (pasLv('zen_focus') >= 5 ? 1.05 : 1));
hook('luckStat', () => (pasLv('zen_focus') >= 10 ? 10 : 0));
hook('haste', () => (pasLv('nen_trans') >= 5 ? 1.05 : 1));
hook('combat', (dt) => { if (pasLv('iron_body') >= 10) { const m = pMaxHp(); S.combat.hp = Math.min(m, S.combat.hp + m * 0.01 * dt); } });
// Scarlet Eyes (Nen Specialization) makes every technique stronger while it lasts: see techPower.
hook('taken', () => (fxOn('skin') ? 1 - (0.3 + 0.03 * (eqLv('iron_skin') - 1)) : 1));
hook('edef', () => (fxOn('mark') ? 1 - (0.25 + 0.03 * (eqLv('sealing_mark') - 1)) : 1));
hook('dmg', () => (fxOn('mark') && eqLv('sealing_mark') >= 10 ? 1.15 : 1));
// Mist Step level 10: every dodge strikes back (an enemy hit that left your HP untouched was dodged).
{
  const base = enemyHit;
  enemyHit = function (e) {
    const hp = S.combat.hp, counter = fxOn('mist') && eqLv('mist_step') >= 10;   // also Foresight level 10 heals on a dodge
    base(e);
    if (counter && S.combat.hp === hp && S.combat.zone != null && alive()) strike(e, 1, 'Counter');
    if (S.combat.hp === hp && fxOn('fore') && eqLv('foresight') >= 10) S.combat.hp = Math.min(pMaxHp(), S.combat.hp + pMaxHp() * 0.03);
  };
}
