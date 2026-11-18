'use strict';
/* ==========================================================================
   TRI-REALM — expeditions (GDD §4.4), DOM-free. Voyaging destinations are the
   SKILLS.voyaging.actions (data.js); a card no longer starts an action: it sends a ship.
   - A ship sails 10 min, 1 h, 4 h or 8 h in parallel with whatever you do (offline too).
   - It needs wood for the hull (the destination's log); a dish is optional: +30% loot.
   - On return it brings one haul per minute at sea (longer trips and Voyaging speed add more):
     gold, the destination's table, its rare finds and cargo, Voyaging XP and mastery.
   - 1 ship at first, a 2nd at Voyaging 30. "Repeat" sends it out again on its own.
   ========================================================================== */

const EXP_DURS = [[600, '10 min', 0], [3600, '1 hour', 0.05], [14400, '4 hours', 0.10], [28800, '8 hours', 0.15]];
const EXP_HAUL = 60;            // seconds at sea per haul
const EXP_FOOD = 0.3;           // provisions: +30% hauls
const EXP_XP = 2;               // Voyaging XP per haul = 2 × the destination's base XP
const expOn = () => skillOpen('voyaging');
const shipSlots = () => (expOn() ? 1 + (skillLv('voyaging') >= 30 ? 1 : 0) : 0);
const durBonus = (d) => (EXP_DURS.find((x) => x[0] === d) || [0, '', 0])[2];
const hullOf = (a) => Object.keys(a.in).find((k) => ITEMS[k].type !== 'food');
const dishOf = (a) => Object.keys(a.in).find((k) => ITEMS[k].type === 'food');
// What a trip of `dur` seconds costs: hull wood (required) and provisions (optional).
const expCost = (a, dur) => ({ hull: hullOf(a), hullN: 2 * Math.round(dur / 600), dish: dishOf(a), dishN: Math.round(dur / 600) });
const expHauls = (a, dur, food) => Math.max(1, Math.round((dur / EXP_HAUL) * (1 + durBonus(dur)) * (food ? 1 + EXP_FOOD : 1) * skillSpeed('voyaging', a.id)));

function expBlock(a, dur) {
  if (!expOn()) return 'Locked';
  if (skillLv('voyaging') < a.level) return `Requires Voyaging ${a.level}`;
  if (S.exped.ships.length >= shipSlots()) return shipSlots() > 1 ? 'Every ship is at sea' : 'Your ship is at sea';
  const c = expCost(a, dur);
  if (stock(c.hull) < c.hullN) return `Needs ${c.hullN} ${ITEMS[c.hull].name}`;
  return '';
}
function sendExp(id, dur, quiet) {
  const a = findAction('voyaging', id);
  dur = dur || S.exped.dur;
  const why = a ? expBlock(a, dur) : 'Unknown destination';
  if (why) { if (!quiet) toast(why, 'bad'); return false; }
  const c = expCost(a, dur);
  takeStock(c.hull, c.hullN);
  const food = S.exped.food && stock(c.dish) >= c.dishN;
  if (food) takeStock(c.dish, c.dishN);
  S.exped.ships.push({ id, dur, left: dur, food });
  emit('expsend', { id, dur, food });
  dirty = true;
  return true;
}
function recallShip(i) {
  const sh = S.exped.ships[i];
  if (!sh) return;
  S.exped.ships.splice(i, 1);   // the hull wood and provisions are lost at sea
  dirty = true;
}

function returnShip(sh) {
  const a = findAction('voyaging', sh.id);
  if (!a) return;
  const n = expHauls(a, sh.dur, sh.food), gains = {};
  let gold = 0;
  for (let i = 0; i < n; i++) {
    gold += rollLoot(a.loot, 1, gains);
    for (const [k, ch, q] of a.extra || []) if (Math.random() < ch) { const m = randInt(q[0], q[1]); addItem(k, m); gains[k] = (gains[k] || 0) + m; }
    rollRareFinds('voyaging', a, gains);
    addXp('voyaging', a.xp * EXP_XP);
    S.mastery['voyaging:' + a.id] = (S.mastery['voyaging:' + a.id] || 0) + 1;
    hrun('action', 'voyaging', a, 1, gains);
  }
  S.stats.voyages++;
  S.exped.last = { id: sh.id, dur: sh.dur, hauls: n, gold, gains };
  emit('expedition', { id: sh.id, act: a, gold, gains, hauls: n });
  dirty = true;
}
hook('tick', (dt) => {
  const E = S.exped;
  if (!E.ships.length) return;
  for (const sh of E.ships) sh.left -= dt;
  const back = E.ships.filter((sh) => sh.left <= 0);
  if (!back.length) return;
  E.ships = E.ships.filter((sh) => sh.left > 0);
  for (const sh of back) {
    returnShip(sh);
    if (E.repeat) sendExp(sh.id, sh.dur, true);
  }
});
// The cards on the Voyaging page send ships; nothing there runs as your main activity any more.
{
  const base = startAction;
  startAction = function (skill, id) {
    if (SKILLS[skill] && SKILLS[skill].type === 'voyage') return sendExp(id);
    return base(skill, id);
  };
}
