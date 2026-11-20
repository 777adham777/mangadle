'use strict';
/* ==========================================================================
   TRI-REALM — hair on the canonical head (rig v3)
   Every hairstyle is built on ONE head reference (RIG_HEAD): the skull, the
   eyes, the hairline, the temples, the sideburns, the crown and the nape, in
   the skull's frame (centre 0,0, radius 19, 3/4 view facing right). A
   hairstyle never draws a head: it is a skin of five layers on the skull,
   - back:    the mass behind the head (and the body), a darker tone;
   - scalp:   the volume over the skull, cut exactly on the canonical hairline,
              with the shapes standing out of it (crown spikes);
   - sides:   the side locks from the temples;
   - bangs:   the fringe from the front of the scalp over the forehead;
   - strands: optional (a cowlick, flyaways).
   Locks are not placed with free coordinates: each one is anchored to a
   landmark (a point of the hairline, an angle on the skull, a temple...) and
   leaves it along the growth direction there, give or take a turn. A lock is
   a tapered ribbon: root width, a belly, a tip (point, round, blunt).
   Drawing (one rule set for every hairstyle): one outline of one width
   around the whole mass (the scalp merges into the back mass), fills back to
   front, a shadow wedge on the side of each lock away from the light, a
   tapered brush line on its lit edge, the highlight ring on the scalp, and
   the fringe's shadow on the forehead. Colours come from one base colour.
   Loaded after js/rig-canon.js.
   ========================================================================== */

/* ---------------------------------------------------------------- the head reference */
// Version 2 (2026-11-20): the face measured on the validated reference sheet (eyes higher and
// wider, the near ear), the hairline centred on that face.
const RIG_HEAD = {
  version: 2,
  r: 19,
  // the face: what hair may frame but not cover (boxes a little larger than the drawn eyes)
  eyes: { N: { c: [-0.5, -0.4], rx: 2.5, ry: 3.8 }, F: { c: [13.3, -0.4], rx: 2.3, ry: 3.7 } },
  midline: 6.4,                 // the centre of the forehead (3/4 view)
  browY: -5.6,
  ear: [-20.8, 5.3],            // the near ear sticks out of the skull here
  // the hairline, from the near temple (left) over the forehead to the far temple (right)
  hairline: [[-16.6, -2.8], [-13.6, -8.4], [-8.2, -11.8], [-1.8, -13.6], [4.6, -14.2], [10, -13.6], [14.2, -11], [16.8, -7.4], [18, -3.6]],
  sideburnN: [[-16.6, -2.8], [-17.6, 3]],     // in front of the near ear
  sideburnF: [[18, -3.6], [18.6, 1]],         // the far temple, at the edge of the face
  temples: { N: [-15.6, -5.6], F: [17.2, -6.6] },   // where side locks grow: just inside the hairline at each temple
  nape: [[-17.6, 3], [-15.6, 10], [-11, 15.4]],     // behind the near ear, down to the back of the neck
  crown: [-8, -16],             // the whorl: hair leaves it in every direction
};
// Points along a polyline (u 0..1 by length).
function rigAlong(P, u) {
  const L = [0];
  for (let i = 1; i < P.length; i++) L.push(L[i - 1] + Math.hypot(P[i][0] - P[i - 1][0], P[i][1] - P[i - 1][1]));
  const d = Math.max(0, Math.min(1, u)) * L[L.length - 1];
  let i = 1;
  while (i < P.length - 1 && L[i] < d) i++;
  const k = (d - L[i - 1]) / (L[i] - L[i - 1] || 1);
  return [P[i - 1][0] + (P[i][0] - P[i - 1][0]) * k, P[i - 1][1] + (P[i][1] - P[i - 1][1]) * k];
}
// The scalp region (where hair grows) and the face (everything else on the skull).
const RIG_SCALP = (() => {
  const H = RIG_HEAD, R = H.r, P = [];
  const a0 = Math.atan2(H.hairline[H.hairline.length - 1][1], H.hairline[H.hairline.length - 1][0]) / RIG.D2R;   // the far temple
  const end = H.nape[H.nape.length - 1], a1 = Math.atan2(end[1], end[0]) / RIG.D2R - 360;                        // the nape, going over the top
  for (let i = 0; i <= 24; i++) { const a = (a0 + ((a1 - a0) * i) / 24) * RIG.D2R; P.push([Math.cos(a) * R, Math.sin(a) * R]); }
  return [...P, ...H.nape.slice().reverse().slice(1), ...H.sideburnN.slice().reverse().slice(1), ...RIG.curvePts(H.hairline, false, 6).slice(0, -1)];
})();
// The growth direction at a point of the scalp. 'stand': straight out of the skull (spiky hair,
// tufts); 'fall': out of the crown, pulled down by gravity (bangs, side locks, long hair).
function rigFlow(p, mode) {
  if (mode === 'stand') return Math.atan2(p[1], p[0]) / RIG.D2R;
  const c = RIG_HEAD.crown, dx = p[0] - c[0], dy = p[1] - c[1], l = Math.hypot(dx, dy) || 1;
  return Math.atan2(dy / l + 0.9, dx / l) / RIG.D2R;
}

