'use strict';
/* ==========================================================================
   TRI-REALM — the 36 manga haircuts on the rig (v3)
   The cuts and their fitting live in js/hair-cuts.js (shared with the game's
   avatar). Here each cut becomes a rig skin: one picture on the skull, read
   through HAIR_FIT, so the rig always draws the cut fitted to its own head
   (face turned 3/4 right, eyes at the canonical anchors). The ear is the
   rig's, drawn over the hair, unless the cut covers it.
   Loaded after js/rig-hair.js and js/hair-cuts.js.
   ========================================================================== */
const RIG_HAIR_ASSETS = HAIR_CUTS, RIG_HAIR_WORLDS = HAIR_CUT_WORLDS, RIG_HAIR_BASE = HAIR_CUT_BASE;
// One skin per cut. A (the cut's entry) may also be a made-up one, for the self-test.
function rigHairAsset(id, A) {
  const fit = () => (HAIR_CUTS[id] === A ? HAIR_FIT.get(id, 'rig') : { href: HAIR_CUT_BASE + id + '.png', x: A.x, y: A.y, w: A.w, h: A.h });
  const pic = { kind: 'hairImage' };
  Object.defineProperty(pic, 'reach', { enumerable: true, get: () => A.reach });
  for (const k of ['href', 'x', 'y', 'w', 'h']) Object.defineProperty(pic, k, { enumerable: true, get: () => fit()[k] });
  const att = { 'hair.scalp': { hair: pic } };
  if (!A.ear) att.ear = { ear: null };
  return { name: 'hair:' + id, id, label: A.name, pal: {}, att, meta: { head: 2, image: A } };
}
for (const id in HAIR_CUTS) RIG_HAIRS[id] = rigHairAsset(id, HAIR_CUTS[id]);
// the hand adjustments saved from the Studio (js/custom-pack.js), so the rig wears the cuts as the game does
if (typeof CUSTOM_PACK !== 'undefined' && CUSTOM_PACK && CUSTOM_PACK.cuts) HAIR_FIT.adjust(CUSTOM_PACK.cuts);
