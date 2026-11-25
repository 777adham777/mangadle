'use strict';
/* ==========================================================================
   ANIME IDLE RPG — Hardcore mode on screen (hardcore.js is the engine)
   The switch sits on top of the stage list; a red HC tag shows in the activity bar
   while you fight in Hardcore, and the arena takes a red edge. Loaded after ui.js.
   ========================================================================== */

UIX.stagesTop.push(() => {
  if (!hardUnlocked()) return '';
  const on = hardOn();
  return `<div class="hc-row ${on ? 'on' : ''}">
    <button class="hc-tog" data-hardcore aria-pressed="${on}" title="Every stage at Hardcore strength">${ui('skull')}<span>Hardcore</span><i class="hc-sw"><i></i></i></button>
    <small>Foes ×${HARD.hp} HP, ×${HARD.atk} attack · drops ×${HARD.drops}, gold ×${HARD.gold}, XP ×${HARD.xp}${S.hard && S.hard.kills ? ` · ${fmt(S.hard.kills)} Hardcore kills` : ''}</small></div>`;
});
UIX.nowbar.push(() => (hardOn() && S.combat.zone != null ? '<span class="hc-tag" title="Hardcore">HC</span>' : ''));
let hcSeen = null;
UPD.push(() => {
  const st = document.getElementById('stage');
  if (!st) return;
  const on = hardOn() && S.combat.zone != null;
  if (st.classList.contains('hardcore') !== on) st.classList.toggle('hardcore', on);
  if (on !== hcSeen) { hcSeen = on; sideDirty = true; }
});
document.addEventListener('click', (ev) => {
  const t = ev.target.closest('[data-hardcore]');
  if (!t) return;
  setHardcore(!hardOn());
  toast(hardOn() ? 'Hardcore on: every stage hits much harder, and pays much more.' : 'Hardcore off.', hardOn() ? 'rare' : 'good');
});
