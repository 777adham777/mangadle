'use strict';
/* ==========================================================================
   TRI-REALM — the haircuts of the reference sheet, as assets on the rig (v3)
   The user's validated sheet (6 worlds x 6 manga haircuts, drawn on this
   avatar's head) is cut into one transparent PNG per haircut (assets/hair/):
   only the hair is kept; the face, its eyes and mouth, the ear, the head's own
   outline and the shoulders are removed, because the rig draws them (so
   expressions, skin colours and the ear stay the rig's). The canonical eyes
   are left clear, except an eye the sheet draws under the hair.
   Each asset is placed on the skull bone in skull units (centre 0,0, radius 19:
   x, y = top-left corner, w, h = size), measured on the sheet (head fitted per
   cell, 1.97 px per unit). The drawing is the sheet's own: one layer, as seen
   from the front, pressed flat on the floor when the body lies down.
   Measured at the cut: reach = farthest visible pixel from the skull centre,
   eyes = share of each eye's area covered (0 = clear; covers 'N'/'F' = an eye
   the sheet hides under the hair, kept hidden),
   face = share of the face's core covered, top = share of the skull's top covered,
   ear = the sheet shows the ear (else the cut covers it and the rig hides its ear).
   Loaded after js/rig-hair.js.
   ========================================================================== */
