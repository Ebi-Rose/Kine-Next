"use client";

import { useEffect, useRef, useCallback, useId } from "react";

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
  const handleRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<Element | null>(null);
  const titleId = useId();
  const dragState = useRef<{ startY: number; startTime: number; currentY: number; dragging: boolean }>({
    startY: 0, startTime: 0, currentY: 0, dragging: false,
  });

  useEffect(() => {
    if (open) {
      triggerRef.current = document.activeElement;
      document.body.style.overflow = "hidden";
      // Move focus into sheet
      requestAnimationFrame(() => sheetRef.current?.focus());
    } else {
      document.body.style.overflow = "";
      // Restore focus to trigger
      if (triggerRef.current instanceof HTMLElement) {
        triggerRef.current.focus();
      }
    }
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  // Close on Escape + focus trap
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") { onClose(); return; }
      if (e.key === "Tab" && sheetRef.current) {
        const focusable = sheetRef.current.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
        );
        if (focusable.length === 0) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, onClose]);

  // Swipe-to-dismiss
  const onPointerDown = useCallback((e: React.PointerEvent) => {
    if (!sheetRef.current) return;
    dragState.current = {
      startY: e.clientY,
      startTime: Date.now(),
      currentY: 0,
      dragging: true,
    };
    sheetRef.current.style.transition = "none";
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    e.preventDefault();
  }, []);

  const onPointerMove = useCallback((e: React.PointerEvent) => {
    if (!dragState.current.dragging || !sheetRef.current) return;
    const deltaY = Math.max(0, e.clientY - dragState.current.startY);
    dragState.current.currentY = deltaY;
    sheetRef.current.style.transform = `translateY(${deltaY}px)`;
  }, []);

  const onPointerEnd = useCallback(() => {
    const { dragging, currentY, startTime } = dragState.current;
    if (!dragging || !sheetRef.current) return;
    dragState.current.dragging = false;

    const elapsed = Date.now() - startTime;
    const velocity = currentY / elapsed; // px/ms

    // Restore transition for animation
    sheetRef.current.style.transition = "";

    if (currentY > 80 || velocity > 0.5) {
      // Dismiss
      sheetRef.current.style.transform = "translateY(100%)";
      setTimeout(() => {
        if (sheetRef.current) sheetRef.current.style.transform = "";
        onClose();
      }, 300);
    } else {
      // Snap back
      sheetRef.current.style.transform = "translateY(0)";
    }
  }, [onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100]" role="dialog" aria-modal="true" aria-labelledby={title ? titleId : undefined} aria-label={!title ? "Dialog" : undefined}>
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-[6px] animate-fade-in"
        role="presentation"
        onClick={onClose}
      />

      {/* Sheet */}
      <div
        ref={sheetRef}
        className="absolute bottom-0 left-0 right-0 max-h-[85vh] overflow-y-auto rounded-t-2xl border-t border-border/50 bg-surface animate-slide-up"
        style={{ boxShadow: "0 -8px 30px rgba(0,0,0,0.3)", transition: "transform 0.35s cubic-bezier(0.32, 0.72, 0, 1)" }}
        tabIndex={-1}
      >
        {/* Handle — swipe target */}
        <div
          ref={handleRef}
          className="flex justify-center pt-3 pb-2 cursor-grab active:cursor-grabbing"
          style={{ touchAction: "none" }}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerEnd}
          onPointerCancel={onPointerEnd}
        >
          <div className="h-[3px] w-9 rounded-full bg-border/80" />
        </div>

        {title && (
          <div className="px-6 pb-3 pt-1">
            <h3 id={titleId} className="font-display text-lg tracking-wide text-text">
              {title}
            </h3>
          </div>
        )}

        <div className="px-6 pb-8">{children}</div>
      </div>
    </div>
  );
}
