'use strict';
/* ==========================================================================
   TRI-REALM IDLE — skill focus panel (replaces the animated skill scenes, 2026-11-23)
   Every skill page shows, in place of the old scene, what you are making right now, large:
   its item in a progress ring, what it gives (per hour, XP, owned), what it costs, what it
   can also find, the skill's own gauge (vein, forge heat, strain, scent, resonance, curse
   grade, excavation grid), the last result, and one Start / Stop button.
   Idle, it shows the action you ran last (or the best one you can start).
   Farming and Voyaging have none: their plots and harbour already are the focus.
   Fishing and Cooking keep their own page (spot-ui.js); the panel replaces its scene.
   The old scene code (shinobi-ui, soul-ui, ...) still holds each skill's hooks and only
   draws when a .spot element is on the page, which no longer happens.
   Loaded last, after every *-ui.js file.
   ========================================================================== */

const FOCUS_NONE = { farming: 1, voyaging: 1 };
const FOCUS_VERB = {
  woodcutting: 'Chopping', arts: 'Crafting', mining: 'Mining', smithing: 'Smelting', fishing: 'Reeling in', cooking: 'Cooking',
  gravity: 'Training', exorcism: 'Exorcising', tracking: 'Hunting', archaeology: 'Digging', restoration: 'Restoring', bonding: 'Ritual',
};
const focusOut = (a) => (a && a.out ? Object.keys(a.out)[0] : null);

/* ---------------------------------------------------------------- which action */
function focusAct(skill) {
  const acts = SKILLS[skill].actions, pick = (id) => id && acts.find((a) => a.id === id);
  S.ui.foSel = S.ui.foSel || {};
  if (S.action && S.action.skill === skill) S.ui.foSel[skill] = S.action.id;
  const last = pick(S.ui.foSel[skill]);
  if (last && !wsLocked(actState(skill, last))) return last;
  const open = acts.filter((a) => !wsLocked(actState(skill, a)));
  return open.filter((a) => actState(skill, a) === 'ready').sort((a, b) => b.level - a.level)[0] || open[0] || acts[0];
}

/* ---------------------------------------------------------------- the skill's gauge */
// Each returns { name, f (0-1), txt, hot, col }. The tooltip is the skill intro's line of the same name.
const FOCUS_GAUGE = {
  mining: () => { const O = SOUL(), v = curVein(); return { name: 'The vein', f: v / 100, txt: O.lode > 0 ? `Mother Lode ×3 · ${O.lode} left` : `${Math.round(v)}%`, hot: O.lode > 0 }; },
  smithing: () => { const O = SOUL(); return { name: 'Forge heat', f: O.white > 0 ? 1 : O.heat / 100, txt: O.white > 0 ? `White Heat · ${O.white}` : `${Math.round(O.heat)}%`, hot: O.white > 0 }; },
  gravity: () => { const K = KI(); return { name: 'Strain', f: K.strain / 100, txt: `${Math.floor(K.strain)}% · Limit ${K.limit}` }; },
  tracking: () => { const H = HUNT(); return { name: 'Scent', f: H.scent / 100, txt: H.scent >= 100 ? 'Prime Prey!' : `${Math.floor(H.scent)}%`, hot: H.scent >= 100 }; },
  bonding: () => { const E = S.echo || {}; return { name: 'Resonance', f: E.rush > 0 ? 1 : (E.res || 0) / 100, txt: E.rush > 0 ? `Resonating · ${Math.ceil(E.rush)}s` : `${Math.floor(E.res || 0)}%`, hot: E.rush > 0 }; },
  exorcism: () => {
    const G = curGrade(), i = GRADES_HEX.indexOf(G);
    return { name: 'Next curse', f: (i + 1) / GRADES_HEX.length, txt: `${G.name}${G.m > 1 ? ` · ×${G.m} spoils` : ''}`, hot: G.id === 'sp', col: G.col };
  },
};
function focusTip(skill, name) {
  const I = typeof INTRO !== 'undefined' && INTRO['skill:' + skill], P = (I && I.points) || [];
  const p = P.find((x) => x[1] === name);
  return p ? p[2] : '';
}
function focusGaugeHTML(skill, a) {
  if (skill === 'archaeology' && typeof gridHTML === 'function') return `<div class="fo-grid">${gridHTML(a.id)}</div>`;
  const g = FOCUS_GAUGE[skill] && FOCUS_GAUGE[skill]();
  if (!g) return '';
  return `<div class="fo-gauge ${g.hot ? 'hot' : ''}" data-fogauge="${skill}" title="${esc(focusTip(skill, g.name))}"${g.col ? ` style="--gc:${g.col}"` : ''}>
    <small>${esc(g.name)}</small><span class="fo-gbar"><i style="width:${(Math.max(0, Math.min(1, g.f)) * 100).toFixed(1)}%"></i></span><b>${esc(g.txt)}</b></div>`;
}

