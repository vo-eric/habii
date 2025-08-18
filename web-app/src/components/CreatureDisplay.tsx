'use client';

import { useCreature } from '@/lib/database/hooks/useCreature';
import { useAuth } from '@/components/providers/AuthProvider';
import { useState } from 'react';
import CreatureActions from './CreatureActions';

export default function CreatureDisplay() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const {
    creature,
    createCreature,
    reload,
    feedCreature,
    playWithCreature,
    restCreature,
    loading: creatureLoading,
  } = useCreature();

  const handleCreateCreature = async () => {
    if (!user?.uid) {
      setError('User not authenticated');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      // Use the createCreature function from the hook instead of the API call
      await createCreature('Test Creature', 'default');
      setSuccess('Creature created successfully!');
    } catch (error) {
      console.error('Error creating creature:', error);
      setError(
        error instanceof Error ? error.message : 'Failed to create creature'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className='p-6 max-w-md mx-auto bg-white rounded-lg shadow-md text-black'>
      {creature && (
        <div>
          <h2 className='text-xl font-bold mb-2'>Creature Details</h2>
          <p>Name: {creature.name}</p>
          <p>Hunger: {creature.hunger}</p>
          <p>Love: {creature.love}</p>
          <p>Tiredness: {creature.tiredness}</p>
        </div>
      )}

      {error && (
        <div className='mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded'>
          Error: {error}
        </div>
      )}

      {success && (
        <div className='mb-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded'>
          {success}
        </div>
      )}

      {!creature ? (
        <button
          onClick={handleCreateCreature}
          disabled={loading}
          className='w-full bg-blue-500 hover:bg-blue-700 disabled:bg-gray-400 text-white font-bold py-2 px-4 rounded transition-colors'
        >
          {loading ? 'Creating...' : 'Create Creature'}
        </button>
      ) : (
        <div className='space-y-4'>
          <CreatureActions
            feedCreature={feedCreature}
            playWithCreature={playWithCreature}
            restCreature={restCreature}
            loading={creatureLoading}
          />
        </div>
      )}
    </div>
  );
}
