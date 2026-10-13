import { execFile } from 'child_process';
import path from 'path';
import fs from 'fs';
import os from 'os';

// Resilient binary resolver that ensures yt-dlp is always present and executable on Vercel
export async function ensureExecutableBinary(): Promise<string> {
  if (process.platform === 'win32') {
    const winPath = path.resolve(process.cwd(), 'bin', 'yt-dlp.exe');
    if (fs.existsSync(/*turbopackIgnore: true*/ winPath)) return winPath;
  }

  // Target in writable /tmp (Lambda/Vercel standard)
  const targetPath = path.resolve(os.tmpdir(), 'yt-dlp-bin');

  if (fs.existsSync(/*turbopackIgnore: true*/ targetPath)) {
    try {
      fs.chmodSync(targetPath, 0o755);
    } catch {
      // Ignore
    }
    return targetPath;
  }

  // Look for bundled binary in candidate paths if they are valid ELF executables
  const candidates = [
    path.resolve(process.cwd(), 'bin', 'yt-dlp'),
    path.resolve(process.cwd(), 'public', 'bin', 'yt-dlp'),
  ];

  for (const src of candidates) {
    if (fs.existsSync(/*turbopackIgnore: true*/ src)) {
      try {
        const buf = Buffer.alloc(4);
        const fd = fs.openSync(/*turbopackIgnore: true*/ src, 'r');
        fs.readSync(fd, buf, 0, 4, 0);
        fs.closeSync(fd);

        // Check for Linux ELF magic bytes (\x7f E L F)
        if (buf[0] === 0x7f && buf[1] === 0x45 && buf[2] === 0x4c && buf[3] === 0x46) {
          fs.copyFileSync(src, targetPath);
          fs.chmodSync(targetPath, 0o755);
          return targetPath;
        }
      } catch (err) {
        console.warn('Failed to verify or copy binary candidate:', src, err);
      }
    }
  }

  // Auto-download standalone Linux binary to /tmp if not bundled (super fast on Vercel gigabit)
  try {
    console.info('Downloading standalone yt-dlp to /tmp...');
    const binUrl =
      process.platform === 'win32'
        ? 'https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp.exe'
        : 'https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp_linux';

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 20000);
    const res = await fetch(binUrl, { signal: controller.signal });
    clearTimeout(timeoutId);

    if (res.ok) {
      const buffer = Buffer.from(await res.arrayBuffer());
      fs.writeFileSync(targetPath, buffer);
      fs.chmodSync(targetPath, 0o755);
      return targetPath;
    }
  } catch (netErr) {
    console.error('Failed to auto-download yt-dlp to /tmp:', netErr);
  }

  return targetPath;
}

export function getExecutableBinaryPath(): string {
  if (process.platform === 'win32') {
    const winPath = path.resolve(process.cwd(), 'bin', 'yt-dlp.exe');
    if (fs.existsSync(/*turbopackIgnore: true*/ winPath)) return winPath;
  }
  const targetPath = path.resolve(os.tmpdir(), 'yt-dlp-bin');
  if (fs.existsSync(/*turbopackIgnore: true*/ targetPath)) return targetPath;
  return path.resolve(process.cwd(), 'bin', 'yt-dlp');
}

export function getCookiesFilePath(): string | null {
  // 1. Check if YOUTUBE_COOKIES environment variable is set
  const cookiesEnv = process.env.YOUTUBE_COOKIES;
  if (cookiesEnv && cookiesEnv.trim().length > 0) {
    const targetCookiesPath = path.resolve(os.tmpdir(), 'yt_cookies.txt');
    try {
      fs.writeFileSync(targetCookiesPath, cookiesEnv.trim(), 'utf-8');
      return targetCookiesPath;
    } catch (e) {
      console.warn('Failed to write YOUTUBE_COOKIES to /tmp:', e);
    }
  }

  // 2. Check if local cookies.txt file exists in project root or /tmp
  const localCandidates = [
    path.resolve(process.cwd(), 'cookies.txt'),
    path.resolve(os.tmpdir(), 'cookies.txt'),
  ];
  for (const c of localCandidates) {
    if (fs.existsSync(/*turbopackIgnore: true*/ c)) {
      return c;
    }
  }

  return null;
}

