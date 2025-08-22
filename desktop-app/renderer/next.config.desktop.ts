import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Use SSR mode instead of static export for Electron
  // output: 'export',
  trailingSlash: true,
  env: {
    NEXT_PUBLIC_WEBSOCKET_URL: 'https://habii.onrender.com',
    NEXT_PUBLIC_APP_URL: 'http://localhost:8888',
    // Firebase Configuration - Load from environment variables only
    NEXT_PUBLIC_FIREBASE_API_KEY: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN:
      process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    NEXT_PUBLIC_FIREBASE_PROJECT_ID:
      process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET:
      process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID:
      process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    NEXT_PUBLIC_FIREBASE_APP_ID: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  },
  // Disable Image optimization for static export
  images: {
    unoptimized: true,
  },
  // Webpack configuration for Electron
  webpack: (config) => {
    config.externals = [...(config.externals || []), 'canvas'];
    return config;
  },
};

export default nextConfig;
