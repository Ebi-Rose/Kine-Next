"use client";

import { useEffect, useState, useCallback } from "react";

interface ToastMessage {
  id: number;
  text: string;
  type: "info" | "success" | "error";
}

let toastId = 0;
let addToastFn: ((text: string, type?: ToastMessage["type"]) => void) | null = null;

export function toast(text: string, type: ToastMessage["type"] = "info") {
  addToastFn?.(text, type);
}

export default function ToastContainer() {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const addToast = useCallback(
    (text: string, type: ToastMessage["type"] = "info") => {
      const id = ++toastId;
      setToasts((prev) => [...prev, { id, text, type }]);
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, 3500);
    },
    []
  );

  useEffect(() => {
    addToastFn = addToast;
    return () => { addToastFn = null; };
  }, [addToast]);

  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-4 left-1/2 z-[999] flex -translate-x-1/2 flex-col gap-2 pointer-events-none">
      {toasts.map((t) => (
        <div
          key={t.id}
          role={t.type === "error" ? "alert" : "status"}
          aria-live={t.type === "error" ? "assertive" : "polite"}
          className={`pointer-events-auto rounded-xl px-4 py-2.5 text-[13px] font-light shadow-lg backdrop-blur-md animate-slide-down ${
            t.type === "error"
              ? "bg-red-950/80 text-red-200 border border-red-800/30"
              : t.type === "success"
                ? "bg-green-950/80 text-green-200 border border-green-800/30"
                : "bg-surface2/90 text-text border border-border/50"
          }`}
        >
          {t.text}
        </div>
      ))}
    </div>
  );
}
