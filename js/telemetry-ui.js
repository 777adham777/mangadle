'use strict';
/* ==========================================================================
   ANIME IDLE RPG — play data, the player's side (loaded after beta.js).
   Settings → Pre-alpha → Play data: what is kept, Copy / Download it. Bug reports carry a one-line summary.
   TEL_ENDPOINT: an URL that accepts a JSON POST (empty = nothing is ever sent; the player hands the file over).
   ========================================================================== */

const TEL_ENDPOINT = '';
const TEL_SEND_EVERY = 6 * 3600 * 1000;

const telFile = () => JSON.stringify(telExport());
function telCover() {
  const L = T(), t = L.time, h = (s) => (s / 3600).toFixed(1) + ' h';
  const kb = Math.round(telFile().length / 1024);
  const send = TEL_ENDPOINT ? `<label class="tog"><input type="checkbox" data-telsend ${S.ui.telOff ? '' : 'checked'}><span>Send it to us automatically (every few hours)</span></label>` : '';
  betaCover(`<small class="beta-tag">Pre-alpha</small><h2>Your play data</h2>
    <p class="small"><b>Time per skill and stage, pages, levels, deaths, food. No name, nothing you type. Stays on this device until you send it.</b></p>
    <ul class="small"><li>${h(t.live)} played with the game open, ${h(t.off)} simulated while away</li>
      <li>${L.ses.length + (L.cur ? 1 : 0)} session${L.ses.length + (L.cur ? 1 : 0) === 1 ? "" : "s"} · ${L.tl.length} timeline entries · ${L.snap.length} snapshot${L.snap.length === 1 ? '' : 's'}</li>
      <li>File size: ${kb} KB</li></ul>
    ${send}
    <div class="btn-row">${gbtn('Download the file', 'open', 'data-teldl')}${gbtn('Copy it', 'log', 'data-telcopy', 'dark')}${gbtn('Close', 'close', 'data-betaclose', 'dark')}</div>`);
}

// Settings → Pre-alpha: one more button.
{
  const base = VIEWS.settings;
  VIEWS.settings = (...a) => {
    const h = base(...a), i = h.indexOf('data-betanote');
    if (i < 0) return h;
    const end = h.indexOf('</button>', i) + '</button>'.length;
    return h.slice(0, end) + gbtn('Play data', 'log', 'data-teldata', 'dark') + h.slice(end);
  };
}
// Bug reports: a one-line summary of the play data.
{
  const baseInfo = betaInfo;
  betaInfo = () => { let s = ''; try { s = '\n' + telSummary(); } catch (e) { /* ignore */ } return baseInfo() + s; };
}

document.addEventListener('click', async (ev) => {
  const t = ev.target.closest('[data-teldata],[data-teldl],[data-telcopy],[data-telsend]');
  if (!t) return;
  const d = t.dataset;
  if ('teldata' in d) telCover();
  else if ('telcopy' in d) toast(await betaCopy(telFile()) ? 'Play data copied.' : 'Could not copy it.', 'good');
  else if ('teldl' in d) {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([telFile()], { type: 'application/json' }));
    a.download = `anime-idle-rpg-playdata-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 5000);
  }
  else if ('telsend' in d) { S.ui.telOff = !t.checked; dirty = true; }
});

// Optional automatic sending (TEL_ENDPOINT): at most every TEL_SEND_EVERY, never for a dev-mode save.
function telMaybeSend() {
  if (!TEL_ENDPOINT || !S || S.ui.telOff || S.devUsed || location.protocol === 'file:') return;
  const L = T();
  if (Date.now() - (L.sent || 0) < TEL_SEND_EVERY) return;
  L.sent = Date.now();
  try { fetch(TEL_ENDPOINT, { method: 'POST', body: telFile(), headers: { 'Content-Type': 'text/plain' }, keepalive: false, mode: 'no-cors' }).catch(() => {}); } catch (e) { /* ignore */ }
}
if (TEL_ENDPOINT) { setTimeout(telMaybeSend, 60 * 1000); setInterval(telMaybeSend, 30 * 60 * 1000); }
