'use client';

import { useCreature } from '@/lib/database/hooks/useCreature';
import { useState } from 'react';

export default function CreatureDisplay() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const { creature, reload } = useCreature('test-user-id');

  const handleCreateCreature = async () => {
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch('/api/create-creature', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: 'Test Creature',
          ownerId: 'test-user-id',
          type: 'default',
          hunger: 100,
          love: 100,
          tiredness: 0,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.error || `HTTP error! status: ${response.status}`
        );
      }

      // const data = await response.json();

      reload();
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
      <h1 className='text-2xl font-bold mb-4'>Creature Display</h1>

      {creature && (
        <div>
          <h2 className='text-xl font-bold mb-2'>Creature Details</h2>
          <p>Name: {creature.name}</p>
          <p>Owner ID: {creature.ownerId}</p>
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

      <button
        onClick={handleCreateCreature}
        disabled={loading}
        className='w-full bg-blue-500 hover:bg-blue-700 disabled:bg-gray-400 text-white font-bold py-2 px-4 rounded transition-colors'
      >
        {loading ? 'Creating...' : 'Create Creature'}
      </button>
    </div>
  );
}
