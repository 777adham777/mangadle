'use strict';
/* ==========================================================================
   TRI-REALM IDLE — battle arena
   A side-on fighting stage: a HUD with both health bars on top, and a floor
   where your stick figure and the foe stand facing each other.
   Humanoid foes are stick figures too, dressed with their world's
   cosmetics; beasts and monsters stand on the floor as large creatures.
   Loaded after avatar.js (uses its rig) and before ui-systems.js.
   ========================================================================== */

// Enemy name keyword -> how that foe is dressed. First match wins.
// over: avatar cosmetics; weapon: item id drawn in hand ('' = bare hands).
const FOE_LOOKS = [
  [/Admiral/,              { outfit: 'uniform', hair: 'mop', hat: 'tricorn', face: 'fierce', back: 'coat', build: 'stout' }, 'stormcaller'],
  [/Corsair/,              { outfit: 'corsair', hair: 'mop', hat: 'bandana', face: 'patch', back: 'coat' }, 'corsair_cutlass'],
  [/Cannon Brute/,         { outfit: 'corsair', hair: 'tuft', hat: 'bandana', face: 'fierce', build: 'stout' }, 'hand_cannon'],
  [/Navy Recruit/,         { outfit: 'tee', hair: 'tuft', hat: 'bucket', face: 'dots' }, 'rusty_cutlass'],
  [/Merfolk/,              { outfit: 'none', hair: 'mop', face: 'fierce', build: 'stout' }, 'power_gauntlets'],
  [/Bandit Thug/,          { outfit: 'tee', hair: 'tuft', hat: 'bandana', face: 'scar' }, 'iron_wakizashi'],
  [/Rogue Apprentice/,     { outfit: 'shinobi', hair: 'spikes', hat: 'hood', face: 'mask', build: 'slim' }, 'crystal_kunai'],
  [/Mist Assassin/,        { outfit: 'shinobi', hair: 'tuft', hat: 'hood', face: 'mask', back: 'scarf', build: 'slim' }, 'ashen_fang'],
  [/Husk|Towering/,        { outfit: 'none', face: 'husk', build: 'tall' }, 'husk_claw'],
  [/Masked Lancer/,        { outfit: 'reaper', hair: 'ember', face: 'husk', back: 'shroud' }, 'bone_lance'],
  [/Bone Priest/,          { outfit: 'reaper', hat: 'horns', face: 'husk', back: 'shroud' }, 'wraith_sickle'],
  [/Masked Sovereign/,     { outfit: 'reaper', hair: 'ember', hat: 'horns', face: 'husk', back: 'shroud', build: 'tall', aura: 'wisps' }, 'sovereign_blade'],
  [/Wasteland Brawler|Elite Soldier/, { outfit: 'gi', hair: 'tuft', hat: 'martial', face: 'fierce' }, 'power_gauntlets'],
  [/Armored Commander/,    { outfit: 'gi', hat: 'martial', face: 'scar', back: 'coat', build: 'stout' }, 'black_warhammer'],
  [/Horned Mutant/,        { outfit: 'none', hat: 'horns', face: 'fierce', build: 'stout' }, ''],
  [/Crimson Tyrant/,       { outfit: 'gi', hair: 'flame', hat: 'horns', face: 'fierce', back: 'mantle', build: 'stout', aura: 'embers' }, 'power_gauntlets'],
  [/Hollow Sorcerer/,      { outfit: 'uniform', hair: 'swept', hat: 'talisman', face: 'cursed', back: 'shroud' }, 'wraith_sickle'],
  [/Bound Corpse/,         { outfit: 'tee', hat: 'talisman', face: 'blank' }, ''],
  [/Veil Walker/,          { outfit: 'uniform', hair: 'frost', face: 'cursed', back: 'shroud', build: 'tall' }, 'cursed_cleaver'],
  [/Cursed Matriarch/,     { outfit: 'uniform', hair: 'frost', hat: 'talisman', face: 'cursed', back: 'sigil', build: 'tall', aura: 'smoke' }, 'cursed_cleaver'],
  [/Rival Examinee|Bandit Hunter/, { outfit: 'wilds', hair: 'wild', hat: 'beast', face: 'paint', back: 'quiver' }, 'sunforged_bow'],
  [/Masked Vampire/,       { outfit: 'longcoat', hair: 'swept', face: 'marble', back: 'shroud', build: 'slim' }, 'eclipse_blade'],
  [/Sunlight Monk/,        { outfit: 'gi', hat: 'martial', face: 'dots' }, 'power_gauntlets'],
  [/Echo Thief/,           { outfit: 'longcoat', hair: 'swept', hat: 'laurel', face: 'marble', build: 'slim' }, 'crystal_kunai'],
  [/Pillar Warrior|Pillar Guard/, { outfit: 'none', hair: 'tuft', hat: 'laurel', face: 'fierce', build: 'stout' }, 'bone_lance'],
  [/Pillar Lord/,          { outfit: 'longcoat', hair: 'swept', hat: 'laurel', face: 'marble', back: 'wings', build: 'tall', aura: 'echo' }, 'eclipse_blade'],
  [/Rift Emperor/,         { outfit: 'riftwear', hair: 'crest', hat: 'crown', face: 'rifteye', back: 'mantle', build: 'tall', aura: 'storm' }, 'rift_cleaver'],
];
// Dark, mean palette per world: humanoid foes wear a darker shade of the world colour.
function foeLook(e, realm) {
  const name = e.base || e.name;
  const m = FOE_LOOKS.find(([re]) => re.test(name));
  if (!m) return null;
  const base = (REALMS[realm] && REALMS[realm].color) || '#ff5d73';
  return { over: Object.assign({ style: 'flat', color: 'chalk', hat: 'none', face: 'fierce', back: 'none', aura: 'none', build: 'athletic', stance: 'relaxed', hair: 'none', outfit: 'none', ink: shade(base, -0.32) }, m[1]), weapon: ITEMS[m[2]] ? m[2] : '' };
}

