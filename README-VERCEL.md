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
| yt-dlp | **Render Free / Oracle VPS / جهازك** — ليس Railway مجاني دائم |

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

### 3) خدمة استخراج الفيديو (خارج Vercel)

المجلد **[resolver-service](./resolver-service/)** — Express + yt-dlp في Docker.

**مجاني عملياً:**

| الخيار | التكلفة |
|--------|---------|
| **[Render Free](https://render.com)** | $0 — بطيء عند «النوم» |
| **Oracle Cloud Always Free** | $0 دائماً — VPS |
| **Railway** | رصيد محدود ثم ~$5/شهر — **ليس مجاني دائم** |
| **`npm start` على جهازك** | $0 — بدون Vercel أصلاً |

تفاصيل النشر: [resolver-service/README.md](./resolver-service/README.md)

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
| **Render Free + resolver** | ✅ مع بطء البرودة | موصى به مع Vercel |
| **Oracle VPS + resolver** | ✅ دائماً | 24/7 |
| **Railway** | ❌ محدود ثم مدفوع | لا يُوصى كمجاني |
| **`npm start` محلياً** | ✅ | الأبسط — بدون Vercel |

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
