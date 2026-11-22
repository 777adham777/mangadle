'use strict';
/* ==========================================================================
   TRI-REALM IDLE — the story on screen (story.js is the data + engine)
   - the quest tracker (sidebar + Overview): the chapter, the guide's portrait and
     line, the quest, its progress and everything it pays
   - a chapter card when a chapter starts (its guide, its opening) and when one ends
     (the closing line, the rewards, the outfit and haircut earned)
   - the story log: every chapter so far, re-readable
   Loaded after ui.js.
   ========================================================================== */

/* ---------------------------------------------------------------- portraits */
const NPC_ART = {};
function npcArt(id, big) {
  const k = id + (big ? ':b' : '');
  if (!NPC_ART[k]) {
    const N = NPCS[id];
    try { NPC_ART[k] = avatarSVG(Object.assign({ hat: 'none', back: 'none', aura: 'none', stance: 'relaxed' }, N.look), { still: true, pose: 'relaxed', cls: 'npc-av' }); }
    catch (e) { NPC_ART[k] = ui('hero'); }
  }
  return `<span class="npc-face${big ? ' big' : ''}">${NPC_ART[k]}</span>`;
}

/* ---------------------------------------------------------------- the tracker */
function rewardTiles(gold, items, cos) {
  return `${gold ? `<span class="q-reward">${ui('gold')}<b>${fmt(gold)}</b></span>` : ''}${Object.entries(items || {}).map(([k, n]) => tile(k, n > 1 ? fmt(n) : null, { cls: 'xs' })).join('')}`
    + (cos || []).map(([s, id]) => { const c = COSMETICS[s] && COSMETICS[s].find((x) => x.id === id); return c ? `<span class="q-cos" title="${esc(c.name)} (${s === 'hair' ? 'haircut' : 'outfit'})">${ui('avatar')}</span>` : ''; }).join('');
}
goalHTML = function () {
  const st = goalState();
  if (!st) return `<div class="quest story"><div class="q-title"><i class="q-dia"></i><b>The End</b></div><div class="q-say"><p>The map is whole. Every world is still its own. Keep pushing your levels: there are secrets left everywhere.</p></div>
    <div class="q-foot">${gbtn('Story log', 'quest', 'data-storylog', 'dark sm')}</div></div>`;
  const { g, cur, done } = st, i = S.goal, ch = chapterAt(i), q = questOf(i), npc = questNpc(i), id = chapterAt(i).cast[q.w] || ch.cast[0];
  const last = i === chapterEnd(ch);
  return `<div class="quest story ${done ? 'done' : ''}" style="--rc:${rc(ch.realm === 'rift' ? 'rift' : ch.realm)}">
    <div class="q-title"><i class="q-dia"></i><b>Ch. ${ch.n} · ${esc(ch.title)}</b><small>${i - ch.from + 1} / ${chapterEnd(ch) - ch.from + 1}</small></div>
    <button class="q-say" data-storylog title="Story log">${npcArt(id)}<span><small>${esc(npc.name)}</small><p>${esc(q.s)}</p></span></button>
    <button class="q-main" data-nav="${g.go}" title="Go to this quest"><span class="q-ic">${ic('goal', i)}</span><span class="q-text">${g.text}</span></button>
    <div class="q-prog"><span class="xpbar thin gold"><i data-goalbar style="width:${(cur / g.n) * 100}%"></i></span><span data-goaltxt>${fmt(cur)} / ${fmt(g.n)}</span></div>
    <div class="q-rew">${rewardTiles(g.reward, q.i)}${last ? `<span class="q-chap" title="Chapter reward">${ui('crown')}</span>${rewardTiles(0, ch.reward.items, ch.reward.cos)}` : ''}</div>
    <div class="q-foot">${done ? gbtn('Claim', 'check', 'data-claim', 'sm glow') : gbtn('Go', 'play', `data-nav="${g.go}"`, 'dark sm')}</div></div>`;
};

