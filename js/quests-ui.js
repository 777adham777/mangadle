'use strict';
/* ==========================================================================
   TRI-REALM IDLE — quests on screen (2026-11-25; replaces the story's dialogue)
   - The tracker (sidebar, and the Overview on phones): the chapter, the step, why it
     matters, its progress and rewards; on a guardian step, how ready you are for it.
   - The Quests page: the chapter (its goal, the guardian's readiness, every step:
     done, now, ahead), the world trials (six per world, claim, the world seal),
     then the daily and weekly objectives (tasks-ui.js).
   - Portraits of the guides (allies, report-ui.js): an initial on their world's colour.
   Engine: data.js (GOALS), story.js (chapters), trials.js. Loaded after ui.js.
   ========================================================================== */

VIEW_FEATURE.quests = null;
UIX.quick.unshift(() => [['quests', 'quest', 'Quests']]);
UIX.questsBottom = UIX.questsBottom || [];

/* ---------------------------------------------------------------- portraits (allies) */
const NPC_REALM = {};
for (const ch of CHAPTERS) for (const id of ch.cast) if (!NPC_REALM[id]) NPC_REALM[id] = ch.realm;
function npcArt(id, big) {
  const N = NPCS[id], r = NPC_REALM[id] || 'shinobi', letter = (N ? N.name.split(' ').pop() : '?')[0];
  return `<span class="npc-face mono${big ? ' big' : ''}" style="--rc:${rc(r)}"><b>${esc(letter)}</b>${big ? `<i>${ic('realm', r)}</i>` : ''}</span>`;
}

/* ---------------------------------------------------------------- guardian readiness */
// From the same sums as the stage danger: how long you take to kill it vs how long it takes to kill you.
function readiness(ch) {
  const zi = ZONES.findIndex((z) => z.id === ch.guard);
  if (zi < 0 || !ZONES[zi].enemies.length) return null;
  let worst = 0;
  ZONES[zi].enemies.forEach((_, i) => { const e = enemyAt(zi, i); worst = Math.max(worst, timeToKill(e) / timeToDie(e)); });
  const [label, cls] = zoneDanger(zi);
  const fill = Math.max(0.04, Math.min(1, (Math.log(3) - Math.log(Math.max(worst, 0.01))) / (Math.log(3) - Math.log(0.35))));
  const tip = { deadly: 'Not yet. Levels, better gear and technique levels all close the gap.', risky: 'Possible with plenty of food. A few more levels make it safe.',
    fair: 'Ready. Bring food and it falls.', easy: 'It stands no chance.' }[cls];
  return { zi, name: ZONES[zi].enemies[0].name, label, cls, fill, tip, beaten: (S.combat.kills[ch.guard] || 0) > 0 };
}
const readyBar = (R, big) => `<div class="rd ${big ? 'big' : ''} ${R.cls}" title="${esc(R.tip)}"><span class="rd-top"><small>${big ? 'Your readiness for' : 'Readiness'} ${big ? `<b>${esc(R.name)}</b>` : ''}</small><em class="danger ${R.cls}">${R.label}</em></span><span class="rd-bar"><i style="width:${Math.round(R.fill * 100)}%"></i></span>${big ? `<small class="rd-tip">${esc(R.tip)}</small>` : ''}</div>`;
const isGuardStep = (g, ch) => g && ch && g.id === ch.guard;

/* ---------------------------------------------------------------- the tracker */
function rewardTiles(gold, items) {
  return `${gold ? `<span class="q-reward">${ui('gold')}<b>${fmt(gold)}</b></span>` : ''}${Object.entries(items || {}).map(([k, n]) => tile(k, n > 1 ? fmt(n) : null, { cls: 'xs' })).join('')}`;
}
goalHTML = function () {
  const st = goalState();
  if (!st) return `<div class="quest path"><div class="q-title"><i class="q-dia"></i><b>Every step done</b></div><p class="q-why">Trials, dungeons and Ascension still wait in every world.</p>
    <div class="q-foot">${gbtn('Quests', 'quest', 'data-nav="quests"', 'dark sm')}</div></div>`;
  const { g, cur, done } = st, i = S.goal, ch = chapterAt(i), steps = chapterEnd(ch) - ch.from + 1, k = i - ch.from + 1;
  const last = i === chapterEnd(ch), R = isGuardStep(g, ch) && !done ? readiness(ch) : null, tr = trialsOn() ? trialsReady() : 0;
  return `<div class="quest path ${done ? 'done' : ''}" style="--rc:${rc(ch.realm)}">
    <div class="q-title"><i class="q-dia"></i><b>${esc(ch.title)}</b><small>${k} / ${steps}</small></div>
    <button class="q-main" data-nav="${g.go}" title="Go"><span class="q-ic">${ic('goal', i)}</span><span class="q-text">${g.text}</span></button>
    ${g.why ? `<p class="q-why">${esc(g.why)}</p>` : ''}
    ${R ? readyBar(R) : ''}
    <div class="q-prog"><span class="xpbar thin gold"><i data-goalbar style="width:${(cur / g.n) * 100}%"></i></span><span data-goaltxt>${fmt(cur)} / ${fmt(g.n)}</span></div>
    <div class="q-rew">${rewardTiles(g.reward, g.items)}${last ? `<span class="q-chap" title="Chapter reward">${ui('crown')}</span>${rewardTiles(0, ch.reward.items)}` : ''}</div>
    <div class="q-foot">${done ? gbtn('Claim', 'check', 'data-claim', 'sm glow') : gbtn('Go', 'play', `data-nav="${g.go}"`, 'dark sm')}
      <button class="q-more ${tr ? 'hot' : ''}" data-nav="quests" title="All quests">${ui('quest')}${tr ? `<em>${tr}</em>` : ''}</button></div></div>`;
};

