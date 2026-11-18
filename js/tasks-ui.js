'use strict';
/* ==========================================================================
   TRI-REALM — daily and weekly objectives on the Overview. Engine: tasks.js.
   ========================================================================== */

function taskText(t) {
  const W = REALMS[t.realm] ? REALMS[t.realm].name : '';
  if (t.kind === 'kill') return `Defeat ${fmt(t.n)} foes in ${ZONES.find((z) => z.id === t.target).name}`;
  if (t.kind === 'boss') return `Defeat ${ZONES.find((z) => z.id === t.target).enemies[0].name} ${t.n} times`;
  if (t.kind === 'gather') return `Gather ${fmt(t.n)} ${ITEMS[t.target].name}`;
  if (t.kind === 'craft') return `Make ${fmt(t.n)} ${ITEMS[t.target].name}`;
  if (t.kind === 'voyage') return `Bring ${t.n} ships back from expeditions`;
  if (t.kind === 'tech') return `Use techniques ${fmt(t.n)} times in battle`;
  return W;
}
const taskIcon = (t) => (t.kind === 'kill' || t.kind === 'boss' ? ic('zone', t.target) : t.kind === 'voyage' ? ic('skill', 'voyaging') : t.kind === 'tech' ? ui('technique') : itemIc(t.target));
const taskGo = (t) => (t.kind === 'kill' || t.kind === 'boss' || t.kind === 'tech' ? 'battle' : t.kind === 'voyage' ? 'realm:seas:voyaging' : `realm:${t.realm}:${t.skill}`);
function taskRow(t, i) {
  const p = taskProg(t), done = p >= t.n;
  return `<div class="task ${t.claimed ? 'claimed' : done ? 'done' : ''}">${tile(null, null, { r: t.weekly ? 4 : 2, icon: taskIcon(t), cls: 'xs' })}
    <span class="tk-main"><b>${esc(taskText(t))}</b><small>${t.realm && REALMS[t.realm] ? REALMS[t.realm].name + ' · ' : ''}${ui('gold')}${fmt(taskGold(t) * goldMult())} · ${taskScrolls(t)} scroll${taskScrolls(t) > 1 ? 's' : ''}${t.weekly && realmOpen('hex') ? ' · 5 Cursed Fragments' : ''}</small>
      <span class="pbar"><i style="width:${(p / t.n) * 100}%"></i></span></span>
    <span class="tk-cta">${t.claimed ? `<em class="ok">${ui('check')}Done</em>` : done ? gbtn('Claim', 'check', `data-task="${t.weekly ? 'w' : 'd'}:${i}"`, 'sm glow') : `<small>${fmt(p)} / ${fmt(t.n)}</small>${gbtn('Go', 'play', `data-nav="${taskGo(t)}"`, 'dark sm')}`}</span></div>`;
}
UIX.homeTop.push(() => {
  if (!tasksOn()) return '';
  const T = S.tasks;
  return `<section class="win tasks">${hdr('Daily objectives', `new ones in ${fmtTime((nextDay() - Date.now()) / 1000)}`)}
    <div class="task-list">${T.daily.map((t, i) => taskRow(t, i)).join('') || '<div class="empty-note">Nothing today.</div>'}</div>
    ${hdr('Weekly objectives', `new ones in ${fmtTime((nextWeek() - Date.now()) / 1000)}`)}
    <div class="task-list">${T.weekly.map((t, i) => taskRow(t, i)).join('') || '<div class="empty-note">Nothing this week.</div>'}</div></section>`;
});
on('task', (d) => toast(`Objective done: +${fmt(d.gold)} gold`, 'rare'));
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
  const techTile = (id) => tile(null, techLv(id) ? `Lv ${techLv(id)}` : null, { r: techLv(id) ? Math.min(5, 1 + Math.floor(techLv(id) / 3)) : 0, icon: ic('technique', id), unknown: !techLv(id), cls: 'xs', title: techLv(id) ? TECHNIQUES[id].name : 'Unknown technique' });
  const foeTile = (n) => tile(null, seen[n] ? fmt(seen[n]) : null, { r: seen[n] ? 2 : 0, icon: ic('enemy', n), unknown: !seen[n], cls: 'xs', title: seen[n] ? `${n} · defeated ${fmt(seen[n])}` : 'Unknown foe' });
  const beastTile = (b) => tile(null, S.beasts[b] ? `Lv ${beastLv(b)}` : null, { r: S.beasts[b] ? 4 : 0, icon: ic('beast', b), unknown: !S.beasts[b], cls: 'xs', title: S.beasts[b] ? BEASTS[b].name : 'Unknown beast' });
  return `<section class="win col-extra">
    ${hdr('Techniques', `${known.length} / ${techs.length}`)}<div class="col-grid">${techs.map(techTile).join('')}</div>
    ${hdr('Bestiary', `${met.length} / ${foes.length} foes defeated`)}<div class="col-grid">${foes.map(foeTile).join('')}</div>
    ${hdr('Companions', `${caught.length} / ${beasts.length}`)}<div class="col-grid">${beasts.map(beastTile).join('')}</div>
  </section>`;
});
