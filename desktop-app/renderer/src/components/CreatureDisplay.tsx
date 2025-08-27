'use client';

import { useCreature } from '@/lib/database/hooks/useCreature';
import { useWebSocket } from '@/components/providers/WebSocketProvider';
import { useEffect, useState } from 'react';
import CreatureAnimation from './CreatureAnimation';
import CreatureActions from './CreatureActions';

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
  const { triggerAnimation, connected } = useWebSocket();
  const [displayMedia, setDisplayMedia] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined' && window.electronAPI) {
      window.electronAPI.onButtonPressed(async (event: ButtonEvent) => {
        switch (event.button) {
          case 'button1':
            // Display media for 3 seconds
            setDisplayMedia(true);

            // Broadcast media event via WebSocket
            if (connected && creature) {
              try {
                await triggerAnimation('media', creature.id, {
                  mediaConfig: {
                    type: 'image',
                    src: '/wee_baby_kona.jpg',
                    duration: 3000,
                  },
                });
              } catch (wsError) {
                console.error(
                  'Failed to trigger WebSocket media event:',
                  wsError
                );
              }
            }

            setTimeout(() => {
              setDisplayMedia(false);
            }, 3000);
            break;
          case 'button4':
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
          case 'button3':
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
          case 'button2':
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
        }
      });

      // Cleanup function
      return () => {
        if (window.electronAPI) {
          window.electronAPI.removeButtonListener();
        }
      };
    }
  }, [creature, connected, triggerAnimation]);

  return (
    <div
      className={`h-full w-full mx-auto text-black relative overflow-hidden`}
    >
      {creature && (
        <>
          <div className='absolute z-10 top-0'>
            <CreatureAnimation
              creature={creature}
              displayMedia={displayMedia}
            />
          </div>
          <div className='absolute right-0 top-1/2 -translate-y-1/2 h-full z-100'>
            <CreatureActions />
          </div>
        </>
      )}
    </div>
  );
}
