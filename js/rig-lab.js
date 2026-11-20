'use strict';
/* ==========================================================================
   TRI-REALM — Rig Lab (rig.html)
   The validation page of the character system: the canonical model, the
   animations played live, the haircuts (the reference sheet's originals as
   assets on the skull), and the automated checks over every combination of
   cosmetics. Nothing here is used by the game.
   ========================================================================== */
(() => {
  const $ = (id) => document.getElementById(id);
  const f2 = RIG.f2, esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
  const DYES = [RIG_HAIR_DEFS[RIG_HAIR_REF].c, '#2b2e44', '#6b4a36', '#e8b830', '#d8503a', '#4f9a5c', '#e9edf6'];
  // the first haircut shown: the sheet's own reference cut, as an asset (the procedural recipe stays in the list)
  const RIG_HAIR_START = typeof RIG_HAIR_ASSETS !== 'undefined' && RIG_HAIRS.leafsun ? 'leafsun' : RIG_HAIR_REF;
  const isRecipe = (id) => !!RIG_HAIR_DEFS[id];
  const L = {
    hair: RIG_HAIR_START, dye: null, outfit: 'traveler', weapon: 'katana', face: 'calm',
    base: 'idle', anim: 'idle', speed: 1, playing: true, t: 0,
    canon: { bones: true, names: false, groups: false, grid: true, dressed: false },
    view: { bones: false, groups: false },
  };
  const hairCache = {};
  const hairOf = (id, dye) => {
    if (!id || id === 'none') return null;
    const k = id + (dye || '');
    if (!hairCache[k]) hairCache[k] = dye && isRecipe(id) ? rigHairstyle(Object.assign({}, RIG_HAIR_DEFS[id], { c: dye })) : RIG_HAIRS[id];
    return hairCache[k];
  };
  const skinsOf = (o) => [RIG_BODY, o.outfit !== 'none' ? RIG_OUTFITS[o.outfit] : null, RIG_FACES[o.face], o.weapon !== 'none' ? RIG_WEAPONS[o.weapon] : null, hairOf(o.hair, o.dye), RIG_FX].filter(Boolean);
  const btn = (label, on, data, cls) => `<button class="tg ${on ? 'on' : ''} ${cls || ''}" ${data}>${esc(label)}</button>`;
  RIG.defs();

  /* ------------------------------------------------------------- 1 canonical model */
  function headGrid() {
    const C = RIG_CANON, u = 2 * C.headR;
    let s = `<path d="M-68,0H68" stroke="#8d95a8" stroke-width=".4"/>`;
    for (let i = 1; i * u <= C.height + 1; i++) s += `<path d="M-68,${-i * u}H68" stroke="#8d95a8" stroke-width=".25" stroke-dasharray="2 2"/><text x="-67" y="${-i * u - 1.5}" font-size="5" fill="#8d95a8">${i} head${i > 1 ? 's' : ''}</text>`;
    s += `<path d="M-68,${-C.height}H68" stroke="#ff9a3c" stroke-width=".35"/><text x="30" y="${-C.height - 1.8}" font-size="5" fill="#ff9a3c">${f2(C.height / u)} heads</text>`;
    return s;
  }
  function pointsOverlay(pose) {
    let s = '';
    for (const [n, [bone, at]] of Object.entries(RIG_SKELETON.points || {})) {
      const F = RIG.frameOf(pose, pose.c.idx[bone]), p = RIG.toWorld(F, at);
      s += `<path d="M${f2(p[0])},${f2(p[1] - 1.8)}l1.8,1.8 -1.8,1.8 -1.8,-1.8Z" fill="#33dd88" stroke="#0b0d12" stroke-width=".3"/>`;
      if (L.canon.names) s += `<text x="${f2(p[0] + 2.4)}" y="${f2(p[1] + 1.2)}" font-size="3.4" fill="#33dd88">${n}</text>`;
    }
    return s;
  }
  function drawCanon() {
    const skins = L.canon.dressed ? skinsOf(Object.assign({}, L, { dye: L.dye })) : [RIG_BODY, RIG_FACES.calm];
    const ch = new RIG.Character(RIG_SKELETON, skins, {});
    const ov = { bones: L.canon.bones, names: L.canon.names, groups: L.canon.groups, skins };
    $('canonStage').innerHTML = `<svg viewBox="-72 -186 144 196" style="width:100%;max-height:600px">${L.canon.grid ? headGrid() : ''}${ch.svg({ uid: 'cn', overlay: ov })}${L.canon.bones ? pointsOverlay(ch.pose) : ''}</svg>`;
    $('canonToggles').innerHTML = [['bones', 'Skeleton'], ['names', 'Names'], ['groups', 'Ink groups'], ['grid', 'Head units'], ['dressed', 'Dressed']].map(([k, l]) => btn(l, L.canon[k], `data-canon="${k}"`)).join('');
  }
  function canonTable() {
    const C = RIG_CANON, c = RIG.compile(RIG_SKELETON), n = C.len, r = C.r;
    const rows = [
      ['Height', `${f2(C.height)} units · ${f2(C.height / (2 * C.headR))} heads`], ['Skull radius (every head asset)', C.headR],
      ['Pelvis → waist → neck base → neck → skull', `${n.torso} · ${n.chest} · ${n.neck} · ${n.head}`],
      ['Upper arm · forearm · hand (to the grip)', `${n.upperArm} · ${n.foreArm} · ${n.hand}`], ['Thigh · shin · foot', `${n.thigh} · ${n.shin} · ${n.foot}`],
      ['Ankle above the sole', C.footH], ['Shoulder joints (near · far)', `${C.shoulder.near} · ${C.shoulder.far}, 7 under the neck base`],
      ['Hip joints (near · far)', `${C.hipJoint.near} · ${C.hipJoint.far}`],
      ['Limb radii (root → end)', `arm ${r.upperArm.join('→')} · ${r.foreArm.join('→')}, leg ${r.thigh.join('→')} · ${r.shin.join('→')}`],
      ['Outline', `${C.lineW} units, every asset (+ sticker rim)`], ['Light', C.light],
      ['Rig', `${c.bones.length} bones · ${c.slots.length} slots · ${new Set(c.slots.map((s) => s.ink)).size} ink groups · 2 IK legs · 1 spring`],
    ];
    $('canonTable').innerHTML = rows.map(([a, b]) => `<tr><td>${esc(a)}</td><td>${esc(b)}</td></tr>`).join('');
    $('canonRules').innerHTML = [
      '<b>3/4 view facing right.</b> The near side (N) is on the left of the picture, the far side (F) on the right, partly behind the body and drawn a little darker.',
      '<b>One draw order.</b> Back hair, far arm, far leg, near leg, body, clothes, head, hair, near arm. An animation may only move a whole ink group with a named key (the arm behind the head on a wind-up).',
      '<b>Joints overlap.</b> Every joint is a round end under the next piece; the pieces of a limb share one outline, so it bends without a seam. The pelvis covers both hip joints.',
      '<b>Animations rotate bones.</b> Only the hip and the foot targets move; legs follow by IK. Nothing ever scales.',
      '<b>Cosmetics are skins.</b> Attachments and colours only, in the frame of a bone. Feet and shoes fit the foot box; garments sit at most ' + RIG_CANON.clothMax + ' over the body.',
    ].map((x) => `<li>${x}</li>`).join('');
  }

  /* ------------------------------------------------------------- 2 the player */
  let ch = null, last = 0, onion = [];
  function rebuild() {
    const st = ch && ch.state;
    ch = new RIG.Character(RIG_SKELETON, skinsOf(L), RIG_ANIMS);
    if (st && st.cur) { ch.state.play(st.cur.name, { loop: st.cur.loop, mix: 0 }); ch.state.t = st.t; }
    else ch.state.play('idle', { loop: true });
  }
  function play(name) {
    const a = RIG_ANIMS[name];
    L.anim = name;
    if (a.loop) { L.base = name; ch.state.play(name, { loop: true, mix: 0.18 }); }
    else { ch.state.play(name, { mix: 0.1 }); if (name !== 'death') ch.state.then(L.base, { loop: true, mix: 0.18 }); }
    L.playing = true;
    controls();
  }
  function controls() {
    $('playAnims').innerHTML = '<label>Play</label>' + Object.keys(RIG_ANIMS).map((n) => btn(n[0].toUpperCase() + n.slice(1), L.anim === n, `data-play="${n}"`)).join('')
      + `<label style="margin-left:8px">Combat</label>${btn('Run in, strike', false, 'data-combo="strike"', 'act')}${btn('Take a hit', false, 'data-combo="hit"', 'act')}${btn('Defeat', false, 'data-combo="death"', 'act')}`;
    $('playSpeed').innerHTML = '<label>Speed</label>' + [0.1, 0.25, 0.5, 1].map((s) => btn(s + '×', L.speed === s, `data-speed="${s}"`)).join('');
    $('playToggles').innerHTML = btn('Skeleton', L.view.bones, 'data-view="bones"') + btn('Ink groups', L.view.groups, 'data-view="groups"');
    $('playPause').textContent = L.playing ? 'Pause' : 'Play';
    const pick = (id, label, list, key) => { $(id).innerHTML = `<label>${label}</label>` + list.map(([v, l]) => btn(l, L[key] === v, `data-pick="${key}:${v}"`)).join(''); };
    $('pickHair').innerHTML = `<label>Hair</label><select id="hairSel">${hairGroups().map(([g, ids]) => `<optgroup label="${esc(g)}">${ids.map((k) => `<option value="${k}" ${L.hair === k ? 'selected' : ''}>${esc(RIG_HAIRS[k].label)}</option>`).join('')}</optgroup>`).join('')}<option value="none" ${L.hair === 'none' ? 'selected' : ''}>None</option></select>`;
    $('pickDye').style.display = isRecipe(L.hair) ? '' : 'none';
    $('pickDye').innerHTML = '<label>Dye</label>' + DYES.map((c) => `<button class="sw ${(L.dye || RIG_HAIR_DEFS[RIG_HAIR_REF].c) === c ? 'on' : ''}" style="background:${c}" data-dye="${c}" title="${c}"></button>`).join('');
    pick('pickOutfit', 'Outfit', [...Object.keys(RIG_OUTFITS).map((k) => [k, RIG_OUTFITS[k].label]), ['none', 'Bare']], 'outfit');
    pick('pickWeapon', 'Weapon', [...Object.keys(RIG_WEAPONS).map((k) => [k, RIG_WEAPONS[k].label]), ['none', 'None']], 'weapon');
    pick('pickFace', 'Face', Object.keys(RIG_FACES).map((k) => [k, RIG_FACES[k].label]), 'face');
  }
  function frame(now) {
    requestAnimationFrame(frame);
    const dt = Math.min(0.05, (now - (last || now)) / 1000);
    last = now;
    if (!ch) return;
    if (L.playing) ch.tick(dt * L.speed);
    else ch.at(L.anim, L.t);
    const cur = ch.state.cur, a = cur ? cur.a : RIG_ANIMS[L.anim], t = L.playing ? ch.state.time() : L.t;
    if (L.playing && cur) { L.anim = cur.name; $('scrub').value = Math.round((t / a.dur) * 1000); }
    $('time').textContent = `${(cur || {}).name || L.anim} ${t.toFixed(2)} s`;
    const ov = (L.view.bones || L.view.groups) ? { bones: L.view.bones, groups: L.view.groups, skins: ch.skins } : null;
    $('playStage').innerHTML = `<svg viewBox="-98 -198 196 212" style="width:100%;max-height:560px">${ch.svg({ uid: 'pl', overlay: ov })}</svg>`;
  }

  /* ------------------------------------------------------------- frames */
  function strips() {
    const skins = skinsOf(L), c2 = new RIG.Character(RIG_SKELETON, skins, RIG_ANIMS);
    let h = '';
    for (const [name, a] of Object.entries(RIG_ANIMS)) {
      const n = name === 'idle' ? 6 : 9, wide = name === 'death';
      h += `<div class="strip"><h4>${name}</h4>`;
      for (let i = 0; i < n; i++) {
        const t = a.loop ? (a.dur * i) / n : (a.dur * i) / (n - 1);
        c2.at(name, t);
        h += `<figure><svg viewBox="${wide ? '-136 -192 236 204' : '-80 -204 160 216'}" width="${wide ? 172 : 116}" height="152">${c2.svg({ uid: `s${name}${i}` })}</svg><figcaption>${t.toFixed(2)}s</figcaption></figure>`;
      }
      h += '</div>';
    }
    $('strips').innerHTML = h;
  }

  /* ------------------------------------------------------------- 3 hair */
  function landmarks() {
    const R = RIG_HEAD, pl = (P, c, w) => `<path d="M${P.map(RIG.P2).join('L')}" fill="none" stroke="${c}" stroke-width="${w || 0.5}" stroke-linecap="round"/>`;
    let s = `<path d="M${RIG_SCALP.map(RIG.P2).join('L')}Z" fill="#3aa0ff" fill-opacity=".16" stroke="#3aa0ff" stroke-width=".3"/>`;
    s += pl(R.hairline, '#ff4f7f', 0.7) + pl(R.sideburnN, '#ffb020', 0.6) + pl(R.sideburnF, '#ffb020', 0.6) + pl(R.nape, '#ffb020', 0.6);
    for (const k of ['N', 'F']) { const E = R.eyes[k]; s += `<ellipse cx="${E.c[0]}" cy="${E.c[1]}" rx="${E.rx}" ry="${E.ry}" fill="none" stroke="#33dd88" stroke-width=".45" stroke-dasharray="1 .6"/>`; }
    s += `<circle cx="${R.crown[0]}" cy="${R.crown[1]}" r=".9" fill="#ff4f7f"/>`;
    for (const k of ['N', 'F']) s += `<circle cx="${R.temples[k][0]}" cy="${R.temples[k][1]}" r=".7" fill="#ffb020"/>`;
    for (let x = -15; x <= 16; x += 4) for (let y = -17; y <= 12; y += 4) {
      if (!RIG_CHECK.inside([x, y], RIG_SCALP)) continue;
      const a = rigFlow([x, y], 'fall') * RIG.D2R;
      s += `<path d="M${x},${y}l${f2(Math.cos(a) * 2.6)},${f2(Math.sin(a) * 2.6)}" stroke="#fff" stroke-width=".35" opacity=".85"/><circle cx="${f2(x + Math.cos(a) * 2.6)}" cy="${f2(y + Math.sin(a) * 2.6)}" r=".35" fill="#fff"/>`;
    }
    return s;
  }
  function headView(skins, uid, size, extra) {
    const c2 = new RIG.Character(RIG_SKELETON, skins, {}), w = c2.pose.W[c2.pose.c.idx.skull];
    return `<svg viewBox="${f2(w.x - 52)} ${f2(w.y - 54)} 104 88" width="100%" style="max-width:${size}px">${c2.svg({ uid })}${extra ? `<g transform="translate(${f2(w.x)},${f2(w.y)})">${extra}</g>` : ''}</svg>`;
  }
  // the haircuts by world (the sheet's rows), then the procedural recipe
  function hairGroups() {
    const g = [], A = typeof RIG_HAIR_ASSETS !== 'undefined' ? RIG_HAIR_ASSETS : {};
    for (const [w, name] of Object.entries(typeof RIG_HAIR_WORLDS !== 'undefined' ? RIG_HAIR_WORLDS : {})) g.push([name, Object.keys(A).filter((k) => A[k].world === w && RIG_HAIRS[k])]);
    g.push(['Procedural recipe', Object.keys(RIG_HAIRS).filter((k) => !A[k])]);
    return g.filter(([, ids]) => ids.length);
  }
  const BASE = () => [RIG_BODY, RIG_OUTFITS.traveler, RIG_FACES.calm];
  const exprSkin = (e) => ({ name: 'expr:' + e, att: { face: { neutral: RIG_FACES.calm.att.face[e] } } });
  // the picture alone, in skull units, on a checkerboard: the skull and the eye boxes it leaves clear
  function assetView(A, id, F) {
    const H = RIG_HEAD, eye = (k) => { const E = H.eyes[k]; return `<ellipse cx="${E.c[0]}" cy="${E.c[1]}" rx="${E.rx}" ry="${E.ry}" fill="none" stroke="#33dd88" stroke-width=".45" stroke-dasharray="1 .6"/>`; };
    return `<svg viewBox="-52 -54 104 88" width="100%" style="max-width:240px"><defs><pattern id="chk${esc(id)}" width="4" height="4" patternUnits="userSpaceOnUse"><rect width="4" height="4" fill="#9aa1b0"/><rect width="2" height="2" fill="#c3c8d2"/><rect x="2" y="2" width="2" height="2" fill="#c3c8d2"/></pattern></defs>`
      + `<rect x="-52" y="-54" width="104" height="88" fill="url(#chk${esc(id)})"/><image href="${F.href}" x="${F.x}" y="${F.y}" width="${F.w}" height="${F.h}" preserveAspectRatio="none"/>`
      + `<rect x="${F.x}" y="${F.y}" width="${F.w}" height="${F.h}" fill="none" stroke="#ff9a3c" stroke-width=".4" stroke-dasharray="2 1"/><circle r="19" fill="none" stroke="#3aa0ff" stroke-width=".5" stroke-dasharray="1.5 1"/>${eye('N')}${eye('F')}<circle r=".9" fill="#ff4f7f"/></svg>`;
  }
  function lyingView(skins, uid) {
    const c2 = new RIG.Character(RIG_SKELETON, skins, RIG_ANIMS);
    c2.at('death', RIG_ANIMS.death.dur);
    return `<svg viewBox="-136 -62 236 74" width="100%" style="max-width:300px">${c2.svg({ uid })}</svg>`;
  }
  function cutDetail() {
    const id = L.hair, H = RIG_HAIRS[id];
    for (const el of document.querySelectorAll('#gallery figure[data-pick]')) el.classList.toggle('on', el.dataset.pick === 'hair:' + id);
    if (!H) { $('cutTitle').textContent = 'No hair'; $('cutDetail').innerHTML = ''; return; }
    const A = H.meta && H.meta.image, base = BASE(), hair = hairOf(id, L.dye);
    $('cutTitle').textContent = H.label + (A ? ` · ${RIG_HAIR_WORLDS[A.world]} · sheet cell ${A.sheet}` : ' · procedural recipe');
    let h = '';
    if (A) {
      const F = HAIR_FIT.get(id, 'rig'), m = F.measure;
      h += `<figure>${assetView(A, id, HAIR_FIT.raw(id))}<figcaption><b>The asset</b>${esc(id)}.png, ${A.w.toFixed(0)} × ${A.h.toFixed(0)} skull units at (${A.x.toFixed(1)}, ${A.y.toFixed(1)})${A.covers ? ` · hides the ${A.covers === 'F' ? 'far' : 'near'} eye` : ''}${A.ear ? '' : ' · covers the ear'}</figcaption></figure>`;
      h += `<figure>${assetView(A, id + 'f', F)}<figcaption><b>Fitted to this head</b>${F.fitted ? `morphed: eyes ${Math.round(m.eyes[0] * 100)} / ${Math.round(m.eyes[1] * 100)} % covered, scalp ${Math.round(m.top * 100)} %, rim ${Math.round(m.rim * 100)} %` : 'not fitted yet (plain picture)'}</figcaption></figure>`;
    }
    h += `<figure>${headView([...base, hair], 'cd0', 240)}<figcaption><b>On the rig</b>the rig's own head, face, ear and outline</figcaption></figure>`;
    h += ['angry', 'hurt', 'dead', 'happy'].map((e, i) => `<figure>${headView([...base, exprSkin(e), hair], 'cde' + i, 200)}<figcaption><b>${e[0].toUpperCase() + e.slice(1)}</b>the rig's expression shows through</figcaption></figure>`).join('');
    h += `<figure style="grid-column:span 2">${lyingView([...base, hair], 'cdl')}<figcaption><b>Lying down</b>end of the death animation: pressed flat on the floor</figcaption></figure>`;
    $('cutDetail').innerHTML = h;
  }
  function hairSection() {
    $('headRef').innerHTML = `<div style="padding:8px 0">${headView(BASE(), 'hr', 520, landmarks())}</div>`;
    const base = BASE();
    $('gallery').innerHTML = hairGroups().map(([g, ids], gi) => `<h4>${esc(g)}</h4><div class="layers cuts">${ids.map((k, i) => `<figure data-pick="hair:${k}" class="${L.hair === k ? 'on' : ''}">${headView([...base, hairOf(k)], `g${gi}_${i}`, 170)}<figcaption><b>${esc(RIG_HAIRS[k].label)}</b>${esc(k)}</figcaption></figure>`).join('')}</div>`).join('');
    cutDetail();
  }
  // every hair picture must load (a missing file would leave a bald character)
  function imageChecks() {
    const ids = typeof RIG_HAIR_ASSETS !== 'undefined' ? Object.keys(RIG_HAIR_ASSETS) : [];
    return Promise.all(ids.map((id) => new Promise((ok) => { const im = new Image(); im.onload = () => ok([id, im.naturalWidth > 0]); im.onerror = () => ok([id, false]); im.src = RIG_HAIR_BASE + id + '.png'; })))
      .then((rs) => { const bad = rs.filter(([, v]) => !v).map(([id]) => id); return { group: 'Attachments', id: 'att.images', name: 'Every hair picture loads', anim: null, status: bad.length ? 'fail' : 'pass', detail: bad.length ? `missing: ${bad.join(', ')}` : `${rs.length} pictures` }; });
  }

  /* ------------------------------------------------------------- 4 checks */
  // The hair rides the skull, so the body combinations are played with one hair, and every other
  // hair with one dressed body (hairAxis 'separate'); all of it in steps, so the page stays live.
  async function runChecks() {
    const t0 = performance.now(), st0 = $('status');
    const first = RIG_HAIRS[RIG_HAIR_START], hairs = [first, ...Object.values(RIG_HAIRS).filter((h) => h !== first)];
    const sets = { hair: hairs, outfit: [null, ...Object.values(RIG_OUTFITS)], weapon: [null, ...Object.values(RIG_WEAPONS)], face: Object.values(RIG_FACES) };
    // every cut is first fitted to the rig's head (HAIR_FIT), then the gallery shows the fitted cuts
    if (typeof HAIR_FIT !== 'undefined') {
      let n = 0;
      const ids = Object.keys(HAIR_CUTS);
      await Promise.all(ids.map((id) => HAIR_FIT.ready(id, 'rig').then(() => { st0.textContent = `Fitting the cuts… ${++n}/${ids.length}`; })));
      hairSection(); strips();
    }
    const R = await RIG_CHECK.allAsync(sets, { fps: 30, hairAxis: 'separate' }, (i, n) => { st0.textContent = `Checking… ${i}/${n}`; });
    R.results.push(await imageChecks());
    const S = RIG_CHECK.selfTest(), ms = Math.round(performance.now() - t0);
    const fails = R.results.filter((r) => r.status === 'fail'), caught = S.filter((t) => t.caught).length;
    const ok = !fails.length && caught === S.length;
    const st = $('status');
    st.className = 'pill ' + (ok ? 'ok' : 'bad');
    st.textContent = ok ? `All ${R.results.length} checks pass` : `${fails.length} failing · ${S.length - caught} faults missed`;
    const frames = Object.values(RIG_ANIMS).reduce((n, a) => n + Math.round(a.dur * 30) + 1, 0) * R.matrix.length;
    window.RIG_LAB_RESULT = { ok, checks: R.results.length, fails: fails.map((f) => `${f.id} ${f.anim || ''} ${f.combo || ''}: ${f.detail}`), combos: R.matrix.length, selfTest: `${caught}/${S.length}`, missed: S.filter((t) => !t.caught).map((t) => t.name + (t.err ? ' (' + t.err + ')' : '')), ms };
    $('sum').innerHTML = `<span class="big" style="color:${fails.length ? 'var(--bad)' : 'var(--ok)'}">${R.results.length - fails.length}/${R.results.length}</span><span>checks pass</span>`
      + `<span class="pill">${R.matrix.length} combinations</span><span class="pill">${Object.keys(RIG_ANIMS).length} animations</span><span class="pill">${frames} frames measured</span>`
      + `<span class="pill ${caught === S.length ? 'ok' : 'bad'}">self-test: ${caught}/${S.length} faults caught</span><span class="pill">${ms} ms</span>`;
    // the matrix
    const anims = R.anims;
    $('matrix').innerHTML = `<table class="mx"><tr><th>hair · outfit · weapon · face</th>${anims.map((a) => `<th>${a}</th>`).join('')}</tr>`
      + R.matrix.map((row) => `<tr><td>${esc(row.key)}</td>${anims.map((a) => { const c = row.cells[a]; return c.fails ? `<td class="bad" title="${esc(c.first.detail)}">✗ ${c.fails}</td>` : '<td class="ok">✓</td>'; }).join('')}</tr>`).join('') + '</table>';
    $('selftest').innerHTML = `<table class="res"><tr><th></th><th>Fault injected</th><th>Check</th></tr>${S.map((t) => `<tr><td class="st"><b class="${t.caught ? 'pass' : 'fail'}">${t.caught ? 'caught' : 'missed'}</b></td><td>${esc(t.name)}</td><td><code>${t.id}</code></td></tr>`).join('')}</table>`;
    // all results, merged across combinations: one row per check (and animation)
    const rows = new Map();
    for (const r of R.results) {
      const k = r.id + '|' + (r.anim || '');
      const e = rows.get(k) || { r, n: 0, f: 0, fail: null };
      e.n++;
      if (r.status === 'fail') { e.f++; if (!e.fail) e.fail = r; }
      rows.set(k, e);
    }
    const groups = {};
    for (const e of rows.values()) (groups[e.r.group] || (groups[e.r.group] = [])).push(e);
    const order = ['Canonical model', 'Draw order', 'Joints', 'Intersections', 'Attachments', 'Animations', 'Hair'];
    let h = '<table class="res"><tr><th></th><th>Check</th><th>Animation</th><th>Combinations</th><th>Details</th></tr>';
    for (const g of order.filter((x) => groups[x]).concat(Object.keys(groups).filter((x) => !order.includes(x)))) {
      h += `<tr class="grp"><td colspan="5">${esc(g)}</td></tr>`;
      for (const e of groups[g]) {
        const x = e.fail || e.r, where = e.fail && e.fail.where;
        h += `<tr class="${where ? 'jump' : ''}" ${where ? `data-jump="${where.anim}:${where.t}" data-combo="${esc(e.fail.combo || '')}"` : ''}><td class="st"><b class="${e.f ? 'fail' : 'pass'}">${e.f ? 'fail' : 'pass'}</b></td><td>${esc(x.name)}</td><td>${esc(x.anim || '—')}</td><td>${e.f ? `${e.f}/${e.n} fail` : `${e.n}/${e.n}`}</td><td class="det">${esc(x.detail)}${e.fail && e.fail.combo ? ` <code>${esc(e.fail.combo)}</code>` : ''}</td></tr>`;
      }
    }
    $('results').innerHTML = h + '</table>';
  }

  /* ------------------------------------------------------------- input */
  document.addEventListener('click', (ev) => {
    const b = ev.target.closest('[data-canon],[data-play],[data-combo],[data-speed],[data-view],[data-pick],[data-dye],[data-jump],#playPause');
    if (!b) return;
    if (b.tagName === 'FIGURE' && b.dataset.pick) document.getElementById('cutWin').scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    const d = b.dataset;
    if (d.canon) { L.canon[d.canon] = !L.canon[d.canon]; drawCanon(); return; }
    if (d.jump) {
      const [anim, t] = d.jump.split(':');
      const [hair, outfit, weapon, face] = (d.combo || '').split(' · ');
      if (hair) Object.assign(L, { hair, outfit, weapon, face });
      rebuild(); L.anim = anim; L.t = +t; L.playing = false; L.view.bones = true; controls();
      $('scrub').value = Math.round((+t / RIG_ANIMS[anim].dur) * 1000);
      document.getElementById('anim').scrollIntoView({ behavior: 'smooth' });
      return;
    }
    if (b.id === 'playPause') { L.playing = !L.playing; if (!L.playing) { L.t = ch.state.time(); L.anim = ch.state.cur.name; } else ch.state.play(L.anim, { loop: RIG_ANIMS[L.anim].loop, at: L.t, mix: 0 }); controls(); return; }
    if (d.play) { play(d.play); return; }
    if (d.combo) {
      if (d.combo === 'strike') { L.base = 'idle'; ch.state.play('run', { loop: true, mix: 0.15 }); setTimeout(() => { ch.state.play('attack', { mix: 0.1 }); ch.state.then('idle', { loop: true, mix: 0.2 }); }, 900 / L.speed); }
      if (d.combo === 'hit') { ch.state.play('hit', { mix: 0.06 }); ch.state.then(L.base, { loop: true, mix: 0.2 }); }
      if (d.combo === 'death') { ch.state.play('hit', { mix: 0.06 }); setTimeout(() => ch.state.play('death', { mix: 0.08 }), 160 / L.speed); }
      L.playing = true; controls(); return;
    }
    if (d.speed) { L.speed = +d.speed; controls(); return; }
    if (d.view) { L.view[d.view] = !L.view[d.view]; controls(); return; }
    if (d.dye) { L.dye = d.dye === RIG_HAIR_DEFS[RIG_HAIR_REF].c ? null : d.dye; rebuild(); controls(); strips(); cutDetail(); if (L.canon.dressed) drawCanon(); return; }
    if (d.pick) { const [k, v] = d.pick.split(':'); L[k] = v; if (k === 'hair' && !isRecipe(v)) L.dye = null; rebuild(); controls(); strips(); if (k === 'hair') cutDetail(); if (L.canon.dressed) drawCanon(); }
  });
  document.addEventListener('change', (ev) => {
    if (ev.target.id !== 'hairSel') return;
    L.hair = ev.target.value;
    if (!isRecipe(L.hair)) L.dye = null;
    rebuild(); controls(); strips(); cutDetail(); if (L.canon.dressed) drawCanon();
  });
  $('scrub').addEventListener('input', (ev) => {
    if (L.playing) { L.playing = false; L.anim = ch.state.cur.name; }
    L.t = (ev.target.value / 1000) * RIG_ANIMS[L.anim].dur;
    controls();
  });

  /* ------------------------------------------------------------- start */
  canonTable(); drawCanon(); rebuild(); controls(); strips(); hairSection();
  requestAnimationFrame(frame);
  setTimeout(runChecks, 60);
})();
