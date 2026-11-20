'use strict';
/* ==========================================================================
   TRI-REALM STUDIO — the content editor (editor.html)
   Everything is drawn by the game's own renderer (avatar.js), so what you see
   is what players get. Workflows borrowed from open-source tools:
   - Animations: pose-to-pose keyframes on the rig with a dope sheet, onion
     skin, auto-key and IK handles (Spine / DragonBones / OpenToonz style).
   - Hair: anime locks on a cap, drawn and bent straight on the head.
   - Hats, faces, back art: a small vector editor (Inkscape-like nodes).
   - Auras: flames plus particle emitters (pixi-particle-emitter / Effekseer).
   - Clothes: layered parts mixed freely (LPC character generator).
   Content is plain data in a "pack". js/custom.js turns it into game content;
   Save writes js/custom-pack.js. A draft is kept in this browser meanwhile.
   ========================================================================== */

const $ = (s, r) => (r || document).querySelector(s);
const $$ = (s, r) => [...(r || document).querySelectorAll(s)];
const rd = (v) => Math.round(v * 10) / 10;
const rd2 = (v) => Math.round(v * 100) / 100;
const clone = (o) => JSON.parse(JSON.stringify(o));
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const wrapA = (a) => ((((a + 180) % 360) + 360) % 360) - 180;
const near = (prev, a) => rd(prev + wrapA(a - prev));
const ang = (o, p) => Math.atan2(p[0] - o[0], p[1] - o[1]) / D2R;
const slug = (s) => String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 30) || 'item';

/* ================================================================ content types */
const TYPE_ORDER = ['anim', 'hair', 'top', 'bottom', 'hat', 'face', 'back', 'aura', 'color'];
const TYPES = {
  anim: { label: 'Animations', one: 'animation', slot: 'stance' },
  hair: { label: 'Hair', one: 'haircut', slot: 'hair' },
  top: { label: 'Tops', one: 'top', slot: 'top' },
  bottom: { label: 'Bottoms', one: 'bottom', slot: 'bottom' },
  hat: { label: 'Hats', one: 'hat', slot: 'hat' },
  face: { label: 'Faces', one: 'face', slot: 'face' },
  back: { label: 'Back', one: 'back piece', slot: 'back' },
  aura: { label: 'Auras', one: 'aura', slot: 'aura' },
  color: { label: 'Colours', one: 'colour', slot: 'color' },
};
const HEAD_MODES = { hair: 1, hat: 1, face: 1, cuts: 1 };
const VEC_MODES = { hat: 1, face: 1, back: 1 };
const GAR_MODES = { top: 1, bottom: 1 };
// Modes where the stage edits points of shapes: hats, faces, back art, garment pieces, hair masses.
const isVec = () => !!(VEC_MODES[ST.mode] || GAR_MODES[ST.mode] || (ST.mode === 'hair' && ST.hairEdit === 'mass' && cur() && !cur().v2));

// What the game already has (ids a custom item may not take).
registerCustomPack(null);
const BUILTIN = {};
for (const [s] of COS_SLOTS) BUILTIN[s] = new Set(COSMETICS[s].map((c) => c.id));
BUILTIN.aura.add('glimmer');
const BUILTIN_POSES = Object.keys(POSES);
const BUILTIN_HAIR = Object.keys(HAIR), BUILTIN_TOPS = Object.keys(TOPS), BUILTIN_BOTTOMS = Object.keys(BOTTOMS), BUILTIN_HATS = Object.keys(HATS);
const RESERVED = {
  anim: new Set([...BUILTIN_POSES, ...BUILTIN.stance, 'front']),
  hair: new Set([...BUILTIN.hair, ...BUILTIN_HAIR]), top: new Set([...BUILTIN.top, ...BUILTIN_TOPS]), bottom: new Set([...BUILTIN.bottom, ...BUILTIN_BOTTOMS]),
  hat: new Set([...BUILTIN.hat, ...BUILTIN_HATS]), face: BUILTIN.face, back: BUILTIN.back, aura: BUILTIN.aura, color: BUILTIN.color,
};
const cosName = (slot, id) => (COSMETICS[slot].find((c) => c.id === id) || {}).name || id;
const B0 = COSMETICS.build[0].b;
const FRONT_POSE = Object.assign({}, CUSTOM_POSE0, { t1: 180, aF: [14, 4], aB: [-14, -4], lF: [8, -1], lB: [-8, 1] });
// Arms and legs apart, to draw clothes on each part.
const TPOSE = Object.assign({}, CUSTOM_POSE0, { t1: 180, aF: [64, 4], aB: [-64, -4], lF: [15, -1], lB: [-15, 1] });

/* ================================================================ state */
const UI_KEY = 'trirealm_studio_ui';
const ST = {
  mode: 'anim', sel: {}, pack: null, live: false,
  u: 0, playing: false, loop: true, speed: 1, onion: true, clip: null,
  lock: 0, layer: 0, point: -1, emitter: 0,
  tool: '', snap: true, h2d: { l: 'main', w: 7, tip: 'point' }, hairEdit: 'locks', sym: false, brush: { w: 8, tp: 0.8, back: false, hang: false, k: false }, animate: true, bg: 'dark', handles: true, guide: true,
  previewPose: 'relaxed', cut: typeof HAIR_CUTS !== 'undefined' ? Object.keys(HAIR_CUTS)[0] : '', view: { x: -10, y: 4, w: 220, h: 240 },
  man: { build: 'athletic', style: 'flat', color: 'chalk', hair: 'tuft', top: 'tee', bottom: 'tee', hat: 'none', face: 'dots', back: 'none', aura: 'none', weapon: '' },
  open: {},
};
function normPack(p) {
  const o = { v: 1 };
  for (const t of TYPE_ORDER) o[t] = Array.isArray(p && p[t]) ? clone(p[t].filter((x) => x && typeof x === 'object')) : [];
  o.cuts = normCuts(p && p.cuts);
  return o;
}
// The manga haircuts' hand adjustments: { id: { x, y, s, sw, sh } }, only the cuts that were changed.
function normCuts(c) {
  const o = {};
  if (typeof HAIR_FIT === 'undefined' || !c || typeof c !== 'object') return o;
  for (const id of Object.keys(c)) {
    if (!HAIR_CUTS[id]) continue;
    const a = HAIR_FIT.adjOf(c[id]);
    if (a.x || a.y || a.s !== 100 || a.sw !== 100 || a.sh !== 100) o[id] = { x: rd2(a.x), y: rd2(a.y), s: rd(a.s), sw: rd(a.sw), sh: rd(a.sh) };
  }
  return o;
}
const projectPack = () => normPack(typeof CUSTOM_PACK !== 'undefined' ? CUSTOM_PACK : null);
(function loadStart() {
  let d = null;
  try { d = JSON.parse(localStorage.getItem(STUDIO_DRAFT_KEY) || 'null'); } catch (e) { /* no storage */ }
  ST.pack = d && d.pack ? normPack(d.pack) : projectPack();
  ST.live = !!(d && d.live);
  try {
    const u = JSON.parse(localStorage.getItem(UI_KEY) || 'null');
    if (u) { Object.assign(ST.man, u.man || {}); if (TYPES[u.mode] || u.mode === 'pack' || u.mode === 'cuts') ST.mode = u.mode; if (u.cut) ST.cut = u.cut; Object.assign(ST.sel, u.sel || {}); ST.bg = u.bg || ST.bg; ST.open = u.open || {}; }
  } catch (e) { /* ignore */ }
})();
// Content prepared for review (js/studio-inbox.js, loaded by the Studio only, never by the game):
// added to the draft once per set; it reaches players only when the draft is saved to the project.
const INBOX_KEY = 'trirealm_studio_inbox';
let inboxNote = '';
// The inbox can hold several sets (an array): each is merged once, by id, so a later fix to one
// item can be sent as its own small set without overwriting the others in the draft.
const inboxSets = () => (typeof STUDIO_INBOX === 'undefined' || !STUDIO_INBOX ? [] : [].concat(STUDIO_INBOX)).filter((x) => x && x.pack);
function takeInbox(force) {
  let seen = {};
  try { seen = JSON.parse(localStorage.getItem(INBOX_KEY) || '{}') || {}; } catch (e) { /* no storage */ }
  let n = 0, first = null;
  const notes = [];
  for (const set of inboxSets()) {
    if (seen[set.id] && !force) continue;
    let k = 0;
    for (const t of TYPE_ORDER) for (const it of set.pack[t] || []) {
      const L = ST.pack[t], i = L.findIndex((x) => x.id === it.id);
      if (i >= 0) L[i] = clone(it); else L.push(clone(it));
      if (!first) first = [t, it.id];
      k++;
    }
    seen[set.id] = Date.now();
    n += k;
    notes.push(`${set.label} (${k})`);
  }
  if (!n) return 0;
  try { localStorage.setItem(INBOX_KEY, JSON.stringify(seen)); } catch (e) { /* no storage */ }
  if (first) { ST.mode = first[0]; ST.sel[first[0]] = ST.pack[first[0]].findIndex((x) => x.id === first[1]); }
  inboxNote = `${notes.join(' · ')}: added to your draft for review. Players get them only when you press Save to project.`;
  return n;
}
takeInbox();
const items = (t) => ST.pack[t || ST.mode] || [];
function cur() {
  if (!TYPES[ST.mode]) return null;
  const L = items(), i = clamp(ST.sel[ST.mode] | 0, 0, Math.max(0, L.length - 1));
  ST.sel[ST.mode] = i;
  return L[i] || null;
}
let saveT = 0;
function saveDraft() {
  clearTimeout(saveT);
  saveT = setTimeout(() => {
    try {
      localStorage.setItem(STUDIO_DRAFT_KEY, JSON.stringify({ pack: ST.pack, live: ST.live, t: Date.now() }));
      localStorage.setItem(UI_KEY, JSON.stringify({ man: ST.man, mode: ST.mode, sel: ST.sel, bg: ST.bg, open: ST.open, cut: ST.cut }));
    } catch (e) { /* storage full or blocked */ }
    renderTop();
  }, 250);
}
// "Saved" compares with the file this page loaded, or with the last save made from here.
let savedJSON = null;
const differs = () => JSON.stringify(ST.pack) !== (savedJSON || JSON.stringify(projectPack()));

/* ---------------------------------------------------------------- undo */
const HIST = { list: [JSON.stringify(ST.pack)], i: 0 };
function commit() {
  const s = JSON.stringify(ST.pack);
  if (s === HIST.list[HIST.i]) return;
  HIST.list = HIST.list.slice(0, HIST.i + 1);
  HIST.list.push(s);
  if (HIST.list.length > 150) HIST.list.shift();
  HIST.i = HIST.list.length - 1;
  needReg = true;
  saveDraft();
}
function histGo(d) {
  const j = HIST.i + d;
  if (j < 0 || j >= HIST.list.length) return;
  HIST.i = j;
  ST.pack = JSON.parse(HIST.list[j]);
  needReg = true;
  saveDraft();
  renderAll();
}

/* ---------------------------------------------------------------- ids */
function uniqueId(type, base) {
  const used = new Set([...RESERVED[type], ...items(type).map((x) => x.id)]);
  let id = base.slice(0, 38), n = 2;
  while (used.has(id)) id = `${base.slice(0, 34)}-${n++}`;
  return id;
}
function idProblem(type, it) {
  if (!CUSTOM_ID.test(it.id || '')) return 'Use lowercase letters, digits and dashes.';
  if (RESERVED[type].has(it.id)) return 'This id is taken by built-in content.';
  if (items(type).filter((x) => x.id === it.id).length > 1) return 'Two items share this id.';
  return '';
}

