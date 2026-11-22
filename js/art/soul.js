'use strict';
/* Item art — Soul City (Bleach) + the Rift. See js/item-art.js for the helpers and style rules. */
(() => {
const { S, F, L, H, SP, AURA, T, G, GL, lt, dk, mix, circ, ell, rect, poly, star, ROT, TR } = ARTK;
// ring with a real hole (inner sub-path wound the other way)
const ring = (cx, cy, rx, ry, ix, iy) => `M${cx - rx} ${cy}a${rx} ${ry} 0 1 0 ${rx * 2} 0a${rx} ${ry} 0 1 0 ${-rx * 2} 0ZM${cx - ix} ${cy}a${ix} ${iy} 0 1 1 ${ix * 2} 0a${ix} ${iy} 0 1 1 ${-ix * 2} 0Z`;
// ingot bar in 3/4 view: front x 8..44, top back to 52, y 24..50
const bar = (c) => S(poly([12, 34], [40, 34], [48, 24], [20, 24]), lt(c, 0.22), { w: 2.2 })
  + S(poly([44, 50], [40, 34], [48, 24], [52, 40]), dk(c, 0.3), { w: 2.2 })
  + S(poly([8, 50], [44, 50], [40, 34], [12, 34]), c, { w: 2.2 })
  + H('M15 33L22 26H40L37 29H20Z', 0.45);
const quincy = (x, y, r, c) => S(star(x, y, r, r * 0.42, 5), c, { w: 1.6, flat: true });
const petal = (x, y, a) => ROT(a, x, y, S(ell(x, y, 3.4, 2), '#ffb3d4', { w: 1.3, flat: true }));
const RIFT = '#e03ccf';
// scale a group around the grid centre, then nudge it (placement only)
const FIT = (s, dx, dy, m) => TR(`translate(${+(32 - 32 * s + dx).toFixed(2)} ${+(32 - 32 * s + dy).toFixed(2)}) scale(${s})`, m);
// every ingot shares one bar, enlarged to the house size
const ING = (m) => TR('translate(-2.5 -9) scale(1.15)', m);

Object.assign(ART, {
  /* ---------------------------------------------------------------- souls & spirit */
  // Soul Fragment: a cracked pale-blue soul shard with a bite taken out of it.
  soul_fragment: AURA(32, 32, 28, '#8fd8ff')
    + S('M30 5L47 21Q38 24 42 33L39 54L22 59L15 31Z', '#a9e2ff')
    + F('M30 5L47 21Q38 24 42 33L39 54L30 38Z', dk('#a9e2ff', 0.2), 0.6)
    + L('M24 22L30 32L26 42M30 32L36 30', dk('#a9e2ff', 0.5), 1.6)
    + H('M28 10L19 30L23 34Z', 0.7) + SP(52, 40, 3.5) + SP(12, 14, 3) + SP(50, 10, 2.4, '#d8f4ff'),
  // Hitodama Wisp: a teal ghost-fire with a curling tail.
  wisp_flame: AURA(34, 40, 26, '#62f0d0')
    + S('M36 56Q20 56 20 41Q20 30 29 25Q18 21 14 7Q28 12 38 23Q52 29 52 41Q52 56 36 56Z', '#3ee0c0')
    + F('M52 41Q52 56 36 56Q47 51 47 40Q47 33 42 28Q52 32 52 41Z', dk('#3ee0c0', 0.3))
    + S(ell(36, 43, 8, 8), '#c8fff0', { w: 1.6, flat: true }) + F(ell(36, 44, 4, 4.5), '#ffffff')
    + H('M24 36Q26 28 32 26Q27 32 27 38Z', 0.6) + SP(52, 16, 3.5) + SP(10, 48, 2.6),
  // Reiryoku Core: a blue orb of condensed spirit energy in two kido rings.
  spirit_core: AURA(32, 32, 30, '#4aa6ff')
    + ROT(-28, 32, 32, L(ell(32, 32, 27, 9), ART_INK, 5.2) + L(ell(32, 32, 27, 9), '#ffe08a', 2.4))
    + S(circ(32, 32, 15), '#3f8ff0')
    + F('M47 32A15 15 0 0 1 32 47A12 12 0 0 0 47 32Z', dk('#3f8ff0', 0.3))
    + F(circ(35, 35, 8), '#9ad6ff', 0.8) + F(circ(35, 35, 3.6), '#ffffff')
    + ROT(30, 32, 32, L('M5 32A27 9 0 0 0 59 32', ART_INK, 5.2) + L('M5 32A27 9 0 0 0 59 32', '#bfe8ff', 2.4))
    + H(ell(26, 25, 5.5, 3.2), 0.75) + SP(54, 10, 3.5),
  // Husk Mask Shard: the broken top of a white Husk mask, one eye hole, black war stripe.
  husk_mask: FIT(1.1, 0, 1.5, S('M10 32Q8 10 32 8Q48 8 54 20L46 24L50 32L40 35L42 44L30 41L23 51L14 45Q10 40 10 32Z', '#efe9dc')
    + F('M23 51L14 45Q20 46 24 42L30 38L38 33L46 28L50 32L40 35L42 44L30 41Z', dk('#efe9dc', 0.22))
    + F('M26 9L32 8L30 41L24 43Z', '#2a2230')
    + F('M15 28Q16 22 23 22Q30 23 29 28Q27 32 21 32Q15 32 15 28Z', ART_INK)
    + L('M40 35L36 28L41 22M30 41L33 34', dk('#efe9dc', 0.5), 1.4)
    + H('M16 22Q20 12 30 11Q22 15 19 24Z', 0.6)),
  // Grave Dust: a mound of grey dust with a Rukongai sotoba grave tablet stuck in it.
  grave_dust: S('M34 12L38 6L42 12V46H34Z', '#c9a26a', { w: 2 })
    + F('M34 18H42V20H34ZM34 24H42V26H34Z', dk('#c9a26a', 0.4)) + L('M38 30V42', dk('#c9a26a', 0.45), 1.6)
    + S('M5 54Q8 42 20 42Q28 34 38 40Q52 38 59 54Z', '#9b968e')
    + F('M38 40Q52 38 59 54H40Q46 46 38 40Z', dk('#9b968e', 0.3))
    + H('M12 46Q18 42 24 43Q18 45 14 48Z', 0.5)
    + F(circ(14, 34, 1.8), '#bdb8ae') + F(circ(22, 28, 1.4), '#bdb8ae') + F(circ(50, 30, 1.6), '#bdb8ae'),
  // Hueco Mundo Essence: white desert sand in a dark flask under the crescent moon.
  abyssal_essence: S('M48 5A11 11 0 1 0 59 22A8.5 8.5 0 1 1 48 5Z', '#f4efd6', { w: 2 })
    + S('M26 13H38V23Q49 27 49 39Q49 56 32 56Q15 56 15 39Q15 27 26 23Z', '#2e2c52')
    + F('M49 39Q49 56 32 56Q44 51 44 39Q44 30 37 26Q49 29 49 39Z', dk('#2e2c52', 0.4))
    + S('M18 43Q25 38 32 42Q40 47 46 41Q46 53 32 53Q18 53 18 43Z', '#efe9dc', { w: 1.6 })
    + S(rect(24, 6, 16, 8, 2), '#8a6a4a', { w: 2 })
    + H('M20 32Q22 26 27 25Q24 30 23 36Z', 0.55) + SP(10, 12, 3) + SP(56, 34, 2.4),
  // Hell Butterfly Silk: a pale lavender cocoon wound in silk, hanging by a thread.
  phantom_silk: L('M32 4V14', ART_INK, 3.2) + L('M32 4V14', '#e8e0ff', 1.4)
    + L('M24 54Q14 58 8 52Q4 46 10 42', ART_INK, 4) + L('M24 54Q14 58 8 52Q4 46 10 42', '#e8e0ff', 1.8)
    + S('M32 12Q46 16 46 34Q46 54 32 58Q18 54 18 34Q18 16 32 12Z', '#d4c6f2')
    + F('M46 34Q46 54 32 58Q41 50 41 34Q41 21 33 13Q46 18 46 34Z', dk('#d4c6f2', 0.22))
    + L('M19 26Q32 22 45 30M18 36Q32 30 46 40M20 46Q32 40 44 50', dk('#d4c6f2', 0.38), 1.8)
    + H('M23 26Q25 18 31 16Q27 22 26 30Z', 0.65) + SP(52, 14, 3, '#cdb8ff'),
  // Chained Plus Soul: a little ghost still bound by its Chain of Fate, calling its name.
  echo_soul: AURA(30, 32, 28, '#bfe2ff') + FIT(0.96, -3, 0,
    S('M16 30Q16 8 33 8Q50 8 50 30V50L45 45L40 51L35 45L30 51L25 45L20 50L16 44Z', '#d8ecff')
    + F('M50 30V50L45 45L42 48.6V30Q42 16 35 8.2Q50 10 50 30Z', dk('#d8ecff', 0.2))
    + F(ell(27, 25, 3, 4), ART_INK) + F(ell(39, 25, 3, 4), ART_INK) + F(ell(33, 35, 3.4, 4.2), '#3a2a4a')
    + L('M30 40L24 46M24 46L18 52M18 52L12 58', ART_INK, 4.4) + L('M30 40L24 46M18 52L12 58', '#9aa4b8', 2.2)
    + L('M24 46L18 52', '#c8ceda', 2.6)
    + L('M54 22Q58 28 54 34M58 18Q63 28 58 38', '#8fc8ff', 2)
    + H('M20 24Q22 13 32 12Q24 16 23 28Z', 0.6)),
  // Husk Heart: a dark heart that beats where a Husk's hole should be, bone plate on top.
  husk_heart: FIT(0.88, 0, 2.5, S(rect(22, 3, 6, 10, 2), '#7a1a32', { w: 2 }) + S(rect(33, 2, 6, 10, 2), '#7a1a32', { w: 2 })
    + S('M32 56Q7 40 9 23Q11 10 22 10Q30 10 32 18Q34 10 42 10Q53 10 55 23Q57 40 32 56Z', '#b51e3e')
    + F('M55 23Q57 40 32 56Q50 38 50 25Q50 18 46 14Q54 16 55 23Z', dk('#b51e3e', 0.3))
    + L('M22 22Q26 32 22 42M40 18Q38 30 44 38M32 22V34', dk('#b51e3e', 0.45), 1.8)
    + S('M38 12Q48 10 52 18Q50 24 42 22Q38 18 38 12Z', '#efe8da', { w: 1.8 })
    + H('M14 22Q16 14 22 14Q17 18 17 26Z', 0.6)
    + L('M2 34H6L8 30L10 38L12 34', '#ff7a8a', 1.8) + L('M52 46H55L57 42L59 50L62 46', '#ff7a8a', 1.8)),
  // Menos Grande Ivory: two curved bone-white tusks bound with a black cord.
  bone_ivory: S('M12 58Q6 30 30 8Q22 32 24 58Z', '#f2e8cf')
    + S('M30 58Q34 30 56 14Q46 36 42 58Z', '#e8dcbc')
    + F('M18 56Q16 36 26 18Q22 38 23 56Z', dk('#f2e8cf', 0.18)) + F('M36 56Q38 38 52 20Q44 40 41 56Z', dk('#e8dcbc', 0.2))
    + S(rect(10, 47, 34, 6, 2), '#4a3a5a', { w: 2 }) + L('M14 50H40', dk('#4a3a5a', 0.4), 1.4)
    + H('M14 40Q14 26 26 12Q18 28 17 42Z', 0.6) + H('M33 44Q36 30 48 20Q40 32 36 44Z', 0.45),
  // Vasto Lorde Mask Shard: the horned left half of the Sovereign's mask, cracked open.
  sovereign_shard: AURA(30, 32, 28, '#a64aff') + FIT(0.96, 1, 1.5,
    S('M22 20Q10 14 8 3Q16 10 26 12Z', '#e8e0d0', { w: 2 })
    + S('M33 10Q18 10 18 22V38Q18 52 32 57L28 48L34 41L28 33L35 25L29 17Z', '#f4efe6')
    + F('M29 17L35 25L28 33L34 41L28 48L32 57Q27 55 24 51L24 50L25 46L30 41L24 33L31 25L27 18Z', dk('#f4efe6', 0.2))
    + F('M23 12H27V44H23Z', '#c4243a')
    + F('M20 28Q24 24 29 27Q27 31 21 31Z', '#140c1c') + F(circ(25, 28.5, 1.4), '#ffd84a')
    + L('M33 10L29 17L35 25L28 33L34 41L28 48L32 57', '#7a2aff', 1.8)
    + L('M21 46H27M22 50H27', dk('#f4efe6', 0.6), 1.6) + H('M20 22Q21 14 27 12Q22 17 22 26Z', 0.6)) + SP(48, 14, 3.5, '#e0c0ff'),
  // Hell Butterfly Lantern: a red paper chochin lantern with a black Hell Butterfly on it.
  lost_lantern: AURA(28, 36, 26, '#ffa24a') + FIT(0.96, -4, 0.5,
    L('M30 3V10', ART_INK, 2.4)
    + S(rect(22, 9, 16, 6, 2), '#4a3a5a', { w: 2 }) + S(rect(22, 54, 16, 6, 2), '#4a3a5a', { w: 2 })
    + S(ell(30, 35, 17, 20), '#ec6a32')
    + F('M47 35A17 20 0 0 1 30 55A13 17 0 0 0 43 35A13 17 0 0 0 36 16A17 20 0 0 1 47 35Z', dk('#ec6a32', 0.3))
    + L('M15 26Q30 22 45 26M13 35H47M15 44Q30 48 45 44', dk('#ec6a32', 0.4), 1.6)
    + F(ell(30, 35, 7, 12), '#ffd27a', 0.6)
    + H('M18 26Q20 20 26 18Q21 24 20 32Z', 0.55)
    + S('M48 18Q56 8 60 14Q58 22 48 20Z', '#3a2450', { w: 1.8 }) + S('M48 18Q40 8 36 13Q38 21 48 20Z', '#3a2450', { w: 1.8 })
    + S('M48 20Q55 26 52 30Q47 28 48 20Z', '#3a2450', { w: 1.8 }) + S('M48 20Q41 26 44 30Q49 28 48 20Z', '#3a2450', { w: 1.8 })
    + L('M42 13L46 17M54 13L50 17', '#b06aff', 1.4)),

  /* ---------------------------------------------------------------------- ores */
  // Reishi Ore: grey rock with cyan spirit-particle crystals growing out of it.
  spirit_ore: S('M8 46Q6 34 14 27Q22 18 32 20Q48 18 54 29Q60 41 52 50Q44 57 30 56Q14 57 8 46Z', '#646b80')
    + F('M52 50Q44 57 30 56Q40 50 46 40Q52 34 54 29Q60 41 52 50Z', dk('#646b80', 0.3))
    + S(poly([16, 40], [21, 26], [27, 39]), '#5ad4ff', { w: 2 }) + S(poly([28, 34], [35, 10], [43, 33]), '#5ad4ff', { w: 2 })
    + S(poly([40, 46], [46, 34], [51, 46]), '#5ad4ff', { w: 2 })
    + F(poly([21, 26], [21, 40], [16, 40]), '#c8f2ff', 0.8) + F(poly([35, 10], [35, 34], [28, 34]), '#c8f2ff', 0.8) + F(poly([46, 34], [46, 46], [40, 46]), '#c8f2ff', 0.8)
    + H('M12 34Q16 26 24 23Q18 29 15 37Z', 0.45)
    + F(circ(14, 48, 1.6), '#8fe6ff') + F(circ(30, 48, 1.4), '#8fe6ff') + SP(52, 16, 3.5, '#bff0ff') + SP(10, 20, 2.6, '#bff0ff'),
  // Ginrei Silver: a heap of shining silver nuggets, a Quincy cross glinting on one.
  silver_reishi: S('M8 46Q6 36 16 34Q26 32 28 41Q30 51 19 53Q10 53 8 46Z', '#c4ccd8')
    + S('M38 47Q38 38 48 38Q57 39 57 48Q56 56 47 56Q38 55 38 47Z', '#b8c0ce')
    + S('M20 30Q21 14 35 14Q49 15 49 30Q49 44 35 45Q21 45 20 30Z', '#d6dce6')
    + F('M49 30Q49 44 35 45Q44 38 45 26Q46 18 42 15Q49 18 49 30Z', dk('#d6dce6', 0.3))
    + F(circ(16, 46, 2), dk('#c4ccd8', 0.35)) + F(circ(50, 50, 1.8), dk('#b8c0ce', 0.35))
    + quincy(33, 30, 6, '#7fd4ff') + H(ell(28, 21, 5, 2.6), 0.8) + H(ell(14, 38, 3, 1.6), 0.7) + SP(54, 14, 4) + SP(10, 22, 2.6),
  // Hyorinmaru Ice: tall hexagonal ice prisms rising from fresh snow.
  frost_crystal: AURA(32, 32, 26, '#9ae4ff') + FIT(0.96, 0, -1, S(poly([16, 52], [12, 30], [18, 22], [24, 30], [23, 52]), '#8ad4f4', { w: 2.2 })
    + S(poly([40, 52], [40, 32], [47, 25], [53, 33], [49, 52]), '#8ad4f4', { w: 2.2 })
    + S(poly([25, 54], [23, 20], [32, 5], [41, 20], [39, 54]), '#a6e2fa')
    + F(poly([32, 5], [41, 20], [39, 54], [32, 54], [32, 20]), dk('#a6e2fa', 0.2), 0.7)
    + L('M32 20V52', '#ffffff', 1.4, 0.7)
    + S('M6 54Q18 47 32 52Q46 47 58 54Q50 60 32 60Q14 60 6 54Z', '#f0f9ff', { w: 2 })
    + H('M25 22L31 9L27 30Z', 0.6)) + SP(54, 12, 4) + SP(10, 14, 3),
  // Sekkiseki Stone: a cut block of the Seireitei's pale spirit-blocking wall stone.
  void_stone: S(poly([32, 8], [56, 20], [32, 32], [8, 20]), '#ecebe4', { w: 2.2 })
    + S(poly([8, 20], [32, 32], [32, 58], [8, 46]), '#cbc6ba', { w: 2.2 })
    + S(poly([32, 32], [56, 20], [56, 46], [32, 58]), '#a8a294', { w: 2.2 })
    + L('M8 33L32 45M20 26V52M32 45L56 33M44 26V39M44 39V52', dk('#a8a294', 0.35), 1.6)
    + F(poly([50, 17], [56, 20], [52, 24]), '#7a7468')
    + H('M16 20L32 12L44 18L32 15Z', 0.6)
    + S(poly([40, 30], [48, 26], [48, 42], [40, 46]), '#f2e4bc', { w: 1.8 }) + L('M44 31V41', '#c4243a', 1.8) + F(circ(44, 36, 1.8), '#c4243a')
    + F(poly([32, 58], [56, 46], [56, 41], [32, 53]), dk('#a8a294', 0.25), 0.7),
  // Black Iron: a jagged black ore lump with ember-orange glints from the forges.
  black_iron: S(poly([6, 52], [11, 37], [21, 31], [25, 17], [36, 10], [45, 21], [53, 25], [59, 42], [54, 55], [30, 58]), '#363642')
    + F(poly([36, 10], [45, 21], [53, 25], [59, 42], [54, 55], [38, 40]), dk('#363642', 0.35))
    + L('M21 31L32 36L38 40L30 58M25 17L32 36', lt('#363642', 0.35), 1.6)
    + F(poly([15, 44], [19, 40], [20, 46]), '#ff8a3a') + F(poly([40, 30], [44, 26], [45, 32]), '#ff8a3a') + F(poly([46, 48], [50, 45], [50, 50]), '#ffb060')
    + H(poly([27, 19], [35, 13], [30, 26]), 0.45),
  // Reiokyu Starsteel: a star-flecked blue meteorite falling from the Royal Palace's sky.
  starsteel: FIT(1, -2, 1, F('M60 4L36 26L28 34L42 34L60 10Z', '#ffe9a0', 0.55) + F('M58 12L38 36L46 36Z', '#ffffff', 0.5)
    + S('M10 40Q10 26 24 24Q38 22 42 36Q44 52 28 56Q12 56 10 40Z', '#4a5285')
    + F('M42 36Q44 52 28 56Q36 48 36 38Q36 30 32 25Q40 28 42 36Z', dk('#4a5285', 0.35))
    + F(circ(20, 44, 3.4), dk('#4a5285', 0.4)) + F(circ(30, 34, 2.4), dk('#4a5285', 0.4))
    + SP(24, 32, 3.4, '#ffe07a') + SP(33, 47, 2.8, '#ffe07a') + SP(16, 50, 2.2, '#ffe07a')
    + H('M14 34Q16 27 23 26Q18 30 17 38Z', 0.55)) + SP(50, 47, 3),
  // Sunstone: a glowing orange egg-gem sitting in its rock, giving off rays.
  sunstone: F(star(32, 30, 25, 15, 12), '#ffd25a', 0.5) + AURA(32, 30, 24, '#ffb43a')
    + S('M7 52Q9 41 20 41H44Q55 41 57 52Q47 59 32 59Q17 59 7 52Z', '#7a5c4a')
    + F('M44 41Q55 41 57 52Q47 59 32 59Q46 52 44 41Z', dk('#7a5c4a', 0.35))
    + S(ell(32, 30, 13, 16), '#ff9a2a')
    + F('M45 30A13 16 0 0 1 32 46A10 13 0 0 0 42 30A10 13 0 0 0 37 15A13 16 0 0 1 45 30Z', dk('#ff9a2a', 0.25))
    + L('M32 14V46M20 26L32 32L44 26M22 40L32 32L42 40', lt('#ff9a2a', 0.45), 1.4)
    + H(ell(26, 22, 4, 2.6), 0.65) + SP(53, 9, 3.5),
  // Rift Ore: magenta world-tear crystals floating free above a dark rock.
  rift_ore: AURA(32, 24, 24, RIFT)
    + S('M8 50Q8 42 18 42Q28 38 40 42Q56 42 56 50Q52 58 32 58Q12 58 8 50Z', '#2e2440')
    + F('M40 42Q56 42 56 50Q52 58 32 58Q46 52 40 42Z', dk('#2e2440', 0.4))
    + S(poly([32, 4], [42, 19], [32, 36], [22, 19]), RIFT)
    + F(poly([32, 4], [42, 19], [32, 36], [32, 19]), dk(RIFT, 0.3), 0.75)
    + S(poly([12, 22], [17, 28], [12, 36], [7, 28]), '#ff7ae8', { w: 1.8 }) + S(poly([51, 26], [56, 31], [51, 38], [46, 31]), '#ff7ae8', { w: 1.8 })
    + H(poly([31, 9], [25, 19], [30, 21]), 0.7) + F(circ(22, 48, 1.4), '#ff9af0') + F(circ(36, 52, 1.2), '#ff9af0')
    + SP(52, 10, 3.2) + SP(18, 8, 2.4, '#ffc8f6'),

  // Rift Shard: a jagged sliver torn out of the world itself, a starry void showing through it.
  rift_shard: AURA(32, 32, 30, RIFT) + FIT(0.92, -1, 0, S(poly([38, 3], [50, 20], [44, 26], [47, 40], [30, 61], [24, 44], [14, 40], [22, 22]), RIFT)
    + F(poly([38, 3], [50, 20], [44, 26], [47, 40], [30, 61], [36, 30]), dk(RIFT, 0.3), 0.7)
    + S('M34 12L38 22L33 28L37 36L30 48L28 38L32 30L28 22Z', '#1a0628', { w: 1.6 })
    + F(circ(33, 20, 0.9), '#ffffff') + F(circ(32, 33, 1), '#ffffff') + F(circ(30, 42, 0.8), '#ffffff')
    + H(poly([36, 7], [25, 22], [28, 24]), 0.6))
    + SP(54, 50, 3.4, '#ffc8f6') + SP(10, 14, 3, '#ffc8f6') + SP(56, 8, 2.4),

  /* --------------------------------------------------------------------- ingots */
  // Reishi Ingot: the plain blue-steel bar, stamped with a spirit-flame seal.
  reishi_ingot: ING(bar('#5a8ccc')
    + F(rect(18, 37.5, 16, 10, 2.5), dk('#5a8ccc', 0.25)) + F('M26 39Q31 42.5 28.6 45.4Q26 47 23.6 45.4Q21.6 42.5 26 39Z', lt('#5a8ccc', 0.45)))
    + SP(54, 10, 3.4, '#9ae4ff') + SP(9, 56, 2.6, '#9ae4ff'),
  // Silver Ingot: two stacked silver bars, a Quincy cross engraved on the top one.
  silver_ingot: TR('translate(-2.5 -5) scale(1.15)', bar('#c8d0dc'))
    + TR('translate(7 -9) scale(0.8)', bar('#d8dee8')) + quincy(27.8, 24.6, 4.4, '#6fc6ff')
    + SP(54, 10, 3.6) + SP(9, 56, 2.6),
  // Frost Ingot: an icy bar under a cap of snow, icicles hanging from its edge.
  frost_ingot: ING(bar('#78c2ec')
    + S('M11 35Q12 30 18 31Q21 24 28 27Q33 22 38 26Q44 21 49 25L41 34Z', '#f4fbff', { w: 1.8 })
    + S(poly([11, 49], [16, 49], [13.5, 57]), '#e2f6ff', { w: 1.8 }) + S(poly([20, 49], [25, 49], [22.5, 59]), '#e2f6ff', { w: 1.8 })
    + S(poly([30, 49], [34, 49], [32, 55]), '#e2f6ff', { w: 1.8 }) + S(poly([38, 49], [43, 49], [40.5, 57]), '#e2f6ff', { w: 1.8 }))
    + SP(54, 10, 3.6) + SP(10, 12, 2.6),
  // Void Ingot: a dark violet bar split by a glowing crack of void.
  void_ingot: AURA(32, 32, 20, '#9a3cff') + ING(bar('#4a3f66')
    + F('M35 24L31 30L35 34L28 40L32 44L26 50H33L37 44L33 40L39 34L36 30L39 24Z', '#0c0614')
    + L('M36 25L33 30L37 34L30 40L34 44L29 49', '#c77aff', 1.4))
    + F(circ(50, 10, 2), '#b06aff') + F(circ(56, 16, 1.4), '#b06aff') + F(circ(10, 55, 1.6), '#b06aff'),
  // Black Iron Ingot: a heavy riveted bar with the 11th Division's gold plate.
  black_ingot: ING(bar('#3a3b48')
    + F(circ(14.5, 37.5, 1.5), '#9a9cac') + F(circ(37.5, 37.5, 1.5), '#9a9cac') + F(circ(12.5, 46.5, 1.5), '#9a9cac') + F(circ(39.5, 46.5, 1.5), '#9a9cac')
    + S(poly([26, 35.5], [32.5, 42], [26, 48.5], [19.5, 42]), '#c9a24a', { w: 1.8 })
    + L('M24 39.5V44.5M28 39.5V44.5', dk('#c9a24a', 0.55), 1.8))
    + SP(54, 10, 3, '#ffb060') + SP(9, 56, 2.4, '#ffb060'),
  // Starsteel Ingot: cast in the shape of a star, deep blue with a gold inlay.
  star_ingot: S(star(32, 36, 24, 11, 5), dk('#5468c8', 0.45), { w: 2.2 })
    + S(star(32, 31, 24, 11, 5), '#5a70d4')
    + F('M32 31L54.8 23.6L42.5 34.4L46.1 50.4L32 42Z', dk('#5a70d4', 0.25), 0.7)
    + L(star(32, 31, 13, 6, 5), '#ffd65a', 1.8) + F(circ(32, 31, 2.4), '#ffd65a')
    + H('M24 22L30 10L28 24Z', 0.55) + SP(54, 8, 3.6, '#ffe07a') + SP(10, 52, 2.8, '#ffe07a'),
  // Sun Ingot: a molten golden bar glowing like the sun, dripping at the edge.
  sun_ingot: F(star(32, 32, 27, 16, 12), '#ffd25a', 0.45) + AURA(32, 32, 26, '#ffb43a') + ING(bar('#f0a22c')
    + S('M14 49.5Q14 55 17 55Q20 55 20 49.5Z', '#ffc04a', { w: 1.8 }) + S('M30 49.5Q30 57 33 57Q36 57 36 49.5Z', '#ffc04a', { w: 1.8 })
    + F(ell(26, 42, 9, 3.5), '#fff2b0', 0.7)) + SP(55, 9, 3.6, '#fff6c8'),
  // Rift Ingot: a magenta bar torn open on the starry void, shards drifting off it.
  rift_ingot: AURA(32, 32, 22, RIFT) + ING(bar('#c23aa6')
    + S('M27 35Q33 42 27 49Q21 42 27 35Z', '#1a0628', { w: 1.8 })
    + F(circ(27, 40, 0.9), '#ffffff') + F(circ(26, 45, 0.8), '#ffffff'))
    + S(poly([50, 4], [54, 9], [50, 14], [46, 9]), '#ff7ae8', { w: 1.8 }) + S(poly([57, 15], [60, 19], [57, 23], [54, 19]), '#ff7ae8', { w: 1.8 })
    + S(poly([9, 48], [12, 52], [9, 56], [6, 52]), '#ff7ae8', { w: 1.8 }),

  /* -------------------------------------------------------------------- weapons */
  // Asauchi Katana: a plain, nameless zanpakuto: oval guard, black wrap with white diamonds.
  spirit_katana: ROT(45, 32, 32,
    S('M29.5 42V11Q29.5 5 34.5 2Q35.5 7 35.5 12V42Z', '#d6dde8')
    + F('M33 42V7Q34.4 4.5 34.5 2Q35.5 7 35.5 12V42Z', dk('#d6dde8', 0.25)) + H('M31 40V12Q31 8 33 5.5Q32.4 9 32.4 13V40Z', 0.65)
    + S(ell(32.5, 43, 8, 2.8), '#5a5868', { w: 2 })
    + S(rect(29.5, 45, 6, 15, 1.5), '#3a3648', { w: 2 }) + L('M30.5 48L34.5 51L30.5 54L34.5 57', '#e8e8f0', 1.4)
    + S(rect(29, 59, 7, 3, 1), '#8a8898', { w: 1.8 })),
  // Shikai Blade: a released zanpakuto, edge glowing, gold flower guard, red tassel.
  awakened_blade: FIT(0.94, -1.5, 1.5, ROT(45, 32, 32,
    F('M26 42V8Q30 0 38 0Q42 6 40 42Z', '#7ad8ff', 0.4)
    + S('M29 42V10Q29 4 35 1Q36 7 36 12V42Z', '#e8f4ff') + L('M35 5V41', '#7ad8ff', 2)
    + H('M30.6 40V11Q30.6 7 33 4Q32.2 8 32.2 12V40Z', 0.6)
    + S(star(32.5, 43.5, 9, 5.5, 4, 0), '#e8b84a', { w: 2 }) + F(circ(32.5, 43.5, 2), '#7a4a1a')
    + S(rect(29.5, 47, 6, 12, 1.5), '#b0303a', { w: 2 }) + L('M30.5 50L34.5 53L30.5 56', '#f4d8a0', 1.4))
    + L('M15 47Q10 52 12 58', ART_INK, 4.4) + L('M15 47Q10 52 12 58', '#d8303a', 2.4)) + SP(53, 9, 3.6, '#bfeeff') + SP(46, 23, 2.4, '#bfeeff'),
  // Bankai Blade: a broad crescent blade in its final release, sakura petals in its wind.
  sovereign_blade: AURA(32, 30, 26, '#ff5a7a') + FIT(0.95, -2, 0,
    ROT(45, 32, 32,
      S('M28 42V14Q28 6 36 1Q47 14 43 30Q41 38 38 42Z', '#f2f0f8') + F('M36 4Q45 14 41 30Q40 38 38 42H36Z', '#c9c4dc', 0.8)
      + H('M30 40V14Q30 9 34 5Q32 11 32 16V40Z', 0.6)
      + S(rect(23, 42, 20, 5, 2), '#e8b84a', { w: 2 })
      + S(rect(30, 47, 6, 12, 1.5), '#5a2a7a', { w: 2 }) + L('M30.5 50L35.5 53L30.5 56', '#e8c8ff', 1.4))
    + petal(10, 14, 30) + petal(54, 50, -20) + petal(48, 8, 60) + petal(16, 34, -40) + petal(56, 30, 10)),
  // Tensa Blade: a slim black blade, a manji guard and a broken chain at the pommel.
  eclipse_blade: AURA(30, 30, 26, '#d0203a') + FIT(1, -2, -1,
    ROT(45, 32, 32,
      S('M30 41V9Q30 4 34.5 2Q35.5 6 35.5 10V41Z', '#3a3448') + L('M34.4 6V40', '#c9ccd6', 1.4)
      + H('M31.4 39V10Q31.4 7 33 5Q32.6 8 32.6 11V39Z', 0.45)
      + L('M37.5 38.5H32.5V49.5H27.5M27 39V44H38V49', ART_INK, 5) + L('M37.5 38.5H32.5V49.5H27.5M27 39V44H38V49', '#c9ccd6', 2.4)
      + S(rect(30, 50, 5, 6, 1.2), '#2a2434', { w: 2 }))
    + L('M15 48V53M15 56V60', ART_INK, 3.6) + S(ell(15, 54.5, 2.2, 3), '#9aa0b0', { w: 1.8 })
    + L('M15 48V51', '#9aa0b0', 1.6)) + SP(51, 9, 3.5, '#ffb0b8'),
  // Zangetsu's Edge: a huge guardless cleaver, its tang wrapped in trailing white cloth.
  reapers_edge: FIT(0.92, 0, -0.5, ROT(40, 32, 32,
    S('M22 44V12L32 2H42V44Z', '#cdd1da') + F('M22 44V12L26 8V44Z', '#3a3a48')
    + F('M38 3H42V44H38Z', dk('#cdd1da', 0.25)) + H('M28 40V11L32 6.5V40Z', 0.55)
    + S(rect(28, 44, 9, 16, 1.5), '#f0ece2', { w: 2 }) + L('M28 48L37 51M28 53L37 56', dk('#f0ece2', 0.3), 1.4))
    + L('M15 52Q8 54 6 60M15 52Q12 58 14 62', ART_INK, 4.2) + L('M15 52Q8 54 6 60M15 52Q12 58 14 62', '#f0ece2', 2.2)),
  // Kazeshini Sickle: two-bladed pinwheel scythes linked by a chain.
  wraith_sickle: FIT(0.86, -3, -2.5, L('M20 24Q22 40 44 42', ART_INK, 4.4) + L('M20 24Q22 40 44 42', '#9aa0b0', 2.2)
    + L('M20 24Q22 40 44 42', dk('#9aa0b0', 0.45), 1.4, 0.8)
    + TR('translate(20 22)', S('M-3 -1Q0 -15 -12 -18Q8 -20 4 1Z', '#c8ced8', { w: 2 }) + S('M3 1Q0 15 12 18Q-8 20 -4 -1Z', '#c8ced8', { w: 2 })
      + F('M3 1Q0 15 12 18Q4 12 5 2Z', dk('#c8ced8', 0.3)) + H('M-10 -17Q-1 -16 0 -7Q-3 -13 -10 -17Z', 0.6) + S(circ(0, 0, 4), '#3a3448', { w: 2 }))
    + TR('translate(44 42) rotate(40)', S('M-3 -1Q0 -15 -12 -18Q8 -20 4 1Z', '#c8ced8', { w: 2 }) + S('M3 1Q0 15 12 18Q-8 20 -4 -1Z', '#c8ced8', { w: 2 })
      + F('M3 1Q0 15 12 18Q4 12 5 2Z', dk('#c8ced8', 0.3)) + S(circ(0, 0, 4), '#3a3448', { w: 2 }))),
  // 11th Division Warhammer: a black iron maul stamped with the division's two bars, a little gold bell tied on.
  black_warhammer: FIT(0.8, 0, 0, ROT(40, 32, 32,
    S(rect(29.5, 20, 5, 40, 2), '#5a4632', { w: 2 }) + L('M30.5 46L33.5 48M30.5 51L33.5 53M30.5 56L33.5 58', dk('#5a4632', 0.4), 1.4)
    + S(rect(12, 6, 40, 16, 3), '#3c3d4a') + F('M15 17H49V19Q49 20 48 20H16Q15 20 15 19Z', dk('#3c3d4a', 0.4))
    + S(rect(10, 4, 6, 20, 2), '#5a5c6a', { w: 2 }) + S(rect(48, 4, 6, 20, 2), '#5a5c6a', { w: 2 })
    + S(rect(27, 9, 3.4, 9, 1), '#e8dcc0', { w: 1.8 }) + S(rect(33.6, 9, 3.4, 9, 1), '#e8dcc0', { w: 1.8 }) + H('M18 8H45V10H18Z', 0.45)
    + L('M34 24Q40 26 39 30', ART_INK, 1.6) + S(circ(39, 32.5, 3.2), '#f2c63a', { w: 1.8 }) + F(circ(39, 34, 0.9), ART_INK))),
  // Quincy Bow: a bow of gathered blue reishi, a Quincy cross at the grip, an arrow of light.
  sunforged_bow: AURA(38, 32, 26, '#6fd0ff') + FIT(0.96, -1.5, 0,
    S('M24 5Q55 13 53 32Q55 51 24 59Q44 46 42 32Q44 18 24 5Z', '#5cc4f4')
    + F('M53 32Q55 51 24 59Q44 46 42 32Z', dk('#5cc4f4', 0.25))
    + L('M24 6V58', '#e8f8ff', 1.4)
    + L('M8 32H55', ART_INK, 4.2) + L('M8 32H55', '#ffffff', 2)
    + S(poly([52, 27], [61, 32], [52, 37]), '#e8f8ff', { w: 1.8 }) + S(poly([6, 27], [12, 32], [6, 37], [9, 32]), '#9ae4ff', { w: 1.8 })
    + quincy(47.5, 32, 5.2, '#ffffff')
    + H('M30 10Q46 16 48 26Q42 16 30 10Z', 0.6)) + SP(14, 12, 3) + SP(16, 52, 2.6),
  // Husk Claw: three bone talons with dark tips on a black-scaled wrist.
  husk_claw: S('M6 50Q6 40 16 38L26 44Q22 54 12 58Q6 56 6 50Z', '#4a3a5a')
    + S('M14 40Q22 22 44 6Q34 22 26 44Z', '#f1ebdd', { w: 2.2 })
    + S('M20 46Q34 28 58 22Q42 34 28 50Z', '#e8e0cc', { w: 2.2 })
    + S('M18 52Q34 44 54 48Q38 52 24 58Z', '#ddd4be', { w: 2.2 })
    + F('M54 48Q38 52 24 58L22 55.5Q36 50 54 48Z', dk('#ddd4be', 0.25)) + F('M58 22Q42 34 28 50L26 48Q40 34 58 22Z', dk('#e8e0cc', 0.22))
    + F('M44 6L37 16L35 14Z', '#7a1a2a') + F('M58 22L48 29L47 26Z', '#7a1a2a') + F('M54 48L44 51L44 48Z', '#7a1a2a')
    + H('M18 36Q26 24 38 14Q28 26 22 38Z', 0.6) + F(circ(12, 48, 1.6), dk('#4a3a5a', 0.4)) + F(circ(16, 53, 1.4), dk('#4a3a5a', 0.4)),
  // Bone Lance: a knobbed Husk-bone shaft with a barbed bone spearhead.
  bone_lance: ROT(45, 32, 32,
    S(rect(29.5, 18, 5, 42, 2), '#e4dac2', { w: 2 }) + F(rect(32.5, 20, 2, 38), dk('#e4dac2', 0.2))
    + S(ell(32, 30, 4.6, 2.6), '#efe6d0', { w: 1.8 }) + S(ell(32, 41, 4.6, 2.6), '#efe6d0', { w: 1.8 }) + S(ell(32, 52, 4.6, 2.6), '#efe6d0', { w: 1.8 })
    + S(poly([32, 1], [40, 15], [36, 16], [41, 23], [32, 19], [23, 23], [28, 16], [24, 15]), '#f4ecd8')
    + F(poly([32, 1], [40, 15], [36, 16], [41, 23], [32, 19]), dk('#f4ecd8', 0.2)) + H('M31 5L26.5 14L29.5 14.5Z', 0.6) + F(ell(32, 13, 1.6, 3), '#3a2a3a')),
  // Rift Cleaver: an axe with a cosmic magenta blade, a tear of stars along its edge.
  rift_cleaver: AURA(34, 26, 22, RIFT) + FIT(0.83, -5, -4,
    ROT(30, 32, 32,
      S(rect(29, 12, 6, 48, 2), '#3a2a4a', { w: 2 }) + S(rect(28, 40, 8, 3, 1), '#e8b84a', { w: 1.8 }) + S(rect(28, 52, 8, 3, 1), '#e8b84a', { w: 1.8 })
      + S('M34 6Q50 2 60 12Q58 28 52 36Q44 30 34 30Z', RIFT)
      + F('M38 12Q50 10 54 16Q52 26 48 30Q44 24 38 24Z', '#2a0a3a')
      + F(circ(46, 18, 1), '#ffffff') + F(circ(44, 24, 0.9), '#ffffff') + F(circ(50, 22, 0.9), '#ffffff')
      + S('M30 10Q22 12 20 20L29 22Z', '#8a5aa8', { w: 1.8 }) + S(rect(27, 6, 10, 26, 2), '#4a3a62', { w: 2 }) + F(rect(33, 8, 2.6, 22), dk('#4a3a62', 0.35))
      + H('M38 8Q50 5 56 12Q48 9 38 11Z', 0.6)))
    + SP(52, 52, 3, '#ffc8f6'),

  /* ---------------------------------------------------------------- accessories */
  // Reishi Ring: a crystalline ring of solid reishi with particles drifting off it.
  reishi_ring: AURA(32, 34, 26, '#6ad8ff')
    + S(ring(32, 34, 20, 20, 12, 12), '#6ad4f8')
    + F('M52 34A20 20 0 0 1 32 54V46A12 12 0 0 0 44 34Z', dk('#6ad4f8', 0.25))
    + L('M32 14V22M50 28L44 30M50 42L44 38M32 54V46M14 42L20 38M14 28L20 30', dk('#6ad4f8', 0.4), 1.6)
    + H('M15 30Q18 18 30 15Q22 20 19 31Z', 0.6)
    + SP(54, 10, 3.6, '#c8f4ff') + SP(10, 12, 2.6, '#c8f4ff') + SP(56, 54, 2.4, '#c8f4ff'),
  // Blood Ruby: a deep red octagon-cut gem, red as a cero.
  ruby: AURA(32, 32, 26, '#ff4a5a')
    + S(poly([22, 8], [42, 8], [56, 22], [56, 42], [42, 56], [22, 56], [8, 42], [8, 22]), '#d8203a')
    + S(poly([25, 20], [39, 20], [44, 25], [44, 39], [39, 44], [25, 44], [20, 39], [20, 25]), '#f03a52', { w: 1.6 })
    + L('M22 8L25 20M42 8L39 20M56 22L44 25M56 42L44 39M42 56L39 44M22 56L25 44M8 42L20 39M8 22L20 25', dk('#d8203a', 0.4), 1.4)
    + F(poly([39, 44], [44, 39], [56, 42], [42, 56]), dk('#d8203a', 0.35), 0.7)
    + H(poly([24, 22], [34, 22], [24, 32]), 0.65) + SP(52, 10, 3.6),
  // Ruby Crest: a gold rosette medallion set with a ruby, hung on a red cord.
  ruby_crest: L('M14 4Q20 22 32 24Q44 22 50 4', ART_INK, 4) + L('M14 4Q20 22 32 24Q44 22 50 4', '#c8283a', 2.2)
    + S(star(32, 40, 19, 14, 8, 0), '#e8b84a')
    + S(circ(32, 40, 12), '#f2cc6a', { w: 1.8 })
    + F('M44 40A12 12 0 0 1 32 52A9.5 9.5 0 0 0 41.5 40Z', dk('#f2cc6a', 0.3))
    + S(ell(32, 40, 7, 8.5), '#d8203a', { w: 1.8 }) + H(ell(29.5, 36.5, 2.4, 1.6), 0.65) + H('M18 34Q22 28 28 27Q23 31 21 37Z', 0.45)
    + S(circ(32, 25, 2.6), '#e8b84a', { w: 1.8 }) + SP(53, 52, 3.2),
  // Void Diamond: a black-violet diamond with a void glint in its heart.
  void_diamond: AURA(32, 34, 28, '#9a4aff')
    + S(poly([20, 12], [44, 12], [56, 25], [32, 57], [8, 25]), '#3e2c66')
    + L('M8 25H56M20 12L26 25L32 57M44 12L38 25L32 57M32 12L26 25M32 12L38 25', lt('#3e2c66', 0.3), 1.4)
    + F(poly([44, 12], [56, 25], [32, 57], [38, 25]), dk('#3e2c66', 0.4), 0.7)
    + H(poly([21, 14], [30, 14], [24, 23]), 0.55) + SP(32, 34, 3.4, '#d6a8ff') + SP(54, 8, 3.6) + SP(10, 48, 2.6, '#d6a8ff'),
  // Void Diamond Band: a thick dark-silver band crowned with a big void diamond.
  void_band: S(ring(32, 42, 21, 14, 14, 8), '#8a8ca0')
    + F('M11 42Q11 54 32 56Q53 54 53 42Q50 50 32 50Q14 50 11 42Z', dk('#8a8ca0', 0.3))
    + S(poly([24, 26], [28, 31], [36, 31], [40, 26]), '#c8cad8', { w: 1.8 })
    + S(poly([24, 12], [40, 12], [46, 19], [32, 32], [18, 19]), '#3e2c66', { w: 2.2 })
    + L('M18 19H46M32 12L28 19L32 32M32 12L36 19', lt('#3e2c66', 0.3), 1.2)
    + H(poly([25, 14], [30, 14], [26, 18]), 0.6) + SP(52, 10, 3.6, '#d6a8ff') + SP(12, 16, 2.6, '#d6a8ff'),
  // Ginpaku Scarf: the Kuchiki noble's flowing silver-white scarf.
  reaper_scarf: FIT(0.96, -1, -3.5, S('M14 16Q32 6 50 16Q52 24 46 26Q32 18 18 26Q12 24 14 16Z', '#e2e8f2')
    + S('M40 22Q50 32 44 44Q40 52 48 60H34Q30 50 34 40Q38 32 32 24Z', '#d4dcea')
    + F('M41 25Q48 33 43 44Q39 52 46 59H42Q36 51 40 43Q44 34 41 25Z', dk('#d4dcea', 0.2))
    + S('M22 24Q16 34 22 44Q26 50 20 58H8Q12 48 12 40Q12 30 18 22Z', '#e8eef6')
    + L('M10 58V61M14 58V61M18 58V61M36 60V63M40 60V63M44 60V63', '#a8b4c8', 1.6)
    + L('M18 14Q32 9 46 14M38 30Q42 38 38 46M16 32Q14 40 16 48', dk('#d4dcea', 0.25), 1.4)
    + H('M18 15Q30 10 40 12Q28 13 20 18Z', 0.65)) + SP(54, 34, 3.2),
  // Prayer Beads: a monk's juzu of dark wood beads with a big bead and a purple tassel.
  prayer_beads: FIT(0.92, 0, -1.5, [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map((i) => { const a = (i / 12) * Math.PI * 2 - Math.PI / 2; const x = +(32 + Math.cos(a) * 18).toFixed(1), y = +(28 + Math.sin(a) * 18).toFixed(1); return i === 6 ? '' : S(circ(x, y, 4.4), '#8a5a34', { w: 1.8 }) + (i === 10 || i === 11 ? H(ell(x - 1.4, y - 1.4, 1.4, 0.9), 0.5) : ''); }).join('')
    + S('M28 52H36L39 62H25Z', '#8a4ac8', { w: 2 }) + F('M33 52H36L39 62H35Z', dk('#8a4ac8', 0.3)) + L('M29 55L28 61M32 55V61', dk('#8a4ac8', 0.4), 1.2)
    + S(circ(32, 46, 5.6), '#5a3420', { w: 2 }) + F('M37.6 46A5.6 5.6 0 0 1 32 51.6A4.4 4.4 0 0 0 36.4 46Z', dk('#5a3420', 0.4)) + H(ell(30, 44, 2, 1.3), 0.6)),
  // Vasto Lorde Mask: the Sovereign's full white mask, two horns, red stripes, gold eyes.
  sovereign_mask: S('M21 19Q9 14 6 3Q15 9 25 12Z', '#e8e0d0', { w: 2 }) + S('M43 19Q55 14 58 3Q49 9 39 12Z', '#e8e0d0', { w: 2 })
    + S('M18 22Q18 10 32 10Q46 10 46 22V38Q46 53 32 58Q18 53 18 38Z', '#f4efe6')
    + F('M23 11H27V46H23ZM37 11H41V46H37Z', '#c4243a')
    + F('M20 28Q25 24 30 28Q27 32 21 31Z', '#140c1c') + F('M44 28Q39 24 34 28Q37 32 43 31Z', '#140c1c')
    + F(circ(25, 28.5, 1.4), '#ffd84a') + F(circ(39, 28.5, 1.4), '#ffd84a')
    + L('M24 46H40M27 44V49M32 44V50M37 44V49', ART_INK, 1.6)
    + F('M46 22V38Q46 53 32 58Q42 48 42 34Q42 18 36 11Q46 12 46 22Z', dk('#f4efe6', 0.2))
    + H('M20 22Q21 14 28 12Q22 17 22 27Z', 0.65),
  // Eye of the Rift: a cosmic magenta eye in a dark gold-rimmed almond, looking back at you.
  rift_eye: AURA(32, 32, 30, RIFT)
    + L('M32 5V12M18 9L22 15M46 9L42 15', '#ffb0f0', 2)
    + S('M4 32Q32 6 60 32Q32 58 4 32Z', '#e8b84a', { w: 2.2 })
    + S('M10 32Q32 13 54 32Q32 51 10 32Z', '#2a0e3e', { w: 1.6 })
    + F(circ(18, 30, 0.8), '#ffffff') + F(circ(46, 35, 0.8), '#ffffff') + F(circ(44, 27, 0.6), '#ffffff')
    + S(circ(32, 32, 11), '#ff4fd8', { w: 1.8 })
    + F('M43 32A11 11 0 0 1 32 43A8.5 8.5 0 0 0 40.5 32Z', dk('#ff4fd8', 0.3))
    + S(ell(32, 32, 2.6, 8), '#140c1c', { w: 1, flat: true })
    + H(ell(28, 27, 3, 2), 0.65) + SP(56, 10, 3, '#ffd0f8') + SP(8, 52, 2.6, '#ffd0f8'),

  /* ----------------------------------------------------------------------- armor */
  // Hierro Carapace: a white bone chestplate with shoulder spikes and a Husk hole.
  husk_carapace: S(poly([12, 16], [6, 4], [20, 12]), '#e8e0cc', { w: 2 }) + S(poly([52, 16], [58, 4], [44, 12]), '#e8e0cc', { w: 2 })
    + S('M14 14L24 10Q32 17 40 10L50 14L57 26L48 31V52Q32 59 16 52V31L7 26Z' + 'M32 30a6 6 0 1 1 0 12a6 6 0 1 1 0 -12Z', '#f0e9d8')
    + F('M48 31V52Q40 56 34 56Q44 48 44 30Z', dk('#f0e9d8', 0.25))
    + L('M20 46Q32 50 44 46M22 24Q32 28 42 24', dk('#f0e9d8', 0.4), 1.6)
    + F(poly([16, 31], [20, 34], [16, 37]), '#3a2c48') + F(poly([48, 31], [44, 34], [48, 37]), '#3a2c48')
    + H('M16 18L23 13Q20 20 18 28Z', 0.6),
  // Las Noches White Coat: the white high-collared coat of the Husk army's ruler, black sash.
  sovereign_cloak: S('M20 10L26 6H38L44 10L47 20L56 58H8L17 20Z', '#f2f0ea')
    + F('M44 10L47 20L56 58H44Q48 40 44 22Z', dk('#f2f0ea', 0.18))
    + S('M27 12L32 26L37 12Z', '#2a2230', { w: 1.8 })
    + S('M17 22L26 6L28 14L22 26Z', '#e2ded4', { w: 1.8 }) + S('M47 22L38 6L36 14L42 26Z', '#e2ded4', { w: 1.8 })
    + S('M16 32H48L49 37H15Z', '#24202c', { w: 1.8 }) + L('M32 37V58', dk('#f2f0ea', 0.35), 1.6)
    + H('M19 24L23 22L16 52H12Z', 0.55),
  // Shihakusho Robe: the Soul Reaper's black kimono, wide sleeves, white collar and belt.
  ferryman_robe: S('M22 8H42L58 20L54 34L46 30V58H18V30L10 34L6 20Z', '#2a2734')
    + F('M42 8L58 20L54 34L46 30V58H40V20Z', dk('#2a2734', 0.3))
    + S('M26 8L32 26L38 8Z', '#f2f0ea', { w: 1.8 }) + F('M29 8L32 18L35 8Z', '#2a2734')
    + S('M18 34H46V38H18Z', '#f2f0ea', { w: 1.6 })
    + L('M32 38V58', '#4a4658', 1.6) + L('M12 22L18 30M52 22L46 30', '#4a4658', 1.4)
    + H('M14 18L22 11L20 16L12 26Z', 0.45),
});
})();
