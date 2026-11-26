'use strict';
/* ==========================================================================
   ANIME IDLE RPG — quests on screen (2026-11-25; replaces the story's dialogue)
   - The tracker (sidebar, and the Overview on phones): the chapter, the step, why it
     matters, its progress and rewards.
   - The Quests page: the chapter (its goal, every step:
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

const isGuardStep = (g, ch) => g && ch && g.id === (ch.step || ch.guard);

/* ---------------------------------------------------------------- the tracker */
function rewardTiles(gold, items) {
  return `${gold ? `<span class="q-reward">${ui('gold')}<b>${fmt(gold)}</b></span>` : ''}${Object.entries(items || {}).map(([k, n]) => tile(k, n > 1 ? fmt(n) : null, { cls: 'xs' })).join('')}`;
}
// One line of rewards for the done state: gold and item icons with their counts (the box keeps its height).
function rewardMini(gold, items) {
  return `${gold ? `<span class="q-mini g">${ui('gold')}<b>${fmt(gold)}</b></span>` : ''}${Object.entries(items || {}).map(([k, n]) => `<span class="q-mini">${itemIc(k)}${n > 1 ? `<b>×${fmt(n)}</b>` : ''}</span>`).join('')}`;
}
// The build's last step is done: a final state, nothing to click, no world outside the build named.
function buildEndHTML() {
  const n = WORLD_ORDER.filter((r) => r !== 'rift' && worldInBuild(r)).length;
  return `<div class="quest path end"><div class="q-title"><i class="q-dia"></i><b>Pre-alpha</b><small>Done</small></div>
    <div class="q-main"><span class="q-ic">${ui('check')}</span><span class="q-text">End of this build</span></div>
    <div class="q-prog"><span class="xpbar thin gold"><i style="width:100%"></i></span><span>${n} / ${n} worlds</span></div></div>`;
}
goalHTML = function () {
  const st = goalState();
  if (!st) return buildEnd() ? buildEndHTML() : `<div class="quest path"><div class="q-title"><i class="q-dia"></i><b>Every step done</b></div>
    <div class="q-foot">${gbtn('Quests', 'quest', 'data-nav="quests"', 'dark sm')}</div></div>`;
  const { g, cur, done } = st, i = S.goal, ch = chapterAt(i), steps = chapterEnd(ch) - ch.from + 1, k = i - ch.from + 1;
  const last = i === chapterEnd(ch), opens = goalOpens();
  return `<div class="quest path ${done ? 'done' : ''}" style="--rc:${rc(ch.realm)}">
    <div class="q-title"><i class="q-dia"></i><b>${esc(ch.title)}</b><small>${k} / ${steps}</small></div>
    <button class="q-main" data-nav="${g.go}" title="Go"><span class="q-ic">${ic('goal', i)}</span><span class="q-text">${g.text}${opens ? `<small class="q-opens">Opens ${esc(opens.name)}</small>` : ''}</span></button>
    ${done ? `<div class="q-prog q-donerow"><span class="q-minis">${rewardMini(g.reward, g.items)}${last ? `<span class="q-mini" title="Chapter reward">${ui('crown')}</span>${rewardMini(0, ch.reward.items)}` : ''}</span>${gbtn('Claim', 'check', 'data-claim', 'sm glow')}</div>`
    : `<div class="q-prog"><span class="xpbar thin gold"><i data-goalbar style="width:${(cur / g.n) * 100}%"></i></span><span data-goaltxt>${fmt(cur)} / ${fmt(g.n)}</span></div>
    <div class="q-rew">${rewardTiles(g.reward, g.items)}${last ? `<span class="q-chap" title="Chapter reward">${ui('crown')}</span>${rewardTiles(0, ch.reward.items)}` : ''}</div>
    <div class="q-foot">${gbtn('Go', 'play', `data-nav="${g.go}"`, 'dark sm')}</div>`}</div>`;
};

