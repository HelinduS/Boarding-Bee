'use client';
import { useState, useEffect, useCallback } from "react";

interface UseCountdownProps {
  initialSeconds: number;
  onComplete?: () => void;
}

export const useCountdown = ({ initialSeconds, onComplete }: UseCountdownProps) => {
  const [seconds, setSeconds] = useState(initialSeconds);
  const [isActive, setIsActive] = useState(true);

  const reset = useCallback(() => {
    setSeconds(initialSeconds);
    setIsActive(true);
  }, [initialSeconds]);

  const pause = useCallback(() => setIsActive(false), []);
  const resume = useCallback(() => setIsActive(true), []);

  useEffect(() => {
    let interval: NodeJS.Timeout | undefined;
    if (isActive && seconds > 0) {
      interval = setInterval(() => setSeconds((prev) => prev - 1), 1000);
    } else if (seconds === 0) {
      onComplete?.();
    }
    return () => interval && clearInterval(interval);
  }, [isActive, seconds, onComplete]);

  const formatted = (() => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  })();

  return { seconds, isActive, isComplete: seconds === 0, reset, pause, resume, formatted };
};