"use client";

import { useState, useMemo } from "react";
import { useKineStore } from "@/store/useKineStore";
import { EXERCISE_LIBRARY, findExercise } from "@/data/exercise-library";
import { getSessionMuscles } from "@/data/session-muscle-focus";
import BottomSheet from "@/components/BottomSheet";

interface Props {
  open: boolean;
  onClose: () => void;
  currentExercise: string;
  sessionTitle: string;
  sessionExercises: string[];
  onSwap: (newExerciseName: string) => void;
}

type SwapMode = "like" | "all";
type FitScore = "ideal" | "acceptable" | "compromise";

const MUSCLE_LABELS: Record<string, string> = {
  push: "Push", pull: "Pull", legs: "Legs", hinge: "Hinge", core: "Core", cardio: "Cardio",
};

const MUSCLE_COLORS: Record<string, string> = {
  push: "border-l-cat-push", pull: "border-l-cat-pull",
  legs: "border-l-cat-legs", hinge: "border-l-cat-hinge",
  core: "border-l-cat-core", cardio: "border-l-cat-cardio",
};

export default function ExerciseSwapSheet({
  open, onClose, currentExercise, sessionTitle, sessionExercises, onSwap,
}: Props) {
  const { equip, exp } = useKineStore();
  const [mode, setMode] = useState<SwapMode>("like");
  const [search, setSearch] = useState("");

  const currentEx = findExercise(currentExercise);
  const sessionMuscles = getSessionMuscles(sessionTitle);

  const candidates = useMemo(() => {
    return EXERCISE_LIBRARY
      .filter((ex) => {
        if (ex.name === currentExercise) return false;
        if (sessionExercises.includes(ex.name)) return false;
        if (!ex.equip.some((e) => equip.includes(e))) return false;
        if (ex.minExp === "developing" && exp === "new") return false;
        if (ex.minExp === "intermediate" && (exp === "new" || exp === "developing")) return false;
        if (mode === "like" && currentEx && ex.muscle !== currentEx.muscle) return false;
        if (mode === "all" && currentEx && ex.muscle === currentEx.muscle) return false;
        if (search && !ex.name.toLowerCase().includes(search.toLowerCase())) return false;
        return true;
      })
      .map((ex) => ({
        ...ex,
        fit: scoreSwap(ex.muscle, currentEx?.muscle || "", sessionMuscles),
        comparison: getComparison(ex, currentEx),
      }));
  }, [currentExercise, currentEx, sessionExercises, equip, exp, mode, search, sessionMuscles]);

  // Group by compound/isolation for "like" mode, by muscle group for "all" mode
  const grouped = useMemo(() => {
    if (mode === "like") {
      const compounds = candidates.filter((c) => c.tags.includes("Compound"));
      const isolations = candidates.filter((c) => !c.tags.includes("Compound"));
      const groups: { label: string; items: typeof candidates }[] = [];
      if (compounds.length) groups.push({ label: "Compound alternatives", items: compounds });
      if (isolations.length) groups.push({ label: "Isolation alternatives", items: isolations });
      return groups;
    }

    // "all" mode: group by muscle group, session focus muscles first
    const muscleOrder = [
      ...sessionMuscles.filter((m) => m !== currentEx?.muscle),
      ...Object.keys(MUSCLE_LABELS).filter((m) => !sessionMuscles.includes(m) && m !== currentEx?.muscle),
    ];

    const groups: { label: string; items: typeof candidates }[] = [];
    for (const muscle of muscleOrder) {
      const items = candidates.filter((c) => c.muscle === muscle);
      if (items.length) {
        const label = sessionMuscles.includes(muscle)
          ? `${MUSCLE_LABELS[muscle] || muscle} — fits session focus`
          : `${MUSCLE_LABELS[muscle] || muscle} — changes session balance`;
        groups.push({ label, items });
      }
    }
    return groups;
  }, [candidates, mode]);

  return (
    <BottomSheet open={open} onClose={onClose} title={`Replace ${currentExercise}`}>
      {/* Current exercise context */}
      {currentEx && (
        <div className="mb-3 rounded-lg border border-border bg-bg p-2.5">
          <div className="flex items-center gap-2 text-xs">
            <div className={`h-2 w-2 rounded-full`} style={{ background: currentEx.muscle === "push" ? "#c49098" : currentEx.muscle === "pull" ? "#7b8fa8" : currentEx.muscle === "legs" || currentEx.muscle === "hinge" ? "#c4a962" : currentEx.muscle === "core" ? "#8ba88b" : "#888" }} />
            <span className="text-muted2">{MUSCLE_LABELS[currentEx.muscle] || currentEx.muscle}</span>
            <span className="text-muted">·</span>
            <span className="text-muted2">{currentEx.tags.includes("Compound") ? "Compound" : "Isolation"}</span>
          </div>
        </div>
      )}

      {/* Mode toggle */}
      <div className="flex gap-2 mb-3">
        <button onClick={() => setMode("like")}
          className={`rounded-full px-3 py-1 text-xs transition-all ${mode === "like" ? "bg-accent text-bg" : "bg-surface2 text-muted2"}`}>
          Like for like
        </button>
        <button onClick={() => setMode("all")}
          className={`rounded-full px-3 py-1 text-xs transition-all ${mode === "all" ? "bg-accent text-bg" : "bg-surface2 text-muted2"}`}>
          All exercises
        </button>
      </div>

      {/* Search */}
      <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
        placeholder="Search exercises..."
        aria-label="Search exercises"
        className="w-full rounded-lg border border-border bg-bg px-3 py-2 text-sm text-text placeholder:text-muted outline-none focus:border-accent mb-3" />

      {/* Grouped candidates */}
      <div className="max-h-[50vh] overflow-y-auto" aria-live="polite">
        {grouped.length === 0 && (
          <p className="text-center text-xs text-muted2 py-6">No matching exercises found</p>
        )}

        {grouped.map((group) => (
          <div key={group.label} className="mb-4">
            <p className="text-[9px] tracking-wider text-muted uppercase mb-1.5">{group.label}</p>
            <div className="flex flex-col gap-1">
              {group.items.slice(0, 15).map((ex) => (
                <button
                  key={ex.name}
                  onClick={() => { onSwap(ex.name); onClose(); }}
                  className={`flex items-center gap-2.5 rounded-lg border-l-[3px] ${MUSCLE_COLORS[ex.muscle] || "border-l-muted"} bg-surface px-3 py-2.5 text-left hover:bg-surface2 transition-all`}
                >
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-medium text-text truncate">{ex.name}</div>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className="text-[9px] text-muted2 font-light">
                        {MUSCLE_LABELS[ex.muscle] || ex.muscle}
                      </span>
                      {ex.comparison && (
                        <>
                          <span className="text-[9px] text-muted">·</span>
                          <span className="text-[9px] text-muted font-light">{ex.comparison}</span>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-col items-end shrink-0 gap-0.5">
                    <span className={`rounded-full px-1.5 py-0.5 text-[8px] tracking-wider uppercase ${
                      ex.fit === "ideal" ? "bg-green-900/30 text-green-400"
                      : ex.fit === "acceptable" ? "bg-surface2 text-muted2"
                      : "bg-red-900/20 text-red-300"
                    }`}>
                      {ex.fit}
                    </span>
                    {ex.fit === "compromise" && currentEx && (
                      <span className="text-[8px] text-red-300/70">
                        loses {MUSCLE_LABELS[currentEx.muscle] || currentEx.muscle}
                      </span>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Balance warning */}
      {mode === "all" && currentEx && (
        <p className="mt-2 text-[10px] text-muted font-light">
          Swapping from <span className="text-text">{MUSCLE_LABELS[currentEx.muscle] || currentEx.muscle}</span> to a different group may change session balance.
        </p>
      )}
    </BottomSheet>
  );
}

function scoreSwap(candidateMuscle: string, replacedMuscle: string, sessionMuscles: string[]): FitScore {
  if (candidateMuscle === replacedMuscle) return "ideal";
  if (sessionMuscles.includes(candidateMuscle)) return "acceptable";
  return "compromise";
}

function getComparison(
  candidate: { tags: string[]; equip: string[]; logType: string },
  current: { tags: string[]; equip: string[]; logType: string } | undefined
): string {
  if (!current) return "";
  const notes: string[] = [];

  const isCandidateCompound = candidate.tags.includes("Compound");
  const isCurrentCompound = current.tags.includes("Compound");
  if (isCandidateCompound && !isCurrentCompound) notes.push("compound");
  if (!isCandidateCompound && isCurrentCompound) notes.push("isolation");
  if (candidate.logType.includes("unilateral")) notes.push("single-leg/arm");
  if (candidate.tags.includes("Calisthenics") && !current.tags.includes("Calisthenics")) notes.push("bodyweight");
  if (!candidate.tags.includes("Calisthenics") && current.tags.includes("Calisthenics")) notes.push("weighted");

  return notes.join(" · ");
}
