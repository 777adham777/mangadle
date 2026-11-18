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
