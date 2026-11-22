'use strict';
/* Item art — Shinjuku (Jujutsu Kaisen). See js/item-art.js for the helpers and style rules. */
(() => {
const { S, F, L, H, SP, AURA, T, G, GL, lt, dk, mix, circ, ell, rect, poly, star, ROT, TR } = ARTK;
const PAPER = '#f2e8cc', RED = '#c0392b', GOLD = '#f0c040';
// A small paper talisman strip (x,y top-left, w,h) with a red glyph line.
const tag = (x, y, w, h) => S(rect(x, y, w, h, 1), PAPER, { w: 1.8 }) + L(`M${x + w / 2} ${y + 3}V${y + h - 3}`, RED, 1.6) + L(`M${x + 2} ${y + h * 0.35}H${x + w - 2}`, RED, 1.3);
// Points on an ellipse arc (for bead rings): n+1 points from angle a0 to a1
const arc = (cx, cy, rx, ry, n, a0, a1) => Array.from({ length: n + 1 }, (_, i) => { const a = a0 + (a1 - a0) * (i / n); return [+(cx + Math.cos(a) * rx).toFixed(1), +(cy + Math.sin(a) * ry).toFixed(1)]; });
// Spirit Bell family: one handbell construction, tilted; tiers differ by material and ornament.
const bell = (o) => TR('translate(-4 0)', ROT(-16, 32, 32, (o.back || '')
  + S(rect(28.5, 3, 7, 19, 3), o.grip, { w: 2 })
  + S('M14 50Q14 26 32 22Q50 26 50 50Q32 55 14 50Z', o.metal)
  + F('M38 23.5Q50 27 50 50Q45 52 40 52.5Q45 36 38 23.5Z', dk(o.metal, 0.3))
  + L('M15 44Q32 48.5 49 44', dk(o.metal, 0.45), 1.6)
  + S(rect(24.5, 19, 15, 5.5, 2), o.collar, { w: 1.8 })
  + S(circ(32, 55, 3.6), o.clap, { w: 1.8 })
  + H('M19 44Q19 30 29 25.5Q23 33 23 44Z', 0.55)
  + (o.deco || '')));
Object.assign(ART, {
  // Curse Ash: a grey heap of exorcised ash, a burnt talisman scrap and violet embers.
  hex_ash: ROT(14, 40, 30, S('M35 34V20H45V34Z', PAPER, { w: 1.8 }) + L('M40 22V30', RED, 1.4) + F('M35 20L37 23L39 20L41 24L43 20L45 22V20Z', '#4a3a3a'))
    + S('M6 54Q10 42 20 40Q24 32 33 33Q44 31 48 41Q57 43 58 54Z', '#8e8a98')
    + F('M44 36Q48 41 57 44Q58 54 58 54H46Q50 46 44 36Z', dk('#8e8a98', 0.3))
    + L('M12 50Q22 46 30 49M28 42Q36 39 42 43', dk('#8e8a98', 0.45), 1.4)
    + F(circ(24, 47, 2.2), '#c070ff') + F(circ(38, 50, 1.8), '#c070ff') + F(circ(31, 40, 1.6), '#e0a8ff')
    + L('M18 32Q14 26 19 20Q23 15 19 10', '#a8a4b4', 2, 0.8) + L('M28 28Q26 23 30 19', '#a8a4b4', 1.6, 0.7)
    + H('M14 46Q20 40 28 40Q20 43 16 48Z', 0.5),
  // Curse Residuals: a glob of violet cursed residue dripping and bubbling.
  hex_residue: S(ell(32, 52, 24, 6), '#6a30b8', { w: 2 })
    + S('M14 50Q10 36 20 30Q20 12 34 12Q48 12 46 30Q56 36 50 50Z', '#8a46e0')
    + S('M22 50Q22 56 25 56Q28 56 27 50Z', '#8a46e0', { w: 1.8 }) + S('M40 50Q40 59 43 59Q46 59 45 50Z', '#8a46e0', { w: 1.8 })
    + F('M42 16Q48 23 46 32Q54 36 50 50H40Q48 36 42 16Z', dk('#8a46e0', 0.3))
    + S(circ(28, 34, 4) + circ(38, 42, 2.8) + circ(36, 23, 2.4), '#b880ff', { w: 1.8 })
    + H(ell(26, 21, 5, 3), 0.6) + H(ell(27, 33, 1.4, 1), 0.6) + SP(55, 12, 3, '#e0c8ff'),
  // Grudge Ember: a black cursed-energy flame with a violet heart, on a cinder.
  hex_ember: AURA(32, 34, 28, '#b05aff')
    + S(ell(32, 53, 15, 5), '#3a2a2e', { w: 2 })
    + S('M32 5Q42 17 46 24Q54 35 49 45Q45 54 32 54Q19 54 15 45Q11 35 19 26Q21 32 26 33Q22 18 32 5Z', '#2a1a44')
    + F('M36 13Q43 21 46 26Q52 36 48 45Q44 52 36 53Q46 40 36 13Z', dk('#2a1a44', 0.35))
    + S('M32 22Q38 31 41 36Q44 44 39 49Q36 52 32 52Q27 52 24 48Q21 42 26 36Q27 40 30 40Q28 31 32 22Z', '#b05aff', { w: 1.8 })
    + F('M32 36Q36 42 36 46Q35 50 32 50Q28 50 28 46Q28 42 32 36Z', '#f2d6ff')
    + H('M20 31Q18 40 22 46Q15 40 20 31Z', 0.5) + SP(51, 13, 3.5, '#e0b8ff') + SP(12, 19, 2.6, '#e0b8ff'),
  // Shade Essence: a pale wisp of a low-grade curse, dark face and yellow eyes.
  hex_shade: L('M11 50Q5 44 9 37M53 48Q59 40 54 33', '#c8d0f0', 2, 0.7)
    + S('M16 28Q16 6 32 6Q48 6 48 28V48Q48 55 42 51Q37 60 32 53Q27 60 22 51Q16 55 16 48Z', '#a8b4e4')
    + F('M41 9Q48 15 48 28V48Q48 55 42 51Q43 30 41 9Z', dk('#a8b4e4', 0.25))
    + S(ell(32, 26, 10, 11), '#221a2e', { w: 2 })
    + F(ell(27.5, 24, 2.6, 3.2) + ell(36.5, 24, 2.6, 3.2), '#ffe14a') + F('M27.5 31Q32 35.5 36.5 31Q32 33 27.5 31Z', '#ffe14a')
    + H('M20 25Q20 12 29 9Q23 15 23 27Z', 0.55),
  // Cursed Womb: a sealed flesh pod with a curled shape inside, bound by a talisman.
  hex_core: AURA(32, 32, 30, '#c050ff')
    + S(ell(32, 32, 19, 25), '#9a3070')
    + F('M40 10Q51 20 51 32Q51 50 38 56Q47 40 40 10Z', dk('#9a3070', 0.3))
    + F('M30 21Q21 23 21 32Q21 42 30 42Q37 42 37 35Q37 29 31 29Q26 30 27 35', dk('#9a3070', 0.5), 0.9)
    + F(circ(32, 23, 3.6), dk('#9a3070', 0.55))
    + L('M19 19Q23 15 21 11M45 41Q49 45 46 50M17 41Q21 45 19 50', '#d46aa0', 1.4)
    + ROT(-20, 32, 32, S(rect(9, 28, 46, 8, 1), PAPER, { w: 1.8 }) + F(circ(32, 32, 2.6), RED) + L('M15 32H27M37 32H49', RED, 1.4))
    + H(ell(25, 15, 5, 3), 0.6),
  // Void Grudge: a sphere of endless space, swirling violet with stars inside.
  hex_void: AURA(32, 32, 30, '#8452ff')
    + S(circ(32, 32, 24), '#241848')
    + F('M46 13Q58 26 54 42Q48 55 32 56Q50 44 46 13Z', dk('#241848', 0.35))
    + L('M12.2 32Q12.2 14.4 32 12.2Q49.6 12.2 49.6 29.8Q49.6 43 36.4 43Q25.4 43 25.4 34.2Q25.4 27.6 32 27.6Q36.4 27.6 36.4 32', '#8a5cff', 2.6)
    + L('M16.6 40.8Q23.2 51.8 36.4 51.8Q47.6 51.8 52 40.8', '#c8b4ff', 1.8)
    + F(circ(33, 33, 3.6), '#05030c')
    + SP(21, 24, 2.4, '#e8f0ff') + SP(43, 46, 2, '#7df9ff') + SP(45, 21, 1.8, '#ffffff') + SP(56, 8, 3.2, '#c8b4ff')
    + H(ell(21, 18, 5.5, 3), 0.5),
  // Sukuna Finger: a withered dark finger, black nail, ritual bands, a cursed glow.
  hex_crown: AURA(32, 32, 30, '#ff3a6a')
    + ROT(45, 32, 32,
      S('M26 63L25 20Q25 0 32 -1Q39 0 39 20L38 63Q32 66 26 63Z', '#7a3c3c')
      + F('M35 1Q39 3 39 20L38 63Q36 64 35 64Z', dk('#7a3c3c', 0.35))
      + S('M28 15Q28 5 32 5Q36 5 36 15Q32 17 28 15Z', '#2a1a2a', { w: 1.8 })
      + L('M27 28Q32 31 37 28M27 44Q32 47 37 44', dk('#7a3c3c', 0.55), 1.6)
      + F('M26 35H38V37.5H26ZM26 38.8H38V40.2H26Z', dk('#7a3c3c', 0.7))
      + S(rect(24, 53, 16, 8, 1), PAPER, { w: 1.8 }) + L('M27 57H37', RED, 1.6)
      + H('M27.5 26Q28 12 31 8Q29 16 29.5 28Z', 0.5)),
  // Binding Vow Talisman: a sealing ofuda tied with a red-and-white cord.
  bound_talisman: ROT(-8, 32, 32,
    S(rect(20, 7, 24, 50, 1.5), PAPER)
    + F('M39 8.5H42.5V55.5H39Z', dk(PAPER, 0.15))
    + L(rect(23, 10, 18, 44), RED, 1.4)
    + L(circ(32, 19, 4.5), RED, 1.8) + L('M32 14.5V23.5M27.5 19H36.5M27 28Q32 25 37 28', RED, 1.6)
    + L('M32 44V51M28 47.5H36', RED, 1.6)
    + S(rect(14, 32, 36, 6, 3), '#d03a2e', { w: 1.8 }) + L('M19 33L22 37M25 33L28 37M36 33L39 37M42 33L45 37', '#ffffff', 1.4)
    + S('M30 38L26 49L31 46ZM34 38L38 49L33 46Z', '#d03a2e', { w: 1.8 }) + S(circ(32, 35, 4), '#d03a2e', { w: 1.8 })
    + H('M22 9H38V11H22Z', 0.5)),
  // Veil Shard: a curved shard of the black Veil, dripping like ink.
  veil_shard: S('M16.5 46.6Q19 49 18 52.6A2.4 2.4 0 1 0 22.4 52.8Q21.2 49.8 22.5 47.2ZM37.5 49.2Q40 52 39.4 55.6A2.6 2.6 0 1 0 44 55.6Q42.8 52.4 43.5 49.9Z', '#2a2848', { w: 1.8 })
    + S('M12 46L22 6L54 17L46 50Z', '#3a3866')
    + F('M38 30L54 17L46 50Z', dk('#3a3866', 0.35))
    + L('M22 6L38 30L46 50M38 30L12 46M38 30L54 17', '#6a66b0', 1.4)
    + H('M23 11L28 12L18 40L16 41Z', 0.5) + SP(54, 7, 3.2, '#c8c0ff'),
  // Matriarch's Eye: a huge cursed eyeball, violet slit iris, trailing nerve.
  matriarch_eye: S('M16 44Q8 52 10 58Q14 54 20 50Z', '#c86a7a', { w: 1.8 })
    + S(circ(33, 30, 22), '#f2ece2')
    + F('M47 13Q56 24 54 37Q51 49 39 52Q51 38 47 13Z', dk('#f2ece2', 0.2))
    + L('M14 26Q18 28 19 24M16 39Q20 38 22 41M49 45Q47 41 50 39M47 15Q45 19 48 21', '#d0404a', 1.3)
    + S(circ(36, 29, 11.5), '#9a3cf0') + F(circ(36, 29, 7.5), dk('#9a3cf0', 0.35))
    + F(ell(36, 29, 2.4, 7), '#120818')
    + H(ell(30.5, 23, 3.4, 2.4), 0.65) + H(ell(21, 18, 4, 2.4), 0.5),
  // Cursed Fragment: a cluster of violet crystals veined with black technique marks.
  cursed_fragment: S('M8 54V40L14 33L21 41V54Z', '#b886ff', { w: 2 })
    + S('M20 54L17 24L26 6L35 24L33 54Z', '#9a5cf0')
    + S('M32 54L35 28L46 19L53 33L46 54Z', '#7a40d0')
    + F('M26 6L35 24L33 54L27 54Z', dk('#9a5cf0', 0.25)) + F('M46 19L53 33L46 54L42 54Z', dk('#7a40d0', 0.25))
    + L('M24 22L28 30L24 36L28 44', dk('#9a5cf0', 0.65), 1.8) + L('M42 30L46 38L42 46', dk('#7a40d0', 0.65), 1.6)
    + S(ell(32, 55, 26, 3.5), '#4a3a5a', { w: 2 })
    + H('M21 26L26 11L24 30Z', 0.55) + SP(55, 11, 3.2, '#e0c8ff'),
  // Playful Cloud: Maki's red three-section staff, linked by short chains.
  cursed_cleaver: ROT(-45, 18, 46, S(rect(6, 42, 24, 8, 3.5), '#cf3d28') + F(rect(8, 47, 20, 2.2), dk('#cf3d28', 0.3)) + F(rect(8, 42, 4, 8) + rect(24, 42, 4, 8), '#f2c040') + H('M10 43.2H26V45H10Z', 0.5))
    + ROT(-45, 38, 26, S(rect(26, 22, 24, 8, 3.5), '#cf3d28') + F(rect(28, 27, 20, 2.2), dk('#cf3d28', 0.3)) + F(rect(28, 22, 4, 8) + rect(44, 22, 4, 8), '#f2c040') + H('M30 23.2H46V25H30Z', 0.5))
    + S(rect(48, 24, 8, 24, 3.5), '#cf3d28') + F(rect(53, 26, 2.2, 20), dk('#cf3d28', 0.3)) + F(rect(48, 26, 8, 4) + rect(48, 42, 8, 4), '#f2c040') + H('M49.4 28H51V44H49.4Z', 0.5)
    + L(circ(28.5, 35.5, 2.4) + circ(48.5, 18.5, 2.4) + circ(52, 21.5, 2), '#8a8e9c', 2)
    + SP(10, 14, 3, '#ffd0a0'),
  // Jujutsu High Uniform: the dark high-collared jacket with gold swirl buttons.
  grudge_mail: S('M21 12L32 16L43 12L54 18L59 40L50 42L47 28V56H17V28L14 42L5 40L10 18Z', '#2b3354')
    + F('M43 12L54 18L59 40L50 42L47 28V56H38L42 20Z', dk('#2b3354', 0.3))
    + S(rect(23, 7, 18, 9, 2), '#353e64', { w: 2 })
    + L('M32 16V56', dk('#2b3354', 0.5), 1.8)
    + S(circ(32, 24, 3) + circ(32, 33, 3) + circ(32, 42, 3), GOLD, { w: 1.8 })
    + L([24, 33, 42].map((y) => `M30.6 ${y}Q32 ${y - 1.8} 33.4 ${y}`).join(''), '#8a5a10', 1.2)
    + L('M17 52H47', '#4a5480', 1.4) + H('M12 20L20 15L18 28L14 34Z', 0.45) + H('M24 8.5H35V10.5H24Z', 0.45),
  // Six Eyes Blindfold: the black blindfold under white hair, the six eyes glowing through.
  hex_eye: S('M10 31L13 13L20 21L24 6L31 18L35 5L40 19L47 9L48 23L54 15L54 31Q32 22 10 31Z', '#e6ecfa')
    + F('M40 19L47 9L48 23L54 15L54 31Q46 27 40 27Z', dk('#e6ecfa', 0.18))
    + S('M54 32L60 46L55 47L52 38Z', '#2a2a3c', { w: 1.8 }) + S('M54 34L50 50L46 48L50 36Z', '#2a2a3c', { w: 1.8 })
    + S('M6 30Q32 20 58 30V41Q32 31 6 41Z', '#2a2a3c')
    + F('M32 32Q46 32 58 36V41Q46 35 32 35Z', dk('#2a2a3c', 0.4))
    + AURA(32, 33, 14, '#5ad8ff') + S(ell(32, 33, 6.5, 3.6), '#5ad8ff', { w: 1.8 }) + F(circ(32, 33, 1.6), '#ffffff')
    + H('M13 27L15 17L19 23L18 28Z', 0.55) + SP(48, 51, 3.2, '#bff4ff') + SP(16, 51, 2.4, '#bff4ff'),
  // Paper Talisman Blade: a blade of folded ofuda, its edge lit with cursed energy.
  paper_blade: ROT(45, 32, 32,
    L('M28 46V6L32 -4L36 6V46', '#c080ff', 4, 0.5)
    + S('M28 46V6L32 -4L36 6V46Z', PAPER)
    + F('M33.5 3L36 6V46H33.5Z', dk(PAPER, 0.18))
    + L('M28 12L36 16M28 20L36 24M28 28L36 32M28 36L36 40', dk(PAPER, 0.3), 1.2)
    + L('M32 7V11M32 17V21M32 25V29M32 33V37', RED, 1.6)
    + S(rect(21, 45, 22, 5, 1.5), '#8a2a2a', { w: 2 })
    + S(rect(29, 50, 6, 11, 1), '#2a2034', { w: 2 }) + L('M29 53L35 55M29 57L35 59', '#5a4a70', 1.2)
    + S(circ(32, 63.5, 2.6), RED, { w: 1.8 })
    + H('M29.5 9L32 2V42H29.5Z', 0.5)),
  // Veil Shroud: a hooded black cloak, darkness inside, a talisman pinned on the chest.
  veil_shroud: S('M32 5Q47 5 48 22L52 40L58 57L50 54L44 58L38 54L32 58L26 54L20 58L14 54L6 57L12 40L16 22Q17 5 32 5Z', '#3a2c5c')
    + F('M44 10Q48 16 48 22L52 40L58 57L50 54L44 58L42 30Z', dk('#3a2c5c', 0.3))
    + S(ell(32, 22, 9, 10.5), '#100a1a', { w: 2 })
    + F(ell(28.5, 22, 1.6, 1.2) + ell(35.5, 22, 1.6, 1.2), '#c080ff')
    + L('M24 36L22 52M40 36L42 52', dk('#3a2c5c', 0.5), 1.6)
    + tag(28, 36, 8, 14)
    + H('M20 18Q22 8 30 7Q24 12 22 24Z', 0.5),
  // Matriarch's Rosary: dark prayer beads with violet beads and a heavy tassel.
  matriarch_rosary: L(ell(32, 24, 19, 17), dk('#5a2c4c', 0.3), 1.4)
    + (() => { const p = arc(32, 24, 19, 17, 16, Math.PI * 0.62, Math.PI * 2.38);
      return S(p.filter((_, i) => i % 4).map(([x, y]) => circ(x, y, 3.6)).join(''), '#6a3458', { w: 1.8 })
        + S(p.filter((_, i) => !(i % 4)).map(([x, y]) => circ(x, y, 3.8)).join(''), '#a066f0', { w: 1.8 })
        + H(p.filter((_, i) => i % 2).map(([x, y]) => ell(x - 1.2, y - 1.3, 1.2, 0.8)).join(''), 0.5); })()
    + S('M28.5 47L25 59H39L35.5 47Z', '#8a3cb8', { w: 1.8 }) + F('M34 47H35.5L39 59H35Z', dk('#8a3cb8', 0.3))
    + L('M29 52L28.5 57M32 52V57M35 52L35.5 57', dk('#8a3cb8', 0.45), 1.2)
    + S(circ(32, 43, 5.5), '#a066f0') + F('M35 39Q38 43 35.5 47Q33 48 31 48Q36 45 35 39Z', dk('#a066f0', 0.3))
    + H(ell(30, 41, 1.8, 1.2), 0.6) + H(ell(19, 14, 3, 1.6), 0.5),
  // Cursed Box: a dark lacquered chest sealed with talismans, violet light leaking out.
  cursed_box: AURA(32, 28, 26, '#a060ff')
    + S(rect(7, 28, 50, 29, 2), '#43365a')
    + F('M46 28H57V57H46Z', dk('#43365a', 0.3))
    + S('M7 28V20Q7 12 15 12H49Q57 12 57 20V28Z', '#57487a')
    + F('M46 12H49Q57 12 57 20V28H46Z', dk('#57487a', 0.3))
    + L('M8 28H56', '#d0a0ff', 2.4)
    + L('M8 45H56', dk('#43365a', 0.4), 1.4) + H('M10 15H40V17.5H10Z', 0.45) + H('M10 31H24V33H10Z', 0.45)
    + tag(14, 9, 7, 22) + tag(43, 9, 7, 22)
    + S(rect(27, 23, 10, 12, 2), GOLD, { w: 1.8 }) + S(ell(32, 29, 3, 2.2), '#f6eefc', { w: 1.8 }) + F(circ(32, 29, 1.2), '#9a3cf0'),
  // Spirit Bell Mk I: a small brass handbell with a plain wooden grip.
  tool_exorcism_1: bell({ grip: '#9a6a3a', collar: '#7a5030', metal: '#c89a48', clap: '#6a4a2a' }),
  // Spirit Bell Mk II: a shrine kagura-suzu: gold bell, a rim of jingle bells, red-white streamers.
  tool_exorcism_2: bell({ grip: '#c0392b', collar: GOLD, metal: '#e8b83a', clap: '#8a5a10',
    back: S('M27 21Q12 26 6 42L10.5 44Q15 31 29 24.5Z', '#eeeef4', { w: 1.8 }) + S('M37 21Q52 26 58 42L53.5 44Q49 31 35 24.5Z', '#d03a2e', { w: 1.8 }),
    deco: S([20, 26, 32, 38, 44].map((x) => circ(x, 50.5 + (x === 32 ? 1.6 : x === 20 || x === 44 ? -1.2 : 1), 3)).join(''), '#f6cc4a', { w: 1.8 })
      + L([20, 26, 32, 38, 44].map((x) => { const y = 50.5 + (x === 32 ? 1.6 : x === 20 || x === 44 ? -1.2 : 1) + 0.6; return `M${x - 1.6} ${y}H${x + 1.6}`; }).join(''), '#8a5a10', 1.2) })
    + SP(10, 12, 3),
  // Spirit Bell Mk III: a great bronze temple bell girded with a sacred rope and shide papers.
  tool_exorcism_3: AURA(32, 34, 28, '#a060ff') + bell({ grip: '#2a2030', collar: GOLD, metal: '#9a7448', clap: '#3a2e26',
    deco: S(circ(32, 30, 3.4), GOLD, { w: 1.8 }) + L('M30.2 30H33.8M32 28.2V31.8', '#6a4210', 1.3)
      + S('M20.5 43.6L24 50.5H20.5L22.6 54L17.6 49.4H20.6L17.6 43ZM43.5 43.6L40 50.5H43.5L41.4 54L46.4 49.4H43.4L46.4 43Z', '#fbf6e6', { w: 1.8 })
      + S('M15 36Q32 41 49 36Q50.5 38.5 49 41Q32 46 15 41Q13.5 38.5 15 36Z', '#e8d8a8', { w: 2 })
      + L('M19 37.5L21 42.4M25 38.9L27 43.8M31 39.4L33 44.3M37 39.1L39 44M43 37.9L45 42.7', dk('#e8d8a8', 0.35), 1.3) })
    + SP(9, 13, 3, '#e0c0ff'),
});
// size & placement pass: [scale, dx, dy], bounds checked by render
const FIT = { hex_eye: [1, 0, 3], matriarch_rosary: [1, 0, 0.9], tool_exorcism_1: [1, 0, 0.9], tool_exorcism_2: [1, 0, 0.9], tool_exorcism_3: [1, 0, 0.9] };
for (const [id, [k, dx, dy]] of Object.entries(FIT)) ART[id] = TR(`translate(${32 + dx} ${32 + dy}) scale(${k}) translate(-32 -32)`, ART[id]);
})();
