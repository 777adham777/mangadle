'use strict';
/* ==========================================================================
   TRI-REALM — techniques (GDD §2.2), DOM-free. Data: TECHNIQUES in worlds.js.
   - Collection: S.tech.lv[id] = level (1-10), S.tech.frag[id] = fragments.
   - Scrolls drop in battle and are read at once: a random technique of that world
     (unknown ones 3× as likely, and a pity counter guarantees one). Duplicates → fragments.
   - Crafted scrolls teach a chosen technique (deterministic).
   - Typed slots, filled by category. In battle each equipped technique fires as soon as its
     cooldown is over, in slot order; defensive ones wait for their condition. No energy bar.
   ========================================================================== */

const techOn = () => isUnlocked('feature:techniques');
const techLv = (id) => S.tech.lv[id] || 0;
const techFrag = (id) => S.tech.frag[id] || 0;
const FRAG_PER_DUP = 5;
// Fragments to go from level L to L+1.
const FRAG_COST = [0, 3, 4, 5, 6, 8, 10, 12, 15, 20];
const fragCost = (id) => (techLv(id) >= TECH_MAX ? 0 : FRAG_COST[techLv(id)]);
const techTier = (id, t) => techLv(id) >= t;

const TECH_CATS = {
  attack:   { name: 'Attack',   icon: 'atk' },
  defense:  { name: 'Defense',  icon: 'def' },
  support:  { name: 'Support',  icon: 'tsup' },
  passive:  { name: 'Passive',  icon: 'tpas' },
  ultimate: { name: 'Ultimate', icon: 'tult' },
};
// Slots open with your Character level, then one per world (GDD proposal, see docs/DECISIONS.md).
const TECH_SLOTS = [
  { id: 'atk1', cat: 'attack',   name: 'Attack I',   open: () => true },
  { id: 'def',  cat: 'defense',  name: 'Defense',    open: () => charLv() >= 8,  hint: 'Character level 8' },
  { id: 'atk2', cat: 'attack',   name: 'Attack II',  open: () => charLv() >= 15, hint: 'Character level 15' },
  { id: 'atk3', cat: 'attack',   name: 'Attack III', open: () => charLv() >= 35, hint: 'Character level 35' },
  { id: 'sup',  cat: 'support',  name: 'Support',    open: () => !!S.gates.soul, hint: 'Reach Soul City' },
  { id: 'pas',  cat: 'passive',  name: 'Passive',    open: () => !!S.gates.ki,   hint: 'Reach Kaio Planet' },
  { id: 'ult',  cat: 'ultimate', name: 'Ultimate',   open: () => !!S.gates.hex,  hint: 'Reach Shinjuku' },
];
const SLOT_BY = Object.fromEntries(TECH_SLOTS.map((s) => [s.id, s]));
const openSlots = () => TECH_SLOTS.filter((s) => s.open());
const equipped = () => openSlots().slice(0, typeof pactOn === 'function' && pactOn('narrow') ? 2 : 99).map((s) => S.tech.slots[s.id]).filter((id) => id && techLv(id));
const isEquipped = (id) => Object.values(S.tech.slots).includes(id);
const slotFor = (id) => TECH_SLOTS.find((s) => s.cat === TECHNIQUES[id].cat && s.open() && !S.tech.slots[s.id]);

function equipTech(slot, id) {
  const sl = SLOT_BY[slot];
  if (!sl || !sl.open()) return false;
  if (id && (!techLv(id) || TECHNIQUES[id].cat !== sl.cat)) return false;
  for (const k in S.tech.slots) if (S.tech.slots[k] === id) S.tech.slots[k] = null;
  S.tech.slots[slot] = id || null;
  dirty = true;
  return true;
}

/* ------------------------------------------------------------ learning */
// Learn a technique, or turn a copy into fragments. Returns { id, fresh, frag }.
function gainTech(id, source) {
  if (!TECHNIQUES[id]) return null;
  let res;
  if (!techLv(id)) {
    S.tech.lv[id] = 1;
    const sl = slotFor(id);
    if (sl) S.tech.slots[sl.id] = id;
    res = { id, fresh: true, frag: 0, source };
  } else {
    S.tech.frag[id] = techFrag(id) + FRAG_PER_DUP;
    res = { id, fresh: false, frag: FRAG_PER_DUP, source };
  }
  S.stats.scrolls = (S.stats.scrolls || 0) + 1;
  emit('technique', res);
  dirty = true;
  return res;
}
// Read a world's scroll: a random technique of that world, unknown ones 3× as likely.
function readScroll(pool, source) {
  const ids = TECH_POOLS[pool];
  if (!ids || !ids.length) return null;
  return gainTech(rollWeighted(ids.map((id) => [id, techLv(id) ? 1 : 3])), source);
}
function upgradeTech(id) {
  const c = fragCost(id);
  if (!techLv(id) || !c || techFrag(id) < c) return false;
  S.tech.frag[id] -= c;
  S.tech.lv[id]++;
  emit('techup', { id, lv: S.tech.lv[id] });
  dirty = true;
  return true;
}

