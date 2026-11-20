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
const RIG_HEAD = {
  version: 1,
  r: 19,
  // the face: what hair may frame but not cover (boxes a little larger than the drawn eyes)
  eyes: { N: { c: [-2, 2], rx: 2.6, ry: 3.6 }, F: { c: [9.5, 2], rx: 2.3, ry: 3.4 } },
  midline: 3.6,                 // the centre of the forehead (3/4 view)
  browY: -4,
  // the hairline, from the near temple (left) over the forehead to the far temple (right)
  hairline: [[-16.4, -3.6], [-13.2, -8.4], [-7.6, -11.4], [-1.4, -12.6], [3.6, -12.8], [8.6, -12.2], [13, -10], [16.2, -6.8], [17.6, -3.2]],
  sideburnN: [[-16.4, -3.6], [-17.6, 2.6]],   // in front of the near ear
  sideburnF: [[17.6, -3.2], [18.4, 1.6]],     // the far temple, at the edge of the face
  temples: { N: [-15.4, -6.2], F: [16.9, -6.4] },   // where side locks grow: just inside the hairline at each temple
  nape: [[-17.6, 2.6], [-15.6, 10], [-11, 15.4]],   // behind the near ear, down to the back of the neck
  crown: [-7, -16.5],           // the whorl: hair leaves it in every direction
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
  return [...P, ...H.nape.slice().reverse().slice(1), ...H.sideburnN.slice().reverse().slice(1), ...H.hairline.slice(0, -1)];
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
};
// A lock: spec { at, flow ('fall'|'stand'|'free'), turn (degrees from the flow), dir (absolute, for
// 'free'), len, w, bend (degrees of curl over its length), s (an S: extra curl that reverses), tip, z }.
function rigLock(spec, layer) {
  const root = rigRoot(spec.at), flow = spec.flow || (layer === 'back' || layer === 'crown' ? 'stand' : 'fall');
  const ref = flow === 'free' ? null : rigFlow(root, flow), dir = spec.dir != null ? spec.dir : ref + (spec.turn || 0);
  const n = 10, step = spec.len / n, S = [root.slice()], bend = spec.bend || 0, s = spec.s || 0;
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
// One base colour gives the whole palette: shadows lean towards blue-violet, the back mass is a
// shade darker so the front reads in front, the line is the darkest tone of the hair itself.
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
  const [h, s, l] = toHsl(c), toV = (k) => (h + RIG.wrap(255 - h) * k + 360) % 360, dark = l < 0.25;
  return {
    hair: c,
    hairBack: hsl(toV(0.08), s, dark ? l * 0.78 : l - 0.08),
    hairSh: hsl(toV(dark ? 0.18 : 0.1), Math.min(1, s * 0.95 + 0.05), dark ? l * 0.6 : l - 0.14),
    hairHi: hsl(h, s * (dark ? 0.4 : 0.8), dark ? l + 0.2 : l + (1 - l) * 0.45),
    hairLine: hsl(toV(0.15), Math.min(1, s + 0.12), Math.min(0.17, l * 0.3)),
  };
}

