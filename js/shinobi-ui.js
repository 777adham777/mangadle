'use strict';
/* ==========================================================================
   TRI-REALM IDLE — Leaf Village: the woodcutting scene
   Your avatar chops a tree in a clearing above the hidden village. The tree
   changes with the wood you cut, chips fly on every swing, a notch grows in
   the trunk as the log comes loose, and your logs pile up beside you.
   Loaded after seas-ui.js (reuses its scene block: spotAvatar, spotStats,
   spotPop, setLast, SPOT_RIG).
   ========================================================================== */

/* ================================================================ the axe */
// The swing itself is a driven cycle (POSE_DRIVE.wood, avatar.js). A scene avatar records where
// its blade bites (the middle of the cutting edge, rig coordinates), like the rod tip and the pan.
{
  const baseAxe = axeSVG;
  axeSVG = function (hand, a, t, P) {
    if (SPOT_CUR) SPOT_CUR.axe = add(add(hand, a, 46), a - 90, 27);
    return baseAxe(hand, a, t, P);
  };
}

/* ================================================================ trees */
// One look per log: trunk, bark lines, leaves and the shape of the crown.
const TREE_LOOK = {
  pine_log:    { trunk: '#7a4f2c', bark: '#4e3019', leaf: ['#2f6b3a', '#3f8a48'], crown: 'pine', wood: '#ecc994' },
  cedar_log:   { trunk: '#8c4a2a', bark: '#5a2a14', leaf: ['#2d5e36', '#4c8a3e'], crown: 'pine', wide: 1, wood: '#e9b98a' },
  bamboo:      { trunk: '#79c04f', bark: '#3f7a2a', leaf: ['#5fae3f', '#9ad86a'], crown: 'bamboo', wood: '#e2ecb0' },
  mistwood:    { trunk: '#6b6f7a', bark: '#41444d', leaf: ['#5d8a86', '#8fbab4'], crown: 'round', mist: 1, wood: '#dcd6c8' },
  ironwood:    { trunk: '#3d3a3a', bark: '#1f1d1d', leaf: ['#3a5432', '#5a7a44'], crown: 'round', wood: '#b8946c' },
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
  try { drawAvatar(A, POSE_DRIVE.wood((i + WOOD_HIT) / WOOD_SWINGS, 0, cosOf('build', A.build).b, true), 0, { uid: '__probe' }); } catch (e) { /* rig busy */ }
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
  // the crown, cut by the top of the frame
  const [a, b] = L.leaf;
  if (L.crown === 'pine') {
    const k = L.wide ? 1.25 : 1;
    s += wPine(cx, 118, 270 * k, 150, a) + wPine(cx, 46, 220 * k, 140, a) + wPine(cx - 6, 110, 170 * k, 86, b) + wPine(cx - 4, 36, 130 * k, 80, b);
  } else if (L.crown === 'bamboo') {
    s += `<rect x="${x0 + w + 60}" y="-10" width="${w * 0.6}" height="${WOOD_GROUND + 10}" fill="${L.trunk}" opacity=".7"/><rect x="${x0 - 90}" y="-10" width="${w * 0.5}" height="${WOOD_GROUND - 20}" fill="${L.trunk}" opacity=".55"/>`;
    for (let i = 0; i < 9; i++) s += `<path d="M${cx + (i - 4) * 26} ${10 + (i % 3) * 18} q${i % 2 ? 50 : -50} -6 ${i % 2 ? 80 : -80} 14 q${i % 2 ? -40 : 40} 2 ${i % 2 ? -80 : 80} -14Z" fill="${i % 2 ? a : b}"/>`;
  } else {
    s += wBlob(cx - 70, 30, 70, a) + wBlob(cx + 70, 26, 74, a) + wBlob(cx, -10, 90, a) + wBlob(cx - 30, 20, 50, b) + wBlob(cx + 40, 6, 46, b);
  }
  return s;
}
function woodBg(look, hit) {
  const L = TREE_LOOK[look] || TREE_LOOK.pine_log, H = 190;
  const x0 = Math.round(hit[0] - 6), w = L.crown === 'bamboo' ? 40 : 74;
  let s = `<defs>${spGrad('wc-sky', ['#6fb8ea', '#bfe4f6', '#ffe6bf'])}${spGrad('wc-hill', ['#6f9a63', '#4c7448'])}${spGlow('wc-sun', '#fff2c8')}${spGlow('wc-glow', L.glow || '#fff')}</defs>`;
  s += `<rect width="800" height="${H + 2}" fill="url(#wc-sky)"/><circle cx="130" cy="58" r="90" fill="url(#wc-sun)"/><circle cx="130" cy="58" r="26" fill="#fff6d6"/>`;
  s += spClouds(23, 5, 26, 110, '#ffffff', 0.8);
  // far mountains and the hidden village in the valley
  s += `<path d="M0 ${H - 40} L90 ${H - 96} L170 ${H - 52} L260 ${H - 120} L360 ${H - 50} L470 ${H - 104} L560 ${H - 46} L660 ${H - 90} L800 ${H - 40} V${H}H0Z" fill="#8fb3c8" opacity=".75"/>`;
  s += `<path d="M0 ${H - 10} Q120 ${H - 46} 240 ${H - 22} Q380 ${H - 54} 520 ${H - 20} Q660 ${H - 44} 800 ${H - 14} V${H + 4} H0Z" fill="url(#wc-hill)"/>`;
  for (const [x, hh, c] of [[470, 22, '#c9673f'], [500, 30, '#d8c3a0'], [532, 18, '#c9673f'], [556, 26, '#d8c3a0']]) s += `<rect x="${x}" y="${H - 12 - hh}" width="22" height="${hh}" fill="${c}"/><path d="M${x - 4} ${H - 12 - hh} l15 -10 l15 10z" fill="#6a3a2a"/>`;
  s += `<rect x="512" y="${H - 66}" width="5" height="30" fill="#6a3a2a"/><circle cx="514" cy="${H - 70}" r="5" fill="#ff7a1a"/>`;   // the village watch-fire
  { const r = sceneRng(9); for (let i = 0; i < 22; i++) { const x = Math.round(r() * 800), hh = 30 + r() * 40; if (Math.abs(x - hit[0]) > 70) s += wPine(x, H + 8, hh * 0.7, hh, '#3d6b45'); } }
  // the clearing
  s += `<rect y="${H}" width="800" height="${320 - H}" fill="#6a8f4a"/><path d="M0 ${WOOD_GROUND - 6} Q200 ${WOOD_GROUND - 18} 400 ${WOOD_GROUND - 8} T800 ${WOOD_GROUND - 6} V320 H0Z" fill="#557a3b"/>`;
  { const r = sceneRng(4); for (let i = 0; i < 40; i++) { const x = Math.round(r() * 800), y = Math.round(WOOD_GROUND - 4 + r() * 66); s += `<path d="M${x} ${y} l3 -9 l2 9 l3 -7 l1 7" stroke="#3f6a2c" stroke-width="2" fill="none"/>`; } }
  if (L.mist) s += `<rect y="${H - 30}" width="800" height="80" fill="#e6f2f0" opacity=".25"/>`;
  s += `<g class="wc-tree">${treeSVG(L, x0, w)}</g>`;
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
  const last = SPOT.last_woodcutting;
  return `<section class="win spot-win" style="--rc:${rc('shinobi')}">
    <div class="spot sp-wood ${a ? 'on' : ''}" data-spot="woodcutting">
      <svg class="spot-bg" viewBox="0 0 800 320" preserveAspectRatio="none" aria-hidden="true">${woodBg(look, hit)}<g data-pile>${logPile(look)}</g></svg>
      ${spotAvatar(WOOD_BOX, a ? 'chopUp' : '')}
      <svg class="spot-fx" viewBox="0 0 800 320" preserveAspectRatio="none" aria-hidden="true"><defs><filter id="sp-soft" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="2.4"/></filter></defs><g data-spotfx></g><g data-parts></g></svg>
      ${TREE_LOOK[look] && TREE_LOOK[look].petals ? '<div class="wc-petals"><i></i><i></i><i></i><i></i><i></i><i></i></div>' : ''}
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
// chips burst out of the cut and tumble to the grass, bark flakes fall, leaves drift down.
const WC_DEPTH = [4, 13, 24];
function wcNotch(W, depth) {
  const [h0, h1] = W.hits, x = W.hit[0] - 6, top = h0[1] - 9 - depth * 0.3, bot = h1[1] + 5, mid = (h0[1] + h1[1]) / 2 + 1;
  const L = TREE_LOOK[W.look] || TREE_LOOK.pine_log, c = L.wood || '#ecc994', f = (v) => v.toFixed(1);
  return `<path d="M${f(x)} ${f(top)} L${f(x + depth)} ${f(mid)} L${f(x)} ${f(mid)}Z" fill="${c}"/>`
    + `<path d="M${f(x)} ${f(mid)} L${f(x + depth)} ${f(mid)} L${f(x)} ${f(bot)}Z" fill="${shade(c, -0.22)}"/>`
    + `<path d="M${f(x)} ${f(top)} L${f(x + depth)} ${f(mid)} L${f(x)} ${f(bot)}" fill="none" stroke="#3a2210" stroke-width="2.2" stroke-linejoin="round"/>`
    + `<path d="M${f(x + depth * 0.25)} ${f(top + (mid - top) * 0.3)} l${f(depth * 0.4)} ${f((mid - top) * 0.35)}" stroke="#fff" stroke-width="1.2" opacity=".35"/>`;
}
function wcImpact(el, W, i) {
  const L = TREE_LOOK[W.look] || TREE_LOOK.pine_log, [hx, hy] = W.hits[i], r = Math.random;
  retrigger(el.querySelector('.wc-tree'), 'hit');
  retrigger(el, 'thud');
  partAdd({ kind: 'flash', x: hx + 2, y: hy, life: 0.16, g: 0 });
  // chips fly out of the cut, mostly back towards the axeman and up, and tumble as they fall
  for (let k = 0; k < 7; k++) partAdd({ kind: 'chip', x: hx + 2, y: hy + r() * 6 - 3, vx: -60 - r() * 220 + (k === 0 ? 260 : 0), vy: -120 - r() * 260,
    vr: (r() - 0.5) * 1400, w: 5 + r() * 5, h: 2.5 + r() * 2, col: L.wood || '#ecc994', life: 1.4 + r() * 0.8, floor: WOOD_GROUND + 6 + r() * 40 });
  for (let k = 0; k < 2; k++) partAdd({ kind: 'chip', x: hx, y: hy - 4, vx: -30 - r() * 90, vy: -40 - r() * 80,
    vr: (r() - 0.5) * 600, w: 6, h: 3.5, col: L.bark, life: 1.4, floor: WOOD_GROUND + 10 + r() * 30 });
  // the crown shakes loose a leaf or two (or petals)
  const n = 1 + (r() < 0.6 ? 1 : 0);
  for (let k = 0; k < n; k++) partAdd({ kind: 'leaf', x: W.hit[0] + 30 + (r() - 0.5) * 220, y: 30 + r() * 60, vx: (r() - 0.5) * 30, vy: 10,
    vr: (r() - 0.5) * 200, col: L.petals || L.leaf[k % 2], life: 4.5, g: 0, floor: WOOD_GROUND + 10 + r() * 40, seed: r() * 6 });
}
UPD.push(() => {
  const el = spotNow();
  if (!el || el.dataset.spot !== 'woodcutting') return;
  const k = actFrac('woodcutting'), av = el.querySelector('.spot-av svg.avatar'), g = el.querySelector('[data-spotfx]');
  el.classList.toggle('on', k >= 0);
  setPose(av, k >= 0 ? 'wood' : '');
  const W = SPOT.wood;
  if (!W || !g) return;
  if (k < 0) { if (g.innerHTML) g.innerHTML = ''; SPOT.wcV = null; return; }
  // where the swing is: which of the two swings, and how far into it
  const u = driveU('wood', performance.now() / 1000) * WOOD_SWINGS, i = Math.min(WOOD_SWINGS - 1, Math.floor(u)), v = u - i;
  const landed = i + (v >= WOOD_HIT ? 1 : 0);
  if (W.depth !== landed) { W.depth = landed; g.innerHTML = wcNotch(W, WC_DEPTH[Math.min(2, landed)]); }
  const prev = SPOT.wcV;
  SPOT.wcV = u;
  if (prev != null && prev < i + WOOD_HIT && u >= i + WOOD_HIT && u - prev < 0.5) wcImpact(el, W, i);
});
on('action', (d) => {
  if (d.skill !== 'woodcutting') return;
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
  const pile = el.querySelector('[data-pile]');
  if (pile) pile.innerHTML = logPile(id);
});
