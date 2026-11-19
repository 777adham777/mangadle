'use strict';
/* ==========================================================================
   TRI-REALM IDLE — battle arena
   A side-on fighting stage: a HUD with both health bars on top, and a floor
   where your stick figure and the foe stand facing each other.
   Humanoid foes are stick figures dressed in their own colours and gear;
   beasts and monsters are drawn creatures (creatures.js).
   The foe's HUD reads its kit (foes.js): role, weakness, traits, statuses,
   the move it is winding up, boss phases and shield.
   Loaded after avatar.js and creatures.js, before ui-systems.js.
   ========================================================================== */

// Enemy name keyword -> how that foe is dressed. First match wins.
// over: avatar cosmetics (ink = skin colour); weapon: item id drawn in hand ('' = bare hands).
const FOE_LOOKS = [
  [/Admiral/,              { outfit: 'uniform', hair: 'mop', hat: 'tricorn', face: 'fierce', back: 'coat', build: 'stout', ink: '#3c5f9e' }, 'stormcaller'],
  [/Corsair/,              { outfit: 'corsair', hair: 'mop', hat: 'bandana', face: 'patch', back: 'coat', ink: '#7a4a9a' }, 'corsair_cutlass'],
  [/Cannon Brute/,         { outfit: 'corsair', hair: 'tuft', hat: 'bandana', face: 'fierce', build: 'stout', ink: '#a0623a' }, 'hand_cannon'],
  [/Navy Recruit/,         { outfit: 'tee', hair: 'tuft', hat: 'bucket', face: 'dots', ink: '#5a8ac0' }, 'rusty_cutlass'],
  [/Merfolk/,              { outfit: 'none', hair: 'mop', face: 'fierce', build: 'stout', ink: '#2fa3a0' }, 'power_gauntlets'],
  [/Bandit Thug/,          { outfit: 'tee', hair: 'tuft', hat: 'bandana', face: 'scar', ink: '#a8704a' }, 'iron_wakizashi'],
  [/Rogue Apprentice/,     { outfit: 'shinobi', hair: 'spikes', hat: 'hood', face: 'mask', build: 'slim', ink: '#56688c' }, 'crystal_kunai'],
  [/Mist Assassin/,        { outfit: 'shinobi', hair: 'tuft', hat: 'hood', face: 'mask', back: 'scarf', build: 'slim', ink: '#8a9ab8' }, 'ashen_fang'],
  [/Masked Lancer/,        { outfit: 'reaper', hair: 'ember', face: 'husk', back: 'shroud', ink: '#43375a' }, 'bone_lance'],
  [/Bone Priest/,          { outfit: 'reaper', hat: 'horns', face: 'husk', back: 'shroud', ink: '#56446a' }, 'wraith_sickle'],
  [/Masked Sovereign/,     { outfit: 'reaper', hair: 'ember', hat: 'horns', face: 'husk', back: 'shroud', build: 'tall', aura: 'wisps', ink: '#2c2140' }, 'sovereign_blade'],
  [/Wasteland Brawler/,    { outfit: 'gi', hair: 'tuft', hat: 'martial', face: 'fierce', build: 'stout', ink: '#b07a44' }, 'power_gauntlets'],
  [/Elite Soldier/,        { outfit: 'gi', hair: 'spikes', hat: 'martial', face: 'scar', ink: '#4f72a8' }, 'power_gauntlets'],
  [/Armored Commander/,    { outfit: 'gi', hat: 'martial', face: 'scar', back: 'coat', build: 'stout', ink: '#7462a0' }, 'black_warhammer'],
  [/Horned Mutant/,        { outfit: 'none', hat: 'horns', face: 'fierce', build: 'stout', ink: '#9a3f66' }, ''],
  [/Crimson Tyrant/,       { outfit: 'gi', hair: 'flame', hat: 'horns', face: 'fierce', back: 'mantle', build: 'stout', aura: 'embers', ink: '#c0303f' }, 'power_gauntlets'],
  [/Hollow Sorcerer/,      { outfit: 'uniform', hair: 'swept', hat: 'talisman', face: 'cursed', back: 'shroud', ink: '#43306a' }, 'wraith_sickle'],
  [/Bound Corpse/,         { outfit: 'tee', hat: 'talisman', face: 'blank', ink: '#76887a' }, ''],
  [/Veil Walker/,          { outfit: 'uniform', hair: 'frost', face: 'cursed', back: 'shroud', build: 'tall', ink: '#52649a' }, 'cursed_cleaver'],
  [/Cursed Matriarch/,     { outfit: 'uniform', hair: 'frost', hat: 'talisman', face: 'cursed', back: 'sigil', build: 'tall', aura: 'smoke', ink: '#6a2f7a' }, 'cursed_cleaver'],
  [/Rival Examinee/,       { outfit: 'wilds', hair: 'wild', hat: 'beast', face: 'paint', back: 'quiver', build: 'slim', ink: '#4f8a40' }, 'sunforged_bow'],
  [/Bandit Hunter/,        { outfit: 'wilds', hair: 'mop', hat: 'beast', face: 'scar', back: 'quiver', ink: '#8a6230' }, 'sunforged_bow'],
  [/Masked Vampire/,       { outfit: 'longcoat', hair: 'swept', face: 'marble', back: 'shroud', build: 'slim', ink: '#6a1f30' }, 'eclipse_blade'],
  [/Sunlight Monk/,        { outfit: 'gi', hat: 'martial', face: 'dots', ink: '#d0943a', aura: 'embers' }, 'power_gauntlets'],
  [/Echo Thief/,           { outfit: 'longcoat', hair: 'swept', hat: 'laurel', face: 'marble', build: 'slim', ink: '#62629a' }, 'crystal_kunai'],
  [/Wind Pillar Guard/,    { outfit: 'none', hair: 'swept', hat: 'laurel', face: 'fierce', ink: '#4a9a9a' }, 'bone_lance'],
  [/Pillar Warrior/,       { outfit: 'none', hair: 'tuft', hat: 'laurel', face: 'fierce', build: 'stout', ink: '#9a7450' }, 'bone_lance'],
  [/Pillar Lord/,          { outfit: 'longcoat', hair: 'swept', hat: 'laurel', face: 'marble', back: 'wings', build: 'tall', aura: 'echo', ink: '#84409a' }, 'eclipse_blade'],
  [/Rift Emperor/,         { outfit: 'riftwear', hair: 'crest', hat: 'crown', face: 'rifteye', back: 'mantle', build: 'tall', aura: 'storm', ink: '#8b2bd6' }, 'rift_cleaver'],
];
function foeLook(e, realm) {
  const name = e.base || e.name;
  const m = FOE_LOOKS.find(([re]) => re.test(name));
  if (!m) return null;
  const base = (REALMS[realm] && REALMS[realm].color) || '#ff5d73';
  const over = Object.assign({ style: 'flat', color: 'chalk', hat: 'none', face: 'fierce', back: 'none', aura: 'none', build: 'athletic', stance: 'relaxed', hair: 'none', outfit: 'none', ink: shade(base, -0.32) }, m[1]);
  if (e.rank === 2 && over.aura === 'none') over.aura = 'embers';      // an Alpha burns with power
  return { over, weapon: ITEMS[m[2]] ? m[2] : '' };
}
const ELEM_ICON = { fire: 'fire', lightning: 'lightning-trio', wind: 'wingfoot', bleed: 'fangs', drain: 'heart-plus' };
const ELEM_NAME = { fire: 'Fire', lightning: 'Lightning', wind: 'Wind', bleed: 'Bleed', drain: 'Drain' };
// Foe portrait: its drawn creature, its dressed stick figure, or its icon.
function foeArtHTML(e, realm, opts) {
  const n = e.base || e.name;
  if (creatureOf(n)) return creatureSVG(n, opts);
  const look = foeLook(e, realm);
  return look ? avatarSVG(look.over, Object.assign({ ctx: 'enemy', flip: true, weapon: look.weapon }, opts && opts.still ? { still: true } : {})) : `<span class="creature">${ic('enemy', n)}</span>`;
}