/* ================================================================ factories */
const META = (name) => ({ id: '', name, w: '', r: 2, unlock: { type: 'free' } });
const POSE_KEEP = ['t1', 't2', 'n', 'h', 'ht', 'st', 'tw', 'dx', 'dy', 'air', 'fF', 'fB', 'g', 'aF', 'aB', 'lF', 'lB', 'expr', 'prop', 'tool', 'sh', 'bf', 'ff', 'fx', 'rb', 'cr', 'hang', 'A', 'panB', 'pt', 'sa', 'tx', 'ty', 'fd', 'fb', 'fq', 'fl'];
function storePose(P) {
  const o = {}, full = customPose(P);
  for (const k of POSE_KEEP) {
    const v = full[k];
    if (v === undefined || v === null || v === '') continue;
    o[k] = Array.isArray(v) ? v.map(rd) : typeof v === 'number' ? rd(v) : v;
  }
  return o;
}
const keyOf = (u, P, e) => ({ u: rd2(u), e: e || 'io', p: storePose(P) });
const DEF_LAYER = {
  shape: () => ({ kind: 'shape', pts: [], closed: true, smooth: true, fill: '#c9a66b', stroke: '#0a0c11', sw: 2.2, op: 1 }),
  line: () => ({ kind: 'shape', pts: [], closed: false, smooth: true, fill: 'none', stroke: '#ffffff', sw: 2, op: 1, inkUnder: true }),
  circle: () => ({ kind: 'circle', cx: 0, cy: -12, r: 5, fill: '#f4c66a', stroke: '#0a0c11', sw: 1.6, op: 1 }),
  raw: () => ({ kind: 'raw', svg: '<!-- SVG in local coordinates -->' }),
};
const DEF_EMITTER = () => ({ shape: 'circle', motion: 'rise', n: 8, speed: 1, size: 3, grow: 0, spread: 40, height: 160, y: 0, wob: 4, spin: 0, op: 0.8, fade: 'out', blink: false, c: '#ffffff', c2: '', seed: 1 });
const EMITTER_PRESETS = {
  embers: ['Embers', { shape: 'circle', motion: 'rise', n: 6, speed: 1.4, size: 2.2, spread: 30, height: 150, wob: 6, c: '#fff0a0', op: 1 }],
  sparks: ['Sparks', { shape: 'spark', motion: 'burst', n: 10, speed: 1.2, size: 4, spread: 60, y: -20, c: '#ffffff', c2: '#ffe066', op: 1, spin: 2 }],
  bubbles: ['Bubbles', { shape: 'ring', motion: 'rise', n: 5, speed: 1.1, size: 4, spread: 46, height: 170, wob: 8, c: '#bfe8ff', op: 0.9 }],
  puffs: ['Steam puffs', { shape: 'circle', motion: 'rise', n: 10, speed: 0.9, size: 8, grow: 1.2, spread: 34, height: 160, wob: 8, c: '#eef6ff', op: 0.5 }],
  leaves: ['Orbiting leaves', { shape: 'leaf', motion: 'orbit', n: 6, speed: 1.4, size: 6, spread: 52, height: 60, y: -20, c: '#7fd36a', c2: '#ff9a4d', op: 0.95, spin: 2 }],
  wisps: ['Soul wisps', { shape: 'wisp', motion: 'orbit', n: 4, speed: 0.9, size: 8, spread: 48, height: 40, y: -10, c: '#b49bff', op: 0.85 }],
  flies: ['Fireflies', { shape: 'glow', motion: 'wander', n: 7, speed: 1, size: 2, spread: 58, height: 130, y: -10, c: '#f4ffb0', op: 1, blink: true }],
  petals: ['Falling petals', { shape: 'petal', motion: 'fall', n: 8, speed: 0.7, size: 3.5, spread: 60, height: 200, wob: 10, c: '#ffb7d5', c2: '#ffe3ef', op: 0.9, spin: 1.5, fade: 'inout' }],
  smoke: ['Smoke', { shape: 'circle', motion: 'rise', n: 6, speed: 0.5, size: 6, grow: 2, spread: 34, height: 150, wob: 8, c: '#2a1450', c2: '#36d6a8', op: 0.4 }],
  spiral: ['Rising spiral', { shape: 'spark', motion: 'spiral', n: 12, speed: 0.8, size: 2.6, spread: 50, height: 200, c: '#7fd3ff', op: 1 }],
  lines: ['Speed lines', { shape: 'streak', motion: 'rise', n: 8, speed: 2.4, size: 3, spread: 54, height: 210, c: '#ffffff', op: 0.6 }],
  bolts: ['Lightning sparks', { shape: 'bolt', motion: 'burst', n: 5, speed: 1.6, size: 7, spread: 70, y: -30, c: '#ffe066', op: 1 }],
};
const emitterFrom = (k) => Object.assign(DEF_EMITTER(), clone(EMITTER_PRESETS[k][1]));
const AURA_PRESETS = {
  flame: ['Flame', { glow: '#ff6a2b', flame: { on: true, c1: '#ff2a12', c2: '#ff7a2b', c3: '#ffe0a0', h: 196, w: 50 }, emitters: ['embers'] }],
  leaves: ['Leaf Whirl (like the game)', { glow: '#ff6a2b', flame: { on: true, c1: '#ff2a12', c2: '#ff7a2b', c3: '#ffe0a0', h: 196, w: 50 }, emitters: ['leaves'] }],
  sea: ['Sea Bubbles (like the game)', { glow: '#9fd8ff', flame: { on: true, c1: '#1e8fe0', c2: '#7fd3ff', c3: '#e6f7ff', h: 150, w: 44 }, emitters: ['puffs', 'bubbles'] }],
  ki: ['Ki Flare (like the game)', { glow: '#ffc93d', flame: { on: true, c1: '#ffa000', c2: '#ffe066', c3: '#fffbe0', h: 208, w: 56 }, bolts: { on: true, c: '#ffe066' }, emitters: ['embers'] }],
  soul: ['Soul Wisps (like the game)', { glow: '#8fa0ff', flame: { on: true, c1: '#3a52ff', c2: '#8fa8ff', c3: '#f0f4ff', h: 204, w: 50 }, emitters: ['wisps'] }],
  forest: ['Fireflies (like the game)', { glow: '#7fe36a', flame: { on: true, c1: '#16b84a', c2: '#8be35d', c3: '#eaffd0', h: 184, w: 48 }, emitters: ['flies'] }],
  sakura: ['Sakura storm', { glow: '#ffb7d5', flame: { on: false, c1: '#ff7aa8', c2: '#ffb7d5', c3: '#fff0f6', h: 180, w: 46 }, emitters: ['petals', 'spiral'] }],
  storm: ['Thunder', { glow: '#7fd3ff', flame: { on: true, c1: '#2b5bff', c2: '#7fd3ff', c3: '#ffffff', h: 210, w: 56 }, bolts: { on: true, c: '#e8f6ff' }, emitters: ['bolts', 'lines'] }],
};
function auraFrom(k) {
  const p = AURA_PRESETS[k][1];
  return { glow: p.glow, blend: 'screen', flame: Object.assign({ on: false, c1: '#ff2a12', c2: '#ff7a2b', c3: '#ffe0a0', h: 196, w: 50 }, clone(p.flame || {})), bolts: Object.assign({ on: false, c: '#ffe066' }, clone(p.bolts || {})), emitters: (p.emitters || []).map(emitterFrom) };
}
const BACK_PRESETS = {
  shroud: ['Hooded shroud', { cape: { on: true, fill: '#2a2238', lining: '#181221', edge: '#9b6bff', len: 116, jag: true, stripes: false, stars: false }, hood: { on: true, c: '#3a2f4f' }, mantle: { on: true, c: '#3a2f4f', clasp: '#e9e3d2', fur: false } }],
  pelt: ['Beast pelt', { cape: { on: true, fill: '#c8873a', lining: '#8a5a24', edge: '#e8c08a', len: 100, jag: false, stripes: true, stars: false }, hood: { on: false, c: '#8a5a24' }, mantle: { on: true, c: '#efe0c4', clasp: '#e8443a', fur: true } }],
  coat: ['Captain cape', { cape: { on: true, fill: '#8e2433', lining: '#5c1420', edge: '#f4c66a', len: 106, jag: false, stripes: false, stars: false }, hood: { on: false, c: '#8e2433' }, mantle: { on: true, c: '#8e2433', clasp: '#f4c66a', fur: false } }],
  starry: ['Starry mantle', { cape: { on: true, fill: '#1a0f2a', lining: '#2c1846', edge: '#ff3fb4', len: 124, jag: false, stripes: false, stars: true }, hood: { on: true, c: '#2c1846' }, mantle: { on: true, c: '#2c1846', clasp: '#ff3fb4', fur: false } }],
  art: ['Art only (backpack, wings...)', { cape: { on: false, fill: '#2a2238', lining: '#181221', edge: '', len: 100 }, hood: { on: false, c: '#3a2f4f' }, mantle: { on: false, c: '#3a2f4f', clasp: '#e9e3d2' } }],
};
const roundLock = (L) => {
  const o = { x: rd(L.x), y: rd(L.y), a: rd(L.a), len: rd(L.len), w: rd(L.w), bend: rd(L.bend || 0), tp: L.tp ? rd2(L.tp) : 0.8 };
  if (L.k === 'crown') o.k = 'crown';
  for (const k of ['hang', 'back']) if (L[k]) o[k] = 1;
  if (L.sw) o.sw = rd(L.sw);
  if (L.ph) o.ph = rd(L.ph);
  return o;
};
function hairFrom(id) {
  const h = HAIR[id];
  return { c: h.c, sh: h.sh, hi: h.hi, cap: h.cap.slice(), back: h.back || 0, part: h.part || 0, smooth: !!h.smooth, buzz: !!h.buzz, stubble: !!h.stubble,
    tie: h.tie ? h.tie.slice() : null, bun: h.bun ? h.bun.slice() : null, combs: (h.combs || []).map((c) => c.slice()), locks: h.locks().map(roundLock) };
}
const TOP_DEF = { c: '#5a6880', fit: 2, hem: -0.08, sl: 0.34, slc: '', wide: 0, cuff: '', open: '', v: '', kimono: false, band: null, zip: '', buttons: '', emblem: '', trim: '', collar: '', cc: '', ch: 4, chain: '', tails: 0 };
const BOT_DEF = { c: '#30364a', len: 1, flare: 0.6, fur: '', wrap: '' };
// Make a new item of a type, optionally from a built-in template.
function makeItem(type, tpl) {
  let it;
  switch (type) {
    case 'anim': {
      it = Object.assign(META('New animation'), { dur: 1.2, use: 'stance', skill: '', breathe: true, keys: [] });
      if (!tpl) { it.keys = [keyOf(0, POSES.relaxed), keyOf(0.5, Object.assign({}, POSES.relaxed, { t2: 6, h: -4, aF: [24, 30], aB: [-24, -30] })), keyOf(1, POSES.relaxed)]; break; }
      const [kind, id] = tpl.split(':');
      if (kind === 'pose') { it.name = `${POSES_NAMES[id] || id} pose`; it.keys = [keyOf(0, POSES[id]), keyOf(1, POSES[id])]; it.dur = 2; }
      else if (kind === 'drive') { const r = bakeDrive(id); it.name = r.name; it.keys = r.keys; it.dur = r.dur; it.breathe = false; it.use = 'none'; }
      else if (kind === 'atk') { const r = bakeAttack(+id); it.name = r.name; it.keys = r.keys; it.dur = r.dur; it.use = 'attack'; it.breathe = false; }
      break;
    }
    case 'hair':
      // new haircuts use the v2 creator; built-in (v1) cuts can still be copied
      if (!tpl || tpl.startsWith('v2:')) { const st = H2_STYLES[tpl ? tpl.slice(3) : 'shonen']; it = Object.assign(META(tpl ? st.name : 'New haircut'), { v2: Object.assign({}, HAIR2_DEFAULT, h2Pick(st)) }); }
      else it = Object.assign(META(cosName('hair', tpl) + ' (copy)'), hairFrom(tpl));
      break;
    case 'top': {
      const src = tpl ? TOPS[tpl] : null;
      it = Object.assign(META(tpl ? cosName('top', tpl) + ' (copy)' : 'New top'), { top: Object.assign(clone(TOP_DEF), src ? clone(src.top) : {}), sash: src && src.sash ? src.sash.slice() : null, wrist: (src && src.wrist) || '', glove: (src && src.glove) || '', base: true, pieces: [] });
      if (it.top.collar !== 'high') it.top.collar = '';
      break;
    }
    case 'bottom': {
      const src = tpl ? BOTTOMS[tpl] : null;
      it = Object.assign(META(tpl ? cosName('bottom', tpl) + ' (copy)' : 'New bottom'), { bot: Object.assign(clone(BOT_DEF), src ? clone(src.bot) : {}), belt: src ? src.belt || '' : '#3a2a22', shoe: src && src.shoe ? src.shoe.slice() : (src ? ['bare', '#3a2c24'] : ['shoe', '#3a2c24']), base: true, pieces: [] });
      break;
    }
    case 'hat':
      it = Object.assign(META(tpl ? cosName('hat', tpl) + ' (copy)' : 'New hat'), { cover: tpl ? !!HAT_COVER[tpl] : true, layers: [] });
      if (tpl) it.layers.push({ kind: 'raw', svg: HATS[tpl], name: 'Built-in drawing' });
      else it.layers.push(Object.assign(DEF_LAYER.shape(), { name: 'Cap', pts: [[-20.5, -3, 1], [-17, -15], [-6, -22.5], [7, -22], [17, -15], [20.5, -4, 1], [0, -9]] }));
      break;
    case 'face':
      it = Object.assign(META(tpl ? cosName('face', tpl) + ' (copy)' : 'New face'), { eyes: !tpl, layers: [] });
      if (tpl) it.layers.push({ kind: 'raw', svg: faceSVG(tpl, null, OL), name: 'Built-in drawing' });
      else it.layers.push(Object.assign(DEF_LAYER.line(), { name: 'Cheek mark', stroke: '#ff4d5e', sw: 1.8, inkUnder: false, pts: [[-8, 6], [-4, 5.2], [0, 6]] }));
      break;
    case 'back': {
      const p = BACK_PRESETS[tpl || 'shroud'];
      it = Object.assign(META(tpl ? p[0] : 'New back piece'), { cape: { on: false, fill: '#2a2238', lining: '#181221', edge: '', len: 100, jag: false, stripes: false, stars: false }, hood: { on: false, c: '#3a2f4f' }, mantle: { on: false, c: '#3a2f4f', clasp: '#e9e3d2', fur: false }, art: { u: -0.6, v: 0.6, layer: 'back', sway: 0, layers: [] } });
      for (const k of ['cape', 'hood', 'mantle']) Object.assign(it[k], clone(p[1][k]));
      if (tpl === 'art') it.art.layers.push(Object.assign(DEF_LAYER.shape(), { name: 'Pack', fill: '#8a5a2b', pts: [[-12, -18, 1], [10, -18, 1], [10, 16, 1], [-12, 16, 1]] }));
      break;
    }
    case 'aura':
      it = Object.assign(META(tpl ? AURA_PRESETS[tpl][0].replace(/ \(.*/, '') : 'New aura'), auraFrom(tpl || 'flame'));
      it.r = 4;
      break;
    case 'color': {
      const c = tpl ? COSMETICS.color.find((x) => x.id === tpl) : null;
      it = Object.assign(META(c ? c.name + ' (copy)' : 'New colour'), { ink: c ? c.ink : '#7ad7ff' });
      break;
    }
  }
  it.id = uniqueId(type, 'x-' + slug(it.name.replace(/ \(copy\)$/, '')));
  return it;
}
// Built-in names for the pose and motion templates.
const POSES_NAMES = { relaxed: 'Relaxed', guard: 'Guard', swagger: 'Swagger', heroic: 'Heroic', striking: 'Striking', meditate: 'Meditation', windup: 'Wind-up', strike: 'Strike', coil: 'Coil', thrust: 'Thrust', chamber: 'Chamber', kick: 'Kick', hurt: 'Hurt', victory: 'Victory', fish: 'Fishing', cook: 'Cooking', wood: 'Chopping' };
// A motion cycle of the game (fishing, cooking, chopping) sampled into keys you can edit.
function bakeDrive(name) {
  const per = (DRIVE_SKILL[name] || ['', 2])[1], n = name === 'fish' ? 40 : name === 'wood' ? 48 : 32, keys = [];
  for (let i = 0; i <= n; i++) { const u = i / n; keys.push(keyOf(u, POSE_DRIVE[name](Math.min(0.9999, u), u * per, B0, true), 'lin')); }
  return { name: `${POSES_NAMES[name] || name} (baked)`, keys, dur: per };
}
// An attack sequence of the game (pose steps with timings) as keys.
function bakeAttack(i) {
  const seq = [['guard', 0, 'io'], ...ATTACKS[i]], total = seq.reduce((a, s) => a + s[1], 0) / 1000;
  let acc = 0;
  const keys = seq.map(([p, ms, e]) => { acc += ms / 1000; return keyOf(acc / total, POSES[p], e); });
  return { name: ['Slash', 'Thrust', 'Kick'][i] + ' attack', keys, dur: rd2(total) };
}
const TEMPLATES = {
  anim: () => [['Poses', BUILTIN_POSES.filter((k) => !['fish', 'cook', 'wood'].includes(k)).map((k) => ['pose:' + k, POSES_NAMES[k] || k])],
    ['Motion cycles (baked into keys)', [['drive:fish', 'Fishing cycle'], ['drive:cook', 'Cooking cycle'], ['drive:wood', 'Chopping cycle']]],
    ['Attacks', ATTACKS.map((_, i) => ['atk:' + i, ['Slash', 'Thrust', 'Kick'][i] + ' attack'])]],
  hair: () => [['Styles', Object.entries(H2_STYLES).map(([k, v]) => ['v2:' + k, v.name])], ['Old system (copy a built-in cut)', BUILTIN_HAIR.map((k) => [k, cosName('hair', k)])]],
  top: () => [['Built-in tops', BUILTIN_TOPS.map((k) => [k, cosName('top', k)])]],
  bottom: () => [['Built-in bottoms', BUILTIN_BOTTOMS.map((k) => [k, cosName('bottom', k)])]],
  hat: () => [['Built-in hats', BUILTIN_HATS.map((k) => [k, cosName('hat', k)])]],
  face: () => [['Built-in faces', [...BUILTIN.face].filter((k) => k !== 'blank').map((k) => [k, cosName('face', k)])]],
  back: () => [['Presets', Object.entries(BACK_PRESETS).map(([k, v]) => [k, v[0]])]],
  aura: () => [['Presets', Object.entries(AURA_PRESETS).map(([k, v]) => [k, v[0]])]],
  color: () => [['Built-in colours', COSMETICS.color.filter((c) => BUILTIN.color.has(c.id)).map((c) => [c.id, c.name])]],
};

/* ================================================================ animation helpers */
const animKeysOf = (a) => customKeys(a);
function poseAt(a, u) {
  const ks = animKeysOf(a);
  if (!ks.length) return customPose(POSES.relaxed);
  return keyPose(ks, u);
}
const keyIdxAt = (a, u) => (a && a.keys ? a.keys.findIndex((k) => Math.abs(k.u - u) < 0.0005) : -1);
const curKey = () => { const a = ST.mode === 'anim' && cur(); if (!a) return null; const i = keyIdxAt(a, ST.u); return i >= 0 ? a.keys[i] : null; };
const sortKeys = (a) => a.keys.sort((x, y) => x.u - y.u);
// Make sure there is a key under the playhead (auto-key) and return it.
function ensureKey() {
  const a = cur();
  if (!a) return null;
  let k = curKey();
  if (!k) { k = keyOf(ST.u, poseAt(a, ST.u), 'io'); a.keys.push(k); sortKeys(a); renderTimeline(); }
  for (const f of ['aF', 'aB', 'lF', 'lB']) if (!Array.isArray(k.p[f])) k.p[f] = customPose(k.p)[f];
  return k;
}
// Swap the front and back limbs, mirrored (the second half of a walk is the first half swapped).
function swapLimbs(p) {
  const P = customPose(p), o = Object.assign({}, p);
  o.aF = [rd(-P.aB[0]), rd(-P.aB[1])]; o.aB = [rd(-P.aF[0]), rd(-P.aF[1])];
  o.lF = [rd(-P.lB[0]), rd(-P.lB[1])]; o.lB = [rd(-P.lF[0]), rd(-P.lF[1])];
  o.fF = rd(-180 - P.fB); o.fB = rd(-180 - P.fF);
  return o;
}

/* ================================================================ wearing and posing */
function wearing() {
  const A = Object.assign({}, ST.man), it = cur();
  for (const s of Object.keys(A)) if (COSMETICS[s] && !COSMETICS[s].some((c) => c.id === A[s])) A[s] = COSMETICS[s][0].id;
  if (it && ST.mode !== 'anim' && ST.mode !== 'pack') A[TYPES[ST.mode].slot] = it.id;
  if (ST.mode === 'anim') A.stance = 'relaxed';
  if (ST.mode === 'cuts' && HAIR_CUTS[ST.cut]) A.hair = 'cut_' + ST.cut;
  return A;
}
function breathe(P, t) {
  const br = Math.sin(t * 2.2);
  return Object.assign({}, P, { t2: (P.t2 || 0) + br * 1.6, n: (P.n || 0) - br * 1.2, aF: [P.aF[0] + br * 1.4, P.aF[1]], aB: [P.aB[0] - br * 1.4, P.aB[1]] });
}
function previewPose(name, t, B) {
  if (name === 'front') return FRONT_POSE;
  if (name === 'tpose') return TPOSE;
  if (POSE_DRIVE[name]) { const per = (DRIVE_SKILL[name] || ['', 2])[1]; return POSE_DRIVE[name](((t / per) % 1 + 1) % 1, t, B, false); }
  const P = POSES[name] || POSES.relaxed;
  return ST.animate ? breathe(P, t) : P;
}
function stagePose(B) {
  if (ST.mode === 'anim') {
    const a = cur();
    if (!a) return POSES.relaxed;
    const P = poseAt(a, ST.u);
    return ST.playing && a.breathe !== false ? breathe(P, T) : P;
  }
  return previewPose(ST.previewPose, T, B);
}

/* ================================================================ frames (local ↔ stage) */
// The head as drawAvatar places it: translate(head) rotate(ha) scale(hs), plus the hair shift
// as the head turns (hairT) or the face offset.
function headXf(J, P, hairT, faceOff) {
  const hs = J.headR / 19, haD = (P.h || 0) + (180 - J.neckA) * 0.6, ha = haD * D2R, tw = P.tw || 0, c = Math.cos(ha), s = Math.sin(ha);
  return {
    haD, k: hs,
    toW: (q) => { let [x, y] = q; if (hairT) x = 2.2 * tw + (1 + 0.07 * tw) * x; if (faceOff) { x += -3.7 * (1 - tw); y += 1; } x *= hs; y *= hs; return [J.head[0] + x * c - y * s, J.head[1] + x * s + y * c]; },
    toL: (q) => { let x = q[0] - J.head[0], y = q[1] - J.head[1]; [x, y] = [x * c + y * s, -x * s + y * c]; x /= hs; y /= hs; if (faceOff) { x -= -3.7 * (1 - tw); y -= 1; } if (hairT) x = (x - 2.2 * tw) / (1 + 0.07 * tw); return [x, y]; },
  };
}
function torsoXf(J, B, art, t) {
  const M = torsoMap(J, B.w), p = M(+art.u || 0, +art.v || 0, 0), r = (180 - J.chestA + (+art.sway || 0) * Math.sin(t * 2.1)) * D2R, c = Math.cos(r), s = Math.sin(r);
  return { k: 1, toW: ([x, y]) => [p[0] + x * c - y * s, p[1] + x * s + y * c], toL: (q) => { const x = q[0] - p[0], y = q[1] - p[1]; return [x * c + y * s, -x * s + y * c]; }, origin: p };
}
const PART_WHERE = { torso: 'torso', arms: 'armF', armF: 'armF', armB: 'armB', legs: 'legF', legF: 'legF', legB: 'legB' };
function garX(where, J, B) {
  const tp = TOPS[wearing().top];
  return { J, W: B.w, M: torsoMap(J, B.w), ex: (tp && tp.top && tp.top.fit) || 2, L: { armF: J.aF, armB: J.aB, legF: J.lF, legB: J.lB }[where] };
}
// Body part space <-> stage: the same mapping the game uses, inverted numerically.
function limbInv(map) {
  const ts = [...Array(71)].map((_, i) => -0.3 + (1.5 * i) / 70), C = ts.map((t) => map([t, 0]));
  return (w) => {
    let best = 0, bd = Infinity, bk = 0;
    for (let i = 0; i < C.length - 1; i++) {
      const a = C[i], b = C[i + 1], dx = b[0] - a[0], dy = b[1] - a[1], l2 = dx * dx + dy * dy || 1;
      const k = clamp(((w[0] - a[0]) * dx + (w[1] - a[1]) * dy) / l2, 0, 1), x = a[0] + dx * k - w[0], y = a[1] + dy * k - w[1], d = x * x + y * y;
      if (d < bd) { bd = d; best = i; bk = k; }
    }
    const t = ts[best] + (ts[best + 1] - ts[best]) * bk, c = map([t, 0]), e = map([t, 1]), ax = e[0] - c[0], ay = e[1] - c[1];
    return [t, ((w[0] - c[0]) * ax + (w[1] - c[1]) * ay) / (ax * ax + ay * ay || 1)];
  };
}
function torsoInv(map) {
  return (w) => {
    let best = [0, 0.5], bd = Infinity;
    for (let u = -1.8; u <= 1.8; u += 0.15) for (let v = -1.6; v <= 1.5; v += 0.1) { const q = map([u, v]), d = (q[0] - w[0]) ** 2 + (q[1] - w[1]) ** 2; if (d < bd) { bd = d; best = [u, v]; } }
    let [u, v] = best;
    for (let i = 0; i < 8; i++) {
      const q = map([u, v]), e = 1e-3, qu = map([u + e, v]), qv = map([u, v + e]);
      const a = (qu[0] - q[0]) / e, b = (qv[0] - q[0]) / e, c = (qu[1] - q[1]) / e, d = (qv[1] - q[1]) / e, det = a * d - b * c;
      if (Math.abs(det) < 1e-9) break;
      const rx = w[0] - q[0], ry = w[1] - q[1];
      u += (d * rx - b * ry) / det; v += (-c * rx + a * ry) / det;
    }
    return [u, v];
  };
}
function garFrame(pc, J, B) {
  if (!pc) return null;
  const where = PART_WHERE[pc.part] || 'torso', map = garmentMap(where, garX(where, J, B));
  return { k: 1, where, toW: map, toL: where === 'torso' ? torsoInv(map) : limbInv(map) };
}
function vecFrame(J, P, B) {
  if (ST.mode === 'hair') return headXf(J, P, true, false);
  if (GAR_MODES[ST.mode]) return garFrame(curLayer(), J, B);
  if (ST.mode === 'hat') return headXf(J, P, false, false);
  if (ST.mode === 'face') return headXf(J, P, false, true);
  if (ST.mode === 'back') { const it = cur(); return it ? torsoXf(J, B, it.art, T) : null; }
  return null;
}
function vecLayers() {
  const it = cur();
  if (!it) return [];
  if (ST.mode === 'back') return it.art.layers;
  if (GAR_MODES[ST.mode]) return it.pieces || (it.pieces = []);
  if (ST.mode === 'hair') return it.masses || (it.masses = []);
  return it.layers;
}
const curLayer = () => { const L = vecLayers(); ST.layer = clamp(ST.layer, 0, Math.max(0, L.length - 1)); return L[ST.layer] || null; };
const curLock = () => { const it = ST.mode === 'hair' && cur(); if (!it) return null; ST.lock = clamp(ST.lock, -1, it.locks.length - 1); return it.locks[ST.lock] || null; };
const curEmitter = () => { const it = ST.mode === 'aura' && cur(); if (!it) return null; ST.emitter = clamp(ST.emitter, 0, Math.max(0, it.emitters.length - 1)); return it.emitters[ST.emitter] || null; };

/* ================================================================ stage */
const stage = $('#stage');
let T = 0.6, lastNow = 0, lastDraw = 0, needReg = true, drag = null, hoverH = '', spaceDown = false, lastPD = { t: 0, id: '' };
const BGS = { dark: ['Dark', '#14161d', '#1b1e27'], mid: ['Dusk', '#2b3040', '#333a4d'], light: ['Light', '#d9dde6', '#cdd2dd'], green: ['Green', '#1f6b3a', '#226f3e'], sky: ['Sky', '#5b8fd6', '#6699dd'] };
function zoomK() { const m = stage.getScreenCTM(); return m ? m.a : 1; }
function bgSVG() {
  const [, a, b] = BGS[ST.bg] || BGS.dark, V = ST.view, step = V.w > 140 ? 20 : 5;
  let g = '';
  const x0 = Math.floor((V.x - V.w) / step) * step, x1 = V.x + V.w * 2, y0 = Math.floor((V.y - V.h) / step) * step, y1 = V.y + V.h * 2;
  for (let x = x0; x <= x1; x += step) g += `M${x},${y0}V${y1}`;
  for (let y = y0; y <= y1; y += step) g += `M${x0},${y}H${x1}`;
  return `<rect x="${V.x - V.w}" y="${V.y - V.h}" width="${V.w * 3}" height="${V.h * 3}" fill="${a}"/>`
    + `<path d="${g}" stroke="${b}" stroke-width="${rd2(1 / zoomK())}" fill="none"/>`
    + `<path d="M${x0},${GROUND}H${x1}" stroke="${ST.bg === 'light' ? '#9aa3b5' : '#3c4258'}" stroke-width="${rd2(1.4 / zoomK())}"/>`;
}
function setView(v) { ST.view = v; stage.setAttribute('viewBox', `${rd(v.x)} ${rd(v.y)} ${rd(v.w)} ${rd(v.h)}`); }
function fitBody() { setView({ x: -14, y: 2, w: 228, h: 240 }); }
function fitHead() {
  const B = cosOf('build', wearing().build).b, J = solve(stagePose(B), B);
  setView({ x: J.head[0] - 38, y: J.head[1] - 46, w: 76, h: 84 });
}
function fitTorso() {
  const B = cosOf('build', wearing().build).b, J = solve(stagePose(B), B);
  setView({ x: J.pelvis[0] - 70, y: J.neckBase[1] - 40, w: 140, h: 150 });
}
function autoFit() { if (HEAD_MODES[ST.mode]) fitHead(); else if (ST.mode === 'back' && cur() && cur().art.layers.length && !cur().cape.on) fitTorso(); else fitBody(); }

function stagePt(ev) {
  const m = stage.getScreenCTM();
  if (!m) return [0, 0];
  const p = new DOMPoint(ev.clientX, ev.clientY).matrixTransform(m.inverse());
  return [p.x, p.y];
}
// Handle markup: r in screen pixels.
function hdl(id, p, cls, shape) {
  const r = 5.5 / zoomK(), x = rd2(p[0]), y = rd2(p[1]);
  const on = hoverH === id || (drag && drag.id === id) ? ' hot' : '';
  if (shape === 'sq') return `<rect class="h ${cls}${on}" data-h="${id}" x="${x - r}" y="${y - r}" width="${r * 2}" height="${r * 2}" rx="${r * 0.25}"/>`;
  if (shape === 'di') return `<rect class="h ${cls}${on}" data-h="${id}" x="${x - r * 0.85}" y="${y - r * 0.85}" width="${r * 1.7}" height="${r * 1.7}" transform="rotate(45 ${x} ${y})"/>`;
  return `<circle class="h ${cls}${on}" data-h="${id}" cx="${x}" cy="${y}" r="${shape === 'sm' ? r * 0.7 : r}"/>`;
}
const seg = (a, b, cls) => `<path class="bone ${cls || ''}" d="M${rd2(a[0])},${rd2(a[1])}L${rd2(b[0])},${rd2(b[1])}" stroke-width="${rd2(1.6 / zoomK())}"/>`;

function handlesSVG(P, B, A) {
  if (!ST.handles) return '';
  const J = solve(P, B), out = [];
  if (ST.mode === 'cuts') {
    const C = HAIR_CUTS[ST.cut];
    if (!C) return '';
    const hx = headXf(J, P, true, false), pt = (q) => hx.toW(q), path = (Q) => Q.map(pt).map((p) => `${rd2(p[0])},${rd2(p[1])}`).join('L');
    const x0 = C.x, y0 = C.y, x1 = C.x + C.w, y1 = C.y + C.h;
    if (ST.guide) out.push(guideHead(headXf(J, P, false, false)));
    out.push(`<path class="bone o" d="M${path([[x0, y0], [x1, y0], [x1, y1], [x0, y1]])}Z" fill="none" stroke-width="${rd2(1 / zoomK())}" stroke-dasharray="${rd2(3 / zoomK())}"/>`);
    out.push(hdl('cut:move', pt([(x0 + x1) / 2, (y0 + y1) / 2]), 'f', 'di'), hdl('cut:size', pt([x1, y1]), 'w', 'sq'), hdl('cut:sw', pt([x1, (y0 + y1) / 2]), 'o', 'sm'), hdl('cut:sh', pt([(x0 + x1) / 2, y1]), 'o', 'sm'));
    return `<g class="handles">${out.join('')}</g>`;
  }
  if (ST.mode === 'anim') {
    if (ST.playing || !cur()) return '';
    const wpnHand = add(J.aF[2], J.foreA.aF, 4.2 * B.w);
    const shown = (P.prop || (A.weapon && !P.sh));
    out.push(seg(J.pelvis, J.waist, 's'), seg(J.waist, J.neckBase, 's'), seg(J.neckBase, J.head, 's'));
    out.push(seg(J.shB, J.aB[1], 'b'), seg(J.aB[1], J.aB[2], 'b'), seg(J.hipB, J.lB[1], 'b'), seg(J.lB[1], J.lB[2], 'b'), seg(J.lB[2], J.lB[3], 'b'));
    out.push(seg(J.shF, J.aF[1], 'f'), seg(J.aF[1], J.aF[2], 'f'), seg(J.hipF, J.lF[1], 'f'), seg(J.lF[1], J.lF[2], 'f'), seg(J.lF[2], J.lF[3], 'f'));
    const hx = headXf(J, P, false, false);
    out.push(seg(J.head, hx.toW([0, -27]), 's'));
    out.push(hdl('kneeB', J.lB[1], 'b'), hdl('ankB', J.lB[2], 'b', 'sq'), hdl('toeB', J.lB[3], 'b', 'sm'), hdl('elbB', J.aB[1], 'b'), hdl('handB', J.aB[2], 'b', 'sq'));
    out.push(hdl('pelvis', J.pelvis, 's', 'di'), hdl('waist', J.waist, 's'), hdl('chest', J.neckBase, 's'), hdl('head', J.head, 's'), hdl('tilt', hx.toW([0, -27]), 's', 'sm'));
    out.push(hdl('kneeF', J.lF[1], 'f'), hdl('ankF', J.lF[2], 'f', 'sq'), hdl('toeF', J.lF[3], 'f', 'sm'), hdl('elbF', J.aF[1], 'f'), hdl('handF', J.aF[2], 'f', 'sq'));
    if (shown) { const w = add(wpnHand, J.foreA.aF + (P.g || 0), 34); out.push(seg(wpnHand, w, 'w'), hdl('wpn', w, 'w', 'di')); }
    return `<g class="handles">${out.join('')}</g>`;
  }
  if (ST.mode === 'hair' && !isVec()) {
    const it = cur();
    if (it && it.v2) {
      // your own locks: the stroke being drawn, and (with a tool on) the spines of the ones already drawn
      const hx = headXf(J, P, true, false), line = (Q, cls, w) => `<path class="bone ${cls}" d="M${Q.map((q) => hx.toW(q)).map((p) => `${rd2(p[0])},${rd2(p[1])}`).join('L')}" stroke-width="${rd2(w / zoomK())}"/>`;
      if (ST.tool === 'h2draw' || ST.tool === 'h2erase') for (const st of it.v2.strokes || []) out.push(line(st.pts, ST.tool === 'h2erase' ? 'b' : 'o', 1.4));
      if (drag && drag.h2 && drag.h2.length > 1) out.push(line(drag.h2, 'f', 3));
      return `<g class="handles">${out.join('')}</g>`;
    }
    if (!it) return '';
    const hx = headXf(J, P, true, false);
    if (drag && drag.brush && drag.brush.length > 1) out.push(`<path class="bone f" d="M${drag.brush.map((q) => hx.toW(q)).map((p) => `${rd2(p[0])},${rd2(p[1])}`).join('L')}" stroke-width="${rd2(3 / zoomK())}"/>`);
    if (ST.guide) out.push(guideHead(headXf(J, P, false, false)));
    it.locks.forEach((L, i) => {
      if (i === ST.lock) return;
      out.push(hdl('lr:' + i, hx.toW([L.x, L.y]), L.back ? 'b' : 'o', 'sm'));
    });
    const L = curLock();
    if (L) {
      const { sp } = lockPts(L, hx.haD, T), W = sp.map(hx.toW);
      out.push(`<path class="bone o" d="M${W.map((p) => `${rd2(p[0])},${rd2(p[1])}`).join('L')}" stroke-width="${rd2(1.6 / zoomK())}"/>`);
      if (L.path) { out.push(hdl('lr:' + ST.lock, W[0], 'f', 'sq')); W.slice(1).forEach((p, j) => out.push(hdl(`lp:${ST.lock}:${j}`, p, 'f', 'sm'))); }
      else out.push(hdl('lr:' + ST.lock, W[0], 'f', 'sq'), hdl('lb:' + ST.lock, W[3], 'w', 'di'), hdl('lt:' + ST.lock, W[W.length - 1], 'f'));
    }
    return `<g class="handles">${out.join('')}</g>`;
  }
  if (isVec()) {
    const fr = vecFrame(J, P, B), L = curLayer();
    if (!fr) return '';
    if (ST.guide) {
      if (GAR_MODES[ST.mode]) out.push(guidePart(fr));
      else if (ST.mode === 'hair') out.push(guideHead(headXf(J, P, false, false)));
      else if (ST.mode === 'back') out.push(`<g class="guide">${seg(add(fr.origin, 90, -8 / zoomK()), add(fr.origin, 90, 8 / zoomK()))}${seg(add(fr.origin, 0, -8 / zoomK()), add(fr.origin, 0, 8 / zoomK()))}</g>`);
      else out.push(guideHead(headXf(J, P, false, false)));
    }
    if (!L) return `<g class="handles">${out.join('')}</g>`;
    if (L.kind === 'circle') {
      out.push(hdl('cc', fr.toW([L.cx, L.cy]), 'f', 'sq'), hdl('cr', fr.toW([L.cx + L.r, L.cy]), 'w', 'di'));
    } else if (L.kind === 'shape') {
      const W = L.pts.map((p) => fr.toW(p));
      if (W.length > 1) out.push(`<path class="bone o" d="M${W.map((p) => `${rd2(p[0])},${rd2(p[1])}`).join('L')}${L.closed ? 'Z' : ''}" stroke-width="${rd2(1 / zoomK())}" stroke-dasharray="${rd2(3 / zoomK())}"/>`);
      const n = W.length;
      for (let i = 0; i < n; i++) {
        const j = (i + 1) % n;
        if (n > 1 && (j > i || L.closed)) out.push(hdl('m:' + i, [(W[i][0] + W[j][0]) / 2, (W[i][1] + W[j][1]) / 2], 'mid', 'sm'));
      }
      W.forEach((p, i) => out.push(hdl('p:' + i, p, (i === ST.point ? 'sel ' : '') + (L.pts[i][2] ? 'w' : 'f'), L.pts[i][2] ? 'di' : 'sq')));
    }
    return `<g class="handles">${out.join('')}</g>`;
  }
  return '';
}
// The outline of the body part a piece is drawn on (torso: u -1..1, v 0..1; limbs: t 0..1, s -1..1).
function guidePart(fr) {
  const torso = fr.where === 'torso', box = torso ? [[-1, 0], [1, 0], [1, 1], [-1, 1]] : [[0, -1], [1, -1], [1, 1], [0, 1]], pts = [];
  for (let i = 0; i < 4; i++) { const a = box[i], b = box[(i + 1) % 4]; for (let k = 0; k < 8; k++) pts.push(fr.toW([a[0] + ((b[0] - a[0]) * k) / 8, a[1] + ((b[1] - a[1]) * k) / 8])); }
  const mid = torso ? [[0, -0.2], [0, 1.1]] : [[0.5, -1.3], [0.5, 1.3]];
  return `<g class="guide"><path d="M${pts.map((p) => `${rd2(p[0])},${rd2(p[1])}`).join('L')}Z" stroke-width="${rd2(1 / zoomK())}" stroke-dasharray="${rd2(3 / zoomK())}"/>${seg(fr.toW(mid[0]), fr.toW(mid[1]))}</g>`;
}
function guideHead(hx) {
  const c = hx.toW([0, 0]), r = 19 * hx.k;
  return `<g class="guide"><circle cx="${rd2(c[0])}" cy="${rd2(c[1])}" r="${rd2(r)}" stroke-width="${rd2(1 / zoomK())}" stroke-dasharray="${rd2(3 / zoomK())}"/></g>`;
}
function onionSVG(A, B) {
  const a = cur();
  if (!a || !ST.onion || ST.playing || a.keys.length < 2) return '';
  const ks = a.keys, i = ks.findIndex((k) => k.u > ST.u + 0.0005), here = keyIdxAt(a, ST.u);
  const prev = here >= 0 ? ks[here - 1] : ks[(i < 0 ? ks.length : i) - 1], next = i >= 0 ? ks[i] : null;
  const ghost = (k, col, uid) => {
    if (!k) return '';
    const G = Object.assign({}, A, { style: 'flat', ink: col, aura: 'none', back: 'none' });
    return `<g class="ghost" opacity=".28">${drawAvatar(G, customPose(k.p), T, { weapon: ST.man.weapon, uid })}</g>`;
  };
  return ghost(prev, '#ff6a6a', 'onA') + ghost(next, '#5fb4ff', 'onB');
}
function drawStage() {
  if (ST.mode === 'pack') return;
  if (ST.mode === 'cuts') ensureCutsLive();
  const A = wearing(), B = cosOf('build', A.build).b, P = stagePose(B);
  let s = bgSVG();
  if (ST.mode === 'anim') s += onionSVG(A, B);
  try { s += drawAvatar(A, P, T, { weapon: ST.man.weapon, uid: 'stg' }); } catch (e) { s += `<text x="20" y="40" fill="#ff6a6a" font-size="8">Drawing error: ${esc(e.message)}</text>`; }
  try { s += handlesSVG(P, B, A); } catch (e) { /* handles are best effort */ }
  stage.innerHTML = s;
}
function tick(now) {
  requestAnimationFrame(tick);
  const dt = Math.min(0.1, (now - lastNow) / 1000 || 0);
  lastNow = now;
  if (ST.animate && !(drag && ST.mode === 'hair')) T += dt;
  if (ST.playing && ST.mode === 'anim' && cur()) {
    ST.u += (dt * ST.speed) / Math.max(0.05, +cur().dur || 1);
    if (ST.u >= 1) { if (ST.loop) ST.u %= 1; else { ST.u = 1; ST.playing = false; renderTimeline(); } }
  }
  if (now - lastDraw < 30) return;
  lastDraw = now;
  ensureReg();
  drawStage();
  updatePlayhead();
}

/* ---------------------------------------------------------------- stage input */
stage.addEventListener('pointerdown', (ev) => {
  if (ST.mode === 'pack') return;
  const w = stagePt(ev), h = ev.target.closest('[data-h]');
  stage.setPointerCapture(ev.pointerId);
  if (ev.button === 1 || ev.button === 2 || spaceDown) { drag = { pan: 1, from: [ev.clientX, ev.clientY], v: Object.assign({}, ST.view) }; ev.preventDefault(); return; }
  if (ST.mode === 'hair' && !isVec() && ST.tool === 'brush' && cur()) { drag = { brush: [frameNow().toL(w)] }; return; }
  if (ST.mode === 'hair' && cur() && cur().v2 && ST.tool === 'h2draw') { drag = { h2: [frameNow().toL(w)] }; return; }
  if (ST.mode === 'hair' && cur() && cur().v2 && ST.tool === 'h2erase') { h2Erase(frameNow().toL(w)); return; }
  if (h) {
    const id = h.dataset.h;
    const dbl = performance.now() - lastPD.t < 350 && lastPD.id === id;
    lastPD = { t: performance.now(), id };
    if (isVec() && id.startsWith('p:')) {
      const L = curLayer(), i = +id.slice(2);
      if (ev.altKey || dbl) { L.pts.splice(i, 1); ST.point = Math.min(i, L.pts.length - 1); commit(); renderRight(); return; }
      if (ev.shiftKey) { if (L.pts[i][2]) L.pts[i].length = 2; else L.pts[i][2] = 1; commit(); return; }
      ST.point = i;
    }
    if (isVec() && id.startsWith('m:')) {
      const L = curLayer(), i = +id.slice(2), fr = frameNow();
      L.pts.splice(i + 1, 0, snapP(fr.toL(w)));
      ST.point = i + 1;
      drag = { id: 'p:' + (i + 1) };
      return;
    }
    if (ST.mode === 'hair' && id.startsWith('lr:') && +id.slice(3) !== ST.lock) { ST.lock = +id.slice(3); renderRight(); }
    drag = { id };
    return;
  }
  // empty stage: the active tool, else pan
  if (ST.mode === 'hair' && !isVec() && ST.tool === 'addlock' && cur()) {
    const fr = frameNow(), q = fr.toL(w), it = cur();
    it.locks.push(roundLock({ x: q[0], y: q[1], a: Math.atan2(q[1], q[0]) / D2R, len: 2, w: 8, bend: 0, tp: 0.8 }));
    ST.lock = it.locks.length - 1;
    drag = { id: 'lt:' + ST.lock, add: 1 };
    renderRight();
    return;
  }
  if (isVec() && ST.tool === 'draw' && curLayer() && curLayer().kind === 'shape') {
    const L = curLayer(), q = snapP(frameNow().toL(w)), at = ST.point >= 0 && ST.point < L.pts.length - 1 ? ST.point + 1 : L.pts.length;
    L.pts.splice(at, 0, q);
    ST.point = at;
    drag = { id: 'p:' + at };
    return;
  }
  drag = { pan: 1, from: [ev.clientX, ev.clientY], v: Object.assign({}, ST.view), click: 1 };
});
stage.addEventListener('pointermove', (ev) => {
  if (!drag) {
    const h = ev.target.closest && ev.target.closest('[data-h]');
    hoverH = h ? h.dataset.h : '';
    stage.style.cursor = h ? 'grab' : (ST.tool && TYPES[ST.mode] ? 'crosshair' : 'default');
    return;
  }
  if (drag.h2) {
    const q = frameNow().toL(stagePt(ev)), l = drag.h2[drag.h2.length - 1];
    if (Math.hypot(q[0] - l[0], q[1] - l[1]) > 0.5) drag.h2.push(q);
    return;
  }
  if (drag.brush) {
    const q = frameNow().toL(stagePt(ev)), l = drag.brush[drag.brush.length - 1];
    if (Math.hypot(q[0] - l[0], q[1] - l[1]) > 0.6) drag.brush.push(q);
    return;
  }
  if (drag.pan) {
    const k = zoomK(), dx = (ev.clientX - drag.from[0]) / k, dy = (ev.clientY - drag.from[1]) / k;
    if (Math.abs(dx) + Math.abs(dy) > 1) drag.click = 0;
    setView({ x: drag.v.x - dx, y: drag.v.y - dy, w: drag.v.w, h: drag.v.h });
    return;
  }
  applyDrag(drag.id, stagePt(ev), ev);
  drag.moved = 1;
  needReg = true;
});
function endDrag() {
  if (!drag) return;
  const was = drag;
  drag = null;
  if (was.pan) { if (was.click && isVec()) { ST.point = -1; } return; }
  if (was.brush) { brushLock(was.brush); return; }
  if (was.h2) { h2AddStroke(was.h2); return; }
  if (ST.mode === 'cuts') { ST.pack.cuts = normCuts(ST.pack.cuts); commit(); renderLeft(); renderRight(); renderTop(); return; }
  if (was.add && ST.mode === 'hair') { const L = curLock(); if (L && L.len < 3) L.len = 10; if (L && ST.sym) cur().locks.push(mirrorLock(L)); }
  commit();
  renderRight();
  if (ST.mode === 'anim') renderTimeline();
}
stage.addEventListener('pointerup', endDrag);
stage.addEventListener('pointercancel', endDrag);
stage.addEventListener('contextmenu', (ev) => ev.preventDefault());
stage.addEventListener('wheel', (ev) => {
  ev.preventDefault();
  const w = stagePt(ev), f = Math.exp(ev.deltaY * 0.0015), V = ST.view;
  const nw = clamp(V.w * f, 20, 900), k = nw / V.w;
  setView({ x: w[0] - (w[0] - V.x) * k, y: w[1] - (w[1] - V.y) * k, w: nw, h: V.h * k });
}, { passive: false });
function frameNow() {
  const A = wearing(), B = cosOf('build', A.build).b, P = stagePose(B), J = solve(P, B);
  return ST.mode === 'hair' || ST.mode === 'cuts' ? headXf(J, P, true, false) : vecFrame(J, P, B);
}
// A stroke drawn on a v2 haircut becomes one of its locks: from the end nearer the head's centre
// (where the hair grows) to the other (its tip), resampled, mirrored if asked.
let h2Group = 0;
function h2AddStroke(S0) {
  const it = cur();
  if (!it || !it.v2 || S0.length < 3) return;
  let len = 0;
  for (let i = 1; i < S0.length; i++) len += Math.hypot(S0[i][0] - S0[i - 1][0], S0[i][1] - S0[i - 1][1]);
  if (len < 2) return;
  const c = [0, -4], d0 = Math.hypot(S0[0][0] - c[0], S0[0][1] - c[1]), d1 = Math.hypot(S0[S0.length - 1][0] - c[0], S0[S0.length - 1][1] - c[1]);
  const Q = d1 < d0 ? S0.slice().reverse() : S0, pts = h2Resample(Q, clamp(Math.round(len / 2.2), 4, 14)).map((q) => [rd(q[0]), rd(q[1])]);
  const g = ++h2Group + Date.now() % 100000, b = ST.h2d, st = { l: b.l, w: b.w, tip: b.tip, pts, g };
  it.v2.strokes = it.v2.strokes || [];
  it.v2.strokes.push(st);
  if (ST.sym) it.v2.strokes.push(Object.assign({}, st, { pts: pts.map(([x, y]) => [rd(-x), y]) }));
  commit(); renderRight(); renderLeft();
}
function h2Erase(q) {
  const it = cur(), L = (it && it.v2 && it.v2.strokes) || [];
  let best = -1, bd = Infinity;
  L.forEach((st, i) => {
    for (let k = 1; k < st.pts.length; k++) {
      const a = st.pts[k - 1], b = st.pts[k], dx = b[0] - a[0], dy = b[1] - a[1], f = clamp(((q[0] - a[0]) * dx + (q[1] - a[1]) * dy) / (dx * dx + dy * dy || 1), 0, 1);
      const dd = Math.hypot(a[0] + dx * f - q[0], a[1] + dy * f - q[1]) - (st.w || 7) / 2;
      if (dd < bd) { bd = dd; best = i; }
    }
  });
  if (best < 0 || bd > 2.5) return;
  const g = L[best].g;
  it.v2.strokes = L.filter((st, i) => i !== best && !(g && st.g === g));
  commit(); renderRight(); renderLeft();
}
// A freehand stroke on the head becomes a lock: root at the start, the stroke resampled as its spine.
function brushLock(S0) {
  const it = cur();
  if (!it || S0.length < 3) return;
  let len = 0;
  const acc = [0];
  for (let i = 1; i < S0.length; i++) { len += Math.hypot(S0[i][0] - S0[i - 1][0], S0[i][1] - S0[i - 1][1]); acc.push(len); }
  if (len < 2) return;
  const n = clamp(Math.round(len / 3), 3, 12), r = S0[0], path = [];
  for (let k = 1; k <= n; k++) {
    const d = (len * k) / n;
    let i = 1;
    while (i < acc.length - 1 && acc[i] < d) i++;
    const f = (d - acc[i - 1]) / (acc[i] - acc[i - 1] || 1), q = [S0[i - 1][0] + (S0[i][0] - S0[i - 1][0]) * f, S0[i - 1][1] + (S0[i][1] - S0[i - 1][1]) * f];
    path.push([rd(q[0] - r[0]), rd(q[1] - r[1])]);
  }
  const b = ST.brush, L = { x: rd(r[0]), y: rd(r[1]), w: b.w, tp: b.tp, path };
  if (b.back) L.back = 1;
  if (b.hang) L.hang = 1;
  if (b.k) L.k = 'crown';
  it.locks.push(L);
  if (ST.sym) it.locks.push(mirrorLock(L));
  ST.lock = it.locks.length - (ST.sym ? 2 : 1);
  commit(); renderRight();
}
function mirrorLock(L) {
  const c = clone(L);
  c.x = -c.x;
  if (c.path) c.path = c.path.map(([x, y]) => [-x, y]);
  else { c.a = rd(180 - c.a); c.bend = -c.bend; }
  return c;
}
const snapP = (q) => (GAR_MODES[ST.mode] ? [rd2(q[0]), rd2(q[1])] : ST.snap ? [Math.round(q[0] * 2) / 2, Math.round(q[1] * 2) / 2] : [rd2(q[0]), rd2(q[1])]);

function applyDrag(id, w, ev) {
  if (ST.mode === 'cuts' && id.startsWith('cut:')) { dragCut(id.slice(4), frameNow().toL(w)); return; }
  const A = wearing(), B = cosOf('build', A.build).b;
  if (ST.mode === 'anim') {
    const k = ensureKey();
    if (!k) return;
    const p = k.p, full = customPose(p), J = solve(full, B), s = B.h;
    switch (id) {
      case 'pelvis': p.dx = rd(full.dx + (w[0] - J.pelvis[0])); if (ev.shiftKey) p.air = rd(Math.max(0, (full.air || 0) - (w[1] - J.pelvis[1]))); break;
      case 'waist': p.t1 = near(full.t1, ang(J.pelvis, w)); break;
      case 'chest': p.t2 = near(full.t2, ang(J.waist, w) - full.t1); break;
      case 'head': p.n = near(full.n, ang(J.neckBase, w) - J.chestA); break;
      case 'tilt': { const ha = Math.atan2(w[0] - J.head[0], -(w[1] - J.head[1])) / D2R; p.h = near(full.h, ha - (180 - J.neckA) * 0.6); break; }
      case 'elbF': p.aF = [near(full.aF[0], ang(J.shF, w)), full.aF[1]]; break;
      case 'elbB': p.aB = [near(full.aB[0], ang(J.shB, w)), full.aB[1]]; break;
      case 'handF': case 'handB': {
        const f = id === 'handF' ? 'aF' : 'aB', sh = id === 'handF' ? J.shF : J.shB;
        const r = ik2(sh, w, 23 * s, 21 * s, ev.altKey ? 1 : -1);
        p[f] = [near(full[f][0], r[0]), near(full[f][1], r[1])];
        break;
      }
      case 'kneeF': p.lF = [near(full.lF[0], ang(J.hipF, w)), full.lF[1]]; break;
      case 'kneeB': p.lB = [near(full.lB[0], ang(J.hipB, w)), full.lB[1]]; break;
      case 'ankF': case 'ankB': {
        const f = id === 'ankF' ? 'lF' : 'lB', hip = id === 'ankF' ? J.hipF : J.hipB;
        const r = ik2(hip, w, 36 * s, 35 * s, ev.altKey ? -1 : 1);
        p[f] = [near(full[f][0], r[0]), near(full[f][1], r[1])];
        break;
      }
      case 'toeF': p.fF = near(full.fF, ang(J.lF[2], w) - 90); break;
      case 'toeB': p.fB = near(full.fB, ang(J.lB[2], w) - 90); break;
      case 'wpn': { const hand = add(J.aF[2], J.foreA.aF, 4.2 * B.w); p.g = near(full.g, ang(hand, w) - J.foreA.aF); break; }
    }
    return;
  }
  const fr = frameNow();
  if (!fr) return;
  if (ST.mode === 'hair' && !isVec()) {
    const it = cur(), i = +id.split(':')[1], L = it && it.locks[i];
    if (!L) return;
    const q = fr.toL(w);
    if (id.startsWith('lr:')) { L.x = rd(q[0]); L.y = rd(q[1]); return; }
    if (id.startsWith('lp:')) {
      const j = +id.split(':')[2], sw = L.sw ? Math.sin(T * 2.1 + (L.ph || 0)) * L.sw : 0, r = ((L.hang ? -fr.haD : 0) + sw) * D2R, c = Math.cos(r), sn = Math.sin(r);
      const x = q[0] - L.x, y = q[1] - L.y;
      L.path[j] = [rd(x * c + y * sn), rd(-x * sn + y * c)];
      return;
    }
    const sway = L.sw ? Math.sin(T * 2.1 + (L.ph || 0)) * L.sw : 0;
    if (id.startsWith('lt:')) {
      const d = Math.hypot(q[0] - L.x, q[1] - L.y), phi = Math.atan2(q[1] - L.y, q[0] - L.x) / D2R, b = (L.bend || 0) * D2R;
      const cf = Math.abs(b) < 1e-3 ? 1 : Math.sin(b / 2) / (b / 2);
      L.a = rd(phi + (L.hang ? fr.haD : 0) - sway);
      L.len = rd(Math.max(2, d / Math.max(0.2, cf)));
      return;
    }
    if (id.startsWith('lb:')) {
      const { sp } = lockPts(L, fr.haD, T), tip = sp[sp.length - 1], c = Math.hypot(tip[0] - L.x, tip[1] - L.y) || 1;
      const phi = Math.atan2(tip[1] - L.y, tip[0] - L.x), mid = [(L.x + tip[0]) / 2, (L.y + tip[1]) / 2];
      const sg = (q[0] - mid[0]) * Math.sin(phi) - (q[1] - mid[1]) * Math.cos(phi);
      L.bend = rd(clamp(((8 * sg) / c) / D2R, -200, 200));
    }
    return;
  }
  if (isVec()) {
    const L = curLayer(), q = fr.toL(w);
    if (!L) return;
    if (id.startsWith('p:')) { const i = +id.slice(2), c = L.pts[i] && L.pts[i][2]; L.pts[i] = snapP(q); if (c) L.pts[i][2] = 1; }
    else if (id === 'cc') { const s = snapP(q); L.cx = s[0]; L.cy = s[1]; }
    else if (id === 'cr') L.r = rd2(Math.max(0.3, Math.hypot(q[0] - L.cx, q[1] - L.cy)));
  }
}

/* ================================================================ panels: html helpers */
const fid = () => 'f' + Math.random().toString(36).slice(2, 8);
function getB(b) {
  const [r, path] = b.split(':');
  let o = r === 'key' ? (curKey() ? customPose(curKey().p) : null) : rootOf(r);
  for (const k of path.split('.')) { if (o == null) return undefined; o = o[k]; }
  return o;
}
function setB(b, v) {
  const [r, path] = b.split(':'), ks = path.split('.');
  let o = r === 'key' ? (ensureKey() || {}).p : rootOf(r);
  if (!o) return;
  for (let i = 0; i < ks.length - 1; i++) {
    if (o[ks[i]] == null || typeof o[ks[i]] !== 'object') o[ks[i]] = /^\d+$/.test(ks[i + 1]) ? [] : {};
    o = o[ks[i]];
  }
  o[ks[ks.length - 1]] = v;
}
function rootOf(r) {
  switch (r) {
    case 'item': return cur();
    case 'keyt': return curKey();
    case 'lock': return curLock();
    case 'layer': return curLayer();
    case 'em': return curEmitter();
    case 'man': return ST.man;
    case 'st': return ST;
    case 'cut': { if (!HAIR_CUTS[ST.cut]) return null; const C = ST.pack.cuts || (ST.pack.cuts = {}); return C[ST.cut] || (C[ST.cut] = { x: 0, y: 0, s: 100, sw: 100, sh: 100 }); }
    default: return null;
  }
}
const F = (label, inner, cls) => `<label class="f ${cls || ''}"><span>${label}</span>${inner}</label>`;
function fNum(label, b, min, max, step, rr) {
  const v = getB(b), val = v == null || !isFinite(v) ? 0 : v;
  return F(label, `<input type="range" min="${min}" max="${max}" step="${step}" value="${val}" data-bind="${b}" data-t="n"${rr ? ' data-rr="1"' : ''}><input class="n" type="number" min="${min}" max="${max}" step="${step}" value="${val}" data-bind="${b}" data-t="n"${rr ? ' data-rr="1"' : ''}>`);
}
const fCol = (label, b) => F(label, `<input type="color" value="${getB(b) || '#000000'}" data-bind="${b}" data-t="s"><code>${esc(getB(b) || '')}</code>`);
function fOptCol(label, b, def) {
  const v = getB(b), on = !!v && v !== 'none';
  return F(label, `<span class="oc"><input type="checkbox" data-octog="${b}" ${on ? 'checked' : ''}><input type="color" value="${on ? v : def || '#ffffff'}" data-bind="${b}" data-t="s" ${on ? '' : 'disabled'}></span>`);
}
const fChk = (label, b, rr) => `<label class="chk"><input type="checkbox" data-bind="${b}" data-t="b" ${getB(b) ? 'checked' : ''}${rr ? ' data-rr="1"' : ''}><span>${label}</span></label>`;
const fTxt = (label, b, ph) => F(label, `<input type="text" value="${esc(getB(b) == null ? '' : getB(b))}" data-bind="${b}" data-t="s" placeholder="${esc(ph || '')}" spellcheck="false">`);
function fSel(label, b, opts, rr, t) {
  const v = getB(b);
  const o = opts.map((x) => (Array.isArray(x[1]) ? `<optgroup label="${esc(x[0])}">${x[1].map(([k, l]) => `<option value="${esc(k)}" ${String(v) === String(k) ? 'selected' : ''}>${esc(l)}</option>`).join('')}</optgroup>` : `<option value="${esc(x[0])}" ${String(v) === String(x[0]) ? 'selected' : ''}>${esc(x[1])}</option>`)).join('');
  return F(label, `<select data-bind="${b}" data-t="${t || 's'}"${rr ? ' data-rr="1"' : ''}>${o}</select>`);
}
const fOptGroup = (label, b, def) => `<label class="chk"><input type="checkbox" data-ogtog="${b}" data-def='${esc(JSON.stringify(def))}' ${getB(b) ? 'checked' : ''}><span>${label}</span></label>`;
const btn = (label, act, arg, cls, title) => `<button class="b ${cls || ''}" data-act="${act}"${arg != null ? ` data-arg="${esc(arg)}"` : ''}${title ? ` title="${esc(title)}"` : ''}>${label}</button>`;
function sec(id, title, body, extra) {
  const shut = ST.open[id] === false;
  return `<section class="sec ${shut ? 'shut' : ''}"><h3 data-act="fold" data-arg="${id}"><i></i>${title}${extra ? `<em>${extra}</em>` : ''}</h3><div class="sb">${body}</div></section>`;
}
const row = (...x) => `<div class="row">${x.join('')}</div>`;
const note = (t, cls) => `<p class="note ${cls || ''}">${t}</p>`;

// Small inline icons (no emoji in the game's UI kit).
const IC = {
  play: '<svg viewBox="0 0 16 16"><path d="M4 2.5v11l9-5.5z"/></svg>',
  pause: '<svg viewBox="0 0 16 16"><path d="M4 2.5h3v11H4zM9 2.5h3v11H9z"/></svg>',
  prev: '<svg viewBox="0 0 16 16"><path d="M3 2.5h2v11H3zM13 2.5v11L6 8z"/></svg>',
  next: '<svg viewBox="0 0 16 16"><path d="M11 2.5h2v11h-2zM3 2.5v11L10 8z"/></svg>',
  undo: '<svg viewBox="0 0 16 16"><path d="M6 3 2 7l4 4V8.2c3.3 0 5.6.9 7 3.8-.5-3.8-2.7-6.4-7-6.8z"/></svg>',
  redo: '<svg viewBox="0 0 16 16"><path d="m10 3 4 4-4 4V8.2c-3.3 0-5.6.9-7 3.8.5-3.8 2.7-6.4 7-6.8z"/></svg>',
  plus: '<svg viewBox="0 0 16 16"><path d="M7 2h2v5h5v2H9v5H7V9H2V7h5z"/></svg>',
  copy: '<svg viewBox="0 0 16 16"><path d="M5 1h8v10H5zm2 2v6h4V3zM2 5h2v8h6v2H2z"/></svg>',
  del: '<svg viewBox="0 0 16 16"><path d="M5 1h6v2h4v2H1V3h4zm-2 5h10l-1 9H4z"/></svg>',
  up: '<svg viewBox="0 0 16 16"><path d="M8 3l6 7H2z"/></svg>',
  down: '<svg viewBox="0 0 16 16"><path d="M8 13l6-7H2z"/></svg>',
  eye: '<svg viewBox="0 0 16 16"><path d="M8 3C4 3 1.5 6 1 8c.5 2 3 5 7 5s6.5-3 7-5c-.5-2-3-5-7-5zm0 8a3 3 0 1 1 0-6 3 3 0 0 1 0 6z"/></svg>',
  mirror: '<svg viewBox="0 0 16 16"><path d="M7 1h2v14H7zM5 4v8L1 8zm6 0v8l4-4z"/></svg>',
  key: '<svg viewBox="0 0 16 16"><path d="M8 1l7 7-7 7-7-7z"/></svg>',
  save: '<svg viewBox="0 0 16 16"><path d="M2 2h10l2 2v10H2zm2 2v3h7V4zm1 6v3h6v-3z"/></svg>',
};

/* ================================================================ top bar */
function renderTop() {
  const dirtyFile = differs();
  $('#top').innerHTML = `
    <div class="brand"><b>TRI·REALM</b><span>Studio</span></div>
    <nav class="modes">${TYPE_ORDER.map((t) => `<button class="${ST.mode === t ? 'on' : ''}" data-act="mode" data-arg="${t}">${TYPES[t].label}<em>${items(t).length}</em></button>`).join('')}<button class="${ST.mode === 'cuts' ? 'on' : ''}" data-act="mode" data-arg="cuts" title="Move and resize the 36 manga haircuts">Manga cuts<em>${Object.keys(ST.pack.cuts || {}).length}</em></button><button class="${ST.mode === 'pack' ? 'on' : ''}" data-act="mode" data-arg="pack">Pack</button></nav>
    <div class="tb">
      <button class="ib" data-act="undo" title="Undo (Ctrl+Z)" ${HIST.i > 0 ? '' : 'disabled'}>${IC.undo}</button>
      <button class="ib" data-act="redo" title="Redo (Ctrl+Y)" ${HIST.i < HIST.list.length - 1 ? '' : 'disabled'}>${IC.redo}</button>
      <span class="state ${dirtyFile ? 'warn' : 'ok'}" title="${dirtyFile ? 'The draft (kept in this browser) differs from js/custom-pack.js. Save to project to ship it.' : 'The draft matches js/custom-pack.js.'}">${dirtyFile ? 'Unsaved changes' : 'Saved'}</span>
      <label class="chk live" title="In dev mode, the game on this computer loads this draft instead of the shipped pack. Reload the game tab to see changes."><input type="checkbox" data-act="live" ${ST.live ? 'checked' : ''}><span>Preview in game</span></label>
      <a class="b ghost" href="index.html" target="_blank" rel="noopener">Open game</a>
      <button class="b primary" data-act="save" title="Write js/custom-pack.js (Ctrl+S)">${IC.save} Save to project</button>
      <button class="ib" data-act="help" title="Help and shortcuts">?</button>
    </div>`;
}

/* ================================================================ left: item list */
let thumbN = 0;
// Register pending edits now, so thumbnails and lists show them.
function ensureReg() { if (!needReg) return; needReg = false; try { registerCustomPack(ST.pack); } catch (e) { console.error(e); } stripSoon(); }
function thumbSVG(type, it) {
  ensureReg();
  const A = wearing(), B = cosOf('build', A.build).b;
  if (type === 'anim') { A.stance = 'relaxed'; } else A[TYPES[type].slot] = it.id;
  const P = type === 'anim' ? (it.keys.length ? customPose(it.keys[Math.floor(it.keys.length / 2)].p) : POSES.relaxed) : HEAD_MODES[type] ? FRONT_POSE : POSES.relaxed;
  let vb = '6 0 188 240';
  if (HEAD_MODES[type]) { const J = solve(P, B); vb = `${rd(J.head[0] - 32)} ${rd(J.head[1] - 40)} 64 72`; }
  try { return `<svg viewBox="${vb}">${drawAvatar(A, P, 0.6, { weapon: type === 'anim' ? ST.man.weapon : '', uid: 'th' + thumbN++ })}</svg>`; } catch (e) { return ''; }
}
function renderLeft() {
  const el = $('#left');
  if (ST.mode === 'pack') { el.innerHTML = packLeft(); return; }
  if (ST.mode === 'cuts') { el.innerHTML = cutsLeft(); return; }
  const t = ST.mode, L = items(), sel = ST.sel[t] | 0;
  const tpl = TEMPLATES[t]();
  el.innerHTML = `
    <div class="lh"><h2>${TYPES[t].label}</h2>
      <div class="row">${btn(IC.plus + ' New', 'new', null, 'primary')}
      <select class="tpl" data-act="tpl"><option value="">From built-in…</option>${tpl.map(([g, opts]) => `<optgroup label="${esc(g)}">${opts.map(([k, l]) => `<option value="${esc(k)}">${esc(l)}</option>`).join('')}</optgroup>`).join('')}</select></div>
    </div>
    <ul class="list">${L.map((it, i) => {
      const bad = idProblem(t, it);
      return `<li class="${i === sel ? 'on' : ''}" data-act="pick" data-arg="${i}"><span class="th">${thumbSVG(t, it)}</span><span class="nm"><b>${esc(it.name || it.id)}</b><small>${esc(it.id)}${bad ? ' · <i class="bad">id problem</i>' : ''}</small><small class="tag">${t === 'anim' ? esc(USE_NAMES[it.use] || '') : esc(COS_RARITY[it.r] || '')}${it.w && REALMS[it.w] ? ' · ' + esc(REALMS[it.w].name) : ''}</small></span></li>`;
    }).join('') || `<li class="empty">No ${TYPES[t].one} yet. Make one with <b>New</b> or start from a built-in.</li>`}</ul>
    ${L.length ? `<div class="row lf">${btn(IC.copy, 'dup', null, 'ib', 'Duplicate')}${btn(IC.up, 'move', -1, 'ib', 'Move up')}${btn(IC.down, 'move', 1, 'ib', 'Move down')}${btn(IC.del, 'delitem', null, 'ib danger', 'Delete')}</div>` : ''}`;
}
const USE_NAMES = { stance: 'Stance (idle loop)', skill: 'Skill animation', attack: 'Attack', none: 'Library only' };

/* ================================================================ stage bar */
function renderStagebar() {
  ensureReg();
  const el = $('#stagebar');
  if (ST.mode === 'pack') { el.innerHTML = ''; return; }
  const tools = [];
  if (ST.mode === 'hair' && cur() && cur().v2) tools.push(`<button class="b ${ST.tool === 'h2draw' ? 'on' : ''}" data-act="tool" data-arg="h2draw" title="Drag on the head, from the root to the tip (D)">${IC.plus} Draw a lock</button>`, `<button class="b ${ST.tool === 'h2erase' ? 'on' : ''}" data-act="tool" data-arg="h2erase" title="Click a lock you drew to remove it (E)">Erase</button>`, `<label class="chk"><input type="checkbox" data-bind="st:sym" data-t="b" ${ST.sym ? 'checked' : ''}><span>Mirror</span></label>`);
  if (ST.mode === 'hair' && !isVec() && !(cur() && cur().v2)) tools.push(`<button class="b ${ST.tool === 'brush' ? 'on' : ''}" data-act="tool" data-arg="brush" title="Paint a lock on the head: it follows your stroke (B)">${IC.plus} Brush</button>`,
    `<button class="b ${ST.tool === 'addlock' ? 'on' : ''}" data-act="tool" data-arg="addlock" title="Click on the head and drag from root to tip (L)">${IC.plus} Arc lock</button>`,
    `<label class="chk"><input type="checkbox" data-bind="st:sym" data-t="b" ${ST.sym ? 'checked' : ''}><span>Symmetry</span></label>`);
  if (isVec()) tools.push(`<button class="b ${ST.tool === 'draw' ? 'on' : ''}" data-act="tool" data-arg="draw" title="Click to add points to the selected shape (D)">${IC.plus} Add points</button>`, GAR_MODES[ST.mode] ? '' : `<label class="chk"><input type="checkbox" data-bind="st:snap" data-t="b" ${ST.snap ? 'checked' : ''}><span>Snap ½</span></label>`);
  const poses = [['Poses', [['front', 'Front (for editing)'], ['tpose', 'T-pose (for clothes)'], ...BUILTIN_POSES.map((k) => [k, POSES_NAMES[k] || k])]], ['Custom animations', ST.pack.anim.filter((a) => POSE_DRIVE[a.id]).map((a) => [a.id, a.name])]];
  el.innerHTML = `
    <div class="row">${tools.join('')}
      ${ST.mode !== 'anim' ? `<label class="mini">Pose <select data-bind="st:previewPose" data-t="s">${poses.map(([g, o]) => `<optgroup label="${g}">${o.map(([k, l]) => `<option value="${esc(k)}" ${ST.previewPose === k ? 'selected' : ''}>${esc(l)}</option>`).join('')}</optgroup>`).join('')}</select></label>` : ''}
    </div>
    <div class="row">
      <label class="chk"><input type="checkbox" data-bind="st:handles" data-t="b" ${ST.handles ? 'checked' : ''}><span>Handles</span></label>
      ${HEAD_MODES[ST.mode] || isVec() ? `<label class="chk"><input type="checkbox" data-bind="st:guide" data-t="b" ${ST.guide ? 'checked' : ''}><span>Guide</span></label>` : ''}
      <label class="chk"><input type="checkbox" data-bind="st:animate" data-t="b" ${ST.animate ? 'checked' : ''}><span>Animate</span></label>
      <label class="mini">Background <select data-bind="st:bg" data-t="s">${Object.entries(BGS).map(([k, v]) => `<option value="${k}" ${ST.bg === k ? 'selected' : ''}>${v[0]}</option>`).join('')}</select></label>
      ${btn('Body', 'view', 'body', 'ghost', 'Fit the body (F)')}${btn('Head', 'view', 'head', 'ghost', 'Zoom on the head (H)')}${btn('Torso', 'view', 'torso', 'ghost')}
    </div>`;
}

/* ================================================================ timeline */
const TL_ROWS = [['Body', ['t1', 't2', 'ht', 'st', 'tw', 'dx', 'air']], ['Head', ['n', 'h', 'expr']], ['Front arm', ['aF', 'ff']], ['Back arm', ['aB', 'bf']], ['Front leg', ['lF', 'fF']], ['Back leg', ['lB', 'fB']], ['Weapon / prop', ['g', 'prop', 'tool', 'sh', 'fx', 'rb']]];
function renderTimeline() {
  const el = $('#timeline');
  if (ST.mode !== 'anim') { renderStrip(); return; }
  el.hidden = false;
  const a = cur();
  if (!a) { el.innerHTML = `<div class="tl-empty">Make or pick an animation to edit its keys.</div>`; return; }
  const k = curKey(), ki = keyIdxAt(a, ST.u);
  const bakes = [['Single poses', BUILTIN_POSES.map((p) => ['pose:' + p, POSES_NAMES[p] || p])]];
  const ticks = [...Array(11)].map((_, i) => `<i style="left:${i * 10}%"><b>${rd2((a.dur * i) / 10)}s</b></i>`).join('');
  const dots = TL_ROWS.map(([, f]) => a.keys.map((kk, i) => {
    const prev = a.keys[i - 1], ch = !prev || f.some((x) => JSON.stringify(kk.p[x]) !== JSON.stringify(prev.p[x]));
    return ch ? `<span class="dot ${i === ki ? 'on' : ''}" style="left:${kk.u * 100}%" data-key="${i}"></span>` : '';
  }).join(''));
  el.innerHTML = `
    <div class="tl-bar">
      <button class="ib" data-act="kprev" title="Previous key (,)">${IC.prev}</button>
      <button class="ib big" data-act="play" title="Play / pause (Space)">${ST.playing ? IC.pause : IC.play}</button>
      <button class="ib" data-act="knext" title="Next key (.)">${IC.next}</button>
      <span class="time" id="tltime"></span>
      <label class="chk"><input type="checkbox" data-bind="st:loop" data-t="b" ${ST.loop ? 'checked' : ''}><span>Loop</span></label>
      <label class="mini">Speed <select data-bind="st:speed" data-t="n">${[0.1, 0.25, 0.5, 1, 1.5, 2].map((x) => `<option value="${x}" ${ST.speed === x ? 'selected' : ''}>×${x}</option>`).join('')}</select></label>
      <label class="chk"><input type="checkbox" data-bind="st:onion" data-t="b" ${ST.onion ? 'checked' : ''}><span>Onion skin</span></label>
      <span class="sp"></span>
      ${btn(IC.key + ' Key', 'addkey', null, k ? 'ghost' : 'primary', 'Add a key at the playhead (K)')}
      ${btn(IC.del, 'delkey', null, 'ib', 'Delete the key (Del)')}
      ${btn(IC.copy, 'copypose', null, 'ib', 'Copy the pose (Ctrl+C)')}
      ${btn('Paste', 'pastepose', null, 'ghost', 'Paste the pose (Ctrl+V)')}
      ${btn(IC.mirror, 'swaplimbs', null, 'ib', 'Swap front and back limbs (M)')}
      ${btn('Close loop', 'closeloop', null, 'ghost', 'Copy the first key to the end, so the loop is seamless')}
      <select class="tpl" data-act="applypose"><option value="">Apply pose…</option>${bakes.map(([g, o]) => `<optgroup label="${g}">${o.map(([v, l]) => `<option value="${v}">${esc(l)}</option>`).join('')}</optgroup>`).join('')}</select>
    </div>
    <div class="tl-body">
      <div class="tl-names"><div class="tl-rh">Keys</div>${TL_ROWS.map(([n]) => `<div>${n}</div>`).join('')}</div>
      <div class="tl-track" id="tltrack">
        <div class="tl-ruler">${ticks}</div>
        <div class="tl-keys">${a.keys.map((kk, i) => `<span class="kf ${i === ki ? 'on' : ''} e-${kk.e}" style="left:${kk.u * 100}%" data-key="${i}" title="${rd2(kk.u * a.dur)} s · ease ${kk.e}"></span>`).join('')}</div>
        ${dots.map((d) => `<div class="tl-row">${d}</div>`).join('')}
        <div class="tl-head" id="tlhead"></div>
      </div>
    </div>`;
  updatePlayhead();
}
// Under the stage, outside animations: the piece on several poses at once, to check it moves well.
const STRIP = [['tpose', 'T-pose'], ['relaxed', 'Relaxed'], ['guard', 'Guard'], ['strike', 'Attack'], ['kick', 'Kick'], ['wood', 'Chopping'], ['fish', 'Fishing'], ['victory', 'Victory']];
let stripT = 0, stripAt = 0;
function renderStrip() {
  const el = $('#timeline');
  if (ST.mode === 'anim' || ST.mode === 'pack' || !cur()) { el.innerHTML = ''; el.hidden = true; return; }
  el.hidden = false;
  stripAt = performance.now();
  const A = wearing(), B = cosOf('build', A.build).b;
  el.innerHTML = `<div class="strip">${STRIP.map(([k, l], i) => {
    let svg = '';
    try { svg = drawAvatar(A, previewPoseStill(k, B), 0.6, { weapon: ST.man.weapon, uid: 'sp' + i }); } catch (e) { /* skip */ }
    return `<button class="pv ${ST.previewPose === k ? 'on' : ''}" data-act="pvpose" data-arg="${k}" title="Show on the stage"><svg viewBox="4 6 192 232">${svg}</svg><span>${l}</span></button>`;
  }).join('')}</div>`;
}
function previewPoseStill(k, B) { if (k === 'tpose') return TPOSE; if (POSE_DRIVE[k] && !POSES[k]) return POSE_DRIVE[k](0.3, 0, B, true); return POSES[k] || POSES.relaxed; }
function stripSoon() { if (ST.mode === 'anim') return; clearTimeout(stripT); stripT = setTimeout(renderStrip, Math.max(60, 350 - (performance.now() - stripAt))); }
function updatePlayhead() {
  const h = $('#tlhead'), tm = $('#tltime'), a = ST.mode === 'anim' && cur();
  if (!a) return;
  if (h) h.style.left = ST.u * 100 + '%';
  if (tm) tm.textContent = `${(ST.u * a.dur).toFixed(2)} s / ${(+a.dur).toFixed(2)} s`;
}
// Scrub and drag keys.
let tlDrag = null;
document.addEventListener('pointerdown', (ev) => {
  const tr = ev.target.closest('#tltrack');
  if (!tr || ST.mode !== 'anim' || !cur()) return;
  const a = cur(), kd = ev.target.closest('[data-key]'), rect = tr.getBoundingClientRect();
  const uAt = (x) => clamp((x - rect.left) / rect.width, 0, 1);
  ST.playing = false;
  if (kd) {
    const k = a.keys[+kd.dataset.key];
    ST.u = k.u;
    tlDrag = { k, rect, uAt, x0: ev.clientX, moved: 0, onKeys: !!ev.target.closest('.tl-keys') };
  } else { ST.u = rd2(uAt(ev.clientX)); snapToKey(); tlDrag = { scrub: 1, uAt }; }
  tr.setPointerCapture(ev.pointerId);
  renderTimeline(); renderRight();
});
document.addEventListener('pointermove', (ev) => {
  if (!tlDrag) return;
  if (tlDrag.scrub) { ST.u = rd2(tlDrag.uAt(ev.clientX)); snapToKey(); return; }
  if (!tlDrag.onKeys || Math.abs(ev.clientX - tlDrag.x0) < 3) return;
  tlDrag.moved = 1;
  const u = rd2(tlDrag.uAt(ev.clientX)), a = cur();
  if (a.keys.some((x) => x !== tlDrag.k && Math.abs(x.u - u) < 0.005)) return;
  tlDrag.k.u = u; ST.u = u;
  $$('.tl-keys .kf').forEach((s) => { if (a.keys[+s.dataset.key] === tlDrag.k) s.style.left = u * 100 + '%'; });
});
document.addEventListener('pointerup', () => {
  if (!tlDrag) return;
  const d = tlDrag;
  tlDrag = null;
  if (d.moved) { sortKeys(cur()); commit(); }
  renderTimeline(); renderRight();
});
function snapToKey() {
  const a = cur(), k = a && a.keys.find((x) => Math.abs(x.u - ST.u) < 0.012);
  if (k) ST.u = k.u;
  renderRightSoon();
}
let rrT = 0;
function renderRightSoon() { clearTimeout(rrT); rrT = setTimeout(() => { renderRight(); const k = $$('.tl-keys .kf'); const a = cur(); if (a) k.forEach((s) => s.classList.toggle('on', Math.abs(a.keys[+s.dataset.key].u - ST.u) < 0.0005)); }, 60); }

/* ================================================================ right: inspector */
const WORLD_OPTS = () => [['', 'None (basic)'], ...Object.keys(REALMS).map((k) => [k, REALMS[k].name])];
function metaSec(t, it, noName) {
  const bad = idProblem(t, it), u = it.unlock || {};
  const skillOpts = Object.keys(SKILLS).map((k) => [k, SKILLS[k].name]);
  const zoneOpts = ZONES.map((z) => [z.id, z.name + (z.boss ? ' (boss)' : '')]);
  let un = fSel('Earned by', 'item:unlock.type', [['free', 'Free from the start'], ['level', 'Reaching a skill level'], ['kills', 'Defeating foes in a zone'], ['boss', 'Defeating a boss'], ['locked', 'Not obtainable yet (dev only)']], 1);
  if (u.type === 'level') un += fSel('Skill', 'item:unlock.skill', skillOpts) + fNum('Level', 'item:unlock.n', 1, 120, 1);
  if (u.type === 'kills') un += fSel('Zone', 'item:unlock.zone', zoneOpts) + fNum('Foes', 'item:unlock.n', 1, 1000, 1);
  if (u.type === 'boss') un += fSel('Boss zone', 'item:unlock.zone', ZONES.filter((z) => z.boss).map((z) => [z.id, z.name])) + fTxt('Boss name', 'item:unlock.who', 'shown in the hint');
  if (u.type === 'locked') un += fTxt('Hint', 'item:unlock.hint', 'Not available yet');
  return (noName ? '' : fTxt('Name', 'item:name') + fTxt('Id', 'item:id') + (bad ? note(bad, 'bad') : note('Saved in player saves: keep it once shipped.')))
    + fSel('World', 'item:w', WORLD_OPTS()) + fSel('Rarity', 'item:r', COS_RARITY.slice(1).map((r, i) => [i + 1, `${i + 1}★ ${r}`]), 0, 'n') + un;
}
function renderRight() {
  const el = $('#right');
  if (ST.mode === 'pack') { el.innerHTML = packRight(); return; }
  if (ST.mode === 'cuts') { const scroll = el.scrollTop; el.innerHTML = cutsRight() + mannequinSec(); el.scrollTop = scroll; return; }
  const it = cur(), t = ST.mode;
  if (!it) { el.innerHTML = `<div class="sec"><div class="sb">${note(`Nothing selected. Make a ${TYPES[t].one} on the left.`)}</div></div>` + mannequinSec(); return; }
  const scroll = el.scrollTop;
  el.innerHTML = (INSPECT[t] ? INSPECT[t](it) : '') + mannequinSec();
  el.scrollTop = scroll;
}
function mannequinSec() {
  ensureReg();
  const s = COS_SLOTS.filter(([k]) => k !== 'stance' && k !== (ST.mode === 'cuts' ? 'hair' : TYPES[ST.mode === 'pack' ? 'anim' : ST.mode].slot)).map(([k, l]) => fSel(l, 'man:' + k, COSMETICS[k].map((c) => [c.id, c.name + (c.custom ? ' ✦' : '')])));
  const weapons = [['', 'Bare hands'], ['katana', 'Katana'], ['kunai', 'Kunai'], ['cutlass', 'Cutlass'], ['cleaver', 'Cleaver'], ['hammer', 'Hammer'], ['sickle', 'Sickle'], ['lance', 'Lance'], ['bow', 'Bow'], ['cannon', 'Cannon'], ['gauntlet', 'Gauntlets'], ['claw', 'Claws']];
  return sec('man', 'Mannequin', note('What the figure wears around the piece you edit (✦ = custom).') + s.join('') + fSel('Weapon', 'man:weapon', weapons), '');
}
const INSPECT = {};

// ---- animations
const POSE_UI = [
  ['Body', [['t1', 'Lean', 130, 230, 1], ['t2', 'Chest bend', -50, 50, 1], ['ht', 'Hip tilt', -25, 25, 1], ['st', 'Shoulder tilt', -25, 25, 1], ['tw', 'Turn to the foe', 0, 1, 0.05], ['dx', 'Shift', -50, 50, 0.5], ['air', 'Float', 0, 80, 1]]],
  ['Head', [['n', 'Neck', -50, 50, 1], ['h', 'Head tilt', -45, 45, 1]]],
  ['Front arm', [['aF.0', 'Shoulder', -200, 280, 1], ['aF.1', 'Elbow', -170, 170, 1]]],
  ['Back arm', [['aB.0', 'Shoulder', -280, 200, 1], ['aB.1', 'Elbow', -170, 170, 1]]],
  ['Front leg', [['lF.0', 'Hip', -120, 180, 1], ['lF.1', 'Knee', -170, 170, 1], ['fF', 'Foot', -90, 100, 1]]],
  ['Back leg', [['lB.0', 'Hip', -180, 120, 1], ['lB.1', 'Knee', -170, 170, 1], ['fB', 'Foot', -280, -100, 1]]],
];
const EASES = [['io', 'Ease in-out'], ['out', 'Ease out (fast start)'], ['in', 'Ease in (slow start)'], ['back', 'Overshoot'], ['lin', 'Linear']];
INSPECT.anim = (a) => {
  let s = sec('anim', 'Animation', fTxt('Name', 'item:name') + fTxt('Id', 'item:id') + (idProblem('anim', a) ? note(idProblem('anim', a), 'bad') : '')
    + fSel('Used as', 'item:use', Object.entries(USE_NAMES), 1)
    + (a.use === 'skill' ? fSel('Skill', 'item:skill', Object.keys(SKILLS).map((k) => [k, `${SKILLS[k].name} (${REALMS[SKILLS[k].realm] ? REALMS[SKILLS[k].realm].name : SKILLS[k].realm})`])) + note('Plays while this skill runs; one cycle per action when the action is long enough.') : '')
    + (a.use === 'attack' ? note('Joins the attack rotation in battle (every third hit). Ends back in guard.') : '')
    + (a.use === 'stance' ? note('A cosmetic in Avatar → Stance, looping when idle.') : '')
    + fNum('Duration (s)', 'item:dur', 0.2, 10, 0.05) + fChk('Breathing on top', 'item:breathe'));
  if (a.use === 'stance') s += sec('meta', 'Cosmetic', metaSec('anim', a, 1));
  const k = curKey();
  if (!k) return s + sec('key', 'Key', note(`No key at ${(ST.u * a.dur).toFixed(2)} s. Drag a joint on the stage to add one here (auto-key), or press <b>K</b>.`) + btn(IC.key + ' Add key here', 'addkey', null, 'primary'));
  let kb = F('Time (s)', `<input class="n wide" type="number" min="0" max="${a.dur}" step="0.01" value="${rd2(k.u * a.dur)}" data-ktime="1">`) + fSel('Ease into this key', 'keyt:e', EASES);
  kb += note('Drag the joints on the stage: squares use IK (hold Alt to flip the bend), circles rotate one bone, small dots turn the feet and head. Shift-drag the hips to float.');
  s += sec('key', `Key ${keyIdxAt(a, ST.u) + 1} / ${a.keys.length}`, kb, `${rd2(k.u * a.dur)} s`);
  for (const [g, fields] of POSE_UI) s += sec('pg-' + g, g, fields.map(([f, l, mi, ma, st]) => fNum(l, 'key:' + f, mi, ma, st)).join('')
    + (g === 'Head' ? fSel('Expression', 'key:expr', [['', 'Normal'], ['happy', 'Happy'], ['hurt', 'Hurt']]) : '')
    + (g === 'Front arm' ? fChk('Crosses in front of the body', 'key:ff') : '') + (g === 'Back arm' ? fChk('Crosses in front of the chest', 'key:bf') : ''));
  s += sec('pg-prop', 'Weapon and props', fNum('Weapon angle', 'key:g', -200, 200, 1) + fChk('Weapon put away', 'key:sh')
    + fSel('Prop in hand', 'key:prop', [['', 'None'], ['rod', 'Fishing rod'], ['axe', 'Axe'], ['pan', 'Frying pan']], 1)
    + (getB('key:prop') === 'rod' ? fNum('Rod bend', 'key:rb', -0.5, 1, 0.01) + fNum('Reel crank', 'key:cr', 0, 360, 1) + fChk('Catch hanging', 'key:hang') : '')
    + fSel('Tool in the other hand', 'key:tool', [['', 'None'], ['spatula', 'Spatula']])
    + fSel('Effect', 'key:fx', [['', 'None'], ['slash', 'Slash trail'], ['thrust', 'Thrust lines'], ['kick', 'Kick impact'], ['hit', 'Hit recoil']]));
  return s;
};

// ---- hair
INSPECT.hair = (h) => {
  let s = sec('meta', 'Haircut', metaSec('hair', h));
  s += sec('hcol', 'Colours', fCol('Base', 'item:c') + fCol('Shadow', 'item:sh') + fCol('Highlight', 'item:hi'));
  s += sec('cap', 'Cap (the hair on the skull)', fNum('Volume', 'item:cap.0', 17, 25, 0.1) + fNum('Hairline', 'item:cap.1', -16, 0, 0.1) + fNum('Temples', 'item:cap.2', -6, 14, 0.1)
    + fNum('Back volume', 'item:back', 0, 5, 0.1) + fNum('Parting', 'item:part', 0, 5, 0.1)
    + row(fChk('Combed (smooth)', 'item:smooth'), fChk('Buzz cut', 'item:buzz'), fChk('Shaved sides (mohawk)', 'item:stubble'))
    + fOptGroup('Hair tie', 'item:tie', [-138, 23]) + (h.tie ? fNum('Tie angle', 'item:tie.0', -180, 0, 1) + fNum('Tie distance', 'item:tie.1', 10, 30, 0.5) : '')
    + fOptGroup('Bun', 'item:bun', [-118, 22, 8.5]) + (h.bun ? fNum('Bun angle', 'item:bun.0', -180, 0, 1) + fNum('Bun distance', 'item:bun.1', 10, 30, 0.5) + fNum('Bun size', 'item:bun.2', 3, 14, 0.5) : '')
    + `<div class="subh">Comb lines ${btn(IC.plus, 'comb-add', null, 'ib', 'Add a comb line')}</div>`
    + (h.combs || []).map((c, i) => row(fNum('From', `item:combs.${i}.0`, -200, 0, 1), fNum('To', `item:combs.${i}.1`, -200, 0, 1), fNum('Radius', `item:combs.${i}.2`, 4, 20, 0.5), btn(IC.del, 'comb-del', i, 'ib'))).join(''));
  const seg2 = `<nav class="seg">${[['locks', 'Locks'], ['mass', 'Masses']].map(([k, l]) => `<button class="${ST.hairEdit === k ? 'on' : ''}" data-act="hairedit" data-arg="${k}">${l}</button>`).join('')}</nav>`;
  if (ST.hairEdit === 'mass') {
    s += sec('draw', 'Draw', seg2 + note('Masses are free shapes of hair (bangs, a curtain of long hair, volume) merged into the same silhouette, with the same colours and shading. Pick one, then <b>Add points</b> on the stage.'));
    return s + massesSec(h);
  }
  s += sec('draw', 'Draw', seg2
    + note('<b>Brush</b>: paint a lock on the head, it follows your stroke. <b>Arc lock</b>: click-drag from root to tip.')
    + fNum('Brush width', 'st:brush.w', 2, 18, 0.5) + fNum('Brush taper', 'st:brush.tp', 0.2, 2, 0.05)
    + row(fChk('Behind the body', 'st:brush.back'), fChk('Hangs', 'st:brush.hang'), fChk('Crown', 'st:brush.k'))
    + fChk('Symmetry: mirror every new lock', 'st:sym'));
  const L = curLock();
  s += sec('locks', 'Locks', `<div class="chips">${h.locks.map((x, i) => `<button class="chip ${i === ST.lock ? 'on' : ''} ${x.back ? 'bk' : ''} ${x.k ? 'cr' : ''} ${x.path ? 'pa' : ''}" data-act="lock" data-arg="${i}">${i + 1}</button>`).join('')}</div>`
    + row(btn(IC.plus + ' Lock', 'lock-add', null, 'ghost'), btn(IC.copy, 'lock-dup', null, 'ib', 'Duplicate'), btn(IC.mirror, 'lock-mirror', null, 'ib', 'Mirrored copy'), btn(IC.del, 'lock-del', null, 'ib danger', 'Delete'))
    + note('Stage: square = root (moves the lock), circle = tip, diamond = curl; brushed locks show every point of their spine.'), `${h.locks.length}`);
  if (L && L.path) {
    s += sec('lock', `Lock ${ST.lock + 1} (brushed)`, fNum('Root x', 'lock:x', -24, 24, 0.1) + fNum('Root y', 'lock:y', -26, 20, 0.1)
      + fNum('Width', 'lock:w', 1, 20, 0.1) + fNum('Taper', 'lock:tp', 0.2, 2, 0.05)
      + row(fChk('Crown (flattened by hats)', 'lock:k'), fChk('Behind the body', 'lock:back'), fChk('Hangs with gravity', 'lock:hang'))
      + fNum('Sway', 'lock:sw', 0, 20, 0.5) + fNum('Sway phase', 'lock:ph', 0, 6.3, 0.1)
      + row(btn('Smooth', 'lock-smooth', null, 'ghost', 'Even out the spine'), btn('Longer', 'lock-scale', 1.15, 'ghost'), btn('Shorter', 'lock-scale', 0.87, 'ghost')));
  } else if (L) {
    s += sec('lock', `Lock ${ST.lock + 1}`, fNum('Root x', 'lock:x', -24, 24, 0.1) + fNum('Root y', 'lock:y', -26, 20, 0.1) + fNum('Direction', 'lock:a', -270, 270, 1) + fNum('Length', 'lock:len', 1, 70, 0.1)
      + fNum('Width', 'lock:w', 1, 20, 0.1) + fNum('Curl', 'lock:bend', -200, 200, 1) + fNum('Taper', 'lock:tp', 0.2, 2, 0.05)
      + row(fChk('Crown (flattened by hats)', 'lock:k'), fChk('Behind the body', 'lock:back'), fChk('Hangs with gravity', 'lock:hang'))
      + fNum('Sway', 'lock:sw', 0, 20, 0.5) + fNum('Sway phase', 'lock:ph', 0, 6.3, 0.1)
      + btn('Convert to brushed lock', 'lock-topath', null, 'ghost', 'Edit every point of its spine'));
  }
  s += sec('ring', 'Crown ring generator', note('Adds a fan of locks around the skull, like the built-in cuts.')
    + fNum('From angle', 'st:ring.a0', -220, 40, 1) + fNum('To angle', 'st:ring.a1', -220, 40, 1) + fNum('Count', 'st:ring.n', 2, 20, 1) + fNum('Length', 'st:ring.len', 3, 40, 0.5) + fNum('Peak extra', 'st:ring.peak', 0, 30, 0.5)
    + fNum('Width', 'st:ring.w', 3, 16, 0.5) + fNum('Fan out', 'st:ring.fan', -0.5, 1.5, 0.05) + fNum('Lean', 'st:ring.lean', -40, 40, 1) + fNum('Curl', 'st:ring.bend', -60, 60, 1) + fNum('Jitter', 'st:ring.jit', 0, 40, 1)
    + btn(IC.plus + ' Add ring', 'ring-add', null, 'primary'));
  return s;
};
// Hair masses (head space, same frame as the locks).
const MASS_PRESETS = {
  bangs: ['Bangs', { pts: [[-17.5, -6], [-12, -15], [0, -18.5], [12, -16], [18.5, -7], [16, -1, 1], [12.5, -5], [9.5, 1, 1], [6, -5], [2.5, 2, 1], [-1, -5], [-4.5, 1, 1], [-8, -5], [-12, 0, 1], [-14.5, -4]] }],
  curtain: ['Side lock framing the face', { pts: [[13, -12], [19, -4], [21, 12], [18, 27, 1], [14, 14], [12, 0]] }],
  longback: ['Long hair down the back', { back: true, pts: [[-19, -10], [-23, 8], [-25, 36], [-18, 50, 1], [-6, 44], [6, 48, 1], [12, 30], [14, 6], [10, -12]] }],
  volume: ['Volume on top', { pts: [[-20, -6], [-18, -20], [-4, -29], [12, -26], [21, -12], [2, -15]] }],
  spike: ['One big spike', { pts: [[-7, -16], [-3, -38, 1], [7, -17]] }],
  pony: ['Ponytail (behind)', { back: true, pts: [[-16, -16], [-26, -10], [-34, 8], [-30, 30, 1], [-24, 12], [-18, -4]] }],
  blank: ['Blank (draw it)', { pts: [] }],
};
function massesSec(h) {
  const L = h.masses || (h.masses = []), m = curLayer();
  let b = `<div class="layers">${L.map((x, i) => `<div class="ly ${i === ST.layer ? 'on' : ''}" data-act="layer" data-arg="${i}"><button class="ib sm ${x.hidden ? 'off' : ''}" data-act="ly-vis" data-arg="${i}" title="Show / hide">${IC.eye}</button><span class="sw" style="background:${h.c}"></span><b>${esc(x.name || 'Mass')}</b><small>${x.back ? 'behind' : 'front'} · ${x.pts.length} pts</small></div>`).join('') || note('No mass yet.')}</div>`
    + row(`<select class="tpl" data-act="mass-add"><option value="">+ Mass…</option>${Object.entries(MASS_PRESETS).map(([k, v]) => `<option value="${k}">${v[0]}</option>`).join('')}</select>`)
    + (L.length ? row(btn(IC.copy, 'ly-dup', null, 'ib', 'Duplicate'), btn(IC.mirror, 'ly-mirror', null, 'ib', 'Mirror left / right'), btn(IC.del, 'ly-del', null, 'ib danger', 'Delete')) : '');
  let out = sec('masses', 'Hair masses', b, `${L.length}`);
  if (m) out += sec('mass', 'Mass', fTxt('Name', 'layer:name') + row(fChk('Behind the body', 'layer:back'), fChk('Smooth curve', 'layer:smooth'), fChk('Hidden under covering hats', 'layer:crown'))
    + note('Add points: click after the selected point. Drag the small dots to insert. Shift-click: sharp tip. Alt-click or double-click: delete.')
    + (ST.point >= 0 && m.pts[ST.point] ? row(fNum('x', `layer:pts.${ST.point}.0`, -40, 40, 0.5), fNum('y', `layer:pts.${ST.point}.1`, -45, 60, 0.5)) : ''));
  return out;
}
// ---- the simple haircut creator (v2): style, parts as tiles, 3 sliders, colour
const H2_DYES = [['#24252f', 'Black'], ['#4a3226', 'Dark brown'], ['#8a5a34', 'Chestnut'], ['#e8c25a', 'Blond'], ['#f3e3a6', 'Platinum'], ['#ff8a3d', 'Orange'], ['#d8343f', 'Red'], ['#f28fae', 'Pink'], ['#7a5cff', 'Violet'], ['#2f5fd0', 'Blue'], ['#2c2f5a', 'Indigo'], ['#3aa86a', 'Green'], ['#1f3a2a', 'Dark green'], ['#dfe3ec', 'Silver'], ['#f8f8f8', 'White']];
const h2Pick = (st) => ({ fringe: st.fringe, side: st.side, back: st.back, extra: st.extra, vol: st.vol, len: st.len, spike: st.spike });
let h2TileN = 0;
function h2Tile(kind, key, name, def, on) {
  return `<button class="h2t ${on ? 'on' : ''}" data-act="h2pick" data-arg="${kind}:${key}" title="${esc(name)}"><svg viewBox="-38 -50 76 88">${hair2Portrait(def, 't' + h2TileN++)}</svg><span>${esc(name)}</span></button>`;
}
function hair2Inspector(h) {
  const d = h.v2;
  const isStyle = (st) => ['fringe', 'side', 'back', 'extra'].every((p) => d[p] === st[p]);
  let s = sec('h2name', 'Haircut', fTxt('Name', 'item:name') + note('Pick a style, swap any part, set the shape and the colour. That\'s it.'));
  s += sec('h2style', '1 · Style', `<div class="h2g">${Object.entries(H2_STYLES).map(([k, st]) => h2Tile('style', k, st.name, Object.assign({}, d, h2Pick(st)), isStyle(st))).join('')}</div>`);
  const segs = (key, opts) => `<nav class="seg">${opts.map(([v, l]) => `<button class="${String(ST.h2d[key]) === String(v) ? 'on' : ''}" data-act="h2set" data-arg="${key}:${v}">${l}</button>`).join('')}</nav>`;
  const n = (d.strokes || []).length;
  s += sec('h2draw', '2 · Draw your own locks', note('Start from a style, or from <b>Blank</b> to make a cut from zero. Then drag on the head from where the hair grows to its tip: each stroke becomes a lock that blends into the rest.')
    + row(btn(`${IC.plus} Draw`, 'tool', 'h2draw', ST.tool === 'h2draw' ? 'on' : 'primary'), btn('Erase', 'tool', 'h2erase', ST.tool === 'h2erase' ? 'on' : 'ghost'), fChk('Mirror', 'st:sym'))
    + segs('l', [['main', 'In front'], ['nape', 'Behind the head'], ['back', 'Behind the body']])
    + segs('w', [[4, 'Fine'], [7, 'Medium'], [10.5, 'Thick']])
    + segs('tip', [['point', 'Pointed'], ['round', 'Round'], ['blunt', 'Cut']])
    + (n ? row(btn('Undo last lock', 'h2undo', null, 'ghost'), btn(`Remove all (${n})`, 'h2clear', null, 'ghost danger')) : ''), n ? `${n}` : '');
  for (const [part, label, lib] of [['fringe', '3 · Fringe', H2_FRINGES], ['side', '4 · Sides', H2_SIDES], ['back', '5 · Back', H2_BACKS], ['extra', '6 · Extra', H2_EXTRAS]]) {
    s += sec('h2' + part, label, `<div class="h2g">${Object.entries(lib).map(([k, v]) => h2Tile(part, k, v.name, Object.assign({}, d, { [part]: k }), d[part] === k)).join('')}</div>`);
  }
  s += sec('h2tune', '7 · Shape', fNum('Volume', 'item:v2.vol', 0, 1, 0.05, 1) + fNum('Length', 'item:v2.len', 0, 1, 0.05, 1) + fNum('Spiky', 'item:v2.spike', 0, 1, 0.05, 1)
    + row(btn('Another variation', 'h2var', 1, 'primary', 'Same choices, a different irregularity'), btn('Back', 'h2var', -1, 'ghost')));
  s += sec('h2col', '8 · Colour', `<div class="dyes">${H2_DYES.map(([c, n]) => `<button class="dye ${d.c === c ? 'on' : ''}" style="background:${c}" data-act="h2col" data-arg="${c}" title="${n}"></button>`).join('')}</div>`
    + fCol('Own colour', 'item:v2.c') + fOptCol('Coloured tips', 'item:v2.tip', '#ff6a3d'));
  s += sec('meta', 'In the game', metaSec('hair', h, 1));
  return s;
}
ST.ring = { a0: -184, a1: -14, n: 10, len: 9, peak: 4, w: 10, fan: 0.3, lean: 0, bend: 14, jit: 14 };
const INSPECT_HAIR_V1 = INSPECT.hair;
INSPECT.hair = (h) => (h.v2 ? hair2Inspector(h) : INSPECT_HAIR_V1(h));

// ---- clothes
const PARTS = [['torso', 'Torso and hips'], ['arms', 'Both arms'], ['armF', 'Front arm'], ['armB', 'Back arm'], ['legs', 'Both legs'], ['legF', 'Front leg'], ['legB', 'Back leg']];
const ell = (c0, c1, r0, r1) => [...Array(10)].map((_, i) => [rd2(c0 + Math.cos((i / 10) * Math.PI * 2) * r0), rd2(c1 + Math.sin((i / 10) * Math.PI * 2) * r1)]);
// Ready-made pieces, in the space of their body part (torso: u across, v up; limbs: t along, s across).
const PIECE_PRESETS = {
  torso: [
    ['chest', 'Chest plate', { fill: '#9aa3b5', pts: [[-0.75, 0.98], [0.8, 0.98], [0.9, 0.6], [0.5, 0.36, 1], [-0.45, 0.36, 1], [-0.85, 0.6]] }],
    ['tabard', 'Tabard (over the belt)', { fill: '#c0392b', z: 'top', pts: [[-0.42, 0.95, 1], [0.52, 0.95, 1], [0.48, -0.75, 1], [-0.38, -0.75, 1]] }],
    ['skirt', 'Skirt', { pts: [[-1.06, 0.14, 1], [1.06, 0.14, 1], [1.5, -1.0], [0.5, -1.1], [-0.5, -1.1], [-1.5, -1.0]] }],
    ['coat', 'Long coat flaps', { pts: [[-1.05, 0.2, 1], [1.05, 0.2, 1], [1.25, -1.7, 1], [0.1, -1.6, 1], [0.02, -0.2, 1], [-0.1, -1.6, 1], [-1.3, -1.7, 1]] }],
    ['panel', 'Front panel', { fill: '#e9e4d2', pts: [[0.15, 1.02, 1], [1.05, 0.95, 1], [1.05, -0.05, 1], [0.15, -0.05, 1]] }],
    ['band', 'Chest band', { fill: '#22252e', pts: [[-1.05, 0.62, 1], [1.05, 0.62, 1], [1.05, 0.5, 1], [-1.05, 0.5, 1]] }],
    ['strap', 'Diagonal strap', { fill: '#5a3d26', z: 'top', pts: [[-0.95, 0.95, 1], [-0.72, 1.0, 1], [1.02, 0.14, 1], [0.8, 0.06, 1]] }],
    ['collar', 'Fur collar', { fill: '#f1ead8', pts: [[-1.1, 0.92], [-0.5, 1.1], [0.5, 1.1], [1.1, 0.92], [0.8, 0.8], [0, 0.88], [-0.8, 0.8]] }],
    ['emblem', 'Emblem', { fill: '#f4c66a', pts: ell(0.5, 0.72, 0.2, 0.09) }],
    ['seam', 'Seam line', { closed: false, stroke: '#0a0c11', sw: 1, shade: false, pts: [[0.05, 1.0], [0.08, 0.5], [0.05, 0.0]] }],
  ],
  arms: [
    ['pauldron', 'Pauldrons', { fill: '#9aa3b5', pts: [[-0.14, -1.45], [-0.12, 1.45], [0.16, 1.55], [0.26, 0], [0.16, -1.55]] }],
    ['bracer', 'Bracers', { fill: '#5a3d26', pts: [[0.66, -1.15, 1], [0.66, 1.15, 1], [0.93, 1.1, 1], [0.93, -1.1, 1]] }],
    ['stripe', 'Sleeve stripe', { fill: '#ffffff', pts: [[0.08, -1.08, 1], [0.08, 1.08, 1], [0.15, 1.08, 1], [0.15, -1.08, 1]] }],
    ['armband', 'Arm band', { fill: '#e8443a', pts: [[0.3, -1.05, 1], [0.3, 1.05, 1], [0.37, 1.05, 1], [0.37, -1.05, 1]] }],
    ['elbow', 'Elbow pads', { fill: '#9aa3b5', pts: ell(0.5, 0, 0.08, 1.1) }],
    ['puff', 'Puffed sleeves', { pts: [[-0.12, -1.35], [-0.12, 1.35], [0.22, 1.6], [0.36, 0], [0.22, -1.6]] }],
  ],
  legs: [
    ['knee', 'Knee guards', { fill: '#9aa3b5', pts: ell(0.5, 0, 0.09, 1.05) }],
    ['shin', 'Shin guards', { fill: '#9aa3b5', pts: [[0.56, -0.2, 1], [0.56, 1.1], [0.75, 1.15], [0.95, 1.0, 1], [0.95, -0.2, 1]] }],
    ['wraps', 'Leg wraps', { fill: '#ecebe6', pat: 'stripes', pc: '#b9b6ad', pts: [[0.72, -1.02, 1], [0.72, 1.02, 1], [0.95, 1.0, 1], [0.95, -1.0, 1]] }],
    ['side', 'Side stripe', { fill: '#ffffff', pts: [[0, 0.72, 1], [0, 0.95, 1], [0.97, 0.95, 1], [0.97, 0.72, 1]] }],
    ['pouch', 'Thigh pouch', { fill: '#5a3d26', pts: [[0.15, 0.5, 1], [0.15, 1.3, 1], [0.32, 1.3, 1], [0.32, 0.5, 1]] }],
    ['cuffs', 'Wide cuffs', { pts: [[0.82, -1.3, 1], [0.82, 1.3, 1], [1.0, 1.6, 1], [1.0, -1.6, 1]] }],
  ],
};
const DEF_PIECE = (part) => ({ kind: 'shape', name: 'Piece', part, z: 'base', pts: [], closed: true, smooth: true, fill: 'main', stroke: 'main', sw: 1.6, shade: true, pat: 'none', pc: '#ffffff', ps: 1, op: 1 });
function pieceFrom(v) {
  const [g, k] = v.split(':');
  if (k === 'blank') return Object.assign(DEF_PIECE(g), { name: 'New piece' });
  const pr = PIECE_PRESETS[g].find((x) => x[0] === k);
  return Object.assign(DEF_PIECE(g), { name: pr[1] }, clone(pr[2]));
}
const fChkOn = (label, b, rr) => `<label class="chk"><input type="checkbox" data-bind="${b}" data-t="b" ${getB(b) !== false ? 'checked' : ''}${rr ? ' data-rr="1"' : ''}><span>${label}</span></label>`;
function piecesSec(it) {
  const L = it.pieces || (it.pieces = []), pc = curLayer();
  const presets = `<select class="tpl" data-act="pc-add"><option value="">+ Piece…</option>${Object.entries(PIECE_PRESETS).map(([g, list]) => `<optgroup label="${{ torso: 'Torso and hips', arms: 'Arms', legs: 'Legs' }[g]}">${list.map(([k, l]) => `<option value="${g}:${k}">${l}</option>`).join('')}<option value="${g}:blank">Blank shape (draw it)</option></optgroup>`).join('')}</select>`;
  let b = `<div class="layers">${L.map((x, i) => `<div class="ly ${i === ST.layer ? 'on' : ''}" data-act="layer" data-arg="${i}"><button class="ib sm ${x.hidden ? 'off' : ''}" data-act="ly-vis" data-arg="${i}" title="Show / hide">${IC.eye}</button><span class="sw" style="background:${!x.fill || x.fill === 'main' ? (it.top || it.bot || {}).c : x.fill === 'skin' ? '#eef1f6' : x.fill}"></span><b>${esc(x.name || 'Piece')}</b><small>${esc((PARTS.find((q) => q[0] === x.part) || ['', ''])[1])}</small></div>`).join('') || note('No piece yet: add one from the list, or a blank shape to draw.')}</div>`
    + row(presets) + (L.length ? row(btn(IC.up, 'ly-move', 1, 'ib', 'Bring forward'), btn(IC.down, 'ly-move', -1, 'ib', 'Send backward'), btn(IC.copy, 'ly-dup', null, 'ib', 'Duplicate'), btn(IC.mirror, 'ly-mirror', null, 'ib', 'Mirror across the part'), btn(IC.del, 'ly-del', null, 'ib danger', 'Delete')) : '');
  let out = sec('pieces', 'Drawn pieces', note('Shapes drawn straight on the body. Each one sits on a body part and bends, turns and swings with it in every animation. The dashed outline shows its part.') + b, `${L.length}`);
  if (!pc) return out;
  const fillMode = !pc.fill || pc.fill === 'main' ? 'main' : pc.fill === 'skin' ? 'skin' : 'custom';
  let q = fTxt('Name', 'layer:name') + fSel('Body part', 'layer:part', PARTS, 1)
    + (pc.part === 'torso' ? fSel('Layer', 'layer:z', [['base', 'On the top, under the belt'], ['top', 'Over the belt and sash']]) : '')
    + row(fChk('Closed', 'layer:closed', 1), fChkOn('Smooth curve', 'layer:smooth'), pc.closed ? fChkOn('Cel shading', 'layer:shade') : '');
  q += F(pc.closed ? 'Fill' : 'Colour', `<select data-act="pfill"><option value="main" ${fillMode === 'main' ? 'selected' : ''}>Garment colour</option><option value="skin" ${fillMode === 'skin' ? 'selected' : ''}>Skin</option><option value="custom" ${fillMode === 'custom' ? 'selected' : ''}>Own colour</option></select>`);
  if (fillMode === 'custom') q += fCol('Own colour', 'layer:fill');
  if (!pc.closed) q += fNum('Line width', 'layer:sw', 0.4, 8, 0.1);
  if (pc.closed) {
    q += fSel('Print', 'layer:pat', [['none', 'None'], ['stripes', 'Stripes'], ['checks', 'Checks'], ['dots', 'Dots'], ['edge', 'Edge trim']], 1);
    if (pc.pat && pc.pat !== 'none') q += fCol('Print colour', 'layer:pc') + fNum('Print scale', 'layer:ps', 0.3, 3, 0.05);
  }
  q += fNum('Opacity', 'layer:op', 0, 1, 0.05);
  q += note('Stage: <b>Add points</b> then click on the part. Drag the small dots to insert a point. Shift-click: sharp corner. Alt-click or double-click: delete.');
  if (ST.point >= 0 && pc.pts[ST.point]) q += row(fNum(pc.part === 'torso' ? 'u' : 't', `layer:pts.${ST.point}.0`, -2, 2, 0.01), fNum(pc.part === 'torso' ? 'v' : 's', `layer:pts.${ST.point}.1`, -2, 2, 0.01));
  return out + sec('piece', 'Piece', q);
}
INSPECT.top = (it) => {
  const T0 = it.top;
  let s = sec('meta', 'Top', metaSec('top', it));
  s += piecesSec(it);
  s += sec('base', 'Base garment', fChkOn('Base shirt or jacket (switch off to dress only with drawn pieces)', 'item:base', 1));
  if (it.base !== false) {
    s += sec('body', 'Body', fCol('Colour', 'item:top.c') + fNum('Fit (looser)', 'item:top.fit', 0, 6, 0.1) + fNum('Hem', 'item:top.hem', -0.4, 0.4, 0.01) + fNum('Coat tails', 'item:top.tails', 0, 120, 1)
      + fSel('Open front', 'item:top.open', [['', 'Closed'], ['skin', 'Open on the chest']]) + fOptCol('Inner V', 'item:top.v', '#f2f0ea') + fChk('Crossed lapels (kimono)', 'item:top.kimono')
      + fOptCol('Zip', 'item:top.zip', '#e9e9ee') + fOptCol('Buttons', 'item:top.buttons', '#f4c66a') + fOptCol('Trim', 'item:top.trim', '#f4c66a') + fOptCol('Emblem', 'item:top.emblem', '#f6f2e8'));
    s += sec('sleeve', 'Sleeves', fNum('Length (0 none)', 'item:top.sl', 0, 0.95, 0.01) + fOptCol('Own colour', 'item:top.slc', '#2b4fb8') + fNum('Flare', 'item:top.wide', 0, 12, 0.5) + fOptCol('Cuffs', 'item:top.cuff', '#22252e'));
    s += sec('collar', 'Collar and shoulders', fSel('Collar', 'item:top.collar', [['', 'None'], ['high', 'High collar']], 1)
      + (T0.collar === 'high' ? fOptCol('Collar colour', 'item:top.cc', T0.c) + fNum('Collar height', 'item:top.ch', 1, 9, 0.5) + fOptCol('Chain', 'item:top.chain', '#f4c66a') : '')
      + fOptGroup('Shoulder band', 'item:top.band', [0.64, '#22252e']) + (T0.band ? fNum('Band start', 'item:top.band.0', 0.2, 0.95, 0.01) + fCol('Band colour', 'item:top.band.1') : ''));
  } else s += sec('body', 'Colour', fCol('Garment colour (pieces)', 'item:top.c'));
  s += sec('hands', 'Hands and waist', fOptCol('Gloves', 'item:glove', '#2b2f3a') + fOptCol('Wrist bands', 'item:wrist', '#2b4fb8')
    + fOptGroup('Sash at the waist', 'item:sash', ['#f4c430', -0.55]) + (it.sash ? fCol('Sash colour', 'item:sash.0') + fNum('Knot position', 'item:sash.1', -1, 1, 0.01) : ''));
  return s;
};
INSPECT.bottom = (it) => sec('meta', 'Bottom', metaSec('bottom', it)) + piecesSec(it)
  + sec('base', 'Base garment', fChkOn('Base trousers (switch off to dress only with drawn pieces)', 'item:base', 1))
  + (it.base !== false ? sec('legs', 'Trousers', fCol('Colour', 'item:bot.c') + fNum('Length', 'item:bot.len', 0.3, 1, 0.01) + fNum('Flare', 'item:bot.flare', 0, 8, 0.1)
    + fOptCol('Fur cuffs', 'item:bot.fur', '#f1ead8') + fOptCol('Thigh wrap', 'item:bot.wrap', '#ecebe6')) : sec('legs', 'Colour', fCol('Garment colour (pieces)', 'item:bot.c')))
  + sec('shoes', 'Belt and shoes', fOptCol('Belt', 'item:belt', '#3a2a22') + fSel('Shoes', 'item:shoe.0', [['bare', 'Barefoot'], ['shoe', 'Shoes'], ['boot', 'Boots'], ['sandal', 'Sandals'], ['tabi', 'Tabi']]) + fCol('Shoe colour', 'item:shoe.1'));

// ---- vector layers (hats, faces, back art)
function layersSec(L, title) {
  const ly = curLayer();
  let s = `<div class="layers">${L.map((x, i) => `<div class="ly ${i === ST.layer ? 'on' : ''}" data-act="layer" data-arg="${i}">
    <button class="ib sm ${x.hidden ? 'off' : ''}" data-act="ly-vis" data-arg="${i}" title="Show / hide">${IC.eye}</button>
    <span class="sw" style="background:${x.kind === 'raw' ? 'repeating-linear-gradient(45deg,#555 0 3px,#333 3px 6px)' : (x.fill && x.fill !== 'none' ? x.fill : x.stroke)}"></span>
    <b>${esc(x.name || ({ shape: x.closed ? 'Shape' : 'Line', circle: 'Circle', raw: 'SVG' })[x.kind])}</b><small>${x.kind === 'shape' ? x.pts.length + ' pts' : x.kind}</small></div>`).join('') || note('No layer yet.')}</div>`;
  s += row(btn('+ Shape', 'ly-add', 'shape', 'ghost'), btn('+ Line', 'ly-add', 'line', 'ghost'), btn('+ Circle', 'ly-add', 'circle', 'ghost'), btn('+ SVG', 'ly-add', 'raw', 'ghost'));
  if (L.length) s += row(btn(IC.up, 'ly-move', 1, 'ib', 'Bring forward'), btn(IC.down, 'ly-move', -1, 'ib', 'Send backward'), btn(IC.copy, 'ly-dup', null, 'ib', 'Duplicate'), btn(IC.mirror, 'ly-mirror', null, 'ib', 'Mirror left/right'), btn(IC.del, 'ly-del', null, 'ib danger', 'Delete layer'));
  let p = sec('layers', title || 'Layers', s + note('Last layer is drawn on top.'), `${L.length}`);
  if (ly) {
    let b = fTxt('Name', 'layer:name');
    if (ly.kind === 'shape') {
      b += row(fChk('Closed', 'layer:closed', 1), fChk('Smooth curve', 'layer:smooth'));
      b += ly.closed ? fOptCol('Fill', 'layer:fill', '#c9a66b') : fChk('Ink under the line', 'layer:inkUnder');
      b += fOptCol('Stroke', 'layer:stroke', '#0a0c11') + fNum('Stroke width', 'layer:sw', 0, 8, 0.1) + fNum('Opacity', 'layer:op', 0, 1, 0.05);
      b += note('Stage: <b>Add points</b> then click to add after the selected point. Drag the small dots to insert. Shift-click: sharp corner. Alt-click or double-click: delete a point.');
      if (ST.point >= 0 && ly.pts[ST.point]) b += row(fNum('x', `layer:pts.${ST.point}.0`, -60, 60, 0.5), fNum('y', `layer:pts.${ST.point}.1`, -70, 50, 0.5));
    } else if (ly.kind === 'circle') {
      b += fNum('Centre x', 'layer:cx', -60, 60, 0.5) + fNum('Centre y', 'layer:cy', -70, 50, 0.5) + fNum('Radius', 'layer:r', 0.3, 40, 0.1)
        + fOptCol('Fill', 'layer:fill', '#f4c66a') + fOptCol('Stroke', 'layer:stroke', '#0a0c11') + fNum('Stroke width', 'layer:sw', 0, 8, 0.1) + fNum('Opacity', 'layer:op', 0, 1, 0.05);
    } else {
      b += `<label class="f col"><span>SVG markup (local coordinates)</span><textarea data-bind="layer:svg" data-t="s" rows="8" spellcheck="false">${esc(ly.svg || '')}</textarea></label>`;
      b += note(ST.mode === 'back' ? 'Origin = the anchor on the torso, +y down the spine.' : 'Head centre at 0,0, radius 19, facing right. Eyes sit at y ≈ 1.');
    }
    p += sec('layer', 'Layer', b);
  }
  return p;
}
INSPECT.hat = (it) => sec('meta', 'Hat', metaSec('hat', it) + fChk('Covers the crown (flattens spiky hair)', 'item:cover')) + layersSec(it.layers);
INSPECT.face = (it) => sec('meta', 'Face', metaSec('face', it) + fChk('Keep the standard eyes (and their happy / hurt looks)', 'item:eyes')) + layersSec(it.layers);
INSPECT.back = (it) => sec('meta', 'Back piece', metaSec('back', it))
  + sec('cape', 'Cape', fChk('Cape', 'item:cape.on', 1) + (it.cape.on ? fCol('Outside', 'item:cape.fill') + fCol('Lining', 'item:cape.lining') + fOptCol('Edge', 'item:cape.edge', '#f4c66a') + fNum('Length', 'item:cape.len', 50, 140, 1)
    + row(fChk('Torn hem', 'item:cape.jag'), fChk('Stripes', 'item:cape.stripes'), fChk('Stars', 'item:cape.stars')) : ''))
  + sec('hood', 'Hood and mantle', fChk('Hood', 'item:hood.on', 1) + (it.hood.on ? fCol('Hood colour', 'item:hood.c') : '')
    + fChk('Mantle on the shoulders', 'item:mantle.on', 1) + (it.mantle.on ? fCol('Mantle colour', 'item:mantle.c') + fCol('Clasp', 'item:mantle.clasp') + fChk('Fur', 'item:mantle.fur') : ''))
  + sec('art', 'Free art on the torso', fNum('Anchor across', 'item:art.u', -1.4, 1.4, 0.01) + fNum('Anchor height', 'item:art.v', -0.4, 1.4, 0.01)
    + fSel('Layer', 'item:art.layer', [['back', 'Behind the body'], ['under', 'Over the torso, under arms and head'], ['over', 'Over everything']]) + fNum('Sway (degrees)', 'item:art.sway', 0, 25, 0.5))
  + layersSec(it.art.layers, 'Art layers');

// ---- auras
const SHAPES = Object.keys(EMIT_SHAPE).map((k) => [k, k[0].toUpperCase() + k.slice(1)]);
INSPECT.aura = (it) => {
  const e = curEmitter();
  let s = sec('meta', 'Aura', metaSec('aura', it) + fOptCol('Rim glow', 'item:glow', '#ff6a2b') + fSel('Blend', 'item:blend', [['screen', 'Glow (screen)'], ['normal', 'Normal paint']]));
  s += sec('flame', 'Flame body', fChk('Flames around the body', 'item:flame.on', 1) + (it.flame.on ? fCol('Outer', 'item:flame.c1') + fCol('Middle', 'item:flame.c2') + fCol('Core', 'item:flame.c3') + fNum('Height', 'item:flame.h', 60, 240, 1) + fNum('Width', 'item:flame.w', 20, 80, 1) : ''));
  s += sec('bolts', 'Lightning', fChk('Flickering bolts', 'item:bolts.on', 1) + (it.bolts.on ? fCol('Colour', 'item:bolts.c') : ''));
  s += sec('emitters', 'Particle emitters', `<div class="chips">${it.emitters.map((x, i) => `<button class="chip ${i === ST.emitter ? 'on' : ''} ${x.hidden ? 'off' : ''}" data-act="em" data-arg="${i}">${esc(x.shape)} · ${esc(x.motion)}</button>`).join('')}</div>`
    + row(`<select class="tpl" data-act="em-add"><option value="">+ Emitter…</option><option value="blank">Blank</option>${Object.entries(EMITTER_PRESETS).map(([k, v]) => `<option value="${k}">${v[0]}</option>`).join('')}</select>`, btn(IC.copy, 'em-dup', null, 'ib', 'Duplicate'), btn(IC.eye, 'em-vis', null, 'ib', 'Show / hide'), btn(IC.del, 'em-del', null, 'ib danger', 'Delete')), `${it.emitters.length}`);
  if (e) s += sec('em', 'Emitter', fSel('Shape', 'em:shape', SHAPES) + fSel('Motion', 'em:motion', EMIT_MOTIONS.map((m) => [m, m[0].toUpperCase() + m.slice(1)]), 1)
    + fNum('Count', 'em:n', 0, 60, 1) + fNum('Speed', 'em:speed', 0, 5, 0.05) + fNum('Size', 'em:size', 0.5, 20, 0.1) + fNum('Grow over life', 'em:grow', -1, 4, 0.05)
    + fNum('Spread', 'em:spread', 0, 120, 1) + fNum('Height', 'em:height', 0, 240, 1) + fNum('Height offset', 'em:y', -120, 80, 1) + fNum('Wobble', 'em:wob', 0, 30, 0.5) + fNum('Spin', 'em:spin', -5, 5, 0.1)
    + fNum('Opacity', 'em:op', 0, 1, 0.05) + fSel('Fade', 'em:fade', [['out', 'Fade out'], ['inout', 'Fade in and out'], ['none', 'No fade']]) + fChk('Blink', 'em:blink')
    + fCol('Colour', 'em:c') + fOptCol('Every other one', 'em:c2', '#ffffff') + fNum('Seed', 'em:seed', 1, 99, 1));
  return s;
};
INSPECT.color = (it) => sec('meta', 'Colour', metaSec('color', it) + fCol('Body colour', 'item:ink') + note('The figure\'s skin in the Flat style, and the glow of the Neon style.'));

/* ================================================================ manga cuts */
// The 36 manga haircuts (js/hair-cuts.js) are pictures fitted to the head at run time. Here each one
// can be moved and resized by hand; the result is saved in the pack (cuts) like any other content.
let cutsApplied = '';
function ensureCutsLive() {
  const k = JSON.stringify(ST.pack.cuts || {});
  if (k === cutsApplied) return;
  cutsApplied = k;
  HAIR_FIT.adjust(ST.pack.cuts);
}
function cutsChanged() { ensureCutsLive(); }
function cutAdj(id) { return HAIR_FIT.adjOf((ST.pack.cuts || {})[id]); }
const cutEdited = (id) => !!(ST.pack.cuts || {})[id];
function cutThumb(id) {
  const A = Object.assign(wearing(), { hair: 'cut_' + id }), B = cosOf('build', A.build).b, J = solve(FRONT_POSE, B);
  try { return `<svg viewBox="${rd(J.head[0] - 32)} ${rd(J.head[1] - 40)} 64 72">${drawAvatar(A, FRONT_POSE, 0.6, { weapon: '', uid: 'ct' + thumbN++ })}</svg>`; } catch (e) { return ''; }
}
function cutsLeft() {
  ensureCutsLive();
  const groups = Object.entries(HAIR_CUT_WORLDS).map(([w, name]) => [name, Object.keys(HAIR_CUTS).filter((id) => HAIR_CUTS[id].world === w)]);
  return `<div class="lh"><h2>Manga cuts</h2>${note('Pick a cut, then move and resize it on the head (drag the handles, or use the sliders). <b>Save to project</b> ships it with the pack.')}</div>`
    + `<ul class="list">${groups.map(([g, ids]) => `<li class="grp">${esc(g)}</li>${ids.map((id) => `<li class="${id === ST.cut ? 'on' : ''}" data-act="cutpick" data-arg="${id}"><span class="th">${cutThumb(id)}</span><span class="nm"><b>${esc(HAIR_CUTS[id].name)}</b><small>${esc(id)}</small>${cutEdited(id) ? '<small class="tag">adjusted</small>' : ''}</span></li>`).join('')}`).join('')}</ul>`;
}
function cutsRight() {
  const id = ST.cut, C = HAIR_CUTS[id];
  if (!C) return `<div class="sec"><div class="sb">${note('Pick a cut on the left.')}</div></div>`;
  const a = cutAdj(id), b = HAIR_FIT.base(id), n = Object.keys(ST.pack.cuts || {}).length;
  return sec('cutfit', esc(C.name), note(`On the stage: <b>◆</b> moves it, <b>■</b> resizes it, <b>●</b> stretch its width or height. Sizes grow from the centre of the skull (the dashed circle).`)
      + fNum('Move left / right', 'cut:x', -30, 30, 0.1) + fNum('Move up / down', 'cut:y', -30, 30, 0.1)
      + fNum('Size (%)', 'cut:s', 40, 200, 1) + fNum('Width (%)', 'cut:sw', 40, 200, 1) + fNum('Height (%)', 'cut:sh', 40, 200, 1)
      + row(btn('Reset this cut', 'cutreset', id, 'ghost'), btn('Next cut', 'cutnext', 1, 'ghost'))
      + note(`Box on the skull: ${rd(C.x)}, ${rd(C.y)} · ${rd(C.w)} × ${rd(C.h)} (as registered: ${rd(b.x)}, ${rd(b.y)} · ${rd(b.w)} × ${rd(b.h)}).${a.x || a.y || a.s !== 100 || a.sw !== 100 || a.sh !== 100 ? '' : ' Not adjusted.'}`))
    + sec('cutsave', 'Save', note(`${n} cut${n === 1 ? '' : 's'} adjusted. The changes are kept in this browser's draft; <b>Save to project</b> writes them into <code>js/custom-pack.js</code> (the game and the Rig Lab read them there). Tick <b>Preview in game</b> to try them in your game first.`)
      + row(btn(IC.save + ' Save to project', 'save', null, 'primary'), btn('Download file', 'download', null, 'ghost'))
      + (n ? row(btn('Reset every cut', 'cutresetall', null, 'ghost danger')) : ''));
}
// Drag on the stage, in the hair's frame (q): move, size (from the skull's centre) or stretch.
function dragCut(h, q) {
  const id = ST.cut, C = ST.pack.cuts || (ST.pack.cuts = {}), a = cutAdj(id);
  if (!drag.cut) drag.cut = { q0: q, a0: Object.assign({}, a) };
  const { q0, a0 } = drag.cut, n = Object.assign({}, a0);
  if (h === 'move') { n.x = a0.x + (q[0] - q0[0]); n.y = a0.y + (q[1] - q0[1]); }
  if (h === 'size') { const d0 = Math.hypot(q0[0] - a0.x, q0[1] - a0.y), d1 = Math.hypot(q[0] - a0.x, q[1] - a0.y); if (d0 > 2) n.s = a0.s * (d1 / d0); }
  if (h === 'sw' && Math.abs(q0[0] - a0.x) > 2) n.sw = a0.sw * ((q[0] - a0.x) / (q0[0] - a0.x));
  if (h === 'sh' && Math.abs(q0[1] - a0.y) > 2) n.sh = a0.sh * ((q[1] - a0.y) / (q0[1] - a0.y));
  const v = HAIR_FIT.adjOf(n);
  C[id] = { x: rd2(v.x), y: rd2(v.y), s: rd(v.s), sw: rd(v.sw), sh: rd(v.sh) };
  ensureCutsLive();
  renderRightSoon();
}

/* ================================================================ pack page */
function packLeft() {
  return `<div class="lh"><h2>Pack</h2></div><div class="sb">${note('Everything you made, ready to ship. The game reads <code>js/custom-pack.js</code>; the Studio keeps a draft in this browser until you save.')}
    <ol class="steps"><li><b>Make</b> content in each tab.</li><li><b>Preview in game</b> (top bar) to test it in your own game.</li><li><b>Save to project</b>: pick <code>js/custom-pack.js</code> in the game folder once, it is remembered.</li><li>Commit and push, or ask Claude to deploy.</li></ol></div>`;
}
function packRight() {
  const probs = [];
  for (const t of TYPE_ORDER) for (const it of items(t)) { const p = idProblem(t, it); if (p) probs.push(`${TYPES[t].label}: <b>${esc(it.name)}</b> (${esc(it.id)}) · ${p}`); }
  for (const a of items('anim')) if (a.keys.length < 2) probs.push(`Animations: <b>${esc(a.name)}</b> has fewer than 2 keys.`);
  return sec('save', 'Save', row(btn(IC.save + ' Save to project', 'save', null, 'primary'), btn('Download file', 'download', null, 'ghost'))
      + row(btn('Import…', 'import', null, 'ghost'), btn('Copy JSON', 'copyjson', null, 'ghost'))
      + row(btn('Revert to project file', 'revert', null, 'ghost danger'))
      + (inboxSets().length ? row(btn(`Add the review set again (${esc(inboxSets()[0].label)})`, 'inbox', null, 'ghost')) : '')
      + note(differs() ? 'The draft has changes not saved to the project yet.' : 'The draft matches the project file.', differs() ? 'warn' : ''))
    + sec('check', 'Checks', probs.length ? probs.map((p) => note(p, 'bad')).join('') : note('No problem found.'));
}
function renderOverview() {
  const el = $('#overview');
  if (ST.mode !== 'pack') { el.hidden = true; stage.style.display = ''; return; }
  el.hidden = false; stage.style.display = 'none';
  el.innerHTML = TYPE_ORDER.map((t) => `<section><h2>${TYPES[t].label} <em>${items(t).length}</em></h2><div class="cards">${items(t).map((it, i) => `<button class="card" data-act="goto" data-arg="${t}:${i}"><span class="th">${thumbSVG(t, it)}</span><b>${esc(it.name)}</b><small>${esc(it.id)}</small></button>`).join('') || '<p class="note">None yet.</p>'}</div></section>`).join('');
}

/* ================================================================ files */
function packText() {
  return `'use strict';\n/* Content made in the Studio (editor.html): animations, haircuts, clothes, hats, faces, back pieces, auras, colours.\n   Generated by the Studio: edit it there, not by hand. Read by js/custom.js. */\nconst CUSTOM_PACK = ${JSON.stringify(ST.pack, null, 1)};\n`;
}
function idb(mode, fn) {
  return new Promise((ok, no) => {
    const r = indexedDB.open('trirealm-studio', 1);
    r.onupgradeneeded = () => r.result.createObjectStore('kv');
    r.onerror = () => no(r.error);
    r.onsuccess = () => { const tx = r.result.transaction('kv', mode), q = fn(tx.objectStore('kv')); tx.oncomplete = () => ok(q && q.result); tx.onerror = () => no(tx.error); };
  });
}
const PACK_FILE = 'custom-pack.js';
async function saveProject() {
  if (!window.showSaveFilePicker) { download(); toast('This browser cannot write files: downloaded custom-pack.js instead. Put it in the js folder.', 'warn'); return; }
  try {
    let h = null;
    try { h = await idb('readonly', (s) => s.get('pack')); } catch (e) { /* no handle */ }
    // only ever write custom-pack.js: picking another file (custom.js is the game's loader) would break the game
    if (h && h.name !== PACK_FILE) { h = null; try { await idb('readwrite', (s) => s.delete('pack')); } catch (e) { /* nothing stored */ } }
    if (h && (await h.queryPermission({ mode: 'readwrite' })) !== 'granted' && (await h.requestPermission({ mode: 'readwrite' })) !== 'granted') h = null;
    if (!h) {
      toast('Pick js/custom-pack.js in the game folder (asked only once).');
      h = await window.showSaveFilePicker({ suggestedName: PACK_FILE, types: [{ description: 'JavaScript', accept: { 'text/javascript': ['.js'] } }] });
      if (h.name !== PACK_FILE) { toast(`Not saved: "${h.name}" is not ${PACK_FILE}. Pick js/${PACK_FILE} (writing another file would break the game).`, 'bad'); return; }
      try { await idb('readwrite', (s) => s.put(h, 'pack')); } catch (e) { /* not remembered */ }
    }
    const w = await h.createWritable();
    await w.write(packText());
    await w.close();
    savedJSON = JSON.stringify(ST.pack);
    toast(`Saved to ${h.name}.`, 'good');
    renderTop();
  } catch (e) { if (e && e.name !== 'AbortError') toast('Save failed: ' + e.message, 'bad'); }
}
function download() {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([packText()], { type: 'text/javascript' }));
  a.download = 'custom-pack.js';
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 2000);
}
function importText(txt) {
  let s = String(txt).trim();
  const m = s.match(/CUSTOM_PACK\s*=\s*([\s\S]*?);?\s*$/);
  if (m) s = m[1].replace(/;\s*$/, '');
  const p = normPack(JSON.parse(s));
  const n = TYPE_ORDER.reduce((a, t) => a + p[t].length, 0);
  if (!confirm(`Import ${n} items? They are added to the draft (items with the same id are replaced).`)) return;
  for (const t of TYPE_ORDER) for (const it of p[t]) { const i = items(t).findIndex((x) => x.id === it.id); if (i >= 0) items(t)[i] = it; else items(t).push(it); }
  commit(); renderAll(); toast(`Imported ${n} items.`, 'good');
}
$('#importfile').addEventListener('change', (ev) => {
  const f = ev.target.files[0];
  if (!f) return;
  f.text().then((t) => { try { importText(t); } catch (e) { toast('Not a pack file: ' + e.message, 'bad'); } });
  ev.target.value = '';
});