/* ---------------------------------------------------------------- the panel */
// o.lite: Fishing / Cooking, whose loadout card already lists the numbers; shows the session counter instead.
function focusHTML(skill, o) {
  o = o || {};
  const s = SKILLS[skill], a = focusAct(skill);
  if (!a) return '';
  const run = !!(S.action && S.action.skill === skill && S.action.id === a.id), st = actState(skill, a), r = actRarity(a), out = focusOut(a);
  const it = out && ITEMS[out], locked = wsLocked(st);
  const busy = S.action && S.action.skill !== skill ? SKILLS[S.action.skill].name : '';
  const kick = run ? FOCUS_VERB[skill] || 'Working' : busy ? `Busy with ${esc(busy)}` : locked ? 'Locked' : 'Ready';
  const sub = [it ? typeLabel(out) : a.kind || '', `Lv ${a.level}`].filter(Boolean).join(' · ');
  const f = locked ? null : farmRates(skill, a);
  let body = '';
  if (o.lite) {
    if (run && typeof fcSessHTML === 'function') body += `<div class="fo-sess" data-fcsess="${skill}">${fcSessHTML(skill)}</div>`;
  } else if (f) {
    const per = f.itemsh || f.per;
    body += `<div class="fo-stats">
      ${per ? `<span title="Per hour, doubles included"><small>Per hour</small><b>${fmt(per)}</b></span>` : ''}
      <span title="XP per hour"><small>XP / hour</small><b>${fmt(f.xph)}</b></span>
      <span title="Time to the next level at this pace"><small>Next level</small><b ${run ? 'data-nextlv' : ''}>${run ? '—' : xpInfo(skill).need ? fmtTime((xpInfo(skill).need / (a.xp * skillXpMult(skill))) * f.T) : 'MAX'}</b></span>
      ${out ? `<span title="Owned, every version"><small>Owned</small><b data-fam="${out}">${fmt(familyCount(out))}</b></span>` : ''}
      ${a.in ? `<span title="How many you can make with what you have"><small>Can make</small><b data-wscan="${skill}:${a.id}">${fmt(wsCan(a))}</b></span>` : ''}
    </div>`;
    if (a.in) body += `<div class="fo-ing"><small>Needs</small>${Object.entries(a.in).map(([k, n]) => tile(k, `<em data-have="${k}" data-n="${n}">${fmt(stock(k))}</em>/${fmt(n)}`, { cls: 'xs ' + (stock(k) < n ? 'short' : '') })).join('')}</div>`;
    if (a.extra && a.extra.length) body += `<div class="fo-ing fo-extra"><small>Can find</small>${a.extra.map(([k, ch]) => tile(k, fmtRate(ch * (ch < 0.2 ? rareMult(skill) : 1)), { cls: 'xs', unknown: !S.found[k] })).join('')}</div>`;
  }
  if (!locked) body += focusGaugeHTML(skill, a);
  const last = SPOT['last_' + skill];
  const cta = run ? `<button class="fo-cta stop" data-stop>${ui('stop')}<span>Stop</span></button>`
    : `<button class="fo-cta" data-act="${skill}:${a.id}" ${locked || st === 'missing' ? 'disabled' : ''}>${ctaLabel(skill, a, st)}</button>`;
  return `<section class="win fo-win ${run ? 'on' : ''}" data-focus="${skill}" style="--rc:${rc(s.realm)}">
    <div class="fo-bg" data-skill-bg="${skill}" aria-hidden="true"></div>
    <div class="fo-body">
      <div class="fo-art r${r}">
        <span class="fo-ring" data-foring="${skill}"></span>
        ${tile(null, null, { r, icon: actIc(skill, a), mark: actMark(a), cls: 'fo-tile', title: a.name })}
        <span class="fo-time" ${run ? 'data-nowtime' : ''}>${run ? '' : fmtTime(actionTime(skill, a))}</span>
        <div class="fo-pops" data-fopops="${skill}"></div>
      </div>
      <div class="fo-info">
        <small class="fo-kick">${kick}</small>
        <h2>${esc(a.name)}</h2>
        <div class="fo-sub">${stars(r)}<span>${esc(sub)}</span></div>
        ${body}
        <div class="fo-foot"><span class="fo-last" data-folast="${skill}" ${last ? '' : 'hidden'}>${last || ''}</span>${cta}</div>
      </div>
    </div>
  </section>`;
}

