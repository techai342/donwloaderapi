import { NextRequest, NextResponse } from 'next/server';
import { downloadToFile } from '@/lib/downloader';
import { isValidYoutubeUrl } from '@/lib/ytdl';
import fs from 'fs';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  let cleanupFn: (() => void) | null = null;

  try {
    const { searchParams } = new URL(request.url);
    const url = searchParams.get('url');
    const quality = searchParams.get('quality') || '720';
    const type = (searchParams.get('type') || 'video') as 'video' | 'audio';
    const customTitle = searchParams.get('title') || undefined;

    if (!url) {
      return NextResponse.json(
        { success: false, error: 'Missing "url" query parameter.' },
        { status: 400 }
      );
    }

    if (!isValidYoutubeUrl(url)) {
      return NextResponse.json(
        { success: false, error: 'Invalid YouTube URL.' },
        { status: 400 }
      );
    }

    // Process and download to local cached file
    const downloadInfo = await downloadToFile(url, quality, type, customTitle);
    cleanupFn = downloadInfo.cleanup;

    const fileStat = fs.statSync(downloadInfo.filePath);
    const nodeStream = fs.createReadStream(downloadInfo.filePath);

    // Convert Node ReadStream into Web ReadableStream for Next.js response
    const webStream = new ReadableStream({
      start(controller) {
        nodeStream.on('data', (chunk) => {
          controller.enqueue(chunk);
        });
        nodeStream.on('end', () => {
          controller.close();
          if (cleanupFn) cleanupFn();
        });
        nodeStream.on('error', (err) => {
          controller.error(err);
          if (cleanupFn) cleanupFn();
        });
      },
      cancel() {
        nodeStream.destroy();
        if (cleanupFn) cleanupFn();
      },
    });

    const headers = new Headers();
    headers.set('Content-Type', downloadInfo.contentType);
    headers.set('Content-Length', fileStat.size.toString());
    // Encode filename for safe headers
    const safeName = encodeURIComponent(downloadInfo.fileName);
    headers.set(
      'Content-Disposition',
      `attachment; filename="${downloadInfo.fileName.replace(/"/g, '')}"; filename*=UTF-8''${safeName}`
    );

    return new Response(webStream, {
      status: 200,
      headers,
    });
  } catch (error) {
    if (cleanupFn) cleanupFn();
    console.error('Download error:', error);
    return NextResponse.json(
      {
        success: false,
        error: (error as Error).message || 'Failed to process video download.',
      },
      { status: 500 }
    );
  }
}
