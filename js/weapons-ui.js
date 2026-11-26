'use strict';
// A gold price beside the material tiles (refinement, awakening).
const goldCost = (g) => (g > 0 ? `<span class="aw-gold ${S.gold < g ? 'short' : ''}" title="Gold">${ui('gold')}<b>${fmt(S.gold)}</b>/${fmt(g)}</span>` : '');
/* ==========================================================================
   ANIME IDLE RPG — weapons interface: the weapon rack in the Bank and the forge panel
   of the selected copy (family mastery, refinement, awakening, transfer). Engine: forge.js.
   ========================================================================== */

let selArm = null;
const armTag = (a) => (a.ref ? `+${a.ref}` : '+0');
function armTile(a, o) {
  o = o || {};
  const star = a.awk ? `<span class="arm-awk">${'◆'.repeat(a.awk)}</span>` : '';
  return tile(a.id, armTag(a), Object.assign({ tag: 'button', attrs: `data-arm="${a.u}"`, corner: star, cls: `${selArm === a.u ? 'on' : ''} ${a.u === S.equipU ? 'eq' : ''}`, title: `${ITEMS[a.id].name} · ${armTag(a)}` }, o));
}
// New copies of a weapon share one stack tile (data-arm="s:<item id>"); the wielded copy and every
// refined or awakened copy get a tile of their own.
const armKey = (a) => (armFresh(a) && a.u !== S.equipU ? 's:' + a.id : a.u);
// The copy a rack selection stands for: a stack stands for any of its new copies.
const selArmCopy = () => (!selArm ? null : selArm.startsWith('s:') ? freshArms(selArm.slice(2))[0] || null : armOf(selArm));
const armStackTile = (id, n) => tile(id, `×${fmt(n)}`, { tag: 'button', attrs: `data-arm="s:${id}"`, cls: selArm === 's:' + id ? 'on' : '' });
// The rack: the wielded weapon, then unique weapons (best first), then stacks of new copies.
UIX.bagTop.push(() => {
  if (!['all', 'equip'].includes(S.ui.bank) || !S.arms.length) return '';
  const uniq = S.arms.filter((a) => armKey(a) === a.u)
    .sort((x, y) => (y.u === S.equipU) - (x.u === S.equipU) || armWorth(y) - armWorth(x) || ITEMS[y.id].value - ITEMS[x.id].value);
  const stacks = {};
  for (const a of S.arms) if (armKey(a) !== a.u) stacks[a.id] = (stacks[a.id] || 0) + 1;
  const ids = Object.keys(stacks).sort((x, y) => rarity(y) - rarity(x) || ITEMS[y].value - ITEMS[x].value);
  return `<div class="arm-rack"><small>Weapons · ${S.arms.length}</small>
    <div class="arm-grid">${uniq.map((a) => armTile(a)).join('')}${ids.map((id) => armStackTile(id, stacks[id])).join('')}</div></div>`;
});

// Transfer: this copy takes over the refinement and awakening of a weaker weapon you own, for free.
function transferHTML(b) {
  if (!b) return '';
  const a = transferDonor(b);
  if (!a) return '';
  const awk = a.awk > b.awk ? ' ' + '◆'.repeat(a.awk) + (a.el ? ' ' + ELEMENTS[a.el].name : '') : '';
  return `${hdr('Transfer', `from ${esc(ITEMS[a.id].name)} ${armTag(a)}`)}
    <p class="muted small">This weapon becomes <b>+${Math.max(a.ref, b.ref)}${awk}</b>. ${esc(ITEMS[a.id].name)} stays in your rack at +0.</p>
    ${gbtn('Transfer', 'upgrade', `data-transfer="${b.u}:${a.u}"`, 'sm')}`;
}

