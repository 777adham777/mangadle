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

/* ============================================================ shared: labels */
Object.assign(TYPE_LABEL, { scroll: 'Technique scroll', seed: 'Seed', meal: 'Buff meal', tool: 'Tool', wish: 'Wish Stone', trap: 'Trap', sigil: 'Sigil', artifact: 'Artifact' });
COL_GROUPS.push(['seed', 'Seeds'], ['meal', 'Buff meals'], ['wish', 'Wish Stones']);
const BUFF_NAME = { speed: 'skill speed', xp: 'XP', dmg: 'damage', gold: 'gold', rare: 'rare finds', all: 'everything' };
SYN_KIND.buff = 'meal duration';
const mmss = (s) => (s >= 3600 ? fmtTime(s) : `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`);

/* ============================================================ KI: FARMING */
UIX.realmTop.push((realm, skill) => {
  if (skill !== 'farming') return '';
  const P = plots();
  const plot = (p, i) => {
    if (!p) {
      const opts = CROPS.filter((c) => count(c.seed) > 0 && skillLv('farming') >= c.level);
      return `<div class="plot empty"><div class="pl-head">${ui('farm')}<b>Plot ${i + 1}</b><small>Empty</small></div>
        <div class="pl-seeds">${opts.length ? opts.map((c) => `<button class="pl-seed" data-plant="${i}:${c.id}" title="Plant ${c.name} (${c.mins} min)">${tile(c.id, count(c.seed), { cls: 'xs' })}<span>${c.name}<small>${c.mins} min</small></span></button>`).join('') : '<span class="muted small">No seeds you can plant. Herbalism, Gravity Training and foes of this world drop them; the Market sells starters.</span>'}</div></div>`;
    }
    const c = CROP_BY[p.crop], T = c.mins * 60, ready = p.t >= T;
    return `<div class="plot ${ready ? 'ready' : 'growing'}"><div class="pl-head">${tile(c.id, null, { cls: 'xs' })}<b>${c.name}</b><small data-plotleft="${i}">${ready ? 'Ready' : mmss(T - p.t)}</small></div>
      <span class="pbar"><i data-plotfill="${i}" style="width:${Math.min(100, (p.t / T) * 100)}%"></i></span>
      ${ready ? gbtn('Harvest', 'check', `data-harvest="${i}"`, 'sm glow') : `<small class="muted">Yields ${c.yield[0]}-${c.yield[1]} · ${fmt(c.xp)} XP</small>`}</div>`;
  };
  return `${hdr('Plots', `${P.length} plots · +1 every 20 levels (max 7) · they grow while you do anything else`)}
    <div class="farm-tools">${autoTendOn() ? `<label class="tog"><input type="checkbox" data-autotend ${S.farm.auto ? 'checked' : ''}><span>Auto-tend: harvest and replant on its own</span></label>` : '<span class="muted small">Auto-tend unlocks at Farming 15.</span>'}</div>
    <div class="plots">${P.map(plot).join('')}</div>
    ${hdr('Crops', 'what each crop is for')}
    <div class="crop-list">${CROPS.map((c) => `<div class="crop ${skillLv('farming') < c.level ? 'locked' : ''}">${tile(c.id, null, { cls: 'xs', unknown: !S.found[c.id] && !count(c.seed) })}<span><b>${c.name}</b><small>Lv ${c.level} · ${c.mins} min · seeds owned: ${fmt(count(c.seed))}</small></span><em>${c.id === 'vital_bean' ? 'Food: heals almost fully' : 'Buff meals (Cooking)'}</em></div>`).join('')}</div>`;
});
UPD.push(() => {
  if (!$('[data-plotfill]')) return;
  plots().forEach((p, i) => {
    if (!p) return;
    const c = CROP_BY[p.crop], T = c.mins * 60, f = $(`[data-plotfill="${i}"]`);
    if (f) f.style.width = Math.min(100, (p.t / T) * 100) + '%';
    setText($(`[data-plotleft="${i}"]`), p.t >= T ? 'Ready' : mmss(T - p.t));
  });
});
on('harvest', (d) => { if (!SIM) feedItem(d.crop, d.n); });

/* ============================================================ KI: TOOLS overview */
UIX.realmSide.push((realm, skill) => {
  if (skill !== 'tinkering') return '';
  const toolSkills = [...new Set(SKILLS.tinkering.actions.map((a) => ITEMS[Object.keys(a.out)[0]]).filter((it) => it.type === 'tool').map((it) => it.toolFor))];
  return `<section class="win">${hdr('Your tools', '+15% speed per tier')}<ul class="rn-list">${toolSkills.map((k) => `<li><span>${ic('skill', k)} ${SKILLS[k].name}</span><b>${toolTier(k) ? 'Mk ' + 'I'.repeat(toolTier(k)) : '—'}</b></li>`).join('')}</ul></section>`;
});
on('tool', (d) => burst('Tool built', `${ITEMS[d.id].name} · ${SKILLS[ITEMS[d.id].toolFor].name} +${toolTier(ITEMS[d.id].toolFor) * 15}% speed`, itemIc(d.id), rc('ki')));

