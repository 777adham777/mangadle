'use strict';
/* ==========================================================================
   TRI-REALM IDLE — interface for the world systems (systems.js).
   Loaded last: registers its views, then boots the game.
   ========================================================================== */

const costTiles = (cost) => Object.entries(cost).map(([k, n]) => tile(k, `<em data-have="${k}" data-n="${n}">${fmt(count(k))}</em>/${fmt(n)}`, { cls: 'xs ' + (count(k) < n ? 'short' : ''), title: ITEMS[k].name })).join('');
// Techniques: techniques-ui.js

/* ======================================================= AWAKENING + FORGE */
UIX.inspector.push((id) => {
  if (!gearOn() || !ITEMS[id] || ITEMS[id].type !== 'equip' || ITEMS[id].slot === 'weapon') return '';
  const it = ITEMS[id], g = gearOf(id), out = [];
  if (it.slot === 'weapon') {
    const next = RELEASE[g.rel + 1];
    if (next) {
      const need = relNeed(id, g.rel), why = awakenReason(id);
      out.push(`${hdr('Awakening', g.rel ? RELEASE[g.rel].name : 'Sealed')}
        <div class="aw-row"><span class="pbar"><i style="width:${Math.min(100, (g.xp / need) * 100)}%"></i></span><small>${fmt(g.xp)} / ${fmt(need)} battle XP</small></div>
        <p class="muted small">${next.name}: +${next.atk * 100}% weapon attack${g.rel === 0 ? ' and a gem socket' : ' and a 2nd socket'}. Needs Smelting ${next.smith}.</p>
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
    <p class="muted small">+12% to every stat per tier. Costs the newest world's relics, so any favourite can keep up. Tier 6 is Rift-forged with a Rift Shard.</p>
    ${g.tier < REFORGE_MAX ? `<div class="aw-cost">${tile(null, fmt(c.gold), { r: 3, icon: ui('gold'), cls: 'xs ' + (S.gold < c.gold ? 'short' : ''), title: 'Gold' })}${c.relic ? costTiles({ [c.relic]: c.n }) : ''}</div>
    ${gbtn(why || `Reforge to tier ${g.tier + 1}`, 'reforge', `data-reforge="${id}" ${why ? 'disabled' : ''}`, 'sm')}` : ''}`);
  return `<div class="forge-box">${out.join('')}</div>`;
});
on('awaken', (d) => burst(RELEASE[d.rel].name, ITEMS[d.id].name, itemIc(d.id), rc('soul')));
on('reforge', (d) => toast(`${ITEMS[d.id].name} reforged to tier ${d.tier}.`, 'rare'));

/* ============================================================ shared: labels */
Object.assign(TYPE_LABEL, { scroll: 'Technique scroll', seed: 'Seed', meal: 'Buff meal', tool: 'Tool', wish: 'Dragon Ball', trap: 'Trap', artifact: 'Artifact' });
COL_GROUPS.push(['seed', 'Seeds'], ['meal', 'Buff meals'], ['tonic', 'Tonics'], ['wish', 'Dragon Balls']);
const BUFF_NAME = { speed: 'skill speed', xp: 'XP', dmg: 'damage', gold: 'gold', rare: 'rare finds', all: 'everything',
  dbl: 'double output', keep: 'free crafts', extra: 'by-products' };
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
  if (skill !== 'arts' || !isUnlocked('realm:ki')) return '';
  const toolSkills = [...new Set(SKILLS.arts.actions.map((a) => ITEMS[Object.keys(a.out)[0]]).filter((it) => it.type === 'tool').map((it) => it.toolFor))];
  return `<section class="win">${hdr('Your tools', '+15% speed per tier')}<ul class="rn-list">${toolSkills.map((k) => `<li><span>${ic('skill', k)} ${SKILLS[k].name}</span><b>${toolTier(k) ? 'Mk ' + 'I'.repeat(toolTier(k)) : '—'}</b></li>`).join('')}</ul></section>`;
});
on('tool', (d) => burst('Tool built', `${ITEMS[d.id].name} · ${SKILLS[ITEMS[d.id].toolFor].name} +${toolTier(ITEMS[d.id].toolFor) * 15}% speed`, itemIc(d.id), rc('ki')));

