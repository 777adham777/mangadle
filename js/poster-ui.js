'use strict';
/* ==========================================================================
   ANIME IDLE RPG — the Wanted poster on screen (poster.js holds the codes)
   "Wanted poster" (Character view, and the Replay highlight of a rare find) opens a
   window: the poster drawn on a canvas (your weapon, your Bounty, your latest feat),
   your name, Share / Save image, your friend code, and your friends' codes.
   Item art is the game's own (SVG or images), turned into images for the canvas.
   Loaded after ui.js and character-ui.js.
   ========================================================================== */

Object.assign(ICONS.ui, { poster: 'wanted-reward' });

// The latest feat: the newest Rare+ item in your collection (or the one asked for).
function posterFeat(id) {
  if (id && ITEMS[id]) return id;
  const at = S.stats.foundAt || {};
  const ids = Object.keys(at).filter((k) => ITEMS[k] && !ITEMS[k].variant && rarity(k) >= 3).sort((a, b) => at[b] - at[a] || rarity(b) - rarity(a));
  if (ids.length) return ids[0];
  return Object.keys(S.found).filter((k) => ITEMS[k] && !ITEMS[k].variant).sort((a, b) => rarity(b) - rarity(a))[0] || null;
}

/* ---------------------------------------------------------------- SVG to image */
const dataUrlCache = {};
async function toDataUrl(src) {
  if (dataUrlCache[src]) return dataUrlCache[src];
  const blob = await (await fetch(src)).blob();
  const url = await new Promise((ok) => { const r = new FileReader(); r.onload = () => ok(r.result); r.readAsDataURL(blob); });
  return (dataUrlCache[src] = url);
}
async function svgImage(svg, w, h) {
  let s = svg.replace(/^<svg\b/, `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${w}" height="${h}"`);
  const hrefs = [...new Set([...s.matchAll(/<image[^>]*?\shref="([^"]+)"/g)].map((m) => m[1]).filter((u) => !u.startsWith('data:')))];
  for (const u of hrefs) { try { s = s.split(`href="${u}"`).join(`href="${await toDataUrl(u)}"`); } catch (e) { /* drawn without it */ } }
  const img = new Image();
  img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(s);
  await img.decode();
  return img;
}
// A friend (or you) as a badge: the initial of the name.
const friendBadge = (n) => `<span class="npc-face mono"><b>${esc(String(n || '?').trim().charAt(0).toUpperCase() || '?')}</b></span>`;
function itemSVG(id) {
  const a = typeof artId === 'function' ? artId(id) : null, sym = a && document.getElementById('ia-' + a);
  if (!sym) return null;
  const defs = $('#gi-sprite defs');
  return `<svg viewBox="${sym.getAttribute('viewBox') || '0 0 64 64'}"><defs>${defs ? defs.innerHTML : ''}</defs>${sym.innerHTML}</svg>`;
}

/* ---------------------------------------------------------------- the poster */
const POSTER_W = 720, POSTER_H = 1020;
function wrapText(c, text, x, y, maxW, lh) {
  const words = text.split(' ');
  let line = '';
  for (const w of words) {
    const t = line ? line + ' ' + w : w;
    if (c.measureText(t).width > maxW && line) { c.fillText(line, x, y); line = w; y += lh; } else line = t;
  }
  if (line) c.fillText(line, x, y);
}
async function drawPoster(canvas, featId) {
  const c = canvas.getContext('2d');
  canvas.width = POSTER_W; canvas.height = POSTER_H;
  // parchment
  const g = c.createRadialGradient(POSTER_W / 2, POSTER_H / 2, 120, POSTER_W / 2, POSTER_H / 2, 760);
  g.addColorStop(0, '#f1dfb6'); g.addColorStop(0.7, '#dcc08a'); g.addColorStop(1, '#a8834c');
  c.fillStyle = g; c.fillRect(0, 0, POSTER_W, POSTER_H);
  let seed = 7;
  const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  for (let i = 0; i < 900; i++) { c.fillStyle = `rgba(90,60,25,${rnd() * 0.07})`; c.beginPath(); c.arc(rnd() * POSTER_W, rnd() * POSTER_H, rnd() * 3 + 0.5, 0, 7); c.fill(); }
  c.strokeStyle = '#5a3c1c'; c.lineWidth = 6; c.strokeRect(22, 22, POSTER_W - 44, POSTER_H - 44);
  c.lineWidth = 2; c.strokeRect(34, 34, POSTER_W - 68, POSTER_H - 68);
  const ink = '#3a2412';
  c.fillStyle = ink; c.textAlign = 'center'; c.textBaseline = 'alphabetic';
  c.font = '800 128px "Exo 2", "Saira Condensed", sans-serif';
  c.fillText('WANTED', POSTER_W / 2, 168);
  // the photo
  const fx = 84, fy = 196, fw = POSTER_W - 168, fh = 440;
  const realm = frontier(), col = rc(realm);
  const bg = c.createLinearGradient(0, fy, 0, fy + fh);
  bg.addColorStop(0, '#2a2a33'); bg.addColorStop(1, col);
  c.fillStyle = bg; c.fillRect(fx, fy, fw, fh);
  // the photo shows what you fight with: your weapon, big (bare hands: your world's emblem)
  try {
    const wid = S.equip && S.equip.weapon, src = wid && typeof ITEM_IMAGE_PATHS !== 'undefined' && ITEM_IMAGE_PATHS[wid];
    const sym = document.getElementById('gi-' + icName('realm', realm));
    const svg = !src && ((wid && itemSVG(wid)) || (sym ? `<svg viewBox="0 0 512 512"><g fill="#f1dfb6" opacity=".85">${sym.innerHTML}</g></svg>` : null));
    const art = src ? await new Promise((ok, no) => { const im = new Image(); im.onload = () => ok(im); im.onerror = no; im.src = src; }) : svg ? await svgImage(svg, 380, 380) : null;
    if (!art) throw new Error('no art');
    c.save(); c.beginPath(); c.rect(fx, fy, fw, fh); c.clip();
    c.shadowColor = 'rgba(0,0,0,0.55)'; c.shadowBlur = 30; c.shadowOffsetY = 12;
    c.drawImage(art, fx + fw / 2 - 190, fy + fh / 2 - 190, 380, 380);
    c.restore();
  } catch (e) { /* the frame stays empty */ }
  c.globalCompositeOperation = 'multiply'; c.fillStyle = 'rgba(200,160,100,0.35)'; c.fillRect(fx, fy, fw, fh); c.globalCompositeOperation = 'source-over';
  c.strokeStyle = ink; c.lineWidth = 8; c.strokeRect(fx, fy, fw, fh);
  // text
  c.fillStyle = ink;
  c.font = '700 40px "Exo 2", "Saira Condensed", sans-serif';
  c.fillText('DEAD OR ALIVE', POSTER_W / 2, fy + fh + 52);
  c.font = '800 70px "Exo 2", "Saira Condensed", sans-serif';
  c.fillText(heroName().toUpperCase(), POSTER_W / 2, fy + fh + 124, POSTER_W - 120);
  c.font = '800 58px "Exo 2", "Saira Condensed", sans-serif';
  c.fillText('฿ ' + Math.floor(S.bounty || 0).toLocaleString('en-US') + ' -', POSTER_W / 2, fy + fh + 192, POSTER_W - 120);
  c.font = '600 22px "Saira", sans-serif';
  c.fillText(`${BOUNTY_RANKS[bountyRank()][1]} · Character Lv ${charLv()} · ${REALMS[realm].name}`, POSTER_W / 2, fy + fh + 226, POSTER_W - 120);
  // latest feat
  const feat = posterFeat(featId);
  if (feat) {
    const y = fy + fh + 248;
    c.fillStyle = 'rgba(58,36,18,0.10)'; c.fillRect(70, y, POSTER_W - 140, 72);
    try { const s = itemSVG(feat); if (s) c.drawImage(await svgImage(s, 64, 64), 84, y + 6, 64, 64); } catch (e) { /* no art */ }
    c.fillStyle = ink; c.textAlign = 'left';
    c.font = '600 18px "Saira", sans-serif';
    c.fillText(`LATEST FEAT · ${RARITY_NAME[rarity(feat)] || ''}`.toUpperCase(), 164, y + 30);
    c.font = '700 28px "Exo 2", "Saira Condensed", sans-serif';
    wrapText(c, ITEMS[feat].name, 164, y + 62, POSTER_W - 250, 30);
    c.textAlign = 'center';
  }
  c.font = '600 14px "Saira", sans-serif'; c.fillStyle = 'rgba(58,36,18,0.7)';
  c.fillText(`ANIME IDLE RPG · ${new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}`, POSTER_W / 2, POSTER_H - 44);
  return canvas;
}

/* ---------------------------------------------------------------- the window */
let posterFeatId = null;
function posterHTML() {
  const code = myCode(), F = friendsState();
  return `<div class="pst">
    <div class="pst-art"><canvas id="pst-canvas" width="${POSTER_W}" height="${POSTER_H}" aria-label="Your wanted poster"></canvas></div>
    <div class="pst-side">
      <div class="ms-head"><span class="ms-crest">${ui('poster')}</span><div><small>Bounty ${fmt(S.bounty || 0)} · ${esc(BOUNTY_RANKS[bountyRank()][1])}</small><h2>Wanted poster</h2></div></div>
      <label class="pst-f"><small>Name on the poster</small><input id="pst-name" type="text" maxlength="20" value="${esc(heroName())}" autocomplete="off"></label>
      <div class="pst-btns">${gbtn('Share', 'play', 'data-pstshare', 'sm')}${gbtn('Save image', 'check', 'data-pstsave', 'dark sm')}</div>
      <label class="pst-f"><small>Your friend code: give it to a friend, you'll drop by in their game</small><span class="pst-code"><input id="pst-mycode" type="text" readonly value="${esc(code)}">${gbtn('Copy', '', 'data-pstcopy', 'dark sm')}</span></label>
      <label class="pst-f"><small>Add a friend's code (${F.length} / ${FRIEND_MAX}): they drop by once a day with gold (from tomorrow)</small><span class="pst-code"><input id="pst-add" type="text" placeholder="AIR1..." autocomplete="off">${gbtn('Add', 'plus', `data-pstadd ${F.length >= FRIEND_MAX ? 'disabled' : ''}`, 'sm')}</span></label>
      ${F.length ? `<ul class="pst-friends">${F.map((f, i) => `<li>${friendBadge(f.n)}<span><b>${esc(f.n)}</b><small>Bounty ${fmt(f.b)}</small></span><button class="mini-btn" data-pstdrop="${i}" title="Remove">${ui('close')}</button></li>`).join('')}</ul>` : ''}
    </div></div>`;
}
async function showPoster(featId) {
  posterFeatId = featId || null;
  openModal(posterHTML(), 'Close');
  try { if (document.fonts && document.fonts.ready) await document.fonts.ready; } catch (e) { /* fonts optional */ }
  const cv = $('#pst-canvas');
  if (cv) await drawPoster(cv, posterFeatId);
}
const posterOpen = () => $('#modal').classList.contains('show') && !!$('#modal-body .pst');
async function posterBlob() {
  const cv = document.createElement('canvas');
  await drawPoster(cv, posterFeatId);
  return new Promise((ok) => cv.toBlob(ok, 'image/png'));
}
async function savePoster() {
  const blob = await posterBlob();
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob); a.download = `wanted-${heroName().toLowerCase().replace(/[^a-z0-9]+/g, '-')}.png`;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 4000);
}
async function sharePoster() {
  const blob = await posterBlob();
  const file = new File([blob], 'wanted.png', { type: 'image/png' });
  const text = `Wanted: ${heroName()}, ฿${Math.floor(S.bounty || 0).toLocaleString('en-US')} on Anime Idle RPG. My friend code: ${myCode()}`;
  if (navigator.canShare && navigator.canShare({ files: [file] })) {
    try { await navigator.share({ files: [file], text }); return; } catch (e) { if (e && e.name === 'AbortError') return; }
  }
  await savePoster();
  toast('Sharing is not available here: the image was saved instead.', 'good');
}

