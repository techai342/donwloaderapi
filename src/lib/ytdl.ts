import { execFile, spawn } from 'child_process';
import path from 'path';
import fs from 'fs';

// Resolve binaries
const YT_DLP_PATH = path.resolve(process.cwd(), 'bin', 'yt-dlp.exe');
let FFMPEG_PATH = '';
try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  FFMPEG_PATH = require('ffmpeg-static') || '';
} catch {
  FFMPEG_PATH = '';
}

export interface VideoFormatOption {
  id: string;
  quality: string;
  resolution?: string;
  ext: string;
  type: 'video' | 'audio';
  filesizeText?: string;
  label: string;
  isPopular?: boolean;
}

export interface VideoInfoResult {
  id: string;
  title: string;
  description: string;
  duration: string;
  durationSeconds: number;
  thumbnail: string;
  author: string;
  channelUrl: string;
  viewCount: string;
  uploadDate: string;
  formats: {
    videos: VideoFormatOption[];
    audios: VideoFormatOption[];
  };
}

// Validate YouTube URL
export function isValidYoutubeUrl(url: string): boolean {
  if (!url || typeof url !== 'string') return false;
  const regex = /^(https?:\/\/)?(www\.|m\.)?(youtube\.com\/(watch\?v=|shorts\/|embed\/|v\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/;
  return regex.test(url.trim());
}

// Format seconds into MM:SS or HH:MM:SS
function formatDuration(seconds: number): string {
  if (!seconds || isNaN(seconds)) return '0:00';
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  if (hrs > 0) {
    return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

// Format numbers into human-readable views (e.g. 1.2M)
function formatViews(views: number): string {
  if (!views || isNaN(views)) return 'N/A';
  if (views >= 1_000_000_000) return `${(views / 1_000_000_000).toFixed(1)}B`;
  if (views >= 1_000_000) return `${(views / 1_000_000).toFixed(1)}M`;
  if (views >= 1_000) return `${(views / 1_000).toFixed(1)}K`;
  return views.toLocaleString();
}

// Format date into YYYY-MM-DD
function formatDate(rawDate: string): string {
  if (!rawDate || rawDate.length !== 8) return rawDate || 'N/A';
  return `${rawDate.slice(0, 4)}-${rawDate.slice(4, 6)}-${rawDate.slice(6, 8)}`;
}

// Format bytes to human readable MB/GB
function formatBytes(bytes?: number): string | undefined {
  if (!bytes || isNaN(bytes)) return undefined;
  if (bytes >= 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
  if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  if (bytes >= 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${bytes} B`;
}

// Extract Video Info using yt-dlp
export async function getVideoInfo(url: string): Promise<VideoInfoResult> {
  if (!fs.existsSync(YT_DLP_PATH)) {
    throw new Error('yt-dlp binary is not installed on the server.');
  }

  const cleanUrl = url.trim();
  const args = [
    '-J',
    '--no-playlist',
    '--no-warnings',
    cleanUrl,
  ];

  if (FFMPEG_PATH && fs.existsSync(FFMPEG_PATH)) {
    args.push('--ffmpeg-location', FFMPEG_PATH);
  }

  return new Promise((resolve, reject) => {
    execFile(
      YT_DLP_PATH,
      args,
      { maxBuffer: 1024 * 1024 * 30 },
      (error, stdout, stderr) => {
        if (error) {
          console.error('yt-dlp error:', stderr || error.message);
          return reject(new Error('Failed to retrieve video information. Please ensure the link is public and valid.'));
        }

        try {
          const raw = JSON.parse(stdout);
          const rawFormats = raw.formats || [];

          // Available video heights found in the stream
          const availableHeights = new Set<number>();
          for (const f of rawFormats) {
            if (f.height) availableHeights.add(f.height);
          }

          // Pre-defined desired video quality options
          const targetQualities = [
            { height: 2160, label: '4K Ultra HD (2160p)', quality: '4K', id: '2160' },
            { height: 1440, label: '2K Quad HD (1440p)', quality: '2K', id: '1440' },
            { height: 1080, label: '1080p Full HD', quality: '1080p', isPopular: true, id: '1080' },
            { height: 720, label: '720p HD', quality: '720p', isPopular: true, id: '720' },
            { height: 480, label: '480p Standard', quality: '480p', id: '480' },
            { height: 360, label: '360p Compact', quality: '360p', id: '360' },
          ];

          const videos: VideoFormatOption[] = [];

          for (const target of targetQualities) {
            // Find highest matching or closest available format
            const hasFormat = Array.from(availableHeights).some(h => h >= target.height - 40 && h <= target.height + 40);
            if (hasFormat || (target.height <= 720 && availableHeights.size > 0)) {
              // Estimate file size if available
              const fmtMatch = rawFormats.find((f: { height?: number; filesize?: number }) => f.height === target.height && f.filesize);
              videos.push({
                id: target.id,
                quality: target.quality,
                resolution: `${target.height}p`,
                ext: 'mp4',
                type: 'video',
                filesizeText: fmtMatch ? formatBytes(fmtMatch.filesize) : undefined,
                label: target.label,
                isPopular: target.isPopular,
              });
            }
          }

          // If no specific height matched, fallback to at least Best / 720p / 360p
          if (videos.length === 0) {
            videos.push(
              { id: '1080', quality: '1080p', resolution: '1080p', ext: 'mp4', type: 'video', label: '1080p Full HD', isPopular: true },
              { id: '720', quality: '720p', resolution: '720p', ext: 'mp4', type: 'video', label: '720p HD', isPopular: true },
              { id: '360', quality: '360p', resolution: '360p', ext: 'mp4', type: 'video', label: '360p Compact' }
            );
          }

          // Audio options
          const audios: VideoFormatOption[] = [
            {
              id: 'mp3-320',
              quality: '320 kbps',
              ext: 'mp3',
              type: 'audio',
              label: 'MP3 High Quality (320 kbps)',
              isPopular: true,
            },
            {
              id: 'mp3-192',
              quality: '192 kbps',
              ext: 'mp3',
              type: 'audio',
              label: 'MP3 Standard (192 kbps)',
            },
            {
              id: 'm4a-128',
              quality: '128 kbps',
              ext: 'm4a',
              type: 'audio',
              label: 'M4A / AAC Audio (128 kbps)',
            },
          ];

          // Best thumbnail
          const thumbnail = raw.thumbnail || (raw.thumbnails && raw.thumbnails.length > 0 ? raw.thumbnails[raw.thumbnails.length - 1].url : '');

          const result: VideoInfoResult = {
            id: raw.id || '',
            title: raw.title || 'YouTube Video',
            description: (raw.description || '').slice(0, 300),
            duration: formatDuration(raw.duration || 0),
            durationSeconds: raw.duration || 0,
            thumbnail,
            author: raw.uploader || raw.channel || 'Unknown Artist',
            channelUrl: raw.uploader_url || raw.channel_url || `https://www.youtube.com/channel/${raw.channel_id || ''}`,
            viewCount: formatViews(raw.view_count || 0),
            uploadDate: formatDate(raw.upload_date || ''),
            formats: {
              videos,
              audios,
            },
          };

          resolve(result);
        } catch (parseError) {
          reject(new Error('Failed to parse video metadata: ' + (parseError as Error).message));
        }
      }
    );
  });
}