/* ---------------------------------------------------------------- locks */
// Where a lock grows from. at: ['hairline', u (0 near temple .. 1 far temple), depth behind it]
// · ['skull', angle (0 right, -90 top), depth inside the skull] · ['temple', 'N'|'F', down]
// · ['crown', dx, dy] · ['nape', u, depth].
function rigRoot(at) {
  const H = RIG_HEAD, [k, a, b] = at;
  if (k === 'hairline') {
    const p = rigAlong(H.hairline, a), c = H.crown, d = b != null ? b : 2.5, l = Math.hypot(c[0] - p[0], c[1] - p[1]) || 1;
    return [p[0] + ((c[0] - p[0]) / l) * d, p[1] + ((c[1] - p[1]) / l) * d];
  }
  if (k === 'skull') { const r = H.r - (b != null ? b : 2.5); return [Math.cos(a * RIG.D2R) * r, Math.sin(a * RIG.D2R) * r]; }
  if (k === 'temple') { const p = H.temples[a === 'F' ? 'F' : 'N']; return [p[0], p[1] + (b || 0)]; }
  if (k === 'nape') { const p = rigAlong(H.nape, a), d = b != null ? b : 2.5; return [p[0] * (1 - d / H.r), p[1] * (1 - d / H.r)]; }
  return [H.crown[0] + (a || 0), H.crown[1] + (b || 0)];
}
// Width along a lock (t 0 root .. 1 tip), by tip kind: a pointed lock has a belly a third of the
// way, a round one stays full and closes, a blunt one is cut straight.
const RIG_TIPS = {
  point: (t) => Math.pow(1 - t, 0.9) * (1 + 0.32 * Math.sin(Math.PI * Math.min(1, t * 1.4))),
  round: (t) => Math.sqrt(Math.max(0, 1 - Math.pow(t, 4))) * (1 + 0.1 * Math.sin(Math.PI * t)) * (1 - 0.2 * t),
  blunt: (t) => 1 - 0.08 * t,
  // a straight triangle with slightly hollow sides (the reference sheet's bangs and spikes)
  spike: (t) => Math.pow(1 - t, 1.12),
};
// A lock: spec { at, flow ('fall'|'stand'|'free'), turn (degrees from the flow), dir (absolute, for
// 'free'), len, w, bend (degrees of curl over its length), s (an S: extra curl that reverses), tip, z }.
// Instead of a direction and a length, a lock can be given the point its tip reaches: to: [x, y]
// (measured on a target); the curl still applies and the growth check still holds it to the flow.
function rigLock(spec, layer) {
  const root = rigRoot(spec.at), flow = spec.flow || (layer === 'back' || layer === 'crown' ? 'stand' : 'fall');
  const ref = flow === 'free' ? null : rigFlow(root, flow);
  let dir = spec.dir != null ? spec.dir : ref + (spec.turn || 0), len = spec.len;
  if (spec.to) {
    // a constant curl: the chord leaves at half the curl, and is shorter than the arc by sinc(curl / 2)
    const dx = spec.to[0] - root[0], dy = spec.to[1] - root[1], half = ((spec.bend || 0) * RIG.D2R) / 2;
    dir = Math.atan2(dy, dx) / RIG.D2R - (spec.bend || 0) / 2;
    len = Math.hypot(dx, dy) / (half ? Math.sin(half) / half : 1);
    spec = Object.assign({}, spec, { len });
  }
  const n = 10, step = len / n, S = [root.slice()], bend = spec.bend || 0, s = spec.s || 0;
  let x = root[0], y = root[1];
  for (let i = 0; i < n; i++) {
    const t = (i + 0.5) / n, a = (dir + bend * t + s * Math.sin(Math.PI * 2 * t)) * RIG.D2R;
    x += Math.cos(a) * step; y += Math.sin(a) * step;
    S.push([x, y]);
  }
  const prof = RIG_TIPS[spec.tip || 'point'], L = [], R = [], N = [], W = [];
  for (let i = 0; i <= n; i++) {
    const a = S[Math.max(0, i - 1)], b = S[Math.min(n, i + 1)], l = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1, tx = (b[0] - a[0]) / l, ty = (b[1] - a[1]) / l;
    const hw = (spec.w / 2) * prof(i / n);
    N.push([-ty, tx]); W.push(hw);
    L.push([S[i][0] - ty * hw, S[i][1] + tx * hw]); R.push([S[i][0] + ty * hw, S[i][1] - tx * hw]);
  }
  const mid = (A) => A.slice(1, n);
  let pts;
  if (spec.tip === 'blunt') pts = [[...L[0], 1], ...mid(L), [...L[n], 1], [...R[n], 1], ...mid(R).reverse(), [...R[0], 1]];
  else if (spec.tip === 'round') pts = [[...L[0], 1], ...mid(L), S[n], ...mid(R).reverse(), [...R[0], 1]];
  else pts = [[...L[0], 1], ...mid(L), [...S[n], 1], ...mid(R).reverse(), [...R[0], 1]];
  return { kind: 'shape', pts, layer, spec, root, dir, ref, flow, S, L, R, N, W, n, z: spec.z || 0 };
}

/* ---------------------------------------------------------------- colour */
// One base colour gives the whole palette. Shadows move away from yellow, as painters shade:
// warm hair (yellow, orange, red, brown) shades towards red, cool hair towards blue-violet; the
// back mass is a shade darker so the front reads in front.
function rigHairPalette(c) {
  const toHsl = (hex) => {
    const n = parseInt(hex.slice(1), 16), r = (n >> 16) / 255, g = ((n >> 8) & 255) / 255, b = (n & 255) / 255;
    const mx = Math.max(r, g, b), mn = Math.min(r, g, b), l = (mx + mn) / 2, d = mx - mn;
    if (!d) return [0, 0, l];
    const s = d / (1 - Math.abs(2 * l - 1)), h = mx === r ? ((g - b) / d) % 6 : mx === g ? (b - r) / d + 2 : (r - g) / d + 4;
    return [(h * 60 + 360) % 360, s, l];
  };
  const hsl = (h, s, l) => {
    s = Math.max(0, Math.min(1, s)); l = Math.max(0, Math.min(1, l));
    const C = (1 - Math.abs(2 * l - 1)) * s, X = C * (1 - Math.abs(((h / 60) % 2) - 1)), m = l - C / 2;
    const [r, g, b] = h < 60 ? [C, X, 0] : h < 120 ? [X, C, 0] : h < 180 ? [0, C, X] : h < 240 ? [0, X, C] : h < 300 ? [X, 0, C] : [C, 0, X];
    return '#' + [r, g, b].map((v) => Math.round((v + m) * 255).toString(16).padStart(2, '0')).join('');
  };
  const [h, s, l] = toHsl(c), warm = h < 62 || h > 300, dark = l < 0.25;
  const toV = (k) => (warm ? (h - 30 * k + 360) % 360 : h + Math.min(1, Math.max(0, (270 - h) / 60)) * 60 * k);
  return {
    hair: c,
    hairBack: hsl(toV(0.4), s, dark ? l * 0.78 : l - 0.1),
    hairSh: hsl(toV(dark ? 0.6 : 0.5), Math.min(1, s * 0.95 + 0.05), dark ? l * 0.6 : l - 0.16),
    hairHi: hsl(h, s * (dark ? 0.4 : 0.85), dark ? l + 0.2 : l + (1 - l) * 0.5),
    hairLine: hsl(toV(0.8), Math.min(1, s + 0.12), Math.min(0.17, l * 0.3)),
  };
}

