"use client";

import { useState, useEffect } from "react";
import { useKineStore } from "@/store/useKineStore";
import type { EduMode, CycleType, PeriodLog, SessionMode } from "@/store/useKineStore";
import { signOut, getSubscriptionStatus, getUser } from "@/lib/auth";
import { weightUnit, formatCurrency, formatDateWithYear, formatDateShortLocale, detectCurrency, PRICE_TABLE, type SupportedCurrency } from "@/lib/format";
import { getCurrentPhase } from "@/lib/cycle";
import { syncNow } from "@/lib/sync";
import Button from "@/components/Button";
import BottomSheet from "@/components/BottomSheet";
import Tile from "@/components/Tile";
import { toast } from "@/components/Toast";
import {
  GOAL_OPTIONS,
  EXP_OPTIONS,
  ALL_EQUIPMENT,
  EQUIP_LABELS,
  DURATION_OPTIONS,
  DAY_LABELS,
  CYCLE_OPTIONS,
  INJURY_OPTIONS,
  CONDITION_OPTIONS,
} from "@/data/constants";

type Panel = "overview" | "personal" | "training" | "health" | "session" | "lifts" | "subscription" | "settings" | "privacy";

export default function ProfilePage() {
  const [panel, setPanel] = useState<Panel>("overview");

  return (
    <div>
      <h1 className="font-display text-3xl tracking-wide text-accent">Profile</h1>

      {panel === "overview" && <OverviewPanel onNavigate={setPanel} />}
      {panel === "personal" && <PersonalPanel onBack={() => setPanel("overview")} />}
      {panel === "training" && <TrainingPanel onBack={() => setPanel("overview")} />}
      {panel === "health" && <HealthPanel onBack={() => setPanel("overview")} />}
      {panel === "session" && <SessionPreferencesPanel onBack={() => setPanel("overview")} />}
      {panel === "lifts" && <LiftsPanel onBack={() => setPanel("overview")} />}
      {panel === "subscription" && <SubscriptionPanel onBack={() => setPanel("overview")} />}
      {panel === "settings" && <SettingsPanel onBack={() => setPanel("overview")} />}
      {panel === "privacy" && <PrivacyPanel onBack={() => setPanel("overview")} />}
    </div>
  );
}

// ── Overview Panel ──

function OverviewPanel({ onNavigate }: { onNavigate: (p: Panel) => void }) {
  const store = useKineStore();
  const { personalProfile, progressDB, cycleType, cycle, goal, equip, eduMode, restConfig, measurementSystem } = store;
  const unit = weightUnit(measurementSystem || "metric");

  const phase = cycleType === "regular"
    ? getCurrentPhase(cycle.periodLog, cycle.avgLength)
    : null;

  const name = personalProfile.name || "You";
  const initial = name.charAt(0).toUpperCase();

  // Build subtitle for training
  const goalLabel = GOAL_OPTIONS.find((g) => g.value === goal)?.label || "";
  const dayCount = store.trainingDays.length;
  const equipSummary = equip.slice(0, 3).map((e) => EQUIP_LABELS[e] || e).join(", ");
  const trainingSub = [goalLabel, dayCount ? `${dayCount} days` : "", equipSummary].filter(Boolean).join(" · ");

  // Build subtitle for lifts
  const lifts = personalProfile.currentLifts || {};
  const liftEntries = Object.entries(lifts).filter(([, v]) => v > 0);
  const liftsSub = liftEntries.length > 0
    ? liftEntries.map(([k, v]) => `${k} ${v}${unit}`).join(" · ")
    : "Not set";

  // Rest config display
  const restSummary = `${restConfig.compound}s / ${restConfig.isolation}s`;

  return (
    <div className="mt-4">
      {/* Identity card */}
      <button
        onClick={() => onNavigate("personal")}
        className="w-full flex items-center gap-3 rounded-[10px] border border-border bg-surface p-4 text-left hover:border-border-active transition-all"
      >
        <div className="w-11 h-11 rounded-full bg-accent-dim border border-accent flex items-center justify-center shrink-0">
          <span className="font-display text-lg text-accent">{initial}</span>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-text">{name}</p>
          <div className="flex flex-wrap gap-1.5 mt-1">
            <span className="rounded-full bg-accent-dim px-2 py-0.5 text-[9px] text-accent">
              Week {progressDB.currentWeek}
            </span>
            <span className="rounded-full bg-[rgba(106,154,122,0.15)] px-2 py-0.5 text-[9px] text-[#8aba9a]">
              {progressDB.sessions.length} sessions
            </span>
            {phase && (
              <span className="rounded-full bg-[rgba(138,122,90,0.15)] px-2 py-0.5 text-[9px] text-[#c4a872]">
                {phase.label} · Day {phase.day}
              </span>
            )}
          </div>
        </div>
        <span className="text-muted2 text-xs">▸</span>
      </button>

      {/* Programme section */}
      <p className="mt-5 mb-2 text-[10px] tracking-[0.15em] uppercase text-muted font-medium">Programme</p>

      <NavCard label="Training" subtitle={trainingSub} onClick={() => onNavigate("training")} />
      <NavCard label="Health" subtitle="Cycle, conditions, comfort" onClick={() => onNavigate("health")} />
      <NavCard
        label="Session preferences"
        subtitle={`Coaching: ${eduMode} · Rest: ${restSummary}`}
        onClick={() => onNavigate("session")}
      />
      <NavCard label="Current lifts" subtitle={liftsSub} onClick={() => onNavigate("lifts")} />

      {/* Account section */}
      <p className="mt-5 mb-2 text-[10px] tracking-[0.15em] uppercase text-muted font-medium">Account</p>

      <NavCard label="Subscription" subtitle="" onClick={() => onNavigate("subscription")} />
      <NavCard label="Settings & data" subtitle="Units, export, sync" onClick={() => onNavigate("settings")} />
      <NavCard label="Privacy" subtitle="Consent, data controls" onClick={() => onNavigate("privacy")} />
    </div>
  );
}

