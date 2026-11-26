#!/usr/bin/env node
'use strict';
/* Reads testers' play data and prints what it says about the game.
   Usage: node tools/telemetry/report.js <files or folders...> [--json] [--dev] [--player <id>]
   Accepts: the "Play data" file (Settings → Pre-alpha), or a save (the "Copy my save" text, base64 or JSON).
   --dev keeps saves where dev mode was used (left out by default). --json prints the aggregate as JSON.
   Format of the data: see the header of js/telemetry.js. */

const fs = require('fs');
const path = require('path');

const args = process.argv.slice(2);
const flag = (f) => args.includes(f);
const opt = (f) => { const i = args.indexOf(f); return i >= 0 ? args[i + 1] : null; };
const inputs = args.filter((a, i) => !a.startsWith('--') && args[i - 1] !== '--player');
if (!inputs.length) { console.log('Usage: node tools/telemetry/report.js <files or folders...> [--json] [--dev] [--player <id>]'); process.exit(1); }

/* ------------------------------------------------------------------ loading */
function files(p) {
  const st = fs.statSync(p);
  if (!st.isDirectory()) return [p];
  return fs.readdirSync(p).flatMap((f) => files(path.join(p, f)));
}
function parse(text) {
  text = text.trim();
  let d = null;
  try { d = JSON.parse(text); } catch (e) {
    try { d = JSON.parse(decodeURIComponent(escape(Buffer.from(text, 'base64').toString('binary')))); } catch (er) { return null; }
  }
  if (d && d.kind === 'anime-idle-rpg-telemetry') return d;
  if (d && d.tel && d.skills) return { kind: 'save', schema: d.tel.v, at: d.last, build: '', devUsed: d.devUsed || 0, tel: d.tel, state: { stats: d.stats, gold: d.gold }, snapKeys: null };
  return null;
}
const players = new Map();
let skipped = 0, dev = 0;
for (const f of inputs.flatMap(files)) {
  const d = parse(fs.readFileSync(f, 'utf8'));
  if (!d || !d.tel) { skipped++; continue; }
  if (d.devUsed && !flag('--dev')) { dev++; continue; }
  const key = d.tel.id + '/' + d.tel.run;
  const old = players.get(key);
  // latest file per run; a Play data file (device, build) beats a bare save
  const rank = (x) => (x.kind === 'save' ? 0 : 1);
  if (!old || rank(old) < rank(d) || (rank(old) === rank(d) && (old.at || 0) < (d.at || 0))) players.set(key, Object.assign(d, { file: path.basename(f) }));   // latest file per run
}
let P = [...players.values()];
if (opt('--player')) P = P.filter((d) => d.tel.id.startsWith(opt('--player')) || d.tel.run.startsWith(opt('--player')));
if (!P.length) { console.log(`No play data found (${skipped} unreadable, ${dev} with dev mode).`); process.exit(0); }

const SNAP_KEYS = ['t', 'play', 'live', 'char', 'lvSum', 'gold', 'bounty', 'kills', 'deaths', 'maxHit', 'maxHp', 'def', 'spd', 'luck', 'found', 'worlds', 'gates', 'unlocks', 'pets', 'techs', 'food'];

/* ------------------------------------------------------------------ helpers */
const sum = (a) => a.reduce((x, y) => x + y, 0);
const q = (a, p) => { if (!a.length) return NaN; const s = a.slice().sort((x, y) => x - y), i = (s.length - 1) * p, lo = Math.floor(i); return s[lo] + (s[Math.ceil(i)] - s[lo]) * (i - lo); };
const med = (a) => q(a, 0.5);
const hrs = (s) => (isFinite(s) ? (s / 3600 < 10 ? (s / 3600).toFixed(1) : Math.round(s / 3600)) + ' h' : '-');
const days = (s) => (isFinite(s) ? (s / 86400).toFixed(1) + ' d' : '-');
const pc = (x) => (isFinite(x) ? Math.round(x * 100) + '%' : '-');
const pad = (s, n) => String(s).padEnd(n);
const lpad = (s, n) => String(s).padStart(n);
const fmtN = (n) => (Math.abs(n) >= 1e6 ? (n / 1e6).toFixed(1) + 'M' : Math.abs(n) >= 1e3 ? (n / 1e3).toFixed(1) + 'K' : String(Math.round(n)));
const out = {};
const lines = [];
const say = (s = '') => lines.push(s);
const head = (s) => { say(''); say('== ' + s + ' ' + '='.repeat(Math.max(0, 70 - s.length))); };
const table = (rows, widths) => rows.forEach((r) => say(r.map((c, i) => (i ? lpad(c, widths[i]) : pad(c, widths[i]))).join('  ')));

