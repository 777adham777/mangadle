'use strict';
/* Painted skill icons (assets/skill-icons/, cut by tools/cut_skill_icons.py).
   SKILL_ICON_ART = false brings back the old one-colour glyphs (ICONS.skill in icons.js, kept as they were).
   A skill missing here also falls back to its glyph. Spare alternatives: art-incoming/skill-icons/spare/. */
const SKILL_ICON_ART = true;
const SKILL_ICON_PATHS = Object.freeze(Object.fromEntries(
  ['woodcutting', 'arts', 'mining', 'smithing', 'fishing', 'cooking', 'voyaging', 'character', 'gravity',
    'farming', 'exorcism', 'tracking', 'archaeology', 'restoration', 'bonding']
    .map((k) => [k, `assets/skill-icons/${k}.webp`])));
