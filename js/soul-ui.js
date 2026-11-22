'use strict';
/* ==========================================================================
   TRI-REALM IDLE — Soul City: the mine and the forge (soul.js is the engine)
   Reishi Mining: your avatar swings a pickaxe at a vein of spirit ore in a lantern-lit
   mine. Every blow cracks the rock and throws sparks and shards; each ore breaks out
   of the wall into the cart. The vein meter shows how deep you are; a Mother Lode makes
   the crystal heart in the rock blaze gold.
   Smelting: your avatar hammers a glowing bar on the anvil in front of the furnace.
   Every blow throws a fan of sparks; the bar cools to its metal and joins the stack.
   The forge heat meter fills; White Heat turns the furnace white.
   Reuses the woodcutting swing (avatar.js POSE_DRIVE.wood) with other tools, and the
   scene kit of seas-ui.js / shinobi-ui.js (spotAvatar, partAdd, spotPop, setLast).
   ========================================================================== */

/* ================================================================ tools */
function swingSmear(hand, a, P, len, side) {
  if (!P || P.smR == null || Math.abs(P.smR - a) <= 4) return '';
  const n = 7, outer = [], inner = [];
  for (let i = 0; i <= n; i++) { const b = P.smR + (a - P.smR) * (i / n); outer.push(add(add(hand, b, len), b - 90, side)); inner.push(add(hand, b, len - 20 + 12 * (i / n))); }
  return `<path d="M${outer.map(pt).join('L')}L${inner.reverse().map(pt).join('L')}Z" fill="#eef3fb" opacity=".4"/>`;
}
// A miner's pickaxe: a curved steel head across the haft, the long spike on the leading side.
PROP_DRAW.pick = (hand, a, t, P) => {
  const at = (d, side) => add(add(hand, a, d), a - 90, side);
  if (SPOT_CUR) SPOT_CUR.axe = at(47, 30);
  return swingSmear(hand, a, P, 54, 28) + part(taper([add(hand, a, -12), add(hand, a, 56)], [3.6, 3]), '#7a5230', 2.2)
    + `<path d="M${pt(at(53, -22))} Q${pt(at(60, 2))} ${pt(at(47, 31))} L${pt(at(44, 29))} Q${pt(at(53, 3))} ${pt(at(49, -20))}Z" fill="#b9c2cf" stroke="${OL}" stroke-width="2" stroke-linejoin="round"/>`
    + `<path d="M${pt(at(55, -4))} L${pt(at(55, 6))}" stroke="${OL}" stroke-width="5" stroke-linecap="round"/><path d="M${pt(at(55, -4))} L${pt(at(55, 6))}" stroke="#6a717e" stroke-width="2.6" stroke-linecap="round"/>`
    + `<path d="M${pt(at(56, 4))} Q${pt(at(54, 18))} ${pt(at(47, 28))}" fill="none" stroke="#fff" stroke-width="1.3" opacity=".65"/>`;
};
// A smith's hammer: a short haft and a heavy block head, the striking face on the leading side.
PROP_DRAW.hammer = (hand, a, t, P) => {
  const at = (d, side) => add(add(hand, a, d), a - 90, side);
  if (SPOT_CUR) SPOT_CUR.axe = at(46, 15);
  const q = [at(38, -9), at(54, -9), at(54, 14), at(38, 14)];
  return swingSmear(hand, a, P, 48, 16) + part(taper([add(hand, a, -10), add(hand, a, 50)], [3.4, 3]), '#6a4426', 2.2)
    + `<path d="M${q.map(pt).join('L')}Z" fill="#5d6470" stroke="${OL}" stroke-width="2.2" stroke-linejoin="round"/>`
    + `<path d="M${pt(at(38, 14))} L${pt(at(54, 14))}" stroke="#c9d1dc" stroke-width="3"/><path d="M${pt(at(40, -6))} L${pt(at(52, -6))}" stroke="#fff" stroke-width="1.2" opacity=".35"/>`;
};
POSE_DRIVE.mine = (u, t, B, calm) => Object.assign(POSE_DRIVE.wood(u, t, B, calm), { prop: 'pick' });
POSE_DRIVE.forge = (u, t, B, calm) => Object.assign(POSE_DRIVE.wood(u, t, B, calm), { prop: 'hammer' });
DRIVE_SKILL.mine = ['mining', 3];
DRIVE_SKILL.forge = ['smithing', 3];
POSES.mine = POSE_DRIVE.mine(0.02, 0, BODY, true);
POSES.forge = POSE_DRIVE.forge(0.02, 0, BODY, true);
// Where the tool bites on swing i (scene coordinates), like axeHitAt for the axe.
function toolHitAt(drive, i) {
  SPOT_RIG.__probe = {};
  try { drawAvatar(avState(), POSE_DRIVE[drive]((i + WOOD_HIT) / WOOD_SWINGS, 0, BODY, true), 0, { uid: '__probe' }); } catch (e) { /* rig busy */ }
  const p = SPOT_RIG.__probe.axe;
  delete SPOT_RIG.__probe;
  return p ? rigToSpot(WOOD_BOX, p) : [330, 190 + i * 10];
}

