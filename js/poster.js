'use strict';
/* ==========================================================================
   TRI-REALM IDLE — Wanted posters and friend codes (One Piece), DOM-free part
   - Your poster (poster-ui.js draws it): your hero, your Bounty, your latest feat,
     and a short friend code that carries your name, look and bounty (nothing else).
   - A friend's code added to your list (up to 5): once a day, when you come back from
     an hour away or more, their hero drops by with a purse of gold (it shows in the
     Welcome back recap, next to your allies). No server: the code is all there is.
   Loaded after hardcore.js and omens.js.
   ========================================================================== */

const FRIEND_MAX = 5;
const POSTER_LOOK = ['style', 'stance', 'color', 'hair', 'outfit', 'hat', 'face', 'back', 'aura'];
const posterOn = () => isUnlocked('feature:poster');
const heroName = () => (S.avatar && S.avatar.name) || 'Wanderer';
const b64u = (s) => btoa(unescape(encodeURIComponent(s))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
const unb64u = (s) => decodeURIComponent(escape(atob(s.replace(/-/g, '+').replace(/_/g, '/'))));
function myCode() {
  const A = S.avatar || {}, look = {};
  for (const k of POSTER_LOOK) if (A[k] != null) look[k] = A[k];
  return 'TR1.' + b64u(JSON.stringify({ n: heroName().slice(0, 20), l: look, b: Math.floor(S.bounty || 0) }));
}
// Returns { n, l, b } or null for a code that is not one.
function readCode(code) {
  try {
    const s = String(code || '').trim();
    if (!s.startsWith('TR1.')) return null;
    const d = JSON.parse(unb64u(s.slice(4)));
    if (!d || typeof d.n !== 'string' || typeof d.l !== 'object') return null;
    const l = {};
    for (const k of POSTER_LOOK) if (typeof d.l[k] === 'string' && d.l[k].length < 40) l[k] = d.l[k];
    return { n: d.n.slice(0, 20).replace(/[<>&"']/g, ''), l, b: Math.max(0, Math.min(1e15, +d.b || 0)) };
  } catch (e) { return null; }
}
function friendsState() { if (!Array.isArray(S.friends)) S.friends = []; return S.friends; }
function addFriend(code) {
  const f = readCode(code);
  if (!f) return 'That is not a Tri-Realm friend code.';
  if (code.trim() === myCode()) return 'That is your own code.';
  const L = friendsState();
  const same = L.find((x) => x.n === f.n && JSON.stringify(x.l) === JSON.stringify(f.l));
  if (same) { same.b = f.b; dirty = true; return ''; }
  if (L.length >= FRIEND_MAX) return `Your list holds ${FRIEND_MAX} friends.`;
  L.push(Object.assign(f, { day: '' }));
  dirty = true;
  return '';
}
function dropFriend(i) { friendsState().splice(i, 1); dirty = true; }
const dayStamp = () => { const d = new Date(); return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`; };
const friendGold = () => Math.round(300 * (1 + worldIndex(frontier())) ** 2);
// Called once when you come back (report.js): each friend visits at most once a day.
function friendVisits(secs) {
  if (secs < 3600 || !Array.isArray(S.friends)) return [];
  const today = dayStamp(), out = [];
  for (const f of S.friends) {
    if (f.day === today) continue;
    f.day = today;
    const g = friendGold();
    S.gold += g;
    out.push({ n: f.n, l: f.l, b: f.b, gold: g });
  }
  return out;
}
