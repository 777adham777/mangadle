# Tri-Realm Idle

An idle RPG across six manga-inspired worlds, built from the Game Design Document in `docs/GDD.md`
(audit of the old game in `docs/GDD-AUDIT.md`, design choices in `docs/DECISIONS.md`).
One character and one progression cross every world; each world adds activities and deepens the shared systems.

| # | World | Activities | What it adds |
| --- | --- | --- | --- |
| 1 | Leaf Village | Woodcutting, Crafting, Combat | Character level and five stats; technique collection (scrolls from battle, fragments, typed slots); Chakra |
| 2 | Orange Town | Fishing, Cooking, Voyaging | Passive expeditions (10 min to 8 h, in parallel); spice rack; Haki |
| 3 | Soul City | Reishi Mining, Smelting | Ingots; every weapon copy levels, refines (+10) and awakens (element, family passive); Reiatsu |
| 4 | Kaio Planet | Gravity Training, Farming | Transformations, farm plots, Time Chamber, Dragon Balls, passive techniques; Ki |
| 5 | Shinjuku | Cursed Research | Cursed Fragments, Domain Expansions (Ultimate techniques), Binding Vows; Cursed Energy |
| 6 | Green Island | Hunting | Up to 3 companions, Hunter Licence contracts, Greed Island Cards, the six Nen categories as techniques; Nen |
| 7 | Echo Quarter | Archaeology, Restoration, Echo Bonding | Post-game: an Echo that runs a second activity, museum |
| ∞ | The Rift | — | Post-game: final bosses and an hourly Rift Tear |

- **Character**: one level earned in battle raises Attack, Defense, Vitality, Speed and Luck; gear, techniques, companions, cards and food add to them
- **Techniques**: foes drop their world's scroll (random technique, unknown ones favoured, pity counter); duplicates become fragments that level a technique to 10, with behaviour changes at 5 and 10; slots Attack I-III, Defense, Support, Passive, Ultimate open over the game; they fire on cooldown
- **Energy disciplines** (Chakra, Haki, Reiatsu, Ki, Cursed Energy, Nen): split your energy between them, one more per world
- **Weapons**: each copy keeps its own level (1-50), refinement (+1 to +10 with ingots and gems) and awakening
- **Expeditions**: ships sail in parallel with anything else, need hull wood, optional dishes bring back more
- Worlds open after their guardian falls and you make an offering at the gate; skills and menus open one at a time
- Renown and Ascension per world, synergies between activities, schematics and relics for iconic gear, loot rarity, chests, Devil Fruits
- **Foes with kits**: every enemy has a role, an element it is weak to (some resist one), a passive trait and signature moves (stuns, poison, bleed, burns, shields, heals, life steal); big moves are telegraphed and trigger your defensive techniques; bosses change phase at 66% and 33% HP; Elites and Alphas roll random affixes. Non-human foes are drawn creatures, humans are dressed stick figures
- **Elites and mini-bosses** in every stage; **daily and weekly objectives** from every open world
- **Collection Log** with items, pets, techniques, a bestiary and companions
- **Story**: the objectives are quests in eight chapters (one per world, then the Rift), each with a guide drawn with the avatar rig; quests pay items, chapters pay gear, an outfit and a haircut
- **Builds**: every piece of gear has a perk (criticals, wounds, life steal, thorns, execute, berserk, counters, opening strike, giant slayer, element techniques...), 12 sets of 2-3 pieces, and the Equipment window names your archetype
- **Every skill has a scene and its own mechanic**: the woodcutting clearing, the fishing spots (drawn catches; shiny and big ones are fought and shown off), the galley, the Reishi mine (veins, Mother Lode), the soul forge (forge heat, White Heat, Pure ingots), the gravity chamber (strain, Breakthroughs), the living farm (Giant crops, mutations), the neon alley (graded curses up to Special Grade), the forest trail (scent, Prime Prey, Shiny beasts), the dig site (excavation grids), the museum workshop (Flawless restorations) and the Echo (resonance)
- **Shiny & Perfect** collection logs on every skill that makes something; Epic and Legendary drops are revealed like a gacha pull and say what they are for
- Offline progress (12 h, the rest fills the Time Chamber), autosave, installable PWA

## Run locally

It's a static site with no build step. Serve the folder with any static server, for example:

```sh
python -m http.server 8000
```

Then open http://localhost:8000. Opening `index.html` directly also works, but offline/install support needs http(s).

## Dev tools (testing)

Add `?dev` to the URL (or tap the TRI·REALM logo 7 times) to get a **Dev** entry in the menu: unlock every world, skill, menu and stage,
max levels and systems, give items and gold, speed time up (×10 to ×1000) or skip hours, god mode and one-hit kills, skip objectives.
The first cheat backs up the save so it can be restored from the same page. `?dev=0` (or the button on the page) turns it off.

## Studio (content editor)

