# Icônes « profondeur des métiers » — prompts ChatGPT (planches de 6)

39 nouveaux objets (`js/depth.js`, design dans `docs/SKILL-DEPTH.md`) → **7 planches** (la 7e en a 3).
Même procédé que l'armurerie (`docs/ARMORY-ICONS.md`) ; seul le dossier change.

## Mode d'emploi

1. Ouvre une conversation ChatGPT (génération d'image) et colle le **message de la planche 1** tel quel.
   Une planche = un message = une image. Les messages sont complets.
2. Vérifie l'image : objets bien séparés, dans l'ordre, aucun texte ; fond transparent (ou magenta pur uni).
3. Enregistre le PNG sous `art-incoming/depth/sheet-<numéro>.png`.
4. Découpe :
   ```
   python tools/slice_icon_sheet.py --depth        # toutes les planches présentes
   python tools/slice_icon_sheet.py --depth 3      # seulement sheet-3.png
   python tools/slice_icon_sheet.py --depth --check
   ```
   Un aperçu `sheet-<n>-preview.png` est écrit à côté. Les icônes sont aussitôt utilisées ; reste à commiter et déployer.

Pour tout déléguer à ChatGPT / Codex : `docs/CHATGPT-ARMORY-ICONS-BRIEF.md` marche aussi, en remplaçant
`armory` par `depth`, `docs/ARMORY-ICONS.md` par ce fichier et en ajoutant `--depth` aux commandes.


---

## Planche 1 → `art-incoming/depth/sheet-1.png`

`chakra_sap` · `fossil_amber` · `living_wood` · `divine_root` · `living_idol` · `divine_relief`

```
Create ONE image: a sprite sheet of 6 separate game item icons for a fantasy idle RPG whose worlds are inspired by shonen manga.

LAYOUT (very important, the sheet is cut automatically):
- Landscape image, 1536x1024, a grid of 3 columns x 2 rows of equal square cells (512x512 each).
- Exactly one icon per cell, centred, filling about 75% of its cell, with clear empty space all around it.
  Nothing may touch or cross into another cell. Draw NO grid lines, NO borders, NO frames, NO tiles behind the icons.
- Background: fully TRANSPARENT (PNG with alpha). If transparency is impossible, use one perfectly flat pure magenta
  (#FF00FF) everywhere instead, never white, never a gradient, never a checkerboard, and never use that colour inside an icon.
- No text, no letters, no numbers, no labels, no watermark anywhere.

STYLE (same for every icon):
- Clean 2D vector game-icon art, like polished mobile gacha / RPG inventory icons: bold flat colours, simple cel shading
  (one darker shade on the shadow side), a small white gloss highlight on the upper-left, few chunky details.
- A thick, even, dark plum outline (#2a0d1e) around every object and its main inner shapes. No thin hairlines,
  no painterly texture, no 3D render, no photo look.
- Weapons lie diagonally (handle bottom-left, tip top-right). Armor and clothes are shown front-on, laid flat.
  Accessories, materials and food are shown close and slightly tilted.
- Each icon must read at 48 px: one strong silhouette, 2-3 main colours, one signature motif.
- Only magic or rare items get a small glow or 2-3 sparkles. No characters, faces or hands: objects only.

ICONS, in reading order (left to right, top row first):

1. TOP-LEFT — Chakra Sap: a fat amber-gold drop of glossy tree sap sliding down a small piece of bark, a faint blue chakra shimmer inside the drop.
2. TOP-CENTER — Fossil Amber: a polished orange amber stone, translucent, with a tiny green leaf trapped inside; warm inner glow and 2 sparkles (rare).
3. TOP-RIGHT — Living Wood Log: a cut log of pale green-brown wood with small fresh shoots and a curling vine still growing from its bark, rings visible on the cut end.
4. BOTTOM-LEFT — Divine Tree Root: a thick gnarled lavender-violet root segment, knotted and twisting, with glowing purple veins and a soft divine aura (very rare).
5. BOTTOM-CENTER — Living Wood Idol: a small carved wooden figurine (an abstract round guardian shape, no face) in green-brown living wood, a leaf sprouting from its head.
6. BOTTOM-RIGHT — Divine Root Relief: a carved wooden plaque in violet root wood showing a stylised great tree with spreading roots, gilded edges.
```


---

## Planche 2 → `art-incoming/depth/sheet-2.png`

`abundance_tonic_1` · `abundance_tonic_2` · `abundance_tonic_3` · `thrift_tonic_1` · `thrift_tonic_2` · `thrift_tonic_3`

```
Create ONE image: a sprite sheet of 6 separate game item icons for a fantasy idle RPG whose worlds are inspired by shonen manga.

LAYOUT (very important, the sheet is cut automatically):
- Landscape image, 1536x1024, a grid of 3 columns x 2 rows of equal square cells (512x512 each).
- Exactly one icon per cell, centred, filling about 75% of its cell, with clear empty space all around it.
  Nothing may touch or cross into another cell. Draw NO grid lines, NO borders, NO frames, NO tiles behind the icons.
- Background: fully TRANSPARENT (PNG with alpha). If transparency is impossible, use one perfectly flat pure magenta
  (#FF00FF) everywhere instead, never white, never a gradient, never a checkerboard, and never use that colour inside an icon.
- No text, no letters, no numbers, no labels, no watermark anywhere.

STYLE (same for every icon):
- Clean 2D vector game-icon art, like polished mobile gacha / RPG inventory icons: bold flat colours, simple cel shading
  (one darker shade on the shadow side), a small white gloss highlight on the upper-left, few chunky details.
- A thick, even, dark plum outline (#2a0d1e) around every object and its main inner shapes. No thin hairlines,
  no painterly texture, no 3D render, no photo look.
- Weapons lie diagonally (handle bottom-left, tip top-right). Armor and clothes are shown front-on, laid flat.
  Accessories, materials and food are shown close and slightly tilted.
- Each icon must read at 48 px: one strong silhouette, 2-3 main colours, one signature motif.
- Only magic or rare items get a small glow or 2-3 sparkles. No characters, faces or hands: objects only.

POTIONS (this sheet): the same bottle family drawn in 3 tiers. Tier I = a small round glass vial with a cork.
Tier II = a taller flask with a cork, a cloth band and a wax seal. Tier III = an ornate faceted crystal bottle
with a gold cap and gold filigree, glowing softly. The liquid colour and the small emblem stay the same within a family.

ICONS, in reading order (left to right, top row first):

1. TOP-LEFT — Abundance Tonic I: tier I vial of bright green liquid with a small four-leaf-clover emblem on it.
2. TOP-CENTER — Abundance Tonic II: tier II flask of bright green liquid, four-leaf-clover emblem on the cloth band.
3. TOP-RIGHT — Abundance Tonic III: tier III crystal bottle of glowing bright green liquid, gold four-leaf-clover emblem.
4. BOTTOM-LEFT — Thrift Tonic I: tier I vial of sky-blue liquid with a small circular-arrows emblem (two arrows chasing each other in a circle).
5. BOTTOM-CENTER — Thrift Tonic II: tier II flask of sky-blue liquid, circular-arrows emblem on the cloth band.
6. BOTTOM-RIGHT — Thrift Tonic III: tier III crystal bottle of glowing sky-blue liquid, gold circular-arrows emblem.
```


---

## Planche 3 → `art-incoming/depth/sheet-3.png`

`forager_tonic_1` · `forager_tonic_2` · `forager_tonic_3` · `amber_pendant` · `tool_woodcutting_4` · `divine_bow`

```
Create ONE image: a sprite sheet of 6 separate game item icons for a fantasy idle RPG whose worlds are inspired by shonen manga.

LAYOUT (very important, the sheet is cut automatically):
- Landscape image, 1536x1024, a grid of 3 columns x 2 rows of equal square cells (512x512 each).
- Exactly one icon per cell, centred, filling about 75% of its cell, with clear empty space all around it.
  Nothing may touch or cross into another cell. Draw NO grid lines, NO borders, NO frames, NO tiles behind the icons.
- Background: fully TRANSPARENT (PNG with alpha). If transparency is impossible, use one perfectly flat pure magenta
  (#FF00FF) everywhere instead, never white, never a gradient, never a checkerboard, and never use that colour inside an icon.
- No text, no letters, no numbers, no labels, no watermark anywhere.

STYLE (same for every icon):
- Clean 2D vector game-icon art, like polished mobile gacha / RPG inventory icons: bold flat colours, simple cel shading
  (one darker shade on the shadow side), a small white gloss highlight on the upper-left, few chunky details.
- A thick, even, dark plum outline (#2a0d1e) around every object and its main inner shapes. No thin hairlines,
  no painterly texture, no 3D render, no photo look.
- Weapons lie diagonally (handle bottom-left, tip top-right). Armor and clothes are shown front-on, laid flat.
  Accessories, materials and food are shown close and slightly tilted.
- Each icon must read at 48 px: one strong silhouette, 2-3 main colours, one signature motif.
- Only magic or rare items get a small glow or 2-3 sparkles. No characters, faces or hands: objects only.

POTIONS (this sheet): the same bottle family drawn in 3 tiers. Tier I = a small round glass vial with a cork.
Tier II = a taller flask with a cork, a cloth band and a wax seal. Tier III = an ornate faceted crystal bottle
with a gold cap and gold filigree, glowing softly. The liquid colour and the small emblem stay the same within a family.

ICONS, in reading order (left to right, top row first):

1. TOP-LEFT — Forager's Tonic I: tier I vial of honey-orange liquid with a small tied bundle of herbs hanging from its neck.
2. TOP-CENTER — Forager's Tonic II: tier II flask of honey-orange liquid, a bundle of herbs tied to the cloth band.
3. TOP-RIGHT — Forager's Tonic III: tier III crystal bottle of glowing honey-orange liquid, a gold herb-bundle emblem.
4. BOTTOM-LEFT — Amber Pendant: a teardrop of orange fossil amber with a leaf inside, set in simple bronze, on a glossy dark lacquered cord; warm glow.
5. BOTTOM-CENTER — Chakra Saw Mk IV: an ornate two-handed forestry saw with a violet-wood handle, a curved blue-steel blade with glowing chakra teeth, gold rivets; high-tier tool.
6. BOTTOM-RIGHT — Divine Root Longbow: a tall longbow carved from twisting violet divine root, golden glowing string, small leaves sprouting along the limbs; legendary glow.
```


---

## Planche 4 → `art-incoming/depth/sheet-4.png`

`fish_oil` · `thunder_catfish` · `coral_dragonet` · `catfish_hotpot` · `oil_tempura` · `dragonet_sashimi`

```
Create ONE image: a sprite sheet of 6 separate game item icons for a fantasy idle RPG whose worlds are inspired by shonen manga.

LAYOUT (very important, the sheet is cut automatically):
- Landscape image, 1536x1024, a grid of 3 columns x 2 rows of equal square cells (512x512 each).
- Exactly one icon per cell, centred, filling about 75% of its cell, with clear empty space all around it.
  Nothing may touch or cross into another cell. Draw NO grid lines, NO borders, NO frames, NO tiles behind the icons.
- Background: fully TRANSPARENT (PNG with alpha). If transparency is impossible, use one perfectly flat pure magenta
  (#FF00FF) everywhere instead, never white, never a gradient, never a checkerboard, and never use that colour inside an icon.
- No text, no letters, no numbers, no labels, no watermark anywhere.

STYLE (same for every icon):
- Clean 2D vector game-icon art, like polished mobile gacha / RPG inventory icons: bold flat colours, simple cel shading
  (one darker shade on the shadow side), a small white gloss highlight on the upper-left, few chunky details.
- A thick, even, dark plum outline (#2a0d1e) around every object and its main inner shapes. No thin hairlines,
  no painterly texture, no 3D render, no photo look.
- Weapons lie diagonally (handle bottom-left, tip top-right). Armor and clothes are shown front-on, laid flat.
  Accessories, materials and food are shown close and slightly tilted.
- Each icon must read at 48 px: one strong silhouette, 2-3 main colours, one signature motif.
- Only magic or rare items get a small glow or 2-3 sparkles. No characters, faces or hands: objects only.

ICONS, in reading order (left to right, top row first):

1. TOP-LEFT — Fish Oil: a small round glass jar with a cork and string, filled with golden yellow oil, a little fish-shaped label shape (no text) on the jar.
2. TOP-CENTER — Thunder Catfish: a chunky olive-brown catfish with long whiskers, a pale yellow belly and small yellow lightning sparks crackling around it.
3. TOP-RIGHT — Coral Dragonet: a tiny pink-and-coral sea dragon fish with frilly fins, small horns and a curling tail, pastel pink glow (rare).
4. BOTTOM-LEFT — Thunder Catfish Hotpot: a black clay hotpot full of yellow broth with catfish pieces, green onions and a tiny lightning-shaped steam wisp.
5. BOTTOM-CENTER — Fish-Oil Tempura: three golden crispy battered tempura pieces (eel) on a small bamboo mat with a dipping-sauce dish.
6. BOTTOM-RIGHT — Coral Dragonet Sashimi: elegant slices of pink sashimi fanned on a dark slate plate with a leaf and a dab of green wasabi; premium dish.
```


---

## Planche 5 → `art-incoming/depth/sheet-5.png`

`thunder_harpoon` · `tool_fishing_4` · `reishi_dust` · `sekki_stone` · `kido_quartz` · `sekki_ingot`

```
Create ONE image: a sprite sheet of 6 separate game item icons for a fantasy idle RPG whose worlds are inspired by shonen manga.

LAYOUT (very important, the sheet is cut automatically):
- Landscape image, 1536x1024, a grid of 3 columns x 2 rows of equal square cells (512x512 each).
- Exactly one icon per cell, centred, filling about 75% of its cell, with clear empty space all around it.
  Nothing may touch or cross into another cell. Draw NO grid lines, NO borders, NO frames, NO tiles behind the icons.
- Background: fully TRANSPARENT (PNG with alpha). If transparency is impossible, use one perfectly flat pure magenta
  (#FF00FF) everywhere instead, never white, never a gradient, never a checkerboard, and never use that colour inside an icon.
- No text, no letters, no numbers, no labels, no watermark anywhere.

STYLE (same for every icon):
- Clean 2D vector game-icon art, like polished mobile gacha / RPG inventory icons: bold flat colours, simple cel shading
  (one darker shade on the shadow side), a small white gloss highlight on the upper-left, few chunky details.
- A thick, even, dark plum outline (#2a0d1e) around every object and its main inner shapes. No thin hairlines,
  no painterly texture, no 3D render, no photo look.
- Weapons lie diagonally (handle bottom-left, tip top-right). Armor and clothes are shown front-on, laid flat.
  Accessories, materials and food are shown close and slightly tilted.
- Each icon must read at 48 px: one strong silhouette, 2-3 main colours, one signature motif.
- Only magic or rare items get a small glow or 2-3 sparkles. No characters, faces or hands: objects only.

ICONS, in reading order (left to right, top row first):

1. TOP-LEFT — Thunder Harpoon: a whaler harpoon with a dark wood shaft wrapped in rope, a barbed steel head crackling with yellow lightning.
2. TOP-CENTER — Sonar Rod Mk IV: a high-tech fishing rod with a pink-coral reel, a glowing sonar dish near the handle and gold fittings; high-tier tool.
3. TOP-RIGHT — Reishi Dust: a small heap of fine sparkling pale-blue spirit dust with tiny glowing motes rising from it.
4. BOTTOM-LEFT — Sekki Stone: a rough block of matte grey stone with flat faces and faint dark cracks (no symbols), it looks heavy and dull.
5. BOTTOM-CENTER — Kido Quartz: a cluster of cyan quartz crystals with a faint glowing spell-circle pattern inside the main crystal (rare glow).
6. BOTTOM-RIGHT — Sekki Ingot: a trapezoid metal ingot in matte grey stone-metal, slightly rough, with a dull sheen.
```


---

## Planche 6 → `art-incoming/depth/sheet-6.png`

`kido_ingot` · `frostvoid_alloy` · `sunstar_alloy` · `sekki_bracers` · `living_wood_mail` · `frostvoid_scythe`

```
Create ONE image: a sprite sheet of 6 separate game item icons for a fantasy idle RPG whose worlds are inspired by shonen manga.

LAYOUT (very important, the sheet is cut automatically):
- Landscape image, 1536x1024, a grid of 3 columns x 2 rows of equal square cells (512x512 each).
- Exactly one icon per cell, centred, filling about 75% of its cell, with clear empty space all around it.
  Nothing may touch or cross into another cell. Draw NO grid lines, NO borders, NO frames, NO tiles behind the icons.
- Background: fully TRANSPARENT (PNG with alpha). If transparency is impossible, use one perfectly flat pure magenta
  (#FF00FF) everywhere instead, never white, never a gradient, never a checkerboard, and never use that colour inside an icon.
- No text, no letters, no numbers, no labels, no watermark anywhere.

STYLE (same for every icon):
- Clean 2D vector game-icon art, like polished mobile gacha / RPG inventory icons: bold flat colours, simple cel shading
  (one darker shade on the shadow side), a small white gloss highlight on the upper-left, few chunky details.
- A thick, even, dark plum outline (#2a0d1e) around every object and its main inner shapes. No thin hairlines,
  no painterly texture, no 3D render, no photo look.
- Weapons lie diagonally (handle bottom-left, tip top-right). Armor and clothes are shown front-on, laid flat.
  Accessories, materials and food are shown close and slightly tilted.
- Each icon must read at 48 px: one strong silhouette, 2-3 main colours, one signature motif.
- Only magic or rare items get a small glow or 2-3 sparkles. No characters, faces or hands: objects only.

ICONS, in reading order (left to right, top row first):

1. TOP-LEFT — Kido Ingot: a trapezoid ingot of translucent cyan crystal-metal with a glowing spell-circle mark on top.
2. TOP-CENTER — Frostvoid Alloy: a bar of folded metal in swirling layers of icy blue and deep violet, frost crystals on one end.
3. TOP-RIGHT — Sunstar Alloy: a bar of fused gold and white-hot metal with a star-shaped shine, glowing orange edges as if just forged.
4. BOTTOM-LEFT — Sekki Bracers: a pair of thick grey stone-metal bracers with leather straps, plain and heavy, spiritual energy sliding off them as faint blue wisps.
5. BOTTOM-CENTER — Living Wood Mail: a chest armour made of overlapping green-brown living wood plates, small leaves and vines growing between them.
6. BOTTOM-RIGHT — Frostvoid Scythe: a long-handled scythe with a curved blade of icy blue and violet layered alloy, dark mist trailing from the edge.
```


---

## Planche 7 → `art-incoming/depth/sheet-7.png`

`sunstar_plate` · `kido_focus` · `tool_mining_4`

```
Create ONE image: a sprite sheet of 3 separate game item icons for a fantasy idle RPG whose worlds are inspired by shonen manga.

LAYOUT (very important, the sheet is cut automatically):
- Landscape image, 1536x1024, a grid of 3 columns x 2 rows of equal square cells (512x512 each).
- Exactly one icon per cell, centred, filling about 75% of its cell, with clear empty space all around it.
  Nothing may touch or cross into another cell. Draw NO grid lines, NO borders, NO frames, NO tiles behind the icons.
- Only 3 icons on this sheet: the TOP row. Leave the whole bottom row empty (background only).
- Background: fully TRANSPARENT (PNG with alpha). If transparency is impossible, use one perfectly flat pure magenta
  (#FF00FF) everywhere instead, never white, never a gradient, never a checkerboard, and never use that colour inside an icon.
- No text, no letters, no numbers, no labels, no watermark anywhere.

STYLE (same for every icon):
- Clean 2D vector game-icon art, like polished mobile gacha / RPG inventory icons: bold flat colours, simple cel shading
  (one darker shade on the shadow side), a small white gloss highlight on the upper-left, few chunky details.
- A thick, even, dark plum outline (#2a0d1e) around every object and its main inner shapes. No thin hairlines,
  no painterly texture, no 3D render, no photo look.
- Weapons lie diagonally (handle bottom-left, tip top-right). Armor and clothes are shown front-on, laid flat.
  Accessories, materials and food are shown close and slightly tilted.
- Each icon must read at 48 px: one strong silhouette, 2-3 main colours, one signature motif.
- Only magic or rare items get a small glow or 2-3 sparkles. No characters, faces or hands: objects only.

ICONS, in reading order (left to right, top row first):

1. TOP-LEFT — Sunstar Plate: a heavy golden chest plate with a radiant star emblem in the centre, glowing orange forge-hot rims.
2. TOP-CENTER — Kido Focus Staff: a slim staff of dark wood topped with a floating cyan crystal ingot inside a ring, a faint spell circle around it.
3. TOP-RIGHT — Ki Drill Mk IV: a heavy hand drill with a cyan crystal bit, gold body and a glowing energy core; high-tier tool.
```
