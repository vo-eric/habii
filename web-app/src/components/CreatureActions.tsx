'use client';

import { useState } from 'react';
import { useCreature } from '@/lib/database/hooks/useCreature';
import { useWebSocket } from '@/components/providers/WebSocketProvider';
import {
  Sleep20Regular,
  FoodChickenLeg20Regular,
  SportSoccer20Regular,
} from '@fluentui/react-icons';

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
    <div className='flex flex-col gap-2 justify-evenly h-full pr-4'>
      <button
        onClick={() => handleAction('feed')}
        disabled={loading || actionLoading === 'feed'}
        className='rounded-full size-10 border-2'
      >
        <FoodChickenLeg20Regular className='size-10' color='#90A0BA' />
      </button>
      <button
        onClick={() => handleAction('play')}
        disabled={loading || actionLoading === 'play'}
        className='rounded-full size-10 border-2'
      >
        <SportSoccer20Regular className='size-10' color='#90A0BA' />
      </button>
      <button
        onClick={() => handleAction('rest')}
        disabled={loading || actionLoading === 'rest'}
        className='rounded-full size-10 border-2'
      >
        <Sleep20Regular className='size-10' color='#90A0BA' />
      </button>
    </div>
  );
}
