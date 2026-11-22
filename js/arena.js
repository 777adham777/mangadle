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
  [/Admiral/,              { outfit: 'uniform', hair: 'mop', hat: 'tricorn', face: 'fierce', back: 'coat', ink: '#3c5f9e' }, 'stormcaller'],
  [/Corsair/,              { outfit: 'corsair', hair: 'mop', hat: 'bandana', face: 'patch', back: 'coat', ink: '#7a4a9a' }, 'corsair_cutlass'],
  [/Cannon Brute/,         { outfit: 'corsair', hair: 'tuft', hat: 'bandana', face: 'fierce', ink: '#a0623a' }, 'hand_cannon'],
  [/Navy Recruit/,         { outfit: 'tee', hair: 'tuft', hat: 'bucket', face: 'dots', ink: '#5a8ac0' }, 'rusty_cutlass'],
  [/Merfolk/,              { outfit: 'none', hair: 'mop', face: 'fierce', ink: '#2fa3a0' }, 'power_gauntlets'],
  [/Bandit Thug/,          { outfit: 'tee', hair: 'tuft', hat: 'bandana', face: 'scar', ink: '#a8704a' }, 'iron_wakizashi'],
  [/Rogue Apprentice/,     { outfit: 'shinobi', hair: 'spikes', hat: 'hood', face: 'mask', ink: '#56688c' }, 'crystal_kunai'],
  [/Mist Assassin/,        { outfit: 'shinobi', hair: 'tuft', hat: 'hood', face: 'mask', back: 'scarf', ink: '#8a9ab8' }, 'ashen_fang'],
  [/Masked Lancer/,        { outfit: 'reaper', hair: 'ember', face: 'husk', back: 'shroud', ink: '#43375a' }, 'bone_lance'],
  [/Bone Priest/,          { outfit: 'reaper', hat: 'horns', face: 'husk', back: 'shroud', ink: '#56446a' }, 'wraith_sickle'],
  [/Masked Sovereign/,     { outfit: 'reaper', hair: 'ember', hat: 'horns', face: 'husk', back: 'shroud', aura: 'wisps', ink: '#2c2140' }, 'sovereign_blade'],
  [/Wasteland Brawler/,    { outfit: 'gi', hair: 'tuft', hat: 'martial', face: 'fierce', ink: '#b07a44' }, 'power_gauntlets'],
  [/Elite Soldier/,        { outfit: 'gi', hair: 'spikes', hat: 'martial', face: 'scar', ink: '#4f72a8' }, 'power_gauntlets'],
  [/Armored Commander/,    { outfit: 'gi', hat: 'martial', face: 'scar', back: 'coat', ink: '#7462a0' }, 'black_warhammer'],
  [/Horned Mutant/,        { outfit: 'none', hat: 'horns', face: 'fierce', ink: '#9a3f66' }, ''],
  [/Crimson Tyrant/,       { outfit: 'gi', hair: 'flame', hat: 'horns', face: 'fierce', back: 'mantle', aura: 'embers', ink: '#c0303f' }, 'power_gauntlets'],
  [/Hollow Sorcerer/,      { outfit: 'uniform', hair: 'swept', hat: 'talisman', face: 'cursed', back: 'shroud', ink: '#43306a' }, 'wraith_sickle'],
  [/Bound Corpse/,         { outfit: 'tee', hat: 'talisman', face: 'blank', ink: '#76887a' }, ''],
  [/Veil Walker/,          { outfit: 'uniform', hair: 'frost', face: 'cursed', back: 'shroud', ink: '#52649a' }, 'cursed_cleaver'],
  [/Cursed Matriarch/,     { outfit: 'uniform', hair: 'frost', hat: 'talisman', face: 'cursed', back: 'sigil', aura: 'smoke', ink: '#6a2f7a' }, 'cursed_cleaver'],
  [/Rival Examinee/,       { outfit: 'wilds', hair: 'wild', hat: 'beast', face: 'paint', back: 'quiver', ink: '#4f8a40' }, 'sunforged_bow'],
  [/Bandit Hunter/,        { outfit: 'wilds', hair: 'mop', hat: 'beast', face: 'scar', back: 'quiver', ink: '#8a6230' }, 'sunforged_bow'],
  [/Masked Vampire/,       { outfit: 'longcoat', hair: 'swept', face: 'marble', back: 'shroud', ink: '#6a1f30' }, 'eclipse_blade'],
  [/Sunlight Monk/,        { outfit: 'gi', hat: 'martial', face: 'dots', ink: '#d0943a', aura: 'embers' }, 'power_gauntlets'],
  [/Echo Thief/,           { outfit: 'longcoat', hair: 'swept', hat: 'laurel', face: 'marble', ink: '#62629a' }, 'crystal_kunai'],
  [/Wind Pillar Guard/,    { outfit: 'none', hair: 'swept', hat: 'laurel', face: 'fierce', ink: '#4a9a9a' }, 'bone_lance'],
  [/Pillar Warrior/,       { outfit: 'none', hair: 'tuft', hat: 'laurel', face: 'fierce', ink: '#9a7450' }, 'bone_lance'],
  [/Pillar Lord/,          { outfit: 'longcoat', hair: 'swept', hat: 'laurel', face: 'marble', back: 'wings', aura: 'echo', ink: '#84409a' }, 'eclipse_blade'],
  [/Rift Emperor/,         { outfit: 'riftwear', hair: 'crest', hat: 'crown', face: 'rifteye', back: 'mantle', aura: 'storm', ink: '#8b2bd6' }, 'rift_cleaver'],
];
function foeLook(e, realm) {
  const name = e.base || e.name;
  const m = FOE_LOOKS.find(([re]) => re.test(name));
  if (!m) return null;
  const base = (REALMS[realm] && REALMS[realm].color) || '#ff5d73';
  const over = Object.assign({ style: 'flat', color: 'chalk', hat: 'none', face: 'fierce', back: 'none', aura: 'none', stance: 'relaxed', hair: 'none', top: 'none', bottom: 'none', ink: shade(base, -0.32) }, m[1]);
  if (over.outfit) { over.top = over.bottom = over.outfit; delete over.outfit; }
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
// Idle life on the floor: motes drifting up in the stage's colour, dust stirring at the fighters' feet (CSS only).
const CB_AMB = [...Array(9)].map((_, i) => `<i style="left:${(i * 11.3 + 4) % 100}%;--d:${(6 + (i * 1.7) % 5).toFixed(1)}s;animation-delay:${(-i * 1.37).toFixed(2)}s;--sx:${i % 2 ? 18 : -14}px"></i>`).join('')
  + '<b class="cb-dust me"></b><b class="cb-dust foe"></b>';
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
      <div class="cb-amb" aria-hidden="true">${CB_AMB}</div>
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

/* ------------------------------------------------------------- reactions (combat animation pass) */
// Every blow reads as anticipation -> contact (a hit-stop) -> follow-through. The wind-up starts a moment
// BEFORE the blow lands (it watches the swing timers), so the contact frame lines up with the damage number.
// Each weapon family (avatar.js cbFam: blade, quick, heavy, spear, bow, gun, fist) swings its own way and
// leaves its own impact and particles; beasts lunge and claw. Crits and big hits get a bigger moment
// (larger impact, a flash, a small shake of the floor). Reduced motion: poses only, no dash/shake/flash/particles.
// pre: the wind-up (ends on the contact pose) · post: hit-stop + follow-through · fx: impact · extra: more impacts (ms after contact)
const CB_SEQ = {
  blade: [
    { pre: [['windup', 150, 'out'], ['strike', 50, 'in']], post: [['strike', 70], ['bladeFollow', 200, 'out']], fx: 'slash' },
    { pre: [['bladeLow', 150, 'out'], ['bladeRise', 50, 'in']], post: [['bladeRise', 90]], fx: 'rise' },
    { pre: [['windup', 150, 'out'], ['strike', 50, 'in']], post: [['strike', 70], ['bladeFollow', 200, 'out']], fx: 'slash' },
    { pre: [['coil', 150, 'out'], ['thrust', 50, 'in']], post: [['thrust', 90]], fx: 'pierce' },
  ],
  quick: [
    { pre: [['qCoil', 90, 'out'], ['qSlashA', 40, 'in']], post: [['qSlashA', 40], ['qSlashB', 70, 'out'], ['qSlashB', 60]], fx: 'x', extra: [110] },
    { pre: [['coil', 90, 'out'], ['thrust', 40, 'in']], post: [['thrust', 40], ['qSlashA', 70, 'out'], ['qSlashA', 50]], fx: 'x', extra: [110] },
  ],
  heavy: [
    { pre: [['hvRaise', 230, 'out'], ['hvRaise', 60], ['hvSlam', 60, 'in']], post: [['hvSlam', 140]], fx: 'smash' },
    { pre: [['windup', 200, 'out'], ['strike', 60, 'in']], post: [['strike', 110], ['bladeFollow', 220, 'out']], fx: 'smash' },
  ],
  spear: [
    { pre: [['spCoil', 170, 'out'], ['thrust', 50, 'in']], post: [['thrust', 90]], fx: 'pierce' },
    { pre: [['spCoil', 170, 'out'], ['thrust', 50, 'in']], post: [['thrust', 40], ['spCoil', 80, 'out'], ['thrust', 50, 'in'], ['thrust', 60]], fx: 'pierce', extra: [130] },
  ],
  bow: [{ pre: [['bowDraw', 280, 'out'], ['bowDraw', 50]], post: [['bowLoose', 40, 'in'], ['bowLoose', 220]], fx: 'arrow', proj: 'arrow', fly: 130 }],
  gun: [
    { pre: [['gunAim', 160, 'out'], ['gunAim', 30]], post: [['gunKick', 40, 'in'], ['gunKick', 90], ['gunAim', 150, 'out']], fx: 'shot', proj: 'bullet', fly: 70 },
    { pre: [['gunAim', 160, 'out'], ['gunAim', 30]], post: [['gunKick', 40, 'in'], ['gunAim', 60, 'out'], ['gunKick', 40, 'in'], ['gunKick', 90]], fx: 'shot', proj: 'bullet', fly: 70, extra: [100] },
  ],
  fist: [
    { pre: [['jab', 70, 'in']], post: [['jab', 40], ['cross', 80, 'in'], ['cross', 70]], fx: 'punch', extra: [120] },
    { pre: [['coil', 120, 'out'], ['upper', 60, 'in']], post: [['upper', 110]], fx: 'punch' },
    { pre: [['chamber', 130, 'out'], ['kick', 50, 'in']], post: [['kick', 100]], fx: 'punch' },
  ],
  beast: [{ pre: [], lead: 160, post: [], fx: 'claw' }],
};
for (const f in CB_SEQ) for (const v of CB_SEQ[f]) if (v.lead == null) v.lead = v.pre.reduce((a, s) => a + s[1], 0);
// how far in front of its own centre each family reaches (share of the fighter's width)
const CB_REACH = { blade: 0.42, quick: 0.3, heavy: 0.42, spear: 0.62, fist: 0.26, beast: 0.1 };
const cbOk = () => inBattleView() && !document.hidden && !!document.querySelector('.ar-floor');
const cbFloorEl = () => document.querySelector('.ar-floor');
// side 'p' (you) or 'e' (the foe): its drawing, its family, its fighter box
const cbArt = (side) => (side === 'p' ? playerAv() : foeAv() || foeCr() || document.querySelector('.ar-floor .fighter.enemy .creature'));
function cbFamOf(side) {
  if (side === 'p') return cbFam(S.equip && S.equip.weapon);
  const av = foeAv();
  return av ? cbFam(av.dataset.weapon) : 'beast';
}
const cbS = { p: { pre: 0, n: 0, v: null }, e: { pre: 0, n: 0, v: null } };
let cbBusy = 0, cbLastHit = 0;
function cbVar(side) {
  const st = cbS[side], fam = cbFamOf(side);
  if (side === 'p' && AV_EXT.attacks.length && st.n % 3 === 2) return { fam, pre: [], lead: 0, post: AV_EXT.attacks[Math.floor(st.n / 3) % AV_EXT.attacks.length], fx: 'slash' };
  const L = CB_SEQ[fam] || CB_SEQ.blade;
  return Object.assign({ fam }, L[st.n % L.length]);
}
const cbScale = (steps, k) => steps.map(([p, ms, e]) => [p, Math.max(16, Math.round(ms * k)), e]);
// a fighter's box inside the floor (layout box: unaffected by dashes)
function cbBox(side) {
  const f = side === 'p' ? meFighter() : foeFighter();
  if (!f) return null;
  return { x: f.offsetLeft, y: f.offsetTop, w: f.offsetWidth, h: f.offsetHeight, cx: f.offsetLeft + f.offsetWidth / 2, el: f };
}
// where blows land on a side, and where a shot leaves the attacker's hand
function cbHitAt(side) {
  const b = cbBox(side);
  if (!b) return [0, 0];
  if (side === 'p') return [b.cx + b.w * 0.08, b.y + b.h * 0.44];
  return foeAv() ? [b.cx - b.w * 0.06, b.y + b.h * 0.44] : [b.x + b.w * 0.32, b.y + b.h * 0.52];
}
function cbHandAt(side) {
  const b = cbBox(side);
  if (!b) return [0, 0];
  return side === 'p' ? [b.cx + b.w * 0.34, b.y + b.h * 0.42] : [b.cx - b.w * 0.34, b.y + b.h * 0.42];
}
// The attacker dashes in: still for most of the wind-up, a fast burst into contact, held through the hit-stop, eased back.
function cbDash(side, fam, lead, hold) {
  if (avCalm() || fam === 'bow' || fam === 'gun') return;
  const a = cbBox(side), o = cbBox(side === 'p' ? 'e' : 'p');
  if (!a || !o) return;
  const reach = (CB_REACH[fam] || 0.4) * a.w;
  let dx;
  if (side === 'p') dx = (foeAv() ? o.cx - o.w * 0.14 : o.x + o.w * 0.2) - a.cx - reach;
  else dx = foeAv() ? -(a.cx - (o.cx + o.w * 0.14) - reach) : -(a.x + a.w * 0.16 - (o.cx + o.w * 0.22));
  const lim = (cbFloorEl().offsetWidth || 600) * 0.5;
  dx = Math.max(-lim, Math.min(lim, dx));
  if (side === 'p' ? dx <= 4 : dx >= -4) return;
  const back = 240, T = lead + hold + back, s = Math.max(0, lead - 110) / T, c = lead / T, h = (lead + hold) / T;
  const tx = (x) => `translateX(${Math.round(x)}px)`;
  a.el.animate([{ transform: 'none', offset: 0 }, { transform: 'none', offset: s, easing: 'cubic-bezier(.55,0,.9,.45)' }, { transform: tx(dx), offset: c }, { transform: tx(dx), offset: h, easing: 'cubic-bezier(.2,.8,.3,1)' }, { transform: 'none', offset: 1 }], { duration: T });
}
// The struck drawing: a white flash and a knock-back.
function cbKnock(side, big, kind) {
  const el = cbArt(side);
  if (!el || !el.animate) return;
  if (!el.dataset.cbf) el.dataset.cbf = getComputedStyle(el).filter || 'none';
  const base = el.dataset.cbf === 'none' ? '' : el.dataset.cbf;
  const dir = side === 'p' ? -1 : 1, k = (big ? 13 : 7) * dir;
  const fl = (b) => ((b ? `brightness(${b}) ` : '') + base).trim() || 'none';
  if (avCalm()) { el.animate([{ filter: fl(1.8) }, { filter: fl(0) }], { duration: 180 }); return; }
  const sq = kind === 'smash' ? ' scale(1.04,0.93)' : '';
  el.animate([
    { transform: 'none', filter: fl(3) },
    { transform: `translateX(${k}px) skewX(${-dir * 4}deg)${sq}`, filter: fl(2.2), offset: 0.2 },
    { transform: `translateX(${k * 0.4}px)`, filter: fl(1.2), offset: 0.55 },
    { transform: 'none', filter: fl(0) },
  ], { duration: big ? 380 : 260, easing: 'cubic-bezier(.2,.7,.3,1)' });
}
// A small shake of the floor (big moments only), and a one-frame inverted "impact frame" for the biggest.
function cbShake(n) {
  const f = cbFloorEl();
  if (!f || avCalm()) return;
  const a = n || 5;
  f.animate([{ transform: 'none' }, { transform: `translate(${-a}px,${a * 0.4}px)` }, { transform: `translate(${a * 0.8}px,${-a * 0.4}px)` }, { transform: `translate(${-a * 0.5}px,${a * 0.2}px)` }, { transform: `translate(${a * 0.3}px,0)` }, { transform: 'none' }], { duration: 280, easing: 'ease-out' });
}
function cbImpactFrame() {
  const f = cbFloorEl();
  if (!f || avCalm()) return;
  f.animate([{ filter: 'invert(1) grayscale(1) contrast(1.8)' }, { filter: 'invert(1) grayscale(1) contrast(1.8)', offset: 0.55 }, { filter: 'none' }], { duration: 120 });
}
// ---- impact drawings (centred, 120x120; a hit on you is mirrored)
const cbStar = (n, r1, r2) => { const p = []; for (let i = 0; i < n * 2; i++) { const a = (i * Math.PI) / n - Math.PI / 2, r = i % 2 ? r2 : r1; p.push(`${(Math.cos(a) * r).toFixed(1)},${(Math.sin(a) * r).toFixed(1)}`); } return p.join(' '); };
const CB_ART = {
  slash: (c) => `<path d="M-56,-36 Q2,0 58,32 Q-4,-12 -56,-36Z" fill="${c}" opacity=".6" transform="scale(1.08)"/><path d="M-52,-32 Q0,-2 54,29 Q-4,-10 -52,-32Z" fill="#fff"/>`,
  rise: (c) => `<path d="M-56,36 Q2,0 58,-32 Q-4,12 -56,36Z" fill="${c}" opacity=".6" transform="scale(1.08)"/><path d="M-52,32 Q0,2 54,-29 Q-4,10 -52,32Z" fill="#fff"/>`,
  x: (c) => `<path d="M-46,-36 Q0,-4 46,34 Q-6,-12 -46,-36Z" fill="${c}" opacity=".7"/><path d="M-44,-33 Q0,-4 44,31 Q-4,-10 -44,-33Z" fill="#fff"/><path d="M-46,36 Q0,4 46,-34 Q-6,12 -46,36Z" fill="${c}" opacity=".7"/><path d="M-44,33 Q0,4 44,-31 Q-4,10 -44,33Z" fill="#fff"/>`,
  pierce: (c) => `<path d="M-60,0 L26,-9 L60,0 L26,9Z" fill="${c}" opacity=".6"/><path d="M-56,0 L28,-5 L56,0 L28,5Z" fill="#fff"/><polygon points="${cbStar(6, 22, 7)}" fill="#fff" stroke="${c}" stroke-width="2.5" transform="translate(30,0)"/>`,
  smash: (c) => `<circle r="40" fill="none" stroke="${c}" stroke-width="5" opacity=".7" class="cb-ring"/><polygon points="${cbStar(9, 52, 18)}" fill="#fff" stroke="${c}" stroke-width="3.5" stroke-linejoin="round"/>`,
  punch: (c) => `<circle r="30" fill="none" stroke="#fff" stroke-width="5" class="cb-ring"/><polygon points="${cbStar(8, 34, 13)}" fill="#fff" stroke="${c}" stroke-width="3" stroke-linejoin="round"/>`,
  arrow: (c) => `<polygon points="${cbStar(7, 26, 9)}" fill="#fff" stroke="${c}" stroke-width="2.5"/><path d="M-40,0 H6" stroke="#c9a46a" stroke-width="3"/><path d="M-40,0 l-6,-5 h5 l5,5 l-5,5 h-5z" fill="#e8443a"/>`,
  shot: () => `<circle cx="-8" cy="-6" r="13" fill="#d8d4cc" opacity=".5"/><polygon points="${cbStar(8, 24, 8)}" fill="#fff6d0" stroke="#ff9a2b" stroke-width="3"/>`,
  claw: (c) => [-16, 0, 16].map((d) => `<path d="M${-26 + d},-40 Q${-2 + d},-6 ${18 + d},38" fill="none" stroke="${c}" stroke-width="9" stroke-linecap="round" opacity=".7"/><path d="M${-26 + d},-40 Q${-2 + d},-6 ${18 + d},38" fill="none" stroke="#fff" stroke-width="3.5" stroke-linecap="round"/>`).join(''),
  magic: (c) => `<circle r="34" fill="none" stroke="${c}" stroke-width="5" class="cb-ring"/><polygon points="${cbStar(8, 38, 12)}" fill="#fff" stroke="${c}" stroke-width="3"/><circle r="12" fill="${c}" opacity=".7"/>`,
  fire: (c) => [0, 60, 120, 180, 240, 300].map((a) => `<path d="M0,0 Q-14,-26 0,-50 Q14,-26 0,0Z" fill="${c}" stroke="#ffe08a" stroke-width="2" transform="rotate(${a})"/>`).join('') + '<circle r="16" fill="#fff6c8"/>',
  shield: () => `<polygon points="${[0, 60, 120, 180, 240, 300].map((a) => `${(Math.cos(a * Math.PI / 180) * 40).toFixed(1)},${(Math.sin(a * Math.PI / 180) * 40).toFixed(1)}`).join(' ')}" fill="rgba(150,220,255,.25)" stroke="#bff0ff" stroke-width="4" class="cb-ring"/>`,
  whiff: () => '<path d="M-50,-10 Q0,-26 50,-12 M-40,8 Q4,-6 46,6" fill="none" stroke="#fff" stroke-width="2.5" stroke-linecap="round" opacity=".6"/>',
};
// particles per impact: [kind, count] (sparks fly with the blow; debris falls; dust and embers rise)
const CB_PARTS = { slash: [['spark', 5]], rise: [['spark', 5]], x: [['spark', 6]], pierce: [['spark', 4]], smash: [['debris', 5], ['dust', 3]], punch: [['spark', 4], ['dust', 2]],
  arrow: [['spark', 3], ['debris', 2]], shot: [['spark', 4], ['dust', 2]], claw: [['spark', 4]], magic: [['spark', 6]], fire: [['ember', 7]], shield: [['spark', 4]], whiff: [] };
let cbLive = 0;
function cbFx(x, y, kind, col, o) {
  o = o || {};
  const f = cbFloorEl();
  if (!f || cbLive > 8 || !CB_ART[kind]) return;
  const calm = avCalm(), big = !!o.big, dir = o.dir || 1;
  let parts = '';
  if (!calm) for (const [pk, n0] of CB_PARTS[kind] || []) {
    const n = Math.round(n0 * (big ? 1.7 : 1));
    for (let i = 0; i < n; i++) {
      const a = pk === 'spark' ? 30 + Math.random() * 120 : -60 + Math.random() * 120, r = (pk === 'spark' ? 34 : 22) + Math.random() * (big ? 46 : 28);
      const x2 = Math.round(Math.sin(a * Math.PI / 180) * r), y2 = Math.round(-Math.cos(a * Math.PI / 180) * r);
      parts += `<i class="cbp p-${pk}" style="--a:${Math.round(a)}deg;--r:${Math.round(-r)}px;--x:${x2}px;--y:${pk === 'debris' ? -Math.round(14 + Math.random() * 26) : y2}px;--d:${Math.round(320 + Math.random() * 260)}ms"></i>`;
    }
  }
  const el = document.createElement('div');
  el.className = `cbfx k-${kind}${big ? ' big' : ''}`;
  el.style.cssText = `left:${Math.round(x)}px;top:${Math.round(y)}px;--c:${col || '#fff'};--s:${dir};--rot:${Math.round(o.rot != null ? o.rot : Math.random() * 16 - 8)}deg`;
  el.innerHTML = `<svg viewBox="-60 -60 120 120">${CB_ART[kind](col || '#fff')}</svg>${parts}`;
  f.appendChild(el);
  cbLive++;
  setTimeout(() => { el.remove(); cbLive--; }, calm ? 420 : 720);
  if (big && !calm) {
    const fl = document.createElement('div');
    fl.className = 'cbflash';
    fl.style.cssText = `left:${Math.round(x)}px;top:${Math.round(y)}px`;
    f.appendChild(fl);
    setTimeout(() => fl.remove(), 260);
  }
}
// A projectile from one side to the other (arrow, bullet, kunai, cannonball, ki, aura orb, talisman).
const CB_PROJ = {
  arrow: '<svg viewBox="-24 -7 48 14"><path d="M-20,0 H15" stroke="#c9a46a" stroke-width="2.6"/><path d="M14,-4.5 L23,0 L14,4.5Z" fill="#dfe4ee" stroke="#111" stroke-width="1.2"/><path d="M-20,0 l-3,-5 h5 l3,5 l-3,5 h-5z" fill="#e8443a" stroke="#111" stroke-width="1"/></svg>',
  bullet: '<svg viewBox="-24 -7 48 14"><ellipse cx="14" cy="0" rx="11" ry="5.5" fill="#ffb23a" opacity=".45"/><ellipse cx="14" cy="0" rx="7" ry="3.4" fill="#fff6c8"/></svg>',
  kunai: '<svg viewBox="-24 -7 48 14"><path d="M-6,0 L10,-4 L22,0 L10,4Z" fill="#dfe4ee" stroke="#111" stroke-width="1.3"/><path d="M-16,-1.6 H-6 V1.6 H-16Z" fill="#5a3d26"/><circle cx="-19" cy="0" r="3" fill="none" stroke="#111" stroke-width="1.6"/></svg>',
  ball: '<svg viewBox="-24 -12 48 24"><circle cx="10" cy="0" r="11" fill="#ff9a3a" opacity=".45"/><circle cx="12" cy="0" r="8" fill="#2a2a30" stroke="#111" stroke-width="1.5"/><circle cx="9.5" cy="-3" r="2.2" fill="#8a8a95"/></svg>',
  ki: '<svg viewBox="-24 -16 48 32"><circle cx="8" r="15" fill="#7df9ff" opacity=".35"/><circle cx="9" r="10" fill="#bffcff"/><circle cx="10" r="5" fill="#fff"/></svg>',
  orb: '<svg viewBox="-24 -12 48 24"><circle cx="10" r="11" fill="#9be15d" opacity=".4"/><circle cx="11" r="6" fill="#e9ffd8"/></svg>',
  talisman: '<svg viewBox="-24 -12 48 24"><rect x="0" y="-10" width="13" height="20" rx="1" fill="#f4ecd4" stroke="#111" stroke-width="1.3"/><path d="M6.5,-6 v12 M3,-2 h7 M3,3 h7" stroke="#c42a2a" stroke-width="1.6"/></svg>',
};
function cbProj(from, kind, fly, delay) {
  if (avCalm()) return;
  const go = () => {
    const f = cbFloorEl();
    if (!f) return;
    const to = from === 'p' ? 'e' : 'p', [x0, y0] = cbHandAt(from), [x1, y1] = cbHitAt(to), s = from === 'p' ? 1 : -1;
    const el = document.createElement('div');
    el.className = `cbproj j-${kind}`;
    el.innerHTML = CB_PROJ[kind] || CB_PROJ.orb;
    f.appendChild(el);
    const arc = kind === 'ball' ? -34 : kind === 'arrow' ? -10 : 0;
    const T = (x, y, r) => `translate(${Math.round(x)}px,${Math.round(y)}px) scaleX(${s}) rotate(${r || 0}deg)`;
    const a = el.animate([{ transform: T(x0, y0, arc ? -12 : 0), opacity: 0.4 }, { transform: T((x0 + x1) / 2, (y0 + y1) / 2 + arc, 0), opacity: 1, offset: 0.5 }, { transform: T(x1, y1, arc ? 12 : 0), opacity: 1 }], { duration: fly, easing: 'linear' });
    a.onfinish = () => el.remove();
    setTimeout(() => el.remove(), fly + 200);
  };
  if (delay > 0) setTimeout(go, delay); else go();
}
// The damage number ui.js just made: its weight (size by share of HP), and it waits for the contact frame.
function cbFloat(delay, cls, i) {
  const box = document.getElementById('fx'), f = box && box.lastElementChild;
  if (!f || f.dataset.cb || !f.classList.contains('float')) return;
  f.dataset.cb = '1';
  if (cls) f.classList.add(...cls.split(' ').filter(Boolean));
  if (i) { f.style.left = parseFloat(f.style.left) + i * 16 + 'px'; f.style.top = parseFloat(f.style.top) - i * 14 + 'px'; }
  if (delay > 0) { const d = Math.min(650, Math.round(delay)); f.style.animationDelay = d + 'ms'; f.style.animationDuration = 1100 - d + 'ms'; }
}
const cbWeight = (share) => (share >= 0.2 ? 'cb-huge' : share >= 0.08 ? 'cb-big' : share < 0.02 ? 'cb-small' : '');
const cbCol = (side) => {
  if (side === 'e' && !foeAv()) return '#ff5d73';
  const id = side === 'p' ? S.equip && S.equip.weapon : foeAv().dataset.weapon;
  return id && ITEMS[id] ? RCOL[Math.min(6, rarity(id))] : '#ffd9a0';
};
// The defender reacts at the contact frame: hurt pose (big hits stagger), flash and knock-back, the impact.
function cbLand(att, v, d, at, big) {
  const def = att === 'p' ? 'e' : 'p';
  const go = () => {
    if (!cbOk()) return;
    const [x, y] = cbHitAt(def), dir = att === 'p' ? 1 : -1;
    if (d.dodge) {
      const av = def === 'p' ? playerAv() : foeAv();
      if (av) avPlay(av, [['dodge', 80, 'out'], ['dodge', 170]]);
      const el = cbArt(def);
      if (el && el.animate && !avCalm()) el.animate([{ transform: 'none', opacity: 1 }, { transform: `translateX(${18 * dir}px)`, opacity: 0.55, offset: 0.3 }, { transform: 'none', opacity: 1 }], { duration: 360, easing: 'cubic-bezier(.2,.8,.3,1)' });
      cbFx(x + 10 * dir, y, 'whiff', '#fff', { dir });
      return;
    }
    const kind = d.blocked && !d.label && d.dmg === d.blocked ? 'shield' : v.fx, col = kind === 'claw' ? '#ff4d5e' : v.col || cbCol(att);
    cbFx(x, y, kind, col, { big, dir });
    cbKnock(def, big, kind);
    const av = def === 'p' ? playerAv() : foeAv();
    if (av && kind !== 'shield' && !(def === 'e' && av.dataset.av === 'ko')) avPlay(av, big ? [['hurtBig', 60, 'out'], ['hurtBig', 180]] : [['hurt', 60, 'out'], ['hurt', 120]]);
    if (big) cbShake(big === 2 ? 7 : 5);
    for (const ms of v.extra || []) setTimeout(() => { if (!cbOk()) return; cbFx(x + 8 * dir, y - 10, kind, col, { dir }); cbKnock(def, false); }, ms);
    if (kind === 'smash') { const b = cbBox(def); if (b) cbFx(x, b.y + b.h * 0.9, 'smash', '#cfc4b4', { dir, rot: 0 }); }
  };
  if (at > 0) setTimeout(go, at); else go();
}
// The swing of one side: wind-up before the blow (from the swing timers), then contact + follow-through.
function cbPre(side, v, left) {
  const av = side === 'p' ? playerAv() : foeAv(), k = Math.min(1, Math.max(0.3, (left * 1000) / (v.lead || 1)));
  if (av && v.pre.length) avPlay(av, cbScale(v.pre, k));
  if (!av && side === 'e') { const c = foeCr(); if (c) c.classList.add('cb-coil'); }
  cbDash(side, v.fam, Math.round(v.lead * k), 120);
}
function cbSwing(side, d) {
  const st = cbS[side], now = performance.now(), av = side === 'p' ? playerAv() : foeAv();
  let v = st.pre && st.v && now - st.pre < st.v.lead + 320 ? st.v : null, lag = 0, seq = [];
  if (!v) {
    v = cbVar(side);
    lag = Math.min(90, v.lead);
    if (v.pre.length) seq = cbScale(v.pre, lag / v.lead);
    cbDash(side, v.fam, lag, 70);
  }
  st.pre = 0; st.v = null; st.n++;
  const e = curEnemy(), share = d.dmg ? d.dmg / (side === 'p' ? (e ? e.hp : 1e9) : pMaxHp()) : 0;
  const big = d.crit || share >= (side === 'p' ? 0.18 : 0.12) ? (share >= 0.3 ? 2 : 1) : 0;
  const post = v.post.map((s, i) => (i === 0 && big ? [s[0], s[1] + 50, s[2]] : s));
  if (av) avPlay(av, seq.concat(post));
  if (side === 'e' && !av) { const c = foeCr(); if (c) { c.classList.remove('cb-coil'); retrigger(c, 'atk'); } }
  if (v.proj) cbProj(side, v.proj, v.fly, lag);
  const at = lag + (v.proj && !avCalm() ? v.fly : 0);
  cbLand(side, v, d, at, big);
  return { at, big, share };
}
UPD.push(() => {
  const C = S.combat, e = curEnemy();
  if (!e || C.zone == null || C.enemy == null || !cbOk()) return;
  const now = performance.now();
  const ps = cbS.p, pv = ps.v || cbVar('p');
  // (the frame loop runs before the game step of the next frame: aim the contact ~1 frame later)
  if (C.pT > pv.lead / 1000 + 0.1) { ps.pre = 0; ps.v = null; }
  else if (!ps.pre && C.pT <= pv.lead / 1000 && !playerHeld() && now > cbBusy && C.pT > 0) { ps.pre = now; ps.v = pv; cbPre('p', pv, C.pT + 0.016); }
  const es = cbS.e, ev = es.v || cbVar('e');
  if (C.eT > ev.lead / 1000 + 0.1) { es.pre = 0; es.v = null; }
  else if (!es.pre && C.eT <= ev.lead / 1000 && C.eT > 0) { es.pre = now; es.v = ev; cbPre('e', ev, C.eT + 0.016); }
});

// ---- techniques: each kind has its own cast (a power-up into a big strike, a palm thrust that fires, a seal, an aura)
// [kind, colour, family or projectile]
const CB_TECH = {
  shadow_strike: ['melee', '#b07cff', 'quick'], reaper_slash: ['melee', '#8fa0ff', 'blade'], iron_fist: ['melee', '#ffcf5a', 'fist'], nen_enhance: ['melee', '#ffe46a', 'fist'],
  kunai_volley: ['proj', '#dfe9ff', 'kunai'], cannon_volley: ['proj', '#ff9a3a', 'ball'], ki_blast: ['proj', '#7df9ff', 'ki'], nen_emit: ['proj', '#9be15d', 'orb'],
  fire_lotus: ['blast', '#ff7a2b'],
  domain_blaze: ['domain', '#ff6a2b'], domain_storm: ['domain', '#7df9ff'], domain_garden: ['domain', '#ff3f6a'], domain_shrine: ['domain', '#9bffb0'],
  healing_palm: ['aura', '#7dffa0'], mist_step: ['aura', '#cfe3ff'], iron_skin: ['aura', '#c9d2dc'], foresight: ['aura', '#ffd27a'], soul_ward: ['aura', '#8fd0ff'], nen_conjure: ['aura', '#c8b0ff'], nen_special: ['aura', '#ff3a4a'],
  sealing_mark: ['seal', '#ffe46a'], spirit_chain: ['seal', '#8fa0ff'], nen_manip: ['seal', '#ff9ad8'],
};
const cbTech = (id) => CB_TECH[id] || [TECHNIQUES[id] && TECHNIQUES[id].tags.includes('melee') ? 'melee' : 'proj', '#ffd27a', 'orb'];
let cbT = { id: null, t0: 0, i: 0, at: 0 };
// A ring of energy (and the technique's glyph) on a side.
function cbRing(side, col, id, delay) {
  const go = () => {
    const f = cbFloorEl(), b = cbBox(side);
    if (!f || !b) return;
    const el = document.createElement('div');
    el.className = 'cbring';
    el.style.cssText = `left:${Math.round(b.cx)}px;top:${Math.round(b.y + b.h * 0.55)}px;--c:${col}`;
    el.innerHTML = `<i></i><i></i>${id ? `<b>${ic('technique', id)}</b>` : ''}`;
    f.appendChild(el);
    setTimeout(() => el.remove(), 1000);
  };
  if (delay > 0) setTimeout(go, delay); else go();
}
function cbDomain(col) {
  const f = cbFloorEl();
  if (!f) return;
  const el = document.createElement('div');
  el.className = 'cbdomain';
  el.style.setProperty('--c', col);
  f.appendChild(el);
  setTimeout(() => el.remove(), 1500);
}
// The body of the cast; returns when its first blow lands (ms).
function cbCast(id) {
  const [k, col, x] = cbTech(id), av = playerAv(), now = performance.now();
  let seq, at;
  if (k === 'melee') {
    const fam = CB_SEQ[x] ? x : 'blade', v = CB_SEQ[fam][id === 'nen_enhance' ? 1 : 0];
    seq = [['powerUp', 140, 'out']].concat(cbScale(v.pre, 0.8), v.post.map((s, i) => (i ? s : [s[0], s[1] + 60, s[2]])));
    at = 140 + Math.round(v.lead * 0.8);
    cbRing('p', col, null);
    cbDash('p', fam, at, 130);
  } else if (k === 'proj') { seq = [['cast', 110, 'out'], ['cast', 420]]; at = 260; }
  else if (k === 'blast') { seq = [['seal', 180, 'out'], ['cast', 70, 'in'], ['cast', 320]]; at = 300; cbRing('p', col, null); }
  else if (k === 'domain') { seq = [['powerUp', 260, 'out'], ['powerUp', 160], ['cast', 70, 'in'], ['cast', 300]]; at = 460; cbDomain(col); cbRing('p', col, id); }
  else if (k === 'seal') { seq = [['cast', 120, 'out'], ['cast', 320]]; at = 270; cbProj('p', 'talisman', 150, 120); cbRing('e', col, id, at); }
  else { const p = id === 'nen_special' ? 'powerUp' : 'seal'; seq = [[p, 140, 'out'], [p, 380]]; at = 120; cbRing('p', col, id, 100); }
  if (av) avPlay(av, seq);
  cbBusy = now + seq.reduce((a, s) => a + s[1], 0);
  cbS.p.pre = 0; cbS.p.v = null;
  return at;
}
function cbTechHit(id, d) {
  const now = performance.now();
  if (cbT.id !== id || now - cbT.t0 > 40) cbT = { id, t0: now, i: 0, at: cbCast(id) };
  const i = cbT.i++, [k, col, x] = cbTech(id), at = cbT.at + i * (k === 'proj' ? 90 : 80);
  if (k === 'proj') cbProj('p', CB_PROJ[x] ? x : 'orb', 150, at - 150);
  const e = curEnemy(), share = e && d.dmg ? d.dmg / e.hp : 0, big = i === 0 && (d.label || share >= 0.15) ? (share >= 0.3 ? 2 : 1) : 0;
  const fx = k === 'melee' ? (CB_SEQ[x] || CB_SEQ.blade)[0].fx : k === 'blast' || id === 'domain_blaze' ? 'fire' : 'magic';
  cbLand('p', { fx, col }, d, at, big);
  if (big === 2) setTimeout(cbImpactFrame, at);
  return { at, big, share, i };
}
on('tech', (d) => {
  if (!cbOk() || !TECHNIQUES[d.id]) return;
  const now = performance.now(), [k, col] = cbTech(d.id);
  if (cbT.id === d.id && now - cbT.t0 < 40) { if (k === 'domain') cbRing('p', col, d.id, 200); return; }   // its strike already cast it
  cbT = { id: d.id, t0: now, i: 0, at: cbCast(d.id) };
});

// ---- the blow itself
on('hit', (d) => {
  if (!cbOk()) return;
  if (d.dot) {
    // damage over time: a coloured flicker, no pose
    const el = cbArt(d.target === 'enemy' ? 'e' : 'p'), col = { poison: '#8fe04a', burn: '#ff8a3a', bleed: '#ff4d5e' }[d.dot] || '#ff4d5e';
    if (el && el.animate && !avCalm()) el.animate([{ filter: `drop-shadow(0 0 0 ${col})` }, { filter: `drop-shadow(0 0 10px ${col}) brightness(1.3)` }, { filter: `drop-shadow(0 0 0 ${col})` }], { duration: 360 });
    return;
  }
  const now = performance.now();
  let r;
  if (d.target === 'enemy') {
    if (RT.casting) r = cbTechHit(RT.casting, d);
    // not a swing of your timer (Thorns, a lingering burn...): its impact only
    else if ((d.label && d.label !== 'Counter') || (!d.label && S.combat.pT > 0.001)) { r = { at: 0, big: 0, share: 0 }; cbLand('p', (RT.fx.burn || 0) > 0 ? { fx: 'fire', col: '#ff7a2b' } : { fx: 'magic', col: '#ffd27a' }, d, 0, 0); }
    else r = cbSwing('p', d);
    cbLastHit = Math.max(cbLastHit, now + r.at);
    if (!d.dodge) cbFloat(r.at, cbWeight(r.share) + (r.big ? ' cb-heavy' : ''), r.i || 0);
  } else {
    r = cbSwing('e', d);
    if (!d.dodge) cbFloat(r.at, cbWeight(r.share * 0.6) + (r.big ? ' cb-heavy' : ''));
  }
});
// The foe falls at the contact frame of the last blow: stagger, collapse (a stick fighter kneels and slumps),
// then fades in a puff of dust and rising motes. A boss: a bigger burst, a shake and an impact frame.
on('kill', (d) => {
  if (!cbOk()) return;
  const f = foeFighter(), av = foeAv(), boss = d.boss, delay = Math.max(0, cbLastHit - performance.now()) + 40;
  if (av) av.dataset.av = 'ko';   // no more stance / wind-up: it stays down
  setTimeout(() => {
    if (!f || !f.isConnected) return;
    if (av) avPlay(av, [['hurtBig', 70, 'out'], ['hurtBig', 170], ['ko', 420, 'in'], ['ko', 4000]]);
    f.classList.add('down');
    const b = cbBox('e');
    if (b) {
      const el = document.createElement('div');
      el.className = 'cbko' + (boss ? ' boss' : '');
      el.style.cssText = `left:${Math.round(b.cx + (av ? 6 : -b.w * 0.05))}px;top:${Math.round(b.y + b.h * 0.93)}px`;
      el.innerHTML = avCalm() ? '' : [...Array(boss ? 12 : 7)].map((_, i) => `<i style="--x:${Math.round(-50 + Math.random() * 100)}px;--y:${Math.round(-60 - Math.random() * 90)}px;--d:${Math.round(700 + Math.random() * 500)}ms;animation-delay:${450 + i * 50}ms"></i>`).join('') + '<s></s>';
      cbFloorEl().appendChild(el);
      setTimeout(() => el.remove(), 2200);
    }
    if (boss) { cbShake(8); cbImpactFrame(); }
  }, delay);
  // you: a victory flourish once the foe is down
  setTimeout(() => {
    const me = playerAv();
    if (!me || !cbOk() || performance.now() < cbKoT) return;
    avPlay(me, cbFamOf('p') === 'fist' || boss ? [['victory', 240, 'back'], ['victory', 460]] : [['flourish', 260, 'back'], ['flourish', 520]]);
    if (boss) cbRing('p', '#ffd75e', null);
  }, delay + 520);
});
// You fall: stagger, then stay down a moment (avatar.js basePose reads cbKoT); a stick foe gloats.
on('death', () => {
  cbKoT = performance.now() + 2400;
  if (!cbOk()) return;
  const me = playerAv(), av = foeAv();
  if (me) avPlay(me, [['hurtBig', 70, 'out'], ['hurtBig', 160], ['ko', 420, 'in']]);
  if (av) setTimeout(() => av.isConnected && avPlay(av, [['victory', 240, 'back'], ['victory', 600]]), 300);
  cbShake(6);
});
on('spawn', () => { cbS.p.pre = cbS.e.pre = 0; cbS.p.v = cbS.e.v = null; cbS.e.n = 0; });
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
