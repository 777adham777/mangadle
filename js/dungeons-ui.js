'use strict';
/* ==========================================================================
   ANIME IDLE RPG — dungeons on screen (dungeons.js is the engine)
   - The Dungeons window on the Battlefield (above the stage list): one card per open dungeon
     (and the next one, locked, as a goal): its rooms, danger, key, records, set.
   - Inside a run the Grand Stage top bar becomes the dungeon's: five room pips, the clock, Leave.
   - A clear: a banner, the chest and the set's sigil in the feed, a weapon shard revealed.
   Loaded after ui.js and arena.js.
   ========================================================================== */

EXTRA_USES.push(...DUNGEONS.map((d) => [dgKey(d.id), `Opens ${d.name} (Battlefield) for one run`]));

// How hard a run is for you now: the share of your HP the five rooms take, with no regeneration.
function dgDanger(id) {
  const z = ZONES[DG_BY[id].zi];
  let f = 0;
  z.enemies.forEach((_, i) => { const e = enemyAt(DG_BY[id].zi, i); f += timeToKill(e) / timeToDie(e); });
  return f < 0.6 ? ['Easy', 'easy'] : f < 1.4 ? ['Fair', 'fair'] : f < 3 ? ['Risky', 'risky'] : ['Deadly', 'deadly'];
}
function dgCardHTML(d) {
  const open = dgOpen(d.id), st = dgState(d.id), key = dgKey(d.id), keys = count(key), z = ZONES[d.zi];
  const head = `<div class="dg-head"><span class="dg-ric">${ic('realm', d.realm)}</span><span class="dg-tt" title="${esc(d.blurb)}"><small>${esc(REALMS[d.realm].name)} · 5 rooms · Rec. Lv ${z.rec}</small><b>${esc(d.name)}</b></span>`;
  if (!open) return `<div class="dg-card locked" style="--rc:${rc(d.realm)}">${head}<span class="dg-lock">${ui('lock')}</span></div>
    <p class="dg-blurb">Defeat <b>${esc(bossName(d.guard))}</b> to open it.</p></div>`;
  const [dl, dc] = dgDanger(d.id), block = dgBlock(d.id), inside = dgIn() && dgRun().id === d.id;
  const recipe = SKILLS.arts.actions.find((a) => a.out && a.out[key]);
  const pieces = dgPieces(d.id).map((p) => tile(p, null, { cls: 'xs', unknown: !S.found[p] })).join('');
  return `<div class="dg-card ${inside ? 'inside' : ''}" style="--rc:${rc(d.realm)}">${head}<span class="danger ${dc}">${dl}</span></div>
    <div class="dg-rows">
      <div class="dg-row"><small>Key</small><span class="dg-key">${tile(key, `<span data-count="${key}">${fmt(keys)}</span>`, { cls: 'xs' + (keys ? '' : ' dim') })}
        ${recipe && !keys ? `<button class="dg-link" data-nav="realm:shinobi:arts" title="Crafting Lv ${recipe.level}: ${Object.entries(recipe.in).map(([k, n]) => `${n} ${ITEMS[k].name}`).join(', ')}">${ui('arts')}Craft · Lv ${recipe.level}</button>` : ''}</span></div>
      <div class="dg-row"><small>Records</small><span class="dg-rec">${st.clears ? `<b>${fmt(st.clears)}</b> clear${st.clears > 1 ? 's' : ''} · best <b>${dgClock(st.best)}</b>${st.clean ? ` · <em title="Cleared without eating">${ui('check')}no food</em>` : ''}` : '<span class="muted">Not cleared yet</span>'}</span></div>
      <div class="dg-row"><small>${esc(d.set.name)} set</small><span class="dg-set">${pieces}<b>${dgOwned(d.id)} / ${dgPieces(d.id).length}</b></span></div>
    </div>
    <div class="dg-cta">${inside ? `<span class="pill on">${ui('battle')}Inside · room ${dgRoom() + 1} / ${DG_ROOMS}</span>`
      : gbtn('Enter', 'play', `data-dgenter="${d.id}" ${block ? `disabled title="${esc(block)}"` : ''}`, 'sm')}${!inside && block && keys ? `<small class="muted">${esc(block)}</small>` : ''}</div></div>`;
}
function dungeonsWinHTML() {
  if (!dgOn()) return '';
  const open = DUNGEONS.filter((d) => dgOpen(d.id)), next = DUNGEONS.find((d) => !dgOpen(d.id) && realmOpen(d.realm));
  // the ones you hold a key for first (newest first), then the others, then the next one to open
  const rank = (d) => (count(dgKey(d.id)) ? 0 : 1);
  const list = open.slice().reverse().sort((a, b) => rank(a) - rank(b)).concat(next ? [next] : []);
  return `<section class="win dgs" id="gs-dungeons">${hdr('Dungeons')}
    <div class="dg-cards">${list.map(dgCardHTML).join('')}</div>
    <label class="dg-auto"><input type="checkbox" data-dgauto ${S.dgAuto ? 'checked' : ''}><span>Run again while I have keys</span></label></section>`;
}

