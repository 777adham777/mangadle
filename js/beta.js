'use strict';
/* ==========================================================================
   ANIME IDLE RPG — pre-alpha kit. Loaded last (after ux3.js), once the game has booted.
   - the version the player runs (asked to the service worker) and a "new version" bar
   - Settings → Pre-alpha: version, Report a bug (text + save to copy), feedback link
   - a one-time pre-alpha notice; a note when a save could not be loaded (ui.js kept it aside)
   - "open in another tab" cover (ui.js stops saving in the older tab)
   - JS errors (caught in index.html) offer the bug report once per session
   - the beta ends at BETA.worlds: later world gates stay shut (dev mode still opens them)
   ========================================================================== */

const BETA = {
  notice: 1,                 // bump to show the pre-alpha notice again to everyone
  worlds: 3,                 // worlds open in this build (Infinity = all)
  feedback: '',              // Discord invite or form URL: shown in Settings and in the bug report
  build: 183,                // keep equal to the number in sw.js VERSION (bump both on deploy)
  date: '26 Nov',            // day of that build
  version: location.protocol === 'file:' ? 'local' : 'unknown',   // cache name the service worker reports (play data, bug report)
};
const betaVersion = () => `build ${BETA.build} · ${BETA.date}`;

/* ---------------------------------------------------------------- version + update bar */
(function betaVersionAsk() {
  if (!('serviceWorker' in navigator) || location.protocol === 'file:') return;
  const ask = (sw) => {
    if (!sw) return;
    const ch = new MessageChannel();
    ch.port1.onmessage = (e) => { BETA.version = String(e.data || BETA.version); };
    sw.postMessage('version', [ch.port2]);
  };
  navigator.serviceWorker.ready.then((r) => ask(r.active)).catch(() => {});
  let had = !!navigator.serviceWorker.controller;
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    ask(navigator.serviceWorker.controller);
    if (!had) { had = true; return; }        // first install, nothing new to load
    betaBar('update', 'New version ready.', gbtn('Reload', 'check', 'data-betareload', 'sm'));
  });
  // a tab left open for days still learns about new versions
  setInterval(() => navigator.serviceWorker.getRegistration().then((r) => r && r.update()).catch(() => {}), 30 * 60 * 1000);
})();

function betaBar(kind, msg, btns) {
  let el = document.getElementById('beta-bar');
  if (!el) { el = document.createElement('div'); el.id = 'beta-bar'; el.setAttribute('role', 'status'); document.body.appendChild(el); }
  el.className = kind;
  el.innerHTML = `<span>${msg}</span>${btns || ''}<button class="beta-x" data-betabarx aria-label="Close">×</button>`;
}

/* ---------------------------------------------------------------- overlays (above every modal) */
function betaCover(html) {
  let el = document.getElementById('beta-cover');
  if (!el) { el = document.createElement('div'); el.id = 'beta-cover'; el.setAttribute('role', 'dialog'); el.setAttribute('aria-modal', 'true'); document.body.appendChild(el); }
  el.innerHTML = `<div class="beta-card">${html}</div>`;
  el.classList.add('show');
  const f = el.querySelector('button'); if (f) f.focus();
}
const betaUncover = () => { const el = document.getElementById('beta-cover'); if (el) el.classList.remove('show'); };

// about = reopened from Settings (not the first-time welcome)
function betaNotice(about) {
  betaCover(`<small class="beta-tag">Pre-alpha${about ? ' · ' + betaVersion() : ''}</small><h2>${about ? 'This build' : 'Welcome, tester!'}</h2>
    <ul><li>${about ? 'Pre-alpha: things break, numbers change.' : 'Things will break and numbers will change.'}</li>
      <li><b>${BETA.worlds} worlds</b> are open in this build.</li>
      <li>Bugs and ideas: <b>Settings → Report a bug</b>.</li>
      ${about ? '' : '<li>The game notes how you play, nothing personal, and it stays here: <b>Settings → Play data</b>.</li>'}</ul>
    <div class="btn-row">${about ? gbtn('Close', 'close', 'data-betaclose', 'dark') : gbtn('Let\'s go', 'check', 'data-betaok')}</div>`);
}
// Worlds past the build's last one stay out of the menus, lists and counts (dev mode shows everything).
// The Rift sits after every world.
function worldInBuild(r) {
  if (typeof devOn === 'function' && devOn()) return true;
  const wi = r === 'rift' ? WORLD_ORDER.length : WORLD_ORDER.indexOf(r);
  return wi >= 0 && wi < BETA.worlds;
}

