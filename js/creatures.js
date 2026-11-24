'use strict';
/* ==========================================================================
   TRI-REALM IDLE — creature art for non-human foes
   Each body plan is a small SVG generator (240×200, facing left toward you):
   flat cel colours, one shade band, an ink outline, a pale sticker rim (CSS).
   Parts sit in groups the stylesheet animates: .cr-breath, .cr-head, .cr-jaw,
   .cr-tail, .cr-wing, .cr-float, .cr-sway. The arena adds .atk / .winding.
   CREATURES maps an enemy name to its plan and palette.
   Loaded after draw-util.js (uses shade()), before arena.js.
   ========================================================================== */

const CR_INK = '#15161c';
const crP = (d, fill, extra) => `<path d="${d}" fill="${fill}" stroke="${CR_INK}" stroke-width="3" stroke-linejoin="round" stroke-linecap="round"${extra ? ' ' + extra : ''}/>`;
const crF = (d, fill, op) => `<path d="${d}" fill="${fill}"${op != null ? ` opacity="${op}"` : ''}/>`;
const crL = (d, col, w) => `<path d="${d}" fill="none" stroke="${col || CR_INK}" stroke-width="${w || 2.5}" stroke-linecap="round" stroke-linejoin="round"/>`;
const crG = (cls, ox, oy, inner) => `<g class="${cls}" style="transform-origin:${ox}px ${oy}px">${inner}</g>`;
// A glowing eye: ink socket, coloured iris, white glint.
const crEye = (x, y, r, col, slit) => `<circle cx="${x}" cy="${y}" r="${r + 1.5}" fill="${CR_INK}"/><circle cx="${x}" cy="${y}" r="${r}" fill="${col}"/>`
  + (slit ? `<ellipse cx="${x}" cy="${y}" rx="${r * 0.28}" ry="${r * 0.85}" fill="${CR_INK}"/>` : '') + `<circle cx="${x - r * 0.35}" cy="${y - r * 0.4}" r="${Math.max(1, r * 0.3)}" fill="#fff"/>`;
const crGlow = (x, y, r, col) => `<circle cx="${x}" cy="${y}" r="${r}" fill="${col}" opacity=".35" class="cr-glow"/>`;
const crTeeth = (x0, x1, y, h, dir) => { let s = ''; for (let x = x0; x < x1 - 2; x += 6) s += `M${x},${y} l3,${dir * h} l3,${-dir * h}`; return `<path d="${s}" fill="#f6f1e4" stroke="${CR_INK}" stroke-width="1.4" stroke-linejoin="round"/>`; };
const crWater = (col) => `<g class="cr-water"><path d="M2,168 Q20,160 50,168 T110,168 T170,168 T230,168 L238,166 V196 H2Z" fill="${col}" opacity=".85"/><path d="M2,168 Q20,160 50,168 T110,168 T170,168 T230,168 L238,166" fill="none" stroke="#e8fbff" stroke-width="3" stroke-linecap="round"/><path d="M20,182 h22 M120,186 h30 M190,180 h18" stroke="#e8fbff" stroke-width="2" stroke-linecap="round" opacity=".6"/></g>`;

