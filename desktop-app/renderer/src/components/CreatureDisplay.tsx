'use client';

import { useCreature } from '@/lib/database/hooks/useCreature';
import { useAuth } from '@/components/providers/AuthProvider';
import { useState, useEffect } from 'react';
import CreatureAnimation from './CreatureAnimation';

interface ButtonEvent {
  button: string;
  timestamp: number;
}

// Declare the electronAPI interface for TypeScript
declare global {
  interface Window {
    electronAPI?: {
      onButtonPressed: (callback: (event: ButtonEvent) => void) => void;
      removeButtonListener: () => void;
    };
  }
}

export default function CreatureDisplay() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [bgColor, setBgColor] = useState('bg-white');

  const {
    creature,
    createCreature,
    feedCreature,
    playWithCreature,
    restCreature,
  } = useCreature();

  // Color mapping for each button - VERY OBVIOUS COLORS
  const buttonColors = {
    button1: 'bg-red-600', // Bright Red
    button2: 'bg-green-600', // Bright Green
    button3: 'bg-blue-600', // Bright Blue
    button4: 'bg-yellow-400', // Bright Yellow
  };

  useEffect(() => {
    // Check if we're in an Electron environment
    if (typeof window !== 'undefined' && window.electronAPI) {
      // Set up the button press listener
      window.electronAPI.onButtonPressed((event: ButtonEvent) => {
        const color = buttonColors[event.button as keyof typeof buttonColors];
        if (color) {
          setBgColor(color);
          // Reset to white after 3 seconds
          setTimeout(() => setBgColor('bg-white'), 3000);
        }
      });

      // Cleanup function
      return () => {
        if (window.electronAPI) {
          window.electronAPI.removeButtonListener();
        }
      };
    } else {
      // Fallback for development/web environment - use keyboard events
      const handleKeyPress = (event: KeyboardEvent) => {
        const key = event.key;
        let buttonName = '';

        switch (key) {
          case '1':
            buttonName = 'button1';
            break;
          case '2':
            buttonName = 'button2';
            break;
          case '3':
            buttonName = 'button3';
            break;
          case '4':
            buttonName = 'button4';
            break;
          default:
            return;
        }

        const color = buttonColors[buttonName as keyof typeof buttonColors];
        if (color) {
          setBgColor(color);
          // Reset to white after 3 seconds
          setTimeout(() => setBgColor('bg-white'), 3000);
        }
      };

      window.addEventListener('keydown', handleKeyPress);

      return () => {
        window.removeEventListener('keydown', handleKeyPress);
      };
    }
  }, []);

  return (
    <>
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
    </>
  );
}
