'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  ClientDatabaseFactory,
  Creature,
  UpdateCreatureDTO,
} from '@/lib/database/client';
import { useAuth } from '@/components/providers/AuthProvider';

export interface UseCreatureOptions {
  autoRefresh?: boolean;
  refreshInterval?: number; // milliseconds
}

export function useCreature(options?: UseCreatureOptions) {
  const { user } = useAuth();
  const [creature, setCreature] = useState<Creature | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadCreature = useCallback(async () => {
    if (!user?.uid) {
      setCreature(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const repo = await ClientDatabaseFactory.getCreatureRepository();
      const userCreature = await repo.getByOwnerId(user.uid);

      setCreature(userCreature);
    } catch (err) {
      console.error('Error loading creature:', err);
      setError(err instanceof Error ? err.message : 'Failed to load creature');
    } finally {
      setLoading(false);
    }
  }, [user?.uid]);

  // Create a new creature
  const createCreature = useCallback(
    async (name: string, type?: string) => {
      if (!user?.uid) {
        throw new Error('User not authenticated');
      }

      try {
        setLoading(true);
        setError(null);

        const repo = await ClientDatabaseFactory.getCreatureRepository();
        const newCreature = await repo.create({
          name,
          ownerId: user.uid,
          type,
        });

        setCreature(newCreature);
        return newCreature;
      } catch (err) {
        console.error('Error creating creature:', err);
        setError(
          err instanceof Error ? err.message : 'Failed to create creature'
        );
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [user?.uid]
  );

  // Update creature
  const updateCreature = useCallback(
    async (updates: UpdateCreatureDTO) => {
      if (!creature) {
        setError('No creature to update');
        return null;
      }

      try {
        setLoading(true);
        setError(null);

        const repo = await ClientDatabaseFactory.getCreatureRepository();
        const updatedCreature = await repo.update(creature.id, updates);

        if (updatedCreature) {
          setCreature(updatedCreature);
        }
        return updatedCreature;
      } catch (err) {
        console.error('Error updating creature:', err);
        setError(
          err instanceof Error ? err.message : 'Failed to update creature'
        );
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [creature]
  );

  // Creature actions
  const feedCreature = useCallback(
    async (amount?: number) => {
      if (!creature) {
        setError('No creature to feed');
        return null;
      }

      try {
        setError(null);

        const repo = await ClientDatabaseFactory.getCreatureRepository();
        const updatedCreature = await repo.feed(creature.id, amount);

        if (updatedCreature) {
          setCreature(updatedCreature);
        }
        return updatedCreature;
      } catch (err) {
        console.error('Error feeding creature:', err);
        setError(
          err instanceof Error ? err.message : 'Failed to feed creature'
        );
        throw err;
      }
    },
    [creature]
  );

  const playWithCreature = useCallback(async () => {
    if (!creature) {
      setError('No creature to play with');
      return null;
    }

    try {
      setError(null);

      const repo = await ClientDatabaseFactory.getCreatureRepository();
      const updatedCreature = await repo.play(creature.id);

      if (updatedCreature) {
        setCreature(updatedCreature);
      }
      return updatedCreature;
    } catch (err) {
      console.error('Error playing with creature:', err);
      setError(
        err instanceof Error ? err.message : 'Failed to play with creature'
      );
      throw err;
    }
  }, [creature]);

  const restCreature = useCallback(
    async (duration?: number) => {
      if (!creature) {
        setError('No creature to rest');
        return null;
      }

      try {
        setError(null);

        const repo = await ClientDatabaseFactory.getCreatureRepository();
        const updatedCreature = await repo.rest(creature.id, duration);

        if (updatedCreature) {
          setCreature(updatedCreature);
        }
        return updatedCreature;
      } catch (err) {
        console.error('Error resting creature:', err);
        setError(
          err instanceof Error ? err.message : 'Failed to rest creature'
        );
        throw err;
      }
    },
    [creature]
  );

  // Check if creature needs attention
  const checkAttention = useCallback(async () => {
    if (!creature) {
      return { needsAttention: false, reasons: [] };
    }

    try {
      const repo = await ClientDatabaseFactory.getCreatureRepository();
      return await repo.needsAttention(creature.id);
    } catch (err) {
      console.error('Error checking attention:', err);
      return { needsAttention: false, reasons: [] };
    }
  }, [creature]);

  // Delete creature
  const deleteCreature = useCallback(async () => {
    if (!creature) {
      setError('No creature to delete');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const repo = await ClientDatabaseFactory.getCreatureRepository();
      await repo.delete(creature.id);

      setCreature(null);
    } catch (err) {
      console.error('Error deleting creature:', err);
      setError(
        err instanceof Error ? err.message : 'Failed to delete creature'
      );
      throw err;
    } finally {
      setLoading(false);
    }
  }, [creature]);

  // Real-time listener effect
  useEffect(() => {
    let unsubscribe: (() => void) | null = null;

    const setupRealTimeListener = async () => {
      if (!user?.uid) return;

      try {
        const repo = await ClientDatabaseFactory.getCreatureRepository();

        // Try to set up real-time listener
        unsubscribe = repo.listenToCreatureByOwnerId(
          user.uid,
          (updatedCreature) => {
            setCreature(updatedCreature);
            setLoading(false);
          },
          (error) => {
            console.error('Real-time listener error:', error);
            setError(error.message);
            // Fallback to manual loading if real-time fails
            loadCreature();
          }
        );

        // If real-time listeners aren't supported, fall back to manual loading
        if (!unsubscribe) {
          console.log(
            'Real-time listeners not supported, using manual loading'
          );
          loadCreature();
        } else {
          console.log('Real-time listener established for creature updates');
        }
      } catch (err) {
        console.error('Error setting up real-time listener:', err);
        // Fallback to manual loading
        loadCreature();
      }
    };

    setupRealTimeListener();

    // Cleanup function
    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [user?.uid, loadCreature]);

  // Auto-refresh fallback (only if real-time listeners aren't working)
  useEffect(() => {
    if (options?.autoRefresh && options?.refreshInterval) {
      const interval = setInterval(loadCreature, options.refreshInterval);
      return () => clearInterval(interval);
    }
  }, [loadCreature, options?.autoRefresh, options?.refreshInterval]);

  return {
    creature,
    loading,
    error,

    // Actions
    createCreature,
    updateCreature,
    feedCreature,
    playWithCreature,
    restCreature,
    deleteCreature,
    checkAttention,

    // Utilities
    reload: loadCreature,
  };
}

/**
 * Example usage in a component:
 *
 * function CreatureCard() {
 *   const {
 *     creature,
 *     loading,
 *     error,
 *     feedCreature,
 *     playWithCreature,
 *     restCreature
 *   } = useCreature({ autoRefresh: true, refreshInterval: 30000 });
 *
 *   if (loading) return <div>Loading...</div>;
 *   if (error) return <div>Error: {error}</div>;
 *   if (!creature) return <div>No creature found</div>;
 *
 *   return (
 *     <div>
 *       <h2>{creature.name}</h2>
 *       <p>Hunger: {creature.hunger}/100</p>
 *       <p>Love: {creature.love}/100</p>
 *       <p>Tiredness: {creature.tiredness}/100</p>
 *
 *       <button onClick={() => feedCreature(20)}>Feed</button>
 *       <button onClick={playWithCreature}>Play</button>
 *       <button onClick={() => restCreature(30)}>Rest</button>
 *     </div>
 *   );
 * }
 */
