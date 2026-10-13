import { spawn, execFile } from 'child_process';
import path from 'path';
import fs from 'fs';
import os from 'os';

const YT_DLP_PATH = path.resolve(process.cwd(), 'bin', 'yt-dlp.exe');
let FFMPEG_PATH = '';
try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  FFMPEG_PATH = require('ffmpeg-static') || '';
} catch {
  FFMPEG_PATH = '';
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

// Clean up files older than 30 minutes in temp directory
export function cleanOldTempFiles() {
  try {
    const files = fs.readdirSync(TEMP_DIR);
    const now = Date.now();
    for (const f of files) {
      const fullPath = path.join(TEMP_DIR, f);
      const stat = fs.statSync(fullPath);
      if (now - stat.mtimeMs > 30 * 60 * 1000) {
        fs.unlinkSync(fullPath);
      }
    }
  } catch (err) {
    console.error('Error cleaning temp files:', err);
  }
}

// Sanitize filename for safe HTTP download headers
export function sanitizeFileName(name: string): string {
  return name.replace(/[\\/:*?"<>|]/g, '').trim().substring(0, 100) || 'youtube_download';
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
  const rawFileName = customTitle ? `${sanitizeFileName(customTitle)}.${ext}` : `youtube_${id}.${ext}`;
  const outPath = path.join(TEMP_DIR, `${id}_${rawFileName}`);

  const args: string[] = [
    '--no-playlist',
    '--no-warnings',
  ];

  if (FFMPEG_PATH && fs.existsSync(FFMPEG_PATH)) {
    args.push('--ffmpeg-location', FFMPEG_PATH);
  }

  if (type === 'audio') {
    if (ext === 'm4a') {
      args.push(
        '-f',
        'ba[ext=m4a]/ba',
        '-o',
        outPath
      );
    } else {
      args.push(
        '-x',
        '--audio-format',
        'mp3',
        '--audio-quality',
        quality.includes('320') ? '320k' : '192k',
        '-o',
        outPath
      );
    }
  } else {
    const height = parseInt(quality) || 720;
    args.push(
      '-f',
      `bv*[height<=${height}][ext=mp4]+ba[ext=m4a]/bv*[height<=${height}]+ba/b[height<=${height}]/best`,
      '--merge-output-format',
      'mp4',
      '-o',
      outPath
    );
  }

  args.push(url.trim());

  return new Promise((resolve, reject) => {
    execFile(
      YT_DLP_PATH,
      args,
      { maxBuffer: 1024 * 1024 * 50 },
      (error, stdout, stderr) => {
        if (error) {
          console.error('yt-dlp download error:', stderr || error.message);
          return reject(new Error('Failed to download video. Please verify the URL.'));
        }

        // Locate created file (sometimes yt-dlp adjusts extension)
        let finalFilePath = outPath;
        if (!fs.existsSync(finalFilePath)) {
          // Look for any file matching prefix id_ in temp folder
          const files = fs.readdirSync(TEMP_DIR);
          const found = files.find(f => f.startsWith(`${id}_`));
          if (found) {
            finalFilePath = path.join(TEMP_DIR, found);
          } else {
            return reject(new Error('Downloaded file could not be found.'));
          }
        }

        const actualFileName = path.basename(finalFilePath).replace(new RegExp(`^${id}_`), '');
        const actualExt = path.extname(actualFileName).toLowerCase();
        const contentType =
          actualExt === '.mp3' ? 'audio/mpeg' :
          actualExt === '.m4a' ? 'audio/mp4' :
          'video/mp4';

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
