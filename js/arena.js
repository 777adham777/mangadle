'use strict';
/* ==========================================================================
   TRI-REALM IDLE — battle arena ("Grand Stage", 2026-11-24)
   The fight is seen through your eyes: no hero on screen, only the foe, big,
   in the middle of its world's painted stage. Its name, HP, wind-up and tags
   float above it; its drops sit in a corner, the farm rates in the other.
   You live in the command dock under the stage (ui.js VIEWS.battle): your HP,
   your swing, your techniques, your food.
   Every foe is a painted sprite (js/monster-art.js, made by tools/slice_monster_sheet.py),
   animated in CSS: it breathes, coils before a blow, lunges at you, flashes when hit, falls.
   Variants: Hardcore and Rift Tear foes use their own image, Ascension tiers recolour it.
   Without a sprite, a foe falls back to its drawn creature (creatures.js) or its icon.
   The foe's HUD reads its kit (foes.js): role, weakness, traits, statuses,
   the move it is winding up, boss phases and shield.
   Loaded after draw-util.js and creatures.js, before ui-systems.js.
   ========================================================================== */

const ELEM_ICON = { fire: 'fire', lightning: 'lightning-trio', wind: 'wingfoot', bleed: 'fangs', drain: 'heart-plus' };
const ELEM_NAME = { fire: 'Fire', lightning: 'Lightning', wind: 'Wind', bleed: 'Bleed', drain: 'Drain' };
// Sprite size on the floor: the sheet cell maps to FOE_PX (guardians: BOSS_PX), times the foe's size
// class from docs/MONSTER-SPRITES.md (the generator drew nearly everything at full height).
const FOE_PX = 290, BOSS_PX = 360, SIZE_K = { S: 0.65, M: 0.85, L: 1 };
const FOE_SIZE = {
  'Golem': 'L', 'Cannon Brute': 'L', 'Merfolk': 'L', 'Leviathan': 'L', 'Towering': 'L', 'Lancer': 'L', 'Raging Ape': 'L', 'Commander': 'L',
  'Horned Mutant': 'L', 'Bound Corpse': 'L', 'Elder Curse': 'L', 'Wyvern': 'L', 'Ruin Guardian': 'L', 'Feral Chimera': 'L', 'Living Statue': 'L',
  'Pillar Warrior': 'L', 'Wind Pillar': 'L', 'Sprout Fiend': 'S',
};
const foeSize = (n) => { for (const k in FOE_SIZE) if (n.includes(k)) return FOE_SIZE[k]; return 'M'; };
function foeSprite(e) {
  const n = e.base || e.name, m = typeof MONSTER_ART !== 'undefined' && MONSTER_ART[n];
  if (!m) return null;
  const torn = !m.boss && e.name !== n && /^Torn /.test(e.name), v = torn ? '-torn' : e.hard ? '-hard' : '';
  const px = m.boss ? BOSS_PX * m.h : FOE_PX * m.h * SIZE_K[foeSize(n)];
  return { src: `assets/monsters/${m.p}${v}.webp`, h: Math.round(px), a: m.a };
}
// Foe portrait: its sprite, else its drawn creature, else its icon.
function foeArtHTML(e, realm, opts) {
  const n = e.base || e.name, sp = foeSprite(e);
  if (sp) {
    const t = realm && typeof ascTier === 'function' && !(opts && opts.still) ? ascTier(realm) : 0;
    return `<img class="foe-png ${t ? 'asc' + t : ''}" src="${sp.src}" alt="${esc(n)}" draggable="false">`;
  }
  if (creatureOf(n)) return creatureSVG(n, opts);
  return `<span class="creature">${ic('enemy', n)}</span>`;
}

/* ------------------------------------------------------------- markup */
const foeCr = () => document.querySelector('[data-portrait="enemy"] svg.cr');
const foePng = () => document.querySelector('[data-portrait="enemy"] img.foe-png');
const foeFighter = () => document.querySelector('.ar-floor .fighter.enemy');
const meDock = () => document.querySelector('.gs-me');
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
// Idle life on the floor: motes drifting up in the stage's colour, dust stirring at the foe's feet (CSS only).
const CB_AMB = [...Array(9)].map((_, i) => `<i style="left:${(i * 11.3 + 4) % 100}%;--d:${(6 + (i * 1.7) % 5).toFixed(1)}s;animation-delay:${(-i * 1.37).toFixed(2)}s;--sx:${i % 2 ? 18 : -14}px"></i>`).join('')
  + '<b class="cb-dust foe"></b>';
