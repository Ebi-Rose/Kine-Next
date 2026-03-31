"use client";

import type { ReactNode } from "react";

export type Panel =
  | "overview"
  | "personal"
  | "training"
  | "health"
  | "session"
  | "lifts"
  | "subscription"
  | "settings"
  | "privacy";

export function BackButton({ onClick }: { onClick: () => void }) {
  return (
    <button onClick={onClick} className="text-xs text-accent hover:underline">
      ← Back
    </button>
  );
}

export function NavCard({ label, subtitle, onClick }: { label: string; subtitle: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center justify-between rounded-[10px] border border-border bg-surface p-4 mb-1.5 text-left hover:border-border-active transition-all"
    >
      <div className="min-w-0">
        <p className="text-sm font-medium text-text">{label}</p>
        {subtitle && <p className="text-[10px] text-muted2 mt-0.5 truncate">{subtitle}</p>}
      </div>
      <span className="text-muted2 text-xs shrink-0 ml-2">▸</span>
    </button>
  );
}

export function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between py-1">
      <span className="text-xs text-muted2">{label}</span>
      <span className="text-xs text-text">{value}</span>
    </div>
  );
}

export function Input({ label, value, onChange, type = "text" }: { label: string; value: string; onChange: (v: string) => void; type?: string }) {
  return (
    <div>
      <label className="text-xs text-muted">{label}</label>
      <input
        type={type}
        value={value || ""}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 w-full rounded-lg border border-border bg-bg px-3 py-2 text-sm text-text outline-none focus:border-accent"
      />
    </div>
  );
}

export function EditableRow({ label, value, isEditing, onEdit, children }: {
  label: string; value: string; isEditing: boolean; onEdit: () => void; children: ReactNode;
}) {
  return (
    <div className="rounded-[var(--radius-default)] border border-border bg-surface p-4 mt-2">
      <div className="flex items-center justify-between">
        <div>
          <span className="text-xs text-muted">{label}</span>
          {!isEditing && <p className="text-xs text-text mt-0.5">{value}</p>}
        </div>
        {!isEditing && (
          <button onClick={onEdit} className="text-[10px] text-accent hover:underline">Edit</button>
        )}
      </div>
      {isEditing && <div className="mt-3">{children}</div>}
    </div>
  );
}
