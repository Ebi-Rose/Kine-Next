"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import type { SessionMode } from "@/store/useKineStore";

interface SessionTimerProps {
  mode: SessionMode;
  restDuration: number; // seconds — compound or isolation, set by parent
  restActive: boolean;
  onRestDismiss: () => void;
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

export default function SessionTimer({ mode, restDuration, restActive, onRestDismiss }: SessionTimerProps) {
  const [elapsed, setElapsed] = useState(0);
  const [restRemaining, setRestRemaining] = useState(0);
  const [restDone, setRestDone] = useState(false);
  const restStartRef = useRef<number | null>(null);

  // Elapsed session clock — runs in timed and stopwatch modes
  useEffect(() => {
    if (mode === "off") return;
    const start = Date.now();
    const interval = setInterval(() => {
      setElapsed(Math.floor((Date.now() - start) / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, [mode]);

  // Rest countdown — timed mode only
  useEffect(() => {
    if (mode !== "timed" || !restActive) {
      setRestDone(false);
      return;
    }

    restStartRef.current = Date.now();
    setRestRemaining(restDuration);
    setRestDone(false);

    const interval = setInterval(() => {
      const elapsed = Math.floor((Date.now() - restStartRef.current!) / 1000);
      const remaining = Math.max(0, restDuration - elapsed);
      setRestRemaining(remaining);

      if (remaining <= 0) {
        setRestDone(true);
        clearInterval(interval);
      }
    }, 250);

    return () => clearInterval(interval);
  }, [mode, restActive, restDuration]);

  const handleDismiss = useCallback(() => {
    setRestDone(false);
    onRestDismiss();
  }, [onRestDismiss]);

  if (mode === "off") return null;

  return (
    <div className="sticky top-0 z-50 backdrop-blur-md bg-bg/80 border-b border-white/[0.06]">
      <div className="flex items-center justify-between px-4 py-2">
        {/* Elapsed time */}
        <div className="flex items-center gap-2">
          <div className="h-1.5 w-1.5 rounded-full bg-accent animate-pulse" />
          <span className="font-display text-sm tracking-wider text-muted2">
            {formatTime(elapsed)}
          </span>
        </div>

        {/* Rest countdown — timed mode only */}
        {mode === "timed" && restActive && (
          <button
            onClick={handleDismiss}
            className={`flex items-center gap-2 px-3 py-1 rounded-full text-xs transition-all ${
              restDone
                ? "bg-accent/20 text-accent animate-pulse"
                : "bg-white/[0.06] text-muted2"
            }`}
          >
            {restDone ? (
              <span className="font-medium">Rest done — tap to dismiss</span>
            ) : (
              <>
                <span className="text-[10px] text-muted font-light">REST</span>
                <span className="font-display tracking-wider">{formatTime(restRemaining)}</span>
              </>
            )}
          </button>
        )}

        {/* Mode label */}
        {mode === "stopwatch" && (
          <span className="text-[10px] tracking-wider text-muted font-light uppercase">Stopwatch</span>
        )}
        {mode === "timed" && !restActive && (
          <span className="text-[10px] tracking-wider text-muted font-light uppercase">Timed</span>
        )}
      </div>
    </div>
  );
}
