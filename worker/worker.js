/* hdtiktok proxy — Cloudflare Worker (ücretsiz katman yeterli).
   Tarayıcılar TikTok'a doğrudan istek atamaz (CORS). Bu Worker sadece iki şey yapar:
     GET /page?u=<kullanici>   → https://www.tiktok.com/@<kullanici> sayfasını getirir
     GET /img?url=<cdn-url>    → TikTok CDN görselini CORS başlığıyla getirir
   Açık proxy DEĞİLDİR: yalnızca tiktok.com profil sayfası ve TikTok CDN host'ları,
   yalnızca izin verilen Origin'lerden. Ayrıştırma tarayıcıda yapılır (app.js). */
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36';
const IMG_HOST = /(^|\.)(tiktokcdn\.com|tiktokcdn-us\.com|tiktokcdn-eu\.com|ibyteimg\.com|ibytedtos\.com|byteimg\.com)$/i;

export default {
  async fetch(req, env) {
    const origin = req.headers.get('Origin') || '';
    const allowed = (env.ALLOWED_ORIGINS || 'https://wek1d.github.io').split(',').map((s) => s.trim());
    const okOrigin = !origin || allowed.includes(origin) || /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin);
    const cors = origin && okOrigin ? { 'Access-Control-Allow-Origin': origin, Vary: 'Origin' } : {};

    if (req.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: { ...cors, 'Access-Control-Allow-Methods': 'GET', 'Access-Control-Max-Age': '86400' } });
    }
    if (req.method !== 'GET' || !okOrigin) return new Response('forbidden', { status: 403, headers: cors });

    const url = new URL(req.url);
    try {
      if (url.pathname === '/page') {
        const u = url.searchParams.get('u') || '';
        if (!/^[A-Za-z0-9._]{1,40}$/.test(u)) return new Response('bad username', { status: 400, headers: cors });
        const r = await fetch(`https://www.tiktok.com/@${u}`, {
          headers: { 'User-Agent': UA, Accept: 'text/html,application/xhtml+xml', 'Accept-Language': 'en-US,en;q=0.9' },
          redirect: 'follow',
        });
        return new Response(r.body, { status: r.status, headers: { ...cors, 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'public, max-age=300' } });
      }
      if (url.pathname === '/img') {
        let target;
        try { target = new URL(url.searchParams.get('url') || ''); } catch { return new Response('bad url', { status: 400, headers: cors }); }
        if (target.protocol !== 'https:' || !IMG_HOST.test(target.hostname)) return new Response('host not allowed', { status: 403, headers: cors });
        const r = await fetch(target.toString(), { headers: { 'User-Agent': UA, Referer: 'https://www.tiktok.com/' } });
        return new Response(r.body, { status: r.status, headers: { ...cors, 'Content-Type': r.headers.get('Content-Type') || 'image/jpeg', 'Cache-Control': 'public, max-age=3600' } });
      }
      return new Response('hdtiktok proxy: /page?u=<username> | /img?url=<tiktok cdn url>', { status: 200, headers: cors });
    } catch {
      return new Response('upstream error', { status: 502, headers: cors });
    }
  },
};
