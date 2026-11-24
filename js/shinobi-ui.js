'use strict';
/* ==========================================================================
   TRI-REALM IDLE — Leaf Village: Woodcutting and Crafting results
   The last log / craft, shown in the focus panel (setLast, seas-ui.js / focus-ui.js).
   ========================================================================== */

on('action', (d) => {
  if (d.skill !== 'woodcutting') return;
  const id = Object.keys(d.act.out || {})[0], it = id && ITEMS[id];
  if (it) setLast('woodcutting', `<small>Last log</small><b>${esc(it.name)}</b><em>${fmt(familyCount(id))} owned</em>`);
});
// Carvings sold abroad by a returning ship (leaf.js).
on('tradesold', (d) => toast(`Your ship sold its carvings abroad: +${fmt(d.gold)} gold.`, 'good'));

// A Perfect craft is announced (quality) just before its action.
let CS_PERFECT = 0;
on('quality', (d) => { if (d.skill === 'arts' && d.q === 'p') CS_PERFECT = performance.now(); });
on('action', (d) => {
  if (d.skill !== 'arts') return;
  const id = Object.keys(d.act.out || {})[0], it = id && ITEMS[id];
  if (!it) return;
  const perfect = performance.now() - CS_PERFECT < 400;
  setLast('arts', `<small>${perfect ? 'Perfect craft' : 'Last craft'}</small><b>${esc(it.name)}</b><em>${fmt(familyCount(id))} owned</em>`);
});
