'use client';

import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import Lottie from 'lottie-react';
import dogWalking from '~/public/dogWalking.json';
import dogEating from '~/public/dogEating.json';
import dogPlaying from '~/public/dogPlaying.json';
import dogPooping from '~/public/dogPooping.json';
import dogPetting from '~/public/dogPetting.json';
import dogSleeping from '~/public/dogSleeping.json';
import type { Creature } from '@/lib/database/client';
import { useWebSocket } from '@/components/providers/WebSocketProvider';
import type { AnimationEvent } from '@/lib/websocket';

type AnimationType =
  | 'walking'
  | 'eating'
  | 'playing'
  | 'resting'
  | 'pooping'
  | 'petting';

interface AnimationConfig {
  data: unknown;
  loop: boolean;
  duration?: number;
}

const TRANSITION_DURATION = 200;

const calculateLottieDuration = (lottieData: unknown): number => {
  const data = lottieData as { op: number; fr: number };
  const op = data.op;
  const fr = data.fr;

  if (fr > 0) {
    return (op / fr) * 1000;
  }

  return 0;
};

export default function CreatureAnimation({
  creature,
}: {
  creature: Creature | null;
}) {
  const [currentAnimation, setCurrentAnimation] =
    useState<AnimationType>('walking');
  const [isPlayingTemporaryAnimation, setIsPlayingTemporaryAnimation] =
    useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);

  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const scheduledTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const { onAnimationSync, joinCreatureRoom, connected, triggerAnimation } =
    useWebSocket();

  const animations = useMemo<Record<AnimationType, AnimationConfig>>(
    () => ({
      walking: {
        data: dogWalking,
        loop: true,
      },
      eating: {
        data: dogEating,
        loop: false,
        duration: calculateLottieDuration(dogEating),
      },
      playing: {
        data: dogPlaying,
        loop: false,
        duration: calculateLottieDuration(dogPlaying),
      },
      pooping: {
        data: dogPooping,
        loop: false,
        duration: calculateLottieDuration(dogPooping),
      },
      petting: {
        data: dogPetting,
        loop: false,
        duration: calculateLottieDuration(dogPetting),
      },
      resting: {
        data: dogSleeping,
        loop: false,
        duration: calculateLottieDuration(dogSleeping),
      },
    }),
    []
  );

  const handleCreatureClick = () => {
    const random = Math.random();

    if (random >= 0.5) {
      broadcastRandomAnimation();
    }
  };

  const broadcastRandomAnimation = () => {
    switch (true) {
      case creature && creature.hunger >= 80:
        if (connected && creature) {
          // Send animation to server (sync will handle local play)
          triggerAnimation('poop', creature.id).catch(console.error);
        }
        break;
      default:
        if (connected && creature) {
          // Send animation to server (sync will handle local play)
          triggerAnimation('pet', creature.id).catch(console.error);
        }
        break;
    }
  };

  const displayAnimation = useCallback(
    (animationType: AnimationType) => {
      console.log(`🎬 displayAnimation called with: ${animationType}`);

      if (isPlayingTemporaryAnimation || isTransitioning) {
        console.log(
          `❌ Animation blocked - already playing: ${isPlayingTemporaryAnimation}, transitioning: ${isTransitioning}`
        );
        return;
      }

      const config = animations[animationType];

      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      const showAnimation = () => {
        setIsPlayingTemporaryAnimation(true);
        setCurrentAnimation(animationType);
        setIsTransitioning(false);

        if (config.duration) {
          timeoutRef.current = setTimeout(
            startReturnTransition,
            config.duration
          );
        }
      };

      const startReturnTransition = () => {
        setIsTransitioning(true);
        timeoutRef.current = setTimeout(returnToWalking, TRANSITION_DURATION);
      };

      const returnToWalking = () => {
        setCurrentAnimation('walking');
        setIsPlayingTemporaryAnimation(false);
        setIsTransitioning(false);
      };

      // Start the sequence
      setIsTransitioning(true);
      timeoutRef.current = setTimeout(showAnimation, TRANSITION_DURATION);
    },
    [animations, isPlayingTemporaryAnimation, isTransitioning]
  );

  // Join creature room when creature is loaded
  useEffect(() => {
    if (creature && connected) {
      joinCreatureRoom(creature.id).catch(console.error);
    }
  }, [creature, connected, joinCreatureRoom]);

  // WebSocket animation sync
  useEffect(() => {
    if (!creature) return;

    const unsubscribe = onAnimationSync((event: AnimationEvent) => {
      // Only handle events for our creature
      if (event.creatureId !== creature.id) return;

      const now = Date.now();
      const delay = event.timestamp - now;

      // Map event types to animation types
      const animationTypeMap: Record<string, AnimationType> = {
        feed: 'eating',
        play: 'playing',
        rest: 'resting',
        poop: 'pooping',
        pet: 'petting',
      };

      const animationType = animationTypeMap[event.type];
      if (!animationType) return;

      // Clear any existing scheduled animation
      if (scheduledTimeoutRef.current) {
        clearTimeout(scheduledTimeoutRef.current);
        scheduledTimeoutRef.current = null;
      }

      // Schedule the animation (immediate if time has passed)
      const actualDelay = Math.max(0, delay);
      scheduledTimeoutRef.current = setTimeout(() => {
        displayAnimation(animationType);
      }, actualDelay);
    });

    return () => {
      unsubscribe();
      if (scheduledTimeoutRef.current) {
        clearTimeout(scheduledTimeoutRef.current);
        scheduledTimeoutRef.current = null;
      }
    };
  }, [creature, onAnimationSync, displayAnimation]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      if (scheduledTimeoutRef.current) {
        clearTimeout(scheduledTimeoutRef.current);
      }
    };
  }, []);

  if (!creature) {
    return null;
  }

  return (
    <div className='relative'>
      <div
        className={`transition-opacity duration-300 ease-in-out ${
          isTransitioning ? 'opacity-0' : 'opacity-100'
        }`}
      >
        <div
          className='absolute border-4 border-indigo-600 size-10 z-1 bg-amber-400'
          onClick={handleCreatureClick}
        />
        <Lottie
          animationData={animations[currentAnimation].data}
          loop={animations[currentAnimation].loop}
          className='h-[250px] w-auto mx-auto'
        />
      </div>

      {/* Development debug info only */}
      {process.env.NODE_ENV === 'development' && (
        <div className='absolute top-2 right-2 bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded'>
          {currentAnimation} {isPlayingTemporaryAnimation && '(temp)'}{' '}
          {isTransitioning && '(transitioning)'}
          {animations[currentAnimation].duration && (
            <span className='ml-1'>
              ({Math.round(animations[currentAnimation].duration! / 1000)}s)
            </span>
          )}
        </div>
      )}
    </div>
  );
}
