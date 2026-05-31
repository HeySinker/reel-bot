/**
 * GET /api/setup-webhook?secret=YOUR_SETUP_SECRET
 * يسجّل webhook تيليغرام على Vercel (مرة واحدة بعد النشر).
 */
const axios = require('axios');
const { BOT_TOKEN, VERCEL_URL, WEBHOOK_SECRET } = require('../lib/config');

module.exports = async (req, res) => {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'GET only' });
  }

  const setupSecret = process.env.SETUP_SECRET;
  if (setupSecret && req.query.secret !== setupSecret) {
    return res.status(401).json({ error: 'Invalid setup secret' });
  }

  if (!BOT_TOKEN || !VERCEL_URL) {
    return res.status(500).json({
      error: 'Missing TELEGRAM_BOT_TOKEN or VERCEL_URL',
      hint: 'VERCEL_URL is set automatically on Vercel after deploy',
    });
  }

  const webhookUrl = `https://${VERCEL_URL.replace(/^https?:\/\//, '')}/api/webhook`;

  try {
    const body = { url: webhookUrl, allowed_updates: ['message', 'callback_query'] };
    if (WEBHOOK_SECRET) {
      body.secret_token = WEBHOOK_SECRET;
    }

    const { data } = await axios.post(
      `https://api.telegram.org/bot${BOT_TOKEN}/setWebhook`,
      body
    );

    return res.status(200).json({
      ok: data.ok,
      webhookUrl,
      description: data.description,
      result: data.result,
    });
  } catch (err) {
    return res.status(500).json({
      error: err.response?.data || err.message,
    });
  }
};
