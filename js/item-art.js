'use strict';
/* ==========================================================================
   TRI-REALM IDLE — item art (illustrated icons)
   Every item gets its own small illustration instead of a one-colour glyph:
   full colour, ink outline, cel shading and a gloss highlight, like a gacha
   item icon. Drawn on a 64x64 grid. Each world's items live in js/art/*.js.

   ART[id] = inner SVG markup (built with the helpers below).
   ui.js itemIc() uses ART first and falls back to the old glyph (icons.js).

   Style rules (keep every new icon in line):
   - Subject fills about 6..58 of the grid; weapons run diagonally, handle
     bottom-left to tip top-right.
   - Big shapes use S() (gradient fill + ink outline); inner details use F()/L()
     with a darker tone (dk()) and no outline; gloss with H(); sparkle with SP().
   - Every item must be recognisable alone: its own silhouette, its own colours,
     and the motif of its manga reference (leaf symbol, straw hat, dragon stars...).
   ========================================================================== */

const ART = {};
const ART_INK = '#1c1424';
const ART_DEFS = {};   // gradient id -> markup, put in the sprite <defs>

/* Helpers live in ARTK so their short names never clash with the rest of the game.
   Art files start with: const { S, F, L, H, SP, AURA, T, G, GL, lt, dk, mix, circ, ell, rect, poly, star, ROT, TR } = ARTK; */
const ARTK = (() => {
// colour maths
function artRgb(h) { h = h.replace('#', ''); if (h.length === 3) h = h.replace(/./g, '$&$&'); return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16)); }
function artHex(r) { return '#' + r.map((x) => Math.max(0, Math.min(255, Math.round(x))).toString(16).padStart(2, '0')).join(''); }
const mix = (a, b, t) => { const x = artRgb(a), y = artRgb(b); return artHex(x.map((v, i) => v + (y[i] - v) * t)); };
const lt = (c, t) => mix(c, '#ffffff', t == null ? 0.35 : t);   // lighter tone
const dk = (c, t) => mix(c, '#140c1c', t == null ? 0.35 : t);   // darker tone (towards ink, not grey)

// Gradient fill for a colour: light top-left, the colour, shaded bottom-right.
function G(c) {
  const id = 'iag' + c.replace('#', '');
  if (!ART_DEFS[id]) ART_DEFS[id] = `<linearGradient id="${id}" x1="0.15" y1="0" x2="0.45" y2="1"><stop offset="0" stop-color="${lt(c, 0.38)}"/><stop offset="0.5" stop-color="${c}"/><stop offset="1" stop-color="${dk(c, 0.32)}"/></linearGradient>`;
  return `url(#${id})`;
}
// Radial glow (for magic items): colour at the centre, transparent at the edge.
function GL(c) {
  const id = 'iagl' + c.replace('#', '');
  if (!ART_DEFS[id]) ART_DEFS[id] = `<radialGradient id="${id}"><stop offset="0" stop-color="${c}" stop-opacity="0.85"/><stop offset="0.55" stop-color="${c}" stop-opacity="0.35"/><stop offset="1" stop-color="${c}" stop-opacity="0"/></radialGradient>`;
  return `url(#${id})`;
}

