/**
 * Database Factory
 * Creates appropriate database adapter based on environment and configuration
 */

import { DatabaseAdapter } from './adapters/base.adapter';
import { FirebaseClientAdapter } from './adapters/firebase/client.adapter';
import { CreatureRepository } from './repositories';
import { DatabaseConfig } from './types';

export class DatabaseFactory {
  private static serverAdapter: DatabaseAdapter | null = null;
  private static clientAdapter: DatabaseAdapter | null = null;
  private static config: DatabaseConfig | null = null;

  /**
   * Configure the database factory
   */
  static configure(config: DatabaseConfig): void {
    this.config = config;
  }

  /**
   * Get database adapter based on environment
   */
  static async getAdapter(
    environment?: 'client' | 'server'
  ): Promise<DatabaseAdapter> {
    // Determine environment if not specified
    const env =
      environment || (typeof window !== 'undefined' ? 'client' : 'server');

    // Return existing adapter if already connected
    if (env === 'server' && this.serverAdapter?.isConnected()) {
      return this.serverAdapter;
    }

    if (env === 'client' && this.clientAdapter?.isConnected()) {
      return this.clientAdapter;
    }

    // Create new adapter based on configuration
    const dbType =
      this.config?.type || process.env.NEXT_PUBLIC_DATABASE_TYPE || 'firebase';

    let adapter: DatabaseAdapter;

    switch (dbType) {
      case 'firebase':
        if (env === 'server') {
          // Only import server adapter on server side
          if (typeof window !== 'undefined') {
            throw new Error('Server adapter cannot be used on client side');
          }

          // Dynamically import server adapter to avoid bundling on client
          const { FirebaseServerAdapter } = await import(
            './adapters/firebase/server.adapter'
          );
          adapter = new FirebaseServerAdapter(this.config?.options);
        } else {
          adapter = new FirebaseClientAdapter(this.config?.options);
        }
        break;

      // Future database types can be added here
      // case 'postgres':
      //   adapter = new PostgresAdapter(this.config?.options);
      //   break;

      // case 'mongodb':
      //   adapter = new MongoDBAdapter(this.config?.options);
      //   break;

      // case 'memory':
      //   adapter = new InMemoryAdapter();
      //   break;

      default:
        throw new Error(`Unsupported database type: ${dbType}`);
    }

    // Connect the adapter
    await adapter.connect();

    // Store the adapter for reuse
    if (env === 'server') {
      this.serverAdapter = adapter;
    } else {
      this.clientAdapter = adapter;
    }

    return adapter;
  }

  /**
   * Get a creature repository instance
   */
  static async getCreatureRepository(
    environment?: 'client' | 'server'
  ): Promise<CreatureRepository> {
    const adapter = await this.getAdapter(environment);
    return new CreatureRepository(adapter);
  }

  /**
   * Disconnect all adapters
   */
  static async disconnectAll(): Promise<void> {
    const promises: Promise<void>[] = [];

    if (this.serverAdapter?.isConnected()) {
      promises.push(this.serverAdapter.disconnect());
      this.serverAdapter = null;
    }

    if (this.clientAdapter?.isConnected()) {
      promises.push(this.clientAdapter.disconnect());
      this.clientAdapter = null;
    }

    await Promise.all(promises);
  }

  /**
   * Reset factory configuration
   */
  static reset(): void {
    this.config = null;
    this.serverAdapter = null;
    this.clientAdapter = null;
  }
}

/**
 * Singleton instance for convenience
 */
export const databaseFactory = DatabaseFactory;
