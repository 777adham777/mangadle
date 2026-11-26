'use strict';
/* ==========================================================================
   ANIME IDLE RPG — item tooltips
   Every item tile and item icon carries data-tip="<item id>" (ui.js tile / itemIc), every
   technique icon data-ttip="<technique id>" (ui.js ic). Hovering one shows a card; on touch,
   a tap on a plain icon or a long press on a button does. Items: name, rarity, family, what it
   does, where it comes from, owned and worth. Techniques: effect at your level, tiers, progress, source.
   The card is short by default (name, rarity, what it does); Shift reveals the blocks marked
   .more (description, sources, uses, worth, tiers, progress) AND pins the card: it stops following the
   mouse, so its links can be clicked (a source takes you to the skill, stage or chest it names). Esc, a
   click outside or Shift again lets it go. Touch always gets the full, pinned card.
   2026-11-26: the same card replaces every browser tooltip. Any element with a title= gets a styled hint
   (the title moves to data-hint on hover so the browser never shows its own), and data-rtip="kind:arg"
   asks RTIP[kind] for a live card (skill level and XP...), refreshed while it is open.
   ========================================================================== */

// technique tags are internal keys; a few read better (and more original) with a display name
const TAG_LABEL = { haki: 'resolve', nen: 'aura' };
const TIP_HINT ='<div class="it-hint"><kbd>Shift</kbd> details &amp; pin</div>';
// A clickable line inside a pinned card (tipGo below). Locked places stay readable but say so.
function tipGoOpen(go) {
  if (!go) return false;
  const [kind, a] = go.split(':');
  if (kind === 'act' || kind === 'skill') return !!SKILLS[a] && skillOpen(a) && (SKILLS[a].realm === 'combat' || realmOpen(SKILLS[a].realm));
  if (kind === 'zone') return zoneUnlocked(+a) && realmOpen(ZONES[+a].realm);
  if (kind === 'view') { const v = a.split('#')[0]; return !featureOfView(v) || featureOpen(featureOfView(v)); }
  return kind === 'tip';
}
const tipLink = (go, inner) => (go ? `<a class="it-go ${tipGoOpen(go) ? '' : 'shut'}" data-tipgo="${go}" role="button" tabindex="0">${inner}<s>${ui(tipGoOpen(go) ? 'play' : 'lock')}</s></a>` : `<div>${inner}</div>`);
// The recipes an item goes into, as [skill, action].
function usesOf(id) {
  const out = [];
  for (const k in SKILLS) for (const a of SKILLS[k].actions || []) if (a.in && a.in[id] && (typeof wsShown !== 'function' || SKILLS[k].type !== 'craft' || wsShown(a))) out.push([k, a]);
  return out.sort((x, y) => x[1].level - y[1].level);
}

