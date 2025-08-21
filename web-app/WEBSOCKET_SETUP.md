# WebSocket Animation Synchronization

## Overview

The Habii app now uses WebSocket connections via Socket.IO for real-time animation synchronization. This replaces the previous database-based scheduling system, providing lower latency and better synchronization between multiple viewers.

## Architecture

### Server Components

1. **Socket.IO Server** (`/src/lib/websocket/socket-server.ts`)

   - Handles WebSocket connections with Firebase authentication
   - Manages creature-specific rooms
   - Broadcasts animation events to all room members

2. **Custom Next.js Server** (`/server.js`)
   - Integrates Socket.IO with Next.js
   - Handles both HTTP and WebSocket connections

### Client Components

1. **WebSocketProvider** (`/src/components/providers/WebSocketProvider.tsx`)

   - Manages Socket.IO client connection
   - Handles authentication and reconnection
   - Provides hooks for components to use

2. **Updated Components**
   - `CreatureAnimation.tsx`: Listens for WebSocket animation events
   - `CreatureActions.tsx`: Emits animation triggers via WebSocket
   - `WebSocketStatus.tsx`: Shows connection status

## Setup Instructions

### 1. Environment Variables

Create a `.env.local` file with the following variables:

```env
# Firebase Configuration (existing)
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_auth_domain
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_storage_bucket
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id

# Firebase Admin SDK (new - for WebSocket authentication)
# Option 1: Full service account JSON (production)
FIREBASE_SERVICE_ACCOUNT_KEY='{"type":"service_account",...}'

# Option 2: Just project ID (local development with default credentials)
# Leave FIREBASE_SERVICE_ACCOUNT_KEY empty

# WebSocket Configuration (new)
NEXT_PUBLIC_WEBSOCKET_URL=http://localhost:3000
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 2. Firebase Admin Setup

For WebSocket authentication, you need Firebase Admin SDK credentials:

**For Production:**

1. Go to Firebase Console → Project Settings → Service Accounts
2. Generate a new private key
3. Convert the JSON to a single-line string
4. Set as `FIREBASE_SERVICE_ACCOUNT_KEY` environment variable

**For Local Development:**

1. Install Firebase CLI: `npm install -g firebase-tools`
2. Login: `firebase login`
3. Set project: `firebase use your-project-id`
4. The app will use default credentials

### 3. Running the Application

```bash
# Install dependencies
npm install

# Run development server with WebSocket support
npm run dev

# For production
npm run build
npm start
```

## How It Works

### Connection Flow

1. User logs in → Firebase authentication
2. WebSocketProvider connects with Firebase ID token
3. When creature loads, client joins creature-specific room
4. All users viewing the same creature share the room

### Animation Synchronization

When a user triggers an action (feed/play/rest):

1. **Database Update**: Stats are updated in Firestore
2. **WebSocket Emission**: Animation event is sent to server
3. **Broadcast**: Server sends event to all room members
4. **Synchronized Playback**: All clients play animation at the same timestamp

### Event Structure

```typescript
interface AnimationEvent {
  type: 'feed' | 'play' | 'rest';
  creatureId: string;
  userId: string;
  userName?: string;
  timestamp: number; // Unix timestamp for synchronized playback
  duration?: number;
  stats?: {
    hunger?: number;
    love?: number;
    tiredness?: number;
  };
}
```

## Benefits

1. **Real-time Synchronization**: All viewers see animations simultaneously
2. **Lower Latency**: Direct WebSocket communication vs database polling
3. **Scalability**: Room-based isolation per creature
4. **Reliability**: Automatic reconnection and fallback to local animations
5. **User Awareness**: See how many users are viewing the same creature

## Debugging

### Check WebSocket Connection

1. Look for the connection status indicator (bottom-right corner)

   - Green: Connected
   - Yellow: Connecting
   - Red: Disconnected

2. Browser Console:
   - Connection logs: "WebSocket connected successfully"
   - Animation events: "🎬 Received WebSocket animation event"
   - Room events: "User joined/left the room"

### Common Issues

**WebSocket fails to connect:**

- Check if custom server is running (`node server.js`)
- Verify Firebase Admin credentials
- Check CORS settings match your domain

**Animations not syncing:**

- Ensure both users are in the same creature room
- Check browser console for WebSocket errors
- Verify Firebase authentication is working

**Server authentication errors:**

- Regenerate Firebase service account key
- Check environment variables are properly set
- Ensure Firebase project ID matches

## Fallback Behavior

If WebSocket connection fails:

1. Stats updates continue via Firestore
2. Animations play locally (not synchronized)
3. App remains functional with degraded experience
4. Connection automatically retries

## Future Enhancements

- [ ] Add typing indicators when multiple users are interacting
- [ ] Show user avatars for room members
- [ ] Add chat functionality within creature rooms
- [ ] Implement presence system (online/offline status)
- [ ] Add animation queuing for rapid actions
- [ ] Support for multiple creatures per user
