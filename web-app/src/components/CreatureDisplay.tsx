'use client';

import { useCreature } from '@/lib/database/hooks/useCreature';
import { useAuth } from '@/components/providers/AuthProvider';
import { useState } from 'react';
import CreatureActions from './CreatureActions';
import CreatureAnimation from './CreatureAnimation';

export default function CreatureDisplay() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const {
    creature,
    createCreature,
    feedCreature,
    playWithCreature,
    restCreature,
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
    <>
      <div className='h-[500px] w-full max-w-md mx-auto bg-white rounded-lg shadow-md text-black relative'>
        {creature && (
          <>
            <div className='absolute z-10 bottom-0 left-1/2 -translate-x-1/2'>
              <CreatureAnimation creature={creature} />
            </div>

            <div className='absolute top-4 left-4 z-20 bg-white/90 rounded-lg p-3 shadow-sm'>
              <h3 className='text-sm font-bold text-gray-800 mb-1'>
                {creature.name}
              </h3>
              <div className='text-xs text-gray-600 space-y-1'>
                <div>Love: {creature.love}/100</div>
                <div>Hunger: {creature.hunger}/100</div>
                <div>Energy: {100 - creature.tiredness}/100</div>
              </div>
            </div>
          </>
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

        {!creature && (
          <div className='flex items-center justify-center h-full'>
            <button
              onClick={handleCreateCreature}
              disabled={loading}
              className='bg-green-500 hover:bg-green-600 disabled:bg-gray-400 text-white font-bold py-3 px-6 rounded-lg transition-colors shadow-lg'
            >
              {loading ? 'Creating...' : '🐾 Create Your Creature'}
            </button>
          </div>
        )}
      </div>
      <div>
        <CreatureActions
          feedCreature={feedCreature}
          playWithCreature={playWithCreature}
          restCreature={restCreature}
        />
      </div>
    </>
  );
}
