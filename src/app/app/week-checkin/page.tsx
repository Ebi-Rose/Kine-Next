"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useKineStore } from "@/store/useKineStore";
import { getPhase, getBlockWeek, getBlockNumber } from "@/lib/periodisation";
import { DAY_LABELS } from "@/data/constants";
import Button from "@/components/Button";
import { toast } from "@/components/Toast";

type SessionRecord = { weekNum?: number; effort?: number; soreness?: number; title?: string; dayIdx?: number; prs?: unknown[] };

function getSessionInsight(sessions: SessionRecord[], scheduleFeeling: string | null): string {
  if (sessions.length === 0) {
    return scheduleFeeling === "too_easy"
      ? "Noted — next week will push a little harder."
      : scheduleFeeling === "too_much"
        ? "Noted — next week will dial back the intensity."
        : "Noted — keeping the balance where it is.";
  }

  // Find the highest-soreness session
  const sorest = sessions.reduce((max, s) =>
    (s.soreness || 0) > (max.soreness || 0) ? s : max, sessions[0]);

  // Find the highest-effort session
  const hardest = sessions.reduce((max, s) =>
    (s.effort || 0) > (max.effort || 0) ? s : max, sessions[0]);

  const dayName = (s: SessionRecord) =>
    s.dayIdx !== undefined ? DAY_LABELS[s.dayIdx] : null;

  // High soreness on a specific session
  if ((sorest.soreness || 0) >= 3 && sorest.title) {
    const day = dayName(sorest);
    const sessionLabel = day ? `${day}'s ${sorest.title}` : sorest.title;
    return `Soreness was high after ${sessionLabel}. Next week spaces your lower body days further apart.`;
  }

  // High effort across the board
  if ((hardest.effort || 0) >= 4 && hardest.title) {
    const day = dayName(hardest);
    const sessionLabel = day ? `${day}'s ${hardest.title}` : hardest.title;
    return `${sessionLabel} pushed your limits. Next week builds on that without overreaching.`;
  }

  // Low everything — room to push
  const allEasy = sessions.every((s) => (s.effort || 2) <= 2 && (s.soreness || 2) <= 2);
  if (allEasy) {
    return "You sailed through this week. Next week can push a bit harder.";
  }

  // Fallback to schedule-based
  return scheduleFeeling === "too_easy"
    ? "Noted — next week will push a little harder."
    : scheduleFeeling === "too_much"
      ? "Noted — next week will dial back the intensity."
      : "Noted — keeping the balance where it is.";
}

