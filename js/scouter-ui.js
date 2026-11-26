'use strict';
/* ==========================================================================
   ANIME IDLE RPG — the Scouter window on the Battlefield (scouter.js is the engine)
   Pick a stage you have fought, Scan: 24 fights for your current build, then 12 for
   each fix the Scouter finds in your bag. Runs in small slices so the game never freezes.
   Loaded after ui.js and drops-ui.js.
   ========================================================================== */

Object.assign(ICONS.ui, { scouter: 'radar-sweep' });

let SC = { zi: null, running: false, prog: 0, total: 0, base: null, fixes: [], fres: {}, at: 0 };
const SC_BASE = 24, SC_FIX = 12, SC_CHUNK = 4;

function scoutZoneDefault() {
  const st = S.scout || {};
  if (SC.zi != null && scoutSeen(SC.zi)) return SC.zi;
  const lost = st.last ? ZONES.findIndex((z) => z.id === st.last) : -1;
  if (lost >= 0 && scoutSeen(lost)) return lost;
  if (S.combat.zone != null && scoutSeen(S.combat.zone)) return S.combat.zone;
  const seen = ZONES.map((_, i) => i).filter((i) => !ZONES[i].dungeon && scoutSeen(i));
  return seen.length ? seen[seen.length - 1] : null;
}
function scanStart(zi) {
  if (zi == null || !scoutSeen(zi) || SC.running) return;
  const fixes = scoutFixes(zi);
  const jobs = [];
  for (let i = 0; i < SC_BASE; i += SC_CHUNK) jobs.push([null, SC_CHUNK]);
  for (const f of fixes) for (let i = 0; i < SC_FIX; i += SC_CHUNK) jobs.push([f, SC_CHUNK]);
  SC = { zi, running: true, prog: 0, total: jobs.length, base: null, fixes, fres: {}, at: Date.now() };
  scoutState().n = (scoutState().n || 0) + 1;
  const run = () => {
    if (!SC.running || SC.zi !== zi) return;
    const [f, n] = jobs.shift();
    const r = scoutTrials(zi, n, f);
    if (f) SC.fres[f.key] = scoutMerge(SC.fres[f.key], r); else SC.base = scoutMerge(SC.base, r);
    SC.prog++;
    if (!jobs.length) SC.running = false;
    refreshScout();
    if (jobs.length) setTimeout(run, 16);
  };
  refreshScout();
  setTimeout(run, 30);
}
const scColor = (p) => (p >= 0.7 ? 'var(--act)' : p >= 0.35 ? 'var(--sel)' : 'var(--hot)');
function scoutResultHTML() {
  if (SC.zi == null || (!SC.base && !SC.running)) return `<p class="muted small sc-hint">${ui('info')}<span>Pick a stage, then Scan.</span></p>`;
  const z = ZONES[SC.zi], b = SC.base, p = scoutPct(b), cause = b && b.wins < b.n ? scoutCause(b) : null;
  const done = !SC.running;
  const fixes = done ? SC.fixes.map((f) => ({ f, p: scoutPct(SC.fres[f.key]) })).filter((x) => x.p >= p + 0.08 || (p < 1 && x.p === 1 && p < 0.95)).sort((x, y) => y.p - x.p).slice(0, 2) : [];
  const avg = b && b.secs.length ? b.secs.reduce((x, y) => x + y, 0) / b.secs.length : 0;
  const [dl, dc] = zoneDanger(SC.zi);
  const fixRow = ({ f, p: q }) => `<li><span class="sc-fix">${f.kind === 'tech' ? ic('technique', f.id) : itemIc(f.id)}<span><b>${esc(f.label)}</b><small>${esc(f.sub)}</small></span></span><em style="color:${scColor(q)}">→ ${Math.round(q * 100)}%</em>${gbtn('Apply', 'check', `data-scapply="${esc(f.key)}"`, 'sm')}</li>`;
  return `<div class="sc-res">
    <div class="sc-ring" style="--p:${b ? p : 0};--c:${scColor(p)}"><div><b>${b ? Math.round(p * 100) + '%' : '…'}</b><small>win</small></div></div>
    <div class="sc-main"><small><span class="danger ${dc}">${dl}</span>${z.boss ? ' · Boss' : ''} · Rec. Lv ${z.rec}</small><b class="sc-zone">${esc(z.name)}</b>
      <span class="sc-pl">${ui('scouter')}Power level <b>${fmt(powerLevel())}</b> vs <b class="hot">${fmt(foePowerLevel(SC.zi))}</b></span>
      ${SC.running ? `<span class="sc-run"><span class="pbar"><i style="width:${(SC.prog / SC.total) * 100}%"></i></span><small>Reading power levels… ${b ? b.n : 0} fights</small></span>`
        : b.wins === b.n ? `<p>You win every fight${avg ? ` (about ${fmtTime(avg)} each)` : ''}${z.boss ? '' : ' over 8 kills in a row'}.${b.slow ? ' Some drag on: more damage would speed them up.' : ''}</p>`
        : `<p>What brings you down: <b>${esc(cause.what)}</b>${cause.left != null ? `, with the guardian at ${Math.round(cause.left * 100)}% HP` : ''}.</p>`}</div>
    ${done && b.wins < b.n ? `<ul class="sc-fixes">${fixes.length ? fixes.map(fixRow).join('') : `<li class="none">${ui('info')}<span>Nothing in your bag changes the outcome much. Level up, cook stronger food, or refine your weapon.</span></li>`}</ul>` : ''}
    ${done ? `<small class="sc-foot">${b.n} simulated fights${SC.fixes.length ? ` · ${SC.fixes.length} fix${SC.fixes.length > 1 ? 'es' : ''} tested` : ''} · nothing of yours changes until you press Apply</small>` : ''}
  </div>`;
}
function scoutWinHTML() {
  if (!scoutOn()) return '';
  const seen = ZONES.map((z, i) => [z, i]).filter(([z, i]) => !z.dungeon && scoutSeen(i));
  const zi = scoutZoneDefault();
  if (SC.zi == null && zi != null && !SC.running) SC.zi = zi;
  return `<section class="win scout-win" id="scouter">${hdr('Power Visor')}
    <div class="sc-top"><span class="sc-dev">${ui('scouter')}</span>
      <select id="sc-zone" data-sczone aria-label="Stage to scan">${seen.length ? seen.map(([z, i]) => `<option value="${i}" ${i === SC.zi ? 'selected' : ''}>${z.boss ? 'Boss · ' : ''}${esc(z.name)}${S.scout.last === z.id ? ' (last defeat)' : ''}</option>`).join('') : '<option value="">No stage fought yet</option>'}</select>
      ${gbtn(SC.running ? 'Scanning' : 'Scan', 'scouter', `data-scscan ${SC.running || !seen.length ? 'disabled' : ''}`, 'sm')}</div>
    <div data-scres>${scoutResultHTML()}</div></section>`;
}
function refreshScout() { const el = $('#scouter [data-scres]'); if (el) el.innerHTML = scoutResultHTML(); const btn = $('#scouter [data-scscan]'); if (btn) { btn.disabled = SC.running; $('span', btn).textContent = SC.running ? 'Scanning' : 'Scan'; } }
UIX.battleBottom = UIX.battleBottom || [];
UIX.battleBottom.unshift(scoutWinHTML);

on('death', (e) => {
  if (!scoutOn() || e.rank) return;
  const z = S.scout && S.scout.last && ZONES.find((x) => x.id === S.scout.last);
  if (z) { SC.zi = ZONES.indexOf(z); SC.base = null; toast(`Power Visor: scan ${z.name} on the Battlefield to see why you lost.`, 'rare'); dirty = true; }
});
document.addEventListener('click', (ev) => {
  const t = ev.target.closest('[data-scscan],[data-scapply]');
  if (!t || t.disabled) return;
  if ('scscan' in t.dataset) { const s = $('#sc-zone'); scanStart(s && s.value !== '' ? +s.value : SC.zi); return; }
  const f = SC.fixes.find((x) => x.key === t.dataset.scapply);
  if (!f) return;
  f.apply();
  toast(`${f.label}: done. Scanning again…`, 'good');
  dirty = true;
  const zi = SC.zi;
  setTimeout(() => scanStart(zi), 60);
});
document.addEventListener('change', (ev) => { if (ev.target.matches('[data-sczone]')) { SC.zi = ev.target.value === '' ? null : +ev.target.value; SC.base = null; refreshScout(); } });
