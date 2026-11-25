'use strict';
/* ==========================================================================
   TRI-REALM — techniques interface (2026-11-25). Engine: techniques.js.
   - left: the Loadout in three groups (3 Active in firing order, 3 Passive, 1 Ultimate; click a slot
     to choose where Equip puts a technique), then your scrolls by world and rarity, with Read.
   - right: the technique book, one tab per world: each technique with its rarity, level, what it does,
     its next tier, and "Equip" into the right kind of slot; Cursed Fragments can level a known one.
   Reading opens a window with what the scrolls taught. The Battlefield's tab shows the loadout.
   ========================================================================== */

VIEW_FEATURE.techniques = 'techniques';
UIX.quick.push(() => (techOn() ? [['techniques', 'technique', 'Techniques']] : []));
const catIc = (cat) => ui(TECH_CATS[cat].icon);
const scrollName = (r) => SCROLL_NAME[r] || `${REALMS[r].name} Scroll`;
const techWorlds = () => WORLD_ORDER.filter((r) => TECH_POOLS[r] && realmOpen(r));
const rarName = (r) => RARITY_NAME[r] || '';
const KIND_HOW = { active: 'fire in this order', passive: 'always on', ultimate: 'fires when ready' };

// The slot an Equip button fills for a technique: the picked slot if it is the right kind, else a free
// one of that kind, else the last open one of that kind.
function tkTarget(id) {
  const kind = techKind(id), sel = S.ui.tkSlot;
  if (sel != null && slotOpen(sel) && TECH_SLOTS[sel].kind === kind) return sel;
  const f = freeSlot(kind);
  if (f) return f.i;
  const open = openSlots().filter((s) => s.kind === kind);
  return open.length ? open[open.length - 1].i : -1;
}
function tkWorld() {
  const ws = techWorlds();
  if (S.ui.tkWorld && ws.includes(S.ui.tkWorld)) return S.ui.tkWorld;
  return ws.slice().reverse().find((r) => SCROLL_TIERS.some(([suf]) => count('scroll_' + r + suf) >= 1)) || ws[0];
}

/* ------------------------------------------------------------ the loadout */
function tkSlotHTML(sl, opts) {
  const o = opts || {}, n = `<span class="tk-n">${ui(TECH_CATS[sl.kind === 'active' ? 'attack' : sl.kind].icon)}</span>`;
  if (!sl.open()) return `<li class="tk-slot locked">${n}<span class="tk-lock">${ui('lock')}<span>Opens at <b>${esc(sl.hint)}</b></span></span></li>`;
  const id = loadout()[sl.i], sel = !o.compact && S.ui.tkSlot === sl.i;
  if (!id || !techLv(id)) {
    return `<li class="tk-slot empty ${sel ? 'sel' : ''}" ${o.compact ? '' : `data-tkslot="${sl.i}"`}>${n}<span class="tk-empty">${esc(sl.name)} · empty${sel ? ': Equip puts the next one here' : ''}</span></li>`;
  }
  const T = TECHNIQUES[id], L = techLv(id), same = openSlots().filter((s) => s.kind === sl.kind), k = same.indexOf(sl);
  const ctl = o.compact ? '' : `<span class="tk-ctl">${sl.kind === 'active' ? `
      <button class="tk-mini" data-tkmove="${sl.i}:-1" title="Fire earlier" ${k <= 0 ? 'disabled' : ''}>▲</button>
      <button class="tk-mini dn" data-tkmove="${sl.i}:1" title="Fire later" ${k >= same.length - 1 ? 'disabled' : ''}>▼</button>` : ''}
      <button class="tk-mini x" data-tkoff="${id}" title="Remove from the slot">✕</button></span>`;
  return `<li class="tk-slot on r${techRar(id)} ${sel ? 'sel' : ''}" ${o.compact ? '' : `data-tkslot="${sl.i}"`} style="--rc:${rc(T.realm)}">${n}
    <span class="tk-ic">${ic('technique', id)}</span>
    <span class="tk-t"><b>${esc(T.name)}</b><small>Lv ${L} · ${TECH_CATS[T.cat].name}${T.cd ? ` · every ${techCd(id)}s` : ''}</small></span>${ctl}
    ${T.cd && o.compact ? `<span class="tk-cdbar"><i data-techcd="${id}"></i></span>` : ''}</li>`;
}
function tkGroupHTML(kind, opts) {
  const slots = TECH_SLOTS.filter((s) => s.kind === kind), open = slots.filter((s) => s.open()).length;
  const shown = opts && opts.compact ? slots.filter((s, i) => s.open() || i === open) : slots;
  if (!shown.length) return '';
  return `<div class="tk-group"><h4>${SLOT_KINDS[kind]} <small>${open} / ${slots.length} · ${KIND_HOW[kind]}</small></h4>
    <ol class="tk-slots ${opts && opts.compact ? 'compact' : ''}">${shown.map((s) => tkSlotHTML(s, opts)).join('')}</ol></div>`;
}
function tkLoadoutHTML() {
  return `<section class="win tk-load">${hdr('Loadout', 'click a slot, then Equip')}
    ${['active', 'passive', 'ultimate'].map((k) => tkGroupHTML(k)).join('')}</section>`;
}

