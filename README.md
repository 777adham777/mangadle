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
- **Elites and mini-bosses** in every stage; **daily and weekly objectives** from every open world
- **Collection Log** with items, pets, techniques, a bestiary and companions
- **Shiny & Perfect** collection logs (Fishing, Cooking so far); offline progress (12 h, the rest fills the Time Chamber), autosave, installable PWA

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
| `js/techniques.js`, `js/techniques-ui.js` | Technique collection, scrolls, fragments, typed slots, combat casting; Techniques page |
| `js/expeditions.js`, `js/expeditions-ui.js` | Passive expeditions (ships, hauls, provisions); Harbour panel and destination cards |
| `js/chamber.js` | Time Chamber (stored time, ×2 activities) |
| `js/tasks.js`, `js/tasks-ui.js` | Daily / weekly objectives; extra Collection Log sections |
| `js/weapons.js`, `js/weapons-ui.js` | Weapon copies: level, refinement, awakening, elements and families; weapon rack and forge panel |
| `css/gdd.css` | Styles for the GDD rework (stats, techniques, disciplines, harbour, weapons) |
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
| `sw.js`, `manifest.webmanifest`, `icons/` | Installable app + offline support |

## Credits

Icons from [game-icons.net](https://game-icons.net) by Lorc, Delapouite, Skoll, Caro Asercion, sbed, Cathelineau,
DarkZaitzev, Faithtoken, Felbrigg, Guard13007, John Colburn, Lucas, PriorBlue, Willdabeast and Zeromancer,
licensed under [CC BY 3.0](https://creativecommons.org/licenses/by/3.0/).
