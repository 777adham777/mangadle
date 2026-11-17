'use strict';
/* ==========================================================================
   TRI-REALM IDLE — UI layer ("Ink & Panel")
   - render(): structural rebuild of rail / main / side, only when `dirty`
   - update(): cheap per-frame sync of bars, numbers and card states
   - BUS listeners: juicy feedback (floats, shakes, bursts, stamps)
   ========================================================================== */

const $ = (sel, root) => (root || document).querySelector(sel);
const $$ = (sel, root) => Array.from((root || document).querySelectorAll(sel));
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const realmColor = (r) => (REALMS[r] ? REALMS[r].color : 'var(--hot)');
const skillsOf = (realm) => Object.keys(SKILLS).filter((k) => SKILLS[k].realm === realm);
const totalLevel = () => Object.keys(SKILLS).reduce((a, k) => a + skillLv(k), 0);
const sk = (s) => `<span>${s}</span>`;      // un-skew wrapper for skewed buttons

let selItem = null;
const seenItems = new Set();

/* =============================================================== routing */
const RAIL = [
  ['home', '🏯', 'Home'],
  ['realm:shinobi', '🍃', 'Shinobi'],
  ['realm:soul', '🌙', 'Soul'],
  ['realm:seas', '⚓', 'Seas'],
  ['battle', '⚔️', 'Battle'],
  ['hero', '🎒', 'Hero'],
  ['power', '🔋', 'Power'],
  ['market', '🏪', 'Market'],
];
function normalizeView() {
  const legacy = { overview: 'home', combat: 'battle', bank: 'hero', shop: 'market', rebirth: 'power' };
  let v = legacy[S.ui.view] || S.ui.view || 'home';
  if (v.startsWith('skill:')) {
    const s = v.split(':')[1];
    v = !SKILLS[s] ? 'home' : SKILLS[s].realm === 'combat' ? 'battle' : `realm:${SKILLS[s].realm}:${s}`;
  }
  const [name, realm, skill] = v.split(':');
  if (name === 'realm') {
    if (!REALMS[realm] || REALMS[realm].hidden) v = 'home';
    else if (!skill || !SKILLS[skill] || SKILLS[skill].realm !== realm) v = `realm:${realm}:${S.ui.tab[realm] || skillsOf(realm)[0]}`;
  }
  if (!VIEWS[v.split(':')[0]]) v = 'home';
  S.ui.view = v;
}
function setView(v) {
  S.ui.view = v;
  normalizeView();
  const [name, realm, skill] = S.ui.view.split(':');
  if (name === 'realm') S.ui.tab[realm] = skill;
  $('#main').scrollTop = 0;
  viewChanged = true;
  dirty = true;
}
let viewChanged = true;

/* =============================================================== rail */
function railBusy(key) {
  if (key === 'battle') return S.combat.zone != null;
  if (key.startsWith('realm:') && S.action) return SKILLS[S.action.skill].realm === key.split(':')[1];
  if (key === 'power') return energyUsed() > 0;
  return false;
}
function renderRail() {
  $('#rail').innerHTML = RAIL.map(([key, icon, label]) => {
    const on = S.ui.view === key || S.ui.view.startsWith(key + ':');
    const color = key.startsWith('realm:') ? realmColor(key.split(':')[1]) : 'var(--hot)';
    return `<button class="rail-btn ${on ? 'on' : ''}" data-nav="${key}" style="--realm:${color}" title="${label}">
      ${railBusy(key) ? '<i class="busy"></i>' : ''}<span class="ri">${icon}</span><span class="rl">${label}</span></button>`;
  }).join('');
}

/* =============================================================== shared bits */
function xpInfo(id) {
  const xp = S.skills[id].xp, L = levelOf(xp);
  const lo = XP_TABLE[L], hi = XP_TABLE[L + 1];
  return { L, p: L >= MAX_LEVEL ? 1 : (xp - lo) / (hi - lo), xp, need: L >= MAX_LEVEL ? 0 : hi - xp };
}
const xpText = (b) => (b.need ? `${fmt(b.xp)} XP · ${fmt(b.need)} to next level` : 'MAX LEVEL');
function chip(id, n) { return `<span class="chip" title="${esc(ITEMS[id].name)}">${ITEMS[id].icon} ${fmt(n)}</span>`; }
function needChip(id, n) {
  return `<span class="chip" data-need="${id}" data-n="${n}" title="${esc(ITEMS[id].name)}">${ITEMS[id].icon} ${fmt(n)} <i data-count="${id}">/${fmt(count(id))}</i></span>`;
}
function statLine(st) {
  const p = [];
  if (st.atk) p.push(`⚔ +${st.atk}`);
  if (st.def) p.push(`🛡 +${st.def}`);
  if (st.hp) p.push(`❤ +${st.hp}`);
  if (st.gold) p.push(`🪙 +${pct(st.gold)}`);
  return p.join('  ');
}
const fruitLabel = (id) => (id === 'FRUIT' ? 'Random Abyss Fruit' : ITEMS[id].name);
const fruitIcon = (id) => (id === 'FRUIT' ? '🍎?' : ITEMS[id].icon);

/* =============================================================== VIEWS */
const VIEWS = {};

/* ------------------------------------------------------------- home */
VIEWS.home = () => {
  const rank = BOUNTY_RANKS[bountyRank()];
  const door = (r) => {
    const R = REALMS[r];
    const busy = S.action && SKILLS[S.action.skill].realm === r;
    return `<button class="door" data-nav="realm:${r}" style="--realm:${R.color}">
      ${busy ? '<span class="tag busy-tag" style="background:var(--hp);color:var(--line)">ACTIVE</span>' : ''}
      <div class="door-ico">${R.icon}</div><div class="door-name">${R.name}</div><div class="door-tag">${R.tagline}</div>
      <div class="door-skills">${skillsOf(r).map((k) => `<span>${SKILLS[k].icon} ${skillLv(k)}</span>`).join('')}</div>
      <span class="door-cta">ENTER ›</span></button>`;
  };
  return `
  <div class="home-grid">
    <div class="panel welcome">
      <div class="kicker" style="--realm:var(--hot)">THREE WORLDS · ONE FATE</div>
      <h1>The worlds have <em>collided.</em></h1>
      <p>Ninja villages now border the afterlife, and pirate ships sail its skies. Gather in every world, craft with all of them,
      fight your way to <b>The Convergence</b>. Everything keeps running while you're away.</p>
    </div>
    <div class="panel dark"><div class="stat-grid">
      <div class="stat"><small>Total level</small><b>${totalLevel()}</b></div>
      <div class="stat"><small>Bounty rank</small><b>${rank[1]}</b></div>
      <div class="stat"><small>Foes defeated</small><b>${fmt(S.stats.kills)}</b></div>
      <div class="stat"><small>Abyss fruit</small><b>${S.fruit ? ITEMS[S.fruit].icon + ' ' + ITEMS[S.fruit].name : '—'}</b></div>
    </div></div>
  </div>
  <h2 class="slab" style="--realm:var(--hot)"><span>Pick a world</span></h2>
  <div class="doors">${['shinobi', 'soul', 'seas'].map(door).join('')}
    <button class="door" data-nav="battle" style="--realm:#e11d48">
      ${S.combat.zone != null ? '<span class="tag busy-tag" style="background:var(--hp);color:var(--line)">FIGHTING</span>' : ''}
      <div class="door-ico">⚔️</div><div class="door-name">Battlefields</div><div class="door-tag">Defeat foes from all three worlds for gold, gear and bounty.</div>
      <div class="door-skills"><span>💪 ${skillLv('strength')}</span><span>🛡️ ${skillLv('defense')}</span><span>❤️ ${skillLv('vitality')}</span></div>
      <span class="door-cta">FIGHT ›</span></button>
  </div>`;
};

