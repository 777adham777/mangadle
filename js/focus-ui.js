'use strict';
/* ==========================================================================
   ANIME IDLE RPG — skill focus panel (replaces the animated skill scenes, 2026-11-23)
   The one detail view of a skill page, and the one place its running action shows progress:
   the item, large, in a progress ring; what it gives (per hour, XP, next level), what it
   costs, what it can also find, its effect (gear stats, heals, Shiny / Perfect odds), the
   skill's own gauge (vein, forge heat, strain, scent, resonance, curse grade, dig grid),
   mastery, the last result and one Start / Stop button.
   It shows the selected action: the running one, else the one you picked last (recipe gallery,
   Fishing / Cooking cards), else the best one you can start. A locked recipe shows what it needs.
   Each page has one list of actions beside or under it (skillpage-ui.js, workshop-ui.js, spot-ui.js);
   lists carry no progress bar, and the activity bar drops its own while you are on that page.
   Farming and Voyaging have none: their plots and harbour already are the focus.
   Loaded last, after every *-ui.js file.
   ========================================================================== */

const FOCUS_NONE = { farming: 1, voyaging: 1 };
const FOCUS_VERB = {
  woodcutting: 'Chopping', arts: 'Crafting', mining: 'Mining', smithing: 'Smelting', fishing: 'Reeling in', cooking: 'Cooking',
  gravity: 'Training', exorcism: 'Exorcising', tracking: 'Hunting', archaeology: 'Digging', restoration: 'Restoring', bonding: 'Ritual',
};
const focusOut = (a) => (a && a.out ? Object.keys(a.out)[0] : null);