/* ================================================================ the mine */
const ORE_LOOK = {
  spirit_ore:    { rock: '#4a4f62', dark: '#2c3040', gem: '#9fdcff' },
  silver_reishi: { rock: '#565c6c', dark: '#33384a', gem: '#eef4ff' },
  frost_crystal: { rock: '#44607e', dark: '#283a52', gem: '#a8f4ff' },
  void_stone:    { rock: '#35304a', dark: '#1c1a2c', gem: '#9a72ff' },
  black_iron:    { rock: '#2e2e34', dark: '#18181c', gem: '#ff9a4a' },
  starsteel:     { rock: '#2f3654', dark: '#1a1f36', gem: '#fff1a0' },
  sunstone:      { rock: '#5e3c24', dark: '#3a2414', gem: '#ffb43a' },
  rift_ore:      { rock: '#2c1c3e', dark: '#180e24', gem: '#ff5ae0' },
};
const oreLook = (id) => ORE_LOOK[id] || ORE_LOOK.spirit_ore;
function lantern(x, y, c) {
  return `<rect x="${x - 1.5}" y="${y - 30}" width="3" height="22" fill="#3a2a1a"/><rect x="${x - 8}" y="${y - 10}" width="16" height="20" rx="3" fill="#2a1e14" stroke="#0a0c11" stroke-width="2"/>`
    + `<rect x="${x - 5}" y="${y - 6}" width="10" height="12" rx="2" fill="${c}"/><circle class="sx-flick" cx="${x}" cy="${y}" r="60" fill="url(#mn-lamp)"/>`;
}
function mineBg(look, hit) {
  const L = oreLook(look), H = WOOD_GROUND, x0 = Math.round(hit[0] - 4);
  let s = `<defs>${spGrad('mn-back', ['#161a28', '#1e2436', '#262c40'])}${spGlow('mn-lamp', '#bfe8ff')}${spGlow('mn-gem', L.gem)}${spGlow('mn-gold', '#ffd75e')}</defs>`;
  s += `<rect width="800" height="320" fill="url(#mn-back)"/>`;
  // back wall: rock slabs
  { const r = sceneRng(17); for (let i = 0; i < 26; i++) { const x = r() * 800, y = r() * 220, w = 50 + r() * 90, h = 30 + r() * 50; s += `<path d="M${x.toFixed(0)} ${(y + h).toFixed(0)} l${(w * 0.2).toFixed(0)} ${(-h).toFixed(0)} l${(w * 0.6).toFixed(0)} ${(-h * 0.2).toFixed(0)} l${(w * 0.2).toFixed(0)} ${(h * 1.1).toFixed(0)}Z" fill="#2a3044" opacity="${(0.35 + r() * 0.4).toFixed(2)}"/>`; } }
  // timber supports and lanterns
  for (const bx of [40, 250]) s += `<rect x="${bx}" y="40" width="14" height="${H - 40}" fill="#5a3a22" stroke="#0a0c11" stroke-width="2"/>`;
  s += `<rect x="20" y="34" width="260" height="14" fill="#6a4628" stroke="#0a0c11" stroke-width="2"/>`;
  s += lantern(120, 76, '#cfeeff') + lantern(620, 70, '#cfeeff');
  // the floor and the rails
  s += `<path d="M0 ${H - 8} Q200 ${H - 16} 400 ${H - 6} T800 ${H - 10} V320 H0Z" fill="#30281f"/>`;
  s += `<rect y="${H + 26}" width="800" height="4" fill="#6b6f7a"/><rect y="${H + 46}" width="800" height="4" fill="#6b6f7a"/>`;
  for (let x = 6; x < 800; x += 34) s += `<rect x="${x}" y="${H + 22}" width="18" height="32" fill="#4a3424" opacity=".8"/>`;
  // the vein: a rock face from the hit to the right edge, crystals set in it
  const face = `M${x0} -10 L${x0 + 30} 40 L${x0 + 6} 110 L${x0 + 24} 170 L${x0 - 2} ${H} H800 V-10Z`;
  s += `<g class="mn-rock"><path d="${face}" fill="${L.rock}" stroke="#0a0c11" stroke-width="3"/>`;
  { const r = sceneRng(5); for (let i = 0; i < 14; i++) { const x = x0 + 40 + r() * 360, y = r() * (H - 20); s += `<path d="M${x.toFixed(0)} ${y.toFixed(0)} l${(18 + r() * 30).toFixed(0)} ${(8 + r() * 14).toFixed(0)}" stroke="${L.dark}" stroke-width="3" opacity=".7"/>`; } }
  { const r = sceneRng(9); for (let i = 0; i < 12; i++) { const x = x0 + 30 + r() * 380, y = 20 + r() * (H - 60), k = 5 + r() * 9; s += `<path d="M${x.toFixed(0)} ${(y - k).toFixed(0)} l${(k * 0.6).toFixed(1)} ${k.toFixed(0)} l${(-k * 0.6).toFixed(1)} ${(k * 0.7).toFixed(1)} l${(-k * 0.6).toFixed(1)} ${(-k * 0.7).toFixed(1)}Z" fill="${L.gem}" stroke="#0a0c11" stroke-width="1.5" opacity=".9"/>`; } }
  // the crystal heart of the vein, right behind the cut (it blazes during a Mother Lode)
  s += `<circle class="mn-heart" cx="${x0 + 70}" cy="${hit[1] - 10}" r="70" fill="url(#mn-gold)" opacity="0"/>`;
  s += `<path d="M${x0 + 58} ${hit[1] - 40} l14 24 l-14 22 l-14 -22Z" fill="${L.gem}" stroke="#0a0c11" stroke-width="2"/><circle cx="${x0 + 58}" cy="${hit[1] - 18}" r="26" fill="url(#mn-gem)" opacity=".6"/></g>`;
  // the cart on the left
  s += `<rect x="-10" y="${H + 2}" width="110" height="34" rx="4" fill="#5a5f6a" stroke="#0a0c11" stroke-width="2.5"/><rect x="-10" y="${H + 2}" width="110" height="7" fill="#80869a"/>`;
  s += `<circle cx="16" cy="${H + 42}" r="9" fill="#2a2a30" stroke="#0a0c11" stroke-width="2"/><circle cx="76" cy="${H + 42}" r="9" fill="#2a2a30" stroke="#0a0c11" stroke-width="2"/>`;
  return s;
}
// Ore in the cart: one lump per 10 owned, up to 12.
function cartPile(id) {
  const n = Math.min(12, Math.ceil(familyCount(id) / 10)), L = oreLook(id), H = WOOD_GROUND;
  let s = '';
  for (let i = 0; i < n; i++) {
    const row = Math.floor(i / 5), x = 6 + (i % 5) * 18 + row * 9, y = H + 2 - row * 9;
    s += `<path d="M${x} ${y} l8 -10 l10 3 l3 9Z" fill="${i % 3 ? L.rock : L.gem}" stroke="#0a0c11" stroke-width="1.6"/>`;
  }
  return s;
}
function soulMeter(kind) {
  return `<div class="sx-meter" data-sxm="${kind}"><small>${kind === 'mine' ? 'Vein' : 'Forge heat'}</small><span class="sx-bar"><i></i></span><b></b></div>`;
}
function mineHTML() {
  const a = S.action && S.action.skill === 'mining' ? findAction('mining', S.action.id) : null;
  const best = SKILLS.mining.actions.filter((x) => x.level <= skillLv('mining')).pop();
  const look = (a || best).id, hits = [toolHitAt('mine', 0), toolHitAt('mine', 1)], hit = [Math.min(hits[0][0], hits[1][0]), hits[0][1]];
  SPOT.mine = { look, hit, hits };
  const last = SPOT.last_mining;
  return `<section class="win spot-win" style="--rc:${rc('soul')}">
    <div class="spot sp-mine ${a ? 'on' : ''}" data-spot="mining">
      <svg class="spot-bg" viewBox="0 0 800 320" preserveAspectRatio="none" aria-hidden="true">${mineBg(look, hit)}<g data-pile>${cartPile(look)}</g></svg>
      ${spotAvatar(WOOD_BOX, a ? 'mine' : '')}
      <svg class="spot-fx" viewBox="0 0 800 320" preserveAspectRatio="none" aria-hidden="true"><defs><filter id="sp-soft" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="2.4"/></filter></defs><g data-spotfx></g><g data-parts></g></svg>
      <div class="spot-pops"></div>
      <div class="spot-hud"><span class="sh-name"><small>Reishi mine</small><b>${esc(a ? a.name + ' vein' : 'Pick a vein')}</b></span>${last ? `<span class="sh-last">${last}</span>` : '<span class="sh-last" hidden></span>'}</div>
      ${soulMeter('mine')}
    </div>
    <div class="spot-bar">${spotStats('mining')}</div>
  </section>`;
}

