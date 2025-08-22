# Environment Setup for Habii Desktop App

## Security Notice

**⚠️ IMPORTANT:** Firebase API keys and other sensitive configuration values have been removed from the source code for security reasons.

## Environment Variables Required

Create a `.env.local` file in the `renderer/` directory with the following variables:

```bash
# Firebase Configuration
NEXT_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key_here
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id

# WebSocket Configuration
NEXT_PUBLIC_WEBSOCKET_URL=https://habii.onrender.com
NEXT_PUBLIC_APP_URL=http://localhost:8888
```

## Getting Firebase Configuration

1. Go to your [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Go to Project Settings (gear icon)
4. Scroll down to "Your apps" section
5. Copy the configuration values from your web app

## For Production Builds

For production builds (like the Raspberry Pi), you need to set these environment variables at build time:

```bash
# Set environment variables before building
export NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
export NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_domain
export NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
export NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_bucket
export NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
export NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id

# Then build
bun run build:pi
```

## Security Best Practices

- ✅ **Never commit** `.env.local` files to version control
- ✅ **Use environment variables** instead of hardcoded values
- ✅ **Rotate API keys** regularly
- ✅ **Restrict Firebase rules** to limit access
- ✅ **Use Firebase App Check** for additional security

## Troubleshooting

If you get "Firebase configuration missing" errors:

1. Check that `.env.local` exists in `renderer/` directory
2. Verify all required variables are set
3. Restart the development server after adding environment variables
