/**
 * Core Creature entity types
 */

export interface Creature {
  id: string;
  name: string;
  ownerId: string;
  createdAt: Date;
  updatedAt?: Date;
  hunger: number;
  love: number;
  tiredness: number;
}

export interface CreateCreatureDTO {
  name: string;
  ownerId: string;
  type?: string;
  hunger?: number;
  love?: number;
  tiredness?: number;
}

export interface UpdateCreatureDTO {
  name?: string;
  hunger?: number;
  love?: number;
  tiredness?: number;
}

export interface CreatureFilters {
  ownerId?: string;
  type?: string;
  limit?: number;
  offset?: number;
}
