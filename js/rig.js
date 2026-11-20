'use strict';
/* ==========================================================================
   TRI-REALM — character rig v3 (runtime)
   One skeleton for every character, organised like a Spine 2D rig
   (see docs/CHARACTER-SYSTEM.md for why not Spine itself):
   - BONES in a hierarchy. Each bone has a local transform (position on its
     parent, rotation); world transforms are computed parents first. Bones
     never scale: proportions come from the canonical model and nothing else.
   - SLOTS in one fixed draw order, each bound to one bone. A slot shows one
     attachment, looked up by name in the character's SKINS (base body, outfit,
     face, hair, weapon...), so cosmetics swap without touching the skeleton.
   - CONSTRAINTS: two-bone IK (legs reach their foot targets, so feet stay
     planted), feet copy their target's angle, spring bones for secondary motion.
   - ANIMATIONS: timelines of offsets from the setup pose (rotation, translation),
     attachment swaps (expressions), draw-order keys and events, played by an
     animation state that crossfades from the pose on screen.
   Drawing (SVG): consecutive slots of one INK GROUP share one outline pass
   (all outlines first, then all fills), so a limb made of several bones reads
   as one shape and joints never show a seam. One line width, one light.
   No globals besides RIG. Data: js/rig-canon.js, js/rig-anims.js, js/rig-hair.js.
   ========================================================================== */
