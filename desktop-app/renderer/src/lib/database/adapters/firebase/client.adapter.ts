/**
 * Firebase Client Adapter
 * Uses Firebase Client SDK for client-side operations
 */

import { initializeApp, FirebaseApp } from 'firebase/app';
import {
  getFirestore,
  Firestore,
  collection,
  doc,
  addDoc,
  getDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  getDocs,
  writeBatch,
  runTransaction,
  Timestamp as FirestoreTimestamp,
  serverTimestamp,
  getCountFromServer,
  onSnapshot,
  DocumentData,
  QueryConstraint,
  Transaction,
  Unsubscribe,
} from 'firebase/firestore';
import { BaseAdapter } from '../base.adapter';
import { QueryOptions, PaginatedResult, Timestamp } from '../../types';

export class FirebaseClientAdapter extends BaseAdapter {
  private db: Firestore | null = null;
  private app: FirebaseApp | null = null;

  constructor(
    private config?: {
      apiKey?: string;
      authDomain?: string;
      projectId?: string;
      storageBucket?: string;
      messagingSenderId?: string;
      appId?: string;
    }
  ) {
    super();
  }

  async connect(): Promise<void> {
    if (this.connected) return;

    try {
      const firebaseConfig = this.config || {
        apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
        authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
        projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
        storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
        messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
        appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
      };

      this.app = initializeApp(firebaseConfig);
      this.db = getFirestore(this.app);
      this.connected = true;
    } catch (error) {
      console.error('Failed to connect to Firebase:', error);
      throw new Error('Firebase connection failed');
    }
  }

  async disconnect(): Promise<void> {
    if (!this.connected) return;

    // Client SDK doesn't require explicit disconnect
    this.db = null;
    this.app = null;
    this.connected = false;
  }

  private ensureConnected(): void {
    if (!this.db) {
      throw new Error('Database not connected. Call connect() first.');
    }
  }

  async create<T>(
    collectionName: string,
    data: Omit<T, 'id'>
  ): Promise<string> {
    this.ensureConnected();

    const docData = {
      ...data,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    const docRef = await addDoc(collection(this.db!, collectionName), docData);
    return docRef.id;
  }

  async get<T>(collectionName: string, id: string): Promise<T | null> {
    this.ensureConnected();

    const docRef = doc(this.db!, collectionName, id);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      return null;
    }

    const data = docSnap.data();
    const convertedData = this.convertFirestoreData(data) as Record<
      string,
      unknown
    >;
    return {
      id: docSnap.id,
      ...convertedData,
    } as T;
  }

  async update<T>(
    collectionName: string,
    id: string,
    data: Partial<T>
  ): Promise<void> {
    this.ensureConnected();

    const docRef = doc(this.db!, collectionName, id);
    const updateData = {
      ...data,
      updatedAt: serverTimestamp(),
    };

    await updateDoc(docRef, updateData);
  }

  async delete(collectionName: string, id: string): Promise<void> {
    this.ensureConnected();

    const docRef = doc(this.db!, collectionName, id);
    await deleteDoc(docRef);
  }

  async query<T>(
    collectionName: string,
    filters: Record<string, unknown>,
    options?: QueryOptions
  ): Promise<T[]> {
    this.ensureConnected();

    const constraints: QueryConstraint[] = [];

    // Apply filters
    Object.entries(filters).forEach(([field, value]) => {
      if (value !== undefined) {
        constraints.push(where(field, '==', value));
      }
    });

    // Apply ordering
    if (options?.orderBy) {
      constraints.push(
        orderBy(options.orderBy, options.orderDirection || 'asc')
      );
    }

    // Apply limit
    if (options?.limit) {
      constraints.push(limit(options.limit));
    }

    // Note: Firestore client SDK doesn't support offset directly
    // You would need to use cursor-based pagination for better performance

    const q = query(collection(this.db!, collectionName), ...constraints);
    const querySnapshot = await getDocs(q);

    const results: T[] = [];
    querySnapshot.forEach((doc) => {
      const convertedData = this.convertFirestoreData(doc.data()) as Record<
        string,
        unknown
      >;
      results.push({
        id: doc.id,
        ...convertedData,
      } as T);
    });

    // Apply offset manually (not efficient for large offsets)
    if (options?.offset) {
      return results.slice(options.offset);
    }

    return results;
  }

