'use strict';
/* ==========================================================================
   ANIME IDLE RPG — skill guides (2026-11-26, visual pass the same day)
   Every skill page (and the Battlefield, for Character) has a "?" beside its name. The guide is a
   picture first, words second:
   1. Hero: the skill's painted background, its icon, a one-line pitch and your level.
   2. The loop: what comes in (and from which skill) → this skill → what it makes → which skills use it.
   3. Three first steps, written for that skill, each with a big icon.
   4. Your route: the next unlocks and perks on a level track, you-are-here marked.
   5. One tip worth knowing, then what makes it faster.
   Words are hand-written per skill (GUIDE_SK); everything else comes from the game data.
   Only skills you have opened are named, so nothing is spoiled.
   ========================================================================== */

// Icon specs: 'i:item', 'u:ui icon', 's:skill'.
const GUIDE_SK = {
  woodcutting: { tag: 'Every journey starts with an axe and a tree.',
    steps: [['i:pine_log', 'Chop a Pine Log', 'Click a tree in the list. You keep chopping on your own, even while you are away.'],
            ['i:healing_leaf', 'Mind the undergrowth', 'Chops also turn up herbs like Healing Leaves and Chakra Sap. Crafting turns them into pills.'],
            ['i:cedar_log', 'Climb to bigger trees', 'Cedar opens at level 10. Better logs mean better gear, and the forge and the ships need wood too.']],
    tip: ['u:rare', 'Rare finds hide in the canopy: amber, nests, pouches. Amber Eye (Lv 70) makes them 50% more common.'] },
  arts: { tag: 'Wood and herbs go in, weapons and pills come out.',
    steps: [['i:training_kunai', 'Make your first weapon', 'A Training Kunai only needs Pine Logs. Equip it from your Character page.'],
            ['i:soldier_pill', 'Brew Soldier Pills', 'Your first battle food. HP does not come back by itself in a fight, so bring plenty.'],
            ['u:gadget', 'Build tools', 'Crafting makes the tools of your other skills. Each tier is +15% speed for that skill, for good.']],
    tip: ['u:schematic', 'A greyed recipe with a scroll mark needs its schematic first. Hover it, press Shift, and the card shows where it drops.'] },
  mining: { tag: 'Ore made of pure spirit, deep under Soul City.',
    steps: [['i:spirit_ore', 'Pick a vein', 'Spirit Ore comes first. Stay on it: the deeper you dig, the more ore and gems you get.'],
            ['u:gem', 'Watch for a Mother Lode', 'When one shows up, your next ores come out tripled.'],
            ['i:reishi_ingot', 'Feed the forge', 'Smelting turns your ore and a bit of wood into ingots.']],
    tip: ['u:time', 'Depth builds on the vein you are on. Pick one and let it run.'] },
  smithing: { tag: 'Ore, fire and patience.',
    steps: [['i:reishi_ingot', 'Smelt a Reishi Ingot', 'Spirit Ore plus a Pine Log. Each ore has its wood: silver wants cedar, frost wants bamboo.'],
            ['u:forge', 'Keep the forge hot', 'Smelt without a break and the forge heats up: faster smelts and Pure ingots, which halve refinement costs.'],
            ['u:star', 'Reach White Heat', 'At full heat, every smelt comes out doubled.']],
    tip: ['u:weapon', 'Ingots end up in new weapons and in refining the ones you already own.'] },
  fishing: { tag: 'The sea pays the patient.',
    steps: [['i:minnow', 'Cast for Minnows', 'Pick a spot and the line goes out on its own.'],
            ['i:fish_oil', 'Keep the by-catch', 'Fish Oil and seasonings come up with the fish. Net Mender (Lv 35) brings 50% more.'],
            ['i:grilled_minnow', 'Hand it to the cook', 'Raw fish heals nothing: Cooking turns it into battle food and ship provisions.']],
    tip: ['u:fruit', 'Abyss Fruit eaters fish 40% slower. Worth knowing before you eat one.'] },
  cooking: { tag: 'A good cook keeps the crew alive.',
    steps: [['i:grilled_minnow', 'Grill a Minnow', 'One fish, one dish. Dishes heal far more than pills.'],
            ['u:food', 'Make it your battle food', 'Pick it under the battle stage. You eat when your HP gets low.'],
            ['u:cargo', 'Pack provisions', 'Ships take food too: provisions bring more back from Voyaging.']],
    tip: ['u:spices', 'Spices from the by-catch and the voyages give a dish an extra effect. Hover one to see it.'] },
  voyaging: { tag: 'Send the ship, live your life, count the loot.',
    steps: [['u:map', 'Choose a route', 'Each destination takes food and wood for the trip, and a set time.'],
            ['u:time', 'Do anything else', 'Ships sail while you chop, fight or sleep. Trips last from 10 minutes to 8 hours.'],
            ['u:chest', 'Bring the haul home', 'Gold, spices, relics and treasure. Hover a route\'s rewards to see what it can bring.']],
    tip: ['i:grilled_minnow', 'The Coastal Run wants Grilled Minnows: keep the cook busy before the ship leaves.'] },
  character: { tag: 'You prepare. The fights play out.',
    steps: [['u:map', 'Pick a stage', 'Fights run on their own, offline too. Ten wins open the next stage.'],
            ['u:food', 'Bring food', 'Pick it under the stage. HP never comes back by itself: you eat when it runs low.'],
            ['u:technique', 'Read your scrolls', 'Foes drop their world\'s scrolls. Each one teaches or levels a technique.']],
    tip: ['u:skull', 'Every world ends with a guardian. If it hits too hard, gear up and stock food first: it is a test of preparation.'] },
  gravity: { tag: 'Heavier every day. Stronger every day.',
    steps: [['i:ki_dust', 'Train under gravity', 'Pick a session. It repeats like any skill.'],
            ['u:power', 'Break your limit', 'Every session strains your body. At 100% you break through for good: +0.3% damage and max HP.'],
            ['u:form', 'Open what is next', 'Levels train your disciplines faster, grow your stamina, unlock transformations and enlarge the Time Chamber.']],
    tip: ['u:hp', 'Breakthroughs never go away. Each one makes every fight a little easier.'] },
  farming: { tag: 'Plant now, harvest while you are busy.',
    steps: [['u:farm', 'Plant a seed', 'Plots grow in real time, while you do something else and while you are offline.'],
            ['u:star', 'Hope for a Giant', 'A harvest can come up Giant: three times the crop.'],
            ['u:meal', 'Cook with it', 'Crops go into buff meals and Vital Beans.']],
    tip: ['u:rare', 'A mutation leaves seeds of the next crop. That is how new plants open up.'] },
  exorcism: { tag: 'Every world has its curses. Someone has to study them.',
    steps: [['i:hex_ash', 'Face a curse', 'You see its grade before you start, from Grade 4 up to Grade 1.'],
            ['u:skull', 'Aim higher', 'Higher grades leave far more. The rare Special Grade leaves the most.'],
            ['i:cursed_fragment', 'Keep the fragments', 'Cursed Fragments level up any technique you know.']],
    tip: ['u:pact', 'Your Cursed Research level makes your Cursed Pacts stronger.'] },
  tracking: { tag: 'Follow the trail. Bring back a friend.',
    steps: [['i:wild_fur', 'Follow a trail', 'Each hunt brings beast materials, wild seeds and game meat for Cooking.'],
            ['u:star', 'Let the scent build', 'Every run strengthens the scent until you sight Prime Prey: ×3 and a Prime material.'],
            ['u:pet', 'Set a trap', 'Hunt a beast with a trap to make it a companion. A Shiny one gives 50% more.']],
    tip: ['u:bait', 'Better traps hold bigger beasts. Check what a hunt asks for before you set out.'] },
  archaeology: { tag: 'Dig slowly. History is fragile.',
    steps: [['i:clay_fragment', 'Dig a site', 'There is one in every world: an 8×8 grid, and every dig opens a square.'],
            ['u:relic', 'Find what is hidden', 'A grid hides caches, relics, an Echo Arrow Shard and one Intact find.'],
            ['u:echo', 'Clear the grid', 'Open every square for Echo Dust and a fresh grid.']],
    tip: ['u:museum', 'Your fragments go to Restoration, where artifacts become permanent bonuses.'] },
  restoration: { tag: 'Bring the past back, piece by piece.',
    steps: [['i:mermaid_compass', 'Restore an artifact', 'Fragments from your digs plus materials from the other worlds.'],
            ['u:museum', 'Fill the museum', 'Every artifact gives a permanent bonus. A Flawless one counts ×1.5.'],
            ['u:reforge', 'Go for Flawless', 'Not flawless? You can retry until it is.']],
    tip: ['u:weapon', 'Restoration also rebuilds ancient versions of iconic gear.'] },
  bonding: { tag: 'Someone stands beside you now.',
    steps: [['u:echo', 'Commune', 'It builds the bond with your Echo.'],
            ['u:play', 'A second pair of hands', 'Your Echo runs a second activity beside yours and grows as the bond deepens.'],
            ['u:star', 'Ride the resonance', 'Communing builds resonance. At 100% your Echo works three times as fast for a minute.']],
    tip: ['i:awakening_shard', 'Awakening Shards come from Archaeology digs.'] },
};
// Painted backgrounds (assets/backgrounds): skills that have one, else their world's battle scene.
const GUIDE_BG = { woodcutting: 'woodcutting', arts: 'crafting', voyaging: 'voyaging', mining: 'mining', smithing: 'smithing', gravity: 'gravity',
  farming: 'farming', exorcism: 'exorcism', tracking: 'tracking', archaeology: 'archaeology', restoration: 'restoration', bonding: 'bonding' };