// What the item does, as attribute rows [icon, label, value] plus an optional line of text.
function tipEffect(id) {
  const it = ITEMS[id], rows = [];
  let text = '';
  const base = it.base ? ITEMS[it.base] : it;
  switch (it.type) {
    case 'equip':
      rows.push(...statRows(Object.fromEntries(Object.keys(it.stats || {}).map((k) => [k, itemStat(id, k)]))));
      break;
    case 'food':
      if (it.heal) rows.push(['hp', 'Heals in battle', fmt(foodHeal(id)) + ' HP']);
      if (it.spice && typeof SPICES !== 'undefined' && SPICES[it.spice]) rows.push(['spices', SPICES[it.spice].adj, spiceText(it.spice)]);
      text = 'Eaten automatically in battle when HP gets low. Also packs as expedition provisions.';
      break;
    case 'meal':
    case 'tonic':
      if (it.buff) {
        rows.push(['star', 'Buff', `+${pct(it.buff.val)} ${typeof BUFF_NAME !== 'undefined' ? BUFF_NAME[it.buff.stat] || it.buff.stat : it.buff.stat}`]);
        rows.push(['time', 'Duration', `${Math.round(it.buff.mins * (it.type === 'meal' ? 1 + synergyBonus('buff', 'cooking') : 1))} min`]);
      }
      break;
    case 'fruit':
      text = it.desc || '';
      break;
    case 'chest':
      if (it.gold) rows.push(['gold', 'Gold', `${fmt(it.gold[0])}–${fmt(it.gold[1])}`]);
      if (it.loot) text = `Open it for gold and ${it.rolls > 1 ? it.rolls : 'one'} of ${it.loot.length} rewards.`;
      break;
    case 'wish':
      text = 'One of seven. Gather all seven to make a wish.';
      break;
    case 'artifact':
      if (typeof ARTIFACTS !== 'undefined' && ARTIFACTS[id]) text = `Restore it for the museum: ${ARTIFACTS[id].desc}.`;
      break;
    case 'scroll':
      if (it.pool) text = `Read it: a ${REALMS[it.pool] ? REALMS[it.pool].name : ''} technique, new or one level up. ${RARITY_NAME[it.srar || 1] || ''} scrolls favour ${it.srar >= 4 ? 'rare' : 'common'} techniques.`;
      else if (TECHNIQUES[it.tech]) {
        const T = TECHNIQUES[it.tech], L = Math.max(1, (typeof techLv === 'function' && techLv(it.tech)) || 1);
        rows.push(['technique', TECH_CATS[T.cat] ? TECH_CATS[T.cat].name : 'Technique', T.name]);
        text = typeof T.desc === 'function' ? T.desc(L) : T.desc || '';
      }
      break;
    case 'schematic': {
      const rec = schemRecipe(id);
      if (ITEMS[it.teaches]) rows.push(['schematic', 'Teaches', ITEMS[it.teaches].name]);
      if (rec) rows.push(['xp', 'Recipe', `${SKILLS[rec.skill].name} Lv ${rec.act.level}`]);
      text = 'Learned forever once found.';
      break;
    }
    case 'tool':
      if (SKILLS[it.toolFor]) rows.push(['spd', SKILLS[it.toolFor].name, `+${15 * it.tier}% speed`]);
      text = it.tier > 1 ? `Needs Mk ${'I'.repeat(it.tier - 1)} first.` : '';
      break;
    case 'trap':
      text = `Catches beasts in ${SKILLS.tracking ? SKILLS.tracking.name : 'Hunting'}. Tier ${it.tier}: better traps hold bigger beasts.`;
      break;
    case 'bait':
      if (SKILLS[it.baitFor]) rows.push(['bait', SKILLS[it.baitFor].name, '+50% rare finds, +10% double']);
      text = 'One is used up per action while you have some.';
      break;
    case 'seed': {
      const c = typeof CROPS !== 'undefined' && CROPS.find((x) => x.seed === id);
      if (c) rows.push(['farm', 'Grows into', `${c.name} · ${c.mins} min`]);
      break;
    }
    case 'spice': {
      const k = typeof SPICE_OF_ITEM !== 'undefined' && SPICE_OF_ITEM[id];
      if (k) rows.push(['spices', 'In a dish', spiceText(k)]);
      break;
    }
    default: break;
  }
  if (!rows.length && !text && (base.type === 'res' || base.type === 'gem')) {
    if (base.relic) text = `A relic of ${REALMS[base.relic].name}: its iconic gear is forged from it.`;
    const uses = [];
    for (const k in SKILLS) for (const a of SKILLS[k].actions || []) if (a.in && a.in[it.base || id]) uses.push(a.name);
    if (uses.length) rows.push(['quest', 'Used in', uses.length > 2 ? `${uses.slice(0, 2).join(', ')} +${uses.length - 2}` : uses.join(', ')]);
  }
  return { rows, text };
}

// A unique weapon (a copy from the weapon rack, forge.js) shows its family mastery, refinement and awakening.
function armTipRows(a) {
  const rows = [['atk', 'Weapon attack', fmt(armAtk(a))], ['star', FAMILIES[armFamily(a.id)].name + ' mastery', `${armLv(a)} / ${ARM_MAX}`]];
  if (a.ref) rows.push(['upgrade', 'Refinement', `+${a.ref} / ${REF_MAX}`]);
  if (armEl(a)) rows.push(['awaken', 'Element', ELEMENTS[a.el].name]);
  if (armFam(a)) rows.push(['star', 'Family', FAMILIES[armFamily(a.id)].name]);
  return rows;
}

