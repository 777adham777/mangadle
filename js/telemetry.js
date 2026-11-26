'use strict';
/* ==========================================================================
   ANIME IDLE RPG — play telemetry (pre-alpha). DOM-light, loaded right before ui-systems.js boots the game,
   so the offline catch-up at boot is recorded too.

   What it records (in the save, S.tel): how the game is played, never who plays it. No name, no typed text,
   no browsing data. It stays on the device: the player hands it over with Settings → Play data (or with
   their save in a bug report). tools/telemetry/report.js reads those files.

     time    seconds played live (tab visible / tab hidden), simulated offline, real time away
     act     seconds per activity ("skill:action", "z:<zone>", "idle"), live and offline
     view    seconds and opens per page
     click   clicks per control (its data-* name, and value when it is a short id)
     ev      count of every engine event (hits, kills, techniques by id, dungeons...)
     gold    gold in / out per source (activity while the engine runs, the control clicked otherwise)
     zone    per battle stage: deaths, food eaten, seconds fought with no food left, elites
     dg      per dungeon: clears, fails, total clear time, food eaten
     tl      timeline: levels, unlocks, gates, first boss kills, goals, chapters... with play time + real time
     snap    a progression snapshot every 30 min of play and at each session start (see TEL_SNAP_KEYS)
     ses     sessions: start, live seconds, time away before it, errors
     back    returns: time away, time simulated, what ran, what it gave
     death / find   last deaths and rare finds, with context
   Every part is capped (TEL_CAP): a year of play stays well under 100 KB.
   ========================================================================== */

const TEL_V = 1;
const TEL_CAP = { tl: 1500, snap: 400, ses: 250, back: 150, death: 150, find: 250, keys: 600 };
const TEL_SNAP_EVERY = 1800;        // seconds of live play between snapshots
const TEL_NEW_SESSION = 300;        // a tab hidden this long starts a new session when it comes back
const TEL_SNAP_KEYS = ['t', 'play', 'live', 'char', 'lvSum', 'gold', 'bounty', 'kills', 'deaths', 'maxHit', 'maxHp', 'def',
  'spd', 'luck', 'found', 'worlds', 'gates', 'unlocks', 'pets', 'techs', 'food'];
// Events written to the timeline (first time or every time), with what to keep of their payload.
const TEL_TL_EVENTS = {
  goal: (d) => d && d.id, pet: (d) => d && d.id, schematic: (d) => d, chapter: (d) => d && (d.id || d.realm || d.title),
  breakthrough: (d) => d && d.limit, firstscroll: (d) => d, seal: (d) => d, specialgrade: () => '',
  trial: (d) => d && d.t && d.t.id, dgopen: (d) => d, awaken: (d) => d && d.id, awakenarm: (d) => d && (d.id || ''),
  card: (d) => (d && d.done ? 'page:' + d.id : null), renown: (d) => (d && d.level % 10 === 0 ? d.realm + ':' + d.level : null),
};
// Events counted per id (ev["tech:mist_step"]...).
const TEL_EV_ID = { tech: 'id', eat: 'id', dgclear: 'id', dgend: 'why', expedition: 'id', quality: 'q', mission: 'why' };

// A random id for this browser (to tell files apart), and one per run (a new game gets a new one).
const telRand = () => Math.random().toString(36).slice(2, 10) + Math.random().toString(36).slice(2, 6);
function telInstall() {
  let id = null;
  try { id = localStorage.getItem('trirealm_tel_id'); if (!id) { id = telRand(); localStorage.setItem('trirealm_tel_id', id); } } catch (e) { id = id || 'nostorage'; }
  return id;
}
const TEL_INSTALL = telInstall();

