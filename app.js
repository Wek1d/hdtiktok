(function () {
'use strict';

/* ---------- Inline utilities ---------- */
function createLimiter(max) {
  let active = 0;
  const queue = [];
  const next = () => {
    if (active >= max || !queue.length) return;
    active++;
    const { fn, resolve, reject } = queue.shift();
    Promise.resolve().then(fn).then(resolve, reject)
      .finally(() => { active--; next(); });
  };
  return function limit(fn) {
    return new Promise((resolve, reject) => {
      queue.push({ fn, resolve, reject });
      next();
    });
  };
}
async function retry(fn, { retries = 2, minTimeout = 600, factor = 2, shouldRetry = () => true } = {}) {
  let lastErr;
  for (let i = 0; i <= retries; i++) {
    try { return await fn(i); }
    catch (e) {
      lastErr = e;
      if (i === retries || !shouldRetry(e)) break;
      await new Promise(r => setTimeout(r, minTimeout * Math.pow(factor, i)));
    }
  }
  throw lastErr;
}
const onIdle = window.requestIdleCallback
  ? (fn) => window.requestIdleCallback(fn, { timeout: 1500 })
  : (fn) => setTimeout(fn, 200);

/* ---------- i18n ---------- */
const dict = {
  tr: {
    docTitle: 'hdtiktok — TikTok profil fotoğrafı',
    title: 'TikTok profil fotoğrafını <span class="hl">yüksek çözünürlükle</span> çek.',
    lede: "Kullanıcı adı ya da link yeter. Profil fotoğrafını takipçi, takip ve video sayılarıyla birlikte getirir. İstersen PNG/JPEG/WebP'ye dönüştür.",
    goBtn: 'Çek',
    queryPlaceholder: 'kullaniciadi',
    hintPre: 'Tam link de yapıştırabilirsin — ',
    hintMono: 'https://tiktok.com/@…',
    hintPost: ' otomatik ayıklanır.',
    loading: 'profil aranıyor…',
    retrying: 'tekrar deneniyor…',
    notFoundTitle: 'Kullanıcı bulunamadı',
    notFoundDetail: (u) => `@${u} adında bir TikTok hesabı bulamadım.`,
    noPicTitle: 'Profil görseli yok',
    noPicDetail: (u) => `@${u} bir TikTok hesabı ama profil fotoğrafı ayarlamamış.`,
    connTitle: 'Bağlantı hatası',
    connDetail: 'TikTok sunucusuna ulaşılamadı, birkaç saniye sonra tekrar dene.',
    rateLimitTitle: 'Çok fazla istek',
    rateLimitDetail: 'TikTok kısa süreliğine istek sınırı koydu. Birkaç saniye sonra tekrar dene.',
    serverTitle: 'TikTok sunucusu yanıt vermiyor',
    serverDetail: 'TikTok tarafında geçici bir sorun olabilir, birazdan tekrar dene.',
    retryBtn: 'Yeniden dene',
    preparing: 'hazırlanıyor…',
    downloadBtn: 'İndir',
    enhanceBtn: 'Yükselt',
    enhancePreparing: 'yükseltiliyor…',
    openBtn: 'Tam boy',
    copyImgBtn: 'Görseli kopyala',
    copyLinkBtn: 'Linki kopyala',
    shareBtn: 'Paylaş',
    qrTitle: 'Bu sonucu paylaş',
    toastUpscaled: 'Görsel yükseltildi',
    toastEnhanceFailed: 'Yükseltme başarısız',
    viewOriginal: 'Orijinal',
    viewEnhanced: 'Yükseltilmiş',
    viewClean: 'Sade ×2',
    viewStrong: 'Güçlü ×4',
    hintOriginal: 'TikTok’taki dosya, dokunulmadan',
    hintClean: 'Sadece büyütür, renklere dokunmaz',
    hintStrong: 'Büyütür ve detayı keskinleştirir',
    upscaling: 'yükseltiliyor…',
    followersLabel: 'takipçi',
    followingLabel: 'takip',
    likesLabel: 'beğeni',
    videosLabel: 'video',
    privateLabel: 'Gizli hesap',
    blockedTitle: 'TikTok isteği engelledi',
    blockedDetail: 'TikTok bu bağlantıyı bot sanıp engelledi. Birkaç dakika sonra tekrar dene.',
    verifiedLabel: 'Doğrulanmış hesap',
    tabAvatar: 'Avatar',
    tabBanner: 'Banner',
    siteOpenBtn: "TikTok'ta aç",
    zoomTag: 'büyüt',
    zoomHint: 'tıkla / çift tıkla: yakınlaştır',
    closeAria: 'Kapat',
    themeAria: 'Temayı değiştir',
    footerNote: "TikTok'un herkese açık profil sayfasını okur, TikTok ile bağlantılı değildir.",
    footerBy: 'by Wek1d',
    original: 'orijinal',
    qualityHighest: '✓ en yüksek',
    qualitySource: 'kaynak',
    historyLabel: 'son aramalar',
    historyClear: 'temizle',
    toastCopied: 'Görsel panoya kopyalandı',
    toastLinkCopied: 'Site linki kopyalandı',
    toastCopyFailed: 'Kopyalanamadı',
    toastDownloaded: 'İndirildi',
    toastDownloadFailed: 'İndirme başarısız',
    toastConvertFailed: 'Dönüştürme başarısız',
    toastNoShare: 'Cihaz paylaşımı desteklemiyor',
    toastQrCopied: 'URL kopyalandı',
    formatOriginal: 'Orijinal',
    shareTitle: (u) => `@${u} · hdtiktok`,
    shareText: (u) => `TikTok profil görseli: @${u} — hdtiktok ile indir`,
    zipBtn: 'ZIP indir',
    zipPreparing: 'ZIP hazırlanıyor…',
    toastZip: 'ZIP indirildi',
    toastColorCopied: (c) => `${c} kopyalandı`,
    paletteTitle: 'Rengi kopyala',
    faqTitle: 'Sık sorulanlar',
    faq1q: 'TikTok profil fotoğrafı nasıl indirilir?',
    faq1a: 'Kullanıcı adını (ya da tiktok.com linkini) kutuya yaz, “Çek”e bas. Önizleme gelince “İndir”e tıklaman yeterli.',
    faq2q: 'Görsel kalitesi düşüyor mu?',
    faq2a: 'Hayır. “Orijinal” modda TikTok\'in sunduğu en büyük dosya dokunulmadan iner. Sade ×2 ve Güçlü ×4 modları isteğe bağlıdır ve tarayıcında çalışır.',
    faq3q: 'Bazen neden “engellendi” diyor?',
    faq3a: 'TikTok botlara karşı sıkı koruma kullanır ve bazı ortak sunucuları reddeder. Araç, sayfayı birkaç okuma servisi ve proxy üzerinden dener; yine olmazsa birkaç saniye sonra tekrar dene. Kalıcıysa site sahibi kendi Cloudflare Worker\'ını bağlayabilir (README).',
    faq4q: 'Verilerim saklanıyor mu?',
    faq4a: 'Sunucumuz yok. Son aramalar ve tercihlerin sadece kendi tarayıcında (localStorage) durur. TikTok doğrudan erişime izin vermezse istek herkese açık okuma servisleri ve CORS proxy\'leri üzerinden gider.',
  },
  en: {
    docTitle: 'hdtiktok — TikTok profile picture',
    title: 'Grab a TikTok profile picture in its <span class="hl">highest resolution</span>.',
    lede: "Just a username or a link. Gets the profile picture together with followers, following and video counts. Convert to PNG/JPEG/WebP if you want.",
    goBtn: 'Fetch',
    queryPlaceholder: 'username',
    hintPre: 'You can paste the full link too — ',
    hintMono: 'https://tiktok.com/@…',
    hintPost: ' gets parsed automatically.',
    loading: 'looking up profile…',
    retrying: 'retrying…',
    notFoundTitle: 'User not found',
    notFoundDetail: (u) => `Couldn't find a TikTok account named @${u}.`,
    noPicTitle: 'No profile picture',
    noPicDetail: (u) => `@${u} is a TikTok account, but hasn't set a profile picture.`,
    connTitle: 'Connection error',
    connDetail: "Couldn't reach TikTok's servers — try again in a few seconds.",
    rateLimitTitle: 'Too many requests',
    rateLimitDetail: 'TikTok is rate-limiting right now. Try again in a few seconds.',
    serverTitle: "TikTok's server is not responding",
    serverDetail: "There may be a temporary issue on TikTok's side — try again shortly.",
    retryBtn: 'Retry',
    preparing: 'preparing…',
    downloadBtn: 'Download',
    enhanceBtn: 'Upscale',
    enhancePreparing: 'upscaling…',
    openBtn: 'Full size',
    copyImgBtn: 'Copy image',
    copyLinkBtn: 'Copy link',
    shareBtn: 'Share',
    qrTitle: 'Share this result',
    toastUpscaled: 'Image enhanced',
    toastEnhanceFailed: 'Upscale failed',
    viewOriginal: 'Original',
    viewEnhanced: 'Upscaled',
    viewClean: 'Clean ×2',
    viewStrong: 'Strong ×4',
    hintOriginal: 'The file on TikTok, untouched',
    hintClean: 'Upscale only, colors untouched',
    hintStrong: 'Upscale plus detail sharpening',
    upscaling: 'upscaling…',
    followersLabel: 'followers',
    followingLabel: 'following',
    likesLabel: 'likes',
    videosLabel: 'videos',
    privateLabel: 'Private account',
    blockedTitle: 'TikTok blocked the request',
    blockedDetail: 'TikTok mistook this connection for a bot. Try again in a few minutes.',
    verifiedLabel: 'Verified account',
    tabAvatar: 'Avatar',
    tabBanner: 'Banner',
    siteOpenBtn: 'Open on TikTok',
    zoomTag: 'zoom',
    zoomHint: 'click / double-click to zoom',
    closeAria: 'Close',
    themeAria: 'Toggle theme',
    footerNote: "Reads TikTok's public profile page — not affiliated with TikTok.",
    footerBy: 'by Wek1d',
    original: 'original',
    qualityHighest: '✓ highest',
    qualitySource: 'source',
    historyLabel: 'recent',
    historyClear: 'clear',
    toastCopied: 'Image copied to clipboard',
    toastLinkCopied: 'Site link copied',
    toastCopyFailed: 'Copy failed',
    toastDownloaded: 'Downloaded',
    toastDownloadFailed: 'Download failed',
    toastConvertFailed: 'Conversion failed',
    toastNoShare: 'Sharing not supported on this device',
    toastQrCopied: 'URL copied',
    formatOriginal: 'Original',
    shareTitle: (u) => `@${u} · hdtiktok`,
    shareText: (u) => `TikTok profile picture: @${u} — grab it with hdtiktok`,
    zipBtn: 'Download ZIP',
    zipPreparing: 'building ZIP…',
    toastZip: 'ZIP downloaded',
    toastColorCopied: (c) => `${c} copied`,
    paletteTitle: 'Copy color',
    faqTitle: 'FAQ',
    faq1q: 'How do I download a TikTok profile picture?',
    faq1a: 'Type the username (or paste a tiktok.com link) and hit “Fetch”. When the preview shows up, click “Download”.',
    faq2q: 'Does the image lose quality?',
    faq2a: 'No. In “Original” mode the largest file TikTok offers is saved untouched. Clean ×2 and Strong ×4 are optional and run in your browser.',
    faq3q: 'Why does it sometimes say “blocked”?',
    faq3a: 'TikTok uses strict bot protection and rejects some shared servers. The tool tries a few reader services and proxies; if they all fail, try again in a few seconds. If it persists, the site owner can connect their own Cloudflare Worker (see README).',
    faq4q: 'Is my data stored?',
    faq4a: 'There is no server. Recent searches and preferences stay in your own browser (localStorage). If TikTok blocks direct access, requests go through public reader services and CORS proxies.',
  },
};

/* ---------- State ---------- */
const $ = (id) => document.getElementById(id);
const LANG_KEY = 'hdtiktok-lang';
function getStoredLang() {
  try {
    const v = localStorage.getItem(LANG_KEY);
    return (v === 'tr' || v === 'en') ? v : null;
  } catch { return null; }
}
function storeLang(value) {
  try { localStorage.setItem(LANG_KEY, value); } catch {}
}
let lang = getStoredLang() || ((navigator.language || 'en').toLowerCase().startsWith('tr') ? 'tr' : 'en');
let lastErrorState = null;
let currentFormat = 'original';
const state = {
  username: '',
  slug: '',
  channel: { followers: null, following: null, likes: null, videos: null, nickname: '', bio: '', verified: false, isPrivate: false },
  activeTab: 'avatar',
  assets: { avatar: null, banner: null },
};

function t() { return dict[lang]; }
function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }
function makeErr(type) { const e = new Error(type); e.type = type; return e; }

/* ---------- DOM refs ---------- */
const form = $('pfp-form');
const queryInput = $('query');
const goBtn = $('go-btn');
const stage = $('stage');
const states = { loading: $('state-loading'), error: $('state-error'), result: $('state-result') };
const previewFrame = $('preview-frame');
const previewImg = $('preview-img');
const resultUsername = $('result-username');
const resultSpecs = $('result-specs');
const resultNick = $('result-nick');
const resultStats = $('result-stats');
const resultBio = $('result-bio');
const verifiedBadge = $('verified-badge');
const modeSwitch = $('mode-switch');
const downloadBtn = $('download-btn');
const formatTrigger = $('format-trigger');
const formatMenu = $('format-menu');
const formatCurrent = $('format-current');
const openBtn = $('open-btn');
const copyImgBtn = $('copy-img-btn');
const copyLinkBtn = $('copy-link-btn');
const shareBtn = $('share-btn');
const qrBtn = $('qr-btn');
const zipBtn = $('zip-btn');
const paletteEl = $('palette');
const resultCard = $('state-result');
const errorTitle = $('error-title');
const errorDetail = $('error-detail');
const retryBtn = $('retry-btn');
const loadingText = $('loading-text');
const historyWrap = $('history');
const historyList = $('history-list');
const historyLabel = $('history-label');
const historyClear = $('history-clear');
const resultTabs = $('result-tabs');
const tabAvatar = $('tab-avatar');
const tabBanner = $('tab-banner');
const siteOpenBtn = $('site-open-btn');
const siteOpenText = $('site-open-text');
const toastRoot = $('toast-root');
const qrModal = $('qr-modal');
const qrImg = $('qr-img');
const qrUrl = $('qr-url');
const qrTitle = $('qr-title');
const isMobile = window.matchMedia('(max-width: 640px)').matches;

/* ---------- Format dropdown ---------- */
const FORMAT_KEY = 'hdtiktok:format';
const FORMAT_LABELS = { original: 'Orijinal', png: 'PNG', jpeg: 'JPG', webp: 'WEBP' };
function updateFormatUI() {
  const d = t();
  const label = currentFormat === 'original'
    ? (d.formatOriginal || FORMAT_LABELS.original)
    : FORMAT_LABELS[currentFormat];
  formatCurrent.textContent = label;
  const fo = $('fmt-original'); if (fo) fo.textContent = d.formatOriginal;
  formatMenu.querySelectorAll('li').forEach(li => {
    li.classList.toggle('selected', li.dataset.value === currentFormat);
  });
}
try {
  const saved = localStorage.getItem(FORMAT_KEY);
  if (saved && FORMAT_LABELS[saved]) currentFormat = saved;
} catch {}

function openFormatMenu() {
  formatMenu.classList.add('open');
  formatTrigger.setAttribute('aria-expanded', 'true');
}
function closeFormatMenu() {
  formatMenu.classList.remove('open');
  formatTrigger.setAttribute('aria-expanded', 'false');
}
formatTrigger.addEventListener('click', (e) => {
  e.stopPropagation();
  if (formatMenu.classList.contains('open')) closeFormatMenu();
  else openFormatMenu();
});
formatMenu.querySelectorAll('li').forEach(li => {
  li.addEventListener('click', () => {
    currentFormat = li.dataset.value;
    try { localStorage.setItem(FORMAT_KEY, currentFormat); } catch {}
    updateFormatUI();
    closeFormatMenu();
    if (state.assets.avatar || state.assets.banner) {
      renderPreview();
    }
  });
});
document.addEventListener('click', (e) => {
  if (!formatMenu.classList.contains('open')) return;
  if (!formatTrigger.contains(e.target) && !formatMenu.contains(e.target)) closeFormatMenu();
});
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && formatMenu.classList.contains('open')) closeFormatMenu();
});

