'use strict';
/* ==========================================================================
   TRI-REALM IDLE — Leaf Village: the woodcutting and crafting scenes
   Woodcutting: your avatar chops a tree in a clearing above the hidden village.
   The tree changes with the wood you cut, chips fly on every swing, a notch
   grows in the trunk, the log comes loose and rolls to the pile beside you.
   Crafting: your avatar works the current recipe at a bench in a village
   workshop (hammering, carving, sewing, grinding or brushing, by what the
   recipe makes); the item takes shape above the bench and pops onto the rack.
   Loaded after seas-ui.js (reuses its scene block: spotAvatar, spotStats,
   spotPop, setLast, SPOT_RIG, partAdd) and after avatar.js.
   ========================================================================== */

/* ================================================================ the axe */
// The swing itself is a driven cycle (POSE_DRIVE.wood, redefined below). A scene avatar records where
// its blade bites (the middle of the cutting edge, rig coordinates), like the rod tip and the pan.
{
  const baseAxe = axeSVG;
  axeSVG = function (hand, a, t, P) {
    if (SPOT_CUR) SPOT_CUR.axe = add(add(hand, a, 46), a - 90, 27);
    return baseAxe(hand, a, t, P);
  };
}

/* ================================================================ the felling swing */
// Same signature, same timing as avatar.js (two swings per log, the bite at WOOD_HIT of each swing,
// the same contact pose), so the scenes that reuse it (mining, smelting, restoration) and the impact
// probes keep working. What changes is the weight around the contact:
// - anticipation before the wind-up: the knees settle and the axe head dips before it rises;
// - a coiled hang at the top (the chest keeps turning back while the axe waits);
// - a follow-through that overshoots the contact pose and recoils before the axe is wrenched free;
// - every third log the finishing (low) blow is a power swing: a bigger, slower coil.
let WC_LOGN = 0;
const wcPower = () => WC_LOGN % 3 === 2 && S && S.action && S.action.skill === 'woodcutting';
function wcKeys(low, power) {
  const W = (o) => Object.assign({}, WOOD_BASE, o), y = low ? -9 : 0, pw = power ? 1 : 0;
  const ready = W({ t1: 176, t2: 2, h: 9, tw: 0.75, dx: 2, dy: 3, G: [24, 84 + y], R: 120, s: 11 });
  const dip = W({ t1: 173, t2: 4, n: 1, h: 11, tw: 0.8, dx: 3, dy: 7, G: [27, 77 + y], R: 106, s: 10 });
  const lift = W({ t1: 184, t2: -4, n: 2, h: 6, tw: 0.6, st: 3, ht: -2, dx: -3, dy: 2, G: [4, 121 + y], R: 196, s: 20 });
  const top = W({ t1: 195 - (low ? 3 : 0) + pw * 4, t2: -10 - pw * 4, n: 4 + pw, h: 4 - pw * 2, tw: 0.42 - pw * 0.08, st: 8 + pw * 3, ht: -5 - pw * 2,
    dx: -8 - pw * 3, dy: -1 - pw, G: [-17 - pw * 4, 136 + y * 0.6 + pw * 4], R: 246 - (low ? 10 : 0) + pw * 14, s: 27 });
  const coil = W(Object.assign({}, top, { t1: top.t1 + 1.5 + pw, t2: top.t2 - 1.5, G: [top.G[0] - 2 - pw, top.G[1] + 1], R: top.R + 6 + pw * 4 }));
  // the contact pose is the one avatar.js uses: the notch, the probes and the other scenes rely on it
  const hit = W({ t1: 163, t2: 9, n: -3, h: 13, tw: 0.92, st: -7, ht: 6, dx: 8, dy: 10, G: [31, 86 + y], R: 133 - (low ? 7 : 0), s: 7, expr: 'hurt' });
  const after = (o) => W(Object.assign({}, hit, { expr: undefined }, o));
  return [
    [0, ready],
    [0.07, dip],                                                           // settle into the knees
    [0.18, lift],
    [0.38, top, 'out'],
    [0.47, coil],                                                          // the hang: the coil tightens
    [0.51, W({ t1: 178, t2: 4, n: 0, h: 7, tw: 0.72, st: -2, ht: 2, dx: 3, dy: 4, G: [14, 134 + y], R: 172 - (low ? 4 : 0), s: 15 }), 'in'],
    [WOOD_HIT, hit, 'lin'],
    [0.61, hit],                                                           // hit-stop: frozen in the wood
    [0.665, after({ t1: 159 - pw * 2, t2: 11, h: 16, dy: 12 + pw * 2, n: -2, dx: 9 }), 'out'],   // the body overshoots
    [0.71, after({ t1: 164, t2: 8, h: 13, dy: 9, n: 0 })],                 // and recoils
    [0.77, after({ t1: 169, t2: 5, h: 11, dy: 7, G: [28, 93 + y], R: hit.R + 12, s: 8 })],      // wrench up
    [0.83, after({ t1: 172, t2: 4, h: 10, dy: 6, G: [26, 82 + y], R: hit.R - 10, s: 9 })],      // and down
    [0.92, after({ t1: 177, t2: 2, h: 9, tw: 0.78, st: 0, ht: 0, dx: 1, dy: 4, G: [19, 86 + y], R: 114, s: 11 }), 'out'],
    [1, ready],
  ];
}
const WC_KEYS = [wcKeys(false, false), wcKeys(true, false), wcKeys(true, true)];
POSE_DRIVE.wood = (u, t, B, calm) => {
  const w = Math.max(0, Math.min(WOOD_SWINGS - 0.0001, u * WOOD_SWINGS)), i = Math.floor(w), v = w - i;
  const keys = i % 2 ? WC_KEYS[wcPower() ? 2 : 1] : WC_KEYS[0];
  const P = keyPose(keys, v);
  // the smear: where the haft was a moment ago, during the strike only
  if (v > 0.475 && v <= WOOD_HIT) P.smR = keyPose(keys, Math.max(0.47, v - 0.03)).R;
  // squash: the knees give a little more on the contact frames
  P.dy += 2.5 * win(v, WOOD_HIT - 0.005, WOOD_HIT + 0.01, WOOD_HIT + 0.03, WOOD_HIT + 0.07);
  // after the freeze the haft quivers in the wood, dying out
  const q = win(v, 0.6, 0.61, 0.63, 0.72);
  if (q) P.R += Math.sin(v * 900) * 2.2 * q * (1 - (v - 0.6) / 0.12);
  const br = calm ? 0 : Math.sin(t * 2.2);
  P.t2 += br * 1.2; P.n -= br * 0.8;
  const G = [100 + P.G[0], GROUND - P.G[1]];
  plantPose(P, B, {
    F: () => G,
    B: (J) => add(add(J.aF[2], J.foreA.aF, 4.2 * B.w), P.R, P.s),   // the sliding hand, on the haft
  });
  P.g = P.R - (P.aF[0] + P.aF[1]);
  return P;
};
POSES.wood = POSE_DRIVE.wood(0.02, 0, BODY, true);

/* ================================================================ extra particle kinds */
// curl: a wood shaving curling as it falls · mote: a glowing speck drifting up · glint: a tiny star.
{
  const baseSVG = partSVG;
  partSVG = function (p) {
    const f = (v) => v.toFixed(1), o = Math.min(1, (p.life - p.age) / (p.life * 0.3));
    if (p.kind === 'curl') return `<path transform="translate(${f(p.x)},${f(p.y)}) rotate(${f(p.r)})" d="M-4,0 a4,3.4 0 1,1 4,3.4" fill="none" stroke="${p.col}" stroke-width="2.2" stroke-linecap="round" opacity="${o.toFixed(2)}"/>`;
    if (p.kind === 'mote') return `<circle cx="${f(p.x + Math.sin(p.age * 3 + p.seed) * 4)}" cy="${f(p.y)}" r="${f(p.size || 2)}" fill="${p.col}" opacity="${(o * 0.9).toFixed(2)}"/>`;
    if (p.kind === 'glint') {
      const k = p.age / p.life, s = (p.size || 6) * Math.sin(Math.PI * k);
      return `<path transform="translate(${f(p.x)},${f(p.y)}) rotate(${f(p.r)})" d="M0,${f(-s)} Q${f(s * 0.16)},${f(-s * 0.16)} ${f(s)},0 Q${f(s * 0.16)},${f(s * 0.16)} 0,${f(s)} Q${f(-s * 0.16)},${f(s * 0.16)} ${f(-s)},0 Q${f(-s * 0.16)},${f(-s * 0.16)} 0,${f(-s)}Z" fill="${p.col || '#fff'}"/>`;
    }
    return baseSVG(p);
  };
}