/* ============================================================ KI: MEALS */
UIX.inspectorAny.push((id) => {
  const it = ITEMS[id];
  if ((it.type !== 'meal' && it.type !== 'tonic') || !count(id)) return '';
  const b = it.buff, mins = Math.round(b.mins * (it.type === 'meal' ? 1 + synergyBonus('buff', 'cooking') : 1));
  return `${attrList([['star', 'Buff', `+${pct(b.val)} ${BUFF_NAME[b.stat]}`], ['time', 'Duration', `${mins} min`]])}<div class="dt-cta">${gbtn(it.type === 'tonic' ? 'Drink' : 'Eat', 'eat', `data-meal="${id}"`)}</div>`;
});
const buffsHTML = () => {
  const ks = Object.keys(S.buffs);
  if (!ks.length) return '';
  return `<div class="buffs">${ks.map((k) => `<span class="buff">${ui('meal')}+${pct(S.buffs[k].v)} ${BUFF_NAME[k]}<small data-buff="${k}">${mmss(S.buffs[k].t)}</small></span>`).join('')}</div>`;
};
UIX.homeTop.push(buffsHTML);

/* ============================================================ KI: TIME CHAMBER */
function chamberHTML() {
  if (!chamberOn()) return '';
  const C = S.chamber, cap = chamberCap();
  return `<section class="win chamber">${hdr('Time Chamber', `<span data-chambertxt>${fmtTime(C.store)}</span> / ${fmtTime(cap)} stored`)}
    <div class="chamber-row"><span class="pbar"><i data-chamberfill style="width:${(C.store / cap) * 100}%"></i></span>
      ${gbtn(C.on ? 'Stop' : 'Accelerate ×2', C.on ? 'stop' : 'play', `data-chamber ${!C.on && !C.store ? 'disabled' : ''}`, `sm ${C.on ? 'glow' : ''}`)}</div>
    <p class="muted small">While on, your current activity and your ships run twice as fast, using stored time${C.on && !chamberBusy() ? ' (nothing to accelerate right now)' : ''}. Battles are not accelerated. Hours away beyond the ${BASE_OFFLINE_HOURS}-hour offline limit fill it; Gravity Training grows it (+4 h every 25 levels).</p></section>`;
}
UIX.homeTop.push(chamberHTML);
UIX.realmSide.push((realm, skill) => (skill === 'gravity' ? chamberHTML() : ''));
UPD.push(() => {
  const el = $('[data-chamberfill]');
  if (el) { el.style.width = (S.chamber.store / chamberCap()) * 100 + '%'; setText($('[data-chambertxt]'), fmtTime(S.chamber.store)); }
});
document.addEventListener('click', (ev) => { const t = ev.target.closest('[data-chamber]'); if (t && !t.disabled) toggleChamber(); });
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
    <li><span>Discipline training speed</span><b>+${fmt(2 * skillLv('gravity'))}%</b></li>
    <li><span>Stamina</span><b>${fmt(staminaMax())}</b></li>
    ${FORMS.map((f) => `<li><span>${f.name} (Lv ${f.grav})</span><b>${formOpen(f) ? '×' + f.dmg + ' dmg' : ui('lock')}</b></li>`).join('')}</ul></section>`];
  if (wishesOn()) {
    const all = hasAllStones();
    out.push(`<section class="win wishes">${hdr('Dragon Balls', `${[1, 2, 3, 4, 5, 6, 7].filter((i) => count('wish_stone_' + i)).length} / 7`)}
      <div class="stones">${[1, 2, 3, 4, 5, 6, 7].map((i) => { const r = WORLD_ORDER[i - 1]; return tile('wish_stone_' + i, null, { cls: 'xs ' + (count('wish_stone_' + i) ? '' : 'dim'), title: `★${i}: ${r ? REALMS[r].name : 'a world not yet reached'}` }); }).join('')}</div>
      <p class="muted small">One stone hides in each world: a very rare find from its skills and foes (bosses drop it more often).</p>
      ${all ? `<div class="wish-list">${WISHES.map((w) => `<button class="wish" data-wish="${w.id}"><b>${w.name}</b><small>${w.desc}${S.wishes[w.id] ? ` · made ×${S.wishes[w.id]}` : ''}</small></button>`).join('')}</div>`
        : `<ul class="rn-list">${WISHES.filter((w) => S.wishes[w.id]).map((w) => `<li><span>${w.name}</span><b>×${S.wishes[w.id]}</b></li>`).join('')}</ul>`}</section>`);
  }
  return out.join('');
});
on('wish', (w) => burst('Shenron grants your wish', `${w.name} · ${w.desc}`, ui('wish'), rc('ki')));

document.addEventListener('click', (ev) => {
  const t = ev.target.closest('button');
  if (!t || t.disabled) return;
  const d = t.dataset;
  if (d.plant) { const [i, c] = d.plant.split(':'); plant(+i, c); }
  else if (d.harvest !== undefined) harvest(+d.harvest);
  else if (d.form !== undefined) chooseForm(d.form);
  else if (d.wish) { if (confirm('Summon Shenron with all 7 Dragon Balls for this wish?')) makeWish(d.wish); }
  else if (d.meal) { if (eatMeal(d.meal)) toast(`${ITEMS[d.meal].name}: +${pct(ITEMS[d.meal].buff.val)} ${BUFF_NAME[ITEMS[d.meal].buff.stat]}.`, 'good'); }
});
document.addEventListener('change', (ev) => { if ('autotend' in ev.target.dataset) { S.farm.auto = ev.target.checked; dirty = true; } });

/* ============================================================ HEX: BINDING VOWS */
UIX.realmTop.push((realm, skill) => {
  if (skill !== 'exorcism') return '';
  if (!pactsOn()) return `<section class="win">${hdr('Binding Vows')}<p class="muted small">${ui('lock')} ${esc(lockedNote('feature:vows').replace('Locked. ', ''))}</p></section>`;
  const n = pactSlots(), act = S.pacts.active.slice(0, n), m = pactMult();
  return `<section class="win">${hdr('Binding Vows', `${act.length} / ${n} sworn · 2nd vow at Cursed Research 40, 3rd at 80 · bonuses ×${m.toFixed(2)} from your level`)}
    <p class="muted small">A restriction for a bonus. You can break a vow at any time.</p>
    <div class="pacts">${PACTS.map((p) => {
      const on = act.includes(p.id);
      return `<button class="pact ${on ? 'on' : ''}" data-pact="${p.id}" ${!on && act.length >= n ? 'disabled' : ''}>
        <b>${p.name}</b><span class="vow">${ui('pact')}${p.vow}</span><span class="gift">${ui('star')}${p.gift(m)}</span><em>${on ? 'Sworn · click to break' : 'Swear this vow'}</em></button>`;
    }).join('')}</div>
    <p class="muted small">Time under vows: <b data-pacttime>${fmtTime(S.stats.pactTime || 0)}</b></p></section>`;
});
UPD.push(() => { const el = $('[data-pacttime]'); if (el) setText(el, fmtTime(S.stats.pactTime || 0)); });
document.addEventListener('click', (ev) => {
  const t = ev.target.closest('button');
  if (t && !t.disabled && t.dataset.pact) togglePact(t.dataset.pact);
});

/* ============================================================ HUNTER: CONTRACTS + CARD BOOK */
VIEW_FEATURE.contracts = 'contracts';
Object.assign(TYPE_LABEL, { bait: 'Bait' });
COL_GROUPS.push(['trap', 'Traps'], ['bait', 'Baits']);
UIX.quick.push(() => (contractsOn() || isUnlocked('realm:hunter') ? [['contracts', 'contracts', 'Contracts']] : []));
const contractTitle = (c) => (c.kind === 'kill' ? `Defeat ${fmt(c.n)} foes in ${ZONES.find((z) => z.id === c.target).name}` : `${c.kind === 'gather' ? 'Gather' : 'Make'} ${fmt(c.n)} ${ITEMS[c.target].name}`);
const contractIcon = (c) => (c.kind === 'kill' ? ic('zone', c.target) : itemIc(c.target));
const contractGo = (c) => (c.kind === 'kill' ? 'battle' : `realm:${c.realm}:${c.skill}`);
VIEWS.contracts = () => {
  const L = licence(), next = RANKS[L + 1], C = S.contracts;
  const card = (c, i) => {
    const p = contractProg(c), done = p >= c.n;
    return `<section class="win contract ${done ? 'done' : ''}" style="--rc:${rc(c.realm)}">
      <div class="ct-head"><span class="ct-ic">${contractIcon(c)}</span><div><small>${REALMS[c.realm].name} · ${'★'.repeat(c.stars)}</small><b>${contractTitle(c)}</b></div></div>
      <div class="q-prog"><span class="xpbar thin gold"><i data-ctbar="${i}" style="width:${(p / c.n) * 100}%"></i></span><span data-cttxt="${i}">${fmt(Math.max(0, p))} / ${fmt(c.n)}</span></div>
      <div class="ct-foot">${done ? gbtn('Claim', 'check', `data-ctclaim="${i}"`, 'sm glow') : gbtn('Go', 'play', `data-nav="${contractGo(c)}"`, 'dark sm')}
        ${done ? '' : gbtn(rerollCost() ? `New contract · ${fmt(rerollCost())}` : 'New contract · free', 'rebirth', `data-ctreroll="${i}" ${rerollCost() && S.gold < rerollCost() ? 'disabled' : ''}`, 'dark sm')}</div>
    </section>`;
  };
  const page = (r) => {
    const ids = cardsOf(r), got = ids.filter((k) => S.cards[k]).length;
    return `<section class="win cbook" style="--rc:${rc(r)}">${hdr(REALMS[r].name, `${got} / ${ids.length}${pageDone(r) ? ' · complete: +10% speed here, +5% damage & defense in its zones' : ''}`)}
      <div class="cards">${ids.map((k) => { const c = CARDS[k], own = S.cards[k]; return `<div class="hcard ${own ? 'own' : ''}" title="${own ? esc(c.name) : 'Unknown card'}">${own ? (c.kind === 'foe' ? ic('enemy', c.ref) : itemIc(c.ref)) : '<b class="q">?</b>'}<small>${own ? esc(c.name) : '???'}</small></div>`; }).join('')}</div></section>`;
  };
  return `${ptitle("Green Island", 'Contracts')}
  ${fitCols('ct-board', `<section class="win licence"><div class="lc-badge">${ui('star2')}<b>${S.contracts.stars}</b></div>
    <div><small>Hunter Licence</small><h2>${RANKS[L][1]}</h2><p class="muted small">${next ? `${next[0] - S.contracts.stars} more stars to ${next[1]}. ` : ''}Rewards ×${RANKS[L][2]} · ${contractSlots()} contracts · Silver: a free new contract every refresh · Gold: 5 contracts.</p></div>
    <div class="lc-next"><small>New contracts in</small><b data-ctnext>${fmtTime(Math.max(0, (C.next - Date.now()) / 1000))}</b></div></section>
  ${hdr('Board', 'targets in every world you have opened')}
  <div class="contracts">${C.list.map(card).join('') || '<div class="empty-note">No contracts yet.</div>'}</div>`,
  `${hdr('Greed Island Cards', 'contracts give a card 70% of the time; foes drop them very rarely')}
  <div class="cbooks">${WORLD_ORDER.filter(realmOpen).map(page).join('')}</div>`)}`;
};
UPD.push(() => {
  const el = $('[data-ctnext]');
  if (!el) return;
  setText(el, fmtTime(Math.max(0, (S.contracts.next - Date.now()) / 1000)));
  S.contracts.list.forEach((c, i) => {
    const p = contractProg(c), b = $(`[data-ctbar="${i}"]`);
    if (b) b.style.width = Math.min(100, (p / c.n) * 100) + '%';
    setText($(`[data-cttxt="${i}"]`), `${fmt(Math.max(0, p))} / ${fmt(c.n)}`);
    const sec = b && b.closest('.contract');
    if (sec && (p >= c.n) !== sec.classList.contains('done')) dirty = true;
  });
});
on('contract', (d) => toast(`Contract done: +${fmt(d.gold)} gold, +${d.stars}★${d.card ? `, card: ${CARDS[d.card].name}` : ''}`, 'rare'));
on('card', (d) => { if (d.done) burst('Card page complete', REALMS[CARDS[d.id].realm].name, ui('card'), rc(CARDS[d.id].realm)); else toast(`New card: ${CARDS[d.id].name} (${d.source})`, 'good'); });

/* ============================================================ HUNTER: BEASTS */
UIX.realmTop.push((realm, skill) => {
  if (skill !== 'tracking') return '';
  const ids = Object.keys(BEASTS), n = compSlots();
  return `${hdr('Companions', `${companions().length} / ${n} active${n < 3 ? ` · next slot at Hunting ${n === 1 ? 30 : 60}` : ''} · they level while active, or with Beast Essence`)}
    <div class="beasts">${ids.map((id) => {
      const B = BEASTS[id], own = S.beasts[id], on = isCompanion(id), lv = beastLv(id);
      if (!own) return `<div class="beast unknown">${ic('beast', id)}<span><b>${B.name}</b><small>${REALMS[B.realm].name} · hunt at Hunting ${B.level} with a ${ITEMS[B.trap].name}</small></span><em>+${pct(B.base)} ${B.desc}</em></div>`;
      const nxt = lv < 20 ? 40 * lv * lv : 0, prog = lv < 20 ? (S.beasts[id].xp - 40 * (lv - 1) ** 2) / (nxt - 40 * (lv - 1) ** 2) : 1;
      const shiny = own.shiny, val = beastVal(id) * (shiny && typeof SHINY_BEAST_FX !== 'undefined' ? SHINY_BEAST_FX : 1);
      return `<div class="beast ${on ? 'on' : ''} ${shiny ? 'shiny' : ''}" style="--rc:${rc(B.realm)}">${ic('beast', id)}<span><b>${shiny ? `${ui('shiny')}Shiny ` : ''}${B.name} · Lv ${lv}</b><small>+${pct(val)} ${B.desc}</small>
        <span class="pbar"><i style="width:${prog * 100}%"></i></span></span>
        <span class="bt-cta">${on ? gbtn('Active · rest', 'check', `data-companion="${id}"`, 'sm glow') : gbtn(companions().length >= n ? 'Swap in' : 'Make active', 'play', `data-companion="${id}"`, 'sm')}
        ${lv < 20 && count('beast_essence') ? gbtn(`Feed ×${Math.min(10, count('beast_essence'))}`, 'eat', `data-feed="${id}"`, 'dark sm') : ''}</span></div>`;
    }).join('')}</div>`;
});
UIX.actLines.push((skill, a) => {
  if (a.beast) return `<div class="ac-note"><span>${ic('beast', a.beast)}${S.beasts[a.beast] ? (S.beasts[a.beast].shiny ? 'Shiny · gives Beast Essence' : 'Tamed · gives Beast Essence · its Shiny form 1/250') : `Capture chance ${pct(captureChance(a))} · Shiny 1/40`}</span></div>`;
  const it = a.out && ITEMS[Object.keys(a.out)[0]];
  if (it && it.type === 'trap') return `<div class="ac-note"><span>${ui('beast')}For: ${Object.values(BEASTS).filter((b) => b.trap === it.id || b.trap === Object.keys(a.out)[0]).map((b) => b.name).join(', ')}</span></div>`;
  if (it && it.type === 'bait') return `<div class="ac-note"><span>${ui('bait')}${SKILLS[it.baitFor].name}: +50% rare finds, +10% double</span></div>`;
  return '';
});
UIX.realmSide.push((realm, skill) => {
  const b = Object.keys(ITEMS).find((k) => ITEMS[k].type === 'bait' && ITEMS[k].baitFor === skill);
  if (!b || !count(b)) return '';
  return `<section class="win">${hdr('Bait', `${fmt(count(b))} ${ITEMS[b].name}`)}
    <label class="tog"><input type="checkbox" data-usebait ${S.useBait !== false ? 'checked' : ''}><span>Use bait: 1 per action, +50% rare finds, +10% double</span></label></section>`;
});
on('tamed', (id) => burst('Beast tamed', `${BEASTS[id].name} · +${pct(beastVal(id))} ${BEASTS[id].desc}`, ic('beast', id), rc(BEASTS[id].realm)));

document.addEventListener('click', (ev) => {
  const t = ev.target.closest('button');
  if (!t || t.disabled) return;
  const d = t.dataset;
  if (d.ctclaim !== undefined) claimContract(+d.ctclaim);
  else if (d.ctreroll !== undefined) rerollContract(+d.ctreroll);
  else if (d.companion) setCompanion(d.companion);
  else if (d.feed) feedBeast(d.feed, 10);
});
document.addEventListener('change', (ev) => { if ('usebait' in ev.target.dataset) { S.useBait = ev.target.checked; dirty = true; } });

/* ============================================================ ECHO: YOUR ECHO */
COL_GROUPS.push(['artifact', 'Artifacts']);
const echoTaskName = () => { const t = S.echo.task, a = t && findAction(t.skill, t.id); return a ? `${SKILLS[t.skill].name} · ${a.name}` : 'Idle'; };
function echoTaskOptions() {
  const out = [];
  for (const k of Object.keys(SKILLS)) {
    const s = SKILLS[k];
    if (!skillOpen(k) || k === 'bonding' || s.type === 'farm' || s.type === 'pact' || s.type === 'combat' || !s.actions.length) continue;
    const ok = echoCanWork(k);
    const acts = s.actions.filter((a) => skillLv(k) >= a.level && (!a.schem || S.known[a.schem]));
    if (acts.length) out.push(`<optgroup label="${esc(s.name)}${ok ? '' : ' (out of range)'}">${acts.map((a) => `<option value="${k}:${a.id}" ${ok ? '' : 'disabled'} ${S.echo.task && S.echo.task.skill === k && S.echo.task.id === a.id ? 'selected' : ''}>${esc(a.name)}</option>`).join('')}</optgroup>`);
  }
  return out.join('');
}
UIX.realmTop.push((realm, skill) => {
  if (skill !== 'bonding') return '';
  if (!echoOn()) return `<section class="win echo-none">${ui('echo')}<div><b>No Echo yet</b><p class="muted small">Gather 3 Stand Arrow Shards (Archaeology, Echo Quarter foes, the Rift) and use <b>Awaken an Echo</b> below. Each Echo has its own grades and ability.</p></div></section>`;
  const E = ECHO_BY[S.echo.id], bl = bondLv(), bp = Math.sqrt((S.echo.bond || 0) / 30) - bl;
  const why = S.echo.task ? echoTaskBlock() : '';
  return `<section class="win echo-card" style="--rc:${rc('echo')}">
    <div class="ec-head"><span class="ec-ic">${ic('echo', E.id)}</span><div><small>Your Echo</small><h2>${E.name}</h2><p class="muted small">${E.ability}</p></div>
      <div class="ec-bond"><small>Bond</small><b>${bl}</b><span class="pbar"><i style="width:${Math.min(100, bp * 100)}%"></i></span></div></div>
    <div class="grades">${ESTATS.map(([k, l]) => `<div class="grade g${grade(k)}"><b>${GRADES[grade(k)]}</b><small>${l}</small></div>`).join('')}</div>
    <p class="muted small">Every 10 bond levels raises all grades by one. Power +5% damage/grade · Speed: how fast it works · Range: reaches the first ${echoRange()} worlds · Durability +4% max HP/grade · Precision +5% double/grade · Potential: faster bond.</p>
    ${hdr('Task', 'runs in parallel with what you do')}
    <div class="ec-task"><select data-echotask><option value="">— Idle —</option>${echoTaskOptions()}</select>
      <span class="pbar"><i data-echofill></i></span><small data-echostate>${S.echo.task ? (why || `${echoTaskName()} · ${pct(echoSpeedMult(S.echo.task.skill))} speed`) : 'Give your Echo something to do.'}</small></div>
    <div class="btn-row">${gbtn('Release this Echo', 'close', 'data-echorelease', 'dark sm')}</div>
  </section>`;
});
UPD.push(() => {
  const f = $('[data-echofill]');
  if (!f || !echoOn() || !S.echo.task) return;
  const a = findAction(S.echo.task.skill, S.echo.task.id);
  if (a) f.style.width = Math.min(100, (S.echo.prog / actionTime(S.echo.task.skill, a)) * 100) + '%';
});
UIX.homeTop.push(() => (echoOn() ? `<div class="echo-chip">${ic('echo', S.echo.id)}<span>${ECHO_BY[S.echo.id].name}: <b>${esc(echoTaskName())}</b></span>${gbtn('Echo', 'play', 'data-nav="realm:echo:bonding"', 'dark sm')}</div>` : ''));
UIX.realmSide.push((realm, skill) => {
  if (skill !== 'restoration') return '';
  const ids = Object.keys(ARTIFACTS);
  return `<section class="win">${hdr('Museum', `${Object.keys(S.museum).length} / ${ids.length}`)}<ul class="rn-list">${ids.map((id) => `<li><span>${S.museum[id] ? ITEMS[id].name : '???'}</span><b class="${S.museum[id] ? '' : 'muted'}">${ARTIFACTS[id].desc}</b></li>`).join('')}</ul></section>`;
});
UIX.actLines.push((skill, a) => {
  const o = a.out && Object.keys(a.out)[0];
  if (o && ARTIFACTS[o]) return `<div class="ac-note"><span>${ui('museum')}${S.museum[o] ? 'In the museum' : 'Museum: ' + ARTIFACTS[o].desc}</span></div>`;
  return '';
});
on('echo', (e) => burst('Echo awakened', `${e.name} · ${e.ability}`, ic('echo', e.id), rc('echo')));
on('artifact', (id) => burst('Artifact restored', `${ITEMS[id].name} · ${ARTIFACTS[id].desc}`, itemIc(id), rc('echo')));

document.addEventListener('click', (ev) => {
  const t = ev.target.closest('button');
  if (!t || t.disabled) return;
  if ('echorelease' in t.dataset && confirm('Release your Echo? Its bond and grades are lost.')) releaseEcho();
});
document.addEventListener('change', (ev) => {
  if (!('echotask' in ev.target.dataset)) return;
  const v = ev.target.value; ev.target.blur();
  if (!v) setEchoTask(null); else { const [k, id] = v.split(':'); if (!setEchoTask(k, id)) toast('Your Echo cannot do that.', 'bad'); }
});

/* ======================================================= input for systems */
document.addEventListener('click', (ev) => {
  const t = ev.target.closest('button');
  if (!t || t.disabled) return;
  const d = t.dataset;
  if (d.awaken) awaken(d.awaken);
  else if (d.socket) { const [id, i, gm] = d.socket.split(':'); socketGem(id, +i, gm); }
  else if (d.reforge) reforge(d.reforge);
  else if (d.salvage) {
    const [id, q] = d.salvage.split(':'), got = salvage(id, q === 'all' ? count(id) : 1);
    if (got) toast(`Salvaged: ${Object.entries(got).map(([k, n]) => `${ITEMS[k].name} ×${n}`).join(', ')}`, 'good');
  }
});

/* ====================================================================== boot */
boot();