function tipHTML(id, arm, stackN) {
  const it = ITEMS[id];
  if (!it) return '';
  const r = rarity(id), k = itemKind(id), K = KINDS[k], type = typeLabel(id);
  let { rows, text } = tipEffect(id);
  if (arm) {
    rows = [...armTipRows(arm), ...rows.filter((r) => r[0] !== 'atk')];
    text = armFresh(arm) ? '' : `Unique weapon${arm.u === S.equipU ? ' · wielded' : ''}: it keeps its refinement and awakening.`;
  }
  const src = sourcesOf(it.base || id).slice(0, 6);
  const uses = usesOf(it.base || id).slice(0, 6);
  const n = stackN != null ? stackN : count(id);
  return `<div class="it-card r${r}"><div class="it-head">${tile(id, null, { cls: 's' })}<div><b class="it-name">${esc(it.name)}</b>
      <small><span class="rar r${r}">${RARITY_NAME[r] || ''}</span> · <span class="kind-lab k-${k}">${ui('k-' + k)}${K.one}</span>${type !== K.one ? ' · ' + esc(type) : ''}</small></div></div>
    ${rows.length ? `<div class="it-rows">${rows.map(([icn, l, v]) => `<div ${l === 'Used in' ? 'class="less"' : ''}><i>${ui(icn)}</i><span>${esc(l)}</span><b>${esc(v)}</b></div>`).join('')}</div>` : ''}
    ${text ? `<p class="it-text${rows.length ? ' more' : ''}">${esc(text)}</p>` : ''}
    ${(it.base ? ITEMS[it.base] : it).lore ? `<p class="it-text it-lore more">${esc((it.base ? ITEMS[it.base] : it).lore)}</p>` : ''}
    ${src.length ? `<div class="it-src more"><small>Where to find</small>${src.map((x) => tipLink(x.go, `<i>${ic(x.icon[0], x.icon[1])}</i><span>${esc(x.text)}</span>${x.rate != null ? `<b>${fmtRate(x.rate)}</b>` : ''}`)).join('')}</div>` : ''}
    ${uses.length ? `<div class="it-src more"><small>Used in</small>${uses.map(([k, a]) => tipLink(`act:${k}:${a.id}`, `<i>${ic('skill', k)}</i><span>${esc(a.name)}</span><b>${esc(SKILLS[k].name)} ${a.level}</b>`)).join('')}</div>` : ''}
    <div class="it-foot more">${arm ? `<span>${esc(armTag(arm))}</span><span>${ui('gold')}<b>${fmt(it.value * (1 + arm.ref))}</b> g</span>` : `<span>${stackN != null ? 'In this stack' : 'Owned'} <b>${fmt(n)}</b></span><span>${ui('gold')}<b>${fmt(it.value)}</b> g each</span>`}</div>${TIP_HINT}</div>`;
}