/* ============================================================ KI: MEALS */
UIX.inspectorAny.push((id) => {
  const it = ITEMS[id];
  if (it.type !== 'meal' || !count(id)) return '';
  const b = it.buff, mins = Math.round(b.mins * (1 + synergyBonus('buff', 'cooking')));
  return `${attrList([['star', 'Buff', `+${pct(b.val)} ${BUFF_NAME[b.stat]}`], ['time', 'Duration', `${mins} min`]])}<div class="dt-cta">${gbtn('Eat', 'eat', `data-meal="${id}"`)}</div>`;
});
const buffsHTML = () => {
  const ks = Object.keys(S.buffs);
  if (!ks.length) return '';
  return `<div class="buffs">${ks.map((k) => `<span class="buff">${ui('meal')}+${pct(S.buffs[k].v)} ${BUFF_NAME[k]}<small data-buff="${k}">${mmss(S.buffs[k].t)}</small></span>`).join('')}</div>`;
};
UIX.homeTop.push(buffsHTML);
UIX.realmTop.unshift(() => buffsHTML());
UPD.push(() => { for (const el of $$('[data-buff]')) { const b = S.buffs[el.dataset.buff]; if (b) setText(el, mmss(b.t)); } });

/* ============================================================ KI: TRANSFORMATIONS */
UIX.battleSide.push(() => {
  if (!transformOn()) return '';
  return `<section class="win forms">${hdr('Transformation', 'drains stamina in battle')}
    <div class="seg form-seg"><button class="${!S.ki.form ? 'on' : ''}" data-form=""><span>None</span></button>${FORMS.map((f) => formOpen(f)
      ? `<button class="${S.ki.form === f.id ? 'on' : ''}" data-form="${f.id}" title="×${f.dmg} damage${f.hp > 1 ? `, ×${f.hp} max HP` : ''} · −${f.drain} stamina/s">${ic('form', f.id)}<span>${f.name}</span></button>`
      : `<button class="locked" disabled title="Gravity Training ${f.grav}">${ui('lock')}<span>${f.name}</span></button>`).join('')}</div>
    <p class="muted small">${S.ki.form ? `${FORM_BY[S.ki.form].name}: ×${FORM_BY[S.ki.form].dmg} damage${FORM_BY[S.ki.form].hp > 1 ? `, ×${FORM_BY[S.ki.form].hp} max HP` : ''}, −${FORM_BY[S.ki.form].drain} stamina/s. Drops out at 0, comes back at 60%.` : 'Pick a form: it kicks in automatically while you fight.'}</p></section>`;
});
UIX.stageMe.push(() => (transformOn() ? `<div class="stambar" title="Stamina: powers your transformation"><i data-stam></i><span data-stamtxt></span></div>` : ''));
UPD.push(() => {
  const el = $('[data-stam]');
  if (!el) return;
  el.style.width = (S.ki.stamina / staminaMax()) * 100 + '%';
  el.parentElement.classList.toggle('on', !!activeForm());
  setText($('[data-stamtxt]'), `${activeForm() ? activeForm().name + ' · ' : ''}${fmt(S.ki.stamina)} / ${fmt(staminaMax())}`);
});
on('transform', (f) => { if (f && inBattleView()) floatAt($('[data-portrait="player"]'), `<small>${esc(f.name)}</small>`, 'gold', 0, -40); });

/* ============================================================ KI: GRAVITY side + WISHES */
UIX.realmSide.push((realm, skill) => {
  if (skill !== 'gravity') return '';
  const out = [`<section class="win">${hdr('What Gravity gives you')}<ul class="rn-list">
    <li><span>Inner Power energy</span><b>+${fmt(2 * skillLv('gravity'))}%</b></li>
    <li><span>Stamina</span><b>${fmt(staminaMax())}</b></li>
    ${FORMS.map((f) => `<li><span>${f.name} (Lv ${f.grav})</span><b>${formOpen(f) ? '×' + f.dmg + ' dmg' : ui('lock')}</b></li>`).join('')}</ul></section>`];
  if (wishesOn()) {
    const all = hasAllStones();
    out.push(`<section class="win wishes">${hdr('Wish Stones', `${[1, 2, 3, 4, 5, 6, 7].filter((i) => count('wish_stone_' + i)).length} / 7`)}
      <div class="stones">${[1, 2, 3, 4, 5, 6, 7].map((i) => { const r = WORLD_ORDER[i - 1]; return tile('wish_stone_' + i, null, { cls: 'xs ' + (count('wish_stone_' + i) ? '' : 'dim'), title: `★${i}: ${r ? REALMS[r].name : 'a world not yet reached'}` }); }).join('')}</div>
      <p class="muted small">One stone hides in each world: a very rare find from its skills and foes (bosses drop it more often).</p>
      ${all ? `<div class="wish-list">${WISHES.map((w) => `<button class="wish" data-wish="${w.id}"><b>${w.name}</b><small>${w.desc}${S.wishes[w.id] ? ` · made ×${S.wishes[w.id]}` : ''}</small></button>`).join('')}</div>`
        : `<ul class="rn-list">${WISHES.filter((w) => S.wishes[w.id]).map((w) => `<li><span>${w.name}</span><b>×${S.wishes[w.id]}</b></li>`).join('')}</ul>`}</section>`);
  }
  return out.join('');
});
on('wish', (w) => burst('Wish granted', `${w.name} · ${w.desc}`, ui('wish'), rc('ki')));

document.addEventListener('click', (ev) => {
  const t = ev.target.closest('button');
  if (!t || t.disabled) return;
  const d = t.dataset;
  if (d.plant) { const [i, c] = d.plant.split(':'); plant(+i, c); }
  else if (d.harvest !== undefined) harvest(+d.harvest);
  else if (d.form !== undefined) chooseForm(d.form);
  else if (d.wish) { if (confirm('Use all 7 Wish Stones for this wish?')) makeWish(d.wish); }
  else if (d.meal) { if (eatMeal(d.meal)) toast(`${ITEMS[d.meal].name}: +${pct(ITEMS[d.meal].buff.val)} ${BUFF_NAME[ITEMS[d.meal].buff.stat]}.`, 'good'); }
});
document.addEventListener('change', (ev) => { if ('autotend' in ev.target.dataset) { S.farm.auto = ev.target.checked; dirty = true; } });

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
