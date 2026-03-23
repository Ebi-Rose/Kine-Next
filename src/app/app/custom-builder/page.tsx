"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useKineStore } from "@/store/useKineStore";
import type { WeekData } from "@/lib/week-builder";
import { EXERCISE_LIBRARY } from "@/data/exercise-library";
import { SESSION_MUSCLE_FOCUS } from "@/data/session-muscle-focus";
import { apiFetchStreaming } from "@/lib/api";
import Button from "@/components/Button";
import { toast } from "@/components/Toast";

export default function CustomBuilderPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const dayIdx = Number(searchParams.get("day") ?? -1);

  const { weekData, setWeekData, equip, exp } = useKineStore();
  const week = weekData as WeekData | null;

  const [title, setTitle] = useState("");
  const [selectedExercises, setSelectedExercises] = useState<string[]>([]);
  const [search, setSearch] = useState("");
  const [muscleFilter, setMuscleFilter] = useState("all");
  const [aiLoading, setAiLoading] = useState(false);

  if (!week || dayIdx < 0) {
    router.replace("/app");
    return null;
  }

  const day = week.days[dayIdx];

  // Filter exercises
  const filtered = EXERCISE_LIBRARY.filter((ex) => {
    // Equipment check
    if (!ex.equip.some((e) => equip.includes(e))) return false;
    // Experience check
    if (ex.minExp === "developing" && exp === "new") return false;
    if (ex.minExp === "intermediate" && (exp === "new" || exp === "developing")) return false;
    // Muscle filter
    if (muscleFilter !== "all" && ex.muscle !== muscleFilter) return false;
    // Search
    if (search && !ex.name.toLowerCase().includes(search.toLowerCase())) return false;
    // Not already selected
    if (selectedExercises.includes(ex.name)) return false;
    return true;
  });

  function toggleExercise(name: string) {
    if (selectedExercises.includes(name)) {
      setSelectedExercises(selectedExercises.filter((n) => n !== name));
    } else {
      setSelectedExercises([...selectedExercises, name]);
    }
  }

  function removeExercise(name: string) {
    setSelectedExercises(selectedExercises.filter((n) => n !== name));
  }

  // #16: AI-generated session
  async function aiSuggest() {
    setAiLoading(true);
    try {
      const store = useKineStore.getState();
      const focusHint = muscleFilter !== "all" ? muscleFilter : title || "balanced full body";

      const data = await apiFetchStreaming({
        model: "claude-sonnet-4-20250514",
        max_tokens: 500,
        system: "You are Kine. Suggest exercises for a custom training session. Return ONLY a JSON array of exercise names: [\"Exercise Name\", ...]. Use standard exercise names. Female-first: prioritise posterior chain, glutes, unilateral work.",
        messages: [{
          role: "user",
          content: `Suggest 5-6 exercises for a "${focusHint}" session. Equipment: ${store.equip.join(", ") || "bodyweight"}. Experience: ${store.exp || "new"}. Injuries: ${store.injuries.join(", ") || "none"}. Make it a well-rounded session with compounds first, then isolations.`,
        }],
      }, { timeoutMs: 15000 });

      const text = data.content.map((b) => b.text || "").join("").trim();
      const j = text.indexOf("[");
      const k = text.lastIndexOf("]");
      if (j >= 0 && k >= 0) {
        const names = JSON.parse(text.slice(j, k + 1)) as string[];
        // Only add exercises that exist in the library
        const valid = names.filter(n =>
          EXERCISE_LIBRARY.some(e => e.name.toLowerCase() === n.toLowerCase())
        );
        if (valid.length > 0) {
          setSelectedExercises(valid);
          if (!title) setTitle(focusHint.charAt(0).toUpperCase() + focusHint.slice(1));
          toast(`AI suggested ${valid.length} exercises`, "success");
        } else {
          toast("AI suggestions didn't match library — try picking manually", "error");
        }
      }
    } catch {
      toast("AI unavailable — pick exercises manually", "error");
    }
    setAiLoading(false);
  }

  function buildSession() {
    if (selectedExercises.length === 0) {
      toast("Add at least one exercise", "error");
      return;
    }

    const sessionTitle = title || "Custom Session";
    const exercises = selectedExercises.map((name) => ({
      name,
      sets: "3",
      reps: "8-10",
      rest: "90 sec",
    }));

    const updatedDays = [...week!.days];
    updatedDays[dayIdx] = {
      ...updatedDays[dayIdx],
      isRest: false,
      sessionTitle,
      sessionDuration: `~${selectedExercises.length * 8} min`,
      coachNote: "Custom session — your selection, your rules.",
      exercises,
    };

    setWeekData({ ...week!, days: updatedDays });
    toast("Custom session created", "success");
    router.push("/app");
  }

  const muscles = ["all", "legs", "hinge", "push", "pull", "core", "cardio"];

  return (
    <div>
      <button onClick={() => router.push("/app")} className="text-xs text-muted2 hover:text-text transition-colors">
        ← Back to week
      </button>
      <h1 className="mt-2 font-display text-2xl tracking-wide text-accent">Custom Session</h1>
      <p className="mt-1 text-xs text-muted2">
        Build your own session for {day.isRest ? "this rest day" : "this day"}.
      </p>

      {/* Session title */}
      <input
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Session name (e.g. Active Recovery, Glute Focus)"
        className="mt-4 w-full rounded-[var(--radius-default)] border border-border bg-surface px-3 py-2 text-sm text-text placeholder:text-muted outline-none focus:border-accent"
      />

      {/* #16: AI suggest button */}
      <button
        onClick={aiSuggest}
        disabled={aiLoading}
        className="mt-3 w-full rounded-[var(--radius-default)] border border-accent/30 bg-accent-dim/30 px-3 py-2.5 text-xs text-accent hover:bg-accent-dim transition-all disabled:opacity-50"
      >
        {aiLoading ? "AI is thinking..." : "Let AI build this session"}
      </button>

      {/* Selected exercises */}
      {selectedExercises.length > 0 && (
        <div className="mt-4">
          <p className="mb-2 text-xs tracking-wider text-muted uppercase">
            Your session ({selectedExercises.length} exercises)
          </p>
          <div className="flex flex-col gap-1">
            {selectedExercises.map((name, i) => (
              <div key={name} className="flex items-center justify-between rounded-lg border border-accent/30 bg-accent-dim/30 px-3 py-2">
                <span className="text-xs text-text">{i + 1}. {name}</span>
                <button onClick={() => removeExercise(name)} className="text-xs text-muted2 hover:text-red-400">✕</button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Muscle filter */}
      <div className="mt-4 flex gap-1 overflow-x-auto">
        {muscles.map((m) => (
          <button
            key={m}
            onClick={() => setMuscleFilter(m)}
            className={`whitespace-nowrap rounded-full px-3 py-1 text-xs transition-all ${
              muscleFilter === m ? "bg-accent text-bg" : "bg-surface2 text-muted2 hover:text-text"
            }`}
          >
            {m === "all" ? "All" : m.charAt(0).toUpperCase() + m.slice(1)}
          </button>
        ))}
      </div>

      {/* Search */}
      <input
        type="text"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search exercises..."
        className="mt-3 w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text placeholder:text-muted outline-none focus:border-accent"
      />

      {/* Exercise list */}
      <div className="mt-3 flex flex-col gap-1 max-h-[40vh] overflow-y-auto">
        {filtered.slice(0, 30).map((ex) => (
          <button
            key={ex.name}
            onClick={() => toggleExercise(ex.name)}
            className="flex items-center justify-between rounded-lg border border-border bg-surface px-3 py-2 text-left hover:border-border-active transition-all"
          >
            <div>
              <span className="text-xs font-medium text-text">{ex.name}</span>
              <span className="ml-2 text-[10px] text-muted">{ex.tags.join(", ")}</span>
            </div>
            <span className="text-[10px] text-muted2">{ex.muscle}</span>
          </button>
        ))}
        {filtered.length > 30 && (
          <p className="text-center text-[10px] text-muted py-2">
            {filtered.length - 30} more — refine your search
          </p>
        )}
      </div>

      {/* Build button */}
      <div className="mt-6 pb-4">
        <Button className="w-full" size="lg" onClick={buildSession} disabled={selectedExercises.length === 0}>
          Create session ({selectedExercises.length} exercises)
        </Button>
      </div>
    </div>
  );
}
