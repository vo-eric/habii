/**
 * Server-only Database Module
 * Exports server-side database components for API routes
 */

// Types
export * from './types';

// Server Adapters
export { DatabaseAdapter, BaseAdapter } from './adapters/base.adapter';
export { FirebaseServerAdapter } from './adapters/firebase/server.adapter';

// Repositories
export { CreatureRepository } from './repositories';

// Server-only Factory
export { ServerDatabaseFactory, serverDatabaseFactory } from './server-factory';

// Alias for backward compatibility
export const DatabaseFactory = ServerDatabaseFactory;
export const databaseFactory = serverDatabaseFactory;
