'use strict';
/* ==========================================================================
   ANIME IDLE RPG — new-player guide (quiet since 2026-11-25)
   The game teaches by doing; the path (Quests) already says what to do next and why.
   - No welcome window: a new game opens on Woodcutting with one line of help in the page.
   - Hints only when you look stuck: for the first steps of the Leaf Village, a small
     bubble points at the next click if nothing has moved for a while. It never shows
     while the right thing is running, and × hides it for that step.
   - A new skill or menu explains itself once, in a card at the top of its page (no window).
   - Feature gates: advanced menus unlock one at a time (UNLOCKS in data.js).
   Loaded before ui.js; everything here runs at call time, after boot.
   ========================================================================== */

// The first steps only, by goal id. act/zone: what the step wants running. nav: how to get there. start: what to click.
const GUIDE = {
  chop10: { skill: 'woodcutting', nav: 'Open <b>Woodcutting</b> in the menu.', start: 'Press <b>Start</b> to chop Pine Logs.' },
  wc5: { skill: 'woodcutting', nav: 'Back to <b>Woodcutting</b>.', start: 'Press <b>Start</b>: it keeps chopping on its own.' },
  sword: { act: 'arts:training_kunai', nav: 'Open <b>Crafting</b> in the menu.', start: `Click <b>${ITEMS.training_kunai.name}</b>.` },
  equip_sword: { equip: true, nav: 'Open your <b>Character</b>.' },
  pills5: { act: 'arts:soldier_pill', nav: 'Open <b>Crafting</b>.', start: 'Click <b>Soldier Pill</b>.' },
  food: { food: true, nav: 'Open your <b>Character</b>.' },
  training10: { zone: 0, nav: 'Open the <b>Battlefield</b>.', start: 'Pick the <b>Training Grounds</b>.' },
  tech1: { scroll: true, nav: 'Open <b>Techniques</b>.' },
};
const GUIDE_N = Object.keys(GUIDE).length;
const STUCK_S = 15;   // seconds without input or progress before a hint shows

/* ------------------------------------------------------------ feature gates */
// Menus open through UNLOCKS (data.js), one at a time, with the objective that introduces them.
const featureOpen = (f) => isUnlocked('feature:' + f);
const VIEW_FEATURE = { 'hero:collection': 'collection', power: 'power', market: 'market', battle: 'battle' };
const featureOfView = (key) => VIEW_FEATURE[key] || null;
function lockedNote(id) {
  const u = UNLOCK_BY[id.includes(':') ? id : 'feature:' + id];
  return u && u.hint ? `Locked. ${u.hint()}` : 'Locked.';
}

/* ------------------------------------------------------------ what to point at */
const curGuide = () => (GOALS[S.goal] ? GUIDE[GOALS[S.goal].id] : null);
const guideOn = () => !S.ui.noTips && !!curGuide();
const navSels = (go) => [`.nav-row[data-nav="${go}"]`, `.nq[data-nav="${go}"]`, `.tab-btn[data-nav="${go}"]`];
function onGoalView(go) { const v = S.ui.view; return go === 'hero' ? v === 'hero' : v === go || v.startsWith(go + ':'); }
// The skill the current step wants (a small mark on its menu row).
function guideSkill() {
  if (S.ui.noTips) return null;
  const G = curGuide();
  return G && G.act ? G.act.split(':')[0] : G && G.skill ? G.skill : null;
}
// Is the step already being worked on? Then there is nothing to say.
function guideBusy(G) {
  if (G.act) { const [sk, id] = G.act.split(':'); return !!(S.action && S.action.skill === sk && S.action.id === id); }
  if (G.skill) return !!(S.action && S.action.skill === G.skill);
  if (G.zone != null) return S.combat.zone === G.zone;
  return false;
}
// The last thing the player did, or the last time the step moved.
let pokeT = performance.now(), pokeSig = '';
if (typeof addEventListener === 'function') ['pointerdown', 'keydown', 'wheel', 'touchstart'].forEach((t) => addEventListener(t, () => { pokeT = performance.now(); }, { passive: true }));
function stuck() {
  const st = goalState(), sig = st ? `${S.goal}:${st.cur}:${S.ui.view}` : '';
  if (sig !== pokeSig) { pokeSig = sig; pokeT = performance.now(); }
  return performance.now() - pokeT > STUCK_S * 1000;
}
function guideStep() {
  if (!guideOn() || $('#modal').classList.contains('show') || document.querySelector('.rv-wrap, .cx-wrap')) return null;
  const st = goalState();
  if (!st || st.done) return null;
  const G = curGuide(), id = GOALS[S.goal].id, go = st.g.go;
  if ((S.ui.hintOff || {})[id] || guideBusy(G) || !stuck()) return null;
  const nav = { sels: navSels(go), text: G.nav };
  if (G.act) {
    if (!onGoalView(go)) return nav;
    const [sk, aid] = G.act.split(':'), a = findAction(sk, aid);
    if (actState(sk, a) === 'missing') {
      const need = Object.entries(a.in).filter(([k, n]) => stock(k) < n).map(([k, n]) => `${n} ${ITEMS[k].name}`).join(', ');
      const src = Object.keys(a.in).filter((k) => stock(k) < a.in[k]).map((k) => Object.keys(SKILLS).find((sk2) => isUnlocked('skill:' + sk2) && SKILLS[sk2].actions.some((x) => x.out && x.out[k]))).find(Boolean);
      if (src) return { sels: navSels(`realm:${SKILLS[src].realm}:${src}`), text: `First you need <b>${need}</b>: <b>${SKILLS[src].name}</b> makes it.` };
    }
    return { sels: [`.fo-cta[data-act="${G.act}"]`, `[data-card="${G.act}"]`], text: G.start };
  }
  if (G.skill) {
    if (!onGoalView(go)) return nav;
    const best = SKILLS[G.skill].actions.filter((a) => actState(G.skill, a) === 'ready').pop();
    return best ? { sels: [`.fo-cta[data-act="${G.skill}:${best.id}"]`, `[data-card="${G.skill}:${best.id}"]`], text: G.start } : null;
  }
  if (G.zone != null) {
    if (S.ui.view !== 'battle') return nav;
    return { sels: [`[data-zone="${G.zone}"]`], text: G.start };
  }
  if (G.equip || G.food) {
    if (!onGoalView(go)) return nav;
    const slot = G.equip ? 'weapon' : 'food';
    if (G.food && !Object.keys(S.items).some((k) => ITEMS[k].type === 'food')) return { sels: navSels('realm:shinobi:arts'), text: 'You have no pills: brew some in <b>Crafting</b> first.' };
    if (typeof chSlot !== 'undefined' && chSlot !== slot) return { sels: [`[data-chslot="${slot}"]`], text: `Click the <b>${G.equip ? 'Weapon' : 'Food'}</b> slot.` };
    return { sels: [G.equip ? '.ch-cands [data-armeq]' : '.ch-cands [data-setfood]'], text: 'Click <b>Equip</b>.' };
  }
  if (G.scroll) {
    if (S.ui.view !== 'techniques') return nav;
    return { sels: ['[data-readscroll]'], text: 'Click <b>Read</b>: the scroll teaches you a technique.' };
  }
  return null;
}