/* ---------------------------------------------------------------- hairstyles */
// A hairstyle recipe: { id, name, head (reference version), c (colour), vol (scalp off the skull),
// back, crown, sides, bangs, strands: [lock specs], coverEye: 'N'|'F' (a fringe meant to hide an eye) }.
// Compiled into a skin: one attachment per layer slot, plus the fringe's shadow on the forehead.
function rigHairstyle(def) {
  const H = RIG_HEAD, vol = def.vol != null ? def.vol : 3;
  // the scalp: the skull pushed out by vol (more on top), closed exactly on the canonical hairline
  const arc = [], a0 = Math.atan2(H.sideburnF[0][1], H.sideburnF[0][0]) / RIG.D2R, end = H.nape[H.nape.length - 1], a1 = Math.atan2(end[1], end[0]) / RIG.D2R - 360;
  for (let i = 0; i <= 20; i++) {
    const a = a0 + ((a1 - a0) * i) / 20, up = Math.max(0, -Math.sin(a * RIG.D2R)), rr = H.r + vol * (0.55 + 0.45 * up) * (i === 0 || i === 20 ? 0.4 : 1);
    arc.push([Math.cos(a * RIG.D2R) * rr, Math.sin(a * RIG.D2R) * rr]);
  }
  // the nape edge sits half a unit past the canonical nape line, on the neck side: no bald sliver
  const nape = H.nape.slice().reverse().slice(1, -1).map((p) => [p[0] + 0.45, p[1] - 0.23]);
  const scalp = { kind: 'shape', layer: 'scalp', z: -10, pts: [[...arc[0], 1], ...arc.slice(1, -1), [...arc[20], 1], ...nape, [...H.sideburnN[1], 1], [...H.sideburnN[0], 1], ...H.hairline.slice(1, -1), [...H.hairline[H.hairline.length - 1], 1]] };
  const locks = (list, layer) => (list || []).map((s) => rigLock(s, layer)).sort((a, b) => a.z - b.z);
  const L = { back: locks(def.back, 'back'), crown: locks(def.crown, 'crown'), sides: locks(def.sides, 'sides'), bangs: locks(def.bangs, 'bangs'), strands: locks(def.strands, 'strands') };
  const hairAtt = (layer, shapes) => ({ hair: { kind: 'hair', layer, shapes } });
  const att = {
    hairBack: hairAtt('back', L.back),
    'hair.scalp': { hair: { kind: 'hair', layer: 'scalp', vol, shapes: [...L.crown.filter((x) => x.z < 0), scalp, ...L.crown.filter((x) => x.z >= 0)] } },
    'hair.sides': hairAtt('sides', L.sides),
    'hair.bangs': hairAtt('bangs', L.bangs),
    'hair.strands': hairAtt('strands', L.strands),
    hairShade: { hair: { kind: 'hairShade', shapes: [scalp, ...L.bangs, ...L.sides] } },
  };
  return { name: 'hair:' + def.id, id: def.id, label: def.name, pal: rigHairPalette(def.c), att, meta: { head: def.head, coverEye: def.coverEye || null, def, scalp, locks: L } };
}

