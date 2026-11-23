'use strict';
/* ==========================================================================
   TRI-REALM IDLE — Reiatsu: spiritual pressure (Bleach), DOM-free
   Once you have proven yourself in Soul City, foes far beneath you collapse under
   your spiritual pressure the moment they appear: no swing traded, the next one comes
   sooner (about 3× the kills per hour). Loot per kill is unchanged; XP and bounty per
   kill are halved, so old stages stay quick to farm without becoming an XP fountain.
   "Far beneath": your average hit is at least 3× the foe's HP. Never on boss stages.
   game.js asks reiatsuCrushes() when a foe spawns (tickCombat) and when it dies (killEnemy).
   Loaded after scouter.js (before guide.js: the balance bot loads it too).
   ========================================================================== */

const REIATSU_RESPAWN = 0.4;              // seconds until the next foe steps up
const REIATSU_CYCLE = REIATSU_RESPAWN + 0.1;
const reiatsuOn = () => isUnlocked('feature:reiatsu');
function reiatsuCrushes(e) {
  if (!e || !reiatsuOn()) return false;
  return 0.75 * pMaxHit() * mitig(e.def * hmul('edef')) >= 3 * e.hp;
}
// A whole stage is crushed when every foe of it is (the stage list shows it).
function zoneCrushed(zi) {
  const z = ZONES[zi];
  if (!z || z.boss || z.tear || !reiatsuOn()) return false;
  return z.enemies.every((_, i) => reiatsuCrushes(enemyAt(zi, i)));
}
