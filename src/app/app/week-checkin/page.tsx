"use client";

import { useState, useMemo, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useKineStore, type SessionRecord, type NoteInsight, type AdaptationItem, type AdaptationPlan } from "@/store/useKineStore";
import { buildWeek } from "@/lib/week-builder";
import { getPhase, getBlockWeek, getBlockNumber } from "@/lib/periodisation";
import { isProgrammeStarted } from "@/lib/date-utils";
import { extractInsights } from "@/lib/extract-insights";
import { computeAdaptations } from "@/lib/compute-adaptations";
import { DAY_LABELS } from "@/data/constants";
import Button from "@/components/Button";
import { toast } from "@/components/Toast";

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

const SOURCE_COLOURS: Record<AdaptationItem["source"], string> = {
  insight: "bg-blue-400",
  rating: "bg-amber-400",
  periodisation: "bg-purple-400",
  cycle: "bg-pink-400",
  condition: "bg-red-400",
  activity: "bg-green-400",
};

export default function WeekCheckinPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const shouldAdvance = searchParams.get("advance") === "1";
  const store = useKineStore();
  const { progressDB, setProgressDB, goal, days } = store;

  const [step, setStep] = useState<"summary" | "notes" | "ratings" | "plan" | "done" | "building">("summary");
  const [buildError, setBuildError] = useState<string | null>(null);
  const [energy, setEnergy] = useState<number | null>(null);
  const [motivation, setMotivation] = useState<number | null>(null);
  const [scheduleFeeling, setScheduleFeeling] = useState<"too_easy" | "about_right" | "too_much" | null>(null);
  const [notes, setNotes] = useState("");

  // Adaptation plan state
  const [insights, setInsights] = useState<NoteInsight[]>([]);
  const [insightsLoading, setInsightsLoading] = useState(false);
  const [adaptations, setAdaptations] = useState<AdaptationItem[]>([]);
  const [planExtraNote, setPlanExtraNote] = useState("");
  const insightPromiseRef = useRef<Promise<NoteInsight[]> | null>(null);

  const plannedDays = parseInt(days || "3");

  // Use the most recent session's weekNum — handles time-travel where
  // currentWeek may not match the sessions that actually exist.
  const allSessions = progressDB.sessions as SessionRecord[];
  const latestSessionWeek = allSessions.length > 0
    ? allSessions[allSessions.length - 1].weekNum || progressDB.currentWeek
    : progressDB.currentWeek;
  const weekNum = latestSessionWeek;

  // Gate: don't allow check-in if programme hasn't started or no sessions completed
  const programmeStarted = isProgrammeStarted(progressDB.programStartDate);
  const weekSessCount = allSessions.filter((s) => s.weekNum === weekNum).length;

  if (!programmeStarted || weekSessCount === 0) {
    return (
      <div>
        <button onClick={() => router.push("/app")} className="text-xs text-muted2 hover:text-text transition-colors">
          ← Back to week
        </button>
        <div className="flex min-h-[50vh] flex-col items-center justify-center text-center">
          <h2 className="font-display text-xl tracking-wide text-text">
            {!programmeStarted ? "Your programme hasn\u2019t started yet" : "No sessions completed"}
          </h2>
          <p className="mt-2 text-xs text-muted2 max-w-xs">
            {!programmeStarted
              ? "Check back once your programme begins."
              : "Complete at least one session this week before checking in."}
          </p>
          <Button className="mt-6" onClick={() => router.push("/app")}>
            Back to dashboard
          </Button>
        </div>
      </div>
    );
  }
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
  const totalPRs = weekSessions.reduce((a, s) => a + ((s.prs as unknown[])?.length || 0), 0);

  // Goal-aware labels
  const goalInsight = goal === "strength"
    ? "Focus on whether the bar moved well this week — speed and technique over load."
    : goal === "muscle"
      ? "Think about the mind-muscle connection this week — did you feel the target muscles working?"
      : "The most important thing is that you showed up. Consistency is the work.";

  function handleNotesSubmit() {
    if (notes.trim().length >= 5) {
      setInsightsLoading(true);
      insightPromiseRef.current = extractInsights(notes).finally(() => setInsightsLoading(false));
    }
    setStep("ratings");
  }

  async function handleRatingsSubmit() {
    // Compute deterministic adaptations synchronously
    const deterministicAdaptations = computeAdaptations(energy!, motivation!, scheduleFeeling!);

    // Await insights if still loading
    let resolvedInsights: NoteInsight[] = [];
    if (insightPromiseRef.current) {
      resolvedInsights = await insightPromiseRef.current;
    }
    setInsights(resolvedInsights);

    // Convert insights to AdaptationItems
    const insightAdaptations: AdaptationItem[] = resolvedInsights.map((ins, i) => ({
      id: `insight-${i}`,
      label: ins.insight + (ins.exerciseRef ? ` (${ins.exerciseRef})` : ""),
      source: "insight" as const,
      enabled: true,
    }));

    setAdaptations([...insightAdaptations, ...deterministicAdaptations]);
    setStep("plan");
  }

  function toggleAdaptation(id: string) {
    setAdaptations((prev) =>
      prev.map((a) => a.id === id ? { ...a, enabled: !a.enabled } : a),
    );
  }

  function submit() {
    const plan: AdaptationPlan = {
      insights,
      adaptations,
      extraNote: planExtraNote || undefined,
    };

    // Remove any existing check-in for this week (amend case), then add new one
    const filtered = progressDB.weekFeedbackHistory.filter((f) => f.weekNum !== weekNum);

    setProgressDB({
      ...progressDB,
      weekFeedbackHistory: [
        ...filtered,
        {
          weekNum,
          effort: energy || 2,
          soreness: motivation || 2,
          scheduleFeeling: scheduleFeeling ?? undefined,
          notes: notes || undefined,
          adaptationPlan: plan,
        },
      ],
    });
    setStep("done");
  }

  const insightItems = adaptations.filter((a) => a.source === "insight");
  const programmeItems = adaptations.filter((a) => a.source !== "insight");

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

          <Button className="w-full mt-6" size="lg" onClick={() => setStep("notes")}>
            Continue
          </Button>
        </div>
      )}

      {/* Step 2: Notes (moved to first input step) */}
      {step === "notes" && (
        <div className="animate-fade-up">
          <h2 className="mt-4 font-display text-xl tracking-wide text-text">Anything to note from this week?</h2>
          <p className="mt-1 text-xs text-muted2">
            Exercises you liked or didn&apos;t, aches, sleep, stress — anything that should shape next week.
          </p>

          <div className="mt-6">
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              aria-label="Week notes"
              placeholder="e.g. loved the split squats, shoulder felt off on overhead press, slept badly all week..."
              rows={4}
              className="w-full rounded-xl border border-border bg-surface px-3 py-2 text-sm text-text placeholder:text-muted outline-none focus:border-accent resize-none"
              autoFocus
            />
          </div>

          <Button className="w-full mt-6" size="lg" onClick={handleNotesSubmit}>
            {notes.trim().length > 0 ? "Continue" : "Skip"}
          </Button>
        </div>
      )}

      {/* Step 3: Ratings (energy + body feel + volume — merged) */}
      {step === "ratings" && (
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

          <div className="mt-6">
            <p className="mb-2 text-xs tracking-wider text-muted uppercase">How did the volume feel?</p>
            <div className="flex flex-col gap-2">
              <button onClick={() => setScheduleFeeling("too_easy")}
                className={`rounded-xl border p-3 text-left transition-all ${
                  scheduleFeeling === "too_easy" ? "border-accent bg-accent-dim" : "border-border bg-surface hover:border-border-active"
                }`}>
                <p className="text-sm font-medium text-text">Too easy</p>
                <p className="text-xs text-muted2 font-light mt-0.5">Could have done more.</p>
              </button>
              <button onClick={() => setScheduleFeeling("about_right")}
                className={`rounded-xl border p-3 text-left transition-all ${
                  scheduleFeeling === "about_right" ? "border-accent bg-accent-dim" : "border-border bg-surface hover:border-border-active"
                }`}>
                <p className="text-sm font-medium text-text">About right</p>
                <p className="text-xs text-muted2 font-light mt-0.5">Challenging but manageable.</p>
              </button>
              <button onClick={() => setScheduleFeeling("too_much")}
                className={`rounded-xl border p-3 text-left transition-all ${
                  scheduleFeeling === "too_much" ? "border-accent bg-accent-dim" : "border-border bg-surface hover:border-border-active"
                }`}>
                <p className="text-sm font-medium text-text">Too much</p>
                <p className="text-xs text-muted2 font-light mt-0.5">Struggled to recover between sessions.</p>
              </button>
            </div>
          </div>

          <Button
            className="w-full mt-6"
            size="lg"
            disabled={energy === null || motivation === null || scheduleFeeling === null || insightsLoading}
            onClick={handleRatingsSubmit}
          >
            {insightsLoading ? "Processing notes…" : "Continue"}
          </Button>
        </div>
      )}

      {/* Step 4: Adaptation plan */}
      {step === "plan" && (
        <div className="animate-fade-up">
          <h2 className="mt-4 font-display text-xl tracking-wide text-text">Next week&apos;s plan</h2>
          <p className="mt-1 text-xs text-muted2">
            Here&apos;s what will change based on your feedback. Toggle off anything you disagree with.
          </p>

          {/* Insights from notes */}
          {insightItems.length > 0 && (
            <div className="mt-5">
              <p className="text-[10px] text-muted uppercase tracking-wider mb-2">From your notes</p>
              <div className="flex flex-col gap-2">
                {insightItems.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => toggleAdaptation(item.id)}
                    className={`flex items-start gap-3 rounded-xl border p-3 text-left transition-all ${
                      item.enabled ? "border-accent/40 bg-accent-dim" : "border-border bg-surface opacity-50"
                    }`}
                  >
                    <span className={`mt-0.5 h-2 w-2 flex-shrink-0 rounded-full ${SOURCE_COLOURS[item.source]}`} />
                    <span className={`text-xs leading-relaxed ${item.enabled ? "text-text" : "text-muted2 line-through"}`}>
                      {item.label}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Programme adaptations */}
          {programmeItems.length > 0 && (
            <div className="mt-5">
              <p className="text-[10px] text-muted uppercase tracking-wider mb-2">Programme adaptations</p>
              <div className="flex flex-col gap-2">
                {programmeItems.map((item) => {
                  const isInfoOnly = item.source === "periodisation";
                  return (
                    <button
                      key={item.id}
                      onClick={() => !isInfoOnly && toggleAdaptation(item.id)}
                      className={`flex items-start gap-3 rounded-xl border p-3 text-left transition-all ${
                        isInfoOnly
                          ? "border-border bg-surface cursor-default"
                          : item.enabled
                            ? "border-accent/40 bg-accent-dim"
                            : "border-border bg-surface opacity-50"
                      }`}
                    >
                      <span className={`mt-0.5 h-2 w-2 flex-shrink-0 rounded-full ${SOURCE_COLOURS[item.source]}`} />
                      <span className={`text-xs leading-relaxed ${
                        !isInfoOnly && !item.enabled ? "text-muted2 line-through" : "text-text"
                      }`}>
                        {item.label}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Extra note */}
          <div className="mt-5">
            <textarea
              value={planExtraNote}
              onChange={(e) => setPlanExtraNote(e.target.value)}
              aria-label="Extra note for next week"
              placeholder="Anything else for next week?"
              rows={2}
              className="w-full rounded-xl border border-border bg-surface px-3 py-2 text-sm text-text placeholder:text-muted outline-none focus:border-accent resize-none"
            />
          </div>

          <Button className="w-full mt-6" size="lg" onClick={submit}>
            Save check-in
          </Button>
        </div>
      )}

      {/* Step 5: Done */}
      {step === "done" && (
        <div className="animate-fade-up flex min-h-[50vh] flex-col items-center justify-center text-center">
          <div className="text-4xl mb-4">✓</div>
          <h2 className="font-display text-2xl tracking-wide text-accent">Check-in saved</h2>
          <p className="mt-2 text-xs text-muted2 max-w-xs">
            {getSessionInsight(weekSessions, scheduleFeeling)}
          </p>
          {shouldAdvance ? (
            <Button className="mt-6" onClick={async () => {
              setStep("building");
              setBuildError(null);
              const nextWeekNum = weekNum + 1;
              setProgressDB({ ...progressDB, currentWeek: nextWeekNum });
              const result = await buildWeek();
              if (result.weekData) {
                store.setWeekData(result.weekData);
              }
              if (!result.success && result.error) {
                setBuildError(result.error);
                setStep("done");
              } else {
                router.push("/app");
              }
            }}>
              Build Week {weekNum + 1} →
            </Button>
          ) : (
            <Button className="mt-6" onClick={() => router.push("/app")}>
              Back to week
            </Button>
          )}
          {buildError && <p className="mt-2 text-xs text-warning">{buildError}</p>}
        </div>
      )}

      {/* Building state */}
      {step === "building" && (
        <div className="animate-fade-up flex min-h-[50vh] flex-col items-center justify-center text-center">
          <div className="h-8 w-8 mx-auto animate-spin rounded-full border-2 border-accent border-t-transparent" />
          <p className="mt-4 text-sm text-muted2 animate-pulse">Building your next week…</p>
        </div>
      )}
    </div>
  );
}
