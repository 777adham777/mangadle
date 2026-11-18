/* Skill page layout (VIEWS.realm in ui.js). No right column any more: the page uses the full width.
   - Skills with an animated scene get a "stage": the scene beside a one-click picker of every unlocked
     action (trees, fishing spots, recipes) — or, for Voyaging, its harbour.
   - Milestones, rare finds, synergies and each skill's extra panels live in a tabbed sub-menu at the
     bottom of the page instead of a tall sidebar. */

const PICK_TITLE = { woodcutting: 'Trees', fishing: 'Fishing spots', mining: 'Ore veins', archaeology: 'Dig sites', cooking: 'Dishes' };

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
  const acts = SKILLS[skill].actions, open = acts.filter((a) => !wsLocked(actState(skill, a)));
  // Recipes: what you can make right now first, best first.
  if (SKILLS[skill].type === 'craft') open.sort((a, b) => WS_SORTS.best[1](skill, a, b));
  const next = acts.filter((a) => wsLocked(actState(skill, a))).sort((a, b) => a.level - b.level)[0];
  return `<section class="win pick-win">${hdr(PICK_TITLE[skill] || 'Actions', `${open.length} / ${acts.length} · click to start`)}
    <div class="pk-list">${open.map((a) => pickRow(skill, a)).join('')}
    ${next ? `<div class="ws-next pk-next">${tile(null, null, { r: actRarity(next), icon: actIc(skill, next), cls: 'xs', title: next.name })}
      <span><small>Next unlock</small><b>${esc(next.name)}</b></span><em>${next.schem && !S.known[next.schem] ? ui('schematic') : ui('lock')}Lv ${next.level}</em></div>` : ''}</div></section>`;
}
// The scene and, beside it, what the player acts on (plus the skill's own top panels).
function skStageHTML(skill, scene, top) {
  const s = SKILLS[skill];
  let side = s.type === 'gather' || s.type === 'craft' ? pickerHTML(skill) : '';
  side += top;
  const rack = skill === 'cooking' ? `<section class="win spice-win">${spiceRackHTML()}</section>` : '';
  return `<div class="sk-stage ${side.trim() ? '' : 'solo'}"><div class="stg-scene">${scene}${rack}</div>${side.trim() ? `<div class="stg-side">${side}</div>` : ''}</div>`;
}

// Bottom sub-menu: one tab per panel, labelled by the panel's own header.
function skMoreHTML(realm, skill) {
  const b = xpInfo(skill), parts = [];
  for (const f of UIX.realmSide) { const h = f(realm, skill); if (h) parts.push(h); }
  if (renownOn()) parts.push(renownHTML(realm));
  parts.push(`<section class="win">${hdr('Milestones', `${MILESTONES.filter((m) => b.L >= m.lv).length} / ${MILESTONES.length} reached`)}<div class="ms-row">${MILESTONES.map((m) => `<div class="msc ${b.L >= m.lv ? 'on' : ''}" style="--rc:${rc(realm)}" title="${m.name}: ${m.desc}"><b><i>${m.lv}</i></b><span><em>${m.name}</em><small>${m.desc}</small></span></div>`).join('')}</div></section>`);
  parts.push(`<section class="win">${hdr('Rare finds', `per action${rareMult(skill) > 1 ? ` · luck ×${rareMult(skill).toFixed(2)}` : ''}`)}<div class="tiles rare-row">${rareTiles(skill).join('')}</div></section>`);
  parts.push(`<section class="win syn-win" style="--rc:${rc(realm)}">${synergyHTML(synergiesInto(skill), synergiesFrom(skill))}</section>`);
  const tabs = parts.map((h) => {
    const m = h.match(/<h3 class="hdr"><span>(.*?)<\/span>/), label = m ? m[1].replace(/<[^>]+>/g, '').trim() : 'Info';
    return { key: label.toLowerCase().replace(/[^a-z0-9]+/g, '-'), label, h };
  });
  S.ui.skTab = S.ui.skTab || {};
  const cur = tabs.some((t) => t.key === S.ui.skTab[skill]) ? S.ui.skTab[skill] : tabs[0].key;
  return `<section class="sk-more" data-skmore="${skill}">
    <nav class="sk-tabs">${tabs.map((t) => `<button class="${t.key === cur ? 'on' : ''}" data-sktab="${skill}:${t.key}">${esc(t.label)}</button>`).join('')}</nav>
    ${tabs.map((t) => `<div class="sk-pane" data-pane="${t.key}" ${t.key === cur ? '' : 'hidden'}>${t.h}</div>`).join('')}</section>`;
}
document.addEventListener('click', (ev) => {
  const t = ev.target.closest('[data-sktab]');
  if (!t) return;
  const [skill, key] = t.dataset.sktab.split(':'), box = t.closest('.sk-more');
  S.ui.skTab = S.ui.skTab || {};
  S.ui.skTab[skill] = key;
  for (const b of $$('[data-sktab]', box)) b.classList.toggle('on', b === t);
  for (const p of $$('.sk-pane', box)) p.hidden = p.dataset.pane !== key;
});