export function getFfmpegLocation(): string {
  const isWin = process.platform === 'win32';
  const binFfmpeg = path.resolve(process.cwd(), 'bin', isWin ? 'ffmpeg.exe' : 'ffmpeg');
  if (fs.existsSync(/*turbopackIgnore: true*/ binFfmpeg)) {
    return path.dirname(binFfmpeg);
  }
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const staticFfmpeg = require('ffmpeg-static') || '';
    if (staticFfmpeg && fs.existsSync(/*turbopackIgnore: true*/ staticFfmpeg)) {
      return path.dirname(staticFfmpeg);
    }
  } catch {
    // Ignore
  }
  return '';
}

// Temporary directory for processing downloads
const TEMP_DIR = path.resolve(os.tmpdir(), 'yt_downloader_cache');
if (!fs.existsSync(TEMP_DIR)) {
  fs.mkdirSync(TEMP_DIR, { recursive: true });
}

export interface DownloadResult {
  filePath: string;
  fileName: string;
  contentType: string;
  cleanup: () => void;
}

// Clean up files older than 20 minutes in temp directory
export function cleanOldTempFiles() {
  try {
    const files = fs.readdirSync(TEMP_DIR);
    const now = Date.now();
    for (const f of files) {
      const fullPath = path.join(TEMP_DIR, f);
      const stat = fs.statSync(fullPath);
      if (now - stat.mtimeMs > 20 * 60 * 1000) {
        fs.unlinkSync(fullPath);
      }
    }
  } catch (err) {
    console.error('Error cleaning temp files:', err);
  }
}

// Sanitize filename to ensure 100% Windows and RFC HTTP compatibility
export function sanitizeFileName(name: string): string {
  const cleaned = name
    .replace(/[\\/:*?"<>|#%&{}\\$!'`+@=^~[\]]/g, ' ')
    .replace(/[^\x20-\x7E]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .substring(0, 65);

  return cleaned || 'download';
}

async function downloadViaRapidApi(
  url: string,
  quality: string,
  type: 'video' | 'audio',
  customTitle?: string
): Promise<DownloadResult | null> {
  const rapidKey = process.env.RAPIDAPI_KEY;
  if (!rapidKey) return null;

  const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|shorts\/|embed\/|v\/))([a-zA-Z0-9_-]{11})/);
  if (!match) return null;
  const videoId = match[1];

  try {
    const res = await fetch(`https://yt-api.p.rapidapi.com/dl?id=${videoId}`, {
      headers: {
        'x-rapidapi-host': 'yt-api.p.rapidapi.com',
        'x-rapidapi-key': rapidKey,
      },
    });

    if (!res.ok) return null;
    const data = await res.json();
    const formats = (data.formats || data.adaptiveFormats || []) as Array<{
      mimeType?: string;
      ext?: string;
      height?: number;
      url?: string;
    }>;
    if (!formats || formats.length === 0) return null;

    let target = null;
    if (type === 'audio') {
      target = formats.find((f) => f.mimeType?.includes('audio') || f.ext === 'm4a' || f.ext === 'mp3') || formats[0];
    } else {
      const height = parseInt(quality) || 720;
      target = formats.find((f) => f.height && f.height <= height && f.url) || formats[0];
    }

    const downloadUrl = target?.url;
    if (!downloadUrl) return null;

    const id = Math.random().toString(36).substring(2, 10);
    const ext = type === 'audio' ? 'm4a' : 'mp4';
    const safeBase = customTitle ? sanitizeFileName(customTitle) : `youtube_${id}`;
    const filePath = path.join(TEMP_DIR, `${id}_${safeBase}.${ext}`);

    const fileStream = await fetch(downloadUrl);
    if (!fileStream.ok) return null;

    const buffer = Buffer.from(await fileStream.arrayBuffer());
    fs.writeFileSync(filePath, buffer);

    return {
      filePath,
      fileName: `${safeBase}.${ext}`,
      contentType: type === 'audio' ? 'audio/mp4' : 'video/mp4',
      cleanup: () => {
        try {
          if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
        } catch {
          // Ignore
        }
      },
    };
  } catch (err) {
    console.warn('RapidAPI download attempt failed:', err);
    return null;
  }
}

/**
 * Downloads a video or audio file to a temporary file with ffmpeg processing,
 * returning the file path and metadata for streaming.
 */