// Entry points: the Character view, and next to "Replay" on a rare highlight.
{
  const base = chDollBtns;
  chDollBtns = function () { return base() + (posterOn() ? `<button class="ch-custom ch-poster" data-poster title="Your wanted poster">${ui('poster')}<span>Poster</span></button>` : ''); };
}

document.addEventListener('click', (ev) => {
  const t = ev.target.closest('[data-poster],[data-pstshare],[data-pstsave],[data-pstcopy],[data-pstadd],[data-pstdrop]');
  if (!t || t.disabled) return;
  const d = t.dataset;
  if ('poster' in d) { showPoster(d.poster || null); return; }
  if ('pstshare' in d) { sharePoster(); return; }
  if ('pstsave' in d) { savePoster(); return; }
  if ('pstcopy' in d) {
    const inp = $('#pst-mycode');
    const done = () => toast('Friend code copied.', 'good');
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(inp.value).then(done, () => { inp.select(); });
    else inp.select();
    return;
  }
  if ('pstadd' in d) {
    const inp = $('#pst-add'), err = addFriend(inp.value);
    if (err) toast(err, 'bad'); else { toast('Friend added. They will drop by.', 'good'); showPoster(posterFeatId); }
    return;
  }
  if (d.pstdrop !== undefined) { dropFriend(+d.pstdrop); showPoster(posterFeatId); }
});
document.addEventListener('change', (ev) => {
  if (ev.target.id !== 'pst-name') return;
  S.hero = S.hero || {};
  S.hero.name = ev.target.value.trim().slice(0, 20).replace(/[<>&"']/g, '') || '';
  const cv = $('#pst-canvas'), code = $('#pst-mycode');
  if (cv) drawPoster(cv, posterFeatId);
  if (code) code.value = myCode();
});
