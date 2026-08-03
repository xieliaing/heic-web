/* LetterLand service worker — offline support for the static app.
 *
 * All paths are relative to this file's location, so the app works whether it
 * is served from the site root or a subfolder (e.g. /letterland/).
 *
 * NOTE: bump CACHE (e.g. letterland-v2) whenever you change any app file, so
 * returning visitors pick up the new version instead of a stale cached copy.
 */
var CACHE = "letterland-v2";
var ASSETS = [
  "./",
  "index.html",
  "css/styles.css",
  "js/words.js",
  "js/themes.js",
  "js/storage.js",
  "js/audio.js",
  "js/engine.js",
  "js/app.js",
  "manifest.webmanifest",
  "icons/icon-192.png",
  "icons/icon-512.png",
  "icons/apple-touch-icon.png"
];

self.addEventListener("install", function (e) {
  e.waitUntil(
    caches.open(CACHE)
      .then(function (c) { return c.addAll(ASSETS); })
      .then(function () { return self.skipWaiting(); })
  );
});

self.addEventListener("activate", function (e) {
  e.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(keys.map(function (k) {
        if (k !== CACHE) return caches.delete(k); // drop old versions
      }));
    }).then(function () { return self.clients.claim(); })
  );
});

// Cache-first: instant loads and full offline play. Falls back to the cached
// page shell for navigations when the network is unavailable.
self.addEventListener("fetch", function (e) {
  var req = e.request;
  if (req.method !== "GET") return;
  e.respondWith(
    caches.match(req).then(function (hit) {
      return hit || fetch(req).catch(function () {
        if (req.mode === "navigate") return caches.match("index.html");
      });
    })
  );
});
