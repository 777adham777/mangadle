'use strict';
/* ==========================================================================
   TRI-REALM IDLE — Echo Quarter: the dig, the workshop and the Echo (echo.js is the engine)
   Archaeology: your avatar picks at a cliff of coloured strata; beside it, the site's
   excavation grid: every dig opens a square and shows what it held.
   Restoration: your avatar taps at an artifact on its pedestal with a mallet; its pieces
   drift together as the work goes on. A Flawless restoration bursts with light.
   Echo Bonding: your avatar meditates and its Echo stands behind it, a ghost that grows
   more solid with every bond level; resonance makes it blaze.
   Loaded after hunt-ui.js.
   ========================================================================== */

/* ================================================================ the dig */
const STRATA = ['#c9a46a', '#a8794a', '#8a5a3a', '#6a4a3a', '#4a3a3a'];
function digBg(hit) {
  const H = WOOD_GROUND, x0 = Math.round(hit[0] - 4);
  let s = `<defs>${spGrad('dg-sky', ['#f2b8ff', '#ffe0c8', '#fff4e0'])}${spGlow('dg-sun', '#fff6c8')}</defs>`;
  s += `<rect width="800" height="320" fill="url(#dg-sky)"/><circle cx="120" cy="60" r="60" fill="url(#dg-sun)"/>`;
  // ruined pillars far away
  for (const [x, h] of [[40, 120], [90, 90], [190, 140], [260, 70]]) s += `<rect x="${x}" y="${H - h}" width="22" height="${h}" fill="#e8e0d4" opacity=".7"/><rect x="${x - 4}" y="${H - h - 8}" width="30" height="8" fill="#d8cebe" opacity=".7"/>`;
  s += `<rect y="${H - 6}" width="800" height="${326 - H}" fill="#b8925a"/>`;
  // the cliff of strata from the hit to the right edge
  const face = `M${x0} -10 L${x0 + 20} 60 L${x0 + 4} 140 L${x0 + 16} 200 L${x0 - 2} ${H} H800 V-10Z`;
  s += `<clipPath id="dg-clip"><path d="${face}"/></clipPath><g clip-path="url(#dg-clip)" class="mn-rock">`;
  STRATA.forEach((c, i) => { const y = -10 + i * 56; s += `<path d="M${x0 - 20} ${y} Q${x0 + 200} ${y + 10} 820 ${y - 6} V${y + 60} Q${x0 + 200} ${y + 66} ${x0 - 20} ${y + 56}Z" fill="${c}"/>`; });
  const r = sceneRng(13);
  for (let i = 0; i < 16; i++) { const x = x0 + 30 + r() * 400, y = r() * (H - 20); s += `<ellipse cx="${x.toFixed(0)}" cy="${y.toFixed(0)}" rx="${(3 + r() * 6).toFixed(1)}" ry="${(2 + r() * 3).toFixed(1)}" fill="#f2ead8" opacity=".55"/>`; }
  s += `</g><path d="${face}" fill="none" stroke="#0a0c11" stroke-width="3"/>`;
  // tools and a bucket
  s += `<path d="M30 ${H + 20} l26 -8 l4 10 l-26 8Z" fill="#7a5a3a" stroke="#0a0c11" stroke-width="2"/><path d="M70 ${H + 30} l4 -26 h28 l4 26z" fill="#8a9aa8" stroke="#0a0c11" stroke-width="2"/>`;
  return s;
}
const DIG_IC = { cache: 'chest', relic: 'gem', shard: 'rare', intact: 'shiny' };
function gridHTML(id) {
  const G = gridOf(id);
  return `<div class="dg-grid" data-dgrid="${id}"><small>Excavation · ${G.n} / ${DIG_N}</small><div class="dg-cells">${G.cells.map((w, i) => `<i class="${G.open[i] ? 'o ' + (w || 'dirt') : ''}">${G.open[i] && w ? ui(DIG_IC[w]) : ''}</i>`).join('')}</div></div>`;
}
function digHTML() {
  const a = S.action && S.action.skill === 'archaeology' ? findAction('archaeology', S.action.id) : null;
  const best = SKILLS.archaeology.actions.filter((x) => x.level <= skillLv('archaeology')).pop() || SKILLS.archaeology.actions[0];
  const site = (a || best).id, hits = [toolHitAt('mine', 0), toolHitAt('mine', 1)], hit = [Math.min(hits[0][0], hits[1][0]), hits[0][1]];
  SPOT.dig = { look: site, hit, hits };
  const last = SPOT.last_archaeology;
  return `<section class="win spot-win" style="--rc:${rc('echo')}">
    <div class="spot sp-dig ${a ? 'on' : ''}" data-spot="archaeology">
      <svg class="spot-bg" viewBox="0 0 800 320" preserveAspectRatio="none" aria-hidden="true">${digBg(hit)}</svg>
      ${spotAvatar(WOOD_BOX, a ? 'mine' : '')}
      <svg class="spot-fx" viewBox="0 0 800 320" preserveAspectRatio="none" aria-hidden="true"><defs><filter id="sp-soft" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="2.4"/></filter></defs><g data-spotfx></g><g data-parts></g></svg>
      <div class="spot-pops"></div>
      <div class="spot-hud"><span class="sh-name"><small>Dig site</small><b>${esc((a || best).name.replace('Dig: ', ''))}</b></span>${last ? `<span class="sh-last">${last}</span>` : '<span class="sh-last" hidden></span>'}</div>
      ${gridHTML(site)}
    </div>
    <div class="spot-bar">${spotStats('archaeology')}</div>
  </section>`;
}
function digImpact(el, W, i) {
  const [hx, hy] = W.hits[i], r = Math.random;
  retrigger(el.querySelector('.mn-rock'), 'hit');
  partAdd({ kind: 'flash', x: hx + 2, y: hy, life: 0.14, g: 0 });
  for (let k = 0; k < 8; k++) partAdd({ kind: 'chip', x: hx + 2, y: hy + r() * 6 - 3, vx: -40 - r() * 180, vy: -80 - r() * 200, vr: (r() - 0.5) * 1000, w: 3 + r() * 5, h: 2 + r() * 3, col: STRATA[Math.floor(r() * STRATA.length)], life: 1.2, floor: WOOD_GROUND + 10 + r() * 30 });
  for (let k = 0; k < 3; k++) partAdd({ kind: 'puff', x: hx, y: hy, vx: -20 - r() * 30, vy: -10, g: 0, size: 4, life: 0.8 });
}

