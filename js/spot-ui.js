'use strict';
/* ==========================================================================
   Fishing & Cooking: one page per skill.
   - the focus panel (focus-ui.js) shows the selected spot / dish: its numbers, Shiny / Perfect odds,
     ingredients, seasoning (Cooking), mastery, the session counter and the one Start / Stop button
   - under it, every spot / dish once, as game cards: one click selects it and starts it
   Loaded after seas-ui.js, workshop-ui.js and skillpage-ui.js.
   ========================================================================== */

const FC = ['fishing', 'cooking'];
const FC_TXT = {
  fishing: { pick: 'Fishing spots', kicker: 'Fishing spot', doing: 'Reeling in', go: 'Cast line', made: 'caught', idle: 'Pick a spot to cast your line' },
  cooking: { pick: 'Dishes', kicker: 'Kitchen', doing: 'Cooking', go: 'Cook', made: 'cooked', idle: 'Pick a dish to light the stove' },
};
const fcOut = (a) => (a && a.out ? Object.keys(a.out)[0] : null);
const fcZone = (a) => fishSpotFor(a.level);
// The colour a card / loadout is tinted with: the sea of its spot, the colour of the dish.
const fcCol = (skill, a) => (skill === 'fishing' ? fcZone(a).sea[0] : DISH_COL[fcOut(a)] || '#e9a35a');

/* ---------------------------------------------------------------- selection */
// What the loadout shows: the card you clicked last; an action started elsewhere takes over.
const FC_LAST = {};
function fcSel(skill) {
  S.ui.fcSel = S.ui.fcSel || {};
  const acts = SKILLS[skill].actions, pick = (id) => id && acts.find((a) => a.id === id);
  const run = S.action && S.action.skill === skill ? S.action.id : null;
  if (run && FC_LAST[skill] !== run) S.ui.fcSel[skill] = run;
  FC_LAST[skill] = run;
  return pick(S.ui.fcSel[skill]) || pick(run)
    || acts.filter((a) => actState(skill, a) === 'ready').sort((a, b) => b.level - a.level)[0] || acts[0];
}

/* ---------------------------------------------------------------- session counter */
// Counts what this run made since you started it: shown over the scene, it ticks up on every catch.
const FC_SESS = {};
function fcSess(skill) {
  const id = S.action && S.action.skill === skill ? S.action.id : null;
  let s = FC_SESS[skill];
  if (!s || s.id !== id) s = FC_SESS[skill] = { id, n: 0, q: 0, xp: 0, kg: 0 };
  return s;
}
function fcSessHTML(skill) {
  const s = fcSess(skill), q = skill === 'fishing' ? 'shiny' : 'perfect';
  return `<span title="This session"><b>${fmt(s.n)}</b> ${FC_TXT[skill].made}</span>`
    + `<span class="q ${s.q ? 'got' : ''}" title="${skill === 'fishing' ? 'Shiny catches' : 'Perfect dishes'} this session">${ui(q)}<b>${fmt(s.q)}</b></span>`
    + `<span title="XP this session">${ui('xp')}<b>+${fmt(s.xp)}</b></span>`
    + (skill === 'fishing' && s.kg ? `<span title="Heaviest catch this session">${ui('record')}<b>${fmtKg(s.kg)}</b></span>` : '');
}
function fcSessDraw(skill) {
  for (const el of $$(`[data-fcsess="${skill}"]`)) { el.innerHTML = fcSessHTML(skill); retrigger(el, 'bump'); }
}

