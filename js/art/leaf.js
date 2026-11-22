'use strict';
/* Item art — Leaf Village (Naruto). See js/item-art.js for the helpers and style rules. */
(() => {
const { S, F, L, H, SP, AURA, T, G, GL, lt, dk, mix, circ, ell, rect, poly, star, ROT, TR } = ARTK;
// A log lying at an angle: bark body, cut face with rings. extra = markup inside the rotated group.
const LOG = (bark, face, ring, extra) => ROT(-28, 32, 34,
  S('M12 22H48V46H12Q5 46 5 34Q5 22 12 22Z', bark)
  + L('M14 28H34M18 35H44M12 40H30', dk(bark, 0.45), 1.4)
  + S(ell(48, 34, 8, 12), face, { w: 2.2 })
  + L(ell(48, 34, 5, 8), ring, 1.2) + L(ell(48, 34, 2.2, 3.6), ring, 1.2)
  + H('M14 24H40V26.5H14Z', 0.35) + (extra || ''));
// The Hidden Leaf symbol (same strokes as the headband), placed with a transform.
const LEAF = (tf, c, w) => TR(tf, L('M24 33Q28 26 34 28Q41 30 38 36Q35 41 30 37Q27 34 31 32', c, w) + L('M38 36L44 40', c, w));
// A ring drawn as a thick stroke (no holes needed).
const RING = (d, c, w) => L(d, ART_INK, w + 2.4) + L(d, c, w);
// Five-petal blossom
const BLOSSOM = (x, y, r, c) => S(star(x, y, r, r * 0.62, 5), c, { w: 1.8 }) + F(circ(x, y, r * 0.3), '#ffe36a');
Object.assign(ART, {
  /* ---------------------------------------------------------------- wood */
  // Pine log: plain bark, pale cut face with rings, a pine sprig.
  pine_log: LOG('#a8683a', '#f2c987', '#c48a4a')
    + S('M20 14L26 22L30 13L34 21L38 12', '#3f9a4a', { w: 2 }) + L('M20 14L26 22L30 13L34 21L38 12', '#5fcf6a', 1.2),
  // Cedar log: red bark with a training kunai stuck in it.
  cedar_log: TR('translate(0 2)', LOG('#b8492c', '#e89a6a', '#b05a34'))
    + S('M27 31L36 6L39 7L33 32Z', '#c9d1dc') + S(circ(26, 36, 3.2), '#5c4a3a', { w: 1.8 }) + L('M27 32L30 34', '#e8edf3', 1.2),
  // Bamboo: three green stalks with nodes and leaves (not a log at all).
  bamboo: ROT(18, 32, 32,
    S(rect(14, 12, 9, 48, 3), '#6fae3c') + S(rect(27, 4, 10, 56, 3), '#86c84a') + S(rect(41, 16, 9, 44, 3), '#5e9e34')
    + L('M14 26H23M14 42H23M27 18H37M27 34H37M27 50H37M41 30H50M41 46H50', dk('#6fae3c', 0.5), 2)
    + H('M29 6H31.5V58H29Z', 0.4) + H('M16 14H18V58H16Z', 0.3))
    + S('M38 16Q50 6 60 10Q50 18 38 16Z', '#4fae3a', { w: 1.8 }) + S('M20 34Q8 30 4 22Q16 22 20 34Z', '#4fae3a', { w: 1.8 }),
  // Mistwood: blue-grey damp log wrapped in Hidden Mist fog, a drop of water.
  mistwood: LOG('#6f7f92', '#d4dde6', '#8a9aab')
    + F('M2 54Q4 44 13 46Q17 38 26 43Q32 37 39 44Q47 40 50 49Q58 48 60 56H2Z', '#e8f2fb', 0.92) + L('M2 54Q4 44 13 46Q17 38 26 43Q32 37 39 44Q47 40 50 49', '#9fb3c8', 1.8)
    + F('M6 30Q14 26 22 30Q14 32 6 30Z', '#e8f2fb', 0.7)
    + S('M50 4Q57 13 57 17A7 7 0 0 1 43 17Q43 13 50 4Z', '#4aa3e0', { w: 2 }) + H(ell(48, 15, 1.6, 3), 0.8),
  // Ironwood: near-black bark held by two riveted iron bands.
  ironwood: LOG('#4e403c', '#b89a7a', '#7a5a44',
    S('M17 21H24V47H17Z', '#8a96a4', { w: 2 }) + S('M33 21H40V47H33Z', '#8a96a4', { w: 2 })
    + F(circ(20.5, 27, 1.4), ART_INK) + F(circ(20.5, 41, 1.4), ART_INK) + F(circ(36.5, 27, 1.4), ART_INK) + F(circ(36.5, 41, 1.4), ART_INK)
    + H('M18 22.5H20V45H18ZM34 22.5H36V45H34Z', 0.5)),
  // Blossomwood: dark cherry branch-log in bloom.
  blossomwood: LOG('#7a4436', '#f2c9b0', '#c07a6a')
    + L('M26 22Q24 12 16 8', ART_INK, 5) + L('M26 22Q24 12 16 8', '#7a4436', 2.8)
    + BLOSSOM(15, 9, 7, '#ff9ec4') + BLOSSOM(30, 10, 6, '#ffc2dc') + BLOSSOM(10, 46, 6, '#ff9ec4') + SP(52, 10, 3),
  // Spirit oak: thick oak log humming with green chakra, an acorn on top.
  spirit_oak: AURA(32, 34, 30, '#5effa0')
    + LOG('#6b5634', '#e8d6a0', '#a8884a', L('M16 30Q22 34 28 30Q34 26 40 32', '#7dffb0', 2) + L('M14 38Q20 41 26 38', '#7dffb0', 1.6))
    + S(ell(20, 16, 8, 9.5), '#c0843a', { w: 2 }) + S('M10 12Q20 0 30 12Q20 15 10 12Z', '#6a4a2a', { w: 2 }) + L('M20 5V1', ART_INK, 2.2) + H(ell(17, 17, 2, 3.4), 0.7)
    + SP(52, 10, 3.5, '#c8ffd8'),
  // Senju heartwood: golden-cored log that keeps sprouting (Wood Release).
  heartwood: AURA(32, 34, 30, '#ffd36a')
    + LOG('#8a5a2e', '#ffcf6a', '#d08a2a')
    + L('M24 26Q22 14 30 6', ART_INK, 5.4) + L('M24 26Q22 14 30 6', '#8a5a2e', 3)
    + L('M23 18Q16 14 10 16', ART_INK, 4.4) + L('M23 18Q16 14 10 16', '#8a5a2e', 2.2)
    + S('M30 6Q40 0 44 6Q38 12 30 6Z', '#5fcf4a', { w: 1.8 }) + S('M10 16Q4 8 10 4Q14 10 10 16Z', '#5fcf4a', { w: 1.8 })
    + S('M26 12Q34 12 36 18Q28 20 26 12Z', '#4fb83a', { w: 1.8 }) + SP(54, 14, 3.5),

  /* ---------------------------------------------------------------- herbs */
  // Healing leaf: bright green leaf with a white medical-ninja cross glow.
  healing_leaf: AURA(32, 32, 26, '#7dff9a')
    + S('M12 52Q10 22 40 10Q56 6 54 12Q50 40 22 50Q16 52 12 52Z', '#3fbf5a')
    + L('M13 51Q28 34 48 14', dk('#3fbf5a', 0.45), 2) + L('M24 40L22 28M30 33L30 22M36 27L40 18M24 40L34 42M30 33L40 34M36 27L46 27', dk('#3fbf5a', 0.4), 1.2)
    + H('M18 40Q20 24 38 14Q30 22 24 34Z', 0.4)
    + S('M42 40h4v4h4v4h-4v4h-4v-4h-4v-4h4Z', '#ffffff', { w: 1.6, flat: true }),
  // Tsukuyomi petal: a pale flower before the red moon.
  moonpetal: S(circ(42, 20, 15), '#d8303a') + F(circ(46, 14, 3), dk('#d8303a', 0.3)) + F(circ(38, 26, 2.4), dk('#d8303a', 0.3)) + H(ell(36, 12, 4, 2), 0.35)
    + [0, 72, 144, 216, 288].map((a) => ROT(a, 26, 40, S('M26 40Q19 30 26 21Q33 30 26 40Z', '#efe6ff', { w: 1.8 }) + F('M26 38Q24 31 26 25Q28 31 26 38Z', '#b8a6e8', 0.6))).join('')
    + S(circ(26, 40, 4.2), '#c8384a', { w: 1.8 }) + SP(10, 14, 3, '#ffd6dc'),
  // Cloud fern: a curled frond under a storm cloud with a spark.
  cloud_fern: L('M16 58Q22 40 34 32Q48 24 48 14Q48 6 41 7Q35 9 38 15Q41 17 43 14', ART_INK, 5) + L('M16 58Q22 40 34 32Q48 24 48 14Q48 6 41 7Q35 9 38 15Q41 17 43 14', '#4fa83a', 2.8)
    + S('M20 46Q10 46 8 40Q16 38 22 42Z', '#5fc04a', { w: 1.8 }) + S('M26 38Q18 32 20 26Q28 30 28 36Z', '#5fc04a', { w: 1.8 })
    + S('M32 34Q34 44 42 46Q42 38 34 32Z', '#5fc04a', { w: 1.8 }) + S('M40 28Q48 34 56 32Q52 24 44 25Z', '#5fc04a', { w: 1.8 })
    + S('M6 20Q6 13 13 14Q16 7 23 10Q30 9 30 16Q34 20 28 22H10Q6 22 6 20Z', '#e8f0ff', { w: 2 })
    + S('M17 22L13 30H18L15 38L25 27H20L23 22Z', '#ffe14a', { w: 1.6 }),
  // Nara shadowroot: a dark tuber trailing Shadow Possession tendrils.
  shadowroot: F(ell(32, 56, 26, 5), '#140c1c', 0.6)
    + L('M30 54Q20 56 4 50M34 54Q44 58 60 52M28 56Q18 60 8 60', '#05030a', 3.4)
    + S('M22 16Q32 10 42 16Q46 28 38 38Q35 46 31 56Q28 46 26 38Q16 28 22 16Z', '#6a5490')
    + L('M24 30Q16 34 12 44M40 30Q48 36 50 46M30 44Q24 48 20 54', ART_INK, 4.4) + L('M24 30Q16 34 12 44M40 30Q48 36 50 46M30 44Q24 48 20 54', '#6a5490', 2.2) + L('M28 22Q32 28 30 36', dk('#6a5490', 0.5), 1.6)
    + H(ell(28, 20, 3, 2), 0.4)
    + S('M30 14Q22 4 14 6Q18 14 30 14Z', '#4fa83a', { w: 1.8 }) + S('M34 14Q42 2 50 6Q46 14 34 14Z', '#3f9a32', { w: 1.8 }),
  // Myoboku lotus: orange-pink lotus on a lily pad, sage marks on the petals.
  sage_lotus: S(ell(32, 50, 26, 8), '#3f9a4a') + L('M32 50L44 44', dk('#3f9a4a', 0.4), 1.6)
    + S('M32 48Q10 46 8 30Q22 30 32 48Z', '#ff9a6a') + S('M32 48Q54 46 56 30Q42 30 32 48Z', '#ff9a6a')
    + S('M32 48Q16 36 20 18Q32 26 32 48Z', '#ffb48a') + S('M32 48Q48 36 44 18Q32 26 32 48Z', '#ffb48a')
    + S('M32 48Q24 30 32 8Q40 30 32 48Z', '#ffc8a4')
    + F('M14 34L20 36L16 38ZM50 34L44 36L48 38Z', '#d84a1a') + F('M30 26H34L32 31Z', '#d84a1a') + H('M30 14Q28 24 30 34Q29 22 30 14Z', 0.5),
  // Shikkotsu orchid: violet orchid with a little blue-white Katsuyu slug.
  spirit_orchid: S('M32 30Q24 10 32 4Q40 10 32 30Z', '#a86ae0') + S('M32 30Q12 24 8 30Q16 38 32 30Z', '#a86ae0') + S('M32 30Q52 24 56 30Q48 38 32 30Z', '#a86ae0')
    + S('M32 30Q18 40 20 50Q30 46 32 30Z', '#9058d0') + S('M32 30Q46 40 44 50Q34 46 32 30Z', '#9058d0')
    + S('M27 30Q32 46 37 30Q32 26 27 30Z', '#fff4fa', { w: 1.8 }) + F('M30 32Q32 38 34 32Z', '#d84a8a') + F(circ(32, 29, 2.4), '#ffe36a')
    + S('M6 58Q8 50 18 50Q24 50 26 56Q16 60 6 58Z', '#e8f4ff', { w: 1.8 }) + L('M10 54Q16 52 22 54', '#5a8ae0', 1.6)
    + L('M20 50L22 45M23 51L27 47', ART_INK, 1.4) + H('M12 52Q16 51 18 52', 0.8),
  // Ryuchi moss: mossy stone with a white snake coiled through it.
  dragon_moss: S('M6 54Q6 44 16 42Q22 34 32 37Q44 32 52 42Q60 46 58 54Z', '#4e9a3a')
    + F(circ(16, 46, 3), lt('#4e9a3a', 0.3)) + F(circ(34, 42, 3.5), lt('#4e9a3a', 0.3)) + F(circ(48, 46, 3), lt('#4e9a3a', 0.3))
    + F('M8 54H56L58 54Q46 50 32 52Q18 50 8 54Z', dk('#4e9a3a', 0.4))
    + L('M14 44Q10 30 22 28Q34 26 32 18Q30 10 40 10', ART_INK, 7) + L('M14 44Q10 30 22 28Q34 26 32 18Q30 10 40 10', '#f2f4f8', 4.4)
    + S(ell(43, 10, 6, 4.2), '#f2f4f8', { w: 2 }) + F(circ(45, 9, 1.3), '#d82a3a') + L('M49 11L54 12M54 12L56 10M54 12L56 14', '#d82a3a', 1.2),
  // God Tree leaf: broad golden leaf with the ripple eye of the Divine Tree.
  world_tree_leaf: AURA(32, 32, 30, '#ffe07a')
    + S('M32 4Q54 18 52 38Q48 54 32 58Q16 54 12 38Q10 18 32 4Z', '#d8c040')
    + L('M32 6V56M32 20L20 14M32 20L44 14M32 44L18 40M32 44L46 40', dk('#d8c040', 0.35), 1.4)
    + S(ell(32, 31, 12, 9), '#c8384a', { w: 2 }) + L(ell(32, 31, 8, 6), '#7a1428', 1.4) + L(ell(32, 31, 4, 3), '#7a1428', 1.4) + F(circ(32, 31, 1.6), ART_INK)
    + H('M22 14Q16 24 18 34Q20 22 26 12Z', 0.45) + SP(52, 8, 3.5) + SP(10, 48, 2.6),

  /* ---------------------------------------------------------------- chakra */
  // Chakra shard: a cluster of raw blue chakra crystals.
  chakra_shard: F(ell(32, 54, 24, 4), '#140c1c', 0.45)
    + S(poly([14, 26], [22, 30], [24, 54], [12, 54], [8, 36]), '#3c8fe8') + S(poly([50, 22], [56, 34], [52, 54], [40, 54], [42, 28]), '#3c8fe8')
    + S(poly([32, 4], [42, 16], [40, 54], [24, 54], [22, 16]), '#5ab8ff')
    + F(poly([32, 4], [32, 54], [24, 54], [22, 16]), '#ffffff', 0.25) + F(poly([14, 26], [16, 54], [12, 54], [8, 36]), '#ffffff', 0.25)
    + L('M32 6V52', '#e8f7ff', 1.4, 0.7) + SP(48, 12, 3.5) + SP(14, 16, 2.6),
  // Chakra orb: blue swirling sphere, like a Rasengan's first step.
  chakra_orb: AURA(32, 32, 30, '#5ab8ff')
    + S(circ(32, 32, 17), '#3c8fe8')
    + L('M20 30Q26 18 38 20Q48 24 44 36', '#bfe6ff', 2.2) + L('M22 40Q32 46 42 40', '#bfe6ff', 1.8) + L('M26 34Q30 26 38 28', '#e8f7ff', 1.6)
    + H(ell(26, 24, 6, 3.5), 0.7) + SP(50, 14, 4) + SP(13, 47, 3),
  // Raiton chakra: a crackling Chidori ball, all jagged bolts.
  storm_chakra: AURA(32, 32, 30, '#7ac8ff')
    + L('M32 32L44 20L42 12L52 6M32 32L46 36L54 30M32 32L36 46L30 52L36 60M32 32L18 40L12 36L4 42M32 32L22 22L24 14L16 6', '#2a6ad8', 5)
    + L('M32 32L44 20L42 12L52 6M32 32L46 36L54 30M32 32L36 46L30 52L36 60M32 32L18 40L12 36L4 42M32 32L22 22L24 14L16 6', '#e8f7ff', 2.2)
    + S(circ(32, 32, 9), '#bfe6ff', { w: 2 }) + F(circ(32, 32, 4.5), '#ffffff') + SP(54, 48, 3) + SP(8, 22, 2.6),
  // Senjutsu essence: an orange drop of natural energy with a toad sage eye.
  nature_essence: AURA(32, 34, 28, '#ffb040')
    + S('M32 4Q50 24 50 38A18 18 0 0 1 14 38Q14 24 32 4Z', '#ff9a3a')
    + L('M22 30Q32 20 42 30', '#ffe0a0', 2, 0.8)
    + S(ell(32, 39, 11, 8), '#ffe36a', { w: 2 }) + S(rect(23, 37, 18, 4.4, 1.5), ART_INK, { w: 1, flat: true })
    + F('M14 44L20 42L18 48ZM50 44L44 42L46 48Z', '#c8401a') + H(ell(24, 22, 3, 6), 0.5) + SP(52, 10, 3),
  // Tailed beast ember: a red-orange flame with chakra bubbles.
  beast_ember: AURA(32, 36, 28, '#ff6a2a')
    + S('M32 58Q14 56 14 38Q16 26 26 18Q24 30 30 32Q28 18 38 6Q38 20 46 26Q54 36 48 48Q44 56 32 58Z', '#ff4a1a')
    + S('M32 54Q22 52 22 42Q24 34 30 30Q30 40 36 40Q36 32 40 28Q46 38 42 46Q40 54 32 54Z', '#ffc23a', { w: 1.8 })
    + S(circ(12, 22, 3.4), '#ff8a3a', { w: 1.6 }) + S(circ(52, 16, 2.6), '#ff8a3a', { w: 1.6 }) + S(circ(54, 44, 3), '#ff8a3a', { w: 1.6 })
    + H(ell(26, 38, 2, 4), 0.5),
  // Kirin core: a violet storm crystal with a lightning bolt sealed inside.
  lightning_core: AURA(32, 32, 30, '#b08aff')
    + S(poly([32, 4], [52, 16], [52, 46], [32, 58], [12, 46], [12, 16]), '#5a4ad0')
    + F(poly([32, 4], [32, 58], [12, 46], [12, 16]), '#ffffff', 0.18)
    + S('M36 12L22 34H31L26 52L44 26H34L40 12Z', '#ffe14a', { w: 2 })
    + L('M12 16L32 28L52 16M32 28V34', '#8a7ae8', 1.4, 0.7) + SP(54, 6, 3.5) + SP(8, 54, 3),
  // Six Paths chakra: a yin-yang bead ringed by six truth-seeking balls.
  sage_chakra: AURA(32, 32, 30, '#e8e0ff')
    + [0, 60, 120, 180, 240, 300].map((a) => ROT(a, 32, 32, S(circ(32, 7, 4.2), '#2a2438', { w: 1.8 }) + H(ell(31, 5.5, 1.4, 0.9), 0.7))).join('')
    + S(circ(32, 32, 15), '#f4f2fa') + F('M32 17A15 15 0 0 1 32 47A7.5 7.5 0 0 1 32 32A7.5 7.5 0 0 0 32 17Z', '#2a2438')
    + F(circ(32, 24.5, 2.2), '#2a2438') + F(circ(32, 39.5, 2.2), '#f4f2fa') + L(circ(32, 32, 15), ART_INK, 2.2),
  // Hidden Mist steel: a blue-grey ingot stamped with water, mist curling off it.
  mist_steel: S('M6 42L16 28H50L58 42Z', '#a8b8cc') + S('M6 42H58L54 54H10Z', '#7488a0')
    + T(32, 35, 10, '水', '#3a4a62') + H('M16 30H40L38 32H15Z', 0.6)
    + L('M8 20Q16 14 22 20Q28 26 34 18', '#e8f2fb', 2.4, 0.85) + L('M30 12Q38 6 46 12', '#e8f2fb', 2, 0.7)
    + S('M52 4Q57 11 57 14A5 5 0 0 1 47 14Q47 11 52 4Z', '#4aa3e0', { w: 1.8 }),
  // Ninken fang: one big curved hound fang with red Inuzuka marks.
  beast_fang: S('M10 8Q32 2 50 10Q42 18 40 30Q36 46 22 60Q26 42 24 30Q22 18 10 8Z', '#f6f0e0')
    + F('M10 8Q32 2 50 10Q47 14 45 17Q30 12 15 13Z', '#d8c4a0') + F('M45 17Q40 30 38 38Q34 50 22 60Q34 44 36 30Q38 22 40 16Z', dk('#f6f0e0', 0.2))
    + F('M26 22L34 24L27 28ZM27 32L34 34L28 38Z', '#d83a2a') + H('M20 16Q26 22 26 40Q22 26 18 16Z', 0.7),
  // Ashen fox tail: a big grey brush-tail with a white tip and embers.
  ashen_tail: S('M6 58Q0 46 9 38L7 33L14 31Q20 26 26 24L26 19L31 20Q34 12 40 8L40 3L46 6Q54 4 58 10L62 14L58 18Q58 26 54 32L58 35L52 38Q46 46 38 50L40 55L32 54Q22 58 6 58Z', '#8e8c9c')
    + S('M31 20Q34 12 40 8L40 3L46 6Q54 4 58 10L62 14L58 18Q58 22 56 27Q50 22 44 22Q37 22 31 20Z', '#f4f2fa', { w: 2 })
    + L('M12 50Q24 42 32 30M20 54Q32 46 42 34M28 40L22 36M38 42L34 38', dk('#8e8c9c', 0.4), 1.6) + H('M10 44Q16 34 26 28Q18 36 14 44Z', 0.4)
    + S(circ(10, 20, 2.6), '#ff8a3a', { w: 1.4 }) + S(circ(18, 12, 1.8), '#ffb04a', { w: 1.2 }),

  /* ---------------------------------------------------------------- pills */
  // Soldier pill: dark ration pill on a little leaf wrapper.
  soldier_pill: S('M8 46Q16 36 32 38Q48 36 56 46Q44 54 32 52Q20 54 8 46Z', '#7ab65a', { w: 2 })
    + S(circ(24, 34, 9), '#7a2f2a') + S(circ(40, 34, 9), '#7a2f2a') + S(circ(32, 26, 9), '#963832')
    + H(ell(29, 22, 3.5, 2), 0.7) + H(ell(21, 30, 3, 1.8), 0.6) + H(ell(37, 30, 3, 1.8), 0.6),
  // Spinach pill: the green Akimichi pill in an open red lacquer case.
  sage_pill: S('M10 38H54V46Q54 56 32 56Q10 56 10 46Z', '#b8342a') + S(ell(32, 38, 22, 8), '#d8463a', { w: 2.2 }) + F(ell(32, 38, 17, 5), '#5a1410')
    + L('M10 44Q32 52 54 44', '#ffcf3f', 1.6)
    + S(circ(32, 28, 12), '#3fa83a') + T(32, 29, 11, '一', '#1f5a1a') + H(ell(27, 22, 4, 2.4), 0.75),
  // Chili pill: the red pill, with Choji's blue chakra butterfly wings.
  storm_pill: AURA(32, 32, 30, '#6ad8ff')
    + S('M30 30Q12 4 4 16Q4 30 28 34Z', '#6ad8ff', { w: 2 }) + S('M34 30Q52 4 60 16Q60 30 36 34Z', '#6ad8ff', { w: 2 })
    + S('M28 36Q10 42 12 54Q22 56 30 40Z', '#4ab8f0', { w: 2 }) + S('M36 36Q54 42 52 54Q42 56 34 40Z', '#4ab8f0', { w: 2 })
    + F('M26 30Q14 14 8 18Q12 26 26 30ZM38 30Q50 14 56 18Q52 26 38 30Z', '#ffffff', 0.4)
    + S(circ(32, 34, 9.5), '#e0302a') + T(32, 35, 9, '三', '#6a1010') + H(ell(28, 30, 3, 1.8), 0.75),
  // Blood pill: a hospital bottle of red pills with a medic's cross label.
  moon_pill: S('M25 14H39V20Q50 24 50 34V52Q50 58 44 58H20Q14 58 14 52V34Q14 24 25 20Z', '#d8eef8')
    + S(rect(23, 5, 18, 10, 2.5), '#a8703a', { w: 2 })
    + S(circ(22, 50, 5), '#c8202a', { w: 1.6 }) + S(circ(32, 51, 5), '#c8202a', { w: 1.6 }) + S(circ(42, 50, 5), '#c8202a', { w: 1.6 }) + S(circ(27, 43, 5), '#e0303a', { w: 1.6 }) + S(circ(37, 43, 5), '#e0303a', { w: 1.6 })
    + S(rect(20, 26, 24, 12, 2), '#ffffff', { w: 1.6, flat: true }) + F('M30 28h4v3h3v4h-3v3h-4v-3h-3v-4h3Z', '#d8202a')
    + H('M18 30Q18 24 24 22V46H18Z', 0.45),
  // Curry pill: the yellow pill, steaming hot on a small dish.
  shadow_pill: S(ell(32, 48, 26, 9), '#eef0f6') + F(ell(32, 47, 18, 5), '#c8cede')
    + S(circ(32, 36, 13), '#f2c21a') + T(32, 37, 11, '二', '#8a5a0a') + H(ell(26, 30, 4.4, 2.6), 0.75)
    + L('M20 18Q16 12 20 6M32 16Q28 10 32 4M44 18Q40 12 44 6', '#ff8a3a', 2.6),

  /* ---------------------------------------------------------------- weapons */
  // Academy bokken: a pale pine practice sword with a round wooden guard.
  training_kunai: ROT(45, 32, 32,
    S('M28 8Q32 1 36 8V38H28Z', '#e0b070') + L('M32 8V36', dk('#e0b070', 0.25), 1.6) + H('M29.5 9H31V36H29.5Z', 0.6)
    + S(ell(32, 40, 10, 3.6), '#8a5a2e', { w: 2.2 }) + S('M28.5 43H35.5V61H28.5Z', '#c89050') + L('M28.5 47L35.5 50M28.5 53L35.5 56', '#8a5a2e', 1.6)),
  // Anbu ninjato: straight steel blade, square black guard, grey wrapped grip.
  iron_wakizashi: ROT(45, 32, 32,
    S('M28 10L32 1L36 10V37H28Z', '#cfd7e2') + F('M32 2V37H36V10Z', dk('#cfd7e2', 0.2)) + L('M29.6 10V36', '#ffffff', 1.4)
    + S(rect(22, 37, 20, 5.4, 1), '#2b2f45', { w: 2.2 }) + S('M28.5 42H35.5V61H28.5Z', '#5a6070') + L('M28.5 45L35.5 48M28.5 50L35.5 53M28.5 55L35.5 58', '#2b2f45', 1.6)),
  // Haku's senbon: three needles fanned before a pane of ice mirror.
  senbon: S(poly([14, 18], [34, 6], [56, 14], [56, 38], [36, 50], [14, 42]), '#bfefff', { w: 2 }) + F(poly([14, 18], [34, 6], [30, 30], [14, 42]), '#ffffff', 0.35)
    + ROT(-12, 14, 54, S('M13 54L14.6 6L16.4 6L17 54Z', '#dfe6ee', { w: 1.8 }))
    + ROT(14, 14, 54, S('M13 54L14.6 6L16.4 6L17 54Z', '#dfe6ee', { w: 1.8 }))
    + ROT(40, 14, 54, S('M13 54L14.6 6L16.4 6L17 54Z', '#dfe6ee', { w: 1.8 }))
    + S(circ(15, 54, 4), '#5a6070', { w: 1.8 }) + SP(48, 8, 3.5),
  // Three-Pronged Kunai: the Yellow Flash's marked kunai, three blades and a seal tag on the grip.
  crystal_kunai: ROT(45, 32, 32,
    S('M30 31L14 9L25 31Z', '#c2cad6') + S('M34 31L50 9L39 31Z', '#c2cad6')
    + S('M32 4L37 18L35 31H29L27 18Z', '#d7dee8') + F('M32 5L32 30', '#ffffff', 0.7) + S('M22 30H42V34H22Z', '#ffcf3f', { w: 2 })
    + S('M29 34H35V52H29Z', '#2b2f45') + L('M29 38L35 41M29 43L35 46M29 48L35 51', '#4b5070', 1.2)
    + S(circ(32, 56, 4), '#ffcf3f', { w: 2 }) + F(circ(32, 56, 1.6), ART_INK))
    + S('M6 36L18 32L20 42L8 46Z', '#f6ecc8', { w: 1.6 }) + T(13, 39, 6, '飛', '#c0392b'),
  // Chakra trench knives: knuckle-ring blade with wind chakra stretching the edge.
  chakra_blade: AURA(40, 24, 24, '#8ae8ff')
    + ROT(45, 32, 32, F('M25 34Q24 14 32 -2Q40 14 39 34Z', '#a8f0ff', 0.55)
    + S('M27 33Q28 18 32 4Q36 18 37 33Z', '#d7dee8') + F('M32 5Q35 18 36 32H32Z', dk('#d7dee8', 0.2)) + L('M30 30Q30 18 32 8', '#ffffff', 1.2)
    + S(rect(23, 32, 18, 5, 1.5), '#4a4f62', { w: 2.2 }) + S('M28.5 37H35.5V56H28.5Z', '#3a3040') + L('M28.5 42H35.5M28.5 47H35.5M28.5 52H35.5', '#6a6080', 1.4)
    + RING('M36 38Q47 40 46 47Q45 55 36 55', '#8a96a4', 3.2))
    + SP(54, 8, 3.5) + SP(44, 4, 2.4),
  // Executioner's Cleaver: the Demon of the Mist's great blade, round hole and bite notch.
  fog_cleaver: ROT(-40, 32, 32,
    S('M24 4H46V40Q46 44 42 44H24Z', '#c6ced8') + F('M24 4H28V44H24Z', '#ffffff', 0.4)
    + S(circ(37, 13, 5), '#232838', { w: 2 }) + S('M46 24Q40 27 46 31Z', '#232838', { w: 1.6 })
    + S('M28 44H36V60H28Z', '#4a3a5e') + L('M28 48L36 51M28 53L36 56', '#7a6896', 1.4) + S('M22 42H40V46H22Z', '#2b2f45', { w: 2 }))
    + SP(52, 10, 3.5),
  // White Light Tanto: a short blade glowing white, leaving a trail of light.
  ashen_fang: AURA(36, 28, 26, '#e8f4ff')
    + F('M4 46Q20 12 56 4Q30 18 10 52Z', '#ffffff', 0.35)
    + ROT(45, 32, 34, S('M28 30L32 6L36 30Z', '#f4f8ff') + L('M32 8V29', '#bfe0ff', 1.6)
    + S(circ(32, 32, 4), '#c8ced8', { w: 2 }) + S('M29 35H35V56H29Z', '#2b2f45') + L('M29 39L35 42M29 44L35 47M29 49L35 52', '#e8edf3', 1.4))
    + SP(52, 8, 4) + SP(46, 20, 2.4),

  /* ---------------------------------------------------------------- armor */
  // Chunin flak vest: green, high collar, scroll pockets, red swirl on the shoulder.
  flak_vest: S('M18 8L26 6Q32 14 38 6L46 8L54 18L50 30V56H14V30L10 18Z', '#6f8f4a')
    + S('M26 6Q32 16 38 6L40 10Q32 22 24 10Z', '#5a7a3a', { w: 2 }) + L('M32 18V56', dk('#6f8f4a', 0.45), 2)
    + S(rect(17, 30, 12, 14, 2), '#7fa058', { w: 1.8 }) + S(rect(35, 30, 12, 14, 2), '#7fa058', { w: 1.8 })
    + F('M19 32h8v4h-8ZM37 32h8v4h-8Z', '#e8dcb0') + L('M17 48H47', dk('#6f8f4a', 0.4), 1.6)
    + S(circ(47, 16, 4), '#d8302a', { w: 1.6 }) + L('M47 16Q49 14 47 13Q44 13 45 17Q47 20 50 17', '#ffffff', 1.2)
    + H('M16 22L20 12L24 12L20 26Z', 0.35),
  // Anbu mesh armor: grey chest plate strapped over black chain mesh.
  chakra_mesh: S('M16 8H48L56 20L50 26V58H14V26L8 20Z', '#363a50')
    + L('M16 30L48 58M14 42L34 58M24 26L50 48M36 26L50 36M48 30L16 58M50 42L30 58M40 26L14 48M28 26L14 36', '#6a7090', 1.2)
    + S('M18 12H46Q50 26 46 42Q32 48 18 42Q14 26 18 12Z', '#c8d0dc')
    + L('M18 26H46M20 36H44', dk('#c8d0dc', 0.3), 1.6) + F(rect(29, 12, 6, 30), dk('#c8d0dc', 0.15))
    + H('M20 14H28Q24 26 21 36Q18 24 20 14Z', 0.5) + S(circ(12, 21, 3), '#d8302a', { w: 1.4 }),
  // Land of Snow garb: white fur-trimmed coat with an icy blue body.
  frost_garb: S('M20 10L44 10L56 24L50 30V58H14V30L8 24Z', '#9fd8f0')
    + S('M18 6Q24 2 32 8Q40 2 46 6Q50 12 44 16Q38 14 32 18Q26 14 20 16Q14 12 18 6Z', '#ffffff', { w: 2 })
    + S('M12 52Q16 48 20 52Q24 48 28 52Q32 48 36 52Q40 48 44 52Q48 48 52 52V58H12Z', '#ffffff', { w: 2 })
    + L('M32 18V50', dk('#9fd8f0', 0.4), 2) + F('M30 26h4v4h-4ZM30 36h4v4h-4Z', '#3a6a8a')
    + H('M18 20L22 16L24 18L18 32Z', 0.5) + SP(52, 40, 3) + SP(10, 40, 2.4),
  // Toad Sage robe: red haori with yellow rings over a green kimono.
  sage_robe: S('M20 8H44L60 24L52 34L46 28V58H18V28L12 34L4 24Z', '#c83a2a')
    + S('M24 8H40L32 34Z', '#4a9a4a', { w: 2 }) + S(rect(18, 34, 28, 6), '#3a2a2a', { w: 1.8 })
    + L(circ(12, 22, 3.2), '#ffcf3f', 1.8) + L(circ(52, 22, 3.2), '#ffcf3f', 1.8) + L(circ(24, 48, 3.2), '#ffcf3f', 1.8) + L(circ(40, 48, 3.2), '#ffcf3f', 1.8)
    + L('M32 40V58', dk('#c83a2a', 0.4), 1.6) + H('M10 22L20 12H24L14 28Z', 0.35),
  // Nine-Tails chakra cloak: a bubbling orange hood with fox ears and a tail.
  beast_cloak: AURA(32, 34, 30, '#ff8a2a')
    + S('M46 44Q58 40 58 26Q62 40 52 52Z', '#ff7a1a', { w: 2 })
    + S('M16 14L14 2L24 10Q32 6 40 10L50 2L48 14Q54 22 52 34Q54 46 50 58Q44 54 40 58Q36 54 32 58Q28 54 24 58Q20 54 14 58Q10 46 12 34Q10 22 16 14Z', '#ff7a1a')
    + S(ell(32, 24, 10, 9), '#3a1408', { w: 2 }) + F('M26 22L30 24L26 25ZM38 22L34 24L38 25Z', '#ffe36a')
    + L('M28 40Q32 36 36 40Q36 46 30 46Q26 44 30 41', '#3a1408', 2)
    + S(circ(10, 20, 2.6), '#ffa04a', { w: 1.4 }) + S(circ(54, 12, 2), '#ffa04a', { w: 1.2 }) + H('M18 18Q16 30 18 44Q14 30 18 18Z', 0.45),
  // Hokage mantle: a white cape from the back, red flames, "fire" on it.
  storm_mantle: S('M22 6H42Q48 8 50 14L56 58H8L14 14Q16 8 22 6Z', '#f4f2f0')
    + S('M8 58L10 44Q14 50 16 44Q20 50 22 42Q26 50 30 42Q34 50 38 42Q40 50 44 44Q48 50 52 44L56 58Z', '#d8302a', { w: 2 })
    + F('M14 58L16 50Q20 54 22 48Q26 54 30 48Q34 54 38 48Q42 54 46 50L50 58Z', '#ff8a3a')
    + S(rect(20, 4, 24, 6, 3), '#e0dcd6', { w: 2 }) + T(32, 28, 16, '火', '#c0392b')
    + H('M18 14Q16 26 14 40L18 40Q20 26 22 12Z', 0.5),
  // Hiruko plating: the hunchback puppet's segmented shell and its scorpion tail.
  puppet_plating: L('M48 44Q60 34 54 18Q50 8 40 8', ART_INK, 7) + L('M48 44Q60 34 54 18Q50 8 40 8', '#6a5a7a', 4.4)
    + S('M40 8L30 2L32 12Z', '#a06ad8', { w: 1.8 })
    + S('M6 52Q6 22 30 18Q50 18 52 40Q54 52 48 56H10Q6 56 6 52Z', '#5a4a6a')
    + L('M10 40Q30 30 50 40M8 48Q30 40 52 50M24 20Q20 36 22 54M38 20Q42 36 40 56', dk('#5a4a6a', 0.45), 1.8)
    + H('M12 36Q16 24 28 21Q18 28 14 40Z', 0.4) + F(circ(30, 28, 1.6), '#c8b8d8') + F(circ(18, 44, 1.6), '#c8b8d8') + F(circ(44, 46, 1.6), '#c8b8d8'),
  // Leaf Headband: blue cloth, steel plate with the leaf symbol.
  shinobi_headband: S('M4 36Q8 26 18 28L46 28Q56 26 60 36Q54 34 46 40H18Q10 34 4 36Z', '#2f4fb8')
    + S('M14 22H50Q54 22 54 26V40Q54 44 50 44H14Q10 44 10 40V26Q10 22 14 22Z', '#c9d3df')
    + F('M14 24H50V28H14Z', '#ffffff', 0.45) + S('M4 38L2 52L8 48L10 40Z', '#2f4fb8', { w: 1.8 })
    + L('M24 33Q28 26 34 28Q41 30 38 36Q35 41 30 37Q27 34 31 32', '#3b4255', 2.4) + L('M38 36L44 40', '#3b4255', 2.4)
    + F(circ(14, 33, 1.4), '#7c8698') + F(circ(50, 33, 1.4), '#7c8698'),

  /* ---------------------------------------------------------------- accessories */
  // Jade amulet: a green magatama on a cord with a gold bead.
  jade_amulet: L('M14 4Q20 22 30 30M50 4Q44 22 34 30', '#7a4a2a', 2.4)
    + S(circ(32, 30, 3.4), '#ffcf3f', { w: 1.6 })
    + S('M36 32A13 13 0 0 1 42 56Q30 60 18 54Q28 52 28 46Q22 36 36 32Z', '#3fd17a')
    + F(circ(37, 42, 3), ART_INK) + H('M30 38Q34 34 40 35Q34 37 32 42Z', 0.6) + SP(52, 32, 3),
  // Fang Over Fang charm: two crossed fangs on a red cord with red marks.
  wolf_fang: L('M8 6Q32 30 56 6', '#c8302a', 2.6)
    + ROT(-22, 26, 34, S('M21 20H31Q32 40 26 56Q20 40 21 20Z', '#f4ecd8') + F('M24 30L28 33L24 36Z', '#d83a2a') + H('M23 22Q24 34 25 44Q22 34 23 22Z', 0.7))
    + ROT(22, 38, 34, S('M33 20H43Q44 40 38 56Q32 40 33 20Z', '#ece2cc') + F('M40 30L36 33L40 36Z', '#d83a2a'))
    + S(rect(24, 16, 16, 7, 3), '#8a5a2e', { w: 2 }),
  // Stone golem heart: a carved stone heart cracked with molten light.
  golem_heart: AURA(32, 34, 30, '#ff8a3a')
    + S('M32 56Q8 40 8 24Q8 10 20 10Q28 10 32 18Q36 10 44 10Q56 10 56 24Q56 40 32 56Z', '#8a8278')
    + L('M32 18L28 28L34 34L30 44M28 28L18 26M34 34L44 30L48 22', '#3a2010', 3.6) + L('M32 18L28 28L34 34L30 44M28 28L18 26M34 34L44 30L48 22', '#ffb040', 1.8)
    + F('M40 44Q50 36 52 26Q54 38 42 48Z', dk('#8a8278', 0.3)) + H('M14 20Q16 14 22 14Q16 18 16 26Z', 0.5),
  // Kyuubi tail charm: a bright orange tail tied with red thread and a tassel.
  fox_tail_charm: AURA(36, 28, 24, '#ffb04a')
    + S('M20 46Q18 30 30 20Q40 12 44 6Q56 8 56 20Q54 34 40 42Q30 48 20 46Z', '#ff8a1a')
    + S('M44 6Q56 8 56 20Q50 18 46 14Q42 10 44 6Z', '#fff4e0', { w: 2 }) + L('M26 40Q34 32 42 22', dk('#ff8a1a', 0.35), 1.6)
    + S(rect(14, 42, 10, 6, 2), '#d8202a', { w: 2 }) + L('M18 48L14 58M20 48L20 58M22 48L24 58', '#d8202a', 2)
    + H('M24 36Q26 26 34 20Q28 28 26 36Z', 0.5),
  // Uzumaki seal tag: a paper talisman with the red spiral script.
  sealing_talisman: ROT(-12, 32, 32,
    S(rect(20, 4, 24, 56, 1.5), '#f6ecc8') + L(rect(23, 7, 18, 50), '#c0392b', 1.4)
    + L('M32 24Q36 24 36 28Q36 32 31 32Q27 32 27 27Q27 21 33 21Q39 21 39 28Q39 35 32 35', '#c0392b', 2.2)
    + T(32, 46, 10, '封', '#2a2438') + F('M20 4H44V9H20Z', '#c8b88a', 0.5)),

  /* ---------------------------------------------------------------- chests */
  // Gama-chan: Naruto's fat green frog wallet.
  herb_pouch: L('M14 26Q8 10 24 8', '#c8302a', 2.4)
    + S('M8 40Q8 22 32 22Q56 22 56 40Q56 56 32 56Q8 56 8 40Z', '#5ab84a')
    + S(circ(20, 22, 7), '#5ab84a', { w: 2 }) + S(circ(44, 22, 7), '#5ab84a', { w: 2 })
    + S(circ(20, 21, 4), '#ffffff', { w: 1.6, flat: true }) + S(circ(44, 21, 4), '#ffffff', { w: 1.6, flat: true }) + F(circ(21, 21, 2), ART_INK) + F(circ(43, 21, 2), ART_INK)
    + L('M14 38Q32 46 50 38', ART_INK, 2.2) + L('M18 40L19 43M24 42L25 45M30 43L30 46M36 43L36 46M42 42L41 45M46 40L45 43', '#ffcf3f', 1.4)
    + H(ell(16, 32, 4, 2.4), 0.5),
  // Messenger hawk nest: twig nest with two eggs and a tied message scroll.
  bird_nest: S(ell(26, 30, 8, 10), '#f4f0e4', { w: 2 }) + S(ell(40, 32, 7, 9), '#d8e8f0', { w: 2 }) + F(circ(42, 30, 1.4), '#7a8aa0')
    + S('M4 36Q6 52 32 54Q58 52 60 36Q48 42 32 42Q16 42 4 36Z', '#9a6a3a')
    + L('M6 40Q20 48 40 46M10 46Q30 52 54 42M8 38L20 50M52 38L40 50M28 42L34 54', dk('#9a6a3a', 0.45), 1.6)
    + ROT(-20, 50, 24, S(rect(44, 18, 14, 8, 3), '#f6ecc8', { w: 1.8 }) + F('M50 18H52V26H50Z', '#d8302a'))
    + H(ell(23, 25, 2, 3), 0.7),
  // Forbidden scroll: the huge Scroll of Seals, tied shut.
  sealed_scroll: ROT(-20, 32, 32,
    S(rect(10, 18, 44, 28, 3), '#f2e2b8') + S(rect(6, 14, 8, 36, 3), '#3a2a4a', { w: 2 }) + S(rect(50, 14, 8, 36, 3), '#3a2a4a', { w: 2 })
    + L('M14 22H50M14 42H50', dk('#f2e2b8', 0.25), 1.4) + T(32, 32, 14, '封', '#2a2438')
    + S(rect(38, 16, 5, 32, 1), '#c8302a', { w: 1.8 }) + H('M8 16H10V48H8Z', 0.35) + H('M16 20H48V22H16Z', 0.5)),

  /* ---------------------------------------------------------------- trade goods */
  // Kunai supply crate: pine planks, X brace, a kunai stencil.
  pine_crate: S('M8 22L32 12L56 22V48L32 58L8 48Z', '#d8b27a') + S('M8 22L32 32L56 22L32 12Z', '#ecc88e', { w: 2 })
    + L('M32 32V58', ART_INK, 2.2) + L('M8 22L32 32', ART_INK, 1.8)
    + L('M10 30L30 40M10 38L30 48M34 40L54 30M34 48L54 38', dk('#d8b27a', 0.4), 1.4)
    + ROT(-28, 44, 42, F('M44 32L47 40H45V50H43V40H41Z', '#3a3040') + L(circ(44, 52, 1.8), '#3a3040', 1.2)) + H('M14 22L32 15L36 17L18 24Z', 0.4),
  // Cedar toolbox: a red toolbox with kunai and a scroll poking out.
  cedar_toolbox: L('M22 22V12H42V22', ART_INK, 5) + L('M22 22V12H42V22', '#8a96a4', 2.8)
    + S('M20 22L26 6L28 7L24 24Z', '#c9d1dc', { w: 1.8 }) + S('M40 24L46 8L48 9L44 24Z', '#c9d1dc', { w: 1.8 })
    + S(rect(30, 10, 7, 16, 2), '#f6ecc8', { w: 1.8 })
    + S(rect(6, 24, 52, 30, 3), '#c8703e') + S(rect(6, 24, 52, 7, 2), '#a8582e', { w: 2 })
    + L('M10 40H54', dk('#c8703e', 0.4), 1.6) + S(rect(28, 34, 8, 6, 1), '#ffcf3f', { w: 1.6 }) + H('M10 32H30V34H10Z', 0.4),
  // Crow puppet: the three-eyed hooded puppet.
  bamboo_puppet: S('M10 58Q8 30 20 14Q32 4 44 14Q56 30 54 58Z', '#3a3048')
    + S('M20 26Q20 16 32 16Q44 16 44 26V40Q44 50 32 50Q20 50 20 40Z', '#d8c8a8')
    + F('M20 18Q32 8 44 18L42 22Q32 14 22 22Z', '#2a2236')
    + S(ell(26, 32, 3.4, 2.8), '#f4f0e4', { w: 1.6 }) + S(ell(38, 32, 3.4, 2.8), '#f4f0e4', { w: 1.6 }) + S(ell(32, 24, 2.6, 2.2), '#f4f0e4', { w: 1.6 })
    + F(circ(26, 32, 1.4), '#7a2aa8') + F(circ(38, 32, 1.4), '#7a2aa8') + F(circ(32, 24, 1.2), '#7a2aa8')
    + L('M24 42H40M24 42V48M40 42V48', ART_INK, 1.6) + L('M22 36L24 44M42 36L40 44', '#7a2aa8', 1.6),
  // Hunter-nin mask: white mask, red curls and the Hidden Mist sign.
  mist_mask: S('M32 4Q54 4 54 28Q54 52 32 60Q10 52 10 28Q10 4 32 4Z', '#f4f2f0')
    + S(ell(23, 30, 5, 3), ART_INK, { w: 1.6, flat: true }) + S(ell(41, 30, 5, 3), ART_INK, { w: 1.6, flat: true })
    + L('M18 38Q22 44 18 50M46 38Q42 44 46 50M14 22Q18 18 24 20M50 22Q46 18 40 20', '#d8302a', 2.2)
    + L('M24 12Q26 9 28 12M28 13Q30 10 32 13M32 13Q34 10 36 13M36 12Q38 9 40 12', '#3a4a62', 1.8)
    + F('M44 36Q50 44 40 56Q48 44 44 36Z', dk('#f4f2f0', 0.25)) + H('M16 18Q20 8 30 7Q20 12 18 24Z', 0.6),
  // Ironwood beam: a squared dark beam, iron end caps, a Leaf brand on the side.
  ironwood_beam: ROT(-28, 32, 32,
    S('M8 26L14 20H58L52 26Z', '#7a6a62') + S('M8 26H52V44H8Z', '#4e403c') + S('M52 26L58 20V38L52 44Z', '#3a302c')
    + S('M4 25H12V45H4Z', '#8a96a4', { w: 2 }) + S('M44 25H52V45H44Z', '#8a96a4', { w: 2 })
    + L('M14 32H42M16 38H40', dk('#4e403c', 0.45), 1.4))
    + LEAF('translate(9 3)', '#e8c070', 2.2) + H('M14 22L20 16L40 8L36 14Z', 0.3),
  // Blossom lantern: a pink paper lantern with a cherry blossom, glowing.
  blossom_lantern: AURA(32, 34, 28, '#ffd27a')
    + L('M32 2V8', ART_INK, 2) + S(rect(22, 8, 20, 6, 2), '#2a2438', { w: 1.8 })
    + S('M22 14Q8 20 8 34Q8 48 22 54H42Q56 48 56 34Q56 20 42 14Z', '#ff9ec4')
    + L('M10 26H54M8 34H56M10 42H54', dk('#ff9ec4', 0.3), 1.4)
    + S(rect(22, 54, 20, 6, 2), '#2a2438', { w: 1.8 }) + BLOSSOM(32, 34, 8, '#ffffff')
    + H('M18 18Q12 26 13 38Q16 26 22 18Z', 0.5),
  // Spirit oak totem: carved pole, a Senju face over the Uchiha fan.
  oak_totem: S('M18 10H46V58H18Z', '#8a6a3a') + S('M10 8H54L50 14H14Z', '#6b5634', { w: 2 })
    + S(ell(26, 22, 3.6, 2.6), '#7dffb0', { w: 1.6, flat: true }) + S(ell(38, 22, 3.6, 2.6), '#7dffb0', { w: 1.6, flat: true })
    + L('M26 30H38', ART_INK, 2.4) + L('M18 34H46', dk('#8a6a3a', 0.5), 2)
    + S('M32 38A8 8 0 0 1 32 54Z', '#f4f2f0', { w: 1.8 }) + S('M32 38A8 8 0 0 0 32 54Z', '#d8302a', { w: 1.8 }) + S('M31 54H33V58H31Z', '#e8e0d0', { w: 1.4 })
    + H('M20 12H23V56H20Z', 0.35),
  // Will of Fire shrine: a little shrine sheltering a flame.
  heart_shrine: AURA(32, 38, 22, '#ffb040')
    + S('M4 20L32 6L60 20L54 24H10Z', '#3a2a2a') + S(rect(10, 24, 44, 4), '#c8302a', { w: 1.8 })
    + S(rect(14, 28, 5, 26), '#c8302a', { w: 1.8 }) + S(rect(45, 28, 5, 26), '#c8302a', { w: 1.8 })
    + S('M32 50Q22 48 24 40Q26 34 30 30Q30 36 33 36Q32 30 36 26Q40 34 40 40Q40 48 32 50Z', '#ff6a1a', { w: 2 })
    + F('M32 48Q28 46 29 42Q31 38 32 36Q34 40 35 42Q36 46 32 48Z', '#ffe36a')
    + S(rect(8, 54, 48, 5, 1.5), '#8a8278', { w: 1.8 }) + H('M10 18L32 8L34 9L14 20Z', 0.3),
  // Jade: a faceted green gem.
  jade: S(poly([20, 10], [44, 10], [56, 24], [32, 56], [8, 24]), '#3fd17a')
    + F(poly([20, 10], [44, 10], [38, 24], [26, 24]), '#ffffff', 0.35) + F(poly([8, 24], [26, 24], [32, 56]), '#ffffff', 0.15)
    + F(poly([38, 24], [56, 24], [32, 56]), dk('#3fd17a', 0.35)) + L('M8 24H56M26 24L32 56L38 24M20 10L26 24M44 10L38 24', dk('#3fd17a', 0.5), 1.2)
    + SP(18, 16, 4) + SP(50, 44, 2.6),
});
})();
