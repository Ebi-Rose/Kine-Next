"use client";

import { useEffect, useRef } from "react";
import { signOut } from "@/lib/auth";

const INACTIVITY_TIMEOUT = 30 * 60 * 1000; // 30 minutes
const ACTIVITY_EVENTS = ["mousedown", "keydown", "touchstart", "scroll"] as const;

/**
 * Signs the user out after 30 minutes of inactivity.
 * Resets the timer on any user interaction.
 */
export default function InactivityGuard() {
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    function resetTimer() {
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => {
        signOut();
      }, INACTIVITY_TIMEOUT);
    }

    // Start the timer
    resetTimer();

    // Reset on user activity
    for (const event of ACTIVITY_EVENTS) {
      window.addEventListener(event, resetTimer, { passive: true });
    }

    return () => {
      if (timer.current) clearTimeout(timer.current);
      for (const event of ACTIVITY_EVENTS) {
        window.removeEventListener(event, resetTimer);
      }
    };
  }, []);

  return null;
}
