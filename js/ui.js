'use strict';
/* ==========================================================================
   TRI-REALM IDLE — UI layer
   Layout of an RPG incremental: every skill is one click away in a permanent
   sidebar, the current farm is always visible in the top activity bar, and
   skill pages show every action as a full card (time, XP/h, materials, owned).
   - render(): structural rebuild of nav / activity bar / main, only when `dirty`
   - update(): cheap per-frame sync of bars, numbers and states
   - BUS listeners: feedback (item-obtained popups, floats, level-up banners)
   ========================================================================== */

const $ = (sel, root) => (root || document).querySelector(sel);
const $$ = (sel, root) => Array.from((root || document).querySelectorAll(sel));
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const skillsOf = (realm) => Object.keys(SKILLS).filter((k) => SKILLS[k].realm === realm);
const openSkillsOf = (realm) => skillsOf(realm).filter(skillOpen);
const openRealms = () => ['seas', 'soul', 'shinobi'].filter(realmOpen);   // in the order they open
const totalLevel = () => Object.keys(SKILLS).reduce((a, k) => a + skillLv(k), 0);

// UI accent per world
const RC = { shinobi: '#ff9a4d', soul: '#a98bff', seas: '#4cc3ff', combat: '#ff5d73', rift: '#ff5bd8', hub: '#f4c66a' };
const rc = (r) => RC[r] || RC.hub;

/* =============================================================== icons */
const hasIcons = () => typeof ICONS !== 'undefined' && typeof GI !== 'undefined';
function gi(name, cls) { return name ? `<svg class="gi${cls ? ' ' + cls : ''}" aria-hidden="true"><use href="#gi-${name}"/></svg>` : ''; }
function icName(kind, id) {
  if (!hasIcons()) return null;
  const t = ICONS[kind];
  const n = t ? t[id] : null;
  return n && GI[n] ? n : (ICONS.ui && GI[ICONS.ui.info] ? ICONS.ui.info : null);
}
const ic = (kind, id, cls) => gi(icName(kind, id), cls);
const ui = (k, cls) => ic('ui', k, cls);
const itemIc = (id, cls) => (id === 'FRUIT' ? ui('fruit', cls) : id === 'GEM' ? ui('gem', cls) : ic('item', id, cls));
const actIc = (skill, a, cls) => (a.loot ? ic('voyage', a.id, cls) : itemIc(Object.keys(a.out)[0], cls));
function installSprite() {
  if (!hasIcons() || $('#gi-sprite')) return;
  const syms = Object.entries(GI).map(([n, d]) => `<symbol id="gi-${n}" viewBox="0 0 512 512"><path d="${d}"/></symbol>`).join('');
  document.body.insertAdjacentHTML('afterbegin', `<svg id="gi-sprite" width="0" height="0" style="position:absolute" aria-hidden="true">${syms}</svg>`);
}

/* =============================================================== rarity + tiles */
function rarity(id) {
  if (id === 'FRUIT') return 5;
  if (id === 'GEM') return 3;
  const it = ITEMS[id];
  if (!it) return 1;
  if (it.type === 'fruit' || id === 'rift_shard') return 5;
  if (it.type === 'gem') return it.value >= 180 ? 4 : 3;
  const v = it.value;
  return v >= 2000 ? 5 : v >= 300 ? 4 : v >= 60 ? 3 : v >= 12 ? 2 : 1;
}
const rarityVoy = (a) => (a.level < 25 ? 3 : a.level < 55 ? 4 : 5);
const actRarity = (a) => (a.loot ? rarityVoy(a) : rarity(Object.keys(a.out)[0]));
const TYPE_LABEL = { res: 'Material', food: 'Food', gem: 'Gem', chest: 'Treasure', fruit: 'Abyss Fruit' };
const typeLabel = (id) => { const it = ITEMS[id]; return it.type === 'equip' ? it.slot[0].toUpperCase() + it.slot.slice(1) : TYPE_LABEL[it.type] || 'Item'; };
const fruitLabel = (id) => (id === 'FRUIT' ? 'Random Abyss Fruit' : id === 'GEM' ? 'Random gem' : ITEMS[id].name);
function stars(r) { return `<span class="stars">${'<i></i>'.repeat(r)}</span>`; }

// An item tile: art area tinted by rarity + a light count strip.
function tile(id, n, o) {
  o = o || {};
  const r = o.unknown ? 0 : (o.r || rarity(id));
  const tag = o.tag || 'span';
  const art = o.unknown ? '<b class="q">?</b>' : (o.icon || itemIc(id));
  return `<${tag} class="tile r${r} ${o.cls || ''}" ${o.attrs || ''} title="${esc(o.title || (o.unknown ? 'Undiscovered' : id ? fruitLabel(id) : ''))}">`
    + `<span class="tile-art">${art}${o.corner || ''}</span>`
    + `${n == null || n === '' ? '' : `<span class="tile-n" ${o.nattrs || ''}>${n}</span>`}</${tag}>`;
}
function petTile(pt, o) {
  o = o || {};
  const got = S.pets[pt.id];
  return tile(null, o.n, Object.assign({ r: 5, icon: ic('pet', pt.id), unknown: !got && !o.reveal, title: got || o.reveal ? pt.name : 'Undiscovered pet' }, o));
}

/* =============================================================== small UI kit */
function gbtn(label, icon, attrs, cls) {
  return `<button class="gbtn ${cls || ''}" ${attrs || ''}>${icon ? `<i class="gbtn-ic">${ui(icon)}</i>` : ''}<span>${label}</span></button>`;
}
const hdr = (t, extra) => `<h3 class="hdr"><span>${t}</span>${extra ? `<small>${extra}</small>` : ''}</h3>`;
const ptitle = (small, big, right) => `<div class="ptitle"><div class="pt-txt"><small>${small}</small><h1>${big}</h1></div>${right || ''}</div>`;
const stat = (label, val, attrs) => `<div class="stat"><small>${label}</small><b ${attrs || ''}>${val}</b></div>`;

let selItem = null;
const seenItems = new Set();

/* =============================================================== routing */
function normalizeView() {
  const legacy = { overview: 'home', combat: 'battle', bank: 'hero', shop: 'market', rebirth: 'power' };
  let v = legacy[S.ui.view] || S.ui.view || 'home';
  if (v.startsWith('skill:')) {
    const s = v.split(':')[1];
    v = !SKILLS[s] ? 'home' : SKILLS[s].realm === 'combat' ? 'battle' : `realm:${SKILLS[s].realm}:${s}`;
  }
  const [name, realm, skill] = v.split(':');
  if (name === 'realm') {
    if (!REALMS[realm] || REALMS[realm].hidden || !realmOpen(realm)) v = 'home';
    else if (!skill || !SKILLS[skill] || SKILLS[skill].realm !== realm || !skillOpen(skill)) {
      const k = [S.ui.tab[realm], ...skillsOf(realm)].find((x) => x && SKILLS[x] && SKILLS[x].realm === realm && skillOpen(x));
      v = k ? `realm:${realm}:${k}` : 'home';
    }
  }
  const feat = featureOfView(v);
  if (feat && !featureOpen(feat)) v = 'home';
  if (!VIEWS[v.split(':')[0]]) v = 'home';
  S.ui.view = v;
}
function setView(v) {
  S.ui.view = v;
  normalizeView();
  const [name, realm, skill] = S.ui.view.split(':');
  if (name === 'realm') S.ui.tab[realm] = skill;
  $('#main').scrollTop = 0;
  document.body.classList.remove('menu-open');
  viewChanged = true;
  dirty = true;
}
let viewChanged = true;
const skillView = (k) => (SKILLS[k].realm === 'combat' ? 'battle' : `realm:${SKILLS[k].realm}:${k}`);
function viewAccent() {
  const [name, realm] = S.ui.view.split(':');
  return name === 'realm' ? rc(realm) : name === 'battle' ? rc('combat') : rc('hub');
}

/* =============================================================== top bar + sidebar */
function renderHud() {
  $('#hud').innerHTML = `
    <button class="menu-btn" data-menu title="Menu">${ui('menu')}</button>
    <button class="brand" data-nav="home">TRI<span>·</span>REALM</button>
    <div id="nowbar" class="nowbar"></div>
    <div class="curs">
      <div class="cur gold" title="Gold — buys upgrades in the Market"><i>${ui('gold')}</i><b id="r-gold">0</b></div>
      <div class="cur bounty" title="Bounty — earned by defeating enemies. Higher ranks give bonus damage."><i>${ui('bounty')}</i><b id="r-bounty">0</b></div>
      <div class="cur karma" title="Karma — earned by Rebirth, spent on permanent perks"><i>${ui('karma')}</i><b id="r-karma">0</b></div>
    </div>
    <button class="hud-btn" data-nav="settings" title="Settings">${ui('settings')}</button>`;
}
function isOn(key) {
  const v = S.ui.view;
  if (key === 'hero') return v === 'hero';
  return v === key || v.startsWith(key + ':');
}
function navRow(key, icon, label, o) {
  o = o || {};
  const on = !o.noOn && isOn(key);
  return `<button class="nav-row ${on ? 'on' : ''} ${o.sub ? 'sub' : ''}" data-nav="${key}" style="--rc:${o.color || rc('hub')}" title="${label}">
    <span class="nr-ic">${icon}</span><span class="nr-name">${label}</span>
    ${o.skill ? `<span class="nr-lv" data-lv="${o.skill}">${skillLv(o.skill)}</span><span class="nr-xp"><i data-xpbar="${o.skill}"></i></span>` : ''}
    ${o.busy ? '<i class="nr-busy"></i>' : ''}${o.skill && o.skill === guideSkill() && !o.busy ? '<i class="nr-goal" title="Current objective">!</i>' : ''}</button>`;
}
function renderRail() {
  const groups = [];
  const quick = [['home', 'home', 'Overview'], ['hero', 'hero', 'Bank'], ['hero:collection', 'collection', 'Collection'], ['market', 'market', 'Market'], ['power', 'power', 'Power'], ['settings', 'settings', 'Settings']];
  groups.push(`<div class="nav-quick">${quick.map(([k, icn, l]) => {
    const f = featureOfView(k);
    if (f && !featureOpen(f)) return `<button class="nq locked" data-locked="${f}" title="${esc(lockedNote(f))}">${ui('lock')}<span>${l}</span></button>`;
    return `<button class="nq ${isOn(k) ? 'on' : ''}" data-nav="${k}" title="${l}">${ui(icn)}<span>${l}</span>${k === 'power' && energyUsed() > 0 ? '<i class="nr-busy"></i>' : ''}</button>`;
  }).join('')}</div>`);
  if (featureOpen('battle')) groups.push(`<div class="nav-group"><div class="nav-sec" style="--rc:${rc('combat')}">${ui('battle')}Combat</div>
    ${navRow('battle', ui('battle'), S.combat.zone != null ? ZONES[S.combat.zone].name : 'Battlefield', { color: rc('combat'), busy: S.combat.zone != null })}
    <div class="nav-cskills">${['strength', 'defense', 'vitality'].map((k) => `<button class="ncs" data-nav="battle" title="${SKILLS[k].name}">${ic('skill', k)}<b data-lv="${k}">${skillLv(k)}</b><span class="nr-xp"><i data-xpbar="${k}"></i></span></button>`).join('')}</div></div>`);
  for (const r of openRealms()) {
    groups.push(`<div class="nav-group"><div class="nav-sec" style="--rc:${rc(r)}">${ic('realm', r)}${REALMS[r].name}</div>
      ${openSkillsOf(r).map((k) => navRow(`realm:${r}:${k}`, ic('skill', k), SKILLS[k].name, { skill: k, color: rc(r), busy: S.action && S.action.skill === k })).join('')}</div>`);
  }
  $('#rail').innerHTML = `<div class="nav-quest" id="navquest">${goalHTML()}</div>${groups.join('')}${nextUnlockHTML('nav-next')}`;
  $('#tabbar').innerHTML = [
    `<button class="tab-btn" data-menu>${ui('menu')}<span>Menu</span></button>`,
    ...[['home', 'home', 'Overview'], ['hero', 'hero', 'Bank'], ['battle', 'battle', 'Battle'], ['market', 'market', 'Market']]
      .map(([k, icn, l]) => {
        const f = featureOfView(k);
        if (f && !featureOpen(f)) return `<button class="tab-btn locked" data-locked="${f}">${ui('lock')}<span>${l}</span></button>`;
        return `<button class="tab-btn ${isOn(k) ? 'on' : ''}" data-nav="${k}">${ui(icn)}<span>${l}</span></button>`;
      }),
  ].join('');
}