/* ---------------------------------------------------------------- cards */
function fcCard(skill, a, selId) {
  const st = actState(skill, a), o = fcOut(a), locked = wsLocked(st);
  const e = o && QUALITY[skill] ? qEntries(skill).find((x) => x.base === o) : null;
  const qIc = skill === 'fishing' ? 'shiny' : 'perfect';
  // In the slot: how many you own (fish) or can cook (dishes), like an inventory count.
  const n = locked ? null : a.in ? `×<span data-wscan="${skill}:${a.id}">${fmt(wsCan(a))}</span>` : `<span data-fam="${o}">${fmt(familyCount(o))}</span>`;
  const mats = a.in && !locked ? `<span class="fcc-mats">${Object.entries(a.in).map(([m, n]) => `<span class="ws-m ${stock(m) >= n ? 'ok' : ''}" data-wsm="${m}" data-n="${n}" title="${esc(ITEMS[m].name)} ×${n}">${itemIc(m)}</span>`).join('')}</span>` : '';
  const sub = locked ? `${a.schem && !S.known[a.schem] ? ui('schematic') : ui('lock')}Lv ${a.level}` : `Lv ${a.level} · ${fmtTime(actionTime(skill, a))}`;
  return `<button class="fc-card ${a.id === selId ? 'sel' : ''}" data-fcpick="${skill}:${a.id}" data-card="${skill}:${a.id}" data-state="${st}" style="--dc:${fcCol(skill, a)}">
    ${tile(null, n, { r: actRarity(a), icon: actIc(skill, a), mark: actMark(a), cls: 'fcc-tile', title: a.in ? `${a.name}: you can make this many` : `${a.name}: owned` })}
    <span class="fcc-nm"><b>${esc(a.name)}</b><small>${sub}</small></span>
    ${e && !locked ? `<i class="fcc-q ${e.got ? 'got' : e.ready ? 'ready' : ''}" title="${e.got ? `In the ${Q_TITLE[qKind(skill)]}` : e.ready ? 'Ready to hand in' : `Not in the ${Q_TITLE[qKind(skill)]} yet`}">${ui(qIc)}</i>` : ''}
    ${mats}<span class="fcc-run">${FC_TXT[skill].doing}</span><span class="fcc-prog"><i data-cardfill></i></span></button>`;
}
// Fishing: one band per spot (pier, reef, open sea, trench), each painted with its own sea.
function fcFishGrid(sel) {
  const acts = SKILLS.fishing.actions, L = skillLv('fishing');
  return FISH_SPOTS.map((z, i) => {
    const min = i ? FISH_SPOTS[i - 1].max + 1 : 1, list = acts.filter((a) => fcZone(a) === z);
    if (!list.length) return '';
    const open = L >= Math.min(...list.map((a) => a.level));
    return `<div class="fcz ${open ? '' : 'locked'}" style="--z1:${z.sky[1]};--z2:${z.sea[0]};--z3:${z.sea[2]}">
      <div class="fcz-h"><b>${esc(z.name)}</b><small>${open ? `Lv ${min}–${Math.min(99, z.max)}` : `${ui('lock')}Lv ${Math.min(...list.map((a) => a.level))}`}</small></div>
      <div class="fcz-cards">${list.map((a) => fcCard('fishing', a, sel.id)).join('')}</div></div>`;
  }).join('');
}
// Cooking: what you can cook first, then what you are short of, then the next 3 locked dishes.
function fcCookGrid(sel) {
  const acts = SKILLS.cooking.actions, f = (S.ui.fcF = S.ui.fcF || 'all');
  const rank = (a) => ({ active: 0, ready: 1, blocked: 2, missing: 3 }[actState('cooking', a)] ?? 4);
  const open = acts.filter((a) => !wsLocked(actState('cooking', a))).sort((a, b) => rank(a) - rank(b) || b.level - a.level);
  const shown = f === 'ready' ? open.filter((a) => rank(a) < 2) : open;
  const locked = acts.filter((a) => wsLocked(actState('cooking', a))).sort((a, b) => a.level - b.level);
  const next = f === 'ready' ? [] : locked.slice(0, 3);
  return `<div class="fc-grid">${shown.map((a) => fcCard('cooking', a, sel.id)).join('')}${next.map((a) => fcCard('cooking', a, sel.id)).join('')}
    ${!shown.length ? `<div class="fc-empty">${ui('close')}<span>Nothing to cook with what you have. Catch fish first.</span></div>` : ''}
    ${f !== 'ready' && locked.length > next.length ? `<div class="fc-more">${ui('lock')}<span>+${locked.length - next.length} more dishes at higher levels</span></div>` : ''}</div>`;
}
function fcPickHTML(skill, sel) {
  const acts = SKILLS[skill].actions, open = acts.filter((a) => !wsLocked(actState(skill, a))).length;
  let tools = '';
  if (skill === 'cooking') {
    const n = acts.filter((a) => ['ready', 'active'].includes(actState('cooking', a))).length, f = S.ui.fcF || 'all';
    tools = `<nav class="seg fc-seg">${[['all', 'All', open], ['ready', 'Can cook', n]].map(([k, l, c]) => `<button class="${f === k ? 'on' : ''}" data-fcf="${k}"><span>${l}</span><em>${c}</em></button>`).join('')}</nav>`;
  }
  return `<section class="fc-pick"><div class="fcp-h"><h3>${FC_TXT[skill].pick}</h3><small>${open} / ${acts.length} unlocked · click to ${skill === 'fishing' ? 'fish' : 'cook'}</small>${tools}</div>
    ${skill === 'fishing' ? `<div class="fc-zones">${fcFishGrid(sel)}</div>` : fcCookGrid(sel)}</section>`;
}

