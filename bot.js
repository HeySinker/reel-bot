/**
 * التشغيل المجاني الموصى به — polling + yt-dlp (بدون RapidAPI).
 * يُلغي webhook على Vercel عند التشغيل.
 */
require('dotenv').config();
const axios = require('axios');
const TelegramBot = require('node-telegram-bot-api');
const { BOT_TOKEN } = require('./lib/config');
const { processUpdate, getBranches } = require('./lib/handler');

if (!BOT_TOKEN) {
  console.error('❌ TELEGRAM_BOT_TOKEN مفقود في .env');
  process.exit(1);
}

async function useLocalPolling() {
  try {
    await axios.post(`https://api.telegram.org/bot${BOT_TOKEN}/deleteWebhook`, { drop_pending_updates: false });
    console.log('✓ تم إيقاف webhook (وضع محلي مجاني)');
  } catch (e) {
    console.warn('تحذير deleteWebhook:', e.message);
  }

  const bot = new TelegramBot(BOT_TOKEN, { polling: true });
  bot.on('message', (msg) => processUpdate({ message: msg }));
  bot.on('callback_query', (q) => processUpdate({ callback_query: q }));

  const branches = await getBranches();
  console.log('');
  console.log('🤖 البوت يعمل — مجاني (yt-dlp)');
  console.log(`📢 الصفحات: ${branches.map((b) => b.name).join(', ') || 'لا يوجد — راجع PAGE_IDS و META_ACCESS_TOKEN'}`);
  console.log('📎 أرسل رابط Reel من تيليغرام');
  console.log('⏹  أوقف بـ Ctrl+C');
  console.log('');
}

useLocalPolling().catch((err) => {
  console.error(err);
  process.exit(1);
});