/* ------------------------------------------------------------ quadruped (fox, hound, chimera) */
function crQuad(o) {
  const B = o.body, D = shade(B, -0.3), L = o.belly || shade(B, 0.4), E = o.eye || '#ffd23a';
  let s = '';
  // tails (fanned when many)
  const tail = (o.tail === 'snake')
    ? crP('M184,112 C208,104 214,80 200,66 C192,58 196,48 206,48 C220,50 222,64 214,70 C228,82 222,118 190,124Z', o.tailCol || '#5c9a4a') + crEye(208, 55, 2.6, '#ffe14a', 1)
    : o.tail === 'thin'
      ? crP('M184,110 C206,100 218,84 222,64 C226,70 226,90 214,106 C206,116 196,122 186,122Z', B)
      : crP('M182,108 C206,94 222,70 214,40 C232,58 236,96 214,120 C204,130 192,128 184,122Z', B) + crF('M214,40 C232,58 236,96 214,120 C222,96 224,66 214,40Z', o.tip || L);
  const n = o.tails || 1;
  let tails = '';
  for (let i = 0; i < n; i++) tails += n === 1 ? tail : `<g transform="rotate(${-34 + (68 * i) / (n - 1)} 186 116)">${tail}</g>`;
  s += crG('cr-tail', 186, 116, tails);
  if (o.wings) s += crG('cr-wing', 140, 96, crP('M132,98 C118,62 136,26 180,14 C174,34 186,44 202,40 C192,58 202,70 214,70 C192,92 162,100 132,98Z', o.wings) + crL('M140,94 C150,70 166,46 180,16 M150,96 C170,80 186,62 202,42 M162,98 C186,90 200,80 212,72', shade(o.wings, -0.35), 2));
  // far legs
  s += crP('M106,136 L102,186 L118,186 L122,138Z', D) + crP('M168,134 L172,186 L188,186 L184,132Z', D);
  // body
  let body = crP('M86,104 C98,84 150,80 182,92 C204,100 206,132 188,146 C162,158 112,156 92,146 C76,138 76,116 86,104Z', B)
    + crF('M90,140 C112,152 160,154 188,140 C180,150 150,157 120,155 C104,153 94,149 90,140Z', D, 0.9)
    + crF('M100,136 C120,146 150,147 168,140 C152,152 116,152 100,136Z', L, 0.8);
  if (o.stripes) body += crL('M124,88 l-6,16 M140,86 l-5,18 M156,88 l-4,16 M170,92 l-4,14', o.stripes, 4);
  if (o.mane) body += '';
  s += crG('cr-breath', 140, 150, body);
  // near legs and paws
  s += crP('M88,132 C84,154 84,172 80,186 L100,186 C102,170 106,156 112,140Z', B) + crP('M156,122 C144,146 154,166 156,186 L176,186 C176,166 186,148 188,128Z', B);
  s += crP('M76,186 C76,180 84,178 92,180 L102,186Z', L) + crP('M152,186 C152,180 162,178 170,180 L178,186Z', L);
  // head
  let head = '';
  if (o.mane) {
    let m = '';
    for (let i = 0; i < 14; i++) { const a = (i / 14) * Math.PI * 2, r1 = 36, r2 = 50, x = 66, y = 84; m += `${i ? 'L' : 'M'}${(x + Math.cos(a) * r2).toFixed(1)},${(y + Math.sin(a) * r2).toFixed(1)} L${(x + Math.cos(a + 0.22) * r1).toFixed(1)},${(y + Math.sin(a + 0.22) * r1).toFixed(1)} `; }
    head += crP(m + 'Z', o.mane) + crF(`M40,96 C50,126 92,126 104,100 C96,118 56,122 40,96Z`, shade(o.mane, -0.3), 0.8);
  }
  head += crP('M100,98 C92,78 82,64 66,62 C52,60 42,68 36,78 L14,88 C10,92 14,98 22,99 L48,102 C60,110 84,114 100,98Z', B)
    + crF('M22,99 L48,102 C60,110 84,114 100,98 C92,116 58,116 40,106Z', D, 0.85)
    + crF('M14,88 C24,84 32,84 38,88 C30,92 22,94 14,92Z', L, 0.9);
  const ear = o.ear === 'round'
    ? crP('M58,66 C54,50 66,44 74,58Z', B) + crP('M72,64 C72,48 86,46 88,62Z', B)
    : crP('M56,66 L60,38 L74,60Z', B) + crF('M60,46 L62,60 L68,58Z', o.earIn || '#f2a7a0') + crP('M70,62 L82,40 L88,66Z', D);
  head += ear;
  if (o.horns) head += crP('M62,62 C60,40 80,32 92,44 C82,42 74,48 72,64Z', o.horns) + crP('M78,64 C82,46 100,42 108,54 C98,52 90,56 86,68Z', shade(o.horns, -0.2));
  if (o.band) head += crP('M50,64 C62,58 78,58 92,64 L94,72 C80,66 64,66 52,72Z', o.band) + crP('M64,60 h12 v8 h-12Z', '#c9d2dc') + crP('M92,66 C102,62 110,66 114,72 C106,70 100,70 94,72Z', o.band);
  if (o.crown) head += crP('M52,58 L56,40 L64,52 L70,36 L76,52 L84,40 L86,60Z', '#ffd25a') + `<circle cx="70" cy="50" r="3" fill="#ff4d6d"/>`;
  head += crEye(48, 78, 4.2, E, o.slit) + `<circle cx="15" cy="89" r="3.4" fill="${CR_INK}"/>`;
  if (o.scar) head += crL('M40,68 l14,18', '#fff', 2);
  const jaw = crP('M20,98 L50,103 C44,111 28,110 20,98Z', D) + crTeeth(22, 46, 99, 4, 1);
  head += crG('cr-jaw', 48, 102, jaw);
  s += crG('cr-head', 92, 104, head);
  if (o.embers) s += `<g class="cr-embers">${[0, 1, 2, 3, 4].map((i) => `<circle cx="${60 + i * 34}" cy="${60 + (i % 2) * 20}" r="${2 + (i % 3)}" fill="${o.embers}" style="animation-delay:${-i * 0.5}s"/>`).join('')}</g>`;
  return s;
}

