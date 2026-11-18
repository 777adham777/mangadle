# Tri-Realm Idle

An idle RPG in the spirit of Melvor Idle and NGU Idle, across seven collided anime-inspired worlds.
Each world adds one new system, and every system also applies to the worlds before it, so nothing goes stale.

| # | World | Skills | System it adds |
| --- | --- | --- | --- |
| 1 | Orange Town | Fishing, Cooking, Voyaging | The core loop: fish → cook → fight; voyages |
| 2 | Leaf Village | Herbalism, Chakra Focus, Shinobi Arts | Techniques: 3 combat slots paid with chakra |
| 3 | Soul City | Soul Harvest, Reishi Mining, Bladesmithing | Weapon awakening, gem sockets, reforging any gear |
| 4 | Kaio Planet | Gravity Training, Farming, Tinkering | Transformations, real-time farm plots, tools for every gathering skill, gadgets, Dragon Balls |
| 5 | Shinjuku | Exorcism, Sigilcraft, Pacts | Your Domain (a 3×3 sigil board) and binding vows |
| 6 | Green Island | Tracking, Trapcraft, Beast Taming | Hunter Licence contracts across every world, companions, the Greed Island Cards |
| 7 | Echo Quarter | Archaeology, Restoration, Echo Bonding | An Echo that runs a second activity in parallel; museum; ancient gear |
| ∞ | The Rift | — | Final bosses and an hourly Rift Tear mixing two worlds |

- Worlds open after their guardian falls and you make an offering at the gate; skills and menus open from in-world events, one "Next unlock" at a time
- Renown per world (bonuses, then Ascension tiers that replay old stages for the newest relics), synergies between professions, schematics and world relics for iconic gear
- Loot rarity (Common → Legendary) follows how hard an item is to get; every world has a chest, drop-only gear with a perk, and a very rare Rift Shard on its guardian. Drop-only gear salvages into relics, duplicate fruits raise their rank, Rift Shards Rift-forge gear to tier 6
- **Shiny & Perfect** (game-wide, opted in skill by skill): gathering can bring up a shiny find, crafting can make a perfect item. Each skill keeps a log of its firsts, and filling 25 / 50 / 75 / 100 % of it pays a set bonus. Live on Fishing (shiny fish) and Cooking (perfect dishes: +50%)
- **Orange Town overhaul** (worlds are being polished one at a time): animated scenes of your avatar fishing (pier → reef → open sea → abyss), cooking in the galley and sailing voyages; catch weights and records; the Cooking spice rack (six seasonings from fishing, voyages, foes and the Market) gives seasoned dishes a battle buff
- Combat skills to 120, everything else to 99; 58 guided objectives; offline progress, autosave, installable PWA

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
| `js/systems.js` | World systems (Renown, Ascension, techniques, awakening, farming, transformations, Domain, pacts, contracts, beasts, cards, Echo...), plugged into engine hooks |
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
DarkZaitzev, Faithtoken, Felbrigg, Guard13007, John Colburn, Lucas, PriorBlue and Zeromancer,
licensed under [CC BY 3.0](https://creativecommons.org/licenses/by/3.0/).