/* ---------------------------------------------------------------- wiring */
// The panel takes the place of every skill scene.
UIX.realmScene.length = 0;
UIX.realmScene.push((realm, skill) => (SKILLS[skill] && !FOCUS_NONE[skill] && SKILLS[skill].actions.length ? focusHTML(skill) : ''));
// Fishing / Cooking: the panel in place of their scene, beside their loadout card.
fcSceneHTML = (skill) => focusHTML(skill, { lite: true });
// The last result also lands in the panel.
{
  const base = setLast;
  setLast = function (skill, html) {
    base(skill, html);
    const L = $(`[data-folast="${skill}"]`);
    if (L) { L.hidden = false; L.innerHTML = html; retrigger(L, 'bump'); }
  };
}

/* ---------------------------------------------------------------- live */
UPD.push(() => {
  const el = $('[data-focus]');
  if (!el) return;
  const skill = el.dataset.focus;
  const ring = $('[data-foring]', el);
  if (ring) {
    const a = S.action && S.action.skill === skill ? findAction(skill, S.action.id) : null;
    const k = a ? Math.min(1, S.action.prog / actionTime(skill, a)) : 0;
    ring.style.setProperty('--p', k.toFixed(4));
  }
  const g = $('[data-fogauge]', el), G = g && FOCUS_GAUGE[skill] && FOCUS_GAUGE[skill]();
  if (G) {
    $('i', g).style.width = (Math.max(0, Math.min(1, G.f)) * 100).toFixed(1) + '%';
    setText($('b', g), G.txt);
    g.classList.toggle('hot', !!G.hot);
    if (G.col) g.style.setProperty('--gc', G.col);
  }
});
// Each result pops out of the item: what you got, the XP.
on('action', (d) => {
  const el = $(`[data-focus="${d.skill}"]`);
  if (!el) return;
  if (d.skill === 'archaeology' && typeof gridHTML === 'function') { const box = $('.fo-grid', el); if (box) box.innerHTML = gridHTML(d.act.id); }
  if (typeof avCalm === 'function' && avCalm()) return;
  const out = focusOut(d.act), n = out ? Object.keys(d.gains).filter((k) => baseOf(k) === out).reduce((t, k) => t + d.gains[k], 0) : 0;
  const box = $('[data-fopops]', el), tl = $('.fo-tile', el);
  if (tl) retrigger(tl, 'fo-hit');
  if (!box || actionTime(d.skill, d.act) < 0.6) return;
  const p = document.createElement('span');
  p.className = 'fo-pop' + (d.double ? ' dbl' : '');
  p.innerHTML = n ? `+${fmt(n)}${d.double ? ' <small>double</small>' : ''}` : `+${fmt(d.xp)} <small>XP</small>`;
  box.appendChild(p);
  setTimeout(() => p.remove(), 1200);
});