/* ------------------------------------------------------------------ players */
head(`Players: ${P.length}${dev ? ` (${dev} dev-mode saves left out)` : ''}${skipped ? `, ${skipped} unreadable files` : ''}`);
const builds = {};
P.forEach((d) => { const v = d.build || '?'; builds[v] = (builds[v] || 0) + 1; });
say('Builds: ' + Object.entries(builds).map(([k, v]) => `${k} ×${v}`).join(', '));
const rowsP = [['player', 'live', 'hidden', 'offline', 'away', 'sessions', 'char', 'worlds', 'deaths', 'device']];
out.players = P.map((d) => {
  const L = d.tel, s = L.snap[L.snap.length - 1] || [], t = L.time;
  const r = { id: L.id.slice(0, 6) + '/' + L.run.slice(0, 4), live: t.live, hid: t.hid, off: t.off, away: t.away, ses: L.ses.length + (L.cur ? 1 : 0),
    char: s[3], worlds: s[15], deaths: s[8], device: d.device ? (d.device.touch ? 'touch' : 'desk') + ' ' + d.device.w + 'x' + d.device.h : '?' };
  rowsP.push([r.id, hrs(r.live), hrs(r.hid), hrs(r.off), hrs(r.away), r.ses, r.char, r.worlds, r.deaths, r.device]);
  return r;
});
table(rowsP, [12, 7, 7, 8, 7, 8, 5, 6, 6, 16]);

/* ------------------------------------------------------------------ milestones */
head('Milestones: when players reach them (median, 25-75%), play time = game seconds incl. offline');
const ms = {};
for (const d of P) {
  const seen = new Set();
  for (const r of d.tel.tl) {
    const [play, real, code, a, b] = r;
    if (b === 'start') continue;                     // already there when telemetry began
    let key = null;
    if (code === 'lv' && (a === 'character' ? b % 5 === 0 : b % 10 === 0 || b === 5)) key = `lv ${a} ${b}`;
    else if (['gate', 'boss', 'goal', 'chapter', 'dgclear', 'trial', 'seal', 'breakthrough', 'pet', 'firstscroll'].includes(code)) key = `${code} ${a}`;
    else if (code === 'un' && /^(feature|realm):/.test(a)) key = `unlock ${a}`;
    if (!key || seen.has(key)) continue;
    seen.add(key);
    (ms[key] = ms[key] || { play: [], real: [] }).play.push(play);
    ms[key].real.push(real);
  }
}
const msRows = Object.entries(ms).map(([k, v]) => ({ k, n: v.play.length, play: med(v.play), p25: q(v.play, 0.25), p75: q(v.play, 0.75), real: med(v.real) }))
  .sort((a, b) => a.play - b.play);
out.milestones = msRows;
table([['milestone', 'players', 'play med', '25%', '75%', 'real med']].concat(msRows.map((r) => [r.k.slice(0, 44), `${r.n}/${P.length}`, hrs(r.play), hrs(r.p25), hrs(r.p75), days(r.real)])), [44, 8, 9, 7, 7, 9]);

/* ------------------------------------------------------------------ progression curve */
head('Character level by real days since start (median over players who got that far)');
const atDay = (d, day) => { const s = d.tel.snap.filter((r) => r[0] - d.tel.t0 <= day * 86400e3); return s.length && (d.at - d.tel.t0) >= day * 86400e3 * 0.9 ? s[s.length - 1] : null; };
const curve = [0.25, 1, 2, 3, 5, 7, 10, 14, 21, 30].map((day) => {
  const s = P.map((d) => atDay(d, day)).filter(Boolean);
  return { day, n: s.length, char: med(s.map((r) => r[3])), lvSum: med(s.map((r) => r[4])), worlds: med(s.map((r) => r[15])), gold: med(s.map((r) => r[5])), maxHit: med(s.map((r) => r[9])) };
}).filter((r) => r.n);
out.curve = curve;
table([['day', 'players', 'char', 'all lv', 'worlds', 'gold', 'max hit']].concat(curve.map((r) => [r.day, r.n, Math.round(r.char), Math.round(r.lvSum), r.worlds, fmtN(r.gold), fmtN(r.maxHit)])), [6, 8, 6, 7, 7, 8, 8]);

