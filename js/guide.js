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
  // Leaf Village: wood → first weapon → pills → first fights → techniques
  { skill: 'woodcutting', nav: 'Open <b>Woodcutting</b>. Everything in the village starts with wood.', start: 'Click <b>Pine Log</b> to start chopping.', run: 'Woodcutting repeats on its own, even while the game is closed. No need to watch it: come back later and the logs are waiting.' },
  { skill: 'woodcutting', nav: 'Back to <b>Woodcutting</b>.', start: 'Keep chopping <b>Pine Logs</b>.', run: 'The undergrowth also gives <b>Healing Leaves</b>. Higher levels unlock new trees, and each tree has its own <b>Mastery</b>. Reach level 5 and the village carpenter will teach you to craft.' },
  { act: 'arts:training_kunai', nav: '<b>Crafting</b> is now open. Open it.', start: 'Click <b>Wooden Sword</b>. It uses 5 Pine Logs.', run: 'Your very first weapon is on the bench. Crafting turns wood, herbs and battle spoils into gear, pills and technique scrolls.' },
  { equip: true, nav: 'Your sword is ready: open your <b>Bank</b>.' },
  { act: 'arts:soldier_pill', nav: 'Back to <b>Crafting</b>.', start: 'Click <b>Soldier Pill</b>. Each one uses 2 Healing Leaves from your woodcutting.', run: 'Brew 5 pills and the instructors will let you fight. Out of leaves? Chop more Pine Logs, then come back.' },
  { food: true, nav: 'Before you fight, pack your pills: open your <b>Bank</b>.' },
  { zone: 0, nav: 'Pills packed. Open the <b>Battlefield</b>.', start: 'Pick the <b>Training Grounds</b>. It is an Easy stage.', run: 'Combat is automatic. When your HP drops low you eat a pill on your own. Foes drop gold, chakra crystals and, now and then, a <b>technique scroll</b>.' },
  { zone: 0, nav: 'Back to the <b>Battlefield</b>.', start: 'Keep fighting at the <b>Training Grounds</b>.', run: 'A scroll is read at once and teaches a technique. It goes into a slot on its own and fires in battle when ready.' },
  { zone: 0, nav: 'Back to the <b>Battlefield</b>.', start: 'Fight at the <b>Training Grounds</b>.', run: 'Every foe gives Character XP. Each level raises your five stats: Attack, Defense, Vitality, Speed and Luck.' },
  { market: true, nav: 'The <b>Market</b> is open. Spend your gold there.' },
  { zone: 1, nav: 'Back to the <b>Battlefield</b>.', start: 'Fight in the <b>Misty Forest</b>.', run: 'Every world ends with a guardian. Beat the Ashen Fox to reach a new world.' },
  { techup: true, nav: 'Open <b>Techniques</b>.' },
  { zone: 1, nav: 'Open the <b>Battlefield</b>.', start: 'Fight in the <b>Misty Forest</b>.', run: 'At Character level 20 your chakra runs deep enough to train it as a discipline.' },
  { power: true, nav: '<b>Energy Disciplines</b> are open. Open them.' },
  { zone: 2, nav: 'Open the <b>Battlefield</b>.', start: 'Fight in <b>Fang Ravine</b>.', run: 'Some foes drop a <b>schematic</b>: it teaches a recipe for an iconic weapon forever.' },
  { zone: 3, nav: 'Time for the guardian: open the <b>Battlefield</b>.', start: 'Challenge the <b>Ashen Fox Beast</b>. Bring plenty of pills.', run: 'Its relic, the Ashen Fox Tail, is part of the gate offering.' },
  { gate: true, nav: 'Open the <b>Overview</b>: the gate to the next world is there.' },
  // Orange Town
  { skill: 'fishing', nav: 'Welcome to Orange Town. Open <b>Fishing</b>.', start: 'Click <b>Minnow</b> to cast your line.', run: 'A new world, a new food: fish. Catch 10 Minnows.' },
  { skill: 'fishing', nav: 'Back to <b>Fishing</b>.', start: 'Keep fishing.', run: 'Reach Fishing level 5 and the ship cook will want to meet you.' },
  { act: 'cooking:grilled_minnow', nav: '<b>Cooking</b> is now open. Open it.', start: 'Click <b>Grilled Minnow</b>. Each one uses 1 Minnow.', run: 'Cooked fish heals in battle, like your pills, and feeds the crew on voyages.' },
  { skill: 'cooking', nav: 'Back to <b>Cooking</b>.', start: 'Cook whatever you can.', run: 'At Cooking level 10, a captain will take you on voyages. The spice rack opens at level 8.' },
  { spice: true, nav: 'Open <b>Cooking</b>: the spice rack is on the stove.', pick: 'Pick a seasoning in the <b>spice rack</b>. Each dish you cook uses one.', start: 'Now cook any dish: it comes out seasoned.', run: 'Seasoned dishes give a small buff when you eat them in battle. Out of seasoning? Dishes simply come out plain.' },
  { exped: true, nav: '<b>Voyaging</b> is open. Ships bring back gold, spices, chests and relics.', start: 'Click <b>Coastal Run</b> to send a ship. The hull takes Pine Logs; a Grilled Minnow per 10 minutes is optional and brings back more.', run: 'Your ship sails on its own while you fish, cook or fight, even offline. It comes back with its loot and sets out again.' },
  { zone: 4, nav: 'Open the <b>Battlefield</b>.', start: 'Fight at <b>Rookie Shoals</b>.', run: 'The sea is much tougher than the forest. Bring your best food.' },
  { skill: 'cooking', nav: 'Back to <b>Cooking</b>.', start: 'Cook any dish.', run: 'Now and then a dish comes out <b>Perfect</b>: it heals 50% more. Your first Perfect of each recipe goes in the Perfect Log.' },
  { zone: 5, nav: 'Back to the <b>Battlefield</b>.', start: 'Fight in <b>Merfolk Reef</b>.', run: 'Beat the Admiral to reach the next world.' },
  { skill: 'fishing', nav: 'Open <b>Fishing</b>.', start: 'Fish anything. Every catch has a small chance to be <b>Shiny</b>.', run: 'Shiny fish glitter on the line. Mastery of a fish raises its odds, and a full Shiny Log gives big bonuses.' },
  { zone: 7, nav: 'Time for the guardian: open the <b>Battlefield</b>.', start: 'Challenge the <b>Admiral\'s Flagship</b>. Bring plenty of food.', run: 'Its relic, the Heart of the Tide, is part of the gate offering.' },
  { gate: true, nav: 'Open the <b>Overview</b>: the gate to the next world is there.' },
];

