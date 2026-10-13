import { NextRequest, NextResponse } from 'next/server';
import { downloadToFile, sanitizeFileName } from '@/lib/downloader';
import { isValidYoutubeUrl } from '@/lib/ytdl';
import { Readable } from 'stream';
import path from 'path';
import os from 'os';
import fs from 'fs';

export const dynamic = 'force-dynamic';

const TEMP_DIR = path.resolve(os.tmpdir(), 'yt_downloader_cache');

export async function GET(request: NextRequest) {
  let cleanupFn: (() => void) | null = null;

  try {
    const { searchParams } = new URL(request.url);
    const fileId = searchParams.get('fileId');
    const customName = searchParams.get('name');

    // Fast-path: Pre-rendered file download (Instant response, IDM & browser compatible)
    if (fileId) {
      const safeId = path.basename(fileId);
      const filePath = path.join(TEMP_DIR, safeId);

      if (!fs.existsSync(filePath)) {
        return NextResponse.json(
          { success: false, error: 'File expired or not found. Please click Download again.' },
          { status: 404 }
        );
      }

      const fileStat = fs.statSync(filePath);
      const actualExt = path.extname(filePath).toLowerCase();
      const rawBaseName = customName || safeId.replace(/^[a-z0-9]+_/, '');
      const baseClean = sanitizeFileName(path.basename(rawBaseName, actualExt));
      const safeFinalName = `${baseClean}${actualExt}`;

      const contentType =
        actualExt === '.mp3'
          ? 'audio/mpeg'
          : actualExt === '.m4a'
          ? 'audio/mp4'
          : 'video/mp4';

      // Support Range header for IDM multi-part downloading & resuming
      const rangeHeader = request.headers.get('range');
      if (rangeHeader) {
        const parts = rangeHeader.replace(/bytes=/, '').split('-');
        const start = parseInt(parts[0], 10) || 0;
        const end = parts[1] ? parseInt(parts[1], 10) : fileStat.size - 1;
        const chunkSize = end - start + 1;

        const nodeStream = fs.createReadStream(filePath, { start, end });
        const webStream = Readable.toWeb(nodeStream) as ReadableStream<Uint8Array>;

        const headers = new Headers();
        headers.set('Content-Type', contentType);
        headers.set('Content-Range', `bytes ${start}-${end}/${fileStat.size}`);
        headers.set('Content-Length', chunkSize.toString());
        headers.set('Accept-Ranges', 'bytes');
        headers.set('Content-Disposition', `attachment; filename="${safeFinalName}"`);
        headers.set('Cache-Control', 'no-store, no-cache, must-revalidate');

        return new Response(webStream, {
          status: 206,
          headers,
        });
      }

      const nodeStream = fs.createReadStream(filePath);
      const webStream = Readable.toWeb(nodeStream) as ReadableStream<Uint8Array>;

      const headers = new Headers();
      headers.set('Content-Type', contentType);
      headers.set('Content-Length', fileStat.size.toString());
      headers.set('Content-Disposition', `attachment; filename="${safeFinalName}"`);
      headers.set('Accept-Ranges', 'bytes');
      headers.set('Cache-Control', 'no-store, no-cache, must-revalidate');

      // Schedule cleanup after 10 minutes so IDM can finish all parts safely
      setTimeout(() => {
        try {
          if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
        } catch {
          // Ignore
        }
      }, 600000);

      return new Response(webStream, {
        status: 200,
        headers,
      });
    }

    // Direct mode: on-demand rendering
    const url = searchParams.get('url');
    const quality = searchParams.get('quality') || '720';
    const type = (searchParams.get('type') || 'video') as 'video' | 'audio';
    const customTitle = searchParams.get('title') || undefined;

    if (!url) {
      return NextResponse.json(
        { success: false, error: 'Missing "url" or "fileId" query parameter.' },
        { status: 400 }
      );
    }

    if (!isValidYoutubeUrl(url)) {
      return NextResponse.json(
        { success: false, error: 'Invalid YouTube URL.' },
        { status: 400 }
      );
    }

    const downloadInfo = await downloadToFile(url, quality, type, customTitle);
    cleanupFn = downloadInfo.cleanup;

    const fileStat = fs.statSync(downloadInfo.filePath);
    const nodeStream = fs.createReadStream(downloadInfo.filePath);
    const webStream = Readable.toWeb(nodeStream) as ReadableStream<Uint8Array>;

    const actualExt = path.extname(downloadInfo.fileName);
    const baseClean = sanitizeFileName(path.basename(downloadInfo.fileName, actualExt));
    const safeFinalName = `${baseClean}${actualExt}`;

    const headers = new Headers();
    headers.set('Content-Type', downloadInfo.contentType);
    headers.set('Content-Length', fileStat.size.toString());
    headers.set('Content-Disposition', `attachment; filename="${safeFinalName}"`);
    headers.set('Accept-Ranges', 'bytes');
    headers.set('Cache-Control', 'no-store, no-cache, must-revalidate');

    setTimeout(() => {
      if (cleanupFn) cleanupFn();
    }, 120000);

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
        error: (error as Error).message || 'Failed to process media download.',
      },
      { status: 500 }
    );
  }
}
