'use strict';
/* ==========================================================================
   ANIME IDLE RPG — the Hunt List on screen (huntlist.js is the engine)
   - "Hunt it" on an item in the Collection or the Bank pins it (licence: 3 hunts).
   - The list (Overview + Collection): each hunt with its best seen source and the
     expected time, the Epic+ bad-luck meter, every source (Go / post as a mission).
   - Collection tiers per world, above the Collection Log.
   Loaded after ui.js and missions-ui.js.
   ========================================================================== */

Object.assign(ICONS.ui, { hunt: 'all-seeing-eye' });

function huntPinBtn(id) {
  if (!huntOn() || !ITEMS[id] || ITEMS[id].type === 'schematic') return '';
  if (isHunted(id)) return gbtn('Stop hunting', 'close', `data-hunpin="${id}"`, 'dark sm');
  const full = hlState().list.length >= HUNT_MAX;
  return gbtn(full ? `Hunt List full (${HUNT_MAX})` : 'Hunt it', 'hunt', `data-hpin="${id}" ${full ? 'disabled' : ''}`, 'sm hl-pin');
}
UIX.colDetail.push((id) => (id && !id.startsWith('pet:') ? `<div class="hl-pinrow">${huntPinBtn(id)}</div>` : ''));
UIX.inspectorAny.push((id) => (huntOn() ? `<div class="hl-pinrow">${huntPinBtn(id)}</div>` : ''));

const perLabel = { kill: 'per kill', haul: 'per haul', action: 'per task', chest: 'per chest' };
function huntSrcRow(s) {
  if (!s.seen) return `<li class="hl-s unk"><span>${ui('lock')}<b>???</b><small>Undiscovered source</small></span></li>`;
  const go = s.go && s.open ? (s.go.k === 'view' ? gbtn('Go', 'play', `data-nav="${s.go.view}"`, 'dark sm') : gbtn('Go', 'play', `data-hgo='${esc(JSON.stringify(s.go))}'`, 'dark sm')) : '';
  const post = s.go && s.open && s.go.k !== 'view' && typeof msOn === 'function' && msOn() ? `<button class="mini-btn" data-hpost='${esc(JSON.stringify(s.go))}' title="Add to the Task Queue (until it stops)">${ui('missions')}</button>` : '';
  const eta = s.perHour > 0 ? `~${fmtTime(3600 / s.perHour)}` : s.open ? '' : 'locked';
  return `<li class="hl-s ${s.danger === 'deadly' || s.danger === 'risky' ? 'risky' : ''}"><span>${ic(s.icon[0], s.icon[1])}<b>${esc(s.label)}</b><small>${fmtRate(s.chance)} ${perLabel[s.per] || ''}${s.have ? ` · you have ${fmt(s.have)}` : ''}${s.danger === 'deadly' ? ' · deadly for you' : ''}</small></span>
    <em>${eta}</em><span class="hl-go">${go}${post}</span></li>`;
}
function huntCard(h) {
  const id = h.id, it = ITEMS[id], r = rarity(id), src = huntSources(id), eta = huntEta(id);
  const combat = src.some((s) => s.seen && s.per === 'kill');
  const dry = S.stats.dry || 0, luck = typeof dryMult === 'function' ? dryMult() : 1;
  const pity = r >= 4 && combat ? `<div class="hl-pity" title="After ${DRY_FREE} kills without an Epic or better, their chances climb.">${ui('rare')}<span class="pbar gold"><i style="width:${Math.min(100, (dry % DRY_FREE) / DRY_FREE * 100)}%"></i></span><small>${luck > 1 ? `Luck rising ×${luck.toFixed(1)}` : `${fmt(dry)} / ${DRY_FREE} kills`}</small></div>` : '';
  const shown = src.filter((s) => s.seen).slice(0, 4), hidden = src.filter((s) => !s.seen).length;
  return `<article class="hl-card r${r}">
    <div class="hl-top">${tile(id, null, {})}
      <div class="hl-name"><small><span class="rar r${r}">${RARITY_NAME[r] || ''}</span> · ${esc(typeLabel(id))}</small><b>${esc(it.name)}</b>
        <span class="hl-eta">${eta ? `${ui('time')}<b>~${fmtTime(eta.secs)}</b> <i>at your pace · ${esc(eta.src.label)}</i>` : `${ui('info')}<i>${src.length ? 'No source you have seen yet' : 'No known source'}</i>`}</span></div>
      <button class="mini-btn" data-hunpin="${id}" title="Stop hunting">${ui('close')}</button></div>
    ${pity}
    <ul class="hl-srcs">${shown.map(huntSrcRow).join('')}${hidden ? huntSrcRow({ seen: false }) : ''}</ul>
  </article>`;
}
function huntListHTML(where) {
  if (!huntOn()) return '';
  const H = hlState();
  if (!H.list.length && where === 'home') return '';
  return `<section class="win hl-win">${hdr('Hunt List', `Licence · ${H.list.length} / ${HUNT_MAX}${H.done ? ` · ${H.done} hunted` : ''}`)}
    ${H.list.length ? `<div class="hl-grid">${H.list.map(huntCard).join('')}</div>` : `<p class="muted small hl-empty">${ui('hunt')}<span>Pick an item in the Collection or the Bank and press <b>Hunt it</b>: the list shows where it drops, your odds and how long it should take.</span></p>`}</section>`;
}
UIX.homeTop.push(() => huntListHTML('home'));

function colTiersHTML() {
  if (!featureOpen('collection')) return '';
  const T = colTiers(), rs = WORLD_ORDER.filter((r) => T[r] && realmOpen(r));
  if (!rs.length) return '';
  return `<section class="win col-tiers">${hdr('World collections', `+${fmt(colLuck())} Luck · +0.5 at 25 / 50 / 75 / 100% of a world`)}
    <div class="ct-grid">${rs.map((r) => { const t = T[r]; return `<div class="ct-w" style="--rc:${rc(r)}">${ic('realm', r)}<span><b>${REALMS[r].name}</b><small>${t.got} / ${t.all} · ${Math.floor(t.p * 100)}%</small></span><span class="pips">${[1, 2, 3, 4].map((i) => `<i class="${t.tier >= i ? 'on' : ''}"></i>`).join('')}</span></div>`; }).join('')}</div></section>`;
}
UIX.collectionTop.unshift(() => huntListHTML('col') + colTiersHTML());

on('hunted', (d) => {
  burst('Hunt complete', `${ITEMS[d.id].name} · ${fmtTime(d.real)}`, itemIc(d.id), 'var(--gold)');
  toast(`Hunt complete: ${ITEMS[d.id].name}, after ${fmtTime(d.real)}.`, 'rare');
  dirty = true;
});

document.addEventListener('click', (ev) => {
  const t = ev.target.closest('[data-hpin],[data-hunpin],[data-hgo],[data-hpost]');
  if (!t || t.disabled) return;
  const d = t.dataset;
  if (d.hpin) { if (pinHunt(d.hpin)) toast(`${ITEMS[d.hpin].name} added to your Hunt List.`, 'good'); }
  else if (d.hunpin) unpinHunt(d.hunpin);
  else if (d.hgo) {
    const g = JSON.parse(d.hgo);
    if (g.k === 'zone') { const zi = ZONES.findIndex((z) => z.id === g.zone); startCombat(zi); setView('battle'); }
    else { startAction(g.skill, g.id); setView(skillView(g.skill)); }
  }
  else if (d.hpost) { const g = JSON.parse(d.hpost); if (postMission(Object.assign({ n: 0 }, g))) toast('Added to the Task Queue.', 'good'); }
  dirty = true;
});