function sgBg(skill) {
  if (GUIDE_BG[skill]) return `assets/backgrounds/skills/${GUIDE_BG[skill]}.webp`;
  const r = SKILLS[skill].realm === 'combat' ? (S.combat.zone != null ? ZONES[S.combat.zone].realm : 'shinobi') : SKILLS[skill].realm;
  return `assets/backgrounds/combat/${r}.webp`;
}
const sgIc = (spec) => {
  const [k, id] = spec.split(':');
  if (k === 'i' && ITEMS[id]) return itemIc(id);
  if (k === 's' && SKILLS[id]) return ic('skill', id);
  return ui(k === 'u' ? id : 'star') || ui('star');
};

const skGuideBtn = (skill) => (SKILLS[skill] ? `<button class="sk-help" data-skguide="${skill}" title="Guide: how ${esc(SKILLS[skill].name)} works">?</button>` : '');
const sgActs = (skill) => (typeof wsActs === 'function' ? wsActs(skill) : SKILLS[skill].actions);
const sgOuts = (a) => Object.keys(a.out || {}).concat((a.extra || []).map(([t]) => t)).filter((k) => ITEMS[k]);
const sgSkillOpen = (k) => SKILLS[k] && skillOpen(k) && (SKILLS[k].realm === 'combat' || realmOpen(SKILLS[k].realm));
const sgLink = (go, inner, cls, hint) => `<a class="sg-link ${cls || ''}" data-sgo="${go}" role="button" tabindex="0" ${hint ? `title="${esc(hint)}"` : ''}>${inner}</a>`;
const sgItem = (k) => (isFound(k) ? `<i class="sg-it" data-tip="${k}">${itemIc(k)}</i>` : `<i class="sg-it sil" title="Undiscovered">${silArt(itemIc(k))}</i>`);

