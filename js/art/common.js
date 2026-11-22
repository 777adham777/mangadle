'use strict';
/* Item art — shared families: tools, scrolls, gems, chests, traps. See js/item-art.js for the helpers and style rules. */
(() => {
const { S, F, L, H, SP, AURA, T, G, GL, lt, dk, mix, circ, ell, rect, poly, star, ROT, TR } = ARTK;
const n = (v) => +v.toFixed(2);
// rotate every "x y" pair of an absolute M/L/Q/C path by a degrees around (cx,cy)
const rd = (d, a, cx, cy) => { const c = Math.cos(a * Math.PI / 180), s = Math.sin(a * Math.PI / 180);
  return d.replace(/(-?[\d.]+) (-?[\d.]+)/g, (_, x, y) => { x -= cx; y -= cy; return `${n(cx + x * c - y * s)} ${n(cy + x * s + y * c)}`; }); };

/* ---- Technique scrolls: one base for all 33, an unrolled handscroll with rollers left and right.
   The world shows in the paper, roller and border colours [paper, roller, border]; the technique is painted on the paper. */
const W = {
    shinobi: ['#f3e3b8', '#b8402f', '#a3824f'], seas: ['#ecd39a', '#8a5a32', '#8a5a32'], soul: ['#eeeaf4', '#2e2840', '#6a5a8a'],
    ki: ['#e6eefa', '#ff8a2a', '#7a9cc8'], hunter: ['#eef5e4', '#2a8a5a', '#d4a03a'], hex: ['#f4ecd6', '#4a2a5a', '#c0392b'] };
const B = (w) => { const [p, r, b] = W[w];
  return S(rect(9, 13, 46, 38, 1), p, { w: 2 }) + F('M47 14H54V50H10V46.5H47Z', dk(p, 0.1)) + L(rect(14, 17, 36, 30, 1), b, 1.3, 0.6)
    + S(circ(8, 7.5, 2.8) + circ(8, 56.5, 2.8) + circ(56, 7.5, 2.8) + circ(56, 56.5, 2.8), '#e0b04a', { w: 1.8 })
    + S(rect(4, 9, 8, 46, 3.5) + rect(52, 9, 8, 46, 3.5), r, { w: 2 }) + H('M6 13H8V44H6ZM12 15H42V16.4H12Z', 0.45); };
// a fist seen from the knuckles (Haki fist, Jajanken rock)
const fist = (c) => S('M18 33H48V42Q48 50 39 50H27Q18 50 18 42Z', c) + F('M43 34H48V42Q48 50 39 50Q43 45 43 34Z', dk(c, 0.3))
  + S(rect(18, 18, 8, 18, 4) + rect(25.5, 16, 8, 19, 4) + rect(33, 16, 8, 19, 4) + rect(40.5, 18, 7.5, 18, 3.7), c, { w: 1.8 })
  + L('M19.5 27H24.5M27 26H32M34.5 26H39.5M42 27H46.5', dk(c, 0.35), 1.3)
  + S('M18 43Q17 35 23 35L36 37Q40 39 37 42L27 44Q19 47 18 43Z', c, { w: 1.8 })
  + H(ell(22, 20.5, 2, 1.1) + ell(29.5, 18.5, 2, 1.1) + ell(37, 18.5, 2, 1.1) + ell(44, 20.5, 2, 1.1), 0.6);
// kunai pointing up from the ring at (32,45)
const KB = 'M32 14Q36.5 22 34.6 30L29.4 30Q27.5 22 32 14Z', KG = 'M28 30L36 30L36 33L28 33ZM30.4 33L33.6 33L33.6 42L30.4 42Z';
const petal = (len, wd) => `M32 47Q${32 - wd} ${n(47 - len * 0.45)} 32 ${47 - len}Q${32 + wd} ${n(47 - len * 0.45)} 32 47Z`;

Object.assign(ART, {
  /* --- random-technique scrolls: the world's emblem painted on its scroll */
  // Leaf Jutsu Scroll: the Leaf symbol brushed in ink and a red seal stamp.
  scroll_shinobi: B('shinobi') + L('M21 33Q26 23 34 25Q44 27 41 36Q37 43 30 38Q26 34 31 31M41 36L48 42', '#3b2a1a', 3.4)
    + S(rect(15, 38, 8, 8, 1), '#c0392b', { w: 1.8 }) + L('M17.5 40.5H20.5M19 40.5V44', '#f3e3b8', 1.3),
  // Grand Line Chart: an island and a dotted route to a red X.
  scroll_seas: B('seas') + S('M17 27Q19 19 27 21Q33 15 39 21Q45 23 43 29Q41 35 33 33Q25 37 19 33Q15 31 17 27Z', '#8cc060', { w: 1.8 })
    + F('M39 21Q45 23 43 29Q41 35 33 33Q40 29 39 21Z', dk('#8cc060', 0.3)) + H(ell(24, 24.5, 3.5, 1.6), 0.5)
    + L('M30 35Q30 42 37 42', '#8a3a1a', 1.8).replace('/>', ' stroke-dasharray="2 2.6"/>') + L('M40 37L46 43M46 37L40 43', '#c0392b', 2.6),
  // Kido Primer: a Hell Butterfly, messenger of the Soul Society.
  scroll_soul: B('soul') + S('M32 30Q22 16 19 25Q19 31 31 32Q22 36 24 42Q28 44 32 34Q36 44 40 42Q42 36 33 32Q45 31 45 25Q42 16 32 30Z', '#7a44d0', { w: 1.8 })
    + F('M33 32Q42 36 40 42Q36 44 32 34ZM34 28Q42 18 45 25Q45 31 33 32Z', dk('#7a44d0', 0.3)) + F(ell(25, 25, 2.4, 1.8) + ell(39, 25, 2.4, 1.8), '#d0a8ff')
    + F(rect(31, 24, 2, 16, 1), '#1c1424') + H(ell(23, 22.5, 2.4, 1.2), 0.5),
  // Hoi-Poi Capsule: a Capsule Corp capsule.
  scroll_ki: B('ki') + ROT(-35, 32, 32, S(rect(13, 25, 38, 14, 7), '#f6f8fb') + S('M37 25H44A7 7 0 0 1 44 39H37Z', '#ff8a2a')
    + F(rect(35, 25, 2, 14), '#9aa4b4') + F('M14 35H35V38.5H18Q15 38 14 35Z', dk('#f6f8fb', 0.15)) + S(circ(21, 32, 2.6), '#ff8a2a', { w: 1.8 }) + H('M17 27.5H33V29.5H17Z', 0.6))
    + SP(47, 19, 3, '#ffffff'),
  // Greed Island Card: a spell card, its gem and the island in its picture window.
  scroll_hunter: B('hunter') + ROT(8, 32, 32, S(rect(22, 15, 20, 34, 2.5), '#fbf6ea', { w: 2 }) + L(rect(24.5, 17.5, 15, 29, 1.5), '#d4a03a', 1.4)
    + S(rect(26, 22, 12, 11, 1), '#5ab8ff', { w: 1.8 }) + S('M27 33Q28 27 32 27Q37 27 37 33Z', '#3f9a4a', { w: 1.8 })
    + L('M26 38H38M26 42H35', '#a3824f', 1.4) + S('M32 15L35 18L32 21L29 18Z', '#d8402f', { w: 1.8 }) + H(rect(23.5, 22, 1.6, 14, 0.8), 0.5)),
  // Cursed Ofuda: the seal mark torn by black claw slashes, cursed energy seeping out.
  scroll_hex: B('hex') + L(circ(32, 30, 8) + 'M32 18V46M25 42H39', '#c0392b', 2.2)
    + F('M15 20Q33 27 50 33Q33 30 15 20ZM14 27Q32 34 50 40Q32 37 14 27ZM15 34Q32 41 48 47Q32 44 15 34Z', '#2a1438'),

  /* --- Leaf Village techniques */
  // Shadow Clone Scroll: a ninja and his purple shadow clone.
  scroll_shadow_strike: B('shinobi') + F(circ(25, 27, 7.5) + 'M13 49Q14 39 25 38Q36 39 37 49Z', '#8a5ae8', 0.5)
    + S('M24 49Q25 38 37 37Q49 38 50 49Z', '#2a2c48') + F('M42 38Q49 39 50 49H45Q45 42 42 38Z', '#454a70') + S(circ(37, 27, 8.5), '#2a2c48')
    + S(rect(27.5, 21, 19, 5, 1.5), '#c9d3df', { w: 1.8 }) + L('M46.5 23L52 19M46.5 24L51 28', '#2f4fb8', 2)
    + F('M31 28.5H43L42 31H32Z', '#f2e8d8') + F(circ(34.5, 29.6, 0.9) + circ(39.5, 29.6, 0.9), '#d8402f') + H(ell(30, 42, 3.5, 1.4), 0.45),
  // Kunai Barrage Scroll: three kunai fanned from one ring.
  scroll_kunai_volley: B('shinobi') + L('M14 30Q19 25 21 19M50 30Q45 25 43 19', '#7ab8e8', 1.8)
    + S(rd(KB, -30, 32, 45) + rd(KB, 30, 32, 45), '#d7dee8', { w: 2 }) + S(rd(KG, -30, 32, 45) + rd(KG, 30, 32, 45), '#2b2f45', { w: 1.8 })
    + S(KB, '#d7dee8', { w: 2 }) + F('M32.6 17Q35 23 34 29H32.6Z', dk('#d7dee8', 0.2)) + S(KG, '#2b2f45', { w: 1.8 })
    + S(circ(32, 45, 3.4), '#ffcf3f', { w: 1.8 }) + F(circ(32, 45, 1.4), '#2b2f45') + H('M31 19L30.4 27H31.6Z', 0.6),
  // Phoenix Flower Scroll: a lotus of fire.
  scroll_fire_lotus: B('shinobi')
    + S(rd(petal(24, 8), -62, 32, 47) + rd(petal(24, 8), 62, 32, 47), '#d8402f', { w: 2 })
    + S(rd(petal(29, 9), -30, 32, 47) + rd(petal(29, 9), 30, 32, 47), '#ff6a2a', { w: 2 })
    + S(petal(33, 10), '#ff9a2a', { w: 2 }) + F('M32 14Q42 32 32 47Q37 32 32 14Z', dk('#ff9a2a', 0.15)) + F(petal(20, 4.5), '#ffe066')
    + S(ell(32, 47, 11, 3.4), '#8a2a1c', { w: 2 }) + H(ell(28.5, 28, 1.4, 4), 0.5),
  // Mystical Palm Scroll: a medical ninja's open hand glowing green.
  scroll_healing_palm: B('shinobi')
    + S(rect(21, 24, 5, 14, 2.5) + rect(26.5, 18, 5.4, 19, 2.7) + rect(32.3, 19, 5.4, 18, 2.7) + rect(38, 24, 5, 14, 2.5), '#f2c39a', { w: 1.8 })
    + S('M23 41Q16 38 15 32Q15.5 29 18.5 30.5L24 36Z', '#f2c39a', { w: 1.8 }) + S('M21 34H43V42Q43 50 34 50H30Q21 50 21 42Z', '#f2c39a')
    + F('M39 35H43V42Q43 50 34 50Q39 46 39 35Z', dk('#f2c39a', 0.25)) + H(rect(27.8, 20.5, 1.6, 9, 0.8), 0.5)
    + F(circ(32, 41, 5.5), '#7dff9a', 0.85) + L(circ(32, 41, 8), '#2f9f4a', 1.6) + SP(32, 41, 3.6),
  // Hidden Mist Scroll: a mist cloud swallowing a trail of ninja footsteps.
  scroll_mist_step: B('shinobi') + F(ell(18, 46.5, 2, 2.8) + circ(18, 42.6, 0.9), '#2a4058', 0.85) + F(ell(24.5, 43.5, 2, 2.8) + circ(24.5, 39.6, 0.9), '#2a4058', 0.6)
    + F(ell(31, 46.5, 2, 2.8) + circ(31, 42.6, 0.9), '#2a4058', 0.35)
    + S('M14 37Q10 29 18 27Q18 19 27 20Q32 13 40 18Q49 16 49 25Q55 28 52 35Q50 39 44 39H19Q14 40 14 37Z', '#c9dbe8')
    + F('M15 37Q19 33 25 35Q31 32 37 35Q43 32 51 35Q50 39 44 39H19Q15 39 15 37Z', dk('#c9dbe8', 0.2))
    + L('M20 28Q25 23 30 26Q34 29 38 24', '#ffffff', 1.8, 0.85) + H(ell(24, 23, 3.5, 1.6), 0.55) + L('M36 43Q43 40 50 43', '#a8c4d8', 1.6),
  // Earth Armor Scroll: skin hardened into a shield of stone plates.
  scroll_iron_skin: B('shinobi') + S('M32 15L47 20V31Q47 43 32 50Q17 43 17 31V20Z', '#8b8f9c') + F('M32 15L47 20V31Q47 43 32 50Z', dk('#8b8f9c', 0.2))
    + L('M24 17.5L23 27L28 33L25 43M40 17.5L41 27L36 33L39 43M23 27H17M41 27H47M28 33H36', '#4a4e5a', 1.6)
    + H('M19 21L30 17V20L20 24Z', 0.5) + SP(44, 19, 3),
  // Eight Trigrams Scroll: the spiral seal formula ringed by the eight trigrams, crackling blue.
  scroll_sealing_mark: B('shinobi')
    + F([0, 45, 90, 135, 180, 225, 270, 315].map((a) => rd('M28.5 15L35.5 15L35.5 16.6L28.5 16.6ZM28.5 17.8L35.5 17.8L35.5 19.4L28.5 19.4Z', a, 32, 32)).join(''), '#3b2a1a')
    + L(circ(32, 32, 10.5), '#3b2a1a', 1.8) + L('M32 32Q35 31 35 34Q35 37.5 30.5 37.5Q26 37 26 32Q26 26 32 26Q38.5 26 38.5 33', '#3b2a1a', 2)
    + L('M45 40L49 43L46.5 44L50 48M19 15.5L15 19L17.5 20L14 24', '#3a8ae8', 1.8),

  /* --- Orange Town techniques */
  // Armament Haki Manual: a fist coated in glossy black Haki, purple sparks.
  scroll_iron_fist: B('seas') + fist('#3a3050') + L('M13 20L16.5 17L16 21L19.5 18M47 46L50.5 43L50 47L53 44', '#9a5ae8', 1.8),
  // Kenbunshoku Manual: a brass spyglass that sees what comes next, sensing ripples ahead.
  scroll_foresight: B('seas') + ROT(-30, 32, 32, S(rect(12, 29, 12, 8, 2), '#6a4a2a', { w: 1.8 }) + S(rect(22, 27.5, 12, 11, 2), '#d4a03a')
    + S(rect(32, 26, 14, 14, 2), '#e0b04a') + F(rect(33.5, 35, 11, 3.5, 1), dk('#e0b04a', 0.25)) + S(ell(46.5, 33, 2.8, 7.5), '#bfe6ff', { w: 1.8 })
    + H('M23.5 29.5H32V31H23.5Z', 0.6) + H('M34 28H44V29.6H34Z', 0.6))
    + L('M48 19Q51.5 21.5 51 25.5M50.5 15.5Q55 19 54 25', '#2f8ad8', 1.8),
  // Gaon Cannon Manual: a ship's cannon firing, a muzzle flash.
  scroll_cannon_volley: B('seas') + S(star(47, 21, 7, 3.5, 8), '#ffb43a', { w: 1.8 }) + F(star(47, 21, 3.5, 2, 8), '#fff3a0')
    + ROT(-25, 30, 36, S('M14 31H44V41H14Q10 41 10 36Q10 31 14 31Z', '#3a3d4a') + F('M14 38H44V41H14Z', dk('#3a3d4a', 0.3)) + S(rect(42, 29, 6, 14, 2), '#2a2c38', { w: 2 })
    + F(rect(20, 31, 2.5, 10) + rect(32, 31, 2.5, 10), '#d4a03a') + H('M14 32.6H40V34.2H14Z', 0.45))
    + S(circ(24, 43, 6), '#8a5a2a', { w: 2 }) + F(circ(24, 43, 2), '#2a1a10') + L('M24 38.6V40.6M24 45.4V47.4M19.6 43H21.6M26.4 43H28.4', dk('#8a5a2a', 0.4), 1.3),

  /* --- Soul City techniques */
  // Getsuga Tensho Primer: the blue-white crescent of a zanpakuto's slash.
  scroll_reaper_slash: B('soul')
    + S('M13 46Q16 16 50 13Q31 22 29 47Z', '#bfe6ff') + F('M18 42Q22 20 43 16Q30 24 28 44Z', '#4f8fe8', 0.55)
    + L('M15 43Q19 18 46 14.5', '#ffffff', 1.6) + SP(45, 39, 3, '#7ab8ff'),
  // Danku Primer: the hexagonal Bakudo wall.
  scroll_soul_ward: B('soul') + S('M32 16L46 24V40L32 48L18 40V24Z', '#7fd8ff') + F('M32 32L46 24V40L32 48Z', dk('#7fd8ff', 0.2))
    + L('M32 22L41 27V37L32 42L23 37V27Z', '#ffffff', 1.5, 0.85) + L('M32 16V22M46 24L41 27M46 40L41 37M32 48V42M18 40L23 37M18 24L23 27', '#3a8fc8', 1.3)
    + H('M20 25L31 18.5V21L21 27Z', 0.55) + SP(32, 32, 4),
  // Sajo Sabaku Primer: Bakudo #63, a ring of golden binding chain.
  scroll_spirit_chain: B('soul')
    + S(circ(40.5, 23.5, 2.6) + circ(40.5, 40.5, 2.6) + circ(23.5, 40.5, 2.6) + circ(23.5, 23.5, 2.6), '#e8b83a', { w: 1.8 })
    + S(ell(32, 20, 5.5, 3.4) + ell(44, 32, 3.4, 5.5) + ell(32, 44, 5.5, 3.4) + ell(20, 32, 3.4, 5.5), '#ffd45a', { w: 1.8 })
    + F(ell(32, 20, 2.8, 1.1) + ell(44, 32, 1.1, 2.8) + ell(32, 44, 2.8, 1.1) + ell(20, 32, 1.1, 2.8), '#5a3a10')
    + H(ell(29.5, 18.4, 1.6, 0.8) + ell(18.6, 29.5, 0.8, 1.6), 0.6) + SP(32, 32, 4.5, '#fff3b0'),

  /* --- Kaio Planet techniques */
  // Kamehameha Capsule: a crackling blue ki ball streaking off.
  scroll_ki_blast: B('ki') + L('M38 22L50 18M40 30.5H51M38 39L49 43', '#4fb6ff', 2.2)
    + S(circ(28, 31, 11), '#4fb6ff') + F('M35 23A11 11 0 0 1 28 42Q35 37 35 23Z', dk('#4fb6ff', 0.25)) + F(circ(28, 31, 6), '#dff3ff')
    + L('M19 22L22 25L20 26.5L23.5 29.5M33 34L31 37.5L34 38L32 41.5', '#ffd23a', 1.5) + H(ell(23, 25, 3, 1.8), 0.7),
  // Saiyan Pride Capsule: golden Super Saiyan hair over a fierce face.
  scroll_battle_instinct: B('ki')
    + S('M32 13Q36 19 40 15Q42 21 48 19Q46 26 50 30Q44 31 45 38H19Q20 31 14 30Q18 26 16 19Q22 21 24 15Q28 19 32 13Z', '#ffd23a', { w: 2 })
    + F('M40 15Q42 21 48 19Q46 26 50 30Q44 31 45 38H40Q42 26 40 15Z', dk('#ffd23a', 0.2)) + S(ell(32, 39, 8.5, 9), '#f2c39a', { w: 2 })
    + S('M23.5 34Q25 25 29.5 29Q32 22 34.5 29Q39 25 40.5 34Q32 30 23.5 34Z', '#ffe066', { w: 1.8 })
    + L('M26.5 36L30 37.5M37.5 36L34 37.5', '#1c1424', 1.6) + F(circ(29, 40, 1.1) + circ(35, 40, 1.1), '#2a9a8a') + L('M30 44.5H34', '#1c1424', 1.3)
    + H('M20 26Q22 20 26 19Q23 23 22 28Z', 0.55),
  // Turtle Shell Capsule: Master Roshi's weighted training shell.
  scroll_iron_body: B('ki') + S('M16 22Q14 14 21 15L23 19Q19 18 19 22ZM48 22Q50 14 43 15L41 19Q45 18 45 22Z', '#8a5a2a', { w: 1.8 })
    + S(ell(32, 32.5, 18, 15), '#e8c060') + S(ell(32, 31.5, 14.5, 12), '#3f9a4a') + F('M43.1 23.8A14.5 12 0 0 1 32 43.5Q41 39 43.1 23.8Z', dk('#3f9a4a', 0.3))
    + L('M32 25L38 28.5V34.5L32 38L26 34.5V28.5ZM32 25V19.5M38 28.5L44 25.5M38 34.5L44 37.5M32 38V43.5M26 34.5L20 37.5M26 28.5L20 25.5', '#255a2c', 1.6)
    + H(ell(25, 23, 4, 1.8), 0.5),
  // King Kai Capsule: the Kai's antennae and round sunglasses — meditate, then train.
  scroll_zen_focus: B('ki') + L('M27 23L24 16M37 23L40 16', '#1c1424', 2) + S(circ(24, 15.5, 2.2) + circ(40, 15.5, 2.2), '#2a2440', { w: 1.8 })
    + S(ell(32, 34, 14, 12.5), '#4f8fe8') + F('M42 25.5A14 12.5 0 0 1 32 46.5Q41 41 42 25.5Z', dk('#4f8fe8', 0.25))
    + S(ell(27, 32, 4.4, 3.6) + ell(37, 32, 4.4, 3.6), '#2a2440', { w: 1.8 }) + L('M31.4 32H32.6', '#1c1424', 1.6)
    + H(ell(25.6, 30.8, 1.6, 0.9) + ell(35.6, 30.8, 1.6, 0.9), 0.7) + L('M27 39Q32 42.5 37 39', '#1c1424', 1.6)
    + L('M15 34L19.5 35M15 37.5L19.5 37M49 34L44.5 35M49 37.5L44.5 37', '#1c1424', 1.3) + H(ell(25, 25, 4, 1.8), 0.45),

  /* --- Green Island techniques */
  // Jajanken Rock Card: Gon's fist charged with a burst of aura.
  scroll_nen_enhance: B('hunter') + S(star(32, 33, 19.5, 12, 10), '#ffd23a', { w: 2 }) + F(star(32, 33, 12, 8, 10), '#fff3a0') + fist('#f2c39a'),
  // Aura Bullet Card: a spray of Nen bullets streaking out.
  scroll_nen_emit: B('hunter') + L('M14 48L26 37M14 39L19 33M22 49L36 41M30 21L22 26', '#3ab8e0', 1.8, 0.8)
    + S(circ(30, 34, 6) + circ(22, 24, 4.5) + circ(42, 22, 5) + circ(43, 40, 4.5), '#7ae0ff', { w: 1.8 })
    + F('M34.5 30A6 6 0 0 1 30 40Q34 37 34.5 30Z', dk('#7ae0ff', 0.25))
    + H(ell(27.8, 31.8, 2.2, 1.4) + ell(20.4, 22.4, 1.6, 1) + ell(40.2, 20.2, 1.8, 1.1) + ell(41.4, 38.4, 1.6, 1), 0.75),
  // Holy Chain Card: Kurapika's conjured chain ending in its judgment blade.
  scroll_nen_conjure: B('hunter')
    + S(circ(20.5, 41.5, 2.2) + circ(29.5, 32.5, 2.2), '#9aa4b4', { w: 1.8 })
    + S(circ(16, 46, 3.6) + circ(25, 37, 3.6) + circ(34, 28, 3.6), '#d7dee8', { w: 1.8 }) + F(circ(16, 46, 1.5) + circ(25, 37, 1.5) + circ(34, 28, 1.5), '#2b2f45')
    + S('M36.5 27.5L42 19L50 14L45 22Z', '#e8edf3', { w: 1.8 }) + F('M50 14L45 22L36.5 27.5Z', dk('#e8edf3', 0.2)) + H(ell(14.6, 44.6, 1.2, 0.7), 0.7) + SP(46, 36, 3),
  // Marionette Card: a puppeteer's control cross, Nen threads ending in needles.
  scroll_nen_manip: B('hunter') + L('M18 19L16 38M46 19L48 38M32 28V42M24 19L24 35M40 19L40 35', '#8a5ae8', 1.3)
    + S(rect(15, 15, 34, 5, 2), '#a86a3a', { w: 2 }) + S(rect(29.5, 12.5, 5, 17, 2), '#a86a3a', { w: 2 }) + H('M17 16H33V17.3H17Z', 0.5)
    + S(rect(14.8, 38, 2.4, 10, 1.2) + rect(46.8, 38, 2.4, 10, 1.2) + rect(30.8, 42, 2.4, 8, 1.2) + rect(22.8, 35, 2.4, 10, 1.2) + rect(38.8, 35, 2.4, 10, 1.2), '#c9d1dc', { w: 1.8 })
    + S(circ(16, 38, 2.2) + circ(48, 38, 2.2) + circ(32, 42, 2.2) + circ(24, 35, 2.2) + circ(40, 35, 2.2), '#8a5ae8', { w: 1.8 }),
  // Bungee Gum Card: Hisoka's pink aura, stretchy and sticky.
  scroll_nen_trans: B('hunter') + S('M17 42Q26 37 30 32Q34 27 39 19L45 23Q38 29 35 34Q31 40 23 47Z', '#ff7ab8')
    + S('M37 19Q38 12 45 13Q51 14 50 20Q49 26 43 25Q37 25 37 19Z', '#ff7ab8') + S('M14 44Q13 38 19 38Q25 39 25 45Q25 50 19 50Q14 49 14 44Z', '#ff7ab8')
    + F('M48 16Q51 20 48 24Q45 26 41 25Q48 22 48 16Z', dk('#ff7ab8', 0.25)) + L('M27 37Q32 31 39 22', '#ffd0e6', 1.4)
    + H(ell(42, 16.5, 2.6, 1.4) + ell(17, 41, 2, 1.2), 0.65),
  // Emperor Time Card: Kurapika's Scarlet Eye.
  scroll_nen_special: B('hunter')
    + S('M12 32Q32 14 52 32Q32 50 12 32Z', '#fbf6ea') + F('M14 33Q32 47 50 33Q32 44 14 33Z', dk('#fbf6ea', 0.15))
    + S(circ(32, 32, 9), '#e0202f', { w: 2 }) + F(circ(32, 32, 4), '#5a0a10')
    + L('M16 27.5L13 24.5M22 22.5L20 19M29 20L28.5 16.5M35 20L35.5 16.5M42 22.5L44 19M48 27.5L51 24.5', '#1c1424', 1.6) + H(ell(28.5, 28.5, 2.6, 1.6), 0.8),

  /* --- Shinjuku techniques */
  // Iron Mountain Ofuda: Jogo's Coffin of the Iron Mountain, a volcano erupting.
  scroll_domain_blaze: B('hex')
    + S('M26 29Q22 19 28 20Q28 12 33 16Q38 10 39 20Q44 19 39 29Z', '#ff7a2a', { w: 2 }) + F('M29 29Q27 23 30.5 23Q31 17 34 20Q37 17 36 29Z', '#ffe066')
    + S('M12 50L24 30Q32 26 40 30L52 50Z', '#5a3e34') + F('M32 28L40 30L52 50H40Z', dk('#5a3e34', 0.3))
    + S('M24 30Q32 26 40 30L37 34Q32 31 27 34Z', '#ff5a1a', { w: 1.8 }) + L('M28 34L25 43M37 34L39.5 41', '#ff7a2a', 2) + H('M22 35L25 30L27 31L19 44Z', 0.4),
  // Thunder Domain Ofuda: a storm dome split by lightning, wind wrapping it.
  scroll_domain_storm: B('hex') + S('M13 46Q13 20 32 18Q51 20 51 46Z', '#5a4ad0') + F('M40 20Q51 24 51 46H44Q45 30 40 20Z', dk('#5a4ad0', 0.3))
    + L('M19 46Q19 27 32 24Q45 27 45 46', lt('#5a4ad0', 0.35), 1.3, 0.7) + S(rect(11, 45, 42, 5, 2.5), '#3a2a6a', { w: 2 })
    + S('M36 15L26 32L32.5 32L27 48L41 27L34.5 27L40 15Z', '#ffe066', { w: 1.8 }) + L('M14 30Q20 25 26 27M50 37Q46 33 41 35', '#bfe6ff', 1.8)
    + H('M17 37Q18 26 26 22Q21 29 20 38Z', 0.4),
  // Crimson Garden Ofuda: a blood-red bloom crossed by cursed slashes.
  scroll_domain_garden: B('hex') + S('M31 39Q29 45 26 50L28.5 50.5Q31.5 45 33.5 39.5Z', '#3f7a3a', { w: 1.8 })
    + S('M29 45Q20 46 17 40Q24 37 29 43ZM31 45Q40 47 45 41Q38 37 31 43Z', '#3f9a4a', { w: 1.8 })
    + S(circ(32, 28, 12), '#c81e3a') + F('M40 19A12 12 0 0 1 32 40Q40 34 40 19Z', dk('#c81e3a', 0.25))
    + L('M32 28Q35 27 34.5 30Q32 33 29 30.5Q27.5 26 32 24Q38 23 38.5 29Q38.5 36 32 36.5Q25 36.5 24.5 29', dk('#c81e3a', 0.45), 1.6)
    + H(ell(26.5, 21, 3.5, 1.8), 0.5) + F('M13 18Q33 26 52 30Q33 28 13 18ZM13 25Q33 33 51 38Q33 35 13 25Z', '#2a1438'),
  // Sanctuary Ofuda: a red torii gate glowing with healing light.
  scroll_domain_shrine: B('hex') + SP(32, 40, 6, '#c8ffd4')
    + S(rect(20, 24, 5, 23, 1) + rect(39, 24, 5, 23, 1), '#d8402f', { w: 1.8 }) + S(rect(18.5, 45, 8, 4, 1) + rect(37.5, 45, 8, 4, 1), '#2a2030', { w: 1.8 })
    + S(rect(15, 30, 34, 4, 1), '#d8402f', { w: 1.8 }) + S(rect(14, 21, 36, 4.5, 1), '#d8402f', { w: 2 })
    + S('M10 15Q32 21 54 15L52 21Q32 25 12 21Z', '#2a2030') + S(rect(29.5, 23, 5, 7, 1), '#f4ecd6', { w: 1.8 }) + H(rect(21, 26, 1.4, 16, 0.7), 0.5),
});
})();