// The farm rates, top right of the stage (once: the activity bar hides its numbers on this page).
function gsRatesHTML() {
  const c = combatRates();
  return `<div class="gs-rates"><div><small>Kills / h</small><b>≈${fmt(c.kph)}</b></div><div><small>XP / h</small><b>≈${fmt(c.xph)}</b></div><div><small>Gold / h</small><b>≈${fmt(c.goldh)}</b></div></div>`;
}
// The stage: the foe's plate, the foe, its drops, the rates. Redrawn on every spawn (ui.js).
function stageHTML() {
  const C = S.combat, e = curEnemy(), z = C.zone != null ? ZONES[C.zone] : null;
  const realm = z ? z.realm : WORLD_ORDER[0];
  let plate = '', foe = '', side = '';
  if (!z) foe = `<div class="f-empty">${ui('map')}<b>Choose a stage</b><small>Start with an <em>Easy</em> one in the list below.</small></div>`;
  else if (!e) foe = `<div class="f-empty searching">${ui('battle')}<b>Searching for a foe…</b></div>`;
  else {
    const boss = z.boss, K = kitOf(e), n = e.base || e.name, sp = foeSprite(e), cr = !sp && creatureOf(n);
    const ticks = K && K.phases ? '<s style="left:66%"></s><s style="left:33%"></s>' : '';
    const rank = boss ? '<span class="boss-tag">Boss</span>' : e.rank ? `<span class="boss-tag ${e.rank === 2 ? '' : 'elite'}">${e.rank === 2 ? 'Mini-boss' : 'Elite'}</span>` : '';
    plate = `<div class="gs-plate fhud enemy ${boss ? 'boss' : ''}">
      <div class="gs-name">${rank}<b>${esc(e.name)}</b><span class="f-stats"><span title="Max hit">${ui('atk')}${fmt(e.atk)}</span><span title="Defense">${ui('def')}${fmt(e.def)}</span><span title="Attack speed">${ui('spd')}${e.spd}s</span></span></div>
      <div class="hpbar enemy"><i data-ehp></i><b class="shieldbar" data-eshield></b>${ticks}<span data-ehptext></span></div>
      <div class="castbar" data-ecast><div class="atkbar enemy"><i data-eatk></i></div><span data-ecastname></span></div>
      <div class="ftags">${foeTagsHTML(e)}</div><div class="stchips foe" data-est></div></div>`;
    side = `<div class="gs-drops"><small>Drops</small><div class="drops">${e.drops.map(([id, ch]) => tile(id, fmtRate(ch < 0.2 ? ch * luckMult() : ch), { cls: 'xs ' + (id !== 'FRUIT' && !S.found[id] ? 'dim' : '') })).join('')}${tile(null, fmt(e.gold[0]) + '+', { r: 3, icon: ui('gold'), cls: 'xs', title: 'Gold' })}</div></div>`;
    const size = cr && cr[1].size ? cr[1].size : 1;
    const kind = sp ? 'foe-png' : cr ? 'foe-cr' : 'foe-beast';
    foe = `<div class="fighter enemy enter ${boss ? 'boss' : ''} ${kind} ${e.rank ? 'rank' + e.rank : ''}" style="--sz:${size}${sp ? `;--mh:${sp.h};--ma:${sp.a}` : ''}"><div class="f-art" data-portrait="enemy">${foeArtHTML(e, realm)}</div><div class="windmark">!</div></div>`;
  }
  return `<div class="arena-art-bg" data-combat-bg="${realm}" aria-hidden="true"></div>
    <div class="ar-floor" style="--rc:${rc(realm)}">
      <div class="cb-amb" aria-hidden="true">${CB_AMB}</div>
      ${foe}
    </div>
    ${plate}${z && e ? gsRatesHTML() : ''}${side}`;
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
  const me = meDock();
  if (me) me.classList.toggle('stunned', stOn('p', 'stun'));
  // the technique buttons in the dock: cooldown sweep, "ready" glow
  for (const b of document.querySelectorAll('[data-gstech]')) {
    const id = b.dataset.gstech, cd = Math.max(0, RT.cd[id] || 0), T = techCd(id) || 1;
    b.style.setProperty('--cd', (cd / T).toFixed(3));
    b.classList.toggle('cool', cd > 0.05);
    setText(b.querySelector('s'), cd > 0.05 ? Math.ceil(cd) + 's' : '');
  }
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

// The top bar's "next stage" progress (ui.js gsTopHTML).
UPD.push(() => {
  const bar = $('[data-gsnext]');
  if (!bar) return;
  const N = gsNextInfo();
  if (!N || N.open) return;
  bar.style.width = (N.have / N.need) * 100 + '%';
  setText($('[data-gsnexttxt]'), N.boss ? (N.have ? 'Boss defeated' : 'Defeat the boss') : `${N.have} / ${N.need} kills`);
});

/* ------------------------------------------------------------- reactions (combat animation) */
// You are the camera. Your blows land on the foe: an impact drawn by your weapon's family (blade, quick,
// heavy, spear, bow, gun, fist), a flash and a knock-back on the foe; bows and guns fire a projectile from
// the bottom of the screen. The foe coils before its blow (it watches its swing timer), lunges at you,
// and its hit lands on the screen: claw marks, a red flash, the dock shakes. Crits and big hits get a bigger
// moment (larger impact, a flash, a small shake of the stage). Reduced motion: flashes only.
// A weapon's shape, from its id.
function weaponKind(id) {
  const n = id || '';
  return /bow/.test(n) ? 'bow' : /hammer/.test(n) ? 'hammer' : /cannon/.test(n) ? 'cannon' : /gauntlet/.test(n) ? 'fist'
    : /claw/.test(n) ? 'claw' : /sickle/.test(n) ? 'sickle' : /lance/.test(n) ? 'lance' : /cleaver/.test(n) ? 'cleaver'
    : /katana|blade/.test(n) ? 'katana' : /kunai|senbon|tanto|fang|wakizashi/.test(n) ? 'short' : 'cutlass';
}
const CB_KIND = { katana: 'blade', cutlass: 'blade', sickle: 'blade', short: 'quick', hammer: 'heavy', cleaver: 'heavy', lance: 'spear', bow: 'bow', cannon: 'gun', fist: 'fist', claw: 'fist' };
function cbFam(id) {
  if (!id || !ITEMS[id]) return 'fist';
  const k = weaponKind(id);
  if (k !== 'cutlass') return CB_KIND[k] || 'blade';
  // a plain sword shape: the item's own family (weapons.js, or it.fam behind a manga name) refines it
  const af = ITEMS[id].fam || (typeof armFamily === 'function' ? armFamily(id) : '');
  return af === 'short' ? 'quick' : 'blade';
}
// Per family, in turn: the impact, more impacts (ms after the first), a projectile [kind, flight ms].
const CB_SEQ = {
  blade: [{ fx: 'slash' }, { fx: 'rise' }, { fx: 'slash' }, { fx: 'pierce' }],
  quick: [{ fx: 'x', extra: [110] }, { fx: 'x', extra: [110] }],
  heavy: [{ fx: 'smash' }],
  spear: [{ fx: 'pierce' }, { fx: 'pierce', extra: [130] }],
  bow: [{ fx: 'arrow', proj: 'arrow', fly: 160 }],
  gun: [{ fx: 'shot', proj: 'bullet', fly: 90 }, { fx: 'shot', proj: 'bullet', fly: 90, extra: [100] }],
  fist: [{ fx: 'punch', extra: [120] }, { fx: 'punch' }],
};
const cbOk = () => inBattleView() && !document.hidden && !!document.querySelector('.ar-floor');
const cbFloorEl = () => document.querySelector('.ar-floor');
const cbArt = () => foePng() || foeCr() || document.querySelector('.ar-floor .fighter.enemy .creature');
const cbS = { p: { n: 0 }, e: { coil: 0 } };
let cbLastHit = 0;
function cbVar() {
  const fam = cbFamOf(), L = CB_SEQ[fam] || CB_SEQ.blade;
  return Object.assign({ fam }, L[cbS.p.n++ % L.length]);
}
const cbFamOf = () => cbFam(S.equip && S.equip.weapon);
// the foe's box inside the floor (layout box: unaffected by its animations)
function cbBox() {
  const f = foeFighter();
  if (!f) return null;
  return { x: f.offsetLeft, y: f.offsetTop, w: f.offsetWidth, h: f.offsetHeight, cx: f.offsetLeft + f.offsetWidth / 2, el: f };
}
// where your blows land (a spread around the foe's chest), and where you stand (the bottom of the screen)
function cbHitAt() {
  const b = cbBox();
  if (!b) return [0, 0];
  return [b.cx + b.w * (Math.random() * 0.36 - 0.18), b.y + b.h * (0.32 + Math.random() * 0.26)];
}
function cbYouAt() {
  const f = cbFloorEl();
  return f ? [f.offsetWidth / 2 + (Math.random() * 80 - 40), f.offsetHeight * 0.9] : [0, 0];
}
// The struck foe: a white flash and a small push away from you.
function cbKnock(big, kind) {
  const el = cbArt();
  if (!el || !el.animate) return;
  if (!el.dataset.cbf) el.dataset.cbf = getComputedStyle(el).filter || 'none';
  const base = el.dataset.cbf === 'none' ? '' : el.dataset.cbf;
  const fl = (b) => ((b ? `brightness(${b}) ` : '') + base).trim() || 'none';
  if (calmMotion()) { el.animate([{ filter: fl(1.8) }, { filter: fl(0) }], { duration: 180 }); return; }
  const k = big ? 0.93 : 0.965, sq = kind === 'smash' ? ' scale(1.04,0.9)' : '', sx = (Math.random() < 0.5 ? -1 : 1) * (big ? 10 : 5);
  el.animate([
    { transform: 'none', filter: fl(3) },
    { transform: `translate(${sx}px,-6px) scale(${k})${sq}`, filter: fl(2.2), offset: 0.2 },
    { transform: `translate(${sx * 0.4}px,-2px) scale(${(1 + k) / 2})`, filter: fl(1.2), offset: 0.55 },
    { transform: 'none', filter: fl(0) },
  ], { duration: big ? 380 : 260, easing: 'cubic-bezier(.2,.7,.3,1)' });
}
// A small shake of the stage (big moments only), and a one-frame inverted "impact frame" for the biggest.
function cbShake(n) {
  const f = document.querySelector('#stage');
  if (!f || calmMotion()) return;
  const a = n || 5;
  f.animate([{ transform: 'none' }, { transform: `translate(${-a}px,${a * 0.4}px)` }, { transform: `translate(${a * 0.8}px,${-a * 0.4}px)` }, { transform: `translate(${-a * 0.5}px,${a * 0.2}px)` }, { transform: `translate(${a * 0.3}px,0)` }, { transform: 'none' }], { duration: 280, easing: 'ease-out' });
}
function cbImpactFrame() {
  const f = cbFloorEl();
  if (!f || calmMotion()) return;
  f.animate([{ filter: 'invert(1) grayscale(1) contrast(1.8)' }, { filter: 'invert(1) grayscale(1) contrast(1.8)', offset: 0.55 }, { filter: 'none' }], { duration: 120 });
}
// The foe's blow reaches you: a red flash over the stage and the dock jolts.
function cbHurt(big) {
  const st = document.querySelector('#stage'), me = meDock();
  if (st) { const v = document.createElement('div'); v.className = 'gs-hurt' + (big ? ' big' : ''); st.appendChild(v); setTimeout(() => v.remove(), 520); }
  retrigger(me, 'jolt');
  if (big) cbShake(big === 2 ? 8 : 5);
}
// ---- impact drawings (centred, 120x120)
const cbStar = (n, ra, rb) => { const p = []; for (let i = 0; i < n * 2; i++) { const a = (i * Math.PI) / n - Math.PI / 2, r = i % 2 ? rb : ra; p.push(`${(Math.cos(a) * r).toFixed(1)},${(Math.sin(a) * r).toFixed(1)}`); } return p.join(' '); };
const CB_ART = {
  slash: (c) => `<path d="M-56,-36 Q2,0 58,32 Q-4,-12 -56,-36Z" fill="${c}" opacity=".6" transform="scale(1.08)"/><path d="M-52,-32 Q0,-2 54,29 Q-4,-10 -52,-32Z" fill="#fff"/>`,
  rise: (c) => `<path d="M-56,36 Q2,0 58,-32 Q-4,12 -56,36Z" fill="${c}" opacity=".6" transform="scale(1.08)"/><path d="M-52,32 Q0,2 54,-29 Q-4,10 -52,32Z" fill="#fff"/>`,
  x: (c) => `<path d="M-46,-36 Q0,-4 46,34 Q-6,-12 -46,-36Z" fill="${c}" opacity=".7"/><path d="M-44,-33 Q0,-4 44,31 Q-4,-10 -44,-33Z" fill="#fff"/><path d="M-46,36 Q0,4 46,-34 Q-6,12 -46,36Z" fill="${c}" opacity=".7"/><path d="M-44,33 Q0,4 44,-31 Q-4,10 -44,33Z" fill="#fff"/>`,
  pierce: (c) => `<path d="M-60,0 L26,-9 L60,0 L26,9Z" fill="${c}" opacity=".6"/><path d="M-56,0 L28,-5 L56,0 L28,5Z" fill="#fff"/><polygon points="${cbStar(6, 22, 7)}" fill="#fff" stroke="${c}" stroke-width="2.5" transform="translate(30,0)"/>`,
  smash: (c) => `<circle r="40" fill="none" stroke="${c}" stroke-width="5" opacity=".7" class="cb-ring"/><polygon points="${cbStar(9, 52, 18)}" fill="#fff" stroke="${c}" stroke-width="3.5" stroke-linejoin="round"/>`,
  punch: (c) => `<circle r="30" fill="none" stroke="#fff" stroke-width="5" class="cb-ring"/><polygon points="${cbStar(8, 34, 13)}" fill="#fff" stroke="${c}" stroke-width="3" stroke-linejoin="round"/>`,
  arrow: (c) => `<polygon points="${cbStar(7, 26, 9)}" fill="#fff" stroke="${c}" stroke-width="2.5"/>`,
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
  const calm = calmMotion(), big = !!o.big, dir = o.dir || 1;
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
  el.className = `cbfx k-${kind}${big ? ' big' : ''}${o.near ? ' near' : ''}`;
  el.style.cssText = `left:${Math.round(x)}px;top:${Math.round(y)}px;--c:${col || '#fff'};--s:${dir};--rot:${Math.round(o.rot != null ? o.rot : Math.random() * 40 - 20)}deg`;
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
// A projectile from you (the bottom of the screen) to the foe: it shrinks as it flies away.
const CB_PROJ = {
  arrow: '<svg viewBox="-24 -7 48 14"><path d="M-20,0 H15" stroke="#c9a46a" stroke-width="2.6"/><path d="M14,-4.5 L23,0 L14,4.5Z" fill="#dfe4ee" stroke="#111" stroke-width="1.2"/><path d="M-20,0 l-3,-5 h5 l3,5 l-3,5 h-5z" fill="#e8443a" stroke="#111" stroke-width="1"/></svg>',
  bullet: '<svg viewBox="-24 -7 48 14"><ellipse cx="14" cy="0" rx="11" ry="5.5" fill="#ffb23a" opacity=".45"/><ellipse cx="14" cy="0" rx="7" ry="3.4" fill="#fff6c8"/></svg>',
  kunai: '<svg viewBox="-24 -7 48 14"><path d="M-6,0 L10,-4 L22,0 L10,4Z" fill="#dfe4ee" stroke="#111" stroke-width="1.3"/><path d="M-16,-1.6 H-6 V1.6 H-16Z" fill="#5a3d26"/><circle cx="-19" cy="0" r="3" fill="none" stroke="#111" stroke-width="1.6"/></svg>',
  ball: '<svg viewBox="-24 -12 48 24"><circle cx="10" cy="0" r="11" fill="#ff9a3a" opacity=".45"/><circle cx="12" cy="0" r="8" fill="#2a2a30" stroke="#111" stroke-width="1.5"/><circle cx="9.5" cy="-3" r="2.2" fill="#8a8a95"/></svg>',
  ki: '<svg viewBox="-24 -16 48 32"><circle cx="8" r="15" fill="#7df9ff" opacity=".35"/><circle cx="9" r="10" fill="#bffcff"/><circle cx="10" r="5" fill="#fff"/></svg>',
  orb: '<svg viewBox="-24 -12 48 24"><circle cx="10" r="11" fill="#9be15d" opacity=".4"/><circle cx="11" r="6" fill="#e9ffd8"/></svg>',
  talisman: '<svg viewBox="-24 -12 48 24"><rect x="0" y="-10" width="13" height="20" rx="1" fill="#f4ecd4" stroke="#111" stroke-width="1.3"/><path d="M6.5,-6 v12 M3,-2 h7 M3,3 h7" stroke="#c42a2a" stroke-width="1.6"/></svg>',
};
function cbProj(kind, fly, delay, to) {
  if (calmMotion()) return;
  const go = () => {
    const f = cbFloorEl();
    if (!f) return;
    const [x0, y0] = cbYouAt(), [x1, y1] = to || cbHitAt();
    const r = (Math.atan2(y1 - y0, x1 - x0) * 180) / Math.PI;
    const el = document.createElement('div');
    el.className = `cbproj j-${kind}`;
    el.innerHTML = CB_PROJ[kind] || CB_PROJ.orb;
    f.appendChild(el);
    const T = (x, y, s) => `translate(${Math.round(x)}px,${Math.round(y)}px) rotate(${Math.round(r)}deg) scale(${s})`;
    const a = el.animate([{ transform: T(x0, y0, 2.2), opacity: 0.5 }, { transform: T((x0 + x1) / 2, (y0 + y1) / 2 - 20, 1.4), opacity: 1, offset: 0.5 }, { transform: T(x1, y1, 0.9), opacity: 1 }], { duration: fly, easing: 'cubic-bezier(.3,.6,.6,1)' });
    a.onfinish = () => el.remove();
    setTimeout(() => el.remove(), fly + 200);
  };
  if (delay > 0) setTimeout(go, delay); else go();
}
// The damage number ui.js just made: its weight (size by share of HP), and it waits for the impact.
function cbFloat(delay, cls, i) {
  const box = document.getElementById('fx'), f = box && box.lastElementChild;
  if (!f || f.dataset.cb || !f.classList.contains('float')) return;
  f.dataset.cb = '1';
  if (cls) f.classList.add(...cls.split(' ').filter(Boolean));
  if (i) { f.style.left = parseFloat(f.style.left) + i * 16 + 'px'; f.style.top = parseFloat(f.style.top) - i * 14 + 'px'; }
  if (delay > 0) { const d = Math.min(650, Math.round(delay)); f.style.animationDelay = d + 'ms'; f.style.animationDuration = 1100 - d + 'ms'; }
}
const cbWeight = (share) => (share >= 0.2 ? 'cb-huge' : share >= 0.08 ? 'cb-big' : share < 0.02 ? 'cb-small' : '');
const cbCol = () => { const id = S.equip && S.equip.weapon; return id && ITEMS[id] ? RCOL[Math.min(6, rarity(id))] : '#ffd9a0'; };
// Your blow lands on the foe (after `at` ms): the impact, the flash and push, more impacts for combos.
function cbLand(v, d, at, big) {
  const go = () => {
    if (!cbOk()) return;
    const [x, y] = cbHitAt();
    if (d.dodge) {
      const el = cbArt(), s = Math.random() < 0.5 ? -1 : 1;
      if (el && el.animate && !calmMotion()) el.animate([{ transform: 'none', opacity: 1 }, { transform: `translateX(${26 * s}px)`, opacity: 0.55, offset: 0.3 }, { transform: 'none', opacity: 1 }], { duration: 360, easing: 'cubic-bezier(.2,.8,.3,1)' });
      cbFx(x - 30 * s, y, 'whiff', '#fff');
      return;
    }
    const kind = d.blocked && !d.label && d.dmg === d.blocked ? 'shield' : v.fx, col = v.col || cbCol();
    cbFx(x, y, kind, col, { big });
    cbKnock(big, kind);
    if (big) cbShake(big === 2 ? 7 : 5);
    for (const ms of v.extra || []) setTimeout(() => { if (!cbOk()) return; const [x2, y2] = cbHitAt(); cbFx(x2, y2, kind, col); cbKnock(false); }, ms);
    if (kind === 'smash') { const b = cbBox(); if (b) cbFx(b.cx, b.y + b.h * 0.92, 'smash', '#cfc4b4', { rot: 0 }); }
  };
  if (at > 0) setTimeout(go, at); else go();
}
// Your swing: a projectile for bows and guns, then the impact.
function cbSwingP(d) {
  const v = cbVar(), e = curEnemy(), share = d.dmg ? d.dmg / (e ? e.hp : 1e9) : 0;
  const big = d.crit || share >= 0.18 ? (share >= 0.3 ? 2 : 1) : 0;
  const at = v.proj && !calmMotion() ? v.fly : 0;
  if (v.proj) cbProj(v.proj, v.fly, 0);
  cbLand(v, d, at, big);
  return { at, big, share };
}
// The foe's swing: it lunges at you, and its blow lands on the screen.
function cbSwingE(d) {
  const c = foePng() || foeCr();
  if (c) { c.classList.remove('cb-coil'); retrigger(c, 'atk'); }
  cbS.e.coil = 0;
  const share = d.dmg ? d.dmg / pMaxHp() : 0, big = d.crit || share >= 0.12 ? (share >= 0.3 ? 2 : 1) : 0, at = calmMotion() ? 0 : 140;
  setTimeout(() => {
    if (!cbOk()) return;
    const [x, y] = cbYouAt();
    if (d.dodge) { cbFx(x, y - 30, 'whiff', '#fff'); return; }
    cbFx(x, y - 40, d.blocked && d.dmg === d.blocked ? 'shield' : 'claw', '#ff4d5e', { big, near: true });
    cbHurt(big);
  }, at);
  return { at, big, share };
}
UPD.push(() => {
  const C = S.combat, e = curEnemy();
  if (!e || C.zone == null || C.enemy == null || !cbOk()) return;
  // the foe coils ~0.3 s before its blow
  if (!cbS.e.coil && C.eT > 0 && C.eT <= 0.3) { cbS.e.coil = 1; const c = foePng() || foeCr(); if (c) c.classList.add('cb-coil'); }
  else if (cbS.e.coil && C.eT > 0.4) { cbS.e.coil = 0; const c = foePng() || foeCr(); if (c) c.classList.remove('cb-coil'); }
});

// ---- techniques: each kind has its own cast (a power-up into a big strike, a thrown projectile, a seal, an aura)
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
// A ring of energy (and the technique's glyph): on the foe, or at the bottom of the screen for you.
function cbRing(side, col, id, delay) {
  const go = () => {
    const f = cbFloorEl(), b = cbBox();
    if (!f) return;
    const [x, y] = side === 'e' && b ? [b.cx, b.y + b.h * 0.55] : [f.offsetWidth / 2, f.offsetHeight * 0.86];
    const el = document.createElement('div');
    el.className = 'cbring' + (side === 'e' ? '' : ' you');
    el.style.cssText = `left:${Math.round(x)}px;top:${Math.round(y)}px;--c:${col}`;
    el.innerHTML = `<i></i><i></i>${id ? `<b>${ic('technique', id)}</b>` : ''}`;
    f.appendChild(el);
    setTimeout(() => el.remove(), 1000);
    if (side !== 'e') retrigger(document.querySelector(`[data-gstech="${id}"]`), 'fire');
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
// The cast; returns when its first blow lands (ms).
function cbCast(id) {
  const [k, col] = cbTech(id);
  let at;
  if (k === 'melee') { at = 180; cbRing('p', col, id); }
  else if (k === 'proj') { at = 260; cbRing('p', col, id); }
  else if (k === 'blast') { at = 300; cbRing('p', col, id); }
  else if (k === 'domain') { at = 460; cbDomain(col); cbRing('p', col, id); }
  else if (k === 'seal') { at = 270; cbRing('p', col, id); cbProj('talisman', 150, 120); cbRing('e', col, null, at); }
  else { at = 120; cbRing('p', col, id, 60); }
  return at;
}
function cbTechHit(id, d) {
  const now = performance.now();
  if (cbT.id !== id || now - cbT.t0 > 40) cbT = { id, t0: now, i: 0, at: cbCast(id) };
  const i = cbT.i++, [k, col, x] = cbTech(id), at = cbT.at + i * (k === 'proj' ? 90 : 80);
  if (k === 'proj') cbProj(CB_PROJ[x] ? x : 'orb', 150, at - 150);
  const e = curEnemy(), share = e && d.dmg ? d.dmg / e.hp : 0, big = i === 0 && (d.label || share >= 0.15) ? (share >= 0.3 ? 2 : 1) : 0;
  const fx = k === 'melee' ? (CB_SEQ[x] || CB_SEQ.blade)[0].fx : k === 'blast' || id === 'domain_blaze' ? 'fire' : 'magic';
  cbLand({ fx, col }, d, at, big);
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
    // damage over time: a coloured flicker on the foe, a pulse of the dock for you
    if (d.target !== 'enemy') { retrigger(meDock(), 'dot'); return; }
    const el = cbArt(), col = { poison: '#8fe04a', burn: '#ff8a3a', bleed: '#ff4d5e' }[d.dot] || '#ff4d5e';
    if (el && el.animate && !calmMotion()) el.animate([{ filter: `drop-shadow(0 0 0 ${col})` }, { filter: `drop-shadow(0 0 10px ${col}) brightness(1.3)` }, { filter: `drop-shadow(0 0 0 ${col})` }], { duration: 360 });
    return;
  }
  const now = performance.now();
  let r;
  if (d.target === 'enemy') {
    if (RT.casting) r = cbTechHit(RT.casting, d);
    // not a swing of your timer (Thorns, a lingering burn...): its impact only
    else if ((d.label && d.label !== 'Counter') || (!d.label && S.combat.pT > 0.001)) { r = { at: 0, big: 0, share: 0 }; cbLand((RT.fx.burn || 0) > 0 ? { fx: 'fire', col: '#ff7a2b' } : { fx: 'magic', col: '#ffd27a' }, d, 0, 0); }
    else r = cbSwingP(d);
    cbLastHit = Math.max(cbLastHit, now + r.at);
    if (!d.dodge) cbFloat(r.at, cbWeight(r.share) + (r.big ? ' cb-heavy' : ''), r.i || 0);
  } else {
    r = cbSwingE(d);
    if (!d.dodge) cbFloat(r.at, cbWeight(r.share * 0.6) + (r.big ? ' cb-heavy' : ''));
  }
});
// The foe falls after the last blow lands: stagger, collapse, then fades in a puff of dust and rising motes.
// A boss: a bigger burst, a shake and an impact frame.
on('kill', (d) => {
  if (!cbOk()) return;
  const f = foeFighter(), boss = d.boss, delay = Math.max(0, cbLastHit - performance.now()) + 40;
  setTimeout(() => {
    if (!f || !f.isConnected) return;
    f.classList.add('down');
    const b = cbBox();
    if (b) {
      const el = document.createElement('div');
      el.className = 'cbko' + (boss ? ' boss' : '');
      el.style.cssText = `left:${Math.round(b.cx)}px;top:${Math.round(b.y + b.h * 0.93)}px`;
      el.innerHTML = calmMotion() ? '' : [...Array(boss ? 12 : 7)].map((_, i) => `<i style="--x:${Math.round(-50 + Math.random() * 100)}px;--y:${Math.round(-60 - Math.random() * 90)}px;--d:${Math.round(700 + Math.random() * 500)}ms;animation-delay:${450 + i * 50}ms"></i>`).join('') + '<s></s>';
      cbFloorEl().appendChild(el);
      setTimeout(() => el.remove(), 2200);
    }
    if (boss) { cbShake(8); cbImpactFrame(); }
  }, delay);
});
// You fall: the stage goes red and dark for a moment.
on('death', () => {
  if (!cbOk()) return;
  const st = document.querySelector('#stage');
  if (st) { const v = document.createElement('div'); v.className = 'gs-down'; v.innerHTML = '<b>Defeated</b><small>Back on your feet in a moment</small>'; st.appendChild(v); setTimeout(() => v.remove(), 2400); }
  cbShake(6);
});
on('spawn', () => { cbS.e.coil = 0; });
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
