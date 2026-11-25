'use strict';
/* ==========================================================================
   ANIME IDLE RPG — Hardcore mode, DOM-free
   A switch on the Battlefield. While it is on, every stage (guardians too) fights at
   Hardcore strength and pays for it:
     foes ×3 HP, ×2.5 attack, ×1.4 defense
     item drop chances ×3 (rare ones included, capped at certain), gold ×3, XP ×1.5
   It stacks with Ascension tiers. Turning it on or off restarts the current foe, so a
   weak foe can never be finished for Hardcore loot. Works offline like everything else.
   Unlocked after 25 victories in the Outer Districts (Soul City).
   Loaded after scouter.js and systems.js (wraps scaleEnemy).
   ========================================================================== */

const HARD = { hp: 3, atk: 2.5, def: 1.4, drops: 3, gold: 3, xp: 1.5 };
const hardUnlocked = () => isUnlocked('feature:hardcore');
const hardOn = () => !!(S.hard && S.hard.on) && hardUnlocked();
function setHardcore(on) {
  if (!S.hard || typeof S.hard !== 'object') S.hard = {};
  S.hard.on = !!on && hardUnlocked();
  const C = S.combat;
  if (C.zone != null) { C.enemy = null; C.respawn = 0.8; }
  dirty = true;
}
{
  const base = scaleEnemy, CACHE = new WeakMap();
  scaleEnemy = (zi, e) => {
    const x = base(zi, e);
    if (!hardOn()) return x;
    let h = CACHE.get(x);
    if (!h) {
      h = Object.assign({}, x, {
        base: x.base || x.name, hard: true,
        hp: Math.round(x.hp * HARD.hp), atk: Math.round(x.atk * HARD.atk), def: Math.round(x.def * HARD.def),
        xp: Math.round(x.xp * HARD.xp), gold: [Math.round(x.gold[0] * HARD.gold), Math.round(x.gold[1] * HARD.gold)],
        drops: (x.drops || []).map(([d, ch, q]) => {
          const sch = ITEMS[d] && ITEMS[d].type === 'schematic';
          return [d, sch ? ch : Math.min(1, ch * HARD.drops), q];
        }),
      });
      CACHE.set(x, h);
    }
    return h;
  };
}
hook('kill', (e) => { if (e && e.hard) { if (!S.hard) S.hard = {}; S.hard.kills = (S.hard.kills || 0) + 1; } });
