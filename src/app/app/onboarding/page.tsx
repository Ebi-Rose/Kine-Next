"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useKineStore } from "@/store/useKineStore";
import type { Goal, Experience, CycleType, Duration } from "@/store/useKineStore";
import Button from "@/components/Button";
import Tile from "@/components/Tile";
import {
  GOAL_OPTIONS,
  EXP_OPTIONS,
  EXP_DESCRIPTIONS,
  ALL_EQUIPMENT,
  EQUIP_LABELS,
  DURATION_OPTIONS,
  DAY_LABELS,
  CYCLE_OPTIONS,
  INJURY_OPTIONS,
  CONDITION_OPTIONS,
  PROGRAM_MAP,
} from "@/data/constants";
import { evaluateSchedule, evaluateDurationContext } from "@/lib/schedule-eval";

type Step = "welcome" | "name" | "goal" | "experience" | "equipment" | "schedule" | "cycle" | "conditions" | "injuries" | "summary";

const STEP_ORDER: Step[] = [
  "welcome",
  "name",
  "goal",
  "experience",
  "equipment",
  "schedule",
  "cycle",
  "conditions",
  "injuries",
  "summary",
];

export default function OnboardingPage() {
  const [step, setStep] = useState<Step>("welcome");
  const router = useRouter();
  const store = useKineStore();

  const stepIndex = STEP_ORDER.indexOf(step);
  // Steps 1-4 shown as "STEP X OF 4" (goal, experience, equipment, schedule) — name is pre-numbered
  const numberedStep = ["goal", "experience", "equipment", "schedule"].indexOf(step) + 1;

  function next() {
    const nextIdx = stepIndex + 1;
    if (nextIdx < STEP_ORDER.length) {
      setStep(STEP_ORDER[nextIdx]);
    }
  }

  function goToStep(s: Step) {
    setStep(s);
  }

  function finishOnboarding() {
    const today = new Date().toISOString().split("T")[0];
    store.setProgressDB({
      ...store.progressDB,
      programStartDate: today,
      currentWeek: 1,
    });
    router.push("/app");
  }

  return (
    <div className="min-h-screen bg-bg px-6 py-8" style={{ paddingLeft: 'max(24px, env(safe-area-inset-left))', paddingRight: 'max(24px, env(safe-area-inset-right))' }}>
      <div className="mx-auto max-w-[var(--container-max)]">
        {/* Progress dots */}
        {step !== "welcome" && (
          <div className="mb-6 flex justify-center gap-1.5" role="progressbar" aria-label={`Step ${stepIndex} of ${STEP_ORDER.length - 1}`} aria-valuenow={stepIndex} aria-valuemin={1} aria-valuemax={STEP_ORDER.length - 1}>
            {STEP_ORDER.filter(s => s !== "welcome").map((s, i) => (
              <div
                key={s}
                className={`h-1.5 rounded-full transition-all ${
                  STEP_ORDER.indexOf(s) <= stepIndex
                    ? "w-6 bg-accent"
                    : "w-1.5 bg-border"
                }`}
                aria-hidden="true"
              />
            ))}
          </div>
        )}
        {step === "welcome" && <WelcomeStep onNext={next} />}
        {step === "name" && <NameStep onNext={next} />}
        {step === "goal" && <GoalStep onNext={next} numberedStep={numberedStep} />}
        {step === "experience" && <ExperienceStep onNext={next} numberedStep={numberedStep} />}
        {step === "equipment" && <EquipmentStep onNext={next} numberedStep={numberedStep} />}
        {step === "schedule" && (
          <ScheduleStep
            onNext={() => goToStep("cycle")}
            numberedStep={numberedStep}
          />
        )}
        {step === "cycle" && <CycleStep onNext={() => goToStep("conditions")} />}
        {step === "conditions" && <ConditionsStep onNext={() => goToStep("injuries")} />}
        {step === "injuries" && <InjuriesStep onNext={() => goToStep("summary")} />}
        {step === "summary" && <SummaryStep onFinish={finishOnboarding} />}
      </div>
    </div>
  );
}

// ── Step 0: Welcome ──

