'use strict';
/* ==========================================================================
   TRI-REALM IDLE — interface for the world systems (systems.js).
   Loaded last: registers its views, then boots the game.
   ========================================================================== */

/* ================================================================ TECHNIQUES */
const costTiles = (cost) => Object.entries(cost).map(([k, n]) => tile(k, `<em data-have="${k}" data-n="${n}">${fmt(count(k))}</em>/${fmt(n)}`, { cls: 'xs ' + (count(k) < n ? 'short' : ''), title: ITEMS[k].name })).join('');
UIX.battleSide.push(() => {
  if (!techOn()) return '';
  const learned = Object.keys(TECHNIQUES).filter(techRank);
  const n = techSlots();
  const slot = (i) => {
    const cur = S.tech.slots[i];
    if (i >= n) return `<div class="tslot locked">${ui('lock')}<span>Chakra Focus ${i === 1 ? 30 : 60}</span></div>`;
    return `<div class="tslot ${cur ? 'on' : ''}"><span class="ts-ic">${cur ? ic('technique', cur) : ui('technique')}</span>
      <select data-techslot="${i}"><option value="">— empty —</option>${learned.map((id) => `<option value="${id}" ${cur === id ? 'selected' : ''}>${TECHNIQUES[id].name} · R${techRank(id)}</option>`).join('')}</select>
      ${cur ? `<small>${TECHNIQUES[cur].desc(techRank(cur))} · ${TECHNIQUES[cur].cost} chakra · ${TECHNIQUES[cur].cd}s</small>` : ''}</div>`;
  };
  return `<section class="win techs">${hdr('Techniques', learned.length ? 'fire on their own when ready' : 'brew scrolls in Shinobi Arts')}
    <div class="tslots">${[0, 1, 2].map(slot).join('')}</div></section>`;
});
UIX.stageMe.push(() => (techOn() ? `<div class="chakrabar" title="Chakra: pays for techniques"><i data-chakra></i><span data-chakratxt></span></div>` : ''));
UIX.actLines.push((skill, a) => {
  const it = a.out && ITEMS[Object.keys(a.out)[0]];
  if (!it || it.type !== 'scroll') return '';
  const r = techRank(it.tech), T = TECHNIQUES[it.tech];
  return `<div class="ac-note tech-note"><span>${ic('technique', it.tech)}${r ? `Rank ${r}/5` : 'Not learned'}</span><span class="muted">${T.desc(Math.min(5, r + (r < 5 ? 1 : 0)))}</span></div>`;
});
UPD.push(() => {
  const el = $('[data-chakra]');
  if (el) { el.style.width = (RT.chakra / chakraMax()) * 100 + '%'; setText($('[data-chakratxt]'), `${fmt(RT.chakra)} / ${fmt(chakraMax())}`); }
});
on('technique', (d) => { burst(d.rank === 1 ? 'Technique learned' : 'Technique ranked up', `${TECHNIQUES[d.id].name} · Rank ${d.rank}`, ic('technique', d.id), rc('shinobi')); });
on('tech', (d) => {
  if (!inBattleView()) return;
  const el = $('[data-portrait="player"]');
  floatAt(el, d.heal ? `+${fmt(d.heal)}${ui('hp')}` : `<small>${esc(TECHNIQUES[d.id].name)}</small>`, d.heal ? 'heal' : 'xp', 0, -30);
});

/* ======================================================= AWAKENING + FORGE */
UIX.inspector.push((id) => {
  if (!gearOn() || !ITEMS[id] || ITEMS[id].type !== 'equip') return '';
  const it = ITEMS[id], g = gearOf(id), out = [];
  if (it.slot === 'weapon') {
    const next = RELEASE[g.rel + 1];
    if (next) {
      const need = relNeed(id, g.rel), why = awakenReason(id);
      out.push(`${hdr('Awakening', g.rel ? RELEASE[g.rel].name : 'Sealed')}
        <div class="aw-row"><span class="pbar"><i style="width:${Math.min(100, (g.xp / need) * 100)}%"></i></span><small>${fmt(g.xp)} / ${fmt(need)} battle XP</small></div>
        <p class="muted small">${next.name}: +${next.atk * 100}% weapon attack${g.rel === 0 ? ' and a gem socket' : ' and a 2nd socket'}. Needs Bladesmithing ${next.smith}.</p>
        <div class="aw-cost">${costTiles(relCost(id, g.rel))}</div>
        ${gbtn(why || next.name, 'awaken', `data-awaken="${id}" ${why ? 'disabled' : ''}`, 'sm')}`);
    } else out.push(`${hdr('Awakening', RELEASE[g.rel].name)}<p class="muted small">Fully released: +${RELEASE[g.rel].atk * 100}% weapon attack.</p>`);
  }
  const ns = socketCount(id);
  if (ns) {
    const gems = Object.keys(GEM_FX).filter((k) => count(k) > 0);
    out.push(`${hdr('Sockets', 'a new gem replaces the old one')}<div class="sockets">${Array.from({ length: ns }, (_, i) => {
      const gm = g.gems[i];
      return `<div class="sock">${gm ? tile(gm, null, { cls: 'xs' }) : `<span class="tile r0 xs"><span class="tile-art">${ui('socket')}</span></span>`}
        <span>${gm ? Object.entries(GEM_FX[gm]).map(([k, v]) => `+${v * 100}% ${k === 'dmg' ? 'damage' : k === 'def' ? 'defense' : 'max HP'}`).join(', ') : 'Empty'}</span>
        <span class="sock-pick">${gems.map((k) => `<button class="mini-btn" data-socket="${id}:${i}:${k}" title="Set ${ITEMS[k].name} (${count(k)} owned)">${itemIc(k)}</button>`).join('') || '<em class="muted">No gems</em>'}</span></div>`;
    }).join('')}</div>`);
  }
  const c = reforgeCost(id), why = reforgeReason(id);
  out.push(`${hdr('Reforge', `tier ${g.tier} / ${REFORGE_MAX}`)}
    <p class="muted small">+12% to every stat per tier. Costs the newest world's relics, so any favourite can keep up.</p>
    ${g.tier < REFORGE_MAX ? `<div class="aw-cost">${tile(null, fmt(c.gold), { r: 3, icon: ui('gold'), cls: 'xs ' + (S.gold < c.gold ? 'short' : ''), title: 'Gold' })}${c.relic ? costTiles({ [c.relic]: c.n }) : ''}</div>
    ${gbtn(why || `Reforge to tier ${g.tier + 1}`, 'reforge', `data-reforge="${id}" ${why ? 'disabled' : ''}`, 'sm')}` : ''}`);
  return `<div class="forge-box">${out.join('')}</div>`;
});
on('awaken', (d) => burst(RELEASE[d.rel].name, ITEMS[d.id].name, itemIc(d.id), rc('soul')));
on('reforge', (d) => toast(`${ITEMS[d.id].name} reforged to tier ${d.tier}.`, 'rare'));

/* ======================================================= input for systems */
document.addEventListener('click', (ev) => {
  const t = ev.target.closest('button');
  if (!t || t.disabled) return;
  const d = t.dataset;
  if (d.awaken) awaken(d.awaken);
  else if (d.socket) { const [id, i, gm] = d.socket.split(':'); socketGem(id, +i, gm); }
  else if (d.reforge) reforge(d.reforge);
});
document.addEventListener('change', (ev) => {
  const d = ev.target.dataset;
  if (d.techslot !== undefined) { equipTech(+d.techslot, ev.target.value); ev.target.blur(); }
});

/* ====================================================================== boot */
boot();