/* =============================================================== unlocks + synergies */
function unlockIcon(u) {
  const [kind, ref] = u.id.split(':');
  return kind === 'realm' ? ic('realm', ref) : kind === 'skill' ? ic('skill', ref) : ui(ref);
}
const unlockKind = (u) => ({ realm: 'New world', skill: 'New skill', feature: 'New menu' }[u.id.split(':')[0]]);
// The one thing the player is working towards next. Only ever one, to keep the screen calm.
function nextUnlockHTML(cls) {
  const u = nextUnlock();
  if (!u) return '';
  return `<div class="nx ${cls}"><span class="nx-ic">${unlockIcon(u)}<i>${ui('lock')}</i></span>
    <span class="nx-t"><small>Next unlock</small><b>${esc(u.name)}</b><em>${esc(u.hint())}</em></span></div>`;
}
const SYN_KIND = { speed: 'speed', double: 'double output', xp: 'XP', rare: 'rare finds', heal: 'food healing', dmg: 'damage', hp: 'max HP' };
const synTargetName = (s) => (SKILLS[s.to] ? SKILLS[s.to].name : { gather: 'all gathering', craft: 'all crafting', all: 'every skill', combat: 'Combat' }[s.to]);
// dir 'in': shows the skill giving the bonus. dir 'out': shows who receives it.
function synRow(s, dir) {
  const otherOpen = dir === 'in' ? skillOpen(s.from) : synTargetOpen(s);
  if (!otherOpen) return `<div class="syn hidden"><span class="syn-ic">${ui('lock')}</span><span class="syn-t"><b>Undiscovered synergy</b><small>Links to a skill you have not unlocked yet</small></span></div>`;
  const icon = dir === 'in' ? ic('skill', s.from) : SKILLS[s.to] ? ic('skill', s.to) : s.to === 'combat' ? ui('battle') : ui('star');
  const v = synValue(s);
  return `<div class="syn ${v > 0 ? 'on' : ''}"><span class="syn-ic">${icon}</span>
    <span class="syn-t"><b>${s.name}</b><small>${dir === 'in' ? `From ${SKILLS[s.from].name}` : `To ${synTargetName(s)}`} · ${s.desc}</small></span>
    <span class="syn-v"><b>+${pct(v)}</b><small>${SYN_KIND[s.kind]} · +${pct(s.per)}/lv</small></span></div>`;
}
function synergyHTML(into, from) {
  const col = (title, list, dir) => `<div class="syn-col"><small class="syn-h">${title}</small>${list.length ? list.map((s) => synRow(s, dir)).join('') : '<div class="muted small">None</div>'}</div>`;
  return `${hdr('Synergies', 'every level here also helps another skill')}
  <div class="syn-grid">${col('Boosted by', into, 'in')}${col('Boosts', from, 'out')}</div>`;
}

/* =============================================================== shared bits */
function xpInfo(id) {
  const xp = S.skills[id].xp, L = levelOf(xp);
  const lo = XP_TABLE[L], hi = XP_TABLE[L + 1];
  return { L, p: L >= MAX_LEVEL ? 1 : (xp - lo) / (hi - lo), xp, need: L >= MAX_LEVEL ? 0 : hi - xp };
}
const xpText = (b) => (b.need ? `${fmt(b.xp)} XP <em>· ${fmt(b.need)} to next level</em>` : 'MAX LEVEL');
function statRows(st) {
  const rows = [];
  if (st.atk) rows.push(['atk', 'Attack', `+${st.atk}`]);
  if (st.def) rows.push(['def', 'Defense', `+${st.def}`]);
  if (st.hp) rows.push(['hp', 'Max HP', `+${st.hp}`]);
  if (st.gold) rows.push(['gold', 'Gold bonus', `+${pct(st.gold)}`]);
  return rows;
}
const statInline = (st) => statRows(st).map(([icn, , v]) => `<span>${ui(icn)}${v}</span>`).join('');
const attrList = (rows) => `<div class="attrs">${rows.map(([icn, l, v, attrs]) => `<div class="attr"><i>${ui(icn)}</i><span>${l}</span><b ${attrs || ''}>${v}</b></div>`).join('')}</div>`;
// Drop rates: common ones as %, rare ones as "1/N" (easier to read for long odds).
const fmtRate = (p) => (p >= 0.1 ? pct(Math.min(1, p)) : '1/' + Math.max(1, Math.round(1 / p)).toLocaleString('en-US'));

// Where every item comes from, with rates. Built once from the data tables.
let SOURCES = null;
function sourcesOf(id) {
  if (!SOURCES) {
    SOURCES = {};
    const add = (item, icon, text, rate) => {
      if (item === 'FRUIT') { FRUITS.forEach((f) => add(f, icon, text, rate == null ? null : rate / FRUITS.length)); return; }
      if (item === 'GEM') { const tot = GEM_TABLE.reduce((a, g) => a + g[1], 0); GEM_TABLE.forEach(([g, w]) => add(g, icon, text, rate * w / tot)); return; }
      (SOURCES[item] = SOURCES[item] || []).push({ icon, text, rate });
    };
    for (const k in SKILLS) for (const a of SKILLS[k].actions) {
      for (const o in a.out || {}) add(o, ['skill', k], `${SKILLS[k].name} Lv ${a.level}`, null);
      if (a.loot) {
        a.loot.table.forEach(([t]) => add(t, ['voyage', a.id], `Voyage · ${a.name}`, 1 / a.loot.table.length));
        a.loot.rare.forEach(([t, c]) => add(t, ['voyage', a.id], `Voyage · ${a.name}`, c));
      }
    }
    for (const k in RARE_FINDS) RARE_FINDS[k].forEach(([t, c]) => add(t, ['skill', k], `${SKILLS[k].name} · any action`, c));
    GLOBAL_RARE.forEach(([t, c]) => add(t, ['ui', 'rare'], 'Any skill action', c));
    for (const z of ZONES) for (const e of z.enemies) e.drops.forEach(([t, c]) => add(t, ['enemy', e.name], `${e.name} · ${z.name}`, c));
    for (const k in ITEMS) if (ITEMS[k].type === 'chest') {
      const tot = ITEMS[k].loot.reduce((a, l) => a + l[1], 0);
      ITEMS[k].loot.forEach(([t, w]) => add(t, ['item', k], ITEMS[k].name, w / tot));
    }
    SHOP.forEach((sh) => { if (sh.give) add(sh.give[0], ['shop', sh.id], 'Market', null); });
  }
  return SOURCES[id] || [];
}
function petSource(pet) {
  if (pet.skill) return `<li><span><i>${ic('skill', pet.skill)}</i>${SKILLS[pet.skill].name} · ~1 per ${PET_HOURS}h</span><b>Skill pet</b></li>`;
  const z = ZONES.find((x) => x.id === pet.zone);
  return `<li><span><i>${ic('enemy', z.enemies[0].name)}</i>${z.enemies[0].name}</span><b>${fmtRate(pet.chance)}</b></li>`;
}
const petBonus = (pet) => (pet.skill ? `+5% ${SKILLS[pet.skill].name} speed & XP` : '+3% damage & max HP');
function sourcesHTML(id) {
  const src = sourcesOf(id);
  if (!src.length) return '<div class="muted">No known source.</div>';
  return `<ul class="srcs">${src.slice(0, 8).map((x) => `<li><span><i>${ic(x.icon[0], x.icon[1])}</i>${esc(x.text)}</span>${x.rate != null ? `<b>${fmtRate(x.rate)}</b>` : '<b class="ok">Guaranteed</b>'}</li>`).join('')}</ul>`;
}

/* =============================================================== farm numbers */
function farmRates(skill, a) {
  const T = actionTime(skill, a), per = 3600 / T;
  const r = { T, per, xph: per * a.xp * skillXpMult(skill) };
  if (a.out) r.itemsh = per * Object.values(a.out)[0] * (1 + doubleChance(skill, a.id));
  if (a.in) { r.can = Math.min(...Object.entries(a.in).map(([k, n]) => Math.floor(count(k) / n))); r.runout = r.can * T; }
  return r;
}
function combatRates() {
  const z = ZONES[S.combat.zone], e = z.enemies[0];
  const kph = 3600 / (timeToKill(e) + (z.boss ? 3 : 1.2));
  return { z, kph, xph: kph * e.xp * 1.33 * xpMult(), goldh: kph * (e.gold[0] + e.gold[1]) / 2 * goldMult() };
}
// The big "now farming" block (overview + the active skill page).
function farmPanel() {
  if (S.action) {
    const skill = S.action.skill, s = SKILLS[skill], a = findAction(skill, S.action.id), f = farmRates(skill, a);
    const outId = a.out ? Object.keys(a.out)[0] : null;
    return `<div class="farm" style="--rc:${rc(s.realm)}">
      <div class="fm-head">${tile(null, null, { r: actRarity(a), icon: actIc(skill, a), title: a.name })}
        <button class="fm-txt" data-nav="${skillView(skill)}"><small>Farming · ${s.name} Lv <em data-lv="${skill}">${skillLv(skill)}</em></small><b>${esc(a.name)}</b></button>
        ${gbtn('Stop', 'stop', 'data-stop', 'dark sm')}</div>
      <div class="fm-bar"><span class="pbar"><i data-nowfill></i></span><span class="fm-time" data-nowtime></span></div>
      <div class="fm-stats">
        ${outId ? stat('Items / hour', fmt(f.itemsh)) : stat('Voyages / hour', fmt(f.per))}
        ${stat('XP / hour', fmt(f.xph))}
        ${stat('Next level', '—', 'data-nextlv')}
        ${a.in ? stat('Can make', fmt(f.can), 'data-canmake') + stat('Runs out', fmtTime(f.runout), 'data-runout') : ''}
        ${outId ? stat('Owned', fmt(count(outId)), `data-count="${outId}"`) : ''}
      </div></div>`;
  }
  if (S.combat.zone != null) {
    const c = combatRates(), food = S.combat.food;
    return `<div class="farm" style="--rc:${rc('combat')}">
      <div class="fm-head">${tile(null, null, { r: c.z.boss ? 5 : 3, icon: ic('zone', c.z.id), title: c.z.name })}
        <button class="fm-txt" data-nav="battle"><small>Fighting${c.z.boss ? ' · Boss' : ''}</small><b>${c.z.name}</b></button>
        ${gbtn('Retreat', 'stop', 'data-stopcombat', 'dark sm')}</div>
      <div class="fm-bar"><span class="pbar hp"><i data-nowhp></i></span><span class="fm-time" data-hpnow></span></div>
      <div class="fm-stats">${stat('Kills / hour', '≈' + fmt(c.kph))}${stat('XP / hour', '≈' + fmt(c.xph))}${stat('Gold / hour', '≈' + fmt(c.goldh))}
        ${stat('Food left', food && count(food) ? `<span data-count="${food}">${fmt(count(food))}</span>` : '<span class="bad">None</span>')}</div></div>`;
  }
  return '';
}

/* =============================================================== VIEWS */
const VIEWS = {};

