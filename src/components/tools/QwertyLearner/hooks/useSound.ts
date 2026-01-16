import { useCallback } from 'react';

export function useSound() {
  const play = useCallback((src: string, volume: number = 1.0) => {
    try {
      if (!src) return;
      const audio = new Audio(src);
      audio.volume = volume;
      audio.play().catch((e) => {
        // Ignore user interaction errors or missing file errors to prevent console spam
        // console.warn('Audio play failed:', e);
      });
    } catch (e) {
      console.error('Failed to create Audio:', e);
    }
  }, []);

  return { play };
}