function NavCard({ label, subtitle, onClick }: { label: string; subtitle: string; onClick: () => void }) {
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

// ── Personal Panel ──

function PersonalPanel({ onBack }: { onBack: () => void }) {
  const { personalProfile, setPersonalProfile } = useKineStore();
  const [name, setName] = useState(personalProfile.name);
  const [weight, setWeight] = useState(personalProfile.weight);
  const [height, setHeight] = useState(personalProfile.height);
  const [email, setEmail] = useState<string | null>(null);

  useEffect(() => {
    getUser().then((u) => setEmail(u?.email || null));
  }, []);

  function save() {
    setPersonalProfile({ ...personalProfile, name, weight, height });
    toast("Profile saved", "success");
    onBack();
  }

  return (
    <div className="mt-4">
      <BackButton onClick={onBack} />
      <h2 className="mt-4 text-xs tracking-wider text-muted uppercase">About you</h2>
      <div className="mt-4 flex flex-col gap-3">
        {email && (
          <div>
            <label className="text-xs text-muted">Email</label>
            <p className="mt-1 rounded-lg border border-border bg-bg px-3 py-2 text-sm text-muted2">{email}</p>
          </div>
        )}
        <Input label="Name" value={name} onChange={setName} />
        <Input label="Weight (kg)" value={weight} onChange={setWeight} type="number" />
        <Input label="Height (cm)" value={height} onChange={setHeight} type="number" />
        <Button onClick={save} className="w-full">Save</Button>
      </div>
    </div>
  );
}

// ── Training Panel (slimmed — no health, no lifts) ──

function TrainingPanel({ onBack }: { onBack: () => void }) {
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

// ── Health Panel (NEW — cycle + conditions + injuries + comfort) ──

function HealthPanel({ onBack }: { onBack: () => void }) {
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

  // Comfort flag mappings for condition warnings
  const CONDITION_COMFORT_MAP: Record<string, string[]> = {
    fibroids: ["impactSensitive"],
    endometriosis: ["impactSensitive"],
    pelvic_floor: ["proneSensitive"],
  };

  // Injury protection descriptions for removal warnings
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

  function handleConditionToggle(value: string) {
    if (conditions.includes(value)) {
      // Removing — check if it has comfort flag implications
      const affectedFlags = CONDITION_COMFORT_MAP[value];
      if (affectedFlags && affectedFlags.length > 0) {
        setConditionWarning(value);
        return;
      }
      // No comfort flag impact, just remove
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
      // Removing — show warning
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

// ── Session Preferences Panel (expanded from Coaching) ──

function SessionPreferencesPanel({ onBack }: { onBack: () => void }) {
  const { eduMode, setEduMode, sessionMode, setSessionMode, restConfig, setRestConfig, progressDB } = useKineStore();

  const modes: { value: EduMode; label: string; description: string }[] = [
    { value: "full", label: "Full coaching", description: "Breathing cues, form tips, progression suggestions, and rationales." },
    { value: "feel", label: "Feel only", description: "Just the 'what you should feel' cues. No extra explanation." },
    { value: "silent", label: "Silent", description: "No coaching overlays. Just log your sets." },
  ];

  const sessionModes: { value: SessionMode; label: string; description: string }[] = [
    { value: "off", label: "Free", description: "All exercises visible, log in any order" },
    { value: "timed", label: "Timed", description: "Rest timer between sets with auto-advance" },
    { value: "stopwatch", label: "Stopwatch", description: "Track total session time" },
  ];

  const showSilentWarning = eduMode === "silent" && progressDB.sessions.length < 20;
  const restCompoundLow = restConfig.compound < 90;
  const restIsolationLow = restConfig.isolation < 45;

  function adjustRest(type: "compound" | "isolation", delta: number) {
    const current = restConfig[type];
    const newVal = Math.max(30, Math.min(300, current + delta));
    setRestConfig({ ...restConfig, [type]: newVal });
  }

  return (
    <div className="mt-4">
      <BackButton onClick={onBack} />
      <h2 className="mt-4 text-xs tracking-wider text-muted uppercase">Session preferences</h2>

      {/* Coaching mode */}
      <p className="mt-4 mb-2 text-[10px] tracking-[0.15em] uppercase text-muted">Coaching</p>
      <div className="flex flex-col gap-2">
        {modes.map((m) => (
          <Tile key={m.value} selected={eduMode === m.value} onClick={() => { setEduMode(m.value); toast(`Coaching: ${m.label}`, "success"); }}>
            <div className="font-medium text-text">{m.label}</div>
            <div className="mt-1 text-xs text-muted2">{m.description}</div>
          </Tile>
        ))}
      </div>
      {showSilentWarning && (
        <div role="alert" className="mt-2 rounded-lg border border-[rgba(196,168,114,0.2)] bg-[rgba(196,168,114,0.08)] px-3 py-2.5 flex items-start gap-2">
          <span className="text-sm shrink-0">⚡</span>
          <p className="text-[10px] text-[#c4a872] leading-relaxed">
            <strong>Coaching helps you lift safer.</strong> Form cues and breathing reminders reduce injury risk — especially on compound lifts. You can always turn it back on.
          </p>
        </div>
      )}

      {/* Rest timers */}
      <p className="mt-5 mb-2 text-[10px] tracking-[0.15em] uppercase text-muted">Rest timers</p>
      <div className="rounded-[10px] border border-border bg-surface p-4">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs text-text">Compound exercises</span>
          <div className="flex items-center gap-2">
            <button onClick={() => adjustRest("compound", -15)}
              aria-label="Decrease compound rest time"
              className="rounded bg-surface2 min-w-[44px] min-h-[44px] flex items-center justify-center text-xs text-muted2 hover:text-text">−</button>
            <span className={`text-sm font-medium w-10 text-center ${restCompoundLow ? "text-[#c4a872]" : "text-text"}`}>{restConfig.compound}s</span>
            <button onClick={() => adjustRest("compound", 15)}
              aria-label="Increase compound rest time"
              className="rounded bg-surface2 min-w-[44px] min-h-[44px] flex items-center justify-center text-xs text-muted2 hover:text-text">+</button>
          </div>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-xs text-text">Isolation exercises</span>
          <div className="flex items-center gap-2">
            <button onClick={() => adjustRest("isolation", -15)}
              aria-label="Decrease isolation rest time"
              className="rounded bg-surface2 min-w-[44px] min-h-[44px] flex items-center justify-center text-xs text-muted2 hover:text-text">−</button>
            <span className={`text-sm font-medium w-10 text-center ${restIsolationLow ? "text-[#c4a872]" : "text-text"}`}>{restConfig.isolation}s</span>
            <button onClick={() => adjustRest("isolation", 15)}
              aria-label="Increase isolation rest time"
              className="rounded bg-surface2 min-w-[44px] min-h-[44px] flex items-center justify-center text-xs text-muted2 hover:text-text">+</button>
          </div>
        </div>
      </div>
      {(restCompoundLow || restIsolationLow) && (
        <div role="alert" className="mt-2 rounded-lg border border-[rgba(196,168,114,0.2)] bg-[rgba(196,168,114,0.08)] px-3 py-2.5 flex items-start gap-2">
          <span className="text-sm shrink-0">⏱</span>
          <p className="text-[10px] text-[#c4a872] leading-relaxed">
            <strong>Short rest{restCompoundLow ? " for compound lifts" : ""}.</strong>{" "}
            {restCompoundLow
              ? "Resting under 90s on heavy compounds can reduce performance and increase form breakdown. The default (150s) lets your nervous system recover."
              : "Very short isolation rest may limit your working capacity. The default (75s) balances pump and recovery."}
          </p>
        </div>
      )}

      {/* Session flow */}
      <p className="mt-5 mb-2 text-[10px] tracking-[0.15em] uppercase text-muted">Session flow</p>
      <div className="flex gap-2">
        {sessionModes.map((m) => (
          <button key={m.value}
            onClick={() => { setSessionMode(m.value); toast(`Session: ${m.label}`, "success"); }}
            className={`flex-1 rounded-[10px] border p-3 text-center transition-all ${
              sessionMode === m.value
                ? "border-accent bg-accent-dim"
                : "border-border bg-surface hover:border-border-active"
            }`}>
            <p className={`text-xs font-medium ${sessionMode === m.value ? "text-text" : "text-muted2"}`}>{m.label}</p>
            <p className="text-[9px] text-muted mt-1">{m.description}</p>
          </button>
        ))}
      </div>
    </div>
  );
}

// ── Current Lifts Panel (promoted from Training) ──

function LiftsPanel({ onBack }: { onBack: () => void }) {
  const { personalProfile, setPersonalProfile, equip, goal, measurementSystem } = useKineStore();
  const unit = weightUnit(measurementSystem || "metric");
  const [lifts, setLifts] = useState<Record<string, string>>(() => {
    const current = personalProfile.currentLifts || {};
    const mapped: Record<string, string> = {};
    Object.entries(current).forEach(([k, v]) => { mapped[k] = String(v); });
    return mapped;
  });

  const liftFields = getLiftFieldsForProfile(equip, goal, unit);

  function save() {
    const currentLifts: Record<string, number> = {};
    Object.entries(lifts).forEach(([name, val]) => {
      const num = parseFloat(val);
      if (num > 0) currentLifts[name] = num;
    });
    setPersonalProfile({ ...personalProfile, currentLifts });
    toast("Lifts updated", "success");
    onBack();
  }

  return (
    <div className="mt-4">
      <BackButton onClick={onBack} />
      <h2 className="mt-4 text-xs tracking-wider text-muted uppercase">Current lifts</h2>
      <p className="mt-1 text-xs text-muted2 font-light">Optional — helps set starting weights for your programme.</p>

      <div className="mt-4 flex flex-col gap-3">
        {liftFields.map((field) => (
          <div key={field.name} className="flex items-center justify-between rounded-[10px] border border-border bg-surface px-4 py-3">
            <span className="text-xs text-text">{field.name}</span>
            <div className="flex items-center gap-1">
              <input
                type="number"
                inputMode="decimal"
                placeholder="—"
                value={lifts[field.name] || ""}
                onChange={(e) => setLifts({ ...lifts, [field.name]: e.target.value })}
                className="w-16 rounded border border-border bg-bg px-2 py-1 text-center text-xs text-text outline-none focus:border-accent"
              />
              <span className="text-[10px] text-muted">{field.unit}</span>
            </div>
          </div>
        ))}
        <Button onClick={save} className="w-full">Save lifts</Button>
      </div>
    </div>
  );
}

function getLiftFieldsForProfile(equip: string[], goal: string | null, unit: string): { name: string; unit: string }[] {
  if (equip.includes("barbell")) {
    if (goal === "muscle") {
      return [
        { name: "Back Squat", unit },
        { name: "Romanian Deadlift", unit },
        { name: "Bench Press", unit },
      ];
    }
    return [
      { name: "Back Squat", unit },
      { name: "Deadlift", unit },
      { name: "Bench Press", unit },
      { name: "Overhead Press", unit },
    ];
  }
  if (equip.includes("dumbbells")) {
    return [
      { name: "Goblet Squat", unit },
      { name: "DB Romanian Deadlift", unit },
      { name: "DB Shoulder Press", unit },
    ];
  }
  if (equip.includes("machines")) {
    return [
      { name: "Leg Press", unit },
      { name: "Lat Pulldown", unit },
      { name: "Chest Press", unit },
    ];
  }
  return [
    { name: "Pull-Ups", unit: "reps" },
    { name: "Push-Ups", unit: "reps" },
  ];
}

// ── Subscription Panel ──

function SubscriptionPanel({ onBack }: { onBack: () => void }) {
  const currency = useKineStore((s) => s.currency) || detectCurrency();
  const prices = PRICE_TABLE[currency];
  const [status, setStatus] = useState<{
    active: boolean;
    status?: string;
    plan?: string;
    currentPeriodEnd?: string;
    cancelAtPeriodEnd?: boolean;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [portalLoading, setPortalLoading] = useState(false);
  const [checkoutLoading, setCheckoutLoading] = useState(false);

  useEffect(() => {
    getSubscriptionStatus().then((s) => {
      setStatus(s);
      setLoading(false);
    });
  }, []);

  async function openPortal() {
    setPortalLoading(true);
    try {
      const { getSession } = await import("@/lib/auth");
      const session = await getSession();
      if (!session) { toast("Not logged in", "error"); setPortalLoading(false); return; }

      const res = await fetch("/api/create-portal", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
      });
      const data = await res.json();
      if (data.url) window.location.href = data.url;
      else toast(data.error || "Could not open portal", "error");
    } catch {
      toast("Something went wrong", "error");
    }
    setPortalLoading(false);
  }

  async function handleResubscribe(plan: "monthly" | "yearly") {
    setCheckoutLoading(true);
    try {
      const { getSession } = await import("@/lib/auth");
      const session = await getSession();
      if (!session) { toast("Not logged in", "error"); setCheckoutLoading(false); return; }

      const res = await fetch("/api/create-checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ plan, currency }),
      });
      const data = await res.json();
      if (data.url) window.location.href = data.url;
      else toast(data.error || "Could not start checkout", "error");
    } catch {
      toast("Something went wrong", "error");
    }
    setCheckoutLoading(false);
  }

  const isCancelling = status?.active && status?.cancelAtPeriodEnd;
  const isCanceled = !status?.active && (status?.status === "canceled" || status?.status === "inactive");
  const isPastDue = status?.status === "past_due";

  const statusLabel = isCancelling
    ? "Cancelling"
    : isPastDue
      ? "Past due"
      : status?.active
        ? "Active"
        : "Inactive";

  return (
    <div className="mt-4">
      <BackButton onClick={onBack} />
      <h2 className="mt-4 text-xs tracking-wider text-muted uppercase">Subscription</h2>

      {loading ? (
        <div className="mt-4 flex justify-center">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-accent border-t-transparent" />
        </div>
      ) : (
        <div className="mt-4 flex flex-col gap-3">
          <div className="rounded-xl border border-border bg-surface p-4">
            <div className="flex flex-col gap-2">
              <Row label="Status" value={statusLabel} />
              {status?.plan && <Row label="Plan" value={status.plan} />}
              {status?.currentPeriodEnd && (
                <Row
                  label={isCancelling ? "Access until" : "Renews"}
                  value={formatDateWithYear(status.currentPeriodEnd)}
                />
              )}
            </div>

            {isCancelling && (
              <div className="mt-3 rounded-lg bg-amber-500/10 border border-amber-500/20 px-3 py-2">
                <p className="text-xs text-amber-400">
                  Your subscription will end on {formatDateShortLocale(status.currentPeriodEnd!)}. You can reactivate from the portal below.
                </p>
              </div>
            )}

            {isPastDue && (
              <div className="mt-3 rounded-lg bg-red-500/10 border border-red-500/20 px-3 py-2">
                <p className="text-xs text-red-400">
                  Your last payment failed. Update your payment method to keep access.
                </p>
              </div>
            )}
          </div>

          {(status?.active || isPastDue) && (
            <div>
              <Button variant="secondary" size="sm" className="w-full" onClick={openPortal} disabled={portalLoading}>
                {portalLoading ? "Loading..." : "Manage subscription"}
              </Button>
              <p className="mt-2 text-[10px] text-muted text-center">
                {isCancelling ? "Reactivate, change plan, or update payment." : "Change plan, update payment, or cancel."}
              </p>
            </div>
          )}

          {isCanceled && (
            <div>
              <p className="text-xs text-muted2 mb-3">Choose a plan to resubscribe.</p>
              <div className="flex flex-col gap-2">
                <button
                  onClick={() => handleResubscribe("monthly")}
                  disabled={checkoutLoading}
                  className="flex items-center justify-between rounded-[var(--radius-default)] border border-border bg-surface p-3 text-left hover:border-border-active transition-all disabled:opacity-50"
                >
                  <div>
                    <p className="text-sm font-medium text-text">Monthly</p>
                    <p className="text-xs text-muted2">Cancel anytime</p>
                  </div>
                  <p className="text-sm font-display text-accent">{formatCurrency(prices.monthly, currency)}<span className="text-xs text-muted2">/mo</span></p>
                </button>
                <button
                  onClick={() => handleResubscribe("yearly")}
                  disabled={checkoutLoading}
                  className="flex items-center justify-between rounded-[var(--radius-default)] border border-border bg-surface p-3 text-left hover:border-border-active transition-all disabled:opacity-50"
                >
                  <div>
                    <p className="text-sm font-medium text-text">Yearly</p>
                    <p className="text-xs text-muted2">Save 17%</p>
                  </div>
                  <p className="text-sm font-display text-accent">{formatCurrency(prices.yearly, currency)}<span className="text-xs text-muted2">/yr</span></p>
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Settings Panel (reorganised with danger zone) ──

function SettingsPanel({ onBack }: { onBack: () => void }) {
  const { measurementSystem, setMeasurementSystem, resetOnboarding } = useKineStore();
  const [deleteStep, setDeleteStep] = useState<"idle" | "confirm" | "deleting">("idle");
  const [restoring, setRestoring] = useState(false);

  async function handleSync() {
    await syncNow();
    toast("Synced to cloud", "success");
  }

  function handleExportData() {
    const store = useKineStore.getState();
    const exportData = {
      exportedAt: new Date().toISOString(),
      version: "1.0",
      profile: store.personalProfile,
      preferences: {
        goal: store.goal,
        experience: store.exp,
        equipment: store.equip,
        trainingDays: store.trainingDays,
        duration: store.duration,
        dayDurations: store.dayDurations,
        measurementSystem: store.measurementSystem,
        currency: store.currency,
        eduMode: store.eduMode,
        sessionMode: store.sessionMode,
        restConfig: store.restConfig,
      },
      healthData: {
        injuries: store.injuries,
        injuryNotes: store.injuryNotes,
        conditions: store.conditions,
        comfortFlags: store.comfortFlags,
        cycleType: store.cycleType,
        cycle: store.cycle,
      },
      training: {
        progressDB: store.progressDB,
        weekData: store.weekData,
        weekHistory: store.weekHistory,
        sessionLogs: store.sessionLogs,
        feedbackState: store.feedbackState,
        sessionTimeBudgets: store.sessionTimeBudgets,
      },
      education: {
        eduFlags: store.eduFlags,
        skillPreferences: store.skillPreferences,
      },
      consents: store.consents,
    };
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `kine-data-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast("Data exported", "success");
  }

  async function handleRestoreSubscription() {
    setRestoring(true);
    try {
      const { getSession } = await import("@/lib/auth");
      const session = await getSession();
      if (!session) { toast("Not logged in", "error"); setRestoring(false); return; }

      const res = await fetch("/api/verify-subscription", {
        method: "POST",
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      const data = await res.json();
      if (data.active) {
        toast("Subscription restored", "success");
      } else {
        toast("No active subscription found", "error");
      }
    } catch {
      toast("Could not verify subscription", "error");
    }
    setRestoring(false);
  }

  async function handleDeleteAccount() {
    setDeleteStep("deleting");
    try {
      const { getSession } = await import("@/lib/auth");
      const session = await getSession();
      if (!session) { toast("Not logged in", "error"); setDeleteStep("idle"); return; }

      const res = await fetch("/api/delete-account", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
      });
      const data = await res.json();
      if (data.deleted) {
        localStorage.removeItem("kine_v2");
        if ("caches" in window) {
          const keys = await caches.keys();
          await Promise.all(keys.map((k) => caches.delete(k)));
        }
        try { indexedDB.deleteDatabase("kine_photos"); } catch {}
        window.location.href = "/";
      } else {
        toast(data.error || "Failed to delete account", "error");
        setDeleteStep("idle");
      }
    } catch {
      toast("Something went wrong", "error");
      setDeleteStep("idle");
    }
  }

  function handleReset() {
    if (confirm("This will reset all your data. Are you sure?")) {
      resetOnboarding();
      localStorage.removeItem("kine_v2");
      window.location.href = "/app/onboarding";
    }
  }

  return (
    <div className="mt-4">
      <BackButton onClick={onBack} />
      <h2 className="mt-4 text-xs tracking-wider text-muted uppercase">Settings & data</h2>

      {/* Preferences */}
      <p className="mt-4 mb-2 text-[10px] tracking-[0.15em] uppercase text-muted">Preferences</p>
      <div className="rounded-[10px] border border-border bg-surface p-4">
        <div className="flex items-center justify-between">
          <span className="text-xs text-text">Units</span>
          <div className="flex gap-1">
            {(["metric", "imperial"] as const).map((s) => (
              <button key={s} onClick={() => setMeasurementSystem(s)}
                className={`rounded-lg px-3 py-1 text-xs transition-all ${
                  (measurementSystem || "metric") === s ? "bg-accent text-bg" : "bg-surface2 text-muted2 hover:text-text"
                }`}>{s === "metric" ? "kg" : "lbs"}</button>
            ))}
          </div>
        </div>
      </div>

      {/* Data */}
      <p className="mt-4 mb-2 text-[10px] tracking-[0.15em] uppercase text-muted">Your data</p>
      <div className="rounded-[10px] border border-border bg-surface p-4 flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <span className="text-xs text-text">Sync to cloud</span>
          <button onClick={handleSync} className="text-xs text-accent hover:underline">Sync now</button>
        </div>
        <div className="h-px bg-border/50" />
        <div className="flex items-center justify-between">
          <span className="text-xs text-text">Export data</span>
          <button onClick={handleExportData} className="text-xs text-accent hover:underline">Download JSON</button>
        </div>
        <div className="h-px bg-border/50" />
        <div className="flex items-center justify-between">
          <span className="text-xs text-text">Restore subscription</span>
          <button onClick={handleRestoreSubscription} disabled={restoring} className="text-xs text-accent hover:underline disabled:opacity-50">
            {restoring ? "Checking..." : "Check"}
          </button>
        </div>
      </div>

      {/* Account */}
      <p className="mt-4 mb-2 text-[10px] tracking-[0.15em] uppercase text-muted">Account</p>
      <button onClick={() => signOut()}
        className="w-full rounded-[10px] border border-border bg-surface p-3 text-center text-xs text-muted2 hover:text-text transition-colors">
        Sign out
      </button>

      {/* Danger zone */}
      <div className="mt-6 rounded-[10px] border border-red-500/20 p-4">
        <p className="text-[10px] tracking-[0.15em] uppercase text-red-400 mb-3">Danger zone</p>

        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="text-xs text-text font-light">Reset all data</p>
            <p className="text-[9px] text-muted">Clears everything. Restarts onboarding.</p>
          </div>
          <button onClick={handleReset} className="text-[10px] text-red-400 hover:underline">Reset</button>
        </div>

        <div className="h-px bg-red-500/10" />

        {deleteStep === "idle" && (
          <div className="flex items-center justify-between mt-3">
            <div>
              <p className="text-xs text-text font-light">Delete account</p>
              <p className="text-[9px] text-muted">Permanent. Removes all data and subscription.</p>
            </div>
            <button onClick={() => setDeleteStep("confirm")} className="text-[10px] text-red-400 hover:underline">Delete</button>
          </div>
        )}
        {deleteStep === "confirm" && (
          <div className="mt-3 rounded-lg bg-red-500/10 p-3">
            <p className="text-xs text-red-400 font-medium">Are you sure?</p>
            <p className="mt-1 text-[10px] text-muted2">
              This permanently deletes your account, training history, and subscription. This cannot be undone.
            </p>
            <div className="mt-3 flex gap-2">
              <Button size="sm" variant="ghost" onClick={() => setDeleteStep("idle")}>Cancel</Button>
              <button onClick={handleDeleteAccount}
                className="rounded-lg bg-red-500 px-4 py-2 text-xs font-medium text-white transition-all hover:bg-red-600">
                Yes, delete everything
              </button>
            </div>
          </div>
        )}
        {deleteStep === "deleting" && (
          <div className="mt-3 flex items-center gap-2 text-xs text-muted2">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-red-400 border-t-transparent" />
            Deleting account...
          </div>
        )}
      </div>
    </div>
  );
}

// ── Privacy Panel ──

function PrivacyPanel({ onBack }: { onBack: () => void }) {
  const { consents, recordConsent, cycleLocalOnly, setCycleLocalOnly } = useKineStore();
  const [showWithdrawWarning, setShowWithdrawWarning] = useState(false);

  const healthConsent = consents.find((c) => c.type === "health_data");
  const termsConsent = consents.find((c) => c.type === "terms");
  const privacyConsent = consents.find((c) => c.type === "privacy");
  const healthGranted = healthConsent?.granted === true;

  function handleToggleHealthConsent() {
    if (healthGranted) {
      setShowWithdrawWarning(true);
    } else {
      recordConsent("health_data", true);
      syncNow();
      toast("Health data consent granted", "success");
    }
  }

  function confirmWithdraw() {
    recordConsent("health_data", false);
    syncNow();
    setShowWithdrawWarning(false);
    toast("Health data consent withdrawn", "success");
  }

  function handleToggleCycleLocal() {
    setCycleLocalOnly(!cycleLocalOnly);
    syncNow();
    toast(cycleLocalOnly ? "Cycle data will sync to cloud" : "Cycle data will stay on this device", "success");
  }

  function formatConsentDate(timestamp?: string) {
    if (!timestamp) return "Not recorded";
    return formatDateWithYear(timestamp);
  }

  return (
    <div className="mt-4">
      <BackButton onClick={onBack} />
      <h2 className="mt-4 text-xs tracking-wider text-muted uppercase">Privacy</h2>

      <div className="mt-4 flex flex-col gap-4">
        {/* Consent status */}
        <div className="rounded-[var(--radius-default)] border border-border bg-surface p-4">
          <h3 className="text-sm font-medium text-text mb-3">Consent status</h3>
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-text">Health data</p>
                <p className="text-[10px] text-muted2">Cycle, conditions, injuries</p>
              </div>
              <div className="text-right">
                <span className={`text-xs ${healthGranted ? "text-green-400" : "text-red-400"}`}>
                  {healthGranted ? "Granted" : "Withdrawn"}
                </span>
                <p className="text-[10px] text-muted2">{formatConsentDate(healthConsent?.timestamp)}</p>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <p className="text-xs text-text">Terms of service</p>
              <div className="text-right">
                <span className={`text-xs ${termsConsent?.granted ? "text-green-400" : "text-muted2"}`}>
                  {termsConsent?.granted ? "Accepted" : "Not accepted"}
                </span>
                <p className="text-[10px] text-muted2">{formatConsentDate(termsConsent?.timestamp)}</p>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <p className="text-xs text-text">Privacy policy</p>
              <div className="text-right">
                <span className={`text-xs ${privacyConsent?.granted ? "text-green-400" : "text-muted2"}`}>
                  {privacyConsent?.granted ? "Accepted" : "Not accepted"}
                </span>
                <p className="text-[10px] text-muted2">{formatConsentDate(privacyConsent?.timestamp)}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Health data consent toggle */}
        <div className="rounded-[var(--radius-default)] border border-border bg-surface p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-text">Health data processing</p>
              <p className="text-xs text-muted2 mt-1">
                Allows syncing cycle, conditions, and injury data to the cloud for backup and cross-device access.
              </p>
            </div>
            <button
              onClick={handleToggleHealthConsent}
              className={`ml-4 flex-shrink-0 w-10 h-6 rounded-full transition-colors ${
                healthGranted ? "bg-accent" : "bg-surface2"
              }`}
              role="switch"
              aria-checked={healthGranted}
              aria-label="Health data consent"
            >
              <span className={`block w-4 h-4 rounded-full bg-white transition-transform mx-1 ${
                healthGranted ? "translate-x-4" : "translate-x-0"
              }`} />
            </button>
          </div>

          {showWithdrawWarning && (
            <div className="mt-3 rounded-xl border border-red-500/30 bg-red-500/10 p-3">
              <p className="text-xs text-red-400 font-medium">Withdraw health data consent?</p>
              <p className="mt-1.5 text-[10px] text-muted2 leading-relaxed">
                Without health data consent, Kine will no longer be able to:
              </p>
              <ul className="mt-1.5 flex flex-col gap-1">
                <li className="text-[10px] text-muted2 flex items-start gap-2">
                  <span className="text-red-400 mt-0.5">•</span>
                  <span><strong className="text-text">Adapt to your cycle</strong> — no phase-aware programming</span>
                </li>
                <li className="text-[10px] text-muted2 flex items-start gap-2">
                  <span className="text-red-400 mt-0.5">•</span>
                  <span><strong className="text-text">Filter for conditions</strong> — comfort flags won&apos;t apply</span>
                </li>
                <li className="text-[10px] text-muted2 flex items-start gap-2">
                  <span className="text-red-400 mt-0.5">•</span>
                  <span><strong className="text-text">Personalise warmups</strong> — injury-specific mods removed</span>
                </li>
              </ul>
              <p className="mt-1.5 text-[10px] text-muted2">
                Your programme will still work, but without these personalisation layers. Local data is not affected.
              </p>
              <div className="mt-2.5 flex gap-2">
                <button onClick={() => setShowWithdrawWarning(false)}
                  className="rounded-lg border border-[rgba(196,144,152,0.3)] bg-accent-dim px-3 py-1.5 text-xs font-medium text-accent hover:opacity-90 transition-colors">
                  Keep consent
                </button>
                <button onClick={confirmWithdraw}
                  className="rounded-lg border border-border px-3 py-1.5 text-xs text-muted2 hover:text-text transition-colors">
                  Withdraw
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Cycle data device-only */}
        {healthGranted && (
          <div className="rounded-[var(--radius-default)] border border-border bg-surface p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-text">Keep cycle data on this device only</p>
                <p className="text-xs text-muted2 mt-1">
                  Your cycle data will still personalise your programme, but won&apos;t be stored in the cloud.
                </p>
              </div>
              <button
                onClick={handleToggleCycleLocal}
                className={`ml-4 flex-shrink-0 w-10 h-6 rounded-full transition-colors ${
                  cycleLocalOnly ? "bg-accent" : "bg-surface2"
                }`}
                role="switch"
                aria-checked={cycleLocalOnly}
                aria-label="Cycle data local only"
              >
                <span className={`block w-4 h-4 rounded-full bg-white transition-transform mx-1 ${
                  cycleLocalOnly ? "translate-x-4" : "translate-x-0"
                }`} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Shared Components ──

function BackButton({ onClick }: { onClick: () => void }) {
  return (
    <button onClick={onClick} className="text-xs text-accent hover:underline">
      ← Back
    </button>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between py-1">
      <span className="text-xs text-muted2">{label}</span>
      <span className="text-xs text-text">{value}</span>
    </div>
  );
}

function Input({ label, value, onChange, type = "text" }: { label: string; value: string; onChange: (v: string) => void; type?: string }) {
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

function EditableRow({ label, value, isEditing, onEdit, children }: {
  label: string; value: string; isEditing: boolean; onEdit: () => void; children: React.ReactNode;
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
