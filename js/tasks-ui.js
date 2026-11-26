'use strict';
/* ==========================================================================
   ANIME IDLE RPG — daily and weekly objectives, on the Quests page (since 2026-11-25). Engine: tasks.js.
   ========================================================================== */

// "40 Curry Pill" -> "40 Curry Pills": the head noun takes the plural ("Scale of X" -> "Scales of X").
const PLURAL_IRR = { leaf: 'leaves', knife: 'knives', wolf: 'wolves', tooth: 'teeth', foot: 'feet', mouse: 'mice', loaf: 'loaves', man: 'men', fungus: 'fungi', octopus: 'octopuses' };
const PLURAL_SAME = new Set(['fish', 'ore', 'wood', 'meat', 'rice', 'silk', 'sand', 'dust', 'ash', 'salt', 'ink', 'tea', 'bread', 'water', 'moss', 'clay', 'iron', 'steel', 'gold', 'silver', 'copper', 'bamboo', 'coral', 'venom', 'ice', 'sheep', 'deer', 'salmon', 'tuna', 'squid', 'shrimp', 'cod', 'trout', 'carp', 'koi', 'jerky', 'sushi', 'ramen', 'curry', 'stew', 'soup', 'sake', 'oil', 'resin', 'sap', 'charcoal', 'leather', 'cloth', 'honey', 'milk', 'ink', 'flour', 'tofu', 'mochi', 'seaweed', 'kelp', 'obsidian', 'quartz', 'jade', 'amber', 'bronze', 'mithril', 'tin', 'lead', 'coal', 'sulfur', 'mercury', 'tempura', 'sashimi', 'dango', 'onigiri', 'udon', 'soba', 'miso', 'katsu', 'yakitori', 'takoyaki', 'wasabi', 'ginseng', 'ginger', 'garlic', 'pepper', 'catfish', 'heartwood', 'starsteel']);
function plural(name, n) {
  if (n === 1) return name;
  const of = name.search(/ (of|from|with|in) /i);
  if (of > 0) return plural(name.slice(0, of), n) + name.slice(of);
  const rom = name.match(/^(.+) ([IVX]+)$/);
  if (rom) return plural(rom[1], n) + ' ' + rom[2];
  const m = name.match(/^(.*?)([A-Za-z']+)$/);
  if (!m) return name;
  const [, pre, w] = m, lw = w.toLowerCase();
  const out = PLURAL_IRR[lw] || (PLURAL_SAME.has(lw) || /s$/.test(lw) ? lw : /[^aeiou]y$/.test(lw) ? lw.slice(0, -1) + 'ies' : /(x|z|ch|sh)$/.test(lw) ? lw + 'es' : lw + 's');
  return pre + (w[0] !== lw[0] ? out[0].toUpperCase() + out.slice(1) : out);
}
function taskText(t) {
  const W = REALMS[t.realm] ? REALMS[t.realm].name : '';
  if (t.kind === 'kill') return `Defeat ${fmt(t.n)} foes in ${ZONES.find((z) => z.id === t.target).name}`;
  if (t.kind === 'boss') { const nm = ZONES.find((z) => z.id === t.target).enemies[0].name; return `Defeat ${/^(the|a|an) /i.test(nm) ? '' : 'the '}${nm} ${t.n} time${t.n === 1 ? '' : 's'}`; }
  if (t.kind === 'gather') return `Gather ${fmt(t.n)} ${plural(ITEMS[t.target].name, t.n)}`;
  if (t.kind === 'craft') return `Make ${fmt(t.n)} ${plural(ITEMS[t.target].name, t.n)}`;
  if (t.kind === 'voyage') return `Bring ${t.n} ship${t.n === 1 ? '' : 's'} back from expeditions`;
  if (t.kind === 'tech') return `Use techniques ${fmt(t.n)} times in battle`;
  return W;
}
const taskIcon = (t) => (t.kind === 'kill' || t.kind === 'boss' ? ic('zone', t.target) : t.kind === 'voyage' ? ic('skill', 'voyaging') : t.kind === 'tech' ? ui('technique') : itemIc(t.target));
const taskGo = (t) => (t.kind === 'kill' || t.kind === 'boss' || t.kind === 'tech' ? 'battle' : t.kind === 'voyage' ? 'realm:seas:voyaging' : `realm:${t.realm}:${t.skill}`);
function taskRow(t, i) {
  const p = taskProg(t), done = p >= t.n, go = !t.claimed && !done, sc = taskScrolls(t);
  return `<div class="task ${t.claimed ? 'claimed' : done ? 'done' : 'go'}"${go ? ` data-nav="${taskGo(t)}"` : ''}${t.realm && REALMS[t.realm] ? ` title="${esc(REALMS[t.realm].name)}"` : ''}>${tile(null, null, { r: t.weekly ? 4 : 2, icon: taskIcon(t), cls: 'xs' })}
    <span class="tk-main"><b>${esc(taskText(t))}</b><small>${ui('gold')}<em class="gold-n">${fmt(taskGold(t) * goldMult())}</em> · ${sc} scroll${sc > 1 ? 's' : ''}${t.weekly && realmOpen('hex') ? ' · 5 Cursed Fragments' : ''}</small>
      <span class="tk-prog"><span class="pbar"><i style="width:${(p / t.n) * 100}%"></i></span>${t.claimed ? '' : `<small>${fmt(p)} / ${fmt(t.n)}</small>`}</span></span>
    <span class="tk-cta">${t.claimed ? `<em class="ok">${ui('check')}Done</em>` : done ? gbtn('Claim', 'check', `data-task="${t.weekly ? 'w' : 'd'}:${i}"`, 'sm glow') : '<i class="row-go" aria-hidden="true">›</i>'}</span></div>`;
}
UIX.questsBottom.push(() => {
  if (!tasksOn()) return '';
  const T = S.tasks;
  return `<section class="win tasks">${hdr('Daily objectives', `new ones in ${fmtTime((nextDay() - Date.now()) / 1000)}`)}
    <div class="task-list">${T.daily.map((t, i) => taskRow(t, i)).join('') || '<div class="empty-note">Nothing today.</div>'}</div>
    ${hdr('Weekly objectives', `new ones in ${fmtTime((nextWeek() - Date.now()) / 1000)}`)}
    <div class="task-list">${T.weekly.map((t, i) => taskRow(t, i)).join('') || '<div class="empty-note">Nothing this week.</div>'}</div></section>`;
});
on('task', (d) => toast(`Objective done: +${fmt(d.gold)} gold · ${taskScrolls(d.t)} scroll${taskScrolls(d.t) > 1 ? 's' : ''} in your Bank`, 'rare'));
document.addEventListener('click', (ev) => {
  const t = ev.target.closest('[data-task]');
  if (!t || t.disabled) return;
  const [w, i] = t.dataset.task.split(':');
  claimTask(w === 'w', +i);
});

/* ============================================================ Collection Log: techniques, bestiary, companions */
// GDD §6.1: the log also lists techniques, foes and companions (items and pets are in ui.js).
hook('kill', (e) => { const n = e.base || e.name; S.stats.foes = S.stats.foes || {}; S.stats.foes[n] = (S.stats.foes[n] || 0) + 1; });
UIX.collectionTop.push(() => {
  const techs = Object.keys(TECHNIQUES), known = techs.filter(techLv);
  const foes = [...new Set(ZONES.filter((z) => !z.tear && !REALMS[z.realm].hidden || S.gates[z.realm]).flatMap((z) => z.enemies.map((e) => e.name)))];
  const seen = S.stats.foes || {}, met = foes.filter((n) => seen[n]);
  const beasts = Object.keys(BEASTS), caught = beasts.filter((b) => S.beasts[b]);
  const techTile = (id) => tile(null, techLv(id) ? `Lv ${techLv(id)}` : null, { r: techLv(id) ? Math.min(5, 1 + Math.floor(techLv(id) / 3)) : 0, icon: ic('technique', id), unknown: !techLv(id), cls: 'xs', tip: `data-ttip="${id}"` });
  const foeTile = (n) => tile(null, seen[n] ? fmt(seen[n]) : null, { r: seen[n] ? 2 : 0, icon: ic('enemy', n), unknown: !seen[n], cls: 'xs' + (selCol === 'foe:' + n ? ' on' : ''), tag: 'button', attrs: `data-col="foe:${esc(n)}"`, title: seen[n] ? `${n} · defeated ${fmt(seen[n])}` : 'Unknown foe' });
  const beastTile = (b) => tile(null, S.beasts[b] ? `Lv ${beastLv(b)}` : null, { r: S.beasts[b] ? 4 : 0, icon: ic('beast', b), unknown: !S.beasts[b], cls: 'xs', title: S.beasts[b] ? BEASTS[b].name : 'Unknown beast' });
  return `<section class="win col-extra">
    ${hdr('Techniques', `${known.length} / ${techs.length}`)}<div class="col-grid">${techs.map(techTile).join('')}${colMore(techs.length - known.length)}</div>
    ${hdr('Bestiary', `${met.length} / ${foes.length} foes defeated`)}<div class="col-grid">${foes.map(foeTile).join('')}${colMore(foes.length - met.length)}</div>${selCol && selCol.startsWith('foe:') && typeof foeDetailHTML === 'function' ? `<div class="bst-detail">${foeDetailHTML(selCol.slice(4))}</div>` : ''}
    ${hdr('Companions', `${caught.length} / ${beasts.length}`)}<div class="col-grid">${beasts.map(beastTile).join('')}${colMore(beasts.length - caught.length)}</div>
  </section>`;
});