/* ---------------------------------------------------------------- the Quests page */
function pathHTML() {
  const i = Math.min(S.goal, GOALS.length - 1), ch = chapterAt(i), st = goalState();
  const steps = chapterSteps(ch), R = readiness(ch), gz = ZONES.find((z) => z.id === ch.guard), D = typeof DUNGEONS !== 'undefined' && DUNGEONS.find((d) => d.guard === ch.guard);
  const gate = ch.realm !== 'rift' && GATES[WORLD_ORDER[WORLD_ORDER.indexOf(ch.realm) + 1]];
  const aim = [gz ? `beat <b>${esc(gz.enemies[0].name)}</b>` : '', D ? `clear <b>${esc(D.name)}</b>` : '', gate ? `open <b>${esc(gate.name)}</b>` : ''].filter(Boolean);
  const row = (g, k) => {
    const n = ch.from + k, now = n === S.goal && st, done = n < S.goal;
    if (now) {
      const c = st.cur;
      return `<li class="qs-step now ${st.done ? 'ready' : ''}"><span class="qs-ic">${ic('goal', n)}</span><div class="qs-t"><b>${g.text}</b>${g.why ? `<small>${esc(g.why)}</small>` : ''}
        <span class="q-prog"><span class="xpbar thin gold"><i style="width:${(c / g.n) * 100}%"></i></span><span>${fmt(c)} / ${fmt(g.n)}</span></span>
        <span class="q-rew">${rewardTiles(g.reward, g.items)}</span></div>
        <span class="qs-cta">${st.done ? gbtn('Claim', 'check', 'data-claim', 'sm glow') : gbtn('Go', 'play', `data-nav="${g.go}"`, 'sm')}</span></li>`;
    }
    return `<li class="qs-step ${done ? 'done' : 'ahead'}"><span class="qs-ic">${done ? ui('check') : ic('goal', n)}</span><div class="qs-t"><b>${g.text}</b></div>${done ? '' : `<span class="qs-gold">${ui('gold')}${fmt(g.reward)}</span>`}</li>`;
  };
  const past = CHAPTERS.filter((c) => c.from >= 0 && chapterEnd(c) < S.goal);
  return `<section class="win qs-path" style="--rc:${rc(ch.realm)}">
    <div class="qs-head"><span class="qs-wic">${ic('realm', ch.realm === 'rift' ? 'rift' : ch.realm)}</span><div><small>Chapter ${ch.n} · ${S.goal - ch.from} / ${steps.length} steps</small><h2>${esc(ch.title)}</h2>
      ${aim.length ? `<p class="qs-aim">Goal: ${aim.join(', then ')}.</p>` : ''}</div>
      <div class="qs-rew"><small>Chapter reward</small><div>${rewardTiles(0, ch.reward.items)}</div></div></div>
    ${R && !R.beaten ? readyBar(R, true) : ''}
    ${(() => {
      const done = steps.map((g, k) => [g, k]).filter(([, k]) => ch.from + k < S.goal), rest = steps.map((g, k) => [g, k]).filter(([, k]) => ch.from + k >= S.goal);
      return `${done.length ? `<details class="qs-done"><summary>${ui('check')}${done.length} step${done.length > 1 ? 's' : ''} done</summary><ol class="qs-steps">${done.map(([g, k]) => row(g, k)).join('')}</ol></details>` : ''}
        <ol class="qs-steps">${rest.map(([g, k]) => row(g, k)).join('')}</ol>`;
    })()}
    ${past.length ? `<p class="qs-past">${ui('check')}${past.map((c) => esc(c.title)).join(' · ')}</p>` : ''}
  </section>`;
}
function trialCardHTML(t) {
  const got = trialGot(t), p = trialProg(t), done = !got && p >= t.n;
  return `<div class="tr-card ${got ? 'got' : done ? 'ready' : ''}">
    <div class="tr-t"><b>${esc(t.text)}</b><small>${esc(t.how)}</small></div>
    ${got ? `<span class="tr-got">${ui('check')}Claimed</span>` : `<span class="q-prog"><span class="xpbar thin gold"><i style="width:${(p / t.n) * 100}%"></i></span><span>${fmt(p)} / ${fmt(t.n)}</span></span>`}
    <div class="tr-foot"><span class="q-rew">${rewardTiles(Math.round(trialGold(t) * goldMult()), t.items)}</span>
      ${got ? '' : done ? gbtn('Claim', 'check', `data-trclaim="${t.id}"`, 'sm glow') : gbtn('Go', 'play', `data-nav="${t.go}"`, 'dark sm')}</div></div>`;
}
function trialsHTML() {
  if (!trialsOn()) return '';
  const worlds = WORLD_ORDER.filter((r) => trialsOf(r).length && realmOpen(r));
  if (!worlds.length) return '';
  let w = S.ui.trialW;
  if (!worlds.includes(w)) w = worlds.find((r) => trialsOf(r).some(trialDone)) || chapterAt(Math.min(S.goal, GOALS.length - 1)).realm;
  if (!worlds.includes(w)) w = worlds[worlds.length - 1];
  const list = trialsOf(w), got = list.filter(trialGot).length;
  const tabs = worlds.map((r) => { const n = trialsOf(r).filter(trialDone).length; return `<button class="${r === w ? 'on' : ''}" data-trw="${r}" style="--rc:${rc(r)}">${ic('realm', r)}<span>${esc(REALMS[r].name)}</span>${sealOf(r) ? `<i class="tr-seal" title="Seal earned">${ui('crown')}</i>` : n ? `<em>${n}</em>` : ''}</button>`; }).join('');
  return `<section class="win qs-trials" style="--rc:${rc(w)}">${hdr('World trials', 'medium-term goals beside the path')}
    <nav class="seg tr-tabs">${tabs}</nav>
    <div class="tr-seal-row ${sealOf(w) ? 'on' : ''}">${ui('crown')}<span>${sealOf(w) ? `<b>${esc(REALMS[w].name)} Seal</b> · its skills work 5% faster and earn 5% more XP.` : `<b>${got} / ${list.length}</b> claimed · all six give the <b>${esc(REALMS[w].name)} Seal</b>: +5% speed and XP for its skills, for good.`}</span></div>
    <div class="tr-cards">${list.map(trialCardHTML).join('')}</div></section>`;
}
VIEWS.quests = () => `
  ${ptitle('Your journey', 'Quests')}
  <div class="qs-layout">
    <div class="qs-main">${pathHTML()}${uix('questsBottom')}</div>
    <div class="qs-side">${trialsHTML()}</div>
  </div>`;

