'use client';

import React, { useState } from 'react';
import { ChevronDown, HelpCircle } from 'lucide-react';

const FAQS = [
  {
    q: 'Is NextTube completely free to use?',
    a: 'Yes, 100% free with unlimited downloads. There are no subscriptions, paywalls, watermarks, or intrusive popup ads.',
  },
  {
    q: 'Can I download videos in 1080p and 4K with full audio?',
    a: 'Absolutely! NextTube automatically combines YouTube’s highest-quality video streams with pristine audio using server-side FFmpeg processing, so your 1080p or 4K MP4 file is complete and ready to play.',
  },
  {
    q: 'How do I extract and download MP3 audio?',
    a: 'After entering a video link, switch to the "Audio (MP3 / M4A)" tab. You can select 320 kbps high-bitrate MP3 or standard 192 kbps for crystal clear audio.',
  },
  {
    q: 'Does NextTube support YouTube Shorts?',
    a: 'Yes! Simply paste any YouTube Shorts URL (e.g., https://youtube.com/shorts/...) and NextTube will fetch and download it in vertical HD MP4 format.',
  },
  {
    q: 'Does it work on iPhone, iPad, and Android?',
    a: 'Yes. NextTube is fully responsive and runs smoothly in any mobile browser including Safari and Chrome. Files download straight to your mobile Downloads folder.',
  },
  {
    q: 'Can I use this programmatically in my own projects?',
    a: 'Yes! NextTube comes with a built-in REST API (/api/info and /api/download) that returns clean JSON metadata and supports direct file streams for developers.',
  },
];

export const FaqSection: React.FC = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const toggle = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <section id="faq" className="mt-20 max-w-4xl mx-auto px-4 sm:px-6">
      <div className="text-center max-w-xl mx-auto mb-10">
        <span className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 inline-flex items-center justify-center mb-3">
          <HelpCircle className="w-5 h-5" />
        </span>
        <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
          Frequently Asked Questions
        </h2>
        <p className="mt-2 text-sm text-zinc-400">
          Everything you need to know about downloading videos and audio
        </p>
      </div>

      <div className="space-y-3">
        {FAQS.map((faq, index) => {
          const isOpen = openIndex === index;
          return (
            <div
              key={index}
              className="rounded-2xl bg-zinc-900/60 border border-zinc-800 transition-colors overflow-hidden"
            >
              <button
                type="button"
                onClick={() => toggle(index)}
                className="w-full p-4 sm:p-5 text-left flex items-center justify-between gap-4 cursor-pointer"
              >
                <span className="text-sm sm:text-base font-semibold text-zinc-100 hover:text-white">
                  {faq.q}
                </span>
                <ChevronDown
                  className={`w-5 h-5 text-zinc-400 transition-transform duration-300 shrink-0 ${
                    isOpen ? 'rotate-180 text-red-400' : ''
                  }`}
                />
              </button>

              {isOpen && (
                <div className="px-4 sm:px-5 pb-5 text-xs sm:text-sm text-zinc-400 leading-relaxed border-t border-zinc-800/60 pt-3">
                  {faq.a}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
};
