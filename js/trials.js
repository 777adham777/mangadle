'use strict';
/* ==========================================================================
   ANIME IDLE RPG — world trials (DOM-free, 2026-11-25)
   The path (GOALS) says what to do next; trials are the medium-term goals beside it.
   Each world has six, open as soon as the world is: go deeper in one of its skills,
   master one of its systems, beat its guardian without eating, clear its dungeon
   against the clock, complete the dungeon's set, hunt its Alphas...
   - No trial can be missed for good: everything stays doable later (a guardian can be
     fought again without food, a dungeon run again faster).
   - A trial pays gold and items when you claim it (Quests page).
   - All six of a world claimed: its seal, +5% speed and XP for that world's skills, for good.
   S.trials = { got: { id: 1 }, seal: { realm: 1 }, clean: { zone: 1 }, alpha: { realm: n } }.
   Loaded after dungeons.js and economy.js.
   ========================================================================== */

const TRIAL_GOLD = { shinobi: 1500, seas: 5000, soul: 15000, ki: 35000, hex: 70000, hunter: 120000, echo: 200000 };
const SEAL_FX = 0.05;
function trialState() {
  if (!S.trials || typeof S.trials !== 'object') S.trials = {};
  const T = S.trials;
  for (const k of ['got', 'seal', 'clean', 'alpha']) if (!T[k] || typeof T[k] !== 'object') T[k] = {};
  return T;
}
// prog builders
const tLv = (k) => () => (S.skills[k] ? skillLv(k) : 0);
const tStat = (k) => () => S.stats[k] || 0;
const tClean = (zone) => () => (trialState().clean[zone] ? 1 : 0);
const tAlpha = (r) => () => trialState().alpha[r] || 0;
const tFast = (id, sec) => () => { const b = dgState(id).best; return b && b <= sec ? 1 : 0; };
const tSet = (id) => () => dgOwned(id);
const tPool = (r) => () => (TECH_POOLS[r] || []).filter(techLv).length;
// id, realm, text, n, prog, items, how (one line: where and how)
const trialDef = (id, realm, text, n, prog, items, how, go) => ({ id, realm, text, n, prog, items: items || {}, how: how || '', go: go || 'battle' });
const guardTrial = (r, zone, name, items) => trialDef(`${r}_clean`, r, `Defeat ${name} without eating`, 1, tClean(zone), items,
  'Unequip your food first.', 'battle');
const fastTrial = (r, d, sec, items) => trialDef(`${r}_fast`, r, `Clear ${DG_BY[d].name} in under ${dgClock(sec)}`, 1, tFast(d, sec), items,
  '', 'battle#gs-dungeons');
const setTrial = (r, d, items) => trialDef(`${r}_set`, r, `Forge 4 pieces of the ${DG_BY[d].set.name} set`, 4, tSet(d), items,
  `Its sigils come from ${DG_BY[d].name}.`, 'battle#gs-dungeons');
