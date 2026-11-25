#!/usr/bin/env node
// Guardian walls. Since food keeps you standing (no regen in battle), what stops you at a guardian is its
// hardest blow: from the auto-eat line, can one hit drop you? This scales each guardian's ATTACK until the
// analytic run meets it at a target blow / eat-line ratio on arrival (above 1: get more HP and defense
// first); its HP goes down by as much, so a fight costs the same food.
//   node tools/sim/tune-bosses.js [target=1.3] [rounds=5] [zone=ratio,...]
// Prints BOSS_BITE (attack multipliers) for js/worlds.js.
'use strict';
const { load } = require('./load');
const target = +(process.argv[2] || 1.3), rounds = +(process.argv[3] || 5);
const per = Object.fromEntries((process.argv[4] || '').split(',').filter(Boolean).map((x) => { const [k, v] = x.split('='); return [k, +v]; }));
const mult = {};                                   // zone id -> factor on the guardian's attack and HP
const patchFor = () => `for (const z of ZONES) if (z.boss && ${JSON.stringify(mult)}[z.id]) for (const e of z.enemies) { e.atk = Math.round(e.atk * ${JSON.stringify(mult)}[z.id]); e.hp = Math.round(e.hp / ${JSON.stringify(mult)}[z.id]); }`;
let rep, C;
for (let r = 0; r < rounds; r++) {
  C = load({ patch: patchFor() });
  rep = C.simRun({ maxH: 1500, stuckH: 168 });
  const line = [];
  for (const [z, w] of Object.entries(rep.walls)) {
    // the blow is linear in attack; damped to converge as the timeline shifts
    const f = Math.pow((per[z] || target) / Math.max(0.02, w.b0), 0.8);
    mult[z] = (mult[z] || 1) * f;
    line.push(`${z} ${w.b0.toFixed(2)}`);
  }
  console.log(`round ${r + 1}: ${line.join(' · ')} · path ${rep.goal}/${rep.goals} in ${rep.hours} h`);
}
const src = require('fs').readFileSync(require('path').resolve(__dirname, '../../js/worlds.js'), 'utf8');
const m0 = /const BOSS_BITE = (\{[^}]*\});/.exec(src);
const cur = m0 ? Function('return ' + m0[1])() : {};
const out = Object.assign({}, cur);
for (const z in mult) out[z] = +((cur[z] || 1) * mult[z]).toFixed(3);
console.log('\nconst BOSS_BITE = ' + JSON.stringify(out).replace(/"(\w+)":/g, '$1: ').replace(/,/g, ', ') + ';');
