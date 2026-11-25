/* Skill page layout (VIEWS.realm in ui.js): one screen, no page scroll (skBoardHTML).
   - Left: the focus panel (focus-ui.js) and the skill's own panels.
   - Right: the action list (a one-click picker of trees, ore veins, rituals; the recipe gallery for crafting)
     and, as more tabs, each extra panel.
   - Milestones, rare finds and synergies open in a window from buttons in the skill banner at the top. */

const PICK_TITLE = { woodcutting: 'Trees', mining: 'Ore veins', archaeology: 'Dig sites', bonding: 'Rituals', tracking: 'Hunts' };

function pickRow(skill, a) {
  const st = actState(skill, a), f = farmRates(skill, a), o = wsOut(a);
  return `<button class="ws-row pk-row" data-act="${skill}:${a.id}" data-card="${skill}:${a.id}" data-state="${st}">
    ${tile(null, null, { r: actRarity(a), icon: actIc(skill, a), mark: actMark(a), cls: 'xs', title: a.name })}
    <span class="ws-nm"><b>${esc(a.name)}</b><small>Lv ${a.level} · ${fmtTime(f.T)} · ${fmt(f.xph)} xp/h</small></span>
    ${a.in ? `<span class="pk-own" title="How many you can make with what you have"><small>Can make</small><b data-wscan="${skill}:${a.id}">${fmt(wsCan(a))}</b></span>`
    : o ? `<span class="pk-own" title="Owned"><small>Owned</small><b data-count="${o}">${fmt(count(o))}</b></span>` : ''}
    <span class="ws-go">${wsGoIc(st)}</span><span class="ws-prog"><i data-cardfill></i></span></button>`;
}
function pickerHTML(skill) {
  const acts = wsActs(skill), open = acts.filter((a) => !wsLocked(actState(skill, a)));
  // Recipes: what you can make right now first, best first.
  if (SKILLS[skill].type === 'craft') open.sort((a, b) => WS_SORTS.best[1](skill, a, b));
  const next = acts.filter((a) => wsLocked(actState(skill, a))).sort((a, b) => a.level - b.level)[0];
  return `<section class="win pick-win">${hdr(PICK_TITLE[skill] || 'Actions', `${open.length} / ${acts.length} · click to start`)}
    <div class="pk-list">${open.map((a) => pickRow(skill, a)).join('')}
    ${next ? `<div class="ws-next pk-next">${tile(null, null, { r: actRarity(next), icon: actIc(skill, next), cls: 'xs', title: next.name })}
      <span><small>Next unlock</small><b>${esc(next.name)}</b></span><em>${next.schem && !S.known[next.schem] ? ui('schematic') : ui('lock')}Lv ${next.level}</em></div>` : ''}</div></section>`;
}
// Banner buttons (top of the page): each opens its panel in a window.
const SK_INFO = {
  // The skill's path: the generic milestones and its own perks (depth.js), in level order.
  milestones: { label: 'Path', icon: 'milestone', html(realm, skill) {
    const L = xpInfo(skill).L, steps = skillPath(skill), nx = steps.find((m) => L < m.lv);
    return `<section class="win">${hdr('Path', `${steps.filter((m) => L >= m.lv).length} / ${steps.length} reached`)}<div class="path-list">${steps.map((m) => `<div class="msc ${L >= m.lv ? 'on' : ''} ${m.perk ? 'perk' : ''} ${m === nx ? 'next' : ''}" style="--rc:${rc(realm)}" title="${esc(m.name)}: ${esc(m.desc)}"><b><i>${m.lv}</i></b><span><em>${m.perk ? ui('star') : ''}${esc(m.name)}</em><small>${esc(m.desc)}</small></span>${m === nx ? '<strong>Next</strong>' : ''}</div>`).join('')}</div></section>`;
  } },
  rare: { label: 'Rare finds', icon: 'rare', html: (realm, skill) => `<section class="win">${hdr('Rare finds', `per action${rareMult(skill) > 1 ? ` · luck ×${rareMult(skill).toFixed(2)}` : ''}`)}<div class="tiles rare-row">${rareTiles(skill).join('')}</div></section>` },
  synergies: { label: 'Synergies', icon: 'star', html: (realm, skill) => `<section class="win syn-win" style="--rc:${rc(realm)}">${synergyHTML(synergiesInto(skill), synergiesFrom(skill))}</section>` },
};
// Milestones (every skill) and the skill's own perks, sorted by level.
const skillPath = (skill) => MILESTONES.map((m) => Object.assign({ perk: false }, m))
  .concat((SKILL_PERKS[skill] || []).map((p) => Object.assign({ perk: true }, p))).sort((a, b) => a.lv - b.lv);