  async queryPaginated<T>(
    collectionName: string,
    filters: Record<string, unknown>,
    options?: QueryOptions
  ): Promise<PaginatedResult<T>> {
    this.ensureConnected();

    // Build base query
    const constraints: QueryConstraint[] = [];
    Object.entries(filters).forEach(([field, value]) => {
      if (value !== undefined) {
        constraints.push(where(field, '==', value));
      }
    });

    // Get total count
    const countQuery = query(
      collection(this.db!, collectionName),
      ...constraints
    );
    const countSnapshot = await getCountFromServer(countQuery);
    const total = countSnapshot.data().count;

    // Get paginated results
    const items = await this.query<T>(collectionName, filters, options);

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
    collectionName: string,
    field: string,
    value: unknown
  ): Promise<T[]> {
    this.ensureConnected();

    const q = query(
      collection(this.db!, collectionName),
      where(field, '==', value)
    );

    const querySnapshot = await getDocs(q);

    const results: T[] = [];
    querySnapshot.forEach((doc) => {
      const convertedData = this.convertFirestoreData(doc.data()) as Record<
        string,
        unknown
      >;
      results.push({
        id: doc.id,
        ...convertedData,
      } as T);
    });

    return results;
  }

  async getOneByField<T>(
    collectionName: string,
    field: string,
    value: unknown
  ): Promise<T | null> {
    this.ensureConnected();

    const q = query(
      collection(this.db!, collectionName),
      where(field, '==', value),
      limit(1)
    );

    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      return null;
    }

    const doc = querySnapshot.docs[0];
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
  // async batchCreate<T>(collectionName: string, items: Omit<T, 'id'>[]): Promise<string[]> { ... }
  // async batchUpdate<T>(collectionName: string, updates: Array<{ id: string; data: Partial<T> }>): Promise<void> { ... }
  // async batchDelete(collectionName: string, ids: string[]): Promise<void> { ... }

  async transaction<T>(callback: (tx: BaseAdapter) => Promise<T>): Promise<T> {
    this.ensureConnected();

    return runTransaction(this.db!, async (transaction) => {
      // Create a transaction-scoped adapter
      const txAdapter = new FirebaseClientTransactionAdapter(
        this.db!,
        transaction
      );
      return callback(txAdapter);
    });
  }

  convertTimestamp(timestamp: Timestamp): FirestoreTimestamp {
    if (timestamp instanceof Date) {
      return FirestoreTimestamp.fromDate(timestamp);
    } else if (typeof timestamp === 'number') {
      return FirestoreTimestamp.fromMillis(timestamp);
    } else if (typeof timestamp === 'string') {
      return FirestoreTimestamp.fromDate(new Date(timestamp));
    }
    return FirestoreTimestamp.now();
  }

  getCurrentTimestamp(): unknown {
    return serverTimestamp();
  }

  async collectionExists(collectionName: string): Promise<boolean> {
    this.ensureConnected();

    const q = query(collection(this.db!, collectionName), limit(1));
    const snapshot = await getDocs(q);
    return !snapshot.empty;
  }

  async createCollection(_collectionName: string): Promise<void> {
    // Firestore creates collections automatically when documents are added
    // This is a no-op for Firestore
  }

  async dropCollection(collectionName: string): Promise<void> {
    this.ensureConnected();

    // Delete all documents in the collection
    const batch = writeBatch(this.db!);
    const q = query(collection(this.db!, collectionName));
    const snapshot = await getDocs(q);

    snapshot.docs.forEach((doc) => {
      batch.delete(doc.ref);
    });

    await batch.commit();
  }

  private convertFirestoreData(data: DocumentData): unknown {
    if (!data) return data;

    const converted: Record<string, unknown> = {};

    Object.entries(data).forEach(([key, value]) => {
      if (value instanceof FirestoreTimestamp) {
        converted[key] = value.toDate();
      } else if (
        value &&
        typeof value === 'object' &&
        'seconds' in value &&
        'nanoseconds' in value
      ) {
        // Handle serialized timestamps
        converted[key] = new FirestoreTimestamp(
          (value as { seconds: number; nanoseconds: number }).seconds,
          (value as { seconds: number; nanoseconds: number }).nanoseconds
        ).toDate();
      } else {
        converted[key] = value;
      }
    });

    return converted;
  }

