/** استخراج الكابشن/الوصف من yt-dlp (-j) */
async function extractCaptionFromYtdlp(runYtdlp, cookieArgsArray, pageUrl) {
  try {
    const stdout = await runYtdlp([
      '--no-warnings',
      '--no-playlist',
      '--no-download',
      '-j',
      ...cookieArgsArray(),
      pageUrl,
    ]);
    const info = JSON.parse(stdout);
    for (const key of ['description', 'title', 'fulltitle', 'alt_title']) {
      const v = info[key];
      if (typeof v === 'string' && v.trim() && v !== 'NA') return v.trim();
    }
  } catch {
    /* بعض المواقع لا تُرجع وصفاً */
  }
  return '';
}

module.exports = { extractCaptionFromYtdlp };
