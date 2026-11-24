'use strict';
/* ==========================================================================
   TRI-REALM IDLE — developer tools (for testing)
   Hidden from players. Turn on with ?dev in the URL (?dev=0 turns it off),
   or tap the TRI·REALM logo 7 times. A "Dev" entry then appears in the menu:
   unlock everything, set levels, give items, fast-forward time, god mode,
   and a backup of the save taken before the first cheat.
   Loaded after ui.js, before ui-systems.js boots the game.
   ========================================================================== */

const DEV_KEY = 'trirealm_dev';
const DEV_BACKUP = SAVE_KEY + '_devbackup';
const DEV = { on: false, god: false, onehit: false };   // god mode / one-hit kills / speed last for this session only

function devStore(k, v) {
  try { if (v === undefined) return localStorage.getItem(k); if (v === null) localStorage.removeItem(k); else localStorage.setItem(k, v); } catch (e) { /* storage unavailable */ }
  return null;
}
(function devFromUrl() {
  const q = new URLSearchParams(location.search);
  if (q.has('dev')) {
    devStore(DEV_KEY, q.get('dev') === '0' ? null : '1');
    q.delete('dev');
    try { history.replaceState(null, '', location.pathname + (q.toString() ? '?' + q : '') + location.hash); } catch (e) { /* ignore */ }
  }
  DEV.on = devStore(DEV_KEY) === '1';
})();
const devOn = () => DEV.on;

function setDevMode(on) {
  DEV.on = on;
  devStore(DEV_KEY, on ? '1' : null);
  if (!on) {
    DEV.god = DEV.onehit = false;
    GAME_SPEED = 1;
    if (S.ui.view === 'dev') setView('home');
    toast('Dev mode off.', 'good');
  } else {
    setTimeout(() => setView('dev'), 0);   // after the logo's own click (it opens the Overview)
    toast('Dev mode on.', 'rare');
  }
  dirty = true;
}

// 7 taps on the logo within 4 seconds toggles dev mode (works on phones and the installed app).
let devTaps = [];
document.addEventListener('click', (ev) => {
  if (!ev.target.closest('.brand')) return;
  const now = Date.now();
  devTaps = devTaps.filter((t) => now - t < 4000).concat(now);
  if (devTaps.length >= 7) { devTaps = []; setDevMode(!DEV.on); }
}, true);

/* ------------------------------------------------------------ cheats in combat */
hook('taken', () => (DEV.god ? 0 : 1));        // every hit deals 1
// Each foe falls on its first moment of combat, with its normal gold, XP and drops.
hook('combat', (dt, e) => { if (DEV.onehit && e && S.combat.enemy != null) dealDamage(e, Math.ceil(S.combat.eHp) + 1, true); });

/* ------------------------------------------------------------ save backup */
function devBackupInfo() {
  try { const b = JSON.parse(devStore(DEV_BACKUP) || 'null'); return b && b.save ? b : null; } catch (e) { return null; }
}
function devBackup() { devStore(DEV_BACKUP, JSON.stringify({ t: Date.now(), save: serialize() })); }
// The first cheat keeps a copy of the clean save, so testing never costs real progress.
function ensureBackup() { if (!devBackupInfo()) devBackup(); }
function devRestore() {
  const b = devBackupInfo();
  if (!b) return toast('No backup saved.', 'bad');
  cancelSkip();
  try { loadFrom(b.save); } catch (e) { return toast('The backup is not readable.', 'bad'); }
  saveGame();
  setView('home');
  toast('Backup restored.', 'good');
}

/* ------------------------------------------------------------ cheats */
const setSkillLv = (k, L) => { S.skills[k].xp = XP_TABLE[Math.max(1, Math.min(maxLv(k), Math.floor(L) || 1))]; };

