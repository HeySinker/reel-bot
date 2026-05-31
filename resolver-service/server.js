/**
 * خدمة صغيرة لاستخراج رابط mp4 + كابشن — تُنشر على Render.
 */
const express = require('express');
const { execFile } = require('child_process');
const { promisify } = require('util');

const execFileAsync = promisify(execFile);
const app = express();
const PORT = process.env.PORT || 3080;
const SECRET = process.env.RESOLVER_SECRET?.trim();
const YTDLP = '/usr/local/bin/yt-dlp';

const ytdlp = (args) =>
  execFileAsync(YTDLP, args, { timeout: 120000, maxBuffer: 10 * 1024 * 1024 });

async function fetchCaption(url) {
  try {
    const { stdout } = await ytdlp(['--no-warnings', '--no-playlist', '--no-download', '-j', url]);
    const info = JSON.parse(stdout);
    for (const key of ['description', 'title', 'fulltitle', 'alt_title']) {
      const v = info[key];
      if (typeof v === 'string' && v.trim() && v !== 'NA') return v.trim();
    }
  } catch (e) {
    console.warn('caption:', e.message?.slice(0, 120));
  }
  return '';
}

app.use(express.json({ limit: '1mb' }));

app.get('/health', (_req, res) => {
  res.json({ ok: true });
});

app.post('/resolve', async (req, res) => {
  if (SECRET) {
    const auth = req.headers.authorization || req.headers['x-resolver-secret'];
    const token = auth?.startsWith('Bearer ') ? auth.slice(7) : auth;
    if (token !== SECRET) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
  }

  const url = req.body?.url?.trim();
  if (!url) {
    return res.status(400).json({ error: 'Missing url' });
  }

  try {
    const [videoOut, caption] = await Promise.all([
      ytdlp(['-g', '-f', 'best[ext=mp4]/best', '--no-playlist', url]),
      fetchCaption(url),
    ]);

    const direct = videoOut.stdout
      .trim()
      .split('\n')
      .map((l) => l.trim())
      .find((l) => l.startsWith('http'));

    if (!direct) {
      return res.status(422).json({ error: 'No video URL from yt-dlp' });
    }

    return res.json({ download_url: direct, caption });
  } catch (err) {
    console.error('resolve error:', err.stderr || err.message);
    return res.status(500).json({
      error: err.stderr?.toString().slice(0, 200) || err.message,
    });
  }
});

app.listen(PORT, () => {
  console.log(`resolver listening on ${PORT}`);
});