/* ------------------------------------------------------------- markup */
const foeAv = () => document.querySelector('[data-portrait="enemy"] svg.avatar');
const foeCr = () => document.querySelector('[data-portrait="enemy"] svg.cr');
const meFighter = () => document.querySelector('.ar-floor .fighter.me');
const foeFighter = () => document.querySelector('.ar-floor .fighter.enemy');
// A chip: icon + short label, tooltip on hover.
const chip = (icon, label, tip, cls) => `<span class="fchip ${cls || ''}" title="${esc(tip)}">${gi(icon)}${label ? `<em>${esc(label)}</em>` : ''}</span>`;
function foeTagsHTML(e) {
  const K = kitOf(e);
  if (!K) return '';
  const R = ROLES[K.role], out = [chip(R.icon, R.name, `Role: ${R.name}`, 'role')];
  if (K.weak) out.push(chip(ELEM_ICON[K.weak], 'Weak', `Weak to ${ELEM_NAME[K.weak]}: techniques with that tag, and a weapon awakened to it, deal +${pct(WEAK_MULT - 1)}`, 'weak'));
  if (K.resist) out.push(chip(ELEM_ICON[K.resist], 'Resists', `Resists ${ELEM_NAME[K.resist]}: ${pct(1 - RESIST_MULT)} less damage from it`, 'resist'));
  const tr = Object.assign({}, K.trait ? { [K.trait[0]]: K.trait[1] } : {});
  for (const [id, x] of S.combat.affix || []) tr[id] = x;
  for (const id in tr) out.push(chip(TRAITS[id].icon, TRAITS[id].name, TRAITS[id].desc(tr[id]), (S.combat.affix || []).some((a) => a[0] === id) ? 'affix' : 'trait'));
  return out.join('');
}
function stageHTML() {
  const C = S.combat, e = curEnemy(), z = C.zone != null ? ZONES[C.zone] : null;
  const realm = z ? z.realm : WORLD_ORDER[0];
  const meHud = `<div class="fhud me f-body"><div class="f-name"><b>You</b><span class="f-stats"><span title="Max hit">${ui('atk')}${fmt(pMaxHit())}</span><span title="Defense">${ui('def')}${fmt(pDef())}</span><span title="Attack speed">${ui('spd')}${pSpeed().toFixed(1)}s</span>${pDodge() ? `<span title="Dodge">${ui('dodge')}${pct(pDodge())}</span>` : ''}</span></div>
      <div class="hpbar"><i data-php></i><span data-phptext></span></div><div class="atkbar"><i data-patk></i></div><div class="stchips" data-pst></div>${uix('stageMe')}</div>`;
  let foeHud = '', foe = '';
  if (!z) foe = `<div class="f-empty">${ui('map')}<b>Choose a stage</b><small>Start with an <em>Easy</em> one in the list.</small></div>`;
  else if (!e) foe = `<div class="f-empty searching">${ui('battle')}<b>Searching for a foe…</b></div>`;
  else {
    const boss = z.boss, K = kitOf(e), n = e.base || e.name, cr = creatureOf(n);
    const ticks = K && K.phases ? '<s style="left:66%"></s><s style="left:33%"></s>' : '';
    foeHud = `<div class="fhud enemy f-body ${boss ? 'boss' : ''}"><div class="f-name"><b>${boss ? '<span class="boss-tag">Boss</span>' : e.rank ? `<span class="boss-tag ${e.rank === 2 ? '' : 'elite'}">${e.rank === 2 ? 'Mini-boss' : 'Elite'}</span>` : ''}${e.name}</b><span class="f-stats"><span title="Max hit">${ui('atk')}${fmt(e.atk)}</span><span title="Defense">${ui('def')}${fmt(e.def)}</span><span title="Attack speed">${ui('spd')}${e.spd}s</span></span></div>
      <div class="hpbar enemy"><i data-ehp></i><b class="shieldbar" data-eshield></b>${ticks}<span data-ehptext></span></div>
      <div class="castbar" data-ecast><div class="atkbar enemy"><i data-eatk></i></div><span data-ecastname></span></div>
      <div class="ftags">${foeTagsHTML(e)}</div><div class="stchips foe" data-est></div>
      <div class="drops">${e.drops.map(([id, ch]) => tile(id, fmtRate(ch < 0.2 ? ch * luckMult() : ch), { cls: 'xs ' + (id !== 'FRUIT' && !S.found[id] ? 'dim' : '') })).join('')}${tile(null, fmt(e.gold[0]) + '+', { r: 3, icon: ui('gold'), cls: 'xs', title: 'Gold' })}</div></div>`;
    const size = cr && cr[1].size ? cr[1].size : 1;
    foe = `<div class="fighter enemy enter ${boss ? 'boss' : ''} ${cr ? 'foe-cr' : foeLook(e, realm) ? 'foe-stick' : 'foe-beast'} ${e.rank ? 'rank' + e.rank : ''}" style="--sz:${size}"><div class="f-art" data-portrait="enemy">${foeArtHTML(e, realm)}</div><div class="windmark">!</div></div>`;
  }
  return `<div class="ar-hud">${meHud}<div class="vs"><span>VS</span></div>${foeHud || '<div class="fhud-empty"></div>'}</div>
    <div class="ar-floor" style="--rc:${rc(realm)}">
      <div class="fighter me"><div class="f-art av-art" data-portrait="player">${avatarSVG(null, { ctx: 'battle' })}</div><div class="stunmark">${gi('circle-sparks')}</div></div>
      ${foe}
    </div>`;
}

