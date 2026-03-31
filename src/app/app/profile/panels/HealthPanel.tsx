"use client";

import { useState } from "react";
import { useKineStore } from "@/store/useKineStore";
import type { CycleType, PeriodLog } from "@/store/useKineStore";
import { getCurrentPhase } from "@/lib/cycle";
import Button from "@/components/Button";
import BottomSheet from "@/components/BottomSheet";
import { toast } from "@/components/Toast";
import { CYCLE_OPTIONS, INJURY_OPTIONS, CONDITION_OPTIONS } from "@/data/constants";
import { BackButton } from "./_helpers";

const CONDITION_COMFORT_MAP: Record<string, string[]> = {
  fibroids: ["impactSensitive"],
  endometriosis: ["impactSensitive"],
  pelvic_floor: ["proneSensitive"],
};

const INJURY_PROTECTIONS: Record<string, string[]> = {
  shoulder: ["Pendulum swing warmups before sessions", "Overhead press alternatives when needed"],
  knees: ["Terminal knee extension warmups", "Knee-friendly squat modifications"],
  lower_back: ["Supine knee hugs and pelvic tilt warmups", "Spinal compression exercise swaps", "Reduced deadlift loading"],
  hip: ["90/90 hip stretch warmups", "Hip-friendly movement alternatives"],
  wrist: ["Wrist circle and prayer stretch warmups", "Grip-modified exercises"],
  ankle: ["Ankle circle and calf raise warmups", "Ankle mobility accommodations"],
  neck: ["Upper back mobilisation warmups"],
  postpartum: ["Core pressure management", "Gradual load progression"],
  chronic_pain: ["Load autoregulation", "Recovery-first programming"],
  limited_mobility: ["Range-of-motion adapted exercises"],
};

const COMFORT_LABELS: Record<string, string> = {
  impactSensitive: "Impact-sensitive exercises avoided",
  proneSensitive: "Prone-position exercises avoided",
};

