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
  // the scene draws the line and the bobber itself, from the rod tip recorded here
  const baseRod = rodSVG;
  rodSVG = function (hand, a, t, P) {
    if (!SPOT_CUR) return baseRod(hand, a, t, P);
    const pts = rodPts(hand, a, (P && P.rb) || 0);
    SPOT_CUR.tip = pts[pts.length - 1];
    return baseRod(hand, a, t, P, true);
  };
  // the food (in the dish's colour) only while a dish is cooking
  const basePan = panSVG;
  panSVG = function (hand, a, t, P, food) {
    if (!SPOT_CUR) return basePan(hand, a, t, P, food);
    SPOT_CUR.pan = panAt0(hand, a);
    return basePan(hand, a, t, P, SPOT_CUR.cook == null || SPOT_CUR.cook < 0 ? null : SPOT_CUR.food || '#ffb36b');
  };
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
// gulls glide about their spot and beat their wings (anim-seas.css), each on its own rhythm
const spGulls = (pts, c) => pts.map(([x, y, s], i) => `<g class="sp-gull" style="animation-delay:${-i * 3.7}s"><path d="M${x - 9 * s} ${y} q${4.5 * s} ${-6 * s} ${9 * s} 0 q${4.5 * s} ${-6 * s} ${9 * s} 0" fill="none" stroke="${c}" stroke-width="${1.8 * s}" stroke-linecap="round" style="animation-delay:${-i * 0.23}s"/></g>`).join('');
const spPalm = (x, y, s) => `<path d="M${x} ${y} q${-6 * s} ${-40 * s} ${8 * s} ${-78 * s}" fill="none" stroke="#5a3d22" stroke-width="${6 * s}" stroke-linecap="round"/>`
  + [[-46, -8], [-30, -26], [6, -34], [36, -18], [44, 6]].map(([dx, dy]) => `<path d="M${x + 8 * s} ${y - 78 * s} q${dx * 0.5 * s} ${(dy - 18) * s} ${dx * s} ${(dy + 14) * s}" fill="none" stroke="#2e8a4e" stroke-width="${7 * s}" stroke-linecap="round"/>`).join('');