/* ---- 2. the loop */
function sgLoop(skill) {
  const L = skillLv(skill), open = sgActs(skill).filter((a) => a.level <= L);
  if (!open.length) return '';
  const made = new Set(), ins = new Set();
  for (const a of open) { sgOuts(a).forEach((k) => made.add(k)); Object.keys(a.in || {}).forEach((k) => ins.add(k)); }
  const inList = [...ins].filter((k) => ITEMS[k] && !made.has(k));
  // who makes the inputs, who uses the products (open skills only)
  const from = new Set(), to = new Set();
  let hidden = false;
  for (const k in SKILLS) {
    if (k === skill) continue;
    for (const a of SKILLS[k].actions || []) {
      if (sgOuts(a).some((o) => ins.has(o)) && sgSkillOpen(k)) from.add(k);
      if (Object.keys(a.in || {}).some((m) => made.has(m))) { if (sgSkillOpen(k)) to.add(k); else hidden = true; }
    }
  }
  const outList = [...made].slice(-6);
  const skills = (set) => [...set].map((k) => sgLink('skill:' + k, `${ic('skill', k)}<b>${esc(SKILLS[k].name)}</b>`, 'sg-sk')).join('');
  return `<section class="sg-loop">
    <div class="sg-col"><small>${inList.length ? 'Takes' : 'Needs'}</small>
      ${inList.length ? `<div class="sg-its">${inList.slice(0, 6).map(sgItem).join('')}</div>${from.size ? `<div class="sg-sks">${skills(from)}</div>` : ''}`
      : `<div class="sg-free">${ui('time')}<b>Only time</b><span>no materials</span></div>`}</div>
    <span class="sg-arr"></span>
    <div class="sg-core">${ic('skill', skill)}<b>${esc(SKILLS[skill].name)}</b></div>
    <span class="sg-arr"></span>
    <div class="sg-col"><small>Makes</small><div class="sg-its">${outList.map(sgItem).join('')}</div></div>
    ${to.size || hidden ? `<span class="sg-arr"></span><div class="sg-col"><small>Feeds</small><div class="sg-sks">${skills(to)}${hidden ? `<span class="sg-sk mute">${ui('lock')}<b>More later</b></span>` : ''}</div></div>` : ''}
  </section>`;
}

