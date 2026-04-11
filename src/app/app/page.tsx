"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useKineStore } from "@/store/useKineStore";
import { appNow, appTodayISO, appTimestamp } from "@/lib/dev-time";
import { buildWeek } from "@/lib/week-builder";
import type { WeekData, WeekDay } from "@/lib/week-builder";
import { DAY_LABELS, CATEGORY_COLORS } from "@/data/constants";
import { getCurrentPhase } from "@/lib/cycle";
import { getCurrentPhaseInfo } from "@/lib/periodisation";
import { isProgrammeStarted } from "@/lib/date-utils";
import Button from "@/components/Button";
import BottomSheet from "@/components/BottomSheet";
import SessionRearrange from "@/components/SessionRearrange";
import { findExercise } from "@/data/exercise-library";
import { weightUnit, formatDateShortLocale, detectLocale } from "@/lib/format";
import AdaptationCard from "@/components/AdaptationCard";
import RestDayHome from "@/components/RestDayHome";
import StreakMilestone from "@/components/StreakMilestone";
import ForYouEducationStrip from "@/components/ForYouEducationStrip";
import Link from "next/link";
import { toast } from "@/components/Toast";

function getCategoryColor(exerciseName: string): string {
  const ex = findExercise(exerciseName);
  return ex ? CATEGORY_COLORS[ex.muscle] : "var(--color-muted)";
}

const LOADING_MESSAGES = [
  "Analysing your training profile…",
  "Building your session structure…",
  "Selecting exercises for your equipment…",
  "Balancing volume and recovery…",
  "Finalising your programme…",
];

export default function AppHome() {
  const store = useKineStore();
  const { weekData, setWeekData, goal, progressDB } = store;
  const [loading, setLoading] = useState(false);
  const [loadingMsg, setLoadingMsg] = useState(0);
  const router = useRouter();
  // Note: we intentionally DO NOT redirect to /app/onboarding from here.
  // AuthGuard is the single source of truth for onboarding status via the
  // sticky onboarded_at flag on the user. Redirecting on a missing `goal`
  // here fights with AuthGuard and sends onboarded users who are mid-sync
  // back through onboarding, which overwrites their data.

  const [elapsedSec, setElapsedSec] = useState(0);

  // Rotate loading messages + track elapsed time
  useEffect(() => {
    if (!loading) { setElapsedSec(0); return; }
    const msgInterval = setInterval(() => {
      setLoadingMsg((prev) => (prev + 1) % LOADING_MESSAGES.length);
    }, 3000);
    const secInterval = setInterval(() => {
      setElapsedSec((prev) => prev + 1);
    }, 1000);
    return () => { clearInterval(msgInterval); clearInterval(secInterval); };
  }, [loading]);

  async function handleBuildWeek() {
    setLoading(true);
    setLoadingMsg(0);

    const result = await buildWeek();

    if (result.weekData) {
      // Preserve exercises for days that already have a completed session
      const curWeek = store.progressDB.currentWeek || 1;
      const completedDayIdxs = new Set(
        (store.progressDB.sessions as { weekNum?: number; dayIdx?: number }[])
          .filter((s) => s.weekNum === curWeek)
          .map((s) => s.dayIdx)
      );
      const existingWeek = store.weekData as WeekData | null;
      if (existingWeek && completedDayIdxs.size > 0) {
        const mergedDays = result.weekData.days.map((newDay: WeekDay, i: number) => {
          if (completedDayIdxs.has(i) && existingWeek.days[i]) {
            return existingWeek.days[i]; // keep the original day
          }
          return newDay;
        });
        result.weekData = { ...result.weekData, days: mergedDays };
      }
      setWeekData(result.weekData);
    }

    if (!result.success && result.error) {
      toast(result.error, "error");
    } else if (result.repairsCount && result.repairsCount > 0) {
      toast(
        result.repairsCount === 1
          ? "1 exercise adapted for your setup"
          : `${result.repairsCount} exercises adapted for your setup`,
        "info",
      );
    }

    setLoading(false);
  }

  // No goal yet — we're either hydrating from localStorage or waiting for
  // the cloud sync to restore state. Show a quiet placeholder, NOT a
  // redirect to onboarding (AuthGuard already decided this user is valid).
  if (!goal) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <p className="text-xs text-muted font-light">Loading your programme…</p>
      </div>
    );
  }

  const programmeStarted = isProgrammeStarted(progressDB.programStartDate);

  // Programme hasn't started yet — show pre-start state
  if (!programmeStarted) {
    return <PreStartView programStartDate={progressDB.programStartDate!} onBuildWeek={handleBuildWeek} loading={loading} loadingMsg={loadingMsg} />;
  }

  // No week data yet — show build prompt
  if (!weekData) {
    return (
      <div className="relative flex min-h-[70vh] flex-col items-center justify-end text-center overflow-hidden rounded-2xl">
        {/* Hero background */}
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: "url('/hero-bg-opt.jpg')" }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-bg via-bg/80 to-bg/30" />

        {/* Content */}
        <div className="relative z-10 px-6 pb-10">
          {loading ? (
            <div role="status" aria-label="Building your week">
              <div className="h-8 w-8 mx-auto animate-spin rounded-full border-2 border-accent border-t-transparent" aria-hidden="true" />
              <p className="mt-4 text-sm text-muted2 animate-pulse" aria-live="polite">
                {LOADING_MESSAGES[loadingMsg]}
              </p>
              {elapsedSec >= 10 && (
                <p className="mt-2 text-[10px] text-muted font-light">
                  {elapsedSec < 30
                    ? "This usually takes 15–30 seconds"
                    : "Still working — almost there"}
                </p>
              )}
            </div>
          ) : (
            <>
              <h2 className="font-display text-2xl tracking-wide text-text">
                Ready to build your week
              </h2>
              <p className="mt-2 text-sm text-muted2">
                Your personalised training programme will be generated by AI.
              </p>
              <Button className="mt-6" size="lg" onClick={handleBuildWeek}>
                Build Week {progressDB.currentWeek || 1} →
              </Button>
            </>
          )}
        </div>
      </div>
    );
  }

  async function handleAdvanceWeek() {
    // Route through week check-in first if not already done for this week
    const curWeek = store.progressDB.currentWeek || 1;
    const alreadyCheckedIn = store.progressDB.weekFeedbackHistory.some(
      (f) => f.weekNum === curWeek
    );
    if (!alreadyCheckedIn) {
      router.push("/app/week-checkin?advance=1");
      return;
    }
    await doAdvanceWeek();
  }

  async function doAdvanceWeek() {
    const nextWeekNum = (store.progressDB.currentWeek || 1) + 1;
    store.setProgressDB({
      ...store.progressDB,
      currentWeek: nextWeekNum,
    });
    setLoading(true);
    setLoadingMsg(0);

    const result = await buildWeek();

    if (result.weekData) {
      setWeekData(result.weekData);
    }

    if (!result.success && result.error) {
      toast(result.error, "error");
    } else if (result.repairsCount && result.repairsCount > 0) {
      toast(
        result.repairsCount === 1
          ? "1 exercise adapted for your setup"
          : `${result.repairsCount} exercises adapted for your setup`,
        "info",
      );
    }

    setLoading(false);
  }

  // Show week view
  const week = weekData as WeekData;

  return <WeekView week={week} onRebuild={handleBuildWeek} onAdvanceWeek={handleAdvanceWeek} loading={loading} />;
}

