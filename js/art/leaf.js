'use strict';
/* Item art — Leaf Village (Naruto). See js/item-art.js for the helpers and style rules. */
(() => {
const { S, F, L, H, SP, AURA, T, G, GL, lt, dk, mix, circ, ell, rect, poly, star, ROT, TR } = ARTK;
const r1 = (v) => +v.toFixed(1);
// Cel shadow (flat darker tone of the part) and a re-inked outline.
const SHADE = (d, c, t) => F(d, dk(c, t == null ? 0.28 : t));
const INK = (d, w) => L(d, ART_INK, w || 2.4);
// Clockwise circle (a hole is made by adding a normal, counter-clockwise circ()).
const circW = (cx, cy, r) => `M${cx - r} ${cy}a${r} ${r} 0 1 1 ${r * 2} 0a${r} ${r} 0 1 1 ${-r * 2} 0Z`;
// Crescent shadow on the lower-right of an ellipse (inset so it never covers the outline).
const CRP = (cx, cy, rx, ry) => { rx -= 1.1; ry -= 1.1; const x1 = r1(cx + 0.766 * rx), y1 = r1(cy - 0.643 * ry), x2 = r1(cx - 0.643 * rx), y2 = r1(cy + 0.766 * ry); return `M${x1} ${y1}A${r1(rx)} ${r1(ry)} 0 0 1 ${x2} ${y2}A${r1(rx * 1.08)} ${r1(ry * 1.08)} 0 0 0 ${x1} ${y1}Z`; };
const CRES = (cx, cy, rx, ry, c, t) => SHADE(CRP(cx, cy, rx, ry), c, t);
// A shaded ball (pills, beads, moons): outline, crescent shadow, gloss.
const BALL = (cx, cy, r, c, w) => S(circ(cx, cy, r), c, { w: w || 2.4 }) + CRES(cx, cy, r, r, c) + H(ell(r1(cx - r * 0.38), r1(cy - r * 0.42), r1(r * 0.34), r1(r * 0.2)), 0.6);
// A pill: ball + n engraved bars (Akimichi pills 1-2-3).
const PILL = (cx, cy, r, c, n) => BALL(cx, cy, r, c) + (n ? L(Array.from({ length: n }, (_, i) => `M${r1(cx - r * 0.42)} ${r1(cy + (i - (n - 1) / 2) * 3.4)}H${r1(cx + r * 0.42)}`).join(''), dk(c, 0.5), 1.8) : '');
// Leaf blade with a midrib.
const LEAFB = (d, mid, c) => S(d, c, { w: 1.8 }) + L(mid, dk(c, 0.35), 1.2);
// Five round petals around a yellow heart.
const FLOWER = (x, y, r, c) => {
  const v = (i) => { const a = ((-90 + 36 + i * 72) * Math.PI) / 180; return `${r1(x + Math.cos(a) * r * 0.38)} ${r1(y + Math.sin(a) * r * 0.38)}`; };
  let d = 'M' + v(0); for (let i = 1; i <= 5; i++) d += `A${r1(r * 0.36)} ${r1(r * 0.36)} 0 1 1 ${v(i)}`;
  return S(d + 'Z', c, { w: 1.8 }) + F(circ(x, y, r1(r * 0.26)), '#ffd84a') + F(circ(r1(x + r * 0.08), r1(y + r * 0.08), r1(r * 0.12)), '#e8962a');
};
// A log lying at an angle: bark body, shadow band, cut face with rings. extra = markup inside the rotated group.
const LOG = (bark, face, ring, extra) => ROT(-28, 32, 36,
  S('M14 23H48V46H14Q8 46 8 34.5Q8 23 14 23Z', bark)
  + SHADE('M10 40H48V44.8H14.2Q10.8 44.8 10 40Z', bark)
  + L('M16 29H34M20 35H42M14 40.5H28', dk(bark, 0.45), 1.4)
  + H('M15 25.4H40V27.6H15Z', 0.5)
  + S(ell(48, 34.5, 7.5, 11.5), face, { w: 2.2 }) + CRES(48, 34.5, 7.5, 11.5, face, 0.18)
  + L(ell(48, 34.5, 4.6, 7.4), ring, 1.3) + L(ell(48, 34.5, 2, 3.4), ring, 1.3)
  + (extra || ''));
// The Hidden Leaf symbol (headband strokes), placed with a transform.
const LEAF = (tf, c, w) => TR(tf, L('M24 33Q28 26 34 28Q41 30 38 36Q35 41 30 37Q27 34 31 32', c, w) + L('M38 36L44 40', c, w));
// A ring drawn as a thick stroke.
const RING = (d, c, w) => L(d, ART_INK, w + 2.4) + L(d, c, w);
const STEEL = '#c6ced8';
Object.assign(ART, {
  /* ---------------------------------------------------------------- wood */
  // Pine log: plain bark, pale cut face with rings, a pine sprig.
  pine_log: LOG('#a8683a', '#f2c987', '#c48a4a')
    + S('M21 30L11 21L16 20.5L10 13L17 14.5L15 6L21 12L24 5L26 13L31 8L29 17L35 16L27 26Z', '#3f9a4a', { w: 1.8 })
    + L('M21 28L19 13M22 22L14 16M23 20L29 12M24 24L31 18', dk('#3f9a4a', 0.35), 1.2) + H('M16 15L19 17L18 19Z', 0.5),
  // Cedar log: red bark with a training kunai stuck in it.
  cedar_log: LOG('#b8492c', '#e89a6a', '#b05a34')
    + TR('translate(-6 -1)', ROT(-25, 32, 27,
      S('M30 13.5H34L36.6 19.5L34.4 27.5H29.6L27.4 19.5Z', STEEL, { w: 2 }) + SHADE('M32 14.6H33.4L35.3 19.5L33.6 26.4H32Z', STEEL, 0.25)
      + S(rect(30.2, 8.8, 3.6, 5.4, 0.8), '#3a3348', { w: 1.8 }) + L('M30.8 10.4L33.2 11.4M30.8 12.4L33.2 13.4', lt('#3a3348', 0.35), 1.2)
      + RING(circ(32, 6.4, 2.4), STEEL, 1.6))),
  // Bamboo: three green stalks with nodes and leaves (not a log at all).
  bamboo: ROT(15, 32, 33,
    S(rect(14, 16, 8, 39, 3), '#6fae3c') + SHADE(rect(18.6, 17.2, 2.2, 36.6, 1), '#6fae3c')
    + S(rect(26, 8, 9, 47, 3), '#86c84a') + SHADE(rect(31.4, 9.2, 2.4, 44.6, 1), '#86c84a')
    + S(rect(39, 18, 8, 37, 3), '#5e9e34') + SHADE(rect(43.6, 19.2, 2.2, 34.6, 1), '#5e9e34')
    + L('M14 28H22M14 42H22M26 20H35M26 34H35M26 47H35M39 30H47M39 44H47', dk('#6fae3c', 0.5), 2)
    + L('M15.5 30H20.5M15.5 44H20.5M27.5 22H33.5M27.5 36H33.5M27.5 49H33.5M40.5 32H45.5M40.5 46H45.5', lt('#86c84a', 0.4), 1.2)
    + H('M28 10H30V53H28Z', 0.45) + H('M15.8 18H17.4V53H15.8Z', 0.45))
    + LEAFB('M37 15Q48 6 58 9Q49 17 37 15Z', 'M38 15Q48 10 56 9.5', '#4fae3a') + LEAFB('M17 33Q8 30 5 22Q14 22 17 33Z', 'M16 32Q11 27 6.5 23', '#4fae3a'),
  // Mistwood: blue-grey damp log wrapped in Hidden Mist fog, a drop of water.
  mistwood: LOG('#6f7f92', '#d4dde6', '#8a9aab')
    + S('M6 50Q4 44 10 43Q12 37.5 18 39Q22 35 28 39Q34 38 35 43.5Q40 44.5 39 49.5Q38 53 33 53H10Q6 53 6 50Z', '#dbe6f1', { w: 1.8 })
    + SHADE('M8 49.6H37.6Q37 51.8 33 51.8H10Q8.2 51.8 8 49.6Z', '#dbe6f1', 0.15) + H('M11 44Q13 40 18 41Q14 42 13 45Z', 0.6)
    + L('M40 41Q46 38 52 41', '#dbe6f1', 2, 0.85)
    + S('M52 4Q58 12 58 15.5A6 6 0 0 1 46 15.5Q46 12 52 4Z', '#4aa3e0', { w: 2 }) + CRES(52, 15.5, 6, 6, '#4aa3e0') + H(ell(49.6, 13, 1.4, 2.6), 0.6),
  // Ironwood: near-black bark held by two riveted iron bands.
  ironwood: LOG('#4e403c', '#b89a7a', '#7a5a44',
    S('M18 22H25V47H18Z', STEEL, { w: 2 }) + S('M34 22H41V47H34Z', STEEL, { w: 2 })
    + SHADE('M22.6 23H24V46H22.6ZM38.6 23H40V46H38.6Z', STEEL, 0.3)
    + F(circ(21.5, 28, 1.4), dk(STEEL, 0.55)) + F(circ(21.5, 41, 1.4), dk(STEEL, 0.55)) + F(circ(37.5, 28, 1.4), dk(STEEL, 0.55)) + F(circ(37.5, 41, 1.4), dk(STEEL, 0.55))
    + H('M19.2 23.5H20.6V45.5H19.2ZM35.2 23.5H36.6V45.5H35.2Z', 0.55)),
  // Blossomwood: dark cherry branch-log in bloom.
  blossomwood: LOG('#7a4436', '#f2c9b0', '#c07a6a')
    + L('M21 28Q20 18 13 11M19.6 19Q24 14 30 12', ART_INK, 5) + L('M21 28Q20 18 13 11M19.6 19Q24 14 30 12', '#7a4436', 2.8)
    + FLOWER(13, 11, 7.5, '#ff9ec4') + FLOWER(30, 12, 6.5, '#ffc2dc') + FLOWER(12, 46, 6.5, '#ff9ec4') + SP(54, 9, 3),
  // Spirit oak: thick oak log humming with green chakra, an acorn on top.
  spirit_oak: AURA(32, 34, 30, '#5effa0')
    + LOG('#6b5634', '#e8d6a0', '#a8884a', L('M17 30Q23 34 29 30Q35 26 41 32', '#7dffb0', 2) + L('M15 38Q21 41 27 38', '#7dffb0', 1.6))
    + S(ell(18, 22.5, 6, 7.5), '#c0843a', { w: 2 }) + CRES(18, 22.5, 6, 7.5, '#c0843a') + H(ell(15.6, 22.5, 1.5, 3), 0.6)
    + S('M10.5 18.5Q18 7.5 25.5 18.5Q18 21 10.5 18.5Z', '#6a4a2a', { w: 2 }) + L('M14 15.5Q18 13 22 15.5', dk('#6a4a2a', 0.35), 1.2)
    + S(rect(17, 7.5, 2.4, 5, 1), '#6a4a2a', { w: 1.8 }) + SP(54, 8, 3.5, '#c8ffd8'),
  // Senju heartwood: golden-cored log that keeps sprouting (Wood Release).
  heartwood: AURA(32, 34, 30, '#ffd36a')
    + LOG('#8a5a2e', '#ffcf6a', '#d08a2a')
    + L('M22 27Q20 16 28 9M21.2 19Q15 15 10.5 17', ART_INK, 5.2) + L('M22 27Q20 16 28 9M21.2 19Q15 15 10.5 17', '#8a5a2e', 2.8)
    + LEAFB('M28 9Q37 3 43 7.5Q36 13 28 9Z', 'M29 9Q36 7 41 7.5', '#5fcf4a') + LEAFB('M10.5 17Q4 11 8.5 5Q13 11 10.5 17Z', 'M10 15.5Q8.6 10 8.6 6.5', '#5fcf4a')
    + LEAFB('M24.5 14Q32 12 35 18Q27 20.5 24.5 14Z', 'M25.5 14.5Q30 16 33.5 17.5', '#4fb83a') + SP(54, 9, 3.5),

  /* ---------------------------------------------------------------- herbs */
  // Healing leaf: bright green leaf with a white medical-ninja cross glow.
  healing_leaf: AURA(32, 32, 26, '#7dff9a')
    + S('M8 56Q6 24 38 9Q57 3 57 9Q53 42 22 53Q14 56 8 56Z', '#3fbf5a')
    + SHADE('M54.4 11Q50 41 22 51Q15 53.6 10 54Q26 46 36 38Q50 26 54.4 11Z', '#3fbf5a')
    + L('M9 55Q28 36 51 12', dk('#3fbf5a', 0.45), 2) + L('M22 42L19 29M29 35L28 23M36 28L39 18M22 42L33 45M29 35L41 36M36 28L48 29', dk('#3fbf5a', 0.4), 1.4)
    + H('M15 42Q17 24 37 13Q28 22 21 36Z', 0.5)
    + S('M43 41h4.5v4.5h4.5v4.5h-4.5v4.5h-4.5v-4.5h-4.5v-4.5h4.5Z', '#f4fff6', { w: 1.8, flat: true }),
  // Tsukuyomi petal: a pale flower before the red moon.
  moonpetal: S(circ(42, 20, 15), '#d8303a') + CRES(42, 20, 15, 15, '#d8303a') + F(circ(46, 13, 3), dk('#d8303a', 0.3)) + F(circ(50, 22, 2.2), dk('#d8303a', 0.3)) + H(ell(36, 12, 4, 2.2), 0.45)
    + [0, 72, 144, 216, 288].map((a) => ROT(a, 26, 40, S('M26 40Q19 30 26 21Q33 30 26 40Z', '#efe6ff', { w: 1.8 }) + F('M26 38Q24 31 26 25Q28 31 26 38Z', '#b8a6e8', 0.6))).join('')
    + S(circ(26, 40, 4.2), '#c8384a', { w: 1.8 }) + H(ell(24.6, 38.6, 1.2, 0.8), 0.6) + SP(10, 14, 3, '#ffd6dc'),
  // Cloud fern: a curled frond under a storm cloud with a spark.
  cloud_fern: L('M16 58Q22 40 34 32Q48 24 48 14Q48 6 41 7Q35 9 38 15Q41 17 43 14', ART_INK, 5) + L('M16 58Q22 40 34 32Q48 24 48 14Q48 6 41 7Q35 9 38 15Q41 17 43 14', '#4fa83a', 2.8)
    + LEAFB('M20 46Q10 46 8 40Q16 38 22 42Z', 'M20 44.6Q14 42.4 9.5 40.6', '#5fc04a') + LEAFB('M26 38Q18 32 20 26Q28 30 28 36Z', 'M26.6 36Q23 31 20.8 27', '#5fc04a')
    + LEAFB('M32 34Q34 44 42 46Q42 38 34 32Z', 'M33.4 34Q37 41 41 45', '#5fc04a') + LEAFB('M40 28Q48 34 56 32Q52 24 44 25Z', 'M42 27.6Q49 29 55 31.4', '#5fc04a')
    + S('M6 20Q6 13 13 14Q16 7 23 10Q30 9 30 16Q34 20 28 22H10Q6 22 6 20Z', '#e4ecfa', { w: 2 }) + SHADE('M8 19.6H31.6Q31 20.8 28 20.8H10Q8.2 20.8 8 19.6Z', '#e4ecfa', 0.2) + H(ell(14, 15.5, 3, 1.6), 0.6)
    + S('M17 22L13 30H18L15 38L25 27H20L23 22Z', '#ffe14a', { w: 1.8 }),
  // Nara shadowroot: a dark tuber trailing Shadow Possession tendrils.
  shadowroot: F(ell(32, 54, 26, 5), '#140c1c', 0.55)
    + L('M14 49Q9 51 5 50.5M50 49Q55 51 59 50M32 54Q22 58 10 57.5M32 54Q42 58 54 57.5', '#2a1e3e', 3.4)
    + L('M25 32Q17 37 14 49M39 32Q47 38 50 49', ART_INK, 4.6) + L('M25 32Q17 37 14 49M39 32Q47 38 50 49', '#6a5490', 2.4)
    + S('M22 16Q32 10 42 16Q46 28 38 38Q35 46 32 54Q29 46 26 38Q18 28 22 16Z', '#6a5490')
    + SHADE('M41 17.6Q44 28 37 37Q34.6 43 32.6 49Q33 40 35 35Q40 26 41 17.6Z', '#6a5490', 0.3)
    + L('M28 22Q30 26 29 32M33 36Q33 40 32 44', dk('#6a5490', 0.45), 1.4) + H(ell(27, 20, 3, 2), 0.5)
    + LEAFB('M30 14Q22 4 14 6Q18 14 30 14Z', 'M28.6 13.2Q21 9 16 7', '#4fa83a') + LEAFB('M34 14Q42 2 50 6Q46 14 34 14Z', 'M35.4 13.2Q43 9 48 7', '#3f9a32'),
  // Myoboku lotus: orange-pink lotus on a lily pad, sage marks on the petals.
  sage_lotus: S(ell(32, 50, 26, 8), '#3f9a4a') + SHADE('M50 54.6Q42 56.8 32 56.8Q24 56.8 18 55.6Q32 56 44 52Q53 49 56.8 47Q57 51 50 54.6Z', '#3f9a4a')
    + S('M32 48Q10 46 8 30Q22 30 32 48Z', '#ff9a6a') + S('M32 48Q54 46 56 30Q42 30 32 48Z', '#ff9a6a') + SHADE('M33.6 46.6Q52 44 54.6 31.4Q50 40 33.6 46.6Z', '#ff9a6a')
    + S('M32 48Q16 36 20 18Q32 26 32 48Z', '#ffb48a') + S('M32 48Q48 36 44 18Q32 26 32 48Z', '#ffb48a') + SHADE('M33 44Q45 35 43 20.4Q40 34 33 44Z', '#ffb48a')
    + S('M32 48Q24 30 32 8Q40 30 32 48Z', '#ffc8a4') + SHADE('M32 10.6Q38.4 30 32.4 45.6Q35 30 32 10.6Z', '#ffc8a4')
    + F('M14 34L20 36L16 38ZM50 34L44 36L48 38Z', '#d84a1a') + F('M30 26H34L32 31Z', '#d84a1a') + H('M30.6 15Q28 25 30.4 36Q29.4 24 30.6 15Z', 0.55),
  // Shikkotsu orchid: violet orchid on its stem, Katsuyu the slug resting at its foot.
  spirit_orchid: L('M32 34Q30 46 34 58', ART_INK, 4.6) + L('M32 34Q30 46 34 58', '#4f9a3a', 2.4) + LEAFB('M33 50Q42 42 50 46Q44 54 33 50Z', 'M34.6 49.6Q42 47 48.4 46.4', '#4f9a3a')
    + S('M32 30Q24 10 32 4Q40 10 32 30Z', '#a86ae0') + S('M32 30Q12 24 8 30Q16 38 32 30Z', '#a86ae0') + S('M32 30Q52 24 56 30Q48 38 32 30Z', '#a86ae0')
    + SHADE('M34 28Q50 30 53.6 30.4Q47 35 34 30.4Z', '#a86ae0') + H('M30.6 26Q27 12 31.4 7Q29.6 14 31.6 24Z', 0.5)
    + S('M32 30Q18 40 20 50Q30 46 32 30Z', '#9058d0') + S('M32 30Q46 40 44 50Q34 46 32 30Z', '#9058d0') + SHADE('M33.6 34Q43 41 42.6 48Q36 44 33.6 34Z', '#9058d0')
    + S('M27 30Q32 46 37 30Q32 26 27 30Z', '#fff0f6', { w: 1.8 }) + F('M30 32Q32 38 34 32Z', '#d84a8a') + F(circ(32, 29, 2.4), '#ffe36a')
    + S('M6 58Q7 50 16 50Q22 50 25 56Q17 59 6 58Z', '#d6e8fa', { w: 1.8 }) + SHADE('M8 56.6Q16 57.6 23.2 55.6Q22 57 16 57.4Q10 57.6 8 56.6Z', '#d6e8fa', 0.25)
    + L('M9.5 54.6Q15 52.6 21 54.6', '#5a8ae0', 1.6) + L('M18 50.4L19 46.4M21.6 51L24 47.4', dk('#d6e8fa', 0.45), 1.4) + F(circ(19, 46.2, 1.1), dk('#d6e8fa', 0.45)) + F(circ(24.2, 47.2, 1.1), dk('#d6e8fa', 0.45)),
  // Ryuchi moss: mossy stone with a white snake coiled through it.
  dragon_moss: S('M6 54Q6 44 16 42Q22 34 32 37Q44 32 52 42Q60 46 58 54Z', '#4e9a3a')
    + SHADE('M56.8 52.8H34Q46 50 52 44Q58 47 56.8 52.8Z', '#4e9a3a')
    + F(circ(16, 47, 3), lt('#4e9a3a', 0.3)) + F(circ(32, 42, 3.5), lt('#4e9a3a', 0.3)) + F(circ(45, 45, 2.6), lt('#4e9a3a', 0.3)) + H('M12 45Q16 42 21 41Q16 44 14 47Z', 0.5)
    + L('M14 46Q10 30 22 28Q34 26 32 18Q30 10 40 10', ART_INK, 7) + L('M14 46Q10 30 22 28Q34 26 32 18Q30 10 40 10', '#e8ecf4', 4.4) + L('M15.6 41Q13 31 22 29.6', dk('#e8ecf4', 0.2), 1.4)
    + S(ell(43, 10, 6, 4.2), '#e8ecf4', { w: 2 }) + CRES(43, 10, 6, 4.2, '#e8ecf4', 0.18) + F(circ(45, 9, 1.3), '#d82a3a') + L('M49 11L54 12M54 12L56 10M54 12L56 14', '#d82a3a', 1.2),
  // God Tree leaf: broad golden leaf with the ripple eye of the Divine Tree.
  world_tree_leaf: AURA(32, 32, 30, '#ffe07a')
    + S('M32 4Q54 18 52 38Q48 54 32 58Q16 54 12 38Q10 18 32 4Z', '#d8c040')
    + SHADE('M50.6 30Q51 40 47 48Q42 55 33 56.6Q46 50 50.6 30Z', '#d8c040')
    + L('M32 6V56M32 20L20 14M32 20L44 14M32 44L18 40M32 44L46 40', dk('#d8c040', 0.35), 1.4)
    + S(ell(32, 31, 12, 9), '#c8384a', { w: 2 }) + CRES(32, 31, 12, 9, '#c8384a', 0.2) + L(ell(32, 31, 8, 6), '#7a1428', 1.4) + L(ell(32, 31, 4, 3), '#7a1428', 1.4) + F(circ(32, 31, 1.6), ART_INK)
    + H('M22 14Q16 24 18 34Q20 22 26 12Z', 0.5) + SP(52, 8, 3.5) + SP(10, 48, 2.6),

  /* ---------------------------------------------------------------- chakra */
  // Chakra shard: a cluster of raw blue chakra crystals.
  chakra_shard: F(ell(32, 54, 24, 4), '#140c1c', 0.45)
    + S(poly([14, 26], [22, 30], [24, 54], [12, 54], [8, 36]), '#3c8fe8') + S(poly([50, 22], [56, 34], [52, 54], [40, 54], [42, 28]), '#3c8fe8')
    + SHADE(poly([22, 31.4], [23, 52.8], [19, 52.8], [17, 31]), '#3c8fe8', 0.25) + SHADE(poly([54.8, 34.2], [51, 52.8], [47, 52.8], [52, 32]), '#3c8fe8', 0.25)
    + S(poly([32, 4], [42, 16], [40, 54], [24, 54], [22, 16]), '#5ab8ff')
    + SHADE(poly([32.6, 6], [40.8, 16.2], [38.9, 52.8], [32.6, 52.8]), '#5ab8ff', 0.22)
    + F(poly([31.4, 6], [31.4, 52.8], [25, 52.8], [23.2, 16.4]), '#ffffff', 0.3) + F(poly([14, 27.4], [15.6, 52.8], [13, 52.8], [9.4, 36.2]), '#ffffff', 0.3)
    + H('M26 18L29 12V30L27 34Z', 0.5) + SP(48, 12, 3.5) + SP(14, 16, 2.6),
  // Chakra orb: blue swirling sphere, like a Rasengan's first step.
  chakra_orb: AURA(32, 32, 30, '#5ab8ff')
    + S(circ(32, 32, 20), '#3c8fe8') + CRES(32, 32, 20, 20, '#3c8fe8')
    + L('M18 30Q25 16 39 18Q51 23 46 37', '#bfe6ff', 2.4) + L('M20 42Q32 50 44 42', '#bfe6ff', 2) + L('M25 34Q30 25 39 27', '#e8f7ff', 1.8)
    + H(ell(24, 22, 6.5, 3.6), 0.65) + SP(56, 10, 4) + SP(8, 54, 3),
  // Raiton chakra: a crackling Chidori ball, all jagged bolts.
  storm_chakra: AURA(32, 32, 30, '#7ac8ff')
    + L('M32 32L44 20L42 12L51 7M32 32L46 36L56 30M32 32L36 46L30 52L35 58M32 32L18 40L12 36L6 41M32 32L22 22L24 14L16 7', '#2a6ad8', 5)
    + L('M32 32L44 20L42 12L51 7M32 32L46 36L56 30M32 32L36 46L30 52L35 58M32 32L18 40L12 36L6 41M32 32L22 22L24 14L16 7', '#e8f7ff', 2.2)
    + S(circ(32, 32, 10), '#bfe6ff', { w: 2 }) + CRES(32, 32, 10, 10, '#7ac8ff', 0.1) + F(circ(32, 32, 4.5), '#ffffff', 0.9) + H(ell(28, 28, 2.4, 1.4), 0.65) + SP(54, 48, 3) + SP(9, 22, 2.6),
  // Senjutsu essence: an orange drop of natural energy with a toad sage eye.
  nature_essence: AURA(32, 34, 28, '#ffb040')
    + S('M32 4Q50 24 50 38A18 18 0 0 1 14 38Q14 24 32 4Z', '#ff9a3a') + CRES(32, 38, 18, 18, '#ff9a3a')
    + F('M15.4 36L21 33.6L19.4 40ZM48.6 36L43 33.6L44.6 40Z', '#c8401a')
    + S('M20 38Q32 28 44 38Q32 46 20 38Z', '#ffe36a', { w: 1.8 }) + F(rect(26.5, 36.6, 11, 2.8, 1.2), ART_INK)
    + H(ell(25, 22, 3, 6), 0.55) + SP(52, 10, 3),
  // Tailed beast ember: a red-orange flame with chakra bubbles.
  beast_ember: AURA(32, 36, 28, '#ff6a2a')
    + S('M32 58Q14 56 14 38Q16 26 26 18Q24 30 30 32Q28 18 38 6Q38 20 46 26Q54 36 48 48Q44 56 32 58Z', '#ff4a1a')
    + SHADE('M45.4 27.6Q52.4 36 47 47Q43 55.6 33 56.6Q42 52 45 45Q49 37 45.4 27.6Z', '#ff4a1a', 0.22)
    + S('M32 54Q22 52 22 42Q24 34 30 30Q30 40 36 40Q36 32 40 28Q46 38 42 46Q40 54 32 54Z', '#ffc23a', { w: 1.8 })
    + BALL(12, 22, 3.4, '#ff8a3a', 1.8) + BALL(52, 14, 2.8, '#ff8a3a', 1.8) + BALL(55, 44, 3, '#ff8a3a', 1.8)
    + H('M20 40Q20 30 26 24Q23 32 23 40Z', 0.5),
  // Kirin core: a violet storm crystal with a lightning bolt sealed inside.
  lightning_core: AURA(32, 32, 30, '#b08aff')
    + S(poly([32, 6], [52, 17], [52, 45], [32, 56], [12, 45], [12, 17]), '#5a4ad0')
    + SHADE(poly([32, 31], [50.8, 44.3], [32, 54.6]), '#5a4ad0', 0.25) + F(poly([32, 7.4], [32, 31], [13.2, 44.3], [13.2, 17.7]), '#ffffff', 0.16)
    + L('M12 17L32 31L52 17M32 31L12 45M32 31L52 45', '#8a7ae8', 1.4, 0.7)
    + S('M36 13L22 34H31L26 51L44 26H34L40 13Z', '#ffe14a', { w: 2 }) + SHADE('M33.4 26.6H41.4L30 43L32.6 33Z', '#ffe14a', 0.15)
    + H('M14.6 19L22 15V24L14.6 28Z', 0.45) + SP(55, 7, 3.5) + SP(8, 55, 3),
  // Six Paths chakra: a yin-yang bead ringed by six truth-seeking balls.
  sage_chakra: AURA(32, 32, 30, '#e8e0ff')
    + [0, 60, 120, 180, 240, 300].map((a) => ROT(a, 32, 32, S(circ(32, 9, 4.2), '#3e3656', { w: 1.8 }) + H(ell(30.6, 7.6, 1.4, 0.9), 0.6))).join('')
    + S(circ(32, 32, 15), '#ece8f6') + F('M32 17A15 15 0 0 0 32 47A7.5 7.5 0 0 0 32 32A7.5 7.5 0 0 1 32 17Z', '#2a2438')
    + F(CRP(32, 32, 15, 15), '#140c1c', 0.22)
    + F(circ(32, 24.5, 2.2), '#2a2438') + F(circ(32, 39.5, 2.2), '#ece8f6') + H(ell(21.5, 26, 2, 3.4), 0.45) + L(circ(32, 32, 15), ART_INK, 2.4),
  // Hidden Mist steel: a blue-grey ingot stamped with a water drop, mist curling off it.
  mist_steel: S(poly([18, 24], [46, 24], [52, 33], [12, 33]), '#b6c4d6') + S(poly([12, 33], [52, 33], [57, 50], [7, 50]), '#8496ae')
    + SHADE(poly([44, 34.2], [51.1, 34.2], [55.4, 48.8], [46, 48.8]), '#8496ae', 0.25)
    + F('M32 36Q37 42 37 44.5A5 5 0 0 1 27 44.5Q27 42 32 36Z', dk('#8496ae', 0.35)) + L('M29.6 45Q30 47 32 47.4', lt('#8496ae', 0.4), 1.2)
    + H('M19 25.4H37L35 27.6H17.6Z', 0.6) + H('M13.6 34.4H22L18 40H11.8Z', 0.35)
    + L('M8 18Q16 12 22 18Q28 24 34 16', '#e8f2fb', 2.4, 0.85) + L('M30 9Q38 3.6 46 9', '#e8f2fb', 2, 0.7)
    + S('M52 6Q57 13 57 16A5 5 0 0 1 47 16Q47 13 52 6Z', '#4aa3e0', { w: 1.8 }) + CRES(52, 16, 5, 5, '#4aa3e0') + H(ell(50, 14, 1.1, 2), 0.6),
  // Ninken fang: one big curved hound fang with red Inuzuka marks.
  beast_fang: S('M10 8Q32 2 50 10Q42 18 40 30Q36 46 22 60Q26 42 24 30Q22 18 10 8Z', '#f2ead8')
    + F('M10 8Q32 2 50 10Q47 14 45 17Q30 12 15 13Z', '#d8c4a0') + SHADE('M45 17Q40 30 38 38Q34 50 22.6 58.6Q34 44 36 30Q38 22 40 16Z', '#f2ead8', 0.2)
    + F('M26 22L34 24L27 28ZM27 32L34 34L28 38Z', '#d83a2a') + H('M20 16Q26 22 26 40Q22 26 18 16Z', 0.6),
  // Ashen fox tail: a big grey brush-tail with a white tip and embers.
  ashen_tail: S('M8 58Q4 46 12 37Q20 28 30 23Q36 12 46 7Q56 4 58 12Q60 22 52 30Q46 40 35 48Q22 56 8 58Z', '#8e8c9c')
    + SHADE('M55 25Q50 33 44 40Q34 50 18 55.4Q30 49 38 41Q48 32 55 25Z', '#8e8c9c', 0.3)
    + S('M30 23Q36 12 46 7Q56 4 58 12Q60 22 52 30L50 26L47 29.5L45 24.5L41 27L40 22.5L35 24.5Z', '#eeecf4', { w: 2 }) + SHADE('M57 16Q57 24 52.4 28.4L51 25.4Q55 21 57 16Z', '#eeecf4', 0.15)
    + L('M14 50Q24 42 31 32M22 53Q32 46 40 36M26 42L21 38.6M36 42L32 38.6', dk('#8e8c9c', 0.35), 1.6) + H('M11 46Q15 37 25 30Q18 37 14 46Z', 0.5) + H(ell(44, 11, 3.6, 1.8), 0.5)
    + BALL(10, 22, 2.8, '#ff8a3a', 1.8) + BALL(18, 13, 2.2, '#ffb04a', 1.8),

  /* ---------------------------------------------------------------- pills */
  // Soldier pill: three brown ration pills on a leaf wrapper.
  soldier_pill: S('M6 46Q16 36 32 38Q48 36 58 46Q46 55 32 53Q18 55 6 46Z', '#7ab65a', { w: 2 }) + SHADE('M54.4 47Q45 53.4 32 51.8Q42 49 50 45Q53 45.4 54.4 47Z', '#7ab65a') + L('M10 46Q32 43 54 46', dk('#7ab65a', 0.35), 1.2)
    + BALL(21, 35, 10, '#8a3a30') + BALL(43, 35, 10, '#8a3a30') + BALL(32, 28, 11, '#a0443a'),
  // Spinach pill: the green Akimichi pill (one bar) in an open red lacquer case.
  sage_pill: S('M8 38H56V46Q56 57 32 57Q8 57 8 46Z', '#b8342a') + SHADE('M44 40H54.8V46Q54.8 54 44 55.4Z', '#b8342a')
    + S(ell(32, 38, 24, 8), '#d8463a', { w: 2.2 }) + F(ell(32, 38, 19, 5), '#5a1410') + L('M8.6 45Q32 53 55.4 45', '#ffcf3f', 1.8)
    + PILL(32, 28, 13, '#3fa83a', 1),
  // Chili pill: the red pill (three bars), with Choji's blue chakra butterfly wings.
  storm_pill: AURA(32, 32, 30, '#6ad8ff')
    + S('M30 30Q12 4 5 15Q4 30 28 34Z', '#6ad8ff', { w: 2 }) + S('M34 30Q52 4 59 15Q60 30 36 34Z', '#6ad8ff', { w: 2 })
    + S('M28 36Q10 42 12 55Q22 57 30 40Z', '#4ab8f0', { w: 2 }) + S('M36 36Q54 42 52 55Q42 57 34 40Z', '#4ab8f0', { w: 2 })
    + SHADE('M38.6 32.6Q57 29 58 17Q59.6 29 37 33.6Z', '#6ad8ff', 0.2) + SHADE('M37 40Q51 45 51 53.4Q44 54.6 37 40Z', '#4ab8f0', 0.2)
    + F('M26 30Q14 14 8 18Q12 26 26 30ZM38 30Q50 14 56 18Q52 26 38 30Z', '#ffffff', 0.4)
    + PILL(32, 34, 11, '#e0302a', 3),
  // Blood pill: a hospital bottle of red pills with a medic's cross label.
  moon_pill: S('M25 14H39V20Q50 24 50 34V52Q50 58 44 58H20Q14 58 14 52V34Q14 24 25 20Z', '#d8eef8')
    + SHADE('M43 26Q48.8 29 48.8 34V52Q48.8 56.8 44 56.8H40Q44.6 54 44.6 48V34Q44.6 29 43 26Z', '#d8eef8', 0.2)
    + S(rect(23, 6, 18, 9, 2.5), '#a8703a', { w: 2 }) + SHADE(rect(35, 7.2, 4.8, 6.6, 1.4), '#a8703a')
    + BALL(22, 50, 5, '#c8202a', 1.8) + BALL(32, 51, 5, '#c8202a', 1.8) + BALL(42, 50, 5, '#c8202a', 1.8) + BALL(27, 43, 5, '#e0303a', 1.8) + BALL(37, 43, 5, '#e0303a', 1.8)
    + S(rect(20, 26, 24, 11, 2), '#f6f4f0', { w: 1.8, flat: true }) + F('M30 27.5h4v3h3v4h-3v3h-4v-3h-3v-4h3Z', '#d8202a')
    + H('M17.4 30Q18 25 23 22.6V24.4Q19.6 27 19.6 31V40H17.4Z', 0.55),
  // Curry pill: the yellow pill (two bars), steaming hot on a small dish.
  shadow_pill: S(ell(32, 48, 26, 9), '#e6e8f0') + CRES(32, 48, 26, 9, '#e6e8f0', 0.15) + F(ell(32, 46.6, 18, 5), '#c8cede')
    + PILL(32, 35, 13, '#f2c21a', 2)
    + L('M20 17Q16 11.6 20 6M32 15Q28 9.6 32 4.4M44 17Q40 11.6 44 6', '#ff8a3a', 2.6),

  /* ---------------------------------------------------------------- weapons */
  // Academy bokken: a pale pine practice sword with a round wooden guard.
  training_kunai: ROT(45, 32, 32,
    S('M28 8Q32 1 36 8V38H28Z', '#e0b070') + SHADE('M32.6 5Q34.8 6.4 34.8 8.6V37H32.6Z', '#e0b070', 0.22) + H('M29.4 9H31V36H29.4Z', 0.55)
    + S(ell(32, 40, 10, 3.6), '#8a5a2e', { w: 2.2 }) + S('M28.5 43H35.5V61H28.5Z', '#c89050') + L('M28.5 47L35.5 50M28.5 53L35.5 56', '#8a5a2e', 1.6)),
  // Anbu ninjato: straight steel blade, square black guard, grey wrapped grip.
  iron_wakizashi: ROT(45, 32, 32,
    S('M28 10L32 1L36 10V37H28Z', STEEL) + SHADE('M32.6 4L34.8 10V36H32.6Z', STEEL, 0.22) + H('M29.2 10.4H31V36H29.2Z', 0.55)
    + S(rect(22, 37, 20, 5.4, 1), '#2b2f45', { w: 2.2 }) + S('M28.5 42H35.5V61H28.5Z', '#5a6070') + L('M28.5 45L35.5 48M28.5 50L35.5 53M28.5 55L35.5 58', '#2b2f45', 1.6)),
  // Haku's senbon: three needles fanned before a pane of ice mirror.
  senbon: S(poly([14, 18], [34, 6], [56, 14], [56, 38], [36, 50], [14, 42]), '#bfefff', { w: 2 })
    + SHADE(poly([36, 7.8], [54.8, 14.8], [54.8, 37.3], [36.6, 48.6], [40, 26]), '#bfefff', 0.15) + F(poly([15.4, 18.8], [33.4, 7.6], [30, 30], [15.4, 41]), '#ffffff', 0.35)
    + L(poly([14, 18], [34, 6], [56, 14], [56, 38], [36, 50], [14, 42]), ART_INK, 2)
    + ROT(-12, 14, 54, S('M13 54L14.6 6L16.4 6L17 54Z', '#dfe6ee', { w: 1.8 }))
    + ROT(14, 14, 54, S('M13 54L14.6 6L16.4 6L17 54Z', '#dfe6ee', { w: 1.8 }))
    + ROT(40, 14, 54, S('M13 54L14.6 6L16.4 6L17 54Z', '#dfe6ee', { w: 1.8 }))
    + BALL(15, 54, 4, '#5a6070', 1.8) + SP(48, 8, 3.5),
  // Three-Pronged Kunai: the Yellow Flash's marked kunai, three blades and a seal tag on the grip.
  crystal_kunai: TR('translate(-0.5 0.2)', ROT(45, 32, 32,
    S('M25.5 31Q20 24 18 13Q23.5 20 29 31Z', STEEL, { w: 2 }) + S('M38.5 31Q44 24 46 13Q40.5 20 35 31Z', STEEL, { w: 2 })
    + S('M28.5 31L27 18L32 5L37 18L35.5 31Z', STEEL) + SHADE('M32.6 8L35.8 18L34.4 29.8H32.6Z', STEEL, 0.22) + H('M31.2 8.6V29.6H29.6L28.4 18Z', 0.5)
    + S('M29 34H35V51H29Z', '#2b2f45', { w: 2 }) + L('M29 48L35 51', '#4b5070', 1.4)
    + S(rect(22, 30, 20, 4, 1.2), '#ffcf3f', { w: 2 })
    + S(rect(27.6, 37, 8.8, 9, 1), '#f6ecc8', { w: 1.8 }) + L('M30 39.6Q32 38.4 34 39.6M30 42.4Q32 41.2 34 42.4M32 40V45', '#c0392b', 1.3)
    + S(circW(32, 54, 4) + circ(32, 54, 1.9), '#ffcf3f', { w: 2 }))),
  // Chakra trench knives: knuckle-ring blade with wind chakra stretching the edge.
  chakra_blade: TR('translate(-4.5 1)', ROT(45, 32, 32,
    F('M26.6 33Q26 16 32 0Q38 16 37.4 33Z', '#a8f0ff', 0.55)
    + S('M28 33Q28.5 18 32 3Q35.5 18 36 33Z', STEEL) + SHADE('M32.6 7Q34.6 18 34.9 32H32.6Z', STEEL, 0.22) + H('M30.6 30Q30.6 18 31.4 10V30Z', 0.55)
    + S('M28.5 37H35.5V56H28.5Z', '#3a3040') + L('M28.5 42H35.5M28.5 47H35.5M28.5 52H35.5', '#6a6080', 1.4)
    + RING('M35.5 39.5Q46.5 40 46.5 47.5Q46.5 55 35.5 55', STEEL, 3)
    + S(rect(23, 32, 18, 5, 1.5), '#4a4f62', { w: 2.2 }))
    + SP(55, 8, 3.5) + SP(45, 4.5, 2.4)),
  // Executioner's Cleaver: the Demon of the Mist's great blade, round hole and bite notch.
  fog_cleaver: TR('translate(-3 1)', ROT(42, 32, 32,
    S('M22 5H43V20.5A4 4 0 0 0 43 28.5V42H22Z' + circ(30, 13, 4.5), STEEL)
    + SHADE('M38.4 6.2H41.8V19.2H38.4ZM38.4 29.8H41.8V40.8H38.4Z', STEEL, 0.25) + H('M23.3 6.3H26V40.7H23.3Z', 0.5)
    + S('M28.5 43H36.5V58H28.5Z', '#4a3a5e') + L('M28.5 47L36.5 50M28.5 52L36.5 55', '#7a6896', 1.4)
    + S(rect(25, 40.5, 15, 4, 1), '#2b2f45', { w: 2 })))
    + SP(12, 12, 3),
  // White Light Tanto: a short blade glowing white, leaving a trail of light.
  ashen_fang: AURA(36, 28, 26, '#e8f4ff')
    + F('M6 46Q20 14 54 6Q30 18 11 51Z', '#ffffff', 0.35)
    + ROT(45, 32, 34, S('M28 30L32 4L36 30Z', '#eef4fc') + SHADE('M32.6 9L34.8 29H32.6Z', '#d0e4f8', 0.15) + L('M31.2 10V28.6', '#ffffff', 1.4)
    + S(circ(32, 32, 4), '#c8ced8', { w: 2 }) + S('M29 35H35V58H29Z', '#2b2f45') + L('M29 39L35 42M29 44L35 47M29 49L35 52M29 54L35 57', '#e8edf3', 1.4))
    + SP(52, 8, 4) + SP(46, 20, 2.4),

  /* ---------------------------------------------------------------- armor */
  // Chunin flak vest: green, high collar, scroll pockets, red swirl on the shoulder.
  flak_vest: S('M18 8L26 6Q32 14 38 6L46 8L54 18L50 30V56H14V30L10 18Z', '#6f8f4a')
    + SHADE('M43 20L48.8 29.6V54.8H42Z', '#6f8f4a')
    + S('M26 6Q32 16 38 6L40 10Q32 22 24 10Z', '#5a7a3a', { w: 2 }) + L('M32 18V56', dk('#6f8f4a', 0.45), 2)
    + S(rect(17, 30, 12, 14, 2), '#7fa058', { w: 1.8 }) + S(rect(35, 30, 12, 14, 2), '#7fa058', { w: 1.8 })
    + F('M19 32h8v4h-8ZM37 32h8v4h-8Z', '#e8dcb0') + L('M17 49H47', dk('#6f8f4a', 0.4), 1.6)
    + S(circ(47, 16, 4), '#d8302a', { w: 1.8 }) + L('M47 16Q49 14 47 13Q44 13 45 17Q47 20 50 17', '#ffe0d8', 1.2)
    + H('M16 22L20 12L24 12L20 26Z', 0.5),
  // Anbu mesh armor: grey chest plate strapped over black chain mesh.
  chakra_mesh: S('M16 8H48L56 20L50 26V58H14V26L8 20Z', '#363a50')
    + L('M16 30L48 58M14 42L34 58M24 26L50 48M36 26L50 36M48 30L16 58M50 42L30 58M40 26L14 48M28 26L14 36', '#6a7090', 1.2)
    + S('M18 12H46Q50 26 46 42Q32 48 18 42Q14 26 18 12Z', '#c8d0dc')
    + SHADE('M39 13.2H45Q48.6 26 45 41.2Q42 42.6 38 43.6Q41 28 39 13.2Z', '#c8d0dc', 0.22)
    + L('M18 26H46M20 36H44', dk('#c8d0dc', 0.3), 1.6) + F(rect(29, 13.2, 6, 30), dk('#c8d0dc', 0.12))
    + H('M20 14H28Q24 26 21 36Q18 24 20 14Z', 0.55) + H('M10.6 19.6L17 10.4H19L12.8 21.4Z', 0.35),
  // Land of Snow garb: white fur-trimmed coat with an icy blue body.
  frost_garb: S('M20 10L44 10L56 24L50 30V58H14V30L8 24Z', '#9fd8f0')
    + SHADE('M43 18L49 29.4V51H42Z', '#9fd8f0')
    + S('M18 6Q24 2 32 8Q40 2 46 6Q50 12 44 16Q38 14 32 18Q26 14 20 16Q14 12 18 6Z', '#f0f4fa', { w: 2 })
    + S('M12 52Q16 48 20 52Q24 48 28 52Q32 48 36 52Q40 48 44 52Q48 48 52 52V58H12Z', '#f0f4fa', { w: 2 })
    + L('M32 18V50', dk('#9fd8f0', 0.4), 2) + F('M30 26h4v4h-4ZM30 36h4v4h-4Z', '#3a6a8a')
    + H('M18 20L22 16L24 18L18 32Z', 0.55) + H(ell(24, 7, 3, 1.4), 0.5) + SP(53, 40, 3) + SP(10, 40, 2.4),
  // Toad Sage robe: red haori with yellow rings over a green kimono.
  sage_robe: S('M20 8H44L60 24L52 34L46 28V58H18V28L12 34L4 24Z', '#c83a2a')
    + SHADE('M40 40H44.8V56.8H40ZM54 24L58.4 24.2L52 32.4L49 29.6Z', '#c83a2a')
    + S('M24 8H40L32 34Z', '#4a9a4a', { w: 2 }) + S(rect(18, 34, 28, 6), '#3a2a2a', { w: 1.8 })
    + L(circ(12, 22, 3.2), '#ffcf3f', 1.8) + L(circ(52, 22, 3.2), '#ffcf3f', 1.8) + L(circ(25, 48, 3.2), '#ffcf3f', 1.8) + L(circ(39, 48, 3.2), '#ffcf3f', 1.8)
    + L('M32 40V58', dk('#c83a2a', 0.4), 1.6) + H('M10 22L20 12H24L14 28Z', 0.45),
  // Nine-Tails chakra cloak: a bubbling orange hood with fox ears and a tail.
  beast_cloak: AURA(32, 34, 30, '#ff8a2a')
    + TR('translate(0 2)',
      S('M46 44Q58 40 58 26Q62 40 52 52Z', '#ff7a1a', { w: 2 })
      + S('M16 14L14 3L24 10Q32 6 40 10L50 3L48 14Q54 22 52 34Q54 46 50 57Q44 53 40 57Q36 53 32 57Q28 53 24 57Q20 53 14 57Q10 46 12 34Q10 22 16 14Z', '#ff7a1a')
      + SHADE('M46 16Q51.6 23 50.6 34Q52.6 45 49.4 55.2Q46.4 53 44 54Q47 45 46 34Q47 24 46 16Z', '#ff7a1a', 0.25)
      + S(ell(32, 24, 10, 9), '#3a1408', { w: 2 }) + F('M26 22L30 24L26 25ZM38 22L34 24L38 25Z', '#ffe36a')
      + L('M28 40Q32 36 36 40Q36 46 30 46Q26 44 30 41', '#3a1408', 2)
      + BALL(10, 20, 2.6, '#ffa04a', 1.8) + BALL(54, 12, 2.2, '#ffa04a', 1.8) + H('M18 18Q16 30 18 44Q14 30 18 18Z', 0.5)),
  // Hokage mantle: a white cape from the back, red flames, the "fire" stroke mark.
  storm_mantle: S('M22 6H42Q48 8 50 14L56 58H8L14 14Q16 8 22 6Z', '#f2efea')
    + SHADE('M46 11.6Q48.6 13 49 15L53.4 44H48Z', '#f2efea', 0.18)
    + S('M8 58L10 44Q14 50 16 44Q20 50 22 42Q26 50 30 42Q34 50 38 42Q40 50 44 44Q48 50 52 44L56 58Z', '#d8302a', { w: 2 })
    + F('M14 56.8L16 50Q20 54 22 48Q26 54 30 48Q34 54 38 48Q42 54 46 50L50 56.8Z', '#ff8a3a')
    + S(rect(20, 4, 24, 6, 3), '#e0dcd6', { w: 2 }) + SHADE(rect(36, 5.2, 6.8, 3.6, 1.6), '#e0dcd6', 0.2)
    + L('M25 20.5L27.4 26M39 20.5L36.6 26', '#c0392b', 2.6) + L('M32 15V25Q31 33 23 38.5M32 26.5Q34 34 41 38.5', '#c0392b', 3)
    + H('M18 14Q16 26 14 40L18 40Q20 26 22 12Z', 0.5),
  // Hiruko plating: the hunchback puppet's segmented shell and its scorpion tail.
  puppet_plating: TR('translate(0 3)',
    L('M48 44Q60 34 54 18Q50 8 40 8', ART_INK, 7) + L('M48 44Q60 34 54 18Q50 8 40 8', '#6a5a7a', 4.4)
    + S('M40 8L30 2L32 12Z', '#a06ad8', { w: 1.8 })
    + S('M6 52Q6 22 30 18Q50 18 52 40Q54 52 48 56H10Q6 56 6 52Z', '#5a4a6a')
    + SHADE('M48 30Q51.6 38 50.8 46Q50.6 54 47.4 54.8H38Q46 50 48 30Z', '#5a4a6a', 0.3)
    + L('M10 40Q30 30 50 40M8 48Q30 40 52 50M24 20Q20 36 22 54M38 20Q42 36 40 56', dk('#5a4a6a', 0.45), 1.8)
    + H('M12 36Q16 24 28 21Q18 28 14 40Z', 0.5) + F(circ(30, 28, 1.6), '#c8b8d8') + F(circ(18, 44, 1.6), '#c8b8d8') + F(circ(44, 46, 1.6), '#c8b8d8')),
  // Leaf Headband: blue cloth, steel plate with the leaf symbol.
  shinobi_headband: S('M5 32Q9 23 18 25H46Q55 23 59 32Q53 30 46 36H18Q11 30 5 32Z', '#2f4fb8')
    + S('M5 34L4 49L10 45L11.5 36Z', '#2f4fb8', { w: 1.8 }) + SHADE('M8.6 37L9.2 44.2L6 46.4Z', '#2f4fb8', 0.3)
    + S('M14 18H50Q54 18 54 22V36Q54 40 50 40H14Q10 40 10 36V22Q10 18 14 18Z', STEEL)
    + SHADE('M11.2 34.6H52.8V36Q52.8 38.8 50 38.8H14Q11.2 38.8 11.2 36Z', STEEL, 0.25)
    + H('M14 19.4H50V22.6H14Z', 0.5)
    + LEAF('translate(0 -4)', dk(STEEL, 0.55), 2.4)
    + F(circ(14, 29, 1.4), dk(STEEL, 0.4)) + F(circ(50, 29, 1.4), dk(STEEL, 0.4)),

  /* ---------------------------------------------------------------- accessories */
  // Jade amulet: a green magatama on a cord with a gold bead.
  jade_amulet: L('M16 4Q22 20 34 29M50 4Q46 18 40 29', '#7a4a2a', 2.4)
    + S('M37 31A11 11 0 1 1 33.2 52.3Q24 57 15 53Q23 49 26 42A11 11 0 0 1 37 31Z' + circ(37, 41, 3), '#3fd17a')
    + CRES(37, 42, 11, 11, '#3fd17a') + H('M28.6 37Q31 32.6 36.6 33Q32 35 30.6 40Z', 0.6)
    + BALL(37, 29.5, 3.4, '#ffcf3f', 1.8) + SP(54, 32, 3),
  // Fang Over Fang charm: two crossed fangs on a red cord with red marks.
  wolf_fang: L('M8 6Q32 30 56 6', '#c8302a', 2.6)
    + ROT(22, 38, 34, S('M33 20H43Q44 40 38 56Q32 40 33 20Z', '#e6dcc6') + SHADE('M40.4 21.2H41.8Q42.4 40 38.4 52Q40 40 40.4 21.2Z', '#e6dcc6', 0.2) + F('M40 30L36 33L40 36Z', '#d83a2a'))
    + ROT(-22, 26, 34, S('M21 20H31Q32 40 26 56Q20 40 21 20Z', '#f4ecd8') + SHADE('M28.4 21.2H29.8Q30.4 40 26.4 52Q28 40 28.4 21.2Z', '#f4ecd8', 0.2) + F('M24 30L28 33L24 36Z', '#d83a2a') + H('M23 22Q24 34 25 44Q22 34 23 22Z', 0.6))
    + S(rect(24, 16, 16, 7, 3), '#8a5a2e', { w: 2 }) + SHADE(rect(34, 17.2, 4.8, 4.6, 1.6), '#8a5a2e'),
  // Stone golem heart: a carved stone heart cracked with molten light.
  golem_heart: AURA(32, 34, 30, '#ff8a3a')
    + S('M32 56Q8 40 8 24Q8 10 20 10Q28 10 32 18Q36 10 44 10Q56 10 56 24Q56 40 32 56Z', '#8a8278')
    + F('M40 44Q50 36 52 26Q54 38 42 48Z', dk('#8a8278', 0.3))
    + L('M32 18L28 28L34 34L30 44M28 28L18 26M34 34L44 30L48 22', '#3a2010', 3.6) + L('M32 18L28 28L34 34L30 44M28 28L18 26M34 34L44 30L48 22', '#ffb040', 1.8)
    + H('M14 20Q16 14 22 14Q16 18 16 26Z', 0.55),
  // Kyuubi tail charm: a bright orange tail tied with red thread and a tassel.
  fox_tail_charm: AURA(36, 28, 24, '#ffb04a')
    + S('M20 46Q18 30 30 20Q40 12 44 6Q56 8 56 20Q54 34 40 42Q30 48 20 46Z', '#ff8a1a')
    + SHADE('M54.6 22Q52 34 40 40.6Q32 45 24 45.2Q36 40 44 32Q52 26 54.6 22Z', '#ff8a1a', 0.25)
    + S('M44 6Q56 8 56 20Q50 18 46 14Q42 10 44 6Z', '#fff0dc', { w: 2 }) + L('M26 40Q34 32 42 22', dk('#ff8a1a', 0.35), 1.6)
    + L('M18 48L14 58M20 48L20 58M22 48L24 58', '#d8202a', 2) + S(rect(14, 42, 10, 6, 2), '#d8202a', { w: 2 }) + H(rect(15.4, 43.2, 4, 1.6, 0.8), 0.5)
    + H('M24 36Q26 26 34 20Q28 28 26 36Z', 0.55),
  // Uzumaki seal tag: a paper talisman with the red spiral and brushed script.
  sealing_talisman: ROT(-12, 32, 32,
    S(rect(20, 6, 24, 52, 1.5), '#f6ecc8') + SHADE('M38 7.2H42.8V56.8H38Z', '#f6ecc8', 0.15) + F('M21.2 7.2H42.8V11H21.2Z', '#c8b88a', 0.5)
    + L(rect(23, 9, 18, 46), '#c0392b', 1.4)
    + L('M32 24Q36 24 36 28Q36 32 31 32Q27 32 27 27Q27 21 33 21Q39 21 39 28Q39 35 32 35', '#c0392b', 2.2)
    + L('M28 40.5H36M32 38V51M28.5 45.5L32 44L35.5 45.5M29 50L32 48.6L35 50', '#2a2438', 1.8)
    + H('M21.6 12H23.4V54H21.6Z', 0.5)),

  /* ---------------------------------------------------------------- chests */
  // Gama-chan: Naruto's fat green frog wallet.
  herb_pouch: L('M14 26Q8 10 24 8', '#c8302a', 2.4)
    + S('M8 40Q8 22 32 22Q56 22 56 40Q56 56 32 56Q8 56 8 40Z', '#5ab84a') + SHADE('M48 26.6Q54.8 31 54.8 40Q54.8 52 38 54.6Q50 50 50 40Q50 31 48 26.6Z', '#5ab84a')
    + S(circ(20, 22, 7), '#5ab84a', { w: 2 }) + S(circ(44, 22, 7), '#5ab84a', { w: 2 })
    + S(circ(20, 21, 4), '#f6f6ee', { w: 1.8, flat: true }) + S(circ(44, 21, 4), '#f6f6ee', { w: 1.8, flat: true }) + F(circ(21, 21, 2), ART_INK) + F(circ(43, 21, 2), ART_INK)
    + L('M14 38Q32 46 50 38', ART_INK, 2.2) + L('M18 40L19 43M24 42L25 45M30 43L30 46M36 43L36 46M42 42L41 45M46 40L45 43', '#ffcf3f', 1.4)
    + H(ell(16, 32, 4, 2.4), 0.55),
  // Messenger hawk nest: twig nest with two eggs and a tied message scroll.
  bird_nest: S(ell(26, 30, 8, 10), '#f2eee2', { w: 2 }) + CRES(26, 30, 8, 10, '#f2eee2', 0.12) + S(ell(40, 32, 7, 9), '#d8e8f0', { w: 2 }) + CRES(40, 32, 7, 9, '#d8e8f0', 0.15) + F(circ(42, 30, 1.4), '#7a8aa0')
    + S('M4 36Q6 52 32 54Q58 52 60 36Q48 42 32 42Q16 42 4 36Z', '#9a6a3a') + SHADE('M57.6 39Q54 50.6 38 52.6Q50 47 57.6 39Z', '#9a6a3a', 0.3)
    + L('M6 40Q20 48 40 46M10 46Q30 52 54 42M8 38L20 50M52 38L40 50M28 42L34 54', dk('#9a6a3a', 0.45), 1.6)
    + ROT(-20, 50, 24, S(rect(44, 18, 14, 8, 3), '#f6ecc8', { w: 1.8 }) + F('M50 18H52V26H50Z', '#d8302a'))
    + H(ell(23, 25, 2, 3), 0.6) + H(ell(37.6, 27.6, 1.4, 2.4), 0.55),
  // Forbidden scroll: the huge Scroll of Seals, tied shut.
  sealed_scroll: ROT(-20, 32, 32,
    S(rect(14, 19, 36, 26, 3), '#f2e2b8') + SHADE('M16 39.6H48V43.8H16Z', '#f2e2b8', 0.2)
    + L('M16 23H48M16 41H48', dk('#f2e2b8', 0.25), 1.4)
    + L('M20 28H30M25 25V37M20.5 33L25 31.5L29.5 33M21 37H29', '#2a2438', 2)
    + S(rect(36, 17, 5, 30, 1), '#c8302a', { w: 1.8 })
    + S(rect(9, 15, 8, 34, 3), '#3a2a4a', { w: 2 }) + S(rect(47, 15, 8, 34, 3), '#3a2a4a', { w: 2 })
    + SHADE(rect(13.6, 16.4, 2.2, 31.2, 1), '#3a2a4a', 0.3) + SHADE(rect(51.6, 16.4, 2.2, 31.2, 1), '#3a2a4a', 0.3)
    + H('M10.6 17H12.4V47H10.6ZM48.6 17H50.4V47H48.6Z', 0.45) + H('M18 20.4H34V22H18Z', 0.5)),

  /* ---------------------------------------------------------------- trade goods */
  // Kunai supply crate: pine planks, X brace, a kunai stencil.
  pine_crate: S('M8 22L32 12L56 22V48L32 58L8 48Z', '#d8b27a') + SHADE(poly([33.2, 32.8], [54.8, 23.8], [54.8, 47.2], [33.2, 56.2]), '#d8b27a', 0.2)
    + S('M8 22L32 32L56 22L32 12Z', '#ecc88e', { w: 2 })
    + L('M32 32V58', ART_INK, 2.2)
    + L('M10 30L30 40M10 38L30 48M34 40L54 30M34 48L54 38', dk('#d8b27a', 0.4), 1.4)
    + ROT(-28, 20, 40, F('M20 30L23 38H21V48H19V38H17Z', '#3a3040') + L(circ(20, 50.4, 1.8), '#3a3040', 1.3)) + H('M14 22L32 15L36 17L18 24Z', 0.5),
  // Cedar toolbox: a red toolbox with a kunai and a scroll poking out.
  cedar_toolbox: L('M20 24V12H44V24', ART_INK, 5) + L('M20 24V12H44V24', STEEL, 2.8)
    + S(rect(24, 9, 8, 17, 2), '#f6ecc8', { w: 1.8 }) + F('M24.8 14H31.2V16.4H24.8Z', '#d8302a')
    + S(rect(37, 12, 4.4, 14, 1), '#3a3348', { w: 1.8 }) + L('M37.6 15L40.8 16.6M37.6 19L40.8 20.6', lt('#3a3348', 0.35), 1.2) + RING(circ(39.2, 8.6, 2.4), STEEL, 1.6)
    + S(rect(6, 24, 52, 30, 3), '#c8703e') + SHADE('M7.2 46H56.8V50Q56.8 52.8 54 52.8H10Q7.2 52.8 7.2 50Z', '#c8703e')
    + S(rect(6, 24, 52, 7, 2), '#a8582e', { w: 2 })
    + L('M10 40H54', dk('#c8703e', 0.4), 1.6) + S(rect(28, 34, 8, 6, 1), '#ffcf3f', { w: 1.8 }) + H('M10 32.4H30V34.4H10Z', 0.5),
  // Crow puppet: the three-eyed hooded puppet.
  bamboo_puppet: S('M10 58Q8 30 20 14Q32 4 44 14Q56 30 54 58Z', '#3a3048')
    + SHADE('M46 18Q53 30 52.8 56.8H46Q48 34 46 18Z', '#3a3048', 0.3) + H('M14 40Q14 24 22 15Q18 26 17 40Z', 0.35)
    + S('M20 26Q20 16 32 16Q44 16 44 26V40Q44 50 32 50Q20 50 20 40Z', '#d8c8a8') + SHADE('M38 17.8Q42.8 19.6 42.8 26V40Q42.8 48 35 48.6Q39 44 39 36Z', '#d8c8a8', 0.2)
    + F('M20 18Q32 8 44 18L42 22Q32 14 22 22Z', '#2a2236')
    + S(ell(26, 32, 3.4, 2.8), '#f4f0e4', { w: 1.8 }) + S(ell(38, 32, 3.4, 2.8), '#f4f0e4', { w: 1.8 }) + S(ell(32, 24.5, 2.6, 2.2), '#f4f0e4', { w: 1.8 })
    + F(circ(26, 32, 1.4), '#7a2aa8') + F(circ(38, 32, 1.4), '#7a2aa8') + F(circ(32, 24.5, 1.2), '#7a2aa8')
    + L('M24 42H40M24 42V48M40 42V48', dk('#d8c8a8', 0.55), 1.6) + L('M22 36L24 44M42 36L40 44', '#7a2aa8', 1.6),
  // Hunter-nin mask: white mask, red curls and the Hidden Mist sign.
  mist_mask: S('M32 4Q54 4 54 28Q54 52 32 60Q10 52 10 28Q10 4 32 4Z', '#f2f0ee')
    + F('M44 36Q50 44 40 56Q48 44 44 36Z', dk('#f2f0ee', 0.25)) + SHADE('M48 12Q52.8 18 52.8 28Q52.8 40 48 47Q51 36 50 26Q49.6 18 48 12Z', '#f2f0ee', 0.18)
    + S(ell(23, 30, 5, 3), ART_INK, { w: 1.8, flat: true }) + S(ell(41, 30, 5, 3), ART_INK, { w: 1.8, flat: true })
    + L('M18 38Q22 44 18 50M46 38Q42 44 46 50M14 22Q18 18 24 20M50 22Q46 18 40 20', '#d8302a', 2.2)
    + L('M24 12Q26 9 28 12M28 13Q30 10 32 13M32 13Q34 10 36 13M36 12Q38 9 40 12', '#3a4a62', 1.8)
    + H('M16 18Q20 8 30 7Q20 12 18 24Z', 0.6),
  // Ironwood beam: a squared dark beam, iron end caps, a Leaf brand on the side.
  ironwood_beam: ROT(-28, 32, 32,
    S('M7 23L12 18H58L53 23Z', '#7a6a62') + S('M7 23H53V44H7Z', '#4e403c') + S('M53 23L58 18V39L53 44Z', '#3a302c')
    + SHADE('M8.2 39.4H51.8V42.8H8.2Z', '#4e403c', 0.3)
    + L('M16 29H42M18 37H40', dk('#4e403c', 0.45), 1.4)
    + S('M7 23H14V44H7Z', STEEL, { w: 2 }) + S('M46 23H53V44H46Z', STEEL, { w: 2 })
    + SHADE('M11.8 24.2H12.8V42.8H11.8ZM50.8 24.2H51.8V42.8H50.8Z', STEEL, 0.3)
    + H('M12 19.2H46L43.6 21.6H10Z', 0.45)
    + LEAF('translate(29.5 33.5) scale(.72) translate(-34 -33.5)', '#e8c070', 3)),
  // Blossom lantern: a pink paper lantern with a cherry blossom, glowing.
  blossom_lantern: AURA(32, 34, 28, '#ffd27a')
    + L('M32 4V10', ART_INK, 2) + S(rect(22, 9, 20, 6, 2), '#2a2438', { w: 1.8 })
    + S('M22 15Q8 21 8 34Q8 47 22 53H42Q56 47 56 34Q56 21 42 15Z', '#ff9ec4')
    + SHADE('M46 17.6Q54.8 23 54.8 34Q54.8 45.6 44 51.4Q50 44 50 34Q50 24 46 17.6Z', '#ff9ec4', 0.2)
    + L('M10.4 26H53.6M8.4 34H55.6M10.4 42H53.6', dk('#ff9ec4', 0.3), 1.4)
    + S(rect(22, 53, 20, 6, 2), '#2a2438', { w: 1.8 }) + FLOWER(32, 34, 10, '#fff4f8')
    + H('M18 19Q12 26 13 38Q16 27 22 19Z', 0.55),
  // Spirit oak totem: carved pole, a Senju face over the Uchiha fan.
  oak_totem: S('M18 12H46V58H18Z', '#8a6a3a') + SHADE('M40 14H44.8V56.8H40Z', '#8a6a3a') + S('M10 8H54L50 14H14Z', '#6b5634', { w: 2 })
    + S(ell(26, 22, 3.6, 2.6), '#7dffb0', { w: 1.8, flat: true }) + S(ell(38, 22, 3.6, 2.6), '#7dffb0', { w: 1.8, flat: true })
    + L('M26 30H38', dk('#8a6a3a', 0.6), 2.4) + L('M18 34H46', dk('#8a6a3a', 0.5), 2)
    + S('M31 50H33V56H31Z', '#e8e0d0', { w: 1.8 })
    + S('M24 44A8 8 0 0 1 40 44Z', '#d8302a', { w: 1.8 }) + S('M24 44A8 8 0 0 0 40 44Z', '#f2efea', { w: 1.8 }) + H(ell(28.4, 40, 2.2, 1.2), 0.55)
    + H('M20 15H23V56H20Z', 0.4),
  // Will of Fire shrine: a little shrine sheltering a flame.
  heart_shrine: AURA(32, 38, 22, '#ffb040')
    + S(rect(14, 28, 5, 26), '#c8302a', { w: 1.8 }) + S(rect(45, 28, 5, 26), '#c8302a', { w: 1.8 }) + SHADE('M17 29H18V53H17ZM48 29H49V53H48Z', '#c8302a')
    + S('M32 50Q22 48 24 40Q26 34 30 30Q30 36 33 36Q32 30 36 26Q40 34 40 40Q40 48 32 50Z', '#ff6a1a', { w: 2 })
    + F('M32 48Q28 46 29 42Q31 38 32 36Q34 40 35 42Q36 46 32 48Z', '#ffe36a')
    + S('M4 20L32 6L60 20L54 24H10Z', '#4a3434') + SHADE('M33 7.8L57.4 20L53.4 22.8H40Z', '#4a3434', 0.3) + S(rect(10, 24, 44, 4), '#c8302a', { w: 1.8 })
    + S(rect(8, 54, 48, 5, 1.5), '#8a8278', { w: 1.8 }) + SHADE(rect(9.2, 56.6, 45.6, 1.4), '#8a8278') + H('M10 18.6L32 8L34 9.2L14 20Z', 0.45),
  // Jade: a faceted green gem.
  jade: S(poly([20, 10], [44, 10], [56, 24], [32, 56], [8, 24]), '#3fd17a')
    + F(poly([20, 10], [44, 10], [38, 24], [26, 24]), '#ffffff', 0.35) + F(poly([8, 24], [26, 24], [32, 56]), '#ffffff', 0.15)
    + F(poly([38, 24], [56, 24], [32, 56]), dk('#3fd17a', 0.35)) + L('M8 24H56M26 24L32 56L38 24M20 10L26 24M44 10L38 24', dk('#3fd17a', 0.5), 1.2)
    + H('M21.6 12H28L24 21Z', 0.55) + SP(50, 44, 2.6),
});
})();
