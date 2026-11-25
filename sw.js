/* Service worker: makes the game installable and playable offline.
   Bump VERSION on every deploy so players get the new files. */
importScripts('./js/item-images.js', './js/monster-art.js');

const VERSION = 'tri-realm-v167';
const ITEM_ICON_URLS = Object.values(ITEM_IMAGE_PATHS).map((path) => './' + path);
const BACKGROUND_URLS = [
  'woodcutting', 'crafting', 'voyaging', 'mining', 'smithing', 'gravity',
  'farming', 'exorcism', 'tracking', 'archaeology', 'restoration', 'bonding',
].map((name) => `./assets/backgrounds/skills/${name}.webp`).concat([
  'shinobi', 'seas', 'soul', 'ki', 'hex', 'hunter', 'echo', 'rift',
].map((name) => `./assets/backgrounds/combat/${name}.webp`));
const SHELL = [
  './',
  './index.html',
  './css/style.css',
  './css/seas.css',
  './css/gdd.css',
  './css/workshop.css',
  './css/skillpage.css',
  './css/spot.css',
  './css/foes.css',
  './css/fx.css',
  './css/anim-combat.css',
  './css/anim-ui.css',
  './css/background-art.css',
  './css/chest.css',
  './css/drops.css',
  './css/character.css',
  './css/meta.css',
  './css/focus.css',
  './css/ux.css',
  './css/ux4.css',
  './css/battle.css',
  './css/scrolls.css',
  './css/dungeons.css',
  './css/quests.css',
  './css/review.css',
  './css/tips.css',
  './css/fit.css',
  './js/data.js',
  './js/curve.js',
  './js/worlds.js',
  './js/lore.js',
  './js/armory.js',
  './js/depth.js',
  './js/tiers.js',
  './js/loot.js',
  './js/item-art.js',
  './js/item-images.js',
  './js/art/leaf.js',
  './js/art/seas.js',
  './js/art/soul.js',
  './js/art/kaio.js',
  './js/art/hex.js',
  './js/art/hunter.js',
  './js/art/echo.js',
  './js/art/common.js',
  './js/icons.js',
  './js/scene.js',
  './js/game.js',
  './js/systems.js',
  './js/techniques.js',
  './js/expeditions.js',
  './js/weapons.js',
  './js/chamber.js',
  './js/tasks.js',
  './js/missions.js',
  './js/report.js',
  './js/huntlist.js',
  './js/scouter.js',
  './js/hardcore.js',
  './js/omens.js',
  './js/poster.js',
  './js/quality.js',
  './js/seas.js',
  './js/soul.js',
  './js/kaio.js',
  './js/hex.js',
  './js/hunt.js',
  './js/echo.js',
  './js/leaf.js',
  './js/foes.js',
  './js/builds.js',
  './js/dungeons.js',
  './js/economy.js',
  './js/trials.js',
  './js/story.js',
  './js/guide.js',
  './js/ui.js',
  './js/draw-util.js',
  './js/monster-art.js',
  './js/creatures.js',
  './js/arena.js',
  './js/dungeons-ui.js',
  './js/drops-ui.js',
  './js/seas-ui.js',
  './js/shinobi-ui.js',
  './js/soul-ui.js',
  './js/kaio-ui.js',
  './js/hex-ui.js',
  './js/hunt-ui.js',
  './js/echo-ui.js',
  './js/expeditions-ui.js',
  './js/weapons-ui.js',
  './js/tasks-ui.js',
  './js/dev.js',
  './js/techniques-ui.js',
  './js/workshop-ui.js',
  './js/skillpage-ui.js',
  './js/spot-ui.js',
  './js/character-ui.js',
  './js/ui-systems.js',
  './js/tooltips.js',
  './js/skill-guide.js',
  './js/reveal.js',
  './js/chest-fx.js',
  './js/builds-ui.js',
  './js/quests-ui.js',
  './js/missions-ui.js',
  './js/report-ui.js',
  './js/huntlist-ui.js',
  './js/scouter-ui.js',
  './js/hardcore-ui.js',
  './js/omens-ui.js',
  './js/poster-ui.js',
  './js/focus-ui.js',
  './js/ux3.js',
  './manifest.webmanifest',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/apple-touch-icon.png',
  './icons/favicon-32.png',
];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(VERSION).then((c) => c.addAll(SHELL.concat(ITEM_ICON_URLS, MONSTER_ART_URLS, BACKGROUND_URLS))).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== VERSION).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);

  // Google Fonts: serve from cache, refresh in the background.
  if (url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com') {
    e.respondWith(caches.open(VERSION + '-fonts').then(async (c) => {
      const hit = await c.match(req);
      const net = fetch(req).then((res) => { if (res.ok || res.type === 'opaque') c.put(req, res.clone()); return res; }).catch(() => hit);
      return hit || net;
    }));
    return;
  }
  if (url.origin !== location.origin) return;

  // Game files: network first (always fresh when online), cache as fallback (offline play).
  e.respondWith(
    fetch(req, { cache: 'no-cache' })
      .then((res) => {
        if (res.ok) { const copy = res.clone(); caches.open(VERSION).then((c) => c.put(req, copy)); }
        return res;
      })
      .catch(() => caches.match(req, { ignoreSearch: true }).then((hit) => hit || caches.match('./index.html')))
  );
});
