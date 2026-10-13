'use client';

import React from 'react';
import { Heart, ArrowUp } from 'lucide-react';
import { YouTubeIcon } from './icons/YouTubeIcon';

export const Footer: React.FC = () => {
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer className="mt-28 border-t border-zinc-800/80 bg-zinc-950/80 backdrop-blur-md">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          {/* Logo & Tagline */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-red-600 to-rose-500 flex items-center justify-center text-white shadow-lg shadow-red-500/20">
              <YouTubeIcon className="w-5 h-5" />
            </div>
            <div>
              <span className="font-extrabold text-base text-white tracking-tight">
                NextTube
              </span>
              <span className="ml-2 text-xs text-zinc-500">
                Next-Gen Video Downloader & Audio Converter
              </span>
            </div>
          </div>

          {/* Quick links & Back to top */}
          <div className="flex items-center gap-4 text-xs text-zinc-400">
            <a href="/api" className="hover:text-white transition">
              REST API
            </a>
            <span>•</span>
            <a href="#faq" className="hover:text-white transition">
              FAQ
            </a>
            <span>•</span>
            <button
              onClick={scrollToTop}
              className="flex items-center gap-1 hover:text-white transition cursor-pointer"
            >
              <span>Back to Top</span>
              <ArrowUp className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Disclaimer */}
        <div className="mt-8 pt-6 border-t border-zinc-900 text-[11px] text-zinc-500 text-center leading-relaxed">
          <p>
            Disclaimer: NextTube is intended solely for personal, educational, and fair-use archiving. Please respect copyright laws and the intellectual property of original content creators. We do not host or store copyrighted media on our servers.
          </p>
          <p className="mt-2 flex items-center justify-center gap-1 text-zinc-400">
            Built with <Heart className="w-3 h-3 text-red-500 fill-red-500" /> using Next.js 16, React 19, Tailwind CSS, yt-dlp & FFmpeg
          </p>
        </div>
      </div>
    </footer>
  );
};