/* ------------------------------------------------------------ the hint bubble */
function visibleEl(el) {
  const r = el.getBoundingClientRect();
  return r.width > 0 && r.height > 0 && r.right > 0 && r.left < innerWidth && getComputedStyle(el).visibility !== 'hidden';
}
const inView = (el) => { const r = el.getBoundingClientRect(); return r.bottom > 60 && r.top < innerHeight - 80; };
function resolveTarget(sels) {
  // on screen first (a phone shows the panel's button before the list), then anywhere visible
  for (const s of sels) for (const el of $$(s)) if (visibleEl(el) && inView(el)) return { el };
  for (const s of sels) for (const el of $$(s)) if (visibleEl(el)) return { el };
  // The target lives in the closed mobile drawer: point at the menu button first.
  const inRail = sels.some((s) => $$(s).some((el) => el.closest('#rail')));
  if (inRail && !document.body.classList.contains('menu-open')) {
    const m = $$('[data-menu]').find(visibleEl);
    if (m) return { el: m, menu: true };
  }
  return null;
}
let coachEl = null, coachHTML = '', coachLast = 0;
function clearCoach() {
  if (coachEl) coachEl.classList.remove('coach-soft');
  coachEl = null;
  const box = $('#coach');
  if (box) box.classList.remove('show');
}
function updateCoach(force) {
  const now = performance.now();
  if (!force && now - coachLast < 250) return;
  coachLast = now;
  const step = guideStep();
  if (!step) return clearCoach();
  const t = resolveTarget(step.sels);
  if (!t) return clearCoach();
  const el = t.el, text = t.menu ? `Open the <b>menu</b>, then: ${step.text}` : step.text;
  if (el !== coachEl || !el.isConnected) {
    if (coachEl) coachEl.classList.remove('coach-soft');
    el.classList.add('coach-soft');
    coachEl = el;
  }
  const box = $('#coach');
  const html = `<div class="cm-text">${text}</div><button class="cm-x" data-hintoff title="Hide this hint">×</button><button class="cm-skip" data-skiptips>No hints</button><i class="cm-arrow"></i>`;
  if (html !== coachHTML) { box.innerHTML = html; coachHTML = html; }
  box.classList.add('show', 'quiet');
  // place the bubble next to the target, inside the viewport
  const r = el.getBoundingClientRect(), bw = box.offsetWidth, bh = box.offsetHeight, m = 12;
  let side;
  if (r.right + bw + m < innerWidth && r.left < 280) side = 'right';
  else if (r.bottom + bh + m < innerHeight - 70) side = 'below';
  else side = 'above';
  let x, y;
  if (side === 'right') { x = r.right + m; y = r.top + r.height / 2 - bh / 2; }
  else { x = r.left + r.width / 2 - bw / 2; y = side === 'below' ? r.bottom + m : r.top - bh - m; }
  x = Math.max(8, Math.min(innerWidth - bw - 8, x));
  y = Math.max(8, Math.min(innerHeight - bh - 8, y));
  box.dataset.side = side;
  box.style.transform = `translate(${Math.round(x)}px, ${Math.round(y)}px)`;
  const arrow = $('.cm-arrow', box);
  if (side === 'right') { arrow.style.left = '-6px'; arrow.style.top = Math.max(10, Math.min(bh - 20, r.top + r.height / 2 - y - 6)) + 'px'; }
  else { arrow.style.top = side === 'below' ? '-6px' : bh - 6 + 'px'; arrow.style.left = Math.max(12, Math.min(bw - 24, r.left + r.width / 2 - x - 6)) + 'px'; }
}
if (typeof document !== 'undefined') document.addEventListener('click', (ev) => {
  if (!ev.target.closest('[data-hintoff]')) return;
  const g = GOALS[S.goal];
  if (g) { S.ui.hintOff = S.ui.hintOff || {}; S.ui.hintOff[g.id] = 1; }
  clearCoach();
});