/* ------------------------------------------------------------- live HUD */
// Your running technique effects, shown with the foes' statuses (one common strip).
const FX_VIEW = {
  mist: ['dodge', 'Mist Step', 'Dodge chance'], skin: ['shield', 'Iron Skin', 'Less damage taken'], fore: ['all-seeing-eye', 'Foresight', 'Dodge chance'],
  ward: ['soul', 'Soul Ward', 'Less damage taken'], cshield: ['shield', 'Chain Shield', 'Less damage taken'], regen: ['heart-plus', 'Regeneration', 'Recovering HP'],
  scarlet: ['third-eye', 'Scarlet Eyes', 'Techniques stronger'], domain: ['magic-swirl', 'Domain', 'Domain Expansion open'],
};
const FX_ON_FOE = { mark: ['tied-scroll', 'Sealed', 'Takes more damage'], chain: ['spider-web', 'Chained', 'Deals less damage'], burn: ['fire', 'Burning', 'Burns every second'], puppet: ['puppet', 'Puppet Thread', 'Attacks slower'] };
const secs = (t) => (t > 999 ? '' : Math.ceil(t) + 's');
function stChips(side) {
  const out = [];
  for (const id in RT.st[side]) {
    const s = RT.st[side][id], D = STATUS[id];
    if (!s || s.t <= 0) continue;
    const label = id === 'shield' ? fmt(s.v) : (s.n > 1 ? '×' + s.n + ' ' : '') + secs(s.t);
    out.push(`<span class="stchip ${D.bad ? 'bad' : 'buff'} st-${id}" title="${esc(D.name + ': ' + D.desc)}">${gi(D.icon)}${esc(D.name)}${label ? `<b>${label}</b>` : ''}</span>`);
  }
  const fx = side === 'p' ? FX_VIEW : FX_ON_FOE;
  for (const k in fx) if ((RT.fx[k] || 0) > 0) out.push(`<span class="stchip tech" title="${esc(fx[k][1] + ': ' + fx[k][2])}">${gi(fx[k][0])}${esc(fx[k][1])}<b>${secs(RT.fx[k])}</b></span>`);
  return out.join('');
}
let stSig = '';
UPD.push(() => {
  const pBox = document.querySelector('[data-pst]');
  if (!pBox) return;
  const eBox = document.querySelector('[data-est]');
  const p = stChips('p'), e = eBox ? stChips('e') : '';
  if (p + e !== stSig) { stSig = p + e; pBox.innerHTML = p; if (eBox) eBox.innerHTML = e; }
  const me = meFighter();
  if (me) me.classList.toggle('stunned', stOn('p', 'stun'));
  const C = S.combat, foe = curEnemy(), cast = document.querySelector('[data-ecast]');
  if (cast && foe) {
    const m = RT.foe.next, wind = !!(m && m.tele);
    cast.classList.toggle('winding', wind);
    const ff = foeFighter();
    if (ff) ff.classList.toggle('winding', wind);
    setText(cast.querySelector('[data-ecastname]'), wind ? m.name : '');
    const sh = stOf('e', 'shield'), bar = document.querySelector('[data-eshield]');
    if (bar) bar.style.width = sh && sh.t > 0 && sh.v > 0 ? Math.min(100, (sh.v / foe.hp) * 100) + '%' : '0';
  }
});

