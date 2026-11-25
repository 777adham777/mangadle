# Anime Idle RPG

An idle RPG across seven anime-inspired worlds (plus the Rift), built from the Game Design Document in `docs/GDD.md`
(audit of the old game in `docs/GDD-AUDIT.md`, design choices in `docs/DECISIONS.md`).
One character and one progression cross every world; each world adds activities and deepens the shared systems.

| # | World | Activities | What it adds |
| --- | --- | --- | --- |
| 1 | Leaf Village | Woodcutting, Crafting, Combat | Character level and five stats; technique collection (scrolls from battle, fragments, typed slots); Chakra |
| 2 | Orange Town | Fishing, Cooking, Voyaging | Passive expeditions (10 min to 8 h, in parallel); spice rack; Resolve |
| 3 | Soul City | Reishi Mining, Smelting | Ingots; every weapon copy levels, refines (+10) and awakens (element, family passive); Soul Force |
| 4 | Titan Planet | Gravity Training, Farming | Transformations, farm plots, Time Chamber, Wish Orbs, passive techniques; Ki |
| 5 | Shinjuku | Cursed Research | Cursed Fragments, Domain Releases (Ultimate techniques), Cursed Pacts; Cursed Energy |
| 6 | Green Island | Hunting | Up to 3 companions, Hunter Charter contracts, Green Island Cards, the six aura categories as techniques; Aura |
| 7 | Echo Quarter | Archaeology, Restoration, Echo Bonding | Post-game: an Echo that runs a second activity, museum |
| ∞ | The Rift | — | Post-game: final bosses and an hourly Rift Tear |

- **Character**: one level earned in battle raises Attack, Defense, Vitality, Speed and Luck; gear, techniques, companions, cards and food add to them
- **Techniques**: foes drop their world's scroll (random technique, unknown ones favoured, pity counter); duplicates become fragments that level a technique to 10, with behaviour changes at 5 and 10; slots Attack I-III, Defense, Support, Passive, Ultimate open over the game; they fire on cooldown
- **Energy disciplines** (Chakra, Resolve, Soul Force, Ki, Cursed Energy, Aura): split your energy between them, one more per world
- **Weapons**: each copy keeps its own level (1-50), refinement (+1 to +10 with ingots and gems) and awakening
- **Expeditions**: ships sail in parallel with anything else, need hull wood, optional dishes bring back more
- Worlds open after their guardian falls and you make an offering at the gate; skills and menus open one at a time
- Renown and Ascension per world, synergies between activities, schematics and relics for iconic gear, loot rarity, chests, Abyss Fruits
- **Foes with kits**: every enemy has a role, an element it is weak to (some resist one), a passive trait and signature moves (stuns, poison, bleed, burns, shields, heals, life steal); big moves are telegraphed and trigger your defensive techniques; bosses change phase at 66% and 33% HP; Elites and Alphas roll random affixes. Every foe is a painted sprite (a few beasts are drawn creatures)
- **Elites and mini-bosses** in every stage; **daily and weekly objectives** from every open world
- **Battle seen through your eyes**: no hero on screen, the foe stands big in the middle of its world's stage; you are the command dock under it (HP, swing, techniques on cooldown, food)
- **Collection Log** with items, pets, techniques, a bestiary and companions
- **Story**: the objectives are quests in eight chapters (one per world, then the Rift), each with a guide; quests pay items, chapters pay gear
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

Add `?dev` to the URL (or tap the ANIME·IDLE·RPG logo 7 times) to get a **Dev** entry in the menu: unlock every world, skill, menu and stage,
max levels and systems, give items and gold, speed time up (×10 to ×1000) or skip hours, god mode and one-hit kills, skip objectives.
The first cheat backs up the save so it can be restored from the same page. `?dev=0` (or the button on the page) turns it off.

## Deploying an update

Bump `VERSION` in `sw.js` so returning players get the new files, then push.

## Files

| Path | What it is |
| --- | --- |
| `index.html` | Page shell |
| `css/style.css` | Main styling |
| `css/seas.css` | Skill scenes, Shiny & Perfect tiles and logs, spice rack |
| `js/data.js` | Core content: worlds 1-3, items, zones, shop, objectives, synergies, gates, unlock order |
| `js/armory.js` | The manga armory: 53 more pieces across every world (drops, finds, recipes, 3 schematics, 6 crew sets); stats from `js/economy.js`; icon sheet prompts in `docs/ARMORY-ICONS.md`, cut by `tools/slice_icon_sheet.py` |
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
| `assets/item-icons/<world>/<id>.png`, `js/item-images.js` | Generated transparent 256×256 item icons and their ID map |
| `js/item-art.js`, `js/icons.js`, `js/art/` | SVG fallback art, shared SVG paths and icon assignments for the UI |
| `js/guide.js` | New-player onboarding: welcome screen, coach bubbles for the first 10 objectives, menu unlocks |
| `js/scene.js` | Generated background scenes for each world |
| `js/game.js` | Core engine (no DOM) with hooks for the world systems |
| `js/ui.js` | Interface: sidebar with every skill, activity bar, skill pages, bank, battle page (top bar + command dock); rendering, input, save/load |
| `js/arena.js`, `css/battle.css` | The battle stage: the foe, its plate, drops and rates; hit effects (yours on the foe, its blows on the screen); the bestiary page |
| `js/draw-util.js` | Small shared drawing helpers (easing, points, colour shading, reduced motion) |
| `js/dev.js` | Hidden dev tools for testing (`?dev`): unlock everything, levels, items, time speed, god mode, save backup |
| `sw.js`, `manifest.webmanifest`, `icons/` | Installable app + offline support |

