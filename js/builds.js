'use strict';
/* ==========================================================================
   ANIME IDLE RPG — combat builds (DOM-free)
   Gear is not only bigger numbers: every piece carries a perk, and pieces of a set
   power each other up. Perks combine into builds that play differently:
   - Assassin: critical chance and damage
   - Bleeder: auto-attacks open wounds on the foe (a bleed that stacks ×5)
   - Vampire: life steal, regeneration, heal on kill
   - Juggernaut: less damage taken, thorns, a second wind once per fight
   - Technician: technique damage, faster recharge, element techniques, burning blows
   - Berserker: more damage while hurt, execute foes below 30%
   - Duelist: dodge, and every dodge strikes back
   - Hunter: a huge opening strike, more damage to bosses, Elites and Alphas
   Perk values live in ITEMS[id].stats with the other stats (gearStat sums them, reforge and
   perfect copies grow them). Sets: 2 and 3 pieces worn. Loaded after foes.js (wraps its
   dealDamage / enemyHit / playerHit).
   ========================================================================== */

// name, icon (game-icons), archetype, how to read the value, and the typical value of one piece (for the build label).
const PERKS = {
  crit:      { name: 'Critical chance',     icon: 'swords-power',  arch: 'assassin', unit: 0.06 },
  critDmg:   { name: 'Critical damage',     icon: 'swords-power',  arch: 'assassin', unit: 0.3 },
  bleedHit:  { name: 'Wounding blows',      icon: 'triple-claws',  arch: 'bleed', unit: 0.12, tip: 'Chance per auto-attack to open a wound: the foe bleeds (stacks up to 5).' },
  bleedP:    { name: 'Bleed damage',        icon: 'triple-claws',  arch: 'bleed', unit: 0.3 },
  leech:     { name: 'Life steal',          icon: 'heart-plus',    arch: 'vamp', unit: 0.04, tip: 'Heals you for a share of the damage you deal.' },
  regen:     { name: 'Regeneration',        icon: 'heart-plus',    arch: 'vamp', unit: 0.006, per: '/s', tip: 'Max HP healed every second in battle.' },
  killHeal:  { name: 'Feast',               icon: 'heart-plus',    arch: 'vamp', unit: 0.1, tip: 'Every foe you defeat heals this share of your max HP.' },
  thorns:    { name: 'Thorns',              icon: 'spiked-armor',  arch: 'tank', unit: 0.15, tip: 'Hits that land on you hurt the foe back.' },
  guard:     { name: 'Damage taken',        icon: 'shield',        arch: 'tank', unit: 0.06, neg: true },
  wind:      { name: 'Second wind',         icon: 'health-normal', arch: 'tank', unit: 0.15, tip: 'Once per fight, when you drop below 30% HP: heal this share of your max HP.' },
  tech:      { name: 'Technique damage',    icon: 'magic-swirl',   arch: 'caster', unit: 0.1 },
  cdr:       { name: 'Technique recharge',  icon: 'hourglass',     arch: 'caster', unit: 0.08, tip: 'Techniques recharge this much faster.' },
  tag_fire:      { name: 'Fire techniques',      icon: 'fire',           arch: 'caster', unit: 0.2 },
  tag_lightning: { name: 'Lightning techniques', icon: 'lightning-trio', arch: 'caster', unit: 0.2 },
  tag_wind:      { name: 'Wind techniques',      icon: 'wingfoot',       arch: 'caster', unit: 0.2 },
  tag_bleed:     { name: 'Bleed techniques',     icon: 'triple-claws',   arch: 'bleed', unit: 0.2 },
  tag_drain:     { name: 'Drain techniques',     icon: 'heart-plus',     arch: 'vamp', unit: 0.2 },
  burnHit:   { name: 'Burning blows',       icon: 'burning-embers', arch: 'caster', unit: 1, flag: 1, tip: 'Auto-attacks set the foe ablaze for 3s.' },
  berserk:   { name: 'Berserk',             icon: 'oni',           arch: 'berserk', unit: 0.2, tip: 'More damage while you are below 50% HP.' },
  exec:      { name: 'Execute',             icon: 'reaper-scythe', arch: 'berserk', unit: 0.15, tip: 'More damage to foes below 30% HP.' },
  formDrain: { name: 'Form stamina',        icon: 'aura',          arch: 'berserk', unit: 0.3, tip: 'Transformations drain this much less stamina.' },
  counter:   { name: 'Counter',             icon: 'dodge',         arch: 'duel', unit: 1, times: 1, tip: 'Every attack you dodge strikes back for this many times your max hit.' },
  first:     { name: 'Opening strike',      icon: 'broadsword',    arch: 'hunter', unit: 1, tip: 'The first hit of every fight deals this much more.' },
  boss:      { name: 'Giant slayer',        icon: 'crown',         arch: 'hunter', unit: 0.15, tip: 'More damage to bosses, Elites and Alphas.' },
};
const ARCHES = {
  assassin: { name: 'Assassin',   icon: 'hooded-assassin', desc: 'Critical hits' },
  bleed:    { name: 'Bleeder',    icon: 'triple-claws',    desc: 'Wounds that stack' },
  vamp:     { name: 'Vampire',    icon: 'heart-plus',      desc: 'Heals from every blow' },
  tank:     { name: 'Juggernaut', icon: 'spiked-armor',    desc: 'Takes hits, returns them' },
  caster:   { name: 'Technician', icon: 'magic-swirl',     desc: 'Techniques first' },
  berserk:  { name: 'Berserker',  icon: 'oni',             desc: 'Stronger when hurt' },
  duel:     { name: 'Duelist',    icon: 'dodge',           desc: 'Dodges and strikes back' },
  hunter:   { name: 'Hunter',     icon: 'crown',           desc: 'Opens hard, slays giants' },
  fortune:  { name: 'Treasure Hunter', icon: 'two-coins',  desc: 'Gold and rare finds' },
};
// The older utility stats count towards builds too.
const ARCH_EXTRA = { dodge: ['duel', 0.03], gold: ['fortune', 0.1], rare: ['fortune', 0.06] };

