# Sprites des monstres — prompts ChatGPT par planches

Décision du 2026-11-23 : les ennemis ne sont plus des personnages articulés (rig SVG / creatures.js).
Chaque monstre devient **une image PNG fixe**. Le jeu l'anime lui-même en CSS (respiration, élan, flash
d'impact, tremblement, KO). On garde le combat, ses HUD et ses mécaniques.

**51 monstres → 12 planches** (12 images au lieu de 51) :

| Planche | Contenu | Format | Case | Fond de secours |
|---|---|---|---|---|
| `w-shinobi` | Leaf Village, 6 ennemis | 1536×1024, grille 3×2 | 512×512 | magenta `#FF00FF` |
| `w-seas` | Orange Town, 6 ennemis | 1536×1024, grille 3×2 | 512×512 | magenta `#FF00FF` |
| `w-soul` | Soul City, 6 ennemis | 1536×1024, grille 3×2 | 512×512 | vert `#00FF00` |
| `w-ki` | Kaio Planet, 6 ennemis | 1536×1024, grille 3×2 | 512×512 | magenta `#FF00FF` |
| `w-hex` | Shinjuku, 6 ennemis | 1536×1024, grille 3×2 | 512×512 | vert `#00FF00` |
| `w-hunter` | Green Island, 6 ennemis | 1536×1024, grille 3×2 | 512×512 | magenta `#FF00FF` |
| `w-echo` | Echo Quarter, 6 ennemis | 1536×1024, grille 3×2 | 512×512 | vert `#00FF00` |
| `b-1` | Ashen Fox Beast + Chimera King | 1536×1024, 2 cases côte à côte | 768×1024 | magenta `#FF00FF` |
| `b-2` | Admiral of the Tide + Crimson Tyrant | 1536×1024, 2 cases | 768×1024 | vert `#00FF00` |
| `b-3` | Masked Sovereign + Cursed Matriarch | 1536×1024, 2 cases | 768×1024 | vert `#00FF00` |
| `b-4` | Pillar Lord + Rift Emperor | 1536×1024, 2 cases | 768×1024 | vert `#00FF00` |
| `b-5` | The Unbound (seul) | 1024×1024, 1 case | 1024×1024 | vert `#00FF00` |

Les gardiens sont 1,5 à 2× plus grands à l'écran, d'où des cases plus grandes. Les ennemis « Torn » de la
Faille réutilisent les sprites des mondes (variante faite par Claude, voir plus bas).

## Mode d'emploi

