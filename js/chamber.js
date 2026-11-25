'use strict';
/* ==========================================================================
   ANIME IDLE RPG — Time Chamber (GDD §5, Kaio Planet), DOM-free.
   Hours you are away beyond the offline limit are stored here (up to its capacity).
   Switched on, it spends that stored time to run your current activity and your ships
   twice as fast. Combat is not accelerated. Normal durations stay the reference.
   ========================================================================== */

const chamberOn = () => isUnlocked('feature:chamber');
// 4 h of storage, +4 h per 25 Gravity Training levels.
const chamberCap = () => (4 + 4 * Math.floor((S.skills.gravity ? skillLv('gravity') : 0) / 25)) * 3600;
function fillChamber(sec) {
  if (!chamberOn() || !(sec > 0)) return;
  S.chamber.store = Math.min(chamberCap(), S.chamber.store + sec);
  dirty = true;
}
const chamberBusy = () => !!S.action || S.exped.ships.length > 0;
function toggleChamber() {
  if (!chamberOn()) return;
  S.chamber.on = !S.chamber.on && S.chamber.store > 0;
  dirty = true;
}
hook('tick', (dt) => {
  const C = S.chamber;
  if (!C.given && chamberOn()) { C.given = 1; C.store = Math.min(chamberCap(), C.store + 3600); dirty = true; }   // a first hour to try it
  if (!C.on || SIM) return;
  if (!chamberOn() || C.store <= 0) { C.on = false; C.store = Math.max(0, C.store); dirty = true; return; }
  if (!chamberBusy()) return;
  const use = Math.min(dt, C.store);
  C.store -= use;
  S.stats.chamberTime = (S.stats.chamberTime || 0) + use;
  if (S.action) tickAction(use);
  for (const sh of S.exped.ships) sh.left -= use;
});