/* ------------------------------------------------------------- overview */
VIEWS.home = () => {
  const rank = BOUNTY_RANKS[bountyRank()];
  const farm = farmPanel();
  const skillCard = (k) => {
    const b = xpInfo(k), busy = (S.action && S.action.skill === k) || (SKILLS[k].realm === 'combat' && S.combat.zone != null);
    return `<button class="ov-skill ${busy ? 'busy' : ''}" data-nav="${skillView(k)}" style="--rc:${rc(SKILLS[k].realm)}">
      <span class="ovs-ic">${ic('skill', k)}</span><span class="ovs-main"><span class="ovs-top"><b>${SKILLS[k].name}</b><em><small>Lv</small> <span data-lv="${k}">${b.L}</span></em></span>
      <span class="xpbar thin"><i data-xpbar="${k}"></i></span></span></button>`;
  };
  return `
  ${ptitle('Tri-Realm Idle', 'Overview')}
  <div class="ov-top">
    <section class="win">${farm || `<div class="idle-big">${ui('sleep')}<div><b>Nothing is farming</b><p class="muted">Idle games only progress while an activity runs. Pick a skill in the menu, or follow the objective.</p>
      ${goalState() && !goalState().done ? gbtn('Go to: ' + esc(goalState().g.text), 'play', `data-nav="${goalState().g.go}"`, 'sm') : ''}</div></div>`}</section>
    <section class="win quest-win">${goalHTML()}</section>
  </div>
  ${hdr('Skills', `Total level ${totalLevel()} · ${UNLOCKS.filter((u) => S.unlocked[u.id]).length} / ${UNLOCKS.length} discovered`)}
  <div class="ov-grid">${[...openRealms(), ...(featureOpen('battle') ? ['combat'] : [])].map((r) => `
    <section class="win ov-realm" style="--rc:${rc(r)}"><h3 class="ov-rh">${r === 'combat' ? ui('battle') : ic('realm', r)}${r === 'combat' ? 'Combat' : REALMS[r].name}</h3>
      ${(r === 'combat' ? skillsOf(r) : openSkillsOf(r)).map(skillCard).join('')}</section>`).join('')}
    ${nextUnlockHTML('win ov-next')}</div>
  <section class="win">${hdr('Adventurer')}
    <div class="stats">${stat('Total level', totalLevel())}${stat('Bounty rank', rank[1])}${stat('Foes defeated', fmt(S.stats.kills))}${stat('Collection', Math.floor(collectionPct() * 100) + '%')}${stat('Pets', `${Object.keys(S.pets).length} / ${PETS.length}`)}${stat('Rebirths', fmt(S.rebirths))}</div>
  </section>`;
};

/* ------------------------------------------------------------- skill page */
VIEWS.realm = (realm, skill) => {
  const R = REALMS[realm], s = SKILLS[skill], b = xpInfo(skill);
  const mods = [`<span class="pill" title="Action speed">${ui('spd')} Speed ×${skillSpeed(skill).toFixed(2)}</span>`, `<span class="pill" title="XP multiplier">${ui('xp')} XP ×${skillXpMult(skill).toFixed(2)}</span>`];
  if (rareMult(skill) > 1) mods.push(`<span class="pill" title="Rare find multiplier">${ui('rare')} Luck ×${rareMult(skill).toFixed(2)}</span>`);
  if (skill === 'fishing' && S.fruit) mods.push(`<span class="pill bad" title="Abyss Fruit eaters fish 40% slower">${ui('fruit')} −40% speed</span>`);
  const open = s.actions.filter((x) => x.level <= b.L).length;
  const active = S.action && S.action.skill === skill;
  return `<div class="sk-layout" style="--rc:${rc(realm)}"><div class="sk-col">
  <section class="sk-banner" style="--rc:${rc(realm)}">
    <div class="sk-bg">${sceneHTML(realm, 'mini')}</div>
    <div class="sk-ic">${ic('skill', skill)}</div>
    <div class="sk-main"><small>${R.name}</small><h1>${s.name}</h1>
      <div class="sk-xp"><span class="pbar"><i data-xpbar="${skill}"></i></span><span class="sk-xpt" data-xptext="${skill}">${xpText(b)}</span></div>
      <div class="pills">${mods.join('')}</div></div>
    <div class="sk-lv"><small>Level</small><b data-lv="${skill}">${b.L}</b><span class="muted">/ ${MAX_LEVEL}</span></div>
  </section>
  ${active ? `<section class="win farm-win">${farmPanel()}</section>` : ''}
  ${hdr(s.type === 'voyage' ? 'Voyages' : s.type === 'craft' ? 'Recipes' : 'Gathering', `${open} / ${s.actions.length} unlocked · click a card to start`)}
  <div class="act-grid" style="--rc:${rc(realm)}">${s.actions.filter((x) => x.level <= b.L).map((x) => actCard(skill, x)).join('')}</div>
  ${open < s.actions.length ? `<div class="lock-strip">${s.actions.filter((x) => x.level > b.L).map((x) => `<div class="lchip" data-card="${skill}:${x.id}" data-state="locked" title="${esc(x.name)}: requires ${s.name} level ${x.level}">${tile(null, null, { r: actRarity(x), icon: actIc(skill, x), cls: 'xs' })}<span><b>${esc(x.name)}</b><small>${ui('lock')}Lv ${x.level}</small></span></div>`).join('')}</div>` : ''}
  </div><aside class="sk-side">
  <section class="win">${hdr('Milestones')}<div class="ms-row">${MILESTONES.map((m) => `<div class="msc ${b.L >= m.lv ? 'on' : ''}" style="--rc:${rc(realm)}" title="${m.name}: ${m.desc}"><b>${m.lv}</b><span><em>${m.name}</em><small>${m.desc}</small></span></div>`).join('')}</div></section>
  <section class="win">${hdr('Rare finds', `per action${rareMult(skill) > 1 ? ` · luck ×${rareMult(skill).toFixed(2)}` : ''}`)}<div class="tiles rare-row">${rareTiles(skill).join('')}</div></section>
  <section class="win syn-win" style="--rc:${rc(realm)}">${synergyHTML(synergiesInto(skill), synergiesFrom(skill))}</section>
  </aside></div>`;
};
function actState(skill, a) {
  if (skillLv(skill) < a.level) return 'locked';
  if (S.action && S.action.skill === skill && S.action.id === a.id) return 'active';
  if (a.in && !canAfford(a.in)) return 'missing';
  return 'ready';
}
function ctaLabel(skill, a, st) {
  st = st || actState(skill, a);
  if (st === 'active') return `${ui('stop')}Stop`;
  if (st === 'missing') return `${ui('close')}Missing items`;
  if (st === 'locked') return `${ui('lock')}Lv ${a.level}`;
  return `${ui('play')}${SKILLS[skill].type === 'voyage' ? 'Set sail' : SKILLS[skill].type === 'craft' ? 'Craft' : 'Start'}`;
}
function actCard(skill, a) {
  const st = actState(skill, a), r = actRarity(a), outId = a.out ? Object.keys(a.out)[0] : null, it = outId ? ITEMS[outId] : null;
  const art = tile(null, null, { r, icon: actIc(skill, a), title: a.name, cls: 's' });
  if (st === 'locked') {
    return `<div class="acard" data-card="${skill}:${a.id}" data-state="locked">
      <div class="ac-head">${art}<div class="ac-name"><b>${esc(a.name)}</b><small>${ui('lock')}Requires level ${a.level}</small></div></div></div>`;
  }
  const f = farmRates(skill, a), ml = masteryLv(skill, a.id);
  const lines = [];
  if (a.in) lines.push(`<div class="ac-io"><small>Needs</small>${Object.entries(a.in).map(([k, n]) => tile(k, `<em data-have="${k}" data-n="${n}">${fmt(count(k))}</em>/${fmt(n)}`, { cls: 'xs ' + (count(k) < n ? 'short' : '') })).join('')}</div>`);
  if (a.loot) {
    lines.push(`<div class="ac-io"><small>Loot</small>${tile(null, `${fmt(a.loot.gold[0] * goldMult())}+`, { r: 3, icon: ui('gold'), cls: 'xs', title: 'Gold' })}${a.loot.table.map(([k]) => tile(k, null, { cls: 'xs' })).join('')}</div>`);
    lines.push(`<div class="ac-io"><small>Rare</small>${a.loot.rare.map(([k, c]) => tile(k, fmtRate(c * luckMult()), { cls: 'xs' })).join('')}</div>`);
  }
  if (it && it.type === 'equip') lines.push(`<div class="ac-note">${statInline(it.stats)}</div>`);
  if (it && it.type === 'food') lines.push(`<div class="ac-note"><span>${ui('hp')}Heals ${foodHeal(outId)} HP</span></div>`);
  return `<button class="acard" data-act="${skill}:${a.id}" data-card="${skill}:${a.id}" data-state="${st}">
    <div class="ac-head">${art}<div class="ac-name"><b>${esc(a.name)}</b><small>${a.loot ? 'Voyage' : typeLabel(outId)} · Lv ${a.level}</small></div><span class="ac-cta" data-cta2>${ctaLabel(skill, a, st)}</span></div>
    <div class="ac-stats"><span title="Time per action">${ui('time')}<b>${fmtTime(f.T)}</b></span><span title="XP per action">${ui('xp')}<b>${fmt(a.xp)}</b> xp</span><span title="XP per hour"><b>${fmt(f.xph)}</b> xp/h</span></div>
    ${lines.join('')}
    <div class="ac-foot">${it ? `<span class="ac-own">Owned <b data-count="${outId}">${fmt(count(outId))}</b></span>` : `<span class="ac-own">${fmt(f.per)} / hour</span>`}
      <span class="ac-m" title="Mastery: each level makes this action 0.3% faster and adds 0.2% chance to double">${ui('mastery')}<b data-mlv="${skill}:${a.id}">${ml}</b><span class="bar mini"><i data-mfill="${skill}:${a.id}"></i></span></span></div>
    <span class="ac-prog"><i data-cardfill></i></span>
  </button>`;
}
function rareTiles(skill) {
  const m = rareMult(skill), out = [];
  for (const [id, c] of (RARE_FINDS[skill] || []).concat(GLOBAL_RARE)) {
    if (id === 'GEM') {
      const tot = GEM_TABLE.reduce((a, g) => a + g[1], 0);
      GEM_TABLE.forEach(([g, w]) => out.push(tile(g, fmtRate(c * m * w / tot), { cls: S.found[g] ? '' : 'dim' })));
    } else out.push(tile(id, fmtRate(c * m), { cls: id !== 'FRUIT' && !S.found[id] ? 'dim' : '' }));
  }
  const pet = PETS.find((x) => x.skill === skill);
  if (pet) out.push(petTile(pet, { n: S.pets[pet.id] ? 'Owned' : `~${PET_HOURS}h`, reveal: false }));
  return out;
}

