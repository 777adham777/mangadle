'use strict';
/* ==========================================================================
   ANIME IDLE RPG — Shinjuku: Exorcism results (hex.js is the engine)
   The last curse exorcised (focus panel, whose gauge shows the next curse's grade:
   focus-ui.js) and the Special Grade notice.
   ========================================================================== */

on('exorcised', (d) => {
  const id = Object.keys(d.act.out)[0], it = ITEMS[id], G = GRADE_BY[d.grade];
  setLast('exorcism', `<small>${esc(G.name)} exorcised</small><b>${esc(it.name)}</b><em>${fmt(familyCount(id))} owned</em>`);
});
on('specialgrade', (d) => {
  toast(`Special Grade curse exorcised: ×6 spoils, 3 Cursed Fragments and ${ITEMS[d.item].name}!`, 'rare');
  burst('Special Grade!', `${ITEMS[d.item].name} · ×6 spoils`, itemIc(d.item), '#ff4a5a');
});
