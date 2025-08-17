/**
 * Client-only Database Factory
 * Creates client-side database adapters only
 */

import { DatabaseAdapter } from './adapters/base.adapter';
import { FirebaseClientAdapter } from './adapters/firebase/client.adapter';
import { CreatureRepository } from './repositories';
import { DatabaseConfig } from './types';

export class ClientDatabaseFactory {
  private static clientAdapter: DatabaseAdapter | null = null;
  private static config: DatabaseConfig | null = null;

  /**
   * Configure the database factory
   */
  static configure(config: DatabaseConfig): void {
    this.config = config;
  }

  /**
   * Get client database adapter
   */
  static async getAdapter(): Promise<DatabaseAdapter> {
    // Return existing adapter if already connected
    if (this.clientAdapter?.isConnected()) {
      return this.clientAdapter;
    }

    // Create new adapter based on configuration
    const dbType =
      this.config?.type || process.env.NEXT_PUBLIC_DATABASE_TYPE || 'firebase';

    let adapter: DatabaseAdapter;

    switch (dbType) {
      case 'firebase':
        adapter = new FirebaseClientAdapter(this.config?.options);
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
    this.clientAdapter = adapter;

    return adapter;
  }

  /**
   * Get a creature repository instance
   */
  static async getCreatureRepository(): Promise<CreatureRepository> {
    const adapter = await this.getAdapter();
    return new CreatureRepository(adapter);
  }

  /**
   * Disconnect adapter
   */
  static async disconnect(): Promise<void> {
    if (this.clientAdapter?.isConnected()) {
      await this.clientAdapter.disconnect();
      this.clientAdapter = null;
    }
  }

  /**
   * Reset factory configuration
   */
  static reset(): void {
    this.config = null;
    this.clientAdapter = null;
  }
}

/**
 * Singleton instance for convenience
 */
export const clientDatabaseFactory = ClientDatabaseFactory;
