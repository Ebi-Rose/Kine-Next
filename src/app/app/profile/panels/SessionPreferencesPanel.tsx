"use client";

import { useKineStore } from "@/store/useKineStore";
import type { EduMode, SessionMode } from "@/store/useKineStore";
import Tile from "@/components/Tile";
import { toast } from "@/components/Toast";
import { BackButton } from "./_helpers";

const COACHING_MODES: { value: EduMode; label: string; description: string }[] = [
  { value: "full", label: "Full coaching", description: "Breathing cues, form tips, progression suggestions, and rationales." },
  { value: "feel", label: "Feel only", description: "Just the 'what you should feel' cues. No extra explanation." },
  { value: "silent", label: "Silent", description: "No coaching overlays. Just log your sets." },
];

const SESSION_MODES: { value: SessionMode; label: string; description: string }[] = [
  { value: "off", label: "Free", description: "All exercises visible, log in any order" },
  { value: "timed", label: "Timed", description: "Rest timer between sets with auto-advance" },
  { value: "stopwatch", label: "Stopwatch", description: "Track total session time" },
];

export default function SessionPreferencesPanel({ onBack }: { onBack: () => void }) {
  const { eduMode, setEduMode, sessionMode, setSessionMode, restConfig, setRestConfig, progressDB } = useKineStore();

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
    </div>
  );
}
