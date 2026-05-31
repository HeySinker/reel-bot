const axios = require('axios');
const { BOT_TOKEN } = require('./config');

const TG = `https://api.telegram.org/bot${BOT_TOKEN}`;

async function tg(method, body = {}) {
  const { data } = await axios.post(`${TG}/${method}`, body, { timeout: 30000 });
  if (!data.ok) throw new Error(data.description || 'Telegram API error');
  return data.result;
}

function sendMessage(chatId, text, extra = {}) {
  return tg('sendMessage', { chat_id: chatId, text, ...extra });
}

function editMessageText(chatId, messageId, text, extra = {}) {
  return tg('editMessageText', { chat_id: chatId, message_id: messageId, text, ...extra });
}

function editMessageReplyMarkup(chatId, messageId, reply_markup) {
  return tg('editMessageReplyMarkup', { chat_id: chatId, message_id: messageId, reply_markup });
}

function answerCallbackQuery(callbackQueryId, text) {
  return tg('answerCallbackQuery', { callback_query_id: callbackQueryId, text, show_alert: !!text });
}

module.exports = {
  sendMessage,
  editMessageText,
  editMessageReplyMarkup,
  answerCallbackQuery,
};
