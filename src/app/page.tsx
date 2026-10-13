'use client';

import React, { useState, useEffect } from 'react';
import { Navbar } from '@/components/Navbar';
import { UrlInput } from '@/components/UrlInput';
import { VideoCard } from '@/components/VideoCard';
import { Features } from '@/components/Features';
import { HowItWorks } from '@/components/HowItWorks';
import { ApiDocsSection } from '@/components/ApiDocsSection';
import { FaqSection } from '@/components/FaqSection';
import { Footer } from '@/components/Footer';
import { VideoInfo, ApiResponse } from '@/types';
import {
  Sparkles,
  AlertCircle,
  History,
  Trash2,
  Loader2,
} from 'lucide-react';

interface RecentItem {
  id: string;
  title: string;
  thumbnail: string;
  author: string;
  duration: string;
  url: string;
}

export default function Home() {
  const [url, setUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [videoInfo, setVideoInfo] = useState<VideoInfo | null>(null);
  const [recents, setRecents] = useState<RecentItem[]>([]);

  // Load history from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem('nexttube_recent_searches');
      if (stored) {
        setRecents(JSON.parse(stored));
      }
    } catch {
      // Ignore localStorage errors
    }
  }, []);

  const saveToRecents = (info: VideoInfo, sourceUrl: string) => {
    try {
      const item: RecentItem = {
        id: info.id,
        title: info.title,
        thumbnail: info.thumbnail,
        author: info.author,
        duration: info.duration,
        url: sourceUrl,
      };

      setRecents((prev) => {
        const filtered = prev.filter((r) => r.id !== info.id);
        const updated = [item, ...filtered].slice(0, 5);
        localStorage.setItem('nexttube_recent_searches', JSON.stringify(updated));
        return updated;
      });
    } catch {
      // Ignore localStorage errors
    }
  };

  const clearRecents = () => {
    setRecents([]);
    try {
      localStorage.removeItem('nexttube_recent_searches');
    } catch {
      // Ignore
    }
  };

  const handleFetchInfo = async (inputUrl: string) => {
    if (!inputUrl.trim()) return;

    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/info?url=${encodeURIComponent(inputUrl.trim())}`);
      const data: ApiResponse<VideoInfo> = await res.json();

      if (!res.ok || !data.success || !data.data) {
        throw new Error(data.error || 'Failed to retrieve video information. Please check the URL.');
      }

      setVideoInfo(data.data);
      saveToRecents(data.data, inputUrl.trim());
    } catch (err) {
      console.error(err);
      setError((err as Error).message || 'Something went wrong while retrieving video details.');
      setVideoInfo(null);
    } finally {
      setIsLoading(false);
    }
  };

  const scrollToApi = () => {
    const el = document.getElementById('developer-api');
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  const scrollToFaq = () => {
    const el = document.getElementById('faq');
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#09090b] text-[#f4f4f5] selection:bg-red-600 selection:text-white">
      {/* Top Navbar */}
      <Navbar onScrollToApi={scrollToApi} onScrollToFaq={scrollToFaq} />

      {/* Main Container */}
      <main className="flex-1 pb-16">
        {/* Hero Section */}
        <div className="relative pt-16 sm:pt-24 pb-12 overflow-hidden px-4 sm:px-6">
          {/* Subtle Ambient Background Glows */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[650px] h-[350px] bg-red-600/15 rounded-full blur-[130px] pointer-events-none glow-animation" />
          <div className="absolute top-1/3 left-1/4 -translate-x-1/2 w-[350px] h-[250px] bg-rose-600/10 rounded-full blur-[100px] pointer-events-none" />

          <div className="max-w-4xl mx-auto text-center relative z-10">
            {/* Pill Badge */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-semibold mb-6 shadow-sm">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Free 4K Ultra HD & 320 kbps MP3 Downloader</span>
            </div>

            {/* Main Headline */}
            <h1 className="text-3xl sm:text-5xl md:text-6xl font-black tracking-tight text-white leading-tight sm:leading-none">
              Download YouTube Media{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-500 via-rose-500 to-amber-500">
                At Lightning Speed
              </span>
            </h1>

            {/* Subtitle */}
            <p className="mt-4 sm:mt-6 text-sm sm:text-lg text-zinc-400 max-w-2xl mx-auto leading-relaxed">
              Convert and download YouTube videos, Shorts, and audio directly in pristine 1080p, 4K MP4 or studio-quality 320kbps MP3. Fast, free & zero ads.
            </p>

            {/* URL Input Form */}
            <div className="mt-8 sm:mt-10">
              <UrlInput
                url={url}
                setUrl={setUrl}
                onSubmit={handleFetchInfo}
                isLoading={isLoading}
              />
            </div>
          </div>
        </div>

        {/* Loading State Skeleton */}
        {isLoading && (
          <div className="max-w-4xl mx-auto px-4 sm:px-6 mt-8 animate-pulse">
            <div className="p-6 rounded-3xl bg-zinc-900/60 border border-zinc-800 flex flex-col md:flex-row gap-6">
              <div className="w-full md:w-80 h-48 bg-zinc-800/60 rounded-2xl flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-red-500" />
              </div>
              <div className="flex-1 space-y-4 py-2">
                <div className="h-6 bg-zinc-800/80 rounded-lg w-3/4" />
                <div className="h-4 bg-zinc-800/50 rounded-lg w-1/3" />
                <div className="h-16 bg-zinc-800/30 rounded-lg w-full" />
                <div className="h-10 bg-zinc-800/60 rounded-xl w-40" />
              </div>
            </div>
          </div>
        )}

        {/* Error Alert */}
        {error && !isLoading && (
          <div className="max-w-3xl mx-auto px-4 sm:px-6 mt-8 animate-fadeIn">
            <div className="p-4 sm:p-5 rounded-2xl bg-red-950/40 border border-red-500/40 text-red-300 flex items-start gap-3.5 shadow-xl">
              <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
              <div className="flex-1 text-xs sm:text-sm">
                <p className="font-semibold text-red-200">Failed to fetch video</p>
                <p className="mt-1 text-red-300/90 leading-relaxed">{error}</p>
                <button
                  onClick={() => handleFetchInfo(url)}
                  className="mt-2.5 px-3 py-1 bg-red-500/20 hover:bg-red-500/30 text-red-200 rounded-lg text-xs font-semibold border border-red-500/30 transition cursor-pointer"
                >
                  Retry Request
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Result Video Card */}
        {videoInfo && !isLoading && (
          <div className="px-4 sm:px-6">
            <VideoCard video={videoInfo} />
          </div>
        )}

        {/* Recent Searches / Downloads */}
        {recents.length > 0 && !isLoading && (
          <div className="max-w-4xl mx-auto px-4 sm:px-6 mt-12">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-zinc-400">
                <History className="w-4 h-4 text-red-400" />
                <span>Recent Downloads</span>
              </div>
              <button
                onClick={clearRecents}
                className="text-xs text-zinc-500 hover:text-red-400 flex items-center gap-1 transition cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Clear History</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {recents.map((item) => (
                <div
                  key={item.id}
                  onClick={() => {
                    setUrl(item.url);
                    handleFetchInfo(item.url);
                  }}
                  className="group flex items-center gap-3 p-3 rounded-2xl bg-zinc-900/50 hover:bg-zinc-850/80 border border-zinc-800/80 hover:border-zinc-700 transition cursor-pointer"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={item.thumbnail}
                    alt={item.title}
                    className="w-16 h-11 object-cover rounded-xl bg-zinc-950 shrink-0 border border-zinc-800 group-hover:scale-105 transition-transform"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold text-zinc-200 group-hover:text-red-400 truncate">
                      {item.title}
                    </p>
                    <p className="text-[11px] text-zinc-500 truncate mt-0.5">
                      {item.author} • {item.duration}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Feature Highlights */}
        <Features />

        {/* How It Works Guide */}
        <HowItWorks />

        {/* Developer REST API Section */}
        <ApiDocsSection />

        {/* FAQ Accordion */}
        <FaqSection />
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
}