export default function WeekCheckinPage() {
  const router = useRouter();
  const store = useKineStore();
  const { progressDB, setProgressDB, goal, days } = store;

  const [step, setStep] = useState<"summary" | "feelings" | "schedule" | "done">("summary");
  const [energy, setEnergy] = useState<number | null>(null);
  const [motivation, setMotivation] = useState<number | null>(null);
  const [scheduleFeeling, setScheduleFeeling] = useState<"too_easy" | "about_right" | "too_much" | null>(null);
  const [notes, setNotes] = useState("");

  const weekNum = progressDB.currentWeek;
  const plannedDays = parseInt(days || "3");
  const phase = getPhase(weekNum, progressDB.phaseOffset);
  const blockWeek = getBlockWeek(weekNum, progressDB.phaseOffset);
  const blockNum = getBlockNumber(weekNum, progressDB.phaseOffset);
  const isBlockEnd = blockWeek === 3;

  // Week stats
  const weekSessions = useMemo(() =>
    (progressDB.sessions as SessionRecord[])
      .filter((s) => s.weekNum === weekNum),
    [progressDB.sessions, weekNum]
  );

  const completionRate = plannedDays > 0 ? Math.round((weekSessions.length / plannedDays) * 100) : 0;
  const avgEffort = weekSessions.length
    ? (weekSessions.reduce((a, s) => a + (s.effort || 2), 0) / weekSessions.length).toFixed(1) : "—";
  const avgSoreness = weekSessions.length
    ? (weekSessions.reduce((a, s) => a + (s.soreness || 2), 0) / weekSessions.length).toFixed(1) : "—";
  const totalPRs = weekSessions.reduce((a, s) => a + ((s.prs as unknown[])?.length || 0), 0);

  // Goal-aware labels
  const goalInsight = goal === "strength"
    ? "Focus on whether the bar moved well this week — speed and technique over load."
    : goal === "muscle"
      ? "Think about the mind-muscle connection this week — did you feel the target muscles working?"
      : "The most important thing is that you showed up. Consistency is the work.";

  function submit() {
    setProgressDB({
      ...progressDB,
      weekFeedbackHistory: [
        ...progressDB.weekFeedbackHistory,
        {
          weekNum,
          effort: energy || 2,
          soreness: motivation || 2,
          notes: `${scheduleFeeling ? `Schedule: ${scheduleFeeling}. ` : ""}${notes}`,
        },
      ],
    });
    setStep("done");
  }

  return (
    <div>
      <button onClick={() => router.push("/app")} className="text-xs text-muted2 hover:text-text transition-colors">
        ← Back to week
      </button>

      {/* Step 1: Week summary */}
      {step === "summary" && (
        <div className="animate-fade-up">
          <h1 className="mt-4 font-display text-2xl tracking-wide text-accent">
            Week {weekNum} review
          </h1>
          <p className="mt-1 text-[10px] text-muted font-display tracking-wider">
            Block {blockNum} · {phase.label} · Week {blockWeek}/3
          </p>

          {/* Stats */}
          <div className="mt-6 grid grid-cols-2 gap-3">
            <div className="rounded-xl border border-border bg-surface p-3 text-center">
              <p className="font-display text-2xl text-accent">{weekSessions.length}/{plannedDays}</p>
              <p className="text-[9px] text-muted uppercase tracking-wider mt-0.5">Sessions</p>
            </div>
            <div className="rounded-xl border border-border bg-surface p-3 text-center">
              <p className="font-display text-2xl text-accent">{completionRate}%</p>
              <p className="text-[9px] text-muted uppercase tracking-wider mt-0.5">Completion</p>
            </div>
            <div className="rounded-xl border border-border bg-surface p-3 text-center">
              <p className="font-display text-2xl text-text">{avgEffort}</p>
              <p className="text-[9px] text-muted uppercase tracking-wider mt-0.5">Avg effort</p>
            </div>
            <div className="rounded-xl border border-border bg-surface p-3 text-center">
              <p className="font-display text-2xl text-text">{totalPRs}</p>
              <p className="text-[9px] text-muted uppercase tracking-wider mt-0.5">PRs</p>
            </div>
          </div>

          {/* Sessions list */}
          <div className="mt-4 flex flex-col gap-1.5">
            {weekSessions.map((s, i) => (
              <div key={i} className="flex items-center justify-between rounded-lg bg-surface px-3 py-2 text-xs">
                <span className="text-text">{s.title || `Session ${i + 1}`}</span>
                <span className="text-muted2">Effort {s.effort}/4</span>
              </div>
            ))}
            {weekSessions.length === 0 && (
              <p className="text-xs text-muted2 py-4 text-center">No sessions completed this week</p>
            )}
          </div>

          {/* Block milestone */}
          {isBlockEnd && (
            <div className="mt-4 rounded-xl border border-accent/30 bg-accent-dim p-4 text-center animate-celebrate">
              <p className="font-display text-lg text-accent tracking-wider">BLOCK {blockNum} COMPLETE</p>
              <p className="text-xs text-muted2 font-light mt-1">
                3 weeks of structured training done. Your body has adapted.
              </p>
            </div>
          )}

          {/* Goal insight */}
          <div className="mt-4 border-l-2 border-accent/30 pl-3">
            <p className="text-xs text-muted2 font-light italic leading-relaxed">{goalInsight}</p>
          </div>

          <Button className="w-full mt-6" size="lg" onClick={() => setStep("feelings")}>
            Continue
          </Button>
        </div>
      )}

      {/* Step 2: How are you feeling */}
      {step === "feelings" && (
        <div className="animate-fade-up">
          <h2 className="mt-4 font-display text-xl tracking-wide text-text">How are you feeling?</h2>

          <div className="mt-6">
            <p className="mb-2 text-xs tracking-wider text-muted uppercase">Energy levels</p>
            <div className="grid grid-cols-4 gap-2">
              {["Drained", "Low", "Normal", "High"].map((label, i) => (
                <button key={i} onClick={() => setEnergy(i + 1)}
                  className={`rounded-xl border px-2 py-3 text-xs transition-all ${
                    energy === i + 1 ? "border-accent bg-accent-dim text-text" : "border-border bg-surface text-muted2 hover:border-border-active"
                  }`}>{label}</button>
              ))}
            </div>
          </div>

          <div className="mt-6">
            <p className="mb-2 text-xs tracking-wider text-muted uppercase">Body feel</p>
            <div className="grid grid-cols-4 gap-2">
              {["Fresh", "Mild aches", "Sore", "Beat up"].map((label, i) => (
                <button key={i} onClick={() => setMotivation(i + 1)}
                  className={`rounded-xl border px-2 py-3 text-xs transition-all ${
                    motivation === i + 1 ? "border-accent bg-accent-dim text-text" : "border-border bg-surface text-muted2 hover:border-border-active"
                  }`}>{label}</button>
              ))}
            </div>
          </div>

          <Button className="w-full mt-6" size="lg" disabled={energy === null || motivation === null}
            onClick={() => setStep("schedule")}>
            Continue
          </Button>
        </div>
      )}

      {/* Step 3: Schedule adjustment */}
      {step === "schedule" && (
        <div className="animate-fade-up">
          <h2 className="mt-4 font-display text-xl tracking-wide text-text">How did the volume feel?</h2>
          <p className="mt-1 text-xs text-muted2">This shapes next week&apos;s programme.</p>

          <div className="mt-6 flex flex-col gap-3">
            <button onClick={() => setScheduleFeeling("too_easy")}
              className={`rounded-xl border p-4 text-left transition-all ${
                scheduleFeeling === "too_easy" ? "border-accent bg-accent-dim" : "border-border bg-surface hover:border-border-active"
              }`}>
              <p className="text-sm font-medium text-text">Too easy</p>
              <p className="text-xs text-muted2 font-light mt-0.5">Could have done more. Sessions felt comfortable.</p>
            </button>
            <button onClick={() => setScheduleFeeling("about_right")}
              className={`rounded-xl border p-4 text-left transition-all ${
                scheduleFeeling === "about_right" ? "border-accent bg-accent-dim" : "border-border bg-surface hover:border-border-active"
              }`}>
              <p className="text-sm font-medium text-text">About right</p>
              <p className="text-xs text-muted2 font-light mt-0.5">Challenging but manageable. Good balance.</p>
            </button>
            <button onClick={() => setScheduleFeeling("too_much")}
              className={`rounded-xl border p-4 text-left transition-all ${
                scheduleFeeling === "too_much" ? "border-accent bg-accent-dim" : "border-border bg-surface hover:border-border-active"
              }`}>
              <p className="text-sm font-medium text-text">Too much</p>
              <p className="text-xs text-muted2 font-light mt-0.5">Struggled to recover between sessions.</p>
            </button>
          </div>

          <div className="mt-4">
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)}
              placeholder="Anything else? Sleep, stress, life outside training..."
              rows={3}
              className="w-full rounded-xl border border-border bg-surface px-3 py-2 text-sm text-text placeholder:text-muted outline-none focus:border-accent resize-none" />
          </div>

          <Button className="w-full mt-6" size="lg" disabled={scheduleFeeling === null} onClick={submit}>
            Save check-in
          </Button>
        </div>
      )}

      {/* Step 4: Done */}
      {step === "done" && (
        <div className="animate-fade-up flex min-h-[50vh] flex-col items-center justify-center text-center">
          <div className="text-4xl mb-4">✓</div>
          <h2 className="font-display text-2xl tracking-wide text-accent">Check-in saved</h2>
          <p className="mt-2 text-xs text-muted2 max-w-xs">
            {getSessionInsight(weekSessions, scheduleFeeling)}
          </p>
          <Button className="mt-6" onClick={() => router.push("/app")}>
            Back to week
          </Button>
        </div>
      )}
    </div>
  );
}
