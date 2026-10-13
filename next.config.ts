import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ['ffmpeg-static'],
  outputFileTracingIncludes: {
    '/api/**': ['./bin/**', './public/bin/**'],
  },
};

export default nextConfig;