function betaLoadFail() {
  betaCover(`<small class="beta-tag bad">Save problem</small><h2>Your save could not be loaded</h2>
    <p>${/older version/.test(LOAD_FAIL) ? 'It comes from a version of the game that this one can no longer read.' : 'It seems damaged.'}
      It was <b>not</b> deleted: a copy is kept aside, and a new game has started.</p>
    <p class="muted small">Please send it with a bug report (Settings → Report a bug) so we can rescue it. Reason: ${esc(LOAD_FAIL)}</p>
    <div class="btn-row">${gbtn('Copy the old save', 'log', 'data-betabroken', 'dark')}${gbtn('Report a bug', 'info', 'data-betareport', 'dark')}${gbtn('Start a new game', 'check', 'data-betaok')}</div>`);
}

function betaTabBlocked() {
  betaCover(`<small class="beta-tag">Paused</small><h2>The game is open in another tab</h2>
    <p>Only one tab can play at a time, or one would erase the other's progress. This tab has stopped saving.</p>
    <div class="btn-row">${gbtn('Play here instead', 'play', 'data-betahere')}</div>`);
}

/* ---------------------------------------------------------------- bug report */
function betaInfo() {
  const sc = `${screen.width}×${screen.height} @${devicePixelRatio}, window ${innerWidth}×${innerHeight}`;
  const errs = (window.BETA_ERRORS || []).slice(-8).map((e) => `- ${new Date(e.t).toISOString().slice(11, 19)} ${e.m} (${e.at})${e.st ? '\n    ' + e.st.split('\n').slice(1, 4).join('\n    ').trim() : ''}`);
  return [
    `Version: ${betaVersion()} (${BETA.version})`,
    `Date: ${new Date().toISOString()}`,
    `Browser: ${navigator.userAgent}`,
    `Screen: ${sc}${typeof isStandalone === 'function' && isStandalone() ? ' (installed app)' : ''}`,
    `Page: ${S.ui.view}${S.action ? ` · doing ${S.action.skill}/${S.action.id}` : ''}`,
    `Level: ${typeof skillLv === 'function' ? skillLv('character') : '?'} · worlds open: ${typeof openRealms === 'function' ? openRealms().join(', ') : '?'}`,
    `Dev mode used: ${S.devUsed ? 'YES since ' + new Date(S.devUsed).toISOString() : 'no'}`,
    `Errors this session: ${errs.length ? '\n' + errs.join('\n') : 'none'}`,
  ].join('\n');
}
function betaReport() {
  const fb = BETA.feedback ? `<p class="small">Paste it here: <a href="${esc(BETA.feedback)}" target="_blank" rel="noopener">${esc(BETA.feedback)}</a></p>` : '';
  betaCover(`<small class="beta-tag">Pre-alpha</small><h2>Report a bug</h2>
    <label class="beta-f"><small>What happened? What did you expect?</small><textarea id="beta-what" rows="4" placeholder="I clicked … and then …"></textarea></label>
    <details class="beta-det"><summary class="small">What is sent with it (nothing leaves your device until you paste it)</summary><pre>${esc(betaInfo())}</pre></details>
    ${fb}
    <div class="btn-row">${gbtn('Copy the report', 'log', 'data-betacopy')}${gbtn('Copy my save too', 'open', 'data-betasave', 'dark')}${gbtn('Close', 'close', 'data-betaclose', 'dark')}</div>
    <p class="muted small">Your save helps us reproduce the bug. It is long: send it as a file or a second message.</p>`);
}
async function betaCopy(text) {
  try { await navigator.clipboard.writeText(text); return true; }
  catch (e) {
    const t = document.createElement('textarea'); t.value = text; document.body.appendChild(t); t.select();
    let ok = false; try { ok = document.execCommand('copy'); } catch (er) { /* ignore */ }
    t.remove(); return ok;
  }
}
const betaSaveText = () => btoa(unescape(encodeURIComponent(serialize())));

