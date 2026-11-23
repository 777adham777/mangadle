'use strict';
/* ==========================================================================
   TRI-REALM IDLE — the Mission Board on screen (missions.js is the engine)
   A chip in the activity bar (missions posted / board slots) opens the board:
   the running mission with its progress, the queue as mission scrolls (rank D-S),
   and a one-line form to post a new one. Loaded after ui.js.
   ========================================================================== */

Object.assign(ICONS.ui, { missions: 'tied-scroll' });

const msActIc = (m) => {
  if (m.k === 'zone') { const z = ZONES[msZoneIndex(m)]; return z ? ic('zone', z.id) : ui('battle'); }
  const a = SKILLS[m.skill] && findAction(m.skill, m.id);
  return a ? actIc(m.skill, a) : ui('quest');
};
const msRealm = (m) => (m.k === 'zone' ? (ZONES[msZoneIndex(m)] || {}).realm || 'combat' : SKILLS[m.skill] ? SKILLS[m.skill].realm : 'hub');
// Seconds one unit of the mission takes (an action, or a kill on that stage).
function msUnit(m) {
  if (m.k === 'zone') {
    const zi = msZoneIndex(m), z = ZONES[zi];
    if (!z) return 0;
    return timeToKill(enemyAt(zi, 0)) + (z.boss ? BOSS_RESPAWN : 1.2);
  }
  const a = SKILLS[m.skill] && findAction(m.skill, m.id);
  return a ? actionTime(m.skill, a) : 0;
}
function msEta(m, done) {
  if (!m.n) {
    if (m.k === 'act') { const a = findAction(m.skill, m.id); if (a && a.in) return `${fmt(farmRates(m.skill, a).can)} left`; }
    return 'until it stops';
  }
  const left = Math.max(0, m.n - (done || 0));
  return '~' + fmtTime(left * msUnit(m));
}
const msSizeLabel = (m) => (m.n ? `×${fmt(m.n)}` : 'Until it stops');

function msRow(m, i, cur) {
  const why = cur ? '' : msWhy(m), r = msRealm(m), a = m.k === 'act' && SKILLS[m.skill] ? findAction(m.skill, m.id) : null;
  const prep = !cur && msPrepOn() && a && a.in && m.n && !canAfford(Object.fromEntries(Object.entries(a.in).map(([k, n]) => [k, n * m.n])));
  const where = m.k === 'zone' ? 'Battlefield' : SKILLS[m.skill] ? SKILLS[m.skill].name : '';
  return `<li class="ms-row ${cur ? 'run' : ''} ${why ? 'warn' : ''}" style="--rc:${rc(r)}">
    <span class="ms-rank r-${msLetter(m.n)}" title="${msLetter(m.n)}-rank mission">${msLetter(m.n)}</span>
    ${tile(null, null, { r: 3, icon: msActIc(m), cls: 'xs', title: msName(m) })}
    <span class="ms-main"><b>${esc(msName(m))}</b>
      <small>${esc(where)} · ${msSizeLabel(m)}${cur ? ` · <span data-msdone>${fmt(m.done)}</span>${m.n ? ' / ' + fmt(m.n) : ''}` : ''}${why ? ` · <em class="bad">${esc(why)}</em>` : ''}</small>
      ${cur && m.n ? `<span class="pbar"><i data-msbar style="width:${Math.min(100, (m.done / m.n) * 100)}%"></i></span>` : ''}</span>
    <span class="ms-eta" ${cur ? 'data-mseta' : ''}>${cur ? (S.missions.paused ? 'running' : msEta(m, m.done)) : msEta(m)}</span>
    <span class="ms-tools">
      ${prep ? `<button class="mini-btn" data-msprep="${i}" title="Prepare: post the gathering this mission lacks before it">${ui('plus')}</button>` : ''}
      ${!cur ? `<button class="mini-btn" data-msup="${i}" title="Move up" ${i === 0 ? 'disabled' : ''}>▲</button><button class="mini-btn" data-msdown="${i}" title="Move down" ${i === S.missions.list.length - 1 ? 'disabled' : ''}>▼</button>` : ''}
      <button class="mini-btn hot" data-msdrop="${cur ? -1 : i}" title="${cur ? 'Cancel this mission (the activity keeps running)' : 'Remove'}">${ui('close')}</button>
    </span></li>`;
}

