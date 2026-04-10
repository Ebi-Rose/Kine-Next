"use client";

import { useState } from "react";
import { useKineStore } from "@/store/useKineStore";
import type { OutsideActivity } from "@/store/useKineStore";
import Button from "@/components/Button";
import {
  GOAL_OPTIONS,
  EXP_OPTIONS,
  ALL_EQUIPMENT,
  EQUIP_LABELS,
  EQUIP_PRESETS,
  DURATION_OPTIONS,
  DAY_LABELS,
  OUTSIDE_ACTIVITY_OPTIONS,
} from "@/data/constants";
import { BackButton, EditableRow } from "./_helpers";
import RebuildBanner from "@/components/RebuildBanner";

export default function TrainingPanel({ onBack }: { onBack: () => void }) {
  const store = useKineStore();
  const { goal, exp, equip, trainingDays, duration, setGoal, setExp, setEquip, setTrainingDays, setDays, setDuration, outsideActivities, setOutsideActivities, outsideActivityNotes, setOutsideActivityNotes, outsideActivityFocus, setOutsideActivityFocus } = store;
  const [editing, setEditing] = useState<string | null>(null);
  const [rebuildOpen, setRebuildOpen] = useState(false);
  const [lastChange, setLastChange] = useState<string | undefined>(undefined);

  // Match equipment to a preset for display
  const matchedPreset = EQUIP_PRESETS.find(
    (p) => p.equip.length === equip.length && p.equip.every((e) => equip.includes(e))
  );
  const equipDisplay = matchedPreset
    ? matchedPreset.label
    : equip.map((e) => EQUIP_LABELS[e] || e).join(", ") || "—";

  function onSettingChanged(label?: string) {
    setEditing(null);
    if (label) setLastChange(label);
    setRebuildOpen(true);
  }

  return (
    <div className="mt-4">
      <BackButton onClick={onBack} />
      <h2 className="mt-4 text-xs tracking-wider text-muted uppercase">Training</h2>

      <EditableRow label="Goal" value={GOAL_OPTIONS.find((g) => g.value === goal)?.label || "—"} isEditing={editing === "goal"} onEdit={() => setEditing("goal")}>
        <div className="flex flex-col gap-2">
          {GOAL_OPTIONS.map((opt) => (
            <button key={opt.value} onClick={() => { setGoal(opt.value as typeof goal); onSettingChanged("Goal"); }}
              className={`rounded-lg border px-3 py-2 text-left text-xs transition-all ${goal === opt.value ? "border-accent bg-accent-dim text-text" : "border-border text-muted2 hover:border-border-active"}`}>
              {opt.label}
            </button>
          ))}
        </div>
      </EditableRow>

      <EditableRow label="Experience" value={EXP_OPTIONS.find((e) => e.value === exp)?.label || "—"} isEditing={editing === "exp"} onEdit={() => setEditing("exp")}>
        <div className="flex flex-col gap-2">
          {EXP_OPTIONS.map((opt) => (
            <button key={opt.value} onClick={() => { setExp(opt.value as typeof exp); onSettingChanged("Experience"); }}
              className={`rounded-lg border px-3 py-2 text-left text-xs transition-all ${exp === opt.value ? "border-accent bg-accent-dim text-text" : "border-border text-muted2 hover:border-border-active"}`}>
              {opt.label}
            </button>
          ))}
        </div>
      </EditableRow>

      <EditableRow label="Equipment" value={equipDisplay} isEditing={editing === "equip"} onEdit={() => setEditing("equip")}>
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
        <Button size="sm" className="mt-3 w-full" onClick={() => onSettingChanged("Equipment")}>Save equipment</Button>
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
        <Button size="sm" className="mt-3 w-full" onClick={() => onSettingChanged("Training days")}>Save days</Button>
      </EditableRow>

      <EditableRow label="Session length" value={DURATION_OPTIONS.find((d) => d.value === duration)?.label || "—"} isEditing={editing === "duration"} onEdit={() => setEditing("duration")}>
        <div className="grid grid-cols-2 gap-2">
          {DURATION_OPTIONS.map((opt) => (
            <button key={opt.value} onClick={() => { setDuration(opt.value as typeof duration); onSettingChanged("Session length"); }}
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
          <Button size="sm" className="mt-3 w-full" onClick={() => onSettingChanged("Per-day durations")}>Save durations</Button>
        </EditableRow>
      )}

      {/* Outside activities */}
      <div className="mt-4 rounded-[10px] border border-border bg-surface p-4">
        <p className="text-[10px] tracking-[0.15em] uppercase text-muted mb-3">Outside activities</p>
        <div className="flex flex-wrap gap-1.5">
          {OUTSIDE_ACTIVITY_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => {
                const activity = opt.value as OutsideActivity;
                if (outsideActivities.includes(activity)) {
                  setOutsideActivities(outsideActivities.filter((a) => a !== activity));
                  if (outsideActivityFocus === activity) setOutsideActivityFocus(null);
                } else {
                  setOutsideActivities([...outsideActivities, activity]);
                }
                onSettingChanged("Outside activities");
              }}
              className={`rounded-full border px-3 py-1 text-[10px] transition-all ${
                outsideActivities.includes(opt.value as OutsideActivity)
                  ? "border-accent bg-accent-dim text-text"
                  : "border-dashed border-border text-muted2 hover:border-border-active"
              }`}
            >
              {outsideActivities.includes(opt.value as OutsideActivity) ? opt.label : `+ ${opt.label}`}
            </button>
          ))}
        </div>

        {outsideActivities.length > 0 && (
          <div className="mt-3 pt-3 border-t border-border/50">
            <p className="text-[10px] text-muted mb-2">Main focus</p>
            <div className="flex flex-wrap gap-1.5">
              {outsideActivities.map((activity) => {
                const label = OUTSIDE_ACTIVITY_OPTIONS.find((o) => o.value === activity)?.label ?? activity;
                return (
                  <button
                    key={activity}
                    onClick={() => { setOutsideActivityFocus(outsideActivityFocus === activity ? null : activity); }}
                    className={`rounded-full border px-3 py-1 text-[10px] transition-all ${
                      outsideActivityFocus === activity
                        ? "border-accent bg-accent-dim text-text"
                        : "border-border text-muted2 hover:border-border-active"
                    }`}
                  >
                    {label}
                  </button>
                );
              })}
              <button
                onClick={() => setOutsideActivityFocus(null)}
                className={`rounded-full border px-3 py-1 text-[10px] transition-all ${
                  outsideActivityFocus === null
                    ? "border-accent bg-accent-dim text-text"
                    : "border-border text-muted2 hover:border-border-active"
                }`}
              >
                Gym is my main focus
              </button>
            </div>
          </div>
        )}

        {outsideActivities.length > 0 && (
          <div className="mt-3">
            <label className="text-[10px] text-muted">Notes</label>
            <textarea
              value={outsideActivityNotes}
              onChange={(e) => setOutsideActivityNotes(e.target.value)}
              placeholder="E.g. 'half marathon in September', 'football twice a week'…"
              rows={2}
              className="mt-1 w-full rounded-lg border border-border bg-bg px-3 py-2 text-xs text-text placeholder:text-muted outline-none focus:border-accent resize-none"
            />
          </div>
        )}

        <p className="text-[10px] text-muted mt-3 font-light">
          Kinē adjusts load and adds muscle work that supports what you do outside the gym.
        </p>
      </div>

      <p className="text-[10px] text-muted text-center mt-4">
        Changes won&apos;t affect past sessions.
      </p>

      <RebuildBanner
        open={rebuildOpen}
        onResolve={() => setRebuildOpen(false)}
        changeLabel={lastChange}
      />
    </div>
  );
}
