'use strict';
/* ==========================================================================
   TRI-REALM IDLE — Kaio Planet: the gravity chamber and the farm (kaio.js is the engine)
   Gravity Training: your avatar runs three different combos under crushing gravity (ki aura,
   sweat, floor cracks and dust on heavy blows, a ki blast) in a capsule chamber.
   The dial shows the gravity, dust falls like rain, every blow sends out a shockwave and
   the floor cracks under heavier sessions. The strain meter fills; a breakthrough flares
   a golden aura.
   Farming: the field on the little planet. The avatar walks between the plots, waters,
   tends, sows and pulls each harvest out of the ground. Every plot is drawn with its crop at its real
   growth stage (seed, sprout, leaves, bud, ripe); ripe crops sway and glow. Harvests pop
   out of their plot; a Giant crop bursts with light; a mutation drops a new seed.
   Loaded after soul-ui.js.
   ========================================================================== */

/* ================================================================ particles shared by Kaio and Shinjuku */
// sweat: a falling drop · water: a blue drop from the can · wisp: a curl of cursed energy that
// rises and stretches · crack-dust: low grey dust that rolls along the floor
{
  const base = partSVG;
  partSVG = function (p) {
    const f = (v) => v.toFixed(1), o = Math.max(0, Math.min(1, (p.life - p.age) / (p.life * 0.4)));
    if (p.kind === 'sweat') {
      const a = Math.atan2(p.vy, p.vx) * 57.3 - 90;
      return `<path transform="translate(${f(p.x)},${f(p.y)}) rotate(${f(a)})" d="M0,3.2 Q2.4,0 0,-3.6 Q-2.4,0 0,3.2Z" fill="#cfefff" stroke="#3a6a8a" stroke-width=".8" opacity="${o.toFixed(2)}"/>`;
    }
    if (p.kind === 'water') {
      const tx = p.x - p.vx * 0.02, ty = p.y - p.vy * 0.02;
      return `<path d="M${f(tx)} ${f(ty)} L${f(p.x)} ${f(p.y)}" stroke="#7fd4ff" stroke-width="${f(p.size || 2.2)}" stroke-linecap="round" opacity="${(o * 0.9).toFixed(2)}"/>`;
    }
    if (p.kind === 'wisp') {
      const k = p.age / p.life, w = (p.size || 6) * (0.6 + k), sw = Math.sin(p.age * 6 + p.seed) * 4;
      return `<path d="M${f(p.x)} ${f(p.y + w)} Q${f(p.x + sw - w * 0.8)} ${f(p.y)} ${f(p.x + sw * 0.4)} ${f(p.y - w * 1.4)} Q${f(p.x + sw + w * 0.8)} ${f(p.y)} ${f(p.x)} ${f(p.y + w)}Z" fill="${p.col || '#6a2bd6'}" opacity="${(o * (p.op || 0.75)).toFixed(2)}"/>`;
    }
    if (p.kind === 'dust') return `<ellipse cx="${f(p.x)}" cy="${f(p.y)}" rx="${f(p.size * (1 + p.age * 2))}" ry="${f(p.size * 0.45 * (1 + p.age))}" fill="${p.col || '#9aa2b8'}" opacity="${(o * 0.45).toFixed(2)}"/>`;
    return base(p);
  };
}
// Where a part of a scene avatar is right now (scene coordinates): its current pose solved again.
function avPoint(av, box, which) {
  const st = av && AVS.get(av);
  if (!st || !st.cur || !st.cur.aF) return null;
  const J = solve(st.cur, BODY);
  const p = typeof which === 'function' ? which(J) : J[which] && Array.isArray(J[which][0]) ? J[which][2] : J[which];
  if (!p) return null;
  const q = av.dataset.flip ? [200 - p[0], p[1]] : p;
  return rigToSpot(box, q);
}

