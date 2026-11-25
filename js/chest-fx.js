'use strict';
/* ==========================================================================
   ANIME IDLE RPG — chest opening, gacha style
   Opening a chest from the Bank plays a short pull: the chest drops onto a dimmed screen,
   shakes harder and harder while its glow climbs through the rarity colours up to the best
   item inside (blue Rare → purple Epic → gold Legendary), then the lid bursts off in light.
   The items fly out as face-down cards and turn over one by one, the best one last; Epic and
   Legendary cards charge, then land with a beam and a shockwave. Gold counts up.
   Opening a big stack plays one opening, then a summary: the best pull as a card and every
   stack in a grid. Click / Space / Enter / Esc skips to the end, the next one closes.
   Pure DOM timers: the game loop keeps running underneath. Never plays while simulating.
   Loaded after reveal.js (REVEAL_COL).
   ========================================================================== */

const CX_COL = { 1: ['#a4aabb', '#eef0f5'], 2: ['#5fc28c', '#d6f7e3'] };
const cxCol = (r) => (typeof REVEAL_COL !== 'undefined' && REVEAL_COL[r]) || CX_COL[r] || CX_COL[1];
let cxOn = null;

// Opens n of chest id and plays the opening. Returns openChest's result (or null).
function chestOpenFx(id, n) {
  const before = Object.assign({}, S.found);
  const res = openChest(id, n);
  if (!res) return null;
  if (SIM || document.hidden) showLoot(`Opened ${res.n} × ${ITEMS[id].name}`, res);
  else chestPlay(id, res, before);
  return res;
}

const cxNoTip = (h) => h.replace(/ data-tip="[^"]*"/g, '');
const cxParts = (cls, k, f) => Array.from({ length: k }, (_, i) => `<i class="${cls}" style="${f(i)}"></i>`).join('');
const cxRnd = (a, b) => a + Math.random() * (b - a);

function cxCard(o, i, label) {
  const [c1, c2] = cxCol(o.r);
  return `<div class="cx-card r${o.r}${o.r >= 4 ? ' big' : ''}" data-i="${i}" style="--c1:${c1};--c2:${c2}">
    ${o.r >= 4 ? '<i class="cx-beam"></i><i class="cx-wave"></i><i class="cx-wave two"></i>' : ''}
    <div class="cx-flip">
      <div class="cx-face cx-back"><span>${ui('star')}</span></div>
      <div class="cx-face cx-front">
        <span class="cx-art">${itemIc(o.id)}${o.isNew ? '<em class="cx-new">New</em>' : ''}<b class="cx-q">×${fmt(o.q)}</b></span>
        <span class="cx-label"><span class="cx-stars">${'<i></i>'.repeat(o.r)}</span><b class="cx-name">${esc(ITEMS[o.id] ? ITEMS[o.id].name : fruitLabel(o.id))}</b>
        <small>${label || RARITY_NAME[o.r]}</small></span>
      </div>
    </div></div>`;
}

