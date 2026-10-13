'use client';

import React, { useState, useEffect } from 'react';
import { Search, Clipboard, X, ArrowRight, Loader2, CheckCircle2 } from 'lucide-react';
import { YouTubeIcon } from './icons/YouTubeIcon';

interface UrlInputProps {
  url: string;
  setUrl: (url: string) => void;
  onSubmit: (url: string) => void;
  isLoading: boolean;
}

const SAMPLE_VIDEOS = [
  { label: '4K Nature 🌿', url: 'https://www.youtube.com/watch?v=LXb3EKWsInQ' },
  { label: 'Shorts ⚡', url: 'https://www.youtube.com/shorts/kJQP7kiw5Fk' },
  { label: 'Lofi Music 🎵', url: 'https://www.youtube.com/watch?v=jfKfPfyJRdk' },
];

export const UrlInput: React.FC<UrlInputProps> = ({
  url,
  setUrl,
  onSubmit,
  isLoading,
}) => {
  const [isValidUrl, setIsValidUrl] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const trimmed = url.trim();
    const regex = /^(https?:\/\/)?(www\.|m\.)?(youtube\.com\/(watch\?v=|shorts\/|embed\/|v\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/;
    setIsValidUrl(regex.test(trimmed));
  }, [url]);

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        setUrl(text.trim());
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    } catch {
      // Clipboard access might be blocked by browser permission
    }
  };

  const handleClear = () => {
    setUrl('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (url.trim()) {
      onSubmit(url.trim());
    }
  };

  return (
    <div className="w-full max-w-3xl mx-auto">
      <form onSubmit={handleSubmit} className="relative group">
        {/* Ambient Glow */}
        <div className="absolute -inset-1 rounded-2xl bg-gradient-to-r from-red-600 via-rose-500 to-amber-500 opacity-30 blur-xl group-hover:opacity-60 transition duration-500 group-focus-within:opacity-80" />

        {/* Input Wrapper */}
        <div className="relative flex items-center bg-zinc-900/90 backdrop-blur-2xl border border-zinc-700/80 group-focus-within:border-red-500/80 rounded-2xl p-2 sm:p-2.5 shadow-2xl transition-all duration-300">
          <div className="pl-3 pr-2 text-zinc-400 flex items-center">
            {isValidUrl ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-400 transition-colors" />
            ) : (
              <YouTubeIcon className="w-5 h-5 text-red-500" />
            )}
          </div>

          <input
            type="text"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="Paste YouTube video or Shorts link here (e.g. https://youtu.be/...)"
            className="w-full bg-transparent text-sm sm:text-base text-zinc-100 placeholder-zinc-500 focus:outline-none px-2 py-2"
            disabled={isLoading}
          />

          {/* Quick Actions */}
          <div className="flex items-center gap-1.5 sm:gap-2 pr-1">
            {url && (
              <button
                type="button"
                onClick={handleClear}
                className="p-1.5 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 rounded-lg transition"
                title="Clear input"
              >
                <X className="w-4 h-4" />
              </button>
            )}

            <button
              type="button"
              onClick={handlePaste}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-zinc-300 bg-zinc-800/80 hover:bg-zinc-700/80 hover:text-white rounded-lg border border-zinc-700 transition"
              title="Paste from clipboard"
            >
              <Clipboard className="w-3.5 h-3.5" />
              <span>{copied ? 'Pasted!' : 'Paste'}</span>
            </button>

            <button
              type="submit"
              disabled={isLoading || !url.trim()}
              className="flex items-center gap-2 px-4 sm:px-6 py-2.5 sm:py-3 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none text-white text-xs sm:text-sm font-semibold rounded-xl shadow-lg shadow-red-600/30 transition-all cursor-pointer"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span className="hidden sm:inline">Analyzing...</span>
                </>
              ) : (
                <>
                  <span className="font-bold">Fetch</span>
                  <ArrowRight className="w-4 h-4 hidden sm:inline" />
                </>
              )}
            </button>
          </div>
        </div>
      </form>

      {/* Sample Video Suggestions */}
      <div className="mt-3.5 flex flex-wrap items-center justify-center sm:justify-start gap-2 text-xs text-zinc-400">
        <span className="text-zinc-500 font-medium flex items-center gap-1">
          <Search className="w-3 h-3" /> Quick Test:
        </span>
        {SAMPLE_VIDEOS.map((sample) => (
          <button
            key={sample.label}
            type="button"
            onClick={() => {
              setUrl(sample.url);
              onSubmit(sample.url);
            }}
            disabled={isLoading}
            className="px-2.5 py-1 rounded-full bg-zinc-850 hover:bg-zinc-800 border border-zinc-800 hover:border-zinc-700 text-zinc-300 hover:text-white transition duration-200 cursor-pointer"
          >
            {sample.label}
          </button>
        ))}
      </div>
    </div>
  );
};