// The Overview keeps one line of it (one information, one place): what waits on the Quests page.
UIX.homeTop.push(() => {
  const tr = trialsOn() ? trialsReady() : 0, T = typeof tasksOn === 'function' && tasksOn() ? S.tasks : null;
  const dl = T ? [...(T.daily || []), ...(T.weekly || [])].filter((t) => !t.claimed && taskProg(t) >= t.n).length : 0;
  if (!tr && !dl) return '';
  return `<button class="win qs-sum" data-nav="quests">${ui('quest')}<span><b>Quests</b><small>${[tr ? `${tr} trial${tr > 1 ? 's' : ''} to claim` : '', dl ? `${dl} objective${dl > 1 ? 's' : ''} to claim` : ''].filter(Boolean).join(' · ')}</small></span>${ui('play')}</button>`;
});

/* ---------------------------------------------------------------- moments */
// A step claimed: the next one in a quiet line of the feed. A chapter done: a banner (no cutscene).
on('goal', () => {
  const st = goalState();
  if (st) setTimeout(() => toast(`Next: ${st.g.text}`, 'good'), 700);
});
on('chapter', (ch) => { bannerBurst(`${ch.title} complete`, 'The chapter reward is in your Bank', ic('realm', ch.realm === 'rift' ? 'rift' : ch.realm), rc(ch.realm), 'lvup'); });
on('trialready', (t) => { toast(`Trial done: ${t.text}. Claim it in Quests.`, 'rare'); sideDirty = true; });
on('trial', (d) => { toast(`Trial claimed: +${fmt(d.gold)} gold`, 'good'); sideDirty = true; });
on('seal', (r) => bannerBurst(`${REALMS[r].name} Seal`, 'Every trial done: its skills +5% speed and XP', ic('realm', r), rc(r), 'lvup'));

document.addEventListener('click', (ev) => {
  const t = ev.target.closest('[data-trclaim], [data-trw]');
  if (!t || t.disabled) return;
  if (t.dataset.trclaim) claimTrial(t.dataset.trclaim);
  else if (t.dataset.trw) { S.ui.trialW = t.dataset.trw; dirty = true; }
});
UPD.push(() => {
  if (S.ui.view !== 'quests') return;
  // a step or trial that completes while the page is open: redraw once
  const sig = (goalState() || {}).done + '|' + (trialsOn() ? trialsReady() : 0);
  if (UPD.qsSig !== undefined && UPD.qsSig !== sig) dirty = true;
  UPD.qsSig = sig;
});
// The game booted before this file loaded: draw the tracker again.
dirty = true;
if (typeof sideDirty !== 'undefined') sideDirty = true;
