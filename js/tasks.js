'use strict';
/* ==========================================================================
   TRI-REALM — daily and weekly objectives (GDD §6.4), DOM-free.
   3 dailies (new ones each local day) and 3 weeklies (each Monday), drawn from every world
   you have opened, old ones as likely as the newest, so returning to them pays.
   Rewards: gold that grows with your newest world, technique scrolls (read at once),
   and on weeklies Cursed Fragments once Shinjuku is open.
   ========================================================================== */

const tasksOn = () => isUnlocked('feature:tasks');
const dayKey = () => { const d = new Date(); return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`; };
const weekKey = () => { const d = new Date(), m = new Date(d.getFullYear(), d.getMonth(), d.getDate() - ((d.getDay() + 6) % 7)); return `${m.getFullYear()}-${m.getMonth() + 1}-${m.getDate()}`; };
const nextDay = () => { const d = new Date(); return new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1).getTime(); };
const nextWeek = () => { const d = new Date(); return new Date(d.getFullYear(), d.getMonth(), d.getDate() - ((d.getDay() + 6) % 7) + 7).getTime(); };

const TASK_N = { kill: [30, 60], gather: [100, 200], craft: [30, 60], voyage: [3, 3], tech: [80, 120], boss: [3, 3] };
const taskCount = (t) => {
  if (t.kind === 'kill' || t.kind === 'boss') return S.combat.kills[t.target] || 0;
  if (t.kind === 'gather' || t.kind === 'craft') return S.stats.made[t.target] || 0;
  if (t.kind === 'voyage') return S.stats.voyages || 0;
  if (t.kind === 'tech') return S.stats.techUses || 0;
  return 0;
};
const taskProg = (t) => Math.min(t.n, taskCount(t) - t.base);

function rollTask(weekly, taken) {
  const worlds = WORLD_ORDER.filter((r) => r !== 'rift' && realmOpen(r));
  const kinds = ['kill', 'gather', 'craft', 'kill'];
  if (expOn()) kinds.push('voyage');
  if (techOn()) kinds.push('tech');
  if (weekly) kinds.push('boss');
  const mult = weekly ? 6 : 1;
  for (let tries = 0; tries < 40; tries++) {
    const kind = pick(kinds), r = pick(worlds), [lo, hi] = TASK_N[kind];
    let t = null;
    if (kind === 'kill') {
      const zs = ZONES.filter((z, i) => z.realm === r && !z.boss && zoneUnlocked(i));
      if (zs.length) { const z = pick(zs); t = { kind, realm: r, target: z.id }; }
    } else if (kind === 'boss') {
      const zs = ZONES.filter((z) => z.realm === r && z.boss && (S.combat.kills[z.id] || 0) > 0);
      if (zs.length) t = { kind, realm: r, target: zs[0].id };
    } else if (kind === 'gather' || kind === 'craft') {
      const sks = Object.keys(SKILLS).filter((k) => SKILLS[k].realm === r && skillOpen(k) && SKILLS[k].type === kind);
      if (sks.length) {
        const sk = pick(sks);
        const acts = SKILLS[sk].actions.filter((a) => a.out && a.level <= skillLv(sk) && !a.schem && !['tool', 'scroll', 'equip'].includes(ITEMS[Object.keys(a.out)[0]].type));
        if (acts.length) { const a = pick(acts); t = { kind, realm: r, target: Object.keys(a.out)[0], skill: sk }; }
      }
    } else t = { kind, realm: r };
    if (!t || taken.some((x) => x.kind === t.kind && x.target === t.target)) continue;
    t.n = (kind === 'boss' || kind === 'voyage' ? lo : randInt(lo / 10, hi / 10) * 10) * (kind === 'boss' ? 1 : mult);
    t.base = taskCount(t);
    t.weekly = !!weekly;
    return t;
  }
  return null;
}
function refreshTasks() {
  const T = S.tasks;
  if (!tasksOn()) return;
  const roll = (weekly) => { const out = []; for (let i = 0; i < 3; i++) { const t = rollTask(weekly, out); if (t) out.push(t); } return out; };
  if (T.day !== dayKey()) { T.day = dayKey(); T.daily = roll(false); dirty = true; }
  if (T.week !== weekKey()) { T.week = weekKey(); T.weekly = roll(true); dirty = true; }
}
hook('tick', refreshTasks);

const taskGold = (t) => Math.round(300 * (1 + worldIndex(frontier())) ** 2 * (t.weekly ? 6 : 1));
const taskScrolls = (t) => (t.weekly ? 3 : 1);
function claimTask(weekly, i) {
  const list = weekly ? S.tasks.weekly : S.tasks.daily, t = list[i];
  if (!t || t.claimed || taskProg(t) < t.n) return null;
  t.claimed = true;
  const gold = Math.round(taskGold(t) * goldMult());
  S.gold += gold;
  const pools = WORLD_ORDER.filter((r) => TECH_POOLS[r] && realmOpen(r)), got = [];
  if (pools.length) for (let k = 0; k < taskScrolls(t); k++) got.push(readScroll(pick(pools), weekly ? 'Weekly objective' : 'Daily objective'));
  if (weekly && realmOpen('hex')) addItem('cursed_fragment', 5);
  S.stats.tasks = (S.stats.tasks || 0) + 1;
  emit('task', { t, gold });
  dirty = true;
  return { gold, got };
}
