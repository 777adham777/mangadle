'use strict';
/* ==========================================================================
   ANIME IDLE RPG — procedural world backdrops
   Each world gets a layered SVG landscape (sky, light source, parallax ridges,
   landmarks, particles). No image assets: everything is generated here.
   ========================================================================== */

function sceneRng(seed) {
  let s = seed >>> 0;
  return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; };
}
// A mountain ridge: sum of sines + jitter, closed to the bottom of the 1600x900 canvas.
function sceneRidge(seed, base, amp, opts) {
  const o = Object.assign({ step: 16, rough: 0.12, f: 1, sharp: false }, opts || {});
  const r = sceneRng(seed);
  const p1 = r() * 6, p2 = r() * 6, p3 = r() * 6;
  let d = `M0 900 L0 ${base}`;
  for (let x = 0; x <= 1600 + o.step; x += o.step) {
    let w = 0.55 * Math.sin(x * 0.0042 * o.f + p1) + 0.3 * Math.sin(x * 0.011 * o.f + p2) + 0.15 * Math.sin(x * 0.027 * o.f + p3);
    if (o.sharp) w = 1 - Math.abs(w) * 1.6;
    const y = base - amp * w - amp * o.rough * (r() - 0.5);
    d += ` L${x} ${y.toFixed(1)}`;
  }
  return d + ' L1600 900 Z';
}
function sceneStars(seed, n, maxY) {
  const r = sceneRng(seed);
  let s = '';
  for (let i = 0; i < n; i++) s += `<circle cx="${(r() * 1600).toFixed(0)}" cy="${(r() * maxY).toFixed(0)}" r="${(r() * 1.4 + 0.3).toFixed(2)}" opacity="${(r() * 0.6 + 0.2).toFixed(2)}"/>`;
  return `<g fill="#fff">${s}</g>`;
}
// Particles live in a separate HTML layer (compositor-animated transforms), not inside the SVG:
// animating SVG children forces a full repaint of the scene on every frame.
const PARTICLES = {};
function sceneMotes(seed, n, cls, color, y0, y1) {
  PARTICLES[sceneMotes.kind] = { seed, n, cls, color, y0, y1 };
  return '';
}
function particlesHTML(kind) {
  const P = PARTICLES[kind];
  if (!P) return '';
  const r = sceneRng(P.seed);
  let s = '';
  for (let i = 0; i < P.n; i++) {
    const x = r() * 100, y = (P.y0 + r() * (P.y1 - P.y0)) / 9, sz = r() * 3 + 2;
    s += `<i class="pt ${P.cls}" style="left:${x.toFixed(1)}%;top:${y.toFixed(1)}%;width:${sz.toFixed(1)}px;height:${sz.toFixed(1)}px;background:${P.color};box-shadow:0 0 ${(sz * 2).toFixed(0)}px ${P.color};animation-delay:${(-r() * 14).toFixed(1)}s;animation-duration:${(9 + r() * 9).toFixed(1)}s"></i>`;
  }
  return `<div class="particles">${s}</div>`;
}
const sceneMist = (id, y, h, op) => `<rect x="0" y="${y}" width="1600" height="${h}" fill="url(#${id})" opacity="${op}"/>`;

