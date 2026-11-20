'use strict';
/* ==========================================================================
   TRI-REALM — outfits worn whole, recreated from the concept sheet
   Drawn by fitLayers() in avatar.js from the body's own geometry, so they follow every pose.
   Coordinates:
   - on the torso (u, v): u from -1 (left edge, the back side) to 1 (right edge, the front side),
     v from 0 (the pelvis) to 1 (the neck base); a third value 1 makes a sharp corner;
   - along a limb, t: 0 at the shoulder or hip, 0.5 at the elbow or knee, 1 at the wrist or ankle.
   Fields:
   fit: how far the clothes stand off the body · top: the torso shell { c, hem (v of its lower edge),
     zones [{ c ('skin' = the body), pts }], lines [{ c ('line' = ink), w, op, pts }], marks [{ n, u, v,
     size, c, c2, rot }], dots [{ c, r, pts }] (buttons), beads { c, from, mid, to, n, r } }
   arms / under: sleeves { c, len (t of the cuff), w [half-width at the shoulder, at the cuff], bands,
     marks [{ n, t, size, c, side 'B'|'F' }] } · armBands: bands on the arms whatever the sleeves
   legs: trousers { c, len, w, bands, marks [{ n, t, s (across, -1..1), size, c, side }] }
   shinBands · band { t: [t0, t1], c, wrap (bandage lines), fur, w (half-width), side }
   skirt: a long coat's two panels { c, top (v at the waist), hem (t on the legs), gap (open front, u)
     or none (closed), flare, lining (seen between open panels), trim, seam, flames { c, h },
     marks [{ n, a (0 outer edge .. 1 inner), b (0 waist .. 1 hem), size, c, side }] }
   belts [{ c, v: [v0, v1], vR (the right end, for a slanted sash), buckle, bu }]
   sash { c, v, u (the knot), tails [[dx, length, width, darken]], knot, rope }
   collar { c, h, lining, zip, ribs } · hood (colour) · epaulettes (colour)
   feet { k: 'straw' | 'ninja' | 'boot' | 'shoe' | 'sneaker', c, c2, h (a boot's top, t) }
   Marks: spiral, cloud, fan, skull, flower, spot, pouch, pocket (FIT_MARKS in avatar.js).
   ========================================================================== */