/* ------------------------------------------------------------- battle */
VIEWS.battle = () => {
  const C = S.combat;
  const foods = Object.keys(S.items).filter((k) => ITEMS[k].type === 'food');
  const style = (s, icn, l) => `<button class="${C.style === s ? 'on' : ''}" data-style="${s}">${ui(icn)}<span>${l}</span></button>`;
  const cskill = (k) => `<div class="cskill"><span class="cs-ic">${ic('skill', k)}</span><span class="cs-main"><span><b>${SKILLS[k].name}</b><em>Lv <span data-lv="${k}">${skillLv(k)}</span></em></span><span class="xpbar thin"><i data-xpbar="${k}"></i></span></span></div>`;
  let lastRealm = null, groups = '';
  ZONES.forEach((z, i) => {
    if (REALMS[z.realm].hidden && !zoneUnlocked(i)) return;
    if (z.realm !== lastRealm) {
      lastRealm = z.realm;
      groups += `<div class="chapter" style="--rc:${rc(z.realm)}"><span class="ch-ic">${ic('realm', z.realm)}</span><b>${REALMS[z.realm].name}</b></div>`;
    }
    groups += zoneRow(z, i);
  });
  const z = C.zone != null ? ZONES[C.zone] : null;
  return `
  ${ptitle('Battlefield', z ? z.name : 'Choose a stage', `<div class="cskills">${cskill('strength')}${cskill('defense')}${cskill('vitality')}</div>`)}
  <div class="battle-layout">
    <div class="battle-main">
      ${z ? `<section class="win farm-win">${farmPanel()}</section>` : ''}
      <section id="stage" class="arena ${C.zone != null ? 'fighting' : ''}">${stageHTML()}</section>
      <div class="battle-row">
        <section class="win controls">
          ${hdr('Tactics')}
          <div class="ctrl"><label>Train</label><div class="seg">${style('strength', 'atk', 'Strength')}${style('defense', 'def', 'Defense')}${style('balanced', 'star', 'Both')}</div></div>
          <div class="ctrl"><label>Auto-eat</label><div class="food-pick">${C.food && count(C.food) ? tile(C.food, null, { cls: 'xs' }) : `<span class="tile r0 xs"><span class="tile-art">${ui('food')}</span></span>`}
            <select data-food>${foods.length ? '' : '<option value="">No food — cook some first</option>'}${foods.map((f) => `<option value="${f}" ${C.food === f ? 'selected' : ''}>${ITEMS[f].name} ×${fmt(count(f))} (+${foodHeal(f)} HP)</option>`).join('')}</select></div></div>
          <div class="muted small">Eats below ${pct(autoEatThreshold())} HP. Vitality always gains XP.</div>
        </section>
        <section class="win log-win">${hdr('Battle log')}<div class="log" id="clog">${logHTML()}</div></section>
      </div>
      <section class="win syn-win" style="--rc:${rc('combat')}">${synergyHTML(SYNERGIES.filter((x) => x.to === 'combat'), ['strength', 'defense', 'vitality'].flatMap(synergiesFrom))}</section>
    </div>
    <section class="win stages">${hdr('Stages')}<div class="stage-list">${groups}</div></section>
  </div>`;
};
function zoneRow(z, i) {
  const C = S.combat;
  if (!zoneUnlocked(i)) {
    const prev = ZONES[i - 1], need = prev.boss ? 1 : 10, have = Math.min(need, C.kills[prev.id] || 0);
    return `<div class="zrow locked"><span class="z-ic">${ui('lock')}</span><span class="z-main"><b>${z.name}</b><small>${prev.boss ? `Defeat ${prev.enemies[0].name}` : `Defeat ${need} foes in ${prev.name}`} · ${have}/${need}</small></span></div>`;
  }
  const [dl, dc] = zoneDanger(i);
  return `<button class="zrow ${z.boss ? 'boss' : ''} ${C.zone === i ? 'on' : ''}" data-zone="${i}" style="--rc:${rc(z.realm)}">
    <span class="z-ic">${ic('enemy', z.enemies[z.enemies.length - 1].name)}</span>
    <span class="z-main"><b>${z.name}</b><small>${z.boss ? 'Boss · ' : ''}Rec. Lv ${z.rec} · ${z.enemies.map((e) => e.name).join(' · ')}</small></span>
    <span class="z-tail"><span class="danger ${dc}">${dl}</span><span class="z-k">${ui('skull')}<b data-kills="${z.id}">${fmt(C.kills[z.id] || 0)}</b></span></span></button>`;
}
function stageHTML() {
  const C = S.combat, e = curEnemy();
  const me = `<div class="fighter me">
    <div class="f-art" data-portrait="player">${ui('hero')}</div>
    <div class="f-body"><div class="f-name"><b>You</b><span class="f-stats"><span title="Max hit">${ui('atk')}${fmt(pMaxHit())}</span><span title="Defense">${ui('def')}${fmt(pDef())}</span><span title="Attack speed">${ui('spd')}${pSpeed().toFixed(1)}s</span>${pDodge() ? `<span title="Dodge">${ui('dodge')}${pct(pDodge())}</span>` : ''}</span></div>
      <div class="hpbar"><i data-php></i><span data-phptext></span></div><div class="atkbar"><i data-patk></i></div></div>
  </div>`;
  let right;
  if (C.zone == null) right = `<div class="f-empty">${ui('map')}<b>Choose a stage</b><small>Start with an <em>Easy</em> one in the list.</small></div>`;
  else if (!e) right = `<div class="f-empty searching">${ui('battle')}<b>Searching for a foe…</b></div>`;
  else {
    const boss = ZONES[C.zone].boss;
    right = `<div class="fighter enemy enter ${boss ? 'boss' : ''}">
      <div class="f-art" data-portrait="enemy">${ic('enemy', e.name)}</div>
      <div class="f-body"><div class="f-name"><b>${boss ? '<span class="boss-tag">Boss</span>' : ''}${e.name}</b><span class="f-stats"><span title="Max hit">${ui('atk')}${e.atk}</span><span title="Defense">${ui('def')}${e.def}</span><span title="Attack speed">${ui('spd')}${e.spd}s</span></span></div>
        <div class="hpbar enemy"><i data-ehp></i><span data-ehptext></span></div><div class="atkbar"><i data-eatk></i></div>
        <div class="drops">${e.drops.map(([id, ch]) => tile(id, fmtRate(ch < 0.2 ? ch * luckMult() : ch), { cls: 'xs ' + (id !== 'FRUIT' && !S.found[id] ? 'dim' : '') })).join('')}${tile(null, fmt(e.gold[0]) + '+', { r: 3, icon: ui('gold'), cls: 'xs', title: 'Gold' })}</div></div>
    </div>`;
  }
  return `${me}<div class="vs"><span>VS</span></div>${right}`;
}
function logHTML() { return S.combat.log.map((l) => `<div class="${l.c}">${esc(l.m)}</div>`).join('') || '<div class="sys">Nothing yet.</div>'; }

/* ------------------------------------------------------------- bank & gear */
const heroTabs = (tab) => `<nav class="seg big-seg">
  <button class="${tab !== 'collection' ? 'on' : ''}" data-nav="hero">${ui('hero')}<span>Bank & Gear</span></button>
  ${featureOpen('collection') ? `<button class="${tab === 'collection' ? 'on' : ''}" data-nav="hero:collection">${ui('collection')}<span>Collection</span><em>${Math.floor(collectionPct() * 100)}%</em></button>` : `<button class="locked" data-locked="collection" title="${esc(lockedNote('collection'))}">${ui('lock')}<span>Collection</span></button>`}</nav>`;
const BAG_TABS = [['all', 'equip', 'All'], ['res', 'gem', 'Materials'], ['gem', 'gem', 'Gems'], ['chest', 'chest', 'Treasure'], ['food', 'food', 'Food'], ['equip', 'weapon', 'Gear'], ['fruit', 'fruit', 'Fruit']];
VIEWS.hero = (tab) => {
  if (tab === 'collection') return collectionHTML();
  const ids = Object.keys(S.items).filter((k) => S.ui.bank === 'all' || ITEMS[k].type === S.ui.bank)
    .sort((a, b) => rarity(b) - rarity(a) || ITEMS[b].value - ITEMS[a].value);
  const worth = Object.keys(S.items).reduce((a, k) => a + ITEMS[k].value * S.items[k], 0);
  const slot = (s, label, icn) => {
    const id = S.equip[s];
    if (!id) return `<div class="eslot empty"><span class="tile r0"><span class="tile-art">${ui(icn)}</span></span><span class="es-t"><small>${label}</small><b class="muted">Empty</b></span></div>`;
    return `<div class="eslot">${tile(id, null, { tag: 'button', attrs: `data-sel="${id}"` })}<span class="es-t"><small>${label}</small><b>${ITEMS[id].name}</b><span class="es-st">${statInline(ITEMS[id].stats)}</span></span><button class="mini-btn" data-unequip="${s}" title="Unequip">${ui('close')}</button></div>`;
  };
  return `
  ${ptitle('Hero', 'Bank & Gear', heroTabs(tab))}
  <div class="hero-layout">
    <section class="win equip-win">
      ${hdr('Equipment')}
      <div class="eslots">${slot('weapon', 'Weapon', 'weapon')}${slot('armor', 'Armor', 'armor')}${slot('accessory', 'Accessory', 'accessory')}
        ${S.fruit ? `<div class="eslot fruit">${tile(S.fruit, null)}<span class="es-t"><small>Abyss Fruit</small><b>${ITEMS[S.fruit].name}</b></span></div>` : ''}</div>
      ${hdr('Attributes')}
      ${attrList([['atk', 'Max hit', fmt(pMaxHit())], ['def', 'Defense', fmt(pDef())], ['hp', 'Max HP', fmt(pMaxHp())], ['spd', 'Attack speed', pSpeed().toFixed(1) + 's'], ['gold', 'Gold bonus', '×' + goldMult().toFixed(2)], ['xp', 'XP bonus', '×' + xpMult().toFixed(2)]])}
    </section>
    <section class="win bag-win">
      <nav class="bag-tabs">${BAG_TABS.map(([k, icn, l]) => `<button class="${S.ui.bank === k ? 'on' : ''}" data-bankf="${k}" title="${l}">${ui(icn)}<span>${l}</span></button>`).join('')}</nav>
      <div class="bag-grid">${ids.length ? ids.map((k) => tile(k, `<span data-count="${k}">${fmt(S.items[k])}</span>`, { tag: 'button', cls: selItem === k ? 'on' : '', attrs: `data-sel="${k}"`, corner: seenItems.has(k) ? '' : '<span class="new">New</span>' })).join('') : '<div class="empty-note">Nothing here yet.</div>'}</div>
      <div class="bag-foot"><span>${Object.keys(S.items).length} item types</span><span>Bank value ${ui('gold')} ${fmt(worth)}</span></div>
    </section>
    <section class="win detail">${inspectorHTML()}</section>
  </div>`;
};
function itemHead(id, unknown) {
  const it = ITEMS[id], r = unknown ? 0 : rarity(id);
  return `<div class="dt-hero r${r}"><div class="dt-name"><small>${unknown ? 'Undiscovered' : typeLabel(id)}</small><h2>${unknown ? '???' : esc(it.name)}</h2>${unknown ? '' : stars(r)}</div>
    <div class="dt-art">${unknown ? '<b class="q">?</b>' : itemIc(id)}</div></div>`;
}
function inspectorHTML() {
  if (!selItem || (!count(selItem) && !Object.values(S.equip).includes(selItem))) return `<div class="empty-note big">${ui('info')}<span>Select an item to see its details.</span></div>`;
  const it = ITEMS[selItem], n = count(selItem), equipped = !n;
  const body = [], acts = [];
  if (it.type === 'equip') { body.push(attrList(statRows(it.stats))); if (!equipped) acts.push(gbtn('Equip', 'check', `data-equip="${selItem}"`)); }
  else if (it.type === 'food') { body.push(attrList([['hp', 'Heals in battle', foodHeal(selItem) + ' HP']])); body.push('<p class="muted">Also used as voyage supplies.</p>'); acts.push(gbtn('Use as battle food', 'eat', `data-setfood="${selItem}"`)); }
  else if (it.type === 'fruit') { body.push(`<p class="lore">${it.desc}</p><p class="muted">Only one fruit at a time — eating replaces the old one. Fruit eaters fish 40% slower.</p>`); acts.push(gbtn('Eat', 'fruit', `data-eat="${selItem}"`)); }
  else if (it.type === 'chest') {
    const tot = it.loot.reduce((a, l) => a + l[1], 0);
    body.push(`${hdr('Contents', `${fmt(it.gold[0])}–${fmt(it.gold[1])} gold + one of`)}<ul class="srcs">${it.loot.map(([id, w, q]) => `<li><span><i>${itemIc(id)}</i>${esc(fruitLabel(id))}${q[1] > 1 ? ` ×${q[0]}–${q[1]}` : ''}</span><b>${fmtRate(w / tot)}</b></li>`).join('')}</ul>`);
    acts.push(gbtn('Open 1', 'open', `data-open="${selItem}:1"`));
    if (n > 1) acts.push(gbtn(`Open all ×${fmt(Math.min(n, 1000))}`, 'open', `data-open="${selItem}:all"`));
  } else {
    const uses = [];
    for (const k in SKILLS) for (const a of SKILLS[k].actions) if (a.in && a.in[selItem]) uses.push([k, a]);
    if (uses.length) body.push(`${hdr('Used in')}<ul class="srcs">${uses.slice(0, 8).map(([k, a]) => `<li><span><i>${ic('skill', k)}</i>${esc(a.name)}</span><b>${SKILLS[k].name} ${a.level}</b></li>`).join('')}</ul>`);
  }
  body.push(`${hdr('Where to find')}${sourcesHTML(selItem)}`);
  return `${itemHead(selItem)}
    <div class="dt-stats">${stat('Owned', fmt(n), `data-count="${selItem}"`)}${stat('Value', fmt(it.value) + ' g')}${stat('Stack value', fmt(it.value * n) + ' g')}</div>
    ${equipped ? '' : `<div class="dt-cta">${acts.join('')}<div class="sell-row"><button class="gbtn dark sm" data-sell="${selItem}:1">Sell 1</button><button class="gbtn dark sm" data-sell="${selItem}:half">Sell half</button><button class="gbtn dark sm" data-sell="${selItem}:all">Sell all</button></div></div>`}
    <div class="dt-body">${body.join('')}</div>`;
}

