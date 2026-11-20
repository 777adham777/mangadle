'use strict';
/* ==========================================================================
   TRI-REALM — the canonical character (rig v3)
   The single reference every character and every cosmetic is built on.
   Cosmetics are skins: they fill slots with attachments drawn in the frame of
   a bone. They never add, move or resize bones (the checks enforce it).

   View: 3/4 front, facing right (towards foes). The character's RIGHT side is
   nearest the viewer and sits on the LEFT of the picture: names ending in N
   (near). Its left side is on the right, partly behind the body: F (far).
   Units: 1 unit ≈ 1 px of the 156 × 218 avatar box. Ground at y = 0, y down.
   Loaded after js/rig.js.
   ========================================================================== */

/* ---------------------------------------------------------------- proportions */
const RIG_CANON = {
  version: 1,
  // the skull: every head asset (face, hair, hat) is drawn around its centre, radius 19
  headR: 19,
  // bone lengths: pelvis → waist → neck base → neck top → skull centre; arms and legs
  len: { torso: 24, chest: 28, neck: 6, head: 17, upperArm: 23, foreArm: 21, hand: 4.2, thigh: 36, shin: 35, foot: 12 },
  footH: 4.6,                                   // ankle above the sole: the sole is the ground
  // every foot and shoe fits this box (foot frame: x towards the toe, y down; the ankle at 0,0),
  // so animations know how high a turned foot must be to stay on the floor
  footBox: [[-9.2, -6], [-9.2, 0], [-9, 4.6], [12, 4.6], [12.4, 0.6]],
  hipJoint: { y: 2, near: -6.5, far: 5.5 },     // on the pelvis (its art frame: x right, y down)
  shoulder: { y: -21, near: -12, far: 11.5 },   // on the chest, 7 below the neck base
  // limb radii at both ends: elbow and knee radii match on both sides of the joint (no seam)
  r: { upperArm: [4.6, 4.3], foreArm: [4.3, 3.9], thigh: [6.6, 5.6], shin: [5.6, 4.6], neck: 4.2 },
  frontLine: 4,                                 // the centre front of the torso (zip, buttons) in 3/4 view
  clothMax: 2.8,                                // the thickest a garment may sit over the body (sleeves, trousers, tops)
  lineW: 1.2,                                   // every outline, every asset (the sticker rim adds the outer contour)
  light: 'upper left',                          // one cel shadow, on the lower right of every shape
  skin: '#eef1f6',
};
// Standing height: sole → ankle → knee → hip joint → pelvis → waist → neck base → neck top → skull top.
RIG_CANON.pelvisY = -(RIG_CANON.footH + RIG_CANON.len.shin + RIG_CANON.len.thigh + RIG_CANON.hipJoint.y);
RIG_CANON.height = -RIG_CANON.pelvisY + RIG_CANON.len.torso + RIG_CANON.len.chest + RIG_CANON.len.neck + RIG_CANON.len.head + RIG_CANON.headR;

