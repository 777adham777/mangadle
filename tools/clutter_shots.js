// Captures the eight key screens for tools/clutter_score.py (Season 3 UX, "Méthode").
// Same save every time (levels 45, a fixed item set), animations stilled, so two runs are comparable.
//   python -m http.server 8771   (from the repo)
//   node tools/clutter_shots.js <outdir> [playwright module path]
const out = process.argv[2] || 'clutter-shots';
const { chromium } = require(process.argv[3] || process.env.PLAYWRIGHT || 'playwright');
const fs = require('fs');
fs.mkdirSync(out, { recursive: true });
(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 1440, height: 860 }, reducedMotion: 'reduce' });
  await p.goto(process.env.GAME_URL || 'http://localhost:8771/index.html');
  await p.waitForTimeout(1500);
  await p.evaluate(() => {
    for (const k in SKILLS) S.skills[k].xp = XP_TABLE[45];
    Object.keys(ITEMS).filter((id, i) => ITEMS[id].type !== 'schematic' && i % 3 === 0).forEach((id) => { S.items[id] = 20; });
    S.gold = 184200; unlockContent(); maxSystems(); checkUnlocks();
    S.ui.welcomed = 1; S.ui.noTips = 1;
    try { const st = storyState(); for (const ch of CHAPTERS) st.seen[ch.id] = 1; } catch (e) { /* no story */ }
    if (typeof SC_Q !== 'undefined') SC_Q.length = 0;
  });
  const clean = () => p.evaluate(() => { document.querySelectorAll('.show').forEach((e) => e.classList.remove('show')); document.querySelectorAll('.burst, .ob-row, .npc-say, .float, .rv-wrap, .cx-wrap, .sc-wrap').forEach((e) => e.remove()); });
  const shots = [
    ['overview', () => setView('home')],
    ['woodcutting', () => { setView('realm:shinobi:woodcutting'); startAction('woodcutting', SKILLS.woodcutting.actions[3].id); }],
    ['crafting', () => setView('realm:shinobi:arts')],
    ['fishing', () => { stopAction(); setView('realm:seas:fishing'); }],
    ['battle', () => { setView('battle'); startCombat(3); }],
    ['bank', () => { stopCombat(); setView('hero'); }],
    ['character', () => setView('character')],
    ['settings', () => setView('settings')],
  ];
  for (const [name, fn] of shots) {
    await p.evaluate(`(${fn.toString()})(); dirty = true; render();`);
    await p.waitForTimeout(1600);
    await clean();
    await p.waitForTimeout(200);
    await p.screenshot({ path: `${out}/${name}.png` });
  }
  await b.close();
  console.log('8 screens in', out);
})();