/* ================================================================ toasts and help */
function toast(msg, cls) {
  const d = document.createElement('div');
  d.className = 'toast ' + (cls || '');
  d.innerHTML = msg;
  $('#toasts').appendChild(d);
  setTimeout(() => d.classList.add('out'), 3200);
  setTimeout(() => d.remove(), 3800);
}
function showHelp(on) {
  const el = $('#help');
  el.classList.toggle('show', on);
  if (!on) return;
  el.innerHTML = `<div class="card"><h2>Tri-Realm Studio</h2>
    <p>Make avatar content with the game's own renderer. Your work is kept as a draft in this browser; <b>Save to project</b> writes <code>js/custom-pack.js</code>, which the game loads.</p>
    <div class="cols"><div><h3>Stage</h3><ul>
      <li>Wheel: zoom · drag on empty space, middle or right button, or Space-drag: pan</li>
      <li><b>F</b> fit the body · <b>H</b> zoom on the head</li>
      <li>Ctrl+Z / Ctrl+Y: undo / redo · Ctrl+S: save</li></ul>
      <h3>Animations</h3><ul>
      <li>Space: play / pause · <b>,</b> <b>.</b> previous / next key · Home / End</li>
      <li><b>K</b> add a key · Del: delete it · Ctrl+C / Ctrl+V: copy / paste a pose · <b>M</b> swap limbs · <b>O</b> onion skin</li>
      <li>Drag a joint between keys: a key is added there (auto-key)</li>
      <li>Squares (hands, feet) use IK: hold Alt to bend the other way</li>
      <li>Drag keys on the timeline to retime them; click the ruler to scrub</li></ul></div>
      <div><h3>Hair</h3><ul><li><b>B</b> brush: paint a lock, it follows your stroke · <b>L</b> arc lock: drag root to tip</li><li>Symmetry mirrors each new lock</li><li><b>Masses</b>: free hair shapes (bangs, long hair) merged into the silhouette</li><li>Square: root · circle: tip · diamond: curl</li><li>The crown ring generator adds a fan of locks</li></ul>
      <h3>Clothes</h3><ul><li>Drawn pieces sit on a body part (torso, arms, legs) and follow it in every pose</li><li>Draw in T-pose; the strip under the stage shows the piece on 8 poses</li><li>Prints: stripes, checks, dots, trim; gloves; the base garment can be switched off</li></ul>
      <h3>Hats, faces, back art</h3><ul><li><b>D</b> add points: click to place after the selected point</li><li>Drag the small dots between points to insert one</li><li>Shift-click: sharp corner · Alt-click or double-click: delete</li><li>An "SVG" layer takes raw markup (import of built-ins)</li></ul>
      <h3>In the game</h3><ul><li>Stances show in Avatar → Stance; skill animations play while the skill runs; attacks join the battle rotation</li><li><b>Preview in game</b>: with dev mode on, the game on this computer loads the draft (reload its tab)</li></ul></div></div>
    <p class="muted">Ideas from open-source tools: Spine-like keyframing and DragonBones' dope sheet, OpenToonz onion skin, Inkscape nodes, pixi-particle-emitter / Effekseer emitters, the LPC character generator's layered parts.</p>
    <button class="b primary" data-act="help-close">Close</button></div>`;
}