function unlockContent() {
  for (const r of GATE_ORDER) S.gates[r] = 1;
  for (const u of UNLOCKS) S.unlocked[u.id] = 1;
  // every stage reachable: the kills that open the next one (the last stage stays untouched)
  ZONES.forEach((z, i) => { if (i < ZONES.length - 1) S.combat.kills[z.id] = Math.max(S.combat.kills[z.id] || 0, z.boss ? 1 : 10); });
  for (const id in ITEMS) if (ITEMS[id].type === 'schematic') learnSchematic(id, true);
}
function maxSystems() {
  for (const p of PETS) S.pets[p.id] = 1;
  for (const r of WORLD_ORDER) S.renown[r] = Math.max(renownPts(r), RENOWN_K * 100 * 100);
  for (const id in TECHNIQUES) S.tech.lv[id] = TECH_MAX;
  for (const id in TECHNIQUES) if (!isEquipped(id)) { const sl = slotFor(id); if (sl) S.tech.slots[sl.id] = id; }
  for (const id in ITEMS) { const it = ITEMS[id]; if (it.type === 'tool') S.tools[it.toolFor] = Math.max(toolTier(it.toolFor), it.tier); }
  for (const k in CARDS) S.cards[k] = 1;
  for (const id in ARTIFACTS) S.museum[id] = 1;
  for (const id in BEASTS) S.beasts[id] = { xp: Math.max((S.beasts[id] || {}).xp || 0, 40 * 19 * 19) };
  if (!companion()) S.companions = Object.keys(BEASTS).slice(0, compSlots());
  S.contracts.stars = Math.max(S.contracts.stars || 0, RANKS[RANKS.length - 1][0]);
  const grades = Object.fromEntries(ESTATS.map(([k]) => [k, 4]));
  if (!echoOn()) S.echo = { id: ECHOES[0].id, grades, bond: 30 * 40 * 40, task: null, prog: 0 };
  else Object.assign(S.echo, { grades, bond: Math.max(S.echo.bond || 0, 30 * 40 * 40) });
  for (let i = 1; i <= 7; i++) if (!count('wish_stone_' + i)) addItem('wish_stone_' + i, 1);
}
function giveAll(type, n) {
  let k = 0;
  for (const id in ITEMS) {
    const it = ITEMS[id];
    if (it.type === 'schematic') continue;   // learned, not carried
    if (type === 'relic' ? !it.relic : type !== 'all' && it.type !== type) continue;
    addItem(id, n); k++;
  }
  return k;
}
function devItemId(txt) {
  txt = txt.trim().toLowerCase();
  if (!txt) return null;
  if (ITEMS[txt]) return txt;
  return Object.keys(ITEMS).find((id) => ITEMS[id].name.toLowerCase() === txt)
    || Object.keys(ITEMS).find((id) => ITEMS[id].name.toLowerCase().includes(txt)) || null;
}

// Runs a cheat quietly: no level-up / new-item popups, and any unlock it causes opens without fanfare.
function cheat(fn, msg) {
  ensureBackup();
  SIM = true;
  try { fn(); } finally { SIM = false; }
  checkUnlocks();
  if (S.combat.hp > pMaxHp()) S.combat.hp = pMaxHp();
  dirty = true;
  if (msg) toast(msg, 'good');
}

