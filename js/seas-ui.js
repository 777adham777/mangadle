'use strict';
/* ==========================================================================
   TRI-REALM IDLE — Orange Town overhaul: interface
   - animated scenes under the skill banner: your avatar fishing off a pier /
     a reef / a ship deck, cooking in the galley, your ship sailing a voyage
   - Shiny & Perfect: tile shine, logs with their set bonuses (skill pages +
     Collection), celebrations
   - the Cooking spice rack, seasoning buffs in battle
   Loaded after arena.js (uses the avatar rig), before ui-systems.js boots.
   ========================================================================== */

/* ================================================================ icons */
// Drawn for this game (512 grid, filled like the game-icons.net set).
GI['salt-shaker'] = 'M226 58a30 30 0 1 1 60 0a30 30 0 1 1-60 0zM156 152c0-58 44-80 100-80s100 22 100 80zM146 166h220v46H146zM160 226h192l24 206c4 36-18 56-52 56H188c-34 0-56-20-52-56z';
GI['pepper-grains'] = 'M110 330a70 70 0 1 1 140 0a70 70 0 1 1-140 0zM254 310a76 76 0 1 1 152 0a76 76 0 1 1-152 0zM184 190a66 66 0 1 1 132 0a66 66 0 1 1-132 0zM244 440a56 56 0 1 1 112 0a56 56 0 1 1-112 0z';
GI['chili-pepper'] = 'M168 154C112 262 170 392 300 444c60 24 120 26 146 6-62-14-112-54-146-96-48-60-50-130-36-196zM136 176c10-54 132-64 152-14-38 26-108 32-152 14zM204 140c-6-46 22-84 80-100l14 34c-42 10-56 34-52 70z';
GI['kelp'] = 'M180 480c-30-80 40-130 10-210-30-80 30-130 6-210 44 70 0 130 32 208 34 84-32 132-8 212zM282 480c-18-70 50-120 20-200-24-70 30-120 16-184 36 64-4 116 22 184 28 80-34 130-20 200zM98 480c-8-50 40-80 26-140-10-50 24-80 20-130 26 50 4 86 16 134 14 60-30 88-24 136z';
GI['saffron'] = GI['spiral-bloom'] || GI['flower-twirl'];
Object.assign(ICONS.item, { sea_salt: 'salt-shaker', peppercorns: 'pepper-grains', coral_lemon: 'cut-lemon', sea_kelp: 'kelp', fire_chili: 'chili-pepper', gold_saffron: 'saffron' });
Object.assign(ICONS.ui, { spices: 'salt-shaker', shiny: 'sparkles', perfect: 'round-star', record: 'trophy', cargo: 'cargo-ship' });
ICONS.shop.buy_pepper = 'pepper-grains';
Object.assign(TYPE_LABEL, { spice: 'Seasoning' });
COL_GROUPS.push(['spice', 'Seasonings']);
BAG_TABS.splice(BAG_TABS.findIndex((t) => t[0] === 'food') + 1, 0, ['spice', 'spices', 'Spices']);

/* ================================================================ tiles */
// Shiny tiles shimmer, perfect ones get a gold frame, seasoned ones a spice badge (ICON_MARK, quality.js).
{
  const baseTile = tile;
  tile = function (id, n, o) {
    const it = id && ITEMS[id];
    if (it && it.variant && !(o && o.unknown)) {
      const q = it.q === 's' ? ' q-shiny' : it.q === 'p' ? ' q-perfect' : '';
      o = Object.assign({}, o, { cls: ((o && o.cls) || '') + q + (it.spice ? ' q-spiced' : '') });
    }
    return baseTile(id, n, o);
  };
  // Where a shiny / perfect / seasoned item comes from: its base action.
  const baseSources = sourcesOf;
  sourcesOf = (id) => {
    const it = ITEMS[id];
    if (!it || !it.variant) return baseSources(id);
    const out = [];
    for (const k in SKILLS) {
      const a = SKILLS[k].actions.find((x) => x.out && x.out[it.base]);
      if (!a) continue;
      if (it.q && QUALITY[k]) out.push({ icon: ['skill', k], text: `${SKILLS[k].name} · ${a.name}`, rate: qChance(k, a) });
      if (it.spice) out.push({ icon: ['item', SPICES[it.spice].item], text: `${SKILLS[k].name} · ${a.name}, with ${SPICES[it.spice].name} on the spice rack`, rate: null });
      break;
    }
    return out;
  };
}

/* ================================================================ avatar hooks */
// Scene avatars draw only the rod / pan; the line, bobber, flames and steam are drawn by the scene.
// SPOT_RIG[uid] records where the rod tip and the pan are (rig coordinates) on every frame.
const SPOT_RIG = {};
const SPOT_UIDS = [];
let SPOT_CUR = null;
{
  const baseDraw = drawAvatar;
  drawAvatar = function (A, P, t, opt) {
    SPOT_CUR = (opt && opt.uid && SPOT_RIG[opt.uid]) || null;
    if (SPOT_CUR) { SPOT_CUR.tip = null; SPOT_CUR.pan = null; }
    try { return baseDraw(A, P, t, opt); } finally { SPOT_CUR = null; }
  };
  const baseRod = rodSVG;
  rodSVG = function (hand, a, t) {
    if (!SPOT_CUR) return baseRod(hand, a, t);
    const tip = add(hand, a, 78);
    SPOT_CUR.tip = tip;
    return part(taper([add(hand, a, -10), tip], [4.4, 1.8]), SPOT_CUR.rod || '#8a5a2b', 2.4)
      + `<circle cx="${r1(add(hand, a, 8)[0])}" cy="${r1(add(hand, a, 8)[1])}" r="4.2" fill="#cfd6e4" stroke="${OL}" stroke-width="1.6"/>`;
  };
  const basePan = panSVG;
  panSVG = function (hand, a, t) {
    if (!SPOT_CUR) return basePan(hand, a, t);
    const end = add(hand, a, 16), c = add(end, a, 15);
    SPOT_CUR.pan = c;
    const k = SPOT_CUR.cook == null ? -1 : SPOT_CUR.cook;
    const toss = k > 0.8 ? Math.sin(((k - 0.8) / 0.2) * Math.PI) : 0;
    const food = k < 0 ? '' : `<g transform="translate(${r1(c[0])},${r1(c[1] - 4 - toss * 30)}) rotate(${r1(toss * 320)})"><ellipse rx="8" ry="3.4" fill="${SPOT_CUR.food || '#ffb36b'}" stroke="${OL}" stroke-width="1.6"/><path d="M-4,-1 h6" stroke="#fff" stroke-width="1.2" opacity=".55"/></g>`;
    return part(taper([hand, end], [3.6, 3.6]), '#3b3f4a', 2.2)
      + `<ellipse cx="${r1(c[0])}" cy="${r1(c[1])}" rx="17" ry="5.2" fill="#2a2e38" stroke="${OL}" stroke-width="2.4"/>` + food;
  };
  // the catch: the rod snaps up, then settles back into the cast
  POSES.reel = Object.assign({}, POSES.fish, { t1: 186, t2: -6, n: -6, h: -6, aF: [104, 26], aB: [44, 92], g: -64, dy: 0, expr: 'happy' });
}
// A scene avatar: its rig is tracked from its very first frame.
function spotAvatar(box, pose, extra) {
  const uid = 'av' + (avUid + 1);
  SPOT_RIG[uid] = Object.assign({}, extra || {});
  SPOT_UIDS.push(uid);
  while (SPOT_UIDS.length > 6) delete SPOT_RIG[SPOT_UIDS.shift()];
  const svg = avatarSVG(null, { ctx: 'preview', pose: pose || undefined });
  return `<div class="spot-av" style="left:${(box.x / 8).toFixed(2)}%;top:${(box.y / 3.2).toFixed(2)}%;width:${(box.h * 156 / 218 / 8).toFixed(2)}%;height:${(box.h / 3.2).toFixed(2)}%">${svg}</div>`;
}
// Rig coordinates (avatar viewBox 22 18 156 218) -> scene coordinates (800 x 320).
const rigToSpot = (box, p) => [box.x + (p[0] - 22) * box.h / 218, box.y + (p[1] - 18) * box.h / 218];