/* ================================================================ the forge */
const INGOT_COL = { reishi_ingot: '#9fb4d8', silver_ingot: '#e4ebf5', frost_ingot: '#a8e6ff', void_ingot: '#7a5ad8', black_ingot: '#4a4a56', star_ingot: '#ffe58a', sun_ingot: '#ffa53a', rift_ingot: '#ff5ae0' };
function forgeBg(look, hit) {
  const H = WOOD_GROUND, [hx, hy] = hit, top = Math.round(hy + 3);
  let s = `<defs>${spGrad('fg-wall', ['#241a18', '#2e2220', '#1c1412'])}${spGrad('fg-fire', ['#fff4c8', '#ffb347', '#ff5a1a'])}${spGlow('fg-glow', '#ff8a2a')}${spGlow('fg-white', '#ffffff')}</defs>`;
  s += `<rect width="800" height="320" fill="url(#fg-wall)"/>`;
  // bricks
  for (let y = 8; y < H; y += 22) for (let x = (y / 22) % 2 ? -20 : 0; x < 800; x += 46) s += `<rect x="${x}" y="${y}" width="42" height="18" fill="#3a2a24" opacity=".55"/>`;
  // tools on the wall
  s += `<rect x="40" y="70" width="140" height="6" fill="#4a3020"/>`;
  for (const [x, l] of [[60, 50], [92, 64], [124, 44], [154, 58]]) s += `<rect x="${x}" y="76" width="4" height="${l}" fill="#6a4a2a"/><rect x="${x - 5}" y="${76 + l}" width="14" height="8" fill="#5a606c"/>`;
  // the furnace on the right: a brick dome, its glowing mouth, the chimney
  s += `<g class="fg-furnace"><rect x="590" y="-10" width="70" height="120" fill="#3a2c26" stroke="#0a0c11" stroke-width="3"/>`;
  s += `<path d="M520 ${H} V150 Q520 90 625 88 Q730 90 730 150 V${H}Z" fill="#5a3a2c" stroke="#0a0c11" stroke-width="3"/>`;
  for (let y = 110; y < H; y += 20) s += `<path d="M524 ${y} H726" stroke="#3a241a" stroke-width="2" opacity=".7"/>`;
  s += `<path class="fg-mouth" d="M575 ${H - 4} V190 Q575 160 625 160 Q675 160 675 190 V${H - 4}Z" fill="url(#fg-fire)" stroke="#0a0c11" stroke-width="3"/>`;
  s += `<circle class="fg-glowc" cx="625" cy="200" r="190" fill="url(#fg-glow)" opacity=".55"/></g>`;
  // bellows and the quench barrel
  s += `<path d="M700 ${H - 40} l60 -14 l6 26 l-60 14Z" fill="#6a4a2a" stroke="#0a0c11" stroke-width="2"/><rect x="740" y="${H - 50}" width="50" height="58" rx="4" fill="#4a3424" stroke="#0a0c11" stroke-width="2.5"/><rect x="744" y="${H - 50}" width="42" height="6" fill="#2a7a9a"/>`;
  // the floor
  s += `<rect y="${H - 2}" width="800" height="${322 - H}" fill="#2a201c"/><rect y="${H - 2}" width="800" height="3" fill="#4a3a30"/>`;
  // the anvil on its stump, its face right where the hammer lands
  const ax = hx + 18;
  s += `<rect x="${ax - 22}" y="${top + 26}" width="44" height="${H - top - 24}" fill="#5a3a22" stroke="#0a0c11" stroke-width="2.5"/>`;
  s += `<path d="M${ax - 44} ${top} H${ax + 34} Q${ax + 50} ${top} ${ax + 58} ${top + 6} H${ax + 30} L${ax + 20} ${top + 14} V${top + 22} H${ax + 28} V${top + 30} H${ax - 30} V${top + 22} H${ax - 22} V${top + 14} L${ax - 34} ${top + 8}Z" fill="#4a505c" stroke="#0a0c11" stroke-width="2.5" stroke-linejoin="round"/>`;
  s += `<path d="M${ax - 40} ${top + 2} H${ax + 34}" stroke="#9aa4b4" stroke-width="2.4"/>`;
  return s;
}
function ingotStack(id) {
  const n = Math.min(10, Math.ceil(familyCount(id) / 10)), c = INGOT_COL[id] || '#c0c8d4', H = WOOD_GROUND;
  let s = '';
  const rows = [4, 3, 2, 1];
  let i = 0;
  rows.forEach((cols, row) => { for (let k = 0; k < cols && i < n; k++, i++) { const x = 410 + k * 26 + row * 13, y = H + 14 - row * 11; s += `<path d="M${x} ${y} h22 l-4 -9 h-14Z" fill="${c}" stroke="#0a0c11" stroke-width="1.6"/><path d="M${x + 5} ${y - 7} h11" stroke="#fff" stroke-width="1.2" opacity=".5"/>`; } });
  return s;
}
function forgeHTML() {
  const a = S.action && S.action.skill === 'smithing' ? findAction('smithing', S.action.id) : null;
  const best = SKILLS.smithing.actions.filter((x) => x.level <= skillLv('smithing')).pop();
  const look = (a || best).id, hits = [toolHitAt('forge', 0), toolHitAt('forge', 1)], hit = [Math.min(hits[0][0], hits[1][0]), Math.max(hits[0][1], hits[1][1])];
  SPOT.forge = { look, hit, hits };
  const last = SPOT.last_smithing;
  return `<section class="win spot-win" style="--rc:${rc('soul')}">
    <div class="spot sp-forge ${a ? 'on' : ''} ${SOUL().white > 0 ? 'white' : ''}" data-spot="smithing">
      <svg class="spot-bg" viewBox="0 0 800 320" preserveAspectRatio="none" aria-hidden="true">${forgeBg(look, hit)}<g data-pile>${ingotStack(look)}</g></svg>
      ${spotAvatar(WOOD_BOX, a ? 'forge' : '')}
      <svg class="spot-fx" viewBox="0 0 800 320" preserveAspectRatio="none" aria-hidden="true"><defs><filter id="sp-soft" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="2.4"/></filter></defs><g data-spotfx></g><g data-parts></g></svg>
      <div class="spot-pops"></div>
      <div class="spot-hud"><span class="sh-name"><small>Soul forge</small><b>${esc(a ? a.name : 'The forge is cold')}</b></span>${last ? `<span class="sh-last">${last}</span>` : '<span class="sh-last" hidden></span>'}</div>
      ${soulMeter('forge')}
    </div>
    <div class="spot-bar">${spotStats('smithing')}</div>
  </section>`;
}
UIX.realmScene.push((realm, skill) => (skill === 'mining' ? mineHTML() : skill === 'smithing' ? forgeHTML() : ''));
{
  const base = spotStats;
  spotStats = function (skill) {
    if (!(S.action && S.action.skill === skill) && !S.action && (skill === 'mining' || skill === 'smithing')) return `<div class="spot-idle">${ui('play')}<span>${skill === 'mining' ? 'Pick a vein to start mining.' : 'Pick an ingot to light the forge.'}</span></div>`;
    return base(skill);
  };
}