/* ------------------------------------------------------------ every piece's perk */
const GEAR_PERKS = {
  // weapons
  training_kunai: { first: 0.5 }, crystal_kunai: { crit: 0.06 }, iron_wakizashi: { crit: 0.05, critDmg: 0.2 }, senbon: { bleedHit: 0.12 },
  chakra_blade: { tech: 0.1 }, spirit_katana: { cdr: 0.08 }, rusty_cutlass: { gold: 0.08 }, fog_cleaver: { bleedHit: 0.15, exec: 0.15 },
  hand_cannon: { first: 1.5 }, awakened_blade: { tech: 0.12, cdr: 0.05 }, corsair_cutlass: { crit: 0.07, gold: 0.1 }, ashen_fang: { tag_fire: 0.25, berserk: 0.2 },
  black_warhammer: { boss: 0.2 }, reapers_edge: { leech: 0.04, exec: 0.2 }, sovereign_blade: { critDmg: 0.4 }, eclipse_blade: { crit: 0.1, critDmg: 0.3 },
  husk_claw: { bleedHit: 0.2 }, sunforged_bow: { first: 2, tag_fire: 0.15 }, wraith_sickle: { leech: 0.05 }, bone_lance: { exec: 0.25 },
  stormcaller: { tag_lightning: 0.3, cdr: 0.1 }, power_gauntlets: { berserk: 0.25, counter: 1 }, crimson_knuckles: { counter: 1.5 }, paper_blade: { tech: 0.15 },
  cursed_cleaver: { berserk: 0.4 }, wyvern_bow: { first: 2.5, boss: 0.15 }, hunter_glaive: { boss: 0.25, crit: 0.08 }, ripple_gloves: { leech: 0.05, regen: 0.006 },
  ancient_fog_cleaver: { bleedHit: 0.25, exec: 0.25 }, ancient_stormcaller: { tag_lightning: 0.4, cdr: 0.15 }, rift_cleaver: { crit: 0.12, critDmg: 0.5, boss: 0.2 },
  // armor
  flak_vest: { guard: 0.04 }, puppet_plating: { thorns: 0.12 }, chakra_mesh: { cdr: 0.06 }, frost_garb: { guard: 0.06 }, sage_robe: { regen: 0.005, tech: 0.06 },
  marine_coat: { wind: 0.15 }, husk_carapace: { thorns: 0.15 }, ferryman_robe: { leech: 0.03 }, leviathan_mail: { thorns: 0.2, guard: 0.04 },
  admiral_coat: { wind: 0.2, gold: 0.08 }, beast_cloak: { berserk: 0.15 }, sovereign_cloak: { guard: 0.08, dodge: 0.03 }, storm_mantle: { cdr: 0.1 },
  tide_mantle: { regen: 0.008, wind: 0.2 }, weighted_gi: { counter: 0.8 }, battle_armor: { guard: 0.1 }, veil_shroud: { counter: 1 },
  grudge_mail: { thorns: 0.3 }, wildhide_coat: { regen: 0.01 }, beastlord_mantle: { boss: 0.1 }, ancient_ferryman_robe: { leech: 0.05, guard: 0.08 },
  sunlit_armor: { regen: 0.012, wind: 0.25 },
  // accessories
  shinobi_headband: { cdr: 0.05 }, old_compass: { first: 0.5 }, wolf_fang: { crit: 0.05 }, golem_heart: { wind: 0.12 }, jade_amulet: { regen: 0.004 },
  reishi_ring: { guard: 0.04 }, sea_charm: { counter: 0.5 }, fox_tail_charm: { tag_fire: 0.2 }, sealing_talisman: { tech: 0.1 }, sapphire_charm: { thorns: 0.1 },
  reaper_scarf: { exec: 0.15 }, prayer_beads: { regen: 0.006 }, ruby_crest: { critDmg: 0.25 }, shark_tooth: { bleedHit: 0.1 }, storm_crown: { tag_lightning: 0.2 },
  kraken_compass: { first: 0.8 }, sovereign_mask: { crit: 0.06, critDmg: 0.2 }, void_band: { crit: 0.05, tech: 0.08 }, battle_scouter: { crit: 0.06 },
  gravity_bracer: { counter: 1, guard: 0.05 }, hex_eye: { berserk: 0.25 }, matriarch_rosary: { cdr: 0.1 }, chimera_fang: { bleedHit: 0.15 },
  star_badge: { boss: 0.15 }, stone_mask: { leech: 0.04 }, ancient_gravity_bracer: { counter: 1.5, guard: 0.08 }, rift_eye: { crit: 0.08, cdr: 0.1 },
};
for (const id in GEAR_PERKS) if (ITEMS[id]) Object.assign(ITEMS[id].stats, GEAR_PERKS[id]);