/* ------------------------------------------------------------ feature gates */
// Menus open through UNLOCKS (data.js), one at a time, with the objective that introduces them.
const featureOpen = (f) => isUnlocked('feature:' + f);
const VIEW_FEATURE = { 'hero:collection': 'collection', 'hero:avatar': 'avatar', power: 'power', market: 'market', battle: 'battle' };
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
      const need = Object.entries(a.in).filter(([k, n]) => stock(k) < n).map(([k, n]) => `${n} ${ITEMS[k].name}`).join(', ');
      const src = Object.keys(a.in).filter((k) => stock(k) < a.in[k]).map((k) => Object.keys(SKILLS).find((sk2) => isUnlocked('skill:' + sk2) && SKILLS[sk2].actions.some((x) => x.out && x.out[k]))).find(Boolean);
      if (src) return { sels: navSels(`realm:${SKILLS[src].realm}:${src}`), text: `You need <b>${need}</b> first. Open <b>${SKILLS[src].name}</b> and gather some, then come back.` };
      return { sels: [`[data-card="${G.act}"]`], text: `You need <b>${need}</b> first. Look at the item's sources in the Bank, or check the objective list.` };
    }
    return { sels: [`[data-card="${G.act}"]`], text: G.start };
  }
  if (G.skill) {
    if (S.action && S.action.skill === G.skill) return run(G.run);
    if (!onGoalView(go)) return nav;
    const best = SKILLS[G.skill].actions.filter((a) => actState(G.skill, a) === 'ready').pop();
    if (best) return { sels: [`[data-card="${G.skill}:${best.id}"]`], text: G.start };
    if (G.skill === 'cooking') return { sels: navSels('realm:seas:fishing'), text: 'Out of fish! Open <b>Fishing</b> and catch more Minnows, then come back to cook.' };
    if (G.skill === 'arts') return { sels: navSels('realm:shinobi:woodcutting'), text: 'Out of materials! Chop more wood, then come back.' };
    return null;
  }
  if (G.zone != null) {
    if (S.combat.zone === G.zone) return run(G.run);
    if (S.ui.view !== 'battle') return nav;
    return { sels: [`[data-zone="${G.zone}"]`], text: G.start };
  }
  if (G.equip) {
    if (S.ui.view !== 'hero') return nav;
    if (selItem && ITEMS[selItem] && ITEMS[selItem].type === 'equip' && count(selItem)) return { sels: ['[data-equip]'], text: 'Click <b>Equip</b>. You fight with it from now on.' };
    if (!['all', 'equip'].includes(S.ui.bank)) return { sels: ['[data-bankf="equip"]'], text: 'Open the <b>Gear</b> tab.' };
    const id = Object.keys(S.items).find((k) => ITEMS[k].slot === 'weapon');
    return id ? { sels: [`.bag-grid [data-sel="${id}"]`], text: `Click your <b>${ITEMS[id].name}</b> to see what it does.` } : null;
  }
  if (G.exped) {
    if (S.exped.ships.length) return { sels: ['.harbour .ships', '#navquest'], info: true, text: `${G.run}<span class="cm-prog">${fmt(st.cur)} / ${fmt(st.g.n)}</span>` };
    if (!onGoalView(go)) return nav;
    return { sels: ['[data-exped="coastal"]'], text: G.start };
  }
  if (G.techup) {
    if (S.ui.view !== 'techniques') return nav;
    if ($$('[data-techup]:not([disabled])').length) return { sels: ['[data-techup]:not([disabled])'], text: 'Spend your fragments: click <b>Level</b>. Levels 5 and 10 change how a technique works.' };
    return { sels: ['.tc-frag'], info: true, text: 'A scroll of a technique you already know gives <b>fragments</b>. Keep fighting, then come back to level it up.' };
  }
  if (G.power) {
    if (S.ui.view !== 'power') return nav;
    return { sels: ['[data-alloc="chakra:1"]'], text: 'Click <b>+</b> to put energy into Chakra. Disciplines level up forever, even offline.' };
  }
  if (G.food) {
    if (S.ui.view !== 'hero') return nav;
    const id = Object.keys(S.items).find((k) => ITEMS[k].type === 'food');
    if (!id) return { sels: navSels('realm:shinobi:arts'), text: 'You have no pills left. Brew some in Crafting first.' };
    if (selItem === id) return { sels: ['[data-setfood]'], text: 'Click <b>Equip as battle food</b>. In battle you eat it on your own when your HP gets low.' };
    if (!['all', 'food'].includes(S.ui.bank)) return { sels: ['[data-bankf="food"]'], text: 'Open the <b>Food</b> tab.' };
    return { sels: [`.bag-grid [data-sel="${id}"]`], text: `Click your <b>${ITEMS[id].name}</b>.` };
  }
  if (G.spice) {
    if (S.action && S.action.skill === 'cooking' && S.kitchen.spice) return run(G.run);
    if (!onGoalView(go)) return nav;
    if (!S.kitchen.spice) return { sels: ['.spice-rack [data-spice]:not(.locked)'], text: G.pick };
    const best = SKILLS.cooking.actions.filter((a) => actState('cooking', a) === 'ready').pop();
    return best ? { sels: [`[data-card="cooking:${best.id}"]`], text: G.start } : null;
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
  const step = (icon, name, txt) => `<li><i>${icon}</i><span><b>${name}</b>${txt}</span></li>`;
  openModal(`<div class="welcome">
    <div class="wl-ic">${ui('hero')}</div>
    <small>Tri-Realm Idle</small>
    <h2>Welcome, Wanderer</h2>
    <p>Six worlds have collided. You wake up at the edge of the <b>Leaf Village</b>, a village hidden in the forest, with nothing but a hatchet. Each world is sealed by a guardian.</p>
    <div class="wl-goal"><small>Your goal</small><b>Grow strong enough to beat every guardian and cross all six worlds.</b></div>
    <small class="wl-sub">How you get stronger</small>
    <ol class="wl-loop">
      ${step(ic('skill', 'woodcutting'), 'Chop', 'Fell trees. Wood is how everything starts.')}
      ${step(ic('skill', 'arts'), 'Craft', 'Carve your first weapon, then brew pills that heal you.')}
      ${step(ui('battle'), 'Fight', 'Equip your weapon and pills and fight. Foes drop gear, gold and technique scrolls.')}
      ${step(ui('technique'), 'Build', 'Equip the techniques you find and level them up. Beat the guardian to open the next world.')}
    </ol>
    <ul class="wl-points">
      <li><i>${ui('time')}</i><span><b>It plays itself.</b> An activity repeats on its own, even while the game is closed (up to 12 hours).</span></li>
      <li><i>${ui('quest')}</i><span><b>Follow the Objective</b> at the top of the menu. New skills and menus open one at a time.</span></li>
    </ul>
    <div class="wl-cta">${gbtn('Pick up the hatchet', 'play', 'data-welcome="go"')}${gbtn('Look around first', '', 'data-welcome="skip"', 'dark')}</div>
  </div>`, null, true);
}
function welcomeChoice(go) {
  S.ui.welcomed = 1;
  $('#modal').classList.remove('show', 'nofoot');
  if (go) { setView('realm:shinobi:woodcutting'); startAction('woodcutting', 'pine_log'); }
  else setView('home');
}

