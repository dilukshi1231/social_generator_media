import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  webpack: (config, { isServer }) => {
    // Fix for FFmpeg.wasm
    config.resolve.alias = {
      ...config.resolve.alias,
      '@ffmpeg/ffmpeg': '@ffmpeg/ffmpeg',
      '@ffmpeg/util': '@ffmpeg/util',
    };

    // Exclude ffmpeg from optimization
    config.optimization = {
      ...config.optimization,
      providedExports: false,
    };

    return config;
  },
  // Allow external images
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
};

export default nextConfig;
