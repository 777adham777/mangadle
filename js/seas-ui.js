'use strict';
/* ==========================================================================
   ANIME IDLE RPG — Orange Town overhaul: interface
   - Shiny & Perfect: tile shine, logs with their set bonuses (skill pages +
     Collection), celebrations
   - the fishing spots (their names and sea colours tint the Fishing cards, spot-ui.js)
   - the last catch / dish / log, shown in the focus panel (setLast, focus-ui.js)
   - the Cooking spice rack, seasoning buffs in battle
   Loaded before ui-systems.js boots.
   ========================================================================== */

/* ================================================================ icons */
// Drawn for this game (512 grid, filled like the game-icons.net set).
GI['salt-shaker'] = 'M226 58a30 30 0 1 1 60 0a30 30 0 1 1-60 0zM156 152c0-58 44-80 100-80s100 22 100 80zM146 166h220v46H146zM160 226h192l24 206c4 36-18 56-52 56H188c-34 0-56-20-52-56z';
GI['pepper-grains'] = 'M110 330a70 70 0 1 1 140 0a70 70 0 1 1-140 0zM254 310a76 76 0 1 1 152 0a76 76 0 1 1-152 0zM184 190a66 66 0 1 1 132 0a66 66 0 1 1-132 0zM244 440a56 56 0 1 1 112 0a56 56 0 1 1-112 0z';
GI['chili-pepper'] = 'M168 154C112 262 170 392 300 444c60 24 120 26 146 6-62-14-112-54-146-96-48-60-50-130-36-196zM136 176c10-54 132-64 152-14-38 26-108 32-152 14zM204 140c-6-46 22-84 80-100l14 34c-42 10-56 34-52 70z';
GI['kelp'] = 'M180 480c-30-80 40-130 10-210-30-80 30-130 6-210 44 70 0 130 32 208 34 84-32 132-8 212zM282 480c-18-70 50-120 20-200-24-70 30-120 16-184 36 64-4 116 22 184 28 80-34 130-20 200zM98 480c-8-50 40-80 26-140-10-50 24-80 20-130 26 50 4 86 16 134 14 60-30 88-24 136z';
GI['saffron'] = GI['spiral-bloom'] || GI['flower-twirl'];
Object.assign(ICONS.item, { sea_salt: 'salt-shaker', peppercorns: 'pepper-grains', coral_lemon: 'cut-lemon', sea_kelp: 'kelp', fire_chili: 'chili-pepper', gold_saffron: 'saffron' });
Object.assign(ICONS.ui, { spices: 'salt-shaker', shiny: 'sparkles', perfect: 'round-star', record: 'trophy', cargo: 'cargo-ship' });
ICONS.shop.buy_pepper = 'pepper-grains';
Object.assign(TYPE_LABEL, { spice: 'Seasoning' });
COL_GROUPS.push(['spice', 'Seasonings']);

/* ================================================================ tiles */
// Shiny tiles shimmer, perfect ones get a gold frame, seasoned ones a spice badge (ICON_MARK, quality.js).
{
  const baseTile = tile;
  tile = function (id, n, o) {
    const it = id && ITEMS[id];
    if (it && it.variant && !(o && o.unknown)) {
      const q = it.q === 's' ? ' q-shiny' : it.q === 'p' ? ' q-perfect' : '';
      o = Object.assign({}, o, { cls: ((o && o.cls) || '') + q + (it.spice ? ' q-spiced' : '') });
    }
    return baseTile(id, n, o);
  };
  // Where a shiny / perfect / seasoned item comes from: its base action.
  const baseSources = sourcesOf;
  sourcesOf = (id) => {
    const it = ITEMS[id];
    if (!it || !it.variant) return baseSources(id);
    const out = [];
    for (const k in SKILLS) {
      const a = SKILLS[k].actions.find((x) => x.out && x.out[it.base]);
      if (!a) continue;
      if (it.q && QUALITY[k]) out.push({ icon: ['skill', k], text: `${SKILLS[k].name} · ${a.name}`, rate: qChance(k, a) });
      if (it.spice) out.push({ icon: ['item', SPICES[it.spice].item], text: `${SKILLS[k].name} · ${a.name}, with ${SPICES[it.spice].name} on the spice rack`, rate: null });
      break;
    }
    return out;
  };
}