/* ---------------------------------------------------------------- drawing */
const RIG_LIGHT_DIR = [-0.6, -0.8];   // towards the light (upper left)
// The shadow wedge of a lock: on its side away from the light, widening from a third of the way to the tip.
function rigWedge(k) {
  const { L, R, N, W, S, n } = k, m = Math.floor(n / 2), lit = N[m][0] * RIG_LIGHT_DIR[0] + N[m][1] * RIG_LIGHT_DIR[1] > 0;
  const side = lit ? R : L, s = lit ? 1 : -1, i0 = Math.round(n * 0.25), edge = [], inner = [];
  for (let i = i0; i < n; i++) {
    const f = Math.min(0.78, 0.15 + 0.62 * ((i - i0) / (n - i0)));
    edge.push(side[i]); inner.push([side[i][0] + s * N[i][0] * W[i] * 2 * f, side[i][1] + s * N[i][1] * W[i] * 2 * f]);
  }
  const tip = k.spec.tip === 'blunt' ? [[...side[n], 1], [...S[n], 1]] : [[...S[n], 1]];
  return RIG.curve([[...edge[0], 1], ...edge.slice(1), ...tip, ...inner.slice(1).reverse(), [...inner[0], 1]], true);
}
// A tapered brush line on the lit edge, from the middle to the tip (how manga separates locks).
function rigEdgeLine(k) {
  const { L, R, N, S, n } = k, m = Math.floor(n / 2), lit = N[m][0] * RIG_LIGHT_DIR[0] + N[m][1] * RIG_LIGHT_DIR[1] > 0;
  const side = lit ? L : R, s = lit ? -1 : 1, i0 = Math.round(n * 0.45), out = [], inn = [];
  for (let i = i0; i < n; i++) { const f = (i - i0) / (n - i0), w = 0.75 * Math.sin(Math.PI * Math.min(1, f * 0.85 + 0.08)); out.push(side[i]); inn.push([side[i][0] + s * N[i][0] * w, side[i][1] + s * N[i][1] * w]); }
  const end = k.spec.tip === 'blunt' ? side[n] : S[n];
  return RIG.curve([[...out[0], 1], ...out.slice(1), [...end, 1], ...inn.slice(1).reverse()], true);
}
// The highlight ring: two tapered crescents following the skull on the lit side.
function rigHalo(vol) {
  const rr = RIG_HEAD.r + vol * 0.45 - 2.6, marks = [[-158, 40, 1.5], [-112, 16, 1]], P2 = (a, r) => [Math.cos(a * RIG.D2R) * r, Math.sin(a * RIG.D2R) * r];
  let d = '';
  for (const [a0, span, th] of marks) {
    const P = [];
    for (let k = 0; k <= 8; k++) P.push(P2(a0 + (span * k) / 8, rr + th * Math.sin((Math.PI * k) / 8)));
    for (let k = 8; k >= 0; k--) P.push(P2(a0 + (span * k) / 8, rr - th * 0.5 * Math.sin((Math.PI * k) / 8)));
    d += 'M' + P.map(RIG.P2).join('L') + 'Z';
  }
  return d;
}
// The back mass: its own outline, the darker tone, shadow wedges. Remembered for the front.
RIG.PAINTERS.hair = (items, ctx) => {
  const lw = ctx.lineW * 2, pal = ctx.pal, T = RIG.tf(items[0].F), front = items[0].a.layer !== 'back';
  const shapes = items.flatMap((it) => it.a.shapes);
  if (!shapes.length) return '';
  let outl = shapes.map((k) => `<path d="${RIG.geomOf(k).d}" fill="none" stroke="${pal.hairLine}" stroke-width="${lw}" stroke-linejoin="round"/>`).join('');
  let fill = '';
  for (const k of shapes) {
    const d = RIG.geomOf(k).d;
    fill += `<path d="${d}" fill="${front ? pal.hair : pal.hairBack}"/>`;
    if (k.S) { fill += `<path d="${rigWedge(k)}" fill="${pal.hairSh}"${front ? '' : ' opacity=".7"'}/>`; if (front && k.spec.len > 6 && k.spec.w > 3) fill += `<path d="${rigEdgeLine(k)}" fill="${pal.hairLine}"/>`; }
  }
  if (!front) {
    ctx.hairBack = { T, d: shapes.map((k) => RIG.geomOf(k).d).join('') };
    return `<g transform="${T}">${outl}${fill}</g>`;
  }
  // the front mass: its outline is hidden where it lies over the back mass outside the head, so
  // scalp and back hair read as one silhouette; the highlight ring is cut to the scalp's shapes
  const id = ctx.uid + 'hm' + ctx.n++, hc = ctx.uid + 'hc' + ctx.n++;
  const scalp = items.find((it) => it.a.layer === 'scalp'), vol = scalp ? scalp.a.vol || 0 : 0;
  if (ctx.hairBack) {
    outl = `<mask id="${id}" maskUnits="userSpaceOnUse" x="-400" y="-400" width="800" height="800"><rect x="-400" y="-400" width="800" height="800" fill="#fff"/>`
      + `<g transform="${ctx.hairBack.T}"><path d="${ctx.hairBack.d}" fill="#000"/></g><g transform="${T}"><circle r="${RIG_HEAD.r}" fill="#fff"/></g></mask><g mask="url(#${id})"><g transform="${T}">${outl}</g></g>`;
  } else outl = `<g transform="${T}">${outl}</g>`;
  const halo = scalp ? `<clipPath id="${hc}">${scalp.a.shapes.map((k) => `<path d="${RIG.geomOf(k).d}"/>`).join('')}</clipPath><g clip-path="url(#${hc})"><path d="${rigHalo(vol)}" fill="${pal.hairHi}"/></g>` : '';
  return outl + `<g transform="${T}">${fill}${halo}</g>`;
};
// The fringe's shadow on the forehead: the hair over the face, shifted down, cut to the skull.
RIG.PAINTERS.hairShade = (items, ctx) => {
  const it = items[0], id = ctx.uid + 'hs' + ctx.n++, sk = RIG.colourOf('$skin', ctx.pal), sh = RIG.shade(sk, -0.22);
  const d = it.a.shapes.map((k) => RIG.geomOf(k).d).join('');
  return `<g transform="${RIG.tf(it.F)}"><clipPath id="${id}"><circle r="${RIG_HEAD.r - 0.2}"/></clipPath><g clip-path="url(#${id})"><path d="${d}" fill="${sh}" transform="translate(.7,2.6)"/></g></g>`;
};