/* ------------------------------------------------------------- realm / skill */
VIEWS.realm = (realm, skill) => {
  const R = REALMS[realm], s = SKILLS[skill], b = xpInfo(skill);
  const speed = skillSpeed(skill);
  const mods = [`<span class="chip">⏩ Speed ×${speed.toFixed(2)}</span>`, `<span class="chip">✦ XP ×${xpMult().toFixed(2)}</span>`];
  if (skill === 'fishing' && S.fruit) mods.push('<span class="chip short">🍎 Fruit eater: −40% speed</span>');
  return `
  <div class="banner" style="--realm:${R.color}">
    <div class="banner-ico">${R.icon}</div>
    <div><div class="kicker">WORLD</div><h1>${R.name}</h1><p>${R.tagline}</p></div>
  </div>
  <div class="tabs" style="--realm:${R.color}">${skillsOf(realm).map((k) => `
    <button class="tab ${k === skill ? 'on' : ''}" data-nav="realm:${realm}:${k}">
      <span class="ti">${SKILLS[k].icon}</span><b>${SKILLS[k].name}</b><i data-lv="${k}">${skillLv(k)}</i></button>`).join('')}
  </div>
  <div class="panel skill-strip" style="--realm:${R.color}">
    <div class="lv-badge"><div><small>LEVEL</small><b data-lv="${skill}">${b.L}</b></div></div>
    <div>
      <h2>${s.icon} ${s.name}</h2><p>${s.desc}</p>
      <div class="bar xp tall"><div class="fill" data-xpbar="${skill}"></div><span class="txt" data-xptext="${skill}">${xpText(b)}</span></div>
    </div>
    <div class="skill-mods">${mods.join('')}</div>
  </div>
  <div class="cards" style="--realm:${R.color}">${s.actions.map((a) => actionCard(skill, a)).join('')}</div>`;
};

function actionIcon(a) { return a.icon || ITEMS[Object.keys(a.out)[0]].icon; }
function actionCard(skill, a) {
  const rows = [];
  if (a.in) rows.push(`<div class="io"><label>USES</label>${Object.entries(a.in).map(([k, n]) => needChip(k, n)).join('')}</div>`);
  if (a.out) rows.push(`<div class="io"><label>GETS</label>${Object.entries(a.out).map(([k, n]) => chip(k, n)).join('')}</div>`);
  if (a.loot) {
    rows.push(`<div class="io"><label>LOOT</label><span class="chip">🪙 ${fmt(a.loot.gold[0] * goldMult())}–${fmt(a.loot.gold[1] * goldMult())}</span>${a.loot.table.map(([k]) => `<span class="chip" title="${esc(ITEMS[k].name)}">${ITEMS[k].icon}</span>`).join('')}</div>`);
    rows.push(`<div class="io"><label>RARE</label>${a.loot.rare.map(([k, c]) => `<span class="chip rare" title="${esc(fruitLabel(k))}">${fruitIcon(k)} <i>${pct(c)}</i></span>`).join('')}</div>`);
  }
  const it = ITEMS[a.id];
  if (it && it.type === 'equip') rows.push(`<div class="card-note">${it.slot.toUpperCase()} · ${statLine(it.stats)}</div>`);
  if (it && it.type === 'food') rows.push(`<div class="card-note">❤ Heals ${foodHeal(a.id)} HP in battle</div>`);
  const ml = masteryLv(skill, a.id);
  return `<button class="card" data-act="${skill}:${a.id}" data-state="${actState(skill, a)}">
    <div class="card-top"><div class="card-ico">${actionIcon(a)}</div>
      <div><div class="card-name">${esc(a.name)}</div>
      <div class="card-sub"><span>⏱ ${fmtTime(actionTime(skill, a))}</span><span>✦ ${a.xp} XP</span>${ml ? `<span title="Mastery: faster and a chance to double output">★ ${ml}</span>` : ''}</div></div></div>
    <div class="card-body">${rows.join('')}</div>
    <div class="card-foot"><span class="cta" data-cta>${ctaText(skill, a)}</span>${it ? `<span class="own">Owned <b data-count="${a.id}">${fmt(count(a.id))}</b></span>` : ''}</div>
    <div class="bar prog"><div class="fill" data-actfill></div></div>
  </button>`;
}
function actState(skill, a) {
  if (skillLv(skill) < a.level) return 'locked';
  if (S.action && S.action.skill === skill && S.action.id === a.id) return 'active';
  if (a.in && !canAfford(a.in)) return 'missing';
  return 'ready';
}
function ctaText(skill, a) {
  return { locked: `🔒 LEVEL ${a.level}`, active: '■ STOP', missing: 'NEED ITEMS', ready: SKILLS[skill].type === 'voyage' ? 'SET SAIL ▶' : 'START ▶' }[actState(skill, a)];
}

