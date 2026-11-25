'use strict';
/* ==========================================================================
   ANIME IDLE RPG — Echo Quarter: Archaeology, Restoration and Bonding results (echo.js is the engine)
   The dig site's excavation grid (shown in the focus panel, focus-ui.js), the last dig /
   restored piece, and the site-cleared, Flawless, Resonance and Echo-evolves notices.
   ========================================================================== */

const DIG_IC = { cache: 'chest', relic: 'gem', shard: 'rare', intact: 'shiny' };
function gridHTML(id) {
  const G = gridOf(id);
  return `<div class="dg-grid" data-dgrid="${id}"><small>Excavation · ${G.n} / ${DIG_N}</small><div class="dg-cells">${G.cells.map((w, i) => `<i class="${G.open[i] ? 'o ' + (w || 'dirt') : ''}">${G.open[i] && w ? ui(DIG_IC[w]) : ''}</i>`).join('')}</div></div>`;
}

on('dug', (d) => {
  const id = Object.keys(d.act.out)[0];
  setLast('archaeology', `<small>Last dig</small><b>${esc(ITEMS[id].name)}</b><em>${fmt(familyCount(id))} owned</em>`);
});
on('siteclear', (d) => toast(`${d.act.name.replace('Dig: ', '')} cleared: +3 Echo Dust and a fresh grid.`, 'rare'));
on('action', (d) => {
  if (d.skill !== 'restoration') return;
  const id = Object.keys(d.act.out || {})[0];
  if (id) setLast('restoration', `<small>Last restored</small><b>${esc(ITEMS[id].name)}</b>`);
});
on('flawless', (d) => {
  const A = ARTIFACTS[d.id];
  toast(`Flawless ${ITEMS[d.id].name}! Its museum bonus counts ×1.5: ${A.desc}.`, 'rare');
  burst('Flawless!', `${ITEMS[d.id].name} · museum bonus ×1.5`, itemIc(d.id), '#ffd75e');
});
on('resonance', () => toast('Resonance! Your Echo works three times as fast for 60 seconds.', 'rare'));
on('bondup', (d) => { if (d.grade) { burst('Echo evolves', `Bond ${d.lv} · every grade rises`, ui('star'), '#f08cff'); dirty = true; } });
