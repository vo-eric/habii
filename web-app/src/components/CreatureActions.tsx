'use client';

import { Button } from '@chakra-ui/react';
import { useState } from 'react';
import { Creature } from '@/lib/database/types';
import { useWebSocket } from '@/components/providers/WebSocketProvider';

interface CreatureActionsProps {
  feedCreature: (amount?: number) => Promise<Creature | null>;
  playWithCreature: () => Promise<Creature | null>;
  restCreature: (duration?: number) => Promise<Creature | null>;
  creatureId?: string;
  loading?: boolean;
}

export default function CreatureActions({
  feedCreature,
  playWithCreature,
  restCreature,
  creatureId,
  loading = false,
}: CreatureActionsProps) {
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const { triggerAnimation, connected } = useWebSocket();

  const handleAction = async (
    action: () => Promise<Creature | null>,
    actionName: string,
    animationType: 'feed' | 'play' | 'rest'
  ) => {
    try {
      setActionLoading(actionName);

      // Call the database action to update stats
      const updatedCreature = await action();

      // If WebSocket is connected and we have a creature, trigger the animation
      if (connected && creatureId) {
        try {
          await triggerAnimation(animationType, creatureId);
          console.log(`📡 WebSocket animation triggered: ${animationType}`);
        } catch (wsError) {
          console.error('Failed to trigger WebSocket animation:', wsError);
          // Continue even if WebSocket fails - stats are already updated
        }
      } else {
        console.log(
          'WebSocket not connected or no creature ID, using database sync'
        );
      }
    } catch (error) {
      console.error(`Error with ${actionName}:`, error);
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className='space-y-2'>
      <Button
        onClick={() => handleAction(() => feedCreature(), 'feed', 'feed')}
        disabled={loading || actionLoading === 'feed'}
        colorScheme='green'
        size='sm'
        className='w-full'
      >
        {actionLoading === 'feed' ? 'Feeding...' : 'Feed'}
      </Button>
      <Button
        onClick={() => handleAction(() => playWithCreature(), 'play', 'play')}
        disabled={loading || actionLoading === 'play'}
        colorScheme='blue'
        size='sm'
        className='w-full'
      >
        {actionLoading === 'play' ? 'Playing...' : 'Play'}
      </Button>
      <Button
        onClick={() => handleAction(() => restCreature(), 'rest', 'rest')}
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