/* ---------------------------------------------------------------- hairstyles */
// A hairstyle recipe: { id, name, head (reference version), c (colour),
//   the scalp volume, either vol (a dome that far off the skull) or edge: its outer edge as points
//     around the skull [angle (0 right, -90 top, going over the top to the nape: -10 … -235),
//     radius, 't' a spike's tip | 'v' the valley between two spikes | '' smooth];
//   backEdge: the back mass the same way (behind the head and the body), and/or back: [locks];
//   crown, sides, bangs, strands: [lock specs]; coverEye: 'N'|'F' (a fringe meant to hide an eye);
//   ears: false (the cut covers the ear); smooth (no strand lines on the dome) }.
// Compiled into a skin: one attachment per layer slot. The scalp is always closed exactly on the
// canonical hairline, sideburn and nape, whatever its outer edge.
const rigPolar = (a, r) => [Math.cos(a * RIG.D2R) * r, Math.sin(a * RIG.D2R) * r];
// An authored edge as points: tips and valleys are sharp corners; each side of a spike is hollowed
// (a point between the tip and the valley, pulled towards the skull by 12 % of the side), the way
// the reference draws spikes; plain points stay smooth.
function rigEdgePts(E) {
  const out = [];
  E.forEach(([a, r, k], i) => {
    const p = rigPolar(a, r);
    if (i) {
      const [pa, pr, pk] = E[i - 1];
      if (pk === 't' || k === 't') {
        const q = rigPolar(pa, pr), m = [(p[0] + q[0]) / 2, (p[1] + q[1]) / 2], L = Math.hypot(p[0] - q[0], p[1] - q[1]), d = Math.hypot(m[0], m[1]) || 1;
        out.push([m[0] - (m[0] / d) * L * 0.12, m[1] - (m[1] / d) * L * 0.12]);
      }
    }
    out.push(k ? [...p, 1] : p);
  });
  return out;
}
function rigHairstyle(def) {
  const H = RIG_HEAD, vol = def.vol != null ? def.vol : 3;
  const a0 = Math.atan2(H.sideburnF[0][1], H.sideburnF[0][0]) / RIG.D2R, end = H.nape[H.nape.length - 1], a1 = Math.atan2(end[1], end[0]) / RIG.D2R - 360;
  let arc, valleys = [];
  if (def.edge) {
    arc = [rigPolar(a0, H.r + 0.4), ...rigEdgePts(def.edge), rigPolar(a1, H.r + 0.6)];
    valleys = def.edge.filter((e) => e[2] === 'v').map(([a, r]) => rigPolar(a, r));
  } else {
    // the skull pushed out by vol (more on top)
    arc = [];
    for (let i = 0; i <= 20; i++) {
      const a = a0 + ((a1 - a0) * i) / 20, up = Math.max(0, -Math.sin(a * RIG.D2R)), rr = H.r + vol * (0.55 + 0.45 * up) * (i === 0 || i === 20 ? 0.4 : 1);
      arc.push(rigPolar(a, rr));
    }
  }
  // the nape edge sits half a unit past the canonical nape line, on the neck side: no bald sliver
  const nape = H.nape.slice().reverse().slice(1, -1).map((p) => [p[0] + 0.45, p[1] - 0.23]), m = arc.length - 1;
  const scalp = { kind: 'shape', layer: 'scalp', z: -10, valleys, pts: [[...arc[0].slice(0, 2), 1], ...arc.slice(1, -1), [...arc[m].slice(0, 2), 1], ...nape, [...H.sideburnN[1], 1], [...H.sideburnN[0], 1], ...H.hairline.slice(1, -1), [...H.hairline[H.hairline.length - 1], 1]] };
  // the radius of the solid mass at an angle (not counting the spikes): where strands and gloss may go
  const outer = def.edge
    ? (a) => Math.min(...def.edge.filter(([x]) => Math.abs(x - a) <= 20).map(([, r]) => r).concat([H.r + 14]))
    : (a) => H.r + vol * (0.55 + 0.45 * Math.max(0, -Math.sin(a * RIG.D2R)));
  const locks = (list, layer) => (list || []).map((s, i) => Object.assign(rigLock(s, layer), { i })).sort((a, b) => a.z - b.z);
  const L = { back: locks(def.back, 'back'), crown: locks(def.crown, 'crown'), sides: locks(def.sides, 'sides'), bangs: locks(def.bangs, 'bangs'), strands: locks(def.strands, 'strands') };
  // an authored fringe: its lower edge over the face as points [x, y, 't' a bang's tip | 'v' the gap
  // between two bangs | '' smooth], from the near side to the far side; its top is the canonical
  // hairline pulled 4 units into the scalp (so it always grows from the hairline)
  if (def.fringe) {
    const F = def.fringe, top = H.hairline.map((p) => { const c = H.crown, l = Math.hypot(c[0] - p[0], c[1] - p[1]); return [p[0] + ((c[0] - p[0]) / l) * 4, p[1] + ((c[1] - p[1]) / l) * 4]; });
    const xs = [F[0][0], F[F.length - 1][0]], inside = top.filter((p) => p[0] > xs[0] - 1 && p[0] < xs[1] + 1).reverse();
    L.bangs.unshift({ kind: 'shape', layer: 'bangs', z: -1, fringe: F, valleys: F.filter((e) => e[2] === 'v').map((e) => [e[0], e[1]]),
      pts: [...F.map(([x, y, k]) => (k ? [x, y, 1] : [x, y])), ...inside] });
  }
  // an authored back mass: its outer edge, closed through the inside of the head (hidden by it)
  if (def.backEdge) {
    const E = def.backEdge, first = E[0][0], last = E[E.length - 1][0];
    const pts = [rigPolar(first + 8, 8), ...rigEdgePts(E), rigPolar(last - 8, 8)];
    L.back.unshift({ kind: 'shape', layer: 'back', z: -5, pts, valleys: E.filter((e) => e[2] === 'v').map(([a, r]) => rigPolar(a, r)), edge: E });
  }
  const hairAtt = (layer, shapes) => ({ hair: { kind: 'hair', layer, shapes } });
  const att = {
    hairBack: hairAtt('back', L.back),
    'hair.scalp': { hair: { kind: 'hair', layer: 'scalp', vol, outer, smooth: !!def.smooth || !!def.edge, shapes: [...L.crown.filter((x) => x.z < 0), scalp, ...L.crown.filter((x) => x.z >= 0)] } },
    'hair.sides': hairAtt('sides', L.sides),
    'hair.bangs': hairAtt('bangs', L.bangs),
    'hair.strands': hairAtt('strands', L.strands),
  };
  // optional: the fringe's shadow on the forehead (off in the reference style); a cut over the ears hides the ear
  if (def.foreheadShadow) att.hairShade = { hair: { kind: 'hairShade', shapes: [scalp, ...L.bangs, ...L.sides] } };
  if (def.ears === false) att.ear = { ear: null };
  return { name: 'hair:' + def.id, id: def.id, label: def.name, pal: rigHairPalette(def.c), att, meta: { head: def.head, coverEye: def.coverEye || null, def, scalp, locks: L } };
}

