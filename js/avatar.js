'use strict';
/* ==========================================================================
   TRI-REALM IDLE — avatar
   A customizable stick figure: ink colour, hat, face, back and aura.
   Cosmetics are purely visual and are earned from in-world feats
   (bosses, skill levels, voyages, rebirths…), never bought.
   Loaded after ui.js, before ui-systems.js.
   ========================================================================== */

const kzOf = (z) => S.combat.kills[z] || 0;
const lvOf = (k) => (S.skills[k] ? skillLv(k) : 0);
// slot -> list of { id, name, need(), hint }. The first of each slot is free.
const COSMETICS = {
  color: [
    { id: 'chalk',   name: 'Chalk',      ink: '#eef1f6', need: () => true },
    { id: 'tide',    name: 'Tide Blue',  ink: '#4cc3ff', need: () => lvOf('fishing') >= 15, hint: 'Reach Fishing level 15' },
    { id: 'coral',   name: 'Coral',      ink: '#ff8a7a', need: () => lvOf('cooking') >= 20, hint: 'Reach Cooking level 20' },
    { id: 'pine',    name: 'Pine',       ink: '#5fd38a', need: () => lvOf('herbalism') >= 20, hint: 'Reach Herbalism level 20' },
    { id: 'spirit',  name: 'Spirit',     ink: '#a98bff', need: () => lvOf('harvest') >= 20, hint: 'Reach Soul Harvest level 20' },
    { id: 'crimson', name: 'Crimson',    ink: '#ff4d5e', need: () => S.stats.kills >= 1000, hint: 'Defeat 1,000 foes' },
    { id: 'gilded',  name: 'Gilded',     ink: '#f4c66a', need: () => totalLevel() >= 500, hint: 'Reach total level 500' },
    { id: 'void',    name: 'Void',       ink: '#7d6bff', need: () => S.rebirths >= 5, hint: 'Rebirth 5 times' },
  ],
  hat: [
    { id: 'none',     name: 'No hat',          need: () => true },
    { id: 'bucket',   name: "Fisher's Bucket", need: () => (S.stats.made.minnow || 0) >= 100, hint: 'Catch 100 Minnows' },
    { id: 'bandana',  name: 'Deckhand Bandana', need: () => kzOf('shoals') >= 25, hint: 'Defeat 25 foes at Rookie Shoals' },
    { id: 'chef',     name: 'Chef Toque',      need: () => lvOf('cooking') >= 30, hint: 'Reach Cooking level 30' },
    { id: 'tricorn',  name: 'Admiral Tricorn', need: () => kzOf('admiral') >= 1, hint: 'Defeat the Admiral of the Tide' },
    { id: 'hood',     name: 'Shinobi Hood',    need: () => kzOf('fox') >= 1, hint: 'Defeat the Ashen Fox Beast' },
    { id: 'horns',    name: 'Bone Horns',      need: () => kzOf('sovereign') >= 1, hint: 'Defeat the Masked Sovereign' },
    { id: 'crown',    name: 'Rift Crown',      need: () => kzOf('convergence') >= 1, hint: 'Defeat the Rift Emperor' },
  ],
  face: [
    { id: 'dots',   name: 'Calm',       need: () => true },
    { id: 'smile',  name: 'Cheerful',   need: () => true },
    { id: 'fierce', name: 'Fierce',     need: () => S.stats.kills >= 100, hint: 'Defeat 100 foes' },
    { id: 'scar',   name: 'Battle Scar', need: () => S.stats.deaths >= 1, hint: 'Lose a fight' },
    { id: 'shades', name: 'Sea Shades', need: () => S.stats.voyages >= 25, hint: 'Return from 25 voyages' },
    { id: 'mask',   name: 'Half Mask',  need: () => lvOf('chakra') >= 30, hint: 'Reach Chakra Focus level 30' },
  ],
  back: [
    { id: 'none',   name: 'Nothing',      need: () => true },
    { id: 'scarf',  name: 'Sailor Scarf', need: () => S.stats.voyages >= 3, hint: 'Return from 3 voyages' },
    { id: 'cape',   name: 'Wanderer Cape', need: () => !!S.gates.shinobi, hint: 'Open the Shinobi Lands' },
    { id: 'coat',   name: 'Captain Coat', need: () => lvOf('smithing') >= 30, hint: 'Reach Bladesmithing level 30' },
    { id: 'pack',   name: 'Treasure Pack', need: () => (S.stats.opened || 0) >= 50, hint: 'Open 50 chests' },
    { id: 'wings',  name: 'Echo Wings',   need: () => collectionPct() >= 0.5, hint: 'Fill 50% of the Collection Log' },
  ],
  aura: [
    { id: 'none',    name: 'No aura',      need: () => true },
    { id: 'bubbles', name: 'Sea Bubbles',  need: () => lvOf('fishing') >= 40, hint: 'Reach Fishing level 40' },
    { id: 'embers',  name: 'Chakra Embers', need: () => S.rebirths >= 1, hint: 'Rebirth for the first time' },
    { id: 'pets',    name: 'Lucky Sparkle', need: () => Object.keys(S.pets).length >= 3, hint: 'Find 3 pets' },
    { id: 'storm',   name: 'Rift Storm',   need: () => !!S.gates.rift, hint: 'Tear open the Convergence' },
  ],
};
const COS_SLOTS = [['color', 'Colour'], ['hat', 'Hat'], ['face', 'Face'], ['back', 'Back'], ['aura', 'Aura']];
const cosOf = (slot, id) => COSMETICS[slot].find((c) => c.id === id) || COSMETICS[slot][0];
const avatarOn = () => isUnlocked('feature:avatar');
function avState() {
  if (!S.avatar || typeof S.avatar !== 'object') S.avatar = {};
  const A = S.avatar;
  if (!A.got || typeof A.got !== 'object') A.got = {};
  for (const [s] of COS_SLOTS) if (!COSMETICS[s].some((c) => c.id === A[s])) A[s] = COSMETICS[s][0].id;
  return A;
}
const cosOwned = (slot, c) => !!avState().got[slot + ':' + c.id] || c.need();
// Marks newly earned cosmetics; returns them (for announcements).
function checkCosmetics() {
  const A = avState(), fresh = [];
  for (const [s] of COS_SLOTS) for (const c of COSMETICS[s]) {
    const k = s + ':' + c.id;
    if (!A.got[k] && c.need()) { A.got[k] = 1; if (c.hint) fresh.push([s, c]); }
  }
  return fresh;
}
const cosCount = () => COS_SLOTS.reduce((a, [s]) => a + COSMETICS[s].filter((c) => cosOwned(s, c)).length, 0);
const cosTotal = () => COS_SLOTS.reduce((a, [s]) => a + COSMETICS[s].length, 0);

