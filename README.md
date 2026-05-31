# Reel Bot — نشر ريلز فيسبوك/إنستغرام عبر تيليغرام

بوت تيليغرام: رابط Reel → كابشن → هاشتاقات → اختيار صفحات فيسبوك → نشر.

## البنية

| المكوّن | المجلد | الاستضافة |
|---------|--------|-----------|
| البوت | `api/`, `lib/`, `bot.js` | **Vercel** (webhook) |
| استخراج الفيديو | `resolver-service/` | **Render Free** أو **Oracle** (ليس Railway مجاني دائم) |
| تشغيل مجاني 24/7 | `bot.js` + PM2 | جهازك أو VPS |

## البدء السريع

### Vercel + resolver خارجي

1. انشر **`resolver-service`** على [Render Free](https://render.com) أو Oracle — راجع [resolver-service/README.md](./resolver-service/README.md)
2. البوت على [Vercel](https://vercel.com) — Root: `.`
3. متغيرات: [.env.example](./.env.example) و [README-VERCEL.md](./README-VERCEL.md)

> **Railway** ليس مجانياً بشكل عملي للتشغيل الدائم (رصيد محدود ثم ~$5/شهر).

### محلي (مجاني — الأبسط)

```bash
cp .env.example .env
# املأ TELEGRAM_BOT_TOKEN, META_ACCESS_TOKEN, PAGE_IDS, ALLOWED_USERS
npm install
npm start
```

## التوثيق

- [README-VERCEL.md](./README-VERCEL.md) — البوت على Vercel + Redis + webhook
- [resolver-service/README.md](./resolver-service/README.md) — API استخراج الفيديو (Railway)
- [README-24-7.md](./README-24-7.md) — تشغيل 24/7 مجاني (PM2 / Oracle)

## أوامر مفيدة

```bash
npm run list-pages      # قائمة صفحات فيسبوك
npm run test-resolve -- "https://www.facebook.com/share/r/..."
npm run start           # بوت محلي (yt-dlp مجاني)
```

## Meta App

صلاحيات: `pages_manage_posts`, `pages_show_list`, `business_management`  
توكن: [Graph API Explorer](https://developers.facebook.com/tools/explorer)
