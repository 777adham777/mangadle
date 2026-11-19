'use strict';
/* ==========================================================================
   TRI-REALM IDLE — content made in the Studio
   The Studio (editor.html) is where new animations, haircuts, tops, bottoms,
   hats, faces, back pieces, auras and colours are made. It saves them to
   js/custom-pack.js as CUSTOM_PACK (plain data); this file turns that data
   into avatar content (HAIR, TOPS, BOTTOMS, HATS, AV_EXT, POSE_DRIVE...) and
   cosmetics earned like the built-in ones.
   In dev mode, a Studio draft marked "Preview in game" replaces the pack.
   Loaded right after avatar.js; the Studio loads it too, to draw what you edit.
   ========================================================================== */
const STUDIO_DRAFT_KEY = 'trirealm_studio_draft';
const CUSTOM_SLOT = { anim: 'stance', hair: 'hair', top: 'top', bottom: 'bottom', hat: 'hat', face: 'face', back: 'back', aura: 'aura', color: 'color' };
const CUSTOM_ID = /^[a-z0-9][a-z0-9-]{0,40}$/;
const CUSTOM_UNDO = [];   // what registerCustomPack added, as functions that take it out again

// How a custom cosmetic is earned (the same feats as the built-in ones).
function customUnlock(u) {
  u = u || {};
  const n = Math.max(1, Math.floor(+u.n || 1)), zone = ZONES.find((z) => z.id === u.zone);
  switch (u.type) {
    case 'level': return SKILLS[u.skill] ? LV(u.skill, n) : { need: FREE };
    case 'kills': return zone ? KILLS(u.zone, n) : { need: FREE };
    case 'boss': return zone ? BOSS(u.zone, u.who || zone.name) : { need: FREE };
    case 'locked': return { need: () => false, hint: u.hint || 'Not available yet' };
    default: return { need: FREE };
  }
}

/* ---------------------------------------------------------------- drawings */
// Vector layers (hats, faces, back art) in the local frame of what they sit on.
// shape: points [x, y, corner?] joined by a smooth spline (or straight lines), closed or open.
function customLayersSVG(layers) {
  return (layers || []).map((L) => {
    if (!L || L.hidden) return '';
    if (L.kind === 'raw') return L.svg || '';
    const op = L.op != null && L.op < 1 ? ` opacity="${L.op}"` : '';
    const sw = Math.max(0, +L.sw || 0);
    if (L.kind === 'circle') return `<circle cx="${r1(+L.cx || 0)}" cy="${r1(+L.cy || 0)}" r="${r1(Math.max(0.2, +L.r || 1))}" fill="${L.fill || 'none'}" stroke="${L.stroke || 'none'}" stroke-width="${sw}"${op}/>`;
    const P = (L.pts || []).filter((p) => p && isFinite(p[0]) && isFinite(p[1]));
    if (P.length < 2) return '';
    const d = L.smooth !== false && P.length > 2 ? spline(P, !!L.closed) : 'M' + P.map(pt).join('L') + (L.closed ? 'Z' : '');
    if (!L.closed) {
      return (L.inkUnder ? `<path d="${d}" fill="none" stroke="${OL}" stroke-width="${r1(sw + 2.4)}" stroke-linecap="round" stroke-linejoin="round"${op}/>` : '')
        + `<path d="${d}" fill="none" stroke="${L.stroke || OL}" stroke-width="${sw || 1}" stroke-linecap="round" stroke-linejoin="round"${op}/>`;
    }
    return `<path d="${d}" fill="${L.fill || 'none'}" stroke="${L.stroke || 'none'}" stroke-width="${sw}" stroke-linejoin="round" stroke-linecap="round"${op}/>`;
  }).join('');
}