const TRIALS = [
  // Leaf Village
  trialDef('shinobi_wc', 'shinobi', 'Reach Woodcutting level 30', 30, tLv('woodcutting'), { sealed_scroll: 2 }, '', 'realm:shinobi:woodcutting'),
  trialDef('shinobi_alpha', 'shinobi', 'Defeat 3 Alphas in the Leaf Village', 3, tAlpha('shinobi'), { scroll_shinobi: 3 }, 'Every 50th foe of a stage is its Alpha.'),
  trialDef('shinobi_tech', 'shinobi', 'Learn all seven Leaf techniques', 7, tPool('shinobi'), { key_archive: 2 }, 'Leaf Scrolls drop from Leaf foes.', 'techniques'),
  guardTrial('shinobi', 'fox', 'the Ashen Fox Beast', { jade: 2 }),
  fastTrial('shinobi', 'archive', 180, { key_archive: 3 }),
  setTrial('shinobi', 'archive', { chest_archive: 2 }),
  // Orange Town
  trialDef('seas_cook', 'seas', 'Reach Cooking level 40', 40, tLv('cooking'), { gold_saffron: 4 }, '', 'realm:seas:cooking'),
  trialDef('seas_shiny', 'seas', 'Hand 5 catches in to the Shiny Log', 5, () => (typeof qCount === 'function' ? qCount('fishing') : 0), { sunken_chest: 2 }, 'Hand them in from Fishing.', 'realm:seas:fishing'),
  trialDef('seas_voy', 'seas', 'Return from 30 voyages', 30, tStat('voyages'), { treasure_map: 1 }, '', 'realm:seas:voyaging'),
  guardTrial('seas', 'admiral', 'the Admiral of the Tide', { tide_pearl: 4 }),
  fastTrial('seas', 'wreck', 240, { key_wreck: 3 }),
  setTrial('seas', 'wreck', { chest_wreck: 2 }),
  // Soul City
  trialDef('soul_smith', 'soul', 'Reach Smelting level 45', 45, tLv('smithing'), { silver_ingot: 10 }, '', 'realm:soul:smithing'),
  trialDef('soul_ref', 'soul', 'Refine a weapon to +5', 5, () => Math.max(0, ...S.arms.map((a) => a.ref || 0)), { ruby: 1 }, 'Bank → your weapon → Forge.', 'hero'),
  trialDef('soul_alpha', 'soul', 'Defeat 3 Alphas in Soul City', 3, tAlpha('soul'), { spirit_core: 10 }, 'Every 50th foe of a stage is its Alpha.'),
  guardTrial('soul', 'sovereign', 'the Masked Sovereign', { sovereign_shard: 2 }),
  fastTrial('soul', 'catacombs', 300, { key_catacombs: 3 }),
  setTrial('soul', 'catacombs', { chest_catacombs: 2 }),
  // Kaio Planet
  trialDef('ki_grav', 'ki', 'Reach Gravity Training level 30', 30, tLv('gravity'), { ki_core: 4 }, '', 'realm:ki:gravity'),
  trialDef('ki_crops', 'ki', 'Harvest 50 crops', 50, tStat('harvests'), { seed_star_fruit: 3 }, '', 'realm:ki:farming'),
  trialDef('ki_trans', 'ki', 'Transform 25 times in battle', 25, tStat('transforms'), { vital_bean: 10 }, 'Pick a form in Combat.'),
  guardTrial('ki', 'tyrant', 'the Crimson Tyrant', { tyrant_horn: 1 }),
  fastTrial('ki', 'pit', 360, { key_pit: 3 }),
  setTrial('ki', 'pit', { chest_pit: 2 }),
  // Shinjuku
  trialDef('hex_res', 'hex', 'Reach Cursed Research level 30', 30, tLv('exorcism'), { cursed_fragment: 10 }, '', 'realm:hex:exorcism'),
  trialDef('hex_dom', 'hex', 'Learn all four Domain Releases', 4, tPool('hex'), { cursed_box: 2 }, 'Cursed Scrolls drop in Shinjuku.', 'techniques'),
  trialDef('hex_vow', 'hex', 'Hold Cursed Pacts for 3 hours', 10800, () => Math.floor(S.stats.pactTime || 0), { cursed_fragment: 10 }, 'Offline counts too.', 'realm:hex:exorcism'),
  guardTrial('hex', 'matriarch', 'the Cursed Matriarch', { matriarch_eye: 1 }),
  fastTrial('hex', 'womb', 360, { key_womb: 3 }),
  setTrial('hex', 'womb', { chest_womb: 2 }),
  // Green Island
  trialDef('hunter_lv', 'hunter', 'Reach Hunting level 30', 30, tLv('tracking'), { hunters_cache: 1 }, '', 'realm:hunter:tracking'),
  trialDef('hunter_comp', 'hunter', 'Tame 3 companions', 3, () => Object.keys(S.beasts || {}).length, { beast_essence: 10 }, 'Hunt a beast down to tame it.', 'realm:hunter:tracking'),
  trialDef('hunter_con', 'hunter', 'Complete 15 contracts', 15, tStat('contracts'), { hunters_cache: 2 }, '', 'contracts'),
  guardTrial('hunter', 'chimera', 'the Chimera King', { chimera_heart: 1 }),
  fastTrial('hunter', 'nest', 420, { key_nest: 3 }),
  setTrial('hunter', 'nest', { chest_nest: 2 }),
  // Echo Quarter
  trialDef('echo_arch', 'echo', 'Reach Archaeology level 30', 30, tLv('archaeology'), { awakening_shard: 1 }, '', 'realm:echo:archaeology'),
  trialDef('echo_art', 'echo', 'Restore 5 artifacts', 5, () => Object.keys(S.museum || {}).length, { bronze_fragment: 30 }, '', 'realm:echo:restoration'),
  trialDef('echo_alpha', 'echo', 'Defeat 3 Alphas in the Echo Quarter', 3, tAlpha('echo'), { echo_dust: 6 }, 'Every 50th foe of a stage is its Alpha.'),
  guardTrial('echo', 'pillar', 'the Pillar Lord', { lord_visage: 1 }),
  fastTrial('echo', 'tomb', 420, { key_tomb: 3 }),
  setTrial('echo', 'tomb', { chest_tomb: 2 }),
];
for (const t of TRIALS) for (const k in t.items) if (!ITEMS[k]) delete t.items[k];
const TRIAL_BY = Object.fromEntries(TRIALS.map((t) => [t.id, t]));
const trialsOf = (r) => TRIALS.filter((t) => t.realm === r);
const trialsOn = () => isUnlocked('feature:trials');
const trialGold = (t) => TRIAL_GOLD[t.realm] || 1000;
const trialOpen = (t) => realmOpen(t.realm);
const trialProg = (t) => Math.min(t.n, t.prog());
const trialGot = (t) => !!trialState().got[t.id];
const trialDone = (t) => !trialGot(t) && trialOpen(t) && trialProg(t) >= t.n;
const trialsReady = () => TRIALS.filter(trialDone).length;
const sealOf = (r) => !!trialState().seal[r];
function claimTrial(id) {
  const t = TRIAL_BY[id];
  if (!t || !trialDone(t)) return null;
  const st = trialState();
  st.got[id] = 1;
  const gold = Math.round(trialGold(t) * goldMult());
  S.gold += gold;
  for (const k in t.items) addItem(k, t.items[k]);
  S.stats.trials = (S.stats.trials || 0) + 1;
  emit('trial', { t, gold });
  if (!st.seal[t.realm] && trialsOf(t.realm).every((x) => st.got[x.id])) { st.seal[t.realm] = 1; emit('seal', t.realm); }
  dirty = true;
  return { gold };
}
// World seals: that world's skills work 5% faster and earn 5% more XP.
hook('speed', (skill) => (SKILLS[skill] && sealOf(SKILLS[skill].realm) ? 1 + SEAL_FX : 1));
hook('xp', (skill) => (SKILLS[skill] && sealOf(SKILLS[skill].realm) ? 1 + SEAL_FX : 1));

/* ---------------------------------------------------------------- tracking */
// A fight's own record: did you eat? (a guardian beaten on an empty stomach counts for its trial)
hook('spawn', () => { S.combat.ate = 0; });
hook('eat', () => { S.combat.ate = (S.combat.ate || 0) + 1; });
hook('kill', (e, z) => {
  const st = trialState();
  if (z.boss && !S.combat.ate && !st.clean[z.id]) st.clean[z.id] = 1;
  if (e.rank === 2 && z.realm) st.alpha[z.realm] = (st.alpha[z.realm] || 0) + 1;
});
// A trial that just became claimable says so once.
let trialSeen = null;
hook('tick', () => {
  if (!trialsOn() || SIM) return;
  const ready = TRIALS.filter(trialDone).map((t) => t.id);
  if (trialSeen) for (const id of ready) if (!trialSeen.has(id)) emit('trialready', TRIAL_BY[id]);
  trialSeen = new Set(ready);
});
