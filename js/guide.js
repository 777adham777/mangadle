'use strict';
/* ==========================================================================
   TRI-REALM IDLE — new-player guide
   - welcome screen on a brand-new save
   - coach bubble that points at the exact thing to click for the first
     objectives (sidebar entry → action card → Claim), and explains what is
     happening while an activity runs
   - feature gates: advanced menus unlock with the objective that introduces them
   Loaded before ui.js; everything here runs at call time, after boot.
   ========================================================================== */

// One entry per early objective (same index as GOALS).
// act/zone: what the objective wants running. nav: how to get there. start: what to click. run: tip while it runs.
const GUIDE = [
  { skill: 'fishing', nav: 'Open <b>Fishing</b>. Fish are the start of everything here.', start: 'Click <b>Minnow</b> to start fishing.', run: 'Fishing repeats on its own, even while the game is closed. At level 5, the ship cook will want your catch.' },
  { act: 'cooking:grilled_minnow', nav: '<b>Cooking</b> is now open. Open it.', start: 'Click <b>Grilled Minnow</b>. Each one uses 1 Minnow.', run: 'Food heals you in battle. Cook 5 and the Battlefield opens.' },
  { equip: true, nav: 'The <b>Battlefield</b> is open, but arm yourself first: open your <b>Bank</b> and equip the Rusty Cutlass.' },
  { zone: 0, nav: 'Cutlass in hand, open the <b>Battlefield</b>.', start: 'Pick <b>Rookie Shoals</b>. It is an Easy stage.', run: 'Combat is automatic. You eat on your own when your HP gets low: fish → cook → fight is the core loop.' },
  { skill: 'cooking', nav: 'Back to <b>Cooking</b>.', start: 'Cook whatever you can.', run: 'At Cooking level 10, a captain will take you on voyages.' },
  { act: 'voyaging:coastal', nav: '<b>Voyaging</b> is open. Ships bring back gold, chests and relics.', start: 'Click <b>Coastal Run</b>. Each voyage uses 2 Grilled Minnows as supplies.', run: 'Voyages are slow but pay well.' },
  { market: true, nav: 'The <b>Market</b> is open. Spend your gold there.' },
  { zone: 1, nav: 'Back to the <b>Battlefield</b>.', start: 'Fight in <b>Merfolk Reef</b>.', run: 'Every world ends with a guardian. Beat the Admiral to reach a new world.' },
  { zone: 3, nav: 'Time for the guardian: open the <b>Battlefield</b>.', start: 'Challenge the <b>Admiral\'s Flagship</b>. Bring plenty of food.', run: 'Its relic, the Heart of the Tide, is part of the gate offering.' },
  { gate: true, nav: 'Open the <b>Overview</b>: the gate to the next world is there.' },
];

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
const guideOn = () => !S.ui.noTips && S.goal < GUIDE.length;
const navSels = (go) => [`.nav-row[data-nav="${go}"]`, `.nq[data-nav="${go}"]`, `.tab-btn[data-nav="${go}"]`];
function onGoalView(go) { const v = S.ui.view; return go === 'hero' ? v === 'hero' : v === go || v.startsWith(go + ':'); }
// The skill the current objective wants (used to flag it in the sidebar).
function guideSkill() {
  if (!guideOn()) return null;
  const G = GUIDE[S.goal];
  return G && G.act ? G.act.split(':')[0] : G && G.skill ? G.skill : null;
}
function guideStep() {
  if (!guideOn() || $('#modal').classList.contains('show')) return null;
  const st = goalState();
  if (!st) return null;
  if (st.done) return { sels: ['#navquest [data-claim]', '.quest-win [data-claim]', '#nowbar [data-claim]'], text: 'Objective complete! <b>Claim</b> your reward.' };
  const G = GUIDE[S.goal], go = st.g.go;
  const nav = { sels: navSels(go), text: G.nav };
  const run = (txt) => ({ sels: ['#nowbar .nb'], info: true, text: `${txt}<span class="cm-prog">${fmt(st.cur)} / ${fmt(st.g.n)}</span>` });
  if (G.act) {
    const [sk, id] = G.act.split(':');
    if (S.action && S.action.skill === sk && S.action.id === id) return run(G.run);
    if (!onGoalView(go)) return nav;
    const a = findAction(sk, id);
    if (actState(sk, a) === 'missing') {
      const need = Object.entries(a.in).filter(([k, n]) => count(k) < n).map(([k, n]) => `${n} ${ITEMS[k].name}`).join(', ');
      return { sels: [`[data-card="${G.act}"]`], text: `You need <b>${need}</b> first. Look at the item's sources in the Bank, or check the objective list.` };
    }
    return { sels: [`[data-card="${G.act}"]`], text: G.start };
  }
  if (G.skill) {
    if (S.action && S.action.skill === G.skill) return run(G.run);
    if (!onGoalView(go)) return nav;
    const best = SKILLS[G.skill].actions.filter((a) => actState(G.skill, a) === 'ready').pop();
    return best ? { sels: [`[data-card="${G.skill}:${best.id}"]`], text: G.start } : null;
  }
  if (G.zone != null) {
    if (S.combat.zone === G.zone) return run(G.run);
    if (S.ui.view !== 'battle') return nav;
    return { sels: [`[data-zone="${G.zone}"]`], text: G.start };
  }
  if (G.equip) {
    if (S.ui.view !== 'hero') return nav;
    if (selItem && ITEMS[selItem] && ITEMS[selItem].type === 'equip' && count(selItem)) return { sels: ['[data-equip]'], text: 'Click <b>Equip</b>. Your damage goes up right away.' };
    if (!['all', 'equip'].includes(S.ui.bank)) return { sels: ['[data-bankf="equip"]'], text: 'Open the <b>Gear</b> tab.' };
    const id = Object.keys(S.items).find((k) => ITEMS[k].slot === 'weapon');
    return id ? { sels: [`.bag-grid [data-sel="${id}"]`], text: `Click your <b>${ITEMS[id].name}</b> to see what it does.` } : null;
  }
  if (G.power) {
    if (S.ui.view !== 'power') return nav;
    return { sels: ['[data-alloc="chakra:1"]'], text: 'Click <b>+</b> to put energy into a training. Trainings level up forever, even offline.' };
  }
  if (G.gate) {
    if (S.ui.view !== 'home') return nav;
    return { sels: ['.gate [data-gate]', '.gate'], text: 'Gather the offering, then click <b>Open the gate</b>. Hover a tile to see where it comes from.' };
  }
  if (G.market) {
    if (S.ui.view !== 'market') return nav;
    return { sels: ['[data-buy]:not([disabled])'], text: 'Buy any upgrade. <b>Tool</b> upgrades make a whole world faster.' };
  }
  return null;
}