/* ---------- Mode switch labels + channel meta ---------- */
function applyModeLabels() {
  if (!modeSwitch) return;
  const d = t();
  const map = {
    original: [d.viewOriginal, d.hintOriginal],
    clean: [d.viewClean, d.hintClean],
    strong: [d.viewStrong, d.hintStrong],
  };
  modeSwitch.querySelectorAll('.mode-btn').forEach((btn) => {
    const entry = map[btn.dataset.mode];
    if (!entry) return;
    btn.textContent = entry[0];
    btn.title = entry[1];
  });
}
function renderChannelMeta() {
  const ch = state.channel;
  const d = t();
  verifiedBadge.hidden = !ch.verified;
  verifiedBadge.title = d.verifiedLabel;
  verifiedBadge.setAttribute('aria-label', d.verifiedLabel);
  const nick = [ch.nickname, ch.isPrivate ? d.privateLabel : ''].filter(Boolean).join(' · ');
  resultNick.hidden = !nick;
  resultNick.textContent = nick;
  const compact = new Intl.NumberFormat(lang, { notation: 'compact', maximumFractionDigits: 1 });
  const full = new Intl.NumberFormat(lang);
  const items = [[d.followersLabel, ch.followers], [d.followingLabel, ch.following], [d.likesLabel, ch.likes], [d.videosLabel, ch.videos]]
    .filter(([, v]) => v !== null && v !== undefined);
  resultStats.hidden = !items.length;
  resultStats.innerHTML = items
    .map(([label, v]) => `<div class="stat" title="${full.format(v)} ${label}"><b>${compact.format(v)}</b><span>${label}</span></div>`)
    .join('');
  resultBio.hidden = !ch.bio;
  resultBio.textContent = ch.bio || '';
}

/* ---------- i18n apply ---------- */
function applyStaticText() {
  const d = t();
  document.title = d.docTitle;
  document.documentElement.lang = lang;
  $('title').innerHTML = d.title;
  $('lede').textContent = d.lede;
  goBtn.textContent = d.goBtn;
  $('query').placeholder = d.queryPlaceholder;
  $('hint').innerHTML = `${d.hintPre}<code class="mono">${d.hintMono}</code>${d.hintPost}`;
  loadingText.textContent = d.loading;
  openBtn.textContent = d.openBtn;
  copyImgBtn.textContent = d.copyImgBtn;
  copyLinkBtn.textContent = d.copyLinkBtn;
  shareBtn.textContent = d.shareBtn;
  if (!zipBtn.dataset.busy) zipBtn.textContent = d.zipBtn;
  $('faq-title').textContent = d.faqTitle;
  for (let i = 1; i <= 4; i++) { $('faq-q' + i).textContent = d['faq' + i + 'q']; $('faq-a' + i).textContent = d['faq' + i + 'a']; }
  $('zoom-tag').textContent = d.zoomTag;
  $('footer-note').textContent = d.footerNote;
  $('footer-by').textContent = d.footerBy;
  $('theme-toggle').setAttribute('aria-label', d.themeAria);
  retryBtn.textContent = d.retryBtn;
  tabAvatar.textContent = d.tabAvatar;
  tabBanner.textContent = d.tabBanner;
  applyModeLabels();
  siteOpenText.textContent = d.siteOpenBtn;
  siteOpenBtn.setAttribute('aria-label', `${d.siteOpenBtn} — tiktok.com/@${state.slug || state.username || ''}`);
  historyLabel.textContent = d.historyLabel;
  historyClear.textContent = d.historyClear;
  qrTitle.textContent = d.qrTitle;
  if (!downloadBtn.dataset.busy) downloadBtn.textContent = d.downloadBtn;
  document.querySelectorAll('.lang-pill button').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.lang === lang);
    btn.setAttribute('aria-pressed', String(btn.dataset.lang === lang));
  });
  updateFormatUI();
  if (lastErrorState) renderError(lastErrorState.type, lastErrorState.username);
  if (state.assets.avatar) { renderSpecs(); renderChannelMeta(); }
}
function setLang(next) { lang = next; storeLang(next); applyStaticText(); }
document.querySelectorAll('.lang-pill button').forEach(btn => {
  btn.addEventListener('click', () => setLang(btn.dataset.lang));
});

/* ---------- Theme ----------
   Öncelik sırası: kullanıcının daha önce kaydettiği tercih (localStorage)
   > tarayıcı/sistem tercihi (prefers-color-scheme) > 'dark' varsayılanı.
   Kaydedilmiş bir tercih varsa sistem teması değişse bile onu ezmiyoruz. */
const THEME_KEY = 'hdtiktok-theme';
const themeMedia = window.matchMedia ? window.matchMedia('(prefers-color-scheme: light)') : null;

function getStoredTheme() {
  try { return localStorage.getItem(THEME_KEY); } catch { return null; }
}
function storeTheme(value) {
  try { localStorage.setItem(THEME_KEY, value); } catch {}
}

let themeOverridden = !!getStoredTheme();
let theme = getStoredTheme() || (themeMedia && themeMedia.matches ? 'light' : 'dark');
document.documentElement.setAttribute('data-theme', theme);

$('theme-toggle').addEventListener('click', () => {
  themeOverridden = true;
  theme = theme === 'dark' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', theme);
  storeTheme(theme);
});
if (themeMedia) {
  const onSchemeChange = (e) => {
    if (themeOverridden) return;
    theme = e.matches ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', theme);
  };
  if (themeMedia.addEventListener) themeMedia.addEventListener('change', onSchemeChange);
  else if (themeMedia.addListener) themeMedia.addListener(onSchemeChange);
}

/* ---------- Toast ---------- */
function toast(msg, kind) {
  const el = document.createElement('div');
  el.className = 'toast' + (kind === 'error' ? ' error' : '');
  el.textContent = msg;
  toastRoot.appendChild(el);
  requestAnimationFrame(() => el.classList.add('show'));
  setTimeout(() => {
    el.classList.remove('show');
    el.addEventListener('transitionend', () => el.remove(), { once: true });
  }, 2200);
}