/* ---------------------------------------------------------------- skeleton */
// Setup pose: an A-pose (arms a little away from the body, legs straight), the reference for every
// asset. a: angle in the world (0 right, 90 down, -90 up). at: position on the parent, in its art
// frame when the parent is upright (x right, y down), else along the parent bone.
const RIG_SKELETON = (() => {
  const C = RIG_CANON, L = C.len, H = C.hipJoint, S = C.shoulder;
  return {
    name: 'canon',
    bones: [
      { name: 'root' },
      { name: 'hip', parent: 'root', at: [0, C.pelvisY], a: -90, upright: true },
      { name: 'torso', parent: 'hip', a: -90, len: L.torso, upright: true },
      { name: 'chest', parent: 'torso', at: [0, -L.torso], a: -90, len: L.chest, upright: true },
      { name: 'neck', parent: 'chest', at: [0, -L.chest], a: -90, len: L.neck, upright: true },
      { name: 'head', parent: 'neck', at: [0, -L.neck], a: -90, len: L.head, upright: true },
      { name: 'skull', parent: 'head', at: [0, -L.head], a: -90, upright: true },
      // the hair behind the head swings on a spring (the bone points down, so its tip trails behind
      // moves); the hair on the head stays on the skull, so the hairline never slides on the face
      { name: 'hairBack', parent: 'skull', at: [0, 0], a: 90, len: 22, upright: true, spring: { k: 90, damp: 9, max: 7 } },
      // arms hang from the chest; the grip is where a held weapon's handle sits (centre of the fist)
      { name: 'upperArmF', parent: 'chest', at: [S.far, S.y], a: 80, len: L.upperArm },
      { name: 'foreArmF', parent: 'upperArmF', at: [L.upperArm, 0], a: 80, len: L.foreArm },
      { name: 'handF', parent: 'foreArmF', at: [L.foreArm, 0], a: 80, len: L.hand },
      { name: 'gripF', parent: 'handF', at: [L.hand, 0], a: -10 },
      { name: 'upperArmN', parent: 'chest', at: [S.near, S.y], a: 102, len: L.upperArm },
      { name: 'foreArmN', parent: 'upperArmN', at: [L.upperArm, 0], a: 102, len: L.foreArm },
      { name: 'handN', parent: 'foreArmN', at: [L.foreArm, 0], a: 102, len: L.hand },
      { name: 'gripN', parent: 'handN', at: [L.hand, 0], a: 12 },
      // legs hang from the pelvis; feet point forward
      { name: 'thighF', parent: 'hip', at: [H.far, H.y], a: 90, len: L.thigh },
      { name: 'shinF', parent: 'thighF', at: [L.thigh, 0], a: 90, len: L.shin },
      { name: 'footF', parent: 'shinF', at: [L.shin, 0], a: 0, len: L.foot },
      { name: 'thighN', parent: 'hip', at: [H.near, H.y], a: 90, len: L.thigh },
      { name: 'shinN', parent: 'thighN', at: [L.thigh, 0], a: 90, len: L.shin },
      { name: 'footN', parent: 'shinN', at: [L.shin, 0], a: 0, len: L.foot },
      // IK targets: where each ankle goes (and the foot's angle); animations move these, not the legs
      { name: 'ikFootF', parent: 'root', at: [H.far, -C.footH], a: 0 },
      { name: 'ikFootN', parent: 'root', at: [H.near, -C.footH], a: 0 },
    ],
    // Draw order, back to front. Slots with the same ink share one outline pass (one silhouette).
    // tint 'far': drawn a little darker (the far side of the body).
    slots: [
      { name: 'hairBack', bone: 'hairBack', att: 'hair', ink: 'hairBack' },
      { name: 'back', bone: 'chest', att: 'back', ink: 'back' },
      // the far arm, behind the body
      { name: 'armF.upper', bone: 'upperArmF', att: 'skin', ink: 'armF', tint: 'far' },
      { name: 'armF.fore', bone: 'foreArmF', att: 'skin', ink: 'armF', tint: 'far' },
      { name: 'sleeveF.upper', bone: 'upperArmF', att: 'sleeve', ink: 'sleeveF', tint: 'far' },
      { name: 'sleeveF.fore', bone: 'foreArmF', att: 'sleeve', ink: 'sleeveF', tint: 'far' },
      { name: 'weaponF', bone: 'gripF', att: 'weapon', ink: 'weaponF' },
      { name: 'handF', bone: 'handF', att: 'fist', ink: 'handF', tint: 'far' },
      // the far leg
      { name: 'legF.thigh', bone: 'thighF', att: 'skin', ink: 'legF', tint: 'far' },
      { name: 'legF.shin', bone: 'shinF', att: 'skin', ink: 'legF', tint: 'far' },
      { name: 'pantF.thigh', bone: 'thighF', att: 'pant', ink: 'pantF', tint: 'far' },
      { name: 'pantF.shin', bone: 'shinF', att: 'pant', ink: 'pantF', tint: 'far' },
      { name: 'footF', bone: 'footF', att: 'foot', ink: 'footF', tint: 'far' },
      // the near leg, over the far one
      { name: 'legN.thigh', bone: 'thighN', att: 'skin', ink: 'legN' },
      { name: 'legN.shin', bone: 'shinN', att: 'skin', ink: 'legN' },
      { name: 'pantN.thigh', bone: 'thighN', att: 'pant', ink: 'pantN' },
      { name: 'pantN.shin', bone: 'shinN', att: 'pant', ink: 'pantN' },
      { name: 'footN', bone: 'footN', att: 'foot', ink: 'footN' },
      // the body: pelvis, belly, chest and neck read as one shape; it covers the tops of both legs
      { name: 'body.pelvis', bone: 'hip', att: 'skin', ink: 'body' },
      { name: 'body.belly', bone: 'torso', att: 'skin', ink: 'body' },
      { name: 'body.chest', bone: 'chest', att: 'skin', ink: 'body' },
      { name: 'body.neck', bone: 'neck', att: 'skin', ink: 'body' },
      // clothes on the body: trousers, then the top over them, then the belt
      { name: 'pants', bone: 'hip', att: 'pants', ink: 'pants' },
      { name: 'top.belly', bone: 'torso', att: 'top', ink: 'top' },
      { name: 'top.chest', bone: 'chest', att: 'top', ink: 'top' },
      { name: 'belt', bone: 'hip', att: 'belt', ink: 'belt' },
      { name: 'collar', bone: 'chest', att: 'collar', ink: 'collar' },
      // the head: skull, the hair's shadow on the forehead, the face, then the hair on the head
      // (scalp, side locks, bangs, strands: one silhouette, one outline), then a hat
      { name: 'head', bone: 'skull', att: 'head', ink: 'head' },
      { name: 'hairShade', bone: 'skull', att: 'hair', ink: 'hairShade' },
      { name: 'face', bone: 'skull', att: 'neutral', ink: 'face' },
      { name: 'hair.scalp', bone: 'skull', att: 'hair', ink: 'hair' },
      { name: 'hair.sides', bone: 'skull', att: 'hair', ink: 'hair' },
      { name: 'hair.bangs', bone: 'skull', att: 'hair', ink: 'hair' },
      { name: 'hair.strands', bone: 'skull', att: 'hair', ink: 'hair' },
      { name: 'hat', bone: 'skull', att: 'hat', ink: 'hat' },
      // the near arm, in front of the body and the head; a held weapon sits under the fist
      { name: 'armN.upper', bone: 'upperArmN', att: 'skin', ink: 'armN' },
      { name: 'armN.fore', bone: 'foreArmN', att: 'skin', ink: 'armN' },
      { name: 'sleeveN.upper', bone: 'upperArmN', att: 'sleeve', ink: 'sleeveN' },
      { name: 'sleeveN.fore', bone: 'foreArmN', att: 'sleeve', ink: 'sleeveN' },
      { name: 'weaponN', bone: 'gripN', att: 'weapon', ink: 'weaponN' },
      { name: 'handN', bone: 'handN', att: 'fist', ink: 'handN' },
      // motion effects (a slash trail), keyed by the animations
      { name: 'fx', bone: 'chest', att: null, ink: 'fx' },
    ],
    // Legs reach their targets (knees bend forward), feet copy the target's angle.
    ik: [
      { name: 'legF', bones: ['thighF', 'shinF'], target: 'ikFootF', foot: 'footF', bend: -1 },
      { name: 'legN', bones: ['thighN', 'shinN'], target: 'ikFootN', foot: 'footN', bend: -1 },
    ],
    // Named attachment points (bone + position in its art frame), for accessories and effects.
    points: {
      skull: ['skull', [0, 0]], sternum: ['chest', [RIG_CANON.frontLine, -14]], nape: ['chest', [-5, -27]],
      backMount: ['chest', [-4, -14]], belt: ['hip', [RIG_CANON.frontLine, -11]], sheath: ['hip', [-12, -6]],
      gripN: ['gripN', [0, 0]], gripF: ['gripF', [0, 0]],
    },
  };
})();

