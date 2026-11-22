'use strict';
/* Item art — shared families: tools, scrolls, gems, chests, traps. See js/item-art.js for the helpers and style rules. */
(() => {
const { S, F, L, H, SP, AURA, T, G, GL, lt, dk, mix, circ, ell, rect, poly, star, ROT, TR } = ARTK;

/* ---- Technique scrolls: each world has its own support, drawn behind the technique's picture.
   Leaf = unrolled jutsu scroll, Orange Town = wanted-poster parchment, Soul City = open black Kido book,
   Kaio = Hoi-Poi capsule, Green Island = Nen card, Shinjuku = ofuda talisman. */
const rollN = (x) => S(rect(x, 11, 8, 42, 3.5), '#b8402f', { w: 2 }) + F(rect(x + 1.4, 13, 2.2, 38, 1), '#ffffff', 0.35)
  + S(rect(x + 1.5, 6.5, 5, 5, 1.6), '#5a3a22', { w: 1.6 }) + S(rect(x + 1.5, 52.5, 5, 5, 1.6), '#5a3a22', { w: 1.6 });
const SUP = {
  shinobi: () => S(rect(10, 15, 44, 34, 1), '#f3e3b8', { w: 2 }) + L('M16 20V44M48 20V44', '#a3824f', 1.4, 0.6) + rollN(4) + rollN(52),
  seas: () => ROT(-5, 32, 32, S('M12 9H52V52H12Z', '#e8c98a', { w: 2 }) + F(rect(17, 13, 30, 3.5), '#6b4a2a', 0.75)
    + S(rect(9, 49, 46, 8, 4), '#d4ad6a', { w: 2 }) + L('M14 53H50', dk('#d4ad6a', 0.3), 1.2) + S(rect(9, 4, 46, 7, 3.5), '#d4ad6a', { w: 2 })),
  soul: () => ROT(-8, 32, 32, S(rect(14, 6, 42, 52, 2), '#f2eee6', { w: 2 }) + S(rect(9, 4, 42, 56, 3), '#2a2433')
    + F(rect(12, 4, 4, 56), '#4a4060') + F('M40 6H49V15Z', '#c9b37a') + F('M40 58H49V49Z', '#c9b37a') + L(rect(19, 9, 28, 46, 1), '#6a5a8a', 1.2, 0.8)),
  ki: () => ROT(-35, 32, 32, S(rect(2, 21, 60, 22, 11), '#f2f4f8') + S('M36 21H51A11 11 0 0 1 51 43H36Z', '#ff8a2a')
    + F(rect(33, 21, 3, 22), '#9aa4b4') + H('M8 24H32V27H8Z', 0.6) + H('M38 24H52V27H38Z', 0.5)),
  hunter: () => ROT(10, 32, 32, S(rect(13, 5, 38, 54, 4), '#f7f2e6', { w: 2 }) + L(rect(16.5, 8.5, 31, 47, 2.5), '#c0392b', 1.4)
    + F('M20 10Q24 14 24 16Q24 19 20.6 18L21.5 21H18.5L19.4 18Q16 19 16 16Q16 14 20 10Z', ART_INK)
    + F('M44 54Q40 51 40 48.5Q40 46.5 42 46.5Q43.5 46.5 44 48Q44.5 46.5 46 46.5Q48 46.5 48 48.5Q48 51 44 54Z', '#c0392b')),
  hex: () => ROT(-18, 32, 32, S(rect(22, 3, 20, 58, 1), '#f4ecd6', { w: 2 }) + L(rect(24.5, 5.5, 15, 53, 0.5), '#c0392b', 1.2)
    + S(circ(32, 10, 3.4), '#c0392b', { w: 1.4 }) + L('M28 48H36M32 46V57M28.5 52L35.5 55', '#c0392b', 1.8)),
};
const fist = (c, sh) => S('M13 26H52V44Q52 54 40 54H25Q13 54 13 44Z', c)
  + S(rect(14, 16, 10, 16, 5), c) + S(rect(23, 14, 10, 17, 5), c) + S(rect(32, 14, 10, 17, 5), c) + S(rect(41, 16, 10, 16, 5), c)
  + S('M14 35Q14 30 20 31H38Q43 33 39 38H22Q15 41 14 35Z', c, { w: 2 }) + L('M20 44Q32 48 46 42', sh, 1.4);
const petal = (len, wd) => `M32 50Q${32 - wd} ${50 - len * 0.45} 32 ${50 - len}Q${32 + wd} ${50 - len * 0.45} 32 50Z`;
const kunai = S('M32 6Q38 17 35.5 27H28.5Q26 17 32 6Z', '#d7dee8', { w: 2 }) + L('M32 10V24', '#ffffff', 1.2, 0.8)
  + S(rect(27, 26, 10, 3.4, 1), '#3b4255', { w: 1.6 }) + S(rect(29.6, 29.4, 4.8, 13, 1), '#2b2f45', { w: 1.6 })
  + L('M29.6 33L34.4 35M29.6 37L34.4 39', '#5b6080', 1.2) + S(circ(32, 45.5, 3.4), '#ffcf3f', { w: 1.8 }) + F(circ(32, 45.5, 1.5), '#2b2f45');
const LEAF = 'M24 33Q28 26 34 28Q41 30 38 36Q35 41 30 37Q27 34 31 32M38 36L44 40';
const chainRing = [0, 45, 90, 135, 180, 225, 270, 315].map((a, i) => ROT(a, 32, 25, i % 2
  ? S(rect(28, 8.6, 8, 2.8, 1.4), '#e8b83a', { w: 1.6 })
  : S(ell(32, 10, 6, 3.6), '#ffd45a', { w: 1.8 }) + F(ell(32, 10, 3, 1.2), '#5a3a10'))).join('');
const chainDiag = [0, 1, 2, 3, 4, 5].map((i) => { const x = 13 + i * 6, y = 51 - i * 6; return ROT(-45, x, y, i % 2
  ? S(rect(x - 4.5, y - 1.5, 9, 3, 1.5), '#9aa4b4', { w: 1.6 })
  : S(ell(x, y, 5.4, 3.4), '#d7dee8', { w: 1.8 }) + F(ell(x, y, 2.8, 1.1), '#2b2f45')); }).join('');
const trigram = [0, 45, 90, 135, 180, 225, 270, 315].map((a) => ROT(a, 32, 32, F(rect(28.5, 9, 7, 1.8), ART_INK) + F(rect(28.5, 11.8, 7, 1.8), ART_INK))).join('');

Object.assign(ART, {
  /* --- random-technique scrolls: the support itself is the picture, with its world's emblem */
  // Leaf Jutsu Scroll: the unrolled ninja scroll, Leaf symbol and a red seal stamp.
  scroll_shinobi: SUP.shinobi() + L(LEAF, '#3b2a1a', 3.2) + H('M12 17H52V19H12Z', 0.4)
    + S(rect(40, 38, 9, 8, 1), '#c0392b', { w: 1.4 }) + T(44.5, 42, 6, '忍', '#f3e3b8'),
  // Grand Line Chart: a rolled sea map, rope tie, dotted route to a red X.
  scroll_seas: ROT(-30, 32, 32, S(rect(6, 23, 52, 18, 9), '#e8c98a') + S(ell(52, 32, 5, 9), '#f4dca8', { w: 2 }) + L(ell(52, 32, 2.4, 4.5), '#b08a4a', 1.4)
    + L('M10 36Q18 30 24 34', '#c0392b', 1.8) + L('M14 28L18 32M18 28L14 32', '#c0392b', 2.2)
    + S(rect(30, 21, 7, 22, 2), '#a8683a', { w: 2 }) + H('M10 26H46V28H10Z', 0.45))
    + S('M30 38Q24 46 20 50L25 51Q30 46 33 40Z', '#a8683a', { w: 1.6 }) + S('M34 40Q38 48 44 50L40 53Q34 48 32 41Z', '#a8683a', { w: 1.6 }),
  // Kido Primer: the black spellbook of the Kido Corps with a Hell Butterfly on its cover.
  scroll_soul: ROT(-10, 32, 32, S(rect(16, 9, 38, 46, 2), '#f2eee6', { w: 2 }) + S(rect(11, 7, 38, 50, 3), '#2a2433')
    + F(rect(14, 7, 4, 50), '#4a4060') + F('M38 9H47V18Z', '#c9b37a') + F('M38 55H47V46Z', '#c9b37a')
    + S('M32 30Q22 16 19 25Q19 31 31 32Q22 36 24 42Q28 44 32 34Q36 44 40 42Q42 36 33 32Q45 31 45 25Q42 16 32 30Z', '#9a5ae8', { w: 1.6 })
    + F('M31 26H33V40H31Z', ART_INK) + H('M20 10H40V12H20Z', 0.3)),
  // Hoi-Poi Capsule: a Capsule Corp capsule popping open in a puff of smoke.
  scroll_ki: F(circ(48, 14, 8), '#e8eef5', 0.9) + F(circ(56, 22, 6), '#e8eef5', 0.9) + F(circ(42, 8, 5), '#e8eef5', 0.9)
    + ROT(-35, 32, 34, S(rect(8, 24, 48, 20, 10), '#f2f4f8') + S('M34 24H46A10 10 0 0 1 46 44H34Z', '#ff8a2a')
    + F(rect(31, 24, 3, 20), '#9aa4b4') + S(circ(18, 34, 3.6), '#ff8a2a', { w: 1.6 }) + T(26, 34.5, 10, '5', ART_INK) + H('M14 27H40V30H14Z', 0.6))
    + SP(54, 8, 4) + SP(12, 52, 3),
  // Greed Island Card: a spell card with its gem and the island in its picture window.
  scroll_hunter: ROT(-14, 32, 32, S(rect(14, 7, 34, 50, 4), '#2a8a5a', { w: 2 }))
    + ROT(8, 32, 32, S(rect(15, 5, 36, 52, 4), '#f7f2e6') + L(rect(18, 8, 30, 46, 2.5), '#d4a03a', 2)
    + S(rect(21, 16, 24, 22, 2), '#5ab8ff', { w: 1.6 }) + S('M24 34Q26 26 33 25Q41 25 42 34Z', '#3f9a4a', { w: 1.6 })
    + S(star(33, 22, 3, 1.4, 5), '#3f9a4a', { w: 1 }) + S(poly([33, 9], [36, 12], [33, 15], [30, 12]), '#d8402f', { w: 1.4 })
    + T(26, 46, 8, 'SS', '#2a8a5a') + L('M34 44H44M34 48H42', '#a3824f', 1.4)) + SP(54, 10, 4),
  // Cursed Ofuda: a talisman soaked in cursed energy, black nail marks across it.
  scroll_hex: AURA(32, 32, 30, '#8a3ad8') + ROT(-10, 32, 32, S(rect(19, 4, 26, 56, 1.5), '#f4ecd6') + L(rect(22, 7, 20, 50, 0.5), '#c0392b', 1.4)
    + S(circ(32, 13, 4), '#c0392b', { w: 1.4 }) + T(32, 33, 16, '呪', '#c0392b') + L('M28 48H36M32 46V55', '#c0392b', 2))
    + F('M10 24L54 38L53 40.5L9 26.5Z', '#1c1424') + F('M12 32L52 46L51 48.5L11 34.5Z', '#1c1424'),

  /* --- Leaf Village techniques: unrolled scroll + the jutsu */
  // Shadow Clone Scroll: a ninja and his purple shadow clone, a slash behind them.
  scroll_shadow_strike: SUP.shinobi() + L('M6 40Q28 6 58 12', '#ffffff', 3.4) + L('M6 40Q28 6 58 12', '#b06bff', 1.6)
    + F(circ(24, 26, 9), '#8a5ae8', 0.5) + F('M8 56Q10 40 24 38Q38 40 40 56Z', '#8a5ae8', 0.5)
    + S('M20 57Q21 41 36 39Q51 41 52 57Z', '#2a2c48') + S(circ(36, 27, 10), '#2a2c48')
    + S(rect(25.5, 19, 21, 6, 1.5), '#c9d3df', { w: 1.6 }) + L('M46 22L55 17M46 23L54 28', '#2f4fb8', 2.4)
    + F('M30 29.5H42L41 32H31Z', '#ffffff') + F(circ(33.5, 30.6, 1), '#d8402f') + F(circ(38.5, 30.6, 1), '#d8402f') + H(ell(28, 45, 4, 1.6), 0.3),
  // Kunai Volley Scroll: three kunai fanned out with wind streaks.
  scroll_kunai_volley: SUP.shinobi() + L('M10 30Q20 24 26 14M54 30Q44 24 38 14', '#bfe6ff', 2, 0.9)
    + ROT(-32, 32, 52, kunai) + ROT(32, 32, 52, kunai) + kunai,
  // Phoenix Flower Scroll: a lotus of fire.
  scroll_fire_lotus: SUP.shinobi() + AURA(32, 34, 28, '#ff8a3a')
    + ROT(-62, 32, 50, S(petal(28, 9), '#d8402f', { w: 2 })) + ROT(62, 32, 50, S(petal(28, 9), '#d8402f', { w: 2 }))
    + ROT(-30, 32, 50, S(petal(36, 10), '#ff6a2a', { w: 2 })) + ROT(30, 32, 50, S(petal(36, 10), '#ff6a2a', { w: 2 }))
    + S(petal(42, 11), '#ff9a2a', { w: 2 }) + F(petal(26, 5), '#ffe066') + S(ell(32, 51, 12, 4), '#8a2a1c', { w: 2 }) + SP(51, 13, 3.5),
  // Mystical Palm Scroll: a medical ninja's open hand glowing green.
  scroll_healing_palm: SUP.shinobi() + AURA(32, 34, 28, '#7dff9a')
    + S(rect(19.5, 16, 6, 20, 3), '#f2c39a', { w: 2 }) + S(rect(25.5, 10, 6.4, 24, 3.2), '#f2c39a', { w: 2 })
    + S(rect(32, 11, 6.4, 24, 3.2), '#f2c39a', { w: 2 }) + S(rect(38.5, 15, 6, 22, 3), '#f2c39a', { w: 2 })
    + ROT(-40, 20, 40, S(rect(15, 30, 6.5, 16, 3.2), '#f2c39a', { w: 2 }))
    + S('M19 30H45V44Q45 52 34 52H30Q19 52 19 44Z', '#f2c39a') + S(rect(23, 50, 18, 8, 2), '#2f4fb8', { w: 2 })
    + F(circ(32, 40, 7), '#7dff9a', 0.85) + L(circ(32, 40, 9.5), '#2f9f4a', 1.6) + SP(32, 40, 4.5) + SP(51, 13, 3),
  // Hidden Mist Scroll: a mist cloud with fading ninja footsteps.
  scroll_mist_step: SUP.shinobi()
    + S('M8 46Q3 36 13 33Q13 21 25 23Q31 12 42 18Q54 15 55 28Q62 32 59 42Q57 50 46 50H16Q8 52 8 46Z', '#c9dbe8')
    + F('M10 46Q14 41 22 43Q30 39 38 43Q46 39 57 43Q55 50 46 50H16Q10 50 10 46Z', dk('#c9dbe8', 0.22))
    + L('M18 32Q24 26 30 30Q34 33 38 27', '#ffffff', 2, 0.85) + L('M34 40Q42 34 50 38', '#ffffff', 1.6, 0.7)
    + L('M6 20Q14 12 22 18M44 10Q52 6 58 12', '#e8f2fa', 2.2, 0.9) + T(33, 36, 15, '霧', '#3a5a78', { stroke: '#e8f2fa', sw: 2 }),
  // Earth Armor Scroll: skin hardened into a shield of stone plates.
  scroll_iron_skin: SUP.shinobi() + S('M32 6L52 14V32Q52 48 32 58Q12 48 12 32V14Z', '#8b8f9c')
    + F('M32 6L52 14V32Q52 48 32 58Z', '#6b6f7c', 0.45)
    + L('M22 10L20 24L28 33L23 48M42 10L44 24L36 33L41 48M20 24H12M44 24H52M28 33H36', '#4a4e5a', 1.8)
    + H('M15 16L29 10V14L16 20Z', 0.5) + SP(46, 18, 4) + SP(18, 40, 2.6),
  // Eight Trigrams Scroll: the spiral seal formula, crackling with blue lightning.
  scroll_sealing_mark: SUP.shinobi() + AURA(32, 32, 28, '#7ab8ff') + trigram
    + S(circ(32, 32, 15), '#f6ecc8', { w: 2 }) + L(circ(32, 32, 11.5), ART_INK, 1.6)
    + L('M32 32Q35 31 35 34Q35 38 30 38Q25 37 25 32Q25 25 32 25Q40 25 40 33', ART_INK, 2.2)
    + L('M50 44L54 48L51 49L56 54M10 12L14 16L11 17L15 21', '#5ab8ff', 1.8),

  /* --- Orange Town techniques: wanted-poster parchment + the move */
  // Armament Haki Manual: a fist coated in glossy black Haki, purple sparks.
  scroll_iron_fist: SUP.seas() + AURA(32, 34, 26, '#b06bff') + fist('#2a2438', '#6a5a8a')
    + H(ell(18, 19, 2.4, 1.3), 0.7) + H(ell(27, 17, 2.4, 1.3), 0.7) + H(ell(36, 17, 2.4, 1.3), 0.7) + H(ell(45, 19, 2.4, 1.3), 0.7)
    + S(rect(20, 52, 26, 6, 2), '#c0392b', { w: 2 }) + L('M6 22L11 18L10 24L15 20M50 50L55 46L54 52L59 48', '#b06bff', 1.8),
  // Kenbunshoku Manual: a brass spyglass that sees what comes next, sensing ripples ahead.
  scroll_foresight: SUP.seas() + L('M46 12Q52 10 56 16M44 6Q54 2 60 12', '#4fb6ff', 2.2)
    + ROT(-35, 32, 34, S(rect(6, 29, 16, 10, 2), '#6a4a2a') + S(rect(20, 27, 15, 14, 2), '#d4a03a') + S(rect(33, 25, 18, 18, 2), '#e0b04a')
    + F(rect(30, 27, 3, 14), '#8a5a1a') + S(ell(52, 34, 3.4, 9), '#bfe6ff', { w: 2 }) + H('M22 29H33V31H22Z', 0.6) + H('M35 27H49V29.5H35Z', 0.6))
    + SP(54, 24, 3.5),
  // Gaon Cannon Manual: a ship's cannon firing, flash and smoke.
  scroll_cannon_volley: SUP.seas() + F(circ(54, 26, 5), '#e8eef5', 0.85) + F(circ(46, 14, 4), '#e8eef5', 0.85)
    + S(star(52, 20, 9, 4.5, 8), '#ffb43a', { w: 1.8 }) + F(star(52, 20, 4.5, 2.4, 8), '#fff3a0')
    + ROT(-30, 30, 38, S('M10 31H46V43H10Q5 43 5 37Q5 31 10 31Z', '#3a3d4a') + S(rect(44, 29, 7, 16, 2), '#2a2c38', { w: 2 })
    + F(rect(18, 31, 3, 12), '#d4a03a') + F(rect(32, 31, 3, 12), '#d4a03a') + H('M10 33H42V35H10Z', 0.4))
    + S(circ(22, 48, 7.5), '#8a5a2a', { w: 2 }) + F(circ(22, 48, 2.4), ART_INK) + L('M22 41V55M15 48H29', dk('#8a5a2a', 0.4), 1.4),

  /* --- Soul City techniques: open black Kido book + the spell rising from it */
  // Getsuga Tensho Primer: the blue-white crescent of a zanpakuto's slash.
  scroll_reaper_slash: SUP.soul() + AURA(32, 26, 24, '#7ab8ff')
    + S('M8 44Q12 10 54 5Q30 16 28 45Z', '#bfe6ff') + F('M14 40Q18 16 44 9Q28 18 26 42Z', '#4f8fe8', 0.55)
    + L('M10 41Q15 14 50 7', '#ffffff', 1.6) + SP(50, 22, 3.5) + SP(18, 14, 2.6),
  // Danku Primer: the hexagonal Bakudo wall.
  scroll_soul_ward: SUP.soul()
    + S(poly([32, 4], [50, 14], [50, 35], [32, 45], [14, 35], [14, 14]), '#7fd8ff')
    + L(poly([32, 12], [43, 18], [43, 31], [32, 37], [21, 31], [21, 18]), '#ffffff', 1.6, 0.85)
    + L('M32 4V12M50 14L43 18M50 35L43 31M32 45V37M14 35L21 31M14 14L21 18', '#3a8fc8', 1.4)
    + H('M17 15L31 7V10L18 17Z', 0.55) + SP(32, 24.5, 4.5),
  // Sajo Sabaku Primer: Bakudo #63, a ring of golden binding chain.
  scroll_spirit_chain: SUP.soul() + AURA(32, 25, 22, '#ffd45a') + chainRing + SP(32, 25, 5, '#fff3b0'),

  /* --- Kaio Planet techniques: Hoi-Poi capsule + the move */
  // Kamehameha Capsule: a crackling blue ki ball streaking off.
  scroll_ki_blast: SUP.ki() + AURA(28, 24, 24, '#5ab8ff') + L('M42 16L58 10M44 24H60M42 32L56 38', '#bfe6ff', 2.4)
    + S(circ(28, 24, 14), '#4fb6ff') + F(circ(28, 24, 8), '#dff3ff') + L('M18 14L22 18L19 20L24 24M36 30L33 34L37 35L34 40', '#ffe066', 1.6)
    + H(ell(22, 18, 4, 2.4), 0.7),
  // Saiyan Pride Capsule: golden Super Saiyan hair in a flaring aura.
  scroll_battle_instinct: SUP.ki()
    + S('M32 3Q38 13 44 7Q46 17 54 15Q50 27 56 33Q48 35 50 45H14Q16 35 8 33Q14 27 10 15Q18 17 20 7Q26 13 32 3Z', '#ffd23a', { w: 2 })
    + S('M20 34Q14 22 17 11L24 20Q23 9 32 5Q35 12 36 18Q40 9 47 8Q45 17 44 22Q50 19 53 23Q47 28 44 34Z', '#ffe066')
    + S(ell(32, 35, 9, 9.5), '#f2c39a', { w: 2 }) + L('M26 32L30 33.5M38 32L34 33.5', ART_INK, 1.8)
    + F(circ(29, 36, 1.3), '#2a9a8a') + F(circ(35, 36, 1.3), '#2a9a8a') + L('M30 40.5H34', ART_INK, 1.4),
  // Turtle Shell Capsule: Master Roshi's weighted training shell.
  scroll_iron_body: SUP.ki() + S(ell(32, 26, 23, 20), '#e8c060') + S(ell(32, 25, 19, 16.5), '#3f9a4a')
    + L(poly([32, 17], [40, 21], [40, 30], [32, 34], [24, 30], [24, 21]), '#255a2c', 1.8)
    + L('M32 17V9M40 21L48 16M40 30L49 34M32 34V41M24 30L15 34M24 21L16 16', '#255a2c', 1.8)
    + S('M14 14Q12 6 20 8L22 12Q18 11 18 16Z', '#8a5a2a', { w: 1.6 }) + S('M50 14Q52 6 44 8L42 12Q46 11 46 16Z', '#8a5a2a', { w: 1.6 })
    + H(ell(24, 15, 5, 2.2), 0.5),
  // King Kai Capsule: the Kai's antennae and round sunglasses — meditate, then train.
  scroll_zen_focus: SUP.ki() + L('M26 16Q22 10 20 4M38 16Q42 10 44 4', ART_INK, 2.2) + S(circ(20, 5, 2.6), '#1c1424', { w: 1.4 }) + S(circ(44, 5, 2.6), '#1c1424', { w: 1.4 })
    + S(ell(32, 29, 17, 14.5), '#4f8fe8') + S(ell(26, 27, 5.2, 4.2), '#1c1424', { w: 1.6 }) + S(ell(38, 27, 5.2, 4.2), '#1c1424', { w: 1.6 })
    + L('M31 27H33', ART_INK, 1.6) + H(ell(24.5, 25.5, 2, 1.1), 0.7) + H(ell(36.5, 25.5, 2, 1.1), 0.7)
    + L('M26 36Q32 40 38 36', ART_INK, 1.8) + L('M14 31L20 32M14 35L20 34M50 31L44 32M50 35L44 34', ART_INK, 1.3) + H(ell(24, 19, 5, 2.2), 0.4),

  /* --- Green Island techniques: Nen card + the category's power */
  // Jajanken Rock Card: Gon's fist charged with a burst of aura.
  scroll_nen_enhance: SUP.hunter() + S(star(32, 31, 26, 15, 12), '#ffd23a', { w: 2 }) + F(star(32, 31, 15, 9, 12), '#fff3a0')
    + ROT(-18, 32, 34, TR('translate(5 4) scale(0.84)', fist('#f2c39a', dk('#f2c39a', 0.4)) + S(rect(20, 52, 26, 7, 2), '#3f9a4a', { w: 2 }))),
  // Aura Bullet Card: a spray of Nen bullets streaking out.
  scroll_nen_emit: SUP.hunter() + L('M12 52L30 32M10 40L26 28M22 54L38 40M16 30L28 22M34 50L44 42', '#7ae0ff', 2.4, 0.8)
    + [[32, 30, 6], [26, 20, 4.8], [44, 40, 5], [40, 18, 5.4], [50, 28, 4.6]].map(([x, y, r]) => AURA(x, y, r + 5, '#5ad8ff') + S(circ(x, y, r), '#7ae0ff', { w: 1.8 }) + H(ell(x - r * 0.35, y - r * 0.35, r * 0.4, r * 0.25), 0.8)).join(''),
  // Holy Chain Card: Kurapika's conjured chain with its judgment blade.
  scroll_nen_conjure: SUP.hunter() + AURA(32, 32, 26, '#9fdcff') + S(circ(9, 55, 4.2), '#d7dee8', { w: 1.8 }) + F(circ(9, 55, 1.8), '#2b2f45') + chainDiag
    + ROT(45, 49, 15, S('M49 3L53 13L49 25L45 13Z', '#e8edf3', { w: 2 }) + L('M49 6V21', '#9aa4b4', 1.2)) + SP(54, 32, 3.5),
  // Marionette Card: a puppeteer's control cross, Nen threads ending in needles.
  scroll_nen_manip: SUP.hunter() + L('M16 12L13 44M48 12L51 44M32 22V48M24 12L23 40M40 12L41 40', '#8a5ae8', 1.6)
    + S(rect(12, 8, 40, 6, 2), '#a86a3a', { w: 2 }) + S(rect(29, 4, 6, 20, 2), '#a86a3a', { w: 2 }) + H('M14 9H50V10.5H14Z', 0.4)
    + [[13, 44], [51, 44], [32, 48], [23, 40], [41, 40]].map(([x, y]) => S(rect(x - 1.3, y, 2.6, 12, 1.2), '#c9d1dc', { w: 1.4 }) + S(circ(x, y, 2.6), '#8a5ae8', { w: 1.4 })).join(''),
  // Bungee Gum Card: Hisoka's pink aura, stretchy and sticky.
  scroll_nen_trans: SUP.hunter()
    + S('M14 40Q26 34 30 29Q34 24 41 13L49 19Q39 26 35 32Q31 39 24 49Z', '#ff7ab8')
    + S('M38 14Q40 4 50 6Q58 8 56 17Q54 24 46 22Q38 22 38 14Z', '#ff7ab8') + S('M10 44Q8 36 16 36Q24 37 24 45Q24 54 16 53Q10 52 10 44Z', '#ff7ab8')
    + F('M20 52Q21 57 19 59Q17 57 18 52Z', '#ff7ab8') + H(ell(46, 10, 4, 2), 0.7) + H(ell(14, 40, 3, 1.6), 0.7) + L('M26 38Q32 30 40 20', '#ffd0e6', 1.4),
  // Emperor Time Card: Kurapika's Scarlet Eye.
  scroll_nen_special: SUP.hunter() + AURA(32, 32, 30, '#ff3a4a')
    + S('M6 32Q32 8 58 32Q32 56 6 32Z', '#f7f2e6') + S(circ(32, 32, 11.5), '#e0202f') + F(circ(32, 32, 5), '#5a0a10')
    + L('M10 26L6 22M18 19L15 14M27 15L26 10M37 15L38 10M46 19L49 14M54 26L58 22', ART_INK, 1.8) + H(ell(28, 27, 3.4, 2), 0.85) + SP(52, 46, 3.5, '#ffb0b0'),

  /* --- Shinjuku techniques: ofuda talisman + the Domain */
  // Iron Mountain Ofuda: Jogo's Coffin of the Iron Mountain, a volcano erupting.
  scroll_domain_blaze: SUP.hex() + AURA(32, 30, 26, '#ff7a2a')
    + S('M24 28Q20 14 27 16Q27 6 33 11Q39 4 40 16Q46 14 41 28Z', '#ff7a2a', { w: 2 }) + F('M28 28Q26 20 30 20Q31 13 34 17Q38 13 37 28Z', '#ffe066')
    + S('M6 54L22 28Q32 24 42 28L58 54Z', '#5a3e34') + F('M32 26L42 28L58 54H40Z', '#3e2a24', 0.6)
    + S('M22 28Q32 24 42 28L38 33Q32 30 26 33Z', '#ff5a1a', { w: 1.6 }) + L('M28 33L24 44M37 33L40 42', '#ff7a2a', 2.2) + SP(14, 18, 3.5),
  // Thunder Domain Ofuda: a storm dome split by lightning, wind wrapping it.
  scroll_domain_storm: SUP.hex() + S(rect(6, 48, 52, 6, 2.5), '#3a2a6a', { w: 2 }) + S('M9 49Q9 16 32 14Q55 16 55 49Z', '#5a4ad0')
    + L('M16 49Q16 24 32 21Q48 24 48 49M24 49Q24 30 32 28Q40 30 40 49', lt('#5a4ad0', 0.35), 1.4, 0.7)
    + S(poly([36, 8], [24, 32], [32, 32], [26, 52], [42, 26], [34, 26], [40, 8]), '#ffe066', { w: 2 })
    + L('M4 30Q16 22 26 26M60 38Q50 30 42 36', '#bfe6ff', 2) + H('M14 36Q16 22 28 18Q20 26 18 38Z', 0.35),
  // Crimson Garden Ofuda: a blood-red bloom crossed by cursed slashes.
  scroll_domain_garden: SUP.hex() + S('M30 42Q26 52 22 58L25 59Q30 52 33 43Z', '#3f7a3a', { w: 1.6 })
    + S('M28 50Q16 50 12 42Q22 40 28 48Z', '#3f9a4a', { w: 1.6 }) + S('M32 50Q44 52 50 44Q40 40 32 48Z', '#3f9a4a', { w: 1.6 })
    + S(circ(32, 28, 16), '#c81e3a') + L('M32 28Q36 27 35 31Q32 34 28 31Q26 25 32 23Q40 22 41 30Q41 39 32 40Q22 40 21 30', dk('#c81e3a', 0.45), 2)
    + H(ell(25, 19, 5, 2.4), 0.45) + F('M8 14L56 34L55 36.5L7 16.5Z', '#1c1424') + F('M10 22L54 40L53 42.5L9 24.5Z', '#1c1424'),
  // Sanctuary Ofuda: a red torii gate glowing with healing light.
  scroll_domain_shrine: SUP.hex() + AURA(32, 38, 22, '#7dff9a')
    + S(rect(17, 20, 6, 36, 1), '#d8402f') + S(rect(41, 20, 6, 36, 1), '#d8402f') + S(rect(15.5, 52, 9, 5, 1), '#2a2030', { w: 1.8 }) + S(rect(39.5, 52, 9, 5, 1), '#2a2030', { w: 1.8 })
    + S(rect(11, 29, 42, 4.5, 1), '#d8402f', { w: 2 }) + S(rect(10, 18, 44, 5, 1), '#d8402f', { w: 2 })
    + S('M5 11Q32 18 59 11L57 18Q32 23 7 18Z', '#2a2030') + S(rect(29, 21, 6, 9, 1), '#f4ecd6', { w: 1.6 })
    + SP(32, 43, 7, '#c8ffd4') + SP(50, 8, 3),
});
})();
