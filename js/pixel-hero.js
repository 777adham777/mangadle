'use strict';
/* ==========================================================================
   Pixel hero (TEST, 2026-11-24): your fighter in the arena drawn in pixels, like the painted foes.
   Concept 3 "pixel fin": ~80 rows for the figure, ink kept, a one-block outline, a highlight on lit edges.

   How: avatar.js keeps animating its SVG as always (hidden underneath). About 15 times a second this
   file rasterises that SVG at 4 samples per block, turns each block into one pixel (pxBlocks) and shows
   the result on a canvas over it (image-rendering: pixelated). Everything that moves the SVG (dodges,
   hit flashes) is copied onto the canvas.

   Reversible: Settings → Display → "Hero art" (Pixel / Vector). To remove the test from the code,
   delete this file, its <script> in index.html, its line in sw.js and the .pxhero rules in css/ux.css.
   Loaded after ux3.js (adds a row to UXSET).
   ========================================================================== */

UXSET.hero = { label: 'Hero art', help: 'Test: your fighter drawn in pixels like the foes (battlefield).', opts: [['pixel', 'Pixel'], ['vector', 'Vector']], def: 'pixel' };

// The area drawn, in the avatar's own units (its viewBox is 22 18 156 218; weapons and fx go past it).
const PX_BOX = { x: -14, y: -6, w: 228, h: 246 };
const PX_B = 2.4;   // one pixel = 2.4 avatar units: ~80 rows for a standing figure
const PX_SS = 4;    // samples per block side
const PX_COLS = Math.ceil(PX_BOX.w / PX_B), PX_ROWS = Math.ceil(PX_BOX.h / PX_B);

