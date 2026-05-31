# خدمة استخراج الفيديو (لـ Vercel)

Vercel **لا يشغّل yt-dlp**. هذه الخدمة الصغيرة (~50 سطر) تُنشر في **5–10 دقائق** ويستدعيها البوت على Vercel.

## الأبسط: Railway (موصى به)

| لماذا Railway | |
|---------------|--|
| يكتشف `Dockerfile` تلقائياً | لا إعداد يدوي لـ yt-dlp |
| ربط GitHub | تحديث تلقائي عند push |
| URL عام فوراً | جاهز لـ `VIDEO_RESOLVER_URL` |

### خطوات (نسخ ولصق)

1. [railway.app](https://railway.app) → تسجيل → **New Project** → **Deploy from GitHub repo**
2. اختر هذا المستودع → **Root Directory**: `resolver-service`
3. **Variables** → أضف:
   ```
   RESOLVER_SECRET=ضع_سراً_عشوائياً_طويلاً
   ```
4. **Settings** → **Networking** → **Generate Domain**
5. انسخ الرابط، مثال: `https://reel-resolver-production.up.railway.app`

### ربط Vercel (دقيقة واحدة)

في [Vercel → Environment Variables](https://vercel.com):

```
VIDEO_RESOLVER_URL=https://YOUR-DOMAIN.up.railway.app/resolve
RESOLVER_SECRET=نفس_السر_من_الخطوة_3
```

ثم: `npx vercel --prod`

### اختبار قبل التيليغرام

```bash
curl -X POST "https://YOUR-DOMAIN.up.railway.app/resolve" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_SECRET" \
  -d "{\"url\":\"https://www.facebook.com/share/r/XXXX/\"}"
```

يجب أن ترى `"download_url": "https://...mp4..."`

---

## بديل: Render (مجاني — أبطأ أول طلب)

1. [render.com](https://render.com) → **New +** → **Web Service** → GitHub
2. Root: `resolver-service`، **Docker**
3. Env: `RESOLVER_SECRET`
4. نفس `VIDEO_RESOLVER_URL` على Vercel

> الخطة المجانية: السيرفر «ينام» → أول طلب بعد ساعات قد يأخذ 30–60 ثانية.

---

## مقارنة سريعة

| | Railway | Render Free | Oracle VPS |
|--|---------|-------------|------------|
| السهولة | ⭐⭐⭐ | ⭐⭐ | ⭐ |
| السرعة | سريع | بطيء عند البرودة | سريع |
| التكلفة | رصيد مجاني ثم رخيص | مجاني | مجاني دائم |
| موصى به | **نعم** | إن لم ترد Railway | لاحقاً 24/7 |

## ربط Vercel

في Vercel → Environment Variables:

```
VIDEO_RESOLVER_URL=https://xxx.up.railway.app/resolve
RESOLVER_SECRET=نفس_السر_من_Railway
```

احذف `RAPIDAPI_*` إن لم تعد تحتاجها.

## اختبار

```bash
curl -X POST https://xxx.up.railway.app/resolve \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_SECRET" \
  -d '{"url":"https://www.facebook.com/share/r/..."}'
```

يجب أن ترى `download_url`.
