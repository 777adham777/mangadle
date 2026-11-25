'use strict';
/* ==========================================================================
   TRI-REALM IDLE — skill guides (2026-11-26)
   Every skill page (and the Battlefield, for Character) has a "?" beside its name. It opens a guide
   built from the game's own data, so it never goes stale: what the skill is, how it plays, what it
   makes (with the item cards on hover), where its products go and where its materials come from
   (each a link), and what makes it faster. Only skills you have opened are named: nothing is spoiled.
   ========================================================================== */

// How each kind of skill plays: [icon, short title, line].
const GUIDE_HOW = {
  gather: [
    ['play', 'Pick a spot', 'Click a line in the list on the right. It repeats on its own, offline too, until you pick something else.'],
    ['xp', 'Levels open better spots', 'Every action gives XP and its item. Higher spots take longer and are worth more.'],
    ['rare', 'Rare finds', 'Any action can turn up something extra: the Rare finds button in the banner lists them.'],
  ],
  craft: [
    ['play', 'Pick a recipe', 'It uses the materials shown and repeats until you run out or stop it. ×1 makes a single one.'],
    ['bank', 'Missing a material?', 'Hover it and press Shift: the card stays open, and its lines take you to where it comes from.'],
    ['schematic', 'Schematics', 'Some recipes need a schematic first. Found once, known forever.'],
  ],
  voyage: [
    ['play', 'Send a ship', 'Pick a destination: the ship sails for the time shown while you do anything else.'],
    ['food', 'Provisions', 'Food packed as provisions brings more back from the trip.'],
    ['gold', 'What comes back', 'Hover a destination\'s rewards to see what each route can bring.'],
  ],
  farm: [
    ['farm', 'Plant seeds', 'Plots grow in real time, offline too, while you do something else.'],
    ['star', 'Giants and mutations', 'A harvest can come up Giant (×3), and a mutation leaves seeds of the next crop.'],
  ],
  bond: [
    ['play', 'Commune', 'Pick a ritual on the right; it repeats on its own like any skill.'],
    ['star', 'Your Echo', 'It runs a second activity beside yours and grows as the bond deepens.'],
  ],
  combat: [
    ['map', 'Choose a stage', 'Fights play out on their own, offline too. Ten wins open the next stage; every world ends with a guardian.'],
    ['food', 'Bring food', 'Pick your battle food under the stage. You eat when HP gets low, and HP does not come back by itself.'],
    ['technique', 'Techniques', 'Foes drop their world\'s scrolls. Read them in Techniques to learn and level techniques.'],
  ],
};

const skGuideBtn = (skill) => (SKILLS[skill] ? `<button class="sk-help" data-skguide="${skill}" title="Guide: how ${esc(SKILLS[skill].name)} works">?</button>` : '');
const sgActs = (skill) => (typeof wsActs === 'function' ? wsActs(skill) : SKILLS[skill].actions);
const sgOuts = (a) => Object.keys(a.out || {}).concat((a.extra || []).map(([t]) => t)).filter((k) => ITEMS[k]);
const sgSkillOpen = (k) => SKILLS[k] && skillOpen(k) && (SKILLS[k].realm === 'combat' || realmOpen(SKILLS[k].realm));
// A link to a skill (or one action of it); locked skills are not named.
const sgLink = (go, inner, cls) => `<a class="sg-link ${cls || ''}" data-sgo="${go}" role="button" tabindex="0">${inner}</a>`;

function sgActions(skill) {
  const acts = sgActs(skill), L = skillLv(skill);
  const open = acts.filter((a) => a.level <= L), next = acts.filter((a) => a.level > L).sort((a, b) => a.level - b.level).slice(0, 3);
  if (!acts.length) return '';
  const row = (a, shut) => {
    const outs = sgOuts(a).slice(0, 4), ins = Object.keys(a.in || {}).filter((k) => ITEMS[k]);
    const body = `<span class="sg-lv">${a.level}</span>${tile(null, null, { r: actRarity(a), icon: actIc(skill, a), cls: 'xs', title: a.name })}
      <span class="sg-nm"><b>${esc(a.name)}</b>${ins.length ? `<small>${ins.map((k) => `<i data-tip="${k}">${itemIc(k)}</i>`).join('')}<em>→</em>${outs.map((k) => `<i data-tip="${k}">${itemIc(k)}</i>`).join('')}</small>` : outs.length ? `<small>${outs.map((k) => `<i data-tip="${k}">${itemIc(k)}</i>`).join('')}</small>` : ''}</span>
      ${shut ? `<em class="sg-lock">${ui('lock')}Lv ${a.level}</em>` : `<s>${ui('play')}</s>`}`;
    return shut ? `<div class="sg-act shut">${body}</div>` : sgLink(`act:${skill}:${a.id}`, body, 'sg-act');
  };
  return `<section class="sg-sec"><h4>What you do here <small>${open.length} / ${acts.length} open</small></h4>
    <div class="sg-acts">${open.slice().reverse().slice(0, 8).map((a) => row(a)).join('')}${next.map((a) => row(a, true)).join('')}</div>
    ${open.length > 8 ? `<p class="sg-more">…and ${open.length - 8} more on the page.</p>` : ''}</section>`;
}

