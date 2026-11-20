'use strict';
/* ==========================================================================
   TRI-REALM — the 36 manga haircuts (pictures), fitted to a head at run time
   The user's clean cut-outs (one transparent PNG per cut, assets/hair/) were
   placed once on the skull: each was registered (scale + offset) on the same
   cut in the user's reference sheet, where the head is known. A box in skull
   units (centre 0,0, radius 19; x, y = top-left corner) is all a cut stores.

   A picture drawn for one face does not sit right on every head, so it is not
   drawn as it is: HAIR_FIT morphs it for the head that wears it (a "spec":
   where that head's face is turned, where its eyes are), once, in a canvas,
   and hands back the result as an image URL:
     1. turn   the face opening is slid to the head's face (the sheet's faces
               are turned 3/4 right; the game's avatar turns less), the skull's
               edges stay put;
     2. lift   a fringe that would fall over an eye is lifted above it (the
               forehead's hair is compressed, the silhouette stays);
     3. cover  where the hair stops just short of the skull's rim (a sliver of
               bald outline), it is pulled down onto the skull;
     4. eyes   whatever still lies on an eye is cleared, so every expression
               shows; unless the cut hides that eye on purpose (covers 'N'/'F').
   Until a morph is ready (or where the browser refuses to read the picture,
   e.g. pages opened from file://), the plain picture is used.
   Shared by the game's avatar (js/avatar.js) and the rig (js/rig-hair-assets.js).
   ========================================================================== */
