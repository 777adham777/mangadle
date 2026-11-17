# Tri-Realm Idle

An idle RPG in the spirit of Melvor Idle and NGU Idle, set across three collided anime-inspired worlds:
the **Shinobi Lands**, the **Soul Afterlands** and the **Endless Blue**.

- 12 skills (gathering, crafting, voyages, combat) and 13 battle zones with bosses
- Inner Power energy training, Rebirth and Karma perks, rare Abyss Fruits
- Guided objectives, offline progress, autosave
- Plays in any modern browser, on desktop and mobile; installable as an app and playable offline (PWA)

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
| `js/data.js` | Game content: items, skills, zones, shop, objectives |
| `js/game.js` | Game engine (no DOM) |
| `js/ui.js` | Rendering, animations, input, save/load |
| `sw.js`, `manifest.webmanifest`, `icons/` | Installable app + offline support |
