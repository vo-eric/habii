/**
 * Database Abstraction Layer
 * Main exports for the database module
 *
 * For client-side usage, import from '@/lib/database/client'
 * For server-side usage, import from '@/lib/database/server'
 */

// Types
export * from './types';

// Factory (will use appropriate adapter based on environment)
export { DatabaseFactory, databaseFactory } from './factory';
