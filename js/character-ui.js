'use strict';
/* ==========================================================================
   TRI-REALM IDLE — the Character view (#character)
   - the hero big and animated, with the gear slots around it (paper doll)
   - Gear: click a slot, its owned candidates are listed with the stat change vs what you wear
   - Look: every cosmetic (avatar.js draws the figure and the cosmetic picker)
   - the five stats, derived numbers, the build (builds-ui.js through UIX.equipBottom)
   Loaded before ui-systems.js (it boots the game and the saved view must exist by then).
   ========================================================================== */

let chSlot = 'weapon';
const CH_GEAR = [['weapon', 'Weapon'], ['armor', 'Armor'], ['accessory', 'Accessory']];
const chBagOf = (type) => Object.keys(S.items).filter((k) => ITEMS[k] && ITEMS[k].type === type && S.items[k] > 0);
const chFoodOn = () => featureOpen('battle');
const chFruitOn = () => !!S.fruit || chBagOf('fruit').length > 0;
const chSlotIds = () => [...CH_GEAR.map((x) => x[0]), ...(chFoodOn() ? ['food'] : []), ...(chFruitOn() ? ['fruit'] : [])];

/* ------------------------------------------------------------ stat change of a swap */
function chSnap() {
  return { atk: pMaxHit(), def: pDef(), hp: pMaxHp(), spd: pSpeed(), crit: typeof critChance === 'function' ? critChance() : 0, dodge: pDodge(), luck: statLuck(), gold: goldMult() };
}
// Your numbers with `cand` in `slot` (weapon: a copy, else an item id; null = empty). Nothing is kept.
function chWith(slot, cand) {
  const E = S.equip, oldId = E[slot], oldU = S.equipU;
  try {
    if (slot === 'weapon') { S.equipU = cand ? cand.u : null; E.weapon = cand ? cand.id : null; }
    else E[slot] = cand;
    return chSnap();
  } finally { E[slot] = oldId; S.equipU = oldU; }
}
const sgnAbs = (d, f) => (d > 0 ? '+' : '−') + f(Math.abs(d));
// [key, icon, format, direction (+1 = more is better), noise floor, weight in the "is it better" score]
const CH_DELTA = [
  ['atk', 'atk', (d) => sgnAbs(d, (x) => fmt(Math.round(x))), 1, 0.5, 'rel'],
  ['def', 'def', (d) => sgnAbs(d, (x) => fmt(Math.round(x))), 1, 0.5, 'rel'],
  ['hp', 'hp', (d) => sgnAbs(d, (x) => fmt(Math.round(x))), 1, 0.5, 'rel'],
  ['spd', 'spd', (d) => sgnAbs(d, (x) => x.toFixed(2) + 's'), -1, 0.005, 'rel'],
  ['crit', 'pk_crit', (d) => sgnAbs(d, pct), 1, 0.0005, 3],
  ['dodge', 'dodge', (d) => sgnAbs(d, pct), 1, 0.0005, 3],
  ['luck', 'luck', (d) => sgnAbs(d, (x) => fmt(Math.round(x * 10) / 10)), 1, 0.05, 0.01],
  ['gold', 'gold', (d) => sgnAbs(d, pct), 1, 0.0005, 1],
];
const CH_TIP = { atk: 'Max hit', def: 'Defense', hp: 'Max HP', spd: 'Attack speed', crit: 'Crit chance', dodge: 'Dodge', luck: 'Luck', gold: 'Gold bonus' };
function chDiff(base, next) {
  let score = 0;
  const chips = [];
  for (const [k, icn, f, dir, eps, w] of CH_DELTA) {
    const d = next[k] - base[k];
    if (Math.abs(d) < eps) continue;
    const good = d * dir > 0;
    score += (d * dir) * (w === 'rel' ? 1 / Math.max(Math.abs(base[k]), k === 'def' ? 10 : 1) : w);
    chips.push(`<span class="chd ${good ? 'up' : 'dn'}" title="${CH_TIP[k]}">${ui(icn)}${f(d)}</span>`);
  }
  return { score, html: chips.length ? chips.join('') : '<span class="chd eq">No change</span>' };
}
const chPerks = (id) => (typeof PERKS === 'undefined' ? [] : Object.keys(ITEMS[id].stats || {}).filter((k) => PERKS[k]).map((k) => PERKS[k].name));
const chStatLine = (id) => statInline(Object.fromEntries(Object.keys(ITEMS[id].stats || {}).map((k) => [k, itemStat(id, k)])));