/* ================================================================ actions */
const ACT = {
  mode(t) { if (GAR_MODES[t] && ST.previewPose === 'relaxed') ST.previewPose = 'tpose'; ST.mode = t; ST.tool = ''; ST.playing = false; ST.point = -1; if (t === 'anim') ST.u = 0; renderAll(); autoFit(); saveDraft(); },
  pick(i) { ST.sel[ST.mode] = +i; ST.lock = 0; ST.layer = 0; ST.point = -1; ST.emitter = 0; ST.u = 0; ST.playing = false; renderAll(); saveDraft(); },
  new() { items().push(makeItem(ST.mode)); ST.sel[ST.mode] = items().length - 1; ST.lock = 0; ST.layer = 0; ST.u = 0; commit(); renderAll(); },
  tpl(v, el) { if (!v) return; items().push(makeItem(ST.mode, v)); ST.sel[ST.mode] = items().length - 1; ST.lock = 0; ST.layer = 0; ST.u = 0; el.value = ''; commit(); renderAll(); },
  dup() { const it = cur(); if (!it) return; const c = clone(it); c.name += ' (copy)'; c.id = uniqueId(ST.mode, it.id.replace(/-\d+$/, '')); items().splice(ST.sel[ST.mode] + 1, 0, c); ST.sel[ST.mode]++; commit(); renderAll(); },
  delitem() { const it = cur(); if (!it || !confirm(`Delete "${it.name}"?`)) return; items().splice(ST.sel[ST.mode], 1); commit(); renderAll(); },
  move(d) { const L = items(), i = ST.sel[ST.mode], j = i + +d; if (j < 0 || j >= L.length) return; [L[i], L[j]] = [L[j], L[i]]; ST.sel[ST.mode] = j; commit(); renderLeft(); },
  undo() { histGo(-1); }, redo() { histGo(1); },
  inbox() { if (takeInbox(true)) { commit(); renderAll(); autoFit(); toast(inboxNote, 'good'); } },
  save() { saveProject(); }, download() { download(); },
  import() { $('#importfile').click(); },
  copyjson() { navigator.clipboard.writeText(JSON.stringify(ST.pack, null, 1)).then(() => toast('Pack JSON copied.', 'good')); },
  revert() { if (!confirm('Replace the draft with js/custom-pack.js as loaded? Unsaved work is lost (undo still works).')) return; ST.pack = projectPack(); commit(); renderAll(); },
  live(v, el) {
    ST.live = el.checked;
    try { if (ST.live) localStorage.setItem('trirealm_dev', '1'); } catch (e) { /* ignore */ }
    saveDraft();
    toast(ST.live ? 'The game on this computer now loads this draft (dev mode is on). Reload the game tab to see changes.' : 'The game loads the shipped pack again.', 'good');
  },
  help() { showHelp(true); }, 'help-close'() { showHelp(false); },
  fold(id) { ST.open[id] = ST.open[id] === false; renderRight(); saveDraft(); },
  view(v) { if (v === 'head') fitHead(); else if (v === 'torso') fitTorso(); else fitBody(); },
  tool(t) { ST.tool = ST.tool === t ? '' : t; renderStagebar(); if (t.startsWith('h2')) renderRight(); },
  cutpick(id) { ST.cut = id; renderLeft(); renderRight(); saveDraft(); },
  cutnext(d) { const ids = Object.keys(HAIR_CUTS), i = ids.indexOf(ST.cut); ST.cut = ids[(i + +d + ids.length) % ids.length]; renderLeft(); renderRight(); saveDraft(); const li = $('#left li.on'); if (li) li.scrollIntoView({ block: 'nearest' }); },
  cutreset(id) { if (ST.pack.cuts) delete ST.pack.cuts[id]; ensureCutsLive(); commit(); renderLeft(); renderRight(); renderTop(); },
  cutresetall() { if (!confirm('Put every manga cut back where it was registered?')) return; ST.pack.cuts = {}; ensureCutsLive(); commit(); renderLeft(); renderRight(); renderTop(); },
  goto(v) { const [t, i] = v.split(':'); ST.mode = t; ST.sel[t] = +i; renderAll(); autoFit(); },
  // animation
  play() { const a = cur(); if (!a) return; if (!ST.playing && ST.u >= 1 && !ST.loop) ST.u = 0; ST.playing = !ST.playing; renderTimeline(); renderRight(); },
  kprev() { const a = cur(); if (!a) return; const k = [...a.keys].reverse().find((x) => x.u < ST.u - 0.0005); ST.u = k ? k.u : a.keys.length ? a.keys[a.keys.length - 1].u : 0; ST.playing = false; renderTimeline(); renderRight(); },
  knext() { const a = cur(); if (!a) return; const k = a.keys.find((x) => x.u > ST.u + 0.0005); ST.u = k ? k.u : a.keys.length ? a.keys[0].u : 0; ST.playing = false; renderTimeline(); renderRight(); },
  addkey() { if (!cur()) return; ST.playing = false; ensureKey(); commit(); renderTimeline(); renderRight(); },
  delkey() { const a = cur(), i = a ? keyIdxAt(a, ST.u) : -1; if (i < 0) return; a.keys.splice(i, 1); commit(); renderTimeline(); renderRight(); },
  copypose() { const k = curKey() || (cur() && { p: storePose(poseAt(cur(), ST.u)) }); if (k) { ST.clip = clone(k.p); toast('Pose copied.'); } },
  pastepose() { if (!ST.clip || !cur()) return; const k = ensureKey(); k.p = clone(ST.clip); commit(); renderTimeline(); renderRight(); },
  swaplimbs() { if (!cur()) return; const k = ensureKey(); k.p = swapLimbs(k.p); commit(); renderTimeline(); renderRight(); },
  closeloop() { const a = cur(); if (!a || !a.keys.length) return; const last = a.keys.find((x) => x.u >= 0.9995); if (last) last.p = clone(a.keys[0].p); else a.keys.push({ u: 1, e: 'io', p: clone(a.keys[0].p) }); commit(); renderTimeline(); },
  applypose(v, el) { if (!v || !cur()) return; const k = ensureKey(); k.p = storePose(POSES[v.split(':')[1]]); el.value = ''; commit(); renderTimeline(); renderRight(); },
  // hair
  lock(i) { ST.lock = +i; renderRight(); },
  'lock-add'() { const it = cur(); it.locks.push(roundLock({ x: 4, y: -15, a: 92, len: 11, w: 8, bend: 10, tp: 0.8 })); ST.lock = it.locks.length - 1; commit(); renderRight(); },
  'lock-dup'() { const it = cur(), L = curLock(); if (!L) return; const c = clone(L); c.x += 2; it.locks.splice(ST.lock + 1, 0, c); ST.lock++; commit(); renderRight(); },
  'lock-mirror'() { const it = cur(), L = curLock(); if (!L) return; it.locks.splice(ST.lock + 1, 0, mirrorLock(L)); ST.lock++; commit(); renderRight(); },
  'lock-topath'() {
    const L = curLock();
    if (!L || L.path) return;
    const { sp } = lockPts(Object.assign({}, L, { hang: 0, sw: 0 }), 0, 0);
    L.path = sp.slice(1).map((q) => [rd(q[0] - L.x), rd(q[1] - L.y)]);
    for (const k of ['a', 'len', 'bend']) delete L[k];
    commit(); renderRight();
  },
  'lock-smooth'() {
    const L = curLock();
    if (!L || !L.path) return;
    const P = [[0, 0], ...L.path];
    L.path = L.path.map((q, i) => (i === L.path.length - 1 ? q : [rd((P[i][0] + q[0] * 2 + P[i + 2][0]) / 4), rd((P[i][1] + q[1] * 2 + P[i + 2][1]) / 4)]));
    commit(); renderRight();
  },
  'lock-scale'(k) { const L = curLock(); if (!L || !L.path) return; L.path = L.path.map(([x, y]) => [rd(x * k), rd(y * k)]); commit(); renderRight(); },
  hairedit(v) { ST.hairEdit = v; ST.tool = ''; ST.point = -1; ST.layer = 0; renderRight(); renderStagebar(); },
  'mass-add'(v, el) {
    if (!v) return;
    const it = cur(), p = MASS_PRESETS[v];
    (it.masses = it.masses || []).push(Object.assign({ kind: 'shape', name: p[0], closed: true, smooth: true, back: false }, clone(p[1])));
    ST.layer = it.masses.length - 1; ST.point = -1; el.value = '';
    if (v === 'blank') { ST.tool = 'draw'; renderStagebar(); }
    commit(); renderRight();
  },
  'pc-add'(v, el) {
    if (!v) return;
    const it = cur(), pc = pieceFrom(v);
    (it.pieces = it.pieces || []).push(pc);
    ST.layer = it.pieces.length - 1; ST.point = -1; el.value = '';
    if (!pc.pts.length) { ST.tool = 'draw'; renderStagebar(); }
    commit(); renderRight();
  },
  pfill(v) { const pc = curLayer(); if (!pc) return; pc.fill = v === 'custom' ? (pc.fill && pc.fill[0] === '#' ? pc.fill : '#c9a66b') : v; if (!pc.closed) pc.stroke = pc.fill; commit(); renderRight(); },
  pvpose(k) { ST.previewPose = k; renderStagebar(); renderStrip(); },
  'lock-del'() { const it = cur(); if (!curLock()) return; it.locks.splice(ST.lock, 1); ST.lock = Math.min(ST.lock, it.locks.length - 1); commit(); renderRight(); },
  'ring-add'() {
    const it = cur(), R = ST.ring, n = Math.max(2, R.n | 0);
    for (let i = 0; i < n; i++) {
      const k = i / (n - 1), a = R.a0 + (R.a1 - R.a0) * k, p = HP(a, 17);
      it.locks.push(roundLock({ x: p[0], y: p[1], k: 'crown', a: a + (a + 90) * R.fan + R.lean + (hj(i, 3) - 0.5) * R.jit, len: R.len + Math.sin(k * Math.PI) * R.peak + hj(i, 4) * 3, w: R.w, bend: i % 2 ? R.bend : -R.bend * 0.8, tp: 0.8 }));
    }
    ST.lock = it.locks.length - 1; commit(); renderRight();
  },
  h2pick(v) {
    const it = cur(), [kind, key] = v.split(':');
    if (!it || !it.v2) return;
    if (kind === 'style') Object.assign(it.v2, h2Pick(H2_STYLES[key])); else it.v2[kind] = key;
    commit(); renderRight(); renderLeft();
  },
  h2set(v) { const [k, x] = v.split(':'); ST.h2d[k] = k === 'w' ? +x : x; renderRight(); },
  h2undo() { const it = cur(), L = it && it.v2 && it.v2.strokes; if (!L || !L.length) return; const g = L[L.length - 1].g; it.v2.strokes = L.filter((st, i) => i < L.length - 1 && !(g && st.g === g)); commit(); renderRight(); renderLeft(); },
  h2clear() { const it = cur(); if (!it || !it.v2 || !confirm('Remove all the locks you drew?')) return; it.v2.strokes = []; commit(); renderRight(); renderLeft(); },
  h2var(k) { const it = cur(); if (!it || !it.v2) return; it.v2.seed = Math.max(1, (it.v2.seed || 1) + (+k || 1)); commit(); renderRight(); renderLeft(); },
  h2col(c) { const it = cur(); if (!it || !it.v2) return; it.v2.c = c; commit(); renderRight(); renderLeft(); },
  'comb-add'() { const it = cur(); (it.combs = it.combs || []).push([-60, -170, 14]); commit(); renderRight(); },
  'comb-del'(i) { cur().combs.splice(+i, 1); commit(); renderRight(); },
  // vector layers
  layer(i) { ST.layer = +i; ST.point = -1; renderRight(); },
  'ly-add'(k) { const L = vecLayers(); L.push(DEF_LAYER[k]()); ST.layer = L.length - 1; ST.point = -1; if (k === 'shape' || k === 'line') { ST.tool = 'draw'; renderStagebar(); } commit(); renderRight(); },
  'ly-vis'(i, el, ev) { ev.stopPropagation(); const x = vecLayers()[+i]; x.hidden = !x.hidden; commit(); renderRight(); },
  'ly-move'(d) { const L = vecLayers(), i = ST.layer, j = i + +d; if (j < 0 || j >= L.length) return; [L[i], L[j]] = [L[j], L[i]]; ST.layer = j; commit(); renderRight(); },
  'ly-dup'() { const L = vecLayers(), x = curLayer(); if (!x) return; L.splice(ST.layer + 1, 0, clone(x)); ST.layer++; commit(); renderRight(); },
  'ly-mirror'() {
    const x = curLayer();
    if (!x) return;
    const ax = GAR_MODES[ST.mode] && x.part !== 'torso' ? 1 : 0;
    if (x.kind === 'shape') x.pts = x.pts.map((p) => { const q = [p[0], p[1]]; q[ax] = -q[ax]; return p[2] ? q.concat([1]) : q; }).reverse();
    else if (x.kind === 'circle') x.cx = -x.cx;
    else x.svg = `<g transform="scale(-1,1)">${x.svg}</g>`;
    commit(); renderRight();
  },
  'ly-del'() { const L = vecLayers(); if (!curLayer()) return; L.splice(ST.layer, 1); ST.layer = Math.max(0, ST.layer - 1); ST.point = -1; commit(); renderRight(); },
  // aura emitters
  em(i) { ST.emitter = +i; renderRight(); },
  'em-add'(v, el) { if (!v) return; const it = cur(); it.emitters.push(v === 'blank' ? DEF_EMITTER() : emitterFrom(v)); ST.emitter = it.emitters.length - 1; el.value = ''; commit(); renderRight(); },
  'em-dup'() { const it = cur(), e = curEmitter(); if (!e) return; const c = clone(e); c.seed = (c.seed || 1) + 1; it.emitters.splice(ST.emitter + 1, 0, c); ST.emitter++; commit(); renderRight(); },
  'em-vis'() { const e = curEmitter(); if (!e) return; e.hidden = !e.hidden; commit(); renderRight(); },
  'em-del'() { const it = cur(); if (!curEmitter()) return; it.emitters.splice(ST.emitter, 1); ST.emitter = Math.max(0, ST.emitter - 1); commit(); renderRight(); },
};
document.addEventListener('click', (ev) => {
  const el = ev.target.closest('[data-act]');
  if (!el || el.tagName === 'SELECT' || el.tagName === 'INPUT') return;
  if (el.disabled) return;
  const f = ACT[el.dataset.act];
  if (f) f(el.dataset.arg, el, ev);
});
$('#help').addEventListener('click', (ev) => { if (ev.target.id === 'help') showHelp(false); });