/* ------------------------------------------------------------ golem (stone, ruins, marble) */
function crGolem(o) {
  const B = o.body, D = shade(B, -0.28), L = shade(B, 0.25), E = o.eye || '#7df9ff';
  let s = '';
  // far arm
  s += crG('cr-sway', 168, 70, crP('M160,64 C182,66 192,92 190,124 C190,140 184,152 172,152 C160,150 156,136 160,120 C156,100 150,80 160,64Z', D));
  // legs
  s += crP('M98,140 L92,186 L126,186 L124,140Z', D) + crP('M136,140 L136,186 L170,186 L162,138Z', B);
  // torso
  let t = crP('M84,56 C96,40 156,38 170,54 C180,70 178,120 164,146 L96,148 C82,120 76,74 84,56Z', B)
    + crF('M96,148 C100,128 150,128 164,146Z', D, 0.9) + crF('M92,62 C110,52 150,50 164,58 C150,58 112,60 92,70Z', L, 0.8);
  if (o.kind === 'stone') t += crL('M110,66 l10,16 l-6,14 M146,74 l-8,18 l10,12 M122,120 l14,-8', D, 2.5) + crF('M88,60 C100,48 126,44 140,48 C124,54 102,58 88,68Z', o.moss || '#5d9c4a', 0.95);
  if (o.kind === 'ruin') t += crL('M100,80 h56 M128,80 v40 M108,100 h40', o.rune || '#7df9ff', 3) + `<circle cx="128" cy="100" r="12" fill="${CR_INK}"/><circle cx="128" cy="100" r="8" fill="${o.rune || '#7df9ff'}" class="cr-glow"/>`;
  if (o.kind === 'marble') t += crL('M112,64 l6,22 l-8,18 M150,90 l-6,14', shade(B, -0.18), 2) + crP('M98,86 C110,96 146,96 158,86 L156,96 C144,106 112,106 100,96Z', o.trim || '#d8b25a');
  s += crG('cr-breath', 128, 146, t);
  // head
  let h = crP('M106,26 C112,14 144,14 150,26 L152,56 L104,56Z', B) + crF('M104,46 L152,46 L152,56 L104,56Z', D, 0.8);
  if (o.kind === 'marble') h += crP('M102,24 C112,8 146,8 156,24 C146,16 112,16 102,24Z', '#7fae5a');
  h += o.kind === 'ruin' ? crEye(126, 36, 6, E) + crGlow(126, 36, 12, E) : crEye(116, 36, 3.6, E) + crEye(138, 36, 3.6, E) + crGlow(116, 36, 7, E) + crGlow(138, 36, 7, E);
  s += crG('cr-head', 128, 56, h);
  // near arm (big fist)
  const arm = crP('M92,62 C66,62 54,88 56,118 C56,132 60,144 70,150 L74,140 C66,130 70,104 84,92Z', B)
    + crP('M50,138 C50,124 66,118 80,122 C94,126 96,146 86,156 C74,166 52,160 50,138Z', L) + crL('M62,132 l8,6 M70,128 l10,4', D, 2);
  s += crG('cr-head cr-arm', 88, 66, arm);
  return s;
}

/* ------------------------------------------------------------ wooden puppet */
function crPuppet(o) {
  const W = o.body, D = shade(W, -0.3), L = shade(W, 0.25);
  let s = crL('M100,0 L104,40 M140,0 L136,44 M168,0 L160,92 M76,0 L80,96', '#e6dcc4', 1.2);
  s += crP('M112,140 L104,186 L116,186 L122,142Z', D) + crP('M132,140 L140,186 L152,186 L140,140Z', D);
  let b = crP('M106,64 L148,64 L142,142 L112,142Z', W) + crL('M110,84 h36 M112,104 h32 M114,124 h28', D, 2)
    + `<circle cx="127" cy="104" r="7" fill="${o.core || '#8ff0ff'}" stroke="${CR_INK}" stroke-width="2.5"/>`;
  s += crG('cr-breath', 127, 140, b);
  // blade arms
  s += crG('cr-sway', 150, 70, crP('M148,70 L176,92 L170,98 L146,80Z', W) + crP('M172,90 L214,128 L206,134 L166,98Z', '#d7e2ee'));
  s += crG('cr-head cr-arm', 106, 72, crP('M108,70 L80,96 L86,102 L110,82Z', W) + crP('M84,96 L40,128 L46,136 L90,104Z', '#d7e2ee') + crL('M48,130 L86,100', '#ffffff', 1.4));
  let h = crP('M108,26 C108,12 146,12 146,26 L144,60 C138,66 116,66 110,60Z', o.mask || '#f1e7d0')
    + crL('M114,40 l10,4 M140,40 l-10,4', CR_INK, 3) + crF('M118,52 h18 v4 h-18Z', '#b33b3b') + crL('M127,14 v12', '#b33b3b', 3);
  h += `<circle cx="116" cy="44" r="2.6" fill="${o.eye || '#8ff0ff'}"/><circle cx="138" cy="44" r="2.6" fill="${o.eye || '#8ff0ff'}"/>`;
  s += crG('cr-head', 127, 62, h);
  return `<g class="cr-float">${s}</g>`;
}

/* ------------------------------------------------------------ shark breaching */
function crShark(o) {
  const B = o.body, D = shade(B, -0.3), Wh = '#f2f6f8';
  let s = '';
  let body = crP('M200,92 L232,58 L226,98 L238,140 L198,112Z', D)                                       // tail fin
    + crP('M20,116 C40,84 110,70 170,82 C190,86 204,96 206,104 C196,118 170,132 120,138 C80,142 40,136 20,116Z', B)
    + crP('M110,78 L134,34 L148,82Z', B)                                                                 // dorsal
    + crF('M24,120 C60,138 140,138 200,108 C170,132 110,144 60,138 C40,134 28,128 24,120Z', Wh)
    + crP('M100,124 L84,154 L118,132Z', D)                                                                // pectoral
    + crL('M74,96 l-4,14 M82,96 l-4,14 M90,96 l-4,14', D, 2);
  s += crG('cr-breath', 120, 120, body);
  const jaw = crP('M22,118 C34,124 54,128 66,124 C58,136 34,136 22,118Z', Wh) + crTeeth(26, 62, 121, -4, -1);
  s += crG('cr-head', 110, 110, crTeeth(24, 64, 112, 4, 1) + crEye(54, 100, 3.6, o.eye || '#111', false) + crG('cr-jaw', 40, 120, jaw));
  return `<g class="cr-bob">${s}</g>` + crWater(o.water || '#1f7fb8');
}