const HAIR_CUT_BASE = (typeof RIG_ASSET_ROOT !== 'undefined' ? RIG_ASSET_ROOT : '') + 'assets/hair/';
const HAIR_CUT_WORLDS = { seas: 'Orange Town', shinobi: 'Leaf Village', soul: 'Soul City', hex: 'Shinjuku', hunter: 'Green Island', echo: 'Echo Quarter' };
// reach: farthest visible hair from the skull centre · ear: false when the cut covers the ear
// iou: overlap with the sheet's cut after registration (above the chin)
const HAIR_CUTS = {
  rubber: { name: "Rubber Mop", world: 'seas', sheet: '0,0', x: -43.48, y: -40.42, w: 74.0, h: 59.54, reach: 45.5, ear: true, iou: 0.808 },
  swordsman: { name: "Swordsman Crop", world: 'seas', sheet: '0,1', x: -38.15, y: -41.88, w: 66.58, h: 55.43, reach: 44.3, ear: true, iou: 0.889 },
  cook: { name: "Cook's Curtain", world: 'seas', sheet: '0,2', x: -44.88, y: -37.94, w: 70.99, h: 55.02, reach: 45.1, ear: true, covers: 'F', iou: 0.896 },
  surgeon: { name: "Surgeon Waves", world: 'seas', sheet: '0,3', x: -42.94, y: -39.87, w: 74.96, h: 55.48, reach: 45.4, ear: true, iou: 0.863 },
  emperor: { name: "Red Emperor", world: 'seas', sheet: '0,4', x: -42.67, y: -38.89, w: 74.38, h: 55.78, reach: 42.8, ear: true, iou: 0.883 },
  sungod: { name: "Sun God Curls", world: 'seas', sheet: '0,5', x: -40.73, y: -40.53, w: 73.12, h: 56.49, reach: 44.1, ear: true, iou: 0.872 },
  leafsun: { name: "Leaf Spikes", world: 'shinobi', sheet: '1,0', x: -41.24, y: -44.58, w: 72.31, h: 57.42, reach: 47.4, ear: true, iou: 0.884 },
  avenger: { name: "Avenger Crest", world: 'shinobi', sheet: '1,1', x: -47.87, y: -43.94, w: 74.82, h: 69.57, reach: 55.6, ear: true, iou: 0.894 },
  copycat: { name: "Copy Ninja Lean", world: 'shinobi', sheet: '1,2', x: -40.51, y: -43.99, w: 72.84, h: 59.1, reach: 47.0, ear: true, iou: 0.841 },
  sand: { name: "Sand Spikes", world: 'shinobi', sheet: '1,3', x: -42.88, y: -43.11, w: 75.02, h: 58.79, reach: 47.4, ear: true, iou: 0.903 },
  prodigy: { name: "Clan Prodigy", world: 'shinobi', sheet: '1,4', x: -35.81, y: -36.89, w: 63.16, h: 58.41, reach: 38.9, ear: false, iou: 0.944 },
  flash: { name: "Yellow Flash", world: 'shinobi', sheet: '1,5', x: -41.32, y: -43.19, w: 75.38, h: 66.09, reach: 47.8, ear: true, iou: 0.864 },
  substitute: { name: "Substitute Spikes", world: 'soul', sheet: '2,0', x: -40.34, y: -39.45, w: 69.82, h: 55.93, reach: 44.1, ear: true, iou: 0.902 },
  frost: { name: "Snow Princess", world: 'soul', sheet: '2,1', x: -40.29, y: -36.18, w: 68.88, h: 62.21, reach: 42.2, ear: false, iou: 0.903 },
  pineapple: { name: "Red Pineapple", world: 'soul', sheet: '2,2', x: -56.9, y: -45.7, w: 81.24, h: 66.05, reach: 58.8, ear: true, iou: 0.857 },
  noble: { name: "Noble Pins", world: 'soul', sheet: '2,3', x: -46.18, y: -37.1, w: 75.68, h: 67.47, reach: 49.3, ear: true, iou: 0.877 },
  panther: { name: "Panther Swept", world: 'soul', sheet: '2,4', x: -42.26, y: -41.92, w: 70.67, h: 57.09, reach: 46.3, ear: true, iou: 0.852 },
  traitor: { name: "Captain's Waves", world: 'soul', sheet: '2,5', x: -38.68, y: -37.4, w: 64.77, h: 54.91, reach: 43.5, ear: true, iou: 0.829 },
  sixeyes: { name: "Six Eyes Spikes", world: 'hex', sheet: '3,0', x: -45.87, y: -43.93, w: 77.62, h: 57.27, reach: 51.3, ear: true, iou: 0.873 },
  vessel: { name: "Vessel Undercut", world: 'hex', sheet: '3,1', x: -39.25, y: -37.4, w: 69.87, h: 50.01, reach: 42.8, ear: true, iou: 0.85 },
  shadows: { name: "Shadow Spikes", world: 'hex', sheet: '3,2', x: -44.43, y: -39.2, w: 76.78, h: 54.84, reach: 47.4, ear: true, iou: 0.82 },
  hammer: { name: "Hammer Bob", world: 'hex', sheet: '3,3', x: -40.96, y: -39.28, w: 67.44, h: 58.02, reach: 42.2, ear: false, iou: 0.95 },
  cursebun: { name: "Curse Bun", world: 'hex', sheet: '3,4', x: -44.8, y: -37.56, w: 68.65, h: 53.24, reach: 51.2, ear: true, iou: 0.833 },
  curseking: { name: "King of Curses", world: 'hex', sheet: '3,5', x: -41.42, y: -40.66, w: 72.1, h: 54.69, reach: 45.3, ear: true, iou: 0.878 },
  wildspike: { name: "Wild Spikes", world: 'hunter', sheet: '4,0', x: -44.18, y: -43.73, w: 69.07, h: 57.43, reach: 51.1, ear: true, iou: 0.824 },
  assassin: { name: "Assassin Fluff", world: 'hunter', sheet: '4,1', x: -45.29, y: -41.93, w: 76.9, h: 56.06, reach: 48.4, ear: true, iou: 0.843 },
  clansman: { name: "Last Clansman", world: 'hunter', sheet: '4,2', x: -39.66, y: -39.92, w: 69.24, h: 56.79, reach: 42.7, ear: false, iou: 0.927 },
  magician: { name: "Magician Slick", world: 'hunter', sheet: '4,3', x: -46.66, y: -38.98, w: 71.51, h: 49.68, reach: 58.1, ear: true, iou: 0.888 },
  doctor: { name: "Doctor Spikes", world: 'hunter', sheet: '4,4', x: -36.95, y: -37.13, w: 60.26, h: 49.77, reach: 45.5, ear: true, iou: 0.824 },
  needle: { name: "Needle Curtain", world: 'hunter', sheet: '4,5', x: -36.37, y: -35.15, w: 62.65, h: 54.17, reach: 40.1, ear: true, iou: 0.933 },
  starmop: { name: "Star Mop", world: 'echo', sheet: '5,0', x: -42.59, y: -35.97, w: 72.05, h: 51.52, reach: 45.6, ear: true, iou: 0.831 },
  pompadour: { name: "Pompadour", world: 'echo', sheet: '5,1', x: -38.32, y: -34.61, w: 73.42, h: 45.57, reach: 43.0, ear: true, iou: 0.912 },
  goldrolls: { name: "Golden Rolls", world: 'echo', sheet: '5,2', x: -41.04, y: -36.66, w: 71.81, h: 47.38, reach: 43.1, ear: true, iou: 0.85 },
  vampire: { name: "Vampire Crown", world: 'echo', sheet: '5,3', x: -42.79, y: -36.76, w: 73.32, h: 48.17, reach: 48.0, ear: true, iou: 0.814 },
  cherry: { name: "Cherry Waves", world: 'echo', sheet: '5,4', x: -41.02, y: -37.88, w: 72.84, h: 52.24, reach: 44.8, ear: true, iou: 0.848 },
  sidegold: { name: "Side-swept Gold", world: 'echo', sheet: '5,5', x: -38.25, y: -35.88, w: 63.89, h: 46.81, reach: 40.6, ear: true, iou: 0.877 },
};