// Aura particles. Each emitter draws n particles of one shape moving one way around the body.
const EMIT_SHAPE = {
  circle: (s, c) => `<circle r="${r1(s)}" fill="${c}"/>`,
  ring: (s, c) => `<circle r="${r1(s)}" fill="none" stroke="${c}" stroke-width="${r1(Math.max(1, s * 0.3))}"/>`,
  glow: (s, c) => `<circle r="${r1(s * 2.4)}" fill="${c}" opacity=".25"/><circle r="${r1(s)}" fill="${c}"/>`,
  spark: (s, c) => { const k = s * 0.28; return `<path d="M0,${r1(-s)}L${r1(k)},${r1(-k)}L${r1(s)},0L${r1(k)},${r1(k)}L0,${r1(s)}L${r1(-k)},${r1(k)}L${r1(-s)},0L${r1(-k)},${r1(-k)}Z" fill="${c}"/>`; },
  leaf: (s, c) => `<path d="M${r1(-s)},0Q0,${r1(-s * 0.8)} ${r1(s)},0Q0,${r1(s * 0.8)} ${r1(-s)},0Z M${r1(-s)},0H${r1(s)}" fill="${c}" stroke="${shade(c, -0.55)}" stroke-width=".8"/>`,
  wisp: (s, c) => `<path transform="scale(${r1(s / 8 * 100) / 100})" d="M0,8 Q-7,2 -3,-4 Q0,-8 1,-16 Q5,-6 6,0 Q6,7 0,8Z" fill="${c}"/>`,
  square: (s, c) => `<rect x="${r1(-s)}" y="${r1(-s)}" width="${r1(2 * s)}" height="${r1(2 * s)}" rx="${r1(s * 0.2)}" fill="${c}"/>`,
  streak: (s, c) => `<path d="M0,${r1(-s * 3)}V${r1(s * 3)}" stroke="${c}" stroke-width="${r1(Math.max(1, s * 0.5))}" stroke-linecap="round"/>`,
  petal: (s, c) => `<ellipse rx="${r1(s)}" ry="${r1(s * 0.5)}" fill="${c}"/>`,
  bolt: (s, c) => `<path d="M${r1(-s * 0.3)},${r1(-s * 1.6)} l${r1(s * 0.8)},${r1(s * 1.2)} -${r1(s * 0.6)},${r1(s * 0.2)} ${r1(s * 0.7)},${r1(s * 1.4)}" fill="none" stroke="${c}" stroke-width="${r1(Math.max(1.2, s * 0.35))}" stroke-linejoin="round"/>`,
};
const EMIT_MOTIONS = ['rise', 'fall', 'orbit', 'spiral', 'wander', 'burst'];
function emitterSVG(e, cx, cy, t) {
  const n = Math.max(0, Math.min(60, Math.floor(+e.n || 0))), sp = +e.speed || 1, out = [];
  const spread = +e.spread || 40, H = +e.height || 160, y0 = cy + (+e.y || 0), seed = +e.seed || 1;
  const draw = EMIT_SHAPE[e.shape] || EMIT_SHAPE.circle, motion = EMIT_MOTIONS.includes(e.motion) ? e.motion : 'rise';
  const TAU = Math.PI * 2;
  for (let i = 0; i < n; i++) {
    const ph = i / n, rA = hj(i, seed), rB = hj(i, seed + 7);
    let x, y, k = 0.5, depth = 1;
    switch (motion) {
      case 'orbit': { const a = t * sp + ph * TAU; x = cx + Math.cos(a) * spread; y = y0 + Math.sin(a) * spread * 0.3 + (rA - 0.5) * H * 0.3; depth = Math.sin(a) > 0 ? 1 : 0.55; break; }
      case 'wander': x = cx + Math.sin(t * 0.7 * sp + i * 2.1) * spread; y = y0 + Math.cos(t * 0.9 * sp + i * 1.3) * H * 0.4; break;
      case 'fall': k = (t * sp * 0.3 + rA) % 1; x = cx + (rB - 0.5) * 2 * spread + Math.sin(t * 2 + i) * (+e.wob || 0); y = GROUND - H + k * H; break;
      case 'spiral': { k = (t * sp * 0.3 + ph) % 1; const a = k * Math.PI * 4 + ph * TAU; x = cx + Math.cos(a) * spread * (1 - k * 0.4); y = GROUND - 4 - k * H; depth = Math.sin(a) > 0 ? 1 : 0.55; break; }
      case 'burst': { k = (t * sp * 0.4 + rA) % 1; const a = ph * TAU + rB; x = cx + Math.cos(a) * k * spread; y = y0 + Math.sin(a) * k * spread; break; }
      default: k = (t * sp * 0.3 + rA) % 1; x = cx + (rB - 0.5) * 2 * spread + Math.sin(t * 1.5 + i * 1.7) * (+e.wob || 0); y = GROUND - 4 - k * H;
    }
    if (e.blink && Math.sin(t * 3 + i * 1.7) < -0.2) continue;
    const fade = e.fade === 'none' || motion === 'orbit' || motion === 'wander' ? 1 : e.fade === 'inout' ? Math.sin(Math.PI * k) : 1 - k;
    const op = Math.max(0, Math.min(1, (e.op != null ? +e.op : 0.8) * fade * depth));
    const s = Math.max(0.3, (+e.size || 3) * (1 + (+e.grow || 0) * k)), c = e.c2 && i % 2 ? e.c2 : e.c || '#ffffff';
    const rot = (+e.spin || 0) * t * 60 + rA * 360;
    out.push(`<g transform="translate(${r1(x)},${r1(y)}) rotate(${r1(rot)})" opacity="${Math.round(op * 100) / 100}">${draw(s, c)}</g>`);
  }
  return out.join('');
}
function customAuraSVG(d, cx, cy, t) {
  let s = '';
  const f = d.flame;
  if (f && f.on) s += flameAura(cx, t, [f.c1, f.c2, f.c3], { h: +f.h || 196, w: +f.w || 50 });
  for (const e of d.emitters || []) if (e && !e.hidden) s += emitterSVG(e, cx, cy, t);
  if (d.bolts && d.bolts.on) s += bolts(cx, t, d.bolts.c || '#ffe066');
  return s;
}

