'use strict';
/* ==========================================================================
   ANIME IDLE RPG — Wanted posters and friend codes (One Piece), DOM-free part
   - Your poster (poster-ui.js draws it): your weapon, your Bounty, your latest feat,
     and a short friend code that carries your name and bounty (nothing else).
   - A friend's code added to your list (up to 5): once a day, when you come back from
     an hour away or more, they drop by with a purse of gold (it shows in the
     Welcome back recap, next to your allies). No server: the code is all there is.
   Loaded after hardcore.js and omens.js.
   ========================================================================== */

const FRIEND_MAX = 5;
const posterOn = () => isUnlocked('feature:poster');
const heroName = () => (S.hero && S.hero.name) || 'Wanderer';
const b64u = (s) => btoa(unescape(encodeURIComponent(s))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
const unb64u = (s) => decodeURIComponent(escape(atob(s.replace(/-/g, '+').replace(/_/g, '/'))));
// Codes carry a small checksum so a hand-edited code (a made-up bounty) is refused.
// Without a server it cannot stop everything: a new friend's first visit also waits a day (friendVisits).
function codeSum(n, b) { let h = 2166136261; for (const ch of `${n}|${b}|aidle`) { h ^= ch.charCodeAt(0); h = Math.imul(h, 16777619) >>> 0; } return h.toString(36); }
function myCode() {
  const n = heroName().slice(0, 20), b = Math.floor(S.bounty || 0);
  return 'AIR1.' + b64u(JSON.stringify({ n, b, c: codeSum(n, b) }));
}
// Returns { n, b } or null for a code that is not one (or was edited by hand).
function readCode(code) {
  try {
    const s = String(code || '').trim();
    if (!s.startsWith('AIR1.')) return null;
    const d = JSON.parse(unb64u(s.slice(5)));
    if (!d || typeof d.n !== 'string' || d.c !== codeSum(d.n, d.b)) return null;
    return { n: d.n.slice(0, 20).replace(/[<>&"']/g, ''), b: Math.max(0, Math.min(1e15, +d.b || 0)) };
  } catch (e) { return null; }
}
function friendsState() { if (!Array.isArray(S.friends)) S.friends = []; return S.friends; }
function addFriend(code) {
  const f = readCode(code);
  if (!f) return 'That is not an Anime Idle RPG friend code.';
  if (code.trim() === myCode()) return 'That is your own code.';
  const L = friendsState();
  const same = L.find((x) => x.n === f.n);
  if (same) { same.b = f.b; dirty = true; return ''; }
  if (L.length >= FRIEND_MAX) return `Your list holds ${FRIEND_MAX} friends.`;
  L.push(Object.assign(f, { day: '', since: Date.now() }));
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
    if (f.day === today || (f.since && Date.now() - f.since < 20 * 3600 * 1000)) continue;
    f.day = today;
    const g = friendGold();
    S.gold += g;
    out.push({ n: f.n, b: f.b, gold: g });
  }
  return out;
}