// Shiny Glimmer: the aura for a full Shiny Log.
{
  COSMETICS.aura.push({ id: 'glimmer', name: 'Shiny Glimmer', w: 'seas', r: 5, need: () => qLogDone('fishing'), hint: 'Complete the Shiny Log of Fishing' });
  AURA_GLOW.glimmer = 1;
  const baseAura = auraSVG;
  auraSVG = function (id, cx, cy, t) {
    if (id !== 'glimmer') return baseAura(id, cx, cy, t);
    const star = (x, y, r, c, o) => `<path transform="translate(${r1(x)},${r1(y)})" d="M0,${-r} Q${r * 0.18},${-r * 0.18} ${r},0 Q${r * 0.18},${r * 0.18} 0,${r} Q${-r * 0.18},${r * 0.18} ${-r},0 Q${-r * 0.18},${-r * 0.18} 0,${-r}Z" fill="${c}" opacity="${r1(o)}"/>`;
    return flameAura(cx, t, ['#ffb000', '#ffe27a', '#fffbe6'], { h: 196, w: 50 }) + [0, 1, 2, 3, 4, 5, 6, 7].map((i) => {
      const a = t * 0.8 + i * 0.785, tw = (Math.sin(t * 4 + i * 1.9) + 1) / 2;
      return star(cx + Math.cos(a) * (40 + (i % 3) * 8), cy - 6 + Math.sin(a) * 50, 3 + tw * 5, i % 2 ? '#fff6c8' : '#9ff3ff', 0.35 + tw * 0.65);
    }).join('');
  };
}

/* ================================================================ scene art */
const SPOT = {};   // per-skill state kept across re-renders: last catch text, etc.
const spRng = (seed) => sceneRng(seed);
const spGrad = (id, stops, h) => `<linearGradient id="${id}" x1="0" y1="0" x2="${h ? 1 : 0}" y2="${h ? 0 : 1}">${stops.map((c, i) => `<stop offset="${(i / (stops.length - 1)).toFixed(2)}" stop-color="${c}"/>`).join('')}</linearGradient>`;
const spGlow = (id, c) => `<radialGradient id="${id}"><stop offset="0" stop-color="${c}" stop-opacity=".9"/><stop offset=".35" stop-color="${c}" stop-opacity=".35"/><stop offset="1" stop-color="${c}" stop-opacity="0"/></radialGradient>`;
function spCloud(x, y, s, c, o) {
  return `<g fill="${c}" opacity="${o}"><ellipse cx="${x}" cy="${y}" rx="${46 * s}" ry="${12 * s}"/><circle cx="${x - 20 * s}" cy="${y - 7 * s}" r="${15 * s}"/><circle cx="${x + 4 * s}" cy="${y - 14 * s}" r="${20 * s}"/><circle cx="${x + 26 * s}" cy="${y - 5 * s}" r="${12 * s}"/></g>`;
}
function spClouds(seed, n, y0, y1, c, o) {
  const r = spRng(seed);
  let s = '';
  for (let i = 0; i < n; i++) s += spCloud(Math.round(r() * 800), Math.round(y0 + r() * (y1 - y0)), 0.6 + r() * 0.9, c, (o * (0.6 + r() * 0.4)).toFixed(2));
  return s;
}
function spStars(seed, n, maxY) {
  const r = spRng(seed);
  let s = '';
  for (let i = 0; i < n; i++) s += `<circle cx="${Math.round(r() * 800)}" cy="${Math.round(r() * maxY)}" r="${(r() * 1.3 + 0.4).toFixed(1)}" opacity="${(r() * 0.6 + 0.3).toFixed(2)}"/>`;
  return `<g fill="#fff">${s}</g>`;
}
// light dashes on the water
function spGlints(seed, n, y0, c, cx, spread) {
  const r = spRng(seed);
  let s = '';
  for (let i = 0; i < n; i++) {
    const y = y0 + Math.pow(r(), 1.6) * (320 - y0), w = 6 + ((y - y0) / (320 - y0)) * 36 * r();
    const x = cx != null ? cx + (r() - 0.5) * spread * (0.4 + (y - y0) / (320 - y0)) : r() * 800;
    s += `<rect x="${Math.round(x - w / 2)}" y="${Math.round(y)}" width="${Math.round(w)}" height="2" rx="1" fill="${c}" opacity="${(0.25 + r() * 0.55).toFixed(2)}"/>`;
  }
  return s;
}
const spGulls = (pts, c) => pts.map(([x, y, s]) => `<path d="M${x - 9 * s} ${y} q${4.5 * s} ${-6 * s} ${9 * s} 0 q${4.5 * s} ${-6 * s} ${9 * s} 0" fill="none" stroke="${c}" stroke-width="${1.8 * s}" stroke-linecap="round"/>`).join('');
const spPalm = (x, y, s) => `<path d="M${x} ${y} q${-6 * s} ${-40 * s} ${8 * s} ${-78 * s}" fill="none" stroke="#5a3d22" stroke-width="${6 * s}" stroke-linecap="round"/>`
  + [[-46, -8], [-30, -26], [6, -34], [36, -18], [44, 6]].map(([dx, dy]) => `<path d="M${x + 8 * s} ${y - 78 * s} q${dx * 0.5 * s} ${(dy - 18) * s} ${dx * s} ${(dy + 14) * s}" fill="none" stroke="#2e8a4e" stroke-width="${7 * s}" stroke-linecap="round"/>`).join('');