// A back piece: a cape, a hood, a mantle over the shoulders and free art pinned to the torso.
function customBack(d) {
  return (L, k) => {
    const { J, P, t, B, M } = k;
    if (d.hood && d.hood.on) k.hood(d.hood.c);
    const c = d.cape;
    if (c && c.on) L.back.push(capeSVG(J, B, P, t, { fill: c.fill, lining: c.lining, edge: c.edge || null, jag: c.jag ? 1 : 0, stripes: c.stripes ? 1 : 0, stars: c.stars ? 1 : 0, len: +c.len || 100 }));
    if (d.mantle && d.mantle.on) L.under.push(k.mantle(d.mantle.c, d.mantle.clasp, d.mantle.fur ? 'fur' : ''));
    const a = d.art;
    if (a && a.layers && a.layers.length) {
      const sw = (+a.sway || 0) * Math.sin(t * 2.1);
      const svg = customLayersSVG(a.layers);
      const g = frame(J, M(+a.u || 0, +a.v || 0, 0), sw ? `<g transform="rotate(${r1(sw)})">${svg}</g>` : svg);
      (a.layer === 'under' ? L.under : a.layer === 'over' ? L.over : L.back).push(g);
    }
  };
}

/* ---------------------------------------------------------------- garment pieces */
// A piece is drawn in the space of a body part, so it bends and turns with it:
// torso: [u, v] (u -1 back edge → 1 front edge, v 0 pelvis → 1 neck; below 0 hangs past the hips)
// arm / leg: [t, s] (t 0 shoulder or hip → 0.5 elbow or knee → 1 wrist or ankle; s -1 → 1 across).
const GARMENT_PARTS = { torso: ['torso'], arms: ['armF', 'armB'], armF: ['armF'], armB: ['armB'], legs: ['legF', 'legB'], legF: ['legF'], legB: ['legB'] };
const LIMB_UNIT = { a: 6.6, l: 9.2 };
function garmentMap(where, X) {
  if (where === 'torso' || where === 'torsoTop') { const ex = (X.ex || 2) + 0.6; return (p) => X.M(p[0], p[1], ex); }
  const L = X.L, unit = LIMB_UNIT[where[0]] * X.W;
  return (p) => {
    const t = Math.max(-0.3, Math.min(1.2, p[0])), q = bez(L, t, t, 1)[0], [nx, ny] = nrm(bez(L, t - 0.02, t + 0.02, 2), 1);
    return [q[0] - nx * p[1] * unit, q[1] - ny * p[1] * unit];
  };
}
// Points along a shape drawn like spline() (corners kept), in the part's own space.
function sampleShape(P, closed, smooth, per) {
  const n = P.length, out = [P[0]], at = (i) => (closed ? P[(i + n) % n] : P[Math.max(0, Math.min(n - 1, i))]);
  for (let i = 0; i < (closed ? n : n - 1); i++) {
    const p0 = at(i - 1), p1 = at(i), p2 = at(i + 1), p3 = at(i + 2);
    let c1 = [p1[0] + (p2[0] - p1[0]) / 3, p1[1] + (p2[1] - p1[1]) / 3], c2 = [p2[0] - (p2[0] - p1[0]) / 3, p2[1] - (p2[1] - p1[1]) / 3];
    if (smooth && !p1[2]) c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
    if (smooth && !p2[2]) c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
    for (let k = 1; k <= per; k++) {
      const x = k / per, y = 1 - x;
      out.push([0, 1].map((j) => y * y * y * p1[j] + 3 * y * y * x * c1[j] + 3 * y * x * x * c2[j] + x * x * x * p2[j]));
    }
  }
  return out;
}
// A print (stripes, dots, checks) laid out in the part's space, clipped to the piece.
function garmentPattern(pc, P, map, d, X, far) {
  const torso = !X.L, la = torso ? 1 : 0, ca = 1 - la, k = Math.max(0.3, +pc.ps || 1);
  const lo = (i) => Math.min(...P.map((p) => p[i])), hi = (i) => Math.max(...P.map((p) => p[i]));
  const step = (torso ? 0.14 : 0.09) * k, cstep = (torso ? 0.22 : 0.45) * k, c = X.col(pc.pc || '#ffffff', far), w = r1(1.4 * k);
  const line = (a, v, b0, b1) => { const pts = [...Array(9)].map((_, i) => { const q = []; q[a] = v; q[1 - a] = b0 + ((b1 - b0) * i) / 8; return map(q); }); return 'M' + pts.map(pt).join('L'); };
  let inner = '';
  if (pc.pat === 'stripes' || pc.pat === 'checks') { let g = ''; for (let v = lo(la) - step; v <= hi(la) + step; v += step * 2) g += line(la, v, lo(ca) - 1, hi(ca) + 1); inner += `<path d="${g}" stroke="${c}" stroke-width="${w * 2}" fill="none"/>`; }
  if (pc.pat === 'checks') { let g = ''; for (let v = lo(ca) - cstep; v <= hi(ca) + cstep; v += cstep * 2) g += line(ca, v, lo(la) - 1, hi(la) + 1); inner += `<path d="${g}" stroke="${c}" stroke-width="${w * 2}" fill="none" opacity=".7"/>`; }
  if (pc.pat === 'dots') for (let v = lo(la); v <= hi(la); v += step * 1.6) for (let u = lo(ca); u <= hi(ca); u += cstep * 0.8) { const q = []; q[la] = v; q[ca] = u; const p = map(q); inner += `<circle cx="${r1(p[0])}" cy="${r1(p[1])}" r="${w}" fill="${c}"/>`; }
  if (pc.pat === 'edge') inner += `<path d="${d}" fill="none" stroke="${c}" stroke-width="${w * 3}"/>`;
  const id = X.clipId();
  return `<clipPath id="${id}"><path d="${d}"/></clipPath><g clip-path="url(#${id})">${inner}</g>`;
}
function garmentPieceSVG(pc, where, X, main) {
  const P = (pc.pts || []).filter((p) => p && isFinite(p[0]) && isFinite(p[1]));
  if (P.length < 2) return '';
  const map = garmentMap(where, X), far = where === 'armB' || where === 'legB', closed = !!pc.closed;
  const d = 'M' + sampleShape(P, closed, pc.smooth !== false && P.length > 2, 6).map(map).map(pt).join('L') + (closed ? 'Z' : '');
  const fc = !pc.fill || pc.fill === 'main' ? main : pc.fill;
  let s;
  if (!closed) { const w = +pc.sw || 1.6; s = lineP(d, LINE, w + 2, null) + lineP(d, X.col(pc.stroke && pc.stroke !== 'main' ? pc.stroke : fc, far), w); }
  else {
    s = pc.shade !== false ? X.cel(d, X.col(fc, far), X.shd(fc, far), 0.7) : ink(d, X.col(fc, far));
    if (pc.pat && pc.pat !== 'none') s += garmentPattern(pc, P, map, d, X, far);
  }
  return pc.op != null && pc.op < 1 ? `<g opacity="${pc.op}">${s}</g>` : s;
}
// The drawer of a top's or bottom's pieces, called once per body part.
function garmentDrawer(pieces, main) {
  const list = (pieces || []).filter((pc) => pc && !pc.hidden && GARMENT_PARTS[pc.part]);
  return (where, X) => list.filter((pc) => (where === 'torso' ? pc.part === 'torso' && pc.z !== 'top' : where === 'torsoTop' ? pc.part === 'torso' && pc.z === 'top' : GARMENT_PARTS[pc.part].includes(where)))
    .map((pc) => garmentPieceSVG(pc, where, X, main)).join('');
}

