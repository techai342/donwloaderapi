import { NextRequest, NextResponse } from 'next/server';
import { downloadToFile, sanitizeFileName } from '@/lib/downloader';
import { isValidYoutubeUrl } from '@/lib/ytdl';
import path from 'path';
import fs from 'fs';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const { url, quality, type, title } = body;

    if (!url) {
      return NextResponse.json(
        { success: false, error: 'Missing "url" property in JSON body.' },
        { status: 400 }
      );
    }

    if (!isValidYoutubeUrl(url)) {
      return NextResponse.json(
        { success: false, error: 'Invalid YouTube URL. Please provide a valid link.' },
        { status: 400 }
      );
    }

    // Process and download to local cached file
    const downloadInfo = await downloadToFile(
      url,
      quality || '720',
      (type as 'video' | 'audio') || 'video',
      title
    );

    const fileStat = fs.statSync(downloadInfo.filePath);
    const fileId = path.basename(downloadInfo.filePath);

    return NextResponse.json({
      success: true,
      fileId,
      fileName: downloadInfo.fileName,
      size: fileStat.size,
      contentType: downloadInfo.contentType,
      downloadUrl: `/api/download?fileId=${encodeURIComponent(fileId)}&name=${encodeURIComponent(
        downloadInfo.fileName
      )}`,
    });
  } catch (error) {
    console.error('API /api/prepare error:', error);
    return NextResponse.json(
      {
        success: false,
        error: (error as Error).message || 'Failed to prepare video download.',
      },
      { status: 500 }
    );
  }
}