/* ---------- History ---------- */
const HISTORY_KEY = 'hdtiktok:history';
const HISTORY_MAX = 6;
function loadHistory() {
  try { return JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]'); }
  catch { return []; }
}
function saveHistory(list) {
  try { localStorage.setItem(HISTORY_KEY, JSON.stringify(list)); } catch {}
}
function pushHistory(username) {
  if (!username) return;
  const list = loadHistory().filter(u => u.toLowerCase() !== username.toLowerCase());
  list.unshift(username);
  saveHistory(list.slice(0, HISTORY_MAX));
  renderHistory();
}
function renderHistory() {
  const list = loadHistory();
  if (!list.length) { historyWrap.hidden = true; return; }
  historyWrap.hidden = false;
  historyList.innerHTML = '';
  list.forEach(u => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'history-chip';
    b.textContent = '@' + u;
    b.addEventListener('click', () => { queryInput.value = u; run(u); });
    historyList.appendChild(b);
  });
}
historyClear.addEventListener('click', () => { saveHistory([]); renderHistory(); });

/* ---------- URL helpers ---------- */
/* Paylaşım linkleri artık #u=kullanıcı kullanıyor.
   Google hash fragment'ları ayrı sayfa saymaz → ?u= gibi
   duplicate content problemi çıkarmaz. */
function shareUrl(username) {
  const base = location.origin + location.pathname;
  if (!username) return base;
  return `${base}#u=${encodeURIComponent(username)}`;
}
/* Adres çubuğuna sadece #u=kullanıcı yazıyoruz: hash Google için ayrı sayfa
   sayılmaz (tek URL, tek sayfa) ama yenileyince / yer imine ekleyince sonuç korunur.
   replaceState hashchange tetiklemez, geçmişi de kirletmez. */
function updateUrl(username) {
  try {
    const hash = username ? `#u=${encodeURIComponent(username)}` : '';
    history.replaceState(null, '', location.pathname + location.search + hash);
  } catch {}
}
function usernameFromHash() {
  const m = location.hash.match(/^#u=([^&]+)/);
  if (!m) return null;
  try { return decodeURIComponent(m[1]); } catch { return null; }
}

/* ---------- Username extract ---------- */
function extractUsername(raw) {
  let v = (raw || '').trim();
  if (!v) return null;
  v = v.replace(/^https?:\/\//i, '').replace(/^www\./i, '').replace(/^(m\.)?tiktok\.com\//i, '').replace(/^@+/, '');
  v = v.split('?')[0].split('#')[0];
  v = v.replace(/\/+$/, '');
  v = v.split('/')[0];
  return v || null;
}

/* ---------- Proxies ---------- */
const PROXY_CACHE_KEY = 'hdtiktok:proxy';
const WORKER_URL = ((document.querySelector('meta[name="hdtiktok-worker"]') || {}).content || '').trim().replace(/\/+$/, '');
/* Görsel indirme yedeği. TikTok CDN'i normalde CORS'a açık olduğu için
   çoğu zaman hiçbirine gerek kalmaz; yine de sırayla denenir.
   corsproxy.io 2025'ten beri API anahtarı istiyor (401), bu yüzden en sonda. */
const PROXIES = [
  { id: 'allorigins', build: (url) => `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}` },
  { id: 'codetabs',   build: (url) => `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(url)}` },
  { id: 'corsproxy',  build: (url) => `https://corsproxy.io/?url=${encodeURIComponent(url)}` },
];
/* Kendi Cloudflare Worker'ın (worker/ klasörü) varsa her zaman ilk o denenir. */
const WORKER = WORKER_URL ? {
  id: 'worker',
  build: (url) => {
    const m = url.match(/^https:\/\/www\.tiktok\.com\/@([^/?#]+)/);
    return m ? `${WORKER_URL}/page?u=${encodeURIComponent(decodeURIComponent(m[1]))}` : `${WORKER_URL}/img?url=${encodeURIComponent(url)}`;
  },
} : null;
function getPreferredProxy() {
  try { return localStorage.getItem(PROXY_CACHE_KEY); } catch { return null; }
}
function setPreferredProxy(id) {
  try { localStorage.setItem(PROXY_CACHE_KEY, id); } catch {}
}
function orderedProxies() {
  const preferred = getPreferredProxy();
  const pub = preferred ? [...PROXIES].sort((a, b) => (a.id === preferred ? -1 : b.id === preferred ? 1 : 0)) : PROXIES;
  return WORKER ? [WORKER, ...pub] : pub;
}
function fetchT(url, opts = {}, ms = 9000) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), ms);
  return fetch(url, { ...opts, signal: ctrl.signal }).finally(() => clearTimeout(timer));
}
/* ---------- Profil okuyucuları ----------
   TikTok bot koruması yüzünden profil HTML'i veri merkezi IP'lerinden
   "Please wait…" (WAF) sayfası olarak dönüyor. Bu yüzden önce sayfayı
   gerçek tarayıcıyla açıp metne/JSON'a çeviren servisler denenir, sonra
   klasik HTML proxy'leri. Hepsi tarayıcıda çalışır, kendi sunucumuz yok. */
const READERS = [
  { id: 'jina',      kind: 'markdown', build: (url) => `https://r.jina.ai/${url}` },
  { id: 'microlink', kind: 'json',     build: (url) => `https://api.microlink.io/?url=${encodeURIComponent(url)}` },
];
function orderedSources(pageUrl) {
  const list = [
    ...READERS.map((r) => ({ id: r.id, kind: r.kind, url: r.build(pageUrl) })),
    ...PROXIES.map((p) => ({ id: p.id, kind: 'html', url: p.build(pageUrl) })),
  ];
  return WORKER ? [{ id: 'worker', kind: 'html', url: WORKER.build(pageUrl) }, ...list] : list;
}
/* ---------- TikTok profil sayfası ayrıştırma ----------
   Kaynak: sayfadaki #__UNIVERSAL_DATA_FOR_REHYDRATION__ JSON'u →
   __DEFAULT_SCOPE__['webapp.user-detail'].userInfo = { user, stats }.
   Eski sayfa düzeni için SIGI_STATE yedeği de denenir. */
/* PARSER START */
/* "96.6M", "1.2K", "3.4B" gibi kısa sayıları tam sayıya çevirir. */
function parseCompactNumber(value) {
  if (value === null || value === undefined) return null;
  const raw = String(value).trim().replace(/[\s,]/g, '');
  if (!raw) return null;
  const m = raw.match(/^(\d+(?:\.\d+)?)([KMB])?$/i);
  if (!m) return null;
  const units = { K: 1e3, M: 1e6, B: 1e9 };
  const n = parseFloat(m[1]) * (units[(m[2] || '').toUpperCase()] || 1);
  return Number.isFinite(n) ? Math.round(n) : null;
}
function cleanMarkdownText(value) {
  return String(value || '')
    .replace(/!\[[^\]]*\]\([^)]*\)/g, ' ')
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/[*_`~]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}
/* Jina Reader çıktısındaki ilk profil avatarını bulur.
   Önerilen hesapların görselleri "Avatar for …" alt metniyle gelir; atlanır. */
function markdownAvatarCandidates(md) {
  const seen = new Set();
  for (const m of md.matchAll(/!\[([^\]]*)\]\((https?:\/\/[^)\s]+)\)/g)) {
    const alt = m[1] || '';
    const url = m[2] || '';
    if (/avatar for/i.test(alt)) continue;
    if (!/tiktokcdn|ibytedtos|byteimg/i.test(url)) continue;
    if (/share_img|ttwstatic|origin\.image/i.test(url)) continue;
    seen.add(url);
  }
  return [...seen];
}
function markdownStat(md, label) {
  const m = md.match(new RegExp('\\*\\*([\\d.,]+\\s*[KMB]?)\\*\\*\\s*' + label, 'i'));
  return m ? parseCompactNumber(m[1]) : null;
}
/* Jina Reader (r.jina.ai) çıktısı: başlık + markdown gövde. */
function parseReaderMarkdown(md, username) {
  if (!md || typeof md !== 'string') return { status: 'blocked' };
  if (/couldn[’'`]?t find (?:this|the) account|account (?:was )?not found|user not found/i.test(md)) {
    return { status: 'notFound' };
  }
  const avatars = markdownAvatarCandidates(md);
  if (!avatars.length) return { status: 'blocked' };

  const titleLine = md.match(/^Title:\s*(.+)$/m);
  const titleMatch = titleLine && titleLine[1].match(/^(.*?)\s*\(@([^)]+)\)/);
  const heading = md.match(/^#\s+(.+?)\s*$/m);
  const userHead = md.match(/^##\s+@?([^\s#]+)\s*$/m);
  const afterMessage = md.split(/\[Message\]\([^)]*\)/i)[1] || '';
  const bio = cleanMarkdownText(afterMessage.trim().split(/\n{2,}/)[0] || '').slice(0, 240);

  return {
    status: 'ok',
    profile: {
      username: cleanMarkdownText((titleMatch && titleMatch[2]) || (userHead && userHead[1]) || username),
      nickname: cleanMarkdownText((titleMatch && titleMatch[1]) || (heading && heading[1]) || ''),
      bio,
      verified: /verified (?:account|badge)|\(verified\)/i.test(md),
      isPrivate: /this account is private|private account/i.test(md),
      /* Sayfadaki ilk görsel profildeki avatardır; sonrakiler video/LIVE
         kapağı olabilir. Sadece ilkini kullan. */
      avatars: avatars.slice(0, 1),
      followers: markdownStat(md, 'Followers'),
      following: markdownStat(md, 'Following'),
      likes: markdownStat(md, 'Likes'),
      videos: markdownStat(md, 'Videos'),
    },
  };
}
/* Microlink (api.microlink.io) çıktısı: sayfanın og:image + description'ı. */
function parseMicrolink(json, username) {
  if (!json || json.status !== 'success' || !json.data) return { status: 'blocked' };
  const d = json.data;
  const title = String(d.title || '');
  const description = String(d.description || '');
  if (/couldn[’'`]?t find (?:this|the) account|account (?:was )?not found/i.test(title + ' ' + description)) {
    return { status: 'notFound' };
  }
  const imageUrl = d.image && d.image.url ? String(d.image.url) : '';
  if (!imageUrl || !/tiktokcdn|ibytedtos|byteimg/i.test(imageUrl) || /share_img|ttwstatic/i.test(imageUrl)) {
    return { status: 'blocked' };
  }
  const tm = title.match(/^(.+?)\s*\(@([^)]+)\)\s*on TikTok/i);
  const stat = (label) => {
    const m = description.match(new RegExp('([\\d.,]+\\s*[KMB]?)\\s+' + label + '\\b', 'i'));
    return m ? parseCompactNumber(m[1]) : null;
  };
  return {
    status: 'ok',
    profile: {
      username: cleanMarkdownText((tm && tm[2]) || username),
      nickname: (tm && cleanMarkdownText(tm[1])) || '',
      bio: '',
      verified: false,
      isPrivate: /private account/i.test(description),
      avatars: [imageUrl],
      followers: stat('Followers'),
      following: stat('Following'),
      likes: stat('Likes'),
      videos: stat('Videos'),
    },
  };
}
function parseProfileHtml(html) {
  if (!html || typeof html !== 'string') return { status: 'blocked' };
  let info = null, sawScope = false;
  const m = html.match(/<script[^>]*id="__UNIVERSAL_DATA_FOR_REHYDRATION__"[^>]*>([\s\S]*?)<\/script>/);
  if (m) {
    try {
      const scope = (JSON.parse(m[1]).__DEFAULT_SCOPE__ || {})['webapp.user-detail'];
      if (scope) { sawScope = true; info = scope.userInfo || null; }
    } catch {}
  }
  if (!info || !info.user) {
    const g = html.match(/<script[^>]*id="SIGI_STATE"[^>]*>([\s\S]*?)<\/script>/);
    if (g) {
      try {
        const mod = JSON.parse(g[1]).UserModule || {};
        const key = Object.keys(mod.users || {})[0];
        if (key) { sawScope = true; info = { user: mod.users[key], stats: (mod.stats || {})[key] || {} }; }
      } catch {}
    }
  }
  const u = info && info.user;
  if (!u || !u.uniqueId) return { status: sawScope ? 'notFound' : 'blocked' };
  const st = info.stats || info.statsV2 || {};
  const num = (v) => (v === undefined || v === null || v === '' || !Number.isFinite(Number(v)) ? null : Number(v));
  return {
    status: 'ok',
    profile: {
      username: u.uniqueId,
      nickname: u.nickname || '',
      bio: u.signature || '',
      verified: !!u.verified,
      isPrivate: !!u.privateAccount,
      avatars: [...new Set([u.avatarLarger, u.avatarMedium, u.avatarThumb].filter(Boolean))],
      followers: num(st.followerCount),
      following: num(st.followingCount),
      likes: num(st.heartCount !== undefined ? st.heartCount : st.heart),
      videos: num(st.videoCount),
    },
  };
}
/* PARSER END */