/* ---------------------------------------------------------------- inputs */
function readEl(el) {
  const t = el.dataset.t;
  if (t === 'b') return el.checked;
  if (t === 'n') { const v = parseFloat(el.value); return isFinite(v) ? v : 0; }
  return el.value;
}
function onBind(el, final) {
  const b = el.dataset.bind;
  let v = readEl(el);
  if (b === 'lock:k') v = v ? 'crown' : '';
  setB(b, v);
  // a choice that needs a target gets a sensible one (a select shows its first option without storing it)
  if (b === 'item:unlock.type') { const u = cur().unlock; if (v === 'level' && !SKILLS[u.skill]) u.skill = Object.keys(SKILLS)[0]; if ((v === 'kills' || v === 'boss') && !ZONES.some((z) => z.id === u.zone && (v !== 'boss' || z.boss))) u.zone = (ZONES.find((z) => v !== 'boss' || z.boss) || {}).id; if (!u.n) u.n = v === 'kills' ? 50 : 10; }
  if (b === 'item:use' && v === 'skill' && !SKILLS[cur().skill]) cur().skill = Object.keys(SKILLS)[0];
  if (el.dataset.t === 'n') $$(`[data-bind="${b}"]`).forEach((x) => { if (x !== el) x.value = v; });
  if (el.type === 'color') { const c = el.parentElement.querySelector('code'); if (c) c.textContent = v; }
  if (b.startsWith('cut:')) { cutsChanged(); if (final) { ST.pack.cuts = normCuts(ST.pack.cuts); commit(); renderLeft(); renderTop(); } return; }
  if (b.startsWith('st:') || b.startsWith('man:')) {
    if (b === 'st:previewPose' || b.startsWith('man:')) { needReg = true; }
    if (final && b.startsWith('man:')) { renderLeft(); }
    if (b === 'st:handles' || b === 'st:guide' || b === 'st:snap') renderStagebar();
    saveDraft();
    return;
  }
  needReg = true;
  if (b.startsWith('key:') && !final) renderTimelineSoon();
  if (final) {
    if (b === 'item:name' || b === 'item:id' || b === 'item:r' || b === 'item:w' || b === 'item:use') renderLeft();
    commit();
    if (el.dataset.rr || b === 'item:id') renderRight();
    if (b.startsWith('key:') || b === 'item:dur') renderTimeline();
    renderTop();
  }
}
let tlT = 0;
function renderTimelineSoon() { clearTimeout(tlT); tlT = setTimeout(renderTimeline, 120); }
document.addEventListener('input', (ev) => {
  const el = ev.target;
  if (el.dataset && el.dataset.bind && el.type !== 'checkbox' && el.tagName !== 'SELECT') onBind(el, false);
});
document.addEventListener('change', (ev) => {
  const el = ev.target, d = el.dataset || {};
  if (el.tagName === 'SELECT') setTimeout(() => el.blur(), 0);
  if (d.bind) { onBind(el, true); return; }
  if (d.octog) { const c = el.parentElement.querySelector('input[type=color]'); c.disabled = !el.checked; setB(d.octog, el.checked ? c.value : ''); needReg = true; commit(); return; }
  if (d.ogtog) { setB(d.ogtog, el.checked ? JSON.parse(d.def) : null); needReg = true; commit(); renderRight(); return; }
  if (d.ktime) {
    const a = cur(), k = curKey();
    if (!a || !k) return;
    const u = rd2(clamp(parseFloat(el.value) / a.dur, 0, 1));
    if (a.keys.some((x) => x !== k && Math.abs(x.u - u) < 0.005)) { toast('Another key is already there.', 'warn'); renderRight(); return; }
    k.u = u; ST.u = u; sortKeys(a); commit(); renderTimeline(); renderRight();
    return;
  }
  if (d.act && ACT[d.act]) ACT[d.act](el.value, el, ev);
});

