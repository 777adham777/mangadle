'use strict';
/* Item art — Orange Town (One Piece). See js/item-art.js for the helpers and style rules. */
(() => {
const { S, F, L, H, SP, AURA, T, G, GL, lt, dk, mix, circ, ell, rect, poly, star, ROT, TR } = ARTK;
const n = (v) => +v.toFixed(2);
// Devil Fruit swirl: a small open spiral centred near x,y
const sw = (x, y, r) => `M${x} ${y}a${n(r * 0.2)} ${n(r * 0.2)} 0 0 1 ${n(r * 0.4)} 0a${n(r * 0.4)} ${n(r * 0.4)} 0 0 1 ${n(-r * 0.8)} 0a${n(r * 0.6)} ${n(r * 0.6)} 0 0 1 ${n(r * 1.2)} 0`;
const SW = (pts, c, w) => pts.map(([x, y, r]) => L(sw(x, y, r), c, w || 2)).join('');
// thick outlined stroke (tentacles, eels, cords)
const TL = (d, c, w) => L(d, ART_INK, w + 2.6) + L(d, c, w);
// fish body facing right: tail joint at x, nose at x+l
const fishD = (x, y, l, h) => `M${x} ${y}Q${n(x + l * 0.42)} ${y - h} ${x + l} ${y}Q${n(x + l * 0.42)} ${y + h} ${x} ${y}Z`;
const tailD = (x, y, l, h) => `M${x + 2} ${y}L${n(x - l * 0.28)} ${n(y - h * 0.85)}Q${n(x - l * 0.18)} ${y} ${n(x - l * 0.28)} ${n(y + h * 0.85)}Z`;
// Devil Fruit curly stem + leaf
const STEM = (x, y, flip) => TR(flip ? `translate(${2 * x} 0) scale(-1 1)` : '',
  TL(`M${x - 1} ${y + 2}Q${x - 2} ${y - 6} ${x + 3} ${y - 8}Q${x + 8} ${y - 9} ${x + 7} ${y - 4}Q${x + 6} ${y - 1} ${x + 3} ${y - 3}`, '#8ab83a', 2)
  + S(`M${x - 2} ${y - 2}Q${x - 12} ${y - 8} ${x - 16} ${y - 2}Q${x - 8} ${y + 4} ${x - 2} ${y - 2}Z`, '#5fb83a', { w: 1.8 }));

Object.assign(ART, {
  // ---------------------------------------------------------------- fish
  // Minnow: a pair of little silver fish.
  minnow: TR('translate(32 32) scale(1.12) translate(-32 -32)', ROT(-12, 32, 32,
    S(tailD(14, 22, 30, 9), '#7fb0b8', { w: 2 }) + S(fishD(14, 22, 32, 9), '#a9d2d6', { w: 2 })
    + F('M18 24Q30 28 44 23Q30 30 18 24Z', '#eef8f6', 0.8) + F(circ(39, 20, 2.2), ART_INK) + H(ell(28, 17, 6, 1.8), 0.6)
    + TR('translate(64 0) scale(-1 1)',
      S(tailD(14, 42, 30, 9), '#7fb0b8', { w: 2 }) + S(fishD(14, 42, 32, 9), '#a9d2d6', { w: 2 })
      + F('M18 44Q30 48 44 43Q30 50 18 44Z', '#eef8f6', 0.8) + F(circ(39, 40, 2.2), ART_INK))
    + H(ell(34, 37, 6, 1.8), 0.6))),
  // East Blue Bass: chunky green bass, orange spiny fin, big open mouth, stripes.
  reef_bass: S('M48 32L60 18Q57 32 60 46Z', '#e8743a') + S('M22 20L24 9L28 18L31 8L34 18L38 9L41 20Z', '#e8743a', { w: 2 })
    + S('M6 32Q10 16 30 17Q50 18 52 32Q50 46 30 48Q12 48 6 36Z', '#5f9a3a')
    + F('M10 38Q20 46 32 46Q46 44 50 34Q38 42 24 40Q16 40 10 38Z', '#e8e09a', 0.9)
    + F('M24 19Q22 32 26 44L30 45Q26 32 29 18Z', dk('#5f9a3a', 0.4), 0.7) + F('M36 19Q34 32 38 45L42 43Q38 32 41 20Z', dk('#5f9a3a', 0.4), 0.7)
    + S('M5 31L15 33L6 38Z', '#7a1f2a', { w: 1.8 }) + S('M26 42L32 52L36 43Z', '#e8743a', { w: 1.8 })
    + S(circ(17, 26, 3.6), '#ffffff', { w: 1.6, flat: true }) + F(circ(17.6, 26, 1.8), ART_INK)
    + H('M14 22Q24 18 36 20Q24 21 16 25Z', 0.5),
  // Sea Crab: red dock crab, two big pincers, eyes on stalks.
  sea_crab: TL('M18 40L6 36M18 45L6 48M20 49L10 56M46 40L58 36M46 45L58 48M44 49L54 56', '#d8402c', 3)
    + S('M18 34Q6 30 6 18Q8 8 16 8L14 18L22 14Q26 26 22 34Z', '#e0442f', { w: 2.2 })
    + S('M46 34Q58 30 58 18Q56 8 48 8L50 18L42 14Q38 26 42 34Z', '#e0442f', { w: 2.2 })
    + TL('M27 32V24M37 32V24', '#e0442f', 2) + S(circ(27, 23, 3), '#ffffff', { w: 1.6, flat: true }) + S(circ(37, 23, 3), '#ffffff', { w: 1.6, flat: true })
    + F(circ(27.5, 23.5, 1.5), ART_INK) + F(circ(37.5, 23.5, 1.5), ART_INK)
    + S(ell(32, 41, 17, 11), '#e0442f') + F('M17 44Q32 56 47 44Q40 50 32 50Q24 50 17 44Z', dk('#e0442f', 0.4), 0.7)
    + L('M27 44Q32 47 37 44', ART_INK, 1.8) + H(ell(26, 36, 6, 2.5), 0.55) + H(ell(11, 15, 2, 3), 0.5),
  // Grand Line Marlin: long blue fish with a spear bill and a tall sail fin.
  blue_marlin: TR('translate(32 33) scale(1.15) translate(-32 -33)', ROT(-32, 32, 34,
    S('M14 32L4 20Q8 32 4 44Z', '#1f4f9a') + S('M18 30Q20 12 38 13Q36 22 38 29Z', '#2a62c0', { w: 2 })
    + L('M24 28L26 16M30 28L31 14', dk('#2a62c0', 0.4), 1.4)
    + S('M42 30L62 32L42 34Z', '#3a6fb0', { w: 2 })
    + S('M12 32Q26 21 44 28Q49 32 44 36Q26 43 12 32Z', '#2b6fd0')
    + F('M14 33Q28 38 44 34Q28 36 14 33Z', '#dfeef8', 0.95) + F(circ(39, 30.5, 1.8), ART_INK)
    + F(circ(22, 31, 1.3), '#9fdcff') + F(circ(27, 31, 1.3), '#9fdcff') + F(circ(32, 31, 1.3), '#9fdcff')
    + H('M18 30Q28 27 38 28Q28 29 20 31Z', 0.6))),
  // Calm Belt Eel: long S-curved violet eel with a yellow belly line.
  tidal_eel: L('M8 56Q4 38 22 38Q40 38 40 24Q40 12 50 12', ART_INK, 13) + L('M8 56Q4 38 22 38Q40 38 40 24Q40 12 50 12', '#6a4fc0', 10)
    + L('M10 54Q8 42 22 42Q42 42 44 26', '#f2d04a', 2.4) + L('M7 50Q6 36 20 35Q36 34 36 22', lt('#6a4fc0', 0.4), 2.4, 0.8)
    + S('M42 10Q48 4 58 8Q62 12 58 16Q50 20 42 16Z', '#6a4fc0', { w: 2.2 }) + S('M58 11L62 13L58 14Z', '#7a1f2a', { w: 1.4 })
    + F(circ(52, 10, 1.8), '#fff27a') + F(circ(52, 10, 0.9), ART_INK),
  // Giant Octopus: big red octopus, curling tentacles, angry eyes.
  giant_octopus: TL('M22 36Q10 40 8 50Q8 58 15 55', '#e8506a', 5.5) + TL('M27 39Q20 50 24 58', '#e8506a', 5.5)
    + TL('M37 39Q44 50 40 58', '#e8506a', 5.5) + TL('M42 36Q54 40 56 50Q56 58 49 55', '#e8506a', 5.5)
    + L('M12 46V47M22 50V51M42 50V51M52 46V47', '#ffd4dc', 2.4)
    + S('M16 30Q14 6 32 6Q50 6 48 30Q46 40 32 40Q18 40 16 30Z', '#e8506a')
    + F('M40 9Q50 16 46 32Q42 38 34 39Q44 32 42 18Z', dk('#e8506a', 0.4), 0.6)
    + S(ell(25, 28, 5, 5.5), '#ffffff', { w: 1.6, flat: true }) + S(ell(39, 28, 5, 5.5), '#ffffff', { w: 1.6, flat: true })
    + F(circ(26, 29, 2.4), ART_INK) + F(circ(38, 29, 2.4), ART_INK) + L('M19 20L29 23M45 20L35 23', ART_INK, 2.2)
    + H(ell(25, 13, 6, 3), 0.55),
  // Abyss Angler: dark deep-sea fish, fanged jaw and a glowing lure.
  abyss_angler: AURA(14, 10, 10, '#fff27a') + L('M28 18Q26 6 15 10', ART_INK, 2.4)
    + S('M50 34L60 22Q57 34 60 46Z', '#24305a')
    + S('M6 32Q8 14 30 15Q52 16 52 34Q50 52 30 52Q8 52 6 40Z', '#2e3a6a')
    + S('M6 32Q18 30 28 36Q18 46 6 40Z', '#8a1f3a', { w: 2 })
    + F('M8 32L10 37L12 32L14 37L17 32L19 37L22 33Z', '#ffffff') + F('M8 40L10 37L12 41L14 37L17 42L19 38L22 42Z', '#ffffff')
    + F('M36 18Q50 22 50 36Q48 48 36 50Q46 40 36 18Z', dk('#2e3a6a', 0.5), 0.7)
    + S(circ(32, 26, 3.6), '#c9f4ff', { w: 1.6, flat: true }) + F(circ(32.6, 26, 1.6), ART_INK)
    + F(circ(40, 38, 1.6), '#7ad8ff') + F(circ(44, 30, 1.4), '#7ad8ff') + F(circ(36, 44, 1.4), '#7ad8ff')
    + S(circ(14, 10, 3.8), '#fff27a', { w: 1.8 }) + H(ell(18, 21, 6, 2.2), 0.35),
  // Sea King: a green Sea King rearing out of the waves, jaws open.
  sea_king: S('M34 30Q32 46 26 58H52Q48 44 54 24Z', '#3f9a5a')
    + L('M38 36H50M36 42H50M34 48H50M32 54H50', '#d8e08a', 2.2, 0.85)
    + S('M40 9L43 3L47 8L51 4L54 11Z', '#e0443a', { w: 1.8 })
    + S('M58 18Q56 6 42 8L18 13Q8 15 8 21L28 23L12 27Q12 34 24 34L46 32Q58 28 58 18Z', '#4cb06a')
    + F('M28 23L10 22Q8 24 12 27Z', '#7a1f2a') + F('M14 21L16 25L18 21L20 25L22 22Z', '#ffffff') + F('M16 27L18 24L20 28L22 24L24 28Z', '#ffffff')
    + F('M46 30Q56 26 56 16Q58 28 46 32Z', dk('#4cb06a', 0.4), 0.7)
    + S(ell(44, 15, 3.6, 3), '#ffe04a', { w: 1.6, flat: true }) + F(ell(44.6, 15, 0.9, 2.4), ART_INK)
    + S('M4 58Q10 50 16 56Q22 50 28 56Q34 50 40 56Q46 50 52 56Q58 50 62 58V61H4Z', '#3a8fd8', { w: 2 })
    + L('M10 57Q13 54 16 57M34 57Q37 54 40 57', '#d8f2ff', 1.6) + H('M22 12L40 10Q30 13 24 15Z', 0.5),

  // ---------------------------------------------------------------- dishes
  // Grilled Minnow: a fish grilled on a skewer, char marks and steam.
  grilled_minnow: ROT(-40, 32, 34,
    TL('M2 34H62', '#d8b07a', 2.6)
    + S(tailD(12, 34, 40, 11), '#b8642a', { w: 2 }) + S(fishD(12, 34, 42, 11), '#d8893a')
    + L('M22 28L26 40M30 26L34 41M38 27L42 40', '#6a2a14', 2.2) + F('M16 36Q32 42 50 36Q32 46 16 36Z', '#f2c26a', 0.8)
    + S(circ(47, 31, 2.4), '#ffffff', { w: 1.4, flat: true }) + H(ell(30, 28, 7, 1.8), 0.45))
    + L('M46 50Q43 46 46 42Q49 38 46 34', '#ffffff', 2, 0.7) + L('M54 46Q51 42 54 38', '#ffffff', 2, 0.6),
  // Baratie Stew: iron pot of orange fish stew, a fish tail poking out, Baratie fish emblem.
  bass_stew: L('M22 20Q19 15 22 10M32 18Q29 12 32 6M42 20Q39 15 42 10', '#ffffff', 2.2, 0.7)
    + S('M48 26L58 16L56 26L60 30Z', '#5f9a3a', { w: 2 })
    + S('M8 30H56Q56 52 32 56Q8 52 8 30Z', '#4a4f62') + F('M44 32Q54 32 54 34Q52 50 36 54Q48 44 44 32Z', dk('#4a4f62', 0.5), 0.7)
    + S(ell(32, 30, 25, 6), '#6c7288', { w: 2.2 }) + F(ell(32, 30, 21, 4), '#e0702e')
    + S(circ(22, 29, 3), '#f2e6c8', { w: 1.4 }) + S(circ(34, 31, 2.6), '#5fa83a', { w: 1.4 }) + S(circ(42, 28.5, 2.4), '#f2e6c8', { w: 1.4 })
    + S('M4 34Q4 30 8 32V38Q4 38 4 34ZM60 34Q60 30 56 32V38Q60 38 60 34Z', '#6c7288', { w: 1.8 })
    + S('M24 44Q30 38 38 42L42 39V47L38 44Q30 49 24 44Z', '#f2c23a', { w: 1.6 }) + H('M12 34Q14 44 20 48Q14 44 13 36Z', 0.35),
  // Crab Dumplings: bamboo steamer of pleated dumplings, a crab claw on the side.
  crab_dumplings: S('M6 38H58V48Q58 55 51 55H13Q6 55 6 48Z', '#c4914e')
    + L('M6 44H58M6 50H58', dk('#c4914e', 0.35), 1.6) + L('M18 40V54M32 40V55M46 40V54', dk('#c4914e', 0.3), 1.2)
    + S('M10 38Q10 24 21 24Q31 24 30 38Z', '#f6efe0', { w: 2 }) + S('M34 38Q33 24 43 24Q54 24 54 38Z', '#f6efe0', { w: 2 })
    + S('M20 38Q20 18 32 18Q44 18 44 38Z', '#fbf5ea', { w: 2 })
    + L('M28 22Q32 26 36 22M15 28Q20 31 25 28M38 28Q43 31 48 28', '#c9bca0', 1.6)
    + S(circ(32, 18, 2.6), '#ff8a4a', { w: 1.4 }) + S(circ(21, 24, 2.2), '#ff8a4a', { w: 1.4 }) + S(circ(43, 24, 2.2), '#ff8a4a', { w: 1.4 })
    + S('M50 30Q60 26 60 16Q58 10 54 10L54 17L49 14Q46 24 50 30Z', '#e0442f', { w: 2 })
    + H(ell(26, 25, 3, 4), 0.6),
  // Ichiraku Ramen: red bowl of noodles with a naruto fishcake, egg, nori and chopsticks.
  spirit_ramen: L('M38 6L58 26', ART_INK, 4.6) + L('M44 4L60 22', ART_INK, 4.6) + L('M38 6L58 26', '#e0b06a', 2.4) + L('M44 4L60 22', '#e0b06a', 2.4)
    + S('M6 30H58Q56 52 32 56Q8 52 6 30Z', '#c8352e') + L('M12 40Q32 48 52 40', '#f6e6c8', 2) + F('M44 32Q56 32 56 33Q52 50 38 54Q48 44 44 32Z', dk('#c8352e', 0.45), 0.7)
    + S(ell(32, 30, 26, 6.5), '#f0c060', { w: 2.2 })
    + L('M12 30Q16 27 20 30Q24 33 28 30M22 32Q26 29 30 32Q34 35 38 32', '#ffe48a', 2)
    + S('M14 28L18 16L26 18L24 30Z', '#2a3a2e', { w: 1.8 })
    + S(circ(36, 27, 6), '#ffffff', { w: 1.8 }) + L(sw(35, 27, 7), '#f05a8a', 1.8)
    + S(ell(47, 29, 6, 4), '#ffffff', { w: 1.8 }) + F(circ(47, 29, 2.4), '#ffb02a') + H('M10 34Q12 42 18 46Q12 44 11 36Z', 0.35),
  // Marlin Steak: a huge bone-in pirate steak on a plate, the captain's favourite.
  marlin_steak: S(ell(32, 46, 29, 12), '#e8eef4') + F(ell(32, 46, 22, 8), '#ccd6e2')
    + S('M8 18Q3 14 7 10Q9 5 14 8Q18 8 18 14L22 20L16 24Z', '#f6eedc', { w: 2 })
    + S('M56 48Q61 52 57 56Q55 61 50 58Q46 58 46 52L42 46L48 42Z', '#f6eedc', { w: 2 })
    + S('M14 32Q10 16 30 15Q52 14 52 32Q52 48 32 49Q16 49 14 32Z', '#b8502e')
    + F('M42 18Q52 24 50 36Q46 46 34 48Q46 40 46 30Q46 22 42 18Z', dk('#b8502e', 0.45), 0.7)
    + L('M22 26L28 32M30 22L40 32M24 36L32 42', '#6a2414', 2.4) + L('M18 38Q26 44 38 44', '#f2c090', 2, 0.8)
    + H('M20 22Q28 17 38 18Q28 20 22 25Z', 0.5),
  // Grilled Eel Bowl: black lacquer box of rice with glazed, grill-marked eel and a sansho leaf.
  eel_bowl: S('M8 26H56V30H8Z', '#f8f4ea', { w: 2 })
    + S('M10 28Q10 18 22 18H44Q54 18 54 28Z', '#a8541e') + L('M16 26L22 20M24 27L31 20M33 27L40 20M42 27L48 21', '#5a2210', 2)
    + F('M14 24Q20 20 32 20Q24 22 16 26Z', '#ffd08a', 0.7) + S('M40 14Q48 6 52 12Q46 18 40 14Z', '#5fb83a', { w: 1.6 })
    + S(rect(5, 30, 54, 24, 4), '#2a2236') + F(rect(9, 34, 46, 3, 1.5), '#c8352e') + F(rect(9, 48, 46, 2, 1), '#c8352e', 0.7)
    + F('M44 34H55V50Q55 54 51 54H44Z', '#000000', 0.25) + H('M10 38H30V40H10Z', 0.25)
    + L('M6 58L58 50', ART_INK, 3.6) + L('M6 58L58 50', '#e0b06a', 1.8),
  // Takoyaki: paper boat of octopus balls, sauce, mayo zigzag and a toothpick.
  takoyaki: S('M4 38H60L53 55H11Z', '#e8d3a0') + L('M10 42H54', dk('#e8d3a0', 0.25), 1.4)
    + S(circ(20, 28, 9.5), '#d8963a', { w: 2.2 }) + S(circ(42, 28, 9.5), '#d8963a', { w: 2.2 })
    + S(circ(14, 38, 9.5), '#e0a044', { w: 2.2 }) + S(circ(32, 38, 9.5), '#e0a044', { w: 2.2 }) + S(circ(50, 38, 9.5), '#e0a044', { w: 2.2 })
    + F('M6 36Q14 28 22 36Q14 33 6 36ZM24 36Q32 28 40 36Q32 33 24 36ZM42 36Q50 28 58 36Q50 33 42 36Z', '#5a2a14')
    + L('M8 35L12 32L16 35L20 32M26 35L30 32L34 35L38 32M44 35L48 32L52 35L56 32', '#ffffff', 1.6)
    + F('M12 30h2v2h-2zM30 30h2v2h-2zM48 31h2v2h-2zM20 22h2v2h-2zM42 22h2v2h-2z', '#4a9a2a')
    + L('M34 36L44 8', ART_INK, 3.4) + L('M34 36L44 8', '#e8c98a', 1.6)
    + H(ell(9, 35, 2, 1.5), 0.6) + H(ell(27, 35, 2, 1.5), 0.6),
  // All Blue Feast: a silver platter with a roast whole fish, crab claw and lemon — fish from all four seas.
  angler_feast: SP(8, 12, 4, '#fff3a0') + SP(56, 10, 3.5, '#fff3a0')
    + S(ell(32, 44, 29, 13), '#dfe4ec') + F(ell(32, 44, 23, 9), '#c3cbd8')
    + S('M10 40Q6 30 14 28L16 34L20 30Q24 38 18 44Z', '#e0442f', { w: 2 })
    + S('M48 38L58 28Q56 38 58 46Z', '#c06a2a', { w: 2 })
    + S('M14 40Q28 24 50 38Q30 54 14 40Z', '#e0903a')
    + L('M24 34L26 44M32 32L34 46M40 34L41 44', '#7a3414', 2) + F(circ(20, 37, 2), ART_INK)
    + S('M38 50a8 8 0 0 1 16 0Z', '#ffe04a', { w: 1.8 }) + L('M46 50V44M42 50L44 45M50 50L48 45', '#f2b82a', 1.2)
    + S('M22 52Q24 46 30 48Q28 54 22 52Z', '#5fb83a', { w: 1.6 }) + H('M22 34Q30 30 38 32Q30 32 24 36Z', 0.55) + SP(36, 22, 3),
  // Sea King Curry: rice dome and orange curry with a chunk of green-skinned Sea King and a spoon.
  sea_king_curry: L('M44 10L60 2', ART_INK, 4.4) + L('M44 10L60 2', '#c9d1dc', 2.4)
    + S(ell(32, 42, 29, 14), '#f2f4f8') + F(ell(32, 42, 23, 10), '#d6dce6')
    + S('M10 40Q10 22 26 22Q36 22 36 34Q30 46 10 40Z', '#ffffff', { w: 2.2 })
    + S('M30 34Q40 28 52 34Q56 44 44 50Q30 52 26 44Z', '#d8862a')
    + S('M36 36L48 34L50 42L38 44Z', '#3f9a5a', { w: 2 }) + F('M38 40L49 39L50 42L38 44Z', '#f2d8b0')
    + S(ell(32, 46, 3, 2.2), '#e0703a', { w: 1.4 }) + S(ell(46, 46, 2.6, 2), '#f2c23a', { w: 1.4 })
    + S(ell(40, 13, 6, 4), '#c9d1dc', { w: 2 }) + H('M14 30Q18 24 26 24Q18 27 16 32Z', 0.7),

  // ---------------------------------------------------------------- spices
  // Sea Salt: a corked glass jar of white crystals with a wave label.
  sea_salt: S(rect(22, 6, 20, 9, 3), '#b07a44', { w: 2 }) + S(rect(18, 13, 28, 4, 2), '#8a9aa8', { w: 1.8 })
    + S(rect(14, 16, 36, 42, 9), '#bfe2f0') + F('M17 30H47V50Q47 55 42 55H22Q17 55 17 50Z', '#ffffff', 0.95)
    + F('M22 34h3v3h-3zM34 32h3v3h-3zM28 40h3v3h-3zM40 42h3v3h-3zM24 48h3v3h-3zM36 50h3v3h-3z', '#b8ccd8')
    + S(rect(18, 26, 28, 10, 2), '#2f6fc0', { w: 1.6 }) + L('M20 32Q24 28 28 32Q32 36 36 32Q40 28 44 32', '#ffffff', 1.8)
    + H('M18 20Q18 40 20 52Q16 40 17 22Z', 0.75) + SP(52, 12, 3),
  // Peppercorns: an open burlap sack spilling black peppercorns.
  peppercorns: S('M14 58Q6 42 14 28L20 20H44L50 28Q58 42 50 58Z', '#c9a46a')
    + L('M14 34Q32 40 50 34M12 46Q32 52 52 46', dk('#c9a46a', 0.3), 1.4)
    + S(ell(32, 21, 15, 5), '#3a2a24', { w: 2 }) + S('M18 21Q20 8 32 7Q44 8 46 21Z', '#3a2a2a', { w: 2 }) + L('M20 26Q32 30 44 26', '#7a4a2a', 3)
    + S(circ(26, 18, 3.4), '#3a2a2a', { w: 1.6 }) + S(circ(33, 16, 3.4), '#4a3428', { w: 1.6 }) + S(circ(39, 19, 3.4), '#3a2a2a', { w: 1.6 })
    + S(circ(30, 12, 3.4), '#2a1e1e', { w: 1.6 })
    + S(circ(54, 56, 3.4), '#3a2a2a', { w: 1.6 }) + S(circ(59, 50, 3), '#4a3428', { w: 1.6 }) + S(circ(8, 58, 3), '#3a2a2a', { w: 1.6 })
    + H(ell(18, 40, 2, 6), 0.35) + F(circ(25, 17, 1), '#ffffff', 0.6) + F(circ(32, 15, 1), '#ffffff', 0.6),
  // Coral Lemon: a coral-skinned lemon and a cut half with pink segments.
  coral_lemon: ROT(-25, 40, 24, S('M24 24Q26 12 40 12Q54 12 56 24Q54 36 40 36Q26 36 24 24Z', '#ff8a6a') + S('M54 22L60 24L54 26Z', '#ff8a6a', { w: 1.8 })
    + H(ell(34, 17, 6, 2.2), 0.55)) + S('M40 8Q42 2 48 4Q46 8 40 8Z', '#5fb83a', { w: 1.6 })
    + S(circ(24, 42, 18), '#ff8a6a') + S(circ(24, 42, 14.5), '#fff0c8', { w: 1.6 })
    + F('M24 42L24 30Q31 31 34 36ZM24 42L36 42Q35 50 31 53ZM24 42L24 54Q17 53 14 48ZM24 42L12 42Q13 34 17 31ZM24 42L34 36L36 42ZM24 42L14 48L12 42Z', '#ff9c8a', 0.9)
    + L('M24 30V54M12 42H36M16 33L32 51M32 33L16 51', '#fff6e0', 1.4) + F(circ(24, 42, 2), '#fff6e0') + H(ell(16, 32, 3, 2), 0.6),
  // Sea Kelp: wavy brown-green fronds with air bladders rising from a rock.
  sea_kelp: S('M20 54Q12 40 20 28Q26 18 20 6Q32 16 28 30Q24 42 30 54Z', '#5a8a2a')
    + S('M32 54Q28 40 36 30Q44 20 42 10Q52 20 46 32Q40 42 42 54Z', '#6e9a30')
    + S('M42 54Q44 44 52 38Q58 32 58 24Q62 36 54 44Q48 50 50 54Z', '#4a7a26', { w: 2 })
    + L('M22 50Q18 38 24 28Q28 20 24 10M36 50Q34 40 40 30Q46 22 44 14', dk('#5a8a2a', 0.4), 1.4)
    + S(circ(26, 27, 3), '#c9a83a', { w: 1.6 }) + S(circ(44, 25, 3), '#c9a83a', { w: 1.6 }) + S(circ(54, 36, 2.6), '#c9a83a', { w: 1.6 })
    + S('M8 60Q8 50 20 50H46Q58 50 58 60Z', '#7a7f8a') + H('M14 54Q20 51 30 52Q20 53 16 56Z', 0.4)
    + H('M21 26Q19 18 21 10Q24 18 22 26Z', 0.45),
  // Fire Chili: a fiery red chili with a curled green stem and a flame at its tip.
  fire_chili: AURA(14, 50, 12, '#ff9a2a')
    + S('M8 52Q4 58 12 58Q20 56 22 50Q14 54 12 46Q10 50 8 52Z', '#ffb02a', { w: 1.8 }) + F('M11 54Q14 52 14 49Q16 54 12 56Z', '#fff27a')
    + S('M14 48Q18 34 32 24Q42 16 46 16L50 22Q44 30 36 38Q24 48 14 48Z', '#e02a2a')
    + F('M18 46Q30 42 40 30Q46 24 49 21L50 22Q44 30 36 38Q26 46 18 46Z', dk('#e02a2a', 0.4), 0.7)
    + S('M44 14Q50 12 54 18L50 24Q46 18 44 14Z', '#4a9a2a', { w: 2 }) + L('M52 16Q56 10 60 12Q62 6 56 6', '#4a9a2a', 2.6)
    + H('M22 40Q30 30 40 22Q32 28 26 38Z', 0.6),
  // Golden Saffron: a purple crocus flower with three glowing red-gold stigmas.
  gold_saffron: SP(54, 12, 3.5, '#fff3a0')
    + L('M32 58V40', '#4a9a2a', 3) + S('M30 58Q20 50 22 42Q28 48 32 58Z', '#5fb83a', { w: 1.6 }) + S('M34 58Q44 50 42 42Q36 48 34 58Z', '#5fb83a', { w: 1.6 })
    + S('M32 42Q18 40 14 22Q24 20 32 30Z', '#8a5ad8') + S('M32 42Q46 40 50 22Q40 20 32 30Z', '#8a5ad8')
    + S('M32 42Q22 30 32 10Q42 30 32 42Z', '#a678f0')
    + L('M32 38L24 14M32 38L32 8M32 38L40 14', ART_INK, 4.2) + L('M32 38L24 14M32 38L32 8M32 38L40 14', '#ff5a1a', 2.4)
    + F(circ(24, 14, 2), '#ffc02a') + F(circ(32, 8, 2), '#ffc02a') + F(circ(40, 14, 2), '#ffc02a')
    + F('M32 42Q22 30 32 10Q26 30 32 42Z', '#ffffff', 0.25),

  // ---------------------------------------------------------------- Devil Fruits (each its own shape, all swirled)
  // Flame-Flame Fruit: orange fruit shaped like a flame, red swirls.
  ember_fruit: AURA(32, 34, 28, '#ff8a2a')
    + S('M32 58Q10 56 12 38Q14 26 24 20Q20 28 26 30Q26 18 36 10Q34 22 42 24Q42 18 46 16Q54 28 52 40Q52 56 32 58Z', '#ff8a2a')
    + SW([[20, 42, 7], [34, 46, 8], [40, 34, 6], [28, 30, 5], [44, 50, 5]], '#c8282a', 2)
    + H('M18 36Q20 28 26 26Q22 32 20 40Z', 0.55) + STEM(36, 12),
  // Tremor-Tremor Fruit: pale three-lobed fruit with quake cracks around it.
  quake_fruit: L('M4 20L8 24L5 28M60 20L56 24L59 28M6 46L10 44L8 40M58 46L54 44L56 40', '#d8e4f8', 2.2)
    + S(circ(21, 38, 12), '#e6e2f6') + S(circ(43, 38, 12), '#e6e2f6') + S(circ(32, 24, 12), '#f0ecfa')
    + S(circ(32, 46, 11), '#dcd6f2')
    + SW([[16, 36, 6], [40, 38, 6], [28, 23, 6], [28, 46, 6]], '#8a7ab8', 1.8)
    + H(ell(27, 18, 4, 2.2), 0.7) + H(ell(15, 32, 2.6, 1.6), 0.6) + STEM(32, 13),
  // Smoke-Smoke Fruit: long grey-blue fruit wrapped in smoke wisps.
  mist_fruit: L('M6 50Q12 44 8 38Q4 32 10 28M56 54Q62 48 58 42', '#d8dde6', 3, 0.7)
    + ROT(20, 32, 36, S('M32 14Q46 14 46 34Q46 58 32 58Q18 58 18 34Q18 14 32 14Z', '#8a9ab8')
      + F('M40 18Q46 26 45 38Q44 54 34 57Q42 46 40 18Z', dk('#8a9ab8', 0.4), 0.6)
      + SW([[26, 26, 6], [32, 38, 7], [26, 50, 5], [38, 48, 5]], '#4a5578', 1.8)
      + H('M24 20Q28 16 32 17Q26 22 24 32Z', 0.6))
    + STEM(39, 16),
  // Gold-Gold Fruit: a gleaming gold lemon-shaped fruit with brown swirls and sparkles.
  gilded_fruit: AURA(32, 36, 28, '#ffd84a')
    + S('M4 38Q10 22 32 20Q54 22 60 38Q54 54 32 56Q10 54 4 38Z', '#f2c23a')
    + SW([[14, 38, 6], [28, 32, 7], [30, 46, 6], [44, 40, 7]], '#a8641a', 2)
    + H('M12 32Q18 24 30 23Q20 27 15 35Z', 0.65) + SP(52, 14, 4) + SP(10, 52, 3) + STEM(32, 20),
  // Flower-Flower Fruit: a pink pear-shaped fruit with a flower crown of petals.
  bloom_fruit: S('M32 18Q42 18 42 30Q50 38 50 46Q50 58 32 58Q14 58 14 46Q14 38 22 30Q22 18 32 18Z', '#e85aa8')
    + F('M40 24Q44 34 48 40Q52 54 36 57Q48 48 40 24Z', dk('#e85aa8', 0.4), 0.6)
    + SW([[26, 30, 5], [22, 46, 6], [36, 42, 7], [36, 30, 4]], '#8a1f6a', 1.8)
    + H('M24 26Q26 20 31 20Q26 24 25 32Z', 0.6)
    + S('M32 20Q24 8 30 6Q34 10 32 20Z', '#a678f0', { w: 1.6 }) + S('M32 20Q36 6 44 10Q40 16 32 20Z', '#a678f0', { w: 1.6 })
    + S('M32 20Q20 14 20 8Q28 8 32 20Z', '#a678f0', { w: 1.6 }) + S(circ(32, 18, 2.6), '#ffe04a', { w: 1.4 }),
  // Gum-Gum Fruit: the purple, heart-lobed Devil Fruit with the classic swirls and curly stem.
  colossus_fruit: S('M32 22Q40 12 50 18Q60 26 56 42Q50 58 32 58Q14 58 8 42Q4 26 14 18Q24 12 32 22Z', '#8a4ad0')
    + F('M48 20Q58 28 54 44Q48 56 36 57Q50 46 48 20Z', dk('#8a4ad0', 0.4), 0.6)
    + SW([[14, 32, 7], [30, 32, 7], [44, 32, 6], [20, 46, 7], [36, 46, 7]], '#4a1f8a', 2.2)
    + H('M12 26Q16 18 24 19Q16 23 14 32Z', 0.6) + STEM(31, 21),

  // ---------------------------------------------------------------- weapons
  // Rusty Cutlass: navy-issue broad curved blade, pitted with rust, dull brass knuckle bow.
  rusty_cutlass: ROT(45, 32, 32,
    S('M28 42L26 16Q27 6 38 3Q34 14 36 42Z', '#9a9088') + F('M29 40L28 16Q29 8 35 5Q31 16 32 40Z', '#ffffff', 0.25)
    + F(ell(31, 30, 2.6, 2), '#a8562a') + F(ell(33, 18, 2, 1.6), '#a8562a') + F(ell(30, 37, 1.8, 1.4), '#8a3a1a') + F(ell(34, 10, 1.6, 1.2), '#a8562a')
    + S(rect(22, 41, 20, 4, 2), '#a8884a', { w: 2 }) + L('M41 43Q46 50 38 58H34', ART_INK, 4.4) + L('M41 43Q46 50 38 58H34', '#a8884a', 2.2)
    + S(rect(29, 45, 6, 12, 2), '#6a4024', { w: 2 }) + L('M29 49H35M29 53H35', '#3a2414', 1.4) + S(circ(32, 59, 2.6), '#a8884a', { w: 1.8 })),
  // Kitetsu Cutlass: a cursed katana — bright wavy-hamon blade, gold round guard, red wrap, red aura.
  corsair_cutlass: AURA(32, 32, 30, '#ff2a4a')
    + ROT(45, 32, 32,
      S('M28 42V10Q28 3 34 1Q36 8 36 42Z', '#dfe6ef') + L('M30 40Q32 36 30 32Q32 28 30 24Q32 20 30 16', '#ffffff', 1.4)
      + F('M33 40V8L35 4V42Z', '#9aa6b8', 0.6)
      + S(ell(32, 43, 8, 3), '#f2c23a', { w: 2 }) + S(rect(29, 46, 6, 13, 2), '#b8202e', { w: 2 })
      + L('M29 48L35 51M35 48L29 51M29 53L35 56M35 53L29 56', '#1c1424', 1.4) + S(rect(28.5, 58, 7, 3, 1), '#2a2236', { w: 1.6 }))
    + SP(52, 10, 3.5, '#ffd4dc'),
  // Clima-Tact: Nami's segmented blue weather staff, a thundercloud and a bolt at its tip.
  stormcaller: ROT(45, 32, 32,
    S(rect(29, 8, 6, 15, 2), '#3a7ad8', { w: 2 }) + S(rect(29, 25, 6, 14, 2), '#3a7ad8', { w: 2 }) + S(rect(29, 41, 6, 15, 2), '#3a7ad8', { w: 2 })
    + S(rect(28, 22, 8, 4, 1.5), '#c9d1dc', { w: 1.6 }) + S(rect(28, 38, 8, 4, 1.5), '#c9d1dc', { w: 1.6 })
    + S(circ(32, 6, 4), '#9ad8ff', { w: 2 }) + S(circ(32, 58, 4), '#9ad8ff', { w: 2 })
    + F(rect(30, 10, 1.6, 11, 0.8), '#ffffff', 0.6) + F(rect(30, 27, 1.6, 10, 0.8), '#ffffff', 0.6) + F(rect(30, 43, 1.6, 11, 0.8), '#ffffff', 0.6))
    + S('M40 14Q40 6 48 7Q52 2 57 6Q62 7 61 13Q62 18 56 18H44Q39 18 40 14Z', '#c9d1e6', { w: 2 })
    + S('M50 16L46 26L50 26L46 34L56 22L52 22L55 16Z', '#ffe04a', { w: 1.6 }),
  // Flintlock Hand Cannon: brass bell-mouthed barrel, wood stock, flint hammer, a puff of smoke.
  hand_cannon: ROT(-20, 32, 34,
    S('M16 26H50L56 22V36L50 32H16Z', '#c9a046') + L('M22 26V32M40 26V32', dk('#c9a046', 0.4), 1.8)
    + S('M10 24H24V34L18 54Q10 56 8 50L12 36Q8 30 10 24Z', '#8a4a26') + F('M18 34L14 50Q12 54 10 52L14 36Z', dk('#8a4a26', 0.4), 0.7)
    + S('M18 22L14 14L20 12L24 22Z', '#4a4f62', { w: 1.8 }) + L('M20 34Q24 42 30 34', ART_INK, 2.2)
    + H('M18 27H48V28.6H18Z', 0.55))
    + S(circ(58, 12, 4.5), '#eef0f4', { w: 1.6 }) + S(circ(52, 8, 3.2), '#eef0f4', { w: 1.6 }),

  // ---------------------------------------------------------------- armour
  // Marine Coat: a navy recruit's white jacket with the blue sailor collar and neckerchief.
  marine_coat: S('M20 9L10 14L3 34L12 38L16 30V58H48V30L52 38L61 34L54 14L44 9Q32 16 20 9Z', '#f2f4f8')
    + F('M44 12L54 16L60 33L54 36L48 26V56H42Z', dk('#f2f4f8', 0.18))
    + S('M20 9L32 28L44 9L50 12L32 36L14 12Z', '#2f5fb8', { w: 2 }) + L('M17 13L32 32L47 13', '#ffffff', 1.4)
    + S('M27 34L32 30L37 34L34 46H30Z', '#3a7ad8', { w: 1.8 })
    + S(circ(32, 44, 1.6), '#c9d1dc', { w: 1 }) + S(circ(32, 51, 1.6), '#c9d1dc', { w: 1 })
    + F(rect(5, 30, 9, 3), '#2f5fb8') + F(rect(50, 30, 9, 3), '#2f5fb8') + H('M18 32Q20 44 19 54Q17 44 18 32Z', 0.6),
  // Justice Greatcoat: an admiral's white cape-coat from behind, 正義 on the back, gold epaulettes.
  admiral_coat: S('M18 10H46L60 58Q32 62 4 58Z', '#f2f4f8')
    + F('M40 12H46L60 58Q54 59 48 60Z', dk('#f2f4f8', 0.18))
    + S('M20 6H44L46 12H18Z', '#2a3a6a', { w: 2 })
    + S(ell(14, 13, 8, 4), '#f2c23a', { w: 2 }) + S(ell(50, 13, 8, 4), '#f2c23a', { w: 2 })
    + L('M8 16V22M11 17V23M14 17V24M17 17V23M47 17V23M50 17V24M53 17V23M56 16V22', '#e0a82a', 1.6)
    + T(32, 38, 13, '正義', ART_INK, { font: 'serif' }) + H('M14 26Q12 42 10 54Q14 42 16 28Z', 0.5),
  // Sea King Scalemail: a teal breastplate of overlapping Sea King scales with gold trim.
  leviathan_mail: S('M16 10Q24 15 32 15Q40 15 48 10L58 18L50 30V54Q32 60 14 54V30L6 18Z', '#2f9a8a')
    + L('M16 24Q20 28 24 24Q28 28 32 24Q36 28 40 24Q44 28 48 24M16 32Q20 36 24 32Q28 36 32 32Q36 36 40 32Q44 36 48 32M16 40Q20 44 24 40Q28 44 32 40Q36 44 40 40Q44 44 48 40M16 48Q20 52 24 48Q28 52 32 48Q36 52 40 48Q44 52 48 48', dk('#2f9a8a', 0.45), 1.6)
    + F('M42 14L48 12L56 18L48 30V52L42 54Z', dk('#2f9a8a', 0.3), 0.5)
    + L('M14 54Q32 60 50 54', '#f2c23a', 2.6) + L('M16 10Q24 15 32 15Q40 15 48 10', '#f2c23a', 2.6)
    + S('M6 18L14 14L16 22L10 26Z', '#3fbfa8', { w: 1.8 }) + S('M58 18L50 14L48 22L54 26Z', '#3fbfa8', { w: 1.8 })
    + H('M18 20Q18 34 19 48Q16 34 17 20Z', 0.55),
  // Emperor's Mantle: a black captain's cape worn on the shoulders, red lining, gold chain clasp.
  tide_mantle: S('M20 8Q32 14 44 8L54 14Q60 36 60 58Q46 54 40 58L32 50L24 58Q18 54 4 58Q4 36 10 14Z', '#3a3050')
    + S('M24 14L32 20L40 14L42 56Q38 52 34 50L32 48L30 50Q26 52 22 56Z', '#c0283a', { w: 2 })
    + F('M36 18L40 16L41 54L37 50Z', dk('#c0283a', 0.35), 0.8)
    + F('M48 14L54 16Q58 36 58 56L52 56Q54 36 48 14Z', '#000000', 0.3)
    + S(circ(23, 15, 3.2), '#f2c23a', { w: 1.6 }) + S(circ(41, 15, 3.2), '#f2c23a', { w: 1.6 }) + L('M26 16Q32 22 38 16', '#f2c23a', 2)
    + L('M10 18Q8 36 8 54', '#6a5a8a', 1.8, 0.8) + H('M16 14Q12 30 10 46Q12 30 18 16Z', 0.25),

  // ---------------------------------------------------------------- accessories
  // Fish-Man Fang Necklace: one big serrated sawshark tooth on a cord with blue beads.
  shark_tooth: L('M8 6Q10 26 22 30M56 6Q54 26 42 30', ART_INK, 4.2) + L('M8 6Q10 26 22 30M56 6Q54 26 42 30', '#a8743a', 2.2)
    + S(circ(14, 24, 3.2), '#3a8fd8', { w: 1.6 }) + S(circ(50, 24, 3.2), '#3a8fd8', { w: 1.6 })
    + S('M20 32L23 36L21 39L25 43L23 46L27 50L25 53L32 60L39 53L37 50L41 46L39 43L43 39L41 36L44 32Z', '#f6f0e0')
    + F('M34 34H42L40 42L38 46L35 54L32 58Z', '#c9bca0', 0.6)
    + S(rect(18, 27, 28, 6, 2), '#8a9aa8', { w: 2 }) + H('M24 34L30 36L28 48Z', 0.6),
  // Skypiea Crown: a gold crown on a puff of sky-island cloud, a thunderbolt above.
  storm_crown: S('M14 6L10 16H16L12 24L22 12H16L20 6Z', '#ffe04a', { w: 1.6 })
    + S('M8 46L10 20L21 31L32 12L43 31L54 20L56 46Z', '#f2c23a') + F('M44 31L54 20L56 46H46Z', dk('#f2c23a', 0.3), 0.6)
    + S(circ(32, 12, 3), '#3a8fd8', { w: 1.6 }) + S(circ(10, 20, 2.6), '#3a8fd8', { w: 1.6 }) + S(circ(54, 20, 2.6), '#3a8fd8', { w: 1.6 })
    + S(rect(7, 42, 50, 9, 2), '#e0a82a', { w: 2.2 }) + S(ell(32, 46.5, 4, 3), '#3a8fd8', { w: 1.6 })
    + S(ell(20, 46.5, 2.6, 2.4), '#e0443a', { w: 1.4 }) + S(ell(44, 46.5, 2.6, 2.4), '#e0443a', { w: 1.4 })
    + S('M4 56Q4 50 12 51Q16 46 24 50Q32 46 40 50Q48 46 52 51Q60 50 60 56Q60 60 54 60H10Q4 60 4 56Z', '#f6f8ff', { w: 2 })
    + H('M14 22L20 32L16 40Z', 0.5),
  // Mermaid Cove Shell: a pink conch shell on a cord loop.
  sea_charm: L('M44 12Q48 2 56 6Q60 12 52 16', ART_INK, 3.8) + L('M44 12Q48 2 56 6Q60 12 52 16', '#a8743a', 2)
    + S('M12 46Q6 30 20 20L44 10Q52 8 52 14L44 34Q38 50 22 54Q14 54 12 46Z', '#f2a0b4')
    + L('M44 14Q36 18 34 26M48 18Q40 26 38 34M50 22Q44 32 40 40', dk('#f2a0b4', 0.4), 1.8)
    + S('M14 46Q12 34 22 30Q30 30 30 38Q30 48 20 50Q15 50 14 46Z', '#fff0e8', { w: 2 })
    + F('M18 44Q18 36 24 35Q20 40 21 46Z', '#f2a0b4', 0.7)
    + H('M20 24L40 14Q30 20 22 28Z', 0.6) + SP(8, 18, 3),
  // Log Pose: the wrist compass — leather band, glass dome, needle pointing to the next island.
  old_compass: S(ell(32, 48, 26, 10), '#8a5a32') + F(ell(32, 46, 19, 6), '#3a2414')
    + L(ell(32, 48, 26, 10), '#c08a4a', 1.2, 0.6)
    + S(rect(22, 34, 20, 10, 3), '#c9a046', { w: 2 })
    + S(circ(32, 22, 15), '#bfe8ff') + F(circ(32, 22, 11), '#ffffff', 0.3)
    + S('M32 9L35 22H29Z', '#e0443a', { w: 1.4 }) + S('M32 35L35 22H29Z', '#f6f8ff', { w: 1.4 }) + S(circ(32, 22, 2), '#c9a046', { w: 1.2 })
    + H('M22 14Q26 9 32 9Q26 12 24 18Z', 0.75) + SP(52, 12, 3),
  // Eternal Pose: an hourglass-like wooden frame around a glass bulb and a fixed needle, name plate below.
  kraken_compass: L('M15 12V52M49 12V52', ART_INK, 5.6) + L('M15 12V52M49 12V52', '#a8682e', 3)
    + S(circ(32, 32, 14), '#bfe8ff') + F(circ(32, 32, 10), '#ffffff', 0.3)
    + S('M42 22L34 30L30 34L22 42L36 33Z', '#e0443a', { w: 1.4 }) + S(circ(32, 32, 2), '#c9a046', { w: 1.2 })
    + S(rect(9, 4, 46, 9, 3), '#a8682e') + S(rect(9, 51, 46, 9, 3), '#a8682e')
    + F(rect(20, 53, 24, 5, 1.5), '#f6ecc8') + L('M23 55.5H41', '#6a4024', 1.4)
    + F('M40 6H52V11H40Z', dk('#a8682e', 0.35), 0.7) + H('M22 24Q26 19 32 19Q26 22 24 28Z', 0.75) + H('M12 6H32V8H12Z', 0.35),
  // Sapphire Charm: a silver pendant holding a teardrop sapphire with a pearl drop, on a fine chain.
  sapphire_charm: L('M10 4Q14 20 28 22M54 4Q50 20 36 22', '#c9d1dc', 2.2) + L('M10 4Q14 20 28 22M54 4Q50 20 36 22', '#7a8698', 1.2, 0.6)
    + S(circ(32, 22, 4), '#c9d1dc', { w: 1.8 })
    + S('M32 26Q48 40 46 48Q44 58 32 58Q20 58 18 48Q16 40 32 26Z', '#c9d1dc')
    + S('M32 31Q43 42 42 48Q40 54 32 54Q24 54 22 48Q21 42 32 31Z', '#2a5fd8', { w: 1.8 })
    + F('M32 31L42 48L32 54Z', dk('#2a5fd8', 0.4), 0.6) + L('M32 31V54M22 48H42', '#9ac8ff', 1.2, 0.6)
    + H('M26 42Q28 36 31 34Q28 40 28 46Z', 0.75) + SP(52, 34, 3.5) + SP(12, 50, 2.5),

  // ---------------------------------------------------------------- treasures & materials
  // Mermaid Pearl: an open pink clam holding a glowing pearl.
  tide_pearl: AURA(32, 34, 24, '#ffe0f4')
    + S('M8 30Q8 8 32 8Q56 8 56 30Z', '#e0a0c8') + L('M20 28L16 14M32 28V10M44 28L48 14', dk('#e0a0c8', 0.3), 1.6)
    + S('M6 38Q6 58 32 58Q58 58 58 38Q32 34 6 38Z', '#e8b0d0') + L('M18 42L14 54M32 40V57M46 42L50 54', dk('#e8b0d0', 0.3), 1.6)
    + S(circ(32, 34, 10), '#fbf4fa') + F('M38 28Q44 36 38 42Q30 46 24 40Q34 40 38 28Z', '#d8c8e8', 0.8)
    + H(ell(28, 30, 3.6, 2.4), 0.9) + SP(52, 12, 3.5) + SP(12, 50, 2.5),
  // Sea King Scale: one huge iridescent scale with growth ridges.
  leviathan_scale: S('M8 14Q32 2 56 14Q58 40 32 60Q6 40 8 14Z', '#3fae9a')
    + F('M32 6Q50 8 54 16Q54 40 32 58Q46 36 32 6Z', dk('#3fae9a', 0.35), 0.6)
    + L('M14 20Q32 12 50 20M16 30Q32 22 48 30M20 40Q32 33 44 40M25 49Q32 44 39 49', lt('#3fae9a', 0.5), 1.8)
    + F('M14 18Q24 12 32 11Q22 20 18 34Z', '#b8a0ff', 0.35)
    + H('M14 16Q22 10 30 9Q20 14 16 22Z', 0.6) + SP(50, 46, 3.5),
  // Heart of the Tide: a glowing heart-shaped sea crystal with a wave inside.
  tide_heart: AURA(32, 34, 30, '#5ae0ff')
    + S('M32 56Q8 40 8 22Q8 10 20 10Q28 10 32 18Q36 10 44 10Q56 10 56 22Q56 40 32 56Z', '#2a8fd8')
    + F('M12 34Q20 28 26 34Q32 40 38 34Q44 28 52 34Q46 46 32 56Q18 46 12 34Z', '#1a4fa8', 0.7)
    + L('M12 33Q20 27 26 33Q32 39 38 33Q44 27 52 33', '#bff4ff', 2.2)
    + L('M32 18V54M8 22L32 30L56 22', '#bff4ff', 1.2, 0.4)
    + H('M14 18Q16 12 22 13Q17 16 16 24Z', 0.75) + SP(52, 8, 4) + SP(10, 50, 3),
  // Sunken Chest: a waterlogged chest with barnacles, seaweed, a starfish and gold spilling out.
  sunken_chest: S('M6 28H58V54Q58 58 54 58H10Q6 58 6 54Z', '#7a6440')
    + S('M6 28Q6 12 32 12Q58 12 58 28Z', '#8a7048')
    + S(rect(4, 24, 56, 6, 1), '#5a6470', { w: 2 })
    + L('M14 13V58M50 13V58', '#5a6470', 3.4) + S(rect(27, 28, 10, 12, 2), '#f2c23a', { w: 1.8 }) + F(circ(32, 33, 1.6), ART_INK)
    + S(circ(20, 22, 3), '#f2c23a', { w: 1.4 }) + S(circ(40, 21, 2.6), '#f2c23a', { w: 1.4 })
    + S(circ(44, 46, 2.6), '#c9c6b8', { w: 1.4 }) + S(circ(49, 50, 2), '#c9c6b8', { w: 1.4 }) + S(circ(20, 50, 2.2), '#c9c6b8', { w: 1.4 })
    + S(star(12, 42, 7, 3, 5), '#ff8a3a', { w: 1.6 })
    + L('M24 12Q20 20 26 26Q30 34 24 44', '#3fa84a', 2.6) + L('M42 12Q46 18 42 24', '#3fa84a', 2.6)
    + H('M10 22Q14 15 28 14Q16 18 12 26Z', 0.4),
  // Treasure Map: a curled parchment with a dotted route to a red X and a tiny straw-hat Jolly Roger.
  treasure_map: S('M10 12H54V52H10Z', '#ecd7a0') + F('M44 12H54V52H44Z', dk('#ecd7a0', 0.15))
    + S(ell(10, 32, 4, 21), '#d8bf84', { w: 2 }) + S(ell(54, 32, 4, 21), '#d8bf84', { w: 2 })
    + S('M18 24Q24 16 32 20Q40 18 42 26Q46 36 38 42Q28 48 22 40Q14 34 18 24Z', '#9cc86a', { w: 1.8 })
    + L('M20 46Q26 40 24 34Q22 28 30 26', '#8a3a1a', 2, 1).replace('stroke-linecap="round"', 'stroke-linecap="round" stroke-dasharray="2 3"')
    + L('M30 22L38 30M38 22L30 30', '#d8202a', 3.4)
    + S(circ(46, 44, 4.5), '#ffffff', { w: 1.4 }) + F('M40 42Q46 36 52 42Z', '#f2c23a') + F('M41 41H51V42.6H41Z', '#d8202a')
    + F(circ(44.5, 45, 1), ART_INK) + F(circ(47.5, 45, 1), ART_INK),
  // Sea Sapphire: a big faceted deep-blue gem.
  sapphire: SP(54, 10, 4) + SP(8, 48, 3)
    + S('M18 12H46L58 26L32 58L6 26Z', '#2a5fd8')
    + F('M6 26H58L32 58Z', dk('#2a5fd8', 0.3), 0.7) + F('M24 12H40L44 26H20Z', lt('#2a5fd8', 0.35), 0.8)
    + L('M6 26H58M18 12L20 26L32 58L44 26L46 12M20 26L32 12L44 26', '#9ac8ff', 1.3, 0.7)
    + H('M20 14H30L24 24Z', 0.7) + SP(38, 34, 3),
});
})();
