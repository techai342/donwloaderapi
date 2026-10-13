'use client';

import React, { useState } from 'react';
import { Terminal, Copy, Check, ExternalLink, Code2 } from 'lucide-react';

export const ApiDocsSection: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'curl' | 'js' | 'python'>('curl');
  const [copied, setCopied] = useState(false);

  const snippets = {
    curl: `# 1. Get Video Metadata & Available Formats
curl -X GET "http://localhost:3000/api/info?url=https://www.youtube.com/watch?v=dQw4w9WgXcQ"

# 2. Download 1080p Video Directly
curl -O -J "http://localhost:3000/api/download?url=https://www.youtube.com/watch?v=dQw4w9WgXcQ&quality=1080&type=video"

# 3. Extract High Quality MP3 (320 kbps)
curl -O -J "http://localhost:3000/api/download?url=https://www.youtube.com/watch?v=dQw4w9WgXcQ&quality=mp3-320&type=audio"`,

    js: `// 1. Fetch Video Info
const res = await fetch('/api/info?url=https://www.youtube.com/watch?v=dQw4w9WgXcQ');
const { success, data } = await res.json();
console.log('Title:', data.title);
console.log('Formats:', data.formats);

// 2. Direct Download Link for your client:
const downloadUrl = \`/api/download?url=\${encodeURIComponent(youtubeUrl)}&quality=1080&type=video\`;
window.location.href = downloadUrl;`,

    python: `import requests

# 1. Fetch video details
info_url = "http://localhost:3000/api/info"
params = {"url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ"}
response = requests.get(info_url, params=params).json()

print(f"Title: {response['data']['title']}")

# 2. Stream download 1080p video to disk
download_url = "http://localhost:3000/api/download"
with requests.get(download_url, params={"url": params["url"], "quality": "1080", "type": "video"}, stream=True) as r:
    r.raise_for_status()
    with open("download.mp4", "wb") as f:
        for chunk in r.iter_content(chunk_size=8192):
            f.write(chunk)
print("Download finished!")`,
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(snippets[activeTab]);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <section id="developer-api" className="mt-20 max-w-5xl mx-auto px-4 sm:px-6">
      <div className="p-6 sm:p-8 rounded-3xl bg-zinc-900/90 border border-zinc-800 shadow-2xl backdrop-blur-xl relative overflow-hidden">
        {/* Glow */}
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-80 h-80 bg-red-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 pb-6 border-b border-zinc-800">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400">
                <Code2 className="w-5 h-5" />
              </span>
              <h2 className="text-xl sm:text-2xl font-extrabold text-white">
                Developer REST API
              </h2>
            </div>
            <p className="mt-1 text-xs sm:text-sm text-zinc-400">
              Integrate video metadata extraction and downloads straight into your applications.
            </p>
          </div>

          <a
            href="/api"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 hover:text-white rounded-xl text-xs font-semibold border border-zinc-700 transition cursor-pointer self-start md:self-auto"
          >
            <span>API Specs JSON</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>

        {/* Code Snippet Box */}
        <div className="rounded-2xl bg-zinc-950 border border-zinc-800 overflow-hidden">
          {/* Header Bar */}
          <div className="flex items-center justify-between px-4 py-2.5 bg-zinc-900/80 border-b border-zinc-800">
            <div className="flex items-center gap-2">
              <Terminal className="w-4 h-4 text-zinc-400" />
              <div className="flex gap-1">
                {(['curl', 'js', 'python'] as const).map((lang) => (
                  <button
                    key={lang}
                    onClick={() => setActiveTab(lang)}
                    className={`px-3 py-1 rounded-lg text-xs font-medium transition cursor-pointer ${
                      activeTab === lang
                        ? 'bg-zinc-800 text-white font-semibold'
                        : 'text-zinc-400 hover:text-zinc-200'
                    }`}
                  >
                    {lang === 'curl' ? 'cURL' : lang === 'js' ? 'JavaScript' : 'Python'}
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={handleCopy}
              className="flex items-center gap-1 px-2.5 py-1 text-xs text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition cursor-pointer"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-400">Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy</span>
                </>
              )}
            </button>
          </div>

          {/* Snippet Body */}
          <pre className="p-4 sm:p-5 text-xs sm:text-sm font-mono text-zinc-300 overflow-x-auto whitespace-pre leading-relaxed">
            {snippets[activeTab]}
          </pre>
        </div>
      </div>
    </section>
  );
};