// Which open skills use what this skill makes, and which make what it uses.
function sgFlows(skill) {
  const made = new Set(), used = new Set();
  for (const a of sgActs(skill)) { sgOuts(a).forEach((k) => made.add(k)); Object.keys(a.in || {}).forEach((k) => used.add(k)); }
  const to = {}, from = {};
  let hidden = 0;
  for (const k in SKILLS) {
    if (k === skill) continue;
    for (const a of SKILLS[k].actions || []) {
      for (const m in a.in || {}) if (made.has(m)) { if (!sgSkillOpen(k)) { hidden++; continue; } (to[k] = to[k] || new Set()).add(m); }
      for (const o of sgOuts(a)) if (used.has(o) && sgSkillOpen(k)) (from[k] = from[k] || new Set()).add(o);
    }
  }
  const chips = (map) => Object.entries(map).map(([k, set]) => sgLink('skill:' + k, `<i>${ic('skill', k)}</i><b>${esc(SKILLS[k].name)}</b><small>${[...set].slice(0, 4).map((m) => `<i data-tip="${m}">${itemIc(m)}</i>`).join('')}</small>`, 'sg-chip')).join('');
  const toH = chips(to), fromH = chips(from);
  if (!toH && !fromH) return '';
  return `<section class="sg-sec sg-flow">
    ${fromH ? `<div><h4>Its materials come from</h4><div class="sg-chips">${fromH}</div></div>` : ''}
    ${toH || hidden ? `<div><h4>What it makes goes to</h4><div class="sg-chips">${toH}${hidden ? `<span class="sg-chip mute">${ui('lock')}<small>more in skills still to come</small></span>` : ''}</div></div>` : ''}</section>`;
}

function sgBoost(skill) {
  const rows = [];
  if (SKILLS[skill].realm !== 'combat') {
    rows.push(['spd', 'Speed', '×' + skillSpeed(skill).toFixed(2)], ['xp', 'XP', '×' + skillXpMult(skill).toFixed(2)]);
    if (rareMult(skill) > 1) rows.push(['rare', 'Luck', '×' + rareMult(skill).toFixed(2)]);
  }
  const tools = Object.values(ITEMS).filter((it) => it.type === 'tool' && it.toolFor === skill).sort((a, b) => a.tier - b.tier);
  const baits = Object.values(ITEMS).filter((it) => it.type === 'bait' && it.baitFor === skill);
  const L = xpInfo(skill).L, next = typeof skillPath === 'function' ? skillPath(skill).filter((m) => L < m.lv).slice(0, 2) : [];
  if (!rows.length && !tools.length && !baits.length && !next.length) return '';
  const have = typeof toolTier === 'function' ? toolTier(skill) : 0;
  return `<section class="sg-sec"><h4>Make it faster</h4>
    ${rows.length ? `<div class="sg-pills">${rows.map(([i, l, v]) => `<span class="pill">${ui(i)} ${l} <b>${v}</b></span>`).join('')}</div>` : ''}
    ${tools.length ? `<p class="sg-line">${ui('spd')}<span><b>Tools</b> (crafted): each tier +15% speed. You have ${have ? 'Mk ' + 'I'.repeat(have) : 'none yet'}.</span><span class="sg-tiles">${tools.map((it) => `<i class="${have >= it.tier ? 'got' : ''}" data-tip="${it.id}">${itemIc(it.id)}</i>`).join('')}</span></p>` : ''}
    ${baits.length ? `<p class="sg-line">${ui('bait')}<span><b>Bait</b>: +50% rare finds and +10% doubles while you carry some.</span><span class="sg-tiles">${baits.map((it) => `<i data-tip="${it.id}">${itemIc(it.id)}</i>`).join('')}</span></p>` : ''}
    ${next.map((m) => `<p class="sg-line">${ui(m.perk ? 'star' : 'milestone')}<span><b>Lv ${m.lv} · ${esc(m.name)}</b>: ${esc(m.desc)}</span></p>`).join('')}</section>`;
}

function skillGuideHTML(skill) {
  const s = SKILLS[skill], how = GUIDE_HOW[s.type] || GUIDE_HOW.gather;
  return `<div class="sg" style="--rc:${rc(s.realm === 'combat' ? 'combat' : s.realm)}">
    <div class="sg-head"><span class="sg-ic">${ic('skill', skill)}</span><div><small>Guide · ${esc(REALMS[s.realm] ? REALMS[s.realm].name : 'Battlefield')}</small><h2>${esc(s.name)}</h2><p>${esc(s.desc || '')}</p></div></div>
    <section class="sg-sec"><h4>How it works</h4><ul class="sg-how">${how.map(([i, b, t]) => `<li><i>${ui(i)}</i><span><b>${b}.</b> ${t}</span></li>`).join('')}</ul></section>
    ${s.realm === 'combat' ? '' : sgActions(skill)}
    ${s.realm === 'combat' ? '' : sgFlows(skill)}
    ${sgBoost(skill)}
    <p class="sg-tip">${ui('quest')}<span>Hover anything for its details. On an item, press <kbd>Shift</kbd>: the card stays open and its lines take you to where the item comes from or goes.</span></p>
  </div>`;
}

document.addEventListener('click', (ev) => {
  const g = ev.target.closest('[data-skguide]');
  if (g) { openModal(skillGuideHTML(g.dataset.skguide), 'Close'); return; }
  const a = ev.target.closest('[data-sgo]');
  if (!a || ev.target.closest('[data-tip]')) return;
  if (tipGo(a.dataset.sgo)) $('#modal').classList.remove('show');
});
