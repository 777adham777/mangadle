'use strict';
/* ==========================================================================
   ANIME IDLE RPG — Opportunities on screen (omens.js is the engine)
   Spawns one now and then (8-15 min apart) while you are actually playing: the page is
   visible, you clicked or pressed a key in the last 2 minutes, something runs.
   It floats over the view for 30 s with a countdown ring. Loaded after ui.js.
   ========================================================================== */

const OMEN_ART = {
  bottle: '<svg viewBox="0 0 64 64" aria-hidden="true"><path d="M27 6h10v8l3 5v6c5 3 8 8 8 14v15c0 3-2 5-5 5H21c-3 0-5-2-5-5V39c0-6 3-11 8-14v-6l3-5z" fill="#bfe6f2" stroke="#123" stroke-width="2.5"/><rect x="26" y="3" width="12" height="6" fill="#a0703a" stroke="#123" stroke-width="2"/><path d="M22 38h20v12H22z" fill="#f4e3b8" stroke="#123" stroke-width="2"/><path d="M26 42h12M26 46h8" stroke="#8a6a3a" stroke-width="2"/></svg>',
  card: '<svg viewBox="0 0 64 64" aria-hidden="true"><g transform="rotate(-12 32 32)"><rect x="16" y="8" width="32" height="46" rx="3" fill="#f4ecd8" stroke="#2a1d10" stroke-width="2.5"/><rect x="20" y="12" width="24" height="22" fill="#7a3a2a"/><circle cx="32" cy="23" r="7" fill="#f4c66a"/><path d="M21 40h22M21 45h16" stroke="#7a5a3a" stroke-width="2"/></g></svg>',
};
const omenArt = (icon) => OMEN_ART[icon] || (GI[icon] ? `<svg class="gi" aria-hidden="true"><use href="#gi-${icon}"/></svg>` : ui('rare'));

let OMEN = null, omenNext = 0, lastInput = Date.now();
const omenGap = () => (8 + Math.random() * 7) * 60e3;
for (const ev of ['pointerdown', 'keydown']) document.addEventListener(ev, () => { lastInput = Date.now(); }, { passive: true, capture: true });

function omenSpawn() {
  const r = omenRealm(), O = OMENS[r];
  if (!O) return;
  const el = document.createElement('button');
  el.className = 'omen';
  el.style.setProperty('--rc', rc(r));
  el.style.left = (38 + Math.random() * 34) + '%';
  el.style.top = (28 + Math.random() * 30) + '%';
  el.setAttribute('aria-label', `${O.name}: take it`);
  el.innerHTML = `<span class="om-bub">${omenArt(O.icon)}</span><span class="om-lab"><b>${esc(O.name)}</b><small data-omt>${OMEN_LIFE}s</small></span>`;
  el.addEventListener('click', () => omenTake());
  document.body.appendChild(el);
  OMEN = { r, el, until: Date.now() + OMEN_LIFE * 1000 };
}
function omenClear(taken) {
  if (!OMEN) return;
  const el = OMEN.el;
  el.classList.add(taken ? 'taken' : 'gone');
  setTimeout(() => el.remove(), 450);
  OMEN = null;
  omenNext = Date.now() + omenGap();
}
function omenTake() {
  if (!OMEN) return;
  const r = OMEN.r, O = OMENS[r], res = omenGrant(r);
  for (const k in res.items) feedItem(k, res.items[k]);
  if (res.gold) feedGold(res.gold, O.name);
  toast(`${O.name}: ${res.text}`, 'rare');
  omenClear(true);
}
UPD.push(() => {
  const now = Date.now();
  if (OMEN) {
    const left = (OMEN.until - now) / 1000;
    if (left <= 0) { omenClear(false); return; }
    OMEN.el.style.setProperty('--left', left / OMEN_LIFE);
    const t = OMEN.el.querySelector('[data-omt]');
    if (t) setText(t, Math.ceil(left) + 's');
    return;
  }
  if (!omensOn() || document.hidden || $('#modal').classList.contains('show')) return;
  if (!omenNext) { omenNext = now + omenGap(); return; }
  if (now < omenNext) return;
  if (now - lastInput > 120e3 || (!S.action && S.combat.zone == null)) { omenNext = now + 60e3; return; }
  omenSpawn();
});
// A buff from an opportunity shows in the activity bar while it lasts.
UIX.nowbar.push(() => (S.omen && S.omen.buff && S.omen.buff.t > 0 && OMENS[S.omen.buff.k] ? `<span class="om-buff" title="${esc(OMENS[S.omen.buff.k].name)}">${omenArt(OMENS[S.omen.buff.k].icon)}</span>` : ''));
let omenBuffWas = false;
UPD.push(() => { const on = !!(S.omen && S.omen.buff && S.omen.buff.t > 0); if (on !== omenBuffWas) { omenBuffWas = on; sideDirty = true; } });