/* Profili sırayla: kendi Worker'ın → Jina/Microlink okuyucuları → HTML proxy'leri.
   Okuyuculardan biri "hesap yok" derse diğeri de aynı şeyi söyleyince
   notFound kabul edilir; tek bir servisin hatası yüzünden yanlış sonuç çıkmaz. */
async function fetchProfile(username) {
  const pageUrl = `https://www.tiktok.com/@${encodeURIComponent(username)}`;
  const readerNotFound = new Set();
  let saw404 = false, sawNotFound = false, sawBlocked = false, sawRate = false, sawNetwork = false;
  for (const source of orderedSources(pageUrl)) {
    try {
      const res = await fetchT(source.url, {}, 12000);
      if (res.status === 404) { saw404 = true; continue; }
      if (res.status === 402 || res.status === 429) { sawRate = true; continue; }
      if (!res.ok) { sawBlocked = true; continue; }

      let parsed;
      if (source.kind === 'markdown') parsed = parseReaderMarkdown(await res.text(), username);
      else if (source.kind === 'json') parsed = parseMicrolink(await res.json().catch(() => null), username);
      else parsed = parseProfileHtml(await res.text());

      if (parsed.status === 'ok' && parsed.profile.avatars.length) {
        /* HTML proxy'leri görsel indirmede de kullanılıyor; çalışanı hatırla.
           Okuyucular görsel URL'si için kullanılmadığından önbelleğe alınmaz. */
        if (source.kind === 'html' && source.id !== 'worker') setPreferredProxy(source.id);
        return parsed.profile;
      }
      if (parsed.status === 'notFound') {
        sawNotFound = true;
        if (source.kind === 'markdown' || source.kind === 'json') {
          readerNotFound.add(source.id);
          /* İki bağımsız okuyucu da "yok" diyorsa HTML proxy'lerini beklemeye gerek yok. */
          if (readerNotFound.size >= READERS.length) throw makeErr('notFound');
        }
        continue;
      }
      sawBlocked = true;
    } catch (e) {
      if (e && e.type) throw e;
      sawNetwork = true;
    }
  }
  if (sawNotFound) throw makeErr('notFound');
  if (saw404) throw makeErr('notFound');
  if (sawRate && !sawBlocked) throw makeErr('rateLimit');
  if (sawBlocked) throw makeErr('blocked');
  if (sawNetwork) throw makeErr('network');
  throw makeErr('blocked');
}

/* ---------- Variants ---------- */
function stripResizeParams(url) {
  try {
    const u = new URL(url);
    ['w','h','width','height','quality','q','resize','fit','crop','format','fm']
      .forEach(k => u.searchParams.delete(k));
    return u.toString().replace(/\?$/, '');
  } catch { return url.split('?')[0]; }
}
function extractStructuredImageUrls(input) {
  const seen = new Set();
  const add = (value) => {
    if (!value || typeof value !== 'string') return;
    const clean = value.trim();
    if (!clean || clean.startsWith('data:')) return;
    try {
      const normalized = stripResizeParams(clean);
      if (normalized) seen.add(normalized);
    } catch { seen.add(clean); }
  };

  if (Array.isArray(input)) {
    input.forEach(add);
    return [...seen];
  }

  if (typeof input === 'string') {
    add(input);
    return [...seen];
  }

  if (!input || typeof input !== 'object') return [...seen];

  for (const key of ['url', 'src', 'image_url', 'original', 'fullsize', 'large', 'medium', 'small', 'thumbnail', 'cdn_url']) {
    add(input[key]);
  }

  if (Array.isArray(input.responsive_urls)) {
    input.responsive_urls.forEach(add);
  }
  if (Array.isArray(input.images)) {
    input.images.forEach((item) => {
      extractStructuredImageUrls(item).forEach((u) => seen.add(u));
    });
  }

  const srcsetStrings = [input.srcset, input.responsive];
  for (const srcset of srcsetStrings) {
    if (typeof srcset !== 'string') continue;
    for (const match of srcset.matchAll(/https?:\/\/[^\s,]+/gi)) {
      add(match[0]);
    }
  }

  return [...seen];
}
function generateVariants(rawInput) {
  const directCandidates = extractStructuredImageUrls(rawInput);
  const variants = new Set(directCandidates);

  for (const source of directCandidates) {
    if (!source) continue;
    const normalized = stripResizeParams(source);
    variants.add(normalized);
    variants.add(source);

    const suffixRx = /-(thumb|small|medium|large|fullsize|original)(\.[a-z0-9]{2,5})$/i;
    if (suffixRx.test(normalized)) {
      variants.add(normalized.replace(suffixRx, '$2'));
      variants.add(normalized.replace(suffixRx, '-fullsize$2'));
      variants.add(normalized.replace(suffixRx, '-original$2'));
      variants.add(normalized.replace(suffixRx, '-large$2'));
    }

    const prefixRx = /\/(thumb|small|medium|large)-/i;
    if (prefixRx.test(normalized)) {
      variants.add(normalized.replace(prefixRx, '/'));
      variants.add(normalized.replace(prefixRx, '/fullsize-'));
      variants.add(normalized.replace(prefixRx, '/original-'));
    }

    if (/\/conversion\//i.test(normalized)) {
      const match = normalized.match(/^(.*-)(fullsize|original)(\.[a-z0-9]+)$/i);
      if (match) {
        variants.add(match[1] + 'original' + match[3]);
        variants.add(match[1] + 'fullsize' + match[3]);
      }
      const pngAlt = normalized.replace(/\.[a-z0-9]+$/i, '.png');
      const webpAlt = normalized.replace(/\.[a-z0-9]+$/i, '.webp');
      if (pngAlt !== normalized) variants.add(pngAlt);
      if (webpAlt !== normalized) variants.add(webpAlt);
    }
  }

  return [...variants].filter(Boolean);
}
function loadImageDims(src, timeout = 6000) {
  return new Promise((resolve) => {
    const im = new Image();
    let done = false;
    const finish = (v) => { if (done) return; done = true; clearTimeout(timer); resolve(v); };
    const timer = setTimeout(() => finish(null), timeout);
    im.onload = () => finish({ w: im.naturalWidth, h: im.naturalHeight });
    im.onerror = () => finish(null);
    im.src = src;
  });
}
const variantLimiter = createLimiter(4);
async function pickBestVariant(rawInput) {
  const direct = extractStructuredImageUrls(rawInput);
  const alreadyTopTier = direct.length === 1 && /-(fullsize|original)\.[a-z0-9]{2,5}$/i.test(direct[0]);
  const variants = alreadyTopTier ? direct : generateVariants(rawInput);
  const fallbackUrl = typeof rawInput === 'string' ? rawInput : rawInput && (rawInput.url || rawInput.src || rawInput.image_url || '');
  const results = await Promise.all(
    variants.map(url => variantLimiter(async () => {
      const dims = await loadImageDims(url);
      if (!dims || !dims.w || !dims.h) return null;
      return { url, w: dims.w, h: dims.h, area: dims.w * dims.h };
    }))
  );
  const valid = results.filter(Boolean).sort((a, b) => b.area - a.area);
  const winner = valid[0];
  if (!winner) return { url: fallbackUrl, w: 0, h: 0, isHighest: false };
  return { ...winner, isHighest: winner.url !== fallbackUrl };
}

/* TikTok avatar URL'leri imzalı (x-expires / x-signature): URL'yi değiştiremeyiz,
   sadece verilen adaylar (Larger / Medium / Thumb) ölçülür, en büyüğü seçilir. */
async function pickBestAvatar(urls) {
  const results = await Promise.all(urls.map((url) => variantLimiter(async () => {
    const dims = await loadImageDims(url);
    return dims && dims.w && dims.h ? { url, w: dims.w, h: dims.h, area: dims.w * dims.h } : null;
  })));
  const best = results.filter(Boolean).sort((a, b) => b.area - a.area)[0];
  if (!best) return { url: urls[0], w: 0, h: 0, isHighest: false };
  return { ...best, isHighest: best.url === urls[0] };
}

/* ---------- Blob fetch + cache ---------- */
const blobCache = new Map();
async function sniffImage(blob) {
  if (!blob || blob.size < 12) return null;
  try {
    const b = new Uint8Array(await blob.slice(0, 12).arrayBuffer());
    const ascii = (s, e) => String.fromCharCode(...b.slice(s, e));
    if (b[0] === 0xFF && b[1] === 0xD8 && b[2] === 0xFF) return 'image/jpeg';
    if (b[0] === 0x89 && ascii(1, 4) === 'PNG') return 'image/png';
    if (ascii(0, 3) === 'GIF') return 'image/gif';
    if (ascii(0, 4) === 'RIFF' && ascii(8, 12) === 'WEBP') return 'image/webp';
    if (ascii(4, 8) === 'ftyp') {
      const brand = ascii(8, 12);
      if (brand === 'avif' || brand === 'avis') return 'image/avif';
      if (brand.startsWith('he')) return 'image/heic';
    }
    return null;
  } catch { return null; }
}
/* MIME tipi gerçek baytlardan belirlenir; proxy'ler yanlış Content-Type
   döndürebildiği için blob.type'a güvenmiyoruz. */
async function normalizeImageBlob(b) {
  const mime = await sniffImage(b);
  if (!mime) return null;
  return b.type === mime ? b : new Blob([b], { type: mime });
}
async function fetchImageBlob(url) {
  if (blobCache.has(url)) return blobCache.get(url);
  const promise = (async () => {
    try {
      const r = await fetchT(url, { mode: 'cors' }, 12000);
      if (r.ok) {
        const b = await normalizeImageBlob(await r.blob());
        if (b) return b;
      }
    } catch {}
    for (const proxy of orderedProxies()) {
      try {
        const r = await fetchT(proxy.build(url), {}, 12000);
        if (!r.ok) continue;
        const b = await normalizeImageBlob(await r.blob());
        if (b) { setPreferredProxy(proxy.id); return b; }
      } catch {}
    }
    throw makeErr('network');
  })();
  blobCache.set(url, promise);
  try { return await promise; }
  catch (e) { blobCache.delete(url); throw e; }
}