/* ------------------------------------------------------------ the first minute */
const isFreshSave = () => !S.ui.welcomed && S.goal === 0 && S.stats.actions === 0 && S.stats.kills === 0;
// No window: the game opens where it starts, Woodcutting, and the page says what to do (firstHintHTML, ui.js realmTop).
function showWelcome() {
  S.ui.welcomed = 1;
  setView('realm:shinobi:woodcutting');
}
function firstHintHTML(realm, skill) {
  if (skill !== 'woodcutting' || (S.stats.actions || 0) > 0 || S.action) return '';
  return `<div class="first-hint"><span class="fh-ic">${ic('skill', 'woodcutting')}</span><p>Press <b>Start</b> to chop your first Pine Logs.</p></div>`;
}

/* ------------------------------------------------------------ first visits */
// A skill or menu explains itself once, in a card at the top of its page.
const INTRO = {
  'skill:arts': { icon: () => ic('skill', 'arts'), kicker: 'New skill', title: 'Crafting',
    text: '',
    points: [[() => ic('item', 'pine_log'), `Pine Logs → ${ITEMS.training_kunai.name}`, 'Your first weapon.'],
             [() => ic('item', 'healing_leaf'), 'Healing Leaves → Soldier Pills', 'Pills heal you in battle.'],
             [() => ui('lock'), 'Brew 5 Soldier Pills', 'Then the Battlefield opens.']] },
  'skill:cooking': { icon: () => ic('skill', 'cooking'), kicker: 'New skill', title: 'Cooking',
    text: 'Dishes heal far more than pills.',
    points: [[() => ic('item', 'minnow'), '1 Minnow → 1 Grilled Minnow', ''],
             [() => ui('hp'), 'Food heals', 'Equip a dish as your battle food.'],
             [() => ui('lock'), 'Cooking level 10', 'Opens Voyaging.']] },
  'feature:battle': { icon: () => ui('battle'), kicker: 'New menu', title: 'The Battlefield',
    text: 'Fights run on their own, offline too.',
    points: [[() => ui('food'), 'Equip your pills', 'Character → Food slot. You eat when your HP drops low.'],
             [() => ui('map'), 'Ten wins open the next stage', 'Every world ends with a guardian.'],
             [() => ui('gold'), 'Loot', 'Gold, gear, scrolls and the materials for new worlds.']] },
  'feature:techniques': { icon: () => ui('technique'), kicker: 'New menu', title: 'Techniques',
    text: 'Foes drop scrolls. Each one teaches a technique, or levels up one you know.',
    points: [[() => ui('technique'), 'Rarer scroll, rarer technique', ''],
             [() => ui('plus'), 'More slots as you level', 'Actives fire in order; passives are always on.']] },
  'feature:dungeons': { icon: () => ui('map'), kicker: 'New on the Battlefield', title: 'Dungeons',
    text: 'Five rooms in a row, no rest. One key per run.',
    points: [[() => ui('food'), 'Bring food', 'Your HP does not come back between rooms.'],
             [() => ui('gold'), 'A set per dungeon', 'Every clear gives a sigil of its set.']] },
};
function introCardHTML(id) {
  const I = INTRO[id];
  if (!I || !isUnlocked(id) || (S.ui.introSeen || {})[id]) return '';
  return `<section class="intro-card"><span class="ic-ic">${I.icon()}</span><div class="ic-body"><small>${I.kicker}</small><b>${I.title}</b>${I.text ? `<p>${I.text}</p>` : ''}
    ${I.points ? `<ul>${I.points.map(([icn, b, t]) => `<li><i>${icn()}</i><span><b>${b}${t ? '.' : ''}</b> ${t}</span></li>`).join('')}</ul>` : ''}</div>
    <button class="ic-ok" data-introok="${id}">Got it</button></section>`;
}
if (typeof document !== 'undefined') document.addEventListener('click', (ev) => {
  const t = ev.target.closest('[data-introok]');
  if (!t) return;
  S.ui.introSeen = S.ui.introSeen || {};
  S.ui.introSeen[t.dataset.introok] = 1;
  dirty = true;
});
