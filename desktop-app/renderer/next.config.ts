import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Use static export for Electron production builds
  output: process.env.NODE_ENV === 'production' ? 'export' : undefined,
  trailingSlash: true,

  // Ensure proper base path for Electron
  basePath: process.env.NODE_ENV === 'production' ? '' : '',
  assetPrefix: process.env.NODE_ENV === 'production' ? '' : '',

  env: {
    // Use your production WebSocket server for shared connections
    NEXT_PUBLIC_WEBSOCKET_URL:
      process.env.NEXT_PUBLIC_WEBSOCKET_URL || 'https://habii.onrender.com',
    NEXT_PUBLIC_APP_URL: 'https://habii.life',
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
  webpack: (config, { isServer }) => {
    config.externals = [...(config.externals || []), 'canvas'];

    // Handle client-side only modules
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
      };
    }

    return config;
  },
};

export default nextConfig;