/* ------------------------------------------------------------ sea serpent */
function crSerpent(o) {
  const B = o.body, D = shade(B, -0.3), L = o.belly || shade(B, 0.45), F = o.fin || shade(B, 0.2);
  let s = crP('M168,170 C168,130 210,124 214,170Z', B) + crF('M180,170 C182,146 204,142 206,170Z', D, 0.7);       // far coil
  let neck = crP('M120,172 C112,120 140,90 120,64 C108,48 84,44 70,50 L80,72 C96,68 104,80 98,96 C86,124 90,150 96,172Z', B)
    + crF('M96,172 C90,150 86,124 98,96 C102,86 100,76 92,72 C108,80 110,100 104,118 C98,140 104,158 108,172Z', L, 0.9)
    + crL('M114,150 l-12,-4 M118,126 l-12,-6 M124,104 l-12,-8', D, 2.4)
    + crP('M126,128 C150,118 156,96 142,84 C150,100 140,114 124,118Z', F) + crP('M134,92 C156,80 156,60 140,52 C146,68 138,80 126,84Z', F);
  s += crG('cr-sway', 110, 170, neck);
  let h = crP('M84,52 C70,38 46,40 30,52 L12,64 C8,70 14,74 22,74 L52,76 C66,80 80,72 84,62Z', B)
    + crP('M60,44 C64,26 80,20 92,24 C82,30 78,40 76,50Z', F) + crP('M70,48 C82,36 98,36 106,44 C94,44 86,48 82,56Z', F);
  h += crEye(46, 56, 4, o.eye || '#ffdf3a', true);
  h += crG('cr-jaw', 50, 74, crP('M18,74 L54,78 C46,90 28,88 18,74Z', D) + crTeeth(22, 50, 75, 4, 1));
  s += crG('cr-head', 80, 66, h);
  return s + crWater(o.water || '#155f8f');
}

/* ------------------------------------------------------------ floating spirit (wraith, specter, void) */
function crSpirit(o) {
  const R = o.robe, D = shade(R, -0.3), L = shade(R, 0.25), E = o.eye || '#ff4d6d';
  let s = '';
  if (o.halo) s += `<circle cx="120" cy="86" r="70" fill="${o.halo}" opacity=".18" class="cr-glow"/>`;
  // tattered robe
  let r = crP('M84,70 C92,40 148,38 158,70 C168,100 176,140 186,170 L172,160 L162,178 L148,162 L134,182 L120,164 L106,180 L94,160 L80,174 L74,150 C66,124 76,96 84,70Z', R)
    + crF('M80,174 L94,160 L106,180 L120,164 L134,182 L148,162 L162,178 L172,160 L186,170 C170,150 150,146 120,150 C96,152 84,160 80,174Z', D, 0.85)
    + crF('M90,70 C100,50 140,48 150,66 C136,58 104,60 90,78Z', L, 0.7);
  if (o.talismans) r += [[98, 104, -8], [140, 112, 10], [118, 132, -4]].map(([x, y, a]) => `<g transform="rotate(${a} ${x} ${y})">${crP(`M${x - 7},${y - 12} h14 v26 h-14Z`, '#f3e6b6')}${crL(`M${x},${y - 8} v16 M${x - 4},${y - 2} h8`, '#c0392b', 2)}</g>`).join('');
  if (o.sand) r += crL('M150,120 C170,130 180,150 200,150 M160,100 C180,104 196,120 214,118', o.sand, 3);
  s += crG('cr-breath', 120, 170, r);
  // arms with claws
  s += crG('cr-sway', 150, 90, crP('M150,86 C172,94 184,112 186,130 L178,134 C172,120 162,106 148,100Z', R) + crP('M178,130 l4,14 l4,-12 l6,10 l0,-14Z', o.claw || '#e9e4da'));
  s += crG('cr-head cr-arm', 92, 90, crP('M92,86 C70,92 56,104 48,122 L56,126 C64,114 78,104 94,100Z', R) + crP('M50,120 l-12,10 l14,-2 l-6,12 l12,-12Z', o.claw || '#e9e4da'));
  // face
  let f = crP('M94,62 C94,34 146,34 146,62 C146,82 132,92 120,92 C108,92 94,82 94,62Z', o.face || CR_INK);
  if (o.mask) f += crP('M100,58 C100,40 140,40 140,58 C140,74 130,84 120,84 C110,84 100,74 100,58Z', o.mask) + crF('M106,72 h28 l-4,6 h-20Z', CR_INK);
  if (o.eyes === 'many') f += [[108, 56, 3.4], [132, 54, 3.8], [120, 68, 4.6], [102, 72, 2.4], [140, 70, 2.8], [118, 46, 2.4]].map(([x, y, rr]) => crEye(x, y, rr, E, true)).join('');
  else f += crEye(110, 58, 3.6, E) + crEye(130, 58, 3.6, E) + crGlow(110, 58, 7, E) + crGlow(130, 58, 7, E);
  if (o.mouth) f += crG('cr-jaw', 120, 80, crF('M108,76 C114,86 126,86 132,76 C126,80 114,80 108,76Z', '#ff8aa0'));
  s += crG('cr-head', 120, 92, f);
  if (o.stars) s += `<g class="cr-embers">${[0, 1, 2, 3, 4, 5].map((i) => `<circle cx="${70 + i * 22}" cy="${40 + ((i * 37) % 90)}" r="${1.5 + (i % 3)}" fill="${o.stars}" style="animation-delay:${-i * 0.4}s"/>`).join('')}</g>`;
  return `<g class="cr-float">${s}</g>`;
}