// ── Pre-Start View (programme starts in the future) ──

function PreStartView({
  programStartDate,
  onBuildWeek,
  loading,
  loadingMsg,
}: {
  programStartDate: string;
  onBuildWeek: () => void;
  loading: boolean;
  loadingMsg: number;
}) {
  const router = useRouter();
  const { trainingDays, weekData, setWeekData, personalProfile } = useKineStore();
  const firstName = (personalProfile?.name || "").trim().split(/\s+/)[0];
  const [activeView, setActiveView] = useState<"this-week" | "next-week">("this-week");
  const [expandedDay, setExpandedDay] = useState<number | null>(null);
  const now = appNow();
  const todayIdx = now.getDay() === 0 ? 6 : now.getDay() - 1;
  const weekStart = getWeekDateRange();

  const startDate = new Date(programStartDate);
  const locale = typeof navigator !== "undefined" && navigator.language ? navigator.language : "en-GB";
  const startLabel = startDate.toLocaleDateString(locale, { weekday: "long", day: "numeric", month: "short" });

  const daysUntilStart = Math.ceil((startDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <p className="text-[10px] tracking-[0.3em] text-accent uppercase">
          This week · {weekStart}
        </p>
        <h1 className="mt-1 font-display text-2xl tracking-wide text-text">
          {firstName ? `Hi ${firstName}` : "Your Week"}
        </h1>
      </div>

      {/* Countdown banner */}
      <div className="mb-5 rounded-[14px] border border-accent/30 bg-accent-dim p-5 text-center">
        <p className="font-display text-[11px] tracking-[3px] text-accent uppercase mb-1">
          Programme starts {startLabel}
        </p>
        <p className="text-xs text-muted2 font-light mt-1">
          {daysUntilStart === 1 ? "Tomorrow" : `${daysUntilStart} days to go`} &mdash; enjoy the rest, your training begins soon.
        </p>
      </div>

      {/* Pill toggle */}
      <div className="flex rounded-[10px] border border-border bg-surface p-[3px]">
        <button
          onClick={() => setActiveView("this-week")}
          className={`flex-1 rounded-[8px] py-2 text-[11px] transition-all ${
            activeView === "this-week"
              ? "bg-accent-dim text-accent border border-accent/20"
              : "text-muted border border-transparent"
          }`}
        >
          This week
        </button>
        <button
          onClick={() => setActiveView("next-week")}
          className={`flex-1 rounded-[8px] py-2 text-[11px] transition-all ${
            activeView === "next-week"
              ? "bg-accent-dim text-accent border border-accent/20"
              : "text-muted border border-transparent"
          }`}
        >
          Next week
        </button>
      </div>

      {/* This week view */}
      {activeView === "this-week" && (
        <div className="mt-4 flex flex-col gap-2">
          {DAY_LABELS.map((label, i) => {
            const isPast = i < todayIdx;
            const isToday = i === todayIdx;
            if (isPast) return null;
            return (
              <div
                key={i}
                className={`rounded-[14px] border px-[18px] py-3 transition-all ${
                  isToday ? "border-accent/30 bg-accent-dim"
                  : "border-border/50 bg-surface/50"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-muted2">{label}</span>
                    {isToday && (
                      <span className="rounded-full bg-accent/20 px-2 py-0.5 text-[10px] text-accent">
                        Today
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted">No workout</span>
                    <button
                      onClick={() => router.push(`/app/custom-builder?day=${i}`)}
                      className="text-[10px] text-muted2 hover:text-accent transition-colors"
                    >
                      + add session
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Next week view */}
      {activeView === "next-week" && (
        <div className="mt-4">
          {weekData ? (
            <div className="flex flex-col gap-2">
              {DAY_LABELS.map((label, i) => {
                const matchingDay = (weekData as WeekData).days.find(
                  (d) => ((d.dayNumber - 1) % 7) === i
                );
                const isTraining = matchingDay && !matchingDay.isRest;
                const isExpanded = expandedDay === i;
                // Compute the actual date for this day in next week
                const dayDate = new Date(startDate);
                dayDate.setDate(startDate.getDate() + i - (startDate.getDay() === 0 ? 6 : startDate.getDay() - 1));
                const dateStr = dayDate.toLocaleDateString(locale, { day: "numeric", month: "short" });
                return (
                  <div
                    key={i}
                    className={`rounded-[14px] border px-[18px] py-3 transition-all ${
                      isTraining ? "border-accent/30 bg-accent-dim" : "border-border/50 bg-surface/50"
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => isTraining && setExpandedDay(isExpanded ? null : i)}
                      className={`flex w-full items-center justify-between text-left ${isTraining ? "cursor-pointer" : "cursor-default"}`}
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-medium text-muted2">{label}</span>
                        <span className="text-[10px] text-muted">{dateStr}</span>
                      </div>
                      {isTraining && matchingDay ? (
                        <div className="flex items-center gap-2">
                          <div className="text-right">
                            <p className="text-xs text-text">{matchingDay.sessionTitle}</p>
                            <p className="text-[10px] text-muted">{matchingDay.exercises.length} exercises &middot; {matchingDay.sessionDuration}</p>
                          </div>
                          <span className={`text-[10px] text-muted transition-transform ${isExpanded ? "rotate-90" : ""}`}>&rsaquo;</span>
                        </div>
                      ) : (
                        <span className="text-xs text-muted">Rest</span>
                      )}
                    </button>
                    {isExpanded && isTraining && matchingDay && (
                      <div className="mt-3 border-t border-border/30 pt-3 flex flex-col gap-2">
                        {matchingDay.exercises.map((ex, j) => (
                          <div key={j} className="flex items-center justify-between">
                            <span className="text-[11px] text-text">{ex.name}</span>
                            <span className="text-[10px] text-muted">{ex.sets} &times; {ex.reps}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="rounded-[14px] border border-border/50 bg-surface/50 p-6 text-center">
              <p className="font-display text-[9px] tracking-[2px] text-muted uppercase mb-1">Starting {startLabel}</p>
              <p className="font-display text-lg tracking-wide text-text">Week 1</p>
              <p className="mt-1 text-[10px] text-muted2">
                {trainingDays.length} training days &middot; Your programme will be built by AI
              </p>
              <Button variant="secondary" size="sm" className="mt-3" onClick={onBuildWeek} disabled={loading}>
                {loading ? LOADING_MESSAGES[loadingMsg] : "Preview Week 1 \u2192"}
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Health disclaimer */}
      <p className="mt-6 text-center text-[10px] text-muted leading-relaxed">
        Kinē provides fitness guidance, not medical advice.
        Consult your doctor before starting any exercise programme.
      </p>
    </div>
  );
}

// ── Cycle Phase Colors ──

const PHASE_COLORS: Record<string, string> = {
  menstrual: "#b05a5a",
  follicular: "#6a9a7a",
  ovulatory: "#C49098",
  luteal: "#8a7a5a",
};

// ── Cycle Arc Bar ──

function CycleArc({ cycleDay, cycleLength, logCount }: { cycleDay: number; cycleLength: number; logCount: number }) {
  const L = cycleLength;
  const mEnd = 5;
  const fEnd = Math.round(L * 0.46);
  const oEnd = Math.round(L * 0.54);
  const segs = [
    { phase: "menstrual", days: mEnd },
    { phase: "follicular", days: fEnd - mEnd },
    { phase: "ovulatory", days: oEnd - fEnd },
    { phase: "luteal", days: L - oEnd },
  ];
  const pct = Math.min(((cycleDay - 1) / L) * 100, 99);

  return (
    <div>
      <p className="font-display text-[9px] tracking-[2px] text-muted uppercase mb-1.5">
        {logCount >= 2 ? `${L}-day cycle` : "Cycle (28-day default)"}
      </p>
      <div className="relative flex h-1 gap-0.5 rounded-sm">
        {segs.map((s) => (
          <div
            key={s.phase}
            className="rounded-sm"
            style={{ flex: s.days, background: PHASE_COLORS[s.phase] }}
          />
        ))}
        <div
          className="absolute rounded-sm"
          style={{
            top: "-3px",
            left: `calc(${pct}% - 1px)`,
            width: "2px",
            height: "10px",
            background: "white",
            opacity: 0.9,
          }}
        />
      </div>
    </div>
  );
}

// ── Week View ──

function WeekView({
  week,
  onRebuild,
  onAdvanceWeek,
  loading,
}: {
  week: WeekData;
  onRebuild: () => void;
  onAdvanceWeek: () => void;
  loading: boolean;
}) {
  const { cycleType, cycle, setCycle, progressDB, weekHistory, exp, personalProfile } = useKineStore();
  const firstName = (personalProfile?.name || "").trim().split(/\s+/)[0];
  const [showRearrange, setShowRearrange] = useState(false);
  const [viewingPastIdx, setViewingPastIdx] = useState<number | null>(null);
  const [viewTab, setViewTab] = useState<"today" | "week">("today");
  const today = appNow().getDay();
  const todayIdx = today === 0 ? 6 : today - 1;
  // weekStart is computed after effectiveWeekNum, trainingPhase after displayWeekNum

  // Detect if the programme week is ahead of the calendar week (e.g. time-travel)
  // Only fall back to previous week if no sessions have been logged for the current
  // programme week — otherwise the user has legitimately started that week.
  const programmeMonday = getProgrammeWeekMonday(progressDB.currentWeek || 1, progressDB.programStartDate);
  const calendarNow = appNow();
  const calendarDow = calendarNow.getDay() === 0 ? 6 : calendarNow.getDay() - 1;
  const calendarMonday = new Date(calendarNow);
  calendarMonday.setDate(calendarNow.getDate() - calendarDow);
  const programmeAhead = programmeMonday.toISOString().slice(0, 10) > calendarMonday.toISOString().slice(0, 10);
  const hasCurrentWeekSessions = (progressDB.sessions as { weekNum?: number }[])
    .some((s) => s.weekNum === (progressDB.currentWeek || 1));
  const isNextWeek = programmeAhead && !hasCurrentWeekSessions;

  // When time-travelling back before the current programme week started,
  // fall back to the previous week so the UI shows what was current then.
  const effectiveWeekNum = isNextWeek
    ? Math.max((progressDB.currentWeek || 1) - 1, 1)
    : (progressDB.currentWeek || 1);
  const effectiveWeek = isNextWeek && weekHistory.length > 0
    ? (weekHistory[weekHistory.length - 1] as WeekData)
    : week;
  const effectiveWeekStart = getWeekDateRange(effectiveWeekNum, progressDB.programStartDate);
  // trainingPhase is computed after displayWeekNum below so it
  // reflects whichever week the user is actually viewing.

  // Sessions for the effective programme week, filtered to those logged up to "now"
  const todayISO = appTodayISO();
  const currentWeekSessions = (progressDB.sessions as { weekNum?: number; date?: string; dayIdx?: number }[])
    .filter((s) => s.weekNum === effectiveWeekNum && (!s.date || s.date <= todayISO));

  // Week navigation: past weeks from history, current week is live
  // When isNextWeek, the Week tab shows the newly built week, Today tab shows effective (previous) week
  const isViewingPast = viewingPastIdx !== null;
  const displayWeek = isViewingPast
    ? (weekHistory[viewingPastIdx] as WeekData)
    : (isNextWeek && viewTab === "week") ? week : effectiveWeek;
  const displayWeekNum = isViewingPast
    ? (displayWeek?._weekNum || 1)
    : (isNextWeek && viewTab === "week") ? (progressDB.currentWeek || 1) : effectiveWeekNum;
  const trainingPhase = getCurrentPhaseInfo(displayWeekNum, progressDB.phaseOffset);
  const hasPrev = isViewingPast ? viewingPastIdx > 0 : weekHistory.length > 0;
  const hasNext = isViewingPast; // can always go forward to current

  function goToPrevWeek() {
    if (isViewingPast && viewingPastIdx > 0) {
      setViewingPastIdx(viewingPastIdx - 1);
    } else if (!isViewingPast && weekHistory.length > 0) {
      setViewingPastIdx(weekHistory.length - 1);
    }
  }

  function goToNextWeek() {
    if (isViewingPast) {
      if (viewingPastIdx < weekHistory.length - 1) {
        setViewingPastIdx(viewingPastIdx + 1);
      } else {
        setViewingPastIdx(null); // back to current
      }
    }
  }

  // Cycle phase
  const phase = cycleType === "regular"
    ? getCurrentPhase(cycle.periodLog, cycle.avgLength)
    : null;

  if (!displayWeek) return null;

  return (
    <div className={loading ? "relative" : ""}>
      {/* Rebuild overlay */}
      {loading && (
        <div className="absolute inset-0 z-30 flex items-start justify-center pt-24 bg-bg/70 rounded-2xl" role="status" aria-label="Rebuilding your week">
          <div className="text-center">
            <div className="h-6 w-6 mx-auto animate-spin rounded-full border-2 border-accent border-t-transparent" aria-hidden="true" />
            <p className="mt-3 text-xs text-muted2 animate-pulse">Rebuilding your week…</p>
          </div>
        </div>
      )}
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {hasPrev && (
              <button onClick={goToPrevWeek} className="text-muted2 hover:text-accent transition-colors text-sm">
                ‹
              </button>
            )}
            <p className="text-[10px] tracking-[0.3em] text-accent uppercase">
              Week {displayWeekNum}{isViewingPast ? "" : ` · ${effectiveWeekStart}`}
            </p>
            {hasNext && (
              <button onClick={goToNextWeek} className="text-muted2 hover:text-accent transition-colors text-sm">
                ›
              </button>
            )}
            {isViewingPast && (
              <button onClick={() => setViewingPastIdx(null)}
                className="text-[9px] text-accent border border-accent/30 rounded-full px-2 py-0.5 hover:bg-accent/10 transition-all">
                Current →
              </button>
            )}
          </div>
          <Link href="/app/calendar" className="text-[10px] text-muted2 hover:text-accent transition-colors">
            Calendar →
          </Link>
        </div>
        <h1 className="mt-1 font-display text-2xl tracking-wide text-text">
          {firstName ? `Hi ${firstName}` : "Your Week"}
        </h1>
        {displayWeek._isFallback && (
          <div className="mt-2 rounded-lg border border-[#c49098]/30 bg-[#c49098]/5 px-3 py-2">
            <p className="text-[10px] text-[#c49098] font-display tracking-wider">USING STANDARD PROGRAMME</p>
            <p className="text-[10px] text-muted2 mt-0.5">
              AI personalisation wasn&apos;t available this time. You&apos;ve been given a solid programme based on your goals — it will personalise next week.
            </p>
          </div>
        )}
        <div className="mt-1 flex items-center gap-2">
          <span className="rounded-full bg-surface2 px-2 py-0.5 text-[10px] text-muted2">
            {trainingPhase.label} · Week {trainingPhase.blockWeek}/3
          </span>
        </div>
      </div>

      {/* Tab toggle */}
      {!isViewingPast && (
        <div className="mb-5 flex rounded-full border border-border bg-surface p-0.5">
          <button
            onClick={() => setViewTab("today")}
            className={`flex-1 rounded-full py-1.5 text-[11px] font-medium transition-all ${
              viewTab === "today" ? "bg-accent text-bg" : "text-muted2 hover:text-text"
            }`}
          >
            Today
          </button>
          <button
            onClick={() => setViewTab("week")}
            className={`flex-1 rounded-full py-1.5 text-[11px] font-medium transition-all ${
              viewTab === "week" ? "bg-accent text-bg" : "text-muted2 hover:text-text"
            }`}
          >
            Week
          </button>
        </div>
      )}

      {/* ── TODAY TAB ── */}
      {(viewTab === "today" && !isViewingPast) && (
        <div>
          {/* Cycle phase arc + period quick-log */}
          {phase && (
            <div className="mb-4 rounded-[14px] border border-border bg-surface p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="inline-block w-[7px] h-[7px] rounded-full shrink-0" style={{ background: PHASE_COLORS[phase.phase] }} />
                  <span className="text-xs font-medium" style={{ color: PHASE_COLORS[phase.phase] }}>
                    Day {phase.day}
                  </span>
                  <span className="text-[10px] text-muted2">{phase.label} phase</span>
                </div>
                <button
                  onClick={() => {
                    const today = appTodayISO();
                    const lastLog = cycle.periodLog[cycle.periodLog.length - 1];
                    const type = lastLog?.type === "start" ? "end" : "start";
                    setCycle({
                      ...cycle,
                      periodLog: [...cycle.periodLog, { date: today, type }],
                    });
                    toast(`Period ${type} logged`, "success");
                  }}
                  className="text-[10px] text-accent hover:underline"
                >
                  Log period {cycle.periodLog[cycle.periodLog.length - 1]?.type === "start" ? "end" : "start"}
                </button>
              </div>
              <CycleArc cycleDay={phase.day} cycleLength={cycle.avgLength || 28} logCount={cycle.periodLog.filter(p => p.type === "start").length} />
              <p className="mt-3 text-[10px] text-muted2 font-light leading-relaxed">{phase.trainingNote}</p>
            </div>
          )}
          {cycleType === "regular" && !phase && (
            <div className="mb-4 rounded-[var(--radius-default)] border border-border/50 bg-surface/50 p-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted2">No period logged yet</span>
                <button
                  onClick={() => {
                    const today = appTodayISO();
                    setCycle({
                      ...cycle,
                      periodLog: [...cycle.periodLog, { date: today, type: "start" }],
                    });
                    toast("Period start logged", "success");
                  }}
                  className="text-[10px] text-accent hover:underline"
                >
                  Log period start
                </button>
              </div>
            </div>
          )}

          {/* Gap reentry */}
          {(() => {
            const lastSession = (progressDB.sessions as { date?: string }[]).slice(-1)[0];
            if (lastSession?.date) {
              const daysSince = Math.floor((appTimestamp() - new Date(lastSession.date).getTime()) / (1000 * 60 * 60 * 24));
              if (daysSince >= 7) {
                return (
                  <div className="mb-4 rounded-[var(--radius-default)] border border-accent/30 bg-accent-dim p-4">
                    <p className="text-sm font-medium text-text">Welcome back</p>
                    <p className="text-xs text-muted2 mt-1">
                      It&apos;s been {daysSince} days. {progressDB.sessions.length} session{progressDB.sessions.length > 1 ? "s" : ""} completed so far.
                      No guilt — just pick up where you left off.
                    </p>
                  </div>
                );
              }
            }
            return null;
          })()}

          {/* Week complete celebration — Today tab only */}
          {(() => {
            const trainingDayCount = displayWeek.days.filter((d) => !d.isRest).length;
            if (currentWeekSessions.length >= trainingDayCount && trainingDayCount > 0) {
              const WEEK_COMPLETE_MESSAGES = [
                "Consistency beats intensity. You showed up.",
                "Another week in the book. That's how progress works.",
                "You did the work. Let recovery do the rest.",
                "Week done. Strength isn't built in a day — it's built in weeks like this.",
              ];
              const msg = WEEK_COMPLETE_MESSAGES[(effectiveWeekNum - 1) % WEEK_COMPLETE_MESSAGES.length];
              return (
                <div className="mb-5 rounded-[14px] border border-accent/40 bg-accent-dim p-5 text-center animate-celebrate">
                  <p className="font-display text-[11px] tracking-[3px] text-accent uppercase mb-1">Week {effectiveWeekNum} complete</p>
                  <p className="font-display text-xl tracking-wide text-text">
                    {currentWeekSessions.length} sessions done
                  </p>
                  <p className="mt-2 text-[11px] text-muted2 font-light leading-relaxed max-w-[280px] mx-auto">
                    {msg}
                  </p>
                </div>
              );
            }
            return null;
          })()}

          {/* Running week overview — written summary */}
          {(() => {
            const ws = currentWeekSessions as import("@/store/useKineStore").SessionRecord[];
            if (ws.length === 0) return null;
            const trainingDayCount = displayWeek.days.filter((d) => !d.isRest).length;
            const efforts = ws.map((s) => s.effort).filter((e): e is number => e != null);
            const avgEffort = efforts.length > 0 ? Math.round(efforts.reduce((a, b) => a + b, 0) / efforts.length) : null;
            const soreness = ws.map((s) => s.soreness).filter((s): s is number => s != null);
            const lastSoreness = soreness.length > 0 ? soreness[soreness.length - 1] : null;
            const totalPRs = ws.reduce((sum, s) => sum + (s.prs?.length || 0), 0);

            // Build a written summary
            const parts: string[] = [];

            // Session progress
            if (ws.length >= trainingDayCount) {
              parts.push(`All ${ws.length} sessions done this week.`);
            } else {
              parts.push(`${ws.length} of ${trainingDayCount} sessions done so far.`);
            }

            // Effort
            if (avgEffort != null) {
              const effortPhrases = ["", "Sessions felt light.", "Solid effort across sessions.", "You've been pushing hard.", "All-out intensity this week."];
              parts.push(effortPhrases[avgEffort]);
            }

            // Soreness
            if (lastSoreness != null && lastSoreness >= 3) {
              parts.push(lastSoreness >= 4 ? "Soreness is high — recovery matters today." : "Some soreness building up.");
            }

            // PRs
            if (totalPRs > 0) {
              parts.push(totalPRs === 1 ? "Hit 1 new PR." : `Hit ${totalPRs} new PRs.`);
            }

            return (
              <div className="mb-4 rounded-[14px] border border-border/50 bg-surface/50 p-4">
                <p className="text-[8px] tracking-widest text-accent/60 uppercase mb-2">Week {effectiveWeekNum} so far</p>
                <p className="text-[11px] text-muted2 font-light leading-relaxed">
                  {parts.join(" ")}
                </p>
              </div>
            );
          })()}

          {/* Per-exercise feedback from past sessions, filtered to today's exercises */}
          {(() => {
            const todayDay = displayWeek.days[todayIdx];
            if (todayDay?.isRest) return null;
            const todayExNames = new Set(todayDay.exercises.map((e) => e.name));
            const sessions = progressDB.sessions as import("@/store/useKineStore").SessionRecord[];

            // Collect the most recent feedback for each of today's exercises
            const feedbackItems: { name: string; verdict: string; note: string }[] = [];
            const seen = new Set<string>();
            for (let i = sessions.length - 1; i >= 0; i--) {
              if (sessions[i].weekNum === effectiveWeekNum) continue;
              for (const fb of sessions[i].exerciseFeedback || []) {
                if (todayExNames.has(fb.name) && !seen.has(fb.name)) {
                  seen.add(fb.name);
                  feedbackItems.push(fb);
                }
              }
              if (seen.size >= todayExNames.size) break;
            }
            if (feedbackItems.length === 0) return null;

            const verdictIcons: Record<string, string> = { strong: "💪", solid: "✓", building: "↗", adjust: "⚠" };
            return (
              <div className="mb-4 rounded-[14px] border border-white/[0.06] bg-surface/50 p-4">
                <p className="text-[8px] tracking-widest text-accent/60 uppercase mb-2">From last session</p>
                <div className="flex flex-col gap-1.5">
                  {feedbackItems.map((fb, i) => (
                    <div key={i} className="flex items-start gap-2">
                      <span className="text-xs shrink-0 mt-0.5">{verdictIcons[fb.verdict] || "→"}</span>
                      <div className="min-w-0">
                        <p className="text-xs text-text">{fb.name}</p>
                        <p className="text-[10px] text-muted2 font-light">{fb.note}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })()}

          {/* Rest day OR today's session */}
          {displayWeek.days[todayIdx]?.isRest ? (
            <RestDayHome week={displayWeek} todayIdx={todayIdx} />
          ) : (
            <>
              <AdaptationCard />
              {/* weekCoachNote intentionally omitted here — AdaptationCard
                  is the single source of weekly context on Today view.
                  The coach note still shows on the Week tab below. */}
              {/* Today's session card — compact, matches other days */}
              {(() => {
                const todayDay = displayWeek.days[todayIdx];
                const isCompleted = currentWeekSessions.some((s) => s.dayIdx === todayIdx);
                return (
                  <DayCard
                    day={todayDay} dayIdx={todayIdx}
                    isToday={true}
                    isCompleted={isCompleted}
                    isPast={false}
                    expanded={false}
                    readOnly={false}
                  />
                );
              })()}
            </>
          )}
        </div>
      )}

      {/* For-you Education strip — appears on Today view, not while viewing past weeks */}
      {viewTab === "today" && !isViewingPast && <ForYouEducationStrip />}

      {/* ── WEEK TAB (or past week view) ── */}
      {(viewTab === "week" || isViewingPast) && (
        <div>
          {/* Past week banner */}
          {isViewingPast && (
            <div className="mb-4 rounded-lg border border-muted/20 bg-surface/50 px-4 py-3 text-center">
              <p className="text-[10px] text-muted2">Viewing Week {displayWeekNum} · read-only</p>
            </div>
          )}

          {/* Session completion summary — current week only, compact on Week tab */}
          {!isViewingPast && (() => {
            const trainingDayCount = displayWeek.days.filter((d) => !d.isRest).length;
            if (currentWeekSessions.length < trainingDayCount && trainingDayCount > 0) {
              return (
                <p className="mb-3 text-xs text-muted2">
                  {currentWeekSessions.length}/{trainingDayCount} sessions done this week
                </p>
              );
            }
            if (currentWeekSessions.length >= trainingDayCount && trainingDayCount > 0) {
              return (
                <p className="mb-3 text-xs text-accent/70">
                  All {currentWeekSessions.length} sessions complete this week
                </p>
              );
            }
            return null;
          })()}

          {/* Programme-week streak and journey milestones */}
          {!isViewingPast && <StreakMilestone />}

          {/* All 7 day cards */}
          {(() => {
            const viewWeekNum = isViewingPast ? displayWeekNum : effectiveWeekNum;
            // Calculate Monday of the *viewed* week for date labels
            const monday = isViewingPast && viewingPastIdx !== null
              ? (() => {
                  const now = appNow();
                  const dw = now.getDay() === 0 ? 6 : now.getDay() - 1;
                  const m = new Date(now);
                  m.setDate(now.getDate() - dw);
                  const weeksBack = weekHistory.length - viewingPastIdx;
                  m.setDate(m.getDate() - weeksBack * 7);
                  return m;
                })()
              : getProgrammeWeekMonday(viewWeekNum, progressDB.programStartDate);
            return (
              <div className="flex flex-col gap-2">
                {displayWeek.days.map((day, i) => {
                  const hasSession = isViewingPast
                    ? (progressDB.sessions as { weekNum?: number; dayIdx?: number }[])
                        .some((s) => s.weekNum === viewWeekNum && s.dayIdx === i)
                    : currentWeekSessions.some((s) => s.dayIdx === i);
                  const isCompleted = hasSession;
                  const dayDate = new Date(monday);
                  dayDate.setDate(monday.getDate() + i);
                  const dateLabel = dayDate.toLocaleDateString(undefined, { day: "numeric", month: "short" });
                  return (
                    <DayCard
                      key={i} day={day} dayIdx={i}
                      isToday={!isViewingPast && i === todayIdx}
                      isCompleted={isCompleted}
                      isPast={isViewingPast || i < todayIdx}
                      expanded={false}
                      readOnly={isViewingPast}
                      dateStr={dateLabel}
                      weekNum={viewWeekNum}
                    />
                  );
                })}
              </div>
            );
          })()}

          {/* Next week preview — only when the displayed week's sessions are all done */}
          {!isViewingPast && (() => {
            const trainingDayCount = displayWeek.days.filter((d) => !d.isRest).length;
            if (currentWeekSessions.length >= trainingDayCount && trainingDayCount > 0) {
              const nextWeekNum = effectiveWeekNum + 1;
              const nextPhase = getCurrentPhaseInfo(nextWeekNum, progressDB.phaseOffset);
              return (
                <div className="mt-6 rounded-[14px] border border-border/50 bg-surface/50 p-4 text-center">
                  <p className="font-display text-[9px] tracking-[2px] text-muted uppercase mb-1">Up next</p>
                  <p className="font-display text-lg tracking-wide text-text">Week {nextWeekNum}</p>
                  <p className="mt-1 text-[10px] text-muted2">{nextPhase.label} · {nextPhase.description}</p>
                  <Button variant="secondary" size="sm" className="mt-3" onClick={onAdvanceWeek} disabled={loading}>
                    Build Week {nextWeekNum} →
                  </Button>
                </div>
              );
            }
            return null;
          })()}

          {/* Actions — hidden when viewing past weeks (read-only) */}
          {!isViewingPast && (() => {
            const trainingDayCount = displayWeek.days.filter((d) => !d.isRest).length;
            const allDone = trainingDayCount > 0 && currentWeekSessions.length >= trainingDayCount;
            return (
              <div className="mt-8 flex flex-wrap justify-center gap-3">
                <Link href="/app/week-checkin" className="inline-flex items-center rounded-[var(--radius-default)] px-3 py-1.5 text-xs text-muted2 hover:text-text hover:bg-surface2 transition-all">
                  Check-in
                </Link>
                <Button variant="ghost" size="sm" onClick={() => setShowRearrange(true)} disabled={allDone}>
                  Rearrange
                </Button>
                <Button variant="ghost" size="sm" onClick={onRebuild} disabled={loading || allDone}>
                  {loading ? "Rebuilding…" : "Regenerate"}
                </Button>
                <Link href="/app/sandbox" className="inline-flex items-center rounded-[var(--radius-default)] px-3 py-1.5 text-xs text-muted2 hover:text-text hover:bg-surface2 transition-all">
                  {allDone ? "Design Next Week" : "Design Week"}
                </Link>
              </div>
            );
          })()}
        </div>
      )}

      <SessionRearrange open={showRearrange} onClose={() => setShowRearrange(false)} />

      {/* Health disclaimer */}
      <p className="mt-6 text-center text-[10px] text-muted leading-relaxed">
        Kinē provides fitness guidance, not medical advice.
        Consult your doctor before starting any exercise programme.
      </p>

    </div>
  );
}

// ── Day Card ──

// ── Rest day recovery messages ──
const REST_DAY_MESSAGES = [
  "Your muscles grow during rest, not during training.",
  "Recovery is where the work becomes results.",
  "Active recovery — a walk, stretch, or gentle movement helps.",
  "Sleep and nutrition do the heavy lifting today.",
  "Rest days prevent injury and keep you consistent long-term.",
  "Trust the process — rest is part of the programme.",
];

function getRestMessage(dayIdx: number): string {
  return REST_DAY_MESSAGES[dayIdx % REST_DAY_MESSAGES.length];
}

function DayCard({ day, dayIdx, isToday, isCompleted = false, isPast = false, expanded = false, readOnly = false, dateStr, weekNum }: {
  day: WeekDay; dayIdx: number; isToday: boolean; isCompleted?: boolean; isPast?: boolean; expanded?: boolean; readOnly?: boolean; dateStr?: string; weekNum?: number;
}) {
  const router = useRouter();
  const { progressDB, setProgressDB } = useKineStore();
  const [showSessionReview, setShowSessionReview] = useState(false);
  const dayLabel = DAY_LABELS[(day.dayNumber - 1) % 7];

  // Find completed session log for this day
  const wk = weekNum ?? (progressDB.currentWeek || 1);
  const completedSession = isCompleted
    ? (progressDB.sessions as { weekNum?: number; dayIdx?: number; date?: string; logs?: Record<number, { name: string; actual: { reps: string; weight: string }[]; note?: string; saved?: boolean }>; effort?: number; soreness?: number; title?: string }[])
        .find((s) => s.weekNum === wk && s.dayIdx === dayIdx)
    : null;

  if (day.isRest) {
    return (
      <div
        className={`rounded-[14px] border px-[18px] py-3 transition-all ${
          isToday ? "border-accent/30 bg-accent-dim"
          : isPast ? "border-border/30 bg-surface/30 opacity-60"
          : "border-border/50 bg-surface/50"
        }`}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-muted2">{dayLabel}{dateStr && <span className="text-muted font-light ml-1">{dateStr}</span>}</span>
            {isToday && (
              <span className="rounded-full bg-accent/20 px-2 py-0.5 text-[10px] text-accent">
                Today
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted">Rest & Recovery</span>
            {!isPast && (
              <button
                onClick={() => router.push(`/app/custom-builder?day=${dayIdx}`)}
                className="text-[10px] text-muted2 hover:text-accent transition-colors"
              >
                + add session
              </button>
            )}
          </div>
        </div>
        {/* #9: Rest day recovery message */}
        {(isToday || (!isPast && expanded)) && (
          <p className="mt-2 text-[10px] text-muted font-light leading-relaxed">
            {getRestMessage(dayIdx)}
          </p>
        )}
      </div>
    );
  }

  // Past uncompleted days: show minimal collapsed card (not the full workout)
  if (isPast && !isCompleted && !isToday && !readOnly) {
    return (
      <div className="rounded-[14px] border border-border/30 bg-surface/30 opacity-60 px-[18px] py-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-muted2">{dayLabel}{dateStr && <span className="text-muted font-light ml-1">{dateStr}</span>}</span>
          <span className="text-xs text-muted">No session logged</span>
        </div>
      </div>
    );
  }

  // Read-only past view: if the day has no exercises (stale archived data), collapse it
  if (readOnly && !day.isRest && (!day.exercises || day.exercises.length === 0)) {
    return (
      <div className="rounded-[14px] border border-border/30 bg-surface/30 opacity-60 px-[18px] py-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-muted2">{dayLabel}{dateStr && <span className="text-muted font-light ml-1">{dateStr}</span>}</span>
          <span className="text-xs text-muted">{isCompleted ? "Session logged" : "No session logged"}</span>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`rounded-[14px] border p-[18px] transition-all active:scale-[0.98] ${
        isCompleted ? "border-accent/30 bg-accent-dim/30"
        : isToday ? "border-accent bg-surface"
        : isPast ? "border-border/50 bg-surface/50 opacity-60"
        : "border-border bg-surface hover:border-border-active"
      }`}
    >
      {/* Day header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-muted2">{dayLabel}{dateStr && <span className="text-muted font-light ml-1">{dateStr}</span>}</span>
          {isToday && (
            <span className="rounded-full bg-accent/20 px-2.5 py-0.5 text-[10px] font-medium text-accent tracking-wide">
              Today
            </span>
          )}
          {isCompleted && (
            <span className="rounded-full bg-accent/20 px-2.5 py-0.5 text-[10px] font-medium text-accent tracking-wide">
              ✓ done
            </span>
          )}
        </div>
        <span className="font-display text-[9px] tracking-[2px] text-muted uppercase">{day.sessionDuration}</span>
      </div>

      {/* Title */}
      <h3 className="mt-2 font-display text-lg tracking-wide text-text" style={{ fontSize: 'clamp(18px, 5vw, 22px)' }}>
        {day.sessionTitle}
      </h3>

      {/* Collapsed: summary with context */}
      {!expanded && (
        <div className="mt-1.5">
          <div className="flex items-center justify-between">
            <p className="text-[11px] text-muted2 font-light truncate flex-1">
              {day.exercises.length} exercises · {day.sessionDuration}
            </p>
            {!readOnly && (
              <button onClick={() => router.push(`/app/pre-session?day=${dayIdx}`)}
                className="text-[10px] text-accent hover:underline shrink-0 ml-2">View →</button>
            )}
          </div>
          {day.coachNote && (
            <p className="mt-1.5 text-[10px] text-muted font-light leading-relaxed truncate">{day.coachNote}</p>
          )}
          <div className="mt-2 flex flex-wrap gap-1">
            {day.exercises.slice(0, 3).map((ex, i) => (
              <span key={i} className="inline-flex items-center gap-1 text-[9px] text-muted2 bg-surface2/50 rounded px-1.5 py-0.5">
                <span className="inline-block w-1.5 h-1.5 rounded-full shrink-0" style={{ background: getCategoryColor(ex.name) }} />
                {ex.name}
              </span>
            ))}
            {day.exercises.length > 3 && (
              <span className="text-[9px] text-muted">+{day.exercises.length - 3}</span>
            )}
          </div>
        </div>
      )}

      {/* Expanded: full details */}
      {expanded && (
        <>
          {day.coachNote && <p className="mt-1.5 text-xs text-muted2 leading-relaxed">{day.coachNote}</p>}
          {(day.sessionWhy || day.sessionContext) && (
            <div className="mt-2.5 border-l-2 border-accent/60 pl-3">
              <div className="text-[9px] tracking-[0.15em] uppercase text-accent/80 font-medium mb-1">
                Why this session
              </div>
              <p className="text-[11px] text-muted2 font-light leading-relaxed italic">
                {day.sessionWhy || day.sessionContext}
              </p>
            </div>
          )}
          <div className="mt-3 flex flex-col gap-1.5">
            {day.exercises.map((ex, i) => (
              <div key={i} className="flex items-center justify-between text-xs">
                <span className="flex items-center gap-1.5 text-text/80">
                  <span className="inline-block w-1.5 h-1.5 rounded-full shrink-0" style={{ background: getCategoryColor(ex.name) }} />
                  {ex.name}
                </span>
                <span className="text-muted font-light">{ex.sets}×{ex.reps}</span>
              </div>
            ))}
          </div>
          {!readOnly && (
            <div className="mt-4 flex gap-2">
              {isCompleted ? (
                <>
                  <Button className="flex-1" size="sm" variant="secondary"
                    onClick={() => setShowSessionReview(true)}>
                    View results
                  </Button>
                  <Button className="flex-1" size="sm" variant="ghost"
                    onClick={() => router.push(`/app/pre-session?day=${dayIdx}`)}>
                    Redo
                  </Button>
                </>
              ) : (
                <Button className="w-full" size="sm" variant={isToday ? "primary" : "secondary"}
                  onClick={() => router.push(`/app/pre-session?day=${dayIdx}`)}>
                  {isToday ? "Start session" : isPast ? "Start session" : "Preview & edit"}
                </Button>
              )}
            </div>
          )}
        </>
      )}

      {/* #6: Session replay/amendment bottom sheet */}
      {completedSession && (
        <SessionReviewSheet
          open={showSessionReview}
          onClose={() => setShowSessionReview(false)}
          session={completedSession}
          dayIdx={dayIdx}
        />
      )}
    </div>
  );
}

// ── Session Review/Edit Sheet ──

function SessionReviewSheet({ open, onClose, session, dayIdx }: {
  open: boolean;
  onClose: () => void;
  session: { logs?: Record<number, { name: string; actual: { reps: string; weight: string }[]; note?: string; saved?: boolean }>; effort?: number; soreness?: number; title?: string; weekNum?: number; dayIdx?: number };
  dayIdx: number;
}) {
  const { progressDB, setProgressDB, measurementSystem } = useKineStore();
  const unit = weightUnit(measurementSystem || "metric");
  const [editing, setEditing] = useState(false);
  const [editLogs, setEditLogs] = useState<Record<string, { reps: string; weight: string }[]>>({});

  const logs = session.logs || {};
  const effortLabels = ["", "Too easy", "Moderate", "Hard", "Max effort"];
  const sorenessLabels = ["", "Fresh", "A little sore", "Pretty sore", "Beat up"];

  function startEdit() {
    const initial: Record<string, { reps: string; weight: string }[]> = {};
    Object.entries(logs).forEach(([key, ex]) => {
      initial[key] = ex.actual.map((s) => ({ reps: s.reps, weight: s.weight }));
    });
    setEditLogs(initial);
    setEditing(true);
  }

  function saveEdits() {
    // Update the session in progressDB
    const updatedSessions = progressDB.sessions.map((s) => {
      const sess = s as { weekNum?: number; dayIdx?: number; logs?: Record<number, unknown> };
      if (sess.weekNum === session.weekNum && sess.dayIdx === session.dayIdx) {
        const updatedLogs = { ...sess.logs };
        Object.entries(editLogs).forEach(([key, sets]) => {
          const existing = (updatedLogs as Record<string, { name: string; actual: { reps: string; weight: string }[] }>)[key];
          if (existing) {
            (updatedLogs as Record<string, { name: string; actual: { reps: string; weight: string }[] }>)[key] = { ...existing, actual: sets };
          }
        });
        return { ...sess, logs: updatedLogs };
      }
      return s;
    });

    setProgressDB({ ...progressDB, sessions: updatedSessions });
    setEditing(false);
    toast("Session updated", "success");
  }

  return (
    <BottomSheet open={open} onClose={onClose} title={session.title || "Session Review"}>
      <div className="flex items-center gap-3 mb-4">
        <span className="text-xs text-muted2">
          Effort: <span className="text-text">{effortLabels[session.effort || 0]}</span>
        </span>
        <span className="text-xs text-muted2">
          Feeling: <span className="text-text">{sorenessLabels[session.soreness || 0]}</span>
        </span>
      </div>

      <div className="flex flex-col gap-3">
        {Object.entries(logs).map(([key, ex]) => {
          if (!ex.saved && ex.actual.length === 0) return null;
          const skipped = ex.saved && ex.actual.length === 0;

          return (
            <div key={key} className="rounded-lg border border-border bg-bg p-3">
              <p className={`text-sm font-medium mb-1.5 ${skipped ? "text-muted line-through" : "text-text"}`}>
                {ex.name}
              </p>
              {skipped ? (
                <span className="text-[10px] text-muted">Skipped</span>
              ) : editing ? (
                <div className="flex flex-col gap-1.5">
                  {(editLogs[key] || ex.actual).map((set, i) => (
                    <div key={i} className="flex items-center gap-2 text-xs">
                      <span className="text-muted w-10">Set {i + 1}</span>
                      <input
                        type="number" inputMode="numeric" placeholder="reps"
                        value={(editLogs[key]?.[i]?.reps) || ""}
                        onChange={(e) => {
                          const updated = { ...editLogs };
                          if (!updated[key]) updated[key] = ex.actual.map(s => ({ ...s }));
                          updated[key][i] = { ...updated[key][i], reps: e.target.value };
                          setEditLogs(updated);
                        }}
                        className="w-14 rounded border border-border bg-surface px-2 py-1 text-center text-xs text-text outline-none focus:border-accent"
                      />
                      <span className="text-muted">x</span>
                      <input
                        type="number" inputMode="decimal" placeholder={unit}
                        value={(editLogs[key]?.[i]?.weight) || ""}
                        onChange={(e) => {
                          const updated = { ...editLogs };
                          if (!updated[key]) updated[key] = ex.actual.map(s => ({ ...s }));
                          updated[key][i] = { ...updated[key][i], weight: e.target.value };
                          setEditLogs(updated);
                        }}
                        className="w-14 rounded border border-border bg-surface px-2 py-1 text-center text-xs text-text outline-none focus:border-accent"
                      />
                      <span className="text-[10px] text-muted">{unit}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col gap-0.5">
                  {ex.actual.filter((s) => s.reps || s.weight).map((set, i) => (
                    <span key={i} className="text-xs text-muted2">
                      Set {i + 1}: {set.reps} reps x {set.weight || "BW"} {unit}
                    </span>
                  ))}
                </div>
              )}
              {ex.note && !editing && (
                <p className="mt-1 text-[10px] text-muted italic">{ex.note}</p>
              )}
            </div>
          );
        })}
      </div>

      <div className="mt-4 flex gap-2">
        {editing ? (
          <>
            <Button size="sm" className="flex-1" onClick={saveEdits}>Save changes</Button>
            <Button size="sm" variant="ghost" className="flex-1" onClick={() => setEditing(false)}>Cancel</Button>
          </>
        ) : (
          <Button size="sm" variant="secondary" className="w-full" onClick={startEdit}>Edit session log</Button>
        )}
      </div>
    </BottomSheet>
  );
}

// ── Helpers ──

/** Monday of a given programme week (1-indexed). Falls back to calendar week if no start date. */
function getProgrammeWeekMonday(weekNum: number, programStartDate: string | null): Date {
  if (programStartDate) {
    const start = new Date(programStartDate);
    // Find the Monday of the week containing programStartDate
    const startDay = start.getDay();
    const startMonday = new Date(start);
    startMonday.setDate(start.getDate() - (startDay === 0 ? 6 : startDay - 1));
    // Advance by (weekNum - 1) weeks
    const monday = new Date(startMonday);
    monday.setDate(startMonday.getDate() + (weekNum - 1) * 7);
    return monday;
  }
  // Fallback: current calendar week
  const now = appNow();
  const day = now.getDay();
  const monday = new Date(now);
  monday.setDate(now.getDate() - (day === 0 ? 6 : day - 1));
  return monday;
}

function getWeekDateRange(weekNum?: number, programStartDate?: string | null): string {
  const monday = weekNum != null
    ? getProgrammeWeekMonday(weekNum, programStartDate ?? null)
    : (() => { const now = appNow(); const d = now.getDay(); const m = new Date(now); m.setDate(now.getDate() - (d === 0 ? 6 : d - 1)); return m; })();
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);

  const locale = detectLocale();
  const fmt = (d: Date) =>
    d.toLocaleDateString(locale, { day: "numeric", month: "short" });

  return `${fmt(monday)}–${fmt(sunday)}`;
}

/** Get ISO date strings for the current week's Monday and Sunday */
function getCurrentWeekBounds(): { mondayISO: string; sundayISO: string } {
  const now = appNow();
  const day = now.getDay();
  const monday = new Date(now);
  monday.setDate(now.getDate() - (day === 0 ? 6 : day - 1));
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  return {
    mondayISO: monday.toISOString().slice(0, 10),
    sundayISO: sunday.toISOString().slice(0, 10),
  };
}

/** Check if a session date falls within the current calendar week */
function isInCurrentWeek(sessionDate: string | undefined): boolean {
  if (!sessionDate) return false;
  const { mondayISO, sundayISO } = getCurrentWeekBounds();
  return sessionDate >= mondayISO && sessionDate <= sundayISO;
}