/* ---------------------------------------------------------------- the filter (port of scratch/charpix/pix.py) */
function pxInk() {
  const m = /^#?([0-9a-f]{6})$/i.exec(typeof LINE === 'string' ? LINE : '') || [0, '0a0c11'];
  const n = parseInt(m[1], 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}
// d: RGBA samples (cols*SS x rows*SS). Returns RGBA pixels (cols x rows).
function pxBlocks(d, cols, rows, ss) {
  const W = cols * ss, N = cols * rows, INK = pxInk();
  const rgb = new Float32Array(N * 3), alpha = new Uint8Array(N), inner = new Uint8Array(N), semi = new Float32Array(N * 4);
  const hasBody = new Uint8Array(N), bodyRGB = new Float32Array(N * 3);
  const cnt = new Map();
  for (let j = 0; j < rows; j++) for (let i = 0; i < cols; i++) {
    const b = j * cols + i;
    let op = 0, ink = 0, sa = 0, sr = 0, sg = 0, sb = 0, sn = 0;
    cnt.clear();
    for (let y = 0; y < ss; y++) for (let x = 0; x < ss; x++) {
      const p = ((j * ss + y) * W + i * ss + x) * 4, a = d[p + 3];
      if (a > 128) {
        op++;
        const r = d[p], g = d[p + 1], bl = d[p + 2];
        if (Math.abs(r - INK[0]) + Math.abs(g - INK[1]) + Math.abs(bl - INK[2]) < 36) ink++;
        else {
          // the block's most common colour (not the mean): flat cel tones stay crisp
          const k = ((r / 12) | 0) * 10000 + ((g / 12) | 0) * 100 + ((bl / 12) | 0);
          const c = cnt.get(k);
          if (c) { c[0]++; c[1] += r; c[2] += g; c[3] += bl; } else cnt.set(k, [1, r, g, bl]);
        }
      } else if (a > 24) { sa += a; sr += d[p]; sg += d[p + 1]; sb += d[p + 2]; sn++; }
    }
    const n = ss * ss, cov = op / n;
    let best = null;
    for (const c of cnt.values()) if (!best || c[0] > best[0]) best = c;
    if (best) { hasBody[b] = 1; bodyRGB[b * 3] = best[1] / best[0]; bodyRGB[b * 3 + 1] = best[2] / best[0]; bodyRGB[b * 3 + 2] = best[3] / best[0]; }
    if (cov > 0.42) {
      alpha[b] = 1;
      const useBody = best && (op - ink) >= Math.max(2, 0.15 * op);
      if (useBody) { rgb[b * 3] = bodyRGB[b * 3]; rgb[b * 3 + 1] = bodyRGB[b * 3 + 1]; rgb[b * 3 + 2] = bodyRGB[b * 3 + 2]; }
      else { rgb[b * 3] = INK[0]; rgb[b * 3 + 1] = INK[1]; rgb[b * 3 + 2] = INK[2]; }
      if ((ink / n) > 0.34) inner[b] = 1;
    } else if (sn + op >= n * 0.5) {
      // see-through things (the ground shadow, auras): kept as soft pixels
      const m2 = sn || 1;
      semi[b * 4] = sr / m2; semi[b * 4 + 1] = sg / m2; semi[b * 4 + 2] = sb / m2; semi[b * 4 + 3] = Math.min(200, Math.round((sa / m2) / 48) * 48);
    }
  }
  const at = (A, i, j) => (i < 0 || j < 0 || i >= cols || j >= rows ? 0 : A[j * cols + i]);
  const edgeOf = (b, i, j) => alpha[b] && !(at(alpha, i, j - 1) && at(alpha, i, j + 1) && at(alpha, i - 1, j) && at(alpha, i + 1, j));
  // peel: an outer ink block backed by another ink block is one layer too many
  for (let it = 0; it < 2; it++) {
    const peel = [];
    for (let j = 0; j < rows; j++) for (let i = 0; i < cols; i++) {
      const b = j * cols + i;
      if (!inner[b] || !edgeOf(b, i, j)) continue;
      if (at(inner, i, j - 1) || at(inner, i, j + 1) || at(inner, i - 1, j) || at(inner, i + 1, j)) peel.push(b);
    }
    for (const b of peel) { alpha[b] = 0; inner[b] = 0; }
  }
  // exactly one block of outline: the silhouette's own edge
  const isInk = new Uint8Array(N), edge = new Uint8Array(N);
  for (let j = 0; j < rows; j++) for (let i = 0; i < cols; i++) { const b = j * cols + i; if (edgeOf(b, i, j)) edge[b] = 1; }
  for (let b = 0; b < N; b++) if (inner[b] || edge[b]) isInk[b] = 1;
  for (let j = 0; j < rows; j++) for (let i = 0; i < cols; i++) {
    const b = j * cols + i;
    // ink inside that is two blocks thick gets its colour back
    if (inner[b] && !edge[b] && at(isInk, i, j + 1) && at(isInk, i + 1, j) && at(isInk, i, j - 1) && hasBody[b]) {
      isInk[b] = 0; rgb[b * 3] = bodyRGB[b * 3]; rgb[b * 3 + 1] = bodyRGB[b * 3 + 1]; rgb[b * 3 + 2] = bodyRGB[b * 3 + 2];
    }
  }
  const out = new Uint8ClampedArray(N * 4);
  for (let j = 0; j < rows; j++) for (let i = 0; i < cols; i++) {
    const b = j * cols + i, o = b * 4;
    if (!alpha[b]) { out[o] = semi[b * 4]; out[o + 1] = semi[b * 4 + 1]; out[o + 2] = semi[b * 4 + 2]; out[o + 3] = semi[b * 4 + 3]; continue; }
    if (isInk[b]) { out[o] = INK[0]; out[o + 1] = INK[1]; out[o + 2] = INK[2]; out[o + 3] = 255; continue; }
    let r = rgb[b * 3], g = rgb[b * 3 + 1], bl = rgb[b * 3 + 2];
    // punchier, like the foes: saturation x1.3, contrast x1.08
    const L = 0.3 * r + 0.59 * g + 0.11 * bl;
    r = (L + (r - L) * 1.3 - 128) * 1.08 + 128; g = (L + (g - L) * 1.3 - 128) * 1.08 + 128; bl = (L + (bl - L) * 1.3 - 128) * 1.08 + 128;
    // light from the top left: a block under and right of the outline is lit
    const up = !at(alpha, i, j - 1) || at(isInk, i, j - 1), left = !at(alpha, i - 1, j) || at(isInk, i - 1, j) || at(isInk, i - 1, j - 1);
    if (j > 0 && i > 0 && up && left) { r = r * 1.18 + 26; g = g * 1.18 + 26; bl = bl * 1.18 + 26; }
    out[o] = r; out[o + 1] = g; out[o + 2] = bl; out[o + 3] = 255;
  }
  return out;
}

/* ---------------------------------------------------------------- pictures inside the SVG */
// An SVG drawn as an image cannot load anything: haircut pictures are inlined as data URLs first.
const PX_DATA = new Map();
function pxInline(html) {
  let pending = false;
  const s = html.replace(/href="([^"#][^"]*)"/g, (m, u) => {
    if (/^data:/.test(u)) return m;
    const v = PX_DATA.get(u);
    if (typeof v === 'string') return `href="${v}"`;
    if (v === undefined) {
      PX_DATA.set(u, null);
      fetch(u).then((r) => r.blob()).then((b) => new Promise((ok) => { const f = new FileReader(); f.onload = () => ok(f.result); f.readAsDataURL(b); }))
        .then((d) => PX_DATA.set(u, d)).catch(() => PX_DATA.set(u, ''));
    }
    pending = true;
    return m;
  });
  return pending ? null : s;
}