/* ---------------------------------------------------------------- focus extras */
function fcSpiceHTML() {
  if (!isUnlocked('feature:spices')) return `<div class="fcl-spice off">${ui('lock')}<span><b>Seasoning</b><small>${esc(lockedNote('feature:spices').replace('Locked. ', ''))}</small></span></div>`;
  const cur = S.kitchen.spice, sp = cur && SPICES[cur];
  const line = sp ? (count(sp.item) ? `<b style="color:color-mix(in srgb, ${sp.col} 70%, #fff)">${esc(sp.adj)}</b> · ${esc(spiceText(cur))}` : `<b class="bad">No ${esc(sp.name)} left</b> · dishes come out plain`) : 'Plain · pick one: each dish uses 1';
  return `<div class="fcl-spice"><div class="fcs-h"><b>${ui('spices')}Seasoning</b><small>${line}</small></div>
    <div class="fcs-slots">${SPICE_ORDER.map((k) => {
      const s = SPICES[k], got = S.found[s.item], n = count(s.item), src = sourcesOf(s.item)[0];
      if (!got) return `<button class="fcs locked" data-spice="${k}" title="Not found yet${src ? ': ' + esc(src.text) : ''}">${tile(s.item, null, { cls: 'xs', unknown: true })}</button>`;
      return `<button class="fcs ${cur === k ? 'on' : ''} ${n ? '' : 'empty'}" data-spice="${k}" style="--sc:${s.col}" title="${esc(s.adj)} dishes: ${esc(spiceText(k))}${cur === k ? ' · click again to cook plain' : ''}">${tile(s.item, fmt(n), { cls: 'xs' })}</button>`;
    }).join('')}</div></div>`;
}
// Shiny / Perfect: the odds, and where this one stands in the log (shown in the focus panel).
function fcQHTML(skill, a) {
  const o = fcOut(a), it = o && ITEMS[o];
  if (!it) return '';
  const e = QUALITY[skill] ? qEntries(skill).find((x) => x.base === o) : null, logT = Q_TITLE[qKind(skill)];
  const logChip = !e ? '' : e.got ? `<span class="fcq-log got">${ui('check')}Logged</span>`
    : e.ready ? `<button class="fcq-log ready" data-qclaim="${skill}:${e.base}">${ui(qKind(skill))}Hand in</button>` : `<span class="fcq-log">Not in the ${logT}</span>`;
  if (skill === 'fishing') {
    const rec = S.quality.rec[o];
    return `<div class="fcl-q"><span class="fcq-main" title="Chance per catch of a Shiny ${esc(it.name)}. Grows with this fish's mastery.">${ui('shiny')}<small>Shiny</small><b>${fmtRate(shinyChance('fishing', a))}</b></span>
      ${rec ? `<span class="fcq-rec" title="Your heaviest ${esc(it.name)}">${ui('record')}<small>Record</small><b>${fmtKg(rec)}</b></span>` : ''}${logChip}</div>`;
  }
  const sp = spiceFor('cooking', o);
  return `<div class="fcl-q"><span class="fcq-main" title="Chance per dish to come out Perfect (${it.type === 'food' ? 'heals 50% more' : 'buff 50% stronger'}). Grows with mastery and your level.">${ui('perfect')}<small>Perfect</small><b>${pct(perfectChance('cooking', a))}</b></span>
    ${it.type === 'food' ? `<span class="fcq-rec" title="HP healed in battle">${ui('hp')}<small>Heals</small><b>${fmt(foodHeal(o))}</b></span>` : ''}
    ${sp ? `<span class="fcq-sp" style="--sc:${SPICES[sp].col}" title="${esc(spiceText(sp))}">${gi(SPICES[sp].icon)}${esc(SPICES[sp].adj)}</span>` : ''}${logChip}</div>`;
}

/* ---------------------------------------------------------------- the page */
function fcPage(realm, skill) {
  const sel = fcSel(skill);
  return `<div class="sk-page sk-col fc-page" data-fc="${skill}" style="--rc:${rc(realm)}">
  ${skBannerHTML(realm, skill)}
  ${uix('realmTop', realm, skill)}
  ${focusHTML(skill)}
  ${fcPickHTML(skill, sel)}
  ${skMoreHTML(realm, skill)}
  </div>`;
}
{
  const base = VIEWS.realm;
  VIEWS.realm = (realm, skill) => (FC.includes(skill) ? fcPage(realm, skill) : base(realm, skill));
}

/* ---------------------------------------------------------------- live */
on('action', (d) => {
  if (!FC.includes(d.skill)) return;
  const s = fcSess(d.skill), o = fcOut(d.act);
  if (!o) return;
  for (const k in d.gains) if (baseOf(k) === o) { s.n += d.gains[k]; if (ITEMS[k] && ITEMS[k].q) s.q += d.gains[k]; }
  s.xp += d.xp;
  fcSessDraw(d.skill);
});
on('catch', (d) => {
  const s = fcSess('fishing');
  if (d.kg > s.kg) s.kg = d.kg;
});

/* ---------------------------------------------------------------- input */
document.addEventListener('click', (ev) => {
  const t = ev.target.closest('[data-fcpick], [data-fcf]');
  if (!t) return;
  if (t.dataset.fcf) { S.ui.fcF = t.dataset.fcf; dirty = true; return; }
  const [skill, id] = t.dataset.fcpick.split(':'), a = findAction(skill, id), st = actState(skill, a);
  S.ui.fcSel = S.ui.fcSel || {};
  S.ui.fcSel[skill] = id;
  if (st === 'ready') startAction(skill, id);
  else if (st !== 'active') retrigger(t, 'shake');
  dirty = true;
});