  /**
   * Listen to real-time changes for a document
   * @param collectionName - Name of the collection
   * @param id - Document ID
   * @param callback - Function called when document changes
   * @returns Unsubscribe function
   */
  listenToDocument<T>(
    collectionName: string,
    id: string,
    callback: (data: T | null) => void,
    onError?: (error: Error) => void
  ): Unsubscribe {
    this.ensureConnected();

    const docRef = doc(this.db!, collectionName, id);

    return onSnapshot(
      docRef,
      (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data() as DocumentData;
          const convertedData = this.convertFirestoreData(data) as Record<
            string,
            unknown
          >;
          callback({
            id: docSnap.id,
            ...convertedData,
          } as T);
        } else {
          callback(null);
        }
      },
      (error) => {
        console.error('Error listening to document:', error);
        if (onError) {
          onError(new Error(`Failed to listen to document: ${error.message}`));
        }
      }
    );
  }

  /**
   * Listen to real-time changes for a collection query
   * @param collectionName - Name of the collection
   * @param constraintSpecs - Query constraint specifications
   * @param callback - Function called when query results change
   * @returns Unsubscribe function
   */
  listenToCollection<T>(
    collectionName: string,
    constraintSpecs: Array<{ field: string; operator: string; value: unknown }>,
    callback: (data: T[]) => void,
    onError?: (error: Error) => void
  ): Unsubscribe {
    this.ensureConnected();

    // Convert constraint specs to Firestore QueryConstraints
    const constraints: QueryConstraint[] = constraintSpecs.map((spec) => {
      return where(
        spec.field,
        spec.operator as
          | '=='
          | '!='
          | '<'
          | '<='
          | '>'
          | '>='
          | 'array-contains'
          | 'array-contains-any'
          | 'in'
          | 'not-in',
        spec.value
      );
    });

    const q = query(collection(this.db!, collectionName), ...constraints);

    return onSnapshot(
      q,
      (querySnap) => {
        const results: T[] = [];
        querySnap.forEach((doc) => {
          const data = doc.data() as DocumentData;
          const convertedData = this.convertFirestoreData(data) as Record<
            string,
            unknown
          >;
          results.push({
            id: doc.id,
            ...convertedData,
          } as T);
        });
        callback(results);
      },
      (error) => {
        console.error('Error listening to collection:', error);
        if (onError) {
          onError(
            new Error(`Failed to listen to collection: ${error.message}`)
          );
        }
      }
    );
  }
}

/**
 * Transaction-scoped adapter for Firestore client transactions
 */
class FirebaseClientTransactionAdapter extends BaseAdapter {
  constructor(
    private db: Firestore,
    private firestoreTransaction: Transaction
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

  async create<T>(
    collectionName: string,
    data: Omit<T, 'id'>
  ): Promise<string> {
    const docRef = doc(collection(this.db, collectionName));
    const docData = {
      ...data,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };
    this.firestoreTransaction.set(docRef, docData);
    return docRef.id;
  }

  async get<T>(collectionName: string, id: string): Promise<T | null> {
    const docRef = doc(this.db, collectionName, id);
    const docSnap = await this.firestoreTransaction.get(docRef);

    if (!docSnap.exists()) {
      return null;
    }

    return {
      id: docSnap.id,
      ...docSnap.data(),
    } as T;
  }

  async update<T>(
    collectionName: string,
    id: string,
    data: Partial<T>
  ): Promise<void> {
    const docRef = doc(this.db, collectionName, id);
    const updateData = {
      ...data,
      updatedAt: serverTimestamp(),
    };
    this.firestoreTransaction.update(docRef, updateData);
  }

  async delete(collectionName: string, id: string): Promise<void> {
    const docRef = doc(this.db, collectionName, id);
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

  convertTimestamp(): FirestoreTimestamp {
    return FirestoreTimestamp.now();
  }

  getCurrentTimestamp(): unknown {
    return serverTimestamp();
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
