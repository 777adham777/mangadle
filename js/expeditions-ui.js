'use strict';
/* ==========================================================================
   ANIME IDLE RPG — expeditions interface: the harbour (ships at sea, trip length,
   provisions, repeat) and destination cards. Engine: expeditions.js.
   ========================================================================== */

const durName = (d) => (EXP_DURS.find((x) => x[0] === d) || [0, fmtTime(d)])[1];

function harbourHTML() {
  const E = S.exped, n = shipSlots();
  const ship = (sh, i) => {
    const a = findAction('voyaging', sh.id);
    return `<div class="ship-row">${tile(null, null, { r: actRarity(a), icon: ic('voyage', a.id), cls: 'xs' })}
      <span class="sr-main"><b>${esc(a.name)}</b><small>${durName(sh.dur)} · ~${fmt(expHauls(a, sh.dur, sh.food))} hauls${sh.food ? ` · ${ui('food')}provisions` : ''}</small>
        <span class="pbar"><i data-shipfill="${i}" style="width:${100 * (1 - sh.left / sh.dur)}%"></i></span></span>
      <span class="sr-left" data-shipleft="${i}">${fmtTime(Math.max(0, sh.left))}</span>
      <button class="mini-btn" data-recall="${i}" title="Call the ship back (its hull wood and provisions are lost)">${ui('close')}</button></div>`;
  };
  const rows = E.ships.map(ship);
  for (let i = E.ships.length; i < n; i++) rows.push(`<div class="ship-row free">${ui('play')}<span>Free ship</span></div>`);
  if (n < 2) rows.push(`<div class="ship-row locked">${ui('lock')}<span>Second ship at Voyaging 30</span></div>`);
  const L = E.last, la = L && findAction('voyaging', L.id);
  return `<section class="win harbour">${hdr('Harbour', `${E.ships.length} / ${n} at sea`)}
    <div class="ships">${rows.join('')}</div>
    <div class="exp-ctl">
      <div class="ctrl"><label>Trip</label><div class="seg">${EXP_DURS.map(([d, l, b]) => `<button class="${E.dur === d ? 'on' : ''}" data-expdur="${d}" title="${b ? `+${b * 100}% hauls` : 'Shortest trip'}"><span>${l}</span></button>`).join('')}</div></div>
      <label class="tog"><input type="checkbox" data-expfood ${E.food ? 'checked' : ''}><span>Pack provisions (+${EXP_FOOD * 100}% hauls)</span></label>
      <label class="tog"><input type="checkbox" data-exprepeat ${E.repeat ? 'checked' : ''}><span>Send ships out again on return</span></label>
    </div>
    ${L && la ? `<div class="exp-last"><small>Last return · ${esc(la.name)} · ${fmt(L.hauls)} hauls</small><div class="tiles">${tile(null, fmt(L.gold), { r: 3, icon: ui('gold'), cls: 'xs', title: 'Gold' })}${Object.entries(L.gains).sort((x, y) => ITEMS[y[0]].value * y[1] - ITEMS[x[0]].value * x[1]).slice(0, 9).map(([k, q]) => tile(k, fmt(q), { cls: 'xs' })).join('')}</div></div>` : ''}
  </section>`;
}
UIX.realmTop.push((realm, skill) => (skill === 'voyaging' ? harbourHTML() : ''));

