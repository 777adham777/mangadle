'use strict';
/* ==========================================================================
   TRI-REALM IDLE — Kaio Planet: the gravity chamber and the farm (kaio.js is the engine)
   Gravity Training: your avatar shadow-boxes under crushing gravity in a capsule chamber.
   The dial shows the gravity, dust falls like rain, every blow sends out a shockwave and
   the floor cracks under heavier sessions. The strain meter fills; a breakthrough flares
   a golden aura.
   Farming: the field on the little planet. Every plot is drawn with its crop at its real
   growth stage (seed, sprout, leaves, bud, ripe); ripe crops sway and glow. Harvests pop
   out of their plot; a Giant crop bursts with light; a mutation drops a new seed.
   Loaded after soul-ui.js.
   ========================================================================== */

/* ================================================================ the gravity chamber */
const GRAV_BOX = { x: 300, y: 58, h: 194 };
const TRAIN_KEYS = [[0, POSES.guard], [0.12, POSES.windup], [0.22, POSES.strike, 'out'], [0.34, POSES.guard], [0.46, POSES.coil], [0.54, POSES.thrust, 'out'],
  [0.66, POSES.guard], [0.78, POSES.chamber], [0.86, POSES.kick, 'out'], [1, POSES.guard]];
const TRAIN_HITS = [0.22, 0.54, 0.86];
// Two combos per session.
POSE_DRIVE.train = (u, t, B, calm) => {
  const v = (u * 2) % 1, P = keyPose(TRAIN_KEYS, v);
  return Object.assign({}, P, { dy: (P.dy || 0) + (calm ? 0 : Math.sin(t * 9) * 0.6) });
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
      <div class="gv-aura" style="left:${((GRAV_BOX.x + 70) / 8).toFixed(2)}%;top:${((GRAV_BOX.y + 100) / 3.2).toFixed(2)}%"></div>
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
const FARM_BOX = { x: 20, y: 70, h: 180 };
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
    s += `<g transform="translate(${x} ${y - 4}) scale(1.55) translate(${-x} ${-(y - 4)})">${plantSVG(c, x, y - 4, k, ready, false)}</g>`;
    s += `<text x="${x}" y="${y + 26}" text-anchor="middle" class="fm-lbl ${ready ? 'ready' : ''}">${ready ? 'Ripe!' : Math.round(k * 100) + '%'}</text>`;
  });
  return s;
}
const plotsSig = () => plots().map((p) => (p ? p.crop + ':' + Math.floor(Math.min(1, p.t / (CROP_BY[p.crop].mins * 60)) * 20) : '-')).join('|');
function farmHTML() {
  SPOT.farm = { sig: plotsSig() };
  const last = SPOT.last_farming;
  return `<section class="win spot-win" style="--rc:${rc('ki')}">
    <div class="spot sp-farm on" data-spot="farming">
      <svg class="spot-bg" viewBox="0 0 800 320" preserveAspectRatio="none" aria-hidden="true">${farmBg()}<g data-plots>${plotsSVG()}</g></svg>
      ${spotAvatar(FARM_BOX, '')}
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
    if (k < 0) { G.v = null; return; }
    // dust falls hard; heavier gravity, more dust
    if (r() < 0.25 + G.tier * 0.06) partAdd({ kind: 'spray', x: r() * 800, y: -4, vx: 0, vy: 200 + G.tier * 60, g: 1200, life: 0.5, size: 1 + r(), col: '#c8d0e0', floor: WOOD_GROUND + 6 });
    const v = (driveU('train', performance.now() / 1000) * 2) % 1, prev = G.v;
    G.v = v;
    if (prev != null) for (const h of TRAIN_HITS) if (prev < h && v >= h && v - prev < 0.3) {
      const x = GRAV_BOX.x + GRAV_BOX.h * (h > 0.8 ? 0.62 : 0.58), y = GRAV_BOX.y + GRAV_BOX.h * (h > 0.8 ? 0.42 : 0.36);
      spotPop('', x, y, 'gv-wave', 600);
      partAdd({ kind: 'flash', x, y, life: 0.14, g: 0 });
      if (G.tier >= 3) retrigger(el, 'thud');
      for (let i = 0; i < 4; i++) partAdd({ kind: 'spray', x: GRAV_BOX.x + 60 + (r() - 0.5) * 60, y: WOOD_GROUND + 4, vx: (r() - 0.5) * 120, vy: -40 - r() * 60, g: 900, life: 0.5, size: 1.5, col: '#8a92a8', floor: WOOD_GROUND + 8 });
    }
  } else if (el.dataset.spot === 'farming') {
    const sig = plotsSig();
    if (SPOT.farm && SPOT.farm.sig !== sig) { SPOT.farm.sig = sig; const g = el.querySelector('[data-plots]'); if (g) g.innerHTML = plotsSVG(); }
  }
});

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
  const [x, y] = farmAt(HARVEST_PLOT);
  spotPop(`<span class="tile-art">${itemIc(d.crop)}</span>`, x, y - 10, 'dish', 1300);
  spotPop(`<b>+${fmt(d.n)} ${esc(it.name)}</b>`, x, y - 60, 'tag', 1500);
  for (let i = 0; i < 6; i++) partAdd({ kind: 'chip', x, y: y + 20, vx: (Math.random() - 0.5) * 160, vy: -80 - Math.random() * 120, vr: 600, w: 4, h: 3, col: '#5a3a22', life: 1, floor: 268 });
});
on('giant', (d) => {
  const el = spotNow(), it = ITEMS[d.crop];
  if (!el || el.dataset.spot !== 'farming') { burst('Giant crop!', `${it.name} · ×3 harvest · Shiny Log`, itemIc(d.crop), '#ffd75e'); return; }
  const [x, y] = farmAt(d.plot);
  sxBurst(el, x, y - 30, true, 'Giant crop!', `${it.name} · ×3 harvest`);
});
on('mutation', (d) => {
  toast(`Mutation! Your ${ITEMS[d.from].name} left a ${ITEMS[d.seed].name}.`, 'rare');
  const el = spotNow();
  if (!el || el.dataset.spot !== 'farming') return;
  const [x, y] = farmAt(d.plot);
  spotPop(`<span class="tile-art">${itemIc(d.seed)}</span>`, x + 26, y - 30, 'dish', 1600);
  spotPop(`${ui('star')}Mutation!`, x, y - 96, 'tag gold', 1800);
});
