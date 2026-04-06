// ── Shared primitives for Progress page cards ──
//
// Tiny presentational helpers reused across the personalization cards.
// All cards on the Progress page share the same surface treatment, so we
// centralise the shell, eyebrow, and stat-number styles here.

import type { ReactNode } from "react";

export function Card({
  children,
  accent = false,
  className = "",
}: {
  children: ReactNode;
  accent?: boolean;
  className?: string;
}) {
  const base =
    "rounded-[var(--radius-default)] border p-4 mb-2.5";
  const tone = accent
    ? "border-[rgba(196,144,152,0.25)] bg-gradient-to-br from-[rgba(196,144,152,0.08)] to-transparent"
    : "border-border bg-surface";
  return <div className={`${base} ${tone} ${className}`}>{children}</div>;
}

export function GhostCard({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div className={`rounded-[var(--radius-default)] border border-dashed border-border bg-transparent p-4 mb-2.5 text-center ${className}`}>
      {children}
    </div>
  );
}

export function Eyebrow({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <p className={`text-[9px] tracking-[1.5px] uppercase text-muted mb-1.5 font-light ${className}`}>
      {children}
    </p>
  );
}

export function StatNumber({
  children,
  size = "md",
  tone = "default",
  className = "",
}: {
  children: ReactNode;
  size?: "sm" | "md" | "lg";
  tone?: "default" | "accent" | "up";
  className?: string;
}) {
  const sizeClass = size === "lg" ? "text-3xl" : size === "sm" ? "text-lg" : "text-2xl";
  const toneClass =
    tone === "accent"
      ? "text-accent"
      : tone === "up"
        ? "text-[#8ba88b]"
        : "text-text";
  return (
    <p className={`font-display italic ${sizeClass} leading-none ${toneClass} ${className}`}>
      {children}
    </p>
  );
}

export function Tiny({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <p className={`text-[10px] text-muted font-light ${className}`}>{children}</p>;
}

export function CardSubtitle({ children }: { children: ReactNode }) {
  return <p className="text-xs text-muted2 font-light">{children}</p>;
}

/** Single-line "lift row" used across top-lifts, rehab work, etc. */
export function LiftRow({
  name,
  meta,
  value,
  valueTone = "default",
  isLast = false,
}: {
  name: ReactNode;
  meta?: ReactNode;
  value: ReactNode;
  valueTone?: "default" | "accent" | "up";
  isLast?: boolean;
}) {
  const toneClass =
    valueTone === "accent" ? "text-accent" : valueTone === "up" ? "text-[#8ba88b]" : "text-text";
  return (
    <div className={`flex items-center justify-between py-2.5 ${isLast ? "" : "border-b border-border"}`}>
      <div className="min-w-0 flex-1">
        <div className="text-[13px] text-text">{name}</div>
        {meta && <div className="text-[10px] text-muted">{meta}</div>}
      </div>
      <div className={`font-display italic text-base ${toneClass}`}>{value}</div>
    </div>
  );
}
