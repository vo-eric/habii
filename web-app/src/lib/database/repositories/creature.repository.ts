import { DatabaseAdapter } from '../adapters/base.adapter';
import {
  Creature,
  CreateCreatureDTO,
  UpdateCreatureDTO,
  CreatureFilters,
} from '../types';

export class CreatureRepository {
  private readonly COLLECTION_NAME = 'creatures';

  constructor(private adapter: DatabaseAdapter) {}

  async create(data: CreateCreatureDTO): Promise<Creature> {
    // Users can only have one creature for now
    const existingCreature = await this.getByOwnerId(data.ownerId);
    if (existingCreature) {
      throw new Error(
        'User already has a creature. Each user can only have one creature.'
      );
    }

    const creatureData = {
      name: data.name,
      ownerId: data.ownerId,
      type: data.type || 'default',
      hunger: data.hunger ?? 100,
      love: data.love ?? 100,
      tiredness: data.tiredness ?? 0,
    };

    const id = await this.adapter.create(this.COLLECTION_NAME, creatureData);

    return this.getById(id) as Promise<Creature>;
  }

  async getById(id: string): Promise<Creature | null> {
    return this.adapter.get<Creature>(this.COLLECTION_NAME, id);
  }

  async getByOwnerId(ownerId: string): Promise<Creature | null> {
    return this.adapter.getOneByField<Creature>(
      this.COLLECTION_NAME,
      'ownerId',
      ownerId
    );
  }
  async update(id: string, data: UpdateCreatureDTO): Promise<Creature | null> {
    const creature = await this.getById(id);
    if (!creature) {
      throw new Error('Creature not found');
    }

    const updateData: UpdateCreatureDTO = {
      ...(data.name !== undefined && { name: data.name }),
      ...(data.hunger !== undefined && {
        hunger: Math.max(0, Math.min(100, data.hunger)),
      }),
      ...(data.love !== undefined && {
        love: Math.max(0, Math.min(100, data.love)),
      }),
      ...(data.tiredness !== undefined && {
        tiredness: Math.max(0, Math.min(100, data.tiredness)),
      }),
    };

    await this.adapter.update(this.COLLECTION_NAME, id, updateData);

    return this.getById(id);
  }

  async feed(id: string, amount: number = 20): Promise<Creature | null> {
    const creature = await this.getById(id);
    if (!creature) {
      throw new Error('Creature not found');
    }

    const newHunger = creature.hunger + amount;

    return this.update(id, {
      hunger: Math.min(100, creature.hunger + amount),
      tiredness: newHunger > 100 ? creature.tiredness + 5 : creature.tiredness,
    });
  }

  async play(id: string): Promise<Creature | null> {
    const creature = await this.getById(id);
    if (!creature) {
      throw new Error('Creature not found');
    }

    const newLove = Math.min(100, creature.love + 15);
    const newTiredness = Math.min(100, creature.tiredness + 10);

    return this.update(id, {
      love: newLove,
      tiredness: newTiredness,
    });
  }

  async rest(id: string, duration: number = 30): Promise<Creature | null> {
    const creature = await this.getById(id);
    if (!creature) {
      throw new Error('Creature not found');
    }

    const newTiredness = Math.max(0, creature.tiredness - duration);
    return this.update(id, { tiredness: newTiredness });
  }

  async delete(id: string): Promise<void> {
    const creature = await this.getById(id);
    if (!creature) {
      throw new Error('Creature not found');
    }

    await this.adapter.delete(this.COLLECTION_NAME, id);
  }

  async deleteByOwnerId(ownerId: string): Promise<void> {
    const creature = await this.getByOwnerId(ownerId);
    if (creature) {
      await this.adapter.delete(this.COLLECTION_NAME, creature.id);
    }
  }

  /**
   * List creatures with filters
   */
  async list(filters?: CreatureFilters): Promise<Creature[]> {
    const queryFilters: Record<string, unknown> = {};

    if (filters?.ownerId) {
      queryFilters.ownerId = filters.ownerId;
    }

    if (filters?.type) {
      queryFilters.type = filters.type;
    }

    const options = {
      limit: filters?.limit,
      offset: filters?.offset,
      orderBy: 'createdAt',
      orderDirection: 'desc' as const,
    };

    return this.adapter.query<Creature>(
      this.COLLECTION_NAME,
      queryFilters,
      options
    );
  }

  async applyTimeDegradation(
    id: string,
    hoursElapsed: number
  ): Promise<Creature | null> {
    const creature = await this.getById(id);
    if (!creature) {
      throw new Error('Creature not found');
    }

    const hungerDecrease = Math.floor(hoursElapsed * 5); // Lose 5 hunger per hour
    const loveDecrease = Math.floor(hoursElapsed * 2); // Lose 2 love per hour
    const tirednessIncrease = Math.floor(hoursElapsed * 8); // Gain 8 tiredness per hour

    const newStats = {
      hunger: Math.max(0, creature.hunger - hungerDecrease),
      love: Math.max(0, creature.love - loveDecrease),
      tiredness: Math.min(100, creature.tiredness + tirednessIncrease),
    };

    return this.update(id, newStats);
  }

  async needsAttention(id: string): Promise<{
    needsAttention: boolean;
    reasons: string[];
  }> {
    const creature = await this.getById(id);
    if (!creature) {
      throw new Error('Creature not found');
    }

    const reasons: string[] = [];

    if (creature.hunger < 30) {
      reasons.push('hungry');
    }

    if (creature.love < 30) {
      reasons.push('lonely');
    }

    if (creature.tiredness > 70) {
      reasons.push('tired');
    }

    return {
      needsAttention: reasons.length > 0,
      reasons,
    };
  }

  /**
   * Note: This method is kept for future use but currently limited to single creature per user
   */
  async batchCreate(creatures: CreateCreatureDTO[]): Promise<Creature[]> {
    const ownerIds = creatures.map((c) => c.ownerId);
    const uniqueOwnerIds = new Set(ownerIds);

    if (ownerIds.length !== uniqueOwnerIds.size) {
      throw new Error('Cannot create multiple creatures for the same owner');
    }

    for (const ownerId of uniqueOwnerIds) {
      const existing = await this.getByOwnerId(ownerId);
      if (existing) {
        throw new Error(`Owner ${ownerId} already has a creature`);
      }
    }

    const createdCreatures: Creature[] = [];
    for (const creatureData of creatures) {
      const creature = await this.create(creatureData);
      createdCreatures.push(creature);
    }

    return createdCreatures;
  }
}