Open `editor.html` (or **Dev → Open the Studio**) to make avatar content with the game's own renderer:
animations (keyframes on the rig with a dope sheet, onion skin, auto-key and IK handles; they become stances,
skill animations or attacks), haircuts (locks painted with a brush, arc locks and free hair masses, with symmetry),
tops and bottoms (pieces drawn on the torso, arms and legs that follow every pose, with prints, gloves, or the
parametric base garment), hats and faces (vector layers),
back pieces (cape, hood, mantle, free art), auras (flames and particle emitters) and colours.
Each piece gets a name, world, rarity and the feat that earns it.

Work is kept as a draft in the browser. **Preview in game** makes the game on the same computer load the draft
(it turns dev mode on; reload the game tab). **Save to project** writes `js/custom-pack.js`, which `js/custom.js`
turns into game content; commit and deploy it like any other change.

## Deploying an update

Bump `VERSION` in `sw.js` so returning players get the new files, then push.

## Files

| Path | What it is |
| --- | --- |
| `index.html` | Page shell |
| `css/style.css` | Main styling |
| `css/seas.css` | Skill scenes, Shiny & Perfect tiles and logs, spice rack |
| `js/data.js` | Core content: worlds 1-3, items, zones, shop, objectives, synergies, gates, unlock order |
| `js/loot.js` | Loot pass: world chests, drop-only gear with utility perks, rarity from drop rates, salvage values |
| `js/worlds.js` | Worlds 4-7 and the Rift finale, registered with `addWorld()`; content for techniques and awakening |
| `js/systems.js` | World systems (Renown, Ascension, armor sockets/reforge, farming, transformations, Domain, pacts, contracts, beasts, cards, Echo...), plugged into engine hooks |
| `js/foes.js` | Foe kits (roles, weaknesses, traits, moves, boss phases, Elite affixes) and the shared status system; power-neutral scaling |
| `js/creatures.js`, `css/foes.css` | Drawn, animated creatures for every non-human foe; foe HUD, statuses, wind-ups, bestiary page |
| `js/techniques.js`, `js/techniques-ui.js` | Technique collection, scrolls, fragments, typed slots, combat casting; Techniques page |
| `js/expeditions.js`, `js/expeditions-ui.js` | Passive expeditions (ships, hauls, provisions); Harbour panel and destination cards |
| `js/chamber.js` | Time Chamber (stored time, ×2 activities) |
| `js/tasks.js`, `js/tasks-ui.js` | Daily / weekly objectives; extra Collection Log sections |
| `js/weapons.js`, `js/weapons-ui.js` | Weapon copies: level, refinement, awakening, elements and families; weapon rack and forge panel |
| `css/gdd.css` | Styles for the GDD rework (stats, techniques, disciplines, harbour, weapons) |
| `js/builds.js`, `js/builds-ui.js` | Gear perks, sets, the build archetype; foe wounds and burns |
| `js/story.js`, `js/story-ui.js` | Chapters, guides, quest lines and rewards; the quest tracker, chapter cards, story log |
| `js/catch-fx.js`, `js/reveal.js` | Drawn fish and the big-catch showcase; the rare drop reveal |
| `js/soul.js`, `js/kaio.js`, `js/hex.js`, `js/hunt.js`, `js/echo.js`, `js/leaf.js` | Each world's skill mechanics (DOM-free) |
| `js/soul-ui.js`, `js/kaio-ui.js`, `js/hex-ui.js`, `js/hunt-ui.js`, `js/echo-ui.js` | Each world's skill scenes |
| `css/fx.css` | Styles for the scenes, showcases, reveals, builds and story |
| `docs/` | Game Design Document, audit, design decisions |
| `js/quality.js` | Shiny & Perfect: variant items (shiny / perfect / seasoned, created on demand), quality rolls, logs and their set bonuses |
| `js/seas.js` | Orange Town overhaul: seasonings and their battle buffs, where they drop, catch weights and records |
| `js/seas-ui.js` | Animated skill scenes (fishing, galley, voyages), spice rack, Shiny & Perfect logs, celebrations |
| `js/ui-systems.js` | Interface for those systems; boots the game |
| `js/icons.js` | Game icon set (SVG paths) and which icon each item, skill, enemy and screen uses |
| `js/guide.js` | New-player onboarding: welcome screen, coach bubbles for the first 10 objectives, menu unlocks |
| `js/scene.js` | Generated background scenes for each world |
| `js/game.js` | Core engine (no DOM) with hooks for the world systems |
| `js/ui.js` | Interface: sidebar with every skill, activity bar, skill pages, bank, battle; rendering, input, save/load |
| `js/dev.js` | Hidden dev tools for testing (`?dev`): unlock everything, levels, items, time speed, god mode, save backup |
| `js/custom.js` | Turns the Studio's pack (`js/custom-pack.js`) into avatar content and cosmetics |
| `editor.html`, `js/editor.js`, `css/editor.css` | The Studio, the content editor |
| `sw.js`, `manifest.webmanifest`, `icons/` | Installable app + offline support |

## Credits

Icons from [game-icons.net](https://game-icons.net) by Lorc, Delapouite, Skoll, Caro Asercion, sbed, Cathelineau,
DarkZaitzev, Faithtoken, Felbrigg, Guard13007, John Colburn, Lucas, PriorBlue, Willdabeast and Zeromancer,
licensed under [CC BY 3.0](https://creativecommons.org/licenses/by/3.0/).
