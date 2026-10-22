// 画面はスマホに控えておく＝電波が弱くてもすぐ開く。index.json は毎回取りに行き、取れない時だけ控えを使う。
// data の .bin は中身の指紋が名前なので、一度取った物は控えをそのまま使う。
const C = 'gp-v1792668823';
const SHELL = ['./', 'index.html', 'manifest.webmanifest', 'icon-180.png', 'icon-192.png', 'icon-512.png'];
self.addEventListener('install', e => { e.waitUntil(caches.open(C).then(c => c.addAll(SHELL)).then(() => self.skipWaiting())); });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== C).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener('fetch', e => {
  const u = new URL(e.request.url);
  if (u.origin !== location.origin) return;
  if (u.pathname.endsWith('.bin')) {
    e.respondWith(caches.open(C).then(c => c.match(e.request).then(r => r || fetch(e.request).then(n => { if (n.ok) c.put(e.request, n.clone()); return n; }))));
    return;
  }
  // 画面と index.json：取りに行って控えを新しくする。取れなければ控え
  // GitHub Pages は10分ブラウザに覚えさせるので、no-cache で毎回確かめる（本人「画像ちっちゃいまま」＝古い画面が出ていた）
  e.respondWith(fetch(e.request, { cache: 'no-cache' }).then(n => { if (n.ok) { const k = u.pathname.endsWith('index.json') ? new Request(u.pathname) : e.request; caches.open(C).then(c => c.put(k, n.clone())); } return n; })
    .catch(() => caches.match(u.pathname.endsWith('index.json') ? new Request(u.pathname) : e.request, { ignoreSearch: true })));
});