/* ------------------------------------------------------------- markup */
const foeAv = () => document.querySelector('[data-portrait="enemy"] svg.avatar');
const meFighter = () => document.querySelector('.ar-floor .fighter.me');
const foeFighter = () => document.querySelector('.ar-floor .fighter.enemy');
function stageHTML() {
  const C = S.combat, e = curEnemy(), z = C.zone != null ? ZONES[C.zone] : null;
  const realm = z ? z.realm : 'seas';
  const meHud = `<div class="fhud me f-body"><div class="f-name"><b>You</b><span class="f-stats"><span title="Max hit">${ui('atk')}${fmt(pMaxHit())}</span><span title="Defense">${ui('def')}${fmt(pDef())}</span><span title="Attack speed">${ui('spd')}${pSpeed().toFixed(1)}s</span>${pDodge() ? `<span title="Dodge">${ui('dodge')}${pct(pDodge())}</span>` : ''}</span></div>
      <div class="hpbar"><i data-php></i><span data-phptext></span></div><div class="atkbar"><i data-patk></i></div>${uix('stageMe')}</div>`;
  let foeHud = '', foe = '';
  if (!z) foe = `<div class="f-empty">${ui('map')}<b>Choose a stage</b><small>Start with an <em>Easy</em> one in the list.</small></div>`;
  else if (!e) foe = `<div class="f-empty searching">${ui('battle')}<b>Searching for a foe…</b></div>`;
  else {
    const boss = z.boss, look = foeLook(e, realm);
    foeHud = `<div class="fhud enemy f-body ${boss ? 'boss' : ''}"><div class="f-name"><b>${boss ? '<span class="boss-tag">Boss</span>' : ''}${e.name}</b><span class="f-stats"><span title="Max hit">${ui('atk')}${e.atk}</span><span title="Defense">${ui('def')}${e.def}</span><span title="Attack speed">${ui('spd')}${e.spd}s</span></span></div>
      <div class="hpbar enemy"><i data-ehp></i><span data-ehptext></span></div><div class="atkbar enemy"><i data-eatk></i></div>
      <div class="drops">${e.drops.map(([id, ch]) => tile(id, fmtRate(ch < 0.2 ? ch * luckMult() : ch), { cls: 'xs ' + (id !== 'FRUIT' && !S.found[id] ? 'dim' : '') })).join('')}${tile(null, fmt(e.gold[0]) + '+', { r: 3, icon: ui('gold'), cls: 'xs', title: 'Gold' })}</div></div>`;
    const art = look
      ? avatarSVG(look.over, { ctx: 'enemy', flip: true, weapon: look.weapon })
      : `<span class="creature">${ic('enemy', e.base || e.name)}</span>`;
    foe = `<div class="fighter enemy enter ${boss ? 'boss' : ''} ${look ? 'foe-stick' : 'foe-beast'}"><div class="f-art" data-portrait="enemy">${art}</div></div>`;
  }
  return `<div class="ar-hud">${meHud}<div class="vs"><span>VS</span></div>${foeHud || '<div class="fhud-empty"></div>'}</div>
    <div class="ar-floor" style="--rc:${rc(realm)}">
      <div class="fighter me"><div class="f-art av-art" data-portrait="player">${avatarSVG(null, { ctx: 'battle' })}</div></div>
      ${foe}
    </div>`;
}

/* ------------------------------------------------------------- reactions */
// Attacker lunges across the floor; the foe stick figure strikes / recoils / falls.
on('hit', (d) => {
  if (d.target === 'enemy') {
    retrigger(meFighter(), 'lunge');
    if (!d.dodge) setTimeout(() => avPlay(foeAv(), [['hurt', 90, 'out'], ['hurt', 140], ['guard', 300]]), 160);
  } else {
    retrigger(foeFighter(), 'lunge');
    avPlay(foeAv(), nextAttack());
  }
});
on('kill', () => {
  const f = foeFighter();
  if (!f) return;
  avPlay(foeAv(), [['hurt', 120, 'out'], ['hurt', 2000]]);
  f.classList.add('down');
});
