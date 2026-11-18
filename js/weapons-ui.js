'use strict';
/* ==========================================================================
   TRI-REALM — weapons interface: the weapon rack in the Bank and the forge panel
   of the selected copy (level, refinement, awakening). Engine: weapons.js.
   ========================================================================== */

let selArm = null;
const armTag = (a) => `Lv ${armLv(a)}${a.ref ? ` +${a.ref}` : ''}`;
function armTile(a, o) {
  o = o || {};
  const star = a.awk ? `<span class="arm-awk">${'◆'.repeat(a.awk)}</span>` : '';
  return tile(a.id, armTag(a), Object.assign({ tag: 'button', attrs: `data-arm="${a.u}"`, corner: star, cls: `${selArm === a.u ? 'on' : ''} ${a.u === S.equipU ? 'eq' : ''}`, title: `${ITEMS[a.id].name} · ${armTag(a)}` }, o));
}
// The rack: every weapon copy you own, best first, above the bank grid.
UIX.bagTop.push(() => {
  if (!['all', 'equip'].includes(S.ui.bank) || !S.arms.length) return '';
  const arms = S.arms.slice().sort((x, y) => (y.u === S.equipU) - (x.u === S.equipU) || armWorth(y) - armWorth(x) || ITEMS[y.id].value - ITEMS[x.id].value);
  return `<div class="arm-rack"><small>Weapons · ${arms.length} · each copy keeps its own level, refinement and awakening</small><div class="arm-grid">${arms.map((a) => armTile(a)).join('')}</div></div>`;
});

function armDetailHTML() {
  const a = selArm && armOf(selArm);
  if (!a) return '';
  const it = ITEMS[a.id], L = armLv(a), eqd = a.u === S.equipU, fam = FAMILIES[armFamily(a.id)];
  const lo = armXpAt(L), hi = armXpAt(Math.min(ARM_MAX, L + 1)), p = L >= ARM_MAX ? 1 : (a.xp - lo) / (hi - lo);
  const out = [itemHead(a.id)];
  out.push(attrList([
    ['atk', 'Weapon attack', `${fmt(armAtk(a))} <small class="muted">(base ${it.stats.atk || 0})</small>`],
    ['star', 'Level', `${L} / ${ARM_MAX}`],
    ['upgrade', 'Refinement', `+${a.ref} / ${REF_MAX}`],
    ...Object.keys(it.stats).filter((k) => k !== 'atk').map((k) => [k === 'hp' ? 'hp' : k === 'def' ? 'def' : 'star', k.toUpperCase(), fmt(it.stats[k])]),
  ]));
  out.push(`<div class="aw-row"><span class="pbar"><i style="width:${p * 100}%"></i></span><small>${L >= ARM_MAX ? 'Max level' : `${fmt(a.xp - lo)} / ${fmt(hi - lo)} battle XP · gains XP while you wield it`}</small></div>`);
  const acts = [];
  if (!eqd) acts.push(gbtn('Equip', 'check', `data-armeq="${a.u}"`));
  if (!eqd) acts.push(gbtn(`Sell · ${fmt(it.value * (1 + a.ref))}`, 'gold', `data-armsell="${a.u}"`, 'dark sm'));
  if (!eqd && it.salvage) acts.push(gbtn('Salvage', 'salvage', `data-armsalv="${a.u}"`, 'dark sm'));
  if (acts.length) out.push(`<div class="dt-cta">${acts.join('')}</div>`);
  if (eqd) out.push(`<p class="muted small">${ui('check')} You fight with this weapon.</p>`);

  if (!forgeOn()) {
    out.push(`<p class="muted small">${ui('lock')} Refinement and awakening open in Soul City (${esc(lockedNote('feature:awakening').replace('Locked. ', ''))}).</p>`);
    return `<div class="arm-detail">${out.join('')}</div>`;
  }
  // refinement
  if (a.ref < REF_MAX) {
    const why = refReason(a);
    out.push(`${hdr('Refinement', `+${a.ref} → +${a.ref + 1} · +10% weapon attack each`)}
      <div class="aw-cost">${costTiles(refCost(a))}</div>
      ${gbtn(why || `Refine to +${a.ref + 1}`, 'upgrade', `data-refine="${a.u}" ${why ? 'disabled' : ''}`, 'sm')}`);
  } else out.push(`${hdr('Refinement', 'fully refined')}`);
  // awakening
  const next = AWK[a.awk + 1], why = awkReason(a);
  const elLine = a.el ? `<div class="awk-have">${gi(ELEMENTS[a.el].icon)}<span><b>${ELEMENTS[a.el].name}</b> · ${ELEMENTS[a.el].desc} Techniques tagged ${ELEMENTS[a.el].name.toLowerCase()} +25%.</span></div>` : '';
  const famLine = a.awk >= 2 ? `<div class="awk-have">${ui('star')}<span><b>${fam.name}</b> · ${fam.desc}</span></div>` : '';
  if (!next) out.push(`${hdr('Awakening', 'fully awakened')}${elLine}${famLine}`);
  else if (a.awk === 0) {
    out.push(`${hdr('Awakening I', `weapon level ${next.lv} · refinement +${next.ref} · pick an element`)}
      <div class="aw-cost">${costTiles(awkCost(a))}</div>
      <div class="awk-els">${Object.entries(ELEMENTS).map(([k, E]) => `<button class="awk-el" data-awk="${a.u}:${k}" ${why ? 'disabled' : ''} title="${esc(E.desc)}">${gi(E.icon)}<b>${E.name}</b><small>${E.desc}</small></button>`).join('')}</div>
      ${why ? `<p class="muted small">${esc(why)}</p>` : ''}`);
  } else {
    out.push(`${hdr('Awakening II', `weapon level ${next.lv} · refinement +${next.ref}`)}${elLine}
      <p class="muted small">Unlocks the passive of its family, <b>${fam.name}</b>: ${fam.desc}</p>
      <div class="aw-cost">${costTiles(awkCost(a))}</div>
      ${gbtn(why || 'Awaken', 'awaken', `data-awk="${a.u}:" ${why ? 'disabled' : ''}`, 'sm')}`);
  }
  return `<div class="arm-detail">${out.join('')}</div>`;
}

