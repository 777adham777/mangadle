'use strict';
/* Item art — Shinjuku (Jujutsu Kaisen). See js/item-art.js for the helpers and style rules. */
(() => {
const { S, F, L, H, SP, AURA, T, G, GL, lt, dk, mix, circ, ell, rect, poly, star, ROT, TR } = ARTK;
const PAPER = '#f2e8cc', RED = '#c0392b';
// A small paper talisman strip (x,y top-left, w,h) with a red glyph line.
const tag = (x, y, w, h) => S(rect(x, y, w, h, 1), PAPER, { w: 1.8 }) + L(`M${x + w / 2} ${y + 3}V${y + h - 3}`, RED, 1.6) + L(`M${x + 2} ${y + h * 0.35}H${x + w - 2}`, RED, 1.3);
// A ring of beads (rosary)
const beads = (cx, cy, rx, ry, n, c1, c2, from, to) => {
  let m = '';
  for (let i = 0; i <= n; i++) {
    const a = from + (to - from) * (i / n);
    m += S(circ(+(cx + Math.cos(a) * rx).toFixed(1), +(cy + Math.sin(a) * ry).toFixed(1), 3.6), i % 4 === 0 ? c2 : c1, { w: 1.6 });
  }
  return m;
};
Object.assign(ART, {
  // Curse Ash: a grey heap of exorcised ash, a burnt talisman scrap and violet embers.
  hex_ash: ROT(14, 40, 30, S('M35 34V20H45V34Z', PAPER, { w: 1.8 }) + L('M40 22V30', RED, 1.4) + F('M35 20L37 23L39 20L41 24L43 20L45 22V20Z', '#4a3a3a'))
    + S('M6 52Q10 40 20 38Q24 30 33 31Q44 29 48 39Q57 41 58 52Z', '#8e8a98')
    + F('M44 34Q48 39 57 42Q58 52 58 52H46Q50 44 44 34Z', dk('#8e8a98', 0.3))
    + L('M12 48Q22 44 30 47M28 40Q36 37 42 41', dk('#8e8a98', 0.45), 1.4)
    + F(circ(24, 45, 2.2), '#c070ff') + F(circ(38, 48, 1.8), '#c070ff') + F(circ(31, 38, 1.6), '#e0a8ff')
    + L('M18 30Q14 24 19 18Q23 13 19 8', '#a8a4b4', 2, 0.8) + L('M28 26Q26 21 30 17', '#a8a4b4', 1.6, 0.7)
    + H('M14 44Q20 38 28 38Q20 41 16 46Z', 0.45),
  // Curse Residuals: a glob of violet cursed residue dripping and bubbling.
  hex_residue: S(ell(32, 52, 24, 6), '#6a30b8', { w: 2 })
    + S('M14 50Q10 36 20 30Q20 14 34 14Q48 14 46 30Q56 36 50 50Z', '#8a46e0')
    + S('M22 50Q22 56 25 56Q28 56 27 50Z', '#8a46e0', { w: 1.8 }) + S('M40 50Q40 59 43 59Q46 59 45 50Z', '#8a46e0', { w: 1.8 })
    + F('M42 18Q48 24 46 32Q54 36 50 50H40Q48 36 42 18Z', dk('#8a46e0', 0.3))
    + S(circ(28, 34, 4), '#b880ff', { w: 1.6 }) + S(circ(38, 42, 2.8), '#b880ff', { w: 1.4 }) + S(circ(36, 24, 2.4), '#b880ff', { w: 1.4 })
    + H(ell(26, 22, 5, 3), 0.65) + H(ell(27, 33, 1.4, 1), 0.8) + SP(54, 14, 3, '#e0c8ff'),
  // Grudge Ember: a black cursed-energy flame with a violet heart, on a cinder.
  hex_ember: AURA(32, 34, 28, '#b05aff')
    + S(ell(32, 53, 15, 5), '#3a2a2e', { w: 2 })
    + S('M32 5Q42 17 46 24Q54 35 49 45Q45 54 32 54Q19 54 15 45Q11 35 19 26Q21 32 26 33Q22 18 32 5Z', '#2a1a44')
    + S('M32 22Q38 31 41 36Q44 44 39 49Q36 52 32 52Q27 52 24 48Q21 42 26 36Q27 40 30 40Q28 31 32 22Z', '#b05aff', { w: 1.6 })
    + F('M32 36Q36 42 36 46Q35 50 32 50Q28 50 28 46Q28 42 32 36Z', '#f2d6ff')
    + H('M20 32Q19 40 22 46Q16 40 20 32Z', 0.35) + SP(50, 14, 3.5, '#e0b8ff') + SP(12, 20, 2.6, '#e0b8ff'),
  // Shade Essence: a pale wisp of a low-grade curse, dark face and yellow eyes.
  hex_shade: L('M14 50Q8 44 12 38M52 48Q58 40 52 34', '#c8d0f0', 2, 0.7)
    + S('M18 30Q18 9 32 9Q46 9 46 30V46Q46 52 41 48Q37 57 32 50Q27 57 23 48Q18 52 18 46Z', '#a8b4e4')
    + F('M40 12Q46 18 46 30V46Q46 52 41 48Q42 30 40 12Z', dk('#a8b4e4', 0.25))
    + S(ell(32, 27, 9, 10), '#221a2e', { w: 1.8 })
    + F(ell(28, 25, 2.4, 3), '#ffe14a') + F(ell(36, 25, 2.4, 3), '#ffe14a') + F('M28 32Q32 36 36 32Q32 34 28 32Z', '#ffe14a')
    + H('M22 26Q22 14 30 12Q24 17 24 28Z', 0.55),
  // Cursed Womb: a sealed flesh pod with a curled shape inside, bound by a talisman.
  hex_core: AURA(32, 32, 30, '#c050ff')
    + S(ell(32, 33, 17, 22), '#9a3070')
    + F('M38 14Q49 22 49 34Q49 50 36 55Q44 42 38 14Z', dk('#9a3070', 0.3))
    + F('M30 24Q22 26 22 34Q22 42 30 42Q36 42 36 36Q36 31 31 31Q27 32 28 36', dk('#9a3070', 0.5), 0.9)
    + F(circ(32, 26, 3.4), dk('#9a3070', 0.55))
    + L('M20 22Q24 18 22 14M44 40Q48 44 46 48M18 40Q22 44 20 48', '#d46aa0', 1.4)
    + ROT(-20, 32, 33, S(rect(10, 30, 44, 8, 1), PAPER, { w: 1.8 }) + T(32, 34.5, 7, '封', RED))
    + H(ell(25, 18, 4.5, 3), 0.6),
  // Void Grudge: a sphere of endless space, swirling violet with stars inside.
  hex_void: AURA(32, 32, 30, '#8452ff')
    + S(circ(32, 32, 21), '#241848')
    + L('M14 32Q14 16 32 14Q48 14 48 30Q48 42 36 42Q26 42 26 34Q26 28 32 28Q36 28 36 32', '#8a5cff', 2.6)
    + L('M18 40Q24 50 36 50Q46 50 50 42', '#c8b4ff', 1.8)
    + F(circ(33, 33, 3.4), '#05030c')
    + SP(22, 24, 2.4, '#e8f0ff') + SP(42, 44, 2, '#7df9ff') + SP(44, 22, 1.8, '#ffffff') + SP(54, 10, 3.5, '#c8b4ff')
    + H(ell(22, 20, 5, 2.8), 0.45),
  // Sukuna Finger: a withered dark finger, black nail, ritual bands, a cursed glow.
  hex_crown: AURA(32, 32, 30, '#ff3a6a')
    + ROT(38, 32, 32,
      S('M26 56L25 22Q25 7 32 6Q39 7 39 22L38 56Q32 59 26 56Z', '#7a3c3c')
      + F('M35 8Q39 10 39 22L38 56Q36 57 35 57Z', dk('#7a3c3c', 0.35))
      + S('M28 18Q28 9 32 9Q36 9 36 18Q32 20 28 18Z', '#1a1020', { w: 1.6 })
      + L('M27 29Q32 32 37 29M27 41Q32 44 37 41', dk('#7a3c3c', 0.55), 1.6)
      + F('M26 34H38V36.5H26Z', '#140c14') + F('M26 37.8H38V39H26Z', '#140c14')
      + S(rect(24, 48, 16, 8, 1), PAPER, { w: 1.8 }) + L('M27 52H37', RED, 1.6)
      + H('M27.5 24Q28 14 31 11Q29 18 29 26Z', 0.4)),
  // Binding Vow Talisman: a sealing ofuda with 縛, tied with a red-and-white cord.
  bound_talisman: ROT(-8, 32, 32,
    S(rect(19, 5, 26, 54, 1.5), PAPER)
    + L(rect(22, 8, 20, 48), RED, 1.4) + T(32, 22, 15, '縛', RED)
    + L('M32 44V52M28 48H36', RED, 1.6)
    + S(rect(13, 33, 38, 6, 3), '#d03a2e', { w: 1.8 }) + L('M18 34L22 38M24 34L28 38M36 34L40 38M42 34L46 38', '#ffffff', 1.4)
    + S(circ(32, 36, 4), '#d03a2e', { w: 1.8 }) + S('M30 39L26 50L31 47Z', '#d03a2e', { w: 1.4 }) + S('M34 39L38 50L33 47Z', '#d03a2e', { w: 1.4 })
    + H('M21 7H43V9.5H21Z', 0.5)),
  // Veil Shard: a curved shard of the black Veil, dripping like ink.
  veil_shard: S('M12 46L22 7L54 18L46 50Z', '#2a2848')
    + F('M22 7L54 18L46 50L38 30Z', '#3c3a66')
    + L('M22 7L38 30L46 50M38 30L12 46', '#6a66b0', 1.4)
    + F('M18 46Q18 54 21 54Q24 54 23 46Z', '#2a2848') + F('M38 49Q38 58 41 58Q44 58 43 48Z', '#2a2848')
    + L('M12 46L22 7L54 18', '#9a8cff', 1.4, 0.8)
    + H('M23 12L28 13L18 40L16 41Z', 0.4) + SP(52, 8, 3.5, '#c8c0ff'),
  // Matriarch's Eye: a huge cursed eyeball, violet slit iris, trailing nerve.
  matriarch_eye: S('M16 44Q8 52 10 58Q14 54 20 50Z', '#c86a7a', { w: 1.8 })
    + S(circ(33, 30, 21), '#f2ece2')
    + F('M46 14Q55 24 53 36Q50 48 38 51Q50 38 46 14Z', dk('#f2ece2', 0.2))
    + L('M14 26Q18 28 19 24M16 38Q20 37 22 40M48 44Q46 40 49 38M46 16Q44 20 47 22', '#d0404a', 1.3)
    + S(circ(36, 29, 11), '#9a3cf0') + F(circ(36, 29, 7), dk('#9a3cf0', 0.35))
    + F(ell(36, 29, 2.4, 7), '#120818')
    + H(ell(30, 23, 3.4, 2.4), 0.85) + H(ell(22, 18, 4, 2.4), 0.5),
  // Cursed Fragment: a cluster of violet crystals veined with black technique marks.
  cursed_fragment: S('M8 54V40L14 33L21 41V54Z', '#b886ff', { w: 2 })
    + S('M20 54L17 24L26 8L35 24L33 54Z', '#9a5cf0')
    + S('M32 54L35 28L46 19L53 33L46 54Z', '#7a40d0')
    + F('M26 8L35 24L33 54L27 54Z', dk('#9a5cf0', 0.25)) + F('M46 19L53 33L46 54L42 54Z', dk('#7a40d0', 0.25))
    + L('M24 22L28 30L24 36L28 44', '#140c1c', 1.8) + L('M42 30L46 38L42 46', '#140c1c', 1.6)
    + S(ell(32, 55, 26, 3.5), '#4a3a5a', { w: 1.8 })
    + H('M21 26L26 12L24 30Z', 0.55) + SP(54, 12, 3.5, '#e0c8ff'),
  // Playful Cloud: Maki's red three-section staff, linked by short chains.
  cursed_cleaver: ROT(-45, 18, 46, S(rect(6, 42, 24, 8, 3.5), '#cf3d28') + F(rect(8, 42, 4, 8), '#f2c040') + F(rect(24, 42, 4, 8), '#f2c040') + H('M10 43.2H26V45H10Z', 0.45))
    + ROT(-45, 38, 26, S(rect(26, 22, 24, 8, 3.5), '#cf3d28') + F(rect(28, 22, 4, 8), '#f2c040') + F(rect(44, 22, 4, 8), '#f2c040') + H('M30 23.2H46V25H30Z', 0.45))
    + S(rect(48, 24, 8, 24, 3.5), '#cf3d28') + F(rect(48, 26, 8, 4), '#f2c040') + F(rect(48, 42, 8, 4), '#f2c040') + H('M49.4 28H51V44H49.4Z', 0.45)
    + L(circ(28.5, 35.5, 2.4), '#8a8e9c', 2) + L(circ(48.5, 18.5, 2.4), '#8a8e9c', 2) + L(circ(52, 21.5, 2), '#8a8e9c', 2)
    + SP(10, 14, 3, '#ffd0a0'),
  // Jujutsu High Uniform: the dark high-collared jacket with gold swirl buttons.
  grudge_mail: S('M21 12L32 16L43 12L54 18L59 40L50 42L47 28V56H17V28L14 42L5 40L10 18Z', '#2b3354')
    + F('M43 12L54 18L59 40L50 42L47 28V56H38L42 20Z', dk('#2b3354', 0.3))
    + S(rect(23, 7, 18, 9, 2), '#353e64', { w: 2 })
    + L('M32 16V56', '#141a30', 1.8)
    + [24, 33, 42].map((y) => S(circ(32, y, 3), '#f0c040', { w: 1.6 }) + L(`M30.8 ${y}Q32 ${y - 1.6} 33.2 ${y}Q32 ${y + 1.2} 31.6 ${y}`, '#8a5a10', 1)).join('')
    + L('M17 52H47', '#4a5480', 1.4) + H('M12 20L20 15L18 30L14 36Z', 0.25) + H('M24 8.5H35V10.5H24Z', 0.4),
  // Six Eyes Blindfold: the black blindfold under white hair, the six eyes glowing through.
  hex_eye: S('M10 31L13 13L20 21L24 6L31 18L35 5L40 19L47 9L48 23L54 15L54 31Q32 22 10 31Z', '#eef3ff')
    + F('M40 19L47 9L48 23L54 15L54 31Q46 27 40 27Z', dk('#eef3ff', 0.15))
    + S('M54 32L60 46L55 47L52 38Z', '#1e1e2c', { w: 1.8 }) + S('M54 34L50 50L46 48L50 36Z', '#1e1e2c', { w: 1.8 })
    + S('M6 30Q32 20 58 30V41Q32 31 6 41Z', '#1e1e2c')
    + AURA(32, 33, 14, '#5ad8ff') + S(ell(32, 33, 6.5, 3.6), '#5ad8ff', { w: 1.6 }) + F(circ(32, 33, 1.6), '#ffffff')
    + H('M9 31Q32 22 55 31Q32 25 9 33Z', 0.25) + SP(48, 50, 3.5, '#bff4ff') + SP(16, 50, 2.4, '#bff4ff'),
  // Paper Talisman Blade: a blade of folded ofuda, its edge lit with cursed energy.
  paper_blade: ROT(45, 32, 32,
    L('M28 46L28 12L32 4L36 12L36 46', '#c080ff', 4, 0.5)
    + S('M28 46L28 12L32 4L36 12L36 46Z', PAPER)
    + L('M28 14L36 18M28 22L36 26M28 30L36 34M28 38L36 42', dk(PAPER, 0.3), 1.2)
    + L('M32 9V13M32 19V23M32 27V31M32 35V39', RED, 1.6)
    + S(rect(21, 45, 22, 5, 1.5), '#8a2a2a', { w: 2 })
    + S(rect(29, 50, 6, 9, 1), '#2a2034', { w: 2 }) + L('M29 53L35 55M29 56L35 58', '#5a4a70', 1.2)
    + H('M29.5 14L32 8V44H29.5Z', 0.4))
    + S('M12 46L8 58L12 56L14 60L16 47Z', PAPER, { w: 1.6 }) + L('M12 48L12 54', RED, 1.3),
  // Veil Shroud: a hooded black cloak, darkness inside, a talisman pinned on the chest.
  veil_shroud: S('M32 5Q47 5 48 22L52 40L58 57L50 54L44 58L38 54L32 58L26 54L20 58L14 54L6 57L12 40L16 22Q17 5 32 5Z', '#3a2c5c')
    + F('M44 10Q48 16 48 22L52 40L58 57L50 54L44 58L42 30Z', dk('#3a2c5c', 0.3))
    + S(ell(32, 22, 9, 10.5), '#100a1a', { w: 2 })
    + F(ell(28.5, 22, 1.6, 1.2), '#c080ff') + F(ell(35.5, 22, 1.6, 1.2), '#c080ff')
    + L('M24 36L22 52M40 36L42 52', dk('#3a2c5c', 0.5), 1.6)
    + tag(28, 36, 8, 14)
    + H('M20 18Q22 8 30 7Q24 12 22 24Z', 0.35),
  // Matriarch's Rosary: dark prayer beads with violet beads and a heavy tassel.
  matriarch_rosary: beads(32, 26, 19, 17, 18, '#5a2c4c', '#a066f0', Math.PI * 0.62, Math.PI * 2.38)
    + S('M29 50L26 60H38L35 50Z', '#8a3cb8', { w: 1.8 }) + L('M29 54L30 59M32 54V59M35 54L34 59', dk('#8a3cb8', 0.4), 1.2)
    + S(circ(32, 45, 5.5), '#a066f0') + F(circ(32, 45, 2), '#140c1c')
    + H(ell(30, 43, 1.8, 1.2), 0.8)
    + S(circ(32, 26, 6), '#f0c040', { w: 1.8 }) + S(circ(32, 26, 2.6), '#a066f0', { w: 1.4 }),
  // Cursed Box: a dark lacquered chest sealed with talismans, violet light leaking out.
  cursed_box: AURA(32, 28, 26, '#a060ff')
    + S(rect(9, 28, 46, 27, 2), '#43365a')
    + F('M44 28H55V55H44Z', dk('#43365a', 0.3))
    + S('M9 28V21Q9 14 16 14H48Q55 14 55 21V28Z', '#57487a')
    + L('M10 28H54', '#d0a0ff', 2.4) + L('M10 28H54', '#ffffff', 0.8, 0.8)
    + tag(15, 12, 7, 20) + tag(42, 12, 7, 20)
    + S(rect(27, 24, 10, 11, 2), '#f0c040', { w: 1.8 }) + S(ell(32, 29.5, 3, 2.2), '#ffffff', { w: 1.2 }) + F(circ(32, 29.5, 1.2), '#9a3cf0')
    + L('M9 44H55', dk('#43365a', 0.4), 1.4) + H('M12 16H40V18H12Z', 0.35),
  // Spirit Bell Mk I: a small brass handbell with a plain wooden grip.
  tool_exorcism_1: ROT(-18, 32, 34,
    S(rect(29, 6, 6, 18, 2.5), '#9a6a3a', { w: 2 })
    + S('M18 48Q18 24 32 22Q46 24 46 48Q32 52 18 48Z', '#c89a48')
    + F('M38 23Q46 26 46 48Q41 50 38 50Z', dk('#c89a48', 0.3))
    + L('M19 42Q32 46 45 42', dk('#c89a48', 0.45), 1.4)
    + S(circ(32, 53, 3.6), '#6a4a2a', { w: 1.8 })
    + H('M22 42Q22 28 30 25Q25 32 25 42Z', 0.5)),
  // Spirit Bell Mk II: a shrine kagura-suzu, tiers of golden bells and red-white streamers.
  tool_exorcism_2: ROT(-20, 32, 32,
    S('M26 38Q22 48 16 58L20 58Q26 48 29 40Z', '#e8e8f0', { w: 1.6 }) + S('M38 38Q42 48 48 58L44 58Q38 48 35 40Z', '#d03a2e', { w: 1.6 })
    + S(rect(29.5, 36, 5, 22, 2), '#7a4a2a', { w: 1.8 }) + S(rect(26, 34, 12, 5, 2), '#f0c040', { w: 1.8 })
    + [[32, 8], [26, 16], [38, 16], [21, 25], [32, 24], [43, 25], [27, 31], [37, 31]].map(([x, y]) => S(circ(x, y, 4.4), '#f2c440', { w: 1.6 }) + L(`M${x - 2.6} ${y + 0.6}H${x + 2.6}`, '#8a5a10', 1.2) + H(ell(x - 1.4, y - 1.6, 1.4, 1), 0.8)).join(''))
    + SP(52, 10, 3.5),
  // Spirit Bell Mk III: a great bronze temple bell under a sacred rope with shide papers.
  tool_exorcism_3: AURA(32, 36, 28, '#a060ff')
    + S(rect(6, 6, 52, 6, 2), '#6a3a22', { w: 2 })
    + S(rect(28, 11, 8, 6, 1), '#2a2030', { w: 1.8 })
    + S('M14 52Q12 20 32 16Q52 20 50 52Z', '#8a6a42')
    + F('M40 18Q51 22 50 52H42Q46 34 40 18Z', dk('#8a6a42', 0.35))
    + L('M15 30H49M14 44H50', '#f0c040', 2) + [20, 26, 32, 38, 44].map((x) => F(circ(x, 25, 1.5), '#f0c040')).join('')
    + S(circ(32, 37, 4), '#f0c040', { w: 1.6 }) + T(32, 37, 5, '祓', '#4a2a10')
    + S(ell(32, 52, 18, 4), '#3a2e26', { w: 2 })
    + S('M10 16Q32 24 54 16V20Q32 28 10 20Z', '#e8d8a8', { w: 1.6 })
    + S('M16 22L14 28L18 28L16 34L19 33', PAPER, { w: 1.4, flat: true }) + S('M48 22L50 28L46 28L48 34L45 33', PAPER, { w: 1.4, flat: true })
    + H('M18 44Q18 26 28 20Q22 30 22 44Z', 0.4) + SP(56, 34, 3.5, '#e0c0ff'),
});
})();
