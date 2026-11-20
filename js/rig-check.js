'use strict';
/* ==========================================================================
   TRI-REALM — automated checks of the canonical rig (v3)
   Plays every animation of every combination of cosmetics frame by frame and
   measures what used to go wrong by eye:
   - disconnected joints (a child bone not at the end of its parent, a foot
     not on its IK target), gaps at joints (the pieces around a joint must
     cover it at every angle);
   - incorrect draw order (near limbs over the body, far ones behind, a hand
     never on another layer than its arm), torso pieces covering the legs;
   - feet through the floor, feet sliding while planted, jumps between frames,
     loops that do not close, animations that move bones they must not;
   - missing attachments, skins that touch the skeleton;
   - hair: required layers, alignment with the head reference (see rig-hair.js).
   Pure functions: RIG_CHECK.static(), RIG_CHECK.anim(), RIG_CHECK.all(). Used by
   rig.html (the Rig Lab) and by headless tests. Loaded after the rig data.
   ========================================================================== */
const RIG_CHECK = (() => {
  const FPS = 60;
  const inside = (p, poly) => {
    let c = false;
    for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
      const a = poly[i], b = poly[j];
      if ((a[1] > p[1]) !== (b[1] > p[1]) && p[0] < ((b[0] - a[0]) * (p[1] - a[1])) / (b[1] - a[1]) + a[0]) c = !c;
    }
    return c;
  };
  const inAny = (p, polys) => polys.some((q) => inside(p, q));
  const dist = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1]);
  const W = (pose, n) => { const w = pose.W[pose.c.idx[n]]; return [w.x, w.y]; };
  const endOf = (pose, n) => { const i = pose.c.idx[n], w = pose.W[i], L = pose.c.bones[i].len; return [w.x + Math.cos(w.r * RIG.D2R) * L, w.y + Math.sin(w.r * RIG.D2R) * L]; };
  const fmt = (v) => (Math.round(v * 100) / 100).toString();
  const R = (id, group, name, status, detail, where) => ({ id, group, name, status, detail: detail || '', where: where || null });

  /* ------------------------------------------------------------- static */
  // The skeleton must be the canonical one; skins may only hold attachments and colours.
  function staticChecks(skins) {
    const out = [], C = RIG_CANON, c = RIG.compile(RIG_SKELETON), bad = [];
    const want = { torso: C.len.torso, chest: C.len.chest, neck: C.len.neck, head: C.len.head, upperArmN: C.len.upperArm, upperArmF: C.len.upperArm,
      foreArmN: C.len.foreArm, foreArmF: C.len.foreArm, handN: C.len.hand, handF: C.len.hand, thighN: C.len.thigh, thighF: C.len.thigh, shinN: C.len.shin, shinF: C.len.shin, footN: C.len.foot, footF: C.len.foot };
    for (const n in want) { const b = c.bones[c.idx[n]]; if (!b || Math.abs(b.len - want[n]) > 1e-6) bad.push(`${n} length ${b ? b.len : 'missing'} ≠ ${want[n]}`); }
    // each child joint sits exactly at the end of its parent bone
    for (const [ch, pa] of [['chest', 'torso'], ['neck', 'chest'], ['head', 'neck'], ['skull', 'head'], ['foreArmN', 'upperArmN'], ['handN', 'foreArmN'], ['gripN', 'handN'], ['foreArmF', 'upperArmF'], ['handF', 'foreArmF'], ['gripF', 'handF'], ['shinN', 'thighN'], ['footN', 'shinN'], ['shinF', 'thighF'], ['footF', 'shinF']]) {
      const P = new RIG.Pose(RIG_SKELETON).reset().update();
      const d = dist(W(P, ch), endOf(P, pa));
      if (d > 1e-6) bad.push(`${ch} is ${fmt(d)} away from the end of ${pa}`);
    }
    if (c.bones.some((b) => b.spring && !/^hair/.test(b.name))) bad.push('only hair bones may be springs');
    out.push(R('canon.skeleton', 'Canonical model', 'Bone lengths and joints match RIG_CANON', bad.length ? 'fail' : 'pass', bad.join('; ') || `${c.bones.length} bones, ${RIG_CANON.height.toFixed(1)} units tall (${(RIG_CANON.height / (2 * RIG_CANON.headR)).toFixed(2)} heads)`));

    // draw order rules on the canonical slot list
    const pos = {};
    c.slots.forEach((s, i) => { if (pos[s.ink] == null) pos[s.ink] = i; });
    const before = (a, b) => pos[a] != null && pos[b] != null && pos[a] < pos[b];
    const rules = [['hairBack', 'body'], ['back', 'body'], ['armF', 'body'], ['handF', 'body'], ['legF', 'legN'], ['legN', 'body'], ['footN', 'body'], ['body', 'pants'], ['pants', 'top'], ['top', 'belt'],
      ['body', 'head'], ['head', 'face'], ['hairShade', 'face'], ['face', 'hair'], ['hair', 'hat'], ['top', 'armN'], ['head', 'armN'], ['armN', 'sleeveN'], ['sleeveN', 'weaponN'], ['weaponN', 'handN'], ['armF', 'sleeveF'], ['weaponF', 'handF']];
    const broken = rules.filter(([a, b]) => !before(a, b)).map(([a, b]) => `${a} should be drawn before ${b}`);
    // the slots of one ink group are consecutive (one silhouette)
    const seen = new Set();
    c.slots.forEach((s, i) => { if (seen.has(s.ink) && c.slots[i - 1].ink !== s.ink) broken.push(`ink group ${s.ink} is split`); seen.add(s.ink); });
    const farOk = c.slots.filter((s) => s.tint === 'far').every((s) => /F(\.|$)/.test(s.name));
    if (!farOk) broken.push('a far-tinted slot is not on the far side');
    out.push(R('order.canon', 'Draw order', 'Canonical draw order (far limbs, near limbs, body, head, near arm)', broken.length ? 'fail' : 'pass', broken.join('; ') || `${c.slots.length} slots in ${new Set(c.slots.map((s) => s.ink)).size} ink groups`));

    // skins: attachments and colours only, on slots that exist
    const sk = [];
    for (const s of skins) {
      for (const k of Object.keys(s)) if (!['name', 'id', 'label', 'pal', 'att', 'meta'].includes(k)) sk.push(`${s.name}: unexpected field "${k}"`);
      for (const slot in s.att || {}) {
        if (c.slotIdx[slot] == null) sk.push(`${s.name}: no slot "${slot}"`);
        for (const n in s.att[slot]) {
          const a = s.att[slot][n];
          if (!a) continue;
          for (const k of ['bones', 'len', 'scale', 'sx', 'sy', 'bone']) if (k in a) sk.push(`${s.name}/${slot}/${n}: field "${k}" would touch the skeleton`);
        }
      }
    }
    out.push(R('skins.skeleton', 'Attachments', 'Cosmetics never touch the skeleton', sk.length ? 'fail' : 'pass', sk.join('; ') || `${skins.length} skins: attachments and colours only`));

    // attachments stay near their bone (catches art drawn in the wrong frame)
    const far = [];
    for (const s of skins) for (const slot in s.att || {}) {
      const si = c.slotIdx[slot];
      if (si == null) continue;
      const b = c.bones[c.slots[si].b], lim = b.name === 'skull' || /^hair/.test(b.name) ? 70 : b.name === 'chest' || b.name === 'gripN' || b.name === 'gripF' ? 95 : Math.max(26, b.len + 18);
      for (const n in s.att[slot]) {
        const a = s.att[slot][n];
        if (!a) continue;
        for (const part of a.parts || [a]) {
          const poly = RIG.geomOf(part).poly || [];
          const m = poly.reduce((x, p) => Math.max(x, Math.hypot(p[0], p[1])), 0);
          if (m > lim) far.push(`${s.name}/${slot}/${n} reaches ${fmt(m)} from ${b.name} (max ${lim})`);
        }
      }
    }
    out.push(R('skins.frame', 'Attachments', 'Every attachment is drawn in its bone frame', far.length ? 'fail' : 'pass', far.join('; ') || 'all within reach of their bone'));

    // feet and shoes stay in the canonical foot box (animations rely on it to keep feet on the floor)
    const box = RIG_CANON.footBox, xs = box.map((p) => p[0]), out2 = [];
    for (const s of skins) for (const slot of ['footN', 'footF']) for (const n in (s.att && s.att[slot]) || {}) {
      const poly = RIG.geomOf(s.att[slot][n]).poly || [];
      const bad = poly.filter((p) => p[1] > RIG_CANON.footH + 0.01 || p[0] < Math.min(...xs) - 0.4 || p[0] > Math.max(...xs) + 0.4);
      if (bad.length) out2.push(`${s.name}/${slot}/${n}: ${bad.length} points outside the foot box`);
    }
    out.push(R('skins.footbox', 'Attachments', 'Feet and shoes fit the canonical foot box', out2.length ? 'fail' : 'pass', out2.join('; ') || 'soles on the ground line, heel and toe inside the box'));
    return out;
  }

  // Attachments the animations ask for must exist in the character's skins.
  function missingChecks(skins, anims, label) {
    const out = [], miss = [];
    const has = (slot, name) => !!RIG.lookup(skins, slot, name);
    // the bare body fills every body slot
    for (const [slot, name] of [['armN.upper', 'skin'], ['armN.fore', 'skin'], ['handN', 'fist'], ['armF.upper', 'skin'], ['armF.fore', 'skin'], ['handF', 'fist'],
      ['legN.thigh', 'skin'], ['legN.shin', 'skin'], ['footN', 'foot'], ['legF.thigh', 'skin'], ['legF.shin', 'skin'], ['footF', 'foot'],
      ['body.pelvis', 'skin'], ['body.belly', 'skin'], ['body.chest', 'skin'], ['body.neck', 'skin'], ['head', 'head'], ['face', 'neutral']]) if (!has(slot, name)) miss.push(`${slot}/${name}`);
    if (!RIG.lookup([RIG_BODY], 'ear', 'ear')) miss.push('ear/ear (the body has no ear)');
    for (const n in anims) for (const slot in anims[n].slots || {}) for (const [, v] of anims[n].slots[slot]) if (v && !has(slot, v)) miss.push(`${n}: ${slot}/${v}`);
    // garments come in whole pieces: a forearm sleeve needs its upper sleeve, a trouser shin its thigh
    for (const s of ['N', 'F']) {
      if (has(`sleeve${s}.fore`, 'sleeve') && !has(`sleeve${s}.upper`, 'sleeve')) miss.push(`sleeve${s}.upper (the forearm sleeve has no upper half)`);
      if (has(`pant${s}.shin`, 'pant') && !has(`pant${s}.thigh`, 'pant')) miss.push(`pant${s}.thigh (the trouser leg has no thigh)`);
      if (has(`pant${s}.thigh`, 'pant') && !has('pants', 'pants')) miss.push('pants (trouser legs without a seat)');
    }
    out.push(R('att.missing', 'Attachments', 'No missing attachments' + (label ? ` (${label})` : ''), miss.length ? 'fail' : 'pass', miss.join('; ') || 'every slot the body and the animations use is filled'));
    return out;
  }

  /* ------------------------------------------------------------- per frame */
  const CHAINS = [['chest', 'torso'], ['neck', 'chest'], ['head', 'neck'], ['skull', 'head'], ['foreArmN', 'upperArmN'], ['handN', 'foreArmN'], ['gripN', 'handN'],
    ['foreArmF', 'upperArmF'], ['handF', 'foreArmF'], ['gripF', 'handF'], ['shinN', 'thighN'], ['footN', 'shinN'], ['shinF', 'thighF'], ['footF', 'shinF']];
  // Joints and the slots whose union must cover them: a circle around the joint (radius: the limb's
  // width there) and the first part of both bones on each side, so a piece that stops short of the
  // joint shows as a gap even when the neighbour's round end covers the joint itself.
  // [name, bone at the joint, radius, slots, slots that must exist, parent bone, reach along the bones]
  function jointsOf() {
    const r = RIG_CANON.r, J = [];
    for (const s of ['N', 'F']) {
      J.push([`elbow${s}`, `foreArm${s}`, r.foreArm[0], [`arm${s}.upper`, `arm${s}.fore`], null, `upperArm${s}`, 0.4]);
      J.push([`wrist${s}`, `hand${s}`, r.foreArm[1], [`arm${s}.fore`, `hand${s}`], null, `foreArm${s}`, 0.4]);
      J.push([`shoulder${s}`, `upperArm${s}`, r.upperArm[0] * 0.8, [`arm${s}.upper`, 'body.chest'], null, null, 0.3]);
      J.push([`knee${s}`, `shin${s}`, r.shin[0], [`leg${s}.thigh`, `leg${s}.shin`], null, `thigh${s}`, 0.4]);
      J.push([`ankle${s}`, `foot${s}`, r.shin[1], [`leg${s}.shin`, `foot${s}`], null, `shin${s}`, 0.3]);
      J.push([`hip${s}`, `thigh${s}`, r.thigh[0], [`leg${s}.thigh`, 'body.pelvis'], null, null, 0.4]);
      // clothes over a joint must cover it too (a sleeve or a trouser leg bending)
      J.push([`sleeveElbow${s}`, `foreArm${s}`, r.foreArm[0] + 2.2, [`sleeve${s}.upper`, `sleeve${s}.fore`], [`sleeve${s}.fore`], `upperArm${s}`, 0.15]);
      J.push([`pantKnee${s}`, `shin${s}`, r.shin[0] + 2.4, [`pant${s}.thigh`, `pant${s}.shin`], [`pant${s}.shin`], `thigh${s}`, 0.3]);
      J.push([`pantHip${s}`, `thigh${s}`, r.thigh[0] + 2.4, [`pant${s}.thigh`, 'pants'], [`pant${s}.thigh`], null, 0.3]);
    }
    J.push(['waist', 'chest', 10, ['body.belly', 'body.chest'], null, 'torso', 0.3], ['pelvis', 'torso', 10, ['body.pelvis', 'body.belly'], null, null, 0.3], ['neck', 'neck', RIG_CANON.r.neck * 0.9, ['body.chest', 'body.neck']]);
    return J;
  }
  // Sample points of a joint: the circle, then along the child bone and back along the parent.
  function jointPts(pose, bone, r, parent, reach) {
    const c = W(pose, bone), pts = [];
    for (let i = 0; i < 16; i++) { const a = (i / 16) * Math.PI * 2; pts.push([c[0] + Math.cos(a) * r * 0.85, c[1] + Math.sin(a) * r * 0.85]); }
    const along = (b, t0, t1) => {
      const i = pose.c.idx[b], w = pose.W[i], L = pose.c.bones[i].len, d = RIG.dirOf(w.r), n = [-d[1], d[0]];
      if (!L) return;
      for (let k = 1; k <= 4; k++) { const t = t0 + ((t1 - t0) * k) / 4, q = [w.x + d[0] * L * t, w.y + d[1] * L * t]; for (const o of [-0.5, 0, 0.5]) pts.push([q[0] + n[0] * r * o, q[1] + n[1] * r * o]); }
    };
    if (reach) along(bone, 0, reach);
    if (parent && reach) along(parent, 1 - reach, 1);
    return pts;
  }
  const JOINTS = jointsOf();
  const NEAR = ['armN', 'sleeveN', 'weaponN', 'handN'];
  // Everything measured on one frame. Returns a list of problems [{ id, msg, v }].
  function frameProblems(pose, skins) {
    const P = [], shapes = RIG.worldShapes(pose, skins), by = {};
    for (const s of shapes) (by[s.slot] || (by[s.slot] = [])).push(s.poly);
    for (const p of pose.W) if (!isFinite(p.x) || !isFinite(p.y) || !isFinite(p.r)) { P.push({ id: 'anim.nan', msg: 'a bone has no position (NaN)' }); return P; }
    // joints stay connected
    for (const [ch, pa] of CHAINS) { const d = dist(W(pose, ch), endOf(pose, pa)); if (d > 0.01) P.push({ id: 'joint.connected', msg: `${ch} ${fmt(d)} away from ${pa}`, v: d }); }
    pose.c.ik.forEach((k, j) => { const s = pose.stretch[j]; if (pose.ikMix[j] > 0.5 && s > 0.3) P.push({ id: 'joint.ik', msg: `${k.name}: foot ${fmt(s)} short of its target`, v: s }); });
    // joints covered at every angle
    for (const [name, bone, r, slots, need, parent, reach] of JOINTS) {
      if (need && !need.every((n) => by[n])) continue;
      const polys = slots.flatMap((n) => by[n] || []);
      if (!polys.length) continue;
      const pts = jointPts(pose, bone, r, parent, reach);
      const miss = pts.filter((q) => !inAny(q, polys)).length;
      if (miss) P.push({ id: 'joint.gap', msg: `${name}: ${miss}/${pts.length} points around the joint uncovered`, v: miss });
    }
    // depth: near limbs over the body, far limbs behind it, a hand on the same layer as its arm
    const ord = pose.order.map((i) => pose.c.slots[i].ink), at = (g) => ord.indexOf(g), last = (g) => ord.lastIndexOf(g);
    if (at('armF') > at('body') || at('handF') > at('body')) P.push({ id: 'order.depth', msg: 'the far arm is drawn over the body' });
    if (at('legN') < at('legF') || at('legN') > at('body')) P.push({ id: 'order.depth', msg: 'legs out of order (far leg, near leg, then the body)' });
    if (at('armN') < at('top') || at('armN') < at('body')) P.push({ id: 'order.depth', msg: 'the near arm is drawn behind the body' });
    const nearIdx = NEAR.map(at).filter((i) => i >= 0), between = ord.slice(Math.min(...nearIdx), Math.max(...NEAR.map(last)) + 1).filter((g) => !NEAR.includes(g));
    if (between.length) P.push({ id: 'order.hand', msg: `the near hand is separated from its arm by ${[...new Set(between)].join(', ')}` });
    // torso pieces must not cover the visible part of a leg
    const torso = ['body.belly', 'body.chest', 'top.belly', 'top.chest'].flatMap((n) => by[n] || []);
    for (const s of ['N', 'F']) {
      let hits = 0;
      for (const [bone, t0, t1, rr] of [[`thigh${s}`, 0.5, 1, RIG_CANON.r.thigh[1]], [`shin${s}`, 0, 1, RIG_CANON.r.shin[0]]]) {
        const i = pose.c.idx[bone], w = pose.W[i], L = pose.c.bones[i].len, d = RIG.dirOf(w.r), nrm = [-d[1], d[0]];
        for (let k = 0; k <= 6; k++) {
          const t = t0 + ((t1 - t0) * k) / 6, c = [w.x + d[0] * L * t, w.y + d[1] * L * t];
          for (const o of [-0.5, 0, 0.5]) if (inAny([c[0] + nrm[0] * rr * o, c[1] + nrm[1] * rr * o], torso)) hits++;
        }
      }
      if (hits) P.push({ id: 'intersect.torso', msg: `the torso covers the ${s === 'N' ? 'near' : 'far'} leg (${hits} points)`, v: hits });
    }
    // nothing goes through the floor
    // (hair is soft: its painter presses it flat on the floor, so it is never drawn below it)
    let low = -Infinity, lowS = '';
    for (const s of shapes) if (s.kind !== 'hair') for (const q of s.poly) if (q[1] > low) { low = q[1]; lowS = s.slot; }
    if (low > 0.6) P.push({ id: 'intersect.ground', msg: `${lowS} ${fmt(low)} below the floor`, v: low });
    return P;
  }

  /* ------------------------------------------------------------- animations */
  // A broken key shows as a pop: one frame moving a bone much further than the frames on both
  // sides of it (a fast strike speeds up and slows down over several frames), or further than a
  // hard cap. frames: per frame, the world position of every bone.
  function popOf(frames, names, fps) {
    const k = 60 / fps, cap = 80 * k;
    let worst = null;
    for (let j = 0; j < names.length; j++) {
      const d = [];
      for (let i = 1; i < frames.length; i++) d.push(dist(frames[i][j], frames[i - 1][j]));
      for (let i = 0; i < d.length; i++) {
        const nb = Math.max(i > 0 ? d[i - 1] : 0, i < d.length - 1 ? d[i + 1] : 0), lim = Math.min(cap, 2.5 * nb + 6 * k);
        if (d[i] > lim && (!worst || d[i] / lim > worst.s)) worst = { s: d[i] / lim, i, bone: names[j], d: d[i] };
      }
    }
    return worst;
  }
  const TRANSLATE_OK = new Set(['root', 'hip', 'ikFootN', 'ikFootF']);
  function timelineChecks(anims) {
    const bad = [];
    for (const n in anims) for (const b in anims[n].bones || {}) {
      if (RIG.compile(RIG_SKELETON).idx[b] == null) bad.push(`${n}: unknown bone ${b}`);
      const tl = anims[n].bones[b];
      for (const k in tl) { if (!['r', 'x', 'y'].includes(k)) bad.push(`${n}/${b}: "${k}" timeline (no scaling allowed)`); if ((k === 'x' || k === 'y') && !TRANSLATE_OK.has(b) && tl[k].some((q) => q[1])) bad.push(`${n}: moves ${b} off its joint`); }
    }
    return R('anim.timelines', 'Animations', 'Animations only rotate bones (translation: hip and foot targets only)', bad.length ? 'fail' : 'pass', bad.join('; ') || `${Object.keys(anims).length} animations, rotations only on the rig`);
  }
  // One animation, frame by frame: problems by kind, the worst frame of each, joint speeds, foot slide.
  function animChecks(name, skins, opt) {
    opt = opt || {};
    const anims = opt.anims || RIG_ANIMS, a = anims[name], fps = opt.fps || FPS, n = Math.max(2, Math.round(a.dur * fps)), ch = new RIG.Character(RIG_SKELETON, skins, anims);
    const found = {}, add = (id, msg, t, v) => { const f = found[id] || (found[id] = { n: 0, msg, t, v: v || 0 }); f.n++; if ((v || 0) > f.v) Object.assign(f, { msg, t, v }); };
    const frames = [], times = [], names = ch.pose.c.bones.map((b) => b.name);
    const feet = { ikFootN: [], ikFootF: [] };
    for (let i = 0; i <= n; i++) {
      const t = Math.min(a.dur, (a.dur * i) / n) - (i === n && a.loop ? 1e-4 : 0);
      ch.at(name, t);
      for (const p of frameProblems(ch.pose, skins)) add(p.id, p.msg, t, p.v);
      frames.push(ch.pose.W.map((w) => [w.x, w.y])); times.push(t);
      for (const f in feet) { const w = ch.pose.W[ch.pose.c.idx[f]]; feet[f].push([t, w.x, w.y]); }
    }
    const pop = popOf(frames, names, fps);
    const out = [];
    const ids = { 'joint.connected': 'Joints stay connected', 'joint.ik': 'Feet reach their targets (no overstretched leg)', 'joint.gap': 'No gap at any joint',
      'order.depth': 'Depth: near limbs in front, far limbs behind', 'order.hand': 'Hands stay on the layer of their arm', 'intersect.torso': 'The torso never covers the legs',
      'intersect.ground': 'Nothing goes through the floor', 'anim.nan': 'Every bone has a position' };
    for (const id in ids) out.push(R(id, groupOf(id), ids[id], found[id] ? 'fail' : 'pass', found[id] ? `${found[id].n} frame(s); worst at ${fmt(found[id].t)}s: ${found[id].msg}` : '', found[id] ? { anim: name, t: found[id].t } : null));
    const fastest = Math.max(...frames.slice(1).map((f, i) => Math.max(...f.map((p, j) => dist(p, frames[i][j]))))) * (fps / 60);
    out.push(R('anim.jump', 'Animations', 'No pops between frames', pop ? 'fail' : 'pass', pop ? `at ${fmt(times[pop.i + 1])}s: ${pop.bone} moved ${fmt(pop.d)} in one frame` : `fastest move ${fmt(fastest)} units per 1/60 s, smooth`, pop ? { anim: name, t: times[pop.i + 1] } : null));
    // loops close
    if (a.loop) {
      ch.at(name, 0); const p0 = ch.pose.W.map((w) => [w.x, w.y]);
      ch.at(name, a.dur - 1e-4); const p1 = ch.pose.W.map((w) => [w.x, w.y]);
      const gap = Math.max(...p0.map((p, j) => dist(p, p1[j])));
      out.push(R('anim.loop', 'Animations', 'The loop closes', gap > 0.5 ? 'fail' : 'pass', `seam ${fmt(gap)} units`));
    }
    // planted feet do not slide (in the run they slide back at one steady speed: the ground moving)
    const slide = [];
    for (const f in feet) {
      const L = feet[f], speeds = [];
      for (let i = 1; i < L.length; i++) {
        const onA = L[i - 1][2] >= -RIG_CANON.footH - 0.2, onB = L[i][2] >= -RIG_CANON.footH - 0.2;
        if (onA && onB) speeds.push((L[i][1] - L[i - 1][1]) / Math.max(1e-6, L[i][0] - L[i - 1][0]));
      }
      if (!speeds.length) continue;
      const mean = speeds.reduce((x, y) => x + y, 0) / speeds.length, dev = Math.max(...speeds.map((v) => Math.abs(v - mean)));
      const planted = name === 'run' ? dev > Math.max(4, Math.abs(mean) * 0.25) : false;
      if (planted) slide.push(`${f}: contact speed varies by ${fmt(dev)} u/s around ${fmt(mean)}`);
    }
    out.push(R('anim.feet', 'Animations', 'Planted feet do not skate', slide.length ? 'fail' : 'pass', slide.join('; ') || (name === 'run' ? 'contacts slide back at a steady speed' : 'feet move only when stepping')));
    // one-shots end where the next animation starts
    if (!a.loop && opt.returnTo && name !== 'death') {
      ch.at(name, a.dur); const e = ch.pose.W.map((w) => [w.x, w.y]);
      ch.at(opt.returnTo, 0); const s = ch.pose.W.map((w) => [w.x, w.y]);
      const gap = Math.max(...e.map((p, j) => dist(p, s[j])));
      out.push(R('anim.return', 'Animations', `Ends in the ${opt.returnTo} pose`, gap > 1 ? 'fail' : 'pass', `${fmt(gap)} units from ${opt.returnTo}`));
    }
    if (name === 'death') {
      ch.at(name, a.dur);
      const r = ch.pose.W[ch.pose.c.idx.torso].r;
      out.push(R('anim.death', 'Animations', 'Death ends lying still on the floor', Math.abs(RIG.wrap(r - 180)) < 20 ? 'pass' : 'fail', `the spine ends at ${fmt(r)}° (180 = flat)`));
    }
    if (name === 'attack') out.push(R('anim.events', 'Animations', 'The attack fires its impact event', (a.events || []).some((e) => e[1] === 'impact') ? 'pass' : 'fail', (a.events || []).map((e) => `${e[1]} at ${e[0]}s`).join(', ')));
    return out.map((r) => Object.assign(r, { anim: name }));
  }
  const groupOf = (id) => (id.startsWith('joint') ? 'Joints' : id.startsWith('order') ? 'Draw order' : id.startsWith('intersect') ? 'Intersections' : 'Animations');

  // The animation state in motion: crossfades between animations, as the game plays them.
  const FLOWS = [['idle', 'run'], ['run', 'idle'], ['idle', 'attack'], ['run', 'attack'], ['idle', 'hit'], ['attack', 'hit'], ['run', 'hit'], ['hit', 'death'], ['idle', 'death']];
  function flowChecks(skins) {
    const bad = [];
    for (const [a, b] of FLOWS) {
      const ch = new RIG.Character(RIG_SKELETON, skins, RIG_ANIMS);
      ch.state.play(a, { loop: RIG_ANIMS[a].loop });
      let t = 0, prev = null;
      const dt = 1 / FPS, at = RIG_ANIMS[a].dur * 0.4;
      for (; t < at; t += dt) ch.tick(dt);
      ch.state.play(b, { mix: 0.12 });
      if (!RIG_ANIMS[b].loop && b !== 'death') ch.state.then('idle', { mix: 0.18, loop: true });
      const frames = [];
      let stop = false;
      for (let k = 0; k < Math.round((RIG_ANIMS[b].dur + 0.4) * FPS) && !stop; k++) {
        ch.tick(dt);
        const probs = frameProblems(ch.pose, skins).filter((p) => !['joint.ik'].includes(p.id) || p.v > 1);
        if (probs.length) { bad.push(`${a}→${b} at +${fmt(k * dt)}s: ${probs[0].msg}`); stop = true; }
        frames.push(ch.pose.W.map((w) => [w.x, w.y]));
      }
      const pop = !stop && popOf(frames, ch.pose.c.bones.map((x) => x.name), FPS);
      if (pop) bad.push(`${a}→${b} at +${fmt((pop.i + 1) * dt)}s: ${pop.bone} popped ${fmt(pop.d)} in one frame`);
    }
    return R('anim.flow', 'Animations', 'Crossfades between animations stay clean', bad.length ? 'fail' : 'pass', bad.join('; ') || FLOWS.map(([a, b]) => `${a}→${b}`).join(', '));
  }

  /* ------------------------------------------------------------- self-test */
  // The checks are only worth something if they catch real faults: break the rig on purpose, one
  // fault at a time (including the old renderer's bugs), and make sure the right check fails.
  function selfTest() {
    const base = [RIG_BODY, RIG_FACES.calm, RIG_FX], G = RIG_GUARD;
    const one = (pose) => ({ t: { dur: 0.5, bones: rigAnim(0.5, [[0, pose], [0.5, pose]]).bones, slots: {}, order: null } });
    const withOrder = (pose, order) => { const a = one(pose); a.t.order = [[0, order]]; return a; };
    const failsOn = (id, anims, skins) => animChecks('t', skins || base, { anims, fps: 30 }).some((r) => r.id === id && r.status === 'fail');
    const tests = [
      ['Hand drawn on another layer than its arm (old bug)', 'order.hand', () => failsOn('order.hand', withOrder(G, { handN: ['before', 'body'] }))],
      ['Near arm drawn behind the body (old bug)', 'order.depth', () => failsOn('order.depth', withOrder(G, { armN: ['before', 'body'], sleeveN: ['before', 'body'], weaponN: ['before', 'body'], handN: ['before', 'body'] }))],
      ['Far arm drawn over the body', 'order.depth', () => failsOn('order.depth', withOrder(G, { armF: ['after', 'top'] }))],
      ['Forearm moved off its elbow', 'anim.timelines', () => timelineChecks({ t: { dur: 1, bones: { foreArmN: { x: [[0, 0], [1, 5]] } } } }).status === 'fail'],
      ['Forearm piece that stops short of the elbow (gap)', 'joint.gap', () => failsOn('joint.gap', one(G), [...base, { name: 'bad', att: { 'armN.fore': { skin: { kind: 'tube', x0: 10, x1: 21, r0: 4.3, r1: 3.9, flat0: true, fill: '$skin' } } } }])],
      ['Knee pulled up into the torso', 'intersect.torso', () => failsOn('intersect.torso', one(rigP(G, { ikFootN: { x: 14, y: -58 } })))],
      ['Foot pushed through the floor', 'intersect.ground', () => failsOn('intersect.ground', one(rigP(G, { ikFootN: { x: -7.5, y: 6 } })))],
      ['Foot target out of reach (leg pulled apart)', 'joint.ik', () => failsOn('joint.ik', one(rigP(G, { ikFootF: { x: 70, y: 0 } })))],
      ['A key that spins the arm 300° in one frame', 'anim.jump', () => failsOn('anim.jump', { t: { dur: 1, bones: { upperArmN: { r: [[0, -53], [0.5, -53], [0.52, 247], [1, 247]] } }, slots: {}, order: null } })],
      ['A loop that does not close', 'anim.loop', () => animChecks('t', base, { anims: { t: { dur: 1, loop: true, bones: { chest: { r: [[0, 0], [1, 20]] } }, slots: {}, order: null } }, fps: 30 }).some((r) => r.id === 'anim.loop' && r.status === 'fail')],
      ['A cosmetic that brings its own bones', 'skins.skeleton', () => staticChecks([...base, { name: 'bad', bones: [{ name: 'x' }], att: {} }]).some((r) => r.id === 'skins.skeleton' && r.status === 'fail')],
      ['A shoe taller than the foot box', 'skins.footbox', () => staticChecks([...base, { name: 'bad', att: { footN: { foot: { kind: 'shape', pts: [[-8, -6], [12, -6], [12, 8], [-8, 8]] } } } }]).some((r) => r.id === 'skins.footbox' && r.status === 'fail')],
      ['An expression the face does not have', 'att.missing', () => missingChecks([RIG_BODY], RIG_ANIMS).some((r) => r.status === 'fail')],
    ];
    if (typeof RIG_HAIR_SELFTEST === 'function') tests.push(...RIG_HAIR_SELFTEST());
    return tests.map(([name, id, f]) => { let ok = false, err = ''; try { ok = !!f(); } catch (e) { err = e.message; } return { name, id, caught: ok, err }; });
  }

  /* ------------------------------------------------------------- everything */
  // Every combination of the given cosmetics, every animation. sets: { hair: [skin], outfit: [skin|null], weapon: [skin|null], face: [skin] }.
  function combos(sets) {
    const out = [];
    for (const h of sets.hair || [null]) for (const o of sets.outfit || [null]) for (const w of sets.weapon || [null]) for (const f of sets.face || [null]) {
      out.push({ key: [h, o, w, f].map((s) => (s ? s.id || s.name : 'none')).join(' · '), hair: h, outfit: o, weapon: w, face: f,
        skins: [RIG_BODY, o, f, w, h, RIG_FX].filter(Boolean) });
    }
    return out;
  }
  function all(sets, opt) {
    opt = opt || {};
    const list = combos(sets), allSkins = [RIG_BODY, RIG_FX, ...Object.values(sets).flat().filter(Boolean)];
    const results = [...staticChecks(allSkins), timelineChecks(RIG_ANIMS)];
    const matrix = [];
    for (const cb of list) {
      const row = { key: cb.key, cells: {}, fails: 0 };
      results.push(...missingChecks(cb.skins, RIG_ANIMS, cb.key).map((r) => Object.assign(r, { combo: cb.key })));
      if (typeof RIG_HAIR_CHECK === 'function' && cb.hair) results.push(...RIG_HAIR_CHECK(cb.hair, cb.skins).map((r) => Object.assign(r, { combo: cb.key })));
      for (const name of Object.keys(RIG_ANIMS)) {
        const rs = animChecks(name, cb.skins, { fps: opt.fps || 30, returnTo: 'idle' }).map((r) => Object.assign(r, { combo: cb.key }));
        const f = rs.filter((r) => r.status === 'fail');
        row.cells[name] = { fails: f.length, first: f[0] || null };
        row.fails += f.length;
        results.push(...rs);
      }
      matrix.push(row);
    }
    results.push(flowChecks(list[list.length - 1].skins));
    return { results, matrix, anims: Object.keys(RIG_ANIMS) };
  }

  return { staticChecks, missingChecks, timelineChecks, animChecks, flowChecks, frameProblems, combos, all, selfTest, inside, inAny, popOf };
})();