function scenePagoda(x, y, s, fill) {
  // stacked roofs, centred on x, base at y
  let g = '';
  const tiers = 4;
  for (let i = 0; i < tiers; i++) {
    const w = (110 - i * 20) * s, h = 34 * s, yy = y - i * 44 * s;
    g += `<path d="M${x - w} ${yy} Q${x - w * 0.55} ${yy - h * 0.55} ${x - w * 0.42} ${yy - h} L${x + w * 0.42} ${yy - h} Q${x + w * 0.55} ${yy - h * 0.55} ${x + w} ${yy} Z"/>`;
    g += `<rect x="${x - w * 0.38}" y="${yy}" width="${w * 0.76}" height="${12 * s}"/>`;
  }
  g += `<rect x="${x - 2 * s}" y="${y - tiers * 44 * s - 40 * s}" width="${4 * s}" height="${44 * s}"/>`;
  return `<g fill="${fill}">${g}</g>`;
}
function scenePines(seed, y, n, fill, scale) {
  const r = sceneRng(seed);
  let g = '';
  for (let i = 0; i < n; i++) {
    const x = r() * 1600, h = (60 + r() * 90) * scale, w = h * 0.32;
    g += `<path d="M${x} ${y - h} L${x - w} ${y + 4} L${x + w} ${y + 4} Z"/><path d="M${x} ${y - h * 0.65} L${x - w * 1.25} ${y - h * 0.05} L${x + w * 1.25} ${y - h * 0.05} Z"/>`;
  }
  return `<g fill="${fill}">${g}</g>`;
}
function sceneTorii(x, y, s, fill) {
  return `<g fill="${fill}">
    <rect x="${x - 70 * s}" y="${y - 150 * s}" width="${14 * s}" height="${150 * s}"/><rect x="${x + 56 * s}" y="${y - 150 * s}" width="${14 * s}" height="${150 * s}"/>
    <path d="M${x - 110 * s} ${y - 160 * s} Q${x} ${y - 178 * s} ${x + 110 * s} ${y - 160 * s} L${x + 104 * s} ${y - 146 * s} Q${x} ${y - 160 * s} ${x - 104 * s} ${y - 146 * s} Z"/>
    <rect x="${x - 86 * s}" y="${y - 128 * s}" width="${172 * s}" height="${10 * s}"/></g>`;
}
function sceneShip(x, y, s, fill) {
  return `<g fill="${fill}">
    <path d="M${x - 120 * s} ${y - 30 * s} L${x + 130 * s} ${y - 30 * s} L${x + 100 * s} ${y} L${x - 95 * s} ${y} Z"/>
    <path d="M${x + 130 * s} ${y - 30 * s} L${x + 175 * s} ${y - 58 * s} L${x + 135 * s} ${y - 40 * s} Z"/>
    <rect x="${x - 5 * s}" y="${y - 210 * s}" width="${5 * s}" height="${180 * s}"/><rect x="${x - 75 * s}" y="${y - 160 * s}" width="${4 * s}" height="${130 * s}"/>
    <path d="M${x - 2 * s} ${y - 200 * s} Q${x + 70 * s} ${y - 160 * s} ${x - 2 * s} ${y - 110 * s} Z"/><path d="M${x - 2 * s} ${y - 100 * s} Q${x + 82 * s} ${y - 70 * s} ${x - 2 * s} ${y - 40 * s} Z"/>
    <path d="M${x - 73 * s} ${y - 150 * s} Q${x - 20 * s} ${y - 118 * s} ${x - 73 * s} ${y - 82 * s} Z"/>
    <path d="M${x - 2 * s} ${y - 210 * s} l${30 * s} ${8 * s} l${-30 * s} ${8 * s} Z"/></g>`;
}
function sceneWaves(seed, y0, n, color) {
  const r = sceneRng(seed);
  let g = '';
  for (let i = 0; i < n; i++) {
    const y = y0 + i * i * 2.2 + i * 6, x = r() * 1500, w = 40 + r() * 140 + i * 6;
    g += `<path d="M${x} ${y.toFixed(0)} q${w / 4} -4 ${w / 2} 0 t${w / 2} 0" stroke="${color}" stroke-width="${(1 + i * 0.06).toFixed(2)}" fill="none" opacity="${(0.15 + r() * 0.25).toFixed(2)}"/>`;
  }
  return `<g>${g}</g>`;
}

