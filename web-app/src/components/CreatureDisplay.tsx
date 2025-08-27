'use client';

import { useCreature } from '@/lib/database/hooks/useCreature';
import { useState } from 'react';
import CreatureActions from './CreatureActions';
import CreatureAnimation from './CreatureAnimation';

export default function CreatureDisplay() {
  const [loading, setLoading] = useState(false);
  const { creature, createCreature } = useCreature();

  const handleCreateCreature = async () => {
    setLoading(true);

    try {
      await createCreature('Test Creature', 'default');
    } catch (error) {
      console.error('Error creating creature:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className='w-full max-w-md mx-auto bg-white rounded-lg shadow-md text-black relative'>
        {creature && (
          <>
            <div className='z-10'>
              <CreatureAnimation creature={creature} />
            </div>

            <div className='absolute right-0 top-1/2 -translate-y-1/2 h-full z-100'>
              <CreatureActions />
            </div>
          </>
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
    </>
  );
}
