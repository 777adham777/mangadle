'use strict';
/* ==========================================================================
   ANIME IDLE RPG — UI layer
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
const openRealms = () => WORLD_ORDER.filter(realmOpen);   // in the order they open
// Skills you have opened only: a new player is not level 15 at one skill.
const totalLevel = () => Object.keys(SKILLS).filter((k) => SKILLS[k].realm === 'combat' ? featureOpen('battle') : skillOpen(k)).reduce((a, k) => a + skillLv(k), 0);

// UI accent per world
const RC = { shinobi: '#ff9a4d', soul: '#a98bff', seas: '#4cc3ff', combat: '#ff5d73', rift: '#ff5bd8', hub: '#f4c66a' };
const rc = (r) => RC[r] || (REALMS[r] && REALMS[r].ui) || RC.hub;

/* =============================================================== icons */
const hasIcons = () => typeof ICONS !== 'undefined' && typeof GI !== 'undefined';
function gi(name, cls, attrs) { return name ? `<svg class="gi${cls ? ' ' + cls : ''}"${attrs ? ' ' + attrs : ''} aria-hidden="true"><use href="#gi-${name}"/></svg>` : ''; }
function icName(kind, id) {
  if (!hasIcons()) return null;
  const t = ICONS[kind];
  const n = t ? t[id] : null;
  return n && GI[n] ? n : (ICONS.ui && GI[ICONS.ui.info] ? ICONS.ui.info : null);
}
// Technique icons carry data-ttip: hovering one anywhere shows the technique's tooltip (tooltips.js).
const ic = (kind, id, cls) => (kind === 'item' ? itemIc(id, cls) : kind === 'skill' && skillArt(id) ? skillArtIc(id, cls) : gi(icName(kind, kind === 'goal' && typeof id === 'number' && GOALS[id] ? GOALS[id].id : id), cls, kind === 'technique' ? `data-ttip="${id}"` : ''));
const ui = (k, cls) => ic('ui', k, cls);
// Painted skill icons (skill-icons.js): an <svg class="gi"> like the glyphs, so every place sizes them the same.
function skillArt(id) { return typeof SKILL_ICON_ART !== 'undefined' && SKILL_ICON_ART && SKILL_ICON_PATHS[id]; }
function skillArtIc(id, cls) {
  return `<svg class="gi sk-art${cls ? ' ' + cls : ''}" viewBox="0 0 64 64" aria-hidden="true"><image href="${skillArt(id)}" width="64" height="64"/></svg>`;
}
// Item art: the item's own glyph in its own colour (ICON_COLOR, icons.js); schematics are drawn as blueprints.
function itemIc(id, cls) {
  if (id === 'FRUIT') return ui('fruit', cls);
  if (id === 'GEM') return ui('gem', cls);
  const bp = ITEMS[id] && ITEMS[id].type === 'schematic';
  // Illustrated art (item-art.js, js/art/*.js) first; the old one-colour glyph only as a fallback.
  const a = typeof artId === 'function' ? artId(id) : null;
  if (a) return `<svg class="gi ic ia${bp ? ' bp' : ''}${cls ? ' ' + cls : ''}" data-tip="${id}" aria-hidden="true"><use href="#ia-${a}"/></svg>`;
  const n = icName('item', id);
  if (!n) return '';
  const c = typeof itemColor === 'function' ? itemColor(id) : null;
  return `<svg class="gi ic${bp ? ' bp' : ''}${cls ? ' ' + cls : ''}"${c ? ` style="--ic:${c}"` : ''} data-tip="${id}" aria-hidden="true"><use href="#gi-${n}"/></svg>`;
}
// Actions without an item output (beast hunts, echo rituals...) carry their own icon: a.icon = [kind, id].
const actIc = (skill, a, cls) => (a.loot ? ic('voyage', a.id, cls) : a.icon ? ic(a.icon[0], a.icon[1], cls) : a.out ? itemIc(Object.keys(a.out)[0], cls) : ic('skill', skill, cls));
// Family badge + tier tag drawn over an item tile (see ICON_MARK in icons.js).
function itemMark(id) {
  const m = typeof ICON_MARK !== 'undefined' && ICON_MARK[id];
  if (!m) return '';
  return (m.b && GI[m.b] ? `<span class="tile-badge">${gi(m.b)}</span>` : '') + (m.t ? `<span class="tile-tag">${m.t}</span>` : '');
}
const actMark = (a) => (!a.loot && !a.icon && a.out ? itemMark(Object.keys(a.out)[0]) : '');
function installSprite() {
  if (!hasIcons() || $('#gi-sprite')) return;
  const syms = Object.entries(GI).map(([n, d]) => `<symbol id="gi-${n}" viewBox="0 0 512 512"><path d="${d}"/></symbol>`).join('');
  // Item-art shading: a light-to-tinted fill per rarity (tiles reference these from CSS).
  const TINT = ['#c9cfdc', '#e4e7ee', '#d3f5e1', '#d6e6ff', '#eadcff', '#fff0cf'];
  const grads = TINT.map((c, r) => `<linearGradient id="gi-g${r}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff"/><stop offset=".55" stop-color="#fff"/><stop offset="1" stop-color="${c}"/></linearGradient>`).join('');
  const art = typeof artSymbols === 'function' ? artSymbols() : '';
  const adefs = typeof artDefs === 'function' ? artDefs() : '';
  document.body.insertAdjacentHTML('afterbegin', `<svg id="gi-sprite" width="0" height="0" style="position:absolute" aria-hidden="true"><defs>${grads}${adefs}</defs>${syms}${art}</svg>`);
}

/* =============================================================== rarity + tiles */
function rarity(id) {
  if (id === 'FRUIT') return 5;
  if (id === 'GEM') return 3;
  const it = ITEMS[id];
  if (!it) return 1;
  if (it.rarity) return it.rarity;   // set in loot.js from how hard the item is to get
  if (it.type === 'fruit' || id === 'rift_shard') return 5;
  if (it.type === 'schematic') return 4;
  if (it.type === 'gem') return it.value >= 180 ? 4 : 3;
  const v = it.value;
  return v >= 2000 ? 5 : v >= 300 ? 4 : v >= 60 ? 3 : v >= 12 ? 2 : 1;
}
const rarityVoy = (a) => (a.level < 25 ? 3 : a.level < 55 ? 4 : 5);
const actRarity = (a) => (a.loot ? rarityVoy(a) : a.out ? rarity(Object.keys(a.out)[0]) : a.level < 30 ? 3 : a.level < 60 ? 4 : 5);
const TYPE_LABEL = { trade: 'Trade good', res: 'Material', food: 'Food', gem: 'Gem', chest: 'Treasure', fruit: 'Abyss Fruit', schematic: 'Schematic' };
const typeLabel = (id) => { const it = ITEMS[id]; if (it.relic) return `Relic · ${REALMS[it.relic].name}`; if (it.type === 'equip' && SCHEM_OF[id]) return 'Iconic ' + it.slot; return it.type === 'equip' ? it.slot[0].toUpperCase() + it.slot.slice(1) : TYPE_LABEL[it.type] || 'Item'; };
const fruitLabel = (id) => (id === 'FRUIT' ? 'Random Abyss Fruit' : id === 'GEM' ? 'Random gem' : ITEMS[id].name);
function stars(r) { return `<span class="stars">${'<i></i>'.repeat(r)}</span>`; }

// Item families, readable at a glance: every item tile carries its family's coloured corner (.tile-kind),
// the inspector names it in the same colour, and the bank filters by family. Keys reuse type ids
// ('equip', 'food'...) so saved bank filters and guide steps keep working.
const KINDS = {
  res:    { name: 'Materials',   one: 'Material' },
  food:   { name: 'Consumables', one: 'Consumable' },
  equip:  { name: 'Gear',        one: 'Gear' },
  tool:   { name: 'Tools',       one: 'Tool' },
  scroll: { name: 'Scrolls',     one: 'Scroll' },
  chest:  { name: 'Treasure',    one: 'Treasure' },
};
const KIND_OF = { res: 'res', gem: 'res', spice: 'res', seed: 'res', equip: 'equip', food: 'food', meal: 'food', bait: 'food', fruit: 'food',
  chest: 'chest', wish: 'chest', artifact: 'chest', scroll: 'scroll', schematic: 'scroll', tool: 'tool', trap: 'tool' };
const itemKind = (id) => (ITEMS[id] ? KIND_OF[ITEMS[id].type] || 'res' : null);
const kindCorner = (k) => (k ? `<span class="tile-kind k-${k}" aria-hidden="true">${ui('k-' + k)}</span>` : '');

// Has the player met this item yet? (a Devil Fruit roll counts any fruit; schematics count once learned)
const isFound = (id) => (id === 'FRUIT' ? FRUITS.some((f) => S.found[f]) : id === 'GEM' ? GEM_TABLE.some(([g]) => S.found[g])
  : !!(S.found[id] || (ITEMS[id] && ITEMS[id].type === 'schematic' && S.known[id])));
// Silhouette art: the icon stripped of every tooltip hook, drawn black under a "?".
const silArt = (icon) => (icon || '').replace(/\sdata-t?tip="[^"]*"/g, '').replace(/\stitle="[^"]*"/g, '') + '<b class="q">?</b>';
// A recipe / action you cannot do yet whose product you never had: a silhouette named "???".
const actHid = (skill, a) => { const o = a.out && Object.keys(a.out)[0]; return !!(o && ITEMS[o] && ((a.schem && !S.known[a.schem]) || skillLv(skill) < a.level) && !isFound(o)); };
const actNm = (skill, a) => (actHid(skill, a) ? '???' : a.name);
function actTile(skill, a, o) {
  if (actHid(skill, a)) return tile(null, null, Object.assign({}, o, { r: actRarity(a), icon: actIc(skill, a), unknown: true, title: `Undiscovered · ${SKILLS[skill].name} ${a.level}` }));
  return tile(null, null, Object.assign({ r: actRarity(a), icon: actIc(skill, a), mark: actMark(a), title: a.name }, o));
}
// An ingredient: its own art and name once found, else a silhouette and "???".
const matIc = (k) => (isFound(k) ? itemIc(k) : `<span class="silw">${silArt(itemIc(k))}</span>`);
const matNm = (k) => (isFound(k) ? ITEMS[k].name : '???');
// An item tile: art area tinted by rarity + family corner + a light count strip.
function tile(id, n, o) {
  o = o || {};
  // Undiscovered: a black silhouette of the art with a "?" over it, and nothing that names it (no tooltip).
  const r = o.unknown ? (o.r || 0) : (o.r || rarity(id));
  const tag = o.tag || 'span';
  const real = !o.unknown && !o.icon && id && ITEMS[id];
  const art = o.unknown ? silArt(o.icon || (id ? itemIc(id) : '')) : (o.icon || itemIc(id)) + (o.mark != null ? o.mark : !o.icon && id ? itemMark(id) : '')
    + (real ? kindCorner(itemKind(id)) : '');
  if (o.unknown) o = Object.assign({}, o, { cls: (o.cls || '') + ' sil unk' });
  // Real items get the rich tooltip (tooltips.js) instead of a plain title.
  const tip = real ? `data-tip="${id}"` : o.tip ? o.tip : `title="${esc(o.title || (o.unknown ? 'Undiscovered' : id ? fruitLabel(id) : ''))}"`;
  return `<${tag} class="tile r${r} ${o.cls || ''}" ${o.attrs || ''} ${tip}>`
    + `<span class="tile-art">${art}${o.corner || ''}</span>`
    + `${n == null || n === '' ? '' : `<span class="tile-n${String(n).replace(/<[^>]*>/g, '').length >= 6 ? ' tight' : ''}" ${o.nattrs || ''}>${n}</span>`}</${tag}>`;
}
function petTile(pt, o) {
  o = o || {};
  const got = S.pets[pt.id];
  return tile(null, o.n, Object.assign({ r: got || o.reveal ? 5 : 0, icon: ic('pet', pt.id), unknown: !got && !o.reveal, title: got || o.reveal ? pt.name : 'Undiscovered pet' }, o));
}

/* =============================================================== small UI kit */
function gbtn(label, icon, attrs, cls) {
  return `<button class="gbtn ${cls || ''}" ${attrs || ''}>${icon ? `<i class="gbtn-ic">${ui(icon)}</i>` : ''}<span>${label}</span></button>`;
}
const hdr = (t, extra) => `<h3 class="hdr"><span>${t}</span>${extra ? `<small>${extra}</small>` : ''}</h3>`;
// One screen (css/fit.css): a page in columns, each scrolling on its own; phones stack them.
// fitCols('cls', colA, colB...) ; widths through the cls (or --fc).
const fitCols = (cls, ...cols) => `<div class="fit fcols ${cls}">${cols.map((c) => `<div class="fcol">${c}</div>`).join('')}</div>`;
const ptitle = (small, big, right) => `<div class="ptitle"><div class="pt-txt"><small>${small}</small><h1>${big}</h1></div>${right || ''}</div>`;
const stat = (label, val, attrs) => `<div class="stat"><small>${label}</small><b ${attrs || ''}>${val}</b></div>`;

let selItem = null;
const seenItems = new Set();
let bankNew = null;   // the Bank's "New since your last visit" row, fixed for the whole visit
// What the Bank has shown you is saved (S.ui.bankSeen), so drops from offline time still say NEW.
const bankSeenSave = () => { S.ui.bankSeen = [...seenItems]; };