function telNew() {
  return {
    v: TEL_V, id: TEL_INSTALL, run: telRand(), t0: Date.now(), ver: [], dev: 0,
    time: { live: 0, hid: 0, off: 0, away: 0, capped: 0, fast: 0 },
    act: {}, view: {}, click: {}, ev: {}, gold: {}, zone: {}, dg: {},
    tl: [], snap: [], ses: [], back: [], death: [], find: [],
    cur: null, lastSnap: 0, seenU: 0, seenG: 0,
  };
}
// Older saves, a new game, an imported save: S.tel is created on first use.
function T() {
  if (!S.tel || S.tel.v !== TEL_V) S.tel = telNew();
  return S.tel;
}
// Telemetry must never break the game.
function tsafe(fn) { return function (...a) { try { return fn.apply(this, a); } catch (e) { if (!tsafe.warned) { tsafe.warned = true; console.warn('telemetry:', e); } return undefined; } }; }

const telRound = (x) => Math.round(x * 10) / 10;
const telPlay = () => Math.round((S.stats && S.stats.playtime) || 0);
const telReal = () => Math.round((Date.now() - T().t0) / 1000);
const telOff = () => (RESTING ? 1 : 0);
// A map with a cap on its number of keys (overflow lands in "_other").
function telBump(map, k, i, by, width) {
  if (!(k in map) && Object.keys(map).length >= TEL_CAP.keys) k = '_other';
  let row = map[k];
  if (!row) row = map[k] = new Array(width || 1).fill(0);
  row[i] = telRound(row[i] + by);
  return row;
}
function telPush(list, cap, row) { list.push(row); if (list.length > cap) list.splice(0, list.length - cap); }
function telLine(code, a, b) {
  const L = T();
  const row = [telPlay(), telReal(), code, a == null ? '' : String(a).slice(0, 48)];
  if (b != null) row.push(b);
  if (RESTING) row.push('off');
  telPush(L.tl, TEL_CAP.tl, row);
}

/* ------------------------------------------------------------------ what is running */
function telActKey() {
  if (S.action) return S.action.skill + ':' + S.action.id;
  if (S.combat.zone != null && ZONES[S.combat.zone]) return 'z:' + ZONES[S.combat.zone].id;
  return 'idle';
}

/* ------------------------------------------------------------------ engine: time, gold, food */
// step(dt) is wrapped: time per activity, gold the engine made, battle without food.
{
  const baseStep = step;
  step = function (dt) {
    let key = null, g0 = 0;
    try { key = telActKey(); g0 = S.gold; } catch (e) { /* ignore */ }
    baseStep(dt);
    if (key) telStep(dt, key, g0);
  };
}
const telStep = tsafe((dt, key, g0) => {
  const L = T(), off = RESTING;
  if (off) L.time.off += dt;
  else if (SIM) L.time.fast += dt;               // dev fast-forward (and anything else simulated live)
  else if (typeof document !== 'undefined' && document.hidden) L.time.hid += dt;
  telBump(L.act, key, off ? 1 : 0, dt, 2);
  const dg = S.gold - g0;
  if (dg) telBump(L.gold, key.startsWith('z:') ? 'battle' : key === 'idle' ? 'passive' : 'skill:' + key.split(':')[0], dg > 0 ? 0 : 1, Math.abs(dg), 2);
  if (key.startsWith('z:')) {
    const C = S.combat;
    if (!C.food || !count(C.food)) telBump(L.zone, key.slice(2), 2, dt, 5);   // zone: [deaths, eaten, noFoodSecs, elites, alphas]
  }
});

// Offline catch-up (boot, a hidden tab coming back): what the time away gave.
{
  const baseAdvance = advance;
  let depth = 0;
  advance = function (seconds) {
    if (!RESTING || depth || !S) return baseAdvance(seconds);
    depth++;
    let before = null;
    try { before = telSum(); } catch (e) { /* ignore */ }
    try { baseAdvance(seconds); } finally { depth--; }
    if (before) telBack(seconds, before);
  };
}
function telSum() {
  let lv = 0;
  for (const k in S.skills) lv += skillLv(k);
  return { lv, kills: S.stats.kills, gold: S.gold, deaths: S.stats.deaths, key: telActKey(), items: Object.values(S.items).reduce((a, b) => a + b, 0) };
}
const telBack = tsafe((secs, b) => {
  const L = T(), a = telSum(), now = Date.now(), last = L.back[L.back.length - 1];
  const row = [now, Math.round(secs * (RESTING ? REST_PACE : 1)), b.key, a.lv - b.lv, a.kills - b.kills, Math.round(a.gold - b.gold), a.deaths - b.deaths, a.items - b.items];
  // a hidden desktop tab catches up a minute at a time: one return, not hundreds
  if (last && now - last[0] < 180 * 1000 && last[2] === row[2]) { for (let i = 1; i < row.length; i++) if (i !== 2) last[i] += row[i]; last[0] = now; return; }
  telPush(L.back, TEL_CAP.back, row);
});