// flat-topped butte, centred on x, base at y
function sceneMesa(x, y, w, h, fill) {
  return `<path d="M${x - w / 2} ${y} L${x - w * 0.38} ${y - h * 0.82} L${x - w * 0.33} ${y - h} L${x + w * 0.3} ${y - h} L${x + w * 0.36} ${y - h * 0.86} L${x + w / 2} ${y} Z" fill="${fill}"/>`;
}
// night skyline with a few lit windows
function sceneCity(seed, y, n, fill, lit) {
  const r = sceneRng(seed);
  let g = '', win = '';
  let x = -20;
  for (let i = 0; i < n && x < 1620; i++) {
    const w = 50 + r() * 90, h = 80 + r() * 230;
    g += `<rect x="${x.toFixed(0)}" y="${(y - h).toFixed(0)}" width="${w.toFixed(0)}" height="${(h + 4).toFixed(0)}"/>`;
    if (r() < 0.35) g += `<rect x="${(x + w * 0.42).toFixed(0)}" y="${(y - h - 36).toFixed(0)}" width="3" height="36"/>`;
    for (let k = 0; k < 7; k++) if (r() < 0.45) win += `<rect x="${(x + 8 + r() * (w - 18)).toFixed(0)}" y="${(y - h + 14 + r() * (h - 30)).toFixed(0)}" width="6" height="9"/>`;
    x += w + 4 + r() * 14;
  }
  return `<g fill="${fill}">${g}</g><g fill="${lit}" opacity=".55">${win}</g>`;
}
// stone column with base and capital; broken = jagged top
function scenePillar(x, y, h, s, fill, broken) {
  const w = 34 * s;
  const top = broken
    ? `<path d="M${x - w / 2} ${y - h} l${w * 0.3} ${-14 * s} l${w * 0.25} ${10 * s} l${w * 0.25} ${-18 * s} l${w * 0.2} ${22 * s} Z"/>`
    : `<rect x="${x - w * 0.85}" y="${y - h - 16 * s}" width="${w * 1.7}" height="${16 * s}"/><rect x="${x - w * 0.7}" y="${y - h - 4 * s}" width="${w * 1.4}" height="${6 * s}"/>`;
  return `<g fill="${fill}"><rect x="${x - w / 2}" y="${y - h}" width="${w}" height="${h}"/><rect x="${x - w * 0.8}" y="${y - 12 * s}" width="${w * 1.6}" height="${12 * s}"/>${top}</g>`;
}
function sceneBolt(x, y, s, color) {
  return `<path d="M${x} ${y} l${-30 * s} ${90 * s} l${22 * s} ${-6 * s} l${-34 * s} ${110 * s} l${60 * s} ${-130 * s} l${-24 * s} ${8 * s} l${26 * s} ${-72 * s} Z" fill="${color}"/>`;
}

