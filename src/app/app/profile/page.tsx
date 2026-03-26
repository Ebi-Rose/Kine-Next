"use client";

import { useState, useEffect } from "react";
import { useKineStore } from "@/store/useKineStore";
import type { EduMode, CycleType, PeriodLog } from "@/store/useKineStore";
import { signOut, getSubscriptionStatus } from "@/lib/auth";
import { getCurrentPhase } from "@/lib/cycle";
import { syncNow } from "@/lib/sync";
import Button from "@/components/Button";
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

type Panel = "overview" | "personal" | "training" | "coaching" | "cycle" | "subscription" | "settings";

export default function ProfilePage() {
  const [panel, setPanel] = useState<Panel>("overview");

  return (
    <div>
      <h1 className="font-display text-3xl tracking-wide text-accent">Profile</h1>

      {panel === "overview" && <OverviewPanel onNavigate={setPanel} />}
      {panel === "personal" && <PersonalPanel onBack={() => setPanel("overview")} />}
      {panel === "training" && <TrainingPanel onBack={() => setPanel("overview")} />}
      {panel === "coaching" && <CoachingPanel onBack={() => setPanel("overview")} />}
      {panel === "cycle" && <CyclePanel onBack={() => setPanel("overview")} />}
      {panel === "subscription" && <SubscriptionPanel onBack={() => setPanel("overview")} />}
      {panel === "settings" && <SettingsPanel onBack={() => setPanel("overview")} />}
    </div>
  );
}

// ── Overview Panel ──

function OverviewPanel({ onNavigate }: { onNavigate: (p: Panel) => void }) {
  const { personalProfile, progressDB } = useKineStore();

  const panels: { id: Panel; label: string; description: string }[] = [
    { id: "personal", label: "About you", description: personalProfile.name || "Name, weight, height" },
    { id: "training", label: "Training", description: "Goal, equipment, schedule" },
    { id: "coaching", label: "Coaching", description: "Education mode, preferences" },
    { id: "cycle", label: "Cycle", description: "Period tracking, phase management" },
    { id: "subscription", label: "Subscription", description: "Manage your plan" },
    { id: "settings", label: "Settings", description: "Units, account, data" },
  ];

  return (
    <div className="mt-6 flex flex-col gap-2">
      {panels.map((p) => (
        <button
          key={p.id}
          onClick={() => onNavigate(p.id)}
          className="flex items-center justify-between rounded-[var(--radius-default)] border border-border bg-surface p-4 text-left hover:border-border-active transition-all"
        >
          <div>
            <p className="text-sm font-medium text-text">{p.label}</p>
            <p className="text-xs text-muted2">{p.description}</p>
          </div>
          <span className="text-muted2">▸</span>
        </button>
      ))}

      <div className="mt-4 text-center text-xs text-muted">
        Week {progressDB.currentWeek} · {progressDB.sessions.length} sessions completed
      </div>
    </div>
  );
}

// ── Personal Panel ──

function PersonalPanel({ onBack }: { onBack: () => void }) {
  const { personalProfile, setPersonalProfile } = useKineStore();
  const [name, setName] = useState(personalProfile.name);
  const [weight, setWeight] = useState(personalProfile.weight);
  const [height, setHeight] = useState(personalProfile.height);

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
        <Input label="Name" value={name} onChange={setName} />
        <Input label="Weight (kg)" value={weight} onChange={setWeight} type="number" />
        <Input label="Height (cm)" value={height} onChange={setHeight} type="number" />
        <Button onClick={save} className="w-full">Save</Button>
      </div>
    </div>
  );
}

// ── Training Panel ──