/* ---------------------------------------------------------------- the Quests page */
function pathHTML() {
  const i = Math.min(S.goal, GOALS.length - 1), ch = chapterAt(i), st = goalState();
  const steps = chapterSteps(ch);
  const row = (g, k) => {
    const n = ch.from + k, now = n === S.goal && st, done = n < S.goal;
    if (n === S.goal && buildEnd()) return `<li class="qs-step qs-end"><span class="qs-ic">${ic('realm', buildEnd())}</span><div class="qs-t"><b>End of this build</b><small>${esc(REALMS[buildEnd()].name)} comes in a later build.</small></div></li>`;
    if (n > S.goal && buildEnd()) return '';
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
    <div class="qs-head"><span class="qs-wic">${ic('realm', ch.realm === 'rift' ? 'rift' : ch.realm)}</span><div><small>Chapter ${ch.n} · ${S.goal - ch.from} / ${steps.length}</small><h2>${esc(ch.title)}</h2></div>
      <div class="qs-rew"><small>Chapter reward</small><div>${rewardTiles(0, ch.reward.items)}</div></div></div>
    ${(() => {
      const done = steps.map((g, k) => [g, k]).filter(([, k]) => ch.from + k < S.goal), rest = steps.map((g, k) => [g, k]).filter(([, k]) => ch.from + k >= S.goal);
      return `${done.length ? `<details class="qs-done"><summary>${ui('check')}${done.length} step${done.length > 1 ? 's' : ''} done</summary><ol class="qs-steps">${done.map(([g, k]) => row(g, k)).join('')}</ol></details>` : ''}
        <ol class="qs-steps">${rest.map(([g, k]) => row(g, k)).join('')}</ol>`;
    })()}
    ${past.length ? `<p class="qs-past">${ui('check')}${past.map((c) => esc(c.title)).join(' · ')}</p>` : ''}
  </section>`;
}
function trialCardHTML(t) {
  const got = trialGot(t), p = trialProg(t), done = !got && p >= t.n, go = !got && !done;
  return `<div class="tr-card ${got ? 'got' : done ? 'ready' : 'go'}"${go ? ` data-nav="${t.go}"` : ''}${t.how ? ` title="${esc(t.how)}"` : ''}>
    <div class="tr-t"><b>${esc(t.text)}</b></div>
    ${got ? `<span class="tr-got">${ui('check')}Claimed</span>` : `<span class="q-prog"><span class="xpbar thin gold"><i style="width:${(p / t.n) * 100}%"></i></span><span>${fmt(p)} / ${fmt(t.n)}</span></span>`}
    <span class="q-rew">${rewardTiles(Math.round(trialGold(t) * goldMult()), t.items)}</span>
    ${done ? gbtn('Claim', 'check', `data-trclaim="${t.id}"`, 'sm glow') : go ? '<i class="row-go" aria-hidden="true">›</i>' : ''}</div>`;
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
  return `<section class="win qs-trials" style="--rc:${rc(w)}">${hdr('World trials')}
    <nav class="seg tr-tabs">${tabs}</nav>
    <div class="tr-seal-row ${sealOf(w) ? 'on' : ''}">${ui('crown')}<span>${sealOf(w) ? `<b>${esc(REALMS[w].name)} Seal</b> · +5% speed and XP for its skills` : `<b>${got} / ${list.length}</b> · all six: <b>${esc(REALMS[w].name)} Seal</b> (+5% speed and XP for its skills)`}</span></div>
    <div class="tr-cards">${list.map(trialCardHTML).join('')}</div></section>`;
}
VIEWS.quests = () => `
  ${ptitle('Your journey', 'Quests')}
  <div class="qs-layout fit">
    <div class="qs-main fcol">${pathHTML()}${uix('questsBottom')}</div>
    <div class="qs-side fcol">${trialsHTML()}</div>
  </div>`;

// What waits on the Quests page is a badge on its menu entry (ui.js questsWaiting), not an Overview card.

/* ---------------------------------------------------------------- moments */
// A chapter done: a banner (no cutscene). The next step just shows in the quest box.
on('chapter', (ch) => { bannerBurst(`${ch.title} complete`, 'The chapter reward is in your Bank', ic('realm', ch.realm === 'rift' ? 'rift' : ch.realm), rc(ch.realm), 'lvup'); });
on('trialready', (t) => { toast(`Trial done: ${t.text}`, 'rare'); sideDirty = true; });
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
