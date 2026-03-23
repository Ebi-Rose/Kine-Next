// ── Timer Cleanup Hook ──
// Registers intervals/timeouts and cleans them up on unmount

import { useEffect, useRef, useCallback } from "react";

export function useCleanup() {
  const intervals = useRef<ReturnType<typeof setInterval>[]>([]);
  const timeouts = useRef<ReturnType<typeof setTimeout>[]>([]);

  const registerInterval = useCallback((id: ReturnType<typeof setInterval>) => {
    intervals.current.push(id);
    return id;
  }, []);

  const registerTimeout = useCallback((id: ReturnType<typeof setTimeout>) => {
    timeouts.current.push(id);
    return id;
  }, []);

  useEffect(() => {
    return () => {
      intervals.current.forEach(clearInterval);
      timeouts.current.forEach(clearTimeout);
      intervals.current = [];
      timeouts.current = [];
    };
  }, []);

  return { registerInterval, registerTimeout };
}