/* ================================================================ trees */
// One look per log: trunk, bark lines, leaves and the shape of the crown.
const TREE_LOOK = {
  pine_log:    { trunk: '#7a4f2c', bark: '#4e3019', leaf: ['#2f6b3a', '#3f8a48'], crown: 'pine', wood: '#ecc994' },
  cedar_log:   { trunk: '#8c4a2a', bark: '#5a2a14', leaf: ['#2d5e36', '#4c8a3e'], crown: 'pine', wide: 1, wood: '#e9b98a' },
  bamboo:      { trunk: '#79c04f', bark: '#3f7a2a', leaf: ['#5fae3f', '#9ad86a'], crown: 'bamboo', wood: '#e2ecb0' },
  mistwood:    { trunk: '#6b6f7a', bark: '#41444d', leaf: ['#5d8a86', '#8fbab4'], crown: 'round', mist: 1, wood: '#dcd6c8' },
  ironwood:    { trunk: '#3d3a3a', bark: '#1f1d1d', leaf: ['#3a5432', '#5a7a44'], crown: 'round', hard: 1, wood: '#b8946c' },
  blossomwood: { trunk: '#5a3a32', bark: '#36201a', leaf: ['#ff9fc4', '#ffd0e2'], crown: 'round', petals: '#ffc2da', wood: '#f2cdb4' },
  spirit_oak:  { trunk: '#4a3a5a', bark: '#2a1f36', leaf: ['#4fc9a6', '#9ff3dc'], crown: 'round', glow: '#7fffd8', wood: '#cfeedd' },
  heartwood:   { trunk: '#7a3a1a', bark: '#4a1e0a', leaf: ['#ffb43a', '#ffe28a'], crown: 'round', glow: '#ffd36a', wood: '#ffcf7a' },
};
const WOOD_BOX = { x: 120, y: 58, h: 194 };
const WOOD_GROUND = 252;
// Where the blade bites on swing i (0: the high cut, 1: the low one), in scene coordinates.
function axeHitAt(i) {
  SPOT_RIG.__probe = {};
  const A = avState();
  try { drawAvatar(A, POSE_DRIVE.wood((i + WOOD_HIT) / WOOD_SWINGS, 0, BODY, true), 0, { uid: '__probe' }); } catch (e) { /* rig busy */ }
  const p = SPOT_RIG.__probe.axe;
  delete SPOT_RIG.__probe;
  return p ? rigToSpot(WOOD_BOX, p) : [330, 190 + i * 10];
}
const wPine = (x, y, w, h, c) => `<path d="M${x} ${y - h} L${x + w / 2} ${y} H${x - w / 2}Z" fill="${c}"/>`;
const wBlob = (x, y, r, c) => `<circle cx="${x}" cy="${y}" r="${r}" fill="${c}"/>`;
function treeSVG(L, x0, w) {
  const cx = x0 + w / 2;
  let s = '';
  if (L.glow) s += `<circle cx="${cx}" cy="90" r="210" fill="url(#wc-glow)"/>`;
  // trunk with bark lines, roots
  s += `<path d="M${x0} -10 H${x0 + w} V${WOOD_GROUND} q14 6 26 14 H${x0 - 26} q12 -8 26 -14Z" fill="${L.trunk}"/>`;
  s += `<rect x="${x0}" y="-10" width="${Math.round(w * 0.22)}" height="${WOOD_GROUND + 10}" fill="#fff" opacity=".08"/><rect x="${x0 + w - 12}" y="-10" width="12" height="${WOOD_GROUND + 10}" fill="#000" opacity=".18"/>`;
  if (L.crown === 'bamboo') {
    for (let y = 30; y < WOOD_GROUND; y += 52) s += `<rect x="${x0 - 2}" y="${y}" width="${w + 4}" height="6" rx="3" fill="${L.bark}"/>`;
  } else {
    const r = sceneRng(w + x0);
    for (let i = 0; i < 9; i++) { const bx = x0 + 8 + r() * (w - 16), by = r() * 200; s += `<path d="M${bx.toFixed(0)} ${by.toFixed(0)} q${(r() * 6 - 3).toFixed(0)} 22 0 ${(30 + r() * 30).toFixed(0)}" stroke="${L.bark}" stroke-width="3" fill="none" opacity=".75"/>`; }
  }
  // the crown, cut by the top of the frame: it sways in the wind (outer group) and shakes on a blow (inner)
  const [a, b] = L.leaf;
  let c = '';
  if (L.crown === 'pine') {
    const k = L.wide ? 1.25 : 1;
    c = wPine(cx, 118, 270 * k, 150, a) + wPine(cx, 46, 220 * k, 140, a) + wPine(cx - 6, 110, 170 * k, 86, b) + wPine(cx - 4, 36, 130 * k, 80, b);
  } else if (L.crown === 'bamboo') {
    s += `<rect x="${x0 + w + 60}" y="-10" width="${w * 0.6}" height="${WOOD_GROUND + 10}" fill="${L.trunk}" opacity=".7"/><rect x="${x0 - 90}" y="-10" width="${w * 0.5}" height="${WOOD_GROUND - 20}" fill="${L.trunk}" opacity=".55"/>`;
    for (let i = 0; i < 9; i++) c += `<path d="M${cx + (i - 4) * 26} ${10 + (i % 3) * 18} q${i % 2 ? 50 : -50} -6 ${i % 2 ? 80 : -80} 14 q${i % 2 ? -40 : 40} 2 ${i % 2 ? -80 : 80} -14Z" fill="${i % 2 ? a : b}"/>`;
  } else {
    c = wBlob(cx - 70, 30, 70, a) + wBlob(cx + 70, 26, 74, a) + wBlob(cx, -10, 90, a) + wBlob(cx - 30, 20, 50, b) + wBlob(cx + 40, 6, 46, b);
  }
  return s + `<g class="wc-crown"><g class="wc-crown-in">${c}</g></g>`;
}
function woodBg(look, hit) {
  const L = TREE_LOOK[look] || TREE_LOOK.pine_log, H = 190;
  const x0 = Math.round(hit[0] - 6), w = L.crown === 'bamboo' ? 40 : 74;
  let s = `<defs>${spGrad('wc-sky', ['#6fb8ea', '#bfe4f6', '#ffe6bf'])}${spGrad('wc-hill', ['#6f9a63', '#4c7448'])}${spGlow('wc-sun', '#fff2c8')}${spGlow('wc-glow', L.glow || '#fff')}</defs>`;
  s += `<rect width="800" height="${H + 2}" fill="url(#wc-sky)"/><circle cx="130" cy="58" r="90" fill="url(#wc-sun)"/><circle cx="130" cy="58" r="26" fill="#fff6d6"/>`;
  s += `<g class="wc-clouds">${spClouds(23, 5, 26, 110, '#ffffff', 0.8)}</g>`;
  // far mountains and the hidden village in the valley
  s += `<path d="M0 ${H - 40} L90 ${H - 96} L170 ${H - 52} L260 ${H - 120} L360 ${H - 50} L470 ${H - 104} L560 ${H - 46} L660 ${H - 90} L800 ${H - 40} V${H}H0Z" fill="#8fb3c8" opacity=".75"/>`;
  s += `<path d="M0 ${H - 10} Q120 ${H - 46} 240 ${H - 22} Q380 ${H - 54} 520 ${H - 20} Q660 ${H - 44} 800 ${H - 14} V${H + 4} H0Z" fill="url(#wc-hill)"/>`;
  for (const [x, hh, c] of [[470, 22, '#c9673f'], [500, 30, '#d8c3a0'], [532, 18, '#c9673f'], [556, 26, '#d8c3a0']]) s += `<rect x="${x}" y="${H - 12 - hh}" width="22" height="${hh}" fill="${c}"/><path d="M${x - 4} ${H - 12 - hh} l15 -10 l15 10z" fill="#6a3a2a"/>`;
  s += `<rect x="512" y="${H - 66}" width="5" height="30" fill="#6a3a2a"/><circle class="wc-fire" cx="514" cy="${H - 70}" r="5" fill="#ff7a1a"/>`;   // the village watch-fire
  { const r = sceneRng(9); for (let i = 0; i < 22; i++) { const x = Math.round(r() * 800), hh = 30 + r() * 40; if (Math.abs(x - hit[0]) > 70) s += wPine(x, H + 8, hh * 0.7, hh, '#3d6b45'); } }
  // the clearing; its grass leans with the wind
  s += `<rect y="${H}" width="800" height="${320 - H}" fill="#6a8f4a"/><path d="M0 ${WOOD_GROUND - 6} Q200 ${WOOD_GROUND - 18} 400 ${WOOD_GROUND - 8} T800 ${WOOD_GROUND - 6} V320 H0Z" fill="#557a3b"/>`;
  { const r = sceneRng(4); let g = ''; for (let i = 0; i < 40; i++) { const x = Math.round(r() * 800), y = Math.round(WOOD_GROUND - 4 + r() * 66); g += `<path d="M${x} ${y} l3 -9 l2 9 l3 -7 l1 7" stroke="#3f6a2c" stroke-width="2" fill="none"/>`; } s += `<g class="wc-grass">${g}</g>`; }
  if (L.mist) s += `<rect y="${H - 30}" width="800" height="80" fill="#e6f2f0" opacity=".25"/>`;
  s += `<g class="wc-tree ${L.crown === 'bamboo' ? 'bamboo' : ''}">${treeSVG(L, x0, w)}</g>`;
  // a stump and a chopping block on the left
  s += `<ellipse cx="60" cy="${WOOD_GROUND + 18}" rx="34" ry="9" fill="#6a4426"/><rect x="26" y="${WOOD_GROUND - 4}" width="68" height="22" fill="#7a5130"/><ellipse cx="60" cy="${WOOD_GROUND - 4}" rx="34" ry="9" fill="#c99a62"/><ellipse cx="60" cy="${WOOD_GROUND - 4}" rx="20" ry="5" fill="none" stroke="#9a6a3a" stroke-width="2"/>`;
  return s;
}
// The pile of the log you are cutting, by your feet: one drawn log per 10 owned, up to 10.
function logPile(id) {
  const n = Math.min(10, Math.ceil(familyCount(id) / 10)), L = TREE_LOOK[id] || TREE_LOOK.pine_log;
  const rows = [4, 3, 2, 1];
  let s = '', i = 0;
  rows.forEach((cols, row) => {
    for (let c = 0; c < cols && i < n; c++, i++) {
      const x = 660 + c * 30 + row * 15, y = WOOD_GROUND + 30 - row * 20;
      s += `<rect x="${x - 40}" y="${y - 10}" width="40" height="20" fill="${L.trunk}" stroke="#1a0e06" stroke-width="2"/><ellipse cx="${x}" cy="${y}" rx="7" ry="10" fill="#e6c08a" stroke="#1a0e06" stroke-width="2"/><ellipse cx="${x}" cy="${y}" rx="3" ry="5" fill="none" stroke="#a87a44" stroke-width="1.5"/>`;
    }
  });
  return s;
}

/* ================================================================ scene block */
function woodHTML() {
  const a = S.action && S.action.skill === 'woodcutting' ? findAction('woodcutting', S.action.id) : null;
  const best = SKILLS.woodcutting.actions.filter((x) => x.level <= skillLv('woodcutting')).pop();
  const look = (a || best).id, hits = [axeHitAt(0), axeHitAt(1)], hit = [Math.min(hits[0][0], hits[1][0]), hits[0][1]];
  SPOT.wood = { look, hit, hits };
  WC_ROLL.length = 0;
  const L = TREE_LOOK[look] || TREE_LOOK.pine_log, last = SPOT.last_woodcutting;
  // ambient life: birds crossing the sky, drifting mist, fireflies around the spirit trees
  const amb = '<div class="wc-birds"><i></i><i></i><i></i></div>'
    + (L.mist ? '<div class="wc-mist"><i></i><i></i></div>' : '')
    + (L.glow ? `<div class="wc-motes" style="--mc:${L.glow}">${'<i></i>'.repeat(7)}</div>` : '');
  return `<section class="win spot-win" style="--rc:${rc('shinobi')}">
    <div class="spot sp-wood ${a ? 'on' : ''}" data-spot="woodcutting" data-tree="${look}">
      <svg class="spot-bg" viewBox="0 0 800 320" preserveAspectRatio="none" aria-hidden="true">${woodBg(look, hit)}<g data-pile>${logPile(look)}</g></svg>
      ${amb}
      ${spotAvatar(WOOD_BOX, a ? 'chopUp' : '')}
      <svg class="spot-fx" viewBox="0 0 800 320" preserveAspectRatio="none" aria-hidden="true"><defs><filter id="sp-soft" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="2.4"/></filter></defs><g data-spotfx></g><g data-wclog></g><g data-parts></g></svg>
      ${L.petals ? '<div class="wc-petals"><i></i><i></i><i></i><i></i><i></i><i></i></div>' : ''}
      <div class="spot-pops"></div>
      <div class="spot-hud"><span class="sh-name"><small>Forest above the village</small><b>${esc(a ? a.name.replace(/ Log$| Stalk$/, '') + ' tree' : 'Pick a tree')}</b></span>${last ? `<span class="sh-last">${last}</span>` : '<span class="sh-last" hidden></span>'}</div>
    </div>
    <div class="spot-bar">${spotStats('woodcutting')}</div>
  </section>`;
}
UIX.realmScene.push((realm, skill) => (skill === 'woodcutting' ? woodHTML() : ''));