/* ------------------------------------------------------------- reactions */
// Attacker lunges across the floor; the foe strikes / recoils / falls.
on('hit', (d) => {
  if (d.dot) return;
  if (d.target === 'enemy') {
    retrigger(meFighter(), 'lunge');
    if (!d.dodge) setTimeout(() => avPlay(foeAv(), [['hurt', 90, 'out'], ['hurt', 140], ['guard', 300]]), 160);
  } else {
    retrigger(foeFighter(), 'lunge');
    avPlay(foeAv(), nextAttack());
    retrigger(foeCr(), 'atk');
  }
});
on('kill', () => {
  const f = foeFighter();
  if (!f) return;
  avPlay(foeAv(), [['hurt', 120, 'out'], ['hurt', 2000]]);
  f.classList.add('down');
});
on('foemove', (d) => {
  if (!inBattleView()) return;
  floatAt($('[data-portrait="enemy"]'), `<small>${esc(d.m.name)}</small>`, 'move', 0, -50);
  retrigger(foeFighter(), 'special');
});
on('foeheal', (d) => { if (inBattleView() && d.amt > 0) floatAt($('[data-portrait="enemy"]'), `+${fmt(d.amt)}${ui('hp')}`, 'heal', 30, -10); });
on('status', (d) => {
  if (!inBattleView()) return;
  if (d.broke) { floatAt($('[data-portrait="enemy"]'), '<small>Shield broken</small>', 'move', 0, -20); return; }
  if (d.side === 'p' && d.add) floatAt($('[data-portrait="player"]'), `${gi(STATUS[d.id].icon)}<small>${esc(STATUS[d.id].name)}</small>`, 'st st-' + d.id, 0, -60);
});
on('phase', (d) => {
  if (!inBattleView()) return;
  const st = $('#stage');
  if (!st) return;
  const b = document.createElement('div');
  b.className = 'phase-banner';
  b.innerHTML = `<small>Phase ${['', 'I', 'II', 'III'][d.n] || d.n}</small><b>${esc(d.name)}</b>`;
  st.appendChild(b);
  setTimeout(() => b.remove(), 2200);
  retrigger(foeFighter(), 'special');
});