/* ------------------------------------------------------------- battle */
VIEWS.battle = () => {
  const C = S.combat;
  const foods = Object.keys(S.items).filter((k) => ITEMS[k].type === 'food');
  const style = (s, l) => `<button class="${C.style === s ? 'on' : ''}" data-style="${s}">${sk(l)}</button>`;
  const cskill = (k) => `<div class="cskill"><div><span>${SKILLS[k].icon} ${SKILLS[k].name}</span><span>Lv <b data-lv="${k}">${skillLv(k)}</b></span></div><div class="bar xp"><div class="fill" data-xpbar="${k}"></div></div></div>`;
  let lastRealm = null, groups = '', open = false;
  ZONES.forEach((z, i) => {
    if (REALMS[z.realm].hidden && !zoneUnlocked(i)) return;
    if (z.realm !== lastRealm) {
      if (open) groups += '</div></div>';
      lastRealm = z.realm; open = true;
      const R = REALMS[z.realm];
      groups += `<div class="zone-group" style="--realm:${R.color}"><h3>${R.icon} ${R.name}</h3><div class="zone-list">`;
    }
    groups += zoneTile(z, i);
  });
  if (open) groups += '</div></div>';
  return `
  <div class="banner" style="--realm:#e11d48">
    <div class="banner-ico">⚔️</div>
    <div><div class="kicker">BATTLEFIELDS</div><h1>Fight!</h1><p>Combat runs on its own. Pick a zone, set your style and food, and watch.</p></div>
    <div class="combat-skills">${cskill('strength')}${cskill('defense')}${cskill('vitality')}</div>
  </div>
  <div id="stage" class="stage ${C.zone != null ? 'fighting' : ''}">${stageHTML()}</div>
  <div class="battle-row">
    <div class="panel battle-controls">
      <div class="ctrl"><label>TRAIN</label><div class="seg">${style('strength', '💪 Strength')}${style('defense', '🛡️ Defense')}${style('balanced', '⚖️ Both')}</div></div>
      <div class="ctrl"><label>AUTO-EAT</label><select data-food>${foods.length ? '' : '<option value="">No food! Cook some.</option>'}${foods.map((f) => `<option value="${f}" ${C.food === f ? 'selected' : ''}>${ITEMS[f].icon} ${ITEMS[f].name} ×${fmt(count(f))} (+${foodHeal(f)} HP)</option>`).join('')}</select></div>
      <div class="small" style="color:var(--dimp)">Eats when HP drops below ${pct(autoEatThreshold())}. Vitality always gains XP.</div>
    </div>
    <div class="panel dark"><h3 class="mini-title">Battle log</h3><div class="log" id="clog">${logHTML()}</div></div>
  </div>
  ${groups}`;
};
function zoneTile(z, i) {
  const C = S.combat, un = zoneUnlocked(i);
  if (!un) {
    const prev = ZONES[i - 1], need = prev.boss ? 1 : 10, have = Math.min(need, C.kills[prev.id] || 0);
    return `<button class="zone" disabled><div class="zone-name">🔒 ${z.name}</div>
      <div class="small">${prev.boss ? `Defeat ${prev.enemies[0].name}` : `Defeat ${need} foes in ${prev.name}`} (${have}/${need})</div></button>`;
  }
  const [dl, dc] = zoneDanger(i);
  const icon = { easy: '✓', fair: '!', risky: '!!', deadly: '☠' }[dc];
  return `<button class="zone ${z.boss ? 'boss' : ''} ${C.zone === i ? 'on' : ''}" data-zone="${i}">
    <div class="zone-name">${z.name}</div>
    <div class="zone-foes" title="${z.enemies.map((e) => e.name).join(', ')}">${z.enemies.map((e) => e.icon).join(' ')}</div>
    <div class="zone-foot"><span class="danger ${dc}">${icon} ${dl}</span><span><b data-kills="${z.id}">${fmt(C.kills[z.id] || 0)}</b> kills</span></div></button>`;
}
function stageHTML() {
  const C = S.combat, e = curEnemy();
  const me = `<div class="fighter me">
    <div class="f-top"><div class="portrait" data-portrait="player">🥷</div>
      <div><div class="f-name">You</div><div class="f-stats"><span class="chip">⚔ ${fmt(pMaxHit())}</span><span class="chip">🛡 ${fmt(pDef())}</span><span class="chip">⏱ ${pSpeed().toFixed(1)}s</span>${pDodge() ? `<span class="chip">💨 ${pct(pDodge())}</span>` : ''}</div></div></div>
    <div class="bar hp tall"><div class="fill" data-php></div><span class="txt" data-phptext></span></div>
    <div class="bar timer"><div class="fill" data-patk></div></div>
  </div>`;
  let right;
  if (C.zone == null) right = `<div class="stage-empty"><div><div class="big">👇</div><b>Pick a battlefield below</b><div class="small">Start with an <b>✓ Easy</b> zone.</div></div></div>`;
  else if (!e) right = `<div class="stage-empty"><div><div class="big spinner">🌀</div><b>Searching for a foe…</b></div></div>`;
  else {
    const boss = ZONES[C.zone].boss;
    right = `<div class="fighter enemy enter">
      <div class="f-top"><div class="portrait ${boss ? 'boss' : ''}" data-portrait="enemy">${e.icon}</div>
        <div><div class="f-name">${e.name}</div><div class="f-stats"><span class="chip">⚔ ${e.atk}</span><span class="chip">🛡 ${e.def}</span><span class="chip">⏱ ${e.spd}s</span></div></div></div>
      <div class="bar ehp tall"><div class="fill" data-ehp></div><span class="txt" data-ehptext></span></div>
      <div class="bar timer"><div class="fill" data-eatk></div></div>
      <div class="f-stats">${e.drops.map(([id, ch]) => `<span class="chip ${ch < 0.2 ? 'rare' : ''}" title="${esc(fruitLabel(id))}">${fruitIcon(id)} <i>${pct(ch)}</i></span>`).join('')}<span class="chip">🪙 ${fmt(e.gold[0])}+</span></div>
    </div>`;
  }
  return `${me}<div class="vs">VS</div>${right}`;
}
function logHTML() { return S.combat.log.map((l) => `<div class="${l.c}">${esc(l.m)}</div>`).join('') || '<div class="sys">Nothing yet.</div>'; }

/* ------------------------------------------------------------- hero */
VIEWS.hero = () => {
  const filters = [['all', 'All'], ['res', 'Materials'], ['food', 'Food'], ['equip', 'Gear'], ['fruit', 'Fruit']];
  const ids = Object.keys(S.items).filter((k) => S.ui.bank === 'all' || ITEMS[k].type === S.ui.bank);
  const slot = (s, label, icon) => {
    const id = S.equip[s];
    if (!id) return `<div class="slot"><div class="slot-ico" style="opacity:.4">${icon}</div><div class="grow"><div class="slot-kind">${label}</div><div class="slot-stats">Empty — craft or find one</div></div></div>`;
    return `<div class="slot filled"><div class="slot-ico">${ITEMS[id].icon}</div><div class="grow"><div class="slot-kind">${label}</div><div class="slot-name">${ITEMS[id].name}</div><div class="slot-stats">${statLine(ITEMS[id].stats)}</div></div><button class="btn sm ghost" data-unequip="${s}">${sk('Remove')}</button></div>`;
  };
  return `
  <div class="banner" style="--realm:#14a8ff"><div class="banner-ico">🎒</div><div><div class="kicker">HERO</div><h1>Gear &amp; Bank</h1><p>Equip what you craft, eat what you cook, sell what you don't need.</p></div></div>
  <div class="hero-grid">
    <div class="panel">
      <h3 class="mini-title">Equipped</h3>
      <div class="slots">${slot('weapon', 'WEAPON', '🗡️')}${slot('armor', 'ARMOR', '🥋')}${slot('accessory', 'ACCESSORY', '💍')}
        ${S.fruit ? `<div class="slot filled fruit"><div class="slot-ico">${ITEMS[S.fruit].icon}</div><div class="grow"><div class="slot-kind">ABYSS FRUIT</div><div class="slot-name">${ITEMS[S.fruit].name}</div><div class="slot-stats">${ITEMS[S.fruit].desc}</div></div></div>` : ''}</div>
      <div class="hero-stats">
        <div class="rate"><small>Max hit</small><b>⚔ ${fmt(pMaxHit())}</b></div><div class="rate"><small>Defense</small><b>🛡 ${fmt(pDef())}</b></div>
        <div class="rate"><small>Max HP</small><b>❤ ${fmt(pMaxHp())}</b></div><div class="rate"><small>Gold bonus</small><b>🪙 ×${goldMult().toFixed(2)}</b></div>
      </div>
    </div>
    <div style="display:flex;flex-direction:column;gap:20px">
      ${inspectorHTML()}
      <div class="panel">
        <div class="bank-head"><h3 class="mini-title" style="margin:0">Bank · ${Object.keys(S.items).length} items</h3>
          <div class="seg">${filters.map(([k, l]) => `<button class="${S.ui.bank === k ? 'on' : ''}" data-bankf="${k}">${sk(l)}</button>`).join('')}</div></div>
        <div class="bank-grid">${ids.length ? ids.map((k) => `<button class="bitem t-${ITEMS[k].type} ${selItem === k ? 'on' : ''}" data-sel="${k}" title="${esc(ITEMS[k].name)}">${ITEMS[k].icon}<b data-count="${k}">${fmt(S.items[k])}</b>${seenItems.has(k) ? '' : '<span class="new">NEW</span>'}</button>`).join('') : '<div class="empty-note">Nothing here yet.</div>'}</div>
      </div>
    </div>
  </div>`;
};
function inspectorHTML() {
  if (!selItem || !count(selItem)) return `<div class="panel inspector"><div class="empty-note">👆 Tap any item in your bank to see what it does.</div></div>`;
  const it = ITEMS[selItem], n = count(selItem);
  let what = '', main = '';
  if (it.type === 'equip') { what = `${it.slot.toUpperCase()} · ${statLine(it.stats)}`; main = `<button class="btn hot" data-equip="${selItem}">${sk('Equip')}</button>`; }
  else if (it.type === 'food') { what = `Heals ${foodHeal(selItem)} HP in battle. Also used as voyage supplies.`; main = `<button class="btn hot" data-setfood="${selItem}">${sk('Use as battle food')}</button>`; }
  else if (it.type === 'fruit') { what = `${it.desc} Only one fruit at a time — eating replaces the old one. Fruit eaters fish 40% slower.`; main = `<button class="btn hot" data-eat="${selItem}">${sk('Eat fruit')}</button>`; }
  else what = 'Crafting material. Check the skill pages to see what it makes.';
  return `<div class="panel inspector">
    <div class="insp-head"><div class="insp-ico">${it.icon}</div><div><h2>${it.name}</h2><div class="small" style="color:var(--dimp);font-weight:600">Owned <b data-count="${selItem}">${fmt(n)}</b> · sells for 🪙 ${fmt(it.value)} each</div></div></div>
    <p>${what}</p>
    <div class="insp-actions">${main}<button class="btn ghost sm" data-sell="${selItem}:1">${sk('Sell 1')}</button><button class="btn ghost sm" data-sell="${selItem}:half">${sk('Sell half')}</button><button class="btn sm" data-sell="${selItem}:all">${sk(`Sell all · 🪙 ${fmt(it.value * n)}`)}</button></div>
  </div>`;
}