/* ---------- Convert ---------- */
function blobToImage(blob) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(blob);
    const img = new Image();
    img.onload = () => { URL.revokeObjectURL(url); resolve(img); };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('load failed')); };
    img.src = url;
  });
}
/* Firefox güvenilirliği: eğer blob zaten hedef formattaysa
   canvas'a hiç girmeden direkt blob'u döndür. */
async function convertImage(blob, format, quality = 0.95) {
  if (format === 'original') return blob;

  const currentType = (blob.type || '').toLowerCase();
  const targetType = format === 'jpeg' ? 'image/jpeg' : `image/${format}`;

  if (currentType === targetType) return blob;
  if (format === 'jpeg' && currentType === 'image/jpg') return blob;

  const img = await blobToImage(blob);
  const canvas = document.createElement('canvas');
  canvas.width = img.naturalWidth;
  canvas.height = img.naturalHeight;
  const ctx = canvas.getContext('2d');
  if (format === 'jpeg') {
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }
  ctx.drawImage(img, 0, 0);

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (b) => {
        if (!b) { reject(new Error('toBlob failed')); return; }
        if (b.type !== targetType) {
          b = new Blob([b], { type: targetType });
        }
        resolve(b);
      },
      targetType,
      format === 'png' ? undefined : quality
    );
  });
}

/* ---------- Helpers ---------- */
function formatBytes(bytes) {
  if (!bytes && bytes !== 0) return null;
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return Math.round(bytes / 1024) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}
function extFromUrl(url) {
  try {
    const clean = url.split('?')[0];
    const m = clean.match(/\.([a-z0-9]{2,5})$/i);
    return m ? m[1].toLowerCase() : 'webp';
  } catch { return 'webp'; }
}
function extFromBlob(blob, fallback) {
  const map = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp', 'image/gif': 'gif', 'image/avif': 'avif', 'image/heic': 'heic' };
  return (blob && map[blob.type]) || fallback || 'webp';
}
function extForFormat(fmt, fallback) {
  if (fmt === 'png') return 'png';
  if (fmt === 'jpeg') return 'jpg';
  if (fmt === 'webp') return 'webp';
  return fallback || 'webp';
}
function getSafeFilename(baseName, mode, ext, tab) {
  const clean = String(baseName || 'tiktok').toLowerCase().replace(/[^a-z0-9._-]+/gi, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
  const kind = mode === 'clean' || mode === 'strong' ? mode : 'original';
  const part = tab === 'banner' ? '-banner' : '';
  return `${clean}${part}-${kind}.${ext || 'png'}`;
}
function pngChunk(type, data) {
  const typeBytes = new TextEncoder().encode(type);
  const chunk = new Uint8Array(12 + data.length);
  const view = new DataView(chunk.buffer);
  view.setUint32(0, data.length);
  chunk.set(typeBytes, 4);
  chunk.set(data, 8);

  let crc = 0xffffffff;
  for (let i = 4; i < 8 + data.length; i++) {
    crc ^= chunk[i];
    for (let bit = 0; bit < 8; bit++) crc = (crc >>> 1) ^ (crc & 1 ? 0xedb88320 : 0);
  }
  view.setUint32(8 + data.length, (crc ^ 0xffffffff) >>> 0);
  return chunk;
}
async function addPngMetadata(blob, username) {
  const bytes = new Uint8Array(await blob.arrayBuffer());
  const signature = [137, 80, 78, 71, 13, 10, 26, 10];
  if (!signature.every((byte, index) => bytes[index] === byte)) return blob;

  const metadata = {
    Title: `${username} TikTok profile image`,
    Subject: 'TikTok profile image',
    Description: `TikTok profile image of ${username}, exported with hdtiktok.`,
    Software: 'hdtiktok',
    Source: 'TikTok',
    GitHub: 'https://github.com/Wek1d/hdtiktok',
    Keywords: 'TikTok; profile image; hdtiktok',
    Tags: 'TikTok; profile image; hdtiktok',
    Comment: 'Metadata added by hdtiktok during export.',
  };
  const chunks = Object.entries(metadata).map(([keyword, value]) => {
    const latin1 = v => String(v).replace(/[^\x00-\xFF]/g, '?');
    const keyBytes = Uint8Array.from(latin1(keyword), char => char.charCodeAt(0));
    const textBytes = Uint8Array.from(latin1(value), char => char.charCodeAt(0));
    const data = new Uint8Array(keyBytes.length + 1 + textBytes.length);
    data.set(keyBytes);
    data.set(textBytes, keyBytes.length + 1);
    return pngChunk('tEXt', data);
  });
  const escapeXml = value => String(value).replace(/[&<>"']/g, char => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;',
  })[char]);
  const safeUsername = escapeXml(username || 'TikTok user');
  const xmp = `<?xpacket begin="\uFEFF" id="W5M0MpCehiHzreSzNTczkc9d"?><x:xmpmeta xmlns:x="adobe:ns:meta/"><rdf:RDF xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#"><rdf:Description rdf:about="" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:xmp="http://ns.adobe.com/xap/1.0/" xmlns:xmpRights="http://ns.adobe.com/xap/1.0/rights/" xmlns:photoshop="http://ns.adobe.com/photoshop/1.0/"><dc:title><rdf:Alt><rdf:li xml:lang="x-default">${safeUsername} TikTok profile image</rdf:li></rdf:Alt></dc:title><dc:description><rdf:Alt><rdf:li xml:lang="x-default">TikTok profile image of ${safeUsername}, exported with hdtiktok.</rdf:li></rdf:Alt></dc:description><dc:subject><rdf:Bag><rdf:li>TikTok</rdf:li><rdf:li>profile image</rdf:li><rdf:li>hdtiktok</rdf:li></rdf:Bag></dc:subject><xmp:CreatorTool>hdtiktok</xmp:CreatorTool><xmpRights:WebStatement>https://github.com/Wek1d/hdtiktok</xmpRights:WebStatement><photoshop:Source>TikTok</photoshop:Source><photoshop:Credit>hdtiktok</photoshop:Credit></rdf:Description></rdf:RDF></x:xmpmeta><?xpacket end="w"?>`;
  const encoder = new TextEncoder();
  const keyword = encoder.encode('XML:com.adobe.xmp');
  const xmpBytes = encoder.encode(xmp);
  const internationalText = new Uint8Array(keyword.length + 5 + xmpBytes.length);
  internationalText.set(keyword);
  internationalText.set(xmpBytes, keyword.length + 5);
  chunks.push(pngChunk('iTXt', internationalText));

  let offset = 8;
  while (offset + 12 <= bytes.length) {
    const length = new DataView(bytes.buffer, bytes.byteOffset + offset, 4).getUint32(0);
    if (String.fromCharCode(...bytes.subarray(offset + 4, offset + 8)) === 'IEND') break;
    offset += length + 12;
  }
  if (offset + 12 > bytes.length) return blob;

  const result = new Uint8Array(bytes.length + chunks.reduce((sum, chunk) => sum + chunk.length, 0));
  result.set(bytes.subarray(0, offset), 0);
  let writeOffset = offset;
  for (const chunk of chunks) {
    result.set(chunk, writeOffset);
    writeOffset += chunk.length;
  }
  result.set(bytes.subarray(offset), writeOffset);
  return new Blob([result], { type: 'image/png' });
}
/* ---------- Upscale ----------
   Tarayıcının bilinear büyütmesi yerine Lanczos-3 yeniden örnekleme.
   - clean : sadece 2× Lanczos. Renk/kontrast filtresi YOK.
   - strong: 2× → hafif keskinleştirme → 2× → keskinleştirme (kademeli büyütme
             tek seferde 4×'e göre daha net kenar verir). Keskinleştirme sadece
             parlaklık (luma) kanalında ve eşikli: cilt gibi düz alanlardaki
             gürültü büyütülmez, renkler kaymaz. */
const UPSCALE_PRESETS = {
  clean: [{ scale: 2 }],
  strong: [
    { scale: 2, sharpen: { amount: 0.40, sigma: 0.9, threshold: 3 } },
    { scale: 2, sharpen: { amount: 0.55, sigma: 1.4, threshold: 4 } },
  ],
};
const MAX_OUTPUT_PIXELS = 16e6;

/* Ağır işlem (Lanczos + keskinleştirme) ayrı thread'de çalışır: sayfa donmaz.
   Kaynak string olarak tutuluyor; build'de değişken isimleri küçültülse de bozulmaz. */