/* ------------------------------------------------------------------ engine events */
{
  const baseEmit = emit;
  emit = function (ev, d) { telEv(ev, d); baseEmit(ev, d); };
}
const telEv = tsafe((ev, d) => {
  if (!S) return;
  const L = T();
  const sub = TEL_EV_ID[ev] && d && d[TEL_EV_ID[ev]] != null ? ev + ':' + d[TEL_EV_ID[ev]] : ev;
  telBump(L.ev, sub, 0, 1);
  if (TEL_TL_EVENTS[ev]) { const a = TEL_TL_EVENTS[ev](d); if (a != null) telLine(ev, a); }
  const C = S.combat, z = C.zone != null ? ZONES[C.zone] : null;
  switch (ev) {
    case 'levelup': {
      const id = d.skill, lv = d.level;
      if (id === 'character' || lv <= 10 || lv % 5 === 0) telLine('lv', id, lv);
      break;
    }
    case 'kill':
      if (z && d.boss && C.kills[z.id] === 1) telLine('boss', z.id, typeof charLv === 'function' ? charLv() : null);
      if (z && d.enemy && d.enemy.rank) telBump(L.zone, z.id, d.enemy.rank === 2 ? 4 : 3, 1, 5);
      break;
    case 'death':
      if (z) telBump(L.zone, z.id, 0, 1, 5);
      telPush(L.death, TEL_CAP.death, [Date.now(), telPlay(), z ? z.id : '', String((d && (d.base || d.name)) || ''), charLv(),
        C.food ? count(C.food) : 0, Math.round(pMaxHp()), d && d.rank ? d.rank : 0, telOff()]);
      break;
    case 'eat':
      if (z) telBump(L.zone, z.id, 1, 1, 5);
      break;
    case 'rare':
      telPush(L.find, TEL_CAP.find, [Date.now(), telPlay(), d.id, String(d.source || '').slice(0, 32), telOff()]);
      break;
    case 'dgclear': {
      const r = telBump(L.dg, d.id, 0, 1, 5);            // dg: [clears, fails, clearSecs, foodEaten, firsts]
      r[2] = telRound(r[2] + (+d.t || 0)); r[3] += +d.ate || 0; if (d.first) { r[4]++; telLine('dgclear', d.id, Math.round(+d.t || 0)); }
      break;
    }
    case 'dgend': telBump(L.dg, d.id, 1, 1, 5); break;
  }
});