/* ------------------------------------------------------------- collection log */
let selCol = null;
const COL_GROUPS = [['res', 'Materials'], ['gem', 'Gems'], ['chest', 'Treasure'], ['food', 'Food'], ['equip', 'Gear'], ['fruit', 'Abyss Fruits']];
function collectionHTML() {
  const pctAll = collectionPct();
  const groups = COL_GROUPS.map(([type, label]) => {
    const ids = Object.keys(ITEMS).filter((k) => ITEMS[k].type === type);
    const n = ids.filter((k) => S.found[k]).length;
    return `${hdr(label, `${n} / ${ids.length}`)}<div class="col-grid">${ids.map((id) => tile(id, null, { tag: 'button', unknown: !S.found[id], cls: selCol === id ? 'on' : '', attrs: `data-col="${id}"` })).join('')}</div>`;
  }).join('');
  const petsN = PETS.filter((pt) => S.pets[pt.id]).length;
  const pets = `${hdr('Pets', `${petsN} / ${PETS.length}`)}<div class="col-grid">${PETS.map((pt) => petTile(pt, { tag: 'button', cls: selCol === 'pet:' + pt.id ? 'on' : '', attrs: `data-col="pet:${pt.id}"` })).join('')}</div>`;
  let detail = `<div class="empty-note big">${ui('collection')}<span>Select a tile to see where it drops and how rare it is.</span></div>`;
  if (selCol && selCol.startsWith('pet:')) {
    const pt = PET_BY[selCol.slice(4)], got = S.pets[pt.id];
    detail = `<div class="dt-hero r${got ? 5 : 0}"><div class="dt-name"><small>Pet${got ? ' · in your party' : ''}</small><h2>${got ? pt.name : '???'}</h2>${got ? stars(5) : ''}</div><div class="dt-art">${got ? ic('pet', pt.id) : '<b class="q">?</b>'}</div></div>
      <div class="dt-body">${attrList([['star', 'Bonus', petBonus(pt)]])}${hdr('Where to find')}<ul class="srcs">${petSource(pt)}</ul></div>`;
  } else if (selCol && ITEMS[selCol]) {
    const it = ITEMS[selCol], got = S.found[selCol];
    detail = `${itemHead(selCol, !got)}<div class="dt-body">${got && it.type === 'equip' ? attrList(statRows(it.stats)) : ''}${hdr('Where to find')}${sourcesHTML(selCol)}</div>`;
  }
  const found = Object.keys(S.found).length + Object.keys(S.pets).length, all = Object.keys(ITEMS).length + PETS.length;
  return `
  ${ptitle('Hero', 'Collection', heroTabs('collection'))}
  <section class="win col-sum"><div class="cs-top"><b>${Math.floor(pctAll * 100)}%</b><span class="muted">${found} / ${all} discovered</span></div><span class="pbar gold"><i style="width:${pctAll * 100}%"></i></span></section>
  <div class="hero-layout col-layout">
    <section class="win col-win">${groups}${pets}</section>
    <section class="win detail col-detail">${detail}</section>
  </div>`;
}
function obtainedHTML(title, sub, tiles, rows) {
  return `<div class="ob-head"><small>${sub || ''}</small><h2>${esc(title)}</h2></div>
    ${rows && rows.length ? `<div class="ob-rows">${rows.join('')}</div>` : ''}
    ${tiles.length ? `<div class="ob-grid">${tiles.join('')}</div>` : ''}`;
}
function showLoot(title, res) {
  const tiles = Object.entries(res.items).sort((a, b) => rarity(b[0]) - rarity(a[0]) || ITEMS[b[0]].value * b[1] - ITEMS[a[0]].value * a[1])
    .map(([id, n]) => tile(id, '×' + fmt(n), { cls: 'pop-in' }));
  if (res.gold) tiles.unshift(tile(null, fmt(res.gold), { r: 3, icon: ui('gold'), title: 'Gold', cls: 'pop-in' }));
  openModal(obtainedHTML('Items obtained', title, tiles));
}
function openModal(html, btn, nofoot) {
  $('#modal').classList.toggle('nofoot', !!nofoot);
  $('#modal-body').innerHTML = html;
  $$('#modal-body .pop-in').forEach((el, i) => el.style.setProperty('--d', Math.min(i, 24) * 0.04 + 's'));
  $('#modal-close').innerHTML = `<i class="gbtn-ic">${ui('check')}</i><span>${btn || 'Continue'}</span>`;
  $('#modal').classList.add('show');
}

/* ------------------------------------------------------------- inner power */
const TRAIN_COLORS = { chakra: '#ff9a4d', reiatsu: '#a98bff', will: '#a9b4c6', swift: '#4fe0a0', fortune: '#f4c66a', wisdom: '#4cc3ff' };
VIEWS.power = () => {
  const E = S.energy, cap = energyCap(), g = karmaGain();
  const steps = ['1', '10', '100', '10%', '25%', 'max'];
  return `
  ${ptitle('Inner Power', 'Training')}
  <section class="win energy-win">
    <div class="en-top">
      <div class="en-num"><small>Free energy</small><b><span data-eidle>${fmt(energyIdle())}</span><em> / ${fmt(cap)}</em></b></div>
      <div class="en-ctl"><label>Per click</label><div class="seg">${steps.map((s) => `<button class="${E.step === s ? 'on' : ''}" data-step="${s}"><span>${s}</span></button>`).join('')}</div>
        ${gbtn('Release all', 'close', 'data-releaseall', 'dark sm')}</div>
    </div>
    <div class="pool-bar">${TRAININGS.map((t) => `<i style="width:${((E.alloc[t.id] || 0) / cap) * 100}%;background:${TRAIN_COLORS[t.id]}" title="${t.name}"></i>`).join('')}</div>
  </section>
  <div class="train-grid">${TRAININGS.map((t) => {
    const a = E.alloc[t.id] || 0, L = tl(t.id), rate = (a * energyPower()) / trainCost(t.id, L);
    return `<section class="win train ${a ? 'active' : ''}" style="--tc:${TRAIN_COLORS[t.id]}">
      <div class="tr-top"><span class="tr-ic">${ic('training', t.id)}</span><span class="tr-main"><b>${t.name}</b><small data-tbonus="${t.id}">+${fmt(L * t.per)}${t.unit}</small></span>
        <span class="tr-lv"><small>Lv</small><b data-tl="${t.id}">${fmt(L)}</b></span></div>
      <div class="xpbar thin"><i data-tbar="${t.id}"></i></div>
      <div class="tr-ctl"><button class="mini-btn" data-alloc="${t.id}:-1" title="Take energy back">${ui('minus')}</button>
        <span class="tr-alloc"><b>${fmt(a)}</b> energy · <em>${a ? (rate >= 1 ? fmt(rate) + ' lv/s' : fmtTime(1 / rate) + ' / lv') : 'idle'}</em></span>
        <button class="mini-btn hot" data-alloc="${t.id}:1" title="Add energy">${ui('plus')}</button></div>
    </section>`;
  }).join('')}</div>
  <div class="power-row">
    <section class="win">${hdr('Gold upgrades')}
      <div class="upg">${tile(null, null, { r: 4, icon: ui('energy') })}<span class="upg-t"><b>Bigger Vessel</b><small>+25 energy capacity · now ${fmt(cap)}</small></span>${gbtn(fmt(capCost()), 'gold', `data-buycap data-cost="${capCost()}"`, 'sm')}</div>
      <div class="upg">${tile(null, null, { r: 4, icon: ui('power') })}<span class="upg-t"><b>Purer Energy</b><small>+10% training speed · now ×${energyPower().toFixed(2)}</small></span>${gbtn(fmt(powCost()), 'gold', `data-buypow data-cost="${powCost()}"`, 'sm')}</div>
    </section>
    <section class="win rebirth">
      <div>${hdr('Rebirth')}<p class="muted">Reset Inner Power (trainings, capacity, power) to earn <b>Karma</b>. Skills, items, gear and gold are kept. Needs 200 training levels — you have <b>${fmt(totalTrain())}</b>.</p>
        ${gbtn('Be reborn', 'rebirth', `${g > 0 ? '' : 'disabled'} data-rebirth`)}</div>
      <div class="gain">${ui('karma')}<b>+${fmt(g)}</b><small>Karma</small></div>
    </section>
  </div>
  ${hdr('Karma perks', `${fmt(S.karma)} karma`)}
  <div class="shop">${PERKS.map((p) => {
    const L = pl(p.id), maxed = p.max && L >= p.max, c = perkCost(p.id);
    return `<section class="win ware">${tile(null, `Lv ${L}${p.max ? '/' + p.max : ''}`, { r: 4, icon: ic('perk', p.id) })}<span class="ware-t"><b>${p.name}</b><small>${p.desc}</small></span>
      ${gbtn(maxed ? 'Maxed' : fmt(c), maxed ? 'check' : 'karma', `${maxed || S.karma < c ? 'disabled' : ''} data-perk="${p.id}"`, 'sm')}</section>`;
  }).join('')}</div>`;
};

/* ------------------------------------------------------------- market */
VIEWS.market = () => `
  ${ptitle('Merchant', 'Market')}
  <div class="shop">${SHOP.map((it) => {
    const tier = S.shop[it.id] || 0, cost = shopCost(it), maxed = cost === undefined;
    const r = it.give ? 2 : it.cat === 'Charms' ? 5 : 4;
    return `<section class="win ware">${tile(it.give ? it.give[0] : null, it.give ? '×' + it.give[1] : (it.costs ? `${tier}/${it.costs.length}` : ''), { r, icon: ic('shop', it.id), title: it.name })}
      <span class="ware-t"><small>${it.cat}</small><b>${it.name}</b><small>${it.desc}</small>${it.costs ? `<span class="pips">${it.costs.map((_, i) => `<i class="${i < tier ? 'on' : ''}"></i>`).join('')}</span>` : ''}</span>
      ${gbtn(maxed ? 'Maxed' : fmt(cost), maxed ? 'check' : 'gold', `${maxed ? 'disabled' : `data-cost="${cost}"`} data-buy="${it.id}"`, 'sm')}</section>`;
  }).join('')}</div>`;

