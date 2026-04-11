"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useKineStore, type AdaptationItem, type NextWeekPrefs } from "@/store/useKineStore";
import { buildWeek } from "@/lib/week-builder";
import type { WeekData } from "@/lib/week-builder";
import { getCurrentPhaseInfo } from "@/lib/periodisation";
import Button from "@/components/Button";
import { toast } from "@/components/Toast";

const DAY_NAMES = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

const DURATION_OPTIONS = [30, 45, 60, 75, 90];

const SOURCE_COLOURS: Record<AdaptationItem["source"], string> = {
  insight: "bg-blue-400",
  rating: "bg-amber-400",
  periodisation: "bg-purple-400",
  cycle: "bg-pink-400",
  condition: "bg-red-400",
  activity: "bg-green-400",
};

const LOADING_MESSAGES = [
  "Reviewing your check-in…",
  "Building your session structure…",
  "Selecting exercises for your equipment…",
  "Balancing volume and recovery…",
  "Finalising your programme…",
];

interface DayConfig {
  isGym: boolean;
  duration: number; // minutes
}

export default function BuildWeekPage() {
  const router = useRouter();
  const store = useKineStore();
  const { progressDB, trainingDays, dayDurations, duration } = store;

  const [step, setStep] = useState<"review" | "schedule" | "confirm" | "building">("review");
  const [loading, setLoading] = useState(false);
  const [loadingMsg, setLoadingMsg] = useState(0);
  const [buildError, setBuildError] = useState<string | null>(null);
  const [nwFlagNote, setNwFlagNote] = useState("");

  const currentWeek = progressDB.currentWeek || 1;
  const allSessions = progressDB.sessions as { weekNum?: number }[];
  const latestSessionWeek = allSessions.length > 0
    ? allSessions[allSessions.length - 1].weekNum || currentWeek
    : currentWeek;
  const checkinWeek = latestSessionWeek;
  const nextWeekNum = checkinWeek + 1;
  const nextPhase = getCurrentPhaseInfo(nextWeekNum, progressDB.phaseOffset);

  // Default duration from profile
  const defaultDuration = duration === "short" ? 30 : duration === "medium" ? 45 : duration === "long" ? 60 : duration === "extended" ? 90 : 60;

  // Build initial day config from current profile settings
  const buildInitialConfig = (): DayConfig[] =>
    DAY_NAMES.map((_, i) => ({
      isGym: trainingDays.includes(i),
      duration: dayDurations[i] || defaultDuration,
    }));

  const [dayConfigs, setDayConfigs] = useState<DayConfig[]>(buildInitialConfig);

  // Get check-in data
  const checkin = progressDB.weekFeedbackHistory.find(
    (f) => f.weekNum === checkinWeek
  );

  if (!checkin) {
    return (
      <div>
        <button onClick={() => router.push("/app")} className="text-xs text-muted2 hover:text-text transition-colors">
          ← Back
        </button>
        <div className="flex min-h-[50vh] flex-col items-center justify-center text-center">
          <h2 className="font-display text-xl tracking-wide text-text">Check-in required</h2>
          <p className="mt-2 text-xs text-muted2 max-w-xs">
            Complete your weekly check-in before building next week.
          </p>
          <Button className="mt-6" onClick={() => router.push("/app")}>
            Back to dashboard
          </Button>
        </div>
      </div>
    );
  }

  const adaptations = checkin.adaptationPlan?.adaptations || [];
  const enabledAdaptations = adaptations.filter((a) => a.enabled);

  // Derived stats for confirmation
  const gymDays = dayConfigs.filter((d) => d.isGym);
  const totalMinutes = gymDays.reduce((sum, d) => sum + d.duration, 0);
  const scheduleChanged = JSON.stringify(dayConfigs) !== JSON.stringify(buildInitialConfig());

  function toggleDay(idx: number) {
    setDayConfigs((prev) =>
      prev.map((d, i) => i === idx ? { ...d, isGym: !d.isGym } : d)
    );
  }

  function setDuration(idx: number, mins: number) {
    setDayConfigs((prev) =>
      prev.map((d, i) => i === idx ? { ...d, duration: mins } : d)
    );
  }

  async function handleBuild() {
    setStep("building");
    setLoading(true);
    setBuildError(null);
    setLoadingMsg(0);

    // Save schedule changes and prefs
    const newTrainingDays = dayConfigs.map((d, i) => d.isGym ? i : -1).filter((i) => i >= 0);
    const newDayDurations: Record<number, number> = {};
    dayConfigs.forEach((d, i) => {
      if (d.isGym) newDayDurations[i] = d.duration;
    });

    // Update profile with new schedule
    store.setTrainingDays(newTrainingDays);
    store.setDayDurations(newDayDurations);
    store.setDays(String(newTrainingDays.length));

    // Save prefs to check-in
    const prefs: NextWeekPrefs = {
      daysOverride: scheduleChanged ? newTrainingDays.length : undefined,
      flagNote: nwFlagNote.trim() || undefined,
    };
    const updated = store.progressDB.weekFeedbackHistory.map((f) =>
      f.weekNum === checkinWeek ? { ...f, nextWeekPrefs: prefs } : f
    );
    store.setProgressDB({ ...store.progressDB, weekFeedbackHistory: updated });

    // Advance week number
    store.setProgressDB({
      ...store.progressDB,
      currentWeek: nextWeekNum,
    });

    // Build
    const msgInterval = setInterval(() => {
      setLoadingMsg((prev) => (prev + 1) % LOADING_MESSAGES.length);
    }, 3000);

    const result = await buildWeek();
    clearInterval(msgInterval);

    if (result.weekData) {
      store.setWeekData(result.weekData);
    }

    if (!result.success && result.error) {
      setBuildError(result.error);
      setLoading(false);
      setStep("schedule");
    } else {
      if (result.repairsCount && result.repairsCount > 0) {
        toast(
          result.repairsCount === 1
            ? "1 exercise adapted for your setup"
            : `${result.repairsCount} exercises adapted for your setup`,
          "info",
        );
      }
      router.push("/app");
    }
  }

  return (
    <div>
      <button onClick={() => router.push("/app")} className="text-xs text-muted2 hover:text-text transition-colors">
        ← Back
      </button>

      {/* Step 1: Review adaptations from check-in */}
      {step === "review" && (
        <div className="animate-fade-up">
          <h1 className="mt-4 font-display text-2xl tracking-wide text-accent">
            Building Week {nextWeekNum}
          </h1>
          <p className="mt-1 text-[10px] text-muted font-display tracking-wider">
            {nextPhase.label} · {nextPhase.description}
          </p>

          <h2 className="mt-6 text-xs tracking-wider text-muted uppercase">
            Based on your check-in
          </h2>

          {enabledAdaptations.length > 0 ? (
            <div className="mt-3 flex flex-col gap-2">
              {enabledAdaptations.map((item) => (
                <div
                  key={item.id}
                  className="flex items-start gap-3 rounded-xl border border-border bg-surface p-3"
                >
                  <span className={`mt-0.5 h-2 w-2 flex-shrink-0 rounded-full ${SOURCE_COLOURS[item.source]}`} />
                  <span className="text-xs leading-relaxed text-text">{item.label}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="mt-3 text-xs text-muted2">No specific adaptations — continuing with your current programme progression.</p>
          )}

          {checkin.notes && (
            <div className="mt-4 border-l-2 border-accent/30 pl-3">
              <p className="text-[10px] text-muted uppercase tracking-wider mb-1">Your notes</p>
              <p className="text-xs text-muted2 font-light italic leading-relaxed">{checkin.notes}</p>
            </div>
          )}

          <Button className="w-full mt-6" size="lg" onClick={() => setStep("schedule")}>
            Continue
          </Button>
        </div>
      )}

      {/* Step 2: Day-by-day schedule editor */}
      {step === "schedule" && (
        <div className="animate-fade-up">
          <h2 className="mt-4 font-display text-xl tracking-wide text-text">Your schedule</h2>
          <p className="mt-1 text-xs text-muted2">
            Tap a day to toggle rest/gym. Adjust duration for gym days.
          </p>

          {buildError && (
            <div className="mt-4 rounded-xl border border-warning/30 bg-warning/5 p-3">
              <p className="text-xs text-warning">{buildError}</p>
            </div>
          )}

          <div className="mt-5 flex flex-col gap-2">
            {dayConfigs.map((config, i) => (
              <div
                key={i}
                className={`rounded-xl border p-3 transition-all ${
                  config.isGym ? "border-accent/40 bg-accent-dim" : "border-border bg-surface"
                }`}
              >
                <div className="flex items-center justify-between">
                  <button
                    onClick={() => toggleDay(i)}
                    className="flex items-center gap-3 flex-1 text-left"
                  >
                    <span className={`text-sm font-medium ${config.isGym ? "text-text" : "text-muted2"}`}>
                      {DAY_NAMES[i]}
                    </span>
                    <span className={`text-[10px] rounded-full px-2 py-0.5 ${
                      config.isGym
                        ? "bg-accent/20 text-accent"
                        : "bg-surface2 text-muted2"
                    }`}>
                      {config.isGym ? "Gym" : "Rest"}
                    </span>
                  </button>

                  {config.isGym && (
                    <div className="flex gap-1">
                      {DURATION_OPTIONS.map((mins) => (
                        <button
                          key={mins}
                          onClick={() => setDuration(i, mins)}
                          className={`rounded-lg px-2 py-1 text-[10px] transition-all ${
                            config.duration === mins
                              ? "bg-accent text-bg font-medium"
                              : "bg-surface2 text-muted2 hover:text-text"
                          }`}
                        >
                          {mins}m
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Flag note */}
          <div className="mt-5">
            <p className="mb-2 text-xs tracking-wider text-muted uppercase">Anything to flag?</p>
            <textarea
              value={nwFlagNote}
              onChange={(e) => setNwFlagNote(e.target.value)}
              aria-label="Next week notes"
              placeholder="e.g. travelling Wed–Fri, lower back still tight, 5k race on Saturday..."
              rows={2}
              className="w-full rounded-xl border border-border bg-surface px-3 py-2 text-sm text-text placeholder:text-muted outline-none focus:border-accent resize-none"
            />
          </div>

          <Button className="w-full mt-6" size="lg" onClick={() => setStep("confirm")}>
            Continue
          </Button>
        </div>
      )}

      {/* Step 3: Confirmation */}
      {step === "confirm" && (
        <div className="animate-fade-up">
          <h2 className="mt-4 font-display text-xl tracking-wide text-text">Ready to build</h2>

          <div className="mt-6 rounded-xl border border-border bg-surface p-4">
            <div className="grid grid-cols-2 gap-4 text-center">
              <div>
                <p className="font-display text-2xl text-accent">{gymDays.length}</p>
                <p className="text-[9px] text-muted uppercase tracking-wider mt-0.5">Sessions</p>
              </div>
              <div>
                <p className="font-display text-2xl text-accent">{totalMinutes}</p>
                <p className="text-[9px] text-muted uppercase tracking-wider mt-0.5">Total minutes</p>
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-border/30">
              <div className="flex flex-wrap gap-2 justify-center">
                {dayConfigs.map((config, i) => (
                  <span
                    key={i}
                    className={`rounded-full px-2.5 py-1 text-[10px] ${
                      config.isGym
                        ? "bg-accent/15 text-accent font-medium"
                        : "bg-surface2 text-muted2"
                    }`}
                  >
                    {DAY_NAMES[i]}{config.isGym ? ` · ${config.duration}m` : ""}
                  </span>
                ))}
              </div>
            </div>

            {scheduleChanged && (
              <p className="mt-3 text-[10px] text-accent text-center">Schedule updated for this week</p>
            )}
          </div>

          {nwFlagNote.trim() && (
            <div className="mt-3 border-l-2 border-accent/30 pl-3">
              <p className="text-[10px] text-muted uppercase tracking-wider mb-1">Flagged</p>
              <p className="text-xs text-muted2 font-light italic">{nwFlagNote}</p>
            </div>
          )}

          <Button className="w-full mt-6" size="lg" onClick={handleBuild} disabled={loading}>
            Build Week {nextWeekNum} →
          </Button>
          <button
            onClick={() => setStep("schedule")}
            className="w-full mt-2 py-2 text-xs text-muted2 hover:text-text transition-colors"
          >
            ← Edit schedule
          </button>
        </div>
      )}

      {/* Building state */}
      {step === "building" && (
        <div className="animate-fade-up flex min-h-[50vh] flex-col items-center justify-center text-center">
          <div className="h-8 w-8 mx-auto animate-spin rounded-full border-2 border-accent border-t-transparent" />
          <p className="mt-4 text-sm text-muted2 animate-pulse">
            {LOADING_MESSAGES[loadingMsg]}
          </p>
        </div>
      )}
    </div>
  );
}