/* ------------------------------------------------------------ scrolls */
function tkShelfHTML() {
  const rows = techWorlds().map((r) => {
    const tiles = SCROLL_TIERS.map(([suf]) => {
      const id = 'scroll_' + r + suf, n = Math.floor(count(id));
      return n ? `<button class="tk-scr" data-readscroll="${id}:all" title="Read ${n} ${esc(ITEMS[id].name)}${n > 1 ? 's' : ''}">${tile(id, fmt(n), { cls: 'xs' })}</button>` : '';
    }).join('');
    return tiles ? `<div class="tk-shelfrow" style="--rc:${rc(r)}"><span><b>${esc(REALMS[r].name)}</b><small>${TECH_POOLS[r].filter(techLv).length} / ${TECH_POOLS[r].length} learned</small></span><span class="tk-scrs">${tiles}</span></div>` : '';
  }).join('');
  const n = techReady(), cf = Math.floor(count('cursed_fragment'));
  return `<section class="win tk-wallet">${hdr('Scrolls', n ? `${fmt(n)} to read` : 'foes drop them')}
    ${rows ? `<div class="tk-shelf">${rows}</div>${gbtn(`Read every scroll ×${fmt(n)}`, 'play', 'data-readscroll="*"', 'sm tk-readall')}` : '<p class="muted small">No scroll yet: every foe can drop its world\'s scrolls; guardians drop them far more often.</p>'}
    <ul class="tk-how">
      <li>${ui('rare')}<span>Four rarities. <b>Rarer scrolls draw rarer techniques</b>: a Common one mostly Common ones, a Legendary one mostly Epic and Legendary.</span></li>
      <li>${ui('plus')}<span>A technique you already know goes up <b>one level</b> (max 10). Levels 5 and 10 change how it works.</span></li>
      ${cf || realmOpen('hex') ? `<li>${ui('frag')}<span><b>${CURSED_PER_LEVEL} Cursed Fragments</b> raise the technique of your choice by one level (you hold ${fmt(cf)}).</span></li>` : ''}
    </ul></section>`;
}

/* ------------------------------------------------------------ the book */
function tkPips(L) {
  let s = '';
  for (let i = 1; i <= TECH_MAX; i++) s += `<i class="${i <= L ? 'on' : ''} ${TECH_TIERS.includes(i) ? 'tier' : ''}"></i>`;
  return `<span class="tk-pips" title="Level ${L} / ${TECH_MAX}">${s}</span>`;
}
function tkRowHTML(id) {
  const T = TECHNIQUES[id], L = techLv(id), eq = isEquipped(id), r = techRar(id), tgt = L ? tkTarget(id) : -1;
  const nextTier = TECH_TIERS.find((t) => t > L);
  const odds = SCROLL_TIERS.map(([, sr]) => { const o = scrollOdds(scrollId(T.realm, sr)).find((x) => x[0] === id); return o ? `${rarName(sr)} ${Math.round(o[1] * 100)}%` : ''; }).filter(Boolean).join(' · ');
  const slotBtn = !L ? '' : eq
    ? `<button class="tk-eq on" data-tkoff="${id}" title="Remove it from ${esc(TECH_SLOTS[slotOf(id)].name)}">${ui('check')}<span>${esc(TECH_SLOTS[slotOf(id)].name)}</span></button>`
    : tgt < 0 ? `<span class="tk-eq off">${ui('lock')}<span>No ${SLOT_KINDS[techKind(id)]} slot yet</span></span>`
    : `<button class="tk-eq" data-tkeq="${id}" title="Put it in ${esc(TECH_SLOTS[tgt].name)}${loadout()[tgt] && techLv(loadout()[tgt]) ? ` (replaces ${esc(TECHNIQUES[loadout()[tgt]].name)})` : ''}">${ui('play')}<span>Equip · ${esc(TECH_SLOTS[tgt].name)}</span></button>`;
  const inf = L && L < TECH_MAX && count('cursed_fragment') >= CURSED_PER_LEVEL
    ? `<button class="tk-inf" data-infuse="${id}" title="${CURSED_PER_LEVEL} Cursed Fragments: +1 level">${itemIc('cursed_fragment')}<span>Level ${L + 1} · ${CURSED_PER_LEVEL}</span></button>` : '';
  return `<div class="tk-row r${r} ${L ? '' : 'unk'} ${eq ? 'eq' : ''}" style="--rc:${rc(T.realm)}">
    <span class="tk-big">${ic('technique', id)}</span>
    <div class="tk-main">
      <div class="tk-top"><b>${esc(T.name)}</b><span class="tk-rar r${r}">${rarName(r)}</span><span class="tk-cat c-${T.cat}">${catIc(T.cat)}${TECH_CATS[T.cat].name}</span>${T.cd ? `<span class="tk-cd">${ui('spd')}${techCd(id)}s</span>` : ''}</div>
      <p class="tk-desc">${T.desc(Math.max(1, L))}</p>
      <div class="tk-meta">${tkPips(L)}<span class="tk-lv">${L ? `Lv <b>${L}</b>/${TECH_MAX}` : 'Not learned'}</span>
        ${nextTier ? `<span class="tk-next"><em>Lv ${nextTier}</em>${esc(T.tiers[nextTier])}</span>` : `<span class="tk-next done"><em>Mastered</em>${esc(T.tiers[10])}</span>`}</div>
      <small class="tk-when">${esc(TECH_CATS[T.cat].how)}${L < TECH_MAX && odds ? ` · per scroll: ${odds}` : ''}</small>
    </div>
    <div class="tk-act">${slotBtn}${inf}</div></div>`;
}
function tkBookHTML() {
  const ws = techWorlds(), w = tkWorld();
  if (!w) return '';
  const tabs = ws.map((r) => { const n = SCROLL_TIERS.reduce((a, [suf]) => a + Math.floor(count('scroll_' + r + suf)), 0); return `<button class="tk-tab ${r === w ? 'on' : ''}" data-tkworld="${r}" style="--rc:${rc(r)}">${ic('realm', r)}<span>${esc(REALMS[r].name)}</span>${n ? `<em>${n}</em>` : ''}</button>`; }).join('');
  const pool = TECH_POOLS[w].slice().sort((a, b) => techRar(a) - techRar(b)), known = pool.filter(techLv).length;
  return `<section class="win tk-book" style="--rc:${rc(w)}">
    <div class="tk-tabs">${tabs}</div>
    <div class="tk-bookhead"><span><b>${esc(REALMS[w].name)}</b> techniques</span><small>${known} / ${pool.length} learned</small></div>
    <div class="tk-list">${pool.map(tkRowHTML).join('')}</div></section>`;
}