/* ------------------------------------------------------------ menos (towering husk) */
function crMenos(o) {
  const R = o.robe, D = shade(R, -0.3);
  let s = crP('M84,186 C88,120 96,60 120,28 C144,60 152,120 156,186Z', R)
    + crF('M84,186 C98,170 142,170 156,186Z', D) + crL('M104,186 C104,140 108,100 116,60 M136,186 C136,140 132,100 124,60', shade(R, 0.2), 2);
  s = crG('cr-breath', 120, 186, s);
  let h = crP('M98,48 C98,22 142,22 142,48 L140,70 L100,70Z', o.mask) + crP('M106,56 L60,62 L106,66Z', o.mask)
    + crEye(110, 44, 4, '#111') + crEye(130, 44, 4, '#111') + crL('M104,68 v-4 M110,70 v-6 M116,70 v-6 M122,70 v-6 M128,70 v-6 M134,70 v-6', CR_INK, 1.8);
  s += crG('cr-head', 120, 70, h);
  s += crG('cr-sway', 80, 120, crP('M92,110 C78,116 70,128 66,140 l6,2 C78,132 86,124 96,120Z', R));
  return s;
}

/* ------------------------------------------------------------ husk (hunched masked beast) */
function crHusk(o) {
  const B = o.body, D = shade(B, -0.25), M = o.mask || '#f2eee4';
  let s = crP('M150,126 C162,150 164,168 170,186 L188,186 C182,164 180,142 172,120Z', D);
  let b = crP('M70,88 C86,60 150,60 172,84 C188,104 184,132 166,140 C140,150 100,146 84,132 C70,120 64,104 70,88Z', B)
    + `<ellipse cx="128" cy="104" rx="11" ry="13" fill="${o.bg || '#2a1e3a'}" stroke="${CR_INK}" stroke-width="3"/>`
    + crF('M84,132 C100,146 140,150 166,140 C150,152 110,154 84,132Z', D);
  if (o.spikes) b += crP('M100,66 L106,46 L114,64 L122,42 L130,62 L140,46 L144,66Z', M);
  s += crG('cr-breath', 128, 140, b);
  s += crP('M98,134 C92,156 96,170 96,186 L116,186 C112,170 116,154 118,140Z', B);
  // long arm with claws
  s += crG('cr-head cr-arm', 86, 92, crP('M84,90 C60,96 48,120 46,150 L60,152 C62,128 72,112 92,108Z', B) + crP('M44,148 l-6,18 l10,-8 l2,14 l6,-14 l8,10 l-2,-18Z', M));
  let h = crP('M84,70 C80,48 60,40 44,46 C30,52 26,68 30,80 C34,94 50,100 64,96 C76,92 86,84 84,70Z', M)
    + crF('M44,46 C56,44 70,50 76,60 C66,56 52,56 44,62Z', '#ffffff', 0.6) + crL('M70,52 l-8,14', shade(M, -0.25), 2)
    + crEye(48, 66, 4, o.eye || '#ffd23a') + crF('M42,64 C46,58 54,58 58,62 Z', CR_INK);
  h += crG('cr-jaw', 50, 88, crP('M30,82 C38,98 62,100 74,92 L72,86 C60,92 42,90 30,82Z', M) + crTeeth(34, 70, 86, 5, 1));
  if (o.horns) h += crP('M66,48 C70,30 86,24 96,30 C86,32 78,40 76,52Z', M);
  s += crG('cr-head', 80, 90, h);
  return s;
}

/* ------------------------------------------------------------ spider husk */
function crSpider(o) {
  const B = o.body, D = shade(B, -0.3), M = o.mask || '#f2eee4';
  const leg = (x, y, kx, ky, fx, col) => crL(`M${x},${y} Q${kx},${ky} ${fx},188`, CR_INK, 9) + crL(`M${x},${y} Q${kx},${ky} ${fx},188`, col, 5);
  let s = leg(130, 120, 160, 60, 206, D) + leg(140, 124, 196, 86, 226, D) + leg(120, 124, 120, 70, 150, D);
  s += crG('cr-breath', 150, 130, crP('M120,110 C130,80 196,76 212,104 C224,128 200,150 168,148 C140,146 116,132 120,110Z', B) + crL('M150,92 l10,40 M176,90 l4,46', shade(B, 0.25), 3) + crF('M190,132 l14,10 l-16,-2Z', '#c64b6e'));
  s += leg(110, 124, 74, 70, 46, B) + leg(116, 130, 96, 100, 84, B) + leg(124, 132, 150, 110, 120, B);
  let h = crP('M120,112 C124,92 108,78 88,80 C70,82 62,98 66,112 C70,128 88,134 102,130 C114,126 120,120 120,112Z', M)
    + crEye(82, 100, 3.6, o.eye || '#c4ff3a') + crEye(98, 96, 2.6, o.eye || '#c4ff3a') + crEye(92, 110, 2.2, o.eye || '#c4ff3a');
  h += crG('cr-jaw', 84, 126, crP('M70,122 C78,134 96,136 108,128 L104,122 C94,128 80,126 70,122Z', M) + crTeeth(74, 104, 124, 4, 1));
  s += crG('cr-head', 110, 112, h);
  return s;
}

