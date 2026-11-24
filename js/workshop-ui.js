/* Workshop: the recipe browser of every crafting skill (Crafting, Smelting, Cooking, Restoration).
   A search box, status tabs, item-family chips and a sort menu over a gallery of item cards: what you
   can make right now is lit, everything else is greyed. Click a card to see it in full beside the
   gallery; the ▶ in its corner starts it in one click. */

GI['ws-search'] = 'M60 210A150 150 0 1 0 360 210A150 150 0 1 0 60 210ZM115 210A95 95 0 1 1 305 210A95 95 0 1 1 115 210ZM300 345L345 300L470 425L425 470Z';
GI['ws-sort'] = 'M144 40L40 168h72v304h64V168h72ZM368 472l104-128h-72V40h-64v304h-72Z';
Object.assign(ICONS.ui, { search: 'ws-search', sort: 'ws-sort' });

// Families of what a recipe makes. Gear splits by slot; colours reuse the bank's family colours.
const WS_CATS = [
  ['weapon', 'weapon', 'Weapons', 'equip'], ['armor', 'armor', 'Armor', 'equip'], ['accessory', 'accessory', 'Accessories', 'equip'],
  ['food', 'k-food', 'Consumables', 'food'], ['scroll', 'k-scroll', 'Scrolls', 'scroll'], ['tool', 'k-tool', 'Tools', 'tool'],
  ['res', 'k-res', 'Materials', 'res'], ['trade', 'gold', 'Trade goods', 'chest'], ['chest', 'k-chest', 'Treasure', 'chest'],
];
const WS_STATUS = [['all', 'All'], ['open', 'Unlocked'], ['ready', 'Craftable'], ['locked', 'Locked']];
const wsCan = (a) => (a.in ? Math.min(...Object.entries(a.in).map(([k, n]) => Math.floor(stock(k) / n))) : Infinity);
const wsOut = (a) => (a.out ? Object.keys(a.out)[0] : null);
const WS_SORTS = {
  best: ['Craftable first', (s, a, b) => wsRank(s, b) - wsRank(s, a) || (wsRank(s, a) ? b.level - a.level : a.level - b.level)],
  lvd: ['Level: high to low', (s, a, b) => b.level - a.level],
  lva: ['Level: low to high', (s, a, b) => a.level - b.level],
  name: ['Name', (s, a, b) => a.name.localeCompare(b.name)],
  xph: ['XP / hour', (s, a, b) => farmRates(s, b).xph - farmRates(s, a).xph],
  can: ['Can make', (s, a, b) => Math.min(1e9, wsCan(b)) - Math.min(1e9, wsCan(a)) || b.level - a.level],
  own: ['Owned', (s, a, b) => count(wsOut(b)) - count(wsOut(a)) || b.level - a.level],
  rar: ['Rarity', (s, a, b) => actRarity(b) - actRarity(a) || b.level - a.level],
};
function wsCat(a) {
  const o = wsOut(a), it = o && ITEMS[o];
  if (!it) return 'res';
  return it.type === 'equip' ? it.slot : it.type === 'trade' ? 'trade' : itemKind(o);
}
const wsLocked = (st) => st === 'locked' || st === 'schem';
// No overload: a piece of gear whose world is not open yet stays out of the workshop (and its counts)
// until you reach that world, unless you already hold its schematic or a world gate asks for it.
function wsShown(a) {
  const id = wsOut(a), t = id && typeof GEAR_TIERS !== 'undefined' && GEAR_TIERS[id];
  if (!t || (a.schem && S.known[a.schem]) || (typeof OFFERED !== 'undefined' && OFFERED.has(id))) return true;
  const z = ZONES[Math.min(ZONES.length - 1, Math.floor(t[0]))];
  return !z || realmOpen(z.realm);
}
const wsActs = (skill) => SKILLS[skill].actions.filter(wsShown);
const wsRank = (s, a) => { const st = actState(s, a); return st === 'active' ? 3 : st === 'ready' ? 2 : wsLocked(st) ? 0 : 1; };
// Narrow workshops (phones, small windows) show the selected recipe above the gallery instead of beside it.
function wsNarrow() {
  const m = $('#main'), w = (m ? m.clientWidth : innerWidth) - 48;
  return w < 680;
}