/* ---------------------------------------------------------------- the body */
// The torso's half-width down its length (y from the pelvis centre, up is negative). The pelvis,
// belly and chest pieces, and every garment on them, take their sides from this one profile, so
// where pieces overlap their edges coincide: no bump at the waist, whatever the clothes.
const RIG_TORSO = [[8, 13.4], [4, 14.2], [-4, 13.4], [-11, 12.6], [-16, 12.2], [-22, 12.6], [-27, 13], [-32, 13.4], [-41, 13.9], [-47.6, 13.3]];
function rigTorsoW(y) {
  const T = RIG_TORSO;
  if (y >= T[0][0]) return T[0][1];
  for (let i = 1; i < T.length; i++) if (y >= T[i][0]) { const [y0, w0] = T[i - 1], [y1, w1] = T[i]; return w0 + ((w1 - w0) * (y - y0)) / (y1 - y0); }
  return T[T.length - 1][1];
}
// A torso piece from y0 (bottom) up to y1, in the frame of the bone it hangs on (dy: where that
// bone's origin sits on the profile), widened by ex. bottom: points across the lower edge
// (left to right, already in the bone's frame); top: points across the upper edge (right to left).
// An edge with no points of its own is a straight cut with sharp corners (it lies inside the
// neighbouring piece, so a rounded corner would only bulge out of the silhouette); hem: the lower
// corners are sharp too (a shirt's hem).
function rigTorsoPiece(dy, y0, y1, ex, bottom, top, hem) {
  const ys = [y0];
  for (const [y] of RIG_TORSO) if (y < y0 - 1 && y > y1 + 1) ys.push(y);
  ys.push(y1);
  const n = ys.length - 1, sharp = (i) => (i === 0 && (hem || !bottom)) || (i === n && !top);
  const side = (s) => ys.map((y, i) => (sharp(i) ? [s * (rigTorsoW(y) + ex), y - dy, 1] : [s * (rigTorsoW(y) + ex), y - dy]));
  return [...(bottom || []), ...side(1), ...(top || []), ...side(-1).reverse()];
}
// The base skin: the bare body every cosmetic dresses. Shapes are in their bone's frame:
// limbs along the bone (x from the joint), body parts upright (x right, y down from the bone's origin).
const RIG_SHAPES = (() => {
  const C = RIG_CANON, R = C.r, L = C.len, cy = -C.len.torso;   // the chest's origin on the profile
  return {
    upperArm: { kind: 'capsule', x1: L.upperArm, r0: R.upperArm[0], r1: R.upperArm[1] },
    foreArm: { kind: 'capsule', x1: L.foreArm, r0: R.foreArm[0], r1: R.foreArm[1] },
    thigh: { kind: 'capsule', x1: L.thigh, r0: R.thigh[0], r1: R.thigh[1] },
    shin: { kind: 'capsule', x1: L.shin, r0: R.shin[0], r1: R.shin[1] },
    // a mitten fist around the grip, knuckles forward; it covers the wrist
    fist: { kind: 'shape', pts: [[-2.3, -1.2], [0.4, -5.4], [4.8, -6.7], [9.3, -5.1], [11.7, -1], [11, 3.6], [7.6, 6.3], [3.2, 6.4], [-0.6, 4.4], [-2.5, 1.6]],
      lines: [{ d: 'M5.6,-3.4 Q8.6,-2.2 9,1.2', w: 0.9, op: 0.55 }] },
    // the bare foot: the sole is the ground (y = footH below the ankle)
    foot: { kind: 'shape', pts: [[-6.6, -4.4], [-1, -5.4], [5, -4.8], [8.8, -2.2], [10.6, 1.2], [9.9, C.footH, 1], [-7, C.footH, 1], [-7.9, 0.2]] },
    // pelvis: covers both thigh joints whatever the angle (circles of radius 6.6 around the hip
    // joints at (-6.5, 2) and (5.5, 2)); its lower edge is the crotch line
    pelvis: { kind: 'shape', pts: rigTorsoPiece(0, 4, -11.2, 0, [[-12.4, 9.4], [-6.5, 11.4], [0, 10.4], [5.5, 11.2], [11.4, 9.4]]) },
    // belly: from the pelvis to under the chest, overlapping both, slimmer at the waist
    belly: { kind: 'shape', pts: rigTorsoPiece(0, -2, -27, 0, [[-8, 1], [8, 1]]) },
    // chest: ribcage, armpits, then the slope of the shoulders up to the neck
    chest: { kind: 'shape', pts: rigTorsoPiece(cy, cy + 2, cy - 23.6, 0, null, [[9.8, -27.7], [5, -29.1], [-5, -29.1], [-9.8, -27.7]]) },
    neck: { kind: 'shape', pts: [[-4.2, 4], [-4, -10, 1], [4, -10, 1], [4.2, 4]] },
    head: { kind: 'circle', r: C.headR, cel: 0.8 },
  };
})();
const RIG_BODY = (() => {
  const S = RIG_SHAPES, sk = (shape, extra) => Object.assign({}, shape, { fill: '$skin' }, extra || {});
  const att = {
    'armF.upper': { skin: sk(S.upperArm) }, 'armF.fore': { skin: sk(S.foreArm) }, handF: { fist: sk(S.fist) },
    'armN.upper': { skin: sk(S.upperArm) }, 'armN.fore': { skin: sk(S.foreArm) }, handN: { fist: sk(S.fist) },
    'legF.thigh': { skin: sk(S.thigh) }, 'legF.shin': { skin: sk(S.shin) }, footF: { foot: sk(S.foot) },
    'legN.thigh': { skin: sk(S.thigh) }, 'legN.shin': { skin: sk(S.shin) }, footN: { foot: sk(S.foot) },
    'body.pelvis': { skin: sk(S.pelvis) },
    // bare torso: a hint of the chest and the centre line, in the skin's shadow tone
    'body.belly': { skin: sk(S.belly, { lines: [{ d: `M${RIG_CANON.frontLine},-6 L${RIG_CANON.frontLine},-16`, c: '$skinLine', w: 1, op: 0.7 }] }) },
    'body.chest': { skin: sk(S.chest, { lines: [{ d: 'M-6,-14.5 Q0,-12.6 4,-13.6 Q8,-12.6 11.5,-14.6', c: '$skinLine', w: 1.1, op: 0.8 }] }) },
    'body.neck': { skin: sk(S.neck, { shade: false }) },
    head: { head: sk(S.head) },
  };
  return { name: 'body', pal: { skin: RIG_CANON.skin, skinLine: '#b9bfcc' }, att };
})();

