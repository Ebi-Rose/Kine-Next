"use client";

import { useState, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useKineStore } from "@/store/useKineStore";
import type { WeekData, WeekDay, Exercise } from "@/lib/week-builder";
import { buildFallbackPrescription } from "@/lib/week-builder";
import { EXERCISE_LIBRARY, findExercise } from "@/data/exercise-library";
import { DAY_LABELS } from "@/data/constants";
import Button from "@/components/Button";
import BottomSheet from "@/components/BottomSheet";
import { toast } from "@/components/Toast";

// ── Session Templates ──

interface SessionTemplate {
  id: string;
  label: string;
  muscles: string[];
  exercises: string[];
}

const SESSION_TEMPLATES: SessionTemplate[] = [
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
  { id: "posterior-chain", label: "Posterior Chain", muscles: ["hinge", "pull"],
    exercises: ["Conventional Deadlift", "Romanian Deadlift", "Barbell Row", "Face Pulls", "Back Extension"] },
  { id: "push-pull", label: "Push & Pull", muscles: ["push", "pull"],
    exercises: ["Barbell Bench Press", "Barbell Row", "Overhead Press", "Lat Pulldown", "Lateral Raise", "Face Pulls"] },
  { id: "active-recovery", label: "Active Recovery", muscles: ["core"],
    exercises: ["Glute Bridge", "Bird Dog", "Dead Bug", "Plank", "Calf Raises"] },
];

// ── Validation ──

function getWeekWarnings(days: SandboxDay[]): string[] {
  const warnings: string[] = [];
  const trainingDays = days.filter((d) => !d.isRest);

  if (trainingDays.length === 0) {
    warnings.push("No training days — add at least one session.");
    return warnings;
  }

  if (trainingDays.length > 6) {
    warnings.push("Training 7 days a week doesn't allow for recovery.");
  }

  // Check for consecutive training days (3+)
  let consecutive = 0;
  let maxConsecutive = 0;
  for (const d of days) {
    if (!d.isRest) {
      consecutive++;
      maxConsecutive = Math.max(maxConsecutive, consecutive);
    } else {
      consecutive = 0;
    }
  }
  if (maxConsecutive >= 4) {
    warnings.push(`${maxConsecutive} training days in a row — consider adding a rest day for recovery.`);
  }

  // Check muscle balance across the week
  const weekMuscles: Record<string, number> = {};
  trainingDays.forEach((d) => {
    d.exercises.forEach((name) => {
      const lib = findExercise(name);
      if (lib) weekMuscles[lib.muscle] = (weekMuscles[lib.muscle] || 0) + 1;
    });
  });

  const totalExercises = Object.values(weekMuscles).reduce((a, b) => a + b, 0);
  if (totalExercises > 0) {
    // No pulling
    if (!weekMuscles["pull"] && (weekMuscles["push"] || 0) >= 2) {
      warnings.push("Push exercises but no pull — add rows or pull-ups for shoulder health.");
    }
    // No lower body
    if (!weekMuscles["legs"] && !weekMuscles["hinge"] && trainingDays.length >= 2) {
      warnings.push("No lower body work this week — legs and glutes are where the biggest gains happen.");
    }
    // No posterior chain
    if (!weekMuscles["hinge"] && trainingDays.length >= 3) {
      warnings.push("No hip hinge exercises — add deadlifts, RDLs, or hip thrusts for posterior chain.");
    }
  }

  // Check for same-muscle sessions on consecutive days
  for (let i = 0; i < days.length - 1; i++) {
    if (days[i].isRest || days[i + 1].isRest) continue;
    const musclesA = new Set(days[i].exercises.map((n) => findExercise(n)?.muscle).filter(Boolean));
    const musclesB = new Set(days[i + 1].exercises.map((n) => findExercise(n)?.muscle).filter(Boolean));
    const overlap = [...musclesA].filter((m) => musclesB.has(m));
    if (overlap.length > 0) {
      const dayA = DAY_LABELS[i];
      const dayB = DAY_LABELS[i + 1];
      warnings.push(`${dayA} and ${dayB} both train ${overlap.join(", ")} — muscles need 48h between sessions.`);
      break;
    }
  }

  return warnings;
}

// ── Assessment Questions ──

