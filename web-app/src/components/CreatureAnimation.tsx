'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import Lottie from 'lottie-react';
import dogWalking from '~/public/dogWalking.json';
import dogEating from '~/public/dogEating.json';
import type { Creature } from '@/lib/database/client';

type AnimationType = 'walking' | 'eating';

interface AnimationConfig {
  data: unknown;
  loop: boolean;
  duration?: number;
}

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
  const animationTimeoutRef = useRef<NodeJS.Timeout | null>(null);
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
    }),
    []
  );

  const triggerTemporaryAnimation = (animationType: AnimationType) => {
    if (isPlayingTemporaryAnimation) return;

    const config = animations[animationType];

    setIsPlayingTemporaryAnimation(true);
    setCurrentAnimation(animationType);

    if (animationTimeoutRef.current) {
      clearTimeout(animationTimeoutRef.current);
    }

    if (config.duration) {
      animationTimeoutRef.current = setTimeout(() => {
        setCurrentAnimation('walking');
        setIsPlayingTemporaryAnimation(false);
      }, config.duration);
    }
  };

  useEffect(() => {
    return () => {
      if (animationTimeoutRef.current) {
        clearTimeout(animationTimeoutRef.current);
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
      triggerTemporaryAnimation('eating');
    }
    if (current.tiredness < previous.tiredness) {
      triggerTemporaryAnimation('eating');
    }
  }

  previousCreatureRef.current = { ...creature };

  return (
    <div className={`relative`}>
      <Lottie
        animationData={animations[currentAnimation].data}
        loop={animations[currentAnimation].loop}
        className='h-[250px] w-auto mx-auto'
      />

      {/* TODO: remove */}
      {process.env.NODE_ENV === 'development' && (
        <div className='absolute top-2 right-2 bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded'>
          {currentAnimation} {isPlayingTemporaryAnimation && '(temp)'}
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