const HAIR_FIT = (() => {
  const K = 5, PAD = 3;          // morph resolution (px per skull unit) and room around the box
  const R = 19, MID0 = 6.4;      // the skull, and the face midline the pictures were drawn for
  // Heads that wear the cuts. eyes: [x, y, rx, ry] in the hair's frame; mid: the face midline.
  const SPECS = {
    rig: { mid: 6.4, eyes: [[-0.5, -0.4, 2.05, 3.35], [13.3, -0.4, 1.8, 3.2]] },
  };
  // The game's avatar (js/avatar.js): the face is slid by -3.7·(1-tw) and the hair by +2.2·tw
  // (scaled 1+0.07·tw) as the head turns, tw from 0 (facing us) to 1 (3/4 right).
  for (const tw of [0, 0.5, 1]) {
    const k = 1 + 0.07 * tw, X = (x) => (x - 3.7 * (1 - tw) - 2.2 * tw) / k;
    SPECS['av' + tw] = { mid: (X(-2) + X(9.5)) / 2, eyes: [[X(-2), 2, 2.1 / k, 3.1], [X(9.5), 2, 1.8 / k, 2.9]] };
  }
  const cache = {}, jobs = [], imgs = {}, seen = {};
  let busy = false, failed = false;
  const listeners = [];
  const raw = (id) => { const A = HAIR_CUTS[id]; return { href: HAIR_CUT_BASE + id + '.png', x: A.x, y: A.y, w: A.w, h: A.h, fitted: false }; };

  function image(id) {
    if (!imgs[id]) imgs[id] = new Promise((ok, no) => { const im = new Image(); im.onload = () => ok(im); im.onerror = () => no(new Error('missing ' + id)); im.src = HAIR_CUT_BASE + id + '.png'; });
    return imgs[id];
  }
  // Bilinear read of premultiplied RGBA at (x, y) in pixels.
  function sampler(P, w, h) {
    return (x, y, out) => {
      x -= 0.5; y -= 0.5;
      const x0 = Math.floor(x), y0 = Math.floor(y), fx = x - x0, fy = y - y0;
      out[0] = out[1] = out[2] = out[3] = 0;
      for (let j = 0; j < 2; j++) for (let i = 0; i < 2; i++) {
        const xi = x0 + i, yj = y0 + j;
        if (xi < 0 || yj < 0 || xi >= w || yj >= h) continue;
        const wt = (i ? fx : 1 - fx) * (j ? fy : 1 - fy), o = (yj * w + xi) * 4;
        out[0] += P[o] * wt; out[1] += P[o + 1] * wt; out[2] += P[o + 2] * wt; out[3] += P[o + 3] * wt;
      }
    };
  }
  // One warp pass: dest pixel (in skull units) -> where to read in the previous picture (skull units).
  function warp(P, w, h, box, from) {
    const Q = new Float32Array(P.length), S = sampler(P, w, h), c = [0, 0, 0, 0];
    for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) {
      const u = box.x + (i + 0.5) / K, v = box.y + (j + 0.5) / K, s = from(u, v);
      if (!s) { const o = (j * w + i) * 4; Q[o] = P[o]; Q[o + 1] = P[o + 1]; Q[o + 2] = P[o + 2]; Q[o + 3] = P[o + 3]; continue; }
      S((s[0] - box.x) * K, (s[1] - box.y) * K, c);
      const o = (j * w + i) * 4;
      Q[o] = c[0]; Q[o + 1] = c[1]; Q[o + 2] = c[2]; Q[o + 3] = c[3];
    }
    return Q;
  }
  const alphaAt = (P, w, h, box) => (u, v) => {
    const i = Math.floor((u - box.x) * K), j = Math.floor((v - box.y) * K);
    return i < 0 || j < 0 || i >= w || j >= h ? 0 : P[(j * w + i) * 4 + 3] / 255;
  };
  const inEye = (E, u, v, m) => ((u - E[0]) / (E[2] + m)) ** 2 + ((v - E[1]) / (E[3] + m)) ** 2 < 1;
  const smooth = (L, s, wrap) => L.map((_, i) => {
    let a = 0, n = 0;
    for (let k = -3 * s; k <= 3 * s; k++) {
      let j = i + k;
      if (wrap) j = (j + L.length) % L.length; else if (j < 0 || j >= L.length) continue;
      const g = Math.exp(-(k * k) / (2 * s * s)); a += L[j] * g; n += g;
    }
    return a / n;
  });

  // The morph itself (pure: premultiplied pixels in, pixels out). Returns { P, w, h, box }.
  function morph(P0, w0, h0, A, spec) {
    const box = { x: A.x - PAD, y: A.y - PAD, w: A.w + 2 * PAD, h: A.h + 2 * PAD };
    const w = Math.round(box.w * K), h = Math.round(box.h * K);
    // the picture, placed in the padded box
    let P = new Float32Array(w * h * 4);
    { const S = sampler(P0, w0, h0), c = [0, 0, 0, 0], sx = w0 / A.w, sy = h0 / A.h;
      for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) {
        const u = box.x + (i + 0.5) / K - A.x, v = box.y + (j + 0.5) / K - A.y;
        if (u < -1 || v < -1 || u > A.w + 1 || v > A.h + 1) continue;
        S(u * sx, v * sy, c); const o = (j * w + i) * 4; P[o] = c[0]; P[o + 1] = c[1]; P[o + 2] = c[2]; P[o + 3] = c[3];
      } }
    const covers = A.covers || '';
    // 1. turn: slide the face midline from MID0 to the head's, inside a sphere a little larger than the skull
    if (Math.abs(spec.mid - MID0) > 0.05) {
      const m0 = MID0, m1 = spec.mid, RS = 25;
      P = warp(P, w, h, box, (u, v) => {
        const r = Math.sqrt(Math.max(0, RS * RS - v * v));
        if (r < 1 || Math.abs(u) >= r) return null;
        return [u <= m1 ? -r + ((u + r) * (m0 + r)) / (m1 + r) : m0 + ((u - m1) * (r - m0)) / (r - m1), v];
      });
    }
    const eyes = spec.eyes.filter((_, i) => !covers.includes('NF'[i]));
    // 2. lift: per column over an eye, how far the fringe's lower edge reaches into the eye; a lock
    //    that goes on below the eye is not a fringe (it is cleared in step 4 instead)
    {
      const a = alphaAt(P, w, h, box), cols = Math.ceil(box.w * 2), L = new Array(cols).fill(0);
      for (let c = 0; c < cols; c++) {
        const u = box.x + (c + 0.5) / 2;
        for (const E of eyes) {
          const m = 0.7, dx = (u - E[0]) / (E[2] + m);
          if (Math.abs(dx) >= 1) continue;
          const half = (E[3] + m) * Math.sqrt(1 - dx * dx), top = E[1] - half, bot = E[1] + half;
          let low = null;
          for (let v = top; v <= bot; v += 0.25) if (a(u, v) > 0.5) low = v;
          if (low == null) continue;
          if (a(u, bot + 1.2) > 0.5 || a(u, bot + 2.4) > 0.5) continue;
          L[c] = Math.max(L[c], Math.min(7, low - top + 0.6));
        }
      }
      const Ls = smooth(L, 3, false).map((x, i) => Math.max(x, L[i] * 0.85));
      if (Ls.some((x) => x > 0.05)) {
        const yTop = -26, yRef = Math.min(...eyes.map((E) => E[1] - E[3])) - 0.7;
        P = warp(P, w, h, box, (u, v) => {
          const c = Math.floor((u - box.x) * 2), d = c >= 0 && c < cols ? Ls[c] : 0;
          if (d < 0.02 || v < yTop) return null;
          const k = Math.min(1, (v - yTop) / (yRef - yTop));
          return [u, v + d * k];
        });
      }
    }
    // 3. cover: around the scalp (from the far temple over the top to the near sideburn), hair that
    //    stops just outside the skull's rim is pulled onto it; a gap wider than 5 is the cut's design
    {
      const a = alphaAt(P, w, h, box), n = 360, D = new Array(n).fill(0);
      for (let k = 0; k < n; k++) {
        const t = (k * Math.PI * 2) / n;
        if (k < 168 || k > 350) continue;            // degrees, y down: 180 = near side, 270 = top
        const cs = Math.cos(t), sn = Math.sin(t);
        let on = false;
        for (let r = R - 0.6; r <= R + 0.6; r += 0.3) if (a(r * cs, r * sn) > 0.5) on = true;
        if (on) continue;
        let rin = null;
        for (let r = R + 0.6; r <= R + 5; r += 0.25) if (a(r * cs, r * sn) > 0.5) { rin = r; break; }
        if (rin != null) D[k] = rin - (R - 0.9);
      }
      const Ds = smooth(D, 4, true).map((x, i) => Math.max(x, D[i]));
      if (Ds.some((x) => x > 0.05)) {
        P = warp(P, w, h, box, (u, v) => {
          const r = Math.hypot(u, v);
          if (r < 9 || r > R + 14) return null;
          let k = Math.round(((Math.atan2(v, u) + Math.PI * 2) % (Math.PI * 2)) / (Math.PI * 2) * n) % n;
          const d = Ds[k];
          if (d < 0.02) return null;
          const f = r < 13 ? (r - 9) / 4 : r <= R ? 1 : Math.max(0, 1 - (r - R) / 12);
          const s = (r + d * f) / r;
          return [u * s, v * s];
        });
      }
    }
    // 4. eyes: clear what is left on them (soft edge)
    for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) {
      const u = box.x + (i + 0.5) / K, v = box.y + (j + 0.5) / K;
      for (const E of eyes) {
        const q = ((u - E[0]) / (E[2] + 0.6)) ** 2 + ((v - E[1]) / (E[3] + 0.6)) ** 2;
        if (q < 1.25) {
          const keep = q < 1 ? 0 : (q - 1) / 0.25, o = (j * w + i) * 4;
          P[o] *= keep; P[o + 1] *= keep; P[o + 2] *= keep; P[o + 3] *= keep;
        }
      }
    }
    return { P, w, h, box };
  }
  // What the fitted cut covers on that head (checked by the Rig Lab).
  function measure(F, spec) {
    const a = alphaAt(F.P, F.w, F.h, F.box), cov = (test, step) => {
      let n = 0, c = 0;
      for (let v = -R; v <= R; v += step) for (let u = -R; u <= R; u += step) if (test(u, v)) { n++; if (a(u, v) > 0.5) c++; }
      return n ? c / n : 0;
    };
    const eyes = spec.eyes.map((E) => cov((u, v) => inEye(E, u, v, 0), 0.25));
    // the scalp: inside the skull, above the canonical hairline (a middle part may open it a little)
    const HL = [[-16.6, -2.8], [-13.6, -8.4], [-8.2, -11.8], [-1.8, -13.6], [4.6, -14.2], [10, -13.6], [14.2, -11], [16.8, -7.4], [18, -3.6]];
    const line = (u) => { for (let i = 1; i < HL.length; i++) if (u <= HL[i][0]) { const [a0, b0] = HL[i - 1], [a1, b1] = HL[i], f = (u - a0) / (a1 - a0); return b0 + (b1 - b0) * Math.max(0, Math.min(1, f)); } return HL[HL.length - 1][1]; };
    const top = cov((u, v) => u * u + v * v < (R - 1) ** 2 && u > -16.6 && u < 18 && v < line(u + MID0 - spec.mid) - 1.5, 0.5);
    let rn = 0, rc = 0;
    for (let k = 200; k <= 340; k += 2) { const t = (k * Math.PI) / 180; rn++; if (a(R * Math.cos(t), R * Math.sin(t)) > 0.5) rc++; }
    const face = cov((u, v) => ((u - spec.mid) / 10) ** 2 + ((v - 5) / 8) ** 2 < 1 && u * u + v * v < R * R, 0.5);
    return { eyes, top, rim: rc / rn, face };
  }
  function toURL(F) {
    const cv = document.createElement('canvas');
    cv.width = F.w; cv.height = F.h;
    const g = cv.getContext('2d'), D = g.createImageData(F.w, F.h);
    for (let i = 0; i < F.P.length; i += 4) {
      const al = F.P[i + 3];
      D.data[i + 3] = Math.round(al);
      if (al > 0.5) { D.data[i] = Math.round((F.P[i] * 255) / al); D.data[i + 1] = Math.round((F.P[i + 1] * 255) / al); D.data[i + 2] = Math.round((F.P[i + 2] * 255) / al); }
    }
    g.putImageData(D, 0, 0);
    // (toDataURL is quick where toBlob may wait a second; a blob URL keeps the SVG strings short)
    const data = cv.toDataURL('image/png');
    try {
      const bin = atob(data.slice(data.indexOf(',') + 1)), u8 = new Uint8Array(bin.length);
      for (let i = 0; i < bin.length; i++) u8[i] = bin.charCodeAt(i);
      return Promise.resolve(URL.createObjectURL(new Blob([u8], { type: 'image/png' })));
    } catch (e) { return Promise.resolve(data); }
  }
  // Pixels of a picture, premultiplied (throws where the page may not read them).
  function pixels(im) {
    const cv = document.createElement('canvas');
    cv.width = im.naturalWidth; cv.height = im.naturalHeight;
    const g = cv.getContext('2d');
    g.drawImage(im, 0, 0);
    const d = g.getImageData(0, 0, cv.width, cv.height).data, P = new Float32Array(d.length);
    for (let i = 0; i < d.length; i += 4) { const a = d[i + 3] / 255; P[i] = d[i] * a; P[i + 1] = d[i + 1] * a; P[i + 2] = d[i + 2] * a; P[i + 3] = d[i + 3]; }
    return { P, w: cv.width, h: cv.height };
  }
  async function build(id, key) {
    const im = await image(id), px = pixels(im), F = morph(px.P, px.w, px.h, HAIR_CUTS[id], SPECS[key]);
    const href = await toURL(F);
    return { href, x: F.box.x, y: F.box.y, w: F.box.w, h: F.box.h, fitted: true, measure: measure(F, SPECS[key]) };
  }
  function pump() {
    if (busy || !jobs.length) return;
    busy = true;
    const [id, key, done] = jobs.shift();
    build(id, key).then((r) => { cache[id + '|' + key] = r; done(r); listeners.forEach((f) => f(id, key)); })
      .catch((e) => { if (/security|tainted|insecure/i.test(e.message || e.name || '')) failed = true; cache[id + '|' + key] = Object.assign(raw(id), { error: e.message }); done(cache[id + '|' + key]); })
      .finally(() => { busy = false; setTimeout(pump, 0); });
  }
  // The cut fitted to a head: { href, x, y, w, h } (the plain picture until the morph is ready).
  function get(id, key) {
    if (!HAIR_CUTS[id]) return null;
    key = SPECS[key] ? key : 'rig';
    const c = cache[id + '|' + key];
    if (c) return c;
    if (!failed && typeof document !== 'undefined' && !seen[id + '|' + key]) { seen[id + '|' + key] = 1; jobs.push([id, key, () => {}]); setTimeout(pump, 0); }
    return raw(id);
  }
  // Promise of the fitted cut (and its measurements).
  function ready(id, key) {
    const c = cache[id + '|' + key];
    if (c) return Promise.resolve(c);
    return new Promise((ok) => {
      const j = jobs.find((x) => x[0] === id && x[1] === key);
      if (j) { const f = j[2]; j[2] = (r) => { f(r); ok(r); }; return; }
      if (seen[id + '|' + key]) { listeners.push((i, k) => { if (i === id && k === key) ok(cache[id + '|' + key]); }); return; }
      seen[id + '|' + key] = 1; jobs.push([id, key, ok]); setTimeout(pump, 0);
    });
  }
  // avatar spec for a head turn
  const avKey = (tw) => 'av' + (tw < 0.25 ? 0 : tw < 0.75 ? 0.5 : 1);
  return { SPECS, get, ready, morph, measure, raw, avKey, onReady: (f) => listeners.push(f), K, PAD };
})();