/* ================================================================ the gravity chamber */
const GRAV_BOX = { x: 300, y: 58, h: 194 };
// Three combos, one per cycle, two cycles per session: jab-cross-kick, uppercut-elbow-roundhouse,
// and cross-knee-ki blast. Every blow has its anticipation, a hit-stop on contact and a recovery.
const GP = {
  guard: POSES.guard, windup: POSES.windup, coil: POSES.coil, chamber: POSES.chamber,
  jab: Object.assign({}, POSES.strike, { fx: 'thrust' }), cross: POSES.thrust, kick: POSES.kick,
  dip: { tw: 1, t1: 170, t2: 10, n: 2, h: -2, ht: 4, st: -6, aF: [10, 130], aB: [-6, 140], lF: [40, -64], lB: [-36, 10], fF: 14, fB: -16, g: 34, dy: 24, bf: 1 },
  upper: { tw: 1, t1: 192, t2: -12, n: -12, h: -14, ht: 8, st: -10, aF: [118, 44], aB: [-30, 110], lF: [24, -10], lB: [-30, 6], fF: 8, fB: -24, g: 34, dy: 0, bf: 1 },
  elbow: { tw: 1, t1: 168, t2: 10, n: -6, h: -6, ht: 6, st: -8, aF: [100, -150], aB: [-30, 120], lF: [42, -50], lB: [-40, 6], fF: 2, fB: -20, g: 34, dy: 18, bf: 1 },
  spin: { tw: 0.3, t1: 186, t2: -6, n: 4, h: -4, ht: -6, st: 6, aF: [-20, 90], aB: [-60, 70], lF: [20, -30], lB: [-14, 6], fF: 12, fB: -12, g: 34, dy: 10 },
  round: { tw: 1, t1: 214, t2: -14, n: 10, h: -6, ht: 14, st: -8, aF: [40, 60], aB: [-90, 40], lF: [110, -10], lB: [-14, 2], fF: -20, fB: -10, g: 34, dy: 0, fx: 'kick' },
  knee: { tw: 1, t1: 196, t2: -10, n: 6, h: -6, ht: 10, st: -6, aF: [60, 100], aB: [-20, 120], lF: [120, -150], lB: [-6, 2], fF: 30, fB: -10, g: 34, dy: 0, bf: 1 },
  charge: { tw: 0.9, t1: 186, t2: -4, n: 6, h: 4, ht: -4, st: 4, aF: [-30, 120], aB: [-50, 110], lF: [36, -54], lB: [-34, 10], fF: 10, fB: -14, g: 34, dy: 18 },
  palms: { tw: 1, t1: 166, t2: 4, n: -8, h: -6, ht: 6, st: -6, aF: [92, -4], aB: [70, 10], lF: [46, -56], lB: [-44, 6], fF: -4, fB: -24, g: 34, dy: 20 },
};
GP.charge2 = Object.assign({}, GP.charge, { t1: 188, dy: 22, h: 8, expr: 'hurt' });
// hits: [u, where, weight] · where: F fist, K foot, N knee, P palms · weight 0 light, 1 heavy, 2 ki blast
const TRAIN_COMBOS = [
  { keys: [[0, GP.guard], [0.1, GP.windup], [0.18, GP.jab, 'out'], [0.23, GP.jab], [0.32, GP.guard], [0.4, GP.coil], [0.48, GP.cross, 'out'], [0.53, GP.cross], [0.62, GP.guard], [0.72, GP.chamber], [0.8, GP.kick, 'out'], [0.87, GP.kick], [1, GP.guard]],
    hits: [[0.18, 'F', 0], [0.48, 'F', 0], [0.8, 'K', 1]] },
  { keys: [[0, GP.guard], [0.12, GP.dip], [0.22, GP.upper, 'out'], [0.28, GP.upper], [0.38, GP.elbow, 'out'], [0.43, GP.elbow], [0.56, GP.spin], [0.68, GP.round, 'out'], [0.77, GP.round], [1, GP.guard]],
    hits: [[0.22, 'F', 0], [0.38, 'F', 0], [0.68, 'K', 1]] },
  { keys: [[0, GP.guard], [0.1, GP.coil], [0.18, GP.cross, 'out'], [0.23, GP.cross], [0.33, GP.knee, 'out'], [0.38, GP.knee], [0.5, GP.charge], [0.66, GP.charge2], [0.74, GP.palms, 'out'], [0.85, GP.palms], [1, GP.guard]],
    hits: [[0.18, 'F', 0], [0.33, 'N', 0], [0.74, 'P', 2]], charge: [0.46, 0.74] },
];
const GTR = { n: 0, v: null };
POSE_DRIVE.train = (u, t, B, calm) => {
  const v = (u * 2) % 1;
  if (GTR.v != null && v < GTR.v - 0.5) GTR.n++;   // a new combo each cycle
  GTR.v = v;
  const P = keyPose(TRAIN_COMBOS[GTR.n % 3].keys, v), tier = (SPOT.grav && SPOT.grav.tier) || 0;
  // heavier gravity: the body sinks lower and trembles harder
  return Object.assign({}, P, { dy: (P.dy || 0) + tier * 1.4 + (calm ? 0 : Math.sin(t * (9 + tier * 3)) * (0.5 + tier * 0.3)) });
};
DRIVE_SKILL.train = ['gravity', 2.6];
POSES.train = POSE_DRIVE.train(0, 0, BODY, true);
const G_WORD = ['1×', '10×', '50×', '100×', '200×', '400×', '800×'];
const G_COL = ['#7fe0a0', '#a8e070', '#ffe14d', '#ffb347', '#ff7a3a', '#ff4a4a', '#ff4fd8'];
function gravBg(tier) {
  const H = WOOD_GROUND, c = G_COL[tier] || G_COL[0];
  let s = `<defs>${spGrad('gv-wall', ['#1a2032', '#27304a', '#1a2032'])}${spGlow('gv-lamp', '#ffe8b0')}${spGlow('gv-dial', c)}${spGrad('gv-sky', ['#ffb347', '#ffe08a'])}</defs>`;
  s += `<rect width="800" height="320" fill="url(#gv-wall)"/>`;
  // dome ribs and panels
  for (let i = 0; i < 9; i++) { const x = 50 + i * 90; s += `<path d="M${x} 0 Q${x + (i - 4) * 6} 150 ${x} ${H}" stroke="#0f1422" stroke-width="5" fill="none" opacity=".8"/>`; }
  for (let y = 40; y < H; y += 60) s += `<path d="M0 ${y} H800" stroke="#0f1422" stroke-width="2" opacity=".5"/>`;
  // round windows onto the orange sky
  for (const x of [110, 690]) s += `<circle cx="${x}" cy="90" r="34" fill="url(#gv-sky)" stroke="#0a0c11" stroke-width="5"/><circle cx="${x}" cy="90" r="34" fill="none" stroke="#5a6680" stroke-width="2"/><path d="M${x - 22} 104 q22 -14 44 0" fill="#7fbf5a" opacity=".8"/>`;
  // the gravity machine: a column with its dial
  s += `<rect x="560" y="40" width="70" height="${H - 40}" fill="#3a4560" stroke="#0a0c11" stroke-width="3"/><rect x="552" y="${H - 30}" width="86" height="30" fill="#2a3248" stroke="#0a0c11" stroke-width="3"/>`;
  s += `<circle cx="595" cy="120" r="48" fill="url(#gv-dial)" opacity=".35"/><rect x="566" y="96" width="58" height="46" rx="6" fill="#0a0e18" stroke="#0a0c11" stroke-width="3"/>`;
  s += `<text x="595" y="127" text-anchor="middle" class="gv-g" fill="${c}">${G_WORD[tier] || '1×'}</text><text x="595" y="138" text-anchor="middle" class="gv-gs" fill="${c}">GRAVITY</text>`;
  for (let i = 0; i < 4; i++) s += `<circle class="gv-led" style="animation-delay:${i * 0.25}s" cx="${574 + i * 14}" cy="170" r="4" fill="${c}"/>`;
  // the floor: a round training platform; cracks under heavy gravity
  s += `<rect y="${H - 4}" width="800" height="${324 - H}" fill="#202638"/><ellipse cx="${GRAV_BOX.x + 70}" cy="${H + 8}" rx="190" ry="22" fill="#2c3550" stroke="#0a0c11" stroke-width="3"/>`;
  const r = sceneRng(3);
  for (let i = 0; i < tier * 2; i++) { const a = r() * Math.PI, x0 = GRAV_BOX.x + 70; s += `<path d="M${x0} ${H + 8} l${(Math.cos(a) * (40 + r() * 120)).toFixed(0)} ${(Math.sin(a) * 10 + 4).toFixed(0)}" stroke="#0a0c11" stroke-width="2.2" fill="none"/>`; }
  s += `<circle cx="400" cy="40" r="90" fill="url(#gv-lamp)" opacity=".35"/>`;
  return s;
}
function gravHTML() {
  const a = S.action && S.action.skill === 'gravity' ? findAction('gravity', S.action.id) : null;
  const best = SKILLS.gravity.actions.filter((x) => x.level <= skillLv('gravity')).pop();
  const tier = SKILLS.gravity.actions.indexOf(a || best);
  SPOT.grav = { tier };
  const last = SPOT.last_gravity;
  return `<section class="win spot-win" style="--rc:${rc('ki')}">
    <div class="spot sp-grav ${a ? 'on' : ''}" data-spot="gravity" style="--gc:${G_COL[tier] || G_COL[0]}">
      <svg class="spot-bg" viewBox="0 0 800 320" preserveAspectRatio="none" aria-hidden="true">${gravBg(tier)}</svg>
      <div class="gv-press" style="--gt:${tier}"></div>
      <div class="gv-aura" style="left:${((GRAV_BOX.x + 70) / 8).toFixed(2)}%;top:${((GRAV_BOX.y + 100) / 3.2).toFixed(2)}%"><i></i><i></i></div>
      ${spotAvatar(GRAV_BOX, a ? 'train' : '')}
      <svg class="spot-fx" viewBox="0 0 800 320" preserveAspectRatio="none" aria-hidden="true"><defs><filter id="sp-soft" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="2.4"/></filter></defs><g data-spotfx></g><g data-parts></g></svg>
      <div class="spot-pops"></div>
      <div class="spot-hud"><span class="sh-name"><small>Gravity chamber</small><b>${esc(a ? a.name : 'Set the gravity')}</b></span>${last ? `<span class="sh-last">${last}</span>` : '<span class="sh-last" hidden></span>'}</div>
      <div class="sx-meter" data-sxm="grav"><small>Strain</small><span class="sx-bar"><i></i></span><b></b></div>
    </div>
    <div class="spot-bar">${spotStats('gravity')}</div>
  </section>`;
}

