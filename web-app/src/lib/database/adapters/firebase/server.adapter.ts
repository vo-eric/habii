/**
 * Firebase Server Adapter
 * Uses Firebase Admin SDK for server-side operations
 */

import * as admin from 'firebase-admin';
import { BaseAdapter } from '../base.adapter';
import { QueryOptions, PaginatedResult, Timestamp } from '../../types';

export class FirebaseServerAdapter extends BaseAdapter {
  private db: admin.firestore.Firestore | null = null;
  private app: admin.app.App | null = null;

  constructor(private config?: admin.AppOptions) {
    super();
  }

  async connect(): Promise<void> {
    if (this.connected) return;

    try {
      // Check if an app already exists
      if (admin.apps.length > 0) {
        this.app = admin.apps[0];
      } else {
        // Initialize with provided config or default
        const appConfig = this.config || {
          credential: admin.credential.cert({
            projectId: process.env.FIREBASE_PROJECT_ID,
            clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
            privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
          }),
        };

        this.app = admin.initializeApp(appConfig);
      }

      this.db = admin.firestore();
      this.connected = true;
    } catch (error) {
      console.error('Failed to connect to Firebase:', error);
      throw new Error('Firebase connection failed');
    }
  }

  async disconnect(): Promise<void> {
    if (!this.connected || !this.app) return;

    try {
      await this.app.delete();
      this.db = null;
      this.app = null;
      this.connected = false;
    } catch (error) {
      console.error('Failed to disconnect from Firebase:', error);
    }
  }

  private ensureConnected(): void {
    if (!this.db) {
      throw new Error('Database not connected. Call connect() first.');
    }
  }

  async create<T>(collection: string, data: Omit<T, 'id'>): Promise<string> {
    this.ensureConnected();

    const docData = {
      ...data,
      createdAt: this.getCurrentTimestamp(),
      updatedAt: this.getCurrentTimestamp(),
    };

    const docRef = await this.db!.collection(collection).add(docData);
    return docRef.id;
  }

  async get<T>(collection: string, id: string): Promise<T | null> {
    this.ensureConnected();

    const doc = await this.db!.collection(collection).doc(id).get();

    if (!doc.exists) {
      return null;
    }

    const data = doc.data();
    const convertedData = this.convertFirestoreData(data) as Record<
      string,
      unknown
    >;
    return {
      id: doc.id,
      ...convertedData,
    } as T;
  }

  async update<T>(
    collection: string,
    id: string,
    data: Partial<T>
  ): Promise<void> {
    this.ensureConnected();

    const updateData = {
      ...data,
      updatedAt: this.getCurrentTimestamp(),
    };

    await this.db!.collection(collection).doc(id).update(updateData);
  }

  async delete(collection: string, id: string): Promise<void> {
    this.ensureConnected();

    await this.db!.collection(collection).doc(id).delete();
  }

  async query<T>(
    collection: string,
    filters: Record<string, unknown>,
    options?: QueryOptions
  ): Promise<T[]> {
    this.ensureConnected();

    let query: admin.firestore.Query = this.db!.collection(collection);

    // Apply filters
    Object.entries(filters).forEach(([field, value]) => {
      if (value !== undefined) {
        query = query.where(field, '==', value);
      }
    });

    // Apply ordering
    if (options?.orderBy) {
      query = query.orderBy(options.orderBy, options.orderDirection || 'asc');
    }

    // Apply limit
    if (options?.limit) {
      query = query.limit(options.limit);
    }

    // Apply offset
    if (options?.offset) {
      query = query.offset(options.offset);
    }

    const snapshot = await query.get();

    return snapshot.docs.map((doc) => {
      const convertedData = this.convertFirestoreData(doc.data()) as Record<
        string,
        unknown
      >;
      return {
        id: doc.id,
        ...convertedData,
      } as T;
    });
  }

  async queryPaginated<T>(
    collection: string,
    filters: Record<string, unknown>,
    options?: QueryOptions
  ): Promise<PaginatedResult<T>> {
    this.ensureConnected();

    // Get total count
    let countQuery: admin.firestore.Query = this.db!.collection(collection);
    Object.entries(filters).forEach(([field, value]) => {
      if (value !== undefined) {
        countQuery = countQuery.where(field, '==', value);
      }
    });
    const countSnapshot = await countQuery.count().get();
    const total = countSnapshot.data().count;

    // Get paginated results
    const items = await this.query<T>(collection, filters, options);

    const currentCount = items.length;
    const offset = options?.offset || 0;
    const hasMore = offset + currentCount < total;

    return {
      items,
      total,
      hasMore,
      nextCursor: hasMore ? String(offset + currentCount) : undefined,
    };
  }

  async getByField<T>(
    collection: string,
    field: string,
    value: unknown
  ): Promise<T[]> {
    this.ensureConnected();

    const snapshot = await this.db!.collection(collection)
      .where(field, '==', value)
      .get();

    return snapshot.docs.map((doc) => {
      const convertedData = this.convertFirestoreData(doc.data()) as Record<
        string,
        unknown
      >;
      return {
        id: doc.id,
        ...convertedData,
      } as T;
    });
  }

  async getOneByField<T>(
    collection: string,
    field: string,
    value: unknown
  ): Promise<T | null> {
    this.ensureConnected();

    const snapshot = await this.db!.collection(collection)
      .where(field, '==', value)
      .limit(1)
      .get();

    if (snapshot.empty) {
      return null;
    }

    const doc = snapshot.docs[0];
    const convertedData = this.convertFirestoreData(doc.data()) as Record<
      string,
      unknown
    >;
    return {
      id: doc.id,
      ...convertedData,
    } as T;
  }

