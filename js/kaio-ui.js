'use strict';
/* ==========================================================================
   ANIME IDLE RPG — Kaio Planet: Gravity Training and Farming results (kaio.js is the engine)
   The last session / harvest (focus panel, focus-ui.js), breakthroughs, Giant crops, mutations.
   ========================================================================== */

on('action', (d) => {
  if (d.skill !== 'gravity') return;
  const id = Object.keys(d.act.out || {})[0], it = id && ITEMS[id];
  if (it) setLast('gravity', `<small>Last session</small><b>${esc(it.name)}</b><em>${fmt(familyCount(id))} owned</em>`);
});
on('breakthrough', (d) => {
  toast(`Breakthrough! Limit ${d.limit}: +${(d.limit * LIMIT_FX * 100).toFixed(1)}% damage and max HP for good.`, 'rare');
  burst('Breakthrough', `Limit ${d.limit} · +${(d.limit * LIMIT_FX * 100).toFixed(1)}% damage & HP`, ic('skill', 'gravity'), '#ffd75e');
});
on('harvest', (d) => {
  const it = ITEMS[d.crop];
  setLast('farming', `<small>Last harvest</small><b>${esc(it.name)} ×${fmt(d.n)}</b><em>${fmt(familyCount(d.crop))} owned</em>`);
});
on('giant', (d) => burst('Giant crop!', `${ITEMS[d.crop].name} · ×3 harvest · Shiny Log`, itemIc(d.crop), '#ffd75e'));
on('mutation', (d) => toast(`Mutation! Your ${ITEMS[d.from].name} left a ${ITEMS[d.seed].name}.`, 'rare'));