// Per-skill view state (saved with the game); the search text lives only for the session.
const wsQuery = {}, wsScroll = {};
function wsState(skill) {
  S.ui.ws = S.ui.ws || {};
  const W = (S.ui.ws[skill] = Object.assign({ cat: 'all', st: 'all', sort: 'best', sel: null }, S.ui.ws[skill]));
  if (!W.g) { W.g = 1; W.st = 'all'; }   // the gallery shows everything by default (older saves had the list's "Available")
  if (!WS_SORTS[W.sort]) W.sort = 'best';
  return W;
}
// The recipe the tutorial points at always stays in the list, whatever the filters.
function wsGuideId(skill) {
  if (typeof guideOn !== 'function' || !guideOn()) return null;
  const G = GUIDE[S.goal];
  if (G && G.act && G.act.split(':')[0] === skill) return G.act.split(':')[1];
  if (G && G.skill === skill) { const best = SKILLS[skill].actions.filter((a) => actState(skill, a) === 'ready').pop(); return best ? best.id : null; }
  return null;
}
const wsText = (a) => (a.name + ' ' + Object.keys(a.in || {}).map((k) => ITEMS[k].name).join(' ')).toLowerCase();
function wsMatch(skill, a, W, q, o) {
  const st = actState(skill, a);
  if (!o.noSt && W.st !== 'all') {
    if (W.st === 'locked' ? !wsLocked(st) : wsLocked(st)) return false;
    if (W.st === 'ready' && st !== 'ready' && st !== 'active') return false;
  }
  if (!o.noCat && W.cat !== 'all' && wsCat(a) !== W.cat) return false;
  return !q || wsText(a).includes(q);
}
function wsRecipes(skill, o) {
  o = o || {};
  const W = wsState(skill), q = (wsQuery[skill] || '').trim().toLowerCase(), g = wsGuideId(skill);
  const list = wsActs(skill).filter((a) => a.id === g || wsMatch(skill, a, W, q, o));
  // "Upcoming" reads best soonest-first, so the default level sort flips there.
  const key = W.st === 'locked' && (W.sort === 'lvd' || W.sort === 'best') ? 'lva' : W.sort;
  return list.sort((a, b) => WS_SORTS[key][1](skill, a, b));
}
function wsSelected(skill) {
  const W = wsState(skill), acts = wsActs(skill);
  const pick = (id) => id && acts.find((a) => a.id === id);
  if (wsNarrow()) return pick(W.sel) || null;
  return pick(W.sel) || pick(wsGuideId(skill)) ||(S.action && S.action.skill === skill && pick(S.action.id)) || wsRecipes(skill)[0] || acts[0];
}

