'use strict';
/* ==========================================================================
   TRI-REALM IDLE — item tooltips
   Every item tile and item icon carries data-tip="<item id>" (ui.js tile / itemIc).
   Hovering one (or a long press on touch) shows a card: name, rarity, family,
   what the item does, where it comes from, how many you own and what it is worth.
   ========================================================================== */

// What the item does, as attribute rows [icon, label, value] plus an optional line of text.
function tipEffect(id) {
  const it = ITEMS[id], rows = [];
  let text = '';
  const base = it.base ? ITEMS[it.base] : it;
  switch (it.type) {
    case 'equip':
      rows.push(...statRows(Object.fromEntries(Object.keys(it.stats || {}).map((k) => [k, itemStat(id, k)]))));
      if (it.salvage) text = 'Drop-only gear: salvages into relics.';
      break;
    case 'food':
      if (it.heal) rows.push(['hp', 'Heals in battle', fmt(foodHeal(id)) + ' HP']);
      if (it.spice && typeof SPICES !== 'undefined' && SPICES[it.spice]) rows.push(['spices', SPICES[it.spice].adj, spiceText(it.spice)]);
      text = 'Eaten automatically in battle when HP gets low. Also packs as expedition provisions.';
      break;
    case 'meal':
      if (it.buff) {
        rows.push(['star', 'Buff', `+${pct(it.buff.val)} ${typeof BUFF_NAME !== 'undefined' ? BUFF_NAME[it.buff.stat] || it.buff.stat : it.buff.stat}`]);
        rows.push(['time', 'Duration', `${Math.round(it.buff.mins * (1 + synergyBonus('buff', 'cooking')))} min`]);
      }
      break;
    case 'fruit':
      text = it.desc || '';
      break;
    case 'chest':
      if (it.gold) rows.push(['gold', 'Gold', `${fmt(it.gold[0])}–${fmt(it.gold[1])}`]);
      if (it.loot) text = `Open it for gold and one of ${it.loot.length} rewards.`;
      break;
    case 'wish':
      text = 'One of seven. Gather all seven to make a wish.';
      break;
    case 'artifact':
      if (typeof ARTIFACTS !== 'undefined' && ARTIFACTS[id]) text = `Restore it for the museum: ${ARTIFACTS[id].desc}.`;
      break;
    case 'scroll':
      if (it.pool) text = `Read it to learn a random ${REALMS[it.pool] ? REALMS[it.pool].name : ''} technique.`;
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

function tipHTML(id) {
  const it = ITEMS[id];
  if (!it) return '';
  const r = rarity(id), k = itemKind(id), K = KINDS[k], type = typeLabel(id);
  const { rows, text } = tipEffect(id);
  const src = sourcesOf(it.base || id).slice(0, 2);
  const n = count(id);
  return `<div class="it-card r${r}"><div class="it-head">${tile(id, null, { cls: 's' })}<div><b class="it-name">${esc(it.name)}</b>
      <small><span class="rar r${r}">${RARITY_NAME[r] || ''}</span> · <span class="kind-lab k-${k}">${ui('k-' + k)}${K.one}</span>${type !== K.one ? ' · ' + esc(type) : ''}</small></div></div>
    ${rows.length ? `<div class="it-rows">${rows.map(([icn, l, v]) => `<div><i>${ui(icn)}</i><span>${esc(l)}</span><b>${esc(v)}</b></div>`).join('')}</div>` : ''}
    ${text ? `<p class="it-text">${esc(text)}</p>` : ''}
    ${src.length ? `<div class="it-src"><small>Where to find</small>${src.map((x) => `<div><i>${ic(x.icon[0], x.icon[1])}</i><span>${esc(x.text)}</span>${x.rate != null ? `<b>${fmtRate(x.rate)}</b>` : ''}</div>`).join('')}</div>` : ''}
    <div class="it-foot"><span>Owned <b>${fmt(n)}</b></span><span>${ui('gold')}<b>${fmt(it.value)}</b> g each</span></div></div>`;
}

(() => {
  const el = document.createElement('div');
  el.id = 'itip';
  el.setAttribute('role', 'tooltip');
  document.body.appendChild(el);
  let anchor = null, tipId = null, lastX = 0, lastY = 0, press = null, pressed = false;

  const place = () => {
    const a = anchor.getBoundingClientRect(), w = el.offsetWidth, h = el.offsetHeight, vw = innerWidth, vh = innerHeight, m = 8;
    // beside the item (right, else left); on narrow screens below it (else above)
    let x = a.right + m, y = a.top;
    if (x + w > vw - m) x = a.left - w - m;
    if (x < m) {
      x = Math.min(vw - w - m, Math.max(m, a.left + a.width / 2 - w / 2));
      y = a.bottom + m;
      if (y + h > vh - m) y = a.top - h - m;
    }
    y = Math.max(m, Math.min(y, vh - h - m));
    el.style.left = Math.round(x) + 'px';
    el.style.top = Math.round(y) + 'px';
  };
  const show = (t) => {
    const id = t.dataset.tip;
    if (!ITEMS[id]) return;
    anchor = t;
    if (id !== tipId || !el.classList.contains('show')) {
      let html = '';
      try { html = tipHTML(id); } catch (e) { html = `<div class="it-head"><b class="it-name">${esc(ITEMS[id].name)}</b></div>`; }
      el.innerHTML = html;
      tipId = id;
    }
    el.classList.add('show');
    place();
  };
  const hide = () => { el.classList.remove('show'); anchor = null; tipId = null; };
  const target = (node) => (node && node.closest ? node.closest('[data-tip]') : null);

  document.addEventListener('pointerover', (e) => {
    if (e.pointerType !== 'mouse') return;
    lastX = e.clientX; lastY = e.clientY;
    const t = target(e.target);
    if (t) { if (t !== anchor) show(t); } else if (anchor) hide();
  });
  document.addEventListener('pointermove', (e) => { if (e.pointerType === 'mouse') { lastX = e.clientX; lastY = e.clientY; } }, { passive: true });
  document.addEventListener('pointerout', (e) => { if (e.pointerType === 'mouse' && anchor && !target(e.relatedTarget)) hide(); });
  // Touch: a long press shows the card (and swallows the click that follows); the next touch hides it.
  document.addEventListener('pointerdown', (e) => {
    if (e.pointerType === 'mouse') return;
    pressed = false;
    if (el.classList.contains('show')) hide();
    const t = target(e.target);
    clearTimeout(press);
    if (t) press = setTimeout(() => { pressed = true; show(t); }, 450);
  });
  const cancel = () => clearTimeout(press);
  document.addEventListener('pointerup', cancel);
  document.addEventListener('pointercancel', cancel);
  document.addEventListener('click', (e) => { if (pressed) { pressed = false; e.preventDefault(); e.stopPropagation(); } }, true);
  document.addEventListener('contextmenu', (e) => { if (target(e.target) && e.pointerType !== 'mouse' && pressed) e.preventDefault(); });
  addEventListener('scroll', () => { if (anchor) hide(); }, true);
  addEventListener('blur', hide);
  // Re-renders replace the hovered tile: follow the new one under the mouse, or hide.
  UPD.push(() => {
    if (!anchor || anchor.isConnected) return;
    const t = target(document.elementFromPoint(lastX, lastY));
    if (t && !pressed) show(t); else hide();
  });
})();
