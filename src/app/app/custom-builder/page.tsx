"use client";

import { useState, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useKineStore } from "@/store/useKineStore";
import { appNow } from "@/lib/dev-time";
import type { WeekData } from "@/lib/week-builder";
import { buildFallbackPrescription } from "@/lib/week-builder";
import { EXERCISE_LIBRARY, findExercise } from "@/data/exercise-library";
import { apiFetchStreaming } from "@/lib/api";
import { sanitizeInput } from "@/lib/sanitize";
import Button from "@/components/Button";
import { toast } from "@/components/Toast";

// ── Templates ──

interface Template {
  id: string;
  label: string;
  muscles: string[];
  exercises: string[];
}

const TEMPLATES: Template[] = [
  { id: "glute-focus", label: "Glute Focus", muscles: ["hinge", "legs"],
    exercises: ["Hip Thrust", "Romanian Deadlift", "Bulgarian Split Squat", "Glute Bridge", "Calf Raises"] },
  { id: "upper-push", label: "Upper Push", muscles: ["push"],
    exercises: ["Barbell Bench Press", "Overhead Press", "Incline Barbell Press", "Lateral Raise", "Tricep Pushdown"] },
  { id: "upper-pull", label: "Upper Pull", muscles: ["pull"],
    exercises: ["Pull-Up", "Barbell Row", "Seated Cable Row", "Face Pulls", "Dumbbell Curl"] },
  { id: "full-body", label: "Full Body", muscles: ["legs", "hinge", "push", "pull", "core"],
    exercises: ["Goblet Squat", "Push-Up", "Dumbbell Row", "Romanian Deadlift", "Glute Bridge", "Plank"] },
  { id: "lower-body", label: "Lower Body", muscles: ["legs", "hinge"],
    exercises: ["Barbell Back Squat", "Romanian Deadlift", "Walking Lunges", "Leg Curl", "Calf Raises"] },
  { id: "active-recovery", label: "Active Recovery", muscles: ["core"],
    exercises: ["Glute Bridge", "Bird Dog", "Dead Bug", "Plank", "Calf Raises"] },
];

// ── Helpers ──

function getThisWeekSessions(progressDB: { sessions: { date?: string; title?: string; logs?: Record<string, unknown> }[] }): { date: string; title: string; muscles: string[] }[] {
  const now = appNow();
  const monday = new Date(now);
  monday.setDate(now.getDate() - ((now.getDay() + 6) % 7));
  monday.setHours(0, 0, 0, 0);

  return progressDB.sessions
    .filter((s) => s.date && new Date(s.date) >= monday)
    .map((s) => {
      // Extract muscles from logged exercises
      const muscles = new Set<string>();
      if (s.logs) {
        Object.values(s.logs).forEach((log: unknown) => {
          const l = log as { name?: string };
          if (l.name) {
            const lib = findExercise(l.name);
            if (lib) muscles.add(lib.muscle);
          }
        });
      }
      return { date: s.date!, title: s.title || "", muscles: [...muscles] };
    });
}

function daysSince(dateStr: string): number {
  const d = new Date(dateStr);
  const now = appNow();
  return Math.floor((now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24));
}

function getSessionWarnings(
  selectedExercises: string[],
  weekSessions: { date: string; title: string; muscles: string[] }[],
): string[] {
  if (selectedExercises.length === 0) return [];

  const warnings: string[] = [];

  // Analyse selected exercises
  const muscleCount: Record<string, number> = {};
  let compoundCount = 0;
  let isolationCount = 0;

  selectedExercises.forEach((name) => {
    const lib = findExercise(name);
    if (lib) {
      muscleCount[lib.muscle] = (muscleCount[lib.muscle] || 0) + 1;
      if (lib.tags.includes("Compound")) compoundCount++;
      else isolationCount++;
    }
  });

  const muscleGroups = Object.keys(muscleCount);

  // Too many exercises
  if (selectedExercises.length > 8) {
    warnings.push(`${selectedExercises.length} exercises is a long session — quality drops after ~6-8 exercises.`);
  }

  // Single exercise
  if (selectedExercises.length === 1) {
    warnings.push("One exercise is fine for a quick session but won't be a full workout.");
  }

  // No compounds
  if (compoundCount === 0 && selectedExercises.length >= 3) {
    warnings.push("No compound movements — compounds build the most strength per minute.");
  }

  // All same muscle group
  if (muscleGroups.length === 1 && selectedExercises.length >= 3) {
    const group = muscleGroups[0];
    const opposite: Record<string, string> = { push: "pull", pull: "push", legs: "hinge", hinge: "legs" };
    if (opposite[group]) {
      warnings.push(`All ${group} exercises — consider adding ${opposite[group]} for balance.`);
    }
  }

  // Recovery overlap — check against this week's sessions
  const selectedMuscles = new Set(muscleGroups);
  for (const session of weekSessions) {
    const overlap = session.muscles.filter((m) => selectedMuscles.has(m));
    if (overlap.length > 0) {
      const days = daysSince(session.date);
      if (days < 2) {
        const muscleNames = overlap.join(", ");
        warnings.push(`You trained ${muscleNames} ${days === 0 ? "today" : "yesterday"} (${session.title}) — muscles need 48-72h to recover.`);
        break;
      }
    }
  }

  return warnings;
}

// ── Component ──