/* ------------------------------------------------------------ first-time scenes */
// The two early unlocks that teach the core loop get a short scene instead of a banner.
const INTRO = {
  'skill:arts': { icon: () => ic('skill', 'arts'), kicker: 'New skill', title: 'Crafting',
    text: 'The village carpenter looks at your pile of logs. "Good wood. Let me show you how a shinobi makes their own tools."',
    points: [[() => ic('item', 'pine_log'), '5 Pine Logs → 1 Wooden Sword', 'Your very first weapon.'],
             [() => ic('item', 'healing_leaf'), 'Healing Leaves → Soldier Pills', 'The undergrowth you clear while chopping becomes pills that heal you.'],
             [() => ui('lock'), 'Brew 5 Soldier Pills', 'Then the instructors will let you fight.']],
    go: 'realm:shinobi:arts', btn: 'Start carving' },
  'skill:cooking': { icon: () => ic('skill', 'cooking'), kicker: 'New skill', title: 'Cooking',
    text: 'A ship cook eyes your bucket. "Raw fish will not keep you alive out there. Let me show you."',
    points: [[() => ic('item', 'minnow'), '1 Minnow → 1 Grilled Minnow', 'Each dish uses fish you caught.'],
             [() => ui('hp'), 'Food heals', 'Cooked food restores HP in battle, like your pills.'],
             [() => ui('lock'), 'Reach Cooking level 10', 'Then a captain will take you on voyages.']],
    go: 'realm:seas:cooking', btn: 'Start cooking' },
  'feature:battle': { icon: () => ui('battle'), kicker: 'New menu', title: 'The Battlefield',
    text: 'Armed and with pills in your pouch, the instructors let you train with real opponents. Combat runs on its own: you only prepare.',
    points: [[() => ui('food'), 'Equip your pills', 'Bank → your Soldier Pills → Equip as battle food.'],
             [() => ui('hp'), 'Auto-eat', 'You eat when your HP drops low. Nothing left means a lost fight.'],
             [() => ui('gold'), 'Loot', 'Foes drop gold, gear and the materials for new worlds.']],
    go: 'hero', btn: 'Equip my pills' },
};
function showIntro(id) {
  const I = INTRO[id];
  openModal(`<div class="welcome intro">
    <div class="wl-ic">${I.icon()}</div>
    <small>${I.kicker}</small>
    <h2>${I.title}</h2>
    <p>${I.text}</p>
    <ul class="wl-points">${I.points.map(([icn, b, t]) => `<li><i>${icn()}</i><span><b>${b}.</b> ${t}</span></li>`).join('')}</ul>
    <div class="wl-cta">${gbtn(I.btn, 'play', `data-realmgo="${I.go}"`)}</div>
  </div>`, null, true);
}