const UPSCALE_WORKER_SRC = `
function lanczos3(x){if(x===0)return 1;if(x<=-3||x>=3)return 0;var px=Math.PI*x;return(3*Math.sin(px)*Math.sin(px/3))/(px*px);}
function buildW(srcLen,dstLen){var taps=6,ratio=dstLen/srcLen,starts=new Int32Array(dstLen),weights=new Float32Array(dstLen*taps);
for(var i=0;i<dstLen;i++){var c=(i+0.5)/ratio-0.5,st=Math.floor(c)-2,sum=0;
for(var k=0;k<taps;k++){var w=lanczos3(c-(st+k));weights[i*taps+k]=w;sum+=w;}
for(var k2=0;k2<taps;k2++)weights[i*taps+k2]/=sum;starts[i]=st;}
return{starts:starts,weights:weights,taps:taps};}
function resize(data,sw,sh,dw,dh){var hx=buildW(sw,dw),tmp=new Float32Array(dw*sh*4);
for(var y=0;y<sh;y++){var rowIn=y*sw;for(var x=0;x<dw;x++){var s0=hx.starts[x],r=0,g=0,b=0,a=0;
for(var k=0;k<hx.taps;k++){var sx=Math.min(sw-1,Math.max(0,s0+k)),w=hx.weights[x*hx.taps+k],i=(rowIn+sx)*4;
r+=data[i]*w;g+=data[i+1]*w;b+=data[i+2]*w;a+=data[i+3]*w;}
var o=(y*dw+x)*4;tmp[o]=r;tmp[o+1]=g;tmp[o+2]=b;tmp[o+3]=a;}}
var vy=buildW(sh,dh),out=new Float32Array(dw*dh*4);
for(var y2=0;y2<dh;y2++){var s1=vy.starts[y2];for(var x2=0;x2<dw;x2++){var r2=0,g2=0,b2=0,a2=0;
for(var k3=0;k3<vy.taps;k3++){var sy=Math.min(sh-1,Math.max(0,s1+k3)),w2=vy.weights[y2*vy.taps+k3],i2=(sy*dw+x2)*4;
r2+=tmp[i2]*w2;g2+=tmp[i2+1]*w2;b2+=tmp[i2+2]*w2;a2+=tmp[i2+3]*w2;}
var o2=(y2*dw+x2)*4,al=Math.min(255,Math.max(0,a2));
out[o2]=Math.min(al,Math.max(0,r2));out[o2+1]=Math.min(al,Math.max(0,g2));out[o2+2]=Math.min(al,Math.max(0,b2));out[o2+3]=al;}}
return out;}
function blur(src,w,h,sigma){var r=Math.max(1,Math.ceil(sigma*3)),kernel=new Float32Array(2*r+1),sum=0;
for(var i=-r;i<=r;i++){var v=Math.exp(-(i*i)/(2*sigma*sigma));kernel[i+r]=v;sum+=v;}
for(var j=0;j<kernel.length;j++)kernel[j]/=sum;
var tmp=new Float32Array(w*h),out=new Float32Array(w*h);
for(var y=0;y<h;y++)for(var x=0;x<w;x++){var acc=0;for(var q=-r;q<=r;q++)acc+=src[y*w+Math.min(w-1,Math.max(0,x+q))]*kernel[q+r];tmp[y*w+x]=acc;}
for(var y2=0;y2<h;y2++)for(var x2=0;x2<w;x2++){var acc2=0;for(var q2=-r;q2<=r;q2++)acc2+=tmp[Math.min(h-1,Math.max(0,y2+q2))*w+x2]*kernel[q2+r];out[y2*w+x2]=acc2;}
return out;}
function sharpen(data,w,h,p){var n=w*h,luma=new Float32Array(n);
for(var i=0;i<n;i++)luma[i]=0.299*data[i*4]+0.587*data[i*4+1]+0.114*data[i*4+2];
var bl=blur(luma,w,h,p.sigma);
for(var j=0;j<n;j++){var diff=luma[j]-bl[j],ad=Math.abs(diff);if(ad<=p.threshold)continue;
diff=Math.sign(diff)*(ad-p.threshold);var delta=Math.max(-40,Math.min(40,diff*p.amount)),a=data[j*4+3],o=j*4;
data[o]=Math.min(a,Math.max(0,data[o]+delta));data[o+1]=Math.min(a,Math.max(0,data[o+1]+delta));data[o+2]=Math.min(a,Math.max(0,data[o+2]+delta));}}
self.onmessage=function(e){try{var m=e.data,w=m.w,h=m.h,px=new Uint8ClampedArray(m.buf),data=new Float32Array(w*h*4);
for(var i=0;i<w*h;i++){var a=px[i*4+3]/255;data[i*4]=px[i*4]*a;data[i*4+1]=px[i*4+1]*a;data[i*4+2]=px[i*4+2]*a;data[i*4+3]=px[i*4+3];}
var ran=0,scale=1;
for(var s=0;s<m.stages.length;s++){var st=m.stages[s],dw=Math.round(w*st.scale),dh=Math.round(h*st.scale);
if(dw*dh>m.max)break;data=resize(data,w,h,dw,dh);w=dw;h=dh;scale*=st.scale;if(st.sharpen)sharpen(data,w,h,st.sharpen);ran++;
self.postMessage({progress:ran/m.stages.length});}
if(!ran){self.postMessage({error:'too large'});return;}
var out=new Uint8ClampedArray(w*h*4);
for(var k=0;k<w*h;k++){var al=data[k*4+3],f=al>0?255/al:0;out[k*4]=data[k*4]*f;out[k*4+1]=data[k*4+1]*f;out[k*4+2]=data[k*4+2]*f;out[k*4+3]=al;}
self.postMessage({buf:out.buffer,w:w,h:h,scale:scale},[out.buffer]);}catch(err){self.postMessage({error:String(err&&err.message||err)});}};
`;

function runUpscaleWorker(buf, w, h, stages, onProgress) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(new Blob([UPSCALE_WORKER_SRC], { type: 'text/javascript' }));
    let worker;
    try { worker = new Worker(url); } catch (e) { URL.revokeObjectURL(url); reject(e); return; }
    const done = () => { worker.terminate(); URL.revokeObjectURL(url); };
    worker.onmessage = (ev) => {
      const m = ev.data;
      if (m.progress !== undefined) { if (onProgress) onProgress(m.progress); return; }
      done();
      if (m.error) reject(new Error(m.error)); else resolve(m);
    };
    worker.onerror = (ev) => { done(); reject(new Error(ev.message || 'worker failed')); };
    worker.postMessage({ buf, w, h, stages, max: MAX_OUTPUT_PIXELS }, [buf]);
  });
}
async function upscaleBlob(blob, mode, onProgress) {
  const stages = UPSCALE_PRESETS[mode];
  if (!stages) throw new Error('unknown mode');
  const img = await blobToImage(blob);
  const w0 = img.naturalWidth, h0 = img.naturalHeight;
  const canvas = document.createElement('canvas');
  canvas.width = w0; canvas.height = h0;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) throw new Error('canvas not available');
  ctx.drawImage(img, 0, 0);
  const px = ctx.getImageData(0, 0, w0, h0);
  const res = await runUpscaleWorker(px.data.buffer, w0, h0, stages, onProgress);
  const outCanvas = document.createElement('canvas');
  outCanvas.width = res.w; outCanvas.height = res.h;
  outCanvas.getContext('2d').putImageData(new ImageData(new Uint8ClampedArray(res.buf), res.w, res.h), 0, 0);
  const out = await new Promise((resolve, reject) =>
    outCanvas.toBlob((b) => (b ? resolve(b) : reject(new Error('upscale failed'))), 'image/png'));
  return { blob: out, w: res.w, h: res.h, scale: res.scale };
}
async function ensureVariant(asset, mode, onProgress) {
  asset.variants = asset.variants || {};
  if (asset.variants[mode]) return asset.variants[mode];
  const source = await ensureBlob(asset);
  const r = await upscaleBlob(source, mode, onProgress);
  asset.variants[mode] = { url: URL.createObjectURL(r.blob), blob: r.blob, w: r.w, h: r.h, size: r.blob.size, scale: r.scale };
  return asset.variants[mode];
}
/* Aktif görünüm: orijinal dosya ya da yükseltilmiş varyant */
function getView(asset) {
  const mode = asset.displayMode || 'original';
  const v = mode !== 'original' && asset.variants && asset.variants[mode];
  if (v) return { mode, url: v.url, blob: v.blob, w: v.w, h: v.h, ext: 'png', scale: v.scale };
  return { mode: 'original', url: asset.url, blob: asset.blob, w: asset.w, h: asset.h, ext: asset.ext || extFromUrl(asset.url) };
}
async function getViewBlob(asset) {
  const view = getView(asset);
  return view.blob || ensureBlob(asset);
}
/* ---------- Download ---------- */
/* Not: Firefox, belirli görsel türlerini (özellikle webp) blob: URL üzerinden
   `download` özniteliğiyle indirirken, dosyayı diske kaydetmenin yanında
   kendi görüntüleyicisinde ayrı bir sekmede de açabiliyor. Bu, MIME tipinden
   (octet-stream dahil) ve `blob:`/`data:` URI seçiminden bağımsız, Firefox'un
   kendi içerik-önizleme davranışı; sayfa tarafında güvenilir biçimde
   engellenemiyor. İndirme yine de doğru dosyayı, doğru adla ve orijinal
   baytlarla diske kaydediyor — ekstra sekme sadece görsel bir önizleme. */
function triggerDownload(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.style.cssText = 'position:fixed;top:-9999px;left:-9999px;opacity:0;pointer-events:none;';
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    if (a.parentNode) a.parentNode.removeChild(a);
    URL.revokeObjectURL(url);
  }, 10000);
}
function ensureBlob(asset) {
  if (asset.blob) return Promise.resolve(asset.blob);
  return fetchImageBlob(asset.url).then(b => { asset.blob = b; return b; });
}
/* Tek görseli (aktif mod + seçili format) indirilecek hale getirir */
async function exportAsset(key) {
  const asset = state.assets[key];
  const view = getView(asset);
  const sourceBlob = await getViewBlob(asset);
  let outBlob = sourceBlob;
  /* "Orijinal": TikTok'tan gelen baytlar olduğu gibi, gerçek uzantısıyla iner. */
  let ext = view.mode === 'original' ? extFromBlob(sourceBlob, view.ext) : 'png';
  if (currentFormat !== 'original') {
    outBlob = await convertImage(sourceBlob, currentFormat);
    ext = extForFormat(currentFormat, ext);
  }
  if (outBlob.type === 'image/png') outBlob = await addPngMetadata(outBlob, state.username);
  return { blob: outBlob, filename: getSafeFilename(state.username, view.mode, ext, key) };
}
async function handleDownload() {
  const asset = state.assets[state.activeTab];
  if (!asset) return;
  downloadBtn.disabled = true;
  downloadBtn.dataset.busy = '1';
  const originalLabel = downloadBtn.textContent;
  downloadBtn.textContent = t().preparing;
  try {
    const { blob, filename } = await exportAsset(state.activeTab);
    triggerDownload(new Blob([blob], { type: 'application/octet-stream' }), filename);
    toast(t().toastDownloaded);
  } catch {
    toast(t().toastDownloadFailed, 'error');
  } finally {
    downloadBtn.disabled = false;
    delete downloadBtn.dataset.busy;
    downloadBtn.textContent = originalLabel;
  }
}

/* ---------- ZIP (store, sıkıştırmasız: görseller zaten sıkışık) ---------- */
let crcTable = null;
function crc32(bytes) {
  if (!crcTable) {
    crcTable = new Uint32Array(256);
    for (let n = 0; n < 256; n++) {
      let c = n;
      for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
      crcTable[n] = c >>> 0;
    }
  }
  let crc = 0xffffffff;
  for (let i = 0; i < bytes.length; i++) crc = crcTable[(crc ^ bytes[i]) & 0xff] ^ (crc >>> 8);
  return (crc ^ 0xffffffff) >>> 0;
}
async function buildZip(files) {
  const enc = new TextEncoder();
  const now = new Date();
  const dosTime = (now.getHours() << 11) | (now.getMinutes() << 5) | (now.getSeconds() >> 1);
  const dosDate = ((now.getFullYear() - 1980) << 9) | ((now.getMonth() + 1) << 5) | now.getDate();
  const parts = [], central = [];
  let offset = 0;
  for (const f of files) {
    const data = new Uint8Array(await f.blob.arrayBuffer());
    const name = enc.encode(f.name);
    const crc = crc32(data);
    const lh = new DataView(new ArrayBuffer(30));
    lh.setUint32(0, 0x04034b50, true); lh.setUint16(4, 20, true); lh.setUint16(6, 0x0800, true);
    lh.setUint16(8, 0, true); lh.setUint16(10, dosTime, true); lh.setUint16(12, dosDate, true);
    lh.setUint32(14, crc, true); lh.setUint32(18, data.length, true); lh.setUint32(22, data.length, true);
    lh.setUint16(26, name.length, true); lh.setUint16(28, 0, true);
    parts.push(new Uint8Array(lh.buffer), name, data);
    const ch = new DataView(new ArrayBuffer(46));
    ch.setUint32(0, 0x02014b50, true); ch.setUint16(4, 20, true); ch.setUint16(6, 20, true);
    ch.setUint16(8, 0x0800, true); ch.setUint16(10, 0, true); ch.setUint16(12, dosTime, true);
    ch.setUint16(14, dosDate, true); ch.setUint32(16, crc, true); ch.setUint32(20, data.length, true);
    ch.setUint32(24, data.length, true); ch.setUint16(28, name.length, true); ch.setUint32(42, offset, true);
    central.push(new Uint8Array(ch.buffer), name);
    offset += 30 + name.length + data.length;
  }
  const centralSize = central.reduce((n, c) => n + c.length, 0);
  const end = new DataView(new ArrayBuffer(22));
  end.setUint32(0, 0x06054b50, true); end.setUint16(8, files.length, true); end.setUint16(10, files.length, true);
  end.setUint32(12, centralSize, true); end.setUint32(16, offset, true);
  return new Blob([...parts, ...central, new Uint8Array(end.buffer)], { type: 'application/zip' });
}
async function handleZip() {
  const keys = ['avatar', 'banner'].filter((k) => state.assets[k]);
  if (!keys.length) return;
  zipBtn.disabled = true;
  zipBtn.dataset.busy = '1';
  zipBtn.textContent = t().zipPreparing;
  try {
    const files = [];
    for (const k of keys) {
      const { blob, filename } = await exportAsset(k);
      files.push({ name: filename, blob });
    }
    const zip = await buildZip(files);
    triggerDownload(zip, `${getSafeFilename(state.username, 'original', 'zip', '').replace('-original', '')}`);
    toast(t().toastZip);
  } catch {
    toast(t().toastDownloadFailed, 'error');
  } finally {
    zipBtn.disabled = false;
    delete zipBtn.dataset.busy;
    zipBtn.textContent = t().zipBtn;
  }
}