/* ---------------------------------------------------------------- per-frame */
// The avatar swings twice per log (POSE_DRIVE.wood): a high cut, then a low one, so the notch in
// the trunk is a V that deepens with every blow. On each impact, as games sell a heavy hit: the
// axe freezes in the wood (the pose holds it), the scene gives a short thud, a flash marks the bite,
// chips burst out of the cut and tumble to the grass, bark flakes fall, the crown shakes a beat
// later and loses leaves. Each wood answers in its own way (bamboo rings and sways, ironwood
// sparks, mistwood breathes out mist, blossom sheds petals, the spirit trees spill light).
const WC_DEPTH = [4, 13, 24];
function wcNotch(W, depth) {
  const [h0, h1] = W.hits, x = W.hit[0] - 6, top = h0[1] - 9 - depth * 0.3, bot = h1[1] + 5, mid = (h0[1] + h1[1]) / 2 + 1;
  const L = TREE_LOOK[W.look] || TREE_LOOK.pine_log, c = L.wood || '#ecc994', f = (v) => v.toFixed(1);
  return `<path d="M${f(x)} ${f(top)} L${f(x + depth)} ${f(mid)} L${f(x)} ${f(mid)}Z" fill="${c}"/>`
    + `<path d="M${f(x)} ${f(mid)} L${f(x + depth)} ${f(mid)} L${f(x)} ${f(bot)}Z" fill="${shade(c, -0.22)}"/>`
    + `<path d="M${f(x)} ${f(top)} L${f(x + depth)} ${f(mid)} L${f(x)} ${f(bot)}" fill="none" stroke="#3a2210" stroke-width="2.2" stroke-linejoin="round"/>`
    + `<path d="M${f(x + depth * 0.25)} ${f(top + (mid - top) * 0.3)} l${f(depth * 0.4)} ${f((mid - top) * 0.35)}" stroke="#fff" stroke-width="1.2" opacity=".35"/>`;
}
function wcImpact(el, W, i, power) {
  const L = TREE_LOOK[W.look] || TREE_LOOK.pine_log, [hx, hy] = W.hits[i], r = Math.random, big = power ? 1.6 : 1;
  const tree = el.querySelector('.wc-tree');
  retrigger(tree, 'hit');
  retrigger(el, power ? 'thud-big' : 'thud');
  partAdd({ kind: 'flash', x: hx + 2, y: hy, life: power ? 0.22 : 0.16, g: 0 });
  const chips = L.hard ? 4 : L.crown === 'bamboo' ? 3 : Math.round(7 * big);
  // chips fly out of the cut, mostly back towards the axeman and up, and tumble as they fall
  for (let k = 0; k < chips; k++) partAdd({ kind: 'chip', x: hx + 2, y: hy + r() * 6 - 3, vx: (-60 - r() * 220 + (k === 0 ? 260 : 0)) * (power ? 1.2 : 1), vy: -120 - r() * 260 * big,
    vr: (r() - 0.5) * 1400, w: 5 + r() * 5, h: 2.5 + r() * 2, col: L.wood || '#ecc994', life: 1.4 + r() * 0.8, floor: WOOD_GROUND + 6 + r() * 40 });
  for (let k = 0; k < 2; k++) partAdd({ kind: 'chip', x: hx, y: hy - 4, vx: -30 - r() * 90, vy: -40 - r() * 80,
    vr: (r() - 0.5) * 600, w: 6, h: 3.5, col: L.bark, life: 1.4, floor: WOOD_GROUND + 10 + r() * 30 });
  // the wood's own answer
  if (L.crown === 'bamboo') {        // long green slivers, and the stalk rings and sways
    for (let k = 0; k < 3; k++) partAdd({ kind: 'chip', x: hx + 2, y: hy, vx: -40 - r() * 160, vy: -90 - r() * 180, vr: (r() - 0.5) * 900, w: 12 + r() * 6, h: 1.6, col: '#cfe79a', life: 1.6, floor: WOOD_GROUND + 8 + r() * 36 });
    spotPop('', hx + 4, hy, 'wc-ring', 500);
  }
  if (L.hard) for (let k = 0; k < 5 * big; k++) partAdd({ kind: 'spark', x: hx + 3, y: hy, vx: -40 - r() * 200, vy: -80 - r() * 160, g: 500, life: 0.4 + r() * 0.3 });
  if (L.mist) for (let k = 0; k < 2; k++) partAdd({ kind: 'puff', x: hx + 6, y: hy - 2, vx: 10 + r() * 30, vy: -8 - r() * 10, g: 0, size: 5, life: 1.4 });
  if (L.glow) for (let k = 0; k < 4 * big; k++) partAdd({ kind: 'mote', x: hx + 4, y: hy, vx: (r() - 0.3) * 70, vy: -30 - r() * 60, g: -20, size: 1.6 + r() * 1.4, col: L.glow, life: 1.4 + r() });
  // the crown shakes loose a leaf or two (or a flurry of petals)
  const n = (L.petals ? 4 : 1 + (r() < 0.6 ? 1 : 0)) + (power ? 2 : 0);
  for (let k = 0; k < n; k++) partAdd({ kind: 'leaf', x: W.hit[0] + 30 + (r() - 0.5) * 220, y: 30 + r() * 60, vx: (r() - 0.5) * 30, vy: 10,
    vr: (r() - 0.5) * 200, col: L.petals || L.leaf[k % 2], life: 4.5, g: 0, floor: WOOD_GROUND + 10 + r() * 40, seed: r() * 6 });
}

// The log: it comes loose from the cut, drops, bounces once and rolls to the pile, where it joins it.
// Seen end-on (the grain turns as it rolls). At most a few at once; drawn in [data-wclog].
const WC_ROLL = [];
let wcRollT = 0;
const WC_PILE_X = 606, WC_LOG_R = 13;
function wcLogSVG(o) {
  const f = (v) => v.toFixed(1), L = TREE_LOOK[o.look] || TREE_LOOK.pine_log, gold = o.gold;
  const rim = gold ? '#c98a1c' : L.trunk, face = gold ? '#ffe27a' : '#e6c08a', ring = gold ? '#b8860b' : '#a87a44';
  return `<g transform="translate(${f(o.x)},${f(o.y)})" opacity="${f(o.op)}"><ellipse cx="0" cy="${f(WC_LOG_R + 1)}" rx="${f(WC_LOG_R)}" ry="2.6" fill="#000" opacity=".22" transform="translate(0,${f(Math.max(0, o.floor - o.y - WC_LOG_R))})"/>`
    + `<g transform="rotate(${f(o.r)})"><circle r="${WC_LOG_R + 2.4}" fill="${rim}" stroke="#1a0e06" stroke-width="2"/><circle r="${WC_LOG_R - 1}" fill="${face}"/>`
    + `<circle r="${f(WC_LOG_R * 0.55)}" fill="none" stroke="${ring}" stroke-width="1.4"/><circle r="2" fill="${ring}"/><path d="M0,-2 V${-(WC_LOG_R - 1)}" stroke="${ring}" stroke-width="1.4"/></g></g>`;
}
function wcRollStep(el) {
  const g = el.querySelector('[data-wclog]');
  const now = performance.now() / 1000, dt = Math.min(0.05, Math.max(0, now - (wcRollT || now)));
  wcRollT = now;
  if (!g) return;
  if (!WC_ROLL.length) { if (g.firstChild) g.innerHTML = ''; return; }
  for (let i = WC_ROLL.length - 1; i >= 0; i--) {
    const o = WC_ROLL[i];
    o.age += dt;
    if (o.phase === 0) {                       // falling, tumbling
      o.vy += 1100 * dt; o.x += o.vx * dt; o.y += o.vy * dt; o.r += o.vr * dt;
      if (o.y >= o.floor) { o.y = o.floor; if (o.bounces-- > 0 && o.vy > 120) { o.vy *= -0.34; o.vx = 120; spotPop('', o.x, o.floor + WC_LOG_R, 'wc-dust', 600); } else { o.phase = 1; o.vy = 0; o.vx = Math.max(o.vx, 170); } }
    } else if (o.phase === 1) {                // rolling to the pile, slowing as it gets there
      const left = WC_PILE_X - o.x;
      o.vx = Math.max(40, Math.min(o.vx, left * 2.4));
      o.x += o.vx * dt; o.r += (o.vx * dt / WC_LOG_R) * 57.3;
      if (left < 4) { o.phase = 2; o.age = 0; }
    } else {                                   // it joins the pile
      o.op = Math.max(0, 1 - o.age / 0.25);
      if (o.op <= 0) {
        WC_ROLL.splice(i, 1);
        const pile = el.querySelector('[data-pile]');
        if (pile && SPOT.wood) { pile.innerHTML = logPile(SPOT.wood.look); retrigger(pile, 'bump'); }
        continue;
      }
    }
  }
  g.innerHTML = WC_ROLL.map(wcLogSVG).join('');
}

