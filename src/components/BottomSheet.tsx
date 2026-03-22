"use client";

import { useEffect, useRef } from "react";

interface BottomSheetProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
}

export default function BottomSheet({
  open,
  onClose,
  title,
  children,
}: BottomSheetProps) {
  const sheetRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100]">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-[6px] animate-fade-in"
        onClick={onClose}
      />

      {/* Sheet */}
      <div
        ref={sheetRef}
        className="absolute bottom-0 left-0 right-0 max-h-[85vh] overflow-y-auto rounded-t-2xl border-t border-border/50 bg-surface animate-slide-up"
        style={{ boxShadow: "0 -8px 30px rgba(0,0,0,0.3)" }}
      >
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-2">
          <div className="h-[3px] w-9 rounded-full bg-border/80" />
        </div>

        {title && (
          <div className="px-5 pb-3 pt-1">
            <h3 className="font-display text-lg tracking-wide text-text">
              {title}
            </h3>
          </div>
        )}

        <div className="px-5 pb-8">{children}</div>
      </div>
    </div>
  );
}