/* ------------------------------------------------------------- power */
const TRAIN_COLORS = { chakra: '#ff7a1a', reiatsu: '#9b6bff', will: '#9aa4b2', swift: '#2fe39b', fortune: '#ffc83d', wisdom: '#14a8ff' };
VIEWS.power = () => {
  const E = S.energy, cap = energyCap(), g = karmaGain();
  const steps = ['1', '10', '100', '10%', '25%', 'max'];
  return `
  <div class="banner" style="--realm:#7c4dff"><div class="banner-ico">🔋</div><div><div class="kicker">INNER POWER</div><h1>Train your spirit</h1><p>Put energy into a training. It levels up forever on its own and powers up everything you do.</p></div></div>
  <div class="panel pool">
    <div class="pool-top"><div><div class="kicker" style="--realm:var(--dimp)">FREE ENERGY</div><div class="pool-num"><span data-eidle>${fmt(energyIdle())}</span><small> / ${fmt(cap)}</small></div></div>
      <div style="margin-left:auto;display:flex;gap:12px;align-items:center;flex-wrap:wrap"><span class="kicker" style="--realm:var(--dimp)">AMOUNT PER CLICK</span>
        <div class="seg">${steps.map((s) => `<button class="${E.step === s ? 'on' : ''}" data-step="${s}">${sk(s)}</button>`).join('')}</div>
        <button class="btn sm ghost" data-releaseall>${sk('Release all')}</button></div></div>
    <div class="pool-bar">${TRAININGS.map((t) => `<div style="width:${((E.alloc[t.id] || 0) / cap) * 100}%;background:${TRAIN_COLORS[t.id]}" title="${t.name}"></div>`).join('')}</div>
  </div>
  <div class="trainings">${TRAININGS.map((t) => {
    const a = E.alloc[t.id] || 0, L = tl(t.id), rate = (a * energyPower()) / trainCost(t.id, L);
    return `<div class="panel train ${a ? 'active' : ''}" style="--tc:${TRAIN_COLORS[t.id]}">
      <div class="train-top"><div class="train-ico">${t.icon}</div><div><div class="train-name">${t.name}</div><div class="train-bonus" data-tbonus="${t.id}">+${fmt(L * t.per)}${t.unit}</div></div>
        <div class="train-lv"><small>LEVEL</small><b data-tl="${t.id}">${fmt(L)}</b></div></div>
      <div class="bar"><div class="fill" data-tbar="${t.id}"></div></div>
      <div class="train-ctl"><button class="btn sm ghost pm" data-alloc="${t.id}:-1" title="Take energy back">${sk('−')}</button>
        <div class="alloc"><b>${fmt(a)}</b> energy · <span style="color:var(--dimp)">${a ? (rate >= 1 ? fmt(rate) + ' lv/s' : fmtTime(1 / rate) + ' / lv') : 'idle'}</span></div>
        <button class="btn sm hot pm" data-alloc="${t.id}:1" title="Add energy">${sk('+')}</button></div>
    </div>`;
  }).join('')}</div>
  <h2 class="slab" style="--realm:var(--gold)"><span>Upgrade with gold</span></h2>
  <div class="upgrades">
    <div class="panel upg"><span class="big-ico">🫙</span><div class="grow"><b>Bigger Vessel</b><p>+25 energy capacity (now ${fmt(cap)})</p></div><button class="btn hot" data-buycap data-cost="${capCost()}">${sk('🪙 ' + fmt(capCost()))}</button></div>
    <div class="panel upg"><span class="big-ico">⚡</span><div class="grow"><b>Purer Energy</b><p>+10% training speed (now ×${energyPower().toFixed(2)})</p></div><button class="btn hot" data-buypow data-cost="${powCost()}">${sk('🪙 ' + fmt(powCost()))}</button></div>
  </div>
  <div class="panel rebirth">
    <div><h2>♻️ Rebirth</h2><p>Reset all Inner Power (trainings, capacity, power) to earn <b>Karma</b>. Skills, items, gear and gold are kept.
      You need at least 200 total training levels — you have <b>${fmt(totalTrain())}</b>.</p>
      <button class="btn hot big" ${g > 0 ? '' : 'disabled'} data-rebirth>${sk('Be reborn')}</button></div>
    <div class="gain">+${fmt(g)}<small>KARMA</small></div>
  </div>
  <h2 class="slab" style="--realm:var(--soul)"><span>Karma perks · ☯ ${fmt(S.karma)}</span></h2>
  <div class="shop">${PERKS.map((p) => {
    const L = pl(p.id), maxed = p.max && L >= p.max, c = perkCost(p.id);
    return `<div class="panel ware"><div class="ware-top"><div class="ware-ico" style="background:#c7b2ff">${p.icon}</div><div><div class="ware-name">${p.name}</div><div class="small" style="color:var(--dimp);font-weight:700">Level ${L}${p.max ? ' / ' + p.max : ''}</div></div></div>
      <p>${p.desc}</p><button class="btn hot sm" ${maxed || S.karma < c ? 'disabled' : ''} data-perk="${p.id}">${sk(maxed ? 'MAXED' : '☯ ' + c)}</button></div>`;
  }).join('')}</div>`;
};

