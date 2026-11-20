'use strict';
/* ==========================================================================
   TRI-REALM — animations of the canonical rig (v3)
   Every animation works on every character: it only moves the canonical bones.
   Authoring is pose to pose (like the game's POSES): key poses on a timeline,
   converted to one timeline per bone (Spine-style). Values are offsets from
   the setup pose (A-pose): rotation in degrees (+ turns clockwise on screen:
   for an arm hanging down, - swings it forward; for the spine, + leans forward),
   translation in units. Legs are never posed directly: animations move the
   IK foot targets (ikFootN / ikFootF: ankle position and foot angle) and the
   hip, and the IK bends the knees, so feet stay planted.
   Loaded after js/rig-canon.js.
   ========================================================================== */

// A pose: { bone: rotation | [x, y] | { r, x, y } }. Merge poses with rigP(base, over).
const rigP = (...ps) => Object.assign({}, ...ps);
// How high the ankle must be (offset from the setup, up is negative) for a foot turned by r degrees
// to rest on the floor: the lowest corner of the canonical foot box touches it.
function rigFootRest(r) {
  let low = -Infinity;
  for (const p of RIG_CANON.footBox) low = Math.max(low, RIG.rot(p, r || 0)[1]);
  return RIG_CANON.footH - low;
}
// A foot target that never goes through the floor: lifted if its angle needs it.
const rigFoot = (x, y, r) => ({ x, y: Math.min(y || 0, rigFootRest(r)), r: r || 0 });
// Between two keys a turning foot can need more lift than either key gives: rebuild the height of
// each foot target frame by frame (60 fps) wherever the constraint bites.
function rigGroundFeet(anim) {
  for (const f of ['ikFootN', 'ikFootF']) {
    const tl = anim.bones[f];
    if (!tl) continue;
    const n = Math.ceil(anim.dur * 60), keys = [];
    let lifted = false;
    for (let i = 0; i <= n; i++) {
      const t = Math.min(anim.dur, i / 60), y = tl.y ? RIG.sampleKeys(tl.y, t) : 0, need = rigFootRest(tl.r ? RIG.sampleKeys(tl.r, t) : 0);
      if (y > need + 1e-3) lifted = true;
      keys.push([t, Math.min(y, need), 'lin']);
    }
    if (lifted) tl.y = keys;
  }
  return anim;
}
const RIG_POSE_BONES = ['hip', 'torso', 'chest', 'neck', 'head', 'upperArmN', 'foreArmN', 'handN', 'gripN', 'upperArmF', 'foreArmF', 'handF', 'gripF', 'ikFootN', 'ikFootF'];
// Pose-to-pose: keys [[time, pose, curve into it, extra]] → { dur, bones: { bone: { r, x, y: keys } } }.
// extra: { face: expression, order: draw-order key, fx: attachment for the fx slot }.
function rigAnim(dur, keys, o) {
  const bones = {}, val = (v) => (typeof v === 'number' ? { r: v } : Array.isArray(v) ? { x: v[0], y: v[1] } : v || {});
  for (const b of RIG_POSE_BONES) {
    const tl = { r: [], x: [], y: [] };
    for (const [t, pose, e] of keys) { const v = val(pose[b]); tl.r.push([t, v.r || 0, e]); tl.x.push([t, v.x || 0, e]); tl.y.push([t, v.y || 0, e]); }
    bones[b] = {};
    for (const k of ['r', 'x', 'y']) if (tl[k].some((q) => q[1])) bones[b][k] = tl[k];
  }
  const slots = {}, order = [];
  for (const [t, , , x] of keys) {
    if (!x) continue;
    if (x.face) (slots.face || (slots.face = [])).push([t, x.face]);
    if (x.fx !== undefined) (slots.fx || (slots.fx = [])).push([t, x.fx || '']);   // '' = nothing
    if (x.order !== undefined) order.push([t, x.order]);
  }
  // o.slots: extra attachment keys on their own times ({ fx: [[t, 'slash'], [t2, '']] })
  const ex = Object.assign({}, o || {});
  if (ex.slots) { for (const k in ex.slots) slots[k] = (slots[k] || []).concat(ex.slots[k]).sort((a, b) => a[0] - b[0]); delete ex.slots; }
  return Object.assign({ dur, bones, slots, order: order.length ? order : null }, ex);
}