UPD.push(() => {
  const el = spotNow();
  if (!el || el.dataset.spot !== 'woodcutting') return;
  const k = actFrac('woodcutting'), av = el.querySelector('.spot-av svg.avatar'), g = el.querySelector('[data-spotfx]');
  el.classList.toggle('on', k >= 0);
  setPose(av, k >= 0 ? 'wood' : '');
  wcRollStep(el);
  const W = SPOT.wood;
  if (!W || !g) return;
  if (k < 0) { if (g.innerHTML) g.innerHTML = ''; SPOT.wcV = null; return; }
  // where the swing is: which of the two swings, and how far into it
  const u = driveU('wood', performance.now() / 1000) * WOOD_SWINGS, i = Math.min(WOOD_SWINGS - 1, Math.floor(u)), v = u - i;
  const landed = i + (v >= WOOD_HIT ? 1 : 0);
  if (W.depth !== landed) { W.depth = landed; g.innerHTML = wcNotch(W, WC_DEPTH[Math.min(2, landed)]); }
  const prev = SPOT.wcV;
  SPOT.wcV = u;
  if (prev != null && prev < i + WOOD_HIT && u >= i + WOOD_HIT && u - prev < 0.5) wcImpact(el, W, i, i === 1 && wcPower());
});
on('action', (d) => {
  if (d.skill !== 'woodcutting') return;
  WC_LOGN++;
  const id = Object.keys(d.act.out || {})[0], it = id && ITEMS[id];
  if (!it) return;
  setLast('woodcutting', `<small>Last log</small><b>${esc(it.name)}</b><em>${fmt(familyCount(id))} owned</em>`);
  const el = spotNow();
  if (!el || el.dataset.spot !== 'woodcutting' || !SPOT.wood) return;
  const W = SPOT.wood, [hx, hy] = W.hit, L = TREE_LOOK[W.look] || TREE_LOOK.pine_log;
  // the wedge of wood between the two cuts comes loose and drops out of the notch
  partAdd({ kind: 'chip', x: hx + 4, y: hy + 4, vx: -70, vy: -150, vr: -500, w: 14, h: 7, col: L.wood || '#ecc994', life: 1.8, floor: WOOD_GROUND + 18 });
  for (let k = 0; k < 3; k++) partAdd({ kind: 'leaf', x: hx + 30 + (Math.random() - 0.5) * 260, y: 20 + Math.random() * 70, vx: 0, vy: 14, vr: 120, col: L.petals || L.leaf[k % 2], life: 4.5, g: 0, floor: WOOD_GROUND + 10 + Math.random() * 40, seed: k * 2 });
  W.depth = null;
  spotPop(`<span class="tile-art">${itemIc(id)}</span>`, hx, hy - 10, 'dish', 1300);
  spotPop(`<b>+${fmt(d.gains[id] || 1)} ${esc(it.name)}</b>`, hx + 60, hy - 70, 'tag', 1600);
  // the log rolls to the pile (or, with reduced motion, simply appears on it)
  const gold = SPOT.wcGold && performance.now() - SPOT.wcGold < 400;
  if (!avCalm() && !document.hidden) {
    if (WC_ROLL.length >= 3) WC_ROLL.shift();
    WC_ROLL.push({ look: W.look, gold, x: hx + 22, y: hy + 6, vx: 60 + Math.random() * 40, vy: -170, vr: 380, r: 0, floor: WOOD_GROUND + 26, bounces: 1, phase: 0, age: 0, op: 1 });
  } else {
    const pile = el.querySelector('[data-pile]');
    if (pile) pile.innerHTML = logPile(id);
  }
});
// A Golden log (Shiny, leaf.js): the tree flashes gold, the log that rolls to the pile is golden.
on('quality', (d) => {
  if (d.skill !== 'woodcutting' || d.q !== 's') return;
  SPOT.wcGold = performance.now();
  const el = spotNow();
  if (!el || el.dataset.spot !== 'woodcutting' || !SPOT.wood) return;
  if (typeof sxBurst === 'function') sxBurst(el, SPOT.wood.hit[0] + 30, SPOT.wood.hit[1] - 30, true, 'Golden log!', ITEMS[d.item].name);
  retrigger(el.querySelector('.wc-tree'), 'gold');
});
// A rare find in the branches (a bird's nest, a herb pouch): it drops out of the crown with a burst
// of leaves, a bird bolts from the tree, and the find bounces in the grass.
on('rare', (d) => {
  if (d.source !== 'Woodcutting') return;
  const el = spotNow();
  if (!el || el.dataset.spot !== 'woodcutting' || !SPOT.wood || !ITEMS[d.id]) return;
  const W = SPOT.wood, L = TREE_LOOK[W.look] || TREE_LOOK.pine_log, x = W.hit[0] + 60, m = spotPx(), r = Math.random;
  const nest = spotPop(`<span class="tile-art">${itemIc(d.id)}</span>`, x, 40, 'wc-nest', 2600);
  if (nest) nest.style.setProperty('--fy', ((WOOD_GROUND + 6 - 40) * m).toFixed(0) + 'px');
  const bird = spotPop('<i></i>', x - 10, 50, 'wc-bolt', 1600);
  if (bird) { bird.style.setProperty('--bx', (260 * m).toFixed(0) + 'px'); bird.style.setProperty('--by', (-90 * m).toFixed(0) + 'px'); }
  for (let k = 0; k < 8; k++) partAdd({ kind: 'leaf', x: x + (r() - 0.5) * 160, y: 30 + r() * 50, vx: (r() - 0.5) * 60, vy: 20, vr: (r() - 0.5) * 300, col: L.petals || L.leaf[k % 2], life: 4, g: 0, floor: WOOD_GROUND + 10 + r() * 40, seed: r() * 6 });
  retrigger(el.querySelector('.wc-tree'), 'hit');
  setTimeout(() => spotPop(`<small>${ui('rare')}Rare find</small><b>${esc(ITEMS[d.id].name)}</b>`, x, WOOD_GROUND - 60, 'tag gold', 2200), 700);
});
// Carvings sold abroad by a returning ship (leaf.js).
on('tradesold', (d) => toast(`Your ship sold its carvings abroad: +${fmt(d.gold)} gold.`, 'good'));

/* ==========================================================================
   CRAFTING — the village workshop
   ========================================================================== */
// What the hands do depends on what the recipe makes: metal is hammered on a bench anvil, wood is
// carved with a knife, cloth is sewn, pills are ground in a mortar, scrolls are brushed.
const CS_METAL = /ingot|steel|iron|plate|starsteel|sunstone|void_stone|jade|sapphire|ruby|diamond|tusk|horn|antler|crown/;
const CS_SOFT = /fur|feather|pelt|silk|sash|mane/;
function csModeOf(a) {
  const o = a && a.out ? Object.keys(a.out)[0] : null, it = o && ITEMS[o];
  if (!it) return 'carve';
  const ins = Object.keys(a.in || {}).join(' ');
  if (it.type === 'food' || it.type === 'bait') return 'grind';
  if (it.type === 'scroll' || /talisman|scroll/.test(o)) return 'brush';
  if (it.type === 'trade') return 'carve';
  if (it.type === 'equip') {
    if (it.slot === 'armor' || /headband/.test(o)) return 'sew';
    return CS_METAL.test(ins) ? 'hammer' : 'carve';
  }
  if (CS_METAL.test(ins)) return 'hammer';
  return CS_SOFT.test(ins) ? 'sew' : 'carve';
}
let CS_PREVIEW = 'hammer';
const csModeNow = () => {
  if (S && S.action && S.action.skill === 'arts') { const a = findAction('arts', S.action.id); if (a) return csModeOf(a); }
  return CS_PREVIEW;
};

/* ---------------------------------------------------------------- the tools */
// Small one-hand tools held in the front fist. Each records its working point (rig coordinates) for
// the scene: where it strikes, cuts, pierces, grinds or paints.
{
  const at = (hand, a, d, side) => add(add(hand, a, d), a - 90, side || 0);
  const rec = (k, p) => { if (SPOT_CUR) SPOT_CUR[k] = p; };
  PROP_DRAW.csHammer = (hand, a, t, P) => {
    rec('tool', at(hand, a, 27.5, 10));
    const q = [at(hand, a, 21, -6), at(hand, a, 34, -6), at(hand, a, 34, 10), at(hand, a, 21, 10)];
    let sm = '';
    if (P && P.smR != null && Math.abs(P.smR - a) > 6) {   // a short smear on the strike
      const o = [], n = 5; for (let i = 0; i <= n; i++) { const b = P.smR + (a - P.smR) * (i / n); o.push(at(hand, b, 28, 10)); }
      sm = `<path d="M${pt(hand)}L${o.map(pt).join('L')}Z" fill="#eef3fb" opacity=".35"/>`;
    }
    return sm + part(taper([at(hand, a, -7), at(hand, a, 31)], [3.6, 3]), '#7a4a26', 2.2)
      + `<path d="M${q.map(pt).join('L')}Z" fill="#5d6470" stroke="${OL}" stroke-width="2" stroke-linejoin="round"/>`
      + `<path d="M${pt(at(hand, a, 21.5, 10))}L${pt(at(hand, a, 33.5, 10))}" stroke="#c9d1dc" stroke-width="2.6"/><path d="M${pt(at(hand, a, 23, -3))}L${pt(at(hand, a, 32, -3))}" stroke="#fff" stroke-width="1.2" opacity=".35"/>`;
  };
  PROP_DRAW.csKnife = (hand, a) => {
    rec('tool', at(hand, a, 26, 0.6));
    return part(taper([at(hand, a, -5), at(hand, a, 8)], [3.4, 3.2]), '#3a2a1e', 2)
      + `<path d="M${pt(at(hand, a, 8, -2.2))}L${pt(at(hand, a, 22, -1.8))}L${pt(at(hand, a, 27, 0.6))}L${pt(at(hand, a, 8, 2.4))}Z" fill="#dfe6f0" stroke="${OL}" stroke-width="1.6" stroke-linejoin="round"/>`
      + `<path d="M${pt(at(hand, a, 10, -1))}L${pt(at(hand, a, 22, -0.8))}" stroke="#fff" stroke-width=".9" opacity=".7"/>`;
  };
  PROP_DRAW.csNeedle = (hand, a) => {
    rec('tool', at(hand, a, 11)); rec('eye', at(hand, a, -2));
    return `<path d="M${pt(at(hand, a, -3))}L${pt(at(hand, a, 11))}" stroke="${OL}" stroke-width="3" stroke-linecap="round"/><path d="M${pt(at(hand, a, -3))}L${pt(at(hand, a, 11))}" stroke="#eef2f8" stroke-width="1.3" stroke-linecap="round"/>`;
  };
  PROP_DRAW.csPestle = (hand, a) => {
    rec('tool', at(hand, a, 22));
    return part(taper([at(hand, a, -6), at(hand, a, 8), at(hand, a, 21)], [3.2, 3.8, 6]), '#c9c0ae', 2)
      + `<path d="M${pt(at(hand, a, 0, -1))}L${pt(at(hand, a, 16, -2))}" stroke="#fff" stroke-width="1" opacity=".5"/>`;
  };
  PROP_DRAW.csBrush = (hand, a) => {
    rec('tool', at(hand, a, 23));
    return part(taper([at(hand, a, -9), at(hand, a, 13)], [2.4, 2.6]), '#c9b06a', 1.8)
      + `<path d="M${pt(at(hand, a, 12, -2))}L${pt(at(hand, a, 15, -2.4))}L${pt(at(hand, a, 15, 2.4))}L${pt(at(hand, a, 12, 2))}Z" fill="#6a4426" stroke="${OL}" stroke-width="1.2"/>`
      + `<path d="M${pt(at(hand, a, 15, -2.6))}Q${pt(at(hand, a, 20, -2.4))} ${pt(at(hand, a, 23, 0))}Q${pt(at(hand, a, 20, 2.4))} ${pt(at(hand, a, 15, 2.6))}Z" fill="#1a1410" stroke="${OL}" stroke-width="1.2"/>`;
  };
}

