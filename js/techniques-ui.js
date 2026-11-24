'use strict';
/* ==========================================================================
   TRI-REALM — techniques interface: typed slots on the Battlefield, and the
   Techniques page (collection, fragments, level-ups, tiers). Engine: techniques.js.
   Scrolls wait in the Bank until you read them (2026-11-25): the Techniques page has a
   shelf of unread scrolls, the Bank inspector and the battle dock have a Read button,
   and reading opens a window with what you learned.
   ========================================================================== */

VIEW_FEATURE.techniques = 'techniques';
UIX.quick.push(() => (techOn() ? [['techniques', 'technique', 'Techniques']] : []));
const catIc = (cat) => ui(TECH_CATS[cat].icon);
const tagList = (id) => TECHNIQUES[id].tags.map((t) => `<i class="ttag">${t}</i>`).join('');
const scrollName = (r) => SCROLL_NAME[r] || `${REALMS[r].name} Scroll`;

// One slot: what sits there, its cooldown, and a picker limited to its category.
function techSlotHTML(sl) {
  if (!sl.open()) return `<div class="tslot locked">${catIc(sl.cat)}<span><b>${sl.name}</b> · ${sl.hint}</span></div>`;
  const cur = S.tech.slots[sl.id], pool = Object.keys(TECHNIQUES).filter((id) => techLv(id) && TECHNIQUES[id].cat === sl.cat);
  return `<div class="tslot ${cur ? 'on' : ''}" data-cat="${sl.cat}"><span class="ts-ic"${cur ? ` data-ttip="${cur}"` : ''}>${cur ? ic('technique', cur) : catIc(sl.cat)}</span>
    <select data-techslot="${sl.id}"><option value="">${sl.name} · ${pool.length ? 'empty' : 'no technique yet'}</option>${pool.map((id) => `<option value="${id}" ${cur === id ? 'selected' : ''}>${TECHNIQUES[id].name} · Lv ${techLv(id)}</option>`).join('')}</select>
    ${cur ? `<small>${TECHNIQUES[cur].desc(techLv(cur))}${TECHNIQUES[cur].cd ? ` · ${techCd(cur)}s` : ''}</small>${TECHNIQUES[cur].cd ? `<span class="tcd"><i data-techcd="${cur}"></i></span>` : ''}` : ''}</div>`;
}
// On the Battlefield: the open slots, plus the next one to open.
UIX.battleSide.push(() => {
  if (!techOn()) return '';
  const nextLocked = TECH_SLOTS.find((x) => !x.open());
  return `<section class="win techs">${hdr('Techniques', 'fire on their own when ready')}
    <div class="tslots">${TECH_SLOTS.filter((s) => s.open() || s === nextLocked).map(techSlotHTML).join('')}</div>
    ${gbtn('All techniques', 'technique', 'data-nav="techniques"', 'dark sm')}</section>`;
});