/* ------------------------------------------------------------- pieces */
const wsGoIc = (st) => ui(st === 'active' ? 'stop' : st === 'missing' ? 'close' : st === 'blocked' ? 'lock' : 'play');
// One gallery card. Anything you cannot make right now (locked, schematic missing, short of
// ingredients) is greyed; the ▶ corner button starts it.
function wsCard(skill, a, selId) {
  const st = actState(skill, a), locked = wsLocked(st), can = wsCan(a);
  const mats = Object.entries(a.in || {}).map(([m, n]) => `<span class="ws-m ${stock(m) >= n ? 'ok' : ''}" data-wsm="${m}" data-n="${n}">${itemIc(m)}</span>`).join('');
  const sub = st === 'schem' ? `${ui('schematic')}Lv ${a.level}` : st === 'locked' ? `${ui('lock')}Lv ${a.level}` : `Lv ${a.level}`;
  return `<div class="ws-card ${a.id === selId ? 'sel' : ''}" data-card="${skill}:${a.id}" data-state="${st}">
    <button class="wc-pick" data-wsel="${skill}:${a.id}" title="${esc(a.name)}">
      ${tile(null, null, { r: actRarity(a), icon: actIc(skill, a), mark: actMark(a), cls: 'wc-tile', title: a.name })}
      <b class="wc-nm">${esc(a.name)}</b><small class="wc-sub">${sub}</small>
      <span class="ws-mats wc-mats">${mats}</span></button>
    ${locked || !a.in ? '' : `<span class="ws-can wc-can ${can ? '' : 'zero'}" data-wscan="${skill}:${a.id}" title="How many you can make with what you have">×${fmt(can)}</span>`}
    ${locked ? '' : `<button class="ws-go wc-go" data-act="${skill}:${a.id}" data-wsgo title="Start / stop">${wsGoIc(st)}</button>`}
    <span class="ws-prog"><i data-cardfill></i></span></div>`;
}
function wsNext(skill) {
  const W = wsState(skill);
  const next = wsActs(skill).filter((a) => wsLocked(actState(skill, a)) && (W.cat === 'all' || wsCat(a) === W.cat)).sort((a, b) => a.level - b.level)[0];
  if (!next) return '';
  return `<button class="ws-next" data-wsel="${skill}:${next.id}">${tile(null, null, { r: actRarity(next), icon: actIc(skill, next), cls: 'xs', title: next.name })}
    <span><small>Next unlock</small><b>${esc(next.name)}</b></span><em>${next.schem && !S.known[next.schem] ? ui('schematic') : ui('lock')}Lv ${next.level}</em></button>`;
}
function wsListHTML(skill) {
  const W = wsState(skill), list = wsRecipes(skill), sel = wsSelected(skill);
  if (!list.length) {
    return `<div class="ws-empty">${ui('search')}<b>No recipe matches</b><span>${W.st === 'ready' ? 'Nothing can be made with what you have right now.' : 'Try another family or search.'}</span>${gbtn('Clear filters', 'close', `data-wsclear="${skill}"`, 'dark sm')}</div>`;
  }
  return list.map((a) => wsCard(skill, a, sel && sel.id)).join('') + (W.st === 'open' && !(wsQuery[skill] || '').trim() ? wsNext(skill) : '');
}
function wsCatsHTML(skill) {
  const W = wsState(skill), acts = wsActs(skill);
  const present = WS_CATS.filter((c) => acts.some((a) => wsCat(a) === c[0]));
  if (present.length < 2) return '';
  const pool = wsRecipes(skill, { noCat: true });
  const n = (k) => pool.filter((a) => k === 'all' || wsCat(a) === k).length;
  return `<nav class="ws-cats" id="ws-cats">${[['all', 'equip', 'All', '']].concat(present).map(([k, icn, l, kc]) => {
    const c = n(k);
    return `<button class="${W.cat === k ? 'on' : ''} ${kc ? 'k-' + kc : ''} ${c ? '' : 'none'}" data-wscat="${skill}:${k}" title="${l}">${ui(icn)}<span>${l}</span><em>${c}</em></button>`;
  }).join('')}</nav>`;
}
function wsStatusHTML(skill) {
  const W = wsState(skill), q = (wsQuery[skill] || '').trim().toLowerCase();
  const pool = wsActs(skill).filter((a) => wsMatch(skill, a, W, q, { noSt: true }));
  const n = { all: pool.length, open: 0, ready: 0, locked: 0 };
  for (const a of pool) { const st = actState(skill, a); if (wsLocked(st)) n.locked++; else { n.open++; if (st === 'ready' || st === 'active') n.ready++; } }
  return `<nav class="seg ws-st" id="ws-st">${WS_STATUS.map(([k, l]) => `<button class="${W.st === k ? 'on' : ''}" data-wsst="${skill}:${k}"><span>${l}</span><em>${n[k]}</em></button>`).join('')}</nav>`;
}