function WelcomeStep({ onNext }: { onNext: () => void }) {
  return (
    <div className="flex min-h-[80vh] flex-col items-center justify-center text-center">
      <h1 className="max-w-xs text-xl font-medium leading-snug text-text">
        Most programmes weren&apos;t built for your body.
      </h1>
      <p className="mt-4 max-w-xs text-sm leading-relaxed text-muted2">
        Showing up is the hard part. Kinē handles everything else.
      </p>
      <Button className="mt-10" size="lg" onClick={onNext}>
        Build my programme →
      </Button>
    </div>
  );
}

// ── Step 0b: Name ──

function NameStep({ onNext }: { onNext: () => void }) {
  const { personalProfile, setPersonalProfile } = useKineStore();
  const [name, setName] = useState(personalProfile.name);

  function handleContinue() {
    setPersonalProfile({ ...personalProfile, name: name.trim() });
    onNext();
  }

  return (
    <div className="animate-fade-up flex min-h-[80vh] flex-col items-center justify-center text-center">
      <h2 className="font-display text-xl tracking-wide text-text">
        What should we call you?
      </h2>
      <p className="mt-2 text-xs text-muted2">
        First name is fine.
      </p>
      <input
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Your name"
        aria-label="Your name"
        autoFocus
        className="mt-6 w-full max-w-xs rounded-[var(--radius-default)] border border-border bg-surface px-4 py-3 text-center text-sm text-text placeholder:text-muted outline-none focus:border-accent"
      />
      <Button className="mt-6 w-full max-w-xs" size="lg" onClick={handleContinue} disabled={!name.trim()}>
        Continue
      </Button>
    </div>
  );
}

// ── Step 1: Goal ──

function GoalStep({
  onNext,
  numberedStep,
}: {
  onNext: () => void;
  numberedStep: number;
}) {
  const { goal, setGoal } = useKineStore();

  return (
    <div className="animate-fade-up">
      <StepLabel step={numberedStep} />
      <h2 className="font-display tracking-wide text-text" style={{ fontSize: 'clamp(20px, 6vw, 28px)', lineHeight: 1.1 }}>
        What do you want training to give you?
      </h2>
      <p className="mt-2 text-[13px] text-muted2 font-light leading-relaxed">
        No wrong answer — all three build strength and change your body. This shapes the emphasis.
      </p>
      <div className="mt-6 flex flex-col gap-3 stagger-fade-up">
        {GOAL_OPTIONS.map((opt) => (
          <Tile
            key={opt.value}
            selected={goal === opt.value}
            onClick={() => setGoal(opt.value as Goal)}
          >
            <div className="font-medium text-text">{opt.label}</div>
            <div className="mt-1 text-xs text-muted2 font-light leading-relaxed">{opt.description}</div>
          </Tile>
        ))}
      </div>
      <div className="mt-8">
        <Button onClick={onNext} disabled={!goal} className="w-full">
          Continue
        </Button>
      </div>
    </div>
  );
}

// ── Step 2: Experience ──

function ExperienceStep({
  onNext,
  numberedStep,
}: {
  onNext: () => void;
  numberedStep: number;
}) {
  const { goal, exp, setExp } = useKineStore();
  const goalKey = goal || "general";

  return (
    <div className="animate-fade-up">
      <StepLabel step={numberedStep} />
      <h2 className="font-display tracking-wide text-text" style={{ fontSize: 'clamp(20px, 6vw, 28px)', lineHeight: 1.1 }}>
        Where are you right now?
      </h2>
      <div className="mt-6 flex flex-col gap-3 stagger-fade-up">
        {EXP_OPTIONS.map((opt) => (
          <Tile
            key={opt.value}
            selected={exp === opt.value}
            onClick={() => setExp(opt.value as Experience)}
          >
            <div className="font-medium text-text">{opt.label}</div>
            <div className="mt-1 text-xs text-muted2 font-light leading-relaxed">
              {EXP_DESCRIPTIONS[goalKey]?.[opt.value] || ""}
            </div>
          </Tile>
        ))}
      </div>
      <div className="mt-8">
        <Button onClick={onNext} disabled={!exp} className="w-full">
          Continue
        </Button>
      </div>
    </div>
  );
}