/* ================================================================ the farm */
const CROP_LOOK = {
  vital_bean:   { leaf: '#4caf50', fruit: '#8bd650', kind: 'pod' },
  sun_wheat:    { leaf: '#9ab84a', fruit: '#ffd24a', kind: 'grain' },
  moon_rice:    { leaf: '#7aa89a', fruit: '#e6f2ff', kind: 'grain' },
  fire_pepper:  { leaf: '#3f8a3a', fruit: '#ff4a2a', kind: 'pepper' },
  frost_melon:  { leaf: '#4a9a7a', fruit: '#8fe6ff', kind: 'melon' },
  thunder_root: { leaf: '#6a5ab8', fruit: '#b48cff', kind: 'root' },
  star_fruit:   { leaf: '#3a9a5a', fruit: '#ffe14d', kind: 'star' },
};
const plotX = (i, n) => 250 + (i + 0.5) * (540 / Math.max(3, n));
function farmBg() {
  const H = 236;
  let s = `<defs>${spGrad('fm-sky', ['#ffcf6a', '#fff0b0', '#d8f0a0'])}${spGlow('fm-sun', '#fff6c8')}${spGlow('fm-ripe', '#fff6a0')}${spGlow('fm-giant', '#ffe27a')}</defs>`;
  s += `<rect width="800" height="320" fill="url(#fm-sky)"/><circle cx="700" cy="50" r="70" fill="url(#fm-sun)"/><circle cx="700" cy="50" r="20" fill="#fffbe6"/>`;
  s += spClouds(41, 4, 30, 110, '#ffffff', 0.7);
  // the curve of the little planet, its round house and tree
  s += `<path d="M-40 ${H} Q400 ${H - 90} 840 ${H} V320 H-40Z" fill="#7fc04a"/><path d="M-40 ${H + 6} Q400 ${H - 82} 840 ${H + 6}" fill="none" stroke="#5a9a34" stroke-width="4"/>`;
  s += `<path d="M110 ${H - 52} a34 30 0 0 1 68 0 v10 h-68z" fill="#f4efe2" stroke="#0a0c11" stroke-width="2.5"/><rect x="136" y="${H - 52}" width="14" height="10" fill="#5a3a22"/><path d="M178 ${H - 60} v-20" stroke="#0a0c11" stroke-width="2"/>`;
  s += `<rect x="210" y="${H - 96}" width="8" height="46" fill="#7a5130"/><circle cx="214" cy="${H - 104}" r="24" fill="#4a9a3a" stroke="#0a0c11" stroke-width="2.5"/>`;
  s += `<rect y="${H + 10}" width="800" height="${320 - H}" fill="#8a6a44"/><rect y="${H + 10}" width="800" height="4" fill="#6a4a2a"/>`;
  return s;
}
// One plant at its stage (0 seed → 1 ripe). Drawn standing on the bed at (x, y).
function plantSVG(c, x, y, k, ready, giant) {
  const L = CROP_LOOK[c.id] || CROP_LOOK.vital_bean, f = (v) => v.toFixed(1);
  if (k < 0.15) return `<ellipse cx="${x}" cy="${y - 2}" rx="7" ry="3" fill="#5a3a22"/><circle cx="${x}" cy="${y - 4}" r="2.5" fill="#d8c08a"/>`;
  const h = 10 + 34 * Math.min(1, k) * (giant ? 1.4 : 1), sway = ready ? 'class="fm-sway"' : '';
  let s = `<g ${sway} style="transform-origin:${x}px ${y}px"><path d="M${x} ${y} q${f(-2)} ${f(-h * 0.5)} 0 ${f(-h)}" stroke="${L.leaf}" stroke-width="3" fill="none" stroke-linecap="round"/>`;
  const leaves = k < 0.4 ? 1 : k < 0.7 ? 2 : 3;
  for (let i = 0; i < leaves; i++) { const ly = y - h * (0.35 + i * 0.22), dir = i % 2 ? 1 : -1; s += `<path d="M${x} ${f(ly)} q${dir * 10} -6 ${dir * 16} 2 q${-dir * 8} 6 ${-dir * 16} -2Z" fill="${L.leaf}" stroke="#0a0c11" stroke-width="1.2"/>`; }
  const top = [x, y - h];
  if (k >= 0.7) {
    const fr = (ready ? 1 : (k - 0.7) / 0.3) * (giant ? 1.6 : 1), col = L.fruit;
    if (L.kind === 'grain') for (let i = -1; i <= 1; i++) s += `<ellipse cx="${f(top[0] + i * 5)}" cy="${f(top[1] - 4 + Math.abs(i) * 3)}" rx="${f(2.6 * fr)}" ry="${f(7 * fr)}" fill="${col}" stroke="#0a0c11" stroke-width="1.2"/>`;
    else if (L.kind === 'pepper') s += `<path d="M${f(top[0] + 4)} ${f(top[1] + 6)} q${f(10 * fr)} ${f(6 * fr)} ${f(4 * fr)} ${f(20 * fr)} q${f(-8 * fr)} ${f(-6 * fr)} ${f(-4 * fr)} ${f(-20 * fr)}Z" fill="${col}" stroke="#0a0c11" stroke-width="1.4"/>`;
    else if (L.kind === 'melon') s += `<ellipse cx="${f(top[0] + 8)}" cy="${f(y - 8 * fr)}" rx="${f(11 * fr)}" ry="${f(8 * fr)}" fill="${col}" stroke="#0a0c11" stroke-width="1.6"/><path d="M${f(top[0] + 8 - 8 * fr)} ${f(y - 8 * fr)} q${f(8 * fr)} ${f(-5 * fr)} ${f(16 * fr)} 0" stroke="#fff" stroke-width="1.2" fill="none" opacity=".6"/>`;
    else if (L.kind === 'root') s += `<path d="M${f(x - 7 * fr)} ${f(y)} q${f(7 * fr)} ${f(16 * fr)} ${f(14 * fr)} 0Z" fill="${col}" stroke="#0a0c11" stroke-width="1.4"/><path d="M${f(top[0])} ${f(top[1] - 4)} l3 -6 l-1 5 l4 -3" stroke="#ffe14d" stroke-width="1.4" fill="none"/>`;
    else if (L.kind === 'star') { const r = 7 * fr; s += `<path d="M${f(top[0])} ${f(top[1] - r)} l${f(r * 0.3)} ${f(r * 0.7)} l${f(r * 0.7)} ${f(r * 0.1)} l${f(-r * 0.55)} ${f(r * 0.45)} l${f(r * 0.2)} ${f(r * 0.75)} l${f(-r * 0.65)} ${f(-r * 0.4)} l${f(-r * 0.65)} ${f(r * 0.4)} l${f(r * 0.2)} ${f(-r * 0.75)} l${f(-r * 0.55)} ${f(-r * 0.45)} l${f(r * 0.7)} ${f(-r * 0.1)}Z" fill="${col}" stroke="#0a0c11" stroke-width="1.4"/>`; }
    else for (let i = 0; i < 2; i++) s += `<path d="M${f(top[0] + (i ? 6 : -6))} ${f(top[1] + 4)} q${i ? 6 : -6} ${f(8 * fr)} 0 ${f(16 * fr)}" stroke="${col}" stroke-width="${f(5 * fr)}" fill="none" stroke-linecap="round"/>`;
  }
  s += '</g>';
  if (ready) s = `<circle cx="${x}" cy="${f(y - h * 0.6)}" r="${f(h * 0.9)}" fill="url(#${giant ? 'fm-giant' : 'fm-ripe'})" opacity=".55" class="fm-glow"/>` + s;
  return s;
}
function plotsSVG() {
  const P = plots(), y = 262;
  let s = '';
  P.forEach((p, i) => {
    const x = plotX(i, P.length), w = Math.min(64, 500 / Math.max(3, P.length));
    s += `<path d="M${(x - w / 2).toFixed(0)} ${y + 8} l6 -12 h${(w - 12).toFixed(0)} l6 12Z" fill="#5a3a22" stroke="#0a0c11" stroke-width="2"/>`;
    for (let k = -1; k <= 1; k++) s += `<path d="M${(x + k * w * 0.28).toFixed(0)} ${y - 2} v8" stroke="#3a2414" stroke-width="2"/>`;
    if (!p) { s += `<text x="${x}" y="${y + 26}" text-anchor="middle" class="fm-lbl">Empty</text>`; return; }
    const c = CROP_BY[p.crop];
    if (!c) return;
    const T = c.mins * 60, k = Math.min(1, p.t / T), ready = k >= 1;
    const ph = -(((performance.now() / 1000) + i * 0.73) % 3.2).toFixed(2);   // keeps each sway running across redraws
    s += `<g data-plot="${i}" class="fm-plant${ready ? ' ripe' : ''}" style="transform-origin:${x}px ${y - 4}px;--ph:${ph}s"><g transform="translate(${x} ${y - 4}) scale(1.55) translate(${-x} ${-(y - 4)})">${plantSVG(c, x, y - 4, k, ready, false)}</g></g>`;
    s += `<text x="${x}" y="${y + 26}" text-anchor="middle" class="fm-lbl ${ready ? 'ready' : ''}">${ready ? 'Ripe!' : Math.round(k * 100) + '%'}</text>`;
  });
  return s;
}
const plotsSig = () => plots().map((p) => (p ? p.crop + ':' + Math.floor(Math.min(1, p.t / (CROP_BY[p.crop].mins * 60)) * 20) : '-')).join('|');
/* ---------------------------------------------------------------- the farmer */
// The avatar works the field: it walks from plot to plot (facing the way it goes), waters what is
// growing, kneels to check the ripe crops, sows new seeds and pulls the harvest out of the ground.
const FARM_FEET = 252;   // where the farmer stands, just behind the beds
const FARM_H = 170, FARM_SC = FARM_H / 218;
const farmBoxAt = (cx) => ({ x: cx - (100 - 22) * FARM_SC, y: FARM_FEET - (GROUND - 18) * FARM_SC, h: FARM_H });
const FARMER = { cx: 70, box: farmBoxAt(70), job: null, queue: [], pose: '', flip: false, carry: true, k: 0 };
const workX = (i, kind) => plotX(i, plots().length) - (kind === 'water' ? 58 : 40);
const FARM_BASE = { sh: 1, tw: 0.8, t1: 177, t2: 2, n: 0, h: 4, ht: 0, st: 0, aF: [14, -20], aB: [-12, 20], lF: [0, 0], lB: [0, 0], fF: 10, fB: -190, g: 0, dy: 1 };
const FARMK = (o) => Object.assign({}, FARM_BASE, o);
// legs onto two foot targets (x from the pelvis, lift above the floor), knees forward
function farmLegs(P, B, fx, fy, bx, by) {
  const s = B.h, J = solve(P, B), ox = J.pelvis[0] - 100 - (P.dx || 0), oy = J.pelvis[1] - 120 - (P.dy || 0);
  P.lF = ik2(J.hipF, [100 + fx + ox, 120 + 69.5 * s + oy - fy], 36 * s, 35 * s, 1);
  P.lB = ik2(J.hipB, [100 + bx + ox, 120 + 69.5 * s + oy - by], 36 * s, 35 * s, 1);
  return P;
}
POSE_DRIVE.fwalk = (u, t, B, calm) => {
  const a = (t / 0.62) * Math.PI * 2, sn = calm ? 0 : Math.sin(a), cs = calm ? 0 : Math.cos(a), sw = FARMER.carry ? 10 : 20;
  const P = FARMK({ t1: 175, tw: 0.85, dy: 1.5 + Math.abs(sn) * 2.4, h: 2, aF: [8 - sw * sn, FARMER.carry ? -6 : -18], aB: [-8 + 20 * sn, 24], prop: FARMER.carry ? 'can' : undefined, g: FARMER.carry ? 0 : -150 });
  P.t2 += sn * 1.5;
  return farmLegs(P, B, 12 * sn, 7 * Math.max(0, cs), -12 * sn, 7 * Math.max(0, -cs));
};
// still poses of the work (FARMER.k: the job's progress, set by the scene)
const FP = {
  stand: FARMK({ prop: 'can', aF: [12, -10], dy: 1 }),
  pour: FARMK({ prop: 'can', t1: 170, t2: 5, h: 14, n: 4, aF: [78, -26], aB: [-14, 30], g: -78, dy: 3 }),
  pour2: FARMK({ prop: 'can', t1: 168, t2: 6, h: 16, n: 4, aF: [84, -28], aB: [-14, 30], g: -94, dy: 4 }),
  kneel: { sh: 1, tw: 0.8, t1: 166, t2: 10, n: 4, h: 12, ht: 0, st: 0, aF: [30, 30], aB: [-6, 50], lF: [84, -84], lB: [14, -104], fF: 0, fB: -110, g: -150, dy: 0 },
  reach: { sh: 1, tw: 0.85, t1: 158, t2: 14, n: 6, h: 16, ht: 0, st: -4, aF: [44, -8], aB: [-4, 40], lF: [84, -84], lB: [14, -104], fF: 0, fB: -110, g: -150, dy: 2 },
  pull: FARMK({ t1: 190, t2: -8, n: -6, h: -10, tw: 0.75, aF: [150, -20], aB: [-30, 40], g: -150, dy: 0, expr: 'happy' }),
};
FP.pat = Object.assign({}, FP.reach, { aF: [40, -14], h: 18 });
FP.empty = FARMK({ aF: [12, -10], dy: 1 });
POSE_DRIVE.fwork = (u, t, B, calm) => {
  const J = FARMER.job, k = FARMER.k;
  if (!J) return farmLegs(Object.assign({}, FP.stand), B, 12, 0, -10, 0);
  if (J.kind === 'water') {
    const P = keyPose([[0, FP.stand], [0.18, FP.pour, 'out'], [0.5, FP.pour2], [0.82, FP.pour], [1, FP.stand]], k);
    P.g += calm ? 0 : Math.sin(t * 7) * 3;   // the can shakes a little as it pours
    return farmLegs(P, B, 12, 0, -10, 0);
  }
  if (J.kind === 'harvest') return keyPose([[0, FP.kneel], [0.3, FP.reach, 'out'], [0.45, FP.reach], [0.7, FP.pull, 'back'], [0.88, FP.pull], [1, FP.empty]], k);
  if (J.kind === 'plant') return keyPose([[0, FP.kneel], [0.3, FP.reach, 'out'], [0.5, FP.pat], [0.62, FP.reach], [0.74, FP.pat], [1, FP.kneel]], k);
  // tend: kneel by a ripe crop and pat the soil
  return keyPose([[0, FP.kneel], [0.25, FP.reach], [0.45, FP.pat], [0.6, FP.reach], [0.75, FP.pat], [1, FP.kneel]], k);
};
POSES.fwalk = POSE_DRIVE.fwalk(0, 0, BODY, true);
POSES.fwork = FP.stand;
// A watering can held by its top handle; its spout is recorded for the water stream.
PROP_DRAW.can = (hand, a, t, P) => {
  const at = (d, side) => add(add(hand, a, d), a - 90, side);
  if (SPOT_CUR) SPOT_CUR.spout = at(4, 30);
  const body = [at(6, -12), at(24, -12), at(24, 12), at(6, 12)], tip = at(4, 31);
  return `<path d="M${pt(at(14, 9))} L${pt(at(4, 30))}" stroke="${OL}" stroke-width="6" stroke-linecap="round"/><path d="M${pt(at(14, 9))} L${pt(at(4, 30))}" stroke="#4a9ad8" stroke-width="3.4" stroke-linecap="round"/>`
    + `<circle cx="${r1(tip[0])}" cy="${r1(tip[1])}" r="3.4" fill="#2f6fa8" stroke="${OL}" stroke-width="1.6"/>`
    + `<path d="M${pt(at(7, -6))} Q${pt(at(-3, 0))} ${pt(at(7, 6))}" fill="none" stroke="${OL}" stroke-width="4"/>`
    + `<path d="M${body.map(pt).join('L')}Z" fill="#4a9ad8" stroke="${OL}" stroke-width="2.2" stroke-linejoin="round"/><path d="M${pt(at(9, -8))} L${pt(at(21, -8))}" stroke="#bfe6ff" stroke-width="2" opacity=".7"/>`;
};
function farmPlan() {
  const F = FARMER, P = plots();
  if (F.queue.length) return F.queue.shift();
  const grow = [], ripe = [];
  P.forEach((p, i) => { if (!p || !CROP_BY[p.crop]) return; (p.t >= CROP_BY[p.crop].mins * 60 ? ripe : grow).push(i); });
  const r = Math.random();
  if (grow.length && (r < 0.7 || !ripe.length)) return { kind: 'water', i: grow[Math.floor(Math.random() * grow.length)], dur: 2.6 };
  if (ripe.length && r < 0.9) return { kind: 'tend', i: ripe[Math.floor(Math.random() * ripe.length)], dur: 2.2 };
  return { kind: 'rest', x: 50 + Math.random() * 90, dur: 2.5 + Math.random() * 2.5 };
}
function farmFrame(el) {
  const F = FARMER, now = performance.now() / 1000, dt = Math.min(0.05, Math.max(0, now - (F.t || now)));
  F.t = now;
  const sig = plotsSig();
  if (SPOT.farm && SPOT.farm.sig !== sig) {
    // newly sown plots (by hand or by auto-tend) get a sowing visit
    const was = SPOT.farm.sig.split('|'), is = sig.split('|');
    is.forEach((v, i) => {
      const o = was[i] || '-';
      if (v !== '-' && (o === '-' || +v.split(':')[1] < +o.split(':')[1]) && !F.queue.some((j) => j.i === i && j.kind === 'plant')) F.queue.push({ kind: 'plant', i, dur: 1.4 });
    });
    SPOT.farm.sig = sig;
    const g = el.querySelector('[data-plots]');
    if (g) g.innerHTML = plotsSVG();
  }
  const avBox = el.querySelector('.spot-av'), av = avBox && avBox.querySelector('svg.avatar');
  if (!av) return;
  if (F.job && F.job.kind !== 'rest' && F.job.i >= plots().length) F.job = null;
  if (!F.job) { F.job = farmPlan(); F.k = 0; F.walking = true; }
  const J = F.job, tx = J.kind === 'rest' ? J.x : workX(J.i, J.kind);
  let pose;
  if (F.walking && Math.abs(tx - F.cx) > 2) {
    const sp = (J.kind === 'harvest' ? 190 : 135) * (avCalm() ? 3 : 1), d = tx - F.cx;
    F.cx += Math.sign(d) * Math.min(Math.abs(d), sp * dt);
    F.flip = d < 0;
    F.carry = J.kind !== 'harvest' && J.kind !== 'plant';
    pose = 'fwalk';
  } else {
    F.walking = false; F.flip = false;
    F.carry = J.kind === 'water' || J.kind === 'rest';
    const pk = F.k;
    F.k = Math.min(1, F.k + dt / J.dur);
    pose = J.kind === 'rest' ? '' : 'fwork';
    farmJobFx(el, av, J, pk, F.k);
    if (F.k >= 1) F.job = null;
  }
  F.box = farmBoxAt(F.cx);
  avBox.style.left = (F.box.x / 8).toFixed(2) + '%';
  if (!!av.dataset.flip !== F.flip) { if (F.flip) av.dataset.flip = '1'; else delete av.dataset.flip; }
  setPose(av, pose);
  F.pose = pose;
  // the pulled crop, carried up by the hand
  const g = el.querySelector('[data-spotfx]');
  if (g) {
    const H = F.job && F.job.kind === 'harvest' && !F.walking && F.k > 0.4 && F.k < 0.9 ? F.job : null, hp = H && avPoint(av, F.box, 'aF');
    const s = hp ? `<g transform="translate(${hp[0].toFixed(1)} ${(hp[1] + 4).toFixed(1)}) scale(${H.giant ? 1.9 : 1.4})" opacity="${F.k > 0.8 ? ((0.9 - F.k) * 10).toFixed(2) : 1}">${plantSVG(CROP_BY[H.crop], 0, 0, 1, false, H.giant)}</g>` : '';
    if (s || g.firstChild) g.innerHTML = s;
  }
}
const crossK = (a, b, x) => a < x && b >= x;
function farmJobFx(el, av, J, k0, k1) {
  if (J.kind === 'rest') return;
  const r = Math.random, x = plotX(J.i, plots().length), y = 254, plot = () => el.querySelector(`[data-plot="${J.i}"]`);
  if (J.kind === 'water' && k1 > 0.2 && k1 < 0.85) {
    const rig = SPOT_RIG[av.dataset.uid], sp = rig && rig.spout && rigToSpot(FARMER.box, rig.spout);
    if (sp) for (let n = 0; n < 2; n++) partAdd({ kind: 'water', x: sp[0] + (r() - 0.5) * 3, y: sp[1], vx: 30 + r() * 40, vy: 10 + r() * 30, g: 900, life: 0.6, size: 2.2 + r(), floor: y + 2 });
    if (r() < 0.25) partAdd({ kind: 'spray', x: x - 4 + (r() - 0.5) * 16, y: y - 2, vx: (r() - 0.5) * 70, vy: -30 - r() * 50, g: 700, life: 0.4, size: 1.4, col: '#bfe6ff', floor: y + 4 });
  }
  if (J.kind === 'water' && crossK(k0, k1, 0.55)) retrigger(plot(), 'drink');
  if (J.kind === 'tend' && (crossK(k0, k1, 0.45) || crossK(k0, k1, 0.75))) {
    retrigger(plot(), 'drink');
    for (let n = 0; n < 3; n++) partAdd({ kind: 'star', x: x + (r() - 0.5) * 30, y: y - 40 - r() * 30, vx: (r() - 0.5) * 30, vy: -30, g: 0, life: 0.7, size: 3 + r() * 2, vr: 200, col: '#fff6a0' });
  }
  if (J.kind === 'plant' && (crossK(k0, k1, 0.5) || crossK(k0, k1, 0.74))) {
    for (let n = 0; n < 4; n++) partAdd({ kind: 'chip', x: x - 6, y: y - 2, vx: (r() - 0.3) * 100, vy: -60 - r() * 60, vr: 500, w: 3, h: 2.4, col: '#6a4428', life: 0.8, floor: y + 6 });
    if (crossK(k0, k1, 0.74)) { partAdd({ kind: 'dust', x, y: y + 4, vx: 0, vy: 0, g: 0, size: 6, life: 0.6, col: '#b08a5a' }); retrigger(plot(), 'sprout'); }
  }
  if (J.kind === 'harvest') {
    if (crossK(k0, k1, 0.42)) for (let n = 0; n < 8; n++) partAdd({ kind: 'chip', x, y, vx: (r() - 0.5) * 180, vy: -90 - r() * 130, vr: 600, w: 4, h: 3, col: '#5a3a22', life: 1, floor: y + 10 });
    if (crossK(k0, k1, 0.82)) {
      const it = ITEMS[J.crop], hp = avPoint(av, FARMER.box, 'aF') || [x, y - 80];
      spotPop(`<span class="tile-art">${itemIc(J.crop)}</span>`, hp[0], hp[1] - 10, 'dish', 1300);
      spotPop(`<b>+${fmt(J.n)} ${esc(it.name)}</b>`, hp[0], hp[1] - 60, 'tag' + (J.giant ? ' gold' : ''), 1500);
      for (let n = 0; n < (J.giant ? 14 : 6); n++) partAdd({ kind: 'star', x: hp[0], y: hp[1], vx: (r() - 0.5) * 200, vy: -60 - r() * 140, g: 260, life: 0.8, size: 3 + r() * 3, vr: 300, col: J.giant ? '#ffe27a' : '#fff6c8' });
      if (J.giant) sxBurst(el, x, y - 40, true, 'Giant crop!', `${it.name} · ×3 harvest`);
    }
  }
}
function farmHTML() {
  SPOT.farm = { sig: plotsSig() };
  FARMER.t = 0;
  const last = SPOT.last_farming;
  return `<section class="win spot-win" style="--rc:${rc('ki')}">
    <div class="spot sp-farm on" data-spot="farming">
      <svg class="spot-bg" viewBox="0 0 800 320" preserveAspectRatio="none" aria-hidden="true">${farmBg()}<g data-plots>${plotsSVG()}</g></svg>
      ${spotAvatar(FARMER.box, FARMER.pose || '')}
      <svg class="spot-fx" viewBox="0 0 800 320" preserveAspectRatio="none" aria-hidden="true"><defs><filter id="sp-soft" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="2.4"/></filter></defs><g data-spotfx></g><g data-parts></g></svg>
      <div class="spot-pops"></div>
      <div class="spot-hud"><span class="sh-name"><small>Kaio fields</small><b>${plots().filter(Boolean).length} / ${plots().length} plots growing</b></span>${last ? `<span class="sh-last">${last}</span>` : '<span class="sh-last" hidden></span>'}</div>
    </div>
  </section>`;
}
UIX.realmScene.push((realm, skill) => (skill === 'gravity' ? gravHTML() : skill === 'farming' ? farmHTML() : ''));
{
  const base = spotStats;
  spotStats = function (skill) {
    if (skill === 'gravity' && !S.action) return `<div class="spot-idle">${ui('play')}<span>Pick a gravity session to start training.</span></div>`;
    return base(skill);
  };
}

