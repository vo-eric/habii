/**
 * Database operation types and interfaces
 */

export interface QueryOptions {
  limit?: number;
  offset?: number;
  orderBy?: string;
  orderDirection?: 'asc' | 'desc';
}

export interface DatabaseResult<T> {
  data: T;
  metadata?: {
    totalCount?: number;
    hasMore?: boolean;
  };
}

export interface PaginatedResult<T> {
  items: T[];
  total: number;
  hasMore: boolean;
  nextCursor?: string;
}

export type Timestamp = Date | number | string;

export interface DatabaseConfig {
  type: 'firebase' | 'postgres' | 'mongodb' | 'memory';
  environment: 'client' | 'server';
  connectionString?: string;
  options?: Record<string, unknown>;
}