on('armlevel', (d) => { if (d.lv % 5 === 0) toast(`${ITEMS[d.a.id].name} reached level ${d.lv}.`, 'good'); });
on('refine', (d) => toast(`${ITEMS[d.a.id].name} refined to +${d.a.ref}.`, 'rare'));
on('awakenarm', (d) => burst(AWK[d.a.awk].name, `${ITEMS[d.a.id].name} · ${d.a.awk === 1 ? ELEMENTS[d.a.el].name : FAMILIES[armFamily(d.a.id)].name}`, itemIc(d.a.id), rc('soul')));

document.addEventListener('click', (ev) => {
  const t = ev.target.closest('button');
  if (!t || t.disabled) return;
  const d = t.dataset;
  if (d.arm) { selArm = d.arm; selItem = null; dirty = true; }
  else if (d.sel) { selArm = null; }
  else if (d.armeq) { equipArm(d.armeq); toast(`Equipped ${ITEMS[armOf(d.armeq).id].name}`, 'good'); }
  else if (d.armsell) { if (confirm('Sell this weapon? Its level and refinement are lost.')) { sellArm(d.armsell); selArm = null; } }
  else if (d.armsalv) { const got = salvageArm(d.armsalv); if (got) { toast(`Salvaged: ${Object.entries(got).map(([k, n]) => `${ITEMS[k].name} ×${n}`).join(', ')}`, 'good'); selArm = null; } }
  else if (d.refine) refine(d.refine);
  else if (d.awk) { const [u, el] = d.awk.split(':'); awakenArm(u, el); }
});