/* ------------------------------------------------------------ great ape */
function crApe(o) {
  const B = o.body, D = shade(B, -0.3), Sk = o.skin || '#d9a57a', E = o.eye || '#ff3a3a';
  let s = crG('cr-tail', 190, 130, crP('M184,130 C214,126 224,98 210,82 C222,86 232,112 214,136 C206,144 192,144 186,140Z', B));
  s += crP('M150,140 C164,160 162,174 170,186 L194,186 C188,168 186,150 176,134Z', D);
  s += crG('cr-sway', 160, 74, crP('M156,70 C184,80 192,116 186,160 L170,164 C168,134 164,108 150,92Z', D) + crP('M166,162 C164,180 194,182 194,166 C192,156 172,154 166,162Z', D));
  let b = crP('M76,82 C92,46 158,42 182,72 C200,96 196,134 176,146 C150,160 108,156 92,140 C76,124 68,104 76,82Z', B)
    + crP('M104,94 C116,84 148,84 156,100 C160,118 148,138 128,140 C110,140 98,120 104,94Z', Sk)
    + crF('M92,140 C108,156 150,160 176,146 C160,160 110,162 92,140Z', D);
  s += crG('cr-breath', 130, 150, b);
  s += crP('M104,140 C98,160 100,174 98,186 L122,186 C120,170 122,156 126,144Z', B);
  // front arm, knuckles down
  s += crG('cr-head cr-arm', 84, 80, crP('M88,78 C58,82 44,118 48,170 L70,172 C68,136 76,110 96,100Z', B) + crP('M40,168 C40,156 64,152 76,162 C80,176 64,186 50,184 C42,182 40,176 40,168Z', Sk));
  let h = crP('M98,62 C98,36 70,26 52,36 C36,46 34,70 44,84 C54,98 84,100 96,86 C100,80 100,70 98,62Z', B)
    + crP('M40,62 C40,50 70,48 76,62 C80,76 70,90 56,92 C44,92 38,76 40,62Z', Sk)
    + crL('M42,58 C52,52 64,52 74,58', CR_INK, 4) + crEye(52, 62, 3.4, E) + crEye(68, 62, 3, E);
  h += crG('cr-jaw', 54, 88, crP('M42,80 C46,94 66,96 74,84 C66,88 50,88 42,80Z', '#7a1e2c') + crTeeth(46, 72, 82, 3, 1));
  s += crG('cr-head', 82, 86, h);
  return s;
}

/* ------------------------------------------------------------ sprout fiend */
function crPlant(o) {
  const B = o.body, D = shade(B, -0.3), L = shade(B, 0.3), E = o.eye || '#ff3a6a';
  let s = crP('M120,140 C112,160 110,176 104,186 L120,186 C124,172 128,158 132,146Z', D) + crP('M140,140 C150,160 156,174 160,186 L176,186 C170,170 162,154 152,140Z', B);
  s += crG('cr-breath', 136, 150, crP('M112,100 C116,84 158,84 162,104 C166,124 158,146 136,148 C116,148 108,124 112,100Z', B) + crL('M124,108 l8,20 M146,106 l-4,24', D, 2.5));
  s += crG('cr-sway', 160, 108, crP('M160,104 C180,112 186,128 182,146 L174,146 C176,132 168,120 156,116Z', B));
  s += crG('cr-head cr-arm', 114, 108, crP('M114,106 C94,110 82,124 80,140 L88,142 C92,130 102,120 116,118Z', B) + crP('M78,138 l-8,8 l10,-2 l-2,10 l8,-12Z', L));
  let h = crP('M150,62 C152,30 122,20 102,30 C84,40 80,64 92,80 C104,96 136,98 148,84 C154,76 150,70 150,62Z', B)
    + crL('M110,30 C118,44 120,60 116,78 M134,26 C134,44 132,64 126,82', D, 2.4)
    + crP('M126,24 C126,6 146,0 156,8 C146,10 138,16 134,26Z', '#7fe05a') + crP('M118,26 C108,10 90,10 84,18 C96,18 106,22 112,30Z', '#5fc046')
    + crP('M84,56 C84,46 104,44 110,56 C112,66 100,74 92,72 C86,70 84,64 84,56Z', '#1a1220') + crEye(97, 59, 4.6, E);
  h += crG('cr-jaw', 108, 84, crP('M96,80 C104,92 124,94 136,84 C124,88 106,88 96,80Z', '#6e1a2a') + crTeeth(100, 132, 82, 3, 1));
  s += crG('cr-head', 118, 90, h);
  return s;
}

