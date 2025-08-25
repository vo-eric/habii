'use client';

import { useCreature } from '@/lib/database/hooks/useCreature';
import { useAuth } from '@/components/providers/AuthProvider';
import { useState } from 'react';
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

  return (
    <>
      <div className='h=full w-full mx-auto bg-white rounded-lg shadow-md text-black relative'>
        {creature && (
          <>
            <div className='absolute z-10 top-0'>
              <CreatureAnimation creature={creature} />
            </div>
          </>
        )}
      </div>
    </>
  );
}
