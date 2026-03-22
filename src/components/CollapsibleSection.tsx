"use client";

import { useState } from "react";

interface CollapsibleSectionProps {
  title: string;
  description: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}

export default function CollapsibleSection({
  title,
  description,
  defaultOpen = false,
  children,
}: CollapsibleSectionProps) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="border-b border-border pb-0.5 mb-1.5">
      <button
        className="flex w-full items-center gap-2.5 py-3.5 text-left active:opacity-70 select-none"
        onClick={() => setOpen(!open)}
      >
        <div className="flex-1 min-w-0">
          <div className="text-[13px] font-medium text-text leading-tight mb-0.5">
            {title}
          </div>
          <div className="text-[11px] text-muted font-light leading-tight">
            {description}
          </div>
        </div>
        <span
          className={`text-[9px] text-muted shrink-0 transition-transform duration-200 ${
            open ? "rotate-180" : ""
          }`}
        >
          ▼
        </span>
      </button>
      {open && <div className="pb-3.5">{children}</div>}
    </div>
  );
}