/* ---------------------------------------------------------------- animations */
// A key pose with every field the rig needs (anything left out stands relaxed).
const CUSTOM_POSE0 = { t1: 180, t2: 0, n: 0, h: 0, ht: 0, st: 0, tw: 0, dx: 0, dy: 0, air: 0, fF: 10, fB: -190, g: -150, aF: [11, 6], aB: [-11, -6], lF: [9, -2], lB: [-9, 2] };
function customPose(p) {
  const o = Object.assign({}, CUSTOM_POSE0, JSON.parse(JSON.stringify(p || {})));
  for (const k of ['aF', 'aB', 'lF', 'lB']) if (!Array.isArray(o[k]) || o[k].length < 2) o[k] = CUSTOM_POSE0[k].slice();
  for (const k of ['expr', 'prop', 'tool', 'fx']) if (!o[k]) delete o[k];
  return o;
}
// keys: [[u, pose, easing]] as keyPose() reads them (at least two).
function customKeys(a) {
  const ks = (a.keys || []).filter((k) => k && k.p).map((k) => [Math.max(0, Math.min(1, +k.u || 0)), customPose(k.p), ease[k.e] ? k.e : 'io']).sort((x, y) => x[0] - y[0]);
  if (ks.length === 1) ks.push([1, ks[0][1], 'io']);
  return ks;
}
function customDrive(a) {
  const keys = customKeys(a);
  if (!keys.length) return null;
  return (u, t, B, calm) => {
    const P = keyPose(keys, u);
    if (a.breathe !== false && !calm) { const br = Math.sin(t * 2.2); P.t2 += br * 1.5; P.n -= br * 1.1; }
    return P;
  };
}