/* ---------------------------------------------------------------- the motions */
// One cycle per item crafted, played in step with the action (like the felling swing). Each mode
// moves the tool's working point (tp, from the work spot on the bench, rig coordinates) and its
// angle (R); the front hand is solved onto the tool, the back hand steadies the work (bh), the feet
// stay planted. Repeated beats fill the first part of the cycle (strikes, cuts, stitches...), then a
// short finishing move (an inspection, a pound, a look at the brushwork) before the item appears.
const CS_WK = [146, 156];
const CS_BASE = { sh: 1, bf: 1, fF: 12, fB: -192, feet: [10, -14], aF: [30, 60], aB: [30, 90], lF: [0, 0], lB: [0, 0], g: 0, st: 0, ht: 0 };
const csK = (base, o) => Object.assign({}, base, o);
const CS_GRIP = {   // the working point, from the grip, at angle R
  csHammer: (R) => add(add([0, 0], R, 27.5), R - 90, 10), csKnife: (R) => add(add([0, 0], R, 26), R - 90, 0.6),
  csNeedle: (R) => add([0, 0], R, 11), csPestle: (R) => add([0, 0], R, 22), csBrush: (R) => add([0, 0], R, 23),
};
const CS_MODES = {};
{
  // hammering: four strikes, the last one heavier, then the piece is turned and inspected
  const RD = { tp: [-6, -12], R: 112, bh: [-15, 1], t1: 172, t2: 4, n: 2, h: 14, dy: 3, dx: 4, tw: 0.72 };
  const strikes = [false, false, false, true].map((heavy) => {
    const top = csK(RD, { tp: [-4, heavy ? -74 : -58], R: heavy ? 182 : 166, t1: heavy ? 182 : 177, t2: heavy ? -5 : 0, h: heavy ? 5 : 10, dy: heavy ? 0 : 2, dx: heavy ? 0 : 3, st: 5, ht: -3, tw: heavy ? 0.6 : 0.68 });
    const hit = csK(RD, { tp: [0, 0], R: 86, t1: heavy ? 162 : 167, t2: 7, h: 16, dy: heavy ? 9 : 6, dx: 6, st: -4, ht: 3, expr: heavy ? 'hurt' : undefined });
    return [[0, RD], [0.36, top, 'out'], [0.48, csK(top, { tp: [-11, top.tp[1] - 3], R: top.R + 5, t1: top.t1 + 1 })],
      [0.56, hit, 'in'], [0.64, hit], [0.74, csK(RD, { tp: [-3, -9], R: 102, t1: 169, dy: 4 }), 'out'], [1, RD]];
  });
  CS_MODES.hammer = { prop: 'csHammer', N: 4, span: 0.84, hit: 0.56, keys: (i) => strikes[i], ev: 'strike',
    end: [[0, RD], [0.3, csK(RD, { tp: [-18, -15], R: 128, bh: [-12, -2], t1: 176, h: 21, n: 6, tw: 0.62, expr: 'happy' })], [0.75, csK(RD, { tp: [-18, -16], R: 130, bh: [-11, -3], t1: 177, h: 19, n: 5, tw: 0.62, expr: 'happy' })], [1, RD]] };
}
{
  // carving: five push cuts along the block, alternating lanes, then the dust is blown off
  const RD = { tp: [-9, -5], R: 68, bh: [-17, 1], t1: 171, t2: 5, n: 3, h: 17, dy: 4, dx: 5, tw: 0.75 };
  const cut = (lane) => [[0, RD], [0.3, csK(RD, { tp: [-13, -8 + lane], R: 74, t1: 173, dx: 3 })],
    [0.55, csK(RD, { tp: [7, -1 + lane], R: 54, t1: 166, t2: 7, dx: 7, h: 18 }), 'in'], [0.68, csK(RD, { tp: [8, -3 + lane], R: 56, t1: 167, dx: 7 })],
    [0.86, csK(RD, { tp: [-1, -12], R: 64 }), 'out'], [1, RD]];
  const cuts = [cut(-1.5), cut(1.5)];
  CS_MODES.carve = { prop: 'csKnife', N: 5, span: 0.86, hit: 0.55, keys: (i) => cuts[i % 2], ev: 'shave',
    end: [[0, RD], [0.35, csK(RD, { tp: [-15, -17], R: 96, n: 9, h: 21, t1: 167, dx: 7, bh: [-14, -2], expr: 'happy' })], [0.8, csK(RD, { tp: [-15, -18], R: 98, n: 9, h: 20, t1: 168, dx: 7, bh: [-14, -2], expr: 'happy' })], [1, RD]] };
}
{
  // sewing: three stitches (pierce, then a long pull of the thread up and away), then the cloth is smoothed
  const RD = { tp: [3, -7], R: 12, bh: [-14, 1], t1: 172, t2: 4, n: 2, h: 16, dy: 3, dx: 4, tw: 0.72 };
  const top = csK(RD, { tp: [24, -50], R: 168, t1: 178, t2: -2, h: 2, n: -2, dx: 2, st: 4 });
  const stitch = [[0, RD], [0.18, csK(RD, { tp: [2, -1], R: 8, t1: 170, h: 17 }), 'in'], [0.3, csK(RD, { tp: [6, -6], R: 40 })],
    [0.48, csK(RD, { tp: [16, -30], R: 140, t1: 175, t2: 1, h: 8, dx: 3 })], [0.62, top, 'out'], [0.74, top], [1, RD]];
  CS_MODES.sew = { prop: 'csNeedle', N: 3, span: 0.9, hit: 0.18, taut: 0.62, keys: () => stitch, ev: 'pierce',
    end: [[0, RD], [0.5, csK(RD, { tp: [10, -4], R: 30, bh: [-6, 0], h: 18, t1: 170 })], [1, RD]] };
}
{
  // grinding: the pestle circles in the mortar, then two pounds
  const RD = { tp: [-2, -3], R: 14, bh: [-15, -2], t1: 170, t2: 5, n: 3, h: 16, dy: 4, dx: 5, tw: 0.74 };
  const pound = csK(RD, { tp: [-2, -3], R: 12, t1: 166, dy: 7 });
  CS_MODES.grind = { prop: 'csPestle', N: 1, span: 0.66, keys: () => [[0, RD], [1, RD]], ev: null,
    cont: (k, u, t) => {
      if (u >= 0.66) return;
      const ph = (u / 0.66) * Math.PI * 2 * 3, c = Math.cos(ph), s = Math.sin(ph);
      k.tp = [k.tp[0] + c * 6, k.tp[1] + s * 1.6]; k.R += c * 7; k.t1 += c * 1.5; k.st = (k.st || 0) + c * 2.5; k.h += s;
    },
    pounds: [0.66 + 0.34 * 0.3, 0.66 + 0.34 * 0.6],
    end: [[0, RD], [0.18, csK(RD, { tp: [-3, -26], R: 6, t1: 175, dy: 2, h: 12 }), 'out'], [0.3, pound, 'in'],
      [0.48, csK(RD, { tp: [-3, -30], R: 4, t1: 176, h: 10, dy: 1 }), 'out'], [0.6, csK(pound, { t1: 165, dy: 8, expr: 'hurt' }), 'in'], [0.72, csK(pound, { t1: 166 })], [1, RD]] };
}
{
  // brushing: six strokes across the sheet, then a step back to admire it
  const RD = { tp: [-12, -7], R: 16, bh: [-17, 1], t1: 171, t2: 5, n: 3, h: 18, dy: 3, dx: 5, tw: 0.74 };
  const X = (i) => -10 + i * 4;
  const strokes = [0, 1, 2, 3, 4, 5].map((i) => [[0, csK(RD, { tp: [X(i) - 2, -7] })], [0.3, csK(RD, { tp: [X(i), -1], R: 20 }), 'in'],
    [0.62, csK(RD, { tp: [X(i) + 3, i % 2 ? -2 : 2], R: 8, t1: 169 })], [1, csK(RD, { tp: [X(i + 1) - 2, -7] })]]);
  CS_MODES.brush = { prop: 'csBrush', N: 6, span: 0.8, hit: 0.3, keys: (i) => strokes[i], ev: 'stroke',
    end: [[0, csK(RD, { tp: [X(6) - 2, -7] })], [0.4, csK(RD, { tp: [-12, -20], R: 40, h: 12, n: -2, t1: 175, expr: 'happy' })], [0.75, csK(RD, { tp: [-12, -21], R: 42, h: 11, n: -2, t1: 175, expr: 'happy' })], [1, RD]] };
}
// The pose at u for mode m (also used by the scene to know the beats).
function csKey(m, u) {
  let k;
  if (u < m.span) { const w = (u / m.span) * m.N, i = Math.min(m.N - 1, Math.floor(w)); k = keyPose(m.keys(i), w - i); if (m.hit != null) k.beat = [i, w - i]; }
  else k = keyPose(m.end, (u - m.span) / (1 - m.span));
  if (m.cont) m.cont(k, u);
  return k;
}
POSE_DRIVE.craft = (u, t, B, calm) => {
  const mode = csModeNow(), m = CS_MODES[mode], k = csKey(m, u);
  // the hammer's smear, on the strike only
  let smR = null;
  if (mode === 'hammer' && k.beat && k.beat[1] > 0.49 && k.beat[1] <= m.hit) smR = keyPose(m.keys(k.beat[0]), Math.max(0.48, k.beat[1] - 0.035)).R;
  const P = Object.assign({}, CS_BASE, { t1: k.t1, t2: k.t2, n: k.n, h: k.h, dy: k.dy, dx: k.dx, tw: k.tw, st: k.st || 0, ht: k.ht || 0, expr: k.expr, prop: m.prop, smR });
  const br = calm ? 0 : Math.sin(t * 2.2);
  P.t2 += br * 1.2; P.n -= br * 0.8;
  const tip = [CS_WK[0] + k.tp[0], CS_WK[1] + k.tp[1]], off = CS_GRIP[m.prop](k.R), grip = [tip[0] - off[0], tip[1] - off[1]];
  plantPose(P, B, { F: () => grip, B: () => [CS_WK[0] + k.bh[0], CS_WK[1] + k.bh[1]] });
  P.g = k.R - (P.aF[0] + P.aF[1]);
  return P;
};
DRIVE_SKILL.craft = ['arts', 3];
AV_EXT.skill.arts = 'craft';
POSES.craft = POSE_DRIVE.craft(0.02, 0, BODY, true);

