/* TikTok sayfa düzeni değişirse ilk bunu çalıştır:  npm test
   app.js içindeki parseProfileHtml'i (PARSER START/END arası) örnek sayfalarla sınar. */
const fs = require('fs');
const path = require('path');
const assert = require('assert');
const src = fs.readFileSync(path.join(__dirname, '..', 'app.js'), 'utf8');
const code = src.slice(src.indexOf('/* PARSER START */'), src.indexOf('/* PARSER END */'));
const { parseProfileHtml, parseReaderMarkdown, parseMicrolink, parseCompactNumber, isAvatarUrl } =
  new Function(code + '; return { parseProfileHtml, parseReaderMarkdown, parseMicrolink, parseCompactNumber, isAvatarUrl };')();

const page = (json) => `<html><body><script id="__UNIVERSAL_DATA_FOR_REHYDRATION__" type="application/json">${JSON.stringify(json)}</script></body></html>`;
const user = { uniqueId: 'demo', nickname: 'Demo Nick', signature: 'hello', verified: true, privateAccount: false,
  avatarLarger: 'https://p16-sign-va.tiktokcdn.com/a~c5_1080x1080.jpeg?x-expires=1&x-signature=L',
  avatarMedium: 'https://p16-sign-va.tiktokcdn.com/a~c5_720x720.jpeg?x-expires=1&x-signature=M',
  avatarThumb: 'https://p16-sign-va.tiktokcdn.com/a~c5_100x100.jpeg?x-expires=1&x-signature=T' };

// 1) normal profil
let r = parseProfileHtml(page({ __DEFAULT_SCOPE__: { 'webapp.user-detail': { statusCode: 0, userInfo: { user, stats: { followerCount: 1234567, followingCount: 12, heartCount: 9876543, videoCount: 88 } } } } }));
assert.strictEqual(r.status, 'ok');
assert.strictEqual(r.profile.username, 'demo');
assert.strictEqual(r.profile.followers, 1234567);
assert.strictEqual(r.profile.verified, true);
assert.strictEqual(r.profile.avatars.length, 3);
assert.ok(r.profile.avatars[0].includes('1080x1080'), 'Larger önce gelmeli');
assert.ok(r.profile.avatars[0].includes('x-signature'), 'imzalı URL değişmemeli');

// 2) statsV2: sayılar string gelebilir
r = parseProfileHtml(page({ __DEFAULT_SCOPE__: { 'webapp.user-detail': { userInfo: { user, statsV2: { followerCount: '95200000', followingCount: '82', heartCount: '1300400000', videoCount: '1211' } } } } }));
assert.strictEqual(r.profile.followers, 95200000);
assert.strictEqual(r.profile.likes, 1300400000);

// 3) SIGI_STATE yedeği
r = parseProfileHtml(`<script id="SIGI_STATE" type="application/json">${JSON.stringify({ UserModule: { users: { demo: user }, stats: { demo: { followerCount: 5, followingCount: 1, heartCount: 2, videoCount: 3 } } } })}</script>`);
assert.strictEqual(r.status, 'ok');
assert.strictEqual(r.profile.videos, 3);

// 4) olmayan hesap: sayfa var, userInfo yok
assert.strictEqual(parseProfileHtml(page({ __DEFAULT_SCOPE__: { 'webapp.user-detail': { statusCode: 10221 } } })).status, 'notFound');

// 5) bot/captcha sayfası: gömülü veri hiç yok
assert.strictEqual(parseProfileHtml('<html><title>Security Check</title><div id="captcha"></div></html>').status, 'blocked');
assert.strictEqual(parseProfileHtml('').status, 'blocked');

// 6) kısa sayı biçimleri
assert.strictEqual(parseCompactNumber('96.6M'), 96600000);
assert.strictEqual(parseCompactNumber('1.2K'), 1200);
assert.strictEqual(parseCompactNumber('3.4B'), 3400000000);
assert.strictEqual(parseCompactNumber('1,234'), 1234);
assert.strictEqual(parseCompactNumber('88'), 88);
assert.strictEqual(parseCompactNumber('nope'), null);

// 7) Jina Reader markdown çıktısı
const readerMd = `Title: Demo Nick (@demo) | TikTok

URL Source: https://www.tiktok.com/@demo

Markdown Content:
![Image 1: Avatar for demo](https://p16-sign-va.tiktokcdn.com/tos-alisg-avt-0068/a~c5_1080x1080.jpeg?x-expires=1&x-signature=L)

# Demo Nick

## demo

### **1**Following

**1.2M**Followers

**9.8M**Likes

**88**Videos

Follow

[Message](https://www.tiktok.com/@demo)

## merhaba dünya

Suggested accounts

[![Image 2: Avatar for someone](https://p16-sign-va.tiktokcdn.com/tos-useast5-avt-0068-tx/b~c5_100x100.jpeg)](https://www.tiktok.com/@someone)
`;
r = parseReaderMarkdown(readerMd, 'demo');
assert.strictEqual(r.status, 'ok');
assert.strictEqual(r.profile.username, 'demo');
assert.strictEqual(r.profile.nickname, 'Demo Nick');
assert.strictEqual(r.profile.followers, 1200000);
assert.strictEqual(r.profile.following, 1);
assert.strictEqual(r.profile.likes, 9800000);
assert.strictEqual(r.profile.videos, 88);
assert.strictEqual(r.profile.bio, 'merhaba dünya');
assert.strictEqual(r.profile.avatars.length, 1, 'önerilen hesap avatarı atlanmalı');
assert.ok(r.profile.avatars[0].includes('avt-0068'));