/* ------------------------------------------------------------ candidates per slot */
// Each: { tile, name, sub, diff, btn, score }
function chCands(slot) {
  const base = chSnap(), out = [];
  if (slot === 'weapon') {
    const stacks = {};
    for (const a of S.arms) {
      if (a.u === S.equipU) continue;
      if (armFresh(a)) { if (stacks[a.id]) { stacks[a.id].n++; continue; } stacks[a.id] = { a, n: 1 }; out.push(stacks[a.id]); }
      else out.push({ a, n: 1 });
    }
    return out.map(({ a, n }) => {
      const d = chDiff(base, chWith('weapon', a)), fresh = armFresh(a);
      return { score: d.score, diff: d.html, name: ITEMS[a.id].name,
        tile: fresh ? tile(a.id, n > 1 ? '×' + fmt(n) : 'New') : armTile(a, { tag: 'span', attrs: '', cls: '' }),
        sub: [fresh ? `New${n > 1 ? ' ×' + fmt(n) : ''}` : armTag(a), armEl(a) ? ELEMENTS[a.el].name : '', ...chPerks(a.id)].filter(Boolean).join(' · '),
        btn: gbtn('Equip', 'check', `data-armeq="${a.u}"`, 'sm') };
    }).sort((x, y) => y.score - x.score);
  }
  if (slot === 'food') {
    const cur = S.combat.food && count(S.combat.food) ? foodHeal(S.combat.food) : 0;
    return chBagOf('food').filter((f) => f !== S.combat.food).map((f) => {
      const d = foodHeal(f) - cur;
      return { score: d, name: ITEMS[f].name, tile: tile(f, `<span data-count="${f}">${fmt(count(f))}</span>`),
        sub: `Heals ${fmt(foodHeal(f))} HP`,
        diff: d ? `<span class="chd ${d > 0 ? 'up' : 'dn'}" title="Healing per bite">${ui('hp')}${sgnAbs(d, fmt)}</span>` : '<span class="chd eq">Same healing</span>',
        btn: gbtn('Equip', 'eat', `data-setfood="${f}"`, 'sm') };
    }).sort((x, y) => y.score - x.score);
  }
  if (slot === 'fruit') {
    return chBagOf('fruit').map((f) => {
      const mine = S.fruit === f, maxed = mine && fruitRank() >= FRUIT_RANK_MAX;
      return { score: 0, name: ITEMS[f].name, tile: tile(f, '×' + fmt(count(f))), sub: esc(ITEMS[f].desc || ''),
        diff: mine ? `<span class="chd up">${ui('star')}Rank ${fruitRank()} → ${fruitRank() + 1}</span>` : S.fruit ? `<span class="chd dn">${ui('close')}Replaces yours</span>` : '',
        btn: maxed ? gbtn('Max rank', 'fruit', 'disabled', 'sm') : gbtn(mine ? 'Rank up' : 'Eat', 'fruit', `data-eat="${f}"`, 'sm') };
    });
  }
  return chBagOf('equip').filter((id) => ITEMS[id].slot === slot).map((id) => {
    const d = chDiff(base, chWith(slot, id));
    return { score: d.score, diff: d.html, name: ITEMS[id].name, tile: tile(id, S.items[id] > 1 ? '×' + fmt(S.items[id]) : ''),
      sub: [typeLabel(id), ...chPerks(id)].join(' · '), btn: gbtn('Equip', 'check', `data-equip="${id}"`, 'sm') };
  }).sort((x, y) => y.score - x.score);
}