function chestPlay(id, res, before) {
  if (cxOn) cxClose(true);
  const list = Object.entries(res.items).map(([k, q]) => ({ id: k, q, r: rarity(k), isNew: !before[k] }))
    .sort((a, b) => a.r - b.r || (ITEMS[a.id].value || 0) * a.q - (ITEMS[b.id].value || 0) * b.q);
  const best = list.length ? list[list.length - 1] : null;
  const top = best ? best.r : 1;
  const cards = res.n <= 10 && list.length <= 6;
  const calm = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const sp = calm ? 0.35 : 1;   // timeline scale
  // glow steps: always opens on the chest's base colour, climbs to the best rarity inside
  const steps = top <= 2 ? [top] : Array.from({ length: top - 2 }, (_, i) => i + 3);
  const [c1, c2] = cxCol(steps[0]);
  const art = cxNoTip(itemIc(id));
  const box = document.createElement('div');
  box.className = 'cx-wrap';
  box.setAttribute('role', 'dialog');
  box.setAttribute('aria-label', `Opening ${ITEMS[id].name}`);
  box.innerHTML = `<div class="cx" data-top="${top}" style="--c1:${c1};--c2:${c2}">
    <i class="cx-dim"></i><i class="cx-rays"></i><i class="cx-flash"></i>
    <div class="cx-head"><small>${res.n > 1 ? `Opening ×${fmt(res.n)}` : 'Opening'}</small><b>${esc(ITEMS[id].name)}</b></div>
    <div class="cx-chest">
      <i class="cx-glow"></i>
      <span class="cx-sparks">${cxParts('cx-spark', 14, (i) => `--a:${(i * 360) / 14}deg;--dl:${((i * 7) % 5) * 0.13}s`)}</span>
      <span class="cx-box"><span class="cx-lid">${art}</span><span class="cx-base">${art}</span></span>
      <i class="cx-ring"></i><i class="cx-ring two"></i>
      <span class="cx-burst">${cxParts('cx-p', top >= 4 ? 34 : 24, (i) => `--a:${cxRnd(0, 360).toFixed(0)}deg;--d:${cxRnd(110, 330).toFixed(0)}px;--s:${cxRnd(3, 9).toFixed(1)}px;--dl:${cxRnd(0, 0.12).toFixed(2)}s${i % 3 ? '' : ';--w:2px;--h:22px'}`)}</span>
    </div>
    <div class="cx-res"></div>
    <div class="cx-foot"><span class="cx-gold">${ui('gold')}<b data-cxg>0</b></span><small class="cx-tap">Tap to skip</small></div>
  </div>`;
  document.body.appendChild(box);
  if (document.activeElement && document.activeElement.blur) document.activeElement.blur();
  const root = box.firstElementChild;
  const o = cxOn = { box, root, jobs: [], done: false, lock: 0, gold: res.gold, raf: 0 };
  const at = (ms, fn) => {
    const j = { ms, fn, done: false };
    j.t = setTimeout(() => { if (!j.done) { j.done = true; fn(); } }, ms * sp);
    o.jobs.push(j);
  };
  const pop = (el, cls) => { if (!el) return; el.classList.remove(cls); void el.offsetWidth; el.classList.add(cls); };
  const setCol = (r) => { const [a, b] = cxCol(r); root.style.setProperty('--c1', a); root.style.setProperty('--c2', b); };

  // 1. tension: the chest shakes harder at each colour step
  const T0 = 420, T = (top <= 2 ? 900 : top === 3 ? 1150 : top === 4 ? 1700 : 2300);
  at(T0, () => root.classList.add('charging', 's1'));
  steps.forEach((r, i) => {
    if (!i) return;
    at(T0 + (T * i) / steps.length, () => {
      setCol(r);
      root.classList.remove('s1', 's2'); root.classList.add(i >= 2 ? 's3' : 's2');
      pop(root.querySelector('.cx-glow'), 'pop');
    });
  });
  if (steps.length === 1) at(T0 + T * 0.6, () => { root.classList.remove('s1'); root.classList.add('s2'); });
  // 2. burst
  const TB = T0 + T;
  at(TB, () => { root.classList.remove('charging', 's1', 's2', 's3'); root.classList.add('burst'); setCol(top); });
  // 3. results
  const TI = TB + 320, resEl = root.querySelector('.cx-res');
  let tEnd;
  const flyIn = (card) => {
    const r = card.getBoundingClientRect(), c = root.querySelector('.cx-chest').getBoundingClientRect();
    card.style.setProperty('--fx', `${c.left + c.width / 2 - (r.left + r.width / 2)}px`);
    card.style.setProperty('--fy', `${c.top + c.height / 2 - (r.top + r.height / 2)}px`);
    card.classList.add('in');
  };
  const reveal = (t, i, r) => {
    const q = () => root.querySelector(`.cx-card[data-i="${i}"]`);
    if (r >= 4) {
      at(t, () => { const c = q(); if (c) c.classList.add('charge'); });
      at(t + 560, () => { const c = q(); if (c) { c.classList.remove('charge'); c.classList.add('flip'); } pop(root, r >= 5 ? 'hit5' : 'hit4'); });
      return t + 560 + 760;
    }
    at(t, () => { const c = q(); if (c) c.classList.add('flip'); });
    return t + (r === 3 ? 470 : 300);
  };
  if (cards) {
    at(TI, () => {
      resEl.innerHTML = `<div class="cx-cards">${list.map((x, i) => cxCard(x, i)).join('')}</div>`;
    });
    list.forEach((x, i) => at(TI + 40 + i * 120, () => { const c = root.querySelector(`.cx-card[data-i="${i}"]`); if (c) flyIn(c); }));
    let t = TI + 40 + list.length * 120 + 380;
    const tGold = t;
    list.forEach((x, i) => { t = reveal(t, i, x.r); });
    at(tGold, () => cxGold(o, 900 * sp));
    tEnd = Math.max(t, tGold + 900) + 150;
  } else {
    const items = list.reduce((a, x) => a + x.q, 0);
    const desc = list.slice().reverse();
    at(TI, () => {
      resEl.innerHTML = `<div class="cx-sum">
        ${best ? `<div class="cx-best"><small>Best pull</small><div class="cx-cards">${cxCard(best, 0)}</div></div>` : ''}
        <div class="cx-grid">${desc.map((x, i) => tile(x.id, '×' + fmt(x.q), { cls: 'cx-t' + (x === best ? ' best' : ''), attrs: `style="--d:${(Math.min(i, 40) * 0.03).toFixed(2)}s"`, corner: x.isNew ? '<span class="new">New</span>' : '' })).join('')}</div>
        <div class="cx-tot"><span><b>${fmt(res.n)}</b> opened</span><span><b>${fmt(items)}</b> items</span><span><b>${list.length}</b> kinds</span></div>
      </div>`;
    });
    at(TI + 40, () => { const c = root.querySelector('.cx-card[data-i="0"]'); if (c) flyIn(c); });
    let t = reveal(TI + 520, 0, best ? best.r : 1);
    at(t, () => { const s = root.querySelector('.cx-sum'); if (s) s.classList.add('go'); });
    at(t, () => cxGold(o, 900 * sp));
    tEnd = t + Math.min(desc.length, 40) * 30 + 900;
  }
  at(tEnd, () => cxFinish(o));

  box.addEventListener('click', (e) => { e.stopPropagation(); cxInput(); });
}

