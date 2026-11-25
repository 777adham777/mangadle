'use strict';
/* ==========================================================================
   TRI-REALM — techniques interface (reworked 2026-11-25). Engine: techniques.js.
   The page reads left to right:
   - left: your Loadout (six numbered slots, the firing order; pick a slot, move, remove),
     then your scrolls per world (the currency) and how it works in three lines;
   - right: the technique book, one tab per world: each technique with its level, what it does,
     its next tier, one "Learn / Level up" button priced in scrolls and one "Equip in slot N".
   The Battlefield's Techniques tab shows the loadout with cooldowns; the Bank inspector explains a scroll.
   ========================================================================== */

VIEW_FEATURE.techniques = 'techniques';
UIX.quick.push(() => (techOn() ? [['techniques', 'technique', 'Techniques']] : []));
const catIc = (cat) => ui(TECH_CATS[cat].icon);
const scrollName = (r) => SCROLL_NAME[r] || `${REALMS[r].name} Scroll`;
const techWorlds = () => WORLD_ORDER.filter((r) => TECH_POOLS[r] && realmOpen(r));

// The slot an Equip button fills: the one you picked, else the first free one, else the last open one.
function tkTarget() {
  const sel = S.ui.tkSlot;
  if (sel != null && slotOpen(sel)) return sel;
  const f = freeSlot();
  if (f) return f.i;
  const open = openSlots();
  return open.length ? open[open.length - 1].i : 0;
}
// The book's tab: the one you picked, else the newest world that has something to buy, else the first.
function tkWorld() {
  const ws = techWorlds();
  if (S.ui.tkWorld && ws.includes(S.ui.tkWorld)) return S.ui.tkWorld;
  return ws.slice().reverse().find((r) => TECH_POOLS[r].some((id) => count(scrollOf(id)) && techCanUp(id))) || ws[0];
}
const worldReady = (r) => TECH_POOLS[r].filter((id) => count('scroll_' + r) > 0 && techCanUp(id)).length;
// Cost as icons: 2 × Leaf Scroll (+ 3 × Cursed Fragment).
function tkPriceHTML(id) {
  const p = techPrice(id);
  if (!p) return '';
  const sc = `<span class="tk-cost">${itemIc(scrollOf(id))}<b>${p.n}</b></span>`;
  if (!p.cursed) return sc;
  return `<span class="tk-cost">${itemIc(scrollOf(id))}<b>${p.scrolls}</b></span><span class="tk-cost">${itemIc('cursed_fragment')}<b>${p.cursed}</b></span>`;
}

