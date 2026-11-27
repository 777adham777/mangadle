// Items without a painted icon -> docs/MISSING-ICONS.md (list + ChatGPT sheet prompts, 8 per sheet, 4x2)
// and tools/missing_icons.json (sheet order + world folder, read by `python tools/slice_icon_sheet.py --missing`).
//   node tools/missing_icons.js
// Every item needs its own hand-written look in LOOK below (no generic template): the script stops otherwise.
// Weapon shards are not listed: the game draws them with their weapon's art and a crack (item-art.js SHARD_CRACK).
'use strict';
const fs = require('fs'), vm = require('vm'), path = require('path');
const { load, ROOT } = require('./sim/load.js');

/* ---------------------------------------------------------------- worlds: art direction */
const WORLDS = ['shinobi', 'seas', 'soul', 'ki', 'hex', 'hunter', 'echo', 'rift'];
const FOLDER = { shinobi: 'leaf', seas: 'seas', soul: 'soul', ki: 'kaio', hex: 'hex', hunter: 'hunter', echo: 'echo', rift: 'soul' };
const WNAME = { shinobi: 'Leaf Village', seas: 'Orange Town', soul: 'Soul City', ki: 'Titan Planet', hex: 'Shinjuku', hunter: 'Green Island', echo: 'Echo Quarter', rift: 'The Rift' };
// Same palettes as the painted backgrounds (art-incoming/backgrounds/BRIEF.md).
const DA = {
  shinobi: 'hidden ninja village in a forest under a bright blue sky (inspired by ninja shonen manga). Materials: navy cloth, forest-green padded vests, forged steel, white bandage wraps, paper scrolls and seal tags, carved wood. Palette: forest greens #2E8B4E #8CCB4A, navy #2F6DB5, roof red #E04A2A, cream #F4E6C8, earth brown #7A4A2E, chakra blue glow',
  seas: 'sunny pirate harbour town and open sea (inspired by pirate-adventure shonen manga). Materials: sailcloth, rope, tarred wood, brass, gold coins, shells, navy uniforms. Palette: sea blues #138FC4 #0B5C8C, foam white, orange-red roofs #E8573A, warm orange #F2A93B, wood browns #8A5530, sand #F0D28A',
  soul: 'moonlit city of spirit reapers and masked husks (inspired by soul-reaper shonen manga). Materials: black hakama cloth, white sashes and coats, katana steel, bone-white mask shell with red stripes, spirit crystal. Palette: night indigo #1B1E4A #3A3F7A, moon cream #F4F0DC, white #E8E6F0, spirit cyan #5AC8F0, gate pink-red #E0457A',
  ki: 'grassy planet of martial artists, gravity chambers and orange mesas (inspired by martial-arts space-saga manga). Materials: orange and blue training gi cloth, cream-white and gold padded battle armour, heavy metal weights, glowing energy. Palette: warm sky yellow #F5E7A6, grass green #5DBB3F, mesa orange #E08A3A #B4572C, accent red #D8452F, armour cream #F4F1E6, metal #4D5A73, gold energy',
  hex: 'Tokyo at night: neon alleys, sealed shrines and curses (inspired by sorcerer-school shonen manga). Materials: deep navy high-collar school uniforms, gold swirl buttons, paper talismans with red ink, shrine wood, stitched cursed flesh. Palette: night #0D0F1F #1C2140, neon cyan #2FE3F0, neon magenta #FF3FA4, cursed purple #6B2FA8, shrine red #D63A3A, window gold #F5C36B',
  hunter: 'wild green island of licensed hunters, cliffs and dangerous beasts (inspired by hunter-adventure shonen manga). Materials: green jackets, tan leather straps, brass buckles, beast hide, fangs, feathers, chitin, playing-card suit motifs. Palette: greens #7CCB3E #1E6B3A #0E3A24, mist #CFE8E0, cliff grey #8C8A7A, mud brown #6B4A2E, sky #5FB8E8',
  echo: 'ancient marble pillars, museums and striking poses (inspired by bizarre-adventure manga, flamboyant and fashionable). Materials: white marble, gold inlay, bright gems, sandstone, sun-yellow ripple energy, bold fashion details. Palette: pink #F25C9A, mint #4FD1B0, violet #7A4BC8, marble #F7EBDD, gold #F2C23A, dark #2A1B3D, sand #E0A24A',
  rift: 'a tear where every world collides. Materials borrowed from several worlds, cracked through with void. Palette: deep violet #2A1550 #5A2A8A, rift magenta #FF2FB0, pale pink #FFD1F0',
};

