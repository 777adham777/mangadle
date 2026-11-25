# Renames: homage, not copy (2026-11-26)

Before the public pre-alpha, every series-specific name was taken out of player-facing text.
**Only display strings changed.** Ids, keys, save fields, CSS classes, file names (`kaio.js`, `scouter.js`...)
and code comments still use the old words, so saves load as before.
Use the right-hand column from now on, everywhere.

## Worlds, systems, disciplines

| Old | New | Note |
| --- | --- | --- |
| Kaio Planet | Titan Planet | world 4 name (realm id stays `ki`) |
| Haki | Resolve | discipline (id `haki`); tag label too |
| Armament Haki | Iron Resolve | scroll name |
| Observation Haki / Kenbunshoku | Watchful Resolve | technique + scroll |
| Reiatsu | Soul Force | discipline (id `reiatsu`) |
| Nen | Aura | discipline (id `nen`); tag label too |
| Enhancement / Emission / Conjuration / Manipulation / Transmutation / Specialization | Reinforcement / Projection / Materialization / Control / Shaping / Singularity | the six aura categories (technique prefixes) |
| Enhancer / Emitter / Conjurer / Manipulator | Reinforcer / Projector / Materializer / Controller | in lore |
| Dragon Balls / N-Star Dragon Ball | Wish Orbs / N-Star Wish Orb | feature, item type, collection group |
| Shenron | Ryujin | the wish dragon (goal id stays `shenron`) |
| Devil Fruit | Abyss Fruit | item type, goal, Character slot |
| Logia (fruit) | elemental | lore |
| Domain Expansion | Domain Release | goal, trial, buff label |
| Binding Vow(s) | Cursed Pact(s) | feature, goal, trial, skill guide |
| Hunter Licence | Hunter Charter | contracts feature + licence wording |
| Hunter Exam | Hunter Selection | |
| Hunter Association | Hunter Guild | NPC title, unlock text |
| Greed Island Card(s) | Green Island Card(s) | scroll + card book |
| Scouter / Battle Scouter | Power Visor / Battle Visor | feature (id `feature:scouter`) and item |
| Stand / Stand Arrow (Shard) | Echo / Echo Arrow (Shard) | ties into the existing Echo system |
| Pillar Men / Pillar Man | Pillar Lords / Pillar Lord | lore, dungeon blurb; "Tomb Pillar Man" lord → Entombed Pillar Lord |
| Speedwagon Foundation | the Foundation | |
| Hell Butterfly | Underworld Butterfly | omen + two items |
| Hollow (Bleach sense) | Husk | Husk Catacombs, Husk Pup, Husk Mask, Husk Roar |
| Hokage | Flame Warden | Warden Rock, First Flame Warden |
| Will of Fire | Ember Oath | |
| Senju / Uchiha | Kodama / Akahoshi clans | |
| Uzumaki | Spiral (clan) | |
| Akimichi | the Feast clan | |
| Grand Line | Grand Current | |
| East Blue | Eastern Sea | |
| Calm Belt | Windless Belt | |
| Reverse Mountain | Uphill Cape | |
| Sea King | Sea Titan | items + lore |
| Fish-Man Island / Fishman Island | Merfolk Isle | voyage + lore |
| All Blue | Allsea | perk, tuna, feast |
| Log Pose / Eternal Pose | Tide Compass / Homeward Compass | |
| Den Den Mushi | Snail Phone | |
| Skypiea | the sky island | |
| Baratie | Floating Galley | |
| Seireitei | Inner Court | |
| Rukongai / Rukon District | Outer Districts | matches the existing stage name |
| Hueco Mundo | Husk Wastes | |
| Las Noches | Night Palace | |
| Soul King / Soul Palace / Royal Palace (Reiokyu) | Soul Monarch / Monarch's Palace / Sky Palace | |
| Kido | Spellcraft | quartz, ingot, staff, primer, corps |
| Bakudo | Binding spell | |
| Zanpakuto | soul blade | |
| Asauchi | Nameless | Nameless Katana, Nameless Blank Blade |
| Shikai / Bankai | First Release / Final Release | items; Bankai Drill → Final Release Drill |
| Black Moon Bankai Blade | Dark Crescent Final Release | |
| Getsuga Tensho | Crescent Fang | |
| Quincy | Lumen | cross, bow, craftsmen |
| Sekkiseki / Sekki | Nullstone / Hushstone | two different stones, kept apart |
| Ginrei | Archer's Silver | |
| Hyorinmaru | Ice Dragon | |
| Menos Grande | Great Husk | |
| Gotei Captain | Court Captain | set name |
| Senzu Bean | Vital Bean | item (already its id), seeds, pouch |
| Capsule Corp / Hoi-Poi | Pocketworks / pop-capsule | Pocketworks Crate, Pop Capsule |
| Turtle School / Turtle Gi / Turtle Shell | Iron Shell School / Iron Shell Gi / Iron Shell | set + items |
| Saiyan / Super Saiyan | Starborn / Starborn gone golden | |
| Kamehameha | Hermit Wave | |
| Kaioken | Crimson Surge | |
| Zenkai | Rebound | perk |
| King Kai / Kaio | Master Kai | the existing gravity hermit NPC |
| Kami's Lookout | the Sky Temple | |
| Flying Nimbus | Golden Cloud | |
| Power Pole | Ruyi Staff | |
| Z Sword | Zenith Sword | |
| Jujutsu High | Sorcery High | set + uniforms |
| Six Eyes | Clearsight | perk, blindfold (the armory blindfold is Boundless Blindfold) |
| Sukuna / King of Curses | Demon King | finger items, research node |
| Playful Cloud | Rowdy Cloud | |
| Prison Realm | Sealing Realm | |
| Inverted Spear of Heaven | Spear of Severance | |
| Nichirin Blade | Sunsteel Blade | |
| Demon Slayer Corps | Dusk Slayer Corps | set name |
| Straw Hat Crew | Red Vest Crew | set name |
| Wado (Blade) | Oath Blade | |
| Black-Leg | Iron-Leg | |
| Sniper King / Sniper Island | Sharpshooter | |
| Seastone | Tidestone | |
| Kitetsu | Bloodthirst | |
| Clima-Tact | Weather Staff | |
| Ten (aura technique) | Shroud | vest |
| Chain of Judgement | Chain of Verdict | |
| Whale Island | Orca Isle | |
| Great Stamp | Great Boar | |
| Chimera Ant(s) | chimera drone(s) / Hive King | |
| Tailed Beast / Nine-Tails / Kyuubi | bound beast / Kitsune | |
| Rasengan | Spiral Sphere | |
| Shadow Clone | Mirror Clone | |
| Rock's Leg Weights | Green Beast Leg Weights | |
| Tsukuyomi Petal | Blood-Moon Petal | |
| Myoboku / Shikkotsu / Ryuchi | Toad Mountain / Slug Forest / White Snake | |
| Anbu | Black Ops | |
| Ichiraku Ramen | Village Stall Ramen | |