function cxGold(o, dur) {
  const el = o.root.querySelector('[data-cxg]');
  if (!el) return;
  o.root.classList.add('gold-on');
  const t0 = performance.now();
  const tick = (now) => {
    if (cxOn !== o) return;
    const p = Math.min(1, (now - t0) / Math.max(1, dur));
    el.textContent = '+' + fmt(Math.round(o.gold * (1 - Math.pow(1 - p, 3))));
    if (p < 1) o.raf = requestAnimationFrame(tick);
  };
  o.raf = requestAnimationFrame(tick);
}
function cxFinish(o) {
  if (o.done) return;
  o.done = true;
  cancelAnimationFrame(o.raf);
  const el = o.root.querySelector('[data-cxg]');
  if (el) el.textContent = '+' + fmt(o.gold);
  o.root.classList.add('done', 'gold-on');
  const tap = o.root.querySelector('.cx-tap');
  if (tap) tap.textContent = 'Tap to continue';
}
// Run every pending step now, in order, with the animations cut short.
function cxSkip(o) {
  o.root.classList.add('skip');
  const left = o.jobs.filter((j) => !j.done).sort((a, b) => a.ms - b.ms);
  for (const j of left) { clearTimeout(j.t); j.done = true; j.fn(); }
  cxFinish(o);
}
function cxInput() {
  const o = cxOn;
  if (!o) return;
  if (!o.done) { cxSkip(o); o.lock = performance.now() + 250; return; }
  if (performance.now() < o.lock) return;
  cxClose();
}
function cxClose(now) {
  const o = cxOn;
  if (!o) return;
  cxOn = null;
  for (const j of o.jobs) clearTimeout(j.t);
  cancelAnimationFrame(o.raf);
  if (now) { o.box.remove(); return; }
  o.box.classList.add('out');
  setTimeout(() => o.box.remove(), 260);
  if (typeof updateCoach === 'function') updateCoach(true);
}
document.addEventListener('keydown', (e) => {
  if (!cxOn || !['Escape', 'Enter', ' ', 'Spacebar'].includes(e.key)) return;
  e.preventDefault(); e.stopPropagation();
  if (!e.repeat) cxInput();
}, true);
