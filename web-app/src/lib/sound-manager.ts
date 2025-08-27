import { useCallback, useEffect, useRef, useState } from 'react';

export type AnimationType =
  | 'eating'
  | 'playing'
  | 'pooping'
  | 'petting'
  | 'resting';

interface SoundConfig {
  src: string;
  volume?: number;
  loop?: boolean;
}

interface SoundManager {
  playSound: (soundType: AnimationType) => void;
  stopSound: (soundType: AnimationType) => void;
  setVolume: (volume: number) => void;
  mute: (muted: boolean) => void;
  isMuted: boolean;
  volume: number;
  preloadSounds: () => Promise<void>;
}

const soundMapping: Record<AnimationType, SoundConfig> = {
  eating: { src: '/sounds/dogEating.mp3', volume: 1, loop: false },
  playing: { src: '/sounds/dogPlaying.mp3', volume: 1, loop: false },
  pooping: { src: '/sounds/dogPooping.mp3', volume: 1, loop: false },
  petting: { src: '/sounds/dogPetting.mp3', volume: 1, loop: false },
  resting: { src: '/sounds/dogSleeping.mp3', volume: 1, loop: true },
};

export const useSoundManager = (): SoundManager => {
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolumeState] = useState(0.5);
  const audioElements = useRef<Map<AnimationType, HTMLAudioElement>>(new Map());
  const isPreloaded = useRef(false);

  const createAudioElement = useCallback(
    (soundType: AnimationType): HTMLAudioElement => {
      const config = soundMapping[soundType];
      const audio = new Audio(config.src);
      audio.volume = (config.volume || 0.5) * volume;
      audio.loop = config.loop || false;
      audio.preload = 'auto';
      return audio;
    },
    [volume]
  );

  const preloadSounds = useCallback(async (): Promise<void> => {
    if (isPreloaded.current) return;

    try {
      const preloadPromises = Object.keys(soundMapping).map(
        async (soundType) => {
          const audio = createAudioElement(soundType as AnimationType);
          audioElements.current.set(soundType as AnimationType, audio);

          // Preload the audio
          return new Promise<void>((resolve) => {
            audio.addEventListener('canplaythrough', () => resolve(), {
              once: true,
            });
            audio.addEventListener('error', () => resolve(), { once: true });
            audio.load();
          });
        }
      );

      await Promise.all(preloadPromises);
      isPreloaded.current = true;
      console.log('All sounds preloaded successfully');
    } catch (error) {
      console.error('Error preloading sounds:', error);
    }
  }, [createAudioElement]);

  const playSound = useCallback(
    (soundType: AnimationType) => {
      if (isMuted) return;

      try {
        let audio = audioElements.current.get(soundType);

        if (!audio) {
          audio = createAudioElement(soundType);
          audioElements.current.set(soundType, audio);
        }

        // Stop any currently playing sound of the same type
        audio.pause();
        audio.currentTime = 0;

        // Play the sound
        audio.play().catch((error) => {
          console.error(`Error playing sound ${soundType}:`, error);
        });
      } catch (error) {
        console.error(`Error playing sound ${soundType}:`, error);
      }
    },
    [isMuted, createAudioElement]
  );

  const stopSound = useCallback((soundType: AnimationType) => {
    const audio = audioElements.current.get(soundType);
    if (audio) {
      audio.pause();
      audio.currentTime = 0;
    }
  }, []);

  const setVolume = useCallback((newVolume: number) => {
    const clampedVolume = Math.max(0, Math.min(1, newVolume));
    setVolumeState(clampedVolume);

    // Update volume for all audio elements
    audioElements.current.forEach((audio) => {
      const soundType = Array.from(audioElements.current.entries()).find(
        ([_, element]) => element === audio
      )?.[0];

      if (soundType) {
        const config = soundMapping[soundType];
        audio.volume = (config.volume || 0.5) * clampedVolume;
      }
    });
  }, []);

  const mute = useCallback((muted: boolean) => {
    setIsMuted(muted);

    if (muted) {
      // Stop all currently playing sounds
      audioElements.current.forEach((audio) => {
        audio.pause();
      });
    }
  }, []);

  // Preload sounds on mount
  useEffect(() => {
    preloadSounds();
  }, [preloadSounds]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      audioElements.current.forEach((audio) => {
        audio.pause();
        audio.src = '';
      });
      audioElements.current.clear();
    };
  }, []);

  return {
    playSound,
    stopSound,
    setVolume,
    mute,
    isMuted,
    volume,
    preloadSounds,
  };
};