function techCardHTML(id) {
  const T = TECHNIQUES[id], L = techLv(id);
  if (!L) return `<div class="tcard unknown"><span class="tc-ic" data-ttip="${id}">${ui('lock')}</span><div class="tc-main"><b>???</b><small>${TECH_CATS[T.cat].name} · ${esc(scrollName(T.realm))}</small></div></div>`;
  const c = fragCost(id), f = techFrag(id), eqd = isEquipped(id);
  const tiers = TECH_TIERS.map((t) => `<li class="${L >= t ? 'got' : ''}"><em>Lv ${t}</em>${T.tiers[t]}</li>`).join('');
  return `<div class="tcard ${eqd ? 'eq' : ''}" style="--rc:${rc(T.realm)}">
    <span class="tc-ic">${ic('technique', id)}</span>
    <div class="tc-main"><b>${T.name}</b><small>${catIc(T.cat)}${TECH_CATS[T.cat].name}${T.cd ? ` · ${T.cd}s` : ''} ${tagList(id)}</small></div>
    <span class="tc-lv"><small>Lv</small>${L}<small>/${TECH_MAX}</small></span>
    <p class="tc-desc">${T.desc(L)}</p>
    <ul class="tc-tiers">${tiers}</ul>
    <div class="tc-foot">${L < TECH_MAX
      ? `<span class="tc-frag">${ui('frag')}<b>${f}</b>/${c} fragments</span>${f < c && count('cursed_fragment') ? gbtn(`Cursed ×${Math.min(c - f, count('cursed_fragment'))}`, 'frag', `data-infuse="${id}"`, 'dark sm') : ''}${gbtn(`Level ${L + 1}`, 'plus', `data-techup="${id}" ${f < c ? 'disabled' : ''}`, 'sm')}`
      : `<span class="tc-frag">${ui('star')}Mastered</span>`}
      ${eqd ? `<span class="pill">${ui('check')}Equipped</span>` : slotFor(id) ? gbtn('Equip', 'play', `data-techeq="${id}"`, 'dark sm') : ''}</div>
  </div>`;
}
/* ------------------------------------------------------------ reading scrolls */
// What a stack can teach: its world's pool, or its one technique.
const scrollPool = (id) => (ITEMS[id].tech ? [ITEMS[id].tech] : TECH_POOLS[ITEMS[id].pool] || []);
// The window after reading: new techniques as big cards first, then fragments per technique.
function scrollResultHTML(list) {
  const all = list.flatMap((r) => r.res), n = all.length;
  if (!n) return '';
  const fresh = all.filter((r) => r.fresh), frag = {};
  for (const r of all) if (!r.fresh) frag[r.id] = (frag[r.id] || 0) + r.frag;
  const slotOf = (id) => TECH_SLOTS.find((s) => S.tech.slots[s.id] === id);
  const newCard = (r, i) => {
    const T = TECHNIQUES[r.id], sl = slotOf(r.id), open = TECH_SLOTS.find((s) => s.cat === T.cat && s.open());
    const where = sl ? `<span class="scr-eq on">${ui('check')}Equipped · ${esc(sl.name)}</span>`
      : open ? `<span class="scr-eq">${ui('info')}${esc(open.name)} is taken: swap it on the Techniques page</span>`
      : `<span class="scr-eq">${ui('lock')}No ${esc(TECH_CATS[T.cat].name)} slot open yet</span>`;
    return `<div class="scr-new pop-in" style="--rc:${rc(T.realm)}">
      <span class="scr-ic">${ic('technique', r.id)}</span>
      <div class="scr-t"><small>${catIc(T.cat)}${TECH_CATS[T.cat].name} · ${esc(REALMS[T.realm].name)}${T.cd ? ` · every ${T.cd}s` : ''}</small><b>${esc(T.name)}</b>
        <p>${T.desc(1)}</p>${where}</div></div>`;
  };
  const dupRow = (id) => {
    const T = TECHNIQUES[id], L = techLv(id), c = fragCost(id), f = techFrag(id), ready = L < TECH_MAX && f >= c;
    return `<li class="pop-in">${ic('technique', id)}<span><b>${esc(T.name)}</b><small>Lv ${L}${L < TECH_MAX ? ` · ${f} / ${c} fragments` : ' · mastered'}</small></span>
      <em>+${frag[id]}</em>${ready ? `<i class="scr-ready">${ui('plus')}Level ${L + 1} ready</i>` : ''}</li>`;
  };
  const src = list.length === 1 ? ITEMS[list[0].id] : null;
  const title = fresh.length ? (fresh.length > 1 ? `${fresh.length} new techniques` : 'New technique') : 'Fragments';
  return `<div class="scr-res ${fresh.length > 2 ? 'many' : ''}">
    <div class="scr-head"><span class="scr-seal">${src ? itemIc(list[0].id) : ui('technique')}</span>
      <div><small>${n > 1 ? `${n} scrolls unsealed` : `${esc(src ? src.name : 'Scroll')} unsealed`}</small><h2>${title}</h2></div></div>
    ${fresh.map(newCard).join('')}
    ${Object.keys(frag).length ? `<ul class="scr-dups">${Object.keys(frag).map(dupRow).join('')}</ul>` : ''}
    <div class="scr-cta">${gbtn('Techniques', 'technique', 'data-realmgo="techniques"', 'dark sm')}</div></div>`;
}
function readFlow(id, n) {
  const list = id === '*' ? readAllScrolls() : [readScrolls(id, n)].filter(Boolean);
  if (!list.length) { toast((id !== '*' && scrollBlock(id)) || 'No scroll to read.', 'bad'); return; }
  openModal(scrollResultHTML(list), 'Continue');
  if (typeof selItem !== 'undefined' && id !== '*' && !count(id)) selItem = null;
  sideDirty = true;
  dirty = true;
}
// A shelf card: one stack, what it can teach, Read / Read all.
function scrollShelfCard(id) {
  const it = ITEMS[id], n = count(id), pool = scrollPool(id), known = pool.filter(techLv).length, block = scrollBlock(id);
  const what = it.tech ? (techLv(it.tech) ? `${TECHNIQUES[it.tech].name} · Lv ${techLv(it.tech)}: +${FRAG_PER_DUP} fragments` : `Teaches ${TECHNIQUES[it.tech].name}`)
    : `${known} / ${pool.length} learned · ${known < pool.length ? 'new ones 3× as likely' : 'duplicates give fragments'}`;
  return `<div class="scr-card ${block ? 'off' : ''}">${tile(id, '×' + fmt(n))}<span class="scr-ct"><b>${esc(it.name)}</b><small>${esc(block || what)}</small></span>
    <span class="scr-cb">${gbtn('Read', 'play', `data-readscroll="${id}:1" ${block ? 'disabled' : ''}`, 'sm')}${n > 1 ? gbtn(`All ×${fmt(n)}`, '', `data-readscroll="${id}:all" ${block ? 'disabled' : ''}`, 'dark sm') : ''}</span></div>`;
}
function scrollShelfHTML() {
  const ids = scrollIds().sort((a, b) => (ITEMS[a].tech ? 1 : 0) - (ITEMS[b].tech ? 1 : 0) || count(b) - count(a));
  if (!ids.length) return '';
  const n = scrollsOwned();
  return `<section class="win scr-shelf">${hdr('Scrolls to read', `${fmt(n)} in your Bank`)}
    <div class="scr-cards">${ids.map(scrollShelfCard).join('')}</div>
    ${ids.length > 1 ? `<div class="scr-all">${gbtn(`Read every scroll ×${fmt(n)}`, 'play', 'data-readscroll="*"', 'sm')}</div>` : ''}</section>`;
}
// The Bank inspector for a scroll: what it can teach, then Read.
function scrollInspect(id) {
  const it = ITEMS[id], n = count(id), pool = scrollPool(id), block = scrollBlock(id);
  const row = (t) => `<li><span><i>${techLv(t) ? ic('technique', t) : ui('lock')}</i>${techLv(t) ? esc(TECHNIQUES[t].name) : '???'}</span><b>${techLv(t) ? `Lv ${techLv(t)}` : TECH_CATS[TECHNIQUES[t].cat].name}</b></li>`;
  const body = it.tech
    ? `${hdr('Teaches')}<p class="scr-one">${ic('technique', it.tech)}<span><b>${esc(TECHNIQUES[it.tech].name)}</b> · ${TECHNIQUES[it.tech].desc(Math.max(1, techLv(it.tech)))}</span></p><p class="muted small">${techLv(it.tech) ? `Known: reading it gives ${FRAG_PER_DUP} fragments.` : 'Read it to learn it.'}</p>`
    : `${hdr('Can teach', `${pool.filter(techLv).length} / ${pool.length} learned`)}<ul class="srcs">${pool.map(row).join('')}</ul><p class="muted small">A random one; techniques you don't know come up 3× as often. A known one gives ${FRAG_PER_DUP} fragments.</p>`;
  const acts = block ? [gbtn(block, 'lock', 'disabled')] : [gbtn('Read 1', 'play', `data-readscroll="${id}:1"`)].concat(n > 1 ? [gbtn(`Read all ×${fmt(n)}`, 'play', `data-readscroll="${id}:all"`, 'dark')] : []);
  return { body, acts };
}

