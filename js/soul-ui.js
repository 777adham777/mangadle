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
   Each skill has its own driven motion (POSE_DRIVE.mine: overhead pick strikes and a lever;
   POSE_DRIVE.forge: hammer and tongs, then the quench), and uses the scene kit of seas-ui.js / shinobi-ui.js (spotAvatar, partAdd, spotPop, setLast).
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
// A per-cycle variant (0, 1, 2), bumped by every finished ore / ingot: long sessions don't loop one clip.
const SX_CYC = { mining: 0, smithing: 0 };
const sxVar = (skill) => SX_CYC[skill] % 3;

// ---- mining: the overhead pick strike, twice per ore (a high blow, then a low one that is pried out).
// Unlike the axe's flat side swing, the pick goes straight up over the head (up on the toes, back
// arched), hangs, and comes down in a vertical arc into the face; the knees drop into the blow.
// After the first blow the pick is rocked in the crack; after the second the miner leans back on the
// haft and levers the ore loose (it breaks out as the hands spring back, at the end of the action).
// G: the front hand (from the floor under the figure) · R: the haft's angle · s: the sliding back hand.
const MINE_BASE = { sh: 1, prop: 'pick', bf: 1, fF: 12, fB: -194, feet: [18, -14], n: 0, t2: 2, st: 0, ht: 0, aF: [30, 60], aB: [30, 90], lF: [0, 0], lB: [0, 0], g: 0 };
function mineKeys(low, vr) {
  const W = (o) => Object.assign({}, MINE_BASE, o), y = low ? -12 : 0;
  const ready = W({ t1: 176, t2: 3, h: 10, tw: 0.8, dx: 2, dy: 4, G: [26, 92], R: 118, s: 12 });
  // variant 1: a bigger over-the-shoulder wind-up · variant 2: a quick, low-arched chop
  const top = vr === 1 ? W({ t1: 201, t2: -11, n: 4, h: -2, tw: 0.5, st: 9, ht: -6, dx: -9, dy: -2, G: [-12, 156], R: 226, s: 30 })
    : vr === 2 ? W({ t1: 191, t2: -6, n: 2, h: 0, tw: 0.66, st: 5, ht: -3, dx: -4, dy: 0, G: [2, 154], R: 198, s: 26 })
      : W({ t1: 197, t2: -9, n: 3, h: -4, tw: 0.6, st: 6, ht: -4, dx: -6, dy: -2, G: [-4, 162], R: 208, s: 30 });
  const hit = W({ t1: 160, t2: 10, n: -3, h: 14, tw: 0.9, st: -7, ht: 6, dx: 9, dy: 14, G: [30, 92 + y], R: 128 - (low ? 6 : 0), s: 6, expr: 'hurt' });
  const after = (o) => W(Object.assign({}, hit, { expr: undefined }, o));
  const keys = [
    [0, ready],
    [0.12, W({ t1: 184, t2: -2, h: 4, tw: 0.7, dx: -1, dy: 2, G: [10, 132], R: 172, s: 22 })],
    [0.4, top, 'out'],
    [0.47, W(Object.assign({}, top, { t1: top.t1 + 1.5, G: [top.G[0] - 2, top.G[1] + 1], R: top.R + 5 }))],
    [0.51, W({ t1: 178, t2: 5, n: -1, h: 7, tw: 0.78, st: -2, ht: 2, dx: 3, dy: 6, G: [20, 148 + y * 0.5], R: 166, s: 14 }), 'in'],
    [WOOD_HIT, hit, 'lin'],
    [0.6, hit],                                                            // hit-stop: the pick bites and holds
    [0.66, after({ t1: 157, t2: 11, h: 16, dy: 16, n: -1 }), 'out'],       // the body follows through
  ];
  if (!low) keys.push(                                                    // rock the pick loose in the crack
    [0.73, after({ t1: 166, t2: 7, h: 13, dy: 11, G: [28, 97], R: hit.R + 9, s: 8 })],
    [0.8, after({ t1: 170, t2: 5, h: 12, dy: 9, G: [27, 90], R: hit.R - 5, s: 9 })],
    [0.9, W({ t1: 177, t2: 2, h: 10, tw: 0.8, dx: 2, dy: 5, G: [26, 94], R: 122, s: 11 }), 'out'],
    [1, ready]);
  else keys.push(                                                         // lean back on the haft and lever it out
    [0.74, W({ t1: 192, t2: -5, n: 2, h: 9, tw: 0.72, st: 4, ht: -4, dx: -6, dy: 11, G: [24, 70], R: 136, s: 10, expr: 'hurt' }), 'io'],
    [0.86, W({ t1: 195, t2: -6, n: 2, h: 8, tw: 0.7, st: 5, ht: -5, dx: -8, dy: 12, G: [22, 66], R: 140, s: 10, expr: 'hurt' })],
    [0.93, W({ t1: 181, t2: 0, n: -2, h: 4, tw: 0.78, dx: 0, dy: 3, G: [26, 98], R: 112, s: 12 }), 'out'],   // it gives: the hands spring up
    [1, ready]);
  return keys;
}
const MINE_KEYS = [0, 1, 2].map((vr) => [mineKeys(false, vr), mineKeys(true, vr)]);
POSE_DRIVE.mine = (u, t, B, calm) => {
  const w = Math.max(0, Math.min(WOOD_SWINGS - 0.0001, u * WOOD_SWINGS)), i = Math.floor(w), v = w - i;
  const keys = MINE_KEYS[calm ? 0 : sxVar('mining')][i % 2], P = keyPose(keys, v);
  if (v > 0.475 && v <= WOOD_HIT) P.smR = keyPose(keys, Math.max(0.47, v - 0.03)).R;
  // the bite: the haft shudders in the hands, dying out
  const q = win(v, 0.55, 0.56, 0.58, 0.68);
  if (q) P.R += Math.sin(v * 1100) * 2.6 * q * (1 - (v - 0.55) / 0.13);
  // the lever: the whole body strains against the haft
  if (i % 2 && !calm) { const st = win(v, 0.7, 0.75, 0.85, 0.89); if (st) { const j = Math.sin(t * 38); P.R += j * 1.4 * st; P.t1 += j * 0.8 * st; P.dx += j * 0.6 * st; } }
  const br = calm ? 0 : Math.sin(t * 2.2);
  P.t2 += br * 1.2; P.n -= br * 0.8;
  const G = [100 + P.G[0], GROUND - P.G[1]];
  plantPose(P, B, { F: () => G, B: (J) => add(add(J.aF[2], J.foreA.aF, 4.2 * B.w), P.R, P.s) });
  P.g = P.R - (P.aF[0] + P.aF[1]);
  return P;
};

