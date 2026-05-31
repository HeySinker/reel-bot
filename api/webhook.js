const { processUpdate } = require('../lib/handler');
const { WEBHOOK_SECRET } = require('../lib/config');

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(200).json({ ok: true, hint: 'Telegram webhook POST only' });
  }

  if (WEBHOOK_SECRET) {
    const secret = req.headers['x-telegram-bot-api-secret-token'];
    if (secret !== WEBHOOK_SECRET) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
  }

  try {
    const update = req.body;
    await processUpdate(update);
    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error('webhook error:', err);
    return res.status(200).json({ ok: true });
  }
};