/* ---------------------------------------------------------------- one look per item */
const LOOK = {
  /* ---------- Leaf Village: woods, carvings, tonics, tools */
  ember_maple: 'a cut maple log with orange-red bark, a few glowing ember-orange maple leaves still attached, warm sparks rising',
  thunderbark: 'a dark grey-brown log split by a jagged glowing yellow lightning crack, tiny electric sparks jumping off it',
  sage_elm: 'a pale elm log with glowing green rings on its cut end, a small orange toad-shaped knot in the bark, soft green nature aura (very rare)',
  maple_fan: 'an open folding hand fan carved from glowing red-orange maple wood, a maple-leaf pattern on its ribs',
  thunder_totem: 'a short carved totem pole in dark lightning-scarred wood, a zig-zag bolt carved down its front, small yellow sparks',
  sage_toad: 'a chunky carved wooden statue of a sitting toad with a tiny scroll on its back and green-glowing gem eyes, warm varnished wood',
  // Leaf Village: base gear (Genin = academy graduate, Chunin = squad leader)
  g_shinobi_1_legs: 'navy-blue ninja trousers with white bandage wraps around the shins and a kunai holster strapped to the right thigh',
  g_shinobi_1_feet: 'a pair of open-toed navy ninja sandals with thick soles and white tape around the ankles',
  g_shinobi_1_ring: 'a plain steel ring shaped like a kunai\'s ring pommel, a tiny leaf-spiral engraving on it',
  g_shinobi_2_head: 'a cloth forehead protector with a polished steel plate engraved with a leaf-spiral emblem, long navy cloth tails',
  g_shinobi_2_legs: 'dark navy squad-leader trousers with green padded shin guards and a small scroll pouch on the hip',
  g_shinobi_2_feet: 'sturdy navy shinobi sandals with steel toe caps and green ankle wraps',
  g_shinobi_2_ring: 'a bronze ring with a tiny rolled scroll set on top like a gem, a red seal dot on the scroll',
  // Mist Walker set (fog assassins of the Misty Forest; set colour misty grey-blue #8fb8c8)
  sig_mistwalker: 'a hexagonal rune stone of wet grey-blue slate carved with a water-drop crest, fog drifting off it',
  set_mistwalker_head: 'a grey-blue hood with a bandage mouth-cloth and a steel forehead plate scratched through with one deep line (a rogue\'s mark), mist curling off it',
  set_mistwalker_feet: 'soft grey-blue silent-step tabi boots with bandage-wrapped ankles, fog wisps and water droplets around the soles',
  set_mistwalker_ring: 'a ring of misty grey-blue steel made of a senbon needle bent into a loop, a faint mist halo',
  // Puppet Master set (desert puppeteers; tan lacquered wood #b08a5a, cyan chakra threads, red sand)
  sig_puppeteer: 'a hexagonal rune stone of red desert sandstone carved with a wooden puppet-control cross, a faint cyan thread looped around it',
  set_puppeteer_head: 'a black hood with two small pointed ear tips and purple painted stripes on the cloth front, brass puppet pins along the edge',
  set_puppeteer_legs: 'leg guards of lacquered tan puppet-wood plates joined with brass ball joints, red sand trickling from the seams',
  set_puppeteer_feet: 'boots with wooden puppet-foot soles and visible ball-joint ankles, cyan chakra threads tied at the top',
  // The Sealed Archive dungeon (forbidden scrolls under the Warden Rock; black lacquer, scroll paper, red/blue seals)
  key_archive: 'an ornate black iron key whose bow is a rolled scroll with a red seal, a red tassel hanging from it',
  chest_archive: 'a black lacquered treasure chest bound in red seal-paper strips, brass corners and a scroll-shaped lock',
  archive_tanto: 'a short black tanto in a lacquered sheath, a red seal-paper wrapped around the handle, a pale-blue glint on the blade',
  sig_archive: 'a hexagonal rune stone of black lacquer with a brass-rimmed scroll emblem and a pale-blue seal glow',
  archive_mantle: 'a long mantle laid flat, black cloth with layers of old scroll-paper strips sewn on, red ink seals, brass clasp',
  archive_seal: 'a round pendant of black lacquer and brass holding a tiny rolled forbidden scroll tied with a red seal',
  set_archive_head: 'a black lacquered scholar\'s helm whose side flaps are overlapping scroll-paper strips, a red seal stamp on the brow',
  set_archive_legs: 'black hakama trousers with rolled scrolls strapped along both thighs like ammunition, red tassels',
  set_archive_feet: 'black lacquered boots with brass scroll-case caps on the toes and a red seal string at the ankle',
  set_archive_ring: 'a brass ring shaped like the end cap of a scroll case, a tiny red ink seal on top glowing pale blue',

  /* ---------- Orange Town */
  catfish_hotpot: 'a small black clay hotpot full of broth with pieces of whiskered catfish, little yellow lightning sparks on the surface, steam',
  oil_tempura: 'three golden crispy tempura pieces on a folded paper sheet, a tiny dish of dipping sauce, glossy oil shine',
  dragonet_sashimi: 'a wooden sashimi board with slices of shimmering coral-pink fish fanned out, a coral sprig and a shiso leaf, 2 sparkles (very rare)',
  ghost_ray: 'a pale translucent white-blue manta ray, slightly see-through, a faint ghostly trail behind it',
  lantern_squid: 'a small squid whose body glows like a paper lantern, warm yellow light inside, a drop of glowing ink at its tentacles',
  allblue_tuna: 'a big glossy tuna with a shimmering rainbow-blue back, as if every sea colour were on its scales',
  ray_skewers: 'two wooden skewers of grilled pale ray meat with char marks and a faint ghostly blue steam',
  squid_ink_ramen: 'a ramen bowl of jet-black squid-ink broth that glows softly, noodles, half an egg and a nori sheet',
  allblue_feast: 'a large lacquered banquet platter with a grilled rainbow tuna, rice balls and lemon slices, gold rim, 2 sparkles (very rare)',
  silver_den_den: 'a small snail with a polished silver shell that is also an old telephone: a curly cord and a handset resting on its shell, snail eyes on stalks (legendary artifact)',
  // base gear (Deckhand = rookie sailor, Bosun = deck officer)
  g_seas_1_head: 'a faded red bandana knotted over a rope-ringed sailor cap, a small brass anchor pin',
  g_seas_1_legs: 'rolled-up canvas sailor trousers with patched knees and a rope belt',
  g_seas_1_feet: 'worn brown deck boots, salt-stained, with folded tops',
  g_seas_1_ring: 'a ring of braided sailor rope with a tiny brass anchor charm',
  g_seas_2_head: 'a navy bosun\'s cap with a gold anchor badge and a brass whistle hanging from its cord',
  g_seas_2_chest: 'a blue-and-white striped sailor shirt under an open navy vest with brass buttons, a red sash at the waist',
  g_seas_2_legs: 'white sailcloth trousers with leather knee pads and a brass-buckled belt',
  g_seas_2_feet: 'tall polished black sea boots with brass buckles',
  g_seas_2_amulet: 'a brass bosun\'s whistle on a chain, a tiny compass rose engraved on its side',
  // Marine Justice set (the navy; crisp white #dfe6f2, navy blue, gold)
  sig_marine: 'a hexagonal rune stone of white marble with a blue seagull-and-anchor emblem',
  set_marine_head: 'a white navy officer\'s cap with a blue band and a gold seagull emblem, a short black visor',
  set_marine_legs: 'crisp white uniform trousers with navy-blue side stripes and polished white knee guards',
  set_marine_feet: 'shiny black officer boots with gold buckles and white spats',
  set_marine_ring: 'a gold signet ring with a blue enamel seagull emblem',
  // Storm Rider set (corsairs of the Storm Belt; storm blue #6a8ad8, white lightning)
  sig_stormrider: 'a hexagonal rune stone of dark slate carved with a wave split by a lightning bolt, small sparks',
  set_stormrider_chest: 'a storm-blue corsair coat with a high collar, white lightning zig-zag trim, wet sheen and torn coat tails',
  set_stormrider_legs: 'storm-blue sailcloth trousers lashed with rope, a lightning-bolt belt buckle',
  set_stormrider_feet: 'tall storm-blue boots with spiked soles for wet decks, little lightning sparks at the heels',
  set_stormrider_ring: 'a dark iron ring set with a stormy blue pearl that holds a tiny lightning bolt',
  // Davy's Wreck dungeon (ghost ship sailing underwater; drowned sea-green, barnacles, tarnished gold)
  key_wreck: 'a barnacle-crusted bronze key with a skull-and-anchor bow and a strand of seaweed',
  chest_wreck: 'an old waterlogged pirate treasure chest covered in barnacles and seaweed, gold coins spilling out',
  wreck_harpoon: 'a rusted barnacle-covered harpoon with a hooked tip, seaweed tangled on the shaft, a teal glow',
  sig_wreck: 'a hexagonal rune stone of green-crusted bronze with a skull-and-anchor emblem, dripping seawater',
  wreck_coat: 'a captain\'s long coat laid flat, sea-green and rotting, covered in barnacles and small shells, tarnished gold buttons',
  wreck_doubloon: 'a single large gold doubloon stamped with a skull, a sickly green glow and drips of seawater',
  set_wreck_head: 'a drowned pirate tricorne hat crusted with barnacles and seaweed, a little crab clinging to the brim',
  set_wreck_legs: 'tattered sea-green pirate trousers hung with seaweed and shells, a rusted hook at the belt',
  set_wreck_feet: 'rotten sea boots with holes, water pouring out, a starfish stuck on one',
  set_wreck_ring: 'a tarnished skull ring dripping seawater, faint green glow in the eye sockets',

  /* ---------- Soul City */
  moonsilver: 'a rough silver-blue ore chunk with a pale crescent-moon glow from inside and small star specks',
  bloodstone: 'a smooth dark-red stone with brighter red veins that pulse like a heartbeat',
  soul_crystal: 'a tall pale-cyan crystal shard with a tiny crown-shaped spark inside, strong soft glow (very rare)',
  moonsilver_ingot: 'a trapezoid ingot of pale silver-blue metal with a crescent moon stamped on top, cool shine',
  bloodstone_ingot: 'a trapezoid ingot of dark crimson metal with glowing red veins, a drop of red light on its edge',
  soulking_ingot: 'a trapezoid ingot of pale cyan-white metal with a gold crown stamp, radiant glow and 3 sparkles (legendary)',
  palace_bell: 'an ornate pale-blue crystal temple bell with a silver crown handle, glowing softly (legendary artifact)',
  moonsilver_blade: 'a slim curved katana of pale silver-blue moonsilver, the grip wrapped in pale ray leather, a crescent-moon sword guard',
  soulking_blade: 'a long katana with a pale cyan crystal blade, a dark green-purple insect-chitin guard and a gold crown pommel, radiant glow (legendary)',
  // base gear (Reaper = rookie soul reaper, Lieutenant = squad vice-captain)
  g_soul_1_head: 'a plain black cloth hood of a rookie soul reaper with a white inner collar, a pale-blue spirit glow at the edge',
  g_soul_1_legs: 'black hakama trousers with deep pleats and white ankle ties',
  g_soul_1_ring: 'a plain silver ring topped with a tiny square katana guard',
  g_soul_2_head: 'a black headpiece with a white armband-style plate carrying a squad camellia emblem (no numbers)',
  g_soul_2_legs: 'black hakama with white leg wraps and a vice-captain\'s armband tied at the thigh',
  g_soul_2_feet: 'white tabi socks in black straw sandals, a faint pale-blue flash-step blur behind them',
  g_soul_2_ring: 'a silver ring with a square katana-guard bezel holding a pale-blue spirit stone',
  // Husk Hunter set (husk shell; bone-white, red stripes, hole through)
  sig_huskhunter: 'a hexagonal rune stone of bone-white husk shell with a hollow ring emblem cut through it and red stripes',
  set_huskhunter_legs: 'greaves of cracked bone-white husk shell with red claw stripes, a round hole punched through one knee plate',
  set_huskhunter_feet: 'clawed boots of bone-white husk plates over black cloth, red stripes on the toes',
  set_huskhunter_ring: 'a bone-white ring carved from a husk fang with a red stripe and a small hole through it',
  // Bone Ward set (spirit archers; pale lavender-white #a8a0c8, blue crosses, silver)
  sig_boneward: 'a hexagonal rune stone of pale lavender with a five-pointed spirit-cross emblem glowing blue',
  set_boneward_head: 'a white hooded archer\'s cowl with blue cross embroidery and silver filigree on the brim',
  set_boneward_chest: 'a long white archer\'s coat with a high collar, blue cross pattern down the front and silver buttons',
  set_boneward_legs: 'white trousers with silver knee plates engraved with small blue crosses',
  set_boneward_feet: 'white boots with silver shin guards and a small glowing blue cross on each',
  // The Husk Catacombs dungeon (grey bone, black tattered cloth, cold blue wisps)
  key_catacombs: 'a bone-white key carved from a single long bone, a small skull as its bow, a cold blue wisp',
  chest_catacombs: 'a grey stone ossuary chest decorated with small skulls, cold blue light leaking from the lid',
  cata_scythe: 'a scythe with a curved bone-white blade and a handle made of stacked vertebrae, cold blue glint',
  sig_cata: 'a hexagonal rune stone of grey catacomb bone with a crossed-scythes emblem and a cold blue glow',
  cata_shroud: 'a tattered black burial shroud laid flat, bone plates sewn over the chest, cold blue wisps',
  cata_mask: 'a broken half of a bone-white monster mask with red markings and a jagged crack, an empty eye hole',
  set_cata_legs: 'greaves of stacked grey bones bound with black tattered cloth, a small skull on each knee',
  set_cata_feet: 'boots of grey bone plates with toe claws, cold blue wisps at the ankles',
  set_cata_amulet: 'a small grey skull pendant on a chain of vertebrae, cold blue light in the eye sockets',
  set_cata_ring: 'a ring carved from a knuckle bone, set with a cold blue gem',

  /* ---------- Titan Planet */
  ki_surge: 'a swirling orb of pale-yellow energy squeezed into a tight ball, small waves rippling off it',
  ki_blaze: 'an orb of orange-gold energy burning like a flame, flickering fire tongues around it',
  ki_aura: 'a tall flame-shaped golden aura, hollow at the centre, crackling with small electric sparks',
  divine_ki: 'a calm, perfectly round orb of silver-blue energy with a thin gold halo ring, very still, soft divine glow (very rare)',
  pod_core: 'a round metal core from a crashed space pod, white panels, a glowing orange window, small smoke wisps (legendary artifact)',
  tool_gravity_4: 'a compact high-tech gravity training wristband with a glowing orange dial and two heavy weight cylinders',
  surge_gi: 'an orange training gi top laid flat, woven with shining silver thread lines like electric current, a small energy spark',
  // base gear (Kaio = training-school student, Saiyan = space warrior)
  g_ki_1_head: 'a simple orange cloth training headband knotted at the back, sweat-worn',
  g_ki_1_legs: 'baggy orange gi training trousers with blue ankle bands',
  g_ki_1_feet: 'blue martial-arts boots with orange laces and soft soles',
  g_ki_1_ring: 'a plain brass ring stamped with a small round planet and a tiny winding road around it',
  g_ki_2_head: 'a curved cream-and-gold metal brow guard with a green glass eyepiece clipped on one side',
  g_ki_2_legs: 'dark-blue stretch bodysuit legs with white armoured knee plates',
  g_ki_2_feet: 'white battle-armour boots with yellow-gold pointed toe caps',
  g_ki_2_amulet: 'a small orange glass sphere with one gold star inside, on a leather cord',
  g_ki_2_ring: 'a white-and-gold armour ring with a tiny green glass lens',
  // Gravity Warrior set (space-warrior battle armour; cream-white #f0ead0 and gold)
  sig_saiyan: 'a hexagonal rune stone of cream-white with a gold cracked-crater emblem',
  set_saiyan_head: 'a cream-white battle helm with gold trim and a green crystal eyepiece on the side',
  set_saiyan_chest: 'cream-white padded battle chest armour with large rounded gold shoulder plates and a black under-suit collar',
  set_saiyan_legs: 'black bodysuit legs with cream-white armoured thigh plates edged in gold',
  set_saiyan_feet: 'cream-white armoured boots with gold pointed toes and black cuffs',
  set_saiyan_amulet: 'a gold gravity-weight medallion with a green crystal at its centre',
  set_saiyan_ring: 'a heavy cream-and-gold ring shaped like a gravity weight plate',
  // Iron Shell School set (old master's school; bright orange #f0a040, blue trim, turtle shell)
  sig_turtle: 'a hexagonal rune stone of green jade carved with a turtle-shell emblem',
  set_turtle_head: 'a blue headband with an orange school patch showing a round turtle-shell emblem',
  set_turtle_chest: 'a bright orange gi top over a blue undershirt, a round turtle-shell emblem patch, a big green turtle shell strapped behind it',
  set_turtle_legs: 'orange gi trousers with a blue sash and round iron training weights strapped to the calves',
  set_turtle_feet: 'blue cloth kung-fu boots with orange laces and lead-weighted soles',
  set_turtle_amulet: 'a small green turtle-shell pendant on a red cord',
  set_turtle_ring: 'a jade-green ring carved with a turtle-shell pattern',
  // The Gravity Pit dungeon (crater at 100x gravity; dark iron, cracked stone, orange fissures)
  key_pit: 'a very heavy dark-iron key with a glowing orange gravity dial set in its bow',
  chest_pit: 'a squat dark-iron chest with heavy bands, dented as if crushed by gravity, orange glow at the seams',
  pit_knuckles: 'a pair of brutal dark-iron knuckle-dusters, each knuckle a little gravity weight with a glowing orange dial',
  sig_pit: 'a hexagonal rune stone of cracked crater rock with an orange gravity-ring emblem',
  pit_plate: 'a heavy chest plate of cracked crater stone and dark iron, orange fissures glowing through',
  pit_band: 'a thick dark-iron ring band with a glowing orange pressure gauge set into it',
  set_pit_head: 'a dark-iron helmet cracked like crater stone, orange glowing fissures, a gravity dial on the forehead',
  set_pit_legs: 'massive dark-iron leg weights with orange glowing gauges on the shins',
  set_pit_feet: 'huge dark-iron boots sinking into a cracked stone slab, orange fissures',
  set_pit_amulet: 'a dark-iron gravity orb pendant with small rocks orbiting it',

  /* ---------- Shinjuku */
  hex_thread: 'a spool of dark purple thread knotting itself, a loose end curling like a living worm',
  hex_bone: 'a grey cracked bone wrapped with a scrap of red paper talisman, a thin purple haze leaking out',
  hex_seal: 'a yellowed paper seal talisman with bold red ink sigils (abstract shapes, no readable letters), its edges smouldering faintly',
  king_finger: 'a long grey mummified finger with black nails, wrapped at the base in a red-sealed talisman strip, ominous purple glow (very rare)',
  tool_exorcism_4: 'an ornate brass spirit bell on a short handle, wrapped with a red-sealed talisman, soft cyan chime waves',
  bloodstone_gauntlets: 'a pair of heavy gauntlets of dark crimson bloodstone plates over a lightning-scarred wooden core, red veins glowing',
  threadbound_charm: 'a small bone wound tightly with dark purple cursed thread, a drop of glowing ink hanging from it',
  kings_ring: 'a heavy gold ring set with two small grey mummified fingertips (stylised, not gory), purple glow, crown engraving (legendary)',
  // base gear (Exorcist = first-year student, Grade One = elite sorcerer)
  g_hex_1_head: 'a dark navy student cap with a gold swirl badge and a paper talisman tucked in the band',
  g_hex_1_legs: 'dark navy school-uniform trousers with a talisman strip tied around one knee',
  g_hex_1_feet: 'black sneakers with white soles and red laces, a little paper charm tied on',
  g_hex_1_ring: 'a plain silver ring wrapped in a thin strip of red-sealed paper',
  g_hex_2_head: 'a dark navy high-collar hood with a gold swirl button and a faint blue cursed glow',
  g_hex_2_legs: 'navy uniform trousers with black armoured knee guards and purple talisman bands',
  g_hex_2_feet: 'black combat boots with purple cursed flames licking around the ankles',
  g_hex_2_amulet: 'a small shrine charm pouch in dark red silk with a gold knot and a gold swirl stitched on',
  g_hex_2_ring: 'a black ring with a neon-cyan cursed gem that glows like a city sign',
  // Curse Bearer set (stitched curses; magenta #c040a0, black stitches, staring eyes)
  sig_curse: 'a hexagonal rune stone of purple obsidian with a stitched-eye emblem',
  set_curse_head: 'a magenta-purple hood sewn from patches with black thread, a small staring eye stitched on the brow',
  set_curse_chest: 'a patchwork robe of magenta and black stitched panels, scar-like seams and a few small cursed eyes',
  set_curse_legs: 'stitched magenta trousers with black X stitches and a dark purple haze',
  set_curse_feet: 'black boots with magenta stitched seams and little staring eyes on the toes',
  set_curse_amulet: 'a stitched cloth doll charm with X-stitched button eyes, on a magenta cord',
  set_curse_ring: 'a black ring with a magenta eye gem whose pupil looks to the side',
  // Sorcery High set (the sorcerer academy; deep navy #3a4a8a, gold swirl buttons)
  sig_jujutsu: 'a hexagonal rune stone of deep navy lacquer with a gold swirl emblem',
  set_jujutsu_head: 'a deep navy academy cap with a gold swirl badge and a white talisman strip hanging from the side',
  set_jujutsu_chest: 'a deep navy high-collar academy jacket with gold swirl buttons down the front and white talisman strips at the cuffs',
  set_jujutsu_legs: 'deep navy academy trousers with a gold-buckled belt and a talisman pouch on the hip',
  set_jujutsu_feet: 'polished black academy shoes with navy spats and a gold swirl on the side',
  set_jujutsu_amulet: 'a gold swirl-button medallion with blue cursed energy spinning inside',
  set_jujutsu_ring: 'a navy enamel ring with a gold swirl on top',
  // The Cursed Womb dungeon (dark red flesh-like cursed cloth, talismans, closed eyes)
  key_womb: 'a key of dark red flesh-like metal wrapped in a paper talisman, a closed eye on its bow',
  chest_womb: 'a dark red cursed chest wrapped in paper talismans, a closed eye on the lock, purple haze',
  womb_cleaver: 'a heavy cleaver with a dark red blade covered in talisman strips, a closed eye on the flat of the blade',
  sig_womb: 'a hexagonal rune stone of dark red with a closed-eye talisman emblem',
  womb_wrap: 'a body wrap laid flat, many overlapping paper talismans with red ink seals on dark red cloth',
  womb_eye: 'a pendant holding a single closed eye in amber-red resin, a purple haze around it',
  set_womb_head: 'a hood of dark red flesh-like cloth wrapped in paper talismans, a single closed eye on the brow',
  set_womb_legs: 'dark red bandaged greaves wrapped in talismans with red ink seals',
  set_womb_feet: 'dark red bandage boots with talisman strips trailing behind, purple haze',
  set_womb_ring: 'a dark red ring with a tiny closed eye and a band of talisman paper',

  /* ---------- Green Island */
  grizzly_hide: 'a folded thick brown bear hide with rough fur and three claw tears along one edge',
  serpent_skin: 'a rolled-up shed snake skin, green and yellow scale pattern, semi-translucent',
  griffon_plume: 'a single large golden flight feather with a white tip, drifting slightly, 2 sparkles (rare)',
  ant_chitin: 'a curved glossy shell plate of dark green-purple insect chitin with a ridge pattern, hard metallic sheen',
  tool_tracking_4: 'a brass hunter\'s compass with a green glowing needle, the lid open, a little leather strap',
  griffon_cloak: 'a cloak laid flat, its shoulders covered in golden griffon plumes over green serpent-skin fabric, a red paper seal as clasp',
  // base gear (Rookie = exam candidate, Pro Hunter = licensed hunter)
  g_hunter_1_head: 'a green adventurer\'s cap with a short brim and a feather tucked in the band',
  g_hunter_1_legs: 'tan cargo trousers with many pockets and green knee pads',
  g_hunter_1_feet: 'muddy green-and-tan hiking boots with thick laces',
  g_hunter_1_ring: 'a simple ring carved from a beast tooth',
  g_hunter_2_head: 'a forest-green ranger hood with a brass spade-suit pin',
  g_hunter_2_legs: 'forest-green trousers with tan leather thigh straps and a knife sheath',
  g_hunter_2_feet: 'tall tan leather tracker boots with brass buckles',
  g_hunter_2_amulet: 'a blank hunter\'s licence card in a brass frame on a chain, shining (no text on the card)',
  g_hunter_2_ring: 'a brass ring with a small heart-suit emblem',
  // Star Hunter set (star-rank hunters; tan and cream #c8b088, gold six-point star)
  sig_star: 'a hexagonal rune stone of sandstone with a gold six-point star',
  set_star_head: 'a tan adventurer hat with a gold six-point star badge on the band',
  set_star_chest: 'a tan-and-cream adventurer coat with many pockets and a gold six-point star on the chest',
  set_star_legs: 'cream trousers with tan leather holsters and a star-shaped buckle',
  set_star_feet: 'tan explorer boots with star-shaped brass buckles',
  set_star_amulet: 'a gold six-point star pendant on a leather cord',
  set_star_ring: 'a tan leather-wrapped ring with a small gold star',
  // Hunter Selection set (the hunter exam; fresh green #80d060, round exam badge)
  sig_exam: 'a hexagonal rune stone of mossy green with a round badge emblem',
  set_exam_head: 'a green headband with a round blank exam badge pinned to it',
  set_exam_chest: 'an open green jacket over a green tank top, a round blank exam badge pinned on the chest',
  set_exam_legs: 'green shorts with tan straps and a fishing-rod clip on the belt',
  set_exam_feet: 'green sneakers with tan socks and muddy soles',
  set_exam_amulet: 'a round blank exam badge hanging on a cord',
  set_exam_ring: 'a green ring with a tiny round badge on top',
  // The Chimera Nest dungeon (royal hive; glossy green-purple chitin, antennae, gold crest)
  key_nest: 'a key made of glossy insect chitin with a hive-shaped bow and two little antennae',
  chest_nest: 'a chest shaped like an insect egg sac of green-purple chitin, a gold hive crest on the lid',
  nest_claw: 'a long curved royal insect claw blade of glossy green-purple chitin, a gold hive crest at the base',
  sig_nest: 'a hexagonal rune stone of green chitin with a gold hive crest',
  nest_carapace: 'chest armour of overlapping glossy insect chitin plates, dark green-purple, royal gold edging',
  nest_antenna: 'a headpiece of two long elegant insect antennae on a chitin circlet, a small gold crest',
  set_nest_legs: 'greaves of glossy green-purple chitin plates with spiked knees',
  set_nest_feet: 'boots shaped like insect legs, with chitin claws',
  set_nest_amulet: 'a royal hive-crest pendant of green chitin with a gold rim',
  set_nest_ring: 'a chitin ring with a tiny translucent insect wing',

  /* ---------- Echo Quarter */
  silver_fragment: 'a small pile of tarnished silver bits: two old navy buttons, a coin and a broken bell rim',
  crystal_fragment: 'a sharp sliver of pale-blue crystal wall, faintly glowing from inside',
  meteor_fragment: 'a lump of dark pitted meteor metal with a hot orange glow in its cracks',
  arrow_fragment: 'a broken ancient stone-and-gold arrowhead, chipped edges, a faint golden sting of light at the tip',
  first_arrowhead: 'an ancient golden arrowhead engraved with a beetle pattern, on a little marble stand, golden radiance (legendary artifact)',
  tool_archaeology_4: 'an archaeologist\'s brush and small pickaxe crossed and tied with a leather cord, a tiny gold fragment beside them',
  crystal_ward: 'a pendant of pale-blue palace crystal set in tarnished silver, on a brown grizzly-hide cord, a faint shield shimmer',
  meteor_hammer: 'a war hammer whose head is a lump of dark pitted meteor metal glowing orange in the cracks, a sturdy wrapped handle',
  // base gear (Ripple = breathing-monk novice, Pillar = ancient pillar warrior)
  g_echo_1_chest: 'a cream linen monk\'s training vest with a sun-yellow ripple pattern on the hem',
  g_echo_1_legs: 'loose cream monk trousers with orange ankle wraps',
  g_echo_1_feet: 'sandals with orange cloth wraps, little ripple rings of light around them',
  g_echo_1_amulet: 'a small polished brass sun disc pendant engraved with ripple rings',
  g_echo_1_ring: 'a mint-green stone ring with a tiny gold sun',
  g_echo_2_head: 'a helm of carved white marble with gold-leaf ancient patterns and a single short horn',
  g_echo_2_legs: 'marble-and-gold greaves carved with ancient pillar flutes',
  g_echo_2_feet: 'gold-plated boots with marble toes and pink and violet gems',
  g_echo_2_amulet: 'a gold triangular pendant framing a glowing pink gem in carved stone',
  g_echo_2_ring: 'a marble ring with a violet gem and gold inlay',
  // Dusk Slayer Corps set (night demon hunters; black uniform, crimson flames #e85a50, sun crest)
  sig_slayer: 'a hexagonal rune stone of black stone with a crimson flame and sun emblem',
  set_slayer_head: 'a black uniform cap with a crimson flame band and a gold sun crest',
  set_slayer_chest: 'a black corps uniform jacket with gold buttons under a short white haori with crimson flame edging',
  set_slayer_legs: 'black uniform trousers with white leg wraps tied below the knee',
  set_slayer_feet: 'straw sandals with white tabi socks and crimson ties',
  set_slayer_amulet: 'a small gold sun-crest pendant with a crimson tassel',
  set_slayer_ring: 'a black ring with a crimson flame engraving around a gold sun crest',
  // The Pillar Tomb dungeon (sandstone pillars, stone masks, sun-yellow ripple energy)
  key_tomb: 'a sandstone key with a tiny stone-mask bow, sun-yellow glow between its teeth',
  chest_tomb: 'a sandstone sarcophagus-style chest with carved pillar sides and a stone-mask lock, sun glow',
  tomb_gauntlet: 'a single golden gauntlet glowing with sun-yellow ripple energy, rings of light spreading from the fist',
  sig_tomb: 'a hexagonal rune stone of sandstone with a sun-ripple emblem',
  tomb_scarf: 'a long cream-and-red scarf in a loose loop, a soft sun-yellow ripple glow along its edge',
  tomb_mask: 'a cracked fragment of an ancient grey stone mask, carved patterns and a pair of small bone spikes',
  set_tomb_chest: 'a sleeveless cream-and-red monk vest with a sun-yellow ripple glow at the collar',
  set_tomb_legs: 'loose monk trousers with carved sandstone knee guards',
  set_tomb_feet: 'monk sandals on sandstone soles, sun ripple rings around them',
  set_tomb_ring: 'a sandstone ring with a sun-yellow ripple gem',

  /* ---------- crafted from several worlds: drawn in the world of their main material */
  ember_maple_bow: 'a recurve bow of glowing red-orange maple wood, its string a thread of blue fox-fire, sparks along the limbs',
};
// Which world a crafted multi-world piece belongs to (its main material's world).
const WORLD_OF = { amber_pendant: 'shinobi', divine_bow: 'shinobi', ember_maple_bow: 'shinobi', thunder_harpoon: 'seas', silver_den_den: 'seas',
  sekki_bracers: 'soul', living_wood_mail: 'soul', frostvoid_scythe: 'soul', sunstar_plate: 'soul', kido_focus: 'soul', moonsilver_blade: 'soul', soulking_blade: 'soul',
  palace_bell: 'soul', surge_gi: 'ki', pod_core: 'ki', bloodstone_gauntlets: 'hex', threadbound_charm: 'hex', kings_ring: 'hex',
  griffon_cloak: 'hunter', crystal_ward: 'echo', meteor_hammer: 'echo', first_arrowhead: 'echo', fossil_amber: 'shinobi' };