const RIG = (() => {
  const D2R = Math.PI / 180;
  const f2 = (v) => Math.round(v * 100) / 100;
  const P2 = (p) => `${f2(p[0])},${f2(p[1])}`;
  const rot = (p, a) => { const c = Math.cos(a * D2R), s = Math.sin(a * D2R); return [p[0] * c - p[1] * s, p[0] * s + p[1] * c]; };
  const dirOf = (a) => [Math.cos(a * D2R), Math.sin(a * D2R)];
  const angOf = (v) => Math.atan2(v[1], v[0]) / D2R;
  const wrap = (a) => ((((a + 180) % 360) + 360) % 360) - 180;
  // Angles: 0 points right (the way the character faces), 90 down, -90 up (SVG, y down).
  // A positive rotation turns clockwise on screen.

  /* ------------------------------------------------------------- colour */
  function shade(hex, f) {   // f < 0 darkens, f > 0 lightens
    const n = parseInt(String(hex).slice(1), 16);
    const ch = [n >> 16, (n >> 8) & 255, n & 255].map((c) => Math.round(f < 0 ? c * (1 + f) : c + (255 - c) * f));
    return '#' + ch.map((c) => Math.max(0, Math.min(255, c)).toString(16).padStart(2, '0')).join('');
  }
  const lum = (hex) => { const n = parseInt(String(hex).slice(1), 16); return ((n >> 16) * 0.3 + ((n >> 8) & 255) * 0.59 + (n & 255) * 0.11) / 255; };

  /* ------------------------------------------------------------- curves */
  // Smooth closed or open curve through points (Catmull-Rom as cubic Béziers). [x, y, 1] is a corner.
  function segs(P, closed) {
    const n = P.length, at = (i) => (closed ? P[(i + n) % n] : P[Math.max(0, Math.min(n - 1, i))]), out = [];
    for (let i = 0; i < (closed ? n : n - 1); i++) {
      const p0 = at(i - 1), p1 = at(i), p2 = at(i + 1), p3 = at(i + 2);
      const c1 = p1[2] ? [p1[0] + (p2[0] - p1[0]) / 3, p1[1] + (p2[1] - p1[1]) / 3] : [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
      const c2 = p2[2] ? [p2[0] - (p2[0] - p1[0]) / 3, p2[1] - (p2[1] - p1[1]) / 3] : [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
      out.push([p1, c1, c2, p2]);
    }
    return out;
  }
  function curve(P, closed) {
    if (!P || P.length < 2) return '';
    let d = `M${P2(P[0])}`;
    for (const [, c1, c2, p2] of segs(P, closed)) d += `C${P2(c1)} ${P2(c2)} ${P2(p2)}`;
    return closed ? d + 'Z' : d;
  }
  // The same curve as a polygon (for the checks and for hit tests).
  function curvePts(P, closed, per) {
    per = per || 5;
    const out = [];
    for (const [p1, c1, c2, p2] of segs(P, closed)) {
      for (let k = 0; k < per; k++) {
        const x = k / per, y = 1 - x;
        out.push([0, 1].map((j) => y * y * y * p1[j] + 3 * y * y * x * c1[j] + 3 * y * x * x * c2[j] + x * x * x * p2[j]));
      }
    }
    if (!closed) out.push(P[P.length - 1].slice(0, 2));
    return out;
  }
  // A tapered capsule along +x: from (x0, 0) radius r0 to (x1, 0) radius r1, round ends.
  function capsulePts(x0, x1, r0, r1, n) {
    n = n || 8;
    const L = Math.max(0.01, x1 - x0), s = Math.max(-0.95, Math.min(0.95, (r0 - r1) / L)), ps = Math.asin(s) / D2R, out = [];
    // right cap from -(90 - ps) to +(90 - ps), then the left cap from 90 + ps to 270 - ps
    for (let i = 0; i <= n; i++) { const a = -(90 - ps) + ((180 - 2 * ps) * i) / n; out.push([x1 + Math.cos(a * D2R) * r1, Math.sin(a * D2R) * r1]); }
    for (let i = 0; i <= n; i++) { const a = 90 - ps + ((180 + 2 * ps) * i) / n; out.push([x0 + Math.cos(a * D2R) * r0, Math.sin(a * D2R) * r0]); }
    return out;
  }
  function capsulePath(x0, x1, r0, r1) { return tubeGeom(x0, x1, r0, r1, false, false).d; }
  // A tube: like a capsule, but either end may be cut flat (a sleeve or trouser end).
  function tubeGeom(x0, x1, r0, r1, flat0, flat1) {
    const L = Math.max(0.01, x1 - x0), s = Math.max(-0.95, Math.min(0.95, (r0 - r1) / L)), c = Math.sqrt(1 - s * s), ps = Math.asin(s) / D2R;
    const a = flat0 ? [x0, -r0] : [x0 + r0 * s, -r0 * c], b = flat1 ? [x1, -r1] : [x1 + r1 * s, -r1 * c];
    const b2 = flat1 ? [x1, r1] : [x1 + r1 * s, r1 * c], a2 = flat0 ? [x0, r0] : [x0 + r0 * s, r0 * c];
    const d = `M${P2(a)}L${P2(b)}${flat1 ? `L${P2(b2)}` : `A${f2(r1)},${f2(r1)} 0 0,1 ${P2(b2)}`}L${P2(a2)}${flat0 ? '' : `A${f2(r0)},${f2(r0)} 0 1,1 ${P2(a)}`}Z`;
    const poly = [];
    if (flat1) poly.push(b, b2); else for (let i = 0; i <= 8; i++) { const t = -(90 - ps) + ((180 - 2 * ps) * i) / 8; poly.push([x1 + Math.cos(t * D2R) * r1, Math.sin(t * D2R) * r1]); }
    if (flat0) poly.push(a2, a); else for (let i = 0; i <= 8; i++) { const t = 90 - ps + ((180 + 2 * ps) * i) / 8; poly.push([x0 + Math.cos(t * D2R) * r0, Math.sin(t * D2R) * r0]); }
    return { d, poly };
  }
  const circlePts = (cx, cy, r, n) => [...Array(n || 24)].map((_, i) => { const a = (i / (n || 24)) * Math.PI * 2; return [cx + Math.cos(a) * r, cy + Math.sin(a) * r]; });
  const circlePath = (cx, cy, r) => `M${f2(cx - r)},${f2(cy)}a${f2(r)},${f2(r)} 0 1,0 ${f2(2 * r)},0a${f2(r)},${f2(r)} 0 1,0 ${f2(-2 * r)},0Z`;

  // An attachment's outline: { d: SVG path, poly: polygon } in its bone's frame.
  // Kinds: capsule { x0, x1, r0, r1 } · circle { cx, cy, r } · shape { pts, open } · path { d, poly }.
  function geomOf(a) {
    if (a._g) return a._g;
    let g;
    if (a.kind === 'capsule' || a.kind === 'tube') g = tubeGeom(a.x0 || 0, a.x1, a.r0, a.r1, !!a.flat0, !!a.flat1);
    else if (a.kind === 'circle') g = { d: circlePath(a.cx || 0, a.cy || 0, a.r), poly: circlePts(a.cx || 0, a.cy || 0, a.r) };
    else if (a.kind === 'shape') g = { d: curve(a.pts, !a.open), poly: curvePts(a.pts, !a.open) };
    else if (a.kind === 'path') g = { d: a.d, poly: a.poly || [] };
    else if (a.kind === 'image' || a.kind === 'hairImage') {
      // a picture placed in the bone's frame: its rectangle (for the checks; it is drawn as an image)
      // (not kept: a fitted picture may change its box once its morph is ready)
      const P = [[a.x, a.y], [a.x + a.w, a.y], [a.x + a.w, a.y + a.h], [a.x, a.y + a.h]];
      return { d: '', poly: P, rect: P };
    }
    else g = { d: '', poly: [] };
    Object.defineProperty(a, '_g', { value: g, enumerable: false, writable: true });
    return g;
  }

  /* ------------------------------------------------------------- skeleton */
  // Bone definition: { name, parent, at: [x, y] (in the parent's frame), a: setup angle in the world,
  //   len, upright: its attachments are drawn in an upright "art" frame (x right, y down, as the bone
  //   stands in the setup pose) instead of along the bone }.
  // The parent's frame is its art frame when it is upright, else its bone frame (x along the bone).
  // compile() turns that into local transforms (x, y, r) like Spine stores them.
  function compile(def) {
    if (def._c) return def._c;
    const idx = {}, bones = [];
    def.bones.forEach((b, i) => {
      if (idx[b.name] != null) throw new Error('duplicate bone ' + b.name);
      const p = b.parent ? idx[b.parent] : -1;
      if (b.parent && p == null) throw new Error(`bone ${b.name}: parent ${b.parent} must come first`);
      const pa = p >= 0 ? bones[p].a : 0, a = b.a != null ? b.a : pa;
      let at = b.at || [0, 0];
      if (p >= 0 && bones[p].art) at = rot(at, bones[p].art);   // art frame -> bone frame
      bones.push({ name: b.name, i, p, a, x: at[0], y: at[1], r: a - pa, len: b.len || 0, art: b.upright ? -a : 0, upright: !!b.upright, spring: b.spring || null });
      idx[b.name] = i;
    });
    const slotIdx = {};
    const slots = def.slots.map((s, i) => {
      if (idx[s.bone] == null) throw new Error(`slot ${s.name}: no bone ${s.bone}`);
      if (slotIdx[s.name] != null) throw new Error('duplicate slot ' + s.name);
      slotIdx[s.name] = i;
      return Object.assign({ i, b: idx[s.bone], ink: s.ink || s.name }, s);
    });
    // (the definition's names come first: the resolved indices must not be overwritten by them)
    const c = { def, bones, idx, slots, slotIdx, ik: (def.ik || []).map((k) => Object.assign({}, k, { b1: idx[k.bones[0]], b2: idx[k.bones[1]], t: idx[k.target], foot: k.foot != null ? idx[k.foot] : -1 })) };
    Object.defineProperty(def, '_c', { value: c, enumerable: false });
    return c;
  }

  // A posed skeleton: local transforms (setup + animation offsets), then world transforms.
  function Pose(def) {
    const c = compile(def);
    this.c = c;
    this.L = c.bones.map((b) => ({ x: b.x, y: b.y, r: b.r }));
    this.W = c.bones.map(() => ({ x: 0, y: 0, r: 0 }));
    this.att = c.slots.map((s) => s.att || null);
    this.order = c.slots.map((s, i) => i);
    this.ikMix = c.ik.map((k) => (k.mix != null ? k.mix : 1));
    this.stretch = c.ik.map(() => 0);
  }
  Pose.prototype.reset = function () {
    this.c.bones.forEach((b, i) => { const l = this.L[i]; l.x = b.x; l.y = b.y; l.r = b.r; });
    this.att = this.c.slots.map((s) => s.att || null);
    this.order = this.c.slots.map((s, i) => i);
    this.ikMix = this.c.ik.map((k) => (k.mix != null ? k.mix : 1));
    return this;
  };
  // Offsets from the setup pose: { bones: { name: { r, x, y } }, slots: { name: attachment }, order: { slot: places }, ik: { name: mix } }.
  Pose.prototype.apply = function (o) {
    if (!o) return this;
    for (const n in o.bones || {}) {
      const i = this.c.idx[n];
      if (i == null) continue;
      const v = o.bones[n], b = this.c.bones[i], l = this.L[i];
      l.r = b.r + (v.r || 0); l.x = b.x + (v.x || 0); l.y = b.y + (v.y || 0);
    }
    for (const n in o.slots || {}) { const i = this.c.slotIdx[n]; if (i != null) this.att[i] = o.slots[n] || null; }
    if (o.order) this.order = orderWith(this.c, o.order);
    for (const n in o.ik || {}) { const i = this.c.ik.findIndex((k) => k.name === n); if (i >= 0) this.ikMix[i] = o.ik[n]; }
    return this;
  };
  // World transform of one bone from its parent (no scale, no shear: a bone is a point and an angle).
  Pose.prototype.world = function (i) {
    const b = this.c.bones[i], l = this.L[i], w = this.W[i];
    if (b.p < 0) { w.x = l.x; w.y = l.y; w.r = l.r; return; }
    const p = this.W[b.p], q = rot([l.x, l.y], p.r);
    w.x = p.x + q[0]; w.y = p.y + q[1]; w.r = p.r + l.r;
  };
  Pose.prototype.update = function () {
    const n = this.c.bones.length;
    for (let i = 0; i < n; i++) this.world(i);
    this.c.ik.forEach((k, j) => this.solveIK(k, j));
    return this;
  };
  // Two-bone IK: the chain b1 → b2 reaches the target bone; bend -1 or +1 picks the side of the middle joint.
  // The foot (if any) then copies the target's world angle. Children of the chain follow.
  Pose.prototype.solveIK = function (k, j) {
    const mix = this.ikMix[j];
    if (!mix) return;
    const B = this.c.bones, b1 = B[k.b1], b2 = B[k.b2], W1 = this.W[k.b1], T = this.W[k.t];
    const l1 = b2.x, l2 = b2.len;   // the middle joint sits at the end of b1 (b2.x along it)
    const dx = T.x - W1.x, dy = T.y - W1.y, d0 = Math.hypot(dx, dy);
    const d = Math.max(Math.abs(l1 - l2) + 0.001, Math.min(l1 + l2 - 0.001, d0));
    this.stretch[j] = d0 - (l1 + l2);   // > 0: the target is out of reach (the checks report it)
    const base = Math.atan2(dy, dx) / D2R;
    const al = Math.acos(Math.max(-1, Math.min(1, (l1 * l1 + d * d - l2 * l2) / (2 * l1 * d)))) / D2R;
    const a1 = base + k.bend * al;
    const knee = [W1.x + Math.cos(a1 * D2R) * l1, W1.y + Math.sin(a1 * D2R) * l1];
    const a2 = Math.atan2(T.y - knee[1], T.x - knee[0]) / D2R;
    const pr = b1.p >= 0 ? this.W[b1.p].r : 0;
    const L1 = this.L[k.b1], L2 = this.L[k.b2];
    L1.r += wrap(a1 - pr - L1.r) * mix;
    this.world(k.b1);
    L2.r += wrap(a2 - this.W[k.b1].r - L2.r) * mix;
    this.world(k.b2);
    if (k.foot >= 0) { const Lf = this.L[k.foot]; Lf.r += wrap(T.r - this.W[k.b2].r - Lf.r) * mix; }
    // everything below the chain follows
    for (let i = k.b2 + 1; i < B.length; i++) if (isUnder(this.c, i, k.b1)) this.world(i);
  };
  function isUnder(c, i, root) {
    for (let p = c.bones[i].p; p >= 0; p = c.bones[p].p) if (p === root) return true;
    return false;
  }
  // Draw-order keys move a whole ink group: { group: ['after' | 'before', otherGroup] }.
  // (Spine stores slot offsets; naming the neighbour is easier to read and cannot drift.)
  function orderWith(c, o) {
    let ord = c.slots.map((s, i) => i);
    for (const g in o) {
      const [rel, other] = o[g] || [];
      const members = ord.filter((k) => c.slots[k].ink === g);
      if (!members.length) continue;
      const rest = ord.filter((k) => c.slots[k].ink !== g);
      const tgt = [];
      rest.forEach((k, j) => { if (c.slots[k].ink === other) tgt.push(j); });
      if (!tgt.length) continue;
      const pos = rel === 'before' ? tgt[0] : tgt[tgt.length - 1] + 1;
      ord = [...rest.slice(0, pos), ...members, ...rest.slice(pos)];
    }
    return ord;
  }

  /* ------------------------------------------------------------- animation */
  // Easing into a key. A key is [time, value, curve]; the curve shapes the motion from the previous key.
  const EASE = {
    lin: (x) => x,
    io: (x) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2),
    sine: (x) => 0.5 - Math.cos(Math.PI * x) / 2,
    in: (x) => x * x * x,
    out: (x) => 1 - Math.pow(1 - x, 3),
    in2: (x) => x * x,
    out2: (x) => 1 - (1 - x) * (1 - x),
    back: (x) => 1 + 2.2 * Math.pow(x - 1, 3) + 1.2 * Math.pow(x - 1, 2),
    step: () => 0,
  };
  function sampleKeys(keys, t) {
    if (!keys || !keys.length) return 0;
    if (t <= keys[0][0]) return keys[0][1];
    const last = keys[keys.length - 1];
    if (t >= last[0]) return last[1];
    let i = 0;
    while (i < keys.length - 2 && t >= keys[i + 1][0]) i++;
    const [t0, v0] = keys[i], [t1, v1, e] = keys[i + 1];
    const k = (EASE[e] || EASE.sine)((t - t0) / (t1 - t0 || 1));
    return typeof v0 === 'number' ? v0 + (v1 - v0) * k : k < 1 ? v0 : v1;
  }
  const stepKeys = (keys, t) => { let v = null; for (const [kt, kv] of keys || []) if (t >= kt - 1e-6) v = kv; return v; };
  // The offsets of an animation at time t: { bones, slots, order, ik }.
  function sample(anim, t) {
    const o = { bones: {}, slots: {}, order: null, ik: {} };
    for (const n in anim.bones || {}) {
      const tl = anim.bones[n];
      o.bones[n] = { r: tl.r ? sampleKeys(tl.r, t) : 0, x: tl.x ? sampleKeys(tl.x, t) : 0, y: tl.y ? sampleKeys(tl.y, t) : 0 };
    }
    for (const n in anim.slots || {}) { const v = stepKeys(anim.slots[n], t); if (v !== null) o.slots[n] = v; }
    if (anim.order) o.order = stepKeys(anim.order, t);
    for (const n in anim.ik || {}) o.ik[n] = sampleKeys(anim.ik[n], t);
    return o;
  }
  // Blend two sets of offsets (crossfades): numbers mix, attachments and order switch to b.
  function blend(a, b, k) {
    if (!a) return b;
    const o = { bones: {}, slots: Object.assign({}, b.slots), order: b.order, ik: {} };
    const names = new Set([...Object.keys(a.bones), ...Object.keys(b.bones)]);
    for (const n of names) {
      const x = a.bones[n] || { r: 0, x: 0, y: 0 }, y = b.bones[n] || { r: 0, x: 0, y: 0 };
      o.bones[n] = { r: x.r + wrap(y.r - x.r) * k, x: x.x + (y.x - x.x) * k, y: x.y + (y.y - x.y) * k };
    }
    for (const n of new Set([...Object.keys(a.ik || {}), ...Object.keys(b.ik || {})])) {
      const x = a.ik && a.ik[n] != null ? a.ik[n] : 1, y = b.ik && b.ik[n] != null ? b.ik[n] : 1;
      o.ik[n] = x + (y - x) * k;
    }
    return o;
  }

  // Plays animations on one character: play() crossfades from whatever is on screen, then() queues
  // the next one (a one-shot returns to it when it ends), events fire as their time is crossed.
  function State(anims) {
    this.anims = anims;
    this.cur = null; this.t = 0; this.from = null; this.mix = 0; this.mixDur = 0; this.next = []; this.last = null;
    this.onEvent = null;
  }
  State.prototype.play = function (name, opt) {
    opt = opt || {};
    const a = this.anims[name];
    if (!a) throw new Error('no animation ' + name);
    this.from = this.cur ? this.offsets() : null;
    this.cur = { name, a, loop: opt.loop != null ? opt.loop : !!a.loop };
    this.t = opt.at || 0; this.mix = 0; this.mixDur = this.from ? (opt.mix != null ? opt.mix : a.mix != null ? a.mix : 0.12) : 0;
    this.next = [];
    return this;
  };
  State.prototype.then = function (name, opt) { this.next.push([name, opt || {}]); return this; };
  State.prototype.update = function (dt) {
    if (!this.cur) return this;
    const a = this.cur.a, t0 = this.t;
    this.t += dt;
    this.mix = Math.min(1, this.mixDur ? this.mix + dt / this.mixDur : 1);
    // events crossed during this step (loops wrap)
    for (const ev of a.events || []) {
      const et = ev[0];
      const hit = this.cur.loop ? crossed(t0 % a.dur, (t0 % a.dur) + dt, et, a.dur) : t0 < et && this.t >= et;
      if (hit && this.onEvent) this.onEvent(ev[1], ev[2], this.cur.name);
    }
    if (!this.cur.loop && this.t >= a.dur && this.next.length) {
      const [n, o] = this.next.shift(), rest = this.next;
      this.play(n, o);
      this.next = rest;
    }
    return this;
  };
  const crossed = (a, b, e, dur) => (b <= dur ? a < e && b >= e : a < e || (b - dur) >= e);
  State.prototype.time = function () { const a = this.cur.a; return this.cur.loop ? ((this.t % a.dur) + a.dur) % a.dur : Math.min(this.t, a.dur); };
  State.prototype.offsets = function () {
    if (!this.cur) return null;
    const o = sample(this.cur.a, this.time());
    return this.from && this.mix < 1 ? blend(this.from, o, EASE.sine(this.mix)) : o;
  };

  /* ------------------------------------------------------------- springs */
  // Secondary motion: the tip of a spring bone is a weight pulled towards where the animation puts
  // it by a damped spring, so it trails behind fast moves and settles (hair, cloth tails). The bone
  // turns towards its tip, never more than spring.max degrees. State lives on each character.
  // floor(i): how far below the floor what hangs on bone i goes (> 0: through it). The swing is
  // cut back until it stays above (soft parts squash on the floor instead of passing through).
  function springs(pose, st, dt, floor) {
    const c = pose.c;
    dt = Math.max(1 / 240, Math.min(1 / 20, dt || 1 / 60));
    c.bones.forEach((b, i) => {
      const S = b.spring;
      if (!S) return;
      const w = pose.W[i], L = b.len || 10, rest = [w.x + Math.cos(w.r * D2R) * L, w.y + Math.sin(w.r * D2R) * L];
      const s = st[i] || (st[i] = { p: rest.slice(), v: [0, 0] });
      for (const j of [0, 1]) { s.v[j] += ((rest[j] - s.p[j]) * S.k - s.v[j] * S.damp) * dt; s.p[j] += s.v[j] * dt; }
      const off = Math.max(-S.max, Math.min(S.max, wrap(angOf([s.p[0] - w.x, s.p[1] - w.y]) - w.r))), base = pose.L[i].r;
      const set = (k) => { pose.L[i].r = base + off * k; pose.world(i); for (let j = i + 1; j < c.bones.length; j++) if (isUnder(c, j, i)) pose.world(j); };
      set(1);
      if (floor && floor(i) > 0.3) {
        let lo = 0, hi = 1;
        for (let it = 0; it < 7; it++) { const k = (lo + hi) / 2; set(k); if (floor(i) > 0.3) hi = k; else lo = k; }
        set(lo);
        s.p = [w.x + Math.cos((w.r + off * lo) * D2R) * L, w.y + Math.sin((w.r + off * lo) * D2R) * L]; s.v = [0, 0];
      }
    });
  }

  /* ------------------------------------------------------------- skins */
  // A skin: { name, att: { slot: { attachmentName: attachment } }, pal: { token: '#colour' } }.
  // The character wears skins in order; for each slot the last skin that has the attachment wins.
  function lookup(skins, slot, name) {
    if (!name) return null;
    for (let i = skins.length - 1; i >= 0; i--) {
      const s = skins[i].att && skins[i].att[slot];
      if (s && Object.prototype.hasOwnProperty.call(s, name)) return { a: s[name], skin: skins[i] };
    }
    return null;
  }
  function palette(skins, look) {
    const pal = {};
    for (const s of skins) Object.assign(pal, s.pal || {});
    return Object.assign(pal, (look && look.pal) || {});
  }
  // A fill: '#rrggbb' or '$token' from the palette.
  const colourOf = (v, pal) => (typeof v === 'string' && v[0] === '$' ? pal[v.slice(1)] || '#ff00ff' : v || '#ff00ff');

  /* ------------------------------------------------------------- drawing */
  const LIGHT = [-2.3, -1.7];   // the lit copy is shifted up-left: the shadow sits on the lower right
  const PAINTERS = {};          // kind -> (items, ctx, pose) => svg, for attachments drawn as a group (hair)
  // The frame an attachment is drawn in: its bone's world transform, turned upright for upright bones.
  function frameOf(pose, i) {
    const w = pose.W[i];
    return { x: w.x, y: w.y, r: w.r + pose.c.bones[i].art };
  }
  const tf = (F) => `translate(${f2(F.x)},${f2(F.y)}) rotate(${f2(F.r)})`;
  const toWorld = (F, p) => { const q = rot(p, F.r); return [F.x + q[0], F.y + q[1]]; };
  // One attachment's paint: base fill, then the cel shadow (a lit copy shifted towards the light,
  // clipped to the shape), then its details (lines, marks) in the same frame.
  function paintFill(a, F, ctx, far) {
    const g = geomOf(a);
    if (!g.d) return a.svg ? `<g transform="${tf(F)}">${a.svg}</g>` : '';
    const base = colourOf(a.fill, ctx.pal), fill = far ? shade(base, -0.12) : base;
    const sh = a.sh ? shade(colourOf(a.sh, ctx.pal), far ? -0.1 : 0) : lum(base) < 0.2 ? shade(fill, 0.16) : shade(fill, -0.24);
    let s = `<path d="${g.d}" fill="${fill}"/>`;
    if (a.shade !== false && ctx.shading) {
      const id = ctx.uid + 'c' + ctx.n++, k = a.cel || 1, off = rot([LIGHT[0] * k, LIGHT[1] * k], -F.r);
      s = `<clipPath id="${id}"><path d="${g.d}"/></clipPath><g clip-path="url(#${id})"><path d="${g.d}" fill="${sh}"/><path d="${g.d}" fill="${fill}" transform="translate(${f2(off[0])},${f2(off[1])})"/></g>`;
    }
    if (a.lines) for (const L of a.lines) s += `<path d="${L.d}" fill="none" stroke="${L.c ? colourOf(L.c, ctx.pal) : ctx.line}" stroke-width="${L.w || 1}" stroke-linecap="round" stroke-linejoin="round"${L.op != null ? ` opacity="${L.op}"` : ''}/>`;
    if (a.svg) s += a.svg;
    return `<g transform="${tf(F)}">${s}</g>`;
  }
  function paintOutline(a, F, ctx) {
    const g = geomOf(a);
    if (!g.d || a.outline === false) return '';
    const col = a.line ? colourOf(a.line, ctx.pal) : ctx.line;
    return `<path d="${g.d}" transform="${tf(F)}" fill="none" stroke="${col}" stroke-width="${f2(ctx.lineW * 2)}" stroke-linejoin="round" stroke-linecap="round"/>`;
  }
  // One ink group as one shape: every outline first, then the fills; the cel shadow is cut from the
  // whole group (all pieces in their shadow tone, then all of them again shifted towards the light,
  // clipped to the group), so where pieces overlap inside the silhouette no edge or shadow shows.
  function paintGroup(items, ctx) {
    let outl = '', clip = '', dark = '', lit = '', det = '';
    const id = ctx.uid + 'g' + ctx.n++;
    for (const it of items) {
      const a = it.a, g = geomOf(a), T = tf(it.F);
      outl += paintOutline(a, it.F, ctx);
      if (g.d) {
        const base = colourOf(a.fill, ctx.pal), fill = it.far ? shade(base, -0.12) : base, flat = a.shade === false || !ctx.shading;
        const sh = flat ? fill : a.sh ? shade(colourOf(a.sh, ctx.pal), it.far ? -0.1 : 0) : lum(base) < 0.2 ? shade(fill, 0.16) : shade(fill, -0.24);
        const k = flat ? 0 : a.cel || 1;
        clip += `<path d="${g.d}" transform="${T}"/>`;
        dark += `<path d="${g.d}" transform="${T}" fill="${sh}"/>`;
        lit += `<path d="${g.d}" transform="${k ? `translate(${f2(LIGHT[0] * k)},${f2(LIGHT[1] * k)}) ` : ''}${T}" fill="${fill}"/>`;
      }
      let d = '';
      if (a.lines) for (const L of a.lines) d += `<path d="${L.d}" fill="none" stroke="${L.c ? colourOf(L.c, ctx.pal) : ctx.line}" stroke-width="${L.w || 1}" stroke-linecap="round" stroke-linejoin="round"${L.op != null ? ` opacity="${L.op}"` : ''}/>`;
      if (a.svg) d += a.svg;
      if (d) det += `<g transform="${T}">${d}</g>`;
    }
    const cel = !clip ? '' : ctx.shading ? `<clipPath id="${id}">${clip}</clipPath><g clip-path="url(#${id})">${dark}${lit}</g>` : lit;
    return outl + cel + det;
  }
  // A picture asset (a transparent PNG) placed in its bone's frame: x, y, w, h in that frame's units.
  const imageTag = (it) => `<image href="${it.a.href}" x="${f2(it.a.x)}" y="${f2(it.a.y)}" width="${f2(it.a.w)}" height="${f2(it.a.h)}" preserveAspectRatio="none" transform="${tf(it.F)}"/>`;
  PAINTERS.image = (items) => items.map(imageTag).join('');
  // Accessories made of several parts (a weapon: grip, guard, blade): each part keeps its own
  // outline, so the guard reads in front of the blade. Painted in the order listed.
  PAINTERS.parts = (items, ctx) => items.map((it) => it.a.parts.map((p) => paintOutline(p, it.F, ctx) + paintFill(p, it.F, ctx, it.far)).join('')).join('');
  // Every attachment on screen, in draw order, grouped by ink group: [{ ink, items: [{ slot, a, F, far }] }].
  function layout(pose, skins) {
    const c = pose.c, groups = [];
    for (const si of pose.order) {
      const s = c.slots[si], name = pose.att[si], hit = lookup(skins, s.name, name);
      if (!hit || !hit.a) continue;
      const list = Array.isArray(hit.a) ? hit.a : [hit.a];
      for (const a of list) {
        const item = { slot: s, a, F: frameOf(pose, s.b), far: s.tint === 'far' };
        const g = groups[groups.length - 1];
        if (g && g.ink === s.ink) g.items.push(item); else groups.push({ ink: s.ink, items: [item] });
      }
    }
    return groups;
  }
  // The whole character, in rig space (ground at y 0, facing right). opt: { uid, flip, shading, lineW, line, sticker, overlay }.
  function draw(ch, opt) {
    opt = opt || {};
    const pose = ch.pose, skins = ch.skins;
    const ctx = { uid: (opt.uid || 'rg') + '_', n: 0, pal: palette(skins, ch.look), shading: opt.shading !== false, lineW: opt.lineW || RIG.LINE_W, line: opt.line || RIG.INK };
    const groups = layout(pose, skins);
    let s = '';
    for (const g of groups) {
      // a group of a special kind (hair, weapons) is painted by its own painter, as one unit
      const P = PAINTERS[g.items[0].a.kind];
      s += P ? P(g.items, ctx, pose) : paintGroup(g.items, ctx);
    }
    const lo = ch.ground != null ? ch.ground : groundShadow(pose);
    const shadow = `<ellipse cx="${f2(lo[0])}" cy="1" rx="${f2(lo[1])}" ry="4.6" fill="#000" opacity=".4"/>`;
    const fig = opt.sticker === false ? `<g>${s}</g>` : `<g filter="url(#rigStk)">${s}</g>`;
    const body = shadow + fig + (opt.overlay ? overlay(pose, opt.overlay) : '');
    return opt.flip ? `<g transform="scale(-1,1)">${body}</g>` : body;
  }
  // The shadow on the floor under whatever is lowest.
  function groundShadow(pose) {
    const xs = [], c = pose.c;
    for (const n of ['footN', 'footF', 'hip', 'chest', 'skull']) { const i = c.idx[n]; if (i != null && pose.W[i].y > -40) xs.push(pose.W[i].x); }
    if (!xs.length) return [pose.W[c.idx.hip || 0].x, 22];
    const lo = Math.min(...xs), hi = Math.max(...xs);
    return [(lo + hi) / 2, Math.max(18, (hi - lo) / 2 + 14)];
  }
  // Debug overlay: bones (as tapered bars), joints, names, ink groups.
  function overlay(pose, what) {
    const c = pose.c;
    let s = '';
    if (what.groups) {
      const groups = layout(pose, what.skins || []);
      const hues = groups.map((_, i) => (i * 47) % 360);
      groups.forEach((g, gi) => g.items.forEach((it) => { const gg = geomOf(it.a); if (gg.d) s += `<path d="${gg.d}" transform="${tf(it.F)}" fill="hsl(${hues[gi]},80%,55%)" fill-opacity=".28" stroke="hsl(${hues[gi]},80%,40%)" stroke-width=".6"/>`; }));
    }
    if (what.bones) {
      c.bones.forEach((b, i) => {
        const w = pose.W[i];
        if (b.len) {
          const e = toWorld({ x: w.x, y: w.y, r: w.r }, [b.len, 0]), n = rot([0, 1.6], w.r);
          s += `<path d="M${P2([w.x + n[0], w.y + n[1]])}L${P2(e)}L${P2([w.x - n[0], w.y - n[1]])}Z" fill="#ffd23a" fill-opacity=".85" stroke="#7a5200" stroke-width=".4"/>`;
        }
        s += `<circle cx="${f2(w.x)}" cy="${f2(w.y)}" r="${b.p < 0 ? 2.4 : 1.4}" fill="${c.ik.some((k) => k.t === i) ? '#ff3f7f' : '#fff'}" stroke="#222" stroke-width=".5"/>`;
        if (what.names) s += `<text x="${f2(w.x + 2)}" y="${f2(w.y - 2)}" font-size="3.6" fill="#fff" stroke="#000" stroke-width=".25" paint-order="stroke">${b.name}</text>`;
      });
    }
    return s;
  }

  /* ------------------------------------------------------------- characters */
  // A character: the canonical skeleton + skins + an animation state. Cosmetics are skins only.
  function Character(def, skins, anims, look) {
    this.def = def; this.skins = skins.filter(Boolean); this.look = look || {};
    this.pose = new Pose(def); this.state = new State(anims || {}); this.spring = {};
    this.pose.reset().update();
  }
  Character.prototype.setSkins = function (skins) { this.skins = skins.filter(Boolean); return this; };
  Character.prototype.tick = function (dt) {
    this.state.update(dt);
    this.pose.reset().apply(this.state.offsets()).update();
    springs(this.pose, this.spring, dt, (i) => this.below(i));
    return this;
  };
  // How far below the floor the attachments hanging on bone i go (negative: above it).
  Character.prototype.below = function (i) {
    const P = this.pose;
    let low = -Infinity;
    P.c.slots.forEach((s, si) => {
      if (s.b !== i) return;
      const hit = lookup(this.skins, s.name, P.att[si]);
      if (!hit || !hit.a) return;
      const F = frameOf(P, i);
      for (const a of hit.a.parts || hit.a.shapes || [hit.a]) for (const q of geomOf(a).poly || []) { const y = F.y + q[0] * Math.sin(F.r * D2R) + q[1] * Math.cos(F.r * D2R); if (y > low) low = y; }
    });
    return low;
  };
  // A still frame of an animation at time t (springs at rest), for previews and the checks.
  Character.prototype.at = function (name, t) {
    const a = this.state.anims[name];
    this.pose.reset().apply(a ? sample(a, t) : null).update();
    return this;
  };
  Character.prototype.svg = function (opt) { return draw(this, opt); };

  // World-space polygons of everything drawn, in draw order (for the checks).
  function worldShapes(pose, skins) {
    const out = [];
    for (const g of layout(pose, skins)) for (const it of g.items) {
      for (const a of it.a.parts || it.a.shapes || [it.a]) {
        const poly = geomOf(a).poly;
        if (!poly || !poly.length || a.outline === false) continue;
        out.push({ slot: it.slot.name, ink: g.ink, bone: pose.c.bones[it.slot.b].name, kind: it.a.kind, poly: poly.map((p) => toWorld(it.F, p)) });
      }
    }
    return out;
  }

  /* ------------------------------------------------------------- page defs */
  // The sticker rim around the whole figure (dark contour + pale rim), shared by the page.
  const DEFS = `<filter id="rigStk" x="-30%" y="-20%" width="160%" height="140%" color-interpolation-filters="sRGB">`
    + `<feMorphology in="SourceAlpha" operator="dilate" radius="1.1" result="k"/><feMorphology in="SourceAlpha" operator="dilate" radius="2.4" result="w"/>`
    + `<feFlood flood-color="#e9edf6"/><feComposite in2="w" operator="in" result="W"/><feFlood flood-color="#0a0c11"/><feComposite in2="k" operator="in" result="K"/>`
    + `<feMerge><feMergeNode in="W"/><feMergeNode in="K"/><feMergeNode in="SourceGraphic"/></feMerge></filter>`;
  function defs() {
    if (typeof document === 'undefined' || document.getElementById('rig-defs')) return;
    const d = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    d.id = 'rig-defs';
    d.setAttribute('style', 'position:absolute;width:0;height:0;overflow:hidden');
    d.setAttribute('aria-hidden', 'true');
    d.innerHTML = `<defs>${DEFS}</defs>`;
    document.body.appendChild(d);
  }

  return {
    LINE_W: 1.2, INK: '#0a0c11', D2R, EASE,
    f2, P2, rot, dirOf, angOf, wrap, shade, lum,
    curve, curvePts, capsulePts, capsulePath, circlePath, circlePts, geomOf,
    compile, Pose, State, Character, sample, blend, sampleKeys, lookup, palette, colourOf,
    draw, layout, worldShapes, frameOf, toWorld, tf, defs, overlay, PAINTERS, paintFill, paintOutline, LIGHT, imageTag,
  };
})();
if (typeof module !== 'undefined') module.exports = RIG;