/* ---------------------------------------------------------------- chapter cards */
// Pages: [{ kind: 'end' | 'start', ch }]; shown one after another, over everything but the drop reveal.
const SC_Q = [];
let scOn = null;
function scPage(p) {
  const ch = p.ch, id = ch.cast[0], N = NPCS[id];
  if (p.kind === 'end') {
    const R = ch.reward;
    return `<div class="sc-card end" style="--rc:${rc(ch.realm)}"><small class="sc-kick">Chapter ${ch.n} complete</small><h2>${esc(ch.title)}</h2>
      <p class="sc-txt">${esc(ch.end)}</p>
      <div class="sc-rew"><small>Chapter reward</small><div>${rewardTiles(0, R.items)}</div>
      ${R.cos.length ? `<ul>${R.cos.map(([s, cid]) => { const c = COSMETICS[s] && COSMETICS[s].find((x) => x.id === cid); return c ? `<li>${ui('avatar')}<span>${s === 'hair' ? 'Haircut' : 'Outfit'}: <b>${esc(c.name)}</b></span></li>` : ''; }).join('')}</ul><small class="muted">Wear them in Bank → Avatar.</small>` : ''}</div>
      <button class="gbtn glow" data-scnext>${ui('play')}<span>Continue</span></button></div>`;
  }
  return `<div class="sc-card start" style="--rc:${rc(ch.realm)}">
    <div class="sc-art">${npcArt(id, true)}<span class="sc-who"><b>${esc(N.name)}</b><small>${esc(N.title)}</small></span></div>
    <div class="sc-body"><small class="sc-kick">Chapter ${ch.n}</small><h2>${esc(ch.title)}</h2>${ch.intro.map((l) => `<p class="sc-txt">${esc(l)}</p>`).join('')}
      <button class="gbtn glow" data-scnext>${ui('play')}<span>${ch.n === 1 ? 'Begin' : 'Set out'}</span></button></div></div>`;
}
function scNext() {
  if (scOn) { scOn.remove(); scOn = null; }
  const p = SC_Q.shift();
  if (!p) return;
  if (p.kind === 'start') storyState().seen[p.ch.id] = 1;
  const w = document.createElement('div');
  w.className = 'sc-wrap';
  w.innerHTML = `<i class="sc-bar top"></i><i class="sc-bar bot"></i>${scPage(p)}`;
  document.body.appendChild(w);
  scOn = w;
}
document.addEventListener('click', (ev) => {
  if (ev.target.closest('[data-scnext]')) { scNext(); return; }
  if (ev.target.closest('[data-storylog]')) { storyLog(); }
});
on('chapter', (ch) => {
  SC_Q.push({ kind: 'end', ch });
  const nx = CHAPTERS[CHAPTERS.indexOf(ch) + 1];
  if (nx && S.goal >= nx.from) SC_Q.push({ kind: 'start', ch: nx });
});
// The current chapter's opening, once, as soon as nothing else is on screen (a new game: after the welcome).
let scBoot = 0;
UPD.push(() => {
  if (scOn || SIM) return;
  if (!scBoot) scBoot = performance.now();
  if (performance.now() - scBoot < 1500 || $('#modal').classList.contains('show') || document.querySelector('.rv-wrap')) return;
  if (!SC_Q.length && goalState()) {
    const ch = chapterAt(S.goal);
    if (!storyState().seen[ch.id]) SC_Q.push({ kind: 'start', ch });
  }
  if (SC_Q.length) scNext();
});
// After a claim, the guide gives the next quest in a toast (unless a chapter card is coming).
on('goal', (g) => {
  if (SC_Q.length || !goalState()) return;
  const i = S.goal, npc = questNpc(i);
  if (i === chapterAt(i).from) return;   // a new chapter: its card tells the story
  setTimeout(() => toast(`${npc.name}: “${questOf(i).s}”`, 'good'), 900);
});

/* ---------------------------------------------------------------- the story log */
function storyLog() {
  const cur = chapterAt(Math.min(S.goal, GOALS.length - 1));
  const rows = CHAPTERS.filter((c) => c.from <= S.goal).map((c) => {
    const end = chapterEnd(c), done = S.goal > end, lines = [];
    for (let i = c.from; i <= Math.min(end, S.goal); i++) lines.push(`<li class="${i < S.goal ? 'ok' : ''}"><b>${esc(GOALS[i].text)}</b><span>${esc(NPCS[c.cast[questOf(i).w] || c.cast[0]].name)}: “${esc(questOf(i).s)}”</span></li>`);
    return `<details class="sl-ch" ${c === cur ? 'open' : ''}><summary>${npcArt(c.cast[0])}<span><small>Chapter ${c.n}${done ? ' · complete' : ''}</small><b>${esc(c.title)}</b></span></summary>
      ${c.intro.map((l) => `<p class="sc-txt">${esc(l)}</p>`).join('')}<ul class="sl-q">${lines.join('')}</ul>${done ? `<p class="sc-txt end">${esc(c.end)}</p>` : ''}</details>`;
  }).join('');
  const left = CHAPTERS.length - CHAPTERS.filter((c) => c.from <= S.goal).length;
  openModal(`<div class="story-log"><h2>${ui('quest')} Story</h2>${rows}${left ? `<p class="muted small">${left} chapter${left > 1 ? 's' : ''} still ahead.</p>` : ''}</div>`);
}
// The game booted before this file loaded: draw the tracker again with the story.
dirty = true;
if (typeof sideDirty !== 'undefined') sideDirty = true;