// Techniques: what they do at your level, their Lv 5 / Lv 10 tiers, progress and where to get them.
// Techniques you have not learned show what level 1 does and what learning it costs (you choose what to buy).
function techTipHTML(id) {
  const T = TECHNIQUES[id];
  if (!T) return '';
  const L = techLv(id), cat = TECH_CATS[T.cat], world = REALMS[T.realm];
  const cd = T.cd ? `${typeof techCd === 'function' ? techCd(id) : T.cd}s cooldown` : 'no cooldown';
  const j = slotOf(id);
  const src = [[ic('realm', T.realm), `${world ? world.name : ''} scrolls · ${(SCROLL_TIERS.map(([suf, r]) => { const o = (SCROLL_ODDS[r][techRar(id)] || 0); return o ? (RARITY_NAME[r] || '') : ''; }).filter(Boolean)).join(', ')}`, '']];
  const rows = L ? [
    ['star', 'Level', `${L} / ${TECH_MAX}`],
    ['rare', 'Rarity', RARITY_NAME[techRar(id)] || ''],
    ['check', 'Slot', j >= 0 && slotOpen(j) ? TECH_SLOTS[j].name : 'Not equipped'],
  ] : [];
  return `<div class="it-card tt" style="--rgc:${rc(T.realm)}"><div class="it-head">${tile(null, null, { r: L ? Math.min(5, 1 + Math.floor(L / 3)) : 0, icon: ic('technique', id), unknown: !L, cls: 's' })}
      <div><b class="it-name">${esc(T.name)}</b><small>${esc(cat.name)} · ${esc(world ? world.name : '')}${L ? ' · ' + cd : ''}</small></div></div>
    ${L ? `<p class="it-text">${T.desc(L)}</p>
      <ul class="it-tiers more">${TECH_TIERS.map((t) => `<li class="${L >= t ? 'got' : ''}"><em>Lv ${t}</em>${esc(T.tiers[t])}</li>`).join('')}</ul>
      <div class="it-rows more">${rows.map(([icn, l, v]) => `<div><i>${ui(icn)}</i><span>${l}</span><b>${esc(v)}</b></div>`).join('')}</div>
      ${T.tags && T.tags.length ? `<div class="it-tags more">${T.tags.map((t) => `<i>${esc(TAG_LABEL[t] || t)}</i>`).join('')}</div>` : ''}`
    : `<p class="it-text">${T.desc(1)}<span class="more"> Not learned yet: read ${esc(world ? world.name : '')} scrolls (rarer ones draw rarer techniques).</span></p>`}
    <div class="it-src more"><small>Where to get it</small>${src.map(([i, t, v]) => tipLink('view:techniques', `<i>${i}</i><span>${esc(t)}</span>${v ? `<b>${v}</b>` : ''}`)).join('')}</div>
    ${TIP_HINT}</div>`;
}

/* ------------------------------------------------------------ live cards (data-rtip="kind:arg") */
// Each returns the card's HTML; it is rebuilt a few times a second while the card is open.
const RTIP = {
  skill(k) {
    const s = SKILLS[k];
    if (!s) return '';
    const b = xpInfo(k), busy = S.action && S.action.skill === k ? findAction(k, S.action.id) : null;
    const rows = [['spd', 'Speed', '×' + skillSpeed(k).toFixed(2)], ['xp', 'XP', '×' + skillXpMult(k).toFixed(2)]];
    if (rareMult(k) > 1) rows.push(['rare', 'Luck', '×' + rareMult(k).toFixed(2)]);
    if (busy) { const f = farmRates(k, busy); rows.unshift(['play', 'Now', busy.name], ['time', 'XP / hour', fmt(f.xph)]); }
    const next = typeof skillPath === 'function' ? skillPath(k).find((m) => b.L < m.lv) : null;
    return `<div class="it-card ht" style="--rgc:${rc(s.realm)}"><div class="it-head"><span class="ht-ic">${ic('skill', k)}</span><div><b class="it-name">${esc(s.name)}</b><small>${esc(REALMS[s.realm] ? REALMS[s.realm].name : '')} · Level ${b.L}</small></div></div>
      <div class="ht-bar"><i style="width:${Math.round(b.p * 100)}%"></i></div><small class="ht-sub">${xpText(b)}</small>
      <div class="it-rows">${rows.map(([i, l, v]) => `<div><i>${ui(i)}</i><span>${l}</span><b>${esc(v)}</b></div>`).join('')}</div>
      ${next ? `<p class="it-text ht-next"><b>Lv ${next.lv}</b> · ${esc(next.name)}: ${esc(next.desc)}</p>` : ''}
      ${k === guideSkill() ? '<p class="it-text ht-goal">Your current objective is here.</p>' : ''}</div>`;
  },
};
// A plain hint from a title: "Head: the rest" or "Head · the rest" reads as a title over a line.
function hintHTML(t) {
  const m = t.match(/^(.{2,40}?)(?:: | · )([\s\S]+)$/);
  return m ? `<div class="it-card ht"><b class="ht-h">${esc(m[1])}</b><p class="ht-p">${esc(m[2])}</p></div>` : `<div class="it-card ht"><p class="ht-p">${esc(t)}</p></div>`;
}

