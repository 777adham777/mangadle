'use strict';
/* ==========================================================================
   TRI-REALM IDLE — Green Island: the hunt (hunt.js is the engine)
   Trails: your avatar walks a forest trail between giant trees (the forest scrolls past,
   footprints in the mud). When the run ends the quarry breaks cover and is caught.
   The scent meter fills; at 100% the next quarry is Prime Prey, shining gold.
   Beast hunts: a trap waits on the trail and the beast circles it; a capture flashes,
   a Shiny beast bursts with light.
   Loaded after hex-ui.js.
   ========================================================================== */

const PREY_LOOK = {
  wild_fur:      ['quad', { body: '#b89a7a', belly: '#f0e2cc', eye: '#2a1a0a', ear: 'pointy', earIn: '#e8b0a0', tail: 'thin', size: 0.7 }],
  swift_feather: ['wyvern', { body: '#4a8ac8', belly: '#e8f0ff', wing: '#2a5a9a', eye: '#ffdf3a' }],
  boar_tusk:     ['quad', { body: '#6a4a3a', belly: '#9a7a5a', horns: '#f2e6c8', eye: '#ff6a3a', ear: 'round', size: 0.9 }],
  stag_antler:   ['quad', { body: '#a86a3a', belly: '#f0dcae', horns: '#e9e4da', eye: '#2a1a0a', ear: 'pointy', tail: 'thin' }],
  lynx_pelt:     ['quad', { body: '#c9a46a', belly: '#f6e6be', eye: '#9aff6a', slit: 1, ear: 'pointy', earIn: '#3a2a1a', tail: 'thin' }],
  wyrm_scale:    ['wyvern', { body: '#5a7a4a', belly: '#d8e2b0', wing: '#8a6a4a', eye: '#ffdf3a' }],
  chimera_mane:  ['quad', { body: '#c99a4a', belly: '#f0dcae', mane: '#7a4a22', horns: '#e9e4da', tail: 'snake', tailCol: '#5c9a4a', eye: '#ffdf3a', slit: 1, ear: 'round' }],
};
for (const k in PREY_LOOK) CREATURES['Prey:' + k] = PREY_LOOK[k];
const HUNT_BOX = { x: 150, y: 58, h: 194 };
// Walking: the legs swing, the arms counter-swing, a little bounce.
POSE_DRIVE.track = (u, t, B, calm) => {
  const s = calm ? 0 : Math.sin(t * 7), c = calm ? 0 : Math.cos(t * 7), P = Object.assign({}, POSES.relaxed);
  P.lF = [P.lF[0] + 26 * s, P.lF[1] - 22 * Math.max(0, s)];
  P.lB = [P.lB[0] - 26 * s, P.lB[1] - 22 * Math.max(0, -s)];
  P.aF = [P.aF[0] - 18 * s, P.aF[1] + 8];
  P.aB = [P.aB[0] + 18 * s, P.aB[1] - 8];
  P.dy = (P.dy || 0) - Math.abs(c) * 2.5;
  P.t1 += -3;
  return P;
};
DRIVE_SKILL.track = ['tracking', 1];
POSES.track = POSE_DRIVE.track(0, 0, BODY, true);
function bigTree(x, h, w, c) {
  return `<rect x="${x - w / 2}" y="${250 - h}" width="${w}" height="${h + 10}" fill="${c}" stroke="#0a0c11" stroke-width="2"/><circle cx="${x}" cy="${250 - h}" r="${w * 1.6}" fill="#2f6a34" stroke="#0a0c11" stroke-width="2"/><circle cx="${x - w}" cy="${250 - h + 14}" r="${w * 1.1}" fill="#3f8a44"/>`;
}
function huntBg() {
  let s = `<defs>${spGrad('hn-sky', ['#9fd8a8', '#d8f0c0', '#f4f8d8'])}${spGlow('hn-ray', '#fffbe0')}${spGlow('hn-gold', '#ffe27a')}</defs>`;
  s += `<rect width="800" height="320" fill="url(#hn-sky)"/>`;
  // light shafts
  for (const x of [180, 420, 640]) s += `<path d="M${x} 0 l60 0 l-120 260 l-40 0Z" fill="#fffbe0" opacity=".18"/>`;
  // far layer (scrolls slowly), near layer (scrolls fast): drawn twice across 1600 px
  let far = '', near = '';
  for (let k = 0; k < 2; k++) {
    const r = sceneRng(11);
    for (let i = 0; i < 9; i++) far += `<g opacity=".55">${bigTree(k * 800 + i * 95 + r() * 30, 150 + r() * 70, 14 + r() * 8, '#4a3a2a')}</g>`;
    const q = sceneRng(23);
    for (let i = 0; i < 5; i++) near += bigTree(k * 800 + i * 170 + q() * 40, 230 + q() * 40, 26 + q() * 10, '#5a3a22');
    for (let i = 0; i < 14; i++) near += `<path d="M${k * 800 + i * 60 + 10} 258 q10 -24 26 -30 q-6 16 4 28 q6 -18 20 -20 q-8 14 -4 24Z" fill="#3f8a3a" stroke="#0a0c11" stroke-width="1.4"/>`;
  }
  s += `<g class="hn-far">${far}</g>`;
  // the trail
  s += `<rect y="250" width="800" height="70" fill="#6a5034"/><path d="M0 262 Q400 252 800 262" stroke="#4a3622" stroke-width="5" fill="none"/>`;
  let prints = '';
  for (let k = 0; k < 2; k++) for (let i = 0; i < 12; i++) { const x = k * 800 + i * 68 + 20, y = 278 + (i % 2) * 12; prints += `<g transform="translate(${x} ${y})" fill="#3a2a18"><ellipse rx="5" ry="3.6"/><circle cx="-5" cy="-5" r="1.8"/><circle cx="0" cy="-7" r="1.8"/><circle cx="5" cy="-5" r="1.8"/></g>`; }
  s += `<g class="hn-prints">${prints}</g><g class="hn-near">${near}</g>`;
  return s;
}
function huntHTML() {
  const a = S.action && S.action.skill === 'tracking' ? findAction('tracking', S.action.id) : null;
  const last = SPOT.last_tracking, beast = a && a.beast;
  const prey = a && a.out ? Object.keys(a.out)[0] : null;
  return `<section class="win spot-win" style="--rc:${rc('hunter')}">
    <div class="spot sp-hunt ${a ? 'on' : ''} ${beast ? 'beast' : ''} ${primeNext() ? 'prime' : ''}" data-spot="tracking">
      <svg class="spot-bg" viewBox="0 0 800 320" preserveAspectRatio="none" aria-hidden="true">${huntBg()}</svg>
      ${beast ? `<div class="hn-trap" style="left:66%;top:78%">${ITEMS[Object.keys(a.in)[0]] ? itemIc(Object.keys(a.in)[0]) : ''}</div><div class="hn-beast">${ic('beast', beast)}</div>` : ''}
      ${prey ? `<div class="hn-prey">${creatureSVG('Prey:' + prey)}</div>` : ''}
      ${spotAvatar(HUNT_BOX, a ? (beast ? 'guard' : 'track') : '')}
      <svg class="spot-fx" viewBox="0 0 800 320" preserveAspectRatio="none" aria-hidden="true"><defs><filter id="sp-soft" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="2.4"/></filter></defs><g data-spotfx></g><g data-parts></g></svg>
      <div class="spot-pops"></div>
      <div class="spot-hud"><span class="sh-name"><small>Green Island</small><b>${esc(a ? a.name : 'Pick a trail or a beast')}</b></span>${last ? `<span class="sh-last">${last}</span>` : '<span class="sh-last" hidden></span>'}</div>
      <div class="sx-meter" data-sxm="hunt"><small>Scent</small><span class="sx-bar"><i></i></span><b></b></div>
    </div>
    <div class="spot-bar">${spotStats('tracking')}</div>
  </section>`;
}
UIX.realmScene.push((realm, skill) => (skill === 'tracking' ? huntHTML() : ''));
{
  const base = spotStats;
  spotStats = function (skill) {
    if (skill === 'tracking' && !S.action) return `<div class="spot-idle">${ui('play')}<span>Pick a trail to follow, or a beast to trap.</span></div>`;
    return base(skill);
  };
}
UPD.push(() => {
  const el = spotNow();
  if (!el || el.dataset.spot !== 'tracking') return;
  const k = actFrac('tracking'), av = el.querySelector('.spot-av svg.avatar'), a = k >= 0 && findAction('tracking', S.action.id);
  el.classList.toggle('on', k >= 0);
  setPose(av, k >= 0 ? (a && a.beast ? 'guard' : 'track') : '');
  const H = HUNT();
  el.classList.toggle('prime', H.scent >= 100);
  meterSet(el, 'hunt', H.scent / 100, H.scent >= 100 ? 'Prime Prey!' : `${Math.floor(H.scent)}%`, H.scent >= 100);
  // the quarry shows itself near the end of the run
  const p = el.querySelector('.hn-prey');
  if (p) p.classList.toggle('show', k >= 0.72);
});
on('action', (d) => {
  if (d.skill !== 'tracking') return;
  const id = d.act.out && Object.keys(d.act.out)[0], it = id && ITEMS[id];
  if (it) setLast('tracking', `<small>Last catch</small><b>${esc(it.name)}</b><em>${fmt(familyCount(id))} owned</em>`);
  const el = spotNow();
  if (!el || el.dataset.spot !== 'tracking') return;
  const p = el.querySelector('.hn-prey');
  if (p) { retrigger(p, 'caught'); p.classList.remove('show'); }
  if (it) spotPop(`<span class="tile-art">${itemIc(id)}</span>`, 560, 200, 'dish', 1300);
  const meat = d.gains.game_meat;
  if (meat) spotPop(`<b>+${fmt(meat)} ${esc(ITEMS.game_meat.name)}</b>`, 560, 140, 'tag', 1400);
});
on('scent', () => {
  const el = spotNow();
  toast('Prime Prey sighted! Your next trail run gives ×3 and a Prime material.', 'rare');
  if (el && el.dataset.spot === 'tracking') spotPop(`${ui('pet')}Prime Prey sighted!`, 520, 80, 'tag gold', 2200);
});
on('prime', (d) => {
  const el = spotNow();
  if (!el || el.dataset.spot !== 'tracking') { burst('Prime Prey!', `${ITEMS[d.item].name} · ×3 catch`, itemIc(d.item), '#ffd75e'); return; }
  sxBurst(el, 560, 190, true, 'Prime Prey!', `${ITEMS[d.item].name} · ×3 catch`);
});
on('shinybeast', (d) => {
  const B = BEASTS[d.id];
  toast(`Shiny ${B.name}! As a companion it gives 50% more.`, 'rare');
  const el = spotNow();
  if (!el || el.dataset.spot !== 'tracking') { burst('Shiny beast!', `${B.name} · its bonus ×1.5`, ic('beast', d.id), '#ffd75e'); return; }
  sxBurst(el, 530, 220, true, 'Shiny beast!', `${B.name} · its bonus ×1.5`);
});
on('tamed', () => { const el = spotNow(); if (el && el.dataset.spot === 'tracking') retrigger(el.querySelector('.hn-beast'), 'caught'); });