## Character names

Every named character in lore lines (Goku, Vegeta, Gohan, Chi-Chi, Bulma, Korin, Roshi, Pilaf, Luffy, Usopp,
Garp, Franky, Hatchan, Ichigo, Urahara, Kenpachi, Mayuri, Gon, Killua, Kurapika, Hisoka, Ging, Menchi, Razor,
Megumi, Jogo, Dio, Joseph, Haku, Kiba, Tenten, Tsunade, Minato, Asuma...) was replaced by a description in the
same spirit ("the hungriest fighter", "a rubber-armed captain", "a forest boy", "an assassin's heir",
"a substitute reaper", "the inventor next door"...). No new proper names were invented for them.

## Kept on purpose

Generic words or real places: ninja, shinobi, genin/chunin/jonin, jutsu, kunai, senbon, chakra, ki, cursed energy,
curse grades and Special Grade, sorcerer, soul reaper, reishi (Japanese word, also a mushroom; used by
Reishi Mining), hitodama, kirin, haori, ofuda, pirate, navy, marine, bounty, Shinjuku, Leaf Village, Hidden Mist/Cloud/Stone,
Time Chamber, Ripple, Stone Mask, Fusion Earrings, Treasured Straw Hat, Spiritual Pressure, Armament Fist,
power level / "over 9,000", Master Kai (existing original NPC), Hollow Sorcerer (a JJK-world foe, generic word; its name is a lookup key in drops and sprites).
