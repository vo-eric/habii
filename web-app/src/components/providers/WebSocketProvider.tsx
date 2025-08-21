'use client';

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useRef,
} from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from './AuthProvider';
import { config, getWebSocketUrl } from '@/lib/config';
import type {
  ServerToClientEvents,
  ClientToServerEvents,
  AnimationEvent,
} from '@/lib/websocket';

interface WebSocketContextType {
  socket: Socket<ServerToClientEvents, ClientToServerEvents> | null;
  connected: boolean;
  creatureRoom: string | null;
  joinCreatureRoom: (creatureId: string) => Promise<void>;
  leaveCreatureRoom: (creatureId: string) => void;
  triggerAnimation: (
    type: 'feed' | 'play' | 'rest',
    creatureId: string
  ) => Promise<void>;
  onAnimationSync: (callback: (event: AnimationEvent) => void) => () => void;
}

const WebSocketContext = createContext<WebSocketContextType | undefined>(
  undefined
);

export const useWebSocket = () => {
  const context = useContext(WebSocketContext);
  if (context === undefined) {
    throw new Error('useWebSocket must be used within a WebSocketProvider');
  }
  return context;
};

interface WebSocketProviderProps {
  children: React.ReactNode;
}

export const WebSocketProvider: React.FC<WebSocketProviderProps> = ({
  children,
}) => {
  const { user } = useAuth();
  const [socket, setSocket] = useState<Socket<
    ServerToClientEvents,
    ClientToServerEvents
  > | null>(null);
  const [connected, setConnected] = useState(false);
  const [creatureRoom, setCreatureRoom] = useState<string | null>(null);
  const animationCallbacksRef = useRef<Set<(event: AnimationEvent) => void>>(
    new Set()
  );

  // Initialize socket connection when user is authenticated
  useEffect(() => {
    if (!user) {
      // Disconnect if user logs out
      if (socket) {
        console.log('User logged out, disconnecting WebSocket');
        socket.disconnect();
        setSocket(null);
        setConnected(false);
        setCreatureRoom(null);
      }
      return;
    }

    // Already connected
    if (socket?.connected) {
      return;
    }

    console.log('Initializing WebSocket connection...');

    // Get the user's ID token for authentication
    const initializeSocket = async () => {
      let token = 'dev-token';

      try {
        // In production, get the actual Firebase ID token
        if (process.env.NODE_ENV === 'production') {
          console.log('Getting Firebase ID token for production...');
          token = await user.getIdToken();
          console.log('Firebase ID token obtained successfully');
        } else {
          console.log('Using development token');
        }
      } catch (error) {
        console.error('Failed to get ID token:', error);
        // Fallback to dev token if Firebase token fails
        token = 'dev-token';
      }
      const websocketUrl = getWebSocketUrl();
      console.log('Connecting to WebSocket with token:', token);
      console.log('WebSocket URL:', websocketUrl);

      const newSocket = io(websocketUrl, {
        auth: {
          token,
        },
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionAttempts: 5,
        timeout: 20000, // Increase timeout for production
        forceNew: true,
      });

      // Connection event handlers
      newSocket.on('connect', () => {
        console.log('WebSocket connected successfully');
        setConnected(true);

        // Rejoin creature room if we were in one
        if (creatureRoom) {
          const creatureId = creatureRoom.replace('creature:', '');
          newSocket.emit('creature:join', creatureId);
        }
      });

      newSocket.on('disconnect', (reason) => {
        console.log('WebSocket disconnected:', reason);
        setConnected(false);
      });

      newSocket.on('connect_error', (error) => {
        console.error('WebSocket connection error:', error.message);
        console.error('Connection error details:', {
          message: error.message,
          name: error.name,
          stack: error.stack,
        });

        // Log additional debugging info
        console.log('Current environment:', config.app.environment);
        console.log('WebSocket URL being used:', websocketUrl);
        console.log('User authenticated:', !!user);
      });

      // Room events (simplified - no UI tracking needed)
      newSocket.on('user:joined', ({ userId, userName }) => {
        console.log(`User ${userName || userId} joined the room`);
      });

      newSocket.on('user:left', ({ userId, userName }) => {
        console.log(`User ${userName || userId} left the room`);
      });

      // Animation sync event
      newSocket.on('animation:sync', (event) => {
        console.log('Received animation sync event:', event);
        // Call all registered animation callbacks
        animationCallbacksRef.current.forEach((callback) => {
          callback(event);
        });
      });

      // Error handling
      newSocket.on('error', (error) => {
        console.error('WebSocket error:', error);
      });

      setSocket(newSocket);
    };

    initializeSocket();

    // Cleanup on unmount or user change
    return () => {
      if (socket) {
        console.log('Cleaning up WebSocket connection');
        socket.disconnect();
      }
    };
  }, [user]); // Only re-run when user changes

  // Join creature room
  const joinCreatureRoom = useCallback(
    async (creatureId: string) => {
      if (!socket?.connected) {
        throw new Error('WebSocket not connected');
      }

      return new Promise<void>((resolve, reject) => {
        socket.emit('creature:join', creatureId, (response) => {
          if (response.success) {
            setCreatureRoom(`creature:${creatureId}`);
            console.log(`Joined creature room: ${creatureId}`);
            resolve();
          } else {
            console.error('Failed to join creature room:', response.error);
            reject(new Error(response.error || 'Failed to join room'));
          }
        });
      });
    },
    [socket]
  );

  // Leave creature room
  const leaveCreatureRoom = useCallback(
    (creatureId: string) => {
      if (!socket?.connected) {
        return;
      }

      socket.emit('creature:leave', creatureId);
      setCreatureRoom(null);
      console.log(`Left creature room: ${creatureId}`);
    },
    [socket]
  );

  // Trigger animation
  const triggerAnimation = useCallback(
    async (type: 'feed' | 'play' | 'rest', creatureId: string) => {
      if (!socket?.connected) {
        throw new Error('WebSocket not connected');
      }

      if (!creatureRoom) {
        throw new Error('Not in a creature room');
      }

      return new Promise<void>((resolve, reject) => {
        socket.emit(
          'animation:trigger',
          {
            type,
            creatureId,
          },
          (response) => {
            if (response?.success) {
              console.log(`Animation ${type} triggered successfully`);
              resolve();
            } else {
              console.error('Failed to trigger animation:', response?.error);
              reject(
                new Error(response?.error || 'Failed to trigger animation')
              );
            }
          }
        );
      });
    },
    [socket, creatureRoom]
  );

  // Subscribe to animation sync events
  const onAnimationSync = useCallback(
    (callback: (event: AnimationEvent) => void) => {
      animationCallbacksRef.current.add(callback);

      // Return unsubscribe function
      return () => {
        animationCallbacksRef.current.delete(callback);
      };
    },
    []
  );

  const value: WebSocketContextType = {
    socket,
    connected,
    creatureRoom,
    joinCreatureRoom,
    leaveCreatureRoom,
    triggerAnimation,
    onAnimationSync,
  };

  return (
    <WebSocketContext.Provider value={value}>
      {children}
    </WebSocketContext.Provider>
  );
};