/* ================================================================ fishing spots */
// Each band of Fishing levels has its spot; its sky and sea colour its cards (spot-ui.js).
const FISH_SPOTS = [
  { id: 'harbour', name: 'Harbour Pier', max: 19, sky: ['#4fa8e6', '#9fd8f6', '#ffe8c6'], sea: ['#37bfe0', '#1a86b8', '#0b4f7d'] },
  { id: 'reef', name: 'Coral Reef', max: 44, sky: ['#1fa6ec', '#7fdcff', '#e6fbff'], sea: ['#48e3d6', '#18acc4', '#0a6a8c'] },
  { id: 'deep', name: 'Open Sea', max: 69, sky: ['#2a1f55', '#b4507a', '#ffad62'], sea: ['#4d5a9a', '#283a72', '#0e1a3e'] },
  { id: 'abyss', name: 'Abyssal Trench', max: 99, sky: ['#02040c', '#0a1330', '#1c2754'], sea: ['#0f2b4c', '#06172e', '#020812'] },
];
const fishSpotFor = (lv) => FISH_SPOTS.find((s) => lv <= s.max) || FISH_SPOTS[FISH_SPOTS.length - 1];
// The colour of each dish (Cooking cards, spot-ui.js).
const DISH_COL = { grilled_minnow: '#e9a35a', bass_stew: '#d9744a', crab_dumplings: '#f3dcb0', spirit_ramen: '#f0c96a', marlin_steak: '#c4553e',
  eel_bowl: '#a8653a', takoyaki: '#c98a3e', angler_feast: '#b24a5a', sea_king_curry: '#e0a020', sunbread: '#e8c47a', moon_onigiri: '#f2f2f2',
  pepper_stew: '#d3342a', melon_sorbet: '#9fe6c8', thunder_ramen: '#f5d24a', star_feast: '#ffd75e' };

/* ================================================================ last result */
// The last thing each skill made, kept across re-renders; the focus panel shows it (focus-ui.js).
const SPOT = {};
function setLast(skill, html) { SPOT['last_' + skill] = html; }
UPD.push(() => { for (const el of $$('[data-fam]')) setText(el, fmt(familyCount(el.dataset.fam))); });
on('catch', (d) => {
  const id = d.shiny ? variantId(d.fish, 's') : d.fish, it = ITEMS[id];
  setLast('fishing', `<i class="sh-ic ${d.shiny ? 'shiny' : ''}">${itemIc(id)}</i><small>${d.record ? 'New record' : d.trophy ? 'Trophy catch' : 'Last catch'}</small><b>${esc(it.name)}</b><em>${fmtKg(d.kg)}</em>`);
});
on('action', (d) => {
  if (d.skill !== 'cooking') return;
  const ids = Object.keys(d.gains).filter((k) => ITEMS[k] && baseOf(k) === Object.keys(d.act.out || {})[0]);
  const top = ids.sort((a, b) => rarity(b) - rarity(a))[0];
  if (!top) return;
  const it = ITEMS[top];
  setLast('cooking', `<i class="sh-ic ${it.q === 'p' ? 'shiny' : ''}">${itemIc(top)}</i><small>${it.q === 'p' ? 'Perfect!' : 'Last dish'}</small><b>${esc(it.name)}</b>${it.type === 'food' ? `<em>${ui('hp')}${foodHeal(top)}</em>` : ''}`);
});

/* ================================================================ spice rack */
document.addEventListener('click', (ev) => {
  const t = ev.target.closest('[data-spice]');
  if (!t || t.disabled) return;
  if (t.classList.contains('locked')) { retrigger(t, 'shake'); return; }
  pickSpice(t.dataset.spice);
  const k = S.kitchen.spice;
  toast(k ? `${SPICES[k].adj} dishes: ${spiceText(k)}.` : 'Spice rack cleared: dishes come out plain.', 'good');
});

/* ================================================================ action cards */
UIX.actLines.push((skill, a) => {
  if (skill === 'fishing' && a.out) {
    const fish = Object.keys(a.out)[0], n = S.quality.log[variantId(fish, 's')] || 0, rec = S.quality.rec[fish];
    return `<div class="ac-note q-line"><span class="${n ? 'got' : ''}" title="Chance per catch of a Shiny ${esc(ITEMS[fish].name)}. Grows with this fish's mastery.">${ui('shiny')}Shiny ${fmtRate(shinyChance('fishing', a))}${n ? ` · ${fmt(n)} caught` : ''}</span>${rec ? `<span title="Your heaviest ${esc(ITEMS[fish].name)}">${ui('record')}${fmtKg(rec)}</span>` : ''}</div>`;
  }
  if (skill === 'cooking' && a.out) {
    const out = Object.keys(a.out)[0], n = S.quality.log[variantId(out, 'p')] || 0, sp = spiceFor('cooking', out);
    return `<div class="ac-note q-line"><span class="${n ? 'got' : ''}" title="Chance per dish to come out Perfect (${ITEMS[out].type === 'food' ? 'heals 50% more' : 'buff 50% stronger'}). Grows with mastery and your level.">${ui('perfect')}Perfect ${pct(perfectChance('cooking', a))}${n ? ` · ${fmt(n)} made` : ''}</span>${sp ? `<span class="q-sp" style="--sc:${SPICES[sp].col}" title="${esc(spiceText(sp))}">${gi(SPICES[sp].icon)}${esc(SPICES[sp].adj)}</span>` : ''}</div>`;
  }
  if (a.extra && a.loot) return `<div class="ac-io"><small>Cargo</small>${a.extra.map(([k, c]) => tile(k, fmtRate(c), { cls: 'xs', unknown: !isFound(k), r: rarity(k) })).join('')}</div>`;
  return '';
});