// ---- smelting: one-handed hammer and tongs at the anvil, then the quench.
// The back hand holds the bar on the anvil with tongs (drawn by the scene); the front hand works it:
// three blows that rise from the shoulder, drop on the bar and rebound, then a heavy fourth one wound
// up high. The bar is lifted to the eye, flicked into the quench tub, and the smith settles.
// G / R: the hammer hand and haft · TB: the tong hand (rig) · J: where the bar is, from its rest on the anvil (scene units).
const FORGE_HITS = [0.2, 0.32, 0.44, 0.58];
const FORGE_T = { lift: 0.66, flick: 0.75, splash: 0.83, feed: 0.86 };
const FORGE_BASE = { sh: 1, prop: 'hammer', bf: 1, fF: 12, fB: -192, feet: [16, -14], n: 0, t2: 3, st: 0, ht: 0, aF: [30, 60], aB: [30, 90], lF: [0, 0], lB: [0, 0], g: 0, tw: 0.82, TB: [22, 112], J: [0, 0] };
function forgeKeys(vr) {
  const W = (o) => Object.assign({}, FORGE_BASE, o);
  const ready = W({ t1: 176, t2: 3, h: 12, dx: 2, dy: 4, G: [30, 112], R: 122, TB: [22, 116], J: [0, -14] });
  const hit = (k, heavy) => W({ t1: heavy ? 160 : 166, t2: heavy ? 9 : 7, n: -2, h: 16, st: -6, ht: 4, dx: heavy ? 8 : 5, dy: heavy ? 13 : 8, G: [34 + (k % 2 ? 2 : 0), 104], R: 95, TB: [22, 112], expr: heavy ? 'hurt' : undefined });
  const up = (heavy) => W({ t1: heavy ? 194 : 186, t2: heavy ? -8 : -4, n: 3, h: heavy ? 6 : 10, st: heavy ? 8 : 4, ht: -3, dx: heavy ? -5 : -1, dy: heavy ? 0 : 3, G: heavy ? [6, 168] : [18, 156], R: heavy ? 222 : 200, TB: [21, 113] });
  const rebound = (k) => W({ t1: 172, t2: 4, n: -1, h: 14, st: -2, ht: 2, dx: 3, dy: 6, G: [36, 120], R: 118, TB: [22, 112] });
  const keys = [[0, ready], [0.1, W(Object.assign({}, ready, { J: [0, 0], TB: [22, 112], h: 15, dy: 6 }))]];
  FORGE_HITS.forEach((h, k) => {
    const heavy = k === FORGE_HITS.length - 1 || (vr === 1 && k === 1);
    keys.push([h - (heavy ? 0.075 : 0.055), up(heavy), 'out'], [h - (heavy ? 0.06 : 0.045), up(heavy)], [h, hit(k, heavy), 'in'], [h + 0.012, hit(k, heavy)], [h + 0.04, rebound(k), 'out']);
    // variant 2: the bar is turned over with the tongs between the second and third blows
    if (vr === 2 && k === 1) keys.push([h + 0.06, W(Object.assign({}, rebound(k), { TB: [20, 118], J: [-2, -8] }))]);
  });
  keys.push(
    [FORGE_T.lift - 0.02, W({ t1: 174, t2: 3, h: 12, dx: 2, dy: 5, G: [30, 100], R: 104, TB: [22, 112] })],
    // lift the bar to the eye, look it over
    [FORGE_T.lift + 0.06, W({ t1: 182, t2: -3, n: -2, h: -4, dx: -1, dy: 3, G: [30, 100], R: 106, TB: [16, 138], J: [-20, -40] }), 'out'],
    [FORGE_T.flick - 0.01, W({ t1: 184, t2: -4, n: -2, h: -2, dx: -2, dy: 2, G: [30, 100], R: 106, TB: [12, 140], J: [-24, -42] })],
    // the flick: the tongs snap forward and open, the bar flies into the tub
    [FORGE_T.flick + 0.02, W({ t1: 168, t2: 6, n: -4, h: 8, dx: 5, dy: 6, G: [30, 98], R: 104, TB: [30, 126], J: [10, -30] }), 'out'],
    [0.9, W({ t1: 174, t2: 3, h: 6, dx: 2, dy: 4, G: [30, 108], R: 118, TB: [24, 120], J: [0, -20] })],
    [1, ready]);
  return keys;
}
const FORGE_KEYS = [0, 1, 2].map(forgeKeys);
POSE_DRIVE.forge = (u, t, B, calm) => {
  const keys = FORGE_KEYS[calm ? 0 : sxVar('smithing')], P = keyPose(keys, u);
  // the smear on the way down, and the hammer's rebound ring
  for (const h of FORGE_HITS) {
    if (u > h - 0.02 && u <= h) P.smR = keyPose(keys, Math.max(h - 0.03, u - 0.012)).R;
    const q = win(u, h, h + 0.004, h + 0.01, h + 0.03);
    if (q) P.R += Math.sin(u * 2400) * 2 * q;
  }
  const br = calm ? 0 : Math.sin(t * 2.2);
  P.t2 += br * 1.2; P.n -= br * 0.8;
  const G = [100 + P.G[0], GROUND - P.G[1]], T = [100 + P.TB[0], GROUND - P.TB[1]];
  plantPose(P, B, { F: () => G, B: () => T });
  P.g = P.R - (P.aF[0] + P.aF[1]);
  return P;
};
DRIVE_SKILL.mine = ['mining', 3];
DRIVE_SKILL.forge = ['smithing', 3];
POSES.mine = POSE_DRIVE.mine(0.02, 0, BODY, true);
POSES.forge = POSE_DRIVE.forge(0.02, 0, BODY, true);
// Where the tool bites on swing i (scene coordinates), like axeHitAt for the axe (u: the drive's progress at the bite).
function toolHitAt(drive, i, u) {
  SPOT_RIG.__probe = {};
  try { drawAvatar(avState(), POSE_DRIVE[drive](u != null ? u : (i + WOOD_HIT) / WOOD_SWINGS, 0, BODY, true), 0, { uid: '__probe' }); } catch (e) { /* rig busy */ }
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
  { const r = sceneRng(9); for (let i = 0; i < 12; i++) { const x = x0 + 30 + r() * 380, y = 20 + r() * (H - 60), k = 5 + r() * 9; s += `<path d="M${x.toFixed(0)} ${(y - k).toFixed(0)} l${(k * 0.6).toFixed(1)} ${k.toFixed(0)} l${(-k * 0.6).toFixed(1)} ${(k * 0.7).toFixed(1)} l${(-k * 0.6).toFixed(1)} ${(-k * 0.7).toFixed(1)}Z" fill="${L.gem}" stroke="#0a0c11" stroke-width="1.5" opacity=".9"/>`;
    // every third crystal glints now and then (a four-point star that flares and fades)
    if (i % 3 === 0) s += `<path class="mn-glint" style="animation-delay:${(-r() * 6).toFixed(2)}s;transform-origin:${x.toFixed(0)}px ${(y - k * 0.2).toFixed(0)}px" d="M${x.toFixed(0)} ${(y - k * 0.2 - 9).toFixed(0)} q1.4 7.6 9 9 q-7.6 1.4 -9 9 q-1.4 -7.6 -9 -9 q7.6 -1.4 9 -9Z" fill="#fff"/>`; } }
  // the crystal heart of the vein, right behind the cut (it blazes during a Mother Lode)
  s += `<circle class="mn-heart" cx="${x0 + 70}" cy="${hit[1] - 10}" r="70" fill="url(#mn-gold)" opacity="0"/>`;
  s += `<path d="M${x0 + 58} ${hit[1] - 40} l14 24 l-14 22 l-14 -22Z" fill="${L.gem}" stroke="#0a0c11" stroke-width="2"/><circle cx="${x0 + 58}" cy="${hit[1] - 18}" r="26" fill="url(#mn-gem)" opacity=".6"/></g>`;
  // dust drifting in the lantern light
  { const r = sceneRng(31); for (let i = 0; i < 9; i++) s += `<circle class="mn-dust" style="animation-delay:${(-r() * 9).toFixed(2)}s;animation-duration:${(7 + r() * 5).toFixed(1)}s" cx="${(60 + r() * 640).toFixed(0)}" cy="${(40 + r() * 150).toFixed(0)}" r="${(0.9 + r() * 1.3).toFixed(1)}" fill="#dfeeff"/>`; }
  return s;
}
// The cart on the left: it jolts on its springs when an ore lands in it.
function mineCart(id) {
  const H = WOOD_GROUND;
  return `<g class="mn-cart"><g class="mn-cart-body"><g data-pile>${cartPile(id)}</g><rect x="-10" y="${H + 2}" width="110" height="34" rx="4" fill="#5a5f6a" stroke="#0a0c11" stroke-width="2.5"/><rect x="-10" y="${H + 2}" width="110" height="7" fill="#80869a"/><path d="M4 ${H + 16} h80" stroke="#3e424c" stroke-width="2"/></g>`
    + `<circle cx="16" cy="${H + 42}" r="9" fill="#2a2a30" stroke="#0a0c11" stroke-width="2"/><circle cx="76" cy="${H + 42}" r="9" fill="#2a2a30" stroke="#0a0c11" stroke-width="2"/></g>`;
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
      <svg class="spot-bg" viewBox="0 0 800 320" preserveAspectRatio="none" aria-hidden="true">${mineBg(look, hit)}${mineCart(look)}</svg>
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
  // the ore chute that feeds the furnace mouth
  s += `<path d="M498 128 L582 178 L582 188 L494 138Z" fill="#4a3a30" stroke="#0a0c11" stroke-width="2.5"/><path d="M500 131 L580 179" stroke="#6a5444" stroke-width="2"/>`;
  // the bellows, blowing into the furnace's side (they pump while the forge works)
  s += `<path d="M732 ${H - 60} L700 ${H - 52}" stroke="#2a2420" stroke-width="7"/>`;
  s += `<g class="fg-bellows"><path d="M738 ${H - 74} Q796 ${H - 76} 798 ${H - 52} Q796 ${H - 30} 738 ${H - 34}Z" fill="#7a5232" stroke="#0a0c11" stroke-width="2.5"/>`;
  s += `<path d="M752 ${H - 72} Q760 ${H - 54} 752 ${H - 36} M770 ${H - 73} Q778 ${H - 54} 770 ${H - 35}" stroke="#4a3020" stroke-width="2" fill="none"/></g>`;
  s += `<rect x="784" y="${H - 96}" width="5" height="46" fill="#4a3020" transform="rotate(-8 786 ${H - 50})"/>`;
  // the quench tub, right of the anvil
  const qx = hx + 112;
  s += `<rect x="${qx - 26}" y="${H - 44}" width="52" height="46" rx="4" fill="#4a3424" stroke="#0a0c11" stroke-width="2.5"/>`;
  s += `<path d="M${qx - 26} ${H - 30} h52 M${qx - 26} ${H - 12} h52" stroke="#2a1c12" stroke-width="3"/>`;
  s += `<ellipse class="fg-water" cx="${qx}" cy="${H - 42}" rx="22" ry="4.5" fill="#2a7a9a" stroke="#0a0c11" stroke-width="1.6"/><path d="M${qx - 12} ${H - 43} h10" stroke="#bfefff" stroke-width="1.4" opacity=".7"/>`;
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
  rows.forEach((cols, row) => { for (let k = 0; k < cols && i < n; k++, i++) { const x = 430 + k * 26 + row * 13, y = H + 14 - row * 11; s += `<path d="M${x} ${y} h22 l-4 -9 h-14Z" fill="${c}" stroke="#0a0c11" stroke-width="1.6"/><path d="M${x + 5} ${y - 7} h11" stroke="#fff" stroke-width="1.2" opacity=".5"/>`; } });
  return s;
}
function forgeHTML() {
  const a = S.action && S.action.skill === 'smithing' ? findAction('smithing', S.action.id) : null;
  const best = SKILLS.smithing.actions.filter((x) => x.level <= skillLv('smithing')).pop();
  const look = (a || best).id, hits = FORGE_HITS.map((u, i) => toolHitAt('forge', i, u)), hit = [Math.min(...hits.map((h) => h[0])), Math.max(...hits.map((h) => h[1]))];
  const rec = findAction('smithing', look), ore = rec && rec.in ? Object.keys(rec.in).find((k) => ORE_LOOK[k]) : null;
  SPOT.forge = { look, hit, hits, ore: ore || 'spirit_ore', tub: [hit[0] + 112, WOOD_GROUND - 44] };
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

/* ================================================================ particles */
// sxspark: a streak of light in its own colour · sxshard: a spinning crystal sparkle · sxore: a faceted
// ore lump with a crystal in it · sxingot: a bar that cools from orange to its metal · sxember: a
// flickering ember · sxdust: a soft cloud that swells · sxring: the anvil's ring, a flat ellipse.
{
  const baseSVG = partSVG;
  partSVG = function (p) {
    if (!p.kind || p.kind.slice(0, 2) !== 'sx') return baseSVG(p);
    const f = (v) => v.toFixed(1), k = p.age / p.life, o = Math.max(0, Math.min(1, (p.life - p.age) / (p.life * 0.35)));
    switch (p.kind) {
      case 'sxspark': {
        const tx = p.x - p.vx * 0.03, ty = p.y - p.vy * 0.03;
        return `<path d="M${f(tx)} ${f(ty)} L${f(p.x)} ${f(p.y)}" stroke="${p.col || '#ffd36a'}" stroke-width="${f(p.w || 2)}" stroke-linecap="round" opacity="${o.toFixed(2)}"/>`;
      }
      case 'sxshard': {
        const r = (p.size || 5) * (0.7 + 0.3 * Math.sin(p.age * 14 + p.seed));
        return `<path transform="translate(${f(p.x)},${f(p.y)}) rotate(${f(p.r)})" d="M0,${f(-r)} L${f(r * 0.45)},0 L0,${f(r)} L${f(-r * 0.45)},0Z" fill="${p.col}" stroke="#fff" stroke-width=".8" opacity="${o.toFixed(2)}"/>`;
      }
      case 'sxore': {
        const w = p.size || 14;
        return `<g transform="translate(${f(p.x)},${f(p.y)}) rotate(${f(p.r)})" opacity="${o.toFixed(2)}">${p.glow ? `<circle r="${f(w * 1.3)}" fill="${p.glow}" opacity=".45" filter="url(#sp-soft)"/>` : ''}<path d="M${f(-w * 0.6)} ${f(w * 0.3)} L${f(-w * 0.5)} ${f(-w * 0.35)} L${f(w * 0.1)} ${f(-w * 0.55)} L${f(w * 0.6)} ${f(-w * 0.1)} L${f(w * 0.45)} ${f(w * 0.45)}Z" fill="${p.col}" stroke="#0a0c11" stroke-width="1.8" stroke-linejoin="round"/><path d="M${f(-w * 0.1)} ${f(-w * 0.3)} l${f(w * 0.28)} ${f(w * 0.3)} l${f(-w * 0.28)} ${f(w * 0.3)} l${f(-w * 0.22)} ${f(-w * 0.3)}Z" fill="${p.gem}" stroke="#0a0c11" stroke-width="1.2"/></g>`;
      }
      case 'sxingot': {
        const c = mixHex(p.hot, p.col, Math.min(1, k * 1.4)), heat = Math.max(0, 1 - k * 1.6);
        return `<g transform="translate(${f(p.x)},${f(p.y)}) rotate(${f(p.r)})" opacity="${o.toFixed(2)}">${heat > 0 ? `<circle r="16" fill="#ff8a2a" opacity="${(heat * 0.5).toFixed(2)}" filter="url(#sp-soft)"/>` : ''}<path d="M-11 4 h22 l-4 -9 h-14Z" fill="${c}" stroke="#0a0c11" stroke-width="1.6"/><path d="M-6 -3 h11" stroke="#fff" stroke-width="1.2" opacity="${(0.2 + 0.4 * (1 - heat)).toFixed(2)}"/></g>`;
      }
      case 'sxember': {
        const fl = 0.55 + 0.45 * Math.sin(p.age * 22 + p.seed * 3);
        return `<circle cx="${f(p.x + Math.sin(p.age * 4 + p.seed) * 3)}" cy="${f(p.y)}" r="${f((p.size || 1.6) * (1 - k * 0.5))}" fill="${p.col || '#ffb347'}" opacity="${(o * fl).toFixed(2)}"/>`;
      }
      case 'sxdust': return `<circle cx="${f(p.x)}" cy="${f(p.y)}" r="${f((p.size || 6) * (1 + k * 1.6))}" fill="${p.col || '#cfc6b8'}" filter="url(#sp-soft)" opacity="${(o * (p.alpha || 0.4)).toFixed(2)}"/>`;
      case 'sxring': return `<ellipse cx="${f(p.x)}" cy="${f(p.y)}" rx="${f(6 + k * (p.size || 30))}" ry="${f(2 + k * (p.size || 30) * 0.3)}" fill="none" stroke="${p.col || '#fff'}" stroke-width="${f(2.4 * (1 - k))}" opacity="${(1 - k).toFixed(2)}"/>`;
      default: return '';
    }
  };
}
// a particle crossing the scene from a to b in T seconds (gravity g): the start velocity
const sxThrow = (a, b, T, g) => ({ x: a[0], y: a[1], vx: (b[0] - a[0]) / T, vy: (b[1] - a[1] - 0.5 * g * T * T) / T, g });
// did the drive's progress just cross x (prev -> u)?
const sxCrossed = (prev, u, x) => prev != null && prev < x && u >= x && u - prev < 0.35;

/* ================================================================ per frame: the mine */
// The crack in the vein: it grows with every blow, its lines glow with the ore's crystal, and at the
// last blow the chunk that is about to break out shows its outline.
function mineCrack(W, depth) {
  const [hx, hy] = W.hits[0], [, hy2] = W.hits[1], cx = hx + 4, cy = (hy + hy2) / 2, L = oreLook(W.look), r = sceneRng(Math.round(hx));
  let s = '', glow = '';
  const n = 3 + depth * 3;
  for (let i = 0; i < n; i++) {
    const a = -1.3 + (i / n) * 2.6 + (r() - 0.5) * 0.4, len = 10 + depth * 12 + r() * 10;
    const mx = cx + Math.cos(a) * len * 0.5 + (r() - 0.5) * 6, my = cy + Math.sin(a) * len * 0.5;
    const d = `M${cx.toFixed(1)} ${cy.toFixed(1)} L${mx.toFixed(1)} ${my.toFixed(1)} L${(cx + Math.cos(a) * len).toFixed(1)} ${(cy + Math.sin(a) * len).toFixed(1)}`;
    s += `<path d="${d}" stroke="#0a0c11" stroke-width="${(2.6 - i * 0.1).toFixed(1)}" fill="none" stroke-linecap="round"/>`;
    if (depth) glow += `<path d="${d}" stroke="${L.gem}" stroke-width="1" fill="none" stroke-linecap="round"/>`;
  }
  if (depth) s += `<circle cx="${cx}" cy="${cy}" r="${6 + depth * 6}" fill="${L.gem}" opacity="${0.12 + depth * 0.12}" filter="url(#sp-soft)"/>`;
  if (depth >= 2) s += `<path d="M${cx - 12} ${cy + 6} L${cx - 9} ${cy - 10} L${cx + 6} ${cy - 13} L${cx + 15} ${cy - 2} L${cx + 10} ${cy + 12}Z" fill="${mixHex(L.rock, '#ffffff', 0.12)}" stroke="#0a0c11" stroke-width="2" stroke-linejoin="round"/><path d="M${cx - 1} ${cy - 7} l6 6 l-6 6 l-5 -6Z" fill="${L.gem}" stroke="#0a0c11" stroke-width="1.2"/>`;
  return `<g class="mn-crack">${s}<g class="mn-crack-glow">${glow}</g></g>`;
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
  W.pv = prev;
}
function mineImpact(el, W, i) {
  const L = oreLook(W.look), [hx, hy] = W.hits[i], r = Math.random, big = i === 1;
  retrigger(el.querySelector('.mn-rock'), 'hit');
  retrigger(el.querySelector('.mn-crack'), 'lit');
  partAdd({ kind: 'flash', x: hx + 2, y: hy, life: 0.16, g: 0 });
  // spirit sparks in the crystal's colour, a few hot white ones
  for (let k = 0; k < (big ? 9 : 6); k++) partAdd({ kind: 'sxspark', x: hx, y: hy, vx: -30 - r() * 260, vy: -80 - r() * 240, g: 600, life: 0.35 + r() * 0.3, col: k % 3 ? L.gem : '#fff6d8', w: 1.6 + r() });
  // rock chips (they bounce) and crystal shards (they sparkle as they spin)
  for (let k = 0; k < (big ? 7 : 5); k++) partAdd({ kind: 'chip', x: hx + 2, y: hy + r() * 6 - 3, vx: -40 - r() * 200, vy: -100 - r() * 220, vr: (r() - 0.5) * 1200, w: 4 + r() * 5, h: 3 + r() * 3, col: k % 2 ? L.rock : L.dark, life: 1.3 + r() * 0.6, floor: WOOD_GROUND + 8 + r() * 36 });
  for (let k = 0; k < (big ? 3 : 2); k++) partAdd({ kind: 'sxshard', x: hx + 2, y: hy, vx: -20 - r() * 160, vy: -140 - r() * 160, vr: (r() - 0.5) * 900, g: 700, life: 0.9 + r() * 0.4, size: 4 + r() * 3, col: L.gem, floor: WOOD_GROUND + 10 + r() * 30 });
  // a puff of rock dust
  partAdd({ kind: 'sxdust', x: hx + 4, y: hy + 2, vx: -24, vy: -10, g: 0, life: 0.8, size: 5, col: mixHex(L.rock, '#ffffff', 0.45), alpha: 0.5 });
  // the big blow knocks grit from the ceiling
  if (big) for (let k = 0; k < 4; k++) partAdd({ kind: 'chip', x: hx - 40 + r() * 120, y: 2, vx: 0, vy: 20 + r() * 40, vr: (r() - 0.5) * 400, w: 2 + r() * 2, h: 2, col: '#6a6e7c', life: 1.1, floor: WOOD_GROUND + 6 + r() * 30, bounce: 0 });
}
// The ore breaks out: it flies from the cut into the cart, which jolts on its springs as it lands.
function mineOrePop(el, W, id, shiny, n) {
  const L = oreLook(W.look), [hx, hy] = W.hits[1], r = Math.random, T = 0.7, a = [hx + 6, hy - 4], b = [44, WOOD_GROUND - 2];
  retrigger(el, 'thud');
  partAdd(Object.assign(sxThrow(a, b, T, 900), { kind: 'sxore', vr: -520, life: T + 0.25, size: shiny ? 17 : 14, col: shiny ? '#ffd75e' : L.rock, gem: shiny ? '#fffbe6' : L.gem, glow: shiny ? '#ffe27a' : L.gem, floor: b[1], bounce: 0 }));
  for (let k = 0; k < (shiny ? 8 : 4); k++) partAdd({ kind: 'sxshard', x: a[0], y: a[1], vx: -60 - r() * 220, vy: -120 - r() * 200, vr: (r() - 0.5) * 900, g: 650, life: 0.8 + r() * 0.4, size: 4 + r() * 3, col: shiny ? '#ffe27a' : L.gem });
  partAdd({ kind: 'sxdust', x: a[0], y: a[1], vx: -30, vy: -12, g: 0, life: 1, size: 9, col: mixHex(L.rock, '#ffffff', 0.4), alpha: 0.55 });
  const id0 = W.look;
  setTimeout(() => {
    const e2 = spotNow();
    if (!e2 || e2.dataset.spot !== 'mining') return;
    retrigger(e2.querySelector('.mn-cart'), 'jolt');
    const pile = e2.querySelector('[data-pile]');
    if (pile) pile.innerHTML = cartPile(id || id0);
    for (let k = 0; k < 3; k++) partAdd({ kind: 'sxdust', x: 30 + k * 16, y: WOOD_GROUND, vx: (k - 1) * 20, vy: -14, g: 0, life: 0.7, size: 5, col: '#8a8474', alpha: 0.4 });
    spotPop(`<b>+${fmt(n || 1)}</b>`, 46, WOOD_GROUND - 34, 'tag sx-cartag', 1100);
  }, T * 1000);
}

/* ================================================================ per frame: the forge */
const FORGE_HOT = ['#7a2410', '#c8341a', '#ff6a1a', '#ffb347', '#fff3c0'];
const forgeHeatCol = (h) => { const x = Math.max(0, Math.min(0.999, h)) * (FORGE_HOT.length - 1), i = Math.floor(x); return mixHex(FORGE_HOT[i], FORGE_HOT[i + 1], x - i); };
// The bar's heat at u: white-yellow out of the fire, cooling between blows, flaring under each one.
function barHeat(u) {
  let h = 1 - 0.5 * Math.max(0, Math.min(1, (u - 0.1) / 0.62));
  for (const x of FORGE_HITS) h += 0.16 * win(u, x - 0.002, x + 0.002, x + 0.01, x + 0.05);
  if (SOUL().white > 0) h = Math.max(h, 0.85);
  return Math.min(1, h);
}
function forgeFx(el, W, u, t) {
  const keys = FORGE_KEYS[sxVar('smithing')], P = keyPose(keys, u), c = INGOT_COL[W.look] || '#c0c8d4', f = (v) => v.toFixed(1);
  const [hx, hy] = W.hits[0], rest = [hx + 4, hy + 1];
  const nb = FORGE_HITS.filter((x) => u >= x).length, heat = barHeat(u);
  let sq = 0;
  for (const x of FORGE_HITS) sq = Math.max(sq, win(u, x - 0.001, x + 0.003, x + 0.008, x + 0.03));
  const bw = (28 + nb * 3) * (1 + 0.08 * sq), bh = (10 - nb * 0.9) * (1 - 0.3 * sq);
  const hot = forgeHeatCol(heat), col = mixHex(c, hot, Math.min(1, heat * 1.25));
  const hand = rigToSpot(WOOD_BOX, [100 + P.TB[0], GROUND - P.TB[1]]);
  let s = '', bar = null, jaw;
  const held = u < FORGE_T.flick + 0.006, flying = !held && u < FORGE_T.splash;
  if (held) {
    bar = [rest[0] + P.J[0], rest[1] + P.J[1]];
    jaw = [bar[0] - bw / 2 + 5, bar[1]];
  } else {
    jaw = [rest[0] + P.J[0] - bw / 2 + 5, rest[1] + P.J[1]];
    if (flying) {
      const k = (u - FORGE_T.flick - 0.006) / (FORGE_T.splash - FORGE_T.flick - 0.006), e = ease.in(Math.min(1, k * 0.7 + 0.3 * k * k));
      const a0 = [rest[0] - 14, rest[1] - 40], b0 = W.tub;
      bar = [a0[0] + (b0[0] - a0[0]) * k, a0[1] + (b0[1] - a0[1]) * e - Math.sin(Math.PI * k) * 46];
    }
  }
  // the glow it throws on the anvil and the smith
  if (bar) s += `<circle cx="${f(bar[0])}" cy="${f(bar[1])}" r="${f(18 + heat * 18)}" fill="${hot}" opacity="${(0.14 + heat * 0.26).toFixed(2)}" filter="url(#sp-soft)"/>`;
  // the tongs: two dark arms from the fist to the jaws (they open after the flick)
  const open = held ? 0 : 4, d = [jaw[0] - hand[0], jaw[1] - hand[1]], L = Math.hypot(d[0], d[1]) || 1, nx = -d[1] / L, ny = d[0] / L;
  for (const sgn of [-1, 1]) {
    const j = [jaw[0] + nx * sgn * (2.2 + open), jaw[1] + ny * sgn * (2.2 + open)], m = [hand[0] + d[0] * 0.55 + nx * sgn * 1.4, hand[1] + d[1] * 0.55 + ny * sgn * 1.4];
    s += `<path d="M${f(hand[0])} ${f(hand[1])} L${f(m[0])} ${f(m[1])} L${f(j[0])} ${f(j[1])}" fill="none" stroke="#0a0c11" stroke-width="3.6" stroke-linecap="round" stroke-linejoin="round"/><path d="M${f(hand[0])} ${f(hand[1])} L${f(m[0])} ${f(m[1])} L${f(j[0])} ${f(j[1])}" fill="none" stroke="#5d6470" stroke-width="1.6" stroke-linecap="round"/>`;
  }
  if (bar) {
    const rot = flying ? (u - FORGE_T.flick) * 2400 : 0, op = Math.min(1, u / 0.04);
    s += `<g transform="translate(${f(bar[0])},${f(bar[1])}) rotate(${f(rot)})" opacity="${op.toFixed(2)}"><rect x="${f(-bw / 2)}" y="${f(-bh / 2)}" width="${f(bw)}" height="${f(bh)}" rx="2" fill="${col}" stroke="#0a0c11" stroke-width="1.6"/><path d="M${f(-bw / 2 + 4)} ${f(-bh / 2 + 2)} h${f(bw - 8)}" stroke="${mixHex(col, '#ffffff', 0.55)}" stroke-width="1.4" opacity=".8"/></g>`;
  }
  return s;
}
function forgeImpact(el, W, j) {
  const [hx, hy] = W.hits[j], r = Math.random, white = SOUL().white > 0, u = FORGE_HITS[j], heavy = j === FORGE_HITS.length - 1, heat = barHeat(u);
  if (heavy) retrigger(el, 'thud');
  partAdd({ kind: 'flash', x: hx + 2, y: hy + 2, life: heavy ? 0.18 : 0.12, g: 0 });
  partAdd({ kind: 'sxring', x: hx + 4, y: hy + 3, g: 0, life: 0.35, size: heavy ? 40 : 26, col: '#fff6d8' });
  // the spark shower: hotter bars throw more, brighter sparks; they fan out and rain down
  const n = Math.round((heavy ? 16 : 9) * (0.6 + heat * 0.6) * (white ? 1.5 : 1));
  for (let k = 0; k < n; k++) partAdd({ kind: 'sxspark', x: hx + 4, y: hy + 2, vx: (r() - 0.35) * 460, vy: -60 - r() * (heavy ? 320 : 240), g: 800, life: 0.4 + r() * 0.5, col: white ? '#ffffff' : forgeHeatCol(0.6 + r() * 0.4), w: 1.4 + r() * 1.2, floor: WOOD_GROUND + 4 });
}
function forgeSplash(el, W) {
  const [qx, qy] = W.tub, r = Math.random;
  retrigger(el.querySelector('.fg-water'), 'splash');
  spotPop('<i></i><i></i><i></i>', qx, qy - 20, 'sx-steam', 1400);
  for (let k = 0; k < 7; k++) partAdd({ kind: 'sxdust', x: qx + (r() - 0.5) * 30, y: qy - 4, vx: (r() - 0.5) * 40, vy: -50 - r() * 50, g: -10, life: 1.2 + r() * 0.6, size: 6 + r() * 5, col: '#ffffff', alpha: 0.45 });
  for (let k = 0; k < 8; k++) partAdd({ kind: 'sxspark', x: qx + (r() - 0.5) * 16, y: qy, vx: (r() - 0.5) * 200, vy: -120 - r() * 160, g: 900, life: 0.5, col: '#bfefff', w: 2, floor: qy + 2 });
}
function forgeFeed(el, W) {
  const L = oreLook(W.ore), r = Math.random;
  for (let k = 0; k < 3; k++) partAdd({ kind: 'sxore', x: 500 + k * 6, y: 122 - k * 4, vx: 120 + r() * 20, vy: 50, vr: 300, g: 240, life: 0.55 + k * 0.08, size: 9, col: L.rock, gem: L.gem });
  setTimeout(() => {
    const e2 = spotNow();
    if (!e2 || e2.dataset.spot !== 'smithing') return;
    retrigger(e2.querySelector('.fg-furnace'), 'flare');
    for (let k = 0; k < 8; k++) partAdd({ kind: 'sxember', x: 600 + r() * 50, y: 190, vx: (r() - 0.5) * 80, vy: -60 - r() * 120, g: -40, life: 0.9 + r() * 0.6, size: 1.4 + r() * 1.4, col: r() < 0.3 ? L.gem : '#ffb347' });
  }, 550);
}
// The ingot comes out of the tub still glowing and cools to its metal on the stack.
function forgeIngotPop(el, W, id, n) {
  const c = INGOT_COL[id] || '#c0c8d4', [qx, qy] = W.tub, m = Math.max(1, Math.min(10, Math.ceil((familyCount(id) || 1) / 10)));
  let row = 0, left = m - 1;
  for (const cols of [4, 3, 2, 1]) { if (left < cols) break; left -= cols; row++; }
  const top = [430 + left * 26 + Math.min(row, 3) * 13 + 11, WOOD_GROUND + 14 - Math.min(row, 3) * 11 - 13], T = 0.6;
  partAdd(Object.assign(sxThrow([qx, qy - 6], top, T, 900), { kind: 'sxingot', vr: 600, life: T + 1.2, hot: '#ff9a3a', col: c, floor: top[1], bounce: 0 }));
  for (let k = 0; k < 3; k++) partAdd({ kind: 'sxdust', x: qx + (k - 1) * 10, y: qy - 6, vx: (k - 1) * 14, vy: -40, g: -10, life: 1, size: 5, col: '#ffffff', alpha: 0.4 });
  setTimeout(() => {
    const e2 = spotNow();
    if (!e2 || e2.dataset.spot !== 'smithing') return;
    const pile = e2.querySelector('[data-pile]');
    if (pile) pile.innerHTML = ingotStack(id);
    partAdd({ kind: 'sxring', x: top[0], y: top[1] + 4, g: 0, life: 0.3, size: 18, col: '#ffffff' });
  }, T * 1000);
}
UPD.push(() => {
  const el = spotNow();
  if (!el) return;
  const now = performance.now() / 1000, r = Math.random;
  if (el.dataset.spot === 'mining') {
    swingFrame('mining', 'mine', SPOT.mine, mineImpact, mineCrack);
    const W = SPOT.mine, O = SOUL(), heart = el.querySelector('.mn-heart');
    // the lever: grit trickles from the crack as the miner leans on the haft
    if (W && W.v != null && W.pv != null && actFrac('mining') >= 0) {
      const [hx, hy] = W.hits[1], L = oreLook(W.look);
      if (W.v > 1.7 && W.v < 1.87 && r() < 0.35) partAdd({ kind: 'chip', x: hx + 2 + r() * 8, y: hy, vx: -20 - r() * 40, vy: -20 - r() * 40, vr: 300, w: 2 + r() * 2, h: 2, col: r() < 0.3 ? L.gem : L.rock, life: 0.9, floor: WOOD_GROUND + 10 + r() * 20, bounce: 0 });
    }
    if (heart) heart.setAttribute('opacity', O.lode > 0 ? (0.55 + 0.3 * Math.sin(performance.now() / 160)).toFixed(2) : '0');
    meterSet(el, 'mine', curVein() / 100, O.lode > 0 ? `×3 · ${O.lode} left` : `${Math.round(curVein())}%`, O.lode > 0);
  } else if (el.dataset.spot === 'smithing') {
    const W = SPOT.forge, g = el.querySelector('[data-spotfx]'), k = actFrac('smithing'), O = SOUL(), av = el.querySelector('.spot-av svg.avatar');
    el.classList.toggle('on', k >= 0);
    setPose(av, k >= 0 ? 'forge' : '');
    if (W && g) {
      if (k < 0) { if (g.innerHTML) g.innerHTML = ''; W.v = null; }
      else {
        const u = driveU('forge', now), prev = W.v;
        W.v = u;
        g.innerHTML = forgeFx(el, W, u, now);
        FORGE_HITS.forEach((x, j) => { if (sxCrossed(prev, u, x)) forgeImpact(el, W, j); });
        if (sxCrossed(prev, u, FORGE_T.splash)) forgeSplash(el, W);
        if (sxCrossed(prev, u, FORGE_T.feed)) forgeFeed(el, W);
        // embers drift up out of the furnace mouth the whole time it is worked
        if (r() < 0.07) partAdd({ kind: 'sxember', x: 590 + r() * 70, y: 175 + r() * 20, vx: (r() - 0.5) * 30, vy: -30 - r() * 40, g: -20, life: 1.4 + r(), size: 1.2 + r() * 1.2 });
      }
    }
    el.classList.toggle('white', O.white > 0);
    el.style.setProperty('--fg-heat', (O.white > 0 ? 1 : O.heat / 100).toFixed(2));
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
const SX_Q = {};
on('action', (d) => {
  if (d.skill !== 'mining' && d.skill !== 'smithing') return;
  SX_CYC[d.skill]++;
  const id = Object.keys(d.act.out || {})[0], it = id && ITEMS[id];
  if (!it) return;
  const n = Object.keys(d.gains).filter((k) => baseOf(k) === id).reduce((a, k) => a + d.gains[k], 0);
  setLast(d.skill, `<small>${d.skill === 'mining' ? 'Last ore' : 'Last ingot'}</small><b>${esc(it.name)}</b><em>${fmt(familyCount(id))} owned</em>`);
  const el = spotNow();
  if (!el || el.dataset.spot !== d.skill) return;
  const W = d.skill === 'mining' ? SPOT.mine : SPOT.forge;
  if (!W) return;
  const q = SX_Q[d.skill] && performance.now() - SX_Q[d.skill].t < 80 ? SX_Q[d.skill].q : null;
  const [hx, hy] = W.hit, calm = avCalm();
  if (d.skill === 'mining') {
    W.depth = null;
    if (calm) { const pile = el.querySelector('[data-pile]'); if (pile) pile.innerHTML = cartPile(id); }
    else mineOrePop(el, W, id, q === 's', n);
    spotPop(`<span class="tile-art">${itemIc(id)}</span>`, hx + 10, hy - 22, 'dish sx-pop', 1300);
  } else {
    if (calm) { const pile = el.querySelector('[data-pile]'); if (pile) pile.innerHTML = ingotStack(id); }
    else forgeIngotPop(el, W, id, n);
    spotPop(`<span class="tile-art">${itemIc(id)}</span>`, W.tub[0], W.tub[1] - 40, 'dish sx-pop', 1300);
  }
  spotPop(`<b>+${fmt(n || 1)} ${esc(it.name)}</b>`, hx + 60, hy - 70, 'tag', 1500);
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
  const [hx, hy] = SPOT.mine.hit, r = Math.random, L = oreLook(SPOT.mine.look);
  sxBurst(el, hx + 60, hy - 20, true, 'Mother Lode!', 'Next 10 ores ×3');
  retrigger(el, 'sx-quake');
  for (let k = 0; k < 16; k++) partAdd({ kind: 'chip', x: hx + 50, y: hy - 20, vx: (r() - 0.6) * 380, vy: -120 - r() * 300, vr: (r() - 0.5) * 1400, w: 4 + r() * 6, h: 3 + r() * 4, col: k % 2 ? '#ffd75e' : L.gem, life: 1.6, floor: WOOD_GROUND + 10 + r() * 40 });
  for (let k = 0; k < 10; k++) partAdd({ kind: 'sxshard', x: hx + 60, y: hy - 20, vx: (r() - 0.5) * 300, vy: -100 - r() * 260, vr: (r() - 0.5) * 900, g: 500, life: 1.4, size: 5 + r() * 4, col: k % 2 ? '#ffe27a' : L.gem });
});
on('whiteheat', () => {
  const el = spotNow();
  toast('White Heat! The next 6 smelts give ×2 ingots, half of them Pure.', 'rare');
  if (!el || el.dataset.spot !== 'smithing') return;
  sxBurst(el, 625, 200, false, 'White Heat!', '6 smelts ×2 · Pure ingots');
  retrigger(el.querySelector('.fg-furnace'), 'flare');
  const r = Math.random;
  for (let k = 0; k < 18; k++) partAdd({ kind: 'sxember', x: 625 + (r() - 0.5) * 80, y: 200, vx: (r() - 0.5) * 260, vy: -80 - r() * 220, g: 60, life: 1.2 + r() * 0.6, size: 1.6 + r() * 1.6, col: k % 3 ? '#ffffff' : '#ffe27a' });
  el.classList.add('white');
});
on('quality', (d) => {
  if (d.skill !== 'mining' && d.skill !== 'smithing') return;
  SX_Q[d.skill] = { q: d.q, t: performance.now() };
  const el = spotNow();
  if (!el || el.dataset.spot !== d.skill) return;
  const W = d.skill === 'mining' ? SPOT.mine : SPOT.forge;
  if (!W) return;
  const [hx, hy] = W.hit;
  if (d.q === 's') sxBurst(el, hx, hy - 20, true, 'Radiant ore!', ITEMS[d.item].name);
  else {
    spotPop(`${ui('perfect')}Pure!`, hx, hy - 70, 'banner perfect', 2000);
    // a Pure ingot: the tub flashes white-blue and a ring of light rises from it
    if (d.skill === 'smithing') { const [qx, qy] = W.tub; for (let k = 0; k < 8; k++) partAdd({ kind: 'sxshard', x: qx, y: qy - 10, vx: Math.cos(k * 0.785) * 120, vy: -60 + Math.sin(k * 0.785) * 80, vr: 400, g: 0, life: 0.9, size: 5, col: '#e8f6ff' }); }
  }
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
