import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ['ffmpeg-static'],
  outputFileTracingIncludes: {
    '/api/**': ['./bin/**', './public/bin/**', './cookies.txt'],
  },
};

export default nextConfig;