const FITS = {
  // ---------------------------------------------------------------- Orange Town (row 1)
  rubber: {
    name: 'Rubber Captain', world: 'seas', fit: 2.2,
    top: { c: '#c8302a', hem: 0.06,
      zones: [{ c: 'skin', pts: [[-0.95, 1.3], [0.02, 0.4, 1], [1.0, 1.3]] }],
      lines: [{ c: '#8e1d1a', w: 1.2, pts: [[0.03, 0.4], [0.05, 0.06]] }],
      dots: [{ c: '#f2c230', r: 1.7, pts: [[0.2, 0.34], [0.2, 0.22], [0.2, 0.1]] }] },
    sash: { c: '#e2a514', v: [-0.03, 0.13], u: 0.6, tails: [[3, 30, 4, 0], [6, 22, 3.4, -0.1]] },
    legs: { c: '#3a5fb0', len: 0.5, w: [9.6, 9.4], bands: [{ t: [0.42, 0.53], c: '#f2efe8', fur: 1, w: 10.2 }] },
    feet: { k: 'straw', c: '#9a6c3a', c2: '#2a2522' },
  },
  swordsman: {
    name: 'Swordsman Robe', world: 'seas', fit: 2.6,
    top: { c: '#2f5743', hem: -0.1,
      zones: [{ c: 'skin', pts: [[-0.04, 1.3], [0.14, 0.8, 1], [0.36, 1.3]] },
        { c: '#e6dbbf', pts: [[0.36, 1.2], [0.5, 1.12], [-0.06, 0.4], [-0.2, 0.44]] }],
      lines: [{ c: '#1d382b', w: 1.3, pts: [[0.52, 1.1], [0.1, 0.62], [-0.3, 0.2]] }, { c: '#1d382b', w: 0.9, op: 0.6, pts: [[-0.6, 0.9], [-0.45, 0.5]] }] },
    arms: { c: '#2f5743', len: 0.62, w: [7.2, 7.8], bands: [{ t: [0.52, 0.63], c: '#3b6b53', w: 8.2 }] },
    sash: { c: '#8c2738', v: [0.02, 0.2], u: 0.5, knot: 4.2, tails: [[4, 42, 4.6, 0], [7, 32, 3.8, -0.14]] },
    skirt: { c: '#2f5743', top: 0.12, hem: 0.66, flare: 6, seam: '#1d382b' },
    legs: { c: '#2a4436', len: 0.82, w: [9, 9.8] },
    feet: { k: 'boot', c: '#2b2929', h: 0.74 },
  },
  cook: {
    name: "Cook's Suit", world: 'seas', fit: 2.4,
    top: { c: '#1f1f25', hem: -0.24,
      zones: [{ c: '#f6c84d', pts: [[-0.8, 1.3], [0.04, 0.42, 1], [0.88, 1.3]] },
        { c: '#151216', pts: [[-0.03, 0.98], [0.11, 0.98], [0.14, 0.56], [0.05, 0.46, 1], [-0.05, 0.56]] },
        { c: '#f6c84d', pts: [[-0.46, 1.08, 1], [-0.06, 0.92, 1], [-0.28, 0.76, 1]] }, { c: '#f6c84d', pts: [[0.54, 1.08, 1], [0.14, 0.92, 1], [0.36, 0.76, 1]] }],
      lines: [{ c: '#4a4a56', w: 1.5, pts: [[-0.5, 1.1], [-0.2, 0.56], [0.04, 0.4]] }, { c: '#4a4a56', w: 1.5, pts: [[0.58, 1.1], [0.3, 0.56], [0.04, 0.4]] },
        { c: '#4a4a56', w: 1, op: 0.7, pts: [[0.04, 0.4], [0.08, -0.22]] }],
      dots: [{ c: '#d9a52a', r: 1.5, pts: [[-0.2, 0.36], [0.3, 0.36], [-0.2, 0.16], [0.3, 0.16]] }] },
    arms: { c: '#1f1f25', len: 0.92, w: [6.6, 5.8], bands: [{ t: [0.86, 0.93], c: '#2a2a32' }] },
    legs: { c: '#222228', len: 1, w: [9.4, 9.2] },
    feet: { k: 'shoe', c: '#18181c' },
  },
  firefist: {
    name: 'Fire Fist Shirt', world: 'seas', fit: 2.4,
    top: { c: '#b83322', hem: -0.04,
      zones: [{ c: 'skin', pts: [[-0.2, 1.3], [-0.12, -0.1, 1], [0.3, -0.1, 1], [0.36, 1.3]] }],
      lines: [{ c: '#6e1a12', w: 1.3, pts: [[-0.2, 1.15], [-0.12, -0.02]] }, { c: '#6e1a12', w: 1.3, pts: [[0.34, 1.15], [0.3, -0.02]] }],
      marks: [[-0.7, 0.82], [-0.48, 0.36], [-0.78, 0.12], [0.62, 0.86], [0.72, 0.46], [0.56, 0.12], [-0.44, 0.62]].map(([u, v], i) => ({ n: 'flower', u, v, size: 3.4, c: '#f2b028', rot: i * 40 })),
      beads: { c: '#b42a22', from: [-0.36, 1.0], mid: [0.06, 0.74], to: [0.48, 1.0], n: 9, r: 1.8 } },
    arms: { c: '#b83322', len: 0.36, w: [7, 7.6], marks: [{ n: 'flower', t: 0.16, size: 3, c: '#f2b028' }] },
    belts: [{ c: '#4e2f22', v: [0, 0.12], buckle: '#e8b84a' }],
    legs: { c: '#2a2828', len: 0.56, w: [9.6, 9.8], bands: [{ t: [0.2, 0.3], c: '#a7a7b0', side: 'F', w: 10.4 }],
      marks: [{ n: 'pouch', t: 0.26, s: 0.95, size: 5, c: '#3a3838', side: 'F' }] },
    feet: { k: 'straw', c: '#7a5636', c2: '#1c1714' },
  },
  surgeon: {
    name: 'Surgeon Hoodie', world: 'seas', fit: 2.6,
    top: { c: '#f4b41c', hem: -0.16,
      zones: [{ c: '#232427', pts: [[-1.4, 0.5], [-0.62, 0.62], [-0.5, 1.4], [-1.4, 1.4]] }, { c: '#232427', pts: [[1.4, 0.5], [0.7, 0.62], [0.58, 1.4], [1.4, 1.4]] },
        { c: '#d99a12', pts: [[-1.4, -0.3], [1.4, -0.3], [1.4, -0.08], [-1.4, -0.08]] }],
      lines: [{ c: '#a87408', w: 1.1, pts: [[-0.52, 0.06], [-0.36, 0.3], [0.46, 0.3], [0.62, 0.06]] }],
      marks: [{ n: 'skull', u: 0.06, v: 0.58, size: 5.4, c: '#1a1a1a', c2: '#f4b41c' }] },
    hood: '#232427',
    arms: { c: '#232427', len: 0.9, w: [6.8, 6], bands: [{ t: [0.84, 0.92], c: '#2c2d31' }, { t: [0.72, 0.76], c: '#f4b41c' }] },
    legs: { c: '#4d5062', len: 1, w: [9.6, 10.2],
      marks: [[0.56, 0.4], [0.7, -0.3], [0.86, 0.3]].map(([t, s]) => ({ n: 'spot', t, s, size: 4, c: '#3a3c4c' })) },
    feet: { k: 'sneaker', c: '#222326', c2: '#ecebe8' },
  },
  kingcoat: {
    name: 'Pirate King Coat', world: 'seas', fit: 2.8,
    top: { c: '#7a1e28', hem: -0.2,
      zones: [{ c: 'skin', pts: [[-0.22, 1.3], [-0.2, -0.3, 1], [0.28, -0.3, 1], [0.32, 1.3]] }],
      lines: [{ c: '#ece6dc', w: 2.4, pts: [[-0.2, 0.95], [0.3, 0.32]] }, { c: '#ece6dc', w: 2.4, pts: [[0.3, 0.95], [-0.2, 0.32]] },
        { c: '#f0b62d', w: 2.8, pts: [[-0.22, 1.2], [-0.2, -0.3]] }, { c: '#f0b62d', w: 2.8, pts: [[0.32, 1.2], [0.28, -0.3]] }],
      dots: [{ c: '#f0b62d', r: 1.3, pts: [[-0.38, 0.84], [-0.38, 0.62], [-0.38, 0.4], [0.46, 0.84], [0.46, 0.62], [0.46, 0.4]] }] },
    collar: { c: '#7a1e28', h: 7, lining: '#f0b62d' },
    epaulettes: '#f0b62d',
    arms: { c: '#7a1e28', len: 0.9, w: [7, 6.6], bands: [{ t: [0.76, 0.9], c: '#f0b62d', w: 7.2 }] },
    belts: [{ c: '#4a342b', v: [0.02, 0.14], buckle: '#f0b62d', u: [-0.24, 0.32] }],
    skirt: { c: '#7a1e28', top: 0.12, hem: 0.88, gap: 0.3, flare: 8, lining: '#4a1018', trim: '#f0b62d' },
    legs: { c: '#3a2b27', len: 0.86, w: [9.6, 9.6], bands: [{ t: [0.7, 0.78], c: '#e3c794', w: 10 }] },
    feet: { k: 'boot', c: '#3b2a24', h: 0.8 },
  },
  // ---------------------------------------------------------------- Leaf Village (row 2)
  leafsuit: {
    name: 'Leaf Jumpsuit', world: 'shinobi', fit: 2.6,
    top: { c: '#f58224', hem: -0.06,
      zones: [{ c: '#2c2b30', pts: [[-1.4, 0.6], [1.4, 0.6], [1.4, 1.4], [-1.4, 1.4]] }, { c: '#2c2b30', pts: [[-1.4, -0.3], [1.4, -0.3], [1.4, 0.08], [-1.4, 0.08]] }],
      lines: [{ c: '#e9e9ee', w: 1.6, pts: [[0.05, -0.04], [0.05, 0.5], [0.05, 1.02]] }] },
    collar: { c: '#2c2b30', h: 6, zip: '#e9e9ee', ribs: 1 },
    arms: { c: '#2c2b30', len: 0.9, w: [6.6, 6], bands: [{ t: [0.84, 0.92], c: '#232227' }] },
    legs: { c: '#f27d20', len: 0.8, w: [9.6, 9.4], bands: [{ t: [0.2, 0.32], c: '#f2efe9', wrap: 1, side: 'B', w: 10.2 }],
      marks: [{ n: 'pouch', t: 0.22, s: -1, size: 5, c: '#2c2b30', side: 'B' }] },
    shinBands: [{ t: [0.8, 0.9], c: '#1e1e24', wrap: 1 }],
    feet: { k: 'ninja', c: '#2a3350', c2: '#1e2236' },
  },
  jonin: {
    name: 'Jonin Vest', world: 'shinobi', fit: 2.6,
    top: { c: '#2d3144', hem: -0.06,
      zones: [{ c: '#6b764d', pts: [[-1.4, -0.3], [1.4, -0.3], [1.4, 0.96], [-1.4, 0.96]] }],
      lines: [{ c: '#4e5638', w: 1.2, pts: [[0.04, -0.1], [0.04, 0.95]] }],
      marks: [[-0.5, 0.56], [0.56, 0.56], [-0.5, 0.22], [0.56, 0.22]].map(([u, v]) => ({ n: 'pocket', u, v, size: 4.4, c: '#5f6a44' })) },
    collar: { c: '#6b764d', h: 5, lining: '#2d3144' },
    arms: { c: '#2d3144', len: 0.9, w: [6.4, 5.8], marks: [{ n: 'spiral', t: 0.18, size: 3.8, c: '#be2625', side: 'B' }] },
    legs: { c: '#2e3144', len: 0.8, w: [9.4, 9.4], bands: [{ t: [0.18, 0.3], c: '#f2efe9', wrap: 1, side: 'B', w: 10 }],
      marks: [{ n: 'pouch', t: 0.2, s: -1, size: 5, c: '#2a2d3c', side: 'B' }] },
    shinBands: [{ t: [0.78, 0.9], c: '#f2efe9', wrap: 1 }],
    feet: { k: 'ninja', c: '#2d3144' },
  },
  redcloud: {
    name: 'Red Cloud Cloak', world: 'shinobi', fit: 3,
    top: { c: '#16151b', hem: -0.2,
      lines: [{ c: '#b02c2a', w: 2.2, pts: [[0.05, -0.2], [0.05, 1.0]] }],
      marks: [{ n: 'cloud', u: 0.42, v: 0.16, size: 7.5, c: '#c9302c' }] },
    collar: { c: '#16151b', h: 8, lining: '#8a1a1c' },
    arms: { c: '#16151b', len: 0.92, w: [7.4, 8.6] },
    skirt: { c: '#16151b', top: 0.12, hem: 0.86, flare: 6, seam: '#b02c2a',
      marks: [{ n: 'cloud', a: 0.32, b: 0.6, size: 8, c: '#c9302c', side: 'B' }, { n: 'cloud', a: 0.25, b: 0.66, size: 7, c: '#c9302c', side: 'F' }] },
    legs: { c: '#1e1e26', len: 0.94, w: [9, 8.8] },
    feet: { k: 'ninja', c: '#2a2a3a' },
  },
  avenger: {
    name: 'Avenger Robe', world: 'shinobi', fit: 2.6,
    top: { c: '#d9d6e6', hem: -0.08,
      zones: [{ c: 'skin', pts: [[-0.5, 1.3], [0.02, 0.24, 1], [0.56, 1.3]] }],
      lines: [{ c: '#8b87a3', w: 2, pts: [[-0.52, 1.2], [0.02, 0.24]] }, { c: '#8b87a3', w: 2, pts: [[0.58, 1.2], [0.02, 0.24]] },
        { c: '#b9b6c8', w: 1, pts: [[-0.7, 0.9], [-0.55, 0.4]] }] },
    arms: { c: '#d9d6e6', len: 0.42, w: [7.6, 8.8] },
    sash: { c: '#a879c0', v: [-0.12, 0.24], u: 0.1, rope: 1, knot: 6.4, tails: [[-3, 36, 4.2, 0], [4, 32, 3.8, -0.08], [0, 26, 3.6, -0.16]] },
    skirt: { c: '#464875', top: 0.1, hem: 0.52, flare: 4 },
    legs: { c: '#25252f', len: 0.86, w: [9.6, 10] },
    feet: { k: 'ninja', c: '#1e1a1a' },
  },
  flamecloak: {
    name: 'Flame Cloak', world: 'shinobi', fit: 2.8,
    top: { c: '#f4f1ee', hem: -0.2,
      zones: [{ c: '#f28a26', pts: [[-0.24, 1.3], [-0.22, -0.3, 1], [0.3, -0.3, 1], [0.34, 1.3]] }, { c: '#1e1e24', pts: [[-0.3, 0], [0.36, 0], [0.36, 0.1], [-0.3, 0.1]] }],
      lines: [{ c: '#c45e10', w: 1.2, pts: [[0.05, -0.2], [0.05, 1.05]] }, { c: '#cfcac4', w: 1.4, pts: [[-0.24, 1.2], [-0.22, -0.3]] }, { c: '#cfcac4', w: 1.4, pts: [[0.34, 1.2], [0.3, -0.3]] }] },
    collar: { c: '#f4f1ee', h: 7, lining: '#f28a26' },
    under: { c: '#1e1e24', len: 0.9, w: [6, 5.6] },
    arms: { c: '#f4f1ee', len: 0.66, w: [7.2, 8], marks: [{ n: 'spiral', t: 0.2, size: 4.2, c: '#d0382f', side: 'B' }] },
    skirt: { c: '#f4f1ee', top: 0.12, hem: 0.86, gap: 0.28, flare: 6, lining: '#8a1a1c', flames: { c: '#d0382f', h: 20 } },
    legs: { c: '#242126', len: 0.94 },
    feet: { k: 'ninja', c: '#242126' },
  },
  clantunic: {
    name: 'Clan Tunic', world: 'shinobi', fit: 2.4,
    top: { c: '#31303f', hem: -0.08,
      marks: [{ n: 'fan', u: 0.18, v: 0.7, size: 4.4, c: '#c9423b' }] },
    collar: { c: '#31303f', h: 7, lining: '#25242f' },
    arms: { c: '#31303f', len: 0.3, w: [7, 7] },
    armBands: [{ t: [0.34, 0.46], c: '#f2efe9', wrap: 1, w: 5.4 }, { t: [0.62, 0.86], c: '#f2efe9', wrap: 1, w: 5 }],
    belts: [{ c: '#cbbeb6', v: [0.04, 0.16], buckle: '#8f8783' }, { c: '#a99d96', v: [-0.12, -0.04], vR: [-0.22, -0.14] }],
    legs: { c: '#33323f', len: 0.8, w: [9.6, 9.6], bands: [{ t: [0.18, 0.3], c: '#f2efe9', wrap: 1, side: 'B', w: 10 }],
      marks: [{ n: 'pouch', t: 0.2, s: -1, size: 5, c: '#2a2a36', side: 'B' }] },
    shinBands: [{ t: [0.8, 0.9], c: '#f2efe9', wrap: 1 }],
    feet: { k: 'ninja', c: '#1e1a1a' },
  },
};
