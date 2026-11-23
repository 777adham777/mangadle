'use strict';
/* ==========================================================================
   TRI-REALM IDLE — the Hunt List (Hunter Association licence), DOM-free
   - Pin up to 3 items you want. For each one the list knows every source you have
     already seen (a stage you fought on, a task you did, a voyage you sailed),
     your chance there and how long one copy takes at your current pace.
     Sources you have not seen yet stay "???": the hunt is still a discovery.
   - A pinned item that lands completes the hunt (time taken is kept).
   - Collection tiers: each world's share of its items found, at 25 / 50 / 75 / 100 %,
     gives +0.5 Luck for good (max +2 per world).
   Loaded after report.js (before guide.js: the balance bot loads it too).
   ========================================================================== */

const HUNT_MAX = 3;
const huntOn = () => isUnlocked('feature:huntlist');
function hlState() {
  if (!S.hlist || typeof S.hlist !== 'object') S.hlist = {};
  if (!Array.isArray(S.hlist.list)) S.hlist.list = [];
  return S.hlist;
}
const isHunted = (id) => !!(S.hlist && S.hlist.list && S.hlist.list.some((h) => h.id === id));
function pinHunt(id) {
  const H = hlState();
  if (!ITEMS[id] || isHunted(id)) return false;
  if (H.list.length >= HUNT_MAX) { toast(`Your licence holds ${HUNT_MAX} hunts at a time.`, 'bad'); return false; }
  H.list.push({ id, t0: S.stats.playtime || 0, at: Date.now() });
  dirty = true;
  return true;
}
function unpinHunt(id) { const H = hlState(); H.list = H.list.filter((h) => h.id !== id); dirty = true; }
// The hunt ends the moment the item lands, wherever it comes from (offline too).
{
  const baseAdd = addItem;
  addItem = function (id, n) {
    baseAdd(id, n);
    if (!(n > 0) || !S.hlist || !S.hlist.list || !S.hlist.list.length) return;
    const h = S.hlist.list.find((x) => x.id === id);
    if (!h) return;
    S.hlist.list = S.hlist.list.filter((x) => x !== h);
    S.hlist.done = (S.hlist.done || 0) + 1;
    emit('hunted', { id, secs: (S.stats.playtime || 0) - h.t0, real: (Date.now() - h.at) / 1000 });
    dirty = true;
  };
}

