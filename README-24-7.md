# تشغيل 24/7 مجاني — نفس التجربة المحلية

على **Vercel** لا يمكن تشغيل `yt-dlp` → لا يوجد حل مجاني 100% هناك.

الحل: **سيرفر صغير مجاني** يشغّل نفس `bot.js` + `yt-dlp` مثل جهازك.

---

## الخيارات المجانية

| الخيار | 24/7 | مجاني | الصعوبة |
|--------|------|--------|---------|
| **Oracle Cloud (موصى به)** | ✅ | ✅ دائم | متوسط |
| جهازك + `npm start` + PM2 | ✅ إن بقي مشغّلاً | ✅ | سهل |
| Google Cloud e2-micro | ✅* | *12 شهر مجاني ثم مدفوع | متوسط |
| Vercel | ✅ | ❌ لاستخراج الفيديو | — |

---

## 1) Oracle Cloud — مجاني للأبد

### أ) إنشاء السيرفر

1. [cloud.oracle.com](https://www.oracle.com/cloud/free/) → حساب مجاني
2. **Compute → Instances → Create**
3. اختر **Ubuntu 22.04**، شكل **VM.Standard.A1.Flex** (ARM — ضمن الطبقة المجانية)
4. أضف **SSH key** (من PowerShell: `ssh-keygen -t ed25519` ثم انسخ محتوى `~/.ssh/id_ed25519.pub`)
5. افتح **Ingress**: منفذ **22** (SSH) فقط

### ب) الاتصال والتثبيت

```bash
ssh ubuntu@IP_السيرفر

sudo apt update && sudo apt install -y curl git ffmpeg

# Node 20
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# المشروع
git clone https://github.com/YOUR_USER/reel-bot.git
cd reel-bot/reel-bot
npm install

# ملف البيئة
nano .env
# الصق نفس قيم .env من جهازك (TELEGRAM, META, PAGE_IDS, ALLOWED_USERS)
```

### ج) تشغيل دائم بـ PM2

```bash
sudo npm install -g pm2
pm2 start bot.js --name reel-bot
pm2 save
pm2 startup
# نفّذ الأمر الذي يطبعه pm2 startup (sudo ...)
```

```bash
pm2 status
pm2 logs reel-bot
```

البوت يعمل **نفس `npm start` محلياً**: polling + yt-dlp مجاني.

---

## 2) جهاز Windows لديك (بدون سحابة)

```powershell
cd C:\Users\iswar\OneDrive\Desktop\reel-bot\reel-bot
npm install -g pm2
pm2 start bot.js --name reel-bot
pm2 save
```

- عطّل **سكون** Windows: Settings → Power → Never sleep
- البوت يعمل طالما الجهاز والإنترنت شغّالان

---

## 3) ماذا عن Vercel؟

| على Vercel | على VPS / جهازك |
|------------|-----------------|
| webhook | polling (أبسط) |
| RapidAPI مدفوع | yt-dlp مجاني |
| بدون قرص لـ yt-dlp | yt-dlp + ffmpeg |

**أوقف الاعتماد على Vercel** للبوت اليومي، أو اتركه معطّلاً.

---

## 4) تحديث META_ACCESS_TOKEN

التوكن ينتهي (~60 يوماً). عند الفشل:

1. [Graph API Explorer](https://developers.facebook.com/tools/explorer) → توكن جديد
2. حوّله لتوكن طويل (انظر README الرئيسي)
3. حدّث `.env` على السيرفر: `nano .env` ثم `pm2 restart reel-bot`

---

## 5) استكشاف الأخطاء

| المشكلة | الحل |
|---------|------|
| البوت لا يرد | `pm2 logs reel-bot` — تحقق من TOKEN |
| فشل فيسبوك reel | أضف في `.env`: `YTDLP_COOKIES_BROWSER=chrome` |
| لا صفحات | `npm run list-pages` على السيرفر |
| انقطع بعد إعادة التشغيل | `pm2 save` + `pm2 startup` |

---

## الخلاصة

```
تيليغرام → bot.js (polling) → yt-dlp مجاني → نشر فيسبوك
         ↑
    VPS مجاني (Oracle) أو جهازك 24/7
```

**نفس التجربة المحلية = `bot.js` على آلة تعمل دائماً — ليس على Vercel.**
