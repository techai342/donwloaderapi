import { NextRequest, NextResponse } from 'next/server';
import { getVideoInfo, isValidYoutubeUrl } from '@/lib/ytdl';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const url = searchParams.get('url');

    if (!url) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing "url" query parameter. Example: /api/info?url=https://www.youtube.com/watch?v=...',
        },
        { status: 400 }
      );
    }

    if (!isValidYoutubeUrl(url)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid YouTube URL. Please provide a valid YouTube video, shorts, or music link.',
        },
        { status: 400 }
      );
    }

    const info = await getVideoInfo(url);

    return NextResponse.json(
      {
        success: true,
        data: info,
      },
      {
        status: 200,
        headers: {
          'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=7200',
        },
      }
    );
  } catch (error) {
    console.error('API /api/info error:', error);
    return NextResponse.json(
      {
        success: false,
        error: (error as Error).message || 'Failed to fetch video information',
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const url = body.url;

    if (!url) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing "url" property in JSON body. Example: { "url": "https://www.youtube.com/watch?v=..." }',
        },
        { status: 400 }
      );
    }

    if (!isValidYoutubeUrl(url)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid YouTube URL. Please provide a valid YouTube video, shorts, or music link.',
        },
        { status: 400 }
      );
    }

    const info = await getVideoInfo(url);

    return NextResponse.json(
      {
        success: true,
        data: info,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('API POST /api/info error:', error);
    return NextResponse.json(
      {
        success: false,
        error: (error as Error).message || 'Failed to process request',
      },
      { status: 500 }
    );
  }
}