/* ---------------------------------------------------------------- fishing spots */
const FISH_SPOTS = [
  { id: 'harbour', name: 'Harbour Pier', max: 19, horizon: 172, bob: [478, 262],
    sky: ['#4fa8e6', '#9fd8f6', '#ffe8c6'], sea: ['#37bfe0', '#1a86b8', '#0b4f7d'], glint: '#ffffff', sun: [640, 66, 30, '#fff4cc'] },
  { id: 'reef', name: 'Coral Reef', max: 44, horizon: 166, bob: [482, 258],
    sky: ['#1fa6ec', '#7fdcff', '#e6fbff'], sea: ['#48e3d6', '#18acc4', '#0a6a8c'], glint: '#ffffff', sun: [130, 52, 26, '#ffffff'] },
  { id: 'deep', name: 'Open Sea', max: 69, horizon: 176, bob: [490, 266],
    sky: ['#2a1f55', '#b4507a', '#ffad62'], sea: ['#4d5a9a', '#283a72', '#0e1a3e'], glint: '#ffc785', sun: [560, 176, 54, '#ffcf7a'] },
  { id: 'abyss', name: 'Abyssal Trench', max: 99, horizon: 170, bob: [496, 268],
    sky: ['#02040c', '#0a1330', '#1c2754'], sea: ['#0f2b4c', '#06172e', '#020812'], glint: '#9fdcff', sun: [420, 58, 22, '#e9f1ff'] },
];
const fishSpotFor = (lv) => FISH_SPOTS.find((s) => lv <= s.max) || FISH_SPOTS[FISH_SPOTS.length - 1];
const FISH_BOX = { x: 70, y: 58, h: 194 };
function fishPlatform(id) {
  if (id === 'harbour') {
    let s = '<rect x="0" y="244" width="252" height="13" fill="#8c5c34"/><rect x="0" y="244" width="252" height="3" fill="#c08850"/><rect x="0" y="257" width="252" height="4" fill="#3d2615"/>';
    for (let x = 12; x < 252; x += 30) s += `<rect x="${x}" y="246" width="2" height="11" fill="#5f3c20" opacity=".7"/>`;
    for (const x of [16, 92, 168, 236]) s += `<rect x="${x}" y="259" width="15" height="70" fill="#5a381f"/><rect x="${x}" y="259" width="4" height="70" fill="#7c5131"/>`;
    s += '<rect x="226" y="226" width="20" height="18" rx="3" fill="#4a2f1b"/><rect x="224" y="222" width="24" height="7" rx="3" fill="#6b4428"/>';   // bollard
    s += '<path d="M178 244 l3 -26 h30 l3 26z" fill="#6f8aa0"/><rect x="179" y="214" width="34" height="6" rx="2" fill="#93acc0"/><path d="M190 216 q6 -14 16 -10" fill="none" stroke="#c9d3dc" stroke-width="2"/>';   // bucket
    return s;
  }
  if (id === 'reef') {
    return '<path d="M0 320 V236 Q36 222 84 230 Q140 220 196 234 Q240 244 262 270 L276 320Z" fill="#6b5a4e"/>'
      + '<path d="M0 238 Q36 224 84 232 Q140 222 196 236 Q232 244 250 260" fill="none" stroke="#a48c76" stroke-width="5" stroke-linecap="round"/>'
      + '<path d="M40 264 q30 -10 60 2 M150 270 q26 -8 52 6" stroke="#4e4036" stroke-width="4" fill="none" stroke-linecap="round"/>'
      + '<ellipse cx="120" cy="250" rx="22" ry="5" fill="#2fb8c6" opacity=".7"/><circle cx="214" cy="246" r="7" fill="#ff7a8a"/><circle cx="224" cy="250" r="5" fill="#ffb15a"/>';
  }
  if (id === 'deep') {
    let s = '<rect x="0" y="244" width="270" height="10" fill="#a06a3c"/><rect x="0" y="254" width="270" height="70" fill="#4a2c18"/>';
    for (let y = 262; y < 320; y += 12) s += `<rect x="0" y="${y}" width="270" height="2" fill="#2e1a0d" opacity=".8"/>`;
    s += '<rect x="0" y="196" width="262" height="7" rx="3" fill="#7a4a26"/>';
    for (let x = 10; x <= 250; x += 40) s += `<rect x="${x}" y="200" width="6" height="45" fill="#6a3e1e"/>`;
    s += '<circle cx="60" cy="286" r="11" fill="#2a1a0e"/><circle cx="60" cy="286" r="7" fill="#ffb867" opacity=".55"/><circle cx="170" cy="286" r="11" fill="#2a1a0e"/><circle cx="170" cy="286" r="7" fill="#ffb867" opacity=".55"/>';
    return s;
  }
  // abyss: the bow of your ship, with a lantern
  return '<path d="M0 244 H230 Q262 244 286 226 L292 232 Q270 262 250 320 H0Z" fill="#3a2414"/><path d="M0 244 H230 Q262 244 286 226" fill="none" stroke="#7a4a26" stroke-width="6"/>'
    + '<rect x="30" y="160" width="6" height="86" fill="#5a3a1e"/><rect x="22" y="150" width="22" height="18" rx="4" fill="#2a1a0e"/><circle cx="33" cy="160" r="6" fill="#ffd27a"/><circle cx="33" cy="160" r="46" fill="url(#sp-lamp)"/>';
}
function fishFar(sp) {
  const r = spRng(31), H = sp.horizon;
  if (sp.id === 'harbour') {
    return `<path d="M500 ${H} Q540 ${H - 34} 600 ${H - 38} Q660 ${H - 44} 740 ${H - 26} Q780 ${H - 18} 800 ${H - 16} V${H}Z" fill="#5d8db0" opacity=".9"/>`
      + `<path d="M598 ${H - 40} h22 l-4 -52 h-14z" fill="#f4f1ea"/><path d="M600 ${H - 58} h18 v8 h-18z M603 ${H - 78} h12 v8 h-12z" fill="#e0475a"/><rect x="602" y="${H - 102}" width="14" height="10" fill="#ffd36a"/><path d="M598 ${H - 104} h22 l-11 -10z" fill="#3c4a5c"/>`
      + `<path d="M0 ${H} Q60 ${H - 18} 130 ${H - 14} Q190 ${H - 22} 260 ${H} Z" fill="#6f9cbd" opacity=".8"/>`
      + spGulls([[330, 60, 1], [360, 74, 0.8], [520, 46, 0.7]], '#2c4a66');
  }
  if (sp.id === 'reef') {
    return `<path d="M600 ${H + 2} Q650 ${H - 22} 720 ${H - 20} Q770 ${H - 16} 800 ${H} Z" fill="#f2deb0"/>` + spPalm(680, H - 12, 0.9) + spPalm(735, H - 10, 0.7)
      + `<path d="M0 ${H} Q50 ${H - 12} 120 ${H - 6} Q150 ${H - 4} 170 ${H}Z" fill="#7fc6b0" opacity=".6"/>` + spGulls([[420, 70, 0.9], [452, 58, 0.7]], '#1f5f7a');
  }
  if (sp.id === 'deep') {
    return `<path d="M320 ${H} l8 -18 h44 l8 18z" fill="#2a1d3c"/><rect x="346" y="${H - 52}" width="3" height="34" fill="#2a1d3c"/><path d="M349 ${H - 50} q18 12 0 28z M349 ${H - 46} q-14 10 0 22z" fill="#3a2a50"/>`
      + spGulls([[200, 80, 1], [230, 92, 0.8], [640, 70, 0.8]], '#2a1530');
  }
  return spStars(7, 70, H - 20) + `<path d="M520 70 Q560 30 620 46 Q680 20 740 50 Q800 44 800 80 Q760 100 700 92 Q640 110 580 96 Q520 100 520 70Z" fill="#141c38" opacity=".9"/>`
    + `<g class="sp-bolt"><path d="M676 92 l-14 30 h12 l-16 34" fill="none" stroke="#cfe6ff" stroke-width="3" stroke-linejoin="round"/></g>`;
}
function fishBg(sp) {
  const H = sp.horizon, [sx, sy, sr, sc] = sp.sun;
  let s = `<defs>${spGrad('sp-sky', sp.sky)}${spGrad('sp-sea', sp.sea)}${spGlow('sp-sun', sc)}${spGlow('sp-lamp', '#ffcf70')}</defs>`;
  s += `<rect width="800" height="${H + 2}" fill="url(#sp-sky)"/>`;
  s += `<circle cx="${sx}" cy="${sy}" r="${sr * 3.2}" fill="url(#sp-sun)"/><circle cx="${sx}" cy="${sy}" r="${sr}" fill="${sc}"/>`;
  if (sp.id === 'abyss') s += `<circle cx="${sx - 7}" cy="${sy - 5}" r="5" fill="#c9d3e6"/><circle cx="${sx + 8}" cy="${sy + 6}" r="3.4" fill="#c9d3e6"/>`;
  s += sp.id === 'abyss' ? '' : spClouds(sp.id.length * 11, sp.id === 'deep' ? 5 : 6, 30, H - 50, sp.id === 'deep' ? '#ffd6c0' : '#ffffff', sp.id === 'deep' ? 0.35 : 0.8);
  s += fishFar(sp);
  s += `<rect y="${H}" width="800" height="${320 - H}" fill="url(#sp-sea)"/><rect y="${H}" width="800" height="2" fill="#fff" opacity=".35"/>`;
  s += spGlints(sp.id.length * 7, 46, H + 4, sp.glint, sp.id === 'reef' ? null : sx, 220);
  if (sp.id === 'reef') s += '<g opacity=".45"><path d="M560 320 q10 -40 30 -50 q-6 24 8 30 q10 -30 30 -34 q-8 30 4 54z" fill="#ff7a8a"/><path d="M680 320 q-4 -30 14 -44 q2 26 16 20 q4 -22 22 -24 q-6 26 2 48z" fill="#ffb15a"/><path d="M330 320 q6 -24 22 -30 q-2 18 10 22 q8 -20 22 -20 q-8 22 0 28z" fill="#b48cff"/></g>';
  if (sp.id === 'abyss') { const r = spRng(5); for (let i = 0; i < 26; i++) s += `<circle cx="${Math.round(280 + r() * 520)}" cy="${Math.round(H + 30 + r() * 120)}" r="${(r() * 2 + 1).toFixed(1)}" fill="#6ff3ff" opacity="${(r() * 0.5 + 0.2).toFixed(2)}"/>`; }
  s += fishPlatform(sp.id);
  return s;
}
const waveStrip = (c, o, amp, y) => {
  let d = `M0 ${y}`;
  for (let x = 0; x <= 1600; x += 40) d += ` q10 ${-amp} 20 0 q10 ${amp} 20 0`;
  return `<svg viewBox="0 0 1600 60" preserveAspectRatio="none"><path d="${d} V60 H0Z" fill="${c}" opacity="${o}"/></svg>`;
};

/* ---------------------------------------------------------------- galley */
const COOK_BOX = { x: 236, y: 58, h: 194 };
const DISH_COL = { grilled_minnow: '#e9a35a', bass_stew: '#d9744a', crab_dumplings: '#f3dcb0', spirit_ramen: '#f0c96a', marlin_steak: '#c4553e',
  eel_bowl: '#a8653a', takoyaki: '#c98a3e', angler_feast: '#b24a5a', sea_king_curry: '#e0a020', sunbread: '#e8c47a', moon_onigiri: '#f2f2f2',
  pepper_stew: '#d3342a', melon_sorbet: '#9fe6c8', thunder_ramen: '#f5d24a', star_feast: '#ffd75e' };
