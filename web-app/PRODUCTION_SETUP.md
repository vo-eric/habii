# Production Setup Guide for Vercel + Render

This guide helps you set up your Habii app for production with the Next.js frontend on Vercel and WebSocket server on Render.

## Prerequisites

1. **Vercel Account**: For hosting the Next.js frontend
2. **Render Account**: For hosting the WebSocket server
3. **Firebase Project**: For authentication and database

## Step 1: Deploy WebSocket Server to Render

### 1.1 Prepare WebSocket Server

1. Navigate to the `websocket-server` directory
2. Ensure your `package.json` has the correct start script:
   ```json
   {
     "scripts": {
       "start": "bun run src/server.ts",
       "dev": "bun run --watch src/server.ts"
     }
   }
   ```

### 1.2 Deploy to Render

1. Go to [Render Dashboard](https://dashboard.render.com/)
2. Click "New" → "Web Service"
3. Connect your GitHub repository
4. Configure the service:
   - **Name**: `habii-websocket-server`
   - **Root Directory**: `websocket-server`
   - **Runtime**: `Bun`
   - **Build Command**: `bun install`
   - **Start Command**: `bun run start`
   - **Environment**: `Node`

### 1.3 Set Environment Variables on Render

Add these environment variables in your Render service:

```env
NODE_ENV=production
PORT=10000
ALLOWED_ORIGINS=https://your-vercel-domain.vercel.app,https://habii-235d1.web.app,https://habii-235d1.firebaseapp.com
FIREBASE_SERVICE_ACCOUNT_KEY={"type":"service_account",...}
```

**Important**: Replace `your-vercel-domain.vercel.app` with your actual Vercel domain.

## Step 2: Deploy Next.js App to Vercel

### 2.1 Prepare Next.js App

1. Navigate to the `web-app` directory
2. Ensure your `package.json` has the correct build script:
   ```json
   {
     "scripts": {
       "build": "next build",
       "start": "next start",
       "dev": "next dev"
     }
   }
   ```

### 2.2 Deploy to Vercel

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click "New Project"
3. Import your GitHub repository
4. Configure the project:
   - **Framework Preset**: `Next.js`
   - **Root Directory**: `web-app`
   - **Build Command**: `npm run build`
   - **Output Directory**: `.next`

### 2.3 Set Environment Variables on Vercel

Add these environment variables in your Vercel project:

```env
# Firebase Configuration
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_auth_domain
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_storage_bucket
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id

# WebSocket Configuration
NEXT_PUBLIC_WEBSOCKET_URL=https://your-render-service.onrender.com
NEXT_PUBLIC_APP_URL=https://your-vercel-domain.vercel.app
```

**Important**:

- Replace `your-render-service.onrender.com` with your actual Render service URL
- Replace `your-vercel-domain.vercel.app` with your actual Vercel domain

## Step 3: Update CORS Configuration

After deployment, update the CORS configuration in your WebSocket server to include your Vercel domain:

1. Go to your Render service
2. Add your Vercel domain to the `ALLOWED_ORIGINS` environment variable
3. Redeploy the service

## Step 4: Test the Connection

### 4.1 Check WebSocket Server Health

Visit your Render service URL + `/health`:

```
https://your-render-service.onrender.com/health
```

You should see:

```json
{
  "status": "ok",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

### 4.2 Test WebSocket Connection

1. Open your Vercel app
2. Open browser developer tools
3. Check the console for WebSocket connection logs
4. Look for:
   - "WebSocket connected successfully" ✅
   - Any connection errors ❌

## Troubleshooting

### Common Issues

#### 1. CORS Errors

**Symptoms**: `Access to fetch at 'wss://...' from origin 'https://...' has been blocked by CORS policy`

**Solution**:

- Add your Vercel domain to `ALLOWED_ORIGINS` in Render
- Redeploy the WebSocket server

#### 2. Connection Timeout

**Symptoms**: `WebSocket connection error: timeout`

**Solutions**:

- Check if Render service is running
- Verify the WebSocket URL is correct
- Check firewall/proxy settings

#### 3. Authentication Errors

**Symptoms**: `Authentication failed` in WebSocket logs

**Solutions**:

- Verify Firebase service account key in Render
- Check Firebase project configuration
- Ensure Firebase Admin SDK is properly initialized

#### 4. Environment Variables Not Loading

**Symptoms**: App uses default localhost URLs

**Solutions**:

- Verify environment variables are set in Vercel
- Check variable names (must start with `NEXT_PUBLIC_` for client-side)
- Redeploy after adding variables

### Debug Commands

#### Check Render Service Logs

```bash
# In Render dashboard, check the logs tab
# Look for startup messages and any errors
```

#### Check Vercel Deployment Logs

```bash
# In Vercel dashboard, check the deployment logs
# Look for build errors or missing environment variables
```

#### Test WebSocket Connection Manually

```javascript
// In browser console
const socket = io('https://your-render-service.onrender.com', {
  transports: ['websocket'],
  timeout: 20000,
});

socket.on('connect', () => console.log('Connected!'));
socket.on('connect_error', (error) => console.error('Error:', error));
```

## Monitoring

### Render Monitoring

- Check service uptime in Render dashboard
- Monitor resource usage (CPU, memory)
- Set up alerts for service downtime

### Vercel Monitoring

- Check deployment status
- Monitor function execution times
- Set up error tracking (e.g., Sentry)

### WebSocket Monitoring

- Monitor active connections
- Track message throughput
- Set up logging for debugging

## Security Considerations

1. **Firebase Authentication**: Ensure proper token verification
2. **CORS**: Only allow necessary origins
3. **Rate Limiting**: Consider implementing rate limiting on WebSocket server
4. **Environment Variables**: Never commit sensitive data to version control
5. **HTTPS/WSS**: Always use secure connections in production

## Cost Optimization

### Render

- Use the free tier for development
- Scale up only when needed
- Monitor usage to avoid unexpected charges

### Vercel

- Use the free tier for personal projects
- Consider Pro plan for team features
- Monitor bandwidth usage

## Next Steps

1. Set up monitoring and alerting
2. Implement error tracking (Sentry)
3. Add performance monitoring
4. Set up CI/CD pipelines
5. Consider using a CDN for static assets
