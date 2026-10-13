'use client';

import React from 'react';
import { Sparkles, Zap, Music, Shield, Smartphone, Terminal } from 'lucide-react';

const FEATURES = [
  {
    icon: Sparkles,
    color: 'from-red-500 to-rose-600',
    title: 'Crystal 4K & 1080p HD',
    desc: 'Download videos up to 2160p (4K) and 1080p 60fps with original clarity and zero loss.',
  },
  {
    icon: Music,
    color: 'from-amber-500 to-orange-600',
    title: 'Studio MP3 (320 kbps)',
    desc: 'Extract pristine high-bitrate MP3 and M4A audio tracks seamlessly from any music or podcast.',
  },
  {
    icon: Zap,
    color: 'from-emerald-500 to-teal-600',
    title: 'Lightning Processing',
    desc: 'Powered by native yt-dlp and FFmpeg server-side rendering for blazingly quick downloads.',
  },
  {
    icon: Shield,
    color: 'from-blue-500 to-cyan-600',
    title: '100% Safe & Ad-Free',
    desc: 'No redirects, no popup spam, no malware. Pure download experience clean and direct.',
  },
  {
    icon: Smartphone,
    color: 'from-purple-500 to-indigo-600',
    title: 'All Device Support',
    desc: 'Flawlessly optimized for Windows, macOS, Linux, iOS Safari, Android, and tablets.',
  },
  {
    icon: Terminal,
    color: 'from-pink-500 to-rose-600',
    title: 'Free Developer API',
    desc: 'Integrate YouTube downloading into your own bots and scripts using built-in JSON endpoints.',
  },
];

export const Features: React.FC = () => {
  return (
    <section className="mt-20 max-w-6xl mx-auto px-4 sm:px-6">
      <div className="text-center max-w-2xl mx-auto mb-12">
        <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
          Why Choose <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-rose-400">NextTube</span>?
        </h2>
        <p className="mt-3 text-sm sm:text-base text-zinc-400">
          Engineered for speed, precision, and privacy. The ultimate modern media toolkit.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {FEATURES.map((feat, i) => {
          const Icon = feat.icon;
          return (
            <div
              key={i}
              className="group relative p-6 rounded-2xl bg-zinc-900/60 border border-zinc-800 hover:border-zinc-700 hover:bg-zinc-850/60 transition-all duration-300"
            >
              <div
                className={`w-12 h-12 rounded-xl bg-gradient-to-tr ${feat.color} flex items-center justify-center text-white mb-4 shadow-lg group-hover:scale-110 transition-transform`}
              >
                <Icon className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white group-hover:text-red-400 transition-colors">
                {feat.title}
              </h3>
              <p className="mt-2 text-sm text-zinc-400 leading-relaxed">
                {feat.desc}
              </p>
            </div>
          );
        })}
      </div>
    </section>
  );
};
