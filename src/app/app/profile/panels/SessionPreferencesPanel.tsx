"use client";

import { useKineStore } from "@/store/useKineStore";
import type { EduMode, CoachingDetail, SessionMode, CheckInField } from "@/store/useKineStore";
import Tile from "@/components/Tile";
import { toast } from "@/components/Toast";
import { BackButton } from "./_helpers";

const COACHING_MODES: { value: EduMode; label: string; description: string }[] = [
  { value: "full", label: "Full coaching", description: "Breathing cues, form tips, progression suggestions, and rationales." },
  { value: "feel", label: "Feel only", description: "Just the 'what you should feel' cues. No extra explanation." },
  { value: "silent", label: "Silent", description: "No coaching overlays. Just log your sets." },
];

const CHECKIN_FIELDS: { value: CheckInField; label: string; description: string }[] = [
  { value: "photos", label: "Photos", description: "Front, side, back — visual progress" },
  { value: "weight", label: "Bodyweight", description: "Track weight over time" },
  { value: "mood", label: "Mood & energy", description: "How you're feeling day-to-day" },
  { value: "notes", label: "Notes", description: "Free-text reflections" },
];

const SESSION_MODES: { value: SessionMode; label: string; description: string }[] = [
  { value: "off", label: "Self-paced", description: "See your full session at once. Move through exercises at your own pace." },
  { value: "timed", label: "Timed", description: "Rest timer between sets with auto-advance" },
  { value: "stopwatch", label: "Stopwatch", description: "Track total session time" },
];

export default function SessionPreferencesPanel({ onBack }: { onBack: () => void }) {
  const { eduMode, setEduMode, coachingDetail, setCoachingDetail, sessionMode, setSessionMode, restConfig, setRestConfig, progressDB, checkinFields, setCheckinFields } = useKineStore();

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
        {COACHING_MODES.map((m) => (
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

      {/* Coaching detail level */}
      <p className="mt-5 mb-2 text-[10px] tracking-[0.15em] uppercase text-muted">How much do you want to know?</p>
      <div className="flex rounded-xl border border-border overflow-hidden">
        {([
          { value: "quiet" as CoachingDetail, label: "Quiet", sub: "Just train" },
          { value: "default" as CoachingDetail, label: "Default", sub: "Light context" },
          { value: "coach" as CoachingDetail, label: "Coach", sub: "Tell me everything" },
        ]).map((m) => (
          <button
            key={m.value}
            onClick={() => { setCoachingDetail(m.value); toast(`Detail: ${m.label}`, "success"); }}
            className={`flex-1 py-3 px-2 text-center transition-all ${
              coachingDetail === m.value
                ? "bg-accent text-bg"
                : "bg-surface text-muted2 hover:text-text"
            }`}
          >
            <p className="text-xs font-medium">{m.label}</p>
            <p className={`text-[9px] mt-0.5 ${coachingDetail === m.value ? "text-bg/70" : "text-muted"}`}>{m.sub}</p>
          </button>
        ))}
      </div>

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
        {SESSION_MODES.map((m) => (
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
      {/* Check-in fields */}
      <p className="mt-5 mb-2 text-[10px] tracking-[0.15em] uppercase text-muted">Check-in fields</p>
      <p className="text-[10px] text-muted2 mb-3">Choose what shows up when you log a check-in. All fields are always optional.</p>
      <div className="flex flex-col gap-2">
        {CHECKIN_FIELDS.map((f) => {
          const active = (checkinFields ?? CHECKIN_FIELDS.map(x => x.value)).includes(f.value);
          return (
            <button
              key={f.value}
              onClick={() => {
                const current = checkinFields ?? CHECKIN_FIELDS.map(x => x.value);
                const updated = active
                  ? current.filter((v) => v !== f.value)
                  : [...current, f.value];
                setCheckinFields(updated);
                toast(active ? `${f.label} hidden` : `${f.label} shown`, "success");
              }}
              className={`flex items-center gap-3 rounded-[10px] border p-3 text-left transition-all ${
                active
                  ? "border-accent bg-accent-dim"
                  : "border-border bg-surface hover:border-border-active"
              }`}
            >
              <div className={`w-5 h-5 rounded-md border flex items-center justify-center shrink-0 transition-all ${
                active ? "border-accent bg-accent" : "border-border"
              }`}>
                {active && <span className="text-[10px] text-bg font-bold">✓</span>}
              </div>
              <div className="flex-1 min-w-0">
                <p className={`text-xs font-medium ${active ? "text-text" : "text-muted2"}`}>{f.label}</p>
                <p className="text-[9px] text-muted">{f.description}</p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