/* ------------------------------------------------------------ the paper doll */
const CH_EMPTY_IC = { weapon: 'weapon', armor: 'armor', accessory: 'accessory', food: 'food', fruit: 'fruit' };
const CH_LABEL = { weapon: 'Weapon', armor: 'Armor', accessory: 'Accessory', food: 'Food', fruit: 'Fruit' };
function chWornTile(s) {
  if (s === 'weapon') return curArm() ? armTile(curArm(), { tag: 'span', attrs: '', cls: '' }) : null;
  if (s === 'food') return S.combat.food && count(S.combat.food) ? tile(S.combat.food, `<span data-count="${S.combat.food}">${fmt(count(S.combat.food))}</span>`) : null;
  if (s === 'fruit') return S.fruit ? tile(S.fruit, `R${fruitRank()}`) : null;
  return S.equip[s] ? tile(S.equip[s], null) : null;
}
function chSlotBtn(s, look, up) {
  const t = chWornTile(s) || tile(null, null, { r: 0, icon: ui(CH_EMPTY_IC[s]), title: CH_LABEL[s] });
  return `<button class="ch-slot ${!look && chSlot === s ? 'on' : ''} ${chWornTile(s) ? '' : 'empty'}" data-chslot="${s}" title="${CH_LABEL[s]}">${t}${up ? `<i class="ch-up" title="Upgrade available">${ui('xp')}</i>` : ''}<small>${CH_LABEL[s]}</small></button>`;
}
function chDollHTML(look, ups) {
  const A = avState(), right = [chFoodOn() ? 'food' : null, chFruitOn() ? 'fruit' : null].filter(Boolean);
  const b = xpInfo('character');
  const arch = typeof buildArch === 'function' && featureOpen('battle') ? buildArch() : [];
  return `<section class="win ch-doll">
    <div class="ch-stage">
      <div class="ch-col">${CH_GEAR.map(([s]) => chSlotBtn(s, look, ups[s])).join('')}</div>
      <div class="av-floor ch-floor" style="--ink:${cosOf('color', A.color).ink}">${avatarSVG(null, { ctx: 'preview', pose: look ? avPreview || undefined : 'guard', cls: 'big' })}</div>
      <div class="ch-col">${right.map((s) => chSlotBtn(s, look, ups[s])).join('')}</div>
    </div>
    <div class="ch-id">
      <span class="ch-lvb"><small>Lv</small><b data-lv="character">${b.L}</b></span>
      <span class="ch-idt"><b>${arch.length ? esc(arch.map((a) => ARCHES[a].name).join(' · ')) : 'Wanderer'}</b><span class="xpbar"><i data-xpbar="character" style="width:${b.p * 100}%"></i></span><small data-xptext="character">${xpText(b)}</small></span>
    </div>
    ${look ? avPosesHTML() : ''}
  </section>`;
}

/* ------------------------------------------------------------ the slot panel */
function chWornHTML(s) {
  const un = (attrs) => gbtn('Unequip', 'close', attrs, 'dark sm');
  const card = (t, small, name, line, acts) => `<div class="ch-worn">${t}<span class="chw-t"><small>${small}</small><b>${name}</b>${line ? `<span class="es-st">${line}</span>` : ''}</span><span class="chw-a">${acts}</span></div>`;
  const none = (txt) => `<div class="ch-worn empty">${tile(null, null, { r: 0, icon: ui(CH_EMPTY_IC[s]), title: CH_LABEL[s] })}<span class="chw-t"><small>Worn</small><b class="muted">${txt}</b></span></div>`;
  if (s === 'weapon') {
    const a = curArm();
    if (!a) return none('Empty');
    return card(chWornTile(s), `Worn · ${armTag(a)}${armEl(a) ? ' · ' + ELEMENTS[a.el].name : ''}`, esc(ITEMS[a.id].name), chStatLine(a.id),
      (forgeOn() ? gbtn('Forge', 'forge', `data-chforge="${a.u}"`, 'dark sm') : '') + un('data-unequip="weapon"'));
  }
  if (s === 'food') {
    const f = S.combat.food;
    if (!f || !count(f)) return none('Empty: you won’t heal');
    return card(chWornTile(s), 'Worn · eaten when HP is low', esc(ITEMS[f].name), `<span>${ui('hp')}+${fmt(foodHeal(f))} HP</span>`, un('data-unfood'));
  }
  if (s === 'fruit') {
    if (!S.fruit) return none('None eaten');
    return card(chWornTile(s), `Rank ${fruitRank()} / ${FRUIT_RANK_MAX}`, esc(ITEMS[S.fruit].name), esc(ITEMS[S.fruit].desc || ''), '');
  }
  const id = S.equip[s];
  if (!id) return none('Empty');
  return card(chWornTile(s), `Worn${chPerks(id).length ? ' · ' + chPerks(id).join(' · ') : ''}`, esc(ITEMS[id].name), chStatLine(id),
    (gearOn() ? gbtn('Forge', 'forge', `data-chinspect="${id}"`, 'dark sm') : '') + un(`data-unequip="${s}"`));
}
function chListHTML(s, cands) {
  const rows = cands.map((c) => `<div class="ch-row ${c.score > 0 ? 'better' : ''}">${c.tile}<span class="chr-t"><b>${esc(c.name)}</b><small>${c.sub}</small><span class="chr-d">${c.diff}</span></span>${c.btn}</div>`).join('');
  const empty = { weapon: 'No other weapon. Craft or find one.', armor: 'No armor in your bag yet.', accessory: 'No accessory in your bag yet.', food: 'No food. Cook or brew some.', fruit: 'No fruit in your bag.' }[s];
  return `<section class="win ch-list">
    ${hdr(CH_LABEL[s] === 'Food' ? 'Battle food' : CH_LABEL[s] === 'Fruit' ? 'Devil Fruit' : CH_LABEL[s], cands.length ? `${cands.length} owned` : '')}
    ${chWornHTML(s)}
    <div class="ch-cands">${rows || `<div class="empty-note">${empty}</div>`}</div>
  </section>`;
}

