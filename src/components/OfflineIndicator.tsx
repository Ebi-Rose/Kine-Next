"use client";

import { useState, useEffect } from "react";

export default function OfflineIndicator() {
  const [offline, setOffline] = useState(false);

  useEffect(() => {
    setOffline(!navigator.onLine);
    const goOffline = () => setOffline(true);
    const goOnline = () => setOffline(false);
    window.addEventListener("offline", goOffline);
    window.addEventListener("online", goOnline);
    return () => {
      window.removeEventListener("offline", goOffline);
      window.removeEventListener("online", goOnline);
    };
  }, []);

  if (!offline) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed top-0 left-0 right-0 z-[200] flex items-center justify-center gap-2 bg-surface2 border-b border-border py-1.5 text-xs text-muted2 animate-slide-down"
    >
      <span className="inline-block h-2 w-2 rounded-full bg-amber-500" aria-hidden="true" />
      You&apos;re offline — changes saved locally
    </div>
  );
}
