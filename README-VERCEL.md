# البوت على Vercel — ماذا يلزم؟

## هل يعمل على Vercel؟

**نعم** — لكن **ليس yt-dlp داخل Vercel**.

```
تيليغرام → Vercel (webhook) → خدمة خارجية (yt-dlp) → رابط mp4 → فيسبوك
                ↑
           Upstash Redis (جلسات)
```

| جزء | أين يعمل |
|-----|----------|
| البوت + webhook + نشر فيسبوك | **Vercel** ✅ |
| استخراج رابط الفيديو | **خارج Vercel** (خدمة صغيرة أو RapidAPI) |
| yt-dlp | **Railway / Render / VPS** فقط |

---

## ما الذي تحتاجه (قائمة كاملة)

### 1) Vercel — البوت

| المتغير | مطلوب |
|---------|--------|
| `TELEGRAM_BOT_TOKEN` | ✅ |
| `META_ACCESS_TOKEN` | ✅ |
| `PAGE_IDS` | ✅ |
| `ALLOWED_USERS` | ✅ |
| `WEBHOOK_BASE_URL` | ✅ `https://reel-bot-rho.vercel.app` |
| `WEBHOOK_SECRET` | موصى به |
| `SETUP_SECRET` | لتسجيل webhook |
| **`VIDEO_RESOLVER_URL`** | ✅ **رابط خدمة الاستخراج** |
| **`RESOLVER_SECRET`** | ✅ إن فعّلت السر على الخدمة |

### 2) Upstash Redis (جلسات بين الرسائل)

Vercel → **Storage** → Redis → Link to project  
يضيف `KV_REST_API_URL` و `KV_REST_API_TOKEN` تلقائياً.

بدون Redis: الجلسة تضيع بين كل خطوة.

### 3) خدمة استخراج الفيديو (مجاني — موصى به)

المجلد **[resolver-service](./resolver-service/)** — Express + yt-dlp في Docker.

**نشر على Railway (مجاني للبداية):**

1. railway.app → مشروع جديد من GitHub
2. **Root Directory:** `resolver-service`
3. `RESOLVER_SECRET` = سر عشوائي
4. انسخ URL العام

في Vercel:

```env
VIDEO_RESOLVER_URL=https://YOUR-APP.up.railway.app/resolve
RESOLVER_SECRET=نفس_السر
```

تفاصيل: [resolver-service/README.md](./resolver-service/README.md)

### 4) خطة Vercel

`vercel.json` يطلب **60 ثانية** للـ webhook.  
قد تحتاج **Pro** إن انتهت المهلة على Hobby (حد 10 ثوانٍ).

### 5) تسجيل Webhook (مرة بعد النشر)

```
https://YOUR-APP.vercel.app/api/setup-webhook?secret=SETUP_SECRET
```

> لا تشغّل `npm start` محلياً وأنت تستخدم Vercel — يحذف webhook.

---

## بدائل لخدمة resolver-service

| الخيار | مجاني؟ | ملاحظة |
|--------|--------|--------|
| **resolver-service + Railway** | مجاني/رخيص | الأفضل — نفس yt-dlp |
| RapidAPI | حص محدود | ما جرّبته |
| Cobalt خاص | تحتاج سيرفر | أعقد |
| `npm start` على جهازك | ✅ | بدون Vercel |

---

## النشر

```bash
npm install
npx vercel --prod
```

ثم setup-webhook + اختبار رابط فيسبوك.

---

## استكشاف الأخطاء

| المشكلة | الحل |
|---------|------|
| البوت لا يرد | setup-webhook + لا تشغّل bot.js محلياً |
| الجلسة تضيع | Upstash Redis |
| فشل استخراج الفيديو | `VIDEO_RESOLVER_URL` + اختبار curl على `/resolve` |
| انتهاء المهلة | Vercel Pro أو تسريع resolver |
| RapidAPI HTML | استخدم resolver-service بدل RapidAPI |
