# Tri-Realm Idle

An idle RPG in the spirit of Melvor Idle and NGU Idle, across seven collided anime-inspired worlds.
Each world adds one new system, and every system also applies to the worlds before it, so nothing goes stale.

| # | World | Skills | System it adds |
| --- | --- | --- | --- |
| 1 | Endless Blue | Fishing, Cooking, Voyaging | The core loop: fish → cook → fight; voyages |
| 2 | Shinobi Lands | Herbalism, Chakra Focus, Shinobi Arts | Techniques: 3 combat slots paid with chakra |
| 3 | Soul Afterlands | Soul Harvest, Reishi Mining, Bladesmithing | Weapon awakening, gem sockets, reforging any gear |
| 4 | Ki Frontier | Gravity Training, Farming, Tinkering | Transformations, real-time farm plots, tools for every gathering skill, gadgets, Wish Stones |
| 5 | Hexbound City | Exorcism, Sigilcraft, Pacts | Your Domain (a 3×3 sigil board) and binding vows |
| 6 | Hunter's Wilds | Tracking, Trapcraft, Beast Taming | Hunter Licence contracts across every world, companions, the Card Book |
| 7 | Echo Quarter | Archaeology, Restoration, Echo Bonding | An Echo that runs a second activity in parallel; museum; ancient gear |
| ∞ | The Rift | — | Final bosses and an hourly Rift Tear mixing two worlds |

- Worlds open after their guardian falls and you make an offering at the gate; skills and menus open from in-world events, one "Next unlock" at a time
- Renown per world (bonuses, then Ascension tiers that replay old stages for the newest relics), synergies between professions, schematics and world relics for iconic gear
- Combat skills to 120, everything else to 99; 55 guided objectives; offline progress, autosave, installable PWA

## Run locally

It's a static site with no build step. Serve the folder with any static server, for example:

```sh
python -m http.server 8000
```

Then open http://localhost:8000. Opening `index.html` directly also works, but offline/install support needs http(s).

## Deploying an update

Bump `VERSION` in `sw.js` so returning players get the new files, then push.

## Files

| Path | What it is |
| --- | --- |
| `index.html` | Page shell |
| `css/style.css` | All styling |
| `js/data.js` | Core content: worlds 1-3, items, zones, shop, objectives, synergies, gates, unlock order |
| `js/worlds.js` | Worlds 4-7 and the Rift finale, registered with `addWorld()`; content for techniques and awakening |
| `js/systems.js` | World systems (Renown, Ascension, techniques, awakening, farming, transformations, Domain, pacts, contracts, beasts, cards, Echo...), plugged into engine hooks |
| `js/ui-systems.js` | Interface for those systems; boots the game |
| `js/icons.js` | Game icon set (SVG paths) and which icon each item, skill, enemy and screen uses |
| `js/guide.js` | New-player onboarding: welcome screen, coach bubbles for the first 10 objectives, menu unlocks |
| `js/scene.js` | Generated background scenes for each world |
| `js/game.js` | Core engine (no DOM) with hooks for the world systems |
| `js/ui.js` | Interface: sidebar with every skill, activity bar, skill pages, bank, battle; rendering, input, save/load |
| `sw.js`, `manifest.webmanifest`, `icons/` | Installable app + offline support |

## Credits

Icons from [game-icons.net](https://game-icons.net) by Lorc, Delapouite, Skoll, Caro Asercion, sbed, Cathelineau,
DarkZaitzev, Faithtoken, Felbrigg, Guard13007, John Colburn, Lucas, PriorBlue and Zeromancer,
licensed under [CC BY 3.0](https://creativecommons.org/licenses/by/3.0/).