/* ---- 4. your route: actions, perks and milestones on a level track */
function sgRoute(skill) {
  const L = xpInfo(skill).L, nodes = [];
  for (const a of sgActs(skill)) nodes.push({ lv: a.level, icon: actTile(skill, a, { cls: 'xs' }), name: actNm(skill, a), hint: `Lv ${a.level} · ${actNm(skill, a)}: a new ${SKILLS[skill].type === 'craft' ? 'recipe' : 'action'}`, go: a.level <= L ? `act:${skill}:${a.id}` : null });
  if (typeof skillPath === 'function') for (const m of skillPath(skill)) nodes.push({ lv: m.lv, perk: true, icon: `<span class="sg-perk">${ui(m.perk ? 'star' : 'milestone')}</span>`, name: m.name, hint: `Lv ${m.lv} · ${m.name}: ${m.desc}` });
  if (!nodes.length) return '';
  nodes.sort((a, b) => a.lv - b.lv || (a.perk ? 1 : -1));
  const nextI = nodes.findIndex((n) => n.lv > L), start = nextI < 0 ? Math.max(0, nodes.length - 7) : Math.max(0, nextI - 2);
  const win = nodes.slice(start, start + 7);
  const nx = nextI >= 0 ? nodes[nextI] : null;
  return `<section class="sg-sec"><h4>Your route <small>Level ${L}${nx ? ` · next at ${nx.lv}` : ' · everything open'}</small></h4>
    <div class="sg-route">${win.map((n) => {
      const done = n.lv <= L, cls = `sg-node ${done ? 'done' : ''} ${n === nx ? 'next' : ''}`;
      const inner = `<span class="sg-dot">${n.icon}</span><em>Lv ${n.lv}</em><b>${esc(n.name)}</b>`;
      return n.go ? sgLink(n.go, inner, cls, n.hint) : `<div class="${cls}" title="${esc(n.hint)}">${inner}</div>`;
    }).join('')}</div></section>`;
}