/* ---------------------------------------------------------------- fishing spots */
// bob: where the float lands, kept above the cast bar the fishing page draws over the scene's lower part
const FISH_SPOTS = [
  { id: 'harbour', name: 'Harbour Pier', max: 19, horizon: 172, bob: [488, 214],
    sky: ['#4fa8e6', '#9fd8f6', '#ffe8c6'], sea: ['#37bfe0', '#1a86b8', '#0b4f7d'], glint: '#ffffff', sun: [640, 66, 30, '#fff4cc'] },
  { id: 'reef', name: 'Coral Reef', max: 44, horizon: 166, bob: [492, 208],
    sky: ['#1fa6ec', '#7fdcff', '#e6fbff'], sea: ['#48e3d6', '#18acc4', '#0a6a8c'], glint: '#ffffff', sun: [130, 52, 26, '#ffffff'] },
  { id: 'deep', name: 'Open Sea', max: 69, horizon: 176, bob: [500, 218],
    sky: ['#2a1f55', '#b4507a', '#ffad62'], sea: ['#4d5a9a', '#283a72', '#0e1a3e'], glint: '#ffc785', sun: [560, 176, 54, '#ffcf7a'] },
  { id: 'abyss', name: 'Abyssal Trench', max: 99, horizon: 170, bob: [506, 212],
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
  s += sp.id === 'abyss' ? '' : '<g class="sp-clouds">' + spClouds(sp.id.length * 11, sp.id === 'deep' ? 5 : 6, 30, H - 50, sp.id === 'deep' ? '#ffd6c0' : '#ffffff', sp.id === 'deep' ? 0.35 : 0.8) + '</g>';
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
  s += '<clipPath id="sp-portc"><circle cx="120" cy="118" r="42"/></clipPath>';
  s += '<circle cx="120" cy="118" r="50" fill="#b88a3e"/><circle cx="120" cy="118" r="42" fill="url(#sp-port)"/><g clip-path="url(#sp-portc)"><g class="sp-portsea"><path d="M22 124 q14 -6 28 0 t28 0 t28 0 t28 0 t28 0 t28 0 t28 0" fill="none" stroke="#e8f8ff" stroke-width="2" opacity=".6"/><path d="M8 140 q14 -5 28 0 t28 0 t28 0 t28 0 t28 0 t28 0 t28 0 t28 0" fill="none" stroke="#e8f8ff" stroke-width="1.6" opacity=".35"/></g></g><circle cx="120" cy="118" r="42" fill="none" stroke="#7a5a26" stroke-width="5"/>';
  for (let i = 0; i < 8; i++) { const a = (i / 8) * Math.PI * 2; s += `<circle cx="${(120 + Math.cos(a) * 46).toFixed(1)}" cy="${(118 + Math.sin(a) * 46).toFixed(1)}" r="2.6" fill="#e8c27a"/>`; }
  // lantern
  // (it swings a little with the ship: anim-seas.css)
  s += '<g class="sp-lantern"><path d="M372 30 v16" stroke="#1a1008" stroke-width="2"/><rect x="362" y="46" width="20" height="26" rx="5" fill="#2a1a0e"/><rect class="sp-flame" x="366" y="50" width="12" height="18" rx="3" fill="#ffd27a"/><circle cx="372" cy="60" r="70" fill="url(#sp-lamp)" opacity=".7"/></g>';
  // shelf with one jar per seasoning (lit once you have found it)
  s += '<rect x="500" y="118" width="270" height="8" fill="#7a4e2c"/><rect x="500" y="126" width="270" height="3" fill="#2a190e"/>';
  SPICE_ORDER.forEach((k, i) => {
    const x = 516 + i * 43, sp = SPICES[k], got = S.found[sp.item], on = S.kitchen.spice === k;
    s += `<g class="jar ${on ? 'on' : ''}"><rect x="${x}" y="84" width="28" height="34" rx="6" fill="${got ? sp.col : '#2a2f3a'}" opacity="${got ? 0.95 : 0.6}" stroke="#1a1008" stroke-width="2"/><rect x="${x + 4}" y="78" width="20" height="8" rx="2" fill="#6a4529" stroke="#1a1008" stroke-width="2"/><rect x="${x + 5}" y="90" width="5" height="20" rx="2" fill="#fff" opacity=".35"/></g>`;
  });
  // hanging utensils
  s += '<g class="sp-hang" style="transform-origin:560px 30px"><path d="M560 30 v26" stroke="#1a1008" stroke-width="2"/><circle cx="560" cy="66" r="11" fill="#3b3f4a" stroke="#1a1008" stroke-width="2"/></g>'
    + '<g class="sp-hang" style="transform-origin:600px 30px;animation-delay:-.7s"><path d="M600 30 v20" stroke="#1a1008" stroke-width="2"/><rect x="598" y="48" width="4" height="26" fill="#9aa3b5"/><ellipse cx="600" cy="76" rx="7" ry="5" fill="#9aa3b5"/></g>'
    + '<g class="sp-hang" style="transform-origin:640px 30px;animation-delay:-1.3s"><path d="M640 30 v30" stroke="#1a1008" stroke-width="2"/><path d="M636 60 h8 l-2 24 h-4z" fill="#9aa3b5"/></g>';
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
    case 'whirl': return [36, 26, 16, 7].map((r, i) => `<ellipse class="sp-whirl" cx="700" cy="${H + 30}" rx="${r * 2.4}" ry="${r * 0.6}" fill="none" stroke="#cfe6f2" stroke-width="2.4" stroke-dasharray="${(r * 2.2).toFixed(0)} ${(r * 0.9).toFixed(0)}" style="animation-duration:${(2 + i * 0.8).toFixed(1)}s" opacity="${0.25 + i * 0.15}"/>`).join('');
    case 'spire': return `<path d="M670 ${H} L690 ${H - 110} L702 ${H - 60} L716 ${H - 140} L734 ${H} Z" fill="#1c2232"/><path d="M752 ${H} L766 ${H - 70} L782 ${H}Z" fill="#232a3c"/>`;
    case 'ghosts': return [[640, 1], [720, 0.8]].map(([x, s]) => `<g opacity=".55" fill="#9effd0"><path d="M${x} ${H} l${10 * s} ${-14 * s} h${60 * s} l${10 * s} ${14 * s}z"/><rect x="${x + 38 * s}" y="${H - 74 * s}" width="${3 * s}" height="${60 * s}"/><path d="M${x + 41 * s} ${H - 70 * s} q${26 * s} ${18 * s} 0 ${44 * s}z"/></g>`).join('');
    default: return `<rect x="700" y="${H - 4}" width="100" height="${320 - H}" fill="#120830"/><path d="M700 ${H} q10 60 0 150" stroke="#ffb8ff" stroke-width="3" fill="none" opacity=".6"/><circle cx="740" cy="${H - 70}" r="34" fill="#ff8ae6" opacity=".25"/>`;
  }
}
function voyBg(id) {
  const L = VOY_LOOK[id] || VOY_LOOK.coastal, H = 176;
  let s = `<defs>${spGrad('sp-sky', L.sky)}${spGrad('sp-sea', L.sea)}</defs><rect width="800" height="${H + 2}" fill="url(#sp-sky)"/>`;
  if (L.stars) s += spStars(3, 90, H - 10);
  if (!L.stars && !L.storm && !L.fog) s += `<g class="sp-clouds">${spClouds(id.length * 13, 6, 30, H - 50, '#fff', 0.75)}</g>`;
  if (L.storm) s += `<g class="sp-clouds storm">${spClouds(17, 9, 20, 90, '#0a0e18', 0.9)}</g>` + '<g class="sp-bolt"><path d="M420 40 l-16 40 h14 l-18 44" fill="none" stroke="#e6f0ff" stroke-width="3" stroke-linejoin="round"/></g>';
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
    <g class="sl-main"><path d="M62 14 Q92 30 88 62 L62 62Z" fill="#f2ead8" stroke="#1a0e06" stroke-width="2.4" stroke-linejoin="round"/><path d="M64 36 Q86 40 86 48 L64 48Z" fill="${sail}" opacity=".85"/><path d="M66 20 Q84 32 82 58" fill="none" stroke="#fff" stroke-width="2" opacity=".5"/></g>
    <g class="sl-fore"><path d="M57 18 Q34 34 38 62 L57 62Z" fill="#e6dcc4" stroke="#1a0e06" stroke-width="2.4" stroke-linejoin="round"/></g>
    <path d="M60 10 L18 72 M60 10 L104 72" stroke="#1a0e06" stroke-width=".9" opacity=".55"/>
    <path class="sl-flag" d="M62 6 l14 4 l-14 4z" fill="${sail}" stroke="#1a0e06" stroke-width="1.5"/></svg>`;
}
// Scenery that slides past while sailing: far islands on the horizon and things on the water
// (two copies side by side in a 1600-wide strip, scrolled by half its width: a seamless loop).
function voyStrip(id, layer) {
  const L = VOY_LOOK[id] || VOY_LOOK.coastal, r = spRng(id.length * 37 + (layer === 'far' ? 1 : 9)), out = [];
  if (layer === 'far') {
    const col = mixHex(L.sea[1], L.sky[2], 0.42), dark = mixHex(L.sea[2], L.sky[1], 0.35);
    for (let i = 0; i < 4; i++) out.push([70 + i * 200 + r() * 90, 26 + r() * 30, 14 + r() * 22, r()]);
    const isle = ([x, w, h, q]) => {
      switch (L.land) {
        case 'spire': return `<path d="M${x - w} 60 L${x - w * 0.4} ${60 - h * 1.6} L${x - w * 0.1} ${60 - h} L${x + w * 0.25} ${60 - h * 2.1} L${x + w} 60Z" fill="${dark}"/>`;
        case 'ghosts': return `<path d="M${x - w} 60 Q${x} ${60 - h * 0.8} ${x + w} 60Z" fill="${dark}" opacity=".8"/><path d="M${x - 6} ${60 - h * 0.5} l-3 ${-h} M${x + 8} ${60 - h * 0.5} l4 ${-h * 0.7}" stroke="${dark}" stroke-width="2.4"/>`;
        case 'edge': return `<path d="M${x - w * 0.5} 60 L${x - w * 0.2} ${60 - h * 1.8} L${x + w * 0.1} 60Z M${x + w * 0.1} 60 L${x + w * 0.35} ${60 - h * 1.1} L${x + w * 0.6} 60Z" fill="#ff8ae6" opacity=".35"/>`;
        case 'whirl': return `<path d="M${x - w} 60 Q${x - w * 0.6} ${60 - h * 0.6} ${x - w * 0.1} ${60 - h * 0.7} Q${x + w * 0.5} ${60 - h * 0.5} ${x + w} 60Z" fill="${col}" opacity=".7"/>`;
        default: {
          let s = `<path d="M${x - w} 60 Q${x - w * 0.5} ${60 - h * 1.1} ${x} ${60 - h} Q${x + w * 0.6} ${60 - h * 0.9} ${x + w} 60Z" fill="${col}"/>`;
          if (L.land === 'palm' && q < 0.6) s += `<path d="M${x + 4} ${60 - h + 2} q-2 -12 3 -20" stroke="${dark}" stroke-width="2" fill="none"/><path d="M${x + 7} ${60 - h - 18} q-8 -4 -12 2 M${x + 7} ${60 - h - 18} q8 -5 12 1 M${x + 7} ${60 - h - 18} q1 -7 -4 -9" stroke="${dark}" stroke-width="2.4" fill="none" stroke-linecap="round"/>`;
          if (L.land === 'town' && q < 0.7) s += `<rect x="${x - 8}" y="${60 - h - 6}" width="7" height="8" fill="${dark}"/><rect x="${x + 2}" y="${60 - h - 9}" width="6" height="11" fill="${dark}"/>`;
          return s;
        }
      }
    };
    return out.map((p) => isle(p) + isle([p[0] + 800, p[1], p[2], p[3]])).join('');
  }
  // the water: buoys, rocks with foam, barrels, a far sail (spooky / starry routes have their own)
  const kinds = { stormbelt: ['rock', 'rock', 'buoy'], ghostfleet: ['wisp', 'mast', 'barrel'], worldsedge: ['shard', 'shard', 'rock'], cove: ['rock', 'barrel', 'buoy'] }[id] || ['buoy', 'rock', 'boat', 'barrel'];
  for (let i = 0; i < 3; i++) out.push([120 + i * 260 + r() * 120, 18 + r() * 24, kinds[Math.floor(r() * kinds.length)], 0.7 + r() * 0.5, -r() * 3]);
  const thing = ([x, y, k, s, dl]) => {
    let d;
    switch (k) {
      case 'buoy': d = `<path d="M-6 0 L0 -20 L6 0Z" fill="#e8463a" stroke="#1a0e06" stroke-width="1.6"/><path d="M-3.6 -8 h7.2" stroke="#fff" stroke-width="3"/><path d="M0 -20 v-5" stroke="#1a0e06" stroke-width="1.6"/><circle cy="-27" r="2.4" fill="#ffd36a"/><ellipse rx="10" ry="2.4" fill="#fff" opacity=".55"/>`; break;
      case 'rock': d = `<path d="M-16 2 Q-12 -14 -2 -16 Q10 -14 16 2Z" fill="${mixHex(L.sea[2], '#3a3a44', 0.5)}" stroke="#0a0c11" stroke-width="1.4"/><path d="M-9 -9 q5 -4 10 -3" stroke="#fff" stroke-width="1.4" opacity=".25" fill="none"/><ellipse rx="20" ry="3" fill="#fff" opacity=".5"/>`; break;
      case 'barrel': d = `<g transform="rotate(-12)"><rect x="-7" y="-12" width="14" height="13" rx="3" fill="#8c5c34" stroke="#1a0e06" stroke-width="1.4"/><path d="M-7 -8 h14 M-7 -3 h14" stroke="#3d2615" stroke-width="1.4"/></g><ellipse rx="10" ry="2" fill="#fff" opacity=".45"/>`; break;
      case 'boat': d = `<path d="M-12 -2 h24 l-4 5 h-16z" fill="#4a2c14"/><path d="M0 -3 v-20 l11 17z" fill="#f2ead8" opacity=".9"/>`; break;
      case 'mast': d = `<path d="M-14 2 L-6 -6 L8 -4 L14 2Z" fill="#163a34"/><path d="M-2 -5 l-6 -26" stroke="#1d4a42" stroke-width="2.4"/><path d="M-8 -30 q10 6 4 16" fill="#9effd0" opacity=".35"/>`; break;
      case 'wisp': d = `<circle cy="-14" r="9" fill="#9effd0" opacity=".18"/><circle cy="-14" r="3.4" fill="#d4ffe8"/>`; break;
      default: d = `<path d="M0 -26 L6 -6 L0 2 L-6 -6Z" fill="#ff8ae6" opacity=".75" stroke="#ffd6f6" stroke-width="1"/><circle cy="-12" r="12" fill="#ff8ae6" opacity=".15"/>`;
    }
    return `<g transform="translate(${r1(x)},${r1(y)}) scale(${r1(s)})"><g class="vb" style="animation-delay:${dl.toFixed(1)}s">${d}</g></g>`;
  };
  return out.map((p) => thing(p) + thing([p[0] + 800, ...p.slice(1)])).join('');
}
// The deck crew's weather: gulls, rain, ghost lights, shooting stars (anim-seas.css draws and moves them).
function voyWeather(id) {
  const L = VOY_LOOK[id] || VOY_LOOK.coastal, gull = (c) => `<svg viewBox="-12 -8 24 10"><path d="M-10 0 q5 -7 10 0 q5 -7 10 0" fill="none" stroke="${c}" stroke-width="2" stroke-linecap="round"/></svg>`;
  if (L.storm) return '<div class="voy-rain"></div><div class="voy-rain far"></div><div class="voy-flash"></div>';
  if (L.fog) return `<div class="voy-wisps">${'<i></i>'.repeat(4)}</div>`;
  if (L.stars) return `<div class="voy-shoot">${'<i></i>'.repeat(3)}</div>`;
  const c = id === 'cove' ? '#2a1530' : id === 'current' ? '#3a4656' : '#2c4a66';
  return `<div class="voy-birds">${[0, 1, 2].map((i) => `<i style="animation-delay:${-i * 5.3}s;top:${10 + i * 7}%"><b style="animation-delay:${-i * 0.9}s">${gull(c)}</b></i>`).join('')}</div>`;
}

/* ================================================================ scene block */
// One scene per skill page that has one. box: where the avatar stands. The strip under it carries the farm numbers.
function spotStats(skill) {
  const a = S.action && S.action.skill === skill ? findAction(skill, S.action.id) : null;
  if (!a) {
    if (S.action) return `<div class="spot-idle">${ui('info')}<span>Busy with <b>${esc(SKILLS[S.action.skill].name)} · ${esc(findAction(S.action.skill, S.action.id).name)}</b>. Pick another one to switch.</span></div>`;
    return `<div class="spot-idle">${ui('play')}<span>${{ fishing: 'Pick a fishing spot to cast your line.', cooking: 'Pick a dish to light the stove.', voyaging: 'Pick a voyage below to set sail.', woodcutting: 'Pick a tree to start chopping.' }[skill]}</span></div>`;
  }
  const f = farmRates(skill, a), outId = a.out ? Object.keys(a.out)[0] : null;
  return `<div class="spot-run"><span class="pbar"><i data-nowfill></i></span><span class="fm-time" data-nowtime></span></div>
    <div class="spot-stats">${outId ? stat('Per hour', fmt(f.itemsh)) : stat('Voyages / hour', fmt(f.per))}${stat('XP / hour', fmt(f.xph))}${stat('Next level', '—', 'data-nextlv')}
      ${a.in ? stat('Can make', fmt(f.can), 'data-canmake') + stat('Runs out', fmtTime(f.runout), 'data-runout') : ''}${outId ? stat('Owned', fmt(familyCount(outId)), `data-fam="${outId}"${QUALITY[skill] ? ` title="Every version: plain, ${skill === 'fishing' ? 'shiny' : 'perfect and seasoned'}"` : ''}`) : ''}
      ${gbtn('Stop', 'stop', 'data-stop', 'dark sm')}</div>`;
}
// o.hud: HTML drawn over the scene in place of the stats strip under it (fishing / cooking, spot-ui.js).
function spotHTML(skill, o) {
  const a = S.action && S.action.skill === skill ? findAction(skill, S.action.id) : null;
  let cls = '', bg = '', layers = '', name = '', sub = '';
  if (skill === 'fishing') {
    const best = SKILLS.fishing.actions.filter((x) => x.level <= skillLv('fishing')).pop();
    const sp = fishSpotFor((a || (o && o.look) || best).level);
    cls = 'sp-' + sp.id; bg = fishBg(sp); name = sp.name; sub = a ? a.name : 'Waiting for a cast';
    // fish shadows cruise under the surface (glowing ones in the trench)
    layers = `<div class="sp-shoal ${sp.id}"><i></i><i></i><i></i></div><div class="spot-wave mid">${waveStrip(sp.sea[1], 0.55, 4, 30)}</div>${spotAvatar(FISH_BOX, a ? 'fish' : '')}<div class="spot-wave front">${waveStrip(sp.sea[2], 0.8, 6, 26)}</div>`;
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
    const look = (a || SKILLS.voyaging.actions[0]).id, VL = VOY_LOOK[look] || VOY_LOOK.coastal, rough = VL.storm ? 1.9 : 1;
    SPOT.voyLook = look;
    cls = 'sp-voy voy-' + look; bg = voyBg(look); name = a ? a.name : 'Home port'; sub = a ? 'At sea' : 'Docked';
    const strip = (k, h) => `<svg viewBox="0 0 1600 ${h}" preserveAspectRatio="none">${voyStrip(look, k)}</svg>`;
    layers = `<div class="voy-farw"><div class="voy-far">${strip('far', 60)}</div></div><div class="spot-wave mid">${waveStrip(VL.sea[1], 0.5, 4 * rough, 30)}</div><div class="voy-mid">${strip('mid', 50)}</div>
      <div class="ship ${a ? 'sailing' : ''}" style="left:${SPOT.voyLeft != null ? SPOT.voyLeft.toFixed(2) : 10}%"><div class="ship-bob">${shipSVG(rc('seas'))}<div class="ship-av">${avatarSVG(null, { ctx: 'preview', pose: a ? 'sail' : 'swagger' })}</div></div><i class="wake"></i></div>
      <div class="spot-wave front">${waveStrip(VL.sea[2], 0.8, 6 * rough, 26)}</div>${voyWeather(look)}`;
    if (VL.fog) layers += '<div class="fogband"></div><div class="fogband two"></div>';
  }
  const last = SPOT['last_' + skill];
  return `<section class="win spot-win" style="--rc:${rc('seas')}">
    <div class="spot ${cls} ${a ? 'on' : ''}" data-spot="${skill}">
      <svg class="spot-bg" viewBox="0 0 800 320" preserveAspectRatio="none" aria-hidden="true">${bg}</svg>
      ${layers}
      <svg class="spot-fx" viewBox="0 0 800 320" preserveAspectRatio="none" aria-hidden="true"><defs><filter id="sp-soft" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="2.4"/></filter></defs><g data-spotfx></g><g data-parts></g></svg>
      <div class="spot-pops"></div>
      <div class="spot-hud"><span class="sh-name"><small>${esc(o && o.hud ? o.kicker || '' : name)}</small><b>${esc(o && o.hud ? name : sub)}</b></span>${last ? `<span class="sh-last">${last}</span>` : '<span class="sh-last" hidden></span>'}</div>
      ${o && o.hud ? o.hud : ''}
    </div>
    ${o && o.hud ? '' : `<div class="spot-bar">${spotStats(skill)}</div>`}
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
const mixHex = (a, b, k) => {
  const A = parseInt(a.slice(1), 16), B = parseInt(b.slice(1), 16);
  return '#' + [16, 8, 0].map((s) => Math.round(((A >> s) & 255) + (((B >> s) & 255) - ((A >> s) & 255)) * k).toString(16).padStart(2, '0')).join('');
};

/* ---------------------------------------------------------------- particles */
// Small physical bits in a scene, in scene coordinates (800 x 320): wood chips and bark that tumble
// and bounce in the grass, leaves that flutter down, oil drops, sparks, steam puffs, impact flashes.
// Simulated every frame (gravity, a bounce on the floor, drag for leaves) and drawn in [data-parts].
const PARTS = [];
let partT = 0, partSpot = '';
function partAdd(p) {
  if (document.hidden || avCalm()) return;
  PARTS.push(Object.assign({ age: 0, vx: 0, vy: 0, r: 0, vr: 0, g: 900, life: 1, bounce: 1, seed: Math.random() * 6 }, p));
  if (PARTS.length > 90) PARTS.splice(0, PARTS.length - 90);
}
function partStep(p, dt) {
  if (p.kind === 'leaf') { p.vy = Math.min(p.vy + 90 * dt, 34); p.vx = p.vx * 0.97 + Math.sin(p.age * 2.6 + p.seed) * 70 * dt; }
  else if (p.kind === 'puff') { p.vx *= 0.97; p.size += (p.grow || 9) * dt; }
  else if (p.kind === 'fire') { p.vx *= 0.94; p.vy = p.vy * 0.96 + p.g * dt; }   // buoyant, slowed by the air
  else p.vy += p.g * dt;
  p.x += p.vx * dt; p.y += p.vy * dt; p.r += p.vr * dt;
  if (p.floor != null && p.y > p.floor && p.vy > 0) {
    p.y = p.floor;
    if (p.bounce-- > 0 && p.kind === 'chip') { p.vy *= -0.32; p.vx *= 0.45; p.vr *= 0.4; } else { p.vy = p.vx = p.vr = 0; }
  }
}
function partSVG(p) {
  const o = Math.min(1, (p.life - p.age) / (p.life * 0.3)), f = (v) => v.toFixed(1), at = `translate(${f(p.x)},${f(p.y)})`;
  switch (p.kind) {
    case 'chip': {   // a flat chip seen tumbling: it narrows and widens as it turns over
      const flip = p.vr ? Math.max(0.25, Math.abs(Math.cos(p.age * 9 + p.seed))) : 1;
      return `<g transform="${at} rotate(${f(p.r)}) scale(1,${flip.toFixed(2)})" opacity="${o.toFixed(2)}"><rect x="${f(-p.w / 2)}" y="${f(-p.h / 2)}" width="${f(p.w)}" height="${f(p.h)}" rx="1" fill="${p.col}" stroke="#2a1608" stroke-width="1.1"/></g>`;
    }
    case 'leaf': {
      const flut = Math.cos(p.age * 3.4 + p.seed);
      return `<g transform="${at} rotate(${f(p.r + Math.sin(p.age * 2.6 + p.seed) * 40)}) scale(${(0.35 + 0.65 * Math.abs(flut)).toFixed(2)},1)" opacity="${o.toFixed(2)}"><path d="M-6,0 Q0,-4.5 6,0 Q0,4.5 -6,0Z" fill="${p.col}" stroke="#1f3a16" stroke-width=".9"/></g>`;
    }
    case 'drop': {   // a streak along its motion
      const tx = p.x - p.vx * 0.025, ty = p.y - p.vy * 0.025;
      return `<path d="M${f(tx)} ${f(ty)} L${f(p.x)} ${f(p.y)}" stroke="#fff6c8" stroke-width="2" stroke-linecap="round" opacity="${o.toFixed(2)}"/>`;
    }
    case 'spark': return `<circle cx="${f(p.x + Math.sin(p.age * 12 + p.seed) * 2)}" cy="${f(p.y)}" r="1.8" fill="#ffd36a" opacity="${o.toFixed(2)}"/>`;
    case 'puff': return `<circle cx="${f(p.x)}" cy="${f(p.y)}" r="${f(p.size)}" fill="${p.col || '#fff'}" filter="url(#sp-soft)" opacity="${(o * (p.op || 0.3)).toFixed(2)}"/>`;
    case 'fire': {   // a tongue of flame: white-hot, then orange, red, and a wisp of smoke as it dies
      const k = p.age / p.life, c = k < 0.35 ? mixHex('#fff4b0', '#ffa424', k / 0.35) : k < 0.7 ? mixHex('#ffa424', '#e8341a', (k - 0.35) / 0.35) : mixHex('#e8341a', '#4a3a36', (k - 0.7) / 0.3);
      return `<ellipse cx="${f(p.x)}" cy="${f(p.y)}" rx="${f(p.size * (1 - k * 0.45))}" ry="${f(p.size * (1.35 - k * 0.5))}" fill="${c}" opacity="${((1 - k) * 0.95).toFixed(2)}"/>`;
    }
    case 'sizzle': {   // a hot spit of oil: a tiny white cross that pops
      const k = p.age / p.life, s = 1.2 + k * 2.6;
      return `<path d="M${f(p.x - s)} ${f(p.y)} h${f(2 * s)} M${f(p.x)} ${f(p.y - s)} v${f(2 * s)}" stroke="#fffbe6" stroke-width="1.3" stroke-linecap="round" opacity="${(1 - k).toFixed(2)}"/>`;
    }
    case 'coin': {   // a gold coin spinning edge-on and back
      const w = Math.max(0.6, 4.2 * Math.abs(Math.cos(p.age * 13 + p.seed)));
      return `<ellipse cx="${f(p.x)}" cy="${f(p.y)}" rx="${f(w)}" ry="4.2" fill="#ffd23f" stroke="#7a4a00" stroke-width="1.2" opacity="${o.toFixed(2)}"/>${w > 2.6 ? `<path d="M${f(p.x - w * 0.3)} ${f(p.y - 1.6)} v3" stroke="#fff6c8" stroke-width="1.1" opacity="${o.toFixed(2)}"/>` : ''}`;
    }
    case 'flash': {   // the bite: a white star of short lines bursting out, and a ring
      const k = p.age / p.life, r0 = 4 + k * 10, r1 = 12 + k * 18;
      let s = `<circle cx="${f(p.x)}" cy="${f(p.y)}" r="${f(6 + k * 14)}" fill="none" stroke="#fff" stroke-width="${f(3 * (1 - k))}" opacity="${(1 - k).toFixed(2)}"/>`;
      for (let i = 0; i < 8; i++) { const a = (i / 8) * Math.PI * 2 + 0.3, c = Math.cos(a), sn = Math.sin(a); s += `<path d="M${f(p.x + c * r0)} ${f(p.y + sn * r0)} L${f(p.x + c * r1)} ${f(p.y + sn * r1)}" stroke="#fff" stroke-width="2.4" stroke-linecap="round" opacity="${(1 - k).toFixed(2)}"/>`; }
      return s;
    }
    default: return '';
  }
}
UPD.push(() => {
  const now = performance.now() / 1000, dt = Math.min(0.05, Math.max(0, now - (partT || now)));
  partT = now;
  const el = spotNow(), g = el && el.querySelector('[data-parts]');
  if (!g || el.dataset.spot !== partSpot) { PARTS.length = 0; partSpot = el ? el.dataset.spot : ''; }
  if (!g) return;
  if (!PARTS.length) { if (g.firstChild) g.innerHTML = ''; return; }
  for (let i = PARTS.length - 1; i >= 0; i--) { const p = PARTS[i]; p.age += dt; if (p.age >= p.life) PARTS.splice(i, 1); else partStep(p, dt); }
  g.innerHTML = PARTS.map(partSVG).join('');
});
function setPose(av, pose) { if (av && (av.dataset.pose || '') !== pose) { if (pose) av.dataset.pose = pose; else delete av.dataset.pose; } }
/* ---------------------------------------------------------------- motion (animation pass) */
// The bite, shared by the angler's drive and the float: 1 to 3 nibbles (the float dips, the rod tip
// twitches), then the real pull (the float is dragged down, the line goes taut), then it goes under.
function fishBiteAt(u) {
  if (u < 0.8) return { dip: 0, taut: 0 };
  if (u >= 0.95) return { dip: 1, taut: 1, under: 1 };
  if (u >= 0.885) { const f = (u - 0.885) / 0.065; return { dip: 0.5 + 0.5 * f, taut: 0.7 + 0.3 * f, pull: 1, f }; }
  const n = 1 + ((SPOT.fishCyc || 0) % 3), seg = 0.085 / n, i = Math.min(n - 1, Math.floor((u - 0.8) / seg)), f = (u - 0.8 - i * seg) / seg;
  const nib = f < 0.4 ? Math.sin((f / 0.4) * Math.PI) : 0;
  return { dip: nib * 0.42, taut: 0.2 + nib * 0.35, nib, i };
}
// The angler (same signature and props as avatar.js's drive): the bite now follows the float.
POSE_DRIVE.fish = (u, t, B, calm) => {
  const P = keyPose(FISH_KEYS, u), w = win(u, 0.3, 0.36, 0.76, 0.8), b = fishBiteAt(u);
  // waiting: the rod tip bobs, the weight drifts from foot to foot, the line is reeled in a little
  P.R += Math.sin(t * 1.3) * 2.2 * w; P.t1 += Math.sin(t * 0.7) * 1.4 * w; P.dx += Math.sin(t * 0.7) * 1.6 * w; P.h += Math.sin(t * 0.5) * 2 * w;
  if (u > 0.5 && u < 0.7) P.cr = 40 + ((u - 0.5) / 0.2) * 1080;
  // a nibble: the rod tip twitches down and springs back, the head snaps towards the float
  if (b.nib) { P.R -= 6 * b.nib; P.rb += 0.12 * b.nib; P.n += 3 * b.nib; }
  // the pull: the rod is dragged down and shudders, the angler braces and leans back on it
  if (b.pull) {
    const j = calm ? 0 : Math.sin(t * 26) * 0.5 + Math.sin(t * 17) * 0.5;
    P.R -= 4 + 4 * b.f + 3 * j; P.rb += 0.14 + 0.12 * b.f + 0.06 * j; P.t1 += j * 1.2 + 2.5 * b.f; P.dx -= 2 * b.f;
  }
  const br = calm ? 0 : Math.sin(t * 2.2);
  P.t2 += br * 1.5; P.n -= br * 1.1;
  P.g = P.R - (P.aF[0] + P.aF[1]);
  return plantPose(P, B, { B: (J) => knobAt(add(J.aF[2], J.foreA.aF, 4.2 * B.w), J.foreA.aF + P.g, P.cr) });
};

// ---- voyaging: the deck hand. Sea legs (feet wide, leaning against the roll), hands on hips, every
// few seconds a hand shades the eyes to scan the horizon; pointing as the ship pushes off and when
// the landfall comes into view; a jumping cheer when the voyage pays out.
const SAIL_BASE = Object.assign({}, POSES.swagger, { lF: [15, -6], lB: [-17, 8], fF: 10, fB: -192, dy: 2, tw: 0.2 });
const SAILK = (o) => Object.assign({}, SAIL_BASE, o);
const SAIL_STAND = SAILK({ t1: 181, t2: -4, n: -2, h: -4 });
const SAIL_LOOK = SAILK({ t1: 183, t2: -5, n: -6, h: -9, aF: [150, 75], aB: [-44, 100] });
const SAIL_POINT = SAILK({ t1: 176, t2: 3, n: -4, h: -6, aF: [100, -6], aB: [-40, 80], tw: 0.5, lF: [24, -12], lB: [-14, 6] });
const SAIL_CHEER = SAILK({ t1: 183, t2: -5, n: -10, h: -12, aF: [166, -12], aB: [-162, 12], lF: [12, -8], lB: [-12, 8], expr: 'happy' });
POSE_DRIVE.sail = (u, t, B, calm) => {
  const arr = performance.now() / 1000 - (SPOT.voyArr || -99);
  const look = calm ? 0 : win((t / 9) % 1, 0.5, 0.58, 0.86, 0.94);
  let P = mixPose(SAIL_STAND, SAIL_LOOK, look);
  if (look) P.h += Math.sin(t * 1.1) * 3 * look;
  const pt = u > 0.7 ? win(u, 0.7, 0.8, 1.01, 1.02) : u < 0.08 ? win(u, -1, 0, 0.04, 0.08) : 0;
  if (pt) P = mixPose(P, SAIL_POINT, pt);
  if (arr < 1.7) {   // the cheer: arms up, two little jumps, then back to the rail
    const k = Math.min(1, arr / 0.2) * Math.min(1, (1.7 - arr) / 0.35);
    P = mixPose(P, SAIL_CHEER, ease.io(k));
    if (!calm) { P.air = Math.max(0, Math.sin(arr * 8)) * 9 * k; P.aF = [P.aF[0] + Math.sin(arr * 15) * 9 * k, P.aF[1]]; P.aB = [P.aB[0] - Math.sin(arr * 15 + 1) * 9 * k, P.aB[1]]; }
  }
  P.t1 += (SPOT.voyRoll || 0) * 0.7;
  const br = calm ? 0 : Math.sin(t * 2.2);
  P.t2 += br * 1.4; P.n -= br;
  return P;
};
{
  const base = driveU;
  driveU = function (name, t) {
    if (name !== 'sail') return base(name, t);
    const k = voyK();
    return k >= 0 ? Math.min(0.9999, k) : ((t / 6) % 1 + 1) % 1;
  };
}
POSES.sail = POSE_DRIVE.sail(0.3, 0, BODY, true);

// Voyages are expeditions (expeditions.js): the scene follows your first ship at sea.
const voyK = () => { const sh = S.exped && S.exped.ships[0]; return sh ? Math.max(0, Math.min(1, 1 - sh.left / sh.dur)) : -1; };
const SHIP_W = 0.16;   // the ship's width, share of the scene (anim-seas.css)
UPD.push(() => {
  const el = spotNow();
  if (!el) return;
  const kind = el.dataset.spot, k = kind === 'voyaging' ? voyK() : actFrac(kind), t = performance.now() / 1000, calm = avCalm(), r = Math.random, f1 = (v) => v.toFixed(1);
  el.classList.toggle('on', k >= 0);
  if (kind === 'fishing') {
    const av = el.querySelector('.spot-av svg.avatar'), rig = av && SPOT_RIG[av.dataset.uid], g = el.querySelector('[data-spotfx]');
    if (!rig || !g) return;
    setPose(av, k >= 0 ? 'fish' : '');
    if (k < 0 || !rig.tip) { if (g.innerHTML) g.innerHTML = ''; SPOT.fishU = null; SPOT.hang = null; return; }
    const u = driveU('fish', t), prevU = SPOT.fishU;
    if (prevU != null && u < prevU - 0.5) SPOT.fishCyc = (SPOT.fishCyc || 0) + 1;
    SPOT.fishU = u;
    const crossed = (x) => prevU != null && prevU < x && u >= x && u - prevU < 0.3;
    const sp = SPOT.fish || FISH_SPOTS[0], [tx, ty] = rigToSpot(FISH_BOX, rig.tip), wy = sp.bob[1] + 3;
    const dt = Math.min(0.05, Math.max(0.001, t - (SPOT.fishT || t - 0.016)));
    SPOT.fishT = t;
    // the float hanging under the rod tip swings like a pendulum, lagging behind the rod
    let H = SPOT.hang;
    if (!H) H = SPOT.hang = { x: tx, y: ty + 18, px: tx, py: ty + 18 };
    if (calm) { H.x = H.px = tx; H.y = H.py = ty + 18; } else {
      const nx = H.x + (H.x - H.px) * 0.93, ny = H.y + (H.y - H.py) * 0.93 + 1400 * dt * dt;
      H.px = H.x; H.py = H.y;
      const dx = nx - tx, dy = ny - ty, d = Math.hypot(dx, dy) || 1;
      H.x = tx + (dx / d) * 18; H.y = ty + (dy / d) * 18;
    }
    // ambient: now and then a fish jumps far out
    if (!calm && r() < dt / 16) spotPop('<i></i>', 380 + r() * 380, sp.horizon + 16 + r() * 50, 'sp-jump' + (r() < 0.5 ? ' flip' : ''), 1400);
    // a fish on the line (catch-fx.js): the line runs taut from the rod tip to its mouth, no float
    const hk = typeof catchHook === 'function' ? catchHook() : null;
    if (hk) {
      g.innerHTML = `<path d="M${f1(tx)} ${f1(ty)} L${f1(hk.x)} ${f1(hk.y)}" fill="none" stroke="#eef4ff" stroke-width="1.8" opacity=".95"/>`
        + (hk.under ? `<ellipse cx="${f1(hk.x)}" cy="${f1(sp.bob[1] + 4)}" rx="${f1(10 + Math.sin(t * 20) * 3)}" ry="3" fill="none" stroke="#fff" stroke-width="2" opacity=".8"/>` : '');
      return;
    }
    const b = fishBiteAt(u), C0 = 0.18, C1 = 0.32;
    let bx, by, phase, cx, cy, tilt;
    if (u < C0) {   // hanging from the tip: lifted out with the catch, swung back over the shoulder
      phase = 'hang'; bx = H.x; by = H.y; cx = (tx + bx) / 2; cy = (ty + by) / 2;
      tilt = Math.atan2(tx - H.x, H.y - ty) * 57.3;
      if (u < 0.12 && r() < 0.18) partAdd({ kind: 'spray', x: bx, y: by + 5, vy: 10, g: 600, life: 0.6, size: 1.1, col: '#dff4ff' });   // drips
    } else if (u < C1) {   // the cast: the float flies out in an arc, the line pays out in a loop behind it
      phase = 'fly';
      const q = (u - C0) / (C1 - C0), fx = 1 - Math.pow(1 - q, 2);
      bx = H.x + (sp.bob[0] - H.x) * fx; by = H.y + (sp.bob[1] - H.y) * q - 4 * 62 * q * (1 - q);
      cx = tx + (bx - tx) * 0.35; cy = Math.min(ty, by) - 38 * (1 - q);
      tilt = q * 540;
    } else {   // floating: it bobs on the swell, dips at each nibble, is dragged under by the pull
      phase = 'float';
      const s = Math.min(1, (u - C1) / 0.05), land = Math.min(1, (u - C1) / 0.07);
      bx = sp.bob[0] + Math.sin(t * 0.7) * 3;
      by = sp.bob[1] + (calm ? 0 : Math.sin(t * 2.3) * 1.6) + Math.sin(s * Math.PI) * 6 * (1 - s * 0.4) + b.dip * 9;
      const taut = b.taut, vib = b.pull && !calm ? Math.sin(t * 47) * 1.6 : 0;
      cx = (tx + bx) / 2 + 10 * (1 - taut) + vib; cy = Math.max(ty, by) + (1 - taut) * 26 * land - (1 - land) * 18 + vib * 0.5;
      tilt = (calm ? 0 : Math.sin(t * 1.7) * 8) + (b.pull && !calm ? Math.sin(t * 31) * 12 : 0) + (b.nib ? 14 * b.nib : 0);
    }
    // splashes: the float lands, each nibble, the pull, the strike
    if (crossed(C1)) {
      spotPop('', sp.bob[0], wy, 'splash', 700);
      for (let i = 0; i < 7; i++) partAdd({ kind: 'spray', x: sp.bob[0] + (r() - 0.5) * 8, y: wy, vx: (r() - 0.5) * 110, vy: -70 - r() * 90, g: 700, life: 0.6, size: 1.3 + r() * 1.2, floor: wy + 4 });
    }
    const nibKey = b.nib > 0.5 ? (SPOT.fishCyc || 0) + ':' + b.i : null;
    if (nibKey && nibKey !== SPOT.nibKey) {
      spotPop('', bx, wy, 'splash sm', 500);
      for (let i = 0; i < 2; i++) partAdd({ kind: 'spray', x: bx, y: wy, vx: (r() - 0.5) * 50, vy: -40 - r() * 40, g: 600, life: 0.45, size: 1.2, floor: wy + 3 });
    }
    if (nibKey) SPOT.nibKey = nibKey;
    if (crossed(0.885)) for (let i = 0; i < 4; i++) partAdd({ kind: 'spray', x: bx, y: wy, vx: (r() - 0.5) * 90, vy: -60 - r() * 80, g: 700, life: 0.5, size: 1.4, floor: wy + 4 });
    if (crossed(0.95)) {
      spotPop('', bx, wy, 'splash', 700);
      for (let i = 0; i < 8; i++) partAdd({ kind: 'spray', x: bx + (r() - 0.5) * 10, y: wy, vx: (r() - 0.5) * 140, vy: -90 - r() * 120, g: 750, life: 0.7, size: 1.4 + r() * 1.4, floor: wy + 4 });
      partAdd({ kind: 'foam', x: bx, y: wy + 1, g: 0, life: 0.8, size: 9 });
    }
    if (b.under && !calm && r() < 0.35) partAdd({ kind: 'spray', x: bx + (r() - 0.5) * 12, y: wy, vx: (r() - 0.5) * 80, vy: -50 - r() * 70, g: 700, life: 0.45, size: 1.2, floor: wy + 3 });
    // the line: slack and sagging while waiting, straight and humming when the fish pulls
    const taut = phase === 'float' ? b.taut : phase === 'hang' ? 1 : 0.3;
    const ex = b.under ? bx : bx, ey = b.under ? wy + 1 : by - 4;
    let s = `<path d="M${f1(tx)} ${f1(ty)} Q${f1(cx)} ${f1(cy)} ${f1(ex)} ${f1(ey)}" fill="none" stroke="#eef4ff" stroke-width="${(1.1 + taut * 0.7).toFixed(2)}" opacity="${(0.8 + taut * 0.2).toFixed(2)}"/>`;
    if (phase === 'float') {
      const busy = b.nib || b.pull || b.under;
      for (let i = 0; i < 3; i++) {
        const ph = (t * (busy ? 1.6 : 0.6) + i / 3) % 1;
        s += `<ellipse cx="${f1(bx)}" cy="${f1(wy)}" rx="${f1(6 + ph * 26)}" ry="${f1(1.6 + ph * 5)}" fill="none" stroke="#fff" stroke-width="1.4" opacity="${((1 - ph) * (busy ? 0.8 : 0.45)).toFixed(2)}"/>`;
      }
    }
    if (!b.under) {
      const fl = `<g transform="translate(${f1(bx)},${f1(by)}) rotate(${f1(tilt)})"><path d="M0 -5 v-6" stroke="#0a0c11" stroke-width="1.6"/><circle r="5" fill="#ff4d5e" stroke="#0a0c11" stroke-width="1.6"/><path d="M-5 0 a5 5 0 0 0 10 0z" fill="#fff" stroke="#0a0c11" stroke-width="1.6"/><circle cx="-1.8" cy="-2.2" r="1.3" fill="#fff" opacity=".75"/></g>`;
      s += phase === 'float' ? `<clipPath id="sp-wl"><rect x="0" y="0" width="800" height="${f1(wy)}"/></clipPath><ellipse cx="${f1(bx)}" cy="${f1(wy + 1)}" rx="6" ry="1.8" fill="#000" opacity=".2"/><g clip-path="url(#sp-wl)">${fl}</g><ellipse cx="${f1(bx)}" cy="${f1(wy)}" rx="${f1(5 + b.dip * 3)}" ry="1.2" fill="none" stroke="#fff" stroke-width="1.2" opacity=".7"/>` : fl;
    }
    if (b.pull || b.under) {
      const pop = 1 + 0.9 * Math.max(0, 1 - (u - 0.885) / 0.014);
      s += `<text transform="translate(${f1(bx)},${f1(sp.bob[1] - 20)}) scale(${pop.toFixed(2)}) rotate(${calm ? 0 : f1(Math.sin(t * 24) * 6)})" class="bite-mark" text-anchor="middle" dy="8">!</text>`;
    }
    g.innerHTML = s;
  } else if (kind === 'cooking') {
    const av = el.querySelector('.spot-av svg.avatar'), rig = av && SPOT_RIG[av.dataset.uid];
    setPose(av, k >= 0 ? 'cook' : '');
    if (rig) {
      rig.cook = k >= 0 ? k : null;
      const a = k >= 0 && findAction('cooking', S.action.id), col = a && a.out ? DISH_COL[Object.keys(a.out)[0]] || '#e9a35a' : null;
      // the food goes in pale and raw and takes its colour as it cooks
      rig.food = col ? mixHex('#f3e4d6', col, Math.min(1, k / 0.7)) : null;
    }
    // the plated dish lands (queued by the 'action' handler): a puff of steam, sparkles if perfect
    const pf = SPOT.plFx;
    if (pf && performance.now() >= pf.t) {
      SPOT.plFx = null;
      for (let i = 0; i < 3; i++) partAdd({ kind: 'puff', x: pf.x + (i - 1) * 10, y: pf.y - 6, vx: (i - 1) * 14, vy: -30, g: 0, size: 4, life: 1.2, op: 0.4 });
      if (pf.perfect) {
        retrigger(el, 'thud');
        for (let i = 0; i < 16; i++) { const a = (i / 16) * Math.PI * 2; partAdd({ kind: 'star', x: pf.x + Math.cos(a) * 10, y: pf.y - 8 + Math.sin(a) * 6, vx: Math.cos(a) * 130, vy: Math.sin(a) * 80 - 40, g: 60, life: 1.1, size: 4 + r() * 4, vr: 240, col: ['#ffe27a', '#fff6c8', '#ffb84a'][i % 3] }); }
      }
    }
    if (k < 0 || !rig || !rig.pan) { SPOT.cookU = null; el.style.removeProperty('--steam'); return; }
    const u = driveU('cook', t), prev = SPOT.cookU, [px, py] = rigToSpot(COOK_BOX, rig.pan);
    SPOT.cookU = u;
    // the steam thickens as the dish cooks
    el.style.setProperty('--steam', (0.3 + 0.7 * Math.min(1, k / 0.8)).toFixed(2));
    const drop = (n, up, life) => { for (let i = 0; i < n; i++) partAdd({ kind: 'drop', x: px + (r() - 0.5) * 20, y: py - 2, vx: (r() - 0.5) * 120, vy: -up * (0.5 + r() * 0.6), g: 700, life: life || 0.45 }); };
    const fire = (n, x, y, up, size, life) => { for (let i = 0; i < n; i++) partAdd({ kind: 'fire', x: x + (r() - 0.5) * 18, y, vx: (r() - 0.5) * 60, vy: -up * (0.6 + r() * 0.6), g: -90, size: size * (0.7 + r() * 0.6), life: life * (0.7 + r() * 0.5) }); };
    // sizzling: the oil spits and crackles the whole time the pan is on the fire, flames lick its sides
    if (u < 0.5) {
      if (r() < 0.1) drop(1, 140, 0.35);
      if (r() < 0.25) partAdd({ kind: 'sizzle', x: px + (r() - 0.5) * 26, y: py - 2 - r() * 5, g: 0, life: 0.15 + r() * 0.12 });
    }
    if (r() < 0.1) { const side = r() < 0.5 ? -1 : 1; fire(1, px + side * 20, py + 6, 40, 3.2, 0.4); }
    const crossed = (x) => prev != null && prev < x && u >= x && u - prev < 0.3;
    // the toss: oil in the air catches, a burst of flame licks up the pan, sparks fly
    if (crossed(COOK_T.launch)) {
      retrigger(el.querySelector('.flames'), 'flare');
      drop(4, 200, 0.55);
      fire(calm ? 0 : 7, px + 12, py - 2, 190, 5.5, 0.65);
      for (let i = 0; i < 5; i++) partAdd({ kind: 'spark', x: px + 10 + (r() - 0.5) * 24, y: py + 4, vx: (r() - 0.5) * 70, vy: -90 - r() * 90, g: -40, life: 0.7 + r() * 0.4 });
    }
    // the catch: it lands with a sizzle and a puff of steam
    if (crossed(COOK_T.land)) {
      drop(6, 220, 0.5);
      for (let i = 0; i < 5; i++) partAdd({ kind: 'sizzle', x: px + (r() - 0.5) * 24, y: py - 3 - r() * 4, g: 0, life: 0.2 + r() * 0.1 });
      for (let i = 0; i < 2; i++) partAdd({ kind: 'puff', x: px + (i - 0.5) * 14, y: py - 8, vx: (i - 0.5) * 20, vy: -26, g: 0, size: 4, life: 1.1 });
    }
  } else if (kind === 'voyaging') {
    const ship = el.querySelector('.ship'), bob = ship && ship.firstElementChild, g = el.querySelector('[data-spotfx]');
    if (!ship) return;
    const sailing = k >= 0, rough = (VOY_LOOK[SPOT.voyLook] || {}).storm ? 1.9 : 1;
    // the ship crosses the scene with the voyage; it lies at the landfall while the loot comes up,
    // then the next voyage sails in from the left (or it is back at the dock)
    const hold = 1.6, since = t - (SPOT.voyArr || -99);
    let left = sailing ? 10 + k * 58 : 10, op = 1;
    if (since < hold && SPOT.voyEnd != null) left = SPOT.voyEnd;
    else if (since < hold + 0.7) { const f = (since - hold) / 0.7; left -= (1 - ease.out(f)) * 9; op = f; }
    SPOT.voyLeft = left;
    ship.style.left = left.toFixed(2) + '%';
    ship.style.opacity = op < 1 ? op.toFixed(2) : '';
    // rocking on the swell: roll and heave out of phase, heavier in a storm, gentle at the dock
    const amp = (sailing ? 1 : 0.45) * rough, sw = Math.sin(t * 1.25 - 0.9);
    const roll = calm ? 0 : (Math.sin(t * 1.25) * 2.4 + Math.sin(t * 0.53 + 1) * 1.3) * amp, heave = calm ? 0 : sw * 3 * amp;
    SPOT.voyRoll = roll;
    if (bob) bob.style.transform = `translateY(${heave.toFixed(2)}%) rotate(${roll.toFixed(2)}deg)`;
    setPose(el.querySelector('.ship-av svg.avatar'), sailing || since < hold ? 'sail' : 'swagger');
    // the loot comes up (queued by the 'action' handler): coins burst out of the chest
    const vf = SPOT.voyFx;
    if (vf && performance.now() >= vf.t) {
      SPOT.voyFx = null;
      for (let i = 0; i < 18; i++) partAdd({ kind: 'coin', x: vf.x + (r() - 0.5) * 10, y: vf.y, vx: (r() - 0.5) * 220, vy: -180 - r() * 220, g: 760, life: 1.1 + r() * 0.3, floor: 300 });
      for (let i = 0; i < 8; i++) partAdd({ kind: 'star', x: vf.x, y: vf.y - 6, vx: (r() - 0.5) * 200, vy: -60 - r() * 140, g: 80, life: 0.9, size: 4 + r() * 3, vr: 260, col: i % 2 ? '#ffe27a' : '#fff6c8' });
    }
    if (!g) return;
    if (!sailing || calm || op < 1 || since < hold) { if (g.innerHTML) g.innerHTML = ''; return; }
    // the wake: two foam lines spreading behind the stern, rippling backwards; foam and bow spray
    const W = SHIP_W * 800, sh = W * 110 / 120, x0 = left * 8, wl = 0.44 * 320 + sh * (90 / 110) + (heave / 100) * sh;
    const stern = x0 + W * 0.16, bow = x0 + W * 0.86;
    let d1 = `M${f1(stern)} ${f1(wl)}`, d2 = d1;
    for (let i = 1; i <= 8; i++) {
      const x = stern - i * 21, w = Math.sin(i * 1.3 - t * 6) * 1.3;
      d1 += ` L${f1(x)} ${f1(wl - i * 0.7 + w)}`; d2 += ` L${f1(x)} ${f1(wl + i * 1.7 + w)}`;
    }
    g.innerHTML = `<defs><linearGradient id="sp-wake" gradientUnits="userSpaceOnUse" x1="${f1(stern)}" y1="0" x2="${f1(stern - 170)}" y2="0"><stop offset="0" stop-color="#fff" stop-opacity=".85"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient></defs>`
      + `<path d="${d1}" fill="none" stroke="url(#sp-wake)" stroke-width="2.2" stroke-linecap="round"/><path d="${d2}" fill="none" stroke="url(#sp-wake)" stroke-width="3" stroke-linecap="round"/>`
      + `<ellipse cx="${f1(bow)}" cy="${f1(wl + 1)}" rx="${f1(9 + sw * 3)}" ry="2.4" fill="#fff" opacity=".55"/>`;
    if (r() < 0.45) partAdd({ kind: 'foam', x: stern - r() * 8, y: wl + r() * 4, vx: -70 - r() * 30, g: 0, life: 0.9, size: 2.5 + r() * 3 });
    // the bow slams into a swell: a burst of spray
    const dip = sw < 0 && (SPOT.voySw || 0) >= 0;
    SPOT.voySw = sw;
    if (dip) for (let i = 0; i < 5 * rough; i++) partAdd({ kind: 'spray', x: bow + r() * 6, y: wl, vx: 30 + r() * 90, vy: -90 - r() * 110 * rough, g: 650, life: 0.7, size: 1.3 + r() * 1.4, floor: wl + 8 });
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
  setLast('fishing', `<i class="sh-ic ${d.shiny ? 'shiny' : ''}">${itemIc(id)}</i><small>${d.record ? 'New record' : d.trophy ? 'Trophy catch' : 'Last catch'}</small><b>${esc(it.name)}</b><em>${fmtKg(d.kg)}</em>`);
  const el = spotNow();
  if (!el || el.dataset.spot !== 'fishing') return;
  if (typeof catchShow === 'function' && catchShow(d)) return;   // the drawn catch (catch-fx.js)
  const sp = SPOT.fish || FISH_SPOTS[0], m = spotPx();
  const leap = spotPop(`<span class="tile-art">${itemIc(id)}</span>`, sp.bob[0], sp.bob[1] - 8, 'leap' + (d.shiny ? ' shiny' : ''), 1300);
  if (leap) { leap.style.setProperty('--tx', Math.round((214 - sp.bob[0]) * m) + 'px'); leap.style.setProperty('--ty', Math.round(-30 * m) + 'px'); leap.style.setProperty('--jy', Math.round(-120 * m) + 'px'); }
  spotPop('', sp.bob[0], sp.bob[1] + 2, 'splash', 800);
  spotPop(`<b>${esc(it.name)}</b><small>${fmtKg(d.kg)}</small>`, sp.bob[0] - 40, sp.bob[1] - 70, 'tag' + (d.shiny ? ' gold' : ''), 1700);
  if (d.record) spotPop(`${ui('record')}New record!`, 330, 70, 'banner', 2200);
  if (d.shiny) spotPop(`${ui('shiny')}Shiny!`, 400, 52, 'banner shiny', 2600);
});
on('action', (d) => {
  const el = spotNow();
  if (d.skill === 'cooking') {
    const ids = Object.keys(d.gains).filter((k) => ITEMS[k] && baseOf(k) === Object.keys(d.act.out || {})[0]);
    const top = ids.sort((a, b) => rarity(b) - rarity(a))[0];
    if (!top) return;
    const it = ITEMS[top];
    setLast('cooking', `<i class="sh-ic ${it.q === 'p' ? 'shiny' : ''}">${itemIc(top)}</i><small>${it.q === 'p' ? 'Perfect!' : 'Last dish'}</small><b>${esc(it.name)}</b>${it.type === 'food' ? `<em>${ui('hp')}${foodHeal(top)}</em>` : ''}`);
    if (!el || el.dataset.spot !== 'cooking') return;
    // plating: the dish leaves the pan in an arc and lands on a plate on the chopping board, steams,
    // then flies up to the "last dish" panel (a perfect one lands in a burst of gold)
    const [px, py] = SPOT.pan || [400, 200], perfect = it.q === 'p', PL = [644, 182], m = spotPx(), now = performance.now();
    const full = actionTime('cooking', d.act) >= 1.5 && !avCalm() && now - (SPOT.plateT || 0) > 1100;
    SPOT.plateT = now;
    if (full) {
      const arc = spotPop(`<i><span class="tile-art">${itemIc(top)}</span></i>`, px, py - 10, 'plate-arc' + (perfect ? ' perfect' : ''), 600);
      if (arc) { arc.style.setProperty('--dx', Math.round((PL[0] - px) * m) + 'px'); arc.style.setProperty('--dy', Math.round((PL[1] - py + 10) * m) + 'px'); arc.style.setProperty('--jy', Math.round(-70 * m) + 'px'); }
    }
    const pl = spotPop(`<i class="pl-plate"></i><span class="tile-art">${itemIc(top)}</span><i class="pl-steam"><b></b><b></b><b></b></i>`, PL[0], PL[1], 'plated' + (full ? ' arc' : '') + (perfect ? ' perfect' : ''), 2100);
    if (pl) { pl.style.setProperty('--hx', Math.round((744 - PL[0]) * m) + 'px'); pl.style.setProperty('--hy', Math.round((30 - PL[1]) * m) + 'px'); }
    SPOT.plFx = { t: now + (full ? 560 : 60), x: PL[0], y: PL[1], perfect };
    spotPop(`<b>+${fmt(d.gains[top])} ${esc(it.name)}</b>${it.type === 'food' ? `<small>${ui('hp')}heals ${foodHeal(top)}</small>` : ''}`, PL[0] - 20, PL[1] - 66, 'tag' + (perfect ? ' gold' : ''), 1700);
    if (perfect) spotPop(`${ui('perfect')}Perfect!`, px, 64, 'banner perfect', 2200);
    if (it.spice) { const p = spotPop('<i></i><i></i><i></i><i></i><i></i><i></i>', PL[0], PL[1] - 34, 'sprinkle', 900); if (p) { p.style.setProperty('--sc', SPICES[it.spice].col); p.style.animationDelay = full ? '.5s' : '0s'; } }
  }
});
on('expedition', (d) => {
  const el = spotNow();
  {
    if (!el || el.dataset.spot !== 'voyaging') return;
    // landfall: the hand cheers (POSE_DRIVE.sail), a chest drops onto the deck, bursts open with
    // coins, and the cargo fans up out of it
    const now = performance.now(), m = spotPx();
    SPOT.voyArr = now / 1000; SPOT.voyEnd = SPOT.voyLeft != null ? SPOT.voyLeft : 68;
    const W = SHIP_W * 800, cx = SPOT.voyEnd * 8 + W * 0.74, cy = 0.44 * 320 + W * (110 / 120) * (70 / 110) - 8;
    spotPop(`<svg viewBox="-20 -24 40 30"><g class="vc-box"><rect x="-15" y="-10" width="30" height="16" rx="2" fill="#8c5c34" stroke="#1a0e06" stroke-width="2"/><path d="M-15 -4 h30" stroke="#5a381f" stroke-width="2"/><rect x="-3" y="-7" width="6" height="7" rx="1" fill="#ffd23f" stroke="#1a0e06" stroke-width="1.4"/></g><g class="vc-lid"><path d="M-15 -10 Q-15 -20 0 -20 Q15 -20 15 -10Z" fill="#a8703e" stroke="#1a0e06" stroke-width="2"/><path d="M-6 -19.5 v9 M6 -19.5 v9" stroke="#ffd23f" stroke-width="2"/></g></svg>`, cx, cy, 'voy-chest', 1900);
    SPOT.voyFx = { t: now + (avCalm() ? 0 : 520), x: cx, y: cy - 8 };
    Object.keys(d.gains).filter((k) => ITEMS[k]).slice(0, 3).forEach((k, i, all) => {
      const p = spotPop(`<span class="tile-art">${itemIc(k)}</span>`, cx, cy - 10, 'voy-loot', 2000);
      if (p) { p.style.setProperty('--lx', Math.round((i - (all.length - 1) / 2) * 46 * m) + 'px'); p.style.setProperty('--ly', Math.round(-78 * m) + 'px'); p.style.animationDelay = (0.5 + i * 0.12) + 's'; }
    });
    spotPop(`<b>${fmt(d.hauls)} hauls · +${fmt(d.gold)} gold</b><small>${Object.keys(d.gains).slice(0, 3).map((k) => esc(ITEMS[k].name)).join(' · ')}</small>`, Math.min(700, cx), 84, 'tag gold', 2000);
  }
});

/* ================================================================ spice rack */
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
const qNoun = (kind, n) => (kind === 'shiny' ? `${n} shiny fish` : `${n} perfect ${n > 1 ? 'dishes' : 'dish'}`);
// The log entry an item can fill (shiny / perfect, seasoned or not): { skill, e }.
function qEntryOf(id) {
  const it = ITEMS[id];
  if (!it || !it.q) return null;
  const vid = variantId(it.base, it.q);
  for (const sk in QUALITY) { const e = qEntries(sk).find((x) => x.vid === vid); if (e) return { skill: sk, e }; }
  return null;
}
function qTile(e, skill) {
  if (e.got) { ensureVariant(e.vid); return tile(e.vid, null, { cls: 'xs' }); }
  if (e.ready) return tile(e.pay, null, { tag: 'button', cls: 'xs ql-ready', attrs: `data-qclaim="${skill}:${e.base}" aria-label="Hand in ${esc(ITEMS[e.pay].name)}"` });
  const seen = skillLv(skill) >= e.act.level || S.found[e.base];
  return tile(e.base, null, { cls: 'xs ql-miss', unknown: !seen, title: seen ? `${qKind(skill) === 'shiny' ? 'Shiny' : 'Perfect'} ${ITEMS[e.base].name}: not yet` : `Unlocks at ${SKILLS[skill].name} ${e.act.level}` });
}
function qLogHTML(skill, compact) {
  const E = qEntries(skill), kind = qKind(skill), have = E.filter((e) => e.got).length, T = qTiers(skill), ready = E.filter((e) => e.ready).length;
  const odds = kind === 'shiny' ? 'Each catch can be shiny. Mastery of a fish raises its odds. Hand one of each in to the log; sell the rest.' : 'Any dish can come out perfect. Mastery and your level raise the odds. Hand one of each in to the log (seasoned ones count); eat or sell the rest.';
  return `<section class="win qlog ${kind}" style="--rc:${rc(SKILLS[skill].realm)}">${hdr(compact ? `${Q_TITLE[kind]} · ${SKILLS[skill].name}` : Q_TITLE[kind], `${have} / ${E.length}`)}
    <div class="ql-grid">${E.map((e) => qTile(e, skill)).join('')}</div>
    ${ready ? `<div class="ql-claim">${gbtn(`Hand in ${qNoun(kind, ready)}`, kind, `data-qclaim="${skill}:*"`, 'glow sm')}<small>1 of each goes into the log</small></div>` : ''}
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
  const L = qEntryOf(id), title = L && Q_TITLE[qKind(L.skill)];
  if (it.q === 's') rows.push(['shiny', 'Shiny', L && L.e.got ? `In the Shiny Log. Extra ones are trophies: ${fmt(it.value)} gold each.` : `Hand one in to the Shiny Log for its bonus; extra ones sell for ${fmt(it.value)} gold.`]);
  if (it.q === 'p') {
    rows.push(['perfect', 'Perfect', it.type === 'food' ? 'Heals 50% more; its seasoning is 50% stronger' : 'Its buff is 50% stronger']);
    rows.push(['perfect', 'Perfect Log', L && L.e.got ? 'Logged' : 'Hand one in for its bonus']);
  }
  if (it.spice) rows.push(['spices', SPICES[it.spice].adj, spiceText(it.spice, spicePower(it.q === 'p'))]);
  const cta = L && !L.e.got && count(id) > 0 ? `<div class="dt-cta">${gbtn(`Hand in to the ${title}`, qKind(L.skill), `data-qclaim="${L.skill}:${L.e.base}:${id}"`, 'glow')}</div>` : '';
  return attrList(rows) + cta + (it.type === 'food' ? '<p class="muted small">Battle food that runs out is replaced by another version of the same dish.</p>' : '');
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
    const inLog = S.quality.claim[d.item];
    burst('Shiny catch!', inLog ? `${it.name} · a trophy to sell` : `${it.name} · hand it in to the Shiny Log`, itemIc(d.item), '#ffd75e');
    if (!inLog && count(d.item) === 1) toast(`Shiny ${ITEMS[d.base].name}! Hand it in to the Shiny Log for its bonus.`, 'rare');
  } else if (!S.quality.claim[logged.id] && d.first) {
    burst('Perfect dish!', `${it.name} · hand it in to the Perfect Log`, itemIc(d.item), '#ffd75e');
    toast(`Perfect ${ITEMS[d.base].name}! Hand it in to the Perfect Log for its bonus.`, 'rare');
  }
  sideDirty = true;
});
on('qclaim', (d) => {
  toast(`${Q_TITLE[qKind(d.skill)]}: ${ITEMS[d.item].name} (${d.have} / ${d.total}).`, 'rare');
  sideDirty = true;
});
document.addEventListener('click', (ev) => {
  const t = ev.target.closest('[data-qclaim]');
  if (!t || t.disabled) return;
  const [skill, base, pay] = t.dataset.qclaim.split(':'), kind = qKind(skill);
  const list = base === '*' ? qReady(skill).map((e) => e.base) : [base];
  let n = 0;
  for (const b of list) if (qClaim(skill, b, pay)) n++;
  if (n) burst(Q_TITLE[kind], `${n > 1 ? qNoun(kind, n) : ITEMS[variantId(list[0], Q_CODE[kind])].name} logged · ${qCount(skill)} / ${qEntries(skill).length}`, ui(kind), '#ffd75e');
  sideDirty = true; dirty = true;
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
