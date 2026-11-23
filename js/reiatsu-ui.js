'use strict';
/* ==========================================================================
   TRI-REALM IDLE — Reiatsu on screen (reiatsu.js is the engine)
   A pale pressure haze over the arena while you crush a stage; the stage list
   tags crushed stages "Reiatsu" (ui.js zoneRow). Loaded after ui.js and arena.js.
   ========================================================================== */
let reiSeen = null;
UPD.push(() => {
  const st = document.getElementById('stage');
  if (!st) return;
  const on = S.combat.zone != null && zoneCrushed(S.combat.zone);
  if (on !== reiSeen || !st.classList.contains('reiatsu') === on) { reiSeen = on; st.classList.toggle('reiatsu', on); }
});
