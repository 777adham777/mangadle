'use strict';
/* ==========================================================================
   TRI-REALM IDLE — hair v2
   Haircuts built the way anime artists build them (see docs/STUDIO-V2.md):
   - separate layers: long hair behind the body, the nape behind the head, and
     the main layer (the cap on the skull, side locks, fringe, crown spikes, extras);
   - clumps, not lines: each one a curved ribbon (wide at the root, a belly,
     a tip that is pointed, rounded, cut straight or forked), irregular on purpose
     (2-3 dominant clumps, varied widths and lengths) so crowns never look like saws;
   - ink as a last, separate pass: ONE line of constant width around the whole
     silhouette (each clump stroked, everything inside the mass masked out), so
     no clip ever cuts a line and inner edges never show; inside, only a tapered
     brush line on the lit edge of each clump, towards its tip;
   - designed shadows: a wedge on the shaded side of every clump (painted back to
     front, so a clump in front hides them), the fringe's shadow on the forehead;
   - highlights: a few tapered crescents following the skull on the lit side;
   - colours derived from one base colour (shadows hue-shifted towards violet).
   A haircut is a recipe: { fringe, side, back, extra, vol, len, spike, seed, c, tip }.
   Head-local space: head centre 0,0, radius 19, eyes at y ≈ 2 (x ≈ ±5.7).
   Loaded after avatar.js.
   ========================================================================== */

/* ---------------------------------------------------------------- colour */
function h2HexToHsl(hex) {
  const n = parseInt(String(hex || '#000000').slice(1), 16), r = (n >> 16) / 255, g = ((n >> 8) & 255) / 255, b = (n & 255) / 255;
  const mx = Math.max(r, g, b), mn = Math.min(r, g, b), l = (mx + mn) / 2, d = mx - mn;
  if (!d) return [0, 0, l];
  const s = d / (1 - Math.abs(2 * l - 1));
  const h = mx === r ? ((g - b) / d) % 6 : mx === g ? (b - r) / d + 2 : (r - g) / d + 4;
  return [(h * 60 + 360) % 360, s, l];
}
function h2Hsl(h, s, l) {
  s = Math.max(0, Math.min(1, s)); l = Math.max(0, Math.min(1, l));
  const c = (1 - Math.abs(2 * l - 1)) * s, x = c * (1 - Math.abs(((h / 60) % 2) - 1)), m = l - c / 2;
  const [r, g, b] = h < 60 ? [c, x, 0] : h < 120 ? [x, c, 0] : h < 180 ? [0, c, x] : h < 240 ? [0, x, c] : h < 300 ? [x, 0, c] : [c, 0, x];
  return '#' + [r, g, b].map((v) => Math.round((v + m) * 255).toString(16).padStart(2, '0')).join('');
}
const h2Wrap = (a) => ((((a + 180) % 360) + 360) % 360) - 180;
// Shadows lean towards blue-violet; dark hair gets lighter highlights, light hair deeper shadows.
function hair2Palette(c) {
  const [h, s, l] = h2HexToHsl(c), toV = (k) => (h + h2Wrap(255 - h) * k + 360) % 360;
  const dark = l < 0.25;
  return {
    base: c,
    nape: h2Hsl(toV(0.06), s, dark ? l * 0.8 : l - 0.06),
    sh: h2Hsl(toV(dark ? 0.16 : 0.09), Math.min(1, s * 0.95 + 0.04), dark ? l * 0.62 : l - 0.13),
    deep: h2Hsl(toV(0.24), Math.min(1, s * 1.05 + 0.04), dark ? l * 0.45 : l - 0.3),
    hi: h2Hsl(h, s * (dark ? 0.35 : 0.8), dark ? l + 0.17 : l + (1 - l) * 0.45),
    ring: h2Hsl(toV(dark ? 0.12 : 0), s * (dark ? 0.3 : 0.6), dark ? l + 0.5 : l + (1 - l) * 0.75),
    line: h2Hsl(toV(0.15), Math.min(1, s + 0.12), Math.min(0.2, l * 0.32)),
  };
}

