'use strict';
/* ==========================================================================
   ANIME IDLE RPG — dungeons (DOM-free, 2026-11-25)
   One dungeon per world, opened by that world's guardian. A run is five rooms fought in a
   row: four of the world's foes grown to guardian strength, then the dungeon's lord.
   - No breather: your HP does not regenerate between rooms (food and techniques do).
   - A run costs a key: crafted in Crafting from the world's materials, or dropped by its
     foes (the guardian drops one often, and its first defeat gives one).
   - Clear: a dungeon chest (gold, the world's relics, gems, scrolls, materials), its set's
     sigil (La Forge: the set has 6 pieces, forged from sigils, gear.js) and a chance at a shard
     of its weapon (3 shards forge it). The first clear always gives a shard; after 3 dry
     clears the next one does too.
   - Defeat or leaving the dungeon ends the run; the key is spent.
   - "Run again" (S.dgAuto) starts the next run on its own while you have keys, offline too.
   Records per dungeon: clears, best time, cleared without eating.
   The dungeon is one zone appended to ZONES (flag `dungeon`) whose foes are its rooms;
   game.js asks dgRoom() which room to spawn and skips regeneration there.
   Loaded after builds.js (perks, sets), before economy.js (which prices the set pieces).
   ========================================================================== */

// realm, name, guardian zone, rooms (base foes, in order), lord (base foe, shown crimson), key recipe,
// set: [weapon, armor, accessory] = [id, name, perks, extra], bonuses.
const DUNGEONS = [
  { id: 'archive', realm: 'shinobi', name: 'The Sealed Archive', guard: 'fox',
    blurb: 'Under the Warden Rock, the scrolls that were never meant to be read keep their own guards.',
    rooms: ['Mist Assassin', 'Puppet Drone', 'Ninken Alpha', 'Stone Golem'], lord: ['Stone Golem', 'Archive Colossus'],
    key: { storm_chakra: 12, mist_steel: 4, chakra_orb: 6 },
    set: { id: 'archive', name: 'Archive Keeper', b2: { tech: 0.12 }, b3: { cdr: 0.1, tag_wind: 0.25 },
      pieces: [['archive_tanto', 'Archive Tanto', { tech: 0.1 }, { fam: 'short', g: 'bone-knife', c: '#7fd0ff' }],
        ['archive_mantle', 'Archive Mantle', { guard: 0.05 }, { g: 'cape-armor', c: '#5a8ac0' }],
        ['archive_seal', 'Forbidden Seal', { cdr: 0.08 }, { g: 'secret-book', c: '#f0d9a0' }]] } },
  { id: 'wreck', realm: 'seas', name: "Davy's Wreck", guard: 'admiral',
    blurb: 'A ghost ship that sank with its whole crew and never stopped sailing underwater.',
    rooms: ['Cannon Brute', 'Merfolk Brawler', 'Reef Shark', 'Storm Corsair'], lord: ['Sea Leviathan', 'The Drowned Leviathan'],
    key: { leviathan_scale: 4, tidal_eel: 6, tide_pearl: 2 },
    set: { id: 'wreck', name: 'Drowned Crew', b2: { leech: 0.02 }, b3: { killHeal: 0.12, gold: 0.1 },
      pieces: [['wreck_harpoon', 'Wreck Harpoon', { leech: 0.03 }, { fam: 'lance', g: 'barbed-spear', c: '#4fb0c0' }],
        ['wreck_coat', 'Barnacle Coat', { regen: 0.006 }, { g: 'chain-mail', c: '#3f7a70' }],
        ['wreck_doubloon', 'Cursed Doubloon', { gold: 0.1 }, { g: 'coinflip', c: '#e8c060' }]] } },
  { id: 'catacombs', realm: 'soul', name: 'The Husk Catacombs', guard: 'sovereign',
    blurb: 'Below the Inner Court, the husks that were never purified wait in the dark.',
    rooms: ['Lurking Husk', 'Sand Wraith', 'Masked Lancer', 'Bone Priest'], lord: ['Towering Husk', 'Catacomb Behemoth'],
    key: { phantom_silk: 6, husk_mask: 6, void_stone: 4 },
    set: { id: 'cata', name: 'Catacomb Reaper', b2: { exec: 0.1 }, b3: { berserk: 0.25, critDmg: 0.3 },
      pieces: [['cata_scythe', 'Catacomb Scythe', { exec: 0.15 }, { fam: 'sickle', g: 'crescent-blade', c: '#a8a0c8' }],
        ['cata_shroud', 'Bone Shroud', { wind: 0.15 }, { g: 'warlock-hood', c: '#d8d0c0' }],
        ['cata_mask', 'Husk Fragment', { berserk: 0.2 }, { g: 'horned-skull', c: '#f0f0f0' }]] } },
  { id: 'pit', realm: 'ki', name: 'The Gravity Pit', guard: 'tyrant',
    blurb: 'A crater where gravity is a hundred times stronger. The fighters who fell in never left.',
    rooms: ['Raging Ape', 'Sprout Fiend', 'Elite Soldier', 'Armored Commander'], lord: ['Horned Mutant', 'Pit Overlord'],
    key: { ki_nova: 6, gravity_plate: 4, ki_core: 3 },
    set: { id: 'pit', name: 'Hundredfold', b2: { crit: 0.05 }, b3: { critDmg: 0.4, thorns: 0.1 },
      pieces: [['pit_knuckles', 'Hundredfold Knuckles', { critDmg: 0.3 }, { fam: 'fist', g: 'mailed-fist', c: '#ff8a3a' }],
        ['pit_plate', 'Crater Plate', { thorns: 0.15 }, { g: 'abdominal-armor', c: '#a0a8b8' }],
        ['pit_band', 'Pressure Band', { crit: 0.05 }, { g: 'belt', c: '#ffd04a' }]] } },
  { id: 'womb', realm: 'hex', name: 'The Cursed Womb', guard: 'matriarch',
    blurb: 'A pocket of cursed energy so thick it grew its own walls. Something is still being born in it.',
    rooms: ['Grudge Spirit', 'Hollow Sorcerer', 'Shrine Specter', 'Veil Walker'], lord: ['Elder Curse', 'Womb of Curses'],
    key: { hex_ember: 6, hex_shade: 6, veil_shard: 3 },
    set: { id: 'womb', name: 'Cursed Womb', b2: { bleedP: 0.4 }, b3: { bleedHit: 0.12, leech: 0.02 },
      pieces: [['womb_cleaver', 'Womb Cleaver', { bleedHit: 0.12 }, { fam: 'cleaver', g: 'cleaver', c: '#c040a0' }],
        ['womb_wrap', 'Talisman Wrap', { guard: 0.06 }, { g: 'totem-mask', c: '#e8dcc0' }],
        ['womb_eye', 'Unborn Eye', { tag_bleed: 0.2 }, { g: 'smoking-orb', c: '#ff4a8a' }]] } },
  { id: 'nest', realm: 'hunter', name: 'The Chimera Nest', guard: 'chimera',
    blurb: 'The hive the Chimera King came from. Its royal guard still hunts the corridors.',
    rooms: ['Swamp Mimic', 'Cliff Wyvern', 'Bandit Hunter', 'Ruin Guardian'], lord: ['Feral Chimera', 'Nest Royal Guard'],
    key: { wyrm_scale: 5, swift_feather: 6, lynx_pelt: 4 },
    set: { id: 'nest', name: 'Royal Guard', b2: { dodge: 0.04 }, b3: { crit: 0.06, first: 1.5 },
      pieces: [['nest_claw', 'Royal Claw', { first: 1 }, { fam: 'claw', g: 'fangs', c: '#80d060' }],
        ['nest_carapace', 'Nest Carapace', { thorns: 0.15 }, { g: 'spiked-shoulder-armor', c: '#608a40' }],
        ['nest_antenna', 'Hive Antenna', { dodge: 0.03 }, { g: 'wing-cloak', c: '#c0e080' }]] } },
  { id: 'tomb', realm: 'echo', name: 'The Pillar Tomb', guard: 'pillar',
    blurb: 'Where the Pillar Lords slept for ten thousand years. The sun has never reached its last room.',
    rooms: ['Masked Vampire', 'Sunlight Monk', 'Living Statue', 'Echo Thief'], lord: ['Pillar Warrior', 'Entombed Pillar Lord'],
    key: { pillar_fragment: 6, starmetal_fragment: 4, obsidian_fragment: 4 },
    set: { id: 'tomb', name: 'Ripple Monk', b2: { tag_fire: 0.25 }, b3: { burnHit: 1, tech: 0.1 },
      pieces: [['tomb_gauntlet', 'Sunlight Gauntlet', { tag_fire: 0.2 }, { fam: 'fist', g: 'gloves', c: '#ffb020' }],
        ['tomb_scarf', 'Ripple Scarf', { regen: 0.006 }, { g: 'headband-knot', c: '#ff7a3a' }],
        ['tomb_mask', 'Stone Mask Shard', { burnHit: 1 }, { g: 'ceremonial-mask', c: '#d8c090' }]] } },
];
const DG_BY = Object.fromEntries(DUNGEONS.map((d) => [d.id, d]));
const DG_ROOMS = 5;
const DG_PITY = 3;              // dry clears before a weapon shard is certain
const DG_PIECE = 0.35;          // chance of a weapon shard on a clear (the first clear: certain)
const dgKey = (id) => 'key_' + id;
const dgChest = (id) => 'chest_' + id;