// Everything you can post: skill tasks of every open world, then the Battlefield stages.
function msOptions() {
  const groups = [];
  for (const r of WORLD_ORDER) {
    if (!realmOpen(r)) continue;
    const opts = [];
    for (const k of Object.keys(SKILLS).filter((x) => SKILLS[x].realm === r && skillOpen(x) && SKILLS[x].type !== 'voyage')) {
      for (const a of SKILLS[k].actions) if (skillLv(k) >= a.level && !(a.schem && !S.known[a.schem])) opts.push([`a|${k}|${a.id}`, `${SKILLS[k].name} · ${a.name}`]);
    }
    if (opts.length) groups.push([REALMS[r].name, opts]);
  }
  if (isUnlocked('feature:battle')) {
    const zs = ZONES.map((z, i) => [z, i]).filter(([, i]) => zoneUnlocked(i)).map(([z]) => [`z|${z.id}`, `${z.boss ? 'Boss · ' : ''}${z.name}`]);
    if (zs.length) groups.push(['Battlefield', zs]);
  }
  return groups;
}
function msParse(v) {
  if (!v) return null;
  const p = v.split('|');
  return p[0] === 'z' ? { k: 'zone', zone: p[1] } : { k: 'act', skill: p[1], id: p[2] };
}
function msCurrentChoice() {
  if (S.action) return `a|${S.action.skill}|${S.action.id}`;
  if (S.combat.zone != null) return `z|${ZONES[S.combat.zone].id}`;
  return '';
}

function boardHTML() {
  const M = msState(), slots = msSlots(), free = msFree();
  const groups = msOptions(), sel = S.ui.msSel || msCurrentChoice(), size = S.ui.msSize != null ? S.ui.msSize : 100;
  const rows = (M.cur ? msRow(M.cur, -1, true) : '') + M.list.map((m, i) => msRow(m, i, false)).join('')
    + Array.from({ length: Math.max(0, free) }, () => `<li class="ms-row empty"><span class="ms-rank">·</span><span class="ms-main"><small>Free slot</small></span></li>`).join('');
  const waiting = !M.cur && M.list.length && !idleNow() && !M.paused;
  return `<div class="ms-board">
    <div class="ms-head"><span class="ms-crest">${ui('missions')}</span>
      <div><small>Leaf mission desk · Rank ${msRankName()}</small><h2>Mission Board</h2></div>
      <span class="ms-slots"><b>${msUsed()}</b> / ${slots}</span></div>
    ${M.paused && M.list.length ? `<div class="ms-note paused">${ui('stop')}<span>Board paused: you stopped an activity yourself.</span>${gbtn('Resume', 'play', 'data-msresume', 'sm')}</div>` : ''}
    ${waiting ? `<div class="ms-note">${ui('info')}<span>Your current activity runs first. The next mission starts when it stops.</span></div>` : ''}
    <ol class="ms-list">${rows}</ol>
    <div class="ms-post">
      <select id="ms-sel" data-mssel aria-label="Mission to post">${groups.map(([g, opts]) => `<optgroup label="${esc(g)}">${opts.map(([v, l]) => `<option value="${v}" ${v === sel ? 'selected' : ''}>${esc(l)}</option>`).join('')}</optgroup>`).join('')}</select>
      <div class="ms-sizes" role="group" aria-label="Mission size">${MS_SIZES.map(([n, L]) => `<button class="${n === size ? 'on' : ''}" data-mssize="${n}" title="${n ? '×' + n : 'Until it stops'}"><b>${L}</b><small>${n ? fmt(n) : '∞'}</small></button>`).join('')}</div>
      ${gbtn('Post', 'plus', `data-mspost ${free > 0 ? '' : 'disabled'}`, 'sm')}
    </div>
    <p class="muted small ms-help">Missions run in order, even while you are away. One ends at its size (D 25 · C 100 · B 500 · A 2000), or when its activity stops: out of materials, or a defeat. S-rank runs until it stops.${msPrepOn() ? ' The + button posts the gathering a craft lacks before it.' : ' More slots, and preparing crafts, come with your rank.'}</p>
  </div>`;
}
const boardOpen = () => $('#modal').classList.contains('show') && !!$('#modal-body .ms-board');
function showBoard() { openModal(boardHTML(), 'Close'); }
function refreshBoard() { if (boardOpen()) $('#modal-body').innerHTML = boardHTML(); }

