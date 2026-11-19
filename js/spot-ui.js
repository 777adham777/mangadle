'use strict';
/* ==========================================================================
   Fishing & Cooking: one game screen per skill (replaces the stage + picker + card grid / workshop).
   - left: the scene, with a HUD drawn over it (where you are, the last catch / dish, the cast or
     cook bar with Stop, a session counter that ticks up), and under it every spot / dish once,
     as game cards: one click starts it
   - right: the loadout of the selected spot / dish: its numbers, Shiny / Perfect odds, ingredients,
     mastery, the seasoning (Cooking) and one big Start button
   Per hour / level up / left stay in the activity bar at the top, so they are not repeated here.
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

/* ---------------------------------------------------------------- scene HUD */
function fcHudHTML(skill) {
  const a = S.action && S.action.skill === skill ? findAction(skill, S.action.id) : null;
  if (!a) {
    const busy = S.action ? `${esc(SKILLS[S.action.skill].name)} · ${esc(findAction(S.action.skill, S.action.id).name)}` : '';
    return `<div class="fc-hud idle"><div class="fc-idle">${busy ? `<small>Busy with ${busy}</small>` : ''}<b>${FC_TXT[skill].idle}</b><i class="fc-chev"></i></div></div>`;
  }
  return `<div class="fc-hud">
    <div class="fch-sess" data-fcsess="${skill}">${fcSessHTML(skill)}</div>
    <div class="fch-cast">
      ${tile(null, null, { r: actRarity(a), icon: actIc(skill, a), mark: actMark(a), cls: 'xs', title: a.name })}
      <span class="fch-main"><span class="fch-l"><small>${FC_TXT[skill].doing}</small><b>${esc(a.name)}</b><em data-nowtime></em></span>
        <span class="fch-bar"><i data-nowfill></i></span></span>
      <button class="fch-stop" data-stop title="Stop">${ui('stop')}</button>
    </div></div>`;
}
// Idle, the fishing scene shows the spot of the selected fish.
function fcSceneHTML(skill) {
  return spotHTML(skill, { hud: fcHudHTML(skill), kicker: FC_TXT[skill].kicker, look: fcSel(skill) });
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

/* ---------------------------------------------------------------- loadout */
function fcCtaHTML(skill, a, st) {
  st = st || actState(skill, a);
  if (st === 'active') return `${ui('stop')}<span>Stop</span>`;
  if (st === 'missing') return `${ui('close')}<span>Missing ${skill === 'cooking' ? 'ingredients' : 'items'}</span>`;
  if (st === 'blocked') return `${ui('lock')}<span>${esc(actionBlock(skill, a).split('.')[0])}</span>`;
  if (wsLocked(st)) return `${ui('lock')}<span>Level ${a.level}</span>`;
  return `${ui('play')}<span>${FC_TXT[skill].go}</span>`;
}
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
function fcLoadHTML(skill, a) {
  const st = actState(skill, a), o = fcOut(a), it = o && ITEMS[o], r = actRarity(a), locked = wsLocked(st);
  const kind = skill === 'fishing' ? `Fish · ${fcZone(a).name}` : it ? typeLabel(o) : 'Dish';
  const head = `<div class="fcl-head">${tile(null, null, { r, icon: actIc(skill, a), mark: actMark(a), cls: 'fcl-tile', title: a.name })}
    <div class="fcl-t"><small>${esc(kind)}</small><h2>${esc(a.name)}</h2>${stars(r)}</div>
    ${o && !locked ? `<span class="fcl-own"><small>Owned</small><b data-fam="${o}">${fmt(familyCount(o))}</b></span>` : ''}</div>`;
  const cta = `<button class="fcl-cta" data-act="${skill}:${a.id}" data-fccta ${locked ? 'disabled' : ''}><span class="fcl-cta-l">${fcCtaHTML(skill, a, st)}</span><span class="fcl-cta-p"><i data-cardfill></i></span></button>`;
  if (locked) {
    const L = skillLv(skill), schem = a.schem && !S.known[a.schem];
    return `<section class="win fc-load" data-card="${skill}:${a.id}" data-state="${st}" style="--dc:${fcCol(skill, a)}">${head}
      <ul class="fcl-req"><li class="${L >= a.level ? 'ok' : ''}">${ui(L >= a.level ? 'check' : 'lock')}<span>${SKILLS[skill].name} level ${a.level}</span><em>${L} / ${a.level}</em></li>
        ${a.schem ? `<li class="${schem ? '' : 'ok'}">${ui(schem ? 'schematic' : 'check')}<span>${esc(ITEMS[a.schem].name)}</span><em>${schem ? 'Not found yet' : 'Learned'}</em></li>` : ''}</ul>
      ${a.in ? `<div class="fcl-ing locked">${Object.entries(a.in).map(([k, n]) => tile(k, `×${n}`, { cls: 'xs' })).join('')}</div>` : ''}
      ${cta}</section>`;
  }
  const f = farmRates(skill, a), ml = masteryLv(skill, a.id);
  const stats = `<div class="fcl-stats">
    <span title="Time per ${skill === 'fishing' ? 'catch' : 'dish'}">${ui('time')}<b>${fmtTime(f.T)}</b><small>each</small></span>
    <span title="XP per action">${ui('xp')}<b>${fmt(a.xp * skillXpMult(skill))}</b><small>xp each</small></span>
    <span title="XP per hour">${ui('xp')}<b>${fmt(f.xph)}</b><small>xp / h</small></span>
    <span title="Per hour, doubles included">${ui('spd')}<b>${fmt(f.itemsh || f.per)}</b><small>per hour</small></span></div>`;
  // Shiny / Perfect: the odds, and where this one stands in the log.
  let q = '';
  const e = o && QUALITY[skill] ? qEntries(skill).find((x) => x.base === o) : null, logT = Q_TITLE[qKind(skill)];
  const logChip = !e ? '' : e.got ? `<span class="fcq-log got">${ui('check')}Logged</span>`
    : e.ready ? `<button class="fcq-log ready" data-qclaim="${skill}:${e.base}">${ui(qKind(skill))}Hand in</button>` : `<span class="fcq-log">Not in the ${logT}</span>`;
  if (skill === 'fishing') {
    const rec = S.quality.rec[o];
    q = `<div class="fcl-q"><span class="fcq-main" title="Chance per catch of a Shiny ${esc(it.name)}. Grows with this fish's mastery.">${ui('shiny')}<small>Shiny</small><b>${fmtRate(shinyChance('fishing', a))}</b></span>
      ${rec ? `<span class="fcq-rec" title="Your heaviest ${esc(it.name)}">${ui('record')}<small>Record</small><b>${fmtKg(rec)}</b></span>` : ''}${logChip}</div>`;
  } else {
    const sp = spiceFor('cooking', o);
    q = `<div class="fcl-q"><span class="fcq-main" title="Chance per dish to come out Perfect (${it.type === 'food' ? 'heals 50% more' : 'buff 50% stronger'}). Grows with mastery and your level.">${ui('perfect')}<small>Perfect</small><b>${pct(perfectChance('cooking', a))}</b></span>
      ${it.type === 'food' ? `<span class="fcq-rec" title="HP healed in battle">${ui('hp')}<small>Heals</small><b>${fmt(foodHeal(o))}</b></span>` : ''}
      ${sp ? `<span class="fcq-sp" style="--sc:${SPICES[sp].col}" title="${esc(spiceText(sp))}">${gi(SPICES[sp].icon)}${esc(SPICES[sp].adj)}</span>` : ''}${logChip}</div>`;
  }
  const ing = a.in ? `<div class="fcl-ingw"><h4>Ingredients<span>can make <b data-wscan="${skill}:${a.id}">${fmt(wsCan(a))}</b></span></h4>
    <div class="fcl-ing">${Object.entries(a.in).map(([k, n]) => tile(k, `<em data-have="${k}" data-n="${n}">${fmt(stock(k))}</em>/${fmt(n)}`, { cls: 'xs ' + (stock(k) < n ? 'short' : '') })).join('')}</div></div>` : '';
  const extra = uix('actLines', skill, a).replace(/<div class="ac-note q-line">[\s\S]*?<\/div>/, '');   // the q-line is already in the loadout
  return `<section class="win fc-load" data-card="${skill}:${a.id}" data-state="${st}" style="--dc:${fcCol(skill, a)}">${head}${stats}${q}${ing}
    ${skill === 'cooking' ? fcSpiceHTML() : ''}${extra}
    <div class="fcl-mast" title="Mastery: each level makes this ${skill === 'fishing' ? 'catch' : 'dish'} 0.3% faster and adds 0.2% chance to double">${ui('mastery')}<span>Mastery <b data-mlv="${skill}:${a.id}">${ml}</b></span><span class="bar"><i data-mfill="${skill}:${a.id}"></i></span></div>
    ${cta}</section>`;
}

/* ---------------------------------------------------------------- the page */
function fcPage(realm, skill) {
  const sel = fcSel(skill);
  return `<div class="sk-page sk-col fc-page" data-fc="${skill}" style="--rc:${rc(realm)}">
  ${skBannerHTML(realm, skill)}
  ${uix('realmTop', realm, skill)}
  <div class="fc-stage">
    <div class="fc-left">${fcSceneHTML(skill)}${fcPickHTML(skill, sel)}</div>
    <aside class="fc-right">${fcLoadHTML(skill, sel)}</aside>
  </div>
  ${skMoreHTML(realm, skill)}
  </div>`;
}
{
  const base = VIEWS.realm;
  VIEWS.realm = (realm, skill) => (FC.includes(skill) ? fcPage(realm, skill) : base(realm, skill));
}

/* ---------------------------------------------------------------- live */
UPD.push(() => {
  for (const el of $$('[data-fccta]')) {
    const [s, id] = el.dataset.act.split(':'), st = actState(s, findAction(s, id));
    if (el.dataset.st !== st) { el.dataset.st = st; $('.fcl-cta-l', el).innerHTML = fcCtaHTML(s, findAction(s, id), st); }
  }
});
on('action', (d) => {
  if (!FC.includes(d.skill)) return;
  const s = fcSess(d.skill), o = fcOut(d.act);
  if (!o) return;
  for (const k in d.gains) if (baseOf(k) === o) { s.n += d.gains[k]; if (ITEMS[k] && ITEMS[k].q) s.q += d.gains[k]; }
  s.xp += d.xp;
  fcSessDraw(d.skill);
  const el = spotNow();
  if (el && el.dataset.spot === d.skill && actionTime(d.skill, d.act) >= 0.8) {
    const B = d.skill === 'fishing' ? FISH_BOX : COOK_BOX;
    spotPop(`+${fmt(d.xp)} XP`, B.x + B.h * 0.32, B.y + 8, 'xpf', 1300);
  }
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
