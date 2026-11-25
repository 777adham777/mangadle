'use strict';
/* ==========================================================================
   TRI-REALM IDLE — drop history on the Battlefield
   Top half (no DOM): every kill's item drops are recorded in S.combat.drops through the
   engine's 'kill' hook, so offline progress (SIM) is logged too. Common drops (rarity 1-2)
   of the same item merge into one line until a Rare+ drop lands, so rare lines stand out.
   S.combat.dsess holds the session on the current stage: kills, fight time, gold, items,
   kills since the last Epic+ drop. Bottom half: the "Drops" window (history, session,
   what this stage drops), refreshed only when a kill changes it.
   Loaded after ui.js and arena.js.
   ========================================================================== */

const DROPS_CAP = 150;
let dropVer = 0;

function dropsInit() {
  const C = S.combat;
  if (!Array.isArray(C.drops)) C.drops = [];
  const z = C.zone != null ? ZONES[C.zone] : null;
  if (!C.dsess || typeof C.dsess !== 'object' || (z && C.dsess.zone !== z.id)) dropsReset(z);
  return C;
}
function dropsReset(z) {
  S.combat.dsess = { zone: z ? z.id : null, secs: 0, kills: 0, gold: 0, items: {}, dry: 0, epics: 0 };
  dropVer++;
}
const playNow = () => S.stats.playtime || 0;

function dropRecord(id, n, e, z) {
  const C = S.combat, L = C.drops, r = rarity(id), p = playNow();
  const foe = e.base || e.name, rank = e.rank || 0, boss = z.boss ? 1 : 0;
  if (r < 3) {
    // merge with the same common item since the last Rare+ line
    for (let i = 0; i < L.length && i < 24; i++) {
      const d = L[i];
      if (rarity(d.id) >= 3) break;
      if (d.id !== id) continue;
      d.n += n; d.k = (d.k || 1) + 1; d.t = Date.now(); d.p = p;
      if (d.foe !== foe) d.mix = 1;
      if (rank > (d.rank || 0)) d.rank = rank;
      if (i) { L.splice(i, 1); L.unshift(d); }
      return;
    }
  }
  L.unshift({ t: Date.now(), p, p0: p, id, n, foe, rank, boss });
  if (L.length > DROPS_CAP) L.length = DROPS_CAP;
}

hook('kill', (e, z, loot, dropped) => {
  const C = dropsInit(), s = C.dsess;
  s.kills++;
  if (SIM) s.gold += Math.round(((e.gold[0] + e.gold[1]) / 2) * goldMult());   // exact gold comes from the 'kill' event when live
  let epic = false;
  for (const id in loot) {
    if (!ITEMS[id]) continue;
    dropRecord(id, loot[id], e, z);
    s.items[id] = (s.items[id] || 0) + loot[id];
    if (rarity(id) >= 4) epic = true;
  }
  // schematics are learned on the spot: they only show up by name in `dropped`
  for (const [id] of e.drops) {
    const it = ITEMS[id];
    if (it && it.type === 'schematic' && dropped.includes(it.name)) { dropRecord(id, 1, e, z); s.items[id] = (s.items[id] || 0) + 1; epic = true; }
  }
  if (epic) { s.dry = 0; s.epics++; } else s.dry++;
  dropVer++;
});
hook('tick', (dt) => {
  const C = S.combat;
  if (C.zone == null) return;
  dropsInit().dsess.secs += dt;
});
on('kill', (d) => { const C = S.combat; if (C.dsess) { C.dsess.gold += d.gold || 0; } });