const TOOL_WORLD = { woodcutting: 'shinobi', fishing: 'seas', mining: 'soul', gravity: 'ki', exorcism: 'hex', tracking: 'hunter', archaeology: 'echo' };

// The skill-depth items already have hand-written looks (docs/DEPTH-ICONS.md): reuse them.
for (const block of fs.readFileSync(ROOT + 'docs/DEPTH-ICONS.md', 'utf8').split('## Planche').slice(1)) {
  const ids = ((block.match(/^`[a-z0-9_]+`.*$/m) || [''])[0].match(/`([a-z0-9_]+)`/g) || []).map((s) => s.slice(1, -1));
  const lines = block.match(/^\d\. [A-Z-]+ — .*$/gm) || [];
  ids.forEach((id, i) => { if (lines[i] && !LOOK[id]) LOOK[id] = lines[i].replace(/^\d\. [A-Z-]+ — [^:]+: /, '').replace(/\.$/, ''); });
}

/* ---------------------------------------------------------------- the items */
const ctx = load();
vm.runInContext(fs.readFileSync(ROOT + 'js/item-images.js', 'utf8').replace(/^'use strict';/, ''), ctx);
const raw = JSON.parse(vm.runInContext(`(()=>{const img=ITEM_IMAGE_PATHS,out=[];
  const setRealm={};for(const s of GEAR_SETS)setRealm[s.id]=s.realm;for(const d of DUNGEONS){setRealm[d.set.id]=d.realm;setRealm[d.id]=d.realm;}
  for(const [id,it] of Object.entries(ITEMS)){
    if(img[id]||(it.base&&img[it.base])||(it.type==='schematic'&&img[it.teaches])||it.shardOf) continue;
    const sig=it.sigil, dg=(id.match(/^(?:key|chest)_(\\w+)$/)||[])[1];
    out.push({id,name:it.name,type:it.type,slot:it.slot||'',set:it.set||'',
      realm:setRealm[it.set]||setRealm[sig]||setRealm[dg]||(typeof ARTIFACTS!=='undefined'&&ARTIFACTS[id]&&ARTIFACTS[id].realm)||null,
      toolFor:it.toolFor||'',zone:itemWorld(id),desc:String(it.lore||it.desc||'')});}
  return JSON.stringify(out);})()`, ctx));
