'use client';

import React from 'react';
import { Link2, Sliders, ArrowDownToLine } from 'lucide-react';

const STEPS = [
  {
    step: '01',
    icon: Link2,
    title: 'Copy & Paste Link',
    desc: 'Copy any YouTube video, Shorts, or Music link and paste it into the search box above.',
  },
  {
    step: '02',
    icon: Sliders,
    title: 'Select Resolution / Format',
    desc: 'Pick your preferred quality from 4K, 1080p, 720p MP4 or high-fidelity 320 kbps MP3 audio.',
  },
  {
    step: '03',
    icon: ArrowDownToLine,
    title: 'Instant Download',
    desc: 'Click Download to receive your pristine file directly with no speed caps or intrusive ads.',
  },
];

export const HowItWorks: React.FC = () => {
  return (
    <section className="mt-20 max-w-5xl mx-auto px-4 sm:px-6">
      <div className="text-center max-w-xl mx-auto mb-12">
        <span className="px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider bg-red-500/10 text-red-400 border border-red-500/20">
          Easy 3-Step Process
        </span>
        <h2 className="mt-3 text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
          How It Works
        </h2>
        <p className="mt-2 text-sm text-zinc-400">
          Download your favorite content in just three simple steps
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative">
        {STEPS.map((item, index) => {
          const Icon = item.icon;
          return (
            <div
              key={index}
              className="relative p-6 rounded-2xl bg-zinc-900/60 border border-zinc-800 flex flex-col items-center text-center group hover:border-red-500/40 transition-all duration-300"
            >
              <div className="absolute top-4 right-4 text-3xl font-black text-zinc-800 group-hover:text-red-500/20 transition-colors select-none">
                {item.step}
              </div>

              <div className="w-14 h-14 rounded-2xl bg-red-600/10 border border-red-500/30 text-red-400 flex items-center justify-center mb-5 group-hover:scale-110 group-hover:bg-red-600 group-hover:text-white transition-all shadow-lg shadow-red-600/10">
                <Icon className="w-7 h-7" />
              </div>

              <h3 className="text-base font-bold text-white mb-2">
                {item.title}
              </h3>

              <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed">
                {item.desc}
              </p>
            </div>
          );
        })}
      </div>
    </section>
  );
};