/* ================================================================ logs */
const Q_TITLE = { shiny: 'Shiny Log', perfect: 'Perfect Log' };
const qNoun = (kind, n) => (kind === 'shiny' ? `${n} shiny fish` : `${n} perfect ${n > 1 ? 'dishes' : 'dish'}`);
// The log entry an item can fill (shiny / perfect, seasoned or not): { skill, e }.
function qEntryOf(id) {
  const it = ITEMS[id];
  if (!it || !it.q) return null;
  const vid = variantId(it.base, it.q);
  for (const sk in QUALITY) { const e = qEntries(sk).find((x) => x.vid === vid); if (e) return { skill: sk, e }; }
  return null;
}
function qTile(e, skill) {
  if (e.got) { ensureVariant(e.vid); return tile(e.vid, null, { cls: 'xs' }); }
  if (e.ready) return tile(e.pay, null, { tag: 'button', cls: 'xs ql-ready', attrs: `data-qclaim="${skill}:${e.base}" aria-label="Hand in ${esc(ITEMS[e.pay].name)}"` });
  const seen = skillLv(skill) >= e.act.level || S.found[e.base];
  return tile(e.base, null, { cls: 'xs ql-miss', unknown: !seen, title: seen ? `${qKind(skill) === 'shiny' ? 'Shiny' : 'Perfect'} ${ITEMS[e.base].name}: not yet` : `Unlocks at ${SKILLS[skill].name} ${e.act.level}` });
}
function qLogHTML(skill, compact) {
  const E = qEntries(skill), kind = qKind(skill), have = E.filter((e) => e.got).length, T = qTiers(skill), ready = E.filter((e) => e.ready).length;
  const odds = kind === 'shiny' ? 'Each catch can be shiny. Mastery of a fish raises its odds. Hand one of each in to the log; sell the rest.' : 'Any dish can come out perfect. Mastery and your level raise the odds. Hand one of each in to the log (seasoned ones count); eat or sell the rest.';
  return `<section class="win qlog ${kind}" style="--rc:${rc(SKILLS[skill].realm)}">${hdr(compact ? `${Q_TITLE[kind]} · ${SKILLS[skill].name}` : Q_TITLE[kind], `${have} / ${E.length}`)}
    <div class="ql-grid">${E.map((e) => qTile(e, skill)).join('')}${compact && typeof colMore === 'function' ? colMore(E.filter((e) => !e.got && !e.ready).length) : ''}</div>
    ${ready ? `<div class="ql-claim">${gbtn(`Hand in ${qNoun(kind, ready)}`, kind, `data-qclaim="${skill}:*"`, 'glow sm')}<small>1 of each goes into the log</small></div>` : ''}
    <span class="pbar gold"><i style="width:${(have / E.length) * 100}%"></i></span>
    <ul class="ql-tiers">${T.map((t) => `<li class="${t.on ? 'on' : ''}"><b>${t.need}</b><span>${esc(t.text)}</span>${t.on ? ui('check') : ''}</li>`).join('')}</ul>
    ${compact ? '' : `<p class="muted small">${odds}</p>`}</section>`;
}
UIX.realmSide.unshift((realm, skill) => (QUALITY[skill] && skillOpen(skill) ? qLogHTML(skill) : ''));
UIX.collectionTop.push(() => {
  const ks = Object.keys(QUALITY).filter(skillOpen);
  if (!ks.length) return '';
  return `<div class="qlog-row">${ks.map((k) => qLogHTML(k, true)).join('')}</div>`;
});