// Download stream creator
export function createDownloadProcess(url: string, quality: string, type: 'video' | 'audio') {
  if (!fs.existsSync(YT_DLP_PATH)) {
    throw new Error('yt-dlp binary is missing.');
  }

  const args: string[] = ['--no-warnings', '--no-playlist'];

  if (FFMPEG_PATH && fs.existsSync(FFMPEG_PATH)) {
    args.push('--ffmpeg-location', FFMPEG_PATH);
  }

  if (type === 'audio') {
    // For audio: extract audio and output to stream in MP3 or M4A
    // Using stdout stream
    args.push(
      '-x',
      '--audio-format',
      quality.includes('m4a') ? 'm4a' : 'mp3',
      '--audio-quality',
      quality.includes('320') ? '0' : '2',
      '-o',
      '-'
    );
  } else {
    // Video: select desired height + best audio merged to MP4
    const height = parseInt(quality) || 720;
    args.push(
      '-f',
      `bestvideo[height<=${height}][ext=mp4]+bestaudio[ext=m4a]/bestvideo[height<=${height}]+bestaudio/best[height<=${height}]/best`,
      '--recode-video',
      'mp4',
      '-o',
      '-'
    );
  }

  args.push(url);

  const proc = spawn(YT_DLP_PATH, args, {
    stdio: ['ignore', 'pipe', 'pipe'],
  });

  return proc;
}
