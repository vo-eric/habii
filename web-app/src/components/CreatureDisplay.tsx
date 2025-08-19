'use client';

import { useCreature } from '@/lib/database/hooks/useCreature';
import { useAuth } from '@/components/providers/AuthProvider';
import { useState } from 'react';
import { auth } from '@/lib/firebase';
import CreatureActions from './CreatureActions';
import Lottie from 'lottie-react';
import dogWalking from '~/public/dog_walking.json';

export default function CreatureDisplay() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [testLoading, setTestLoading] = useState(false);
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

  const handleTestDegradation = async () => {
    if (!user) {
      setError('Please log in first');
      return;
    }

    setTestLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const token = await auth.currentUser?.getIdToken();
      if (!token) {
        throw new Error('Failed to get authentication token');
      }

      const response = await fetch(
        'https://us-central1-habii-235d1.cloudfunctions.net/testDegradeCreatureStats',
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      console.log('Test degradation result:', result);

      setSuccess(
        `✅ Test completed! Updated ${result.count} creature(s). Real-time listener should have updated your stats automatically!`
      );

      // Note: No need to call reload() anymore since real-time listeners handle updates
    } catch (error) {
      console.error('Error testing degradation:', error);
      setError(
        error instanceof Error
          ? `Test failed: ${error.message}`
          : 'Failed to test degradation function'
      );
    } finally {
      setTestLoading(false);
    }
  };

  return (
    <div className='h-[500px] w-full max-w-md mx-auto bg-white rounded-lg shadow-md text-black relative'>
      {creature && (
        <>
          {/* <Lottie animationData={forest} className='absolute z-1  w-full' /> */}
          <Lottie
            animationData={dogWalking}
            loop={true}
            className='absolute z-2 h-[250px] w-auto bottom-0 left-1/2 -translate-x-1/2'
          />
        </>
        // <div>
        //   <h2 className='text-xl font-bold mb-2'>Creature Details</h2>
        //   <p>Name: {creature.name}</p>
        //   <p>Hunger: {creature.hunger}</p>
        //   <p>Love: {creature.love}</p>
        //   <p>Tiredness: {creature.tiredness}</p>
        // </div>
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
      ) : // <div className='space-y-4'>
      //   <CreatureActions
      //     feedCreature={feedCreature}
      //     playWithCreature={playWithCreature}
      //     restCreature={restCreature}
      //     loading={creatureLoading}
      //   />

      //   {/* Test Real-time Updates */}
      //   <div className='border-t pt-4'>
      //     <h3 className='text-sm font-semibold text-gray-600 mb-2'>
      //       🧪 Test Real-time Updates
      //     </h3>
      //     <button
      //       onClick={handleTestDegradation}
      //       disabled={testLoading}
      //       className='w-full bg-purple-500 hover:bg-purple-700 disabled:bg-gray-400 text-white font-bold py-2 px-4 rounded transition-colors text-sm'
      //     >
      //       {testLoading ? 'Testing...' : '⚡ Test Stat Degradation'}
      //     </button>
      //     <p className='text-xs text-gray-500 mt-1'>
      //       Trigger degradation and watch stats update in real-time!
      //     </p>
      //   </div>
      // </div>
      null}
    </div>
  );
}