function panAt(pose) {
  SPOT_RIG.__probe = { cook: 0.3 };
  try { drawAvatar(avState(), POSES[pose], 0, { uid: '__probe' }); } catch (e) { /* rig busy */ }
  const p = SPOT_RIG.__probe.pan;
  delete SPOT_RIG.__probe;
  return p ? rigToSpot(COOK_BOX, p) : [400, 200];
}
function galleyBg(pan) {
  const [px, py] = pan, top = Math.round(py + 7);
  let s = `<defs>${spGrad('sp-wall', ['#5c3b25', '#3d2617'])}${spGrad('sp-port', ['#5fb6ea', '#bfe6f7', '#2a9fd0', '#0b5d8a'])}${spGlow('sp-lamp', '#ffc260')}${spGlow('sp-fire', '#ff8a2a')}</defs>`;
  s += '<rect width="800" height="320" fill="url(#sp-wall)"/>';
  for (let x = 0; x < 800; x += 44) s += `<rect x="${x}" y="0" width="2" height="250" fill="#2a190e" opacity=".55"/><rect x="${x + 2}" y="0" width="1" height="250" fill="#7a5236" opacity=".35"/>`;
  s += '<rect y="0" width="800" height="26" fill="#2b1a0f"/><rect y="26" width="800" height="4" fill="#6a4529"/>';
  // porthole with the sea outside
  s += '<circle cx="120" cy="118" r="50" fill="#b88a3e"/><circle cx="120" cy="118" r="42" fill="url(#sp-port)"/><path d="M78 124 q14 -6 28 0 t28 0 t28 0" fill="none" stroke="#e8f8ff" stroke-width="2" opacity=".6"/><circle cx="120" cy="118" r="42" fill="none" stroke="#7a5a26" stroke-width="5"/>';
  for (let i = 0; i < 8; i++) { const a = (i / 8) * Math.PI * 2; s += `<circle cx="${(120 + Math.cos(a) * 46).toFixed(1)}" cy="${(118 + Math.sin(a) * 46).toFixed(1)}" r="2.6" fill="#e8c27a"/>`; }
  // lantern
  s += '<path d="M372 30 v16" stroke="#1a1008" stroke-width="2"/><rect x="362" y="46" width="20" height="26" rx="5" fill="#2a1a0e"/><rect x="366" y="50" width="12" height="18" rx="3" fill="#ffd27a"/><circle cx="372" cy="60" r="70" fill="url(#sp-lamp)" opacity=".7"/>';
  // shelf with one jar per seasoning (lit once you have found it)
  s += '<rect x="500" y="118" width="270" height="8" fill="#7a4e2c"/><rect x="500" y="126" width="270" height="3" fill="#2a190e"/>';
  SPICE_ORDER.forEach((k, i) => {
    const x = 516 + i * 43, sp = SPICES[k], got = S.found[sp.item], on = S.kitchen.spice === k;
    s += `<g class="jar ${on ? 'on' : ''}"><rect x="${x}" y="84" width="28" height="34" rx="6" fill="${got ? sp.col : '#2a2f3a'}" opacity="${got ? 0.95 : 0.6}" stroke="#1a1008" stroke-width="2"/><rect x="${x + 4}" y="78" width="20" height="8" rx="2" fill="#6a4529" stroke="#1a1008" stroke-width="2"/><rect x="${x + 5}" y="90" width="5" height="20" rx="2" fill="#fff" opacity=".35"/></g>`;
  });
  // hanging utensils
  s += '<path d="M560 30 v26 M600 30 v20 M640 30 v30" stroke="#1a1008" stroke-width="2"/><circle cx="560" cy="66" r="11" fill="#3b3f4a" stroke="#1a1008" stroke-width="2"/><rect x="598" y="48" width="4" height="26" fill="#9aa3b5"/><ellipse cx="600" cy="76" rx="7" ry="5" fill="#9aa3b5"/><path d="M636 60 h8 l-2 24 h-4z" fill="#9aa3b5"/>';
  // floor, barrel
  s += '<rect y="250" width="800" height="70" fill="#2e1c10"/><rect y="250" width="800" height="3" fill="#6a4529"/>';
  for (let x = 30; x < 800; x += 90) s += `<rect x="${x}" y="253" width="2" height="67" fill="#1a1008" opacity=".6"/>`;
  s += '<rect x="34" y="196" width="60" height="58" rx="10" fill="#6a4226"/><rect x="34" y="206" width="60" height="5" fill="#2a1a0e"/><rect x="34" y="238" width="60" height="5" fill="#2a1a0e"/>';
  // counter with a chopping board on the right
  s += '<rect x="560" y="214" width="240" height="106" fill="#5a3a22"/><rect x="560" y="206" width="240" height="10" fill="#8c5c34"/><rect x="596" y="196" width="96" height="10" rx="3" fill="#c9965a"/><path d="M712 200 l40 -6 l2 4 l-40 6z" fill="#cfd6e4"/><rect x="706" y="199" width="10" height="6" rx="2" fill="#3b2414"/>';
  // the iron range under your pan: hob, oven door with the fire, chimney pipe
  const L = Math.round(px - 70), W = 150;
  s += `<rect x="${L + 112}" y="0" width="16" height="${top - 4}" fill="#1c1e24"/><rect x="${L + 108}" y="${top - 30}" width="24" height="8" fill="#2a2d35"/>`;
  s += `<rect x="${L}" y="${top}" width="${W}" height="${320 - top}" fill="#24262d"/><rect x="${L}" y="${top}" width="6" height="${320 - top}" fill="#33363f"/>`;
  s += `<rect x="${L - 6}" y="${top - 6}" width="${W + 12}" height="10" rx="2" fill="#3b3f4a"/><rect x="${L - 6}" y="${top - 6}" width="${W + 12}" height="3" rx="1" fill="#565b68"/>`;
  s += `<ellipse cx="${L + 112}" cy="${top - 7}" rx="16" ry="3.5" fill="#15171c"/>`;
  s += `<rect x="${L + 22}" y="${top + 22}" width="74" height="40" rx="6" fill="#120c08" stroke="#4a4e5a" stroke-width="4"/><rect class="sp-ember" x="${L + 28}" y="${top + 28}" width="62" height="28" rx="4" fill="#ff8a2a"/>`;
  s += `<path d="M${L + 30} ${top + 54} q8 -14 14 -4 q6 -16 14 -2 q8 -12 14 0 q6 -10 12 4" fill="#ffd27a" class="sp-ember"/>`;
  s += `<rect x="${L + 104}" y="${top + 24}" width="34" height="5" rx="2" fill="#565b68"/><rect x="${L + 10}" y="${top + 80}" width="${W - 20}" height="4" fill="#3b3f4a"/>`;
  s += `<circle class="sp-glow" cx="${Math.round(px)}" cy="${top + 6}" r="76" fill="url(#sp-fire)"/>`;
  return s;
}