/* ------------------------------------------------------------ going where a source says */
let tipFocus = null;   // { sel, until }: the row to show and flash once the new page is drawn
function tipGo(go) {
  if (!tipGoOpen(go)) {
    const [kind, a] = go.split(':');
    toast(kind === 'zone' ? `${ZONES[+a].name} is not open yet.` : SKILLS[a] ? `${SKILLS[a].name} is still locked.` : 'Not open yet.', 'bad');
    return false;
  }
  const i = go.indexOf(':'), kind = go.slice(0, i), ref = go.slice(i + 1);
  let sel = null;
  if (kind === 'act' || kind === 'skill') {
    const [k, id] = ref.split(':');
    if (id && SKILLS[k].type === 'craft' && typeof wsState === 'function') {
      // the recipe gallery: select it and clear the filters that could hide it
      const W = wsState(k);
      W.sel = id; W.st = 'all'; W.cat = 'all';
      if (typeof wsQuery !== 'undefined') wsQuery[k] = '';
    }
    setView(skillView(k));
    sel = id ? `[data-card="${k}:${id}"]` : null;
  } else if (kind === 'zone') { setView('battle'); sel = `.zrow[data-zone="${ref}"]`; }
  else if (kind === 'view') { const [v, anchor] = ref.split('#'); setView(v); sel = anchor ? '#' + anchor : null; }
  tipFocus = sel ? { sel, until: performance.now() + 2000 } : null;
  return true;
}
// Flash the row a link led to (in its tab, scrolled into view) once it exists.
UPD.push(() => {
  if (!tipFocus) return;
  if (performance.now() > tipFocus.until) { tipFocus = null; return; }
  const all = $$(tipFocus.sel);
  const t = all.find((e) => e.closest('.sk-pane')) || all[0];
  if (!t) return;
  tipFocus = null;
  showPaneOf(t);
  t.scrollIntoView({ block: 'center', behavior: 'smooth' });
  retrigger(t, 'tip-flash');
});