/* ------------------------------------------------------------ elder curse (blob of mouths) */
function crBlob(o) {
  const B = o.body, D = shade(B, -0.3), L = shade(B, 0.25), E = o.eye || '#ffe14a';
  let s = crG('cr-sway', 190, 150, crP('M180,150 C210,140 226,110 214,84 C230,96 236,134 214,160Z', D) + crP('M182,170 C214,176 232,160 236,140 C240,166 222,190 190,186Z', D));
  let b = crP('M40,186 C30,140 50,80 100,58 C150,38 200,70 206,120 C210,150 200,176 190,186Z', B)
    + crF('M40,186 C60,170 150,166 190,186Z', D) + crF('M70,90 C90,66 130,56 160,66 C126,64 96,74 76,100Z', L, 0.7)
    + `<circle cx="168" cy="100" r="10" fill="${D}"/><circle cx="80" cy="150" r="8" fill="${D}"/>`;
  if (o.moss) b += crF('M50,120 C60,96 86,74 110,66 C96,80 70,100 58,126Z', o.moss, 0.9) + crF('M150,60 C170,62 190,78 196,98 C184,84 166,70 150,66Z', o.moss, 0.9);
  b += crEye(100, 84, 5, E, true) + crEye(150, 82, 3.6, E, true) + crEye(176, 120, 4, E, true) + crEye(126, 64, 3, E, true);
  s += crG('cr-breath', 120, 186, b);
  // great mouth
  const mouth = crP('M62,120 C78,104 136,102 156,124 C150,150 130,166 104,166 C80,166 62,148 62,120Z', '#3a0d1e')
    + crTeeth(68, 152, 116, 8, 1) + crF('M84,150 C96,140 120,140 132,152 C120,160 96,160 84,150Z', '#c0475e');
  s += crG('cr-jaw cr-head', 108, 120, mouth);
  return s;
}

/* ------------------------------------------------------------ mimic (mossy chest) */
function crMimic(o) {
  const B = o.body, D = shade(B, -0.3), M = o.metal || '#c9a24a';
  let s = crP('M70,170 C66,180 60,186 52,188 L84,188 C86,182 88,176 90,170Z', o.skin || '#5f8f3a') + crP('M170,170 C176,180 184,186 194,188 L160,188 C158,182 156,176 154,170Z', o.skin || '#5f8f3a');
  s += crG('cr-breath', 128, 176, crP('M64,112 L192,112 L188,176 L68,176Z', B) + crL('M64,128 H192 M94,112 V176 M162,112 V176', M, 5) + crF('M68,170 L188,170 L188,176 L68,176Z', D) + crF('M64,112 C90,104 120,118 146,108 C166,102 180,112 192,112 L192,120 L64,120Z', '#6fae3a'));
  // tongue + teeth + lid
  const lid = crP('M60,108 C60,70 196,66 196,104 L192,112 L64,112Z', B) + crL('M62,100 C100,88 160,86 194,98 M94,80 V108 M162,76 V110', M, 5)
    + crF('M70,78 C96,64 140,62 170,70 C150,74 120,76 96,86Z', '#6fae3a', 0.95) + crTeeth(70, 190, 106, 7, 1)
    + crEye(104, 90, 4, o.eye || '#ffe14a', true) + crEye(150, 88, 4, o.eye || '#ffe14a', true);
  s += crTeeth(70, 190, 112, -7, -1);
  s += crG('cr-head', 192, 112, crG('cr-lid', 190, 110, lid));
  s += crG('cr-jaw', 70, 120, crP('M80,116 C60,124 40,130 26,146 C36,148 44,144 48,138 C58,132 72,128 84,126Z', '#e66b8a'));
  return s;
}

/* ------------------------------------------------------------ wyvern */
function crWyvern(o) {
  const B = o.body, D = shade(B, -0.3), L = o.belly || shade(B, 0.4), W = o.wing || shade(B, 0.15);
  let s = crG('cr-wing', 150, 90, crP('M146,92 C150,40 186,6 232,2 C220,22 230,36 238,40 C222,52 230,70 238,78 C210,92 180,100 146,92Z', W) + crL('M150,88 C170,60 196,30 230,4 M160,92 C186,74 210,56 236,42 M172,96 C196,90 218,84 236,78', shade(W, -0.35), 2));
  s += crG('cr-tail', 186, 140, crP('M180,134 C206,144 222,164 236,166 L222,176 C204,170 188,158 176,150Z', B) + crP('M232,160 l8,4 l-6,10Z', '#e9e4da'));
  s += crP('M156,138 L160,186 L178,186 L172,134Z', D);
  s += crG('cr-breath', 140, 150, crP('M96,100 C110,82 162,84 180,104 C192,122 182,146 160,150 C134,154 106,146 96,130 C90,120 90,108 96,100Z', B) + crF('M100,128 C118,146 150,150 170,144 C148,156 114,150 100,128Z', L));
  s += crP('M116,138 L112,186 L132,186 L130,140Z', B) + crP('M106,186 l8,-6 l6,6 l6,-6 l6,6Z', '#e9e4da');
  let h = crP('M104,104 C96,80 86,60 70,52 C56,46 40,50 32,58 L10,64 C6,68 10,74 18,74 L44,74 C56,80 70,82 76,92 C82,100 92,112 104,112Z', B)
    + crP('M58,50 C62,30 78,22 90,26 C80,30 74,40 72,52Z', '#e9e4da') + crP('M70,54 C78,40 94,38 102,44 C92,46 86,52 82,60Z', '#d8d0c0')
    + crEye(42, 60, 3.6, o.eye || '#ffdf3a', true);
  h += crG('cr-jaw', 40, 74, crP('M14,74 L48,76 C42,86 24,86 14,74Z', D) + crTeeth(18, 44, 75, 3, 1));
  s += crG('cr-head', 96, 104, h);
  s += crG('cr-sway', 150, 92, crP('M138,94 C130,74 140,58 156,52 C152,64 156,74 164,80 Z', W));
  return s;
}

