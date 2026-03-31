"use client";

import { useState } from "react";
import { useKineStore } from "@/store/useKineStore";
import Button from "@/components/Button";
import { toast } from "@/components/Toast";
import {
  GOAL_OPTIONS,
  EXP_OPTIONS,
  ALL_EQUIPMENT,
  EQUIP_LABELS,
  DURATION_OPTIONS,
  DAY_LABELS,
} from "@/data/constants";
import { BackButton, EditableRow } from "./_helpers";

export default function TrainingPanel({ onBack }: { onBack: () => void }) {
  const store = useKineStore();
  const { goal, exp, equip, trainingDays, duration, setGoal, setExp, setEquip, setTrainingDays, setDays, setDuration, setWeekData } = store;
  const [editing, setEditing] = useState<string | null>(null);

  function saveAndClearWeek() {
    setWeekData(null);
    setEditing(null);
    toast("Settings updated — rebuild your week to apply", "success");
  }

  return (
    <div className="mt-4">
      <BackButton onClick={onBack} />
      <h2 className="mt-4 text-xs tracking-wider text-muted uppercase">Training</h2>

      <EditableRow label="Goal" value={GOAL_OPTIONS.find((g) => g.value === goal)?.label || "—"} isEditing={editing === "goal"} onEdit={() => setEditing("goal")}>
        <div className="flex flex-col gap-2">
          {GOAL_OPTIONS.map((opt) => (
            <button key={opt.value} onClick={() => { setGoal(opt.value as typeof goal); saveAndClearWeek(); }}
              className={`rounded-lg border px-3 py-2 text-left text-xs transition-all ${goal === opt.value ? "border-accent bg-accent-dim text-text" : "border-border text-muted2 hover:border-border-active"}`}>
              {opt.label}
            </button>
          ))}
        </div>
      </EditableRow>

      <EditableRow label="Experience" value={EXP_OPTIONS.find((e) => e.value === exp)?.label || "—"} isEditing={editing === "exp"} onEdit={() => setEditing("exp")}>
        <div className="flex flex-col gap-2">
          {EXP_OPTIONS.map((opt) => (
            <button key={opt.value} onClick={() => { setExp(opt.value as typeof exp); saveAndClearWeek(); }}
              className={`rounded-lg border px-3 py-2 text-left text-xs transition-all ${exp === opt.value ? "border-accent bg-accent-dim text-text" : "border-border text-muted2 hover:border-border-active"}`}>
              {opt.label}
            </button>
          ))}
        </div>
      </EditableRow>

      <EditableRow label="Equipment" value={equip.map((e) => EQUIP_LABELS[e] || e).join(", ") || "—"} isEditing={editing === "equip"} onEdit={() => setEditing("equip")}>
        <div className="grid grid-cols-2 gap-2">
          {ALL_EQUIPMENT.map((val) => (
            <button key={val} onClick={() => {
              const newEquip = equip.includes(val) ? equip.filter((e) => e !== val) : [...equip, val];
              setEquip(newEquip);
            }}
              className={`rounded-lg border px-3 py-2 text-xs transition-all ${equip.includes(val) ? "border-accent bg-accent-dim text-text" : "border-border text-muted2 hover:border-border-active"}`}>
              {EQUIP_LABELS[val]}
            </button>
          ))}
        </div>
        <Button size="sm" className="mt-3 w-full" onClick={saveAndClearWeek}>Save equipment</Button>
      </EditableRow>

      <EditableRow label="Training days" value={trainingDays.map((d) => DAY_LABELS[d]).join(", ") || "—"} isEditing={editing === "days"} onEdit={() => setEditing("days")}>
        <div className="flex gap-2">
          {DAY_LABELS.map((label, i) => (
            <button key={i} onClick={() => {
              let newDays: number[];
              if (trainingDays.includes(i)) newDays = trainingDays.filter((d) => d !== i);
              else newDays = [...trainingDays, i].sort();
              setTrainingDays(newDays);
              setDays(String(newDays.length));
            }}
              className={`flex h-9 w-9 items-center justify-center rounded-full text-xs font-medium transition-all ${
                trainingDays.includes(i) ? "bg-accent text-bg" : "bg-surface2 text-muted2 hover:text-text"
              }`}>
              {label.slice(0, 2)}
            </button>
          ))}
        </div>
        <Button size="sm" className="mt-3 w-full" onClick={saveAndClearWeek}>Save days</Button>
      </EditableRow>

      <EditableRow label="Session length" value={DURATION_OPTIONS.find((d) => d.value === duration)?.label || "—"} isEditing={editing === "duration"} onEdit={() => setEditing("duration")}>
        <div className="grid grid-cols-2 gap-2">
          {DURATION_OPTIONS.map((opt) => (
            <button key={opt.value} onClick={() => { setDuration(opt.value as typeof duration); saveAndClearWeek(); }}
              className={`rounded-lg border px-3 py-2 text-xs transition-all ${duration === opt.value ? "border-accent bg-accent-dim text-text" : "border-border text-muted2 hover:border-border-active"}`}>
              {opt.label}
            </button>
          ))}
        </div>
      </EditableRow>

      {/* Per-day durations */}
      {trainingDays.length > 0 && (
        <EditableRow label="Per-day durations" value={trainingDays.map(d => `${DAY_LABELS[d]}: ${store.dayDurations[d] || "default"}`).join(", ")} isEditing={editing === "dayDurations"} onEdit={() => setEditing("dayDurations")}>
          <div className="flex flex-col gap-2">
            {trainingDays.map((dow) => (
              <div key={dow} className="flex items-center justify-between">
                <span className="text-xs text-text">{DAY_LABELS[dow]}</span>
                <select
                  value={store.dayDurations[dow] || ""}
                  onChange={(e) => {
                    const val = parseInt(e.target.value);
                    store.setDayDurations({ ...store.dayDurations, [dow]: val || undefined } as Record<number, number>);
                  }}
                  className="rounded border border-border bg-bg px-2 py-1 text-xs text-text outline-none"
                >
                  <option value="">Default</option>
                  <option value="30">30 min</option>
                  <option value="40">40 min</option>
                  <option value="45">45 min</option>
                  <option value="50">50 min</option>
                  <option value="60">60 min</option>
                  <option value="75">75 min</option>
                  <option value="90">90 min</option>
                </select>
              </div>
            ))}
          </div>
          <Button size="sm" className="mt-3 w-full" onClick={saveAndClearWeek}>Save durations</Button>
        </EditableRow>
      )}

      <p className="text-[10px] text-muted text-center mt-4">
        Changing these settings will prompt a week rebuild.
      </p>
    </div>
  );
}