/* ---------------------------------------------------------------- the reference hairstyle */
// Shonen Spikes: the reference every later hairstyle is measured against. Short, spiky, the face
// framed: a full scalp, five spikes standing on the crown, six tufts behind the head, a side lock
// at each temple, five bangs (the longest falling between the eyes), one cowlick.
const RIG_HAIR_DEFS = {
  shonen: {
    id: 'shonen', name: 'Shonen Spikes', head: 1, c: '#2b2e44', vol: 3.2,
    back: [
      { at: ['nape', 0.95], len: 9, w: 10, turn: 26, bend: 10, z: 0 },
      { at: ['skull', 152], len: 12.5, w: 12, turn: 16, bend: 12, z: 1 },
      { at: ['skull', 176], len: 15, w: 13, turn: 6, bend: 10, z: 2 },
      { at: ['skull', 201], len: 14, w: 12.5, turn: -4, bend: 12, z: 1 },
      { at: ['skull', 226], len: 12, w: 11.5, turn: -10, bend: 12, z: 0 },
      { at: ['skull', 249], len: 9, w: 10, turn: -14, bend: 10, z: 0 },
    ],
    crown: [
      { at: ['skull', -152], len: 13, w: 12, turn: -12, bend: -16, z: -2 },
      { at: ['skull', -128], len: 15.5, w: 12.5, turn: -14, bend: -18, z: -1 },
      { at: ['skull', -103], len: 14, w: 12, turn: -16, bend: -16, z: -2 },
      { at: ['skull', -79], len: 11, w: 11, turn: -18, bend: -14, z: -3 },
      { at: ['skull', -56], len: 7.5, w: 10, turn: -14, bend: -10, z: -3 },
    ],
    sides: [
      { at: ['temple', 'N', -1], len: 16, w: 7.8, turn: -20, bend: -12, z: 0 },
      { at: ['temple', 'F', -1], len: 13, w: 6.4, turn: 34, bend: 12, z: 0 },
    ],
    bangs: [
      { at: ['hairline', 0.13], len: 10.5, w: 8.6, turn: 0, bend: -8, z: 0 },
      { at: ['hairline', 0.3], len: 11.5, w: 9, turn: 4, bend: -10, z: 1 },
      { at: ['hairline', 0.5], len: 15.2, w: 9.6, turn: 10, bend: -6, z: 3 },
      { at: ['hairline', 0.67], len: 11, w: 8.6, turn: 6, bend: 12, z: 2 },
      { at: ['hairline', 0.84], len: 9, w: 8, turn: 2, bend: 14, z: 1 },
    ],
    strands: [
      { at: ['skull', -96, 1.5], flow: 'free', dir: -78, len: 13, w: 3.4, bend: 150, tip: 'point', z: 5 },
    ],
  },
};
const RIG_HAIRS = { shonen: rigHairstyle(RIG_HAIR_DEFS.shonen) };