function TrainingPanel({ onBack }: { onBack: () => void }) {
  const store = useKineStore();
  const { goal, exp, equip, trainingDays, duration, injuries, conditions, setGoal, setExp, setEquip, setTrainingDays, setDays, setDuration, setInjuries, setConditions, setWeekData } = store;
  const [editing, setEditing] = useState<string | null>(null);

  function saveAndClearWeek() {
    // Clear weekData so it regenerates with new settings
    setWeekData(null);
    setEditing(null);
    toast("Settings updated — rebuild your week to apply", "success");
  }

  return (
    <div className="mt-4">
      <BackButton onClick={onBack} />
      <h2 className="mt-4 text-xs tracking-wider text-muted uppercase">Training</h2>

      {/* Goal */}
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

      {/* Experience */}
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

      {/* Equipment */}
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

      {/* Training days */}
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

      {/* Duration */}
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

      {/* Injuries */}
      <EditableRow label="Injuries" value={injuries.length > 0 ? injuries.map(i => INJURY_OPTIONS.find(o => o.value === i)?.label || i).join(", ") : "None"} isEditing={editing === "injuries"} onEdit={() => setEditing("injuries")}>
        <div className="flex flex-wrap gap-2">
          {INJURY_OPTIONS.map((opt) => (
            <button key={opt.value} onClick={() => {
              const newInjuries = injuries.includes(opt.value)
                ? injuries.filter((i) => i !== opt.value)
                : [...injuries, opt.value];
              setInjuries(newInjuries);
            }}
              className={`rounded-full border px-3 py-1.5 text-xs transition-all ${
                injuries.includes(opt.value)
                  ? "border-accent bg-accent-dim text-text"
                  : "border-border text-muted2 hover:border-border-active"
              }`}>
              {opt.label}
            </button>
          ))}
        </div>
        <Button size="sm" className="mt-3 w-full" onClick={saveAndClearWeek}>Save injuries</Button>
      </EditableRow>

      {/* Health conditions */}
      <EditableRow label="Health conditions" value={conditions.length > 0 ? conditions.map(c => CONDITION_OPTIONS.find(o => o.value === c)?.label || c).join(", ") : "None"} isEditing={editing === "conditions"} onEdit={() => setEditing("conditions")}>
        <div className="flex flex-wrap gap-2">
          {CONDITION_OPTIONS.map((opt) => (
            <button key={opt.value} onClick={() => {
              const newConditions = conditions.includes(opt.value)
                ? conditions.filter((c) => c !== opt.value)
                : [...conditions, opt.value];
              setConditions(newConditions);
            }}
              className={`rounded-full border px-3 py-1.5 text-xs transition-all ${
                conditions.includes(opt.value)
                  ? "border-accent bg-accent-dim text-text"
                  : "border-border text-muted2 hover:border-border-active"
              }`}>
              {opt.label}
            </button>
          ))}
        </div>
        <Button size="sm" className="mt-3 w-full" onClick={saveAndClearWeek}>Save conditions</Button>
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

// ── Coaching Panel ──

function CoachingPanel({ onBack }: { onBack: () => void }) {
  const { eduMode, setEduMode } = useKineStore();

  const modes: { value: EduMode; label: string; description: string }[] = [
    { value: "full", label: "Full coaching", description: "Breathing cues, form tips, exercise rationales — everything." },
    { value: "feel", label: "Feel only", description: "Just the 'what you should feel' cues. No extra explanation." },
    { value: "silent", label: "Silent", description: "No coaching overlays. Just log your sets." },
  ];

  return (
    <div className="mt-4">
      <BackButton onClick={onBack} />
      <h2 className="mt-4 text-xs tracking-wider text-muted uppercase">Coaching mode</h2>
      <p className="mt-1 text-xs text-muted2">Controls how much guidance appears during sessions.</p>
      <div className="mt-4 flex flex-col gap-2">
        {modes.map((m) => (
          <Tile key={m.value} selected={eduMode === m.value} onClick={() => { setEduMode(m.value); toast(`Coaching: ${m.label}`, "success"); }}>
            <div className="font-medium text-text">{m.label}</div>
            <div className="mt-1 text-xs text-muted2">{m.description}</div>
          </Tile>
        ))}
      </div>
    </div>
  );
}

// ── Cycle Panel ──

function CyclePanel({ onBack }: { onBack: () => void }) {
  const { cycleType, setCycleType, cycle, setCycle } = useKineStore();
  const [newDate, setNewDate] = useState("");

  const phase = cycleType === "regular" ? getCurrentPhase(cycle.periodLog, cycle.avgLength) : null;

  function logPeriod() {
    if (!newDate) return;
    const newLog: PeriodLog = { date: newDate, type: "start" };
    setCycle({ ...cycle, periodLog: [...cycle.periodLog, newLog] });
    setNewDate("");
    toast("Period logged", "success");
  }

  return (
    <div className="mt-4">
      <BackButton onClick={onBack} />
      <h2 className="mt-4 text-xs tracking-wider text-muted uppercase">Cycle tracking</h2>

      {/* Current type */}
      <div className="mt-4 rounded-[var(--radius-default)] border border-border bg-surface p-4">
        <Row label="Type" value={CYCLE_OPTIONS.find((c) => c.value === cycleType)?.label || "Not set"} />
      </div>

      {/* Phase display */}
      {phase && (
        <div className="mt-4 rounded-[var(--radius-default)] border border-accent/30 bg-accent-dim p-4">
          <p className="text-sm font-medium text-text">◐ {phase.label} · Day {phase.day}</p>
          <p className="mt-1 text-xs text-muted2">{phase.description}</p>
          <p className="mt-2 text-xs text-muted2 italic">{phase.trainingNote}</p>
        </div>
      )}

      {/* Log new period */}
      {cycleType === "regular" && (
        <div className="mt-4">
          <p className="mb-2 text-xs text-muted2">Log period start</p>
          <div className="flex gap-2">
            <input type="date" value={newDate} onChange={(e) => setNewDate(e.target.value)}
              className="flex-1 rounded-lg border border-border bg-bg px-3 py-2 text-sm text-text outline-none focus:border-accent" />
            <Button size="sm" onClick={logPeriod} disabled={!newDate}>Log</Button>
          </div>
        </div>
      )}

      {/* Period history */}
      {cycle.periodLog.length > 0 && (
        <div className="mt-4">
          <p className="mb-2 text-xs text-muted uppercase tracking-wider">History</p>
          <div className="flex flex-col gap-1">
            {cycle.periodLog.slice(-10).reverse().map((log, i) => (
              <div key={i} className="flex items-center justify-between text-xs">
                <span className="text-muted2">{log.date}</span>
                <span className="text-muted">Period start</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Change type */}
      <div className="mt-6">
        <p className="mb-2 text-xs text-muted uppercase tracking-wider">Change cycle type</p>
        <div className="flex flex-col gap-2">
          {CYCLE_OPTIONS.map((opt) => (
            <button key={opt.value}
              onClick={() => { setCycleType(opt.value as CycleType); toast(`Cycle: ${opt.label}`, "success"); }}
              className={`rounded-lg border px-3 py-2 text-left text-xs transition-all ${
                cycleType === opt.value ? "border-accent bg-accent-dim text-text" : "border-border text-muted2 hover:border-border-active"
              }`}>
              {opt.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Subscription Panel ──

function SubscriptionPanel({ onBack }: { onBack: () => void }) {
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
        body: JSON.stringify({ plan }),
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
                  value={new Date(status.currentPeriodEnd).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                />
              )}
            </div>

            {/* Cancelling banner */}
            {isCancelling && (
              <div className="mt-3 rounded-lg bg-amber-500/10 border border-amber-500/20 px-3 py-2">
                <p className="text-xs text-amber-400">
                  Your subscription will end on {new Date(status.currentPeriodEnd!).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}. You can reactivate from the portal below.
                </p>
              </div>
            )}

            {/* Past due banner */}
            {isPastDue && (
              <div className="mt-3 rounded-lg bg-red-500/10 border border-red-500/20 px-3 py-2">
                <p className="text-xs text-red-400">
                  Your last payment failed. Update your payment method to keep access.
                </p>
              </div>
            )}
          </div>

          {/* Active or cancelling: show manage button */}
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

          {/* Canceled / inactive: show resubscribe */}
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
                  <p className="text-sm font-display text-accent">£29.99<span className="text-xs text-muted2">/mo</span></p>
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
                  <p className="text-sm font-display text-accent">£300<span className="text-xs text-muted2">/yr</span></p>
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Settings Panel ──

function SettingsPanel({ onBack }: { onBack: () => void }) {
  const { units, setUnits, resetOnboarding } = useKineStore();

  async function handleSync() {
    await syncNow();
    toast("Synced to cloud", "success");
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
      <h2 className="mt-4 text-xs tracking-wider text-muted uppercase">Settings</h2>

      <div className="mt-4 flex flex-col gap-4">
        {/* Units */}
        <div className="rounded-[var(--radius-default)] border border-border bg-surface p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-text">Units</span>
            <div className="flex gap-1">
              {(["kg", "lbs"] as const).map((u) => (
                <button key={u} onClick={() => setUnits(u)}
                  className={`rounded-lg px-3 py-1 text-xs transition-all ${
                    units === u ? "bg-accent text-bg" : "bg-surface2 text-muted2 hover:text-text"
                  }`}>{u}</button>
              ))}
            </div>
          </div>
        </div>

        {/* Sync */}
        <Button variant="secondary" size="sm" onClick={handleSync}>
          Sync to cloud
        </Button>

        {/* Reset */}
        <Button variant="ghost" size="sm" onClick={handleReset} className="text-red-400">
          Reset all data
        </Button>

        {/* Sign out */}
        <Button variant="ghost" size="sm" onClick={() => signOut()}>
          Sign out
        </Button>
      </div>
    </div>
  );
}

// ── Shared Components ──

function BackButton({ onClick }: { onClick: () => void }) {
  return (
    <button onClick={onClick} className="text-xs text-muted2 hover:text-text transition-colors">
      ← Back
    </button>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-xs text-muted">{label}</span>
      <span className="text-xs text-text">{value}</span>
    </div>
  );
}

function Input({ label, value, onChange, type = "text", placeholder }: {
  label: string; value: string; onChange: (v: string) => void; type?: string; placeholder?: string;
}) {
  return (
    <div>
      <label className="text-xs text-muted">{label}</label>
      <input type={type} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder}
        className="mt-1 w-full rounded-lg border border-border bg-bg px-3 py-2 text-sm text-text outline-none focus:border-accent" />
    </div>
  );
}