interface AssessmentQuestion {
  id: string;
  question: string;
  options: { label: string; correct: boolean }[];
  explanation: string;
}

const ASSESSMENT_QUESTIONS: AssessmentQuestion[] = [
  {
    id: "volume",
    question: "What happens if you train the same muscle group on consecutive days without rest?",
    options: [
      { label: "Faster gains from more volume", correct: false },
      { label: "The muscle doesn't recover fully, limiting growth", correct: true },
      { label: "No effect — muscles adapt to anything", correct: false },
    ],
    explanation: "Muscles need 48–72 hours to repair and grow after training. Consecutive sessions on the same group can lead to overtraining.",
  },
  {
    id: "balance",
    question: "Why is it important to balance push and pull exercises?",
    options: [
      { label: "It looks better on paper", correct: false },
      { label: "To prevent muscle imbalances and protect your joints", correct: true },
      { label: "Pull exercises aren't actually necessary", correct: false },
    ],
    explanation: "Training push without pull creates imbalances that can lead to shoulder injuries. Balanced programming protects your joints long-term.",
  },
  {
    id: "compound",
    question: "Where should compound exercises go in your session?",
    options: [
      { label: "At the end, after isolation work", correct: false },
      { label: "It doesn't matter what order", correct: false },
      { label: "Early in the session when you're freshest", correct: true },
    ],
    explanation: "Compound lifts require the most energy and coordination. Doing them first ensures you can lift safely and effectively.",
  },
  {
    id: "rest-days",
    question: "What's the minimum number of rest days per week for most lifters?",
    options: [
      { label: "0 — rest is optional if you eat enough", correct: false },
      { label: "At least 1, ideally 2", correct: true },
      { label: "4 — you should only train 3 days", correct: false },
    ],
    explanation: "Most people benefit from at least 1–2 rest days per week. Recovery is when your body actually gets stronger.",
  },
];

const PASS_THRESHOLD = 3; // Must get 3/4 correct

// ── Types ──

type SandboxPhase = "assessment" | "builder";

interface SandboxDay {
  isRest: boolean;
  title: string;
  exercises: string[];
}

// ── Component ──