/* ------------------------------------------------------------ sets */
// A piece slot may accept alternatives (an array). b2 / b3: perks for 2 / 3 pieces worn.
const SETS = [
  { id: 'genin',   name: 'Genin Kit',        pieces: ['chakra_blade', 'chakra_mesh', 'shinobi_headband'], b2: { tech: 0.1 }, b3: { cdr: 0.12 } },
  { id: 'feral',   name: 'Feral Hunter',     pieces: ['senbon', 'puppet_plating', 'wolf_fang'], b2: { bleedP: 0.3 }, b3: { bleedHit: 0.1, crit: 0.04 } },
  { id: 'mist',    name: 'Hidden Mist',      pieces: ['fog_cleaver', 'puppet_plating', 'sealing_talisman'], b2: { bleedP: 0.5 }, b3: { bleedHit: 0.15, crit: 0.05 } },
  { id: 'fox',     name: 'Ashen Fox',        pieces: ['ashen_fang', 'beast_cloak', 'fox_tail_charm'], b2: { tag_fire: 0.2 }, b3: { burnHit: 1 } },
  { id: 'lev',     name: 'Leviathan',        pieces: ['corsair_cutlass', 'leviathan_mail', 'shark_tooth'], b2: { thorns: 0.15 }, b3: { regen: 0.01 } },
  { id: 'tide',    name: 'Tide Emperor',     pieces: ['stormcaller', ['admiral_coat', 'tide_mantle'], ['storm_crown', 'kraken_compass']], b2: { gold: 0.15 }, b3: { tag_lightning: 0.3, cdr: 0.1 } },
  { id: 'reaper',  name: 'Ferryman',         pieces: ['reapers_edge', 'ferryman_robe', 'reaper_scarf'], b2: { leech: 0.03 }, b3: { killHeal: 0.15, exec: 0.15 } },
  { id: 'sov',     name: 'Masked Sovereign', pieces: ['eclipse_blade', 'sovereign_cloak', 'sovereign_mask'], b2: { crit: 0.08 }, b3: { critDmg: 0.5 } },
  { id: 'saiyan',  name: 'Gravity Warrior',  pieces: ['power_gauntlets', 'battle_armor', 'gravity_bracer'], b2: { counter: 0.5, guard: 0.05 }, b3: { formDrain: 0.4 } },
  { id: 'curse',   name: 'Curse Bearer',     pieces: ['cursed_cleaver', 'grudge_mail', 'hex_eye'], b2: { berserk: 0.2 }, b3: { leech: 0.05, exec: 0.25 } },
  { id: 'star',    name: 'Star Hunter',      pieces: ['hunter_glaive', 'wildhide_coat', 'star_badge'], b2: { boss: 0.15 }, b3: { first: 2, crit: 0.06 } },
  { id: 'ancient', name: 'Ancient Relics',   pieces: [['ancient_fog_cleaver', 'ancient_stormcaller'], 'ancient_ferryman_robe', 'ancient_gravity_bracer'], b2: { tech: 0.15, guard: 0.06 }, b3: { bleedHit: 0.2, leech: 0.04, counter: 1 } },
  // the manga armory (armory.js): one crew per world, from Orange Town on
  { id: 'strawhat', name: 'Red Vest Crew',  pieces: [['wado_blade', 'weather_baton', 'black_leg_boots'], 'red_vest', ['straw_hat', 'sniper_goggles']], b2: { gold: 0.1, wind: 0.1 }, b3: { crit: 0.06, rare: 0.05 } },
  { id: 'captain', name: 'Court Captain',    pieces: [['asauchi', 'bankai_blade'], 'captain_haori', ['flash_sandals', 'hollow_mask_half']], b2: { cdr: 0.08 }, b3: { tech: 0.12, crit: 0.05 } },
  { id: 'turtle',  name: 'Iron Shell School',    pieces: [['power_pole', 'z_sword'], 'turtle_gi', ['nimbus_charm', 'senzu_pouch']], b2: { counter: 0.5 }, b3: { first: 1, formDrain: 0.3 } },
  { id: 'jujutsu', name: 'Sorcery High',     pieces: [['resonance_hammer', 'playful_cloud', 'inverted_spear'], 'jujutsu_uniform', ['limitless_blindfold', 'cursed_finger', 'sealing_cube']], b2: { tech: 0.1 }, b3: { cdr: 0.1, exec: 0.15 } },
  { id: 'exam',    name: 'Hunter Selection',      pieces: [['hunter_rod', 'steel_yoyos', 'joker_cards'], 'ten_vest', ['steel_skateboard', 'chain_of_judgement', 'medic_briefcase']], b2: { first: 1 }, b3: { crit: 0.06, boss: 0.15 } },
  { id: 'slayer',  name: 'Dusk Slayer Corps', pieces: ['nichirin_blade', ['slayer_uniform', 'checkered_haori'], ['fox_warding_mask', 'hanafuda_earrings']], b2: { exec: 0.15 }, b3: { tag_fire: 0.25, burnHit: 1 } },
];
const SET_OF = {};
for (const s of SETS) for (const p of s.pieces) for (const id of [].concat(p)) (SET_OF[id] = SET_OF[id] || []).push(s);
const worn = () => Object.values(S.equip).filter(Boolean);
// How many pieces of a set you wear (base ids: a perfect copy counts as its item).
function setWorn(s) {
  const w = worn().map((id) => (ITEMS[id] && ITEMS[id].base) || id);
  return s.pieces.filter((p) => [].concat(p).some((id) => w.includes(id))).length;
}
function setFx(k) {
  let v = 0;
  for (const s of SETS) { const n = setWorn(s); if (n >= 2) v += s.b2[k] || 0; if (n >= 3) v += s.b3[k] || 0; }
  return v;
}
// A perk's total: gear + sets.
const perk = (k) => gearStat(k) + setFx(k);

