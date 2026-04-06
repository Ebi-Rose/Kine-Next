// ── Progress page tab strip ──
//
// Pill-style segmented control. Tab labels come from the engine because
// they adapt — Strength becomes "Training" and Body becomes "Rehab" when
// the user has an active injury.

import type { TabConfig } from "@/lib/progress-engine";

export default function ProgressTabs({
  tabs,
  active,
  onChange,
}: {
  tabs: TabConfig[];
  active: TabConfig["id"];
  onChange: (id: TabConfig["id"]) => void;
}) {
  return (
    <div
      role="tablist"
      aria-label="Progress sections"
      className="my-3 flex gap-1 rounded-full border border-border bg-[var(--color-bg)] p-1"
    >
      {tabs.map((tab) => {
        const isOn = tab.id === active;
        return (
          <button
            key={tab.id}
            role="tab"
            aria-selected={isOn}
            onClick={() => onChange(tab.id)}
            className={`flex-1 rounded-full px-3 py-1.5 text-[11px] transition-colors ${
              isOn
                ? "bg-accent font-medium text-[#1a1310]"
                : "text-muted2 hover:text-text"
            }`}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}
