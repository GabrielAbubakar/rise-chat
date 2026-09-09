import { useState, useEffect, useCallback } from 'react';

export function useTimer(initialSeconds: number = 0) {
  const [timeLeft, setTimeLeft] = useState(initialSeconds);
  const [isActive, setIsActive] = useState(false);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;

    if (isActive && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((time) => {
          if (time <= 1) {
            setIsActive(false);
            return 0;
          }
          return time - 1;
        });
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isActive, timeLeft]);

  const startTimer = useCallback((seconds: number) => {
    setTimeLeft(seconds);
    setIsActive(true);
  }, []);

  const resetTimer = useCallback(() => {
    setTimeLeft(0);
    setIsActive(false);
  }, []);

  return { timeLeft, isActive, startTimer, resetTimer };
}