/* ---------------------------------------------------------------- voyages */
// sky, sea, glint, landmark at the destination, weather
const VOY_LOOK = {
  coastal:    { sky: ['#4fa8e6', '#a9dcf6', '#fff0d0'], sea: ['#37bfe0', '#1a86b8', '#0b4f7d'], glint: '#fff', land: 'palm' },
  merchant:   { sky: ['#62b4ee', '#b9e4fa', '#fff4dc'], sea: ['#2ca8d6', '#157fb0', '#0a4a76'], glint: '#fff', land: 'town' },
  cove:       { sky: ['#3a2a5c', '#d0607a', '#ffc27a'], sea: ['#3a5a92', '#22396c', '#0e1c40'], glint: '#ffc785', land: 'skull' },
  current:    { sky: ['#5d6b80', '#93a3b8', '#c9d3de'], sea: ['#3d6a86', '#244a66', '#0f2a40'], glint: '#e6f2ff', land: 'whirl' },
  stormbelt:  { sky: ['#141a2a', '#2c3550', '#4a5470'], sea: ['#2a4054', '#16283a', '#081420'], glint: '#bcd6ff', land: 'spire', storm: true },
  ghostfleet: { sky: ['#06130f', '#123026', '#28503f'], sea: ['#163a34', '#0b2420', '#04120f'], glint: '#9effd0', land: 'ghosts', fog: true },
  worldsedge: { sky: ['#0a0420', '#2a1060', '#7a2a9a'], sea: ['#2a2a7a', '#18184e', '#08082a'], glint: '#ffb8ff', land: 'edge', stars: true },
};
function voyLand(kind, H) {
  switch (kind) {
    case 'palm': return `<path d="M650 ${H + 2} Q700 ${H - 26} 760 ${H - 22} Q790 ${H - 16} 800 ${H}Z" fill="#f2deb0"/>` + spPalm(715, H - 16, 0.85);
    case 'town': return `<path d="M620 ${H} V${H - 20} H800 V${H}Z" fill="#c9a074"/>` + [[630, 34, '#e86a4a'], [662, 46, '#f4f1ea'], [700, 30, '#4a8ac8'], [736, 54, '#f4f1ea'], [770, 38, '#e8b04a']].map(([x, h, c]) => `<rect x="${x}" y="${H - 20 - h}" width="28" height="${h}" fill="${c}"/><path d="M${x - 3} ${H - 20 - h} l17 -14 l17 14z" fill="#7a3a2a"/>`).join('');
    case 'skull': return `<path d="M640 ${H} Q646 ${H - 70} 720 ${H - 82} Q794 ${H - 70} 800 ${H}Z" fill="#3c3046"/><ellipse cx="704" cy="${H - 50}" rx="10" ry="12" fill="#120c18"/><ellipse cx="736" cy="${H - 50}" rx="10" ry="12" fill="#120c18"/><path d="M700 ${H} q20 -26 40 0z" fill="#120c18"/><rect x="760" y="${H - 120}" width="3" height="44" fill="#222"/><path d="M763 ${H - 120} h26 v16 h-26z" fill="#111"/><circle cx="776" cy="${H - 112}" r="4" fill="#eee"/>`;
    case 'whirl': return [36, 26, 16, 7].map((r, i) => `<ellipse cx="700" cy="${H + 30}" rx="${r * 2.4}" ry="${r * 0.6}" fill="none" stroke="#cfe6f2" stroke-width="2.4" opacity="${0.25 + i * 0.15}"/>`).join('');
    case 'spire': return `<path d="M670 ${H} L690 ${H - 110} L702 ${H - 60} L716 ${H - 140} L734 ${H} Z" fill="#1c2232"/><path d="M752 ${H} L766 ${H - 70} L782 ${H}Z" fill="#232a3c"/>`;
    case 'ghosts': return [[640, 1], [720, 0.8]].map(([x, s]) => `<g opacity=".55" fill="#9effd0"><path d="M${x} ${H} l${10 * s} ${-14 * s} h${60 * s} l${10 * s} ${14 * s}z"/><rect x="${x + 38 * s}" y="${H - 74 * s}" width="${3 * s}" height="${60 * s}"/><path d="M${x + 41 * s} ${H - 70 * s} q${26 * s} ${18 * s} 0 ${44 * s}z"/></g>`).join('');
    default: return `<rect x="700" y="${H - 4}" width="100" height="${320 - H}" fill="#120830"/><path d="M700 ${H} q10 60 0 150" stroke="#ffb8ff" stroke-width="3" fill="none" opacity=".6"/><circle cx="740" cy="${H - 70}" r="34" fill="#ff8ae6" opacity=".25"/>`;
  }
}
function voyBg(id) {
  const L = VOY_LOOK[id] || VOY_LOOK.coastal, H = 176;
  let s = `<defs>${spGrad('sp-sky', L.sky)}${spGrad('sp-sea', L.sea)}</defs><rect width="800" height="${H + 2}" fill="url(#sp-sky)"/>`;
  if (L.stars) s += spStars(3, 90, H - 10);
  if (!L.stars && !L.storm && !L.fog) s += spClouds(id.length * 13, 6, 30, H - 50, '#fff', 0.75);
  if (L.storm) s += spClouds(17, 9, 20, 90, '#0a0e18', 0.9) + '<g class="sp-bolt"><path d="M420 40 l-16 40 h14 l-18 44" fill="none" stroke="#e6f0ff" stroke-width="3" stroke-linejoin="round"/></g>';
  s += voyLand(L.land, H);
  // home port on the left
  s += `<path d="M0 ${H + 2} Q40 ${H - 30} 110 ${H - 24} Q140 ${H - 16} 150 ${H}Z" fill="#7aa36a"/><rect x="40" y="${H - 44}" width="26" height="22" fill="#e9dcc0"/><path d="M36 ${H - 44} l17 -14 l17 14z" fill="#a84a3a"/><rect x="110" y="${H - 4}" width="60" height="5" fill="#8c5c34"/>`;
  s += `<rect y="${H}" width="800" height="${320 - H}" fill="url(#sp-sea)"/><rect y="${H}" width="800" height="2" fill="#fff" opacity=".3"/>`;
  s += spGlints(id.length * 5, 50, H + 4, L.glint, null, 0);
  if (L.fog) s += `<rect y="${H - 40}" width="800" height="60" fill="#bfffe6" opacity=".12"/><rect y="${H + 30}" width="800" height="40" fill="#bfffe6" opacity=".08"/>`;
  return s;
}
function shipSVG(sail) {
  return `<svg class="ship-svg" viewBox="0 0 120 110" aria-hidden="true">
    <path d="M12 74 H108 L96 98 Q60 106 24 98Z" fill="#5a3418" stroke="#1a0e06" stroke-width="3" stroke-linejoin="round"/><rect x="14" y="70" width="92" height="7" fill="#8c5c34" stroke="#1a0e06" stroke-width="2"/>
    <rect x="57" y="10" width="5" height="62" fill="#4a2c14" stroke="#1a0e06" stroke-width="1.5"/>
    <path d="M62 14 Q92 30 88 62 L62 62Z" fill="#f2ead8" stroke="#1a0e06" stroke-width="2.4" stroke-linejoin="round"/><path d="M64 36 Q86 40 86 48 L64 48Z" fill="${sail}" opacity=".85"/>
    <path d="M57 18 Q34 34 38 62 L57 62Z" fill="#e6dcc4" stroke="#1a0e06" stroke-width="2.4" stroke-linejoin="round"/>
    <path d="M62 6 l14 4 l-14 4z" fill="${sail}" stroke="#1a0e06" stroke-width="1.5"/></svg>`;
}