// Destination card: what one trip of the chosen length costs and brings back.
function expCard(a) {
  const dur = S.exped.dur, c = expCost(a, dur), why = expBlock(a, dur), food = S.exped.food && stock(c.dish) >= c.dishN;
  const hauls = expHauls(a, dur, food), r = actRarity(a);
  const art = tile(null, null, { r, icon: actIc('voyaging', a), title: a.name, cls: 's' });
  const io = (k, n, opt) => tile(k, `<em data-have="${k}" data-n="${n}">${fmt(stock(k))}</em>/${fmt(n)}`, { cls: 'xs ' + (stock(k) < n ? (opt ? 'dim' : 'short') : ''), title: ITEMS[k].name });
  return `<button class="acard exp" data-exped="${a.id}" data-card="voyaging:${a.id}" data-state="${why ? 'blocked' : 'ready'}" ${why ? 'aria-disabled="true"' : ''}>
    <div class="ac-head">${art}<div class="ac-name"><b>${esc(a.name)}</b><small>Expedition · Lv ${a.level}</small></div><span class="ac-cta" title="${esc(why)}">${why ? `${ui('close')}${S.exped.ships.length >= shipSlots() ? 'No free ship' : why.startsWith('Needs') ? 'Need wood' : esc(why)}` : `${ui('play')}Send`}</span></div>
    <div class="ac-stats"><span title="Trip length">${ui('time')}<b>${durName(dur)}</b></span><span title="Hauls of loot it brings back">${ui('chest')}<b>~${fmt(hauls)}</b> hauls</span><span title="Voyaging XP on return"><b>${fmt(a.xp * EXP_XP * hauls * skillXpMult('voyaging'))}</b> xp</span></div>
    <div class="ac-io"><small>Hull</small>${io(c.hull, c.hullN)}<small>Food</small>${io(c.dish, c.dishN, true)}</div>
    <div class="ac-io"><small>Per haul</small>${tile(null, `${fmt(a.loot.gold[0] * goldMult())}+`, { r: 3, icon: ui('gold'), cls: 'xs', title: 'Gold' })}${a.loot.table.map(([k]) => tile(k, null, { cls: 'xs', unknown: !isFound(k) })).join('')}${(a.extra || []).map(([k, ch]) => tile(k, fmtRate(ch), { cls: 'xs', unknown: !isFound(k), r: rarity(k) })).join('')}</div>
    <div class="ac-io"><small>Rare</small>${a.loot.rare.map(([k, ch]) => tile(k, fmtRate(ch * luckMult()), { cls: 'xs', unknown: !isFound(k), r: rarity(k) })).join('')}</div>
    <div class="ac-foot"><span class="ac-own">${S.exped.ships.filter((s) => s.id === a.id).length ? `${ui('check')} A ship sails here` : ''}</span>
      <span class="ac-m" title="Mastery: one point per haul">${ui('mastery')}<b>${masteryLv('voyaging', a.id)}</b></span></div>
  </button>`;
}

UPD.push(() => {
  S.exped.ships.forEach((sh, i) => {
    for (const el of $$(`[data-shipleft="${i}"]`)) setText(el, fmtTime(Math.max(0, sh.left)));
    for (const el of $$(`[data-shipfill="${i}"]`)) el.style.width = (100 * (1 - sh.left / sh.dur)) + '%';
  });
});
on('expsend', () => { dirty = true; });
on('expedition', (d) => {
  setLast('voyaging', `<small>Back from ${esc(d.act.name)}</small><b>${fmt(d.hauls)} hauls</b><em>${ui('gold')}${fmt(d.gold)}</em>`);
  toast(`Your ship is back from ${d.act.name}: ${fmt(d.gold)} gold, ${Object.keys(d.gains).length} kinds of loot.`, 'good');
});

document.addEventListener('click', (ev) => {
  const t = ev.target.closest('button');
  if (!t || t.disabled) return;
  const d = t.dataset;
  if (d.exped) sendExp(d.exped);
  else if (d.expdur) { S.exped.dur = +d.expdur; dirty = true; }
  else if (d.recall !== undefined) { if (confirm('Call this ship back? Its hull wood and provisions are lost.')) recallShip(+d.recall); }
});
document.addEventListener('change', (ev) => {
  const d = ev.target.dataset;
  if ('expfood' in d) { S.exped.food = ev.target.checked; dirty = true; }
  else if ('exprepeat' in d) { S.exped.repeat = ev.target.checked; dirty = true; }
});