/* ---------------------------------------------------------------- clumps */
// A clump: root x, y · a direction (0 right, 90 down) · len · w (width at the root) · bend (degrees
// of curl along it) · tip · hang (0-1, pulled down by gravity) · sw (sway) · wave · z (draw order).
const H2_PROF = {
  point: (k) => Math.pow(1 - k, 0.85) * (1 + 0.28 * Math.sin(Math.PI * Math.min(1, k * 1.3))),
  round: (k) => Math.sqrt(Math.max(0, 1 - Math.pow(k, 5))) * (1 + 0.12 * Math.sin(Math.PI * k)) * (1 - 0.25 * k),
  blunt: (k) => 1 - 0.04 * k,
  fork: (k) => Math.pow(1 - k * 0.7, 0.9) * (1 + 0.2 * Math.sin(Math.PI * k)),
  // a flame: full body, belly at a third, then a long sharp tip (shonen spikes)
  flame: (k) => Math.pow(1 - k, 0.75) * (1 + 0.55 * Math.sin(Math.PI * Math.min(1, k * 1.25))),
};
const H2_LIGHT = [-0.6, -0.8];
// Points along a polyline, evenly spaced (n + 1 of them).
function h2Resample(Q, n) {
  const acc = [0];
  for (let i = 1; i < Q.length; i++) acc.push(acc[i - 1] + Math.hypot(Q[i][0] - Q[i - 1][0], Q[i][1] - Q[i - 1][1]));
  const L = acc[acc.length - 1] || 1, out = [];
  for (let k = 0; k <= n; k++) {
    const dd = (L * k) / n;
    let i = 1;
    while (i < acc.length - 1 && acc[i] < dd) i++;
    const f = (dd - acc[i - 1]) / (acc[i] - acc[i - 1] || 1);
    out.push([Q[i - 1][0] + (Q[i][0] - Q[i - 1][0]) * f, Q[i - 1][1] + (Q[i][1] - Q[i - 1][1]) * f]);
  }
  return out;
}
const h2PathLen = (Q) => Q.reduce((a, q, i) => a + (i ? Math.hypot(q[0] - Q[i - 1][0], q[1] - Q[i - 1][1]) : 0), 0);
function h2Spine(c, t, ha) {
  if (c.path) {
    const S = h2Resample(c.path, 8), sw = c.sw && t != null ? Math.sin(t * 2.1 + (c.ph || 0)) * c.sw : 0;
    if (!sw) return S;
    return S.map((q, i) => { const r = sw * (i / 8) * D2R, x = q[0] - S[0][0], y = q[1] - S[0][1]; return [S[0][0] + x * Math.cos(r) - y * Math.sin(r), S[0][1] + x * Math.sin(r) + y * Math.cos(r)]; });
  }
  const n = 8, step = c.len / n, down = 90 - (ha || 0), pts = [[c.x, c.y]];
  let x = c.x, y = c.y;
  for (let i = 0; i < n; i++) {
    const k = (i + 0.5) / n;
    let a = c.a - c.bend / 2 + c.bend * k;
    if (c.hang) a += h2Wrap(down - a) * c.hang * Math.pow(k, 1.2);
    if (c.wave) a += Math.sin(k * Math.PI * 2 * (c.wf || 1.5) + (c.ph || 0)) * c.wave;
    if (c.sw && t != null) a += Math.sin(t * 2.1 + (c.ph || 0)) * c.sw * k;
    x += Math.cos(a * D2R) * step; y += Math.sin(a * D2R) * step;
    pts.push([x, y]);
  }
  return pts;
}
function h2Sides(c, S) {
  const n = S.length - 1, prof = H2_PROF[c.tip] || H2_PROF.point, L = [], R = [], N = [], W = [];
  for (let i = 0; i <= n; i++) {
    const a = S[Math.max(0, i - 1)], b = S[Math.min(n, i + 1)];
    let tx = b[0] - a[0], ty = b[1] - a[1];
    const l = Math.hypot(tx, ty) || 1; tx /= l; ty /= l;
    const hw = (c.w / 2) * prof(i / n);
    N.push([-ty, tx]); W.push(hw);
    L.push([S[i][0] - ty * hw, S[i][1] + tx * hw]); R.push([S[i][0] + ty * hw, S[i][1] - tx * hw]);
  }
  return { L, R, N, W, n };
}
function h2Outline(c, S, E) {
  const { L, R, N, W, n } = E, mid = (p) => p.slice(1, n);
  const rootL = [...L[0], 1], rootR = [...R[0], 1];
  if (c.tip === 'blunt') { const y = S[n][1]; return [rootL, ...mid(L), [L[n][0], y, 1], [R[n][0], y, 1], ...mid(R).reverse(), rootR]; }
  if (c.tip === 'fork') {
    const t = S[n], nn = N[n], hw = W[n - 2] * 0.55, b = S[n - 1];
    return [rootL, ...L.slice(1, n - 1), [t[0] + nn[0] * hw, t[1] + nn[1] * hw, 1], [...S[n - 2], 1], [b[0] - N[n - 1][0] * hw * 1.1, b[1] - N[n - 1][1] * hw * 1.1, 1], ...R.slice(1, n - 1).reverse(), rootR];
  }
  if (c.tip === 'round') return [rootL, ...mid(L), S[n], ...mid(R).reverse(), rootR];
  return [rootL, ...mid(L), [...S[n], 1], ...mid(R).reverse(), rootR];
}
// The shadow wedge on the clump's shaded side, widening towards the tip.
function h2Wedge(c, S, E) {
  const { L, R, N, W, n } = E, m = Math.floor(n / 2);
  const s = N[m][0] * H2_LIGHT[0] + N[m][1] * H2_LIGHT[1] > 0 ? -1 : 1, side = s > 0 ? L : R;
  const i0 = Math.round(n * 0.3), edge = [], inner = [];
  for (let i = i0; i < n; i++) {
    const k = (i - i0) / (n - i0), f = Math.min(c.soft ? 0.35 : 0.85, 0.12 + 0.6 * k);
    edge.push(side[i]);
    inner.push([side[i][0] - s * N[i][0] * W[i] * 2 * f, side[i][1] - s * N[i][1] * W[i] * 2 * f]);
  }
  const end = c.tip === 'blunt' ? [[...side[n], 1], [...S[n], 1]] : [[...S[n], 1]];
  const back = inner.slice().reverse();
  return [[...edge[0], 1], ...edge.slice(1), ...end, ...back.slice(0, -1), [...back[back.length - 1], 1]];
}
const h2Line = (P) => 'M' + P.map(pt).join('L');