VIEWS.techniques = () => {
  const ids = Object.keys(TECHNIQUES), known = ids.filter(techLv).length;
  return `${ptitle('Your build', 'Techniques', `<span class="pill">${known} / ${ids.length} learned</span>`)}
  ${fitCols('tq-board tk-page', `${introCardHTML('feature:techniques')}${tkLoadoutHTML()}${tkShelfHTML()}`, tkBookHTML())}`;
};

/* ------------------------------------------------------------ reading */
function scrollResultHTML(list) {
  const all = list.flatMap((r) => r.res);
  if (!all.length) return '';
  const fresh = all.filter((r) => r.fresh), ups = {};
  for (const r of all) if (!r.fresh) ups[r.id] = (ups[r.id] || 0) + 1;
  const newCard = (r) => {
    const T = TECHNIQUES[r.id], j = slotOf(r.id);
    const where = j >= 0 ? `<span class="scr-eq on">${ui('check')}Equipped · ${esc(TECH_SLOTS[j].name)}</span>`
      : openSlots().some((s) => s.kind === techKind(r.id)) ? `<span class="scr-eq">${ui('info')}Your ${SLOT_KINDS[techKind(r.id)]} slots are full: swap it on the Techniques page</span>`
      : `<span class="scr-eq">${ui('lock')}No ${SLOT_KINDS[techKind(r.id)]} slot open yet</span>`;
    return `<div class="scr-new pop-in r${techRar(r.id)}" style="--rc:${rc(T.realm)}"><span class="scr-ic">${ic('technique', r.id)}</span>
      <div class="scr-t"><small>${rarName(techRar(r.id))} · ${TECH_CATS[T.cat].name} · ${esc(REALMS[T.realm].name)}</small><b>${esc(T.name)}</b><p>${T.desc(1)}</p>${where}</div></div>`;
  };
  const upRow = (id) => `<li class="pop-in">${ic('technique', id)}<span><b>${esc(TECHNIQUES[id].name)}</b><small>${rarName(techRar(id))}</small></span><em>Lv ${techLv(id)}${ups[id] > 1 ? ` (+${ups[id]})` : ''}</em></li>`;
  const n = all.length;
  return `<div class="scr-res ${fresh.length > 2 ? 'many' : ''}">
    <div class="scr-head"><span class="scr-seal">${ui('technique')}</span><div><small>${n} scroll${n > 1 ? 's' : ''} read</small><h2>${fresh.length ? (fresh.length > 1 ? `${fresh.length} new techniques` : 'New technique') : 'Levels up'}</h2></div></div>
    ${fresh.map(newCard).join('')}
    ${Object.keys(ups).length ? `<ul class="scr-dups">${Object.keys(ups).map(upRow).join('')}</ul>` : ''}</div>`;
}
function readFlow(id, n) {
  const list = id === '*' ? readAllScrolls() : [readScrolls(id, n)].filter((x) => x && x.n);
  if (!list.length) { toast((id !== '*' && scrollBlock(id)) || 'No scroll to read.', 'bad'); return; }
  openModal(scrollResultHTML(list), 'Continue');
  if (typeof selItem !== 'undefined' && id !== '*' && count(id) < 1) selItem = null;
  sideDirty = true;
  dirty = true;
}
// The Bank inspector for a scroll: what it can draw, with the odds, then Read.
function scrollInspect(id) {
  const n = Math.floor(count(id)), odds = scrollOdds(id), block = scrollBlock(id);
  const row = ([t, p]) => `<li><span><i>${ic('technique', t)}</i>${esc(TECHNIQUES[t].name)} <small class="muted">${rarName(techRar(t))}</small></span><b>${techLv(t) ? `Lv ${techLv(t)} → ${techLv(t) + 1}` : 'new'} · ${Math.round(p * 100)}%</b></li>`;
  const body = `${hdr('Can draw', `${rarName(ITEMS[id].srar || 1)} scroll`)}<ul class="srcs">${odds.map(row).join('')}</ul>`;
  const acts = block ? [`<p class="scr-block">${ui('check')}<span>${esc(block)}</span></p>`] : [gbtn('Read 1', 'play', `data-readscroll="${id}:1"`)].concat(n > 1 ? [gbtn(`Read all ×${fmt(n)}`, 'play', `data-readscroll="${id}:all"`, 'dark')] : []);
  return { body, acts };
}

