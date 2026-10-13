import { execFile } from 'child_process';
import path from 'path';
import fs from 'fs';
import os from 'os';

const BIN_DIR = path.resolve(process.cwd(), 'bin');
const YT_DLP_PATH = path.resolve(BIN_DIR, 'yt-dlp.exe');
const BIN_FFMPEG = path.resolve(BIN_DIR, 'ffmpeg.exe');

let FFMPEG_LOCATION = '';
if (fs.existsSync(/*turbopackIgnore: true*/ BIN_FFMPEG)) {
  FFMPEG_LOCATION = BIN_DIR;
} else {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const staticFfmpeg = require('ffmpeg-static') || '';
    if (staticFfmpeg && fs.existsSync(/*turbopackIgnore: true*/ staticFfmpeg)) {
      FFMPEG_LOCATION = path.dirname(staticFfmpeg);
    }
  } catch {
    FFMPEG_LOCATION = '';
  }
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

  const id = Math.random().toString(36).substring(2, 10);
  const ext = type === 'audio' ? (quality.includes('m4a') ? 'm4a' : 'mp3') : 'mp4';
  const safeBase = customTitle ? sanitizeFileName(customTitle) : `youtube_${id}`;
  
  // Use yt-dlp %(ext)s template to prevent extension conflicts during extraction
  const outputTemplate = path.join(TEMP_DIR, `${id}_${safeBase}.%(ext)s`);
  const expectedPath = path.join(TEMP_DIR, `${id}_${safeBase}.${ext}`);

  const args: string[] = ['--no-playlist', '--no-warnings'];

  if (FFMPEG_LOCATION) {
    args.push('--ffmpeg-location', FFMPEG_LOCATION);
  }

  if (type === 'audio') {
    const audioFmt = ext === 'm4a' ? 'm4a' : 'mp3';
    args.push(
      '-x',
      '--audio-format',
      audioFmt,
      '-o',
      outputTemplate
    );
  } else {
    const height = parseInt(quality) || 720;
    args.push(
      '-f',
      `bv*[height<=${height}][ext=mp4]+ba[ext=m4a]/bv*[height<=${height}]+ba/b[height<=${height}]/best`,
      '--merge-output-format',
      'mp4',
      '-o',
      outputTemplate
    );
  }

  args.push(url.trim());

  return new Promise((resolve, reject) => {
    execFile(
      YT_DLP_PATH,
      args,
      { maxBuffer: 1024 * 1024 * 60 },
      (error, stdout, stderr) => {
        if (error) {
          console.error('yt-dlp download error:', stderr || error.message);
          return reject(
            new Error(
              'Failed to download media. Please check URL or choose another format.'
            )
          );
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