/* ------------------------------------------------------------ build label */
function buildArch() {
  const sc = {};
  const addK = (k, v) => {
    const P = PERKS[k], X = ARCH_EXTRA[k];
    if (P) sc[P.arch] = (sc[P.arch] || 0) + v / P.unit;
    else if (X) sc[X[0]] = (sc[X[0]] || 0) + v / X[1];
  };
  for (const k of [...Object.keys(PERKS), ...Object.keys(ARCH_EXTRA)]) { const v = perk(k); if (v > 0) addK(k, v); }
  return Object.entries(sc).filter(([, v]) => v >= 0.99).sort((a, b) => b[1] - a[1]).slice(0, 2).map(([k]) => k);
}

/* ------------------------------------------------------------ in battle */
const BASE_CRIT = 0.05, BASE_CRIT_DMG = 1.5;
const critChance = () => Math.min(0.75, BASE_CRIT + perk('crit'));
const critMult = () => BASE_CRIT_DMG + perk('critDmg');
const foeIsBig = (e) => !!(e && (e.rank || fightingBoss()));
// Foe-side damage over time from builds: a wound (stacks) and a burn.
STATUS.wound = { name: 'Wounded', icon: 'triple-claws', side: 'e', max: 5, desc: 'Bleeds every second. Stacks up to 5.' };
STATUS.scorch = { name: 'Scorched', icon: 'burning-embers', side: 'e', desc: 'Burns every second.' };
const WOUND = { secs: 5, per: 0.12 }, SCORCH = { secs: 3, per: 0.12 };
const wound = () => addStatus('e', 'wound', WOUND.secs, pMaxHit() * WOUND.per * (1 + perk('bleedP')));
RT.b = { open: false, wind: false };
hook('spawn', () => { RT.b.open = true; RT.b.wind = false; });
{
  // Every hit you land: criticals, element techniques, execute, berserk, giant slayer, the opener, life steal.
  const base = dealDamage;
  dealDamage = function (e, dmg, crit, label, extra) {
    const C = S.combat;
    if (C.enemy == null) return;
    if (RT.dot) return base(e, dmg, crit, label, extra);
    const auto = !!RT.auto, tech = RT.casting && TECHNIQUES[RT.casting];
    if (auto || tech) {
      let m = 1;
      if (auto) {
        const scarlet = (RT.fx.scarlet || 0) > 0;
        crit = scarlet || Math.random() < critChance();
        if (crit && !scarlet) m *= critMult();
        if (RT.b.open) { RT.b.open = false; m *= 1 + perk('first'); }
      } else {
        m *= 1 + perk('tech');
        for (const t of tech.tags) m *= 1 + perk('tag_' + t);
        if (!crit && Math.random() < critChance()) { crit = true; m *= critMult(); }
      }
      if (C.hp < pMaxHp() * 0.5) m *= 1 + perk('berserk');
      if (C.eHp < e.hp * 0.3) m *= 1 + perk('exec');
      if (foeIsBig(e)) m *= 1 + perk('boss');
      dmg = Math.max(1, Math.round(dmg * m));
    }
    const before = C.eHp;
    base(e, dmg, crit, label, extra);
    const dealt = Math.max(0, before - (C.enemy == null ? 0 : C.eHp));
    if ((auto || tech) && dealt > 0) {
      const L = perk('leech');
      if (L > 0) C.hp = Math.min(pMaxHp(), C.hp + Math.min(pMaxHp() * 0.05, dealt * L));
      if (C.enemy != null) {
        if (auto && Math.random() < perk('bleedHit')) wound();
        if (tech && tech.tags.includes('bleed')) wound();
        if (auto && perk('burnHit') > 0) addStatus('e', 'scorch', SCORCH.secs, pMaxHit() * SCORCH.per);
      }
    }
  };
}
{
  // Every blow aimed at you: thorns, counters on a dodge, the second wind.
  const base = enemyHit;
  enemyHit = function (e) {
    const C = S.combat, mv = RT.foe && RT.foe.next, hp0 = C.hp;
    base(e);
    if (C.zone == null || C.enemy == null) return;
    const lost = Math.max(foeLanded, hp0 - C.hp), th = perk('thorns');
    if (lost > 0 && th > 0) { RT.dot = true; dealDamage(e, Math.max(1, Math.round(lost * th)), false, 'Thorns'); RT.dot = false; }
    if (C.enemy == null) return;
    const ct = perk('counter');
    if (ct > 0 && !foeLanded && (!mv || mv.m)) { RT.auto = true; dealDamage(e, Math.max(1, Math.round(pMaxHit() * ct * rand(0.7, 1) * mitig(e.def * hmul('edef')))), false, 'Counter'); RT.auto = false; }
    const w = perk('wind');
    if (w > 0 && !RT.b.wind && C.hp > 0 && C.hp < pMaxHp() * 0.3) { RT.b.wind = true; C.hp = Math.min(pMaxHp(), C.hp + pMaxHp() * w); emit('tech', { id: 'second_wind', heal: Math.round(pMaxHp() * w) }); }
  };
}
hook('taken', () => 1 - Math.min(0.5, perk('guard')));
hook('combat', (dt, e) => {
  const C = S.combat;
  if (!e || C.enemy == null) return;
  const r = perk('regen');
  if (r > 0) C.hp = Math.min(pMaxHp(), C.hp + pMaxHp() * r * dt);
  const cd = perk('cdr');
  if (cd > 0) for (const k in RT.cd) RT.cd[k] -= dt * cd;
  // wounds and burns on the foe (timers run down in foes.js)
  for (const id of ['wound', 'scorch']) {
    const s = RT.st.e[id];
    if (!s || s.t <= 0) continue;
    s.acc += Math.min(dt, s.t);
    while (s.acc >= 1 && C.enemy != null) {
      s.acc -= 1;
      RT.dot = true;
      dealDamage(e, Math.max(1, Math.round(s.v * s.n * mitig(e.def * hmul('edef') * 0.5))), false, '', { dot: id === 'wound' ? 'bleed' : 'burn' });
      RT.dot = false;
    }
    if (C.enemy == null) return;
  }
});
hook('kill', () => { const k = perk('killHeal'); if (k > 0) S.combat.hp = Math.min(pMaxHp(), S.combat.hp + pMaxHp() * k); });
// Transformations drain less stamina (the drain itself is in systems.js).
hook('tick', (dt) => {
  const f = typeof activeForm === 'function' && activeForm(), k = Math.min(0.8, perk('formDrain'));
  if (f && k > 0) S.ki.stamina = Math.min(staminaMax(), S.ki.stamina + f.drain * dt * k);
});
hook('dodge', () => setFx('dodge'));
hook('gold', () => 1 + setFx('gold'));