/* ------------------------------------------------------------- bestiary page */
// What a move does, in a few words.
function moveText(m) {
  const p = [];
  if (m.m) p.push(m.n > 1 ? `${m.n} hits of ${m.m}×` : `${m.m}× hit`);
  if (m.tele) p.push('telegraphed');
  if (m.pierce) p.push(`ignores ${pct(m.pierce)} of your defense`);
  if (m.st) p.push(`${STATUS[m.st[0]].name} ${m.st[1]}s`);
  if (m.stun) p.push(`stuns ${m.stun}s`);
  if (m.drain) p.push(`heals from the damage`);
  if (m.self) p.push(`gains ${STATUS[m.self[0]].name}${m.self[0] === 'shield' ? ` (${pct(m.self[2])} HP)` : m.self[1] && m.self[1] < 99 ? ` ${m.self[1]}s` : ''}`);
  if (m.heal) p.push(`heals ${pct(m.heal)} of its HP`);
  return p.join(' · ');
}
function foeDetailHTML(name) {
  let e = null, z = null;
  for (const zz of ZONES) for (const x of zz.enemies) if (!e && x.name === name) { e = x; z = zz; }
  if (!e) return '';
  const K = kitOf(e), seen = (S.stats.foes || {})[name];
  const art = `<div class="bst-art ${seen ? '' : 'unknown'}" style="--rc:${rc(z.realm)}">${foeArtHTML(e, z.realm, { still: true })}</div>`;
  if (!seen) return `${art}<div class="bst-info"><small class="bst-sub">${esc(REALMS[z.realm].name)} · ${esc(z.name)}</small><h3>???</h3><p class="muted">Defeat it once to learn its moves.</p></div>`;
  const rows = [['atk', 'Max hit', fmt(e.atk)], ['def', 'Defense', fmt(e.def)], ['hp', 'HP', fmt(e.hp)], ['spd', 'Attacks every', e.spd + 's'], ['skull', 'Defeated', fmt(seen)]];
  let kitH = '';
  if (K) {
    const R = ROLES[K.role];
    const tags = [];
    if (K.weak) tags.push(chip(ELEM_ICON[K.weak], 'Weak: ' + ELEM_NAME[K.weak], `+${pct(WEAK_MULT - 1)} damage from it`, 'weak'));
    if (K.resist) tags.push(chip(ELEM_ICON[K.resist], 'Resists ' + ELEM_NAME[K.resist], `${pct(1 - RESIST_MULT)} less damage from it`, 'resist'));
    if (K.trait) tags.push(chip(TRAITS[K.trait[0]].icon, TRAITS[K.trait[0]].name, TRAITS[K.trait[0]].desc(K.trait[1]), 'trait'));
    const mvRow = (m, tag) => `<li><span>${tag ? `<em class="muted">${esc(tag)}</em>` : ''}<b>${esc(m.name)}</b><small>${esc(moveText(m))}</small></span></li>`;
    kitH = `<p class="lore">${esc(K.lore || '')}</p><div class="ftags">${chip(R.icon, R.name, 'Role', 'role')}${tags.join('')}</div>
      ${K.trait ? `<p class="muted small">${esc(TRAITS[K.trait[0]].desc(K.trait[1]))}</p>` : ''}
      ${hdr('Moves', 'its 2nd swing, then every 3rd')}<ul class="srcs bst-moves">${K.moves.map((m) => mvRow(m)).join('')}</ul>
      ${K.phases ? `${hdr('Phases', 'at 66% and 33% HP')}<ul class="srcs bst-moves">${K.phases.map((P, i) => `<li><span><em class="muted">${['II', 'III'][i]}</em><b>${esc(P.name)}</b><small>${esc(['Enraged', P.haste ? 'hasted' : '', P.shield ? `shield of ${pct(P.shield)} HP` : '', P.add ? `new move: ${P.add.name} (${moveText(P.add)})` : ''].filter(Boolean).join(' · '))}</small></span></li>`).join('')}</ul>` : ''}`;
  }
  return `${art}<div class="bst-info"><small class="bst-sub">${esc(REALMS[z.realm].name)} · ${esc(z.name)}${z.boss ? ' · Boss' : ''}</small><h3>${esc(name)}</h3>${kitH}</div>
    <div class="bst-stats">${attrList(rows)}</div>`;
}
