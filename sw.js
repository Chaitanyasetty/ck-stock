/* CK Stock Check · offline helper (sw.js · v1 · 16 Nov 2026)
 * Keeps the app shell, the barcode reader and the font on the phone, so Stock Check opens with no signal.
 * Stock data is NOT stored here: the app keeps its own stock list on the phone, as before.
 * Calls to the Google backend (PIN, stock sync, Pan-India) always go to the network, never to this cache. */
var CACHE = 'ck-stock-v1';
var SHELL = ['./', './index.html', './manifest.webmanifest', './icon-192.png', './icon-512.png'];
self.addEventListener('install', function (e) {
  e.waitUntil(caches.open(CACHE).then(function (c) { return c.addAll(SHELL); }).then(function () { return self.skipWaiting(); }));
});
self.addEventListener('activate', function (e) {
  e.waitUntil(caches.keys().then(function (k) { return Promise.all(k.filter(function (n) { return n !== CACHE; }).map(function (n) { return caches.delete(n); })); }).then(function () { return self.clients.claim(); }));
});
self.addEventListener('fetch', function (e) {
  var r = e.request, u = new URL(r.url);
  if (r.method !== 'GET') return;                                         // backend calls (POST) → network only
  if (u.hostname.indexOf('google.com') >= 0 && u.hostname.indexOf('fonts.') !== 0) return;
  if (r.mode === 'navigate' || u.origin === self.location.origin) {      // the page itself: newest when online, saved copy when offline
    e.respondWith(fetch(r).then(function (res) { var cp = res.clone(); caches.open(CACHE).then(function (c) { c.put(r, cp); }); return res; })
      .catch(function () { return caches.match(r).then(function (m) { return m || caches.match('./'); }); }));
    return;
  }
  if (/(^|\.)cdn\.jsdelivr\.net$|^fonts\.(googleapis|gstatic)\.com$/.test(u.hostname)) {   // barcode reader + font: saved copy first
    e.respondWith(caches.match(r).then(function (m) {
      var net = fetch(r).then(function (res) { if (res && (res.ok || res.type === 'opaque')) { var cp = res.clone(); caches.open(CACHE).then(function (c) { c.put(r, cp); }); } return res; });
      return m || net;
    }));
  }
});
