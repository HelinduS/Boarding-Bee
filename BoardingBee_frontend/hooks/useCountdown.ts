'use client';
import { useEffect, useRef, useState, useCallback } from "react";

export interface UseCountdownProps {
  initialSeconds: number;
  onComplete?: () => void;   // called once when countdown hits 0
  autoStart?: boolean;       // start immediately? (default true)
}

export function useCountdown({
  initialSeconds,
  onComplete,
  autoStart = true,
}: UseCountdownProps) {
  const [seconds, setSeconds] = useState(initialSeconds);
  const [isActive, setIsActive] = useState(autoStart);
  const completeCalledRef = useRef(false);

  // If initialSeconds changes, reset countdown to new value
  useEffect(() => {
    setSeconds(initialSeconds);
    setIsActive(autoStart);
    completeCalledRef.current = false;
  }, [initialSeconds, autoStart]);

  // Tick
  useEffect(() => {
    if (!isActive || seconds <= 0) return;

    const interval = setInterval(() => {
      setSeconds((s) => Math.max(0, s - 1));
    }, 1000);

    return () => clearInterval(interval);
  }, [isActive, seconds]);

  // Fire onComplete exactly once
  useEffect(() => {
    if (seconds === 0 && !completeCalledRef.current) {
      completeCalledRef.current = true;
      setIsActive(false);
      onComplete?.();
    }
  }, [seconds, onComplete]);

  const reset = useCallback(() => {
    setSeconds(initialSeconds);
    setIsActive(autoStart);
    completeCalledRef.current = false;
  }, [initialSeconds, autoStart]);

  const pause = useCallback(() => setIsActive(false), []);
  const resume = useCallback(() => {
    if (seconds > 0) setIsActive(true);
  }, [seconds]);

  const isComplete = seconds === 0;

  const formatted = (() => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  })();

  return {
    seconds,
    formatted,
    isActive,
    isComplete,
    pause,
    resume,
    reset,
    setSeconds, // exposed in case you need manual adjustments
  };
}