/* ================================================================ inspector */
UIX.inspectorAny.push((id) => {
  const it = ITEMS[id];
  if (it.type === 'spice') {
    const k = it.spice;
    return `${attrList([['spices', 'In a dish', spiceText(k)]])}${isUnlocked('feature:spices') ? `<div class="dt-cta">${gbtn(S.kitchen.spice === k ? 'On the spice rack' : 'Put on the spice rack', 'spices', `data-spice="${k}"`, S.kitchen.spice === k ? 'dark' : '')}</div>` : `<p class="muted small">${esc(lockedNote('feature:spices'))}</p>`}`;
  }
  if (!it.variant) return '';
  const rows = [];
  const L = qEntryOf(id), title = L && Q_TITLE[qKind(L.skill)];
  if (it.q === 's') rows.push(['shiny', 'Shiny', L && L.e.got ? `In the Shiny Log. Extra ones are trophies: ${fmt(it.value)} gold each.` : `Hand one in to the Shiny Log for its bonus; extra ones sell for ${fmt(it.value)} gold.`]);
  if (it.q === 'p') {
    rows.push(['perfect', 'Perfect', it.type === 'food' ? 'Heals 50% more; its seasoning is 50% stronger' : 'Its buff is 50% stronger']);
    rows.push(['perfect', 'Perfect Log', L && L.e.got ? 'Logged' : 'Hand one in for its bonus']);
  }
  if (it.spice) rows.push(['spices', SPICES[it.spice].adj, spiceText(it.spice, spicePower(it.q === 'p'))]);
  const cta = L && !L.e.got && count(id) > 0 ? `<div class="dt-cta">${gbtn(`Hand in to the ${title}`, qKind(L.skill), `data-qclaim="${L.skill}:${L.e.base}:${id}"`, 'glow')}</div>` : '';
  return attrList(rows) + cta + (it.type === 'food' ? '<p class="muted small">Battle food that runs out is replaced by another version of the same dish.</p>' : '');
});

/* ================================================================ battle */
UIX.stageMe.push(() => '<div class="spice-buffs" data-spicebuffs></div>');
let spiceSig = '';
UPD.push(() => {
  const box = document.querySelector('[data-spicebuffs]');
  if (!box) return;
  const by = {};
  for (const k in SPICE_RT) { const b = SPICE_RT[k]; if (!by[b.spice] || by[b.spice].t < b.t) by[b.spice] = b; }
  const sig = Object.keys(by).map((s) => s + Math.ceil(by[s].t)).join();
  if (sig === spiceSig && box.childElementCount === Object.keys(by).length) return;
  spiceSig = sig;
  box.innerHTML = Object.keys(by).map((s) => `<span class="sbuff" style="--sc:${SPICES[s].col}" title="${esc(SPICES[s].adj)}: ${esc(spiceText(s))}">${gi(SPICES[s].icon)}${esc(SPICES[s].adj)}<b>${Math.ceil(by[s].t)}s</b></span>`).join('');
});
on('spicebuff', (d) => { if (inBattleView()) floatAt($('[data-portrait="player"]'), `${gi(SPICES[d.spice].icon)}${esc(SPICES[d.spice].adj)}`, 'heal', 0, -46); });

/* ================================================================ celebrations */
on('quality', (d) => {
  const logged = ensureVariant(variantId(d.base, d.q)), it = ITEMS[d.item] || logged;
  if (d.q === 's') {
    const inLog = S.quality.claim[d.item];
    burst('Shiny catch!', inLog ? `${it.name} · a trophy to sell` : `${it.name} · hand it in to the Shiny Log`, itemIc(d.item), '#ffd75e');
    if (!inLog && count(d.item) === 1) toast(`Shiny ${ITEMS[d.base].name}! Hand it in to the Shiny Log for its bonus.`, 'rare');
  } else if (!S.quality.claim[logged.id] && d.first) {
    burst('Perfect dish!', `${it.name} · hand it in to the Perfect Log`, itemIc(d.item), '#ffd75e');
    toast(`Perfect ${ITEMS[d.base].name}! Hand it in to the Perfect Log for its bonus.`, 'rare');
  }
  sideDirty = true;
});
on('qclaim', (d) => {
  toast(`${Q_TITLE[qKind(d.skill)]}: ${ITEMS[d.item].name} (${d.have} / ${d.total}).`, 'rare');
  sideDirty = true;
});
document.addEventListener('click', (ev) => {
  const t = ev.target.closest('[data-qclaim]');
  if (!t || t.disabled) return;
  const [skill, base, pay] = t.dataset.qclaim.split(':'), kind = qKind(skill);
  const list = base === '*' ? qReady(skill).map((e) => e.base) : [base];
  let n = 0;
  for (const b of list) if (qClaim(skill, b, pay)) n++;
  if (n) burst(Q_TITLE[kind], `${n > 1 ? qNoun(kind, n) : ITEMS[variantId(list[0], Q_CODE[kind])].name} logged · ${qCount(skill)} / ${qEntries(skill).length}`, ui(kind), '#ffd75e');
  sideDirty = true; dirty = true;
});
on('qtier', (d) => {
  burst(`${Q_TITLE[qKind(d.skill)]} bonus`, d.tier.text, ui(qKind(d.skill) === 'shiny' ? 'shiny' : 'perfect'), '#ffd75e');
  toast(`${Q_TITLE[qKind(d.skill)]} (${SKILLS[d.skill].name}) reached ${d.tier.need}: ${d.tier.text}.`, 'rare');
});