VIEWS.techniques = () => {
  const ids = Object.keys(TECHNIQUES), known = ids.filter(techLv).length;
  const byWorld = WORLD_ORDER.filter((r) => TECH_POOLS[r] && realmOpen(r)).map((r) => `
    <section class="win" style="--rc:${rc(r)}">${hdr(`${REALMS[r].name} · ${esc(scrollName(r))}`, `${TECH_POOLS[r].filter(techLv).length} / ${TECH_POOLS[r].length} learned`)}
      <div class="tcards">${TECH_POOLS[r].map(techCardHTML).join('')}</div></section>`).join('');
  return `${ptitle('Your build', 'Techniques', `<span class="pill">${known} / ${ids.length} learned</span>`)}
  ${introCardHTML('feature:techniques')}${scrollShelfHTML()}
  <section class="win">${hdr('Slots', 'one technique per slot, matched by type · they fire in this order')}
    <div class="tslots wide">${TECH_SLOTS.map(techSlotHTML).join('')}</div></section>
  <p class="muted small tc-help">Every foe drops its world's scroll now and then (bosses often); it waits in your Bank until you read it. A scroll teaches a random technique of that world; unknown ones come up 3× as often.
  A technique you already know gives <b>${FRAG_PER_DUP} fragments</b> instead, and fragments level it up. Levels 5 and 10 change how it works.
  Crafting can also write the scroll of one chosen technique, and Cursed Fragments from Cursed Research count for any technique.</p>
  ${byWorld}`;
};

