import { useState, useEffect } from "react";

export function useCountdown({ initialSeconds }: { initialSeconds: number }) {
  const [seconds, setSeconds] = useState(initialSeconds);
  const [isComplete, setIsComplete] = useState(false);

  useEffect(() => {
    if (seconds <= 0) {
      setIsComplete(true);
      return;
    }
    const interval = setInterval(() => setSeconds((s) => s - 1), 1000);
    return () => clearInterval(interval);
  }, [seconds]);

  const reset = () => {
    setSeconds(initialSeconds);
    setIsComplete(false);
  };

  const formatted = `${Math.floor(seconds / 60)
    .toString()
    .padStart(2, "0")}:${(seconds % 60).toString().padStart(2, "0")}`;

  return { seconds, formatted, isComplete, reset };
}