/* ------------------------------------------------------------- market */
VIEWS.market = () => `
  <div class="banner" style="--realm:#e0a100"><div class="banner-ico">🏪</div><div><div class="kicker">MARKET</div><h1>Spend your gold</h1><p>Permanent upgrades and emergency supplies. Sell spare items from the Hero page.</p></div></div>
  <div class="shop">${SHOP.map((it) => {
    const tier = S.shop[it.id] || 0, cost = shopCost(it), maxed = cost === undefined;
    return `<div class="panel ware"><div class="ware-top"><div class="ware-ico">${it.icon}</div><div><div class="ware-name">${it.name}</div>
      ${it.costs ? `<div class="pips">${it.costs.map((_, i) => `<i class="${i < tier ? 'on' : ''}"></i>`).join('')}</div>` : `<div class="small" style="color:var(--dimp);font-weight:700">${it.cat}</div>`}</div></div>
      <p>${it.desc}</p><button class="btn hot" ${maxed ? 'disabled' : ''} data-buy="${it.id}" ${maxed ? '' : `data-cost="${cost}"`}>${sk(maxed ? 'MAXED' : '🪙 ' + fmt(cost))}</button></div>`;
  }).join('')}</div>`;

/* ------------------------------------------------------------- settings */
VIEWS.settings = () => `
  <div class="banner" style="--realm:#5b6070"><div class="banner-ico">⚙️</div><div><div class="kicker">SYSTEM</div><h1>Settings</h1><p>The game autosaves every 10 seconds and when you close the tab.</p></div></div>
  ${isStandalone() ? '' : `<div class="panel install">
    <span class="big-ico">📲</span>
    <div class="grow"><h3 class="mini-title" style="margin:0">Play it like an app</h3>
      <p>Install Tri-Realm on your phone or computer: full screen, its own icon, and it works offline.</p>
      ${installPrompt ? '' : '<p class="small" style="color:var(--dimp)"><b>iPhone / iPad:</b> tap Share ⎙ then <b>Add to Home Screen</b>. <b>Android / desktop:</b> use the browser menu → <b>Install app</b>.</p>'}</div>
    ${installPrompt ? `<button class="btn hot" data-install>${sk('Install')}</button>` : ''}
  </div>`}
  <div class="panel">
    <div class="settings"><button class="btn" data-save>${sk('💾 Save now')}</button><button class="btn" data-export>${sk('📤 Export')}</button>
      <button class="btn" data-import>${sk('📥 Import')}</button><button class="btn hot" data-wipe>${sk('🗑 Hard reset')}</button></div>
    <textarea id="savebox" rows="5" placeholder="Export puts your save here. To import, paste a save here and press Import."></textarea>
  </div>`;

/* =============================================================== side column */
function nowHTML() {
  const C = S.combat;
  if (S.action) {
    const s = SKILLS[S.action.skill], a = findAction(S.action.skill, S.action.id), T = actionTime(S.action.skill, a);
    const per = 3600 / T, color = realmColor(s.realm);
    let r1, r2;
    if (a.in) {
      const can = Math.min(...Object.entries(a.in).map(([k, n]) => Math.floor(count(k) / n)));
      r1 = `<div class="rate"><small>Can still make</small><b data-canmake>${fmt(can)}</b></div>`;
      r2 = `<div class="rate"><small>Runs out in</small><b data-runout>${fmtTime(can * T)}</b></div>`;
    } else {
      const dbl = 1 + doubleChance(S.action.skill, a.id);
      r1 = `<div class="rate"><small>Items / hour</small><b>${fmt(per * dbl)}</b></div>`;
      r2 = `<div class="rate"><small>Next level in</small><b data-nextlv>—</b></div>`;
    }
    return `<div class="now-head" style="--realm:${color}"><div class="ring bob" data-ring><span>${actionIcon(a)}</span></div>
        <div style="min-width:0"><div class="kicker kicker-row" style="--realm:${color}">NOW · ${s.name.toUpperCase()}</div><div class="now-name">${esc(a.name)}</div></div>
        <button class="btn sm hot" data-stop style="margin-left:auto">${sk('■')}</button></div>
      <div class="now-rates">${r1}${r2}<div class="rate"><small>XP / hour</small><b>${fmt(per * a.xp * xpMult())}</b></div><div class="rate"><small>Each action</small><b>${fmtTime(T)}</b></div></div>`;
  }
  if (C.zone != null) {
    const z = ZONES[C.zone], e = z.enemies[0];
    const kph = 3600 / (timeToKill(e) + (z.boss ? 3 : 1.2));
    const food = C.food && count(C.food) ? `${ITEMS[C.food].icon} <span data-count="${C.food}">${fmt(count(C.food))}</span>` : '<span style="color:var(--hot)">None!</span>';
    return `<div class="now-head" style="--realm:var(--hot)"><div class="ring bob" data-ring data-hpring><span>⚔️</span></div>
        <div style="min-width:0"><div class="kicker kicker-row">NOW · BATTLE</div><div class="now-name">${z.name}</div></div>
        <button class="btn sm hot" data-stopcombat style="margin-left:auto">${sk('■')}</button></div>
      <div class="now-rates"><div class="rate"><small>Kills / hour</small><b>~${fmt(kph)}</b></div><div class="rate"><small>XP / hour</small><b>~${fmt(kph * e.xp * 1.33 * xpMult())}</b></div>
        <div class="rate"><small>Food left</small><b>${food}</b></div><div class="rate"><small>Your HP</small><b data-hpnow></b></div></div>`;
  }
  const g = goalState();
  return `<div class="now-idle"><span class="zz">💤</span><p><b>You're idle!</b> Idle games only work while you're doing something.${g ? ` Try: <b>${g.g.text}</b>.` : ''}</p>
    ${g ? `<button class="btn hot" data-nav="${g.g.go}">${sk('GO ›')}</button>` : ''}</div>`;
}
function goalHTML() {
  const st = goalState();
  if (!st) return `<h3 class="mini-title">Objective</h3><div class="goal-row"><div class="goal-ico">🏆</div><div class="goal-text">You conquered the multiverse. Keep pushing your levels!</div></div>`;
  const { g, cur, done } = st;
  return `<h3 class="mini-title">Objective ${S.goal + 1} / ${GOALS.length}</h3>
    <div class="goal-row"><div class="goal-ico">${g.icon}</div><div><div class="goal-text">${g.text}</div><div class="goal-reward">Reward: 🪙 ${fmt(g.reward)}</div></div></div>
    <div class="goal-foot"><div class="bar tall" style="--realm:var(--hp)"><div class="fill" data-goalbar style="width:${(cur / g.n) * 100}%"></div><span class="txt" data-goaltxt>${fmt(cur)} / ${fmt(g.n)}</span></div>
      ${done ? `<button class="btn hot glow" data-claim>${sk('CLAIM!')}</button>` : `<button class="btn sm" data-nav="${g.go}">${sk('GO ›')}</button>`}</div>`;
}
let lastGoalDone = null;
function renderSide() {
  const now = $('#now');
  now.innerHTML = nowHTML();
  now.classList.toggle('active', !!(S.action || S.combat.zone != null));
  const st = goalState();
  lastGoalDone = st ? st.done : null;
  const goal = $('#goal');
  goal.innerHTML = goalHTML();
  goal.classList.toggle('done', !!(st && st.done));
}

/* =============================================================== loot feed */
const feed = [];
function feedAdd(icon, name, n, cls) {
  const top = feed[0];
  if (top && top.name === name && Date.now() - top.t < 6000) { top.n += n; top.t = Date.now(); top.bump = true; }
  else { feed.unshift({ icon, name, n, cls, t: Date.now() }); if (feed.length > 7) feed.pop(); }
  renderFeed();
}
function renderFeed() {
  $('#feed').innerHTML = feed.map((f, i) => `<div class="feed-row ${i === 0 && f.bump ? 'bump' : ''}"><span class="fi">${f.icon}</span><span class="fn">${esc(f.name)}</span><b class="${f.cls || ''}">${f.n > 0 ? '+' : ''}${fmt(f.n)}</b></div>`).join('')
    || '<div class="small dim">Loot you earn shows up here.</div>';
  if (feed[0]) feed[0].bump = false;
}