/* ---------- Renk paleti (avatar'dan baskın renkler) ---------- */
async function extractPalette(blob, count = 5) {
  const img = await blobToImage(blob);
  const S = 56;
  const k = Math.min(1, S / Math.max(img.naturalWidth, img.naturalHeight));
  const cw = Math.max(1, Math.round(img.naturalWidth * k)), ch = Math.max(1, Math.round(img.naturalHeight * k));
  const c = document.createElement('canvas');
  c.width = cw; c.height = ch;
  const ctx = c.getContext('2d', { willReadFrequently: true });
  ctx.drawImage(img, 0, 0, cw, ch);
  const px = ctx.getImageData(0, 0, cw, ch).data;
  const buckets = new Map();
  for (let i = 0; i < px.length; i += 4) {
    if (px[i + 3] < 128) continue;
    const key = ((px[i] >> 4) << 8) | ((px[i + 1] >> 4) << 4) | (px[i + 2] >> 4);
    const b = buckets.get(key) || { n: 0, r: 0, g: 0, b: 0 };
    b.n++; b.r += px[i]; b.g += px[i + 1]; b.b += px[i + 2];
    buckets.set(key, b);
  }
  const sorted = [...buckets.values()].sort((a, b) => b.n - a.n)
    .map((b) => [Math.round(b.r / b.n), Math.round(b.g / b.n), Math.round(b.b / b.n)]);
  const picked = [];
  for (const col of sorted) {
    if (picked.every((p) => Math.hypot(p[0] - col[0], p[1] - col[1], p[2] - col[2]) > 52)) picked.push(col);
    if (picked.length >= count) break;
  }
  return picked.map(([r, g, b]) => '#' + [r, g, b].map((v) => v.toString(16).padStart(2, '0')).join(''));
}
async function renderPalette() {
  const key = state.activeTab;
  const asset = state.assets[key];
  paletteEl.hidden = true;
  if (!asset) return;
  try {
    if (!asset.palette) asset.palette = await extractPalette(await ensureBlob(asset));
    if (state.assets[state.activeTab] !== asset || !asset.palette.length) return;
    paletteEl.innerHTML = '';
    asset.palette.forEach((hex) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'swatch';
      b.style.background = hex;
      b.title = `${hex} — ${t().paletteTitle}`;
      b.setAttribute('aria-label', b.title);
      b.addEventListener('click', async () => {
        try { await navigator.clipboard.writeText(hex); toast(t().toastColorCopied(hex)); }
        catch { toast(t().toastCopyFailed, 'error'); }
      });
      paletteEl.appendChild(b);
    });
    paletteEl.hidden = false;
  } catch { paletteEl.hidden = true; }
}

/* ---------- Copy / Share / QR ---------- */

/* Görseli panoya PNG olarak kopyala */
async function handleCopyImage() {
  const asset = state.assets[state.activeTab];
  if (!asset) return;
  try {
    if (!navigator.clipboard || !window.ClipboardItem) throw new Error('unsupported');
    let blob = await getViewBlob(asset);
    if (blob.type !== 'image/png') blob = await convertImage(blob, 'png');
    await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
    toast(t().toastCopied);
  } catch { toast(t().toastCopyFailed, 'error'); }
}

/* SİTE linkini kopyala: https://wek1d.github.io/hdtiktok/#u=kullanici */
async function handleCopyLink() {
  try {
    const url = shareUrl(state.username);
    await navigator.clipboard.writeText(url);
    toast(t().toastLinkCopied);
  } catch { toast(t().toastCopyFailed, 'error'); }
}

/* Paylaş: öncelikle site linkini paylaş (promosyon için),
   başarısız olursa / desteklenmezse görsel dosyasını paylaş. */
async function handleShare() {
  const url = shareUrl(state.username);
  const title = t().shareTitle(state.username);
  const text = t().shareText(state.username);

  try {
    if (navigator.share) {
      try {
        await navigator.share({ title, text, url });
        return;
      } catch (e) {
        if (e && e.name === 'AbortError') return;
      }
      const asset = state.assets[state.activeTab];
      if (asset && navigator.canShare) {
        const view = getView(asset);
        const blob = await getViewBlob(asset);
        const ext = view.mode === 'original' ? extFromBlob(blob, view.ext) : 'png';
        const file = new File([blob], `${state.username}-${state.activeTab}.${ext}`,
          { type: blob.type || 'image/webp' });
        if (navigator.canShare({ files: [file] })) {
          await navigator.share({ files: [file], title, text });
          return;
        }
      }
      await navigator.clipboard.writeText(url);
      toast(t().toastLinkCopied);
      return;
    }
    await navigator.clipboard.writeText(url);
    toast(t().toastLinkCopied);
  } catch (e) {
    if (e && e.name === 'AbortError') return;
    toast(t().toastNoShare, 'error');
  }
}

function handleQr() {
  const url = shareUrl(state.username);
  qrImg.src = `https://api.qrserver.com/v1/create-qr-code/?size=480x480&margin=10&bgcolor=ffffff&color=000000&data=${encodeURIComponent(url)}`;
  qrUrl.textContent = url;
  qrModal.hidden = false;
  requestAnimationFrame(() => qrModal.classList.add('open'));
}
function closeQr() {
  qrModal.classList.remove('open');
  qrModal.addEventListener('transitionend', () => { qrModal.hidden = true; }, { once: true });
  setTimeout(() => { if (!qrModal.classList.contains('open')) qrModal.hidden = true; }, 450);
}
qrImg.addEventListener('error', () => { qrImg.style.visibility = 'hidden'; });
qrImg.addEventListener('load', () => { qrImg.style.visibility = ''; });
qrUrl.addEventListener('click', async () => {
  try { await navigator.clipboard.writeText(qrUrl.textContent); toast(t().toastQrCopied); } catch {}
});
qrModal.addEventListener('click', (e) => {
  if (e.target === qrModal || e.target.classList.contains('qr-card')) closeQr();
});
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && !qrModal.hidden) closeQr();
});

/* ---------- Tabs ---------- */
function getActiveAsset() { return state.assets[state.activeTab]; }
function setActiveTab(tab) {
  state.activeTab = tab;
  tabAvatar.classList.toggle('active', tab === 'avatar');
  tabBanner.classList.toggle('active', tab === 'banner');
  renderPreview();
}
tabAvatar.addEventListener('click', () => setActiveTab('avatar'));
tabBanner.addEventListener('click', () => setActiveTab('banner'));

function renderPreview() {
  const asset = state.assets[state.activeTab];
  if (!asset) return;
  const view = getView(asset);
  const currentUrl = view.url;
  previewFrame.classList.remove('loaded');
  previewImg.classList.remove('loaded');
  resultCard.setAttribute('data-kind', state.activeTab);
  if (asset.w && asset.h) previewFrame.style.setProperty('--ar', `${asset.w} / ${asset.h}`);
  else previewFrame.style.removeProperty('--ar');
  previewImg.alt = `@${state.username} — ${state.activeTab}`;
  previewImg.src = currentUrl;
  previewImg.onload = () => {
    previewImg.classList.add('loaded');
    previewFrame.classList.add('loaded');
  };
  if (previewImg.complete && previewImg.naturalWidth) {
    previewImg.classList.add('loaded');
    previewFrame.classList.add('loaded');
  }
  if (modeSwitch) {
    modeSwitch.hidden = false;
    modeSwitch.querySelectorAll('.mode-btn').forEach((btn) => {
      btn.classList.toggle('active', btn.dataset.mode === view.mode);
    });
  }
  renderSpecs();
  renderPalette();
}
async function getOutputMeta(asset) {
  const view = getView(asset);
  const sourceBlob = await getViewBlob(asset);
  let ext = view.mode === 'original' ? extFromBlob(sourceBlob, view.ext) : 'png';
  let size = sourceBlob.size;
  if (currentFormat !== 'original') {
    try {
      const outputBlob = await convertImage(sourceBlob, currentFormat);
      size = outputBlob.size;
      ext = extForFormat(currentFormat, ext);
    } catch {}
  }
  return { w: view.w, h: view.h, size, ext };
}
async function renderSpecs() {
  const asset = state.assets[state.activeTab];
  if (!asset) { resultSpecs.textContent = ''; return; }
  try {
    const meta = await getOutputMeta(asset);
    if (state.assets[state.activeTab] !== asset) return;
    const parts = [];
    if (meta.w && meta.h) parts.push(`${meta.w} × ${meta.h}px`);
    else parts.push(t().original);
    parts.push((meta.ext || 'WEBP').toUpperCase());
    if (meta.size) parts.push(formatBytes(meta.size));
    const html = parts.map(p => `<span>${p}</span>`).join('<span class="sep">·</span>');
    const mode = getView(asset).mode;
    const view = getView(asset);
    const base = (mode === 'strong' ? t().viewStrong : mode === 'clean' ? t().viewClean : t().viewOriginal).replace(/\s*×\d+/, '');
    const badgeText = mode === 'original' ? base : `${base} ×${view.scale || (mode === 'strong' ? 4 : 2)}`;
    resultSpecs.innerHTML = html + `<span class="sep">·</span><span class="badge">${badgeText}</span>`;
  } catch {
    resultSpecs.textContent = '';
  }
}