/* ================================================================ per frame */
UPD.push(() => {
  const el = spotNow();
  if (!el) return;
  if (el.dataset.spot === 'gravity') {
    const k = actFrac('gravity'), av = el.querySelector('.spot-av svg.avatar');
    el.classList.toggle('on', k >= 0);
    setPose(av, k >= 0 ? 'train' : '');
    const K = KI(), G = SPOT.grav || { tier: 0 }, r = Math.random;
    meterSet(el, 'grav', K.strain / 100, `${Math.floor(K.strain)}% · Limit ${K.limit}`, false);
    if (k < 0) { G.v = null; el.classList.remove('gv-charging'); return; }
    // dust falls hard; heavier gravity, more dust
    if (r() < 0.25 + G.tier * 0.06) partAdd({ kind: 'spray', x: r() * 800, y: -4, vx: 0, vy: 200 + G.tier * 60, g: 1200, life: 0.5, size: 1 + r(), col: '#c8d0e0', floor: WOOD_GROUND + 6 });
    // sweat flies off the head; ki motes rise around the body
    if (r() < 0.03 + G.tier * 0.008) {
      const h = avPoint(av, GRAV_BOX, (J) => add(J.head, J.neckA + (r() < 0.5 ? 60 : -60), J.headR));
      if (h) partAdd({ kind: 'sweat', x: h[0], y: h[1], vx: (r() - 0.5) * 90, vy: -30 - r() * 40, g: 700 + G.tier * 150, life: 0.7, floor: WOOD_GROUND + 6 });
    }
    if (r() < 0.12) partAdd({ kind: 'star', x: GRAV_BOX.x + 70 + (r() - 0.5) * 90, y: GRAV_BOX.y + 120 + r() * 70, vx: (r() - 0.5) * 10, vy: -50 - r() * 50, g: 0, life: 0.9, size: 2 + r() * 2, vr: 200, col: G_COL[G.tier] || G_COL[0] });
    const v = (driveU('train', performance.now() / 1000) * 2) % 1, prev = G.v, C = TRAIN_COMBOS[GTR.n % 3];
    G.v = v;
    // the ki blast: energy is drawn into the hands while it charges
    const charging = !!C.charge && v >= C.charge[0] && v < C.charge[1];
    el.classList.toggle('gv-charging', charging);
    if (charging && r() < 0.5) {
      const hp = avPoint(av, GRAV_BOX, 'aF');
      if (hp) { const a = r() * Math.PI * 2, d = 40 + r() * 30; partAdd({ kind: 'star', x: hp[0] + Math.cos(a) * d, y: hp[1] + Math.sin(a) * d, vx: -Math.cos(a) * d * 2.6, vy: -Math.sin(a) * d * 2.6, g: 0, life: 0.38, size: 2.5 + r() * 2, vr: 300, col: r() < 0.5 ? '#fff6c8' : G_COL[G.tier] || G_COL[0] }); }
    }
    if (prev != null && v >= prev && v - prev < 0.3) for (const [h, where, w] of C.hits) if (prev < h && v >= h) gravHit(el, av, where, w, G.tier);
  } else if (el.dataset.spot === 'farming') {
    farmFrame(el);
  }
});
// One blow lands: the flash and shock ring where it connects; heavy blows crack the floor,
// throw up debris and dust, and (under strong gravity) shake the chamber.
function gravHit(el, av, where, w, tier) {
  const r = Math.random, col = G_COL[tier] || G_COL[0];
  const p = avPoint(av, GRAV_BOX, (J) => (where === 'K' ? J.lF[3] : where === 'N' ? J.lF[1] : where === 'P' ? add(J.aF[2], J.foreA.aF, 10) : add(J.aF[2], J.foreA.aF, 6)));
  if (!p) return;
  const [x, y] = p, floor = WOOD_GROUND + 6, cx = GRAV_BOX.x + 64;
  retrigger(el.querySelector('.gv-aura'), 'pulse');
  partAdd({ kind: 'flash', x, y, life: w ? 0.2 : 0.14, g: 0 });
  spotPop('', x, y, 'gv-wave' + (w ? ' big' : ''), 600);
  for (let i = 0; i < 2 + w * 2; i++) partAdd({ kind: 'spray', x: cx + (r() - 0.5) * 50, y: floor - 2, vx: (r() - 0.5) * 120, vy: -40 - r() * 60, g: 900, life: 0.5, size: 1.5, col: '#8a92a8', floor: floor + 2 });
  if (w === 2) {   // the ki blast: a beam out of the palms
    spotPop('', x, y, 'gv-beam', 700).style.setProperty('--gc', col);
    for (let i = 0; i < 10; i++) partAdd({ kind: 'star', x: x + r() * 60, y: y + (r() - 0.5) * 16, vx: 200 + r() * 260, vy: (r() - 0.5) * 60, g: 0, life: 0.5, size: 3 + r() * 3, vr: 300, col: r() < 0.5 ? '#fff6c8' : col });
  }
  if (!w) return;
  spotPop(crackSVG(), cx + 6, floor + 2, 'gv-crack', 1500);
  for (let i = 0; i < 5 + tier; i++) partAdd({ kind: 'chip', x: cx + (r() - 0.5) * 40, y: floor, vx: (r() - 0.5) * 240, vy: -120 - r() * 160, vr: (r() - 0.5) * 900, w: 3 + r() * 4, h: 2 + r() * 3, col: '#3a4462', life: 1.1, floor: floor + 4 + r() * 8 });
  for (const s of [-1, 1]) partAdd({ kind: 'dust', x: cx + s * 30, y: floor, vx: s * (60 + r() * 40), vy: -6, g: 0, size: 8 + tier, life: 0.8 });
  if (tier >= 2) retrigger(el, 'thud');
}
// A star of jagged cracks, drawn in a 120 x 30 box (the CSS reveals it from the centre).
function crackSVG() {
  const r = Math.random;
  let d = '';
  for (let i = 0; i < 7; i++) {
    const a = (i / 7) * Math.PI + r() * 0.3, len = 26 + r() * 30;
    let x = 60, y = 14;
    d += `M${x} ${y}`;
    for (let k = 1; k <= 3; k++) { x = 60 + Math.cos(a) * len * k / 3 + (r() - 0.5) * 6; y = 14 + Math.sin(a) * len * k / 9 + (r() - 0.5) * 3; d += ` L${x.toFixed(1)} ${y.toFixed(1)}`; }
  }
  return `<svg viewBox="0 0 120 30"><path d="${d}" fill="none" stroke="#06080e" stroke-width="2.2" stroke-linejoin="round"/><path d="${d}" fill="none" stroke="#ffe6a8" stroke-width=".8" opacity=".55" transform="translate(0 1)"/></svg>`;
}