/* ================================================================ the workshop */
PROP_DRAW.mallet = (hand, a, t, P) => {
  const at = (d, side) => add(add(hand, a, d), a - 90, side);
  if (SPOT_CUR) SPOT_CUR.axe = at(36, 10);
  const q = [at(30, -6), at(42, -6), at(42, 10), at(30, 10)];
  return part(taper([add(hand, a, -8), add(hand, a, 40)], [3, 2.6]), '#a8743f', 2) + `<path d="M${q.map(pt).join('L')}Z" fill="#c9a46a" stroke="${OL}" stroke-width="2" stroke-linejoin="round"/>`;
};
POSE_DRIVE.restore = (u, t, B, calm) => Object.assign(POSE_DRIVE.wood(u, t, B, calm), { prop: 'mallet' });
DRIVE_SKILL.restore = ['restoration', 3];
POSES.restore = POSE_DRIVE.restore(0.02, 0, BODY, true);
function shopBg(hit) {
  const H = WOOD_GROUND, [hx, hy] = hit, top = Math.round(hy + 8);
  let s = `<defs>${spGrad('rs-wall', ['#2a2438', '#3a3050', '#2a2438'])}${spGlow('rs-lamp', '#fff0c8')}${spGlow('rs-flaw', '#ffe27a')}</defs>`;
  s += `<rect width="800" height="320" fill="url(#rs-wall)"/>`;
  // museum shelves with restored pieces
  for (const y of [70, 140]) { s += `<rect x="430" y="${y}" width="340" height="8" fill="#6a4a3a" stroke="#0a0c11" stroke-width="2"/>`; for (let i = 0; i < 5; i++) s += `<path d="M${450 + i * 66} ${y} q-8 -22 4 -34 q12 -6 18 6 q6 14 -4 28Z" fill="${['#e8d4a8', '#9fd8c8', '#d8a8c8', '#c8c8e8', '#e8c8a0'][i]}" stroke="#0a0c11" stroke-width="1.6" opacity=".9"/>`; }
  s += `<circle cx="300" cy="40" r="140" fill="url(#rs-lamp)" opacity=".45"/><path d="M300 0 v26" stroke="#0a0c11" stroke-width="2"/><path d="M288 26 h24 l-6 10 h-12z" fill="#e8c86a" stroke="#0a0c11" stroke-width="2"/>`;
  s += `<rect y="${H - 2}" width="800" height="${322 - H}" fill="#2a2030"/><rect y="${H - 2}" width="800" height="3" fill="#4a3a50"/>`;
  // the pedestal and its velvet cloth
  const px = hx + 20;
  s += `<rect x="${px - 26}" y="${top + 16}" width="52" height="${H - top - 14}" fill="#e8e0d4" stroke="#0a0c11" stroke-width="2.5"/><rect x="${px - 34}" y="${top + 8}" width="68" height="10" fill="#d8cebe" stroke="#0a0c11" stroke-width="2.5"/>`;
  s += `<path d="M${px - 30} ${top + 8} q30 -8 60 0 v6 h-60z" fill="#8a2a4a"/>`;
  return s;
}
// The artifact: its pieces drift together with the work (k: 0 scattered → 1 whole).
function artifactSVG(W, k) {
  const [hx, hy] = W.hit, px = hx + 20, base = hy + 6, e = 1 - Math.pow(1 - k, 2), sp = (1 - e) * 26;
  const col = W.col || '#e8d4a8', pieces = [[-8, -26, -1, -1], [6, -30, 1, -1], [-10, -12, -1, 0.4], [8, -10, 1, 0.6], [0, -40, 0, -1.4]];
  let s = `<circle cx="${px}" cy="${base - 22}" r="${(22 + e * 10).toFixed(1)}" fill="url(#rs-lamp)" opacity="${(0.2 + e * 0.3).toFixed(2)}"/>`;
  for (const [x, y, dx, dy] of pieces) s += `<path transform="translate(${(px + x + dx * sp).toFixed(1)} ${(base + y + dy * sp).toFixed(1)}) rotate(${((1 - e) * dx * 40).toFixed(0)})" d="M-7 -7 L7 -6 L6 7 L-6 6Z" fill="${col}" stroke="#0a0c11" stroke-width="1.5"/>`;
  return s;
}
function shopHTML() {
  const a = S.action && S.action.skill === 'restoration' ? findAction('restoration', S.action.id) : null;
  const hits = [toolHitAt('restore', 0), toolHitAt('restore', 1)], hit = [Math.min(hits[0][0], hits[1][0]), Math.max(hits[0][1], hits[1][1])];
  SPOT.shop = { hit, hits, col: a && ARTIFACTS[Object.keys(a.out)[0]] ? '#9fd8c8' : '#e8d4a8' };
  const last = SPOT.last_restoration;
  return `<section class="win spot-win" style="--rc:${rc('echo')}">
    <div class="spot sp-shop ${a ? 'on' : ''}" data-spot="restoration">
      <svg class="spot-bg" viewBox="0 0 800 320" preserveAspectRatio="none" aria-hidden="true">${shopBg(hit)}</svg>
      ${spotAvatar(WOOD_BOX, a ? 'restore' : '')}
      <svg class="spot-fx" viewBox="0 0 800 320" preserveAspectRatio="none" aria-hidden="true"><defs><filter id="sp-soft" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="2.4"/></filter></defs><g data-spotfx></g><g data-parts></g></svg>
      <div class="spot-pops"></div>
      <div class="spot-hud"><span class="sh-name"><small>Museum workshop</small><b>${esc(a ? a.name : 'Pick a piece to restore')}</b></span>${last ? `<span class="sh-last">${last}</span>` : '<span class="sh-last" hidden></span>'}</div>
    </div>
    <div class="spot-bar">${spotStats('restoration')}</div>
  </section>`;
}