const DEV_ACTS = {
  unlock: () => cheat(unlockContent, 'Every world, skill, menu, stage and schematic is unlocked.'),
  everything: () => cheat(() => {
    unlockContent();
    for (const k in SKILLS) setSkillLv(k, maxLv(k));
    maxSystems();
    S.gold += 1e9;
    S.bounty = Math.max(S.bounty, BOUNTY_RANKS[BOUNTY_RANKS.length - 1][0]);
  }, 'Everything unlocked and maxed.'),
  systems: () => cheat(maxSystems, 'Pets, techniques, tools, cards, museum, beasts, Echo and Renown maxed.'),
  pets: () => cheat(() => { for (const p of PETS) S.pets[p.id] = 1; }, 'Every pet found.'),
  renown: () => cheat(() => { for (const r of WORLD_ORDER) S.renown[r] = RENOWN_K * 100 * 100; }, 'Renown 100 in every world.'),
  goldK: () => cheat(() => { S.gold += 1e3; }),
  goldM: () => cheat(() => { S.gold += 1e6; }),
  goldB: () => cheat(() => { S.gold += 1e9; }),
  bounty: () => cheat(() => { S.bounty += 1e6; }),
  train: () => cheat(() => { for (const t of TRAININGS) S.energy.lvl[t.id] = tl(t.id) + 100; }, '+100 levels in every training.'),
  heal: () => { S.combat.hp = pMaxHp(); },
  kill: () => { const e = curEnemy(); if (e) dealDamage(e, S.combat.eHp + 1, true, 'Dev'); else toast('No foe right now.', 'bad'); },
  goalNext: () => { if (S.goal < GOALS.length) S.goal++; dirty = true; },
  goalPrev: () => { if (S.goal > 0) S.goal--; dirty = true; },
  goalAll: () => { S.goal = GOALS.length; dirty = true; },
  goalReset: () => { S.goal = 0; dirty = true; },
  tips: () => { S.ui.noTips = 1; S.ui.welcomed = 1; clearCoach(); dirty = true; toast('Tutorial off.', 'good'); },
  backup: () => { devBackup(); dirty = true; toast('Save backed up.', 'good'); },
  restore: () => { if (confirm('Replace the current game with the backup?')) devRestore(); },
  dropBackup: () => { devStore(DEV_BACKUP, null); dirty = true; toast('Backup deleted.', 'good'); },
  fresh: () => {
    if (!confirm('Start a brand-new save? Your current game goes into the backup first.')) return;
    devBackup();
    cancelSkip();
    S = defaultState(); checkUnlocks(); S.combat.hp = pMaxHp(); saveGame(); setView('home'); showWelcome();
  },
  off: () => setDevMode(false),
};
// Plays the time out like offline progress (1-second steps, no cap), in ~40 ms slices so the page stays responsive.
const SKIP = { total: 0, left: 0, run: 0 };
const cancelSkip = () => { SKIP.run++; SKIP.left = 0; };
function devSkip(secs) {
  if (SKIP.left > 0) return;
  ensureBackup();
  const before = snapshot(), run = ++SKIP.run;
  SKIP.total = SKIP.left = secs;
  dirty = true;
  const slice = () => {
    if (run !== SKIP.run) return;   // the save was swapped (restore / new save)
    const end = performance.now() + 40;
    SIM = true;
    try { while (SKIP.left > 0 && performance.now() < end) { const s = Math.min(1, SKIP.left); step(s); SKIP.left -= s; } } finally { SIM = false; }
    if (SKIP.left > 0) return void setTimeout(slice, 0);
    dirty = true;
    showOffline(secs, before);
  };
  setTimeout(slice, 0);
}
UPD.push(() => { const el = $('[data-devprog]'); if (el && SKIP.left > 0) setText(el, `Skipping ${fmtTime(SKIP.total)}: ${Math.floor((1 - SKIP.left / SKIP.total) * 100)}%`); });

/* ------------------------------------------------------------ view */
UIX.quick.push(() => (devOn() ? [['dev', 'dev', GAME_SPEED > 1 ? `Dev ×${GAME_SPEED}` : 'Dev']] : []));
const DEV_SPEEDS = [1, 10, 100, 1000];
const DEV_LVLS = [10, 30, 60, 99];
const DEV_TYPE_NAMES = { res: 'Materials', food: 'Food', equip: 'Gear', gem: 'Gems', chest: 'Treasure', fruit: 'Devil Fruits', scroll: 'Technique scrolls', tool: 'Tools', seed: 'Seeds', meal: 'Meals', bait: 'Bait', wish: 'Dragon Balls' };
let devType = 'all', devQty = '100';