/* =============================================================== FX */
let floatCount = 0;
function floatAt(el, text, cls, dx, dy) {
  if (!el || floatCount > 24) return;
  const r = el.getBoundingClientRect();
  if (!r.width || r.bottom < 0 || r.top > innerHeight) return;
  const f = document.createElement('div');
  f.className = 'float ' + (cls || '');
  f.textContent = text;
  f.style.left = r.left + r.width / 2 + (dx || 0) + (Math.random() * 30 - 15) + 'px';
  f.style.top = r.top + r.height * 0.35 + (dy || 0) + 'px';
  $('#fx').appendChild(f);
  floatCount++;
  setTimeout(() => { f.remove(); floatCount--; }, 1000);
}
function sfxAt(el, word) {
  if (!el) return;
  const r = el.getBoundingClientRect();
  const f = document.createElement('div');
  f.className = 'sfx';
  f.textContent = word;
  f.style.left = r.left + r.width / 2 + (Math.random() * 40 - 20) + 'px';
  f.style.top = r.top + r.height / 2 + 'px';
  $('#fx').appendChild(f);
  setTimeout(() => f.remove(), 700);
}
function retrigger(el, cls) { if (!el) return; el.classList.remove(cls); void el.offsetWidth; el.classList.add(cls); }
let burstBusy = false;
const burstQueue = [];
function burst(title, sub, icon, color) {
  if (burstBusy) { if (burstQueue.length < 3) burstQueue.push([title, sub, icon, color]); return; }
  burstBusy = true;
  const b = document.createElement('div');
  b.className = 'burst';
  b.style.setProperty('--realm', color || 'var(--hot)');
  b.innerHTML = `<div class="burst-card"><div class="burst-ico">${icon}</div><div class="burst-title">${title}</div><div class="burst-sub">${sub}</div></div>`;
  document.body.appendChild(b);
  setTimeout(() => { b.remove(); burstBusy = false; if (burstQueue.length) burst(...burstQueue.shift()); }, 1900);
}
function flash() { const f = document.createElement('div'); f.className = 'flash'; document.body.appendChild(f); setTimeout(() => f.remove(), 500); }

const SFX_WORDS = ['BAM!', 'ZAN!', 'DOON!', 'SLASH!', 'KRAK!', 'GOGOGO!'];
function inBattleView() { return S.ui.view === 'battle'; }

on('action', (d) => {
  const card = $(`[data-act="${d.skill}:${d.act.id}"]`);
  const anchor = card ? $('.card-ico', card) : $('#now [data-ring]');
  const fast = actionTime(d.skill, d.act) < 0.8;
  if (!fast) {
    let i = 0;
    for (const id in d.gains) floatAt(anchor, `+${fmt(d.gains[id])} ${ITEMS[id].icon}`, 'gain', 0, -i++ * 24);
    if (d.gold) floatAt(anchor, `+${fmt(d.gold)} 🪙`, 'gold', 40, 0);
    floatAt(anchor, `+${fmt(d.xp)} XP`, 'xp', 50, 24);
    if (d.double) floatAt(anchor, 'x2!', 'gold', -50, 0);
    if (card) retrigger(card, 'pop');
    retrigger($('#now [data-ring]'), 'pop');
  }
  for (const id in d.gains) feedAdd(ITEMS[id].icon, ITEMS[id].name, d.gains[id]);
  if (d.gold) feedAdd('🪙', 'Gold', d.gold, 'g');
});
on('levelup', (d) => {
  const s = SKILLS[d.skill];
  burst('LEVEL UP!', `${s.name} → ${d.level}`, s.icon, realmColor(s.realm) || 'var(--hot)');
  const unlocked = s.actions.find((a) => a.level === d.level);
  if (unlocked) toast(`New in ${s.name}: ${actionIcon(unlocked)} ${unlocked.name}!`, 'good');
});
on('hit', (d) => {
  if (!inBattleView()) return;
  const el = $(`[data-portrait="${d.target}"]`);
  if (!el) return;
  if (d.dodge) { floatAt(el, 'DODGE!', 'miss'); return; }
  if (d.target === 'enemy') {
    floatAt(el, fmt(d.dmg), d.crit ? 'dmg crit' : 'dmg');
    if (d.crit) sfxAt(el.closest('.fighter'), SFX_WORDS[Math.floor(Math.random() * SFX_WORDS.length)]);
  } else floatAt(el, '-' + fmt(d.dmg), 'hurt');
  retrigger(el.closest('.fighter'), 'shake');
});
on('eat', (d) => { if (inBattleView()) floatAt($('[data-portrait="player"]'), `+${fmt(d.heal)} ${ITEMS[d.id].icon}`, 'heal', 0, -20); });
on('kill', (d) => {
  for (const id in d.loot) feedAdd(ITEMS[id].icon, ITEMS[id].name, d.loot[id]);
  feedAdd('🪙', 'Gold', d.gold, 'g');
  if (inBattleView()) {
    const f = $('.fighter.enemy');
    if (f) { const s = document.createElement('div'); s.className = 'ko-stamp'; s.textContent = 'K.O.!'; f.appendChild(s); floatAt($('[data-portrait="enemy"]', f), `+${fmt(d.gold)} 🪙`, 'gold', 0, 30); }
  }
  const unlocked = ZONES.filter((z, i) => zoneUnlocked(i)).length;
  if (unlocked > lastUnlocked) {
    lastUnlocked = unlocked;
    const z = ZONES[unlocked - 1];
    burst('NEW AREA!', z.name, REALMS[z.realm].icon, REALMS[z.realm].color);
    dirty = true;
  }
  if (d.boss) burst('BOSS DOWN!', d.enemy.name, d.enemy.icon, 'var(--gold)');
  sideDirty = true;
});
on('spawn', () => {
  if (!inBattleView()) return;
  const st = $('#stage');
  if (st) { st.innerHTML = stageHTML(); st.classList.add('fighting'); }
});
on('death', () => { flash(); dirty = true; });
on('goal', (g) => { burst('OBJECTIVE!', `${g.text} · +${fmt(g.reward)} 🪙`, g.icon, 'var(--gold)'); });

/* =============================================================== render + update */
let lastUnlocked = 0, sideDirty = false, bankSig = '', lastLogVer = -1, lastFoodSig = '';
function render() {
  dirty = false; sideDirty = false;
  normalizeView();
  renderRail();
  const [name, a1, a2] = S.ui.view.split(':');
  const main = $('#main');
  const scroll = main.scrollTop;
  const box = $('#savebox'), boxVal = box ? box.value : null;
  main.classList.toggle('static', !viewChanged);
  main.innerHTML = VIEWS[name](a1, a2);
  main.scrollTop = scroll;
  if (boxVal !== null && $('#savebox')) $('#savebox').value = boxVal;
  if (name === 'hero') { bankSig = Object.keys(S.items).join(','); setTimeout(() => Object.keys(S.items).forEach((k) => seenItems.add(k)), 0); }
  viewChanged = false;
  lastLogVer = -1;
  renderSide();
  update();
}

