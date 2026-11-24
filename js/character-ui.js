'use strict';
/* ==========================================================================
   TRI-REALM IDLE — the Character view (#character)
   - Equipment: one card per slot (no figure since 2026-11-24: the avatar was removed);
     click a slot, its owned candidates are listed with the stat change vs what you wear
   - Stats: the five stats big, combat + fortune numbers, the build (builds-ui.js through UIX.equipBottom)
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
// A slot card: the worn tile, the slot name, what is worn and its stats.
function chSlotLine(s) {
  if (s === 'weapon') return curArm() ? chStatLine(curArm().id) : '';
  if (s === 'food') return S.combat.food && count(S.combat.food) ? `<span>${ui('hp')}+${fmt(foodHeal(S.combat.food))} HP</span>` : '';
  if (s === 'fruit') return S.fruit ? `<span>${ui('star')}Rank ${fruitRank()} / ${FRUIT_RANK_MAX}</span>` : '';
  return S.equip[s] ? chStatLine(S.equip[s]) : '';
}
function chSlotName(s) {
  if (s === 'weapon') return curArm() ? ITEMS[curArm().id].name : '';
  if (s === 'food') return S.combat.food && count(S.combat.food) ? ITEMS[S.combat.food].name : '';
  if (s === 'fruit') return S.fruit ? ITEMS[S.fruit].name : '';
  return S.equip[s] ? ITEMS[S.equip[s]].name : '';
}
function chSlotBtn(s, up) {
  const worn = chWornTile(s), name = chSlotName(s);
  const t = worn || tile(null, null, { r: 0, icon: ui(CH_EMPTY_IC[s]), title: CH_LABEL[s] });
  return `<button class="ch-slot ${chSlot === s ? 'on' : ''} ${worn ? '' : 'empty'}" data-chslot="${s}" title="${CH_LABEL[s]}">
    <span class="chs-tile">${t}${up ? `<i class="ch-up" title="Upgrade available">${ui('xp')}</i>` : ''}</span>
    <span class="chs-t"><small>${CH_LABEL[s]}</small><b>${name ? esc(name) : '<em>Empty</em>'}</b>${worn ? `<span class="es-st">${chSlotLine(s)}</span>` : ''}</span></button>`;
}
// Buttons beside your level (poster-ui.js adds the Wanted poster).
function chDollBtns() { return ''; }
function chDollHTML(ups) {
  const b = xpInfo('character');
  const arch = typeof buildArch === 'function' && featureOpen('battle') ? buildArch() : [];
  return `<section class="win ch-doll">
    ${hdr('Equipment', `${chSlotIds().filter((s) => chWornTile(s)).length} / ${chSlotIds().length} worn`)}
    <div class="ch-stage">${chSlotIds().map((s) => chSlotBtn(s, ups[s])).join('')}</div>
    <div class="ch-id">
      <span class="ch-lvb"><small>Lv</small><b data-lv="character">${b.L}</b></span>
      <span class="ch-idt"><b>${arch.length ? esc(arch.map((a) => ARCHES[a].name).join(' · ')) : 'Wanderer'}</b><span class="xpbar"><i data-xpbar="character" style="width:${b.p * 100}%"></i></span><small data-xptext="character">${xpText(b)}</small></span>${chDollBtns()}
    </div>
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
  const big = (icn, name, val, eff, tip) => `<div class="ch-st" title="${esc(tip)}"><span class="chst-ic">${ui(icn)}</span><span class="chst-t"><b>${name}</b><small>${eff}</small></span><em>${val}</em></div>`;
  const num = (icn, label, val, tip) => `<div class="ch-num" title="${esc(tip)}"><span class="chn-ic">${ui(icn)}</span><small>${label}</small><b>${val}</b></div>`;
  const crit = typeof critChance === 'function' ? critChance() : 0;
  return `<section class="win ch-stats">
    ${hdr('Stats', `Character Lv ${charLv()}`)}
    <div class="ch-sts">
      ${big('atk', 'Attack', fmt(statAtk()), `Max hit ${fmt(pMaxHit())}`, 'Raises the damage you deal')}
      ${big('def', 'Defense', fmt(statDef()), `−${pct(1 - mitig(pDef()))} damage taken`, 'Reduces the damage you take')}
      ${big('vit', 'Vitality', fmt(statVit()), `${fmt(pMaxHp())} max HP`, 'Raises your max HP')}
      ${big('spd', 'Speed', fmt(statSpd()), `${pSpeed().toFixed(2)}s per attack`, 'Each point: +1% attack speed')}
      ${big('luck', 'Luck', fmt(statLuck()), `Rare finds ×${luckMult().toFixed(2)}`, 'Each point: +1% chance on every rare find')}
    </div>
    <h4 class="ch-sub">Combat</h4>
    <div class="ch-nums">
      ${num('atk', 'Max hit', fmt(pMaxHit()), 'Your biggest normal hit')}
      ${num('hp', 'Max HP', fmt(pMaxHp()), 'Health in battle')}
      ${num('spd', 'Attack', pSpeed().toFixed(2) + 's', 'Time between attacks')}
      ${num('pk_crit', 'Crit', pct(crit), 'Chance to land a critical hit')}
      ${num('dodge', 'Dodge', pct(pDodge()), 'Chance to avoid a hit')}
      ${num('def', 'Armor', '−' + pct(1 - mitig(pDef())), 'Damage taken is reduced by this much')}
    </div>
    <h4 class="ch-sub">Fortune</h4>
    <div class="ch-nums">
      ${num('gold', 'Gold', '×' + goldMult().toFixed(2), 'Gold from every source')}
      ${num('xp', 'XP', '×' + xpMult().toFixed(2), 'XP from every action')}
      ${num('luck', 'Rare', '×' + luckMult().toFixed(2), 'Chance of rare finds')}
    </div>
    ${UIX.equipBottom ? `<div class="ch-build">${uix('equipBottom')}</div>` : ''}
  </section>`;
}

/* ------------------------------------------------------------ view */
VIEWS.character = (tab) => {
  if (chSlotIds().includes(tab)) { chSlot = tab; S.ui.view = 'character'; tab = ''; }   // character:<slot> opens that slot
  if (S.ui.view !== 'character') S.ui.view = 'character';
  if (!chSlotIds().includes(chSlot)) chSlot = 'weapon';
  const ups = {}, lists = {};
  for (const s of chSlotIds()) { lists[s] = chCands(s); ups[s] = s !== 'fruit' && lists[s].some((c) => c.score > 0.0001); }
  return `
  ${ptitle('Hero', 'Character')}
  <div class="ch-layout">
    ${chDollHTML(ups)}
    ${chStatsHTML()}
    ${chListHTML(chSlot, lists[chSlot])}
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
