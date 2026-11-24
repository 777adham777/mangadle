'use strict';
/* ==========================================================================
   TRI-REALM IDLE — Echo Quarter overhaul (world 7), DOM-free
   Archaeology: the excavation grid
   - Every dig site is an 8×8 grid; each dig opens one square. A fresh grid hides
     1 Intact find (the Shiny version of the site's fragment, for the Shiny Log),
     1 Stand Arrow Shard, 4 relics of the site's world and 8 caches (×3 fragments);
     the other 50 squares give the usual dig. Clearing all 64 pays 3 Echo Dust and
     lays out a new grid. Each site keeps its own grid.
   Restoration: Flawless
   - A restored artifact can come out Flawless (25%, more with mastery and levels):
     its museum bonus counts ×1.5. An artifact already in the museum can be restored
     again to try for Flawless. Restored ancient gear can come out Perfect (Perfect Log).
   Echo Bonding: resonance
   - Communing fills the resonance (+2%, Deep Communion +4%). At 100% the Echo
     resonates: for 60 seconds its task runs three times as fast. Every bond level
     is announced; every 10th raises all its grades.
   Loaded after hunt.js.
   ========================================================================== */

/* ------------------------------------------------------------ Archaeology: the grid */
QUALITY.archaeology = { kind: 'shiny', base: 0, claim: true };   // only Intact finds are shiny
Q_TIERS.archaeology = [
  [0.25, { speed: 0.05 },  '+5% Archaeology speed'],
  [0.5,  { double: 0.05 }, '+5% chance of a double find'],
  [0.75, { rare: 0.25 },   'Rare finds ×1.25 while digging'],
  [1,    { xp: 0.1 },      '+10% Archaeology XP'],
];
const DIG_N = 64, DIG_LAYOUT = ['intact', 'shard', 'relic', 'relic', 'relic', 'relic', 'cache', 'cache', 'cache', 'cache', 'cache', 'cache', 'cache', 'cache'];
// The relic a site hides: the first relic of the world it digs into (from the site's own extras).
const SITE_RELIC = {};
for (const a of SKILLS.archaeology.actions) { const r = (a.extra || []).map(([k]) => k).find((k) => ITEMS[k] && ITEMS[k].relic); SITE_RELIC[a.id] = r || 'echo_dust'; }
const DIGS = () => { if (!S.digs) S.digs = {}; return S.digs; };
function newGrid() {
  const g = DIG_LAYOUT.concat(Array(DIG_N - DIG_LAYOUT.length).fill('')).sort(() => Math.random() - 0.5);
  return { cells: g, open: Array(DIG_N).fill(0), n: 0 };
}
const gridOf = (id) => { const D = DIGS(); if (!D[id]) D[id] = newGrid(); return D[id]; };
hook('action', (skill, act, mult, gains) => {
  if (skill !== 'archaeology' || !act.out) return;
  const G = gridOf(act.id), out = Object.keys(act.out)[0];
  const shut = G.open.map((o, i) => (o ? -1 : i)).filter((i) => i >= 0);
  const i = shut[Math.floor(Math.random() * shut.length)], what = G.cells[i];
  G.open[i] = 1; G.n++;
  const give = (k, n) => { addItem(k, n); gains[k] = (gains[k] || 0) + n; };
  if (what === 'cache') { const n = (gains[out] || 1) * 2; give(out, n); S.stats.made[out] = (S.stats.made[out] || 0) + n; }
  else if (what === 'relic') give(SITE_RELIC[act.id], 1);
  else if (what === 'shard') give('awakening_shard', 1);
  else if (what === 'intact') {
    const vid = variantId(out, 's');
    ensureVariant(vid);
    give(vid, 1);
    S.stats.intacts = (S.stats.intacts || 0) + 1;
    logQuality('archaeology', out, 's', 1, vid);
  }
  emit('dug', { act, cell: i, what });
  if (G.n >= DIG_N) {
    give('echo_dust', 3);
    DIGS()[act.id] = newGrid();
    S.stats.sitesCleared = (S.stats.sitesCleared || 0) + 1;
    emit('siteclear', { act });
  }
});

/* ------------------------------------------------------------ Restoration: Flawless */
QUALITY.restoration = { kind: 'perfect', base: 0.05, claim: true, only: (id) => ITEMS[id] && ITEMS[id].type === 'equip' };
Q_TIERS.restoration = [
  [0.25, { speed: 0.05 },   '+5% Restoration speed'],
  [0.5,  { xp: 0.05 },      '+5% Restoration XP'],
  [0.75, { perfect: 0.25 }, 'Perfect chance ×1.25 on every skill'],
  [1,    { xp: 0.1 },       '+10% Restoration XP'],
];
const FLAWLESS = 0.25, FLAWLESS_FX = 1.5;
const flawlessChance = (act) => Math.min(0.75, FLAWLESS + skPerk('restoration', 'flawless') + 0.003 * masteryLv('restoration', act.id) + 0.004 * Math.max(0, skillLv('restoration') - act.level));
// systems.js puts a restored artifact in the museum (S.museum[id] = 1); Flawless makes it 2.
hook('action', (skill, act) => {
  const o = act.out && Object.keys(act.out)[0];
  if (skill !== 'restoration' || !o || !ARTIFACTS[o]) return;
  if (S.museum[o] >= 2) return;
  if (Math.random() < flawlessChance(act)) { S.museum[o] = 2; S.stats.flawless = (S.stats.flawless || 0) + 1; emit('flawless', { id: o }); dirty = true; }
});

/* ------------------------------------------------------------ Echo Bonding: resonance */
const RES_STEP = 2, RES_DEEP = 4, RUSH_SECS = 60, RUSH_MULT = 3;
hook('action', (skill, act) => {
  if (skill !== 'bonding' || !echoOn() || act.id === 'awaken') return;
  const E = S.echo, before = E.lastLv == null ? bondLv() : E.lastLv;
  E.res = (E.res || 0) + (act.id === 'deep_commune' ? RES_DEEP : RES_STEP);
  if (E.res >= 100) { E.res -= 100; E.rush = RUSH_SECS; S.stats.resonances = (S.stats.resonances || 0) + 1; emit('resonance', {}); }
  const L = bondLv();
  if (L > before) emit('bondup', { lv: L, grade: L % 10 === 0 });
  E.lastLv = L;
});
// A resonating Echo works three times as fast: two extra shares of progress on top of its own.
hook('tick', (dt) => {
  if (!echoOn() || !(S.echo.rush > 0)) return;
  S.echo.rush = Math.max(0, S.echo.rush - dt);
  const t = S.echo.task, a = t && findAction(t.skill, t.id);
  if (a && !echoTaskBlock()) S.echo.prog += dt * echoSpeedMult(t.skill) * (RUSH_MULT - 1);
});
