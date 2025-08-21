# WebSocket Server Environment Setup

## For Development (Local Testing)

1. **Create `.env` file in `websocket-server/` directory:**

```bash
# Development environment
NODE_ENV=development
PORT=3001
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:3001
```

2. **Start the WebSocket server:**

```bash
cd websocket-server
bun run dev
```

3. **In your web app, set the WebSocket URL:**

Create `.env.local` in `web-app/` directory:

```bash
NEXT_PUBLIC_WEBSOCKET_URL=http://localhost:3001
```

## For Production (Live Site)

1. **Deploy WebSocket Server:**

You can deploy the WebSocket server to:

- Heroku
- Railway
- DigitalOcean
- AWS
- Google Cloud Platform

2. **Set Production Environment Variables:**

```bash
NODE_ENV=production
PORT=3001
ALLOWED_ORIGINS=https://habii-235d1.web.app,https://habii-235d1.firebaseapp.com,https://yourdomain.com
FIREBASE_SERVICE_ACCOUNT_KEY={"type":"service_account",...}
```

3. **Update Web App Environment:**

In your production environment (Vercel, Netlify, etc.), set:

```bash
NEXT_PUBLIC_WEBSOCKET_URL=https://your-websocket-server-url.com
```

## Testing Cross-Domain WebSocket

### Option 1: Deploy WebSocket Server to Production

1. Deploy the WebSocket server to a hosting service
2. Update your web app's environment to point to the production WebSocket server
3. Both your local dev and live site will connect to the same WebSocket server

### Option 2: Use ngrok for Local Development

1. **Install ngrok:**

```bash
npm install -g ngrok
```

2. **Start your WebSocket server locally:**

```bash
cd websocket-server
bun run dev
```

3. **Create ngrok tunnel:**

```bash
ngrok http 3001
```

4. **Use the ngrok URL in your live site:**
   Set `NEXT_PUBLIC_WEBSOCKET_URL` to the ngrok URL (e.g., `https://abc123.ngrok.io`)

5. **Update WebSocket server CORS:**
   Add the ngrok URL to the allowed origins in `websocket-server/src/server.ts`

## Troubleshooting

### CORS Errors

- Make sure your domain is in the `ALLOWED_ORIGINS` list
- Check that the protocol (http/https) matches
- Ensure no trailing slashes in the origin URLs

### Connection Errors

- Verify the WebSocket server is running
- Check the `NEXT_PUBLIC_WEBSOCKET_URL` is correct
- Ensure Firebase authentication is working

### Authentication Errors

- In development, the server accepts `dev-token`
- In production, make sure Firebase Admin SDK is configured
- Check that the user has a valid Firebase ID token