/* ================================================================ the Echo */
const ECHO_COL = { gilded_hand: '#ffd75e', rewind: '#7df9ff', star_fist: '#ff7a5a', silent_tide: '#5ab8ff', paper_moon: '#e8e4ff', iron_bloom: '#9aff8a' };
function echoFigure() {
  if (!echoOn()) return '';
  const c = ECHO_COL[S.echo.id] || '#c48cff', solid = 0.3 + 0.7 * Math.min(1, bondLv() / 40);
  let art = '';
  try { art = avatarSVG({ aura: 'none', back: 'none', hat: 'none', ink: c }, { still: true, pose: 'heroic' }); } catch (e) { art = ''; }
  return `<div class="ec-ghost" style="--ec:${c};--solid:${solid.toFixed(2)}">${art}</div>`;
}
const BOND_BOX = { x: 330, y: 70, h: 180 };
function bondBg() {
  let s = `<defs>${spGrad('ec-sky', ['#1a0f2a', '#3a1f4a', '#5a2a5a'])}${spGlow('ec-glow', '#f08cff')}</defs><rect width="800" height="320" fill="url(#ec-sky)"/>`;
  s += spStars(61, 60, 200);
  for (const [x, h] of [[60, 160], [140, 200], [640, 190], [720, 150]]) s += `<rect x="${x}" y="${250 - h}" width="34" height="${h}" fill="#2a1a3a" stroke="#0a0c11" stroke-width="2"/><rect x="${x - 6}" y="${242 - h}" width="46" height="10" fill="#3a2a4a"/>`;
  s += `<circle cx="400" cy="170" r="200" fill="url(#ec-glow)" opacity=".25" class="ec-pulse"/><rect y="250" width="800" height="70" fill="#1a1024"/>`;
  s += `<ellipse cx="400" cy="262" rx="160" ry="16" fill="none" stroke="#f08cff" stroke-width="2" opacity=".6"/>`;
  return s;
}
function bondHTML() {
  const a = S.action && S.action.skill === 'bonding' ? findAction('bonding', S.action.id) : null, E = S.echo || {};
  return `<section class="win spot-win" style="--rc:${rc('echo')}">
    <div class="spot sp-bond ${a ? 'on' : ''} ${E.rush > 0 ? 'rush' : ''}" data-spot="bonding">
      <svg class="spot-bg" viewBox="0 0 800 320" preserveAspectRatio="none" aria-hidden="true">${bondBg()}</svg>
      <div class="ec-slot" style="left:${((BOND_BOX.x - 40) / 8).toFixed(2)}%;top:${((BOND_BOX.y - 40) / 3.2).toFixed(2)}%">${echoFigure()}</div>
      ${spotAvatar(BOND_BOX, 'meditate')}
      <svg class="spot-fx" viewBox="0 0 800 320" preserveAspectRatio="none" aria-hidden="true"><defs><filter id="sp-soft" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="2.4"/></filter></defs><g data-spotfx></g><g data-parts></g></svg>
      <div class="spot-pops"></div>
      <div class="spot-hud"><span class="sh-name"><small>${echoOn() ? esc(ECHO_BY[E.id].name) : 'No Echo yet'}</small><b>${echoOn() ? `Bond level ${bondLv()}` : 'Awaken an Echo with 3 shards'}</b></span></div>
      <div class="sx-meter" data-sxm="bond"><small>Resonance</small><span class="sx-bar"><i></i></span><b></b></div>
    </div>
    <div class="spot-bar">${spotStats('bonding')}</div>
  </section>`;
}
UIX.realmScene.push((realm, skill) => (skill === 'archaeology' ? digHTML() : skill === 'restoration' ? shopHTML() : skill === 'bonding' ? bondHTML() : ''));
{
  const base = spotStats;
  spotStats = function (skill) {
    if (!S.action && skill === 'archaeology') return `<div class="spot-idle">${ui('play')}<span>Pick a dig site. Every dig opens a square of its grid.</span></div>`;
    if (!S.action && skill === 'restoration') return `<div class="spot-idle">${ui('play')}<span>Pick a piece to restore. A Flawless artifact counts ×1.5 in the museum.</span></div>`;
    if (!S.action && skill === 'bonding') return `<div class="spot-idle">${ui('play')}<span>Commune with your Echo to deepen the bond and build resonance.</span></div>`;
    return base(skill);
  };
}