  // Batch operations removed for single creature per user
  // async batchCreate<T>(collection: string, items: Omit<T, 'id'>[]): Promise<string[]> { ... }
  // async batchUpdate<T>(collection: string, updates: Array<{ id: string; data: Partial<T> }>): Promise<void> { ... }
  // async batchDelete(collection: string, ids: string[]): Promise<void> { ... }

  async transaction<T>(callback: (tx: BaseAdapter) => Promise<T>): Promise<T> {
    this.ensureConnected();

    return this.db!.runTransaction(async (transaction) => {
      // Create a transaction-scoped adapter
      const txAdapter = new FirebaseTransactionAdapter(this.db!, transaction);
      return callback(txAdapter);
    });
  }

  convertTimestamp(timestamp: Timestamp): admin.firestore.Timestamp {
    if (timestamp instanceof Date) {
      return admin.firestore.Timestamp.fromDate(timestamp);
    } else if (typeof timestamp === 'number') {
      return admin.firestore.Timestamp.fromMillis(timestamp);
    } else if (typeof timestamp === 'string') {
      return admin.firestore.Timestamp.fromDate(new Date(timestamp));
    }
    return admin.firestore.Timestamp.now();
  }

  getCurrentTimestamp(): admin.firestore.Timestamp {
    return admin.firestore.Timestamp.now();
  }

  async collectionExists(collection: string): Promise<boolean> {
    this.ensureConnected();

    const snapshot = await this.db!.collection(collection).limit(1).get();
    return !snapshot.empty;
  }

  async createCollection(collection: string): Promise<void> {
    // Firestore creates collections automatically when documents are added
    // This is a no-op for Firestore
  }

  async dropCollection(collection: string): Promise<void> {
    this.ensureConnected();

    // Delete all documents in the collection
    const batch = this.db!.batch();
    const snapshot = await this.db!.collection(collection).get();

    snapshot.docs.forEach((doc) => {
      batch.delete(doc.ref);
    });

    await batch.commit();
  }

  private convertFirestoreData(data: unknown): unknown {
    if (!data) return data;

    const converted: Record<string, unknown> = {};

    if (typeof data === 'object' && data !== null) {
      Object.entries(data).forEach(([key, value]) => {
        if (value instanceof admin.firestore.Timestamp) {
          converted[key] = value.toDate();
        } else if (
          value &&
          typeof value === 'object' &&
          '_seconds' in value &&
          typeof (value as { _seconds: number })._seconds === 'number'
        ) {
          // Handle serialized timestamps
          converted[key] = new Date(
            (value as { _seconds: number })._seconds * 1000
          );
        } else {
          converted[key] = value;
        }
      });
    }

    return converted;
  }
}

/**
 * Transaction-scoped adapter for Firestore transactions
 */
class FirebaseTransactionAdapter extends BaseAdapter {
  constructor(
    private db: admin.firestore.Firestore,
    private firestoreTransaction: admin.firestore.Transaction
  ) {
    super();
    this.connected = true;
  }

  async connect(): Promise<void> {
    // Already connected via transaction
  }

  async disconnect(): Promise<void> {
    // Handled by parent transaction
  }

  async create<T>(collection: string, data: Omit<T, 'id'>): Promise<string> {
    const docRef = this.db.collection(collection).doc();
    const docData = {
      ...data,
      createdAt: admin.firestore.Timestamp.now(),
      updatedAt: admin.firestore.Timestamp.now(),
    };
    this.firestoreTransaction.set(docRef, docData);
    return docRef.id;
  }

  async get<T>(collection: string, id: string): Promise<T | null> {
    const docRef = this.db.collection(collection).doc(id);
    const doc = await this.firestoreTransaction.get(docRef);

    if (!doc.exists) {
      return null;
    }

    return {
      id: doc.id,
      ...doc.data(),
    } as T;
  }

  async update<T>(
    collection: string,
    id: string,
    data: Partial<T>
  ): Promise<void> {
    const docRef = this.db.collection(collection).doc(id);
    const updateData = {
      ...data,
      updatedAt: admin.firestore.Timestamp.now(),
    };
    this.firestoreTransaction.update(docRef, updateData);
  }

  async delete(collection: string, id: string): Promise<void> {
    const docRef = this.db.collection(collection).doc(id);
    this.firestoreTransaction.delete(docRef);
  }

  // Other methods throw errors as they're not supported in transactions
  async query<T>(): Promise<T[]> {
    throw new Error('Query not supported in transactions');
  }

  async queryPaginated<T>(): Promise<PaginatedResult<T>> {
    throw new Error('Paginated query not supported in transactions');
  }

  async getByField<T>(): Promise<T[]> {
    throw new Error('getByField not supported in transactions');
  }

  async getOneByField<T>(): Promise<T | null> {
    throw new Error('getOneByField not supported in transactions');
  }

  // Batch operations removed for single creature per user
  // async batchCreate<T>(): Promise<string[]> { throw new Error('Batch operations not supported in transactions'); }
  // async batchUpdate<T>(): Promise<void> { throw new Error('Batch operations not supported in transactions'); }
  // async batchDelete(): Promise<void> { throw new Error('Batch operations not supported in transactions'); }

  async transaction<T>(): Promise<T> {
    throw new Error('Nested transactions not supported');
  }

  convertTimestamp(timestamp: Timestamp): admin.firestore.Timestamp {
    return admin.firestore.Timestamp.now();
  }

  getCurrentTimestamp(): admin.firestore.Timestamp {
    return admin.firestore.Timestamp.now();
  }

  async collectionExists(): Promise<boolean> {
    throw new Error('Collection operations not supported in transactions');
  }

  async createCollection(): Promise<void> {
    throw new Error('Collection operations not supported in transactions');
  }

  async dropCollection(): Promise<void> {
    throw new Error('Collection operations not supported in transactions');
  }
}