// A stack of new copies: equip one or sell them.
function armStackHTML(id) {
  const fresh = freshArms(id), n = fresh.length, it = ITEMS[id];
  if (!n) return '';
  const out = [itemHead(id)];
  out.push(`<div class="dt-stats">${stat('Owned', fmt(n))}${stat('Value', fmt(it.value) + ' g')}${stat('Stack value', fmt(it.value * n) + ' g')}</div>`);
  out.push(attrList(statRows(it.stats)));
  const acts = [gbtn('Equip', 'check', `data-armeq="${fresh[0].u}"`)];
  acts.push(gbtn(`Sell 1 · ${fmt(it.value)}`, 'gold', `data-armsell="${fresh[0].u}"`, 'dark sm'));
  if (n > 1) acts.push(gbtn(`Sell all ×${fmt(n)}`, 'gold', `data-armsellall="${id}"`, 'dark sm'));
  out.push(`<div class="dt-cta">${acts.join('')}</div>`);
  out.push(transferHTML(fresh[0]));
  out.push(`${hdr('Where to find')}${sourcesHTML(id)}`);
  return `<div class="arm-detail">${out.join('')}</div>`;
}

function armDetailHTML() {
  if (selArm && selArm.startsWith('s:')) return armStackHTML(selArm.slice(2));
  const a = selArm && armOf(selArm);
  if (!a) return '';
  const it = ITEMS[a.id], f = armFamily(a.id), L = famLv(f), x = famXp(f), eqd = a.u === S.equipU, fam = FAMILIES[f];
  const lo = armXpAt(L), hi = armXpAt(Math.min(ARM_MAX, L + 1)), p = L >= ARM_MAX ? 1 : (x - lo) / (hi - lo);
  const out = [itemHead(a.id)];
  out.push(attrList([
    ['atk', 'Weapon attack', `${fmt(armAtk(a))} <small class="muted">(base ${it.stats.atk || 0})</small>`],
    ['star', `${fam.name} mastery`, `${L} / ${ARM_MAX}`],
    ['upgrade', 'Refinement', `+${a.ref} / ${REF_MAX}`],
    ...Object.keys(it.stats).filter((k) => k !== 'atk').map((k) => [k === 'hp' ? 'hp' : k === 'def' ? 'def' : 'star', k.toUpperCase(), fmt(it.stats[k])]),
  ]));
  out.push(`<div class="aw-row"><span class="pbar"><i style="width:${p * 100}%"></i></span><small>${L >= ARM_MAX ? 'Max mastery' : `${fmt(x - lo)} / ${fmt(hi - lo)} battle XP`}</small></div>`);
  const acts = [];
  if (!eqd) acts.push(gbtn('Equip', 'check', `data-armeq="${a.u}"`));
  if (!eqd) acts.push(gbtn(`Sell · ${fmt(it.value)}`, 'gold', `data-armsell="${a.u}"`, 'dark sm'));
  if (acts.length) out.push(`<div class="dt-cta">${acts.join('')}</div>`);
  if (eqd) out.push(`<p class="muted small">${ui('check')} You fight with this weapon.</p>`);

  out.push(transferHTML(a));
  if (!forgeOn()) {
    out.push(`<p class="muted small">${ui('lock')} Refinement and awakening: ${esc(lockedNote('feature:awakening').replace('Locked. ', ''))}.</p>`);
    return `<div class="arm-detail">${out.join('')}</div>`;
  }
  // refinement
  if (a.ref < REF_MAX) {
    const why = refReason(a);
    out.push(`${hdr('Refinement', `+${a.ref} → +${a.ref + 1} · +10% weapon attack each`)}
      <div class="aw-cost">${costTiles(refCost(a))}${goldCost(refGold(a))}</div>
      ${gbtn(why || `Refine to +${a.ref + 1}`, 'upgrade', `data-refine="${a.u}" ${why ? 'disabled' : ''}`, 'sm')}`);
  } else out.push(`${hdr('Refinement', 'fully refined')}`);
  // awakening
  const next = AWK[a.awk + 1], why = awkReason(a);
  const elLine = a.el ? `<div class="awk-have">${gi(ELEMENTS[a.el].icon)}<span><b>${ELEMENTS[a.el].name}</b> · ${ELEMENTS[a.el].desc} Techniques tagged ${ELEMENTS[a.el].name.toLowerCase()} +25%.</span></div>` : '';
  const famLine = a.awk >= 2 ? `<div class="awk-have">${ui('star')}<span><b>${fam.name}</b> · ${fam.desc}</span></div>` : '';
  if (!next) out.push(`${hdr('Awakening', 'fully awakened')}${elLine}${famLine}`);
  else if (a.awk === 0) {
    out.push(`${hdr('Awakening I', `${fam.name} mastery ${next.lv} · refinement +${next.ref} · pick an element`)}
      <div class="aw-cost">${costTiles(awkCost(a))}${goldCost(awkGold(a))}</div>
      <div class="awk-els">${Object.entries(ELEMENTS).map(([k, E]) => `<button class="awk-el" data-awk="${a.u}:${k}" ${why ? 'disabled' : ''} title="${esc(E.desc)}">${gi(E.icon)}<b>${E.name}</b><small>${E.desc}</small></button>`).join('')}</div>
      ${why ? `<p class="muted small">${esc(why)}</p>` : ''}`);
  } else {
    out.push(`${hdr('Awakening II', `${fam.name} mastery ${next.lv} · refinement +${next.ref}`)}${elLine}
      <p class="muted small">Unlocks the passive of its family, <b>${fam.name}</b>: ${fam.desc}</p>
      <div class="aw-cost">${costTiles(awkCost(a))}${goldCost(awkGold(a))}</div>
      ${gbtn(why || 'Awaken', 'awaken', `data-awk="${a.u}:" ${why ? 'disabled' : ''}`, 'sm')}`);
  }
  return `<div class="arm-detail">${out.join('')}</div>`;
}