/* ---------------------------------------------------------------- registry */
function customClean(o) {
  const r = {};
  for (const [k, v] of Object.entries(o || {})) if (v !== '' && v !== null && v !== false && v !== undefined) r[k] = v;
  return r;
}
function registerCustomPack(pack) {
  while (CUSTOM_UNDO.length) { try { CUSTOM_UNDO.pop()(); } catch (e) { /* already gone */ } }
  if (!pack || typeof pack !== 'object') return 0;
  let n = 0;
  const put = (obj, id, val) => { obj[id] = val; CUSTOM_UNDO.push(() => { if (obj[id] === val) delete obj[id]; }); };
  const taken = (slot, id, table) => !CUSTOM_ID.test(id || '') || COSMETICS[slot].some((c) => c.id === id) || (table && Object.prototype.hasOwnProperty.call(table, id));
  const cos = (slot, it, extra) => {
    const c = Object.assign({ id: it.id, name: it.name || it.id, w: REALMS[it.w] ? it.w : undefined, r: Math.max(1, Math.min(5, Math.round(+it.r || 1))), custom: 1 }, customUnlock(it.unlock), extra || {});
    COSMETICS[slot].push(c);
    CUSTOM_UNDO.push(() => { const L = COSMETICS[slot], i = L.indexOf(c); if (i >= 0) L.splice(i, 1); });
    n++;
  };
  const list = (k) => (Array.isArray(pack[k]) ? pack[k].filter((it) => it && typeof it === 'object') : []);

  for (const a of list('anim')) {
    if (!CUSTOM_ID.test(a.id || '') || POSES[a.id] || POSE_DRIVE[a.id] || COSMETICS.stance.some((c) => c.id === a.id)) continue;
    const drive = customDrive(a);
    if (!drive) continue;
    const dur = Math.max(0.2, +a.dur || 1), keys = customKeys(a);
    put(POSE_DRIVE, a.id, drive);
    put(DRIVE_SKILL, a.id, [a.use === 'skill' ? a.skill : '', dur]);
    put(POSES, a.id, drive(0, 0, COSMETICS.build[0].b, true));
    const pv = [a.id, a.name || a.id];
    PREVIEWS.push(pv);
    CUSTOM_UNDO.push(() => { const i = PREVIEWS.indexOf(pv); if (i >= 0) PREVIEWS.splice(i, 1); });
    if (a.use === 'stance') cos('stance', a);
    else if (a.use === 'skill' && SKILLS[a.skill]) put(AV_EXT.skill, a.skill, a.id);
    else if (a.use === 'attack') {
      keys.forEach((k, i) => put(POSES, `${a.id}#${i}`, k[1]));
      const steps = [[`${a.id}#0`, 70, 'out'], ...keys.slice(1).map((k, i) => [`${a.id}#${i + 1}`, Math.max(16, (k[0] - keys[i][0]) * dur * 1000), k[2]]), ['guard', 300]];
      AV_EXT.attacks.push(steps);
      CUSTOM_UNDO.push(() => { const i = AV_EXT.attacks.indexOf(steps); if (i >= 0) AV_EXT.attacks.splice(i, 1); });
    }
  }
  for (const h of list('hair')) {
    if (taken('hair', h.id, HAIR)) continue;
    if (h.v2 && typeof h.v2 === 'object') { put(HAIR, h.id, { v2: Object.assign({}, h.v2), c: h.v2.c }); cos('hair', h); continue; }
    const locks = (h.locks || []).filter((L) => L && ['x', 'y', 'w'].every((k) => isFinite(L[k])) && (L.path ? L.path.length > 1 : isFinite(L.a) && isFinite(L.len)))
      .map((L) => (L.path ? Object.assign({}, L, { a: 0, bend: 0, len: L.path.reduce((a, p, i) => a + Math.hypot(p[0] - (i ? L.path[i - 1][0] : 0), p[1] - (i ? L.path[i - 1][1] : 0)), 0) }) : L));
    put(HAIR, h.id, {
      c: h.c || '#23242c', sh: h.sh || shade(h.c || '#23242c', -0.4), hi: h.hi || shade(h.c || '#23242c', 0.4),
      cap: (h.cap || [20.4, -8, 5]).map(Number), back: +h.back || 0, smooth: h.smooth ? 1 : 0, part: +h.part || 0,
      buzz: h.buzz ? 1 : 0, stubble: h.stubble ? 1 : 0, tie: h.tie || undefined, bun: h.bun || undefined, combs: h.combs || [],
      locks: () => locks.map((L) => Object.assign({}, L, { k: L.k || undefined })),
      masses: (h.masses || []).filter((m) => m && !m.hidden && Array.isArray(m.pts) && m.pts.length > 2).map((m) => ({ back: !!m.back, crown: !!m.crown, pts: m.smooth === false ? m.pts.map((p) => [p[0], p[1], 1]) : m.pts })),
    });
    cos('hair', h);
  }
  for (const it of list('top')) {
    if (taken('top', it.id, TOPS)) continue;
    put(TOPS, it.id, { top: it.base === false ? undefined : customClean(it.top), sash: it.sash && it.sash[0] ? [it.sash[0], +it.sash[1] || 0] : undefined, wrist: it.wrist || undefined, glove: it.glove || undefined });
    if (it.pieces && it.pieces.length) put(AV_EXT.wear, 'top:' + it.id, garmentDrawer(it.pieces, (it.top && it.top.c) || '#5a6880'));
    cos('top', it);
  }
  for (const it of list('bottom')) {
    if (taken('bottom', it.id, BOTTOMS)) continue;
    if (it.pieces && it.pieces.length) put(AV_EXT.wear, 'bottom:' + it.id, garmentDrawer(it.pieces, (it.bot && it.bot.c) || '#30364a'));
    put(BOTTOMS, it.id, { bot: it.base === false ? undefined : customClean(it.bot), belt: it.belt || undefined, shoe: it.shoe && it.shoe[0] && it.shoe[0] !== 'bare' ? [it.shoe[0], it.shoe[1] || '#3a2c24'] : undefined });
    cos('bottom', it);
  }
  for (const it of list('hat')) {
    if (taken('hat', it.id, HATS)) continue;
    put(HATS, it.id, customLayersSVG(it.layers));
    if (it.cover) put(HAT_COVER, it.id, 1);
    cos('hat', it);
  }
  for (const it of list('face')) {
    if (taken('face', it.id, AV_EXT.face)) continue;
    put(AV_EXT.face, it.id, { eyes: !!it.eyes, svg: customLayersSVG(it.layers) });
    cos('face', it);
  }
  for (const it of list('back')) {
    if (taken('back', it.id, AV_EXT.back)) continue;
    put(AV_EXT.back, it.id, customBack(it));
    cos('back', it);
  }
  for (const it of list('aura')) {
    if (taken('aura', it.id, AV_EXT.aura)) continue;
    put(AV_EXT.aura, it.id, (cx, cy, t) => customAuraSVG(it, cx, cy, t));
    if (it.blend !== 'normal') put(AURA_GLOW, it.id, 1);
    if (it.glow) { put(AURA_COL, it.id, it.glow); customGlowFilter(it.id, it.glow); }
    cos('aura', it);
  }
  for (const it of list('color')) {
    if (taken('color', it.id) || !/^#[0-9a-f]{6}$/i.test(it.ink || '')) continue;
    cos('color', it, { ink: it.ink });
  }
  return n;
}
// The coloured rim of a glowing aura is an SVG filter shared by the page (see AV_DEFS).
function customGlowFilter(id, col) {
  if (typeof document === 'undefined' || !document.getElementById) return;
  const host = document.getElementById('av-defs'), defs = host && host.querySelector('defs');
  if (!defs) return;
  const old = document.getElementById('avStk-' + id);
  if (old) old.remove();
  defs.insertAdjacentHTML('beforeend', stickerFilter('avStk-' + id, col));
  CUSTOM_UNDO.push(() => { const f = document.getElementById('avStk-' + id); if (f) f.remove(); });
}
// The shipped pack, or (in dev mode) the Studio draft marked "Preview in game".
function customPackInUse() {
  let pack = typeof CUSTOM_PACK !== 'undefined' ? CUSTOM_PACK : null;
  try {
    if (localStorage.getItem('trirealm_dev') === '1') {
      const d = JSON.parse(localStorage.getItem(STUDIO_DRAFT_KEY) || 'null');
      if (d && d.live && d.pack) pack = d.pack;
    }
  } catch (e) { /* storage unavailable */ }
  return pack;
}
try { registerCustomPack(customPackInUse()); } catch (e) { console.error('Custom content could not load:', e); }
