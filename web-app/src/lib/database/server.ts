/**
 * Server-only Database Module
 * Exports server-side database components for API routes
 */

import { ServerDatabaseFactory } from './server-factory';

// Types
export * from './types';

// Server Adapters
export { BaseAdapter } from './adapters/base.adapter';
export type { DatabaseAdapter } from './adapters/base.adapter';
export { FirebaseServerAdapter } from './adapters/firebase/server.adapter';

// Repositories
export { CreatureRepository } from './repositories';

// Server-only Factory
export { ServerDatabaseFactory, serverDatabaseFactory } from './server-factory';

// Alias for backward compatibility
export const DatabaseFactory = ServerDatabaseFactory;