/* ------------------------------------------------------------- settings */
VIEWS.settings = () => `
  ${ptitle('System', 'Settings')}
  ${isStandalone() ? '' : `<section class="win install">${tile(null, null, { r: 4, icon: ui('play') })}
    <span class="upg-t"><b>Play it like an app</b><small>Install Tri-Realm on your phone or computer: full screen, its own icon, works offline.${installPrompt ? '' : ' iPhone / iPad: Share → Add to Home Screen. Android / desktop: browser menu → Install app.'}</small></span>
    ${installPrompt ? gbtn('Install', 'check', 'data-install') : ''}</section>`}
  <section class="win">${hdr('Help')}
    <div class="btn-row">${gbtn(S.ui.noTips ? 'Turn beginner tips on' : 'Turn beginner tips off', 'info', 'data-toggletips', 'dark')}${gbtn('Show welcome screen', 'hero', 'data-rewelcome', 'dark')}</div>
    <p class="muted small">Beginner tips point at the next thing to click for the first ${GUIDE.length} objectives.</p></section>
  <section class="win">${hdr('Save data', 'autosaves every 10 seconds')}
    <div class="btn-row">${gbtn('Save now', 'check', 'data-save', 'dark')}${gbtn('Export', 'log', 'data-export', 'dark')}${gbtn('Import', 'open', 'data-import', 'dark')}${gbtn('Hard reset', 'close', 'data-wipe', 'danger')}</div>
    <textarea id="savebox" rows="5" placeholder="Export puts your save here. To import, paste a save here and press Import."></textarea>
  </section>
  <section class="win">${hdr('Credits')}<p class="muted small">Icons by Lorc, Delapouite, Skoll, Caro Asercion, sbed, Cathelineau, DarkZaitzev, Faithtoken, Felbrigg, Guard13007, John Colburn, Lucas, PriorBlue and Zeromancer from <a href="https://game-icons.net" target="_blank" rel="noopener">game-icons.net</a>, licensed under <a href="https://creativecommons.org/licenses/by/3.0/" target="_blank" rel="noopener">CC BY 3.0</a>. Scenes are generated in-game.</p></section>`;

/* =============================================================== activity bar + objective */
function nowHTML() {
  const gs = goalState();
  const claim = gs && gs.done ? gbtn('Claim', 'check', 'data-claim', 'sm glow nb-claim') : '';
  if (S.action) {
    const skill = S.action.skill, s = SKILLS[skill], a = findAction(skill, S.action.id), f = farmRates(skill, a);
    return `<div class="nb" style="--rc:${rc(s.realm)}">
      <button class="nb-main" data-nav="${skillView(skill)}" title="Go to ${s.name}">${tile(null, null, { r: actRarity(a), icon: actIc(skill, a), cls: 'xs', title: a.name })}
        <span class="nb-txt"><small>${s.name} · Lv <em data-lv="${skill}">${skillLv(skill)}</em></small><b>${esc(a.name)}</b></span></button>
      <span class="nb-prog"><span class="pbar"><i data-nowfill></i></span>
        <span class="nb-stats">${a.out ? `<span><b>${fmt(f.itemsh)}</b>/h</span>` : ''}<span><b>${fmt(f.xph)}</b> xp/h</span><span>Lv up <b data-nextlv>—</b></span>${a.in ? `<span>Left <b data-canmake>${fmt(f.can)}</b></span>` : ''}</span></span>
      ${claim}<button class="mini-btn hot" data-stop title="Stop">${ui('stop')}</button></div>`;
  }
  if (S.combat.zone != null) {
    const c = combatRates();
    return `<div class="nb" style="--rc:${rc('combat')}">
      <button class="nb-main" data-nav="battle" title="Go to battle">${tile(null, null, { r: c.z.boss ? 5 : 3, icon: ic('zone', c.z.id), cls: 'xs', title: c.z.name })}
        <span class="nb-txt"><small>Fighting</small><b>${c.z.name}</b></span></button>
      <span class="nb-prog"><span class="pbar hp"><i data-nowhp></i></span>
        <span class="nb-stats"><span>HP <b data-hpnow></b></span><span><b>≈${fmt(c.kph)}</b> kills/h</span><span><b>≈${fmt(c.xph)}</b> xp/h</span></span></span>
      ${claim}<button class="mini-btn hot" data-stopcombat title="Retreat">${ui('stop')}</button></div>`;
  }
  return `<div class="nb idle">${ui('sleep')}<span class="nb-txt"><small>Idle</small><b>Nothing is farming</b></span>${claim || (gs ? gbtn('Next: ' + esc(gs.g.text), 'play', `data-nav="${gs.g.go}"`, 'sm') : '')}</div>`;
}
function goalHTML() {
  const st = goalState();
  if (!st) return `<div class="quest"><div class="q-title"><i class="q-dia"></i><b>All objectives complete</b></div><div class="q-text">You conquered the multiverse. Keep pushing your levels!</div></div>`;
  const { g, cur, done } = st;
  return `<div class="quest ${done ? 'done' : ''}">
    <div class="q-title"><i class="q-dia"></i><b>Objective</b><small>${S.goal + 1} / ${GOALS.length}</small></div>
    <button class="q-main" data-nav="${g.go}" title="Go to this objective"><span class="q-ic">${ic('goal', S.goal)}</span><span class="q-text">${g.text}</span></button>
    <div class="q-prog"><span class="xpbar thin gold"><i data-goalbar style="width:${(cur / g.n) * 100}%"></i></span><span data-goaltxt>${fmt(cur)} / ${fmt(g.n)}</span></div>
    <div class="q-foot"><span class="q-reward">${ui('gold')}<b>${fmt(g.reward)}</b></span>
      ${done ? gbtn('Claim', 'check', 'data-claim', 'sm glow') : gbtn('Go', 'play', `data-nav="${g.go}"`, 'dark sm')}</div></div>`;
}
let lastGoalDone = null;
function renderSide() {
  const nb = $('#nowbar');
  nb.innerHTML = nowHTML();
  nb.classList.toggle('active', !!(S.action || S.combat.zone != null));
  const st = goalState();
  lastGoalDone = st ? st.done : null;
  for (const q of $$('#navquest, .quest-win')) q.innerHTML = goalHTML();
}

/* =============================================================== obtained feed */
const feedRows = [];
function feedAdd(icon, name, n, cls, r) {
  const box = $('#feed');
  let f = feedRows.find((x) => x.name === name && x.cls === (cls || ''));
  if (f) {
    f.n += n;
    $('b', f.el).textContent = (f.n > 0 ? '+' : '') + fmt(f.n);
    retrigger(f.el, 'bump');
    clearTimeout(f.t);
  } else {
    const el = document.createElement('div');
    el.className = `ob-row r${r || 1} ${cls || ''}`;
    el.innerHTML = `<span class="ob-ic">${icon}</span><span class="ob-name">${esc(name)}</span><b>${n > 0 ? '+' : ''}${fmt(n)}</b>`;
    box.appendChild(el);
    f = { name, cls: cls || '', n, el };
    feedRows.push(f);
    while (feedRows.length > 5) { const o = feedRows.shift(); clearTimeout(o.t); o.el.remove(); }
  }
  f.t = setTimeout(() => { f.el.classList.add('out'); setTimeout(() => f.el.remove(), 400); const i = feedRows.indexOf(f); if (i >= 0) feedRows.splice(i, 1); }, 4200);
}
const feedItem = (id, n) => feedAdd(itemIc(id), ITEMS[id].name, n, '', rarity(id));
const feedGold = (n, label) => feedAdd(ui('gold'), label || 'Gold', n, 'g', 3);

/* =============================================================== FX */
let floatCount = 0;
function floatAt(el, html, cls, dx, dy) {
  if (!el || floatCount > 24) return;
  const r = el.getBoundingClientRect();
  if (!r.width || r.bottom < 0 || r.top > innerHeight) return;
  const f = document.createElement('div');
  f.className = 'float ' + (cls || '');
  f.innerHTML = html;
  f.style.left = r.left + r.width / 2 + (dx || 0) + (Math.random() * 30 - 15) + 'px';
  f.style.top = r.top + r.height * 0.35 + (dy || 0) + 'px';
  $('#fx').appendChild(f);
  floatCount++;
  setTimeout(() => { f.remove(); floatCount--; }, 1100);
}
function retrigger(el, cls) { if (!el) return; el.classList.remove(cls); void el.offsetWidth; el.classList.add(cls); }
let burstBusy = false;
const burstQueue = [];
function burst(title, sub, icon, color) {
  if (burstBusy) { if (burstQueue.length < 3) burstQueue.push([title, sub, icon, color]); return; }
  burstBusy = true;
  const b = document.createElement('div');
  b.className = 'burst';
  b.style.setProperty('--rc', color || 'var(--gold)');
  b.innerHTML = `<div class="burst-band"><div class="burst-ic">${icon || ''}</div><div class="burst-txt"><div class="burst-title">${esc(title)}</div><div class="burst-sub">${esc(sub)}</div></div></div>`;
  document.body.appendChild(b);
  setTimeout(() => { b.remove(); burstBusy = false; if (burstQueue.length) burst(...burstQueue.shift()); }, 2100);
}
function flash() { const f = document.createElement('div'); f.className = 'flash'; document.body.appendChild(f); setTimeout(() => f.remove(), 500); }
function inBattleView() { return S.ui.view === 'battle'; }

on('action', (d) => {
  const card = $(`[data-card="${d.skill}:${d.act.id}"]`);
  const anchor = card ? $('.tile', card) : $('#nowbar .tile');
  const fast = actionTime(d.skill, d.act) < 0.8;
  if (!fast) {
    let i = 0;
    for (const id in d.gains) floatAt(anchor, `+${fmt(d.gains[id])}${itemIc(id)}`, 'gain', 0, -i++ * 24);
    if (d.gold) floatAt(anchor, `+${fmt(d.gold)}${ui('gold')}`, 'gold', 40, 0);
    floatAt(anchor, `+${fmt(d.xp)} XP`, 'xp', 50, 24);
    if (d.double) floatAt(anchor, '×2', 'gold', -50, 0);
    retrigger(card, 'pop');
  }
  for (const id in d.gains) feedItem(id, d.gains[id]);
  if (d.gold) feedGold(d.gold);
});
on('levelup', (d) => {
  const s = SKILLS[d.skill];
  burst('Level up', `${s.name} · Lv ${d.level - 1} → ${d.level}`, ic('skill', d.skill), rc(s.realm));
  const unlocked = s.actions.find((a) => a.level === d.level);
  if (unlocked) toast(`New in ${s.name}: ${unlocked.name}`, 'good');
  if (MILESTONES.some((m) => m.lv === d.level) && s.realm !== 'combat') toast(`${s.name} milestone reached: ${MILESTONES.find((m) => m.lv === d.level).name}`, 'rare');
  dirty = true;
});
on('hit', (d) => {
  if (!inBattleView()) return;
  const el = $(`[data-portrait="${d.target}"]`);
  if (!el) return;
  if (d.dodge) { floatAt(el, 'Dodge', 'miss'); return; }
  if (d.target === 'enemy') floatAt(el, (d.crit ? '<small>Crit</small>' : '') + fmt(d.dmg), d.crit ? 'dmg crit' : 'dmg');
  else floatAt(el, '-' + fmt(d.dmg), 'hurt');
  retrigger(el.closest('.fighter'), 'shake');
});
on('eat', (d) => { if (inBattleView()) floatAt($('[data-portrait="player"]'), `+${fmt(d.heal)}${ui('hp')}`, 'heal', 0, -20); });
on('kill', (d) => {
  for (const id in d.loot) feedItem(id, d.loot[id]);
  feedGold(d.gold);
  if (inBattleView()) {
    const f = $('.fighter.enemy');
    if (f) { const s = document.createElement('div'); s.className = 'ko'; s.textContent = 'Defeated'; f.appendChild(s); floatAt($('[data-portrait="enemy"]', f), `+${fmt(d.gold)}${ui('gold')}`, 'gold', 0, 30); }
  }
  const unlocked = ZONES.filter((z, i) => zoneUnlocked(i)).length;
  if (unlocked > lastUnlocked) {
    lastUnlocked = unlocked;
    const z = ZONES[unlocked - 1];
    burst('New stage', z.name, ic('zone', z.id), rc(z.realm));
    dirty = true;
  }
  if (d.boss) burst('Boss defeated', d.enemy.name, ic('enemy', d.enemy.name), 'var(--gold)');
  sideDirty = true;
});
on('spawn', () => {
  if (!inBattleView()) return;
  const st = $('#stage');
  if (st) { st.innerHTML = stageHTML(); st.classList.add('fighting'); }
});
on('death', () => { flash(); dirty = true; });
const rareThisTick = new Set();
on('rare', (d) => {
  rareThisTick.add(d.id);
  setTimeout(() => rareThisTick.delete(d.id), 0);
  const it = ITEMS[d.id];
  toast(`Rare find: ${it.name} (${d.source})`, 'rare');
  if (rarity(d.id) >= 5) burst('Rare drop', it.name, itemIc(d.id), 'var(--gold)');
  sideDirty = true;
});
on('pet', (pet) => {
  burst('New companion', `${pet.name} · ${petBonus(pet)}`, ic('pet', pet.id), 'var(--gold)');
  toast(`${pet.name} joined you! ${petBonus(pet)}.`, 'rare');
});
on('newitem', (id) => {
  if (!featureOpen('collection')) return;   // beginners: the Collection menu is not unlocked yet
  setTimeout(() => { if (!rareThisTick.has(id)) toast(`New in your Collection: ${ITEMS[id].name}`, 'good'); }, 0);
});
on('goal', (g) => { burst('Objective complete', `${g.text} · +${fmt(g.reward)} gold`, ic('goal', GOALS.indexOf(g)), 'var(--gold)'); });

