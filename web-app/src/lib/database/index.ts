/**
 * Database Abstraction Layer
 * Main exports for the database module
 */

// Types
export * from './types';

// Adapters
export { DatabaseAdapter, BaseAdapter } from './adapters/base.adapter';
export {
  FirebaseServerAdapter,
  FirebaseClientAdapter,
} from './adapters/firebase';

// Repositories
export { CreatureRepository } from './repositories';

// Factory
export { DatabaseFactory, databaseFactory } from './factory';
