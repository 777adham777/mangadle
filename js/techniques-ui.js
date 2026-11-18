'use strict';
/* ==========================================================================
   TRI-REALM — techniques interface: typed slots on the Battlefield, and the
   Techniques page (collection, fragments, level-ups, tiers). Engine: techniques.js.
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
  return `<div class="tslot ${cur ? 'on' : ''}" data-cat="${sl.cat}"><span class="ts-ic">${cur ? ic('technique', cur) : catIc(sl.cat)}</span>
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
  if (!L) return `<div class="tcard unknown"><span class="tc-ic">${ui('lock')}</span><div class="tc-main"><b>???</b><small>${TECH_CATS[T.cat].name} · ${esc(scrollName(T.realm))}</small></div></div>`;
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
VIEWS.techniques = () => {
  const ids = Object.keys(TECHNIQUES), known = ids.filter(techLv).length;
  const byWorld = WORLD_ORDER.filter((r) => TECH_POOLS[r] && realmOpen(r)).map((r) => `
    <section class="win" style="--rc:${rc(r)}">${hdr(`${REALMS[r].name} · ${esc(scrollName(r))}`, `${TECH_POOLS[r].filter(techLv).length} / ${TECH_POOLS[r].length} learned`)}
      <div class="tcards">${TECH_POOLS[r].map(techCardHTML).join('')}</div></section>`).join('');
  return `${ptitle('Your build', 'Techniques', `<span class="pill">${known} / ${ids.length} learned</span>`)}
  <section class="win">${hdr('Slots', 'one technique per slot, matched by type · they fire in this order')}
    <div class="tslots wide">${TECH_SLOTS.map(techSlotHTML).join('')}</div></section>
  <p class="muted small tc-help">Every foe drops its world's scroll now and then (bosses often). A scroll teaches a random technique of that world; unknown ones come up 3× as often.
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
UIX.inspectorAny.push((id) => (ITEMS[id] && ITEMS[id].type === 'scroll' && ITEMS[id].pool ? `<p class="muted small">Read at once when found: teaches a random ${REALMS[ITEMS[id].pool].name} technique.</p>` : ''));

UPD.push(() => {
  for (const el of $$('[data-techcd]')) {
    const id = el.dataset.techcd, left = Math.max(0, RT.cd[id] || 0);
    el.style.width = (100 * (1 - left / techCd(id))) + '%';
  }
});
on('technique', (d) => {
  const T = TECHNIQUES[d.id];
  if (d.fresh) burst('New technique', `${T.name} · ${TECH_CATS[T.cat].name}`, ic('technique', d.id), rc(T.realm));
  else toast(`${T.name}: +${d.frag} fragments`, 'good');
});
on('techup', (d) => {
  const T = TECHNIQUES[d.id];
  if (TECH_TIERS.includes(d.lv)) burst(`${T.name} · Lv ${d.lv}`, T.tiers[d.lv], ic('technique', d.id), rc(T.realm));
  else toast(`${T.name} reached level ${d.lv}.`, 'good');
});
on('tech', (d) => {
  if (!inBattleView()) return;
  const el = $('[data-portrait="player"]');
  floatAt(el, d.heal ? `+${fmt(d.heal)}${ui('hp')}` : `<small>${esc(TECHNIQUES[d.id].name)}</small>`, d.heal ? 'heal' : 'xp', 0, -30);
});

document.addEventListener('click', (ev) => {
  const t = ev.target.closest('button');
  if (!t || t.disabled) return;
  if (t.dataset.techup) upgradeTech(t.dataset.techup);
  else if (t.dataset.infuse) infuseTech(t.dataset.infuse);
  else if (t.dataset.techeq) { const sl = slotFor(t.dataset.techeq); if (sl) equipTech(sl.id, t.dataset.techeq); }
});
document.addEventListener('change', (ev) => {
  const d = ev.target.dataset;
  if (d.techslot !== undefined) { equipTech(d.techslot, ev.target.value); ev.target.blur(); }
});
