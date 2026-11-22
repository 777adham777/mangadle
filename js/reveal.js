'use strict';
/* ==========================================================================
   TRI-REALM IDLE — the rare drop reveal
   An Epic (4★) or Legendary (5★) drop stops the screen for a moment, like a gacha pull:
   a beam of light in the rarity's colour falls, a shockwave, and the item's card turns over,
   its stars landing one by one. The card says what the item is for (its stats, what it makes,
   where to use it), so a rare drop is never a mystery. A click (or a key) closes it.
   Repeats of the same Epic within a few minutes only get the usual toast.
   Loaded after tooltips.js (uses tipEffect, statRows).
   ========================================================================== */

const REVEAL_COL = { 3: ['#4fa8ff', '#bfe0ff'], 4: ['#b46bff', '#e8ccff'], 5: ['#ffb627', '#fff1b8'] };
const REVEAL_SEEN = {};   // item id -> when it was last revealed (this session)
const revealQ = [];
let revealOn = null;

// What to do with it, in one line: the place in the game where it matters.
function revealUse(id) {
  const it = ITEMS[id];
  if (!it) return '';
  if (it.type === 'equip') return it.slot === 'weapon' ? 'Wield it from the Bank: every copy levels and refines on its own.' : 'Wear it from the Bank.';
  if (it.type === 'chest') return 'Open it from the Bank.';
  if (it.type === 'fruit') return S.fruit === id ? 'Eat it to deepen your fruit (rank up).' : 'Eat it from the Bank for a permanent power (one fruit at a time).';
  if (it.type === 'gem') return 'Socket it into gear, or use it to refine a weapon.';
  if (it.type === 'wish') return 'One of seven Dragon Balls. Gather all seven to make a wish.';
  if (it.type === 'schematic') return 'Learned for good.';
  const uses = [];
  for (const k in SKILLS) for (const a of SKILLS[k].actions || []) if (a.in && a.in[id]) uses.push(`${a.name} (${SKILLS[k].name} ${a.level})`);
  for (const r in GATES) if (GATES[r].offer && GATES[r].offer[id] && !S.gates[r]) uses.push(`the offering at ${GATES[r].name}`);
  if (typeof EXTRA_USES !== 'undefined') for (const [k, t] of EXTRA_USES) if (k === id) uses.push(t);
  if (!uses.length) return '';
  return 'For ' + (uses.length > 2 ? `${uses.slice(0, 2).join(', ')} and ${uses.length - 2} more` : uses.join(' and ')) + '.';
}
function revealHTML(id, source) {
  const it = ITEMS[id], r = rarity(id), [c1, c2] = REVEAL_COL[r] || REVEAL_COL[4];
  const fx = typeof tipEffect === 'function' ? tipEffect(id) : { rows: [], text: '' };
  const rows = fx.rows.slice(0, 4).map(([icon, label, val]) => `<li>${ui(icon)}<span>${esc(label)}</span><b>${esc(String(val))}</b></li>`).join('');
  const use = revealUse(id), at = (S.stats.foundAt || {})[id], first = at != null && Date.now() - at < 4000;
  return `<div class="rv" style="--c1:${c1};--c2:${c2}" data-r="${r}">
    <i class="rv-dim"></i><i class="rv-beam"></i><i class="rv-ring"></i><i class="rv-ring two"></i><i class="rv-rays"></i>
    <div class="rv-card">
      <div class="rv-kick">${r >= 5 ? 'Legendary drop' : r >= 4 ? 'Epic drop' : 'Rare drop'}${first ? '<em>New</em>' : ''}</div>
      <div class="rv-art">${itemIc(id)}</div>
      <div class="rv-stars">${'<i></i>'.repeat(r)}</div>
      <h3>${esc(it.name)}</h3>
      <small class="rv-src">${esc(source || '')}</small>
      ${rows ? `<ul class="rv-fx">${rows}</ul>` : ''}
      ${fx.text ? `<p class="rv-txt">${esc(fx.text)}</p>` : ''}
      ${use ? `<p class="rv-use">${ui('info')}${esc(use)}</p>` : ''}
      <small class="rv-tap">Tap to continue</small>
    </div></div>`;
}
function revealNext() {
  if (revealOn || !revealQ.length) return;
  const [id, source] = revealQ.shift(), r = rarity(id);
  const box = document.createElement('div');
  box.className = 'rv-wrap';
  box.innerHTML = revealHTML(id, source);
  document.body.appendChild(box);
  const close = () => {
    if (!revealOn || revealOn.box !== box) return;
    clearTimeout(revealOn.t);
    box.classList.add('out');
    revealOn = null;
    setTimeout(() => { box.remove(); revealNext(); }, 260);
  };
  revealOn = { box, t: setTimeout(close, r >= 5 ? 4600 : 3600) };
  box.addEventListener('click', close);
  // the card can only be skipped once it has turned over
  setTimeout(() => box.classList.add('live'), 450);
}
function dropReveal(id, source) {
  if (SIM || !ITEMS[id] || document.hidden) return false;
  const r = rarity(id), now = Date.now();
  if (r < 4) return false;
  if (r < 5 && REVEAL_SEEN[id] && now - REVEAL_SEEN[id] < 5 * 60e3) return false;
  REVEAL_SEEN[id] = now;
  if (revealQ.length < 4) revealQ.push([id, source]);
  revealNext();
  return true;
}
document.addEventListener('keydown', (e) => { if (revealOn && (e.key === 'Escape' || e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); revealOn.box.click(); } });
// When each item was first found (for the "New" tag).
on('newitem', (id) => { S.stats.foundAt = S.stats.foundAt || {}; if (S.stats.foundAt[id] == null) S.stats.foundAt[id] = Date.now(); });