/* ------------------------------------------------------------- drawing */
// viewBox 0 0 100 120. Head at (50, 30), feet at y 108. `over` replaces any slot (for previews).
function avatarSVG(over, cls) {
  const A = Object.assign({}, avState(), over || {});
  const ink = cosOf('color', A.color).ink;
  const w = 'stroke-linecap="round" stroke-linejoin="round"';
  const aura = {
    none: '',
    bubbles: `<g class="av-bub" fill="none" stroke="#4cc3ff" stroke-width="1.6" opacity=".8"><circle cx="20" cy="80" r="4"/><circle cx="80" cy="64" r="3"/><circle cx="26" cy="46" r="2.5"/><circle cx="76" cy="96" r="3.5"/></g>`,
    embers: `<g class="av-flame"><ellipse cx="50" cy="68" rx="34" ry="46" fill="#ff9a4d" opacity=".16"/><ellipse cx="50" cy="72" rx="24" ry="38" fill="#ffcf6a" opacity=".14"/></g>`,
    pets: `<g class="av-spark" fill="#f4c66a"><path d="M18 40l2 5 5 2-5 2-2 5-2-5-5-2 5-2z"/><path d="M82 30l1.5 4 4 1.5-4 1.5-1.5 4-1.5-4-4-1.5 4-1.5z"/><path d="M80 88l2 5 5 2-5 2-2 5-2-5-5-2 5-2z"/></g>`,
    storm: `<g class="av-storm"><ellipse cx="50" cy="66" rx="40" ry="50" fill="#a98bff" opacity=".14"/><path d="M14 50l8 6-5 3 9 8M86 40l-7 7 5 2-8 9" fill="none" stroke="#c4b4ff" stroke-width="2" ${w}/></g>`,
  }[A.aura] || '';
  const back = {
    none: '',
    scarf: `<path d="M46 46 L30 58 L36 60 L28 70" fill="none" stroke="#4cc3ff" stroke-width="4" ${w}/>`,
    cape: `<path d="M44 45 Q30 70 28 92 L50 86 L72 92 Q70 70 56 45 Z" fill="#c0394a" opacity=".9"/>`,
    coat: `<path d="M42 46 L34 96 L50 90 L66 96 L58 46 Z" fill="#2c3a5a" stroke="#f4c66a" stroke-width="1.5"/>`,
    pack: `<rect x="56" y="48" width="16" height="20" rx="3" fill="#8a5a2b" stroke="#f4c66a" stroke-width="1.5"/>`,
    wings: `<g fill="#a9e4ff" opacity=".75"><path d="M48 52 Q22 30 10 46 Q20 54 14 64 Q30 62 48 58Z"/><path d="M52 52 Q78 30 90 46 Q80 54 86 64 Q70 62 52 58Z"/></g>`,
  }[A.back] || '';
  const face = {
    dots: `<circle cx="45.5" cy="29" r="1.8"/><circle cx="54.5" cy="29" r="1.8"/>`,
    smile: `<circle cx="45.5" cy="28" r="1.8"/><circle cx="54.5" cy="28" r="1.8"/><path d="M45 33 Q50 37 55 33" fill="none" stroke="${ink}" stroke-width="1.6" ${w}/>`,
    fierce: `<path d="M42.5 25.5l5 2M57.5 25.5l-5 2" stroke="${ink}" stroke-width="1.6" ${w}/><circle cx="45.5" cy="29.5" r="1.6"/><circle cx="54.5" cy="29.5" r="1.6"/><path d="M46 35h8" stroke="${ink}" stroke-width="1.6" ${w}/>`,
    scar: `<circle cx="45.5" cy="29" r="1.8"/><circle cx="54.5" cy="29" r="1.8"/><path d="M55 23l4 9" stroke="#ff4d5e" stroke-width="1.6" ${w}/>`,
    shades: `<path d="M41 28h18" stroke="#111" stroke-width="1.5"/><rect x="41.5" y="27" width="7" height="4.5" rx="1.5" fill="#111"/><rect x="51.5" y="27" width="7" height="4.5" rx="1.5" fill="#111"/><path d="M46 35 Q50 37 54 35" fill="none" stroke="${ink}" stroke-width="1.5" ${w}/>`,
    mask: `<circle cx="45.5" cy="28" r="1.8"/><circle cx="54.5" cy="28" r="1.8"/><path d="M39 31 H61 Q60 41 50 42 Q40 41 39 31Z" fill="#3a4152" stroke="${ink}" stroke-width="1"/>`,
  }[A.face] || '';
  const hat = {
    none: '',
    bucket: `<path d="M38 22 Q39 12 50 12 Q61 12 62 22Z" fill="#c9a66b"/><path d="M33 22.5h34" stroke="#a8844a" stroke-width="3.5" ${w}/>`,
    bandana: `<path d="M38.5 24 Q40 14 50 14 Q60 14 61.5 24Z" fill="#d8434f"/><path d="M61 22l7 3-5 3" fill="#d8434f"/><circle cx="46" cy="18" r="1" fill="#fff"/><circle cx="54" cy="19" r="1" fill="#fff"/>`,
    chef: `<rect x="42" y="12" width="16" height="10" fill="#fff"/><circle cx="44" cy="10" r="5" fill="#fff"/><circle cx="50" cy="7" r="6" fill="#fff"/><circle cx="56" cy="10" r="5" fill="#fff"/>`,
    tricorn: `<path d="M30 21 Q34 6 50 6 Q66 6 70 21 Q60 15 50 19 Q40 15 30 21Z" fill="#1d2433" stroke="#f4c66a" stroke-width="1.5" stroke-linejoin="round"/><path d="M47 11l3-3 3 3-3 3z" fill="#f4c66a"/>`,
    hood: `<path d="M36 34 Q34 12 50 12 Q66 12 64 34 L60 32 Q60 18 50 18 Q40 18 40 32Z" fill="#3b4660"/><path d="M38 22h24" stroke="#9aa6bf" stroke-width="3"/><rect x="46" y="20" width="8" height="4" fill="#cfd6e4"/>`,
    horns: `<path d="M40 22 Q32 14 34 4 Q40 14 44 18Z M60 22 Q68 14 66 4 Q60 14 56 18Z" fill="#e8e2d4" stroke="#9c9586" stroke-width="1"/>`,
    crown: `<path d="M38 22 L38 10 L44 16 L50 6 L56 16 L62 10 L62 22Z" fill="#f4c66a" stroke="#a87b22" stroke-width="1"/><circle cx="50" cy="15" r="2" fill="#a98bff"/>`,
  }[A.hat] || '';
  const blade = S.equip && S.equip.weapon ? `<path d="M70 70 L84 44" stroke="#cfd6e4" stroke-width="2.6" ${w}/><path d="M66 66 L74 72" stroke="#f4c66a" stroke-width="2.6" ${w}/>` : '';
  return `<svg class="avatar ${cls || ''}" viewBox="0 0 100 120" aria-hidden="true">
    ${aura}${back}
    <g class="av-body" fill="none" stroke="${ink}" stroke-width="4" ${w}>
      <path d="M50 44 V76"/><path d="M50 52 L34 66 L30 78"/><path d="M50 52 L66 64 L70 70"/>
      <path d="M50 76 L38 108"/><path d="M50 76 L62 108"/>
    </g>
    ${blade}
    <circle cx="50" cy="30" r="12" fill="#151821" stroke="${ink}" stroke-width="3.5"/>
    <g fill="${ink}">${face}</g>${hat}
  </svg>`;
}