/* ================================================================ scene block */
// One scene per skill page that has one. box: where the avatar stands. The strip under it carries the farm numbers.
function spotStats(skill) {
  const a = S.action && S.action.skill === skill ? findAction(skill, S.action.id) : null;
  if (!a) {
    if (S.action) return `<div class="spot-idle">${ui('info')}<span>Busy with <b>${esc(SKILLS[S.action.skill].name)} · ${esc(findAction(S.action.skill, S.action.id).name)}</b>. Pick a card below to switch.</span></div>`;
    return `<div class="spot-idle">${ui('play')}<span>${{ fishing: 'Pick a fish below to cast your line.', cooking: 'Pick a recipe below to light the stove.', voyaging: 'Pick a voyage below to set sail.', woodcutting: 'Pick a tree below to start chopping.' }[skill]}</span></div>`;
  }
  const f = farmRates(skill, a), outId = a.out ? Object.keys(a.out)[0] : null;
  return `<div class="spot-run"><span class="pbar"><i data-nowfill></i></span><span class="fm-time" data-nowtime></span></div>
    <div class="spot-stats">${outId ? stat('Per hour', fmt(f.itemsh)) : stat('Voyages / hour', fmt(f.per))}${stat('XP / hour', fmt(f.xph))}${stat('Next level', '—', 'data-nextlv')}
      ${a.in ? stat('Can make', fmt(f.can), 'data-canmake') + stat('Runs out', fmtTime(f.runout), 'data-runout') : ''}${outId ? stat('Owned', fmt(familyCount(outId)), `data-fam="${outId}"${QUALITY[skill] ? ` title="Every version: plain, ${skill === 'fishing' ? 'shiny' : 'perfect and seasoned'}"` : ''}`) : ''}
      ${gbtn('Stop', 'stop', 'data-stop', 'dark sm')}</div>`;
}
function spotHTML(skill) {
  const a = S.action && S.action.skill === skill ? findAction(skill, S.action.id) : null;
  let cls = '', bg = '', layers = '', name = '', sub = '';
  if (skill === 'fishing') {
    const best = SKILLS.fishing.actions.filter((x) => x.level <= skillLv('fishing')).pop();
    const sp = fishSpotFor((a || best).level);
    cls = 'sp-' + sp.id; bg = fishBg(sp); name = sp.name; sub = a ? a.name : 'Waiting for a cast';
    layers = `<div class="spot-wave mid">${waveStrip(sp.sea[1], 0.55, 4, 30)}</div>${spotAvatar(FISH_BOX, a ? 'fish' : '')}<div class="spot-wave front">${waveStrip(sp.sea[2], 0.8, 6, 26)}</div>`;
    SPOT.fish = sp;
  } else if (skill === 'cooking') {
    const pan = panAt('cook');
    cls = 'sp-galley'; bg = galleyBg(pan); name = 'Ship galley'; sub = a ? a.name : 'Stove is cold';
    const sk = S.kitchen.spice && isUnlocked('feature:spices') ? SPICES[S.kitchen.spice] : null;
    layers = `${spotAvatar(COOK_BOX, a ? 'cook' : '')}<div class="flames" style="left:${(pan[0] / 8).toFixed(2)}%;top:${((pan[1] + 4) / 3.2).toFixed(2)}%"><i></i><i></i><i></i><i></i><i></i></div>
      <div class="steam" style="left:${(pan[0] / 8).toFixed(2)}%;top:${((pan[1] - 8) / 3.2).toFixed(2)}%"><i></i><i></i><i></i><i></i></div>
      ${sk ? `<div class="shaker" style="--sc:${sk.col};left:${((pan[0] + 92) / 8).toFixed(2)}%;top:${((pan[1] - 6) / 3.2).toFixed(2)}%" title="${esc(sk.name)}: ${count(sk.item) ? 'goes into every dish' : 'none left'}">${gi(sk.icon)}<b>${fmt(count(sk.item))}</b></div>` : ''}`;
    SPOT.pan = pan;
  } else {
    const look = (a || SKILLS.voyaging.actions[0]).id;
    cls = 'sp-voy'; bg = voyBg(look); name = a ? a.name : 'Home port'; sub = a ? 'At sea' : 'Docked';
    layers = `<div class="spot-wave mid">${waveStrip((VOY_LOOK[look] || VOY_LOOK.coastal).sea[1], 0.5, 4, 30)}</div>
      <div class="ship ${a ? 'sailing' : ''}" style="left:14%"><div class="ship-bob">${shipSVG(rc('seas'))}<div class="ship-av">${avatarSVG(null, { ctx: 'preview', pose: 'swagger' })}</div></div><i class="wake"></i></div>
      <div class="spot-wave front">${waveStrip((VOY_LOOK[look] || VOY_LOOK.coastal).sea[2], 0.8, 6, 26)}</div>`;
    if (VOY_LOOK[look] && VOY_LOOK[look].fog) layers += '<div class="fogband"></div>';
  }
  const last = SPOT['last_' + skill];
  return `<section class="win spot-win" style="--rc:${rc('seas')}">
    <div class="spot ${cls} ${a ? 'on' : ''}" data-spot="${skill}">
      <svg class="spot-bg" viewBox="0 0 800 320" preserveAspectRatio="none" aria-hidden="true">${bg}</svg>
      ${layers}
      <svg class="spot-fx" viewBox="0 0 800 320" preserveAspectRatio="none" aria-hidden="true"><g data-spotfx></g></svg>
      <div class="spot-pops"></div>
      <div class="spot-hud"><span class="sh-name"><small>${esc(name)}</small><b>${esc(sub)}</b></span>${last ? `<span class="sh-last">${last}</span>` : '<span class="sh-last" hidden></span>'}</div>
    </div>
    <div class="spot-bar">${spotStats(skill)}</div>
    ${skill === 'cooking' ? spiceRackHTML() : ''}
  </section>`;
}
UIX.realmScene.push((realm, skill) => (['fishing', 'cooking', 'voyaging'].includes(skill) ? spotHTML(skill) : ''));

/* ---------------------------------------------------------------- per-frame */
const spotNow = () => document.querySelector('.spot[data-spot]');
const actFrac = (skill) => {
  if (!S.action || S.action.skill !== skill) return -1;
  const a = findAction(skill, S.action.id);
  return a ? Math.min(1, S.action.prog / actionTime(skill, a)) : -1;
};
UPD.push(() => { for (const el of $$('[data-fam]')) setText(el, fmt(familyCount(el.dataset.fam))); });
function setPose(av, pose) { if (av && (av.dataset.pose || '') !== pose) { if (pose) av.dataset.pose = pose; else delete av.dataset.pose; } }
UPD.push(() => {
  const el = spotNow();
  if (!el) return;
  const kind = el.dataset.spot, k = actFrac(kind), t = performance.now() / 1000;
  el.classList.toggle('on', k >= 0);
  if (kind === 'fishing') {
    const av = el.querySelector('.spot-av svg.avatar'), rig = av && SPOT_RIG[av.dataset.uid], g = el.querySelector('[data-spotfx]');
    if (!rig || !g) return;
    if (!(av.dataset.reel > performance.now())) setPose(av, k >= 0 ? 'fish' : '');
    if (k < 0 || !rig.tip) { if (g.innerHTML) g.innerHTML = ''; return; }
    const sp = SPOT.fish || FISH_SPOTS[0], [tx, ty] = rigToSpot(FISH_BOX, rig.tip);
    const bite = k > 0.78 ? (k - 0.78) / 0.22 : 0;
    const bx = sp.bob[0] + Math.sin(t * 0.7) * 3, by = sp.bob[1] + Math.sin(t * 2.3) * 1.6 + (bite ? 3 + Math.sin(t * 28) * 2.4 * bite : 0);
    const sag = Math.max(ty, by) + 26 - bite * 22;
    let s = `<path d="M${tx.toFixed(1)} ${ty.toFixed(1)} Q${((tx + bx) / 2 + 10).toFixed(1)} ${sag.toFixed(1)} ${bx.toFixed(1)} ${by.toFixed(1)}" fill="none" stroke="#eef4ff" stroke-width="1.2" opacity=".85"/>`;
    for (let i = 0; i < 3; i++) {
      const ph = (t * (bite ? 1.6 : 0.6) + i / 3) % 1;
      s += `<ellipse cx="${bx.toFixed(1)}" cy="${(sp.bob[1] + 3).toFixed(1)}" rx="${(6 + ph * 26).toFixed(1)}" ry="${(1.6 + ph * 5).toFixed(1)}" fill="none" stroke="#fff" stroke-width="1.4" opacity="${((1 - ph) * (bite ? 0.8 : 0.45)).toFixed(2)}"/>`;
    }
    s += `<ellipse cx="${bx.toFixed(1)}" cy="${(by + 3).toFixed(1)}" rx="5.5" ry="2" fill="#000" opacity=".2"/><circle cx="${bx.toFixed(1)}" cy="${by.toFixed(1)}" r="5" fill="#ff4d5e" stroke="#0a0c11" stroke-width="1.6"/><path d="M${(bx - 5).toFixed(1)} ${by.toFixed(1)} h10" stroke="#fff" stroke-width="2"/><path d="M${bx.toFixed(1)} ${(by - 5).toFixed(1)} v-5" stroke="#0a0c11" stroke-width="1.6"/>`;
    if (bite > 0.4) s += `<text x="${bx.toFixed(1)}" y="${(by - 18).toFixed(1)}" class="bite-mark" text-anchor="middle">!</text>`;
    g.innerHTML = s;
  } else if (kind === 'cooking') {
    const av = el.querySelector('.spot-av svg.avatar'), rig = av && SPOT_RIG[av.dataset.uid];
    setPose(av, k >= 0 ? 'cook' : '');
    if (rig) {
      rig.cook = k >= 0 ? k : null;
      const a = k >= 0 && findAction('cooking', S.action.id);
      rig.food = a && a.out ? DISH_COL[Object.keys(a.out)[0]] || '#e9a35a' : null;
    }
  } else if (kind === 'voyaging') {
    const ship = el.querySelector('.ship');
    if (!ship) return;
    const p = k < 0 ? 0 : k, left = 14 + p * 62;
    ship.style.left = left.toFixed(2) + '%';
    if (SPOT.voyK != null && k >= 0 && k < SPOT.voyK - 0.5) retrigger(ship, 'reset');
    SPOT.voyK = k;
  }
});

