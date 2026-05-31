const { ALLOWED_USERS } = require('./config');
const { loadBranches } = require('./meta-pages');
const { getSession, setSession, clearSession } = require('./session-store');
const tg = require('./telegram-api');
const { resolveVideo } = require('./video-resolver');
const { uploadVideoByFileUrl, uploadVideoFromFile } = require('./facebook-upload');
const fs = require('fs');

let branchesCache = null;
let branchesLoadedAt = 0;

async function getBranches() {
  if (!branchesCache || Date.now() - branchesLoadedAt > 300000) {
    branchesCache = await loadBranches();
    branchesLoadedAt = Date.now();
  }
  return branchesCache;
}

function isAllowed(userId) {
  if (ALLOWED_USERS.length === 0) return true;
  return ALLOWED_USERS.includes(userId);
}

function escapeHtml(text) {
  return String(text ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function extractReelUrl(msg) {
  const blocks = [];
  const collect = (str, entities) => {
    if (!str || !entities) return;
    for (const e of entities) {
      if (e.type === 'url') blocks.push(str.substring(e.offset, e.offset + e.length));
      else if (e.type === 'text_link' && e.url) blocks.push(e.url);
    }
  };
  if (msg.text) {
    blocks.push(msg.text);
    collect(msg.text, msg.entities);
  }
  if (msg.caption) {
    blocks.push(msg.caption);
    collect(msg.caption, msg.caption_entities);
  }

  const pattern =
    /(?:https?:\/\/)?(?:www\.|m\.|l\.|vm\.)?(?:facebook\.com|fb\.com|fb\.watch|instagram\.com|instagr\.am)\/[^\s\])}>'"\u060C\u061B]+/gi;

  for (const block of blocks) {
    const m = block.match(pattern);
    if (m?.length) {
      let url = m[0].replace(/[.,;!?)\]}>'"\u060C\u061B]+$/u, '');
      if (!/^https?:\/\//i.test(url)) url = `https://${url}`;
      return url;
    }
  }
  return null;
}

function buildKeyboard(selected = []) {
  const rows = (branchesCache || []).map((b, i) => [
    { text: `${selected.includes(i) ? '✅' : '⬜'} ${b.name}`, callback_data: `t_${i}` },
  ]);
  rows.push([{ text: '🚀 نشر الآن', callback_data: 'pub' }]);
  rows.push([{ text: '❌ إلغاء', callback_data: 'cancel' }]);
  return { inline_keyboard: rows };
}

function messageCommand(text) {
  if (!text?.trim().startsWith('/')) return null;
  return text.trim().split(/[@\s]/)[0].toLowerCase();
}

async function startUrlFlow(chatId, session, url) {
  session.url = url;
  session.video = null;
  session.step = 'waiting_caption';
  session.originalCaption = '';
  await setSession(session.userId, session);

  const wait = await tg.sendMessage(chatId, '⏳ جاري استخراج معلومات الفيديو...');
  try {
    const resolved = await resolveVideo(url);
    session.video = resolved;
    session.originalCaption = resolved.caption || '';
    await setSession(session.userId, session);

    await tg.editMessageText(
      chatId,
      wait.message_id,
      `✅ تم العثور على الفيديو.\n\n<b>الكابشن:</b>\n${escapeHtml(session.originalCaption || '(فارغ)')}\n\n✏️ أرسل الكابشن الجديد أو /same`,
      { parse_mode: 'HTML' }
    );
  } catch (err) {
    session.step = 'waiting_caption';
    await setSession(session.userId, session);
    const fallbackText = `🔗 تم استلام الرابط.\n\n⚠️ ${err.message}\n\n✏️ أرسل الكابشن يدوياً أو /same`;
    try {
      await tg.editMessageText(chatId, wait.message_id, fallbackText);
    } catch {
      await tg.sendMessage(chatId, fallbackText);
    }
  }
}

async function publishToPages(session) {
  if (!session.video) {
    session.video = await resolveVideo(session.url);
    await setSession(session.userId, session);
  }

  const results = [];
  for (const idx of session.selectedBranches) {
    const branch = branchesCache[idx];
    try {
      if (session.video.type === 'url') {
        await uploadVideoByFileUrl(
          session.video.directUrl,
          session.finalCaption,
          branch.pageId,
          branch.token
        );
      } else {
        await uploadVideoFromFile(
          session.video.filePath,
          session.finalCaption,
          branch.pageId,
          branch.token
        );
      }
      results.push(`✅ ${branch.name}`);
    } catch (err) {
      results.push(`❌ ${branch.name}: ${err.response?.data?.error?.message || err.message}`);
    }
  }

  if (session.video?.type === 'file' && session.video.filePath && fs.existsSync(session.video.filePath)) {
    try {
      fs.unlinkSync(session.video.filePath);
    } catch {
      /* ignore */
    }
  }

  return results;
}

