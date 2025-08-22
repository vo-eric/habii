# Habii Desktop App 🚀

A desktop version of the Habii web application built with **Electron + Next.js** that connects to your **shared production WebSocket server**.

## 🌐 Shared WebSocket Architecture

Your desktop app now connects to the **same WebSocket server** as your web app, enabling:

- ✅ **Cross-platform sync**: Web users and desktop users in the same rooms
- ✅ **Real-time animation sharing**: Animations sync between web and desktop
- ✅ **Shared creature rooms**: Join the same rooms across platforms
- ✅ **Unified user experience**: Same features everywhere

## 🏗️ Architecture

```
🌐 Production Environment
├── Vercel (Web App) ────────┐
├── Desktop App (Pi) ───────┼── Shared WebSocket Server (Render)
└── Desktop App (PC) ───────┘    ├── Real-time sync
                                 ├── Creature rooms
                                 └── Animation events

💻 Desktop App Structure
├── Electron Main Process
│   └── 🖼️ Window Management + Next.js server
└── Electron Renderer
    ├── 🎨 Next.js Frontend (port 8888)
    ├── 📡 WebSocket Client → Production Server
    ├── 🔥 Firebase Auth
    └── 🎯 Your Components
```

## 🚀 Quick Setup

### Step 1: Configure Production WebSocket URL

Update `renderer/next.config.ts` with your production WebSocket server:

```typescript
env: {
  // Replace with your actual Render WebSocket URL
  NEXT_PUBLIC_WEBSOCKET_URL: 'https://your-websocket-server.onrender.com',
  NEXT_PUBLIC_APP_URL: 'http://localhost:8888',

  // Add your real Firebase config
  NEXT_PUBLIC_FIREBASE_API_KEY: 'your_real_api_key',
  NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: 'your_project.firebaseapp.com',
  // ... etc
}
```

### Step 2: Build for Raspberry Pi

```bash
# Install dependencies
bun install
cd renderer && bun install && cd ..

# Build for Raspberry Pi
npm run build:pi
```

### Step 3: Deploy to Raspberry Pi

```bash
# Copy to Pi
scp dist/Habii-1.0.0-arm64.AppImage pi@your-pi-ip:~/

# On the Pi: make executable and run
chmod +x ~/Habii-1.0.0-arm64.AppImage
./Habii-1.0.0-arm64.AppImage
```

## ✨ What This Enables

### **Cross-Platform Real-Time Sync**

- User on **web browser** triggers an animation
- Users on **desktop app** see it instantly
- Users on **Raspberry Pi** see it instantly
- All sharing the same creature rooms!

### **Development Workflow**

```bash
# Development mode (local Next.js + production WebSocket)
npm run dev

# Production builds
npm run build:pi     # Raspberry Pi (ARM64)
npm run build:linux  # Regular Linux
npm run build:mac    # macOS
npm run build:win    # Windows
```

## 🔧 Configuration Options

### **Production WebSocket Server**

```typescript
// Uses your existing Render deployment
NEXT_PUBLIC_WEBSOCKET_URL: 'https://your-websocket-server.onrender.com';
```

### **Local Development**

```typescript
// For testing locally
NEXT_PUBLIC_WEBSOCKET_URL: 'http://localhost:3001';
```

### **Environment Variables**

You can also use environment variables at build time:

```bash
NEXT_PUBLIC_WEBSOCKET_URL=https://your-server.onrender.com npm run build:pi
```

## 🌟 Benefits of This Architecture

### **1. Unified Experience**

- Same features across web and desktop
- Shared user sessions and creature rooms
- Real-time sync between all platforms

### **2. Simplified Deployment**

- No need to manage separate WebSocket servers
- Reuse your existing production infrastructure
- Desktop app focuses on UI, server handles sync

### **3. Scalability**

- Your Render WebSocket server handles all connections
- Desktop apps are just additional clients
- Easy to add more platforms later

### **4. Development Efficiency**

- Single WebSocket server to maintain
- Shared business logic
- Consistent behavior across platforms

## 🛠️ Files Changed

1. **`main/background.ts`**: Removed embedded WebSocket server
2. **`renderer/next.config.ts`**: Points to production WebSocket URL
3. **`package.json`**: Removed WebSocket dependencies

## 🚀 Next Steps

1. **Update WebSocket URL** in `renderer/next.config.ts`
2. **Add Firebase credentials** for authentication
3. **Build and test** on your development machine
4. **Deploy to Raspberry Pi** and test cross-platform sync
5. **Celebrate** having a unified real-time experience! 🎉

Your desktop app is now a **first-class citizen** in your Habii ecosystem! 🌟