/* ---------------------------------------------------------------- drawing */
// The drawing rules match the validated reference sheet: one black outline around the mass (the
// body's line), each lock cel-shaded like the body (one light, upper left), thin black lines along
// the edges of the locks towards their tips (they only show where a lock lies over other hair),
// a few flow lines on the dome, glossy streaks on the lit side. No cast shadow on the forehead.
const RIG_LIGHT_DIR = [-0.6, -0.8];   // towards the light (upper left)
const RIG_HAIR_CEL = 0.62;            // the cel offset of hair, relative to the body's
// Thin tapered lines along both edges of a lock, from t0 to the tip.
function rigEdgeLines(k, t0) {
  const { L, R, N, S, n } = k, i0 = Math.max(1, Math.round(n * (t0 || 0.42)));
  let d = '';
  for (const [side, s] of [[L, -1], [R, 1]]) {
    const out = [], inn = [];
    for (let i = i0; i < n; i++) { const f = (i - i0) / (n - i0), w = 0.95 * Math.sin(Math.PI * Math.min(1, f * 0.75 + 0.12)); out.push(side[i]); inn.push([side[i][0] + s * N[i][0] * w, side[i][1] + s * N[i][1] * w]); }
    const end = k.spec.tip === 'blunt' ? side[n] : S[n];
    d += RIG.curve([[...out[0], 1], ...out.slice(1), [...end, 1], ...inn.slice(1).reverse()], true);
  }
  return d;
}
// A tapered stroke along a polyline (thin at both ends), as a closed shape.
function rigStreak(P, w) {
  const out = [], inn = [], n = P.length - 1;
  for (let i = 0; i <= n; i++) {
    const a = P[Math.max(0, i - 1)], b = P[Math.min(n, i + 1)], l = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1, nx = -(b[1] - a[1]) / l, ny = (b[0] - a[0]) / l;
    const h = (w / 2) * Math.sin((Math.PI * (i + 0.15)) / (n + 0.3));
    out.push([P[i][0] + nx * h, P[i][1] + ny * h]); inn.push([P[i][0] - nx * h, P[i][1] - ny * h]);
  }
  out[0].push(1); out[n].push(1);
  return RIG.curve([...out, ...inn.slice(1, -1).reverse()], true);
}
// Strands on the dome: curves leaving the crown towards the hairline and the back.
function rigDomeLines(outer) {
  const c = RIG_HEAD.crown;
  let d = '';
  for (const [a, k] of [[-62, 0.72], [-34, 0.62], [-168, 0.66]]) {
    const end = rigPolar(a, outer(a) - 2.4), P = [];
    for (let i = 0; i <= 6; i++) { const t = 0.22 + (k - 0.22) * (i / 6) * 1.25; P.push([c[0] + (end[0] - c[0]) * t + Math.sin(Math.PI * t) * 1.6, c[1] + (end[1] - c[1]) * t - Math.sin(Math.PI * t) * 1.2]); }
    d += rigStreak(P, 0.9);
  }
  return d;
}
// The gloss of the dome: two streaks on its upper left, along the flow from the crown.
function rigDomeGloss(outer) {
  const c = RIG_HEAD.crown;
  let d = '';
  for (const [a, r0, r1, w] of [[-142, 0.4, 0.84, 2.4], [-114, 0.48, 0.8, 1.7]]) {
    const e = rigPolar(a, outer(a) - 1.5), P = [];
    for (let i = 0; i <= 6; i++) { const t = r0 + (r1 - r0) * (i / 6); P.push([c[0] + (e[0] - c[0]) * t, c[1] + (e[1] - c[1]) * t]); }
    d += rigStreak(P, w);
  }
  return d;
}
// Between two spikes of an authored edge: a thin line from the valley into the mass, towards the
// crown, thinning out (how the reference separates spikes).
function rigValleyLines(valleys) {
  const c = RIG_HEAD.crown;
  let d = '';
  for (const v of valleys) {
    const dx = c[0] - v[0], dy = c[1] - v[1], l = Math.hypot(dx, dy), k = Math.min(0.3, 8 / l), P = [];
    for (let i = 0; i <= 5; i++) P.push([v[0] + dx * k * (i / 5), v[1] + dy * k * (i / 5)]);
    const out = [], inn = [];
    P.forEach((p, i) => { const w = 0.62 * (1 - i / 5) + 0.05, nx = -dy / l, ny = dx / l; out.push([p[0] + nx * w, p[1] + ny * w]); inn.push([p[0] - nx * w, p[1] - ny * w]); });
    d += RIG.curve([[...out[0], 1], ...out.slice(1), [...P[5], 1], ...inn.slice(1).reverse(), [...inn[0], 1]], true);
  }
  return d;
}
// The gloss of a lock: a short streak near its root, on its lit side.
function rigLockGloss(k) {
  const m = Math.floor(k.n / 2), lit = k.N[m][0] * RIG_LIGHT_DIR[0] + k.N[m][1] * RIG_LIGHT_DIR[1] > 0, s = lit ? -1 : 1, P = [];
  for (let i = Math.round(k.n * 0.14); i <= Math.round(k.n * 0.46); i++) P.push([k.S[i][0] + s * k.N[i][0] * k.W[i] * 0.42, k.S[i][1] + s * k.N[i][1] * k.W[i] * 0.42]);
  return P.length > 2 ? rigStreak(P, Math.min(1.6, k.spec.w * 0.17)) : '';
}
// One lock (or the scalp), cel-shaded like the body: its shadow tone, the lit copy shifted towards
// the light, both cut to the lock; then its edge lines, then its gloss (so a lock painted later
// covers all of it). The scalp gets the dome's strands and gloss, cut to itself.
function rigPaintLock(k, F, ctx, base, sh, o) {
  const d = RIG.geomOf(k).d, id = ctx.uid + 'hk' + ctx.n++, off = RIG.rot([RIG.LIGHT[0] * RIG_HAIR_CEL, RIG.LIGHT[1] * RIG_HAIR_CEL], -F.r);
  let s = `<clipPath id="${id}"><path d="${d}"/></clipPath><g clip-path="url(#${id})"><path d="${d}" fill="${sh}"/><path d="${d}" fill="${base}" transform="translate(${RIG.f2(off[0])},${RIG.f2(off[1])})"/>`;
  if (k.valleys && k.valleys.length) s += `<path d="${rigValleyLines(k.valleys)}" fill="${ctx.line}"/>`;
  if (!k.S && k.layer === 'scalp' && o.front) s += (o.smooth ? '' : `<path d="${rigDomeLines(o.outer)}" fill="${ctx.line}" opacity=".85"/>`) + `<path d="${rigDomeGloss(o.outer)}" fill="${ctx.pal.hairHi}"/>`;
  s += '</g>';
  if (k.S && k.spec.len > 6) s += `<path d="${rigEdgeLines(k, k.spec.lines)}" fill="${ctx.line}"/>`;
  if (k.S && o.front && k.spec.len >= 11 && k.spec.gloss !== false && (k.spec.gloss || k.i % 2 === 0)) s += `<path d="${rigLockGloss(k)}" fill="${ctx.pal.hairHi}"/>`;
  return s;
}
// Hair is soft: where it would pass through the floor (a body lying down) it is pressed flat on it,
// i.e. cut at the floor line.
function rigHairFloor(svg, items, ctx) {
  const F = items[0].F;
  const low = Math.max(...items.flatMap((it) => it.a.shapes || [it.a]).flatMap((k) => RIG.geomOf(k).poly.map((p) => RIG.toWorld(F, p)[1])));
  if (low <= 0) return svg;
  const id = ctx.uid + 'fl' + ctx.n++;
  return `<clipPath id="${id}"><rect x="-1000" y="-1000" width="2000" height="1000.4"/></clipPath><g clip-path="url(#${id})">${svg}</g>`;
}
// The back mass: its own outline, the darker tone. Remembered for the front.
RIG.PAINTERS.hair = (items, ctx) => rigHairFloor(rigPaintHair(items, ctx), items, ctx);
// A haircut cut out of the reference sheet (js/rig-hair-assets.js): the picture on the skull.
RIG.PAINTERS.hairImage = (items, ctx) => rigHairFloor(items.map(RIG.imageTag).join(''), items, ctx);
function rigPaintHair(items, ctx) {
  const lw = ctx.lineW * 2, pal = ctx.pal, F = items[0].F, T = RIG.tf(F), front = items[0].a.layer !== 'back';
  const shapes = items.flatMap((it) => it.a.shapes);
  if (!shapes.length) return '';
  let outl = shapes.map((k) => `<path d="${RIG.geomOf(k).d}" fill="none" stroke="${ctx.line}" stroke-width="${lw}" stroke-linejoin="round"/>`).join('');
  const scalp = items.find((it) => it.a.layer === 'scalp'), o = { front, outer: scalp ? scalp.a.outer : null, smooth: scalp && scalp.a.smooth };
  const base = front ? pal.hair : pal.hairBack, sh = front ? pal.hairSh : RIG.shade(pal.hairSh, -0.12);
  const fill = shapes.map((k) => rigPaintLock(k, F, ctx, base, sh, o)).join('');
  if (!front) {
    ctx.hairBack = { T, d: shapes.map((k) => RIG.geomOf(k).d).join('') };
    return `<g transform="${T}">${outl}${fill}</g>`;
  }
  // the front mass: its outline is hidden where it lies over the back mass outside the head, so
  // scalp and back hair read as one silhouette
  const id = ctx.uid + 'hm' + ctx.n++;
  if (ctx.hairBack) {
    outl = `<mask id="${id}" maskUnits="userSpaceOnUse" x="-400" y="-400" width="800" height="800"><rect x="-400" y="-400" width="800" height="800" fill="#fff"/>`
      + `<g transform="${ctx.hairBack.T}"><path d="${ctx.hairBack.d}" fill="#000"/></g><g transform="${T}"><circle r="${RIG_HEAD.r}" fill="#fff"/></g></mask><g mask="url(#${id})"><g transform="${T}">${outl}</g></g>`;
  } else outl = `<g transform="${T}">${outl}</g>`;
  // where the hair lies on the face its line is as heavy as the silhouette's (outline + the sticker's
  // dark rim): a wider stroke under the fills, cut to the skull
  const fc = ctx.uid + 'hf' + ctx.n++, face = `<clipPath id="${fc}"><circle r="${RIG_HEAD.r}"/></clipPath><g clip-path="url(#${fc})">`
    + shapes.map((k) => `<path d="${RIG.geomOf(k).d}" fill="none" stroke="${ctx.line}" stroke-width="${RIG.f2(lw + 1.6)}" stroke-linejoin="round"/>`).join('') + '</g>';
  return outl + `<g transform="${T}">${face}${fill}</g>`;
};
// The fringe's shadow on the forehead: the hair over the face, shifted down, cut to the skull.
RIG.PAINTERS.hairShade = (items, ctx) => {
  const it = items[0], id = ctx.uid + 'hs' + ctx.n++, sk = RIG.colourOf('$skin', ctx.pal), sh = RIG.shade(sk, -0.22);
  const d = it.a.shapes.map((k) => RIG.geomOf(k).d).join('');
  return `<g transform="${RIG.tf(it.F)}"><clipPath id="${id}"><circle r="${RIG_HEAD.r - 0.2}"/></clipPath><g clip-path="url(#${id})"><path d="${d}" fill="${sh}" transform="translate(.7,2.6)"/></g></g>`;
};

