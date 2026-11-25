/* Service worker: makes the game installable and playable offline.
   Bump VERSION on every deploy so players get the new files. */
// Only the game itself is cached at install (~2 MB). Pictures (item icons, foes, scenes: ~33 MB) are cached
// the first time the game shows them, so a phone does not download every world on the first visit.
const VERSION = 'anime-idle-rpg-v172';
// Pictures live in their own cache, kept across versions: served at once, refreshed in the background.
const ART_CACHE = 'anime-idle-rpg-art';
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
  './css/beta.css',
  './css/fonts.css',
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
  './js/beta.js',
  './manifest.webmanifest',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/apple-touch-icon.png',
  './icons/favicon-32.png',
];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(VERSION).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== VERSION && k !== ART_CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

// The page asks which version it runs (Settings, bug reports).
self.addEventListener('message', (e) => { if (e.data === 'version' && e.ports[0]) e.ports[0].postMessage(VERSION); });

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);

  if (url.origin !== location.origin) return;

  if (url.pathname.includes('/assets/')) {
    e.respondWith(caches.open(ART_CACHE).then(async (c) => {
      const hit = await c.match(req, { ignoreSearch: true });
      const net = fetch(req).then((res) => { if (res.ok) c.put(req, res.clone()); return res; });
      if (hit) { net.catch(() => {}); return hit; }
      return net;
    }));
    return;
  }

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
