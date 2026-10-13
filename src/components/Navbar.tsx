'use client';

import React from 'react';
import { Sparkles, Code2, ShieldCheck } from 'lucide-react';
import { YouTubeIcon } from './icons/YouTubeIcon';

interface NavbarProps {
  onScrollToApi?: () => void;
  onScrollToFaq?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onScrollToApi, onScrollToFaq }) => {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-white/[0.08] bg-[#09090b]/80 backdrop-blur-xl">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        {/* Brand */}
        <a href="/" className="flex items-center gap-3 group">
          <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-tr from-red-600 to-rose-500 shadow-lg shadow-red-500/25 group-hover:scale-105 transition-transform">
            <YouTubeIcon className="w-5 h-5 text-white" />
            <div className="absolute inset-0 rounded-xl bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-lg tracking-tight text-white group-hover:text-red-400 transition-colors">
                NextTube
              </span>
              <span className="px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider bg-red-500/10 text-red-400 border border-red-500/20 rounded-md">
                PRO
              </span>
            </div>
            <p className="text-[11px] text-zinc-400 hidden sm:block">Ultra HD & MP3 Studio</p>
          </div>
        </a>

        {/* Center / Right Links */}
        <div className="flex items-center gap-2 sm:gap-4">
          <div className="hidden md:flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-medium">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>High-Speed Server Ready</span>
          </div>

          {onScrollToApi && (
            <button
              onClick={onScrollToApi}
              className="px-3 py-1.5 rounded-lg text-xs font-medium text-zinc-300 hover:text-white hover:bg-white/5 transition flex items-center gap-1.5 cursor-pointer"
            >
              <Code2 className="w-3.5 h-3.5 text-red-400" />
              <span className="hidden sm:inline">REST</span> API
            </button>
          )}

          {onScrollToFaq && (
            <button
              onClick={onScrollToFaq}
              className="px-3 py-1.5 rounded-lg text-xs font-medium text-zinc-300 hover:text-white hover:bg-white/5 transition hidden sm:flex items-center gap-1.5 cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              FAQ
            </button>
          )}

          <div className="flex items-center gap-1 text-xs text-zinc-400 bg-zinc-900 border border-zinc-800 px-2.5 py-1.5 rounded-lg">
            <ShieldCheck className="w-3.5 h-3.5 text-zinc-400" />
            <span className="hidden sm:inline">100% Free & No Ads</span>
            <span className="sm:hidden">Free</span>
          </div>
        </div>
      </div>
    </header>
  );
};
