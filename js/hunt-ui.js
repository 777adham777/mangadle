'use strict';
/* ==========================================================================
   TRI-REALM IDLE — Green Island: Tracking results (hunt.js is the engine)
   The last catch (focus panel, whose gauge shows the scent: focus-ui.js), Prime Prey
   and Shiny beast notices.
   ========================================================================== */

on('action', (d) => {
  if (d.skill !== 'tracking') return;
  const id = d.act.out && Object.keys(d.act.out)[0], it = id && ITEMS[id];
  if (it) setLast('tracking', `<small>Last catch</small><b>${esc(it.name)}</b><em>${fmt(familyCount(id))} owned</em>`);
});
on('scent', () => toast('Prime Prey sighted! Your next trail run gives ×3 and a Prime material.', 'rare'));
on('prime', (d) => burst('Prime Prey!', `${ITEMS[d.item].name} · ×3 catch`, itemIc(d.item), '#ffd75e'));
on('shinybeast', (d) => {
  const B = BEASTS[d.id];
  toast(`Shiny ${B.name}! As a companion it gives 50% more.`, 'rare');
  burst('Shiny beast!', `${B.name} · its bonus ×1.5`, ic('beast', d.id), '#ffd75e');
});