const DUNGEON_WEAPON_REALM = { archive_tanto: 'shinobi', wreck_harpoon: 'seas', cata_scythe: 'soul', pit_knuckles: 'ki', womb_cleaver: 'hex', nest_claw: 'hunter', tomb_gauntlet: 'echo' };
const missing = [];
for (const o of raw) {
  o.desc = o.desc.replace(/\s+/g, ' ').trim();
  const g = o.id.match(/^g_([a-z]+)_\d_/);
  o.world = WORLD_OF[o.id] || DUNGEON_WEAPON_REALM[o.id] || (g && g[1]) || o.realm || (o.toolFor && TOOL_WORLD[o.toolFor]) || o.zone;
  if (!WORLDS.includes(o.world)) missing.push(o.id + ' (no world)');
  o.look = LOOK[o.id];
  if (!o.look) missing.push(o.id + ' (no look)');
}
if (missing.length) { console.error('Missing:\n  ' + missing.join('\n  ')); process.exit(1); }

/* ---------------------------------------------------------------- sheets of 8, in world order */
const KIND = (o) => (o.id.startsWith('g_') ? 2 : o.set || o.id.startsWith('sig_') || o.id.startsWith('key_') || o.id.startsWith('chest_') || DUNGEON_WEAPON_REALM[o.id] ? 3 : o.type === 'equip' ? 1 : 0);
const items = raw.slice().sort((a, b) => WORLDS.indexOf(a.world) - WORLDS.indexOf(b.world) || KIND(a) - KIND(b));
const PER = 8;
const sheets = [];
for (let i = 0; i < items.length; i += PER) sheets.push(items.slice(i, i + PER));
const POS = ['TOP-1 (far left)', 'TOP-2', 'TOP-3', 'TOP-4 (far right)', 'BOTTOM-1 (far left)', 'BOTTOM-2', 'BOTTOM-3', 'BOTTOM-4 (far right)'];
const SLOT_VIEW = { weapon: 'weapon, lying diagonally', head: 'headgear, front-on', chest: 'chest armour, laid flat front-on', legs: 'leg armour, laid flat front-on',
  feet: 'pair of boots, three-quarter view', amulet: 'pendant, close and slightly tilted', ring: 'ring, close and slightly tilted' };