export async function downloadToFile(
  url: string,
  quality: string,
  type: 'video' | 'audio',
  customTitle?: string
): Promise<DownloadResult> {
  cleanOldTempFiles();

  // 1. Try RapidAPI if RAPIDAPI_KEY is configured
  if (process.env.RAPIDAPI_KEY) {
    const rapidResult = await downloadViaRapidApi(url, quality, type, customTitle);
    if (rapidResult) return rapidResult;
  }

  const binaryPath = await ensureExecutableBinary();
  const ffmpegLocation = getFfmpegLocation();
  const hasFfmpeg = !!ffmpegLocation;

  const id = Math.random().toString(36).substring(2, 10);
  const ext = type === 'audio' ? (quality.includes('m4a') ? 'm4a' : 'mp3') : 'mp4';
  const safeBase = customTitle ? sanitizeFileName(customTitle) : `youtube_${id}`;

  const outputTemplate = path.join(TEMP_DIR, `${id}_${safeBase}.%(ext)s`);
  const expectedPath = path.join(TEMP_DIR, `${id}_${safeBase}.${ext}`);

  const args: string[] = [
    '--no-playlist',
    '--no-warnings',
    '--no-check-certificates',
    '--geo-bypass',
    '--extractor-args',
    'youtube:player_client=android',
    '--user-agent',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
  ];

  const cookiesPath = getCookiesFilePath();
  if (cookiesPath) {
    args.push('--cookies', cookiesPath);
  }

  if (hasFfmpeg) {
    args.push('--ffmpeg-location', ffmpegLocation);
  }

  if (type === 'audio') {
    if (hasFfmpeg) {
      const audioFmt = ext === 'm4a' ? 'm4a' : 'mp3';
      args.push(
        '-x',
        '--audio-format',
        audioFmt,
        '--audio-quality',
        quality.includes('320') ? '320k' : '192k',
        '-o',
        outputTemplate
      );
    } else {
      args.push('-f', 'ba[ext=m4a]/ba/bestaudio', '-o', outputTemplate);
    }
  } else {
    const height = parseInt(quality) || 720;
    if (hasFfmpeg) {
      args.push(
        '-f',
        `bv*[height<=${height}][ext=mp4]+ba[ext=m4a]/bv*[height<=${height}]+ba/b[height<=${height}]/best`,
        '--merge-output-format',
        'mp4',
        '-o',
        outputTemplate
      );
    } else {
      args.push(
        '-f',
        `b[height<=${height}][ext=mp4]/b[height<=${height}]/best[ext=mp4]/best`,
        '-o',
        outputTemplate
      );
    }
  }

  args.push(url.trim());

  return new Promise((resolve, reject) => {
    execFile(
      binaryPath,
      args,
      { maxBuffer: 1024 * 1024 * 60 },
      (error, stdout, stderr) => {
        if (error) {
          const detail = (stderr || error.message || '').trim();
          console.error('yt-dlp download error:', detail);
          let userMessage = detail ? `Download failed: ${detail.substring(0, 160)}` : 'Failed to download media.';
          if (
            detail.includes('Sign in to confirm you’re not a bot') ||
            detail.includes("confirm you're not a bot") ||
            detail.includes('not a bot')
          ) {
            userMessage =
              'YouTube Bot Protection: YouTube has restricted this datacenter IP. Please add YOUTUBE_COOKIES to your Vercel Environment Variables.';
          }
          return reject(new Error(userMessage));
        }

        // Locate created file
        let finalFilePath = expectedPath;
        if (!fs.existsSync(finalFilePath)) {
          const files = fs.readdirSync(TEMP_DIR);
          const completedFiles = files.filter(
            (f) =>
              f.startsWith(`${id}_`) &&
              !f.endsWith('.part') &&
              !f.endsWith('.ytdl')
          );

          if (completedFiles.length > 0) {
            const exactExt = completedFiles.find((f) => f.endsWith(`.${ext}`));
            finalFilePath = path.join(TEMP_DIR, exactExt || completedFiles[0]);
          } else {
            return reject(new Error('Downloaded file could not be found.'));
          }
        }

        const actualFileName = path
          .basename(finalFilePath)
          .replace(new RegExp(`^${id}_`), '');
        const actualExt = path.extname(actualFileName).toLowerCase();
        const contentType =
          actualExt === '.mp3'
            ? 'audio/mpeg'
            : actualExt === '.m4a'
            ? 'audio/mp4'
            : 'video/mp4';

        resolve({
          filePath: finalFilePath,
          fileName: actualFileName,
          contentType,
          cleanup: () => {
            try {
              if (fs.existsSync(finalFilePath)) {
                fs.unlinkSync(finalFilePath);
              }
            } catch (err) {
              console.error('Error cleaning up file:', err);
            }
          },
        });
      }
    );
  });
}