/* ================================================================ outcomes */
on('action', (d) => {
  if (d.skill !== 'gravity') return;
  const id = Object.keys(d.act.out || {})[0], it = id && ITEMS[id];
  if (!it) return;
  setLast('gravity', `<small>Last session</small><b>${esc(it.name)}</b><em>${fmt(familyCount(id))} owned</em>`);
  const el = spotNow();
  if (!el || el.dataset.spot !== 'gravity') return;
  spotPop(`<span class="tile-art">${itemIc(id)}</span>`, GRAV_BOX.x + 70, GRAV_BOX.y + 10, 'dish', 1300);
});
on('breakthrough', (d) => {
  toast(`Breakthrough! Limit ${d.limit}: +${(d.limit * LIMIT_FX * 100).toFixed(1)}% damage and max HP for good.`, 'rare');
  const el = spotNow();
  if (!el || el.dataset.spot !== 'gravity') { burst('Breakthrough', `Limit ${d.limit} · +${(d.limit * LIMIT_FX * 100).toFixed(1)}% damage & HP`, ic('skill', 'gravity'), '#ffd75e'); return; }
  retrigger(el.querySelector('.gv-aura'), 'flare');
  sxBurst(el, GRAV_BOX.x + 70, GRAV_BOX.y + 100, true, 'Breakthrough!', `Limit ${d.limit} · +${(d.limit * LIMIT_FX * 100).toFixed(1)}% damage & HP`);
  const r = Math.random;
  for (let i = 0; i < 20; i++) partAdd({ kind: 'star', x: GRAV_BOX.x + 70, y: GRAV_BOX.y + 100, vx: (r() - 0.5) * 340, vy: -80 - r() * 240, g: 200, life: 1.2, size: 4 + r() * 4, vr: 300, col: r() < 0.5 ? '#ffe27a' : '#fff6c8' });
});
on('quality', (d) => {
  if (d.skill !== 'gravity' || d.q !== 's') return;
  const el = spotNow();
  if (el && el.dataset.spot === 'gravity') { retrigger(el.querySelector('.gv-aura'), 'flare'); sxBurst(el, GRAV_BOX.x + 70, GRAV_BOX.y + 100, true, 'Golden Aura!', ITEMS[d.item].name); }
});
let HARVEST_PLOT = null;
{
  const base = harvest;
  harvest = function (i) { HARVEST_PLOT = i; try { return base(i); } finally { HARVEST_PLOT = null; } };
}
const farmAt = (i) => [plotX(i, plots().length), 230];
on('harvest', (d) => {
  const it = ITEMS[d.crop];
  setLast('farming', `<small>Last harvest</small><b>${esc(it.name)} ×${fmt(d.n)}</b><em>${fmt(familyCount(d.crop))} owned</em>`);
  const el = spotNow();
  if (!el || el.dataset.spot !== 'farming' || HARVEST_PLOT == null) return;
  const F = FARMER, job = { kind: 'harvest', i: HARVEST_PLOT, crop: d.crop, n: d.n, dur: 1.5 };
  if (F.job && F.job.kind === 'harvest') { if (F.queue.length < 8) F.queue.unshift(job); }
  else { F.job = job; F.k = 0; F.walking = true; }
});
on('giant', (d) => {
  const el = spotNow(), it = ITEMS[d.crop];
  if (!el || el.dataset.spot !== 'farming') { burst('Giant crop!', `${it.name} · ×3 harvest · Shiny Log`, itemIc(d.crop), '#ffd75e'); return; }
  const F = FARMER, job = [F.job].concat(F.queue).find((j) => j && j.kind === 'harvest' && j.i === d.plot);
  if (job) { job.giant = true; job.n = d.n; }
  else { const [x, y] = farmAt(d.plot); sxBurst(el, x, y - 30, true, 'Giant crop!', `${it.name} · ×3 harvest`); }
});
on('mutation', (d) => {
  toast(`Mutation! Your ${ITEMS[d.from].name} left a ${ITEMS[d.seed].name}.`, 'rare');
  const el = spotNow();
  if (!el || el.dataset.spot !== 'farming') return;
  const [x, y] = farmAt(d.plot);
  spotPop(`<span class="tile-art">${itemIc(d.seed)}</span>`, x + 26, y - 30, 'dish', 1600);
  spotPop(`${ui('star')}Mutation!`, x, y - 96, 'tag gold', 1800);
});
