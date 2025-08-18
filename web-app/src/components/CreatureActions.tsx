'use client';

import { Button } from '@chakra-ui/react';
import { useState } from 'react';

import { Creature } from '@/lib/database/types';

interface CreatureActionsProps {
  feedCreature: (amount?: number) => Promise<Creature | null>;
  playWithCreature: () => Promise<Creature | null>;
  restCreature: (duration?: number) => Promise<Creature | null>;
  loading?: boolean;
}

export default function CreatureActions({
  feedCreature,
  playWithCreature,
  restCreature,
  loading = false,
}: CreatureActionsProps) {
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const handleAction = async (
    action: () => Promise<Creature | null>,
    actionName: string
  ) => {
    try {
      setActionLoading(actionName);
      await action();
    } catch (error) {
      console.error(`Error with ${actionName}:`, error);
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className='space-y-2'>
      <Button
        onClick={() => handleAction(() => feedCreature(), 'feed')}
        disabled={loading || actionLoading === 'feed'}
        colorScheme='green'
        size='sm'
        className='w-full'
      >
        {actionLoading === 'feed' ? 'Feeding...' : 'Feed'}
      </Button>
      <Button
        onClick={() => handleAction(() => playWithCreature(), 'play')}
        disabled={loading || actionLoading === 'play'}
        colorScheme='blue'
        size='sm'
        className='w-full'
      >
        {actionLoading === 'play' ? 'Playing...' : 'Play'}
      </Button>
      <Button
        onClick={() => handleAction(() => restCreature(), 'rest')}
        disabled={loading || actionLoading === 'rest'}
        colorScheme='purple'
        size='sm'
        className='w-full'
      >
        {actionLoading === 'rest' ? 'Sleeping...' : 'Sleep'}
      </Button>
    </div>
  );
}