// --- drawing helpers (every element sets its own stroke, so tile CSS never bleeds in)
// S: main shape, gradient + ink outline. o: {w: outline width, flat: true for a flat fill}
const S = (d, c, o) => `<path d="${d}" fill="${o && o.flat ? c : G(c)}" stroke="${ART_INK}" stroke-width="${(o && o.w) || 2.4}" stroke-linejoin="round" stroke-linecap="round"/>`;
// F: flat fill, no outline (shading, patterns, symbols). op: opacity
const F = (d, c, op) => `<path d="${d}" fill="${c}" stroke="none"${op != null ? ` opacity="${op}"` : ''}/>`;
// L: line. w: width (default 1.6)
const L = (d, c, w, op) => `<path d="${d}" fill="none" stroke="${c}" stroke-width="${w || 1.6}" stroke-linecap="round" stroke-linejoin="round"${op != null ? ` opacity="${op}"` : ''}/>`;
// H: gloss highlight (white, soft)
const H = (d, op) => `<path d="${d}" fill="#ffffff" stroke="none" opacity="${op == null ? 0.6 : op}"/>`;
// SP: four-point sparkle at x,y of size s
const SP = (x, y, s, c) => { s = s || 4; return `<path d="M${x} ${y - s}Q${x + s * 0.18} ${y - s * 0.18} ${x + s} ${y}Q${x + s * 0.18} ${y + s * 0.18} ${x} ${y + s}Q${x - s * 0.18} ${y + s * 0.18} ${x - s} ${y}Q${x - s * 0.18} ${y - s * 0.18} ${x} ${y - s}Z" fill="${c || '#ffffff'}" stroke="none"/>`; };
// AURA: soft glow disc behind a subject
const AURA = (cx, cy, r, c) => `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${GL(c)}" stroke="none"/>`;
// T: text glyph (kanji, numbers) centred at x,y
const T = (x, y, s, txt, c, o) => `<text x="${x}" y="${y}" font-size="${s}" font-weight="${(o && o.wt) || 900}" font-family="${(o && o.font) || 'system-ui, sans-serif'}" text-anchor="middle" dominant-baseline="central" fill="${c}"${o && o.stroke ? ` stroke="${o.stroke}" stroke-width="${o.sw || 1}" paint-order="stroke"` : ' stroke="none"'}>${txt}</text>`;

// --- path builders
const circ = (cx, cy, r) => `M${cx - r} ${cy}a${r} ${r} 0 1 0 ${r * 2} 0a${r} ${r} 0 1 0 ${-r * 2} 0Z`;
const ell = (cx, cy, rx, ry) => `M${cx - rx} ${cy}a${rx} ${ry} 0 1 0 ${rx * 2} 0a${rx} ${ry} 0 1 0 ${-rx * 2} 0Z`;
const rect = (x, y, w, h, r) => (r ? `M${x + r} ${y}h${w - 2 * r}a${r} ${r} 0 0 1 ${r} ${r}v${h - 2 * r}a${r} ${r} 0 0 1 ${-r} ${r}h${-(w - 2 * r)}a${r} ${r} 0 0 1 ${-r} ${-r}v${-(h - 2 * r)}a${r} ${r} 0 0 1 ${r} ${-r}Z` : `M${x} ${y}h${w}v${h}h${-w}Z`);
const poly = (...pts) => 'M' + pts.map((p) => p.join(' ')).join('L') + 'Z';
// star with n points
function star(cx, cy, r1, r2, n, rot) {
  n = n || 5; rot = rot == null ? -Math.PI / 2 : rot;
  const p = [];
  for (let i = 0; i < n * 2; i++) { const r = i % 2 ? r2 : r1, a = rot + (i * Math.PI) / n; p.push([+(cx + Math.cos(a) * r).toFixed(1), +(cy + Math.sin(a) * r).toFixed(1)]); }
  return poly(...p);
}
// rotate a whole group of markup around (cx,cy)
const ROT = (deg, cx, cy, inner) => `<g transform="rotate(${deg} ${cx} ${cy})">${inner}</g>`;
// move / scale a group
const TR = (tf, inner) => `<g transform="${tf}">${inner}</g>`;

return { S, F, L, H, SP, AURA, T, G, GL, lt, dk, mix, circ, ell, rect, poly, star, ROT, TR };
})();

// Symbol markup for the sprite (called from ui.js installSprite)
function artSymbols() {
  return Object.entries(ART).map(([id, m]) => `<symbol id="ia-${id}" viewBox="0 0 64 64">${m}</symbol>`).join('');
}
const artDefs = () => Object.values(ART_DEFS).join('');
// The art id for an item: its own, or its base item's (quality variants)
function artId(id) {
  if (ART[id]) return id;
  const it = typeof ITEMS !== 'undefined' && ITEMS[id];
  if (it && it.base && ART[it.base]) return it.base;
  if (it && it.type === 'schematic' && ART[it.teaches]) return it.teaches;
  return null;
}