/* ---------------------------------------------------------------- faces */
// A face is a skin for the 'face' slot: one attachment per expression, drawn on the skull
// (centre 0,0, radius 19). Anchors shared by every face: near eye (-2, 2), far eye (9.5, 2),
// mouth (4.6, 10.5); the face looks right, so the far eye is a little narrower.
const RIG_FACE_ANCHOR = { eyeN: [-2, 2], eyeF: [9.5, 2], mouth: [4.6, 10.5], browY: -4 };
function rigFace(id, name, X) {
  const E = '$eye', st = (d, w) => `<path d="${d}" fill="none" stroke="${E}" stroke-width="${w || 2}" stroke-linecap="round" stroke-linejoin="round"/>`;
  const svg = (s) => ({ kind: 'svg', svg: s });
  const att = {};
  for (const k of ['neutral', 'angry', 'hurt', 'dead', 'happy']) att[k] = svg(X[k](st).replace(/\$eye/g, X.eye || '#0a0c11'));
  return { name: 'face:' + id, id, label: name, att: { face: att } };
}
const RIG_FACES = {
  // Calm: round eyes with a catch light, a small mouth.
  calm: rigFace('calm', 'Calm', {
    neutral: (st) => `<ellipse cx="-2" cy="2" rx="2.2" ry="3.2" fill="$eye"/><ellipse cx="9.5" cy="2" rx="1.9" ry="3" fill="$eye"/>`
      + `<circle cx="-1.3" cy=".6" r=".85" fill="#fff" opacity=".85"/><circle cx="10.1" cy=".6" r=".75" fill="#fff" opacity=".85"/>` + st('M2.8,10.6 Q4.6,11.6 6.6,10.4', 1.6),
    angry: (st) => st('M-6.2,-5.2 L0.6,-2.6 M12.6,-5.4 L7.6,-2.7', 2) + `<ellipse cx="-2" cy="2.6" rx="2.1" ry="2.5" fill="$eye"/><ellipse cx="9.5" cy="2.6" rx="1.8" ry="2.4" fill="$eye"/>`
      + `<path d="M2,9.2 Q4.8,8.4 7.6,9.2 Q7,13.8 4.7,13.9 Q2.5,13.7 2,9.2Z" fill="$eye"/><path d="M3.4,12.4 Q4.8,11.6 6.2,12.4" fill="none" stroke="#c0404c" stroke-width="1.2" stroke-linecap="round"/>`,
    hurt: (st) => st('M-4.8,-0.8 L-0.6,2 L-4.8,4.8 M12,-0.8 L8,2 L12,4.8', 2) + st('M2.2,12 Q3.4,10.2 4.6,11.4 Q5.8,12.6 7,10.8', 1.6),
    dead: (st) => st('M-4.4,-0.4 L0.4,4.4 M0.4,-0.4 L-4.4,4.4 M7.6,-0.2 L11.4,4.2 M11.4,-0.2 L7.6,4.2', 1.9) + st('M2.6,11.2 H6.8', 1.6),
    happy: (st) => st('M-4.6,3.2 Q-2,-1.6 0.6,3.2 M7.2,3.2 Q9.5,-1.4 11.8,3.2', 2) + st('M1.8,8.8 Q4.6,13.6 7.6,8.8', 1.8),
  }),
};