const CR_PLANS = { quad: crQuad, golem: crGolem, puppet: crPuppet, shark: crShark, serpent: crSerpent, spirit: crSpirit, menos: crMenos, husk: crHusk, spider: crSpider, ape: crApe, plant: crPlant, blob: crBlob, mimic: crMimic, wyvern: crWyvern };
// name -> [plan, palette]. size: scale on the floor (bosses are bigger).
const CREATURES = {
  'Puppet Drone':      ['puppet', { body: '#b07a4a', mask: '#f1e7d0', core: '#8ff0ff' }],
  'Ninken Alpha':      ['quad', { body: '#6f7f99', belly: '#c9d3e2', eye: '#ffcf3a', ear: 'pointy', earIn: '#3b4458', band: '#2c3a66', scar: 1, tail: 'thin' }],
  'Stone Golem':       ['golem', { body: '#8c8a86', kind: 'stone', moss: '#5f9c48', eye: '#ffb84a' }],
  'Ashen Fox Beast':   ['quad', { body: '#e9693a', belly: '#ffe2c4', tip: '#4a3a3a', eye: '#ffef6a', slit: 1, tails: 5, embers: '#ffb347', size: 1.15 }],
  'Reef Shark':        ['shark', { body: '#5f8fae', eye: '#0b0d12', water: '#1f7fb8' }],
  'Sea Leviathan':     ['serpent', { body: '#2f8f8a', belly: '#bfe9cf', fin: '#5fd0c4', eye: '#ffdf3a', water: '#155f8f' }],
  'Lesser Husk':       ['husk', { body: '#2b2433', mask: '#f2eee4', eye: '#ffd23a' }],
  'Lurking Husk':      ['spider', { body: '#2f2638', mask: '#efe9dc', eye: '#c4ff3a' }],
  'Towering Husk':     ['menos', { robe: '#1d1a26', mask: '#f2eee4', size: 1.1 }],
  'Sand Wraith':       ['spirit', { robe: '#c9a46a', face: '#3a2a1a', eye: '#ffe46a', sand: '#e8d29a', claw: '#f3ead2' }],
  'Raging Ape':        ['ape', { body: '#7a4a2a', skin: '#d9a57a', eye: '#ff3a3a' }],
  'Sprout Fiend':      ['plant', { body: '#4fae4a', eye: '#ff3a6a' }],
  'Grudge Spirit':     ['spirit', { robe: '#4a2a6a', face: '#14101c', eyes: 'many', eye: '#ff5ab4', mouth: 1 }],
  'Shrine Specter':    ['spirit', { robe: '#e8e4f2', face: '#1a1626', eye: '#7df9ff', talismans: 1, halo: '#7df9ff' }],
  'Elder Curse':       ['blob', { body: '#4a2a5a', eye: '#d4ff3a', moss: '#2f6a4a', size: 1.05 }],
  'Swamp Mimic':       ['mimic', { body: '#7a5a3a', metal: '#c9a24a', skin: '#5f8f3a', eye: '#ffe14a' }],
  'Cliff Wyvern':      ['wyvern', { body: '#5a7a4a', belly: '#d8e2b0', wing: '#8a6a4a', eye: '#ffdf3a' }],
  'Ruin Guardian':     ['golem', { body: '#6f7a72', kind: 'ruin', rune: '#5ff0c0', eye: '#5ff0c0' }],
  'Feral Chimera':     ['quad', { body: '#c99a4a', belly: '#f0dcae', mane: '#7a4a22', horns: '#e9e4da', tail: 'snake', tailCol: '#5c9a4a', eye: '#ffdf3a', slit: 1, ear: 'round' }],
  'Chimera King':      ['quad', { body: '#d8a84a', belly: '#f6e6be', mane: '#8a2a2a', horns: '#f2e6c8', tail: 'snake', tailCol: '#3f8a5a', wings: '#7a2a3a', crown: 1, eye: '#ff4d3a', slit: 1, ear: 'round', size: 1.15 }],
  'Living Statue':     ['golem', { body: '#e8e4dc', kind: 'marble', trim: '#d8b25a', eye: '#ffe46a' }],
  'The Unbound':       ['spirit', { robe: '#14102a', face: '#05040c', eyes: 'many', eye: '#ff5bd8', halo: '#8b2bd6', stars: '#ffd0ee', size: 1.2 }],
};
const creatureOf = (name) => CREATURES[name] || null;
// The creature's <svg>. opts: { cls }.
function creatureSVG(name, opts) {
  const c = CREATURES[name];
  if (!c) return '';
  const [plan, o] = c;
  return `<svg class="cr cr-${plan} ${(opts && opts.cls) || ''}" viewBox="0 0 240 200" aria-hidden="true">${CR_PLANS[plan](o)}</svg>`;
}