function skInfoBtns(skill) {
  const L = xpInfo(skill).L, steps = skillPath(skill), n = steps.filter((m) => L >= m.lv).length;
  const sub = { milestones: `${n}/${steps.length}` };
  return `<div class="sk-info-btns">${Object.entries(SK_INFO).map(([k, d]) => `<button class="sk-info-btn" data-skinfo="${skill}:${k}">${ui(d.icon)}<span>${d.label}</span>${sub[k] ? `<em>${sub[k]}</em>` : ''}</button>`).join('')}</div>`;
}
function openSkInfo(skill, key) {
  const realm = SKILLS[skill].realm, d = SK_INFO[key];
  openModal(`<div class="sk-info" style="--rc:${rc(realm)}"><div class="ob-head"><small>${esc(SKILLS[skill].name)}</small><h2>${d.label}</h2></div>${d.html(realm, skill)}</div>`, 'Close');
}
document.addEventListener('click', (ev) => {
  const t = ev.target.closest('[data-skinfo]');
  if (!t) return;
  const [skill, key] = t.dataset.skinfo.split(':');
  openSkInfo(skill, key);
});

// The skill page as one screen (2026-11-25, nothing to scroll): the banner on top, then two columns.
// Left: the focus panel and the skill's own panels (plots, harbour, vows, companions...).
// Right: one panel with tabs, the action list first, then each extra panel (logs, Renown, Time Chamber...).
// Long content scrolls inside its own column, never the page.
// Panels as tabs: each panel's own header names its tab.
function hdrTabs(parts) {
  return parts.filter(Boolean).map((h) => {
    const m = h.match(/<h3 class="hdr"><span>(.*?)<\/span>/), label = m ? m[1].replace(/<[^>]+>/g, '').trim() : 'Info';
    return { key: label.toLowerCase().replace(/[^a-z0-9]+/g, '-'), label, h };
  });
}
// One tabbed panel (skill pages, Battlefield). group keys the remembered tab in S.ui.skTab.
function tabPanelHTML(group, tabs, cls) {
  if (!tabs.length) return '';
  S.ui.skTab = S.ui.skTab || {};
  const cur = tabs.some((t) => t.key === S.ui.skTab[group]) ? S.ui.skTab[group] : tabs[0].key;
  return `<section class="sk-more ${cls || ''}" data-skmore="${group}">
    ${tabs.length > 1 ? `<nav class="sk-tabs">${tabs.map((t) => `<button class="${t.key === cur ? 'on' : ''}" data-sktab="${group}:${t.key}">${esc(t.label)}${t.badge ? `<em>${t.badge}</em>` : ''}</button>`).join('')}</nav>` : ''}
    <div class="sk-panes">${tabs.map((t) => `<div class="sk-pane" data-pane="${t.key}" ${t.key === cur ? '' : 'hidden'}>${t.h}</div>`).join('')}</div></section>`;
}
// Shows the tab that holds this element (a link to 'battle#gs-dungeons', the Stages button...).
function showPaneOf(el) {
  const pane = el && el.closest('.sk-pane'), box = pane && pane.closest('.sk-more');
  if (!pane || !box) return;
  const key = pane.dataset.pane, group = box.dataset.skmore;
  S.ui.skTab = S.ui.skTab || {};
  S.ui.skTab[group] = key;
  for (const b of $$('[data-sktab]', box)) b.classList.toggle('on', b.dataset.sktab === group + ':' + key);
  for (const q of $$('.sk-pane', box)) q.hidden = q.dataset.pane !== key;
}
// o: { main, list: [label, html] | null, cls, attrs }
function skBoardHTML(realm, skill, o) {
  const extra = [];
  for (const f of UIX.realmSide) extra.push(f(realm, skill));
  if (renownOn()) extra.push(renownHTML(realm));
  const tabs = (o.list ? [{ key: 'list', label: o.list[0], h: o.list[1] }] : []).concat(hdrTabs(extra));
  const side = tabPanelHTML(skill, tabs, 'sk-b');
  return `<div class="sk-page sk-board fit ${o.cls || ''}" ${o.attrs || ''} style="--rc:${rc(realm)}">
  ${skBannerHTML(realm, skill)}
  <div class="sk-body ${side ? '' : 'solo'}"><div class="sk-a">${o.main}</div>${side}</div>
  </div>`;
}
document.addEventListener('click', (ev) => {
  const t = ev.target.closest('[data-sktab]');
  if (!t) return;
  const box = t.closest('.sk-more'), key = t.dataset.sktab.split(':')[1];
  showPaneOf($(`.sk-pane[data-pane="${key}"]`, box));
});