function wsDetail(skill, a) {
  const st = actState(skill, a), o = wsOut(a), it = o ? ITEMS[o] : null, r = actRarity(a), locked = wsLocked(st), cat = WS_CATS.find((c) => c[0] === wsCat(a));
  const head = `<div class="ws-dh">${tile(null, null, { r, icon: actIc(skill, a), mark: actMark(a), title: a.name, cls: 'ws-big' })}
    <div class="ws-dt"><small class="kind-lab k-${cat ? cat[3] : 'res'}">${o ? typeLabel(o) : SKILLS[skill].name}</small><h2>${esc(a.name)}</h2>${stars(r)}</div>
    ${it ? `<span class="ws-own"><small>Owned</small><b data-count="${o}">${fmt(count(o))}</b></span>` : ''}</div>`;
  const notes = [];
  if (it && it.type === 'equip' && it.stats) notes.push(`<div class="ac-note">${statInline(it.stats)}</div>`);
  if (it && it.type === 'food') notes.push(`<div class="ac-note"><span>${ui('hp')}Heals ${foodHeal(o)} HP</span></div>`);
  if (it && it.desc) notes.push(`<p class="ws-desc">${esc(it.desc)}</p>`);
  notes.push(uix('actLines', skill, a));
  const ing = a.in ? `<h4 class="ws-h">Ingredients${locked ? '' : `<span>can make <b data-wscan="${skill}:${a.id}">${fmt(wsCan(a))}</b></span>`}</h4><ul class="ws-ing">${Object.entries(a.in).map(([k, n]) => {
    const src = sourcesOf(k)[0], have = stock(k);
    return `<li class="${have >= n ? 'ok' : ''}" data-wsi="${k}" data-n="${n}">${tile(k, null, { cls: 'xs' })}
      <span class="wi-nm"><b>${esc(ITEMS[k].name)}</b><small>${src ? esc(src.text) : '&nbsp;'}</small></span>
      <span class="wi-n"><em data-have="${k}" data-n="${n}">${fmt(have)}</em> / ${fmt(n)}</span><span class="wi-bar"><i style="width:${Math.min(100, (have / n) * 100)}%"></i></span></li>`;
  }).join('')}</ul>` : '';
  if (locked) {
    const L = skillLv(skill), schem = a.schem && !S.known[a.schem], src = schem && sourcesOf(a.schem)[0];
    return `<section class="win ws-detail" data-card="${skill}:${a.id}" data-state="${st}">${head}
      <h4 class="ws-h">Requirements</h4><ul class="ws-req">
        <li class="${L >= a.level ? 'ok' : ''}">${ui(L >= a.level ? 'check' : 'lock')}<span>${SKILLS[skill].name} level ${a.level}</span><em>${L} / ${a.level}</em></li>
        ${a.schem ? `<li class="${schem ? '' : 'ok'}">${ui(schem ? 'schematic' : 'check')}<span>${esc(ITEMS[a.schem].name)}</span><em>${schem ? (src ? `${esc(src.text)}${src.rate ? ' · ' + fmtRate(src.rate * luckMult()) : ''}` : 'Not found yet') : 'Learned'}</em></li>` : ''}</ul>
      ${ing}${notes.join('')}</section>`;
  }
  const f = farmRates(skill, a), ml = masteryLv(skill, a.id);
  return `<section class="win ws-detail" data-card="${skill}:${a.id}" data-state="${st}">${head}
    <div class="ws-stats">
      <span title="Time per action">${ui('time')}<b>${fmtTime(f.T)}</b><small>per craft</small></span>
      <span title="XP per action">${ui('xp')}<b>${fmt(a.xp)}</b><small>xp</small></span>
      <span title="XP per hour">${ui('xp')}<b>${fmt(f.xph)}</b><small>xp / h</small></span>
      <span title="Items per hour">${ui('spd')}<b>${fmt(f.itemsh || f.per)}</b><small>per hour</small></span>
    </div>
    ${ing}${notes.join('')}
    <div class="ws-mast" title="Mastery: each level makes this recipe 0.3% faster and adds 0.1% chance to double">${ui('mastery')}<span>Mastery <b data-mlv="${skill}:${a.id}">${ml}</b></span><span class="bar"><i data-mfill="${skill}:${a.id}"></i></span></div>
    <button class="ws-cta" data-act="${skill}:${a.id}" data-wsgo><span class="ws-cta-l" data-cta2>${ctaLabel(skill, a, st)}</span><span class="ws-dprog"><i data-cardfill></i></span></button>
  </section>`;
}

// o.detail === false: the selected recipe is shown elsewhere (beside a skill's scene, see skillpage-ui.js).
function workshopHTML(skill, o) {
  o = o || {};
  const s = SKILLS[skill], acts = wsActs(skill), W = wsState(skill), sel = wsSelected(skill);
  const open = acts.filter((x) => !wsLocked(actState(skill, x))).length;
  return `${hdr('Recipes', `${open} / ${acts.length} unlocked`)}
  <section class="ws" data-ws="${skill}">
    <div class="ws-bar">
      <label class="ws-q">${ui('search')}<input id="ws-q" type="search" data-wsq="${skill}" placeholder="Search a recipe or an ingredient" value="${esc(wsQuery[skill] || '')}" autocomplete="off"></label>
      ${wsStatusHTML(skill)}
      <label class="ws-sort" title="Sort">${ui('sort')}<select data-wssort="${skill}">${Object.entries(WS_SORTS).map(([k, [l]]) => `<option value="${k}" ${W.sort === k ? 'selected' : ''}>${l}</option>`).join('')}</select></label>
    </div>
    ${wsCatsHTML(skill)}
    <div class="ws-body ${wsNarrow() ? 'narrow' : o.detail === false ? 'solo' : ''}">
      ${sel && (wsNarrow() || o.detail !== false) ? wsDetail(skill, sel) : ''}
      <div class="ws-list" id="ws-list" data-wslist="${skill}">${wsListHTML(skill)}</div>
    </div>
  </section>`;
}