/* ================================================================ per frame */
const MN_CRACK = [0, 1, 2];
function mineCrack(W, depth) {
  const [hx, hy] = W.hits[0], [, hy2] = W.hits[1], cx = hx + 4, cy = (hy + hy2) / 2, L = oreLook(W.look), r = sceneRng(Math.round(hx));
  let s = '';
  const n = 3 + depth * 3;
  for (let i = 0; i < n; i++) {
    const a = -1.3 + (i / n) * 2.6 + (r() - 0.5) * 0.4, len = 10 + depth * 12 + r() * 10;
    const mx = cx + Math.cos(a) * len * 0.5 + (r() - 0.5) * 6, my = cy + Math.sin(a) * len * 0.5;
    s += `<path d="M${cx.toFixed(1)} ${cy.toFixed(1)} L${mx.toFixed(1)} ${my.toFixed(1)} L${(cx + Math.cos(a) * len).toFixed(1)} ${(cy + Math.sin(a) * len).toFixed(1)}" stroke="#0a0c11" stroke-width="${(2.6 - i * 0.1).toFixed(1)}" fill="none" stroke-linecap="round"/>`;
  }
  if (depth) s += `<circle cx="${cx}" cy="${cy}" r="${6 + depth * 5}" fill="${L.gem}" opacity="${0.12 + depth * 0.1}"/>`;
  return s;
}
function swingFrame(kind, drive, W, impact, notch) {
  const el = spotNow();
  if (!el || el.dataset.spot !== kind) return;
  const k = actFrac(kind), av = el.querySelector('.spot-av svg.avatar'), g = el.querySelector('[data-spotfx]');
  el.classList.toggle('on', k >= 0);
  setPose(av, k >= 0 ? drive : '');
  if (!W || !g) return;
  if (k < 0) { if (g.innerHTML) g.innerHTML = ''; W.v = null; return; }
  const u = driveU(drive, performance.now() / 1000) * WOOD_SWINGS, i = Math.min(WOOD_SWINGS - 1, Math.floor(u)), v = u - i;
  const landed = i + (v >= WOOD_HIT ? 1 : 0);
  if (notch && W.depth !== landed) { W.depth = landed; g.innerHTML = notch(W, Math.min(2, landed)); }
  const prev = W.v;
  W.v = u;
  if (prev != null && prev < i + WOOD_HIT && u >= i + WOOD_HIT && u - prev < 0.5) impact(el, W, i);
}
function mineImpact(el, W, i) {
  const L = oreLook(W.look), [hx, hy] = W.hits[i], r = Math.random;
  retrigger(el.querySelector('.mn-rock'), 'hit');
  retrigger(el, 'thud');
  partAdd({ kind: 'flash', x: hx + 2, y: hy, life: 0.16, g: 0 });
  for (let k = 0; k < 6; k++) partAdd({ kind: 'spark', x: hx, y: hy, vx: -40 - r() * 220, vy: -60 - r() * 220, g: 500, life: 0.5 + r() * 0.3 });
  for (let k = 0; k < 6; k++) partAdd({ kind: 'chip', x: hx + 2, y: hy + r() * 6 - 3, vx: -40 - r() * 200, vy: -100 - r() * 220, vr: (r() - 0.5) * 1200, w: 4 + r() * 5, h: 3 + r() * 3, col: k % 3 ? L.rock : L.gem, life: 1.3 + r() * 0.6, floor: WOOD_GROUND + 8 + r() * 36 });
}
function forgeImpact(el, W, i) {
  const [hx, hy] = W.hits[i], r = Math.random, white = SOUL().white > 0;
  retrigger(el, 'thud');
  partAdd({ kind: 'flash', x: hx + 2, y: hy + 2, life: 0.14, g: 0 });
  for (let k = 0; k < (white ? 22 : 14); k++) partAdd({ kind: 'spark', x: hx + 4, y: hy + 2, vx: (r() - 0.3) * 420, vy: -60 - r() * 260, g: 700, life: 0.5 + r() * 0.5, floor: WOOD_GROUND + 4 });
}
// the glowing bar on the anvil: white-hot under the hammer, its own colour when done
function forgeBar(W, k) {
  const [hx, hy] = W.hit, c = INGOT_COL[W.look] || '#c0c8d4', heat = Math.max(0, 1 - k * 0.6), y = hy + 1;
  const hot = mixHex('#ff6a1a', '#fff6c8', heat * 0.7), col = mixHex(c, hot, Math.min(1, heat + 0.2));
  return `<rect x="${(hx - 14).toFixed(1)}" y="${(y - 5).toFixed(1)}" width="34" height="7" rx="1.5" fill="${col}" stroke="#0a0c11" stroke-width="1.6"/>`
    + `<circle cx="${(hx + 3).toFixed(1)}" cy="${y.toFixed(1)}" r="${(16 + heat * 14).toFixed(1)}" fill="#ff9a3a" opacity="${(0.12 + heat * 0.25).toFixed(2)}" filter="url(#sp-soft)"/>`;
}
UPD.push(() => {
  const el = spotNow();
  if (!el) return;
  if (el.dataset.spot === 'mining') {
    swingFrame('mining', 'mine', SPOT.mine, mineImpact, mineCrack);
    const O = SOUL(), heart = el.querySelector('.mn-heart');
    if (heart) heart.setAttribute('opacity', O.lode > 0 ? (0.55 + 0.3 * Math.sin(performance.now() / 160)).toFixed(2) : '0');
    meterSet(el, 'mine', curVein() / 100, O.lode > 0 ? `×3 · ${O.lode} left` : `${Math.round(curVein())}%`, O.lode > 0);
  } else if (el.dataset.spot === 'smithing') {
    swingFrame('smithing', 'forge', SPOT.forge, forgeImpact, null);
    const W = SPOT.forge, g = el.querySelector('[data-spotfx]'), k = actFrac('smithing'), O = SOUL();
    if (W && g && k >= 0) g.innerHTML = forgeBar(W, k);
    el.classList.toggle('white', O.white > 0);
    meterSet(el, 'forge', O.white > 0 ? 1 : O.heat / 100, O.white > 0 ? `White Heat · ${O.white}` : `${Math.round(O.heat)}%`, O.white > 0);
  }
});
function meterSet(el, kind, f, txt, hot) {
  const m = el.querySelector(`[data-sxm="${kind}"]`);
  if (!m) return;
  const i = m.querySelector('i'), b = m.querySelector('b');
  i.style.width = (Math.max(0, Math.min(1, f)) * 100).toFixed(1) + '%';
  if (b.textContent !== txt) b.textContent = txt;
  m.classList.toggle('hot', !!hot);
}

