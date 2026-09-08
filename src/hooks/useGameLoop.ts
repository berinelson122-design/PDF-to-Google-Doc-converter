import { useEffect, useRef } from 'react';

// ===== START NEW CODE: HIGH-PERFORMANCE GAME LOOP =====
export interface GameLoopCallback {
  (deltaTime: number, timestamp: number): void;
}

export function useGameLoop(callback: GameLoopCallback, isRunning: boolean = true) {
  const requestRef = useRef<number | null>(null);
  const previousTimeRef = useRef<number | null>(null);
  const callbackRef = useRef<GameLoopCallback>(callback);

  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  useEffect(() => {
    if (!isRunning) {
      if (requestRef.current !== null) {
        cancelAnimationFrame(requestRef.current);
        requestRef.current = null;
      }
      previousTimeRef.current = null;
      return;
    }

    const animate = (time: number) => {
      if (previousTimeRef.current !== null) {
        const deltaTime = (time - previousTimeRef.current) / 1000;
        callbackRef.current(deltaTime, time);
      }
      previousTimeRef.current = time;
      requestRef.current = requestAnimationFrame(animate);
    };

    requestRef.current = requestAnimationFrame(animate);

    return () => {
      if (requestRef.current !== null) {
        cancelAnimationFrame(requestRef.current);
      }
    };
  }, [isRunning]);
}
// ===== END NEW CODE: HIGH-PERFORMANCE GAME LOOP =====