// 7b) Jina: hedefin kendi avatarı da "Avatar for <hedef>" ile gelir (sekwvr)
const sekwvrMd = `Title: şeker (@sekwvr) | TikTok

URL Source: https://www.tiktok.com/@sekwvr

Markdown Content:
![Image 1: Avatar for sekwvr](https://p19-common-sign.tiktokcdn-us.com/tos-alisg-avt-0068/f09450564a8332.jpeg?x-signature=a)

### **90**Following

**1.1M**Followers

**118.1M**Likes

## 🎀 ✉️: sekersekwr61@gmail.com

Suggested accounts

View all

[![Image 2: Avatar for lalalalisa_m](https://p19-common-sign.tiktokcdn-us.com/tos-useast5-avt-0068-tx/03f66a57.jpeg?x-signature=b)](https://www.tiktok.com/@lalalalisa_m)
`;
r = parseReaderMarkdown(sekwvrMd, 'sekwvr');
assert.strictEqual(r.status, 'ok');
assert.strictEqual(r.profile.username, 'sekwvr');
assert.strictEqual(r.profile.nickname, 'şeker');
assert.strictEqual(r.profile.followers, 1100000);
assert.strictEqual(r.profile.following, 90);
assert.strictEqual(r.profile.likes, 118100000);
assert.strictEqual(r.profile.bio, '🎀 ✉️: sekersekwr61@gmail.com');
assert.strictEqual(r.profile.avatars.length, 1);
assert.ok(r.profile.avatars[0].includes('f09450564a8332'), 'hedefin avatarı seçilmeli');
assert.ok(!r.profile.avatars[0].includes('03f66a57'), 'önerilen hesap avatarları elenmeli');

// 7c) Avatar biçimli olmayan görseller (video kapağı vb.) profil avatarı sayılmaz
assert.strictEqual(parseReaderMarkdown(
  'Title: Demo (@demo) | TikTok\n\n![Video cover](https://p16-sign-va.tiktokcdn.com/obj/tos-alisg-video-cover/abc.jpeg)\n\n**1.2M**Followers',
  'demo'
).status, 'blocked');
assert.strictEqual(parseReaderMarkdown(
  '![Image 1: Avatar for someone](https://p16-sign-va.tiktokcdn.com/tos-useast5-avt-0068-tx/x.jpeg)',
  'demo'
).status, 'blocked', 'başka hesabın avatarı hedefe yazılmamalı');

// 7d) Avatar URL işaretleri
assert.strictEqual(isAvatarUrl('https://p16-sign-va.tiktokcdn.com/tos-alisg-avt-0068/x.jpeg'), true);
assert.strictEqual(isAvatarUrl('https://p16-sign-va.tiktokcdn.com/obj/abc.jpeg'), false);
assert.strictEqual(isAvatarUrl('https://lf16-tiktok-web.ttwstatic.com/obj/share_img.png'), false);

// 8) Jina Reader: olmayan hesap / bot sayfası
assert.strictEqual(parseReaderMarkdown('Title: Couldn’t find this account.\n\nMarkdown Content:\nCouldn\'t find this account', 'yok').status, 'notFound');
assert.strictEqual(parseReaderMarkdown('Markdown Content:\nPlease wait...', 'yok').status, 'blocked');

// 9) Microlink JSON çıktısı
r = parseMicrolink({
  status: 'success',
  data: {
    title: 'Demo Nick (@demo) on TikTok',
    description: 'Demo Nick (@demo) on TikTok | 9.8M Likes. 1.2M Followers.',
    image: { url: 'https://p16-common-sign.tiktokcdn-us.com/tos-alisg-avt-0068/a~tplv-tiktokx-cropcenter:1080:1080.jpeg?x-signature=1' },
  },
}, 'demo');
assert.strictEqual(r.status, 'ok');
assert.strictEqual(r.profile.username, 'demo');
assert.strictEqual(r.profile.nickname, 'Demo Nick');
assert.strictEqual(r.profile.followers, 1200000);
assert.strictEqual(r.profile.likes, 9800000);

// 10) Microlink: olmayan hesap ve genel paylaşım görseli
assert.strictEqual(parseMicrolink({
  status: 'success',
  data: { title: 'Couldn’t find this account. (@yok) on TikTok', image: { url: 'https://lf16-tiktok-web.ttwstatic.com/obj/tiktok-web-common-sg/mtact/static/images/share_img.png' } },
}, 'yok').status, 'notFound');
assert.strictEqual(parseMicrolink({ status: 'fail' }, 'yok').status, 'blocked');

// 11) Microlink: avatar olmayan görsel (paylaşım kartı) kullanılmamalı
assert.strictEqual(parseMicrolink({
  status: 'success',
  data: {
    title: 'Demo Nick (@demo) on TikTok',
    image: { url: 'https://lf16-tiktok-web.ttwstatic.com/obj/tiktok-web-common-sg/mtact/static/images/share_img.png' },
  },
}, 'demo').status, 'blocked');
assert.strictEqual(parseMicrolink({
  status: 'success',
  data: {
    title: 'Demo Nick (@demo) on TikTok',
    image: { url: 'https://p16-sign-va.tiktokcdn.com/obj/tos-alisg-video-cover/abc.jpeg' },
  },
}, 'demo').status, 'blocked');

console.log('profil ayrıştırıcıları: tüm testler geçti ✅');