/* =============================================================== routing */
function normalizeView() {
  const legacy = { overview: 'home', combat: 'battle', bank: 'hero', shop: 'market', rebirth: 'power', 'hero:avatar': 'character', 'character:look': 'character' };
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
// The menu key of an unlock (for its NEW mark): a skill's page, or a menu's view.
function navKeyOf(uid) {
  const [kind, ref] = uid.split(':');
  if (kind === 'skill' && SKILLS[ref]) return skillView(ref);
  if (kind !== 'feature') return null;
  const k = Object.keys(VIEW_FEATURE).find((v) => VIEW_FEATURE[v] === ref);
  return k || (VIEWS[ref] ? ref : null);
}
function setView(v) {
  S.ui.view = v;
  normalizeView();
  if (S.ui.fresh && S.ui.fresh[S.ui.view]) { delete S.ui.fresh[S.ui.view]; sideDirty = true; }
  const [name, realm, skill] = S.ui.view.split(':');
  if (name === 'realm') S.ui.tab[realm] = skill;
  $('#main').scrollTop = 0;
  document.body.classList.remove('menu-open');
  // damage numbers of the page you leave do not float over the next one
  for (const f of $$('#fx > .float')) f.remove();
  viewChanged = true;
  dirty = true;
}
let viewChanged = true, navAnchor = null;
const skillView = (k) => (SKILLS[k].realm === 'combat' ? 'battle' : `realm:${SKILLS[k].realm}:${k}`);
function viewAccent() {
  const [name, realm] = S.ui.view.split(':');
  return name === 'realm' ? rc(realm) : name === 'battle' ? rc('combat') : rc('hub');
}

/* =============================================================== top bar + sidebar */
function renderHud() {
  $('#hud').innerHTML = `
    <button class="menu-btn" data-menu title="Menu">${ui('menu')}</button>
    <button class="brand" data-nav="home">ANIME<span>·</span>IDLE<span>·</span>RPG</button>
    <div id="nowbar" class="nowbar"></div>
    <div class="curs">
      <div class="cur gold" title="Gold — buys upgrades in the Market"><i>${ui('gold')}</i><b id="r-gold">0</b></div>
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
  return `<button class="nav-row ${on ? 'on' : ''} ${o.sub ? 'sub' : ''}" data-nav="${key}" style="--rc:${o.color || rc('hub')}" ${o.skill ? `data-rtip="skill:${o.skill}"` : ''}>
    <span class="nr-ic">${icon}</span><span class="nr-name">${label}${o.note ? `<small class="nr-sub">${esc(o.note)}</small>` : ''}</span>
    ${o.skill ? `<span class="nr-lv" data-lv="${o.skill}">${skillLv(o.skill)}</span><span class="nr-xp"><i data-xpbar="${o.skill}"></i></span>` : ''}
    ${o.busy ? '<i class="nr-busy"></i>' : ''}${S.ui.fresh && S.ui.fresh[key] ? '<em class="nr-new">New</em>' : o.skill && o.skill === guideSkill() && !o.busy && !on ? '<i class="nr-goal" title="Current objective">!</i>' : ''}</button>`;
}
// The quick menu: [view, icon, label]. Menus not open yet stay out of it (the Next block names the coming one).
const quickMenu = () => [['home', 'home', 'Overview'], ['character', 'character', 'Character'], ['hero', 'bank', 'Bank'], ['hero:collection', 'collection', 'Collection'], ['market', 'market', 'Market'], ['power', 'power', 'Energy'], ...UIX.quick.flatMap((f) => f()), ['settings', 'settings', 'Settings']]
  .filter(([k]) => { const f = featureOfView(k); return !f || featureOpen(f); });
// The label a view has in the menu (unlock notices name it exactly), or null when it has no menu entry.
const menuLabel = (key) => (key === 'battle' ? 'Combat' : (quickMenu().find(([k]) => k === key) || [])[2] || null);
// A menu badge: a count in a corner, never wider than "99+".
const navBadge = (n, tip) => (n > 0 ? `<em class="nq-badge" title="${tip}">${n > 99 ? '99+' : n}</em>` : '');
function questsWaiting() {
  const tr = typeof trialsOn === 'function' && trialsOn() ? trialsReady() : 0, T = typeof tasksOn === 'function' && tasksOn() ? S.tasks : null;
  return tr + (T ? [...(T.daily || []), ...(T.weekly || [])].filter((t) => !t.claimed && taskProg(t) >= t.n).length : 0);
}
// P20: the worlds fold only when the full list would not fit the menu's height (measured after drawing).
let railFold = false;
function renderRail() {
  const rail = $('#rail');
  railFold = false;
  drawRail();
  if (openRealms().length >= 3 && rail.scrollHeight > rail.clientHeight + 1) { railFold = true; drawRail(); }
}
function drawRail() {
  const groups = [];
  groups.push(`<div class="nav-quick">${quickMenu().map(([k, icn, l]) => `<button class="nq ${isOn(k) ? 'on' : ''} ${S.ui.fresh && S.ui.fresh[k] ? 'fresh' : ''}" data-nav="${k}">${ui(icn)}<span>${l}</span>${k === 'power' && energyIdle() > 0 ? '<i class="nr-busy" title="Energy not in use"></i>' : ''}${k === 'techniques' && typeof techReady === 'function' ? navBadge(techReady(), 'Scrolls to read') : ''}${k === 'quests' ? navBadge(questsWaiting(), 'Rewards to claim') : ''}</button>`).join('')}</div>`);
  // Le menu qui tient: from 3 worlds on, the worlds you are not in fold to one line of skill chips (icon + level,
  // one click each). Open: the world on screen, the one working, the newest, and any you unfolded yourself.
  const realms = openRealms(), fold = !!railFold && realms.length >= 3, ro = S.ui.railOpen || {};
  const [vn, vr] = S.ui.view.split(':');
  const auto = new Set([vn === 'realm' ? vr : null, S.action ? SKILLS[S.action.skill].realm : null, realms[realms.length - 1]]);
  for (const r of realms) {
    const open = !fold || (ro[r] != null ? !!ro[r] : auto.has(r));
    const ks = openSkillsOf(r), busy = S.action && ks.includes(S.action.skill);
    const head = `<button class="nav-sec ${fold ? 'fold' : ''}" ${fold ? `data-railfold="${r}" aria-expanded="${open}"` : 'tabindex="-1"'} style="--rc:${rc(r)}">${fold ? `<i class="ns-chev">${open ? '⌄' : '›'}</i>` : ''}${ic('realm', r)}<span>${REALMS[r].name}</span>${!open && busy ? '<i class="ns-busy" title="An activity runs here"></i>' : ''}</button>`;
    groups.push(open ? `<div class="nav-group">${head}
      ${ks.map((k) => navRow(`realm:${r}:${k}`, ic('skill', k), SKILLS[k].name, { skill: k, color: rc(r), busy: S.action && S.action.skill === k })).join('')}</div>`
      // Folded: the world's full name, then one chip per skill (icon, level, XP filling along its bottom edge).
      : `<div class="nav-group folded">${head}<div class="nav-chips">${ks.map((k) => `<button class="nchip ${S.action && S.action.skill === k ? 'busy' : ''} ${k === guideSkill() && !isOn(`realm:${r}:${k}`) ? 'goal' : ''} ${S.ui.fresh && S.ui.fresh[`realm:${r}:${k}`] ? 'fresh' : ''}" data-nav="realm:${r}:${k}" style="--rc:${rc(r)}" data-rtip="skill:${k}">${ic('skill', k)}<b data-lv="${k}">${skillLv(k)}</b><i class="nc-xp"><i data-xpbar="${k}"></i></i></button>`).join('')}</div></div>`);
  }
  // Combat sits under the starting world: you fish and cook before you fight.
  if (featureOpen('battle')) groups.splice(Math.min(2, groups.length), 0, `<div class="nav-group"><div class="nav-sec" style="--rc:${rc('combat')}">${ui('battle')}Combat</div>
    ${navRow('battle', skillArt('character') ? ic('skill', 'character') : ui('battle'), 'Combat', { color: rc('combat'), busy: S.combat.zone != null, skill: 'character', note: S.combat.zone != null ? ZONES[S.combat.zone].name : '' })}</div>`);
  $('#rail').innerHTML = `<div class="nav-quest" id="navquest">${goalHTML()}</div>${groups.join('')}${nextUnlockHTML('nav-next')}`;
  $('#tabbar').innerHTML = [
    `<button class="tab-btn" data-menu>${ui('menu')}<span>Menu</span></button>`,
    ...[['home', 'home', 'Overview'], ['character', 'character', 'Character'], ['battle', 'battle', 'Combat'], ['hero', 'bank', 'Bank']]
      .map(([k, icn, l]) => {
        const f = featureOfView(k);
        if (f && !featureOpen(f)) return `<button class="tab-btn locked" data-locked="${f}">${ui('lock')}<span>${l}</span></button>`;
        return `<button class="tab-btn ${isOn(k) ? 'on' : ''}" data-nav="${k}">${ui(icn)}<span>${l}</span></button>`;
      }),
  ].join('');
}

/* =============================================================== renown + ascension */
function renownHTML(r) {
  const P = renownProg(r), t = renownTier(r);
  const nextAsc = [25, 50, 75].find((x) => x > P.L);
  return `<section class="win renown" style="--rc:${rc(r)}">${hdr('Renown', `${REALMS[r].name}`)}
    <div class="rn-top"><b>${P.L}</b><span class="rn-bar"><span class="pbar"><i style="width:${P.p * 100}%"></i></span><small>${P.need ? fmt(P.need) + ' to next level' : 'Max renown'}</small></span></div>
    <ul class="rn-list">
      <li><span>Skill speed here</span><b>+${t * 3}%</b></li>
      <li><span>Damage & defense in its zones</span><b>+${t * 3}%</b></li>
      <li><span>Ascension tiers</span><b>${maxAsc(r)} / 3</b></li>
    </ul>
    <p class="muted small">${nextAsc ? `Renown ${nextAsc}: Ascension tier ${[25, 50, 75].indexOf(nextAsc) + 1} for this world's stages.` : 'Every Ascension tier is open.'} Every Renown level anywhere also gives +0.2% XP to all skills (now +${fmt(totalRenown() * 0.2)}%).</p>
  </section>`;
}
function ascPicker(r) {
  const m = maxAsc(r);
  if (!m) return '';
  const cur = ascTier(r);
  return `<span class="asc-pick" title="Ascension: replay these stages harder for more XP, gold, Renown and the newest world's relics">${[0, 1, 2, 3].slice(0, m + 1).map((t) => `<button class="${t === cur ? 'on' : ''} t${t}" data-asc="${r}:${t}">${t ? ASC[t].name : 'Normal'}</button>`).join('')}</span>`;
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
  if (!u || goalOpens() === u) return '';   // the quest already asks for it: the quest box says "Opens …"
  const r = u.id.startsWith('realm:') ? u.id.slice(6) : null;
  if (r && !worldInBuild(r)) return '';
  const isGate = r && GATES[r];
  const tag = isGate ? 'button' : 'div';
  return `<${tag} class="nx ${cls}" ${isGate ? 'data-nav="home"' : ''}><span class="nx-ic">${unlockIcon(u)}<i>${ui('lock')}</i></span>
    <span class="nx-t"><small>Next${r ? ' world' : ''}</small><b>${esc(u.name)}</b><em>${isGate ? gateStatus(r) : esc(u.hint())}</em></span></${tag}>`;
}
// Where a gate stands, as a state rather than an instruction: the guardian, then the offering and its first missing item.
function gateStatus(r) {
  const st = gateState(r), offer = Object.entries(st.g.offer);
  if (!st.boss) return `Defeat the ${esc(bossName(st.g.boss))}`;
  const miss = offer.find(([k, n]) => stock(k) < n);
  return `Offering ${offer.filter(([k, n]) => stock(k) >= n).length} / ${offer.length}${miss ? ` · Get <u data-tip="${miss[0]}">${esc(ITEMS[miss[0]].name)}</u>` : ''}`;
}
// The next unlock, when the current quest step is exactly what opens it.
function goalOpens() {
  const st = goalState(), u = nextUnlock();
  return st && u && u.hint && u.hint().toLowerCase() === st.g.text.toLowerCase() ? u : null;
}
// Iconic item id -> schematic id
const SCHEM_OF = Object.fromEntries(Object.keys(ITEMS).filter((k) => ITEMS[k].type === 'schematic').map((k) => [ITEMS[k].teaches, k]));

/* ------------------------------------------------------------- gate card */
// Shown on the Overview once the next world's guardian can be reached.
function gateHTML() {
  const r = nextGate();
  if (!r) return '';
  const st = gateState(r), g = st.g, bz = ZONES.findIndex((z) => z.id === g.boss), boss = ZONES[bz].enemies[0];
  if (!st.boss && !zoneUnlocked(bz)) return '';
  // The build's last world is done: no offering to gather for a gate that cannot open.
  if (!worldInBuild(r)) return st.boss ? `<section class="win gate" style="--rc:${rc(r)}"><div class="gt-head"><span class="gt-ic">${ic('realm', r)}</span>
      <div class="gt-t"><small>End of this build</small><h2>${esc(REALMS[r].name)}</h2><p>Coming in a later build. Thanks for playing this far!</p></div></div></section>` : '';
  return `<section class="win gate" style="--rc:${rc(r)}">
    <div class="gt-head"><span class="gt-ic">${ic('realm', r)}</span>
      <div class="gt-t"><small>Gate to ${REALMS[r].name}</small><h2>${esc(g.name)}</h2></div></div>
    <div class="gt-req">
      <div class="gt-step ${st.boss ? 'ok' : ''}"><i>${st.boss ? ui('check') : ic('enemy', boss.name)}</i><span>Defeat the <b>${boss.name}</b></span><em>${st.boss ? 'Done' : 'Not yet'}</em></div>
      <div class="gt-step ${st.items ? 'ok' : ''}"><i>${st.items ? ui('check') : ui('gate')}</i><span>Make the offering</span>
        <span class="gt-offer">${Object.entries(g.offer).map(([k, n]) => tile(k, `<em data-have="${k}" data-n="${n}">${fmt(stock(k))}</em>/${fmt(n)}`, { cls: 'xs ' + (stock(k) < n ? 'short' : ''), title: `${ITEMS[k].name}: ${sourcesOf(k).map((x) => x.text).slice(0, 2).join(', ') || 'see Bank'}` })).join('')}</span></div>
    </div>
    <div class="gt-cta">${gbtn('Open the gate', 'gate', `data-gate="${r}" ${st.ready ? '' : 'disabled'}`, st.ready ? 'glow' : '')}</div>
  </section>`;
}
const SYN_KIND = { speed: 'speed', double: 'double output', xp: 'XP', rare: 'rare finds', heal: 'food healing', dmg: 'damage', hp: 'max HP' };
const synTargetName = (s) => (SKILLS[s.to] ? SKILLS[s.to].name : { gather: 'all gathering', craft: 'all crafting', all: 'every skill', combat: 'Combat' }[s.to]);
// dir 'in': shows the skill giving the bonus. dir 'out': shows who receives it.
function synRow(s, dir) {
  const otherOpen = dir === 'in' ? skillOpen(s.from) : synTargetOpen(s);
  if (!otherOpen) return '';
  const icon = dir === 'in' ? ic('skill', s.from) : SKILLS[s.to] ? ic('skill', s.to) : s.to === 'combat' ? ui('battle') : ui('star');
  const v = synValue(s);
  return `<div class="syn ${v > 0 ? 'on' : ''}"><span class="syn-ic">${icon}</span>
    <span class="syn-t"><b>${s.name}</b><small>${dir === 'in' ? `From ${SKILLS[s.from].name}` : `To ${synTargetName(s)}`} · ${s.desc}</small></span>
    <span class="syn-v"><b>+${pct(v)}</b><small>${SYN_KIND[s.kind]} · +${pct(s.per)}/lv</small></span></div>`;
}
function synergyHTML(into, from) {
  const col = (title, list, dir) => { const rows = list.map((s) => synRow(s, dir)).join(''); return `<div class="syn-col"><small class="syn-h">${title}</small>${rows || '<div class="muted small">None yet</div>'}</div>`; };
  return `${hdr('Synergies')}
  <div class="syn-grid">${col('Boosted by', into, 'in')}${col('Boosts', from, 'out')}</div>`;
}

/* =============================================================== shared bits */
function xpInfo(id) {
  const xp = S.skills[id].xp, L = levelOf(xp, maxLv(id));
  const lo = XP_TABLE[L], hi = XP_TABLE[L + 1];
  const M = maxLv(id);
  return { L, p: L >= M ? 1 : (xp - lo) / (hi - lo), xp, need: L >= M ? 0 : hi - xp };
}
const xpText = (b) => (b.need ? `${fmt(b.xp)} XP <em>· ${fmt(b.need)} to next level</em>` : 'MAX LEVEL');
const sgn = (v) => (v > 0 ? '+' : '') + fmt(v);
function statRows(st) {
  const rows = [];
  if (st.atk) rows.push(['atk', 'Attack', sgn(st.atk)]);
  if (st.def) rows.push(['def', 'Defense', sgn(st.def)]);
  if (st.hp) rows.push(['hp', 'Max HP', sgn(st.hp)]);
  if (st.gold) rows.push(['gold', 'Gold bonus', `+${pct(st.gold)}`]);
  if (st.rare) rows.push(['rare', 'Rare finds', `+${pct(st.rare)}`]);
  if (st.cxp) rows.push(['xp', 'Combat XP', `+${pct(st.cxp)}`]);
  if (st.dodge) rows.push(['dodge', 'Dodge', `+${pct(st.dodge)}`]);
  if (st.speed) rows.push(['spd', 'Skill speed', `+${pct(st.speed)}`]);
  return rows;
}
const statInline = (st) => statRows(st).map(([icn, , v]) => `<span>${ui(icn)}${v}</span>`).join('');
const attrList = (rows) => `<div class="attrs">${rows.map(([icn, l, v, attrs]) => `<div class="attr"><i>${ui(icn)}</i><span>${l}</span><b ${attrs || ''}>${v}</b></div>`).join('')}</div>`;
// Drop rates: common ones as %, rare ones as "1/N" (easier to read for long odds).
// Every chance reads as a percentage (2026-11-25, no more "1/200" beside "20%"): two significant digits
// below 10% so rare odds stay readable and comparable: 25%, 15.9%, 4.5%, 0.67%, 0.067%.
const fmtRate = (p) => {
  p = Math.max(0, Math.min(1, p || 0));
  if (p >= 0.1) return pct(p);
  const v = p * 100;
  return (v >= 1 ? Math.round(v * 10) / 10 : Number(v.toPrecision(2))).toLocaleString('en-US', { maximumFractionDigits: 6 }) + '%';
};

// Where every item comes from, with rates. Built once from the data tables.
let SOURCES = null;
function sourcesOf(id) {
  if (!SOURCES) {
    SOURCES = {};
    // go: where a click on the source leads (tooltips.js tipGo): act:<skill>:<action>, skill:<skill>, zone:<i>, tip:<item>, view:<view>
    const add = (item, icon, text, rate, go) => {
      if (item === 'FRUIT') { FRUITS.forEach((f) => add(f, icon, text, rate == null ? null : rate / FRUITS.length, go)); return; }
      if (item === 'GEM') { const tot = GEM_TABLE.reduce((a, g) => a + g[1], 0); GEM_TABLE.forEach(([g, w]) => add(g, icon, text, rate * w / tot, go)); return; }
      (SOURCES[item] = SOURCES[item] || []).push({ icon, text, rate, go: go || null });
    };
    for (const k in SKILLS) for (const a of SKILLS[k].actions) {
      const go = `act:${k}:${a.id}`;
      for (const o in a.out || {}) add(o, ['skill', k], `${SKILLS[k].name} Lv ${a.level} · ${a.name}`, null, go);
      for (const [t, c] of a.extra || []) add(t, a.loot ? ['voyage', a.id] : ['skill', k], `${a.loot ? 'Voyage' : SKILLS[k].name} · ${a.name}`, c, go);
      if (a.loot) {
        a.loot.table.forEach(([t]) => add(t, ['voyage', a.id], `Voyage · ${a.name}`, 1 / a.loot.table.length, go));
        a.loot.rare.forEach(([t, c]) => add(t, ['voyage', a.id], `Voyage · ${a.name}`, c, go));
      }
    }
    for (const k in RARE_FINDS) RARE_FINDS[k].forEach(([t, c]) => add(t, ['skill', k], `${SKILLS[k].name} · any action`, c, 'skill:' + k));
    GLOBAL_RARE.forEach(([t, c]) => add(t, ['ui', 'rare'], 'Any skill action', c));
    ZONES.forEach((z, zi) => { for (const e of z.enemies) e.drops.forEach(([t, c]) => add(t, ['enemy', e.name], `${e.name} · ${z.name}`, c, z.dungeon ? 'view:battle#gs-dungeons' : 'zone:' + zi)); });
    for (const k in ITEMS) if (ITEMS[k].type === 'chest') {
      const tot = ITEMS[k].loot.reduce((a, l) => a + l[1], 0);
      ITEMS[k].loot.forEach(([t, w]) => add(t, ['item', k], ITEMS[k].name, w / tot, 'tip:' + k));
    }
    SHOP.forEach((sh) => { if (sh.give) add(sh.give[0], ['shop', sh.id], 'Market', null, 'view:market'); });
    if (typeof EXTRA_SOURCES !== 'undefined') EXTRA_SOURCES.forEach(([id, k, ref, text, rate]) => add(id, [k, ref], text, rate, k === 'skill' && SKILLS[ref] ? 'skill:' + ref : null));
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
  const r = { T, per, xph: per * a.xp * skillXpMult(skill) * earlyXp(skill) };
  if (a.out) r.itemsh = per * Object.values(a.out)[0] * (1 + doubleChance(skill, a.id));
  if (a.in) { r.can = Math.min(...Object.entries(a.in).map(([k, n]) => Math.floor(stock(k) / n))); r.runout = r.can * T; }
  return r;
}
function combatRates() {
  const z = ZONES[S.combat.zone], e = z.enemies[0];
  const kph = 3600 / (timeToKill(e) + (z.boss ? BOSS_RESPAWN : FOE_RESPAWN));
  return { z, kph, xph: z.dungeon ? kph * e.xp * 1.33 * xpMult() * xpFalloff(z) : zoneXphReal(S.combat.zone), goldh: kph * (e.gold[0] + e.gold[1]) / 2 * goldMult() };
}
// The big "now farming" block (overview + the active skill page).
function farmPanel() {
  if (S.action) {
    const skill = S.action.skill, s = SKILLS[skill], a = findAction(skill, S.action.id), f = farmRates(skill, a);
    const outId = a.out ? Object.keys(a.out)[0] : null;
    return `<div class="farm" style="--rc:${rc(s.realm)}">
      <div class="fm-head"><span class="fm-ring" data-nowring>${tile(null, null, { r: actRarity(a), icon: actIc(skill, a), mark: actMark(a), title: a.name })}</span>
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
      <div class="fm-head"><span class="fm-ring hp" data-nowring>${tile(null, null, { r: c.z.boss ? 5 : 3, icon: ic('zone', c.z.id), title: c.z.name })}</span>
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
// Extension points filled by ui-systems.js: each entry returns HTML (or '').
// realmScene: an animated scene under a skill's banner (seas-ui.js); when one is shown it carries the farm numbers.
const UIX = { realmIntro: [], bagTop: [], quick: [], homeTop: [], questsBottom: [], realmSide: [], realmTop: [], realmScene: [], battleTop: [], battleSide: [], stageMe: [], inspector: [], inspectorAny: [], actLines: [], collectionTop: [], nowbar: [], colDetail: [], stagesTop: [] };
const uix = (k, ...a) => UIX[k].map((f) => f(...a) || '').join('');
// The quiet guide (guide.js): the first line of help on Woodcutting. A page's guide opens by itself on the first visit (skill-guide.js).
UIX.realmIntro.push((realm, skill) => firstHintHTML(realm, skill));

/* ------------------------------------------------------------- overview */
VIEWS.home = () => {
  const rank = BOUNTY_RANKS[bountyRank()];
  const farm = farmPanel();
  const skillCard = (k) => {
    const b = xpInfo(k), busy = (S.action && S.action.skill === k) || (SKILLS[k].realm === 'combat' && S.combat.zone != null);
    return `<button class="ov-skill ${busy ? 'busy' : ''}" data-nav="${skillView(k)}" style="--rc:${rc(SKILLS[k].realm)}">
      <span class="ovs-ring" data-xpring="${k}" style="--p:${b.p}">${ic('skill', k)}</span><span class="ovs-main"><span class="ovs-top"><b>${SKILLS[k].realm === 'combat' ? 'Combat' : SKILLS[k].name}</b><em><small>Lv</small> <span data-lv="${k}">${b.L}</span></em></span>
      <span class="xpbar thin"><i data-xpbar="${k}"></i></span></span></button>`;
  };
  // What this build still holds shows as locked cards (worlds, Combat, skills, panels), each with what opens it.
  const lockSkill = (k) => { const u = UNLOCK_BY['skill:' + k]; return u && u.req ? `<div class="ov-skill ov-locked"><span class="ovs-ring">${ic('skill', k)}</span><span class="ovs-main"><b>${SKILLS[k].name}</b><small>Unlocked ${esc(unlockReq(u))}</small></span></div>` : ''; };
  const realmCard = (r) => {
    if (r === 'combat') return featureOpen('battle') ? `<section class="win ov-realm" style="--rc:${rc(r)}"><h3 class="ov-rh">${ui('battle')}Combat</h3>${skillsOf(r).map(skillCard).join('')}</section>`
      : lockCardHTML(ui('battle'), 'Combat', UNLOCK_BY['feature:battle'], 'ov-realm');
    if (!realmOpen(r)) return lockCardHTML(ic('realm', r), REALMS[r].name, UNLOCK_BY['realm:' + r], 'ov-realm');
    return `<section class="win ov-realm" style="--rc:${rc(r)}"><h3 class="ov-rh">${ic('realm', r)}${REALMS[r].name}</h3>
      ${openSkillsOf(r).map(skillCard).join('')}${skillsOf(r).filter((k) => !skillOpen(k)).map(lockSkill).join('')}</section>`;
  };
  const worlds = WORLD_ORDER.filter((r) => r !== 'rift' && (realmOpen(r) || worldInBuild(r)));
  const later = [['feature:huntlist', 'Hunt List', ui('hunt')]].filter(([id]) => !isUnlocked(id) && overviewSoon(id)).map(([id, n, icn]) => lockCardHTML(icn, n, UNLOCK_BY[id])).join('');
  // the next gate's card waits for its guardian's stage
  const gate = gateHTML(), gr = nextGate(), gz = gr && ZONES.find((z) => z.id === GATES[gr].boss);
  const gateSoon = !gate && gr && gz && worldInBuild(gr) ? lockCardHTML(ui('gate'), GATES[gr].name, { req: `at the ${gz.name.replace(/^The /, '')}` }) : '';
  // One screen: what runs now and what waits on the left, every skill and your record on the right.
  return `
  ${ptitle('', 'Overview')}
  ${fitCols('ov-board', `<div class="ov-top">
    <section class="win">${farm || idlePicksHTML()}</section>
    ${buildEnd() ? '' : `<section class="win quest-win phone-only">${goalHTML()}</section>`}
  </div>
  ${gate || gateSoon}
  ${uix('homeTop')}${later}`, `${hdr('Skills', `Total level ${totalLevel()}`)}
  <div class="ov-grid">${[worlds[0], 'combat', ...worlds.slice(1)].map(realmCard).join('')}
    ${gate || nextOnCard() ? '' : nextUnlockHTML('win ov-next phone-only')}</div>
  ${featureOpen('battle') ? `<section class="win adv-win">${hdr('Adventurer')}
    <div class="stats">${stat('Bounty', `${rank[1]}<small class="adv-bounty">${fmt(S.bounty)}</small>`, `title="+${bountyRank() * 5}% damage${BOUNTY_RANKS[bountyRank() + 1] ? ` · ${BOUNTY_RANKS[bountyRank() + 1][1]} at ${fmt(BOUNTY_RANKS[bountyRank() + 1][0])}` : ''}"`)}${stat('Foes defeated', fmt(S.stats.kills))}${featureOpen('collection') ? stat('Collection', Math.floor(collectionPct() * 100) + '%') : ''}${featureOpen('techniques') ? stat('Techniques', fmt(Object.keys(S.tech.lv).length)) : ''}${Object.keys(S.pets).length ? stat('Pets', fmt(Object.keys(S.pets).length)) : ''}</div>
  </section>` : lockCardHTML(ui('bounty'), 'Adventurer', UNLOCK_BY['feature:battle'])}`)}`;
};
// A card of something this build has not opened yet: its name and what opens it ("Unlocked at Woodcutting Lv 3").
function lockCardHTML(icon, name, u, cls) {
  return `<section class="win ov-lock ${cls || ''}"><span class="ol-ic">${icon}<i>${ui('lock')}</i></span><span class="ol-t"><b>${esc(name)}</b>${u && u.req ? `<small>Unlocked ${esc(unlockReq(u))}</small>` : ''}</span></section>`;
}
// The next unlock already has its locked card on the Overview (a skill, a world, Combat, the Hunt List).
const nextOnCard = () => { const u = nextUnlock(); return !!u && (/^(skill|realm):/.test(u.id) || u.id === 'feature:battle' || u.id === 'feature:huntlist'); };
// A later panel of the Overview shows locked only when its world is in this build.
function overviewSoon(id) {
  const i = UNLOCKS.findIndex((u) => u.id === id), w = UNLOCKS.slice(0, i).reverse().find((u) => u.id.startsWith('realm:'));
  return i >= 0 && (!w || worldInBuild(w.id.slice(6)));
}

// Idle Overview: up to three one-click picks (resume, the objective, the closest level-up) instead of an explanation.
// The "how idle games work" line stays only until the first objective is done.
function closestLevel() {
  let best = null;
  for (const k of Object.keys(SKILLS)) {
    const s = SKILLS[k];
    if (s.realm === 'combat' || !skillOpen(k) || !s.actions.length || FOCUS_NONE_IDLE[s.type]) continue;
    const need = xpInfo(k).need;
    if (!need) continue;
    for (const a of s.actions) {
      if (actState(k, a) !== 'ready' || !a.xp) continue;
      const t = (need / (a.xp * skillXpMult(k) * earlyXp(k))) * actionTime(k, a);
      if (!best || t < best.t) best = { k, a, t, L: skillLv(k) };
    }
  }
  return best;
}
const FOCUS_NONE_IDLE = { voyage: 1, farm: 1 };
function idlePicksHTML() {
  // Resume lives in the activity bar and the objective in the sidebar (phones: the quest card above): only what neither shows.
  const re = resumeInfo(), cl = closestLevel(), picks = [];
  const card = (cls, kick, icon, name, sub, btn) => `<div class="ip-card ${cls}"><small>${kick}</small><div class="ip-main"><span class="ip-ic">${icon}</span><span><b>${name}</b><em>${sub}</em></span></div>${btn}</div>`;
  if (cl && !(re && S.ui.last[1] === cl.k && S.ui.last[2] === cl.a.id)) picks.push(card('level', 'Closest level-up', ic('skill', cl.k), `${SKILLS[cl.k].name} → ${cl.L + 1}`, `${esc(cl.a.name)} · ${fmtTime(cl.t)}`, gbtn('Start', 'play', `data-act="${cl.k}:${cl.a.id}"`, 'sm dark')));
  return `<div class="idle-picks">${hdr('Pick up where you left off')}
    ${picks.length ? `<div class="ip-grid">${picks.join('')}</div>` : '<p class="muted ip-note">Pick a skill in the menu.</p>'}</div>`;
}

/* ------------------------------------------------------------- skill page */
// The skill's title banner: icon, name, XP bar, speed / XP / luck modifiers, level ring.
function skBannerHTML(realm, skill) {
  const R = REALMS[realm], s = SKILLS[skill], b = xpInfo(skill);
  // Only the boosts you actually have: a ×1.00 chip says nothing.
  const mods = [];
  if (skillSpeed(skill).toFixed(2) !== '1.00') mods.push(`<span class="pill" title="Action speed">${ui('spd')} Speed ×${skillSpeed(skill).toFixed(2)}</span>`);
  if (skillXpMult(skill).toFixed(2) !== '1.00') mods.push(`<span class="pill" title="XP multiplier">${ui('xp')} XP ×${skillXpMult(skill).toFixed(2)}</span>`);
  if (rareMult(skill).toFixed(2) !== '1.00') mods.push(`<span class="pill" title="Rare find multiplier">${ui('rare')} Luck ×${rareMult(skill).toFixed(2)}</span>`);
  if (skill === 'fishing' && S.fruit) mods.push(`<span class="pill bad" title="Abyss Fruit eaters fish 40% slower">${ui('fruit')} −40% speed</span>`);
  // Compact (2026-11-24): the level ring is the XP bar, and the buffs and Path / Rare finds / Synergies share one
  // line, so the focus panel's button stays above the fold at 860 px.
  return `<section class="sk-banner sk-slim" style="--rc:${rc(realm)}">
    <div class="sk-ring" data-xpring="${skill}" style="--p:${b.p}" data-rtip="skill:${skill}"><span><b data-lv="${skill}">${b.L}</b><small>Level</small></span></div>
    <div class="sk-main"><small>${R.name}</small>
      <div class="sk-line"><h1>${s.name}</h1>${typeof skGuideBtn === 'function' ? skGuideBtn(skill) : ''}<span class="sk-xpt" data-xptext="${skill}">${xpText(b)}</span></div>
      <div class="sk-line sk-chips"><div class="pills">${mods.join('')}</div>${typeof skInfoBtns === 'function' && s.realm !== 'combat' ? skInfoBtns(skill) : ''}</div></div>
  </section>`;
}
VIEWS.realm = (realm, skill) => {
  const s = SKILLS[skill], b = xpInfo(skill);
  const open = s.actions.filter((x) => !['locked', 'schem'].includes(actState(skill, x))).length;
  const active = S.action && S.action.skill === skill;
  const scene = uix('realmScene', realm, skill);
  const top = uix('realmTop', realm, skill);
  const grid = !scene || s.type === 'voyage';
  // One screen (skBoardHTML): the focus panel and the skill's own panels on the left, the action list on the right.
  const LIST = { craft: 'Recipes', voyage: 'Destinations', tame: 'Hunts', bond: 'Rituals' };
  let list = null;
  if (s.type === 'craft') list = [LIST.craft, workshopHTML(skill, scene ? { detail: false } : {})];
  else if (scene && (s.type === 'gather' || s.type === 'bond')) list = [PICK_TITLE[skill] || 'Actions', pickerHTML(skill)];
  else if (grid && s.actions.length) list = [LIST[s.type] || 'Gathering', `<div class="act-grid" style="--rc:${rc(realm)}">${s.actions.filter((x) => x.level <= b.L).map((x) => actCard(skill, x)).join('')}</div>
    ${open < s.actions.length ? `<section class="win lock-win">${hdr(s.type === 'voyage' ? 'Later destinations' : 'Later')}<div class="lock-strip">${s.actions.filter((x) => x.level > b.L).map((x) => `<div class="lchip" data-card="${skill}:${x.id}" data-state="${actState(skill, x)}" title="${esc(x.name)}: requires ${s.name} level ${x.level}${x.schem && !S.known[x.schem] ? ' and its schematic' : ''}">${tile(null, null, { r: actRarity(x), icon: actIc(skill, x), cls: 'xs' })}<span><b>${esc(x.name)}</b><small>${x.schem && !S.known[x.schem] ? ui('schematic') : ui('lock')}Lv ${x.level}</small></span></div>`).join('')}</div></section>` : ''}`];
  // the first-visit card, then the focus panel, then the skill's own panels (heat, plots, companions...)
  const intro = uix('realmIntro', realm, skill);
  const main = scene ? `${intro}${scene}${top}` : `${intro}${active ? `<section class="win farm-win">${farmPanel()}</section>` : ''}${top}`;
  // Workshops: the recipe gallery leads (left, 60%), the recipe in progress sits beside it (40%).
  return skBoardHTML(realm, skill, { main, list, cls: s.type === 'craft' && scene ? 'sk-craft' : '' });
};
function actState(skill, a) {
  if (a.schem && !S.known[a.schem]) return 'schem';
  if (skillLv(skill) < a.level) return 'locked';
  if (S.action && S.action.skill === skill && S.action.id === a.id) return 'active';
  if (a.in && !canAfford(a.in)) return 'missing';
  if (actionBlock(skill, a)) return 'blocked';
  return 'ready';
}
function ctaLabel(skill, a, st) {
  st = st || actState(skill, a);
  if (st === 'active') return `${ui('stop')}Stop`;
  if (st === 'missing') return `${ui('close')}Missing items`;
  if (st === 'blocked') return `${ui('check')}${esc(actionBlock(skill, a).split('.')[0])}`;
  if (st === 'locked') return `${ui('lock')}Lv ${a.level}`;
  return `${ui('play')}${SKILLS[skill].type === 'voyage' ? 'Set sail' : SKILLS[skill].type === 'craft' ? 'Craft' : 'Start'}`;
}
function actCard(skill, a) {
  if (SKILLS[skill].type === 'voyage' && skillLv(skill) >= a.level) return expCard(a);   // expeditions-ui.js
  const st = actState(skill, a), r = actRarity(a), outId = a.out ? Object.keys(a.out)[0] : null, it = outId ? ITEMS[outId] : null;
  const art = actTile(skill, a, { cls: 's' });
  if (st === 'schem') {
    const src = sourcesOf(a.schem)[0];
    return `<div class="acard schem" data-card="${skill}:${a.id}" data-state="schem">
      <div class="ac-head">${art}<div class="ac-name"><b>${esc(actNm(skill, a))}</b><small>${ui('schematic')}Schematic needed · Lv ${a.level}</small></div></div>
      ${src ? `<div class="ac-src">${ic(src.icon[0], src.icon[1])}<span>Drops from <b>${esc(src.text)}</b></span><em>${fmtRate(src.rate * luckMult())}</em></div>` : ''}</div>`;
  }
  if (st === 'locked') {
    return `<div class="acard ${a.schem ? 'learned' : ''}" data-card="${skill}:${a.id}" data-state="locked">
      <div class="ac-head">${art}<div class="ac-name"><b>${esc(actNm(skill, a))}</b><small>${ui('lock')}Requires level ${a.level}${a.schem ? ' · schematic learned' : ''}</small></div></div></div>`;
  }
  const f = farmRates(skill, a), ml = masteryLv(skill, a.id);
  const lines = [];
  if (a.in) lines.push(`<div class="ac-io"><small>Needs</small>${Object.entries(a.in).map(([k, n]) => tile(k, `<em data-have="${k}" data-n="${n}">${fmt(stock(k))}</em>/${fmt(n)}`, { cls: 'xs ' + (stock(k) < n ? 'short' : ''), unknown: !isFound(k), r: rarity(k) })).join('')}</div>`);
  if (a.loot) {
    lines.push(`<div class="ac-io"><small>Loot</small>${tile(null, `${fmt(a.loot.gold[0] * goldMult())}+`, { r: 3, icon: ui('gold'), cls: 'xs', title: 'Gold' })}${a.loot.table.map(([k]) => tile(k, null, { cls: 'xs' })).join('')}</div>`);
    lines.push(`<div class="ac-io"><small>Rare</small>${a.loot.rare.map(([k, c]) => tile(k, fmtRate(c * luckMult()), { cls: 'xs', unknown: !isFound(k) })).join('')}</div>`);
  }
  if (it && it.type === 'equip') lines.push(`<div class="ac-note">${statInline(it.stats)}</div>`);
  lines.push(uix('actLines', skill, a));
  if (it && it.type === 'food') lines.push(`<div class="ac-note"><span>${ui('hp')}Heals ${foodHeal(outId)} HP</span></div>`);
  return `<button class="acard" data-act="${skill}:${a.id}" data-card="${skill}:${a.id}" data-state="${st}">
    <div class="ac-head">${art}<div class="ac-name"><b>${esc(a.name)}</b><small>${a.loot ? 'Voyage' : outId ? typeLabel(outId) : a.kind || SKILLS[skill].name} · Lv ${a.level}</small></div><span class="ac-cta" data-cta2>${ctaLabel(skill, a, st)}</span></div>
    <div class="ac-stats"><span title="Time per action">${ui('time')}<b>${fmtTime(f.T)}</b></span><span title="XP per action">${ui('xp')}<b>${fmt(a.xp)}</b> xp</span><span title="XP per hour"><b>${fmt(f.xph)}</b> xp/h</span></div>
    ${lines.join('')}
    <div class="ac-foot">${it ? `<span class="ac-own">Owned <b data-count="${outId}">${fmt(count(outId))}</b></span>` : `<span class="ac-own">${fmt(f.per)} / hour</span>`}
      <span class="ac-m" title="Mastery: each level makes this action 0.3% faster and adds 0.1% chance to double">${ui('mastery')}<b data-mlv="${skill}:${a.id}">${ml}</b><span class="bar mini"><i data-mfill="${skill}:${a.id}"></i></span></span></div>
    <span class="ac-prog"><i data-cardfill></i></span>
  </button>`;
}
function rareTiles(skill) {
  const m = rareMult(skill), out = [];
  for (const [id, c] of (RARE_FINDS[skill] || []).concat(GLOBAL_RARE)) {
    if (id === 'GEM') {
      const tot = GEM_TABLE.reduce((a, g) => a + g[1], 0);
      GEM_TABLE.forEach(([g, w]) => out.push(tile(g, fmtRate(c * m * w / tot), { unknown: !isFound(g) })));
    } else out.push(tile(id, fmtRate(c * m), { unknown: !isFound(id) }));
  }
  const pet = PETS.find((x) => x.skill === skill);
  if (pet) out.push(petTile(pet, { n: S.pets[pet.id] ? 'Owned' : `1 / ${PET_HOURS}h`, reveal: false }));
  return out;
}

/* ------------------------------------------------------------- battle */
VIEWS.battle = () => {
  const C = S.combat;
  const foods = Object.keys(S.items).filter((k) => ITEMS[k].type === 'food');
  let lastRealm = null, groups = '';
  bestZoneI = bestZone();
  ZONES.forEach((z, i) => {
    if (z.dungeon || (REALMS[z.realm].hidden && !zoneUnlocked(i))) return;
    const sealed = !realmOpen(z.realm);
    if (sealed && !worldInBuild(z.realm)) return;
    if (z.realm !== lastRealm) {
      lastRealm = z.realm;
      groups += sealed
        ? `<div class="chapter sealed" style="--rc:${rc(z.realm)}"><span class="ch-ic">${ui('lock')}</span><b>${REALMS[z.realm].name}</b><small title="Sealed${GATES[z.realm] ? ' · ' + esc(GATES[z.realm].name) : ''}">${WORLD_ORDER.indexOf(z.realm) > 0 ? `Clear ${REALMS[WORLD_ORDER[WORLD_ORDER.indexOf(z.realm) - 1]].name}` : 'Sealed'}</small></div>`
        : `<div class="chapter" style="--rc:${rc(z.realm)}"><span class="ch-ic">${ic('realm', z.realm)}</span><b>${REALMS[z.realm].name}</b>${ascTier(z.realm) ? `<em class="asc-tag t${ascTier(z.realm)}">${ASC[ascTier(z.realm)].name}</em>` : ''}</div>`;
    }
    if (!sealed) groups += zoneRow(z, i);
  });
  const z = C.zone != null ? ZONES[C.zone] : null;
  // One screen (2026-11-25, like Melvor's combat page): the stage column (where, the foe, your dock) and
  // beside it one tabbed panel holding everything else: stages, dungeons, techniques, stats, log, drops...
  const part = (f) => f();
  const tabs = hdrTabs([
    `<section class="win stages" id="gs-stages">${hdr('Stages', `${ZONES.filter((x, i) => !x.dungeon && zoneUnlocked(i)).length} open`)}${tierSwitchHTML()}<div class="stage-list">${groups}</div>${uix('stagesTop')}</section>`,
    typeof dungeonsWinHTML === 'function' ? dungeonsWinHTML() : '',
    ...UIX.battleSide.map(part),
    `<section class="win char-stats" style="--rc:${rc('combat')}">${hdr('Stats')}${charStatsHTML()}<div class="syn-win">${synergyHTML(SYNERGIES.filter((x) => x.to === 'combat'), synergiesFrom('character'))}</div></section>`,
    `<section class="win log-win">${hdr('Log')}<div class="log" id="clog">${logHTML()}</div></section>`,
    ...(UIX.battleBottom || []).map(part),
  ]);
  return `<div class="gs-board fit">
  <div class="gs" style="--rc:${rc(z ? z.realm : 'combat')}">
    ${gsTopHTML(z)}
    <section id="stage" class="arena gs-stage ${C.zone != null ? 'fighting' : C.down ? 'down' : ''}">${stageHTML()}</section>
    ${gsDockHTML(foods)}
  </div>
  <div class="gs-panel">${uix('battleTop')}${tabPanelHTML('battle', tabs, 'gs-tabs')}</div>
  </div>`;
};
// "Grand Stage" (2026-11-24): no hero on screen. The top bar says where you fight and what it opens,
// the stage shows the foe (arena.js stageHTML), the command dock under it is you.
const zoneOpen = (i) => i >= 0 && i < ZONES.length && !ZONES[i].dungeon && realmOpen(ZONES[i].realm) && zoneUnlocked(i);
function gsNextInfo() {
  const C = S.combat, i = C.zone, nz = ZONES[i + 1];
  if (i == null || !nz || !realmOpen(nz.realm)) return null;
  if (zoneUnlocked(i + 1)) return { name: nz.name, open: true };
  const z = ZONES[i], need = z.boss ? 1 : 10, have = Math.min(need, C.kills[z.id] || 0);
  return { name: nz.name, need, have, boss: z.boss };
}
function gsTopHTML(z) {
  const C = S.combat, i = C.zone;
  let prev = -1, next = -1;
  if (z) { for (let k = i - 1; k >= 0; k--) if (zoneOpen(k)) { prev = k; break; } for (let k = i + 1; k < ZONES.length; k++) if (zoneOpen(k)) { next = k; break; } }
  const arrow = (k, ch, t) => `<button class="gs-arr" ${k >= 0 ? `data-zone="${k}" title="${esc(t + ': ' + ZONES[k].name)}"` : 'disabled'}>${ch}</button>`;
  const N = gsNextInfo(), [dl, dc] = z ? zoneDanger(i) : ['', ''];
  const prog = !N ? '' : N.open ? `<div class="gs-prog open"><small>Next stage open</small><b>${esc(N.name)}</b></div>`
    : `<div class="gs-prog"><small>Next stage · ${esc(N.name)}</small><span class="xpbar thin gold"><i data-gsnext style="width:${(N.have / N.need) * 100}%"></i></span><b data-gsnexttxt>${N.boss ? (N.have ? 'Boss defeated' : 'Defeat the boss') : `${N.have} / ${N.need} kills`}</b></div>`;
  return `<div class="gs-top">
    ${z ? arrow(prev, '‹', 'Previous stage') : ''}
    <div class="gs-where"><span class="gs-ric">${z ? ic('realm', z.realm) : ui('battle')}</span><span>${z ? `<small>${esc(REALMS[z.realm].name)}</small>` : ''}<b>${z ? esc(z.name) : 'Combat'}</b></span>${z ? `<span class="danger ${dc}">${dl}</span>` : ''}</div>
    ${z ? arrow(next, '›', 'Next stage') : ''}
    ${prog}
    <div class="gs-acts">${typeof dgOn === 'function' && dgOn() ? gbtn('Dungeons', 'chest', 'data-nav="battle#gs-dungeons"', 'dark sm gs-dgbtn') : ''}${z ? `<button class="gbtn sm hot" data-stopcombat title="Retreat"><i class="gbtn-ic">${gi('run')}</i><span>Retreat</span></button>` : ''}${typeof skGuideBtn === 'function' ? skGuideBtn('character').replace(/title="[^"]*"/, 'title="Guide: Combat"') : ''}</div>
  </div>`;
}
function gsTechHTML() {
  if (typeof techOn !== 'function' || !techOn()) return '';
  const slots = openSlots(), n = techReady();
  const buy = n ? `<button class="gs-tech gs-scrolls" data-readscroll="*" title="Read your ${n} scroll${n > 1 ? 's' : ''}">${gi('tied-scroll')}<em>Read ×${fmt(n)}</em></button>` : '';
  return `<div class="gs-techs">${buy}${slots.map((sl) => {
    const id = loadout()[sl.i];
    if (!id || !techLv(id)) return `<button class="gs-tech empty" data-nav="techniques" title="${esc(sl.name)}: empty. Equip a technique">${ui('plus')}</button>`;
    const pas = TECHNIQUES[id].cat === 'passive';
    return `<button class="gs-tech ${pas ? 'pas' : ''}" ${pas ? '' : `data-gstech="${id}"`} data-nav="techniques" title="${esc(TECHNIQUES[id].name)} · Lv ${techLv(id)}${pas ? ' · passive' : ''}">${ic('technique', id)}<em>${esc(TECHNIQUES[id].name)}</em><s></s></button>`;
  }).join('')}</div>`;
}
function gsDockHTML(foods) {
  const C = S.combat, b = xpInfo('character');
  return `<div class="gs-dock">
    <div class="gs-me" data-portrait="player">
      <span class="gs-lv" title="Character level"><small>Lv</small><b data-lv="character">${b.L}</b><span class="xpbar thin"><i data-xpbar="character" style="width:${b.p * 100}%"></i></span></span>
      <div class="gs-mebars">
        <div class="gs-mename"><b>You</b><span class="f-stats"><span title="Max hit">${ui('atk')}${fmt(pMaxHit())}</span><span title="Defense">${ui('def')}${fmt(pDef())}</span><span title="Attack speed">${ui('spd')}${pSpeed().toFixed(1)}s</span>${pDodge() ? `<span title="Dodge">${ui('dodge')}${pct(pDodge())}</span>` : ''}</span></div>
        <div class="hpbar"><i data-php></i><span data-phptext></span></div><div class="atkbar"><i data-patk></i></div>
        <div class="stchips" data-pst></div>${uix('stageMe')}
      </div>
      <div class="stunmark">${gi('circle-sparks')}</div>
    </div>
    ${gsTechHTML()}
    ${gsFoodHTML(foods)}
  </div>`;
}
// Where food comes from right now: the furthest open skill that makes it (Crafting pills in Leaf Village, Cooking later).
function foodSource() {
  let best = null;
  for (const k in SKILLS) {
    if (!skillOpen(k)) continue;
    const acts = SKILLS[k].actions.filter((a) => Object.keys(a.out || {}).some((id) => ITEMS[id] && ITEMS[id].type === 'food'));
    if (!acts.length) continue;
    const w = WORLD_ORDER.indexOf(SKILLS[k].realm);
    if (!best || w > best.w) best = { k, w, act: acts.filter((a) => a.level <= skillLv(k)).pop() || acts[0] };
  }
  if (!best) return null;
  const k = best.k, f = Object.keys(best.act.out)[0];
  return { k, say: k === 'arts' ? `craft ${ITEMS[f].name}s` : k === 'cooking' ? 'cook some' : `make some in ${SKILLS[k].name}`,
    btn: `<button class="gbtn dark sm" data-nav="realm:${SKILLS[k].realm}:${k}"><i class="gbtn-ic">${ic('skill', k)}</i><span>${SKILLS[k].name}</span></button>` };
}
// The food picker never shows a food you are not eating as picked: run out of it and it says so, in red.
function gsFoodHTML(foods) {
  const C = S.combat, thr = pct(autoEatThreshold());
  foods = foods.filter((f) => count(f) > 0);
  const out = C.food && ITEMS[C.food] && !count(C.food), src = foods.length ? null : foodSource();
  const head = out ? `<option value="${C.food}" selected>Out of ${esc(ITEMS[C.food].name)}${foods.length ? ': pick another food' : ''}</option>`
    : !foods.length ? `<option value="" selected>No food${src ? ': ' + src.say : ''}</option>`
    : !C.food ? '<option value="" selected>No food equipped</option>' : '';
  return `<div class="gs-food ${out || !foods.length ? 'empty' : ''}" title="Eaten when your HP drops below ${thr}">
      ${C.food && count(C.food) ? tile(C.food, `<span data-count="${C.food}">${fmt(count(C.food))}</span>`, { cls: 'xs' }) : `<span class="tile r0 xs"><span class="tile-art">${ui('food')}</span></span>`}
      <span class="gs-fsel"><small>Food · ${out || !foods.length ? 'empty' : 'eats below ' + thr}</small>
      <select data-food>${head}${foods.map((f) => `<option value="${f}" ${C.food === f ? 'selected' : ''}>${ITEMS[f].name} ×${fmt(count(f))} (+${foodHeal(f)} HP)</option>`).join('')}</select></span>
      ${src ? src.btn : ''}
    </div>`;
}
document.addEventListener('click', (ev) => {
  if (!ev.target.closest('[data-gostages]')) return;
  const el = $('#gs-stages');
  showPaneOf(el);
  if (el) el.scrollIntoView({ behavior: calmMotion() ? 'auto' : 'smooth', block: 'nearest' });
});
// One tier switch for every world (2026-11-24): each world takes the chosen tier, or its highest unlocked one
// below it (its header then names the tier it really plays). uix('stagesTop') (the Hardcore switch) now sits
// under the list, away from the stage rows.
function tierSwitchHTML() {
  const realms = [...new Set(ZONES.map((z) => z.realm))].filter((r) => realmOpen(r));
  const top = Math.max(0, ...realms.map((r) => maxAsc(r)));
  if (!top) return '';
  const cur = S.ui.ascAll != null ? S.ui.ascAll : Math.max(0, ...realms.map((r) => ascTier(r)));
  return `<nav class="tier-sw" title="Ascension: replay every world's stages harder for more XP, gold, Renown and relics">${[0, 1, 2, 3].map((t) => t > top
    ? `<button class="locked t${t}" disabled title="Reach Renown ${[0, 25, 50, 75][t]} in a world">${ui('lock')}${ASC[t].name}</button>`
    : `<button class="${t === cur ? 'on' : ''} t${t}" data-ascall="${t}">${t ? ASC[t].name : 'Normal'}</button>`).join('')}</nav>`;
}
document.addEventListener('click', (ev) => {
  const t = ev.target.closest('[data-ascall]');
  if (!t) return;
  const v = +t.dataset.ascall;
  S.ui.ascAll = v;
  for (const r of new Set(ZONES.map((z) => z.realm))) if (realmOpen(r) && maxAsc(r)) setAsc(r, v);
  dirty = true;
});
// The stage with the most XP per hour that you clear safely (Easy or Fair): marked in the list.
let bestZoneI = -1;
function zoneXph(zi) {
  const z = ZONES[zi], n = z.enemies.length;
  let t = 0, x = 0;
  for (let j = 0; j < n; j++) { const e = enemyAt(zi, j); t += timeToKill(e); x += e.xp; }
  return (3600 / (t / n + (z.boss ? BOSS_RESPAWN : FOE_RESPAWN))) * (x / n);
}
// What a stage really gives you per hour: your XP bonuses, and less once you outlevel it (xpFalloff).
const zoneXphReal = (zi) => zoneXph(zi) * 1.33 * xpMult() * xpFalloff(ZONES[zi]);
function bestZone() {
  let best = -1, bx = 0;
  ZONES.forEach((z, i) => {
    if (z.dungeon || !realmOpen(z.realm) || !zoneUnlocked(i) || !['easy', 'fair'].includes(zoneDanger(i)[1])) return;
    const x = zoneXphReal(i);
    if (x > bx) { bx = x; best = i; }
  });
  return best;
}
// The five character stats: base value (level + gear) and what it does once every multiplier applies.
function charStatsHTML() {
  const row = (icn, name, val, eff, tip) => `<div class="cstat" title="${esc(tip)}"><span class="cst-ic">${ui(icn)}</span><b>${name}</b><em>${val}</em><small>${eff}</small></div>`;
  return `<div class="cstats">
    ${row('atk', 'Attack', fmt(statAtk()), `max hit ${fmt(pMaxHit())}`, 'Raises the damage you deal')}
    ${row('def', 'Defense', fmt(statDef()), `−${pct(1 - mitig(pDef()))} damage`, 'Reduces the damage you take')}
    ${row('vit', 'Vitality', fmt(statVit()), `${fmt(pMaxHp())} HP`, 'Raises your max HP')}
    ${row('spd', 'Speed', fmt(statSpd()), `${pSpeed().toFixed(2)}s / attack`, 'Each point: +1% attack speed')}
    ${row('luck', 'Luck', fmt(statLuck()), `rare ×${luckMult().toFixed(2)}`, 'Each point: +1% chance on every rare find')}
  </div>`;
}
function zoneRow(z, i) {
  const C = S.combat;
  if (!zoneUnlocked(i)) {
    const prev = ZONES[i - 1], need = prev.boss ? 1 : 10, have = Math.min(need, C.kills[prev.id] || 0);
    return `<div class="zrow locked"><span class="z-ic">${ui('lock')}</span><span class="z-main"><b>${z.name}</b><small>${prev.boss ? `Defeat ${prev.enemies[0].name}` : `Defeat ${need} foes in ${prev.name}`} · ${have}/${need}</small></span></div>`;
  }
  const [dl, dc] = zoneDanger(i);
  return `<button class="zrow ${z.boss ? 'boss' : ''} ${C.zone === i ? 'on' : ''} ${i === bestZoneI ? 'best' : ''}" data-zone="${i}" style="--rc:${rc(z.realm)}">
    <span class="z-ic">${ic('enemy', z.enemies[z.enemies.length - 1].name)}</span>
    <span class="z-main"><b>${z.name}</b><small>${i === bestZoneI ? `<em class="z-best">${ui('star')}Best for you</em> · ` : ''}${z.boss ? 'Boss · ' : ''}<span class="z-xph" title="Recommended Lv ${z.rec}">≈${fmt(zoneXphReal(i))} XP/h</span> · ${z.enemies.map((e) => e.name).join(' · ')}</small></span>
    <span class="z-tail"><span class="danger ${dc}">${dl}</span><span class="z-k">${ui('skull')}<b data-kills="${z.id}">${fmt(C.kills[z.id] || 0)}</b></span></span></button>`;
}
// stageHTML(): the battle arena lives in arena.js
function logHTML() { return S.combat.log.map((l) => `<div class="${l.c}">${esc(l.m)}</div>`).join('') || '<div class="sys">Nothing yet.</div>'; }

/* ------------------------------------------------------------- bank & gear */
const heroTabs = (tab) => `<nav class="seg big-seg">
  <button class="${!tab ? 'on' : ''}" data-nav="hero">${ui('bank')}<span>Bank</span></button>
  ${featureOpen('collection') ? `<button class="${tab === 'collection' ? 'on' : ''}" data-nav="hero:collection">${ui('collection')}<span>Collection</span><em>${Math.floor(collectionPct() * 100)}%</em></button>` : `<button class="locked" data-locked="collection" title="${esc(lockedNote('collection'))}">${ui('lock')}<span>Collection</span></button>`}</nav>`;
// Bank filters: one per item family (KINDS), each in its family colour.
const BAG_TABS = [['all', 'equip', 'All'], ...Object.keys(KINDS).map((k) => [k, 'k-' + k, KINDS[k].name])];
VIEWS.hero = (tab) => {
  if (tab === 'collection') return collectionHTML();
  if (S.ui.bank !== 'all' && S.ui.bank !== 'new') S.ui.bank = KIND_OF[S.ui.bank] || 'all';   // older saves filtered by type
  // Zéro mémoire: search by name, sort by rarity / quantity / newest / stack value. Locked items carry a padlock.
  const q = (S.ui.bankq || '').trim().toLowerCase(), order = Object.keys(S.items), sort = S.ui.bankSort || 'rarity';
  // NEW means new: what arrived since your last visit (kept for this visit, saved across reloads): a red dot, and a filter.
  if (!bankNew) bankNew = order.filter((k) => count(k) > 0 && !seenItems.has(k)).reverse();
  const fresh = bankNew.filter((k) => count(k) > 0), fset = new Set(fresh);
  if (S.ui.bank === 'new' && !fresh.length) S.ui.bank = 'all';
  const SORTS = { rarity: (a, b) => rarity(b) - rarity(a) || ITEMS[b].value - ITEMS[a].value, qty: (a, b) => S.items[b] - S.items[a],
    new: (a, b) => order.indexOf(b) - order.indexOf(a), value: (a, b) => ITEMS[b].value * S.items[b] - ITEMS[a].value * S.items[a] };
  const ids = order.filter((k) => count(k) > 0 && (S.ui.bank === 'all' || (S.ui.bank === 'new' ? fset.has(k) : itemKind(k) === S.ui.bank)) && (!q || ITEMS[k].name.toLowerCase().includes(q)))
    .sort(SORTS[sort] || SORTS.rarity);
  const bt = (k) => tile(k, `<span data-count="${k}">${fmt(count(k))}</span>`, { tag: 'button', cls: selItem === k ? 'on' : '', attrs: `data-sel="${k}"`, corner: (S.locked && S.locked[k] ? `<span class="lockb" title="Locked">${ui('lock')}</span>` : '') + (fset.has(k) ? '<span class="new-dot" title="New"></span>' : '') });
  const newRow = S.ui.bank === 'new' ? `<div class="bn-head"><small>New since your last visit · ${fresh.length}</small><button class="mini-btn bn-seen" data-bankseen>Mark seen</button></div>` : '';
  const tabs = [...BAG_TABS, ['new', 'star', 'New']];
  const SORTN = [['rarity', 'Rarity'], ['qty', 'Qty'], ['new', 'Newest'], ['value', 'Value']], sortI = Math.max(0, SORTN.findIndex(([k]) => k === sort));
  const det = armDetailHTML() || inspectorHTML();
  return `
  ${ptitle('Hero', 'Bank', heroTabs(tab))}
  <div class="hero-layout bank-layout fit">
    <section class="win bag-win">
      <nav class="bag-tabs">${BAG_TABS.map(([k, icn, l]) => `<button class="${S.ui.bank === k ? 'on' : ''}${KINDS[k] ? ' k-' + k : ''}" data-bankf="${k}" title="${l}">${ui(icn)}<span>${l}</span></button>`).join('')}</nav>
      <small class="bag-now">${esc((tabs.find(([k]) => k === S.ui.bank) || tabs[0])[2])} · sorted by ${SORTN[sortI][1].toLowerCase()}</small>
      <div class="bag-tools"><label class="bag-q">${ui('search')}<input id="bank-q" type="search" data-bankq placeholder="Search the bank" value="${esc(S.ui.bankq || '')}" autocomplete="off"></label>
        ${fresh.length ? `<button class="bag-newf ${S.ui.bank === 'new' ? 'on' : ''}" data-bankf="${S.ui.bank === 'new' ? 'all' : 'new'}" title="Only what is new since your last visit">New<em>${fresh.length}</em></button>` : ''}
        <nav class="bag-sort">${SORTN.map(([k, l]) => `<button class="${sort === k ? 'on' : ''}" data-banksort="${k}">${l}</button>`).join('')}</nav>
        <button class="mini-btn bag-sortc" data-banksort="${SORTN[(sortI + 1) % SORTN.length][0]}" title="Sort by ${SORTN[(sortI + 1) % SORTN.length][1].toLowerCase()}" aria-label="Change the sort">${ui('sort')}</button></div>
      ${uix('bagTop')}${newRow}<div class="bag-grid">${ids.length ? ids.map(bt).join('') : '<div class="empty-note">' + (q ? 'No item matches.' : 'Nothing here yet.') + '</div>'}</div>
    </section>
    <section class="win detail${det ? ' sheet' : ''}">${det ? sheetHandle() : ''}${det || bankSummaryHTML()}</section>${det ? '<div class="sheet-scrim" data-sheetx></div>' : ''}
  </div>`;
};
function itemHead(id, unknown) {
  const it = ITEMS[id], r = unknown ? 0 : rarity(id);
  return `<div class="dt-hero r${r}"><div class="dt-name"><small>${unknown ? 'Undiscovered' : `<span class="rar r${r}">${RARITY_NAME[r] || ''}</span> · <span class="kind-lab k-${itemKind(id)}">${ui('k-' + itemKind(id))}${KINDS[itemKind(id)].one}</span>${typeLabel(id) !== KINDS[itemKind(id)].one ? ' · ' + typeLabel(id) : ''}`}</small><h2>${unknown ? '???' : esc(it.name)}</h2>${unknown ? '' : stars(r)}${!unknown && (it.base ? ITEMS[it.base] : it).lore ? `<p class="lore dt-lore">${esc((it.base ? ITEMS[it.base] : it).lore)}</p>` : ''}</div>
    <div class="dt-art ${unknown ? 'sil' : ''}">${unknown ? silArt(itemIc(id)) : itemIc(id)}</div></div>`;
}
// The detail panel with nothing selected: what is in the bank, at a glance (click a line to open that item).
function bankSummaryHTML() {
  const ids = Object.keys(S.items).filter((k) => count(k) > 0);
  const total = ids.reduce((a, k) => a + count(k), 0), locked = ids.filter((k) => S.locked && S.locked[k]).length;
  const top = ids.slice().sort((a, b) => ITEMS[b].value * count(b) - ITEMS[a].value * count(a)).slice(0, 5);
  const worth = ids.reduce((a, k) => a + ITEMS[k].value * S.items[k], 0);
  return `<div class="bank-sum">${hdr('Bank', `${fmt(ids.length)} types · ${ui('gold')}<em class="gold-n">${fmt(worth)}</em>`)}
    <div class="bs-nums">${stat('Items', fmt(total))}${stat('Locked', fmt(locked))}</div>
    ${top.length ? `<small class="bs-lab">Most valuable stacks</small><div class="bs-top">${top.map((k) => `<button class="bs-row" data-sel="${k}">${tile(k, null, { cls: 'xs' })}<span>${esc(ITEMS[k].name)}</span><b>${ui('gold')}${fmt(ITEMS[k].value * count(k))}</b></button>`).join('')}</div>` : ''}
    <p class="muted small bs-hint">${ui('info')}Select an item for its details.</p></div>`;
}
// Phones (css/meta.css): a selected item's panel is a bottom sheet; tap outside or drag the handle down to close it.
const sheetHandle = () => '<button class="sheet-grip" data-sheetx aria-label="Close"><i></i></button>';
function sheetClose() { selItem = null; selCol = null; if (typeof selArm !== 'undefined') selArm = null; dirty = true; }
document.addEventListener('click', (ev) => { if (ev.target.closest('[data-sheetx]')) sheetClose(); });
{
  let y0 = null;
  document.addEventListener('touchstart', (ev) => { y0 = ev.target.closest('.sheet-grip') ? ev.touches[0].clientY : null; }, { passive: true });
  document.addEventListener('touchend', (ev) => { if (y0 !== null && ev.changedTouches[0].clientY - y0 > 50) sheetClose(); y0 = null; }, { passive: true });
}
function inspectorHTML() {
  if (!selItem || (!count(selItem) && !Object.values(S.equip).includes(selItem))) return '';
  const it = ITEMS[selItem], n = count(selItem), equipped = !n;
  const body = [], acts = [];
  if (it.type === 'equip') { body.push(attrList(statRows(Object.fromEntries(Object.keys(it.stats).map((k) => [k, itemStat(selItem, k)]))))); body.push(uix('inspector', selItem)); if (!equipped) acts.push(gbtn('Equip', 'check', `data-equip="${selItem}"`));}
  else if (it.type === 'food') { body.push(attrList([['hp', 'Heals in battle', foodHeal(selItem) + ' HP']])); body.push('<p class="muted">Also packs as expedition provisions.</p>'); acts.push(S.combat.food === selItem ? gbtn('Equipped as battle food', 'check', 'disabled') : gbtn('Equip as battle food', 'eat', `data-setfood="${selItem}"`)); }
  else if (it.type === 'fruit') {
    const mine = S.fruit === selItem, rk = mine ? fruitRank() : 0;
    body.push(`<p class="lore">${it.desc}</p>${mine ? attrList([['star', 'Your rank', `${rk} / ${FRUIT_RANK_MAX} · power ×${(1 + 0.25 * (rk - 1)).toFixed(2)}`]]) : ''}<p class="muted">Only one fruit at a time — eating another kind replaces it. Eat copies of yours to raise its rank (+25% power each). Fruit eaters fish 40% slower.</p>`);
    acts.push(mine ? (rk >= FRUIT_RANK_MAX ? gbtn('Max rank', 'fruit', 'disabled') : gbtn(`Eat: rank ${rk + 1}`, 'fruit', `data-eat="${selItem}"`)) : gbtn('Eat', 'fruit', `data-eat="${selItem}"`));
  }
  else if (it.type === 'scroll' && typeof scrollInspect === 'function') { const x = scrollInspect(selItem); body.push(x.body); acts.push(...x.acts); }
  else if (it.type === 'chest') {
    const tot = it.loot.reduce((a, l) => a + l[1], 0);
    body.push(`${hdr('Contents', `${fmt(it.gold[0])}–${fmt(it.gold[1])} gold + ${it.rolls > 1 ? it.rolls + ' of' : 'one of'}`)}<ul class="srcs">${it.loot.map(([id, w, q]) => `<li><span>${isFound(id) ? `<i>${itemIc(id)}</i>${esc(fruitLabel(id))}` : `<i class="sil">${silArt(itemIc(id))}</i>???`}${q[1] > 1 ? ` ×${q[0]}–${q[1]}` : ''}</span><b>${fmtRate(w / tot)}</b></li>`).join('')}</ul>`);
    acts.push(gbtn('Open 1', 'open', `data-open="${selItem}:1"`));
    if (n > 1) acts.push(gbtn(`Open all ×${fmt(Math.min(n, 1000))}`, 'open', `data-open="${selItem}:all"`));
  } else {
    const uses = [];
    for (const k in SKILLS) for (const a of SKILLS[k].actions) if (a.in && a.in[selItem]) uses.push([k, a]);
    for (const r in GATES) if (GATES[r].offer[selItem] && !S.gates[r]) uses.unshift(['gate', { name: GATES[r].name, level: '' }]);
    if (it.relic) body.push(`<p class="lore">A relic of the ${REALMS[it.relic].name}. Iconic gear from that world is forged from it.</p>`);
    if (typeof reforgeRelic === 'function' && reforgeRelic() === selItem) uses.push(['use', 'Reforge any gear (tiers 1-5)']);
    for (const [k, txt] of EXTRA_USES) if (k === selItem) uses.push(['use', txt]);
    if (uses.length) body.push(`${hdr('Used in')}<ul class="srcs">${uses.slice(0, 10).map(([k, a]) => k === 'use' ? `<li><span><i>${ui('star')}</i>${esc(a)}</span><b>System</b></li>` : k === 'gate' ? `<li><span><i>${ui('gate')}</i>${esc(a.name)}</span><b>World gate</b></li>` : `<li><span><i>${ic('skill', k)}</i>${esc(a.name)}${a.schem ? ' <em class="muted">· schematic</em>' : ''}</span><b>${SKILLS[k].name} ${a.level}</b></li>`).join('')}</ul>`);
  }
  body.push(uix('inspectorAny', selItem));
  body.push(`${hdr('Where to find')}${sourcesHTML(selItem)}`);
  return `${itemHead(selItem)}
    <div class="dt-stats">${stat('Owned', fmt(n), `data-count="${selItem}"`)}${stat('Value', fmt(it.value) + ' g')}${stat('Stack value', fmt(it.value * n) + ' g')}</div>
    ${equipped ? '' : `<div class="dt-cta">${acts.join('')}<div class="sell-row">${(() => { const lk = S.locked && S.locked[selItem], dis = lk ? 'disabled title="Locked: unlock it to sell"' : ''; return `<button class="gbtn dark sm" data-sell="${selItem}:1" ${dis}>Sell 1</button><button class="gbtn dark sm" data-sell="${selItem}:half" ${dis}>Sell half</button><button class="gbtn dark sm" data-sell="${selItem}:all" ${dis}>Sell all</button><button class="gbtn sm ${lk ? 'gold' : 'dark'} lock-btn" data-lock="${selItem}" title="${lk ? 'Unlock: it can be sold again' : 'Lock: protect it from selling'}">${ui('lock')}<span>${lk ? 'Locked' : 'Lock'}</span></button>`; })()}</div></div>`}
    <div class="dt-body">${body.join('')}</div>`;
}

/* ------------------------------------------------------------- collection log */
let selCol = null;
const COL_GROUPS = [['res', 'Materials'], ['relic', 'World relics'], ['gem', 'Gems'], ['chest', 'Treasure'], ['food', 'Food'], ['equip', 'Gear'], ['schematic', 'Schematics'], ['fruit', 'Abyss Fruits']];
const inColGroup = (k, g) => (g === 'relic' ? !!ITEMS[k].relic : g === 'res' ? ITEMS[k].type === 'res' && !ITEMS[k].relic : ITEMS[k].type === g);
// Phones (css/meta.css) show only what you found, then one "? N to find" tile per group.
const colMore = (n) => (n > 0 ? `<span class="col-more"><b>?</b> ${fmt(n)} to find</span>` : '');
// The grid is split by world (tabs): what the world gives, '' = items with no single world.
const petWorld = (pt) => (SKILLS[pt.skill] ? SKILLS[pt.skill].realm : pt.zone ? (ZONES.find((z) => z.id === pt.zone) || {}).realm : '') || '';
function collectionHTML() {
  const pctAll = collectionPct();
  const allIds = Object.keys(ITEMS).filter(colItem), wOf = (k) => itemWorld(k) || '';
  const petAll = PETS.filter(inBuildPet);
  const worlds = [...WORLD_ORDER.filter((r) => worldInBuild(r) && allIds.some((k) => wOf(k) === r)), ...(allIds.some((k) => !wOf(k)) ? [''] : [])];
  let w = S.ui.colW;
  if (!worlds.includes(w) || (w && !realmOpen(w))) w = [...worlds].reverse().find((r) => r && realmOpen(r)) || worlds[0];
  const wIds = allIds.filter((k) => wOf(k) === w), petList = petAll.filter((pt) => petWorld(pt) === (w || '') || (!w && !WORLD_ORDER.includes(petWorld(pt))));
  const tabs = worlds.map((r) => {
    const ids = allIds.filter((k) => wOf(k) === r), got = ids.filter((k) => S.found[k]).length, open = !r || realmOpen(r);
    return `<button class="${r === w ? 'on' : ''}${open ? '' : ' off'}" ${open ? `data-colw="${r || '-'}"` : 'disabled'} style="--rc:${r ? rc(r) : 'var(--dim)'}">${r ? ic('realm', r) : ui('collection')}<span>${r ? esc(REALMS[r].name) : 'Other'}</span>${open ? `<em>${got} / ${ids.length}</em>` : ''}</button>`;
  }).join('');
  const groups = COL_GROUPS.map(([type, label]) => {
    const ids = wIds.filter((k) => inColGroup(k, type));
    if (!ids.length) return '';
    const n = ids.filter((k) => S.found[k]).length;
    return `${hdr(label, `${n} / ${ids.length}`)}<div class="col-grid">${ids.map((id) => tile(id, null, { tag: 'button', unknown: !S.found[id], cls: selCol === id ? 'on' : '', attrs: `data-col="${id}"` })).join('')}${colMore(ids.length - n)}</div>`;
  }).join('');
  const petsN = petList.filter((pt) => S.pets[pt.id]).length;
  const pets = petList.length ? `${hdr('Pets', `${petsN} / ${petList.length}`)}<div class="col-grid">${petList.map((pt) => petTile(pt, { tag: 'button', cls: selCol === 'pet:' + pt.id ? 'on' : '', attrs: `data-col="pet:${pt.id}"` })).join('')}${colMore(petList.length - petsN)}</div>` : '';
  let detail = `<div class="empty-note big">${ui('collection')}<span>Select an item.</span></div>`, sheet = false;
  if (selCol && selCol.startsWith('pet:')) {
    const pt = PET_BY[selCol.slice(4)], got = S.pets[pt.id];
    sheet = true;
    detail = `<div class="dt-hero r${got ? 5 : 0}"><div class="dt-name"><small>Pet${got ? ' · in your party' : ''}</small><h2>${got ? pt.name : '???'}</h2>${got ? stars(5) : ''}</div><div class="dt-art ${got ? '' : 'sil'}">${got ? ic('pet', pt.id) : silArt(ic('pet', pt.id))}</div></div>
      <div class="dt-body">${attrList([['star', 'Bonus', petBonus(pt)]])}${hdr('Where to find')}<ul class="srcs">${petSource(pt)}</ul></div>`;
  } else if (selCol && ITEMS[selCol]) {
    const it = ITEMS[selCol], got = S.found[selCol];
    sheet = true;
    const rec = it.type === 'schematic' ? schemRecipe(selCol) : null;
    const teach = rec ? attrList([['star', 'Teaches', `${ITEMS[it.teaches].name} · ${SKILLS[rec.skill].name} Lv ${rec.act.level}`]]) : '';
    detail = `${itemHead(selCol, !got)}<div class="dt-body">${got && it.type === 'equip' ? attrList(statRows(it.stats)) : ''}${teach}${uix('colDetail', selCol)}${hdr('Where to find')}${sourcesHTML(selCol)}</div>`;
  }
  const found = Object.keys(S.found).filter(colItem).length + petAll.filter((pt) => S.pets[pt.id]).length, all = allIds.length + petAll.length;
  return `
  ${ptitle('Hero', 'Collection', heroTabs('collection'))}
  ${fitCols('col-board', `<section class="win col-win"><nav class="seg col-tabs">${tabs}</nav>${groups}${pets}</section>`,
    `<section class="win col-sum"><div class="cs-top"><b>${Math.floor(pctAll * 100)}%</b><span class="muted">${found} / ${all} discovered</span></div><span class="pbar gold"><i style="width:${pctAll * 100}%"></i></span></section>
    <section class="win detail col-detail${sheet ? ' sheet' : ''}">${sheet ? sheetHandle() : ''}${detail}</section>${sheet ? '<div class="sheet-scrim" data-sheetx></div>' : ''}
    ${uix('collectionTop')}`)}`;
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
const TRAIN_COLORS = { chakra: '#ff9a4d', haki: '#4cc3ff', reiatsu: '#a98bff', ki: '#ffc65a', cursed: '#4fe3b8', nen: '#a8e86b' };
VIEWS.power = () => {
  const E = S.energy, cap = energyCap();
  const steps = ['1', '10', '100', '10%', '25%', 'max'];
  return `
  ${ptitle('Disciplines', 'Energy', `<span class="en-chip" title="Energy placed in disciplines"><b data-euse>${fmt(cap - energyIdle())}</b> / ${fmt(cap)} in use</span>`)}
  ${fitCols('pw-board', `<section class="win energy-win">
    <div class="en-top">
      <div class="en-ctl"><label>Per click</label><div class="seg">${steps.map((s) => `<button class="${E.step === s ? 'on' : ''}" data-step="${s}"><span>${s}</span></button>`).join('')}</div>
        ${gbtn('Release all', 'close', 'data-releaseall', 'dark sm')}</div>
    </div>
    <div class="pool-bar">${TRAININGS.map((t) => `<i style="width:${((E.alloc[t.id] || 0) / cap) * 100}%;background:${TRAIN_COLORS[t.id]}" title="${t.name}"></i>`).join('')}</div>

  </section>
  <section class="win">${hdr('Gold upgrades')}
    <div class="upg">${tile(null, null, { r: 4, icon: ui('energy') })}<span class="upg-t"><b>Bigger Vessel</b><small>+25 energy capacity · now ${fmt(cap)}</small></span>${gbtn(fmt(capCost()), 'gold', `data-buycap data-cost="${capCost()}"`, 'sm')}</div>
    <div class="upg">${tile(null, null, { r: 4, icon: ui('power') })}<span class="upg-t"><b>Purer Energy</b><small>+10% training speed · now ×${energyPower().toFixed(2)}</small></span>${gbtn(fmt(powCost()), 'gold', `data-buypow data-cost="${powCost()}"`, 'sm')}</div>
  </section>`, `<div class="train-grid">${TRAININGS.map((t) => {
    if (!disciplineOpen(t)) return worldInBuild(t.world) ? `<section class="win train locked"><div class="tr-top"><span class="tr-ic">${ui('lock')}</span><span class="tr-main"><b>${t.name}</b><small>Learned in ${REALMS[t.world].name}</small></span></div></section>` : '';
    const a = E.alloc[t.id] || 0, L = tl(t.id), rate = (a * energyPower()) / trainCost(t.id, L);
    return `<section class="win train ${a ? 'active' : ''}" style="--tc:${TRAIN_COLORS[t.id]}">
      <div class="tr-top"><span class="tr-ic">${ic('training', t.id)}</span><span class="tr-main"><b>${t.name}</b><small>${REALMS[t.world].name} · per level: ${t.desc}</small></span>
        <span class="tr-lv"><small>Lv</small><b data-tl="${t.id}">${fmt(L)}</b></span></div>
      <div class="xpbar thin"><i data-tbar="${t.id}"></i></div>
      <div class="tr-ctl"><button class="mini-btn" data-alloc="${t.id}:-1" title="Take energy back">${ui('minus')}</button>
        <span class="tr-alloc"><b>${fmt(a)}</b> energy · <em>${a ? (rate >= 1 ? fmt(rate) + ' lv/s' : fmtTime(1 / rate) + ' / lv') : 'idle'}</em></span>
        <button class="mini-btn hot" data-alloc="${t.id}:1" title="Add energy">${ui('plus')}</button></div>
    </section>`;
  }).join('')}</div>`)}`;
};

/* ------------------------------------------------------------- market */
// What can still be bought comes first; finished upgrades sit in one compact row at the bottom.
const shopMaxed = (it) => shopCost(it) === undefined;
VIEWS.market = () => `
  ${ptitle('Merchant', 'Market')}
  <div class="shop fit fit-scroll">${SHOP.filter((it) => (!it.realm || realmOpen(it.realm)) && !shopMaxed(it)).map((it) => {
    const tier = S.shop[it.id] || 0, cost = shopCost(it), maxed = cost === undefined;
    const r = it.give ? 2 : it.cat === 'Charms' ? 5 : 4;
    return `<section class="win ware">${tile(it.give ? it.give[0] : null, it.give ? '×' + it.give[1] : (it.costs ? `${tier}/${it.costs.length}` : ''), { r, icon: ic('shop', it.id), title: it.name })}
      <span class="ware-t"><small>${it.cat}</small><b>${it.name}</b><small>${it.desc}</small>${it.costs ? `<span class="pips">${it.costs.map((_, i) => `<i class="${i < tier ? 'on' : ''}"></i>`).join('')}</span>` : ''}</span>
      ${gbtn(maxed ? 'Maxed' : fmt(cost), maxed ? 'check' : 'gold', `${maxed ? 'disabled' : `data-cost="${cost}"`} data-buy="${it.id}"`, 'sm')}</section>`;
  }).join('')}${(() => {
    const done = SHOP.filter((it) => (!it.realm || realmOpen(it.realm)) && shopMaxed(it));
    return done.length ? `<section class="win shop-maxed"><small>${ui('check')}Maxed</small>${done.map((it) => `<span class="sm-it" title="${esc(it.name)} · ${esc(it.desc)}">${tile(null, null, { r: it.cat === 'Charms' ? 5 : 4, icon: ic('shop', it.id), cls: 'xs' })}<b>${esc(it.name)}</b></span>`).join('')}</section>` : '';
  })()}</div>`;

/* ------------------------------------------------------------- settings */
VIEWS.settings = () => `
  ${ptitle('System', 'Settings')}
  ${fitCols('set-board', `
  <section class="win">${hdr('Help')}
    <div class="btn-row">${gbtn(S.ui.noTips ? 'Turn hints on' : 'Turn hints off', 'info', 'data-toggletips', 'dark')}${gbtn('Show page guides again', 'hero', 'data-reintro', 'dark')}</div></section>`,
  `<section class="win">${hdr('Save data', 'autosaves every 10 seconds')}
    <div class="btn-row">${gbtn('Save now', 'check', 'data-save', 'dark')}${gbtn('Export', 'log', 'data-export', 'dark')}${gbtn('Import', 'open', 'data-import', 'dark')}${gbtn('Hard reset…', 'close', 'data-wipe', 'danger')}</div>
    <textarea id="savebox" rows="5" placeholder="Paste a save here, then Import."></textarea>
    ${backupsHTML()}
  </section>
  ${isStandalone() ? '' : `<section class="win install"${installPrompt || IS_IOS ? '' : ' title="Browser menu → Install"'}>${tile(null, null, { r: 4, icon: ui('play') })}
    <span class="upg-t"><b>Install the game</b><small>${IS_IOS && !installPrompt ? 'Share → Add to Home Screen.' : 'Full screen, works offline.'}</small></span>
    ${installPrompt ? gbtn('Install', 'check', 'data-install') : ''}</section>`}`)}`;
// The last hourly copies (and the copies taken before an import, a restore or a reset).
function backupsHTML() {
  const b = saveBackups();
  if (!b.length) return '<p class="muted small">A backup is made every hour.</p>';
  const why = { auto: 'hourly copy', 'before import': 'before an import', 'before restore': 'before a restore', 'before reset': 'before a reset' };
  return `<div class="bak-list"><small class="muted">Backups</small>${b.map((x, i) => `<div class="bak-row"><span>${esc(new Date(x.t).toLocaleString())} <em class="muted">· ${esc(why[x.why] || x.why)}</em></span>${gbtn('Restore', 'open', `data-restore="${i}"`, 'dark sm')}</div>`).join('')}</div>`;
}

/* =============================================================== activity bar + objective */
function nowHTML() {
  const gs = goalState();
  const claim = gs && gs.done ? gbtn('Claim', 'check', 'data-claim', 'sm glow nb-claim') : '';
  if (S.action) {
    const skill = S.action.skill, s = SKILLS[skill], a = findAction(skill, S.action.id), f = farmRates(skill, a);
    return `<div class="nb" style="--rc:${rc(s.realm)}">
      <button class="nb-main" data-nav="${skillView(skill)}" title="Go to ${s.name}">${tile(null, null, { r: actRarity(a), icon: actIc(skill, a), mark: actMark(a), cls: 'xs', title: a.name })}
        <span class="nb-txt"><small>${s.name} · Lv <em data-lv="${skill}">${skillLv(skill)}</em></small><b>${esc(a.name)}</b></span></button>
      <span class="nb-prog"><span class="pbar"><i data-nowfill></i></span>
        <span class="nb-stats">${a.out ? `<span><b>${fmt(f.itemsh)}</b>/h</span>` : ''}<span><b>${fmt(f.xph)}</b> xp/h</span><span>Lv up <b data-nextlv>—</b></span>${a.in ? `<span>Left <b data-canmake>${fmt(f.can)}</b></span>` : ''}</span></span>
      ${claim}${uix('nowbar')}${journalBtn()}<button class="mini-btn hot" data-stop title="Stop">${ui('stop')}</button></div>`;
  }
  if (S.combat.zone != null) {
    const c = combatRates();
    return `<div class="nb" style="--rc:${rc('combat')}">
      <button class="nb-main" data-nav="battle" title="Go to battle">${tile(null, null, { r: c.z.boss ? 5 : 3, icon: ic('zone', c.z.id), cls: 'xs', title: c.z.name })}
        <span class="nb-txt"><small>Fighting</small><b>${c.z.name}</b></span></button>
      <span class="nb-prog"><span class="pbar hp"><i data-nowhp></i></span>
        <span class="nb-stats"><span>HP <b data-hpnow></b></span><span><b>≈${fmt(c.kph)}</b> kills/h</span><span><b>≈${fmt(c.xph)}</b> xp/h</span></span></span>
      ${claim}${uix('nowbar')}${journalBtn()}<button class="mini-btn hot" data-stopcombat title="Retreat">${ui('stop')}</button></div>`;
  }
  // Idle: offer the last activity back. The objective lives in the sidebar; only phones (no sidebar) see it here.
  const re = resumeInfo();
  return `<div class="nb idle">${ui('sleep')}<span class="nb-txt"><small>Idle</small><b>${re ? 'Last: ' + esc(re.name) : 'Nothing running'}</b></span>
    ${re ? gbtn('Resume', 'play', re.attr, 'sm go nb-resume') : ''}${claim || (gs && !re && S.ui.view !== 'home' ? `<button class="nb-goal nb-next" data-nav="${gs.g.go}"><span><small>Next goal</small><b>${gs.g.text}</b></span><i>${ui('play')}</i></button>` : '')}${uix('nowbar')}${journalBtn()}</div>`;
}
// The activity bar steps aside on the page of what it shows: that page has its own Stop (one Stop on screen).
function nowOwnPage() {
  const v = S.ui.view;
  return S.action ? v === skillView(S.action.skill) : S.combat.zone != null && v === 'battle';
}
// The last thing that ran (kept in S.ui.last by update()), if it can run again.
function resumeInfo() {
  const L = S.ui.last;
  if (!L) return null;
  if (L[0] === 'z') { const z = ZONES[L[1]]; return z && zoneUnlocked(L[1]) ? { name: z.name, attr: `data-zone="${L[1]}"` } : null; }
  const a = SKILLS[L[1]] && findAction(L[1], L[2]);
  if (!a || !skillOpen(L[1])) return null;
  const st = actState(L[1], a);
  return st === 'locked' || st === 'missing' ? null : { name: a.name, attr: `data-act="${L[1]}:${L[2]}"` };
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
  nb.classList.toggle('here', nowOwnPage());
  const st = goalState();
  lastGoalDone = st ? st.done : null;
  for (const q of $$('#navquest, .quest-win')) q.innerHTML = goalHTML();
}

/* =============================================================== Le Fil: the one notification column */
// Every notice goes here: loot counts up on one row per item (+1, +2… +14), new items get the NEW tag on that
// same row, messages (level-ups, unlocks, warnings) take their own row. Rows fade; the Journal keeps them all.
// 4-5★ drops still open the reveal (reveal.js). Settings → Notifications filters what reaches the screen.
const feedRows = [];
const JOURNAL = [];
function journalAdd(icon, text, n, cls) {
  const last = JOURNAL[0];
  if (last && last.text === text && last.cls === (cls || '') && Date.now() - last.t < 60000) { last.n += n || 0; last.t = Date.now(); return; }
  JOURNAL.unshift({ t: Date.now(), icon, text, n: n || 0, cls: cls || '' });
  if (JOURNAL.length > 120) JOURNAL.length = 120;
}
const FEED_MAX = () => (matchMedia('(max-width: 860px)').matches ? 2 : 3);
// Rows fade on their own: a drop that keeps coming bumps its row, but a row never stays past FEED_LIFE.
const FEED_LIFE = 6000, FEED_IDLE = 3500;
const feedLeft = (f) => Math.max(600, Math.min(FEED_IDLE, FEED_LIFE - (Date.now() - f.born)));
const fedAt = {};   // item name -> last time it reached the feed (the Collection message checks it)
// Settings → Notifications: 'all' (default), 'new' (new items, rare and messages), 'rare' (rare and warnings only).
function feedShows(kind, r) {
  const lv = (S.ui.set && S.ui.set.notif) || 'all';
  if (lv === 'all') return true;
  if (kind === 'loot') return lv === 'new' ? r >= 4 : r >= 5;
  if (kind === 'new') return lv === 'new' || r >= 4;
  if (kind === 'msg') return true;
  return true;
}
function feedTrim() {
  const max = FEED_MAX();
  while (feedRows.length > max) {
    // gold makes way first, then the oldest row
    const gi = feedRows.findIndex((x) => x.cls === 'g');
    const o = feedRows.splice(gi >= 0 && gi < feedRows.length - 1 ? gi : 0, 1)[0];
    clearTimeout(o.t); o.el.remove();
  }
}
function feedAdd(icon, name, n, cls, r) {
  const box = $('#feed');
  let f = feedRows.find((x) => x.name === name && x.cls === (cls || ''));
  if (f) {
    f.n += n;
    $('b', f.el).textContent = (f.n > 0 ? '+' : '') + fmt(f.n);
    retrigger(f.el, 'bump');
    clearTimeout(f.t);
    feedRows.splice(feedRows.indexOf(f), 1); feedRows.push(f); box.appendChild(f.el);
  } else {
    const el = document.createElement('div');
    el.className = `ob-row r${r || 1} ${cls || ''}`;
    el.innerHTML = `<span class="ob-ic">${icon}</span><span class="ob-name">${esc(name)}</span><b>${n > 0 ? '+' : ''}${fmt(n)}</b>`;
    box.appendChild(el);
    f = { name, cls: cls || '', n, el, icon, born: Date.now() };
    feedRows.push(f);
    feedTrim();
  }
  f.t = setTimeout(() => feedDrop(f), feedLeft(f));
  return f;
}
function feedDrop(f) {
  f.el.classList.add('out'); setTimeout(() => f.el.remove(), 400);
  const i = feedRows.indexOf(f); if (i >= 0) feedRows.splice(i, 1);
}
// A message row (what used to be a toast). Same text twice in a row counts up instead of stacking.
function feedMsg(msg, cls, nav) {
  journalAdd(ui(TOAST_IC[cls] || 'info'), msg, 0, 'msg ' + (cls || ''));
  const box = $('#feed');
  let f = feedRows.find((x) => x.msg === msg);
  if (f) { f.k++; $('b', f.el).textContent = '×' + f.k; retrigger(f.el, 'bump'); clearTimeout(f.t); }
  else {
    const el = document.createElement('div');
    el.className = `ob-row msg ${cls || ''}`;
    el.innerHTML = `<span class="ob-ic">${ui(TOAST_IC[cls] || 'info')}</span><span class="ob-name"></span><b></b>`;
    el.querySelector('.ob-name').textContent = msg;
    if (nav) { el.dataset.nav = nav; el.classList.add('go'); }
    box.appendChild(el);
    f = { msg, k: 1, el, name: null, cls: 'msg', born: Date.now() };
    feedRows.push(f);
    feedTrim();
  }
  f.t = setTimeout(() => feedDrop(f), cls === 'bad' || cls === 'rare' ? 5000 : feedLeft(f));
}
const freshItems = new Set();
const feedItem = (id, n) => {
  const r = rarity(id), fresh = freshItems.has(id);
  journalAdd(itemIc(id), ITEMS[id].name, n, fresh ? 'new' : '');
  fedAt[ITEMS[id].name] = Date.now();
  if (!feedShows(fresh ? 'new' : 'loot', r)) return;
  const f = feedAdd(itemIc(id), ITEMS[id].name, n, '', r);
  if (f && freshItems.delete(id)) retrigger(f.el, 'fresh');
};
const feedGold = (n, label) => { journalAdd(ui('gold'), label || 'Gold', n, 'g'); if (feedShows('loot', 1)) feedAdd(ui('gold'), label || 'Gold', n, 'g', 3); };
const journalBtn = () => `<button class="mini-btn nb-journal" data-journal>${ui('log')}<span class="nb-lbl">Journal</span></button>`;
function journalHTML() {
  const ago = (t) => { const m = Math.floor((Date.now() - t) / 60000); return m < 1 ? 'now' : m < 60 ? m + ' min' : Math.floor(m / 60) + ' h'; };
  const rows = JOURNAL.map((j) => `<div class="jr-row ${j.cls}"><span class="jr-ic">${j.icon}</span><span class="jr-t">${j.cls.includes('new') ? '<em class="jr-new">New</em>' : ''}${esc(j.text)}</span>${j.n ? `<b>${j.n > 0 ? '+' : ''}${fmt(j.n)}</b>` : '<b></b>'}<time>${ago(j.t)}</time></div>`).join('');
  return `<div class="journal"><h2>Journal</h2><p class="muted small">This session: loot, new finds and messages, newest first.</p><div class="jr-list">${rows || '<div class="empty-note">Nothing yet.</div>'}</div></div>`;
}

/* =============================================================== FX */
let floatCount = 0;
function floatAt(el, html, cls, dx, dy, delay, still) {
  if (!el || floatCount > 24) return null;
  const r = el.getBoundingClientRect();
  if (!r.width || r.bottom < 0 || r.top > innerHeight) return;
  const f = document.createElement('div');
  f.className = 'float ' + (cls || '');
  f.innerHTML = html;
  f.style.left = r.left + r.width / 2 + (dx || 0) + (still ? 0 : Math.random() * 30 - 15) + 'px';
  f.style.top = r.top + r.height * 0.35 + (dy || 0) + 'px';
  if (delay) f.style.animationDelay = delay + 'ms';
  $('#fx').appendChild(f);
  floatCount++;
  setTimeout(() => { f.remove(); floatCount--; }, 1100 + (delay || 0));
  return f;
}
function retrigger(el, cls) { if (!el) return; el.classList.remove(cls); void el.offsetWidth; el.classList.add(cls); }
let burstBusy = false;
const burstQueue = [];
function bannerBurst(title, sub, icon, color, kind) {
  if (burstBusy) { if (burstQueue.length < 3) burstQueue.push([title, sub, icon, color, kind]); return; }
  burstBusy = true;
  const b = document.createElement('div');
  b.className = 'burst' + (kind ? ' ' + kind : '');
  b.style.setProperty('--rc', color || 'var(--gold)');
  b.innerHTML = `<div class="burst-band"><div class="burst-ic">${icon || ''}</div><div class="burst-txt"><div class="burst-title">${esc(title)}</div><div class="burst-sub">${esc(sub)}</div></div></div>`;
  document.body.appendChild(b);
  setTimeout(() => { b.remove(); burstBusy = false; if (burstQueue.length) bannerBurst(...burstQueue.shift()); }, 2100);
}
function burst(title, sub, icon, color, kind) { return bannerBurst(title, sub, icon, color, kind); }
{
  const route = () => {
    const star = burst;
    if (star.length === 3 && star !== bannerBurst) burst = function (a, b, c, d, e) { return Array.isArray(a) ? star(a, b, c) : bannerBurst(a, b, c, d, e); };
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', route); else setTimeout(route, 0);
}
function flash() { const f = document.createElement('div'); f.className = 'flash'; document.body.appendChild(f); setTimeout(() => f.remove(), 500); }
function inBattleView() { return S.ui.view === 'battle'; }
// One float per action, one line per gain then the XP. Results of the same frame add up (catch-up, a tab
// coming back), and a new action replaces the float still rising, so numbers never pile up.
let actBatch = null, actFloatEl = null;
function actFloat(anchor, d) {
  if (!anchor) return;
  if (!actBatch || actBatch.anchor !== anchor) {
    const B = (actBatch = { anchor, gains: {}, gold: 0, xp: 0, dbl: false });
    requestAnimationFrame(() => {
      if (actBatch === B) actBatch = null;
      if (!B.anchor.isConnected) return;
      const ids = Object.keys(B.gains);
      const lines = ids.map((id, i) => `<span class="fl-l gain r${rarity(id)}">+${fmt(B.gains[id])}${itemIc(id)}${i === 0 && B.dbl ? '<em>×2</em>' : ''}</span>`);
      if (B.gold) lines.push(`<span class="fl-l gold">+${fmt(B.gold)}${ui('gold')}</span>`);
      if (B.xp) lines.push(`<span class="fl-l xp">+${fmt(B.xp)} XP</span>`);
      if (!lines.length) return;
      if (actFloatEl && actFloatEl.isConnected) actFloatEl.remove();
      actFloatEl = floatAt(B.anchor, lines.join(''), 'act', 0, 0, 0, true);
    });
  }
  for (const id in d.gains) actBatch.gains[id] = (actBatch.gains[id] || 0) + d.gains[id];
  actBatch.gold += d.gold || 0;
  actBatch.xp += d.xp || 0;
  actBatch.dbl = actBatch.dbl || !!d.double;
}

on('action', (d) => {
  const card = $(`[data-card="${d.skill}:${d.act.id}"]`);
  // The numbers rise from the item being made or gathered: the focus panel's big icon, else its card, else the activity bar.
  const anchor = $(`[data-focus="${d.skill}"] .fo-tile`) || (card ? $('.tile', card) : $('#nowbar .tile'));
  const fast = actionTime(d.skill, d.act) < 0.8;
  if (!fast) { actFloat(anchor, d); retrigger(card, 'pop'); }
  for (const id in d.gains) feedItem(id, d.gains[id]);
  if (d.gold) feedGold(d.gold);
});
on('levelup', (d) => {
  const s = SKILLS[d.skill];
  burst('Level up', `${s.name} · Lv ${d.level - 1} → ${d.level}`, ic('skill', d.skill), rc(s.realm), 'lvup');
  setTimeout(() => { for (const el of $$(`[data-xpring="${d.skill}"]`)) retrigger(el, 'lvpop'); }, 60);
  const unlocked = s.actions.find((a) => a.level === d.level);
  if (unlocked) toast(`New in ${s.name}: ${unlocked.name}${unlocked.schem && !S.known[unlocked.schem] ? ' (needs its schematic)' : ''}`, 'good');
  if (MILESTONES.some((m) => m.lv === d.level) && s.realm !== 'combat') toast(`${s.name} milestone reached: ${MILESTONES.find((m) => m.lv === d.level).name}`, 'rare');
  const pk = (SKILL_PERKS[d.skill] || []).find((p) => p.lv === d.level);
  if (pk && !SIM) bannerBurst('New perk', `${s.name} · ${pk.name}: ${pk.desc}`, ic('skill', d.skill), rc(s.realm), 'lvup');
  dirty = true;
});
on('hit', (d) => {
  if (!inBattleView()) return;
  const el = $(`[data-portrait="${d.target}"]`);
  if (!el) return;
  if (d.dodge) { floatAt(el, d.target === 'enemy' ? 'Evaded' : 'Dodge', 'miss'); return; }
  if (d.dot) { floatAt(el, '-' + fmt(d.dmg), 'hurt dot st-' + d.dot, 20, 10); return; }
  if (d.target === 'enemy') {
    if (d.blocked && !d.label && d.dmg === d.blocked) { floatAt(el, `<small>Shield</small>${fmt(d.dmg)}`, 'dmg blocked'); return; }
    const tag = d.elem === 'weak' ? '<small class="weak">Weak!</small>' : d.elem === 'resist' ? '<small class="resist">Resisted</small>' : '';
    floatAt(el, tag + (d.label ? `<small>${esc(d.label)}</small>` : d.crit ? '<small>Crit</small>' : '') + fmt(d.dmg), (d.crit || d.label ? 'dmg crit' : 'dmg') + (d.elem ? ' ' + d.elem : ''));
  } else floatAt(el, '-' + fmt(d.dmg), 'hurt');
  retrigger(el.closest('.fighter'), 'shake');
});
on('eat', (d) => { if (inBattleView()) floatAt($('[data-portrait="player"]'), `+${fmt(d.heal)}${ui('hp')}`, 'heal', 0, -20); });
on('kill', (d) => {
  for (const id in d.loot) feedItem(id, d.loot[id]);
  feedGold(d.gold);
  if (inBattleView()) {
    const eh = $('[data-ehp]');
    if (eh) { eh.style.width = '0%'; setText($('[data-ehptext]'), `0 / ${fmt(d.enemy.hp)}`); }
    const f = $('.fighter.enemy');
    if (f) { const s = document.createElement('div'); s.className = 'ko'; s.textContent = 'Defeated'; f.appendChild(s); floatAt($('[data-portrait="enemy"]', f), `+${fmt(d.gold)}${ui('gold')}`, 'gold', 0, 30); }
  }
  const unlocked = ZONES.filter((z, i) => !z.dungeon && zoneUnlocked(i)).length;
  if (unlocked > lastUnlocked) {
    lastUnlocked = unlocked;
    const z = ZONES[unlocked - 1];
    toast(`New stage open: ${z.name}`, 'rare');
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
  journalAdd(itemIc(d.id), `Rare find: ${it.name} (${d.source})`, 0, 'msg rare');   // its own feed row + the reveal already say it
  if (!(typeof dropReveal === 'function' && dropReveal(d.id, d.source)) && rarity(d.id) >= 5) burst('Rare drop', it.name, itemIc(d.id), 'var(--gold)');
  sideDirty = true;
});
on('pet', (pet) => {
  burst('New companion', `${pet.name} · ${petBonus(pet)}`, ic('pet', pet.id), 'var(--gold)');
  toast(`${pet.name} joined you! ${petBonus(pet)}.`, 'rare');
});
on('newitem', (id) => {
  freshItems.add(id);
  setTimeout(() => freshItems.delete(id), 1500);
  if (!featureOpen('collection') || ITEMS[id].variant) return;   // beginners: no Collection menu yet · variants have their own log
  // Le Fil: the item's own row already carries the NEW tag; only a find with no row gets a message.
  // Several finds at once share one row that counts up ("New in your Collection +3"); the Journal keeps each name.
  setTimeout(() => {
    if (rareThisTick.has(id) || Date.now() - (fedAt[ITEMS[id].name] || 0) < 1500) return;
    journalAdd(ui('check'), `New in your Collection: ${ITEMS[id].name}`, 0, 'msg good');
    if (feedShows('msg')) feedAdd(ui('collection'), 'New in your Collection', 1, 'msg good col', 3);
  }, 0);
});
on('schematic', (id) => {
  const rec = schemRecipe(id), it = ITEMS[ITEMS[id].teaches];
  burst('Schematic learned', `${it.name} · ${SKILLS[rec.skill].name} Lv ${rec.act.level}`, itemIc(id), 'var(--gold)');
  toast(`You can now craft the ${it.name} in ${SKILLS[rec.skill].name} (Lv ${rec.act.level}).`, 'rare');
  dirty = true;
});
on('renown', (d) => {
  if (d.level % 25 === 0) burst('Ascension unlocked', `${REALMS[d.realm].name} · ${ASC[d.level / 25].name} stages`, ic('realm', d.realm), rc(d.realm));
  else if (d.level % 10 === 0) toast(`${REALMS[d.realm].name} Renown ${d.level}: +3% speed, damage and defense there.`, 'rare');
});
on('goal', (g) => {
  for (const f of feedRows.filter((x) => x.msg && x.msg.startsWith('Objective complete:'))) { clearTimeout(f.t); feedDrop(f); }
  toast(`Done: ${g.text} · +${fmt(g.reward)} gold`, 'good');
});

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
    const key = navKeyOf(u.id);
    if (key) { S.ui.fresh = S.ui.fresh || {}; S.ui.fresh[key] = 1; sideDirty = true; }
    if (kind === 'realm' || (kind === 'skill' && realms.includes(SKILLS[ref].realm))) continue;
    const menu = kind === 'feature' && key && menuLabel(key);
    if (kind === 'skill') feedMsg(`New skill: ${u.name}`, 'rare', key);
    else if (menu) feedMsg(`New in the menu: ${menu}`, 'rare', key);
    else feedMsg(`New: ${u.name}${u.at ? ' · ' + u.at[0] : ''}`, 'rare', u.at && u.at[1]);
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
    ${ks.length ? `<ul class="wl-points">${ks.map((k) => `<li><i>${ic('skill', k)}</i><span><b>${SKILLS[k].name}.</b> ${SKILLS[k].desc}</span></li>`).join('')}</ul>` : '<p class="muted">A final stage waits at the end of Combat.</p>'}
    ${r !== 'rift' && skillsOf(r).length > ks.length ? `<p class="muted small">${skillsOf(r).length - ks.length} more skill${skillsOf(r).length - ks.length > 1 ? 's' : ''} hide in this world. Explore to find them.</p>` : ''}
    <p class="muted small">New enemies, relics and schematics wait in Combat.</p>
    ${links.length ? `<div class="ro-syn"><small>New synergies</small>${links.map((s) => `<span>${ic('skill', s.from)}<b>${s.name}</b><em>${SKILLS[s.from].name} → ${synTargetName(s)}</em></span>`).join('')}</div>` : ''}
    <div class="wl-cta">${gbtn(ks.length ? 'Go to ' + SKILLS[ks[0]].name : 'To Combat', 'play', `data-realmgo="${go}"`)}${gbtn('Later', '', 'data-closemodal', 'dark')}</div>
  </div>`, null, true);
}

/* =============================================================== render + update */
// Full-screen world scene behind the whole UI; rebuilt only when the world changes.
function setBackdrop(kind) {
  const el = $('#backdrop');
  if (!el || el.dataset.kind === kind || typeof sceneHTML !== 'function') return;
  el.dataset.kind = kind;
  el.innerHTML = `<div class="bd-scene">${sceneHTML(kind, 'full')}${particlesHTML(kind)}</div>`;
}
let lastUnlocked = 0, sideDirty = false, bankSig = '', lastLogVer = -1, lastFoodSig = '';
function render() {
  dirty = false; sideDirty = false;
  normalizeView();
  renderRail();
  document.body.style.setProperty('--rc', viewAccent());
  const [name, a1, a2] = S.ui.view.split(':');
  setBackdrop(name === 'realm' ? a1 : name === 'battle' ? 'battle' : 'hub');
  const main = $('#main');
  const scroll = main.scrollTop;
  const box = $('#savebox'), boxVal = box ? box.value : null;
  // A focused text field (e.g. the workshop search) keeps its focus and caret across redraws.
  const fe = document.activeElement, foc = fe && fe.id && fe.tagName === 'INPUT' && main.contains(fe) ? [fe.id, fe.selectionStart, fe.selectionEnd] : null;
  main.classList.toggle('static', !viewChanged);
  main.dataset.view = name;
  main.innerHTML = VIEWS[name](a1, a2);
  main.scrollTop = scroll;
  // a link that names a section ('battle#gs-dungeons'): bring it into view once
  if (navAnchor) { const el = document.getElementById(navAnchor); navAnchor = null; if (el) { showPaneOf(el); el.scrollIntoView({ block: 'nearest' }); } }
  if (foc && $('#' + foc[0])) { const el = $('#' + foc[0]); el.focus({ preventScroll: true }); try { el.setSelectionRange(foc[1], foc[2]); } catch (e) { /* not a text field */ } }
  if (boxVal !== null && $('#savebox')) $('#savebox').value = boxVal;
  if (name === 'hero') { bankSig = Object.keys(S.items).join(','); setTimeout(() => { Object.keys(S.items).forEach((k) => seenItems.add(k)); bankSeenSave(); }, 0); }
  else bankNew = null;
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

  // levels / xp
  for (const el of $$('[data-lv]')) setText(el, String(skillLv(el.dataset.lv)));
  for (const el of $$('[data-xpbar]')) el.style.width = xpInfo(el.dataset.xpbar).p * 100 + '%';
  for (const el of $$('[data-xpring]')) el.style.setProperty('--p', xpInfo(el.dataset.xpring).p);
  const ringP = S.action ? S.action.prog / actionTime(S.action.skill, findAction(S.action.skill, S.action.id)) : S.combat.zone != null ? S.combat.hp / pMaxHp() : 0;
  for (const el of $$('[data-nowring]')) el.style.setProperty('--p', Math.min(1, ringP));
  for (const el of $$('[data-xptext]')) { const h = xpText(xpInfo(el.dataset.xptext)); if (el.innerHTML !== h) el.innerHTML = h; }
  for (const el of $$('[data-count]')) setText(el, fmt(count(el.dataset.count)));
  for (const el of $$('[data-have]')) {
    setText(el, fmt(stock(el.dataset.have)));
    const t = el.closest('.tile'); if (t) t.classList.toggle('short', stock(el.dataset.have) < +el.dataset.n);
  }

  // action cards
  for (const card of $$('[data-card]')) {
    const [s, id] = card.dataset.card.split(':');
    const a = findAction(s, id), st = actState(s, a);
    if (card.dataset.state !== st) {
      if (['locked', 'schem'].includes(card.dataset.state) || ['locked', 'schem'].includes(st)) { dirty = true; continue; }
      card.dataset.state = st;
      const c = $('[data-cta2]', card); if (c) c.innerHTML = ctaLabel(s, a, st);
    }
    const fill = $('[data-cardfill]', card);
    if (fill) fill.style.width = st === 'active' ? Math.min(100, (S.action.prog / actionTime(s, a)) * 100) + '%' : '0%';
  }
  for (const el of $$('[data-mlv]')) { const [s2, id] = el.dataset.mlv.split(':'); setText(el, String(masteryLv(s2, id))); }
  for (const el of $$('[data-mfill]')) { const [s2, id] = el.dataset.mfill.split(':'); el.style.width = masteryProg(s2, id).p * 100 + '%'; }

  // activity bar + farm panel
  if (S.action) S.ui.last = ['a', S.action.skill, S.action.id];
  else if (S.combat.zone != null) S.ui.last = ['z', S.combat.zone];
  if (S.action) {
    const a = findAction(S.action.skill, S.action.id), T = actionTime(S.action.skill, a), b = xpInfo(S.action.skill);
    for (const el of $$('[data-nowfill]')) el.style.width = Math.min(100, (S.action.prog / T) * 100) + '%';
    for (const el of $$('[data-nowtime]')) setText(el, `${Math.max(0, T - S.action.prog).toFixed(1)}s`);
    const nl = b.need ? fmtTime((b.need / (a.xp * skillXpMult(S.action.skill) * earlyXp(S.action.skill))) * T) : 'MAX';
    for (const el of $$('[data-nextlv]')) setText(el, nl);
    if (a.in) {
      const can = Math.min(...Object.entries(a.in).map(([k, n]) => Math.floor(stock(k) / n)));
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
  setText($('[data-euse]'), fmt(energyCap() - energyIdle()));

  // bank: new item types appeared
  if (S.ui.view === 'hero' && Object.keys(S.items).join(',') !== bankSig) dirty = true;

  // gold-priced buttons
  for (const el of $$('[data-cost]')) el.disabled = S.gold < +el.dataset.cost;
  for (const el of $$('[data-gate]')) { const ok = gateState(el.dataset.gate).ready; if (el.disabled === ok) dirty = true; }

  for (const f of UPD) f();
  updateCoach();
}
// Per-frame updaters registered by ui-systems.js.
const UPD = [];

/* =============================================================== input */
document.addEventListener('click', (ev) => {
  const t = ev.target.closest('button, [data-nav]');
  if (!t) { if (ev.target.id === 'scrim') document.body.classList.remove('menu-open'); return; }
  if (t.disabled) return;
  const d = t.dataset;
  if ('menu' in d) { document.body.classList.toggle('menu-open'); updateCoach(true); }
  else if (d.locked) { retrigger(t, 'shake'); toast(lockedNote(d.locked)); }
  else if ('skiptips' in d) { S.ui.noTips = 1; clearCoach(); toast('Tips turned off. Turn them back on anytime in Settings.', 'good'); dirty = true; }
  else if ('toggletips' in d) { S.ui.noTips = S.ui.noTips ? 0 : 1; S.ui.hintOff = {}; if (S.ui.noTips) clearCoach(); dirty = true; }
  else if ('reintro' in d) { S.ui.guideSeen = {}; S.ui.hintOff = {}; toast('Each page shows its guide again on your next visit.', 'good'); dirty = true; }
  else if ('journal' in d) openModal(journalHTML(), 'Close');
  else if (d.nav) { const [v, anchor] = d.nav.split('#'); setView(v); navAnchor = anchor || null; }
  else if (d.act) {
    const [s, id, n] = d.act.split(':');
    const st = actState(s, findAction(s, id));
    if (st === 'locked' || st === 'missing') { retrigger(t, 'shake'); if (st === 'missing') toast('Missing materials — gather them first.', 'bad'); return; }
    startAction(s, id, +n || 0);
  }
  else if ('stop' in d) stopAction();
  else if (d.zone !== undefined) startCombat(+d.zone);
  else if (d.asc) { const [r, t] = d.asc.split(':'); setAsc(r, +t); }
  else if ('stopcombat' in d) stopCombat();
  else if (d.sel) { selItem = d.sel; dirty = true; }
  else if (t.hasAttribute('data-bankseen')) { bankNew = []; dirty = true; }
  else if (d.bankf) { S.ui.bank = d.bankf; dirty = true; }
  else if (d.railfold) { const r = d.railfold; S.ui.railOpen = S.ui.railOpen || {}; S.ui.railOpen[r] = t.getAttribute('aria-expanded') === 'true' ? 0 : 1; renderRail(); update(); }
  else if (d.banksort) { S.ui.bankSort = d.banksort; dirty = true; }
  else if (d.lock) { S.locked = S.locked || {}; if (S.locked[d.lock]) delete S.locked[d.lock]; else S.locked[d.lock] = 1; toast(S.locked[d.lock] ? `${ITEMS[d.lock].name} is locked: it cannot be sold.` : `${ITEMS[d.lock].name} unlocked.`, 'good'); dirty = true; }
  else if (d.getq) { const [skill, id, n, cs, cid] = d.getq.split(':'); queueFirst(skill, id, +n, cs, cid); }
  else if (d.equip) { equip(d.equip); toast(`Equipped ${ITEMS[d.equip].name}`, 'good'); }
  else if (d.unequip) unequip(d.unequip);
  else if (d.eat) { if (!S.fruit || S.fruit === d.eat || confirm(`Replace your ${ITEMS[S.fruit].name}? Its power will be lost.`)) { eatFruit(d.eat); burst('Power awakened', ITEMS[d.eat].desc, itemIc(d.eat), 'var(--gold)'); } }
  else if ('unfood' in d) { S.combat.food = null; dirty = true; }
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
  else if ('claim' in d) { claimGoal(); lastUnlockPoll = 0; pollUnlocks(); }
  else if (d.gate) { if (openGate(d.gate)) { flash(); lastUnlockPoll = 0; pollUnlocks(); } }
  else if (d.realmgo) { $('#modal').classList.remove('show', 'nofoot'); setView(d.realmgo); }
  else if ('closemodal' in d) { $('#modal').classList.remove('show', 'nofoot'); updateCoach(true); }
  else if (d.open) {
    const [id, q] = d.open.split(':');
    const n = q === 'all' ? count(id) : 1;
    // chest-fx.js plays the opening (falls back to the plain loot window while simulating)
    const res = typeof chestOpenFx === 'function' ? chestOpenFx(id, n) : openChest(id, n);
    if (res) {
      if (typeof chestOpenFx !== 'function') showLoot(`Opened ${res.n} × ${ITEMS[id].name}`, res);
      if (!count(id)) selItem = null;
    }
  }
  else if (d.col) { selCol = d.col; dirty = true; }
  else if (d.colw) { S.ui.colW = d.colw === '-' ? '' : d.colw; dirty = true; }
  else if ('install' in d && installPrompt) { installPrompt.prompt(); installPrompt.userChoice.finally(() => { installPrompt = null; dirty = true; }); }
  else if ('save' in d) { saveGame(); toast('Game saved.', 'good'); }
  else if ('export' in d) { const b = $('#savebox'); b.value = btoa(unescape(encodeURIComponent(serialize()))); b.select(); toast('Save exported — copy the text.', 'good'); }
  else if ('import' in d) {
    const txt = $('#savebox').value.trim();
    if (!txt) toast('Paste a save in the box first.', 'bad');
    else if (txt.length > 4e6) toast('That text is far too long to be a save.', 'bad');
    else if (confirm('Replace your current progress with this save? Your current save is kept as a backup (Settings → Save data).')) {
      const before = serialize();
      try { loadFrom(decodeURIComponent(escape(atob(txt)))); pushBackup(before, 'before import'); saveGame(); toast('Save imported!', 'good'); dirty = true; }
      catch (e) { toast('That save data is not valid' + (e && /older version/.test(e.message) ? ': it comes from an older version of the game.' : '.'), 'bad'); }
    }
  }
  else if ('restore' in d) {
    const b = saveBackups()[+d.restore];
    if (b && confirm(`Go back to the save from ${new Date(b.t).toLocaleString()}? Your current progress is kept as a backup.`)) {
      const before = serialize();
      try { loadFrom(b.save); pushBackup(before, 'before restore'); saveGame(); toast('Backup restored.', 'good'); setView('home'); }
      catch (e) { toast('That backup cannot be read.', 'bad'); }
    }
  }
  else if ('wipe' in d) { if (confirm('Erase ALL progress? Your current save is kept as a backup (Settings → Save data).')) { pushBackup(serialize(), 'before reset'); S = defaultState(); checkUnlocks(); S.combat.hp = pMaxHp(); saveGame(); setView('home'); } }
});
document.addEventListener('change', (ev) => {
  if (ev.target.matches('[data-food]')) { S.combat.food = ev.target.value || null; ev.target.blur(); dirty = true; }
});
document.addEventListener('input', (ev) => { if (ev.target.matches('[data-bankq]')) { S.ui.bankq = ev.target.value; dirty = true; } });
// Zéro mémoire: put the gathering a recipe lacks at the head of the Task Queue, with the recipe right after it.
function queueFirst(skill, id, n, cs, cid) {
  if (typeof postMission !== 'function' || !msOn()) return;
  const craft = cs && cid;
  if (!postMission({ k: 'act', skill, id, n }, 0)) return;
  if (craft && msFree() > 0) postMission({ k: 'act', skill: cs, id: cid, n: 0 }, 1);
  toast(`Queued first: ${findAction(skill, id).name} ×${fmt(n)}${craft ? ', then the recipe' : ''}.`, 'good');
  if (!S.action && S.combat.zone == null && typeof msStartNext === 'function') msStartNext();
}
/* touch screens never show title tooltips: tapping a non-interactive titled element shows its label */
if (matchMedia('(hover: none)').matches) {
  let tipEl = null, tipTimer = 0;
  const hideTip = () => { if (tipEl) { tipEl.remove(); tipEl = null; } };
  document.addEventListener('click', (ev) => {
    hideTip();
    const t = ev.target.closest('[title]');
    if (!t || !t.title || t.closest('button, a, label, input, select, textarea, [data-act]')) return;
    tipEl = document.createElement('div');
    tipEl.className = 'tap-tip';
    tipEl.textContent = t.title;
    document.body.appendChild(tipEl);
    const r = t.getBoundingClientRect(), w = tipEl.offsetWidth, h = tipEl.offsetHeight;
    tipEl.style.left = Math.max(8, Math.min(innerWidth - w - 8, r.left + r.width / 2 - w / 2)) + 'px';
    tipEl.style.top = (r.top - h - 6 < 8 ? r.bottom + 6 : r.top - h - 6) + 'px';
    clearTimeout(tipTimer); tipTimer = setTimeout(hideTip, 2200);
  }, true);
  document.addEventListener('scroll', hideTip, true);
}
document.addEventListener('keydown', (ev) => { if (ev.key === 'Escape') { document.body.classList.remove('menu-open'); $('#modal').classList.remove('show'); } });

/* =============================================================== toasts */
const TOAST_IC = { good: 'check', bad: 'close', rare: 'rare' };
notify = (msg, cls) => feedMsg(msg, cls);

/* =============================================================== boot / loop */
/* Save safety (pre-alpha):
   - a save that fails to load is never overwritten: it is kept aside (SAVE_KEY_BROKEN) and the player is told
   - rolling backups: one copy per hour, the last 3 kept (SAVE_KEY_BAK), restorable from Settings
   - one tab at a time: the tab that saves last owns the save; any other tab stops saving and says so */
const SAVE_KEY_BAK = SAVE_KEY + '_bak', SAVE_KEY_BROKEN = SAVE_KEY + '_broken', SAVE_KEY_TAB = SAVE_KEY + '_tab';
const BAK_EVERY = 3600 * 1000, BAK_KEEP = 3;
const TAB_ID = Math.random().toString(36).slice(2);
let LOAD_FAIL = null, TAB_BLOCKED = false;
function lsGet(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
function lsSet(k, v) { try { localStorage.setItem(k, v); return true; } catch (e) { return false; } }
function saveBackups() { try { const b = JSON.parse(lsGet(SAVE_KEY_BAK) || '[]'); return Array.isArray(b) ? b.filter((x) => x && x.t && typeof x.save === 'string') : []; } catch (e) { return []; } }
function pushBackup(save, why) {
  const b = saveBackups();
  b.unshift({ t: Date.now(), why: why || 'auto', save });
  while (b.length > BAK_KEEP) b.pop();
  // storage full: drop the oldest copies until it fits
  while (b.length && !lsSet(SAVE_KEY_BAK, JSON.stringify(b))) b.pop();
}
// Another tab played after this one: this tab must not write its older state over it.
function tabOwner() {
  let o = null;
  try { o = JSON.parse(lsGet(SAVE_KEY_TAB) || 'null'); } catch (e) { /* ignore */ }
  return o && o.id !== TAB_ID ? o : null;
}
function claimTab() { lsSet(SAVE_KEY_TAB, JSON.stringify({ id: TAB_ID, t: Date.now() })); }
function saveGame() {
  if (TAB_BLOCKED) return;
  const other = tabOwner();
  if (other && other.t > tabClaimedAt) { TAB_BLOCKED = true; if (typeof betaTabBlocked === 'function') betaTabBlocked(); return; }
  if (typeof DEV !== 'undefined' && DEV.on && !S.devUsed) S.devUsed = Date.now();   // bug reports say when cheats were used
  const json = serialize();
  if (!lsSet(SAVE_KEY, json)) return;
  claimTab(); tabClaimedAt = Date.now();
  const last = saveBackups()[0];
  if (!last || Date.now() - last.t > BAK_EVERY) pushBackup(json, 'auto');
}
let tabClaimedAt = 0;

// What the time away burned (food, pills...) gets its own smaller row under the gains.
const usedRowHTML = (tiles) => (tiles.length ? `<div class="ob-used"><small>Used</small><div class="ob-grid">${tiles.join('')}</div></div>` : '');
const awaySub = (secs, rested) => `While you were away · ${fmtTime(secs)}${rested ? ' · resting (half speed)' : ''}`;
function showOffline(secs, before, rested) {
  const after = snapshot();
  const rows = [], tiles = [], used = [];
  for (const k in after.levels) if (after.levels[k] > before.levels[k]) rows.push(`<div class="ob-line"><i>${ic('skill', k)}</i><span>${SKILLS[k].name}</span><b>Lv ${before.levels[k]} → ${after.levels[k]}</b></div>`);
  if (after.kills > before.kills) rows.push(`<div class="ob-line"><i>${ui('skull')}</i><span>Foes defeated</span><b>+${fmt(after.kills - before.kills)}</b></div>`);
  if (after.train > before.train) rows.push(`<div class="ob-line"><i>${ui('energy')}</i><span>Training levels</span><b>+${fmt(after.train - before.train)}</b></div>`);
  const dg = after.gold - before.gold;
  if (dg) tiles.push(tile(null, (dg > 0 ? '+' : '') + fmt(dg), { r: 3, icon: ui('gold'), title: 'Gold', cls: 'pop-in' }));
  const ids = [...new Set([...Object.keys(before.items), ...Object.keys(after.items)])].sort((a, b) => rarity(b) - rarity(a));
  for (const id of ids) {
    const d = (after.items[id] || 0) - (before.items[id] || 0);
    if (d) (d < 0 ? used : tiles).push(tile(id, (d > 0 ? '+' : '') + fmt(d), { cls: 'pop-in ' + (d < 0 ? 'neg' : '') }));
  }
  if (!rows.length && !tiles.length && !used.length) rows.push('<div class="ob-line"><span>Nothing happened — you were idle. Start an activity before leaving!</span></div>');
  openModal(obtainedHTML('Welcome back', awaySub(secs, rested), tiles, rows) + usedRowHTML(used));
}

// The Welcome back recap only for a real break: shorter gaps still simulate, silently.
const RECAP_AFTER = 600;
let lastTopKey = '';
function boot() {
  installSprite();
  let raw = null;
  try { raw = localStorage.getItem(SAVE_KEY); } catch (e) { /* ignore */ }
  if (raw) {
    try { loadFrom(raw); }
    catch (e) {
      // never lose it: keep the unreadable save aside, tell the player (beta.js), start fresh
      lsSet(SAVE_KEY_BROKEN, JSON.stringify({ t: Date.now(), err: String(e && e.message || e), save: raw }));
      LOAD_FAIL = String(e && e.message || e);
      newGame();
    }
  }
  else newGame();
  claimTab(); tabClaimedAt = Date.now();
  normalizeView();
  renderHud();

  const away = (Date.now() - S.last) / 1000;
  if (away > 30) {
    const secs = offlineSeconds(away), before = snapshot();
    fillChamber(away - secs);   // time beyond the offline limit goes to the Time Chamber
    if (typeof awayBegin === 'function') awayBegin();
    SIM = true; RESTING = true; advance(secs); SIM = false; RESTING = false;
    if (away >= RECAP_AFTER) showOffline(secs, before, true);
    else if (typeof awayDrop === 'function') awayDrop();
  }
  S.last = Date.now();
  lastTick = Date.now();
  lastUnlocked = ZONES.filter((z, i) => !z.dungeon && zoneUnlocked(i)).length;
  lastGold = Math.floor(S.gold);
  // Older saves never stored what the Bank showed: everything counts as seen once.
  (Array.isArray(S.ui.bankSeen) ? S.ui.bankSeen : Object.keys(S.items)).forEach((k) => seenItems.add(k));
  bankSeenSave();
  // boot() runs from ui-systems.js, before the later scripts (focus-ui, beta...) exist, and the
  // first frames can fire while they are still downloading: a view that needs them waits for them.
  const ready = () => typeof worldInBuild === 'function' && typeof focusHTML === 'function';
  try { render(); } catch (e) { dirty = true; }
  if (isFreshSave()) showWelcome();

  let lastErr = '';
  function frame() {
    try { tickFrame(); } catch (e) {
      // one broken render must never stop the game: report it once, keep running
      dirty = true;
      if (ready() && String(e) !== lastErr) { lastErr = String(e); setTimeout(() => { throw e; }); }
    }
    requestAnimationFrame(frame);
  }
  function tickFrame() {
    catchUp();
    pollUnlocks();
    const ae = document.activeElement;
    const busy = ae && (['SELECT', 'TEXTAREA'].includes(ae.tagName) || (ae.tagName === 'INPUT' && ['text', 'number', 'search'].includes(ae.type)));
    if (dirty && !busy) render();
    else {
      const key = (S.action ? S.action.skill + S.action.id : '') + '|' + S.combat.zone;
      if (key !== lastTopKey || sideDirty) { lastTopKey = key; sideDirty = false; renderSide(); renderRail(); }
      update();
    }
  }
  requestAnimationFrame(frame);
  // Background tabs: desktop browsers still run timers (throttled), so keep simulating.
  setInterval(() => { if (document.hidden) catchUp(); }, 1000);
  setInterval(saveGame, 10000);
  // Mobile browsers freeze or kill hidden pages and rarely fire beforeunload:
  // save the moment the page is hidden, and summarize the gap when it comes back.
  document.addEventListener('visibilitychange', () => {
    catchUp();
    if (document.hidden) { hiddenAt = Date.now(); hiddenSnap = snapshot(); if (typeof awayBegin === 'function') awayBegin(); saveGame(); }
    else if (hiddenSnap) {
      const away = (Date.now() - hiddenAt) / 1000;
      if (away >= RECAP_AFTER && !$('#modal').classList.contains('show')) showOffline(offlineSeconds(away), hiddenSnap);
      else if (typeof awayDrop === 'function') awayDrop();
      hiddenSnap = null;
    }
  });
  window.addEventListener('pagehide', saveGame);
  window.addEventListener('beforeunload', saveGame);
  $('#modal-close').addEventListener('click', () => { $('#modal').classList.remove('show'); updateCoach(true); });
  addEventListener('resize', () => { updateCoach(true); sideDirty = true; });
  $('#main').addEventListener('scroll', () => updateCoach(true), { passive: true });
}

// Wall-clock simulation: works no matter how long frames, timers or the whole page were paused.
let lastTick = Date.now(), hiddenAt = 0, hiddenSnap = null;
let GAME_SPEED = 1;   // dev tools (dev.js) fast-forward: the extra time runs silently, like offline progress
function catchUp() {
  const now = Date.now(), dt = (now - lastTick) / 1000;
  lastTick = now;
  if (dt > 5) { fillChamber(dt - offlineSeconds(dt)); SIM = true; RESTING = true; advance(offlineSeconds(dt)); SIM = false; RESTING = false; dirty = true; }
  else if (dt > 0) {
    step(dt);
    if (GAME_SPEED > 1) { SIM = true; advance(dt * (GAME_SPEED - 1)); SIM = false; }
  }
}

// "Install app" support (Android / desktop Chrome & Edge). iOS uses Share → Add to Home Screen.
let installPrompt = null;
const IS_IOS = /iP(hone|ad|od)/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
const isStandalone = () => matchMedia('(display-mode: standalone)').matches || navigator.standalone === true;
window.addEventListener('beforeinstallprompt', (e) => { e.preventDefault(); installPrompt = e; dirty = true; });
window.addEventListener('appinstalled', () => { installPrompt = null; toast('Installed! Launch Anime Idle RPG from your home screen.', 'good'); dirty = true; });
