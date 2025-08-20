'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import Lottie from 'lottie-react';
import dogWalking from '~/public/dogWalking.json';
import dogEating from '~/public/dogEating.json';
import dogPlaying from '~/public/dogPlaying.json';
import type { Creature } from '@/lib/database/client';

type AnimationType = 'walking' | 'eating' | 'playing';

interface AnimationConfig {
  data: unknown;
  loop: boolean;
  duration?: number;
}

const TRANSITION_DURATION = 300;

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
  const previousCreatureRef = useRef<Creature | null>(null);

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
    }),
    []
  );

  const triggerTemporaryAnimation = (animationType: AnimationType) => {
    if (isPlayingTemporaryAnimation || isTransitioning) return;

    const config = animations[animationType];

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    const showAnimation = () => {
      setIsPlayingTemporaryAnimation(true);
      setCurrentAnimation(animationType);
      setIsTransitioning(false);

      if (config.duration) {
        timeoutRef.current = setTimeout(startReturnTransition, config.duration);
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
  };

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  if (!creature) {
    return null;
  }

  if (previousCreatureRef.current) {
    const previous = previousCreatureRef.current;
    const current = creature;

    if (current.hunger > previous.hunger) {
      triggerTemporaryAnimation('eating');
    }
    if (current.love > previous.love) {
      triggerTemporaryAnimation('playing');
    }
    if (current.tiredness < previous.tiredness) {
      triggerTemporaryAnimation('eating');
    }
  }

  previousCreatureRef.current = { ...creature };

  return (
    <div className='relative'>
      <div
        className={`transition-opacity duration-300 ease-in-out ${
          isTransitioning ? 'opacity-0' : 'opacity-100'
        }`}
      >
        <Lottie
          animationData={animations[currentAnimation].data}
          loop={animations[currentAnimation].loop}
          className='h-[250px] w-auto mx-auto'
        />
      </div>

      {/* TODO: remove */}
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