// ── Step 3: Equipment ──

function EquipmentStep({
  onNext,
  numberedStep,
}: {
  onNext: () => void;
  numberedStep: number;
}) {
  const { equip, setEquip } = useKineStore();

  // Initialize with all equipment if empty (first visit)
  useEffect(() => {
    if (equip.length === 0) {
      setEquip([...ALL_EQUIPMENT]);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Inverted logic: excluded stores what user DOESN'T have
  const [excluded, setExcluded] = useState<string[]>(() => {
    if (equip.length === 0) return []; // all available
    return ALL_EQUIPMENT.filter((e) => !equip.includes(e));
  });

  function toggleExclude(val: string) {
    let newExcluded: string[];
    if (excluded.includes(val)) {
      newExcluded = excluded.filter((e) => e !== val);
    } else {
      newExcluded = [...excluded, val];
    }
    setExcluded(newExcluded);
    // equip = everything NOT excluded
    setEquip(ALL_EQUIPMENT.filter((e) => !newExcluded.includes(e)));
  }

  return (
    <div className="animate-fade-up">
      <StepLabel step={numberedStep} />
      <h2 className="font-display tracking-wide text-text" style={{ fontSize: 'clamp(20px, 6vw, 28px)', lineHeight: 1.1 }}>
        What equipment do you have?
      </h2>
      <p className="mt-2 text-[13px] text-muted2 font-light leading-relaxed">
        Everything is selected. Tap to remove what you don&apos;t have access to.
      </p>
      <div className="mt-6 grid grid-cols-2 gap-3 stagger-fade-up">
        {ALL_EQUIPMENT.map((val) => (
          <Tile
            key={val}
            selected={!excluded.includes(val)}
            onClick={() => toggleExclude(val)}
          >
            {EQUIP_LABELS[val]}
          </Tile>
        ))}
      </div>
      <div className="mt-8">
        <Button onClick={onNext} disabled={equip.length === 0} className="w-full">
          Continue
        </Button>
      </div>
    </div>
  );
}

// ── Step 4: Schedule ──

function ScheduleStep({
  onNext,
  numberedStep,
}: {
  onNext: () => void;
  numberedStep: number;
}) {
  const { trainingDays, setTrainingDays, setDays, duration, setDuration, goal, exp, equip } =
    useKineStore();

  function toggleDay(dow: number) {
    let newDays: number[];
    if (trainingDays.includes(dow)) {
      newDays = trainingDays.filter((d) => d !== dow);
    } else {
      newDays = [...trainingDays, dow].sort();
    }
    setTrainingDays(newDays);
    setDays(String(newDays.length));
  }

  const canContinue = trainingDays.length > 0 && duration !== null;
  const scheduleFeedback = evaluateSchedule(trainingDays, exp);
  const durationFeedback = evaluateDurationContext(duration, trainingDays, exp, goal, equip);

  return (
    <div className="animate-fade-up">
      <StepLabel step={numberedStep} />
      <h2 className="font-display tracking-wide text-text" style={{ fontSize: 'clamp(20px, 6vw, 28px)', lineHeight: 1.1 }}>
        When can you train?
      </h2>

      <p className="mt-4 text-xs text-muted2 uppercase tracking-wider">
        Training days
      </p>
      <div className="mt-2 flex gap-2">
        {DAY_LABELS.map((label, i) => (
          <button
            key={i}
            onClick={() => toggleDay(i)}
            className={`flex h-10 w-10 items-center justify-center rounded-full text-xs font-medium transition-all ${
              trainingDays.includes(i)
                ? "bg-accent text-bg"
                : "bg-surface2 text-muted2 hover:text-text"
            }`}
          >
            {label.slice(0, 2)}
          </button>
        ))}
      </div>

      {/* Schedule feedback */}
      {scheduleFeedback && (
        <div className={`mt-3 rounded-lg px-3 py-2 text-xs ${
          scheduleFeedback.type === "warning" ? "bg-red-900/20 text-red-300"
          : scheduleFeedback.type === "positive" ? "bg-green-900/20 text-green-300"
          : "bg-surface2 text-muted2"
        }`}>
          {scheduleFeedback.message}
        </div>
      )}

      <p className="mt-6 text-xs text-muted2 uppercase tracking-wider">
        Session length
      </p>
      <div className="mt-2 grid grid-cols-2 gap-3">
        {DURATION_OPTIONS.map((opt) => (
          <Tile
            key={opt.value}
            selected={duration === opt.value}
            onClick={() => setDuration(opt.value as Duration)}
          >
            {opt.label}
          </Tile>
        ))}
      </div>

      {/* Duration feedback */}
      {durationFeedback && (
        <div className={`mt-3 rounded-lg px-3 py-2 text-xs ${
          durationFeedback.type === "warning" ? "bg-red-900/20 text-red-300"
          : "bg-surface2 text-muted2"
        }`}>
          {durationFeedback.message}
        </div>
      )}

      <div className="mt-8">
        <Button onClick={onNext} disabled={!canContinue} className="w-full">
          Continue
        </Button>
      </div>
    </div>
  );
}

// ── Step 5c: Cycle ──

function CycleStep({ onNext }: { onNext: () => void }) {
  const { cycleType, setCycleType, setCycle } = useKineStore();
  const [periodDate, setPeriodDate] = useState("");

  function handleContinue() {
    if (cycleType === "regular" && periodDate) {
      setCycle({
        periodLog: [{ date: periodDate, type: "start" }],
        avgLength: null,
      });
    }
    onNext();
  }

  function skip() {
    setCycleType("na");
    onNext();
  }

  return (
    <div className="animate-fade-up">
      <p className="font-display text-[11px] tracking-[3px] text-accent uppercase mb-2">
        Your cycle
      </p>
      <h2 className="font-display tracking-wide text-text" style={{ fontSize: 'clamp(20px, 6vw, 28px)', lineHeight: 1.1 }}>
        How does your body work across the month?
      </h2>
      <p className="mt-2 text-[13px] text-muted2 font-light leading-relaxed">
        Hormones affect how you recover, how strong you feel, and when to push
        hard. Kinē uses this quietly — it shapes your program, not your identity.
      </p>

      <div className="mt-6 flex flex-col gap-3 stagger-fade-up">
        {CYCLE_OPTIONS.map((opt) => (
          <Tile
            key={opt.value}
            selected={cycleType === opt.value}
            onClick={() => setCycleType(opt.value as CycleType)}
          >
            <div className="font-medium text-text">{opt.label}</div>
            <div className="mt-1 text-xs text-muted2">{opt.description}</div>
          </Tile>
        ))}
      </div>

      {cycleType === "regular" && (
        <div className="mt-4">
          <label htmlFor="period-date" className="text-xs text-muted2">
            When did your last period start?
          </label>
          <input
            id="period-date"
            type="date"
            value={periodDate}
            onChange={(e) => setPeriodDate(e.target.value)}
            className="mt-1 w-full rounded-[var(--radius-default)] border border-border bg-surface px-3 py-2 text-sm text-text outline-none focus:border-accent"
          />
          <p className="mt-1 text-[10px] text-muted">
            Approximate is fine — you can update it any time.
          </p>
        </div>
      )}

      <div className="mt-8 flex flex-col gap-3">
        <Button onClick={handleContinue} disabled={!cycleType} className="w-full">
          Continue
        </Button>
        <button
          onClick={skip}
          className="text-xs text-muted2 hover:text-text transition-colors"
        >
          Skip this step
        </button>
      </div>
    </div>
  );
}

// ── Step 5: Conditions ──

function ConditionsStep({ onNext }: { onNext: () => void }) {
  const { conditions, setConditions } = useKineStore();

  function toggleCondition(val: string) {
    if (conditions.includes(val)) {
      setConditions(conditions.filter((c) => c !== val));
    } else {
      setConditions([...conditions, val]);
    }
  }

  return (
    <div className="animate-fade-up">
      <p className="font-display text-[11px] tracking-[3px] text-accent uppercase mb-2">
        Your body
      </p>
      <h2 className="font-display tracking-wide text-text" style={{ fontSize: 'clamp(20px, 6vw, 28px)', lineHeight: 1.1 }}>
        Anything we should know about?
      </h2>
      <p className="mt-2 text-[13px] text-muted2 font-light leading-relaxed">
        Some conditions change how your body responds to training. Select
        anything relevant — Kinē adapts around it, not through it.
      </p>

      <div className="mt-6 flex flex-col gap-2">
        {CONDITION_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            onClick={() => toggleCondition(opt.value)}
            className={`text-left rounded-[var(--radius-default)] border px-4 py-3 transition-all ${
              conditions.includes(opt.value)
                ? "border-accent bg-accent-dim text-text"
                : "border-border bg-surface text-muted2 hover:border-border-active"
            }`}
          >
            <span className="text-sm font-medium">{opt.label}</span>
            <span className="block text-xs font-light mt-0.5 opacity-70">{opt.description}</span>
          </button>
        ))}
      </div>

      <div className="mt-8 flex flex-col gap-3">
        <Button onClick={onNext} className="w-full">
          Continue
        </Button>
        <button
          onClick={onNext}
          className="text-xs text-muted2 hover:text-text transition-colors"
        >
          Nothing here — skip
        </button>
      </div>
    </div>
  );
}

// ── Step 6: Injuries ──

function InjuriesStep({ onNext }: { onNext: () => void }) {
  const { injuries, setInjuries, injuryNotes, setInjuryNotes } = useKineStore();

  function toggleInjury(val: string) {
    if (injuries.includes(val)) {
      setInjuries(injuries.filter((i) => i !== val));
    } else {
      setInjuries([...injuries, val]);
    }
  }

  return (
    <div className="animate-fade-up">
      <p className="font-display text-[11px] tracking-[3px] text-accent uppercase mb-2">
        Limitations
      </p>
      <h2 className="font-display tracking-wide text-text" style={{ fontSize: 'clamp(20px, 6vw, 28px)', lineHeight: 1.1 }}>
        Anything to work around?
      </h2>
      <p className="mt-2 text-[13px] text-muted2 font-light leading-relaxed">
        Kinē programs around limitations, not through them. Select anything
        relevant — or skip if you&apos;re good to go.
      </p>

      <div className="mt-6 flex flex-wrap gap-2">
        {INJURY_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            onClick={() => toggleInjury(opt.value)}
            className={`rounded-full border px-4 py-2 text-xs transition-all ${
              injuries.includes(opt.value)
                ? "border-accent bg-accent-dim text-text"
                : "border-border bg-surface text-muted2 hover:border-border-active"
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      <div className="mt-4">
        <textarea
          value={injuryNotes}
          onChange={(e) => setInjuryNotes(e.target.value)}
          aria-label="Additional injury notes"
          placeholder="Anything else? E.g. 'recovering from surgery', 'can't do overhead pressing'…"
          rows={3}
          className="w-full rounded-[var(--radius-default)] border border-border bg-surface px-3 py-2 text-sm text-text placeholder:text-muted outline-none focus:border-accent resize-none"
        />
      </div>

      <div className="mt-8 flex flex-col gap-3">
        <Button onClick={onNext} className="w-full">
          Build my program →
        </Button>
        <button
          onClick={onNext}
          className="text-xs text-muted2 hover:text-text transition-colors"
        >
          No limitations — build my program
        </button>
      </div>
    </div>
  );
}

// ── Step 6: Summary ──

function SummaryStep({ onFinish }: { onFinish: () => void }) {
  const store = useKineStore();
  const { goal, exp, equip, trainingDays, duration, injuries, conditions, cycleType, dayDurations, setDayDurations, personalProfile, setPersonalProfile } = store;
  const [showLifts, setShowLifts] = useState(false);
  const [lifts, setLifts] = useState<Record<string, string>>({});
  const [startDate, setStartDate] = useState<"today" | "monday">("today");

  const programName = PROGRAM_MAP[goal || "general"]?.[exp || "new"] || "Custom Program";
  const durationLabel = DURATION_OPTIONS.find((d) => d.value === duration)?.label || duration;

  // Lift assessment fields based on equipment
  const liftFields = getLiftFields(equip, goal);

  function handleFinish() {
    // Save lifts to profile
    if (showLifts && Object.keys(lifts).length > 0) {
      const currentLifts: Record<string, number> = {};
      Object.entries(lifts).forEach(([name, val]) => {
        const num = parseFloat(val);
        if (num > 0) currentLifts[name] = num;
      });
      setPersonalProfile({ ...personalProfile, currentLifts });
    }

    // Set start date
    const today = new Date();
    let startStr: string;
    if (startDate === "monday") {
      const dayOfWeek = today.getDay();
      const daysUntilMonday = dayOfWeek === 0 ? 1 : (8 - dayOfWeek);
      const monday = new Date(today);
      monday.setDate(today.getDate() + daysUntilMonday);
      startStr = monday.toISOString().split("T")[0];
    } else {
      startStr = today.toISOString().split("T")[0];
    }

    store.setProgressDB({
      ...store.progressDB,
      programStartDate: startStr,
      currentWeek: 1,
    });

    onFinish();
  }

  function updateDayDuration(dow: number, mins: number) {
    setDayDurations({ ...dayDurations, [dow]: mins });
  }

  return (
    <div>
      <p className="text-[10px] tracking-[0.3em] text-accent uppercase">Your program</p>
      <h2 className="mt-2 font-display text-2xl tracking-wide text-text">
        Here&apos;s what we&apos;ve built.
      </h2>
      <p className="mt-1 text-xs text-muted2">
        {goal === "strength" ? "Built around progressive strength development." :
         goal === "muscle" ? "Built to develop your body through consistent, intelligent training." :
         "Built to fit your life and keep you coming back."}
        {" "}Adjust anything before you start.
      </p>

      {/* Program card */}
      <div className="mt-6 rounded-[var(--radius-default)] border border-border bg-surface p-5">
        <h3 className="font-display text-xl tracking-wide text-accent">{programName}</h3>

        <div className="mt-4 flex flex-col gap-2 text-xs">
          <div className="flex items-center gap-2 text-muted2">
            <span>📅</span>
            <span>{trainingDays.length} days/week — {trainingDays.map((d) => DAY_LABELS[d]).join(", ")}</span>
          </div>
          <div className="flex items-center gap-2 text-muted2">
            <span>⏱</span>
            <span>{durationLabel}</span>
          </div>
          <div className="flex items-center gap-2 text-muted2">
            <span>↗</span>
            <span>{equip.map((e) => EQUIP_LABELS[e]).join(", ")}</span>
          </div>
          {conditions.length > 0 && (
            <div className="flex items-center gap-2 text-muted2">
              <span>ℹ</span>
              <span>Adapted for {conditions.map(c => CONDITION_OPTIONS.find(o => o.value === c)?.label || c).join(", ")}</span>
            </div>
          )}
          {injuries.length > 0 && (
            <div className="flex items-center gap-2 text-muted2">
              <span>⚠</span>
              <span>Modified for {injuries.map(i => INJURY_OPTIONS.find(o => o.value === i)?.label || i).join(", ")}</span>
            </div>
          )}
          {cycleType && cycleType !== "na" && (
            <div className="flex items-center gap-2 text-muted2">
              <span>◐</span>
              <span>Cycle-aware loading</span>
            </div>
          )}
        </div>
      </div>

      {/* Per-day duration editing */}
      <div className="mt-6">
        <p className="mb-2 text-xs tracking-wider text-muted uppercase">Session durations</p>
        <div className="flex flex-col gap-2">
          {trainingDays.map((dow) => (
            <div key={dow} className="flex items-center justify-between rounded-lg border border-border bg-surface px-3 py-2">
              <span className="text-xs text-text">{DAY_LABELS[dow]}</span>
              <select
                value={dayDurations[dow] || (duration === "short" ? 40 : duration === "medium" ? 50 : duration === "long" ? 75 : 90)}
                onChange={(e) => updateDayDuration(dow, parseInt(e.target.value))}
                className="rounded border border-border bg-bg px-2 py-1 text-xs text-text outline-none"
              >
                <option value={30}>30 min</option>
                <option value={40}>40 min</option>
                <option value={45}>45 min</option>
                <option value={50}>50 min</option>
                <option value={60}>60 min</option>
                <option value={75}>75 min</option>
                <option value={90}>90 min</option>
              </select>
            </div>
          ))}
        </div>
      </div>

      {/* Lift assessment */}
      <div className="mt-6">
        <div className="flex items-center justify-between">
          <p className="text-xs tracking-wider text-muted uppercase">Current lifts · optional</p>
          <button onClick={() => setShowLifts(!showLifts)} className="text-xs text-accent hover:underline">
            {showLifts ? "skip for now" : "add lifts"}
          </button>
        </div>

        {showLifts && (
          <div className="mt-3 flex flex-col gap-2">
            {liftFields.map((field) => (
              <div key={field.name} className="flex items-center justify-between rounded-lg border border-border bg-surface px-3 py-2">
                <span className="text-xs text-text">{field.name}</span>
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    inputMode="decimal"
                    placeholder={field.placeholder}
                    value={lifts[field.name] || ""}
                    onChange={(e) => setLifts({ ...lifts, [field.name]: e.target.value })}
                    className="w-16 rounded border border-border bg-bg px-2 py-1 text-center text-xs text-text outline-none focus:border-accent"
                  />
                  <span className="text-[10px] text-muted">{field.unit}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Start date */}
      <div className="mt-6">
        <p className="mb-2 text-xs tracking-wider text-muted uppercase">When do you want to start?</p>
        <div className="grid grid-cols-2 gap-3">
          <Tile selected={startDate === "today"} onClick={() => setStartDate("today")}>
            <div className="text-center">
              <div className="text-sm font-medium">Today</div>
              <div className="text-[10px] text-muted2">{new Date().toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" })}</div>
            </div>
          </Tile>
          <Tile selected={startDate === "monday"} onClick={() => setStartDate("monday")}>
            <div className="text-center">
              <div className="text-sm font-medium">Next Monday</div>
              <div className="text-[10px] text-muted2">{getNextMonday()}</div>
            </div>
          </Tile>
        </div>
      </div>

      <div className="mt-8">
        <Button onClick={handleFinish} className="w-full" size="lg">
          Start Week 1 →
        </Button>
      </div>
    </div>
  );
}

function getLiftFields(equip: string[], goal: string | null): { name: string; placeholder: string; unit: string }[] {
  if (equip.includes("barbell")) {
    if (goal === "muscle") {
      return [
        { name: "Back Squat", placeholder: "kg", unit: "kg" },
        { name: "Romanian Deadlift", placeholder: "kg", unit: "kg" },
        { name: "Bench Press", placeholder: "kg", unit: "kg" },
      ];
    }
    return [
      { name: "Back Squat", placeholder: "1×5", unit: "kg" },
      { name: "Deadlift", placeholder: "1×5", unit: "kg" },
      { name: "Bench Press", placeholder: "1×5", unit: "kg" },
      { name: "Overhead Press", placeholder: "1×5", unit: "kg" },
    ];
  }
  if (equip.includes("dumbbells")) {
    return [
      { name: "Goblet Squat", placeholder: "kg", unit: "kg" },
      { name: "DB Romanian Deadlift", placeholder: "kg", unit: "kg" },
      { name: "DB Shoulder Press", placeholder: "kg", unit: "kg" },
    ];
  }
  if (equip.includes("machines")) {
    return [
      { name: "Leg Press", placeholder: "kg", unit: "kg" },
      { name: "Lat Pulldown", placeholder: "kg", unit: "kg" },
      { name: "Chest Press", placeholder: "kg", unit: "kg" },
    ];
  }
  return [
    { name: "Pull-Ups", placeholder: "max", unit: "reps" },
    { name: "Push-Ups", placeholder: "max", unit: "reps" },
  ];
}

function getNextMonday(): string {
  const today = new Date();
  const dayOfWeek = today.getDay();
  const daysUntilMonday = dayOfWeek === 0 ? 1 : (8 - dayOfWeek);
  const monday = new Date(today);
  monday.setDate(today.getDate() + daysUntilMonday);
  return monday.toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" });
}

// ── Shared: Step label ──

function StepLabel({ step }: { step: number }) {
  if (step <= 0) return null;
  return (
    <p className="font-display text-[11px] tracking-[3px] text-accent uppercase mb-2">
      Step {step} of 4
    </p>
  );
}
