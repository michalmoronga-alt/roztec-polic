// Service worker — offline + bezpečné aktualizácie.
// Pri každej novej verzii zvýš VERSION (a rovnaké ?v= v index.html a js/*.js).
const VERSION = '1.1.1';
const CACHE = `roztec-polic-v${VERSION}`;
const V = `?v=${VERSION}`;
const ASSETS = [
  './', './index.html', `./css/app.css${V}`, `./js/app.js${V}`, `./js/calc.js${V}`, `./js/draw.js${V}`,
  './manifest.webmanifest', './icons/icon.svg', './icons/icon-192.png', './icons/icon-512.png',
  './icons/icon-maskable-512.png', './icons/apple-touch-icon.png',
];

self.addEventListener('install', e => {
  // cache: 'reload' = obísť HTTP cache prehliadača (GitHub Pages posiela max-age=600)
  e.waitUntil(caches.open(CACHE)
    .then(c => c.addAll(ASSETS.map(u => new Request(u, { cache: 'reload' }))))
    .then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil((async () => {
    const old = (await caches.keys()).filter(k => k !== CACHE);
    await Promise.all(old.map(k => caches.delete(k)));
    await self.clients.claim();
    // Prechod zo staršej verzie: otvorené okná načítaj znova, aby nezostala zmes starých a nových súborov.
    // Pozor: na navigate() sa nečaká — počas aktivácie SW by čakala navigácia na SW (deadlock).
    if (old.length) {
      const wins = await self.clients.matchAll({ type: 'window' });
      wins.forEach(w => { w.navigate(w.url).catch(() => {}); });
    }
  })());
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== location.origin) return;

  // Súbory s ?v= sa nemenia (nová verzia = nová URL) → najprv cache, potom sieť.
  if (url.searchParams.has('v')) {
    e.respondWith(caches.match(req).then(hit => hit || fetch(req).then(res => {
      if (res.ok) { const copy = res.clone(); caches.open(CACHE).then(c => c.put(req, copy)); }
      return res;
    })));
    return;
  }

  // Všetko ostatné (HTML, manifest, ikony) → najprv sieť (s revalidáciou), pri výpadku cache.
  e.respondWith((async () => {
    try {
      const res = await fetch(req, { cache: 'no-cache' });
      if (res.ok) { const copy = res.clone(); caches.open(CACHE).then(c => c.put(req, copy)); }
      return res;
    } catch (err) {
      const hit = await caches.match(req);
      if (hit) return hit;
      if (req.mode === 'navigate') return (await caches.match('./')) || (await caches.match('./index.html'));
      throw err;
    }
  })());
});
