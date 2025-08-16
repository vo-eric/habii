/**
 * Client-only Database Module
 * Exports only client-side database components to prevent server-side code from being bundled
 */

// Types
export * from './types';

// Client Adapters
export { DatabaseAdapter, BaseAdapter } from './adapters/base.adapter';
export { FirebaseClientAdapter } from './adapters/firebase/client.adapter';

// Repositories
export { CreatureRepository } from './repositories';

// Client-only Factory
export { ClientDatabaseFactory, clientDatabaseFactory } from './client-factory';

// Alias for backward compatibility
export const DatabaseFactory = ClientDatabaseFactory;
export const databaseFactory = clientDatabaseFactory;
