const axios = require('axios');
const fs = require('fs');
const path = require('path');
const os = require('os');
const {
  COBALT_API_URL,
  COBALT_API_KEY,
  VIDEO_RESOLVER_URL,
  RESOLVER_SECRET,
  RAPIDAPI_KEY,
  RAPIDAPI_HOST,
  RAPIDAPI_PATH,
  RAPIDAPI_METHOD,
  RAPIDAPI_URL_PARAM,
  IS_VERCEL,
} = require('./config');

const TMP = path.join(os.tmpdir(), 'reelbot');

function cobaltHeaders() {
  const h = {
    Accept: 'application/json',
    'Content-Type': 'application/json',
  };
  if (COBALT_API_KEY) {
    h.Authorization = COBALT_API_KEY.startsWith('Bearer ')
      ? COBALT_API_KEY
      : `Api-Key ${COBALT_API_KEY}`;
  }
  return h;
}

function extractMp4FromText(text) {
  const m = text.match(/https?:\/\/[^\s"'<>]+\.mp4[^\s"'<>]*/i);
  return m ? m[0] : null;
}

function pickUrlDeep(obj, depth = 0) {
  if (depth > 8 || obj == null) return null;

  if (typeof obj === 'string') {
    if (obj.includes('.mp4') && obj.startsWith('http')) return obj;
    return extractMp4FromText(obj);
  }

  if (Array.isArray(obj)) {
    for (const item of obj) {
      const found = pickUrlDeep(item, depth + 1);
      if (found) return found;
    }
    return null;
  }

  if (typeof obj === 'object') {
    for (const key of ['hd', 'sd', 'HD', 'SD', 'video', 'videoUrl', 'downloadUrl', 'download']) {
      const v = obj[key];
      if (typeof v === 'string' && v.startsWith('http') && (v.includes('.mp4') || key.toLowerCase().includes('video'))) {
        return v;
      }
    }
    for (const v of Object.values(obj)) {
      const found = pickUrlDeep(v, depth + 1);
      if (found) return found;
    }
  }
  return null;
}

function pickUrl(obj) {
  if (!obj || typeof obj !== 'object') return null;
  if (typeof obj === 'string' && obj.startsWith('http')) return obj;

  const direct =
    obj.download_url ||
    obj.download_link ||
    obj.video_url ||
    obj.videoUrl ||
    obj.url ||
    obj.directUrl ||
    obj.link;
  if (typeof direct === 'string' && direct.startsWith('http')) return direct;

  if (obj.links) {
    const fromLinks = obj.links.hd || obj.links.sd || obj.links.video || obj.links.mp4;
    if (typeof fromLinks === 'string' && fromLinks.startsWith('http')) return fromLinks;
  }
  if (Array.isArray(obj.medias) && obj.medias[0]?.url) return obj.medias[0].url;
  if (Array.isArray(obj.videos) && obj.videos[0]?.url) return obj.videos[0].url;
  if (Array.isArray(obj.available_formats)) {
    const best = obj.available_formats.find((f) => f.url) || obj.available_formats[0];
    if (best?.url) return best.url;
  }
  if (obj.video_info) {
    const nested = pickUrl(obj.video_info);
    if (nested) return nested;
  }
  if (obj.data) {
    const nested = pickUrl(obj.data);
    if (nested) return nested;
  }
  if (obj.result) {
    const nested = pickUrl(obj.result);
    if (nested) return nested;
  }

  return pickUrlDeep(obj);
}

function pickCaption(obj) {
  if (!obj || typeof obj !== 'object') return '';
  const c =
    obj.caption ||
    obj.description ||
    obj.title ||
    obj.text ||
    obj.video_info?.title ||
    obj.video_info?.description ||
    (obj.data && (obj.data.caption || obj.data.title || obj.data.description)) ||
    '';
  return String(c).trim();
}

function parseCobaltResponse(data) {
  if (data.status === 'error' || data.error) {
    throw new Error(data.error?.code || data.text || 'فشل cobalt');
  }
  if (data.status === 'picker' && Array.isArray(data.picker)) {
    const video = data.picker.find((p) => p.type === 'video' || p.url);
    if (video?.url) return { type: 'url', directUrl: video.url, caption: '' };
  }
  const direct = data.url || data.redirect;
  if (direct && (data.status === 'tunnel' || data.status === 'redirect')) {
    return { type: 'url', directUrl: direct, caption: pickCaption(data.output?.metadata || data) };
  }
  if (direct) return { type: 'url', directUrl: direct, caption: '' };
  throw new Error('لا يوجد رابط فيديو في رد cobalt');
}

async function resolveViaYtdlpUrl(pageUrl) {
  const { runYtdlp, cookieArgsArray } = require('./ytdlp');
  const stdout = await runYtdlp([
    '-g',
    '-f',
    'best[ext=mp4]/best',
    '--no-playlist',
    ...cookieArgsArray(),
    pageUrl,
  ]);
  const urls = stdout
    .trim()
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l.startsWith('http'));
  if (urls.length >= 1) {
    return { type: 'url', directUrl: urls[0], caption: '' };
  }
  return resolveViaYtdlpFile(pageUrl);
}

async function resolveViaYtdlpFile(pageUrl) {
  const { runYtdlp, cookieArgsArray, getDownloadFormatArgs } = require('./ytdlp');
  if (!fs.existsSync(TMP)) fs.mkdirSync(TMP, { recursive: true });
  const out = path.join(TMP, `dl_${Date.now()}.mp4`);
  await runYtdlp([
    ...(await getDownloadFormatArgs()),
    '--no-playlist',
    '--no-part',
    '-o',
    out,
    ...cookieArgsArray(),
    pageUrl,
  ]);
  if (!fs.existsSync(out)) throw new Error('فشل تحميل الفيديو');
  return { type: 'file', filePath: out, caption: '' };
}

async function resolveViaCustomApi(pageUrl) {
  const headers = { 'Content-Type': 'application/json' };
  if (RESOLVER_SECRET) {
    headers.Authorization = `Bearer ${RESOLVER_SECRET}`;
    headers['x-resolver-secret'] = RESOLVER_SECRET;
  }
  const { data } = await axios.post(
    VIDEO_RESOLVER_URL,
    { url: pageUrl },
    { timeout: 55000, headers }
  );
  const direct = pickUrl(data);
  if (!direct) throw new Error('لم يُرجع محلّل الفيديو رابط تحميل');
  return { type: 'url', directUrl: direct, caption: pickCaption(data) };
}

function normalizeRapidApiData(raw) {
  if (raw == null) return null;
  if (typeof raw === 'string') {
    const s = raw.trim();
    if (s.startsWith('{') || s.startsWith('[')) {
      try {
        return JSON.parse(s);
      } catch {
        /* continue */
      }
    }
    const mp4 = extractMp4FromText(s);
    if (mp4) return { download_url: mp4 };
    if (s.startsWith('<!DOCTYPE') || s.startsWith('<html')) {
      throw new Error('RapidAPI: انتهى الحص — استخدم npm start محلياً (مجاني)');
    }
    return null;
  }
  if (typeof raw === 'object') return raw;
  return null;
}

async function resolveViaRapidApi(pageUrl) {
  const host = RAPIDAPI_HOST.replace(/^https?:\/\//, '');
  const apiPath = RAPIDAPI_PATH.startsWith('/') ? RAPIDAPI_PATH : `/${RAPIDAPI_PATH}`;
  const headers = {
    Accept: 'application/json',
    'x-rapidapi-key': RAPIDAPI_KEY,
    'x-rapidapi-host': host,
    'Content-Type': 'application/json',
  };
  const base = `https://${host}${apiPath}`;
  const payload = { [RAPIDAPI_URL_PARAM]: pageUrl };

  const res =
    RAPIDAPI_METHOD === 'POST'
      ? await axios.post(base, payload, { timeout: 45000, headers })
      : await axios.get(base, { params: payload, timeout: 45000, headers });

  const data = normalizeRapidApiData(res.data);
  if (!data) throw new Error('RapidAPI: رد غير صالح');
  const direct = pickUrl(data);
  if (!direct) throw new Error('RapidAPI: لا يوجد رابط فيديو');
  return { type: 'url', directUrl: direct, caption: pickCaption(data) };
}

async function resolveViaCobalt(pageUrl) {
  const { data } = await axios.post(
    `${COBALT_API_URL}/`,
    { url: pageUrl, downloadMode: 'auto', filenameStyle: 'basic' },
    { timeout: 45000, headers: cobaltHeaders() }
  );
  return parseCobaltResponse(data);
}

function freeModeHint() {
  return (
    'استخراج الفيديو المجاني يعمل بتشغيل البوت على جهازك:\n' +
    '  cd reel-bot\n' +
    '  npm start\n' +
    '(يحمّل yt-dlp تلقائياً — بدون RapidAPI)\n\n' +
    'Vercel لا يدعم yt-dlp؛ للنشر السحابي المجاني استخدم جهازك أو VPS.'
  );
}

/**
 * محلياً: yt-dlp أولاً (مجاني).
 * Vercel: يحتاج VIDEO_RESOLVER_URL أو RapidAPI (مدفوع).
 */
async function resolveVideo(pageUrl) {
  const errors = [];

  if (!IS_VERCEL) {
    try {
      return await resolveViaYtdlpUrl(pageUrl);
    } catch (e) {
      errors.push(`yt-dlp: ${e.message}`);
    }
  }

  if (VIDEO_RESOLVER_URL) {
    try {
      return await resolveViaCustomApi(pageUrl);
    } catch (e) {
      errors.push(`custom: ${e.message}`);
    }
  }

  if (RAPIDAPI_KEY && RAPIDAPI_HOST) {
    try {
      return await resolveViaRapidApi(pageUrl);
    } catch (e) {
      errors.push(`rapidapi: ${e.message}`);
    }
  }

  if (COBALT_API_KEY) {
    try {
      return await resolveViaCobalt(pageUrl);
    } catch (e) {
      errors.push(`cobalt: ${e.message}`);
    }
  }

  console.warn('resolveVideo failed:', errors.join(' | '));
  throw new Error(IS_VERCEL ? freeModeHint() : `تعذّر استخراج الفيديو.\n${errors.join('\n')}`);
}

module.exports = { resolveVideo };
