import express from 'express';
import { createServer } from 'http';
import { Server as SocketIOServer, Socket } from 'socket.io';
import cors from 'cors';
import { auth } from './firebase';
import type {
  ClientToServerEvents,
  ServerToClientEvents,
  InterServerEvents,
  SocketData,
  AnimationEvent,
} from './types';

type TypedSocket = Socket<
  ClientToServerEvents,
  ServerToClientEvents,
  InterServerEvents,
  SocketData
>;

type TypedServer = SocketIOServer<
  ClientToServerEvents,
  ServerToClientEvents,
  InterServerEvents,
  SocketData
>;

const app = express();
const httpServer = createServer(app);

// CORS middleware
const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || [
  'http://localhost:3000',
  'http://localhost:3001',
  'https://habii-235d1.web.app',
  'https://habii-235d1.firebaseapp.com',
  // Add your Vercel domain here
  'https://habii-web-app.vercel.app',
  // Add your custom domain here if you have one
  // 'https://yourdomain.com'
];

app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
  })
);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Initialize Socket.IO
const io: TypedServer = new SocketIOServer(httpServer, {
  cors: {
    origin: allowedOrigins,
    credentials: true,
  },
  transports: ['websocket', 'polling'],
});

// Authentication middleware
io.use(async (socket: TypedSocket, next) => {
  try {
    const token = socket.handshake.auth.token;
    const origin = socket.handshake.headers.origin;

    console.log(`Authentication attempt from origin: ${origin}`);
    console.log(`NODE_ENV: ${process.env.NODE_ENV}`);
    console.log(`Token provided: ${token ? 'Yes' : 'No'}`);
    console.log(
      `Token value: ${
        token === 'dev-token' ? 'dev-token' : token ? 'firebase-token' : 'none'
      }`
    );

    if (!token) {
      console.error('No authentication token provided');
      return next(new Error('No authentication token provided'));
    }

    // Skip token verification in development
    if (
      (process.env.NODE_ENV === 'development' || !process.env.NODE_ENV) &&
      token === 'dev-token'
    ) {
      console.log('Using development token authentication');
      socket.data.user = {
        uid: 'dev-user-' + Math.random().toString(36).substr(2, 9),
        email: 'dev@example.com',
      };
      return next();
    }

    // Temporary: Allow any token in development for debugging
    if (process.env.NODE_ENV === 'development' || !process.env.NODE_ENV) {
      console.log('Temporary development bypass - accepting any token');
      socket.data.user = {
        uid: 'dev-user-' + Math.random().toString(36).substr(2, 9),
        email: 'dev@example.com',
      };
      return next();
    }

    // Verify Firebase ID token
    console.log('Attempting Firebase token verification...');
    const decodedToken = await auth.verifyIdToken(token);

    // Store user data in socket
    socket.data.user = {
      uid: decodedToken.uid,
      email: decodedToken.email,
    };

    console.log(`User ${decodedToken.email} authenticated via WebSocket`);
    next();
  } catch (error) {
    console.error('Socket authentication error:', error);
    console.error('Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      code: (error as any)?.code,
      stack: error instanceof Error ? error.stack : undefined,
    });
    next(new Error('Authentication failed'));
  }
});

// Connection handler
io.on('connection', (socket: TypedSocket) => {
  const userId = socket.data.user?.uid;
  console.log(`User ${userId} connected to WebSocket`);

  // Join creature room
  socket.on('creature:join', async (creatureId, callback) => {
    try {
      const roomName = `creature:${creatureId}`;

      // Leave previous room if any
      if (socket.data.creatureRoom) {
        socket.leave(socket.data.creatureRoom);
        console.log(`User ${userId} left room ${socket.data.creatureRoom}`);
      }

      // Join new room
      await socket.join(roomName);
      socket.data.creatureRoom = roomName;
      socket.data.user.creatureId = creatureId;

      // Notify room members
      socket.to(roomName).emit('user:joined', {
        userId: userId!,
        userName: socket.data.user.email,
      });

      // Send current room members to the joining user
      const roomSockets = await io.in(roomName).fetchSockets();
      const members = roomSockets
        .map((s) => s.data.user?.uid)
        .filter(Boolean) as string[];
      socket.emit('room:members', members);

      console.log(`User ${userId} joined creature room ${roomName}`);
      callback?.({ success: true });
    } catch (error) {
      console.error('Error joining creature room:', error);
      callback?.({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to join room',
      });
    }
  });

  // Leave creature room
  socket.on('creature:leave', (creatureId) => {
    const roomName = `creature:${creatureId}`;
    socket.leave(roomName);

    // Notify room members
    socket.to(roomName).emit('user:left', {
      userId: userId!,
      userName: socket.data.user.email,
    });

    socket.data.creatureRoom = undefined;
    console.log(`User ${userId} left creature room ${roomName}`);
  });

  // Handle animation triggers
  socket.on('animation:trigger', async (event, callback) => {
    try {
      if (!socket.data.creatureRoom) {
        throw new Error('Not in a creature room');
      }

      // Create the full animation event with synchronized timing
      const animationEvent: AnimationEvent = {
        ...event,
        userId: userId!,
        userName: socket.data.user.email,
        timestamp: Date.now() + 300, // Schedule 300ms in the future for sync
      };

      // Broadcast to all room members (including sender)
      io.to(socket.data.creatureRoom).emit('animation:sync', animationEvent);

      console.log(
        `Animation ${event.type} triggered by ${userId} for creature ${event.creatureId}`
      );

      callback?.({ success: true });
    } catch (error) {
      console.error('Error triggering animation:', error);
      callback?.({
        success: false,
        error:
          error instanceof Error
            ? error.message
            : 'Failed to trigger animation',
      });
    }
  });

  // Handle disconnection
  socket.on('disconnect', () => {
    if (socket.data.creatureRoom) {
      socket.to(socket.data.creatureRoom).emit('user:left', {
        userId: userId!,
        userName: socket.data.user.email,
      });
    }
    console.log(`User ${userId} disconnected from WebSocket`);
  });
});

const PORT = process.env.PORT || 3001;

httpServer.listen(PORT, () => {
  console.log(`🚀 WebSocket server running on port ${PORT}`);
  console.log(`📡 Socket.IO initialized`);
  console.log(
    `🌍 Environment: ${process.env.NODE_ENV || 'development (default)'}`
  );
  console.log(
    `🔐 Development auth: ${
      process.env.NODE_ENV === 'development' || !process.env.NODE_ENV
        ? 'enabled'
        : 'disabled'
    }`
  );
  console.log(`🌐 Allowed origins: ${allowedOrigins.join(', ')}`);
});
