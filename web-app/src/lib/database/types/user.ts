import { Timestamp } from './database';

export interface User {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  createdAt: Timestamp;
  lastLoginAt: Timestamp;
  provider: 'email' | 'google';
  isActive?: boolean;
  preferences?: UserPreferences;
}

export interface UserPreferences {
  theme?: 'light' | 'dark' | 'auto';
  emailNotifications?: boolean;
  pushNotifications?: boolean;
  language?: string;
}

export interface CreateUserInput {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL?: string | null;
  provider: 'email' | 'google';
}

export interface UpdateUserInput {
  displayName?: string | null;
  photoURL?: string | null;
  preferences?: Partial<UserPreferences>;
  isActive?: boolean;
}
