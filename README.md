# hdtiktok

Fetches a TikTok profile's picture at the highest resolution TikTok serves, together with followers, following, likes and video counts and the verified badge — then lets you preview, convert, copy, share or download it. Nothing is re-encoded unless you ask for it.

Live at **[wek1d.github.io/hdtiktok](https://wek1d.github.io/hdtiktok/)**

## What it does

Type a username (or paste a `tiktok.com/@…` link) and hit **Fetch**. You get the avatar, display name, verified badge, bio, followers / following / likes / videos, and these tools: Original / Clean ×2 / Strong ×4 (client-side upscaling in a Web Worker), PNG / JPEG / WEBP conversion, copy image, copy link, native share, QR, color palette, recent history, TR/EN, light/dark, installable PWA. Deep links work: `#u=username`.

## How it gets the data (and why it can break)

TikTok has no public API for this. The profile page embeds its own data as JSON in a `<script id="__UNIVERSAL_DATA_FOR_REHYDRATION__">` tag (`webapp.user-detail` → `userInfo` = `{ user, stats }`). hdtiktok fetches that page and reads the JSON in your browser (`parseProfileHtml` in `app.js`; `SIGI_STATE` is tried as a fallback).

Browsers can't call TikTok directly (CORS), so the page is fetched through, in order:

1. **Your own Cloudflare Worker** (optional, recommended — see `worker/`), then
2. reader services that open the page in a real browser and return markdown/JSON (Jina Reader → Microlink), then
3. classic HTML proxies (allorigins → codetabs → corsproxy.io).

Reader services are tried before HTML proxies because TikTok's WAF usually answers datacenter IPs with a "Please wait…" challenge page; readers execute the page and return the real content. TikTok's oEmbed endpoint (which is CORS-enabled) is used as a final existence check so the UI can tell "user not found" apart from "blocked".

Things to know honestly:

- TikTok has aggressive bot protection and often rejects datacenter IPs, which is where every proxy lives. Public proxies and readers are rate-limited and will fail sometimes; the UI then says "TikTok blocked the request". A personal Worker is far more reliable but is not guaranteed either.
- Avatar URLs are signed and expire. hdtiktok never modifies them and downloads the file right away, so saving still works after the link expires.
- TikTok can change its page layout at any time. When that happens, run `npm test`, compare with a fresh sample page, and adjust `parseProfileHtml`. That one function is the only TikTok-specific parsing.

## Setup

```bash
npm install
npm start        # local server → http://localhost:4173
npm test         # parser tests
npm run build    # minifies the source into /docs
git add . && git commit -m "..." && git push
```

Open the site through `npm start` (or any HTTP server), **not** by double-clicking `index.html`. With `file://` the browser reports the origin as `null`, so the manifest/service worker are blocked and some CORS requests behave differently; the console errors in the screenshot disappear once it is served over HTTP.

GitHub Pages: **Settings → Pages → Branch `main` / Folder `/docs`**. `.github/workflows/deploy.yml` rebuilds weekly and keeps `sitemap.xml` fresh (`lastmod` comes from git history, hence `fetch-depth: 0`).

### Optional: your own proxy (Cloudflare Worker, free)

1. Cloudflare dashboard → **Workers & Pages → Create → Worker**, paste `worker/worker.js`, deploy.
2. In the Worker's **Settings → Variables** set `ALLOWED_ORIGINS` to your site origin (default `https://wek1d.github.io`).
3. Put the Worker URL into `index.html`: `<meta name="hdtiktok-worker" content="https://hdtiktok-proxy.<you>.workers.dev">`, then rebuild.

The Worker only serves `tiktok.com/@user` pages and TikTok CDN images, and only to allowed origins — it is not an open proxy.

## Project structure

```
index.html / style.css / app.js   Source (app.js holds all logic incl. the upscale worker)
build.js                          Minify → /docs, cache-busting hashes, sitemap
worker/                           Optional Cloudflare Worker proxy
tests/parse.test.js               Parser tests (run when TikTok changes its layout)
sw.js, manifest.webmanifest       PWA (app shell only, network-first)
hdtiktok.png, icons, og-image.png Branding
docs/                             Build output served by GitHub Pages — don't edit by hand
```

## Privacy

No analytics, no trackers, no cookies, no accounts, no server of our own. `localStorage` only holds preferences (`hdtiktok-lang`, `hdtiktok-theme`, `hdtiktok:format`), the last 6 usernames and the last working proxy. Requests go through the worker/reader/proxy services above, which can see which username you looked up.

## Notes

Reads only what TikTok already shows publicly on a profile page. Not affiliated with TikTok. Download only content you have the right to. MIT licensed — © 2026 Arda Keçeci ([Wek1d](https://github.com/Wek1d)).