const SCENES = {
  shinobi: () => `
    <defs>
      <linearGradient id="sk-sh" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#121633"/><stop offset=".42" stop-color="#3a2a55"/><stop offset=".72" stop-color="#a24f5c"/><stop offset=".9" stop-color="#ee9a5c"/></linearGradient>
      <radialGradient id="sun-sh"><stop offset="0" stop-color="#fff2d0"/><stop offset=".35" stop-color="#ffc98a" stop-opacity=".9"/><stop offset="1" stop-color="#ff8a4a" stop-opacity="0"/></radialGradient>
      <linearGradient id="mist-sh" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffd2b0" stop-opacity="0"/><stop offset=".5" stop-color="#ffd2b0" stop-opacity=".35"/><stop offset="1" stop-color="#ffd2b0" stop-opacity="0"/></linearGradient>
    </defs>
    <rect width="1600" height="900" fill="url(#sk-sh)"/>
    ${sceneStars(11, 60, 260)}
    <circle cx="1120" cy="560" r="330" fill="url(#sun-sh)" opacity=".7"/><circle cx="1120" cy="560" r="96" fill="#ffe3b8"/>
    <path d="${sceneRidge(3, 610, 150, { f: 0.8, sharp: true })}" fill="#7a4562" opacity=".8"/>
    ${sceneMist('mist-sh', 520, 160, 0.8)}
    <path d="${sceneRidge(7, 680, 110, { f: 1.1 })}" fill="#4a2d4f"/>
    ${scenePagoda(360, 618, 1, '#3b2442')}
    ${sceneMist('mist-sh', 640, 120, 0.5)}
    <path d="${sceneRidge(9, 770, 60, { f: 1.6 })}" fill="#24182f"/>
    ${scenePines(5, 790, 22, '#1a1124', 1)}
    <path d="${sceneRidge(13, 860, 30, { f: 2.2 })}" fill="#120b19"/>
    ${sceneMotes(21, 28, 'mote-fall', '#ffb6c8', 0, 700)}`,

  soul: () => `
    <defs>
      <linearGradient id="sk-so" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#05040f"/><stop offset=".5" stop-color="#161034"/><stop offset=".85" stop-color="#3b2466"/></linearGradient>
      <radialGradient id="moon-so"><stop offset="0" stop-color="#d9d2ff" stop-opacity=".55"/><stop offset="1" stop-color="#7b5cff" stop-opacity="0"/></radialGradient>
      <linearGradient id="mist-so" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#b9a6ff" stop-opacity="0"/><stop offset=".5" stop-color="#b9a6ff" stop-opacity=".22"/><stop offset="1" stop-color="#b9a6ff" stop-opacity="0"/></linearGradient>
    </defs>
    <rect width="1600" height="900" fill="url(#sk-so)"/>
    ${sceneStars(4, 160, 620)}
    <circle cx="1170" cy="250" r="380" fill="url(#moon-so)"/>
    <circle cx="1170" cy="250" r="150" fill="#ebe6ff"/>
    <circle cx="1120" cy="215" r="26" fill="#d6cdf7"/><circle cx="1215" cy="300" r="18" fill="#d6cdf7"/><circle cx="1195" cy="190" r="10" fill="#d6cdf7"/>
    <path d="${sceneRidge(31, 640, 170, { f: 0.9, sharp: true, rough: 0.3 })}" fill="#2a1c52" opacity=".9"/>
    ${sceneMist('mist-so', 560, 180, 1)}
    <path d="${sceneRidge(33, 720, 100, { f: 1.4, sharp: true, rough: 0.4 })}" fill="#1a1236"/>
    ${sceneTorii(420, 745, 1.1, '#120c26')}
    ${sceneMist('mist-so', 690, 140, 0.8)}
    <path d="${sceneRidge(35, 820, 45, { f: 2 })}" fill="#0b0818"/>
    ${sceneMotes(41, 30, 'mote-rise', '#c9b8ff', 300, 900)}`,

  seas: () => `
    <defs>
      <linearGradient id="sk-se" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#081631"/><stop offset=".38" stop-color="#1b3f6e"/><stop offset=".56" stop-color="#5d93bd"/><stop offset=".64" stop-color="#f1c48d"/></linearGradient>
      <linearGradient id="sea-se" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#3f7aa6"/><stop offset=".3" stop-color="#1c4a75"/><stop offset="1" stop-color="#071a33"/></linearGradient>
      <linearGradient id="refl-se" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffe2b0" stop-opacity=".45"/><stop offset="1" stop-color="#ffe2b0" stop-opacity="0"/></linearGradient>
      <radialGradient id="sun-se"><stop offset="0" stop-color="#fff4da"/><stop offset=".3" stop-color="#ffd59a" stop-opacity=".8"/><stop offset="1" stop-color="#ffb070" stop-opacity="0"/></radialGradient>
    </defs>
    <rect width="1600" height="900" fill="url(#sk-se)"/>
    ${sceneStars(8, 50, 220)}
    <g fill="#fff" opacity=".09"><ellipse cx="300" cy="230" rx="260" ry="34"/><ellipse cx="420" cy="205" rx="160" ry="26"/><ellipse cx="1250" cy="160" rx="300" ry="30"/><ellipse cx="980" cy="300" rx="200" ry="20"/></g>
    <circle cx="820" cy="580" r="300" fill="url(#sun-se)" opacity=".8"/><circle cx="820" cy="578" r="70" fill="#fff0cf"/>
    <path d="M0 560 Q160 520 300 548 Q360 528 420 552 L420 580 L0 580 Z" fill="#2b4a6c" opacity=".8"/>
    <path d="M1240 566 Q1340 520 1450 540 Q1530 530 1600 548 L1600 580 L1240 580 Z" fill="#2b4a6c" opacity=".8"/>
    <rect x="0" y="575" width="1600" height="325" fill="url(#sea-se)"/>
    <path d="M790 576 L850 576 L900 800 L740 800 Z" fill="url(#refl-se)" opacity=".5"/>
    ${sceneWaves(17, 590, 40, '#bfe2ff')}
    ${sceneShip(1130, 600, 1, '#0c1c33')}
    ${sceneMotes(51, 18, 'mote-drift', '#e8f6ff', 100, 520)}`,

  ki: () => `
    <defs>
      <linearGradient id="sk-ki" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#1a0f2a"/><stop offset=".38" stop-color="#5a2a3a"/><stop offset=".66" stop-color="#d0743a"/><stop offset=".8" stop-color="#ffc062"/></linearGradient>
      <radialGradient id="sun-ki"><stop offset="0" stop-color="#fff3c8"/><stop offset=".3" stop-color="#ffcf6a" stop-opacity=".85"/><stop offset="1" stop-color="#ff8a3a" stop-opacity="0"/></radialGradient>
      <linearGradient id="dust-ki" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffcf8a" stop-opacity="0"/><stop offset=".5" stop-color="#ffcf8a" stop-opacity=".28"/><stop offset="1" stop-color="#ffcf8a" stop-opacity="0"/></linearGradient>
    </defs>
    <rect width="1600" height="900" fill="url(#sk-ki)"/>
    ${sceneStars(101, 50, 220)}
    <circle cx="430" cy="640" r="360" fill="url(#sun-ki)" opacity=".75"/><circle cx="430" cy="640" r="88" fill="#fff0c4"/>
    ${sceneBolt(1220, 90, 1, '#fff6c8')}${sceneBolt(1300, 150, 0.6, '#ffe48a')}
    <path d="${sceneRidge(103, 640, 60, { f: 0.6 })}" fill="#a2523e" opacity=".75"/>
    ${sceneMesa(980, 650, 360, 190, '#7c3a35')}${sceneMesa(1360, 660, 260, 140, '#6e3330')}${sceneMesa(180, 670, 220, 120, '#6e3330')}
    ${sceneMist('dust-ki', 560, 180, 1)}
    ${sceneMesa(700, 760, 420, 150, '#47201f')}${sceneMesa(1480, 770, 300, 200, '#3e1c1c')}
    <path d="${sceneRidge(105, 790, 40, { f: 1.8, rough: 0.4 })}" fill="#2b1414"/>
    <ellipse cx="1050" cy="845" rx="230" ry="26" fill="#1c0c0c"/>
    <path d="${sceneRidge(107, 870, 24, { f: 2.6, rough: 0.5 })}" fill="#170909"/>
    ${sceneMotes(109, 24, 'mote-drift', '#ffd08a', 300, 860)}`,

  hex: () => `
    <defs>
      <linearGradient id="sk-hx" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#03080b"/><stop offset=".55" stop-color="#0b2328"/><stop offset=".85" stop-color="#17463f"/></linearGradient>
      <radialGradient id="moon-hx"><stop offset="0" stop-color="#bff5dc" stop-opacity=".45"/><stop offset="1" stop-color="#3fe0a0" stop-opacity="0"/></radialGradient>
      <linearGradient id="fog-hx" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#5cf0b0" stop-opacity="0"/><stop offset=".5" stop-color="#5cf0b0" stop-opacity=".2"/><stop offset="1" stop-color="#5cf0b0" stop-opacity="0"/></linearGradient>
    </defs>
    <rect width="1600" height="900" fill="url(#sk-hx)"/>
    ${sceneStars(121, 120, 420)}
    <circle cx="1240" cy="200" r="300" fill="url(#moon-hx)"/>
    <path d="M1240 90 a110 110 0 1 0 0 220 a86 86 0 1 1 0 -220 Z" fill="#e4fff2"/>
    ${sceneCity(123, 640, 26, '#0f2a2d', '#7ff0c0')}
    ${sceneMist('fog-hx', 540, 180, 1)}
    ${sceneCity(127, 760, 22, '#081a1c', '#ffd27a')}
    ${sceneTorii(380, 800, 1.15, '#040d0e')}
    ${sceneMist('fog-hx', 700, 160, 0.9)}
    <path d="${sceneRidge(129, 850, 18, { f: 2.4 })}" fill="#030809"/>
    ${sceneMotes(131, 28, 'mote-rise', '#7dffc4', 380, 900)}`,

  hunter: () => `
    <defs>
      <linearGradient id="sk-hn" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#0b1a1a"/><stop offset=".45" stop-color="#28504a"/><stop offset=".7" stop-color="#9fa86a"/><stop offset=".82" stop-color="#f0c27a"/></linearGradient>
      <radialGradient id="sun-hn"><stop offset="0" stop-color="#fff2c8"/><stop offset=".35" stop-color="#ffd38a" stop-opacity=".7"/><stop offset="1" stop-color="#ffb060" stop-opacity="0"/></radialGradient>
      <linearGradient id="mist-hn" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#e8f0c8" stop-opacity="0"/><stop offset=".5" stop-color="#e8f0c8" stop-opacity=".3"/><stop offset="1" stop-color="#e8f0c8" stop-opacity="0"/></linearGradient>
      <linearGradient id="fall-hn" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#eaffff" stop-opacity=".85"/><stop offset="1" stop-color="#bfe8ea" stop-opacity=".2"/></linearGradient>
    </defs>
    <rect width="1600" height="900" fill="url(#sk-hn)"/>
    ${sceneStars(141, 40, 200)}
    <circle cx="760" cy="620" r="320" fill="url(#sun-hn)" opacity=".7"/><circle cx="760" cy="620" r="70" fill="#fff1c8"/>
    <path d="${sceneRidge(143, 600, 140, { f: 0.8, sharp: true })}" fill="#3f6a5a" opacity=".8"/>
    ${sceneMist('mist-hn', 520, 170, 0.9)}
    <path d="M1180 900 L1180 420 Q1230 330 1330 300 L1600 260 L1600 900 Z" fill="#1d3a33"/>
    <path d="M1236 370 L1268 362 L1290 820 L1214 820 Z" fill="url(#fall-hn)"/>
    <path d="${sceneRidge(145, 700, 80, { f: 1.2 })}" fill="#22423a"/>
    ${scenePines(147, 720, 30, '#173129', 1)}
    ${sceneMist('mist-hn', 680, 120, 0.5)}
    <path d="${sceneRidge(149, 800, 50, { f: 1.8 })}" fill="#10231e"/>
    ${scenePines(151, 830, 22, '#0b1a16', 1.4)}
    <path d="${sceneRidge(153, 870, 22, { f: 2.6 })}" fill="#07120f"/>
    ${sceneMotes(155, 22, 'mote-drift', '#f4ffb0', 300, 820)}`,

  echo: () => `
    <defs>
      <linearGradient id="sk-ec" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#12061c"/><stop offset=".45" stop-color="#3a1450"/><stop offset=".72" stop-color="#a0408a"/><stop offset=".86" stop-color="#ffb07a"/></linearGradient>
      <radialGradient id="sun-ec"><stop offset="0" stop-color="#ffe6f2"/><stop offset=".35" stop-color="#ff9ad0" stop-opacity=".75"/><stop offset="1" stop-color="#c05cff" stop-opacity="0"/></radialGradient>
      <linearGradient id="mist-ec" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffc6ec" stop-opacity="0"/><stop offset=".5" stop-color="#ffc6ec" stop-opacity=".22"/><stop offset="1" stop-color="#ffc6ec" stop-opacity="0"/></linearGradient>
    </defs>
    <rect width="1600" height="900" fill="url(#sk-ec)"/>
    ${sceneStars(161, 110, 380)}
    <circle cx="1000" cy="560" r="340" fill="url(#sun-ec)" opacity=".75"/><circle cx="1000" cy="560" r="120" fill="none" stroke="#ffe0f0" stroke-width="3" opacity=".7"/><circle cx="1000" cy="560" r="76" fill="#ffe6f2"/>
    <g fill="#2a0f3a" opacity=".85"><path d="M260 300 l90 -10 l40 30 l-60 40 l-60 -10 Z"/><path d="M1320 240 l70 -6 l30 24 l-50 30 l-44 -8 Z"/><path d="M640 200 l40 -4 l20 14 l-30 18 l-26 -6 Z"/></g>
    <path d="${sceneRidge(163, 640, 90, { f: 0.7 })}" fill="#5a2366" opacity=".8"/>
    ${scenePillar(760, 660, 200, 1, '#3e1850')}${scenePillar(880, 660, 230, 1, '#3e1850')}${scenePillar(1120, 660, 210, 1, '#3e1850')}${scenePillar(1240, 660, 120, 1, '#3e1850', true)}
    <rect x="725" y="420" width="190" height="18" fill="#3e1850"/>
    ${sceneMist('mist-ec', 560, 170, 1)}
    <path d="${sceneRidge(165, 740, 60, { f: 1.3 })}" fill="#2a0f36"/>
    ${scenePillar(240, 790, 300, 1.4, '#1b0824')}${scenePillar(420, 790, 160, 1.4, '#1b0824', true)}${scenePillar(1450, 800, 260, 1.3, '#1b0824', true)}
    <path d="${sceneRidge(167, 840, 30, { f: 2.2 })}" fill="#10041a"/>
    ${sceneMotes(169, 30, 'mote-rise', '#ffc0ec', 300, 900)}`,

  battle: () => `
    <defs>
      <linearGradient id="sk-ba" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#0c0509"/><stop offset=".55" stop-color="#3a0e1d"/><stop offset=".82" stop-color="#8a2a33"/></linearGradient>
      <radialGradient id="glow-ba"><stop offset="0" stop-color="#ff7a5a" stop-opacity=".6"/><stop offset="1" stop-color="#ff3a4a" stop-opacity="0"/></radialGradient>
      <linearGradient id="mist-ba" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ff9a7a" stop-opacity="0"/><stop offset=".5" stop-color="#ff9a7a" stop-opacity=".18"/><stop offset="1" stop-color="#ff9a7a" stop-opacity="0"/></linearGradient>
    </defs>
    <rect width="1600" height="900" fill="url(#sk-ba)"/>
    ${sceneStars(61, 40, 300)}
    <circle cx="800" cy="700" r="520" fill="url(#glow-ba)"/>
    <path d="${sceneRidge(63, 650, 160, { f: 0.7, sharp: true })}" fill="#4a1420" opacity=".9"/>
    <g fill="#2e0b14"><rect x="1150" y="470" width="40" height="190"/><rect x="1240" y="430" width="50" height="230"/><rect x="1330" y="490" width="36" height="170"/><path d="M1140 470 l30 -40 l30 40 Z"/><path d="M1230 430 l35 -50 l35 50 Z"/><path d="M1320 490 l28 -36 l28 36 Z"/><rect x="1140" y="560" width="240" height="100"/></g>
    ${sceneMist('mist-ba', 580, 160, 1)}
    <path d="${sceneRidge(65, 760, 70, { f: 1.4 })}" fill="#1f0810"/>
    <path d="${sceneRidge(67, 850, 30, { f: 2.4 })}" fill="#0f0408"/>
    ${sceneMotes(71, 26, 'mote-rise', '#ff9a5a', 400, 900)}`,

  hub: () => `
    <defs>
      <linearGradient id="sk-hu" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#05060f"/><stop offset=".6" stop-color="#0f1430"/><stop offset="1" stop-color="#1b1640"/></linearGradient>
      <radialGradient id="au1"><stop offset="0" stop-color="#ff8a3d" stop-opacity=".45"/><stop offset="1" stop-color="#ff8a3d" stop-opacity="0"/></radialGradient>
      <radialGradient id="au2"><stop offset="0" stop-color="#9d7bff" stop-opacity=".5"/><stop offset="1" stop-color="#9d7bff" stop-opacity="0"/></radialGradient>
      <radialGradient id="au3"><stop offset="0" stop-color="#3fb4ff" stop-opacity=".45"/><stop offset="1" stop-color="#3fb4ff" stop-opacity="0"/></radialGradient>
      <linearGradient id="rift-hu" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#ff4fd8" stop-opacity="0"/><stop offset=".5" stop-color="#ffd6f5"/><stop offset="1" stop-color="#ff4fd8" stop-opacity="0"/></linearGradient>
    </defs>
    <rect width="1600" height="900" fill="url(#sk-hu)"/>
    ${sceneStars(81, 220, 900)}
    <ellipse cx="260" cy="360" rx="520" ry="300" fill="url(#au1)"/><ellipse cx="800" cy="220" rx="520" ry="280" fill="url(#au2)"/><ellipse cx="1360" cy="380" rx="520" ry="300" fill="url(#au3)"/>
    <path d="M800 40 L812 140 L796 210 L818 300 L800 380 L790 300 L806 210 L788 140 Z" fill="url(#rift-hu)" opacity=".9"/>
    <g fill="#0a0c1c">
      <path d="M140 560 Q260 520 380 560 Q330 640 270 700 Q230 640 140 560 Z"/><path d="M620 470 Q800 420 980 470 Q900 580 800 660 Q700 580 620 470 Z"/><path d="M1220 580 Q1340 540 1470 580 Q1420 660 1350 720 Q1290 660 1220 580 Z"/>
    </g>
    ${scenePagoda(260, 556, 0.42, '#0a0c1c')}${sceneTorii(800, 470, 0.5, '#0a0c1c')}${sceneShip(1345, 574, 0.35, '#0a0c1c')}
    <path d="${sceneRidge(83, 860, 40, { f: 1.6 })}" fill="#07080f"/>
    ${sceneMotes(91, 30, 'mote-rise', '#d7c9ff', 300, 900)}`,
};
SCENES.rift = SCENES.hub;

function sceneSVG(kind, cls) {
  // Vector scene: stays sharp at any window size. (The painted realm images are only 531 px
  // wide, far too small for a full-page backdrop; they are used inside the scene boxes.)
  const f = SCENES[kind] || SCENES.hub;
  sceneMotes.kind = SCENES[kind] ? kind : 'hub';
  return `<svg class="scene-svg ${cls || ''}" viewBox="0 0 1600 900" preserveAspectRatio="xMidYMax slice" aria-hidden="true">${f()}</svg>`;
}
// Cache: scenes are deterministic, build each once.
const SCENE_CACHE = {};
function sceneHTML(kind, cls) {
  const k = kind + '|' + (cls || '');
  return SCENE_CACHE[k] || (SCENE_CACHE[k] = sceneSVG(kind, cls));
}