/* ---------------------------------------------------------------- items, recipes, sets */
const DUNGEON_TIERS = {};       // economy.js reads it like GEAR_TIERS
{
  const zi = (id) => ZONES.findIndex((z) => z.id === id);
  const KEY_ARTS = { shinobi: 28, seas: 46, soul: 60, ki: 70, hex: 77, hunter: 84, echo: 92 };
  for (const d of DUNGEONS) {
    const gz = zi(d.guard), R = REALMS[d.realm].name;
    d.stage = gz + 0.6;
    defItem(dgKey(d.id), `${d.name.replace(/^The /, '')} Key`, '🗝️', 60, { type: 'res', rarity: 3, glyph: 'key', color: '#f4c66a', lore: `Opens ${d.name} (${R}) for one run.` });
    // the chest: gold, the world's relics, gems, scrolls and its best materials
    const relics = Object.keys(ITEMS).filter((k) => ITEMS[k].relic === d.realm).slice(0, 2);
    const gem = ['jade', 'sapphire', 'ruby', 'ruby', 'void_diamond', 'void_diamond', 'void_diamond'][WORLD_ORDER.indexOf(d.realm)] || 'jade';
    const mats = Object.keys(d.key);
    const g = ZONES[gz].enemies[0].gold;
    defItem(dgChest(d.id), `${d.name.replace(/^The /, '')} Chest`, '🧰', 200, chest([Math.round(g[0] * 1.5), Math.round(g[1] * 1.5)], [
      ...mats.map((m) => [m, 22, [3, 8]]),
      ...relics.map((m) => [m, 14, [1, 3]]),
      [gem, 10, [1, 2]],
      ...(ITEMS['scroll_' + d.realm] ? [['scroll_' + d.realm, 12, [1, 2]]] : []),
      [dgKey(d.id), 6, [1, 1]],
    ].filter(([k]) => ITEMS[k])));
    Object.assign(ITEMS[dgChest(d.id)], { glyph: 'locked-chest', color: '#e8a040', rarity: 4, rolls: 3, lore: `Brought back from ${d.name}: gold and three finds.` });
    SKILLS.arts.actions.push(craft(dgKey(d.id), KEY_ARTS[d.realm] || 30, 6, Object.assign({}, d.key)));
    // its weapon (forged from shards) and its set: the two old pieces plus four new, forged from sigils (gear.js)
    const ids = [];
    d.set.pieces.forEach(([id, name, perks, x], i) => {
      const slot = ['weapon', 'armor', 'accessory'][i];
      defItem(id, name, '⚔️', 100, Object.assign(eq(slot, Object.assign({}, perks)), { glyph: x.g, color: x.c, dungeon: d.id, rarity: 4,
        lore: `${d.set.name} · ${d.name}.` }, x.fam ? { fam: x.fam } : {}));
      if (i) ITEMS[id].slot = i === 1 ? SLOT_OVERRIDE[id] || 'chest' : slotFor(id);
      DUNGEON_TIERS[id] = [d.stage, 'boss', slot === 'accessory' ? (perks.guard || perks.regen || perks.wind || perks.thorns ? 'def' : 'off') : undefined];
      ids.push(id);
    });
    d.weapon = ids[0];
    const S0 = { id: d.set.id, realm: d.realm, name: d.set.name, stage: d.stage, color: d.set.pieces[1][3].c, dungeon: d.id,
      pieces: { [ITEMS[ids[1]].slot]: ids[1], [ITEMS[ids[2]].slot]: ids[2] }, from: d.rooms, b2: d.set.b2, b4: d.set.b3 };
    GEAR_SETS.push(S0);
    makeSet(S0);
    ITEMS[sigilOf(S0.id)].rarity = 3;
    for (const s of ARMOR_SLOTS) ITEMS[S0.slots[s]].rarity = 4;
    makeShard(d.weapon); ITEMS[shardOf(d.weapon)].rarity = 4;
    shardRecipe(d.weapon, d.stage);
  }
}