/* ---------------------------------------------------------------- pops */
// A short animated label / icon inside the scene, at scene coordinates (x, y).
// Pops still playing are carried over when the page re-renders (a first shiny re-renders it at once).
const LIVE_POPS = [];
function spotPop(html, x, y, cls, life) {
  const el = spotNow(), box = el && el.querySelector('.spot-pops');
  if (!box || document.hidden) return null;
  const p = document.createElement('div');
  p.className = 'spop ' + (cls || '');
  p.style.left = (x / 8).toFixed(2) + '%';
  p.style.top = (y / 3.2).toFixed(2) + '%';
  p.innerHTML = html;
  box.appendChild(p);
  while (box.children.length > 10) box.firstChild.remove();
  const rec = { el: p, t0: performance.now(), spot: el.dataset.spot };
  LIVE_POPS.push(rec);
  setTimeout(() => { p.remove(); const i = LIVE_POPS.indexOf(rec); if (i >= 0) LIVE_POPS.splice(i, 1); }, life || 1800);
  return p;
}
UPD.push(() => {
  if (!LIVE_POPS.length) return;
  const el = spotNow(), box = el && el.querySelector('.spot-pops');
  if (!box) return;
  const now = performance.now();
  for (const r of LIVE_POPS) if (!r.el.isConnected && r.spot === el.dataset.spot) {
    r.el.style.animationDelay = `${-(now - r.t0) / 1000}s`;   // resume where it was
    box.appendChild(r.el);
  }
});
const spotPx = () => { const el = spotNow(); return el ? el.clientWidth / 800 : 1; };
function setLast(skill, html) {
  SPOT['last_' + skill] = html;
  const el = spotNow();
  const L = el && el.dataset.spot === skill && el.querySelector('.sh-last');
  if (L) { L.hidden = false; L.innerHTML = html; retrigger(L, 'bump'); }
}
on('catch', (d) => {
  const id = d.shiny ? variantId(d.fish, 's') : d.fish, it = ITEMS[id];
  setLast('fishing', `<small>${d.record ? 'New record' : d.trophy ? 'Trophy catch' : 'Last catch'}</small><b>${esc(it.name)}</b><em>${fmtKg(d.kg)}</em>`);
  const el = spotNow();
  if (!el || el.dataset.spot !== 'fishing') return;
  const sp = SPOT.fish || FISH_SPOTS[0], m = spotPx();
  const leap = spotPop(`<span class="tile-art">${itemIc(id)}</span>`, sp.bob[0], sp.bob[1] - 8, 'leap' + (d.shiny ? ' shiny' : ''), 1300);
  if (leap) { leap.style.setProperty('--tx', Math.round((214 - sp.bob[0]) * m) + 'px'); leap.style.setProperty('--ty', Math.round(-30 * m) + 'px'); leap.style.setProperty('--jy', Math.round(-120 * m) + 'px'); }
  spotPop('', sp.bob[0], sp.bob[1] + 2, 'splash', 800);
  spotPop(`<b>${esc(it.name)}</b><small>${fmtKg(d.kg)}</small>`, sp.bob[0] - 40, sp.bob[1] - 70, 'tag' + (d.shiny ? ' gold' : ''), 1700);
  if (d.record) spotPop(`${ui('record')}New record!`, 330, 70, 'banner', 2200);
  if (d.shiny) spotPop(`${ui('shiny')}Shiny!`, 400, 52, 'banner shiny', 2600);
  const av = el.querySelector('.spot-av svg.avatar');
  if (av) { av.dataset.reel = performance.now() + 700; avPlay(av, [['reel', 130, 'out'], ['reel', 260], ['fish', 380]]); }
});
on('action', (d) => {
  const el = spotNow();
  if (d.skill === 'cooking') {
    const ids = Object.keys(d.gains).filter((k) => ITEMS[k] && baseOf(k) === Object.keys(d.act.out || {})[0]);
    const top = ids.sort((a, b) => rarity(b) - rarity(a))[0];
    if (!top) return;
    const it = ITEMS[top];
    setLast('cooking', `<small>${it.q === 'p' ? 'Perfect!' : 'Last dish'}</small><b>${esc(it.name)}</b>${it.type === 'food' ? `<em>${ui('hp')}${foodHeal(top)}</em>` : ''}`);
    if (!el || el.dataset.spot !== 'cooking') return;
    const [px, py] = SPOT.pan || [400, 200];
    spotPop(`<span class="tile-art">${itemIc(top)}</span>`, px, py - 30, 'dish' + (it.q === 'p' ? ' perfect' : ''), 1400);
    spotPop(`<b>+${fmt(d.gains[top])} ${esc(it.name)}</b>${it.type === 'food' ? `<small>${ui('hp')}heals ${foodHeal(top)}</small>` : ''}`, px + 80, py - 70, 'tag' + (it.q === 'p' ? ' gold' : ''), 1700);
    if (it.q === 'p') spotPop(`${ui('perfect')}Perfect!`, px, 64, 'banner perfect', 2200);
    if (it.spice) { const p = spotPop('<i></i><i></i><i></i><i></i><i></i><i></i>', px + 6, py - 26, 'sprinkle', 900); if (p) p.style.setProperty('--sc', SPICES[it.spice].col); }
  } else if (d.skill === 'voyaging') {
    setLast('voyaging', `<small>Last voyage</small><b>${esc(d.act.name)}</b><em>${ui('gold')}${fmt(d.gold)}</em>`);
    if (!el || el.dataset.spot !== 'voyaging') return;
    spotPop(`<span class="tile-art">${ui('open')}</span>`, 660, 190, 'dish chest', 1500);
    spotPop(`<b>+${fmt(d.gold)} gold</b><small>${Object.keys(d.gains).slice(0, 3).map((k) => esc(ITEMS[k].name)).join(' · ')}</small>`, 600, 120, 'tag gold', 2000);
  }
});

/* ================================================================ spice rack */
function spiceRackHTML() {
  if (!isUnlocked('feature:spices')) return `<div class="spice-rack locked" title="${esc(lockedNote('feature:spices'))}">${ui('lock')}<span><b>Spice rack</b><small>${esc(lockedNote('feature:spices').replace('Locked. ', ''))}</small></span></div>`;
  const cur = S.kitchen.spice;
  return `<div class="spice-rack"><span class="sr-h"><b>Spice rack</b><small>${cur ? `Every dish uses 1 ${esc(SPICES[cur].name)}` : 'Pick one: each dish uses 1'}</small></span>
    <div class="sr-slots">${SPICE_ORDER.map((k) => {
      const sp = SPICES[k], got = S.found[sp.item], n = count(sp.item), src = sourcesOf(sp.item)[0];
      if (!got) return `<button class="sr-slot locked" data-spice="${k}" title="Not found yet${src ? ': ' + esc(src.text) : ''}">${tile(sp.item, null, { cls: 'xs', unknown: true })}<span><b>???</b><small>${src ? esc(src.text) : 'Not found yet'}</small></span></button>`;
      return `<button class="sr-slot ${cur === k ? 'on' : ''} ${n ? '' : 'empty'}" data-spice="${k}" style="--sc:${sp.col}" title="${esc(sp.adj)} dishes: ${esc(spiceText(k))}">${tile(sp.item, fmt(n), { cls: 'xs' })}<span><b>${esc(sp.adj)}</b><small>${esc(spiceText(k))}</small></span></button>`;
    }).join('')}</div></div>`;
}
document.addEventListener('click', (ev) => {
  const t = ev.target.closest('[data-spice]');
  if (!t || t.disabled) return;
  if (t.classList.contains('locked')) { retrigger(t, 'shake'); return; }
  pickSpice(t.dataset.spice);
  const k = S.kitchen.spice;
  toast(k ? `${SPICES[k].adj} dishes: ${spiceText(k)}.` : 'Spice rack cleared: dishes come out plain.', 'good');
});