let lastGold = 0;
function update() {
  // resources
  const goldEl = $('#r-gold');
  goldEl.textContent = fmt(S.gold);
  if (Math.floor(S.gold) !== lastGold) { if (S.gold > lastGold) retrigger(goldEl.parentElement, 'bump'); lastGold = Math.floor(S.gold); }
  $('#r-bounty').textContent = fmt(S.bounty);
  $('#r-rank').textContent = BOUNTY_RANKS[bountyRank()][1];
  $('#r-karma').textContent = fmt(S.karma);

  // levels / xp
  for (const el of $$('[data-lv]')) { const v = String(skillLv(el.dataset.lv)); if (el.textContent !== v) el.textContent = v; }
  for (const el of $$('[data-xpbar]')) {
    const b = xpInfo(el.dataset.xpbar);
    el.style.width = b.p * 100 + '%';
    const t = $(`[data-xptext="${el.dataset.xpbar}"]`);
    if (t) t.textContent = xpText(b);
  }
  for (const el of $$('[data-count]')) {
    const v = el.tagName === 'I' ? '/' + fmt(count(el.dataset.count)) : fmt(count(el.dataset.count));
    if (el.textContent !== v) el.textContent = v;
  }
  for (const el of $$('[data-need]')) el.classList.toggle('short', count(el.dataset.need) < +el.dataset.n);

  // action cards
  for (const card of $$('[data-act]')) {
    const [s, id] = card.dataset.act.split(':');
    const a = findAction(s, id), st = actState(s, a);
    if (card.dataset.state !== st) { card.dataset.state = st; $('[data-cta]', card).textContent = ctaText(s, a); }
    if (st === 'active') $('[data-actfill]', card).style.width = Math.min(100, (S.action.prog / actionTime(s, a)) * 100) + '%';
  }

  // now panel
  const ring = $('#now [data-ring]');
  if (ring) {
    let p = 0;
    if (S.action) p = S.action.prog / actionTime(S.action.skill, findAction(S.action.skill, S.action.id));
    else if (S.combat.zone != null) p = S.combat.hp / pMaxHp();
    ring.style.setProperty('--p', Math.min(1, p));
  }
  const hpNow = $('[data-hpnow]'); if (hpNow) hpNow.textContent = `${fmt(S.combat.hp)} / ${fmt(pMaxHp())}`;
  const nl = $('[data-nextlv]');
  if (nl && S.action) {
    const a = findAction(S.action.skill, S.action.id), b = xpInfo(S.action.skill);
    nl.textContent = b.need ? fmtTime((b.need / (a.xp * xpMult())) * actionTime(S.action.skill, a)) : 'MAX';
  }
  const cm = $('[data-canmake]');
  if (cm && S.action) {
    const a = findAction(S.action.skill, S.action.id);
    if (a.in) { const can = Math.min(...Object.entries(a.in).map(([k, n]) => Math.floor(count(k) / n))); cm.textContent = fmt(can); $('[data-runout]').textContent = fmtTime(can * actionTime(S.action.skill, a)); }
  }

  // goal
  const st = goalState();
  if (st) {
    const bar = $('[data-goalbar]');
    if (bar) { bar.style.width = (st.cur / st.g.n) * 100 + '%'; $('[data-goaltxt]').textContent = `${fmt(st.cur)} / ${fmt(st.g.n)}`; }
    if (st.done !== lastGoalDone) { renderSide(); if (st.done) toast(`Objective complete: ${st.g.text}! Claim your reward →`, 'rare'); }
  }

  // battle
  const C = S.combat;
  const php = $('[data-php]');
  if (php) {
    const m = pMaxHp();
    php.style.width = (C.hp / m) * 100 + '%';
    php.parentElement.classList.toggle('low', C.hp / m < 0.3);
    $('[data-phptext]').textContent = `${fmt(C.hp)} / ${fmt(m)} HP`;
    const e = curEnemy();
    $('[data-patk]').style.width = C.zone != null && e ? Math.max(0, 100 - (C.pT / pSpeed()) * 100) + '%' : '0%';
    const eh = $('[data-ehp]');
    if (e && eh) {
      eh.style.width = Math.max(0, C.eHp / e.hp) * 100 + '%';
      $('[data-ehptext]').textContent = `${fmt(Math.max(0, C.eHp))} / ${fmt(e.hp)} HP`;
      $('[data-eatk]').style.width = Math.max(0, 100 - (C.eT / e.spd) * 100) + '%';
    }
    if (lastLogVer !== logVer) { const l = $('#clog'); if (l) l.innerHTML = logHTML(); lastLogVer = logVer; }
    for (const el of $$('[data-kills]')) el.textContent = fmt(C.kills[el.dataset.kills] || 0);
    const foodSig = Object.keys(S.items).filter((k) => ITEMS[k].type === 'food').join();
    if (foodSig !== lastFoodSig) { if (lastFoodSig) dirty = true; lastFoodSig = foodSig; }
  }

  // power
  for (const el of $$('[data-tbar]')) {
    const id = el.dataset.tbar;
    el.style.width = Math.min(100, ((S.energy.prog[id] || 0) / trainCost(id, tl(id))) * 100) + '%';
    $(`[data-tl="${id}"]`).textContent = fmt(tl(id));
    $(`[data-tbonus="${id}"]`).textContent = '+' + fmt(tl(id) * TRAIN_BY[id].per) + TRAIN_BY[id].unit;
  }
  const ei = $('[data-eidle]'); if (ei) ei.textContent = fmt(energyIdle());

  // hero: new item types appeared
  if (S.ui.view === 'hero' && Object.keys(S.items).join(',') !== bankSig) dirty = true;

  // gold-priced buttons
  for (const el of $$('[data-cost]')) el.disabled = S.gold < +el.dataset.cost;
}

