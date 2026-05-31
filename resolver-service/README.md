# خدمة استخراج الفيديو (لـ Vercel)

Vercel **لا يشغّل yt-dlp**. هذه الخدمة تُستضاف **خارج Vercel** ويستدعيها البوت عبر `VIDEO_RESOLVER_URL`.

---

## ⚠️ تكلفة الاستضافة (صريح)

| المنصة | الواقع |
|--------|--------|
| **Railway** | تجربة ~$5 ثم خطة Free بحد **~$1/شهر** — غالباً **لا تكفي** لخدمة دائمة؛ بعدها Hobby **$5/شهر** |
| **Render Free** | **مجاني** لكن السيرفر «ينام» → أول طلب بطيء (30–60 ث) |
| **Oracle Cloud Always Free** | **مجاني دائماً** (VPS) — الأفضل لـ 24/7 بدون اشتراك |
| **جهازك + `npm start`** | **مجاني 100%** — البوت + yt-dlp معاً (بدون Vercel) |

اعتذر عن أي توثيق سابق قدّم Railway كـ «مجاني بالكامل» — ذلك غير دقيق لعام 2026.

---

## موصى به للمجاني: Render

1. [render.com](https://render.com) → **New +** → **Web Service**
2. اربط GitHub: **HeySinker/reel-bot**
3. **Root Directory:** `resolver-service`
4. **Runtime:** Docker
5. **Instance type:** Free
6. Environment: `RESOLVER_SECRET` = سر عشوائي طويل
7. انسخ URL مثل `https://reelbot-resolver.onrender.com`

### Vercel

```env
VIDEO_RESOLVER_URL=https://YOUR-SERVICE.onrender.com/resolve
RESOLVER_SECRET=نفس_السر
```

> أول طلب بعد ساعات خمول قد يكون بطيئاً — هذا طبيعي على الخطة المجانية.

---

## مجاني دائماً: Oracle Cloud (resolver فقط)

دليل VPS: [README-24-7.md](../README-24-7.md)

على Ubuntu:

```bash
git clone https://github.com/HeySinker/reel-bot.git
cd reel-bot/resolver-service
# Docker أو: apt install ffmpeg + yt-dlp + npm start
```

---

## الأبسط على الإطلاق (بدون Vercel)

```bash
cd reel-bot
npm install
npm start
```

yt-dlp على جهازك — **لا resolver منفصل ولا Railway**.

---

## اختبار

```bash
curl -X POST "https://YOUR-HOST/resolve" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_SECRET" \
  -d "{\"url\":\"https://www.facebook.com/share/r/XXXX/\"}"
```

يجب أن ترى `download_url`.
