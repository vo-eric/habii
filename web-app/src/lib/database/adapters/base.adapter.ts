/**
 * Base Database Adapter Interface
 * All database implementations must implement this interface
 */

import { QueryOptions, PaginatedResult, Timestamp } from '../types';

export interface DatabaseAdapter {
  // Connection management
  connect(): Promise<void>;
  disconnect(): Promise<void>;
  isConnected(): boolean;

  // CRUD Operations
  create<T>(collection: string, data: Omit<T, 'id'>): Promise<string>;
  get<T>(collection: string, id: string): Promise<T | null>;
  update<T>(collection: string, id: string, data: Partial<T>): Promise<void>;
  delete(collection: string, id: string): Promise<void>;

  // Query operations
  query<T>(
    collection: string,
    filters: Record<string, unknown>,
    options?: QueryOptions
  ): Promise<T[]>;

  // Paginated queries
  queryPaginated<T>(
    collection: string,
    filters: Record<string, unknown>,
    options?: QueryOptions
  ): Promise<PaginatedResult<T>>;

  // Specialized queries
  getByField<T>(
    collection: string,
    field: string,
    value: unknown
  ): Promise<T[]>;

  getOneByField<T>(
    collection: string,
    field: string,
    value: unknown
  ): Promise<T | null>;

  // Batch operations (removed for single creature per user)
  // batchCreate<T>(collection: string, items: Omit<T, 'id'>[]): Promise<string[]>;
  // batchUpdate<T>(collection: string, updates: Array<{ id: string; data: Partial<T> }>): Promise<void>;
  // batchDelete(collection: string, ids: string[]): Promise<void>;

  // Transaction support (optional, return this if not supported)
  transaction<T>(callback: (tx: DatabaseAdapter) => Promise<T>): Promise<T>;

  // Utility methods
  convertTimestamp(timestamp: Timestamp): unknown;
  getCurrentTimestamp(): unknown;

  // Collection management
  collectionExists(collection: string): Promise<boolean>;
  createCollection(collection: string): Promise<void>;
  dropCollection(collection: string): Promise<void>;
}

export abstract class BaseAdapter implements DatabaseAdapter {
  protected connected: boolean = false;

  abstract connect(): Promise<void>;
  abstract disconnect(): Promise<void>;

  isConnected(): boolean {
    return this.connected;
  }

  // Abstract methods that must be implemented by subclasses
  abstract create<T>(collection: string, data: Omit<T, 'id'>): Promise<string>;
  abstract get<T>(collection: string, id: string): Promise<T | null>;
  abstract update<T>(
    collection: string,
    id: string,
    data: Partial<T>
  ): Promise<void>;
  abstract delete(collection: string, id: string): Promise<void>;
  abstract query<T>(
    collection: string,
    filters: Record<string, unknown>,
    options?: QueryOptions
  ): Promise<T[]>;
  abstract queryPaginated<T>(
    collection: string,
    filters: Record<string, unknown>,
    options?: QueryOptions
  ): Promise<PaginatedResult<T>>;
  abstract getByField<T>(
    collection: string,
    field: string,
    value: unknown
  ): Promise<T[]>;
  abstract getOneByField<T>(
    collection: string,
    field: string,
    value: unknown
  ): Promise<T | null>;
  // Batch operations removed for single creature per user
  // abstract batchCreate<T>(collection: string, items: Omit<T, 'id'>[]): Promise<string[]>;
  // abstract batchUpdate<T>(collection: string, updates: Array<{ id: string; data: Partial<T> }>): Promise<void>;
  // abstract batchDelete(collection: string, ids: string[]): Promise<void>;
  abstract transaction<T>(
    callback: (tx: DatabaseAdapter) => Promise<T>
  ): Promise<T>;
  abstract convertTimestamp(timestamp: Timestamp): unknown;
  abstract getCurrentTimestamp(): unknown;
  abstract collectionExists(collection: string): Promise<boolean>;
  abstract createCollection(collection: string): Promise<void>;
  abstract dropCollection(collection: string): Promise<void>;
}
