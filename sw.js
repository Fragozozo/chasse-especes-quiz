// Service worker : l'app fonctionne hors connexion après la première visite.
const VERSION = "v6";
const APP = `app-${VERSION}`;
const PHOTOS = "photos";

const FICHIERS = [
  "./",
  "index.html",
  "manifest.webmanifest",
  "css/app.css?v=6",
  "js/app.js?v=6",
  "js/especes.js?v=6",
  "js/mammiferes.js",
  "js/oiseaux.js",
  "js/traces.js?v=6",
  "js/questions.js?v=6",
  "photos/credits.json?v=6",
  "photos/traces.json?v=6",
  "icons/icon-192.png",
  "icons/apple-touch-icon.png",
];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(APP).then((c) => c.addAll(FICHIERS)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys()
      .then((cles) => Promise.all(cles.filter((k) => ![APP, PHOTOS].includes(k)).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

const cacheDabord = async (nom, req) => {
  const c = await caches.open(nom);
  const r = await c.match(req);
  if (r) return r;
  const net = await fetch(req);
  if (net.ok || net.type === "opaque") c.put(req, net.clone());
  return net;
};

const reseauDabord = async (nom, req) => {
  const c = await caches.open(nom);
  try {
    const net = await fetch(req);
    if (net.ok) c.put(req, net.clone());
    return net;
  } catch (err) {
    const r = await c.match(req);
    if (r) return r;
    throw err;
  }
};

self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);

  if (url.origin === location.origin && url.pathname.includes("/photos/") && url.pathname.endsWith(".jpg")) {
    e.respondWith(cacheDabord(PHOTOS, req));
  } else if (url.hostname.includes("fonts.g")) {
    e.respondWith(cacheDabord(APP, req));
  } else if (url.origin === location.origin) {
    e.respondWith(reseauDabord(APP, req).catch(() => caches.match("index.html")));
  }
});
