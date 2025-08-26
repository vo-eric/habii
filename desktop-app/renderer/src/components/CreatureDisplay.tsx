'use client';

import { useCreature } from '@/lib/database/hooks/useCreature';
import { useWebSocket } from '@/components/providers/WebSocketProvider';
import { useEffect } from 'react';
import CreatureAnimation from './CreatureAnimation';

interface ButtonEvent {
  button: string;
  timestamp: number;
}

declare global {
  interface Window {
    electronAPI?: {
      onButtonPressed: (callback: (event: ButtonEvent) => void) => void;
      removeButtonListener: () => void;
    };
  }
}

export default function CreatureDisplay() {
  const { creature, feedCreature, playWithCreature, restCreature } =
    useCreature();
  const { triggerAnimation } = useWebSocket();

  useEffect(() => {
    if (typeof window !== 'undefined' && window.electronAPI) {
      window.electronAPI.onButtonPressed(async (event: ButtonEvent) => {
        switch (event.button) {
          case 'button1':
            try {
              await feedCreature();

              if (creature) {
                try {
                  await triggerAnimation('feed', creature.id);
                } catch (wsError) {
                  console.error(
                    'Failed to trigger WebSocket animation:',
                    wsError
                  );
                }
              }
            } catch (error) {
              console.error('Error calling feedCreature:', error);
            }
            break;
          case 'button2':
            try {
              await playWithCreature();

              if (creature) {
                try {
                  await triggerAnimation('play', creature.id);
                } catch (wsError) {
                  console.error(
                    'Failed to trigger WebSocket animation:',
                    wsError
                  );
                }
              }
            } catch (error) {
              console.error('Error calling playWithCreature:', error);
            }
            break;
          case 'button3':
            try {
              await restCreature();

              if (creature) {
                try {
                  await triggerAnimation('rest', creature.id);
                } catch (wsError) {
                  console.error(
                    'Failed to trigger WebSocket animation:',
                    wsError
                  );
                }
              }
            } catch (error) {
              console.error('Error calling restCreature:', error);
            }
            break;
          case 'button4':
            console.log('button4');
            // No action assigned yet
            break;
        }
      });

      // Cleanup function
      return () => {
        if (window.electronAPI) {
          window.electronAPI.removeButtonListener();
        }
      };
    }
  }, [creature]);

  return (
    <div
      className={`h-full w-full mx-auto rounded-lg shadow-md text-black relative`}
    >
      {creature && (
        <>
          <div className='absolute z-10 top-0'>
            <CreatureAnimation creature={creature} />
          </div>
        </>
      )}
    </div>
  );
}