/* ---------------------------------------------------------------- keyboard */
document.addEventListener('keydown', (ev) => {
  const typing = /INPUT|TEXTAREA|SELECT/.test(document.activeElement && document.activeElement.tagName) && document.activeElement.type !== 'checkbox' && document.activeElement.type !== 'range';
  const ctrl = ev.ctrlKey || ev.metaKey, k = ev.key;
  if (ctrl && k.toLowerCase() === 's') { ev.preventDefault(); saveProject(); return; }
  if (typing) return;
  if (ctrl && k.toLowerCase() === 'z') { ev.preventDefault(); histGo(ev.shiftKey ? 1 : -1); return; }
  if (ctrl && k.toLowerCase() === 'y') { ev.preventDefault(); histGo(1); return; }
  if (k === ' ') { spaceDown = true; if (ST.mode === 'anim') { ev.preventDefault(); ACT.play(); } else ev.preventDefault(); return; }
  if (k === 'Escape') { showHelp(false); ST.tool = ''; renderStagebar(); return; }
  if (k === 'f' || k === 'F') { fitBody(); return; }
  if (k === 'h' || k === 'H') { fitHead(); return; }
  if (k === '?') { showHelp(true); return; }
  if (ST.mode === 'anim') {
    if (ctrl && k.toLowerCase() === 'c') { ACT.copypose(); return; }
    if (ctrl && k.toLowerCase() === 'v') { ACT.pastepose(); return; }
    if (k === 'k' || k === 'K') ACT.addkey();
    else if (k === 'Delete' || k === 'Backspace') ACT.delkey();
    else if (k === ',') ACT.kprev();
    else if (k === '.') ACT.knext();
    else if (k === 'Home') { ST.u = 0; ST.playing = false; snapToKey(); renderTimeline(); }
    else if (k === 'End') { ST.u = 1; ST.playing = false; snapToKey(); renderTimeline(); }
    else if (k === 'm' || k === 'M') ACT.swaplimbs();
    else if (k === 'o' || k === 'O') { ST.onion = !ST.onion; renderTimeline(); }
    return;
  }
  if (ST.mode === 'hair' && cur() && cur().v2) {
    if (k === 'd' || k === 'D') ACT.tool('h2draw');
    else if (k === 'e' || k === 'E') ACT.tool('h2erase');
    return;
  }
  if (ST.mode === 'hair' && !isVec()) {
    if (k === 'l' || k === 'L') ACT.tool('addlock');
    else if (k === 'b' || k === 'B') ACT.tool('brush');
    else if (k === 'Delete' || k === 'Backspace') ACT['lock-del']();
    return;
  }
  if (isVec()) {
    if (k === 'd' || k === 'D') ACT.tool('draw');
    else if ((k === 'Delete' || k === 'Backspace') && ST.point >= 0 && curLayer() && curLayer().pts) { curLayer().pts.splice(ST.point, 1); ST.point = Math.min(ST.point, curLayer().pts.length - 1); commit(); renderRight(); }
  }
});
document.addEventListener('keyup', (ev) => { if (ev.key === ' ') spaceDown = false; });

/* ================================================================ boot */
function renderAll() { renderTop(); renderLeft(); renderStagebar(); renderTimeline(); renderRight(); renderOverview(); }
registerCustomPack(ST.pack);
needReg = false;
renderAll();
autoFit();
if (inboxNote) { saveDraft(); toast(inboxNote, 'good'); }
requestAnimationFrame(tick);