/* ============================================================== view */
const fmtAgo = (s) => (s < 5 ? 'now' : s < 60 ? Math.floor(s) + 's' : s < 3600 ? Math.floor(s / 60) + 'm' : s < 86400 ? Math.floor(s / 3600) + 'h' : Math.floor(s / 86400) + 'd');
const dropAgo = (d) => fmtAgo(d.p != null ? Math.max(0, playNow() - d.p) : (Date.now() - d.t) / 1000);
function dropTag(d) {
  if (d.boss) return '<em class="dr-tag boss">Boss</em>';
  if (d.rank === 2) return '<em class="dr-tag alpha">Alpha</em>';
  if (d.rank === 1) return '<em class="dr-tag elite">Elite</em>';
  return '';
}
function dropRow(d) {
  const r = rarity(d.id), it = ITEMS[d.id];
  if (!it) return '';
  const fresh = d.p != null && playNow() - d.p < 4 && r >= 3;
  const who = d.mix ? 'various foes' : esc(d.foe);
  const k = d.k > 1 ? `${fmt(d.k)} drops · ` : '';
  return `<li class="dr-row r${r}${r >= 3 ? ' hi' : ''}${fresh ? ' fresh' : ''}">
    ${tile(d.id, null, { cls: 'xs' })}
    <span class="dr-main"><b>${esc(it.name)}<i>×${fmt(d.n)}</i></b><small>${dropTag(d)}${k}${who}</small></span>
    <span class="dr-ago">${dropAgo(d)}</span></li>`;
}
function dropsListHTML() {
  const C = dropsInit(), rare = S.ui.dropRare;
  const rows = C.drops.filter((d) => ITEMS[d.id] && (!rare || rarity(d.id) >= 3)).slice(0, 40).map(dropRow).join('');
  return rows ? `<ul class="dr-list">${rows}</ul>`
    : `<div class="dr-empty">${ui('rare')}<span>${rare ? 'No Rare+ drop yet.' : 'Nothing dropped yet.'}</span></div>`;
}
function dropsSessHTML() {
  const s = dropsInit().dsess, h = s.secs / 3600;
  const ids = Object.keys(s.items).filter((k) => ITEMS[k]).sort((a, b) => rarity(b) - rarity(a) || s.items[b] - s.items[a]).slice(0, 10);
  const rate = (n) => (s.secs >= 60 ? `${fmt(n / h)}/h` : '');
  const cell = (icn, label, val, cls) => `<div class="ds-cell ${cls || ''}">${ui(icn)}<small>${label}</small><b>${val}</b></div>`;
  return `<div class="ds-stats">
      ${cell('skull', 'Kills', fmt(s.kills))}
      ${cell('time', 'Time', mmss(s.secs))}
      ${cell('gold', 'Gold', fmt(s.gold))}
    </div>
    <div class="ds-dry ${s.dry >= 200 ? 'long' : ''}">${ui('rare')}<span>${s.kills ? `<b>${fmt(s.dry)}</b> kills since the last Epic+ drop${s.epics ? ` · ${fmt(s.epics)} this session` : ''}` : 'No kills yet on this stage.'}${typeof dryMult === 'function' && dryMult() > 1 ? ` · <b class="ds-luck">Luck rising: Epic+ ×${dryMult().toFixed(1)}</b>` : ''}</span></div>
    ${ids.length ? `<div class="ds-items">${ids.map((k) => `<span class="ds-it">${tile(k, '×' + fmt(s.items[k]), { cls: 'xs' })}<em>${rate(s.items[k])}</em></span>`).join('')}</div>` : ''}`;
}
function lootTableHTML() {
  const C = S.combat;
  if (C.zone == null) return '<p class="muted small">Pick a stage to see what it drops.</p>';
  const z = ZONES[C.zone], lm = luckMult();
  const foes = z.enemies.map((e0, i) => {
    const e = typeof enemyAt === 'function' ? enemyAt(C.zone, i) : e0;
    const drops = (e.drops || []).map(([id, ch]) => {
      const schem = ITEMS[id] && ITEMS[id].type === 'schematic';
      const got = isFound(id);
      const p = schem ? ch * lm : ch < 0.2 ? ch * lm : ch;
      return tile(id, fmtRate(p), got ? { cls: 'xs' } : { cls: 'xs', unknown: true, r: rarity(id), title: 'Undiscovered' });
    }).join('');
    return `<li class="lt-foe"><span class="lt-who">${ic('enemy', e.name)}<b>${esc(e.name)}</b>${z.boss ? '<em class="dr-tag boss">Boss</em>' : ''}</span><span class="lt-drops">${drops || '<small class="muted">No items</small>'}</span></li>`;
  }).join('');
  const notes = [z.boss || z.tear ? '' : 'Elite ×3 · Alpha ×5', lm > 1 ? `Luck ×${lm.toFixed(2)} on rare` : ''].filter(Boolean).join(' · ');
  return `<ul class="lt-list">${foes}</ul>${notes ? `<small class="lt-note">${ui('info')}${notes}</small>` : ''}`;
}
function dropsWinHTML() {
  const C = dropsInit();
  if (C.zone == null && !C.drops.length) return '';
  const on = !!S.ui.dropRare;
  return `<section class="win drops-win" id="drops">
    ${hdr('Drops', C.zone != null ? esc(ZONES[C.zone].name) : '')}
    <div class="dw-grid">
      <div class="dw-col">
        <div class="dw-sub"><b>History</b>
          <button class="dw-tog ${on ? 'on' : ''}" data-droprare aria-pressed="${on}">${ui('rare')}<span>Rare+ only</span></button></div>
        <div data-drlist>${dropsListHTML()}</div>
      </div>
      <div class="dw-col">
        <div class="dw-sub"><b>This session</b><button class="dw-tog" data-dropreset title="Start a new session">${ui('close')}<span>Reset</span></button></div>
        <div data-drsess>${dropsSessHTML()}</div>
        <div class="dw-sub"><b>What drops here</b></div>
        <div data-drtable>${lootTableHTML()}</div>
      </div>
    </div></section>`;
}
// Placed under the Tactics / Character / Log row (VIEWS.battle).
UIX.battleBottom = UIX.battleBottom || [];
UIX.battleBottom.push(dropsWinHTML);

// Cheap refresh: only the parts that changed, only when a kill (or the clock) moved them.
let dropSeen = -1, dropTableSig = '', dropClock = 0;
UPD.push(() => {
  const w = document.getElementById('drops');
  if (!w) return;
  const now = performance.now();
  if (dropSeen !== dropVer || now - dropClock > 5000) {
    dropSeen = dropVer; dropClock = now;
    const l = w.querySelector('[data-drlist]'), s = w.querySelector('[data-drsess]');
    if (l) l.innerHTML = dropsListHTML();
    if (s) s.innerHTML = dropsSessHTML();
    const sig = S.combat.zone + ':' + Object.keys(S.found).length + ':' + Object.keys(S.known).length + ':' + luckMult().toFixed(3);
    if (sig !== dropTableSig) { dropTableSig = sig; const t = w.querySelector('[data-drtable]'); if (t) t.innerHTML = lootTableHTML(); }
  } else {
    // the session clock ticks every frame without a rebuild
    const t = w.querySelector('.ds-stats .ds-cell:nth-child(2) b');
    if (t && S.combat.dsess) setText(t, mmss(S.combat.dsess.secs));
  }
});
document.addEventListener('click', (ev) => {
  const t = ev.target.closest('[data-droprare], [data-dropreset]');
  if (!t) return;
  if ('droprare' in t.dataset) { S.ui.dropRare = !S.ui.dropRare; t.classList.toggle('on', S.ui.dropRare); t.setAttribute('aria-pressed', String(S.ui.dropRare)); }
  else dropsReset(S.combat.zone != null ? ZONES[S.combat.zone] : null);
  dropVer++;
});