/* ------------------------------------------------------------ stats */
function chStatsHTML() {
  if (!UIX.equipBottom) dirty = true;   // the boot render runs before builds-ui.js registers the build panel
  return `<section class="win ch-stats">
    ${hdr('Stats', `Character Lv ${charLv()}`)}
    ${charStatsHTML()}
    <div class="ch-more">${stat('Dodge', pct(pDodge()))}${stat('Gold', '×' + goldMult().toFixed(2))}${stat('XP', '×' + xpMult().toFixed(2))}</div>
    ${UIX.equipBottom ? uix('equipBottom') : ''}
  </section>`;
}

/* ------------------------------------------------------------ view */
const chTabs = (look) => `<nav class="seg big-seg">
  <button class="${look ? '' : 'on'}" data-nav="character">${ui('equip')}<span>Gear</span></button>
  ${featureOpen('avatar') ? `<button class="${look ? 'on' : ''}" data-nav="character:look">${ui('avatar')}<span>Look</span></button>` : `<button class="locked" data-locked="avatar" title="${esc(lockedNote('avatar'))}">${ui('lock')}<span>Look</span></button>`}</nav>`;
VIEWS.character = (tab) => {
  if (chSlotIds().includes(tab)) { chSlot = tab; S.ui.view = 'character'; tab = ''; }   // character:<slot> opens that slot
  const look = tab === 'look' && featureOpen('avatar');
  if (!look && S.ui.view !== 'character') S.ui.view = 'character';
  if (!chSlotIds().includes(chSlot)) chSlot = 'weapon';
  const ups = {}, lists = {};
  for (const s of chSlotIds()) { lists[s] = chCands(s); ups[s] = s !== 'fruit' && lists[s].some((c) => c.score > 0.0001); }
  return `
  ${ptitle('Hero', 'Character', chTabs(look))}
  <div class="ch-layout ${look ? 'look' : ''}">
    ${chDollHTML(look, ups)}
    ${look ? `<section class="win ch-list ch-look">${avPickHTML()}</section>` : chListHTML(chSlot, lists[chSlot])}
    ${chStatsHTML()}
  </div>`;
};

// New gear, food or a fruit while the view is open: redraw the lists.
let chSig = '';
UPD.push(() => {
  if (!S.ui.view.startsWith('character')) { chSig = ''; return; }
  const sig = Object.keys(S.items).filter((k) => ITEMS[k] && ['equip', 'food', 'fruit'].includes(ITEMS[k].type)).join() + '|' + S.arms.length + '|' + S.equipU + '|' + Object.values(S.equip).join() + '|' + S.combat.food + '|' + S.fruit;
  if (chSig && sig !== chSig) dirty = true;
  chSig = sig;
});

document.addEventListener('click', (ev) => {
  const t = ev.target.closest('[data-chslot], [data-chforge], [data-chinspect]');
  if (!t || t.disabled) return;
  if (t.dataset.chslot) {
    chSlot = t.dataset.chslot;
    if (S.ui.view !== 'character') setView('character');
    dirty = true;
  } else if (t.dataset.chforge) {
    selArm = t.dataset.chforge; selItem = null;
    S.ui.bank = ['all', 'equip'].includes(S.ui.bank) ? S.ui.bank : 'equip';
    setView('hero');
  } else if (t.dataset.chinspect) {
    // worn armor and accessories: sockets and reforge live in the Bank inspector
    selItem = t.dataset.chinspect; selArm = null;
    setView('hero');
  }
});
