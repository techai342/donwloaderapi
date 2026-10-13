'use client';

import React, { useState, useEffect } from 'react';
import { VideoInfo, VideoFormatOption } from '@/types';
import {
  Video,
  Music,
  Download,
  Copy,
  Check,
  Eye,
  Calendar,
  Clock,
  Sparkles,
  ExternalLink,
  Loader2,
  Share2,
  X,
  CheckCircle2,
  AlertTriangle,
  ArrowDownToLine,
} from 'lucide-react';

interface VideoCardProps {
  video: VideoInfo;
}

interface PrepareResponse {
  success: boolean;
  fileId?: string;
  fileName?: string;
  size?: number;
  downloadUrl?: string;
  error?: string;
}

export const VideoCard: React.FC<VideoCardProps> = ({ video }) => {
  const [activeTab, setActiveTab] = useState<'video' | 'audio'>('video');
  const [copiedLink, setCopiedLink] = useState<string | null>(null);
  const [showFullDesc, setShowFullDesc] = useState(false);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeFormat, setActiveFormat] = useState<VideoFormatOption | null>(null);
  const [modalStage, setModalStage] = useState<'preparing' | 'ready' | 'error'>('preparing');
  const [modalProgress, setModalProgress] = useState(15);
  const [modalMessage, setModalMessage] = useState('Contacting YouTube servers...');
  const [downloadLink, setDownloadLink] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const formats = activeTab === 'video' ? video.formats.videos : video.formats.audios;

  // Progress simulation while server prepares file
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isModalOpen && modalStage === 'preparing') {
      interval = setInterval(() => {
        setModalProgress((prev) => {
          if (prev < 40) {
            setModalMessage('Downloading high-speed media stream...');
            return prev + 8;
          }
          if (prev < 75) {
            setModalMessage('FFmpeg is processing & merging audio/video...');
            return prev + 4;
          }
          if (prev < 92) {
            setModalMessage('Finalizing file for your device...');
            return prev + 1;
          }
          return prev;
        });
      }, 1200);
    }
    return () => clearInterval(interval);
  }, [isModalOpen, modalStage]);

  const handleStartDownload = async (format: VideoFormatOption) => {
    setActiveFormat(format);
    setIsModalOpen(true);
    setModalStage('preparing');
    setModalProgress(15);
    setModalMessage('Connecting to YouTube servers...');
    setErrorMessage(null);
    setDownloadLink(null);

    const safeTitle = (video.title || 'video')
      .replace(/[\\/:*?"<>|#%&{}\\$!'`+@=^~[\]]/g, ' ')
      .replace(/[^\x20-\x7E]/g, '')
      .replace(/\s+/g, ' ')
      .trim()
      .substring(0, 60) || 'download';

    try {
      const res = await fetch('/api/prepare', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: `https://www.youtube.com/watch?v=${video.id}`,
          quality: format.id,
          type: format.type,
          title: safeTitle,
        }),
      });

      const data: PrepareResponse = await res.json();

      if (!res.ok || !data.success || !data.downloadUrl) {
        throw new Error(data.error || 'Server could not prepare this format. Please try another quality.');
      }

      setModalProgress(100);
      setModalStage('ready');
      setDownloadLink(data.downloadUrl);
      setModalMessage('File ready! Download started.');

      // Automatically trigger instant browser download
      window.location.href = data.downloadUrl;
    } catch (err) {
      console.error(err);
      setModalStage('error');
      setErrorMessage((err as Error).message || 'Failed to process media.');
    }
  };

  const handleCopyLink = (format: VideoFormatOption) => {
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    const safeTitle = (video.title || 'video').replace(/[\\/:*?"<>|]/g, ' ').substring(0, 50);
    const downloadUrl = `${origin}/api/download?url=${encodeURIComponent(
      `https://www.youtube.com/watch?v=${video.id}`
    )}&quality=${encodeURIComponent(format.id)}&type=${format.type}&title=${encodeURIComponent(safeTitle)}`;

    navigator.clipboard.writeText(downloadUrl);
    setCopiedLink(format.id);
    setTimeout(() => setCopiedLink(null), 2500);
  };

  return (
    <div className="w-full max-w-4xl mx-auto mt-8 bg-zinc-900/95 border border-zinc-800 rounded-3xl p-5 sm:p-7 shadow-2xl backdrop-blur-xl relative">
      {/* Video Details Header */}
      <div className="flex flex-col md:flex-row gap-6 items-start">
        {/* Thumbnail with overlay badge */}
        <div className="relative w-full md:w-80 shrink-0 aspect-video rounded-2xl overflow-hidden bg-zinc-950 border border-zinc-800 shadow-lg group">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={video.thumbnail || `https://i.ytimg.com/vi/${video.id}/hqdefault.jpg`}
            alt={video.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            loading="eager"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent pointer-events-none" />

          {/* Duration Badge */}
          <div className="absolute bottom-2.5 right-2.5 px-2.5 py-1 bg-black/80 backdrop-blur-md rounded-lg text-xs font-semibold text-white flex items-center gap-1.5 shadow-md">
            <Clock className="w-3 h-3 text-red-400" />
            {video.duration}
          </div>

          <a
            href={`https://www.youtube.com/watch?v=${video.id}`}
            target="_blank"
            rel="noopener noreferrer"
            className="absolute top-2.5 right-2.5 p-2 bg-black/60 hover:bg-black/90 backdrop-blur-md rounded-xl text-zinc-300 hover:text-white transition"
            title="Watch on YouTube"
          >
            <ExternalLink className="w-4 h-4" />
          </a>
        </div>

        {/* Video Info */}
        <div className="flex-1 flex flex-col justify-between">
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-white leading-snug line-clamp-2 hover:text-red-400 transition-colors">
              <a
                href={`https://www.youtube.com/watch?v=${video.id}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                {video.title}
              </a>
            </h2>

            {/* Author & Meta */}
            <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs sm:text-sm text-zinc-400">
              <a
                href={video.channelUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-red-400 hover:text-red-300 flex items-center gap-1.5"
              >
                <span className="w-5 h-5 rounded-full bg-red-600/20 border border-red-500/40 flex items-center justify-center text-[10px] text-red-400 font-bold">
                  {video.author.charAt(0)}
                </span>
                {video.author}
              </a>

              <div className="flex items-center gap-1 text-zinc-400">
                <Eye className="w-3.5 h-3.5 text-zinc-500" />
                <span>{video.viewCount} views</span>
              </div>

              {video.uploadDate && (
                <div className="flex items-center gap-1 text-zinc-400">
                  <Calendar className="w-3.5 h-3.5 text-zinc-500" />
                  <span>{video.uploadDate}</span>
                </div>
              )}
            </div>

            {/* Description */}
            {video.description && (
              <div className="mt-3 text-xs text-zinc-400">
                <p className={showFullDesc ? '' : 'line-clamp-2'}>
                  {video.description}
                </p>
                {video.description.length > 120 && (
                  <button
                    onClick={() => setShowFullDesc(!showFullDesc)}
                    className="text-red-400 hover:text-red-300 text-xs font-medium mt-1 cursor-pointer"
                  >
                    {showFullDesc ? 'Show less' : 'Read more...'}
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Quick Share */}
          <div className="mt-4 pt-3 border-t border-zinc-800/80 flex items-center justify-between text-xs text-zinc-400">
            <span className="flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" /> High Bitrate Streams Ready
            </span>
            <button
              onClick={() => {
                navigator.clipboard.writeText(`https://www.youtube.com/watch?v=${video.id}`);
                setCopiedLink('video-url');
                setTimeout(() => setCopiedLink(null), 2000);
              }}
              className="flex items-center gap-1 text-zinc-400 hover:text-zinc-200 cursor-pointer"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>{copiedLink === 'video-url' ? 'Copied URL!' : 'Share Video'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="mt-8 flex items-center justify-between border-b border-zinc-800 pb-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('video')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition cursor-pointer ${
              activeTab === 'video'
                ? 'bg-red-600 text-white shadow-lg shadow-red-600/30'
                : 'bg-zinc-800/60 text-zinc-400 hover:text-white hover:bg-zinc-800'
            }`}
          >
            <Video className="w-4 h-4" />
            <span>Video (MP4)</span>
            <span className="ml-1 px-1.5 py-0.2 bg-black/30 rounded-full text-[10px]">
              {video.formats.videos.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('audio')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition cursor-pointer ${
              activeTab === 'audio'
                ? 'bg-red-600 text-white shadow-lg shadow-red-600/30'
                : 'bg-zinc-800/60 text-zinc-400 hover:text-white hover:bg-zinc-800'
            }`}
          >
            <Music className="w-4 h-4" />
            <span>Audio (MP3 / M4A)</span>
            <span className="ml-1 px-1.5 py-0.2 bg-black/30 rounded-full text-[10px]">
              {video.formats.audios.length}
            </span>
          </button>
        </div>

        <span className="hidden sm:inline text-xs text-zinc-500 font-medium">
          Select desired quality below
        </span>
      </div>

      {/* Formats Grid */}
      <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-3.5">
        {formats.map((fmt) => {
          const isCopied = copiedLink === fmt.id;

          return (
            <div
              key={fmt.id}
              className="group relative flex items-center justify-between p-3.5 sm:p-4 rounded-2xl bg-zinc-950/70 border border-zinc-800 hover:border-zinc-700 hover:bg-zinc-850/50 transition-all duration-200"
            >
              {/* Quality & Format Details */}
              <div className="flex items-center gap-3">
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-xs uppercase ${
                    fmt.type === 'video'
                      ? 'bg-red-500/10 text-red-400 border border-red-500/20'
                      : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                  }`}
                >
                  {fmt.ext}
                </div>

                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-sm text-zinc-100 group-hover:text-white">
                      {fmt.label}
                    </span>
                    {fmt.isPopular && (
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-500/15 text-amber-400 border border-amber-500/30">
                        BEST
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-zinc-400 mt-0.5">
                    <span>Quality: {fmt.quality}</span>
                    {fmt.filesizeText && (
                      <>
                        <span>•</span>
                        <span className="text-zinc-500">~{fmt.filesizeText}</span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-1.5">
                {/* Copy direct link */}
                <button
                  type="button"
                  onClick={() => handleCopyLink(fmt)}
                  className="p-2 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 rounded-xl border border-transparent hover:border-zinc-700 transition cursor-pointer"
                  title="Copy Direct Link"
                >
                  {isCopied ? (
                    <Check className="w-4 h-4 text-emerald-400" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </button>

                {/* Download Button */}
                <button
                  type="button"
                  onClick={() => handleStartDownload(fmt)}
                  className="flex items-center gap-1.5 px-3.5 py-2 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 active:scale-[0.97] text-white text-xs font-semibold rounded-xl shadow-md shadow-red-600/20 transition cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Interactive Download Progress Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
          <div className="relative w-full max-w-md p-6 sm:p-7 rounded-3xl bg-zinc-900 border border-zinc-700/80 shadow-2xl text-center">
            {/* Close Button */}
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 right-4 p-2 text-zinc-400 hover:text-white rounded-xl hover:bg-zinc-800 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            {modalStage === 'preparing' && (
              <div>
                <div className="w-14 h-14 rounded-2xl bg-red-600/10 border border-red-500/30 text-red-500 flex items-center justify-center mx-auto mb-4 animate-pulse">
                  <Loader2 className="w-7 h-7 animate-spin" />
                </div>

                <h3 className="text-lg font-bold text-white">
                  Preparing Your Download
                </h3>
                <p className="mt-1 text-xs text-zinc-400">
                  {activeFormat?.label} • {video.title.substring(0, 45)}...
                </p>

                {/* Progress Bar */}
                <div className="mt-5 w-full bg-zinc-800 rounded-full h-2.5 overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-red-600 to-rose-500 h-2.5 rounded-full transition-all duration-500"
                    style={{ width: `${modalProgress}%` }}
                  />
                </div>

                <div className="mt-3 flex justify-between items-center text-xs text-zinc-400 font-mono">
                  <span>{modalMessage}</span>
                  <span className="font-bold text-red-400">{modalProgress}%</span>
                </div>

                <p className="mt-5 text-[11px] text-zinc-500">
                  ⚡ Rendering high quality media via server FFmpeg. Please keep this tab open.
                </p>
              </div>
            )}

            {modalStage === 'ready' && (
              <div>
                <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center mx-auto mb-4">
                  <CheckCircle2 className="w-7 h-7" />
                </div>

                <h3 className="text-lg font-bold text-white">
                  Download Ready!
                </h3>
                <p className="mt-1 text-xs text-zinc-400">
                  File prepared successfully. Download has started automatically.
                </p>

                {downloadLink && (
                  <div className="mt-6 space-y-3">
                    <a
                      href={downloadLink}
                      className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm shadow-lg shadow-emerald-600/30 transition cursor-pointer"
                    >
                      <ArrowDownToLine className="w-4 h-4" />
                      <span>Save File Again</span>
                    </a>

                    <button
                      onClick={() => setIsModalOpen(false)}
                      className="w-full py-2.5 text-xs text-zinc-400 hover:text-white cursor-pointer"
                    >
                      Close Window
                    </button>
                  </div>
                )}
              </div>
            )}

            {modalStage === 'error' && (
              <div>
                <div className="w-14 h-14 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-400 flex items-center justify-center mx-auto mb-4">
                  <AlertTriangle className="w-7 h-7" />
                </div>

                <h3 className="text-lg font-bold text-white">
                  Preparation Failed
                </h3>
                <p className="mt-2 text-xs text-rose-300 bg-rose-950/40 border border-rose-500/30 p-3 rounded-xl">
                  {errorMessage || 'YouTube media format could not be extracted.'}
                </p>

                <div className="mt-6 flex gap-3">
                  <button
                    onClick={() => activeFormat && handleStartDownload(activeFormat)}
                    className="flex-1 py-2.5 bg-red-600 hover:bg-red-500 text-white rounded-xl text-xs font-bold transition cursor-pointer"
                  >
                    Try Again
                  </button>
                  <button
                    onClick={() => setIsModalOpen(false)}
                    className="flex-1 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-xl text-xs font-bold transition cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