/* =============================================================== input */
document.addEventListener('click', (ev) => {
  const t = ev.target.closest('button, [data-nav]');
  if (!t || t.disabled) return;
  const d = t.dataset;
  if (d.nav) setView(d.nav);
  else if (d.act) {
    const [s, id] = d.act.split(':');
    const st = actState(s, findAction(s, id));
    if (st === 'locked' || st === 'missing') { retrigger(t, 'shake'); if (st === 'missing') toast('Missing materials — gather them first.', 'bad'); return; }
    startAction(s, id);
  }
  else if ('stop' in d) stopAction();
  else if (d.zone !== undefined) startCombat(+d.zone);
  else if ('stopcombat' in d) stopCombat();
  else if (d.style) { S.combat.style = d.style; dirty = true; }
  else if (d.sel) { selItem = d.sel; dirty = true; }
  else if (d.bankf) { S.ui.bank = d.bankf; dirty = true; }
  else if (d.equip) { equip(d.equip); toast(`Equipped ${ITEMS[d.equip].name}!`, 'good'); }
  else if (d.unequip) unequip(d.unequip);
  else if (d.eat) { if (!S.fruit || confirm(`Replace your ${ITEMS[S.fruit].name}? Its power will be lost.`)) { eatFruit(d.eat); burst('POWER!', ITEMS[d.eat].desc, ITEMS[d.eat].icon, 'var(--gold)'); } }
  else if (d.setfood) { S.combat.food = d.setfood; toast(`${ITEMS[d.setfood].name} will be eaten in battle.`, 'good'); dirty = true; }
  else if (d.sell) {
    const [id, q] = d.sell.split(':');
    const n = q === 'all' ? count(id) : q === 'half' ? Math.ceil(count(id) / 2) : 1;
    const g = ITEMS[id].value * Math.min(n, count(id));
    sell(id, n);
    feedAdd('🪙', 'Sold ' + ITEMS[id].name, g, 'g');
  }
  else if (d.buy) buyShop(d.buy);
  else if (d.alloc) { const [id, dir] = d.alloc.split(':'); allocate(id, +dir); }
  else if (d.step) { S.energy.step = d.step; dirty = true; }
  else if ('releaseall' in d) releaseAll();
  else if ('buycap' in d) buyCap();
  else if ('buypow' in d) buyPow();
  else if ('rebirth' in d) { if (confirm('Rebirth? All Inner Power training will reset.')) { const g = karmaGain(); if (rebirth()) burst('REBORN!', `+${fmt(g)} Karma`, '♻️', 'var(--soul)'); } }
  else if (d.perk) buyPerk(d.perk);
  else if ('claim' in d) claimGoal();
  else if ('install' in d && installPrompt) { installPrompt.prompt(); installPrompt.userChoice.finally(() => { installPrompt = null; dirty = true; }); }
  else if ('save' in d) { saveGame(); toast('Game saved.', 'good'); }
  else if ('export' in d) { const b = $('#savebox'); b.value = btoa(unescape(encodeURIComponent(serialize()))); b.select(); toast('Save exported — copy the text.', 'good'); }
  else if ('import' in d) {
    try { loadFrom(decodeURIComponent(escape(atob($('#savebox').value.trim())))); saveGame(); toast('Save imported!', 'good'); dirty = true; }
    catch (e) { toast('That save data is not valid.', 'bad'); }
  }
  else if ('wipe' in d) { if (confirm('Erase ALL progress? This cannot be undone.')) { S = defaultState(); S.combat.hp = pMaxHp(); saveGame(); setView('home'); } }
});
document.addEventListener('change', (ev) => {
  if (ev.target.matches('[data-food]')) { S.combat.food = ev.target.value || null; ev.target.blur(); sideDirty = true; }
});

/* =============================================================== toasts */
notify = (msg, cls) => {
  const box = $('#toasts');
  const el = document.createElement('div');
  el.className = 'toast ' + (cls || '');
  el.textContent = msg;
  box.appendChild(el);
  while (box.children.length > 3) box.firstChild.remove();
  setTimeout(() => { el.classList.add('out'); setTimeout(() => el.remove(), 400); }, 3200);
};

/* =============================================================== boot / loop */
function saveGame() { try { localStorage.setItem(SAVE_KEY, serialize()); } catch (e) { /* storage unavailable */ } }

function showOffline(secs, before) {
  const after = snapshot();
  const lines = [];
  const dg = after.gold - before.gold;
  if (dg) lines.push(`<div><span>🪙 Gold</span><b class="${dg > 0 ? 'pos' : 'neg'}">${dg > 0 ? '+' : ''}${fmt(dg)}</b></div>`);
  for (const k in after.levels) if (after.levels[k] > before.levels[k]) lines.push(`<div><span>${SKILLS[k].icon} ${SKILLS[k].name}</span><b class="pos">Lv ${before.levels[k]} → ${after.levels[k]}</b></div>`);
  if (after.kills > before.kills) lines.push(`<div><span>⚔️ Foes defeated</span><b class="pos">+${fmt(after.kills - before.kills)}</b></div>`);
  if (after.train > before.train) lines.push(`<div><span>🔋 Training levels</span><b class="pos">+${fmt(after.train - before.train)}</b></div>`);
  for (const id of new Set([...Object.keys(before.items), ...Object.keys(after.items)])) {
    const d = (after.items[id] || 0) - (before.items[id] || 0);
    if (d) lines.push(`<div><span>${ITEMS[id].icon} ${ITEMS[id].name}</span><b class="${d > 0 ? 'pos' : 'neg'}">${d > 0 ? '+' : ''}${fmt(d)}</b></div>`);
  }
  $('#modal-body').innerHTML = `<div class="kicker" style="--realm:var(--hot)">WHILE YOU WERE AWAY · ${fmtTime(secs)}</div><h2>Welcome back!</h2>
    <div class="offline-list">${lines.join('') || '<div><span>Nothing happened — you were idle. Start an activity before leaving!</span></div>'}</div>`;
  $('#modal').classList.add('show');
}

let lastTopKey = '';
function boot() {
  let raw = null;
  try { raw = localStorage.getItem(SAVE_KEY); } catch (e) { /* ignore */ }
  if (raw) { try { loadFrom(raw); } catch (e) { S = defaultState(); } }
  else { S = defaultState(); S.combat.hp = pMaxHp(); }
  normalizeView();

  const away = (Date.now() - S.last) / 1000;
  if (away > 30) {
    const secs = offlineSeconds(away), before = snapshot();
    SIM = true; advance(secs); SIM = false;
    showOffline(secs, before);
  }
  S.last = Date.now();
  lastTick = Date.now();
  lastUnlocked = ZONES.filter((z, i) => zoneUnlocked(i)).length;
  lastGold = Math.floor(S.gold);
  Object.keys(S.items).forEach((k) => seenItems.add(k));
  render();
  renderFeed();

  function frame() {
    catchUp();
    const busy = document.activeElement && ['SELECT', 'TEXTAREA'].includes(document.activeElement.tagName);
    if (dirty && !busy) render();
    else {
      const key = (S.action ? S.action.skill + S.action.id : '') + '|' + S.combat.zone;
      if (key !== lastTopKey || sideDirty) { lastTopKey = key; sideDirty = false; renderSide(); renderRail(); }
      update();
    }
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
  // Background tabs: desktop browsers still run timers (throttled), so keep simulating.
  setInterval(() => { if (document.hidden) catchUp(); }, 1000);
  setInterval(saveGame, 10000);
  // Mobile browsers freeze or kill hidden pages and rarely fire beforeunload:
  // save the moment the page is hidden, and summarize the gap when it comes back.
  document.addEventListener('visibilitychange', () => {
    catchUp();
    if (document.hidden) { hiddenAt = Date.now(); hiddenSnap = snapshot(); saveGame(); }
    else if (hiddenSnap) {
      const away = (Date.now() - hiddenAt) / 1000;
      if (away > 60 && !$('#modal').classList.contains('show')) showOffline(offlineSeconds(away), hiddenSnap);
      hiddenSnap = null;
    }
  });
  window.addEventListener('pagehide', saveGame);
  window.addEventListener('beforeunload', saveGame);
  $('#modal-close').addEventListener('click', () => $('#modal').classList.remove('show'));
}

// Wall-clock simulation: works no matter how long frames, timers or the whole page were paused.
let lastTick = Date.now(), hiddenAt = 0, hiddenSnap = null;
function catchUp() {
  const now = Date.now(), dt = (now - lastTick) / 1000;
  lastTick = now;
  if (dt > 5) { SIM = true; advance(offlineSeconds(dt)); SIM = false; dirty = true; }
  else if (dt > 0) step(dt);
}

// "Install app" support (Android / desktop Chrome & Edge). iOS uses Share → Add to Home Screen.
let installPrompt = null;
const isStandalone = () => matchMedia('(display-mode: standalone)').matches || navigator.standalone === true;
window.addEventListener('beforeinstallprompt', (e) => { e.preventDefault(); installPrompt = e; dirty = true; });
window.addEventListener('appinstalled', () => { installPrompt = null; toast('Installed! Launch Tri-Realm from your home screen.', 'good'); dirty = true; });

boot();