/* ---------------------------------------------------------------- where it comes from */
const shareOf = (dropId, id) => (dropId === id ? 1 : dropId === 'FRUIT' && FRUITS.includes(id) ? 1 / FRUITS.length : 0);
// Kills per hour on a stage at your current power.
function zoneKph(zi) {
  const z = ZONES[zi], es = z.enemies.map((_, i) => enemyAt(zi, i));
  const ttk = es.reduce((a, e) => a + timeToKill(e), 0) / es.length;
  const crush = typeof reiatsuCrushes === 'function' && es.every((e) => reiatsuCrushes(e)) && !z.boss;
  return 3600 / (crush ? REIATSU_CYCLE : ttk + (z.boss ? BOSS_RESPAWN : 1.2));
}
// Every source of an item: { label, icon: [kind, ref], perHour (null = unknown rate), seen, go, danger }.
function huntSources(id) {
  const out = [], lm = luckMult();
  ZONES.forEach((z, zi) => {
    if (!realmOpen(z.realm)) return;
    let p = 0;
    z.enemies.forEach((e0, i) => {
      const e = enemyAt(zi, i);
      for (const [d, ch] of e.drops || []) { const s = shareOf(d, id); if (s) p += (ch < 0.2 ? ch * lm : ch) * s / z.enemies.length; }
    });
    if (!p) return;
    const open = zoneUnlocked(zi);
    out.push({ label: `${z.name}${z.boss ? ' · Boss' : ''}`, icon: ['zone', z.id], chance: p, per: 'kill', perHour: open ? p * zoneKph(zi) : 0, seen: (S.combat.kills[z.id] || 0) > 0, open, go: { k: 'zone', zone: z.id }, danger: open ? zoneDanger(zi)[1] : 'deadly' });
  });
  for (const k in SKILLS) {
    const s = SKILLS[k];
    if (!skillOpen(k) || s.realm === 'combat') continue;
    for (const a of s.actions) {
      const ok = skillLv(k) >= a.level && !(a.schem && !S.known[a.schem]);
      const done = (S.mastery[k + ':' + a.id] || 0) > 0;
      if (a.loot) {
        let p = 0;
        for (const [d] of a.loot.table) p += shareOf(d, id) / a.loot.table.length;
        for (const [d, ch] of a.loot.rare || []) p += shareOf(d, id) * ch * lm;
        if (!p) continue;
        const hauls = (3600 / EXP_HAUL) * skillSpeed('voyaging', a.id) * Math.max(1, shipSlots());
        out.push({ label: `Voyage · ${a.name}`, icon: ['voyage', a.id], chance: p, per: 'haul', perHour: ok ? p * hauls : 0, seen: done, open: ok, go: { k: 'view', view: `realm:${s.realm}:${k}` } });
        continue;
      }
      let per = 0;
      if (a.out && a.out[id]) per = a.out[id] * (1 + doubleChance(k, a.id));
      for (const [d, ch, q] of a.extra || []) if (d === id) per += ch * (q[0] + q[1]) / 2;
      if (!per) continue;
      out.push({ label: `${s.name} · ${a.name}`, icon: ['skill', k], chance: Math.min(1, per), per: 'action', perHour: ok ? per * 3600 / actionTime(k, a) : 0, seen: done || (a.out && a.out[id] && ok), open: ok, go: { k: 'act', skill: k, id: a.id } });
    }
    for (const [d, ch] of RARE_FINDS[k] || []) {
      const sh = shareOf(d, id);
      if (!sh) continue;
      const best = s.actions.filter((a) => skillLv(k) >= a.level && !a.loot).sort((x, y) => actionTime(k, x) - actionTime(k, y))[0];
      const used = s.actions.some((a) => (S.mastery[k + ':' + a.id] || 0) > 0);
      out.push({ label: `${s.name} · any task`, icon: ['skill', k], chance: ch * sh * rareMult(k), per: 'action', perHour: best ? ch * sh * rareMult(k) * 3600 / actionTime(k, best) : 0, seen: used, open: !!best, go: best ? { k: 'act', skill: k, id: best.id } : null });
    }
  }
  for (const k in ITEMS) {
    const it = ITEMS[k];
    if (it.type !== 'chest' || !it.loot) continue;
    const tot = it.loot.reduce((a, l) => a + l[1], 0);
    let p = 0;
    for (const [d, w] of it.loot) p += shareOf(d, id) * w / tot;
    if (p) out.push({ label: `Inside a ${it.name}`, icon: ['item', k], chance: p, per: 'chest', perHour: null, seen: !!S.found[k], open: true, go: count(k) ? { k: 'view', view: 'hero' } : null, have: count(k) });
  }
  return out.sort((a, b) => (b.seen - a.seen) || ((b.perHour || 0) - (a.perHour || 0)));
}
// Expected seconds to get one copy from the best seen source (Infinity if none is open).
function huntEta(id) {
  const best = huntSources(id).filter((s) => s.seen && s.perHour > 0).sort((a, b) => b.perHour - a.perHour)[0];
  return best ? { src: best, secs: 3600 / best.perHour } : null;
}

/* ---------------------------------------------------------------- collection tiers */
let ITEM_WORLD = null;
function itemWorld(id) {
  if (!ITEM_WORLD) {
    ITEM_WORLD = {};
    const set = (k, r) => { if (k && ITEMS[k] && !ITEM_WORLD[k] && r && r !== 'combat') ITEM_WORLD[k] = r; };
    for (const k in ITEMS) if (ITEMS[k].relic) set(k, ITEMS[k].relic);
    for (const sk in SKILLS) for (const a of SKILLS[sk].actions) { for (const o in a.out || {}) set(o, SKILLS[sk].realm); for (const [d] of a.extra || []) set(d, SKILLS[sk].realm); }
    for (const z of ZONES) for (const e of z.enemies) for (const [d] of e.drops || []) set(d, z.realm);
  }
  return ITEM_WORLD[id] || null;
}
let colTierMemo = { sig: -1, v: {} };
function colTiers() {
  const sig = Object.keys(S.found).length;
  if (colTierMemo.sig === sig) return colTierMemo.v;
  const v = {};
  for (const r of WORLD_ORDER) {
    if (r === 'rift') continue;
    const ids = Object.keys(ITEMS).filter((k) => !ITEMS[k].variant && itemWorld(k) === r);
    if (!ids.length) continue;
    const got = ids.filter((k) => S.found[k]).length, p = got / ids.length;
    v[r] = { got, all: ids.length, p, tier: Math.floor(p * 4 + 1e-9) };
  }
  colTierMemo = { sig, v };
  return v;
}
const colLuck = () => { if (!S || !S.found || !isUnlocked('feature:collection')) return 0; let n = 0; const T = colTiers(); for (const r in T) n += T[r].tier; return 0.5 * n; };
hook('luckStat', colLuck);