1. Ouvre une conversation ChatGPT (génération d'image). Joins **une fois** l'image de style
   `art-incoming/backgrounds/_reference/style.png` (et, si tu veux, le fond d'arène du monde
   `art-incoming/backgrounds/combat/<monde>.png`), puis colle le **message de la planche** tel quel.
   Une planche = un message = une image. Tu peux enchaîner les planches dans la même conversation.
2. Vérifie l'image avec la liste de contrôle ci-dessous.
3. Enregistre le PNG sous `art-incoming/monsters/<nom de planche>.png` (ex. `w-shinobi.png`, `b-1.png`).
4. Dis-le-moi : je découpe, détoure, aligne au sol, exporte en WebP, fabrique les variantes et branche le tout.

**Liste de contrôle (refaire la planche, ou seulement une case, si un point échoue)**
- Le bon nombre de monstres, **dans l'ordre demandé**, un par case, rien qui déborde d'une case à l'autre.
- Tous **tournés vers la GAUCHE** (le héros est à gauche de l'arène). Un monstre tourné à droite, je peux le
  retourner, sauf s'il a un détail asymétrique (cache-œil, arme dans une main précise).
- Corps **entier**, pieds/base posés sur la même ligne en bas, rien de coupé par le bord de la case.
- Fond **transparent**, ou à défaut **uni** de la couleur de secours (damier ou fond blanc/dégradé = à refaire).
- Aucun texte, chiffre, logo, signature, aucune ombre au sol, aucun décor (pas de rocher, d'herbe ou de mur).
- Aucun élément d'un autre monde (les générateurs recopient parfois l'image de référence : vérifier qu'aucun
  emblème du village ninja n'apparaît sur un monstre de Soul City, etc.).
- Le style ressemble au fond d'arène : cel-shading net, couleurs franches, pas de rendu 3D ni de peinture.

---

## Format technique (ce que je fais des images)

**Ce que ChatGPT livre** : PNG RGBA, une planche par fichier, aux tailles du tableau.
- Transparence réelle (canal alpha) de préférence. Fond uni de secours accepté, je le détoure
  (tolérance + nettoyage du liseré). C'est pour ça que **la couleur de secours ne doit jamais apparaître
  dans un monstre** : magenta pour les mondes verts/bleus, vert pour les mondes violets/roses.
- **Pas de lueur floue, de fumée floue ni de dégradé autour du monstre** : un halo semi-transparent laisse une
  frange impossible à détourer. Flammes, éclairs, brume, eau = formes nettes et pleines, collées au corps.

**Cadrage dans chaque case** (c'est ce qui garde les tailles cohérentes entre monstres)
- Ligne de sol à **94 % de la hauteur de la case** (95 % pour les gardiens). Le point le plus bas du monstre
  (pieds, base, bout de la queue de fumée d'un spectre) touche cette ligne.
- Centré horizontalement. Largeur max **92 %** de la case.
- Hauteur selon la classe de taille, donnée pour chaque monstre :
  - **S** : le sommet du monstre à environ **50 %** de la hauteur de case depuis le sol ;
  - **M** : environ **66 %** ;
  - **L** : environ **84 %** ;
  - **Gardien** : remplit la case, environ **88 %** de sa hauteur (ou 92 % de sa largeur s'il est large).
  Je garde ces proportions en jeu : un Sprout Fiend reste plus petit qu'un Stone Golem.
- Vue de côté en trois-quarts, à hauteur d'yeux, tourné vers la gauche, en garde de combat (pose stable,
  poids au sol : le jeu le fait respirer et bondir, une pose en plein saut paraîtrait figée).

**Ce que le jeu reçoit** (fait par l'outil de découpe)
- `assets/monsters/<monde>/<id>.webp` : rogné au dessin, base alignée au sol, qualité 90, alpha conservé.
  Hauteur max 512 px pour les ennemis, 900 px pour les gardiens (affichés à ~270 px et ~420 px de haut,
  donc nets sur un écran 2×).
- Une ombre de contact douce est ajoutée par le CSS sous chaque monstre (pas dans l'image).

**Variantes (fabriquées par Claude, ChatGPT ne génère que la version de base)**

| Variante | Quand | Comment |
|---|---|---|
| Hardcore | mode Hardcore actif | image dérivée : teintes assombries et poussées vers le cramoisi, liseré rouge net sur le contour |
| Torn | Rift Tear (ennemi d'un monde dans la Faille) | image dérivée : palette tirée vers le violet de la Faille, fissures magenta nettes posées sur le corps, liseré magenta |
| Ascended / Exalted / Mythic | paliers d'Ascension d'un monde | décalage de teinte (or / azur / violet) + liseré de la même couleur, en CSS ou en image si le filtre abîme le dessin |
| Elite / Mini-boss | rangs 1 et 2 | halo CSS déjà en place (bleu / orange), mini-boss 12 % plus grand |
| Impact, KO, coup chargé | combat | flash blanc, secousse, élan, chute : CSS sur l'image |

Le style demandé (aplats nets, contour sombre continu, 3 tons) est choisi pour que ces dérivations restent
propres : un dessin à grain ou à halo se teinte mal.

---

## Règles de style communes (déjà incluses dans chaque prompt)

- Même série que les décors d'arène : illustration 2D digitale de jeu mobile/gacha, cel-shading net,
  couleurs franches et contrastées, ombres froides (bleutées/violacées), lumières chaudes, 3 tons par matière
  + un petit accent. Formes simplifiées, silhouette forte, lisible à 150 px.
- **Contour sombre épais et régulier** (encre presque noire `#17131f`, ~6 px dans une case de 512) autour de
  la silhouette et des grandes formes intérieures : les combattants ressortent du décor, comme le héros.
  Pas de liseré blanc (effet autocollant) : le jeu gère les halos.
- Créatures **originales** inspirées de l'univers du monde, jamais la copie d'un personnage existant.
- Pas de texte, d'ombre portée, de sol, de décor, de grain, de rendu 3D ou réaliste.

---

## Planche w-shinobi → `art-incoming/monsters/w-shinobi.png`

`Bandit Thug` · `Rogue Apprentice` · `Mist Assassin` · `Puppet Drone` · `Ninken Alpha` · `Stone Golem`

```
Create ONE image: a sprite sheet of 6 separate enemy characters for a 2D fantasy idle RPG whose worlds are inspired by shonen manga. This sheet is the ninja-village world (forest greens, slate-blue cliffs, red roofs, warm sunlight).

LAYOUT (very important, the sheet is cut automatically):
- Landscape 1536x1024, an invisible grid of 3 columns x 2 rows of equal square cells (512x512 each).
- Exactly one monster per cell, horizontally centred. Its lowest point (feet, paws, base) sits on an invisible ground line at 94% of the cell height, the same line in every cell. Nothing touches the cell edges or crosses into another cell.
- Size class per monster (height of its top above the ground line, as a share of the cell height): S = about 50%, M = about 66%, L = about 84%. Never wider than 92% of the cell.
- Draw NO grid lines, NO frames, NO tiles, NO ground, NO cast shadow, NO scenery, NO text or numbers.
- Background: fully TRANSPARENT (PNG with alpha). If transparency is impossible, one perfectly flat pure magenta (#FF00FF) everywhere, never white, never a gradient, never a checkerboard, and never use magenta or pink inside a monster.

STYLE (same for every monster, matching the attached background art):
- Crisp digital 2D game art, polished mobile gacha / anime game look: clean cel shading with 3 tones per material (base, cool blue-violet shadow, warm light) plus one small accent; bold saturated colours, strong contrast.
- A thick, even, near-black ink outline (#17131f) around the silhouette and the main inner shapes. No white rim, no sticker border.
- No grain, no paper texture, no brush strokes, no 3D render, no realism.
- Effects (fire, lightning, mist, water, energy) are crisp solid shapes attached to the body, never blurry glows, soft smoke or gradients around the monster.
- Every monster is an ORIGINAL design inspired by the world, not a copy of an existing character.
- Side three-quarter view at eye level, every monster FACING LEFT, in a stable battle-ready stance with its weight on the ground (it will be animated in game). Full body visible.

MONSTERS, in reading order (left to right, top row first):
1. TOP-LEFT — Bandit Thug (M): a stocky scruffy road bandit, tanned skin, torn brown vest (#7A4A2E) over a dirty white shirt, frayed red bandana, a scar across the nose, a chipped short sword held low, a mean grin.
2. TOP-CENTER — Rogue Apprentice (M, slightly smaller than the others): a skinny teenage ninja in a dark navy hood and cloth half-mask (#2F4A6D), crouched low, a kunai in each hand with crisp green venom drops on the blades, a forehead cloth with no emblem.
3. TOP-RIGHT — Mist Assassin (M): a tall lean ninja in pale grey-blue robes and a long scarf (#8A9BC4), face fully masked, cold eyes, crisp solid curls of white mist wrapped around its legs, a long cleaver-like blade held behind its back.
4. BOTTOM-LEFT — Puppet Drone (M): a wooden war puppet, varnished brown segmented limbs (#8A5530) with ball joints, three arms (two with blades, one with a needle launcher), a painted red-and-white theatre-mask face, snapped chakra strings dangling from its shoulders.
5. BOTTOM-CENTER — Ninken Alpha (M, wide): a big lean ninja hound with slate-blue fur (#5E6E9C), red war-paint stripes on its muzzle, a metal forehead plate tied round its neck, bared fangs, crouched ready to pounce.
6. BOTTOM-RIGHT — Stone Golem (L): a massive sentinel of stacked blue-grey stone blocks (#8A9BC4 / #5E6E9C) with small moss tufts (#2E8B4E), a carved seal on its chest glowing amber, tiny glowing eyes, enormous fists.
```

---

## Planche w-seas → `art-incoming/monsters/w-seas.png`

`Navy Recruit` · `Cannon Brute` · `Merfolk Brawler` · `Reef Shark` · `Sea Leviathan` · `Storm Corsair`

```
Create ONE image: a sprite sheet of 6 separate enemy characters for a 2D fantasy idle RPG whose worlds are inspired by shonen manga. This sheet is the pirate-seas world (turquoise ocean, bright sky blue, sand, sun-bleached wood, red and orange accents).

LAYOUT (very important, the sheet is cut automatically):
- Landscape 1536x1024, an invisible grid of 3 columns x 2 rows of equal square cells (512x512 each).
- Exactly one monster per cell, horizontally centred. Its lowest point (feet, base, water splash) sits on an invisible ground line at 94% of the cell height, the same line in every cell. Nothing touches the cell edges or crosses into another cell.
- Size class per monster (height of its top above the ground line, as a share of the cell height): S = about 50%, M = about 66%, L = about 84%. Never wider than 92% of the cell.
- Draw NO grid lines, NO frames, NO tiles, NO ground, NO cast shadow, NO scenery, NO text or numbers.
- Background: fully TRANSPARENT (PNG with alpha). If transparency is impossible, one perfectly flat pure magenta (#FF00FF) everywhere, never white, never a gradient, never a checkerboard, and never use magenta or pink inside a monster.

STYLE (same for every monster, matching the attached background art):
- Crisp digital 2D game art, polished mobile gacha / anime game look: clean cel shading with 3 tones per material (base, cool blue-violet shadow, warm light) plus one small accent; bold saturated colours, strong contrast.
- A thick, even, near-black ink outline (#17131f) around the silhouette and the main inner shapes. No white rim, no sticker border.
- No grain, no paper texture, no brush strokes, no 3D render, no realism.
- Effects (fire, lightning, mist, water, energy) are crisp solid shapes attached to the body, never blurry glows, soft smoke or gradients around the monster.
- Every monster is an ORIGINAL design inspired by the world, not a copy of an existing character.
- Side three-quarter view at eye level, every monster FACING LEFT, in a stable battle-ready stance with its weight on the ground (it will be animated in game). Full body visible.

MONSTERS, in reading order (left to right, top row first):
1. TOP-LEFT — Navy Recruit (M): a young navy marine in a white sailor uniform with a blue collar (#2F6DB5), a white cap a bit too big, a musket with a bayonet held forward, eager and slightly nervous face.
2. TOP-CENTER — Cannon Brute (L): a huge pirate with a barrel chest, tanned skin, a blue-and-white striped shirt, a red bandana (#E8573A), carrying a black ship cannon on one shoulder with a crisp solid puff of smoke at its mouth.
3. TOP-RIGHT — Merfolk Brawler (L): a muscular fish-man with teal skin (#2FA3A0), a fin crest on its head and fins on its forearms, gill lines on the neck, a cloth sash belt, in a martial-arts guard with fists raised.
4. BOTTOM-LEFT — Reef Shark (M, wide): a big shark bursting up out of a crisp stylised water swirl (#138FC4 with white foam #E8F7FF), dark blue-grey back (#0B5C8C), white belly, scarred snout, rows of teeth, mean small eyes. The water swirl is its base on the ground line.
5. BOTTOM-CENTER — Sea Leviathan (L): a sea serpent rising in S-coils out of a churning crisp water whirl, deep teal scales (#138FC4 / #0B5C8C), pale gold belly plates, a spiky fin crest, glowing yellow eyes, jaws open. The water whirl is its base on the ground line.
6. BOTTOM-RIGHT — Storm Corsair (M): a lean pirate in a purple long coat (#7A4A9A), a feathered tricorn hat, an eye patch on the right eye, a cutlass crackling with crisp yellow lightning bolts, a sly grin.
```

---

## Planche w-soul → `art-incoming/monsters/w-soul.png`

`Lesser Husk` · `Lurking Husk` · `Towering Husk` · `Sand Wraith` · `Masked Lancer` · `Bone Priest`

```
Create ONE image: a sprite sheet of 6 separate enemy characters for a 2D fantasy idle RPG whose worlds are inspired by shonen manga. This sheet is the world of masked soul-eating spirits (night blues, moonlight, white bone masks, cyan spirit energy).

LAYOUT (very important, the sheet is cut automatically):
- Landscape 1536x1024, an invisible grid of 3 columns x 2 rows of equal square cells (512x512 each).
- Exactly one monster per cell, horizontally centred. Its lowest point (feet, legs, the tip of a spirit's trailing body) sits on an invisible ground line at 94% of the cell height, the same line in every cell. Nothing touches the cell edges or crosses into another cell.
- Size class per monster (height of its top above the ground line, as a share of the cell height): S = about 50%, M = about 66%, L = about 84%. Never wider than 92% of the cell.
- Draw NO grid lines, NO frames, NO tiles, NO ground, NO cast shadow, NO scenery, NO text or numbers.
- Background: fully TRANSPARENT (PNG with alpha). If transparency is impossible, one perfectly flat pure green (#00FF00) everywhere, never white, never a gradient, never a checkerboard, and never use green inside a monster.

STYLE (same for every monster, matching the attached background art):
- Crisp digital 2D game art, polished mobile gacha / anime game look: clean cel shading with 3 tones per material (base, cool blue-violet shadow, warm light) plus one small accent; bold saturated colours, strong contrast.
- A thick, even, near-black ink outline (#17131f) around the silhouette and the main inner shapes. No white rim, no sticker border.
- No grain, no paper texture, no brush strokes, no 3D render, no realism.
- Effects (fire, lightning, mist, sand, energy) are crisp solid shapes attached to the body, never blurry glows, soft smoke or gradients around the monster.
- Every monster is an ORIGINAL design inspired by the world, not a copy of an existing character.
- Side three-quarter view at eye level, every monster FACING LEFT, in a stable battle-ready stance with its weight on the ground (it will be animated in game). Full body visible.

MONSTERS, in reading order (left to right, top row first):
1. TOP-LEFT — Lesser Husk (M): a hunched beast-like lost soul with a glossy black body (#1B1E4A shadows), long clawed arms, a round hole through its chest, and a cracked white bone mask with jagged teeth and empty yellow eyes.
2. TOP-CENTER — Lurking Husk (M, wide): a spider-like husk on six long jointed black-violet legs folded high, a small body, a narrow white mask with two red stripes, a whip-like venom tail.
3. TOP-RIGHT — Towering Husk (L): a giant cloaked figure in a long black robe covered in small spikes, a very long white mask with a long pointed nose and two tiny glowing eyes, thin arms; a spark of cyan light (#5AC8F0) charging at the mask's mouth.
4. BOTTOM-LEFT — Sand Wraith (M): a desert-wind spirit with no legs, its body made of crisp solid ribbons of sand (#E0B870 / #B07A3A) spiralling down to a point on the ground line, a dark violet core, two glowing cyan eyes, two ribbon arms.
5. BOTTOM-CENTER — Masked Lancer (L): a tall humanoid husk warrior in white bone armour plates over a black body, half a horned bone mask, a long serrated bone lance held forward, a tattered violet loincloth.
6. BOTTOM-RIGHT — Bone Priest (M): a gaunt priest in a tattered dark violet robe (#56446a), a horned white bone mask, a rosary of tiny skulls, a bone staff topped with a sickle in one hand and crisp cyan spirit flames floating over the other palm.
```

---

## Planche w-ki → `art-incoming/monsters/w-ki.png`

`Wasteland Brawler` · `Raging Ape` · `Sprout Fiend` · `Elite Soldier` · `Armored Commander` · `Horned Mutant`

```
Create ONE image: a sprite sheet of 6 separate enemy characters for a 2D fantasy idle RPG whose worlds are inspired by shonen manga. This sheet is the martial-arts space world (warm yellow sky, orange mesas, green grass, white domes, ki energy blasts).

LAYOUT (very important, the sheet is cut automatically):
- Landscape 1536x1024, an invisible grid of 3 columns x 2 rows of equal square cells (512x512 each).
- Exactly one monster per cell, horizontally centred. Its lowest point (feet) sits on an invisible ground line at 94% of the cell height, the same line in every cell. Nothing touches the cell edges or crosses into another cell.
- Size class per monster (height of its top above the ground line, as a share of the cell height): S = about 50%, M = about 66%, L = about 84%. Never wider than 92% of the cell.
- Draw NO grid lines, NO frames, NO tiles, NO ground, NO cast shadow, NO scenery, NO text or numbers.
- Background: fully TRANSPARENT (PNG with alpha). If transparency is impossible, one perfectly flat pure magenta (#FF00FF) everywhere, never white, never a gradient, never a checkerboard, and never use magenta or pink inside a monster.

STYLE (same for every monster, matching the attached background art):
- Crisp digital 2D game art, polished mobile gacha / anime game look: clean cel shading with 3 tones per material (base, cool blue-violet shadow, warm light) plus one small accent; bold saturated colours, strong contrast.
- A thick, even, near-black ink outline (#17131f) around the silhouette and the main inner shapes. No white rim, no sticker border.
- No grain, no paper texture, no brush strokes, no 3D render, no realism.
- Effects (energy balls, beams, acid) are crisp solid shapes attached to the body, never blurry glows, soft smoke or gradients around the monster.
- Every monster is an ORIGINAL design inspired by the world, not a copy of an existing character.
- Side three-quarter view at eye level, every monster FACING LEFT, in a stable battle-ready stance with its weight on the ground (it will be animated in game). Full body visible.

MONSTERS, in reading order (left to right, top row first):
1. TOP-LEFT — Wasteland Brawler (M): a muscular wandering martial artist in a torn orange gi (#E08A3A) with a dark blue belt, bandaged fists raised, a shaved head with a short topknot, scuffed sandals.
2. TOP-CENTER — Raging Ape (L): a giant brown-furred ape (#8A5530 fur, tan face and chest), glowing red eyes, fangs bared, a long furry tail, a broken piece of armour strapped on one shoulder, knuckles on the ground.
3. TOP-RIGHT — Sprout Fiend (S): a small fierce plant creature with smooth leaf-green skin (#5DBB3F) and dark green vein ridges, a curled sprout and two leaves growing from the top of its bulbous head, root-like toes, glowing red eyes, crouched, a crisp drop of yellow acid at its mouth.
4. BOTTOM-LEFT — Elite Soldier (M): an alien soldier in white chest armour with pale gold trim and blue-grey shoulder pads (#F4F1E6 / #4D5A73), a black bodysuit, a curved green glass visor over one eye, one palm forward charging a crisp solid ball of yellow energy.
5. BOTTOM-CENTER — Armored Commander (L): a bulky commander in layered slate-blue plate armour (#4D5A73) with red accents (#D8452F), a horned helmet with a T-shaped visor, a short cape, a huge two-handed warhammer resting on its shoulder.
6. BOTTOM-RIGHT — Horned Mutant (L): a failed lab experiment, a hulking creature with dark maroon skin (#7A2E3A), lumpy muscles, several uneven bone horns growing from its head and shoulders, a torn hospital-style bracelet, wild yellow eyes.
```

---

## Planche w-hex → `art-incoming/monsters/w-hex.png`

`Grudge Spirit` · `Hollow Sorcerer` · `Shrine Specter` · `Bound Corpse` · `Veil Walker` · `Elder Curse`

```
Create ONE image: a sprite sheet of 6 separate enemy characters for a 2D fantasy idle RPG whose worlds are inspired by shonen manga. This sheet is the modern-city curse world (night city, wet asphalt, cyan and magenta neon, violet cursed energy, red shrine accents).

LAYOUT (very important, the sheet is cut automatically):
- Landscape 1536x1024, an invisible grid of 3 columns x 2 rows of equal square cells (512x512 each).
- Exactly one monster per cell, horizontally centred. Its lowest point (feet, base, the tip of a spirit's trailing body) sits on an invisible ground line at 94% of the cell height, the same line in every cell. Nothing touches the cell edges or crosses into another cell.
- Size class per monster (height of its top above the ground line, as a share of the cell height): S = about 50%, M = about 66%, L = about 84%. Never wider than 92% of the cell.
- Draw NO grid lines, NO frames, NO tiles, NO ground, NO cast shadow, NO scenery, NO text or numbers.
- Background: fully TRANSPARENT (PNG with alpha). If transparency is impossible, one perfectly flat pure green (#00FF00) everywhere, never white, never a gradient, never a checkerboard, and never use green or lime inside a monster.

STYLE (same for every monster, matching the attached background art):
- Crisp digital 2D game art, polished mobile gacha / anime game look: clean cel shading with 3 tones per material (base, cool blue-violet shadow, warm light) plus one small accent; bold saturated colours, strong contrast.
- A thick, even, near-black ink outline (#17131f) around the silhouette and the main inner shapes. No white rim, no sticker border.
- No grain, no paper texture, no brush strokes, no 3D render, no realism.
- Effects (cursed energy, spirit flames, barriers) are crisp solid shapes attached to the body, never blurry glows, soft smoke or gradients around the monster.
- Every monster is an ORIGINAL design inspired by the world, not a copy of an existing character. Creepy but readable, no gore.
- Side three-quarter view at eye level, every monster FACING LEFT, in a stable battle-ready stance with its weight on the ground (it will be animated in game). Full body visible.

MONSTERS, in reading order (left to right, top row first):
1. TOP-LEFT — Grudge Spirit (M): a floating curse with no legs, a sickly violet body (#6B2FA8 / #2A0F45) tapering to a point on the ground line, a wailing oversized mouth, four mismatched yellow eyes, torn paper charms stuck to it, long thin arms.
2. TOP-CENTER — Hollow Sorcerer (M): a pale curse user in a black high-collared school-style uniform, dark swept hair, black tattoo lines across the face, a cursed sickle in one hand and a crisp cyan hexagonal barrier sigil (#2FE3F0) floating in front of the other palm.
3. TOP-RIGHT — Shrine Specter (M): a ghostly shrine maiden in a torn white robe and red hakama (#D63A3A), very long black hair, face hidden behind hanging paper seals, feet not touching the ground but her robe hem reaching the ground line, crisp blue spirit flames floating beside her.
4. BOTTOM-LEFT — Bound Corpse (L): a hulking stitched-together corpse with grey-green skin (#76887A), heavy stitches, wrapped in rope and paper seal strips, stitched-shut eyes, slumped heavy shoulders, huge hands.
5. BOTTOM-CENTER — Veil Walker (M): a tall thin figure in a long dark navy coat (#2A2E45), white hair, a calm cruel face, half of its body sliced into crisp offset cyan-edged slices as if stepping through a tear in space, a broad cleaver in hand.
6. BOTTOM-RIGHT — Elder Curse (L): a huge lumpy blob-curse of dark violet flesh (#4A2A5A), several fanged mouths along its body, one giant acid-yellow eye (#F5E14A), dark teal moss growing on its back, short stubby legs.
```

---

## Planche w-hunter → `art-incoming/monsters/w-hunter.png`

`Rival Examinee` · `Swamp Mimic` · `Cliff Wyvern` · `Bandit Hunter` · `Ruin Guardian` · `Feral Chimera`

```
Create ONE image: a sprite sheet of 6 separate enemy characters for a 2D fantasy idle RPG whose worlds are inspired by shonen manga. This sheet is the wild-island hunter world (deep jungle greens, misty cliffs, waterfalls, mud browns, ancient ruins).

LAYOUT (very important, the sheet is cut automatically):
- Landscape 1536x1024, an invisible grid of 3 columns x 2 rows of equal square cells (512x512 each).
- Exactly one monster per cell, horizontally centred. Its lowest point (feet, paws, base) sits on an invisible ground line at 94% of the cell height, the same line in every cell. Nothing touches the cell edges or crosses into another cell.
- Size class per monster (height of its top above the ground line, as a share of the cell height): S = about 50%, M = about 66%, L = about 84%. Never wider than 92% of the cell.
- Draw NO grid lines, NO frames, NO tiles, NO ground, NO cast shadow, NO scenery, NO text or numbers.
- Background: fully TRANSPARENT (PNG with alpha). If transparency is impossible, one perfectly flat pure magenta (#FF00FF) everywhere, never white, never a gradient, never a checkerboard, and never use magenta or pink inside a monster.

STYLE (same for every monster, matching the attached background art):
- Crisp digital 2D game art, polished mobile gacha / anime game look: clean cel shading with 3 tones per material (base, cool blue-violet shadow, warm light) plus one small accent; bold saturated colours, strong contrast.
- A thick, even, near-black ink outline (#17131f) around the silhouette and the main inner shapes. No white rim, no sticker border.
- No grain, no paper texture, no brush strokes, no 3D render, no realism.
- Effects (venom, beams) are crisp solid shapes attached to the body, never blurry glows, soft smoke or gradients around the monster.
- Every monster is an ORIGINAL design inspired by the world, not a copy of an existing character.
- Side three-quarter view at eye level, every monster FACING LEFT, in a stable battle-ready stance with its weight on the ground (it will be animated in game). Full body visible.

MONSTERS, in reading order (left to right, top row first):
1. TOP-LEFT — Rival Examinee (M): a wiry cocky teenager taking a hunter exam, wild spiky hair, a short green jacket (#1E6B3A) over a white shirt, a blank round badge pinned on the chest (no number), a steel yo-yo on a string spinning from one hand.
2. TOP-CENTER — Swamp Mimic (M, wide): a mossy old treasure chest (#6B4A2E wood, tarnished brass corners) that is really a monster: its lid opens into a mouth full of teeth, a long red tongue (#C23A3A), stubby crab legs, moss and swamp weeds (#7CCB3E) on top.
3. TOP-RIGHT — Cliff Wyvern (L, wide): a lean wyvern with olive-green scales (#5C7A3A) and a cream belly, wings half spread, clawed wing-hands on the ground, a barbed tail dripping crisp purple venom, fierce yellow eyes.
4. BOTTOM-LEFT — Bandit Hunter (M): a ragged hunter in a fur-trimmed brown hood and leather gear (#6B4A2E / #3E2A1C), a quiver on the back, a bow drawn with an arrow nocked, a scar under one eye.
5. BOTTOM-CENTER — Ruin Guardian (L): an ancient guardian machine of weathered grey stone (#8C8A7A / #5C5B52) and green-bronze plates, moss and small vines on its shoulders, one large round cyan eye lens, heavy pillar-like arms.
6. BOTTOM-RIGHT — Feral Chimera (L, wide): a hungry chimera with a tawny lion body and dark brown mane, a horned goat head growing from its back, a green snake for a tail (#3F8A5A) hissing, claws spread.
```

---

## Planche w-echo → `art-incoming/monsters/w-echo.png`

`Masked Vampire` · `Sunlight Monk` · `Living Statue` · `Echo Thief` · `Pillar Warrior` · `Wind Pillar Guard`

```
Create ONE image: a sprite sheet of 6 separate enemy characters for a 2D fantasy idle RPG whose worlds are inspired by shonen manga. This sheet is the flamboyant bizarre-adventure world (dramatic poses, pink, mint, violet and gold, marble, desert sand).

LAYOUT (very important, the sheet is cut automatically):
- Landscape 1536x1024, an invisible grid of 3 columns x 2 rows of equal square cells (512x512 each).
- Exactly one monster per cell, horizontally centred. Its lowest point (feet) sits on an invisible ground line at 94% of the cell height, the same line in every cell. Nothing touches the cell edges or crosses into another cell.
- Size class per monster (height of its top above the ground line, as a share of the cell height): S = about 50%, M = about 66%, L = about 84%. Never wider than 92% of the cell.
- Draw NO grid lines, NO frames, NO tiles, NO ground, NO cast shadow, NO scenery, NO text or numbers.
- Background: fully TRANSPARENT (PNG with alpha). If transparency is impossible, one perfectly flat pure green (#00FF00) everywhere, never white, never a gradient, never a checkerboard, and never use green or lime inside a monster.

STYLE (same for every monster, matching the attached background art):
- Crisp digital 2D game art, polished mobile gacha / anime game look: clean cel shading with 3 tones per material (base, cool blue-violet shadow, warm light) plus one small accent; bold saturated colours, strong contrast. Strong dramatic poses.
- A thick, even, near-black ink outline (#17131f) around the silhouette and the main inner shapes. No white rim, no sticker border.
- No grain, no paper texture, no brush strokes, no 3D render, no realism.
- Effects (sunlight ripples, wind, afterimages) are crisp solid shapes attached to the body, never blurry glows, soft smoke or gradients around the monster.
- Every monster is an ORIGINAL design inspired by the world, not a copy of an existing character.
- Side three-quarter view at eye level, every monster FACING LEFT, in a stable battle-ready stance with its weight on the ground (it will be animated in game). Full body visible.

MONSTERS, in reading order (left to right, top row first):
1. TOP-LEFT — Masked Vampire (M): an elegant vampire in a dark crimson long coat (#6A1F30) with gold buttons, very pale skin, slicked hair, an ornate grey stone mask pushed up on the forehead, long claws, fangs, a theatrical twisted pose.
2. TOP-CENTER — Sunlight Monk (M): a muscular monk in orange-gold robes (#D0943A) tied with a violet sash, a calm focused face, fists wrapped in crisp solid golden ripple rings of sunlight energy, a deep breathing stance.
3. TOP-RIGHT — Living Statue (L): a marble guard statue (#F7EBDD with cool lilac shadows) with gold trim (#F2C23A), cracks across the body, glowing violet eyes (#7A4BC8), a marble spear and round shield, half its base still a stone pedestal block standing on the ground line.
4. BOTTOM-LEFT — Echo Thief (M): a slim thief in a short lavender coat (#7A4BC8) with mint trim (#4FD1B0), a gold laurel wreath, a white marble half mask, a crystal dagger, and a crisp pink-outlined afterimage copy of itself just behind it, slightly offset.
5. BOTTOM-CENTER — Pillar Warrior (L): an ancient giant warrior with bronze skin (#9A7450), huge muscles, a loincloth and gold arm bands, an ornate headpiece with a short horn on the forehead, a calm arrogant face, arms crossed or one fist raised.
6. BOTTOM-RIGHT — Wind Pillar Guard (L): an ancient tall warrior with teal skin (#4A9A9A), a gold laurel headpiece, a bone-white lance, crisp solid ribbons of wind spiralling around its arms and legs.
```

---

## Planche b-1 (gardiens) → `art-incoming/monsters/b-1.png`

`Ashen Fox Beast` (Leaf Village) · `Chimera King` (Green Island)

```
Create ONE image: a sprite sheet of 2 separate BOSS monsters for a 2D fantasy idle RPG whose worlds are inspired by shonen manga. These are world guardians: big, imposing, iconic.

LAYOUT (very important, the sheet is cut automatically):
- Landscape 1536x1024, two invisible side-by-side cells of 768x1024 each.
- Exactly one boss per cell, horizontally centred. Its lowest point (feet, paws, base) sits on an invisible ground line at 95% of the cell height. It fills about 88% of the cell height (or 92% of its width if the boss is wide). Nothing touches the cell edges or crosses into the other cell.
- Draw NO grid lines, NO frames, NO tiles, NO ground, NO cast shadow, NO scenery, NO text or numbers.
- Background: fully TRANSPARENT (PNG with alpha). If transparency is impossible, one perfectly flat pure magenta (#FF00FF) everywhere, never white, never a gradient, never a checkerboard, and never use magenta or pink inside a boss.

STYLE (same for every boss, matching the attached background art):
- Crisp digital 2D game art, polished mobile gacha / anime game look: clean cel shading with 3 tones per material (base, cool blue-violet shadow, warm light) plus one small accent; bold saturated colours, strong contrast. More detail than a normal enemy, still a strong readable silhouette.
- A thick, even, near-black ink outline (#17131f) around the silhouette and the main inner shapes. No white rim, no sticker border.
- No grain, no paper texture, no brush strokes, no 3D render, no realism.
- Effects (fire, wings, energy) are crisp solid shapes attached to the body, never blurry glows, soft smoke or gradients around the boss.
- Every boss is an ORIGINAL design inspired by the world, not a copy of an existing character.
- Side three-quarter view at eye level, FACING LEFT, in a stable menacing battle stance with its weight on the ground (it will be animated in game). Full body visible.

BOSSES:
1. LEFT — Ashen Fox Beast: a giant sealed fox beast with ember-orange fur (#E9693A), a cream chest, charcoal-tipped ears and paws, slit yellow eyes, snarling, crouched low; five big tails fanned behind it, each tip ending in crisp solid orange-and-yellow flames; a few broken seal-paper strips and a snapped rope still clinging to its neck.
2. RIGHT — Chimera King: a royal winged chimera with a golden lion body (#D8A84A), a deep red mane (#8A2A2A) with a small bone crown, curling cream ram horns, dark red bat-like wings spread (#7A2A3A), a green serpent tail (#3F8A5A) with its own fangs, red slit eyes, roaring.
```

---

## Planche b-2 (gardiens) → `art-incoming/monsters/b-2.png`

`Admiral of the Tide` (Orange Town) · `Crimson Tyrant` (Kaio Planet)

```
Create ONE image: a sprite sheet of 2 separate BOSS monsters for a 2D fantasy idle RPG whose worlds are inspired by shonen manga. These are world guardians: big, imposing, iconic.

LAYOUT (very important, the sheet is cut automatically):
- Landscape 1536x1024, two invisible side-by-side cells of 768x1024 each.
- Exactly one boss per cell, horizontally centred. Its lowest point (feet, base) sits on an invisible ground line at 95% of the cell height. It fills about 88% of the cell height. Nothing touches the cell edges or crosses into the other cell.
- Draw NO grid lines, NO frames, NO tiles, NO ground, NO cast shadow, NO scenery, NO text or numbers.
- Background: fully TRANSPARENT (PNG with alpha). If transparency is impossible, one perfectly flat pure green (#00FF00) everywhere, never white, never a gradient, never a checkerboard, and never use green or lime inside a boss.

STYLE (same for every boss, matching the attached background art):
- Crisp digital 2D game art, polished mobile gacha / anime game look: clean cel shading with 3 tones per material (base, cool blue-violet shadow, warm light) plus one small accent; bold saturated colours, strong contrast. More detail than a normal enemy, still a strong readable silhouette.
- A thick, even, near-black ink outline (#17131f) around the silhouette and the main inner shapes. No white rim, no sticker border.
- No grain, no paper texture, no brush strokes, no 3D render, no realism.
- Effects (water, energy) are crisp solid shapes attached to the body, never blurry glows, soft smoke or gradients around the boss.
- Every boss is an ORIGINAL design inspired by the world, not a copy of an existing character.
- Side three-quarter view at eye level, FACING LEFT, in a stable menacing battle stance with its weight on the ground (it will be animated in game). Full body visible.

BOSSES:
1. LEFT — Admiral of the Tide: an imposing navy admiral, tall and broad, a dark navy suit (#2A3F6E), a white admiral's coat worn like a cape over the shoulders with gold epaulettes and gold trim, a peaked white cap, a stern scarred face, a long sabre held point-down; a crisp solid swirl of sea water (#138FC4 with white foam) curling around his boots and up his sword arm.
2. RIGHT — Crimson Tyrant: a slender alien warlord-emperor, smooth white and crimson armoured body (#F4F1E6 / #C0303F), two swept-back black horns, violet gem plates on the shoulders and head, a long armoured tail, a dark red cape, cold red eyes, one finger raised with a crisp solid crimson energy sphere above it.
```

---

## Planche b-3 (gardiens) → `art-incoming/monsters/b-3.png`

`Masked Sovereign` (Soul City) · `Cursed Matriarch` (Shinjuku)

```
Create ONE image: a sprite sheet of 2 separate BOSS monsters for a 2D fantasy idle RPG whose worlds are inspired by shonen manga. These are world guardians: big, imposing, iconic.

LAYOUT (very important, the sheet is cut automatically):
- Landscape 1536x1024, two invisible side-by-side cells of 768x1024 each.
- Exactly one boss per cell, horizontally centred. Its lowest point (feet, robe hem) sits on an invisible ground line at 95% of the cell height. It fills about 88% of the cell height. Nothing touches the cell edges or crosses into the other cell.
- Draw NO grid lines, NO frames, NO tiles, NO ground, NO cast shadow, NO scenery, NO text or numbers.
- Background: fully TRANSPARENT (PNG with alpha). If transparency is impossible, one perfectly flat pure green (#00FF00) everywhere, never white, never a gradient, never a checkerboard, and never use green or lime inside a boss.

STYLE (same for every boss, matching the attached background art):
- Crisp digital 2D game art, polished mobile gacha / anime game look: clean cel shading with 3 tones per material (base, cool blue-violet shadow, warm light) plus one small accent; bold saturated colours, strong contrast. More detail than a normal enemy, still a strong readable silhouette.
- A thick, even, near-black ink outline (#17131f) around the silhouette and the main inner shapes. No white rim, no sticker border.
- No grain, no paper texture, no brush strokes, no 3D render, no realism.
- Effects (spirit wisps, cursed energy) are crisp solid shapes attached to the body, never blurry glows, soft smoke or gradients around the boss.
- Every boss is an ORIGINAL design inspired by the world, not a copy of an existing character. Creepy but readable, no gore.
- Side three-quarter view at eye level, FACING LEFT, in a stable menacing battle stance with its weight on the ground (it will be animated in game). Full body visible.

BOSSES:
1. LEFT — Masked Sovereign: a towering regal masked spirit-king in a long black and deep violet robe and cloak (#2C2140), a crown made of many overlapping white bone masks, its own face mask cracked to show a second mask underneath, black horns, a long dark curved blade, crisp cyan spirit wisps (#5AC8F0) circling its shoulders.
2. RIGHT — Cursed Matriarch: a tall eerie mother of curses, grey-violet skin, very long black hair falling to the ground, a violet-black kimono (#2A0F45) with crisp magenta curse-mark patterns (#FF3FA4), four long thin arms (two holding long sewing needles, two cradling a small bundle of shadow), a serene closed-eye face with a third open eye on the forehead.
```

---

## Planche b-4 (gardiens) → `art-incoming/monsters/b-4.png`

`Pillar Lord` (Echo Quarter) · `Rift Emperor` (The Rift)

```
Create ONE image: a sprite sheet of 2 separate BOSS monsters for a 2D fantasy idle RPG whose worlds are inspired by shonen manga. These are world guardians: big, imposing, iconic.

LAYOUT (very important, the sheet is cut automatically):
- Landscape 1536x1024, two invisible side-by-side cells of 768x1024 each.
- Exactly one boss per cell, horizontally centred. Its lowest point (feet) sits on an invisible ground line at 95% of the cell height. It fills about 88% of the cell height. Nothing touches the cell edges or crosses into the other cell.
- Draw NO grid lines, NO frames, NO tiles, NO ground, NO cast shadow, NO scenery, NO text or numbers.
- Background: fully TRANSPARENT (PNG with alpha). If transparency is impossible, one perfectly flat pure green (#00FF00) everywhere, never white, never a gradient, never a checkerboard, and never use green or lime inside a boss.

STYLE (same for every boss, matching the attached background art):
- Crisp digital 2D game art, polished mobile gacha / anime game look: clean cel shading with 3 tones per material (base, cool blue-violet shadow, warm light) plus one small accent; bold saturated colours, strong contrast. More detail than a normal enemy, still a strong readable silhouette.
- A thick, even, near-black ink outline (#17131f) around the silhouette and the main inner shapes. No white rim, no sticker border.
- No grain, no paper texture, no brush strokes, no 3D render, no realism.
- Effects (rift cracks, energy) are crisp solid shapes attached to the body, never blurry glows, soft smoke or gradients around the boss.
- Every boss is an ORIGINAL design inspired by the world, not a copy of an existing character.
- Side three-quarter view at eye level, FACING LEFT, in a stable menacing battle stance with its weight on the ground (it will be animated in game). Full body visible.

BOSSES:
1. LEFT — Pillar Lord: an ancient god-like warrior older than the city, violet skin (#84409A) with gold tattoo lines (#F2C23A), a gold laurel crown, a long violet-and-white coat, huge wings made of carved white marble feathers (#F7EBDD) spread behind it, a long curved blade, a dramatic flamboyant pose.
2. RIGHT — Rift Emperor: an emperor of torn worlds in dark violet-black armour (#2A1550) split by glowing crisp magenta rift cracks (#FF2FB0), a jagged crown, a single huge magenta eye sigil on the chest, a heavy cape whose lining shows small fragments of other landscapes (a forest, a sea, a night city), a giant cleaver held in one hand.
```

---

## Planche b-5 (gardien final) → `art-incoming/monsters/b-5.png`

`The Unbound` (The Rift)

```
Create ONE image: a single BOSS monster sprite for a 2D fantasy idle RPG whose worlds are inspired by shonen manga. It is the final boss, sealed behind a rift between worlds.

LAYOUT (very important, the image is cut automatically):
- Square 1024x1024, one boss, horizontally centred. Its lowest point (the tip of its trailing body) sits on an invisible ground line at 95% of the image height. It fills about 88% of the image height. Nothing touches the image edges.
- Draw NO frames, NO ground, NO cast shadow, NO scenery, NO text or numbers.
- Background: fully TRANSPARENT (PNG with alpha). If transparency is impossible, one perfectly flat pure green (#00FF00) everywhere, never white, never a gradient, never a checkerboard, and never use green or lime inside the boss.

STYLE (matching the attached background art):
- Crisp digital 2D game art, polished mobile gacha / anime game look: clean cel shading with 3 tones per material (base, cool blue-violet shadow, warm light) plus one small accent; bold saturated colours, strong contrast.
- A thick, even, near-black ink outline (#17131f) around the silhouette and the main inner shapes. No white rim, no sticker border.
- No grain, no paper texture, no brush strokes, no 3D render, no realism.
- Effects are crisp solid shapes attached to the body, never blurry glows, soft smoke or gradients around the boss.
- An ORIGINAL design, not a copy of an existing character.
- Facing LEFT, menacing, looming.

BOSS:
The Unbound: a shapeless hunger with no fixed form, a towering hooded mass of deep night-violet darkness (#14102A) whose surface is speckled with tiny pink stars (#FFD0EE), many glowing magenta eyes (#FF5BD8) of different sizes scattered over its body, a broken violet halo ring (#8B2BD6) floating behind its head, long ragged claw-arms reaching forward, its lower body tapering into torn ribbons down to the ground line.
```
