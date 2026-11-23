# Icônes de l'Armurerie manga — prompts ChatGPT (planches de 6)

53 nouveaux équipements (`js/armory.js`) → **9 planches** de 6 icônes (la 9e en a 5).
Chaque planche est découpée automatiquement en icônes prêtes pour le jeu : transparence, cadrage,
256×256, bon dossier de monde, branchement dans `js/item-images.js`.

## Mode d'emploi

1. Ouvre une conversation ChatGPT (génération d'image) et colle le **message de la planche 1** tel quel.
   Une planche = un message = une image. Les messages sont complets : pas besoin d'autre contexte.
2. Vérifie l'image :
   - 6 objets bien séparés, dans l'ordre demandé, aucun texte ;
   - le fond **transparent**. Si ChatGPT met quand même un fond, ce n'est pas grave tant qu'il est
     **uni** (le magenta pur demandé en secours) ou en damier : l'outil l'enlève.
     Un fond blanc ou dégradé est à refaire (« regenerate with a transparent background »).
3. Télécharge le PNG et enregistre-le sous `art-incoming/armory/sheet-<numéro>.png`
   (ex. `sheet-1.png`). Tu peux enchaîner les planches dans la même conversation.
4. Découpe (ou demande-le-moi) :
   ```
   python tools/slice_icon_sheet.py          # toutes les planches présentes
   python tools/slice_icon_sheet.py 3        # seulement sheet-3.png
   ```
   Un aperçu `sheet-<n>-preview.png` (icônes sur tuile sombre et claire) est écrit à côté de la planche.
   Les icônes sont aussitôt utilisées par le jeu ; il reste à commiter et déployer.

Si une icône est ratée, régénère la planche (ou demande à ChatGPT de refaire seulement cette case en
gardant les 5 autres) puis relance la découpe : elle remplace les fichiers.


---

## Planche 1 → `art-incoming/armory/sheet-1.png`

`leaf_weights` · `three_prong_kunai` · `chakra_threads` · `springtime_suit` · `sand_gourd` · `shark_skin_sword`

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
  Accessories are shown close and slightly tilted.
- Each icon must read at 48 px: one strong silhouette, 2-3 main colours, one signature motif.
- Only magic or rare items get a small glow or 2-3 sparkles. No characters, faces or hands: objects only.

ICONS, in reading order (left to right, top row first):
1. TOP-LEFT — Rock's Leg Weights: a pair of heavy olive-green fabric leg weights with thick buckled straps, lead blocks sewn in rows, one of them slightly open showing a grey lead plate; sporty, earnest, martial-arts training gear.
2. TOP-CENTER — Three-Pronged Kunai: a black steel kunai with a three-pronged tip (one long central blade, two curved side prongs), a white cloth-wrapped grip and a ring pommel; a small paper tag with an ink seal formula tied to the grip, a thin yellow flash spark at the tip.
3. TOP-RIGHT — Puppeteer's Chakra Threads: ten glowing cyan-blue chakra threads fanning out from a small wooden puppet-control cross, tied to a tiny wooden puppet joint; desert-ninja puppeteer vibe, soft blue glow.
4. BOTTOM-LEFT — Springtime Jumpsuit: a skin-tight bright green one-piece training jumpsuit laid flat, orange leg warmers at the ankles, a red cloth forehead protector folded as a belt at the waist; earnest martial-arts look.
5. BOTTOM-CENTER — Gourd of Living Sand: a large tan clay gourd with a cork stopper and a thick leather shoulder strap, a ring of swirling golden sand spilling out of the top and curling protectively around it.
6. BOTTOM-RIGHT — Shark-Skin Greatsword: a huge club-like greatsword wrapped in rough blue-grey shark scales and bandages, spiky scale edges, a single fanged mouth half-visible near the tip, a skull-like pommel; it looks alive.
```


---

## Planche 2 → `art-incoming/armory/sheet-2.png`

`justice_coat` · `red_vest` · `straw_hat` · `wado_blade` · `black_leg_boots` · `weather_baton`

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
  Accessories are shown close and slightly tilted.
- Each icon must read at 48 px: one strong silhouette, 2-3 main colours, one signature motif.
- Only magic or rare items get a small glow or 2-3 sparkles. No characters, faces or hands: objects only.

ICONS, in reading order (left to right, top row first):
1. TOP-LEFT — Justice Greatcoat: a long white navy cape-coat laid flat, worn over the shoulders, with gold epaulettes, a blue inner lining and a bold blue vertical stripe; a blank emblem plate on the back (no text).
2. TOP-CENTER — Rubber Captain's Vest: a short open red sleeveless vest with four yellow buttons, slightly stretched and worn at the edges, a small stitched patch; cheerful pirate-captain energy.
3. TOP-RIGHT — Treasured Straw Hat: a woven straw hat with a wide brim and a bright red band, a few loose straws and a small mended stitch, seen at a 3/4 angle; iconic, warm, adventurous.
4. BOTTOM-LEFT — Pure-White Wado Blade: an elegant katana with a white diamond-wrapped handle, a gold round guard and a white lacquered scabbard partly sliding off the blade; calm, pure, swordsman's vow.
5. BOTTOM-CENTER — Black-Leg Chef Shoes: a pair of polished black leather dress shoes, one with orange flames licking around the sole and heel, a tiny cook's spoon charm on the lace; elegant fighting chef.
6. BOTTOM-RIGHT — Weather Baton: a blue segmented metal staff in three connected pieces with round knobs, a small storm cloud forming above the top segment with a yellow zigzag lightning bolt; navigator's weather weapon.
```


---

## Planche 3 → `art-incoming/armory/sheet-3.png`

`sniper_goggles` · `seastone_cuffs` · `asauchi` · `flash_sandals` · `quincy_cross` · `hollow_mask_half`

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
  Accessories are shown close and slightly tilted.
- Each icon must read at 48 px: one strong silhouette, 2-3 main colours, one signature motif.
- Only magic or rare items get a small glow or 2-3 sparkles. No characters, faces or hands: objects only.

ICONS, in reading order (left to right, top row first):
1. TOP-LEFT — Sniper King Goggles: round flip-down aviator goggles with orange-tinted lenses and a leather strap, a small crosshair reticle reflected on one lens, a slingshot charm hanging from the strap.
2. TOP-CENTER — Seastone Cuffs: a pair of heavy grey-teal stone handcuffs with a stone chain, faint wave patterns carved into the stone, a few water droplets; feels heavy and power-draining.
3. TOP-RIGHT — Asauchi Blank Blade: a plain katana with a simple dark-grey wrapped hilt and a square silver guard, a clean unmarked blade, a faint pale spirit wisp curling off the edge as if it is about to speak.
4. BOTTOM-LEFT — Flash-Step Sandals: a pair of traditional straw sandals with white thong straps, worn thin, with motion streaks and a small white afterimage trail behind them; speed and silence.
5. BOTTOM-CENTER — Quincy Cross: a silver five-pointed cross pendant (pentacle-like star cross) on a thin silver chain, glowing pale-blue spirit particles gathering around it into the shape of a small bow of light.
6. BOTTOM-RIGHT — Shattered Hollow Mask: the left half of a white bone mask with jagged broken edges, empty eye hole, two red stripes across it, a crack running down; eerie, a faint dark-red aura.
```


---

## Planche 4 → `art-incoming/armory/sheet-4.png`

`captain_haori` · `bankai_blade` · `turtle_gi` · `power_pole` · `nimbus_charm` · `senzu_pouch`

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
  Accessories are shown close and slightly tilted.
- Each icon must read at 48 px: one strong silhouette, 2-3 main colours, one signature motif.
- Only magic or rare items get a small glow or 2-3 sparkles. No characters, faces or hands: objects only.

ICONS, in reading order (left to right, top row first):
1. TOP-LEFT — Captain's Haori: a sleeveless white haori coat laid flat, with a black inner robe peeking at the collar, a diamond pattern along the hem and a blank black rhombus emblem on the back (no numbers or text).
2. TOP-CENTER — Black Moon Bankai Blade: a slim all-black katana with a red-black edge glint, a small square guard with four short bent arms, and a short broken chain dangling from the pommel; a black-red crescent slash of energy behind it.
3. TOP-RIGHT — Turtle School Gi: a bright orange martial-arts gi top laid flat, blue undershirt and blue belt, a round white patch on the chest with a simple turtle-shell symbol (no letters).
4. BOTTOM-LEFT — Extending Power Pole: a long red staff with golden metal caps at both ends, shown diagonally with a motion stretch effect at one end as if it is extending; magical, playful.
5. BOTTOM-CENTER — Flying Nimbus Charm: a small round glass charm on a cord containing a fluffy golden-yellow cloud, with a tiny cloud puff escaping from the top; soft warm glow.
6. BOTTOM-RIGHT — Senzu Bean Pouch: a small brown cloth drawstring pouch, open, with three plump green beans spilling out, one bean glowing softly; humble but precious.
```


---

## Planche 5 → `art-incoming/armory/sheet-5.png`

`ki_blaster` · `z_sword` · `fusion_earrings` · `jujutsu_uniform` · `resonance_hammer` · `playful_cloud`

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
  Accessories are shown close and slightly tilted.
- Each icon must read at 48 px: one strong silhouette, 2-3 main colours, one signature motif.
- Only magic or rare items get a small glow or 2-3 sparkles. No characters, faces or hands: objects only.

ICONS, in reading order (left to right, top row first):
1. TOP-LEFT — Capsule Ki Blaster: a chunky retro-futuristic handheld ray gun in white and blue, a round capsule-shaped body with a small number plate (no text), a glowing cyan energy orb at the muzzle.
2. TOP-CENTER — Z Sword: a massive legendary broadsword with a wide silver blade, a gold and red ornate crossguard, a large red jewel at the hilt; heavy, ancient, slightly glowing.
3. TOP-RIGHT — Fusion Earrings: a pair of earrings, each a small yellow-gold ring holding a green-yellow round jewel, shown side by side with a tiny spark of energy arcing between them.
4. BOTTOM-LEFT — Jujutsu High Uniform: a dark navy high-collar school uniform jacket laid flat, gold spiral buttons down the front, a subtle purple cursed-energy glow along the seams.
5. BOTTOM-CENTER — Straw Doll Hammer & Nails: a small wooden-handled steel hammer crossed with a straw voodoo doll pierced by two long iron nails, faint blue cursed sparks around the nails.
6. BOTTOM-RIGHT — Playful Cloud Staff: a three-section staff: three red lacquered rods with gold metal ends joined by short chains, arranged in a dynamic Z shape; pure physical weapon, no glow.
```


---

## Planche 6 → `art-incoming/armory/sheet-6.png`

`cursed_finger` · `sealing_cube` · `inverted_spear` · `limitless_blindfold` · `hunter_rod` · `ten_vest`

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
  Accessories are shown close and slightly tilted.
- Each icon must read at 48 px: one strong silhouette, 2-3 main colours, one signature motif.
- Only magic or rare items get a small glow or 2-3 sparkles. No characters, faces or hands: objects only.

ICONS, in reading order (left to right, top row first):
1. TOP-LEFT — Withered Cursed Finger: a long dried, dark-brown mummified finger with black tattoo markings and a sharp black nail, resting on an opened small wooden box with paper seal talismans; a creeping dark-red aura.
2. TOP-CENTER — Prison Realm Cube: a small stone-grey cube covered in eyes on every face (some open, some closed), faint purple runic lines between them; deeply unsettling but clean and iconic.
3. TOP-RIGHT — Inverted Spear of Heaven: a short straight dagger-like blade with a jagged multi-pronged guard, a dark handle wrapped in cloth, a cord hanging from the pommel; it cancels magic, so a crackle of broken purple energy shatters around it.
4. BOTTOM-LEFT — Six-Eyes Blindfold: a black cloth blindfold loosely tied in a knot, with a faint bright-blue glow showing through where the eyes would be and tiny blue sparkles; cool, effortless power.
5. BOTTOM-CENTER — Hunter's Fishing Rod: a simple wooden fishing rod with a green handle wrap and a red-and-white float on the line, the hook flicking upward with motion lines; a kid's adventure on a green island.
6. BOTTOM-RIGHT — Ten Training Vest: a plain sand-coloured sleeveless martial-arts vest laid flat, with a soft white-gold aura flowing smoothly around its outline like a protective shell.
```


---

## Planche 7 → `art-incoming/armory/sheet-7.png`

`medic_briefcase` · `steel_skateboard` · `steel_yoyos` · `chain_of_judgement` · `joker_cards` · `royal_carapace`

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
  Accessories are shown close and slightly tilted.
- Each icon must read at 48 px: one strong silhouette, 2-3 main colours, one signature motif.
- Only magic or rare items get a small glow or 2-3 sparkles. No characters, faces or hands: objects only.

ICONS, in reading order (left to right, top row first):
1. TOP-LEFT — Doctor's Briefcase: a battered dark-brown leather briefcase with brass clasps, a red cross sticker and a rolled bandage sticking out of the side; a small knife handle hidden in a side pocket.
2. TOP-CENTER — Steel Skateboard: a heavy grey steel skateboard seen at an angle, scuffed deck, chunky red wheels, a small lightning-bolt sticker; looks much heavier than a normal board.
3. TOP-RIGHT — Steel Yo-Yos: two big shiny steel yo-yos with thick strings, little blue-white lightning sparks crackling along the strings; mischievous assassin-kid vibe.
4. BOTTOM-LEFT — Chain of Judgement: a heavy silver chain coiled in a loop, ending in a sharp sword-shaped blade tip, with a faint golden glow along the links; solemn, vengeful.
5. BOTTOM-CENTER — Joker Throwing Cards: a fanned hand of five playing cards with sharp metallic edges, the front card showing a grinning joker silhouette (no letters), pink sticky aura strands stretching between them.
6. BOTTOM-RIGHT — Royal Guard Carapace: a chest armor made of glossy dark-green insect carapace plates with spiky shoulder pieces and segmented abdomen bands; organic, chitinous, regal.
```


---

## Planche 8 → `art-incoming/armory/sheet-8.png`

`nichirin_blade` · `fox_warding_mask` · `slayer_uniform` · `stopped_watch` · `steel_balls` · `checkered_haori`

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
  Accessories are shown close and slightly tilted.
- Each icon must read at 48 px: one strong silhouette, 2-3 main colours, one signature motif.
- Only magic or rare items get a small glow or 2-3 sparkles. No characters, faces or hands: objects only.

ICONS, in reading order (left to right, top row first):
1. TOP-LEFT — Nichirin Blade: a katana with a deep blue-black blade, a black-and-white diamond-wrapped hilt and a hexagonal guard, a swirling stylised water-wave slash wrapping around the blade.
2. TOP-CENTER — Warding Fox Mask: a white carved wooden fox mask with red markings around the eyes and cheeks, a small flower motif on the forehead and a red cord; protective, traditional.
3. TOP-RIGHT — Slayer Corps Uniform: a black military-style high-collar uniform jacket laid flat, gold buttons, a white belt, a single bold white kanji-like brush mark on the back (abstract, not real text).
4. BOTTOM-LEFT — Stopped Pocket Watch: an ornate gold pocket watch, lid open, hands frozen at the top, small hovering clock fragments and a faint yellow "time stopped" ripple around it.
5. BOTTOM-CENTER — Spinning Steel Balls: two shiny steel spheres covered in engraved spiral grooves, one spinning with golden spiral motion lines, the golden-ratio spiral glowing faintly.
6. BOTTOM-RIGHT — Checkered Haori: a short kimono jacket laid flat with a bold green-and-black checkered pattern, slightly mended at one sleeve; warm, humble, iconic.
```


---

## Planche 9 → `art-incoming/armory/sheet-9.png`

`stand_arrow` · `hanafuda_earrings` · `torn_mask` · `rift_mantle` · `crossover_blade`

```
Create ONE image: a sprite sheet of 5 separate game item icons for a fantasy idle RPG whose worlds are inspired by shonen manga.

LAYOUT (very important, the sheet is cut automatically):
- Landscape image, 1536x1024, a grid of 3 columns x 2 rows of equal square cells (512x512 each).
- Exactly one icon per cell, centred, filling about 75% of its cell, with clear empty space all around it.
  Nothing may touch or cross into another cell. Draw NO grid lines, NO borders, NO frames, NO tiles behind the icons.
- Background: fully TRANSPARENT (PNG with alpha). If transparency is impossible, use one perfectly flat pure green
  (#00FF00) everywhere instead, never white, never a gradient, never a checkerboard, and never use that colour inside an icon.
- No text, no letters, no numbers, no labels, no watermark anywhere.

The BOTTOM-RIGHT cell stays EMPTY (nothing drawn there).

STYLE (same for every icon):
- Clean 2D vector game-icon art, like polished mobile gacha / RPG inventory icons: bold flat colours, simple cel shading
  (one darker shade on the shadow side), a small white gloss highlight on the upper-left, few chunky details.
- A thick, even, dark plum outline (#2a0d1e) around every object and its main inner shapes. No thin hairlines,
  no painterly texture, no 3D render, no photo look.
- Weapons lie diagonally (handle bottom-left, tip top-right). Armor and clothes are shown front-on, laid flat.
  Accessories are shown close and slightly tilted.
- Each icon must read at 48 px: one strong silhouette, 2-3 main colours, one signature motif.
- Only magic or rare items get a small glow or 2-3 sparkles. No characters, faces or hands: objects only.

ICONS, in reading order (left to right, top row first):
1. TOP-LEFT — Stand Arrow: an ancient arrow with a golden beetle-shaped arrowhead made of meteorite stone, a short dark wooden shaft and worn feathers, a mysterious golden aura and floating particles.
2. TOP-CENTER — Hanafuda Earrings: a pair of long rectangular dangling earrings like hanafuda playing cards, painted with a red rising sun over red and white stripes, a faint ember glow.
3. TOP-RIGHT — Torn Stone-Hollow Mask: a mask split down the middle: the left half a grey carved ancient stone mask with fangs, the right half a white bone mask with red stripes, joined by a glowing magenta tear; cosmic and wrong.
4. BOTTOM-LEFT — Mantle of Seven Worlds: a flowing cape-armor made of seven different stitched fabric patches (forest green, sea blue, spirit white, ki orange, curse purple, olive, sun gold), its edges dissolving into magenta stars.
5. BOTTOM-CENTER — Seven-Worlds Blade: a legendary sword whose blade splits into seven stacked edges of different materials and colours, a magenta star-filled core, a gold hilt with a glowing rift gem; the ultimate endgame weapon, radiant.
```
