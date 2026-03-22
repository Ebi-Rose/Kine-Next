"use client";

import { useState, useMemo } from "react";
import { useKineStore } from "@/store/useKineStore";
import { EXERCISE_LIBRARY, findExercise } from "@/data/exercise-library";
import { getSessionMuscles } from "@/data/session-muscle-focus";
import BottomSheet from "@/components/BottomSheet";
import Button from "@/components/Button";

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

export default function ExerciseSwapSheet({
  open,
  onClose,
  currentExercise,
  sessionTitle,
  sessionExercises,
  onSwap,
}: Props) {
  const { equip, exp, injuries } = useKineStore();
  const [mode, setMode] = useState<SwapMode>("like");
  const [search, setSearch] = useState("");

  const currentEx = findExercise(currentExercise);
  const sessionMuscles = getSessionMuscles(sessionTitle);

  const candidates = useMemo(() => {
    return EXERCISE_LIBRARY
      .filter((ex) => {
        // Not the current exercise
        if (ex.name === currentExercise) return false;
        // Not already in session
        if (sessionExercises.includes(ex.name)) return false;
        // Equipment check
        if (!ex.equip.some((e) => equip.includes(e))) return false;
        // Experience check
        if (ex.minExp === "developing" && exp === "new") return false;
        if (ex.minExp === "intermediate" && (exp === "new" || exp === "developing")) return false;
        // In "like" mode, only same muscle group
        if (mode === "like" && currentEx && ex.muscle !== currentEx.muscle) return false;
        // Search
        if (search && !ex.name.toLowerCase().includes(search.toLowerCase())) return false;
        return true;
      })
      .map((ex) => ({
        ...ex,
        fit: scoreSwap(ex.muscle, currentEx?.muscle || "", sessionMuscles),
        comparison: getComparison(ex, currentEx),
      }))
      .sort((a, b) => {
        const fitOrder: Record<FitScore, number> = { ideal: 0, acceptable: 1, compromise: 2 };
        return (fitOrder[a.fit] || 2) - (fitOrder[b.fit] || 2);
      });
  }, [currentExercise, currentEx, sessionExercises, equip, exp, mode, search, sessionMuscles]);

  return (
    <BottomSheet open={open} onClose={onClose} title={`Replace ${currentExercise}`}>
      {/* Mode toggle */}
      <div className="flex gap-2 mb-3">
        <button
          onClick={() => setMode("like")}
          className={`rounded-full px-3 py-1 text-xs transition-all ${
            mode === "like" ? "bg-accent text-bg" : "bg-surface2 text-muted2"
          }`}
        >
          Same muscle
        </button>
        <button
          onClick={() => setMode("all")}
          className={`rounded-full px-3 py-1 text-xs transition-all ${
            mode === "all" ? "bg-accent text-bg" : "bg-surface2 text-muted2"
          }`}
        >
          All exercises
        </button>
      </div>

      {/* Search */}
      <input
        type="text"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search..."
        className="w-full rounded-lg border border-border bg-bg px-3 py-2 text-sm text-text placeholder:text-muted outline-none focus:border-accent mb-3"
      />

      {/* Candidates */}
      <div className="flex flex-col gap-1 max-h-[50vh] overflow-y-auto">
        {candidates.slice(0, 25).map((ex) => (
          <button
            key={ex.name}
            onClick={() => { onSwap(ex.name); onClose(); }}
            className="flex items-center justify-between rounded-lg border border-border bg-surface px-3 py-2.5 text-left hover:border-border-active transition-all"
          >
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-text">{ex.name}</span>
                <span className={`rounded-full px-1.5 py-0.5 text-[9px] ${
                  ex.fit === "ideal" ? "bg-green-900/30 text-green-400"
                  : ex.fit === "acceptable" ? "bg-surface2 text-muted2"
                  : "bg-red-900/20 text-red-300"
                }`}>
                  {ex.fit}
                </span>
              </div>
              {ex.comparison && (
                <span className="text-[10px] text-muted">{ex.comparison}</span>
              )}
            </div>
            <span className="text-[10px] text-muted2">{ex.muscle}</span>
          </button>
        ))}
        {candidates.length === 0 && (
          <p className="text-center text-xs text-muted2 py-4">No matching exercises found</p>
        )}
        {candidates.length > 25 && (
          <p className="text-center text-[10px] text-muted py-2">
            {candidates.length - 25} more — refine your search
          </p>
        )}
      </div>

      {/* Balance warning */}
      {mode === "all" && currentEx && (
        <div className="mt-3 text-[10px] text-muted2">
          Swapping from <span className="text-text">{currentEx.muscle}</span> may change session balance.
        </div>
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

  return notes.join(" · ");
}
