# Database Abstraction Layer

This database abstraction layer provides a flexible, type-safe way to interact with different databases without changing your application code. Currently supports Firebase/Firestore with easy extensibility for other databases.

## Architecture

```
Application Layer (Components/API Routes)
    ↓
Repository Layer (Business Logic)
    ↓
Adapter Interface (Contract)
    ↓
Database Adapters (Firebase, PostgreSQL, MongoDB, etc.)
```

## Quick Start

### Server-side Usage (API Routes)

```typescript
import { DatabaseFactory } from '@/lib/database';

// In your API route
export async function POST(request: Request) {
  // Get repository instance
  const creatureRepo = await DatabaseFactory.getCreatureRepository('server');

  // Create a creature
  const creature = await creatureRepo.create({
    name: 'Fluffy',
    ownerId: 'user123',
  });

  // Update creature stats
  await creatureRepo.feed(creature.id, 20);
  await creatureRepo.play(creature.id);

  // Get creature by owner
  const userCreature = await creatureRepo.getByOwnerId('user123');
}
```

### Client-side Usage (React Components)

```typescript
'use client';

import { useState, useEffect } from 'react';
import { DatabaseFactory, Creature } from '@/lib/database';

export function CreatureComponent({ userId }: { userId: string }) {
  const [creature, setCreature] = useState<Creature | null>(null);

  useEffect(() => {
    async function loadCreature() {
      const repo = await DatabaseFactory.getCreatureRepository('client');
      const userCreature = await repo.getByOwnerId(userId);
      setCreature(userCreature);
    }
    loadCreature();
  }, [userId]);

  // ... rest of component
}
```

## Core Components

### 1. Types (`/types`)

Defines all TypeScript interfaces and types:

- `Creature`: Main creature entity
- `CreateCreatureDTO`: Data for creating creatures
- `UpdateCreatureDTO`: Data for updating creatures
- `CreatureFilters`: Query filters

### 2. Adapters (`/adapters`)

Database-specific implementations:

- `FirebaseServerAdapter`: Server-side Firebase operations
- `FirebaseClientAdapter`: Client-side Firebase operations
- `BaseAdapter`: Abstract base class for all adapters

### 3. Repository (`/repositories`)

Business logic layer:

- `CreatureRepository`: All creature-related operations with validation

### 4. Factory (`/factory.ts`)

Creates appropriate adapters based on environment:

- Handles connection management
- Provides singleton instances
- Environment detection

## Available Operations

### Creature Repository Methods

```typescript
// CRUD Operations
create(data: CreateCreatureDTO): Promise<Creature>
getById(id: string): Promise<Creature | null>
getByOwnerId(ownerId: string): Promise<Creature | null>
update(id: string, data: UpdateCreatureDTO): Promise<Creature | null>
delete(id: string): Promise<void>

// Creature Actions
feed(id: string, amount?: number): Promise<Creature | null>
play(id: string): Promise<Creature | null>
rest(id: string, duration?: number): Promise<Creature | null>

// Utility Methods
needsAttention(id: string): Promise<{ needsAttention: boolean; reasons: string[] }>
applyTimeDegradation(id: string, hoursElapsed: number): Promise<Creature | null>

// User Operations
deleteByOwnerId(ownerId: string): Promise<void>
getAllByOwnerId(ownerId: string): Promise<Creature[]> // Returns array with single creature
```

## Swapping Databases

To switch from Firebase to another database:

### 1. Create a New Adapter

```typescript
// src/lib/database/adapters/postgres/postgres.adapter.ts
import { BaseAdapter } from '../base.adapter';
import { Pool } from 'pg';

export class PostgresAdapter extends BaseAdapter {
  private pool: Pool | null = null;

  async connect(): Promise<void> {
    this.pool = new Pool({
      connectionString: process.env.DATABASE_URL,
    });
    this.connected = true;
  }

  async create<T>(collection: string, data: Omit<T, 'id'>): Promise<string> {
    // PostgreSQL implementation
    const result = await this.pool!.query(
      `INSERT INTO ${collection} (data) VALUES ($1) RETURNING id`,
      [JSON.stringify(data)]
    );
    return result.rows[0].id;
  }

  // ... implement other required methods
}
```

### 2. Update the Factory

```typescript
// src/lib/database/factory.ts
import { PostgresAdapter } from './adapters/postgres';

// In getAdapter method
switch (dbType) {
  case 'firebase':
    // ... existing code
    break;

  case 'postgres':
    adapter = new PostgresAdapter(this.config?.options);
    break;

  // ... other cases
}
```

### 3. Update Environment Variables

```env
# Change from Firebase to PostgreSQL
NEXT_PUBLIC_DATABASE_TYPE=postgres
DATABASE_URL=postgresql://user:password@localhost:5432/habii
```

That's it! No changes needed in your application code.

## Environment Variables

### Firebase Configuration

```env
# Server-side (Firebase Admin)
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_CLIENT_EMAIL=your-client-email
FIREBASE_PRIVATE_KEY=your-private-key

# Client-side (Firebase SDK)
NEXT_PUBLIC_FIREBASE_API_KEY=your-api-key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-auth-domain
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-storage-bucket
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
NEXT_PUBLIC_FIREBASE_APP_ID=your-app-id

# Database Type
NEXT_PUBLIC_DATABASE_TYPE=firebase  # or 'postgres', 'mongodb', etc.
```

## Testing

The abstraction layer makes testing easy:

```typescript
// Create a mock adapter for testing
class MockAdapter extends BaseAdapter {
  private data = new Map();

  async connect() {
    this.connected = true;
  }
  async create(collection, data) {
    const id = Math.random().toString();
    this.data.set(`${collection}:${id}`, { id, ...data });
    return id;
  }
  // ... implement other methods
}

// In tests
const mockAdapter = new MockAdapter();
const repo = new CreatureRepository(mockAdapter);
```

## Best Practices

1. **Always use the repository layer** - Don't access adapters directly
2. **Handle errors gracefully** - Repository methods throw descriptive errors
3. **Use appropriate environment** - 'server' for API routes, 'client' for components
4. **One creature per user** - Currently enforced, single creature per user
5. **Validate stats** - Repository automatically clamps values (0-100)

## Future Enhancements

- [ ] Support for multiple creatures per user (batch operations will be re-enabled)
- [ ] PostgreSQL adapter
- [ ] MongoDB adapter
- [ ] Redis caching layer
- [ ] Real-time subscriptions
- [ ] Migration utilities
- [ ] Database seeding tools

## API Routes

The following API routes are available:

- `POST /api/create-creature` - Create a new creature
- `GET /api/creatures/[id]` - Get creature by ID
- `PATCH /api/creatures/[id]` - Update creature
- `DELETE /api/creatures/[id]` - Delete creature
- `POST /api/creatures/[id]/actions` - Perform actions (feed, play, rest)
- `GET /api/users/[userId]/creatures` - Get user's creature (single creature per user)
- `DELETE /api/users/[userId]/creatures` - Delete user's creature

## Example: Complete Flow

```typescript
// 1. Create a creature
const response = await fetch('/api/create-creature', {
  method: 'POST',
  body: JSON.stringify({
    name: 'Buddy',
    ownerId: 'user123',
  }),
});

// 2. Feed the creature
await fetch(`/api/creatures/${creatureId}/actions`, {
  method: 'POST',
  body: JSON.stringify({
    action: 'feed',
    amount: 30,
  }),
});

// 3. Check if needs attention
const status = await fetch(`/api/creatures/${creatureId}/actions`, {
  method: 'POST',
  body: JSON.stringify({
    action: 'check_attention',
  }),
});
```