VIEWS.dev = () => {
  if (!devOn()) { setTimeout(() => setView('home')); return ''; }
  const b = devBackupInfo(), st = goalState();
  const btn = (act, label, icon, cls) => gbtn(label, icon, `data-dev="${act}"`, cls || 'dark sm');
  const types = [...new Set(Object.values(ITEMS).map((it) => it.type))].filter((t) => t !== 'schematic');
  const skills = [...WORLD_ORDER.filter((r) => r !== 'rift'), 'combat'].flatMap((r) => skillsOf(r));
  return `
  ${ptitle('Testing', 'Dev tools', `<span class="pill">${ui('dev')} Dev mode</span>`)}
  <section class="win dev-top">${hdr('Unlock', `${UNLOCKS.filter((u) => S.unlocked[u.id]).length} / ${UNLOCKS.length} unlocked`)}
    <div class="btn-row">${gbtn('Unlock everything', 'lock', 'data-dev="unlock"')}${gbtn('Unlock and max everything', 'crown', 'data-dev="everything"', 'dark')}</div>
    <p class="muted small"><b>Unlock everything</b> opens every world, skill, menu, stage and schematic, and keeps your levels. <b>Max</b> also puts every skill at its max level, maxes every system below and adds 1B gold.</p>
  </section>
  <div class="dev-cols">
    <section class="win">${hdr('Time', GAME_SPEED > 1 ? `running ×${GAME_SPEED}` : 'normal speed')}
      <div class="btn-row"><nav class="seg">${DEV_SPEEDS.map((x) => `<button class="${GAME_SPEED === x ? 'on' : ''}" data-devspeed="${x}"><span>×${x}</span></button>`).join('')}</nav></div>
      <div class="btn-row">${[[3600, '+1 hour'], [8 * 3600, '+8 hours'], [24 * 3600, '+24 hours']].map(([s, l]) => gbtn(l, 'time', `data-devskip="${s}" ${SKIP.left > 0 ? 'disabled' : ''}`, 'dark sm')).join('')}</div>
      <p class="muted small" data-devprog>Speed lasts until you reload. Skipping time plays it out like offline progress, with no cap.</p>
    </section>
    <section class="win">${hdr('Combat', S.combat.zone != null ? ZONES[S.combat.zone].name : 'not fighting')}
      <div class="btn-row">
        <label class="tog"><input type="checkbox" data-devtog="god" ${DEV.god ? 'checked' : ''}><span>God mode: every hit deals 1</span></label>
        <label class="tog"><input type="checkbox" data-devtog="onehit" ${DEV.onehit ? 'checked' : ''}><span>One-hit kills</span></label></div>
      <div class="btn-row">${btn('heal', 'Full heal', 'hp')}${btn('kill', 'Kill this foe', 'skull')}</div>
    </section>
    <section class="win">${hdr('Resources')}
      <div class="btn-row">${btn('goldK', '+1K gold', 'gold')}${btn('goldM', '+1M gold', 'gold')}${btn('goldB', '+1B gold', 'gold')}</div>
      <div class="btn-row">${btn('bounty', '+1M bounty', 'bounty')}${btn('train', '+100 training levels', 'energy')}</div>
    </section>
    <section class="win">${hdr('Systems')}
      <div class="btn-row">${btn('systems', 'Max every system', 'crown')}${btn('pets', 'All pets', 'pet')}${btn('renown', 'Renown 100', 'trophy')}</div>
      <p class="muted small">Max every system: pets, Renown 100, techniques at level 10, every tool, full Greed Island Cards and museum, every beast at level 20, an Echo graded A, Gold Hunter licence, a set of Dragon Balls.</p>
    </section>
  </div>
  <section class="win">${hdr('Items', `${Object.keys(S.items).length} kinds in the bank`)}
    <div class="dev-give">
      <input class="dev-in grow" id="dev-item" list="dev-items" placeholder="Item name" autocomplete="off">
      <input class="dev-in num" id="dev-n" type="number" min="1" value="1" aria-label="Quantity">
      ${gbtn('Give', 'plus', 'data-devgive', 'dark sm')}
      <datalist id="dev-items">${Object.keys(ITEMS).filter((id) => ITEMS[id].type !== 'schematic').sort((x, y) => ITEMS[x].name.localeCompare(ITEMS[y].name)).map((id) => `<option value="${esc(ITEMS[id].name)}">`).join('')}</datalist>
    </div>
    <div class="dev-give">
      <select data-devtype><option value="all">Every item</option><option value="relic" ${devType === 'relic' ? 'selected' : ''}>World relics</option>${types.map((t) => `<option value="${t}" ${devType === t ? 'selected' : ''}>${DEV_TYPE_NAMES[t] || t}</option>`).join('')}</select>
      <select data-devqty>${['1', '10', '100', '1000'].map((n) => `<option value="${n}" ${devQty === n ? 'selected' : ''}>×${n} each</option>`).join('')}</select>
      ${gbtn('Give all', 'chest', 'data-devgiveall', 'dark sm')}
    </div>
  </section>
  <section class="win">${hdr('Skill levels', `total ${totalLevel()}`)}
    <div class="btn-row">${DEV_LVLS.map((L) => gbtn(L === 99 ? 'All to max' : `All to ${L}`, 'xp', `data-devall="${L}"`, 'dark sm')).join('')}</div>
    <div class="dev-grid">${skills.map((k) => `<label class="dev-sk ${skillOpen(k) ? '' : 'off'}" style="--rc:${rc(SKILLS[k].realm)}" title="${esc(SKILLS[k].name)}${skillOpen(k) ? '' : ' (locked)'}">${ic('skill', k)}<span>${esc(SKILLS[k].name)}</span><input type="number" min="1" max="${maxLv(k)}" value="${skillLv(k)}" data-devlv="${k}"></label>`).join('')}</div>
  </section>
  <div class="dev-cols">
    <section class="win">${hdr('Objectives', st ? `${S.goal + 1} / ${GOALS.length}` : 'all done')}
      <p class="small">${st ? esc(st.g.text) : 'Every objective is complete.'}</p>
      <div class="btn-row">${btn('goalPrev', 'Back', 'minus')}${btn('goalNext', 'Skip', 'plus')}${btn('goalAll', 'Skip all', 'check')}${btn('goalReset', 'Restart', 'rebirth')}${btn('tips', 'Tutorial off', 'info')}</div>
    </section>
    <section class="win">${hdr('Save', b ? `backup from ${new Date(b.t).toLocaleString()}` : 'no backup yet')}
      <div class="btn-row">${btn('backup', 'Back up now', 'check')}${b ? btn('restore', 'Restore backup', 'open') + btn('dropBackup', 'Delete backup', 'close') : ''}${btn('fresh', 'New save', 'rebirth', 'danger sm')}</div>
      <p class="muted small">The first cheat backs up your save automatically, so you can always go back to your real game.</p>
      <div class="btn-row">${btn('off', 'Turn dev mode off', 'close')}</div>
    </section>
  </div>`;
};

