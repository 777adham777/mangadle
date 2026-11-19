/* Service worker: makes the game installable and playable offline.
   Bump VERSION on every deploy so players get the new files. */
const VERSION = 'tri-realm-v78';
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
  './js/data.js',
  './js/worlds.js',
  './js/lore.js',
  './js/loot.js',
  './js/icons.js',
  './js/scene.js',
  './js/game.js',
  './js/systems.js',
  './js/techniques.js',
  './js/expeditions.js',
  './js/weapons.js',
  './js/chamber.js',
  './js/tasks.js',
  './js/quality.js',
  './js/seas.js',
  './js/foes.js',
  './js/guide.js',
  './js/ui.js',
  './js/avatar.js',
  './js/custom-pack.js',
  './js/custom.js',
  './js/creatures.js',
  './js/arena.js',
  './js/seas-ui.js',
  './js/shinobi-ui.js',
  './js/expeditions-ui.js',
  './js/weapons-ui.js',
  './js/tasks-ui.js',
  './js/dev.js',
  './js/techniques-ui.js',
  './js/workshop-ui.js',
  './js/skillpage-ui.js',
  './js/spot-ui.js',
  './js/ui-systems.js',
  './js/tooltips.js',
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
