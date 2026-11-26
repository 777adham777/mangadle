'use strict';
/* ==========================================================================
   Season 3 UX ("Moins d'écran, plus de jeu"), the player's side:
   08 · Settings → Display: motion, reveals, notifications, text size, number format (S.ui.set)
   06 · Keyboard shortcuts for settled players (? lists them)
   Loaded last: wraps VIEWS.settings and dropReveal, reads S.ui.set everywhere else (fmt, Le Fil).
   ========================================================================== */

const UXSET = {
  motion: { label: 'Animations', help: '', opts: [['auto', 'Auto'], ['reduced', 'Reduced']], def: 'auto' },
  reveal: { label: 'Full-screen reveals', help: '', opts: [['4', '4★ and 5★'], ['5', '5★ only'], ['off', 'Off']], def: '5' },
  notif: { label: 'Notifications', help: '', opts: [['all', 'All'], ['new', 'New + rare'], ['rare', 'Rare only']], def: 'all' },
  text: { label: 'Text size', help: '', opts: [['100', '100%'], ['115', '115%'], ['130', '130%']], def: '100' },
  num: { label: 'Numbers', help: '', opts: [['short', '184.2K'], ['full', '184,200']], def: 'short' },
};
function uxSet(k) {
  if (!S.ui.set || typeof S.ui.set !== 'object') S.ui.set = {};
  const v = S.ui.set[k];
  return v != null && UXSET[k].opts.some((o) => o[0] === String(v)) ? String(v) : UXSET[k].def;
}

/* ---------------------------------------------------------------- applying them */
// Reduced motion: one class on <html> (css/ux.css stills every animation) and the same answer to every
// prefers-reduced-motion check the scripts make (chests, combat), so nothing needs its own switch.
const uxMM = window.matchMedia.bind(window);
window.matchMedia = function (q) {
  if (/prefers-reduced-motion:\s*reduce/.test(q) && typeof S !== 'undefined' && S.ui && S.ui.set && S.ui.set.motion === 'reduced') {
    const m = uxMM(q);
    return { matches: true, media: q, onchange: null, addListener() {}, removeListener() {}, addEventListener() {}, removeEventListener() {}, dispatchEvent() { return false; }, _real: m };
  }
  return uxMM(q);
};
function uxApply() {
  const root = document.documentElement;
  root.classList.toggle('calm', uxSet('motion') === 'reduced');
  const z = +uxSet('text') / 100;
  for (const id of ['hud', 'rail', 'main', 'tabbar', 'feed']) { const el = document.getElementById(id); if (el) el.style.zoom = z === 1 ? '' : z; }
}

// Reveals: 4★ only open when asked; "Off" leaves the banner for 5★ (ui.js) and the feed row.
if (typeof dropReveal === 'function') {
  const uxReveal = dropReveal;
  dropReveal = function (id, source) {
    const lv = uxSet('reveal'), r = ITEMS[id] ? rarity(id) : 0;
    if (lv === 'off' || (lv === '5' && r < 5)) return false;
    return uxReveal(id, source);
  };
}

/* ---------------------------------------------------------------- Settings → Display */
function uxSettingsHTML() {
  const row = (k) => {
    const D = UXSET[k], v = uxSet(k);
    return `<div class="uxs-row"><span class="uxs-t"><b>${D.label}</b>${D.help ? `<small>${D.help}</small>` : ''}</span>
      <span class="uxs-seg" role="group" aria-label="${D.label}">${D.opts.map(([val, l]) => `<button class="${v === val ? 'on' : ''}" data-uxset="${k}:${val}" aria-pressed="${v === val}">${l}</button>`).join('')}</span></div>`;
  };
  return `<section class="win uxs">${hdr('Display')}${Object.keys(UXSET).map(row).join('')}
    <div class="uxs-row"><span class="uxs-t"><b>Keyboard shortcuts</b></span><span class="uxs-seg"><button data-uxkeys>Show</button></span></div></section>`;
}
{
  const base = VIEWS.settings;
  VIEWS.settings = (...a) => {
    const h = base(...a), i = h.indexOf('<section');
    return i < 0 ? h + uxSettingsHTML() : h.slice(0, i) + uxSettingsHTML() + h.slice(i);
  };
}

/* ---------------------------------------------------------------- 06 · keyboard shortcuts */
const UXKEYS = [
  ['1 … 9', 'Skills of the world you are in'], ['O', 'Overview'], ['C', 'Character'], ['B', 'Bank'], ['F', 'Battlefield'],
  ['J', 'Journal'], ['M', 'Menu (phones)'], ['Space', 'Stop, or resume the last activity'], ['?', 'This list'], ['Esc', 'Close a window'],
];
function uxKeysHTML() {
  return `<div class="uxkeys"><h2>Keyboard shortcuts</h2><div class="uxk-list">${UXKEYS.map(([k, t]) => `<div><kbd>${k}</kbd><span>${t}</span></div>`).join('')}</div></div>`;
}
function uxWorldNow() {
  const [n, r] = S.ui.view.split(':');
  if (n === 'realm') return r;
  if (S.action) return SKILLS[S.action.skill].realm;
  return openRealms()[openRealms().length - 1];
}
document.addEventListener('keydown', (ev) => {
  if (ev.ctrlKey || ev.metaKey || ev.altKey || ev.repeat) return;
  const t = ev.target;
  if (t && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName))) return;
  if ($('#modal').classList.contains('show') || document.querySelector('.rv-wrap, .cx-wrap, .sc-wrap')) {
    if (ev.key === '?' ) { ev.preventDefault(); openModal(uxKeysHTML(), 'Close'); }
    return;
  }
  const k = ev.key, go = (v) => { ev.preventDefault(); setView(v); };
  if (/^[1-9]$/.test(k)) {
    const r = uxWorldNow(), ks = r ? openSkillsOf(r) : [], s = ks[+k - 1];
    if (s) go(`realm:${r}:${s}`);
  }
  else if (k === 'o' || k === 'O') go('home');
  else if (k === 'c' || k === 'C') { if (VIEWS.character) go('character'); }
  else if (k === 'b' || k === 'B') go('hero');
  else if (k === 'f' || k === 'F') { if (featureOpen('battle')) go('battle'); }
  else if (k === 'j' || k === 'J') { ev.preventDefault(); openModal(journalHTML(), 'Close'); }
  else if (k === 'm' || k === 'M') { ev.preventDefault(); document.body.classList.toggle('menu-open'); }
  else if (k === '?') { ev.preventDefault(); openModal(uxKeysHTML(), 'Close'); }
  else if (k === ' ' && (t === document.body || !t || t === document.documentElement)) {
    ev.preventDefault();
    if (S.action) stopAction();
    else if (S.combat.zone != null) stopCombat();
    else { const re = resumeInfo(); if (re) { const b = document.createElement('button'); b.setAttribute(re.attr.split('=')[0], re.attr.split('=')[1].replace(/"/g, '')); b.hidden = true; document.body.appendChild(b); b.click(); b.remove(); } }
  }
});

document.addEventListener('click', (ev) => {
  const t = ev.target.closest('[data-uxset], [data-uxkeys]');
  if (!t) return;
  if (t.dataset.uxkeys !== undefined) { openModal(uxKeysHTML(), 'Close'); return; }
  const [k, v] = t.dataset.uxset.split(':');
  if (!S.ui.set || typeof S.ui.set !== 'object') S.ui.set = {};
  S.ui.set[k] = v;
  uxApply();
  dirty = true;
});

uxApply();
UPD.push(() => { if (!uxApply.t || performance.now() - uxApply.t > 2000) { uxApply.t = performance.now(); uxApply(); } });
