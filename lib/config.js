function fixMetaToken(token) {
  const t = token?.trim();
  if (t?.startsWith('bEAA')) return t.slice(1);
  return t;
}

module.exports = {
  GRAPH_API: 'https://graph.facebook.com/v19.0',
  BOT_TOKEN: process.env.TELEGRAM_BOT_TOKEN,
  META_ACCESS_TOKEN: fixMetaToken(process.env.META_ACCESS_TOKEN),
  PAGE_IDS_FILTER: (process.env.PAGE_IDS || '')
    .split(/[,;\n]/)
    .map((s) => s.trim())
    .filter(Boolean),
  ALLOWED_USERS: (process.env.ALLOWED_USERS || '')
    .split(',')
    .map((id) => parseInt(id.trim(), 10))
    .filter((id) => !Number.isNaN(id) && id > 0),
  /** عنوان ثابت للإنتاج (يفضّل WEBHOOK_BASE_URL؛ وإلا VERCEL_URL يتغيّر كل نشر) */
  VERCEL_URL:
    process.env.WEBHOOK_BASE_URL?.replace(/^https?:\/\//, '') ||
    process.env.VERCEL_PROJECT_PRODUCTION_URL?.replace(/^https?:\/\//, '') ||
    process.env.VERCEL_URL,
  WEBHOOK_SECRET: process.env.WEBHOOK_SECRET,
  COBALT_API_URL: process.env.COBALT_API_URL || 'https://api.cobalt.tools',
  COBALT_API_KEY: process.env.COBALT_API_KEY?.trim(),
  VIDEO_RESOLVER_URL: process.env.VIDEO_RESOLVER_URL,
  RESOLVER_SECRET: process.env.RESOLVER_SECRET?.trim(),
  RAPIDAPI_KEY: process.env.RAPIDAPI_KEY?.trim(),
  RAPIDAPI_HOST: process.env.RAPIDAPI_HOST?.trim(),
  RAPIDAPI_PATH: process.env.RAPIDAPI_PATH?.trim() || '/download',
  RAPIDAPI_METHOD: (process.env.RAPIDAPI_METHOD?.trim() || 'GET').toUpperCase(),
  RAPIDAPI_URL_PARAM: process.env.RAPIDAPI_URL_PARAM?.trim() || 'url',
  IS_VERCEL: !!process.env.VERCEL,
};