/* ------------------------------------------------------------------ time */
head('Where the time goes (all players; live = game open, off = simulated while away)');
const act = {};
for (const d of P) for (const [k, [live, off]] of Object.entries(d.tel.act)) {
  const g = k === 'idle' ? 'idle' : k.startsWith('z:') ? 'battle ' + k.slice(2) : k.split(':')[0];
  const a = act[g] = act[g] || [0, 0, new Set()]; a[0] += live; a[1] += off; a[2].add(d.tel.id);
}
const totAct = sum(Object.values(act).map((a) => a[0] + a[1]));
const actRows = Object.entries(act).map(([k, a]) => ({ k, live: a[0], off: a[1], share: (a[0] + a[1]) / totAct, players: a[2].size })).sort((a, b) => b.live + b.off - a.live - a.off);
out.activities = actRows;
table([['activity', 'share', 'live', 'offline', 'players']].concat(actRows.slice(0, 40).map((r) => [r.k.slice(0, 30), pc(r.share), hrs(r.live), hrs(r.off), r.players])), [30, 6, 8, 8, 8]);
const idle = act.idle ? act.idle[1] / Math.max(1, sum(Object.values(act).map((a) => a[1]))) : 0;
say(`Offline time spent with nothing running: ${pc(idle)}`);

head('Sessions and returns');
const ses = P.flatMap((d) => d.tel.ses.concat(d.tel.cur ? [[d.tel.cur.t, d.tel.cur.live, d.tel.cur.away, d.tel.cur.clk, d.tel.cur.err, d.tel.cur.views]] : []));
const lens = ses.map((s) => s[1]), aways = ses.map((s) => s[2]).filter((a) => a > 0);
const perDay = P.map((d) => (d.tel.ses.length + 1) / Math.max(1, (d.at - d.tel.t0) / 86400e3));
say(`Sessions: ${ses.length} · length median ${hrs(med(lens))} (25% ${hrs(q(lens, 0.25))}, 75% ${hrs(q(lens, 0.75))}) · per day median ${med(perDay).toFixed(1)}`);
say(`Away between sessions: median ${hrs(med(aways))}, 75% ${hrs(q(aways, 0.75))}, 90% ${hrs(q(aways, 0.9))}`);
const capped = sum(P.map((d) => d.tel.time.capped)), away = sum(P.map((d) => d.tel.time.away));
say(`Away time past the offline cap (goes to the Time Chamber): ${pc(capped / Math.max(1, away))}`);
const backs = P.flatMap((d) => d.tel.back);
const backBy = {};
for (const b of backs) { const k = b[2] === 'idle' ? 'idle' : b[2].startsWith('z:') ? 'battle' : 'skill'; (backBy[k] = backBy[k] || []).push(b); }
say('Returns by what was running: ' + Object.entries(backBy).map(([k, v]) => `${k} ${v.length} (deaths ${sum(v.map((b) => b[6]))}, levels ${sum(v.map((b) => b[3]))})`).join(' · '));
const errs = sum(ses.map((s) => s[4] || 0));
say(`Sessions with JS errors: ${ses.filter((s) => s[4]).length} (${errs} errors)`);
out.sessions = { n: ses.length, lenMed: med(lens), awayMed: med(aways), perDay: med(perDay), capped: capped / Math.max(1, away), offlineIdle: idle };

/* ------------------------------------------------------------------ pages and controls */
head('Pages (time with the game open, opens)');
const view = {};
for (const d of P) for (const [k, [t, n]] of Object.entries(d.tel.view)) { const g = k.replace(/^realm:[^:]+:/, 'skill:'); const v = view[g] = view[g] || [0, 0, 0]; v[0] += t; v[1] += n; v[2]++; }
const totV = sum(Object.values(view).map((v) => v[0]));
const vRows = Object.entries(view).sort((a, b) => b[1][0] - a[1][0]);
out.views = Object.fromEntries(vRows);
table([['page', 'time', 'share', 'opens', 'players']].concat(vRows.slice(0, 30).map(([k, v]) => [k.slice(0, 30), hrs(v[0]), pc(v[0] / totV), v[1], v[2]])), [30, 7, 6, 7, 8]);
const never = ['hero', 'character', 'bank', 'settings', 'quests', 'dungeons', 'techniques', 'collection', 'market'].filter((k) => !view[k]);
if (never.length) say('Never opened by anyone: ' + never.join(', '));