// glyphs and colours for the icon fallback (icons.js was read before these items existed)
if (typeof ICONS !== 'undefined') for (const d of DUNGEONS) {
  ICONS.item[dgKey(d.id)] = 'padlock'; ICON_COLOR[dgKey(d.id)] = '#f4c66a';
  ICONS.item[dgChest(d.id)] = 'locked-chest'; ICON_COLOR[dgChest(d.id)] = '#e8a040';
  ICONS.zone['dg_' + d.id] = 'stone-tower';
  for (const [id, , , x] of d.set.pieces) { ICONS.item[id] = x.g; ICON_COLOR[id] = x.c; }
  const S0 = GEAR_SETS.find((s) => s.dungeon === d.id);
  for (const id of [...Object.values(S0.slots), sigilOf(S0.id), shardOf(d.weapon)]) { const it = ITEMS[id]; if (!ICONS.item[id] && it.glyph) ICONS.item[id] = it.glyph; if (!ICON_COLOR[id] && it.color) ICON_COLOR[id] = it.color; }
}

/* ---------------------------------------------------------------- the dungeon zones */
// Rooms 1-4: the world's foes at guardian strength (a share of its HP each); room 5: the lord.
{
  const find = (name) => { for (const z of ZONES) for (const e of z.enemies) if (e.name === name) return e; return null; };
  for (const d of DUNGEONS) {
    const gzi = ZONES.findIndex((z) => z.id === d.guard), G = ZONES[gzi].enemies[0];
    const mk = (base, name, k, lord) => {
      const b = find(base) || G;
      const hp = lord ? 0.8 : 0.16 + 0.03 * k, atk = lord ? 1.2 : 0.86 + 0.06 * k, df = lord ? 1.08 : 0.88 + 0.04 * k, rw = lord ? 1.2 : 0.3;
      const drops = (b.drops || []).filter(([id]) => ITEMS[id] && !['schematic', 'equip', 'scroll', 'chest'].includes(ITEMS[id].type))
        .map(([id, ch, q]) => [id, Math.min(1, ch * 1.5), q]);
      if (lord) drops.push([dgKey(d.id), 0.2, [1, 1]]);
      return Object.assign(en(name, b.icon, Math.round(G.hp * hp), Math.round(G.atk * atk), Math.round(G.def * df), b.spd, Math.round(G.xp * rw), [Math.round(G.gold[0] * rw), Math.round(G.gold[1] * rw)], drops),
        { base, dg: d.id, room: k + 1 }, lord ? { lord: true } : {});
    };
    const enemies = d.rooms.map((n, k) => mk(n, n, k, false)).concat([mk(d.lord[0], d.lord[1], 4, true)]);
    // their moves, minus self-heals and self-shields: at dungeon HP those turn a room into a stalemate.
    // The lord gets a last stand at a third of its HP.
    for (const e of enemies) {
      const K = FOE_KITS[e.base];
      if (!K) continue;
      const moves = K.moves.filter((m) => !m.heal && !(m.self && m.self[0] === 'shield'));
      if (!moves.length) moves.push({ name: 'Crushing Blow', m: 1.6 });
      e.kitId = 'dg:' + d.id + ':' + e.room;
      FOE_KITS[e.kitId] = Object.assign({}, K, { moves, phases: e.lord ? [{ name: 'Last Stand', haste: 1 }] : null }, K.trait && K.trait[0] === 'regen' ? { trait: null } : {});
    }
    ZONES.push({ id: 'dg_' + d.id, name: d.name, realm: d.realm, rec: ZONES[gzi].rec + 4, enemies, dungeon: d.id });
    d.zi = ZONES.length - 1;
    // keys from the world's foes (rare) and its guardian (often)
    for (const z of ZONES) {
      if (z.realm !== d.realm || z.dungeon || z.tear) continue;
      for (const e of z.enemies) e.drops.push([dgKey(d.id), z.boss ? 0.35 : 1 / 150, [1, 1]]);
    }
  }
}