/* ---------------------------------------------------------------- hair checks */
// Measured on the compiled hairstyle, against RIG_HEAD.
const RIG_HAIR_LIMITS = { back: [6, 16], crown: [6, 15], sides: [3.5, 10], bangs: [4.5, 11], strands: [1.5, 4.5], dev: 60 };
function RIG_HAIR_CHECK(skin, skins) {
  const out = [], H = RIG_HEAD, M = skin.meta || {}, L = M.locks || {}, IN = RIG_CHECK.inside;
  const R = (id, name, bad, ok) => ({ id, group: 'Hair', name, status: bad.length ? 'fail' : 'pass', detail: bad.join('; ') || ok || '' });
  const polys = (layers) => layers.flatMap((l) => (l === 'scalp' ? [M.scalp, ...(L.crown || [])] : L[l] || [])).filter(Boolean).map((k) => RIG.geomOf(k).poly);
  const front = polys(['scalp', 'sides', 'bangs', 'strands']);
  // 1 the five layers (strands optional)
  const miss = ['back', 'sides', 'bangs'].filter((l) => !(L[l] || []).length).concat(M.scalp ? [] : ['scalp']);
  out.push(R('hair.layers', 'Back mass, scalp, side locks and bangs are all there', miss.map((m) => `no ${m} layer`), `back ${(L.back || []).length} · crown ${(L.crown || []).length} · sides ${(L.sides || []).length} · bangs ${(L.bangs || []).length} · strands ${(L.strands || []).length}`));
  // 2 built on this head reference, in the hair slots only
  const slotsOk = Object.keys(skin.att || {}).filter((s) => !['hairBack', 'hairShade', 'hair.scalp', 'hair.sides', 'hair.bangs', 'hair.strands'].includes(s));
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
    const near = layer === 'back'
      ? Math.hypot(k.root[0], k.root[1]) <= H.r || IN(k.root, scalpPoly)
      : IN(k.root, RIG_SCALP) || RIG_SCALP.some((q) => Math.hypot(q[0] - k.root[0], q[1] - k.root[1]) < 2.6);
    if (!near) grow.push(`${layer} lock rooted off the scalp at ${k.root.map((v) => v.toFixed(1)).join(', ')}`);
    if (k.flow !== 'free' && Math.abs(RIG.wrap(k.dir - k.ref)) > RIG_HAIR_LIMITS.dev) grow.push(`${layer} lock leaves ${Math.round(Math.abs(RIG.wrap(k.dir - k.ref)))}° off the growth direction`);
  }
  out.push(R('hair.growth', 'Locks grow from the scalp along the growth direction', grow, `every root on the scalp, every lock within ${RIG_HAIR_LIMITS.dev}° of its flow`));
  // 7 strand thickness: within the layer's range, tapering to the tip
  const thick = [];
  for (const layer of ['back', 'crown', 'sides', 'bangs', 'strands']) for (const k of L[layer] || []) {
    const [lo, hi] = RIG_HAIR_LIMITS[layer];
    if (k.spec.w < lo || k.spec.w > hi) thick.push(`${layer} lock ${k.spec.w} wide (allowed ${lo}–${hi})`);
    if (k.spec.tip !== 'blunt' && k.W[k.n] > k.W[0] * 0.4) thick.push(`${layer} lock does not taper`);
  }
  out.push(R('hair.thickness', 'Lock widths within the layer ranges, tapering', thick, 'widths in range, every lock tapers'));
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
          const p = toSkull(k.S[i]);
          if (Math.hypot(p[0], p[1]) > H.r + 0.3 && !front.some((q) => IN(p, q))) { gaps.push(`${name}: the base of a back tuft shows at frame ${f}`); break; }
        }
      }
    }
    out.push(R('hair.motion', 'The hair stays on the head in motion', gaps, `run, attack, hit and death with the spring active (it swings up to ${swing.toFixed(1)}°): every tuft stays rooted`));
  }
  return out;
}
// Faults the hair checks must catch.
function RIG_HAIR_SELFTEST() {
  const D = RIG_HAIR_DEFS.shonen, mk = (over) => rigHairstyle(Object.assign({}, D, over, { id: 'bad' })), fails = (skin, id) => RIG_HAIR_CHECK(skin).some((r) => r.id === id && r.status === 'fail');
  const moved = mk({});
  moved.meta.scalp = Object.assign({}, moved.meta.scalp, { pts: moved.meta.scalp.pts.map((p) => [p[0], p[1] + 4, p[2]]) });
  return [
    ['Hairstyle without side locks', 'hair.layers', () => fails(mk({ sides: [] }), 'hair.layers')],
    ['Scalp slid 4 units down the face (misaligned)', 'hair.hairline', () => fails(moved, 'hair.hairline')],
    ['Scalp too small: a bald spot', 'hair.coverage', () => fails(mk({ vol: -6, crown: [] }), 'hair.coverage')],
    ['Bangs falling over the eyes', 'hair.eyes', () => fails(mk({ bangs: D.bangs.map((b) => Object.assign({}, b, { len: 20 })) }), 'hair.eyes')],
    ['A lock rooted in the middle of the face', 'hair.growth', () => fails(mk({ strands: [{ at: ['crown', 10, 18], flow: 'free', dir: 90, len: 6, w: 3 }] }), 'hair.growth')],
    ['A bang growing upwards against the flow', 'hair.growth', () => fails(mk({ bangs: [Object.assign({}, D.bangs[0], { turn: -170 })] }), 'hair.growth')],
    ['A lock 20 units wide', 'hair.thickness', () => fails(mk({ sides: [Object.assign({}, D.sides[0], { w: 20 })] }), 'hair.thickness')],
    ['Made for another head', 'hair.anchor', () => fails(mk({ head: 2 }), 'hair.anchor')],
  ];
}