/* ------------------------------------------------------------- live refresh */
// Typing or filtering only redraws the list, so the search box keeps its focus.
function wsRefresh(skill) {
  const l = $('#ws-list'); if (l) { l.innerHTML = wsListHTML(skill); l.scrollTop = 0; }
  const c = $('#ws-cats'); if (c) c.outerHTML = wsCatsHTML(skill);
  const s = $('#ws-st'); if (s) s.outerHTML = wsStatusHTML(skill);
  update();
}
UPD.push(() => {
  for (const el of $$('[data-wsm]')) el.classList.toggle('ok', stock(el.dataset.wsm) >= +el.dataset.n);
  for (const el of $$('[data-wsi]')) {
    const have = stock(el.dataset.wsi), n = +el.dataset.n;
    el.classList.toggle('ok', have >= n);
    const b = $('.wi-bar i', el); if (b) b.style.width = Math.min(100, (have / n) * 100) + '%';
  }
  for (const el of $$('[data-wscan]')) {
    const [s, id] = el.dataset.wscan.split(':'), c = wsCan(findAction(s, id));
    setText(el, (el.classList.contains('ws-can') ? '×' : '') + fmt(c));
    el.classList.toggle('zero', !c);
  }
  for (const el of $$('.ws-go')) {
    const st = el.closest('[data-card]').dataset.state;
    if (el.dataset.st !== st) { el.dataset.st = st; el.innerHTML = wsGoIc(st); }
  }
  // The list scrolls on its own: keep its position across full redraws.
  const l = $('#ws-list');
  if (l && !l.dataset.rs) { l.dataset.rs = 1; l.scrollTop = wsScroll[l.dataset.wslist] || 0; }
});
addEventListener('resize', () => { const b = $('.ws-body'); if (b && wsNarrow() !== b.classList.contains('narrow')) dirty = true; });
document.addEventListener('scroll', (ev) => { const l = ev.target; if (l.id === 'ws-list') wsScroll[l.dataset.wslist] = l.scrollTop; }, true);

document.addEventListener('click', (ev) => {
  const t = ev.target.closest('[data-wsel], [data-wscat], [data-wsst], [data-wsclear], [data-wsgo]');
  if (!t) return;
  const d = t.dataset;
  if (d.wsel) {
    const [skill, id] = d.wsel.split(':'), W = wsState(skill), narrow = wsNarrow();
    // Inline (narrow) details fold back when their row is tapped again.
    W.sel = narrow && W.sel === id && t.classList.contains('wc-pick') ? null : id; dirty = true;
    if (narrow && W.sel) requestAnimationFrame(() => { const p = $('.ws-body .ws-detail'); if (p) p.scrollIntoView({ behavior: 'smooth', block: 'nearest' }); });
  } else if (d.wscat) { const [skill, k] = d.wscat.split(':'); wsState(skill).cat = k; wsRefresh(skill); }
  else if (d.wsst) { const [skill, k] = d.wsst.split(':'); wsState(skill).st = k; wsRefresh(skill); }
  else if (d.wsclear) { const W = wsState(d.wsclear); W.cat = 'all'; W.st = 'all'; wsQuery[d.wsclear] = ''; const q = $('#ws-q'); if (q) q.value = ''; wsRefresh(d.wsclear); }
  else if ('wsgo' in d) { const [skill, id] = d.act.split(':'), W = wsState(skill); if (W.sel !== id) { W.sel = id; dirty = true; } }
});
document.addEventListener('input', (ev) => {
  const t = ev.target;
  if (t.dataset && t.dataset.wsq) { wsQuery[t.dataset.wsq] = t.value; wsRefresh(t.dataset.wsq); }
});
document.addEventListener('change', (ev) => {
  const t = ev.target;
  if (t.dataset && t.dataset.wssort) { wsState(t.dataset.wssort).sort = t.value; wsRefresh(t.dataset.wssort); }
});
document.addEventListener('keydown', (ev) => {
  if (ev.key === 'Escape' && ev.target.id === 'ws-q' && ev.target.value) { ev.target.value = ''; wsQuery[ev.target.dataset.wsq] = ''; wsRefresh(ev.target.dataset.wsq); }
});