on('famlevel', (d) => { if (d.lv % 5 === 0) toast(`${FAMILIES[d.f].name} mastery ${d.lv}.`, 'good'); });
on('refine', (d) => toast(`${ITEMS[d.a.id].name} refined to +${d.a.ref}.`, 'rare'));
on('transfer', (d) => toast(`${ITEMS[d.a.id].name} takes over ${ITEMS[d.from].name}: +${d.a.ref}.`, 'rare'));
on('awakenarm', (d) => burst(AWK[d.a.awk].name, `${ITEMS[d.a.id].name} · ${d.a.awk === 1 ? ELEMENTS[d.a.el].name : FAMILIES[armFamily(d.a.id)].name}`, itemIc(d.a.id), rc('soul')));

// After selling: stay on the stack while copies are left.
const keepStackSel = () => { if (!selArm || !selArm.startsWith('s:') || !freshArms(selArm.slice(2)).length) selArm = null; dirty = true; };
document.addEventListener('click', (ev) => {
  const t = ev.target.closest('button');
  if (!t || t.disabled) return;
  const d = t.dataset;
  if (d.arm) { selArm = d.arm; selItem = null; dirty = true; }
  else if (d.sel) { selArm = null; }
  else if (d.armeq) { equipArm(d.armeq); if (selArm && selArm.startsWith('s:')) selArm = d.armeq; toast(`Equipped ${ITEMS[armOf(d.armeq).id].name}`, 'good'); }
  else if (d.armsell) {
    const a = armOf(d.armsell);
    if (a && (armFresh(a) || confirm('Sell this weapon? Its refinement is lost.'))) { sellArm(d.armsell); keepStackSel(); }
  }
  else if (d.armsellall) {
    const all = freshArms(d.armsellall), it = ITEMS[d.armsellall];
    for (const a of all) sellArm(a.u);
    toast(`Sold ${it.name} ×${fmt(all.length)} for ${fmt(it.value * all.length)} gold.`, 'good');
    keepStackSel();
  }
  else if (d.refine) refine(d.refine);
  else if (d.transfer) { const [bu, au] = d.transfer.split(':'); if (transferArm(bu, au)) selArm = bu; }
  else if (d.awk) { const [u, el] = d.awk.split(':'); awakenArm(u, el); }
});