/* ---------------------------------------------------------------- the reference hairstyle */
// Leaf Spikes: the reference every later hairstyle is measured against, built from the validated
// reference sheet (row Naruto, first cut), measured in head units on the sheet: a big spiky mass
// (ten tips, the valleys between them), darker spikes behind the head on the lower left, a side
// lock in front of the ear down to the cheek, three bangs (the long one sloping to between the
// eyes), the far side lock sticking out past the face. The ear shows.
const RIG_HAIR_DEFS = {
  leaf: {
    id: 'leaf', name: 'Leaf Spikes (recipe)', head: 2, c: '#f4cf3d',
    // overlap with its reference portrait at the same scale (head and hair silhouette, visible face)
    match: { sheet: '1,0', silhouette: 0.96, face: 0.9 },
    // measured on the black outline of the sheet (the white rim fills narrow valleys)
    edge: [
      [-15, 25, 'v'], [-22, 31.6, 't'], [-39, 29.6, 'v'], [-46.5, 38.4, 't'], [-65, 34.4],
      [-73, 42, 't'], [-86, 34.6, 'v'], [-103, 43.8, 't'], [-109, 36.6, 'v'], [-121, 44.2, 't'], [-125, 37.9, 'v'],
      [-134, 43.4, 't'], [-139.5, 36.4, 'v'], [-151, 44, 't'], [-159, 34, 'v'], [-173, 39.1, 't'], [-179, 30.7, 'v'],
      [-195, 25], [-212, 23], [-226, 21],
    ],
    backEdge: [[-174, 32], [-179, 30.5, 'v'], [-187, 33, 't'], [-189.5, 28, 'v'], [-200, 30.2, 't'], [-206, 25.6, 'v'], [-213, 26.4, 't'], [-222, 21]],
    sides: [
      { at: ['temple', 'N'], to: [-15.8, 6.6], w: 6.6, bend: 12, tip: 'spike', lines: 0.3 },
      { at: ['temple', 'F'], to: [24.4, -1.8], w: 7, bend: -10, tip: 'spike', lines: 0.3 },
    ],
    // the fringe's lower edge over the face, measured on the sheet: a bang left of the near eye, the
    // forehead showing above that eye, a long bang sloping to between the eyes, two small ones right
    fringe: [
      [-12.6, -2.9], [-11, -5.1], [-10, -7.3, 'v'], [-8.1, -3.9, 't'], [-6, -6.3], [-4, -9.7], [-2.2, -13.3], [-1, -14.2, 'v'],
      [1, -12.3], [3, -10.7], [5, -8.7], [7, -7.3], [8.6, -5.9, 't'], [9.6, -8.7], [10.8, -12.3, 'v'], [12.2, -10.7], [13.6, -8.3],
      [15, -6.0, 't'], [16.1, -6.8, 'v'], [17.1, -6.1, 't'], [18.4, -3.9],
    ],
  },
};
const RIG_HAIRS = { leaf: rigHairstyle(RIG_HAIR_DEFS.leaf) };
const RIG_HAIR_REF = 'leaf';   // the reference hairstyle

