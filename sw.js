// 画面はスマホに控えておく＝電波が弱くてもすぐ開く。index.json は毎回取りに行き、取れない時だけ控えを使う。
// data の .bin は中身の指紋が名前なので、一度取った物は控えをそのまま使う。
const C = 'gp-v1792926321';
const SHELL = ['./', 'index.html', 'manifest.webmanifest', 'icon-180.png', 'icon-192.png', 'icon-512.png'];
self.addEventListener('install', e => { e.waitUntil(caches.open(C).then(c => c.addAll(SHELL.map(s => new Request(s, { cache: 'reload' })))).then(() => self.skipWaiting())); });
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
// 通知（2026-10-22 本人「投稿の時間と引用できたら」）：PC の post_app_notify.py が Apple の通知の仕組みに送る
self.addEventListener('push', e => {
  let d = {}; try { d = e.data.json(); } catch (x) { d = { title: 'ジャイロ投稿', body: e.data ? e.data.text() : '' }; }
  e.waitUntil(self.registration.showNotification(d.title || 'ジャイロ投稿', { body: d.body || '', icon: 'icon-192.png', badge: 'icon-192.png', data: { tab: d.tab || 'single', id: d.id || '' } }));
});
self.addEventListener('notificationclick', e => {
  e.notification.close();
  const u = './?tab=' + encodeURIComponent(e.notification.data.tab) + '&id=' + encodeURIComponent(e.notification.data.id);
  e.waitUntil(self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(cs => {
    for (const c of cs) { c.postMessage({ open: e.notification.data }); return c.focus(); }
    return self.clients.openWindow(u);
  }));
});
