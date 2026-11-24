'use strict';
/* ==========================================================================
   TRI-REALM IDLE — the path's chapters (DOM-free)
   The path (GOALS in data.js) is cut into chapters: one per world, then the Rift.
   A chapter's goal is always the same shape: get strong enough for its guardian,
   beat it, clear the dungeon it opens, make the offering at the gate.
   Every step pays gold and items that help with the next one; finishing a chapter
   pays a little more. No dialogue since 2026-11-25: each step says why it matters.
   The guides (NPCS) stay as your allies (report.js): they visit while you are away.
   Loaded after every file that defines items (foes.js, builds.js, dungeons.js).
   ========================================================================== */

const NPCS = {
  ren:    { name: 'Old Ren',          title: 'Village carpenter' },
  kaede:  { name: 'Sensei Kaede',     title: 'Leaf instructor' },
  mira:   { name: 'Captain Mira',     title: 'Shipwright of Orange Town' },
  bart:   { name: 'Bartolo',          title: 'Galley cook' },
  kuro:   { name: 'Ferryman Kuro',    title: 'Guide of the dead' },
  tetsu:  { name: 'Tetsu',            title: 'Soul smith' },
  kai:    { name: 'Master Kai',       title: 'Gravity hermit' },
  yuki:   { name: 'Yuki',             title: 'Curse sorcerer' },
  nett:   { name: 'Examiner Nett',    title: 'Hunter Association' },
  selene: { name: 'Curator Selene',   title: 'Keeper of the museum' },
  carto:  { name: 'The Cartographer', title: 'Who drew your map' },
};

// The chapters: realm, title (the world), cast (its allies), reward items. `from` is computed from GOALS.
const CHAPTERS = [
  { id: 'leaf', n: 1, realm: 'shinobi', title: 'Leaf Village', guard: 'fox', cast: ['ren', 'kaede'], reward: { items: { old_compass: 1, sealed_scroll: 2 } } },
  { id: 'blue', n: 2, realm: 'seas', title: 'Orange Town', guard: 'admiral', cast: ['mira', 'bart'], reward: { items: { sea_charm: 1, treasure_map: 1 } } },
  { id: 'soul', n: 3, realm: 'soul', title: 'Soul City', guard: 'sovereign', cast: ['kuro', 'tetsu'], reward: { items: { reaper_scarf: 1, ruby: 1 } } },
  { id: 'ki', n: 4, realm: 'ki', title: 'Kaio Planet', guard: 'tyrant', cast: ['kai'], reward: { items: { weighted_gi: 1, capsule_crate: 2 } } },
  { id: 'hex', n: 5, realm: 'hex', title: 'Shinjuku', guard: 'matriarch', cast: ['yuki'], reward: { items: { paper_blade: 1, cursed_box: 2 } } },
  { id: 'hunt', n: 6, realm: 'hunter', title: 'Green Island', guard: 'chimera', cast: ['nett'], reward: { items: { chimera_fang: 1, hunters_cache: 2 } } },
  { id: 'echo', n: 7, realm: 'echo', title: 'Echo Quarter', guard: 'pillar', cast: ['selene'], reward: { items: { stone_mask: 1, echo_reliquary: 1 } } },
  { id: 'rift', n: 8, realm: 'rift', title: 'The Rift', guard: 'convergence', cast: ['carto'], reward: { items: { rift_shard: 1 } } },
];
for (const c of CHAPTERS) c.from = GOALS.findIndex((g) => g.ch === c.id);
// stage steps name their stage now that every world has added its zones
for (const g of GOALS) if (g.zone) { const z = ZONES.find((x) => x.id === g.zone); if (z) g.text = `Defeat ${g.n} foes in ${z.name.replace(/^The /, 'the ')}`; }
// drop rewards for items that do not exist (content changes) rather than break a claim
for (const g of GOALS) for (const k in g.items) if (!ITEMS[k]) delete g.items[k];
for (const c of CHAPTERS) for (const k in c.reward.items) if (!ITEMS[k]) delete c.reward.items[k];

const chapterAt = (i) => { let c = CHAPTERS[0]; for (const x of CHAPTERS) if (i >= x.from) c = x; return c; };
const chapterEnd = (c) => { const k = CHAPTERS.indexOf(c); return k + 1 < CHAPTERS.length ? CHAPTERS[k + 1].from - 1 : GOALS.length - 1; };
const chapterSteps = (c) => GOALS.slice(c.from, chapterEnd(c) + 1);
function storyState() { if (!S.story) S.story = { seen: {}, done: {} }; return S.story; }

// Claiming a step also gives its items; the last step of a chapter gives the chapter's reward.
// Everything goes to the bank (scrolls too: you read them when you choose).
function storyGive(k, n) { addItem(k, n); }
{
  const base = claimGoal;
  claimGoal = function () {
    const st = goalState();
    if (!st || !st.done) return;
    const i = S.goal, g = GOALS[i], ch = chapterAt(i);
    base();
    if (S.goal === i) return;
    for (const k in g.items) storyGive(k, g.items[k]);
    if (i === chapterEnd(ch)) {
      const R = ch.reward;
      for (const k in R.items) storyGive(k, R.items[k]);
      storyState().done[ch.id] = 1;
      emit('chapter', ch);
    }
  };
}
