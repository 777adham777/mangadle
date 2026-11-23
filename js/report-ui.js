'use strict';
/* ==========================================================================
   TRI-REALM IDLE — the News Coo report (report.js keeps the away log and the allies)
   Coming back after a while, a News Coo drops the morning paper:
   - the headline: the best thing that happened while you were away (replayable);
   - "Overnight": the missions, bosses, rare finds and levels, with their time;
   - "Allies": who dropped by, their gift, your bond with them;
   - "Ready now": what waits for a click (chests, techniques, plots, the board...);
   - the haul: everything gained and spent.
   Replaces showOffline() from ui.js. Loaded after ui.js and missions-ui.js.
   ========================================================================== */

Object.assign(ICONS.ui, { coo: 'scroll-unfurled', ally: 'pirate-captain' });

const clockAt = (ms) => { const d = new Date(ms); return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`; };

// How good an event is for the headline.
function cooScore(e) {
  if (e.k === 'rare') return 20 + 20 * rarity(e.id);
  if (e.k === 'hunt') return 130;
  if (e.k === 'pet') return 95;
  if (e.k === 'tech') return 62;
  if (e.k === 'schem') return 58;
  if (e.k === 'boss') return 50;
  if (e.k === 'card') return 46;
  if (e.k === 'level' && e.skill === 'character') return 24;
  if (e.k === 'level') return 18;
  return 0;
}
function cooHeadline(e) {
  if (e.k === 'rare') return { title: `${ITEMS[e.id].name} found`, sub: e.source ? `Pulled from ${e.source}` : 'A rare find', art: tile(e.id, null, {}), replay: rarity(e.id) >= 4 ? e.id : null, r: rarity(e.id) };
  if (e.k === 'hunt') return { title: `Hunt complete: ${ITEMS[e.id].name}`, sub: `On your Hunt List for ${fmtTime(e.real || 0)}`, art: tile(e.id, null, {}), replay: rarity(e.id) >= 4 ? e.id : null, r: Math.max(4, rarity(e.id)) };
  if (e.k === 'pet') return { title: `${e.name} joins you`, sub: 'A new companion', art: tile(null, null, { r: 5, icon: ic('pet', e.id) }), r: 5 };
  if (e.k === 'tech') return { title: `New technique: ${TECHNIQUES[e.id].name}`, sub: 'Read from a scroll', art: tile(null, null, { r: 4, icon: ic('technique', e.id) }), r: 4 };
  if (e.k === 'schem') return { title: `${ITEMS[ITEMS[e.id].teaches].name} schematic learned`, sub: 'A new recipe', art: tile(e.id, null, {}), r: 4 };
  if (e.k === 'boss') return { title: `${e.name} falls`, sub: 'A guardian defeated', art: tile(null, null, { r: 5, icon: ic('enemy', e.name) }), r: 4 };
  if (e.k === 'card') return { title: `Card: ${CARDS[e.id] ? CARDS[e.id].name : 'new card'}`, sub: 'Added to the Card Book', art: tile(null, null, { r: 4, icon: ui('rare') }), r: 4 };
  if (e.k === 'level') return { title: `${SKILLS[e.skill].name} reaches level ${e.level}`, sub: 'Training paid off', art: tile(null, null, { r: 3, icon: ic('skill', e.skill) }), r: 3 };
  return null;
}
// The "Overnight" column: one line per mission, boss, find; level-ups merged per skill; ships counted.
function cooLines(rec, leftAt) {
  const rows = [], lv = {}, boss = {}, rare = {};
  let ships = 0, hauls = 0, shipT = 0;
  for (const e of rec.ev) {
    if (e.k === 'level') { lv[e.skill] = e; continue; }
    if (e.k === 'rare') { if (rare[e.id]) rare[e.id].n++; else rows.push(rare[e.id] = Object.assign({}, e, { n: 1 })); continue; }
    if (e.k === 'ship') { ships++; hauls += e.hauls || 0; shipT = e.t; continue; }
    if (e.k === 'boss') { (boss[e.name] = boss[e.name] || { e, n: 0 }).n++; continue; }
    rows.push(e);
  }
  for (const k in lv) rows.push(lv[k]);
  for (const k in boss) rows.push(Object.assign({}, boss[k].e, { n: boss[k].n }));
  if (ships) rows.push({ k: 'ship', t: shipT, n: ships, hauls });
  // Keep the ten that matter most, then tell them in order.
  const weight = (e) => ({ hunt: 9, mission: 6, death: 6, boss: 6, pet: 7, tech: 7, schem: 7, card: 5, ship: 4 }[e.k] || (e.k === 'rare' ? rarity(e.id) + (e.n > 1 ? 0 : 0.5) : e.skill === 'character' ? 3 : 2));
  const kept = rows.sort((a, b) => weight(b) - weight(a) || a.t - b.t).slice(0, 10).sort((a, b) => a.t - b.t);
  const line = (e) => {
    const at = `<time>${clockAt(leftAt + e.t * 1000)}</time>`;
    if (e.k === 'mission') {
      const tag = e.why === 'done' ? '<em class="ok">done</em>' : e.why === 'skip' ? `<em class="bad">skipped</em>` : '<em class="warn">stopped</em>';
      return `${at}<span>${ui('missions')}Mission: ${esc(e.name)} ${e.n ? '×' + fmt(e.n) : ''}${e.why === 'stopped' ? ` (${fmt(e.done)} done)` : ''}${e.reason ? ` · ${esc(e.reason)}` : ''}</span>${tag}`;
    }
    if (e.k === 'rare') return `${at}<span>${itemIc(e.id)}<b class="rar r${rarity(e.id)}">${esc(ITEMS[e.id].name)}</b>${e.n > 1 ? ` ×${fmt(e.n)}` : e.source ? ` · ${esc(e.source)}` : ''}</span>`;
    if (e.k === 'boss') return `${at}<span>${ui('skull')}${esc(e.name)} defeated${e.n > 1 ? ` ×${e.n}` : ''}</span>`;
    if (e.k === 'level') return `${at}<span>${ic('skill', e.skill)}${SKILLS[e.skill].name} → Lv ${e.level}</span>`;
    if (e.k === 'death') return `${at}<span>${ui('skull')}Defeated by ${esc(e.name)}</span><em class="bad">retreat</em>`;
    if (e.k === 'ship') return `${at}<span>${ic('skill', 'voyaging')}${e.n} ship${e.n > 1 ? 's' : ''} came back · ${fmt(e.hauls)} hauls</span>`;
    if (e.k === 'pet') return `${at}<span>${ic('pet', e.id)}${esc(e.name)} joined you</span>`;
    if (e.k === 'hunt') return `${at}<span>${itemIc(e.id)}Hunt complete: <b class="rar r${rarity(e.id)}">${esc(ITEMS[e.id].name)}</b></span><em class="ok">hunted</em>`;
    if (e.k === 'tech') return `${at}<span>${ic('technique', e.id)}Learned ${esc(TECHNIQUES[e.id].name)}</span>`;
    if (e.k === 'schem') return `${at}<span>${itemIc(e.id)}Schematic: ${esc(ITEMS[e.id].name)}</span>`;
    if (e.k === 'card') return `${at}<span>${ui('rare')}Card: ${esc(CARDS[e.id] ? CARDS[e.id].name : e.id)}</span>`;
    return '';
  };
  return kept.map((e) => `<li>${line(e)}</li>`).join('');
}
function allyCard(v) {
  const N = NPCS[v.id], A = ALLIES[v.id];
  const gifts = Object.entries(v.gains).sort((a, b) => rarity(b[0]) - rarity(a[0])).slice(0, 4).map(([k, n]) => tile(k, fmt(n), { cls: 'xs' })).join('')
    + (v.gold ? tile(null, fmt(v.gold), { r: 3, icon: ui('gold'), cls: 'xs', title: 'Gold' }) : '')
    + (v.frag ? tile(null, '+' + v.frag.n, { r: 4, icon: ic('technique', v.frag.id), cls: 'xs', title: `${TECHNIQUES[v.frag.id].name} fragments` }) : '')
    + (v.xp ? `<span class="coo-xp">+${fmt(v.xp)} XP</span>` : '');
  const pips = Array.from({ length: ALLY_MAX }, (_, i) => `<i class="${i < v.bond ? 'on' : ''}"></i>`).join('');
  return `<div class="coo-ally">${npcArt(v.id)}<div class="ca-main">
      <small>${v.sworn ? 'Sworn ally · double gift' : esc(N.title)}</small><b>${esc(N.name)} dropped by</b>
      <span class="ca-gift">${gifts || `<span class="muted">${esc(A.gift)}</span>`}</span>
      <span class="ca-bond"><span class="pips">${pips}</span>Bond ${v.bond}/${ALLY_MAX} · ${allyPerkText(v.id, v.bond)}</span></div></div>`;
}
// Everything waiting for a click.
function cooReady() {
  const out = [];
  const st = goalState();
  if (st && st.done) out.push(['Quest complete', gbtn('Claim', 'check', 'data-claim data-closemodal', 'sm glow')]);
  if (typeof msOn === 'function' && msOn() && !msUsed()) out.push(['The Mission Board is empty', gbtn('Board', 'missions', 'data-msboard', 'sm')]);
  const chests = Object.keys(S.items).filter((k) => ITEMS[k] && ITEMS[k].type === 'chest').reduce((a, k) => a + count(k), 0);
  if (chests) out.push([`${fmt(chests)} chest${chests > 1 ? 's' : ''} to open`, gbtn('Bank', 'open', 'data-nav="hero" data-closemodal', 'sm')]);
  if (typeof techOn === 'function' && techOn() && Object.keys(S.tech.lv).some((t) => TECHNIQUES[t] && fragCost(t) > 0 && techFrag(t) >= fragCost(t))) out.push(['A technique can level up', gbtn('Techniques', 'technique', 'data-nav="techniques" data-closemodal', 'sm')]);
  if (typeof plots === 'function' && skillOpen('farming')) {
    const ripe = plots().filter((p) => p && CROP_BY[p.crop] && p.t >= CROP_BY[p.crop].mins * 60).length;
    if (ripe) out.push([`${ripe} plot${ripe > 1 ? 's' : ''} ready to harvest`, gbtn('Farming', 'play', `data-nav="realm:${SKILLS.farming.realm}:farming" data-closemodal`, 'sm')]);
  }
  if (typeof expOn === 'function' && expOn() && S.exped.ships.length < shipSlots()) out.push(['A ship waits in port', gbtn('Voyaging', 'play', `data-nav="realm:${SKILLS.voyaging.realm}:voyaging" data-closemodal`, 'sm')]);
  if (typeof hasAllStones === 'function' && wishesOn() && hasAllStones()) out.push(['All seven Dragon Balls', gbtn('Wish', 'rare', 'data-nav="home" data-closemodal', 'sm')]);
  return out;
}
function cooHaul(before, after) {
  const tiles = [];
  const dg = after.gold - before.gold;
  if (dg) tiles.push(tile(null, (dg > 0 ? '+' : '') + fmt(dg), { r: 3, icon: ui('gold'), title: 'Gold' }));
  const ids = [...new Set([...Object.keys(before.items), ...Object.keys(after.items)])].filter((id) => ITEMS[id])
    .map((id) => [id, (after.items[id] || 0) - (before.items[id] || 0)]).filter(([, d]) => d)
    .sort((a, b) => rarity(b[0]) - rarity(a[0]) || Math.abs(b[1]) * ITEMS[b[0]].value - Math.abs(a[1]) * ITEMS[a[0]].value);
  for (const [id, d] of ids.slice(0, 15)) tiles.push(tile(id, (d > 0 ? '+' : '') + fmt(d), { cls: d < 0 ? 'neg' : '' }));
  return { tiles, more: Math.max(0, ids.length - 15) };
}

showOffline = function (secs, before) {
  const rec = typeof awayEnd === 'function' ? awayEnd(secs) : { ev: [], visits: [] };
  const after = snapshot(), now = Date.now(), leftAt = now - secs * 1000;
  const best = rec.ev.filter((e) => cooScore(e) > 0).sort((a, b) => cooScore(b) - cooScore(a) || a.t - b.t)[0];
  const H = best ? cooHeadline(best) : null;
  const lines = cooLines(rec, leftAt), ready = cooReady(), haul = cooHaul(before, after);
  const nothing = !lines && !haul.tiles.length && !rec.visits.length;
  const date = new Date(now).toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long' });
  const head = H ? `<div class="coo-head r${H.r}">${H.art}<div><small>Headline${best.t != null ? ' · ' + clockAt(leftAt + best.t * 1000) : ''}</small><h3>${esc(H.title)}</h3><p>${esc(H.sub)}</p></div>${H.replay ? gbtn('Replay', 'rare', `data-cooreplay="${H.replay}"`, 'sm') : ''}</div>`
    : `<div class="coo-head quiet"><div><small>Headline</small><h3>${nothing ? 'A quiet night in the multiverse' : 'Work went on while you were gone'}</h3><p>${nothing ? 'Nothing ran while you were away.' : 'No big news, just honest progress.'}</p></div>${typeof msOn === 'function' && msOn() ? gbtn('Mission Board', 'missions', 'data-msboard', 'sm') : ''}</div>`;
  const html = `<div class="coo">
    <div class="coo-mast"><span class="coo-bird">${ui('coo')}</span><div><small>Delivered by the News Coo · ${esc(date)}</small><h2>The Morning Coo</h2></div><span class="coo-away"><small>You were away</small><b>${fmtTime(secs)}</b></span></div>
    ${head}
    <div class="coo-cols">
      <section class="coo-col"><h4>Overnight</h4>${lines ? `<ol class="coo-tl">${lines}</ol>` : `<p class="muted small">${nothing ? 'Post missions on the board before you leave: they run one after another while you are away.' : 'Steady work, nothing to report.'}</p>`}</section>
      ${rec.visits.length ? `<section class="coo-col"><h4>Allies</h4>${rec.visits.map(allyCard).join('')}</section>` : ''}
    </div>
    ${ready.length ? `<section class="coo-ready"><h4>Ready now</h4><div class="cr-list">${ready.map(([t, b]) => `<span>${esc(t)}${b}</span>`).join('')}</div></section>` : ''}
    ${haul.tiles.length ? `<section class="coo-haul"><h4>The haul</h4><div class="ob-grid">${haul.tiles.join('')}${haul.more ? `<span class="coo-more">+${haul.more} more</span>` : ''}</div></section>` : ''}
  </div>`;
  openModal(html, 'Continue');
};

document.addEventListener('click', (ev) => {
  const t = ev.target.closest('[data-cooreplay]');
  if (!t) return;
  const id = t.dataset.cooreplay;
  if (typeof REVEAL_SEEN !== 'undefined') delete REVEAL_SEEN[id];
  if (typeof dropReveal === 'function') dropReveal(id, 'While you were away');
});
// Links in the paper lead somewhere else: close it on the way.
document.addEventListener('click', (ev) => { if (ev.target.closest('.coo [data-nav]')) $('#modal').classList.remove('show', 'nofoot'); });