/* =============================================================== unlock announcements */
// New worlds get a full reveal; skills and menus get a banner. Waits for any open modal to close.
const pendingUnlocks = [];
let lastUnlockPoll = 0;
function pollUnlocks() {
  const now = performance.now();
  if (now - lastUnlockPoll > 250) { lastUnlockPoll = now; pendingUnlocks.push(...checkUnlocks()); }
  if (!pendingUnlocks.length || $('#modal').classList.contains('show')) return;
  const list = pendingUnlocks.splice(0);
  const realms = list.filter((u) => u.id.startsWith('realm:')).map((u) => u.id.slice(6));
  for (const u of list) {
    const [kind, ref] = u.id.split(':');
    if (kind === 'realm' || (kind === 'skill' && realms.includes(SKILLS[ref].realm))) continue;
    burst(unlockKind(u), u.name, unlockIcon(u), kind === 'skill' ? rc(SKILLS[ref].realm) : 'var(--gold)');
    toast(`${unlockKind(u)} unlocked: ${u.name}`, 'rare');
  }
  if (realms.length) showRealmOpen(realms[0]);
  for (const r of realms.slice(1)) toast(`New world unlocked: ${REALMS[r].name}`, 'rare');
}
function showRealmOpen(r) {
  const R = REALMS[r], ks = r === 'rift' ? [] : openSkillsOf(r);
  const links = SYNERGIES.filter((s) => (ks.includes(s.from) && synTargetOpen(s)) || (ks.includes(s.to) && skillOpen(s.from)));
  const go = ks.length ? `realm:${r}:${ks[0]}` : 'battle';
  openModal(`<div class="welcome realm-open" style="--rc:${rc(r)}">
    <div class="wl-ic">${ic('realm', r)}</div>
    <small>A new world opens</small>
    <h2>${R.name}</h2>
    <p>${R.tagline}</p>
    ${ks.length ? `<ul class="wl-points">${ks.map((k) => `<li><i>${ic('skill', k)}</i><span><b>${SKILLS[k].name}.</b> ${SKILLS[k].desc}</span></li>`).join('')}</ul>` : '<p class="muted">A final stage waits at the end of the Battlefield.</p>'}
    ${links.length ? `<div class="ro-syn"><small>New synergies</small>${links.map((s) => `<span>${ic('skill', s.from)}<b>${s.name}</b><em>${SKILLS[s.from].name} → ${synTargetName(s)}</em></span>`).join('')}</div>` : ''}
    <div class="wl-cta">${gbtn(ks.length ? 'Go to ' + SKILLS[ks[0]].name : 'To the Battlefield', 'play', `data-realmgo="${go}"`)}${gbtn('Later', '', 'data-closemodal', 'dark')}</div>
  </div>`, null, true);
}

/* =============================================================== render + update */
let lastUnlocked = 0, sideDirty = false, bankSig = '', lastLogVer = -1, lastFoodSig = '';
function render() {
  dirty = false; sideDirty = false;
  normalizeView();
  renderRail();
  document.body.style.setProperty('--rc', viewAccent());
  const [name, a1, a2] = S.ui.view.split(':');
  const main = $('#main');
  const scroll = main.scrollTop;
  const box = $('#savebox'), boxVal = box ? box.value : null;
  main.classList.toggle('static', !viewChanged);
  main.dataset.view = name;
  main.innerHTML = VIEWS[name](a1, a2);
  main.scrollTop = scroll;
  if (boxVal !== null && $('#savebox')) $('#savebox').value = boxVal;
  if (name === 'hero') { bankSig = Object.keys(S.items).join(','); setTimeout(() => Object.keys(S.items).forEach((k) => seenItems.add(k)), 0); }
  viewChanged = false;
  lastLogVer = -1;
  renderSide();
  update();
  updateCoach(true);
}

let lastGold = 0;
function setText(el, v) { if (el && el.textContent !== v) el.textContent = v; }
function update() {
  // currencies
  const goldEl = $('#r-gold');
  setText(goldEl, fmt(S.gold));
  if (Math.floor(S.gold) !== lastGold) { if (S.gold > lastGold) retrigger(goldEl.parentElement, 'bump'); lastGold = Math.floor(S.gold); }
  setText($('#r-bounty'), fmt(S.bounty));
  setText($('#r-karma'), fmt(S.karma));
  $('#r-bounty').parentElement.hidden = !(S.bounty > 0);
  $('#r-karma').parentElement.hidden = !(S.karma > 0 || S.rebirths > 0);

  // levels / xp
  for (const el of $$('[data-lv]')) setText(el, String(skillLv(el.dataset.lv)));
  for (const el of $$('[data-xpbar]')) el.style.width = xpInfo(el.dataset.xpbar).p * 100 + '%';
  for (const el of $$('[data-xptext]')) { const h = xpText(xpInfo(el.dataset.xptext)); if (el.innerHTML !== h) el.innerHTML = h; }
  for (const el of $$('[data-count]')) setText(el, fmt(count(el.dataset.count)));
  for (const el of $$('[data-have]')) {
    setText(el, fmt(count(el.dataset.have)));
    const t = el.closest('.tile'); if (t) t.classList.toggle('short', count(el.dataset.have) < +el.dataset.n);
  }

  // action cards
  for (const card of $$('[data-card]')) {
    const [s, id] = card.dataset.card.split(':');
    const a = findAction(s, id), st = actState(s, a);
    if (card.dataset.state !== st) {
      if (card.dataset.state === 'locked' || st === 'locked') { dirty = true; continue; }
      card.dataset.state = st;
      const c = $('[data-cta2]', card); if (c) c.innerHTML = ctaLabel(s, a, st);
    }
    const fill = $('[data-cardfill]', card);
    if (fill) fill.style.width = st === 'active' ? Math.min(100, (S.action.prog / actionTime(s, a)) * 100) + '%' : '0%';
  }
  for (const el of $$('[data-mlv]')) { const [s2, id] = el.dataset.mlv.split(':'); setText(el, String(masteryLv(s2, id))); }
  for (const el of $$('[data-mfill]')) { const [s2, id] = el.dataset.mfill.split(':'); el.style.width = masteryProg(s2, id).p * 100 + '%'; }

  // activity bar + farm panel
  if (S.action) {
    const a = findAction(S.action.skill, S.action.id), T = actionTime(S.action.skill, a), b = xpInfo(S.action.skill);
    for (const el of $$('[data-nowfill]')) el.style.width = Math.min(100, (S.action.prog / T) * 100) + '%';
    for (const el of $$('[data-nowtime]')) setText(el, `${Math.max(0, T - S.action.prog).toFixed(1)}s`);
    const nl = b.need ? fmtTime((b.need / (a.xp * skillXpMult(S.action.skill))) * T) : 'MAX';
    for (const el of $$('[data-nextlv]')) setText(el, nl);
    if (a.in) {
      const can = Math.min(...Object.entries(a.in).map(([k, n]) => Math.floor(count(k) / n)));
      for (const el of $$('[data-canmake]')) setText(el, fmt(can));
      for (const el of $$('[data-runout]')) setText(el, fmtTime(can * T));
    }
  }
  if (S.combat.zone != null) {
    const m = pMaxHp();
    for (const el of $$('[data-nowhp]')) { el.style.width = (S.combat.hp / m) * 100 + '%'; el.parentElement.classList.toggle('low', S.combat.hp / m < 0.3); }
    for (const el of $$('[data-hpnow]')) setText(el, `${fmt(S.combat.hp)} / ${fmt(m)}`);
  }

  // goal
  const st = goalState();
  if (st) {
    for (const bar of $$('[data-goalbar]')) bar.style.width = (st.cur / st.g.n) * 100 + '%';
    for (const t of $$('[data-goaltxt]')) setText(t, `${fmt(st.cur)} / ${fmt(st.g.n)}`);
    if (st.done !== lastGoalDone) { renderSide(); if (st.done) toast(`Objective complete: ${st.g.text}. Claim your reward!`, 'rare'); }
  }

  // battle
  const C = S.combat;
  const php = $('[data-php]');
  if (php) {
    const m = pMaxHp();
    php.style.width = (C.hp / m) * 100 + '%';
    php.parentElement.classList.toggle('low', C.hp / m < 0.3);
    setText($('[data-phptext]'), `${fmt(C.hp)} / ${fmt(m)}`);
    const e = curEnemy();
    $('[data-patk]').style.width = C.zone != null && e ? Math.max(0, 100 - (C.pT / pSpeed()) * 100) + '%' : '0%';
    const eh = $('[data-ehp]');
    if (e && eh) {
      eh.style.width = Math.max(0, C.eHp / e.hp) * 100 + '%';
      setText($('[data-ehptext]'), `${fmt(Math.max(0, C.eHp))} / ${fmt(e.hp)}`);
      $('[data-eatk]').style.width = Math.max(0, 100 - (C.eT / e.spd) * 100) + '%';
    }
    if (lastLogVer !== logVer) { const l = $('#clog'); if (l) l.innerHTML = logHTML(); lastLogVer = logVer; }
    for (const el of $$('[data-kills]')) setText(el, fmt(C.kills[el.dataset.kills] || 0));
    const foodSig = Object.keys(S.items).filter((k) => ITEMS[k].type === 'food').join();
    if (foodSig !== lastFoodSig) { if (lastFoodSig) dirty = true; lastFoodSig = foodSig; }
  }

  // power
  for (const el of $$('[data-tbar]')) {
    const id = el.dataset.tbar;
    el.style.width = Math.min(100, ((S.energy.prog[id] || 0) / trainCost(id, tl(id))) * 100) + '%';
    setText($(`[data-tl="${id}"]`), fmt(tl(id)));
    setText($(`[data-tbonus="${id}"]`), '+' + fmt(tl(id) * TRAIN_BY[id].per) + TRAIN_BY[id].unit);
  }
  setText($('[data-eidle]'), fmt(energyIdle()));

  // bank: new item types appeared
  if (S.ui.view === 'hero' && Object.keys(S.items).join(',') !== bankSig) dirty = true;

  // gold-priced buttons
  for (const el of $$('[data-cost]')) el.disabled = S.gold < +el.dataset.cost;

  updateCoach();
}