/* ---------------------------------------------------------------- the workshop */
const CS_BOX = { x: 196, y: 58, h: 194 };
const CS_FLOOR = 246;
const CS_W = rigToSpot(CS_BOX, CS_WK);                 // the work spot on the bench, scene coordinates
const CS_TOP = Math.round(rigToSpot(CS_BOX, [0, CS_WK[1] + 2.5])[1]);   // the bench's top surface
const CS_GHOST = [392, 112];                           // where the item takes shape
const CS_RACK = { x: 610, w: 160, y: 188 };            // the shelf finished items land on
const csHash = (s) => { let h = 0; for (const c of s) h = (h * 31 + c.charCodeAt(0)) >>> 0; return h; };
const csPick = (id, list) => list[csHash(id) % list.length];
function csLook(a) {
  const o = Object.keys(a.out)[0], ins = Object.keys(a.in || {}), log = ins.find((k) => TREE_LOOK[k]);
  return {
    id: o, mode: csModeOf(a),
    wood: log ? TREE_LOOK[log].wood : '#d9b07a', bark: log ? TREE_LOOK[log].trunk : '#7a4f2c',
    cloth: csPick(o, ['#3f6aa8', '#7a3a4a', '#4a6a3a', '#5a4a7a', '#2f5a6a', '#8a5a2a']),
    herb: csPick(o, ['#8fd16a', '#c9a2ff', '#ffd36a', '#7fd0ff', '#ff8a7a']),
    metal: csPick(o, ['#cfd6e4', '#b8c8d8', '#d8c08a', '#a8b4ff']),
  };
}
function csBg() {
  const H = CS_FLOOR, T = CS_TOP;
  let s = `<defs>${spGrad('cs-wall', ['#8a5a36', '#6e4428'])}${spGrad('cs-sky', ['#7fc4ee', '#d4eef8', '#ffe8c4'])}${spGrad('cs-floor', ['#6a4428', '#4a2e1a'])}${spGlow('cs-lamp', '#ffcf7a')}
    <linearGradient id="cs-beam" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fff4d6" stop-opacity=".34"/><stop offset="1" stop-color="#fff4d6" stop-opacity="0"/></linearGradient>
    <clipPath id="cs-win"><circle cx="112" cy="112" r="66"/></clipPath></defs>`;
  // plank wall, a beam, the wainscot
  s += `<rect width="800" height="${H}" fill="url(#cs-wall)"/>`;
  for (let x = 0; x < 800; x += 38) s += `<path d="M${x} 0 V${H}" stroke="#4a2c18" stroke-width="2" opacity=".55"/><path d="M${x + 3} 0 V${H}" stroke="#fff" stroke-width="1" opacity=".05"/>`;
  { const r = sceneRng(31); for (let i = 0; i < 26; i++) s += `<ellipse cx="${(r() * 800).toFixed(0)}" cy="${(r() * (H - 20)).toFixed(0)}" rx="${(2 + r() * 3).toFixed(1)}" ry="${(4 + r() * 4).toFixed(1)}" fill="none" stroke="#4a2c18" stroke-width="1.2" opacity=".35"/>`; }
  s += `<rect y="22" width="800" height="16" fill="#4a2c18"/><rect y="22" width="800" height="3" fill="#fff" opacity=".08"/>`;
  s += `<rect y="${H - 46}" width="800" height="46" fill="#5a3820"/><rect y="${H - 46}" width="800" height="4" fill="#3a2212"/>`;
  // the round window: the village outside, roofs, the watch-fire, a leafy branch
  s += `<g clip-path="url(#cs-win)"><rect x="40" y="40" width="150" height="150" fill="url(#cs-sky)"/>${spCloud(90, 70, 0.55, '#fff', 0.85)}${spCloud(150, 88, 0.4, '#fff', 0.7)}
    <path d="M40 150 L80 112 L118 138 L160 104 L200 150Z" fill="#8fb3c8" opacity=".8"/><path d="M40 164 Q100 140 190 160 V190 H40Z" fill="#6f9a63"/>`;
  for (const [x, hh, c] of [[60, 18, '#c9673f'], [84, 26, '#d8c3a0'], [112, 16, '#c9673f'], [134, 22, '#d8c3a0'], [158, 14, '#c9673f']]) s += `<rect x="${x}" y="${170 - hh}" width="20" height="${hh}" fill="${c}"/><path d="M${x - 4} ${170 - hh} l14 -9 l14 9z" fill="#6a3a2a"/>`;
  s += `<g class="cs-branch"><path d="M200 60 Q150 70 120 58" stroke="#5a3a22" stroke-width="5" fill="none"/>${[[150, 58, '#3f8a48'], [130, 52, '#2f6b3a'], [168, 66, '#4c9a4e'], [118, 62, '#3f8a48']].map(([x, y, c]) => `<ellipse cx="${x}" cy="${y}" rx="11" ry="6" fill="${c}" transform="rotate(-20 ${x} ${y})"/>`).join('')}</g></g>`;
  s += `<circle cx="112" cy="112" r="66" fill="none" stroke="#3a2212" stroke-width="12"/><circle cx="112" cy="112" r="72" fill="none" stroke="#5a3820" stroke-width="3"/>`
    + `<path d="M112 46 V178 M46 112 H178 M66 66 L158 158" stroke="#3a2212" stroke-width="3" opacity="0"/><path d="M112 46 V178 M46 112 H178" stroke="#3a2212" stroke-width="4"/>`;
  // light falling from the window across the floor
  s += `<path class="cs-beam" d="M60 150 L170 92 L470 ${H + 60} L180 ${H + 60}Z" fill="url(#cs-beam)"/>`;
  // a shelf of jars and scrolls, top right
  s += `<rect x="560" y="74" width="220" height="8" fill="#4a2c18"/><rect x="570" y="82" width="6" height="14" fill="#3a2212"/><rect x="764" y="82" width="6" height="14" fill="#3a2212"/>`;
  for (const [x, w, h, c] of [[574, 18, 24, '#9fc6c0'], [598, 14, 30, '#c98a5a'], [620, 20, 20, '#d9c48a'], [706, 16, 26, '#7a9ac9'], [728, 22, 18, '#b06a5a']]) s += `<rect x="${x}" y="${74 - h}" width="${w}" height="${h}" rx="4" fill="${c}" stroke="#2a1608" stroke-width="2"/><rect x="${x + 2}" y="${74 - h - 4}" width="${w - 4}" height="5" fill="#6a4426" stroke="#2a1608" stroke-width="1.5"/>`;
  for (let i = 0; i < 3; i++) s += `<rect x="${648 + i * 16}" y="${56 - i * 0}" width="13" height="18" rx="2" fill="#efe2c2" stroke="#2a1608" stroke-width="1.6"/><rect x="${648 + i * 16}" y="62" width="13" height="4" fill="#b03a2a"/>`;
  // pegboard of hanging tools (they sway a little)
  s += `<rect x="470" y="58" width="78" height="96" fill="#7a5130" stroke="#3a2212" stroke-width="3"/>`;
  for (let i = 0; i < 4; i++) for (let j = 0; j < 5; j++) s += `<circle cx="${480 + i * 19}" cy="${68 + j * 19}" r="1.6" fill="#3a2212"/>`;
  s += `<g class="cs-hang a"><path d="M484 66 V74" stroke="#2a1608" stroke-width="1.5"/><path d="M478 74 h12 l-2 40 h-8z" fill="#cfd6e4" stroke="#2a1608" stroke-width="2"/><path d="M478 84 h12 M478 94 h12 M478 104 h12" stroke="#8a93a4" stroke-width="1"/></g>`;      // a saw blade
  s += `<g class="cs-hang b"><path d="M510 66 V72" stroke="#2a1608" stroke-width="1.5"/><rect x="507" y="72" width="6" height="32" fill="#8a5a2b" stroke="#2a1608" stroke-width="1.6"/><rect x="500" y="100" width="20" height="10" fill="#5d6470" stroke="#2a1608" stroke-width="1.8"/></g>`;   // a mallet
  s += `<g class="cs-hang c"><path d="M534 66 V72" stroke="#2a1608" stroke-width="1.5"/><circle cx="534" cy="86" r="11" fill="none" stroke="#c9a46a" stroke-width="4"/><circle cx="534" cy="86" r="6" fill="none" stroke="#a8844a" stroke-width="3"/></g>`;   // a coil of rope
  // the hanging paper lantern
  s += `<g class="cs-lantern"><path d="M430 38 V58" stroke="#2a1608" stroke-width="2"/><circle cx="430" cy="78" r="60" fill="url(#cs-lamp)" class="cs-lampglow"/><ellipse cx="430" cy="78" rx="15" ry="19" fill="#d8402a" stroke="#2a1608" stroke-width="2.4"/>`
    + `<path d="M416 72 h28 M416 84 h28" stroke="#8a2414" stroke-width="1.4"/><rect x="423" y="57" width="14" height="4" fill="#2a1608"/><rect x="423" y="95" width="14" height="4" fill="#2a1608"/><ellipse cx="426" cy="74" rx="4" ry="8" fill="#ffd0a0" opacity=".45"/></g>`;
  // the floor
  s += `<rect y="${H}" width="800" height="${320 - H}" fill="url(#cs-floor)"/>`;
  for (const y of [H + 18, H + 42, H + 66]) s += `<path d="M0 ${y} H800" stroke="#2a1608" stroke-width="1.6" opacity=".45"/>`;
  { const r = sceneRng(5); for (let i = 0; i < 14; i++) { const x = r() * 800, y = H + 4 + r() * 70; s += `<path d="M${x.toFixed(0)} ${y.toFixed(0)} v${(10 + r() * 10).toFixed(0)}" stroke="#2a1608" stroke-width="1.4" opacity=".35"/>`; } }
  // the workbench: thick top, legs, a stretcher with stock on it
  const bx0 = 282, bx1 = 482;
  s += `<rect x="${bx0 + 10}" y="${T + 8}" width="10" height="${H + 6 - T - 8}" fill="#5a3820" stroke="#2a1608" stroke-width="2"/><rect x="${bx1 - 20}" y="${T + 8}" width="10" height="${H + 6 - T - 8}" fill="#5a3820" stroke="#2a1608" stroke-width="2"/>`;
  s += `<rect x="${bx0 + 10}" y="${H - 18}" width="${bx1 - bx0 - 20}" height="7" fill="#4a2c18" stroke="#2a1608" stroke-width="2"/>`;
  s += `<ellipse cx="${bx0 + 52}" cy="${H - 24}" rx="7" ry="6" fill="#e6c08a" stroke="#2a1608" stroke-width="1.6"/><rect x="${bx0 + 52}" y="${H - 30}" width="30" height="12" fill="#7a4f2c" stroke="#2a1608" stroke-width="1.6"/><ellipse cx="${bx0 + 82}" cy="${H - 24}" rx="5" ry="6" fill="#e6c08a" stroke="#2a1608" stroke-width="1.6"/>`;
  s += `<path d="M${bx1 - 70} ${H - 18} l8 -10 h22 l8 10z" fill="#9aa3b5" stroke="#2a1608" stroke-width="1.6"/><path d="M${bx1 - 96} ${H - 18} l6 -8 h16 l6 8z" fill="#c9a24a" stroke="#2a1608" stroke-width="1.6"/>`;
  s += `<ellipse cx="${(bx0 + bx1) / 2}" cy="${H + 8}" rx="${(bx1 - bx0) / 2 + 6}" ry="7" fill="#000" opacity=".25"/>`;
  s += `<rect x="${bx0}" y="${T}" width="${bx1 - bx0}" height="11" fill="#9a6a3e" stroke="#2a1608" stroke-width="2.4"/><rect x="${bx0}" y="${T}" width="${bx1 - bx0}" height="3" fill="#c9965e"/><path d="M${bx0 + 60} ${T + 6} h50 M${bx0 + 130} ${T + 8} h40" stroke="#6a4426" stroke-width="1.2"/>`;
  // on the bench, out of the way: a pot of nails, a coil of thread, an ink stone
  s += `<rect x="${bx1 - 40}" y="${T - 12}" width="14" height="12" fill="#5d6470" stroke="#2a1608" stroke-width="1.6"/><ellipse cx="${bx1 - 18}" cy="${T - 4}" rx="7" ry="4" fill="#d9c48a" stroke="#2a1608" stroke-width="1.4"/>`;
  // the finished-goods rack on the right (items land on its shelf)
  const R = CS_RACK;
  s += `<rect x="${R.x}" y="${R.y + 4}" width="${R.w}" height="9" fill="#4a2c18" stroke="#2a1608" stroke-width="2"/><rect x="${R.x + 6}" y="${R.y + 13}" width="7" height="${H - R.y - 7}" fill="#3a2212"/><rect x="${R.x + R.w - 13}" y="${R.y + 13}" width="7" height="${H - R.y - 7}" fill="#3a2212"/>`;
  s += `<rect x="${R.x}" y="${H - 34}" width="${R.w}" height="8" fill="#4a2c18" stroke="#2a1608" stroke-width="2"/>`;
  s += `<rect x="${R.x + 14}" y="${H - 58}" width="34" height="24" fill="#b07a44" stroke="#2a1608" stroke-width="2"/><path d="M${R.x + 14} ${H - 46} h34 M${R.x + 31} ${H - 58} v24" stroke="#7a4f2c" stroke-width="1.6"/>`;   // a crate
  // a teacup on the rack, steaming
  s += `<path d="M${R.x + R.w - 44} ${R.y - 8} h14 l-2 12 h-10z" fill="#e8e2d2" stroke="#2a1608" stroke-width="1.6"/>`;
  return s;
}
// The work on the bench, by mode, as it progresses (k: 0..1 of the current item; n: beats done).
function csWorkSVG(look, k, n) {
  const [x, y] = CS_W, T = CS_TOP, f = (v) => v.toFixed(1);
  let s = '';
  switch (look.mode) {
    case 'hammer': {   // a bench anvil and a bar that is drawn out longer with each strike
      s += `<path d="M${f(x - 20)} ${T} l5 -5 h28 l5 5z" fill="#3a3f4a" stroke="${OL}" stroke-width="1.6"/><path d="M${f(x - 16)} ${T - 5} v-6 h40 q-6 4 -10 6z" fill="#4d5361" stroke="${OL}" stroke-width="1.6"/>`;
      const L = 18 + 14 * k;
      s += `<rect x="${f(x - 8)}" y="${f(T - 15)}" width="${f(L)}" height="4.5" rx="1.5" fill="${look.metal}" stroke="${OL}" stroke-width="1.4"/>`;
      s += `<rect class="cs-heat" x="${f(x - 8)}" y="${f(T - 15)}" width="${f(L)}" height="4.5" rx="1.5" fill="#ff8a2a" opacity="0"/>`;
      break;
    }
    case 'carve': {    // a block that loses its corners, shavings gathering beside it
      const w = 30 - 9 * k, h = 14 - 3 * k, cut = 1 + 5 * k;
      s += `<path d="M${f(x - 10)} ${T} V${f(T - h + cut)} L${f(x - 10 + cut)} ${f(T - h)} H${f(x - 10 + w - cut)} L${f(x - 10 + w)} ${f(T - h + cut)} V${T}Z" fill="${look.wood}" stroke="${OL}" stroke-width="1.6"/>`;
      s += `<path d="M${f(x - 6)} ${f(T - h + 4)} h${f(w - 10)}" stroke="${shade(look.wood, -0.25)}" stroke-width="1" opacity=".7"/>`;
      for (let i = 0; i < Math.min(9, Math.round(k * 9)); i++) s += `<path d="M${f(x + 26 + (i % 3) * 6)} ${f(T - 1 - Math.floor(i / 3) * 2.5)} a2.6,2 0 1,1 2.6,2" fill="none" stroke="${look.wood}" stroke-width="1.8"/>`;
      break;
    }
    case 'sew': {      // a folded cloth on the bench, a row of stitches growing along it
      s += `<path d="M${f(x - 16)} ${T} l3 -7 h36 l4 7z" fill="${look.cloth}" stroke="${OL}" stroke-width="1.6"/><path d="M${f(x - 13)} ${T - 7} l3 -4 h30 l3 4z" fill="${shade(look.cloth, 0.18)}" stroke="${OL}" stroke-width="1.4"/>`;
      for (let i = 0; i < Math.min(12, n); i++) s += `<path d="M${f(x - 10 + i * 2.6)} ${T - 4} l1.6 0" stroke="#fff4d6" stroke-width="1.4"/>`;
      s += `<circle cx="${f(x - 26)}" cy="${T - 4}" r="4" fill="#e6d2a2" stroke="${OL}" stroke-width="1.4"/>`;   // the spool
      break;
    }
    case 'grind': {    // a stone mortar; the powder takes the herb's colour as it is ground
      const c = mixHex('#8a7a5a', look.herb, Math.min(1, k * 1.2));
      s += `<path d="M${f(x - 13)} ${T - 13} h26 l-4 13 h-18z" fill="#8a8478" stroke="${OL}" stroke-width="1.8"/><ellipse cx="${f(x)}" cy="${T - 13}" rx="13" ry="3.6" fill="#5a554c" stroke="${OL}" stroke-width="1.6"/><ellipse cx="${f(x)}" cy="${T - 12.5}" rx="9.5" ry="2.4" fill="${c}"/>`;
      for (let i = 0; i < 3; i++) s += `<ellipse cx="${f(x + 22 + i * 6)}" cy="${T - 2}" rx="3" ry="2" fill="${look.herb}" stroke="${OL}" stroke-width="1"/>`;
      break;
    }
    case 'brush': {    // a sheet laid flat; the brushwork grows stroke by stroke, then the red seal
      s += `<path d="M${f(x - 18)} ${T} l3 -4 h40 l3 4z" fill="#f4ead2" stroke="${OL}" stroke-width="1.4"/>`;
      for (let i = 0; i < Math.min(6, n); i++) s += `<path d="M${f(x - 12 + i * 4)} ${T - 2.8} l3 ${i % 2 ? -0.6 : 0.8}" stroke="#1a1410" stroke-width="1.6" stroke-linecap="round"/>`;
      if (k > 0.88) s += `<rect x="${f(x + 18)}" y="${T - 3.6}" width="4" height="2.4" fill="#c8202a"/>`;
      s += `<rect x="${f(x + 30)}" y="${T - 5}" width="12" height="5" fill="#2a2a30" stroke="${OL}" stroke-width="1.2"/>`;   // the ink stone
      break;
    }
  }
  return s;
}
function csRackHTML() {
  const list = (SPOT.csRack || []).slice(0, 4);
  return list.map((e, i) => `<div class="cs-item ${e.fresh ? 'fresh' : ''} ${e.gold ? 'gold' : ''}" style="left:${((CS_RACK.x + 22 + i * 36) / 8).toFixed(2)}%;top:${((CS_RACK.y - 15) / 3.2).toFixed(2)}%"><span class="tile-art">${itemIc(e.id)}</span></div>`).join('');
}
function craftHTML() {
  const a = S.action && S.action.skill === 'arts' ? findAction('arts', S.action.id) : null;
  const sel = a || (typeof wsSelected === 'function' ? wsSelected('arts') : null) || SKILLS.arts.actions[0];
  const look = csLook(sel);
  CS_PREVIEW = look.mode;
  SPOT.craft = { look, k: -1, n: -1, sig: '' };
  const last = SPOT.last_arts, verb = { hammer: 'Forging', carve: 'Carving', sew: 'Sewing', grind: 'Grinding', brush: 'Brushing' }[look.mode];
  const cat = S.pets && S.pets.scroll_cat ? `<div class="cs-cat" style="left:${((CS_RACK.x + CS_RACK.w - 70) / 8).toFixed(2)}%;top:${((CS_FLOOR - 58) / 3.2).toFixed(2)}%"><svg viewBox="0 0 40 24"><path class="cs-tail" d="M33 18 q8 -2 6 -12" fill="none" stroke="#e8a04a" stroke-width="3.4" stroke-linecap="round"/><ellipse cx="20" cy="17" rx="14" ry="7" fill="#e8a04a" stroke="#2a1608" stroke-width="1.6"/><circle cx="8" cy="12" r="6" fill="#e8a04a" stroke="#2a1608" stroke-width="1.6"/><path d="M3 8 l1 -5 l3 3 M9 6 l3 -4 l1 5" fill="#e8a04a" stroke="#2a1608" stroke-width="1.4"/><path d="M5 12 q1.5 1 3 0" stroke="#2a1608" stroke-width="1.2" fill="none"/></svg></div>` : '';
  const bar = a ? spotStats('arts')
    : `<div class="spot-idle">${ui(S.action ? 'info' : 'play')}<span>${S.action ? `Busy with <b>${esc(SKILLS[S.action.skill].name)} · ${esc(findAction(S.action.skill, S.action.id).name)}</b>. Pick a recipe to switch.` : 'Pick a recipe to start crafting at the bench.'}</span></div>`;
  return `<section class="win spot-win" style="--rc:${rc('shinobi')}">
    <div class="spot sp-craft ${a ? 'on' : ''}" data-spot="arts" data-mode="${look.mode}">
      <svg class="spot-bg" viewBox="0 0 800 320" preserveAspectRatio="none" aria-hidden="true">${csBg()}</svg>
      <div class="cs-motes">${'<i></i>'.repeat(6)}</div>
      <svg class="spot-bg cs-work" viewBox="0 0 800 320" preserveAspectRatio="none" aria-hidden="true"><g data-cswork></g></svg>
      ${spotAvatar(CS_BOX, a ? 'craft' : '')}
      <div class="cs-rack">${csRackHTML()}</div>${cat}
      <svg class="spot-fx" viewBox="0 0 800 320" preserveAspectRatio="none" aria-hidden="true"><defs><filter id="sp-soft" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="2.4"/></filter></defs><g data-spotfx></g><g data-parts></g></svg>
      <div class="cs-ghost" style="left:${(CS_GHOST[0] / 8).toFixed(2)}%;top:${(CS_GHOST[1] / 3.2).toFixed(2)}%" ${a ? '' : 'hidden'}><i class="cs-halo"></i><span class="tile-art cs-dim">${itemIc(look.id)}</span><span class="tile-art cs-fill">${itemIc(look.id)}</span></div>
      <div class="spot-pops"></div>
      <div class="spot-hud"><span class="sh-name"><small>Village workshop${a ? ' · ' + verb : ''}</small><b>${esc(a ? a.name : 'The bench is free')}</b></span>${last ? `<span class="sh-last">${last}</span>` : '<span class="sh-last" hidden></span>'}</div>
    </div>
    <div class="spot-bar">${bar}</div>
  </section>`;
}
UIX.realmScene.push((realm, skill) => (skill === 'arts' ? craftHTML() : ''));