async function handleMessage(msg) {
  const userId = msg.from.id;
  const chatId = msg.chat.id;
  if (!isAllowed(userId)) return tg.sendMessage(chatId, '⛔ غير مصرح لك باستخدام هذا البوت.');

  await getBranches();
  let session = await getSession(userId);
  session.userId = userId;

  const text = msg.text || '';
  const url = extractReelUrl(msg);
  const cmd = messageCommand(text);

  if (url && session.step !== 'selecting_branches') {
    if (!branchesCache?.length) {
      return tg.sendMessage(chatId, '❌ لا توجد صفحات. راجع PAGE_IDS في الإعدادات.');
    }
    return startUrlFlow(chatId, session, url);
  }

  if (!text || (text.startsWith('/') && cmd !== '/same' && cmd !== '/notags')) {
    if (cmd === '/start' || text === '/start') {
      return tg.sendMessage(
        chatId,
        `👋 بوت نشر الريلز\n\n📋 الصفحات (${branchesCache?.length || 0}):\n${(branchesCache || []).map((b, i) => `${i + 1}. ${b.name}`).join('\n') || '—'}\n\n🔗 أرسل رابط Reel من فيسبوك أو إنستغرام.`,
        { parse_mode: 'HTML' }
      );
    }
    if (text === '/refresh') {
      branchesCache = await loadBranches();
      branchesLoadedAt = Date.now();
      return tg.sendMessage(chatId, `✅ تم التحديث. الصفحات: ${branchesCache.length}`);
    }
    return;
  }

  if (session.step === 'waiting_caption') {
    session.caption = cmd === '/same' ? session.originalCaption || '' : text;
    session.step = 'waiting_tags';
    await setSession(userId, session);
    const note = cmd === '/same' ? 'تم استخدام الكابشن الأصلي.' : 'تم حفظ الكابشن.';
    return tg.sendMessage(chatId, `👍 ${note}\n\n🏷️ أرسل الهاشتاقات أو /notags`);
  }

  if (session.step === 'waiting_tags') {
    const tags = cmd === '/notags' ? '' : text;
    session.finalCaption = session.caption + (tags ? '\n\n' + tags : '');
    session.step = 'selecting_branches';
    session.selectedBranches = branchesCache.map((_, i) => i);
    await setSession(userId, session);

    return tg.sendMessage(chatId, `✅ <b>معاينة:</b>\n\n${escapeHtml(session.finalCaption)}\n\n📢 اختر الصفحات:`, {
      parse_mode: 'HTML',
      reply_markup: buildKeyboard(session.selectedBranches),
    });
  }

  if (session.step === 'idle') {
    return tg.sendMessage(chatId, '🔗 أرسل رابط Reel من فيسبوك أو إنستغرام.');
  }
}

async function handleCallback(query) {
  const userId = query.from.id;
  const chatId = query.message.chat.id;
  const msgId = query.message.message_id;
  if (!isAllowed(userId)) return tg.answerCallbackQuery(query.id, '⛔');

  await getBranches();
  const session = await getSession(userId);
  session.userId = userId;
  const data = query.data;

  if (data === 'cancel') {
    if (session.video?.type === 'file' && session.video.filePath && fs.existsSync(session.video.filePath)) {
      try {
        fs.unlinkSync(session.video.filePath);
      } catch {
        /* ignore */
      }
    }
    await clearSession(userId);
    await tg.editMessageText(chatId, msgId, '❌ تم الإلغاء. أرسل رابطاً جديداً.');
    return tg.answerCallbackQuery(query.id);
  }

  if (data.startsWith('t_')) {
    const idx = parseInt(data.slice(2), 10);
    if (!session.selectedBranches) session.selectedBranches = [];
    if (session.selectedBranches.includes(idx)) {
      session.selectedBranches = session.selectedBranches.filter((i) => i !== idx);
    } else {
      session.selectedBranches.push(idx);
    }
    await setSession(userId, session);
    await tg.editMessageReplyMarkup(chatId, msgId, buildKeyboard(session.selectedBranches));
    return tg.answerCallbackQuery(query.id);
  }

  if (data === 'pub') {
    if (!session.selectedBranches?.length) {
      return tg.answerCallbackQuery(query.id, '⚠️ اختر صفحة واحدة على الأقل!');
    }

    await tg.answerCallbackQuery(query.id);
    const status = await tg.sendMessage(chatId, '⏳ جاري النشر على فيسبوك...');

    try {
      const results = await publishToPages(session);
      await tg.editMessageText(
        chatId,
        status.message_id,
        `🎉 النتائج:\n\n${results.join('\n')}\n\n🔗 أرسل رابط Reel جديداً.`
      );
      await clearSession(userId);
    } catch (err) {
      await tg.editMessageText(chatId, status.message_id, `❌ ${err.message}`);
      session.step = 'idle';
      await setSession(userId, session);
    }
  }
}

async function processUpdate(update) {
  try {
    if (update.message) await handleMessage(update.message);
    if (update.callback_query) await handleCallback(update.callback_query);
  } catch (err) {
    console.error('processUpdate:', err);
  }
}

module.exports = { processUpdate, getBranches };