/* ---------------------------------------------------------------- hair checks */
// Measured on the compiled hairstyle, against RIG_HEAD. Bangs may be chunky (the reference sheet's are).
const RIG_HAIR_LIMITS = { back: [6, 16], crown: [6, 15], sides: [3.5, 10], bangs: [4.5, 14], strands: [1.5, 4.5], dev: 60, spike: [4, 36] };
function RIG_HAIR_CHECK(skin, skins) {
  const out = [], H = RIG_HEAD, M = skin.meta || {}, L = M.locks || {}, IN = RIG_CHECK.inside;
  const R = (id, name, bad, ok) => ({ id, group: 'Hair', name, status: bad.length ? 'fail' : 'pass', detail: bad.join('; ') || ok || '' });
  if (M.image) return rigHairImageCheck(skin, R);
  const polys = (layers) => layers.flatMap((l) => (l === 'scalp' ? [M.scalp, ...(L.crown || [])] : L[l] || [])).filter(Boolean).map((k) => RIG.geomOf(k).poly);
  const front = polys(['scalp', 'sides', 'bangs', 'strands']);
  // 1 the five layers (strands optional)
  const miss = ['back', 'sides', 'bangs'].filter((l) => !(L[l] || []).length).concat(M.scalp ? [] : ['scalp']);
  out.push(R('hair.layers', 'Back mass, scalp, side locks and bangs are all there', miss.map((m) => `no ${m} layer`), `back ${(L.back || []).length} · crown ${(L.crown || []).length} · sides ${(L.sides || []).length} · bangs ${(L.bangs || []).length} · strands ${(L.strands || []).length}`));
  // 2 built on this head reference, in the hair slots only
  const slotsOk = Object.keys(skin.att || {}).filter((s) => !['hairBack', 'hairShade', 'hair.scalp', 'hair.sides', 'hair.bangs', 'hair.strands', 'ear'].includes(s));
  out.push(R('hair.anchor', 'Attached to the skull, built on head reference v' + H.version, [...(M.head !== H.version ? [`made for head v${M.head}`] : []), ...slotsOk.map((s) => `draws in slot ${s}`)], 'all layers ride the skull bone (the back mass on its spring)'));
  // 3 no bald spot: every point of the scalp region is under hair
  const bald = [];
  for (let x = -18; x <= 18; x += 1.5) for (let y = -18.5; y <= 16; y += 1.5) {
    const p = [x, y];
    if (Math.hypot(x, y) > H.r - 0.8 || !IN(p, RIG_SCALP)) continue;
    if (!front.some((q) => IN(p, q))) bald.push(p);
  }
  out.push(R('hair.coverage', 'No bald spot on the scalp', bald.length ? [`${bald.length} scalp points uncovered (first at ${bald[0].map((v) => v.toFixed(1)).join(', ')})`] : [], 'the scalp region is covered everywhere'));
  // 4 the scalp is cut on the canonical hairline: hair just above it, forehead just below it
  // (measured across the line: along its normal, on both sides)
  const line = [];
  for (let i = 1; i < 12; i++) {
    const u = i / 12, p = rigAlong(H.hairline, u), a = rigAlong(H.hairline, u - 0.01), b = rigAlong(H.hairline, u + 0.01);
    const l = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1, n = [(b[1] - a[1]) / l, -(b[0] - a[0]) / l];   // towards the scalp
    const up = [p[0] + n[0] * 1.2, p[1] + n[1] * 1.2], down = [p[0] - n[0] * 1.4, p[1] - n[1] * 1.4];
    if (!IN(up, RIG.geomOf(M.scalp).poly)) line.push(`scalp missing above the hairline at u ${u.toFixed(2)}`);
    if (IN(down, RIG.geomOf(M.scalp).poly)) line.push(`scalp below the hairline at u ${u.toFixed(2)}`);
  }
  out.push(R('hair.hairline', 'The scalp follows the canonical hairline', line, 'cut on the hairline over its whole length'));
  // 5 the eyes stay visible (unless the cut is meant to hide one)
  const eyes = [];
  for (const k of ['N', 'F']) {
    if (M.coverEye === k) continue;
    const E = H.eyes[k];
    let hit = 0;
    for (let i = 0; i < 24; i++) { const a = (i / 24) * Math.PI * 2; for (const f of [0.4, 1]) if (front.some((q) => IN([E.c[0] + Math.cos(a) * E.rx * f, E.c[1] + Math.sin(a) * E.ry * f], q))) hit++; }
    if (hit) eyes.push(`hair over the ${k === 'N' ? 'near' : 'far'} eye (${hit} points)`);
  }
  out.push(R('hair.eyes', 'Bangs and locks leave the eyes visible', eyes, 'both eyes clear'));
  // 6 growth: roots on the scalp, directions along the flow. The back mass grows from the back of
  // the head, which this view hides: its roots must be behind the skull or under the scalp's hair.
  const grow = [], scalpPoly = RIG.geomOf(M.scalp).poly;
  for (const layer of ['back', 'crown', 'sides', 'bangs', 'strands']) for (const k of L[layer] || []) {
    if (!k.spec) continue;   // an authored edge (no root): checked below with the spikes
    const near = layer === 'back'
      ? Math.hypot(k.root[0], k.root[1]) <= H.r || IN(k.root, scalpPoly)
      : IN(k.root, RIG_SCALP) || RIG_SCALP.some((q) => Math.hypot(q[0] - k.root[0], q[1] - k.root[1]) < 2.6);
    if (!near) grow.push(`${layer} lock rooted off the scalp at ${k.root.map((v) => v.toFixed(1)).join(', ')}`);
    if (k.flow !== 'free' && Math.abs(RIG.wrap(k.dir - k.ref)) > RIG_HAIR_LIMITS.dev) grow.push(`${layer} lock leaves ${Math.round(Math.abs(RIG.wrap(k.dir - k.ref)))}° off the growth direction`);
  }
  out.push(R('hair.growth', 'Locks grow from the scalp along the growth direction', grow, `every root on the scalp, every lock within ${RIG_HAIR_LIMITS.dev}° of its flow`));
  // 7 strand thickness: within the layer's range, tapering to the tip; on an authored edge every
  // spike is wider than a strand and narrower than a mass at its base, and stands out of its valleys
  const thick = [];
  for (const layer of ['back', 'crown', 'sides', 'bangs', 'strands']) for (const k of L[layer] || []) {
    if (!k.spec) continue;
    const [lo, hi] = RIG_HAIR_LIMITS[layer];
    if (k.spec.w < lo || k.spec.w > hi) thick.push(`${layer} lock ${k.spec.w} wide (allowed ${lo}–${hi})`);
    if (k.spec.tip !== 'blunt' && k.W[k.n] > k.W[0] * 0.4) thick.push(`${layer} lock does not taper`);
  }
  const [slo, shi] = RIG_HAIR_LIMITS.spike;
  for (const [nm, E] of [['scalp', M.def && M.def.edge], ['back', M.def && M.def.backEdge]]) {
    if (!E) continue;
    E.forEach(([a, r, k], i) => {
      if (k !== 't') return;
      let lo = i - 1, hi = i + 1;
      while (lo > 0 && E[lo][2] !== 'v') lo--;
      while (hi < E.length - 1 && E[hi][2] !== 'v') hi++;
      const p = rigPolar(E[lo][0], E[lo][1]), q = rigPolar(E[hi][0], E[hi][1]), base = Math.hypot(p[0] - q[0], p[1] - q[1]);
      if (base < slo || base > shi) thick.push(`${nm} spike at ${a}° is ${base.toFixed(1)} wide at its base (allowed ${slo}–${shi})`);
      if (r <= Math.max(E[lo][1], E[hi][1])) thick.push(`${nm} spike at ${a}° does not stand out of its valleys`);
    });
  }
  // a fringe's bangs hang down: each tip lower than the gaps beside it
  const F = M.def && M.def.fringe;
  if (F) F.forEach(([x, y, k], i) => {
    if (k !== 't') return;
    const gaps = F.filter((e, j) => e[2] === 'v' && Math.abs(j - i) <= 3);
    if (gaps.some((g) => g[1] >= y)) thick.push(`fringe bang at x ${x} does not hang below its gaps`);
  });
  out.push(R('hair.thickness', 'Lock and spike widths within range, tapering', thick, 'widths in range, every lock tapers, every spike stands out'));
  // 8 a clean silhouette: nothing absurdly far from the head, no broken shape
  const sil = [];
  for (const q of [...front, ...polys(['back'])]) {
    if (q.some((p) => !isFinite(p[0]) || !isFinite(p[1]))) sil.push('a shape has no coordinates');
    const m = Math.max(...q.map((p) => Math.hypot(p[0], p[1])));
    if (m > H.r * 2.6) sil.push(`a shape reaches ${m.toFixed(1)} from the skull centre (max ${(H.r * 2.6).toFixed(1)})`);
  }
  out.push(R('hair.silhouette', 'Silhouette within bounds', sil, `everything within ${(H.r * 2.6).toFixed(0)} of the skull centre`));
  // 9 in motion: the back mass swings on its spring, but the base of every tuft must stay hidden
  // under the head or the scalp (else a tuft comes loose from the head)
  if (skins && typeof RIG_ANIMS !== 'undefined') {
    const ch = new RIG.Character(RIG_SKELETON, skins, RIG_ANIMS), gaps = [];
    let swing = 0;
    for (const name of ['run', 'attack', 'hit', 'death']) {
      ch.state.play(name, { loop: name !== 'death' });
      for (let f = 0; f < 100 && !gaps.length; f++) {
        ch.tick(1 / 60);
        const P = ch.pose, sk = RIG.frameOf(P, P.c.idx.skull), hb = RIG.frameOf(P, P.c.idx.hairBack);
        swing = Math.max(swing, Math.abs(RIG.wrap(hb.r - sk.r)));
        const toSkull = (q) => { const w = RIG.toWorld(hb, q); return RIG.rot([w[0] - sk.x, w[1] - sk.y], -sk.r); };
        for (const k of L.back || []) for (const i of [0, 1, 2]) {
          if (!k.S) break;   // an authored back edge is closed inside the head: its base never shows
          const p = toSkull(k.S[i]);
          if (Math.hypot(p[0], p[1]) > H.r + 0.3 && !front.some((q) => IN(p, q))) { gaps.push(`${name}: the base of a back tuft shows at frame ${f}`); break; }
        }
      }
    }
    out.push(R('hair.motion', 'The hair stays on the head in motion', gaps, `run, attack, hit and death with the spring active (it swings up to ${swing.toFixed(1)}°): every tuft stays rooted`));
  }
  return out;
}
// A haircut picture (js/hair-cuts.js), fitted to the rig's head by HAIR_FIT. The fit is measured on
// the morphed picture (m: { eyes, top, rim, face }); the Lab fits every cut before it checks.
const RIG_HAIR_IMAGE_LIMITS = { eye: 0.03, hidden: 0.85, face: 0.4, perHiddenEye: 0.15, top: 0.6, rim: 0.85 };
function rigHairImageCheck(skin, R, m) {
  const H = RIG_HEAD, A = skin.meta.image, out = [], ids = Object.keys(skin.att || {}), L = RIG_HAIR_IMAGE_LIMITS;
  const slots = ids.filter((s) => !['hair.scalp', 'ear'].includes(s)), a = skin.att['hair.scalp'] && skin.att['hair.scalp'].hair;
  if (m === undefined && typeof HAIR_FIT !== 'undefined' && HAIR_CUTS[skin.id] === A) { const f = HAIR_FIT.get(skin.id, 'rig'); m = f && f.measure; }
  const pc = (v) => Math.round(v * 100) + ' %', covers = A.covers || '';
  out.push(R('hair.anchor', 'Attached to the skull, cut on head reference v' + H.version, [...(skin.meta.head !== H.version ? [`made for head v${skin.meta.head}`] : []), ...slots.map((x) => `draws in slot ${x}`), ...(a ? [] : ['no picture on the skull'])], `the picture rides the skull bone (sheet cell ${A.sheet})`));
  out.push(R('hair.layers', 'Front and back layering', [], 'one picture drawn over the head, seen from the front; the rig draws the ear over it' + (A.ear ? '' : ' — hidden: this cut covers it')));
  out.push(R('hair.fit', 'Fitted to this head (turned, fringe lifted off the eyes, pulled onto the skull)', m ? [] : ['the picture could not be fitted here (the page cannot read it: open the Lab over http)'], m ? 'morphed for the rig\'s head' : ''));
  if (m) {
    // an eye is either clear (the rig draws it, with every expression) or, when the cut is made to hide
    // it (covers 'N' / 'F', like a curtain over one eye), hidden whole; never half covered
    const eyes = m.eyes.map((v, i) => {
      const side = i ? 'far' : 'near';
      if (covers.includes('NF'[i])) return v < L.hidden ? `the ${side} eye is meant to be hidden but only ${pc(v)} is` : '';
      return v > L.eye ? `hair over the ${side} eye (${pc(v)})` : '';
    }).filter(Boolean);
    out.push(R('hair.eyes', 'Eyes clear (the rig draws them, with every expression), or hidden whole by design', eyes, `eyes covered ${pc(m.eyes[0])} / ${pc(m.eyes[1])}${covers ? ` · hidden by the cut: ${covers.split('').map((k) => (k === 'N' ? 'near' : 'far')).join(', ')} eye` : ''}`));
    const faceLim = L.face + L.perHiddenEye * covers.length;
    const bad = [...(m.face > faceLim ? [`hair over ${pc(m.face)} of the face`] : []), ...(m.top < L.top ? [`only ${pc(m.top)} of the scalp under hair`] : []), ...(m.rim < L.rim ? [`the skull's outline shows through the hair (${pc(1 - m.rim)} of the scalp's rim)`] : [])];
    out.push(R('hair.align', 'Sits on the head: face open, scalp and its rim covered', bad, `face covered ${pc(m.face)}, scalp ${pc(m.top)}, scalp rim ${pc(m.rim)}`));
  }
  const far = !a ? 0 : a.reach != null ? a.reach : Math.max(...[[a.x, a.y], [a.x + a.w, a.y], [a.x, a.y + a.h], [a.x + a.w, a.y + a.h]].map((p) => Math.hypot(p[0], p[1])));
  out.push(R('hair.silhouette', 'Within bounds', far > H.r * 3.2 ? [`reaches ${far.toFixed(1)} from the skull centre`] : [], `its hair reaches ${far.toFixed(1)} (max ${(H.r * 3.2).toFixed(1)})`));
  out.push(R('hair.motion', 'Stays on the head in motion', [], 'rigid on the skull; pressed flat on the floor when lying down'));
  return out;
}
// Faults the hair checks must catch.
function RIG_HAIR_SELFTEST() {
  const D = RIG_HAIR_DEFS[RIG_HAIR_REF], mk = (over) => rigHairstyle(Object.assign({}, D, over, { id: 'bad' })), fails = (skin, id) => RIG_HAIR_CHECK(skin).some((r) => r.id === id && r.status === 'fail');
  const moved = mk({});
  moved.meta.scalp = Object.assign({}, moved.meta.scalp, { pts: moved.meta.scalp.pts.map((p) => [p[0], p[1] + 4, p[2]]) });
  return [
    ['Hairstyle without side locks', 'hair.layers', () => fails(mk({ sides: [] }), 'hair.layers')],
    ['Scalp slid 4 units down the face (misaligned)', 'hair.hairline', () => fails(moved, 'hair.hairline')],
    ['Scalp too small: a bald spot', 'hair.coverage', () => fails(mk({ edge: null, vol: -6, crown: [] }), 'hair.coverage')],
    ['Bangs falling over the eyes', 'hair.eyes', () => fails(mk({ fringe: D.fringe.map(([x, y, k]) => [x, y + 9, k]) }), 'hair.eyes')],
    ['A lock rooted in the middle of the face', 'hair.growth', () => fails(mk({ strands: [{ at: ['crown', 10, 18], flow: 'free', dir: 90, len: 6, w: 3 }] }), 'hair.growth')],
    ['A bang growing upwards against the flow', 'hair.growth', () => fails(mk({ bangs: [{ at: ['hairline', 0.3], turn: -170, len: 10, w: 8 }] }), 'hair.growth')],
    ['A lock 20 units wide', 'hair.thickness', () => fails(mk({ sides: [Object.assign({}, D.sides[0], { w: 20 })] }), 'hair.thickness')],
    ['A spike thinner than a strand', 'hair.thickness', () => { const i = D.edge.findIndex((e) => e[2] === 't'), [a, r] = D.edge[i], E = D.edge.slice(); E.splice(i + 1, 0, [a - 1, r - 4, 'v'], [a - 2, r, 't'], [a - 3, r - 4, 'v']); return fails(mk({ edge: E }), 'hair.thickness'); }],
    ['Made for another head', 'hair.anchor', () => fails(mk({ head: 99 }), 'hair.anchor')],
    ...(typeof rigHairAsset === 'function' ? (() => {
      const pic = rigHairAsset('x', { name: 'x', sheet: '0,0', x: -40, y: -40, w: 70, h: 60, ear: true, reach: 40 });
      const hid = rigHairAsset('x', { name: 'x', sheet: '0,0', x: -40, y: -40, w: 70, h: 60, ear: true, covers: 'F', reach: 40 });
      const R0 = (id, n, bad) => ({ id, status: bad.length ? 'fail' : 'pass' }), ok = { eyes: [0, 0], top: 1, rim: 1, face: 0.1 };
      const f = (skin, m, id) => rigHairImageCheck(skin, R0, Object.assign({}, ok, m)).some((r) => r.id === id && r.status === 'fail');
      return [
        ['A picture whose fringe stays on an eye', 'hair.eyes', () => f(pic, { eyes: [0.3, 0] }, 'hair.eyes')],
        ['A picture that half hides the eye it is meant to hide', 'hair.eyes', () => f(hid, { eyes: [0, 0.5] }, 'hair.eyes')],
        ['A picture sliding off the head (skull top bare)', 'hair.align', () => f(pic, { top: 0.4, face: 0.6 }, 'hair.align')],
        ['A picture that leaves the skull\'s outline showing', 'hair.align', () => f(pic, { rim: 0.6 }, 'hair.align')],
        ['A picture that could not be fitted', 'hair.fit', () => rigHairImageCheck(pic, R0, null).some((r) => r.id === 'hair.fit' && r.status === 'fail')],
      ];
    })() : []),
  ];
}
