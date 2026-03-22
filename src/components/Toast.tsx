"use client";

import { useEffect, useState, useCallback } from "react";

interface ToastMessage {
  id: number;
  text: string;
  type: "info" | "success" | "error";
}

let toastId = 0;
let addToastFn: ((text: string, type?: ToastMessage["type"]) => void) | null =
  null;

/** Show a toast from anywhere in the app */
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
      }, 3000);
    },
    []
  );

  useEffect(() => {
    addToastFn = addToast;
    return () => {
      addToastFn = null;
    };
  }, [addToast]);

  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-4 left-1/2 z-[999] flex -translate-x-1/2 flex-col gap-2">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`rounded-lg px-4 py-2 text-sm shadow-lg animate-in fade-in slide-in-from-top-2 ${
            t.type === "error"
              ? "bg-red-900/90 text-red-100"
              : t.type === "success"
                ? "bg-green-900/90 text-green-100"
                : "bg-surface2 text-text"
          }`}
        >
          {t.text}
        </div>
      ))}
    </div>
  );
}