/* ---------------------------------------------------------------- per-frame */
// Beats of the current mode (in cycle progress u): where a strike lands, a cut ends, a stitch pierces.
function csBeats(mode) {
  const m = CS_MODES[mode];
  if (mode === 'grind') return m.pounds.map((u, i) => [u, 'pound', i]);
  const out = [];
  for (let i = 0; i < m.N; i++) out.push([((i + m.hit) / m.N) * m.span, m.ev, i]);
  if (mode === 'sew') for (let i = 0; i < m.N; i++) out.push([((i + m.taut) / m.N) * m.span, 'taut', i]);
  return out;
}
function csBeat(el, C, kind, i, rig) {
  const r = Math.random, L = C.look, tip = rig && rig.tool ? rigToSpot(CS_BOX, rig.tool) : CS_W, [x, y] = tip;
  if (kind === 'strike') {
    const heavy = i === CS_MODES.hammer.N - 1;
    partAdd({ kind: 'flash', x, y: y - 2, life: heavy ? 0.2 : 0.12, g: 0 });
    for (let k = 0; k < (heavy ? 12 : 6); k++) partAdd({ kind: 'spark', x: x + (r() - 0.5) * 6, y: y - 2, vx: (r() - 0.5) * 320, vy: -60 - r() * 220, g: 700, life: 0.35 + r() * 0.35, floor: CS_TOP - 1 });
    C.heat = 1;
    if (heavy) retrigger(el, 'thud');
  } else if (kind === 'shave') {
    for (let k = 0; k < 2; k++) partAdd({ kind: 'curl', x: x + 2, y: y - 3, vx: 40 + r() * 80, vy: -90 - r() * 80, vr: 500 + r() * 400, g: 600, col: L.wood, life: 1.2, floor: CS_TOP - 1 });
    partAdd({ kind: 'chip', x, y: y - 2, vx: 30 + r() * 60, vy: -60, vr: 300, w: 2.5, h: 1.5, col: shade(L.wood, -0.1), life: 0.9, floor: CS_TOP - 1 });
  } else if (kind === 'taut') {
    partAdd({ kind: 'glint', x, y, g: 0, life: 0.35, size: 6, r: 15 });
  } else if (kind === 'pound') {
    partAdd({ kind: 'flash', x: CS_W[0], y: CS_TOP - 14, life: 0.12, g: 0 });
    for (let k = 0; k < 2; k++) partAdd({ kind: 'puff', x: CS_W[0] + (k - 0.5) * 12, y: CS_TOP - 16, vx: (k - 0.5) * 30, vy: -18, g: 0, size: 4, life: 0.9 });
    for (let k = 0; k < 5; k++) partAdd({ kind: 'mote', x: CS_W[0] + (r() - 0.5) * 14, y: CS_TOP - 15, vx: (r() - 0.5) * 60, vy: -40 - r() * 40, g: 60, size: 1.4, col: L.herb, life: 0.9 });
    if (i === 1) retrigger(el, 'thud');
  } else if (kind === 'stroke') {
    if (r() < 0.5) partAdd({ kind: 'chip', x, y: y - 1, vx: (r() - 0.5) * 40, vy: -50, vr: 0, w: 1.6, h: 1.6, col: '#1a1410', life: 0.5, floor: CS_TOP - 2 });
  }
}
UPD.push(() => {
  const el = spotNow();
  if (!el || el.dataset.spot !== 'arts') return;
  const k = actFrac('arts'), C = SPOT.craft, av = el.querySelector('.spot-av svg.avatar');
  el.classList.toggle('on', k >= 0);
  setPose(av, k >= 0 ? 'craft' : '');
  if (!C) return;
  const work = el.querySelector('[data-cswork]'), fx = el.querySelector('[data-spotfx]'), ghost = el.querySelector('.cs-ghost');
  const mode = C.look.mode, m = CS_MODES[mode], t = performance.now() / 1000;
  const u = k >= 0 ? driveU('craft', t) : 0;
  // beats done this cycle (stitches sewn, strokes brushed), for the work on the bench
  const n = k < 0 ? 0 : m.hit == null ? 0 : Math.min(m.N, Math.floor((u / m.span) * m.N + (1 - m.hit)));
  const sig = `${k < 0 ? -1 : Math.round(k * 24)}:${n}`;
  if (work && sig !== C.sig) {
    C.sig = sig;
    work.innerHTML = csWorkSVG(C.look, Math.max(0, k), mode === 'sew' ? n * 4 : n);
    C.n = n; C.heatEl = work.querySelector('.cs-heat');
  }
  // the bar glows after each strike and cools
  if (C.heatEl) { C.heat = Math.max(0, (C.heat || 0) - 0.03); C.heatEl.setAttribute('opacity', (C.heat * 0.85).toFixed(2)); }
  // the item takes shape above the bench as the work goes on
  if (ghost) {
    ghost.hidden = k < 0;
    if (k >= 0) ghost.style.setProperty('--k', Math.min(1, k * 1.04).toFixed(3));
  }
  // the thread, from the needle's eye to the cloth
  const rig = av && SPOT_RIG[av.dataset.uid];
  if (fx) {
    if (k >= 0 && mode === 'sew' && rig && rig.eye) {
      const [ex, ey] = rigToSpot(CS_BOX, rig.eye), [cx, cy] = [CS_W[0] + 2, CS_TOP - 5];
      const tight = u < m.span && (((u / m.span) * m.N) % 1) > 0.56 && (((u / m.span) * m.N) % 1) < 0.78;
      const sag = tight ? 0 : 10;
      fx.innerHTML = `<path d="M${ex.toFixed(1)} ${ey.toFixed(1)} Q${((ex + cx) / 2 - 4).toFixed(1)} ${(Math.max(ey, cy) + sag).toFixed(1)} ${cx.toFixed(1)} ${cy.toFixed(1)}" fill="none" stroke="#fff4d6" stroke-width="1.2" opacity=".9"/>`;
    } else if (fx.innerHTML) fx.innerHTML = '';
  }
  if (k < 0) { C.u = null; return; }
  // beats crossed since the last frame
  const prev = C.u;
  C.u = u;
  if (prev != null && u > prev && u - prev < 0.3) for (const [bu, kind, i] of csBeats(mode)) if (prev < bu && u >= bu) csBeat(el, C, kind, i, rig);
  // grinding: a little dust rises while the pestle turns
  if (mode === 'grind' && u < 0.66 && Math.random() < 0.06) partAdd({ kind: 'mote', x: CS_W[0] + (Math.random() - 0.5) * 16, y: CS_TOP - 14, vx: (Math.random() - 0.5) * 20, vy: -20, g: -10, size: 1.3, col: C.look.herb, life: 1 });
});
// Done: the item pops out of the light above the bench, then flies onto the rack.
on('quality', (d) => { if (d.skill === 'arts' && d.q === 'p') SPOT.csPerfect = performance.now(); });
on('action', (d) => {
  if (d.skill !== 'arts') return;
  const id = Object.keys(d.act.out || {})[0], it = id && ITEMS[id];
  if (!it) return;
  const perfect = SPOT.csPerfect && performance.now() - SPOT.csPerfect < 400;
  setLast('arts', `<small>${perfect ? 'Perfect craft' : 'Last craft'}</small><b>${esc(it.name)}</b><em>${fmt(familyCount(id))} owned</em>`);
  const el = spotNow();
  if (!el || el.dataset.spot !== 'arts' || !SPOT.craft) return;
  const n = d.gains[id] || 1, m = spotPx(), [gx, gy] = CS_GHOST, r = Math.random;
  const rack = SPOT.csRack = SPOT.csRack || [];
  const land = () => {
    rack.unshift({ id, gold: perfect, fresh: 1 });
    rack.length = Math.min(rack.length, 4);
    const box = el.querySelector('.cs-rack');
    if (box && box.isConnected) box.innerHTML = csRackHTML();
    rack.forEach((e) => { e.fresh = 0; });
  };
  const calm = avCalm();
  for (let j = 0; j < Math.min(2, n); j++) {
    const p = calm ? null : spotPop(`<i><span class="tile-art">${itemIc(id)}</span></i>`, gx, gy, 'cs-made' + (perfect ? ' gold' : ''), 1500);
    if (p) {
      p.style.animationDelay = p.firstChild.style.animationDelay = `${j * 0.18}s`;
      p.style.setProperty('--dx', ((CS_RACK.x + 22 - gx) * m).toFixed(0) + 'px');
      p.firstChild.style.setProperty('--dy', ((CS_RACK.y - 15 - gy) * m).toFixed(0) + 'px');
    }
  }
  setTimeout(land, calm ? 0 : 1250);
  for (let k = 0; k < 6; k++) partAdd({ kind: 'glint', x: gx + (r() - 0.5) * 70, y: gy + (r() - 0.5) * 60, g: 0, life: 0.5 + r() * 0.3, size: 4 + r() * 4, r: r() * 45, col: perfect ? '#ffe27a' : '#fff' });
  spotPop(`<b>+${fmt(n)} ${esc(it.name)}</b>`, gx + 40, gy + 50, 'tag' + (perfect ? ' gold' : ''), 1600);
  if (perfect) {
    spotPop('<i class="cs-rays"></i>', gx, gy, 'cs-raybox', 1600);
    spotPop(`${ui('star')}Perfect!`, 400, 54, 'banner perfect', 2200);
    retrigger(el, 'thud');
  }
  // the next piece goes on the bench
  if (SPOT.craft) { SPOT.craft.sig = ''; SPOT.craft.u = null; }
});
// A rare find while crafting: a small gold tag over the bench.
on('rare', (d) => {
  if (d.source !== 'Crafting' || !ITEMS[d.id]) return;
  const el = spotNow();
  if (el && el.dataset.spot === 'arts') spotPop(`<small>${ui('rare')}Rare find</small><b>${esc(ITEMS[d.id].name)}</b>`, CS_W[0], CS_TOP - 70, 'tag gold', 2200);
});