/* ---------------------------------------------------------------- state and rules */
function dgState(id) {
  if (!S.dg || typeof S.dg !== 'object') S.dg = {};
  if (!id) return S.dg;
  return (S.dg[id] = S.dg[id] || { clears: 0, best: 0, clean: 0, dry: 0, runs: 0, fails: 0 });
}
const dgOn = () => isUnlocked('feature:dungeons');
const dgOpen = (id) => { const d = DG_BY[id]; return !!d && realmOpen(d.realm) && (S.combat.kills[d.guard] || 0) >= 1; };
const dgRun = () => (S.dungeon && DG_BY[S.dungeon.id] ? S.dungeon : null);
const dgIn = () => { const r = dgRun(), z = S.combat.zone != null ? ZONES[S.combat.zone] : null; return !!(r && z && z.dungeon === r.id); };
const dgRoom = () => { const r = dgRun(); return r ? Math.min(DG_ROOMS - 1, r.room) : 0; };
const dgPieces = (id) => { const S0 = GEAR_SETS.find((s) => s.dungeon === id); return ARMOR_SLOTS.map((s) => S0.slots[s]); };
const dgOwned = (id) => dgPieces(id).filter((p) => S.found[p]).length;
// Why you can't enter (or '').
function dgBlock(id) {
  const d = DG_BY[id];
  if (!d) return 'Unknown dungeon.';
  if (!dgOpen(id)) return `Defeat ${bossName(d.guard)} first.`;
  if (dgRun() && dgRun().id === id && dgIn()) return 'You are already inside.';
  if (!count(dgKey(id))) return `You need a ${ITEMS[dgKey(id)].name}.`;
  return '';
}
// m:ss for run times (the dungeon window, the trials' texts)
const dgClock = (s) => { s = Math.max(0, Math.round(s)); return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`; };
function dgEnter(id) {
  if (dgBlock(id)) return false;
  const d = DG_BY[id];
  if (dgRun()) dgEnd('left');   // the run you were in ends (and counts) before the next one starts
  removeItem(dgKey(id), 1);
  S.dungeon = { id, room: 0, t: 0, ate: 0 };
  dgState(id).runs++;
  S.action = null;
  const C = S.combat;
  C.zone = null; C.enemy = null;
  startCombat(d.zi);
  C.hp = pMaxHp();
  clog(`Entered ${d.name}. Five rooms, no rest.`, 'sys');
  dirty = true;
  return true;
}
// The run ends: cleared, defeated or abandoned. Returns the outcome.
function dgEnd(why) {
  const r = dgRun();
  if (!r) { S.dungeon = null; return null; }
  S.dungeon = null;
  if (why !== 'clear') { dgState(r.id).fails++; emit('dgend', { id: r.id, why, room: r.room }); }
  dirty = true;
  return why;
}
// A room falls: the next one, or the chest.
hook('kill', (e, z) => {
  if (!z || !z.dungeon) return;
  const r = dgRun();
  if (!r || r.id !== z.dungeon) return;
  r.room++;
  if (r.room < DG_ROOMS) return;
  // cleared
  const d = DG_BY[r.id], st = dgState(r.id), first = !st.clears;
  st.clears++;
  const newBest = !st.best || Math.round(r.t) < st.best;
  if (newBest) st.best = Math.round(r.t);
  if (!r.ate) st.clean = 1;
  addItem(dgChest(r.id), 1);
  // the set's sigil every clear (two the first time), the weapon's shard by chance
  const sigil = sigilOf(d.set.id);
  addItem(sigil, first ? 2 : 1);
  let piece = null;
  if (first || st.dry >= DG_PITY || Math.random() < DG_PIECE * luckMult()) { piece = shardOf(d.weapon); addItem(piece, 1); st.dry = 0; }
  else st.dry++;
  S.stats.dungeons = (S.stats.dungeons || 0) + 1;
  emit('dgclear', { id: r.id, t: r.t, ate: r.ate, first, piece, sigil, best: st.best, newBest: newBest && !first });
  const again = S.dgAuto && count(dgKey(r.id)) > 0;
  dgEnd('clear');
  if (again) { removeItem(dgKey(r.id), 1); S.dungeon = { id: r.id, room: 0, t: 0, ate: 0 }; dgState(r.id).runs++; S.combat.hp = pMaxHp(); }
  else stopCombat();
});
hook('combat', (dt) => { const r = dgRun(); if (r && dgIn()) r.t += dt; });
hook('eat', () => { const r = dgRun(); if (r && dgIn()) r.ate++; });
// Defeat inside, or leaving for anything else: the run is over.
{
  const base = playerDown;
  playerDown = function (e) {
    const r = dgRun();
    if (r && dgIn() && S.combat.hp <= 0) {
      S.combat.hp = 0; S.stats.deaths++;
      clog(`${e.name} drives you out of ${DG_BY[r.id].name}.`, 'lose');
      emit('death', e);
      dgEnd('defeat');
      stopCombat();
      return;
    }
    base(e);
  };
}
hook('tick', () => { if (S.dungeon && !dgIn()) dgEnd(DG_BY[S.dungeon.id] ? 'left' : 'gone'); });
// The guardian's first defeat hands you the key to its world's dungeon.
hook('kill', (e, z) => {
  if (!z || !z.boss || (S.combat.kills[z.id] || 0) !== 1) return;
  const d = DUNGEONS.find((x) => x.guard === z.id);
  if (d) { addItem(dgKey(d.id), 1); emit('dgopen', d.id); }
});