/* ---------------------------------------------------------------- the loop */
const pxOn = () => uxSet('hero') === 'pixel';
const PX_W = PX_COLS * PX_SS, PX_H = PX_ROWS * PX_SS;
let pxBusy = false, pxLast = 0, pxSrc = null, pxCtx = null;
function pxCanvasFor(svg) {
  let c = svg.nextElementSibling;
  if (!c || !c.classList.contains('pxhero')) {
    c = document.createElement('canvas');
    c.className = 'pxhero'; c.width = PX_COLS; c.height = PX_ROWS;
    c.setAttribute('aria-hidden', 'true');
    svg.after(c);
  }
  return c;
}
function pxPlace(svg, c) {
  // where the avatar's units land inside its box (viewBox 22 18 156 218, centred, "meet")
  const W = svg.clientWidth, H = svg.clientHeight;
  if (!W || !H) return;
  const s = Math.min(W / 156, H / 218), ox = (W - 156 * s) / 2 - 22 * s, oy = (H - 218 * s) / 2 - 18 * s;
  const key = `${W}x${H}`;
  if (c.dataset.k !== key) {
    c.dataset.k = key;
    Object.assign(c.style, { left: `${ox + PX_BOX.x * s}px`, top: `${oy + PX_BOX.y * s}px`, width: `${PX_COLS * PX_B * s}px`, height: `${PX_ROWS * PX_B * s}px` });
  }
  // whatever animates the SVG itself (dodge, fades) moves the pixels too
  const cs = getComputedStyle(svg);
  c.style.transform = cs.transform === 'none' ? '' : cs.transform;
  c.style.opacity = cs.opacity;
  c.style.filter = cs.filter === 'none' ? '' : cs.filter;
}
function pxDraw(svg, c) {
  if (pxBusy) return;
  const inner = pxInline(svg.innerHTML);
  if (inner == null) return;   // a picture is still loading: keep the last frame
  pxBusy = true;
  const src = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${PX_BOX.x} ${PX_BOX.y} ${PX_COLS * PX_B} ${PX_ROWS * PX_B}" width="${PX_W}" height="${PX_H}">${inner}</svg>`;
  const url = URL.createObjectURL(new Blob([src], { type: 'image/svg+xml' }));
  const img = new Image();
  img.onload = () => {
    try {
      if (!pxSrc) { pxSrc = document.createElement('canvas'); pxSrc.width = PX_W; pxSrc.height = PX_H; pxCtx = pxSrc.getContext('2d', { willReadFrequently: true }); }
      pxCtx.clearRect(0, 0, PX_W, PX_H);
      pxCtx.drawImage(img, 0, 0, PX_W, PX_H);
      const px = pxBlocks(pxCtx.getImageData(0, 0, PX_W, PX_H).data, PX_COLS, PX_ROWS, PX_SS);
      if (c.isConnected) c.getContext('2d').putImageData(new ImageData(px, PX_COLS, PX_ROWS), 0, 0);
      c.classList.add('ready');
    } finally { URL.revokeObjectURL(url); pxBusy = false; }
  };
  img.onerror = () => { URL.revokeObjectURL(url); pxBusy = false; };
  img.src = url;
}
function pxFrame(now) {
  requestAnimationFrame(pxFrame);
  const svg = document.querySelector('.ar-floor [data-portrait="player"] svg.avatar');
  if (!pxOn()) {
    for (const c of document.querySelectorAll('canvas.pxhero')) c.remove();
    for (const s of document.querySelectorAll('svg.avatar.px-hidden')) s.classList.remove('px-hidden');
    return;
  }
  if (!svg) return;
  const c = pxCanvasFor(svg);
  // the vector figure stays until the first pixel frame is ready
  if (c.classList.contains('ready')) svg.classList.add('px-hidden');
  pxPlace(svg, c);
  if (now - pxLast < 66 || document.hidden) return;   // ~15 frames a second, like a sprite
  pxLast = now;
  pxDraw(svg, c);
}
requestAnimationFrame(pxFrame);