/* ---------------------------------------------------------------- weapons */
// A weapon is a skin for a weapon slot, drawn along +x from the grip (the centre of the fist,
// which is drawn over the handle). Parts keep their own outlines: grip, pommel, blade, guard.
function rigWeapon(id, name, parts, pal) {
  return { name: 'weapon:' + id, id, label: name, pal: pal || {}, att: { weaponN: { weapon: { kind: 'parts', parts } } } };
}
const RIG_WEAPONS = {
  katana: rigWeapon('katana', 'Katana', [
    { kind: 'shape', pts: [[-11, -2.5, 1], [2, -2.5, 1], [2, 2.5, 1], [-11, 2.5, 1]], fill: '#3a2a3a', lines: [{ d: 'M-9,-2.4 L-6.6,2.4 M-6,-2.4 L-3.6,2.4 M-3,-2.4 L-0.6,2.4', c: '#6a5a76', w: 1 }] },
    { kind: 'circle', cx: -11.6, r: 2.6, fill: '$accent' },
    { kind: 'shape', pts: [[3, -2.3, 1], [28, -4.4], [52, -5.6], [58, -6.4, 1], [46, 0.4], [24, 2.6], [3, 2.4, 1]], fill: '#dfe4ee', sh: '#a9b3c6',
      lines: [{ d: 'M6,-0.6 Q28,-2.2 50,-4', c: '#ffffff', w: 1 }] },
    { kind: 'shape', pts: [[1, -6.4], [4, -6.2], [4.2, 6.2], [1, 6.4]], fill: '$accent' },
  ], { accent: '#c9a24a' }),
};

