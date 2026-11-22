'use strict';
/* Item art — Kaio Planet (Dragon Ball). See js/item-art.js for the helpers and style rules. */
(() => {
const { S, F, L, H, SP, AURA, T, G, GL, lt, dk, mix, circ, ell, rect, poly, star, ROT, TR } = ARTK;
// scale a group around the grid centre, then nudge it (placement only)
const FIT = (s, dx, dy, m) => TR(`translate(${+(32 - 32 * s + dx).toFixed(2)} ${+(32 - 32 * s + dy).toFixed(2)}) scale(${s})`, m);

// Dragon Ball: orange glass orb with N red stars in the classic layouts.
const DB_STARS = {
  1: [[32, 33, 9]],
  2: [[24.5, 33, 6.8], [39.5, 33, 6.8]],
  3: [[32, 25.5, 6.2], [24.5, 38.5, 6.2], [39.5, 38.5, 6.2]],
  4: [[32, 23.5, 5.6], [22.5, 33, 5.6], [41.5, 33, 5.6], [32, 42.5, 5.6]],
};
const ring = (n, rr, sr, centre) => {
  const p = centre ? [[32, 33, sr]] : [];
  for (let i = 0; i < n; i++) { const a = -Math.PI / 2 + (i * 2 * Math.PI) / n; p.push([+(32 + Math.cos(a) * rr).toFixed(1), +(33 + Math.sin(a) * rr).toFixed(1), sr]); }
  return p;
};
DB_STARS[5] = ring(5, 10.5, 5.4);
DB_STARS[6] = ring(5, 12, 4.8, true);
DB_STARS[7] = ring(6, 12.5, 4.6, true);
const DB = (n) => S(circ(32, 33, 25), '#ff9a1c', { w: 2.6 })
  + F('M48 18Q60 34 50 50Q40 58 26 56Q46 50 48 18Z', '#d9640e', 0.55)
  + F(circ(32, 33, 18), '#ffc04a', 0.35)
  + DB_STARS[n].map(([x, y, r]) => `<path d="${star(x, y, r, r * 0.45)}" fill="#e3201b" stroke="#7a0c0c" stroke-width="1.1" stroke-linejoin="round"/>`).join('')
  + H(ell(21, 18, 7, 3.6), 0.75) + H(circ(15, 27, 1.8), 0.6);

// Crop art (reused small on the seed packets)
const WHEAT_HEAD = (x, y, a) => ROT(a, x, y, L(`M${x} ${y - 9}V${y - 16}`, '#c58a18', 1.4) + S(ell(x, y, 4.4, 10), '#f0b52a', { w: 1.8 })
  + L(`M${x - 3} ${y - 5}Q${x} ${y - 3} ${x + 3} ${y - 5}M${x - 3.6} ${y}Q${x} ${y + 2} ${x + 3.6} ${y}M${x - 3} ${y + 5}Q${x} ${y + 7} ${x + 3} ${y + 5}`, dk('#f0b52a', 0.35), 1.3)
  + H(ell(x - 1.6, y - 4, 1.2, 3), 0.5));
const WHEAT_MINI = F(circ(44, 20, 12), '#ff8a2a') + L('M30 58Q30 44 25 30M32 58Q34 44 40 33M30 58Q25 48 18 41', '#b3862a', 3)
  + [[24, 22, -12], [41, 25, 16], [15, 34, -40]].map(([x, y, a]) => ROT(a, x, y, S(ell(x, y, 4.4, 10), '#f0b52a', { w: 2, flat: true }))).join('')
  + F('M24 50H38L36 56H26Z', '#3f7fd8');
const CROP = {
  sun_wheat: FIT(0.96, 2.5, 0, S(circ(44, 20, 12), '#ff8a2a', { w: 2 }) + F(circ(44, 20, 8), '#ffc35a', 0.8)
    + L('M30 58Q30 44 25 30M32 58Q34 44 40 33M30 58Q25 48 18 41', ART_INK, 4) + L('M30 58Q30 44 25 30M32 58Q34 44 40 33M30 58Q25 48 18 41', '#c89a3a', 2)
    + WHEAT_HEAD(24, 22, -12) + WHEAT_HEAD(41, 25, 16) + WHEAT_HEAD(15, 34, -40)
    + S('M24 50H38L36 56H26Z', '#3f7fd8', { w: 1.8 })),
  moon_rice: FIT(1, -2, 0, S('M40 6Q30 14 34 26Q40 36 54 32Q48 40 38 38Q24 34 26 20Q28 10 40 6Z', '#ffe38a', { w: 2 }) + H('M36 9Q29 15 30 24Q28 16 36 9Z', 0.55)
    + S('M10 58Q14 36 30 22Q20 40 18 58Z', '#4caa4a', { w: 1.8 }) + F('M18 58Q20 40 30 22Q24 38 21 58Z', dk('#4caa4a', 0.3))
    + L('M20 58Q20 30 36 20Q48 16 52 30', ART_INK, 4.2) + L('M20 58Q20 30 36 20Q48 16 52 30', '#8a9a4a', 2)
    + S([[38, 22], [43, 21], [47, 24], [50, 29], [52, 35], [30, 27], [27, 33]].map(([x, y]) => ell(x, y + 4, 2.4, 3.6)).join(''), '#f6f2e2', { w: 1.8 })
    + SP(14, 14, 3.5, '#fff6c8')) + SP(55, 10, 2.5, '#fff6c8'),
  fire_pepper: FIT(1, 3, 3, F('M14 52Q4 50 6 40Q10 46 14 44Q10 36 16 30Q18 40 22 40Z', '#ffb02e', 0.9)
    + S('M48 14Q56 22 50 34Q42 50 20 52Q12 52 14 46Q30 42 38 30Q42 22 40 16Z', '#e8281e')
    + F('M48 20Q52 30 44 40Q36 50 20 51Q36 44 44 32Z', dk('#e8281e', 0.35), 0.7)
    + H('M41 19Q42 28 34 36Q38 28 38 20Z', 0.55)
    + S('M38 16Q42 10 50 12Q50 18 46 18Q42 20 38 16Z', '#3f9a3a', { w: 2 }) + L('M45 12Q46 6 52 4', ART_INK, 4) + L('M45 12Q46 6 52 4', '#3f9a3a', 2)),
  frost_melon: S(circ(32, 36, 22), '#9fe8e2')
    + L('M20 18Q12 34 20 54M30 14Q24 36 30 58M40 14Q42 36 40 58M48 20Q54 36 46 54', '#2e9a96', 2.6)
    + F('M46 22Q58 36 46 54Q36 60 26 57Q46 50 46 22Z', dk('#9fe8e2', 0.3), 0.45)
    + H(ell(22, 26, 6, 3.5), 0.7)
    + L('M44 4L44 18M38 7.5L50 14.5M38 14.5L50 7.5', '#ffffff', 2.4) + L('M44 4L44 18M38 7.5L50 14.5M38 14.5L50 7.5', '#5ac8f0', 1.2)
    + SP(14, 18, 3),
  thunder_root: FIT(0.95, -2.5, 1, S('M20 18Q34 14 40 22Q44 32 36 44Q32 50 30 58Q26 48 22 40Q14 28 20 18Z', '#efe6ff')
    + F('M38 22Q44 32 36 44Q32 50 30 58Q34 40 34 26Z', '#a98ae6', 0.6)
    + L('M24 28Q28 30 32 28M24 36Q28 38 33 36', '#a98ae6', 1.4) + H('M22 22Q26 20 28 22Q24 28 24 34Q20 28 22 22Z', 0.6)
    + S('M22 18L14 4L24 12L28 2L32 12L42 6L34 18Z', '#4cbf4a', { w: 2 })
    + S('M48 18L42 32H48L44 46L56 28H50L54 18Z', '#ffe23a', { w: 1.8 })),
  star_fruit: FIT(1, -2.5, 0, S('M10 40Q8 26 24 18Q40 10 50 18Q56 26 46 38Q34 50 18 50Q10 48 10 40Z', '#ffd23a')
    + L('M12 42Q24 26 48 18M16 48Q32 38 50 30M20 30Q30 20 44 15', dk('#ffd23a', 0.3), 1.6)
    + H('M16 32Q22 22 34 18Q24 24 18 34Z', 0.6)
    + S(star(44, 44, 15, 7.5, 5), '#ffe066', { w: 2 }) + F(star(44, 44, 9, 4.5, 5), '#fff3b0') + F(circ(44, 44, 1.8), '#c99a18')) + SP(54, 10, 3.5),
};

// Seed packet: kraft packet, crop picture on its label, seeds spilling out.
const PK = (crop, col, seeds) => FIT(0.94, -2, -2.5, S('M8 12H44L42 56H10Z', '#e6cf9e')
  + F('M36 14H44L42 56H34Z', dk('#e6cf9e', 0.2), 0.6) + H('M9 14H11.4L11.6 52H10.6Z', 0.5)
  + S('M7 6H45V13H7Z', '#c9a86a', { w: 2 }) + L('M9 9.5H43', dk('#c9a86a', 0.4), 1.2)
  + S(rect(11, 17, 30, 32, 4), col, { w: 1.8, flat: true }) + TR('translate(11.5 18) scale(0.45)', crop)
  + seeds);
const seedRow = (shape) => shape(48, 52, -20) + shape(56, 46, 25) + shape(54, 57, 70);

Object.assign(ART, {
  // --- Ki: dust -> spark -> orb -> core -> flare -> nova -> star (shape and glow grow each step)
  ki_dust: AURA(32, 42, 20, '#ffe9a0')
    + S('M6 54Q12 44 22 44Q28 36 36 40Q46 38 50 46Q58 48 58 54Z', '#f2d27a', { w: 2 }) + H('M11 51Q15 46 21 46Q16 48 14 52Z', 0.5)
    + F('M36 42Q46 40 50 47Q57 49 58 54H40Q44 48 36 42Z', dk('#f2d27a', 0.25), 0.6)
    + [[18, 48], [28, 45], [34, 50], [44, 49], [24, 52]].map(([x, y]) => F(circ(x, y, 1.3), '#fffbe0')).join('')
    + S(circ(30, 26, 3), '#ffe68a', { w: 1.4 }) + S(circ(42, 18, 2.4), '#ffe68a', { w: 1.4 }) + S(circ(20, 16, 2), '#ffe68a', { w: 1.4 })
    + SP(36, 32, 3) + SP(14, 30, 2.5) + SP(48, 28, 2.2),
  ki_spark: AURA(32, 32, 28, '#ffe23a') + FIT(1.24, 0, 0, L('M10 18L16 22L12 26M52 42L46 44L52 50M50 12L44 18M14 50L20 44', '#fff3a0', 2)
    + (S(star(32, 32, 22, 7, 4, -Math.PI / 4), '#ffd21e', { w: 2.2 })
    + F(poly([32, 32], [47.6, 47.6], [32, 39], [39, 32]), dk('#ffd21e', 0.25)) + H(poly([16.4, 16.4], [29, 25], [25, 29]), 0.55)
    + S(star(32, 32, 14, 5, 4), '#fff0a0', { w: 1.8 }) + F(circ(32, 32, 4), '#fffbe8'))),
  ki_orb: L('M6 56L26 40M10 46L22 38M16 58L30 44', '#7fd0ff', 3, 0.85)
    + AURA(38, 28, 24, '#4fb4ff')
    + S(circ(38, 28, 17), '#3aa2f0') + F('M55 28A17 17 0 0 1 38 45A14 14 0 0 0 52 28Z', dk('#3aa2f0', 0.3)) + F(circ(38, 28, 10), '#d8f2ff', 0.85) + F(circ(38, 28, 5), '#fffbe8')
    + H('M24 24Q27 14 38 12Q30 16 27 26Z', 0.6) + SP(56, 10, 3.5) + SP(54, 46, 2.5),
  ki_core: AURA(32, 32, 28, '#b36bff') + FIT(0.93, 0, 0, ROT(-25, 32, 32, L(ell(32, 32, 27, 8), '#e0c2ff', 2.4) + L(ell(32, 32, 27, 8), '#7a3ad0', 1.2))
    + S(poly([32, 10], [46, 24], [46, 40], [32, 54], [18, 40], [18, 24]), '#8a46e0')
    + F(poly([32, 10], [46, 24], [46, 40], [32, 54], [32, 32]), dk('#8a46e0', 0.3), 0.6)
    + L('M18 24L32 32L46 24M32 32V54', lt('#8a46e0', 0.4), 1.4)
    + H(poly([32, 12], [20, 25], [24, 30], [32, 16]), 0.65)
    + ROT(25, 32, 32, L('M5 32A27 8 0 0 0 59 32', '#e0c2ff', 2.4) + L('M5 32A27 8 0 0 0 59 32', '#7a3ad0', 1.2))
    + F(circ(32, 32, 3), '#fffbe8')),
  ki_flare: AURA(32, 34, 28, '#ffc21e') + FIT(0.92, 0, -1, S('M32 2L37 16L46 8L44 22L56 18L48 32Q58 44 48 54Q40 60 32 60Q24 60 16 54Q6 44 16 32L8 18L20 22L18 8L27 16Z', '#ffb01a')
    + S('M32 16L36 26L42 22L40 34Q46 42 40 50Q36 54 32 54Q28 54 24 50Q18 42 24 34L22 22L28 26Z', '#ffe86a', { w: 1.6 })
    + F('M48 32Q58 44 48 54Q40 60 32 60Q44 52 46 42Q46 36 42 30Z', dk('#ffb01a', 0.25)) + H('M18 34Q16 24 12 20L20 24Z', 0.5)
    + F(ell(32, 44, 6, 8), '#fffbe8', 0.9)
    + L('M10 40L14 44L10 48M54 36L50 40L55 44', '#bff4ff', 2)) + SP(54, 7, 3),
  ki_nova: AURA(32, 32, 31, '#ff5a2a') + FIT(0.92, 0, 0, L(ell(32, 32, 29, 10), '#ffb08a', 2.2, 0.8)
    + S(star(32, 32, 27, 13, 12), '#ff6a1e', { w: 2.2 })
    + S(star(32, 32, 16, 9, 12, 0), '#ffb43a', { w: 1.6 })
    + F(circ(32, 32, 8), '#fff1c0') + F(circ(32, 32, 4.5), '#fffbe8') + H(ell(25, 24, 3.4, 2), 0.5)) + SP(9, 9, 3) + SP(55, 55, 3),
  ki_star: AURA(32, 32, 32, '#7fe6ff')
    + F(star(32, 32, 27, 4, 8), '#e6fbff', 0.85)
    + S(circ(32, 32, 19), '#9fe4ff', { w: 2.2 })
    + F('M51 32A19 19 0 0 1 32 51A16 16 0 0 0 48 32Z', dk('#9fe4ff', 0.25)) + F(circ(32, 32, 13), '#e6faff', 0.9) + F(circ(32, 32, 7), '#fffbe8')
    + H(ell(24, 22, 5, 3), 0.6) + SP(52, 12, 3.4) + SP(12, 52, 3) + SP(52, 52, 2.4) + SP(12, 12, 2.4),

  // Gravity plate: a heavy chamber floor plate, bolts, red 100G stencil.
  gravity_plate: FIT(1.04, 0, -4, S(poly([6, 30], [32, 18], [58, 30], [32, 42]), '#a9b6c8')
    + S(poly([6, 30], [32, 42], [32, 54], [6, 42]), '#7a8699') + S(poly([32, 42], [58, 30], [58, 42], [32, 54]), '#5c6678')
    + F(poly([10, 30], [32, 20], [36, 22], [14, 32]), '#ffffff', 0.4)
    + F(poly([20, 30], [32, 25], [44, 30], [32, 35]), '#e8322a', 0.9) + L('M27 28.4L32 31L37 28.4', '#fff0e0', 1.6)
    + F(poly([6, 42], [32, 54], [32, 50], [6, 38]), dk('#7a8699', 0.3), 0.5)
    + [[14, 39], [24, 44], [42, 46], [52, 41]].map(([x, y]) => F(circ(x, y, 1.6), '#2c3240')).join('')),
  // Turtle School sash: the blue belt knotted, with the orange kame patch.
  warrior_sash: FIT(0.94, 0, 0, S('M4 22Q32 30 60 22L60 32Q32 40 4 32Z', '#2f5fd0')
    + F('M4 29Q32 37 60 29V32Q32 40 4 32Z', dk('#2f5fd0', 0.35), 0.7)
    + S('M30 30L22 58L30 56L34 36Z', '#2f5fd0', { w: 2 }) + S('M34 30L46 56L38 58L32 36Z', '#2a54bc', { w: 2 })
    + S(rect(26, 24, 12, 13, 3), '#3a6ae0', { w: 2 }) + H('M6 23Q32 31 58 23V25Q32 33 6 25Z', 0.35)
    + S(circ(48, 14, 9), '#ff8a1e', { w: 2 }) + F(circ(48, 14, 6.5), '#fff6e8') + T(48, 14.5, 9.5, '亀', ART_INK, { stroke: '#fff6e8', sw: 1.2 })),
  // Crimson Tyrant's horn: curved bone horn, crimson cursed crown at the base.
  tyrant_horn: AURA(26, 46, 18, '#ff3a5a')
    + S('M12 52Q12 32 28 20Q40 12 54 6Q48 16 42 24Q32 38 32 52Z', '#ece3d6')
    + F('M54 6Q48 16 42 24Q32 38 32 52H26Q28 36 40 24Q48 14 54 6Z', dk('#ece3d6', 0.3), 0.6)
    + L('M16 42Q22 40 28 42M19 34Q25 32 31 34M24 27Q30 26 35 28M31 21Q36 20 40 22', dk('#ece3d6', 0.4), 1.4)
    + H('M15 46Q16 34 26 25Q20 34 19 46Z', 0.65)
    + S('M8 50H36V58H8Z', '#b3202e', { w: 2 }) + F(circ(22, 54, 2.4), '#ff9ab0') + L('M28 52L32 46L30 42', '#ff3a5a', 1.6),
  // Senzu Bean: Korin's cloth pouch with green beans tumbling out.
  vital_bean: FIT(1, -2, -2.5, S('M8 36Q6 20 18 16L16 10H30L28 16Q40 20 38 36Q36 48 22 48Q10 48 8 36Z', '#c99a5a')
    + F('M30 18Q40 24 37 38Q34 48 22 48Q34 40 30 18Z', dk('#c99a5a', 0.3), 0.6)
    + L('M15 15Q23 19 31 15', '#7a4a2a', 2.2) + H(ell(15, 28, 3, 6), 0.4)
    + S(ell(44, 44, 10, 14), '#56c43a') + F('M50 34Q56 46 48 56Q42 58 38 54Q50 48 50 34Z', dk('#56c43a', 0.3), 0.6)
    + L('M44 34Q40 44 44 54', dk('#56c43a', 0.35), 1.6) + H(ell(40, 38, 3, 5), 0.7)
    + S(ell(26, 54, 7, 5), '#4cb434', { w: 2 }) + H(ell(24, 52, 2.4, 1.4), 0.6)) + SP(54, 22, 3.5),

  // --- Crops (raw)
  sun_wheat: CROP.sun_wheat,
  moon_rice: CROP.moon_rice,
  fire_pepper: CROP.fire_pepper,
  frost_melon: CROP.frost_melon,
  thunder_root: CROP.thunder_root,
  star_fruit: CROP.star_fruit,

  // --- Seeds: one packet each, the crop on the label, its own seeds spilling out
  seed_vital_bean: PK(S(ell(32, 34, 14, 20), '#56c43a') + H(ell(26, 26, 4, 7), 0.6), '#fff0d0',
    seedRow((x, y, a) => ROT(a, x, y, S(ell(x, y, 5, 3.4), '#56c43a', { w: 1.6 }) + H(ell(x - 1.5, y - 1, 1.6, 1), 0.7)))),
  seed_sun_wheat: PK(WHEAT_MINI, '#bfe2ff',
    seedRow((x, y, a) => ROT(a, x, y, S(ell(x, y, 3.2, 5), '#e0a22a', { w: 1.6 }) + L(`M${x} ${y - 3}V${y + 3}`, '#9a6a14', 1.2)))),
  seed_moon_rice: PK(CROP.moon_rice, '#2a3a78',
    seedRow((x, y, a) => ROT(a, x, y, S(ell(x, y, 2.6, 4.6), '#f6f0d8', { w: 1.6 })))),
  seed_fire_pepper: PK(CROP.fire_pepper, '#ffe7b0',
    seedRow((x, y, a) => S(circ(x, y, 3.8), '#ffd86a', { w: 1.6 }) + F(circ(x - 1, y - 1, 1.2), '#ff7a2a'))),
  seed_frost_melon: PK(CROP.frost_melon, '#e4f8ff',
    seedRow((x, y, a) => ROT(a, x, y, S(`M${x} ${y - 5}Q${x + 4} ${y + 1} ${x} ${y + 4}Q${x - 4} ${y + 1} ${x} ${y - 5}Z`, '#2a2a3a', { w: 1.6 }) + H(ell(x - 1, y, 0.8, 1.6), 0.6)))),
  seed_thunder_root: PK(CROP.thunder_root, '#3a2a6a',
    seedRow((x, y, a) => S(circ(x, y, 3.6), '#a77ae6', { w: 1.6 }) + F(`M${x + 0.5} ${y - 2.5}L${x - 1.5} ${y + 0.5}H${x + 0.5}L${x - 0.5} ${y + 2.5}L${x + 2} ${y - 0.5}H${x}Z`, '#ffe23a'))),
  seed_star_fruit: PK(CROP.star_fruit, '#5a3a8a',
    AURA(52, 52, 11, '#ffe066') + seedRow((x, y, a) => ROT(a, x, y, S(ell(x, y, 3, 4.6), '#9a5a2a', { w: 1.6 }) + F(circ(x, y - 1, 1), '#ffe066'))) + SP(58, 40, 2.6)),

  // --- Meals
  sunbread: FIT(1, 0, -7, S(ell(32, 52, 27, 7), '#8a5a34', { w: 2 })
    + S('M8 46Q6 24 32 20Q58 24 56 46Q44 52 32 52Q20 52 8 46Z', '#e0943a')
    + F('M44 24Q58 30 56 46Q44 52 32 52Q50 44 44 24Z', dk('#e0943a', 0.3), 0.55)
    + F(circ(32, 34, 6), '#ffd98a') + L('M32 24V27M32 41V44M22 34H25M39 34H42M25 27L27 29M39 27L37 29M25 41L27 39M39 41L37 39', '#ffd98a', 2.2)
    + H('M14 36Q16 26 28 23Q20 28 18 38Z', 0.5)),
  moon_onigiri: FIT(1, 0, -2, S(ell(32, 54, 26, 6), '#d6e2f0', { w: 2 })
    + S('M32 8Q38 8 44 18L56 40Q60 52 50 52H14Q4 52 8 40L20 18Q26 8 32 8Z', '#f4f1e6')
    + F('M44 18L56 40Q60 52 50 52H38Q54 46 44 18Z', '#d8dbe6', 0.7)
    + S('M20 38H44V52H20Z', '#1f3a2e', { w: 2 }) + L('M24 41V50M30 41V50M36 41V50', '#2f5a46', 1.2)
    + S('M34 20Q28 24 30 30Q34 34 40 32Q34 36 28 32Q24 26 28 22Q30 20 34 20Z', '#ffd84a', { w: 1.4 })
    + H(ell(22, 26, 3, 5), 0.6)),
  pepper_stew: FIT(0.95, 0, 1.5, L('M22 14Q18 8 22 2M32 14Q28 8 32 2M42 14Q38 8 42 2', '#ffffff', 2.2, 0.6)
    + S('M6 28H58Q56 54 32 56Q8 54 6 28Z', '#7a4630')
    + F('M44 30H58Q56 54 32 56Q50 46 44 30Z', dk('#7a4630', 0.35), 0.6)
    + S(ell(32, 28, 26, 7), '#d8361e', { w: 2 }) + F(ell(32, 29, 20, 4.5), '#ff6a2a', 0.6)
    + S('M30 26Q40 18 48 24Q44 28 36 28Z', '#e8281e', { w: 1.6 }) + S('M46 22L50 18', '#3f9a3a', { w: 2 })
    + S(circ(20, 28, 3), '#ffcf5a', { w: 1.4 }) + S(circ(14, 46, 3.5), '#c08a5a', { w: 1.6 }) + S(circ(50, 46, 3.5), '#c08a5a', { w: 1.8 }) + H('M10 32Q12 42 18 48Q12 44 11 34Z', 0.45)),
  melon_sorbet: FIT(0.95, 0, 0, S('M14 30H50Q48 44 32 46Q16 44 14 30Z', '#e6f6ff', { w: 2 })
    + S('M29 45H35V54H29Z', '#cde8f6', { w: 2 }) + S(ell(32, 56, 12, 3.5), '#cde8f6', { w: 2 })
    + S(circ(24, 26, 10), '#8ee8d0') + S(circ(40, 26, 10), '#a8f0e8') + S(circ(32, 16, 9), '#c8fff4')
    + L('M18 30Q24 34 30 30M34 30Q40 34 46 30', dk('#8ee8d0', 0.25), 1.4)
    + H(ell(28, 12, 3, 2), 0.7) + H(ell(20, 22, 2.5, 1.8), 0.6)
    + S('M44 4L48 6L42 20L39 18Z', '#e8b66a', { w: 1.8 })) + SP(54, 18, 3) + SP(10, 14, 2.5),
  thunder_ramen: FIT(0.93, 0, 2.5, S(poly([6, 8], [9, 5], [38, 26], [35, 29]), '#f0c98a', { w: 1.6 }) + S(poly([14, 3], [17, 1], [42, 24], [39, 27]), '#f0c98a', { w: 1.6 })
    + S('M4 30H60Q58 54 32 56Q6 54 4 30Z', '#c8282a')
    + F('M44 32H60Q58 54 32 56Q52 46 44 32Z', dk('#c8282a', 0.35), 0.6)
    + L('M10 42Q20 38 32 42Q44 46 54 42', '#ffffff', 1.6, 0.8)
    + S(ell(32, 30, 28, 7), '#f2d57a', { w: 2 })
    + L('M12 30Q16 27 20 30Q24 33 28 30M28 30Q32 27 36 30Q40 33 44 30M38 32Q42 29 46 32Q50 34 52 31', '#d9a832', 1.6)
    + S(ell(44, 28, 6, 3.5), '#ffffff', { w: 1.4 }) + L('M41 28Q44 25 47 28', '#ff6a8a', 1.4)
    + S('M22 24L18 30H22L19 36L28 27H24L27 22Z', '#ffe23a', { w: 1.8 }) + H('M8 34Q12 44 20 50Q11 46 9 36Z', 0.45)),
  star_feast: FIT(0.95, 0, -1.5, S(ell(32, 50, 28, 9), '#e6eef6', { w: 2 }) + F(ell(32, 50, 21, 6), '#c9d6e4', 0.6)
    + S(circ(10, 20, 5), '#fbf6ea', { w: 2 }) + S(circ(14, 14, 5), '#fbf6ea', { w: 2 })
    + S('M14 18L22 24L18 28L10 22Z', '#fbf6ea', { w: 2 })
    + S('M16 30Q14 16 30 14Q48 14 52 28Q56 42 40 48Q24 50 18 42Q14 38 16 30Z', '#b0582a')
    + F('M44 18Q56 30 48 42Q42 48 30 48Q46 40 44 18Z', dk('#b0582a', 0.3), 0.6)
    + H('M22 24Q26 18 34 17Q26 21 24 28Z', 0.55)
    + S(star(50, 46, 9, 4.5, 5), '#ffd23a', { w: 1.8 }) + F(star(50, 46, 5, 2.5, 5), '#fff3b0')),

  // --- Gear
  // Galick Gauntlets: a white Saiyan glove, fist clenched, purple Galick Gun ki on the knuckles.
  power_gauntlets: AURA(42, 22, 22, '#b45aff')
    + FIT(0.9, 0, 0, ROT(40, 32, 32,
      S('M24 34H40V58H24Z', '#2f3fa8') + S('M22 34H42V40H22Z', '#f6f6f2', { w: 2 })
      + S('M20 14Q20 8 26 8H40Q46 8 46 14V30Q46 36 40 36H24Q20 36 20 30Z', '#f6f6f2')
      + L('M26 10V22M33 9V22M39 10V22', '#b8bcc8', 1.6) + S('M16 20Q16 30 24 30L24 22Q20 18 16 20Z', '#f6f6f2', { w: 2 })
      + F('M40 10Q46 12 46 18V30Q46 36 40 36H34Q44 30 40 10Z', '#c9ccd8', 0.7) + H(ell(26, 14, 3, 2), 0.6)))
    + SP(54, 8, 4, '#e6c8ff') + SP(58, 26, 2.5, '#e6c8ff'),
  // Saiyan battle armour: white chest plate, tall yellow shoulder pads, navy bodysuit.
  battle_armor: FIT(0.92, 0, -2.5, S('M16 18Q24 10 32 14Q40 10 48 18L50 52Q32 58 14 52Z', '#24307a')
    + S('M20 20Q32 16 44 20L46 50Q32 54 18 50Z', '#f4f2ea')
    + F('M38 20Q44 20 44 20L46 50Q40 52 34 52Q42 36 38 20Z', '#cfd2dc', 0.7)
    + L('M24 28H40M22 38Q32 41 42 38', '#c4c6d0', 1.6)
    + S('M4 14Q12 6 22 12L22 26Q12 26 6 30Q2 22 4 14Z', '#e8c64a') + S('M60 14Q52 6 42 12L42 26Q52 26 58 30Q62 22 60 14Z', '#e8c64a')
    + S('M18 50H30L28 60H18Z', '#e8c64a', { w: 2 }) + S('M34 50H46V60H36Z', '#e8c64a', { w: 2 })
    + H('M6 16Q12 10 18 13Q12 16 8 22Z', 0.6) + H(ell(26, 24, 3, 2), 0.6)),
  // Weighted wristbands: two heavy red cuffs with a weight tag.
  gravity_bracer: FIT(1.02, 0, -4, S(ell(24, 44, 18, 9), '#c62a2a')
    + S('M6 36Q6 28 24 28Q42 28 42 36V44Q42 52 24 52Q6 52 6 44Z', '#d63030')
    + S(ell(24, 36, 18, 8), '#e8484a', { w: 2 }) + F(ell(24, 36, 11, 4.5), '#5a1010')
    + S('M24 26Q24 18 42 18Q60 18 60 26V34Q60 42 42 42Q30 42 26 38Z', '#2f5fd0')
    + S(ell(42, 26, 18, 8), '#4a7ae8', { w: 2 }) + F(ell(42, 26, 11, 4.5), '#152a60')
    + H('M9 39Q11 46 19 48Q12 47 9 43Z', 0.45) + H('M27 24Q30 20 38 19Q31 22 29 26Z', 0.5)
    + S(rect(36, 31, 14, 11, 2), '#9aa4b4', { w: 1.8 }) + F('M40.6 34H45.4L47 40H39Z', dk('#9aa4b4', 0.45)) + F(circ(43, 33.4, 1.2), dk('#9aa4b4', 0.45))),
  // Scouter: green glass lens, white ear unit, red power readout.
  battle_scouter: FIT(1.04, -2.5, 5, S('M10 38Q6 28 14 22Q22 18 28 24Q30 34 26 42Q18 46 10 38Z', '#f0f0ea')
    + S(circ(18, 32, 5.5), '#c8ccd6', { w: 2 }) + F(circ(18, 32, 2.4), '#e8322a')
    + S('M24 26L40 18L42 22L28 32Z', '#d8dae2', { w: 2 })
    + S('M36 10H60V34Q52 40 40 38L36 30Z', '#3ad86a', { w: 2.2 })
    + `<path d="M38 12H58V32Q52 36 41 35Z" fill="#9affc0" stroke="none" opacity="0.4"/>`
    + L('M44 18H54M44 23H50', '#c60e1e', 2) + L('M48 28L52 24L56 28', '#c60e1e', 1.6)
    + F('M26 40Q20 46 12 40Q20 42 25 37Z', dk('#f0f0ea', 0.25)) + H('M39 12H46L40 30Z', 0.5)),
  // Weighted Turtle Gi: the orange gi top, blue undershirt and sash, kame kanji on the chest.
  weighted_gi: S('M22 8L32 14L42 8L58 16L54 30L46 28V58H18V28L10 30L6 16Z', '#ff8a1e')
    + F('M42 8L58 16L54 30L46 28V58H36Q44 40 42 8Z', dk('#ff8a1e', 0.3), 0.5)
    + S('M24 9L32 26L40 9L32 14Z', '#2f5fd0', { w: 1.8 })
    + S('M17 40H47V47H17Z', '#2f5fd0', { w: 2 }) + S(rect(28, 46, 8, 10, 2), '#2a54bc', { w: 1.8 })
    + S(circ(40, 31, 6.4), '#fff6e8', { w: 1.8 }) + T(40, 31.4, 9, '亀', ART_INK, { stroke: '#fff6e8', sw: 1.2 })
    + S(rect(7, 44, 12, 12, 2), '#5c6678', { w: 1.8 }) + F('M10.5 48H15.5L17 54H9Z', dk('#5c6678', 0.45)) + F(circ(13, 46.6, 1.1), dk('#5c6678', 0.45))
    + H('M10 18L22 12L24 18L12 24Z', 0.4),
  // Crimson knuckles: spiked crimson brass knuckles of the Tyrant.
  crimson_knuckles: FIT(0.82, 1.5, 1.5, ROT(-35, 32, 32,
    S('M8 22Q8 14 16 14H48Q56 14 56 22V30Q56 34 52 34H12Q8 34 8 30Z', '#c41e34')
    + F(circ(16, 24, 4.6), ART_INK) + F(circ(26.5, 24, 4.6), ART_INK) + F(circ(37.5, 24, 4.6), ART_INK) + F(circ(48, 24, 4.6), ART_INK)
    + S('M14 34H50Q50 48 32 50Q14 48 14 34Z', '#a3182c')
    + F(ell(32, 41, 6, 4), '#ff6a8a') + H(ell(29, 40, 2.2, 1.2), 0.8)
    + S('M12 14L16 4L20 14Z', '#e8e6ee', { w: 1.6 }) + S('M23 14L27 4L31 14Z', '#e8e6ee', { w: 1.6 }) + S('M34 14L38 4L42 14Z', '#e8e6ee', { w: 1.6 }) + S('M45 14L49 4L53 14Z', '#e8e6ee', { w: 1.6 })
    + F('M50 34Q50 48 32 50Q44 44 46 34Z', dk('#a3182c', 0.3)) + H('M12 16H50V18H12Z', 0.5)))
    + SP(52, 52, 3, '#ffb0c0'),

  // Capsule Corp crate: a white metal crate with the CC logo, a Hoi-Poi capsule on top.
  capsule_crate: FIT(0.96, -1, 0, S(poly([6, 30], [32, 22], [58, 30], [32, 38]), '#e8ebf0')
    + S(poly([6, 30], [32, 38], [32, 60], [6, 52]), '#d6dbe4') + S(poly([32, 38], [58, 30], [58, 52], [32, 60]), '#aeb6c4')
    + L('M6 41L32 49L58 41', '#2f5fd0', 2.4)
    + S(ell(19, 46, 7, 7.5), '#2f5fd0', { w: 1.8 }) + L('M17.6 43.2A3 3 0 1 0 17.6 48.8M22.6 43.2A3 3 0 1 0 22.6 48.8', '#f0f2f6', 1.4)
    + H('M9 31L30 24L32 25L11 32Z', 0.5)
    + ROT(-18, 34, 18, S('M20 12H48Q54 12 54 18Q54 24 48 24H20Q14 24 14 18Q14 12 20 12Z', '#f8f8f6')
      + S('M34 12H48Q54 12 54 18Q54 24 48 24H34Z', '#e8322a', { w: 2 }) + S(circ(22, 18, 3), '#2a2a38', { w: 1.4 })
      + H('M20 14H46V16H20Z', 0.6))) + SP(55, 9, 3.2),

  // --- Dragon Balls
  wish_stone_1: DB(1), wish_stone_2: DB(2), wish_stone_3: DB(3), wish_stone_4: DB(4),
  wish_stone_5: DB(5), wish_stone_6: DB(6), wish_stone_7: DB(7),

  // --- Gravity rig: crude iron weight box -> Capsule Corp console -> gravity room core
  tool_gravity_1: FIT(1, -4, 0, S(rect(16, 20, 42, 36, 3), '#7a6a5a') + H('M19 23H40V25H19Z', 0.45)
    + F('M48 20H55Q58 20 58 23V53Q58 56 55 56H48Z', dk('#7a6a5a', 0.3), 0.6)
    + S(circ(32, 33, 9), '#e8dcc0', { w: 2 }) + L('M25 33H27M32 26V28M39 33H37', '#5a4a3a', 1.6) + L('M32 33L37 28', '#c62a2a', 2.2)
    + S(rect(46, 26, 6, 24, 2), '#4a3e34', { w: 1.8 }) + L('M26 20L20 9', ART_INK, 4.4) + L('M26 20L20 9', '#8a8e98', 2.2) + S(circ(20, 9, 4), '#c62a2a', { w: 2 })
    + F(rect(24, 46, 16, 5, 1.5), dk('#7a6a5a', 0.4)) + F(rect(25.5, 47.3, 4, 2.4, 0.8), '#ffe0a0') + F(circ(20, 24, 1.4), '#3a2e24') + F(circ(42, 52, 1.4), '#3a2e24') + F(circ(42, 24, 1.4), '#3a2e24')),
  tool_gravity_2: FIT(1, -2, -1.5, S('M8 24L16 12H52L60 24V56H8Z', '#c9d1dc')
    + F('M50 12H52L60 24V56H50Z', dk('#c9d1dc', 0.3), 0.6)
    + S(rect(13, 18, 42, 17, 3), '#1a2a3a', { w: 2 }) + F(rect(17, 22, 6, 9, 1), '#3aff8a') + F(rect(25, 22, 6, 9, 1), '#3aff8a') + F(rect(33, 22, 6, 9, 1), '#3aff8a') + F(rect(41, 22, 6, 9, 1), '#3aff8a', 0.3) + F(rect(49, 22, 3, 9, 1), '#3aff8a', 0.3)
    + L('M8 39H60', '#2f5fd0', 2)
    + S(circ(52, 48, 5.5), '#2f5fd0', { w: 2 }) + L('M52 48L55 45', '#ffffff', 1.6)
    + S(rect(29, 44, 6, 7, 1.5), '#e8322a', { w: 1.6 }) + S(rect(38, 44, 6, 7, 1.5), '#ffd23a', { w: 1.6 })
    + H('M12 14H42L40 16H12Z', 0.5)),
  tool_gravity_3: AURA(32, 30, 30, '#ff3a3a')
    + FIT(0.95, -3, -1, S('M18 60L22 26H48L52 60Z', '#f2f2ec')
    + F('M42 26H48L52 60H44Z', dk('#f2f2ec', 0.25), 0.6)
    + S('M16 24H54V30H16Z', '#e8b830', { w: 2 }) + S('M16 54H54V60H16Z', '#e8b830', { w: 2 })
    + S('M20 24Q20 4 35 4Q50 4 50 24Z', '#ff3a3a') + F(ell(35, 16, 9, 7), '#ffb0a0', 0.85) + H(ell(28, 10, 4, 2.4), 0.7)
    + S(rect(22, 33, 26, 12, 2.5), '#1a2a3a', { w: 2 }) + F(rect(25, 36, 5, 6, 1), '#ff5a4a') + F(rect(32.5, 36, 5, 6, 1), '#ff5a4a') + F(rect(40, 36, 5, 6, 1), '#ff5a4a')
    + S(circ(35, 50, 2.6), '#2f5fd0', { w: 1.8 })) + SP(56, 8, 3.6) + SP(10, 12, 3),
});
})();
