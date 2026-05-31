const { execFile } = require('child_process');
const { promisify } = require('util');
const path = require('path');
const fs = require('fs');
const os = require('os');
const YtDlpWrap = require('yt-dlp-wrap').default;

const execFileAsync = promisify(execFile);
const BIN_DIR = path.join(__dirname, '..', 'bin');
let binaryPath = null;
let downloadPromise = null;
let ffmpegAvailable = null;

function cookieArgsArray() {
  const browser = process.env.YTDLP_COOKIES_BROWSER?.trim();
  const cookiesFile = process.env.YTDLP_COOKIES_FILE?.trim();
  if (browser) return ['--cookies-from-browser', browser];
  if (cookiesFile) return ['--cookies', cookiesFile];
  return [];
}

async function findSystemYtdlp() {
  const custom = process.env.YTDLP_PATH?.trim();
  if (custom && fs.existsSync(custom)) return custom;

  const candidates = ['yt-dlp', 'yt-dlp.exe'];
  if (process.platform === 'win32') {
    candidates.push('py', 'python', 'python3');
  }

  for (const cmd of ['yt-dlp', 'yt-dlp.exe']) {
    try {
      await execFileAsync(cmd, ['--version'], { timeout: 10000, windowsHide: true });
      return cmd;
    } catch {
      /* try next */
    }
  }

  for (const py of ['py', 'python', 'python3']) {
    try {
      await execFileAsync(py, ['-m', 'yt_dlp', '--version'], { timeout: 15000, windowsHide: true });
      return py;
    } catch {
      /* try next */
    }
  }

  return null;
}

async function ensureBundledBinary() {
  if (binaryPath && fs.existsSync(binaryPath)) return binaryPath;

  if (downloadPromise) return downloadPromise;

  downloadPromise = (async () => {
    if (!fs.existsSync(BIN_DIR)) fs.mkdirSync(BIN_DIR, { recursive: true });

    const fileName = process.platform === 'win32' ? 'yt-dlp.exe' : 'yt-dlp';
    const targetPath = path.join(BIN_DIR, fileName);

    if (fs.existsSync(targetPath)) {
      binaryPath = targetPath;
      return binaryPath;
    }

    console.log('📦 جاري تنزيل yt-dlp لأول مرة (مرة واحدة)...');
    await YtDlpWrap.downloadFromGithub(targetPath, undefined, process.platform);
    binaryPath = targetPath;
    console.log('✅ yt-dlp جاهز:', binaryPath);
    return binaryPath;
  })();

  return downloadPromise;
}

async function getYtdlpExecutable() {
  const system = await findSystemYtdlp();
  if (system === 'py' || system === 'python' || system === 'python3') {
    return { cmd: system, prefixArgs: ['-m', 'yt_dlp'] };
  }
  if (system) {
    return { cmd: system, prefixArgs: [] };
  }

  const bundled = await ensureBundledBinary();
  return { cmd: bundled, prefixArgs: [] };
}

/**
 * @param {string[]} args - وسائر yt-dlp (بدون اسم الأمر)
 * @returns {Promise<string>} stdout
 */
async function runYtdlp(args) {
  const { cmd, prefixArgs } = await getYtdlpExecutable();
  const fullArgs = [...prefixArgs, ...args];
  try {
    const { stdout, stderr } = await execFileAsync(cmd, fullArgs, {
      maxBuffer: 20 * 1024 * 1024,
      timeout: 300000,
      windowsHide: true,
    });
    if (stderr) console.warn('yt-dlp:', String(stderr).slice(0, 500));
    return stdout;
  } catch (err) {
    const detail = err.stderr?.toString() || err.message;
    throw new Error(`yt-dlp: ${detail.slice(0, 300)}`);
  }
}

async function checkFfmpeg() {
  if (ffmpegAvailable !== null) return ffmpegAvailable;
  for (const cmd of ['ffmpeg', 'ffmpeg.exe']) {
    try {
      await execFileAsync(cmd, ['-version'], { timeout: 8000, windowsHide: true });
      ffmpegAvailable = true;
      return true;
    } catch {
      /* try next */
    }
  }
  ffmpegAvailable = false;
  return false;
}

/** صيغة تحميل: مع ffmpeg دمج عالي الجودة، بدونه ملف mp4 واحد */
async function getDownloadFormatArgs() {
  if (await checkFfmpeg()) {
    return [
      '-f',
      'bestvideo[ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]/best',
      '--merge-output-format',
      'mp4',
    ];
  }
  return ['-f', 'best[ext=mp4]/best[height<=1080]/best'];
}

module.exports = {
  runYtdlp,
  cookieArgsArray,
  getYtdlpExecutable,
  checkFfmpeg,
  getDownloadFormatArgs,
};