/* ---------------------------------------------------------------- effects */
// Motion effects live in the 'fx' slot (on the chest, in front of everything) and are switched
// on by the animations. The slash: the arc the blade sweeps around the near shoulder.
const RIG_FX = (() => {
  const S = RIG_CANON.shoulder, c = [S.near, S.y];
  const arc = (r0, r1, a0, a1, n) => {
    const P = [];
    for (let i = 0; i <= n; i++) { const a = (a0 + ((a1 - a0) * i) / n) * RIG.D2R, k = Math.sin((Math.PI * i) / n); P.push([c[0] + Math.cos(a) * (r1 - (r1 - r0) * 0.15 * (1 - k)), c[1] + Math.sin(a) * (r1 - (r1 - r0) * 0.15 * (1 - k))]); }
    for (let i = n; i >= 0; i--) { const a = (a0 + ((a1 - a0) * i) / n) * RIG.D2R, k = Math.pow(i / n, 1.6); P.push([c[0] + Math.cos(a) * (r1 - (r1 - r0) * k), c[1] + Math.sin(a) * (r1 - (r1 - r0) * k)]); }
    return 'M' + P.map(RIG.P2).join('L') + 'Z';
  };
  const slash = `<path d="${arc(30, 82, -118, 14, 16)}" fill="#ffffff" opacity=".5"/><path d="${arc(52, 80, -80, 12, 14)}" fill="#ffffff" opacity=".7"/>`;
  return { name: 'fx', pal: {}, att: { fx: { slash: { kind: 'svg', svg: slash } } } };
})();

