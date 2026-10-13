import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  return NextResponse.json({
    name: 'YouTube Downloader API',
    version: '1.0.0',
    status: 'online',
    description: 'High-performance API for extracting YouTube video metadata and downloading audio/video in multiple formats (1080p, 720p, 4K, MP3).',
    endpoints: {
      info: {
        method: 'GET',
        path: '/api/info?url={YOUTUBE_URL}',
        description: 'Fetch detailed video information including title, channel, duration, thumbnails, views, and available resolutions.',
        example: '/api/info?url=https://www.youtube.com/watch?v=dQw4w9WgXcQ',
      },
      download: {
        method: 'GET',
        path: '/api/download?url={YOUTUBE_URL}&quality={QUALITY}&type={TYPE}',
        description: 'Directly download and stream merged video or converted MP3 audio.',
        parameters: {
          url: 'Required YouTube video URL',
          quality: 'Target resolution or bitrate (e.g., "1080", "720", "480", "mp3-320", "mp3-192")',
          type: '"video" or "audio" (default: "video")',
          title: 'Optional customized filename for the downloaded file',
        },
        examples: [
          '/api/download?url=https://www.youtube.com/watch?v=dQw4w9WgXcQ&quality=1080&type=video',
          '/api/download?url=https://www.youtube.com/watch?v=dQw4w9WgXcQ&quality=mp3-320&type=audio',
        ],
      },
    },
  });
}