// The fighting stance every combat animation starts from and returns to: feet apart (far foot
// forward), knees soft, a slight lean, the near hand holding the weapon up in front, the far fist up.
const RIG_GUARD = {
  hip: { x: 1, y: 4, r: 4 }, torso: 4, chest: 3, neck: -4, head: -3,
  upperArmN: -53, foreArmN: -70, handN: -6, gripN: 56,
  upperArmF: -24, foreArmF: -104, handF: -10,
  ikFootN: { x: -7.5 }, ikFootF: { x: 10.5 },
};

// Draw-order key: the near arm (with its sleeve, weapon and fist) passes behind the head, for a
// blade cocked behind the head. null puts the canonical order back.
const RIG_ARM_BEHIND_HEAD = { armN: ['before', 'head'], sleeveN: ['before', 'head'], weaponN: ['before', 'head'], handN: ['before', 'head'] };

const RIG_ANIMS = (() => {
  const G = RIG_GUARD, A = {};

  // ---- idle: breathing in the stance. The chest rises, the head and arms follow a beat later.
  const breathe = rigP(G, { hip: { x: 1, y: 4.9, r: 4 }, chest: 4.6, neck: -5.2, head: -3.6, upperArmN: -51.5, foreArmN: -72, upperArmF: -22.5, foreArmF: -106, gripN: 54 });
  A.idle = rigAnim(2.2, [[0, G], [1.1, breathe, 'sine'], [2.2, G, 'sine']], { loop: true });

  // ---- run: in place, 2 steps per cycle. Each foot: contact ahead of the hip, slides back under
  // it at a constant speed (planted on the moving ground), pushes off behind, folds up, swings
  // through high and reaches forward. The body is lowest just after each contact, highest in the
  // flight, leans into the run; arms swing against the legs, elbows bent.
  const T = 0.66, hipX = 4;
  const foot = (p) => {   // the foot's path through one cycle (p 0..1, 0 = contact), relative to its hip joint
    const K = [[0, 14, 0, -8], [0.125, 1, 0, 0], [0.25, -12, -1.5, 26], [0.375, -15, -11, 46], [0.5, -9, -21, 52], [0.625, 3, -23, 16], [0.75, 14, -14, -8], [0.875, 17, -5, -14], [1, 14, 0, -8]];
    let i = 0;
    while (i < K.length - 2 && p >= K[i + 1][0]) i++;
    const [p0, x0, y0, r0] = K[i], [p1, x1, y1, r1] = K[i + 1], k = (p - p0) / (p1 - p0);
    return rigFoot(x0 + (x1 - x0) * k + hipX, y0 + (y1 - y0) * k, r0 + (r1 - r0) * k);
  };
  const runKeys = [];
  for (let i = 0; i <= 8; i++) {
    const p = i / 8, c = (ph) => Math.cos(2 * Math.PI * (p - ph));
    const q = i % 4, bob = q === 1 ? 6.4 : q === 3 ? 2.2 : 4.6;   // 1: just after a contact (lowest), 3: flight (highest)
    runKeys.push([p * T, {
      hip: { x: hipX, y: bob, r: 3 + c(0.25) * 1.5 },
      torso: 7, chest: 4 + c(0.375) * 2.5, neck: -5, head: -4 - c(0.375) * 1.2,
      // near arm forward when the near leg is behind (p 0.375), far arm the other way; the blade
      // is carried low, pointing back along the forearm, so it never flails over the head
      upperArmN: -22 - c(0.375) * 40, foreArmN: -78 - c(0.375) * 16, handN: -4, gripN: 168 + c(0.375) * 8,
      upperArmF: -12 - c(0.875) * 44, foreArmF: -88 - c(0.875) * 14, handF: -10,
      ikFootN: foot(p), ikFootF: foot((p + 0.5) % 1),
    }, 'lin']);
  }
  A.run = { dur: T, loop: true, bones: rigAnim(T, runKeys).bones, slots: {}, order: null, events: [[0, 'step', 'N'], [T / 2, 'step', 'F']] };

  // ---- attack: a diagonal cut. Slow anticipation (weight back, the blade raised behind the head),
  // a very fast strike with a lunge (the front foot steps in), a held follow-through, then back.
  const wind = rigP(G, {
    hip: { x: -3, y: 5, r: 0 }, torso: -4, chest: -8, neck: 3, head: 0,
    upperArmN: -210, foreArmN: -55, handN: 0, gripN: 25,
    upperArmF: -48, foreArmF: -40, handF: -10,
  });
  const strike = rigP(G, {
    hip: { x: 9, y: 9, r: 8 }, torso: 12, chest: 10, neck: -10, head: -6,
    upperArmN: -97, foreArmN: -10, handN: 0, gripN: 105,
    upperArmF: 10, foreArmF: -40, handF: 0,
    ikFootN: rigFoot(-6.5, 0, 20), ikFootF: { x: 18 },
  });
  const follow = rigP(strike, { hip: { x: 10, y: 10, r: 9 }, torso: 13, upperArmN: -84, foreArmN: -6, gripN: 110, upperArmF: 14 });
  // timing: 0.16 s of anticipation, a short hang, 0.065 s of strike, a held follow-through
  A.attack = rigAnim(0.64, [
    [0, G, 'sine', { face: 'angry' }],
    [0.06, rigP(G, { upperArmN: -110, foreArmN: -60, gripN: 40 }), 'sine', { order: RIG_ARM_BEHIND_HEAD }],
    [0.16, wind, 'out'],
    [0.19, rigP(wind, { upperArmN: -196, chest: -6 }), 'sine', { order: null }],
    [0.255, strike, 'in2'],
    [0.35, follow, 'out'],
    [0.64, G, 'sine', { face: 'neutral' }],
  ], { events: [[0.255, 'impact']], slots: { fx: [[0.215, 'slash'], [0.33, '']] } });

  // ---- hit: the blow snaps the head back and throws the body back over planted feet, then it recovers.
  const recoil = rigP(G, {
    hip: { x: -6, y: 3, r: -6 }, torso: -10, chest: -10, neck: -8, head: -12,
    upperArmN: 4, foreArmN: -40, handN: 0, gripN: 44,
    upperArmF: -40, foreArmF: -36, handF: 0,
  });
  A.hit = rigAnim(0.44, [
    [0, G, 'sine', { face: 'hurt' }],
    [0.07, recoil, 'out2'],
    [0.16, rigP(recoil, { hip: { x: -8, y: 4, r: -7 }, torso: -12, chest: -12, head: -14, upperArmN: 12 }), 'out'],
    [0.44, G, 'sine', { face: 'neutral' }],
  ]);

  // ---- death: the blow, the knees give, the body tips back and falls flat, a small bounce, still.
  const slump = rigP(G, {
    hip: { x: -4, y: 18, r: 10 }, torso: 16, chest: 12, neck: 10, head: 12,
    upperArmN: -24, foreArmN: -24, gripN: 30, upperArmF: -20, foreArmF: -20,
  });
  const tip = rigP(G, {
    hip: { x: -10, y: 40, r: -42 }, torso: -6, chest: -6, neck: 4, head: -8,
    upperArmN: -40, foreArmN: -30, gripN: 70, upperArmF: -60, foreArmF: -30,
    ikFootN: rigFoot(10, -2, -20), ikFootF: rigFoot(22, -3, -24),
  });
  // lying flat: the near side is down, so the body rests on its near shoulder and hip; it lies
  // high enough for the thickest clothes (RIG_CANON.clothMax) to stay above the floor
  const down = {
    hip: { x: -6, y: 60.2, r: -90 }, torso: 0, chest: 6, neck: 9, head: 8,
    upperArmN: -30, foreArmN: -10, handN: 0, gripN: 116, upperArmF: 8, foreArmF: -12,
    ikFootN: rigFoot(60, -4.2, -78), ikFootF: rigFoot(52, -6.2, -70),
  };
  A.death = rigAnim(1.4, [
    [0, G, 'sine', { face: 'hurt' }],
    [0.07, recoil, 'out2'],
    [0.32, slump, 'sine'],
    [0.58, tip, 'in2'],
    [0.8, down, 'in2', { face: 'dead' }],
    [0.9, rigP(down, { hip: { x: -6, y: 57.2, r: -87 }, head: 3, neck: 6 }), 'out2'],
    [1.04, down, 'in2'],
    [1.4, down, 'lin'],
  ], { hold: true });

  for (const n in A) rigGroundFeet(A[n]);
  return A;
})();