export default function HealthPanel({ onBack }: { onBack: () => void }) {
  const { cycleType, setCycleType, cycle, setCycle, injuries, setInjuries, injuryNotes, setInjuryNotes, conditions, setConditions, comfortFlags, setWeekData } = useKineStore();
  const [newDate, setNewDate] = useState("");
  const [editingSection, setEditingSection] = useState<string | null>(null);
  const [conditionWarning, setConditionWarning] = useState<string | null>(null);
  const [injuryWarning, setInjuryWarning] = useState<string | null>(null);

  const phase = cycleType === "regular" ? getCurrentPhase(cycle.periodLog, cycle.avgLength) : null;

  function logPeriod() {
    if (!newDate) return;
    const newLog: PeriodLog = { date: newDate, type: "start" };
    setCycle({ ...cycle, periodLog: [...cycle.periodLog, newLog] });
    setNewDate("");
    toast("Period logged", "success");
  }

  function saveHealthAndClearWeek() {
    setWeekData(null);
    setEditingSection(null);
    toast("Updated — rebuild your week to apply", "success");
  }

  function handleConditionToggle(value: string) {
    if (conditions.includes(value)) {
      const affectedFlags = CONDITION_COMFORT_MAP[value];
      if (affectedFlags && affectedFlags.length > 0) {
        setConditionWarning(value);
        return;
      }
      setConditions(conditions.filter((c) => c !== value));
      saveHealthAndClearWeek();
    } else {
      setConditions([...conditions, value]);
      saveHealthAndClearWeek();
    }
  }

  function confirmConditionRemoval() {
    if (!conditionWarning) return;
    setConditions(conditions.filter((c) => c !== conditionWarning));
    setConditionWarning(null);
    saveHealthAndClearWeek();
  }

  function handleInjuryToggle(value: string) {
    if (injuries.includes(value)) {
      setInjuryWarning(value);
    } else {
      setInjuries([...injuries, value]);
      saveHealthAndClearWeek();
    }
  }

  function confirmInjuryRemoval() {
    if (!injuryWarning) return;
    setInjuries(injuries.filter((i) => i !== injuryWarning));
    setInjuryWarning(null);
    saveHealthAndClearWeek();
  }

  return (
    <div className="mt-4">
      <BackButton onClick={onBack} />
      <h2 className="mt-4 text-xs tracking-wider text-muted uppercase">Health</h2>

      {/* Cycle section */}
      <div className="mt-4 rounded-[10px] border border-border bg-surface p-4">
        <p className="text-[10px] tracking-[0.15em] uppercase text-muted mb-3">Cycle</p>

        <div className="flex items-center justify-between mb-2">
          <span className="text-xs text-muted2">Type</span>
          <button onClick={() => setEditingSection(editingSection === "cycleType" ? null : "cycleType")}
            className="text-xs text-text hover:text-accent transition-colors">
            {CYCLE_OPTIONS.find((c) => c.value === cycleType)?.label || "Not set"} <span className="text-muted text-[10px]">▸</span>
          </button>
        </div>

        {editingSection === "cycleType" && (
          <div className="flex flex-col gap-2 mb-3">
            {CYCLE_OPTIONS.map((opt) => (
              <button key={opt.value}
                onClick={() => { setCycleType(opt.value as CycleType); setEditingSection(null); toast(`Cycle: ${opt.label}`, "success"); }}
                className={`rounded-lg border px-3 py-2 text-left text-xs transition-all ${
                  cycleType === opt.value ? "border-accent bg-accent-dim text-text" : "border-border text-muted2 hover:border-border-active"
                }`}>
                {opt.label}
              </button>
            ))}
          </div>
        )}

        {phase && (
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-muted2">Current phase</span>
            <span className="text-xs text-[#8aba9a]">{phase.label} · Day {phase.day}</span>
          </div>
        )}

        {cycleType === "regular" && (
          <div className="flex items-center justify-between pt-2 border-t border-border/50">
            <span className="text-xs text-muted2">Log period</span>
            <div className="flex gap-2 items-center">
              <input type="date" value={newDate} onChange={(e) => setNewDate(e.target.value)}
                className="rounded border border-border bg-bg px-2 py-1 text-xs text-text outline-none focus:border-accent w-32" />
              <button onClick={logPeriod} disabled={!newDate}
                className="text-xs text-accent hover:underline disabled:opacity-30">Log</button>
            </div>
          </div>
        )}

        {cycle.periodLog.length > 0 && editingSection === "cycleHistory" && (
          <div className="mt-3 flex flex-col gap-1">
            {cycle.periodLog.slice(-8).reverse().map((log, i) => (
              <div key={i} className="flex items-center justify-between text-[10px]">
                <span className="text-muted2">{log.date}</span>
                <span className="text-muted">Period {log.type}</span>
              </div>
            ))}
          </div>
        )}
        {cycle.periodLog.length > 0 && (
          <button onClick={() => setEditingSection(editingSection === "cycleHistory" ? null : "cycleHistory")}
            className="mt-2 text-[10px] text-accent hover:underline">
            {editingSection === "cycleHistory" ? "Hide history" : `History (${cycle.periodLog.length} entries)`}
          </button>
        )}
      </div>

      {/* Conditions */}
      <div className="mt-3 rounded-[10px] border border-border bg-surface p-4">
        <p className="text-[10px] tracking-[0.15em] uppercase text-muted mb-3">Conditions</p>
        <div className="flex flex-wrap gap-1.5">
          {CONDITION_OPTIONS.map((opt) => (
            <button key={opt.value}
              onClick={() => handleConditionToggle(opt.value)}
              aria-pressed={conditions.includes(opt.value)}
              aria-label={`Condition: ${opt.label}`}
              className={`rounded-full border px-3 py-1 text-[10px] transition-all ${
                conditions.includes(opt.value)
                  ? "border-accent bg-accent-dim text-text"
                  : "border-dashed border-border text-muted2 hover:border-border-active"
              }`}>
              {conditions.includes(opt.value) ? opt.label : `+ ${opt.label}`}
            </button>
          ))}
        </div>
        {conditionWarning && (
          <div role="alert" className="mt-2.5 rounded-lg border border-[rgba(196,168,114,0.2)] bg-[rgba(196,168,114,0.08)] px-3 py-2.5">
            <p className="text-[10px] text-[#c4a872] leading-relaxed">
              <strong>This changes your comfort filters.</strong> Removing &ldquo;{CONDITION_OPTIONS.find((c) => c.value === conditionWarning)?.label}&rdquo; will turn off{" "}
              <em>{(CONDITION_COMFORT_MAP[conditionWarning] || []).join(", ")}</em> comfort adjustments. Your warmups and exercise selection may include movements that were previously filtered.
            </p>
            <div className="mt-2 flex gap-2">
              <button onClick={() => setConditionWarning(null)}
                className="rounded-lg border border-[rgba(196,144,152,0.3)] bg-accent-dim px-3 py-1.5 text-[10px] font-medium text-accent">Keep active</button>
              <button onClick={confirmConditionRemoval}
                className="rounded-lg border border-border px-3 py-1.5 text-[10px] text-muted2">Remove</button>
            </div>
          </div>
        )}
        <p className="text-[10px] text-muted mt-3 font-light">
          Conditions silently adapt your programme. They never appear in session copy.
        </p>
      </div>

      {/* Injuries */}
      <div className="mt-3 rounded-[10px] border border-border bg-surface p-4">
        <p className="text-[10px] tracking-[0.15em] uppercase text-muted mb-3">Injuries</p>
        <div className="flex flex-wrap gap-1.5">
          {INJURY_OPTIONS.map((opt) => (
            <button key={opt.value}
              onClick={() => handleInjuryToggle(opt.value)}
              aria-pressed={injuries.includes(opt.value)}
              aria-label={`Injury: ${opt.label}`}
              className={`rounded-full border px-3 py-1 text-[10px] transition-all ${
                injuries.includes(opt.value)
                  ? "border-[#c4a872] bg-[rgba(138,122,90,0.15)] text-text"
                  : "border-dashed border-border text-muted2 hover:border-border-active"
              }`}>
              {injuries.includes(opt.value) ? opt.label : `+ ${opt.label}`}
            </button>
          ))}
        </div>

        <div className="mt-3">
          <label className="text-[10px] text-muted">Notes</label>
          <textarea
            value={injuryNotes}
            onChange={(e) => setInjuryNotes(e.target.value)}
            placeholder="Optional — anything your programme should account for"
            rows={2}
            className="mt-1 w-full rounded-lg border border-border bg-bg px-3 py-2 text-xs text-text placeholder:text-muted outline-none focus:border-accent resize-none"
          />
        </div>
      </div>

      {/* Injury removal bottom sheet */}
      {injuryWarning && (
        <BottomSheet open={true} onClose={() => setInjuryWarning(null)} title={`Remove "${INJURY_OPTIONS.find((i) => i.value === injuryWarning)?.label}"?`}>
          <div>
            <p className="text-xs text-muted2 leading-relaxed mb-3">
              While this injury was active, Kine:
            </p>
            <ul className="flex flex-col gap-1.5 mb-4">
              {(INJURY_PROTECTIONS[injuryWarning] || ["Adapted your warmups and exercise selection"]).map((protection, i) => (
                <li key={i} className="text-xs text-muted2 flex items-start gap-2">
                  <span className="text-[#c4a872] mt-0.5">•</span>
                  <span>{protection}</span>
                </li>
              ))}
            </ul>
            <p className="text-xs text-muted2 leading-relaxed mb-4">
              If it&apos;s fully resolved, great — remove it. If you&apos;re still managing it, keep it active.
            </p>
            <div className="flex gap-2">
              <Button variant="secondary" size="sm" className="flex-1" onClick={() => setInjuryWarning(null)}>Keep active</Button>
              <Button variant="ghost" size="sm" className="flex-1 text-muted" onClick={confirmInjuryRemoval}>It&apos;s resolved</Button>
            </div>
          </div>
        </BottomSheet>
      )}

      {/* Comfort flags (read-only, derived from conditions) */}
      {comfortFlags.length > 0 && (
        <div className="mt-3 rounded-[10px] border border-border bg-surface p-4">
          <p className="text-[10px] tracking-[0.15em] uppercase text-muted mb-3">Active comfort adjustments</p>
          <div className="flex flex-col gap-2">
            {comfortFlags.map((flag) => (
              <div key={flag} className="flex items-center gap-2">
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#c4a872]" />
                <span className="text-xs text-muted2 font-light">{COMFORT_LABELS[flag] || flag}</span>
              </div>
            ))}
          </div>
          <p className="text-[10px] text-muted mt-3 font-light">
            These are automatically applied based on your conditions. Exercises that conflict are swapped out.
          </p>
        </div>
      )}
    </div>
  );
}
