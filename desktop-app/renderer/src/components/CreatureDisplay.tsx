'use client';

import { useCreature } from '@/lib/database/hooks/useCreature';
import { useAuth } from '@/components/providers/AuthProvider';
import { useWebSocket } from '@/components/providers/WebSocketProvider';
import { useState, useEffect } from 'react';
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
  console.log('🔍 CreatureDisplay component RENDERING');
  const { user } = useAuth();
  const [bgColor, setBgColor] = useState('bg-amber-400');

  const {
    creature,
    feedCreature,
    playWithCreature,
    restCreature,
    loading,
    error,
  } = useCreature(); // Add auto-refresh to see if creature loads
  const { triggerAnimation, connected } = useWebSocket();

  // Color mapping for each button - VERY OBVIOUS COLORS
  const buttonColors = {
    button1: 'bg-red-600', // Bright Red
    button2: 'bg-green-600', // Bright Green
    button3: 'bg-blue-600', // Bright Blue
    button4: 'bg-black', // Bright Yellow
  };

  useEffect(() => {
    // Visual indicator that useEffect is running
    setBgColor('bg-purple-500'); // This will change the debug box to purple

    // Check if we're in an Electron environment
    if (typeof window !== 'undefined' && window.electronAPI) {
      // Set up the button press listener
      window.electronAPI.onButtonPressed(async (event: ButtonEvent) => {
        const color = buttonColors[event.button as keyof typeof buttonColors];
        if (color) {
          setBgColor(color); // Permanent color change
        }

        switch (event.button) {
          case 'button1':
            try {
              await feedCreature();

              // If WebSocket is connected, trigger the animation
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

              // If WebSocket is connected, trigger the animation
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

              // If WebSocket is connected, trigger the animation
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
      className={`h-full w-full mx-auto ${bgColor} rounded-lg shadow-md text-black relative transition-colors duration-300`}
    >
      {creature && (
        <>
          <div className='absolute z-10 top-0'>
            <CreatureAnimation creature={creature} buttonColor={bgColor} />
          </div>
        </>
      )}
    </div>
  );
}
