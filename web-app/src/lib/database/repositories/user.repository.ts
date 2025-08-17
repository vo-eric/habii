import { DatabaseAdapter } from '../adapters/base.adapter';
import { User, CreateUserInput, UpdateUserInput } from '../types';

export class UserRepository {
  private readonly COLLECTION_NAME = 'users';

  constructor(private adapter: DatabaseAdapter) {}

  async create(data: CreateUserInput): Promise<User> {
    // Check if user already exists
    const existingUser = await this.getById(data.uid);
    if (existingUser) {
      throw new Error('User already exists');
    }

    const userData = {
      uid: data.uid,
      email: data.email,
      displayName: data.displayName,
      photoURL: data.photoURL || null,
      provider: data.provider,
      isActive: true,
      preferences: {
        theme: 'light' as const,
        emailNotifications: true,
        pushNotifications: true,
        language: 'en',
      },
    };

    // For users, we need to create with a specific ID (uid)
    // This requires a custom implementation since the base adapter doesn't support it
    await this.createWithId(data.uid, userData);

    return this.getById(data.uid) as Promise<User>;
  }

  private async createWithId(
    id: string,
    data: Record<string, unknown>
  ): Promise<void> {
    // This is a custom method for creating documents with specific IDs
    // We'll need to implement this differently for each adapter
    if ('createWithId' in this.adapter) {
      await (
        this.adapter as {
          createWithId: (
            collection: string,
            id: string,
            data: Record<string, unknown>
          ) => Promise<void>;
        }
      ).createWithId(this.COLLECTION_NAME, id, data);
    } else {
      // Fallback: create without ID and then update
      const tempId = await this.adapter.create(
        this.COLLECTION_NAME,
        data as Omit<User, 'id'>
      );
      // Note: This is not ideal but works as a fallback
      console.warn('User creation without specific ID - using fallback method');
    }
  }

  async getById(uid: string): Promise<User | null> {
    return this.adapter.get<User>(this.COLLECTION_NAME, uid);
  }

  async getByEmail(email: string): Promise<User | null> {
    return this.adapter.getOneByField<User>(
      this.COLLECTION_NAME,
      'email',
      email
    );
  }

  async update(uid: string, data: UpdateUserInput): Promise<User | null> {
    const user = await this.getById(uid);
    if (!user) {
      throw new Error('User not found');
    }

    const updateData: Partial<User> = {};

    if (data.displayName !== undefined) {
      updateData.displayName = data.displayName;
    }

    if (data.photoURL !== undefined) {
      updateData.photoURL = data.photoURL;
    }

    if (data.isActive !== undefined) {
      updateData.isActive = data.isActive;
    }

    if (data.preferences) {
      updateData.preferences = {
        ...user.preferences,
        ...data.preferences,
      };
    }

    await this.adapter.update(this.COLLECTION_NAME, uid, updateData);
    return this.getById(uid);
  }

  async updateLastLogin(uid: string): Promise<User | null> {
    const user = await this.getById(uid);
    if (!user) {
      throw new Error('User not found');
    }

    await this.adapter.update(this.COLLECTION_NAME, uid, {
      lastLoginAt: this.adapter.getCurrentTimestamp(),
    });

    return this.getById(uid);
  }

  async deactivate(uid: string): Promise<User | null> {
    return this.update(uid, { isActive: false });
  }

  async reactivate(uid: string): Promise<User | null> {
    return this.update(uid, { isActive: true });
  }

  async delete(uid: string): Promise<void> {
    const user = await this.getById(uid);
    if (!user) {
      throw new Error('User not found');
    }

    await this.adapter.delete(this.COLLECTION_NAME, uid);
  }

  /**
   * Create or update user profile (upsert operation)
   * Useful for OAuth flows where we might not know if user exists
   */
  async createOrUpdate(data: CreateUserInput): Promise<User> {
    const existingUser = await this.getById(data.uid);

    if (existingUser) {
      // Update last login and any changed fields
      const updateData: UpdateUserInput = {};

      if (data.displayName !== existingUser.displayName) {
        updateData.displayName = data.displayName;
      }

      if (data.photoURL !== existingUser.photoURL) {
        updateData.photoURL = data.photoURL;
      }

      await this.adapter.update(this.COLLECTION_NAME, data.uid, {
        ...updateData,
        lastLoginAt: this.adapter.getCurrentTimestamp(),
      });

      return this.getById(data.uid) as Promise<User>;
    } else {
      return this.create(data);
    }
  }
}
