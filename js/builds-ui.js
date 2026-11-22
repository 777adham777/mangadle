'use strict';
/* ==========================================================================
   TRI-REALM IDLE — combat builds: what you see (builds.js is the engine)
   - every stat line (tiles, tooltips, inspector) lists the piece's perks
   - the Equipment window shows your build: its archetype, every perk you have, your sets
   - the inspector of a set piece shows the set, which pieces you wear and its bonuses
   Loaded after tooltips.js.
   ========================================================================== */

const perkVal = (k, v) => {
  const P = PERKS[k];
  if (P.flag) return 'On';
  if (P.times) return `${(Math.round(v * 10) / 10)}× max hit`;
  if (P.neg) return `−${pct(v)}`;
  return `+${pct(v)}${P.per || ''}`;
};
{
  const base = statRows;
  statRows = function (st) {
    const rows = base(st);
    for (const k in PERKS) if (st[k]) rows.push(['pk_' + k, PERKS[k].name, perkVal(k, st[k])]);
    return rows;
  };
  // perk rows use ui icons named pk_<perk>
  for (const k in PERKS) ICONS.ui['pk_' + k] = PERKS[k].icon;
  for (const k in ARCHES) ICONS.ui['arch_' + k] = ARCHES[k].icon;
}

/* ---------------------------------------------------------------- the build panel */
function setLine(s) {
  const n = setWorn(s), w = worn().map((id) => (ITEMS[id] && ITEMS[id].base) || id);
  const pieces = s.pieces.map((p) => { const ids = [].concat(p), on = ids.find((id) => w.includes(id)); return { id: on || ids[0], on: !!on }; });
  const bon = (b, need) => `<li class="${n >= need ? 'on' : ''}"><b>${need}</b><span>${Object.entries(b).map(([k, v]) => (PERKS[k] ? `${PERKS[k].name} ${perkVal(k, v)}` : k === 'gold' ? `Gold +${pct(v)}` : k === 'dodge' ? `Dodge +${pct(v)}` : k)).join(' · ')}</span></li>`;
  return `<div class="bset ${n >= 2 ? 'on' : ''}"><div class="bset-h"><b>${esc(s.name)}</b><em>${n} / ${s.pieces.length}</em></div>
    <div class="bset-p">${pieces.map((p) => tile(p.id, null, { cls: 'xs ' + (p.on ? '' : 'dim'), unknown: !S.found[p.id] })).join('')}</div>
    <ul class="bset-b">${bon(s.b2, 2)}${bon(s.b3, 3)}</ul></div>`;
}
function buildHTML() {
  const arch = buildArch(), rows = [];
  for (const k in PERKS) { const v = perk(k); if (v > 0 && k !== 'crit' && k !== 'critDmg') rows.push(['pk_' + k, PERKS[k].name, perkVal(k, v)]); }
  rows.unshift(['pk_crit', 'Critical hits', `${pct(critChance())} · ×${critMult().toFixed(2)}`]);
  const sets = SETS.filter((s) => setWorn(s) > 0);
  const name = arch.length ? arch.map((a) => ARCHES[a].name).join(' · ') : 'Balanced';
  return `${hdr('Build', 'gear perks and sets make your fighting style')}
    <div class="build-id">${ui(arch.length ? 'arch_' + arch[0] : 'battle')}<span><b>${esc(name)}</b><small>${arch.length ? arch.map((a) => ARCHES[a].desc).join(' · ') : 'Mix perks from your gear to shape a style'}</small></span></div>
    ${attrList(rows)}
    ${sets.length ? `<div class="bsets">${sets.map(setLine).join('')}</div>` : '<p class="muted small">Wear 2 or 3 pieces of a set for its bonuses (see a piece in the Bank).</p>'}`;
}
UIX.equipBottom = UIX.equipBottom || [];
UIX.equipBottom.push(() => (featureOpen('battle') ? buildHTML() : ''));
// The inspector of a set piece: the whole set.
UIX.inspector.push((id) => {
  const b = (ITEMS[id] && ITEMS[id].base) || id, sets = SET_OF[b];
  if (!sets) return '';
  return `${hdr('Set', 'wear 2 or 3 pieces')}${sets.map(setLine).join('')}`;
});
// A perk's meaning, on hover in the build list.
document.addEventListener('mouseover', (ev) => {
  const a = ev.target.closest('.attr');
  if (!a || a.title) return;
  const lab = a.querySelector('span') && a.querySelector('span').textContent;
  const k = Object.keys(PERKS).find((x) => PERKS[x].name === lab);
  if (k && PERKS[k].tip) a.title = PERKS[k].tip;
});