/* ---------------------------------------------------------------- the part library */
// Every part is a generator: (P) → clumps. P: { vol, L (length factor), sp (spikiness 0-1), R(i, j) → 0-1, hl(x) → hairline y }.
const h2C = (o) => Object.assign({ bend: 0, tip: 'point', hang: 0, sw: 0.8, z: 2, layer: 'main' }, o);
const h2Tip = (P, r) => (r < 1 - P.sp ? (P.sp > 0.3 && r > 0.72 - P.sp * 0.3 ? 'fork' : 'round') : 'point');
const h2J = (P, r, k) => 1 + (r - 0.5) * (k || 0.5) * (0.4 + P.sp * 0.6);
const H2_FRINGES = {
  none: { name: 'None', line: -11, side: -2, gen: () => [] },
  spiky: { name: 'Pointed', line: -10, side: -1, gen: (P) => [...Array(6)].map((_, i) => {
    const x = -15 + i * 5.8 + (P.R(i, 1) - 0.5) * 2, dom = i === 2 || i === 4 ? 1.12 : 1;
    return h2C({ x, y: P.hl(x) - 4, a: 90 - x * 1.6 + (P.R(i, 2) - 0.5) * 14, len: (9 + 3.5 * Math.cos(x / 12)) * P.L * dom * h2J(P, P.R(i, 3)), w: 8.5 * h2J(P, P.R(i, 4), 0.7), bend: (x < 0 ? 1 : -1) * (6 + 16 * P.R(i, 5)) * (0.5 + P.sp), tip: h2Tip(P, P.R(i, 6)), z: 3 + (P.R(i, 7) > 0.65 ? 1 : 0) });
  }) },
  blunt: { name: 'Straight cut', line: -9, side: 1, gen: (P) => [...Array(7)].map((_, i) => {
    const x = -14 + i * 4.7, cut = -2.5 + (P.L - 1) * 7, y = P.hl(x) - 4;
    return h2C({ x, y, a: 90 - x * 0.45, len: Math.max(4, cut - y), w: 7.2, tip: 'blunt', z: 3 + (i % 2) });
  }) },
  swept: { name: 'Swept', line: -10, side: -1, gen: (P) => [...Array(6)].map((_, i) => {
    const x = -15 + i * 4.8;
    return h2C({ x, y: P.hl(x) - 4, a: 52 + P.R(i, 1) * 10 + (i > 3 ? 10 : 0), len: (9 + i * 2) * P.L * h2J(P, P.R(i, 2)), w: 9 * h2J(P, P.R(i, 3), 0.6), bend: 14 + P.R(i, 4) * 10, tip: h2Tip(P, P.R(i, 5)), z: 3 + i * 0.1 });
  }) },
  parted: { name: 'Middle part', line: -10, side: 0, gen: (P) => [0, 1, 2].flatMap((i) => [-1, 1].map((sd) => h2C({
    x: sd * (2.5 + i * 5), y: P.hl(sd * (2.5 + i * 5)) - 4, a: 90 + sd * -(18 + i * 9) + (P.R(i, sd) - 0.5) * 8, len: (14 - i * 1.5) * P.L * h2J(P, P.R(i, sd + 3)), w: 8 * h2J(P, P.R(i, sd + 5), 0.6),
    bend: -sd * (16 + P.R(i, sd + 7) * 10), tip: h2Tip(P, P.R(i, sd + 9)), z: 3 + (2 - i) * 0.2,
  }))) },
  eye: { name: 'Over one eye', line: -10, side: -1, gen: (P) => [
    h2C({ x: -3.5, y: -16, a: 97, len: 23 * P.L, w: 15, bend: 6, tip: 'point', z: 5 }),
    h2C({ x: -13, y: -12, a: 104, len: 15 * P.L, w: 8, bend: 8, tip: h2Tip(P, P.R(1, 1)), z: 4 }),
    ...[1, 6, 11, 15].map((x, i) => h2C({ x, y: P.hl(x) - 4, a: 84 - i * 6, len: (10 - i) * P.L * h2J(P, P.R(i, 2)), w: 7 * h2J(P, P.R(i, 3), 0.6), bend: -8, tip: h2Tip(P, P.R(i, 4)), z: 3 })),
  ] },
  open: { name: 'Swept up', line: -13, side: -3, gen: (P) => [-11, -4, 3, 10].map((x, i) => h2C({
    x, y: P.hl(x) + 0.5, a: -112 + i * 8 + (P.R(i, 1) - 0.5) * 16, len: (6 + 4 * P.sp) * P.L * h2J(P, P.R(i, 2)), w: 8 * h2J(P, P.R(i, 3), 0.6), bend: -14, tip: h2Tip(P, P.R(i, 4)), z: 3,
  })) },
  framing: { name: 'Long locks', line: -10, side: -1, gen: (P) => [
    h2C({ x: 1, y: -15, a: 92, len: 17 * P.L, w: 5.5, bend: -4, tip: 'point', z: 5 }),
    h2C({ x: -11, y: -13, a: 107, len: 21 * P.L, w: 7, bend: -8, tip: 'point', z: 4 }),
    h2C({ x: 12, y: -12, a: 74, len: 21 * P.L, w: 7, bend: 8, tip: 'point', z: 4 }),
    h2C({ x: -5, y: -15, a: 101, len: 11 * P.L * h2J(P, P.R(1, 1)), w: 6.5, bend: 10, tip: h2Tip(P, P.R(1, 2)), z: 3 }),
    h2C({ x: 6, y: -15, a: 82, len: 11 * P.L * h2J(P, P.R(2, 1)), w: 6.5, bend: -10, tip: h2Tip(P, P.R(2, 2)), z: 3 }),
  ] },
  messy: { name: 'Messy', line: -10, side: -1, gen: (P) => [...Array(8)].map((_, i) => {
    const x = -16 + i * 4.4 + (P.R(i, 1) - 0.5) * 2;
    return h2C({ x, y: P.hl(x) - 4, a: 90 - x * 1.2 + (P.R(i, 2) - 0.5) * 40, len: (7 + 7 * P.R(i, 3)) * P.L, w: 7 * h2J(P, P.R(i, 4), 0.8), bend: (P.R(i, 5) - 0.5) * 60, tip: h2Tip(P, P.R(i, 6)), z: 3 + P.R(i, 7) });
  }) },
};
const H2_SIDES = {
  none: { name: 'None', gen: () => [] },
  short: { name: 'Short', gen: (P) => [-1, 1].map((sd) => h2C({ x: sd * 15.5, y: -6, a: 90 - sd * 14, len: 9 * P.L, w: 8, bend: sd * -10, tip: h2Tip(P, P.R(sd, 1)), z: 1 })) },
  long: { name: 'Long locks', gen: (P) => [-1, 1].flatMap((sd) => [
    h2C({ x: sd * 12.5, y: -13, a: 90 - sd * 25, len: (27 + 8 * P.L) * P.L, w: 7.5, bend: sd * 20, tip: 'point', hang: 0.6, sw: 2.5, ph: sd, z: 1 }),
    h2C({ x: sd * 13.5, y: -10, a: 90 - sd * 4, len: (18 + 4 * P.L) * P.L, w: 4.5, bend: sd * 10, tip: 'point', hang: 0.5, sw: 3, ph: sd + 1, z: 1.1 }),
  ]) },
  panels: { name: 'Straight panels', gen: (P) => [-1, 1].map((sd) => h2C({ x: sd * 13, y: -13, a: 90 - sd * 10, bend: sd * 10, len: 30 * P.L, w: 8, tip: 'blunt', hang: 0.7, sw: 1.5, ph: sd, z: 1 })) },
  bob: { name: 'Bob', gen: (P) => [-1, 1].flatMap((sd) => [
    h2C({ x: sd * 12.5, y: -13, a: 90 - sd * 24, len: 25 * P.L, w: 8.5, bend: sd * 30, tip: 'round', sw: 1, z: 1 }),
    h2C({ x: sd * 13, y: -12, a: 90 - sd * 3, len: 19 * P.L, w: 6.5, bend: sd * 10, tip: 'point', sw: 1, ph: 1, z: 1.1 }),
  ]) },
  spiky: { name: 'Spiky', gen: (P) => [-1, 1].flatMap((sd) => [
    h2C({ x: sd * 15, y: -7, a: sd > 0 ? 18 : 162, len: 9 * P.L * h2J(P, P.R(sd, 1)), w: 9, bend: sd * 12, tip: 'point', z: 1 }),
    h2C({ x: sd * 15, y: 0, a: sd > 0 ? 45 : 135, len: 7.5 * P.L * h2J(P, P.R(sd, 2)), w: 8, bend: sd * 14, tip: 'point', z: 1 }),
  ]) },
};
// Around the head: roots on the skull at angle ang (0 right, -90 top).
const h2Ring = (ang, r) => HP(ang, r);
const H2_BACKS = {
  none: { name: 'None', gen: () => [] },
  short: { name: 'Short', gen: (P) => [150, 168, 12, 30].map((ang, i) => { const [x, y] = h2Ring(ang, 16); return h2C({ x, y, a: ang + (ang > 90 ? -18 : 18), len: 6 * P.L, w: 9, tip: h2Tip(P, P.R(i, 1)), layer: 'nape' }); }) },
  spiky: { name: 'Spikes', gen: (P) => {
    const n = 8 + Math.round(P.sp * 3), out = [], dom = [Math.floor(P.R(1, 9) * n), Math.floor(P.R(2, 9) * n)];
    for (let i = 0; i < n; i++) {
      const k = i / (n - 1), ang = -205 + 230 * k + (P.R(i, 1) - 0.5) * 8, [x, y] = h2Ring(ang, 15);
      out.push(h2C({ x, y, a: ang * 0.82 - 90 * 0.18 + (P.R(i, 2) - 0.5) * 14, len: (9 + 9 * Math.sin(Math.PI * k) + 4 * P.R(i, 3)) * (0.75 + 0.5 * P.sp) * (dom.includes(i) ? 1.35 : 1) * (0.85 + P.L * 0.25), w: 12 * h2J(P, P.R(i, 4), 0.6), bend: (i % 2 ? 1 : -1) * (8 + 10 * P.R(i, 5)), tip: 'point', layer: 'nape', z: P.R(i, 6), dom: dom.includes(i), crown: ang > -160 && ang < -20 ? 1 : 0 }));
    }
    out.push(h2C({ x: -7, y: -15, a: -128, len: 8 * (0.7 + P.sp * 0.6), w: 9, bend: -12, crown: 1, z: 0.5 }), h2C({ x: 6, y: -16, a: -58, len: 8 * (0.7 + P.sp * 0.6), w: 9, bend: 12, crown: 1, z: 0.5 }));
    return out;
  } },
  up: { name: 'Standing up', gen: (P) => {
    const n = 10, out = [];
    for (let i = 0; i < n; i++) {
      const k = i / (n - 1), ang = -198 + 214 * k, [x, y] = h2Ring(ang, 15);
      out.push(h2C({ x, y, a: -96 + (ang + 90) * 0.34 + (P.R(i, 2) - 0.5) * 10, len: (11 + 19 * Math.sin(Math.PI * Math.min(1, k * 1.05)) + 4 * P.R(i, 3)) * (0.7 + 0.5 * P.sp) * (0.85 + P.L * 0.25), w: 12.5 * h2J(P, P.R(i, 4), 0.5), bend: -6 - 8 * P.R(i, 5), tip: 'point', layer: 'nape', z: P.R(i, 6), crown: ang > -165 && ang < -15 ? 1 : 0 }));
    }
    out.push(h2C({ x: -2, y: -16, a: -100, len: 11 * (0.7 + P.sp * 0.5), w: 10, bend: -10, crown: 1, z: 0.5 }));
    return out;
  } },
  bob: { name: 'Bob', gen: (P) => [175, 195, 212, 5, -15, -32].map((ang, i) => { const [x, y] = h2Ring(ang, 12.5), sd = ang > 90 ? -1 : 1; return h2C({ x, y, a: 90 - sd * 8, len: (22 + (i % 3) * 2) * P.L, w: 12, bend: sd * 12, tip: 'round', layer: 'nape', sw: 1, ph: i }); }) },
  medium: { name: 'Shoulder length', gen: (P) => [172, 192, 210, 8, -12, -30].map((ang, i) => { const [x, y] = h2Ring(ang, 12.5), sd = ang > 90 ? -1 : 1; return h2C({ x, y, a: 90 - sd * 12, len: (34 + 4 * P.R(i, 1)) * P.L, w: 12.5, bend: sd * 10, tip: h2Tip(P, P.R(i, 2)), hang: 0.6, layer: 'nape', sw: 2, ph: i }); }) },
  long: { name: 'Long', gen: (P) => [
    ...[172, 196, 218, 8, -16, -38].map((ang, i) => { const [x, y] = h2Ring(ang, 12.5), sd = ang > 90 ? -1 : 1; return h2C({ x, y, a: 90 - sd * 3, len: (48 + 28 * P.L) * (0.97 + 0.06 * P.R(i, 1)), w: 17, tip: P.sp > 0.5 ? 'point' : 'blunt', hang: 1, layer: 'back', sw: 2.5, ph: i, soft: 1, z: i % 3 }); }),
    ...[180, 0].map((ang, i) => { const [x, y] = h2Ring(ang, 12.5), sd = ang > 90 ? -1 : 1; return h2C({ x, y, a: 90 - sd * 3, len: 28, w: 13, tip: 'point', hang: 0.8, layer: 'nape', sw: 1, ph: i, soft: 1 }); }),
  ] },
  wavy: { name: 'Long waves', gen: (P) => [
    ...[168, 186, 204, 220, 12, -6, -24, -40].map((ang, i) => { const [x, y] = h2Ring(ang, 12.5); return h2C({ x, y, a: 90, len: (48 + 26 * P.L) * (0.94 + 0.12 * P.R(i, 1)), w: 14, tip: 'point', hang: 0.9, wave: 16, wf: 1.6, ph: i * 0.7, layer: 'back', sw: 2.5 }); }),
    ...[176, 200, 4, -20].map((ang, i) => { const [x, y] = h2Ring(ang, 12.5), sd = ang > 90 ? -1 : 1; return h2C({ x, y, a: 90 - sd * 6, len: 28, w: 12, tip: 'round', hang: 0.7, wave: 10, layer: 'nape', ph: i }); }),
  ] },
  ponytail: { name: 'Ponytail', tight: 1, gen: (P) => {
    const T = [-17, -12];
    return [0, 1, 2].map((i) => h2C({ x: T[0] + i, y: T[1] + i * 1.5, a: 118 - i * 10, len: (30 + 14 * P.L) * (1 - i * 0.12), w: 11 - i * 1.5, bend: -18 + i * 6, tip: 'point', hang: 0.8, sw: 3.5, ph: i * 0.8, layer: 'back' }))
      .concat([h2C({ x: -12, y: -14, a: 200, len: 7, w: 9, tip: 'round', layer: 'nape', z: 2, tie: T })]);
  } },
  twintails: { name: 'Twin tails', tight: 1, gen: (P) => [-1, 1].flatMap((sd) => {
    const T = [sd * 17, -11];
    return [0, 1].map((i) => h2C({ x: T[0], y: T[1] + i * 1.5, a: 90 - sd * (22 - i * 12), len: (26 + 18 * P.L) * (1 - i * 0.15), w: 11 - i * 2, bend: sd * (14 - i * 8), tip: 'point', hang: 0.75, sw: 3.5, ph: sd + i, layer: 'back', tie: i ? null : T }));
  }) },
};
const H2_EXTRAS = {
  none: { name: 'None', gen: () => [] },
  ahoge: { name: 'Cowlick', gen: () => [h2C({ x: 1, y: -19, a: -70, len: 12, w: 3.6, bend: 130, tip: 'point', sw: 4, z: 6 })] },
  antenna: { name: 'Two cowlicks', gen: () => [h2C({ x: -3, y: -19, a: -105, len: 11, w: 3.2, bend: -110, tip: 'point', sw: 4, z: 6 }), h2C({ x: 4, y: -19, a: -72, len: 10, w: 3.2, bend: 110, tip: 'point', sw: 4, ph: 1, z: 6 })] },
  strands: { name: 'Stray strands', gen: () => [h2C({ x: -14, y: -11, a: 112, len: 15, w: 2.4, bend: 46, tip: 'point', sw: 3, z: 6 }), h2C({ x: 13, y: -12, a: 68, len: 13, w: 2.2, bend: -46, tip: 'point', sw: 3, ph: 1, z: 6 })] },
  bun: { name: 'Bun', gen: () => [h2C({ x: -8, y: -27, a: 0, len: 0, w: 0, bun: [-6, -26, 8], layer: 'nape' })] },
  curls: { name: 'Forehead curls', gen: (P) => ((P.d && Array.isArray(P.d.curls) && P.d.curls) || [[-8.5, -9.5, 3.9, 6.1], [0.3, -10.6, 4.2, 6.2], [9, -9.2, 3.8, 6]]).map(([x, y, r, z]) => h2C({ x, y, a: 0, len: 0, w: 0, bun: [x, y, r], curl: 1, z })) },
};
// Ready-made combinations.
const H2_STYLES = {
  blank: { name: 'Blank (draw it)', fringe: 'none', side: 'none', back: 'none', extra: 'none', vol: 0.4, len: 0.5, spike: 0.5 },
  shonen: { name: 'Shonen spikes', fringe: 'spiky', side: 'short', back: 'spiky', extra: 'none', vol: 0.6, len: 0.5, spike: 0.85 },
  upright: { name: 'Standing tall', fringe: 'open', side: 'none', back: 'up', extra: 'none', vol: 0.5, len: 0.5, spike: 0.8 },
  messy: { name: 'Messy', fringe: 'messy', side: 'spiky', back: 'spiky', extra: 'ahoge', vol: 0.7, len: 0.5, spike: 0.6 },
  neat: { name: 'Neat short', fringe: 'swept', side: 'short', back: 'short', extra: 'none', vol: 0.35, len: 0.5, spike: 0.25 },
  framing: { name: 'Long bangs', fringe: 'framing', side: 'long', back: 'spiky', extra: 'none', vol: 0.5, len: 0.5, spike: 0.6 },
  hime: { name: 'Hime cut', fringe: 'blunt', side: 'panels', back: 'long', extra: 'none', vol: 0.4, len: 0.55, spike: 0 },
  bob: { name: 'Bob', fringe: 'parted', side: 'bob', back: 'bob', extra: 'none', vol: 0.5, len: 0.5, spike: 0.1 },
  waves: { name: 'Long waves', fringe: 'swept', side: 'long', back: 'wavy', extra: 'strands', vol: 0.55, len: 0.5, spike: 0.3 },
  ponytail: { name: 'Ponytail', fringe: 'parted', side: 'long', back: 'ponytail', extra: 'none', vol: 0.3, len: 0.5, spike: 0.4 },
  twintails: { name: 'Twin tails', fringe: 'spiky', side: 'short', back: 'twintails', extra: 'ahoge', vol: 0.4, len: 0.5, spike: 0.4 },
  oneeye: { name: 'Over one eye', fringe: 'eye', side: 'short', back: 'short', extra: 'none', vol: 0.45, len: 0.5, spike: 0.3 },
  bun: { name: 'Top bun', fringe: 'parted', side: 'long', back: 'short', extra: 'bun', vol: 0.3, len: 0.45, spike: 0.2 },
};
const H2_PARTS = { fringe: H2_FRINGES, side: H2_SIDES, back: H2_BACKS, extra: H2_EXTRAS };
const HAIR2_DEFAULT = { seed: 1, c: '#24252f', tip: '', fringe: 'spiky', side: 'short', back: 'spiky', extra: 'none', vol: 0.6, len: 0.5, spike: 0.85 };