/* ------------------------------------------------------------ the loadout */
function tkSlotHTML(sl, opts) {
  const o = opts || {}, n = `<span class="tk-n">${sl.i + 1}</span>`;
  if (!sl.open()) return `<li class="tk-slot locked">${n}<span class="tk-lock">${ui('lock')}<span>Opens at <b>${esc(sl.hint)}</b></span></span></li>`;
  const id = loadout()[sl.i], sel = !o.compact && tkTarget() === sl.i;
  if (!id || !techLv(id)) {
    return `<li class="tk-slot empty ${sel ? 'sel' : ''}" ${o.compact ? '' : `data-tkslot="${sl.i}"`}>${n}<span class="tk-empty">${o.compact ? 'Empty slot' : sel ? 'Empty · the next technique you equip goes here' : 'Empty'}</span></li>`;
  }
  const T = TECHNIQUES[id], L = techLv(id), last = sl.i === Math.max(...openSlots().map((s) => s.i));
  const ctl = o.compact ? '' : `<span class="tk-ctl">
      <button class="tk-mini" data-tkmove="${sl.i}:-1" title="Fire earlier" ${sl.i === 0 ? 'disabled' : ''}>▲</button>
      <button class="tk-mini dn" data-tkmove="${sl.i}:1" title="Fire later" ${last ? 'disabled' : ''}>▼</button>
      <button class="tk-mini x" data-tkoff="${id}" title="Remove from the slot">✕</button></span>`;
  return `<li class="tk-slot on ${sel ? 'sel' : ''}" ${o.compact ? '' : `data-tkslot="${sl.i}"`} style="--rc:${rc(T.realm)}">${n}
    <span class="tk-ic">${ic('technique', id)}</span>
    <span class="tk-t"><b>${esc(T.name)}</b><small>Lv ${L} · ${TECH_CATS[T.cat].name}${T.cd ? ` · every ${techCd(id)}s` : ' · always on'}</small></span>${ctl}
    ${T.cd && o.compact ? `<span class="tk-cdbar"><i data-techcd="${id}"></i></span>` : ''}</li>`;
}
function tkLoadoutHTML() {
  const open = openSlots().length;
  return `<section class="win tk-load">${hdr('Loadout', `${open} / ${TECH_SLOTS.length} slots open · they fire in this order`)}
    <ol class="tk-slots">${TECH_SLOTS.map((s) => tkSlotHTML(s)).join('')}</ol>
    <p class="tk-hint">${ui('info')}<span>Click a slot to choose where <b>Equip</b> puts a technique. Defensive ones wait until you are hurt; passives are always on.</span></p></section>`;
}
function tkWalletHTML() {
  const rows = techWorlds().map((r) => {
    const k = 'scroll_' + r, n = count(k), ready = worldReady(r);
    return `<button class="tk-coin ${n ? '' : 'none'}" data-tkworld="${r}" style="--rc:${rc(r)}">${tile(k, fmt(n), { cls: 'xs' })}<span><b>${esc(scrollName(r))}</b><small>${ready ? `${ready} technique${ready > 1 ? 's' : ''} ready to buy` : `${esc(REALMS[r].name)} foes drop it`}</small></span></button>`;
  });
  if (count('cursed_fragment')) rows.push(`<div class="tk-coin">${tile('cursed_fragment', fmt(count('cursed_fragment')), { cls: 'xs' })}<span><b>Cursed Fragments</b><small>${CURSED_PER_SCROLL} replace a missing scroll of any world</small></span></div>`);
  return `<section class="win tk-wallet">${hdr('Your scrolls', 'the technique currency')}
    <div class="tk-coins">${rows.join('')}</div>
    <ul class="tk-how">
      <li>${ui('battle')}<span>Every foe can drop its world's scroll; guardians often do.</span></li>
      <li>${ui('technique')}<span><b>1 scroll</b> learns a technique of that world. Each level costs more (up to ${TECH_COST[TECH_MAX - 1]}).</span></li>
      <li>${ui('star')}<span>Levels <b>5</b> and <b>10</b> change how a technique works.</span></li>
    </ul></section>`;
}