const RIG_HAIR_BASE = (typeof RIG_ASSET_ROOT !== 'undefined' ? RIG_ASSET_ROOT : '') + 'assets/hair/';
const RIG_HAIR_WORLDS = {"seas": "Orange Town", "shinobi": "Leaf Village", "soul": "Soul City", "hex": "Shinjuku", "hunter": "Green Island", "echo": "Echo Quarter"};
const RIG_HAIR_ASSETS = {
  rubber: { name: "Rubber Mop", world: 'seas', sheet: '0,0', x: -41.75, y: -40.42, w: 72.55, h: 61.69, reach: 44.2, ear: true, eyes: [0.0, 0.0], face: 0.02, top: 1.0 },
  swordsman: { name: "Swordsman Crop", world: 'seas', sheet: '0,1', x: -38.15, y: -41.38, w: 66.58, h: 62.99, reach: 42.6, ear: true, eyes: [0.0, 0.0], face: 0.0, top: 0.6 },
  cook: { name: "Cook's Curtain", world: 'seas', sheet: '0,2', x: -41.51, y: -37.44, w: 68.26, h: 59.6, reach: 42.4, covers: "F", ear: true, eyes: [0.0, 1.0], face: 0.49, top: 0.83 },
  surgeon: { name: "Surgeon Waves", world: 'seas', sheet: '0,3', x: -42.21, y: -38.87, w: 73.49, h: 60.43, reach: 43.9, ear: true, eyes: [0.0, 0.0], face: 0.01, top: 0.91 },
  emperor: { name: "Red Emperor", world: 'seas', sheet: '0,4', x: -41.44, y: -39.39, w: 72.92, h: 60.59, reach: 42.0, ear: true, eyes: [0.0, 0.0], face: 0.0, top: 0.33 },
  sungod: { name: "Sun God Curls", world: 'seas', sheet: '0,5', x: -41.73, y: -41.03, w: 73.12, h: 62.67, reach: 44.9, ear: true, eyes: [0.0, 0.0], face: 0.0, top: 1.0 },
  leafsun: { name: "Leaf Spikes", world: 'shinobi', sheet: '1,0', x: -41.24, y: -44.58, w: 72.31, h: 66.33, reach: 46.5, ear: true, eyes: [0.0, 0.0], face: 0.0, top: 1.0 },
  avenger: { name: "Avenger Crest", world: 'shinobi', sheet: '1,1', x: -45.64, y: -45.44, w: 73.35, h: 67.75, reach: 56.5, ear: true, eyes: [0.0, 0.0], face: 0.0, top: 1.0 },
  copycat: { name: "Copy Ninja Lean", world: 'shinobi', sheet: '1,2', x: -41.01, y: -42.99, w: 72.84, h: 64.69, reach: 46.9, ear: true, eyes: [0.0, 0.0], face: 0.03, top: 1.0 },
  sand: { name: "Sand Spikes", world: 'shinobi', sheet: '1,3', x: -42.14, y: -43.11, w: 73.55, h: 64.87, reach: 46.1, ear: true, eyes: [0.0, 0.0], face: 0.0, top: 0.97 },
  prodigy: { name: "Clan Prodigy", world: 'shinobi', sheet: '1,4', x: -35.81, y: -37.39, w: 63.16, h: 62.14, reach: 39.5, ear: false, eyes: [0.0, 0.0], face: 0.0, top: 0.68 },
  flash: { name: "Yellow Flash", world: 'shinobi', sheet: '1,5', x: -43.09, y: -42.69, w: 76.92, h: 66.22, reach: 46.7, ear: true, eyes: [0.0, 0.0], face: 0.0, top: 1.0 },
  substitute: { name: "Substitute Spikes", world: 'soul', sheet: '2,0', x: -40.34, y: -39.45, w: 69.82, h: 60.84, reach: 43.8, ear: true, eyes: [0.0, 0.01], face: 0.04, top: 1.0 },
  frost: { name: "Snow Princess", world: 'soul', sheet: '2,1', x: -39.99, y: -37.18, w: 70.29, h: 73.86, reach: 43.0, ear: false, eyes: [0.0, 0.0], face: 0.12, top: 0.97 },
  pineapple: { name: "Red Pineapple", world: 'soul', sheet: '2,2', x: -60.09, y: -46.2, w: 84.62, h: 70.78, reach: 60.1, ear: true, eyes: [0.0, 0.0], face: 0.0, top: 0.96 },
  noble: { name: "Noble Pins", world: 'soul', sheet: '2,3', x: -47.45, y: -38.1, w: 77.22, h: 66.55, reach: 52.5, ear: true, eyes: [0.0, 0.0], face: 0.01, top: 0.81 },
  panther: { name: "Panther Swept", world: 'soul', sheet: '2,4', x: -41.57, y: -41.92, w: 69.28, h: 63.16, reach: 46.1, ear: true, eyes: [0.0, 0.0], face: 0.0, top: 0.97 },
  traitor: { name: "Captain's Waves", world: 'soul', sheet: '2,5', x: -35.55, y: -37.9, w: 63.5, h: 60.0, reach: 41.9, ear: true, eyes: [0.0, 0.0], face: 0.0, top: 0.91 },
  sixeyes: { name: "Six Eyes Spikes", world: 'hex', sheet: '3,0', x: -45.61, y: -43.93, w: 76.1, h: 66.66, reach: 50.9, ear: true, eyes: [0.0, 0.0], face: 0.0, top: 1.0 },
  vessel: { name: "Vessel Undercut", world: 'hex', sheet: '3,1', x: -38.75, y: -37.9, w: 69.87, h: 60.82, reach: 41.5, ear: true, eyes: [0.0, 0.0], face: 0.0, top: 1.0 },
  shadows: { name: "Shadow Spikes", world: 'hex', sheet: '3,2', x: -44.71, y: -40.2, w: 78.35, h: 62.19, reach: 46.3, ear: true, eyes: [0.0, 0.0], face: 0.06, top: 1.0 },
  hammer: { name: "Hammer Bob", world: 'hex', sheet: '3,3', x: -40.46, y: -39.28, w: 67.44, h: 62.08, reach: 42.6, ear: false, eyes: [0.0, 0.0], face: 0.0, top: 0.91 },
  cursebun: { name: "Curse Bun", world: 'hex', sheet: '3,4', x: -46.73, y: -36.06, w: 71.51, h: 59.25, reach: 51.2, ear: true, eyes: [0.0, 0.0], face: 0.0, top: 0.35 },
  curseking: { name: "King of Curses", world: 'hex', sheet: '3,5', x: -41.21, y: -40.66, w: 70.69, h: 61.66, reach: 44.7, ear: true, eyes: [0.0, 0.0], face: 0.0, top: 0.89 },
  wildspike: { name: "Wild Spikes", world: 'hunter', sheet: '4,0', x: -44.38, y: -44.23, w: 70.48, h: 66.4, reach: 51.3, ear: true, eyes: [0.0, 0.0], face: 0.0, top: 1.0 },
  assassin: { name: "Assassin Fluff", world: 'hunter', sheet: '4,1', x: -43.04, y: -42.43, w: 75.39, h: 63.67, reach: 46.7, ear: true, eyes: [0.0, 0.0], face: 0.07, top: 1.0 },
  clansman: { name: "Last Clansman", world: 'hunter', sheet: '4,2', x: -39.66, y: -40.42, w: 69.24, h: 62.8, reach: 42.2, ear: false, eyes: [0.0, 0.0], face: 0.01, top: 1.0 },
  magician: { name: "Magician Slick", world: 'hunter', sheet: '4,3', x: -46.66, y: -40.98, w: 71.51, h: 62.64, reach: 58.5, ear: true, eyes: [0.0, 0.0], face: 0.0, top: 0.95 },
  doctor: { name: "Doctor Spikes", world: 'hunter', sheet: '4,4', x: -33.24, y: -38.63, w: 56.85, h: 61.23, reach: 43.1, ear: true, eyes: [0.0, 0.0], face: 0.0, top: 1.0 },
  needle: { name: "Needle Curtain", world: 'hunter', sheet: '4,5', x: -36.37, y: -35.15, w: 62.65, h: 73.35, reach: 51.3, ear: true, eyes: [0.0, 0.0], face: 0.0, top: 0.15 },
  starmop: { name: "Star Mop", world: 'echo', sheet: '5,0', x: -42.59, y: -36.47, w: 72.05, h: 58.23, reach: 42.9, ear: true, eyes: [0.0, 0.0], face: 0.07, top: 1.0 },
  pompadour: { name: "Pompadour", world: 'echo', sheet: '5,1', x: -38.1, y: -35.11, w: 71.98, h: 57.78, reach: 43.2, ear: true, eyes: [0.0, 0.0], face: 0.0, top: 1.0 },
  goldrolls: { name: "Golden Rolls", world: 'echo', sheet: '5,2', x: -39.66, y: -38.66, w: 69.05, h: 60.48, reach: 43.1, ear: true, eyes: [0.0, 0.0], face: 0.0, top: 1.0 },
  vampire: { name: "Vampire Crown", world: 'echo', sheet: '5,3', x: -42.07, y: -39.26, w: 71.88, h: 61.32, reach: 47.6, ear: true, eyes: [0.0, 0.0], face: 0.0, top: 1.0 },
  cherry: { name: "Cherry Waves", world: 'echo', sheet: '5,4', x: -42.02, y: -39.38, w: 72.84, h: 66.22, reach: 44.7, ear: true, eyes: [0.0, 0.0], face: 0.0, top: 0.93 },
  sidegold: { name: "Side-swept Gold", world: 'echo', sheet: '5,5', x: -37.12, y: -35.88, w: 62.64, h: 61.09, reach: 42.2, ear: true, eyes: [0.0, 0.0], face: 0.0, top: 0.99 },
};
// One skin per asset: the cut-out on the skull, and no ear if the cut covers it.
function rigHairAsset(id, A) {
  const att = { 'hair.scalp': { hair: { kind: 'hairImage', href: RIG_HAIR_BASE + id + '.png', x: A.x, y: A.y, w: A.w, h: A.h, reach: A.reach } } };
  if (!A.ear) att.ear = { ear: null };
  return { name: 'hair:' + id, id, label: A.name, pal: {}, att, meta: { head: 2, image: A } };
}
for (const id in RIG_HAIR_ASSETS) RIG_HAIRS[id] = rigHairAsset(id, RIG_HAIR_ASSETS[id]);