/* ================================================================ action cards */
UIX.actLines.push((skill, a) => {
  if (skill === 'fishing' && a.out) {
    const fish = Object.keys(a.out)[0], n = S.quality.log[variantId(fish, 's')] || 0, rec = S.quality.rec[fish];
    return `<div class="ac-note q-line"><span class="${n ? 'got' : ''}" title="Chance per catch of a Shiny ${esc(ITEMS[fish].name)}. Grows with this fish's mastery.">${ui('shiny')}Shiny ${fmtRate(shinyChance('fishing', a))}${n ? ` · ${fmt(n)} caught` : ''}</span>${rec ? `<span title="Your heaviest ${esc(ITEMS[fish].name)}">${ui('record')}${fmtKg(rec)}</span>` : ''}</div>`;
  }
  if (skill === 'cooking' && a.out) {
    const out = Object.keys(a.out)[0], n = S.quality.log[variantId(out, 'p')] || 0, sp = spiceFor('cooking', out);
    return `<div class="ac-note q-line"><span class="${n ? 'got' : ''}" title="Chance per dish to come out Perfect (${ITEMS[out].type === 'food' ? 'heals 50% more' : 'buff 50% stronger'}). Grows with mastery and your level.">${ui('perfect')}Perfect ${pct(perfectChance('cooking', a))}${n ? ` · ${fmt(n)} made` : ''}</span>${sp ? `<span class="q-sp" style="--sc:${SPICES[sp].col}" title="${esc(spiceText(sp))}">${gi(SPICES[sp].icon)}${esc(SPICES[sp].adj)}</span>` : ''}</div>`;
  }
  if (a.extra && a.loot) return `<div class="ac-io"><small>Cargo</small>${a.extra.map(([k, c]) => tile(k, fmtRate(c), { cls: 'xs ' + (S.found[k] ? '' : 'dim') })).join('')}</div>`;
  return '';
});

/* ================================================================ logs */
const Q_TITLE = { shiny: 'Shiny Log', perfect: 'Perfect Log' };
function qTile(e, skill) {
  if (e.n) { ensureVariant(e.vid); return tile(e.vid, '×' + fmt(e.n), { cls: 'xs', title: `${ITEMS[e.vid].name} · ${fmt(e.n)} so far` }); }
  const seen = skillLv(skill) >= e.act.level || S.found[e.base];
  return tile(e.base, null, { cls: 'xs ql-miss', unknown: !seen, title: seen ? `${qKind(skill) === 'shiny' ? 'Shiny' : 'Perfect'} ${ITEMS[e.base].name}: not yet` : `Unlocks at ${SKILLS[skill].name} ${e.act.level}` });
}
function qLogHTML(skill, compact) {
  const E = qEntries(skill), kind = qKind(skill), have = E.filter((e) => e.n).length, T = qTiers(skill);
  const odds = kind === 'shiny' ? 'Each catch can be shiny. Mastery of a fish raises its odds.' : 'Any dish can come out perfect. Mastery and your level raise the odds.';
  return `<section class="win qlog ${kind}" style="--rc:${rc(SKILLS[skill].realm)}">${hdr(compact ? `${Q_TITLE[kind]} · ${SKILLS[skill].name}` : Q_TITLE[kind], `${have} / ${E.length}`)}
    <div class="ql-grid">${E.map((e) => qTile(e, skill)).join('')}</div>
    <span class="pbar gold"><i style="width:${(have / E.length) * 100}%"></i></span>
    <ul class="ql-tiers">${T.map((t) => `<li class="${t.on ? 'on' : ''}"><b>${t.need}</b><span>${esc(t.text)}</span>${t.on ? ui('check') : ''}</li>`).join('')}</ul>
    ${compact ? '' : `<p class="muted small">${odds}</p>`}</section>`;
}
UIX.realmSide.unshift((realm, skill) => (QUALITY[skill] && skillOpen(skill) ? qLogHTML(skill) : ''));
UIX.collectionTop.push(() => {
  const ks = Object.keys(QUALITY).filter(skillOpen);
  if (!ks.length) return '';
  return `${hdr('Shiny & Perfect', 'gathering skills bring up shiny finds, crafting skills make perfect ones · full logs pay bonuses')}<div class="qlog-row">${ks.map((k) => qLogHTML(k, true)).join('')}</div>`;
});

/* ================================================================ inspector */
UIX.inspectorAny.push((id) => {
  const it = ITEMS[id];
  if (it.type === 'spice') {
    const k = it.spice;
    return `${attrList([['spices', 'In a dish', spiceText(k)]])}${isUnlocked('feature:spices') ? `<div class="dt-cta">${gbtn(S.kitchen.spice === k ? 'On the spice rack' : 'Put on the spice rack', 'spices', `data-spice="${k}"`, S.kitchen.spice === k ? 'dark' : '')}</div>` : `<p class="muted small">${esc(lockedNote('feature:spices'))}</p>`}`;
  }
  if (!it.variant) return '';
  const rows = [];
  if (it.q === 's') rows.push(['shiny', 'Shiny', `A trophy: worth ${fmt(it.value)} gold. Your first of each fills the Shiny Log.`]);
  if (it.q === 'p') rows.push(['perfect', 'Perfect', it.type === 'food' ? 'Heals 50% more; its seasoning is 50% stronger' : 'Its buff is 50% stronger']);
  if (it.spice) rows.push(['spices', SPICES[it.spice].adj, spiceText(it.spice, spicePower(it.q === 'p'))]);
  return attrList(rows) + (it.type === 'food' ? '<p class="muted small">Battle food that runs out is replaced by another version of the same dish.</p>' : '');
});

/* ================================================================ battle */
UIX.stageMe.push(() => '<div class="spice-buffs" data-spicebuffs></div>');
let spiceSig = '';
UPD.push(() => {
  const box = document.querySelector('[data-spicebuffs]');
  if (!box) return;
  const by = {};
  for (const k in SPICE_RT) { const b = SPICE_RT[k]; if (!by[b.spice] || by[b.spice].t < b.t) by[b.spice] = b; }
  const sig = Object.keys(by).map((s) => s + Math.ceil(by[s].t)).join();
  if (sig === spiceSig && box.childElementCount === Object.keys(by).length) return;
  spiceSig = sig;
  box.innerHTML = Object.keys(by).map((s) => `<span class="sbuff" style="--sc:${SPICES[s].col}" title="${esc(SPICES[s].adj)}: ${esc(spiceText(s))}">${gi(SPICES[s].icon)}${esc(SPICES[s].adj)}<b>${Math.ceil(by[s].t)}s</b></span>`).join('');
});
on('spicebuff', (d) => { if (inBattleView()) floatAt($('[data-portrait="player"]'), `${gi(SPICES[d.spice].icon)}${esc(SPICES[d.spice].adj)}`, 'heal', 0, -46); });

/* ================================================================ celebrations */
on('quality', (d) => {
  const logged = ensureVariant(variantId(d.base, d.q)), it = ITEMS[d.item] || logged;
  if (d.q === 's') {
    burst('Shiny catch!', `${it.name} · Shiny Log ${d.have} / ${d.total}`, itemIc(d.item), '#ffd75e');
    if (d.first) toast(`New in the Shiny Log: ${logged.name} (${d.have} / ${d.total}).`, 'rare');
  } else if (d.first) {
    burst('Perfect dish!', `${logged.name} · Perfect Log ${d.have} / ${d.total}`, itemIc(d.item), '#ffd75e');
  }
  sideDirty = true;
});
on('qtier', (d) => {
  burst(`${Q_TITLE[qKind(d.skill)]} bonus`, d.tier.text, ui(qKind(d.skill) === 'shiny' ? 'shiny' : 'perfect'), '#ffd75e');
  toast(`${Q_TITLE[qKind(d.skill)]} (${SKILLS[d.skill].name}) reached ${d.tier.need}: ${d.tier.text}.`, 'rare');
});

/* ================================================================ first look at the spice rack */
INTRO['feature:spices'] = { icon: () => ui('spices'), kicker: 'New in Cooking', title: 'The Spice Rack',
  text: 'The galley cook slides her spice box across the counter. "Plain fish fills you up. Seasoned fish wins fights."',
  points: [[() => ui('spices'), 'Pick a seasoning', 'Every dish you cook uses one and comes out seasoned. Run out and dishes come out plain.'],
           [() => ui('hp'), 'Battle buffs', 'Salt heals more, pepper hits harder, lemon guards, chili speeds you up...'],
           [() => ui('perfect'), 'Perfect dishes', 'Now and then a dish comes out Perfect: 50% stronger, and logged in the Perfect Log.']],
  go: 'realm:seas:cooking', btn: 'Open the spice rack' };
