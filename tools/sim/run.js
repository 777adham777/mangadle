#!/usr/bin/env node
// Analytic balance simulator: plays the whole quest path with expected values and event jumps.
//   node tools/sim/run.js                 p50 drops, 3 one-hour sessions a day (8 h, 13 h, 20 h), 800 h max
//   node tools/sim/run.js --p90           key drops at their p90 time (an unlucky player)
//   node tools/sim/run.js --sessions 2    two sessions a day (12 h, 20 h)
//   node tools/sim/run.js --always-on     the game never closed, always re-planned (upper bound)
//   node tools/sim/run.js --json out.json full report as JSON
//   node tools/sim/run.js --patch "XP_RATE=2"   any JS run after loading (knob experiments)
'use strict';
const { load } = require('./load');
const argv = process.argv.slice(2), has = (f) => argv.includes(f), val = (f) => { const i = argv.indexOf(f); return i >= 0 ? argv[i + 1] : null; };

const t0 = process.hrtime.bigint();
const C = load({ patch: val('--patch') });
const t1 = process.hrtime.bigint();
const SESS = { 2: [[12, 13], [20, 21]], 3: [[8, 9], [13, 14], [20, 21]] };
const sessions = has('--always-on') ? null : SESS[val('--sessions') || 3];
const rep = C.simRun({ q: has('--p90') ? 90 : 50, sessions, maxH: +(val('--hours') || 800), trace: +(val('--trace') || 0) });
const t2 = process.hrtime.bigint();
if (val('--trace')) { console.log(rep.trace.join('\n')); console.log(rep.log.slice(0, 40).join('\n')); }
const ms = (a, b) => Number(b - a) / 1e6;

if (val('--json')) require('fs').writeFileSync(val('--json'), JSON.stringify(rep, null, 1));
const pad = (s, n) => String(s).padEnd(n), lpad = (s, n) => String(s).padStart(n);
const day = (h) => { const x = 8 + h, d = Math.floor(x / 24) + 1, m = Math.round((x % 24) * 60); return `day ${d} ${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`; };
console.log(`Analytic run · drops at p${has('--p90') ? 90 : 50} · ${sessions ? sessions.length + ' one-hour sessions a day (' + sessions.map((x) => x[0] + 'h').join(', ') + '), game closed in between' : 'always on'}`);
console.log(`load ${ms(t0, t1).toFixed(0)} ms · simulation ${ms(t1, t2).toFixed(0)} ms · ${rep.jumps} jumps · no random loop (Math.random throws during the run; ${rep.medianRolls} fixed median roll${rep.medianRolls === 1 ? '' : 's'} for one-shot hooks)`);
console.log(`end: ${rep.hours} h · path ${rep.goal}/${rep.goals} · Character ${rep.char} · skills avg ${rep.avgSkill} · gold ${rep.gold.toLocaleString('en')} · bank ${rep.bankItems.toLocaleString('en')} items\n`);

console.log('MILESTONES (cumulative hours)');
const keyIds = /^(gate_|chop10|fox|admiral|sovereign|tyrant|matriarch|chimera|pillar|unbound|dg_)/;
for (const m of rep.milestones) if (keyIds.test(m.id) || m.i % 10 === 0) console.log(`  ${pad(day(m.h), 13)} ${lpad(m.h.toFixed(1), 6)} h  #${lpad(m.i, 2)} ${pad(m.id, 14)} ${m.text}`);
console.log('\nUNLOCKS');
for (const [h, e] of rep.events.filter(([, e]) => /^gate/.test(e))) console.log(`  ${pad(day(h), 13)} ${e}`);
const P2 = rep.play;
console.log(`\nPLAY: ${P2.activeH} h in sessions, ${P2.offlineH} h closed (${P2.offlineIdleH} h of it doing nothing: the task stopped ${P2.offlineStops} times)`);

console.log('\nTIME SPLIT (hours)');
const tot = rep.split.reduce((a, [, h]) => a + h, 0);
for (const [k, h] of rep.split) console.log(`  ${pad(k, 34)} ${lpad(h.toFixed(1), 7)}  ${lpad((100 * h / tot).toFixed(1), 5)}%`);

console.log('\nBOTTLENECKS');
if (rep.skipped.length) { console.log('  goals stuck > 24 h (skipped):'); for (const s of rep.skipped) console.log(`    #${s.goal} ${s.id} "${s.text}" at ${s.h} h · was doing ${s.task}`); }
const longWaits = rep.wants.filter((w) => w.waitedH >= 6).slice(0, 12);
if (longWaits.length) { console.log('  gold: purchases waited on (≥ 6 h, the bot spends at most 25% of its gold per buy):'); for (const w of longWaits) console.log(`    ${pad(w.what, 26)} ${lpad(w.cost.toLocaleString('en'), 14)} g · ${w.waitedH} h${w.bought ? '' : ' (never bought)'}`); }
const stops = P2.offLog.filter((x) => x[2] < x[3] * 0.95);
if (stops.length) console.log(`  offline farms that could not last the gap: ${stops.length}/${P2.offLog.length} (e.g. ${stops.slice(0, 3).map((x) => x[1] + ' ' + x[2] + 'h/' + x[3] + 'h').join(', ')})`);
console.log(`  food: ${rep.food.foodH} h making food for ${rep.food.fightH} h of combat (ratio ${rep.food.ratio})`);
if (rep.deaths.length) console.log(`  deaths: ${rep.deaths.length} (${rep.deaths.slice(0, 6).map(([h, z]) => z + '@' + h + 'h').join(', ')})`);
const so = Object.entries(rep.stockouts).sort((a, b) => b[1] - a[1]).slice(0, 8);
if (so.length) console.log('  inputs that ran out most: ' + so.map(([k, n]) => `${k} ×${n}`).join(', '));
const bad = rep.recipes.filter((r) => r.loss || (r.xphBestGather > 0 && r.xphAllIn < r.xphBestGather * 0.5)).slice(0, 10);
if (bad.length) { console.log('  recipes not worth it (value lost, or XP/h with input gathering < half the best gathering XP/h):'); for (const r of bad) console.log(`    ${pad(r.recipe, 30)} ${r.hours} h · value ${r.valueIn} → ${r.valueOut} · XP/h all-in ${r.xphAllIn}${r.xphBestGather ? ' vs gather ' + r.xphBestGather : ''}`); }
const notes = Object.entries(rep.notes);
if (notes.length) console.log('  planner notes: ' + notes.slice(0, 8).map(([k, n]) => `${k} (×${n})`).join(' · '));
