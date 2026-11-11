const CACHE = "kon-riyadi-v1";
const CORE = ["./", "./index.html", "./manifest.json", "./icon-192.png", "./icon-512.png"];
self.addEventListener("install", e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(CORE)).then(() => self.skipWaiting())); });
self.addEventListener("activate", e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener("fetch", e => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  // لا نخزن بيانات Supabase ولا الداشبورد، حتى تظهر التعديلات فورًا
  if (url.hostname.endsWith(".supabase.co") || url.pathname.includes("/admin/")) return;
  // الصفحات وملف الإعدادات: الشبكة أولاً ثم الكاش
  if (req.mode === "navigate" || url.pathname.endsWith("/config.js")) {
    e.respondWith(fetch(req).then(r => { const copy = r.clone(); caches.open(CACHE).then(c => c.put(req, copy)); return r; })
      .catch(() => caches.match(req).then(r => r || (req.mode === "navigate" ? caches.match("./index.html") : null)).then(r => r || Response.error())));
    return;
  }
  // باقي الملفات: الكاش أولاً مع التحديث في الخلفية
  e.respondWith(caches.match(req).then(cached => {
    const net = fetch(req).then(r => { if (r && (r.ok || r.type === "opaque")) { const copy = r.clone(); caches.open(CACHE).then(c => c.put(req, copy)); } return r; }).catch(() => cached);
    return cached || net;
  }));
});