/* =============================================================== input */
document.addEventListener('click', (ev) => {
  const t = ev.target.closest('button, [data-nav]');
  if (!t) { if (ev.target.id === 'scrim') document.body.classList.remove('menu-open'); return; }
  if (t.disabled) return;
  const d = t.dataset;
  if ('menu' in d) { document.body.classList.toggle('menu-open'); updateCoach(true); }
  else if (d.locked) { retrigger(t, 'shake'); toast(lockedNote(d.locked), 'bad'); }
  else if (d.welcome) welcomeChoice(d.welcome === 'go');
  else if ('coachok' in d) { coachOk[S.goal] = 1; updateCoach(true); }
  else if ('skiptips' in d) { S.ui.noTips = 1; clearCoach(); toast('Tips turned off. Turn them back on anytime in Settings.', 'good'); dirty = true; }
  else if ('toggletips' in d) { S.ui.noTips = S.ui.noTips ? 0 : 1; coachOk = {}; if (S.ui.noTips) clearCoach(); dirty = true; }
  else if ('rewelcome' in d) showWelcome();
  else if (d.nav) setView(d.nav);
  else if (d.act) {
    const [s, id] = d.act.split(':');
    const st = actState(s, findAction(s, id));
    if (st === 'locked' || st === 'missing') { retrigger(t, 'shake'); if (st === 'missing') toast('Missing materials — gather them first.', 'bad'); return; }
    startAction(s, id);
  }
  else if ('stop' in d) stopAction();
  else if (d.zone !== undefined) startCombat(+d.zone);
  else if ('stopcombat' in d) stopCombat();
  else if (d.style) { S.combat.style = d.style; dirty = true; }
  else if (d.sel) { selItem = d.sel; dirty = true; }
  else if (d.bankf) { S.ui.bank = d.bankf; dirty = true; }
  else if (d.equip) { equip(d.equip); toast(`Equipped ${ITEMS[d.equip].name}`, 'good'); }
  else if (d.unequip) unequip(d.unequip);
  else if (d.eat) { if (!S.fruit || confirm(`Replace your ${ITEMS[S.fruit].name}? Its power will be lost.`)) { eatFruit(d.eat); burst('Power awakened', ITEMS[d.eat].desc, itemIc(d.eat), 'var(--gold)'); } }
  else if (d.setfood) { S.combat.food = d.setfood; toast(`${ITEMS[d.setfood].name} will be eaten in battle.`, 'good'); dirty = true; }
  else if (d.sell) {
    const [id, q] = d.sell.split(':');
    const n = q === 'all' ? count(id) : q === 'half' ? Math.ceil(count(id) / 2) : 1;
    const g = ITEMS[id].value * Math.min(n, count(id));
    sell(id, n);
    feedGold(g, 'Sold ' + ITEMS[id].name);
  }
  else if (d.buy) buyShop(d.buy);
  else if (d.alloc) { const [id, dir] = d.alloc.split(':'); allocate(id, +dir); }
  else if (d.step) { S.energy.step = d.step; dirty = true; }
  else if ('releaseall' in d) releaseAll();
  else if ('buycap' in d) buyCap();
  else if ('buypow' in d) buyPow();
  else if ('rebirth' in d) { if (confirm('Rebirth? All Inner Power training will reset.')) { const g = karmaGain(); if (rebirth()) burst('Reborn', `+${fmt(g)} Karma`, ui('rebirth'), 'var(--soul)'); } }
  else if (d.perk) buyPerk(d.perk);
  else if ('claim' in d) { claimGoal(); lastUnlockPoll = 0; pollUnlocks(); }
  else if (d.realmgo) { $('#modal').classList.remove('show', 'nofoot'); setView(d.realmgo); }
  else if ('closemodal' in d) { $('#modal').classList.remove('show', 'nofoot'); updateCoach(true); }
  else if (d.open) {
    const [id, q] = d.open.split(':');
    const res = openChest(id, q === 'all' ? count(id) : 1);
    if (res) {
      showLoot(`Opened ${res.n} × ${ITEMS[id].name}`, res);
      if (!count(id)) selItem = null;
    }
  }
  else if (d.col) { selCol = d.col; dirty = true; }
  else if ('install' in d && installPrompt) { installPrompt.prompt(); installPrompt.userChoice.finally(() => { installPrompt = null; dirty = true; }); }
  else if ('save' in d) { saveGame(); toast('Game saved.', 'good'); }
  else if ('export' in d) { const b = $('#savebox'); b.value = btoa(unescape(encodeURIComponent(serialize()))); b.select(); toast('Save exported — copy the text.', 'good'); }
  else if ('import' in d) {
    try { loadFrom(decodeURIComponent(escape(atob($('#savebox').value.trim())))); saveGame(); toast('Save imported!', 'good'); dirty = true; }
    catch (e) { toast('That save data is not valid.', 'bad'); }
  }
  else if ('wipe' in d) { if (confirm('Erase ALL progress? This cannot be undone.')) { S = defaultState(); checkUnlocks(); S.combat.hp = pMaxHp(); saveGame(); setView('home'); } }
});
document.addEventListener('change', (ev) => {
  if (ev.target.matches('[data-food]')) { S.combat.food = ev.target.value || null; ev.target.blur(); dirty = true; }
});
document.addEventListener('keydown', (ev) => { if (ev.key === 'Escape') { document.body.classList.remove('menu-open'); $('#modal').classList.remove('show'); } });

/* =============================================================== toasts */
const TOAST_IC = { good: 'check', bad: 'close', rare: 'rare' };
notify = (msg, cls) => {
  const box = $('#toasts');
  const el = document.createElement('div');
  el.className = 'toast ' + (cls || '');
  el.innerHTML = `<i>${ui(TOAST_IC[cls] || 'info')}</i><span></span>`;
  el.lastChild.textContent = msg;
  box.appendChild(el);
  while (box.children.length > 3) box.firstChild.remove();
  setTimeout(() => { el.classList.add('out'); setTimeout(() => el.remove(), 400); }, 3200);
};

/* =============================================================== boot / loop */
function saveGame() { try { localStorage.setItem(SAVE_KEY, serialize()); } catch (e) { /* storage unavailable */ } }

function showOffline(secs, before) {
  const after = snapshot();
  const rows = [], tiles = [];
  for (const k in after.levels) if (after.levels[k] > before.levels[k]) rows.push(`<div class="ob-line"><i>${ic('skill', k)}</i><span>${SKILLS[k].name}</span><b>Lv ${before.levels[k]} → ${after.levels[k]}</b></div>`);
  if (after.kills > before.kills) rows.push(`<div class="ob-line"><i>${ui('skull')}</i><span>Foes defeated</span><b>+${fmt(after.kills - before.kills)}</b></div>`);
  if (after.train > before.train) rows.push(`<div class="ob-line"><i>${ui('energy')}</i><span>Training levels</span><b>+${fmt(after.train - before.train)}</b></div>`);
  const dg = after.gold - before.gold;
  if (dg) tiles.push(tile(null, (dg > 0 ? '+' : '') + fmt(dg), { r: 3, icon: ui('gold'), title: 'Gold', cls: 'pop-in' }));
  const ids = [...new Set([...Object.keys(before.items), ...Object.keys(after.items)])].sort((a, b) => rarity(b) - rarity(a));
  for (const id of ids) {
    const d = (after.items[id] || 0) - (before.items[id] || 0);
    if (d) tiles.push(tile(id, (d > 0 ? '+' : '') + fmt(d), { cls: 'pop-in ' + (d < 0 ? 'neg' : '') }));
  }
  if (!rows.length && !tiles.length) rows.push('<div class="ob-line"><span>Nothing happened — you were idle. Start an activity before leaving!</span></div>');
  openModal(obtainedHTML('Welcome back', `While you were away · ${fmtTime(secs)}`, tiles, rows));
}

let lastTopKey = '';
function boot() {
  installSprite();
  let raw = null;
  try { raw = localStorage.getItem(SAVE_KEY); } catch (e) { /* ignore */ }
  if (raw) { try { loadFrom(raw); } catch (e) { S = defaultState(); } }
  else { S = defaultState(); checkUnlocks(); S.combat.hp = pMaxHp(); }
  normalizeView();
  renderHud();

  const away = (Date.now() - S.last) / 1000;
  if (away > 30) {
    const secs = offlineSeconds(away), before = snapshot();
    SIM = true; advance(secs); SIM = false;
    showOffline(secs, before);
  }
  S.last = Date.now();
  lastTick = Date.now();
  lastUnlocked = ZONES.filter((z, i) => zoneUnlocked(i)).length;
  lastGold = Math.floor(S.gold);
  Object.keys(S.items).forEach((k) => seenItems.add(k));
  render();
  if (isFreshSave()) showWelcome();

  function frame() {
    catchUp();
    pollUnlocks();
    const busy = document.activeElement && ['SELECT', 'TEXTAREA'].includes(document.activeElement.tagName);
    if (dirty && !busy) render();
    else {
      const key = (S.action ? S.action.skill + S.action.id : '') + '|' + S.combat.zone;
      if (key !== lastTopKey || sideDirty) { lastTopKey = key; sideDirty = false; renderSide(); renderRail(); }
      update();
    }
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
  // Background tabs: desktop browsers still run timers (throttled), so keep simulating.
  setInterval(() => { if (document.hidden) catchUp(); }, 1000);
  setInterval(saveGame, 10000);
  // Mobile browsers freeze or kill hidden pages and rarely fire beforeunload:
  // save the moment the page is hidden, and summarize the gap when it comes back.
  document.addEventListener('visibilitychange', () => {
    catchUp();
    if (document.hidden) { hiddenAt = Date.now(); hiddenSnap = snapshot(); saveGame(); }
    else if (hiddenSnap) {
      const away = (Date.now() - hiddenAt) / 1000;
      if (away > 60 && !$('#modal').classList.contains('show')) showOffline(offlineSeconds(away), hiddenSnap);
      hiddenSnap = null;
    }
  });
  window.addEventListener('pagehide', saveGame);
  window.addEventListener('beforeunload', saveGame);
  $('#modal-close').addEventListener('click', () => { $('#modal').classList.remove('show'); updateCoach(true); });
  addEventListener('resize', () => updateCoach(true));
  $('#main').addEventListener('scroll', () => updateCoach(true), { passive: true });
}

// Wall-clock simulation: works no matter how long frames, timers or the whole page were paused.
let lastTick = Date.now(), hiddenAt = 0, hiddenSnap = null;
function catchUp() {
  const now = Date.now(), dt = (now - lastTick) / 1000;
  lastTick = now;
  if (dt > 5) { SIM = true; advance(offlineSeconds(dt)); SIM = false; dirty = true; }
  else if (dt > 0) step(dt);
}

// "Install app" support (Android / desktop Chrome & Edge). iOS uses Share → Add to Home Screen.
let installPrompt = null;
const isStandalone = () => matchMedia('(display-mode: standalone)').matches || navigator.standalone === true;
window.addEventListener('beforeinstallprompt', (e) => { e.preventDefault(); installPrompt = e; dirty = true; });
window.addEventListener('appinstalled', () => { installPrompt = null; toast('Installed! Launch Tri-Realm from your home screen.', 'good'); dirty = true; });

boot();