const prompt = (s) => {
  const worlds = [...new Set(s.map((o) => o.world))];
  let t = `Create ONE image: a sprite sheet of ${s.length} separate game item icons for a fantasy idle RPG. Each world of the game has its own
universe and art direction, and every icon must clearly belong to its world (materials, motifs, palette given below).

LAYOUT (very important, the sheet is cut automatically):
- Landscape image, 1536x1024, a grid of 4 columns x 2 rows of equal cells (384 px wide x 512 px tall each).
- Exactly one icon per cell, centred, at most about 300 px across, with clear empty space all around it.
  Nothing may touch or cross into another cell. Draw NO grid lines, NO borders, NO frames, NO tiles behind the icons.
- Background: fully TRANSPARENT (PNG with alpha). If transparency is impossible, use one perfectly flat pure magenta
  (#FF00FF) everywhere instead, never white, never a gradient, never a checkerboard, and never use that colour inside an icon.
- No text, no letters, no numbers, no labels, no watermark anywhere.
${s.length < PER ? `- Only ${s.length} icons: leave the remaining cells at the end of the bottom row completely empty.\n` : ''}
STYLE (same for every icon, it must match the game's existing icon set):
- Clean 2D vector game-icon art, like polished mobile gacha / RPG inventory icons: bold flat colours, simple cel shading
  (one darker shade on the shadow side), a small white gloss highlight on the upper-left, few chunky details.
- A thick, even, dark plum outline (#2a0d1e) around every object and its main inner shapes. No thin hairlines,
  no painterly texture, no 3D render, no photo look.
- Weapons lie diagonally (handle bottom-left, tip top-right). Armour and clothes are shown front-on, laid flat.
  Accessories, materials and food are shown close and slightly tilted.
- Each icon must read at 48 px: one strong silhouette, 2-3 main colours, one signature motif.
- Only magic or rare items get a small glow or 2-3 sparkles. No characters, faces or hands: objects only.
- Pieces of the same set share the same colours and emblem, like one matching family.

WORLD ART DIRECTION:
${worlds.map((w) => `- ${WNAME[w]}: ${DA[w]}.`).join('\n')}

ICONS, in reading order (left to right, top row first):
`;
  s.forEach((o, k) => { t += `${k + 1}. ${POS[k]} — ${o.name} [${WNAME[o.world]}${o.slot ? ', ' + SLOT_VIEW[o.slot] : ''}]: ${o.look}.\n`; });
  return t;
};

