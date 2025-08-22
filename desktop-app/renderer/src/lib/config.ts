export const config = {
  // WebSocket Configuration
  websocket: {
    url: process.env.NEXT_PUBLIC_WEBSOCKET_URL || 'http://localhost:3001',
  },

  // App Configuration
  app: {
    url: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
    environment: process.env.NODE_ENV || 'development',
  },

  // Firebase Configuration
  firebase: {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  },
};

// Validate required configuration
export function validateConfig() {
  const errors: string[] = [];

  if (!config.websocket.url) {
    errors.push('NEXT_PUBLIC_WEBSOCKET_URL is required');
  }

  if (!config.firebase.apiKey) {
    errors.push('NEXT_PUBLIC_FIREBASE_API_KEY is required');
  }

  if (errors.length > 0) {
    console.error('Configuration errors:', errors);
    throw new Error(
      `Missing required environment variables: ${errors.join(', ')}`
    );
  }
}

// Get WebSocket URL with proper protocol
export function getWebSocketUrl(): string {
  const url = config.websocket.url;

  // If it's already a WebSocket URL, return as is
  if (url.startsWith('ws://') || url.startsWith('wss://')) {
    return url;
  }

  // Convert HTTP/HTTPS to WebSocket
  if (url.startsWith('https://')) {
    return url.replace('https://', 'wss://');
  }

  if (url.startsWith('http://')) {
    return url.replace('http://', 'ws://');
  }

  // Default to wss:// for production, ws:// for development
  const protocol = config.app.environment === 'production' ? 'wss://' : 'ws://';
  return `${protocol}${url}`;
}
