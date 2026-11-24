'use strict';
/* ==========================================================================
   TRI-REALM IDLE — small drawing helpers
   What survived the avatar removal (2026-11-24): easing curves, 2D points,
   colour shading and the reduced-motion check, shared by the arena,
   the drawn creatures and the skill effects.
   Loaded after ui.js, before creatures.js.
   ========================================================================== */
const ease = {
  io: (x) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2),
  out: (x) => 1 - Math.pow(1 - x, 3),
  back: (x) => 1 + 2.4 * Math.pow(x - 1, 3) + 1.4 * Math.pow(x - 1, 2),
  in: (x) => x * x * x,
  lin: (x) => x,
};
const D2R = Math.PI / 180;
const dir = (a) => [Math.sin(a * D2R), Math.cos(a * D2R)];
const add = (p, a, len) => { const d = dir(a); return [p[0] + d[0] * len, p[1] + d[1] * len]; };
const r1 = (v) => Math.round(v * 10) / 10;
const pt = (p) => `${r1(p[0])},${r1(p[1])}`;
function shade(hex, f) {   // f < 0 darkens, f > 0 lightens
  const n = parseInt(hex.slice(1), 16);
  const ch = [n >> 16, (n >> 8) & 255, n & 255].map((c) => Math.round(f < 0 ? c * (1 + f) : c + (255 - c) * f));
  return '#' + ch.map((c) => c.toString(16).padStart(2, '0')).join('');
}
// The player asked for less motion (OS setting, or Settings → Display).
const calmMotion = () => (typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches);
// Rarity colours (grey → red), for impacts tinted by your weapon.
const RCOL = ['#9aa3b5', '#9aa3b5', '#5fd38a', '#4cc3ff', '#b07cff', '#f4c66a', '#ff7a59'];
