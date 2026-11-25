'use strict';
/* ==========================================================================
   TRI-REALM IDLE — Leaf Village: Shiny & Perfect, and carvings as cargo (DOM-free)
   - Woodcutting: Golden logs, the Shiny version of every log (Shiny Log).
   - Crafting: Perfect gear (+20% stats and perks) and Perfect pills (heal 50% more),
     for the Perfect Log. Scrolls, tools, traps and carvings stay plain.
   - Carvings are trade goods: every ship takes some as cargo (the most valuable first,
     4 per 10 minutes at sea) and sells them abroad for 3× their value.
   Loaded after echo.js (and expeditions.js).
   ========================================================================== */

QUALITY.woodcutting = { kind: 'shiny', base: 1 / 500, claim: true };
QUALITY.arts = { kind: 'perfect', base: 0.01, claim: true, only: (id) => ITEMS[id] && (ITEMS[id].type === 'equip' || ITEMS[id].type === 'food') };
Q_TIERS.woodcutting = [
  [0.25, { speed: 0.05 },  '+5% Woodcutting speed'],
  [0.5,  { double: 0.05 }, '+5% chance to cut two logs'],
  [0.75, { rare: 0.25 },   'Bird nests and rare finds ×1.25 while chopping'],
  [1,    { xp: 0.1 },      '+10% Woodcutting XP'],
];
Q_TIERS.arts = [
  [0.25, { speed: 0.05 },   '+5% Crafting speed'],
  [0.5,  { double: 0.05 },  '+5% chance to craft two at once'],
  [0.75, { perfect: 0.25 }, 'Perfect chance ×1.25 on every skill'],
  [1,    { xp: 0.1 },       '+10% Crafting XP'],
];

/* ------------------------------------------------------------ carvings as cargo */
const CARGO_PER = 4, CARGO_MULT = 3;
const CARVING_IDS = CARVINGS.map(([id]) => id);
{
  const base = sendExp;
  sendExp = function (id, dur, quiet) {
    const ok = base(id, dur, quiet);
    if (!ok || S.exped.trade === false) return ok;
    const sh = S.exped.ships[S.exped.ships.length - 1];
    let room = CARGO_PER * Math.round(sh.dur / 600);
    const cargo = {};
    for (const k of CARVING_IDS.slice().sort((a, b) => ITEMS[b].value - ITEMS[a].value)) {
      if (room <= 0) break;
      const n = Math.min(room, count(k));
      if (n > 0) { removeItem(k, n); cargo[k] = n; room -= n; }
    }
    if (Object.keys(cargo).length) sh.cargo = cargo;
    return ok;
  };
}
{
  const base = returnShip;
  returnShip = function (sh) {
    let sold = 0;
    for (const k in sh.cargo || {}) if (ITEMS[k]) sold += ITEMS[k].value * sh.cargo[k] * CARGO_MULT;
    sold = Math.floor(sold * goldMult());
    base(sh);
    if (sold > 0) {
      S.gold += sold;
      if (S.exped.last) { S.exped.last.gold += sold; S.exped.last.trade = sold; }
      emit('tradesold', { gold: sold, cargo: sh.cargo });
    }
  };
}
for (const id of CARVING_IDS) {
  EXTRA_USES.push([id, `Expedition cargo: sold abroad for ${CARGO_MULT}× its value (${fmt(ITEMS[id].value * CARGO_MULT)} gold)`]);
}

/* ------------------------------------------------------------ Cursed Research leftovers */
// Curse residue, grudge embers and shade essence had no use: Crafting turns them into Cursed Scrolls.
SKILLS.arts.actions.push(craft('scroll_hex', 60, 6, { hex_residue: 12, hex_ember: 8, hex_shade: 5 }));
SKILLS.arts.actions.sort((a, b) => a.level - b.level);
EXTRA_USES.push(['cursed_fragment', `Pays for a missing technique scroll of any world, ${CURSED_PER_SCROLL} for one (Techniques page)`]);