/* ------------------------------------------------------------- view */
let avSlot = 'hat';
function avatarHTML() {
  const A = avState();
  const list = COSMETICS[avSlot];
  return `
  ${ptitle('Hero', 'Avatar', heroTabs('avatar'))}
  <div class="av-layout">
    <section class="win av-stage">
      <div class="av-big">${avatarSVG(null, 'big')}</div>
      <div class="av-worn">${COS_SLOTS.map(([s, l]) => `<span><small>${l}</small><b>${esc(cosOf(s, A[s]).name)}</b></span>`).join('')}</div>
      <p class="muted small">Cosmetics are only for looks. Each one is earned from a feat somewhere in the worlds. ${cosCount()} / ${cosTotal()} found.</p>
    </section>
    <section class="win av-pick">
      <nav class="seg">${COS_SLOTS.map(([s, l]) => `<button class="${s === avSlot ? 'on' : ''}" data-avslot="${s}">${l}<em>${COSMETICS[s].filter((c) => cosOwned(s, c)).length}/${COSMETICS[s].length}</em></button>`).join('')}</nav>
      <div class="av-grid">${list.map((c) => {
        const own = cosOwned(avSlot, c), on = A[avSlot] === c.id;
        return `<button class="av-card ${on ? 'on' : ''} ${own ? '' : 'locked'}" ${own ? `data-cos="${avSlot}:${c.id}"` : ''} title="${esc(own ? c.name : c.hint || '')}">
          <span class="av-mini">${avatarSVG({ [avSlot]: c.id }, own ? '' : 'dim')}</span>
          <b>${esc(c.name)}</b><small>${on ? 'Worn' : own ? 'Click to wear' : `${ui('lock')} ${esc(c.hint)}`}</small></button>`;
      }).join('')}</div>
    </section>
  </div>`;
}

/* ------------------------------------------------------------- input + announcements */
document.addEventListener('click', (ev) => {
  const t = ev.target.closest('[data-avslot], [data-cos]');
  if (!t) return;
  if (t.dataset.avslot) avSlot = t.dataset.avslot;
  else { const [s, id] = t.dataset.cos.split(':'); avState()[s] = id; }
  dirty = true;
});
let lastCosPoll = 0;
UPD.push(() => {
  const now = performance.now();
  if (now - lastCosPoll < 1000 || !S) return;
  lastCosPoll = now;
  const quiet = !avState().seeded;   // first check on a save: older feats unlock silently
  const fresh = checkCosmetics();
  S.avatar.seeded = 1;
  if (quiet || !avatarOn()) return;
  for (const [s, c] of fresh) toast(`New cosmetic: ${c.name} (${COS_SLOTS.find((x) => x[0] === s)[1]}). Wear it in Bank → Avatar.`, 'rare');
  if (fresh.length && S.ui.view === 'hero:avatar') dirty = true;
});
