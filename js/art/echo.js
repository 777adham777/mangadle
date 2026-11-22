'use strict';
/* Item art — Echo Quarter (JoJo's Bizarre Adventure). See js/item-art.js for the helpers and style rules. */
(() => {
const { S, F, L, H, SP, AURA, T, G, GL, lt, dk, mix, circ, ell, rect, poly, star, ROT, TR } = ARTK;
const VERD = '#4fae96', GOLD = '#f0c040', BRONZE = '#b87a3a', CRACK = '#2a1c18';
// Verdigris patches (list of [x,y,r])
const verd = (pts) => pts.map(([x, y, r]) => F(ell(x, y, r, r * 0.7), VERD, 0.9)).join('');
const n = (v) => +v.toFixed(2);
// "Menacing" katakana ゴ, the JoJo sound effect, drawn as an ink-edged stroke mark
const GO = (x, y, s, c) => { const d = `M${n(x - s * 0.45)} ${n(y - s * 0.35)}H${n(x + s * 0.3)}V${n(y + s * 0.4)}H${n(x - s * 0.45)}M${n(x + s * 0.4)} ${n(y - s * 0.66)}l${n(s * 0.1)} ${n(s * 0.22)}M${n(x + s * 0.62)} ${n(y - s * 0.7)}l${n(s * 0.1)} ${n(s * 0.22)}`;
  return L(d, ART_INK, n(s * 0.16 + 2.6)) + L(d, c || '#c040e0', n(s * 0.16)); };
// 重 (weight) drawn as strokes, centred at x,y, size s
const JU = (x, y, s, c, w) => L(`M${n(x - s * 0.42)} ${n(y - s * 0.4)}H${n(x + s * 0.42)}M${n(x - s * 0.3)} ${n(y - s * 0.2)}H${n(x + s * 0.3)}V${n(y + s * 0.2)}H${n(x - s * 0.3)}ZM${n(x - s * 0.3)} ${y}H${n(x + s * 0.3)}M${x} ${n(y - s * 0.52)}V${n(y + s * 0.4)}M${n(x - s * 0.48)} ${n(y + s * 0.4)}H${n(x + s * 0.48)}`, c, w);
// Brush & Pick family: the pick runs bottom-left -> top-right, the brush (o.back) crosses behind it; tiers differ by material.
const pickTool = (o) => ROT(-45, 32, 32, o.back)
  + ROT(45, 32, 32,
    S(rect(29, 18, 6, 42, 2), o.haft, { w: 2 }) + F(rect(32.6, 20, 1.8, 38), dk(o.haft, 0.3)) + (o.wrap || '')
    + S('M12 17Q32 6 52 17L52 20.5Q42 16.5 37 21H27Q22 16.5 12 20.5Z', o.head)
    + F('M37 21Q42 16.5 52 20.5V17Q46 13.5 40 12.5Z', dk(o.head, 0.3))
    + S(rect(27, 11, 10, 12, 2), o.sock, { w: 1.8 }) + (o.gem || '')
    + H('M15 17Q24 11.5 30 11Q23 14 16 18.5Z', 0.6));
const brush = (handle, ferrule, hair) => S(rect(29.5, 30, 5, 26, 2), handle, { w: 2 }) + F(rect(32.4, 32, 1.6, 22), dk(handle, 0.3))
  + S('M27 27L25 13Q32 10 39 13L37 27Z', hair, { w: 2 }) + L('M29.5 15V25M32 14V26M34.5 15V25', dk(hair, 0.4), 1.2)
  + S(rect(27, 26, 10, 6, 1.5), ferrule, { w: 1.8 });
Object.assign(ART, {
  // Clay Fragment: a curved terracotta sherd with a painted zigzag band.
  clay_fragment: S('M7 32Q20 17 40 15L56 22L51 33L43 47L30 51L13 45Z', '#c8744a')
    + F('M13 45L30 51L43 47L51 33L56 22L56 26L52 37L44 51L30 55L13 49Z', dk('#c8744a', 0.4))
    + S('M13 45L30 51L43 47L51 33L56 22L56 26L52 37L44 51L30 55L13 49Z', dk('#c8744a', 0.3), { w: 2, flat: true })
    + L('M12 34L18 28L22 34L28 26L32 32L38 23L42 29L48 22', '#2e1a14', 2.4)
    + L('M14 40Q28 36 48 30', '#f2e0c0', 1.6) + F(circ(24, 44, 1.4), '#2e1a14') + F(circ(32, 42, 1.4), '#2e1a14')
    + H('M12 31Q22 21 38 18Q24 24 15 33Z', 0.45),
  // Bronze Fragment: a broken bronze mirror, engraved rings and verdigris.
  bronze_fragment: S('M8 42A24 24 0 0 1 56 36L48 40L43 33L36 42L28 37L19 46Z', BRONZE)
    + L('M15 40A17 17 0 0 1 49 34', dk(BRONZE, 0.45), 1.6) + L('M22 38A10 10 0 0 1 42 34', dk(BRONZE, 0.45), 1.6)
    + [[18, 26], [26, 20], [36, 19], [45, 24]].map(([x, y]) => F(circ(x, y, 1.6), dk(BRONZE, 0.5))).join('')
    + F('M49 22A24 24 0 0 1 56 36L48 40Q49 30 44 25Z', dk(BRONZE, 0.3))
    + verd([[14, 32, 4], [44, 30, 3.4], [30, 16, 2.6]])
    + H('M12 34Q16 22 28 17Q20 24 15 36Z', 0.5),
  // Jade Fragment: half of a carved jade ring disc, broken across.
  jade_fragment: ROT(-14, 32, 34,
    S('M8 40A24 24 0 0 1 56 40L46 40L44 44L42 40A10 10 0 0 0 22 40L18 44L16 40Z', '#38b874')
    + F('M44 22A24 24 0 0 1 56 40H46Q46 30 44 22Z', dk('#38b874', 0.3))
    + [[14, 32], [20, 22], [30, 17], [41, 19], [49, 27]].map(([x, y]) => L(`M${x - 2} ${y}Q${x} ${y - 3} ${x + 2} ${y}Q${x} ${y + 2} ${x - 0.6} ${y}`, dk('#38b874', 0.5), 1.3)).join('')
    + H('M11 36Q14 24 26 18Q18 26 15 38Z', 0.55))
    + SP(53, 13, 3.2, '#c8ffe0'),
  // Gold Fragment: a broken gold coin stamped with a sun face.
  gold_fragment: S('M32 10A22 22 0 1 0 50 46L44 41L49 34L42 28L50 21L45 15A22 22 0 0 0 32 10Z', '#f0c030')
    + F('M44 41L49 34L42 28L50 21L45 15Q52 22 52 32Q52 42 50 46Z', dk('#f0c030', 0.25))
    + L(circ(31, 32, 15), dk('#f0c030', 0.35), 1.4)
    + S(star(31, 32, 10, 7, 10), '#e09a20', { w: 1.4 })
    + F(circ(28, 30, 1.4), '#7a4a10') + F(circ(34, 30, 1.4), '#7a4a10') + L('M28 35Q31 37 34 35', '#7a4a10', 1.3)
    + S('M50 7L57 8.5L55.5 15L50.5 13Z', '#f0c030', { w: 1.8 })
    + H('M16 24Q20 14 30 12Q22 18 19 28Z', 0.6),
  // Obsidian Fragment: a knapped black glass blade, flake scars and a violet sheen.
  obsidian_fragment: ROT(28, 32, 32,
    S('M32 5L44 21L46 40L34 59L22 43L20 24Z', '#30283e')
    + F('M32 5L36 20L26 30L20 24Z', '#5a4a7a') + F('M36 20L44 21L46 40L38 36Z', '#463a62') + F('M26 30L38 36L34 59L22 43Z', '#3c3254')
    + L('M32 6L36 20L38 36L34 58', '#8a7ab4', 1.2)
    + H('M30 9L23 25L25 27Z', 0.6))
    + SP(14, 14, 3, '#c8b8ff') + SP(52, 50, 2.4, '#c8b8ff'),
  // Arrow Meteorite: dark meteoric rock veined with bright star-metal.
  starmetal_fragment: L('M4 14Q12 16 18 22M8 6Q16 10 22 17', '#c8d8ff', 2, 0.6)
    + S('M16 28Q14 16 26 14Q34 8 44 14Q56 18 54 32Q58 44 46 52Q34 58 22 52Q10 46 16 28Z', '#5a5670')
    + F('M44 14Q56 18 54 32Q58 44 46 52Q38 56 30 55Q46 44 44 14Z', dk('#5a5670', 0.35))
    + F(circ(26, 40, 3), dk('#5a5670', 0.4)) + F(circ(42, 22, 2.4), dk('#5a5670', 0.4))
    + S('M26 22L36 20L42 30L38 42L30 44L24 34Z', '#b8c8f0', { w: 1.8 })
    + L('M26 22L38 42M36 20L28 36M42 30L24 34', '#ffffff', 1.2, 0.8)
    + H('M20 24Q22 18 28 16Q23 20 22 26Z', 0.45) + SP(38, 26, 4) + SP(50, 46, 2.6, '#c8d8ff'),
  // Pillar Fragment: a broken fluted column with a carved Aztec band.
  pillar_fragment: S(ell(32, 52, 22, 6), '#9a8c74', { w: 2 })
    + S('M16 20L21 14L26 21L32 11L37 19L43 13L48 20V50Q32 56 16 50Z', '#dccfb0')
    + F('M40 16L43 13L48 20V50Q44 52 40 53Z', dk('#dccfb0', 0.25))
    + L('M22 22V50M28 21V52M34 19V53M40 20V52', dk('#dccfb0', 0.3), 1.6)
    + S('M16 38Q32 43 48 38V45Q32 50 16 45Z', '#c86a3a', { w: 1.8 })
    + L('M19 41L22 44L25 42L28 45L31 43L34 46L37 43L40 45L43 42L46 43', '#3fb0a0', 1.4)
    + L('M29 23L32 27L30 30L33 35', CRACK, 1.4) + H('M18 21L21 17V36H18Z', 0.45),
  // Stand Arrow Shard: the golden beetle-headed arrowhead, broken off its shaft.
  awakening_shard: AURA(32, 32, 30, '#ffd86a')
    + ROT(45, 32, 32,
      S(rect(29.5, 38, 5, 20, 1), '#8a5a30', { w: 1.8 }) + S('M29.5 56L32 60L34.5 56Z', '#8a5a30', { w: 1.4 })
      + S('M32 4L44 26Q40 25 38 28H26Q24 25 20 26Z', '#f2c84a')
      + F('M32 4L44 26Q40 25 38 28H32Z', dk('#f2c84a', 0.25))
      + S(ell(32, 33, 8, 7), '#d8a030', { w: 2 }) + L('M32 27V39M26 33H38', '#6a4410', 1.3)
      + F(ell(32, 30, 3, 2), '#3fb08a')
      + H('M31 9L23 24L27 24Z', 0.55))
    + SP(12, 12, 3.6) + SP(52, 50, 2.8, '#fff4c0'),
  // Echo Dust: a heap of glowing Stand dust, menacing sounds rising from it.
  echo_dust: AURA(32, 44, 24, '#ff7ad8')
    + S('M6 54Q10 42 22 40Q30 34 40 38Q54 40 58 54Z', '#e88ad0')
    + F('M40 38Q54 40 58 54H44Q48 46 40 38Z', dk('#e88ad0', 0.25))
    + [[18, 48], [28, 44], [36, 50], [46, 46], [24, 52]].map(([x, y]) => F(circ(x, y, 1.4), '#fff4fc')).join('')
    + GO(18, 22, 14) + GO(42, 14, 11) + GO(33, 30, 8, '#e060ff')
    + H('M12 50Q18 44 26 42Q18 47 15 52Z', 0.5) + SP(54, 30, 3),
  // Pillar Glyph: a square temple stone carved with a stepped spiral glyph.
  pillar_glyph: S('M11 9H50L55 15V54H16L9 48V11Z', '#b8a684')
    + F('M50 9L55 15V54H46V14Z', dk('#b8a684', 0.25))
    + L('M15 13H50V50H15Z', dk('#b8a684', 0.35), 1.4)
    + L('M20 46V18H44V42H26V24H38V36H32V30', '#8a2e20', 3)
    + F('M42 46L46 50V54H38Z', dk('#b8a684', 0.45))
    + verd([[18, 50, 3], [48, 16, 2.6]])
    + H('M12 11H46V13H12Z', 0.45),
  // Pillar Lord's Visage: a Pillar Man's stone face, horn on the brow, eyes shut at sunset.
  lord_visage: S('M8 26Q4 44 14 56H22L18 30Z', '#4a3a5a', { w: 2 }) + S('M56 26Q60 44 50 56H42L46 30Z', '#4a3a5a', { w: 2 })
    + S('M18 22Q18 8 32 8Q46 8 46 22V36Q46 54 32 57Q18 54 18 36Z', '#d6b48a')
    + F('M40 10Q46 14 46 22V36Q46 54 32 57Q42 46 40 10Z', dk('#d6b48a', 0.25))
    + S('M29 14L32 3L35 14Z', '#ece2cc', { w: 1.8 })
    + S('M18 17Q32 11 46 17V21Q32 15 18 21Z', GOLD, { w: 1.6 }) + F(circ(32, 18, 2), '#c8203a')
    + L('M23 30Q26 32 29 30M35 30Q38 32 41 30', '#3a2418', 1.8)
    + L('M32 32V41L30 42', dk('#d6b48a', 0.5), 1.4) + L('M28 47Q32 49 36 47', '#7a3a2a', 1.8)
    + L('M41 24L38 33L41 40', CRACK, 1.3) + H('M21 22Q22 12 28 10Q24 16 23 26Z', 0.45),
  // Ancient Log Pose: a One Piece log pose, cracked glass and green-crusted brass.
  mermaid_compass: S('M7 42Q32 53 57 42V49Q32 60 7 49Z', '#7a5234')
    + L('M10 46Q32 56 54 46', '#c8a070', 1.2, 0.8)
    + S('M21 34H43V44Q32 48 21 44Z', BRONZE)
    + verd([[25, 40, 2.6], [39, 38, 2.2]])
    + S(circ(32, 21, 14), '#9ad8e8')
    + F('M36 8Q46 14 45 25Q42 33 34 35Q44 24 36 8Z', dk('#9ad8e8', 0.25))
    + L('M32 21L39 13', '#d03a2e', 2.2) + L('M32 21L26 28', '#e8eef4', 2.2) + F(circ(32, 21, 1.8), '#3a2a1a')
    + L('M24 12L28 18L26 22M29 18L33 16', '#ffffff', 1.2)
    + H(ell(25, 14, 4, 2.4), 0.7) + SP(53, 12, 3.2, '#c8f4ff'),
  // First Hokage's Scroll: an aged scroll on worn rollers, the Leaf mark faded green.
  founders_scroll: S(rect(13, 14, 38, 38, 1), '#e2cc96')
    + F('M13 46L18 50L24 46L30 51L36 47L42 51L51 46V52H13Z', dk('#e2cc96', 0.25))
    + F(ell(42, 22, 5, 3), '#b89a60', 0.6) + F(ell(20, 42, 4, 2.6), '#b89a60', 0.6)
    + L('M24 34Q28 24 34 26Q41 28 38 34Q35 39 30 35Q27 32 31 30', '#3f8a4a', 2.6) + L('M38 34L44 38', '#3f8a4a', 2.6)
    + L('M18 19H46', '#a87a40', 1.2)
    + S(rect(6, 10, 8, 46, 3), '#7a4a2a') + S(rect(50, 10, 8, 46, 3), '#7a4a2a')
    + F(rect(6, 14, 8, 3), GOLD) + F(rect(6, 49, 8, 3), GOLD) + F(rect(50, 14, 8, 3), GOLD) + F(rect(50, 49, 8, 3), GOLD)
    + F(rect(40, 38, 6, 6, 1), '#c0392b', 0.85) + H('M15 16H44V18H15Z', 0.45),
  // Reaper's Hourglass: a lacquered hourglass of pale spirit sand, a hell butterfly resting.
  reaper_hourglass: S(rect(12, 6, 40, 7, 2), '#6a2a2a') + S(rect(12, 51, 40, 7, 2), '#6a2a2a')
    + L('M14 9.5H50M14 54.5H50', GOLD, 1.4)
    + S('M19 13H45Q45 26 34 32Q45 38 45 51H19Q19 38 30 32Q19 26 19 13Z', '#dff0fa', { w: 2 })
    + F('M23 18H41Q40 25 32 30Q24 25 23 18Z', '#8ad8ff') + F('M21 50Q22 42 32 40Q42 42 43 50Z', '#8ad8ff')
    + L('M32 31V42', '#8ad8ff', 1.4)
    + S(rect(13, 13, 4, 38, 1), '#4a1e1e', { w: 1.8 }) + S(rect(47, 13, 4, 38, 1), '#4a1e1e', { w: 1.8 })
    + H('M22 15H28Q26 22 30 27Q22 22 22 15Z', 0.6)
    + S('M49 30Q42 22 40 27Q40 33 49 31.5ZM49 30Q56 22 58 27Q58 33 49 31.5Z', '#2a1e36', { w: 1.8 }) + F(circ(44, 27.5, 1.3) + circ(54, 27.5, 1.3), '#e03a5a'),
  // Ancient Gravity Seal: a mossy stone disc carved with 重 and ringed in gold.
  gravity_seal: S(circ(32, 32, 24), '#8e8c7c')
    + F('M44 12Q58 22 56 36Q52 52 36 56Q52 40 44 12Z', dk('#8e8c7c', 0.3))
    + L(circ(32, 32, 19), GOLD, 2)
    + JU(32, 33, 20, '#2e2a24', 2.4) + L('M27 18.5L37 16.5', '#2e2a24', 2.4)
    + L('M14 22L20 28L18 34M46 46L42 50', CRACK, 1.6)
    + F(ell(18, 46, 6, 3.5), '#5a9a4a', 0.9) + F(ell(46, 14, 4, 2.4), '#5a9a4a', 0.9)
    + H('M14 26Q18 14 30 10Q20 18 17 28Z', 0.4),
  // Sealed Grimoire: a heavy black-violet tome, four cursed eyes, bound in talismans and chain.
  sealed_grimoire: S('M12 10H48Q52 10 52 14V54H12Z', '#3e2a50')
    + S('M12 54H52V58H14Q12 58 12 56Z', '#e8dcc0', { w: 1.8 })
    + F('M44 10H48Q52 10 52 14V54H44Z', dk('#3e2a50', 0.35))
    + L('M16 14H48V50H16Z', '#a07ad0', 1.2)
    + S(ell(27, 24, 4, 2.6), '#d8203a', { w: 1.4 }) + S(ell(37, 24, 4, 2.6), '#d8203a', { w: 1.4 })
    + S(ell(29, 31, 3, 2), '#d8203a', { w: 1.2 }) + S(ell(35, 31, 3, 2), '#d8203a', { w: 1.2 })
    + F(circ(27, 24, 1), '#140c14') + F(circ(37, 24, 1), '#140c14')
    + S(rect(8, 38, 48, 7, 1), '#9aa0ac', { w: 1.8 }) + L('M14 38V45M20 38V45M26 38V45M38 38V45M44 38V45M50 38V45', '#5a606c', 1.3)
    + S(rect(27, 34, 10, 22, 1), '#f2e8cc', { w: 1.8 }) + L('M32 37V53M29 41H35M29 47H35', '#c0392b', 1.5)
    + L('M20 16L18 22M46 30L42 34', '#c8b8e0', 1.2) + H('M15 12H40V14H15Z', 0.35),
  // The First Licence: the very first Hunter Licence, yellowed and cracked.
  first_licence: ROT(-10, 32, 32,
    S('M8 16H52Q56 16 56 20V44Q56 48 52 48H14L8 42Z', '#e2d098')
    + F('M44 16H52Q56 16 56 20V44Q56 48 52 48H44Z', dk('#e2d098', 0.2))
    + S(circ(21, 32, 9), '#2a2a3a', { w: 2 })
    + L('M21 24V40M13 32H29', '#e2c060', 1.8) + L(circ(21, 32, 5), '#e2c060', 1.6)
    + L('M34 24H50M34 30H48M34 36H50M34 42H44', '#8a7a50', 2)
    + F(ell(46, 22, 4, 2.4), '#a88a40', 0.5)
    + L('M40 16L37 24L42 30L38 38', CRACK, 1.4)
    + H('M10 18H40V20H10Z', 0.45)),
  // Red Stone of Aja: the great red gem in a golden sunburst setting.
  sunstone_visage: AURA(32, 32, 30, '#ff4a4a')
    + S(star(32, 32, 27, 19, 12), GOLD, { w: 2 })
    + S(ell(32, 32, 13, 16), '#e01e3c')
    + F('M32 16L45 32L32 48Z', dk('#e01e3c', 0.3)) + F('M19 32L32 22L45 32L32 42Z', lt('#e01e3c', 0.2), 0.7)
    + L('M32 16V48M19 32H45', '#ff8a9a', 1.1, 0.8)
    + H(ell(26, 24, 4, 2.6), 0.8) + SP(46, 18, 3.6) + SP(16, 48, 2.6),
  // Ancient Fog Cleaver: the Mist's great blade, green with age, gold inlaid down the spine.
  ancient_fog_cleaver: ROT(40, 32, 32,
    S('M24 4H46V40Q46 44 42 44H24Z', '#7aa898')
    + F('M40 4H46V40Q46 44 42 44H40Z', dk('#7aa898', 0.3))
    + verd([[30, 30, 3.4], [41, 37, 2.6], [28, 8, 2.4]])
    + L('M26 6V42', GOLD, 1.8) + L('M26 20L30 22M26 32L30 34', GOLD, 1.4)
    + S(circ(37, 13, 5), '#232838', { w: 2 }) + S('M46 24Q40 27 46 31Z', '#232838', { w: 1.6 })
    + L('M44 34L39 38L42 42', CRACK, 1.4)
    + S('M28 44H36V60H28Z', '#6a5a4a') + L('M28 48L36 51M28 53L36 56', '#a08a6a', 1.4) + S('M22 42H40V46H22Z', '#8a6a30', { w: 2 })),
  // Ancient Ferryman's Robe: a Soul Reaper's shihakusho, faded and torn, gold-trimmed in restoration.
  ancient_ferryman_robe: S('M23 8L32 18L41 8L54 13L60 31L50 34L46 26V52L40 56L36 52L28 56L24 52L18 56V26L14 34L4 31L10 13Z', '#44424e')
    + F('M41 8L54 13L60 31L50 34L46 26V52L40 56L42 24Z', dk('#44424e', 0.3))
    + S('M23 8L32 18L41 8L37 7L32 13L27 7Z', '#ece6d8', { w: 1.6 })
    + L('M23 8L32 30M41 8L32 30', '#1c1a22', 1.8) + L('M24 9L32 27M40 9L32 27', GOLD, 1.3)
    + S(rect(18, 32, 28, 6, 1), '#a8a4b4', { w: 1.8 })
    + F(ell(24, 46, 3.5, 2.2), '#6a6878') + F(ell(13, 20, 2.6, 1.8), '#6a6878')
    + L('M10 13L4 31M54 13L60 31', GOLD, 1.2) + H('M12 16L20 11L17 24Z', 0.45),
  // Ancient Stormcaller: a Clima-Tact of green bronze, its three weather orbs cracked and faded.
  ancient_stormcaller: TR('translate(3 -3)', ROT(45, 32, 32,
    S(rect(28, 6, 8, 54, 4), '#6aa08a')
    + verd([[32, 10, 2.4], [32, 56, 2.4]])
    + [[6, '#c86a4a'], [24, '#5a9ac8'], [42, '#d8c060']].map(([y, c]) => S(rect(25, y + 2, 14, 3.4, 1.2), GOLD, { w: 1.6 }) + S(circ(32, y + 10, 6.6), c, { w: 2 }) + H(ell(30, y + 8, 2, 1.3), 0.7)).join('')
    + L('M35 13L31 18M35 31L30 36M34 49L31 53', CRACK, 1.4)))
    + L('M12 8L8 16L14 17L9 26', ART_INK, 4.6) + L('M12 8L8 16L14 17L9 26', '#ffe46a', 2.2),
  // Ancient Gravity Bracer: a weighted wristband of verdigris bronze, gold-inlaid, cracked.
  ancient_gravity_bracer: S('M10 24V42Q32 54 54 42V24Z', BRONZE)
    + F('M42 26H54V42Q49 46 42 48Z', dk(BRONZE, 0.3))
    + S(ell(32, 24, 22, 8), '#9a6a34', { w: 2.2 }) + S(ell(32, 24, 15, 4.6), '#3a2418', { w: 1.6 })
    + L('M10 34Q32 46 54 34', GOLD, 2) + L('M10 39Q32 51 54 39', GOLD, 1.2)
    + S(rect(25.5, 30.5, 13, 13, 1.5), '#e8dcc0', { w: 1.8 }) + JU(32, 37, 9, '#2a1a10', 1.2)
    + verd([[16, 32, 3], [48, 30, 2.6], [20, 44, 2.4]])
    + L('M44 30L42 37L45 42', CRACK, 1.4)
    + H('M13 28Q18 34 24 36Q16 36 13 32Z', 0.45),
  // Stone Mask: the Aztec stone mask, fanged and staring, bone spikes ready to spring.
  stone_mask: [[-62, 9], [-31, 10], [0, 10], [31, 10], [62, 9]].map(([a, h]) => ROT(a, 32, 34, S(`M29 ${34 - 20}L32 ${34 - 20 - h}L35 ${34 - 20}Z`, '#e8e0cc', { w: 1.6 }))).join('')
    + S('M14 28Q14 12 32 12Q50 12 50 28Q50 44 42 52Q36 58 32 58Q28 58 22 52Q14 44 14 28Z', '#b8b0a0')
    + F('M42 14Q50 20 50 28Q50 44 42 52Q36 58 32 58Q44 42 42 14Z', dk('#b8b0a0', 0.25))
    + S('M17 26Q24 21 30 26Q24 30 17 26Z', '#1c1424', { w: 1.6 }) + S('M34 26Q40 21 47 26Q40 30 34 26Z', '#1c1424', { w: 1.6 })
    + L('M17 21Q24 17 30 21M34 21Q40 17 47 21', dk('#b8b0a0', 0.5), 2)
    + L('M32 28V38', dk('#b8b0a0', 0.4), 1.6)
    + S('M24 43Q32 39 40 43Q36 50 32 50Q28 50 24 43Z', '#4a1a1e', { w: 1.8 })
    + F('M26 43L28 47L29.5 42Z', '#f2ece0') + F('M38 43L36 47L34.5 42Z', '#f2ece0')
    + L('M18 34Q22 38 20 42M46 34Q42 38 44 42', dk('#b8b0a0', 0.45), 1.4)
    + F('M37 12Q38 18 36 20Q35 18 36 12Z', '#c8203a')
    + H('M18 24Q19 15 28 14Q21 18 20 26Z', 0.5),
  // Sunlit Pillar Armor: a gold breastplate with an Aztec sun disc and turquoise inlay.
  sunlit_armor: S('M8 16Q14 10 22 12L28 16H36L42 12Q50 10 56 16L54 28L46 26V54Q32 60 18 54V26L10 28Z', '#f0c860')
    + F('M42 12Q50 10 56 16L54 28L46 26V54Q42 56 38 57Q46 40 42 12Z', dk('#f0c860', 0.3))
    + S('M8 16Q14 10 22 12L20 24L10 28Z', '#3fb4a4', { w: 1.8 }) + S('M56 16Q50 10 42 12L44 24L54 28Z', '#3fb4a4', { w: 1.8 })
    + S(star(32, 34, 12, 8, 12), '#e8862a', { w: 1.6 }) + S(circ(32, 34, 6), '#ffe07a', { w: 1.6 })
    + F(circ(30, 33, 1), '#7a3a10') + F(circ(34, 33, 1), '#7a3a10') + L('M30 36.5Q32 37.6 34 36.5', '#7a3a10', 1.2)
    + L('M20 50Q32 55 44 50', '#3fb4a4', 2.2)
    + H('M20 18L26 17L22 34Z', 0.4) + SP(52, 46, 3),
  // Ripple Gloves: a leather glove crackling with golden Ripple (Hamon) waves.
  ripple_gloves: L(circ(32, 32, 26), '#ffd84a', 1.8, 0.6) + L(circ(32, 32, 21), '#ffd84a', 1.6, 0.4)
    + S('M18 26Q16 16 22 16Q26 16 26 22V14Q26 9 30 9Q34 9 34 14V12Q34 8 38 8Q42 8 42 13V18Q42 14 46 14Q50 15 49 22L48 38Q48 46 42 48H24Q18 44 18 36Z', '#7a4a32')
    + F('M42 18Q42 14 46 14Q50 15 49 22L48 38Q48 46 42 48H38Q46 36 42 18Z', dk('#7a4a32', 0.3))
    + L('M26 22V30M34 14V30M42 18V30', dk('#7a4a32', 0.5), 1.4)
    + S(rect(20, 46, 26, 10, 2), '#c8902a', { w: 2 }) + L('M24 51H42', '#7a5010', 1.4)
    + L('M10 22L14 26L11 30L15 34M54 22L50 26L53 30L49 34', '#ffe46a', 2.2)
    + H('M21 22Q20 18 23 18Q24 24 22 32Z', 0.4) + SP(53, 9, 3.5, '#fff4b0') + SP(10, 50, 2.6, '#fff4b0'),
  // Sealed Reliquary: a gold-and-stone Aztec reliquary, the Red Stone set in its lid.
  echo_reliquary: AURA(32, 32, 28, '#ffd86a')
    + S(rect(9, 30, 46, 25, 2), '#e0b050')
    + F('M44 30H55V55H44Z', dk('#e0b050', 0.3))
    + S('M7 31L13 22H19L23 14H41L45 22H51L57 31Z', '#b8a684')
    + L('M10 31H54', '#fff0b0', 2.4)
    + L('M13 36H51M13 50H51', '#a8762a', 1.6)
    + L('M14 43L18 39L22 43L26 39L30 43L34 39L38 43L42 39L46 43L50 39', '#3fb4a4', 1.8)
    + S(ell(32, 21, 4.5, 5), '#e01e3c', { w: 1.8 }) + H(ell(30.6, 19.4, 1.4, 1.2), 0.8)
    + H('M12 32H40V34H12Z', 0.4),
  // Brush & Pick Mk I: a plain iron pick on an ash haft, a stubby wooden brush.
  tool_archaeology_1: pickTool({ haft: '#b88a52', head: '#a8b0bc', sock: '#8a929e', back: brush('#c89a5a', '#a8b0bc', '#e8dcc0') }),
  // Brush & Pick Mk II: a steel rock pick with a leather grip and a broad horsehair brush.
  tool_archaeology_2: pickTool({ haft: '#6a4a30', head: '#c6ced8', sock: '#8a929e', back: brush('#8a5a3a', '#c8a050', '#7a5a40'),
    wrap: L('M29 45L35 48M29 50L35 53M29 55L35 58', '#2a1a10', 1.4) }),
  // Brush & Pick Mk III: a gold-inlaid expedition pick with a turquoise stone, and a brass magnifier.
  tool_archaeology_3: AURA(32, 32, 30, '#ffd86a') + pickTool({ haft: '#3a2a3a', head: '#f0c850', sock: '#e0a830',
    wrap: L('M29 31H35M29 41H35M29 51H35', GOLD, 1.8), gem: S(circ(32, 17, 3), '#3fd0c0', { w: 1.8 }) + H(ell(31, 16, 1.2, 0.8), 0.8),
    back: S(rect(29.5, 30, 5, 26, 2), '#3a2a3a', { w: 2 }) + L('M29.5 41H34.5M29.5 49H34.5', GOLD, 1.6) + S(rect(29.5, 27, 5, 5, 1), GOLD, { w: 1.8 })
      + S(circ(32, 18, 10), GOLD, { w: 2 }) + S(circ(32, 18, 7), '#bfe8f4', { w: 1.8 }) + F('M37 14A7 7 0 0 1 34 25A6 6 0 0 0 37 14Z', dk('#bfe8f4', 0.25)) + H(ell(29.5, 15.5, 2.6, 1.6), 0.75) })
    + SP(12, 34, 3) + SP(42, 54, 2.2),
});
// size & placement pass: [scale, dx, dy], bounds checked by render
const FIT = {
  clay_fragment: [1, 0, -2.5], jade_fragment: [1, 0, 2], pillar_fragment: [1, 0, -2], awakening_shard: [1.12, 0, 1], echo_dust: [1, 0, 2],
  lord_visage: [1, 0, 1], reaper_hourglass: [1, -2.5, 0], sealed_grimoire: [1, 0, -1.5], ancient_fog_cleaver: [0.95, -3.5, 1],
  ancient_ferryman_robe: [0.93, 0, 0], ancient_stormcaller: [1, 0, 2.5], ancient_gravity_bracer: [1.1, 0, 0], sunlit_armor: [1, 0, -2],
  echo_reliquary: [1, 0, -2], tool_archaeology_1: [1.06, -1.8, 1.8], tool_archaeology_2: [1.06, -1.8, 1.8], tool_archaeology_3: [1.06, -1.8, 1.8],
};
for (const [id, [k, dx, dy]] of Object.entries(FIT)) ART[id] = TR(`translate(${32 + dx} ${32 + dy}) scale(${k}) translate(-32 -32)`, ART[id]);
})();