/* ---------------------------------------------------------------- write */
const TYPE_FR = { res: 'matériau', trade: 'marchandise', tonic: 'tonique', food: 'plat', equip: 'équipement', tool: 'outil', artifact: 'artefact', chest: 'coffre' };
const SLOT_FR = { head: 'tête', chest: 'torse', legs: 'jambes', feet: 'pieds', amulet: 'amulette', ring: 'anneau', weapon: 'arme' };
const esc = (s) => String(s).replace(/\|/g, '\\|');
let md = `# Icônes manquantes — liste + prompts ChatGPT (planches de 8)

Généré par \`node tools/missing_icons.js\`. **${items.length} objets** sans icône peinte → **${sheets.length} planches** de 8.
Chaque objet est dessiné dans la direction artistique de son monde. Les éclats d'arme n'en ont pas besoin :
le jeu affiche l'icône de leur arme avec une fêlure.

## Mode d'emploi

1. Une planche = un message ChatGPT (génération d'image) = une image. Colle le bloc tel quel.
2. Vérifie : ${PER} objets séparés, dans l'ordre, aucun texte, fond transparent (ou magenta pur uni).
3. Enregistre sous \`art-incoming/missing/sheet-<numéro>.png\` et dis-le-moi : je m'occupe du reste.

Planches 1-${sheets.findIndex((s) => s.some((o) => !['shinobi', 'seas', 'soul'].includes(o.world)))} = les 3 mondes de la bêta, à faire en premier.

`;
sheets.forEach((s, i) => {
  md += `---\n\n## Planche ${i + 1} — ${[...new Set(s.map((o) => WNAME[o.world]))].join(' + ')}\n\n`;
  md += s.map((o) => '`' + o.id + '`').join(' · ') + '\n\n```\n' + prompt(s) + '```\n\n';
});
md += `---\n\n## Liste complète\n\n`;
for (const w of WORLDS) {
  const ws = items.filter((o) => o.world === w); if (!ws.length) continue;
  md += `### ${WNAME[w]} — ${ws.length}\n\n| Nom | id | Type | Description en jeu | Planche |\n|---|---|---|---|---|\n`;
  for (const o of ws) md += `| ${esc(o.name)} | \`${o.id}\` | ${TYPE_FR[o.type] || o.type}${o.slot ? ' · ' + SLOT_FR[o.slot] : ''} | ${esc(o.desc || '—')} | ${sheets.findIndex((s) => s.includes(o)) + 1} |\n`;
  md += '\n';
}
fs.writeFileSync(ROOT + 'docs/MISSING-ICONS.md', md);
fs.writeFileSync(path.join(__dirname, 'missing_icons.json'), JSON.stringify({ cols: 4, rows: 2, sheets: sheets.map((s) => s.map((o) => [o.id, FOLDER[o.world]])) }, null, 0) + '\n');
const c = {}; for (const o of items) c[o.world] = (c[o.world] || 0) + 1;
console.log(items.length, 'items,', sheets.length, 'sheets', c);