/* ------------------------------------------------------------------ snapshots, unlocks, versions */
function telSnap() {
  const L = T();
  let lv = 0;
  for (const k in S.skills) lv += skillLv(k);
  const techs = S.tech && Array.isArray(S.tech.loadout) ? S.tech.loadout.filter(Boolean).length : 0;
  const food = S.combat.food ? count(S.combat.food) : 0;
  const row = [Date.now(), telPlay(), Math.round(L.time.live), charLv(), lv, Math.round(S.gold), Math.round(S.bounty || 0), S.stats.kills, S.stats.deaths,
    Math.round(pMaxHit()), pMaxHp(), Math.round(pDef()), Math.round(statSpd()), Math.round(statLuck()),
    Object.keys(S.found).length, WORLD_ORDER.filter(realmOpen).length, Object.keys(S.gates).length, Object.keys(S.unlocked).length,
    Object.keys(S.pets).length, techs, food];
  telPush(L.snap, TEL_CAP.snap, row);
  L.lastSnap = L.time.live;
}
// New unlocks and gates since the last look (they open in many places: a light diff each second).
function telDiff() {
  const L = T();
  L.seen = L.seen || { un: {}, gate: {} };
  // telemetry added to a save already under way: what it holds is marked "start", not timed
  const first = !L.seenU && !L.seenG;
  const scan = (code, src, arg) => {
    let n = 0;
    for (const k in src) { n++; if (!L.seen[code][k]) { L.seen[code][k] = 1; telLine(code, k, first && telPlay() > 60 ? 'start' : arg()); } }
    return n;
  };
  if (Object.keys(S.unlocked).length !== L.seenU) L.seenU = scan('un', S.unlocked, () => null);
  if (Object.keys(S.gates).length !== L.seenG) L.seenG = scan('gate', S.gates, () => charLv());
  if (!L.seenU) L.seenU = -1;   // nothing unlocked yet is still "seen"
  const ver = typeof BETA !== 'undefined' ? BETA.version : '';
  if (ver && ver !== 'unknown' && (!L.ver.length || L.ver[L.ver.length - 1][0] !== ver)) L.ver.push([ver, Date.now(), telPlay()]);
  if (S.devUsed && !L.dev) L.dev = S.devUsed;
}

/* ------------------------------------------------------------------ sessions */
const telSessionStart = tsafe((away) => {
  const L = T();
  if (L.cur) telPush(L.ses, TEL_CAP.ses, [L.cur.t, Math.round(L.cur.live), L.cur.away, L.cur.clk, L.cur.err, L.cur.views]);
  L.cur = { t: Date.now(), live: 0, away: Math.round(away || 0), clk: 0, err: 0, views: 0 };
  if (away > 0) {
    L.time.away += Math.round(away);
    if (typeof offlineSeconds === 'function') L.time.capped += Math.max(0, Math.round(away - offlineSeconds(away)));
  }
  telDiff();
  telSnap();
});

// Boot: how long the player was away, read from the save before it loads.
{
  const baseBoot = boot;
  boot = function () {
    let away = 0;
    try { const raw = localStorage.getItem(SAVE_KEY), last = raw ? +JSON.parse(raw).last : 0; if (last > 0) away = Math.max(0, (Date.now() - last) / 1000); } catch (e) { /* ignore */ }
    baseBoot();
    telSessionStart(away);
  };
}

// The live clock: page time, view time, snapshots. Runs on its own (a hidden tab counts in step()).
let telLastTick = Date.now(), telHiddenAt = 0;
setInterval(tsafe(() => {
  const now = Date.now(), dt = Math.min(5, (now - telLastTick) / 1000);
  telLastTick = now;
  if (!S || document.hidden) return;
  const L = T();
  L.time.live += dt;
  if (L.cur) L.cur.live += dt;
  telBump(L.view, String(S.ui.view || '?').slice(0, 40), 0, dt, 2);
  telDiff();
  if (L.time.live - L.lastSnap >= TEL_SNAP_EVERY) telSnap();
  if (window.BETA_ERRORS && L.cur && BETA_ERRORS.length > L.cur.err) L.cur.err = BETA_ERRORS.length;
}), 1000);

document.addEventListener('visibilitychange', tsafe(() => {
  if (!S) return;
  if (document.hidden) { telHiddenAt = Date.now(); return; }
  telLastTick = Date.now();
  const away = telHiddenAt ? (Date.now() - telHiddenAt) / 1000 : 0;
  telHiddenAt = 0;
  if (away >= TEL_NEW_SESSION) telSessionStart(away);
}));

/* ------------------------------------------------------------------ the player's hand: pages, controls, gold spent */
{
  const baseView = setView;
  setView = function (v) {
    baseView(v);
    telOpen(S.ui.view);
  };
}
const telOpen = tsafe((v) => {
  const L = T(), k = String(v || '?').slice(0, 40);
  if (!L.view[k] || !L.view[k][1]) telLine('view', k);
  telBump(L.view, k, 1, 1, 2);
  if (L.cur) L.cur.views++;
});

