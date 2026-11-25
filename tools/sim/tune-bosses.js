#!/usr/bin/env node
// Guardian walls: scale each guardian until the analytic run meets it at a target power ratio on arrival
// (its time-to-kill / your time-to-die with your best gear; above 1 you cannot win yet: you must prepare).
//   node tools/sim/tune-bosses.js [target=2] [rounds=4] [zone=ratio,zone=ratio...]   (per-guardian targets)
// Prints the ZONE_BAL entries to paste in js/worlds.js (a guardian's attack and HP are divided by √BAL).
'use strict';
const { load } = require('./load');
const target = +(process.argv[2] || 2), rounds = +(process.argv[3] || 4);
const per = Object.fromEntries((process.argv[4] || '').split(',').filter(Boolean).map((x) => { const [k, v] = x.split('='); return [k, +v]; }));
const mult = {};                                   // zone id -> factor on the guardian's attack and HP
const patchFor = () => `for (const z of ZONES) if (z.boss && ${JSON.stringify(mult)}[z.id]) for (const e of z.enemies) { const m = ${JSON.stringify(mult)}[z.id]; e.atk = Math.round(e.atk * m); e.hp = Math.round(e.hp * m); }`;
let rep, C;
for (let r = 0; r < rounds; r++) {
  C = load({ patch: patchFor() });
  rep = C.simRun({ maxH: 1500, stuckH: 168 });
  const line = [];
  for (const [z, w] of Object.entries(rep.walls)) {
    // ratio ∝ HP × attack, so both move by √(target / ratio); damped to converge as the timeline shifts
    const f = Math.pow((per[z] || target) / Math.max(0.05, w.r0), 0.5 * 0.8);
    mult[z] = (mult[z] || 1) * f;
    line.push(`${z} ${w.r0.toFixed(2)}`);
  }
  console.log(`round ${r + 1}: ${line.join(' · ')} · path ${rep.goal}/${rep.goals} in ${rep.hours} h`);
}
const ZB = C.__ZONE_BAL || {};
const src = require('fs').readFileSync(require('path').resolve(__dirname, '../../js/worlds.js'), 'utf8');
const cur = Function('return ' + /const ZONE_BAL = (\{[^}]*\});/.exec(src)[1])();
const out = Object.assign({}, cur);
for (const z in mult) out[z] = +((cur[z] || 1) / (mult[z] * mult[z])).toFixed(3);
console.log('\nconst ZONE_BAL = ' + JSON.stringify(out).replace(/"(\w+)":/g, '$1: ').replace(/,/g, ', ') + ';');