/* ================================================================ per frame and outcomes */
UPD.push(() => {
  const el = spotNow();
  if (!el) return;
  if (el.dataset.spot === 'archaeology') swingFrame('archaeology', 'mine', SPOT.dig, digImpact, null);
  else if (el.dataset.spot === 'restoration') {
    swingFrame('restoration', 'restore', SPOT.shop, (e2, W, i) => { const [hx, hy] = W.hits[i]; partAdd({ kind: 'flash', x: hx, y: hy, life: 0.12, g: 0 }); for (let k = 0; k < 4; k++) partAdd({ kind: 'star', x: hx + 10, y: hy - 6, vx: (Math.random() - 0.3) * 120, vy: -40 - Math.random() * 60, g: 100, life: 0.6, size: 3, vr: 300, col: '#fff0c8' }); }, null);
    const g = el.querySelector('[data-spotfx]'), k = actFrac('restoration');
    if (g && SPOT.shop) g.innerHTML = k >= 0 ? artifactSVG(SPOT.shop, k) : artifactSVG(SPOT.shop, 1);
  } else if (el.dataset.spot === 'bonding') {
    const k = actFrac('bonding'), E = S.echo || {};
    el.classList.toggle('on', k >= 0);
    el.classList.toggle('rush', E.rush > 0);
    meterSet(el, 'bond', E.rush > 0 ? 1 : (E.res || 0) / 100, E.rush > 0 ? `Resonating · ${Math.ceil(E.rush)}s` : `${Math.floor(E.res || 0)}%`, E.rush > 0);
    if (k >= 0 && Math.random() < 0.3) partAdd({ kind: 'star', x: BOND_BOX.x + 60 + (Math.random() - 0.5) * 140, y: BOND_BOX.y + 140, vx: 0, vy: -40 - Math.random() * 40, g: 0, life: 1.2, size: 3, vr: 200, col: ECHO_COL[E.id] || '#f08cff' });
  }
});
on('dug', (d) => {
  const el = spotNow();
  const id = Object.keys(d.act.out)[0];
  setLast('archaeology', `<small>Last dig</small><b>${esc(ITEMS[id].name)}</b><em>${fmt(familyCount(id))} owned</em>`);
  if (!el || el.dataset.spot !== 'archaeology') return;
  const box = el.querySelector('.dg-grid');
  if (box) { box.outerHTML = gridHTML(d.act.id); const c = el.querySelectorAll('.dg-cells i')[d.cell]; if (c) retrigger(c, 'pop'); }
  const [hx, hy] = SPOT.dig.hit;
  spotPop(`<span class="tile-art">${itemIc(id)}</span>`, hx, hy - 12, 'dish', 1300);
  if (d.what === 'cache') spotPop(`<b>Cache! ×3</b>`, hx + 60, hy - 70, 'tag gold', 1500);
  else if (d.what === 'relic') spotPop(`<b>A relic!</b>`, hx + 60, hy - 70, 'tag gold', 1500);
  else if (d.what === 'shard') spotPop(`<b>Stand Arrow Shard!</b>`, hx + 60, hy - 70, 'tag gold', 1800);
  else if (d.what === 'intact') sxBurst(el, hx + 40, hy - 20, true, 'Intact find!', ITEMS[variantId(id, 's')].name);
});
on('siteclear', (d) => {
  toast(`${d.act.name.replace('Dig: ', '')} cleared: +3 Echo Dust and a fresh grid.`, 'rare');
  const el = spotNow();
  if (el && el.dataset.spot === 'archaeology') spotPop(`${ui('trophy')}Site cleared!`, 400, 54, 'banner', 2200);
});
on('action', (d) => {
  if (d.skill !== 'restoration') return;
  const id = Object.keys(d.act.out || {})[0];
  if (!id) return;
  setLast('restoration', `<small>Last restored</small><b>${esc(ITEMS[id].name)}</b>`);
  const el = spotNow();
  if (el && el.dataset.spot === 'restoration' && SPOT.shop) spotPop(`<span class="tile-art">${itemIc(id)}</span>`, SPOT.shop.hit[0] + 20, SPOT.shop.hit[1] - 40, 'dish', 1400);
});
on('flawless', (d) => {
  const A = ARTIFACTS[d.id];
  toast(`Flawless ${ITEMS[d.id].name}! Its museum bonus counts ×1.5: ${A.desc}.`, 'rare');
  const el = spotNow();
  if (!el || el.dataset.spot !== 'restoration') { burst('Flawless!', `${ITEMS[d.id].name} · museum bonus ×1.5`, itemIc(d.id), '#ffd75e'); return; }
  sxBurst(el, SPOT.shop.hit[0] + 20, SPOT.shop.hit[1] - 20, true, 'Flawless!', 'Museum bonus ×1.5');
});
on('resonance', () => {
  toast('Resonance! Your Echo works three times as fast for 60 seconds.', 'rare');
  const el = spotNow();
  if (el && el.dataset.spot === 'bonding') sxBurst(el, BOND_BOX.x + 40, BOND_BOX.y + 60, true, 'Resonance!', 'Echo ×3 speed · 60s');
});
on('bondup', (d) => {
  const el = spotNow();
  if (d.grade) { burst('Echo evolves', `Bond ${d.lv} · every grade rises`, ui('star'), '#f08cff'); dirty = true; }
  else if (el && el.dataset.spot === 'bonding') { spotPop(`<b>Bond level ${d.lv}</b>`, 400, 80, 'tag gold', 1600); const h = el.querySelector('.sh-name b'); if (h) h.textContent = `Bond level ${d.lv}`; const gst = el.querySelector('.ec-ghost'); if (gst) gst.style.setProperty('--solid', (0.3 + 0.7 * Math.min(1, d.lv / 40)).toFixed(2)); }
});