/* ---------------------------------------------------------------- outfits */
// Outfits are generated from a short recipe so every one fits the canonical body the same way:
// top { c colour, sl sleeve length (0 none … 1 to the wrist), hem (y on the pelvis), fit (extra width),
//       neck 'crew' | 'v' | 'high', zip, trim, cuff }
// bottom { c, len (0.5 shorts … 1 full), flare (extra width at the ankle) }, belt colour,
// shoe [kind 'shoe' | 'boot' | 'sandal', colour].
function rigOutfit(o) {
  const C = RIG_CANON, L = C.len, R = C.r, att = {}, pal = {}, FL = C.frontLine;
  const put = (slot, name, a) => { (att[slot] || (att[slot] = {}))[name] = a; };
  const T = o.top, B = o.bottom;
  if (T) {
    pal.top = T.c; if (T.trim) pal.trim = T.trim; if (T.cuff) pal.cuff = T.cuff;
    const f = T.fit != null ? T.fit : 2.4, hem = T.hem != null ? T.hem : -9;
    const zip = T.zip ? [{ d: `M${FL},${hem + 0.4} L${FL},-27`, c: T.zip, w: 1.4 }] : [];
    put('top.belly', 'top', { kind: 'shape', fill: '$top', lines: zip, pts: rigTorsoPiece(0, hem, -27, f, null, null, true) });
    const neck = T.neck === 'v'
      ? [{ d: `M-3.6,-29 L${FL},-19 L${FL + 6.4},-28.8`, w: 1.4 }]
      : T.neck === 'high' ? [] : [{ d: `M-4.6,-28.9 Q${FL},-24.8 ${FL + 5},-28.6`, w: 1.4 }];
    const cy = -L.torso;
    put('top.chest', 'top', { kind: 'shape', fill: '$top', lines: neck.concat(T.zip ? [{ d: `M${FL},2 L${FL},${T.neck === 'high' ? -29 : -24}`, c: T.zip, w: 1.4 }] : []),
      pts: rigTorsoPiece(cy, cy + 2, cy - 23.6, f, null, [[9.8 + f * 0.5, -27.9], [5 + f * 0.25, -29.3], [-(5 + f * 0.25), -29.3], [-(9.8 + f * 0.5), -27.9]]) });
    if (T.neck === 'high') put('collar', 'collar', { kind: 'shape', fill: '$top', pts: [[-7.4, -26.6, 1], [-6.6, -33.6], [FL, -35.2], [7.6, -33.6], [8.6, -26.6, 1], [FL, -24.2]], lines: [{ d: `M${FL},-35 L${FL},-24.6`, w: 1, op: 0.6 }] });
    // sleeves: one tube per arm bone, matching radii at the elbow so the sleeve bends without a seam
    const sl = Math.max(0, Math.min(1, T.sl || 0));
    if (sl > 0) {
      const ru = [R.upperArm[0] + 2.6, R.upperArm[1] + 2.4], rf = [R.foreArm[0] + 2.4, R.foreArm[1] + 2.3];
      const up = Math.min(1, sl / 0.5), xu = L.upperArm * up, rEnd = ru[0] + (ru[1] - ru[0]) * up;
      const lines = (x, r) => (T.cuff ? [] : [{ d: `M${x - 1.6},${-r + 0.8} L${x - 1.6},${r - 0.8}`, w: 0.9, op: 0.45 }]);
      for (const s of ['N', 'F']) {
        put(`sleeve${s}.upper`, 'sleeve', { kind: 'tube', x0: 0, x1: xu, r0: ru[0], r1: rEnd, flat1: sl < 0.5, fill: '$top', lines: sl < 0.5 ? lines(xu, rEnd) : [] });
        if (sl > 0.5) {
          const xf = L.foreArm * ((sl - 0.5) / 0.5), rfe = rf[0] + (rf[1] - rf[0]) * ((sl - 0.5) / 0.5);
          put(`sleeve${s}.fore`, 'sleeve', { kind: 'tube', x0: 0, x1: xf, r0: rf[0], r1: rfe, flat1: true, fill: '$top',
            svg: T.cuff ? `<path d="M${RIG.f2(xf - 3.4)},${RIG.f2(-rfe)} H${RIG.f2(xf)} V${RIG.f2(rfe)} H${RIG.f2(xf - 3.4)}Z" fill="${T.cuff}" stroke="#0a0c11" stroke-width="1"/>` : '' });
        }
      }
    }
  }
  if (B) {
    pal.bottom = B.c;
    // the seat covers the tops of both trouser legs (circles of radius 9.2 around the hip joints)
    put('pants', 'pants', { kind: 'shape', fill: '$bottom', pts: rigTorsoPiece(0, 4, -13.2, 2.2, [[-14.6, 10.8], [-7, 13.4], [0, 12.8], [6, 13.2], [14, 10.6]]) });
    const len = Math.max(0.3, Math.min(1, B.len || 1)), fl = B.flare || 0;
    const rt = [R.thigh[0] + 2.6, R.thigh[1] + 2.6], rs = [R.shin[0] + 2.6, R.shin[1] + 2.8 + fl];
    for (const s of ['N', 'F']) {
      if (len <= 0.5) {
        const x = L.thigh * (len / 0.5), r = rt[0] + (rt[1] - rt[0]) * (len / 0.5);
        put(`pant${s}.thigh`, 'pant', { kind: 'tube', x1: x, r0: rt[0], r1: r, flat1: true, fill: '$bottom' });
      } else {
        put(`pant${s}.thigh`, 'pant', { kind: 'tube', x1: L.thigh, r0: rt[0], r1: rt[1], fill: '$bottom',
          lines: [{ d: `M${L.thigh - 4},${-rt[1] + 2} Q${L.thigh - 1},-1 ${L.thigh + 1.5},${-rt[1] + 4}`, w: 0.9, op: 0.45 }] });
        // full length stops 3.5 above the ankle (the shoe covers it): a hem lower than that
        // would dig into the floor as soon as the shin tilts
        const x = len >= 1 ? L.shin - 3.5 : L.shin * ((len - 0.5) / 0.5);
        put(`pant${s}.shin`, 'pant', { kind: 'tube', x1: x, r0: rt[1], r1: rs[1], flat1: true, fill: '$bottom' });
      }
    }
  }
  if (o.belt) {
    pal.belt = o.belt;
    put('belt', 'belt', { kind: 'shape', fill: '$belt', pts: [[-15.9, -14, 1], [15.9, -14, 1], [16.1, -9.2, 1], [-16.1, -9.2, 1]], cel: 0.4,
      svg: `<rect x="${FL - 2.8}" y="-14" width="5.6" height="4.8" rx=".8" fill="#e2b44e" stroke="#0a0c11" stroke-width="1"/><rect x="${FL - 1.1}" y="-12.5" width="2.2" height="1.8" fill="#8a6420"/>` });
  }
  if (o.shoe) {
    const [k, c] = o.shoe;
    pal.shoe = c;
    const H = C.footH;
    const shoe = k === 'boot'
      ? { kind: 'shape', fill: '$shoe', pts: [[-7.6, -13], [-1, -13.6], [5.4, -7], [9.8, -2.8], [11.8, 0.8], [11.4, H, 1], [-8.4, H, 1], [-8.8, -4]] }
      : { kind: 'shape', fill: '$shoe', pts: [[-7.4, -6.4], [-1, -7.2], [6, -6.2], [9.8, -2.6], [11.8, 0.8], [11.4, H, 1], [-8.2, H, 1], [-8.9, -1]] };
    shoe.svg = `<path d="M-8.2,${H - 1.8} H11.6" stroke="${RIG.shade(c, -0.45)}" stroke-width="2.2"/>`;
    put('footN', 'foot', shoe); put('footF', 'foot', shoe);
  }
  return { name: 'outfit:' + o.id, id: o.id, label: o.name, pal, att };
}
const RIG_OUTFITS = {
  // The reference outfit: a plain tee, trousers, a belt and shoes.
  traveler: rigOutfit({ id: 'traveler', name: 'Traveler', top: { c: '#5a6880', sl: 0.36, hem: -9 }, bottom: { c: '#30364a', len: 1, flare: 0.8 }, belt: '#3a2a22', shoe: ['shoe', '#3a2c24'] }),
};