UIX.actLines.push((skill, a) => {
  const it = a.out && ITEMS[Object.keys(a.out)[0]];
  if (!it || it.type !== 'scroll' || !it.tech) return '';
  const L = techLv(it.tech), T = TECHNIQUES[it.tech];
  return `<div class="ac-note tech-note"><span>${ic('technique', it.tech)}${L ? `Lv ${L}/${TECH_MAX} · gives ${FRAG_PER_DUP} fragments` : 'Not learned yet'}</span><span class="muted">${T.desc(Math.max(1, L))}</span></div>`;
});

UPD.push(() => {
  for (const el of $$('[data-techcd]')) {
    const id = el.dataset.techcd, left = Math.max(0, RT.cd[id] || 0);
    el.style.width = (100 * (1 - left / techCd(id))) + '%';
  }
});
// Reading opens its own window (readFlow); anything learned another way still says so.
on('technique', (d) => {
  if (d.source === 'read') return;
  const T = TECHNIQUES[d.id];
  if (d.fresh) burst('New technique', `${T.name} · ${TECH_CATS[T.cat].name}`, ic('technique', d.id), rc(T.realm));
  else toast(`${T.name}: +${d.frag} fragments`, 'good');
});
// Your first scroll: one line in the feed, pointing at where to read it.
on('firstscroll', (sid) => { toast(`${ITEMS[sid].name} found: read it on the Techniques page`, 'rare'); sideDirty = true; });
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
  const t = ev.target.closest('button');
  if (!t || t.disabled) return;
  if (t.dataset.readscroll) { const [id, n] = t.dataset.readscroll.split(':'); readFlow(id, n === 'all' ? 'all' : +n || 1); }
  else if (t.dataset.techup) upgradeTech(t.dataset.techup);
  else if (t.dataset.infuse) infuseTech(t.dataset.infuse);
  else if (t.dataset.techeq) { const sl = slotFor(t.dataset.techeq); if (sl) equipTech(sl.id, t.dataset.techeq); }
});
document.addEventListener('change', (ev) => {
  const d = ev.target.dataset;
  if (d.techslot !== undefined) { equipTech(d.techslot, ev.target.value); ev.target.blur(); }
});