/* ---- 5. what makes it faster */
function sgBoost(skill) {
  const chips = [];
  if (SKILLS[skill].realm !== 'combat') {
    chips.push(`<span class="pill" title="Action speed: tools, perks and pets raise it">${ui('spd')} Speed <b>×${skillSpeed(skill).toFixed(2)}</b></span>`, `<span class="pill" title="XP multiplier">${ui('xp')} XP <b>×${skillXpMult(skill).toFixed(2)}</b></span>`);
  }
  const tools = Object.values(ITEMS).filter((it) => it.type === 'tool' && it.toolFor === skill).sort((a, b) => a.tier - b.tier);
  const baits = Object.values(ITEMS).filter((it) => it.type === 'bait' && it.baitFor === skill);
  const have = typeof toolTier === 'function' ? toolTier(skill) : 0;
  if (tools.length) chips.push(`<span class="sg-tools" title="Tools (made in Crafting): each tier +15% speed">${ui('gadget')}<span>Tools</span>${tools.map((it) => `<i class="${have >= it.tier ? 'got' : ''}" data-tip="${it.id}">${itemIc(it.id)}</i>`).join('')}</span>`);
  if (baits.length) chips.push(`<span class="sg-tools" title="Bait: +50% rare finds and +10% doubles while you carry some">${ui('bait')}<span>Bait</span>${baits.map((it) => `<i class="got" data-tip="${it.id}">${itemIc(it.id)}</i>`).join('')}</span>`);
  return chips.length ? `<div class="sg-boost">${chips.join('')}</div>` : '';
}

function skillGuideHTML(skill) {
  const s = SKILLS[skill], G = GUIDE_SK[skill] || { tag: s.desc || '', steps: [], tip: null }, b = xpInfo(skill);
  const realmName = REALMS[s.realm] ? REALMS[s.realm].name : 'Battlefield';
  return `<div class="sg" style="--rc:${rc(s.realm === 'combat' ? 'combat' : s.realm)}">
    <header class="sg-hero" style="background-image:url('${sgBg(skill)}')">
      <span class="sg-ic">${ic('skill', skill)}</span>
      <div class="sg-hero-t"><small>${esc(realmName)} · Guide</small><h2>${esc(s.name)}</h2><p>${esc(G.tag)}</p></div>
      <div class="sg-lvl"><b>${b.L}</b><small>Level</small><i style="--p:${b.p}"></i></div>
      <button class="sg-x" data-sgclose title="Close (Esc)">${ui('close')}</button>
    </header>
    ${s.realm === 'combat' ? '' : sgLoop(skill)}
    ${G.steps.length ? `<section class="sg-steps">${G.steps.map(([icn, t, d], i) => `<div class="sg-step"><span class="sg-n">${i + 1}</span><span class="sg-big">${sgIc(icn)}</span><b>${esc(t)}</b><p>${esc(d)}</p></div>`).join('')}</section>` : ''}
    ${s.realm === 'combat' ? '' : sgRoute(skill)}
    ${G.tip ? `<div class="sg-pro"><span class="sg-big">${sgIc(G.tip[0])}</span><div><small>Good to know</small><p>${esc(G.tip[1])}</p></div></div>` : ''}
    ${sgBoost(skill)}
    <p class="sg-foot">${ui('info')}<span>Hover anything for details. On an item, press <kbd>Shift</kbd> to pin its card and jump to where it comes from.</span></p>
  </div>`;
}

document.addEventListener('click', (ev) => {
  const g = ev.target.closest('[data-skguide]');
  if (g) { openModal(skillGuideHTML(g.dataset.skguide), 'Close', true); return; }
  if (ev.target.closest('[data-sgclose]')) { $('#modal').classList.remove('show', 'nofoot'); return; }
  const a = ev.target.closest('[data-sgo]');
  if (!a || ev.target.closest('.sg-it')) return;   // a loose item icon only shows its card
  if (tipGo(a.dataset.sgo)) $('#modal').classList.remove('show', 'nofoot');
});