/* ---------------------------------------------------------------- which action */
// A newly started action becomes the selection; picking a recipe / dish changes it without starting.
const FO_RUN = {};
function focusAct(skill) {
  if (FC.includes(skill)) return fcSel(skill);
  const acts = SKILLS[skill].actions, pick = (id) => id && acts.find((a) => a.id === id);
  const run = S.action && S.action.skill === skill ? S.action.id : null, craft = SKILLS[skill].type === 'craft';
  const W = craft ? wsState(skill) : null;
  S.ui.foSel = S.ui.foSel || {};
  if (run && FO_RUN[skill] !== run) { S.ui.foSel[skill] = run; if (W) W.sel = run; }
  FO_RUN[skill] = run;
  const sel = pick(W ? W.sel : S.ui.foSel[skill]);
  if (sel && (craft ? wsShown(sel) : !wsLocked(actState(skill, sel)))) return sel;
  const open = (craft ? wsActs(skill) : acts).filter((a) => !wsLocked(actState(skill, a)));
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
// What the item does: gear stats, heals, its description, the skill's own lines (actLines).
function focusNotes(skill, a) {
  const out = focusOut(a), it = out && ITEMS[out], n = [];
  if (it && it.type === 'equip' && it.stats) n.push(`<div class="ac-note">${statInline(it.stats)}</div>`);
  if (it && it.type === 'food' && skill !== 'cooking') n.push(`<div class="ac-note"><span>${ui('hp')}Heals ${foodHeal(out)} HP</span></div>`);
  if (FC.includes(skill)) n.push(fcQHTML(skill, a));
  else n.push(uix('actLines', skill, a));
  if (it && it.desc && SKILLS[skill].type === 'craft') n.push(`<p class="fo-desc">${esc(it.desc)}</p>`);
  return n.join('');
}
function focusReqHTML(skill, a) {
  const L = skillLv(skill), schem = a.schem && !S.known[a.schem], src = schem && sourcesOf(a.schem)[0];
  return `<ul class="fo-req"><li class="${L >= a.level ? 'ok' : ''}">${ui(L >= a.level ? 'check' : 'lock')}<span>${SKILLS[skill].name} level ${a.level}</span><em>${L} / ${a.level}</em></li>
    ${a.schem ? `<li class="${schem ? '' : 'ok'}">${ui(schem ? 'schematic' : 'check')}<span>${esc(ITEMS[a.schem].name)}</span><em>${schem ? (src ? `${esc(src.text)}${src.rate ? ' · ' + fmtRate(src.rate * luckMult()) : ''}` : 'Not found yet') : 'Learned'}</em></li>` : ''}</ul>`;
}
function focusHTML(skill) {
  const s = SKILLS[skill], a = focusAct(skill);
  if (!a) return '';
  const run = !!(S.action && S.action.skill === skill && S.action.id === a.id), st = actState(skill, a), r = actRarity(a), out = focusOut(a);
  const hid = actHid(skill, a), it = out && !hid && ITEMS[out], locked = wsLocked(st);
  // What starting this would stop: the button says it (and offers the queue when the running task ends by itself).
  const busy = S.action && !run ? (S.action.skill === skill ? findAction(skill, S.action.id).name : SKILLS[S.action.skill].name)
    : S.combat.zone != null ? 'Battle' : '';
  const kick = run ? FOCUS_VERB[skill] || 'Working' : locked ? 'Locked' : 'Ready';
  const sub = [hid ? 'Undiscovered' : it ? typeLabel(out) : a.kind || '', `Lv ${a.level}`].filter(Boolean).join(' · ');
  // Owned: gathering skills already list it in their picker beside the panel.
  const own = out && !hid && (s.type === 'craft' || FC.includes(skill)) ? `<span class="fo-own"><small>Owned</small><b data-fam="${out}">${fmt(familyCount(out))}</b></span>` : '';
  const ing = a.in ? `<div class="fo-ing"><small>Needs</small>${Object.entries(a.in).map(([k, n]) => tile(k, `<em data-have="${k}" data-n="${n}">${fmt(stock(k))}</em>/${fmt(n)}`, { cls: 'xs ' + (stock(k) < n ? 'short' : ''), unknown: !isFound(k), r: rarity(k) })).join('')}</div>` : '';
  // Zéro mémoire: a missing material says who makes it, and one click goes there (or queues it first).
  const gets = a.in && !locked ? Object.entries(a.in).filter(([k, n]) => stock(k) < n).map(([k, n]) => {
    const p = typeof msProducer === 'function' ? msProducer(k) : null;
    if (!p) return `<div class="fo-get none">${tile(k, null, { cls: 'xs', unknown: !isFound(k), r: rarity(k) })}<span><b>${esc(matNm(k))}</b><small>No skill of yours makes it yet: the Bank says where it drops.</small></span></div>`;
    const runs = Math.max(1, Math.ceil((n * 10 - stock(k)) / (p.a.out[k] || 1)));
    const q = typeof msOn === 'function' && msOn() ? `<button class="gbtn sm sel" data-getq="${p.skill}:${p.a.id}:${runs}:${skill}:${a.id}" title="Task Queue: ${esc(p.a.name)} ×${runs} (enough for 10), then this recipe">Queue first</button>` : '';
    return `<div class="fo-get">${tile(k, null, { cls: 'xs', unknown: !isFound(k), r: rarity(k) })}<span><b>${esc(matNm(k))}</b><small>${esc(SKILLS[p.skill].name)} · ${esc(p.a.name)}</small></span><span class="fo-get-b"><button class="gbtn sm" data-act="${p.skill}:${p.a.id}" title="Start ${esc(p.a.name)}">${ui('play')}<span>Get it</span></button>${q}</span></div>`;
  }).join('') : '';
  let body = '';
  if (locked) body = focusReqHTML(skill, a) + ing + (hid ? '' : focusNotes(skill, a));
  else {
    const f = farmRates(skill, a), per = f.itemsh || f.per, need = xpInfo(skill).need;
    body += `<div class="fo-stats">
      <span title="Time per action"><small>Each</small><b>${fmtTime(f.T)}</b></span>
      ${per ? `<span title="Per hour, doubles included"><small>Per hour</small><b>${fmt(per)}</b></span>` : ''}
      <span title="XP per hour"><small>XP / hour</small><b>${fmt(f.xph)}</b></span>
      <span title="Time to the next level at this pace"><small>Next level</small><b ${run ? 'data-nextlv' : ''}>${need ? fmtTime((need / (a.xp * skillXpMult(skill) * earlyXp(skill))) * f.T) : 'MAX'}</b></span>
      ${a.in ? `<span title="How many you can make with what you have"><small>Can make</small><b data-wscan="${skill}:${a.id}">${fmt(wsCan(a))}</b></span>` : ''}
    </div>`;
    if (run && FC.includes(skill)) body += `<div class="fo-sess" data-fcsess="${skill}">${fcSessHTML(skill)}</div>`;
    body += ing + gets;
    if (a.extra && a.extra.length) body += focusFindsHTML(skill, a, f.T);
    body += focusNotes(skill, a);
    if (skill === 'cooking' && typeof fcSpiceHTML === 'function') body += fcSpiceHTML();
    body += focusGaugeHTML(skill, a);
    const np = (SKILL_PERKS[skill] || []).find((p) => xpInfo(skill).L < p.lv);
    if (np) body += `<button class="fo-perk" data-skinfo="${skill}:milestones" title="Open this skill's path">${ui('star')}<span><small>Next perk · Lv ${np.lv}</small><b>${esc(np.name)}</b><em>${esc(np.desc)}</em></span></button>`;
    body += `<div class="fo-mast" title="Mastery: each level makes this action 0.3% faster and adds 0.1% chance to double">${ui('mastery')}<span>Mastery <b data-mlv="${skill}:${a.id}">${masteryLv(skill, a.id)}</b></span><span class="bar"><i data-mfill="${skill}:${a.id}"></i></span></div>`;
  }
  const last = SPOT['last_' + skill];
  const go = FC.includes(skill) ? FC_TXT[skill].go : s.type === 'voyage' ? 'Set sail' : s.type === 'craft' ? 'Craft' : 'Start';
  // Recipes that use materials: a count field + "Craft" (that many, then stop) beside "Craft ∞" (until stopped or out of materials).
  const batch = st === 'ready' && !busy && a.in && s.type === 'craft';
  const cta = run ? `<button class="fo-cta stop" data-stop>${ui('stop')}<span>Stop</span></button>`
    : st === 'ready' && busy ? focusSwitchHTML(skill, a, go, busy)
    : batch ? `<span class="fo-ctas">${craftNHTML(skill, a, go, '')}<button class="fo-cta" data-act="${skill}:${a.id}" title="Keep going until you stop it or run out of materials">${ui('play')}<span>${go} ∞</span></button></span>`
    : `<button class="fo-cta" data-act="${skill}:${a.id}" ${locked || st === 'missing' ? 'disabled' : ''}>${st === 'ready' && FC.includes(skill) ? `${ui('play')}${FC_TXT[skill].go}` : ctaLabel(skill, a, st)}</button>`;
  return `<section class="win fo-win ${run ? 'on' : ''}" data-focus="${skill}" style="--rc:${rc(s.realm)}">
    <div class="fo-bg" data-skill-bg="${skill}" aria-hidden="true"></div>
    <div class="fo-body">
      <div class="fo-art r${r}">
        <span class="fo-ring" data-foring="${skill}:${a.id}"></span>
        ${actTile(skill, a, { cls: 'fo-tile' })}
        <span class="fo-time" ${run ? 'data-nowtime' : ''}>${run || locked ? '' : fmtTime(actionTime(skill, a))}</span>
      </div>
      <div class="fo-info">
        <div class="fo-head"><div><small class="fo-kick">${kick}</small><h2>${esc(actNm(skill, a))}</h2><div class="fo-sub">${stars(r)}<span>${esc(sub)}</span></div></div>${own}</div>
        ${body}
        <div class="fo-foot"><span class="fo-last" data-folast="${skill}" ${last ? '' : 'hidden'}>${last || ''}</span>${cta}</div>
      </div>
    </div>
  </section>`;
}

// Something else runs: "Craft now · stops Woodcutting", and "Queue next" when the running task ends by itself
// (a sized queue task, or a recipe that runs out of materials). An endless gather would never hand over.
function focusSwitchHTML(skill, a, go, busy) {
  const M = typeof msOn === 'function' && msOn() ? msState() : null;
  const runA = S.action && findAction(S.action.skill, S.action.id);
  const ends = M && ((M.cur && M.cur.n) || (runA && runA.in));
  const q = ends && msFree() > 0 ? `<button class="fo-cta q" data-qnext="${skill}:${a.id}" title="Task Queue: starts when ${esc(M.cur ? msName(M.cur) : runA.name)} ends">${ui('missions')}<span>Queue next<small>after ${esc(M.cur ? msName(M.cur) : runA.name)}</small></span></button>` : '';
  const one = a.in && SKILLS[skill].type === 'craft' ? craftNHTML(skill, a, go, busy) : '';
  return `<span class="fo-ctas">${one}<button class="fo-cta sw" data-act="${skill}:${a.id}">${ui('play')}<span>${go}${one ? ' ∞' : ' now'}<small>stops ${esc(busy)}</small></span></button>${q}</span>`;
}
// "Craft ×N": the player types how many to make; the run stops after that many (or when materials run out).
// The count is remembered per recipe; the field has an id so a redraw keeps its focus and caret.
const craftN = (skill, id) => Math.max(1, Math.min(99999, ((S.ui.craftN || {})[skill + ':' + id]) || 1));
function craftNHTML(skill, a, go, busy) {
  const n = craftN(skill, a.id), stops = busy ? ` (stops ${esc(busy)})` : '';
  return `<span class="fo-qty" title="How many to make, then stop${stops}"><button class="fo-cta one" data-craftn="${skill}:${a.id}">${ui('play')}<span>${go}</span></button><input id="fo-n-${skill}-${a.id}" class="fo-n" data-craftq="${skill}:${a.id}" type="text" inputmode="numeric" maxlength="5" value="${n}" aria-label="How many to make"></span>`;
}
function craftNGo(skill, id, field) {
  const raw = parseInt(field ? field.value : '', 10);
  const n = Math.max(1, Math.min(99999, raw > 0 ? raw : craftN(skill, id)));
  (S.ui.craftN = S.ui.craftN || {})[skill + ':' + id] = n;
  const st = actState(skill, findAction(skill, id));
  if (st === 'locked' || st === 'missing') { if (st === 'missing') toast('Missing materials — gather them first.', 'bad'); return; }
  startAction(skill, id, n);
}
document.addEventListener('input', (ev) => {
  const f = ev.target.closest('[data-craftq]');
  if (!f) return;
  const v = f.value.replace(/\D/g, '').slice(0, 5);
  if (v !== f.value) f.value = v;
  if (+v > 0) (S.ui.craftN = S.ui.craftN || {})[f.dataset.craftq] = +v;
});
document.addEventListener('keydown', (ev) => {
  const f = ev.target.closest && ev.target.closest('[data-craftq]');
  if (!f || ev.key !== 'Enter') return;
  ev.preventDefault();
  const [skill, id] = f.dataset.craftq.split(':');
  craftNGo(skill, id, f);
});
document.addEventListener('click', (ev) => {
  const b = ev.target.closest('[data-craftn]');
  if (!b) return;
  const [skill, id] = b.dataset.craftn.split(':');
  craftNGo(skill, id, b.parentElement.querySelector('[data-craftq]'));
});
document.addEventListener('click', (ev) => {
  const t = ev.target.closest('[data-qnext]');
  if (!t) return;
  const [skill, id] = t.dataset.qnext.split(':');
  if (postMission({ k: 'act', skill, id, n: 0 }, 0)) toast(`Queued next: ${findAction(skill, id).name}.`, 'good');
});
// "Can find": the by-products you have not found yet show as a dark silhouette in their rarity frame, with a
// hint (rarity, kind, one line of lore) and about how long one takes at this speed.
function focusFindsHTML(skill, a, T) {
  const got = a.extra.filter(([k]) => S.found[k]).length;
  const tiles = a.extra.map(([k, ch]) => {
    const p = Math.min(1, ch * extraMult(skill)), it = ITEMS[k], r = rarity(k), known = S.found[k];
    const every = p > 0 && p < 1 ? ` · about 1 every ${fmtTime(T / p)}` : '';
    if (known) return tile(k, fmtRate(p), { cls: 'xs' });
    const lore = ((it.base ? ITEMS[it.base] : it).lore || it.desc || '').split(/(?<=\.)\s/)[0];
    const tip = `Unknown ${RARITY_NAME[r] || ''} ${typeLabel(k).toLowerCase()}${every}${lore ? `\n"${lore}"` : ''}`;
    // The icon without its data-tip, so hovering never names it.
    return tile(k, fmtRate(p), { cls: 'xs', unknown: true, r, title: tip });
  }).join('');
  return `<div class="fo-ing fo-extra"><small>Rare finds <em>${got} / ${a.extra.length}</em></small>${tiles}</div>`;
}

/* ---------------------------------------------------------------- wiring */
// The panel takes the place of every skill scene.
UIX.realmScene.length = 0;
UIX.realmScene.push((realm, skill) => (SKILLS[skill] && !FOCUS_NONE[skill] && SKILLS[skill].actions.length ? focusHTML(skill) : ''));
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
// Narrow screens: picking a recipe in the gallery brings the panel into view.
document.addEventListener('click', (ev) => {
  const t = ev.target.closest('.wc-pick[data-wsel]');
  if (t && wsNarrow()) requestAnimationFrame(() => { const p = $('[data-focus]'); if (p) p.scrollIntoView({ behavior: 'smooth', block: 'start' }); });
});
// The activity bar drops its progress and numbers while you look at that skill's page: the panel shows them.
UPD.push(() => {
  const nb = $('#nowbar');
  if (nb) nb.classList.toggle('here', !!((S.action && S.ui.view === skillView(S.action.skill) && $('[data-focus]')) || (S.combat.zone != null && S.ui.view === 'battle')));
  const el = $('[data-focus]');
  if (!el) return;
  const skill = el.dataset.focus;
  const ring = $('[data-foring]', el);
  if (ring) {
    // Only the shown action's own progress: a recipe you are browsing keeps an empty ring.
    const a = S.action && S.action.skill + ':' + S.action.id === ring.dataset.foring ? findAction(skill, S.action.id) : null;
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
// Each result bumps the item; the +items / +XP numbers rise from it (ui.js 'action' anchors on .fo-tile).
on('action', (d) => {
  const el = $(`[data-focus="${d.skill}"]`);
  if (!el) return;
  if (d.skill === 'archaeology' && typeof gridHTML === 'function') { const box = $('.fo-grid', el); if (box) box.innerHTML = gridHTML(d.act.id); }
  if (calmMotion()) return;
  const tl = $('.fo-tile', el);
  if (tl) retrigger(tl, 'fo-hit');
});