/* ------------------------------------------------------------ the Battlefield tab */
UIX.battleSide.push(() => {
  if (!techOn()) return '';
  const n = techReady();
  return `<section class="win techs">${hdr('Techniques', 'actives fire in order')}
    ${['active', 'passive', 'ultimate'].map((k) => tkGroupHTML(k, { compact: true })).join('')}
    ${n ? gbtn(`Read ${fmt(n)} scroll${n > 1 ? 's' : ''}`, 'play', 'data-readscroll="*"', 'sm') : gbtn('Manage techniques', 'technique', 'data-nav="techniques"', 'dark sm')}</section>`;
});
UIX.actLines.push((skill, a) => {
  const it = a.out && ITEMS[Object.keys(a.out)[0]];
  if (!it || it.type !== 'scroll' || !it.pool) return '';
  return `<div class="ac-note tech-note"><span>${ui('technique')}${rarName(it.srar || 1)} scroll: read it on the Techniques page</span></div>`;
});

/* ------------------------------------------------------------ live */
UPD.push(() => {
  for (const el of $$('[data-techcd]')) {
    const id = el.dataset.techcd, left = Math.max(0, RT.cd[id] || 0);
    el.style.width = (100 * (1 - left / techCd(id))) + '%';
  }
});
on('technique', (d) => {
  if (d.source === 'read') return;
  const T = TECHNIQUES[d.id];
  if (d.fresh) burst('New technique', `${T.name} · ${rarName(techRar(d.id))}`, ic('technique', d.id), rc(T.realm));
});
on('firstscroll', (sid) => { toast(`${ITEMS[sid].name} found: read it on the Techniques page`, 'rare'); sideDirty = true; });
on('techup', (d) => {
  if (d.source === 'read') return;
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
  if (D.readscroll) { const [id, n] = D.readscroll.split(':'); readFlow(id, n === 'all' ? 'all' : +n || 1); }
  else if (D.infuse) { infuseTech(D.infuse); dirty = true; }
  else if (D.tkeq) { const i = tkTarget(D.tkeq); if (i >= 0 && equipTech(i, D.tkeq)) S.ui.tkSlot = null; dirty = true; }
  else if (D.tkoff) { unequipTech(D.tkoff); dirty = true; }
  else if (D.tkmove) { ev.stopPropagation(); const [i, d] = D.tkmove.split(':').map(Number); moveTech(i, d); dirty = true; }
  else if (D.tkworld) { S.ui.tkWorld = D.tkworld; if (S.ui.view !== 'techniques') setView('techniques'); dirty = true; }
  else if (D.tkslot != null && !ev.target.closest('button')) { const i = +D.tkslot; S.ui.tkSlot = S.ui.tkSlot === i ? null : i; dirty = true; }
});
let tkSeen = -1;
UPD.push(() => {
  const n = techReady();
  if (n === tkSeen) return;
  if (tkSeen >= 0) { sideDirty = true; if (inBattleView() || S.ui.view === 'techniques') dirty = true; }
  tkSeen = n;
});
