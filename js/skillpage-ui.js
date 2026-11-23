/* Skill page layout (VIEWS.realm in ui.js). No right column any more: the page uses the full width.
   - Skills with an animated scene get a "stage": the scene beside a one-click picker of every unlocked
     action (trees, fishing spots, recipes) — or, for Voyaging, its harbour.
   - Milestones, rare finds and synergies open in a window from buttons in the skill banner at the top.
   - Each skill's extra panels live in a tabbed sub-menu at the bottom of the page. */

const PICK_TITLE = { woodcutting: 'Trees', mining: 'Ore veins', archaeology: 'Dig sites' };

// Each prop is a four-frame transparent PNG strip, placed where the avatar's tool lands
// (css/background-art.css). The hunter also gets a second prop (the trap). Fishing and
// Cooking keep their own game screen (spot-ui.js), Voyaging draws its ship sprite in
// seas-ui.js, Bonding keeps the player's drawn Echo and Exorcism its drawn curse.
const SKILL_PROP_ART = {
  woodcutting: ['woodcutting'], arts: ['crafting'], mining: ['mining'], smithing: ['smithing'],
  gravity: ['gravity'], farming: ['farming'], exorcism: ['exorcism'],
  tracking: ['tracking', 'tracking-trap'], archaeology: ['archaeology'], restoration: ['restoration'],
};

function farmSpriteNodesHTML(P) {
  const n = P.length;
  return P.map((p, i) => {
    const x = plotX(i, n), crop = p && CROP_BY[p.crop];
    const k = crop ? Math.min(1, p.t / (crop.mins * 60)) : 0;
    const frame = !p ? 0 : k < 0.15 ? 0 : k < 0.4 ? 1 : k < 0.7 ? 2 : 3;
    return `<i class="skill-prop farm-plot" data-sprite="farming" data-owner-skill="farming" data-farm-plot="${i}" data-frame="${frame}" style="left:${(x / 8).toFixed(2)}%" ${p ? '' : 'hidden'}></i>`;
  }).join('');
}

function skillPropLayerHTML(skill) {
  const art = SKILL_PROP_ART[skill];
  if (!art || !art.length) return '';
  const inner = skill === 'farming'
    ? farmSpriteNodesHTML(plots())
    : art.map((sprite) => `<i class="skill-prop prop-${sprite}" data-sprite="${sprite}" data-owner-skill="${skill}" data-frame="0"></i>`).join('');
  return `<div class="skill-prop-layer" data-skill-props="${skill}" aria-hidden="true">${inner}</div>`;
}

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
// The scene and, beside it, what the player acts on (plus the skill's own top panels).
function skStageHTML(skill, scene, top) {
  const s = SKILLS[skill];
  let side = s.type === 'gather' || s.type === 'craft' ? pickerHTML(skill) : '';
  side += top;
  const spotAt = scene.indexOf('<div class="spot ');
  if (spotAt >= 0) {
    const openEnd = scene.indexOf('>', spotAt);
    if (openEnd >= 0) scene = scene.slice(0, openEnd + 1)
      + `<div class="scene-art-bg" data-skill-bg="${skill}" aria-hidden="true"></div>${skillPropLayerHTML(skill)}`
      + scene.slice(openEnd + 1);
  }
  return `<div class="sk-stage ${side.trim() ? '' : 'solo'}"><div class="stg-scene">${scene}</div>${side.trim() ? `<div class="stg-side">${side}</div>` : ''}</div>`;
}

// Banner buttons (top of the page): each opens its panel in a window.
const SK_INFO = {
  milestones: { label: 'Milestones', icon: 'milestone', html(realm, skill) {
    const L = xpInfo(skill).L;
    return `<section class="win">${hdr('Milestones', `${MILESTONES.filter((m) => L >= m.lv).length} / ${MILESTONES.length} reached`)}<div class="ms-row">${MILESTONES.map((m) => `<div class="msc ${L >= m.lv ? 'on' : ''}" style="--rc:${rc(realm)}" title="${m.name}: ${m.desc}"><b><i>${m.lv}</i></b><span><em>${m.name}</em><small>${m.desc}</small></span></div>`).join('')}</div></section>`;
  } },
  rare: { label: 'Rare finds', icon: 'rare', html: (realm, skill) => `<section class="win">${hdr('Rare finds', `per action${rareMult(skill) > 1 ? ` · luck ×${rareMult(skill).toFixed(2)}` : ''}`)}<div class="tiles rare-row">${rareTiles(skill).join('')}</div></section>` },
  synergies: { label: 'Synergies', icon: 'star', html: (realm, skill) => `<section class="win syn-win" style="--rc:${rc(realm)}">${synergyHTML(synergiesInto(skill), synergiesFrom(skill))}</section>` },
};
function skInfoBtns(skill) {
  const L = xpInfo(skill).L, n = MILESTONES.filter((m) => L >= m.lv).length;
  const sub = { milestones: `${n}/${MILESTONES.length}` };
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

// Bottom sub-menu: one tab per extra panel, labelled by the panel's own header.
function skMoreHTML(realm, skill) {
  const parts = [];
  for (const f of UIX.realmSide) { const h = f(realm, skill); if (h) parts.push(h); }
  if (renownOn()) parts.push(renownHTML(realm));
  if (!parts.length) return '';
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

function skillPropFrame(skill) {
  if (skill === 'voyaging') {
    const progress = typeof voyK === 'function' ? voyK() : -1;
    // 0 = moored at home; at sea the ship sails (1-2), then frame 3 for the last stretch.
    return progress < 0 ? 0 : 1 + Math.min(2, Math.floor(Math.min(0.9999, progress) * 3));
  }
  if (skill === 'bonding' && !(S.action && S.action.skill === skill)) {
    const E = S.echo || {};
    return E.id ? (E.rush > 0 ? 3 : 2) : 0;
  }
  const a = S.action && S.action.skill === skill ? findAction(skill, S.action.id) : null;
  if (!a) return 0;
  const duration = actionTime(skill, a);
  const progress = duration > 0 ? Math.min(0.9999, S.action.prog / duration) : 0;
  return Math.min(3, Math.floor(progress * 4));
}

UPD.push(() => {
  const farmLayer = $('.skill-prop-layer[data-skill-props="farming"]');
  if (farmLayer) {
    const P = plots(), nodes = $$('[data-farm-plot]', farmLayer);
    if (nodes.length !== P.length) farmLayer.innerHTML = farmSpriteNodesHTML(P);
    for (const node of $$('[data-farm-plot]', farmLayer)) {
      const p = P[+node.dataset.farmPlot], crop = p && CROP_BY[p.crop];
      const k = crop ? Math.min(1, p.t / (crop.mins * 60)) : 0;
      const frame = !p ? 0 : k < 0.15 ? 0 : k < 0.4 ? 1 : k < 0.7 ? 2 : 3;
      node.hidden = !p;
      if (node.dataset.frame !== String(frame)) node.dataset.frame = String(frame);
    }
  }
  for (const node of $$('.skill-prop[data-owner-skill]:not([data-farm-plot])')) {
    const frame = skillPropFrame(node.dataset.ownerSkill);
    if (node.dataset.frame !== String(frame)) node.dataset.frame = String(frame);
  }
});
