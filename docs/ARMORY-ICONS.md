# Icônes de l'Armurerie manga — prompts ChatGPT

53 nouveaux équipements (`js/armory.js`). Chacun a déjà une icône de secours (glyphe une couleur) ;
ces prompts servent à générer la vraie icône peinte, dans le style des 335 icônes existantes
(`assets/item-icons/<monde>/<id>.png`).

## Mode d'emploi

1. Dans ChatGPT (génération d'image), colle d'abord le **bloc STYLE** ci-dessous, une seule fois par conversation.
2. Ensuite envoie les items **un par un** : `Icon: <ligne de l'item>`. Une image par item donne de bien meilleurs
   résultats qu'une planche de 9.
3. Demande un PNG **1024×1024 à fond transparent**. Si le fond n'est pas transparent, redemande :
   « same icon, transparent background, no shadow ».
4. Enregistre chaque image sous `art-incoming/armory/<id>.png` (le nom = l'id en gras, ex. `wado_blade.png`).
   Je les réduis en 256×256, je les range dans le bon dossier de monde et je les branche dans le jeu.

---

## Bloc STYLE (à coller en premier)

```
You are making item icons for a fantasy idle RPG whose worlds are each inspired by a famous shonen manga.
I will send you one item at a time; make ONE icon per message, all in exactly this style:

- A single object, centered, filling about 80% of a square canvas, on a fully TRANSPARENT background.
  No scene, no floor, no cast shadow, no frame, no tile, no text, no letters, no watermark.
- Clean 2D vector game-icon look, like a polished mobile gacha / RPG inventory icon:
  bold flat colours with simple cel shading (one darker shade on the shadow side, one soft lighter band),
  a small white gloss highlight on the upper-left, very few chunky details.
- A thick, even, dark plum outline (#2a0d1e, about 3% of the image width) around the whole silhouette and
  the main inner shapes. No thin hairlines, no gradients noise, no painterly texture, no 3D render.
- Weapons lie diagonally: handle bottom-left, tip top-right. Armor is shown front-on, flat, like a garment
  laid out. Accessories are shown close, slightly tilted, so their shape reads instantly.
- The silhouette must be recognisable at 48 px: one strong shape, 2-3 main colours, one signature motif.
- Rare/magic items may have a small glow or 2-3 sparkles; ordinary gear has none.
- Do not draw any character, face or hand holding the item: only the object.
```

---

## Les items (un message chacun)

Format : **id** — Nom en jeu — description visuelle. Le dossier final est indiqué par monde.

### Leaf Village (Naruto) → `leaf/`

- **leaf_weights** — Rock's Leg Weights — a pair of heavy olive-green fabric leg weights with thick buckled straps, lead blocks sewn in rows, one of them slightly open showing a grey lead plate; sporty, earnest, martial-arts training gear.
- **three_prong_kunai** — Three-Pronged Kunai — a black steel kunai with a three-pronged tip (one long central blade, two curved side prongs), a white cloth-wrapped grip and a ring pommel; a small paper tag with an ink seal formula tied to the grip, a thin yellow flash spark at the tip.
- **chakra_threads** — Puppeteer's Chakra Threads — ten glowing cyan-blue chakra threads fanning out from a small wooden puppet-control cross, tied to a tiny wooden puppet joint; desert-ninja puppeteer vibe, soft blue glow.
- **springtime_suit** — Springtime Jumpsuit — a skin-tight bright green one-piece training jumpsuit laid flat, orange leg warmers at the ankles, a red cloth forehead protector folded as a belt at the waist; earnest martial-arts look.
- **sand_gourd** — Gourd of Living Sand — a large tan clay gourd with a cork stopper and a thick leather shoulder strap, a ring of swirling golden sand spilling out of the top and curling protectively around it.
- **shark_skin_sword** — Shark-Skin Greatsword — a huge club-like greatsword wrapped in rough blue-grey shark scales and bandages, spiky scale edges, a single fanged mouth half-visible near the tip, a skull-like pommel; it looks alive.

### Orange Town (One Piece) → `seas/`

- **justice_coat** — Justice Greatcoat — a long white navy cape-coat laid flat, worn over the shoulders, with gold epaulettes, a blue inner lining and a bold blue vertical stripe; a blank emblem plate on the back (no text).
- **red_vest** — Rubber Captain's Vest — a short open red sleeveless vest with four yellow buttons, slightly stretched and worn at the edges, a small stitched patch; cheerful pirate-captain energy.
- **straw_hat** — Treasured Straw Hat — a woven straw hat with a wide brim and a bright red band, a few loose straws and a small mended stitch, seen at a 3/4 angle; iconic, warm, adventurous.
- **wado_blade** — Pure-White Wado Blade — an elegant katana with a white diamond-wrapped handle, a gold round guard and a white lacquered scabbard partly sliding off the blade; calm, pure, swordsman's vow.
- **black_leg_boots** — Black-Leg Chef Shoes — a pair of polished black leather dress shoes, one with orange flames licking around the sole and heel, a tiny cook's spoon charm on the lace; elegant fighting chef.
- **weather_baton** — Weather Baton — a blue segmented metal staff in three connected pieces with round knobs, a small storm cloud forming above the top segment with a yellow zigzag lightning bolt; navigator's weather weapon.
- **sniper_goggles** — Sniper King Goggles — round flip-down aviator goggles with orange-tinted lenses and a leather strap, a small crosshair reticle reflected on one lens, a slingshot charm hanging from the strap.
- **seastone_cuffs** — Seastone Cuffs — a pair of heavy grey-teal stone handcuffs with a stone chain, faint wave patterns carved into the stone, a few water droplets; feels heavy and power-draining.

### Soul City (Bleach) → `soul/`

- **asauchi** — Asauchi Blank Blade — a plain katana with a simple dark-grey wrapped hilt and a square silver guard, a clean unmarked blade, a faint pale spirit wisp curling off the edge as if it is about to speak.
- **flash_sandals** — Flash-Step Sandals — a pair of traditional straw sandals with white thong straps, worn thin, with motion streaks and a small white afterimage trail behind them; speed and silence.
- **quincy_cross** — Quincy Cross — a silver five-pointed cross pendant (pentacle-like star cross) on a thin silver chain, glowing pale-blue spirit particles gathering around it into the shape of a small bow of light.
- **hollow_mask_half** — Shattered Hollow Mask — the left half of a white bone mask with jagged broken edges, empty eye hole, two red stripes across it, a crack running down; eerie, a faint dark-red aura.
- **captain_haori** — Captain's Haori — a sleeveless white haori coat laid flat, with a black inner robe peeking at the collar, a diamond pattern along the hem and a blank black rhombus emblem on the back (no numbers or text).
- **bankai_blade** — Black Moon Bankai Blade — a slim all-black katana with a red-black edge glint, a small square guard with four short bent arms, and a short broken chain dangling from the pommel; a black-red crescent slash of energy behind it.

### Kaio Planet (Dragon Ball) → `kaio/`

- **turtle_gi** — Turtle School Gi — a bright orange martial-arts gi top laid flat, blue undershirt and blue belt, a round white patch on the chest with a simple turtle-shell symbol (no letters).
- **power_pole** — Extending Power Pole — a long red staff with golden metal caps at both ends, shown diagonally with a motion stretch effect at one end as if it is extending; magical, playful.
- **nimbus_charm** — Flying Nimbus Charm — a small round glass charm on a cord containing a fluffy golden-yellow cloud, with a tiny cloud puff escaping from the top; soft warm glow.
- **senzu_pouch** — Senzu Bean Pouch — a small brown cloth drawstring pouch, open, with three plump green beans spilling out, one bean glowing softly; humble but precious.
- **ki_blaster** — Capsule Ki Blaster — a chunky retro-futuristic handheld ray gun in white and blue, a round capsule-shaped body with a small number plate (no text), a glowing cyan energy orb at the muzzle.
- **z_sword** — Z Sword — a massive legendary broadsword with a wide silver blade, a gold and red ornate crossguard, a large red jewel at the hilt; heavy, ancient, slightly glowing.
- **fusion_earrings** — Fusion Earrings — a pair of earrings, each a small yellow-gold ring holding a green-yellow round jewel, shown side by side with a tiny spark of energy arcing between them.

### Shinjuku (Jujutsu Kaisen) → `hex/`

- **jujutsu_uniform** — Jujutsu High Uniform — a dark navy high-collar school uniform jacket laid flat, gold spiral buttons down the front, a subtle purple cursed-energy glow along the seams.
- **resonance_hammer** — Straw Doll Hammer & Nails — a small wooden-handled steel hammer crossed with a straw voodoo doll pierced by two long iron nails, faint blue cursed sparks around the nails.
- **playful_cloud** — Playful Cloud Staff — a three-section staff: three red lacquered rods with gold metal ends joined by short chains, arranged in a dynamic Z shape; pure physical weapon, no glow.
- **cursed_finger** — Withered Cursed Finger — a long dried, dark-brown mummified finger with black tattoo markings and a sharp black nail, resting on an opened small wooden box with paper seal talismans; a creeping dark-red aura.
- **sealing_cube** — Prison Realm Cube — a small stone-grey cube covered in eyes on every face (some open, some closed), faint purple runic lines between them; deeply unsettling but clean and iconic.
- **inverted_spear** — Inverted Spear of Heaven — a short straight dagger-like blade with a jagged multi-pronged guard, a dark handle wrapped in cloth, a cord hanging from the pommel; it cancels magic, so a crackle of broken purple energy shatters around it.
- **limitless_blindfold** — Six-Eyes Blindfold — a black cloth blindfold loosely tied in a knot, with a faint bright-blue glow showing through where the eyes would be and tiny blue sparkles; cool, effortless power.

### Green Island (Hunter x Hunter) → `hunter/`

- **hunter_rod** — Hunter's Fishing Rod — a simple wooden fishing rod with a green handle wrap and a red-and-white float on the line, the hook flicking upward with motion lines; a kid's adventure on a green island.
- **ten_vest** — Ten Training Vest — a plain sand-coloured sleeveless martial-arts vest laid flat, with a soft white-gold aura flowing smoothly around its outline like a protective shell.
- **medic_briefcase** — Doctor's Briefcase — a battered dark-brown leather briefcase with brass clasps, a red cross sticker and a rolled bandage sticking out of the side; a small knife handle hidden in a side pocket.
- **steel_skateboard** — Steel Skateboard — a heavy grey steel skateboard seen at an angle, scuffed deck, chunky red wheels, a small lightning-bolt sticker; looks much heavier than a normal board.
- **steel_yoyos** — Steel Yo-Yos — two big shiny steel yo-yos with thick strings, little blue-white lightning sparks crackling along the strings; mischievous assassin-kid vibe.
- **chain_of_judgement** — Chain of Judgement — a heavy silver chain coiled in a loop, ending in a sharp sword-shaped blade tip, with a faint golden glow along the links; solemn, vengeful.
- **joker_cards** — Joker Throwing Cards — a fanned hand of five playing cards with sharp metallic edges, the front card showing a grinning joker silhouette (no letters), pink sticky aura strands stretching between them.
- **royal_carapace** — Royal Guard Carapace — a chest armor made of glossy dark-green insect carapace plates with spiky shoulder pieces and segmented abdomen bands; organic, chitinous, regal.

### Echo Quarter (Demon Slayer + JoJo) → `echo/`

- **nichirin_blade** — Nichirin Blade — a katana with a deep blue-black blade, a black-and-white diamond-wrapped hilt and a hexagonal guard, a swirling stylised water-wave slash wrapping around the blade.
- **fox_warding_mask** — Warding Fox Mask — a white carved wooden fox mask with red markings around the eyes and cheeks, a small flower motif on the forehead and a red cord; protective, traditional.
- **slayer_uniform** — Slayer Corps Uniform — a black military-style high-collar uniform jacket laid flat, gold buttons, a white belt, a single bold white kanji-like brush mark on the back (abstract, not real text).
- **stopped_watch** — Stopped Pocket Watch — an ornate gold pocket watch, lid open, hands frozen at the top, small hovering clock fragments and a faint yellow "time stopped" ripple around it.
- **steel_balls** — Spinning Steel Balls — two shiny steel spheres covered in engraved spiral grooves, one spinning with golden spiral motion lines, the golden-ratio spiral glowing faintly.
- **checkered_haori** — Checkered Haori — a short kimono jacket laid flat with a bold green-and-black checkered pattern, slightly mended at one sleeve; warm, humble, iconic.
- **stand_arrow** — Stand Arrow — an ancient arrow with a golden beetle-shaped arrowhead made of meteorite stone, a short dark wooden shaft and worn feathers, a mysterious golden aura and floating particles.
- **hanafuda_earrings** — Hanafuda Earrings — a pair of long rectangular dangling earrings like hanafuda playing cards, painted with a red rising sun over red and white stripes, a faint ember glow.

### The Rift (tous les mondes) → `soul/` (comme l'Œil de la Faille)

- **torn_mask** — Torn Stone-Hollow Mask — a mask split down the middle: the left half a grey carved ancient stone mask with fangs, the right half a white bone mask with red stripes, joined by a glowing magenta tear; cosmic and wrong.
- **rift_mantle** — Mantle of Seven Worlds — a flowing cape-armor made of seven different stitched fabric patches (leaf green, sea blue, spirit white, ki orange, curse purple, hunter green, sun gold), its edges dissolving into magenta stars.
- **crossover_blade** — Seven-Worlds Blade — a legendary sword whose blade splits into seven stacked edges of different materials and colours, a magenta star-filled core, a gold hilt with a glowing rift gem; the ultimate endgame weapon, radiant.
