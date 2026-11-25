// Loads the DOM-free engine (index.html order, up to guide.js) and the simulator scripts into one VM.
// Deterministic: Date is frozen and Math.random is a constant 0.5 while the engine loads, then THROWS
// during the simulation (any random roll in the macro loop is a bug: the model is expected values only).
'use strict';
const fs = require('fs'), vm = require('vm'), path = require('path');

const ROOT = path.resolve(__dirname, '../..') + '/';
const ENGINE = ['data', 'worlds', 'lore', 'armory', 'depth', 'tiers', 'loot', 'game', 'systems', 'techniques', 'expeditions', 'weapons',
  'chamber', 'tasks', 'missions', 'report', 'huntlist', 'scouter', 'hardcore', 'omens', 'poster', 'quality', 'seas', 'soul', 'kaio', 'hex',
  'hunt', 'echo', 'leaf', 'foes', 'builds', 'dungeons', 'economy', 'trials', 'story', 'guide'];
const SIM = ['model', 'planner', 'macro'];

function load(opts) {
  opts = opts || {};
  const store = {};
  const T0 = Date.UTC(2026, 10, 23, 8, 0, 0);
  const RD = Date;
  class FrozenDate extends RD {
    constructor(...a) { if (!a.length) super(T0); else super(...a); }
    static now() { return T0; }
  }
  const rng = { strict: false, calls: 0 };
  const M = Object.create(Math);
  M.random = () => { if (rng.strict) throw new Error('Math.random called inside the analytic simulation'); rng.calls++; return 0.5; };
  const ctx = { console, Math: M, Date: FrozenDate, JSON, Object, Array, Number, String, Boolean, isFinite, isNaN, parseInt, parseFloat, Set, Map, Error, Proxy, Reflect, Symbol, Infinity, NaN,
    performance: { now: () => 0 }, setTimeout: () => 0, clearTimeout() {}, setInterval: () => 0, navigator: {}, confirm: () => true,
    localStorage: { getItem: (k) => store[k] || null, setItem: (k, v) => { store[k] = v; }, removeItem() {} }, __rng: rng, __opts: opts };
  ctx.window = ctx; ctx.globalThis = ctx;
  vm.createContext(ctx);
  let src = '';
  for (const f of ENGINE) src += `\n// ==== js/${f}.js\n` + fs.readFileSync(ROOT + 'js/' + f + '.js', 'utf8').replace(/^'use strict';/, '');
  for (const f of SIM) src += `\n// ==== tools/sim/${f}.js\n` + fs.readFileSync(path.join(__dirname, f + '.js'), 'utf8').replace(/^'use strict';/, '');
  if (opts.patch) src += '\n;' + opts.patch;   // knob overrides for experiments, run after everything
  vm.runInContext(src, ctx, { filename: 'sim-bundle.js' });
  return ctx;
}
module.exports = { load, ROOT };