/* ------------------------------------------------------------ the book */
function tkPips(L) {
  let s = '';
  for (let i = 1; i <= TECH_MAX; i++) s += `<i class="${i <= L ? 'on' : ''} ${TECH_TIERS.includes(i) ? 'tier' : ''}"></i>`;
  return `<span class="tk-pips" title="Level ${L} / ${TECH_MAX}">${s}</span>`;
}
function tkRowHTML(id) {
  const T = TECHNIQUES[id], L = techLv(id), eq = isEquipped(id), p = techPrice(id), tgt = tkTarget();
  const nextTier = TECH_TIERS.find((t) => t > L);
  const buy = !p ? `<span class="tk-max">${ui('star')}Mastered</span>`
    : `<button class="tk-buy ${p.ok ? '' : 'short'}" data-tkup="${id}" ${p.ok ? '' : 'disabled'} title="${p.ok ? '' : `You need ${p.n} ${esc(scrollName(T.realm))}${p.n > 1 ? 's' : ''}`}">
        <span>${L ? `Level ${L + 1}` : 'Learn'}</span>${tkPriceHTML(id)}</button>`;
  const slotBtn = !L ? '' : eq
    ? `<button class="tk-eq on" data-tkoff="${id}" title="Remove it from slot ${slotOf(id) + 1}">${ui('check')}<span>Slot ${slotOf(id) + 1}</span></button>`
    : `<button class="tk-eq" data-tkeq="${id}" title="Put it in slot ${tgt + 1}${loadout()[tgt] && techLv(loadout()[tgt]) ? ` (replaces ${esc(TECHNIQUES[loadout()[tgt]].name)})` : ''}">${ui('play')}<span>Equip · slot ${tgt + 1}</span></button>`;
  return `<div class="tk-row ${L ? '' : 'unk'} ${eq ? 'eq' : ''}" style="--rc:${rc(T.realm)}">
    <span class="tk-big">${ic('technique', id)}</span>
    <div class="tk-main">
      <div class="tk-top"><b>${esc(T.name)}</b><span class="tk-cat c-${T.cat}">${catIc(T.cat)}${TECH_CATS[T.cat].name}</span>${T.cd ? `<span class="tk-cd">${ui('spd')}${techCd(id)}s</span>` : ''}</div>
      <p class="tk-desc">${T.desc(Math.max(1, L))}</p>
      <div class="tk-meta">${tkPips(L)}<span class="tk-lv">${L ? `Lv <b>${L}</b>/${TECH_MAX}` : 'Not learned'}</span>
        ${nextTier ? `<span class="tk-next"><em>Lv ${nextTier}</em>${esc(T.tiers[nextTier])}</span>` : `<span class="tk-next done"><em>Lv 10</em>${esc(T.tiers[10])}</span>`}</div>
      <small class="tk-when">${esc(TECH_CATS[T.cat].how)}</small>
    </div>
    <div class="tk-act">${buy}${slotBtn}</div></div>`;
}
function tkBookHTML() {
  const ws = techWorlds(), w = tkWorld();
  if (!w) return '';
  const tabs = ws.map((r) => { const n = worldReady(r); return `<button class="tk-tab ${r === w ? 'on' : ''}" data-tkworld="${r}" style="--rc:${rc(r)}">${ic('realm', r)}<span>${esc(REALMS[r].name)}</span>${n ? `<em>${n}</em>` : ''}</button>`; }).join('');
  const pool = TECH_POOLS[w], known = pool.filter(techLv).length;
  return `<section class="win tk-book" style="--rc:${rc(w)}">
    <div class="tk-tabs">${tabs}</div>
    <div class="tk-bookhead"><span>${tile('scroll_' + w, fmt(count('scroll_' + w)), { cls: 'xs' })}<b>${esc(REALMS[w].name)}</b> techniques</span><small>${known} / ${pool.length} learned</small></div>
    <div class="tk-list">${pool.map(tkRowHTML).join('')}</div></section>`;
}

VIEWS.techniques = () => {
  const ids = Object.keys(TECHNIQUES), known = ids.filter(techLv).length;
  return `${ptitle('Your build', 'Techniques', `<span class="pill">${known} / ${ids.length} learned</span>`)}
  ${fitCols('tq-board tk-page', `${introCardHTML('feature:techniques')}${tkLoadoutHTML()}${tkWalletHTML()}`, tkBookHTML())}`;
};

/* ------------------------------------------------------------ the Battlefield tab */
UIX.battleSide.push(() => {
  if (!techOn()) return '';
  const nextLocked = TECH_SLOTS.find((x) => !x.open());
  const n = techReady();
  return `<section class="win techs">${hdr('Techniques', 'fire on their own, in this order')}
    <ol class="tk-slots compact">${TECH_SLOTS.filter((s) => s.open() || s === nextLocked).map((s) => tkSlotHTML(s, { compact: true })).join('')}</ol>
    ${gbtn(n ? `Techniques · ${n} ready to buy` : 'Manage techniques', 'technique', 'data-nav="techniques"', (n ? '' : 'dark ') + 'sm')}</section>`;
});