// A control = the closest element carrying data-* attributes. Only its attribute name is kept, plus its value
// when that is a short id (data-buy="lucky_coin"): never what is typed in a field.
let telClick = null;
document.addEventListener('click', tsafe((ev) => {
  telClick = null;
  if (!S || !ev.target || !ev.target.closest) return;
  let el = ev.target.closest('[data-act],[data-view],button,a,summary,[role="button"],label,select,input');
  for (let i = 0; el && i < 4 && !Object.keys(el.dataset || {}).length; i++) el = el.parentElement;
  if (!el || !el.dataset) return;
  const ks = Object.keys(el.dataset).filter((k) => !/^(tip|tt|title|i|n|q|p)$/.test(k));
  if (!ks.length) return;
  const k = ks[0], val = el.dataset[k];
  const isField = el.matches('input[type="text"],input[type="search"],input[type="number"],textarea');
  const key = !isField && val && val.length <= 28 && /^[\w:.\-]+$/.test(val) ? k + '=' + val : k;
  telClick = { key, gold: S.gold };
}), true);
// Bubble phase on window: every handler of the click has run.
window.addEventListener('click', tsafe(() => {
  if (!telClick || !S) return;
  const L = T(), c = telClick;
  telClick = null;
  telBump(L.click, c.key, 0, 1);
  if (L.cur) L.cur.clk++;
  const dg = S.gold - c.gold;
  if (dg) telBump(L.gold, 'click:' + c.key.split('=')[0], dg > 0 ? 0 : 1, Math.abs(dg), 2);
}));

/* ------------------------------------------------------------------ export */
// What the player hands over. Their name, friends and typed text are left out.
function telExport() {
  telDiff();
  const L = T();
  if (L.cur) L.cur.live = Math.round(L.cur.live);
  const st = {
    levels: Object.fromEntries(Object.keys(S.skills).map((k) => [k, skillLv(k)])),
    gold: Math.round(S.gold), bounty: Math.round(S.bounty || 0), stats: S.stats,
    gates: S.gates, unlocked: Object.keys(S.unlocked), kills: S.combat.kills, mastery: S.mastery,
    equip: S.equip, fruit: S.fruit, fruitRank: S.fruitRank, tech: S.tech && { loadout: S.tech.loadout, lv: S.tech.lv },
    items: S.items, found: Object.keys(S.found).length, pets: Object.keys(S.pets), known: Object.keys(S.known),
    energy: S.energy && { capLv: S.energy.capLv, powLv: S.energy.powLv, lvl: S.energy.lvl }, shop: S.shop,
    goal: S.goal, hardcore: !!(S.hard && S.hard.on), settings: S.ui.set || {}, dungeons: S.dg || {},
    queue: S.missions ? (S.missions.list || []).length : 0, friends: Array.isArray(S.friends) ? S.friends.length : 0,
  };
  return {
    kind: 'anime-idle-rpg-telemetry', schema: TEL_V, at: Date.now(),
    build: typeof BETA !== 'undefined' ? BETA.version : '', worldsInBuild: typeof BETA !== 'undefined' ? BETA.worlds : null,
    device: {
      touch: matchMedia('(hover: none)').matches, installed: typeof isStandalone === 'function' && isStandalone(),
      w: Math.round(innerWidth / 50) * 50, h: Math.round(innerHeight / 50) * 50,
    },
    snapKeys: TEL_SNAP_KEYS, devUsed: S.devUsed || 0, state: st, tel: L,
  };
}
// A one-paragraph summary for bug reports.
function telSummary() {
  const L = T(), t = L.time, h = (s) => (s / 3600).toFixed(1) + ' h';
  return `Play: ${h(t.live)} live, ${h(t.hid)} hidden tab, ${h(t.off)} simulated offline (${h(t.away)} away, ${h(t.capped)} past the cap) · ${L.ses.length + (L.cur ? 1 : 0)} sessions · ${(S.stats.deaths || 0)} deaths`;
}