/* ================================================================ outcomes */
on('action', (d) => {
  if (d.skill !== 'mining' && d.skill !== 'smithing') return;
  const id = Object.keys(d.act.out || {})[0], it = id && ITEMS[id];
  if (!it) return;
  const n = Object.keys(d.gains).filter((k) => baseOf(k) === id).reduce((a, k) => a + d.gains[k], 0);
  setLast(d.skill, `<small>${d.skill === 'mining' ? 'Last ore' : 'Last ingot'}</small><b>${esc(it.name)}</b><em>${fmt(familyCount(id))} owned</em>`);
  const el = spotNow();
  if (!el || el.dataset.spot !== d.skill) return;
  const W = d.skill === 'mining' ? SPOT.mine : SPOT.forge;
  if (!W) return;
  const [hx, hy] = W.hit;
  if (d.skill === 'mining') {
    const L = oreLook(W.look);
    partAdd({ kind: 'chip', x: hx + 4, y: hy + 4, vx: -90, vy: -170, vr: -500, w: 13, h: 10, col: L.gem, life: 1.6, floor: WOOD_GROUND + 18 });
    W.depth = null;
  }
  spotPop(`<span class="tile-art">${itemIc(id)}</span>`, hx, hy - 12, 'dish', 1300);
  spotPop(`<b>+${fmt(n || 1)} ${esc(it.name)}</b>`, hx + 60, hy - 70, 'tag', 1500);
  const pile = el.querySelector('[data-pile]');
  if (pile) pile.innerHTML = d.skill === 'mining' ? cartPile(id) : ingotStack(id);
});
function sxBurst(el, x, y, gold, title, sub) {
  spotPop('<i class="sx-rays"></i>', x, y, 'sx-raybox' + (gold ? ' gold' : ''), 1800);
  spotPop(`${ui(gold ? 'shiny' : 'star')}${esc(title)}`, 400, 54, 'banner' + (gold ? ' shiny' : ''), 2400);
  if (sub) spotPop(`<b>${esc(sub)}</b>`, 400, 98, 'tag gold', 2200);
  retrigger(el, 'thud');
}
on('lode', () => {
  const el = spotNow();
  toast('Mother Lode! The next 10 ores come out ×3.', 'rare');
  if (!el || el.dataset.spot !== 'mining' || !SPOT.mine) return;
  const [hx, hy] = SPOT.mine.hit, r = Math.random;
  sxBurst(el, hx + 60, hy - 20, true, 'Mother Lode!', 'Next 10 ores ×3');
  for (let k = 0; k < 24; k++) partAdd({ kind: 'chip', x: hx + 50, y: hy - 20, vx: (r() - 0.6) * 380, vy: -120 - r() * 300, vr: (r() - 0.5) * 1400, w: 4 + r() * 6, h: 3 + r() * 4, col: k % 2 ? '#ffd75e' : oreLook(SPOT.mine.look).gem, life: 1.6, floor: WOOD_GROUND + 10 + r() * 40 });
});
on('whiteheat', () => {
  const el = spotNow();
  toast('White Heat! The next 6 smelts give ×2 ingots, half of them Pure.', 'rare');
  if (!el || el.dataset.spot !== 'smithing') return;
  sxBurst(el, 625, 200, false, 'White Heat!', '6 smelts ×2 · Pure ingots');
  el.classList.add('white');
});
on('quality', (d) => {
  if (d.skill !== 'mining' && d.skill !== 'smithing') return;
  const el = spotNow();
  if (!el || el.dataset.spot !== d.skill) return;
  const W = d.skill === 'mining' ? SPOT.mine : SPOT.forge;
  if (!W) return;
  const [hx, hy] = W.hit;
  if (d.q === 's') sxBurst(el, hx, hy - 20, true, 'Radiant ore!', ITEMS[d.item].name);
  else spotPop(`${ui('perfect')}Pure!`, hx, hy - 70, 'banner perfect', 2000);
});
INTRO['skill:smithing'] = INTRO['skill:smithing'] || { icon: () => ic('skill', 'smithing'), kicker: 'New in Soul City', title: 'The Soul Forge',
  text: 'The soul smith slaps your back. "Keep the fire fed and the hammer moving. A hot forge pours pure metal."',
  points: [[() => ui('time'), 'Forge heat', 'Every ingot stokes the forge: it smelts faster and pours more Pure ingots. It cools while you do something else.'],
    [() => ui('star'), 'White Heat', 'At 100% heat the furnace turns white: 6 smelts give double ingots, half of them Pure.'],
    [() => ui('perfect'), 'Pure ingots', 'Refine a weapon with Pure ingots and it costs half. Hand one of each in to the Perfect Log.']] };
INTRO['skill:mining'] = INTRO['skill:mining'] || { icon: () => ic('skill', 'mining'), kicker: 'New in Soul City', title: 'The Reishi Mine',
  text: 'A ghostly miner hands you a pickaxe. "Stay on a vein. The deeper you dig, the more it gives back."',
  points: [[() => ui('gem'), 'The vein', 'Mining the same ore digs deeper: more double ores and twice the gems at 100%. Switching ore starts a new vein.'],
    [() => ui('star'), 'Mother Lode', 'Sometimes a crystal heart cracks open: the next 10 ores come out ×3. Deep veins find it more often.'],
    [() => ui('shiny'), 'Radiant ore', 'Every ore has a rare Shiny version. Hand one of each in to the Shiny Log for its bonuses.']] };
