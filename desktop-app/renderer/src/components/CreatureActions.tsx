'use client';

import { useState } from 'react';
import { useCreature } from '@/lib/database/hooks/useCreature';
import { useWebSocket } from '@/components/providers/WebSocketProvider';
import {
  Bed20Regular,
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

  const hungerFill = Math.min(creature.hunger, 100);
  const loveFill = Math.min(creature.love, 100);
  const tirednessFill = Math.min(creature.tiredness, 100);

  const circumference = 2 * Math.PI * 18;
  const hungerStrokeDasharray = (hungerFill / 100) * circumference;
  const loveStrokeDasharray = (loveFill / 100) * circumference;
  const tirednessStrokeDasharray = (tirednessFill / 100) * circumference;

  return (
    <div className='flex flex-col gap-4 justify-evenly h-full pr-4'>
      <div className='relative'>
        <svg className='w-12 h-12 transform -rotate-90' viewBox='0 0 40 40'>
          <circle
            cx='20'
            cy='20'
            r='18'
            stroke='#e5e7eb'
            strokeWidth='2'
            fill='none'
          />
          <circle
            cx='20'
            cy='20'
            r='18'
            stroke='#ef4444'
            strokeWidth='2'
            fill='none'
            strokeDasharray={circumference}
            strokeDashoffset={circumference - hungerStrokeDasharray}
            className='transition-all duration-600 ease-in-out'
          />
        </svg>
        <button
          onClick={() => handleAction('feed')}
          disabled={loading || actionLoading === 'feed'}
          className='absolute inset-0 flex items-center justify-center rounded-full hover:bg-red-50 disabled:opacity-50'
        >
          <FoodChickenLeg20Regular className='size-6' color='#90A0BA' />
        </button>
      </div>

      <div className='relative'>
        <svg className='w-12 h-12 transform -rotate-90' viewBox='0 0 40 40'>
          <circle
            cx='20'
            cy='20'
            r='18'
            stroke='#e5e7eb'
            strokeWidth='2'
            fill='none'
          />
          <circle
            cx='20'
            cy='20'
            r='18'
            stroke='#fbbf24'
            strokeWidth='2'
            fill='none'
            strokeDasharray={circumference}
            strokeDashoffset={circumference - loveStrokeDasharray}
            className='transition-all duration-600 ease-in-out'
          />
        </svg>
        <button
          onClick={() => handleAction('play')}
          disabled={loading || actionLoading === 'play'}
          className='absolute inset-0 flex items-center justify-center rounded-full hover:bg-amber-50 disabled:opacity-50'
        >
          <SportSoccer20Regular className='size-6' color='#90A0BA' />
        </button>
      </div>

      <div className='relative'>
        <svg className='w-12 h-12 transform -rotate-90' viewBox='0 0 40 40'>
          <circle
            cx='20'
            cy='20'
            r='18'
            stroke='#e5e7eb'
            strokeWidth='2'
            fill='none'
          />
          <circle
            cx='20'
            cy='20'
            r='18'
            stroke='#8b5cf6'
            strokeWidth='2'
            fill='none'
            strokeDasharray={circumference}
            strokeDashoffset={circumference - tirednessStrokeDasharray}
            className='transition-all duration-600 ease-in-out'
          />
        </svg>
        <button
          onClick={() => handleAction('rest')}
          disabled={loading || actionLoading === 'rest'}
          className='absolute inset-0 flex items-center justify-center rounded-full hover:bg-purple-50 disabled:opacity-50'
        >
          <Bed20Regular className='size-6' color='#90A0BA' />
        </button>
      </div>
    </div>
  );
}