/* ---------- Lightbox ---------- */
function openLightbox(src) {
  const overlay = document.createElement('div');
  overlay.className = 'lightbox';
  overlay.setAttribute('role', 'dialog');
  overlay.setAttribute('aria-modal', 'true');
  const lstage = document.createElement('div');
  lstage.className = 'lb-stage';
  const closeBtn = document.createElement('button');
  closeBtn.className = 'lb-close';
  closeBtn.innerHTML = '&times;';
  closeBtn.setAttribute('aria-label', t().closeAria);
  const img = document.createElement('img');
  img.src = src;
  img.draggable = false;
  const tag = document.createElement('span');
  tag.className = 'lb-tag';
  tag.textContent = 'hdtiktok';
  const hint = document.createElement('span');
  hint.className = 'lb-hint';
  hint.textContent = t().zoomHint;

  lstage.appendChild(img);
  overlay.appendChild(lstage);
  overlay.appendChild(tag);
  overlay.appendChild(hint);
  overlay.appendChild(closeBtn);
  document.body.appendChild(overlay);
  requestAnimationFrame(() => overlay.classList.add('open'));

  const ZOOM_1 = 2.2, ZOOM_2 = 3.6;
  const canPan = window.matchMedia('(pointer: fine)').matches;
  let zoomed = false;
  let clickTimer = null;

  function setOrigin(e) {
    const rect = img.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    img.style.transformOrigin = `${Math.max(0, Math.min(100, x))}% ${Math.max(0, Math.min(100, y))}%`;
  }
  function onPan(e) { setOrigin(e); }
  function zoomIn(e, level) {
    setOrigin(e);
    img.style.transform = `scale(${level})`;
    img.classList.add('zoomed');
    zoomed = true;
    if (canPan) img.addEventListener('mousemove', onPan);
  }
  function zoomOut() {
    img.style.transform = '';
    img.style.transformOrigin = '';
    img.classList.remove('zoomed');
    zoomed = false;
    img.removeEventListener('mousemove', onPan);
  }
  img.addEventListener('click', (e) => {
    e.stopPropagation();
    if (clickTimer) { clearTimeout(clickTimer); clickTimer = null; return; }
    const ev = { clientX: e.clientX, clientY: e.clientY };
    clickTimer = setTimeout(() => {
      clickTimer = null;
      zoomed ? zoomOut() : zoomIn(ev, ZOOM_1);
    }, 230);
  });
  img.addEventListener('dblclick', (e) => {
    e.stopPropagation();
    if (clickTimer) { clearTimeout(clickTimer); clickTimer = null; }
    zoomed ? zoomOut() : zoomIn(e, ZOOM_2);
  });
  function close() {
    overlay.classList.remove('open');
    overlay.addEventListener('transitionend', () => overlay.remove(), { once: true });
    setTimeout(() => overlay.remove(), 450);
    document.removeEventListener('keydown', onKey);
  }
  function onKey(e) { if (e.key === 'Escape') close(); }
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay || e.target === closeBtn) close();
  });
  closeBtn.addEventListener('click', close);
  document.addEventListener('keydown', onKey);
}

/* ---------- State rendering ---------- */
function showState(name) {
  const wasHidden = !stage.classList.contains('shown');
  stage.classList.add('shown');
  Object.entries(states).forEach(([k, el]) => el.classList.toggle('active', k === name));
  if (wasHidden && isMobile) {
    requestAnimationFrame(() => stage.scrollIntoView({ behavior: 'smooth', block: 'start' }));
  }
}
function renderError(type, username) {
  lastErrorState = { type, username };
  const d = t();
  if (type === 'notFound') {
    errorTitle.textContent = d.notFoundTitle;
    errorDetail.textContent = d.notFoundDetail(username);
  } else if (type === 'noPic') {
    errorTitle.textContent = d.noPicTitle;
    errorDetail.textContent = d.noPicDetail(username);
  } else if (type === 'blocked') {
    errorTitle.textContent = d.blockedTitle;
    errorDetail.textContent = d.blockedDetail;
  } else if (type === 'rateLimit') {
    errorTitle.textContent = d.rateLimitTitle;
    errorDetail.textContent = d.rateLimitDetail;
  } else if (type === 'serverError') {
    errorTitle.textContent = d.serverTitle;
    errorDetail.textContent = d.serverDetail;
  } else {
    errorTitle.textContent = d.connTitle;
    errorDetail.textContent = d.connDetail;
  }
  showState('error');
}

/* ---------- Main ---------- */
let runToken = 0;
async function run(rawInput) {
  const username = extractUsername(rawInput);
  if (!username) return;
  const token = ++runToken;
  const stale = () => token !== runToken;
  lastErrorState = null;

  for (let attempt = 0; attempt < 2; attempt++) {
    goBtn.disabled = true;
    loadingText.textContent = attempt === 0 ? t().loading : t().retrying;
    showState('loading');
    previewFrame.classList.remove('loaded');
    previewImg.classList.remove('loaded');
    previewImg.removeAttribute('src');
    previewImg.removeAttribute('srcset');
    resultSpecs.textContent = '';

    try {
      const profile = await retry(() => fetchProfile(username), {
        retries: 1, minTimeout: 900,
        shouldRetry: (e) => !(e && (e.type === 'notFound' || e.type === 'blocked')),
      });
      if (stale()) return;
      if (!profile.avatars.length) { renderError('noPic', username); goBtn.disabled = false; return; }

      const resolvedUsername = profile.username;
      state.username = resolvedUsername;
      state.slug = resolvedUsername;
      state.channel = {
        followers: profile.followers, following: profile.following, likes: profile.likes, videos: profile.videos,
        nickname: profile.nickname, bio: profile.bio, verified: profile.verified, isPrivate: profile.isPrivate,
      };
      pushHistory(resolvedUsername);
      updateUrl(resolvedUsername);

      const avatarBest = await pickBestAvatar(profile.avatars);
      if (stale()) return;
      state.assets.avatar = {
        url: avatarBest.url, w: avatarBest.w, h: avatarBest.h,
        isHighest: avatarBest.isHighest, ext: extFromUrl(avatarBest.url),
        size: null, blob: null, displayMode: 'original', variants: {},
      };
      state.assets.banner = null;   // TikTok'ta banner yok
      resultTabs.hidden = true;
      zipBtn.hidden = true;

      state.activeTab = 'avatar';
      tabAvatar.classList.add('active');
      tabBanner.classList.remove('active');
      resultCard.setAttribute('data-kind', 'avatar');

      resultUsername.textContent = `@${resolvedUsername}`;
      renderChannelMeta();
      siteOpenBtn.href = `https://www.tiktok.com/@${encodeURIComponent(state.slug)}`;
      siteOpenBtn.setAttribute('aria-label', `${t().siteOpenBtn} — tiktok.com/@${state.slug}`);
      renderPreview();
      showState('result');
      onIdle(enrichSizes);

      goBtn.disabled = false;
      return;
    } catch (e) {
      if (stale()) return;
      const type = (e && e.type) || 'network';
      const retryable = type === 'network' || type === 'rateLimit' || type === 'serverError';
      if (retryable && attempt === 0) { await sleep(1400); continue; }
      renderError(type, username);
      goBtn.disabled = false;
      return;
    }
  }
}
async function enrichSizes() {
  for (const key of ['avatar', 'banner']) {
    const asset = state.assets[key];
    if (!asset) continue;
    try {
      const blob = await ensureBlob(asset);
      asset.size = blob.size;
      asset.ext = extFromBlob(blob, asset.ext);
      if (state.activeTab === key) renderSpecs();
    } catch {}
  }
}

/* ---------- Events ---------- */
form.addEventListener('submit', (e) => { e.preventDefault(); run(queryInput.value); });
retryBtn.addEventListener('click', () => {
  if (lastErrorState && lastErrorState.username) {
    queryInput.value = lastErrorState.username;
    run(lastErrorState.username);
  }
});
downloadBtn.addEventListener('click', handleDownload);
modeSwitch && modeSwitch.addEventListener('click', async (e) => {
  const btn = e.target.closest('.mode-btn');
  if (!btn || btn.disabled) return;
  const asset = state.assets[state.activeTab];
  if (!asset) return;
  const nextMode = ['clean', 'strong'].includes(btn.dataset.mode) ? btn.dataset.mode : 'original';
  if (nextMode === (asset.displayMode || 'original')) return;
  if (nextMode !== 'original' && !(asset.variants && asset.variants[nextMode])) {
    const buttons = modeSwitch.querySelectorAll('.mode-btn');
    buttons.forEach((b) => { b.disabled = true; });
    btn.textContent = t().upscaling;
    try {
      await ensureVariant(asset, nextMode, (p) => { btn.textContent = `${t().upscaling.replace('…', '')} ${Math.round(p * 100)}%`; });
    } catch {
      toast(t().toastEnhanceFailed, 'error');
      return;
    } finally {
      buttons.forEach((b) => { b.disabled = false; });
      applyModeLabels();
    }
  }
  asset.displayMode = nextMode;
  renderPreview();
});
openBtn.addEventListener('click', () => {
  const asset = getActiveAsset();
  if (asset) {
    openLightbox(getView(asset).url);
  }
});
previewFrame.addEventListener('click', () => {
  const asset = getActiveAsset();
  if (asset) {
    openLightbox(getView(asset).url);
  }
});
copyImgBtn.addEventListener('click', handleCopyImage);
copyLinkBtn.addEventListener('click', handleCopyLink);
shareBtn.addEventListener('click', handleShare);
qrBtn.addEventListener('click', handleQr);
zipBtn.addEventListener('click', handleZip);

/* "/" kısayolu: herhangi bir input'a yazmıyorken kullanıcı adı kutusuna odaklan */
document.addEventListener('keydown', (e) => {
  if (e.key !== '/' || e.metaKey || e.ctrlKey || e.altKey) return;
  const tag = (document.activeElement && document.activeElement.tagName) || '';
  if (tag === 'INPUT' || tag === 'TEXTAREA') return;
  e.preventDefault();
  queryInput.focus();
});

queryInput.addEventListener('paste', (e) => {
  const text = (e.clipboardData || window.clipboardData).getData('text') || '';
  if (/^https?:\/\/(www\.|m\.)?tiktok\.com\//i.test(text.trim())) {
    setTimeout(() => run(text), 0);
  }
});

/* ---------- Logo → ana sayfa ---------- */
$('logo').addEventListener('click', (e) => {
  e.preventDefault();
  runToken++;
  updateUrl('');
  queryInput.value = '';
  stage.classList.remove('shown');
  goBtn.disabled = false;
  previewImg.removeAttribute('src');
  previewImg.removeAttribute('srcset');
  previewFrame.classList.remove('loaded');
  resultSpecs.textContent = '';
  siteOpenBtn.href = 'https://www.tiktok.com/';
  window.scrollTo({ top: 0, behavior: 'smooth' });
  setTimeout(() => queryInput.focus(), 250);
});

previewImg.addEventListener('error', async () => {
  const a = state.assets[state.activeTab];
  if (!a || previewImg.dataset.blobTried === a.url) return;
  previewImg.dataset.blobTried = a.url;
  try { previewImg.src = URL.createObjectURL(await ensureBlob(a)); } catch {}
});

/* ---------- Init ---------- */
applyStaticText();
renderHistory();

/* Açılışta #u=kullanıcı (yeni) veya ?u=kullanıcı (eski linkler)
   varsa otomatik çek. Backward-compatible. */
(function autoFromUrl() {
  try {
    let u = usernameFromHash();
    if (!u) u = new URLSearchParams(location.search).get('u');
    if (u) { queryInput.value = u; run(u); }
  } catch {}
})();
/* Sayfa açıkken yeni bir paylaşım linki yapıştırılırsa / geri-ileri yapılırsa */
window.addEventListener('hashchange', () => {
  const u = usernameFromHash();
  if (u && u.toLowerCase() !== (state.username || '').toLowerCase()) { queryInput.value = u; run(u); }
});

/* PWA: sadece uygulama kabuğu için hafif service worker */
if ('serviceWorker' in navigator && location.protocol === 'https:') {
  window.addEventListener('load', () => { navigator.serviceWorker.register('sw.js').catch(() => {}); });
}

})();