(() => {
  const el = document.createElement('div');
  el.id = 'itip';
  el.setAttribute('role', 'tooltip');
  document.body.appendChild(el);
  let anchor = null, tipId = null, lastX = 0, lastY = 0, press = null, pressed = false, touchy = false, shift = false;
  let pinned = false, pinRect = null, back = [], hintT = null, live = 0;
  // Full card while Shift is held or the card is pinned, always on touch. The hint only shows when something is hidden.
  const mode = () => {
    el.classList.toggle('full', shift || touchy || pinned);
    el.classList.toggle('pinned', pinned);
    el.classList.toggle('has-more', !!el.querySelector('.more'));
    if (anchor || pinned) place();
  };

  const place = () => {
    if (!anchor && !pinRect) return;
    const a = pinned && pinRect ? pinRect : anchor.getBoundingClientRect(), w = el.offsetWidth, h = el.offsetHeight, vw = innerWidth, vh = innerHeight, m = 8;
    // beside the item (right, else left); on narrow screens below it (else above)
    let x = a.right + m, y = a.top;
    if (x + w > vw - m) x = a.left - w - m;
    if (x < m) {
      x = Math.min(vw - w - m, Math.max(m, a.left + a.width / 2 - w / 2));
      y = a.bottom + m;
      if (y + h > vh - m) y = a.top - h - m;
    }
    y = Math.max(m, Math.min(y, vh - h - m));
    el.style.left = Math.round(Math.max(m, x)) + 'px';
    el.style.top = Math.round(y) + 'px';
  };
  // The pinned bar: back (after following an item link), what to do, close.
  const pinBar = () => `<div class="it-pin">${back.length ? `<a class="it-back" data-tipback role="button" tabindex="0">‹ Back</a>` : ''}<span>Pinned · click a line to go there</span><a class="it-x" data-tipclose role="button" tabindex="0">${ui('close')}</a></div>`;
  const cardFor = (key) => {
    const i = key.indexOf('|'), kind = key.slice(0, i), ref = key.slice(i + 1);
    try {
      if (kind === 't') return techTipHTML(ref);
      if (kind === 'r') { const j = ref.indexOf(':'), k = ref.slice(0, j); return RTIP[k] ? RTIP[k](ref.slice(j + 1)) : ''; }
      if (kind === 'h') return hintHTML(ref);
      return tipHTML(ref, null, null);
    } catch (e) { return ''; }
  };
  const fill = (html) => { el.innerHTML = (pinned ? pinBar() : '') + html; };
  // data-tip = item id, data-ttip = technique id, data-rtip = live card, title / data-hint = plain hint
  const keyOf = (t) => {
    if (t.dataset.rtip) return 'r|' + t.dataset.rtip;
    if (t.hasAttribute('title')) { const v = t.getAttribute('title'); t.removeAttribute('title'); if (v) t.dataset.hint = v; }
    return t.dataset.hint ? 'h|' + t.dataset.hint : null;
  };
  let cardHTML = '';
  const show = (t) => {
    if (pinned) return;
    const tech = t.dataset.ttip, item = !tech && t.dataset.tip;
    let key, html;
    if (tech || item) {
      const armHost = item && t.closest('[data-arm]');
      const arm = armHost && typeof armOf === 'function' ? armOf(armHost.dataset.arm) : null;   // null for a stack ("s:<id>")
      const stackN = armHost && !arm && typeof freshArms === 'function' ? freshArms(item).length : null;
      if (tech ? !TECHNIQUES[tech] : !ITEMS[item]) return;
      key = arm ? 'a|' + arm.u : stackN != null ? 's|' + item + ':' + stackN : tech ? 't|' + tech : 'i|' + item;
      if (key !== tipId || !el.classList.contains('show')) {
        try { html = tech ? techTipHTML(tech) : tipHTML(item, arm, stackN); } catch (e) { html = `<div class="it-card"><b class="it-name">${esc(tech ? TECHNIQUES[tech].name : ITEMS[item].name)}</b></div>`; }
      }
    } else {
      key = keyOf(t);
      if (!key) return;
      if (key !== tipId || !el.classList.contains('show')) html = cardFor(key);
      if (html === '') return;
    }
    anchor = t;
    if (html != null) { cardHTML = html; fill(html); tipId = key; }
    el.classList.toggle('hint', key.startsWith('h|') || key.startsWith('r|'));
    el.classList.add('show');
    mode();
  };
  const hide = () => { clearTimeout(hintT); el.classList.remove('show', 'pinned'); anchor = null; tipId = null; pinned = false; pinRect = null; back = []; };
  const pin = () => {
    if (!anchor || !el.classList.contains('show') || el.classList.contains('hint')) return;
    pinned = true;
    pinRect = anchor.getBoundingClientRect();
    fill(cardHTML);
    mode();
  };
  // Inside a pinned card, an item link swaps the card (with a way back).
  const swapTo = (key) => {
    back.push(tipId);
    tipId = key;
    cardHTML = cardFor(key);
    fill(cardHTML);
    mode();
  };
  const SEL = '[data-tip], [data-ttip], [data-rtip], [data-hint], [title]';
  const isRich = (t) => !!(t && t.matches('[data-tip], [data-ttip]'));
  const target = (node) => {
    if (!node || !node.closest || node.closest('#itip')) return null;
    const t = node.closest(SEL);
    return t && t !== document.body && t !== document.documentElement ? t : null;
  };
  const inside = (node) => !!(node && node.closest && node.closest('#itip'));

  document.addEventListener('pointerover', (e) => {
    if (e.pointerType !== 'mouse') return;
    lastX = e.clientX; lastY = e.clientY; touchy = false;
    if (pinned) return;
    shift = e.shiftKey;
    const t = target(e.target);
    clearTimeout(hintT);
    if (!t) { if (anchor) hide(); return; }
    if (t === anchor) return;
    // the title must go before the browser shows its own box
    if (t.hasAttribute('title')) keyOf(t);
    if (isRich(t) || el.classList.contains('show')) show(t);
    else { if (anchor) hide(); hintT = setTimeout(() => { if (target(document.elementFromPoint(lastX, lastY)) === t) show(t); }, 260); }
  });
  document.addEventListener('pointermove', (e) => { if (e.pointerType === 'mouse') { lastX = e.clientX; lastY = e.clientY; } }, { passive: true });
  document.addEventListener('pointerout', (e) => { if (e.pointerType === 'mouse' && anchor && !pinned && !target(e.relatedTarget)) hide(); });
  // Touch: a long press shows the card (and swallows the click that follows); the next touch outside it hides it.
  document.addEventListener('pointerdown', (e) => {
    touchy = e.pointerType !== 'mouse';
    if (inside(e.target)) return;
    if (pinned) { hide(); pressed = true; return; }   // a click outside only closes the pinned card
    if (!touchy) return;
    pressed = false;
    if (el.classList.contains('show')) hide();
    const t = target(e.target);
    clearTimeout(press);
    if (t) press = setTimeout(() => { pressed = true; show(t); pin(); }, 450);
  }, true);
  const cancel = () => clearTimeout(press);
  document.addEventListener('pointerup', cancel);
  document.addEventListener('pointercancel', cancel);
  const act = (e) => {
    const a = e.target.closest('[data-tipgo], [data-tipback], [data-tipclose], [data-tip]');
    if (!a) return;
    if (a.dataset.tipgo) {
      const go = a.dataset.tipgo;
      if (go.startsWith('tip:')) { swapTo('i|' + go.slice(4)); return; }
      if (tipGo(go)) { hide(); $('#modal').classList.remove('show'); }
    } else if ('tipback' in a.dataset) { tipId = back.pop(); cardHTML = cardFor(tipId); fill(cardHTML); mode(); }
    else if ('tipclose' in a.dataset) hide();
    else if (a.dataset.tip && ITEMS[a.dataset.tip] && pinned) swapTo('i|' + a.dataset.tip);
  };
  document.addEventListener('click', (e) => {
    if (inside(e.target)) { e.preventDefault(); e.stopPropagation(); act(e); return; }
    if (pressed) { pressed = false; e.preventDefault(); e.stopPropagation(); return; }
    // touch: a plain tap on something that does nothing else (an icon, a drop list...) shows its card too
    const t = touchy && target(e.target);
    if (t && isRich(t) && !t.closest('button, a, label, input, select, textarea, [data-act], [data-nav]')) { show(t); pin(); }
  }, true);
  document.addEventListener('contextmenu', (e) => { if (target(e.target) && e.pointerType !== 'mouse' && pressed) e.preventDefault(); });
  addEventListener('scroll', (e) => { if (anchor && !pinned && !inside(e.target)) hide(); }, true);
  addEventListener('blur', () => { shift = false; if (!pinned) hide(); });
  addEventListener('resize', () => { if (pinned) hide(); });
  // Shift: details and pin (on an item or technique card). Shift again, Esc or a click outside lets go.
  addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && pinned) { hide(); e.stopPropagation(); return; }
    if (e.key !== 'Shift' || e.repeat) return;
    shift = true;
    if (pinned) {
      const t = target(document.elementFromPoint(lastX, lastY));
      hide();
      if (t && isRich(t)) { show(t); pin(); }
      return;
    }
    if (anchor && el.classList.contains('show') && isRich(anchor)) pin(); else mode();
  }, true);
  addEventListener('keyup', (e) => { if (e.key === 'Shift') { shift = false; if (!pinned) mode(); } });
  // Re-renders replace the hovered tile: follow the new one under the mouse, or hide. Live cards refresh.
  UPD.push(() => {
    if (pinned) return;
    if (anchor && !anchor.isConnected) {
      const t = target(document.elementFromPoint(lastX, lastY));
      if (t && !pressed) { anchor = null; show(t); } else hide();
      return;
    }
    if (anchor && tipId && tipId.startsWith('r|') && performance.now() - live > 250) {
      live = performance.now();
      const html = cardFor(tipId);
      if (html) { cardHTML = html; fill(html); place(); }
    }
  });
})();
