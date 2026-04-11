"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useKineStore, type AdaptationItem, type NextWeekPrefs } from "@/store/useKineStore";
import { buildWeek } from "@/lib/week-builder";
import type { WeekData } from "@/lib/week-builder";
import { getCurrentPhaseInfo } from "@/lib/periodisation";
import Button from "@/components/Button";
import { toast } from "@/components/Toast";

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

export default function BuildWeekPage() {
  const router = useRouter();
  const store = useKineStore();
  const { progressDB, setProgressDB, days } = store;

  const [step, setStep] = useState<"review" | "prefs" | "building">("review");
  const [loading, setLoading] = useState(false);
  const [loadingMsg, setLoadingMsg] = useState(0);
  const [buildError, setBuildError] = useState<string | null>(null);

  // Next week preferences
  const plannedDays = parseInt(days || "3");
  const [nwDays, setNwDays] = useState<number | null>(null);
  const [nwSessionLength, setNwSessionLength] = useState<"shorter" | "same" | "longer">("same");
  const [nwIntensity, setNwIntensity] = useState<"lighter" | "maintain" | "push">("maintain");
  const [nwFlagNote, setNwFlagNote] = useState("");

  const currentWeek = progressDB.currentWeek || 1;
  const nextWeekNum = currentWeek + 1;
  const nextPhase = getCurrentPhaseInfo(nextWeekNum, progressDB.phaseOffset);

  // Get check-in data for the current week
  const checkin = progressDB.weekFeedbackHistory.find(
    (f) => f.weekNum === currentWeek
  );

  // If no check-in exists, redirect back
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

  async function handleBuild() {
    setStep("building");
    setLoading(true);
    setBuildError(null);
    setLoadingMsg(0);

    // Save next week prefs to the check-in
    const hasPrefs = nwDays !== null || nwSessionLength !== "same" || nwIntensity !== "maintain" || nwFlagNote.trim();
    if (hasPrefs) {
      const prefs: NextWeekPrefs = {
        daysOverride: nwDays ?? undefined,
        sessionLength: nwSessionLength !== "same" ? nwSessionLength : undefined,
        intensity: nwIntensity !== "maintain" ? nwIntensity : undefined,
        flagNote: nwFlagNote.trim() || undefined,
      };
      // Update the check-in with prefs
      const updated = progressDB.weekFeedbackHistory.map((f) =>
        f.weekNum === currentWeek ? { ...f, nextWeekPrefs: prefs } : f
      );
      store.setProgressDB({ ...progressDB, weekFeedbackHistory: updated });
    }

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
      setStep("prefs");
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

          <Button className="w-full mt-6" size="lg" onClick={() => setStep("prefs")}>
            Continue
          </Button>
        </div>
      )}

      {/* Step 2: Quick schedule preferences */}
      {step === "prefs" && (
        <div className="animate-fade-up">
          <h2 className="mt-4 font-display text-xl tracking-wide text-text">Anything changed?</h2>
          <p className="mt-1 text-xs text-muted2">
            All optional — skip if everything stays the same.
          </p>

          {buildError && (
            <div className="mt-4 rounded-xl border border-warning/30 bg-warning/5 p-3">
              <p className="text-xs text-warning">{buildError}</p>
            </div>
          )}

          {/* Training days */}
          <div className="mt-6">
            <p className="mb-2 text-xs tracking-wider text-muted uppercase">Training days</p>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  onClick={() => setNwDays(nwDays === n ? null : n)}
                  className={`flex-1 rounded-xl border py-3 text-sm font-medium transition-all ${
                    nwDays === n
                      ? "border-accent bg-accent-dim text-text"
                      : n === plannedDays && nwDays === null
                        ? "border-accent/30 bg-surface text-text"
                        : "border-border bg-surface text-muted2 hover:border-border-active"
                  }`}
                >
                  {n}
                </button>
              ))}
            </div>
            <p className="mt-1 text-[10px] text-muted2">
              {nwDays === null ? `Currently ${plannedDays} days` : nwDays === plannedDays ? `Same as usual (${plannedDays})` : `Changed from ${plannedDays} to ${nwDays}`}
            </p>
          </div>

          {/* Session length */}
          <div className="mt-6">
            <p className="mb-2 text-xs tracking-wider text-muted uppercase">Session length</p>
            <div className="grid grid-cols-3 gap-2">
              {([["shorter", "Shorter"], ["same", "Same"], ["longer", "Longer"]] as const).map(([val, label]) => (
                <button
                  key={val}
                  onClick={() => setNwSessionLength(val)}
                  className={`rounded-xl border py-3 text-xs transition-all ${
                    nwSessionLength === val ? "border-accent bg-accent-dim text-text" : "border-border bg-surface text-muted2 hover:border-border-active"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Intensity */}
          <div className="mt-6">
            <p className="mb-2 text-xs tracking-wider text-muted uppercase">Intensity</p>
            <div className="grid grid-cols-3 gap-2">
              {([["lighter", "Lighter"], ["maintain", "Maintain"], ["push", "Push harder"]] as const).map(([val, label]) => (
                <button
                  key={val}
                  onClick={() => setNwIntensity(val)}
                  className={`rounded-xl border py-3 text-xs transition-all ${
                    nwIntensity === val ? "border-accent bg-accent-dim text-text" : "border-border bg-surface text-muted2 hover:border-border-active"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Flag note */}
          <div className="mt-6">
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

          <Button className="w-full mt-6" size="lg" onClick={handleBuild} disabled={loading}>
            Build Week {nextWeekNum} →
          </Button>
          <button
            onClick={handleBuild}
            disabled={loading}
            className="w-full mt-2 py-2 text-xs text-muted2 hover:text-text transition-colors disabled:opacity-50"
          >
            Skip — same as usual
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