/* ------------------------------------------------------------ input */
document.addEventListener('click', (ev) => {
  const t = ev.target.closest('button');
  if (!t || t.disabled || !devOn()) return;
  const d = t.dataset;
  if (d.dev && DEV_ACTS[d.dev]) DEV_ACTS[d.dev]();
  else if (d.devspeed) { GAME_SPEED = +d.devspeed; dirty = true; }
  else if (d.devskip) devSkip(+d.devskip);
  else if (d.devall) { const L = +d.devall; cheat(() => { for (const k in SKILLS) setSkillLv(k, L === 99 ? maxLv(k) : L); }, L === 99 ? 'Every skill at max level.' : `Every skill at level ${L}.`); }
  else if ('devgive' in d) {
    const id = devItemId($('#dev-item').value), n = Math.max(1, Math.floor(+$('#dev-n').value || 1));
    if (!id) return toast('No item with that name.', 'bad');
    cheat(() => { if (ITEMS[id].type === 'schematic') learnSchematic(id, true); else addItem(id, n); }, `+${fmt(n)} ${ITEMS[id].name}`);
  }
  else if ('devgiveall' in d) { let k = 0; cheat(() => { k = giveAll(devType, +devQty); }); toast(`+${fmt(+devQty)} of ${k} items.`, 'good'); }
});
document.addEventListener('change', (ev) => {
  const el = ev.target, d = el.dataset;
  if (!devOn()) return;
  if (d.devlv) { cheat(() => setSkillLv(d.devlv, +el.value)); el.blur(); }
  else if (d.devtog) { DEV[d.devtog] = el.checked; dirty = true; }
  else if ('devtype' in d) { devType = el.value; el.blur(); }
  else if ('devqty' in d) { devQty = el.value; el.blur(); }
});
document.addEventListener('keydown', (ev) => {
  if (ev.key !== 'Enter' || !devOn()) return;
  if (ev.target.id === 'dev-item' || ev.target.id === 'dev-n') { ev.preventDefault(); const g = $('[data-devgive]'); if (g) g.click(); }
  else if (ev.target.dataset && ev.target.dataset.devlv) ev.target.blur();   // commits the level (change event)
});
