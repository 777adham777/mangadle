'use strict';
/* ==========================================================================
   TRI-REALM IDLE — Soul City: Mining and Smelting (soul.js is the engine)
   The last ore / ingot (shown in the focus panel, whose gauge shows the vein and the
   forge heat: focus-ui.js), the Mother Lode and White Heat notices, the intro cards.
   ========================================================================== */

on('action', (d) => {
  if (d.skill !== 'mining' && d.skill !== 'smithing') return;
  const id = Object.keys(d.act.out || {})[0], it = id && ITEMS[id];
  if (!it) return;
  setLast(d.skill, `<small>${d.skill === 'mining' ? 'Last ore' : 'Last ingot'}</small><b>${esc(it.name)}</b><em>${fmt(familyCount(id))} owned</em>`);
});
on('lode', () => toast('Mother Lode! The next 10 ores come out ×3.', 'rare'));
on('whiteheat', () => toast('White Heat! The next 6 smelts give ×2 ingots, half of them Pure.', 'rare'));

INTRO['skill:smithing'] = INTRO['skill:smithing'] || { icon: () => ic('skill', 'smithing'), kicker: 'New in Soul City', title: 'The Soul Forge',
  text: 'The soul smith slaps your back. "Keep the fire fed and the hammer moving. A hot forge pours pure metal."',
  points: [[() => ui('time'), 'Forge heat', 'Every ingot stokes the forge: it smelts faster and pours more Pure ingots. It cools while you do something else.'],
    [() => ui('star'), 'White Heat', 'At 100% heat the furnace turns white: 6 smelts give double ingots, half of them Pure.'],
    [() => ui('perfect'), 'Pure ingots', 'Refine a weapon with Pure ingots and it costs half. Hand one of each in to the Perfect Log.']] };
INTRO['skill:mining'] = INTRO['skill:mining'] || { icon: () => ic('skill', 'mining'), kicker: 'New in Soul City', title: 'The Reishi Mine',
  text: 'A ghostly miner hands you a pickaxe. "Stay on a vein. The deeper you dig, the more it gives back."',
  points: [[() => ui('gem'), 'The vein', 'Mining the same ore digs deeper: more double ores and twice the gems at 100%. Switching ore starts a new vein.'],
    [() => ui('star'), 'Mother Lode', 'Sometimes a crystal heart cracks open: the next 10 ores come out ×3. Deep veins find it more often.'],
    [() => ui('shiny'), 'Radiant ore', 'Every ore has a rare Shiny version. Hand one of each in to the Shiny Log for its bonuses.']] };