/* ------------------------------------------------------------ the Bank inspector */
const scrollPool = (id) => TECH_POOLS[ITEMS[id].pool] || [];
function scrollInspect(id) {
  const it = ITEMS[id], r = it.pool, pool = scrollPool(id);
  const row = (t) => { const L = techLv(t), p = techPrice(t);
    return `<li><span><i>${ic('technique', t)}</i>${esc(TECHNIQUES[t].name)}</span><b>${L ? `Lv ${L}` : 'Not learned'}${p ? ` · next ${p.n}` : ' · max'}</b></li>`; };
  const body = `${hdr('Technique currency', REALMS[r] ? REALMS[r].name : '')}<p class="muted small">Spend it on the Techniques page: 1 scroll learns a ${esc(REALMS[r] ? REALMS[r].name : '')} technique, more scrolls level it up.</p>
    <ul class="srcs">${pool.map(row).join('')}</ul>`;
  return { body, acts: [gbtn('Spend on Techniques', 'technique', 'data-nav="techniques"')] };
}

UIX.actLines.push((skill, a) => {
  const it = a.out && ITEMS[Object.keys(a.out)[0]];
  if (!it || it.type !== 'scroll' || !it.pool) return '';
  return `<div class="ac-note tech-note"><span>${ui('technique')}Technique currency: ${fmt(count('scroll_' + it.pool))} owned</span><span class="muted">Spend it on the Techniques page.</span></div>`;
});

/* ------------------------------------------------------------ live */
UPD.push(() => {
  for (const el of $$('[data-techcd]')) {
    const id = el.dataset.techcd, left = Math.max(0, RT.cd[id] || 0);
    el.style.width = (100 * (1 - left / techCd(id))) + '%';
  }
});
on('technique', (d) => {
  const T = TECHNIQUES[d.id], j = slotOf(d.id);
  if (d.fresh) burst('New technique', `${T.name} · ${j >= 0 ? `in slot ${j + 1}` : 'equip it in a slot'}`, ic('technique', d.id), rc(T.realm));
});
on('firstscroll', (sid) => { toast(`${ITEMS[sid].name} found: spend it on the Techniques page`, 'rare'); sideDirty = true; });
on('techup', (d) => {
  const T = TECHNIQUES[d.id];
  if (TECH_TIERS.includes(d.lv)) burst(`${T.name} · Lv ${d.lv}`, T.tiers[d.lv], ic('technique', d.id), rc(T.realm));
  else toast(`${T.name} reached level ${d.lv}.`, 'good');
});
on('tech', (d) => {
  if (!inBattleView()) return;
  const el = $('[data-portrait="player"]');
  floatAt(el, d.heal ? `+${fmt(d.heal)}${ui('hp')}` : `<small>${esc(TECHNIQUES[d.id].name)}</small>`, d.heal ? 'heal' : 'xp techcall', 0, -30);
});

document.addEventListener('click', (ev) => {
  const t = ev.target.closest('button, [data-tkslot]');
  if (!t || t.disabled) return;
  const D = t.dataset;
  if (D.tkup) { techUp(D.tkup); dirty = true; sideDirty = true; }
  else if (D.tkeq) { const i = tkTarget(); if (equipTech(i, D.tkeq)) S.ui.tkSlot = null; dirty = true; }
  else if (D.tkoff) { unequipTech(D.tkoff); dirty = true; }
  else if (D.tkmove) { ev.stopPropagation(); const [i, d] = D.tkmove.split(':').map(Number); if (moveTech(i, d)) S.ui.tkSlot = i + d; dirty = true; }
  else if (D.tkworld) { S.ui.tkWorld = D.tkworld; if (S.ui.view !== 'techniques') setView('techniques'); dirty = true; }
  else if (D.tkslot != null && !ev.target.closest('button')) { const i = +D.tkslot; S.ui.tkSlot = S.ui.tkSlot === i ? null : i; dirty = true; }
});
// The menu badge follows what you can buy.
let tkSeen = -1;
UPD.push(() => {
  const n = techReady();
  if (n === tkSeen) return;
  if (tkSeen >= 0) { sideDirty = true; if (inBattleView() || S.ui.view === 'techniques') dirty = true; }
  tkSeen = n;
});
