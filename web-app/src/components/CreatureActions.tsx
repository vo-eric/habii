'use client';

import { Button } from '@chakra-ui/react';
import { useState } from 'react';
import { useCreature } from '@/lib/database/hooks/useCreature';
import { useWebSocket } from '@/components/providers/WebSocketProvider';

interface CreatureActionsProps {
  loading?: boolean;
}

export default function CreatureActions({
  loading = false,
}: CreatureActionsProps) {
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const { creature, feedCreature, playWithCreature, restCreature } =
    useCreature();
  const { triggerAnimation, connected } = useWebSocket();

  const handleAction = async (actionType: 'feed' | 'play' | 'rest') => {
    if (!creature) return;

    try {
      setActionLoading(actionType);

      // Call the database action to update stats
      switch (actionType) {
        case 'feed':
          await feedCreature();
          break;
        case 'play':
          await playWithCreature();
          break;
        case 'rest':
          await restCreature();
          break;
      }

      // If WebSocket is connected, trigger the animation
      if (connected) {
        try {
          await triggerAnimation(actionType, creature.id);
        } catch (wsError) {
          console.error('Failed to trigger WebSocket animation:', wsError);
          // Continue even if WebSocket fails - stats are already updated
        }
      }
    } catch (error) {
      console.error(`Error with ${actionType}:`, error);
    } finally {
      setActionLoading(null);
    }
  };

  if (!creature) {
    return null;
  }

  return (
    <div className='space-y-2'>
      <Button
        onClick={() => handleAction('feed')}
        disabled={loading || actionLoading === 'feed'}
        colorScheme='green'
        size='sm'
        className='w-full'
      >
        {actionLoading === 'feed' ? 'Feeding...' : 'Feed'}
      </Button>
      <Button
        onClick={() => handleAction('play')}
        disabled={loading || actionLoading === 'play'}
        colorScheme='blue'
        size='sm'
        className='w-full'
      >
        {actionLoading === 'play' ? 'Playing...' : 'Play'}
      </Button>
      <Button
        onClick={() => handleAction('rest')}
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