/* ------------------------------------------------------------ scroll drops */
// Every foe of a world with a technique pool can drop that world's scroll. Bosses drop it often.
// Pity: 60 kills in a row without one guarantees the next; your very first comes by the 10th kill.
const SCROLL_RATE = 1 / 40, SCROLL_BOSS = 1 / 4, SCROLL_PITY = 60;
for (const z of ZONES) {
  if (!TECH_POOLS[z.realm]) continue;
  for (const e of z.enemies) e.drops.push(['scroll_' + z.realm, z.boss ? SCROLL_BOSS : SCROLL_RATE, [1, 1]]);
}
hook('kill', (e, z, loot, dropped) => {
  const sid = 'scroll_' + z.realm;
  if (!TECH_POOLS[z.realm]) return;
  S.tech.pity = (S.tech.pity || 0) + 1;
  if (!loot[sid] && (S.tech.pity >= SCROLL_PITY || (!Object.keys(S.tech.lv).length && S.stats.kills >= 9))) {
    addItem(sid, 1); loot[sid] = 1; dropped.push(ITEMS[sid].name);
  }
  if (!loot[sid]) return;
  S.tech.pity = 0;
  for (let i = 0; i < loot[sid]; i++) readScroll(z.realm, e.name);
  removeItem(sid, loot[sid]);
});
// Crafted scrolls teach their technique at once (they never sit in the bank).
hook('action', (skill, act) => {
  const o = act.out && Object.keys(act.out)[0], it = o && ITEMS[o];
  if (!it || it.type !== 'scroll') return;
  const n = count(o);
  removeItem(o, n);
  for (let i = 0; i < n; i++) (it.tech ? gainTech(it.tech, SKILLS[skill].name) : readScroll(it.pool, SKILLS[skill].name));
});
hook('block', (skill, act) => {
  const it = act.out && ITEMS[Object.keys(act.out)[0]];
  return it && it.tech && techLv(it.tech) >= TECH_MAX ? 'Mastered. This technique is already level 10.' : '';
});

/* ------------------------------------------------------------ in battle */
// Chakra / Cursed Energy, and a weapon whose awakened element matches the technique's tag (weapons.js).
const domainOpen = () => (RT.fx.domain || 0) > 0;
// A technique sharing an element tag with the open domain is 50% stronger.
const domainMult = (id) => (id && domainOpen() && RT.domainTags && TECHNIQUES[id].tags.some((t) => t !== 'domain' && RT.domainTags.includes(t)) ? 1.5 : 1);
const techPower = () => (1 + discFx('tech')) * (typeof armTechMult === 'function' ? armTechMult(RT.casting) : 1) * domainMult(RT.casting)
  * (typeof pactOn === 'function' && pactOn('narrow') ? 1 + 0.3 * pactMult() : 1);
const strike = (e, mult, label, crit) => dealDamage(e, Math.max(1, Math.round(pMaxHit() * mult * techPower() * mitig(e.def * hmul('edef')))), !!crit, label);
const alive = () => S.combat.enemy != null;
const techCd = (id) => (id === 'fire_lotus' && techTier(id, 10) ? 14 : id === 'healing_palm' && techTier(id, 10) ? 8 : TECHNIQUES[id].cd);
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
// Cursed Fragments (Cursed Research) count as fragments of any technique you know.
function infuseTech(id) {
  const need = fragCost(id) - techFrag(id), n = Math.min(need, count('cursed_fragment'));
  if (!techLv(id) || n <= 0) return false;
  removeItem('cursed_fragment', n);
  S.tech.frag[id] = techFrag(id) + n;
  dirty = true;
  return true;
}
// Defensive techniques wait for their moment.
const hurt = () => S.combat.hp < 0.85 * pMaxHp();
const TECH_WHEN = { healing_palm: () => S.combat.hp < 0.6 * pMaxHp(), mist_step: hurt, iron_skin: hurt };
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
    if ((RT.cd[id] || 0) > 0 || (TECH_WHEN[id] && !TECH_WHEN[id]())) continue;
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
hook('dodge', () => (fxOn('mist') ? 0.4 + 0.03 * (eqLv('mist_step') - 1) : 0));
hook('taken', () => (fxOn('skin') ? 1 - (0.3 + 0.03 * (eqLv('iron_skin') - 1)) : 1));
hook('edef', () => (fxOn('mark') ? 1 - (0.25 + 0.03 * (eqLv('sealing_mark') - 1)) : 1));
hook('dmg', () => (fxOn('mark') && eqLv('sealing_mark') >= 10 ? 1.15 : 1));
// Mist Step level 10: every dodge strikes back (an enemy hit that left your HP untouched was dodged).
{
  const base = enemyHit;
  enemyHit = function (e) {
    const hp = S.combat.hp, counter = fxOn('mist') && eqLv('mist_step') >= 10;
    base(e);
    if (counter && S.combat.hp === hp && S.combat.zone != null && alive()) strike(e, 1, 'Counter');
  };
}
