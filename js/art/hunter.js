'use strict';
/* Item art — Green Island (Hunter x Hunter). See js/item-art.js for the helpers and style rules.
   Also the gathering tools of several worlds (fishing = One Piece, woodcutting = Naruto,
   mining = Bleach, tracking = HxH): tier I wood/iron, II steel/brass, III legendary + aura. */
(() => {
const { S, F, L, H, SP, AURA, T, G, GL, lt, dk, mix, circ, ell, rect, poly, star, ROT, TR } = ARTK;
// RL: outlined rope/stick line (ink under, colour over)
const RL = (d, c, w) => L(d, ART_INK, w + 2.6) + L(d, c, w);
// ROD: shared fishing-rod body (tiers I-III): line to y=ly, bent rod handle bottom-left -> tip top-right, gloss, grip
const ROD = (rod, hi, grip, line, ly) => L(`M52 8V${ly}`, line, 1.4) + RL('M16 48Q24 16 52 8', rod, 4.4) + L('M18.2 41Q25 18 48 10', hi, 1.3, 0.85) + RL('M16 47L11 59', grip, 5.5);
Object.assign(ART, {
  /* ---------------------------------------------------------------- raw trail materials */
  // Wild Fur: a shaggy brown hide bundle tied with twine.
  wild_fur: S('M8 40Q6 30 13 27L16 20L22 25L26 17L31 23L36 15L40 23L46 18L48 26L54 25L54 33Q60 40 54 47Q44 55 30 53Q13 53 8 40Z', '#9a6a3e')
    + L('M16 32L20 28M24 30L28 24M34 28L37 22M42 30L46 25M20 40L24 36M38 38L42 34', dk('#9a6a3e', 0.45), 1.6)
    + S('M10 44Q30 50 55 42Q52 53 32 55Q15 55 10 44Z', '#ecd0a2', { w: 2 })
    + RL('M31 19Q26 34 31 54', '#e2bf6e', 2.4) + H('M14 30Q18 24 24 26Q18 28 16 34Z', 0.45),
  // Swift Feather: a long teal flight feather with speed lines.
  swift_feather: ROT(40, 34, 32,
    S('M32 3Q45 12 43 32Q41 47 33 55Q24 47 22 31Q22 13 32 3Z', '#2fb0c4')
    + F('M32 4Q42 10 43 22L33 24Z', lt('#2fb0c4', 0.5)) + F('M22 34L31 36L33 54Q24 47 22 34Z', dk('#2fb0c4', 0.35))
    + L('M41 38L36 36M24 26L29 28', ART_INK, 1.8) + L('M32 6V61', '#f4fbff', 2.2) + S('M30.5 55H33.5V62H30.5Z', '#e8dcc0', { w: 1.6 }))
    + L('M6 22H18M4 30H14M8 38H16', '#bfefff', 2.2, 0.85),
  // Great Stamp Tusk: a huge curved ivory tusk, root wrapped in a hunter's cord.
  boar_tusk: S('M9 52Q11 34 25 22Q40 10 58 7Q47 16 41 27Q31 41 23 56Q15 58 9 52Z', '#f2e6c8')
    + F('M41 27Q31 41 23 56Q30 40 36 30Q44 18 58 7Q47 16 41 27Z', dk('#f2e6c8', 0.25))
    + S('M9 52Q11 46 14 42L24 48Q22 53 21 57Q14 58 9 52Z', '#8a5a3a', { w: 2 })
    + L('M13 45L22 50M11 49L20 54', '#d8b070', 1.8) + H('M22 26Q34 15 50 10Q36 18 26 30Z', 0.55),
  // Stag Antler: a branched antler with a burr at the base.
  stag_antler: RL('M16 58Q18 42 30 32Q40 24 44 8', '#cba777', 5.5)
    + RL('M23 44Q12 38 9 26M30 32Q23 22 25 10M39 22Q48 20 56 12M33 30Q44 32 54 27', '#cba777', 4.2)
    + L('M17.5 52Q19.5 42 28 34.5', lt('#cba777', 0.55), 1.4) + H(ell(14, 55.5, 3, 1.2), 0.5) + F('M17 60Q22 60 23 57Q20 59.5 13 59.5Z', dk('#7a5a3a', 0.35))
    + S(ell(16, 57, 7, 3.6), '#7a5a3a', { w: 2 }),
  // Lynx Pelt: a spread spotted pelt with tufted ears and stubby tail.
  lynx_pelt: S('M24 11L22 3L28 8Q32 7 36 8L42 3L40 11Q44 14 42 19L54 16L59 24L48 27Q50 38 48 44L58 50L52 57L42 51Q36 55 32 61Q28 55 22 51L12 57L6 50L16 44Q14 38 16 27L5 24L10 16L22 19Q20 14 24 11Z', '#d8ae6c')
    + F('M27 22Q32 20 37 22L36 50Q32 53 28 50Z', lt('#d8ae6c', 0.45))
    + F(circ(20, 32, 2.2) + circ(44, 32, 2.2) + circ(22, 42, 1.8) + circ(42, 42, 1.8) + circ(26, 28, 1.6) + circ(38, 28, 1.6) + circ(32, 38, 1.8), dk('#d8ae6c', 0.6))
    + L('M22 3L24 9M42 3L40 9', ART_INK, 2.4) + F(circ(28, 13, 1.3) + circ(36, 13, 1.3), ART_INK)
    + H('M18 26Q22 22 26 23Q21 26 19 32Z', 0.45),
  // Wyrm Scale: two overlapping jade dragon scales with an iridescent sheen.
  wyrm_scale: S('M20 6Q34 7 36 20Q36 31 20 40Q5 31 6 20Q8 7 20 6Z', '#1f7a6a', { w: 2 })
    + S('M36 14Q54 16 57 32Q57 48 36 59Q15 48 15 32Q18 16 36 14Z', '#2fae8e')
    + L('M24 33Q36 26 48 33M26 42Q36 36 46 42M30 50Q36 46 42 50', dk('#2fae8e', 0.4), 1.8)
    + F('M36 18Q50 20 53 30Q44 22 36 24Z', '#b8fff0', 0.7) + H(ell(26, 26, 5, 3), 0.55) + SP(50, 46, 3.5, '#e8fff8'),
  // Chimera Mane: a tawny lock of mane with an ant-purple sheen, tied with a band.
  chimera_mane: S('M12 52Q16 32 32 22Q46 13 58 7Q50 20 40 27Q50 25 57 23Q47 36 33 40Q43 42 52 44Q36 54 18 56Z', '#c8913a')
    + F('M33 40Q43 42 52 44Q36 54 18 56Q30 46 33 40ZM40 27Q50 25 57 23Q47 36 33 40Z', '#7a3a8a', 0.55)
    + L('M18 50Q26 36 42 26M20 52Q32 44 46 34M22 54Q34 50 46 46', dk('#c8913a', 0.4), 1.4)
    + S('M8 48L16 44L22 54L14 58Z', '#5a2a6a', { w: 2 }) + H('M22 40Q30 28 46 18Q34 28 26 40Z', 0.45),
  // Trail Stone: a small cairn, the middle stone carved with a trail arrow.
  trail_stone: AURA(32, 34, 28, '#7dffb0')
    + S('M8 50Q8 42 20 41H46Q56 42 56 50Q54 57 32 57Q10 57 8 50Z', '#8a8a96')
    + S('M14 38Q14 28 26 27H42Q50 28 50 37Q48 42 32 43Q16 43 14 38Z', '#a0a0ac')
    + S('M22 22Q22 13 32 12Q42 13 42 21Q40 27 32 27Q22 27 22 22Z', '#b4b4c0')
    + L('M24 35H38M33 31L38 35L33 39', '#2f8a5a', 2.6) + F('M10 52Q20 54 30 52Q22 57 12 55Z', '#4fa85a')
    + H(ell(28, 16, 4, 2), 0.6) + H(ell(20, 31, 4, 1.6), 0.45),
  // Beastlord Claw: one huge black claw with a red edge, on a bone knuckle.
  beastlord_claw: AURA(36, 28, 28, '#ff5a4a')
    + S('M16 54Q10 38 20 26Q32 12 56 5Q44 18 40 30Q36 44 32 56Z', '#3a2a36')
    + F('M56 5Q44 18 40 30Q36 44 32 56L28 54Q32 40 38 28Q44 16 56 5Z', '#d0402f')
    + H('M22 30Q32 16 48 9Q34 20 26 34Z', 0.35)
    + S(ell(22, 55, 13, 6), '#ecdcb8', { w: 2 }) + F(ell(26, 57, 6, 2.4), dk('#ecdcb8', 0.3)),
  // Ant King's Heart: a crimson heart under chimera-ant carapace plates, antennae curling up.
  chimera_heart: AURA(32, 34, 30, '#c060ff')
    + RL('M26 18Q22 8 14 6M38 18Q42 8 50 6', '#2a3a2a', 1.8) + F(circ(14, 6, 2.2) + circ(50, 6, 2.2), '#2a3a2a')
    + S('M32 58Q9 42 9 26Q9 14 20 14Q28 14 32 22Q36 14 44 14Q55 14 55 26Q55 42 32 58Z', '#b8304a')
    + S('M11 24Q20 18 32 26Q44 18 53 24Q52 30 44 30Q38 30 32 34Q26 30 20 30Q12 30 11 24Z', '#3a4a3a', { w: 1.8 })
    + L('M22 22V30M42 22V30', '#6a8a6a', 1.4) + L('M24 40Q30 46 32 52M40 38Q38 46 34 50', dk('#b8304a', 0.45), 1.8)
    + H(ell(18, 34, 3.5, 2.2), 0.55) + SP(52, 46, 3.5, '#f0d0ff'),
  // Beast Essence: a green aura flame holding a paw print.
  beast_essence: AURA(32, 34, 30, '#5aff9a')
    + S('M32 59Q13 55 15 38Q17 28 25 22Q24 31 30 33Q27 19 38 7Q38 21 46 27Q53 35 49 46Q45 57 32 59Z', '#3fcf7a')
    + F('M32 55Q21 52 22 42Q24 36 30 37Q36 32 42 38Q46 44 42 50Q38 55 32 55Z', '#b8ffd4', 0.55)
    + F(ell(32, 47, 5.5, 4.5) + circ(24.5, 40.5, 2.4) + circ(29, 36.5, 2.4) + circ(35, 36.5, 2.4) + circ(39.5, 40.5, 2.4), '#effff4')
    + SP(52, 16, 4) + SP(12, 22, 3),
  // Game Meat: a raw marbled cut with a round bone.
  game_meat: S('M9 31Q11 16 28 14Q47 12 53 25Q59 39 46 49Q30 57 16 49Q7 43 9 31Z', '#c8434a')
    + F('M11 30Q13 18 28 16Q46 14 51 25Q42 18 28 19Q16 20 11 30Z', '#f6e2d6')
    + L('M16 38Q24 34 28 42M30 48Q36 42 46 44M20 28Q26 26 30 30', '#f3b2b2', 1.6)
    + S(circ(40, 33, 6), '#f2e6cc', { w: 2 }) + F(circ(40, 33, 2.6), '#b47a6a') + H(ell(20, 24, 4, 2), 0.5),
  /* ---------------------------------------------------------------- food */
  // Hunter's Stew: a wooden bowl of steaming stew, a pork rib sticking out.
  hunters_stew: L('M22 14Q18 9 22 4M32 14Q28 9 32 4M42 14Q38 9 42 4', '#ffffff', 2, 0.7)
    + RL('M40 30L54 14', '#f2e6cc', 3.6) + F(circ(55, 13, 2.6), '#f2e6cc')
    + S(ell(32, 31, 24, 7), '#c46a2a') + F(ell(24, 30, 5, 2.6) + ell(38, 28, 4.5, 2.4), '#8a3a24')
    + F(ell(32, 33, 3.5, 2) + ell(44, 32, 3, 1.8), '#ff9a3a') + F(ell(18, 33, 2.4, 1.4), '#6abf4a')
    + S('M7 31Q8 50 32 54Q56 50 57 31Q46 39 32 39Q18 39 7 31Z', '#8a5a32')
    + L('M12 42Q32 48 52 42', dk('#8a5a32', 0.4), 1.6) + H('M12 36Q16 44 24 47Q16 46 12 40Z', 0.4),
  // Gourmet Hunter Feast: a glazed bone-in roast on a platter, a star fruit slice.
  beast_feast: S(ell(32, 46, 27, 11), '#e8ecf2') + F(ell(32, 44, 21, 7.5), '#c8d0dc')
    + S(circ(10, 30, 4) + circ(13, 25, 4), '#f2e6cc', { w: 2 })
    + S('M15 30Q16 20 30 20Q46 20 48 32Q48 44 32 46Q16 44 15 30Z', '#a8542a')
    + F('M18 36Q30 44 46 36Q44 44 32 45Q20 44 18 36Z', dk('#a8542a', 0.35)) + H('M20 27Q24 22 32 22Q24 26 22 31Z', 0.6)
    + S(star(49, 42, 8, 3.8, 5), '#ffd23f', { w: 1.8 }) + F(circ(49, 42, 1.6), '#c89a1a')
    + L('M26 14Q22 10 26 6M36 14Q32 10 36 6', '#ffffff', 2, 0.7),
  /* ---------------------------------------------------------------- traps (tier 1..6) */
  // Snare: a rope noose on the ground tied to a wooden stake.
  snare: S('M42 10H50V48L46 56L42 48Z', '#9a6a3e') + L('M44 16V46', dk('#9a6a3e', 0.4), 1.4)
    + RL('M46 18Q34 20 28 34', '#d8bc7a', 3)
    + RL(ell(26, 44, 18, 8), '#d8bc7a', 3) + S(circ(28, 35, 3.2), '#b8944a', { w: 1.8 })
    + F('M8 52Q30 58 56 54L56 58H8Z', '#4fa85a', 0.6),
  // Net Trap: a round throwing net with iron weights around its rim.
  net_trap: F(circ(32, 32, 24), '#3a6a5a', 0.35)
    + L('M32 8V56M8 32H56M15 15L49 49M49 15L15 49', '#c8b07a', 1.8)
    + L(circ(32, 32, 9) + circ(32, 32, 17), '#c8b07a', 1.8)
    + RL(circ(32, 32, 24), '#d8c08a', 2.6)
    + S(circ(32, 8, 3.4) + circ(32, 56, 3.4) + circ(8, 32, 3.4) + circ(56, 32, 3.4) + circ(15, 15, 3.2) + circ(49, 49, 3.2) + circ(49, 15, 3.2) + circ(15, 49, 3.2), '#7a8090', { w: 1.8 })
    + S(circ(32, 32, 3.4), '#b8944a', { w: 1.6 }),
  // Cage Trap: a wooden cage with iron bars, the trapdoor raised, bait inside.
  cage_trap: S('M10 22L22 12H54L42 22Z', '#b8844a') + S('M42 22L54 12V46L42 56Z', '#8a5a32')
    + S('M10 22H42V56H10Z', '#3a3040', { w: 2.2 }) + S(ell(26, 50, 7, 4), '#c8434a', { w: 1.8 }) + F(circ(31, 49, 2), '#f2e6cc')
    + L('M16 22V56M22 22V56M28 22V56M34 22V56M47 19V50', '#a8b0bc', 2.2)
    + S('M10 20H42V25H10Z', '#c8945a', { w: 2 }) + S('M10 53H42V58H10Z', '#c8945a', { w: 2 })
    + S('M16 4L34 4L32 14H18Z', '#9aa2b0', { w: 2 }) + RL('M25 4V2', '#d8bc7a', 1.4),
  // Spirit Trap: a paper lantern cage holding a pale spirit flame, a talisman hanging.
  spirit_trap: AURA(32, 34, 28, '#7ae0ff')
    + S('M22 6H42V12H22Z', '#3a2a36', { w: 2 }) + RL('M32 2V6', '#c8b07a', 1.6)
    + S('M18 14Q32 10 46 14Q54 34 46 52Q32 56 18 52Q10 34 18 14Z', '#f0ead8')
    + S('M32 48Q22 46 24 36Q26 30 30 26Q30 32 33 33Q32 26 38 20Q38 28 41 32Q44 38 40 44Q38 48 32 48Z', '#7ae0ff', { w: 1.8 })
    + F('M32 46Q27 44 28 38Q30 36 32 38Q34 36 36 39Q37 44 32 46Z', '#ffffff', 0.8)
    + L('M14 26Q32 22 50 26M13 40Q32 36 51 40', '#c8b48a', 1.6) + S('M22 52H42V58H22Z', '#3a2a36', { w: 2 })
    + S('M44 44H52V60H44Z', '#f6ecc8', { w: 1.6 }) + L('M46 48H50M46 52H50M46 56H49', '#c0392b', 1.4),
  // Wyrm Trap: a barbed iron hook on a heavy chain, runes glowing teal.
  wyrm_trap: S(ell(30, 8, 4.5, 6), '#6a7080', { w: 2 }) + S(ell(30, 18, 6, 4.5), '#6a7080', { w: 2 })
    + F(ell(30, 8, 1.6, 3) + ell(30, 18, 3, 1.6), ART_INK)
    + S('M26 22H34V40Q34 50 42 50Q50 50 50 42V38L44 42L46 30L56 38V42Q56 58 42 58Q26 58 26 42Z', '#8a92a2')
    + F('M26 40Q26 56 42 56Q30 54 30 40V22H26Z', dk('#8a92a2', 0.35))
    + L('M30 26V36M40 54H46', '#5affd8', 2) + H('M28 24H30V38H28Z', 0.5) + SP(54, 24, 3.5, '#bfffee'),
  // Chimera Trap: open steel jaws with a carapace pressure plate and a violet Nen glow.
  chimera_trap: AURA(32, 34, 30, '#b060ff')
    + RL('M6 56Q10 48 16 46', '#7a8090', 2)
    + S(ell(32, 36, 24, 15), '#5a6070') + F(ell(32, 36, 17, 9.5), '#2a2234')
    + S('M10 32L14 24L18 30L22 22L26 29L30 21L34 29L38 21L42 29L46 22L50 30L54 24L54 32Q32 22 10 32Z', '#d8dee8', { w: 1.8 })
    + S('M10 40Q32 52 54 40L52 48L48 42L44 50L40 44L36 52L32 45L28 52L24 44L20 50L16 42L12 48Z', '#d8dee8', { w: 1.8 })
    + S(ell(32, 37, 8, 4.5), '#6a3a8a', { w: 1.8 }) + L('M28 37H36M32 34V40', '#c89aff', 1.4)
    + H(ell(20, 28, 4, 1.6), 0.4),
  /* ---------------------------------------------------------------- baits */
  // Fish Bait: an open tin of wriggling pink worms.
  fish_bait: S('M12 30H52V52Q52 58 32 58Q12 58 12 52Z', '#a8b0bc')
    + F('M12 38H52V48H12Z', '#e8743a') + F('M24 43Q28 39 34 43Q28 47 24 43ZM34 43L38 40V46Z', '#ffffff')
    + RL('M20 30Q16 20 22 16Q28 14 26 22', '#f28aa0', 3) + RL('M34 30Q36 18 44 20Q50 22 46 10', '#f28aa0', 3)
    + S(ell(32, 30, 20, 5.5), '#6a7080', { w: 2 }) + F(ell(32, 30.5, 16, 3.6), '#6a3a2a')
    + RL('M24 30Q30 26 36 30', '#f28aa0', 2.6) + H('M15 34H18V52H15Z', 0.45),
  // Scent Lure: a stoppered flask of green musk, a feather tied to its neck.
  scent_lure: L('M38 12Q44 8 42 3M46 16Q54 12 52 5', '#c8ffb0', 2, 0.85)
    + S('M26 8H38V14H26Z', '#a8743a', { w: 2 }) + S('M27 14H37V22Q50 26 50 40Q50 56 32 56Q14 56 14 40Q14 26 27 22Z', '#e8f4f0')
    + F('M16 38Q32 34 48 38Q50 54 32 55Q14 54 16 38Z', '#5abf4a')
    + L(ell(32, 46, 9, 5), '#d0c0f0', 1.6) + F(ell(32, 46, 3, 2), '#b8a0f0')
    + S('M14 22Q8 14 12 6Q18 12 20 20Z', '#2fb0c4', { w: 1.8 }) + L('M12 7Q15 15 22 22', '#f4fbff', 1.4)
    + H('M19 30Q22 25 27 24Q22 30 21 36Z', 0.65),
  /* ---------------------------------------------------------------- hunter gear */
  // Hunter's Glaive: a broad curved blade on a long haft, a Hunter-green tassel.
  hunter_glaive: ROT(45, 32, 32,
    S('M30 22H34V62H30Z', '#5a3a2a', { w: 2 }) + L('M30 34L34 37M30 44L34 47M30 54L34 57', '#8a6a4a', 1.4)
    + S('M29 24V8Q38 -1 44 4Q46 14 40 22Q36 26 29 24Z', '#d0d8e2') + F('M30 22V9Q36 4 40 4Q34 10 33 23Z', '#ffffff', 0.55)
    + S('M26 22H38V26H26Z', '#c8a040', { w: 2 }) + S('M27 26L23 38L28 36L30 40L32 27Z', '#3fbf5a', { w: 1.6 }))
    + SP(52, 8, 3.5),
  // Wildhide Coat: a green field jacket with a shaggy fur collar.
  wildhide_coat: S('M20 12L11 16L5 34L13 37L15 28V56H49V28L51 37L59 34L53 16L44 12Q38 18 32 18Q26 18 20 12Z', '#3f9a4a')
    + F('M44 12L53 16L59 34L51 37L49 28V56H42Q48 40 44 12Z', dk('#3f9a4a', 0.3))
    + L('M32 20V56', dk('#3f9a4a', 0.5), 2) + S('M18 40H27V47H18Z', '#2f7a3a', { w: 1.6 }) + S('M37 40H46V47H37Z', '#2f7a3a', { w: 1.6 })
    + S('M18 10L22 16L26 12L29 18L32 14L35 18L38 12L42 16L46 10L44 22Q38 26 32 24Q26 26 20 22Z', '#d8b880', { w: 1.8 })
    + H('M17 30Q20 24 24 24Q20 32 19 40Z', 0.35),
  // Star Hunter Badge: a gold star on a green ribbon, a white star at its heart.
  star_badge: S('M22 4H30L32 18L26 22ZM42 4H34L32 18L38 22Z', '#3f9a4a', { w: 2 })
    + AURA(32, 38, 22, '#fff0a0')
    + S(star(32, 38, 22, 10, 5), '#f2c230')
    + S(circ(32, 38, 8.5), '#2f8a3a', { w: 2 }) + F(star(32, 38, 6, 2.6, 5), '#ffffff')
    + H('M20 30L28 30L24 24Z', 0.55) + SP(52, 14, 3.5),
  // Wyvern-Bone Bow: a bone-segment bow with leathery wing fins, arrow nocked.
  wyvern_bow: S('M14 22Q8 12 12 6Q16 14 22 16Z', '#7a4a6a', { w: 1.8 }) + S('M42 50Q52 56 58 52Q50 48 48 42Z', '#7a4a6a', { w: 1.8 })
    + L('M12 10L52 50', '#e8e0d0', 1.4) + RL('M12 10Q14 50 52 52', '#eee2c4', 4.2)
    + L('M14 22L16 25M18 36L21 38M28 46L30 49M40 51L41 54', dk('#eee2c4', 0.5), 1.6)
    + S('M17 36L22 31L27 36L22 41Z', '#5a3a2a', { w: 1.8 })
    + RL('M26 36L52 10', '#8a6a4a', 2) + S('M52 6L58 6L58 12L50 14Z', '#c0c8d4', { w: 1.6 })
    + F('M24 34L20 36L22 40L28 38Z', '#d0402f'),
  // Beastlord Mantle: a fur-trimmed cape, a horned beast skull on one shoulder.
  beastlord_mantle: S('M14 18Q32 10 50 18Q56 36 54 58L46 54L40 59L32 54L24 59L18 54L10 58Q8 36 14 18Z', '#8a3a2a')
    + F('M40 16Q50 18 52 26Q55 40 54 58L46 54Q50 34 40 16Z', dk('#8a3a2a', 0.3))
    + S('M10 22L14 14L18 20L22 13L26 19L32 12L38 19L42 13L46 20L50 14L54 22Q44 30 32 28Q20 30 10 22Z', '#c8c0b0', { w: 1.8 })
    + S('M36 18Q38 10 46 10Q54 10 56 18Q56 26 46 28Q38 26 36 18Z', '#ece2c8', { w: 2 })
    + RL('M38 12Q32 6 34 2M54 12Q60 6 58 2', '#ece2c8', 2.2)
    + F(ell(42.5, 17, 2.4, 2.8) + ell(49.5, 17, 2.4, 2.8), '#2a1a22') + F('M46 22L44.5 25H47.5Z', '#2a1a22')
    + H('M14 34Q16 28 20 28Q16 36 16 44Z', 0.35),
  // Chimera Fang Pendant: a curved fang on a cord, capped in violet with beads.
  chimera_fang: RL('M10 6Q16 26 32 30Q48 26 54 6', '#8a5a3a', 1.8)
    + S(circ(20, 22, 2.8) + circ(44, 22, 2.8), '#c89aff', { w: 1.6 })
    + S('M26 32Q32 26 38 32Q38 44 32 52Q28 58 26 60Q28 50 28 44Q26 38 26 32Z', '#f4ead2')
    + F('M38 32Q38 44 32 52Q28 58 26 60Q32 46 33 36Z', dk('#f4ead2', 0.3))
    + S('M24 28H40L38 35H26Z', '#7a3aa8', { w: 2 }) + S(circ(32, 31, 2.4), '#e0c0ff', { w: 1.4 })
    + H('M28 36Q30 34 31 36L29 46Z', 0.6) + SP(48, 44, 3.5, '#f0d8ff'),
  // Hunter's Cache: a battered explorer's pack, bedroll on top, a licence card tag.
  hunters_cache: S('M10 16Q10 8 32 8Q54 8 54 16Q54 22 32 22Q10 22 10 16Z', '#3f6a8a', { w: 2 })
    + L('M18 10V22M46 10V22', dk('#3f6a8a', 0.4), 1.6)
    + S('M14 20Q14 18 18 18H46Q50 18 50 22V54Q50 58 46 58H18Q14 58 14 54Z', '#8a7a4a')
    + S('M14 22Q32 18 50 22V38Q32 42 14 38Z', '#6a5a32', { w: 2 }) + S('M28 34H36V42H28Z', '#c8a040', { w: 1.6 })
    + S('M20 44H44V54H20Z', '#7a6a3a', { w: 1.8 })
    + S('M40 40L54 44L51 56L37 52Z', '#f2f2ea', { w: 1.6 }) + F('M42 44L50 46L49 50L41 48Z', '#3a3a4a') + L('M41 52L48 54', '#d0402f', 1.4)
    + H('M16 26Q20 22 26 22Q18 26 18 34Z', 0.4),
  /* ---------------------------------------------------------------- tools: Tracking (HxH) */
  // Examinee's Compass: a simple wooden clamshell compass, a trail arrow carved in its lid.
  tool_tracking_1: S('M16 26Q14 6 32 4Q50 6 48 26Z', '#a8743a') + F('M42 8Q50 12 48 26H44Q46 14 42 8Z', dk('#a8743a', 0.3))
    + L('M32 21V10M27 15L32 10L37 15', dk('#a8743a', 0.45), 2) + H('M20 20Q22 12 28 9Q24 14 22 20Z', 0.45)
    + S(circ(32, 41, 18), '#a8743a') + S(circ(32, 41, 13.5), '#f2e6c8', { w: 2 }) + S('M28 23H36V27H28Z', '#6a7080', { w: 1.8 })
    + L('M32 30V33M32 49V52M21 41H24M40 41H43', '#8a6a4a', 1.6)
    + S('M32 29L35.5 41H28.5Z', '#d0402f', { w: 1.8 }) + S('M32 53L35.5 41H28.5Z', '#4a5a8a', { w: 1.8 })
    + F(circ(32, 41, 1.8), ART_INK) + F('M45 35Q48 48 36 54Q46 46 43 35Z', dk('#f2e6c8', 0.2)) + H('M18 36Q20 28 28 25Q22 32 21 38Z', 0.55),
  // Licensed Compass: a steel clamshell compass, paw print on its open lid.
  tool_tracking_2: S('M16 26Q14 6 32 4Q50 6 48 26Z', '#9aa4b4') + F('M42 8Q50 12 48 26H44Q46 14 42 8Z', dk('#9aa4b4', 0.3))
    + F(ell(32, 18, 4.5, 3.6) + circ(25.5, 12.5, 2.2) + circ(30, 9.5, 2.2) + circ(34, 9.5, 2.2) + circ(38.5, 12.5, 2.2), '#4a5262')
    + S(circ(32, 41, 18), '#b8c2d0') + S(circ(32, 41, 13.5), '#f4f6f0', { w: 2 }) + S('M28 23H36V27H28Z', '#c8a040', { w: 1.6 })
    + L('M32 30V33M32 49V52M21 41H24M40 41H43', '#5a6272', 1.6)
    + S('M32 29L35.5 41H28.5Z', '#d0402f', { w: 1.4 }) + S('M32 53L35.5 41H28.5Z', '#3a4a7a', { w: 1.4 })
    + F(circ(32, 41, 1.8), ART_INK) + H('M18 36Q20 28 28 25Q22 32 21 38Z', 0.55),
  // Triple-Star Compass: a gold compass with a Hunter-green gem, three stars and a Nen glow.
  tool_tracking_3: AURA(32, 36, 30, '#7dffb0')
    + S('M14 26Q12 4 32 2Q52 4 50 26Z', '#e8b830') + F('M44 6Q52 12 50 26H46Q48 14 44 6Z', dk('#e8b830', 0.3))
    + F(star(22, 16, 4.5, 2, 5) + star(32, 11, 5, 2.2, 5) + star(42, 16, 4.5, 2, 5), '#fff6c8')
    + S(circ(32, 42, 19), '#f2c230') + S(circ(32, 42, 14), '#1f3a2a', { w: 2 })
    + L('M32 30V33M32 51V54M20 42H23M41 42H44', '#7dffb0', 1.6)
    + S('M32 29L36 42H28Z', '#7dffb0', { w: 1.4 }) + S('M32 55L36 42H28Z', '#f2c230', { w: 1.4 })
    + S(circ(32, 42, 2.6), '#3fdf7a', { w: 1.4 }) + S(ell(32, 24, 4, 3), '#3fdf7a', { w: 1.6 })
    + H('M17 38Q19 29 27 26Q21 33 20 40Z', 0.55) + SP(54, 32, 4) + SP(10, 44, 3),
  /* ---------------------------------------------------------------- tools: Fishing (One Piece) */
  // Merry Bamboo Rod: a bent bamboo rod with a cork grip, string line and a red-and-white bobber.
  tool_fishing_1: ROD('#d8c068', '#f4e6a8', '#c8945a', '#eef2f6', 30)
    + L('M18.9 32.3L23.6 34.7M27.1 20.3L30.9 23.7M37.9 11.3L40.6 15.7', dk('#d8c068', 0.55), 1.8) + L('M12.3 49.7L16.7 51.5M10.3 54.5L14.7 56.3', dk('#c8945a', 0.45), 1.4)
    + S(circ(52, 36, 6.5), '#f2efe8', { w: 2 }) + F('M45.5 36A6.5 6.5 0 0 1 58.5 36Z', '#d0402f') + F('M58 37.5A6 6 0 0 1 52 42Q56 40 57 37.5Z', dk('#f2efe8', 0.3))
    + L('M45.5 36H58.5', ART_INK, 1.6) + H(ell(49.5, 32.5, 2, 1.2), 0.7),
  // Sniper Island Rod: a lacquered steel-guided rod with a brass reel, the line ending in an orange fish lure.
  tool_fishing_2: ROD('#3a5aa8', lt('#3a5aa8', 0.5), '#8a2a2a', '#eef2f6', 33.5)
    + S(circ(29, 22, 2.2) + circ(39.3, 13.5, 2), '#d8dee8', { w: 1.8 }) + L('M12.3 49.7L16.7 51.5M10.3 54.5L14.7 56.3', '#c85a4a', 1.4)
    + S(circ(24, 45, 5.5), '#e8c050', { w: 2 }) + S(circ(24, 45, 2.2), '#8a6a2a', { w: 1.8 }) + RL('M24 45L29 50', '#5a6272', 1.6) + H(ell(22, 42, 1.6, 1), 0.6)
    + S('M41 36Q48 30 54 35L58 31.5V40.5L54 37Q48 42 41 36Z', '#ff8a2a', { w: 2 }) + F('M42 36.6Q48 41 54 37Q48 39 42 36.6Z', dk('#ff8a2a', 0.35))
    + F(circ(45.5, 35, 1.3), ART_INK) + RL('M47 39.5Q46 44 49 45', '#c0c8d4', 1.4) + H(ell(48, 33.5, 2.4, 0.9), 0.6),
  // Den Den Mushi Rod: a gold rod whose reel is a snail-phone, a straw-hat lure on sea-blue line.
  tool_fishing_3: AURA(34, 32, 30, '#5ad8ff')
    + ROD('#f2c230', '#fff4b0', '#2a3a8a', '#5ad8ff', 30) + L('M12.3 49.7L16.7 51.5M10.3 54.5L14.7 56.3', '#f2c230', 1.4)
    + S('M18 54Q19 50 25 50H32Q36 52 33 55H20Q18 55 18 54Z', '#8ad06a', { w: 1.8 }) + RL('M31 51L33 45.5M33.5 52L37.5 47', '#8ad06a', 1.4)
    + S(circ(24, 45, 6), '#f2a2a8') + L('M24 45m-3 0a3 3 0 1 1 3 3a1.5 1.5 0 1 1 -1.5 -1.5', '#b8565e', 1.6) + H(ell(21.5, 41.5, 1.8, 1.1), 0.6)
    + S(ell(52, 37, 8, 2.8), '#f2d060', { w: 1.8 }) + S('M47.5 36Q47.5 28.5 52 28.5Q56.5 28.5 56.5 36Z', '#f2d060', { w: 1.8 })
    + F('M47.6 32.6H56.4V34.6H47.6Z', '#d0402f') + F('M56.4 36Q56.4 30 53 28.8Q55 32 54.5 36Z', dk('#f2d060', 0.3)) + H(ell(50, 30.8, 1.3, 0.9), 0.6)
    + SP(12, 24, 3.5) + SP(44, 52, 3),
  /* ---------------------------------------------------------------- tools: Woodcutting (Naruto) */
  // Academy Saw: a short pruning saw with a plain wooden handle and an iron ferrule.
  tool_woodcutting_1: ROT(45, 32, 32,
    S('M27 6Q32 2 37 6V42H27Z', '#b8c0cc')
    + L('M27 9L24.5 11L27 13L24.5 15L27 17L24.5 19L27 21L24.5 23L27 25L24.5 27L27 29L24.5 31L27 33L24.5 35L27 37L24.5 39L27 41', ART_INK, 1.8)
    + F('M33 5Q35 4.5 37 6V42H33Z', dk('#b8c0cc', 0.25)) + H('M28.5 8H30.5V40H28.5Z', 0.45)
    + S('M25 41H39V45H25Z', '#7a8090', { w: 2 })
    + S('M27 45H37V60Q32 62 27 60Z', '#a8743a') + F('M33.5 45H37V60Q35 61 33.5 61Z', dk('#a8743a', 0.3), 0.8)
    + L('M27 50H37M27 55H37', dk('#a8743a', 0.45), 1.4) + F(circ(32, 57.5, 1.4), ART_INK)),
  // Leaf Lumber Saw: a long steel saw, the Leaf mark on the blade, a shinobi-wrapped grip.
  tool_woodcutting_2: ROT(45, 32, 32,
    S('M25 4H39V42H25Z', '#c8d0dc')
    + L('M25 6L22.5 8.5L25 11L22.5 13.5L25 16L22.5 18.5L25 21L22.5 23.5L25 26L22.5 28.5L25 31L22.5 33.5L25 36L22.5 38.5L25 41', ART_INK, 1.8)
    + F('M35 4H39V42H35Z', dk('#c8d0dc', 0.25)) + F('M26 5H29V41H26Z', '#ffffff', 0.45)
    + L('M28 24Q30 18 34 19Q37 21 35 25Q33 28 31 26Q30 24 32 23', '#4a5268', 1.8) + L('M35 25L37 29', '#4a5268', 1.8)
    + S('M23 42H41V46H23Z', '#5a6272', { w: 2 })
    + S('M27 46H37V60Q32 62 27 60Z', '#2a3a6a') + L('M27 49L37 52M27 53L37 56M27 57L37 60', '#ececec', 1.6)),
  // Wind Chakra Blade: a serrated blade wreathed in blue wind chakra, trench-knife grip.
  tool_woodcutting_3: AURA(34, 30, 30, '#5ac8ff')
    + ROT(45, 32, 32,
      S('M24 6Q32 0 40 6V40H24Z', '#d8f0ff')
      + L('M24 8L21 11L24 14L21 17L24 20L21 23L24 26L21 29L24 32L21 35L24 38', ART_INK, 1.8)
      + F('M27 8Q32 4 37 8V38H27Z', '#5ac8ff', 0.55) + L('M29 34Q34 26 30 18Q34 14 33 9', '#ffffff', 1.8)
      + S('M20 40H44V45H20Z', '#e8b830', { w: 2 })
      + S('M27 45H37V60H27Z', '#3a2a5a') + L('M27 49L37 52M27 54L37 57', '#9a8ae0', 1.6)
      + S('M37 46Q46 48 46 54Q46 60 37 60V57Q42 57 42 54Q42 50 37 50Z', '#e8b830', { w: 1.8 }))
    + L('M14 38Q10 28 18 22M48 50Q58 46 58 36', '#bfeaff', 2, 0.8) + SP(54, 14, 4),
  /* ---------------------------------------------------------------- tools: Mining (Bleach) */
  // Rukon Hand Auger: a wooden T-handle auger with a plain iron screw bit.
  tool_mining_1: ROT(45, 32, 32,
    S('M32 3L37 30H27Z', '#9aa2b0') + L('M28 26L36 23M29 19L35 16M30 12L34 10', dk('#9aa2b0', 0.45), 1.8) + F('M32 4L34.5 30H32Z', '#ffffff', 0.35)
    + S('M24 30H40V35H24Z', '#6a7080', { w: 2 })
    + S('M28 35H36V51H28Z', '#a8743a') + F('M33 35H36V51H33Z', dk('#a8743a', 0.35), 0.7) + L('M28 41H36M28 46H36', dk('#a8743a', 0.45), 1.4)
    + S(rect(19, 51, 26, 7.5, 3), '#a8743a') + F('M20 55H44Q44 58.5 41 58.5H23Q20 58.5 20 55Z', dk('#a8743a', 0.35), 0.8)
    + H('M22 52.6H32V54.2H22Z', 0.5) + H('M29 36H30.5V50H29Z', 0.4)),
  // Squad 12 Drill: a steel power drill with a spiral cone bit and a lab-striped body.
  tool_mining_2: ROT(45, 32, 32,
    S('M32 2L40 30H24Z', '#b8c2d0') + L('M26 26L39 22M28 19L37 16M30 12L35 10', dk('#b8c2d0', 0.45), 1.8)
    + F('M32 3L35 30H32Z', '#ffffff', 0.35)
    + S('M21 30H43V36H21Z', '#5a6272', { w: 2 })
    + S('M23 36H41V50Q41 52 39 52H25Q23 52 23 50Z', '#e8d040') + F('M23 41H41V45H23Z', ART_INK, 0.85)
    + S('M28 52H36V62H28Z', '#3a3a4a') + H('M25 38H28V40H25Z', 0.6)),
  // Bankai Drill: a black spiral bit on a zanpakuto guard and hilt, blue spirit pressure around it.
  tool_mining_3: AURA(36, 28, 30, '#6ab8ff')
    + ROT(45, 32, 32,
      S('M32 0L42 32H22Z', '#2a2434') + L('M24 28L41 23M26 20L38 16M29 11L35 9', '#8ac8ff', 1.8)
      + F('M32 2L36 31H32Z', '#ffffff', 0.18)
      + S('M18 32Q32 28 46 32Q46 38 32 38Q18 38 18 32Z', '#c8a040', { w: 2 }) + F(circ(24, 34, 1.6) + circ(40, 34, 1.6), ART_INK)
      + S('M27 38H37V58H27Z', '#1c1c28') + L('M27 41L37 45M37 41L27 45M27 47L37 51M37 47L27 51M27 53L37 57M37 53L27 57', '#e8e8f0', 1.3)
      + S(rect(26, 57, 12, 4, 1.5), '#c8a040', { w: 1.8 }))
    + RL('M14 50Q6 54 8 60', '#d0402f', 1.8)
    + L('M10 34Q8 24 14 18M50 52Q58 48 60 40', '#bfe0ff', 2, 0.8) + SP(56, 10, 4) + SP(14, 12, 2.6),
});
// size & placement pass: [scale, dx, dy] so every icon sits at the same visual size in a grid
const FIT = {
    wild_fur: [1.04, 0, -3], swift_feather: [1, 4, 0], boar_tusk: [1, -1.5, 0], stag_antler: [0.96, 0, -1], lynx_pelt: [0.94, 0, 0],
    beastlord_claw: [0.95, 0, -1.5], trail_stone: [1, 0, -2.5], game_meat: [1.08, 0, -1.3], hunters_stew: [1, 0, 2.5], snare: [1, 1.4, -1],
    cage_trap: [0.95, 0, 2], spirit_trap: [0.93, -0.5, 1.5], wyrm_trap: [0.94, -8, 1.5], chimera_trap: [1.05, 1.5, -7], scent_lure: [1, 0, 1.5],
    hunter_glaive: [1, -3, 2], star_badge: [1, 0, 1.5], wyvern_bow: [1.03, -1.8, 1.8], beastlord_mantle: [0.94, -2.5, 2], chimera_fang: [0.97, 0, -0.5],
    tool_tracking_1: [0.97, 0, 0.5], tool_tracking_2: [0.97, 0, 0.5], tool_tracking_3: [0.93, -0.5, 0.5],
    tool_fishing_1: [0.93, -1, -2], tool_fishing_2: [0.93, -1, -2], tool_fishing_3: [0.93, -1, -2],
    tool_woodcutting_1: [1.07, 0.5, -0.5], tool_woodcutting_2: [1.04, -0.7, 0.7], tool_woodcutting_3: [1, -1, -1.5],
    tool_mining_1: [1.05, 4, -4.8], tool_mining_2: [1.08, 1.4, -1.4], tool_mining_3: [0.97, -1.2, -2.2],
};
for (const [id, [s, dx, dy]] of Object.entries(FIT)) ART[id] = TR(`translate(${32 + dx} ${32 + dy}) scale(${s}) translate(-32 -32)`, ART[id]);
})();