/* ------------------------------------------------------------ coach bubble */
function visibleEl(el) {
  const r = el.getBoundingClientRect();
  return r.width > 0 && r.height > 0 && r.right > 0 && r.left < innerWidth && getComputedStyle(el).visibility !== 'hidden';
}
function resolveTarget(sels) {
  for (const s of sels) for (const el of $$(s)) if (visibleEl(el)) return { el };
  // The target lives in the closed mobile drawer: point at the menu button first.
  const inRail = sels.some((s) => $$(s).some((el) => el.closest('#rail')));
  if (inRail && !document.body.classList.contains('menu-open')) {
    const m = $$('[data-menu]').find(visibleEl);
    if (m) return { el: m, menu: true };
  }
  return null;
}
let coachEl = null, coachHTML = '', coachOk = {}, coachLast = 0;
function clearCoach() {
  if (coachEl) coachEl.classList.remove('coach-ring', 'coach-soft');
  coachEl = null;
  const box = $('#coach');
  if (box) box.classList.remove('show');
}
function updateCoach(force) {
  const now = performance.now();
  if (!force && now - coachLast < 120) return;
  coachLast = now;
  const step = guideStep();
  if (!step || (step.info && coachOk[S.goal])) return clearCoach();
  const t = resolveTarget(step.sels);
  if (!t) return clearCoach();
  const el = t.el, info = step.info && !t.menu;
  const text = t.menu ? `Open the <b>menu</b>. Then: ${step.text}` : step.text;
  if (el !== coachEl || !el.isConnected) {
    if (coachEl) coachEl.classList.remove('coach-ring', 'coach-soft');
    el.classList.add(info ? 'coach-soft' : 'coach-ring');
    if (!info && el.closest('#main')) el.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    coachEl = el;
  }
  const box = $('#coach');
  const html = `<div class="cm-text">${text}</div><div class="cm-foot">${info ? '<button class="cm-ok" data-coachok>Got it</button>' : ''}<button class="cm-skip" data-skiptips>Skip tutorial</button></div><i class="cm-arrow"></i>`;
  if (html !== coachHTML) { box.innerHTML = html; coachHTML = html; }
  box.classList.add('show');
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

/* ------------------------------------------------------------ welcome */
const isFreshSave = () => !S.ui.welcomed && S.goal === 0 && S.stats.actions === 0 && S.stats.kills === 0;
function showWelcome() {
  openModal(`<div class="welcome">
    <div class="wl-ic">${ui('hero')}</div>
    <small>Tri-Realm Idle</small>
    <h2>Welcome, Wanderer</h2>
    <p>Worlds have collided: the endless sea, ninja lands, the afterlife, and more beyond. You wash ashore in the Endless Blue with a fishing line and a rusty cutlass. Catch fish, learn to cook them, then fight with a full bag. Each world is sealed behind a guardian: beat it to cross over.</p>
    <ul class="wl-points">
      <li><i>${ui('play')}</i><span><b>Pick an activity.</b> It repeats on its own and earns items and XP.</span></li>
      <li><i>${ui('time')}</i><span><b>Progress never stops.</b> It keeps going while the game is closed, up to 12 hours.</span></li>
      <li><i>${ui('quest')}</i><span><b>Follow the Objective.</b> Each one pays gold and shows you what to do next.</span></li>
      <li><i>${ui('lock')}</i><span><b>Unlock as you go.</b> New skills, menus and worlds open one at a time.</span></li>
    </ul>
    <div class="wl-cta">${gbtn('Start fishing', 'play', 'data-welcome="go"')}${gbtn('Look around first', '', 'data-welcome="skip"', 'dark')}</div>
  </div>`, null, true);
}
function welcomeChoice(go) {
  S.ui.welcomed = 1;
  $('#modal').classList.remove('show', 'nofoot');
  if (go) { setView('realm:seas:fishing'); startAction('fishing', 'minnow'); }
  else setView('home');
}
