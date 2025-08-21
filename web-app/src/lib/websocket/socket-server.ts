import { Server as HTTPServer } from 'http';
import { Socket, Server as SocketIOServer } from 'socket.io';
import { auth } from '@/lib/firebase-admin';
import {
  ClientToServerEvents,
  ServerToClientEvents,
  InterServerEvents,
  SocketData,
  AnimationEvent,
} from './types';

export type TypedSocket = Socket<
  ClientToServerEvents,
  ServerToClientEvents,
  InterServerEvents,
  SocketData
>;

export type TypedServer = SocketIOServer<
  ClientToServerEvents,
  ServerToClientEvents,
  InterServerEvents,
  SocketData
>;

let io: TypedServer | undefined;

export function initSocketServer(httpServer: HTTPServer): TypedServer {
  if (io) {
    console.log('Socket.IO server already initialized');
    return io;
  }

  console.log('Initializing Socket.IO server...');

  io = new SocketIOServer<
    ClientToServerEvents,
    ServerToClientEvents,
    InterServerEvents,
    SocketData
  >(httpServer, {
    cors: {
      origin: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
      credentials: true,
    },
    transports: ['websocket', 'polling'],
  });

  // Authentication middleware
  io.use(async (socket: TypedSocket, next) => {
    try {
      const token = socket.handshake.auth.token;

      if (!token) {
        return next(new Error('No authentication token provided'));
      }

      // Verify Firebase ID token
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
        // TODO: Verify user owns or has access to this creature
        // For now, we'll allow any authenticated user to join

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
        const roomSockets = await io!.in(roomName).fetchSockets();
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

        // Create the full animation event
        const animationEvent: AnimationEvent = {
          ...event,
          userId: userId!,
          userName: socket.data.user.email,
          timestamp: Date.now() + 300, // Schedule 300ms in the future for sync
        };

        // Broadcast to all room members (including sender)
        io!.to(socket.data.creatureRoom).emit('animation:sync', animationEvent);

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

  return io;
}

export function getSocketServer(): TypedServer | undefined {
  return io;
}