export default function SandboxPage() {
  const router = useRouter();
  const { equip, exp, goal, setWeekData, progressDB } = useKineStore();

  const [phase, setPhase] = useState<SandboxPhase>("assessment");
  const [days, setDays] = useState<SandboxDay[]>(
    Array.from({ length: 7 }, () => ({ isRest: true, title: "", exercises: [] }))
  );
  const [editingDay, setEditingDay] = useState<number | null>(null);
  const [exercisePickerDay, setExercisePickerDay] = useState<number | null>(null);
  const [search, setSearch] = useState("");
  const [muscleFilter, setMuscleFilter] = useState("all");

  // Undo history
  const [history, setHistory] = useState<SandboxDay[][]>([]);
  const MAX_HISTORY = 20;

  const pushHistory = useCallback(() => {
    setHistory((prev) => [
      ...prev.slice(-(MAX_HISTORY - 1)),
      days.map((d) => ({ ...d, exercises: [...d.exercises] })),
    ]);
  }, [days]);

  function undo() {
    setHistory((prev) => {
      if (prev.length === 0) return prev;
      const restored = prev[prev.length - 1];
      setDays(restored);
      toast("Undone", "success");
      return prev.slice(0, -1);
    });
  }

  function resetWeek() {
    pushHistory();
    setDays(Array.from({ length: 7 }, () => ({ isRest: true, title: "", exercises: [] })));
    toast("Week reset", "success");
  }

  const canUndo = history.length > 0;

  const warnings = useMemo(() => getWeekWarnings(days), [days]);

  // Gate: intermediate+ only
  if (exp === "new" || exp === "developing") {
    return (
      <div className="mx-auto max-w-md px-4 py-20 text-center">
        <h1 className="font-display text-xl text-text">Sandbox Mode</h1>
        <p className="mt-3 text-sm text-muted2">
          Design-your-own-week is available for intermediate and advanced lifters.
          Keep building your foundation with your current programme — it won&apos;t be long.
        </p>
        <Button className="mt-6" onClick={() => router.push("/app")}>
          Back to Dashboard
        </Button>
      </div>
    );
  }

  function toggleDay(idx: number) {
    pushHistory();
    setDays((prev) => {
      const updated = [...prev];
      if (updated[idx].isRest) {
        updated[idx] = { isRest: false, title: "", exercises: [] };
        setEditingDay(idx);
      } else {
        updated[idx] = { isRest: true, title: "", exercises: [] };
      }
      return updated;
    });
  }

  function applyTemplate(dayIdx: number, template: SessionTemplate) {
    pushHistory();
    const valid = template.exercises.filter((name) => {
      const lib = findExercise(name);
      return lib && lib.equip.some((e) => equip.includes(e));
    });
    setDays((prev) => {
      const updated = [...prev];
      updated[dayIdx] = { isRest: false, title: template.label, exercises: valid };
      return updated;
    });
    setEditingDay(null);
    toast(`${template.label} added to ${DAY_LABELS[dayIdx]}`, "success");
  }

  function addExercise(dayIdx: number, name: string) {
    pushHistory();
    setDays((prev) => {
      const updated = [...prev];
      if (!updated[dayIdx].exercises.includes(name)) {
        updated[dayIdx] = { ...updated[dayIdx], exercises: [...updated[dayIdx].exercises, name] };
      }
      return updated;
    });
  }

  function removeExercise(dayIdx: number, name: string) {
    pushHistory();
    setDays((prev) => {
      const updated = [...prev];
      updated[dayIdx] = { ...updated[dayIdx], exercises: updated[dayIdx].exercises.filter((n) => n !== name) };
      return updated;
    });
  }

  function updateTitle(dayIdx: number, title: string) {
    setDays((prev) => {
      const updated = [...prev];
      updated[dayIdx] = { ...updated[dayIdx], title };
      return updated;
    });
  }

  function buildWeek() {
    const trainingDays = days.filter((d) => !d.isRest);
    if (trainingDays.length === 0) {
      toast("Add at least one training day", "error");
      return;
    }

    // Check each training day has exercises
    const emptyDays = days
      .map((d, i) => ({ d, i }))
      .filter(({ d }) => !d.isRest && d.exercises.length === 0);
    if (emptyDays.length > 0) {
      toast(`Add exercises to ${DAY_LABELS[emptyDays[0].i]}`, "error");
      return;
    }

    const goalKey = goal || "general";
    const weekDays: WeekDay[] = days.map((d, i) => {
      if (d.isRest) {
        return {
          dayNumber: i + 1,
          isRest: true,
          sessionTitle: "Rest & Recovery",
          sessionDuration: "",
          coachNote: "",
          exercises: [],
        };
      }

      const exercises: Exercise[] = d.exercises.map((name) =>
        buildFallbackPrescription(name, goalKey)
      );

      return {
        dayNumber: i + 1,
        isRest: false,
        sessionTitle: d.title || "Custom Session",
        sessionDuration: `~${d.exercises.length * 8} min`,
        coachNote: "Your session, your plan.",
        exercises,
      };
    });

    const weekData: WeekData = {
      programName: "Sandbox Week",
      weekCoachNote: "You designed this week — every session is yours.",
      days: weekDays,
      _weekNum: progressDB.currentWeek || 1,
    };

    setWeekData(weekData);
    toast("Week created — let's go", "success");
    router.push("/app");
  }

  // Filtered exercise list for picker
  const pickerFiltered = EXERCISE_LIBRARY.filter((ex) => {
    if (!ex.equip.some((e) => equip.includes(e))) return false;
    if (muscleFilter !== "all" && ex.muscle !== muscleFilter) return false;
    if (search && !ex.name.toLowerCase().includes(search.toLowerCase())) return false;
    if (exercisePickerDay !== null && days[exercisePickerDay]?.exercises.includes(ex.name)) return false;
    return true;
  });

  const muscles = ["all", "legs", "hinge", "push", "pull", "core", "cardio"];
  const trainingCount = days.filter((d) => !d.isRest).length;
  const totalExercises = days.reduce((acc, d) => acc + d.exercises.length, 0);

  if (phase === "assessment") {
    return <SandboxAssessment onPass={() => setPhase("builder")} onBack={() => router.push("/app")} />;
  }

  return (
    <div>
      <button onClick={() => router.push("/app")} className="text-xs text-muted2 hover:text-text transition-colors">
        ← Back
      </button>
      <h1 className="mt-2 font-display text-2xl tracking-wide text-accent">Design Your Week</h1>
      <p className="mt-1 text-xs text-muted2">
        Tap a day to add training. Pick a template or build from scratch.
      </p>

      {/* Week overview */}
      <div className="mt-4 flex flex-col gap-2">
        {days.map((day, i) => (
          <div
            key={i}
            className={`rounded-[14px] border p-4 transition-all ${
              day.isRest
                ? "border-border/50 bg-surface/50"
                : "border-accent/30 bg-surface"
            }`}
          >
            {/* Day header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-text">{DAY_LABELS[i]}</span>
                {!day.isRest && (
                  <span className="text-[10px] text-accent">
                    {day.title || "No template"}
                  </span>
                )}
              </div>
              <button
                onClick={() => toggleDay(i)}
                className={`rounded-full px-2.5 py-0.5 text-[10px] transition-all ${
                  day.isRest
                    ? "bg-surface2 text-muted2 hover:text-text"
                    : "bg-accent/20 text-accent hover:bg-accent/30"
                }`}
              >
                {day.isRest ? "+ Train" : "Rest"}
              </button>
            </div>

            {/* Training day content */}
            {!day.isRest && (
              <div className="mt-3">
                {/* Session title */}
                <input
                  type="text"
                  value={day.title}
                  onChange={(e) => updateTitle(i, e.target.value)}
                  placeholder="Session name"
                  className="w-full rounded-lg border border-border bg-bg px-3 py-1.5 text-xs text-text placeholder:text-muted outline-none focus:border-accent"
                />

                {/* Template quick picks (if no exercises yet) */}
                {day.exercises.length === 0 && (
                  <div className="mt-2">
                    <p className="mb-1.5 text-[9px] tracking-wider text-muted uppercase">Pick a template</p>
                    <div className="flex flex-wrap gap-1.5">
                      {SESSION_TEMPLATES.map((t) => (
                        <button
                          key={t.id}
                          onClick={() => applyTemplate(i, t)}
                          className="rounded-full border border-border bg-surface2/50 px-2.5 py-1 text-[10px] text-muted2 hover:text-text hover:border-accent/30 transition-all"
                        >
                          {t.label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Exercise list */}
                {day.exercises.length > 0 && (
                  <div className="mt-2 flex flex-col gap-1">
                    {day.exercises.map((name, exIdx) => {
                      const lib = findExercise(name);
                      const rx = buildFallbackPrescription(name, goal || "general");
                      return (
                        <div key={name} className="flex items-center justify-between rounded-lg bg-surface2/30 px-2.5 py-1.5">
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="text-[10px] text-muted shrink-0">{exIdx + 1}</span>
                            <span className="text-xs text-text truncate">{name}</span>
                            <span className="text-[9px] text-muted2 shrink-0">{rx.sets}×{rx.reps}</span>
                          </div>
                          <button onClick={() => removeExercise(i, name)} className="text-[10px] text-muted2 hover:text-red-400 shrink-0 ml-2">✕</button>
                        </div>
                      );
                    })}
                    <button
                      onClick={() => { setExercisePickerDay(i); setSearch(""); setMuscleFilter("all"); }}
                      className="mt-1 rounded-lg border border-dashed border-border px-3 py-1.5 text-[10px] text-muted2 hover:text-accent hover:border-accent/30 transition-all"
                    >
                      + Add exercise
                    </button>
                  </div>
                )}

                {/* Add exercises button (when using template) */}
                {day.exercises.length > 0 && (
                  <div className="mt-2 flex gap-1.5">
                    <button
                      onClick={() => setEditingDay(i)}
                      className="text-[10px] text-muted2 hover:text-accent transition-colors"
                    >
                      Change template
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Week summary + actions */}
      {trainingCount > 0 && (
        <div className="mt-4 rounded-lg bg-surface2/30 px-4 py-3">
          <div className="flex justify-between text-xs">
            <span className="text-muted2">{trainingCount} training day{trainingCount !== 1 ? "s" : ""} · {7 - trainingCount} rest</span>
            <span className="text-muted2">{totalExercises} exercises total</span>
          </div>
          <div className="mt-2 flex gap-3">
            <button
              onClick={undo}
              disabled={!canUndo}
              className={`text-[10px] transition-colors ${canUndo ? "text-accent hover:text-text" : "text-muted cursor-not-allowed"}`}
            >
              ↩ Undo
            </button>
            <button
              onClick={resetWeek}
              className="text-[10px] text-muted2 hover:text-red-400 transition-colors"
            >
              Reset week
            </button>
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

      {/* Build button */}
      <div className="mt-6 pb-4">
        <Button className="w-full" size="lg" onClick={buildWeek} disabled={trainingCount === 0}>
          Start this week →
        </Button>
      </div>

      {/* Template picker sheet */}
      {editingDay !== null && (
        <BottomSheet open={true} onClose={() => setEditingDay(null)}>
          <div className="px-1 pb-4">
            <h3 className="font-display text-lg tracking-wide text-text mb-1">{DAY_LABELS[editingDay]}</h3>
            <p className="text-xs text-muted2 mb-4">Pick a session template</p>
            <div className="flex flex-col gap-2">
              {SESSION_TEMPLATES.map((t) => (
                <button
                  key={t.id}
                  onClick={() => applyTemplate(editingDay, t)}
                  className="rounded-[var(--radius-default)] border border-border bg-surface px-4 py-3 text-left hover:border-border-active transition-all"
                >
                  <span className="text-sm font-medium text-text">{t.label}</span>
                  <span className="block text-[10px] text-muted2 mt-0.5">
                    {t.muscles.join(" · ")} · {t.exercises.length} exercises
                  </span>
                  <span className="block text-[10px] text-muted mt-1">
                    {t.exercises.slice(0, 3).join(", ")}{t.exercises.length > 3 ? ` +${t.exercises.length - 3} more` : ""}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </BottomSheet>
      )}

      {/* Exercise picker sheet */}
      {exercisePickerDay !== null && (
        <BottomSheet open={true} onClose={() => setExercisePickerDay(null)}>
          <div className="px-1 pb-4">
            <h3 className="font-display text-lg tracking-wide text-text mb-1">
              Add exercise — {DAY_LABELS[exercisePickerDay]}
            </h3>

            {/* Muscle filter */}
            <div className="flex gap-1 overflow-x-auto mb-3">
              {muscles.map((m) => (
                <button
                  key={m}
                  onClick={() => setMuscleFilter(m)}
                  className={`whitespace-nowrap rounded-full px-2.5 py-1 text-[10px] transition-all ${
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
              className="w-full rounded-lg border border-border bg-bg px-3 py-2 text-sm text-text placeholder:text-muted outline-none focus:border-accent mb-3"
            />

            {/* Exercise list */}
            <div className="flex flex-col gap-1 max-h-[40vh] overflow-y-auto">
              {pickerFiltered.slice(0, 30).map((ex) => (
                <button
                  key={ex.name}
                  onClick={() => addExercise(exercisePickerDay, ex.name)}
                  className="flex items-center justify-between rounded-lg border border-border bg-surface px-3 py-2 text-left hover:border-accent/30 transition-all"
                >
                  <div>
                    <span className="text-xs font-medium text-text">{ex.name}</span>
                    <span className="ml-2 text-[10px] text-muted">{ex.tags.join(", ")}</span>
                  </div>
                  <span className="text-[10px] text-muted2">{ex.muscle}</span>
                </button>
              ))}
              {pickerFiltered.length > 30 && (
                <p className="text-center text-[10px] text-muted py-2">
                  {pickerFiltered.length - 30} more — refine your search
                </p>
              )}
            </div>
          </div>
        </BottomSheet>
      )}
    </div>
  );
}

// ── Assessment Component ──

function SandboxAssessment({ onPass, onBack }: { onPass: () => void; onBack: () => void }) {
  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);
  const [showExplanation, setShowExplanation] = useState(false);
  const [done, setDone] = useState(false);

  const q = ASSESSMENT_QUESTIONS[currentQ];
  const correctCount = Object.entries(answers).filter(
    ([id, idx]) => ASSESSMENT_QUESTIONS.find((q) => q.id === id)?.options[idx]?.correct
  ).length;

  function selectAnswer(idx: number) {
    if (showExplanation) return;
    setSelectedIdx(idx);
    setAnswers((prev) => ({ ...prev, [q.id]: idx }));
    setShowExplanation(true);
  }

  function nextQuestion() {
    setShowExplanation(false);
    setSelectedIdx(null);
    if (currentQ < ASSESSMENT_QUESTIONS.length - 1) {
      setCurrentQ(currentQ + 1);
    } else {
      setDone(true);
    }
  }

  function retry() {
    setCurrentQ(0);
    setAnswers({});
    setSelectedIdx(null);
    setShowExplanation(false);
    setDone(false);
  }

  const passed = correctCount >= PASS_THRESHOLD;

  if (done) {
    return (
      <div className="mx-auto max-w-md px-4 py-12 text-center">
        <button onClick={onBack} className="mb-6 text-xs text-muted2 hover:text-text transition-colors self-start">
          ← Back
        </button>
        <div className={`inline-flex h-16 w-16 items-center justify-center rounded-full text-2xl ${passed ? "bg-green-900/30" : "bg-red-900/30"}`}>
          {passed ? "✓" : "✗"}
        </div>
        <h2 className="mt-4 font-display text-xl tracking-wide text-text">
          {passed ? "You're ready" : "Not quite yet"}
        </h2>
        <p className="mt-2 text-sm text-muted2">
          {passed
            ? `${correctCount}/${ASSESSMENT_QUESTIONS.length} correct. You understand the fundamentals — let's build.`
            : `${correctCount}/${ASSESSMENT_QUESTIONS.length} correct. You need ${PASS_THRESHOLD} to unlock the builder. Review the explanations and try again.`}
        </p>
        <div className="mt-6 flex flex-col gap-3">
          {passed ? (
            <Button size="lg" className="w-full" onClick={onPass}>
              Open the builder →
            </Button>
          ) : (
            <Button size="lg" className="w-full" onClick={retry}>
              Try again
            </Button>
          )}
          <button onClick={onBack} className="text-xs text-muted2 hover:text-text transition-colors">
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-md px-4 py-8">
      <button onClick={onBack} className="text-xs text-muted2 hover:text-text transition-colors">
        ← Back
      </button>
      <h1 className="mt-3 font-display text-xl tracking-wide text-accent">Quick Check</h1>
      <p className="mt-1 text-xs text-muted2">
        Before you design your own week, let&apos;s make sure the fundamentals are solid.
      </p>

      {/* Progress */}
      <div className="mt-4 flex gap-1.5">
        {ASSESSMENT_QUESTIONS.map((_, i) => (
          <div
            key={i}
            className={`h-1 flex-1 rounded-full transition-all ${
              i < currentQ ? "bg-accent" : i === currentQ ? "bg-accent/50" : "bg-border"
            }`}
          />
        ))}
      </div>

      {/* Question */}
      <div className="mt-6 animate-fade-up">
        <p className="text-[10px] tracking-wider text-muted uppercase mb-2">
          Question {currentQ + 1} of {ASSESSMENT_QUESTIONS.length}
        </p>
        <h2 className="text-sm font-medium text-text leading-relaxed">{q.question}</h2>

        <div className="mt-4 flex flex-col gap-2">
          {q.options.map((opt, i) => {
            let style = "border-border bg-surface text-muted2 hover:border-border-active";
            if (showExplanation) {
              if (opt.correct) {
                style = "border-green-500/50 bg-green-900/20 text-green-300";
              } else if (i === selectedIdx && !opt.correct) {
                style = "border-red-500/50 bg-red-900/20 text-red-300";
              } else {
                style = "border-border/50 bg-surface/50 text-muted";
              }
            } else if (i === selectedIdx) {
              style = "border-accent bg-accent-dim text-text";
            }

            return (
              <button
                key={i}
                onClick={() => selectAnswer(i)}
                disabled={showExplanation}
                className={`rounded-[var(--radius-default)] border px-4 py-3 text-left text-xs transition-all ${style}`}
              >
                {opt.label}
              </button>
            );
          })}
        </div>

        {showExplanation && (
          <div className="mt-3 rounded-lg bg-surface2/50 px-3 py-2.5 animate-fade-up">
            <p className="text-xs text-muted2 leading-relaxed">{q.explanation}</p>
            <Button className="mt-3 w-full" onClick={nextQuestion}>
              {currentQ < ASSESSMENT_QUESTIONS.length - 1 ? "Next question" : "See results"}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
