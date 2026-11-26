'use strict';
/* ==========================================================================
   ANIME IDLE RPG — Soul City: Mining and Smelting (soul.js is the engine)
   The last ore / ingot (shown in the focus panel, whose gauge shows the vein and the
   forge heat: focus-ui.js), the Mother Lode and White Heat notices.
   ========================================================================== */

on('action', (d) => {
  if (d.skill !== 'mining' && d.skill !== 'smithing') return;
  const id = Object.keys(d.act.out || {})[0], it = id && ITEMS[id];
  if (!it) return;
  setLast(d.skill, `<small>${d.skill === 'mining' ? 'Last ore' : 'Last ingot'}</small><b>${esc(it.name)}</b><em>${fmt(familyCount(id))} owned</em>`);
});
on('lode', () => toast('Mother Lode! The next 10 ores come out ×3.', 'rare'));
on('whiteheat', () => toast('White Heat! The next 6 smelts give ×2 ingots, half of them Pure.', 'rare'));