head('Controls clicked (top 40)');
const click = {};
for (const d of P) for (const [k, [n]] of Object.entries(d.tel.click)) click[k] = (click[k] || 0) + n;
const cRows = Object.entries(click).sort((a, b) => b[1] - a[1]);
out.clicks = Object.fromEntries(cRows);
for (let i = 0; i < Math.min(40, cRows.length); i += 2) say(cRows.slice(i, i + 2).map(([k, n]) => pad(k.slice(0, 30), 31) + lpad(n, 6)).join('    '));

/* ------------------------------------------------------------------ combat */
head('Battle stages: deaths, food, elites');
const zone = {};
for (const d of P) for (const [k, z] of Object.entries(d.tel.zone)) { const a = zone[k] = zone[k] || [0, 0, 0, 0, 0, 0]; z.forEach((x, i) => (a[i] += x)); }
for (const d of P) for (const [k, [live, off]] of Object.entries(d.tel.act)) if (k.startsWith('z:') && zone[k.slice(2)]) zone[k.slice(2)][5] += live + off;
const zRows = Object.entries(zone).sort((a, b) => b[1][5] - a[1][5]);
out.zones = Object.fromEntries(zRows);
table([['stage', 'fought', 'deaths', 'food', 'food/h', 'no food', 'elites', 'alphas']].concat(zRows.map(([k, z]) => [k.slice(0, 26), hrs(z[5]), z[0], z[1], (z[1] / Math.max(1 / 60, z[5] / 3600)).toFixed(0), pc(z[2] / Math.max(1, z[5])), z[3], z[4]])), [26, 7, 7, 6, 7, 8, 7, 7]);
const killers = {};
for (const d of P) for (const r of d.tel.death) { const k = r[2] + ' · ' + r[3]; killers[k] = (killers[k] || 0) + 1; }
say('Deadliest foes: ' + Object.entries(killers).sort((a, b) => b[1] - a[1]).slice(0, 10).map(([k, n]) => `${k} ×${n}`).join(', '));
const noFoodDeaths = P.flatMap((d) => d.tel.death).filter((r) => !r[5]).length, allDeaths = P.flatMap((d) => d.tel.death).length;
say(`Deaths with no food left: ${noFoodDeaths}/${allDeaths}`);

const dg = {};
for (const d of P) for (const [k, r] of Object.entries(d.tel.dg)) { const a = dg[k] = dg[k] || [0, 0, 0, 0, 0]; r.forEach((x, i) => (a[i] += x)); }
if (Object.keys(dg).length) {
  head('Dungeons');
  out.dungeons = dg;
  table([['dungeon', 'clears', 'fails', 'avg time', 'food/clear']].concat(Object.entries(dg).map(([k, a]) => [k, a[0], a[1], a[0] ? Math.round(a[2] / a[0]) + ' s' : '-', a[0] ? (a[3] / a[0]).toFixed(1) : '-'])), [24, 7, 6, 9, 11]);
}

/* ------------------------------------------------------------------ economy */
head('Gold in / out by source');
const gold = {};
for (const d of P) for (const [k, [i, o]] of Object.entries(d.tel.gold)) { const a = gold[k] = gold[k] || [0, 0]; a[0] += i; a[1] += o; }
const gRows = Object.entries(gold).sort((a, b) => b[1][0] + b[1][1] - a[1][0] - a[1][1]);
out.gold = Object.fromEntries(gRows);
table([['source', 'in', 'out']].concat(gRows.slice(0, 25).map(([k, [i, o]]) => [k.slice(0, 30), fmtN(i), fmtN(o)])), [30, 9, 9]);

head('Engine events (top 30) and rare finds');
const ev = {};
for (const d of P) for (const [k, [n]] of Object.entries(d.tel.ev)) ev[k] = (ev[k] || 0) + n;
const eRows = Object.entries(ev).sort((a, b) => b[1] - a[1]);
out.events = Object.fromEntries(eRows);
for (let i = 0; i < Math.min(30, eRows.length); i += 3) say(eRows.slice(i, i + 3).map(([k, n]) => pad(k.slice(0, 22), 23) + lpad(fmtN(n), 7)).join('   '));
const finds = P.flatMap((d) => d.tel.find);
say(`Rare finds logged: ${finds.length} · offline share ${pc(finds.filter((f) => f[4]).length / Math.max(1, finds.length))}`);

if (flag('--json')) console.log(JSON.stringify(out, null, 1));
else console.log(lines.join('\n'));
