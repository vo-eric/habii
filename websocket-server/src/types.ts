/**
 * WebSocket event types and interfaces for animation synchronization
 */

export interface AnimationEvent {
  type: 'feed' | 'play' | 'rest' | 'poop' | 'pet' | 'media';
  creatureId: string;
  userId: string;
  userName?: string;
  timestamp: number; // When to trigger animation (Unix timestamp)
  duration?: number; // Animation duration in ms
  stats?: {
    hunger?: number;
    love?: number;
    tiredness?: number;
  };
  mediaConfig?: {
    type: 'image' | 'video';
    src: string;
    duration: number;
  };
}

export interface SocketUser {
  uid: string;
  email?: string;
  creatureId?: string;
}

// Server to Client events
export interface ServerToClientEvents {
  'animation:sync': (event: AnimationEvent) => void;
  'user:joined': (data: { userId: string; userName?: string }) => void;
  'user:left': (data: { userId: string; userName?: string }) => void;
  'room:members': (members: string[]) => void;
  error: (error: { message: string; code?: string }) => void;
}

// Client to Server events
export interface ClientToServerEvents {
  'animation:trigger': (
    event: Omit<AnimationEvent, 'userId' | 'timestamp'>,
    callback?: (response: { success: boolean; error?: string }) => void
  ) => void;
  'creature:join': (
    creatureId: string,
    callback?: (response: { success: boolean; error?: string }) => void
  ) => void;
  'creature:leave': (creatureId: string) => void;
}

// Inter-server events (for scaling)
export interface InterServerEvents {
  ping: () => void;
}

// Socket data
export interface SocketData {
  user: SocketUser;
  creatureRoom?: string;
}
