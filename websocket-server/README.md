# Habii WebSocket Server

Standalone WebSocket server for Habii animation synchronization, designed to be deployed on Render.com.

## Features

- Real-time animation synchronization between users viewing the same creature
- Firebase authentication integration
- Room-based isolation per creature
- Precise timing control for synchronized animations
- Automatic reconnection handling

## Local Development

```bash
# Install dependencies
bun install

# Run in development mode
bun run dev

# Build for production
bun run build

# Start production server
bun run start
```

## Deployment on Render.com

1. **Connect your repository** to Render.com
2. **Create a new Web Service**
3. **Configure the service**:
   - **Repository**: Your habii repo
   - **Root Directory**: `websocket-server`
   - **Build Command**: `bun install && bun run build`
   - **Start Command**: `bun run start`
   - **Environment**: `Node`

4. **Set Environment Variables**:
   ```
   NODE_ENV=production
   FIREBASE_SERVICE_ACCOUNT_KEY={"type":"service_account",...}
   ALLOWED_ORIGINS=https://your-vercel-app.vercel.app
   ```

5. **Deploy** and get your WebSocket URL (e.g., `https://your-websocket-server.onrender.com`)

## Environment Variables

- `NODE_ENV`: Set to `production` for production deployment
- `FIREBASE_SERVICE_ACCOUNT_KEY`: Firebase service account JSON (stringified)
- `ALLOWED_ORIGINS`: Comma-separated list of allowed origins for CORS
- `PORT`: Server port (Render sets this automatically)

## Health Check

The server provides a health check endpoint at `/health` that returns:
```json
{
  "status": "ok",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

## Architecture

- **Express.js**: HTTP server with health check endpoint
- **Socket.IO**: WebSocket server with room management
- **Firebase Admin**: Authentication and user verification
- **TypeScript**: Type-safe development and deployment