UIX.nowbar.push(() => {
  if (!msOn()) return '';
  const M = msState();
  return `<button class="ms-chip ${M.cur ? 'run' : ''} ${M.paused && M.list.length ? 'paused' : ''}" data-msboard title="Mission Board">${ui('missions')}<b>${msUsed()}/${msSlots()}</b></button>`;
});

on('mission', (d) => {
  if (d.why === 'done') toast(`Mission complete: ${d.name} ${d.m.n ? '×' + fmt(d.m.n) : ''}`, 'good');
  else if (d.why === 'skip') toast(`Mission skipped: ${d.name} (${d.reason})`, 'bad');
  sideDirty = true;
  refreshBoard();
});

let msSig = '';
UPD.push(() => {
  if (!boardOpen()) return;
  const M = S.missions, c = M.cur;
  const sig = (c ? c.skill + c.zone + c.id : '') + '|' + M.list.length + '|' + M.paused + '|' + idleNow();
  if (sig !== msSig) { msSig = sig; refreshBoard(); return; }
  if (!c) return;
  for (const el of $$('[data-msdone]')) setText(el, fmt(c.done));
  for (const el of $$('[data-msbar]')) el.style.width = Math.min(100, (c.done / (c.n || 1)) * 100) + '%';
  for (const el of $$('[data-mseta]')) setText(el, msEta(c, c.done));
});

// Retreating from a fight yourself pauses the board too.
document.addEventListener('click', (ev) => { if (ev.target.closest('[data-stopcombat]') && S.combat.zone != null) msPauseIfMine(); }, true);
document.addEventListener('click', (ev) => {
  const t = ev.target.closest('[data-msboard],[data-mspost],[data-msdrop],[data-msup],[data-msdown],[data-msprep],[data-msresume],[data-mssize]');
  if (!t || t.disabled) return;
  const d = t.dataset;
  if ('msboard' in d) { showBoard(); return; }
  if ('mspost' in d) {
    const sel = $('#ms-sel'), m = msParse(sel && sel.value);
    if (!m) return;
    m.n = S.ui.msSize != null ? S.ui.msSize : 100;
    S.ui.msSel = sel.value;
    if (postMission(m)) toast(`Mission posted: ${msName(m)} (${msLetter(m.n)}-rank)`, 'good');
  }
  else if (d.msdrop !== undefined) dropMission(+d.msdrop);
  else if (d.msup !== undefined) moveMission(+d.msup, -1);
  else if (d.msdown !== undefined) moveMission(+d.msdown, 1);
  else if (d.msprep !== undefined) { const n = prepareMission(+d.msprep); if (n) toast(`${n} gathering mission${n > 1 ? 's' : ''} posted before it.`, 'good'); }
  else if ('msresume' in d) resumeBoard();
  else if (d.mssize !== undefined) S.ui.msSize = +d.mssize;
  sideDirty = true;
  refreshBoard();
});
document.addEventListener('change', (ev) => { if (ev.target.matches('[data-mssel]')) S.ui.msSel = ev.target.value; });