let betaErrShown = false;
function betaOnError() {
  if (betaErrShown || typeof toast !== 'function') return;
  betaErrShown = true;
  betaBar('err', 'Something went wrong.', gbtn('Report a bug', 'info', 'data-betareport', 'sm'));
}

/* ---------------------------------------------------------------- Settings → Pre-alpha */
{
  const base = VIEWS.settings;
  VIEWS.settings = (...a) => {
    // in the Save data column: the first column is already full (one screen per page)
    const h = base(...a), sd = h.indexOf('<span>Save data</span>'), i = sd < 0 ? h.indexOf('<section') : h.lastIndexOf('<section', sd);
    const sec = `<section class="win beta-set">${hdr('Pre-alpha', betaVersion())}
      <div class="btn-row">${gbtn('Report a bug', 'info', 'data-betareport')}${BETA.feedback ? `<a class="gbtn dark" href="${esc(BETA.feedback)}" target="_blank" rel="noopener"><span>Feedback</span></a>` : ''}${gbtn('About this build', 'hero', 'data-betanote', 'dark')}</div></section>`;
    return i < 0 ? h + sec : h.slice(0, i) + sec + h.slice(i);
  };
}

/* ---------------------------------------------------------------- the beta's last world */
{
  const baseOpen = openGate;
  openGate = function (r) {
    const wi = WORLD_ORDER.indexOf(r);
    if ((wi < 0 || wi >= BETA.worlds) && !(typeof devOn === 'function' && devOn())) {
      toast(`${REALMS[r] ? REALMS[r].name : 'This world'} is not in this build yet.`, 'rare');
      return false;
    }
    return baseOpen(r);
  };
}

/* ---------------------------------------------------------------- clicks */
document.addEventListener('click', async (ev) => {
  const t = ev.target.closest('[data-betaok],[data-betareport],[data-betacopy],[data-betasave],[data-betaclose],[data-betahere],[data-betabroken],[data-betareload],[data-betabarx],[data-betanote]');
  if (!t) return;
  const d = t.dataset;
  if ('betaok' in d) { S.ui.betaSeen = BETA.notice; betaUncover(); dirty = true; saveGame(); if (LOAD_FAIL) { LOAD_FAIL = null; } }
  else if ('betareport' in d) { const b = document.getElementById('beta-bar'); if (b && b.className === 'err') b.remove(); betaReport(); }
  else if ('betanote' in d) betaNotice(true);
  else if ('betaclose' in d) betaUncover();
  else if ('betacopy' in d) {
    const what = (document.getElementById('beta-what') || {}).value || '';
    toast(await betaCopy(`**Bug report**\n${what.trim() || '(no description)'}\n\n${betaInfo()}`) ? 'Report copied: paste it to us.' : 'Could not copy: select the text by hand.', 'good');
  }
  else if ('betasave' in d) toast(await betaCopy(betaSaveText()) ? 'Save copied.' : 'Could not copy the save.', 'good');
  else if ('betabroken' in d) {
    let raw = ''; try { raw = JSON.parse(lsGet(SAVE_KEY_BROKEN) || '{}').save || ''; } catch (e) { /* ignore */ }
    toast(raw && await betaCopy(btoa(unescape(encodeURIComponent(raw)))) ? 'Old save copied.' : 'Could not copy the old save.', raw ? 'good' : 'bad');
  }
  else if ('betahere' in d) { claimTab(); location.reload(); }
  else if ('betareload' in d) location.reload();
  else if ('betabarx' in d) { const b = document.getElementById('beta-bar'); if (b) b.remove(); }
});
document.addEventListener('keydown', (ev) => {
  const c = document.getElementById('beta-cover');
  if (ev.key === 'Escape' && c && c.classList.contains('show') && !c.querySelector('[data-betahere]') && !c.querySelector('[data-betabroken]')) betaUncover();
});

/* ---------------------------------------------------------------- on load */
if (typeof S !== 'undefined' && S) {
  if (LOAD_FAIL) betaLoadFail();
  else if ((S.ui.betaSeen || 0) < BETA.notice) betaNotice();
  if (window.BETA_ERRORS && BETA_ERRORS.length) betaOnError();
}