/* ---------------------------------------------------------------- building and drawing */
// The skull cap: an arc over the top, closed by the hairline (y = line in the middle, side at the temples).
// px moves the parting off-centre and tilt lowers one temple: real hairlines are never symmetric.
function h2Cap(line, side, off, top, px, tilt, peak, dome) {
  const [rise, wide] = dome || [0, 0], R = 19 + off, P = [], s = Math.max(-0.95, Math.min(0.95, side / R)), a0 = 180 - Math.asin(s) / D2R, a1 = 360 + Math.asin(s) / D2R;
  for (let i = 0; i <= 14; i++) {
    const a = a0 + ((a1 - a0) * i) / 14, up = Math.max(0, -Math.sin(a * D2R)), sd = Math.abs(Math.cos(a * D2R));
    P.push(HP(a, R + up * (top + rise) + Math.min(1, sd * 1.4) * Math.sqrt(up) * wide));
  }
  const pk = peak || 0;
  const hl = (x) => line + Math.pow((x - px) / 17, 2) * (side - line) * 0.7 + x * tilt + pk * Math.max(0, 1 - Math.abs(x - px) / 6.5);
  const xr = P[14][0], xl = P[0][0];
  P[0].push(1); P[14].push(1);
  const xs = pk ? [xr - 2, xr * 0.62, px + 6.5, px + 3, px, px - 3, px - 6.5, xl * 0.62, xl + 2] : [xr - 2, (xr + px) * 0.5, px, (xl + px) * 0.5, xl + 2];
  for (const x of xs) P.push(pk && (x === px || Math.abs(Math.abs(x - px) - 6.5) < 0.01) ? [x, hl(x), 1] : [x, hl(x)]);
  return { P, hl };
}
function hair2Build(def, covered) {
  const d = Object.assign({}, HAIR2_DEFAULT, def), fr = H2_FRINGES[d.fringe] || H2_FRINGES.spiky, bk = H2_BACKS[d.back] || H2_BACKS.short;
  const vol = Math.max(0, Math.min(1, +d.vol)) * (bk.tight ? 0.35 : 1), seed = (d.seed || 1) * 1.37;
  const R = (i, j) => hj(i * 7.13 + j * 3.71 + 1, seed);
  // the whole cut leans one way: the parting moves, one side grows longer, everything flows a little to that side
  const lean = (R(91, 3) - 0.5) * 2;
  const hlo = Array.isArray(d.hl) ? d.hl : [];
  const off = 0.8 + vol * 2.6, cap = h2Cap(hlo[0] != null ? +hlo[0] : fr.line, hlo[1] != null ? +hlo[1] : fr.side, off, covered ? 0 : vol * 2.2, d.part != null ? +d.part : lean * 3, d.part != null ? 0 : lean * 0.06, +hlo[2] || 0, Array.isArray(d.dome) ? d.dome.map(Number) : null);
  const P = { d, vol, lean, L: 0.72 + Math.max(0, Math.min(1, +d.len)) * 0.62, sp: Math.max(0, Math.min(1, +d.spike)), R, hl: cap.hl };
  let clumps = [];
  for (const [k, lib] of Object.entries(H2_PARTS)) {
    const part = lib[d[k]];
    if (part) clumps = clumps.concat(part.gen(P).map((c) => Object.assign(c, { part: k })));
  }
  // imperfection, the way an artist does it: one lean for the whole cut, small differences between
  // clumps, never two alike; a missing spike or a forked tip only on spiky cuts
  clumps.forEach((c, i) => {
    if (c.bun || !c.len) return;
    const r = (n) => R(i + 40, n + 20), sd = c.x < -1 ? -1 : c.x > 1 ? 1 : 0, neat = c.tip === 'blunt' ? 0 : 1;
    c.a += (lean * (c.part === 'fringe' ? 6 : 3) + (r(1) - 0.5) * (5 + P.sp * 6)) * neat;
    c.len *= (1 + (r(2) - 0.5) * 0.22 * neat) * (1 + sd * lean * (c.part === 'side' || c.layer !== 'main' ? 0.12 : 0.04));
    c.w *= 1 + (r(3) - 0.5) * 0.22;
    c.bend += (r(4) - 0.5) * 10 * neat;
    if (P.sp > 0.45 && c.tip === 'point' && r(5) < 0.08 && c.len > 9) c.tip = 'fork';
    if (P.sp > 0.6 && c.part === 'back' && c.layer === 'nape' && !c.dom && r(6) < 0.08) c.drop = 1;
    c.fold = c.len > 8;
    // fringe tips stop above the eyes (except the one meant to hide an eye)
    if (c.part === 'fringe' && d.fringe !== 'eye' && c.tip !== 'blunt') {
      const dy = Math.sin(((c.a + c.bend * 0.3) * Math.PI) / 180);
      if (dy > 0.3) c.len = Math.min(c.len, (0.5 - c.y) / dy);
    }
  });
  clumps = clumps.filter((c) => c.bun || (!c.drop && c.len > 1));
  // strokes drawn by hand in the Studio: kept exactly as drawn
  (d.strokes || []).forEach((st, i) => {
    if (!st || !Array.isArray(st.pts) || st.pts.length < 2) return;
    const len = h2PathLen(st.pts);
    if (len < 1.5) return;
    clumps.push(h2C({ x: st.pts[0][0], y: st.pts[0][1], path: st.pts, len, w: +st.w || 7, tip: st.tip || 'point', layer: st.l || 'main', z: 5 + i * 0.01, part: 'draw', sw: st.l === 'back' ? 2.5 : 1, ph: i, fold: len > 8 && st.f !== 'sh', shaved: st.f === 'sh' }));
  });
  if (covered) clumps = clumps.filter((c) => !c.crown);
  for (const c of clumps) if (c.layer !== 'main' || c.part === 'side') c.w *= 0.88 + vol * 0.28;
  return { d, cap: cap.P, clumps, pal: hair2Palette(d.c) };
}
// Shapes of a set of clumps (and the cap): outlines, spines, sides.
function h2Shapes(list, o, cap) {
  const out = cap ? [{ P: cap, cap: 1 }] : [];
  for (const c of list.slice().sort((a, b) => a.z - b.z)) {
    if (c.bun) { const [x, y, r] = c.bun, q = c.curl ? 1 : 0.9; out.push({ P: [...Array(12)].map((_, i) => [x + Math.cos((i / 12) * Math.PI * 2) * r * (1 + 0.06 * Math.sin(i * 2.3)), y + Math.sin((i / 12) * Math.PI * 2) * r * q]), bun: c }); continue; }
    const S = h2Spine(c, o.t, o.ha), E = h2Sides(c, S);
    out.push({ c, S, E, P: h2Outline(c, S, E) });
  }
  return out;
}
const h2Union = (shapes) => shapes.map((s) => spline(wind(s.P), true)).join('');
// The inside of a mass, without any outline. Clumps are painted back to front: fill, the shadow on
// the clump's shaded side, then a fine line along both edges towards the tip (how manga separates
// locks). A clump in front covers the shading and lines of the ones behind, so nothing ever crosses.
function h2Body(shapes, B, o) {
  const pal = B.pal, fill = o.fill || pal.base;
  let g = '', gi = 0;
  for (const s of shapes) {
    const d = spline(s.P, true);
    g += `<path d="${d}" fill="${s.c && s.c.shaved ? pal.sh : fill}"/>`;
    if (s.cap || (s.c && s.c.shaved)) continue;
    if (s.bun && s.bun.curl) {
      // a curl: shaded underside, then a spiral drawn into it
      const [x, y, r] = s.bun.bun, sp = [...Array(15)].map((_, i) => { const a = (-60 + i * 30) * D2R, rr = r * (0.1 + 0.66 * (i / 14)); return [x + Math.cos(a) * rr, y + Math.sin(a) * rr]; });
      g += `<path d="M${pt([x - r * 0.95, y + r * 0.2])}A${r1(r)} ${r1(r)} 0 0 0 ${pt([x + r * 0.95, y + r * 0.2])}A${r1(r * 1.05)} ${r1(r * 0.7)} 0 0 1 ${pt([x - r * 0.95, y + r * 0.2])}Z" fill="${pal.sh}"/>`
        + `<path d="${spline(sp, false)}" fill="none" stroke="${pal.line}" stroke-width="1.15" stroke-linecap="round"/>`;
      continue;
    }
    if (s.bun) { g += `<path d="${spline(s.P.slice(5, 12), false)}" fill="none" stroke="${pal.line}" stroke-width=".8" stroke-linecap="round" opacity=".7"/>`; continue; }
    if (o.tip && s.c.len > 8) {
      const gid = `${o.uid}g${gi++}`, a = s.S[Math.round(s.S.length * 0.45)], b = s.S[s.S.length - 1];
      g += `<linearGradient id="${gid}" gradientUnits="userSpaceOnUse" x1="${r1(a[0])}" y1="${r1(a[1])}" x2="${r1(b[0])}" y2="${r1(b[1])}"><stop offset="0" stop-color="${o.tip}" stop-opacity="0"/><stop offset="1" stop-color="${o.tip}"/></linearGradient><path d="${d}" fill="url(#${gid})"/>`;
    }
    if (s.c.fold) g += `<path d="${spline(h2Wedge(s.c, s.S, s.E), true)}" fill="${o.shade || pal.sh}"${o.soft ? ' opacity=".55"' : ''}/>`;
    if (s.c.len > 14 && s.c.w > 4.5 && !s.c.noShine && hj(s.S[0][0] * 3.1 + s.S[0][1], 7.7) < 0.5) g += `<path d="${h2Shine(s)}" fill="${pal.hi}"/>`;
    if (s.c.len > 6 && s.c.w > 3 && !o.soft) g += `<path d="${h2EdgeLine(s)}" fill="${pal.line}"/>`;
  }
  for (const s of shapes) if (s.c && s.c.tie) { const [x, y] = s.c.tie; g += `<circle cx="${r1(x)}" cy="${r1(y)}" r="3.4" fill="#e8443a" stroke="${pal.line}" stroke-width="1.4"/>`; }
  return g;
}
// Both edges of a clump from a little past its middle to the tip (around the tip, or along a cut end).
// A tapered sliver (a brush stroke, never a stub): starts at nothing, thickest near the tip.
function h2EdgeLine(s) {
  const { L, R, N, n } = s.E, i0 = Math.round(n * 0.4), m = Math.floor(n / 2);
  const lit = N[m][0] * H2_LIGHT[0] + N[m][1] * H2_LIGHT[1] > 0, side = lit ? R : L, k = lit ? 1 : -1;
  const out = [], inn = [];
  for (let i = i0; i < n; i++) {
    const f = (i - i0) / (n - i0), w = 0.7 * Math.sin(Math.PI * Math.min(1, f * 0.8 + 0.05));
    out.push(side[i]); inn.push([side[i][0] + k * N[i][0] * w, side[i][1] + k * N[i][1] * w]);
  }
  const end = s.c.tip === 'blunt' ? side[n] : s.S[n];
  return spline([[...out[0], 1], ...out.slice(1), [...end, 1], ...inn.slice(1).reverse()], true);
}
// The highlight of a lock: a stripe on its lit side, following its direction, thin at both ends.
function h2Shine(s) {
  const { L, R, N, W, n } = s.E, m = Math.floor(n / 2);
  const lit = N[m][0] * H2_LIGHT[0] + N[m][1] * H2_LIGHT[1] > 0, sg = lit ? 1 : -1;
  const i0 = Math.max(1, Math.round(n * 0.12)), i1 = Math.round(n * 0.68), a = [], b = [];
  for (let i = i0; i <= i1; i++) {
    const f = (i - i0) / (i1 - i0), o = W[i] * 0.42, w = W[i] * 0.34 * Math.sin(Math.PI * f);
    a.push([s.S[i][0] + sg * N[i][0] * (o + w * 0.5), s.S[i][1] + sg * N[i][1] * (o + w * 0.5)]);
    b.push([s.S[i][0] + sg * N[i][0] * (o - w * 0.5), s.S[i][1] + sg * N[i][1] * (o - w * 0.5)]);
  }
  void L; void R;
  a[0].push(1); a[a.length - 1].push(1);
  return spline([...a, ...b.slice(1, -1).reverse()], true);
}
// The ink: one line of constant width around the silhouette, nothing inside it. Every clump of
// the group is stroked twice as wide as the line, then a mask hides everything inside the mass
// (and, for hair behind the head, the face), so only the outer half of the outer edge remains.
// No clip ever cuts a line, and inner edges simply never show.
function h2Ink(shapes, mass, pal, id, w) {
  const d = shapes.map((s) => spline(s.P, true)).join('');
  if (!d) return '';
  return `<mask id="${id}" maskUnits="userSpaceOnUse" x="-160" y="-180" width="320" height="420"><rect x="-160" y="-180" width="320" height="420" fill="#fff"/>${mass}</mask>`
    + `<path d="${d}" fill="none" stroke="${pal.line}" stroke-width="${w * 2}" stroke-linejoin="round" mask="url(#${id})"/>`;
}
// The highlight: like a manga artist's, two or three tapered crescents following the curve of the skull
// on the side facing the light (upper left), one long, the others shorter, never evenly spaced.
function h2Halo(B, uid, shapes) {
  const pal = B.pal, col = pal.hi, R = (j) => hj(j * 5.3 + 2, (B.d.seed || 1) * 2.11);
  const rr = 15.8 + B.d.vol * 1.8 + (Array.isArray(B.d.dome) ? +B.d.dome[0] * 0.75 : 0);
  const marks = B.d.shine === 0 ? [] : [[-150 + R(1) * 6, 38, 1.3, 0], [-104 + R(2) * 6, 14, 0.85, -0.6]];
  let d = '';
  for (const [a0, span, th, o] of marks) {
    const P = [];
    for (let k = 0; k <= 8; k++) P.push(HP(a0 + (span * k) / 8, rr + o + th * Math.sin((Math.PI * k) / 8)));
    for (let k = 8; k >= 0; k--) P.push(HP(a0 + (span * k) / 8, rr + o - th * 0.6 * Math.sin((Math.PI * k) / 8)));
    d += 'M' + P.map(pt).join('L') + 'Z';
  }
  const id = uid + 'hc';
  return `<clipPath id="${id}">${shapes.map((x) => `<path d="${spline(x.P, true)}"/>`).join('')}</clipPath><g clip-path="url(#${id})"><path d="${d}" fill="${col}"/></g>`;
}
// Everything drawAvatar needs, in head-local space. Three masses: long hair behind the body (back),
// hair behind the head (nape, a shade darker so the front reads in front), the main layer over the
// face. Fills and shading come first; the ink comes last, on top of everything:
// - the outer edge of nape + main as ONE silhouette (no line where they meet),
//   except behind the face, where the head hides the nape;
// - the edge where the back hair comes out from under the nape.
// o: { t (time, null = still), ha (head rotation, for gravity), uid, covered, face: [cx, rx] }
function hair2SVG(def, o) {
  o = o || {};
  const B = hair2Build(def, !!o.covered), uid = (o.uid || 'h2') + '_', pal = B.pal;
  const by = (l) => B.clumps.filter((c) => c.layer === l);
  const base = { t: o.t, ha: o.ha || 0, tip: B.d.tip || '' };
  const mainS = h2Shapes(by('main'), base, B.cap), napeS = h2Shapes(by('nape'), base), backS = h2Shapes(by('back'), base);
  const mainU = h2Union(mainS), napeU = h2Union(napeS), all = mainU + napeU, backU = h2Union(backS);
  // the face, in hair space (the hair shifts a little as the head turns)
  const [fx, frx] = o.face || [0, 19], face = (c) => `<ellipse cx="${r1(fx)}" rx="${r1(frx - 0.3)}" ry="18.7" fill="${c}"/>`;
  // masses drawn shape by shape (one path per clump): a lock that crosses itself never makes a hole
  const blk = (S) => S.map((x) => `<path d="${spline(x.P, true)}" fill="#000"/>`).join('');
  const W = 1.3;
  return {
    back: backU ? h2Body(backS, B, Object.assign({ uid: uid + 'b', soft: 1 }, base)) + h2Ink(backS, blk(backS), pal, uid + 'kb', W) : '',
    // its ink goes under the head: the head and its outline cover it, no line ever crosses the face
    nape: h2Body(napeS, B, Object.assign({ uid: uid + 'n' }, base)) + h2Ink(napeS, blk(napeS) + blk(mainS), pal, uid + 'kn', W),
    main: h2Body(mainS, B, Object.assign({ uid: uid + 'm' }, base)) + h2Halo(B, uid, mainS)
      + h2Ink(mainS, blk(napeS) + face('#fff') + blk(mainS), pal, uid + 'km', W),
    shadow: mainU,   // cast on the forehead by drawAvatar (clipped to the face)
    pal,
  };
}
// A head portrait for the Studio's tiles (no body: shoulders, head, face, hair).
function hair2Portrait(def, uid, o) {
  o = o || {};
  const H = hair2SVG(def, { t: null, uid }), skin = o.skin || '#eef1f6', sh = o.skinSh || '#c6cad6';
  const id = uid + 'fc';
  return `${H.back}<path d="M-16,40 Q-15,22 0,21 Q15,22 16,40Z" fill="#5a6880" stroke="${OL}" stroke-width="2"/>${H.nape}`
    + `<circle r="19" fill="${skin}" stroke="${OL}" stroke-width="2.4" paint-order="stroke"/>`
    + `<clipPath id="${id}"><circle r="19"/></clipPath><g clip-path="url(#${id})"><path d="${H.shadow}" fill="${sh}" transform="translate(.6,2.8)"/></g>`
    + `<g transform="translate(-3.7,1)">${faceSVG('dots', null, OL)}</g>${H.main}`;
}
