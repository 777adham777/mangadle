'use strict';
/* ==========================================================================
   TRI-REALM IDLE — Shinjuku overhaul (world 5), DOM-free
   Cursed Research: every curse you study has a grade, known before you face it
   (the next one is rolled as soon as the last one falls):
     Grade 4 ×1 · Grade 3 ×1.5 · Grade 2 ×2 · Grade 1 ×3 (what it leaves, Cursed Fragments aside)
     Special Grade (0.5%, with Luck) ×6, plus 3 Cursed Fragments, and its essence comes
     out Special: one of each fills the Shiny Log.
   Loaded after kaio.js.
   ========================================================================== */

const GRADES_HEX = [
  { id: 'g4', name: 'Grade 4', w: 55,  m: 1,   col: '#9aa4b4' },
  { id: 'g3', name: 'Grade 3', w: 27,  m: 1.5, col: '#7fe0a0' },
  { id: 'g2', name: 'Grade 2', w: 12,  m: 2,   col: '#6fb8ff' },
  { id: 'g1', name: 'Grade 1', w: 5.5, m: 3,   col: '#c48cff' },
  { id: 'sp', name: 'Special Grade', w: 0.5, m: 6, col: '#ff4a5a' },
];
const GRADE_BY = Object.fromEntries(GRADES_HEX.map((g) => [g.id, g]));
QUALITY.exorcism = { kind: 'shiny', base: 0, claim: true };   // only Special Grade curses leave Special essence
Q_TIERS.exorcism = [
  [0.25, { speed: 0.05 }, '+5% Cursed Research speed'],
  [0.5,  { xp: 0.05 },    '+5% Cursed Research XP'],
  [0.75, { rare: 0.25 },  'Rare finds ×1.25 in Cursed Research'],
  [1,    { xp: 0.1 },     '+10% Cursed Research XP'],
];
const HEX = () => { if (!S.hex) S.hex = { grade: 'g4' }; return S.hex; };
// Special Grade gets likelier with Luck; the other grades keep their share.
function rollGrade() {
  const up = 1 + skPerk('exorcism', 'grade');   // Grade Reader / Six Eyes
  const t = GRADES_HEX.map((g) => [g.id, (g.id === 'sp' ? g.w * luckMult() : g.w) * (['g2', 'g1', 'sp'].includes(g.id) ? up : 1)]);
  return rollWeighted(t);
}
const curGrade = () => GRADE_BY[HEX().grade] || GRADE_BY.g4;
hook('action', (skill, act, mult, gains) => {
  if (skill !== 'exorcism' || !act.out) return;
  const G = curGrade(), out = Object.keys(act.out)[0];
  // the grade multiplies what the curse leaves (Cursed Fragments keep their own odds: they level any technique)
  if (G.m > 1) for (const k of Object.keys(gains).filter((x) => x !== 'cursed_fragment')) {
    const more = gains[k] * (G.m - 1), n = Math.floor(more) + (Math.random() < more % 1 ? 1 : 0);
    if (n > 0) { addItem(k, n); gains[k] += n; if (k === out) S.stats.made[k] = (S.stats.made[k] || 0) + n; }
  }
  if (G.id === 'sp') {
    const vid = variantId(out, 's');
    ensureVariant(vid);
    removeItem(out, 1); addItem(vid, 1);
    gains[out] -= 1; if (gains[out] <= 0) delete gains[out];
    gains[vid] = (gains[vid] || 0) + 1;
    addItem('cursed_fragment', 3); gains.cursed_fragment = (gains.cursed_fragment || 0) + 3;
    S.stats.specialGrades = (S.stats.specialGrades || 0) + 1;
    logQuality('exorcism', out, 's', 1, vid);
    emit('specialgrade', { act, item: vid });
  }
  emit('exorcised', { act, grade: G.id });
  HEX().grade = rollGrade();
  if (HEX().grade === 'sp' || HEX().grade === 'g1') emit('gradeahead', { grade: HEX().grade });
});