export default function CustomBuilderPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const dayIdx = Number(searchParams.get("day") ?? -1);

  const { weekData, setWeekData, equip, exp, goal, injuries, progressDB } = useKineStore();
  const week = weekData as WeekData | null;

  const [title, setTitle] = useState("");
  const [selectedExercises, setSelectedExercises] = useState<string[]>([]);
  const [search, setSearch] = useState("");
  const [muscleFilter, setMuscleFilter] = useState("all");
  const [aiLoading, setAiLoading] = useState(false);

  const weekSessions = useMemo(() => getThisWeekSessions(progressDB), [progressDB]);
  const warnings = useMemo(() => getSessionWarnings(selectedExercises, weekSessions), [selectedExercises, weekSessions]);

  if (!week || dayIdx < 0) {
    router.replace("/app");
    return null;
  }

  const day = week.days[dayIdx];

  // Filter exercises
  const filtered = EXERCISE_LIBRARY.filter((ex) => {
    if (!ex.equip.some((e) => equip.includes(e))) return false;
    if (ex.minExp === "developing" && exp === "new") return false;
    if (ex.minExp === "intermediate" && (exp === "new" || exp === "developing")) return false;
    if (muscleFilter !== "all" && ex.muscle !== muscleFilter) return false;
    if (search && !ex.name.toLowerCase().includes(search.toLowerCase())) return false;
    if (selectedExercises.includes(ex.name)) return false;
    return true;
  });

  // Template overlap badges
  function getTemplateOverlap(template: Template): string | null {
    for (const session of weekSessions) {
      const overlap = session.muscles.filter((m) => template.muscles.includes(m));
      if (overlap.length > 0) {
        const days = daysSince(session.date);
        if (days < 3) {
          return days === 0 ? "trained today" : days === 1 ? "trained yesterday" : "trained 2 days ago";
        }
      }
    }
    return null;
  }

  function applyTemplate(template: Template) {
    // Filter template exercises to user's equipment
    const valid = template.exercises.filter((name) => {
      const lib = findExercise(name);
      return lib && lib.equip.some((e) => equip.includes(e));
    });
    if (valid.length === 0) {
      toast("No exercises from this template match your equipment", "error");
      return;
    }
    setSelectedExercises(valid);
    if (!title) setTitle(template.label);
    toast(`${template.label} — ${valid.length} exercises`, "success");
  }

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

  async function aiSuggest() {
    setAiLoading(true);
    try {
      const store = useKineStore.getState();
      const focusHint = muscleFilter !== "all" ? muscleFilter : sanitizeInput(title, 80) || "balanced full body";

      // Include this week's training context
      const weekContext = weekSessions.length > 0
        ? `Already trained this week: ${weekSessions.map((s) => `${sanitizeInput(s.title, 80)} (${s.muscles.join("/")})`).join(", ")}. Avoid repeating the same muscle groups within 48h.`
        : "";

      const data = await apiFetchStreaming({
        model: "claude-sonnet-4-20250514",
        max_tokens: 500,
        system: "You are Kinē. Suggest exercises for a custom training session. Return ONLY a JSON array of exercise names: [\"Exercise Name\", ...]. Use standard exercise names. Female-first: prioritise posterior chain, glutes, unilateral work.",
        messages: [{
          role: "user",
          content: `Suggest 5-6 exercises for a "${focusHint}" session. Equipment: ${store.equip.join(", ") || "bodyweight"}. Experience: ${store.exp || "new"}. Injuries: ${store.injuries.join(", ") || "none"}. ${weekContext} Make it a well-rounded session with compounds first, then isolations.`,
        }],
      }, { timeoutMs: 15000 });

      const text = data.content.map((b) => b.text || "").join("").trim();
      const j = text.indexOf("[");
      const k = text.lastIndexOf("]");
      if (j >= 0 && k >= 0) {
        const names = JSON.parse(text.slice(j, k + 1)) as string[];
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
    const goalKey = goal || "general";
    const exercises = selectedExercises.map((name) => buildFallbackPrescription(name, goalKey));

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

      {/* Templates */}
      <div className="mt-4">
        <p className="mb-2 text-xs tracking-wider text-muted uppercase">Quick start</p>
        <div className="grid grid-cols-2 gap-2">
          {TEMPLATES.map((t) => {
            const overlap = getTemplateOverlap(t);
            return (
              <button
                key={t.id}
                onClick={() => applyTemplate(t)}
                className="rounded-[var(--radius-default)] border border-border bg-surface px-3 py-2.5 text-left hover:border-border-active transition-all"
              >
                <span className="text-xs font-medium text-text">{t.label}</span>
                <span className="block text-[10px] text-muted mt-0.5">{t.muscles.join(" · ")}</span>
                {overlap && (
                  <span className="block text-[9px] text-accent mt-1">{overlap}</span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Session title */}
      <input
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Session name (e.g. Active Recovery, Glute Focus)"
        className="mt-4 w-full rounded-[var(--radius-default)] border border-border bg-surface px-3 py-2 text-sm text-text placeholder:text-muted outline-none focus:border-accent"
      />

      {/* AI suggest button */}
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
            {selectedExercises.map((name, i) => {
              const lib = findExercise(name);
              const rx = buildFallbackPrescription(name, goal || "general");
              return (
                <div key={name} className="flex items-center justify-between rounded-lg border border-accent/30 bg-accent-dim/30 px-3 py-2">
                  <div>
                    <span className="text-xs text-text">{i + 1}. {name}</span>
                    <span className="ml-2 text-[10px] text-muted">{rx.sets}×{rx.reps} · {rx.rest}</span>
                  </div>
                  <button onClick={() => removeExercise(name)} className="text-xs text-muted2 hover:text-danger">✕</button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Warnings */}
      {warnings.length > 0 && (
        <div className="mt-3 rounded-lg border border-accent/20 bg-accent-dim/30 p-3">
          {warnings.map((w, i) => (
            <p key={i} className="text-[10px] text-accent leading-relaxed">
              {warnings.length > 1 ? "• " : ""}{w}
            </p>
          ))}
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
        aria-label="Search exercises"
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