// The Grand Stage top bar inside a run.
function dgTopHTML() {
  const r = dgRun(), d = DG_BY[r.id], st = dgState(r.id);
  const pips = [...Array(DG_ROOMS)].map((_, i) => `<i class="${i < r.room ? 'done' : i === r.room ? 'on' : ''} ${i === DG_ROOMS - 1 ? 'lord' : ''}" data-dgpip="${i}" title="${i === DG_ROOMS - 1 ? 'The lord' : 'Room ' + (i + 1)}"></i>`).join('');
  return `<div class="gs-top dg-top">
    <div class="gs-where"><span class="gs-ric">${ic('realm', d.realm)}</span><span><small>Dungeon · ${esc(REALMS[d.realm].name)}</small><b>${esc(d.name)}</b></span></div>
    <div class="dg-pips" title="Five rooms, no rest between them">${pips}</div>
    <div class="dg-clock"><small>Time</small><b data-dgtime>${dgClock(r.t)}</b>${st.best ? `<em>best ${dgClock(st.best)}</em>` : ''}</div>
    <div class="dg-keys" title="Keys left">${tile(dgKey(d.id), `<span data-count="${dgKey(d.id)}">${fmt(count(dgKey(d.id)))}</span>`, { cls: 'xs' })}</div>
    <div class="gs-acts">${gbtn('Dungeons', 'map', 'data-godungeons', 'dark sm')}${gbtn('Leave', 'stop', 'data-dgleave', 'sm hot')}</div>
  </div>`;
}
{
  const base = gsTopHTML;
  gsTopHTML = function (z) { return typeof dgIn === 'function' && dgIn() ? dgTopHTML() : base(z); };
}
UPD.push(() => {
  const r = dgRun();
  if (!r || !inBattleView()) return;
  setText($('[data-dgtime]'), dgClock(r.t));
  for (const el of $$('[data-dgpip]')) { const i = +el.dataset.dgpip; el.classList.toggle('done', i < r.room); el.classList.toggle('on', i === r.room); }
});

/* ---------------------------------------------------------------- moments */
on('dgclear', (d) => {
  const D = DG_BY[d.id];
  bannerBurst('Dungeon cleared', `${D.name} · ${dgClock(d.t)}${d.newBest ? ' · new best' : ''}`, ic('realm', D.realm), rc(D.realm), 'lvup');
  feedItem(dgChest(d.id), 1);
  if (d.sigil) feedItem(d.sigil, d.first ? 2 : 1);
  if (d.piece) { feedItem(d.piece, 1); if (!(typeof dropReveal === 'function' && dropReveal(d.piece, D.name))) toast(ITEMS[d.piece].name, 'rare'); }
  dirty = true;
});
on('dgend', (d) => {
  const D = DG_BY[d.id];
  if (d.why === 'defeat') toast(`Driven out of ${D.name} in room ${d.room + 1}. Bring more food, or come back stronger.`, 'bad');
  else if (d.why === 'left') toast(`You left ${D.name}. The key is spent.`, 'bad');
  dirty = true;
});
on('dgopen', (id) => { toast(`${DG_BY[id].name} is open: its key is in your Bank (Battlefield → Dungeons).`, 'rare'); dirty = true; });

document.addEventListener('click', (ev) => {
  const t = ev.target.closest('[data-dgenter], [data-dgleave], [data-godungeons]');
  if (!t || t.disabled) return;
  if (t.dataset.dgenter) {
    if (dgEnter(t.dataset.dgenter)) { setView('battle'); const m = $('#main'); if (m) m.scrollTop = 0; }
    else toast(dgBlock(t.dataset.dgenter) || 'You cannot enter right now.', 'bad');
  } else if ('dgleave' in t.dataset) {
    if (confirm('Leave the dungeon? The run ends and its key is spent.')) { stopCombat(); dgEnd('left'); }
  } else if ('godungeons' in t.dataset) {
    const el = $('#gs-dungeons');
    showPaneOf(el);
    if (el) el.scrollIntoView({ behavior: calmMotion() ? 'auto' : 'smooth', block: 'nearest' });
  }
});
document.addEventListener('change', (ev) => {
  if (ev.target.matches('[data-dgauto]')) { S.dgAuto = ev.target.checked; dirty = true; }
});
